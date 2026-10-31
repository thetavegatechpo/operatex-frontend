// src/services/cncAdapter.service.jsx

/**
 * ============================================================
 * OPERATEX MES
 * CONNECTIVITY
 * CNC ADAPTER - FRONTEND SERVICE
 * ============================================================
 *
 * BACKEND BASE ROUTE
 * ------------------------------------------------------------
 *
 * /api/cnc-adapter
 *
 * src/services/api already handles the /api prefix.
 *
 * Therefore this service uses:
 *
 * /cnc-adapter
 *
 * ------------------------------------------------------------
 * BACKEND APIs
 * ------------------------------------------------------------
 *
 * CONFIG
 *
 * GET    /config
 * POST   /config
 *
 *
 * MASTER / TAG MAP
 *
 * GET    /master
 * POST   /master
 * PUT    /master/:id
 *
 *
 * RUNTIME
 *
 * GET    /runtime
 * POST   /execute
 *
 *
 * REPORT
 *
 * GET    /report
 *
 *
 * EXPORT
 *
 * POST   /export
 *
 * ============================================================
 */

import api from "../../../../shared/api/client.js";



// ============================================================
// BASE URL
// ============================================================

const BASE_URL =
    "/cnc-adapter";



// ============================================================
// COMMON HELPERS
// ============================================================

const hasValue = (
    value
) => {

    return !(
        value === undefined ||
        value === null ||
        value === ""
    );
};



// ============================================================
// CLEAN QUERY PARAMS
//
// Removes:
//
// undefined
// null
// ""
//
// Preserves:
//
// false
// 0
// ============================================================

export const cleanCncAdapterParams = (
    params = {}
) => {

    return Object.fromEntries(

        Object
            .entries(
                params
            )
            .filter(
                (
                    [
                        ,
                        value
                    ]
                ) =>
                    hasValue(
                        value
                    )
            )
    );
};



// ============================================================
// RESPONSE HELPERS
// ============================================================

export const getCncAdapterResponse = (
    response
) => {

    return (
        response?.data ??
        null
    );
};



export const getCncAdapterPayload = (
    response
) => {

    return (
        response?.data?.data ??
        null
    );
};



export const getCncAdapterMeta = (
    response
) => {

    return (
        response?.data?.meta ??
        {}
    );
};



// ============================================================
// RESPONSE ARRAY HELPER
// ============================================================

export const getCncAdapterRows = (
    response
) => {

    const data =
        response
            ?.data
            ?.data;


    if (
        Array.isArray(
            data
        )
    ) {

        return data;
    }


    return [];
};



// ============================================================
// ERROR MESSAGE HELPER
// ============================================================

export const getCncAdapterErrorMessage = (
    error,
    fallback =
        "Something went wrong."
) => {

    const response =
        error
            ?.response
            ?.data;


    if (
        Array.isArray(
            response?.errors
        ) &&
        response.errors.length > 0
    ) {

        const firstError =
            response.errors[0];


        if (
            typeof firstError ===
            "string"
        ) {

            return firstError;
        }


        if (
            firstError?.message
        ) {

            return firstError.message;
        }
    }


    return (
        response?.message ||
        error?.message ||
        fallback
    );
};



// ============================================================
// ============================================================
// CONFIGURATION
// ============================================================
// ============================================================



// ============================================================
// GET CONFIGURATION
//
// GET /api/cnc-adapter/config
// ============================================================

export const getCncConfig = (
    params = {}
) => {

    return api.get(
        `${BASE_URL}/config`,
        {
            params:
                cleanCncAdapterParams(
                    params
                )
        }
    );
};



// ============================================================
// SAVE CONFIGURATION
//
// CREATE:
//
// cnc_protocol_id absent
//
// UPDATE / CREATE NEW VERSION:
//
// cnc_protocol_id supplied
//
// POST /api/cnc-adapter/config
// ============================================================

export const saveCncConfig = (
    payload
) => {

    return api.post(
        `${BASE_URL}/config`,
        payload
    );
};



// ============================================================
// ============================================================
// TAG MAPPING / MASTER
// ============================================================
// ============================================================



// ============================================================
// GET TAG MAPPINGS
//
// GET /api/cnc-adapter/master
//
// Response can include:
//
// runtime_storage_mode
//
// Supported values:
//
// EVENT_ONLY
// MONITORING_ONLY
// BOTH
// ============================================================

export const getCncTagMaps = (
    params = {}
) => {

    return api.get(
        `${BASE_URL}/master`,
        {
            params:
                cleanCncAdapterParams(
                    params
                )
        }
    );
};



// ============================================================
// CREATE TAG MAPPING
//
// POST /api/cnc-adapter/master
//
// payload may contain:
//
// runtime_storage_mode:
//
// EVENT_ONLY
// MONITORING_ONLY
// BOTH
//
// The complete payload is intentionally forwarded unchanged.
// Backend validation/service decides the final behavior.
// ============================================================

export const createCncTagMap = (
    payload
) => {

    return api.post(
        `${BASE_URL}/master`,
        payload
    );
};



// ============================================================
// UPDATE TAG MAPPING
//
// PUT /api/cnc-adapter/master/:id
//
// Backend manages tag-map version creation.
//
// runtime_storage_mode is forwarded unchanged.
//
// EVENT_ONLY
// MONITORING_ONLY
// BOTH
// ============================================================

