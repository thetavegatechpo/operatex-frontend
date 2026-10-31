// src/services/device.service.js

import api from "../../../../shared/api/client.js";

const API = "/device-master";

const deviceService = {

    // ============================================
    // MASTER
    // ============================================

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

    patchMaster(id, payload) {
        return api.patch(`${API}/master/${id}`, payload);
    },

    deleteMaster(id) {
        return api.delete(`${API}/master/${id}`);
    },

    deleteMultiple(ids) {
        return api.delete(`${API}/master`, {
            data: { ids }
        });
    },

    // ============================================
    // CONFIG
    // ============================================

    getConfig() {
        return api.get(`${API}/config`);
    },

    getProtocolConfig() {
        return api.get(`${API}/config/protocol`);
    },

    getGatewayConfig() {
        return api.get(`${API}/config/gateway`);
    },

    createConfig(payload) {
        return api.post(`${API}/config`, payload);
    },

    deleteProtocol(id) {
        return api.delete(`${API}/config/protocol/${id}`);
    },

    deleteGateway(id) {
        return api.delete(`${API}/config/gateway/${id}`);
    },

    // ============================================
    // RUNTIME
    // ============================================

    getRuntime() {
        return api.get(`${API}/runtime`);
    },

    // ============================================
    // EXECUTE
    // ============================================

    execute(payload) {
        return api.post(`${API}/execute`, payload);
    },

    // ============================================
    // REPORT
    // ============================================

    getReport() {
        return api.get(`${API}/report`);
    },

    // ============================================
    // EXPORT
    // ============================================

    exportData(payload) {
        return api.post(`${API}/export`, payload, {
            responseType: "blob"
        });
    }
};

export default deviceService;
