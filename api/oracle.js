import { predictiveSmartMode } from "./predictiveSmartMode.js";

// ==============================
// PHASE 1 ADDITION:
// FULL TRIGGER SCAN HELPERS
// ==============================

function toTimestamp(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function cloneTriggerCandidate(candidate, source, bucket) {
  if (!candidate || typeof candidate !== "object") return null;
  return {
    ...candidate,
    source,
    bucket
  };
}

function bucketByTimeDiffHours(hoursAhead) {
  if (hoursAhead === null || hoursAhead === undefined) return "discarded_weak_triggers";
  if (hoursAhead <= 0.5) return "current_active_triggers";
  if (hoursAhead <= 24) return "next_24h_triggers";
  if (hoursAhead <= 72) return "next_72h_triggers";
  return "discarded_weak_triggers";
}

function pushRankedTrigger(triggers, candidate, source, hoursAhead = null) {
  if (!candidate) return;

  const strength = Number(candidate.strength_score || 0);
  let bucket = bucketByTimeDiffHours(hoursAhead);

  // Strength override logic
  if (strength >= 0.8 && bucket === "next_24h_triggers") {
    bucket = "current_active_triggers";
  } else if (strength >= 0.6 && bucket === "next_72h_triggers") {
    bucket = "next_24h_triggers";
  } else if (strength < 0.35) {
    bucket = "discarded_weak_triggers";
  }

  triggers[bucket].push(cloneTriggerCandidate(candidate, source, bucket));
}

function buildLiveCurrentTrigger(snapshot) {
  const timing = snapshot?.timing_evidence || {};
  if (!timing?.trigger_present || !timing?.dominant_trigger_identity) return null;

  return {
    kind: "live_current_trigger",
    predicted_time_utc: timing?.exact_time_candidate_utc || snapshot?.timestamp || null,
    confidence: "HIGH",
    strength_score: 0.95,
    reason: `Current dominant trigger already live: ${timing.dominant_trigger_identity}`,
    details: {
      dominant_trigger_identity: timing.dominant_trigger_identity,
      timing_grade: timing.timing_grade || null,
      timing_source: timing.timing_source || null
    }
  };
}

function fullTriggerScan(snapshot) {
  const triggers = {
    current_active_triggers: [],
    next_24h_triggers: [],
    next_72h_triggers: [],
    dominant_trigger: null,
    secondary_trigger: null,
    discarded_weak_triggers: []
  };

  const modules = snapshot?.predictive_smart_mode?.modules || {};
  const predictive = snapshot?.predictive_smart_mode || {};
  const scanBaseTs =
    toTimestamp(snapshot?.timestamp) ||
    toTimestamp(snapshot?.freshness?.generated_at) ||
    Date.now();

  // 1) If current live trigger exists, always include it
  const liveCurrent = buildLiveCurrentTrigger(snapshot);
  if (liveCurrent) {
    triggers.current_active_triggers.push(
      cloneTriggerCandidate(liveCurrent, "timing_evidence", "current_active_triggers")
    );
  }

  // 2) Best future candidate from predictive mode
  if (predictive?.best_future_candidate?.predicted_time_utc) {
    const ts = toTimestamp(predictive.best_future_candidate.predicted_time_utc);
    const hoursAhead = ts !== null ? (ts - scanBaseTs) / 3600000 : null;
    pushRankedTrigger(
      triggers,
      predictive.best_future_candidate,
      "predictive_smart_mode.best_future_candidate",
      hoursAhead
    );
  }

  // 3) Aspect approach timing candidates
  if (modules.aspect_approach_timing) {
    Object.entries(modules.aspect_approach_timing).forEach(([key, mod]) => {
      if (mod?.candidate?.predicted_time_utc) {
        const ts = toTimestamp(mod.candidate.predicted_time_utc);
        const hoursAhead = ts !== null ? (ts - scanBaseTs) / 3600000 : null;
        pushRankedTrigger(
          triggers,
          {
            ...mod.candidate,
            details: {
              ...(mod.candidate.details || {}),
              module_key: key
            }
          },
          `aspect_approach_timing.${key}`,
          hoursAhead
        );
      }
    });
  }

  // 4) Nakshatra / pada boundary triggers
  if (Array.isArray(modules.nakshatra_boundary_trigger?.candidates)) {
    modules.nakshatra_boundary_trigger.candidates.forEach((candidate, idx) => {
      const ts = toTimestamp(candidate?.predicted_time_utc);
      const hoursAhead = ts !== null ? (ts - scanBaseTs) / 3600000 : null;
      pushRankedTrigger(
        triggers,
        {
          ...candidate,
          details: {
            ...(candidate.details || {}),
            candidate_index: idx
          }
        },
        "nakshatra_boundary_trigger",
        hoursAhead
      );
    });
  }

  // 5) Multi-snapshot predictive merge
  if (modules.multi_snapshot_predictive_merge?.candidate?.predicted_time_utc) {
    const candidate = modules.multi_snapshot_predictive_merge.candidate;
    const ts = toTimestamp(candidate.predicted_time_utc);
    const hoursAhead = ts !== null ? (ts - scanBaseTs) / 3600000 : null;
    pushRankedTrigger(
      triggers,
      candidate,
      "multi_snapshot_predictive_merge",
      hoursAhead
    );
  }

  // 6) Sort all buckets by strength desc, then nearest time
  const sortFn = (a, b) => {
    const strengthDiff = Number(b?.strength_score || 0) - Number(a?.strength_score || 0);
    if (strengthDiff !== 0) return strengthDiff;

    const ta = toTimestamp(a?.predicted_time_utc);
    const tb = toTimestamp(b?.predicted_time_utc);

    if (ta === null && tb === null) return 0;
    if (ta === null) return 1;
    if (tb === null) return -1;
    return ta - tb;
  };

  triggers.current_active_triggers.sort(sortFn);
  triggers.next_24h_triggers.sort(sortFn);
  triggers.next_72h_triggers.sort(sortFn);
  triggers.discarded_weak_triggers.sort(sortFn);

  const allStrong = [
    ...triggers.current_active_triggers,
    ...triggers.next_24h_triggers,
    ...triggers.next_72h_triggers
  ].sort(sortFn);

  triggers.dominant_trigger = allStrong[0] || null;
  triggers.secondary_trigger = allStrong[1] || null;

  return triggers;
}

function buildThreeDayPhaseMap(data) {
  const scan = data?.trigger_scan || {};
  const timing = data?.timing_evidence || {};

  const day1Primary =
    scan?.current_active_triggers?.[0] ||
    scan?.next_24h_triggers?.[0] ||
    scan?.dominant_trigger ||
    null;

  const day2Primary =
    scan?.next_24h_triggers?.[1] ||
    scan?.next_72h_triggers?.[0] ||
    scan?.secondary_trigger ||
    null;

  const day3Primary =
    scan?.next_72h_triggers?.[1] ||
    scan?.next_72h_triggers?.[0] ||
    null;

  return {
    day_1: {
      phase: timing?.trigger_present ? "activation_or_live_peak" : "immediate_build_or_first_gate",
      primary_trigger: day1Primary || null
    },
    day_2: {
      phase: "secondary_shift_or_followup",
      primary_trigger: day2Primary || null
    },
    day_3: {
      phase: "continuation_turn_or_manifestation_fade",
      primary_trigger: day3Primary || null
    }
  };
}

// ==============================
// EXISTING FUNCTIONS
// ==============================

function buildEventInterpretation(data) {
  const aspects = Array.isArray(data?.aspects_summary) ? data.aspects_summary : [];
  const timing = data?.timing_evidence || {};
  const predictive = data?.predictive_smart_mode || {};
  const dasha = data?.dasha || {};
  const divisional = data?.divisional || {};
  const triggerScan = data?.trigger_scan || {};

  let pastPattern =
    "Pattern suggests a similar karmic cycle or event-family was activated before under a related trigger structure.";

  let presentManifestation =
    "Background phase with no dominant lived event fully breaking through.";
  let futureEventNature = "No strong future event nature isolated yet.";
  let futureChannel = "general";
  let futureTone = "neutral";

  const dominantTrigger =
    timing?.dominant_trigger_identity ||
    triggerScan?.dominant_trigger?.details?.dominant_trigger_identity ||
    triggerScan?.dominant_trigger?.kind ||
    null;

  const hasRahuMercury = aspects.some(
    (a) =>
      (a.planet1 === "Mercury" && a.planet2 === "Rahu") ||
      (a.planet1 === "Rahu" && a.planet2 === "Mercury")
  );

  const hasMoonMars = aspects.some(
    (a) =>
      (a.planet1 === "Moon" && a.planet2 === "Mars") ||
      (a.planet1 === "Mars" && a.planet2 === "Moon")
  );

  const hasSunSaturn = aspects.some(
    (a) =>
      (a.planet1 === "Sun" && a.planet2 === "Saturn") ||
      (a.planet1 === "Saturn" && a.planet2 === "Sun")
  );

  const hasVenusJupiter = aspects.some(
    (a) =>
      (a.planet1 === "Venus" && a.planet2 === "Jupiter") ||
      (a.planet1 === "Jupiter" && a.planet2 === "Venus")
  );

  // ==============================
  // PHASE 2:
  // DOMINANT TRIGGER HARD OVERRIDE
  // ==============================
  if (
  dominantTrigger === "moon_nakshatra_entry" ||
  dominantTrigger === "moon_degree_lock"
)
    presentManifestation =
      "A fresh emotional field, contact-opening atmosphere, movement in feeling, or immediate life-shift gate is active now.";
    futureEventNature =
      "A new lived phase is opening through contact, emotional shift, movement, response, or a fresh unfolding event tied to the present lunar entry.";
    futureChannel = "emotion / opening / movement / contact";
    futureTone = "fresh / immediate / responsive";
    pastPattern =
      "A similar lunar opening likely marked the beginning of a noticeable emotional, contact-based, or movement-linked phase before.";
  } else if (dominantTrigger === "moon_mars_square") {
    presentManifestation =
      "Emotional heat, confrontation pressure, reactive movement, or sharp inner agitation is active now.";
    futureEventNature =
      "A sharp emotional, conflict-driven, or sudden reaction event is likely to peak through pressure, argument, urgency, or impulsive movement.";
    futureChannel = "emotion / confrontation / sudden action";
    futureTone = "conflict / heat / impulsive";
    pastPattern =
      "A similar cycle likely brought heat, irritation, emotional reaction, conflict, or pressure-led movement before.";
  } else if (dominantTrigger === "rahu_mercury_conjunction") {
    presentManifestation =
      "Hidden communication, mixed signals, paperwork distortion, or clever negotiation pressure is active now.";
    futureEventNature =
      "A message, proposal, deal, contact, or decision-linked communication is likely to peak with a hidden twist, layered meaning, or manipulative undertone.";
    futureChannel = "communication / deal / paperwork";
    futureTone = "confusion / manipulation / clever offer";
    pastPattern =
      "A similar cycle likely brought confusing communication, hidden motives, misleading talk, paperwork stress, or a deal that looked clearer than it really was.";
  } else if (dominantTrigger === "sun_saturn_conjunction") {
    presentManifestation =
      "Authority pressure, burden, responsibility, delay, or recognition under weight is active now.";
    futureEventNature =
      "A duty-linked, authority-linked, or pressure-driven event is likely to crystallise through responsibility, formal contact, delay, or public weight.";
    futureChannel = "authority / structure / responsibility";
    futureTone = "pressure / duty / delay";
    pastPattern =
      "A similar cycle likely brought duty, delay, formal pressure, burden, or authority-linked heaviness before.";
  }

  // ==============================
  // FALLBACK ONLY IF NO DOMINANT LOCK
  // ==============================
  else {
    if (hasRahuMercury) {
      presentManifestation =
        "Hidden communication, mixed signals, clever negotiation, paperwork distortion, or deal-confusion environment is active.";
      futureEventNature =
        "A message, proposal, contact, or decision-linked communication is likely to emerge with a hidden twist, trap, or layered meaning.";
      futureChannel = "communication / deal / paperwork";
      futureTone = "confusion / manipulation / clever offer";
      pastPattern =
        "A similar cycle likely brought confusing communication, hidden motives, misleading talk, paperwork stress, or a deal that looked clearer than it really was.";
    }

    if (hasMoonMars) {
      presentManifestation =
        "Emotional heat, reactive pressure, conflict-proneness, or fast-moving agitation is active in lived reality.";
      if (futureEventNature === "No strong future event nature isolated yet.") {
        futureEventNature =
          "A sharp emotional exchange, argument, impulsive move, or pressure-driven reaction may form next.";
        futureChannel = "emotion / conflict / movement";
        futureTone = "heat / impulsive / sharp";
      }
    }

    if (hasSunSaturn) {
      presentManifestation =
        "Authority pressure, burden, responsibility, delay, or recognition under weight is active now.";
      if (futureEventNature === "No strong future event nature isolated yet.") {
        futureEventNature =
          "A duty-linked decision, authority interaction, pressure event, or formal burden may crystallise next.";
        futureChannel = "authority / duty / public pressure";
        futureTone = "pressure / delay / responsibility";
      }
    }

    if (hasVenusJupiter) {
      if (futureEventNature === "No strong future event nature isolated yet.") {
        futureEventNature =
          "A support window, alliance, help, blessing, easing, or graceful opening may emerge.";
        futureChannel = "support / alliance / opportunity";
        futureTone = "supportive / opening / blessing";
      }
    }
  }

  // ==============================
  // PRESENT TRIGGER / FUTURE TRIGGER APPEND
  // ==============================
  if (timing.trigger_present === true && dominantTrigger) {
    futureEventNature =
      `${futureEventNature} Present trigger is already live through ${dominantTrigger}.`;
  }

  if (
    timing.trigger_present === false &&
    predictive?.best_future_candidate?.predicted_time_utc
  ) {
    futureEventNature =
      "A future trigger is forming and is likely to produce a real-world event once the projected trigger matures.";
    futureChannel =
      predictive?.best_future_candidate?.details?.pair ||
      predictive?.best_future_candidate?.kind ||
      futureChannel;
    futureTone =
      predictive?.best_future_candidate?.reason ||
      "future trigger building";
  }

  if (dasha?.status === "active" && divisional?.status === "active") {
    pastPattern =
      `${pastPattern} Natal timing permission is open, so past repetition logic is stronger and more trustworthy.`;
  }

  return {
    past_pattern: pastPattern,
    present_manifestation: presentManifestation,
    future_event_nature: futureEventNature,
    future_channel: futureChannel,
    future_tone: futureTone,
    interpretation_source: dominantTrigger ? "dominant_trigger_lock" : "aspect_fallback"
  };
}

