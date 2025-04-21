export async function onRequest({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';
  if (cookie.includes('cf-verified=true')) {
    return Response.redirect(env.TARGET_URL, 302);
  }

  const html = `
<html>
<head>
  <title>安全验证</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" async defer></script>
</head>
<body>
  <script>
    function onloadTurnstileCallback() {
      turnstile.execute('${env.TURNSTILE_SITE_KEY}', {
        action: 'redirect',
        callback: function(token) {
          fetch('/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token })
          }).then(res => res.ok ? location.reload() : alert('验证失败'));
        }
      });
    }
  </script>
</body>
</html>
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
