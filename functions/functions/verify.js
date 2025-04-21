export async function onRequestPost({ request, env }) {
  try {
    const { token } = await request.json();

    // Turnstile验证接口调用
    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const secretKey = env.TURNSTILE_SECRET;

    const result = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token
      })
    });

    const data = await result.json();

    if (data.success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          'Set-Cookie': 'cf-verified=true; Path=/; HttpOnly; Secure',
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid token' }), { 
      status: 403 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500
    });
  }
}
