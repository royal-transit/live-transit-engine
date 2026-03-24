export default async function handler(req, res) {
  try {

    const response = await fetch("https://live-transit-engine.vercel.app/api/transit");
    const data = await response.json();

    const moonSign = data.moon.sign;
    const saturnSign = data.saturn.sign;
    const jupiterSign = data.jupiter.sign;

    let effects = [];

    if (saturnSign === moonSign) {
      effects.push("Sade Sati active");
    }

    if (jupiterSign === moonSign) {
      effects.push("Growth phase");
    }

    if (effects.length === 0) {
      effects.push("Neutral phase");
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      moon_sign: moonSign,
      saturn_sign: saturnSign,
      jupiter_sign: jupiterSign,
      effects: effects,
      engine_status: "signal_basic_live"
    });

  } catch (error) {

    return res.status(500).json({
      status: "signal_failed",
      message: error.message
    });

  }
}
