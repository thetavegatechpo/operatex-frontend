import api from "../../../../shared/api/client.js";
export const getStatus = () => api.get("/maintenance/spare-parts/status");
