// src/services/plantshop.service.js

import api from "../../../../shared/api/client.js";

const plantShopService = {

    // =====================================================
    // CONFIG
    // =====================================================

    getConfig() {
        return api.get("/plant-shop-master/config");
    },

    updateConfig(data) {
        return api.post("/plant-shop-master/config", data);
    },

    // =====================================================
    // MASTER
    // =====================================================

    getMaster() {
        return api.get("/plant-shop-master/master");
    },

    getMasterById(id) {
        return api.get(`/plant-shop-master/master/${id}`);
    },

    // =====================================================
    // PLANT
    // =====================================================

    createPlant(data) {
        return api.post(
            "/plant-shop-master/master",
            {
                type: "PLANT",
                ...data
            }
        );
    },

    updatePlant(id, data) {
        return api.put(
            `/plant-shop-master/master/${id}`,
            {
                type: "PLANT",
                ...data
            }
        );
    },

    // =====================================================
    // SHOP
    // =====================================================

    createShop(data) {
        return api.post(
            "/plant-shop-master/master",
            {
                type: "SHOP",
                ...data
            }
        );
    },

    updateShop(id, data) {
        return api.put(
            `/plant-shop-master/master/${id}`,
            {
                type: "SHOP",
                ...data
            }
        );
    },

    // =====================================================
    // RUNTIME
    // =====================================================

    getRuntime() {
        return api.get("/plant-shop-master/runtime");
    },

    execute(action = "SYNC") {
        return api.post(
            "/plant-shop-master/execute",
            {
                action
            }
        );
    },

    // =====================================================
    // REPORT
    // =====================================================

    getReport(status = "ACTIVE") {
        return api.get(
            `/plant-shop-master/report?status=${status}`
        );
    },

    // =====================================================
    // EXPORT
    // =====================================================

    export(format = "CSV") {
        return api.post(
            "/plant-shop-master/export",
            {
                format
            },
            {
                responseType: "blob"
            }
        );
    }

};

export default plantShopService;