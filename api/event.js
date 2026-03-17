export default async function handler(req, res) {

  try {

    const [aspectsRes, strengthRes, gocharRes] = await Promise.all([
      fetch("https://live-transit-engine.vercel.app/api/aspects"),
      fetch("https://live-transit-engine.vercel.app/api/strength"),
      fetch("https://live-transit-engine.vercel.app/api/gochar")
    ]);

    const aspectsData = await aspectsRes.json();
    const strengthData = await strengthRes.json();
    const gocharData = await gocharRes.json();

    const events = [];

    // 🔹 Rule 1: Strong conjunction → major trigger
    aspectsData.aspects.forEach(a => {
      if (a.type === "conjunction" && a.angle < 3) {
        events.push({
          type: "high_intensity_alignment",
          planets: ${a.planet1}-${a.planet2},
          note: "Powerful conjunction detected"
        });
      }
    });

    // 🔹 Rule 2: High strength planet
    for (const p in strengthData.strength) {
      if (strengthData.strength[p].strength_score >= 70) {
        events.push({
          type: "planet_dominance",
          planet: p,
          note: "Planet has high influence"
        });
      }
    }

    // 🔹 Rule 3: Gochar effect
    gocharData.gochar.effects.forEach(e => {
      if (e.includes("Sade")) {
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
