// src/services/productionCount.service.js

/**
 * ============================================================
 * OPERATEX MES
 * PRODUCTION EXECUTION
 * PRODUCTION COUNT - FRONTEND SERVICE
 * ============================================================
 *
 * BACKEND BASE ROUTE
 * ------------------------------------------------------------
 *
 * /api/production-count
 *
 * src/services/api.js already handles /api.
 *
 * Therefore this file uses:
 *
 * /production-count
 *
 * ------------------------------------------------------------
 * APIs
 * ------------------------------------------------------------
 *
 * CONFIG
 *
 * GET    /config
 * POST   /config
 *
 *
 * MASTER / CONFIG CRUD
 *
 * GET    /master
 * POST   /master
 * PUT    /master/:id
 * DELETE /master/:id
 *
 *
 * RUNTIME
 *
 * GET    /runtime
 * GET    /runtime/event/:id
 * POST   /execute
 *
 *
 * REPORT
 *
 * GET    /report
 * POST   /export
 *
 *
 * SUMMARY
 *
 * GET    /summary/plan-entry/:id
 * GET    /summary/plan/:id
 *
 *
 * CONFIG RESOLUTION
 *
 * GET    /final-output-config
 * GET    /effective-config
 *
 * ------------------------------------------------------------
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * production_count_config:
 *
 * CREATE       ✅
 * READ         ✅
 * UPDATE       ✅
 * SOFT DELETE  ✅
 *
 *
 * production_event:
 *
 * CREATE       ✅ through /execute
 * READ         ✅
 * UPDATE       ❌
 * DELETE       ❌
 *
 * ============================================================
 */


import api from "../../../../shared/api/client.js";


// ============================================================
// BASE URL
// ============================================================

const BASE_URL =
    "/production-count";


// ============================================================
// CONSTANTS
// ============================================================

export const PRODUCTION_COUNT_SCOPES = {

    PROCESS:
        "PROCESS",

    FINAL_OUTPUT:
        "FINAL_OUTPUT",
};


export const PRODUCTION_COUNT_MODES = {

    SIGNAL_EDGE:
        "SIGNAL_EDGE",

    MANUAL:
        "MANUAL",

    API:
        "API",
};


// ============================================================
// GENERIC HELPERS
// ============================================================

const hasValue =
    value =>
        value !== undefined &&
        value !== null &&
        value !== "";


// ============================================================
// CLEAN QUERY PARAMS
// ============================================================

export const cleanProductionCountParams =
    (
        params = {}
    ) => {

        return Object.fromEntries(

            Object
                .entries(
                    params
                )
                .filter(
                    (
                        [
                            ,
                            value
                        ]
                    ) =>
                        hasValue(
                            value
                        )
                )
        );
    };


// ============================================================
// RESPONSE HELPERS
// ============================================================

export const getProductionCountResponseData =
    response =>
        response?.data ??
        null;


export const getProductionCountPayload =
    response =>
        response?.data?.data ??
        null;


export const getProductionCountMeta =
    response =>
        response?.data?.meta ??
        {};


// ============================================================
// ROW EXTRACTION HELPERS
// ============================================================

export const getProductionCountConfigRows =
    data => {

        if (
            Array.isArray(
                data
            )
        ) {
            return data;
        }


        if (
            Array.isArray(
                data
                    ?.production_count_config
            )
        ) {
            return data
                .production_count_config;
        }


        return [];
    };


export const getProductionEventRows =
    data => {

        if (
            Array.isArray(
                data
            )
        ) {
            return data;
        }


        if (
            Array.isArray(
                data
                    ?.production_event
            )
        ) {
            return data
                .production_event;
        }


        return [];
    };


// ============================================================
// 1. GET CONFIG
//
// GET /production-count/config
//
// Backend defaults is_active=true when not supplied.
// ============================================================

export const getProductionCountConfig =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/config`,
                {
                    params:
                        cleanProductionCountParams(
                            filters
                        ),
                }
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 2. SAVE CONFIG
//
// POST /production-count/config
//
// CREATE:
// production_count_config_id absent
//
// UPDATE:
// production_count_config_id supplied
// ============================================================

export const saveProductionCountConfig =
    async payload => {

        const response =
            await api.post(
                `${BASE_URL}/config`,
                payload
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 3. GET MASTER
//
// GET /production-count/master
//
// Production Count has no separate reference master.
//
// This returns:
// {
//    production_count_config: []
// }
// ============================================================

export const getProductionCountMaster =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/master`,
                {
                    params:
                        cleanProductionCountParams(
                            filters
                        ),
                }
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 4. CREATE CONFIG MASTER
//
// POST /production-count/master
// ============================================================

