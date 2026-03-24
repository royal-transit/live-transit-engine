export default async function handler(req, res) {
  try {
    const moon_sign = "Taurus";
    const sun_sign = "Pisces";

    // 🔹 basic logic layer
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
      moon_sign: moon_sign,
      sun_sign: sun_sign,
      oracle_verdict: verdict,
      engine_status: "oracle_logic_v1_live"
    });

  } catch (error) {
    return res.status(500).json({
      status: "oracle_failed",
      message: error.message
    });
  }
}