function buildConfidenceEnhanced(baseConfidence, data) {
  const timing = data?.timing_evidence || {};
  const predictive = data?.predictive_smart_mode || {};

  let confidenceClass = "MODERATE";
  let confidenceWarning = null;

  if (
    timing.trigger_present === true &&
    timing.convergence_strength === "high" &&
    timing.exact_time_candidate_utc
  ) {
    confidenceClass = "TIMING_STRONG_EVENT_STRONG";
  } else if (predictive?.best_future_candidate?.predicted_time_utc) {
    confidenceClass = "PREDICTIVE_STRONG";
    confidenceWarning = "No present trigger; future-based projection is active.";
  } else if (
    timing.trigger_present === false &&
    timing.convergence_strength === "low"
  ) {
    confidenceClass = "LOW_CONVERGENCE";
    confidenceWarning = "Present timing support is weak.";
  }

  return {
    ...baseConfidence,
    confidence_class: confidenceClass,
    confidence_warning: confidenceWarning
  };
}

function buildOracleVerdict(data) {
  const timing = data?.timing_evidence || {};
  const decision = data?.timing_decision || {};
  const predictive = data?.predictive_smart_mode || {};

  if (timing.trigger_present === true && decision?.exact_time_candidate_utc) {
    return {
      outcome: "EXACT",
      event_state: "ACTIVE_TRIGGER",
      best_actionable_time_utc: decision.exact_time_candidate_utc,
      best_actionable_mode: "PRESENT_TRIGGER"
    };
  }

  if (predictive?.best_future_candidate?.predicted_time_utc) {
    return {
      outcome: "PREDICTIVE",
      event_state: "FUTURE_TRIGGER",
      best_actionable_time_utc: predictive.best_future_candidate.predicted_time_utc,
      best_actionable_mode: "PREDICTIVE"
    };
  }

  return {
    outcome: "WINDOW",
    event_state: "LOW_ACTIVITY",
    best_actionable_time_utc: null,
    best_actionable_mode: "WAIT"
  };
}

