export default async function handler(req, res) {
  try {
    const moon_sign = "Taurus";
    const sun_sign = "Pisces";

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      moon_sign: moon_sign,
      sun_sign: sun_sign,
      oracle_verdict: "Mixed influence phase",
      engine_status: "oracle_safe_live"
    });
  } catch (error) {
    return res.status(500).json({
      status: "oracle_failed",
      message: error.message
    });
  }
}
