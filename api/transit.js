export default async function handler(req, res) {
  try {

    const output = {
      status: "Transit engine active",
      engine: "royal-live-transit",
      time: new Date().toISOString()
    }

    res.status(200).json(output)

  } catch (error) {

    res.status(500).json({
      error: "Transit calculation failed",
      details: String(error)
    })

  }
}
