import { predictiveSmartMode } from "./predictiveSmartMode.js";

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

    // ✅ FIXED VARIABLE
    const timeWindow = exactTimeCandidate
      ? {
          start_utc: transit?.micro_dominant_trigger?.cluster_start_utc || null,
          end_utc: transit?.micro_dominant_trigger?.cluster_end_utc || null
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
            mahadasha: transit?.dasha?.mahadasha || null,
            antardasha: transit?.dasha?.antardasha || null
          }
        : {
            status: dashaStatus,
            required_input: transit?.dasha?.required_input || null
          };

    const divisionalSummary =
      divisionalStatus === "active"
        ? {
            status: "active",
            available_charts: Object.keys(transit.divisional || {})
          }
        : {
            status: divisionalStatus,
            required_input: transit?.divisional?.required_input || null
          };
let confidenceScore = 30;
const confidenceReasons = [];

// integrity
if (transit?.integrity?.status === "CLEAN") {
  confidenceScore += 5;
  confidenceReasons.push("clean integrity");
}

// freshness
if (transit?.freshness?.status === "LIVE") {
  confidenceScore += 5;
  confidenceReasons.push("live freshness");
}

// trigger
if (triggerPresent) {
  confidenceScore += 25;
  confidenceReasons.push("micro trigger active");
} else {
  confidenceReasons.push("no active trigger");
}

// convergence
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

// multi snapshot density
if (activeTriggerSnapshots >= 5) {
  confidenceScore += 10;
  confidenceReasons.push("multi snapshot strong");
}

// dasha
if (dashaStatus === "active") {
  confidenceScore += 10;
  confidenceReasons.push("dasha active");
}

// divisional
if (divisionalStatus === "active") {
  confidenceScore += 10;
  confidenceReasons.push("divisional active");
}

// strength
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

// timing mode boost
if (timingMode === "exact_candidate") {
  confidenceScore += 10;
  confidenceReasons.push("exact timing unlocked");
}

// cap
if (confidenceScore > 95) confidenceScore = 95;
if (confidenceScore < 0) confidenceScore = 0;

// level
let confidenceLevel = "LOW";
if (confidenceScore >= 75) confidenceLevel = "HIGH";
else if (confidenceScore >= 60) confidenceLevel = "MEDIUM";
    const baseOutput = {
      endpoint_called: "oracle.js",
      timestamp: new Date().toISOString(),

      authority: transit?.authority || null,
      freshness: transit?.freshness || null,
      integrity: transit?.integrity || null,

      planets,
      aspects_summary: transit?.aspects || [],
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
        time_window: timeWindow // ✅ FIX APPLIED
      },

      timing_decision: {
        mode: timingMode,
        exact_time_candidate_utc: exactTimeCandidate,
        exact_date_candidate_utc: exactDateCandidate,
        time_window_start_utc: timeWindow.start_utc,
        time_window_end_utc: timeWindow.end_utc
      },

      confidence: {
  confidence_score: confidenceScore,
  confidence_level: confidenceLevel,
  confidence_reasons: confidenceReasons
},

      engine_status: "ORACLE_BASE_PACKET_v1"
    };

    const finalOutput = predictiveSmartMode(baseOutput);

    finalOutput.engine_status = "SMART_ORACLE_FINAL_v1";

    return res.status(200).json(finalOutput);

  } catch (error) {
    return res.status(500).json({
      endpoint_called: "oracle.js",
      status: "oracle_failed",
      error: error.message || "unknown_error"
    });
  }
}