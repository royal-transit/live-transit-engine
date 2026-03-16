export default async function handler(req,res){
  try{
    const host=req.headers.host
    const base=https://${host}
    const lat=req.query.lat || "51.1465"
    const lon=req.query.lon || "0.8756"

    async function getJson(url){
      const r=await fetch(url)
      return await r.json()
    }

    const [transit,chart,divisional,dasha]=await Promise.all([
      getJson(${base}/api/transit?lat=${lat}&lon=${lon}),
      getJson(${base}/api/chart?lat=${lat}&lon=${lon}),
      getJson(${base}/api/divisional),
      getJson(${base}/api/dasha)
    ])

    let confidence=0

    if(transit?.timestamp) confidence+=0.2
    if(transit?.ascendant) confidence+=0.2
    if(chart?.houses) confidence+=0.2
    if(divisional?.divisional?.D9) confidence+=0.2
    if(dasha?.current_mahadasha) confidence+=0.2

    return res.status(200).json({
      timestamp:new Date().toISOString(),
      confidence:{
        score:Number(confidence.toFixed(2)),
        band:
          confidence>=0.8 ? "high" :
          confidence>=0.5 ? "medium" : "low"
      }
    })
  }catch(err){
    return res.status(500).json({
      error:"confidence engine failure",
      details:String(err)
    })
  }
}
