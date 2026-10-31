// src/services/lineIndexingUnitMovement.service.js

import api from "../../../../shared/api/client.js";


// ============================================================
// BASE API
// ============================================================

const API =
    "/line-indexing-unit-movement";


// ============================================================
// FRONTEND SUGGESTION CONSTANTS
//
// IMPORTANT:
//
// These are UI convenience values only.
//
// Backend / DB does NOT enforce hard enums for:
//
// trigger_type
// trigger_source
// result_status
// position_status
//
// ============================================================

export const INDEXING_TRIGGER_TYPES = {

    MANUAL:
        "MANUAL",

    PLC:
        "PLC",

    SENSOR:
        "SENSOR",

    SCAN:
        "SCAN",

    API:
        "API",

    TIMER:
        "TIMER"
};


export const INDEXING_TRIGGER_SOURCES = {

    MES_UI:
        "MES_UI",

    DATA_LOGGER:
        "DATA_LOGGER",

    PLC:
        "PLC",

    SCANNER:
        "SCANNER",

    API:
        "API"
};


export const INDEXING_RESULT_STATUS = {

    OK:
        "OK",

    NOK:
        "NOK",

    BYPASS:
        "BYPASS"
};


export const UNIT_POSITION_STATUS = {

    IN_PROCESS:
        "IN_PROCESS",

    WAITING:
        "WAITING",

    HOLD:
        "HOLD",

    COMPLETED:
        "COMPLETED",

    REWORK:
        "REWORK",

    REJECTED:
        "REJECTED"
};


// ============================================================
// GENERIC HELPERS
// ============================================================

const hasOwn = (
    object,
    key
) =>
    Object.prototype
        .hasOwnProperty
        .call(
            object || {},
            key
        );


const hasValue =
    value =>
        !(
            value === undefined ||
            value === null ||
            value === ""
        );


const cleanString =
    value => {

        if (
            value === undefined ||
            value === null
        ) {

            return "";
        }


        return String(value)
            .trim();
    };


const nullable =
    value => {

        if (
            !hasValue(value)
        ) {

            return null;
        }


        return value;
    };


const toBoolean =
    (
        value,
        fallback = false
    ) => {

        if (
            value === true ||
            value === false
        ) {

            return value;
        }


        if (
            value === 1 ||
            value === "1"
        ) {

            return true;
        }


        if (
            value === 0 ||
            value === "0"
        ) {

            return false;
        }


        const normalized =
            cleanString(
                value
            )
                .toLowerCase();


        if (
            normalized === "true"
        ) {

            return true;
        }


        if (
            normalized === "false"
        ) {

            return false;
        }


        return fallback;
    };


const toPositiveInteger =
    (
        value,
        fallback = null
    ) => {

        if (
            !hasValue(value)
        ) {

            return fallback;
        }


        const number =
            Number(value);


        if (
            !Number.isInteger(number) ||
            number <= 0
        ) {

            return fallback;
        }


        return number;
    };


// ============================================================
// REMOVE EMPTY QUERY VALUES
//
// We do NOT send empty strings because backend filters cast
// UUID/integer/timestamp values.
// ============================================================

const compactParams =
    object => {

        const params =
            {};


        Object.entries(
            object || {}
        )
            .forEach(
                ([
                    key,
                    value
                ]) => {

                    if (
                        value === undefined ||
                        value === null ||
                        value === ""
                    ) {

                        return;
                    }


                    params[key] =
                        value;
                }
            );


        return params;
    };


// ============================================================
// RESPONSE HELPERS
//
// Backend standard:
//
// {
//   success,
//   message,
//   data,
//   errors,
//   meta
// }
// ============================================================

export const getResponsePayload =
    response =>
        response?.data?.data ??
        response?.data ??
        null;


export const getResponseMeta =
    response =>
        response?.data?.meta ??
        {};


export const getResponseMessage =
    response =>
        response?.data?.message ??
        "";


// ============================================================
// SAFE ARRAY EXTRACTION
// ============================================================

