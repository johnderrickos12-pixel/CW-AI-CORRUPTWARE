export async function onRequest(context) {
  const info = {
    project: "CW-AI-CORRUPTWARE",
    status: "online",
    version: "1.0.0",
    author: "JohnDerrickOS12"
  };
  return new Response(JSON.stringify(info), {
    headers: { "content-type": "application/json" },
  });
}
