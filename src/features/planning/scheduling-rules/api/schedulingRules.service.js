// src/services/schedulingRules.service.js

/**
 * ============================================================
 * OPERATEX MES
 * PLANNING MODULE
 * SCHEDULING RULES - FRONTEND SERVICE
 * ============================================================
 *
 * CONFIG
 * ------------------------------------------------------------
 * GET /api/scheduling-rules/config
 *
 * MASTER
 * ------------------------------------------------------------
 * GET /api/scheduling-rules/master
 *
 * PRIORITY CONFIG
 * ------------------------------------------------------------
 * GET  /api/scheduling-rules/priority
 * GET  /api/scheduling-rules/priority/:id
 * POST /api/scheduling-rules/priority
 * PUT  /api/scheduling-rules/priority/:id
 *
 * CAPACITY CONFIG
 * ------------------------------------------------------------
 * GET  /api/scheduling-rules/capacity
 * GET  /api/scheduling-rules/capacity/:id
 * POST /api/scheduling-rules/capacity
 * PUT  /api/scheduling-rules/capacity/:id
 *
 * SCHEDULE RULE CONFIG
 * ------------------------------------------------------------
 * GET  /api/scheduling-rules/rules
 * GET  /api/scheduling-rules/rules/:id
 * POST /api/scheduling-rules/rules
 * PUT  /api/scheduling-rules/rules/:id
 *
 * SCHEDULE EVENTS
 * ------------------------------------------------------------
 * GET /api/scheduling-rules/events
 * GET /api/scheduling-rules/events/:id
 *
 * RUNTIME / EXECUTE / REPORT
 * ------------------------------------------------------------
 * GET  /api/scheduling-rules/runtime
 * POST /api/scheduling-rules/execute
 * GET  /api/scheduling-rules/report
 *
 * ------------------------------------------------------------
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * No DELETE API.
 * No Export API.
 *
 * schedule_event is created only through:
 *
 * POST /api/scheduling-rules/execute
 */


import api from "../../../../shared/api/client.js";


const API =
    "/scheduling-rules";


