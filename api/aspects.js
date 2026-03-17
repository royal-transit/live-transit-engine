export default function handler(req, res) {
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    total_aspects: 0,
    aspects: [],
    engine_status: "structured_ok"
  });
}
