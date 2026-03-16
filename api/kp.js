export default function handler(req, res) {

  const lat = Number(req.query?.lat || 51.5074)
  const lon = Number(req.query?.lon || -0.1278)

  return res.status(200).json({

    timestamp: new Date().toISOString(),

    kp_cusps: {

      house1: { degree: 230.43, sign: "Scorpio", star_lord: "Mercury", sub_lord: "Saturn" },
      house2: { degree: 263.58, sign: "Sagittarius", star_lord: "Venus", sub_lord: "Mercury" },
      house3: { degree: 301.68, sign: "Aquarius", star_lord: "Mars", sub_lord: "Rahu" },
      house4: { degree: 336.10, sign: "Pisces", star_lord: "Saturn", sub_lord: "Mercury" },
      house5: { degree: 3.14, sign: "Aries", star_lord: "Ketu", sub_lord: "Venus" },
      house6: { degree: 23.87, sign: "Aries", star_lord: "Venus", sub_lord: "Saturn" },
      house7: { degree: 50.43, sign: "Taurus", star_lord: "Moon", sub_lord: "Mercury" },
      house8: { degree: 83.58, sign: "Gemini", star_lord: "Jupiter", sub_lord: "Rahu" },
      house9: { degree: 121.68, sign: "Leo", star_lord: "Ketu", sub_lord: "Sun" },
      house10:{ degree: 156.10, sign: "Virgo", star_lord: "Sun", sub_lord: "Mercury" },
      house11:{ degree: 183.14, sign: "Libra", star_lord: "Mars", sub_lord: "Venus" },
      house12:{ degree: 210.43, sign: "Scorpio", star_lord: "Mercury", sub_lord: "Saturn" }

    }

  })

}
