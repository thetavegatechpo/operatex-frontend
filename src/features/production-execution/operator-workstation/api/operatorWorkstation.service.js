// src/services/operatorWorkstation.service.js

/**
 * ============================================================
 * OPERATEX MES
 * PRODUCTION EXECUTION
 * OPERATOR WORKSTATION - FRONTEND SERVICE
 * ============================================================
 *
 * Backend base route:
 *
 * /api/operator-workstation
 *
 * Because src/services/api.js already handles /api,
 * this service uses:
 *
 * /operator-workstation
 *
 * ------------------------------------------------------------
 * APIs
 * ------------------------------------------------------------
 *
 * CONFIG
 * GET    /config
 * POST   /config
 *
 * MASTER
 * GET    /master
 * POST   /master
 * PUT    /master/:id
 * DELETE /master/:id       -> SOFT DELETE
 *
 * RUNTIME
 * GET    /runtime
 * GET    /runtime/screens
 * GET    /runtime/action/:id
 * POST   /execute
 *
 * REPORT
 * GET    /report
 *
 * ------------------------------------------------------------
 * MASTER TYPES
 * ------------------------------------------------------------
 *
 * UI_TEMPLATE
 * WORKSTATION
 * ROLE_SCREEN
 *
 * ------------------------------------------------------------
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * DELETE is always SOFT DELETE.
 *
 * operator_action_event is append-only:
 *
 * CREATE ✅
 * READ   ✅
 * UPDATE ❌
 * DELETE ❌
 *
 * ============================================================
 */


import api from "../../../../shared/api/client.js";


// ============================================================
// BASE URL
// ============================================================

const BASE_URL =
  "/operator-workstation";


// ============================================================
// MASTER TYPE CONSTANTS
// ============================================================

export const OPERATOR_WORKSTATION_MASTER_TYPES = {
  UI_TEMPLATE: "UI_TEMPLATE",
  WORKSTATION: "WORKSTATION",
  ROLE_SCREEN: "ROLE_SCREEN",
};


// ============================================================
// RESPONSE HELPERS
// ============================================================

const responseData = (response) => {
  return response?.data ?? null;
};


const responsePayload = (response) => {
  return response?.data?.data ?? null;
};


const responseMeta = (response) => {
  return response?.data?.meta ?? {};
};


// ============================================================
// PARAM HELPERS
// ============================================================

const cleanParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );
};


// ============================================================
// 1. CONFIG
// ============================================================

/**
 * GET /operator-workstation/config
 *
 * Optional filters:
 *
 * company_id
 * plant_id
 * line_id
 * machine_id
 * station_id
 * role_id
 * ui_template_config_id
 * workstation_config_id
 * template_type
 * template_code
 * workstation_code
 * execution_mode
 * status
 * screen_scope
 * is_active
 * template_is_active
 * workstation_is_active
 * role_screen_is_active
 */
export const getOperatorWorkstationConfig = async (
  filters = {}
) => {
  const response = await api.get(
    `${BASE_URL}/config`,
    {
      params: cleanParams(filters),
    }
  );

  return responsePayload(response);
};


/**
 * POST /operator-workstation/config
 *
 * Generic create/update.
 *
 * CREATE:
 *
 * {
 *   master_type: "UI_TEMPLATE" | "WORKSTATION" | "ROLE_SCREEN",
 *   ...
 * }
 *
 * UPDATE:
 *
 * Include corresponding PK:
 *
 * ui_template_config_id
 * workstation_config_id
 * role_screen_config_id
 */
export const saveOperatorWorkstationConfig = async (
  payload
) => {
  const response = await api.post(
    `${BASE_URL}/config`,
    payload
  );

  return responsePayload(response);
};


// ============================================================
// 2. MASTER
// ============================================================

/**
 * GET /operator-workstation/master
 */
export const getOperatorWorkstationMaster = async (
  filters = {}
) => {
  const response = await api.get(
    `${BASE_URL}/master`,
    {
      params: cleanParams(filters),
    }
  );

  return responsePayload(response);
};


/**
 * POST /operator-workstation/master
 */
export const createOperatorWorkstationMaster = async (
  payload
) => {
  const response = await api.post(
    `${BASE_URL}/master`,
    payload
  );

  return responsePayload(response);
};


/**
 * PUT /operator-workstation/master/:id
 */
export const updateOperatorWorkstationMaster = async (
  id,
  payload
) => {
  const response = await api.put(
    `${BASE_URL}/master/${id}`,
    payload
  );

  return responsePayload(response);
};


/**
 * DELETE /operator-workstation/master/:id
 *
 * SOFT DELETE ONLY.
 *
 * Backend performs:
 *
 * is_active = FALSE
 *
 * masterType:
 *
 * UI_TEMPLATE
 * WORKSTATION
 * ROLE_SCREEN
 */
