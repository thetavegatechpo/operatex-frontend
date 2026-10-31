// src/services/availability.service.js

import api from "../../../../shared/api/client.js";

const BASE_URL = "/availability";
const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

export const cleanAvailabilityParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => hasValue(value)),
  );

const payload = (response) => response?.data?.data ?? response?.data ?? null;
const body = (response) => response?.data ?? response;

const rowsFrom = (response, keys = []) => {
  const value = body(response);
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return [];
};

export const getAvailabilityFormulaRows = (response) =>
  rowsFrom(response, ["formulas", "formula_master", "master"]);

export const getAvailabilityConfigRows = (response) =>
  rowsFrom(response, ["availability_configs", "config"]);

export const getAvailabilityResultRows = (response) =>
  rowsFrom(response, ["availability_results", "runtime", "report"]);

export const getAvailabilityMaster = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/master`, {
    params: cleanAvailabilityParams(filters),
  });
  return payload(response);
};

export const createAvailabilityFormula = async (data) =>
  body(await api.post(`${BASE_URL}/master`, data));

export const updateAvailabilityFormula = async (id, data) =>
  body(await api.put(`${BASE_URL}/master/${id}`, data));

export const getAvailabilityConfig = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/config`, {
    params: cleanAvailabilityParams(filters),
  });
  return payload(response);
};

export const createAvailabilityConfig = async (data) =>
  body(await api.post(`${BASE_URL}/config`, data));

export const updateAvailabilityConfig = async (id, data) =>
  body(await api.put(`${BASE_URL}/config/${id}`, data));

export const deactivateAvailabilityConfig = async (id) =>
  body(await api.delete(`${BASE_URL}/config/${id}`));

export const executeAvailability = async (data) =>
  body(await api.post(`${BASE_URL}/execute`, data));

export const recalculateAvailability = async (row) =>
  executeAvailability({
    company_id: row.company_id,
    machine_id: row.machine_id,
    shift_id: Number(row.shift_id),
    business_date: row.business_date,
    calculation_status: "RECALCULATED",
    source_system: "MES_UI_RECALCULATION",
  });

export const getAvailabilityRuntime = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/runtime`, {
    params: cleanAvailabilityParams(filters),
  });
  return { data: payload(response), meta: response?.data?.meta ?? {} };
};

export const getAvailabilityReport = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/report`, {
    params: cleanAvailabilityParams(filters),
  });
  return { data: payload(response), meta: response?.data?.meta ?? {} };
};

export const exportAvailabilityReport = async (
  filters = {},
  format = "CSV",
) => {
  const response = await api.post(`${BASE_URL}/export`, {
    ...cleanAvailabilityParams(filters),
    format,
  });
  return payload(response);
};

const availabilityService = {
  getAvailabilityMaster,
  createAvailabilityFormula,
  updateAvailabilityFormula,
  getAvailabilityConfig,
  createAvailabilityConfig,
  updateAvailabilityConfig,
  deactivateAvailabilityConfig,
  executeAvailability,
  recalculateAvailability,
  getAvailabilityRuntime,
  getAvailabilityReport,
  exportAvailabilityReport,
  getAvailabilityFormulaRows,
  getAvailabilityConfigRows,
  getAvailabilityResultRows,
  cleanParams: cleanAvailabilityParams,
};

export default availabilityService;
