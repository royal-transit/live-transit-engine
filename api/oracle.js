export default async function handler(req, res) {
  try {

    const lat = req.query.lat ? Number(req.query.lat) : 51.5074
    const lon = req.query.lon ? Number(req.query.lon) : -0.1278

    const base = "https://live-transit-engine.vercel.app/api"

    const urls = {
      transit: ${base}/transit?lat=${lat}&lon=${lon},
      kp: ${base}/kp?lat=${lat}&lon=${lon},
      dasha: ${base}/dasha?lat=${lat}&lon=${lon},
      divisional: ${base}/divisional?lat=${lat}&lon=${lon},
      aspects: ${base}/aspects?lat=${lat}&lon=${lon},
      strength: ${base}/strength?lat=${lat}&lon=${lon},
      gochar: ${base}/gochar?lat=${lat}&lon=${lon},
      yog: ${base}/yog?lat=${lat}&lon=${lon},
      event: ${base}/event?lat=${lat}&lon=${lon},
      confidence: ${base}/confidence
    }

    async function safeFetch(url){
      try{
        const r = await fetch(url)
        return await r.json()
      }catch{
        return {}
      }
    }

    const [
      transit,
      kp,
      dasha,
      divisional,
      aspects,
      strength,
      gochar,
      yog,
      event,
      confidence
    ] = await Promise.all([
      safeFetch(urls.transit),
      safeFetch(urls.kp),
      safeFetch(urls.dasha),
      safeFetch(urls.divisional),
      safeFetch(urls.aspects),
      safeFetch(urls.strength),
      safeFetch(urls.gochar),
      safeFetch(urls.yog),
      safeFetch(urls.event),
      safeFetch(urls.confidence)
    ])

    return res.status(200).json({

      timestamp: new Date().toISOString(),

      authority: {
        engine_name: "ROYEL_ASTRO_ENGINE",
        primary_calculation_authority: "Swiss Ephemeris",
        zodiac: "sidereal",
        ayanamsa: "lahiri"
      },

      evidence_packet: {
        transit,
        kp,
        dasha,
        divisional,
        aspects,
        strength,
        gochar,
        yog,
        event,
        confidence
      }

    })

  } catch (err) {

    return res.status(500).json({
      error: "oracle engine failed",
      message: err.message
    })

  }
}
