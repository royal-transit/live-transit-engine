export default function handler(req, res) {
  return res.status(200).json({
    status: "aspects api working",
    timestamp: new Date().toISOString()
  });
}
