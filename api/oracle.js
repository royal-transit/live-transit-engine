export default async function handler(req, res) {
  try {
    const response = await fetch("https://live-transit-engine.vercel.app/api/transit");
    const data = await response.json();

    const {
      moon_sign,
      sun_sign,
      saturn_sign,
      jupiter_sign,
      mars_sign
    } = data;

    // 🔹 structured interpretation
    let influences = [];

    if (moon_sign === "Taurus" && sun_sign === "Pisces") {
      influences.push("emotional stability + spiritual pull");
    }

    if (saturn_sign === "Pisces") {
      influences.push("karmic pressure");
    }

    if (jupiter_sign === "Gemini") {
      influences.push("knowledge expansion");
    }

    if (mars_sign === "Aquarius") {
      influences.push("unconventional action");
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      source: "live_transit_api",
      planets: {
        moon: moon_sign,
        sun: sun_sign,
        saturn: saturn_sign,
        jupiter: jupiter_sign,
        mars: mars_sign
      },
      analysis: {
        influences: influences,
        summary: influences.join(" | ")
      },
      engine_status: "oracle_structured_v3"
    });

  } catch (error) {
    return res.status(500).json({
      status: "oracle_failed",
      message: error.message
    });
  }
}
