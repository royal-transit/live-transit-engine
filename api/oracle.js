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
      authority: {
        engine_name: "ROYEL_ASTRO_ENGINE",
        primary_calculation_authority: "Swiss Ephemeris",
        zodiac: "sidereal",
        ayanamsa: "lahiri"
      },
      available_engines: {
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
      },
      note: "Core astrology engines are online. Use the listed endpoints as the evidence sources for full analysis."
    })
  } catch (err) {
    return res.status(500).json({
      error: "oracle_engine_crash",
      details: String(err)
    })
  }
}
