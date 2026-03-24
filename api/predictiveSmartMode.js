export function predictiveSmartMode(enginePacket) {
  const packet = structuredClone(enginePacket || {});
  const timestamp = packet?.timestamp ? new Date(packet.timestamp) : new Date();

  const timing = packet?.timing_evidence || {};
  const decision = packet?.timing_decision || {};
  const planets = packet?.planets || {};
  const moon = planets?.moon || null;
  const mars = planets?.mars || null;
  const mercury = planets?.mercury || null;
  const rahu = planets?.rahu || null;

  const NAK_SIZE = 13.333333333333334;
  const PADA_SIZE = 3.3333333333333335;

  const NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
  ];

  function normalize360(v) {
    let x = Number(v) % 360;
    if (x < 0) x += 360;
    return x;
  }

  function round(v, d = 6) {
    return Number(Number(v).toFixed(d));
  }

  function diff360(a, b) {
    const d = Math.abs(normalize360(a) - normalize360(b));
    return d > 180 ? 360 - d : d;
  }

  function signToIndex(sign) {
    const signs = [
      "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
      "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];
    return signs.indexOf(sign);
  }

  function absoluteLongitude(planetObj) {
    if (!planetObj) return null;
    if (typeof planetObj.longitude === "number") return normalize360(planetObj.longitude);
    const si = signToIndex(planetObj.sign);
    if (si === -1 || typeof planetObj.degree !== "number") return null;
    return normalize360(si * 30 + Number(planetObj.degree));
  }

  function getMoonSpeedDegPerMinute() {
    return 0.5 / 60;
  }

  function getMercurySpeedDegPerMinute() {
    return 1.2 / 1440;
  }

  function getMarsSpeedDegPerMinute() {
    return 0.5 / 1440;
  }

  function getRahuSpeedDegPerMinute() {
    return 0.03 / 1440;
  }

  function buildNakshatraData(absLongitude) {
    const lon = normalize360(absLongitude);
    const nakIndex = Math.floor(lon / NAK_SIZE);
    const offsetInNak = lon % NAK_SIZE;
    const pada = Math.floor(offsetInNak / PADA_SIZE) + 1;
    return {
      nakshatra: NAKSHATRAS[nakIndex],
      nakIndex,
      pada,
      offsetInNak
    };
  }

  function toISO(dateObj) {
    return new Date(dateObj).toISOString();
  }

  function addMinutes(dateObj, mins) {
    return new Date(dateObj.getTime() + mins * 60000);
  }

  function buildCandidate({
    kind,
    predictedTime,
    confidence,
    strength,
    reason,
    details
  }) {
    return {
      kind,
      predicted_time_utc: toISO(predictedTime),
      confidence,
      strength_score: round(strength, 6),
      reason,
      details: details || {}
    };
  }

  function pickBestCandidate(candidates) {
    if (!Array.isArray(candidates) || !candidates.length) return null;
    return [...candidates].sort((a, b) => {
      if (b.strength_score !== a.strength_score) return b.strength_score - a.strength_score;
      const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      if ((rank[b.confidence] || 0) !== (rank[a.confidence] || 0)) {
        return (rank[b.confidence] || 0) - (rank[a.confidence] || 0);
      }
      return new Date(a.predicted_time_utc) - new Date(b.predicted_time_utc);
    })[0];
  }

  function multiSnapshotPredictiveMerge(baseTime, moonAbsLon) {
    const moonSpeed = getMoonSpeedDegPerMinute();

    // 3 forward probes
    const probes = [10, 20, 30].map((mins) => {
      const projectedMoon = normalize360(moonAbsLon + moonSpeed * mins);
      const projectedDegree = projectedMoon % 30;
      const nearestInteger = Math.round(projectedDegree);
      const gap = Math.abs(projectedDegree - nearestInteger);

      return {
        minute_offset: mins,
        projected_time_utc: toISO(addMinutes(baseTime, mins)),
        projected_moon_longitude: round(projectedMoon, 6),
        projected_degree_in_sign: round(projectedDegree, 6),
        nearest_degree_lock: nearestInteger,
        degree_gap: round(gap, 6),
        strength_score: round(Math.max(0, 1 - gap / 0.25), 6)
      };
    });

    const best = [...probes].sort((a, b) => a.degree_gap - b.degree_gap)[0];

    if (!best || best.degree_gap > 0.25) {
      return {
        activated: true,
        snapshot_count: 3,
        mode: "NO_FUTURE_CLUSTER",
        best_probe: best || null,
        candidate: null
      };
    }

    const confidence =
      best.degree_gap <= 0.05 ? "HIGH" :
      best.degree_gap <= 0.12 ? "MEDIUM" : "LOW";

    const candidate = buildCandidate({
      kind: "multi_snapshot_predictive_merge",
      predictedTime: new Date(best.projected_time_utc),
      confidence,
      strength: best.strength_score,
      reason: "3 forward probes found nearest future moon degree cluster",
      details: {
        snapshot_count: 3,
        nearest_degree_lock: best.nearest_degree_lock,
        degree_gap: best.degree_gap
      }
    });

    return {
      activated: true,
      snapshot_count: 3,
      mode: "FUTURE_CLUSTER_FOUND",
      best_probe: best,
      candidate
    };
  }

  function nakshatraBoundaryPredict(baseTime, moonAbsLon) {
    const moonSpeed = getMoonSpeedDegPerMinute();
    const nak = buildNakshatraData(moonAbsLon);

    const distanceToNextPada = PADA_SIZE - (nak.offsetInNak % PADA_SIZE);
    const minutesToNextPada = distanceToNextPada / moonSpeed;

    const distanceToNextNak = NAK_SIZE - nak.offsetInNak;
    const minutesToNextNak = distanceToNextNak / moonSpeed;

    const nextPadaTime = addMinutes(baseTime, minutesToNextPada);
    const nextNakTime = addMinutes(baseTime, minutesToNextNak);

    const nextNakLongitude = normalize360(moonAbsLon + moonSpeed * minutesToNextNak);
    const nextNakData = buildNakshatraData(nextNakLongitude);

    const padaCandidate = buildCandidate({
      kind: "moon_pada_boundary",
      predictedTime: nextPadaTime,
      confidence: minutesToNextPada <= 20 ? "HIGH" : minutesToNextPada <= 45 ? "MEDIUM" : "LOW",
      strength: minutesToNextPada <= 20 ? 0.84 : minutesToNextPada <= 45 ? 0.68 : 0.52,
      reason: "future moon pada change detected",
      details: {
        current_nakshatra: nak.nakshatra,
        current_pada: nak.pada,
        next_event: "pada_change"
      }
    });

    const nakCandidate = buildCandidate({
      kind: "moon_nakshatra_boundary",
      predictedTime: nextNakTime,
      confidence: minutesToNextNak <= 30 ? "HIGH" : minutesToNextNak <= 75 ? "MEDIUM" : "LOW",
      strength: minutesToNextNak <= 30 ? 0.88 : minutesToNextNak <= 75 ? 0.7 : 0.55,
      reason: "future moon nakshatra change detected",
      details: {
        current_nakshatra: nak.nakshatra,
        next_nakshatra: nextNakData.nakshatra,
        next_event: "nakshatra_change"
      }
    });

    return {
      activated: true,
      current: {
        nakshatra: nak.nakshatra,
        pada: nak.pada
      },
      candidates: [padaCandidate, nakCandidate]
    };
  }

  function aspectApproachTiming(baseTime, p1Abs, p2Abs, p1SpeedPerMin, p2SpeedPerMin, label, targetAngle) {
    if (p1Abs == null || p2Abs == null) return null;

    const relativeSpeed = Math.abs(p1SpeedPerMin - p2SpeedPerMin);
    if (relativeSpeed <= 0) {
      return {
        activated: true,
        pair: label,
        mode: "STATIC",
        candidate: null
      };
    }

    const currentDiff = diff360(p1Abs, p2Abs);
    const gap = Math.abs(currentDiff - targetAngle);
    const minutesToHit = gap / relativeSpeed;
    const predictedTime = addMinutes(baseTime, minutesToHit);

    const confidence =
      gap <= 0.5 ? "HIGH" :
      gap <= 1.2 ? "MEDIUM" : "LOW";

    const strength =
      gap <= 0.5 ? 0.86 :
      gap <= 1.2 ? 0.68 : 0.5;

    const candidate = buildCandidate({
      kind: "aspect_approach_timing",
      predictedTime,
      confidence,
      strength,
      reason: `${label} approaching ${targetAngle}° aspect zone`,
      details: {
        pair: label,
        current_angle_diff: round(currentDiff, 6),
        target_angle: targetAngle,
        aspect_gap: round(gap, 6),
        estimated_minutes: round(minutesToHit, 3)
      }
    });

    return {
      activated: true,
      pair: label,
      mode: "APPROACH",
      candidate
    };
  }

  // hard guard: existing exact stays exact
  if (
    decision?.mode === "exact_candidate" ||
    packet?.smart_mode?.mode === "EXACT_LOCK" ||
    packet?.timing_evidence?.precision_allowed === "minute_candidate"
  ) {
    packet.predictive_smart_mode = {
      activated: true,
      mode: "BYPASS_EXISTING_EXACT",
      reason: "existing exact or minute candidate already present",
      best_future_candidate: decision?.exact_time || packet?.timing_evidence?.peakTime || null,
      modules: {
        multi_snapshot_predictive_merge: null,
        nakshatra_boundary_trigger: null,
        aspect_approach_timing: null
      }
    };
    return packet;
  }

  const moonAbs = absoluteLongitude(moon);
  const marsAbs = absoluteLongitude(mars);
  const mercuryAbs = absoluteLongitude(mercury);
  const rahuAbs = absoluteLongitude(rahu);

  const multiSnapshotModule = moonAbs != null
    ? multiSnapshotPredictiveMerge(timestamp, moonAbs)
    : {
        activated: true,
        mode: "UNAVAILABLE",
        best_probe: null,
        candidate: null
      };

  const nakshatraBoundaryModule = moonAbs != null
    ? nakshatraBoundaryPredict(timestamp, moonAbs)
    : {
        activated: true,
        current: null,
        candidates: []
      };

  const marsMoonModule = aspectApproachTiming(
    timestamp,
    marsAbs,
    moonAbs,
    getMarsSpeedDegPerMinute(),
    getMoonSpeedDegPerMinute(),
    "Mars-Moon",
    90
  );

  const rahuMercuryModule = aspectApproachTiming(
    timestamp,
    rahuAbs,
    mercuryAbs,
    getRahuSpeedDegPerMinute(),
    getMercurySpeedDegPerMinute(),
    "Rahu-Mercury",
    0
  );

  const candidatePool = [
    multiSnapshotModule?.candidate || null,
    ...(nakshatraBoundaryModule?.candidates || []),
    marsMoonModule?.candidate || null,
    rahuMercuryModule?.candidate || null
  ].filter(Boolean);

  const best = pickBestCandidate(candidatePool);

  let finalMode = "NO_PREDICTIVE_UNLOCK";
  let finalReason = "no future trigger candidate strong enough";
  let smartTimeOutput = null;

  if (best) {
    if (best.confidence === "HIGH") {
      finalMode = "PREDICTIVE_EXACT_CANDIDATE";
      finalReason = "strong future trigger candidate projected";
      smartTimeOutput = best.predicted_time_utc;
    } else if (best.confidence === "MEDIUM") {
      finalMode = "PREDICTIVE_REFINED_WINDOW";
      finalReason = "moderate future trigger candidate projected";
      const peak = new Date(best.predicted_time_utc);
      smartTimeOutput = {
        start_utc: toISO(addMinutes(peak, -5)),
        end_utc: toISO(addMinutes(peak, 5))
      };
    } else {
      finalMode = "PREDICTIVE_WIDE_WINDOW";
      finalReason = "weak but usable future timing candidate projected";
      const peak = new Date(best.predicted_time_utc);
      smartTimeOutput = {
        start_utc: toISO(addMinutes(peak, -12)),
        end_utc: toISO(addMinutes(peak, 12))
      };
    }
  }

  packet.predictive_smart_mode = {
    activated: true,
    mode: finalMode,
    reason: finalReason,
    best_future_candidate: best,
    smart_time_output: smartTimeOutput,
    modules: {
      multi_snapshot_predictive_merge: multiSnapshotModule,
      nakshatra_boundary_trigger: nakshatraBoundaryModule,
      aspect_approach_timing: {
        mars_moon: marsMoonModule,
        rahu_mercury: rahuMercuryModule
      }
    }
  };

  return packet;
}