export async function onRequest({ request, env }) {
  const COOKIE_NAME = 'cf-verified';
  const cookie = request.headers.get('Cookie') || '';

  if (cookie.includes(`${COOKIE_NAME}=true`)) {
    return Response.redirect(env.TARGET_URL, 302);
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <!-- 手动添加错误处理 -->
  <script>
    window.onloadTurnstileError = function(err) {
      console.error('[Turnstile 核心脚本加载失败]', err);
      document.getElementById('error-message').style.display = 'block';
    }
  </script>
  
  <meta charset="UTF-8">
  <script 
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" 
    async 
    defer
    onerror="window.onloadTurnstileError(event)"
  ></script>
  <style>
    body { 
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f0f2f5;
    }
    #turnstile-container {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      min-width: 380px;
      min-height: 300px;
    }
    #cf-turnstile-widget {
      min-width: 300px;  
      min-height: 65px;
    }
    #error-message {
      display: none;
      color: #dc3545;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div id="turnstile-container">
    <div id="cf-turnstile-widget"></div>
    <div id="error-message">⚠️ 验证组件加载异常，请尝试刷新页面或联系管理员</div>
  </div>

  <script>
    // 密钥可见性调试（部署后应删除）
    console.debug('[Turnstile Debug] SiteKey:', '${env.TURNSTILE_SITE_KEY}');

    function onloadTurnstileCallback() {
      try {
        if (typeof turnstile === 'undefined') {
          throw new Error('Turnstile 对象未定义');
        }

        // 执行初始化
        const widgetId = turnstile.execute('#cf-turnstile-widget', {
          sitekey: '${env.TURNSTILE_SITE_KEY}',
          action: 'redirect',
          language: 'zh-CN',
          theme: 'light', // 可选 light/dark/auto
          callback: async function(token) {
            const response = await fetch('/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });

            if (response.ok) {
              window.location.reload();
            } else {
              turnstile.reset(widgetId); // 关键！重置验证部件
              alert('验证失败，请重新操作');
            }
          }
        });
      } catch (error) {
        console.error('[初始化失败]', error);
        document.getElementById('error-message').style.display = 'block';
      }
    }

    // 超时处理（30秒未加载则提示）
    setTimeout(() => {
      if (!document.getElementById('cf-turnstile-widget').innerHTML) {
        document.getElementById('error-message').style.display = 'block';
      }
    }, 30000);
  </script>
</body>
</html>
  `;

  return new Response(htmlContent, {
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
