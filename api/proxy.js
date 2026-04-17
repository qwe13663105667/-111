export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing ?url=");

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...Object.fromEntries(new Headers(req.headers)),
        Host: new URL(targetUrl).host,
        Origin: null
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined
    });
    const body = await response.text();
    res.status(response.status).send(body);
  } catch (err) {
    res.status(500).send("Proxy Error: " + err.message);
  }
}

