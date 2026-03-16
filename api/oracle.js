export default async function handler(req, res) {

  try {

    const lat = req?.query?.lat ? Number(req.query.lat) : 51.5074
    const lon = req?.query?.lon ? Number(req.query.lon) : -0.1278

    const payload = {
      timestamp: new Date().toISOString(),

      oracle_status: "online",

      location_used: {
        latitude: lat,
        longitude: lon
      },

      authority: {
        engine: "ROYEL_ASTRO_ENGINE",
        zodiac: "sidereal",
        ayanamsa: "lahiri"
      },

      engines: {
        transit: /api/transit?lat=${lat}&lon=${lon},
        chart: /api/chart?lat=${lat}&lon=${lon},
        aspects: /api/aspects,
        divisional: /api/divisional,
        dasha: /api/dasha,
        strength: /api/strength,
        gochar: /api/gochar,
        kp: /api/kp?lat=${lat}&lon=${lon},
        yog: /api/yog,
        event: /api/event,
        confidence: /api/confidence
      }

    }

    return res.status(200).json(payload)

  } catch (error) {

    return res.status(500).json({
      error: "oracle_function_error",
      message: error?.message || "unknown error"
    })

  }

}
