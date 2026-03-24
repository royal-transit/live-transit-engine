export default async function handler(req, res) {
  try {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      engine_status: "signal_engine_boot_ok",
      status: "ok",
      note: "signal endpoint alive"
    });
  } catch (error) {
    return res.status(500).json({
      status: "signal_error",
      message: error && error.message ? error.message : "unknown signal error"
    });
  }
}
