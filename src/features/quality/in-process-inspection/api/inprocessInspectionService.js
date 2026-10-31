import api from "../../../../shared/api/client.js";

const BASE_URL = "/in-process-inspection";

// =====================================================
// INSPECTION TEMPLATES
// =====================================================

function getTemplates(includeInactive = false) {
    return api.get(`${BASE_URL}/master`, {
        params: { includeInactive }
    });
}

function createTemplate(data) {
    return api.post(`${BASE_URL}/master`, data);
}

function updateTemplate(templateId, data) {
    return api.put(
        `${BASE_URL}/master/${templateId}`,
        data
    );
}

function deleteTemplate(templateId) {
    return api.delete(
        `${BASE_URL}/master/${templateId}`
    );
}

// =====================================================
// INSPECTION CHECKPOINTS
// Step numbers are assigned by the backend.
// =====================================================

function getSteps(templateId) {
    return api.get(
        `${BASE_URL}/master/${templateId}/steps`
    );
}

function createStep(templateId, data) {
    return api.post(
        `${BASE_URL}/master/${templateId}/steps`,
        data
    );
}

function updateStep(templateId, stepId, data) {
    return api.put(
        `${BASE_URL}/master/${templateId}/steps/${stepId}`,
        data
    );
}

function deleteStep(templateId, stepId) {
    return api.delete(
        `${BASE_URL}/master/${templateId}/steps/${stepId}`
    );
}

// =====================================================
// QUALITY PLANS
// Connect templates to machines and optional parts/processes.
// =====================================================

function getPlans(includeInactive = false) {
    return api.get(`${BASE_URL}/config`, {
        params: { includeInactive }
    });
}

function createPlan(data) {
    return api.post(`${BASE_URL}/config`, data);
}

function updatePlan(planId, data) {
    return api.put(
        `${BASE_URL}/config/${planId}`,
        data
    );
}

function deletePlan(planId) {
    return api.delete(
        `${BASE_URL}/config/${planId}`
    );
}

// =====================================================
// INSPECTION RUNS
// =====================================================

function getRuns(filters = {}) {
    return api.get(`${BASE_URL}/runtime`, {
        params: filters
    });
}

function getRun(runId) {
    return api.get(
        `${BASE_URL}/runtime/${runId}`
    );
}

function startRun(data) {
    return api.post(`${BASE_URL}/execute`, data);
}

// Saves draft measurements.
// data must contain: { results: [...] }
function saveAnswers(runId, data) {
    return api.put(
        `${BASE_URL}/runtime/${runId}/answers`,
        data
    );
}

// Submits final measurements.
// data must contain: { results: [...] }
function submitRun(runId, data) {
    return api.post(
        `${BASE_URL}/runtime/${runId}/submit`,
        data
    );
}

// Cancels a running inspection.
function cancelRun(runId) {
    return api.post(
        `${BASE_URL}/runtime/${runId}/cancel`,
        {}
    );
}

// =====================================================
// APPROVAL
// Used only when the quality plan has a workflow.
// =====================================================

function decideApproval(approvalId, data) {
    return api.put(
        `${BASE_URL}/approval/${approvalId}`,
        data
    );
}

// =====================================================
// REPORTS
// =====================================================

function getReport(filters = {}) {
    return api.get(`${BASE_URL}/report`, {
        params: filters
    });
}

// =====================================================
// EXPORT SERVICE
// =====================================================

const inprocessInspectionService = {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,

    getSteps,
    createStep,
    updateStep,
    deleteStep,

    getPlans,
    createPlan,
    updatePlan,
    deletePlan,

    getRuns,
    getRun,
    startRun,
    saveAnswers,
    submitRun,
    cancelRun,

    decideApproval,

    getReport
};

export default inprocessInspectionService;