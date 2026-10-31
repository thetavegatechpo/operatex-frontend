// src/services/netGateway.service.js

import api from "../../../../shared/api/client.js";

const API = "/net-gateway";

const netGatewayService = {

    // =========================================================
    // GATEWAY CONFIG
    // =========================================================

    getConfig(params = {}) {

        return api.get(
            `${API}/config`,
            {
                params
            }
        );

    },


    saveConfig(payload) {

        return api.post(
            `${API}/config`,
            payload
        );

    },


    // =========================================================
    // GATEWAY DEVICE MASTER
    // =========================================================

    getMaster(params = {}) {

        return api.get(
            `${API}/master`,
            {
                params
            }
        );

    },


    createMaster(payload) {

        return api.post(
            `${API}/master`,
            payload
        );

    },


    updateMaster(
        id,
        payload
    ) {

        return api.put(
            `${API}/master/${id}`,
            payload
        );

    },


    // =========================================================
    // RUNTIME
    // =========================================================

    getRuntime(params = {}) {

        return api.get(
            `${API}/runtime`,
            {
                params
            }
        );

    },


    // =========================================================
    // EXECUTE
    // =========================================================

    execute(payload) {

        return api.post(
            `${API}/execute`,
            payload
        );

    },


    // =========================================================
    // REPORT
    // =========================================================

    getReport(params = {}) {

        return api.get(
            `${API}/report`,
            {
                params
            }
        );

    },


    // =========================================================
    // EXPORT
    // =========================================================

    exportData(payload) {

        return api.post(
            `${API}/export`,
            payload,
            {
                responseType: "blob"
            }
        );

    }

};

export default netGatewayService;