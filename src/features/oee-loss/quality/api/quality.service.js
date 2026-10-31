// src/services/quality.service.js

import api from "../../../../shared/api/client.js";

const BASE_URL = "/quality";
const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

export const cleanQualityParams = (params = {}) =>
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

export const getQualityFormulaRows = (response) =>
  rowsFrom(response, ["formulas", "formula_master", "master"]);

export const getQualityConfigRows = (response) =>
  rowsFrom(response, ["quality_configs", "config"]);

export const getQualityResultRows = (response) =>
  rowsFrom(response, ["quality_results", "runtime", "report"]);

export const getQualityMaster = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/master`, {
    params: cleanQualityParams(filters),
  });
  return payload(response);
};

export const createQualityFormula = async (data) =>
  body(await api.post(`${BASE_URL}/master`, data));

export const updateQualityFormula = async (id, data) =>
  body(await api.put(`${BASE_URL}/master/${id}`, data));

export const getQualityConfig = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/config`, {
    params: cleanQualityParams(filters),
  });
  return payload(response);
};

export const createQualityConfig = async (data) =>
  body(await api.post(`${BASE_URL}/config`, data));

export const updateQualityConfig = async (id, data) =>
  body(await api.put(`${BASE_URL}/config/${id}`, data));

export const deactivateQualityConfig = async (id) =>
  body(await api.delete(`${BASE_URL}/config/${id}`));

export const executeQuality = async (data) =>
  body(await api.post(`${BASE_URL}/execute`, data));

export const recalculateQuality = async (row) =>
  executeQuality({
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

export const getQualityRuntime = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/runtime`, {
    params: cleanQualityParams(filters),
  });
  return { data: payload(response), meta: response?.data?.meta ?? {} };
};

export const getQualityReport = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/report`, {
    params: cleanQualityParams(filters),
  });
  return { data: payload(response), meta: response?.data?.meta ?? {} };
};

export const exportQualityReport = async (
  filters = {},
  format = "CSV",
) => {
  const response = await api.post(`${BASE_URL}/export`, {
    ...cleanQualityParams(filters),
    format,
  });
  return payload(response);
};

const qualityService = {
  getQualityMaster,
  createQualityFormula,
  updateQualityFormula,
  getQualityConfig,
  createQualityConfig,
  updateQualityConfig,
  deactivateQualityConfig,
  executeQuality,
  recalculateQuality,
  getQualityRuntime,
  getQualityReport,
  exportQualityReport,
  getQualityFormulaRows,
  getQualityConfigRows,
  getQualityResultRows,
  cleanParams: cleanQualityParams,
};

export default qualityService;
