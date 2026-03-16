export default async function handler(req,res){
  try{
    const baseUrl = ${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}

    const lat = req.query.lat ?? "51.5074"
    const lon = req.query.lon ?? "-0.1278"

    const transitUrl = ${baseUrl}/api/transit?lat=${lat}&lon=${lon}
    const chartUrl = ${baseUrl}/api/chart?lat=${lat}&lon=${lon}
    const aspectsUrl = ${baseUrl}/api/aspects
    const divisionalUrl = ${baseUrl}/api/divisional
    const dashaUrl = ${baseUrl}/api/dasha
    const strengthUrl = ${baseUrl}/api/strength

    const [
      transitRes,
      chartRes,
      aspectsRes,
      divisionalRes,
      dashaRes,
      strengthRes
    ] = await Promise.all([
      fetch(transitUrl),
      fetch(chartUrl),
      fetch(aspectsUrl),
      fetch(divisionalUrl),
      fetch(dashaUrl),
      fetch(strengthUrl)
    ])

    const [
      transit,
      chart,
      aspects,
      divisional,
      dasha,
      strength
    ] = await Promise.all([
      transitRes.json(),
      chartRes.json(),
      aspectsRes.json(),
      divisionalRes.json(),
      dashaRes.json(),
      strengthRes.json()
    ])

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      input: {
        latitude: Number(lat),
        longitude: Number(lon)
      },
      transit,
      chart,
      aspects,
      divisional,
      dasha,
      strength
    })
  }catch(err){
    return res.status(500).json({
      error: "oracle engine failure",
      details: String(err)
    })
  }
}
