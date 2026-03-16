export default async function handler(req, res) {
  try {

    const lat = req.query?.lat || 51.5074
    const lon = req.query?.lon || -0.1278

    const base = "https://live-transit-engine.vercel.app/api"

    async function safeFetch(url){
      try{
        const r = await fetch(url)
        return await r.json()
      }catch(e){
        return {error:true,message:e.message}
      }
    }

    const transit = await safeFetch(${base}/transit?lat=${lat}&lon=${lon})
    const chart = await safeFetch(${base}/chart?lat=${lat}&lon=${lon})
    const aspects = await safeFetch(${base}/aspects)
    const divisional = await safeFetch(${base}/divisional)
    const dasha = await safeFetch(${base}/dasha)
    const strength = await safeFetch(${base}/strength)
    const gochar = await safeFetch(${base}/gochar)
    const kp = await safeFetch(${base}/kp)
    const yog = await safeFetch(${base}/yog)
    const event = await safeFetch(${base}/event)
    const confidence = await safeFetch(${base}/confidence)

    return res.status(200).json({

      authority: "ROYEL_ASTRO_ENGINE",

      timestamp: new Date().toISOString(),

      location:{
        latitude: lat,
        longitude: lon
      },

      evidence_packet:{
        transit,
        chart,
        aspects,
        divisional,
        dasha,
        strength,
        gochar,
        kp,
        yog,
        event,
        confidence
      }

    })

  } catch(err) {

    return res.status(500).json({
      error:"oracle_engine_failed",
      message:err.message
    })

  }
}