const getRowsFromPayload = (
    payload,
    possibleKeys = []
) => {

    if (
        Array.isArray(payload)
    ) {

        return payload;
    }


    if (
        !payload ||
        typeof payload !==
            "object"
    ) {

        return [];
    }


    for (
        const key of possibleKeys
    ) {

        if (
            Array.isArray(
                payload[key]
            )
        ) {

            return payload[key];
        }
    }


    return [];
};


// ============================================================
// CONFIG ROWS
// ============================================================

export const getIndexingRuleRows =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return getRowsFromPayload(
            payload,
            [
                "indexing_rule_config",
                "indexing_rules",
                "rules",
                "master",
                "data"
            ]
        );
    };


// ============================================================
// MOVEMENT EVENT ROWS
// ============================================================

export const getStationIndexEventRows =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return getRowsFromPayload(
            payload,
            [
                "station_index_event",
                "station_index_events",
                "events",
                "runtime",
                "data"
            ]
        );
    };


// ============================================================
// UNIT POSITION ROWS
// ============================================================

export const getUnitPositionRows =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return getRowsFromPayload(
            payload,
            [
                "unit_position",
                "unit_positions",
                "positions",
                "data"
            ]
        );
    };


// ============================================================
// MOVEMENT SUMMARY ROWS
// ============================================================

export const getMovementSummaryRows =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return getRowsFromPayload(
            payload,
            [
                "movement_summary",
                "summary",
                "data"
            ]
        );
    };


// ============================================================
// POSITION SUMMARY ROWS
// ============================================================

export const getUnitPositionSummaryRows =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return getRowsFromPayload(
            payload,
            [
                "unit_position_summary",
                "position_summary",
                "summary",
                "data"
            ]
        );
    };


// ============================================================
// PLAN ENTRY ROWS
// ============================================================

export const getPlanEntryRows =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return getRowsFromPayload(
            payload,
            [
                "plan_entry",
                "plan_entries",
                "entries",
                "data"
            ]
        );
    };


// ============================================================
// NORMALIZE CONFIG FILTERS
//
// Matches backend GET /master and GET /config.
//
// ============================================================

export const normalizeIndexingRuleFilters =
    (
        filters = {}
    ) =>
        compactParams({

            company_id:
                filters.company_id,

            plant_id:
                filters.plant_id,

            line_id:
                filters.line_id,

            from_route_step_id:
                filters.from_route_step_id,

            to_route_step_id:
                filters.to_route_step_id,

            from_station_id:
                filters.from_station_id,

            to_station_id:
                filters.to_station_id,

            trigger_signal_id:
                filters.trigger_signal_id,

            trigger_type:
                filters.trigger_type,

            required_result_status:
                filters.required_result_status,

            is_active:
                filters.is_active,

            version_no:
                filters.version_no
        });


// ============================================================
// NORMALIZE CONFIG PAYLOAD
//
// Full-form payload.
//
// Frontend should use:
//
// POST /master
// PUT  /master/:id
//
// instead of generic POST /config.
//
// ============================================================

export const normalizeIndexingRulePayload =
    (
        data = {}
    ) => ({

        company_id:
            data.company_id,

        plant_id:
            data.plant_id,

        line_id:
            data.line_id,

        from_route_step_id:
            data.from_route_step_id,

        to_route_step_id:
            data.to_route_step_id,

        from_station_id:
            nullable(
                data.from_station_id
            ),

        to_station_id:
            nullable(
                data.to_station_id
            ),

        trigger_signal_id:
            nullable(
                data.trigger_signal_id
            ),

        trigger_type:
            cleanString(
                data.trigger_type ||
                "MANUAL"
            )
                .toUpperCase(),

        required_result_status:
            hasValue(
                data.required_result_status
            )
                ? cleanString(
                    data.required_result_status
                )
                    .toUpperCase()
                : null,

        rule_expression:
            hasValue(
                data.rule_expression
            )
                ? cleanString(
                    data.rule_expression
                )
                : null,

        priority_no:
            toPositiveInteger(
                data.priority_no,
                100
            ),

        is_active:
            hasOwn(
                data,
                "is_active"
            )
                ? toBoolean(
                    data.is_active,
                    true
                )
                : true,

        version_no:
            toPositiveInteger(
                data.version_no,
                1
            )
    });


