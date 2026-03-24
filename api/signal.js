export default async function handler(req, res) {
  try {
    const response = await fetch("https://live-transit-engine.vercel.app/api/oracle");
    const data = await response.json();

    const influences = data.analysis.influences;

    let signal = "NEUTRAL";

    // 🔥 decision layer
    if (influences.includes("knowledge expansion")) {
      signal = "GO";
    }

    if (influences.includes("karmic pressure")) {
      signal = "CAUTION";
    }

    if (
      influences.includes("karmic pressure") &&
      influences.includes("knowledge expansion")
    ) {
      signal = "WAIT";
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      signal: signal,
      based_on: influences,
      engine_status: "signal_engine_v1"
    });

  } catch (error) {
    return res.status(500).json({
      status: "signal_failed",
      message: error.message
    });
  }
}
