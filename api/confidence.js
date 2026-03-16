export default async function handler(req, res) {
  try {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      confidence: {
        status: "stable_placeholder",
        score: null,
        band: null,
        note: "Confidence wrapper disabled to prevent serverless crash."
      }
    })
  } catch (err) {
    return res.status(500).json({
      error: "confidence engine failure",
      details: String(err)
    })
  }
}
