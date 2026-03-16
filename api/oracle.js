export default async function handler(req, res) {
  try {

    const { lat, lon } = req.query || {}

    const latitude = lat ? Number(lat) : 51.5074
    const longitude = lon ? Number(lon) : -0.1278

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      oracle_status: "active",
      location_used: {
        latitude,
        longitude
      },
      engine_routes: {
        transit: /api/transit?lat=${latitude}&lon=${longitude},
        chart: /api/chart?lat=${latitude}&lon=${longitude},
        aspects: /api/aspects,
        divisional: /api/divisional,
        dasha: /api/dasha,
        strength: /api/strength,
        gochar: /api/gochar,
        yog: /api/yog,
        event: /api/event,
        confidence: /api/confidence
      }
    })

  } catch (err) {

    return res.status(500).json({
      error: "oracle engine crash",
      details: String(err)
    })

  }
}
