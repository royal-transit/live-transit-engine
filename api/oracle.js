export default async function handler(req, res) {

  const base = process.env.VERCEL_URL
    ? https://${process.env.VERCEL_URL}
    : http://localhost:3000;

  try {

    const [
      transit,
      kp,
      dasha,
      divisional,
      aspects,
      strength,
      yog,
      gochar,
      event,
      confidence
    ] = await Promise.all([
      fetch(${base}/api/transit).then(r => r.json()),
      fetch(${base}/api/kp).then(r => r.json()),
      fetch(${base}/api/dasha).then(r => r.json()),
      fetch(${base}/api/divisional).then(r => r.json()),
      fetch(${base}/api/aspects).then(r => r.json()),
      fetch(${base}/api/strength).then(r => r.json()),
      fetch(${base}/api/yog).then(r => r.json()),
      fetch(${base}/api/gochar).then(r => r.json()),
      fetch(${base}/api/event).then(r => r.json()),
      fetch(${base}/api/confidence).then(r => r.json())
    ]);

    res.status(200).json({
      engine: "UHAP MASTER ORACLE",
      timestamp: new Date(),

      transit,
      kp,
      dasha,
      divisional,
      aspects,
      strength,
      yog,
      gochar,
      event,
      confidence
    });

  } catch (err) {

    res.status(500).json({
      error: "oracle_engine_failed",
      message: err.message
    });

  }
}
