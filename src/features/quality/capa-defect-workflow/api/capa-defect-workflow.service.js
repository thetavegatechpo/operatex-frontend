import api from "../../../../shared/api/client.js";
export const getStatus = () => api.get("/quality/capa-defect-workflow/status");
