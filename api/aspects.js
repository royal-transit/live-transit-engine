export default async function handler(req, res) {
  const lat = req.query.lat ? Number(req.query.lat) : 51.5074;
  const lon = req.query.lon ? Number(req.query.lon) : -0.1278;

  const date = new Date();
  const jd = swe.julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60
  );

  const planets = {
    sun: swe.SUN,
    moon: swe.MOON,
    mercury: swe.MERCURY,
    venus: swe.VENUS,
    mars: swe.MARS,
    jupiter: swe.JUPITER,
    saturn: swe.SATURN,
    rahu: swe.MEAN_NODE,
    ketu: swe.TRUE_NODE
  };

  const positions = {};

  for (const key in planets) {
    const result = swe.calc_ut(jd, planets[key]);
    positions[key] = result.longitude;
  }

  const aspects = [];

  const aspectTypes = [
    { name: "conjunction", angle: 0, orb: 8 },
    { name: "opposition", angle: 180, orb: 8 },
    { name: "trine", angle: 120, orb: 6 },
    { name: "square", angle: 90, orb: 6 },
    { name: "sextile", angle: 60, orb: 4 }
  ];

  const planetKeys = Object.keys(positions);

  for (let i = 0; i < planetKeys.length; i++) {
    for (let j = i + 1; j < planetKeys.length; j++) {
      const p1 = planetKeys[i];
      const p2 = planetKeys[j];

      const diff = Math.abs(positions[p1] - positions[p2]);
      const angle = diff > 180 ? 360 - diff : diff;

      for (const aspect of aspectTypes) {
        if (Math.abs(angle - aspect.angle) <= aspect.orb) {
          aspects.push({
            planet1: p1,
            planet2: p2,
            type: aspect.name,
            exact_angle: Number(angle.toFixed(2))
          });
        }
      }
    }
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    total_aspects: aspects.length,
    aspects: aspects
  });
}
