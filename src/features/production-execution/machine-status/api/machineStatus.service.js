// src/services/machineStatus.service.js

/**
 * ============================================================
 * OPERATEX MES
 * PRODUCTION EXECUTION
 * MACHINE STATUS - FRONTEND SERVICE
 * ============================================================
 *
 * BASE API:
 *
 * /machine-status
 *
 * ------------------------------------------------------------
 * CONFIG
 * ------------------------------------------------------------
 *
 * GET    /config
 * POST   /config
 *
 *
 * ------------------------------------------------------------
 * MASTER
 * ------------------------------------------------------------
 *
 * GET    /master
 * POST   /master
 * PUT    /master/:id
 * DELETE /master/:id
 *
 *
 * ------------------------------------------------------------
 * STATUS MAPPING RULE
 * ------------------------------------------------------------
 *
 * GET    /rules
 * GET    /rules/:id
 * POST   /rules
 * PUT    /rules/:id
 * DELETE /rules/:id
 *
 *
 * ------------------------------------------------------------
 * MACHINE STATUS RUNTIME
 * ------------------------------------------------------------
 *
 * GET    /runtime
 * GET    /runtime/event/:id
 * POST   /execute
 * GET    /current
 *
 *
 * ------------------------------------------------------------
 * ALARMS
 * ------------------------------------------------------------
 *
 * GET    /alarms
 * GET    /alarms/:id
 * POST   /alarms/raise
 * PUT    /alarms/:id/clear
 *
 *
 * ------------------------------------------------------------
 * SUMMARY
 * ------------------------------------------------------------
 *
 * GET    /summary/status
 * GET    /summary/alarm
 *
 *
 * ------------------------------------------------------------
 * REPORT / EXPORT
 * ------------------------------------------------------------
 *
 * GET    /report
 * POST   /export
 *
 * GET    /alarm-report
 * POST   /alarm-export
 *
 * ============================================================
 */


import api from "../../../../shared/api/client.js";


// ============================================================
// BASE
// ============================================================

const BASE_URL =
    "/machine-status";


// ============================================================
// OPTIONAL UI SUGGESTIONS
//
// These are frontend helper values only.
// Backend does not hard-enumerate status/mode/severity.
// ============================================================

export const MACHINE_STATUS_CODES = {

    RUNNING:
        "RUNNING",

    IDLE:
        "IDLE",

    DOWN:
        "DOWN",

    ALARM:
        "ALARM",

    SETUP:
        "SETUP",

    UNKNOWN:
        "UNKNOWN"
};


export const MACHINE_MODE_CODES = {

    AUTO:
        "AUTO",

    MANUAL:
        "MANUAL",

    SETUP:
        "SETUP"
};


export const ALARM_STATUS_CODES = {

    ACTIVE:
        "ACTIVE",

    CLEARED:
        "CLEARED"
};


export const ALARM_SEVERITIES = {

    LOW:
        "LOW",

    MEDIUM:
        "MEDIUM",

    HIGH:
        "HIGH",

    CRITICAL:
        "CRITICAL"
};


// ============================================================
// HELPERS
// ============================================================

const hasValue =
    value =>
        value !== undefined &&
        value !== null &&
        value !== "";


const nullable =
    value =>
        hasValue(value)
            ? value
            : null;


const cleanString =
    value =>
        value === undefined ||
        value === null
            ? ""
            : String(value)
                .trim();


const cleanCode =
    value =>
        cleanString(value)
            .toUpperCase();


const booleanOrNull =
    value => {

        if (
            value === true ||
            value === false
        ) {

            return value;
        }


        if (
            value === 1 ||
            value === "1" ||
            String(value)
                .toLowerCase() ===
                "true"
        ) {

            return true;
        }


        if (
            value === 0 ||
            value === "0" ||
            String(value)
                .toLowerCase() ===
                "false"
        ) {

            return false;
        }


        return null;
    };


const numberOrNull =
    value => {

        if (
            !hasValue(value)
        ) {

            return null;
        }


        const number =
            Number(value);


        return Number.isFinite(
            number
        )
            ? number
            : null;
    };


const removeEmptyParams =
    object => {

        const result =
            {};


        Object.entries(
            object || {}
        ).forEach(
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


                result[key] =
                    value;
            }
        );


        return result;
    };


// ============================================================
// GENERIC RESPONSE
// ============================================================