export const updateCncTagMap = (
    cncTagId,
    payload
) => {

    return api.put(
        `${BASE_URL}/master/${cncTagId}`,
        payload
    );
};



// ============================================================
// ============================================================
// RUNTIME
// ============================================================
// ============================================================



// ============================================================
// GET RUNTIME EVENTS
//
// GET /api/cnc-adapter/runtime
//
// Supported backend filters include:
//
// company_id
// plant_id
// line_id
// machine_id
// device_id
// cnc_protocol_id
// tag_id
// event_code
// quality_code
// shift_id
// plan_id
// plan_entry_id
// cycle_id
// from_timestamp
// to_timestamp
// limit
// offset
//
// IMPORTANT:
//
// runtime_storage_mode is configuration stored against
// cnc_tag_map.
//
// It is NOT supplied by the runtime GET request.
// ============================================================

export const getCncRuntime = (
    params = {}
) => {

    return api.get(
        `${BASE_URL}/runtime`,
        {
            params:
                cleanCncAdapterParams(
                    params
                )
        }
    );
};



// ============================================================
// EXECUTE CNC EVENT
//
// POST /api/cnc-adapter/execute
//
// IMPORTANT:
//
// runtime_storage_mode must NOT be controlled by the gateway
// execute payload.
//
// Backend resolves the CNC tag mapping and will ultimately use:
//
// EVENT_ONLY
//      -> cnc_machine_event
//
// MONITORING_ONLY
//      -> monitoring_event
//
// BOTH
//      -> cnc_machine_event + monitoring_event
//
// Runtime routing remains a backend configuration decision.
// ============================================================

export const executeCncEvent = (
    payload
) => {

    return api.post(
        `${BASE_URL}/execute`,
        payload
    );
};



// ============================================================
// ============================================================
// REPORT
// ============================================================
// ============================================================



// ============================================================
// GET REPORT
//
// GET /api/cnc-adapter/report
// ============================================================

export const getCncReport = (
    params = {}
) => {

    return api.get(
        `${BASE_URL}/report`,
        {
            params:
                cleanCncAdapterParams(
                    params
                )
        }
    );
};



// ============================================================
// ============================================================
// EXPORT
// ============================================================
// ============================================================



// ============================================================
// EXPORT CNC DATA
//
// POST /api/cnc-adapter/export
//
// Supported:
//
// CSV
// JSON
// ============================================================

export const exportCncData = (
    payload = {}
) => {

    const format =
        String(
            payload.format ||
            "CSV"
        )
            .trim()
            .toUpperCase();


    // ========================================================
    // CSV EXPORT
    // ========================================================

    if (
        format === "CSV"
    ) {

        return api.post(
            `${BASE_URL}/export`,
            {
                ...payload,

                format:
                    "CSV"
            },
            {
                responseType:
                    "blob"
            }
        );
    }


    // ========================================================
    // JSON EXPORT
    // ========================================================

    return api.post(
        `${BASE_URL}/export`,
        {
            ...payload,

            format:
                "JSON"
        }
    );
};



// ============================================================
// DOWNLOAD CSV
// ============================================================

export const downloadCncCsv = (
    response,
    fallbackFileName =
        "cnc-adapter-export.csv"
) => {

    const data =
        response?.data;


    const blob =
        data instanceof Blob

            ? data

            : new Blob(
                [
                    data ??
                    ""
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


    // ========================================================
    // READ FILE NAME FROM BACKEND HEADER
    // ========================================================

    const contentDisposition =
        response
            ?.headers
            ?.["content-disposition"];


    let fileName =
        fallbackFileName;


    if (
        contentDisposition
    ) {

        const fileNameMatch =
            contentDisposition.match(
                /filename="?([^"]+)"?/i
            );


        if (
            fileNameMatch?.[1]
        ) {

            fileName =
                fileNameMatch[1];
        }
    }


    // ========================================================
    // CREATE TEMPORARY DOWNLOAD URL
    // ========================================================

    const url =
        window.URL
            .createObjectURL(
                blob
            );


    const link =
        document
            .createElement(
                "a"
            );


    link.href =
        url;

    link.download =
        fileName;


    document.body
        .appendChild(
            link
        );


    link.click();


    document.body
        .removeChild(
            link
        );


    window.URL
        .revokeObjectURL(
            url
        );
};



// ============================================================
// ============================================================
// DEFAULT SERVICE EXPORT
// ============================================================
// ============================================================

const cncAdapterService = {


    // ========================================================
    // CONFIG
    // ========================================================

    getConfig:
        getCncConfig,

    saveConfig:
        saveCncConfig,


    // ========================================================
    // TAG MAP / MASTER
    // ========================================================

    getMaster:
        getCncTagMaps,

    createMaster:
        createCncTagMap,

    updateMaster:
        updateCncTagMap,


    // ========================================================
    // RUNTIME
    // ========================================================

    getRuntime:
        getCncRuntime,


    // ========================================================
    // EXECUTION
    // ========================================================

    execute:
        executeCncEvent,


    // ========================================================
    // REPORT
    // ========================================================

    getReport:
        getCncReport,


    // ========================================================
    // EXPORT
    // ========================================================

    exportData:
        exportCncData,

    downloadCsv:
        downloadCncCsv

};


export default cncAdapterService;