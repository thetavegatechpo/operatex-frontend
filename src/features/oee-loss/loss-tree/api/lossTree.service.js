import api from '../../../../shared/api/client.js';

const BASE = '/loss-tree';
export const cleanLossParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
const unwrap = response => response?.data?.data ?? response?.data ?? response;

export const getLossCategories = filters => api.get(`${BASE}/master`, { params: cleanLossParams(filters) }).then(unwrap);
export const createLossCategory = data => api.post(`${BASE}/master`, data).then(unwrap);
export const updateLossCategory = (id, data) => api.put(`${BASE}/master/${id}`, data).then(unwrap);
export const getLossMappings = filters => api.get(`${BASE}/config`, { params: cleanLossParams(filters) }).then(unwrap);
export const createLossMapping = data => api.post(`${BASE}/config`, data).then(unwrap);
export const reviseLossMapping = data => api.post(`${BASE}/config/revision`, data).then(unwrap);
export const getLossRuntime = filters => api.get(`${BASE}/runtime`, { params: cleanLossParams(filters) }).then(unwrap);
export const getLossReport = filters => api.get(`${BASE}/report`, { params: cleanLossParams(filters) }).then(unwrap);
export const executeLoss = data => api.post(`${BASE}/execute`, data).then(unwrap);
export const aggregateLossWindow = data => api.post(`${BASE}/scheduler/run`, data).then(unwrap);

export default { getLossCategories, createLossCategory, updateLossCategory, getLossMappings,
  createLossMapping, reviseLossMapping, getLossRuntime, getLossReport, executeLoss, aggregateLossWindow };
