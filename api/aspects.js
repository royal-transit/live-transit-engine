
export default async function handler(req, res) {

  try {

    const response = await fetch("https://live-transit-engine.vercel.app/api/transit");
    const data = await response.json();

    const planets = {
      sun: data.sun.longitude,
      moon: data.moon.longitude,
      mercury: data.mercury.longitude,
      venus: data.venus.longitude,
      mars: data.mars.longitude,
      jupiter: data.jupiter.longitude,
      saturn: data.saturn.longitude,
      rahu: data.rahu.longitude,
      ketu: data.ketu.longitude
    };

    function getAngle(a, b) {
      let diff = Math.abs(a - b);
      return diff > 180 ? 360 - diff : diff;
    }

    const aspectTypes = [
      { name: "conjunction", angle: 0, orb: 8 },
      { name: "opposition", angle: 180, orb: 8 },
      { name: "trine", angle: 120, orb: 6 },
      { name: "square", angle: 90, orb: 6 },
      { name: "sextile", angle: 60, orb: 4 }
    ];

    const aspects = [];
    const keys = Object.keys(planets);

    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {

        const p1 = keys[i];
        const p2 = keys[j];

        const angle = getAngle(planets[p1], planets[p2]);

        for (const asp of aspectTypes) {
          if (Math.abs(angle - asp.angle) <= asp.orb) {
            aspects.push({
              planet1: p1,
              planet2: p2,
              type: asp.name,
              angle: Number(angle.toFixed(2))
            });
          }
        }
      }
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      total_aspects: aspects.length,
      aspects: aspects,
      engine_status: "live_pipeline_ok"
    });

  } catch (error) {

    return res.status(500).json({
      error: "aspects_engine_failed",
      details: error.message
    });

  }
}
