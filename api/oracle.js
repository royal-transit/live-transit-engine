export default async function handler(req, res) {
  try {
    const lat = req.query.lat || "51.1465"
    const lon = req.query.lon || "0.8756"

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      status: "oracle gateway active",
      input: {
        latitude: Number(lat),
        longitude: Number(lon)
      },
      engine_routes: {
        transit: /api/transit?lat=${lat}&lon=${lon},
        chart: /api/chart?lat=${lat}&lon=${lon},
        aspects: /api/aspects,
        divisional: /api/divisional,
        dasha: /api/dasha,
        strength: /api/strength,
        gochar: /api/gochar,
        yog: /api/yog,
        event: /api/event,
        confidence: /api/confidence
      },
      note: "Use the working calculation endpoints directly. Core live calculation is active."
    })
  } catch (err) {
    return res.status(500).json({
      error: "oracle crash",
      details: String(err)
    })
  }
}
