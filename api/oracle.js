export default function handler(req, res) {

  const lat = req.query.lat ? Number(req.query.lat) : 51.5074
  const lon = req.query.lon ? Number(req.query.lon) : -0.1278

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

      transit: "/api/transit?lat=" + lat + "&lon=" + lon,

      kp: "/api/kp?lat=" + lat + "&lon=" + lon,

      dasha: "/api/dasha?lat=" + lat + "&lon=" + lon,

      divisional: "/api/divisional?lat=" + lat + "&lon=" + lon,

      aspects: "/api/aspects?lat=" + lat + "&lon=" + lon,

      strength: "/api/strength?lat=" + lat + "&lon=" + lon,

      gochar: "/api/gochar?lat=" + lat + "&lon=" + lon,

      yog: "/api/yog?lat=" + lat + "&lon=" + lon,

      event: "/api/event?lat=" + lat + "&lon=" + lon,

      confidence: "/api/confidence"

    }

  })

}
