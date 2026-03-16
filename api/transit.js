import swe from "swisseph-v2"

export default async function handler(req,res){

try{

const now = new Date()

const result = {
timestamp: now.toISOString(),
status:"transit engine running"
}

res.status(200).json(result)

}catch(err){

res.status(500).json({
error:"transit engine failure",
details:String(err)
})

}

}
