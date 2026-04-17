import { fetch } from 'undici';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // 处理 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Missing ?url= parameter");
  }

  try {
    // 读取原始请求体（支持文件上传）
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // 复制原始请求头
    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.delete('origin');
    headers.delete('referer');

    // 转发请求
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
      redirect: 'follow'
    });

    // 复制响应头
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // 返回响应
    res.status(response.status);
    response.body.pipe(res);

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy Error: " + err.message);
  }
}

