export async function onRequest({ request, env }) {
  const COOKIE_NAME = 'cf-verified';
  const cookie = request.headers.get('Cookie') || '';

  // 如果已通过验证则直接跳转
  if (cookie.includes(`${COOKIE_NAME}=true`)) {
    return Response.redirect(env.TARGET_URL, 302);
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>安全验证 | 正在跳转至目标网站</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" async defer></script>
  <style>
    body {
      background: #f0f2f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    #turnstile-container {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }
    .loading-text {
      color: #666;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div id="turnstile-container">
    <div class="loading-text">正在加载安全验证组件...</div>
    <div id="cf-turnstile-widget"></div>
  </div>

  <script>
    function onloadTurnstileCallback() {
      try {
        turnstile.execute(
          '#cf-turnstile-widget',  // 容器元素选择器
          {
            sitekey: '${env.TURNSTILE_SITE_KEY}',  // 从环境变量注入密钥
            action: 'redirect',
            callback: async function(token) {
              const response = await fetch('/verify', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({ token })
              });

              if (!response.ok) {
                throw new Error('验证失败，状态码：' + response.status);
              }
              
              // 验证成功后刷新页面触发中间件跳转
              window.location.reload();
            }
          }
        );
      } catch (error) {
        console.error('[Turnstile Error]', error);
        alert('安全验证初始化失败，请刷新页面重试');
      }
    }
  </script>
</body>
</html>
`;

  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}
