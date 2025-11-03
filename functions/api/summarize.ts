// Cloudflare Pages Function that proxies to the Worker
export async function onRequest(context: any) {
  const { request } = context;

  // Forward the request to the deployed worker
  const workerUrl = 'https://ai-news-summarizer.digitalimages.workers.dev/api/summarize';

  return fetch(workerUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' ? await request.text() : undefined,
  });
}