export const createProductionCountConfig =
    async payload => {

        const response =
            await api.post(
                `${BASE_URL}/master`,
                payload
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 5. UPDATE CONFIG MASTER
//
// PUT /production-count/master/:id
// ============================================================

export const updateProductionCountConfig =
    async (
        productionCountConfigId,
        payload
    ) => {

        const response =
            await api.put(
                `${BASE_URL}/master/${productionCountConfigId}`,
                payload
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 6. SOFT DELETE CONFIG
//
// DELETE /production-count/master/:id
//
// Backend performs:
//
// is_active = FALSE
//
// No physical SQL DELETE.
// ============================================================

export const softDeleteProductionCountConfig =
    async productionCountConfigId => {

        const response =
            await api.delete(
                `${BASE_URL}/master/${productionCountConfigId}`
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 7. GET RUNTIME EVENTS
//
// GET /production-count/runtime
//
// Filters:
//
// company_id
// plant_id
// line_id
// machine_id
//
// shift_id INTEGER
//
// plan_id
// plan_entry_id
// part_id
// process_id
// unit_id
//
// event_type
// count_scope
// result_status
// source_system
// correlation_id
// idempotency_key
//
// from_timestamp
// to_timestamp
// ============================================================

export const getProductionCountRuntime =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/runtime`,
                {
                    params:
                        cleanProductionCountParams(
                            filters
                        ),
                }
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 8. GET PRODUCTION EVENT BY ID
//
// GET /production-count/runtime/event/:id
//
// READ ONLY
// ============================================================

export const getProductionEventById =
    async eventId => {

        const response =
            await api.get(
                `${BASE_URL}/runtime/event/${eventId}`
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 9. EXECUTE PRODUCTION COUNT
//
// POST /production-count/execute
//
// IMPORTANT:
//
// Frontend does not decide final stored:
//
// count_qty
// count_scope
//
// Backend resolves them using production_count_config.
//
// Typical payload:
//
// {
//   company_id,
//   plant_id,
//   line_id,
//   machine_id,
//
//   shift_id,
//
//   plan_id,
//   plan_entry_id,
//
//   part_id,
//   process_id,
//
//   unit_id,
//
//   result_status,
//
//   production_count_config_id,
//   event_type,
//   count_scope,
//   cycle_time_ms,
//   event_ts,
//   source_system,
//   correlation_id,
//   idempotency_key
// }
// ============================================================

export const executeProductionCount =
    async payload => {

        const response =
            await api.post(
                `${BASE_URL}/execute`,
                payload
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 10. EXECUTE RAW RESPONSE
//
// Useful when frontend needs:
//
// success
// message
// errors
// meta
//
// Especially useful for identifying:
//
// idempotent = true
// ============================================================

export const executeProductionCountResponse =
    async payload => {

        const response =
            await api.post(
                `${BASE_URL}/execute`,
                payload
            );


        return getProductionCountResponseData(
            response
        );
    };


// ============================================================
// 11. GET REPORT
//
// GET /production-count/report
//
// Returns:
//
// {
//     data: {
//         production_event: []
//     },
//
//     meta: {
//         total_events,
//         total_count_qty,
//         process_qty,
//         final_output_qty,
//         finished_qty,
//         event_type_counts,
//         result_counts,
//         machine_event_counts,
//         machine_quantity
//     }
// }
// ============================================================

export const getProductionCountReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/report`,
                {
                    params:
                        cleanProductionCountParams(
                            filters
                        ),
                }
            );


        return {

            data:
                getProductionCountPayload(
                    response
                ),

            meta:
                getProductionCountMeta(
                    response
                ),
        };
    };


// ============================================================
// 12. EXPORT DATA
//
// POST /production-count/export
//
// Current backend returns the validated export dataset.
//
// It does NOT yet return physical CSV/XLSX bytes.
// ============================================================

export const exportProductionCountReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/export`,
                cleanProductionCountParams(
                    filters
                )
            );


        return {

            data:
                getProductionCountPayload(
                    response
                ),

            meta:
                getProductionCountMeta(
                    response
                ),
        };
    };


// ============================================================
// 13. PLAN ENTRY SUMMARY
//
// GET /production-count/summary/plan-entry/:id
//
// Returns:
//
// plan_entry_id
// event_count
// process_qty
// final_output_qty
// finished_qty
// first_event_ts
// last_event_ts
// ============================================================

export const getPlanEntryProductionSummary =
    async planEntryId => {

        const response =
            await api.get(
                `${BASE_URL}/summary/plan-entry/${planEntryId}`
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 14. PLAN SUMMARY
//
// GET /production-count/summary/plan/:id
//
// IMPORTANT:
//
// finished_qty = FINAL_OUTPUT quantity only.
// ============================================================

export const getPlanProductionSummary =
    async planId => {

        const response =
            await api.get(
                `${BASE_URL}/summary/plan/${planId}`
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 15. ACTIVE FINAL OUTPUT CONFIG
//
// GET /production-count/final-output-config
//
// Required:
//
// company_id
// line_id
//
// Returns:
//
// {
//    production_count_config: []
// }
// ============================================================

export const getActiveFinalOutputConfigs =
    async (
        companyIdOrFilters,
        lineId = null
    ) => {

        let filters;


        if (
            typeof companyIdOrFilters ===
            "object" &&
            companyIdOrFilters !==
            null
        ) {

            filters =
                companyIdOrFilters;

        }
        else {

            filters = {

                company_id:
                    companyIdOrFilters,

                line_id:
                    lineId,
            };
        }


        const response =
            await api.get(
                `${BASE_URL}/final-output-config`,
                {
                    params:
                        cleanProductionCountParams(
                            filters
                        ),
                }
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 16. EFFECTIVE CONFIG
//
// GET /production-count/effective-config
//
// Required:
//
// company_id
// machine_id
// count_scope
//
// Optional:
//
// process_id
// effective_at
//
// Useful for:
//
// manual test
// simulator
// Data Logger
// ============================================================

export const getEffectiveProductionCountConfig =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/effective-config`,
                {
                    params:
                        cleanProductionCountParams(
                            filters
                        ),
                }
            );


        return getProductionCountPayload(
            response
        );
    };


// ============================================================
// 17. CONFIG CONVENIENCE - CREATE
// ============================================================

export const createProcessCountConfig =
    async (
        data = {}
    ) => {

        return createProductionCountConfig({

            ...data,

            count_scope:
                PRODUCTION_COUNT_SCOPES
                    .PROCESS,
        });
    };


// ============================================================
// 18. CONFIG CONVENIENCE - FINAL OUTPUT
// ============================================================

export const createFinalOutputCountConfig =
    async (
        data = {}
    ) => {

        return createProductionCountConfig({

            ...data,

            count_scope:
                PRODUCTION_COUNT_SCOPES
                    .FINAL_OUTPUT,
        });
    };


// ============================================================
// 19. RUNTIME FILTER NORMALIZER
//
// Converts datetime-local values into ISO timestamps.
//
// Example:
//
// 2026-09-02T13:30
//
// becomes:
//
// ISO timestamp
// ============================================================

export const normalizeProductionCountRuntimeFilters =
    (
        filters = {}
    ) => {

        const normalized = {
            ...filters,
        };


        if (
            hasValue(
                normalized.from_timestamp
            )
        ) {

            const from =
                new Date(
                    normalized.from_timestamp
                );


            if (
                !Number.isNaN(
                    from.getTime()
                )
            ) {

                normalized.from_timestamp =
                    from.toISOString();
            }
        }


        if (
            hasValue(
                normalized.to_timestamp
            )
        ) {

            const to =
                new Date(
                    normalized.to_timestamp
                );


            if (
                !Number.isNaN(
                    to.getTime()
                )
            ) {

                normalized.to_timestamp =
                    to.toISOString();
            }
        }


        return normalized;
    };


// ============================================================
// 20. CONFIG LOOKUP HELPERS
// ============================================================

export const findProductionCountConfigById =
    (
        configs = [],
        productionCountConfigId
    ) => {

        return configs.find(
            config =>
                String(
                    config
                        ?.production_count_config_id ??
                    ""
                ) ===
                String(
                    productionCountConfigId ??
                    ""
                )
        ) || null;
    };


export const getProcessCountConfigs =
    (
        configs = []
    ) => {

        return configs.filter(
            config =>
                String(
                    config?.count_scope ||
                    ""
                )
                    .toUpperCase() ===
                PRODUCTION_COUNT_SCOPES
                    .PROCESS
        );
    };


export const getFinalOutputCountConfigs =
    (
        configs = []
    ) => {

        return configs.filter(
            config =>
                String(
                    config?.count_scope ||
                    ""
                )
                    .toUpperCase() ===
                PRODUCTION_COUNT_SCOPES
                    .FINAL_OUTPUT
        );
    };


// ============================================================
// 21. REPORT HELPERS
// ============================================================

export const getFinishedQuantity =
    reportMeta => {

        return Number(
            reportMeta
                ?.finished_qty ??
            reportMeta
                ?.final_output_qty ??
            0
        );
    };


export const getProcessQuantity =
    reportMeta => {

        return Number(
            reportMeta
                ?.process_qty ??
            0
        );
    };


export const getFinalOutputQuantity =
    reportMeta => {

        return Number(
            reportMeta
                ?.final_output_qty ??
            0
        );
    };


// ============================================================
// 22. RAW RESPONSE METHODS
//
// Useful for pages that need backend message/errors.
// ============================================================

export const getProductionCountConfigResponse =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/config`,
                {
                    params:
                        cleanProductionCountParams(
                            filters
                        ),
                }
            );


        return getProductionCountResponseData(
            response
        );
    };


export const getProductionCountRuntimeResponse =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/runtime`,
                {
                    params:
                        cleanProductionCountParams(
                            filters
                        ),
                }
            );


        return getProductionCountResponseData(
            response
        );
    };


