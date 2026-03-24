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

    if (!transitRes.ok) throw new Error("transit_fetch_failed");
    if (!multiRes.ok) throw new Error("multi_snapshot_fetch_failed");

    const transit = await transitRes.json();
    const multi = await multiRes.json();

    // ===============================
    // CORE EXTRACTION
    // ===============================

    const micro = transit?.micro_status || {};
    const dominant = transit?.micro_dominant_trigger || {};

    const multiDominant =
      multi?.dominant_trigger_identity ||
      multi?.micro_dominant_trigger?.type ||
      null;

    const peakTime =
      dominant?.peak_time_utc ||
      multi?.micro_dominant_trigger?.peak_time_utc ||
      null;

    const convergence =
      multi?.convergence_strength ||
      "low";

    const clusterDensity =
      multi?.cluster_density || 0;

    const triggerSnapshots =
      multi?.active_trigger_snapshots || 0;

    const triggerPresent =
      micro?.trigger_present === true ||
      triggerSnapshots > 0;

    const precisionAllowed =
      micro?.precision_allowed ||
      (triggerPresent ? "minute_candidate" : "window_only");

    const timingMode =
      precisionAllowed === "minute_candidate" && peakTime
        ? "exact_candidate"
        : "window_only";

    // ===============================
    // SMART MODE ENGINE
    // ===============================

    function applySmartMode() {

      let smart = {
        activated: true,
        mode: timingMode,
        smart_reason: null,
        smart_time_output: null
      };

      const dashaActive = transit?.dasha?.status === "active";
      const divisionalActive = transit?.divisional?.status === "active";

      // EXACT
      if (triggerPresent && peakTime && convergence === "high") {
        smart.mode = "EXACT_LOCK";
        smart.smart_time_output = peakTime;
        smart.smart_reason = "full trigger + convergence";
        return smart;
      }

      // REFINED WINDOW
      if (triggerPresent && (convergence === "medium" || convergence === "high")) {

        if (peakTime) {
          const p = new Date(peakTime);
          smart.mode = "REFINED_WINDOW";
          smart.smart_time_output = {
            start: new Date(p.getTime() - 5 * 60000).toISOString(),
            end: new Date(p.getTime() + 5 * 60000).toISOString()
          };
          smart.smart_reason = "±5 min refinement";
        }

        return smart;
      }

      // NATAL FALLBACK
      if (!triggerPresent && (dashaActive || divisionalActive)) {
        smart.mode = "NATAL_FALLBACK";
        smart.smart_time_output = "use natal timing layer";
        smart.smart_reason = "micro weak, natal strong";
        return smart;
      }

      // DENIAL
      smart.mode = "NO_TIMING_UNLOCK";
      smart.smart_reason = "no trigger + no convergence";
      return smart;
    }

    const smartMode = applySmartMode();

    // ===============================
    // CONFIDENCE
    // ===============================

    let score = 50;

    if (triggerPresent) score += 15;
    if (convergence === "high") score += 20;
    if (transit?.dasha?.status === "active") score += 10;
    if (transit?.divisional?.status === "active") score += 10;
    if (transit?.integrity?.status === "CLEAN") score += 5;
    if (transit?.freshness?.status === "LIVE") score += 5;

    if (score > 95) score = 95;

    const confidence = {
      score,
      level: score >= 75 ? "HIGH" : score >= 60 ? "MEDIUM" : "LOW"
    };

    // ===============================
    // FINAL OUTPUT (CLEAN + COMPLETE)
    // ===============================

    const output = {
      endpoint: "oracle",

      timestamp: new Date().toISOString(),

      authority: transit?.authority,
      freshness: transit?.freshness,
      integrity: transit?.integrity,
      location: transit?.location_used,

      ascendant: transit?.ascendant,
      houses: transit?.houses,
      kp_cusps: transit?.kp_cusps,

      planets: transit?.planets,
      strength: transit?.strength,

      dasha: transit?.dasha,
      divisional: transit?.divisional,

      aspects: transit?.aspects?.slice(0, 15),

      timing_evidence: {
        trigger_present: triggerPresent,
        precision_allowed: precisionAllowed,
        dominant_trigger: multiDominant,
        convergence,
        clusterDensity,
        peakTime
      },

      timing_decision: {
        mode: timingMode,
        exact_time: peakTime
      },

      smart_mode: smartMode,

      confidence: confidence,

      engine_status: "SMART_ORACLE_v2"
    };

    return res.status(200).json(output);

  } catch (err) {
    return res.status(500).json({
      error: "oracle_failed",
      message: err.message
    });
  }
}