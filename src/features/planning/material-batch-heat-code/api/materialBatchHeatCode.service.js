// src/services/materialBatchHeatCode.service.js

import api from "../../../../shared/api/client.js";

/**
 * ============================================================
 * OPERATEX MES
 * PLANNING MODULE
 * MATERIAL / BATCH / HEAT CODE - FRONTEND SERVICE
 * ============================================================
 *
 * BACKEND BASE:
 *
 * /api/material-batch-heat-code
 *
 * ENDPOINTS:
 *
 * GET  /config
 * POST /config
 *
 * GET  /master
 * POST /master
 * PUT  /master/:id
 *
 * GET  /runtime
 * POST /execute
 *
 * GET  /report
 *
 * ------------------------------------------------------------
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * No DELETE endpoint.
 * No Export endpoint.
 *
 * master_type:
 *
 * MATERIAL
 * BATCH
 * HEAT_CODE
 *
 * shift_id:
 *
 * INTEGER / int4
 * ============================================================
 */


const BASE_URL = "/material-batch-heat-code";


// ============================================================
// COMMON HELPERS
// ============================================================

const cleanParams = (params = {}) => {
  const cleaned = {};

  Object.entries(params || {}).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      cleaned[key] = value;
    }
  });

  return cleaned;
};


const unwrapResponse = (response) => {
  return response?.data;
};


// ============================================================
// CONFIG
// ============================================================

/**
 * GET /api/material-batch-heat-code/config
 *
 * Reads:
 *
 * material_master
 * batch_master
 * heat_code_master
 *
 * Optional filters:
 *
 * company_id
 * material_id
 * batch_id
 * material_type
 * material_status
 * batch_status
 * heat_code_status
 * material_grade
 */
export const getMaterialBatchHeatCodeConfig = async (
  params = {}
) => {
  const response = await api.get(
    `${BASE_URL}/config`,
    {
      params: cleanParams(params),
    }
  );

  return unwrapResponse(response);
};


/**
 * POST /api/material-batch-heat-code/config
 *
 * Create/update configuration.
 *
 * Required routing field:
 *
 * master_type:
 * MATERIAL
 * BATCH
 * HEAT_CODE
 *
 * If related primary key is supplied, backend updates.
 * Otherwise backend creates.
 */
export const saveMaterialBatchHeatCodeConfig = async (
  payload
) => {
  const response = await api.post(
    `${BASE_URL}/config`,
    payload
  );

  return unwrapResponse(response);
};


// ============================================================
// MASTER
// ============================================================

/**
 * GET /api/material-batch-heat-code/master
 *
 * Response data:
 *
 * {
 *   material_master: [],
 *   batch_master: [],
 *   heat_code_master: []
 * }
 */
export const getMaterialBatchHeatCodeMaster = async (
  params = {}
) => {
  const response = await api.get(
    `${BASE_URL}/master`,
    {
      params: cleanParams(params),
    }
  );

  return unwrapResponse(response);
};


/**
 * POST /api/material-batch-heat-code/master
 *
 * Example material:
 *
 * {
 *   master_type: "MATERIAL",
 *   company_id,
 *   material_code,
 *   material_name,
 *   material_type,
 *   uom_code,
 *   status,
 *   version_no
 * }
 *
 * Example batch:
 *
 * {
 *   master_type: "BATCH",
 *   company_id,
 *   material_id,
 *   batch_no,
 *   supplier_batch_no,
 *   receipt_date,
 *   manufacture_date,
 *   expiry_date,
 *   received_qty,
 *   status
 * }
 *
 * Example heat code:
 *
 * {
 *   master_type: "HEAT_CODE",
 *   company_id,
 *   batch_id,
 *   heat_code,
 *   material_grade,
 *   certificate_ref,
 *   status
 * }
 */
export const createMaterialBatchHeatCodeMaster = async (
  payload
) => {
  const response = await api.post(
    `${BASE_URL}/master`,
    payload
  );

  return unwrapResponse(response);
};


/**
 * PUT /api/material-batch-heat-code/master/:id
 *
 * master_type must still be supplied so backend knows which
 * master table should be updated.
 */
export const updateMaterialBatchHeatCodeMaster = async (
  id,
  payload
) => {
  const response = await api.put(
    `${BASE_URL}/master/${id}`,
    payload
  );

  return unwrapResponse(response);
};


// ============================================================
// MATERIAL HELPERS
// ============================================================

/**
 * Convenience wrapper for creating a material.
 */
export const createMaterial = async (payload) => {
  return createMaterialBatchHeatCodeMaster({
    ...payload,
    master_type: "MATERIAL",
  });
};


/**
 * Convenience wrapper for updating a material.
 */
export const updateMaterial = async (
  materialId,
  payload
) => {
  return updateMaterialBatchHeatCodeMaster(
    materialId,
    {
      ...payload,
      master_type: "MATERIAL",
    }
  );
};


// ============================================================
// BATCH HELPERS
// ============================================================

/**
 * Convenience wrapper for creating a batch.
 */
export const createBatch = async (payload) => {
  return createMaterialBatchHeatCodeMaster({
    ...payload,
    master_type: "BATCH",
  });
};


/**
 * Convenience wrapper for updating a batch.
 */
export const updateBatch = async (
  batchId,
  payload
) => {
  return updateMaterialBatchHeatCodeMaster(
    batchId,
    {
      ...payload,
      master_type: "BATCH",
    }
  );
};


// ============================================================
// HEAT CODE HELPERS
// ============================================================

/**
 * Convenience wrapper for creating a heat code.
 */
export const createHeatCode = async (payload) => {
  return createMaterialBatchHeatCodeMaster({
    ...payload,
    master_type: "HEAT_CODE",
  });
};


