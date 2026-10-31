import api from "../../../../shared/api/client.js";


/**
 * ============================================================
 * OPERATEX MES
 * PLANNING MODULE
 * PRODUCTION PLAN - FRONTEND SERVICE
 * ============================================================
 *
 * API0154 GET  /api/production-plan/config
 * API0155 POST /api/production-plan/config
 *
 * API0156 GET  /api/production-plan/master
 * API0157 POST /api/production-plan/master
 * API0158 PUT  /api/production-plan/master/:id
 *
 * API0159 GET  /api/production-plan/runtime
 * API0160 POST /api/production-plan/execute
 * API0161 GET  /api/production-plan/report
 * API0162 POST /api/production-plan/export
 */


const API =
    "/production-plan";


const productionPlanService = {

    // ========================================================
    // API0154
    // CONFIG
    // ========================================================

    getConfig(planId) {

        return api.get(
            `${API}/config`,
            {
                params: {
                    plan_id:
                        planId
                }
            }
        );
    },


    // ========================================================
    // API0155
    // SAVE CONFIG
    //
    // Handles independently:
    //
    // plan_entries
    // plan_operations
    // ========================================================

    saveConfig(payload) {

        return api.post(
            `${API}/config`,
            payload
        );
    },


    // ========================================================
    // API0156
    // GET PRODUCTION PLAN MASTER
    //
    // Supported filters:
    //
    // company_id
    // plant_id
    // line_id
    // shift_id
    // plan_date
    // status
    // ========================================================

    getMaster(params = {}) {

        return api.get(
            `${API}/master`,
            {
                params
            }
        );
    },


    // ========================================================
    // API0157
    // CREATE PRODUCTION PLAN
    // ========================================================

    createMaster(payload) {

        return api.post(
            `${API}/master`,
            payload
        );
    },


    // ========================================================
    // API0158
    // UPDATE PRODUCTION PLAN
    // ========================================================

    updateMaster(
        planId,
        payload
    ) {

        return api.put(
            `${API}/master/${planId}`,
            payload
        );
    },


    // ========================================================
    // API0158
    // SOFT DELETE
    //
    // Same API0158 endpoint.
    //
    // Backend expects:
    //
    // {
    //     soft_delete_status: "..."
    // }
    // ========================================================

    softDeleteMaster(
        planId,
        softDeleteStatus
    ) {

        return api.put(
            `${API}/master/${planId}`,
            {
                soft_delete_status:
                    softDeleteStatus
            }
        );
    },


    // ========================================================
    // API0159
    // RUNTIME
    //
    // Supported filters:
    //
    // company_id
    // plant_id
    // line_id
    // shift_id
    // plan_date
    // status
    // ========================================================

    getRuntime(params = {}) {

        return api.get(
            `${API}/runtime`,
            {
                params
            }
        );
    },


    // ========================================================
    // API0160
    // EXECUTE
    //
    // target_type:
    //
    // PLAN
    // PLAN_ENTRY
    // PLAN_OPERATION
    // ========================================================

    execute(payload) {

        return api.post(
            `${API}/execute`,
            payload
        );
    },


    // ========================================================
    // API0161
    // REPORT
    //
    // Supported filters:
    //
    // company_id
    // plant_id
    // line_id
    // shift_id
    // from_date
    // to_date
    // status
    // plan_id
    // ========================================================

    getReport(params = {}) {

        return api.get(
            `${API}/report`,
            {
                params
            }
        );
    },


    // ========================================================
    // API0162
    // EXPORT
    //
    // Backend returns structured data.
    // Frontend converts it to CSV.
    // ========================================================

    exportData(payload = {}) {

        return api.post(
            `${API}/export`,
            payload
        );
    }
};


export default productionPlanService;