// src/services/changeoverSetupPlan.service.js

/**
 * ============================================================
 * OPERATEX MES
 * PLANNING MODULE
 * CHANGEOVER / SETUP PLAN - FRONTEND SERVICE
 * ============================================================
 *
 * BACKEND BASE:
 *
 * /api/changeover-setup-plan
 *
 * Since ../../services/api already contains the /api base,
 * this service uses:
 *
 * /changeover-setup-plan
 *
 * ------------------------------------------------------------
 * ENDPOINTS
 * ------------------------------------------------------------
 *
 * GET    /config
 * POST   /config
 *
 * GET    /master
 * POST   /master
 * PUT    /master/:id
 *
 * GET    /runtime
 * POST   /execute
 *
 * GET    /report
 *
 * ------------------------------------------------------------
 * MASTER TYPES
 * ------------------------------------------------------------
 *
 * SETUP_TEMPLATE
 * SETUP_PLAN_CONFIG
 * CHANGEOVER_RULE
 *
 * ------------------------------------------------------------
 * NO DELETE
 * NO EXPORT
 * ============================================================
 */


import api from "../../../../shared/api/client.js";


// ============================================================
// BASE URL
// ============================================================

const BASE_URL =
    "/changeover-setup-plan";


// ============================================================
// MASTER TYPES
// ============================================================

export const CHANGEOVER_MASTER_TYPES = {

    SETUP_TEMPLATE:
        "SETUP_TEMPLATE",

    SETUP_PLAN_CONFIG:
        "SETUP_PLAN_CONFIG",

    CHANGEOVER_RULE:
        "CHANGEOVER_RULE"
};


// ============================================================
// COMMON HELPERS
// ============================================================

const cleanParams =
    params => {

        if (
            !params ||
            typeof params !== "object"
        ) {
            return {};
        }


        return Object.fromEntries(
            Object.entries(params)
                .filter(
                    ([, value]) =>
                        value !== undefined &&
                        value !== null &&
                        value !== ""
                )
        );
    };


// ============================================================
// RESPONSE HELPERS
// ============================================================

/**
 * Axios response:
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
 *
 * Returns standard backend JSON envelope.
 */

export const unwrapChangeoverSetupPlanResponse =
    response =>
        response?.data ??
        response;


/**
 * Returns only backend payload.
 *
 * Example:
 *
 * response.data.data
 */

export const getChangeoverSetupPlanResponseData =
    response => {

        const root =
            unwrapChangeoverSetupPlanResponse(
                response
            );


        if (
            root &&
            Object.prototype
                .hasOwnProperty
                .call(
                    root,
                    "data"
                )
        ) {
            return root.data;
        }


        return root;
    };


// ============================================================
// ARRAY HELPER
// ============================================================

export const getChangeoverSetupPlanRows =
    (
        response,
        possibleKeys = []
    ) => {

        if (!response) {
            return [];
        }


        if (
            Array.isArray(
                response
            )
        ) {
            return response;
        }


        const envelope =
            unwrapChangeoverSetupPlanResponse(
                response
            );


        const payload =
            getChangeoverSetupPlanResponseData(
                response
            );


        if (
            Array.isArray(
                payload
            )
        ) {
            return payload;
        }


        if (
            Array.isArray(
                payload?.rows
            )
        ) {
            return payload.rows;
        }


        if (
            Array.isArray(
                envelope?.rows
            )
        ) {
            return envelope.rows;
        }


        for (
            const key of possibleKeys
        ) {

            if (
                Array.isArray(
                    payload?.[key]
                )
            ) {
                return payload[key];
            }


            if (
                Array.isArray(
                    envelope?.[key]
                )
            ) {
                return envelope[key];
            }


            if (
                Array.isArray(
                    envelope?.data?.[key]
                )
            ) {
                return envelope.data[key];
            }
        }


        return [];
    };


// ============================================================
// MASTER COLLECTIONS
// ============================================================

export const getChangeoverSetupPlanMasterCollections =
    response => {

        const data =
            getChangeoverSetupPlanResponseData(
                response
            ) || {};


        return {

            setupTemplates:
                Array.isArray(
                    data?.setup_template
                )
                    ? data.setup_template
                    : [],


            setupPlanConfigs:
                Array.isArray(
                    data?.setup_plan_config
                )
                    ? data.setup_plan_config
                    : [],


            changeoverRules:
                Array.isArray(
                    data?.changeover_rule
                )
                    ? data.changeover_rule
                    : []
        };
    };


// ============================================================
// CONFIG COLLECTIONS
// ============================================================