export const getResponsePayload =
    response =>
        response
            ?.data
            ?.data ??
        null;


export const getResponseMeta =
    response =>
        response
            ?.data
            ?.meta ??
        {};


export const getResponseMessage =
    response =>
        response
            ?.data
            ?.message ??
        "";


// ============================================================
// ROW EXTRACTION
// ============================================================

const extractRowsFromValue = (
    value,
    possibleKeys = []
) => {

    if (
        Array.isArray(
            value
        )
    ) {

        return value;
    }


    if (
        !value ||
        typeof value !==
            "object"
    ) {

        return [];
    }


    for (
        const key of
        possibleKeys
    ) {

        if (
            Array.isArray(
                value[key]
            )
        ) {

            return value[
                key
            ];
        }
    }


    return [];
};


// ============================================================
// CONFIG ROWS
// ============================================================

export const getMachineStatusConfigRows =
    value => {

        const payload =
            value?.data?.data ??
            value?.data ??
            value;


        return extractRowsFromValue(
            payload,
            [
                "machine_status_config",
                "machine_status_configs",
                "config",
                "master"
            ]
        );
    };


// ============================================================
// RULE ROWS
// ============================================================

export const getStatusMappingRuleRows =
    value => {

        const payload =
            value?.data?.data ??
            value?.data ??
            value;


        return extractRowsFromValue(
            payload,
            [
                "status_mapping_rule",
                "status_mapping_rules",
                "rules"
            ]
        );
    };


// ============================================================
// STATUS EVENT ROWS
// ============================================================

export const getMachineStatusEventRows =
    value => {

        const payload =
            value?.data?.data ??
            value?.data ??
            value;


        return extractRowsFromValue(
            payload,
            [
                "machine_status_event",
                "machine_status_events",
                "events"
            ]
        );
    };


// ============================================================
// CURRENT STATUS ROWS
// ============================================================

export const getCurrentMachineStatusRows =
    value => {

        const payload =
            value?.data?.data ??
            value?.data ??
            value;


        return extractRowsFromValue(
            payload,
            [
                "machine_status",
                "current_status",
                "current"
            ]
        );
    };


// ============================================================
// ALARM ROWS
// ============================================================

export const getAlarmRows =
    value => {

        const payload =
            value?.data?.data ??
            value?.data ??
            value;


        return extractRowsFromValue(
            payload,
            [
                "alarm_event",
                "alarm_events",
                "alarms"
            ]
        );
    };


// ============================================================
// STATUS SUMMARY ROWS
// ============================================================

export const getMachineStatusSummaryRows =
    value => {

        const payload =
            value?.data?.data ??
            value?.data ??
            value;


        return extractRowsFromValue(
            payload,
            [
                "machine_status_summary",
                "summary"
            ]
        );
    };


// ============================================================
// ALARM SUMMARY ROWS
// ============================================================

export const getAlarmSummaryRows =
    value => {

        const payload =
            value?.data?.data ??
            value?.data ??
            value;


        return extractRowsFromValue(
            payload,
            [
                "alarm_summary",
                "summary"
            ]
        );
    };


// ============================================================
// NORMALIZE CONFIG FILTERS
// ============================================================

export const normalizeMachineStatusConfigFilters =
    (
        filters = {}
    ) =>
        removeEmptyParams({

            company_id:
                nullable(
                    filters.company_id
                ),

            plant_id:
                nullable(
                    filters.plant_id
                ),

            line_id:
                nullable(
                    filters.line_id
                ),

            machine_id:
                nullable(
                    filters.machine_id
                ),

            primary_signal_id:
                nullable(
                    filters.primary_signal_id
                ),

            default_status:
                hasValue(
                    filters.default_status
                )
                    ? cleanCode(
                        filters.default_status
                    )
                    : null,

            is_active:
                booleanOrNull(
                    filters.is_active
                ),

            version_no:
                numberOrNull(
                    filters.version_no
                )
        });


// ============================================================
// NORMALIZE CONFIG PAYLOAD
// ============================================================

