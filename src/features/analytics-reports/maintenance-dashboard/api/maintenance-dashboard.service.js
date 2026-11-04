// Minimal authenticated status call. No raw identifiers or fabricated records.
import api from "../../../../shared/api/client.js";
export async function getModuleStatus(signal) {
  const response = await api.get(`/analytics-reports/maintenance-dashboard/status`, { signal });
  return response.data;
}