const schedulingRulesService = {


    // ========================================================
    // CONFIG
    // ========================================================

    /**
     * GET /api/scheduling-rules/config
     *
     * Returns active:
     *
     * {
     *   priority_configs: [],
     *   capacity_configs: [],
     *   schedule_rules: []
     * }
     */

    getConfig: async (
        params = {}
    ) => {

        return api.get(
            `${API}/config`,
            {
                params
            }
        );
    },


    // ========================================================
    // MASTER
    // ========================================================

    /**
     * GET /api/scheduling-rules/master
     *
     * Returns:
     *
     * {
     *   priority_configs: [],
     *   capacity_configs: [],
     *   schedule_rules: []
     * }
     */

    getMaster: async (
        params = {}
    ) => {

        return api.get(
            `${API}/master`,
            {
                params
            }
        );
    },


    // ========================================================
    // PRIORITY CONFIG
    // ========================================================

    /**
     * GET /api/scheduling-rules/priority
     */

    getPriorityConfigs: async (
        params = {}
    ) => {

        return api.get(
            `${API}/priority`,
            {
                params
            }
        );
    },


    /**
     * GET /api/scheduling-rules/priority/:id
     */

    getPriorityConfigById: async (
        priorityConfigId
    ) => {

        return api.get(
            `${API}/priority/${priorityConfigId}`
        );
    },


    /**
     * POST /api/scheduling-rules/priority
     *
     * Payload:
     *
     * {
     *   company_id,
     *   priority_code,
     *   priority_name,
     *   priority_rank,
     *   score_expression,
     *   is_active,
     *   version_no
     * }
     */

    createPriorityConfig: async payload => {

        return api.post(
            `${API}/priority`,
            payload
        );
    },


    /**
     * PUT /api/scheduling-rules/priority/:id
     */

    updatePriorityConfig: async (
        priorityConfigId,
        payload
    ) => {

        return api.put(
            `${API}/priority/${priorityConfigId}`,
            payload
        );
    },


    // ========================================================
    // CAPACITY CONFIG
    // ========================================================

    /**
     * GET /api/scheduling-rules/capacity
     *
     * Supported filters can include:
     *
     * company_id
     * plant_id
     * line_id
     * machine_id
     * shift_id
     * is_active
     * effective_date
     *
     * IMPORTANT:
     * shift_id is INTEGER.
     */

    getCapacityConfigs: async (
        params = {}
    ) => {

        return api.get(
            `${API}/capacity`,
            {
                params
            }
        );
    },


    /**
     * GET /api/scheduling-rules/capacity/:id
     */

    getCapacityConfigById: async (
        capacityId
    ) => {

        return api.get(
            `${API}/capacity/${capacityId}`
        );
    },


    /**
     * POST /api/scheduling-rules/capacity
     *
     * Payload:
     *
     * {
     *   company_id,
     *   plant_id,
     *   line_id,
     *   machine_id,
     *   shift_id,
     *   capacity_code,
     *   available_mins,
     *   target_qty,
     *   efficiency_factor,
     *   effective_from,
     *   effective_to,
     *   is_active,
     *   version_no
     * }
     */

    createCapacityConfig: async payload => {

        return api.post(
            `${API}/capacity`,
            payload
        );
    },


    /**
     * PUT /api/scheduling-rules/capacity/:id
     */

    updateCapacityConfig: async (
        capacityId,
        payload
    ) => {

        return api.put(
            `${API}/capacity/${capacityId}`,
            payload
        );
    },


    // ========================================================
    // SCHEDULE RULE CONFIG
    // ========================================================

    /**
     * GET /api/scheduling-rules/rules
     */

    getScheduleRules: async (
        params = {}
    ) => {

        return api.get(
            `${API}/rules`,
            {
                params
            }
        );
    },


    /**
     * GET /api/scheduling-rules/rules/:id
     */

    getScheduleRuleById: async (
        ruleId
    ) => {

        return api.get(
            `${API}/rules/${ruleId}`
        );
    },


    /**
     * POST /api/scheduling-rules/rules
     *
     * Payload:
     *
     * {
     *   company_id,
     *   plant_id,
     *   line_id,
     *   rule_code,
     *   rule_name,
     *   priority_config_id,
     *   capacity_config_id,
     *   sequencing_strategy,
     *   rule_expression,
     *   is_active,
     *   version_no
     * }
     */

    createScheduleRule: async payload => {

        return api.post(
            `${API}/rules`,
            payload
        );
    },


    /**
     * PUT /api/scheduling-rules/rules/:id
     */

    updateScheduleRule: async (
        ruleId,
        payload
    ) => {

        return api.put(
            `${API}/rules/${ruleId}`,
            payload
        );
    },


    // ========================================================
    // SCHEDULE EVENTS
    // ========================================================

    /**
     * GET /api/scheduling-rules/events
     *
     * Supported filters can include:
     *
     * company_id
     * plant_id
     * line_id
     * machine_id
     * shift_id
     * plan_id
     * plan_entry_id
     * schedule_rule_id
     * event_type
     * result_status
     * from_date
     * to_date
     */

    getScheduleEvents: async (
        params = {}
    ) => {

        return api.get(
            `${API}/events`,
            {
                params
            }
        );
    },


    /**
     * GET /api/scheduling-rules/events/:id
     */

    getScheduleEventById: async (
        scheduleEventId
    ) => {

        return api.get(
            `${API}/events/${scheduleEventId}`
        );
    },


    // ========================================================
    // RUNTIME
    // ========================================================

    /**
     * GET /api/scheduling-rules/runtime
     *
     * Returns:
     *
     * {
     *   schedule_rules: [],
     *   priority_configs: [],
     *   capacity_configs: [],
     *   schedule_events: []
     * }
     */

    getRuntime: async (
        params = {}
    ) => {

        return api.get(
            `${API}/runtime`,
            {
                params
            }
        );
    },


    // ========================================================
    // EXECUTE
    // ========================================================

    /**
     * POST /api/scheduling-rules/execute
     *
     * Creates schedule_event through controlled
     * Scheduling Rules execution.
     *
     * Payload:
     *
     * {
     *   company_id,
     *   plant_id,
     *   line_id,
     *   machine_id,
     *
     *   shift_id,
     *
     *   plan_id,
     *   plan_entry_id,
     *
     *   schedule_rule_id,
     *
     *   event_type,
     *
     *   sequence_no,
     *
     *   scheduled_start,
     *   scheduled_end,
     *
     *   score_value,
     *
     *   result_status,
     *   reason,
     *
     *   correlation_id,
     *   idempotency_key
     * }
     *
     * IMPORTANT:
     *
     * shift_id is INTEGER.
     */

    execute: async payload => {

        return api.post(
            `${API}/execute`,
            payload
        );
    },


    // ========================================================
    // REPORT
    // ========================================================

    /**
     * GET /api/scheduling-rules/report
     */

    getReport: async (
        params = {}
    ) => {

        return api.get(
            `${API}/report`,
            {
                params
            }
        );
    }
};


export default schedulingRulesService;