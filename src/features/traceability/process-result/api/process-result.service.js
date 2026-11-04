// Minimal authenticated status call. No raw identifiers or fabricated records.
import api from "../../../../shared/api/client.js";
export async function getModuleStatus(signal) {
  const response = await api.get(`/traceability/process-result/status`, { signal });
  return response.data;
}
