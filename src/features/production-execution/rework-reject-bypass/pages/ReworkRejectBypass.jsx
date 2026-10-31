import ReportLens from '../../../../shared/operations/ReportLens.jsx';
import EventJourney from '../../../../shared/operations/EventJourney.jsx';

import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/ReworkRejectBypass/ReworkRejectBypass.jsx

import React, {
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Tab,
  Tabs} from "react-bootstrap";

import {
  ArrowClockwise,
  ArrowRight,
  CheckCircleFill,
  Diagram3Fill,
  GeoAltFill,
  PlayFill,
  Plus,
} from "react-bootstrap-icons";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";

import reworkRejectBypassService, {
  BYPASS_EVENT_TYPES,
  BYPASS_RESULT_STATUS,
  REJECTION_REASON_CATEGORIES,
  REJECTION_REASON_STATUS,
  REJECTION_RESULT_STATUS,
  REWORK_EVENT_TYPES,
  REWORK_POSITION_STATUS,
  REWORK_RESULT_STATUS,
  getErrorMessage,
  getMasterData,
  getRuntimeData,
  responseData,
} from "../api/reworkRejectBypass.service.js";


// ============================================================
// HELPERS
// ============================================================

const hasValue = (value) =>
  value !== undefined &&
  value !== null &&
  value !== "";


const sameId = (left, right) =>
  String(left ?? "") ===
  String(right ?? "");


const shortId = (value) => {

  if (!value) {
    return "-";
  }

  const text =
    String(value);

  if (text.length <= 16) {
    return text;
  }

  return `${text.slice(0, 8)}...${text.slice(-5)}`;
};


const safeNumber = (
  value,
  fallback = 0
) => {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


const nowIdempotencyKey = (
  prefix = "MES"
) => {

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};


const generateUuid = () => {

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(
      /[xy]/g,
      (char) => {

        const random =
          Math.random() * 16 | 0;

        const value =
          char === "x"
            ? random
            : (random & 0x3) | 0x8;

        return value.toString(16);
      }
    );
};


// ============================================================
// EXTRACT LOOKUP ROWS
//
// Some existing master APIs have nested response structures.
// We recursively find objects containing the expected ID.
// ============================================================

const collectObjectsByKey = (
  value,
  key,
  result = []
) => {

  if (
    value === undefined ||
    value === null
  ) {
    return result;
  }

  if (Array.isArray(value)) {

    value.forEach((item) => {
      collectObjectsByKey(
        item,
        key,
        result
      );
    });

    return result;
  }

  if (
    typeof value !== "object"
  ) {
    return result;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      value,
      key
    )
  ) {
    result.push(value);
  }

  Object.values(value)
    .forEach((child) => {

      if (
        child &&
        typeof child === "object"
      ) {
        collectObjectsByKey(
          child,
          key,
          result
        );
      }
    });

  return result;
};


const extractRowsByKey = (
  response,
  key
) => {

  const root =
    response?.data?.data ??
    response?.data ??
    response ??
    null;

  const rows =
    collectObjectsByKey(
      root,
      key,
      []
    );

  const unique =
    new Map();

  rows.forEach((row) => {

    const id =
      row?.[key];

    if (hasValue(id)) {
      unique.set(
        String(id),
        row
      );
    }
  });

  return Array.from(
    unique.values()
  );
};


// ============================================================
// LABEL HELPERS
// ============================================================

const firstValue = (
  row,
  fields
) => {

  for (const field of fields) {

    if (hasValue(row?.[field])) {
      return row[field];
    }
  }

  return "";
};


const entityLabel = (
  row,
  idField,
  codeFields = [],
  nameFields = []
) => {

  if (!row) {
    return "-";
  }

  const code =
    firstValue(
      row,
      codeFields
    );

  const name =
    firstValue(
      row,
      nameFields
    );

  if (code && name) {
    return `${code} - ${name}`;
  }

  if (code) {
    return String(code);
  }

  if (name) {
    return String(name);
  }

  return shortId(
    row[idField]
  );
};


const getLookupName = (
  rows,
  idField,
  id,
  codeFields,
  nameFields
) => {

  if (!hasValue(id)) {
    return "-";
  }

  const row =
    rows.find(
      (item) =>
        sameId(
          item?.[idField],
          id
        )
    );

  if (!row) {
    return shortId(id);
  }

  return entityLabel(
    row,
    idField,
    codeFields,
    nameFields
  );
};


// ============================================================
// FILTER HIERARCHY LOOKUPS
// ============================================================

const filterHierarchyRows = (
  rows,
  {
    company_id = "",
    plant_id = "",
    line_id = "",
  } = {}
) => {

  return rows.filter((row) => {

    if (
      hasValue(company_id) &&
      hasValue(row.company_id) &&
      !sameId(
        row.company_id,
        company_id
      )
    ) {
      return false;
    }

    if (
      hasValue(plant_id) &&
      hasValue(row.plant_id) &&
      !sameId(
        row.plant_id,
        plant_id
      )
    ) {
      return false;
    }

    if (
      hasValue(line_id) &&
      hasValue(row.line_id) &&
      !sameId(
        row.line_id,
        line_id
      )
    ) {
      return false;
    }

    return true;
  });
};


// ============================================================
// CSV
// ============================================================

const csvEscape = (value) => {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text =
    typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

  return `"${text.replace(/"/g, '""')}"`;
};


const downloadCsv = (
  rows,
  filename
) => {

  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    throw new Error(
      "No data available for export."
    );
  }

  const headers =
    Array.from(
      rows.reduce(
        (set, row) => {

          Object.keys(row || {})
            .forEach(
              (key) => set.add(key)
            );

          return set;
        },
        new Set()
      )
    );

  const lines = [
    headers
      .map(csvEscape)
      .join(","),

    ...rows.map((row) =>
      headers
        .map(
          (header) =>
            csvEscape(
              row?.[header]
            )
        )
        .join(",")
    ),
  ];

  const blob =
    new Blob(
      [
        lines.join("\n")
      ],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href =
    url;

  anchor.download =
    filename;

  document.body
    .appendChild(anchor);

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(url);
};


// ============================================================
// FORM DEFAULTS
// ============================================================

const emptyRejectionReason = () => ({
  company_id: "",
  reason_code: "",
  reason_name: "",
  category: "PROCESS",
  status: "ACTIVE",
  version_no: 1,
});


const emptyReworkRule = () => ({
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  part_id: "",
  from_route_step_id: "",
  rework_route_step_id: "",
  rejection_reason_id: "",
  max_attempts: "",
  approval_required: false,
  rule_expression: "",
  is_active: true,
  version_no: 1,
});


const emptyBypassConfig = () => ({
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  part_id: "",
  route_step_id: "",
  process_id: "",
  bypass_scope: "",
  reason_required: true,
  approval_required: true,
  max_duration_minutes: "",
  rule_expression: "",
  is_active: true,
  version_no: 1,
});


const emptyRejectionEvent = () => ({
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  shift_id: "",
  plan_id: "",
  plan_entry_id: "",
  part_id: "",
  process_id: "",
  unit_id: "",
  rejection_reason_id: "",
  qty: 1,
  barcode_value: "",
  result_status: "REJECTED",
  source_system: "MES_UI",
  correlation_id: "",
  idempotency_key:
    nowIdempotencyKey(
      "REJECTION"
    ),
});


const emptyReworkExecution = () => ({
  company_id: "",
  unit_id: "",
  rejection_event_id: "",
  rework_rule_config_id: "",
  approval_granted: false,
  rule_expression_result: false,
  attempt_no: "",
  event_type: "REWORK_STARTED",
  result_status: "PENDING",
  user_id: "",
  position_status: "REWORK",
  correlation_id: "",
  idempotency_key:
    nowIdempotencyKey(
      "REWORK"
    ),
});


const emptyBypassExecution = () => ({
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  shift_id: "",
  plan_entry_id: "",
  unit_id: "",
  part_id: "",
  process_id: "",
  route_step_id: "",
  bypass_config_id: "",
  bypass_scope: "",
  module_code: "EXECUTION",
  event_type: "REQUESTED",
  reason: "",
  requested_by_user_id: "",
  approved_by_user_id: "",
  result_status: "PENDING",
  rule_expression_result: false,
  correlation_id: "",
  idempotency_key:
    nowIdempotencyKey(
      "BYPASS"
    ),
});


const emptyReportFilters = () => ({
  company_id: "",
  line_id: "",
  machine_id: "",
  unit_id: "",
  from_timestamp: "",
  to_timestamp: "",
});


// ============================================================
// COMPONENT
// ============================================================

