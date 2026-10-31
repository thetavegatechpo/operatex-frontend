import api from "../../../../shared/api/client.js";

const BASE_URL = "/breakdown-management";

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

export const cleanBreakdownParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => hasValue(value)),
  );

const body = (response) => response?.data ?? response;
const payload = (response) => body(response)?.data ?? body(response) ?? null;

export const rowsFromBreakdownResponse = (response, keys = []) => {
  const value = payload(response);
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
};

export const getBreakdownMaster = async (filters = {}) =>
  payload(
    await api.get(`${BASE_URL}/master`, {
      params: cleanBreakdownParams(filters),
    }),
  );

export const createBreakdownMaster = async (type, data) =>
  body(await api.post(`${BASE_URL}/master/${type}`, data));

export const updateBreakdownMaster = async (type, id, data) =>
  body(await api.put(`${BASE_URL}/master/${type}/${id}`, data));

export const deactivateBreakdownMaster = async (type, id) =>
  body(await api.delete(`${BASE_URL}/master/${type}/${id}`));

export const getEscalationConfig = async (filters = {}) =>
  payload(
    await api.get(`${BASE_URL}/config`, {
      params: cleanBreakdownParams(filters),
    }),
  );

export const createEscalationConfig = async (data) =>
  body(await api.post(`${BASE_URL}/config`, data));

export const updateEscalationConfig = async (id, data) =>
  body(await api.put(`${BASE_URL}/config/${id}`, data));

export const deactivateEscalationConfig = async (id) =>
  body(await api.delete(`${BASE_URL}/config/${id}`));

export const getBreakdownRuntime = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/runtime`, {
    params: cleanBreakdownParams(filters),
  });
  return {
    data: payload(response),
    meta: response?.data?.meta ?? {},
  };
};

export const getBreakdownById = async (id) =>
  payload(await api.get(`${BASE_URL}/runtime/${id}`));

export const executeBreakdownAction = async (data) =>
  body(await api.post(`${BASE_URL}/execute`, data));

export const getBreakdownDashboard = async (filters = {}) =>
  payload(
    await api.get(`${BASE_URL}/dashboard-summary`, {
      params: cleanBreakdownParams(filters),
    }),
  );

export const getBreakdownReport = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/report`, {
    params: cleanBreakdownParams(filters),
  });
  return {
    data: payload(response),
    meta: response?.data?.meta ?? {},
  };
};

export const exportBreakdownReport = async (filters = {}, format = "CSV") =>
  payload(
    await api.post(`${BASE_URL}/export`, {
      ...cleanBreakdownParams(filters),
      format,
    }),
  );

export const runBreakdownScheduler = async () =>
  body(await api.post(`${BASE_URL}/scheduler/run`, {}));

const breakdownManagementService = {
  getBreakdownMaster,
  createBreakdownMaster,
  updateBreakdownMaster,
  deactivateBreakdownMaster,
  getEscalationConfig,
  createEscalationConfig,
  updateEscalationConfig,
  deactivateEscalationConfig,
  getBreakdownRuntime,
  getBreakdownById,
  executeBreakdownAction,
  getBreakdownDashboard,
  getBreakdownReport,
  exportBreakdownReport,
  runBreakdownScheduler,
  rowsFromResponse: rowsFromBreakdownResponse,
  cleanParams: cleanBreakdownParams,
};

export default breakdownManagementService;
