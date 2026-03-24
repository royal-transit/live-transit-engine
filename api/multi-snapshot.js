export default async function handler(req, res) {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const lat = req.query?.lat || "51.5074";
    const lon = req.query?.lon || "-0.1278";
    const birthDateTime = req.query?.birth_datetime || null;

    const offsets = [-240, -120, 0, 120, 240];
    const snapshots = [];

    for (const offset of offsets) {
      const url = birthDateTime
        ? `${baseUrl}/api/transit?lat=${lat}&lon=${lon}&birth_datetime=${encodeURIComponent(birthDateTime)}`
        : `${baseUrl}/api/transit?lat=${lat}&lon=${lon}`;

      const response = await fetch(url);
      const data = await response.json();

      snapshots.push({
        offset_seconds: offset,
        timestamp: data.timestamp,
        micro_status: data.micro_status,
        micro_convergence: data.micro_convergence,
        micro_dominant_trigger: data.micro_dominant_trigger
      });
    }

    let activeCount = 0;
    const triggerMap = {};

    for (const shot of snapshots) {
      if (shot.micro_status?.trigger_present) {
        activeCount += 1;
      }

      const triggerType = shot.micro_dominant_trigger?.type;
      if (triggerType) {
        triggerMap[triggerType] = (triggerMap[triggerType] || 0) + 1;
      }
    }

    let dominantTriggerIdentity = null;
    let dominantTriggerCount = 0;

    for (const [key, value] of Object.entries(triggerMap)) {
      if (value > dominantTriggerCount) {
        dominantTriggerIdentity = key;
        dominantTriggerCount = value;
      }
    }

    let convergenceStrength = "low";
    if (activeCount >= 4) {
      convergenceStrength = "high";
    } else if (activeCount >= 2) {
      convergenceStrength = "medium";
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      location_used: {
        lat: lat,
        lon: lon
      },
      birth_datetime_used: birthDateTime,
      snapshot_count: snapshots.length,
      active_trigger_snapshots: activeCount,
      convergence_strength: convergenceStrength,
      cluster_density: dominantTriggerCount,
      dominant_trigger_identity: dominantTriggerIdentity,
      snapshots: snapshots,
      engine_status: "multi_snapshot_v1_live"
    });
  } catch (error) {
    return res.status(500).json({
      status: "multi_snapshot_failed",
      message: error.message
    });
  }
}