export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  // 跨域全开
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "缺少url" });

  try {
    // 读取完整上传流
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    // 关键：完整转发所有头，包括 Authorization
    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.delete("origin");

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body.length ? body : undefined,
      redirect: "follow",
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.status(response.status).send(buffer);
  } catch (err) {
    res.status(500).json({ error: "代理请求失败" });
  }
}

