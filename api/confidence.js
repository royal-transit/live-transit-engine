export default async function handler(req, res) {

  try {

    const aspectsRes = await fetch("https://live-transit-engine.vercel.app/api/aspects");
    const strengthRes = await fetch("https://live-transit-engine.vercel.app/api/strength");
    const eventRes = await fetch("https://live-transit-engine.vercel.app/api/event");

    const aspectsData = await aspectsRes.json();
    const strengthData = await strengthRes.json();
    const eventData = await eventRes.json();

    let score = 50;

    if (aspectsData.total_aspects >= 8) {
      score += 15;
    }

    let strongPlanets = 0;

    for (const p in strengthData.strength) {
      if (strengthData.strength[p].strength_score >= 70) {
        strongPlanets += 1;
      }
    }

    score += strongPlanets * 5;

    if (eventData.total_events >= 5) {
      score += 20;
    } else if (eventData.total_events >= 3) {
      score += 10;
    }

    if (score > 100) {
      score = 100;
    }

    let confidence_level = "low";

    if (score >= 80) {
      confidence_level = "high";
    } else if (score >= 60) {
      confidence_level = "medium";
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      confidence_score: score,
      confidence_level: confidence_level,
      engine_status: "confidence_engine_active"
    });

  } catch (error) {

    return res.status(200).json({
      status: "error_captured",
      message: error.message
    });

  }
}
