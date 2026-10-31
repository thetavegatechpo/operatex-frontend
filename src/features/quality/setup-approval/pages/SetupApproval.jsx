
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

import {
  Activity,
  ClipboardCheck,
  ClipboardList,
  FileBarChart2,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import apiClient from "../../../../shared/api/client.js";
import { setupApprovalService as api } from
  "../api/setupApproval.service.js";
import machineService from "../../../master-data/machine-master/api/machine.service.js";
import partService from "../../../master-data/part-master/api/part.service.js";
import processService from "../../../master-data/process-master/api/process.service.js";
import "./SetupApproval.css";
const allTabs = [
  ["dashboard", "Overview & Reports", Activity, "view"],
  ["rules", "Setup Rules", Settings2, "config"],
  ["templates", "Checkpoints", ClipboardList, "config"],
  ["workflows", "Workflows", Workflow, "config"],
  ["execution", "Setup Execution", ClipboardCheck, "execute"],
  ["approvals", "Approvals", ShieldCheck, "approve"],
];



const rows = (value) =>
  Array.isArray(value) ? value :
  Array.isArray(value?.rows) ? value.rows : [];

const messageOf = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Request failed";

const show = (value) =>
  value === null || value === undefined || value === ""
    ? "—"
    : String(value);

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "—";

const newKey = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const toISO = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Please select a valid date and time");
  }

  return date.toISOString();
};

// Display a timestamp in the user's local time
const toLocalDateTime = (value = new Date()) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
};

const initialRule = {
  rule_code: "",
  machine_id: "",
  part_id: "",
  process_id: "",
  activity_template_id: "",
  approval_workflow_config_id: "",
  version_no: 1,
  is_active: true,
  effective_from: toLocalDateTime(),
  effective_to: "",
};

const initialWorkflow = {
  workflow_code: "",
  workflow_name: "",
  version_no: 1,
  is_active: false,
  effective_from: toLocalDateTime(),
  effective_to: "",
  steps: [{
    step_no: 1,
    role_id: "",
    required_role: "",
    allow_self_approval: false,
  }],
};

const initialTemplate = {
  template_code: "",
  template_name: "",
  activity_type: "SETUP",
  version_no: 1,
  is_active: false,
  effective_from: toLocalDateTime(),
  effective_to: "",
};

const initialStep = {
  step_no: 1,
  check_point: "",
  specification: "",
  checking_method: "",
  value_type: "BOOLEAN",
  expected_boolean: true,
  lower_limit: "",
  upper_limit: "",
  unit: "",
  is_mandatory: true,
  action_after_abnormality: "",
};