// ============================================================
// NORMALIZE INITIAL UNIT POSITION
// ============================================================

export const normalizeInitializeUnitPositionPayload =
    (
        data = {}
    ) => ({

        unit_id:
            data.unit_id,

        company_id:
            data.company_id,

        plant_id:
            data.plant_id,

        line_id:
            data.line_id,

        current_machine_id:
            nullable(
                data.current_machine_id
            ),

        current_station_id:
            nullable(
                data.current_station_id
            ),

        current_route_step_id:
            data.current_route_step_id,

        current_plan_entry_id:
            nullable(
                data.current_plan_entry_id
            ),

        position_status:
            cleanString(
                data.position_status ||
                "IN_PROCESS"
            )
                .toUpperCase(),

        position_updated_at:
            nullable(
                data.position_updated_at
            )
    });


// ============================================================
// NORMALIZE MOVEMENT EXECUTION PAYLOAD
//
// IMPORTANT:
//
// Current FROM location is authoritative in unit_position.
//
// from_* values are optional consistency hints only.
//
// ============================================================

export const normalizeExecuteMovementPayload =
    (
        data = {}
    ) => {

        const payload = {

            company_id:
                data.company_id,

            plant_id:
                data.plant_id,

            line_id:
                data.line_id,

            machine_id:
                data.machine_id,

            shift_id:
                hasValue(
                    data.shift_id
                )
                    ? Number(
                        data.shift_id
                    )
                    : data.shift_id,

            unit_id:
                data.unit_id,

            indexing_rule_config_id:
                nullable(
                    data.indexing_rule_config_id
                ),

            from_route_step_id:
                nullable(
                    data.from_route_step_id
                ),

            from_station_id:
                nullable(
                    data.from_station_id
                ),

            from_plan_entry_id:
                nullable(
                    data.from_plan_entry_id
                ),

            to_route_step_id:
                data.to_route_step_id,

            to_station_id:
                nullable(
                    data.to_station_id
                ),

            to_machine_id:
                nullable(
                    data.to_machine_id
                ),

            to_plan_entry_id:
                nullable(
                    data.to_plan_entry_id
                ),

            trigger_signal_id:
                nullable(
                    data.trigger_signal_id
                ),

            trigger_type:
                cleanString(
                    data.trigger_type ||
                    "MANUAL"
                )
                    .toUpperCase(),

            trigger_source:
                cleanString(
                    data.trigger_source ||
                    "MES_UI"
                )
                    .toUpperCase(),

            result_status:
                cleanString(
                    data.result_status ||
                    "OK"
                )
                    .toUpperCase(),

            position_status:
                cleanString(
                    data.position_status ||
                    "IN_PROCESS"
                )
                    .toUpperCase(),

            event_ts:
                nullable(
                    data.event_ts
                ),

            correlation_id:
                nullable(
                    data.correlation_id
                ),

            idempotency_key:
                nullable(
                    cleanString(
                        data.idempotency_key
                    )
                )
        };


        // ====================================================
        // EXPRESSION RESULT
        //
        // Only send when caller explicitly provided it.
        //
        // This keeps a distinction between:
        //
        // omitted
        // false
        // true
        //
        // ====================================================

        if (
            hasOwn(
                data,
                "rule_expression_result"
            )
        ) {

            payload.rule_expression_result =
                toBoolean(
                    data.rule_expression_result,
                    false
                );
        }


        return payload;
    };


// ============================================================
// NORMALIZE RUNTIME FILTERS
// ============================================================

export const normalizeRuntimeFilters =
    (
        filters = {}
    ) =>
        compactParams({

            company_id:
                filters.company_id,

            plant_id:
                filters.plant_id,

            line_id:
                filters.line_id,

            machine_id:
                filters.machine_id,

            shift_id:
                filters.shift_id,

            unit_id:
                filters.unit_id,

            from_plan_entry_id:
                filters.from_plan_entry_id,

            to_plan_entry_id:
                filters.to_plan_entry_id,

            from_station_id:
                filters.from_station_id,

            to_station_id:
                filters.to_station_id,

            from_route_step_id:
                filters.from_route_step_id,

            to_route_step_id:
                filters.to_route_step_id,

            indexing_rule_config_id:
                filters.indexing_rule_config_id,

            trigger_source:
                filters.trigger_source,

            result_status:
                filters.result_status,

            correlation_id:
                filters.correlation_id,

            idempotency_key:
                filters.idempotency_key,

            from_timestamp:
                filters.from_timestamp,

            to_timestamp:
                filters.to_timestamp
        });


