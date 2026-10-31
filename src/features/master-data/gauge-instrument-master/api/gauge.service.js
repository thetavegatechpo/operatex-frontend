// src/services/gauge.service.js

import api from "../../../../shared/api/client.js";

const BASE_URL =
    "/gauge-instrument-master";


// ==========================================================
// SERVICE
// ==========================================================

const gaugeService = {

    // ======================================================
    // CONFIG
    // ======================================================

    getConfig() {

        return api.get(
            `${BASE_URL}/config`
        );

    },


    getParameterConfig() {

        return api.get(
            `${BASE_URL}/config/parameter`
        );

    },


    getCalibrationConfig() {

        return api.get(
            `${BASE_URL}/config/calibration`
        );

    },


    getConfigById(
        table,
        id
    ) {

        return api.get(
            `${BASE_URL}/config/${String(table).toUpperCase()}/${id}`
        );

    },


    createConfig(payload) {

        return api.post(
            `${BASE_URL}/config`,
            payload
        );

    },


    updateConfig(
        table,
        id,
        payload
    ) {

        return api.put(
            `${BASE_URL}/config/${String(table).toUpperCase()}/${id}`,
            payload
        );

    },


    deleteConfig(
        table,
        id
    ) {

        return api.delete(
            `${BASE_URL}/config/${String(table).toUpperCase()}/${id}`
        );

    },


    // ======================================================
    // MASTER
    // ======================================================

    getMaster() {

        return api.get(
            `${BASE_URL}/master`
        );

    },


    getMasterById(id) {

        return api.get(
            `${BASE_URL}/master/${id}`
        );

    },


    createMaster(payload) {

        return api.post(
            `${BASE_URL}/master`,
            payload
        );

    },


    updateMaster(
        id,
        payload
    ) {

        return api.put(
            `${BASE_URL}/master/${id}`,
            payload
        );

    },


    deleteMaster(id) {

        return api.delete(
            `${BASE_URL}/master/${id}`
        );

    },


    // ======================================================
    // RUNTIME
    // ======================================================

    getRuntime(filters = {}) {

        return api.get(
            `${BASE_URL}/runtime`,
            {
                params: filters
            }
        );

    },


    getGaugeLogs() {

        return api.get(
            `${BASE_URL}/runtime/log`
        );

    },


    getCalibrationEvents() {

        return api.get(
            `${BASE_URL}/runtime/calibration-event`
        );

    },


    // ======================================================
    // EXECUTE
    // ======================================================

    execute(payload) {

        return api.post(
            `${BASE_URL}/execute`,
            payload
        );

    },


    // ======================================================
    // REPORT
    // ======================================================

    getReport(filters = {}) {

        return api.get(
            `${BASE_URL}/report`,
            {
                params: filters
            }
        );

    },


    // ======================================================
    // EXPORT
    // ======================================================

    exportData(payload = {}) {

        return api.post(
            `${BASE_URL}/export`,
            payload
        );

    }

};


export default gaugeService;