export const getProductionCountReportResponse =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/report`,
                {
                    params:
                        cleanProductionCountParams(
                            filters
                        ),
                }
            );


        return getProductionCountResponseData(
            response
        );
    };


// ============================================================
// DEFAULT EXPORT
// ============================================================

const productionCountService = {

    // ========================================================
    // CONSTANTS
    // ========================================================

    SCOPES:
        PRODUCTION_COUNT_SCOPES,

    MODES:
        PRODUCTION_COUNT_MODES,


    // ========================================================
    // CONFIG
    // ========================================================

    getConfig:
        getProductionCountConfig,

    saveConfig:
        saveProductionCountConfig,


    // ========================================================
    // MASTER / CONFIG CRUD
    // ========================================================

    getMaster:
        getProductionCountMaster,

    createMaster:
        createProductionCountConfig,

    updateMaster:
        updateProductionCountConfig,

    softDeleteMaster:
        softDeleteProductionCountConfig,


    // ========================================================
    // CONVENIENCE CONFIG
    // ========================================================

    createProcessCountConfig,

    createFinalOutputCountConfig,


    // ========================================================
    // RUNTIME
    // ========================================================

    getRuntime:
        getProductionCountRuntime,

    getProductionEventById,

    execute:
        executeProductionCount,


    // ========================================================
    // REPORT / EXPORT
    // ========================================================

    getReport:
        getProductionCountReport,

    exportReport:
        exportProductionCountReport,


    // ========================================================
    // SUMMARY
    // ========================================================

    getPlanEntrySummary:
        getPlanEntryProductionSummary,

    getPlanSummary:
        getPlanProductionSummary,


    // ========================================================
    // CONFIG RESOLUTION
    // ========================================================

    getActiveFinalOutputConfigs,

    getEffectiveConfig:
        getEffectiveProductionCountConfig,


    // ========================================================
    // EXTRACTION HELPERS
    // ========================================================

    getConfigRows:
        getProductionCountConfigRows,

    getEventRows:
        getProductionEventRows,


    // ========================================================
    // FILTER HELPERS
    // ========================================================

    cleanParams:
        cleanProductionCountParams,

    normalizeRuntimeFilters:
        normalizeProductionCountRuntimeFilters,


    // ========================================================
    // LOOKUP HELPERS
    // ========================================================

    findConfigById:
        findProductionCountConfigById,

    getProcessConfigs:
        getProcessCountConfigs,

    getFinalOutputConfigs:
        getFinalOutputCountConfigs,


    // ========================================================
    // QUANTITY HELPERS
    // ========================================================

    getFinishedQuantity,

    getProcessQuantity,

    getFinalOutputQuantity,
};


// ============================================================
// EXPORT
// ============================================================

export default productionCountService;