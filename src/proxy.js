export default {
  async fetch(request, env, ctx) {
    // 1. Tangani CORS Preflight (Wajib untuk browser modern)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    const streamType = url.searchParams.get('type'); // Parameter baru untuk jenis stream

    if (!targetUrl) {
      return new Response("Missing target URL", { status: 400 });
    }

    // 2. Siapkan request ke server asli
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      redirect: 'follow'
    });

    // 3. Logika Injeksi Header Berdasarkan Tipe
    // Tipe 1: Membutuhkan Referer dan Origin khusus
    if (streamType === 'premium1') {
      modifiedRequest.headers.set('Referer', 'https://domain-spesifik-1.com/');
      modifiedRequest.headers.set('Origin', 'https://domain-spesifik-1.com');
      modifiedRequest.headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    } 
    // Tipe 2: Membutuhkan User-Agent Mobile
    else if (streamType === 'mobile-stream') {
      modifiedRequest.headers.set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    }
    // Tipe Default (Opsional jika tidak ada parameter type)
    else {
      modifiedRequest.headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    }

    // 4. Fetch dan kembalikan dengan header CORS
    try {
      const response = await fetch(modifiedRequest);
      const newResponse = new Response(response.body, response);

      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      
      return newResponse;
    } catch (e) {
      return new Response("Error fetching stream", { status: 500 });
    }
  }
};
