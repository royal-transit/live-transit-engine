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

    let verdict = "Neutral phase";

    // 🔥 upgraded logic
    if (moon_sign === "Taurus" && sun_sign === "Pisces") {
      verdict = "Stable emotions + spiritual pull (mixed influence)";
    }

    if (saturn_sign === "Pisces") {
      verdict += " | karmic pressure active";
    }

    if (jupiter_sign === "Gemini") {
      verdict += " | knowledge + decision expansion";
    }

    if (mars_sign === "Aquarius") {
      verdict += " | unconventional action energy";
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      source: "live_transit_api",
      moon_sign,
      sun_sign,
      saturn_sign,
      jupiter_sign,
      mars_sign,
      oracle_verdict: verdict,
      engine_status: "oracle_multi_planet_v2"
    });

  } catch (error) {
    return res.status(500).json({
      status: "oracle_failed",
      message: error.message
    });
  }
}