// ============================================================
// NORMALIZE CURRENT POSITION FILTERS
// ============================================================

export const normalizeUnitPositionFilters =
    (
        filters = {}
    ) =>
        compactParams({

            company_id:
                filters.company_id,

            plant_id:
                filters.plant_id,

            line_id:
                filters.line_id,

            current_machine_id:
                filters.current_machine_id,

            current_station_id:
                filters.current_station_id,

            current_route_step_id:
                filters.current_route_step_id,

            current_plan_entry_id:
                filters.current_plan_entry_id,

            position_status:
                filters.position_status,

            unit_id:
                filters.unit_id
        });


// ============================================================
// NORMALIZE MOVEMENT SUMMARY FILTERS
// ============================================================

export const normalizeMovementSummaryFilters =
    (
        filters = {}
    ) =>
        compactParams({

            company_id:
                filters.company_id,

            line_id:
                filters.line_id,

            machine_id:
                filters.machine_id,

            from_timestamp:
                filters.from_timestamp,

            to_timestamp:
                filters.to_timestamp
        });


// ============================================================
// NORMALIZE POSITION SUMMARY FILTERS
// ============================================================

export const normalizePositionSummaryFilters =
    (
        filters = {}
    ) =>
        compactParams({

            company_id:
                filters.company_id,

            line_id:
                filters.line_id
        });


// ============================================================
// NORMALIZE PLANNING FILTERS
// ============================================================

export const normalizePlanEntryFilters =
    (
        filters = {}
    ) =>
        compactParams({

            company_id:
                filters.company_id,

            machine_id:
                filters.machine_id,

            shift_id:
                filters.shift_id
        });


// ============================================================
// CONFIG API
// ============================================================

export const getIndexingConfig =
    async (
        filters = {}
    ) =>
        api.get(
            `${API}/config`,
            {
                params:
                    normalizeIndexingRuleFilters(
                        filters
                    )
            }
        );


export const saveIndexingConfig =
    async (
        payload
    ) =>
        api.post(
            `${API}/config`,
            payload
        );


// ============================================================
// MASTER CRUD
// ============================================================

export const getIndexingRuleMaster =
    async (
        filters = {}
    ) =>
        api.get(
            `${API}/master`,
            {
                params:
                    normalizeIndexingRuleFilters(
                        filters
                    )
            }
        );


export const createIndexingRule =
    async (
        payload
    ) =>
        api.post(
            `${API}/master`,
            normalizeIndexingRulePayload(
                payload
            )
        );


export const updateIndexingRule =
    async (
        id,
        payload
    ) =>
        api.put(
            `${API}/master/${id}`,
            normalizeIndexingRulePayload(
                payload
            )
        );


export const deleteIndexingRule =
    async id =>
        api.delete(
            `${API}/master/${id}`
        );


export const softDeleteIndexingRule =
    deleteIndexingRule;


// ============================================================
// INITIALIZE UNIT POSITION
// ============================================================

export const initializeUnitPosition =
    async (
        payload
    ) =>
        api.post(
            `${API}/position/initialize`,
            normalizeInitializeUnitPositionPayload(
                payload
            )
        );


// ============================================================
// CURRENT UNIT POSITION
// ============================================================

export const getUnitPositions =
    async (
        filters = {}
    ) =>
        api.get(
            `${API}/position`,
            {
                params:
                    normalizeUnitPositionFilters(
                        filters
                    )
            }
        );


export const getUnitPositionByUnitId =
    async unitId =>
        api.get(
            `${API}/position/${unitId}`
        );


// ============================================================
// RUNTIME MOVEMENT HISTORY
// ============================================================

export const getMovementRuntime =
    async (
        filters = {}
    ) =>
        api.get(
            `${API}/runtime`,
            {
                params:
                    normalizeRuntimeFilters(
                        filters
                    )
            }
        );