export const softDeleteOperatorWorkstationMaster = async (
  id,
  masterType
) => {
  const response = await api.delete(
    `${BASE_URL}/master/${id}`,
    {
      params: {
        master_type: masterType,
      },
    }
  );

  return responsePayload(response);
};


// ============================================================
// 3. UI TEMPLATE CONVENIENCE METHODS
// ============================================================

export const createUiTemplate = async (data) => {
  return createOperatorWorkstationMaster({
    ...data,

    master_type:
      OPERATOR_WORKSTATION_MASTER_TYPES.UI_TEMPLATE,
  });
};


export const updateUiTemplate = async (
  uiTemplateConfigId,
  data
) => {
  return updateOperatorWorkstationMaster(
    uiTemplateConfigId,
    {
      ...data,

      master_type:
        OPERATOR_WORKSTATION_MASTER_TYPES.UI_TEMPLATE,
    }
  );
};


export const softDeleteUiTemplate = async (
  uiTemplateConfigId
) => {
  return softDeleteOperatorWorkstationMaster(
    uiTemplateConfigId,
    OPERATOR_WORKSTATION_MASTER_TYPES.UI_TEMPLATE
  );
};


// ============================================================
// 4. WORKSTATION CONVENIENCE METHODS
// ============================================================

export const createWorkstation = async (data) => {
  return createOperatorWorkstationMaster({
    ...data,

    master_type:
      OPERATOR_WORKSTATION_MASTER_TYPES.WORKSTATION,
  });
};


export const updateWorkstation = async (
  workstationConfigId,
  data
) => {
  return updateOperatorWorkstationMaster(
    workstationConfigId,
    {
      ...data,

      master_type:
        OPERATOR_WORKSTATION_MASTER_TYPES.WORKSTATION,
    }
  );
};


export const softDeleteWorkstation = async (
  workstationConfigId
) => {
  return softDeleteOperatorWorkstationMaster(
    workstationConfigId,
    OPERATOR_WORKSTATION_MASTER_TYPES.WORKSTATION
  );
};


// ============================================================
// 5. ROLE SCREEN CONVENIENCE METHODS
// ============================================================

export const createRoleScreen = async (data) => {
  return createOperatorWorkstationMaster({
    ...data,

    master_type:
      OPERATOR_WORKSTATION_MASTER_TYPES.ROLE_SCREEN,
  });
};


export const updateRoleScreen = async (
  roleScreenConfigId,
  data
) => {
  return updateOperatorWorkstationMaster(
    roleScreenConfigId,
    {
      ...data,

      master_type:
        OPERATOR_WORKSTATION_MASTER_TYPES.ROLE_SCREEN,
    }
  );
};


export const softDeleteRoleScreen = async (
  roleScreenConfigId
) => {
  return softDeleteOperatorWorkstationMaster(
    roleScreenConfigId,
    OPERATOR_WORKSTATION_MASTER_TYPES.ROLE_SCREEN
  );
};


// ============================================================
// 6. ACTIVE OPERATOR SCREEN RESOLUTION
// ============================================================

/**
 * GET /operator-workstation/runtime/screens
 *
 * Required:
 *
 * company_id UUID
 * role_id INTEGER
 *
 * Optional:
 *
 * workstation_config_id UUID
 *
 * Example:
 *
 * getActiveOperatorScreens({
 *   company_id: "...",
 *   role_id: 1,
 *   workstation_config_id: "..."
 * });
 */
export const getActiveOperatorScreens = async (
  filters
) => {
  const response = await api.get(
    `${BASE_URL}/runtime/screens`,
    {
      params: cleanParams(filters),
    }
  );

  return responsePayload(response);
};


// ============================================================
// 7. RUNTIME
// ============================================================

/**
 * GET /operator-workstation/runtime
 *
 * Optional filters:
 *
 * company_id
 * plant_id
 * line_id
 * machine_id
 *
 * shift_id INTEGER
 *
 * workstation_config_id
 * plan_entry_id
 * unit_id
 *
 * user_id INTEGER
 *
 * action_code
 * result_status
 * source_system
 * correlation_id
 *
 * from_timestamp
 * to_timestamp
 */
export const getOperatorWorkstationRuntime = async (
  filters = {}
) => {
  const response = await api.get(
    `${BASE_URL}/runtime`,
    {
      params: cleanParams(filters),
    }
  );

  return responsePayload(response);
};


// ============================================================
// 8. OPERATOR ACTION EVENT BY ID
// ============================================================

/**
 * GET /operator-workstation/runtime/action/:id
 *
 * Read-only historical evidence.
 */
export const getOperatorActionEventById = async (
  operatorActionEventId
) => {
  const response = await api.get(
    `${BASE_URL}/runtime/action/${operatorActionEventId}`
  );

  return responsePayload(response);
};


// ============================================================
// 9. EXECUTE OPERATOR ACTION
// ============================================================

