export default async function handler(req, res) {
  try {

    const lat = req.query.lat || "51.1465"
    const lon = req.query.lon || "0.8756"

    const endpoints = {
      transit: /api/transit?lat=${lat}&lon=${lon},
      chart: /api/chart?lat=${lat}&lon=${lon},
      aspects: /api/aspects,
      divisional: /api/divisional,
      dasha: /api/dasha,
      strength: /api/strength,
      gochar: /api/gochar
    }

    return res.status(200).json({
      status: "oracle gateway active",
      timestamp: new Date().toISOString(),
      location: {
        latitude: Number(lat),
        longitude: Number(lon)
      },
      engine_routes: endpoints
    })

  } catch (err) {
    return res.status(500).json({
      error: "oracle crash",
      details: String(err)
    })
  }
}
