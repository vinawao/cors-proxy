export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Ambil target dari path: /<targetUrl>
    // Contoh: https://cors-proxy.workers.dev/https://video.com/file.mp4
    const targetUrl = decodeURIComponent(url.pathname.slice(1));

    if (!targetUrl) {
      return new Response('Format salah. Gunakan: /<url target>', { status: 400 });
    }

    // Tolak non-http(s)
    if (!/^https?:\/\//i.test(targetUrl)) {
      return new Response('URL target harus http/https', { status: 400 });
    }

    // CORS headers yang konsisten
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept, Origin, Authorization',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
      'Access-Control-Max-Age': '86400',
    };

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Buat request ke origin
    // Penting: keep header Range (dan yang lain) supaya video bisa seek.
    const modifiedHeaders = new Headers(request.headers);
    // Hindari Host/proxy header yang berpotensi membingungkan
    modifiedHeaders.delete('host');
    modifiedHeaders.delete('connection');

    // (Opsional) kalau browser mengirim Authorization/Cookie dan origin butuh,
    // Anda harus memastikan cara auth Anda memang legal & diizinkan origin.
    // modifiedHeaders.delete('cookie'); // jangan hapus kalau memang diperlukan

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: modifiedHeaders,
      // Stream body untuk POST/PUT; untuk video umumnya GET/HEAD
      body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
      redirect: 'follow',
    });

    const response = await fetch(modifiedRequest);

    // Tambahkan CORS tanpa merusak status code (termasuk 206 untuk Range)
    const newHeaders = new Headers(response.headers);

    for (const [k, v] of Object.entries(corsHeaders)) {
      // expose/allow-headers/dll harus ditimpa
      newHeaders.set(k, v);
    }

    // Pastikan header yang relevan untuk video range tidak hilang
    // (Kalau origin tidak mengirim Accept-Ranges/Content-Range, set ini tidak memaksa, hanya expose.)
    // newHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
