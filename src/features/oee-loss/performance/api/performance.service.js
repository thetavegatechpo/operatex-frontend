// src/services/performance.service.js

import api from "../../../../shared/api/client.js";

const BASE_URL = "/performance";
const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

export const cleanPerformanceParams = (params = {}) =>
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

export const getPerformanceFormulaRows = (response) =>
  rowsFrom(response, ["formulas", "formula_master", "master"]);

export const getPerformanceConfigRows = (response) =>
  rowsFrom(response, ["performance_configs", "config"]);

export const getPerformanceResultRows = (response) =>
  rowsFrom(response, ["performance_results", "runtime", "report"]);

export const getPerformanceMaster = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/master`, {
    params: cleanPerformanceParams(filters),
  });
  return payload(response);
};

export const createPerformanceFormula = async (data) =>
  body(await api.post(`${BASE_URL}/master`, data));

export const updatePerformanceFormula = async (id, data) =>
  body(await api.put(`${BASE_URL}/master/${id}`, data));

export const getPerformanceConfig = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/config`, {
    params: cleanPerformanceParams(filters),
  });
  return payload(response);
};

export const createPerformanceConfig = async (data) =>
  body(await api.post(`${BASE_URL}/config`, data));

export const updatePerformanceConfig = async (id, data) =>
  body(await api.put(`${BASE_URL}/config/${id}`, data));

export const deactivatePerformanceConfig = async (id) =>
  body(await api.delete(`${BASE_URL}/config/${id}`));

export const executePerformance = async (data) =>
  body(await api.post(`${BASE_URL}/execute`, data));

export const recalculatePerformance = async (row) =>
  executePerformance({
    company_id: row.company_id,
    machine_id: row.machine_id,
    process_id: row.process_id || undefined,
    part_id: row.part_id || undefined,
    plan_id: row.plan_id || undefined,
    plan_entry_id: row.plan_entry_id || undefined,
    shift_id: Number(row.shift_id),
    business_date: String(row.business_date).slice(0, 10),
    source_system: "MES_UI_RECALCULATION",
  });

export const getPerformanceRuntime = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/runtime`, {
    params: cleanPerformanceParams(filters),
  });
  return { data: payload(response), meta: response?.data?.meta ?? {} };
};

export const getPerformanceReport = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/report`, {
    params: cleanPerformanceParams(filters),
  });
  return { data: payload(response), meta: response?.data?.meta ?? {} };
};

export const exportPerformanceReport = async (
  filters = {},
  format = "CSV",
) => {
  const response = await api.post(`${BASE_URL}/export`, {
    ...cleanPerformanceParams(filters),
    format,
  });
  return payload(response);
};

const performanceService = {
  getPerformanceMaster,
  createPerformanceFormula,
  updatePerformanceFormula,
  getPerformanceConfig,
  createPerformanceConfig,
  updatePerformanceConfig,
  deactivatePerformanceConfig,
  executePerformance,
  recalculatePerformance,
  getPerformanceRuntime,
  getPerformanceReport,
  exportPerformanceReport,
  getPerformanceFormulaRows,
  getPerformanceConfigRows,
  getPerformanceResultRows,
  cleanParams: cleanPerformanceParams,
};

export default performanceService;
