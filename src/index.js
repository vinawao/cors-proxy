export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 1. Ambil target URL dari path (setelah domain)
    // Contoh: myproxy.dev/https://video.com/file.mp4 -> targetUrl = https://video.com/file.mp4
    const targetUrl = url.pathname.substring(1); 
    
    if (!targetUrl || !targetUrl.startsWith('http')) {
      return new Response('Format salah. Gunakan: myproxy.dev/https://target-video.com/video.mp4', { status: 400 });
    }

    // 2. Handle CORS Preflight (OPTIONS request)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 3. Modifikasi request (teruskan header Range untuk video)
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const response = await fetch(modifiedRequest);

    // 4. Buat response baru untuk menambahkan header CORS
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
