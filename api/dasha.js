import swe from "swisseph-v2"

const DASHAS = [
{planet:"Ketu",years:7},
{planet:"Venus",years:20},
{planet:"Sun",years:6},
{planet:"Moon",years:10},
{planet:"Mars",years:7},
{planet:"Rahu",years:18},
{planet:"Jupiter",years:16},
{planet:"Saturn",years:19},
{planet:"Mercury",years:17}
]

const NAKSHATRA_LORDS = [
"Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
"Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
"Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter"
]

function normalize360(v){
let r=v%360
if(r<0) r+=360
return r
}

function parseCalc(result){
if(!result) throw new Error("ephemeris error")

const lon =
result.longitude ??
result.lon ??
result.xx?.[0]

if(typeof lon !== "number") throw new Error("longitude missing")

return normalize360(lon)
}

function calcMoon(jd,flags){
return parseCalc(swe.swe_calc_ut(jd,swe.SE_MOON,flags))
}

function getNakshatra(moonLon){
const size=360/27
const index=Math.floor(moonLon/size)
const degree=(moonLon%size)

return{
index,
lord:NAKSHATRA_LORDS[index],
portion:degree/size
}
}

function findMahadasha(lord,portion){

const order=DASHAS.map(d=>d.planet)

let startIndex=order.indexOf(lord)

let remainingYears=DASHAS[startIndex].years*(1-portion)

return{
startIndex,
remainingYears
}
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

const moonLon=calcMoon(jd,flags)

const nak=getNakshatra(moonLon)

const maha=findMahadasha(nak.lord,nak.portion)

const mahaPlanet=DASHAS[maha.startIndex].planet

const endDate=new Date(now)
endDate.setFullYear(now.getFullYear()+maha.remainingYears)

res.status(200).json({

timestamp:now.toISOString(),
moon_longitude:moonLon,

nakshatra:{
index:nak.index,
lord:nak.lord
},

current_mahadasha:{
planet:mahaPlanet,
remaining_years:maha.remainingYears
},

ends:endDate

})

}catch(err){

res.status(500).json({
error:"dasha engine failure",
details:String(err)
})

}

}
