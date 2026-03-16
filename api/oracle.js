export default function handler(req, res) {
  return res.status(200).json({
    status: "oracle temporarily disabled for rebuild",
    note: "Use /api/transit as the live source until full oracle rebuild is complete."
  })
}