export const normalizeMachineStatusConfigPayload =
    (
        data = {}
    ) => ({

        company_id:
            data.company_id,

        plant_id:
            data.plant_id,

        line_id:
            data.line_id,

        machine_id:
            data.machine_id,

        primary_signal_id:
            nullable(
                data.primary_signal_id
            ),

        default_status:
            cleanCode(
                data.default_status ||
                "UNKNOWN"
            ),

        stale_timeout_seconds:
            numberOrNull(
                data.stale_timeout_seconds
            ),

        is_active:
            booleanOrNull(
                data.is_active
            ) ??
            true,

        version_no:
            numberOrNull(
                data.version_no
            ) ??
            1
    });


// ============================================================
// NORMALIZE RULE FILTERS
// ============================================================

export const normalizeStatusRuleFilters =
    (
        filters = {}
    ) =>
        removeEmptyParams({

            company_id:
                nullable(
                    filters.company_id
                ),

            machine_status_config_id:
                nullable(
                    filters.machine_status_config_id
                ),

            signal_id:
                nullable(
                    filters.signal_id
                ),

            result_status:
                hasValue(
                    filters.result_status
                )
                    ? cleanCode(
                        filters.result_status
                    )
                    : null,

            is_available:
                booleanOrNull(
                    filters.is_available
                ),

            mode_code:
                hasValue(
                    filters.mode_code
                )
                    ? cleanCode(
                        filters.mode_code
                    )
                    : null,

            is_active:
                booleanOrNull(
                    filters.is_active
                ),

            version_no:
                numberOrNull(
                    filters.version_no
                )
        });


// ============================================================
// NORMALIZE RULE PAYLOAD
// ============================================================

export const normalizeStatusRulePayload =
    (
        data = {}
    ) => ({

        company_id:
            data.company_id,

        machine_status_config_id:
            data.machine_status_config_id,

        signal_id:
            nullable(
                data.signal_id
            ),

        match_value:
            hasValue(
                data.match_value
            )
                ? cleanString(
                    data.match_value
                )
                : null,

        rule_expression:
            hasValue(
                data.rule_expression
            )
                ? cleanString(
                    data.rule_expression
                )
                : null,

        result_status:
            cleanCode(
                data.result_status
            ),

        is_available:
            booleanOrNull(
                data.is_available
            ),

        mode_code:
            hasValue(
                data.mode_code
            )
                ? cleanCode(
                    data.mode_code
                )
                : null,

        priority_no:
            numberOrNull(
                data.priority_no
            ) ??
            100,

        is_active:
            booleanOrNull(
                data.is_active
            ) ??
            true,

        version_no:
            numberOrNull(
                data.version_no
            ) ??
            1
    });


// ============================================================
// NORMALIZE STATUS RUNTIME FILTERS
// ============================================================

export const normalizeMachineStatusRuntimeFilters =
    (
        filters = {}
    ) =>
        removeEmptyParams({

            company_id:
                nullable(
                    filters.company_id
                ),

            plant_id:
                nullable(
                    filters.plant_id
                ),

            line_id:
                nullable(
                    filters.line_id
                ),

            machine_id:
                nullable(
                    filters.machine_id
                ),

            shift_id:
                numberOrNull(
                    filters.shift_id
                ),

            plan_entry_id:
                nullable(
                    filters.plan_entry_id
                ),

            status_mapping_rule_id:
                nullable(
                    filters.status_mapping_rule_id
                ),

            status_code:
                hasValue(
                    filters.status_code
                )
                    ? cleanCode(
                        filters.status_code
                    )
                    : null,

            previous_status_code:
                hasValue(
                    filters.previous_status_code
                )
                    ? cleanCode(
                        filters.previous_status_code
                    )
                    : null,

            reason_code:
                hasValue(
                    filters.reason_code
                )
                    ? cleanCode(
                        filters.reason_code
                    )
                    : null,

            source_signal_mapping_id:
                nullable(
                    filters.source_signal_mapping_id
                ),

            is_available:
                booleanOrNull(
                    filters.is_available
                ),

            mode:
                hasValue(
                    filters.mode
                )
                    ? cleanCode(
                        filters.mode
                    )
                    : null,

            source_system:
                hasValue(
                    filters.source_system
                )
                    ? cleanString(
                        filters.source_system
                    )
                    : null,

            correlation_id:
                nullable(
                    filters.correlation_id
                ),

            idempotency_key:
                hasValue(
                    filters.idempotency_key
                )
                    ? cleanString(
                        filters.idempotency_key
                    )
                    : null,

            from_timestamp:
                nullable(
                    filters.from_timestamp
                ),

            to_timestamp:
                nullable(
                    filters.to_timestamp
                )
        });


