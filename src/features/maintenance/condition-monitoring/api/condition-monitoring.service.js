import api from "../../../../shared/api/client.js";
export const getStatus = () => api.get("/maintenance/condition-monitoring/status");
