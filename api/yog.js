import swe from "swisseph-v2"

const SIGNS=[
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
]

function normalize360(v){
  let r=v%360
  if(r<0) r+=360
  return r
}

function signOf(lon){
  return SIGNS[Math.floor(normalize360(lon)/30)]
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
      Saturn:calcPlanet(jd,swe.SE_SATURN,flags)
    }

    const yogs=[]

    if(signOf(planets.Jupiter)==="Cancer") yogs.push("Jupiter exaltation support")
    if(signOf(planets.Venus)==="Pisces") yogs.push("Venus exaltation support")
    if(signOf(planets.Saturn)==="Libra") yogs.push("Saturn exaltation support")

    const mercurySunGap=Math.abs(planets.Mercury-planets.Sun)
    if(Math.min(mercurySunGap,360-mercurySunGap)<=14){
      yogs.push("Budha-Aditya tendency")
    }

    const jupMoonGap=Math.abs(planets.Jupiter-planets.Moon)
    if(Math.min(jupMoonGap,360-jupMoonGap)<=12){
      yogs.push("Gaja-Kesari tendency")
    }

    return res.status(200).json({
      timestamp:now.toISOString(),
      yog:{
        active:yogs
      }
    })
  }catch(err){
    return res.status(500).json({
      error:"yog engine failure",
      details:String(err)
    })
  }
}
