// src/services/oee.service.js

import api from "../../../../shared/api/client.js";

const BASE_URL = "/oee-formula";
const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

export const cleanOeeParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => hasValue(value)),
  );

const payload = (response) => response?.data?.data ?? response?.data ?? null;
const body = (response) => response?.data ?? response;

const rowsFrom = (response, keys = []) => {
  const value = body(response);
  const data = value?.data ?? value;

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
};

export const getOeeFormulaRows = (response) =>
  rowsFrom(response, ["formulas", "formula_master", "master"]);

export const getOeeConfigRows = (response) =>
  rowsFrom(response, ["oee_configs", "config"]);

export const getOeeResultRows = (response) =>
  rowsFrom(response, ["oee_results", "runtime", "report"]);

export const getOeeMaster = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/master`, {
    params: cleanOeeParams(filters),
  });

  return payload(response);
};

export const createOeeFormula = async (data) =>
  body(await api.post(`${BASE_URL}/master`, data));

export const updateOeeFormula = async (id, data) =>
  body(await api.put(`${BASE_URL}/master/${id}`, data));

export const getOeeConfig = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/config`, {
    params: cleanOeeParams(filters),
  });

  return payload(response);
};

// Important: the existing backend exposes POST /config and requires oee_config_id.
// It updates the OEE-specific fields of an already existing oee_config row.
export const saveOeeConfig = async (data) =>
  body(await api.post(`${BASE_URL}/config`, data));

export const executeOee = async (data) =>
  body(await api.post(`${BASE_URL}/execute`, data));

export const recalculateOee = async (row) =>
  executeOee({
    company_id: row.company_id,
    machine_id: row.machine_id,
    shift_id: Number(row.shift_id),
    business_date: row.business_date,
    process_id: row.process_id || undefined,
    part_id: row.part_id || undefined,
    plan_id: row.plan_id || undefined,
    plan_entry_id: row.plan_entry_id || undefined,
    source_system: "MES_UI_OEE_RECALCULATION",
  });

export const getOeeRuntime = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/runtime`, {
    params: cleanOeeParams(filters),
  });

  return {
    data: payload(response),
    meta: response?.data?.meta ?? {},
  };
};

export const getOeeReport = async (filters = {}) => {
  const response = await api.get(`${BASE_URL}/report`, {
    params: cleanOeeParams(filters),
  });

  return {
    data: payload(response),
    meta: response?.data?.meta ?? {},
  };
};

const oeeService = {
  getOeeMaster,
  createOeeFormula,
  updateOeeFormula,
  getOeeConfig,
  saveOeeConfig,
  executeOee,
  recalculateOee,
  getOeeRuntime,
  getOeeReport,
  getOeeFormulaRows,
  getOeeConfigRows,
  getOeeResultRows,
  cleanParams: cleanOeeParams,
};

export default oeeService;
