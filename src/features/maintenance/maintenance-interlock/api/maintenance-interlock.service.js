import api from "../../../../shared/api/client.js";
export const getStatus = () => api.get("/maintenance/maintenance-interlock/status");