const ReworkRejectBypass = () => {

  const queryClient =
    useQueryClient();

  const [activeTab, setActiveTab] =
    useState("overview");

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [busyAction, setBusyAction] =
    useState("");


  // ==========================================================
  // MODALS
  // ==========================================================

  const [reasonModal, setReasonModal] =
    useState({
      show: false,
      editId: null,
    });

  const [reworkRuleModal, setReworkRuleModal] =
    useState({
      show: false,
      editId: null,
    });

  const [bypassConfigModal, setBypassConfigModal] =
    useState({
      show: false,
      editId: null,
    });

  const [rejectionModal, setRejectionModal] =
    useState(false);

  const [reworkModal, setReworkModal] =
    useState(false);

  const [bypassModal, setBypassModal] =
    useState(false);


  // ==========================================================
  // FORMS
  // ==========================================================

  const [
    rejectionReasonForm,
    setRejectionReasonForm,
  ] =
    useState(
      emptyRejectionReason()
    );

  const [
    reworkRuleForm,
    setReworkRuleForm,
  ] =
    useState(
      emptyReworkRule()
    );

  const [
    bypassConfigForm,
    setBypassConfigForm,
  ] =
    useState(
      emptyBypassConfig()
    );

  const [
    rejectionForm,
    setRejectionForm,
  ] =
    useState(
      emptyRejectionEvent()
    );

  const [
    reworkForm,
    setReworkForm,
  ] =
    useState(
      emptyReworkExecution()
    );

  const [
    bypassForm,
    setBypassForm,
  ] =
    useState(
      emptyBypassExecution()
    );

  const [
    reportFilters,
    setReportFilters,
  ] =
    useState(
      emptyReportFilters()
    );


  // ==========================================================
  // MASTER QUERY
  // ==========================================================

  const masterQuery =
    useQuery({
      queryKey: [
        "rework-reject-bypass",
        "master",
      ],

      queryFn: () =>
        reworkRejectBypassService
          .getMaster(),
    });


  // ==========================================================
  // RUNTIME QUERY
  // ==========================================================

  const runtimeQuery =
    useQuery({
      queryKey: [
        "rework-reject-bypass",
        "runtime",
      ],

      queryFn: () =>
        reworkRejectBypassService
          .getRuntime(),

      // Automatic production NOK events can create rejection_event rows
      // outside this page. Poll so the KPI and table stay live.
      refetchInterval: 10000,

      refetchIntervalInBackground: true,
    });


  // ==========================================================
  // LOOKUPS
  // ==========================================================

  const companyQuery =
    useQuery({
      queryKey: [
        "rrb-company-master"
      ],

      queryFn: () =>
        api.get(
          "/company-master/master"
        ),
    });


  const plantQuery =
    useQuery({
      queryKey: [
        "rrb-plant-master"
      ],

      queryFn: () =>
        api.get(
          "/plant-shop-master/master"
        ),
    });


  const lineQuery =
    useQuery({
      queryKey: [
        "rrb-line-master"
      ],

      queryFn: () =>
        api.get(
          "/line-master/master"
        ),
    });


  const machineQuery =
    useQuery({
      queryKey: [
        "rrb-machine-master"
      ],

      queryFn: () =>
        api.get(
          "/machine-master/master"
        ),
    });


  const partQuery =
    useQuery({
      queryKey: [
        "rrb-part-master"
      ],

      queryFn: () =>
        api.get(
          "/part-master/master"
        ),
    });


  const processQuery =
    useQuery({
      queryKey: [
        "rrb-process-master"
      ],

      queryFn: () =>
        api.get(
          "/process-master/master"
        ),
    });


  const routeStepQuery =
    useQuery({
      queryKey: [
        "rrb-route-step"
      ],

      queryFn: () =>
        api.get(
          "/route-station-master/config/step"
        ),
    });


  const shiftQuery =
    useQuery({
      queryKey: [
        "rrb-shifts"
      ],

      queryFn: () =>
        api.get(
          "/shift-plan/config"
        ),
    });


  const planQuery =
    useQuery({
      queryKey: [
        "rrb-production-plan"
      ],

      queryFn: () =>
        api.get(
          "/production-plan/master"
        ),
    });


  // ==========================================================
  // PLAN ENTRY FOR REJECTION FORM
  // ==========================================================

  const rejectionPlanEntryQuery =
    useQuery({

      queryKey: [
        "rrb-plan-entry",
        rejectionForm.plan_id,
      ],

      enabled:
        Boolean(
          rejectionForm.plan_id
        ),

      queryFn: () =>
        api.get(
          "/production-plan/config",
          {
            params: {
              plan_id:
                rejectionForm
                  .plan_id,
            },
          }
        ),
    });


  // ==========================================================
  // REPORT
  // ==========================================================

  const reportQuery =
    useQuery({

      queryKey: [
        "rework-reject-bypass",
        "report",
        reportFilters,
      ],

      enabled: false,

      queryFn: () =>
        reworkRejectBypassService
          .getReport(
            reportFilters
          ),
    });


  // ==========================================================
  // NORMALIZED MASTER DATA
  // ==========================================================

  const masterData =
    useMemo(
      () =>
        getMasterData(
          masterQuery.data
        ),
      [masterQuery.data]
    );


  const runtimeData =
    useMemo(
      () =>
        getRuntimeData(
          runtimeQuery.data
        ),
      [runtimeQuery.data]
    );


  const rejectionReasons =
    masterData.rejectionReasons;

  const reworkRules =
    masterData.reworkRules;

  const bypassConfigs =
    masterData.bypassConfigs;

  const rejectionEvents =
    runtimeData.rejectionEvents;

  const rejectionEventCount =
    Number(
      runtimeData.rejectionEventCount ??
      rejectionEvents.length ??
      0
    );

  const reworkEvents =
    runtimeData.reworkEvents;

  const bypassEvents =
    runtimeData.bypassEvents;


  // ==========================================================
  // LOOKUP ROWS
  // ==========================================================

  const companies =
    useMemo(
      () =>
        extractRowsByKey(
          companyQuery.data,
          "company_id"
        ),
      [companyQuery.data]
    );


  const plants =
    useMemo(
      () =>
        extractRowsByKey(
          plantQuery.data,
          "plant_id"
        ),
      [plantQuery.data]
    );


  const lines =
    useMemo(
      () =>
        extractRowsByKey(
          lineQuery.data,
          "line_id"
        ),
      [lineQuery.data]
    );


  const machines =
    useMemo(
      () =>
        extractRowsByKey(
          machineQuery.data,
          "machine_id"
        ),
      [machineQuery.data]
    );


  const parts =
    useMemo(
      () =>
        extractRowsByKey(
          partQuery.data,
          "part_id"
        ),
      [partQuery.data]
    );


  const processes =
    useMemo(
      () =>
        extractRowsByKey(
          processQuery.data,
          "process_id"
        ),
      [processQuery.data]
    );


  const routeSteps =
    useMemo(
      () =>
        extractRowsByKey(
          routeStepQuery.data,
          "route_step_id"
        ),
      [routeStepQuery.data]
    );


  const shifts =
    useMemo(
      () =>
        extractRowsByKey(
          shiftQuery.data,
          "shift_id"
        ),
      [shiftQuery.data]
    );


  const productionPlans =
    useMemo(
      () =>
        extractRowsByKey(
          planQuery.data,
          "plan_id"
        ),
      [planQuery.data]
    );


  const rejectionPlanEntries =
    useMemo(
      () =>
        extractRowsByKey(
          rejectionPlanEntryQuery.data,
          "plan_entry_id"
        ),
      [
        rejectionPlanEntryQuery.data
      ]
    );


  // ==========================================================
  // LABEL FUNCTIONS
  // ==========================================================

  const companyName = (id) =>
    getLookupName(
      companies,
      "company_id",
      id,
      [
        "company_code",
        "code"
      ],
      [
        "company_name",
        "name"
      ]
    );


  const plantName = (id) =>
    getLookupName(
      plants,
      "plant_id",
      id,
      [
        "plant_code",
        "shop_code",
        "code"
      ],
      [
        "plant_name",
        "shop_name",
        "name"
      ]
    );


  const lineName = (id) =>
    getLookupName(
      lines,
      "line_id",
      id,
      [
        "line_code",
        "code"
      ],
      [
        "line_name",
        "name"
      ]
    );


  const machineName = (id) =>
    getLookupName(
      machines,
      "machine_id",
      id,
      [
        "machine_code",
        "code"
      ],
      [
        "machine_name",
        "name"
      ]
    );


  const partName = (id) =>
    getLookupName(
      parts,
      "part_id",
      id,
      [
        "part_code",
        "part_no",
        "code"
      ],
      [
        "part_name",
        "name"
      ]
    );


  const processName = (id) =>
    getLookupName(
      processes,
      "process_id",
      id,
      [
        "process_code",
        "code"
      ],
      [
        "process_name",
        "name"
      ]
    );


  const routeStepName = (id) =>
    getLookupName(
      routeSteps,
      "route_step_id",
      id,
      [
        "step_code",
        "route_step_code",
        "code"
      ],
      [
        "step_name",
        "route_step_name",
        "name"
      ]
    );


  const shiftName = (id) =>
    getLookupName(
      shifts,
      "shift_id",
      id,
      [
        "shift_code",
        "shift_no",
        "code"
      ],
      [
        "shift_name",
        "name"
      ]
    );


  // ==========================================================
  // COMMON UI ACTIONS
  // ==========================================================

  const clearMessages = () => {

    setMessage("");
    setErrorMessage("");
  };


  const refreshAll =
    async () => {

      clearMessages();

      await Promise.allSettled([
        masterQuery.refetch(),
        runtimeQuery.refetch(),
      ]);

      setMessage(
        "Data refreshed successfully."
      );
    };


  const refreshAfterMasterChange =
    async () => {

      await queryClient
        .invalidateQueries({
          queryKey: [
            "rework-reject-bypass",
            "master",
          ],
        });

      await queryClient
        .invalidateQueries({
          queryKey: [
            "rework-reject-bypass",
            "runtime",
          ],
        });
    };


  const refreshAfterRuntimeChange =
    async () => {

      await queryClient
        .invalidateQueries({
          queryKey: [
            "rework-reject-bypass",
            "runtime",
          ],
        });

      await queryClient
        .invalidateQueries({
          queryKey: [
            "rework-reject-bypass",
            "report",
          ],
        });
    };


  // ==========================================================
  // REJECTION REASON
  // ==========================================================

  const openCreateReason = () => {

    clearMessages();

    setRejectionReasonForm(
      emptyRejectionReason()
    );

    setReasonModal({
      show: true,
      editId: null,
    });
  };


  const openEditReason = (row) => {

    clearMessages();

    setRejectionReasonForm({
      company_id:
        row.company_id || "",

      reason_code:
        row.reason_code || "",

      reason_name:
        row.reason_name || "",

      category:
        row.category || "",

      status:
        row.status || "ACTIVE",

      version_no:
        row.version_no || 1,
    });

    setReasonModal({
      show: true,
      editId:
        row.rejection_reason_id,
    });
  };


  const saveRejectionReason =
    async () => {

      clearMessages();

      setBusyAction(
        "reason-save"
      );

      try {

        if (reasonModal.editId) {

          await reworkRejectBypassService
            .updateRejectionReason(
              reasonModal.editId,
              rejectionReasonForm
            );

          setMessage(
            "Rejection Reason updated successfully."
          );

        }
        else {

          await reworkRejectBypassService
            .createRejectionReason(
              rejectionReasonForm
            );

          setMessage(
            "Rejection Reason created successfully."
          );
        }

        setReasonModal({
          show: false,
          editId: null,
        });

        await refreshAfterMasterChange();

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to save Rejection Reason."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  const deactivateReason =
    async (row) => {

      const confirmed =
        window.confirm(
          `Deactivate rejection reason "${row.reason_code}"?`
        );

      if (!confirmed) {
        return;
      }

      clearMessages();

      setBusyAction(
        `reason-delete-${row.rejection_reason_id}`
      );

      try {

        await reworkRejectBypassService
          .deleteRejectionReason(
            row.rejection_reason_id
          );

        setMessage(
          "Rejection Reason deactivated successfully."
        );

        await refreshAfterMasterChange();

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to deactivate Rejection Reason."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  // ==========================================================
  // REWORK RULE
  // ==========================================================

  const openCreateReworkRule = () => {

    clearMessages();

    setReworkRuleForm(
      emptyReworkRule()
    );

    setReworkRuleModal({
      show: true,
      editId: null,
    });
  };


  const openEditReworkRule = (row) => {

    clearMessages();

    setReworkRuleForm({
      company_id:
        row.company_id || "",

      plant_id:
        row.plant_id || "",

      line_id:
        row.line_id || "",

      machine_id:
        row.machine_id || "",

      part_id:
        row.part_id || "",

      from_route_step_id:
        row.from_route_step_id || "",

      rework_route_step_id:
        row.rework_route_step_id || "",

      rejection_reason_id:
        row.rejection_reason_id || "",

      max_attempts:
        row.max_attempts ?? "",

      approval_required:
        Boolean(
          row.approval_required
        ),

      rule_expression:
        row.rule_expression || "",

      is_active:
        Boolean(
          row.is_active
        ),

      version_no:
        row.version_no || 1,
    });

    setReworkRuleModal({
      show: true,
      editId:
        row.rework_rule_config_id,
    });
  };


  const saveReworkRule =
    async () => {

      clearMessages();

      setBusyAction(
        "rework-rule-save"
      );

      try {

        const payload = {
          ...reworkRuleForm,

          max_attempts:
            hasValue(
              reworkRuleForm.max_attempts
            )
              ? Number(
                  reworkRuleForm.max_attempts
                )
              : null,

          version_no:
            Number(
              reworkRuleForm.version_no
            ),
        };

        if (
          reworkRuleModal.editId
        ) {

          await reworkRejectBypassService
            .updateReworkRule(
              reworkRuleModal.editId,
              payload
            );

          setMessage(
            "Rework Rule updated successfully."
          );

        }
        else {

          await reworkRejectBypassService
            .createReworkRule(
              payload
            );

          setMessage(
            "Rework Rule created successfully."
          );
        }

        setReworkRuleModal({
          show: false,
          editId: null,
        });

        await refreshAfterMasterChange();

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to save Rework Rule."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  const deactivateReworkRule =
    async (row) => {

      const confirmed =
        window.confirm(
          "Deactivate this Rework Rule?"
        );

      if (!confirmed) {
        return;
      }

      clearMessages();

      setBusyAction(
        `rework-rule-delete-${row.rework_rule_config_id}`
      );

      try {

        await reworkRejectBypassService
          .deleteReworkRule(
            row.rework_rule_config_id
          );

        setMessage(
          "Rework Rule deactivated successfully."
        );

        await refreshAfterMasterChange();

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to deactivate Rework Rule."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  // ==========================================================
  // BYPASS CONFIG
  // ==========================================================

  const openCreateBypassConfig = () => {

    clearMessages();

    setBypassConfigForm(
      emptyBypassConfig()
    );

    setBypassConfigModal({
      show: true,
      editId: null,
    });
  };


  const openEditBypassConfig = (row) => {

    clearMessages();

    setBypassConfigForm({
      company_id:
        row.company_id || "",

      plant_id:
        row.plant_id || "",

      line_id:
        row.line_id || "",

      machine_id:
        row.machine_id || "",

      part_id:
        row.part_id || "",

      route_step_id:
        row.route_step_id || "",

      process_id:
        row.process_id || "",

      bypass_scope:
        row.bypass_scope || "",

      reason_required:
        Boolean(
          row.reason_required
        ),

      approval_required:
        Boolean(
          row.approval_required
        ),

      max_duration_minutes:
        row.max_duration_minutes ?? "",

      rule_expression:
        row.rule_expression || "",

      is_active:
        Boolean(
          row.is_active
        ),

      version_no:
        row.version_no || 1,
    });

    setBypassConfigModal({
      show: true,
      editId:
        row.bypass_config_id,
    });
  };


  const saveBypassConfig =
    async () => {

      clearMessages();

      setBusyAction(
        "bypass-config-save"
      );

      try {

        const payload = {
          ...bypassConfigForm,

          max_duration_minutes:
            hasValue(
              bypassConfigForm
                .max_duration_minutes
            )
              ? Number(
                  bypassConfigForm
                    .max_duration_minutes
                )
              : null,

          version_no:
            Number(
              bypassConfigForm
                .version_no
            ),
        };

        if (
          bypassConfigModal.editId
        ) {

          await reworkRejectBypassService
            .updateBypassConfig(
              bypassConfigModal.editId,
              payload
            );

          setMessage(
            "Bypass configuration updated successfully."
          );

        }
        else {

          await reworkRejectBypassService
            .createBypassConfig(
              payload
            );

          setMessage(
            "Bypass configuration created successfully."
          );
        }

        setBypassConfigModal({
          show: false,
          editId: null,
        });

        await refreshAfterMasterChange();

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to save Bypass configuration."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  const deactivateBypassConfig =
    async (row) => {

      const confirmed =
        window.confirm(
          "Deactivate this Bypass configuration?"
        );

      if (!confirmed) {
        return;
      }

      clearMessages();

      setBusyAction(
        `bypass-config-delete-${row.bypass_config_id}`
      );

      try {

        await reworkRejectBypassService
          .deleteBypassConfig(
            row.bypass_config_id
          );

        setMessage(
          "Bypass configuration deactivated successfully."
        );

        await refreshAfterMasterChange();

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to deactivate Bypass configuration."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  // ==========================================================
  // REJECTION EVENT
  // ==========================================================

  const openRejection = () => {

    clearMessages();

    setRejectionForm(
      emptyRejectionEvent()
    );

    setRejectionModal(true);
  };


  const onRejectionPlanEntryChange =
    (planEntryId) => {

      const entry =
        rejectionPlanEntries.find(
          (row) =>
            sameId(
              row.plan_entry_id,
              planEntryId
            )
        );

      setRejectionForm(
        (previous) => ({

          ...previous,

          plan_entry_id:
            planEntryId,

          company_id:
            entry?.company_id ||
            previous.company_id,

          machine_id:
            entry?.machine_id ||
            previous.machine_id,

          shift_id:
            entry?.shift_id ||
            previous.shift_id,

          part_id:
            entry?.part_id ||
            previous.part_id,

          process_id:
            entry?.process_id ||
            previous.process_id,
        })
      );
    };


  const saveRejectionEvent =
    async () => {

      clearMessages();

      setBusyAction(
        "rejection-event-save"
      );

      try {

        const payload = {
          ...rejectionForm,

          shift_id:
            Number(
              rejectionForm.shift_id
            ),

          qty:
            safeNumber(
              rejectionForm.qty,
              1
            ),
        };

        await reworkRejectBypassService
          .createRejectionEvent(
            payload
          );

        setRejectionModal(false);

        setMessage(
          "Rejection Event recorded successfully."
        );

        setActiveTab(
          "rejections"
        );

        await refreshAfterRuntimeChange();

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to record Rejection Event."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  // ==========================================================
  // REWORK EXECUTION
  // ==========================================================

  const openRework = (
    rejection = null
  ) => {

    clearMessages();

    const form =
      emptyReworkExecution();

    if (rejection) {

      form.company_id =
        rejection.company_id || "";

      form.unit_id =
        rejection.unit_id || "";

      form.rejection_event_id =
        rejection.rejection_id || "";
    }

    setReworkForm(form);

    setReworkModal(true);
  };


  const executeRework =
    async () => {

      clearMessages();

      setBusyAction(
        "rework-execute"
      );

      try {

        const payload = {
          ...reworkForm,

          attempt_no:
            hasValue(
              reworkForm.attempt_no
            )
              ? Number(
                  reworkForm.attempt_no
                )
              : undefined,

          user_id:
            hasValue(
              reworkForm.user_id
            )
              ? Number(
                  reworkForm.user_id
                )
              : undefined,
        };

        await reworkRejectBypassService
          .executeRework(
            payload
          );

        setReworkModal(false);

        setMessage(
          "Rework started successfully. Original rejection remains unchanged."
        );

        setActiveTab(
          "rework-history"
        );

        await refreshAfterRuntimeChange();

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to execute Rework."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  // ==========================================================
  // BYPASS EXECUTION
  // ==========================================================

  const openBypass = (
    config = null
  ) => {

    clearMessages();

    const form =
      emptyBypassExecution();

    if (config) {

      form.company_id =
        config.company_id || "";

      form.plant_id =
        config.plant_id || "";

      form.line_id =
        config.line_id || "";

      form.machine_id =
        config.machine_id || "";

      form.part_id =
        config.part_id || "";

      form.process_id =
        config.process_id || "";

      form.route_step_id =
        config.route_step_id || "";

      form.bypass_config_id =
        config.bypass_config_id || "";

      form.bypass_scope =
        config.bypass_scope || "";
    }

    setBypassForm(form);

    setBypassModal(true);
  };


  const executeBypass =
    async () => {

      clearMessages();

      setBusyAction(
        "bypass-execute"
      );

      try {

        const payload = {
          ...bypassForm,

          shift_id:
            Number(
              bypassForm.shift_id
            ),

          requested_by_user_id:
            hasValue(
              bypassForm
                .requested_by_user_id
            )
              ? Number(
                  bypassForm
                    .requested_by_user_id
                )
              : undefined,

          approved_by_user_id:
            hasValue(
              bypassForm
                .approved_by_user_id
            )
              ? Number(
                  bypassForm
                    .approved_by_user_id
                )
              : undefined,
        };

        await reworkRejectBypassService
          .executeBypass(
            payload
          );

        setBypassModal(false);

        setMessage(
          `Bypass ${bypassForm.event_type} event recorded successfully.`
        );

        setActiveTab(
          "bypass-history"
        );

        await refreshAfterRuntimeChange();

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to execute Bypass event."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  // ==========================================================
  // REPORT
  // ==========================================================

  const generateReport =
    async () => {

      clearMessages();

      setBusyAction(
        "report"
      );

      try {

        await reportQuery
          .refetch();

        setMessage(
          "Report generated successfully."
        );

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to generate report."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  const exportReport =
    async () => {

      clearMessages();

      setBusyAction(
        "export"
      );

      try {

        const response =
          await reworkRejectBypassService
            .exportReport(
              reportFilters
            );

        const data =
          responseData(response) || {};

        const rejectionRows =
          Array.isArray(
            data.rejection_event
          )
            ? data.rejection_event
            : [];

        const reworkRows =
          Array.isArray(
            data.rework_event
          )
            ? data.rework_event
            : [];

        const bypassRows =
          Array.isArray(
            data.bypass_event
          )
            ? data.bypass_event
            : [];

        const combined = [

          ...rejectionRows.map(
            (row) => ({
              record_type:
                "REJECTION",
              ...row,
            })
          ),

          ...reworkRows.map(
            (row) => ({
              record_type:
                "REWORK",
              ...row,
            })
          ),

          ...bypassRows.map(
            (row) => ({
              record_type:
                "BYPASS",
              ...row,
            })
          ),
        ];

        downloadCsv(
          combined,
          `rework-reject-bypass-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`
        );

        setMessage(
          "Report exported successfully."
        );

      }
      catch (error) {

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to export report."
          )
        );

      }
      finally {

        setBusyAction("");
      }
    };


  // ==========================================================
  // REPORT DATA
  // ==========================================================

  const reportResponse =
    responseData(
      reportQuery.data
    ) || {};

  const reportMeta =
    reportQuery.data
      ?.data
      ?.meta || {};


  // ==========================================================
  // FILTERED LOOKUPS FOR FORMS
  // ==========================================================

  const rulePlants =
    filterHierarchyRows(
      plants,
      {
        company_id:
          reworkRuleForm.company_id,
      }
    );

  const ruleLines =
    filterHierarchyRows(
      lines,
      {
        company_id:
          reworkRuleForm.company_id,

        plant_id:
          reworkRuleForm.plant_id,
      }
    );

  const ruleMachines =
    filterHierarchyRows(
      machines,
      {
        company_id:
          reworkRuleForm.company_id,

        plant_id:
          reworkRuleForm.plant_id,

        line_id:
          reworkRuleForm.line_id,
      }
    );


  const bypassConfigPlants =
    filterHierarchyRows(
      plants,
      {
        company_id:
          bypassConfigForm.company_id,
      }
    );

  const bypassConfigLines =
    filterHierarchyRows(
      lines,
      {
        company_id:
          bypassConfigForm.company_id,

        plant_id:
          bypassConfigForm.plant_id,
      }
    );

  const bypassConfigMachines =
    filterHierarchyRows(
      machines,
      {
        company_id:
          bypassConfigForm.company_id,

        plant_id:
          bypassConfigForm.plant_id,

        line_id:
          bypassConfigForm.line_id,
      }
    );


  const rejectionPlants =
    filterHierarchyRows(
      plants,
      {
        company_id:
          rejectionForm.company_id,
      }
    );

  const rejectionLines =
    filterHierarchyRows(
      lines,
      {
        company_id:
          rejectionForm.company_id,

        plant_id:
          rejectionForm.plant_id,
      }
    );

  const rejectionMachines =
    filterHierarchyRows(
      machines,
      {
        company_id:
          rejectionForm.company_id,

        plant_id:
          rejectionForm.plant_id,

        line_id:
          rejectionForm.line_id,
      }
    );


  const bypassRuntimePlants =
    filterHierarchyRows(
      plants,
      {
        company_id:
          bypassForm.company_id,
      }
    );

  const bypassRuntimeLines =
    filterHierarchyRows(
      lines,
      {
        company_id:
          bypassForm.company_id,

        plant_id:
          bypassForm.plant_id,
      }
    );

  const bypassRuntimeMachines =
    filterHierarchyRows(
      machines,
      {
        company_id:
          bypassForm.company_id,

        plant_id:
          bypassForm.plant_id,

        line_id:
          bypassForm.line_id,
      }
    );


  // ==========================================================
  // LOAD ERROR
  // ==========================================================

  const initialError =
    masterQuery.error ||
    runtimeQuery.error;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <>

<Container
      fluid
      className="rrb-page py-3"
    >


      <style>{`

        .rrb-page {
          min-height: 100vh;
          padding: 22px !important;
          background: #f4f6fb;
        }

        .rrb-page .card {
          background: #ffffff;
          border: 1px solid #e4e8f0;
          border-radius: 12px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06) !important;
        }

        .rrb-title {
          margin: 0;
          color: #1f2d3d;
          font-size: 22px;
          font-weight: 700;
        }

        .rrb-subtitle {
          margin-top: 5px;
          color: #788397;
          font-size: 13px;
        }

        .rrb-page .btn {
          border-radius: 7px;
          font-weight: 600;
        }

        .rrb-outline {
          background: #ffffff !important;
          border: 1px solid #314965 !important;
          color: #314965 !important;
        }

        .rrb-outline:hover {
          background: #f1f4f8 !important;
          color: #25364e !important;
        }

        .rrb-primary {
          background: #314965 !important;
          border-color: #314965 !important;
          color: #ffffff !important;
        }

        .rrb-primary:hover {
          background: #25364e !important;
          border-color: #25364e !important;
        }

        .rrb-stat {
          height: 100%;
          background: #ffffff;
          border: 1px solid #e4e8f0;
          border-radius: 10px;
          padding: 14px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.04);
        }

        .rrb-stat-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f4f8;
          color: #314965;
          font-size: 18px;
        }

        .rrb-stat-value {
          color: #263449;
          font-size: 20px;
          line-height: 1.15;
          font-weight: 700;
        }

        .rrb-stat-label {
          margin-top: 3px;
          color: #7b8597;
          font-size: 12px;
        }

        .rrb-page .nav-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          border-bottom: none;
        }

        .rrb-page .nav-tabs .nav-link {
          margin: 0;
          border: 1px solid #d8dde7;
          background: #ffffff;
          color: #596579;
          font-weight: 600;
          border-radius: 7px;
          padding: 8px 15px;
        }

        .rrb-page .nav-tabs .nav-link:hover {
          border-color: #b9a4e4;
          color: #314965;
        }

        .rrb-page .nav-tabs .nav-link.active {
          background: #f1f4f8;
          color: #314965;
          border-color: #314965;
        }

        .rrb-page .table-responsive {
          overflow: auto;
          border: 1px solid #e2e6ee;
          border-radius: 9px;
        }

        .rrb-page .table-responsive .table {
          margin: 0;
          white-space: nowrap;
        }

        .rrb-page .table thead th {
          background: #1c2d45;
          color: #ffffff;
          border-color: #1c2d45;
          padding: 12px;
          font-size: 12px;
          font-weight: 700;
          vertical-align: middle;
        }

        .rrb-page .table tbody td {
          vertical-align: middle;
          padding: 11px 12px;
          color: #354052;
          font-size: 13px;
        }

        .rrb-page .table tbody tr:last-child td {
          border-bottom: none;
        }

        .rrb-page .form-label {
          margin-bottom: 5px;
          color: #354154;
          font-size: 12px;
          font-weight: 700;
        }

        .rrb-page .form-control,
        .rrb-page .form-select {
          border-color: #d9dee8;
          border-radius: 7px;
        }

        .rrb-page .form-control:focus,
        .rrb-page .form-select:focus {
          border-color: #8c68d2;
          box-shadow: 0 0 0 0.2rem rgba(111, 66, 193, 0.12);
        }

        .rrb-flow-card {
          height: 100%;
          background: #f9fafc !important;
          border: 1px solid #e5e9f2 !important;
          box-shadow: none !important;
        }

        .rrb-flow-title {
          color: #263449;
          font-size: 14px;
          font-weight: 700;
        }

        .rrb-flow-text {
          color: #788397;
          font-size: 13px;
          line-height: 1.65;
        }

        .rrb-page .alert {
          border-radius: 9px;
        }

        .rrb-unit {
          font-family: monospace;
          font-size: 12px;
        }

        .rrb-modal .modal-content {
          border: none;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 18px 55px rgba(15, 23, 42, 0.22);
        }

        .rrb-modal .modal-header {
          background: #1c2d45;
          color: #ffffff;
          border: none;
        }

        .rrb-modal .modal-header .btn-close {
          filter: invert(1);
        }

        .rrb-modal .modal-footer {
          background: #f9fafc;
          border-top: 1px solid #e5e9f2;
        }

        .rrb-modal .btn-primary {
          background: #314965;
          border-color: #314965;
          font-weight: 600;
        }

        .rrb-modal .btn-primary:hover {
          background: #25364e;
          border-color: #25364e;
        }

        @media (max-width: 768px) {
          .rrb-page {
            padding: 12px !important;
          }

          .rrb-page .nav-tabs .nav-link {
            width: 100%;
            text-align: left;
          }
        }

      `}</style>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <Card className="rrb-card mb-3">

        <Card.Body>

          <Row className="align-items-center">

            <Col>

              <h4 className="rrb-title">
                Rework / Reject / Bypass
              </h4>

              <div className="rrb-subtitle">
                Production Execution exception handling and immutable runtime evidence
              </div>

            </Col>


            <Col
              xs="auto"
              className="d-flex flex-wrap gap-2"
            >

              <Button
                className="rrb-outline"
                onClick={refreshAll}
              >
                <ArrowClockwise className="me-1" />
                Refresh
              </Button>

              <Button
                variant="danger"
                onClick={openRejection}
              >
                <Plus className="me-1" />
                Record Rejection
              </Button>

              <Button
                variant="warning"
                onClick={() =>
                  openRework()
                }
              >
                <PlayFill className="me-1" />
                Start Rework
              </Button>

              <Button
                className="rrb-primary"
                onClick={() =>
                  openBypass()
                }
              >
                <CheckCircleFill className="me-1" />
                Bypass Event
              </Button>

            </Col>

          </Row>

        </Card.Body>

      </Card>


      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {message && (

        <Alert
          variant="success"
          dismissible
          onClose={() =>
            setMessage("")
          }
        >
          {message}
        </Alert>

      )}


      {errorMessage && (

        <Alert
          variant="danger"
          dismissible
          onClose={() =>
            setErrorMessage("")
          }
        >
          {errorMessage}
        </Alert>

      )}


      {initialError && (

        <Alert variant="danger">

          {getErrorMessage(
            initialError,
            "Unable to load Rework / Reject / Bypass data."
          )}

        </Alert>

      )}


      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <Row className="g-3 mb-3">

        <Col xl={2} md={4} sm={6}>
          <div className="rrb-stat">
            <div className="d-flex align-items-center gap-3">
              <div className="rrb-stat-icon">
                <Diagram3Fill />
              </div>
              <div>
                <div className="rrb-stat-value">
                  {rejectionReasons.length}
                </div>
                <div className="rrb-stat-label">
                  Rejection Reasons
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col xl={2} md={4} sm={6}>
          <div className="rrb-stat">
            <div className="d-flex align-items-center gap-3">
              <div className="rrb-stat-icon">
                <ArrowRight />
              </div>
              <div>
                <div className="rrb-stat-value">
                  {reworkRules.filter((row) => row.is_active).length}
                </div>
                <div className="rrb-stat-label">
                  Active Rework Rules
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col xl={2} md={4} sm={6}>
          <div className="rrb-stat">
            <div className="d-flex align-items-center gap-3">
              <div className="rrb-stat-icon">
                <CheckCircleFill />
              </div>
              <div>
                <div className="rrb-stat-value">
                  {bypassConfigs.filter((row) => row.is_active).length}
                </div>
                <div className="rrb-stat-label">
                  Active Bypass Config
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col xl={2} md={4} sm={6}>
          <div className="rrb-stat">
            <div className="d-flex align-items-center gap-3">
              <div className="rrb-stat-icon">
                <GeoAltFill />
              </div>
              <div>
                <div className="rrb-stat-value">
                  {rejectionEventCount}
                </div>
                <div className="rrb-stat-label">
                  Rejection Events
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col xl={2} md={4} sm={6}>
          <div className="rrb-stat">
            <div className="d-flex align-items-center gap-3">
              <div className="rrb-stat-icon">
                <PlayFill />
              </div>
              <div>
                <div className="rrb-stat-value">
                  {reworkEvents.length}
                </div>
                <div className="rrb-stat-label">
                  Rework Events
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col xl={2} md={4} sm={6}>
          <div className="rrb-stat">
            <div className="d-flex align-items-center gap-3">
              <div className="rrb-stat-icon">
                <CheckCircleFill />
              </div>
              <div>
                <div className="rrb-stat-value">
                  {bypassEvents.length}
                </div>
                <div className="rrb-stat-label">
                  Bypass Events
                </div>
              </div>
            </div>
          </div>
        </Col>

      </Row>


      {/* =====================================================
          TABS
      ===================================================== */}

      <Card className="rrb-card">

        <Card.Body>

          <Tabs
            activeKey={activeTab}
            onSelect={(key) =>
              setActiveTab(
                key || "overview"
              )
            }
            className="rrb-tabs mb-3"
          >

            {/* =================================================
                OVERVIEW
            ================================================= */}

            <Tab
              eventKey="overview"
              title="Overview"
            >

              <Alert variant="info">

                <strong>
                  Runtime evidence is append-only.
                </strong>

                {" "}

                A rejection is never changed to OK.
                Rework and bypass create new historical events.

              </Alert>


              <Row className="g-3">

                <Col lg={4}>

                  <Card className="rrb-flow-card h-100">

                    <Card.Body>

                      <Card.Title className="rrb-flow-title">
                        Rejection Flow
                      </Card.Title>

                      <div className="rrb-flow-text">

                        NOK / reject
                        <br />
                        ↓
                        <br />
                        rejection_event
                        <br />
                        ↓
                        <br />
                        original evidence preserved

                      </div>

                    </Card.Body>

                  </Card>

                </Col>


                <Col lg={4}>

                  <Card className="rrb-flow-card h-100">

                    <Card.Body>

                      <Card.Title className="rrb-flow-title">
                        Rework Flow
                      </Card.Title>

                      <div className="rrb-flow-text">

                        rejection_event
                        <br />
                        ↓
                        <br />
                        rework_rule_config
                        <br />
                        ↓
                        <br />
                        rework_event
                        <br />
                        ↓
                        <br />
                        unit_position redirected

                      </div>

                    </Card.Body>

                  </Card>

                </Col>


                <Col lg={4}>

                  <Card className="rrb-flow-card h-100">

                    <Card.Body>

                      <Card.Title className="rrb-flow-title">
                        Bypass Flow
                      </Card.Title>

                      <div className="rrb-flow-text">

                        REQUESTED
                        <br />
                        ↓
                        <br />
                        APPROVED
                        <br />
                        ↓
                        <br />
                        ACTIVATED
                        <br />
                        ↓
                        <br />
                        EXPIRED / REVOKED

                      </div>

                    </Card.Body>

                  </Card>

                </Col>

              </Row>

            </Tab>


            {/* =================================================
                REJECTION REASONS
            ================================================= */}

            <Tab
              eventKey="rejection-reasons"
              title="Rejection Reasons"
            >

              <div className="d-flex justify-content-end mb-3">

                <Button
                  className="rrb-primary"
                  onClick={openCreateReason}
                >
                  <Plus className="me-1" />
                  Add Rejection Reason
                </Button>

              </div>


              <div className="table-responsive">

                <Table
                  bordered
                  hover
                  size="sm"
                  className="rrb-table align-middle"
                >

                  <thead>

                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Version</th>
                      <th style={{
                        width: 170
                      }}>
                        Action
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {rejectionReasons.length === 0 ? (

                      <tr>

                        <td
                          colSpan={7}
                          className="text-center text-muted py-4"
                        >
                          No Rejection Reasons configured.
                        </td>

                      </tr>

                    ) : (

                      rejectionReasons.map(
                        (row) => (

                          <tr
                            key={
                              row.rejection_reason_id
                            }
                          >

                            <td>
                              {row.reason_code}
                            </td>

                            <td>
                              {row.reason_name}
                            </td>

                            <td>
                              {row.category}
                            </td>

                            <td>
                              {companyName(
                                row.company_id
                              )}
                            </td>

                            <td>

                              <Badge
                                bg={
                                  row.status ===
                                  "ACTIVE"
                                    ? "success"
                                    : "secondary"
                                }
                              >
                                {row.status}
                              </Badge>

                            </td>

                            <td>
                              {row.version_no}
                            </td>

                            <td>

                              <div className="d-flex gap-2">

                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() =>
                                    openEditReason(
                                      row
                                    )
                                  }
                                >
                                  Edit
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  disabled={
                                    row.status ===
                                      "INACTIVE" ||
                                    busyAction ===
                                      `reason-delete-${row.rejection_reason_id}`
                                  }
                                  onClick={() =>
                                    deactivateReason(
                                      row
                                    )
                                  }
                                >
                                  Deactivate
                                </Button>

                              </div>

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </Table>

              </div>

            </Tab>


            {/* =================================================
                REWORK RULES
            ================================================= */}

            <Tab
              eventKey="rework-rules"
              title="Rework Rules"
            >

              <div className="d-flex justify-content-end mb-3">

                <Button
                  className="rrb-primary"
                  onClick={
                    openCreateReworkRule
                  }
                >
                  <Plus className="me-1" />
                  Add Rework Rule
                </Button>

              </div>


              <div className="table-responsive">

                <Table
                  bordered
                  hover
                  size="sm"
                  className="rrb-table align-middle"
                >

                  <thead>

                    <tr>
                      <th>Company</th>
                      <th>Plant</th>
                      <th>Line</th>
                      <th>Machine</th>
                      <th>Part</th>
                      <th>From Step</th>
                      <th>Rework Step</th>
                      <th>Reason</th>
                      <th>Max Attempts</th>
                      <th>Approval</th>
                      <th>Active</th>
                      <th>Action</th>
                    </tr>

                  </thead>

                  <tbody>

                    {reworkRules.length === 0 ? (

                      <tr>

                        <td
                          colSpan={12}
                          className="text-center text-muted py-4"
                        >
                          No Rework Rules configured.
                        </td>

                      </tr>

                    ) : (

                      reworkRules.map(
                        (row) => {

                          const reason =
                            rejectionReasons
                              .find(
                                (item) =>
                                  sameId(
                                    item.rejection_reason_id,
                                    row.rejection_reason_id
                                  )
                              );

                          return (

                            <tr
                              key={
                                row.rework_rule_config_id
                              }
                            >

                              <td>
                                {companyName(
                                  row.company_id
                                )}
                              </td>

                              <td>
                                {row.plant_id
                                  ? plantName(
                                      row.plant_id
                                    )
                                  : "Any"}
                              </td>

                              <td>
                                {row.line_id
                                  ? lineName(
                                      row.line_id
                                    )
                                  : "Any"}
                              </td>

                              <td>
                                {row.machine_id
                                  ? machineName(
                                      row.machine_id
                                    )
                                  : "Any"}
                              </td>

                              <td>
                                {row.part_id
                                  ? partName(
                                      row.part_id
                                    )
                                  : "Any"}
                              </td>

                              <td>
                                {row.from_route_step_id
                                  ? routeStepName(
                                      row.from_route_step_id
                                    )
                                  : "Any"}
                              </td>

                              <td>
                                {routeStepName(
                                  row.rework_route_step_id
                                )}
                              </td>

                              <td>
                                {reason
                                  ? `${reason.reason_code} - ${reason.reason_name}`
                                  : "Any"}
                              </td>

                              <td>
                                {row.max_attempts ??
                                  "Unlimited"}
                              </td>

                              <td>
                                {row.approval_required
                                  ? "Yes"
                                  : "No"}
                              </td>

                              <td>

                                <Badge
                                  bg={
                                    row.is_active
                                      ? "success"
                                      : "secondary"
                                  }
                                >
                                  {row.is_active
                                    ? "ACTIVE"
                                    : "INACTIVE"}
                                </Badge>

                              </td>

                              <td>

                                <div className="d-flex gap-2">

                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() =>
                                      openEditReworkRule(
                                        row
                                      )
                                    }
                                  >
                                    Edit
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    disabled={
                                      !row.is_active
                                    }
                                    onClick={() =>
                                      deactivateReworkRule(
                                        row
                                      )
                                    }
                                  >
                                    Deactivate
                                  </Button>

                                </div>

                              </td>

                            </tr>

                          );
                        }
                      )

                    )}

                  </tbody>

                </Table>

              </div>

            </Tab>


            {/* =================================================
                BYPASS CONFIG
            ================================================= */}

            <Tab
              eventKey="bypass-config"
              title="Bypass Config"
            >

              <div className="d-flex justify-content-end mb-3">

                <Button
                  className="rrb-primary"
                  onClick={
                    openCreateBypassConfig
                  }
                >
                  <Plus className="me-1" />
                  Add Bypass Config
                </Button>

              </div>


              <div className="table-responsive">

                <Table
                  bordered
                  hover
                  size="sm"
                  className="rrb-table align-middle"
                >

                  <thead>

                    <tr>
                      <th>Company</th>
                      <th>Plant</th>
                      <th>Line</th>
                      <th>Machine</th>
                      <th>Part</th>
                      <th>Route Step</th>
                      <th>Process</th>
                      <th>Scope</th>
                      <th>Reason Required</th>
                      <th>Approval Required</th>
                      <th>Duration</th>
                      <th>Active</th>
                      <th>Action</th>
                    </tr>

                  </thead>

                  <tbody>

                    {bypassConfigs.length === 0 ? (

                      <tr>

                        <td
                          colSpan={13}
                          className="text-center text-muted py-4"
                        >
                          No Bypass configuration available.
                        </td>

                      </tr>

                    ) : (

                      bypassConfigs.map(
                        (row) => (

                          <tr
                            key={
                              row.bypass_config_id
                            }
                          >

                            <td>
                              {companyName(
                                row.company_id
                              )}
                            </td>

                            <td>
                              {row.plant_id
                                ? plantName(
                                    row.plant_id
                                  )
                                : "Any"}
                            </td>

                            <td>
                              {row.line_id
                                ? lineName(
                                    row.line_id
                                  )
                                : "Any"}
                            </td>

                            <td>
                              {row.machine_id
                                ? machineName(
                                    row.machine_id
                                  )
                                : "Any"}
                            </td>

                            <td>
                              {row.part_id
                                ? partName(
                                    row.part_id
                                  )
                                : "Any"}
                            </td>

                            <td>
                              {row.route_step_id
                                ? routeStepName(
                                    row.route_step_id
                                  )
                                : "Any"}
                            </td>

                            <td>
                              {row.process_id
                                ? processName(
                                    row.process_id
                                  )
                                : "Any"}
                            </td>

                            <td>
                              {row.bypass_scope}
                            </td>

                            <td>
                              {row.reason_required
                                ? "Yes"
                                : "No"}
                            </td>

                            <td>
                              {row.approval_required
                                ? "Yes"
                                : "No"}
                            </td>

                            <td>
                              {row.max_duration_minutes
                                ? `${row.max_duration_minutes} min`
                                : "-"}
                            </td>

                            <td>

                              <Badge
                                bg={
                                  row.is_active
                                    ? "success"
                                    : "secondary"
                                }
                              >
                                {row.is_active
                                  ? "ACTIVE"
                                  : "INACTIVE"}
                              </Badge>

                            </td>

                            <td>

                              <div className="d-flex flex-wrap gap-1">

                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() =>
                                    openEditBypassConfig(
                                      row
                                    )
                                  }
                                >
                                  Edit
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  disabled={
                                    !row.is_active
                                  }
                                  onClick={() =>
                                    openBypass(
                                      row
                                    )
                                  }
                                >
                                  Use
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  disabled={
                                    !row.is_active
                                  }
                                  onClick={() =>
                                    deactivateBypassConfig(
                                      row
                                    )
                                  }
                                >
                                  Deactivate
                                </Button>

                              </div>

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </Table>

              </div>

            </Tab>


            {/* =================================================
                REJECTIONS
            ================================================= */}

            <Tab
              eventKey="rejections"
              title="Rejections"
            >

              <div className="d-flex justify-content-end mb-3">

                <Button
                  variant="danger"
                  onClick={openRejection}
                >
                  Record Rejection
                </Button>

              </div>


              <div className="table-responsive">

                <EventJourney records={rejectionEvents} title="Rejection activity"/><Table
                  bordered
                  hover
                  size="sm"
                  className="rrb-table align-middle"
                >

                  <thead>

                    <tr>
                      <th>Time</th>
                      <th>Unit</th>
                      <th>Machine</th>
                      <th>Shift</th>
                      <th>Part</th>
                      <th>Process</th>
                      <th>Reason</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Source</th>
                      <th>Action</th>
                    </tr>

                  </thead>

                  <tbody>

                    {rejectionEvents.length === 0 ? (

                      <tr>

                        <td
                          colSpan={11}
                          className="text-center text-muted py-4"
                        >
                          No Rejection Events recorded.
                        </td>

                      </tr>

                    ) : (

                      rejectionEvents.map(
                        (row) => {

                          const reason =
                            rejectionReasons
                              .find(
                                (item) =>
                                  sameId(
                                    item.rejection_reason_id,
                                    row.rejection_reason_id
                                  )
                              );

                          return (

                            <tr
                              key={
                                row.rejection_id
                              }
                            >

                              <td>
                                {row.event_ts
                                  ? new Date(
                                      row.event_ts
                                    ).toLocaleString()
                                  : "-"}
                              </td>

                              <td
                                title={
                                  row.unit_id || ""
                                }
                              >
                                {shortId(
                                  row.unit_id
                                )}
                              </td>

                              <td>
                                {machineName(
                                  row.machine_id
                                )}
                              </td>

                              <td>
                                {shiftName(
                                  row.shift_id
                                )}
                              </td>

                              <td>
                                {partName(
                                  row.part_id
                                )}
                              </td>

                              <td>
                                {processName(
                                  row.process_id
                                )}
                              </td>

                              <td>
                                {reason
                                  ? `${reason.reason_code} - ${reason.reason_name}`
                                  : shortId(
                                      row.rejection_reason_id
                                    )}
                              </td>

                              <td>
                                {row.qty}
                              </td>

                              <td>

                                <Badge bg="danger">
                                  {row.result_status}
                                </Badge>

                              </td>

                              <td>
                                {row.source_system}
                              </td>

                              <td>

                                <Button
                                  size="sm"
                                  variant="warning"
                                  disabled={
                                    !row.unit_id
                                  }
                                  onClick={() =>
                                    openRework(
                                      row
                                    )
                                  }
                                >
                                  Rework
                                </Button>

                              </td>

                            </tr>

                          );
                        }
                      )

                    )}

                  </tbody>

                </Table>

              </div>

            </Tab>


            {/* =================================================
                REWORK HISTORY
            ================================================= */}

            <Tab
              eventKey="rework-history"
              title="Rework History"
            >

              <div className="d-flex justify-content-end mb-3">

                <Button
                  variant="warning"
                  onClick={() =>
                    openRework()
                  }
                >
                  Start Rework
                </Button>

              </div>


              <div className="table-responsive">

                <EventJourney records={reworkEvents} title="Rework attempts"/><Table
                  bordered
                  hover
                  size="sm"
                  className="rrb-table align-middle"
                >

                  <thead>

                    <tr>
                      <th>Time</th>
                      <th>Unit</th>
                      <th>Attempt</th>
                      <th>Machine</th>
                      <th>From Step</th>
                      <th>To Rework Step</th>
                      <th>Event Type</th>
                      <th>Status</th>
                      <th>User ID</th>
                      <th>Original Rejection</th>
                    </tr>

                  </thead>

                  <tbody>

                    {reworkEvents.length === 0 ? (

                      <tr>

                        <td
                          colSpan={10}
                          className="text-center text-muted py-4"
                        >
                          No Rework Events recorded.
                        </td>

                      </tr>

                    ) : (

                      reworkEvents.map(
                        (row) => (

                          <tr
                            key={
                              row.rework_id
                            }
                          >

                            <td>
                              {row.event_ts
                                ? new Date(
                                    row.event_ts
                                  ).toLocaleString()
                                : "-"}
                            </td>

                            <td
                              title={
                                row.unit_id
                              }
                            >
                              {shortId(
                                row.unit_id
                              )}
                            </td>

                            <td>
                              {row.attempt_no}
                            </td>

                            <td>
                              {machineName(
                                row.machine_id
                              )}
                            </td>

                            <td>
                              {routeStepName(
                                row.from_route_step_id
                              )}
                            </td>

                            <td>
                              {routeStepName(
                                row.to_route_step_id
                              )}
                            </td>

                            <td>
                              {row.event_type}
                            </td>

                            <td>

                              <Badge
                                bg={
                                  row.result_status ===
                                  "OK"
                                    ? "success"
                                    : row.result_status ===
                                      "NOK"
                                    ? "danger"
                                    : "secondary"
                                }
                              >
                                {row.result_status}
                              </Badge>

                            </td>

                            <td>
                              {row.user_id || "-"}
                            </td>

                            <td
                              title={
                                row.rejection_event_id ||
                                ""
                              }
                            >
                              {shortId(
                                row.rejection_event_id
                              )}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </Table>

              </div>

            </Tab>


            {/* =================================================
                BYPASS HISTORY
            ================================================= */}

            <Tab
              eventKey="bypass-history"
              title="Bypass History"
            >

              <div className="d-flex justify-content-end mb-3">

                <Button
                  onClick={() =>
                    openBypass()
                  }
                >
                  Add Bypass Event
                </Button>

              </div>


              <div className="table-responsive">

                <EventJourney records={bypassEvents} title="Bypass activity"/><Table
                  bordered
                  hover
                  size="sm"
                  className="rrb-table align-middle"
                >

                  <thead>

                    <tr>
                      <th>Time</th>
                      <th>Unit</th>
                      <th>Machine</th>
                      <th>Route Step</th>
                      <th>Event Type</th>
                      <th>Status</th>
                      <th>Reason</th>
                      <th>Requested By</th>
                      <th>Approved By</th>
                      <th>Config</th>
                    </tr>

                  </thead>

                  <tbody>

                    {bypassEvents.length === 0 ? (

                      <tr>

                        <td
                          colSpan={10}
                          className="text-center text-muted py-4"
                        >
                          No Bypass Events recorded.
                        </td>

                      </tr>

                    ) : (

                      bypassEvents.map(
                        (row) => (

                          <tr
                            key={
                              row.bypass_id
                            }
                          >

                            <td>
                              {row.event_ts
                                ? new Date(
                                    row.event_ts
                                  ).toLocaleString()
                                : "-"}
                            </td>

                            <td>
                              {shortId(
                                row.unit_id
                              )}
                            </td>

                            <td>
                              {machineName(
                                row.machine_id
                              )}
                            </td>

                            <td>
                              {routeStepName(
                                row.route_step_id
                              )}
                            </td>

                            <td>
                              {row.event_type}
                            </td>

                            <td>

                              <Badge
                                bg={
                                  row.result_status ===
                                    "ACTIVE" ||
                                  row.result_status ===
                                    "APPROVED"
                                    ? "success"
                                    : row.result_status ===
                                        "REJECTED" ||
                                      row.result_status ===
                                        "REVOKED"
                                    ? "danger"
                                    : "secondary"
                                }
                              >
                                {row.result_status}
                              </Badge>

                            </td>

                            <td>
                              {row.reason || "-"}
                            </td>

                            <td>
                              {row.requested_by_user_id ||
                                "-"}
                            </td>

                            <td>
                              {row.approved_by_user_id ||
                                "-"}
                            </td>

                            <td
                              title={
                                row.bypass_config_id ||
                                ""
                              }
                            >
                              {shortId(
                                row.bypass_config_id
                              )}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </Table>

              </div>

            </Tab>


            {/* =================================================
                REPORT
            ================================================= */}

            <Tab
              eventKey="report"
              title="Report"
            >

              <Card className="mb-3">

                <Card.Body>

                  <Row className="g-3">

                    <Col md={4}>

                      <Form.Group>

                        <Form.Label>
                          Company
                        </Form.Label>

                        <Form.Select
                          value={
                            reportFilters.company_id
                          }
                          onChange={(event) =>
                            setReportFilters(
                              (previous) => ({
                                ...previous,

                                company_id:
                                  event.target.value,

                                line_id: "",
                                machine_id: "",
                              })
                            )
                          }
                        >

                          <option value="">
                            All Companies
                          </option>

                          {companies.map(
                            (row) => (

                              <option
                                key={
                                  row.company_id
                                }
                                value={
                                  row.company_id
                                }
                              >
                                {entityLabel(
                                  row,
                                  "company_id",
                                  [
                                    "company_code"
                                  ],
                                  [
                                    "company_name"
                                  ]
                                )}
                              </option>

                            )
                          )}

                        </Form.Select>

                      </Form.Group>

                    </Col>


                    <Col md={4}>

                      <Form.Group>

                        <Form.Label>
                          Line
                        </Form.Label>

                        <Form.Select
                          value={
                            reportFilters.line_id
                          }
                          onChange={(event) =>
                            setReportFilters(
                              (previous) => ({
                                ...previous,
                                line_id:
                                  event.target.value,
                                machine_id: "",
                              })
                            )
                          }
                        >

                          <option value="">
                            All Lines
                          </option>

                          {filterHierarchyRows(
                            lines,
                            {
                              company_id:
                                reportFilters.company_id,
                            }
                          ).map(
                            (row) => (

                              <option
                                key={
                                  row.line_id
                                }
                                value={
                                  row.line_id
                                }
                              >
                                {entityLabel(
                                  row,
                                  "line_id",
                                  [
                                    "line_code"
                                  ],
                                  [
                                    "line_name"
                                  ]
                                )}
                              </option>

                            )
                          )}

                        </Form.Select>

                      </Form.Group>

                    </Col>


                    <Col md={4}>

                      <Form.Group>

                        <Form.Label>
                          Machine
                        </Form.Label>

                        <Form.Select
                          value={
                            reportFilters.machine_id
                          }
                          onChange={(event) =>
                            setReportFilters(
                              (previous) => ({
                                ...previous,
                                machine_id:
                                  event.target.value,
                              })
                            )
                          }
                        >

                          <option value="">
                            All Machines
                          </option>

                          {filterHierarchyRows(
                            machines,
                            {
                              company_id:
                                reportFilters.company_id,

                              line_id:
                                reportFilters.line_id,
                            }
                          ).map(
                            (row) => (

                              <option
                                key={
                                  row.machine_id
                                }
                                value={
                                  row.machine_id
                                }
                              >
                                {entityLabel(
                                  row,
                                  "machine_id",
                                  [
                                    "machine_code"
                                  ],
                                  [
                                    "machine_name"
                                  ]
                                )}
                              </option>

                            )
                          )}

                        </Form.Select>

                      </Form.Group>

                    </Col>


                    <Col md={4}>

                      <Form.Group>

                        <Form.Label>
                          Unit UUID
                        </Form.Label>

                        <Form.Control
                          value={
                            reportFilters.unit_id
                          }
                          onChange={(event) =>
                            setReportFilters(
                              (previous) => ({
                                ...previous,
                                unit_id:
                                  event.target.value,
                              })
                            )
                          }
                          placeholder="Optional"
                        />

                      </Form.Group>

                    </Col>


                    <Col md={4}>

                      <Form.Group>

                        <Form.Label>
                          From
                        </Form.Label>

                        <Form.Control
                          type="datetime-local"
                          value={
                            reportFilters.from_timestamp
                          }
                          onChange={(event) =>
                            setReportFilters(
                              (previous) => ({
                                ...previous,
                                from_timestamp:
                                  event.target.value,
                              })
                            )
                          }
                        />

                      </Form.Group>

                    </Col>


                    <Col md={4}>

                      <Form.Group>

                        <Form.Label>
                          To
                        </Form.Label>

                        <Form.Control
                          type="datetime-local"
                          value={
                            reportFilters.to_timestamp
                          }
                          onChange={(event) =>
                            setReportFilters(
                              (previous) => ({
                                ...previous,
                                to_timestamp:
                                  event.target.value,
                              })
                            )
                          }
                        />

                      </Form.Group>

                    </Col>


                    <Col
                      xs={12}
                      className="d-flex gap-2"
                    >

                      <Button
                        onClick={
                          generateReport
                        }
                        disabled={
                          busyAction ===
                          "report"
                        }
                      >
                        {busyAction ===
                        "report" ? (
                          <>
                            <Spinner
                              size="sm"
                              className="me-2"
                            />
                            Loading
                          </>
                        ) : (
                          "Generate Report"
                        )}
                      </Button>

                      <Button
                        variant="outline-success"
                        onClick={
                          exportReport
                        }
                        disabled={
                          busyAction ===
                          "export"
                        }
                      >
                        Export CSV
                      </Button>

                    </Col>

                  </Row>

                </Card.Body>

              </Card>


              {reportQuery.data && <ReportLens records={[...(Array.isArray(reportResponse.rejection_event)?reportResponse.rejection_event:[]),...(Array.isArray(reportResponse.rework_event)?reportResponse.rework_event:[]),...(Array.isArray(reportResponse.bypass_event)?reportResponse.bypass_event:[])]} title="Exception report explorer"/>}{reportQuery.data && (

                <>

                  <Row className="g-3 mb-3">

                    <Col md={3}>

                      <Card>

                        <Card.Body>

                          <div className="text-muted">
                            Rejections
                          </div>

                          <h4>
                            {reportMeta.rejection_events ??
                              reportResponse
                                ?.rejection_event
                                ?.length ??
                              0}
                          </h4>

                        </Card.Body>

                      </Card>

                    </Col>


                    <Col md={3}>

                      <Card>

                        <Card.Body>

                          <div className="text-muted">
                            Rework
                          </div>

                          <h4>
                            {reportMeta.rework_events ??
                              reportResponse
                                ?.rework_event
                                ?.length ??
                              0}
                          </h4>

                        </Card.Body>

                      </Card>

                    </Col>


                    <Col md={3}>

                      <Card>

                        <Card.Body>

                          <div className="text-muted">
                            Bypass
                          </div>

                          <h4>
                            {reportMeta.bypass_events ??
                              reportResponse
                                ?.bypass_event
                                ?.length ??
                              0}
                          </h4>

                        </Card.Body>

                      </Card>

                    </Col>


                    <Col md={3}>

                      <Card>

                        <Card.Body>

                          <div className="text-muted">
                            Rejected Qty
                          </div>

                          <h4>
                            {safeNumber(
                              reportMeta.total_rejected_qty
                            )}
                          </h4>

                        </Card.Body>

                      </Card>

                    </Col>

                  </Row>


                  <Alert variant="secondary">

                    Report generated from immutable
                    rejection, rework and bypass
                    execution evidence.

                  </Alert>

                </>

              )}

            </Tab>

          </Tabs>

        </Card.Body>

      </Card>


      {/* =====================================================
          REJECTION REASON MODAL
      ===================================================== */}

      <Modal
        className="rrb-modal"
        show={reasonModal.show}
        onHide={() =>
          setReasonModal({
            show: false,
            editId: null,
          })
        }
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>

            {reasonModal.editId
              ? "Edit Rejection Reason"
              : "Add Rejection Reason"}

          </Modal.Title>

        </Modal.Header>


        <Modal.Body>

          <Form>

            <Form.Group className="mb-3">

              <Form.Label>
                Company *
              </Form.Label>

              <Form.Select
                value={
                  rejectionReasonForm
                    .company_id
                }
                onChange={(event) =>
                  setRejectionReasonForm(
                    (previous) => ({
                      ...previous,
                      company_id:
                        event.target.value,
                    })
                  )
                }
              >

                <option value="">
                  Select Company
                </option>

                {companies.map(
                  (row) => (

                    <option
                      key={
                        row.company_id
                      }
                      value={
                        row.company_id
                      }
                    >
                      {entityLabel(
                        row,
                        "company_id",
                        [
                          "company_code"
                        ],
                        [
                          "company_name"
                        ]
                      )}
                    </option>

                  )
                )}

              </Form.Select>

            </Form.Group>


            <Row>

              <Col md={6}>

                <Form.Group className="mb-3">

                  <Form.Label>
                    Reason Code *
                  </Form.Label>

                  <Form.Control
                    value={
                      rejectionReasonForm
                        .reason_code
                    }
                    onChange={(event) =>
                      setRejectionReasonForm(
                        (previous) => ({
                          ...previous,
                          reason_code:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="e.g. TORQUE_NOK"
                  />

                </Form.Group>

              </Col>


              <Col md={6}>

                <Form.Group className="mb-3">

                  <Form.Label>
                    Category *
                  </Form.Label>

                  <Form.Select
                    value={
                      rejectionReasonForm
                        .category
                    }
                    onChange={(event) =>
                      setRejectionReasonForm(
                        (previous) => ({
                          ...previous,
                          category:
                            event.target.value,
                        })
                      )
                    }
                  >

                    {REJECTION_REASON_CATEGORIES
                      .map(
                        (item) => (

                          <option
                            key={
                              item.value
                            }
                            value={
                              item.value
                            }
                          >
                            {item.label}
                          </option>

                        )
                      )}

                  </Form.Select>

                </Form.Group>

              </Col>

            </Row>


            <Form.Group className="mb-3">

              <Form.Label>
                Reason Name *
              </Form.Label>

              <Form.Control
                value={
                  rejectionReasonForm
                    .reason_name
                }
                onChange={(event) =>
                  setRejectionReasonForm(
                    (previous) => ({
                      ...previous,
                      reason_name:
                        event.target.value,
                    })
                  )
                }
                placeholder="Torque Result NOK"
              />

            </Form.Group>


            <Row>

              <Col md={6}>

                <Form.Group className="mb-3">

                  <Form.Label>
                    Status
                  </Form.Label>

                  <Form.Select
                    value={
                      rejectionReasonForm
                        .status
                    }
                    onChange={(event) =>
                      setRejectionReasonForm(
                        (previous) => ({
                          ...previous,
                          status:
                            event.target.value,
                        })
                      )
                    }
                  >

                    {REJECTION_REASON_STATUS
                      .map(
                        (item) => (

                          <option
                            key={
                              item.value
                            }
                            value={
                              item.value
                            }
                          >
                            {item.label}
                          </option>

                        )
                      )}

                  </Form.Select>

                </Form.Group>

              </Col>


              <Col md={6}>

                <Form.Group className="mb-3">

                  <Form.Label>
                    Version
                  </Form.Label>

                  <Form.Control
                    type="number"
                    min="1"
                    value={
                      rejectionReasonForm
                        .version_no
                    }
                    onChange={(event) =>
                      setRejectionReasonForm(
                        (previous) => ({
                          ...previous,
                          version_no:
                            event.target.value,
                        })
                      )
                    }
                  />

                </Form.Group>

              </Col>

            </Row>

          </Form>

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setReasonModal({
                show: false,
                editId: null,
              })
            }
          >
            Cancel
          </Button>

          <Button
            onClick={
              saveRejectionReason
            }
            disabled={
              busyAction ===
              "reason-save"
            }
          >
            Save
          </Button>

        </Modal.Footer>

      </Modal>


      {/* =====================================================
          REWORK RULE MODAL
      ===================================================== */}

      <Modal
        className="rrb-modal"
        show={reworkRuleModal.show}
        onHide={() =>
          setReworkRuleModal({
            show: false,
            editId: null,
          })
        }
        size="lg"
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>

            {reworkRuleModal.editId
              ? "Edit Rework Rule"
              : "Add Rework Rule"}

          </Modal.Title>

        </Modal.Header>


        <Modal.Body>

          <Row className="g-3">

            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Company *
                </Form.Label>

                <Form.Select
                  value={
                    reworkRuleForm.company_id
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        company_id:
                          event.target.value,
                        plant_id: "",
                        line_id: "",
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Select Company
                  </option>

                  {companies.map(
                    (row) => (

                      <option
                        key={
                          row.company_id
                        }
                        value={
                          row.company_id
                        }
                      >
                        {entityLabel(
                          row,
                          "company_id",
                          [
                            "company_code"
                          ],
                          [
                            "company_name"
                          ]
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Plant
                </Form.Label>

                <Form.Select
                  value={
                    reworkRuleForm.plant_id
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        plant_id:
                          event.target.value,
                        line_id: "",
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Any Plant
                  </option>

                  {rulePlants.map(
                    (row) => (

                      <option
                        key={
                          row.plant_id
                        }
                        value={
                          row.plant_id
                        }
                      >
                        {entityLabel(
                          row,
                          "plant_id",
                          [
                            "plant_code",
                            "shop_code"
                          ],
                          [
                            "plant_name",
                            "shop_name"
                          ]
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Line
                </Form.Label>

                <Form.Select
                  value={
                    reworkRuleForm.line_id
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        line_id:
                          event.target.value,
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Any Line
                  </option>

                  {ruleLines.map(
                    (row) => (

                      <option
                        key={
                          row.line_id
                        }
                        value={
                          row.line_id
                        }
                      >
                        {entityLabel(
                          row,
                          "line_id",
                          [
                            "line_code"
                          ],
                          [
                            "line_name"
                          ]
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Machine
                </Form.Label>

                <Form.Select
                  value={
                    reworkRuleForm.machine_id
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        machine_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Any Machine
                  </option>

                  {ruleMachines.map(
                    (row) => (

                      <option
                        key={
                          row.machine_id
                        }
                        value={
                          row.machine_id
                        }
                      >
                        {entityLabel(
                          row,
                          "machine_id",
                          [
                            "machine_code"
                          ],
                          [
                            "machine_name"
                          ]
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Part
                </Form.Label>

                <Form.Select
                  value={
                    reworkRuleForm.part_id
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        part_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Any Part
                  </option>

                  {parts.map(
                    (row) => (

                      <option
                        key={
                          row.part_id
                        }
                        value={
                          row.part_id
                        }
                      >
                        {entityLabel(
                          row,
                          "part_id",
                          [
                            "part_code",
                            "part_no"
                          ],
                          [
                            "part_name"
                          ]
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Rejection Reason
                </Form.Label>

                <Form.Select
                  value={
                    reworkRuleForm
                      .rejection_reason_id
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        rejection_reason_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Any Reason
                  </option>

                  {rejectionReasons
                    .filter(
                      (row) =>
                        row.status ===
                          "ACTIVE" &&
                        (
                          !reworkRuleForm.company_id ||
                          sameId(
                            row.company_id,
                            reworkRuleForm.company_id
                          )
                        )
                    )
                    .map(
                      (row) => (

                        <option
                          key={
                            row.rejection_reason_id
                          }
                          value={
                            row.rejection_reason_id
                          }
                        >
                          {row.reason_code}
                          {" - "}
                          {row.reason_name}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  From Route Step
                </Form.Label>

                <Form.Select
                  value={
                    reworkRuleForm
                      .from_route_step_id
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        from_route_step_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Any From Step
                  </option>

                  {routeSteps.map(
                    (row) => (

                      <option
                        key={
                          row.route_step_id
                        }
                        value={
                          row.route_step_id
                        }
                      >
                        {entityLabel(
                          row,
                          "route_step_id",
                          [
                            "step_code",
                            "route_step_code"
                          ],
                          [
                            "step_name",
                            "route_step_name"
                          ]
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Rework Route Step *
                </Form.Label>

                <Form.Select
                  value={
                    reworkRuleForm
                      .rework_route_step_id
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        rework_route_step_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select Rework Step
                  </option>

                  {routeSteps.map(
                    (row) => (

                      <option
                        key={
                          row.route_step_id
                        }
                        value={
                          row.route_step_id
                        }
                      >
                        {entityLabel(
                          row,
                          "route_step_id",
                          [
                            "step_code",
                            "route_step_code"
                          ],
                          [
                            "step_name",
                            "route_step_name"
                          ]
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={4}>

              <Form.Group>

                <Form.Label>
                  Max Attempts
                </Form.Label>

                <Form.Control
                  type="number"
                  min="1"
                  value={
                    reworkRuleForm.max_attempts
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        max_attempts:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Blank = unlimited"
                />

              </Form.Group>

            </Col>


            <Col md={4}>

              <Form.Group>

                <Form.Label>
                  Version
                </Form.Label>

                <Form.Control
                  type="number"
                  min="1"
                  value={
                    reworkRuleForm.version_no
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        version_no:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col md={4}>

              <Form.Group className="mt-4">

                <Form.Check
                  type="switch"
                  label="Approval Required"
                  checked={
                    reworkRuleForm
                      .approval_required
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        approval_required:
                          event.target.checked,
                      })
                    )
                  }
                />

                <Form.Check
                  type="switch"
                  label="Active"
                  checked={
                    reworkRuleForm
                      .is_active
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        is_active:
                          event.target.checked,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col xs={12}>

              <Form.Group>

                <Form.Label>
                  Rule Expression
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={2}
                  value={
                    reworkRuleForm
                      .rule_expression
                  }
                  onChange={(event) =>
                    setReworkRuleForm(
                      (previous) => ({
                        ...previous,
                        rule_expression:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Optional configured business expression"
                />

              </Form.Group>

            </Col>

          </Row>

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setReworkRuleModal({
                show: false,
                editId: null,
              })
            }
          >
            Cancel
          </Button>

          <Button
            onClick={
              saveReworkRule
            }
            disabled={
              busyAction ===
              "rework-rule-save"
            }
          >
            Save
          </Button>

        </Modal.Footer>

      </Modal>


      {/* =====================================================
          BYPASS CONFIG MODAL
      ===================================================== */}

      <Modal
        className="rrb-modal"
        show={
          bypassConfigModal.show
        }
        onHide={() =>
          setBypassConfigModal({
            show: false,
            editId: null,
          })
        }
        size="lg"
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>

            {bypassConfigModal.editId
              ? "Edit Bypass Configuration"
              : "Add Bypass Configuration"}

          </Modal.Title>

        </Modal.Header>


        <Modal.Body>

          <Row className="g-3">

            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Company *
                </Form.Label>

                <Form.Select
                  value={
                    bypassConfigForm.company_id
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        company_id:
                          event.target.value,
                        plant_id: "",
                        line_id: "",
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Select Company
                  </option>

                  {companies.map(
                    (row) => (

                      <option
                        key={
                          row.company_id
                        }
                        value={
                          row.company_id
                        }
                      >
                        {companyName(
                          row.company_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Plant
                </Form.Label>

                <Form.Select
                  value={
                    bypassConfigForm.plant_id
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        plant_id:
                          event.target.value,
                        line_id: "",
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Any Plant
                  </option>

                  {bypassConfigPlants.map(
                    (row) => (

                      <option
                        key={
                          row.plant_id
                        }
                        value={
                          row.plant_id
                        }
                      >
                        {plantName(
                          row.plant_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Line
                </Form.Label>

                <Form.Select
                  value={
                    bypassConfigForm.line_id
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        line_id:
                          event.target.value,
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Any Line
                  </option>

                  {bypassConfigLines.map(
                    (row) => (

                      <option
                        key={
                          row.line_id
                        }
                        value={
                          row.line_id
                        }
                      >
                        {lineName(
                          row.line_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Machine
                </Form.Label>

                <Form.Select
                  value={
                    bypassConfigForm.machine_id
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        machine_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Any Machine
                  </option>

                  {bypassConfigMachines.map(
                    (row) => (

                      <option
                        key={
                          row.machine_id
                        }
                        value={
                          row.machine_id
                        }
                      >
                        {machineName(
                          row.machine_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Part
                </Form.Label>

                <Form.Select
                  value={
                    bypassConfigForm.part_id
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        part_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Any Part
                  </option>

                  {parts.map(
                    (row) => (

                      <option
                        key={
                          row.part_id
                        }
                        value={
                          row.part_id
                        }
                      >
                        {partName(
                          row.part_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Process
                </Form.Label>

                <Form.Select
                  value={
                    bypassConfigForm.process_id
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        process_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Any Process
                  </option>

                  {processes.map(
                    (row) => (

                      <option
                        key={
                          row.process_id
                        }
                        value={
                          row.process_id
                        }
                      >
                        {processName(
                          row.process_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Route Step
                </Form.Label>

                <Form.Select
                  value={
                    bypassConfigForm.route_step_id
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        route_step_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Any Route Step
                  </option>

                  {routeSteps.map(
                    (row) => (

                      <option
                        key={
                          row.route_step_id
                        }
                        value={
                          row.route_step_id
                        }
                      >
                        {routeStepName(
                          row.route_step_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Bypass Scope *
                </Form.Label>

                <Form.Control
                  value={
                    bypassConfigForm.bypass_scope
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        bypass_scope:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="e.g. PROCESS"
                />

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Max Duration Minutes
                </Form.Label>

                <Form.Control
                  type="number"
                  min="1"
                  value={
                    bypassConfigForm
                      .max_duration_minutes
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        max_duration_minutes:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Version
                </Form.Label>

                <Form.Control
                  type="number"
                  min="1"
                  value={
                    bypassConfigForm.version_no
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        version_no:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col md={4}>

              <Form.Check
                type="switch"
                label="Reason Required"
                checked={
                  bypassConfigForm
                    .reason_required
                }
                onChange={(event) =>
                  setBypassConfigForm(
                    (previous) => ({
                      ...previous,
                      reason_required:
                        event.target.checked,
                    })
                  )
                }
              />

            </Col>


            <Col md={4}>

              <Form.Check
                type="switch"
                label="Approval Required"
                checked={
                  bypassConfigForm
                    .approval_required
                }
                onChange={(event) =>
                  setBypassConfigForm(
                    (previous) => ({
                      ...previous,
                      approval_required:
                        event.target.checked,
                    })
                  )
                }
              />

            </Col>


            <Col md={4}>

              <Form.Check
                type="switch"
                label="Active"
                checked={
                  bypassConfigForm
                    .is_active
                }
                onChange={(event) =>
                  setBypassConfigForm(
                    (previous) => ({
                      ...previous,
                      is_active:
                        event.target.checked,
                    })
                  )
                }
              />

            </Col>


            <Col xs={12}>

              <Form.Group>

                <Form.Label>
                  Rule Expression
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={2}
                  value={
                    bypassConfigForm
                      .rule_expression
                  }
                  onChange={(event) =>
                    setBypassConfigForm(
                      (previous) => ({
                        ...previous,
                        rule_expression:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Optional"
                />

              </Form.Group>

            </Col>

          </Row>

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setBypassConfigModal({
                show: false,
                editId: null,
              })
            }
          >
            Cancel
          </Button>

          <Button
            onClick={
              saveBypassConfig
            }
            disabled={
              busyAction ===
              "bypass-config-save"
            }
          >
            Save
          </Button>

        </Modal.Footer>

      </Modal>


      {/* =====================================================
          RECORD REJECTION MODAL
      ===================================================== */}

      <Modal
        className="rrb-modal"
        show={rejectionModal}
        onHide={() =>
          setRejectionModal(false)
        }
        size="lg"
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>
            Record Rejection
          </Modal.Title>

        </Modal.Header>


        <Modal.Body>

          <Alert variant="warning">

            This creates permanent rejection evidence.
            Later rework will create a separate event and
            will not modify this rejection.

          </Alert>


          <Row className="g-3">

            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Company *
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm.company_id
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        company_id:
                          event.target.value,
                        plant_id: "",
                        line_id: "",
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Select Company
                  </option>

                  {companies.map(
                    (row) => (

                      <option
                        key={
                          row.company_id
                        }
                        value={
                          row.company_id
                        }
                      >
                        {companyName(
                          row.company_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Plant *
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm.plant_id
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        plant_id:
                          event.target.value,
                        line_id: "",
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Select Plant
                  </option>

                  {rejectionPlants.map(
                    (row) => (

                      <option
                        key={
                          row.plant_id
                        }
                        value={
                          row.plant_id
                        }
                      >
                        {plantName(
                          row.plant_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Line *
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm.line_id
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        line_id:
                          event.target.value,
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Select Line
                  </option>

                  {rejectionLines.map(
                    (row) => (

                      <option
                        key={
                          row.line_id
                        }
                        value={
                          row.line_id
                        }
                      >
                        {lineName(
                          row.line_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Production Plan *
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm.plan_id
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        plan_id:
                          event.target.value,
                        plan_entry_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Select Production Plan
                  </option>

                  {productionPlans.map(
                    (row) => (

                      <option
                        key={
                          row.plan_id
                        }
                        value={
                          row.plan_id
                        }
                      >
                        {entityLabel(
                          row,
                          "plan_id",
                          [
                            "plan_code",
                            "plan_no"
                          ],
                          [
                            "plan_name"
                          ]
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col xs={12}>

              <Form.Group>

                <Form.Label>
                  Plan Entry *
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm.plan_entry_id
                  }
                  disabled={
                    !rejectionForm.plan_id
                  }
                  onChange={(event) =>
                    onRejectionPlanEntryChange(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Select Plan Entry
                  </option>

                  {rejectionPlanEntries.map(
                    (entry) => (

                      <option
                        key={
                          entry.plan_entry_id
                        }
                        value={
                          entry.plan_entry_id
                        }
                      >
                        Seq {entry.sequence_no}
                        {" | "}
                        {machineName(
                          entry.machine_id
                        )}
                        {" | "}
                        {partName(
                          entry.part_id
                        )}
                        {" | "}
                        {processName(
                          entry.process_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Machine *
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm.machine_id
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        machine_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select Machine
                  </option>

                  {rejectionMachines.map(
                    (row) => (

                      <option
                        key={
                          row.machine_id
                        }
                        value={
                          row.machine_id
                        }
                      >
                        {machineName(
                          row.machine_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Shift *
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm.shift_id
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        shift_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select Shift
                  </option>

                  {shifts.map(
                    (row) => (

                      <option
                        key={
                          row.shift_id
                        }
                        value={
                          row.shift_id
                        }
                      >
                        {shiftName(
                          row.shift_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Part *
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm.part_id
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        part_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select Part
                  </option>

                  {parts.map(
                    (row) => (

                      <option
                        key={
                          row.part_id
                        }
                        value={
                          row.part_id
                        }
                      >
                        {partName(
                          row.part_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Process *
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm.process_id
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        process_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select Process
                  </option>

                  {processes.map(
                    (row) => (

                      <option
                        key={
                          row.process_id
                        }
                        value={
                          row.process_id
                        }
                      >
                        {processName(
                          row.process_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={9}>

              <Form.Group>

                <Form.Label>
                  Unit UUID
                </Form.Label>

                <Form.Control
                  value={
                    rejectionForm.unit_id
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        unit_id:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Serialized Unit UUID"
                />

              </Form.Group>

            </Col>


            <Col
              md={3}
              className="d-flex align-items-end"
            >

              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() =>
                  setRejectionForm(
                    (previous) => ({
                      ...previous,
                      unit_id:
                        generateUuid(),
                    })
                  )
                }
              >
                Test UUID
              </Button>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Rejection Reason *
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm
                      .rejection_reason_id
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        rejection_reason_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select Reason
                  </option>

                  {rejectionReasons
                    .filter(
                      (row) =>
                        row.status ===
                          "ACTIVE" &&
                        (
                          !rejectionForm.company_id ||
                          sameId(
                            row.company_id,
                            rejectionForm.company_id
                          )
                        )
                    )
                    .map(
                      (row) => (

                        <option
                          key={
                            row.rejection_reason_id
                          }
                          value={
                            row.rejection_reason_id
                          }
                        >
                          {row.reason_code}
                          {" - "}
                          {row.reason_name}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={3}>

              <Form.Group>

                <Form.Label>
                  Qty
                </Form.Label>

                <Form.Control
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={
                    rejectionForm.qty
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        qty:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col md={3}>

              <Form.Group>

                <Form.Label>
                  Result
                </Form.Label>

                <Form.Select
                  value={
                    rejectionForm
                      .result_status
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        result_status:
                          event.target.value,
                      })
                    )
                  }
                >

                  {REJECTION_RESULT_STATUS
                    .map(
                      (item) => (

                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {item.label}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Barcode
                </Form.Label>

                <Form.Control
                  value={
                    rejectionForm.barcode_value
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        barcode_value:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Idempotency Key
                </Form.Label>

                <Form.Control
                  value={
                    rejectionForm
                      .idempotency_key
                  }
                  onChange={(event) =>
                    setRejectionForm(
                      (previous) => ({
                        ...previous,
                        idempotency_key:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>

          </Row>

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setRejectionModal(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={
              saveRejectionEvent
            }
            disabled={
              busyAction ===
              "rejection-event-save"
            }
          >
            Record Rejection
          </Button>

        </Modal.Footer>

      </Modal>


      {/* =====================================================
          EXECUTE REWORK MODAL
      ===================================================== */}

      <Modal
        className="rrb-modal"
        show={reworkModal}
        onHide={() =>
          setReworkModal(false)
        }
        size="lg"
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>
            Start Rework
          </Modal.Title>

        </Modal.Header>


        <Modal.Body>

          <Alert variant="info">

            The original rejection stays unchanged.
            This action creates a new rework_event and redirects
            the tracked unit to the configured rework route step.

          </Alert>


          <Row className="g-3">

            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Company *
                </Form.Label>

                <Form.Select
                  value={
                    reworkForm.company_id
                  }
                  onChange={(event) =>
                    setReworkForm(
                      (previous) => ({
                        ...previous,
                        company_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select Company
                  </option>

                  {companies.map(
                    (row) => (

                      <option
                        key={
                          row.company_id
                        }
                        value={
                          row.company_id
                        }
                      >
                        {companyName(
                          row.company_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Unit UUID *
                </Form.Label>

                <div className="d-flex gap-2">

                  <Form.Control
                    value={
                      reworkForm.unit_id
                    }
                    onChange={(event) =>
                      setReworkForm(
                        (previous) => ({
                          ...previous,
                          unit_id:
                            event.target.value,
                        })
                      )
                    }
                  />

                  <Button
                    variant="outline-secondary"
                    onClick={() =>
                      setReworkForm(
                        (previous) => ({
                          ...previous,
                          unit_id:
                            generateUuid(),
                        })
                      )
                    }
                  >
                    UUID
                  </Button>

                </div>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Original Rejection Event
                </Form.Label>

                <Form.Select
                  value={
                    reworkForm
                      .rejection_event_id
                  }
                  onChange={(event) => {

                    const id =
                      event.target.value;

                    const rejection =
                      rejectionEvents.find(
                        (row) =>
                          sameId(
                            row.rejection_id,
                            id
                          )
                      );

                    setReworkForm(
                      (previous) => ({
                        ...previous,

                        rejection_event_id:
                          id,

                        company_id:
                          rejection?.company_id ||
                          previous.company_id,

                        unit_id:
                          rejection?.unit_id ||
                          previous.unit_id,
                      })
                    );
                  }}
                >

                  <option value="">
                    Select Rejection Event
                  </option>

                  {rejectionEvents
                    .filter(
                      (row) =>
                        row.unit_id
                    )
                    .map(
                      (row) => (

                        <option
                          key={
                            row.rejection_id
                          }
                          value={
                            row.rejection_id
                          }
                        >
                          {shortId(
                            row.rejection_id
                          )}
                          {" | Unit "}
                          {shortId(
                            row.unit_id
                          )}
                          {" | "}
                          {row.result_status}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Rework Rule
                </Form.Label>

                <Form.Select
                  value={
                    reworkForm
                      .rework_rule_config_id
                  }
                  onChange={(event) =>
                    setReworkForm(
                      (previous) => ({
                        ...previous,
                        rework_rule_config_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Auto Resolve Rule
                  </option>

                  {reworkRules
                    .filter(
                      (row) =>
                        row.is_active &&
                        (
                          !reworkForm.company_id ||
                          sameId(
                            row.company_id,
                            reworkForm.company_id
                          )
                        )
                    )
                    .map(
                      (row) => (

                        <option
                          key={
                            row.rework_rule_config_id
                          }
                          value={
                            row.rework_rule_config_id
                          }
                        >
                          {routeStepName(
                            row.from_route_step_id
                          )}
                          {" → "}
                          {routeStepName(
                            row.rework_route_step_id
                          )}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={4}>

              <Form.Group>

                <Form.Label>
                  Event Type
                </Form.Label>

                <Form.Select
                  value={
                    reworkForm.event_type
                  }
                  onChange={(event) =>
                    setReworkForm(
                      (previous) => ({
                        ...previous,
                        event_type:
                          event.target.value,
                      })
                    )
                  }
                >

                  {REWORK_EVENT_TYPES
                    .map(
                      (item) => (

                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {item.label}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={4}>

              <Form.Group>

                <Form.Label>
                  Result Status
                </Form.Label>

                <Form.Select
                  value={
                    reworkForm.result_status
                  }
                  onChange={(event) =>
                    setReworkForm(
                      (previous) => ({
                        ...previous,
                        result_status:
                          event.target.value,
                      })
                    )
                  }
                >

                  {REWORK_RESULT_STATUS
                    .map(
                      (item) => (

                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {item.label}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={4}>

              <Form.Group>

                <Form.Label>
                  Position Status
                </Form.Label>

                <Form.Select
                  value={
                    reworkForm.position_status
                  }
                  onChange={(event) =>
                    setReworkForm(
                      (previous) => ({
                        ...previous,
                        position_status:
                          event.target.value,
                      })
                    )
                  }
                >

                  {REWORK_POSITION_STATUS
                    .map(
                      (item) => (

                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {item.label}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={4}>

              <Form.Group>

                <Form.Label>
                  Attempt No
                </Form.Label>

                <Form.Control
                  type="number"
                  min="1"
                  value={
                    reworkForm.attempt_no
                  }
                  onChange={(event) =>
                    setReworkForm(
                      (previous) => ({
                        ...previous,
                        attempt_no:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Auto"
                />

              </Form.Group>

            </Col>


            <Col md={4}>

              <Form.Group>

                <Form.Label>
                  User ID
                </Form.Label>

                <Form.Control
                  type="number"
                  min="1"
                  value={
                    reworkForm.user_id
                  }
                  onChange={(event) =>
                    setReworkForm(
                      (previous) => ({
                        ...previous,
                        user_id:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Optional"
                />

              </Form.Group>

            </Col>


            <Col md={4}>

              <Form.Group className="pt-4">

                <Form.Check
                  type="switch"
                  label="Approval Granted"
                  checked={
                    reworkForm
                      .approval_granted
                  }
                  onChange={(event) =>
                    setReworkForm(
                      (previous) => ({
                        ...previous,
                        approval_granted:
                          event.target.checked,
                      })
                    )
                  }
                />

                <Form.Check
                  type="switch"
                  label="Rule Expression Passed"
                  checked={
                    reworkForm
                      .rule_expression_result
                  }
                  onChange={(event) =>
                    setReworkForm(
                      (previous) => ({
                        ...previous,
                        rule_expression_result:
                          event.target.checked,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col xs={12}>

              <Form.Group>

                <Form.Label>
                  Idempotency Key
                </Form.Label>

                <Form.Control
                  value={
                    reworkForm
                      .idempotency_key
                  }
                  onChange={(event) =>
                    setReworkForm(
                      (previous) => ({
                        ...previous,
                        idempotency_key:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>

          </Row>

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setReworkModal(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="warning"
            onClick={executeRework}
            disabled={
              busyAction ===
              "rework-execute"
            }
          >
            Start Rework
          </Button>

        </Modal.Footer>

      </Modal>


      {/* =====================================================
          BYPASS EVENT MODAL
      ===================================================== */}

      <Modal
        className="rrb-modal"
        show={bypassModal}
        onHide={() =>
          setBypassModal(false)
        }
        size="lg"
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>
            Bypass Lifecycle Event
          </Modal.Title>

        </Modal.Header>


        <Modal.Body>

          <Alert variant="info">

            Every lifecycle action creates a new
            bypass_event. Existing NOK or rejection evidence
            is never rewritten.

          </Alert>


          <Row className="g-3">

            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Company *
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm.company_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        company_id:
                          event.target.value,
                        plant_id: "",
                        line_id: "",
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Select Company
                  </option>

                  {companies.map(
                    (row) => (

                      <option
                        key={
                          row.company_id
                        }
                        value={
                          row.company_id
                        }
                      >
                        {companyName(
                          row.company_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Plant *
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm.plant_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        plant_id:
                          event.target.value,
                        line_id: "",
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Select Plant
                  </option>

                  {bypassRuntimePlants.map(
                    (row) => (

                      <option
                        key={
                          row.plant_id
                        }
                        value={
                          row.plant_id
                        }
                      >
                        {plantName(
                          row.plant_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Line *
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm.line_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        line_id:
                          event.target.value,
                        machine_id: "",
                      })
                    )
                  }
                >

                  <option value="">
                    Select Line
                  </option>

                  {bypassRuntimeLines.map(
                    (row) => (

                      <option
                        key={
                          row.line_id
                        }
                        value={
                          row.line_id
                        }
                      >
                        {lineName(
                          row.line_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Machine *
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm.machine_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        machine_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select Machine
                  </option>

                  {bypassRuntimeMachines.map(
                    (row) => (

                      <option
                        key={
                          row.machine_id
                        }
                        value={
                          row.machine_id
                        }
                      >
                        {machineName(
                          row.machine_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Shift *
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm.shift_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        shift_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select Shift
                  </option>

                  {shifts.map(
                    (row) => (

                      <option
                        key={
                          row.shift_id
                        }
                        value={
                          row.shift_id
                        }
                      >
                        {shiftName(
                          row.shift_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Bypass Config
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm
                      .bypass_config_id
                  }
                  onChange={(event) => {

                    const id =
                      event.target.value;

                    const config =
                      bypassConfigs.find(
                        (row) =>
                          sameId(
                            row.bypass_config_id,
                            id
                          )
                      );

                    setBypassForm(
                      (previous) => ({
                        ...previous,

                        bypass_config_id:
                          id,

                        bypass_scope:
                          config?.bypass_scope ||
                          previous.bypass_scope,
                      })
                    );
                  }}
                >

                  <option value="">
                    Auto Resolve Config
                  </option>

                  {bypassConfigs
                    .filter(
                      (row) =>
                        row.is_active
                    )
                    .map(
                      (row) => (

                        <option
                          key={
                            row.bypass_config_id
                          }
                          value={
                            row.bypass_config_id
                          }
                        >
                          {row.bypass_scope}
                          {" | "}
                          {row.route_step_id
                            ? routeStepName(
                                row.route_step_id
                              )
                            : "Any Step"}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={9}>

              <Form.Group>

                <Form.Label>
                  Unit UUID
                </Form.Label>

                <Form.Control
                  value={
                    bypassForm.unit_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        unit_id:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col
              md={3}
              className="d-flex align-items-end"
            >

              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() =>
                  setBypassForm(
                    (previous) => ({
                      ...previous,
                      unit_id:
                        generateUuid(),
                    })
                  )
                }
              >
                Test UUID
              </Button>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Part
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm.part_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        part_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select / Optional
                  </option>

                  {parts.map(
                    (row) => (

                      <option
                        key={
                          row.part_id
                        }
                        value={
                          row.part_id
                        }
                      >
                        {partName(
                          row.part_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Process
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm.process_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        process_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Select / Optional
                  </option>

                  {processes.map(
                    (row) => (

                      <option
                        key={
                          row.process_id
                        }
                        value={
                          row.process_id
                        }
                      >
                        {processName(
                          row.process_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Route Step
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm.route_step_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        route_step_id:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="">
                    Optional
                  </option>

                  {routeSteps.map(
                    (row) => (

                      <option
                        key={
                          row.route_step_id
                        }
                        value={
                          row.route_step_id
                        }
                      >
                        {routeStepName(
                          row.route_step_id
                        )}
                      </option>

                    )
                  )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Bypass Scope
                </Form.Label>

                <Form.Control
                  value={
                    bypassForm.bypass_scope
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        bypass_scope:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Event Type *
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm.event_type
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        event_type:
                          event.target.value,

                        result_status:
                          event.target.value ===
                          "ACTIVATED"
                            ? "ACTIVE"
                            : previous.result_status,
                      })
                    )
                  }
                >

                  {BYPASS_EVENT_TYPES
                    .map(
                      (item) => (

                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {item.label}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Result Status
                </Form.Label>

                <Form.Select
                  value={
                    bypassForm.result_status
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        result_status:
                          event.target.value,
                      })
                    )
                  }
                >

                  {BYPASS_RESULT_STATUS
                    .map(
                      (item) => (

                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {item.label}
                        </option>

                      )
                    )}

                </Form.Select>

              </Form.Group>

            </Col>


            <Col xs={12}>

              <Form.Group>

                <Form.Label>
                  Reason
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={2}
                  value={
                    bypassForm.reason
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        reason:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Requested By User ID
                </Form.Label>

                <Form.Control
                  type="number"
                  min="1"
                  value={
                    bypassForm
                      .requested_by_user_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        requested_by_user_id:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Approved By User ID
                </Form.Label>

                <Form.Control
                  type="number"
                  min="1"
                  value={
                    bypassForm
                      .approved_by_user_id
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        approved_by_user_id:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>


            <Col md={6}>

              <Form.Check
                type="switch"
                label="Rule Expression Passed"
                checked={
                  bypassForm
                    .rule_expression_result
                }
                onChange={(event) =>
                  setBypassForm(
                    (previous) => ({
                      ...previous,
                      rule_expression_result:
                        event.target.checked,
                    })
                  )
                }
              />

            </Col>


            <Col md={6}>

              <Form.Group>

                <Form.Label>
                  Idempotency Key
                </Form.Label>

                <Form.Control
                  value={
                    bypassForm
                      .idempotency_key
                  }
                  onChange={(event) =>
                    setBypassForm(
                      (previous) => ({
                        ...previous,
                        idempotency_key:
                          event.target.value,
                      })
                    )
                  }
                />

              </Form.Group>

            </Col>

          </Row>

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setBypassModal(false)
            }
          >
            Cancel
          </Button>

          <Button
            onClick={
              executeBypass
            }
            disabled={
              busyAction ===
              "bypass-execute"
            }
          >
            Save Bypass Event
          </Button>

        </Modal.Footer>

      </Modal>


      {/* =====================================================
          INITIAL LOADING OVERLAY
      ===================================================== */}

      {(
        masterQuery.isLoading ||
        runtimeQuery.isLoading
      ) && (

        <div className="text-center py-3">

          <Spinner
            animation="border"
            size="sm"
            className="me-2"
          />

          Loading Rework / Reject / Bypass...

        </div>

      )}

    </Container>
</>
  );
};


// ============================================================
// EXPORT
// ============================================================

export default ReworkRejectBypass;
