export async function onRequest(context) {
  return new Response("👋 Hello from CorruptWare backend!", {
    headers: { "content-type": "text/plain" },
  });
}