export const getStationIndexEventById =
    async eventId =>
        api.get(
            `${API}/runtime/event/${eventId}`
        );


// ============================================================
// EXECUTE MOVEMENT
// ============================================================

export const executeUnitMovement =
    async (
        payload
    ) =>
        api.post(
            `${API}/execute`,
            normalizeExecuteMovementPayload(
                payload
            )
        );


// ============================================================
// MOVEMENT SUMMARY
// ============================================================

export const getMovementSummary =
    async (
        filters = {}
    ) =>
        api.get(
            `${API}/summary/movement`,
            {
                params:
                    normalizeMovementSummaryFilters(
                        filters
                    )
            }
        );


// ============================================================
// POSITION SUMMARY
// ============================================================

export const getUnitPositionSummary =
    async (
        filters = {}
    ) =>
        api.get(
            `${API}/summary/position`,
            {
                params:
                    normalizePositionSummaryFilters(
                        filters
                    )
            }
        );


// ============================================================
// MOVEMENT REPORT
// ============================================================

export const getMovementReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${API}/report`,
                {
                    params:
                        normalizeRuntimeFilters(
                            filters
                        )
                }
            );


        return {

            response,

            data:
                getStationIndexEventRows(
                    response
                ),

            meta:
                getResponseMeta(
                    response
                ),

            message:
                getResponseMessage(
                    response
                )
        };
    };


// ============================================================
// MOVEMENT EXPORT
// ============================================================

export const exportMovementReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.post(
                `${API}/export`,
                normalizeRuntimeFilters(
                    filters
                )
            );


        return {

            response,

            data:
                getStationIndexEventRows(
                    response
                ),

            meta:
                getResponseMeta(
                    response
                ),

            message:
                getResponseMessage(
                    response
                )
        };
    };


// ============================================================
// POSITION REPORT
// ============================================================

export const getPositionReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${API}/position-report`,
                {
                    params:
                        normalizeUnitPositionFilters(
                            filters
                        )
                }
            );


        return {

            response,

            data:
                getUnitPositionRows(
                    response
                ),

            meta:
                getResponseMeta(
                    response
                ),

            message:
                getResponseMessage(
                    response
                )
        };
    };


// ============================================================
// POSITION EXPORT
// ============================================================

export const exportPositionReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.post(
                `${API}/position-export`,
                normalizeUnitPositionFilters(
                    filters
                )
            );


        return {

            response,

            data:
                getUnitPositionRows(
                    response
                ),

            meta:
                getResponseMeta(
                    response
                ),

            message:
                getResponseMessage(
                    response
                )
        };
    };


// ============================================================
// PLANNING HELPERS
// ============================================================

export const getPlanEntriesForMachineShift =
    async (
        filters = {}
    ) =>
        api.get(
            `${API}/planning/entries`,
            {
                params:
                    normalizePlanEntryFilters(
                        filters
                    )
            }
        );


export const getNextPlanEntries =
    async previousPlanEntryId =>
        api.get(
            `${API}/planning/next/${previousPlanEntryId}`
        );


// ============================================================
// RESULT HELPERS
// ============================================================

export const getExecuteMovementResult =
    response =>
        getResponsePayload(
            response
        );


export const isMovementIdempotent =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return Boolean(
            payload?.idempotent
        );
    };


export const getExecutedMovementEvent =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return (
            payload
                ?.station_index_event ||
            null
        );
    };


export const getUpdatedUnitPosition =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return (
            payload
                ?.unit_position ||
            null
        );
    };


export const getMovementTransition =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return (
            payload
                ?.transition ||
            null
        );
    };


// ============================================================
// INITIALIZATION RESULT
// ============================================================

export const getInitializedUnitPosition =
    response => {

        const payload =
            getResponsePayload(
                response
            );


        return (
            payload
                ?.unit_position ||
            null
        );
    };


// ============================================================
// FORMAT HELPERS
// ============================================================

export const formatDateTime =
    value => {

        if (
            !value
        ) {

            return "-";
        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);
        }


        return date
            .toLocaleString();
    };


