// src/services/part.service.js

import api from "../../../../shared/api/client.js";

const API = "/part-master";

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) =>
            value !== undefined &&
            value !== null &&
            value !== "" &&
            value !== "ALL"
        )
    );

const partService = {

    // =====================================================
    // CONFIG
    // =====================================================

    getConfig() {
        return api.get(`${API}/config`);
    },

    getRevisionConfig() {
        return api.get(`${API}/config/revision`);
    },

    getAttributeConfig() {
        return api.get(`${API}/config/attribute`);
    },

    getConfigById(table, id) {
        return api.get(
            `${API}/config/${String(table).toUpperCase()}/${id}`
        );
    },

    createConfig(payload) {
        return api.post(`${API}/config`, payload);
    },

    updateConfig(table, id, payload) {
        return api.put(
            `${API}/config/${String(table).toUpperCase()}/${id}`,
            payload
        );
    },

    deleteConfig(table, id) {
        return api.delete(
            `${API}/config/${String(table).toUpperCase()}/${id}`
        );
    },

    // =====================================================
    // MASTER
    // =====================================================

    getMaster() {
        return api.get(`${API}/master`);
    },

    getMasterById(id) {
        return api.get(`${API}/master/${id}`);
    },

    createMaster(payload) {
        return api.post(`${API}/master`, payload);
    },

    updateMaster(id, payload) {
        return api.put(`${API}/master/${id}`, payload);
    },

    deleteMaster(id) {
        return api.delete(`${API}/master/${id}`);
    },

    // =====================================================
    // RUNTIME / EVENTS
    // =====================================================

    getRuntime(filters = {}) {
        return api.get(`${API}/runtime`, {
            params: cleanParams(filters)
        });
    },

    // =====================================================
    // EXECUTE
    // =====================================================

    execute(payload) {
        return api.post(`${API}/execute`, payload);
    },

    // =====================================================
    // REPORT
    // =====================================================

    getReport(filters = {}) {
        return api.get(`${API}/report`, {
            params: cleanParams(filters)
        });
    },

    // =====================================================
    // EXPORT
    // IMPORTANT:
    // Backend currently returns JSON data rows, not a binary file.
    // PartMaster.jsx converts these rows to CSV / Excel / printable PDF.
    // =====================================================

    exportData(payload = {}) {
        return api.post(`${API}/export`, payload);
    }
};

export default partService;
