export default async function handler(req, res) {

  try {

    const aspectsRes = await fetch("https://live-transit-engine.vercel.app/api/aspects");
    const strengthRes = await fetch("https://live-transit-engine.vercel.app/api/strength");
    const gocharRes = await fetch("https://live-transit-engine.vercel.app/api/gochar");

    const aspectsData = await aspectsRes.json();
    const strengthData = await strengthRes.json();
    const gocharData = await gocharRes.json();

    const events = [];

    for (let i = 0; i < aspectsData.aspects.length; i++) {
      const a = aspectsData.aspects[i];

      if (a.type === "conjunction" && a.angle < 3) {
        events.push({
          type: "high_intensity_alignment",
          planets: a.planet1 + "-" + a.planet2
        });
      }
    }

    for (const p in strengthData.strength) {
      if (strengthData.strength[p].strength_score >= 70) {
        events.push({
          type: "planet_dominance",
          planet: p
        });
      }
    }

    for (let i = 0; i < gocharData.gochar.effects.length; i++) {
      const e = gocharData.gochar.effects[i];

      if (e.toLowerCase().includes("sade")) {
        events.push({
          type: "saturn_phase_alert",
          note: e
        });
      }
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      total_events: events.length,
      events: events,
      engine_status: "event_engine_active"
    });

  } catch (error) {

    return res.status(200).json({
      status: "error_captured",
      message: error.message
    });

  }
}
