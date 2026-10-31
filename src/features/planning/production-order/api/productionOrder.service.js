// src/services/productionOrder.service.js

import api from "../../../../shared/api/client.js";

const API = "/production-order";

const cleanParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) =>
            value !== undefined &&
            value !== null &&
            value !== "" &&
            value !== "ALL"
        )
    );

const productionOrderService = {

    // =====================================================
    // PRODUCTION ORDER
    // =====================================================

    getOrders(params = {}) {
        return api.get(API, {
            params: cleanParams(params)
        });
    },

    getOrderById(orderId) {
        return api.get(
            `${API}/${orderId}`
        );
    },

    getOrderDetails(orderId) {
        return api.get(
            `${API}/${orderId}/details`
        );
    },

    createOrder(payload) {
        return api.post(
            API,
            payload
        );
    },

    updateOrder(orderId, payload) {
        return api.put(
            `${API}/${orderId}`,
            payload
        );
    },

    deleteOrder(orderId) {
        return api.delete(
            `${API}/${orderId}`
        );
    },


    // =====================================================
    // ORDER STATUS
    // =====================================================

    changeOrderStatus(
        orderId,
        payload
    ) {
        return api.put(
            `${API}/${orderId}/status`,
            payload
        );
    },

    getOrderStatusHistory(
        orderId
    ) {
        return api.get(
            `${API}/${orderId}/status-history`
        );
    },


    // =====================================================
    // ORDER ITEMS
    // =====================================================

    getItems(orderId) {
        return api.get(
            `${API}/${orderId}/items`
        );
    },

    getItemById(orderItemId) {
        return api.get(
            `${API}/item/${orderItemId}`
        );
    },

    createItem(
        orderId,
        payload
    ) {
        return api.post(
            `${API}/${orderId}/items`,
            payload
        );
    },

    updateItem(
        orderItemId,
        payload
    ) {
        return api.put(
            `${API}/item/${orderItemId}`,
            payload
        );
    },

    deleteItem(orderItemId) {
        return api.delete(
            `${API}/item/${orderItemId}`
        );
    },

    changeItemStatus(
        orderItemId,
        payload
    ) {
        return api.put(
            `${API}/item/${orderItemId}/status`,
            payload
        );
    },

    getItemStatusHistory(
        orderItemId
    ) {
        return api.get(
            `${API}/item/${orderItemId}/status-history`
        );
    },


    // =====================================================
    // CUSTOMER MASTER
    // =====================================================

    getCustomers(params = {}) {
        return api.get(
            `${API}/customer`,
            {
                params: cleanParams(params)
            }
        );
    },

    getCustomerById(customerId) {
        return api.get(
            `${API}/customer/${customerId}`
        );
    },

    createCustomer(payload) {
        return api.post(
            `${API}/customer`,
            payload
        );
    },

    updateCustomer(
        customerId,
        payload
    ) {
        return api.put(
            `${API}/customer/${customerId}`,
            payload
        );
    },

    deleteCustomer(customerId) {
        return api.delete(
            `${API}/customer/${customerId}`
        );
    },


    // =====================================================
    // EXPORT
    // =====================================================

    exportData(params = {}) {
        return api.get(
            `${API}/export`,
            {
                params: cleanParams(params)
            }
        );
    }
};

export default productionOrderService;