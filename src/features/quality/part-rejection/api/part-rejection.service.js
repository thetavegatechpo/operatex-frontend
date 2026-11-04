import api from "../../../../shared/api/client.js";
export const getStatus = () => api.get("/quality/part-rejection/status");
