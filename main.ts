import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

const CLIENT_ID = Deno.env.get("CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("CLIENT_SECRET");

const headers = new Headers({
  accept: "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*"
});

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS' || !req.body) {
    return new Response("no body", { status: 200, headers });
  }
  // Get the request body and extract the code
  const requestBody = await req.json();
  if (!requestBody || !(requestBody.code || requestBody.refresh_token)) {
    return new Response("no code", { status: 200, headers });
  }

  // Construct headers for the Github request
  const body = new URLSearchParams();
  body.set('client_id', CLIENT_ID);
  body.set('client_secret', CLIENT_SECRET);
  if (requestBody.code) {
    body.set('code', requestBody.code);
  } else {
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', requestBody.refresh_token);
  }

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
    return new Response(JSON.stringify(body), { headers });
  }).catch((error: Error) => {
    return new Response(JSON.stringify({ error: error.message }), { status: 401, headers });
  });
}

serve(handler);
