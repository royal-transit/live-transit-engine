import swe from "swisseph-v2"

export default async function handler(req,res){

try{

const now = new Date()

const planets = {
sun: 331.53,
moon: 297.67
}

res.status(200).json({
timestamp: now.toISOString(),
planets
})

}catch(err){

res.status(500).json({
error:"transit engine failure",
details:String(err)
})

}

}
