export default async function handler(req, res) {
  try {
    const host = req.headers.host
    const base = https://${host}
    const lat = req.query.lat || "51.1465"
    const lon = req.query.lon || "0.8756"

    async function safeFetch(url) {
      try {
        const response = await fetch(url)
        const text = await response.text()

        try {
          return JSON.parse(text)
        } catch {
          return {
            error: "invalid_json",
            endpoint: url,
            status: response.status,
            raw: text
          }
        }
      } catch (err) {
        return {
          error: "fetch_failed",
          endpoint: url,
          details: String(err)
        }
      }
    }

    const [
      transitRaw,
      chartRaw,
      aspectsRaw,
      divisionalRaw,
      dashaRaw,
      strengthRaw,
      gocharRaw
    ] = await Promise.all([
      safeFetch(${base}/api/transit?lat=${lat}&lon=${lon}),
      safeFetch(${base}/api/chart?lat=${lat}&lon=${lon}),
      safeFetch(${base}/api/aspects),
      safeFetch(${base}/api/divisional),
      safeFetch(${base}/api/dasha),
      safeFetch(${base}/api/strength),
      safeFetch(${base}/api/gochar)
    ])

    const transit = transitRaw?.data || transitRaw
    const chart = chartRaw?.data || chartRaw
    const aspects = aspectsRaw?.data || aspectsRaw
    const divisional = divisionalRaw?.data || divisionalRaw
    const dasha = dashaRaw?.data || dashaRaw
    const strength = strengthRaw?.data || strengthRaw
    const gochar = gocharRaw?.data || gocharRaw

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      input: {
        latitude: Number(lat),
        longitude: Number(lon)
      },
      oracle: {
        transit,
        chart,
        aspects,
        divisional,
        dasha,
        strength,
        gochar,
        event: {
          status: "disabled_for_stability"
        },
        confidence: {
          status: "disabled_for_stability"
        }
      }
    })
  } catch (err) {
    return res.status(500).json({
      error: "oracle crash",
      details: String(err)
    })
  }
}