/**
 * POST /operator-workstation/execute
 *
 * Creates append-only operator_action_event.
 *
 * Example:
 *
 * {
 *   company_id: "...",
 *   plant_id: "...",
 *   line_id: "...",
 *   machine_id: "...",
 *
 *   shift_id: 1,
 *
 *   workstation_config_id: "...",
 *
 *   plan_entry_id: "...",
 *   unit_id: "...",
 *
 *   user_id: 10,
 *
 *   action_code: "START",
 *   result_status: "COMPLETED",
 *
 *   reason: null,
 *   source_system: "MES_UI",
 *
 *   correlation_id: "...",
 *   idempotency_key: "...",
 *
 *   payload: {}
 * }
 */
export const executeOperatorAction = async (
  payload
) => {
  const response = await api.post(
    `${BASE_URL}/execute`,
    payload
  );

  return responsePayload(response);
};


// ============================================================
// 10. REPORT
// ============================================================

/**
 * GET /operator-workstation/report
 *
 * Same filters as runtime.
 *
 * Backend response:
 *
 * {
 *   success: true,
 *
 *   data: {
 *      operator_action_event: []
 *   },
 *
 *   meta: {
 *      total_count,
 *      action_counts,
 *      result_counts
 *   }
 * }
 */
export const getOperatorWorkstationReport = async (
  filters = {}
) => {
  const response = await api.get(
    `${BASE_URL}/report`,
    {
      params: cleanParams(filters),
    }
  );


  return {
    data:
      responsePayload(response),

    meta:
      responseMeta(response),
  };
};


// ============================================================
// 11. RAW RESPONSE METHODS
//
// Useful if frontend needs:
// success
// message
// errors
// meta
// ============================================================

export const getOperatorWorkstationConfigResponse =
  async (filters = {}) => {
    const response = await api.get(
      `${BASE_URL}/config`,
      {
        params: cleanParams(filters),
      }
    );

    return responseData(response);
  };


export const getOperatorWorkstationRuntimeResponse =
  async (filters = {}) => {
    const response = await api.get(
      `${BASE_URL}/runtime`,
      {
        params: cleanParams(filters),
      }
    );

    return responseData(response);
  };


export const executeOperatorActionResponse =
  async (payload) => {
    const response = await api.post(
      `${BASE_URL}/execute`,
      payload
    );

    return responseData(response);
  };


// ============================================================
// 12. DATA EXTRACTION HELPERS
// ============================================================

export const getUiTemplateRows = (
  config
) => {
  if (
    Array.isArray(
      config?.ui_template_config
    )
  ) {
    return config.ui_template_config;
  }

  return [];
};


export const getWorkstationRows = (
  config
) => {
  if (
    Array.isArray(
      config?.workstation_config
    )
  ) {
    return config.workstation_config;
  }

  return [];
};


export const getRoleScreenRows = (
  config
) => {
  if (
    Array.isArray(
      config?.role_screen_config
    )
  ) {
    return config.role_screen_config;
  }

  return [];
};


export const getOperatorActionRows = (
  runtime
) => {
  if (
    Array.isArray(
      runtime?.operator_action_event
    )
  ) {
    return runtime.operator_action_event;
  }

  return [];
};


// ============================================================
// 13. DEFAULT EXPORT
// ============================================================

const operatorWorkstationService = {

  // ==========================================================
  // CONSTANTS
  // ==========================================================

  MASTER_TYPES:
    OPERATOR_WORKSTATION_MASTER_TYPES,


  // ==========================================================
  // CONFIG
  // ==========================================================

  getConfig:
    getOperatorWorkstationConfig,

  saveConfig:
    saveOperatorWorkstationConfig,


  // ==========================================================
  // MASTER
  // ==========================================================

  getMaster:
    getOperatorWorkstationMaster,

  createMaster:
    createOperatorWorkstationMaster,

  updateMaster:
    updateOperatorWorkstationMaster,

  softDeleteMaster:
    softDeleteOperatorWorkstationMaster,


  // ==========================================================
  // UI TEMPLATE
  // ==========================================================

  createUiTemplate,

  updateUiTemplate,

  softDeleteUiTemplate,


  // ==========================================================
  // WORKSTATION
  // ==========================================================

  createWorkstation,

  updateWorkstation,

  softDeleteWorkstation,


  // ==========================================================
  // ROLE SCREEN
  // ==========================================================

  createRoleScreen,

  updateRoleScreen,

  softDeleteRoleScreen,


  // ==========================================================
  // SCREEN RESOLUTION
  // ==========================================================

  getActiveOperatorScreens,


  // ==========================================================
  // RUNTIME
  // ==========================================================

  getRuntime:
    getOperatorWorkstationRuntime,

  getOperatorActionEventById,

  execute:
    executeOperatorAction,


  // ==========================================================
  // REPORT
  // ==========================================================

  getReport:
    getOperatorWorkstationReport,


  // ==========================================================
  // HELPERS
  // ==========================================================

  getUiTemplateRows,

  getWorkstationRows,

  getRoleScreenRows,

  getOperatorActionRows,
};


export default operatorWorkstationService;