// ============================================================
// NORMALIZE EXECUTE PAYLOAD
// ============================================================

export const normalizeExecuteMachineStatusPayload =
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
                numberOrNull(
                    data.shift_id
                ),

            plan_entry_id:
                nullable(
                    data.plan_entry_id
                ),

            status_mapping_rule_id:
                nullable(
                    data.status_mapping_rule_id
                ),

            status_code:
                hasValue(
                    data.status_code
                )
                    ? cleanCode(
                        data.status_code
                    )
                    : null,

            reason_code:
                hasValue(
                    data.reason_code
                )
                    ? cleanCode(
                        data.reason_code
                    )
                    : null,

            source_signal_mapping_id:
                nullable(
                    data.source_signal_mapping_id
                ),

            is_available:
                booleanOrNull(
                    data.is_available
                ),

            mode:
                hasValue(
                    data.mode
                )
                    ? cleanCode(
                        data.mode
                    )
                    : null,

            event_ts:
                data.event_ts,

            correlation_id:
                nullable(
                    data.correlation_id
                ),

            idempotency_key:
                hasValue(
                    data.idempotency_key
                )
                    ? cleanString(
                        data.idempotency_key
                    )
                    : null,

            source_system:
                cleanString(
                    data.source_system ||
                    "MES_UI"
                ),

            payload:
                data.payload &&
                typeof data.payload ===
                    "object" &&
                !Array.isArray(
                    data.payload
                )
                    ? data.payload
                    : {}
        };


        // ====================================================
        // RAW VALUE
        //
        // Only include raw_value when caller really supplied it.
        // This matters because backend uses hasOwnProperty().
        // ====================================================

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    data,
                    "raw_value"
                )
        ) {

            payload.raw_value =
                data.raw_value;
        }


        return payload;
    };


// ============================================================
// NORMALIZE CURRENT STATUS FILTERS
// ============================================================

export const normalizeCurrentStatusFilters =
    (
        filters = {}
    ) =>
        removeEmptyParams({

            company_id:
                nullable(
                    filters.company_id
                ),

            plant_id:
                nullable(
                    filters.plant_id
                ),

            line_id:
                nullable(
                    filters.line_id
                ),

            machine_id:
                nullable(
                    filters.machine_id
                )
        });


// ============================================================
// NORMALIZE ALARM FILTERS
// ============================================================

export const normalizeAlarmFilters =
    (
        filters = {}
    ) =>
        removeEmptyParams({

            company_id:
                nullable(
                    filters.company_id
                ),

            plant_id:
                nullable(
                    filters.plant_id
                ),

            line_id:
                nullable(
                    filters.line_id
                ),

            machine_id:
                nullable(
                    filters.machine_id
                ),

            shift_id:
                numberOrNull(
                    filters.shift_id
                ),

            plan_entry_id:
                nullable(
                    filters.plan_entry_id
                ),

            signal_id:
                nullable(
                    filters.signal_id
                ),

            alarm_code:
                hasValue(
                    filters.alarm_code
                )
                    ? cleanCode(
                        filters.alarm_code
                    )
                    : null,

            severity:
                hasValue(
                    filters.severity
                )
                    ? cleanCode(
                        filters.severity
                    )
                    : null,

            status:
                hasValue(
                    filters.status
                )
                    ? cleanCode(
                        filters.status
                    )
                    : null,

            correlation_id:
                nullable(
                    filters.correlation_id
                ),

            idempotency_key:
                hasValue(
                    filters.idempotency_key
                )
                    ? cleanString(
                        filters.idempotency_key
                    )
                    : null,

            from_timestamp:
                nullable(
                    filters.from_timestamp
                ),

            to_timestamp:
                nullable(
                    filters.to_timestamp
                ),

            active_only:
                booleanOrNull(
                    filters.active_only
                )
        });


// ============================================================
// NORMALIZE RAISE ALARM
// ============================================================

