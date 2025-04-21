export async function onRequestPost({ request, env }) {
  try {
    const { token } = await request.json();
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${env.TURNSTILE_SECRET}&response=${token}`
    });

    const { success } = await verifyRes.json();
    if (success) {
      const headers = new Headers();
      headers.append('Set-Cookie', 'cf-verified=true; Path=/; Max-Age=3600');
      headers.append('Location', env.TARGET_URL);
      return new Response(null, { status: 302, headers });
    }
    return new Response('验证失败', { status: 403 });
  } catch (error) {
    return new Response('服务器错误', { status: 500 });
  }
}
