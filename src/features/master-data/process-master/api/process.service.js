// src/services/process.service.js

import api from "../../../../shared/api/client.js";

const API = "/process-master";

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) =>
                value !== undefined &&
                value !== null &&
                value !== "" &&
                value !== "ALL"
        )
    );

const processService = {

    // =====================================================
    // CONFIG
    // =====================================================

    getConfig() {
        return api.get(
            `${API}/config`
        );
    },

    getRevisionConfig() {
        return api.get(
            `${API}/config/revision`
        );
    },

    getOperationConfig() {
        return api.get(
            `${API}/config/operation`
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


    // =====================================================
    // MASTER
    // =====================================================

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


    // =====================================================
    // RUNTIME
    // =====================================================

    getRuntime(filters = {}) {
        return api.get(
            `${API}/runtime`,
            {
                params:
                    cleanParams(filters)
            }
        );
    },


    // =====================================================
    // EXECUTE
    // =====================================================

    execute(payload) {
        return api.post(
            `${API}/execute`,
            payload
        );
    },


    // =====================================================
    // REPORT
    // =====================================================

    getReport(filters = {}) {
        return api.get(
            `${API}/report`,
            {
                params:
                    cleanParams(filters)
            }
        );
    },


    // =====================================================
    // EXPORT
    //
    // Backend returns JSON rows.
    // Frontend converts them to CSV.
    // =====================================================

    exportData(payload = {}) {
        return api.post(
            `${API}/export`,
            payload
        );
    }

};

export default processService;