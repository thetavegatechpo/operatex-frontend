// src/services/cycleTimeTracking.service.js

/**
 * ============================================================
 * OPERATEX MES
 * PRODUCTION EXECUTION
 * CYCLE TIME TRACKING - FRONTEND SERVICE
 * ============================================================
 *
 * BACKEND BASE:
 *
 * /api/cycle-time-tracking
 *
 * api.js already handles the /api prefix.
 *
 * ------------------------------------------------------------
 * ENDPOINTS
 * ------------------------------------------------------------
 *
 * CONFIG
 * GET    /config
 * POST   /config
 *
 * MASTER
 * GET    /master
 * POST   /master
 * PUT    /master/:id
 * DELETE /master/:id
 *
 * RUNTIME
 * GET    /runtime
 * GET    /runtime/event/:id
 * POST   /execute
 *
 * REPORT
 * GET    /report
 * POST   /export
 *
 * SUMMARY
 * GET    /summary/plan-entry/:id
 * GET    /summary/plan/:id
 * GET    /summary/machine
 *
 * EFFECTIVE CONFIG
 * GET    /effective-config
 *
 * ------------------------------------------------------------
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * cycle_event is append-only.
 *
 * Frontend should normally NOT send:
 *
 * cycle_time_ms
 * standard_cycle_ms
 *
 * Backend calculates:
 *
 * cycle_time_ms =
 *      end_ts - start_ts
 *
 * Backend snapshots:
 *
 * cycle_time_config.standard_cycle_ms
 *              ↓
 * cycle_event.standard_cycle_ms
 *
 * ============================================================
 */


import api from "../../../../shared/api/client.js";


// ============================================================
// BASE URL
// ============================================================

const BASE_URL =
    "/cycle-time-tracking";


// ============================================================
// COMMON CYCLE MODES
//
// These are frontend suggestions/convenience constants.
//
// Backend validation intentionally does not impose a hard enum.
// ============================================================

