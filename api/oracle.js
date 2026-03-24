export default async function handler(req, res) {
  try {
    const base = "https://live-transit-engine.vercel.app";

    // 1. fetch transit
    const transitRes = await fetch(`${base}/api/transit`);
    const transit = await transitRes.json();

    // 2. fetch multi snapshot
    const multiRes = await fetch(`${base}/api/multi-snapshot`);
    const multi = await multiRes.json();

    // 3. fetch confidence (optional)
    let confidence = null;
    try {
      const confRes = await fetch(`${base}/api/confidence`);
      confidence = await confRes.json();
    } catch (e) {
      confidence = { status: "confidence_unavailable" };
    }

    // 4. merge
    return res.status(200).json({
      endpoint_called: "oracle.js",

      timestamp: new Date().toISOString(),

      transit_packet: transit,
      multi_snapshot: multi,
      confidence: confidence,

      oracle_summary: {
        convergence: multi?.convergence_strength || "unknown",
        micro_trigger: multi?.micro_status?.trigger_present || false,
        precision: multi?.micro_status?.precision_allowed || "unknown"
      },

      engine_status: "oracle_merged_v1"
    });

  } catch (error) {
    return res.status(500).json({
      status: "oracle_failed",
      error: error.message
    });
  }
}