export default async function handler(req, res) {
  try {
    const baseUrl = "https://live-transit-engine.vercel.app";
    const birthDateTime = req.query?.birth_datetime || null;

    const transitUrl = birthDateTime
      ? `${baseUrl}/api/transit?birth_datetime=${encodeURIComponent(birthDateTime)}`
      : `${baseUrl}/api/transit`;

    const multiSnapshotUrl = birthDateTime
      ? `${baseUrl}/api/multi-snapshot?birth_datetime=${encodeURIComponent(birthDateTime)}`
      : `${baseUrl}/api/multi-snapshot`;

    const [transitRes, multiRes] = await Promise.all([
      fetch(transitUrl),
      fetch(multiSnapshotUrl)
    ]);

    if (!transitRes.ok) {
      throw new Error(`transit_fetch_failed_${transitRes.status}`);
    }

    if (!multiRes.ok) {
      throw new Error(`multi_snapshot_fetch_failed_${multiRes.status}`);
    }

    const transit = await transitRes.json();
    const multi = await multiRes.json();

    const triggerPresent =
      transit?.micro_status?.trigger_present === true ||
      (multi?.active_trigger_snapshots || 0) > 0;

    const precisionAllowed =
      transit?.micro_status?.precision_allowed ||
      (triggerPresent ? "minute_candidate" : "window_only");

    const dominantTriggerIdentity =
      transit?.micro_dominant_trigger?.type ||
      multi?.dominant_trigger_identity ||
      null;

    const exactTimeCandidate =
      transit?.micro_dominant_trigger?.peak_time_utc ||
      multi?.micro_dominant_trigger?.peak_time_utc ||
      null;

    const convergenceStrength =
      multi?.convergence_strength ||
      transit?.micro_convergence?.convergence_strength ||
      "low";

    const clusterDensity =
      multi?.cluster_density ||
      transit?.micro_convergence?.cluster_density ||
      0;

    const activeTriggerSnapshots =
      multi?.active_trigger_snapshots || 0;

    const dashaStatus = transit?.dasha?.status || "absent";
    const divisionalStatus = transit?.divisional?.status || "absent";

    let timingMode = "window_only";
    if (precisionAllowed === "minute_candidate" && exactTimeCandidate) {
      timingMode = "exact_candidate";
    }

    const exactDateCandidate = exactTimeCandidate
      ? exactTimeCandidate.split("T")[0]
      : null;

    const timeWindow = exactTimeCandidate
      ? {
          start_utc:
            transit?.micro_dominant_trigger?.cluster_start_utc || null,
          end_utc:
            transit?.micro_dominant_trigger?.cluster_end_utc || null
        }
      : {
          start_utc: null,
          end_utc: null
        };

    const planets = {
      sun: transit?.sun || null,
      moon: transit?.moon || null,
      mercury: transit?.mercury || null,
      venus: transit?.venus || null,
      mars: transit?.mars || null,
      jupiter: transit?.jupiter || null,
      saturn: transit?.saturn || null,
      rahu: transit?.rahu || null,
      ketu: transit?.ketu || null
    };

    const kpSummary = transit?.kp_cusps
      ? {
          "1": transit.kp_cusps["1"] || null,
          "2": transit.kp_cusps["2"] || null,
          "4": transit.kp_cusps["4"] || null,
          "5": transit.kp_cusps["5"] || null,
          "6": transit.kp_cusps["6"] || null,
          "7": transit.kp_cusps["7"] || null,
          "8": transit.kp_cusps["8"] || null,
          "9": transit.kp_cusps["9"] || null,
          "10": transit.kp_cusps["10"] || null,
          "11": transit.kp_cusps["11"] || null,
          "12": transit.kp_cusps["12"] || null
        }
      : null;

    const dashaSummary =
      dashaStatus === "active"
        ? {
            status: "active",
            birth_reference: transit?.dasha?.birth_reference || null,
            mahadasha: transit?.dasha?.mahadasha || null,
            antardasha: transit?.dasha?.antardasha || null,
            pratyantar: transit?.dasha?.pratyantar || null,
            natal_timing_permission: "OPEN"
          }
        : {
            status: dashaStatus,
            required_input: transit?.dasha?.required_input || null,
            format: transit?.dasha?.format || null,
            natal_timing_permission: "CLOSED"
          };

    const divisionalSummary =
      divisionalStatus === "active"
        ? {
            status: "active",
            birth_datetime_utc: transit?.divisional?.birth_datetime_utc || null,
            available_charts: Object.keys(transit.divisional || {}).filter(
              (k) => !["status", "birth_datetime_utc"].includes(k)
            ),
            divisional_reinforcement_grade: "STRONG"
          }
        : {
            status: divisionalStatus,
            required_input: transit?.divisional?.required_input || null,
            supported: transit?.divisional?.supported || null,
            divisional_reinforcement_grade: "WEAK_OR_ABSENT"
          };

    let confidenceScore = 30;
    const confidenceReasons = [];

    if (transit?.integrity?.status === "CLEAN") {
      confidenceScore += 5;
      confidenceReasons.push("clean integrity");
    }

    if (transit?.freshness?.status === "LIVE") {
      confidenceScore += 5;
      confidenceReasons.push("live freshness");
    }

    if (triggerPresent) {
      confidenceScore += 25;
      confidenceReasons.push("micro trigger active");
    } else {
      confidenceReasons.push("no active trigger");
    }

    if (convergenceStrength === "high" || Number(convergenceStrength) >= 0.75) {
      confidenceScore += 25;
      confidenceReasons.push("high convergence");
    } else if (
      convergenceStrength === "medium" ||
      Number(convergenceStrength) >= 0.4
    ) {
      confidenceScore += 15;
      confidenceReasons.push("medium convergence");
    } else {
      confidenceReasons.push("low convergence");
    }

    if (activeTriggerSnapshots >= 5) {
      confidenceScore += 10;
      confidenceReasons.push("multi snapshot strong");
    }

    if (dashaStatus === "active") {
      confidenceScore += 10;
      confidenceReasons.push("dasha active");
    }

    if (divisionalStatus === "active") {
      confidenceScore += 10;
      confidenceReasons.push("divisional active");
    }

    if (transit?.strength) {
      const values = Object.values(transit.strength);
      if (values.length > 0) {
        const avgStrength =
          values.reduce((sum, val) => sum + Number(val || 0), 0) / values.length;

        if (avgStrength >= 0.65) {
          confidenceScore += 10;
          confidenceReasons.push("strong planetary strength");
        } else if (avgStrength >= 0.5) {
          confidenceScore += 5;
          confidenceReasons.push("moderate planetary strength");
        }
      }
    }

    if (timingMode === "exact_candidate") {
      confidenceScore += 10;
      confidenceReasons.push("exact timing unlocked");
    }

    if (confidenceScore > 95) confidenceScore = 95;
    if (confidenceScore < 0) confidenceScore = 0;

    let confidenceLevel = "LOW";
    if (confidenceScore >= 75) confidenceLevel = "HIGH";
    else if (confidenceScore >= 60) confidenceLevel = "MEDIUM";

    const baseOutput = {
      endpoint_called: "oracle.js",
      timestamp: new Date().toISOString(),

      authority: transit?.authority || null,
      freshness: transit?.freshness || null,
      integrity: transit?.integrity || null,
      location_used: transit?.location_used || null,

      panchanga: transit?.panchanga || null,
      ascendant: transit?.ascendant || null,
      houses: transit?.houses || null,
      kp_cusps: kpSummary,

      planets,
      aspects_summary: Array.isArray(transit?.aspects)
        ? transit.aspects.slice(0, 20)
        : [],
      strength: transit?.strength || null,

      dasha: dashaSummary,
      divisional: divisionalSummary,

      timing_evidence: {
        trigger_present: triggerPresent,
        precision_allowed: precisionAllowed,
        dominant_trigger_identity: dominantTriggerIdentity,
        exact_time_candidate_utc: exactTimeCandidate,
        exact_date_candidate_utc: exactDateCandidate,
        convergence_strength: convergenceStrength,
        cluster_density: clusterDensity,
        active_trigger_snapshots: activeTriggerSnapshots,
        time_window: timeWindow,
        timing_grade:
          triggerPresent && exactTimeCandidate
            ? "EXACT_LOCK"
            : "WINDOW_OR_PREDICTIVE",
        timing_source:
          triggerPresent && exactTimeCandidate
            ? "present_trigger"
            : "future_or_window"
      },

      timing_decision: {
        mode: timingMode,
        exact_time_candidate_utc: exactTimeCandidate,
        exact_date_candidate_utc: exactDateCandidate,
        time_window_start_utc: timeWindow.start_utc,
        time_window_end_utc: timeWindow.end_utc,
        reason:
          timingMode === "exact_candidate"
            ? "minute candidate supported by trigger and convergence"
            : "exact minute not fully unlocked; defended window mode active"
      },

      confidence: {
        confidence_score: confidenceScore,
        confidence_level: confidenceLevel,
        confidence_reasons: confidenceReasons
      },

      engine_status: "ORACLE_BASE_PACKET_v1"
    };

    const finalOutput = predictiveSmartMode(baseOutput);

    // ==============================
    // PHASE 1 ADDITION:
    // FULL TRIGGER MAP
    // ==============================
    const fullScan = fullTriggerScan(finalOutput);
    finalOutput.trigger_scan = fullScan;
    finalOutput.three_day_phase_map = buildThreeDayPhaseMap({
      ...finalOutput,
      trigger_scan: fullScan
    });

    finalOutput.event_interpretation = buildEventInterpretation(finalOutput);
    finalOutput.confidence = buildConfidenceEnhanced(
      finalOutput.confidence,
      finalOutput
    );
    finalOutput.oracle_verdict = buildOracleVerdict(finalOutput);

    if (finalOutput?.predictive_smart_mode) {
      finalOutput.predictive_smart_mode.predictive_status =
        finalOutput.predictive_smart_mode?.best_future_candidate
          ? "FUTURE_TRIGGER_LIVE"
          : "BYPASS_OR_INACTIVE";

      finalOutput.predictive_smart_mode.predictive_priority =
        finalOutput.timing_evidence?.trigger_present === true
          ? "SECONDARY_TO_PRESENT_EXACT"
          : "PRIMARY_FUTURE_SUPPORT";
    }

    finalOutput.engine_status = "SMART_ORACLE_PREMIUM_v3";
    finalOutput.oracle_mode = "all_domain_ecosystem_packet";

    return res.status(200).json(finalOutput);
  } catch (error) {
    return res.status(500).json({
      endpoint_called: "oracle.js",
      status: "oracle_failed",
      error: error.message || "unknown_oracle_error"
    });
  }
}