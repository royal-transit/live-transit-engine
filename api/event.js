export default async function handler(req,res){
  try{
    return res.status(200).json({
      timestamp:new Date().toISOString(),
      event_trigger:{
        status:"disabled_for_stability",
        score:null,
        tier:null,
        note:"Nested internal fetch removed to prevent serverless crash"
      }
    })
  }catch(err){
    return res.status(500).json({
      error:"event engine failure",
      details:String(err)
    })
  }
}