export const normalizeRaiseAlarmPayload =
    (
        data = {}
    ) => ({

        company_id:
            data.company_id,

        plant_id:
            data.plant_id,

        line_id:
            data.line_id,

        machine_id:
            data.machine_id,

        shift_id:
            numberOrNull(
                data.shift_id
            ),

        plan_entry_id:
            nullable(
                data.plan_entry_id
            ),

        signal_id:
            nullable(
                data.signal_id
            ),

        alarm_code:
            cleanCode(
                data.alarm_code
            ),

        alarm_message:
            hasValue(
                data.alarm_message
            )
                ? cleanString(
                    data.alarm_message
                )
                : null,

        severity:
            hasValue(
                data.severity
            )
                ? cleanCode(
                    data.severity
                )
                : null,

        start_ts:
            data.start_ts,

        status:
            cleanCode(
                data.status ||
                "ACTIVE"
            ),

        correlation_id:
            nullable(
                data.correlation_id
            ),

        idempotency_key:
            hasValue(
                data.idempotency_key
            )
                ? cleanString(
                    data.idempotency_key
                )
                : null
    });


// ============================================================
// NORMALIZE CLEAR ALARM
// ============================================================

export const normalizeClearAlarmPayload =
    (
        data = {}
    ) => ({

        end_ts:
            data.end_ts,

        status:
            cleanCode(
                data.status ||
                "CLEARED"
            )
    });


// ============================================================
// NORMALIZE SUMMARY FILTER
// ============================================================

export const normalizeSummaryFilters =
    (
        filters = {}
    ) =>
        removeEmptyParams({

            company_id:
                nullable(
                    filters.company_id
                ),

            machine_id:
                nullable(
                    filters.machine_id
                ),

            from_timestamp:
                nullable(
                    filters.from_timestamp
                ),

            to_timestamp:
                nullable(
                    filters.to_timestamp
                )
        });


// ============================================================
// CONFIG API
// ============================================================

export const getMachineStatusConfig =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/config`,
                {
                    params:
                        normalizeMachineStatusConfigFilters(
                            filters
                        )
                }
            );


        return response.data;
    };


export const saveMachineStatusConfig =
    async (
        data = {}
    ) => {

        const payload =
            normalizeMachineStatusConfigPayload(
                data
            );


        if (
            data.machine_status_config_id
        ) {

            payload.machine_status_config_id =
                data.machine_status_config_id;
        }


        const response =
            await api.post(
                `${BASE_URL}/config`,
                payload
            );


        return response.data;
    };


// ============================================================
// MASTER API
// ============================================================

export const getMachineStatusMaster =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/master`,
                {
                    params:
                        normalizeMachineStatusConfigFilters(
                            filters
                        )
                }
            );


        return response.data;
    };


export const createMachineStatusConfig =
    async (
        data = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/master`,
                normalizeMachineStatusConfigPayload(
                    data
                )
            );


        return response.data;
    };


export const updateMachineStatusConfig =
    async (
        id,
        data = {}
    ) => {

        const response =
            await api.put(
                `${BASE_URL}/master/${id}`,
                normalizeMachineStatusConfigPayload(
                    data
                )
            );


        return response.data;
    };


export const softDeleteMachineStatusConfig =
    async id => {

        const response =
            await api.delete(
                `${BASE_URL}/master/${id}`
            );


        return response.data;
    };


// ============================================================
// STATUS MAPPING RULE API
// ============================================================

export const getStatusMappingRules =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/rules`,
                {
                    params:
                        normalizeStatusRuleFilters(
                            filters
                        )
                }
            );


        return response.data;
    };


export const getStatusMappingRuleById =
    async id => {

        const response =
            await api.get(
                `${BASE_URL}/rules/${id}`
            );


        return response.data;
    };


export const createStatusMappingRule =
    async (
        data = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/rules`,
                normalizeStatusRulePayload(
                    data
                )
            );


        return response.data;
    };


export const updateStatusMappingRule =
    async (
        id,
        data = {}
    ) => {

        const response =
            await api.put(
                `${BASE_URL}/rules/${id}`,
                normalizeStatusRulePayload(
                    data
                )
            );


        return response.data;
    };


export const softDeleteStatusMappingRule =
    async id => {

        const response =
            await api.delete(
                `${BASE_URL}/rules/${id}`
            );


        return response.data;
    };


// ============================================================
// MACHINE STATUS RUNTIME API
// ============================================================

export const getMachineStatusRuntime =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/runtime`,
                {
                    params:
                        normalizeMachineStatusRuntimeFilters(
                            filters
                        )
                }
            );


        return response.data;
    };