export const getChangeoverSetupPlanConfigCollections =
    response => {

        const data =
            getChangeoverSetupPlanResponseData(
                response
            ) || {};


        return {

            setupTemplates:
                Array.isArray(
                    data?.setup_template
                )
                    ? data.setup_template
                    : [],


            setupPlanConfigs:
                Array.isArray(
                    data?.setup_plan_config
                )
                    ? data.setup_plan_config
                    : [],


            changeoverRules:
                Array.isArray(
                    data?.changeover_rule
                )
                    ? data.changeover_rule
                    : []
        };
    };


// ============================================================
// RUNTIME COLLECTIONS
// ============================================================

export const getChangeoverSetupPlanRuntimeCollections =
    response => {

        const data =
            getChangeoverSetupPlanResponseData(
                response
            ) || {};


        return {

            setupExecutions:
                Array.isArray(
                    data?.setup_execution
                )
                    ? data.setup_execution
                    : [],


            changeoverEvents:
                Array.isArray(
                    data?.changeover_event
                )
                    ? data.changeover_event
                    : []
        };
    };


// ============================================================
// REPORT COLLECTIONS
// ============================================================

export const getChangeoverSetupPlanReportCollections =
    response => {

        const data =
            getChangeoverSetupPlanResponseData(
                response
            ) || {};


        return {

            setupExecutions:
                Array.isArray(
                    data?.setup_execution
                )
                    ? data.setup_execution
                    : [],


            changeoverEvents:
                Array.isArray(
                    data?.changeover_event
                )
                    ? data.changeover_event
                    : [],


            meta:
                data?.meta ||
                unwrapChangeoverSetupPlanResponse(
                    response
                )?.meta ||
                {}
        };
    };


// ============================================================
// ERROR HELPER
// ============================================================

export const getChangeoverSetupPlanErrorMessage =
    (
        error,
        fallback =
            "Something went wrong."
    ) => {

        const response =
            error?.response?.data;


        if (
            Array.isArray(
                response?.errors
            ) &&
            response.errors.length > 0
        ) {

            return `${
                response.message ||
                "Validation failed."
            } ${
                response.errors.join(
                    ", "
                )
            }`;
        }


        return (
            response?.message ||
            error?.message ||
            fallback
        );
    };


// ============================================================
// CONFIG API
// ============================================================

const getConfig =
    async (
        filters = {}
    ) => {

        return api.get(
            `${BASE_URL}/config`,
            {
                params:
                    cleanParams(
                        filters
                    )
            }
        );
    };


const saveConfig =
    async payload => {

        return api.post(
            `${BASE_URL}/config`,
            payload
        );
    };


// ============================================================
// MASTER API
// ============================================================

const getMaster =
    async (
        filters = {}
    ) => {

        return api.get(
            `${BASE_URL}/master`,
            {
                params:
                    cleanParams(
                        filters
                    )
            }
        );
    };


const createMaster =
    async payload => {

        return api.post(
            `${BASE_URL}/master`,
            payload
        );
    };


const updateMaster =
    async (
        id,
        payload
    ) => {

        return api.put(
            `${BASE_URL}/master/${id}`,
            payload
        );
    };


// ============================================================
// SETUP TEMPLATE
// ============================================================

const createSetupTemplate =
    async data => {

        return createMaster({

            ...data,

            master_type:
                CHANGEOVER_MASTER_TYPES
                    .SETUP_TEMPLATE
        });
    };


const updateSetupTemplate =
    async (
        setupTemplateId,
        data
    ) => {

        return updateMaster(
            setupTemplateId,
            {
                ...data,

                master_type:
                    CHANGEOVER_MASTER_TYPES
                        .SETUP_TEMPLATE
            }
        );
    };


// ============================================================
// SETUP PLAN CONFIG
// ============================================================

const createSetupPlanConfig =
    async data => {

        return createMaster({

            ...data,

            master_type:
                CHANGEOVER_MASTER_TYPES
                    .SETUP_PLAN_CONFIG
        });
    };


const updateSetupPlanConfig =
    async (
        setupPlanConfigId,
        data
    ) => {

        return updateMaster(
            setupPlanConfigId,
            {
                ...data,

                master_type:
                    CHANGEOVER_MASTER_TYPES
                        .SETUP_PLAN_CONFIG
            }
        );
    };


// ============================================================
// CHANGEOVER RULE
// ============================================================

const createChangeoverRule =
    async data => {

        return createMaster({

            ...data,

            master_type:
                CHANGEOVER_MASTER_TYPES
                    .CHANGEOVER_RULE
        });
    };


const updateChangeoverRule =
    async (
        changeoverRuleId,
        data
    ) => {

        return updateMaster(
            changeoverRuleId,
            {
                ...data,

                master_type:
                    CHANGEOVER_MASTER_TYPES
                        .CHANGEOVER_RULE
            }
        );
    };


// ============================================================
// CONFIG CONVENIENCE METHODS
// ============================================================

