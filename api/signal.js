export default async function handler(req, res) {
  try {
    const lat = parseFloat(req.query?.lat ?? "51.5074");
    const lon = parseFloat(req.query?.lon ?? "-0.1278");

    const base = "https://live-transit-engine.vercel.app/api";
    const qs = ?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)};

    async function safeFetchJson(url) {
      try {
        const response = await fetch(url);
        return await response.json();
      } catch (error) {
        return null;
      }
    }

    const transit = await safeFetchJson(${base}/transit${qs});

    if (!transit || transit.error) {
      return res.status(200).json({
        status: "signal_unavailable",
        reason: "transit_missing"
      });
    }

    const signals = [];

    // 1. Strong conjunction signals
    for (const a of transit.aspects || []) {
      if (a.type === "conjunction") {
        signals.push({
          type: "alignment",
          planets: ${a.planet1}-${a.planet2},
          weight: "high"
        });
      }
    }

    // 2. Strength dominance
    for (const p in transit.strength || {}) {
      if (transit.strength[p] >= 0.7) {
        signals.push({
          type: "dominance",
          planet: p,
          weight: "medium"
        });
      }
    }

    // 3. Micro triggers
    for (const m of transit.micro_triggers || []) {
      signals.push({
        type: "micro_trigger",
        planets: ${m.planet1}-${m.planet2},
        exact_time: m.exact_time_utc,
        weight: "critical"
      });
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      total_signals: signals.length,
      signals: signals,
      engine_status: "signal_engine_ready"
    });
  } catch (error) {
    return res.status(200).json({
      status: "signal_error",
      message: error && error.message ? error.message : "unknown signal error"
    });
  }
}
