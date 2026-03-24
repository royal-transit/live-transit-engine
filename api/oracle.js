export default async function handler(req, res) {
  try {
    // 🔹 fetch live transit data
    const response = await fetch("https://live-transit-engine.vercel.app/api/transit");
    const data = await response.json();

    const moon_sign = data.moon_sign;
    const sun_sign = data.sun_sign;

    // 🔹 logic layer
    let verdict = "Neutral phase";

    if (moon_sign === "Taurus" && sun_sign === "Pisces") {
      verdict = "Mixed influence phase";
    } else if (moon_sign === "Aries") {
      verdict = "Action-driven phase";
    } else if (moon_sign === "Cancer") {
      verdict = "Emotional sensitivity phase";
    } else if (moon_sign === "Leo") {
      verdict = "Confidence rise phase";
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      source: "live_transit_api",
      moon_sign: moon_sign,
      sun_sign: sun_sign,
      oracle_verdict: verdict,
      engine_status: "oracle_live_connected"
    });

  } catch (error) {
    return res.status(500).json({
      status: "oracle_failed",
      message: error.message
    });
  }
}
