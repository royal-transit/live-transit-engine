export default async function handler(req,res){
  try{
    const host=req.headers.host
    const base=https://${host}
    const lat=req.query.lat || "51.1465"
    const lon=req.query.lon || "0.8756"

    async function safeFetch(url){
      try{
        const r=await fetch(url)
        return await r.json()
      }catch(e){
        return {error:"failed",endpoint:url}
      }
    }

    const [
      transit,
      chart,
      aspects,
      divisional,
      dasha,
      strength,
      gochar,
      yog,
      event,
      confidence
    ]=await Promise.all([
      safeFetch(${base}/api/transit?lat=${lat}&lon=${lon}),
      safeFetch(${base}/api/chart?lat=${lat}&lon=${lon}),
      safeFetch(${base}/api/aspects),
      safeFetch(${base}/api/divisional),
      safeFetch(${base}/api/dasha),
      safeFetch(${base}/api/strength),
      safeFetch(${base}/api/gochar),
      safeFetch(${base}/api/yog),
      safeFetch(${base}/api/event?lat=${lat}&lon=${lon}),
      safeFetch(${base}/api/confidence?lat=${lat}&lon=${lon})
    ])

    return res.status(200).json({
      timestamp:new Date().toISOString(),
      input:{
        latitude:Number(lat),
        longitude:Number(lon)
      },
      oracle:{
        transit,
        chart,
        aspects,
        divisional,
        dasha,
        strength,
        gochar,
        yog,
        event,
        confidence
      }
    })
  }catch(err){
    return res.status(500).json({
      error:"oracle crash",
      details:String(err)
    })
  }
}
