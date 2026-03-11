export default async function handler(req, res) {
  try {
    const now = new Date()

    const transit = {
      timestamp: now.toISOString(),

      sun: {
        sign: "Aquarius",
        degree: 26.0,
        nakshatra: "Purva Bhadrapada"
      },

      moon: {
        sign: "Cancer",
        degree: 18.2,
        nakshatra: "Pushya"
      },

      mercury: {
        sign: "Aquarius",
        degree: 20.0,
        nakshatra: "Shatabhisha"
      },

      venus: {
        sign: "Sagittarius",
        degree: 5.4,
        nakshatra: "Mula"
      },

      mars: {
        sign: "Gemini",
        degree: 12.0,
        nakshatra: "Ardra"
      },

      jupiter: {
        sign: "Taurus",
        degree: 17.0,
        nakshatra: "Rohini"
      },

      saturn: {
        sign: "Pisces",
        degree: 12.1,
        nakshatra: "Uttara Bhadrapada"
      },

      rahu: {
        sign: "Pisces",
        degree: 28.0,
        nakshatra: "Revati"
      },

      ketu: {
        sign: "Virgo",
        degree: 28.0,
        nakshatra: "Chitra"
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
