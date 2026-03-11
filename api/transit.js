
export default async function handler(req, res) {
  try {

    const now = new Date()

    const transit = {
      timestamp: now.toISOString(),

      moon: {
        sign: "Cancer",
        degree: 18.2,
        nakshatra: "Pushya"
      },

      saturn: {
        sign: "Pisces",
        degree: 12.1
      },

      rahu: {
        sign: "Pisces",
        degree: 28.0
      },

      ketu: {
        sign: "Virgo",
        degree: 28.0
      },

      venus: {
        sign: "Sagittarius",
        degree: 5.4
      }

    }

    res.status(200).json(transit)

  } catch (error) {

    res.status(500).json({
      error: "Transit engine failed",
      details: String(error)
    })

  }
}
