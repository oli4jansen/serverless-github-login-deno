import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

const CLIENT_ID = Deno.env.get("CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("CLIENT_SECRET");

const CORS_HEADERS: [string, string][] = [
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Credentials", "true"]
];

async function handler(req: Request): Promise<Response> {
  // Get the request body and extract the code
  const code = (await req.json()).code;
  if (!code) {
    return new Response(JSON.stringify({ error: 'no_code' }), { status: 401, headers: CORS_HEADERS });
  }

  // Construct headers for the Github request
  const body = new URLSearchParams();
  body.set('client_id', CLIENT_ID);
  body.set('client_secret', CLIENT_SECRET);
  body.set('code', code);

  // Make the request to fetch an access token
  return await fetch("https://github.com/login/oauth/access_token", {
    method: 'POST',
    body,
    headers: { accept: "application/json" },
  }).then(async response => {
    // Error handling
    if (response.status >= 400 && response.status < 600) {
      throw new Error(response.statusText);
    }
    const body = await response.json();
    if (body.error) {
      throw new Error(body.error);
    }
    return body;
  }).then(async body => {
    return new Response(JSON.stringify(body), { headers: CORS_HEADERS });
  }).catch((error: Error) => {
    return new Response(JSON.stringify({ error: error.message }), { status: 401, headers: CORS_HEADERS });
  });
}

serve(handler);
