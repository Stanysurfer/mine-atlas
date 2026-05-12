export default async function handler(req, res) {
  const key = process.env.VITE_METALS_API_KEY;
  if (!key) return res.status(400).json({ error: "No API key" });
  try {
    const r = await fetch(
      `https://api.twelvedata.com/price?symbol=XAU%2FUSD%2CXAG%2FUSD%2CXPT%2FUSD%2CCOPPER%2FUSD&apikey=${key}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const data = await r.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
