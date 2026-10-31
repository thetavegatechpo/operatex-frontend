// src/services/skill.service.js

import api from "../../../../shared/api/client.js";

const API = "/skill-matrix";


// ==========================================================
// SERVICE
// ==========================================================

const skillService = {

    // ======================================================
    // CONFIG
    // ======================================================

    getConfig() {

        return api.get(
            `${API}/config`
        );

    },


    getLevelConfig() {

        return api.get(
            `${API}/config/level`
        );

    },


    getCertificationConfig() {

        return api.get(
            `${API}/config/certification`
        );

    },


    getConfigById(
        table,
        id
    ) {

        return api.get(
            `${API}/config/${String(table).toUpperCase()}/${id}`
        );

    },


    createConfig(payload) {

        return api.post(
            `${API}/config`,
            payload
        );

    },


    updateConfig(
        table,
        id,
        payload
    ) {

        return api.put(
            `${API}/config/${String(table).toUpperCase()}/${id}`,
            payload
        );

    },


    deleteConfig(
        table,
        id
    ) {

        return api.delete(
            `${API}/config/${String(table).toUpperCase()}/${id}`
        );

    },


    // ======================================================
    // MASTER
    // ======================================================

    getMaster() {

        return api.get(
            `${API}/master`
        );

    },


    getMasterById(id) {

        return api.get(
            `${API}/master/${id}`
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


    deleteMaster(id) {

        return api.delete(
            `${API}/master/${id}`
        );

    },


    // ======================================================
    // RUNTIME
    // ======================================================

    getRuntime(filters = {}) {

        return api.get(
            `${API}/runtime`,
            {
                params: filters
            }
        );

    },


    getValidationEvents() {

        return api.get(
            `${API}/runtime/validation`
        );

    },


    // ======================================================
    // EXECUTE
    // ======================================================

    execute(payload) {

        return api.post(
            `${API}/execute`,
            payload
        );

    },


    // ======================================================
    // REPORT
    // ======================================================

    getReport(filters = {}) {

        return api.get(
            `${API}/report`,
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
            `${API}/export`,
            payload
        );

    }

};


export default skillService;