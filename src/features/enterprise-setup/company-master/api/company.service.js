// src/services/company.service.js

import api from "../../../../shared/api/client.js";

const companyService = {

    // =====================================
    // Configuration
    // =====================================

    getConfig() {

        return api.get("/company-master/config");

    },

    // =====================================
    // Master
    // =====================================

    getMaster() {

        return api.get("/company-master/master");

    },

    getById(id) {

        return api.get(`/company-master/master/${id}`);

    },

    create(data) {

        return api.post(

            "/company-master",

            data

        );

    },

    update(id, data) {

        return api.put(

            `/company-master/master/${id}`,

            data

        );

    },

    // =====================================
    // Runtime
    // =====================================

    getRuntime() {

        return api.get(

            "/company-master/runtime"

        );

    },

    execute(action = "SYNC") {

        return api.post(

            "/company-master/execute",

            {

                action

            }

        );

    },

    // =====================================
    // Report
    // =====================================

    getReport(status = "ACTIVE") {

        return api.get(

            `/company-master/report?status=${status}`

        );

    },

    // =====================================
    // Export
    // =====================================

    export(format = "CSV") {

        return api.post(

            "/company-master/export",

            {

                format

            },

            {

                responseType: "blob"

            }

        );

    }

};

export default companyService;