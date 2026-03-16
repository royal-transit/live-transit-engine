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

    const [transit,gochar,dasha,strength]=await Promise.all([
      safeFetch(${base}/api/transit?lat=${lat}&lon=${lon}),
      safeFetch(${base}/api/gochar),
      safeFetch(${base}/api/dasha),
      safeFetch(${base}/api/strength)
    ])

    const impactCount=gochar?.gochar?.active_impacts?.length || 0
    const maha=dasha?.current_mahadasha?.planet || ""
    const strengthValues=strength?.strength ? Object.values(strength.strength) : []

    const avgStrength=strengthValues.length
      ? strengthValues.reduce((a,b)=>a+(Number(b.dignity)||0),0)/strengthValues.length
      : 0

    let score=0

    if(impactCount>=5) score+=30
    else if(impactCount>=3) score+=20
    else if(impactCount>=1) score+=10

    if(maha) score+=20

    if(avgStrength>=70) score+=25
    else if(avgStrength>=50) score+=15
    else score+=5

    if(Array.isArray(transit?.aspects) && transit.aspects.length>=3) score+=15
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
        average_strength:Number(avgStrength.toFixed(2)),
        active_mahadasha:maha
      },
      dependencies:{
        transit_ok:!transit?.error,
        gochar_ok:!gochar?.error,
        dasha_ok:!dasha?.error,
        strength_ok:!strength?.error
      }
    })
  }catch(err){
    return res.status(500).json({
      error:"event engine failure",
      details:String(err)
    })
  }
}
