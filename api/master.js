export default async function handler(req, res) {

  try {

    const base = "https://live-transit-engine.vercel.app/api";

    const aspects = await fetch(base + "/aspects").then(r => r.json());
    const strength = await fetch(base + "/strength").then(r => r.json());
    const gochar = await fetch(base + "/gochar").then(r => r.json());
    const event = await fetch(base + "/event").then(r => r.json());
    const confidence = await fetch(base + "/confidence").then(r => r.json());

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      engine_name: "ROYEL_ASTRO_ENGINE",
      data: {
        aspects,
        strength,
        gochar,
        event,
        confidence
      },
      engine_status: "master_pipeline_active"
    });

  } catch (error) {

    return res.status(200).json({
      status: "master_error",
      message: error.message
    });

  }
}
