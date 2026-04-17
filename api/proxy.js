export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "缺少 url 参数" });
  }

  try {
    // 读取原始流
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // 构造请求头
    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      const lk = key.toLowerCase();
      if (lk === "host" || lk === "origin" || lk === "referer") continue;
      headers.set(key, val);
    }

    // 转发请求
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body.length > 0 ? body : undefined,
      redirect: "follow",
    });

    // 回传响应头
    response.headers.forEach((v, k) => {
      if (!["content-length", "content-encoding"].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });

    // 正确返回二进制流（图片/JSON都兼容）
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.status(response.status).send(buffer);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "代理失败: " + err.message });
  }
}

