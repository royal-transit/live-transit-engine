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

    const [
      transit,
      chart,
      aspects,
      divisional,
      dasha,
      strength,
      gochar,
      yog
    ]=await Promise.all([
      safeFetch(${base}/api/transit?lat=${lat}&lon=${lon}),
      safeFetch(${base}/api/chart?lat=${lat}&lon=${lon}),
      safeFetch(${base}/api/aspects),
      safeFetch(${base}/api/divisional),
      safeFetch(${base}/api/dasha),
      safeFetch(${base}/api/strength),
      safeFetch(${base}/api/gochar),
      safeFetch(${base}/api/yog)
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
        event:{
          status:"disabled_for_stability"
        },
        confidence:{
          status:"disabled_for_stability"
        }
      }
    })
  }catch(err){
    return res.status(500).json({
      error:"oracle crash",
      details:String(err)
    })
  }
}