export const getMachineStatusEventById =
    async id => {

        const response =
            await api.get(
                `${BASE_URL}/runtime/event/${id}`
            );


        return response.data;
    };


export const executeMachineStatusResponse =
    async (
        data = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/execute`,
                normalizeExecuteMachineStatusPayload(
                    data
                )
            );


        return response.data;
    };


export const executeMachineStatus =
    async (
        data = {}
    ) => {

        const response =
            await executeMachineStatusResponse(
                data
            );


        return response?.data ??
            response;
    };


// ============================================================
// CURRENT MACHINE STATUS
// ============================================================

export const getCurrentMachineStatus =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/current`,
                {
                    params:
                        normalizeCurrentStatusFilters(
                            filters
                        )
                }
            );


        return response.data;
    };


// ============================================================
// ALARM API
// ============================================================

export const getMachineAlarms =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/alarms`,
                {
                    params:
                        normalizeAlarmFilters(
                            filters
                        )
                }
            );


        return response.data;
    };


export const getMachineAlarmById =
    async id => {

        const response =
            await api.get(
                `${BASE_URL}/alarms/${id}`
            );


        return response.data;
    };


export const raiseMachineAlarmResponse =
    async (
        data = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/alarms/raise`,
                normalizeRaiseAlarmPayload(
                    data
                )
            );


        return response.data;
    };


export const raiseMachineAlarm =
    async (
        data = {}
    ) => {

        const response =
            await raiseMachineAlarmResponse(
                data
            );


        return response?.data ??
            response;
    };


export const clearMachineAlarmResponse =
    async (
        alarmId,
        data = {}
    ) => {

        const response =
            await api.put(
                `${BASE_URL}/alarms/${alarmId}/clear`,
                normalizeClearAlarmPayload(
                    data
                )
            );


        return response.data;
    };


export const clearMachineAlarm =
    async (
        alarmId,
        data = {}
    ) => {

        const response =
            await clearMachineAlarmResponse(
                alarmId,
                data
            );


        return response?.data ??
            response;
    };


// ============================================================
// SUMMARY API
// ============================================================

export const getMachineStatusSummary =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/summary/status`,
                {
                    params:
                        normalizeSummaryFilters(
                            filters
                        )
                }
            );


        return response.data;
    };


export const getMachineAlarmSummary =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/summary/alarm`,
                {
                    params:
                        normalizeSummaryFilters(
                            filters
                        )
                }
            );


        return response.data;
    };


// ============================================================
// MACHINE STATUS REPORT
// ============================================================

export const getMachineStatusReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/report`,
                {
                    params:
                        normalizeMachineStatusRuntimeFilters(
                            filters
                        )
                }
            );


        return {

            data:
                response
                    ?.data
                    ?.data ??
                null,

            meta:
                response
                    ?.data
                    ?.meta ??
                {}
        };
    };


// ============================================================
// MACHINE STATUS EXPORT
// ============================================================

export const exportMachineStatusReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/export`,
                normalizeMachineStatusRuntimeFilters(
                    filters
                )
            );


        return {

            data:
                response
                    ?.data
                    ?.data ??
                null,

            meta:
                response
                    ?.data
                    ?.meta ??
                {}
        };
    };


// ============================================================
// ALARM REPORT
// ============================================================

export const getMachineAlarmReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.get(
                `${BASE_URL}/alarm-report`,
                {
                    params:
                        normalizeAlarmFilters(
                            filters
                        )
                }
            );


        return {

            data:
                response
                    ?.data
                    ?.data ??
                null,

            meta:
                response
                    ?.data
                    ?.meta ??
                {}
        };
    };


// ============================================================
// ALARM EXPORT
// ============================================================

export const exportMachineAlarmReport =
    async (
        filters = {}
    ) => {

        const response =
            await api.post(
                `${BASE_URL}/alarm-export`,
                normalizeAlarmFilters(
                    filters
                )
            );


        return {

            data:
                response
                    ?.data
                    ?.data ??
                null,

            meta:
                response
                    ?.data
                    ?.meta ??
                {}
        };
    };


// ============================================================
// DISPLAY HELPERS
// ============================================================

