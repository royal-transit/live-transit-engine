export default async function handler(req, res) {
  try {
    const now = new Date();

    // =========================
    // INPUT HANDLING
    // =========================
    const { name, dob } = req.query || {};

    const hasDOB = !!dob;
    const hasName = !!name;

    // =========================
    // MODE DETECTION
    // =========================
    let mode = "UNKNOWN";

    if (hasDOB) {
      mode = "DOB_MODE";
    } else if (hasName) {
      mode = "NAME_MODE";
    } else {
      mode = "NO_INPUT";
    }

    // =========================
    // BASE RESPONSE
    // =========================
    const response = {
      oracle_type: "PAST_FORENSIC_ORACLE",
      version: "PHASE_1_SAFE",
      timestamp_utc: now.toISOString(),

      input_received: {
        name: name || null,
        dob: dob || null,
        mode: mode,
      },

      status: "INITIALISED",

      capabilities: {
        reverse_scan: false,
        recent_memory_hits: false,
        pattern_detection: false,
      },

      message:
        "Past Forensic Oracle initialised successfully. Reverse scan engine will be activated in next phase.",

      safety: {
        existing_oracle_untouched: true,
        isolated_route: true,
        conflict_risk: "NONE",
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      error: "PAST_ORACLE_CRASH",
      message: error.message,
    });
  }
}