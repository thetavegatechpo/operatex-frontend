import api from "../../../../shared/api/client.js";
const API = "/model-master";
const modelService = {
  getMaster(params = {}) { return api.get(`${API}/master`, { params }); },
  getMasterById(id) { return api.get(`${API}/master/${id}`); },
  createMaster(payload) { return api.post(`${API}/master`, payload); },
  updateMaster(id, payload) { return api.put(`${API}/master/${id}`, payload); },
  deleteMaster(id) { return api.delete(`${API}/master/${id}`); },
  activateMaster(id) { return api.patch(`${API}/master/${id}/activate`); },
  getModelParts(id, params = {}) { return api.get(`${API}/${id}/parts`, { params }); },
  assignPart(id, payload) { return api.post(`${API}/${id}/parts`, payload); },
  unlinkPart(id, partId) { return api.delete(`${API}/${id}/parts/${partId}`); }
};
export default modelService;
