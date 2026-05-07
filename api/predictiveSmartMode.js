// predictiveSmartMode.js
// FULL REPLACEMENT — ELITE PREDICTIVE SMART MODE V2
// Purpose: live transit + future trigger support, no fake exact, downstream-safe object output

const VERSION = "ELITE_PREDICTIVE_SMART_MODE_V2";

export function predictiveSmartMode(enginePacket) {
  const packet = structuredClone(enginePacket || {});
  const baseTime = parseDate(packet.timestamp) || new Date();

  const timing = packet.timing_evidence || {};
  const decision = packet.timing_decision || {};
  const planets = packet.planets || {};

  const NAK_SIZE = 360 / 27;
  const PADA_SIZE = NAK_SIZE / 4;
  const MAX_HORIZON_MINUTES = 72 * 60;

  const NAKSHATRAS = [
    "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
    "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
    "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
    "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta",
    "Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
  ];

  const SIGNS = [
    "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
    "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
  ];

  function parseDate(v) {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function normalize360(v) {
    let x = Number(v) % 360;
    if (x < 0) x += 360;
    return x;
  }

  function round(v, d = 6) {
    return Number(Number(v || 0).toFixed(d));
  }

  function toISO(d) {
    return new Date(d).toISOString();
  }

  function addMinutes(date, mins) {
    return new Date(date.getTime() + mins * 60000);
  }

  function signToIndex(sign) {
    return SIGNS.indexOf(sign);
  }

  function absoluteLongitude(p) {
    if (!p) return null;
    if (typeof p.longitude === "number") return normalize360(p.longitude);
    const si = signToIndex(p.sign);
    if (si < 0 || typeof p.degree !== "number") return null;
    return normalize360(si * 30 + Number(p.degree));
  }

  function speedDegPerMinute(p, fallbackDailySpeed = 0) {
    if (p && typeof p.speed === "number" && Number.isFinite(p.speed)) {
      return Number(p.speed) / 1440;
    }
    return fallbackDailySpeed / 1440;
  }

  function angularDiff(a, b) {
    const d = Math.abs(normalize360(a) - normalize360(b));
    return d > 180 ? 360 - d : d;
  }

  function signedAspectDelta(p1Lon, p2Lon, targetAngle) {
    const raw = normalize360(p1Lon - p2Lon);
    let delta = raw - targetAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta;
  }

  function getNakData(lon) {
    const x = normalize360(lon);
    const nakIndex = Math.floor(x / NAK_SIZE);
    const offset = x % NAK_SIZE;
    return {
      nakshatra: NAKSHATRAS[nakIndex],
      nak_index: nakIndex,
      pada: Math.floor(offset / PADA_SIZE) + 1,
      offset_in_nak: offset
    };
  }

  function confidenceFromMinutes(mins, strong = 30, medium = 90) {
    if (mins <= strong) return "HIGH";
    if (mins <= medium) return "MEDIUM";
    return "LOW";
  }

  function strengthFromGap(gap, maxGap) {
    return round(Math.max(0, Math.min(1, 1 - gap / maxGap)), 6);
  }

  function buildCandidate({ kind, time, confidence, strength, reason, details = {} }) {
    if (!time) return null;
    const d = parseDate(time);
    if (!d) return null;

    const minsAhead = (d.getTime() - baseTime.getTime()) / 60000;

    if (minsAhead < -3 || minsAhead > MAX_HORIZON_MINUTES) return null;

    return {
      kind,
      predicted_time_utc: toISO(d),
      confidence,
      strength_score: round(strength, 6),
      reason,
      details: {
        ...details,
        minutes_ahead: round(minsAhead, 3),
        horizon: minsAhead <= 30 ? "NOW_30M" : minsAhead <= 1440 ? "NEXT_24H" : "NEXT_72H"
      }
    };
  }

  function candidateRank(c) {
    const conf = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (Number(c?.strength_score || 0) * 10) + (conf[c?.confidence] || 0);
  }

  function dedupe(candidates) {
    const seen = new Set();
    const out = [];

    for (const c of candidates.filter(Boolean)) {
      const fp = [
        c.kind,
        c.predicted_time_utc,
        c.details?.pair || "",
        c.details?.next_event || "",
        c.details?.target_angle ?? "",
        c.details?.nearest_degree_lock ?? ""
      ].join("|");

      if (!seen.has(fp)) {
        seen.add(fp);
        out.push(c);
      }
    }

    return out;
  }

  function pickBest(candidates) {
    const clean = dedupe(candidates);
    if (!clean.length) return null;

    return clean.sort((a, b) => {
      const r = candidateRank(b) - candidateRank(a);
      if (r !== 0) return r;
      return new Date(a.predicted_time_utc) - new Date(b.predicted_time_utc);
    })[0];
  }

  function buildExactCandidateFromCurrent() {
    const exact =
      decision.exact_time_candidate_utc ||
      timing.exact_time_candidate_utc ||
      timing.time_window?.start_utc ||
      null;

    if (!exact) return null;

    return buildCandidate({
      kind: "existing_live_exact_trigger",
      time: exact,
      confidence: "HIGH",
      strength: 0.99,
      reason: "Existing live exact/minute candidate preserved",
      details: {
        source: "timing_decision_or_timing_evidence",
        dominant_trigger_identity: timing.dominant_trigger_identity || null
      }
    });
  }

  function moonDegreePredict() {
    const moon = planets.moon;
    const lon = absoluteLongitude(moon);
    if (lon == null) return null;

    const speed = Math.abs(speedDegPerMinute(moon, 13.2));
    if (speed <= 0) return null;

    const degreeInSign = lon % 30;
    const nextDegree = Math.ceil(degreeInSign);
    const targetDegree = nextDegree >= 30 ? 0 : nextDegree;
    const gap = nextDegree >= 30 ? 30 - degreeInSign : nextDegree - degreeInSign;

    if (gap <= 0.0001) return null;

    const mins = gap / speed;

    return buildCandidate({
      kind: "moon_degree_lock_future",
      time: addMinutes(baseTime, mins),
      confidence: confidenceFromMinutes(mins, 20, 75),
      strength: mins <= 20 ? 0.9 : mins <= 75 ? 0.72 : 0.55,
      reason: "Moon approaching next exact degree lock",
      details: {
        current_degree_in_sign: round(degreeInSign, 6),
        nearest_degree_lock: targetDegree,
        gap_degrees: round(gap, 6)
      }
    });
  }

  function moonPadaNakshatraPredict() {
    const moon = planets.moon;
    const lon = absoluteLongitude(moon);
    if (lon == null) return [];

    const speed = Math.abs(speedDegPerMinute(moon, 13.2));
    if (speed <= 0) return [];

    const nak = getNakData(lon);
    const gapPada = PADA_SIZE - (nak.offset_in_nak % PADA_SIZE);
    const gapNak = NAK_SIZE - nak.offset_in_nak;

    const minsPada = gapPada / speed;
    const minsNak = gapNak / speed;

    const nextNakLon = normalize360(lon + gapNak);
    const nextNak = getNakData(nextNakLon);

    return [
      buildCandidate({
        kind: "moon_pada_boundary_future",
        time: addMinutes(baseTime, minsPada),
        confidence: confidenceFromMinutes(minsPada, 30, 120),
        strength: minsPada <= 30 ? 0.86 : minsPada <= 120 ? 0.7 : 0.52,
        reason: "Moon approaching pada boundary",
        details: {
          current_nakshatra: nak.nakshatra,
          current_pada: nak.pada,
          next_event: "pada_change",
          gap_degrees: round(gapPada, 6)
        }
      }),
      buildCandidate({
        kind: "moon_nakshatra_boundary_future",
        time: addMinutes(baseTime, minsNak),
        confidence: confidenceFromMinutes(minsNak, 45, 180),
        strength: minsNak <= 45 ? 0.88 : minsNak <= 180 ? 0.72 : 0.54,
        reason: "Moon approaching nakshatra boundary",
        details: {
          current_nakshatra: nak.nakshatra,
          next_nakshatra: nextNak.nakshatra,
          next_event: "nakshatra_change",
          gap_degrees: round(gapNak, 6)
        }
      })
    ].filter(Boolean);
  }

  function aspectApproach({ p1Name, p2Name, targetAngle, aspectName }) {
    const p1 = planets[p1Name.toLowerCase()];
    const p2 = planets[p2Name.toLowerCase()];
    const p1Lon = absoluteLongitude(p1);
    const p2Lon = absoluteLongitude(p2);

    if (p1Lon == null || p2Lon == null) return null;

    const p1Speed = speedDegPerMinute(p1, defaultDailySpeed(p1Name));
    const p2Speed = speedDegPerMinute(p2, defaultDailySpeed(p2Name));

    const nowDelta = signedAspectDelta(p1Lon, p2Lon, targetAngle);
    const futureDelta = signedAspectDelta(
      normalize360(p1Lon + p1Speed),
      normalize360(p2Lon + p2Speed),
      targetAngle
    );

    const approaching = Math.abs(futureDelta) < Math.abs(nowDelta);
    if (!approaching) return null;

    const relativeSpeed = Math.abs(p1Speed - p2Speed);
    if (relativeSpeed <= 0) return null;

    const gap = Math.abs(nowDelta);
    if (gap > 8) return null;

    const mins = gap / relativeSpeed;

    return buildCandidate({
      kind: "aspect_approach_timing",
      time: addMinutes(baseTime, mins),
      confidence: gap <= 0.5 ? "HIGH" : gap <= 1.5 ? "MEDIUM" : "LOW",
      strength: gap <= 0.5 ? 0.9 : gap <= 1.5 ? 0.72 : 0.5,
      reason: `${p1Name}-${p2Name} approaching ${aspectName}`,
      details: {
        pair: `${p1Name}-${p2Name}`,
        aspect: aspectName,
        target_angle: targetAngle,
        current_angle_diff: round(angularDiff(p1Lon, p2Lon), 6),
        aspect_gap: round(gap, 6),
        estimated_minutes: round(mins, 3),
        applying: true
      }
    });
  }

  function defaultDailySpeed(name) {
    const map = {
      Sun: 1,
      Moon: 13.2,
      Mercury: 1.2,
      Venus: 1.1,
      Mars: 0.5,
      Jupiter: 0.08,
      Saturn: 0.03,
      Rahu: -0.03,
      Ketu: -0.03
    };
    return map[name] ?? 0;
  }

  const existingExact =
    decision.mode === "exact_candidate" ||
    timing.precision_allowed === "minute_candidate" ||
    packet?.smart_mode?.mode === "EXACT_LOCK";

  const currentExactCandidate = existingExact ? buildExactCandidateFromCurrent() : null;

  const candidates = [
    currentExactCandidate,
    moonDegreePredict(),
    ...moonPadaNakshatraPredict(),

    aspectApproach({ p1Name: "Moon", p2Name: "Mars", targetAngle: 90, aspectName: "square" }),
    aspectApproach({ p1Name: "Moon", p2Name: "Mercury", targetAngle: 0, aspectName: "conjunction" }),
    aspectApproach({ p1Name: "Moon", p2Name: "Rahu", targetAngle: 0, aspectName: "conjunction" }),
    aspectApproach({ p1Name: "Mercury", p2Name: "Rahu", targetAngle: 0, aspectName: "conjunction" }),
    aspectApproach({ p1Name: "Mars", p2Name: "Rahu", targetAngle: 0, aspectName: "conjunction" }),
    aspectApproach({ p1Name: "Sun", p2Name: "Saturn", targetAngle: 0, aspectName: "conjunction" }),
    aspectApproach({ p1Name: "Venus", p2Name: "Jupiter", targetAngle: 120, aspectName: "trine" })
  ].filter(Boolean);

  const best = pickBest(candidates);

  let mode = "NO_PREDICTIVE_UNLOCK";
  let reason = "No future trigger candidate strong enough";
  let smartTimeOutput = null;

  if (currentExactCandidate) {
    mode = "BYPASS_EXISTING_EXACT";
    reason = "Existing live exact trigger preserved as primary";
    smartTimeOutput = currentExactCandidate.predicted_time_utc;
  } else if (best) {
    if (best.confidence === "HIGH") {
      mode = "PREDICTIVE_EXACT_CANDIDATE";
      reason = "Strong future trigger candidate projected";
      smartTimeOutput = best.predicted_time_utc;
    } else if (best.confidence === "MEDIUM") {
      mode = "PREDICTIVE_REFINED_WINDOW";
      reason = "Moderate future trigger candidate projected";
      const peak = parseDate(best.predicted_time_utc);
      smartTimeOutput = {
        start_utc: toISO(addMinutes(peak, -7)),
        end_utc: toISO(addMinutes(peak, 7))
      };
    } else {
      mode = "PREDICTIVE_WIDE_WINDOW";
      reason = "Weak but usable future trigger candidate projected";
      const peak = parseDate(best.predicted_time_utc);
      smartTimeOutput = {
        start_utc: toISO(addMinutes(peak, -15)),
        end_utc: toISO(addMinutes(peak, 15))
      };
    }
  }

  packet.predictive_smart_mode = {
    version: VERSION,
    activated: true,
    mode,
    reason,
    best_future_candidate: best || currentExactCandidate || null,
    smart_time_output: smartTimeOutput,
    candidate_pool: dedupe(candidates),
    predictive_status:
      best || currentExactCandidate ? "TRIGGER_CANDIDATE_AVAILABLE" : "NO_CLEAN_TRIGGER",
    predictive_priority:
      currentExactCandidate ? "SECONDARY_TO_PRESENT_EXACT" : "PRIMARY_FUTURE_SUPPORT",
    safeguards: {
      existing_exact_preserved: Boolean(currentExactCandidate),
      separating_aspects_rejected: true,
      real_planet_speed_used_when_available: true,
      max_horizon_minutes: MAX_HORIZON_MINUTES,
      downstream_best_future_candidate_is_object: true
    }
  };

  return packet;
}