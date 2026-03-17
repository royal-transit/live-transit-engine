export default async function handler(req, res) {

  try {

    const fetchFn = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

    const [aspectsRes, strengthRes, gocharRes] = await Promise.all([
      fetchFn("https://live-transit-engine.vercel.app/api/aspects"),
      fetchFn("https://live-transit-engine.vercel.app/api/strength"),
      fetchFn("https://live-transit-engine.vercel.app/api/gochar")
    ]);

    const aspectsData = await aspectsRes.json();
    const strengthData = await strengthRes.json();
    const gocharData = await gocharRes.json();

    const events = [];

    // Rule 1: strong conjunction
    aspectsData.aspects.forEach(a => {
      if (a.type === "conjunction" && a.angle < 3) {
        events.push({
          type: "high_intensity_alignment",
          planets: ${a.planet1}-${a.planet2}
        });
      }
    });

    // Rule 2: high strength
    for (const p in strengthData.strength) {
      if (strengthData.strength[p].strength_score >= 70) {
        events.push({
          type: "planet_dominance",
          planet: p
        });
      }
    }

    // Rule 3: gochar alert
    gocharData.gochar.effects.forEach(e => {
      if (e.toLowerCase().includes("sade")) {
        events.push({
          type: "saturn_phase_alert",
          note: e
        });
      }
    });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      total_events: events.length,
      events: events,
      engine_status: "event_engine_active"
    });

  } catch (error) {

    return res.status(500).json({
      error: "event_engine_failed",
      details: error.message
    });

  }
}
