import { isAuthorized, reject } from "./_auth.js";

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(request)) return reject(response);

  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json({ ok: true });
}
