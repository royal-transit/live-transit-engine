export default async function handler(req, res) {
  try {
    // 🔥 FIX: use relative path instead of full URL
    const baseUrl = `https://${req.headers.host}`;

    const response = await fetch(`${baseUrl}/api/oracle`);
    const data = await response.json();

    const influences = data.analysis.influences;

    let score = 0;
    let breakdown = [];

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

    const now = new Date();
    const cycle_date = now.toISOString().slice(0, 10);

    return res.status(200).json({
      timestamp: now.toISOString(),
      cycle_date: cycle_date,

      signal,
      label,
      score,

      breakdown,
      influences,

      meta: {
        version: "v6",
        confidence: Math.min(Math.max(score + 3, 0), 5),
        engine: "astro_signal_engine",
        cycle_tag: `${cycle_date}_${signal}`
      },

      engine_status: "signal_engine_v6_fixed"
    });

  } catch (error) {
    return res.status(500).json({
      status: "signal_failed",
      message: error.message
    });
  }
}
