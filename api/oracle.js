export default async function handler(req, res) {
  try {

    const baseUrl = "https://live-transit-engine.vercel.app";

    const response = await fetch(${baseUrl}/api/transit);
    const data = await response.json();

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      moon_sign: data.moon_sign,
      sun_sign: data.sun_sign,
      oracle_verdict: "Mixed influence phase",
      engine_status: "oracle_basic_live"
    });

  } catch (error) {

    return res.status(500).json({
      status: "oracle_failed",
      message: error.message
    });

  }
}