export const CYCLE_TIME_MODES = {

    START_END:
        "START_END",

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


/**
 * Removes:
 *
 * undefined
 * null
 * ""
 *
 * Preserves:
 *
 * false
 * 0
 */
export const cleanCycleTimeParams =
    (
        params = {}
    ) => {

        return Object.fromEntries(

            Object.entries(
                params
            ).filter(
                ([, value]) =>
                    hasValue(
                        value
                    )
            )
        );
    };


// ============================================================
// API RESPONSE HELPERS
// ============================================================

/**
 * Raw Axios response:
 *
 * {
 *   data: {
 *      success,
 *      message,
 *      data,
 *      errors,
 *      meta
 *   }
 * }
 */
export const getCycleTimeResponseData =
    response =>
        response?.data;


/**
 * Actual controller payload:
 *
 * response.data.data
 */
export const getCycleTimePayload =
    response =>
        response?.data?.data;


/**
 * Controller meta:
 *
 * response.data.meta
 */
export const getCycleTimeMeta =
    response =>
        response?.data?.meta;


// ============================================================
// CONFIG ROW HELPER
// ============================================================

export const getCycleTimeConfigRows =
    data => {

        if (
            Array.isArray(data)
        ) {

            return data;
        }


        if (
            Array.isArray(
                data?.cycle_time_config
            )
        ) {

            return data
                .cycle_time_config;
        }


        if (
            Array.isArray(
                data?.data
            )
        ) {

            return data.data;
        }


        if (
            Array.isArray(
                data?.data
                    ?.cycle_time_config
            )
        ) {

            return data
                .data
                .cycle_time_config;
        }


        return [];
    };


// ============================================================
// EVENT ROW HELPER
// ============================================================

export const getCycleEventRows =
    data => {

        if (
            Array.isArray(data)
        ) {

            return data;
        }


        if (
            Array.isArray(
                data?.cycle_event
            )
        ) {

            return data
                .cycle_event;
        }


        if (
            Array.isArray(
                data?.data
            )
        ) {

            return data.data;
        }


        if (
            Array.isArray(
                data?.data
                    ?.cycle_event
            )
        ) {

            return data
                .data
                .cycle_event;
        }


        return [];
    };


// ============================================================
// MACHINE SUMMARY ROW HELPER
// ============================================================

export const getMachineCycleSummaryRows =
    data => {

        if (
            Array.isArray(data)
        ) {

            return data;
        }


        if (
            Array.isArray(
                data?.machine_summary
            )
        ) {

            return data
                .machine_summary;
        }


        if (
            Array.isArray(
                data?.data
                    ?.machine_summary
            )
        ) {

            return data
                .data
                .machine_summary;
        }


        return [];
    };


// ============================================================
// DATE NORMALIZATION
// ============================================================

const toIsoIfPossible =
    value => {

        if (
            !hasValue(value)
        ) {

            return value;
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;
        }


        return date
            .toISOString();
    };


// ============================================================
// NORMALIZE CONFIG FILTERS
// ============================================================

export const normalizeCycleTimeConfigFilters =
    (
        filters = {}
    ) => {

        return cleanCycleTimeParams({

            ...filters,

            effective_at:
                hasValue(
                    filters.effective_at
                )
                    ? toIsoIfPossible(
                        filters.effective_at
                    )
                    : undefined,
        });
    };


// ============================================================
// NORMALIZE RUNTIME / REPORT FILTERS
// ============================================================

export const normalizeCycleTimeRuntimeFilters =
    (
        filters = {}
    ) => {

        return cleanCycleTimeParams({

            ...filters,

            from_timestamp:
                hasValue(
                    filters.from_timestamp
                )
                    ? toIsoIfPossible(
                        filters.from_timestamp
                    )
                    : undefined,

            to_timestamp:
                hasValue(
                    filters.to_timestamp
                )
                    ? toIsoIfPossible(
                        filters.to_timestamp
                    )
                    : undefined,
        });
    };


// ============================================================
// NORMALIZE CONFIG PAYLOAD
// ============================================================

export const normalizeCycleTimeConfigPayload =
    (
        data = {}
    ) => {

        const payload = {

            ...data,
        };


        if (
            hasValue(
                payload.cycle_mode
            )
        ) {

            payload.cycle_mode =
                String(
                    payload.cycle_mode
                )
                    .trim()
                    .toUpperCase();
        }


        if (
            hasValue(
                payload.standard_cycle_ms
            )
        ) {

            payload.standard_cycle_ms =
                Number(
                    payload.standard_cycle_ms
                );
        }


        if (
            hasValue(
                payload.version_no
            )
        ) {

            payload.version_no =
                Number(
                    payload.version_no
                );
        }


        if (
            hasValue(
                payload.effective_from
            )
        ) {

            payload.effective_from =
                toIsoIfPossible(
                    payload.effective_from
                );
        }


        if (
            hasValue(
                payload.effective_to
            )
        ) {

            payload.effective_to =
                toIsoIfPossible(
                    payload.effective_to
                );
        }


        // Keep nullable config IDs explicitly nullable.

        if (
            !hasValue(
                payload.start_signal_id
            )
        ) {

            payload.start_signal_id =
                null;
        }


        if (
            !hasValue(
                payload.end_signal_id
            )
        ) {

            payload.end_signal_id =
                null;
        }


        if (
            !hasValue(
                payload.result_signal_id
            )
        ) {

            payload.result_signal_id =
                null;
        }


        if (
            !hasValue(
                payload.effective_from
            )
        ) {

            payload.effective_from =
                null;
        }


        if (
            !hasValue(
                payload.effective_to
            )
        ) {

            payload.effective_to =
                null;
        }


        return payload;
    };


// ============================================================
// NORMALIZE EXECUTION PAYLOAD
// ============================================================

export const normalizeCycleExecutionPayload =
    (
        data = {}
    ) => {

        const payload = {

            ...data,
        };


        if (
            hasValue(
                payload.shift_id
            )
        ) {

            payload.shift_id =
                Number(
                    payload.shift_id
                );
        }


        if (
            hasValue(
                payload.start_ts
            )
        ) {

            payload.start_ts =
                toIsoIfPossible(
                    payload.start_ts
                );
        }


        if (
            hasValue(
                payload.end_ts
            )
        ) {

            payload.end_ts =
                toIsoIfPossible(
                    payload.end_ts
                );
        }


        if (
            hasValue(
                payload.cycle_time_ms
            )
        ) {

            payload.cycle_time_ms =
                Number(
                    payload.cycle_time_ms
                );
        }


        if (
            hasValue(
                payload.standard_cycle_ms
            )
        ) {

            payload.standard_cycle_ms =
                Number(
                    payload.standard_cycle_ms
                );
        }


        if (
            hasValue(
                payload.result_status
            )
        ) {

            payload.result_status =
                String(
                    payload.result_status
                )
                    .trim();
        }


        if (
            hasValue(
                payload.source_system
            )
        ) {

            payload.source_system =
                String(
                    payload.source_system
                )
                    .trim();
        }


        if (
            !hasValue(
                payload.unit_id
            )
        ) {

            payload.unit_id =
                null;
        }


        if (
            !hasValue(
                payload.cycle_time_config_id
            )
        ) {

            delete payload
                .cycle_time_config_id;
        }


        if (
            !hasValue(
                payload.correlation_id
            )
        ) {

            payload.correlation_id =
                null;
        }


        if (
            !hasValue(
                payload.idempotency_key
            )
        ) {

            delete payload
                .idempotency_key;
        }


        return payload;
    };


// ============================================================
// CONFIG
// ============================================================

/**
 * GET /config
 *
 * Normally returns active configurations because backend
 * getConfig() applies is_active=true when not supplied.
 */
export const getCycleTimeConfig =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/config`,
                {
                    params:
                        normalizeCycleTimeConfigFilters(
                            filters
                        ),
                }
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// SAVE CONFIG
//
// POST /config
//
// cycle_time_config_id present:
// update
//
// absent:
// create
// ============================================================

export const saveCycleTimeConfig =
    async (
        data = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/config`,

                normalizeCycleTimeConfigPayload(
                    data
                )
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// MASTER
// ============================================================

/**
 * GET /master
 *
 * Unlike /config, this can be used to load both active and
 * inactive Cycle Time configurations.
 */
export const getCycleTimeMaster =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/master`,
                {
                    params:
                        normalizeCycleTimeConfigFilters(
                            filters
                        ),
                }
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// CREATE CONFIG
//
// POST /master
// ============================================================

export const createCycleTimeConfig =
    async (
        data = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/master`,

                normalizeCycleTimeConfigPayload(
                    data
                )
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// UPDATE CONFIG
//
// PUT /master/:id
// ============================================================

export const updateCycleTimeConfig =
    async (
        cycleTimeConfigId,
        data = {}
    ) => {

        const response =
            await api.put(
                `${BASE_URL}/master/${cycleTimeConfigId}`,

                normalizeCycleTimeConfigPayload(
                    data
                )
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// SOFT DELETE CONFIG
//
// DELETE /master/:id
//
// Backend:
// is_active = FALSE
// ============================================================

export const softDeleteCycleTimeConfig =
    async cycleTimeConfigId => {

        const response =
            await api.delete(
                `${BASE_URL}/master/${cycleTimeConfigId}`
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// RUNTIME
// ============================================================

/**
 * GET /runtime
 *
 * Reads completed cycle_event history.
 */
export const getCycleTimeRuntime =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/runtime`,
                {
                    params:
                        normalizeCycleTimeRuntimeFilters(
                            filters
                        ),
                }
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// EVENT BY ID
// ============================================================

export const getCycleEventById =
    async cycleId => {

        const response =
            await api.get(
                `${BASE_URL}/runtime/event/${cycleId}`
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// EXECUTE
//
// POST /execute
//
// IMPORTANT:
//
// Normally frontend sends:
//
// company_id
// plant_id
// line_id
// machine_id
// shift_id
// plan_id
// plan_entry_id
// part_id
// process_id
//
// cycle_time_config_id optional
//
// start_ts
// end_ts
//
// result_status
// source_system
//
// unit_id optional
// correlation_id optional
// idempotency_key optional
//
// Normally frontend DOES NOT send:
//
// cycle_time_ms
// standard_cycle_ms
// ============================================================

export const executeCycleTime =
    async (
        data = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/execute`,

                normalizeCycleExecutionPayload(
                    data
                )
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// EXECUTE - FULL RESPONSE
//
// Useful when frontend needs:
//
// message
// meta
// response status
// idempotent information
// ============================================================

export const executeCycleTimeResponse =
    async (
        data = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/execute`,

                normalizeCycleExecutionPayload(
                    data
                )
            );


        return getCycleTimeResponseData(
            response
        );
    };


// ============================================================
// REPORT
// ============================================================

export const getCycleTimeReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/report`,
                {
                    params:
                        normalizeCycleTimeRuntimeFilters(
                            filters
                        ),
                }
            );


        return {

            data:
                getCycleTimePayload(
                    response
                ),

            meta:
                getCycleTimeMeta(
                    response
                ) || {},
        };
    };


// ============================================================
// EXPORT
// ============================================================

export const exportCycleTimeReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/export`,

                normalizeCycleTimeRuntimeFilters(
                    filters
                )
            );


        return {

            data:
                getCycleTimePayload(
                    response
                ),

            meta:
                getCycleTimeMeta(
                    response
                ) || {},
        };
    };


// ============================================================
// PLAN ENTRY SUMMARY
// ============================================================

export const getPlanEntryCycleSummary =
    async planEntryId => {

        const response =
            await api.get(
                `${BASE_URL}/summary/plan-entry/${planEntryId}`
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// PRODUCTION PLAN SUMMARY
// ============================================================

export const getPlanCycleSummary =
    async planId => {

        const response =
            await api.get(
                `${BASE_URL}/summary/plan/${planId}`
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// MACHINE SUMMARY
//
// Required:
// company_id
//
// Optional:
// machine_id
// from_timestamp
// to_timestamp
// ============================================================

export const getMachineCycleSummary =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/summary/machine`,
                {
                    params:
                        normalizeCycleTimeRuntimeFilters(
                            filters
                        ),
                }
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// EFFECTIVE CONFIG
//
// Required:
//
// company_id
// machine_id
// process_id
//
// Optional:
//
// effective_at
// ============================================================

export const getEffectiveCycleTimeConfig =
    async (
        filters = {}
    ) => {

        const params =
            cleanCycleTimeParams({

                company_id:
                    filters.company_id,

                machine_id:
                    filters.machine_id,

                process_id:
                    filters.process_id,

                effective_at:
                    hasValue(
                        filters.effective_at
                    )
                        ? toIsoIfPossible(
                            filters.effective_at
                        )
                        : undefined,
            });


        const response =
            await api.get(
                `${BASE_URL}/effective-config`,
                {
                    params,
                }
            );


        return getCycleTimePayload(
            response
        );
    };


// ============================================================
// LOOKUP CONFIG BY ID
//
// Frontend convenience helper.
// ============================================================

export const findCycleTimeConfigById =
    (
        data,
        cycleTimeConfigId
    ) => {

        if (
            !cycleTimeConfigId
        ) {

            return null;
        }


        const rows =
            getCycleTimeConfigRows(
                data
            );


        return rows.find(
            row =>
                String(
                    row
                        ?.cycle_time_config_id ??
                    ""
                ) ===
                String(
                    cycleTimeConfigId
                )
        ) || null;
    };


// ============================================================
// ACTIVE CONFIG HELPER
// ============================================================

export const getActiveCycleTimeConfigs =
    data => {

        return getCycleTimeConfigRows(
            data
        ).filter(
            row => {

                return (
                    row?.is_active === true ||
                    row?.is_active === 1 ||
                    row?.is_active === "1" ||
                    String(
                        row?.is_active
                    )
                        .toLowerCase() ===
                        "true"
                );
            }
        );
    };


// ============================================================
// FILTER CONFIGS BY MACHINE / PROCESS
// ============================================================

export const getCycleConfigsForMachineProcess =
    (
        data,
        machineId,
        processId = null
    ) => {

        return getCycleTimeConfigRows(
            data
        ).filter(
            row => {

                if (
                    machineId &&
                    String(
                        row.machine_id
                    ) !==
                    String(
                        machineId
                    )
                ) {

                    return false;
                }


                if (
                    processId &&
                    String(
                        row.process_id
                    ) !==
                    String(
                        processId
                    )
                ) {

                    return false;
                }


                return true;
            }
        );
    };


// ============================================================
// CYCLE PERFORMANCE HELPER
// ============================================================

export const getCyclePerformance =
    event => {

        const actual =
            Number(
                event
                    ?.cycle_time_ms ??
                0
            );


        const standard =
            Number(
                event
                    ?.standard_cycle_ms ??
                0
            );


        const hasStandard =
            event
                ?.standard_cycle_ms !==
                    undefined &&
            event
                ?.standard_cycle_ms !==
                    null &&
            event
                ?.standard_cycle_ms !==
                    "";


        if (
            !hasStandard
        ) {

            return {

                actual_cycle_ms:
                    actual,

                standard_cycle_ms:
                    null,

                deviation_ms:
                    null,

                within_standard:
                    null,

                above_standard:
                    null,

                performance_percent:
                    null,
            };
        }


        const deviation =
            actual -
            standard;


        const withinStandard =
            actual <=
            standard;


        const performancePercent =
            actual > 0
                ? Number(
                    (
                        (
                            standard /
                            actual
                        ) *
                        100
                    ).toFixed(2)
                )
                : 0;


        return {

            actual_cycle_ms:
                actual,

            standard_cycle_ms:
                standard,

            deviation_ms:
                deviation,

            within_standard:
                withinStandard,

            above_standard:
                !withinStandard,

            performance_percent:
                performancePercent,
        };
    };


// ============================================================
// FORMAT MILLISECONDS
//
// Frontend convenience:
//
// 42350 -> 42.35 sec
// ============================================================

export const formatCycleMilliseconds =
    value => {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            return "-";
        }


        const milliseconds =
            Number(value);


        if (
            !Number.isFinite(
                milliseconds
            )
        ) {

            return "-";
        }


        if (
            milliseconds <
            1000
        ) {

            return `${milliseconds} ms`;
        }


        const seconds =
            milliseconds /
            1000;


        if (
            seconds <
            60
        ) {

            return `${Number(
                seconds.toFixed(2)
            )} sec`;
        }


        const minutes =
            Math.floor(
                seconds /
                60
            );


        const remainingSeconds =
            Number(
                (
                    seconds %
                    60
                ).toFixed(2)
            );


        return `${minutes}m ${remainingSeconds}s`;
    };


// ============================================================
// REPORT META HELPERS
// ============================================================

export const getTotalCycles =
    meta =>
        Number(
            meta?.total_cycles ||
            0
        );


export const getAverageCycleMs =
    meta =>
        Number(
            meta?.average_cycle_ms ||
            0
        );


export const getMinimumCycleMs =
    meta =>
        Number(
            meta?.minimum_cycle_ms ||
            0
        );


export const getMaximumCycleMs =
    meta =>
        Number(
            meta?.maximum_cycle_ms ||
            0
        );


export const getAverageStandardCycleMs =
    meta =>
        Number(
            meta
                ?.average_standard_cycle_ms ||
            0
        );


export const getWithinStandardCount =
    meta =>
        Number(
            meta
                ?.within_standard_count ||
            0
        );


export const getAboveStandardCount =
    meta =>
        Number(
            meta
                ?.above_standard_count ||
            0
        );


export const getWithinStandardPercent =
    meta =>
        Number(
            meta
                ?.within_standard_percent ||
            0
        );


// ============================================================
// DEFAULT SERVICE OBJECT
// ============================================================

const cycleTimeTrackingService = {

    // ========================================================
    // CONSTANTS
    // ========================================================

    MODES:
        CYCLE_TIME_MODES,


    // ========================================================
    // CONFIG
    // ========================================================

    getConfig:
        getCycleTimeConfig,

    saveConfig:
        saveCycleTimeConfig,


    // ========================================================
    // MASTER
    // ========================================================

    getMaster:
        getCycleTimeMaster,

    createMaster:
        createCycleTimeConfig,

    updateMaster:
        updateCycleTimeConfig,

    softDeleteMaster:
        softDeleteCycleTimeConfig,


    // ========================================================
    // RUNTIME
    // ========================================================

    getRuntime:
        getCycleTimeRuntime,

    getCycleEventById,

    execute:
        executeCycleTime,

    executeResponse:
        executeCycleTimeResponse,


    // ========================================================
    // REPORT / EXPORT
    // ========================================================

    getReport:
        getCycleTimeReport,

    exportReport:
        exportCycleTimeReport,


    // ========================================================
    // SUMMARY
    // ========================================================

    getPlanEntrySummary:
        getPlanEntryCycleSummary,

    getPlanSummary:
        getPlanCycleSummary,

    getMachineSummary:
        getMachineCycleSummary,


    // ========================================================
    // EFFECTIVE CONFIG
    // ========================================================

    getEffectiveConfig:
        getEffectiveCycleTimeConfig,


    // ========================================================
    // ROW HELPERS
    // ========================================================

    getConfigRows:
        getCycleTimeConfigRows,

    getEventRows:
        getCycleEventRows,

    getMachineSummaryRows:
        getMachineCycleSummaryRows,


    // ========================================================
    // NORMALIZATION
    // ========================================================

    cleanParams:
        cleanCycleTimeParams,

    normalizeConfigFilters:
        normalizeCycleTimeConfigFilters,

    normalizeRuntimeFilters:
        normalizeCycleTimeRuntimeFilters,

    normalizeConfigPayload:
        normalizeCycleTimeConfigPayload,

    normalizeExecutionPayload:
        normalizeCycleExecutionPayload,


    // ========================================================
    // LOOKUP HELPERS
    // ========================================================

    findConfigById:
        findCycleTimeConfigById,

    getActiveConfigs:
        getActiveCycleTimeConfigs,

    getConfigsForMachineProcess:
        getCycleConfigsForMachineProcess,


    // ========================================================
    // PERFORMANCE HELPERS
    // ========================================================

    getCyclePerformance,

    formatMilliseconds:
        formatCycleMilliseconds,


    // ========================================================
    // REPORT HELPERS
    // ========================================================

    getTotalCycles,

    getAverageCycleMs,

    getMinimumCycleMs,

    getMaximumCycleMs,

    getAverageStandardCycleMs,

    getWithinStandardCount,

    getAboveStandardCount,

    getWithinStandardPercent,
};


// ============================================================
// EXPORT DEFAULT
// ============================================================

export default cycleTimeTrackingService;