
import api from "../../../../shared/api/client.js";

const BASE = "/setup-approval";

function unwrap(response) {
  const body = response.data;

  if (body?.success === false) {
    throw new Error(body.message || "Setup Approval request failed");
  }

  return body?.data ?? null;
}

const get = async (path, params) =>
  unwrap(await api.get(`${BASE}${path}`, { params }));

const post = async (path, body) =>
  unwrap(await api.post(`${BASE}${path}`, body));

const put = async (path, body) =>
  unwrap(await api.put(`${BASE}${path}`, body));

const remove = async (path) =>
  unwrap(await api.delete(`${BASE}${path}`));

export const setupApprovalService = {
  // Dashboard and dropdowns
  runtime: (decision) =>
    get("/runtime", decision ? { decision } : undefined),

  report: (filters = {}) =>
    get("/report", filters),

  selectionOptions: () =>
    get("/selection-options"),

  // Setup rules
  config: (includeInactive = true) =>
    get("/config", { includeInactive }),

  createRule: (body) =>
    post("/config", body),

  updateRule: (id, body) =>
    put(`/config/${encodeURIComponent(id)}`, body),

  deleteRule: (id) =>
    remove(`/config/${encodeURIComponent(id)}`),

  // Approval workflows
  workflows: (includeInactive = true) =>
    get("/workflow", { includeInactive }),

  createWorkflow: (body) =>
    post("/workflow", body),

  deleteWorkflow: (id) =>
    remove(`/workflow/${encodeURIComponent(id)}`),

  // Setup templates
  createTemplate: (body) =>
    post("/template", body),

  templateSteps: (templateId) =>
    get(`/template/${encodeURIComponent(templateId)}/steps`),

  createStep: (templateId, body) =>
    post(
      `/template/${encodeURIComponent(templateId)}/step`,
      body
    ),

  updateStep: (templateId, stepId, body) =>
    put(
      `/template/${encodeURIComponent(templateId)}/step/` +
        encodeURIComponent(stepId),
      body
    ),

  deleteStep: (templateId, stepId) =>
    remove(
      `/template/${encodeURIComponent(templateId)}/step/` +
        encodeURIComponent(stepId)
    ),

  // Setup inspection
  createActivityExecution: (body) =>
    post("/activity-execution", body),

  results: (executionId) =>
    get(
      `/activity-execution/${encodeURIComponent(executionId)}/results`
    ),

  saveResult: (executionId, body) =>
    post(
      `/activity-execution/${encodeURIComponent(executionId)}/result`,
      body
    ),

  completeExecution: (executionId) =>
    post(
      `/activity-execution/${encodeURIComponent(executionId)}/complete`,
      {}
    ),

  // Approval request and decision
  execute: (body) =>
    post("/execute", body),

  decide: (approvalId, decision, remarks) =>
    put(
      `/approval/${encodeURIComponent(approvalId)}`,
      { decision, remarks }
    ),
};

export default setupApprovalService;
