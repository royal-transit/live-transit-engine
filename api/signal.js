export default async function handler(req, res) {
  try {
    const response = await fetch("https://live-transit-engine.vercel.app/api/oracle");
    const data = await response.json();

    const influences = data.analysis.influences;

    let score = 0;
    let breakdown = [];

    // scoring
    if (influences.includes("knowledge expansion")) {
      score += 2;
      breakdown.push("+2 growth");
    }

    if (influences.includes("unconventional action")) {
      score += 1;
      breakdown.push("+1 action shift");
    }

    if (influences.includes("emotional stability + spiritual pull")) {
      score += 1;
      breakdown.push("+1 inner balance");
    }

    if (influences.includes("karmic pressure")) {
      score -= 3;
      breakdown.push("-3 karmic pressure");
    }

    // signal
    let signal = "NEUTRAL";
    let label = "";

    if (score >= 2) {
      signal = "GO";
      label = "Favourable window";
    } else if (score <= -1) {
      signal = "CAUTION";
      label = "High resistance phase";
    }

    if (score >= 1 && score <= 2 && influences.includes("karmic pressure")) {
      signal = "WAIT";
      label = "Hold and observe";
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      signal: signal,
      label: label,
      score: score,
      breakdown: breakdown,
      engine_status: "signal_engine_v4_client_ready"
    });

  } catch (error) {
    return res.status(500).json({
      status: "signal_failed",
      message: error.message
    });
  }
}
