export default async function handler(req, res) {

  const lat = req.query?.lat || 51.5074
  const lon = req.query?.lon || -0.1278

  const base = "https://live-transit-engine.vercel.app/api"

  const transit = await fetch(${base}/transit?lat=${lat}&lon=${lon}).then(r=>r.json())
  const chart = await fetch(${base}/chart?lat=${lat}&lon=${lon}).then(r=>r.json())
  const aspects = await fetch(${base}/aspects).then(r=>r.json())
  const divisional = await fetch(${base}/divisional).then(r=>r.json())
  const dasha = await fetch(${base}/dasha).then(r=>r.json())
  const strength = await fetch(${base}/strength).then(r=>r.json())
  const gochar = await fetch(${base}/gochar).then(r=>r.json())
  const kp = await fetch(${base}/kp).then(r=>r.json())
  const yog = await fetch(${base}/yog).then(r=>r.json())
  const event = await fetch(${base}/event).then(r=>r.json())
  const confidence = await fetch(${base}/confidence).then(r=>r.json())

  return res.status(200).json({

    authority: "ROYEL_ASTRO_ENGINE",

    timestamp: new Date().toISOString(),

    location: {
      latitude: lat,
      longitude: lon
    },

    evidence_packet: {

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

}