export const formatPositionStatus =
    value => {

        const text =
            cleanString(
                value
            );


        if (!text) {

            return "UNKNOWN";
        }


        return text
            .replace(
                /_/g,
                " "
            );
    };


export const formatTriggerSource =
    value => {

        const text =
            cleanString(
                value
            );


        return text ||
            "-";
    };


export const formatMovementResult =
    value => {

        const text =
            cleanString(
                value
            );


        return text ||
            "-";
    };


// ============================================================
// FRIENDLY RULE LABEL
// ============================================================

export const formatIndexingRuleLabel =
    (
        rule,
        routeStepMap = null
    ) => {

        if (!rule) {

            return "-";
        }


        const fromStep =
            routeStepMap
                ?.get?.(
                    String(
                        rule.from_route_step_id
                    )
                );


        const toStep =
            routeStepMap
                ?.get?.(
                    String(
                        rule.to_route_step_id
                    )
                );


        const getLabel =
            (
                row,
                fallback
            ) => {

                if (!row) {

                    return fallback;
                }


                return (
                    row.stage_name ||
                    row.route_step_name ||
                    row.step_name ||
                    row.stage_code ||
                    row.route_step_code ||
                    row.step_code ||
                    fallback
                );
            };


        const from =
            getLabel(
                fromStep,
                rule.from_route_step_id
            );


        const to =
            getLabel(
                toStep,
                rule.to_route_step_id
            );


        return `${from} → ${to}`;
    };


// ============================================================
// DEFAULT SERVICE
// ============================================================

const lineIndexingUnitMovementService = {

    // ========================================================
    // CONSTANTS
    // ========================================================

    INDEXING_TRIGGER_TYPES,

    INDEXING_TRIGGER_SOURCES,

    INDEXING_RESULT_STATUS,

    UNIT_POSITION_STATUS,


    // ========================================================
    // RESPONSE HELPERS
    // ========================================================

    getResponsePayload,

    getResponseMeta,

    getResponseMessage,

    getIndexingRuleRows,

    getStationIndexEventRows,

    getUnitPositionRows,

    getMovementSummaryRows,

    getUnitPositionSummaryRows,

    getPlanEntryRows,


    // ========================================================
    // NORMALIZERS
    // ========================================================

    normalizeIndexingRuleFilters,

    normalizeIndexingRulePayload,

    normalizeInitializeUnitPositionPayload,

    normalizeExecuteMovementPayload,

    normalizeRuntimeFilters,

    normalizeUnitPositionFilters,

    normalizeMovementSummaryFilters,

    normalizePositionSummaryFilters,

    normalizePlanEntryFilters,


    // ========================================================
    // CONFIG
    // ========================================================

    getIndexingConfig,

    saveIndexingConfig,


    // ========================================================
    // MASTER
    // ========================================================

    getIndexingRuleMaster,

    createIndexingRule,

    updateIndexingRule,

    deleteIndexingRule,

    softDeleteIndexingRule,


    // ========================================================
    // INITIALIZATION
    // ========================================================

    initializeUnitPosition,


    // ========================================================
    // CURRENT POSITION
    // ========================================================

    getUnitPositions,

    getUnitPositionByUnitId,


    // ========================================================
    // RUNTIME
    // ========================================================

    getMovementRuntime,

    getStationIndexEventById,

    executeUnitMovement,


    // ========================================================
    // SUMMARY
    // ========================================================

    getMovementSummary,

    getUnitPositionSummary,


    // ========================================================
    // REPORT
    // ========================================================

    getMovementReport,

    exportMovementReport,

    getPositionReport,

    exportPositionReport,


    // ========================================================
    // PLANNING
    // ========================================================

    getPlanEntriesForMachineShift,

    getNextPlanEntries,


    // ========================================================
    // RESULT HELPERS
    // ========================================================

    getExecuteMovementResult,

    isMovementIdempotent,

    getExecutedMovementEvent,

    getUpdatedUnitPosition,

    getMovementTransition,

    getInitializedUnitPosition,


    // ========================================================
    // FORMATTERS
    // ========================================================

    formatDateTime,

    formatPositionStatus,

    formatTriggerSource,

    formatMovementResult,

    formatIndexingRuleLabel
};


export default lineIndexingUnitMovementService;