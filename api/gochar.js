export default async function handler(req, res) {

  try {

    const response = await fetch("https://live-transit-engine.vercel.app/api/transit");
    const data = await response.json();

    const moonSign = data.moon.sign;
    const saturnSign = data.saturn.sign;
    const jupiterSign = data.jupiter.sign;

    const gochar = {
      moon_sign: moonSign,
      saturn_position: saturnSign,
      jupiter_position: jupiterSign,
      effects: []
    };

    // Simple logic (expand later)

    if (saturnSign === moonSign) {
      gochar.effects.push("Sade Sati influence active");
    }

    if (jupiterSign === moonSign) {
      gochar.effects.push("Growth and support phase");
    }

    if (jupiterSign !== moonSign && saturnSign !== moonSign) {
      gochar.effects.push("Neutral transit phase");
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      gochar: gochar,
      engine_status: "gochar_basic_ready"
    });

  } catch (error) {

    return res.status(500).json({
      error: "gochar_engine_failed",
      details: error.message
    });

  }
}
