// src/services/line.service.js

import api from "../../../../shared/api/client.js";

const lineService = {

    // ============================================
    // Configuration
    // ============================================

    getConfig() {

        return api.get(

            "/line-master/config"

        );

    },

    updateConfig(data) {

        return api.post(

            "/line-master/config",

            data

        );

    },

    // ============================================
    // Master
    // ============================================

    getMaster() {

        return api.get(

            "/line-master/master"

        );

    },

    getMasterById(id) {

        return api.get(

            `/line-master/master/${id}`

        );

    },

    createMaster(data) {

        return api.post(

            "/line-master/master",

            data

        );

    },

    updateMaster(id, data) {

        return api.put(

            `/line-master/master/${id}`,

            data

        );

    },

    // ============================================
    // Runtime
    // ============================================

    getRuntime() {

        return api.get(

            "/line-master/runtime"

        );

    },

    // ============================================
    // Execute
    // ============================================

    execute(action = "SYNC") {

        return api.post(

            "/line-master/execute",

            {

                action

            }

        );

    },

    // ============================================
    // Report
    // ============================================

    getReport(status = "ACTIVE") {

        return api.get(

            `/line-master/report?status=${status}`

        );

    },

    // ============================================
    // Export
    // ============================================

    export(format = "CSV") {

        return api.post(

            "/line-master/export",

            {

                format

            },

            {

                responseType: "blob"

            }

        );

    }

};

export default lineService;