// src/services/downtime.service.js
// OperateX MES - Downtime Detection frontend API service

import api from "../../../../shared/api/client.js";

const BASE_URL = "/downtime-detection";

export const DOWNTIME_EVENT_STATUS = Object.freeze({
    OPEN: "OPEN",
    CLOSED: "CLOSED"
});

export const DOWNTIME_CLASS = Object.freeze({
    MINOR_STOP: "MINOR_STOP",
    DOWNTIME: "DOWNTIME"
});

export const LOSS_REASON_STATUS = Object.freeze({
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
});

export const EXPORT_FORMATS = Object.freeze({
    CSV: "CSV",
    EXCEL: "EXCEL",
    PDF: "PDF"
});

const hasValue = value =>
    value !== undefined && value !== null && value !== "";

export const cleanDowntimeParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => hasValue(value))
    );

export const getDowntimeResponseData = response => response?.data ?? null;
export const getDowntimePayload = response => response?.data?.data ?? null;
export const getDowntimeMeta = response => response?.data?.meta ?? {};

const rowsFrom = (response, keys = []) => {
    const body = response?.data ?? response;
    const payload = body?.data ?? body;

    if (Array.isArray(payload)) return payload;

    for (const key of keys) {
        if (Array.isArray(payload?.[key])) return payload[key];
    }

    return [];
};

export const getLossReasonRows = response =>
    rowsFrom(response, ["loss_reason_master", "loss_reasons", "master"]);

export const getDowntimeConfigRows = response =>
    rowsFrom(response, ["downtime_rule_config", "downtime_configs", "config"]);

export const getDowntimeEventRows = response =>
    rowsFrom(response, ["downtime_event", "downtime_events", "runtime", "report"]);

// ---------------------------------------------------------------------------
// Loss reason master
// ---------------------------------------------------------------------------

export const getLossReasons = async () => {
    const response = await api.get(`${BASE_URL}/master`);
    return getDowntimePayload(response);
};

export const getLossReasonById = async lossReasonId => {
    const response = await api.get(`${BASE_URL}/master/${lossReasonId}`);
    return getDowntimePayload(response);
};

export const createLossReason = async payload => {
    const response = await api.post(`${BASE_URL}/master`, payload);
    return getDowntimeResponseData(response);
};

export const updateLossReason = async (lossReasonId, payload) => {
    const response = await api.put(
        `${BASE_URL}/master/${lossReasonId}`,
        payload
    );
    return getDowntimeResponseData(response);
};

export const softDeleteLossReason = async lossReasonId => {
    const response = await api.delete(`${BASE_URL}/master/${lossReasonId}`);
    return getDowntimeResponseData(response);
};

// ---------------------------------------------------------------------------
// Downtime rule configuration
// ---------------------------------------------------------------------------

export const getDowntimeConfig = async (filters = {}) => {
    const response = await api.get(`${BASE_URL}/config`, {
        params: cleanDowntimeParams(filters)
    });
    return getDowntimePayload(response);
};

export const getDowntimeConfigById = async configId => {
    const response = await api.get(`${BASE_URL}/config/${configId}`);
    return getDowntimePayload(response);
};

export const createDowntimeConfig = async payload => {
    const response = await api.post(`${BASE_URL}/config`, payload);
    return getDowntimeResponseData(response);
};

export const updateDowntimeConfig = async (configId, payload) => {
    const response = await api.put(`${BASE_URL}/config/${configId}`, payload);
    return getDowntimeResponseData(response);
};

export const softDeleteDowntimeConfig = async configId => {
    const response = await api.delete(`${BASE_URL}/config/${configId}`);
    return getDowntimeResponseData(response);
};

// ---------------------------------------------------------------------------
// Runtime detection
// ---------------------------------------------------------------------------

export const getDowntimeRuntime = async (filters = {}) => {
    const response = await api.get(`${BASE_URL}/runtime`, {
        params: cleanDowntimeParams(filters)
    });

    return {
        data: getDowntimePayload(response),
        meta: getDowntimeMeta(response)
    };
};

export const executeDowntimeDetection = async payload => {
    const response = await api.post(`${BASE_URL}/execute`, payload);
    return getDowntimeResponseData(response);
};

export const assignDowntimeLossReason = async (
    downtimeEventId,
    lossReasonId
) => {
    const response = await api.put(
        `${BASE_URL}/runtime/${downtimeEventId}/loss-reason`,
        {
            loss_reason_id: lossReasonId
        }
    );
    return getDowntimeResponseData(response);
};

// ---------------------------------------------------------------------------
// Report and export
// ---------------------------------------------------------------------------

export const getDowntimeReport = async (filters = {}) => {
    const response = await api.get(`${BASE_URL}/report`, {
        params: cleanDowntimeParams(filters)
    });

    return {
        data: getDowntimePayload(response),
        meta: getDowntimeMeta(response)
    };
};

export const exportDowntimeReport = async (filters = {}, format = "CSV") => {
    const response = await api.post(`${BASE_URL}/export`, {
        ...cleanDowntimeParams(filters),
        format: String(format).toUpperCase()
    });
    return getDowntimePayload(response);
};

export const normalizeDowntimeFilters = (filters = {}) => ({
    company_id: filters.company_id ?? "",
    plant_id: filters.plant_id ?? "",
    line_id: filters.line_id ?? "",
    machine_id: filters.machine_id ?? "",
    shift_id: filters.shift_id ?? "",
    loss_reason_id: filters.loss_reason_id ?? "",
    category: filters.category ?? "",
    event_status: filters.event_status ?? "",
    downtime_class: filters.downtime_class ?? "",
    affects_availability: filters.affects_availability ?? "",
    from_date: filters.from_date ?? "",
    to_date: filters.to_date ?? "",
    limit: filters.limit ?? 100,
    offset: filters.offset ?? 0
});

const downtimeService = {
    getLossReasons,
    getLossReasonById,
    createLossReason,
    updateLossReason,
    softDeleteLossReason,
    getDowntimeConfig,
    getDowntimeConfigById,
    createDowntimeConfig,
    updateDowntimeConfig,
    softDeleteDowntimeConfig,
    getDowntimeRuntime,
    executeDowntimeDetection,
    assignDowntimeLossReason,
    getDowntimeReport,
    exportDowntimeReport,
    getLossReasonRows,
    getDowntimeConfigRows,
    getDowntimeEventRows,
    cleanParams: cleanDowntimeParams
};

export default downtimeService;
