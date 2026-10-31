// src/services/reworkRejectBypass.service.js

/**
 * ============================================================
 * OPERATEX MES
 * PRODUCTION EXECUTION
 * REWORK / REJECT / BYPASS
 * FRONTEND SERVICE
 * ============================================================
 *
 * Backend Base:
 *
 * /api/rework-reject-bypass
 *
 * api.js already contains the backend /api configuration,
 * therefore this file uses:
 *
 * /rework-reject-bypass
 *
 * ============================================================
 */


import api from "../../../../shared/api/client.js";


// ============================================================
// API BASE
// ============================================================

const API =
    "/rework-reject-bypass";


// ============================================================
// HELPERS
// ============================================================

const hasValue = (value) =>
    value !== undefined &&
    value !== null &&
    value !== "";


const cleanParams = (params = {}) => {

    const result = {};


    Object.entries(params || {})
        .forEach(([key, value]) => {

            if (hasValue(value)) {

                result[key] = value;
            }
        });


    return result;
};


// ============================================================
// RESPONSE HELPERS
// ============================================================

export const responseData = (response) => {

    if (
        response?.data?.data !== undefined
    ) {

        return response.data.data;
    }


    if (
        response?.data !== undefined
    ) {

        return response.data;
    }


    return response;
};


export const responseRows = (response) => {

    const data =
        responseData(response);


    if (
        Array.isArray(data)
    ) {

        return data;
    }


    return [];
};


export const responseMeta = (response) => {

    const data =
        responseData(response);


    // Handles backend response:
    // response.data.data.meta
    if (
        data?.meta &&
        typeof data.meta === "object"
    ) {

        return data.meta;
    }


    // Backward-compatible response:
    // response.data.meta
    if (
        response?.data?.meta &&
        typeof response.data.meta === "object"
    ) {

        return response.data.meta;
    }


    return {};
};

export const getErrorMessage = (
    error,
    fallback = "Something went wrong."
) => {

    const response =
        error?.response?.data;


    if (
        Array.isArray(response?.errors) &&
        response.errors.length > 0
    ) {

        return `${
            response.message ||
            "Validation failed."
        } ${response.errors.join(", ")}`;
    }


    return (
        response?.message ||
        error?.message ||
        fallback
    );
};


// ============================================================
// UI CONVENIENCE VALUES
//
// These are frontend convenience lists.
// They are NOT PostgreSQL ENUM definitions.
// ============================================================


// ------------------------------------------------------------
// Rejection reason statuses
// ------------------------------------------------------------

export const REJECTION_REASON_STATUS = [

    {
        value: "ACTIVE",
        label: "Active"
    },

    {
        value: "INACTIVE",
        label: "Inactive"
    }
];


// ------------------------------------------------------------
// Common rejection categories
//
// UI convenience only.
// User can still enter/configure another category if needed.
// ------------------------------------------------------------

export const REJECTION_REASON_CATEGORIES = [

    {
        value: "PROCESS",
        label: "Process"
    },

    {
        value: "QUALITY",
        label: "Quality"
    },

    {
        value: "MATERIAL",
        label: "Material"
    },

    {
        value: "MACHINE",
        label: "Machine"
    },

    {
        value: "OPERATOR",
        label: "Operator"
    },

    {
        value: "OTHER",
        label: "Other"
    }
];


// ------------------------------------------------------------
// Rejection result convenience
// ------------------------------------------------------------

export const REJECTION_RESULT_STATUS = [

    {
        value: "REJECTED",
        label: "Rejected"
    },

    {
        value: "NOK",
        label: "NOK"
    }
];


// ------------------------------------------------------------
// Rework event types
// ------------------------------------------------------------

export const REWORK_EVENT_TYPES = [

    {
        value: "REWORK_STARTED",
        label: "Rework Started"
    },

    {
        value: "REWORK_COMPLETED",
        label: "Rework Completed"
    },

    {
        value: "REWORK_FAILED",
        label: "Rework Failed"
    }
];


// ------------------------------------------------------------
// Rework result status
// ------------------------------------------------------------

