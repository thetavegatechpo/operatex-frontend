
import api from "../../../../shared/api/client.js";

const BASE = "/gauge-spc";
const enc = value => encodeURIComponent(value);
const unwrap = response => response?.data?.data ?? response?.data;

const gaugeSpcService = {
  getGauges: async () =>
    unwrap(await api.get(`${BASE}/gauges`)),

  getGaugeById: async id =>
    unwrap(await api.get(`${BASE}/gauges/${enc(id)}`)),

  createGauge: async data =>
    unwrap(await api.post(`${BASE}/gauges`, data)),

  updateGauge: async (id, data) =>
    unwrap(await api.put(`${BASE}/gauges/${enc(id)}`, data)),

  getParameters: async () =>
    unwrap(await api.get(`${BASE}/parameters`)),

  getParameterById: async id =>
    unwrap(await api.get(`${BASE}/parameters/${enc(id)}`)),

  createParameter: async data =>
    unwrap(await api.post(`${BASE}/parameters`, data)),

  // Requires backend PUT endpoint before enabling edit.
  updateParameter: async (id, data) =>
    unwrap(await api.put(`${BASE}/parameters/${enc(id)}`, data)),

  deactivateParameter: async id =>
    unwrap(await api.patch(`${BASE}/parameters/${enc(id)}/deactivate`)),

  getSpcFormulas: async () =>
    unwrap(await api.get(`${BASE}/formulas`)),

  getSpcRules: async () =>
    unwrap(await api.get(`${BASE}/spc-rules`)),

  getSpcRuleById: async id =>
    unwrap(await api.get(`${BASE}/spc-rules/${enc(id)}`)),

  createSpcRule: async data =>
    unwrap(await api.post(`${BASE}/spc-rules`, data)),

  updateSpcRule: async (id, data) =>
    unwrap(await api.put(`${BASE}/spc-rules/${enc(id)}`, data)),

  deactivateSpcRule: async id =>
    unwrap(await api.patch(`${BASE}/spc-rules/${enc(id)}/deactivate`)),

  getMeasurements: async (params = {}) =>
    unwrap(await api.get(`${BASE}/measurements`, { params })),

  recordMeasurement: async data =>
    unwrap(await api.post(`${BASE}/measurements`, data)),

  getSpcResults: async (params = {}) =>
    unwrap(await api.get(`${BASE}/spc-results`, { params })),

  calculateSpc: async data =>
    unwrap(await api.post(`${BASE}/spc-results/calculate`, data)),

  getMeasurementReport: async params =>
    unwrap(await api.get(`${BASE}/reports/measurements`, { params })),

  getSpcReport: async params =>
    unwrap(await api.get(`${BASE}/reports/spc`, { params })),

  getApprovalQueue: async () =>
  unwrap(await api.get(`${BASE}/approvals`)),

getSpcResultById: async id =>
  unwrap(await api.get(`${BASE}/spc-results/${enc(id)}`)),

getApprovalHistory: async resultId =>
  unwrap(
    await api.get(
      `${BASE}/spc-results/${enc(resultId)}/approval-history`
    )
  ),

decideSpcResult: async (resultId, decision, remarks) =>
  unwrap(
    await api.post(
      `${BASE}/spc-results/${enc(resultId)}/decision`,
      {
        decision,
        remarks: remarks.trim()
      }
    )
  )
};

export default gaugeSpcService;
