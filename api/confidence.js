export default async function handler(req,res){
  try{
    const host=req.headers.host
    const base=https://${host}
    const lat=req.query.lat || "51.1465"
    const lon=req.query.lon || "0.8756"

    async function safeFetch(url){
      try{
        const r=await fetch(url)
        const text=await r.text()
        try{
          return JSON.parse(text)
        }catch{
          return {error:"invalid_json",url,status:r.status}
        }
      }catch(e){
        return {error:"fetch_failed",url}
      }
    }

    const [transit,chart,divisional,dasha]=await Promise.all([
      safeFetch(${base}/api/transit?lat=${lat}&lon=${lon}),
      safeFetch(${base}/api/chart?lat=${lat}&lon=${lon}),
      safeFetch(${base}/api/divisional),
      safeFetch(${base}/api/dasha)
    ])

    let confidence=0

    if(transit?.timestamp) confidence+=0.25
    if(transit?.ascendant) confidence+=0.25
    if(chart?.houses) confidence+=0.2
    if(divisional?.divisional?.D9) confidence+=0.15
    if(dasha?.current_mahadasha) confidence+=0.15

    return res.status(200).json({
      timestamp:new Date().toISOString(),
      confidence:{
        score:Number(confidence.toFixed(2)),
        band:
          confidence>=0.8 ? "high" :
          confidence>=0.5 ? "medium" : "low"
      },
      dependencies:{
        transit_ok:!transit?.error,
        chart_ok:!chart?.error,
        divisional_ok:!divisional?.error,
        dasha_ok:!dasha?.error
      }
    })
  }catch(err){
    return res.status(500).json({
      error:"confidence engine failure",
      details:String(err)
    })
  }
}
