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

    const [transit,gochar,dasha,strength]=await Promise.all([
      getJson(${base}/api/transit?lat=${lat}&lon=${lon}),
      getJson(${base}/api/gochar),
      getJson(${base}/api/dasha),
      getJson(${base}/api/strength)
    ])

    let score=0

    const impactCount=gochar?.gochar?.active_impacts?.length || 0
    if(impactCount>=5) score+=30
    else if(impactCount>=3) score+=20
    else if(impactCount>=1) score+=10

    const maha=dasha?.current_mahadasha?.planet || ""
    if(maha) score+=20

    const str=strength?.strength || {}
    const avgStrength=Object.values(str).length
      ? Object.values(str).reduce((a,b)=>a+(b.dignity||0),0)/Object.values(str).length
      : 0

    if(avgStrength>=70) score+=25
    else if(avgStrength>=50) score+=15
    else score+=5

    if(transit?.aspects?.length>=3) score+=15
    if(transit?.ascendant) score+=10

    let tier="low"
    if(score>=75) tier="strong"
    else if(score>=45) tier="medium"

    return res.status(200).json({
      timestamp:new Date().toISOString(),
      event_trigger:{
        score,
        tier,
        impact_count:impactCount,
        average_strength:avgStrength,
        active_mahadasha:maha
      }
    })
  }catch(err){
    return res.status(500).json({
      error:"event engine failure",
      details:String(err)
    })
  }
}
