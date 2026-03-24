export default async function handler(req, res) {
  try {

    const response = await fetch("https://live-transit-engine.vercel.app/api/transit");
    const data = await response.json();

    const moon = data.moon.sign;
    const sun = data.sun.sign;

    let verdict = "";

    if (moon === sun) {
      verdict = "High alignment phase";
    } else {
      verdict = "Mixed influence phase";
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      moon_sign: moon,
      sun_sign: sun,
      oracle_verdict: verdict,
      engine_status: "oracle_basic_live"
    });

  } catch (error) {

    return res.status(500).json({
      status: "oracle_failed",
      message: error.message
    });

  }
}
