export default async function handler(req, res) {

  try {

    const response = await fetch("https://live-transit-engine.vercel.app/api/transit");
    const data = await response.json();

    const planets = {
      sun: data.sun.degree,
      moon: data.moon.degree,
      mercury: data.mercury.degree,
      venus: data.venus.degree,
      mars: data.mars.degree,
      jupiter: data.jupiter.degree,
      saturn: data.saturn.degree
    };

    const strength = {};

    for (const p in planets) {
      const degree = planets[p];

      let score = 50;

      if (degree < 5 || degree > 25) {
        score += 10;
      }

      if (degree > 10 && degree < 20) {
        score += 20;
      }

      strength[p] = {
        degree: degree,
        strength_score: score
      };
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      strength: strength,
      engine_status: "strength_calculated"
    });

  } catch (error) {

    return res.status(500).json({
      error: "strength_engine_failed",
      details: error.message
    });

  }
}