export const formatDurationSeconds =
    value => {

        if (
            !hasValue(value)
        ) {

            return "-";
        }


        const total =
            Number(value);


        if (
            !Number.isFinite(total)
        ) {

            return "-";
        }


        if (
            total < 1
        ) {

            return `${Math.round(
                total * 1000
            )} ms`;
        }


        if (
            total < 60
        ) {

            return `${Number(
                total.toFixed(3)
            )} sec`;
        }


        const hours =
            Math.floor(
                total /
                3600
            );


        const minutes =
            Math.floor(
                (
                    total %
                    3600
                ) /
                60
            );


        const seconds =
            Math.floor(
                total %
                60
            );


        if (
            hours > 0
        ) {

            return `${hours}h ${minutes}m ${seconds}s`;
        }


        return `${minutes}m ${seconds}s`;
    };


export const formatMachineStatus =
    value =>
        hasValue(value)
            ? cleanCode(value)
            : "UNKNOWN";


// ============================================================
// RESPONSE STATE HELPERS
// ============================================================

export const isStatusSuppressed =
    result =>
        Boolean(
            result
                ?.suppressed
        );


export const isStatusIdempotent =
    result =>
        Boolean(
            result
                ?.idempotent
        );


export const isAlarmAlreadyActive =
    result =>
        Boolean(
            result
                ?.already_active
        );


export const isAlarmAlreadyCleared =
    result =>
        Boolean(
            result
                ?.already_cleared
        );


// ============================================================
// DEFAULT EXPORT
// ============================================================

const machineStatusService = {

    // ========================================================
    // CONSTANTS
    // ========================================================

    MACHINE_STATUS_CODES,

    MACHINE_MODE_CODES,

    ALARM_STATUS_CODES,

    ALARM_SEVERITIES,


    // ========================================================
    // RESPONSE HELPERS
    // ========================================================

    getResponsePayload,

    getResponseMeta,

    getResponseMessage,


    // ========================================================
    // ROW HELPERS
    // ========================================================

    getMachineStatusConfigRows,

    getStatusMappingRuleRows,

    getMachineStatusEventRows,

    getCurrentMachineStatusRows,

    getAlarmRows,

    getMachineStatusSummaryRows,

    getAlarmSummaryRows,


    // ========================================================
    // NORMALIZERS
    // ========================================================

    normalizeMachineStatusConfigFilters,

    normalizeMachineStatusConfigPayload,

    normalizeStatusRuleFilters,

    normalizeStatusRulePayload,

    normalizeMachineStatusRuntimeFilters,

    normalizeExecuteMachineStatusPayload,

    normalizeCurrentStatusFilters,

    normalizeAlarmFilters,

    normalizeRaiseAlarmPayload,

    normalizeClearAlarmPayload,

    normalizeSummaryFilters,


    // ========================================================
    // CONFIG
    // ========================================================

    getMachineStatusConfig,

    saveMachineStatusConfig,


    // ========================================================
    // MASTER
    // ========================================================

    getMachineStatusMaster,

    createMachineStatusConfig,

    updateMachineStatusConfig,

    softDeleteMachineStatusConfig,


    // ========================================================
    // RULES
    // ========================================================

    getStatusMappingRules,

    getStatusMappingRuleById,

    createStatusMappingRule,

    updateStatusMappingRule,

    softDeleteStatusMappingRule,


    // ========================================================
    // RUNTIME
    // ========================================================

    getMachineStatusRuntime,

    getMachineStatusEventById,

    executeMachineStatus,

    executeMachineStatusResponse,

    getCurrentMachineStatus,


    // ========================================================
    // ALARMS
    // ========================================================

    getMachineAlarms,

    getMachineAlarmById,

    raiseMachineAlarm,

    raiseMachineAlarmResponse,

    clearMachineAlarm,

    clearMachineAlarmResponse,


    // ========================================================
    // SUMMARY
    // ========================================================

    getMachineStatusSummary,

    getMachineAlarmSummary,


    // ========================================================
    // REPORT
    // ========================================================

    getMachineStatusReport,

    exportMachineStatusReport,

    getMachineAlarmReport,

    exportMachineAlarmReport,


    // ========================================================
    // FORMATTERS
    // ========================================================

    formatDurationSeconds,

    formatMachineStatus,


    // ========================================================
    // RESULT HELPERS
    // ========================================================

    isStatusSuppressed,

    isStatusIdempotent,

    isAlarmAlreadyActive,

    isAlarmAlreadyCleared
};


export default machineStatusService;