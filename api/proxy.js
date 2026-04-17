export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  // 完全开放跨域
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "缺少 url 参数" });
  }

  try {
    // 读取原始上传流
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // 转发所有请求头（包括 Authorization！关键修复）
    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      const lk = key.toLowerCase();
      // 只过滤掉会导致403的host，其他全部保留
      if (lk === "host" || lk === "origin") continue;
      headers.set(key, val);
    }

    // 转发请求（支持图片、formdata、header）
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body.length ? body : undefined,
      redirect: "follow",
    });

    // 返回结果
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.status(response.status).send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "代理失败" });
  }
}