const saveSetupTemplateConfig =
    async data => {

        return saveConfig({

            ...data,

            master_type:
                CHANGEOVER_MASTER_TYPES
                    .SETUP_TEMPLATE
        });
    };


const saveSetupPlanConfig =
    async data => {

        return saveConfig({

            ...data,

            master_type:
                CHANGEOVER_MASTER_TYPES
                    .SETUP_PLAN_CONFIG
        });
    };


const saveChangeoverRuleConfig =
    async data => {

        return saveConfig({

            ...data,

            master_type:
                CHANGEOVER_MASTER_TYPES
                    .CHANGEOVER_RULE
        });
    };


// ============================================================
// RUNTIME
// ============================================================

const getRuntime =
    async (
        filters = {}
    ) => {

        return api.get(
            `${BASE_URL}/runtime`,
            {
                params:
                    cleanParams(
                        filters
                    )
            }
        );
    };


// ============================================================
// EXECUTE
//
// BACKEND DETERMINES MODE:
//
// MODE 1:
// no setup_execution_id
//      → CREATE setup_execution
//
// MODE 2:
// setup_execution_id
// no event_type
//      → UPDATE setup_execution
//
// MODE 3:
// setup_execution_id
// event_type
//      → CREATE changeover_event
// ============================================================

const execute =
    async payload => {

        return api.post(
            `${BASE_URL}/execute`,
            payload
        );
    };


// ============================================================
// CREATE SETUP EXECUTION
// ============================================================

const createSetupExecution =
    async data => {

        const payload = {
            ...data
        };


        delete payload
            .setup_execution_id;


        delete payload
            .event_type;


        return execute(
            payload
        );
    };


// ============================================================
// UPDATE SETUP EXECUTION
// ============================================================

const updateSetupExecution =
    async (
        setupExecutionId,
        data
    ) => {

        const payload = {

            ...data,

            setup_execution_id:
                setupExecutionId
        };


        // ----------------------------------------------------
        // Important:
        // event_type causes backend to create a changeover
        // event instead of updating execution.
        // ----------------------------------------------------

        delete payload
            .event_type;


        return execute(
            payload
        );
    };


// ============================================================
// CREATE CHANGEOVER EVENT
// ============================================================

const createChangeoverEvent =
    async (
        setupExecutionId,
        data
    ) => {

        return execute({

            ...data,

            setup_execution_id:
                setupExecutionId
        });
    };


// ============================================================
// COMMON EXECUTION ACTION HELPERS
//
// These only populate runtime fields already supported by the
// backend. They do not invent database columns.
// ============================================================

const startSetupExecution =
    async (
        setupExecutionId,
        data = {}
    ) => {

        return updateSetupExecution(
            setupExecutionId,
            {

                ...data,

                status:
                    data.status ||
                    "RUNNING",

                started_at:
                    data.started_at ||
                    new Date()
                        .toISOString()
            }
        );
    };


const completeSetupExecution =
    async (
        setupExecutionId,
        data = {}
    ) => {

        return updateSetupExecution(
            setupExecutionId,
            {

                ...data,

                status:
                    data.status ||
                    "COMPLETED",

                completed_at:
                    data.completed_at ||
                    new Date()
                        .toISOString()
            }
        );
    };


// ============================================================
// REPORT
// ============================================================

const getReport =
    async (
        filters = {}
    ) => {

        return api.get(
            `${BASE_URL}/report`,
            {
                params:
                    cleanParams(
                        filters
                    )
            }
        );
    };


// ============================================================
// SERVICE EXPORT
// ============================================================

const changeoverSetupPlanService = {


    // ========================================================
    // CONFIG
    // ========================================================

    getConfig,

    saveConfig,

    saveSetupTemplateConfig,

    saveSetupPlanConfig,

    saveChangeoverRuleConfig,


    // ========================================================
    // MASTER
    // ========================================================

    getMaster,

    createMaster,

    updateMaster,


    // ========================================================
    // SETUP TEMPLATE
    // ========================================================

    createSetupTemplate,

    updateSetupTemplate,


    // ========================================================
    // SETUP PLAN CONFIG
    // ========================================================

    createSetupPlanConfig,

    updateSetupPlanConfig,


    // ========================================================
    // CHANGEOVER RULE
    // ========================================================

    createChangeoverRule,

    updateChangeoverRule,


    // ========================================================
    // RUNTIME
    // ========================================================

    getRuntime,

    execute,


    // ========================================================
    // SETUP EXECUTION
    // ========================================================

    createSetupExecution,

    updateSetupExecution,

    startSetupExecution,

    completeSetupExecution,


    // ========================================================
    // CHANGEOVER EVENT
    // ========================================================

    createChangeoverEvent,


    // ========================================================
    // REPORT
    // ========================================================

    getReport
};


export default changeoverSetupPlanService;