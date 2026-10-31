
import api from "../../../../shared/api/client.js";

// ==========================================================
// OPERATEX MES - TOOL REPLACEMENT API SERVICE
//
// Backend base:
// /api/tool-replacement
//
// Axios instance handles:
// - API base URL
// - JWT authorization
// - Common request/response interceptors
//
// Existing APIs: 7
// New read-only APIs: 2
// Total backend endpoints: 9
// ==========================================================

const BASE_URL = "/tool-replacement";

// ==========================================================
// COMMON HELPERS
// ==========================================================

const REQUEST_ID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requestUrl(requestId, action) {
    const id = String(requestId ?? "").trim();

    if (!REQUEST_ID_PATTERN.test(id)) {
        throw new Error(
            "A valid Tool Replacement request ID is required"
        );
    }

    return `${BASE_URL}/requests/${encodeURIComponent(id)}/${action}`;
}

// ==========================================================
// GENERATE REPLACEMENT IDEMPOTENCY KEY
//
// Generate once per operation.
// Reuse the same key when retrying that operation.
// ==========================================================

export function createReplacementIdempotencyKey() {
    if (
        typeof crypto === "undefined" ||
        typeof crypto.randomUUID !== "function"
    ) {
        throw new Error(
            "Secure UUID generation is unavailable"
        );
    }

    return crypto.randomUUID();
}

// ==========================================================
// 1. GET REPLACEMENT REASONS - EXISTING
//
// GET /api/tool-replacement/reasons
// ==========================================================

export function getReplacementReasons(companyId) {
    return api.get(
        `${BASE_URL}/reasons`,
        {
            params: {
                company_id: companyId
            }
        }
    );
}

// ==========================================================
// 2. GET TOOL CHANGE RULES - EXISTING
//
// GET /api/tool-replacement/rules
//
// filters:
// company_id  - required
// machine_id  - optional
// tool_id     - optional
// part_id     - optional
// tool_number - optional
// ==========================================================

export function getReplacementRules(filters) {
    return api.get(
        `${BASE_URL}/rules`,
        {
            params: filters
        }
    );
}

// ==========================================================
// 3. GET ELIGIBLE APPROVERS - EXISTING
//
// GET /api/tool-replacement/eligible-approvers
//
// Backend checks:
// - Active approval workflow
// - Role permissions
// - Skill Matrix
// - Valid certification
// ==========================================================

export function getEligibleReplacementApprovers(filters) {
    return api.get(
        `${BASE_URL}/eligible-approvers`,
        {
            params: filters
        }
    );
}

// ==========================================================
// 4. REQUEST TOOL REPLACEMENT - EXISTING
//
// POST /api/tool-replacement/requests
//
// Requester comes from authenticated JWT.
//
// Creates REQUESTED event only.
// Does not change Tool Life.
// ==========================================================

export function requestToolReplacement(data) {
    return api.post(
        `${BASE_URL}/requests`,
        data
    );
}

// ==========================================================
// 5. APPROVE TOOL REPLACEMENT - EXISTING
//
// POST /api/tool-replacement/requests/:requestId/approve
//
// Body:
// - idempotency_key
// - remarks (optional)
//
// Backend verifies approver authorization.
// ==========================================================

export function approveToolReplacement(requestId, data) {
    return api.post(
        requestUrl(requestId, "approve"),
        data
    );
}

// ==========================================================
// 6. EXECUTE TOOL REPLACEMENT - EXISTING
//
// POST /api/tool-replacement/requests/:requestId/execute
//
// Body:
// - idempotency_key
// - old_tool_serial (optional)
// - new_tool_serial (optional)
// - remarks (optional)
//
// Backend performs transaction:
// - Close old Tool Life
// - Create new Tool Life
// - Record EXECUTED event
//
// Frontend must never reset Tool Life directly.
// ==========================================================

export function executeToolReplacement(requestId, data) {
    return api.post(
        requestUrl(requestId, "execute"),
        data
    );
}

// ==========================================================
// 7. REJECT TOOL REPLACEMENT - EXISTING
//
// POST /api/tool-replacement/requests/:requestId/reject
//
// Body:
// - idempotency_key
// - remarks (required)
//
// Rejecting user comes from JWT.
// No Tool Life changes.
// ==========================================================

export function rejectToolReplacement(requestId, data) {
    return api.post(
        requestUrl(requestId, "reject"),
        data
    );
}

// ==========================================================
// 8. GET TOOL REPLACEMENT REQUESTS - NEW
//
// GET /api/tool-replacement/requests
//
// Required filter:
// company_id
//
// Optional filters:
// scope:
//   MY_REQUESTS
//   ASSIGNED_TO_ME
//   ALL
//
// status:
//   ALL
//   OPEN
//   REQUESTED
//   APPROVED
//   REJECTED
//   EXECUTED
//
// machine_id
// tool_id
// tool_number
// limit
// offset
//
// Backend applies JWT-based user filtering.
//
// ALL scope requires server-side
// TOOL_REPLACEMENT_VIEW_ALL permission.
// ==========================================================

export function getReplacementRequests(filters) {
    if (
        !filters ||
        typeof filters !== "object" ||
        !filters.company_id
    ) {
        throw new Error(
            "Company ID is required to fetch replacement requests"
        );
    }

    return api.get(
        `${BASE_URL}/requests`,
        {
            params: {
                company_id: filters.company_id,

                scope:
                    filters.scope ?? "MY_REQUESTS",

                status:
                    filters.status ?? "ALL",

                ...(filters.machine_id
                    ? { machine_id: filters.machine_id }
                    : {}),

                ...(filters.tool_id
                    ? { tool_id: filters.tool_id }
                    : {}),

                ...(filters.tool_number
                    ? { tool_number: filters.tool_number }
                    : {}),

                limit:
                    filters.limit ?? 25,

                offset:
                    filters.offset ?? 0
            }
        }
    );
}

// ==========================================================
// 9. GET REPLACEMENT REQUEST EVENT HISTORY - NEW
//
// GET /api/tool-replacement/requests/:requestId/events
//
// Required:
// - requestId
// - companyId
//
// Returns REQUESTED / APPROVED / REJECTED / EXECUTED
// events in chronological order.
//
// Backend enforces request-level authorization.
//
// Read-only; no Tool Life updates.
// ==========================================================

export function getReplacementRequestEvents(
    requestId,
    companyId
) {
    if (!companyId) {
        throw new Error(
            "Company ID is required to fetch replacement history"
        );
    }

    return api.get(
        requestUrl(requestId, "events"),
        {
            params: {
                company_id: companyId
            }
        }
    );
}

// ==========================================================
// DEFAULT EXPORT
//
// Preserve existing method names.
// Add only the two new API methods.
// ==========================================================

const toolReplacementService = {
    // Existing APIs
    getReplacementReasons,
    getReplacementRules,
    getEligibleReplacementApprovers,
    requestToolReplacement,
    approveToolReplacement,
    executeToolReplacement,
    rejectToolReplacement,

    // New APIs
    getReplacementRequests,
    getReplacementRequestEvents,

    // Utility
    createReplacementIdempotencyKey
};

export default toolReplacementService;
