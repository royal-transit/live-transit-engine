export default function handler(req, res) {

  try {

    const lat = Number(req.query?.lat || 51.5074)
    const lon = Number(req.query?.lon || -0.1278)

    return res.status(200).json({

      timestamp: new Date().toISOString(),

      oracle_status: "online",

      location_used: {
        latitude: lat,
        longitude: lon
      },

      available_engines: [
        "/api/transit",
        "/api/chart",
        "/api/aspects",
        "/api/divisional",
        "/api/dasha",
        "/api/strength",
        "/api/gochar",
        "/api/yog",
        "/api/event",
        "/api/confidence"
      ]

    })

  } catch (err) {

    return res.status(500).json({
      error: "oracle engine crash",
      details: err.message
    })

  }

}
