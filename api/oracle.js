export default async function handler(req, res) {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "live-transit-engine.vercel.app";
    const baseUrl = `${protocol}://${host}`;

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

    const topLevelMicro =
      transit?.micro_status ||
      null;

    const topLevelDominant =
      transit?.micro_dominant_trigger ||
      null;

    const multiDominant =
      multi?.dominant_trigger_identity ||
      multi?.micro_dominant_trigger?.type ||
      null;

    const multiPeakTime =
      multi?.micro_dominant_trigger?.peak_time_utc ||
      null;

    const convergenceStrength =
      multi?.convergence_strength ||
      (typeof multi?.micro_convergence?.convergence_strength !== "undefined"
        ? multi.micro_convergence.convergence_strength
        : "unknown");

    const clusterDensity =
      multi?.cluster_density ||
      multi?.micro_convergence?.cluster_density ||
      0;

    const activeTriggerSnapshots =
      multi?.active_trigger_snapshots ||
      0;

    const triggerPresent =
      typeof topLevelMicro?.trigger_present === "boolean"
        ? topLevelMicro.trigger_present
        : activeTriggerSnapshots > 0;

    const precisionAllowed =
      topLevelMicro?.precision_allowed ||
      (triggerPresent ? "minute_candidate" : "window_only");

    const exactTimeCandidate =
      topLevelDominant?.peak_time_utc ||
      multiPeakTime ||
      null;

    const timingMode =
      precisionAllowed === "minute_candidate" && exactTimeCandidate
        ? "exact_candidate"
        : precisionAllowed === "window_only"
        ? "window_only"
        : "unknown";

    const exactDateCandidate =
      exactTimeCandidate ? exactTimeCandidate.split("T")[0] : null;

    const timeWindow = exactTimeCandidate
      ? {
          start_utc: topLevelDominant?.cluster_start_utc || null,
          end_utc: topLevelDominant?.cluster_end_utc || null
        }
      : {
          start_utc: null,
          end_utc: null
        };

    const dashaStatus = transit?.dasha?.status || "absent";
    const divisionalStatus = transit?.divisional?.status || "absent";

    const planets = {
      sun: transit?.sun
        ? {
            sign: transit.sun.sign,
            degree: transit.sun.degree,
            nakshatra: transit.sun.nakshatra,
            nakshatra_lord: transit.sun.nakshatra_lord,
            pada: transit.sun.pada,
            dignity: transit.sun.dignity,
            combust: transit.sun.combust,
            retrograde: transit.sun.retrograde
          }
        : null,
      moon: transit?.moon
        ? {
            sign: transit.moon.sign,
            degree: transit.moon.degree,
            nakshatra: transit.moon.nakshatra,
            nakshatra_lord: transit.moon.nakshatra_lord,
            pada: transit.moon.pada,
            dignity: transit.moon.dignity,
            combust: transit.moon.combust,
            retrograde: transit.moon.retrograde
          }
        : null,
      mercury: transit?.mercury
        ? {
            sign: transit.mercury.sign,
            degree: transit.mercury.degree,
            nakshatra: transit.mercury.nakshatra,
            nakshatra_lord: transit.mercury.nakshatra_lord,
            pada: transit.mercury.pada,
            dignity: transit.mercury.dignity,
            combust: transit.mercury.combust,
            retrograde: transit.mercury.retrograde
          }
        : null,
      venus: transit?.venus
        ? {
            sign: transit.venus.sign,
            degree: transit.venus.degree,
            nakshatra: transit.venus.nakshatra,
            nakshatra_lord: transit.venus.nakshatra_lord,
            pada: transit.venus.pada,
            dignity: transit.venus.dignity,
            combust: transit.venus.combust,
            retrograde: transit.venus.retrograde
          }
        : null,
      mars: transit?.mars
        ? {
            sign: transit.mars.sign,
            degree: transit.mars.degree,
            nakshatra: transit.mars.nakshatra,
            nakshatra_lord: transit.mars.nakshatra_lord,
            pada: transit.mars.pada,
            dignity: transit.mars.dignity,
            combust: transit.mars.combust,
            retrograde: transit.mars.retrograde
          }
        : null,
      jupiter: transit?.jupiter
        ? {
            sign: transit.jupiter.sign,
            degree: transit.jupiter.degree,
            nakshatra: transit.jupiter.nakshatra,
            nakshatra_lord: transit.jupiter.nakshatra_lord,
            pada: transit.jupiter.pada,
            dignity: transit.jupiter.dignity,
            combust: transit.jupiter.combust,
            retrograde: transit.jupiter.retrograde
          }
        : null,
      saturn: transit?.saturn
        ? {
            sign: transit.saturn.sign,
            degree: transit.saturn.degree,
            nakshatra: transit.saturn.nakshatra,
            nakshatra_lord: transit.saturn.nakshatra_lord,
            pada: transit.saturn.pada,
            dignity: transit.saturn.dignity,
            combust: transit.saturn.combust,
            retrograde: transit.saturn.retrograde
          }
        : null,
      rahu: transit?.rahu
        ? {
            sign: transit.rahu.sign,
            degree: transit.rahu.degree,
            nakshatra: transit.rahu.nakshatra,
            nakshatra_lord: transit.rahu.nakshatra_lord,
            pada: transit.rahu.pada,
            dignity: transit.rahu.dignity,
            combust: transit.rahu.combust,
            retrograde: transit.rahu.retrograde
          }
        : null,
      ketu: transit?.ketu
        ? {
            sign: transit.ketu.sign,
            degree: transit.ketu.degree,
            nakshatra: transit.ketu.nakshatra,
            nakshatra_lord: transit.ketu.nakshatra_lord,
            pada: transit.ketu.pada,
            dignity: transit.ketu.dignity,
            combust: transit.ketu.combust,
            retrograde: transit.ketu.retrograde
          }
        : null
    };

    const aspectsSummary = Array.isArray(transit?.aspects)
      ? transit.aspects.slice(0, 20)
      : [];

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

    const divisionalSummary =
      transit?.divisional?.status === "active"
        ? {
            status: "active",
            available: Object.keys(transit.divisional).filter(
              (k) => k !== "status" && k !== "birth_datetime_utc"
            ),
            birth_datetime_utc: transit.divisional.birth_datetime_utc || null
          }
        : {
            status: transit?.divisional?.status || "absent",
            supported: transit?.divisional?.supported || ["D9", "D10"]
          };

    const dashaSummary =
      transit?.dasha?.status === "active"
        ? {
            status: "active",
            mahadasha: transit.dasha.mahadasha || null,
            antardasha: transit.dasha.antardasha || null,
            pratyantar: transit.dasha.pratyantar || null
          }
        : {
            status: transit?.dasha?.status || "absent",
            required_input: transit?.dasha?.required_input || null
          };

    let confidenceScore = 50;
    const confidenceReasons = [];

    if (triggerPresent) {
      confidenceScore += 15;
      confidenceReasons.push("micro trigger active");
    } else {
      confidenceReasons.push("micro trigger absent");
    }

    if (convergenceStrength === "high" || Number(convergenceStrength) >= 0.75) {
      confidenceScore += 20;
      confidenceReasons.push("high multi-snapshot convergence");
    } else if (convergenceStrength === "medium" || Number(convergenceStrength) >= 0.4) {
      confidenceScore += 10;
      confidenceReasons.push("moderate multi-snapshot convergence");
    } else {
      confidenceReasons.push("low multi-snapshot convergence");
    }

    if (dashaStatus === "active") {
      confidenceScore += 10;
      confidenceReasons.push("dasha context active");
    } else {
      confidenceReasons.push("dasha absent");
    }

    if (divisionalStatus === "active") {
      confidenceScore += 10;
      confidenceReasons.push("divisional reinforcement active");
    } else {
      confidenceReasons.push("divisional reinforcement absent");
    }

    if (transit?.integrity?.status === "CLEAN") {
      confidenceScore += 5;
      confidenceReasons.push("clean integrity");
    }

    if (transit?.freshness?.status === "LIVE") {
      confidenceScore += 5;
      confidenceReasons.push("live freshness");
    }

    if (confidenceScore > 95) confidenceScore = 95;
    if (confidenceScore < 0) confidenceScore = 0;

    let confidenceLevel = "LOW";
    if (confidenceScore >= 75) confidenceLevel = "HIGH";
    else if (confidenceScore >= 60) confidenceLevel = "MEDIUM";

    const confidence = {
      confidence_score: confidenceScore,
      confidence_level: confidenceLevel,
      confidence_reasons: confidenceReasons
    };

    const output = {
      endpoint_called: "oracle.js",
      timestamp: new Date().toISOString(),

      authority: transit?.authority || {
        source: "Swiss Ephemeris",
        zodiac: "sidereal",
        ayanamsa: "lahiri",
        node_mode: "true_node"
      },

      freshness: transit?.freshness || {
        generated_at: null,
        age_seconds: null,
        status: "UNKNOWN"
      },

      integrity: transit?.integrity || {
        status: "UNKNOWN",
        issues: []
      },

      location_used: transit?.location_used || {
        latitude: null,
        longitude: null
      },

      panchanga: transit?.panchanga || null,
      ascendant: transit?.ascendant || null,
      houses: transit?.houses || null,
      kp_cusps: kpSummary,
      planets: planets,
      aspects_summary: aspectsSummary,
      strength: transit?.strength || null,

      dasha: dashaSummary,
      divisional: divisionalSummary,

      timing_evidence: {
        micro_status: {
          trigger_present: triggerPresent,
          precision_allowed: precisionAllowed
        },
        dominant_trigger_identity: multiDominant || topLevelDominant?.type || null,
        exact_time_candidate_utc: exactTimeCandidate,
        exact_date_candidate_utc: exactDateCandidate,
        time_window: timeWindow,
        convergence_strength: convergenceStrength,
        cluster_density: clusterDensity,
        active_trigger_snapshots: activeTriggerSnapshots
      },

      timing_decision: {
        mode: timingMode,
        exact_time_candidate_utc: exactTimeCandidate,
        exact_date_candidate_utc: exactDateCandidate,
        time_window_start_utc: timeWindow.start_utc,
        time_window_end_utc: timeWindow.end_utc,
        reason:
          timingMode === "exact_candidate"
            ? "multi-snapshot convergence and dominant micro trigger support minute candidate"
            : "exact minute not fully opened; use defended window mode"
      },

      confidence: confidence,

      engine_status: "oracle_all_domain_packet_v1"
    };

    return res.status(200).json(output);
  } catch (error) {
    return res.status(500).json({
      endpoint_called: "oracle.js",
      status: "oracle_failed",
      error: error.message || "unknown_oracle_error"
    });
  }
}