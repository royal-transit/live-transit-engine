export default async function handler(req, res) {
  try {
    const response = await fetch("https://live-transit-engine.vercel.app/api/oracle");
    const data = await response.json();

    const influences = data.analysis.influences;

    let score = 0;
    let breakdown = [];

    // 🔥 scoring system

    if (influences.includes("knowledge expansion")) {
      score += 2;
      breakdown.push("+2 knowledge expansion");
    }

    if (influences.includes("unconventional action")) {
      score += 1;
      breakdown.push("+1 unconventional action");
    }

    if (influences.includes("emotional stability + spiritual pull")) {
      score += 1;
      breakdown.push("+1 emotional stability");
    }

    if (influences.includes("karmic pressure")) {
      score -= 3;
      breakdown.push("-3 karmic pressure");
    }

    // 🔥 signal decision based on score
    let signal = "NEUTRAL";

    if (score >= 2) {
      signal = "GO";
    } else if (score <= -1) {
      signal = "CAUTION";
    }

    if (score >= 1 && score <= 2 && influences.includes("karmic pressure")) {
      signal = "WAIT";
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      signal: signal,
      score: score,
      breakdown: breakdown,
      based_on: influences,
      engine_status: "signal_engine_v3_score"
    });

  } catch (error) {
    return res.status(500).json({
      status: "signal_failed",
      message: error.message
    });
  }
}
