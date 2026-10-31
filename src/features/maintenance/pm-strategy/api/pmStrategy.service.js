import api from "../../../../shared/api/client.js";

// Shared client already supplies /api and authenticated requests.
const BASE = "/pm-strategy";

export async function pmRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const config = {};
  let url = `${BASE}${path}`;
  // Keep query parameters already encoded in the path (e.g. preview?count=8).
  let result;
  if (method === "GET") result = await api.get(url, config);
  else if (method === "POST") result = await api.post(url, options.body ? JSON.parse(options.body) : {}, config);
  else if (method === "PUT") result = await api.put(url, options.body ? JSON.parse(options.body) : {}, config);
  else if (method === "DELETE") result = await api.delete(url, config);
  else throw new Error(`Unsupported request method: ${method}`);
  const envelope = result?.data ?? result;
  if (envelope?.success === false) throw new Error(envelope.message || "PM Strategy request failed");
  return envelope?.data ?? envelope;
}