function Field({ label, children }) {
  return (
    <label className="sa-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}) {
  return (
    <Field
      label={
        <>
          {label}
          {required && <span className="sa-required"> *</span>}
        </>
      }
    >
      <input
        type={type}
        value={value ?? ""}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function Select({
  label,
  value,
  onChange,
  required = false,
  children,
}) {
  return (
    <Field
      label={
        <>
          {label}
          {required && <span className="sa-required"> *</span>}
        </>
      }
    >
      <select
        value={value ?? ""}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </Field>
  );
}

function Check({ label, value, onChange }) {
  return (
    <label className="sa-check">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
function DateFields({ form, setForm }) {
  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <>
      <Field label="Effective From *">
        <input
          type="datetime-local"
          required
          step="60"
          value={form.effective_from || ""}
          onChange={(event) =>
            updateField("effective_from", event.target.value)
          }
        />
      </Field>

      <Field label="Effective To (Optional)">
        <input
          type="datetime-local"
          step="60"
          value={form.effective_to || ""}
          onChange={(event) =>
            updateField("effective_to", event.target.value)
          }
        />
      </Field>
    </>
  );
}

function Panel({ title, children }) {
  return (
    <section className="sa-panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function SetupApproval() {
  const [tab, setTab] = useState("dashboard");
  const [runtime, setRuntime] = useState([]);
  const [reports, setReports] = useState([]);
  const [rules, setRules] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [options, setOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [rule, setRule] = useState(initialRule);
  const [editingRule, setEditingRule] = useState(null);

  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [template, setTemplate] = useState(initialTemplate);
  const [templateId, setTemplateId] = useState("");
  const [newTemplates, setNewTemplates] = useState([]);
  const [steps, setSteps] = useState([]);
  const [step, setStep] = useState(initialStep);
  const [editingStep, setEditingStep] = useState(null);

  const [selectedSetup, setSelectedSetup] = useState("");
  const [activityId, setActivityId] = useState("");
  const [answers, setAnswers] = useState({});
  const [inspectionSteps, setInspectionSteps] = useState([]);
  const [executionKey, setExecutionKey] = useState(newKey);
  const [approvalKey, setApprovalKey] = useState(newKey);

  const [selectedApproval, setSelectedApproval] = useState(null);
  const [decision, setDecision] = useState("APPROVED");
  const [remarks, setRemarks] = useState("");
  const [filter, setFilter] = useState("ALL");
   // Real master records from OperateX backend
const [machines, setMachines] = useState([]);
const [parts, setParts] = useState([]);
const [processes, setProcesses] = useState([]);
const [masterLoading, setMasterLoading] = useState(true);
const [masterError, setMasterError] = useState("");
const ruleFormRef = useRef(null);


const [userPermissions, setUserPermissions] = useState([]);
const [permissionsLoading, setPermissionsLoading] = useState(true);
const [permissionsError, setPermissionsError] = useState("");

const can = (permission) =>
  userPermissions.includes(`setup_approval:${permission}`);
const visibleTabs = allTabs.filter(
  ([, , , permission]) =>
    can(permission) ||
    (permission === "view" && can("report"))
);
useEffect(() => {
  let active = true;

  async function loadPermissions() {
    setPermissionsLoading(true);
    setPermissionsError("");

    try {
      // Use the same authenticated Axios instance
      // as your existing Setup Approval service.
     const response = await apiClient.get(
  "/setup-approval/my-permissions"
);

      const body = response.data;

      if (
        body.success !== true ||
        !Array.isArray(body.data?.permissions)
      ) {
        throw new Error("Invalid permissions response");
      }

      if (active) {
        setUserPermissions(body.data.permissions);
      }
    } catch (error) {
      if (active) {
        setUserPermissions([]);
        setPermissionsError(
          error.response?.data?.message ||
          error.message ||
          "Unable to load permissions"
        );
      }
    } finally {
      if (active) setPermissionsLoading(false);
    }
  }

  loadPermissions();

  return () => {
    active = false;
  };
}, []);

// Handle existing API response formats
const extractMasterRows = (response) => {
  const body = response?.data ?? response;

  if (body?.success === false) {
    throw new Error(body.message || "Unable to load master records");
  }

  const records =
    Array.isArray(body) ? body :
    Array.isArray(body?.data) ? body.data :
    Array.isArray(body?.data?.rows) ? body.data.rows :
    Array.isArray(body?.rows) ? body.rows :
    null;

  if (!records) {
    throw new Error("Unexpected master API response");
  }

  return records;
};
useEffect(() => {
  if (permissionsLoading || permissionsError) return;

  if (
    !visibleTabs.some(([key]) => key === tab)
  ) {
    setTab(visibleTabs[0]?.[0] ?? null);
  }
}, [permissionsLoading, permissionsError, userPermissions, tab]);
// Load existing machine, part and process masters

useEffect(() => {
  if (permissionsLoading) return;

  if (!can("config")) {
    setMachines([]);
    setParts([]);
    setProcesses([]);
    setMasterError("");
    setMasterLoading(false);
    return;
  }

  let active = true;

  const loadMasters = async () => {
    setMasterLoading(true);
    setMasterError("");

    const results = await Promise.allSettled([
      machineService.getMaster(),
      partService.getMaster(),
      processService.getMaster(),
    ]);

    if (!active) return;

    const setters = [
      setMachines,
      setParts,
      setProcesses,
    ];

    const names = [
      "Machines",
      "Parts",
      "Processes",
    ];

    const failures = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        try {
          setters[index](extractMasterRows(result.value));
        } catch (error) {
          setters[index]([]);
          failures.push(`${names[index]}: ${messageOf(error)}`);
        }
      } else {
        setters[index]([]);
        const status = result.reason?.response?.status;

        // Optional master data is not accessible to this user.
        if (status !== 403) {
          failures.push(
            `${names[index]}: ${messageOf(result.reason)}`
          );
        }
      }
    });

    setMasterError(failures.join(" | "));
    setMasterLoading(false);
  };

  loadMasters();

  return () => {
    active = false;
  };
}, [permissionsLoading, userPermissions]);


  const getMachineName = (id) => {
  const machine = machines.find(
    (item) => String(item.machine_id) === String(id)
  );

  return machine?.machine_name ||
    machine?.machine_code ||
    "Machine name unavailable";
};

const getPartName = (id) => {
  if (!id) return "All Parts";

  const part = parts.find(
    (item) => String(item.part_id) === String(id)
  );

  return part?.part_name ||
    part?.part_code ||
    "Part name unavailable";
};

const getProcessName = (id) => {
  if (!id) return "All Processes";

  const process = processes.find(
    (item) => String(item.process_id) === String(id)
  );

  return process?.process_name ||
    process?.process_code ||
    "Process name unavailable";
};
 
const refresh = useCallback(async () => {
  if (permissionsLoading || permissionsError) return;

  setLoading(true);
  setError("");

  const allowed = (code) =>
    userPermissions.includes(`setup_approval:${code}`);

  const requests = [];

  if (allowed("view")) {
    requests.push(["runtime", api.runtime, setRuntime]);
  }

  if (allowed("report")) {
    requests.push(["reports", api.report, setReports]);
  }

  if (allowed("view") || allowed("config")) {
    requests.push(["rules", api.config, setRules]);
    requests.push(["workflows", api.workflows, setWorkflows]);
  }

  if (allowed("execute") && allowed("view")) {
    requests.push([
      "options",
      api.selectionOptions,
      setOptions,
    ]);
  }

  const results = await Promise.allSettled(
    requests.map(([, fetch]) => fetch())
  );

  const failures = [];

  results.forEach((result, index) => {
    const [name, , setter] = requests[index];

    if (result.status === "fulfilled") {
      setter(rows(result.value));
    } else {
      setter([]);

      if (result.reason?.response?.status !== 403) {
        failures.push(
          `${name}: ${messageOf(result.reason)}`
        );
      }
    }
  });

  if (failures.length) {
    setError(failures.join(" | "));
  }

  setLoading(false);
}, [
  permissionsLoading,
  permissionsError,
  userPermissions,
]);

useEffect(() => {
  refresh();
}, [refresh]);


  const run = async (fn, success) => {
    if (busy) return null;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await fn();
      setNotice(success);
      return result;
    } catch (e) {
      setError(messageOf(e));
      return null;
    } finally {
      setBusy(false);
    }
  };

  // Names come only from backend records; identifiers are used internally.
  const templateChoices = useMemo(() => {
    const map = new Map();
    for (const r of rules) {
      if (r.activity_template_id && (r.template_name || r.template_code)) {
        map.set(String(r.activity_template_id), {
          id: String(r.activity_template_id),
          name: r.template_name || r.template_code,
        });
      }
    }
    for (const t of newTemplates) {
      if (t.activity_template_id) {
        map.set(String(t.activity_template_id), {
          id: String(t.activity_template_id),
          name: t.template_name || t.template_code,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rules, newTemplates]);

  // The currently exposed workflow data is not a complete role master.
  // Reuse roles already returned by backend workflows; never invent role IDs.
  const roleChoices = useMemo(() => {
    const map = new Map();
    for (const w of workflows) {
      const stages = Array.isArray(w.steps) ? w.steps : [];
      for (const stage of stages) {
        if (Number.isSafeInteger(Number(stage.role_id)) &&
            Number(stage.role_id) > 0 &&
            typeof stage.required_role === "string" &&
            stage.required_role.trim()) {
          map.set(String(stage.role_id), {
            id: String(stage.role_id),
            name: stage.required_role.trim(),
          });
        }
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [workflows]);

  const namedSetup = (record) => {
    if (!record) return "Setup unavailable";
    const machine = record.machine_name || getMachineName(record.machine_id);
    const part = record.part_name || getPartName(record.to_part_id || record.part_id);
    const ruleName = record.rule_code || rules.find(
      r => String(r.setup_rule_config_id) === String(record.setup_rule_config_id)
    )?.rule_code;
    return [machine, part, ruleName].filter(
      x => x && !String(x).includes("unavailable")
    ).join(" / ") || "Setup details unavailable";
  };

  const selectedOption = useMemo(
    () => options.find((o) =>
      `${o.setup_execution_id}:${o.setup_rule_config_id}` ===
      selectedSetup
    ),
    [options, selectedSetup]
  );

  const stats = useMemo(() => ({
    total: runtime.length,
    pending: runtime.filter((r) => r.decision === "PENDING").length,
    approved: runtime.filter((r) => r.decision === "APPROVED").length,
    rejected: runtime.filter((r) => r.decision === "REJECTED").length,
  }), [runtime]);

  const saveRule = async (event) => {
    event.preventDefault();

    const payload = {
      ...rule,
      part_id: rule.part_id || null,
      process_id: rule.process_id || null,
      version_no: Number(rule.version_no),
      effective_from: toISO(rule.effective_from),
      effective_to: toISO(rule.effective_to),
    };

    const result = await run(
      () => editingRule
        ? api.updateRule(editingRule, payload)
        : api.createRule(payload),
      editingRule ? "Rule updated." : "Rule created."
    );

    if (result) {
      setRule(initialRule);
      setEditingRule(null);
      await refresh();
    }
  };

  const saveWorkflow = async (event) => {
    event.preventDefault();

    const payload = {
      ...workflow,
      version_no: Number(workflow.version_no),
      effective_from: toISO(workflow.effective_from),
      effective_to: toISO(workflow.effective_to),
      steps: workflow.steps.map((s, index) => ({
        ...s,
        step_no: index + 1,
        role_id: Number(s.role_id),
      })),
    };

    const result = await run(
      () => api.createWorkflow(payload),
      "Workflow created."
    );

    if (result) {
      setWorkflow(initialWorkflow);
      await refresh();
    }
  };

  const saveTemplate = async (event) => {
    event.preventDefault();

    const payload = {
      ...template,
      version_no: Number(template.version_no),
      effective_from: toISO(template.effective_from),
      effective_to: toISO(template.effective_to),
    };

    const result = await run(
      () => api.createTemplate(payload),
      "Setup template created."
    );

    if (result) {
      setTemplateId(result.activity_template_id);
      setNewTemplates(previous => [...previous, result]);
      setTemplate(initialTemplate);
      setSteps([]);
    }
  };

  const loadSteps = async (id = templateId) => {
    if (!id) return;

    const result = await run(
      () => api.templateSteps(id),
      "Checkpoints loaded."
    );

    if (result) setSteps(rows(result));
  };

  const saveStep = async (event) => {
    event.preventDefault();

    if (!templateId) {
      setError("Select a template first.");
      return;
    }

    const payload = {
      ...step,
      step_no: Number(step.step_no),
      expected_boolean: step.value_type === "BOOLEAN"
        ? step.expected_boolean : null,
      lower_limit: step.value_type === "NUMBER" &&
        step.lower_limit !== "" ? step.lower_limit : null,
      upper_limit: step.value_type === "NUMBER" &&
        step.upper_limit !== "" ? step.upper_limit : null,
      unit: step.value_type === "NUMBER" ? step.unit : null,
    };

    const result = await run(
      () => editingStep
        ? api.updateStep(templateId, editingStep, payload)
        : api.createStep(templateId, payload),
      "Checkpoint saved."
    );

    if (result) {
      setStep(initialStep);
      setEditingStep(null);
      await loadSteps(templateId);
    }
  };

  const startInspection = async () => {
    if (!selectedOption) {
      setError("Choose an eligible setup.");
      return;
    }

    const result = await run(
      () => api.createActivityExecution({
        setup_execution_id: selectedOption.setup_execution_id,
        setup_rule_config_id: selectedOption.setup_rule_config_id,
        idempotency_key: executionKey,
      }),
      "Setup inspection created."
    );

    if (!result) return;

    setActivityId(result.activity_execution_id);
    setExecutionKey(newKey());

    const checks = await run(
      () => api.templateSteps(result.activity_template_id),
      "Inspection checkpoints loaded."
    );

    if (checks) setInspectionSteps(rows(checks));
  };

  const loadInspection = async () => {
    if (!activityId) {
      setError("Enter an activity execution ID.");
      return;
    }

    const result = await run(
      () => api.results(activityId),
      "Inspection loaded."
    );

    if (result) {
      const items = rows(result);
      setInspectionSteps(items);

      const existing = {};

      items.forEach((s) => {
        existing[s.activity_template_step_id] = {
          boolean_value: s.boolean_value,
          numeric_value: s.numeric_value ?? "",
          text_value: s.text_value ?? "",
          result_status: s.result_status || "OK",
          remarks: s.remarks || "",
        };
      });

      setAnswers(existing);
    }
  };

  const updateAnswer = (id, field, value) => {
    setAnswers((all) => ({
      ...all,
      [id]: {
        ...all[id],
        [field]: value,
      },
    }));
  };

  const saveAnswer = async (s) => {
    const id = s.activity_template_step_id;
    const a = answers[id] || {};

    const payload = {
      activity_template_step_id: id,
      remarks: a.remarks || null,
    };

    if (s.value_type === "BOOLEAN") {
      payload.boolean_value = a.boolean_value;
    } else if (s.value_type === "NUMBER") {
      payload.numeric_value = a.numeric_value;
    } else {
      payload.text_value = a.text_value;
      payload.result_status = a.result_status || "OK";
    }

    const result = await run(
      () => api.saveResult(activityId, payload),
      `Checkpoint ${s.step_no} saved.`
    );

    if (result) await loadInspection();
  };
  
const handleEditRule = (selectedRule) => {
  setEditingRule(selectedRule.setup_rule_config_id);

  setRule({
    ...selectedRule,
    is_active: selectedRule.is_active === true,
    effective_from: selectedRule.effective_from
      ? toLocalDateTime(selectedRule.effective_from)
      : "",
    effective_to: selectedRule.effective_to
      ? toLocalDateTime(selectedRule.effective_to)
      : "",
  });

  requestAnimationFrame(() => {
    ruleFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
};

  const completeInspection = async () => {
    const result = await run(
      () => api.completeExecution(activityId),
      "Inspection completed."
    );

    if (result) await loadInspection();
  };

  const requestApproval = async () => {
    if (!selectedOption || !activityId) {
      setError("Select a setup and complete an inspection first.");
      return;
    }

    const result = await run(
      () => api.execute({
        setup_execution_id: selectedOption.setup_execution_id,
        activity_execution_id: activityId,
        setup_rule_config_id: selectedOption.setup_rule_config_id,
        idempotency_key: approvalKey,
      }),
      "Approval request created."
    );

    if (result) {
      setApprovalKey(newKey());
      await refresh();
      setTab("approvals");
    }
  };

  const submitDecision = async (event) => {
    event.preventDefault();

    if (!selectedApproval || !remarks.trim()) return;

    const result = await run(
      () => api.decide(
        selectedApproval.setup_approval_id,
        decision,
        remarks.trim()
      ),
      `Decision ${decision.toLowerCase()} recorded.`
    );

    if (result) {
      setSelectedApproval(null);
      setRemarks("");
      await refresh();
    }
  };

  const approvalRows = runtime.filter((r) =>
    filter === "ALL" || r.decision === filter
  );

  return (
    <div className="sa-page">
      <header className="sa-header">
        <div>
          <small>OPERATEX / QUALITY MANAGEMENT</small>
          <h1>Setup Approval</h1>
          <p>First-piece verification and controlled setup approval</p>
        </div>
        <button onClick={refresh} disabled={loading || busy}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {error && <div className="sa-error" role="alert">{error}</div>}
      {masterError && <div className="sa-error" role="alert">{masterError}</div>}
      {notice && <div className="sa-success">{notice}</div>}

      
{permissionsLoading ? (
  <div className="sa-panel">
    Loading available sections...
  </div>
) : permissionsError ? (
  <div className="sa-panel" role="alert">
    Unable to load Setup Approval access.
    {permissionsError}
  </div>
) : visibleTabs.length === 0 ? (
  <div className="sa-panel">
    No Setup Approval sections are assigned to your account.
  </div>
) : (
  <nav className="sa-tabs">
    {visibleTabs.map(([id, name, Icon]) => (
      <button
        key={id}
        type="button"
        className={tab === id ? "active" : ""}
        onClick={() => setTab(id)}
      >
        <Icon size={16} />
        {name}
      </button>
    ))}
  </nav>
)}


      
{!permissionsLoading &&
  (can("view") || can("report")) &&
  tab === "dashboard" && (
  <>
    {/* KPI SUMMARY */}
    <div className="sa-stats">
      {[
        {
          label: "Total Approvals",
          value: stats.total,
          icon: ClipboardList,
        },
        {
          label: "Pending Approvals",
          value: stats.pending,
          icon: Activity,
        },
        {
          label: "Approved",
          value: stats.approved,
          icon: ShieldCheck,
        },
        {
          label: "Rejected",
          value: stats.rejected,
          icon: ClipboardCheck,
        },
      ].map(({ label, value, icon: Icon }) => (
        <div className="sa-stat" key={label}>
          <div className="sa-kpi-icon">
            <Icon size={18} />
          </div>
          <div>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        </div>
      ))}
    </div>

    {/* VISUALIZATION */}
    <Panel title="Approval Status Overview">
      <div className="sa-chart-summary">
        <div className="sa-chart-value">
          <strong>
            {stats.total
              ? Math.round(
                  (stats.approved / stats.total) * 100
                )
              : 0}%
          </strong>
          <span>Approved tasks</span>
        </div>

        <div className="sa-chart-content">
          <div className="sa-progress-track">
            {stats.total > 0 && (
              <>
                <div
                  className="sa-progress-segment approved"
                  style={{
                    width: `${
                      (stats.approved / stats.total) * 100
                    }%`,
                  }}
                />

                <div
                  className="sa-progress-segment pending"
                  style={{
                    width: `${
                      (stats.pending / stats.total) * 100
                    }%`,
                  }}
                />

                <div
                  className="sa-progress-segment rejected"
                  style={{
                    width: `${
                      (stats.rejected / stats.total) * 100
                    }%`,
                  }}
                />
              </>
            )}
          </div>

          <div className="sa-chart-legend">
            <span>
              <i className="sa-dot approved" />
              Approved ({stats.approved})
            </span>
            <span>
              <i className="sa-dot pending" />
              Pending ({stats.pending})
            </span>
            <span>
              <i className="sa-dot rejected" />
              Rejected ({stats.rejected})
            </span>
          </div>
        </div>
      </div>
      <p className="sa-hint">
        Based on approval tasks returned by the runtime API.
        Production clearance is evaluated separately.
      </p>
    </Panel>
    
    {/* REPORTS IN SAME DASHBOARD */}
    {can("report") && (
  <Panel title="Setup Approval Report">

  

      <div className="sa-report-header">
        <p>
          Review setup verification, approval decisions
          and historical records.
        </p>

        <button
          type="button"
          onClick={refresh}
          disabled={loading || busy}
        >
          <RefreshCw size={15} />
          Refresh Report
        </button>
      </div>

      <div className="sa-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Machine</th>
              <th>Setup Rule</th>
              <th>Level</th>
              <th>Decision</th>
              <th>Remarks</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((item, index) => {
              const linkedRule = rules.find(
                (rule) =>
                  rule.setup_rule_config_id ===
                  item.setup_rule_config_id
              );

              const status = String(
                item.decision || "PENDING"
              ).toUpperCase();

              return (
                <tr
                  key={item.setup_approval_id || index}
                >
                  <td>
                    {item.machine_name ||
                      (item.machine_id
                        ? getMachineName(item.machine_id)
                        : "Name unavailable")}
                  </td>

                  <td>
                    {item.rule_code ||
                      linkedRule?.rule_code ||
                      "Rule unavailable"}
                  </td>

                  <td>
                    {item.step_no != null
                      ? `Level ${item.step_no}`
                      : "—"}
                  </td>

                  <td>
                    <span
                      className={`sa-status ${status.toLowerCase()}`}
                    >
                      {status}
                    </span>
                  </td>

                  <td>
                    {item.remarks || "—"}
                  </td>

                  <td>
                    {formatDate(
                      item.decided_at || item.created_at
                    )}
                  </td>
                </tr>
              );
            })}

            {!reports.length && (
              <tr>
                <td
                  colSpan={6}
                  className="sa-empty"
                >
                  {loading
                    ? "Loading report..."
                    : "No setup approval records available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
    )}
  </>
)}


      {can("config") && tab === "rules" && (
        <>
          <div ref={ruleFormRef}>
  <Panel title={editingRule ? "Edit Setup Rule" : "New Setup Rule"}>
            <form onSubmit={saveRule} className="sa-form">
              <TextInput label="Rule code" required
                value={rule.rule_code}
                onChange={(v) => setRule({ ...rule, rule_code: v })} />

              
{/* MACHINE DROPDOWN */}
<Select
  label="Machine Name"
  required
  value={rule.machine_id}
  onChange={(value) =>
    setRule((previous) => ({
      ...previous,
      machine_id: value,
    }))
  }
>
  <option value="">
    {masterLoading ? "Loading machines..." : "Select Machine"}
  </option>

  {machines.map((machine) => (
    <option
      key={machine.machine_id}
      value={machine.machine_id}
    >
      {machine.machine_name ||
        machine.machine_code ||
        "Unnamed Machine"}
    </option>
  ))}
</Select>

{/* PART DROPDOWN */}
<Select
  label="Part Name (optional)"
  value={rule.part_id}
  onChange={(value) =>
    setRule((previous) => ({
      ...previous,
      part_id: value,
    }))
  }
>
  <option value="">All Parts</option>

  {parts.map((part) => (
    <option
      key={part.part_id}
      value={part.part_id}
    >
      {part.part_name ||
        part.part_code ||
        "Unnamed Part"}
    </option>
  ))}
</Select>

{/* PROCESS DROPDOWN */}
<Select
  label="Process Name (optional)"
  value={rule.process_id}
  onChange={(value) =>
    setRule((previous) => ({
      ...previous,
      process_id: value,
    }))
  }
>
  <option value="">All Processes</option>

  {processes.map((process) => (
    <option
      key={process.process_id}
      value={process.process_id}
    >
      {process.process_name ||
        process.process_code ||
        "Unnamed Process"}
    </option>
  ))}
</Select>

              <Select label="Setup Template"
                required
                value={rule.activity_template_id}
                onChange={(v) => setRule({
                  ...rule, activity_template_id: v
                })}>
                <option value="">Select Setup Template</option>
                {templateChoices.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>

              <Select label="Approval workflow"
              required
                value={rule.approval_workflow_config_id}

                onChange={(v) => setRule({
                  ...rule, approval_workflow_config_id: v
                })}>
                <option value="">Select workflow</option>
                {workflows.map((w) => (
                  <option
                    key={w.approval_workflow_config_id}
                    value={w.approval_workflow_config_id}>
                    {w.workflow_name}
                  </option>
                ))}
              </Select>

              <TextInput label="Version" type="number"
                value={rule.version_no}
                onChange={(v) => setRule({
                  ...rule, version_no: v
                })} />

              <DateFields form={rule} setForm={setRule} />

              <Check label="Active" value={rule.is_active}
                onChange={(v) => setRule({
                  ...rule, is_active: v
                })} />

              <div className="sa-actions">
                <button disabled={busy}>Save Rule</button>
                {editingRule && (
                  <button type="button" onClick={() => {
                    setEditingRule(null);
                    setRule({ ...initialRule, effective_from: toLocalDateTime() });
                  }}>Cancel Edit</button>
                )}
              </div>
            </form>
          </Panel>
           </div>
          {!templateChoices.length && (
            <p className="sa-hint">No Setup templates were returned by the current
              rules. Create a template first, or expose a tenant-scoped template
              catalog from the backend to select pre-existing unassigned templates.
            </p>
          )}
          <Panel title="Configured Rules">
            <div className="sa-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Rule</th><th>Machine</th>
                    <th>Template</th><th>Workflow</th>
                    <th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.setup_rule_config_id}>
                      <td>{r.rule_code}</td>
                      <td>{r.machine_name || getMachineName(r.machine_id)}</td>
                      <td>{r.template_name}</td>
                      <td>{r.workflow_name}</td>
                      <td>
  <span
    className={`sa-status ${
      r.is_active ? "active" : "inactive"
    }`}
  >
    {r.is_active ? "Active" : "Inactive"}
  </span>
</td>
                      <td className="sa-actions">
                        <button type="button" onClick={() => handleEditRule(r)}>Edit</button>
                        {r.is_active && (
                          <button className="danger" onClick={async () => {
                            if (!window.confirm("Deactivate rule?")) return;
                            const result = await run(
                              () => api.deleteRule(r.setup_rule_config_id),
                              "Rule deactivated."
                            );
                            if (result) await refresh();
                          }}>Deactivate</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {can("config") && tab === "workflows" && (
        <>
          <Panel title="Create Approval Workflow">
            <form className="sa-form" onSubmit={saveWorkflow}>
              <TextInput label="Workflow Code" required
                value={workflow.workflow_code}
                onChange={(v) => setWorkflow({
                  ...workflow, workflow_code: v
                })} />
              <TextInput label="Workflow Name" required
                value={workflow.workflow_name}
                onChange={(v) => setWorkflow({
                  ...workflow, workflow_name: v
                })} />
              <TextInput label="Version" type="number"
                value={workflow.version_no}
                onChange={(v) => setWorkflow({
                  ...workflow, version_no: v
                })} />
              <DateFields form={workflow} setForm={setWorkflow} />
              <Check label="Active" value={workflow.is_active}
                onChange={(v) => setWorkflow({
                  ...workflow, is_active: v
                })} />

              <div className="sa-wide">
                <h3>Approval Levels</h3>
                {!roleChoices.length && (
                  <p className="sa-hint" role="status">
                    No role catalog is available from the current Setup Approval API.
                    Role selection requires an authenticated, company-scoped role-list endpoint.
                  </p>
                )}
                {workflow.steps.map((s, index) => {
                  const update = (field, value) => {
                    setWorkflow((prev) => ({
                      ...prev,
                      steps: prev.steps.map((item, i) =>
                        i === index
                          ? { ...item, [field]: value }
                          : item
                      ),
                    }));
                  };

                  return (
                    <div className="sa-stage" key={index}>
                      <strong>Level {index + 1}</strong>
                      <Select label="Approver Role"
                        value={String(s.role_id || "")}
                        onChange={(id) => {
                          const found = roleChoices.find(r => r.id === id);
                          setWorkflow(prev => ({
                            ...prev,
                            steps: prev.steps.map((item, i) => i === index
                              ? { ...item, role_id: id, required_role: found?.name || "" }
                              : item),
                          }));
                        }}>
                        <option value="">Select an existing role</option>
                        {roleChoices.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </Select>
                      <Check label="Allow self approval"
                        value={s.allow_self_approval}
                        onChange={(v) =>
                          update("allow_self_approval", v)} />
                      {workflow.steps.length > 1 && (
                        <button type="button" className="danger"
                          onClick={() => setWorkflow((p) => ({
                            ...p,
                            steps: p.steps.filter((_, i) =>
                              i !== index
                            ),
                          }))}>
                          Remove Level
                        </button>
                      )}
                    </div>
                  );
                })}

                <button type="button" onClick={() =>
                  setWorkflow((p) => ({
                    ...p,
                    steps: [...p.steps, {
                      step_no: p.steps.length + 1,
                      role_id: "",
                      required_role: "",
                      allow_self_approval: false,
                    }],
                  }))
                }>Add Approval Level</button>
              </div>

              <button disabled={busy || !roleChoices.length ||
                workflow.steps.some(s => !s.role_id || !s.required_role)}>
                Create Workflow
              </button>
            </form>
          </Panel>

          <Panel title="Existing Workflows">
            <div className="sa-table-scroll">
              <table>
                <thead>
                  <tr><th>Code</th><th>Name</th>
                    <th>Levels</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {workflows.map((w) => (
                    <tr key={w.approval_workflow_config_id}>
                      <td>{w.workflow_code}</td>
                      <td>{w.workflow_name}</td>
                      <td>{rows(w.steps).length}</td>
                      <td>
  <span
    className={`sa-status ${
      w.is_active ? "active" : "inactive"
    }`}
  >
    {w.is_active ? "Active" : "Inactive"}
  </span>
</td>
                      <td>
                        {w.is_active && (
                          <button className="danger"
                            onClick={async () => {
                              if (!window.confirm(
                                "Deactivate this workflow?"
                              )) return;
                              const result = await run(
                                () => api.deleteWorkflow(
                                  w.approval_workflow_config_id
                                ),
                                "Workflow deactivated."
                              );
                              if (result) await refresh();
                            }}>
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {can("config") && tab === "templates" && (
        <>
          <Panel title="Create Setup Template">
            <form className="sa-form" onSubmit={saveTemplate}>
              <TextInput label="Template Code" required
                value={template.template_code}
                onChange={(v) => setTemplate({
                  ...template, template_code: v
                })} />
              <TextInput label="Template Name" required
                value={template.template_name}
                onChange={(v) => setTemplate({
                  ...template, template_name: v
                })} />
              <TextInput label="Version" type="number"
                value={template.version_no}
                onChange={(v) => setTemplate({
                  ...template, version_no: v
                })} />
              <DateFields form={template} setForm={setTemplate} />
              <Check label="Active"
                value={template.is_active}
                onChange={(v) => setTemplate({
                  ...template, is_active: v
                })} />
              <button disabled={busy}>Create Template</button>
            </form>
          </Panel>

          <Panel title="Manage Template Checkpoints">
            <div className="sa-inline">
              <Select label="Setup Template Name"
                value={templateId}
                onChange={(id) => {
                  setTemplateId(id);
                  setSteps([]);
                  setEditingStep(null);
                }}>
                <option value="">Select a Setup Template</option>
                {templateChoices.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
              <button onClick={() => loadSteps()}>
                Load Checkpoints
              </button>
            </div>

            <form className="sa-form" onSubmit={saveStep}>
              <TextInput label="Step Number" type="number" required
                value={step.step_no}
                onChange={(v) => setStep({
                  ...step, step_no: v
                })} />
              <TextInput label="Checkpoint" required
                value={step.check_point}
                onChange={(v) => setStep({
                  ...step, check_point: v
                })} />
              <TextInput label="Specification"
                value={step.specification}
                onChange={(v) => setStep({
                  ...step, specification: v
                })} />
              <TextInput label="Checking Method"
                value={step.checking_method}
                onChange={(v) => setStep({
                  ...step, checking_method: v
                })} />
              <Select label="Value Type"
                value={step.value_type}
                onChange={(v) => setStep({
                  ...step, value_type: v
                })}>
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="NUMBER">NUMBER</option>
                <option value="TEXT">TEXT</option>
              </Select>

              {step.value_type === "BOOLEAN" && (
                <Select label="Expected Result"
                  value={String(step.expected_boolean)}
                  onChange={(v) => setStep({
                    ...step, expected_boolean: v === "true"
                  })}>
                  <option value="true">True / Yes</option>
                  <option value="false">False / No</option>
                </Select>
              )}

              {step.value_type === "NUMBER" && (
                <>
                  <TextInput label="Lower Limit" type="number"
                    value={step.lower_limit}
                    onChange={(v) => setStep({
                      ...step, lower_limit: v
                    })} />
                  <TextInput label="Upper Limit" type="number"
                    value={step.upper_limit}
                    onChange={(v) => setStep({
                      ...step, upper_limit: v
                    })} />
                  <TextInput label="Unit" required
                    value={step.unit}
                    onChange={(v) => setStep({
                      ...step, unit: v
                    })} />
                </>
              )}

              <TextInput label="Abnormality Action"
                value={step.action_after_abnormality}
                onChange={(v) => setStep({
                  ...step, action_after_abnormality: v
                })} />
              <Check label="Mandatory Checkpoint"
                value={step.is_mandatory}
                onChange={(v) => setStep({
                  ...step, is_mandatory: v
                })} />

              <div className="sa-actions">
                <button disabled={busy}>Save Checkpoint</button>
                {editingStep && (
                  <button type="button" onClick={() => {
                    setStep(initialStep);
                    setEditingStep(null);
                  }}>Cancel Edit</button>
                )}
              </div>
            </form>

            <div className="sa-table-scroll">
              <table>
                <thead>
                  <tr><th>No.</th><th>Check</th><th>Type</th>
                    <th>Limits / Expected</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {steps.map((s) => (
                    <tr key={s.activity_template_step_id}>
                      <td>{s.step_no}</td>
                      <td>{s.check_point}</td>
                      <td>{s.value_type}</td>
                      <td>
                        {s.value_type === "BOOLEAN"
                          ? String(s.expected_boolean)
                          : s.value_type === "NUMBER"
                            ? `${show(s.lower_limit)} – ${show(
                              s.upper_limit)} ${s.unit || ""}`
                            : "Text"}
                      </td>
                      <td className="sa-actions">
                        <button onClick={() => {
                          setEditingStep(s.activity_template_step_id);
                          setStep({
                            ...s,
                            lower_limit: s.lower_limit ?? "",
                            upper_limit: s.upper_limit ?? "",
                          });
                        }}>Edit</button>
                        <button className="danger"
                          onClick={async () => {
                            if (!window.confirm(
                              "Delete this checkpoint?"
                            )) return;
                            const result = await run(
                              () => api.deleteStep(
                                templateId,
                                s.activity_template_step_id
                              ),
                              "Checkpoint deleted."
                            );
                            if (result) await loadSteps();
                          }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {can("execute") && tab === "execution" && (
        <>
          <Panel title="Select Eligible Setup">
            <Select label="Machine / Setup / Rule"
              value={selectedSetup}
              onChange={(v) => {
                setSelectedSetup(v);
                setActivityId("");
                setInspectionSteps([]);
                setAnswers({});
              }}>
              <option value="">Select eligible setup</option>
              {options.map((o) => (
                <option
                  key={`${o.setup_execution_id}:${o.setup_rule_config_id}`}
                  value={`${o.setup_execution_id}:${o.setup_rule_config_id}`}
                >
                  {namedSetup(o)}
                </option>
              ))}
            </Select>

            <p className="sa-hint">
              Only setups eligible under active rules appear here.
              A previously completed OK inspection may also be
              returned by this endpoint.
            </p>

            <div className="sa-actions">
              <button disabled={busy || !selectedOption}
                onClick={startInspection}>
                Start New Inspection
              </button>
              {selectedOption?.activity_execution_id && (
                <button onClick={() => {
                  setActivityId(
                    selectedOption.activity_execution_id
                  );
                  setInspectionSteps([]);
                  setAnswers({});
                }}>
                  Use Completed OK Evidence
                </button>
              )}
            </div>
          </Panel>

          <Panel title="Inspection Entry">
            <div className="sa-inline">
              <Select label="Inspection"
                value={activityId}
                onChange={setActivityId}>
                <option value="">Select inspection</option>
                {options.filter(o => o.activity_execution_id).map(o => (
                  <option key={o.activity_execution_id}
                    value={o.activity_execution_id}>
                    {namedSetup(o)}
                  </option>
                ))}
                {activityId && !options.some(o =>
                  String(o.activity_execution_id) === String(activityId)
                ) && (
                  <option value={activityId}>Current inspection</option>
                )}
              </Select>
              <button onClick={loadInspection}
                disabled={busy || !activityId}>
                Load Inspection
              </button>
            </div>

            {inspectionSteps.map((s) => {
              const id = s.activity_template_step_id;
              const a = answers[id] || {};

              return (
                <div key={id} className="sa-checkpoint">
                  <div>
                    <strong>{s.step_no}. {s.check_point}</strong>
                    <p>{s.specification || s.checking_method}</p>
                    <small>
                      {s.is_mandatory ? "Mandatory" : "Optional"}
                      {" · "}{s.value_type}
                    </small>
                  </div>

                  {s.value_type === "BOOLEAN" && (
                    <Select label="Observed result"
                      value={a.boolean_value === undefined ||
                        a.boolean_value === null
                          ? ""
                          : String(a.boolean_value)}
                      onChange={(v) =>
                        updateAnswer(id, "boolean_value",
                          v === "" ? null : v === "true")}>
                      <option value="">Select</option>
                      <option value="true">Yes / True</option>
                      <option value="false">No / False</option>
                    </Select>
                  )}

                  {s.value_type === "NUMBER" && (
                    <TextInput
                      label={`Measured Value (${s.unit || ""})`}
                      type="number"
                      value={a.numeric_value ?? ""}
                      onChange={(v) =>
                        updateAnswer(id, "numeric_value", v)}
                    />
                  )}

                  {s.value_type === "TEXT" && (
                    <>
                      <TextInput label="Observed Text"
                        value={a.text_value ?? ""}
                        onChange={(v) =>
                          updateAnswer(id, "text_value", v)} />
                      <Select label="Evaluation"
                        value={a.result_status || "OK"}
                        onChange={(v) =>
                          updateAnswer(id, "result_status", v)}>
                        <option value="OK">OK</option>
                        <option value="NOK">NOK</option>
                      </Select>
                    </>
                  )}

                  <TextInput label="Remarks / corrective action"
                    value={a.remarks ?? ""}
                    onChange={(v) =>
                      updateAnswer(id, "remarks", v)} />

                  {s.result_status && (
                    <span className={`sa-status ${
                      s.result_status.toLowerCase()
                    }`}>
                      Saved: {s.result_status}
                    </span>
                  )}

                  <button disabled={busy || !activityId}
                    onClick={() => saveAnswer(s)}>
                    Save Reading
                  </button>
                </div>
              );
            })}

            <div className="sa-actions">
              <button disabled={busy || !activityId}
                onClick={completeInspection}>
                Complete Inspection
              </button>
              <button disabled={
                busy || !activityId || !selectedOption
              } onClick={requestApproval}>
                Request Setup Approval
              </button>
            </div>

            <p className="sa-hint">
              Complete the inspection before requesting approval.
              NOK results must retain their readings and remarks.
              The backend rejects approval requests without matching
              completed OK evidence.
            </p>
          </Panel>
        </>
      )}

     
{can("approve") && tab === "approvals" && (
  <Panel title="Setup Approval Queue">
    <Select
      label="Filter by Status"
      value={filter}
      onChange={setFilter}
    >
      <option value="ALL">All</option>
      <option value="PENDING">Pending</option>
      <option value="APPROVED">Approved</option>
      <option value="REJECTED">Rejected</option>
    </Select>

    <div className="sa-approval-list">
      {approvalRows.map((item) => (
        <div
          className="sa-approval-card"
          key={item.setup_approval_id}
        >
          <div className="sa-approval-card-header">
            <strong>
              {item.machine_name ||
                getMachineName(item.machine_id)}
            </strong>

            <span
              className={`sa-status ${String(
                item.decision || "PENDING"
              ).toLowerCase()}`}
            >
              {item.decision || "PENDING"}
            </span>
          </div>

          <div className="sa-detail-line">
            <span>Setup Rule</span>
            <strong>
              {item.rule_code ||
                rules.find((r) =>
                  r.setup_rule_config_id ===
                  item.setup_rule_config_id
                )?.rule_code ||
                "Rule name unavailable"}
            </strong>
          </div>

          <div className="sa-detail-line">
            <span>Approval Level</span>
            <strong>Level {item.step_no}</strong>
          </div>

          {item.remarks && (
            <div className="sa-detail-line">
              <span>Remarks</span>
              <strong>{item.remarks}</strong>
            </div>
          )}

          {item.decision === "PENDING" && (
            <div className="sa-actions">
              <button
                onClick={() => {
                  setSelectedApproval(item);
                  setDecision("APPROVED");
                  setRemarks("");
                }}
              >
                Approve
              </button>

              <button
                className="danger"
                onClick={() => {
                  setSelectedApproval(item);
                  setDecision("REJECTED");
                  setRemarks("");
                }}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>

    {!approvalRows.length && (
      <p>No setup approvals found for this status.</p>
    )}
  </Panel>
)}
   

      {selectedApproval && (
        <div className="sa-overlay">
          <form className="sa-dialog" onSubmit={submitDecision}>
            <h2>
              {decision === "APPROVED" ? "Approve" : "Reject"}
              {" "}Setup
            </h2>
            <p>
              Setup: {namedSetup(selectedApproval)}
            </p>
            <Field label="Decision Remarks (required)">
              <textarea
                required
                maxLength={2000}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
              />
            </Field>

            <div className="sa-actions">
              <button type="button"
                onClick={() => setSelectedApproval(null)}>
                Cancel
              </button>
              <button disabled={busy || !remarks.trim()}>
                Confirm {decision}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
