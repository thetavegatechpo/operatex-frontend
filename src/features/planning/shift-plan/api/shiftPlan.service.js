// src/services/shiftPlan.service.js

/**
 * ============================================================
 * OPERATEX MES
 * PLANNING MODULE
 * SHIFT PLAN - FRONTEND SERVICE
 * ============================================================
 *
 * API0163 GET  /api/shift-plan/config
 * API0164 POST /api/shift-plan/config
 *
 * API0165 GET  /api/shift-plan/master
 * API0166 POST /api/shift-plan/master
 * API0167 PUT  /api/shift-plan/master/:id
 *
 * API0168 GET  /api/shift-plan/runtime
 * API0169 POST /api/shift-plan/execute
 * API0170 GET  /api/shift-plan/report
 *
 * ------------------------------------------------------------
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * No DELETE API.
 * No Export API.
 * No plan_operation API.
 * No plan_execution_event API.
 */


import api from "../../../../shared/api/client.js";


const API = "/shift-plan";

const shiftPlanService = {


    /* ========================================================
       API0163
       GET /api/shift-plan/config
    ======================================================== */

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


    /* ========================================================
       API0164
       POST /api/shift-plan/config

       Create/update plan_generation_rule.

       Update is identified by:
       payload.plan_generation_rule_id
    ======================================================== */

    saveConfig: async payload => {

        return api.post(
            `${API}/config`,
            payload
        );
    },


    /* ========================================================
       API0165
       GET /api/shift-plan/master
    ======================================================== */

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


    /* ========================================================
       API0166
       POST /api/shift-plan/master
    ======================================================== */

    createMaster: async payload => {

        return api.post(
            `${API}/master`,
            payload
        );
    },


    /* ========================================================
       API0167
       PUT /api/shift-plan/master/:id
    ======================================================== */

    updateMaster: async (
        planGenerationRuleId,
        payload
    ) => {

        return api.put(
            `${API}/master/${planGenerationRuleId}`,
            payload
        );
    },


    /* ========================================================
       API0168
       GET /api/shift-plan/runtime
    ======================================================== */

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


    /* ========================================================
       API0169
       POST /api/shift-plan/execute

       Existing entry:
       {
           plan_generation_rule_id,
           plan_entry_id,
           new_status,
           ...
       }

       Generate new entry:
       {
           plan_generation_rule_id,
           plan_id,
           machine_id,
           sequence_no,
           ...
       }
    ======================================================== */

    execute: async payload => {

        return api.post(
            `${API}/execute`,
            payload
        );
    },


    /* ========================================================
       API0170
       GET /api/shift-plan/report
    ======================================================== */

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


export default shiftPlanService;