export const REWORK_RESULT_STATUS = [

    {
        value: "PENDING",
        label: "Pending"
    },

    {
        value: "OK",
        label: "OK"
    },

    {
        value: "NOK",
        label: "NOK"
    }
];


// ------------------------------------------------------------
// Bypass lifecycle
// ------------------------------------------------------------

export const BYPASS_EVENT_TYPES = [

    {
        value: "REQUESTED",
        label: "Requested"
    },

    {
        value: "APPROVED",
        label: "Approved"
    },

    {
        value: "ACTIVATED",
        label: "Activated"
    },

    {
        value: "EXPIRED",
        label: "Expired"
    },

    {
        value: "REVOKED",
        label: "Revoked"
    },

    {
        value: "REJECTED",
        label: "Rejected"
    }
];


// ------------------------------------------------------------
// Bypass results
// ------------------------------------------------------------

export const BYPASS_RESULT_STATUS = [

    {
        value: "PENDING",
        label: "Pending"
    },

    {
        value: "APPROVED",
        label: "Approved"
    },

    {
        value: "ACTIVE",
        label: "Active"
    },

    {
        value: "EXPIRED",
        label: "Expired"
    },

    {
        value: "REVOKED",
        label: "Revoked"
    },

    {
        value: "REJECTED",
        label: "Rejected"
    }
];


// ------------------------------------------------------------
// Unit position convenience
// ------------------------------------------------------------

export const REWORK_POSITION_STATUS = [

    {
        value: "REWORK",
        label: "Rework"
    },

    {
        value: "IN_PROCESS",
        label: "In Process"
    },

    {
        value: "WAITING",
        label: "Waiting"
    },

    {
        value: "HOLD",
        label: "Hold"
    }
];


// ============================================================
// SERVICE
// ============================================================

