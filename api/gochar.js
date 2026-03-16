import swe from "swisseph-v2"

function normalize360(v){
  let r=v%360
  if(r<0) r+=360
  return r
}

function round(v,d=3){
  return Number(v.toFixed(d))
}

function parseResult(res){
  if(!res) throw new Error("ephemeris error")
  const lon=res.longitude ?? res.lon ?? res.xx?.[0]
  if(typeof lon!=="number") throw new Error("longitude missing")
  return normalize360(lon)
}

function calcPlanet(jd,id,flags){
  return parseResult(swe.swe_calc_ut(jd,id,flags))
}

function aspectType(diff){
  const orb=Math.min(diff,360-diff)
  if(Math.abs(orb-0)<=6) return "conjunction"
  if(Math.abs(orb-60)<=5) return "sextile"
  if(Math.abs(orb-90)<=6) return "square"
  if(Math.abs(orb-120)<=6) return "trine"
  if(Math.abs(orb-180)<=6) return "opposition"
  return null
}

export default async function handler(req,res){
  try{
    const now=new Date()

    swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI,0,0)

    const utHour=
      now.getUTCHours()+
      now.getUTCMinutes()/60+
      now.getUTCSeconds()/3600

    const jd=swe.swe_julday(
      now.getUTCFullYear(),
      now.getUTCMonth()+1,
      now.getUTCDate(),
      utHour,
      swe.SE_GREG_CAL
    )

    const flags=swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL

    const planets={
      Sun:calcPlanet(jd,swe.SE_SUN,flags),
      Moon:calcPlanet(jd,swe.SE_MOON,flags),
      Mercury:calcPlanet(jd,swe.SE_MERCURY,flags),
      Venus:calcPlanet(jd,swe.SE_VENUS,flags),
      Mars:calcPlanet(jd,swe.SE_MARS,flags),
      Jupiter:calcPlanet(jd,swe.SE_JUPITER,flags),
      Saturn:calcPlanet(jd,swe.SE_SATURN,flags),
      Rahu:calcPlanet(jd,swe.SE_TRUE_NODE,flags)
    }

    planets.Ketu=normalize360(planets.Rahu+180)

    const keys=Object.keys(planets)
    const impacts=[]

    for(let i=0;i<keys.length;i++){
      for(let j=i+1;j<keys.length;j++){
        const p1=keys[i]
        const p2=keys[j]
        const raw=Math.abs(planets[p1]-planets[p2])
        const diff=Math.min(raw,360-raw)
        const type=aspectType(diff)
        if(type){
          impacts.push({
            from:p1,
            to:p2,
            type,
            angle:round(diff),
            pressure:
              type==="square" || type==="opposition" ? "high" :
              type==="conjunction" ? "direct" :
              "supportive"
          })
        }
      }
    }

    return res.status(200).json({
      timestamp:now.toISOString(),
      gochar:{
        active_impacts:impacts
      }
    })
  }catch(err){
    return res.status(500).json({
      error:"gochar engine failure",
      details:String(err)
    })
  }
}