/**
 * Convenience wrapper for updating a heat code.
 */
export const updateHeatCode = async (
  heatCodeId,
  payload
) => {
  return updateMaterialBatchHeatCodeMaster(
    heatCodeId,
    {
      ...payload,
      master_type: "HEAT_CODE",
    }
  );
};


// ============================================================
// RUNTIME
// ============================================================

/**
 * GET /api/material-batch-heat-code/runtime
 *
 * Reads:
 *
 * material_master
 * batch_master
 * heat_code_master
 * material_consumption_event
 *
 * Supported runtime filters include:
 *
 * company_id
 * plant_id
 * line_id
 * machine_id
 * shift_id
 * plan_id
 * plan_entry_id
 * part_id
 * material_id
 * batch_id
 * heat_code_id
 * event_type
 * result_status
 * source_system
 * from_timestamp
 * to_timestamp
 *
 * plus:
 *
 * material_status
 * batch_status
 * heat_code_status
 * material_type
 * material_grade
 */
export const getMaterialBatchHeatCodeRuntime = async (
  params = {}
) => {
  const response = await api.get(
    `${BASE_URL}/runtime`,
    {
      params: cleanParams(params),
    }
  );

  return unwrapResponse(response);
};


// ============================================================
// EXECUTE
// ============================================================

/**
 * POST /api/material-batch-heat-code/execute
 *
 * Creates:
 *
 * material_consumption_event
 *
 * Required:
 *
 * company_id
 * plant_id
 * line_id
 * machine_id
 * shift_id            INTEGER
 * plan_id
 * plan_entry_id
 * part_id
 * material_id
 * quantity
 * uom_code
 *
 * Optional:
 *
 * batch_id
 * heat_code_id
 * event_type
 * barcode_value
 * result_status
 * source_system
 * idempotency_key
 */
export const executeMaterialActivity = async (
  payload
) => {
  const normalizedPayload = {
    ...payload,

    shift_id:
      payload?.shift_id !== undefined &&
      payload?.shift_id !== null &&
      payload?.shift_id !== ""
        ? Number(payload.shift_id)
        : payload?.shift_id,

    quantity:
      payload?.quantity !== undefined &&
      payload?.quantity !== null &&
      payload?.quantity !== ""
        ? Number(payload.quantity)
        : payload?.quantity,
  };

  const response = await api.post(
    `${BASE_URL}/execute`,
    normalizedPayload
  );

  return unwrapResponse(response);
};


// ============================================================
// REPORT
// ============================================================

/**
 * GET /api/material-batch-heat-code/report
 *
 * Reads material_consumption_event.
 *
 * Response format:
 *
 * {
 *   success,
 *   message,
 *   data: [],
 *   errors: [],
 *   meta: {
 *      count
 *   }
 * }
 */
export const getMaterialBatchHeatCodeReport = async (
  params = {}
) => {
  const response = await api.get(
    `${BASE_URL}/report`,
    {
      params: cleanParams(params),
    }
  );

  return unwrapResponse(response);
};


// ============================================================
// RESPONSE HELPERS FOR FRONTEND PAGE
// ============================================================

/**
 * Extract standard API data.
 *
 * Handles:
 *
 * response.data
 * or direct data returned by methods above.
 */
export const responseData = (response) => {
  if (!response) {
    return null;
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
};


/**
 * Extract master arrays safely.
 */
export const getMasterCollections = (response) => {
  const data = responseData(response) || {};

  return {
    materials: Array.isArray(data?.material_master)
      ? data.material_master
      : [],

    batches: Array.isArray(data?.batch_master)
      ? data.batch_master
      : [],

    heatCodes: Array.isArray(data?.heat_code_master)
      ? data.heat_code_master
      : [],
  };
};


/**
 * Extract runtime collections safely.
 */
export const getRuntimeCollections = (response) => {
  const data = responseData(response) || {};

  return {
    materials: Array.isArray(data?.material_master)
      ? data.material_master
      : [],

    batches: Array.isArray(data?.batch_master)
      ? data.batch_master
      : [],

    heatCodes: Array.isArray(data?.heat_code_master)
      ? data.heat_code_master
      : [],

    events: Array.isArray(
      data?.material_consumption_events
    )
      ? data.material_consumption_events
      : [],
  };
};


// ============================================================
// ERROR HELPER
// ============================================================

export const getMaterialBatchHeatCodeErrorMessage = (
  error,
  fallback = "Material / Batch / Heat Code operation failed."
) => {
  const response =
    error?.response?.data;

  if (
    Array.isArray(response?.errors) &&
    response.errors.length > 0
  ) {
    return `${
      response.message ||
      "Validation failed."
    } ${response.errors.join(", ")}`;
  }

  return (
    response?.message ||
    error?.message ||
    fallback
  );
};


// ============================================================
// DEFAULT EXPORT
// ============================================================

const materialBatchHeatCodeService = {
  // Config
  getConfig:
    getMaterialBatchHeatCodeConfig,

  saveConfig:
    saveMaterialBatchHeatCodeConfig,

  // Master
  getMaster:
    getMaterialBatchHeatCodeMaster,

  createMaster:
    createMaterialBatchHeatCodeMaster,

  updateMaster:
    updateMaterialBatchHeatCodeMaster,

  // Material
  createMaterial,
  updateMaterial,

  // Batch
  createBatch,
  updateBatch,

  // Heat Code
  createHeatCode,
  updateHeatCode,

  // Runtime
  getRuntime:
    getMaterialBatchHeatCodeRuntime,

  // Execute
  execute:
    executeMaterialActivity,

  // Report
  getReport:
    getMaterialBatchHeatCodeReport,
};

export default materialBatchHeatCodeService;