const reworkRejectBypassService = {


    // ========================================================
    // COMBINED MASTER
    // ========================================================

    /**
     * GET /master
     *
     * Returns:
     *
     * {
     *   rejection_reason_master: [],
     *   rework_rule_config: [],
     *   bypass_config: []
     * }
     */
    getMaster(params = {}) {

        return api.get(
            `${API}/master`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    /**
     * POST /master/:type
     *
     * type:
     *
     * rejection-reason
     * rework-rule
     * bypass-config
     */
    createMaster(
        type,
        payload
    ) {

        return api.post(
            `${API}/master/${type}`,
            payload
        );
    },


    /**
     * PUT /master/:type/:id
     */
    updateMaster(
        type,
        id,
        payload
    ) {

        return api.put(
            `${API}/master/${type}/${id}`,
            payload
        );
    },


    /**
     * DELETE /master/:type/:id
     *
     * Soft delete / deactivate only.
     */
    deleteMaster(
        type,
        id
    ) {

        return api.delete(
            `${API}/master/${type}/${id}`
        );
    },


    // ========================================================
    // COMBINED CONFIG
    // ========================================================

    /**
     * GET /config
     *
     * Active:
     *
     * rework_rule_config
     * bypass_config
     */
    getConfig(params = {}) {

        return api.get(
            `${API}/config`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    // ========================================================
    // REJECTION REASON MASTER
    // ========================================================

    /**
     * GET /rejection-reasons
     */
    getRejectionReasons(params = {}) {

        return api.get(
            `${API}/rejection-reasons`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    /**
     * GET /rejection-reasons/:id
     */
    getRejectionReasonById(id) {

        return api.get(
            `${API}/rejection-reasons/${id}`
        );
    },


    /**
     * POST /rejection-reasons
     */
    createRejectionReason(payload) {

        return api.post(
            `${API}/rejection-reasons`,
            payload
        );
    },


    /**
     * PUT /rejection-reasons/:id
     */
    updateRejectionReason(
        id,
        payload
    ) {

        return api.put(
            `${API}/rejection-reasons/${id}`,
            payload
        );
    },


    /**
     * DELETE /rejection-reasons/:id
     *
     * Backend changes status to INACTIVE.
     */
    deleteRejectionReason(id) {

        return api.delete(
            `${API}/rejection-reasons/${id}`
        );
    },


    // ========================================================
    // REWORK RULE CONFIG
    // ========================================================

    /**
     * GET /rework-rules
     */
    getReworkRules(params = {}) {

        return api.get(
            `${API}/rework-rules`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    /**
     * GET /rework-rules/:id
     */
    getReworkRuleById(id) {

        return api.get(
            `${API}/rework-rules/${id}`
        );
    },


    /**
     * POST /rework-rules
     */
    createReworkRule(payload) {

        return api.post(
            `${API}/rework-rules`,
            payload
        );
    },


    /**
     * PUT /rework-rules/:id
     */
    updateReworkRule(
        id,
        payload
    ) {

        return api.put(
            `${API}/rework-rules/${id}`,
            payload
        );
    },


    /**
     * DELETE /rework-rules/:id
     *
     * Backend:
     * is_active = FALSE
     */
    deleteReworkRule(id) {

        return api.delete(
            `${API}/rework-rules/${id}`
        );
    },


    // ========================================================
    // BYPASS CONFIG
    // ========================================================

    /**
     * GET /bypass-configs
     */
    getBypassConfigs(params = {}) {

        return api.get(
            `${API}/bypass-configs`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    /**
     * GET /bypass-configs/:id
     */
    getBypassConfigById(id) {

        return api.get(
            `${API}/bypass-configs/${id}`
        );
    },


    /**
     * POST /bypass-configs
     */
    createBypassConfig(payload) {

        return api.post(
            `${API}/bypass-configs`,
            payload
        );
    },


    /**
     * PUT /bypass-configs/:id
     */
    updateBypassConfig(
        id,
        payload
    ) {

        return api.put(
            `${API}/bypass-configs/${id}`,
            payload
        );
    },


    /**
     * DELETE /bypass-configs/:id
     *
     * Backend:
     * is_active = FALSE
     */
    deleteBypassConfig(id) {

        return api.delete(
            `${API}/bypass-configs/${id}`
        );
    },


    // ========================================================
    // REJECTION RUNTIME
    // ========================================================

    /**
     * POST /rejection
     *
     * APPEND ONLY.
     */
    createRejection(payload) {

        return api.post(
            `${API}/rejection`,
            payload
        );
    },


    /**
     * Alias.
     */
    createRejectionEvent(payload) {

        return api.post(
            `${API}/rejection`,
            payload
        );
    },


    /**
     * GET /rejections
     */
    getRejections(params = {}) {

        return api.get(
            `${API}/rejections`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    /**
     * Alias.
     */
    getRejectionEvents(params = {}) {

        return api.get(
            `${API}/rejections`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    /**
     * GET /rejections/:id
     */
    getRejectionById(id) {

        return api.get(
            `${API}/rejections/${id}`
        );
    },


    /**
     * Alias.
     */
    getRejectionEventById(id) {

        return api.get(
            `${API}/rejections/${id}`
        );
    },


    // ========================================================
    // REWORK RUNTIME
    // ========================================================

    /**
     * POST /rework
     *
     * Flow:
     *
     * rejection_event
     *       ↓
     * resolve rework rule
     *       ↓
     * append rework_event
     *       ↓
     * update unit_position
     */
    executeRework(payload) {

        return api.post(
            `${API}/rework`,
            payload
        );
    },


    /**
     * GET /reworks
     */
    getReworks(params = {}) {

        return api.get(
            `${API}/reworks`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    /**
     * Alias.
     */
    getReworkEvents(params = {}) {

        return api.get(
            `${API}/reworks`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    /**
     * GET /reworks/:id
     */
    getReworkById(id) {

        return api.get(
            `${API}/reworks/${id}`
        );
    },


    /**
     * Alias.
     */
    getReworkEventById(id) {

        return api.get(
            `${API}/reworks/${id}`
        );
    },


    // ========================================================
    // BYPASS RUNTIME
    // ========================================================

    /**
     * POST /bypass
     *
     * Every call creates NEW bypass_event evidence.
     *
     * Typical sequence:
     *
     * REQUESTED
     * APPROVED
     * ACTIVATED
     * EXPIRED / REVOKED
     */
    executeBypass(payload) {

        return api.post(
            `${API}/bypass`,
            payload
        );
    },


    /**
     * Alias.
     */
    createBypassEvent(payload) {

        return api.post(
            `${API}/bypass`,
            payload
        );
    },


    /**
     * GET /bypasses
     */
    getBypasses(params = {}) {

        return api.get(
            `${API}/bypasses`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    /**
     * Alias.
     */
    getBypassEvents(params = {}) {

        return api.get(
            `${API}/bypasses`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    /**
     * GET /bypasses/:id
     */
    getBypassById(id) {

        return api.get(
            `${API}/bypasses/${id}`
        );
    },


    /**
     * Alias.
     */
    getBypassEventById(id) {

        return api.get(
            `${API}/bypasses/${id}`
        );
    },


    // ========================================================
    // COMBINED RUNTIME
    // ========================================================

    /**
     * GET /runtime
     *
     * {
     *   rejection_event: [],
     *   rework_event: [],
     *   bypass_event: []
     * }
     */
    getRuntime(params = {}) {

        return api.get(
            `${API}/runtime`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    // ========================================================
    // SUMMARY
    // ========================================================

    /**
     * GET /summary
     *
     * company_id required.
     */
    getSummary(params = {}) {

        return api.get(
            `${API}/summary`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    // ========================================================
    // REPORT
    // ========================================================

    /**
     * GET /report
     */
    getReport(params = {}) {

        return api.get(
            `${API}/report`,
            {
                params:
                    cleanParams(params)
            }
        );
    },


    // ========================================================
    // EXPORT
    // ========================================================

    /**
     * POST /export
     */
    exportReport(payload = {}) {

        return api.post(
            `${API}/export`,
            payload
        );
    }
};


// ============================================================
// EXTRA RESPONSE EXTRACTORS
//
// Useful directly in React Query.
// ============================================================

export const getMasterData = (response) => {

    const data =
        responseData(response);


    return {

        rejectionReasons:
            Array.isArray(
                data?.rejection_reason_master
            )
                ? data.rejection_reason_master
                : [],

        reworkRules:
            Array.isArray(
                data?.rework_rule_config
            )
                ? data.rework_rule_config
                : [],

        bypassConfigs:
            Array.isArray(
                data?.bypass_config
            )
                ? data.bypass_config
                : []
    };
};


export const getRuntimeData = (response) => {

    const data =
        responseData(response);


    const rejectionEvents =
        Array.isArray(
            data?.rejection_event
        )
            ? data.rejection_event
            : [];


    const reworkEvents =
        Array.isArray(
            data?.rework_event
        )
            ? data.rework_event
            : [];


    const bypassEvents =
        Array.isArray(
            data?.bypass_event
        )
            ? data.bypass_event
            : [];


    const meta =
        data?.meta &&
        typeof data.meta === "object"
            ? data.meta
            : {};


    return {

        rejectionEvents,

        reworkEvents,

        bypassEvents,

        meta,

        // Primary value comes from backend.
        // Array length is retained for compatibility with older backend.
        rejectionEventCount:
            Number(
                meta.rejection_event_count ??
                rejectionEvents.length ??
                0
            ),

        totalRejectedQty:
            Number(
                meta.total_rejected_qty ??
                rejectionEvents.reduce(
                    (total, row) =>
                        total +
                        Number(
                            row?.qty || 0
                        ),
                    0
                )
            ),

        uniqueRejectedUnitCount:
            Number(
                meta.unique_rejected_unit_count ??
                new Set(
                    rejectionEvents
                        .filter(
                            row =>
                                row?.unit_id
                        )
                        .map(
                            row =>
                                String(
                                    row.unit_id
                                )
                        )
                ).size
            )
    };
};


export const getSummaryData = (response) => {

    const data =
        responseData(response);


    return {

        rejectionSummary:
            Array.isArray(
                data?.rejection_summary
            )
                ? data.rejection_summary
                : [],

        reworkSummary:
            Array.isArray(
                data?.rework_summary
            )
                ? data.rework_summary
                : [],

        bypassSummary:
            Array.isArray(
                data?.bypass_summary
            )
                ? data.bypass_summary
                : []
    };
};


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default reworkRejectBypassService;