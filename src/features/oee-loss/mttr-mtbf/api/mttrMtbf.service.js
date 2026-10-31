import api from "../../../../shared/api/client.js";

const BASE_URL = "/mttr-mtbf";
const hasValue = (value) => value !== undefined && value !== null && value !== "";

export const cleanMttrMtbfParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => hasValue(value)));

const body = (response) => response?.data ?? response;
const payload = (response) => body(response)?.data ?? body(response) ?? null;

export const rowsFromMttrMtbfResponse = (response, keys = []) => {
  const value = payload(response);
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
};

export const getReliabilityMaster = async (filters = {}) =>
  payload(await api.get(`${BASE_URL}/master`, { params: cleanMttrMtbfParams(filters) }));

export const createReliabilityFormula = async (data) =>
  body(await api.post(`${BASE_URL}/master`, data));

export const updateReliabilityFormula = async (id, data) =>
  body(await api.put(`${BASE_URL}/master/${id}`, data));

export const getReliabilityConfig = async (filters = {}) =>
  payload(await api.get(`${BASE_URL}/config`, { params: cleanMttrMtbfParams(filters) }));

export const saveReliabilityConfig = async (data) =>
  body(await api.post(`${BASE_URL}/config`, data));

export const updateReliabilityConfig = async (id, data) =>
  body(await api.put(`${BASE_URL}/config/${id}`, data));

export const deactivateReliabilityConfig = async (id) =>
  body(await api.delete(`${BASE_URL}/config/${id}`));

export const executeReliability = async (data) =>
  body(await api.post(`${BASE_URL}/execute`, data));

export const getReliabilityRuntime = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/runtime`, { params: cleanMttrMtbfParams(filters) });
  return { data: payload(response), meta: response?.data?.meta ?? {} };
};

export const getReliabilityReport = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/report`, { params: cleanMttrMtbfParams(filters) });
  return { data: payload(response), meta: response?.data?.meta ?? {} };
};

export const getReliabilityDashboard = async (filters = {}) =>
  payload(await api.get(`${BASE_URL}/dashboard-summary`, { params: cleanMttrMtbfParams(filters) }));

export const exportReliabilityReport = async (filters = {}, format = "CSV") =>
  payload(await api.post(`${BASE_URL}/export`, { ...cleanMttrMtbfParams(filters), format }));

export const runReliabilityScheduler = async () =>
  body(await api.post(`${BASE_URL}/scheduler/run`, {}));

const mttrMtbfService = {
  getReliabilityMaster,
  createReliabilityFormula,
  updateReliabilityFormula,
  getReliabilityConfig,
  saveReliabilityConfig,
  updateReliabilityConfig,
  deactivateReliabilityConfig,
  executeReliability,
  getReliabilityRuntime,
  getReliabilityReport,
  getReliabilityDashboard,
  exportReliabilityReport,
  runReliabilityScheduler,
  rowsFromResponse: rowsFromMttrMtbfResponse,
  cleanParams: cleanMttrMtbfParams,
};

export default mttrMtbfService;

