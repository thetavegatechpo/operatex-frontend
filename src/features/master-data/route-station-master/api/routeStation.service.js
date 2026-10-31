// src/services/routeStation.service.js

import api from "../../../../shared/api/client.js";

const BASE_URL = "/route-station-master";


// ==========================================================
// RESPONSE HELPER
// ==========================================================

const dataOnly = (response) =>
    response?.data?.data ?? response?.data ?? [];


// ==========================================================
// QUERY PARAMS
// ==========================================================

const cleanParams = (params = {}) => {

    const result = {};

    Object.entries(params).forEach(
        ([key, value]) => {

            if (
                value !== undefined &&
                value !== null &&
                value !== "" &&
                value !== "ALL"
            ) {
                result[key] = value;
            }

        }
    );

    return result;
};


// ==========================================================
// ROUTE
// ==========================================================

const getRoutes = async () =>
    dataOnly(
        await api.get(
            `${BASE_URL}/route-master`
        )
    );


const getRouteById = async (id) =>
    dataOnly(
        await api.get(
            `${BASE_URL}/route-master/${id}`
        )
    );


const createRoute = async (payload) =>
    dataOnly(
        await api.post(
            `${BASE_URL}/route-master`,
            payload
        )
    );


const updateRoute = async (
    id,
    payload
) =>
    dataOnly(
        await api.put(
            `${BASE_URL}/route-master/${id}`,
            payload
        )
    );


const deleteRoute = async (id) =>
    dataOnly(
        await api.delete(
            `${BASE_URL}/route-master/${id}`
        )
    );


// ==========================================================
// STATION
// ==========================================================

const getStations = async () =>
    dataOnly(
        await api.get(
            `${BASE_URL}/station-master`
        )
    );


const getStationById = async (id) =>
    dataOnly(
        await api.get(
            `${BASE_URL}/station-master/${id}`
        )
    );


const createStation = async (payload) =>
    dataOnly(
        await api.post(
            `${BASE_URL}/station-master`,
            payload
        )
    );


const updateStation = async (
    id,
    payload
) =>
    dataOnly(
        await api.put(
            `${BASE_URL}/station-master/${id}`,
            payload
        )
    );


const deleteStation = async (id) =>
    dataOnly(
        await api.delete(
            `${BASE_URL}/station-master/${id}`
        )
    );


// ==========================================================
// CONFIG
// ==========================================================

const getConfig = async () =>
    dataOnly(
        await api.get(
            `${BASE_URL}/config`
        )
    );


const getSteps = async () =>
    dataOnly(
        await api.get(
            `${BASE_URL}/config/step`
        )
    );


const getValidations = async () =>
    dataOnly(
        await api.get(
            `${BASE_URL}/config/validation`
        )
    );


const getConfigById = async (
    table,
    id
) =>
    dataOnly(
        await api.get(
            `${BASE_URL}/config/${table}/${id}`
        )
    );


const createConfig = async (payload) =>
    dataOnly(
        await api.post(
            `${BASE_URL}/config`,
            payload
        )
    );


const updateConfig = async (
    table,
    id,
    payload
) =>
    dataOnly(
        await api.put(
            `${BASE_URL}/config/${table}/${id}`,
            payload
        )
    );


const deleteConfig = async (
    table,
    id
) =>
    dataOnly(
        await api.delete(
            `${BASE_URL}/config/${table}/${id}`
        )
    );


// ==========================================================
// RUNTIME
// ==========================================================

const getRuntime = async (
    filters = {}
) =>
    dataOnly(
        await api.get(
            `${BASE_URL}/runtime`,
            {
                params:
                    cleanParams(filters)
            }
        )
    );


const execute = async (payload) =>
    dataOnly(
        await api.post(
            `${BASE_URL}/execute`,
            payload
        )
    );


// ==========================================================
// REPORT
// ==========================================================

const getReport = async (
    filters = {}
) =>
    dataOnly(
        await api.get(
            `${BASE_URL}/report`,
            {
                params:
                    cleanParams(filters)
            }
        )
    );


const exportData = async (payload) =>
    dataOnly(
        await api.post(
            `${BASE_URL}/export`,
            payload
        )
    );


// ==========================================================
// LOOKUP ENDPOINTS
//
// These are only for dropdowns.
//
// If your existing master route mount names are slightly
// different, change ONLY this block.
// ==========================================================


const LOOKUP = {

    company:
        "/company-master/master",

    plantShop:
        "/plant-shop-master/master",

    line:
        "/line-master/master",

    partRevision:
        "/part-master/config/revision",

    processRevision:
        "/process-master/config/revision",

    machine:
        "/machine-master/master",

    operation:
        "/process-master/config/operation"

};

// ==========================================================
// GENERIC LOOKUP
// ==========================================================

const getLookup = async (url) =>
    dataOnly(
        await api.get(url)
    );


const getCompanies = () =>
    getLookup(
        LOOKUP.company
    );



const getPlants = async () => {

    const data =
        await getLookup(
            LOOKUP.plantShop
        );

    return Array.isArray(data)
        ? data.filter(
            item =>
                item.plant_id
        )
        : [];
};


const getShops = async () => {

    const data =
        await getLookup(
            LOOKUP.plantShop
        );

    return Array.isArray(data)
        ? data.filter(
            item =>
                item.shop_id
        )
        : [];
};



const getLines = () =>
    getLookup(
        LOOKUP.line
    );


const getPartRevisions = () =>
    getLookup(
        LOOKUP.partRevision
    );


const getProcessRevisions = () =>
    getLookup(
        LOOKUP.processRevision
    );


const getMachines = () =>
    getLookup(
        LOOKUP.machine
    );


const getOperations = () =>
    getLookup(
        LOOKUP.operation
    );


// ==========================================================
// EXPORT
// ==========================================================

const routeStationService = {

    // Route

    getRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    deleteRoute,

    // Station

    getStations,
    getStationById,
    createStation,
    updateStation,
    deleteStation,

    // Config

    getConfig,
    getSteps,
    getValidations,
    getConfigById,
    createConfig,
    updateConfig,
    deleteConfig,

    // Runtime

    getRuntime,
    execute,

    // Report

    getReport,
    exportData,

    // Lookups

    getCompanies,
    getPlants,
    getShops,
    getLines,
    getPartRevisions,
    getProcessRevisions,
    getMachines,
    getOperations

};


export default routeStationService;