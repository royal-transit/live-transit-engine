export default async function handler(req, res) {
  try {
    const response = await fetch("https://live-transit-engine.vercel.app/api/oracle");
    const data = await response.json();

    const influences = data.analysis.influences;

    let signal = "NEUTRAL";
    let reason = [];

    // 🔥 priority logic (order matters)

    // 1️⃣ Highest priority → karmic pressure
    if (influences.includes("karmic pressure")) {
      signal = "CAUTION";
      reason.push("karmic pressure active");
    }

    // 2️⃣ Opportunity layer
    if (influences.includes("knowledge expansion")) {
      if (signal === "CAUTION") {
        signal = "WAIT";
        reason.push("opportunity present but blocked");
      } else {
        signal = "GO";
        reason.push("growth opportunity active");
      }
    }

    // 3️⃣ Action modifier
    if (influences.includes("unconventional action")) {
      reason.push("requires unconventional approach");
    }

    // 4️⃣ Emotional base
    if (influences.includes("emotional stability + spiritual pull")) {
      reason.push("stable internal state");
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      signal: signal,
      reason: reason,
      based_on: influences,
      engine_status: "signal_engine_v2_priority"
    });

  } catch (error) {
    return res.status(500).json({
      status: "signal_failed",
      message: error.message
    });
  }
}
