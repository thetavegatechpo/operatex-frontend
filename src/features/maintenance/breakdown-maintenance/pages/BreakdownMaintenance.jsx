import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  ArrowClockwise,
  Clipboard2Pulse,
  ClockHistory,
  Download,
  Eye,
  ExclamationTriangleFill,
  Plus,
  Search,
  WrenchAdjustable,
} from "react-bootstrap-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";
import {
  createBreakdownMaster,
  createEscalationConfig,
  deactivateBreakdownMaster,
  deactivateEscalationConfig,
  executeBreakdownAction,
  exportBreakdownReport,
  getBreakdownById,
  getBreakdownDashboard,
  getBreakdownMaster,
  getBreakdownReport,
  getBreakdownRuntime,
  getEscalationConfig,
  rowsFromBreakdownResponse,
  runBreakdownScheduler,
} from "../api/breakdownMaintenance.service.js";
import "./BreakdownMaintenance.css";

const VIEW_RUNTIME = "RUNTIME";
const VIEW_REASON = "REASON";
const VIEW_TECHNICIAN = "TECHNICIAN";
const VIEW_ESCALATION = "ESCALATION";
const VIEW_REPORT = "REPORT";

const localDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const localDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const emptyFilters = {
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  shift_id: "",
  breakdown_reason_id: "",
  technician_id: "",
  status: "",
  business_date: "",
  from_date: "",
  to_date: "",
  limit: 100,
  offset: 0,
};

const breakdownInitial = {
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  shift_id: "",
  business_date: localDate(),
  breakdown_start_ts: localDateTime(),
  breakdown_end_ts: "",
  breakdown_reason_id: "",
  status: "OPEN",
  breakdown_location: "",
  breakdown_reason_detail: "",
  problem_area: "",
  physical_phenomenon: "",
  action_taken: "",
  root_cause: "",
  technician_id: "",
  responsibility: "",
  remark: "",
  priority: "HIGH",
  severity: "MAJOR",
  source_system: "OPERATEX_UI",
};

const reasonInitial = {
  company_id: "",
  reason_code: "",
  reason_name: "",
  category: "MECHANICAL",
  description: "",
  is_planned: false,
  affects_availability: true,
  default_priority: "HIGH",
  default_severity: "MAJOR",
  status: "ACTIVE",
};

const technicianInitial = {
  company_id: "",
  plant_id: "",
  technician_code: "",
  technician_name: "",
  skill_category: "MECHANICAL",
  responsibility: "",
  mobile_no: "",
  email: "",
  escalation_rank: 1,
  status: "ACTIVE",
};

const escalationInitial = {
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  breakdown_reason_id: "",
  severity: "MAJOR",
  escalation_level: 1,
  threshold_min: 15,
  repeat_interval_min: 30,
  technician_id: "",
  responsibility: "",
  notification_channels: ["IN_APP"],
  threshold_basis: "BREAKDOWN_START",
  is_active: true,
};

const actionInitial = {
  action: "ACKNOWLEDGE",
  technician_id: "",
  responsibility: "",
  diagnosis: "",
  action_taken: "",
  root_cause: "",
  restored_ts: "",
  production_resumed_ts: "",
  breakdown_end_ts: "",
  reason: "",
  remark: "",
};

const FILTER_KEY = "operatex.breakdown-maintenance.filters.v2";
const loadFilters = () => {
  if (typeof window === "undefined") return { ...emptyFilters };
  try {
    return {
      ...emptyFilters,
      ...JSON.parse(window.localStorage.getItem(FILTER_KEY) || "{}"),
    };
  } catch (_) {
    return { ...emptyFilters };
  }
};

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";
const same = (a, b) => String(a ?? "") === String(b ?? "");
const safe = (value) => (hasValue(value) ? String(value) : "-");
const toIso = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
};
const asRows = (value, keys = []) => rowsFromBreakdownResponse(value, keys);

const errorText = (error) => {
  const data = error?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((item) => item?.message || item).join(" | ");
  }
  return data?.message || error?.message || "Request failed.";
};

const displayDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const displayDuration = (seconds) => {
  const value = Math.max(0, Number(seconds || 0));
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = Math.floor(value % 60);
  return [days && `${days}d`, hours && `${hours}h`, minutes && `${minutes}m`, `${secs}s`]
    .filter(Boolean)
    .join(" ");
};

const useLookup = (key, url, keys) =>
  useQuery({
    queryKey: ["breakdown-management", "lookup", key],
    queryFn: async () => asRows(await api.get(url), keys),
    staleTime: 60000,
  });

const idOf = (row, key) => row?.[key] ?? "";
const labelOf = (row, name, code, id) =>
  row?.[name] ?? row?.[code] ?? row?.[id] ?? "-";

function Field({ label, required, as = "input", children, ...props }) {
  return (
    <Form.Group>
      <Form.Label className="bd-label">
        {label}{required && <span className="bd-required"> *</span>}
      </Form.Label>
      {as === "select" ? (
        <Form.Select required={required} {...props}>{children}</Form.Select>
      ) : as === "textarea" ? (
        <Form.Control as="textarea" rows={2} required={required} {...props} />
      ) : (
        <Form.Control required={required} {...props} />
      )}
    </Form.Group>
  );
}

function StateBadge({ value }) {
  const upper = String(value || "OPEN").toUpperCase();
  const bg = upper === "CLOSED" || upper === "ACTIVE" ? "success" :
    upper === "OPEN" || upper === "CRITICAL" ? "danger" : "warning";
  return <Badge bg={bg} className="bd-badge">{upper}</Badge>;
}

function SummaryCard({ icon: Icon, value, label, tone = "purple" }) {
  return (
    <Card className="bd-summary-card h-100">
      <Card.Body className="d-flex align-items-center gap-3">
        <span className={`bd-summary-icon ${tone}`}><Icon /></span>
        <div><strong>{value}</strong><small>{label}</small></div>
      </Card.Body>
    </Card>
  );
}

function ScopeFields({ form, setForm, lookups, includeShift = false, optional = false, companyRequired = false }) {
  const plants = lookups.plants.filter((row) =>
    !form.company_id || !row.company_id || same(row.company_id, form.company_id));
  const lines = lookups.lines.filter((row) =>
    !form.plant_id || !row.plant_id || same(row.plant_id, form.plant_id));
  const machines = lookups.machines.filter((row) =>
    !form.line_id || !row.line_id || same(row.line_id, form.line_id));
  const set = (key, value, clear = []) => setForm((old) => ({
    ...old, [key]: value, ...Object.fromEntries(clear.map((name) => [name, ""])),
  }));
  return (
    <>
      <Col md={6} lg={3}>
        <Field label="Company" as="select" required={companyRequired || !optional} value={form.company_id}
          onChange={(e) => set("company_id", e.target.value, ["plant_id", "line_id", "machine_id"])}>
          <option value="">{optional && !companyRequired ? "All companies" : "Select company"}</option>
          {lookups.companies.map((row) => <option key={idOf(row, "company_id")} value={idOf(row, "company_id")}>
            {labelOf(row, "company_name", "company_code", "company_id")}
          </option>)}
        </Field>
      </Col>
      <Col md={6} lg={3}>
        <Field label="Plant" as="select" required={!optional} value={form.plant_id}
          onChange={(e) => set("plant_id", e.target.value, ["line_id", "machine_id"])}>
          <option value="">{optional ? "All plants" : "Select plant"}</option>
          {plants.map((row) => <option key={idOf(row, "plant_id") || idOf(row, "shop_id")} value={idOf(row, "plant_id") || idOf(row, "shop_id")}>
            {labelOf(row, "plant_name", "plant_code", "plant_id")}
          </option>)}
        </Field>
      </Col>
      <Col md={6} lg={3}>
        <Field label="Line" as="select" required={!optional} value={form.line_id}
          onChange={(e) => set("line_id", e.target.value, ["machine_id"])}>
          <option value="">{optional ? "All lines" : "Select line"}</option>
          {lines.map((row) => <option key={idOf(row, "line_id")} value={idOf(row, "line_id")}>
            {labelOf(row, "line_name", "line_code", "line_id")}
          </option>)}
        </Field>
      </Col>
      <Col md={6} lg={3}>
        <Field label="Machine" as="select" required={!optional} value={form.machine_id}
          onChange={(e) => set("machine_id", e.target.value)}>
          <option value="">{optional ? "All machines" : "Select machine"}</option>
          {machines.map((row) => <option key={idOf(row, "machine_id")} value={idOf(row, "machine_id")}>
            {labelOf(row, "machine_name", "machine_code", "machine_id")}
          </option>)}
        </Field>
      </Col>
      {includeShift && <Col md={6} lg={3}>
        <Field label="Shift No." as="select" required value={form.shift_id}
          onChange={(e) => set("shift_id", e.target.value)}>
          <option value="">Select shift</option>
          {lookups.shifts.map((row) => <option key={row.shift_id} value={row.shift_id}>
            {row.shift_name || `Shift ${row.shift_no || row.shift_id}`}
          </option>)}
        </Field>
      </Col>}
    </>
  );
}

function AddBreakdownModal({ show, onHide, lookups, reasons, technicians, onSave, busy }) {
  const [form, setForm] = useState(breakdownInitial);
  useEffect(() => { if (show) setForm({ ...breakdownInitial }); }, [show]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const scopedReasons = reasons.filter((row) => !form.company_id || same(row.company_id, form.company_id));
  const scopedTechs = technicians.filter((row) =>
    (!form.company_id || same(row.company_id, form.company_id)) &&
    (!form.plant_id || !row.plant_id || same(row.plant_id, form.plant_id)));
  const submit = (event) => {
    event.preventDefault();
    onSave({
      action: "CREATE_BREAKDOWN",
      ...form,
      shift_id: Number(form.shift_id),
      breakdown_start_ts: toIso(form.breakdown_start_ts),
      breakdown_end_ts: toIso(form.breakdown_end_ts),
      restored_ts: undefined,
      production_resumed_ts: undefined,
    });
  };
  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
      <Form onSubmit={submit}>
        <Modal.Header closeButton className="bd-modal-header">
          <Modal.Title>Add Breakdown</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Alert variant="light" className="bd-help">
            Create the maintenance ticket when the breakdown starts. Every field marked * is compulsory.
          </Alert>
          <Row className="g-3">
            <ScopeFields form={form} setForm={setForm} lookups={lookups} includeShift />
            <Col md={6} lg={3}><Field label="Business Date" type="date" required value={form.business_date} onChange={(e) => set("business_date", e.target.value)} /></Col>
            <Col md={6} lg={3}><Field label="Breakdown Start" type="datetime-local" required value={form.breakdown_start_ts} onChange={(e) => set("breakdown_start_ts", e.target.value)} /></Col>
            <Col md={6} lg={3}><Field label="Status" as="select" required value="OPEN" disabled><option>OPEN</option></Field></Col>
            {form.status === "CLOSED" && <Col md={6} lg={3}><Field label="Breakdown End" type="datetime-local" required value={form.breakdown_end_ts} onChange={(e) => set("breakdown_end_ts", e.target.value)} /></Col>}
            <Col md={6} lg={3}><Field label="Breakdown Reason" as="select" required value={form.breakdown_reason_id} onChange={(e) => set("breakdown_reason_id", e.target.value)}><option value="">Select reason</option>{scopedReasons.map((row) => <option key={row.breakdown_reason_id} value={row.breakdown_reason_id}>{row.reason_code} - {row.reason_name}</option>)}</Field></Col>
            <Col md={6} lg={3}><Field label="Location" required value={form.breakdown_location} onChange={(e) => set("breakdown_location", e.target.value)} placeholder="CNC spindle assembly" /></Col>
            <Col md={6} lg={3}><Field label="Problem Area" required value={form.problem_area} onChange={(e) => set("problem_area", e.target.value)} placeholder="Spindle drive" /></Col>
            <Col md={6} lg={3}><Field label="Physical Phenomenon" required value={form.physical_phenomenon} onChange={(e) => set("physical_phenomenon", e.target.value)} placeholder="Noise, heat, trip..." /></Col>
            <Col md={6}><Field label="Breakdown Reason Detail" as="textarea" required value={form.breakdown_reason_detail} onChange={(e) => set("breakdown_reason_detail", e.target.value)} /></Col>
            <Col md={6}><Field label="Technician" as="select" required value={form.technician_id} onChange={(e) => {
              const id = e.target.value; const tech = scopedTechs.find((row) => same(row.technician_id, id));
              setForm((old) => ({ ...old, technician_id: id, responsibility: tech?.responsibility || old.responsibility }));
            }}><option value="">Select technician</option>{scopedTechs.map((row) => <option key={row.technician_id} value={row.technician_id}>{row.technician_code} - {row.technician_name}</option>)}</Field></Col>
            <Col md={6}><Field label="Responsibility" required value={form.responsibility} onChange={(e) => set("responsibility", e.target.value)} /></Col>
            <Col md={3}><Field label="Priority" as="select" required value={form.priority} onChange={(e) => set("priority", e.target.value)}>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((x) => <option key={x}>{x}</option>)}</Field></Col>
            <Col md={3}><Field label="Severity" as="select" required value={form.severity} onChange={(e) => set("severity", e.target.value)}>{["MINOR", "MAJOR", "CRITICAL"].map((x) => <option key={x}>{x}</option>)}</Field></Col>
            {form.status === "CLOSED" && <><Col md={6}><Field label="Action Taken" as="textarea" required value={form.action_taken} onChange={(e) => set("action_taken", e.target.value)} /></Col><Col md={6}><Field label="Root Cause" as="textarea" required value={form.root_cause} onChange={(e) => set("root_cause", e.target.value)} /></Col></>}
            <Col md={12}><Field label="Remark" as="textarea" required value={form.remark} onChange={(e) => set("remark", e.target.value)} /></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={onHide}>Cancel</Button><Button type="submit" className="bd-primary" disabled={busy}>{busy ? "Saving..." : "Create Breakdown"}</Button></Modal.Footer>
      </Form>
    </Modal>
  );
}
// ============================================================
// BREAKDOWN ACTION FIELDS
// ============================================================

const actionFields = {
  ACKNOWLEDGE: [],
  ASSIGN_TECHNICIAN: ["technician_id", "responsibility"],
  START_REPAIR: [],
  ADD_DIAGNOSIS: ["diagnosis"],
  ADD_ACTION: ["action_taken"],
  ADD_ROOT_CAUSE: ["root_cause"],
  RESTORE_MACHINE: ["restored_ts"],
  VERIFY_PRODUCTION: ["production_resumed_ts"],
  CLOSE_BREAKDOWN: ["breakdown_end_ts"],
  ESCALATE: [],
  REOPEN_BREAKDOWN: ["reason"],
};


// ============================================================
// BREAKDOWN WORKFLOW STEPS
// ============================================================

const breakdownWorkflowSteps = [
  {
    action: "ACKNOWLEDGE",
    label: "Acknowledge",
    shortLabel: "Acknowledge",
  },
  {
    action: "ASSIGN_TECHNICIAN",
    label: "Assign Technician",
    shortLabel: "Assign",
  },
  {
    action: "START_REPAIR",
    label: "Start Repair",
    shortLabel: "Repair",
  },
  {
    action: "ADD_DIAGNOSIS",
    label: "Diagnosis",
    shortLabel: "Diagnosis",
  },
  {
    action: "ADD_ACTION",
    label: "Action Taken",
    shortLabel: "Action",
  },
  {
    action: "ADD_ROOT_CAUSE",
    label: "Root Cause",
    shortLabel: "Root Cause",
  },
  {
    action: "RESTORE_MACHINE",
    label: "Restore Machine",
    shortLabel: "Restore",
  },
  {
    action: "VERIFY_PRODUCTION",
    label: "Verify Production",
    shortLabel: "Verify",
  },
  {
    action: "CLOSE_BREAKDOWN",
    label: "Close Breakdown",
    shortLabel: "Close",
  },
];


function TicketModal({
  show,
  onHide,
  ticket,
  technicians,
  onAction,
  busy,
}) {

  const breakdown =
    ticket?.breakdown ||
    ticket ||
    {};

  const activities =
    ticket?.activities ||
    [];


  // ============================================================
  // TECHNICIAN SCOPE
  // ============================================================

  const scopedTechnicians =
    technicians.filter(
      (row) =>
        !breakdown.company_id ||
        same(
          row.company_id,
          breakdown.company_id
        )
    );


  // ============================================================
  // FORM STATE
  // ============================================================

  const [form, setForm] =
    useState({
      ...actionInitial,
      action: "ACKNOWLEDGE",
    });


  // ============================================================
  // SELECTED MANUAL STEP
  // ============================================================

  const [currentStep, setCurrentStep] =
    useState(0);

  // Local submit guard prevents repeated clicks while the action
  // request is running.
  const [submitting, setSubmitting] =
    useState(false);


  // ============================================================
  // RESET WHEN TICKET OPENS / CHANGES
  // ============================================================

  useEffect(() => {

    if (!show) {
      return;
    }

    setCurrentStep(0);

    setForm({
      ...actionInitial,

      action:
        String(
          breakdown.status || ""
        ).toUpperCase() === "CLOSED"
          ? "REOPEN_BREAKDOWN"
          : "ACKNOWLEDGE",

      technician_id:
        breakdown.technician_id ||
        "",

      responsibility:
        breakdown.responsibility ||
        "",
    });

  }, [
    show,
    breakdown.breakdown_event_id,
  ]);


  // ============================================================
  // CLOSED STATUS
  // ============================================================

  const isClosed =
    String(
      breakdown.status || ""
    ).toUpperCase() === "CLOSED";


  // ============================================================
  // CURRENT ACTION FIELDS
  // ============================================================

  const fields =
    actionFields[
      form.action
    ] || [];


  // ============================================================
  // SELECT WORKFLOW STEP
  //
  // IMPORTANT:
  // Selecting a step DOES NOT execute anything.
  // User manually decides which step should be opened.
  // ============================================================

  const selectStep = (index) => {

    if (
      index < 0 ||
      index >= breakdownWorkflowSteps.length
    ) {
      return;
    }

    const step =
      breakdownWorkflowSteps[index];

    setCurrentStep(index);

    setForm((old) => {

      const next = {
        ...old,
        action: step.action,
      };


      // --------------------------------------------
      // Give time-based actions current timestamp
      // only when field is still blank.
      // --------------------------------------------

      if (
        step.action === "RESTORE_MACHINE" &&
        !next.restored_ts
      ) {
        next.restored_ts =
          localDateTime();
      }


      if (
        step.action === "VERIFY_PRODUCTION" &&
        !next.production_resumed_ts
      ) {
        next.production_resumed_ts =
          localDateTime();
      }


      if (
        step.action === "CLOSE_BREAKDOWN" &&
        !next.breakdown_end_ts
      ) {
        next.breakdown_end_ts =
          localDateTime();
      }


      return next;
    });
  };


  // ============================================================
  // PREVIOUS STEP
  // ============================================================

  const previousStep = () => {

    if (currentStep <= 0) {
      return;
    }

    selectStep(
      currentStep - 1
    );
  };


  // ============================================================
  // NEXT STEP
  //
  // Manual navigation only.
  // Does NOT call backend.
  // ============================================================

  const nextStep = () => {

    if (
      currentStep >=
      breakdownWorkflowSteps.length - 1
    ) {
      return;
    }

    selectStep(
      currentStep + 1
    );
  };


  // ============================================================
  // ESCALATE
  //
  // Escalation stays available without making it part of the
  // normal repair -> close workflow.
  // ============================================================

  const selectEscalate = () => {

    setForm((old) => ({
      ...old,
      action: "ESCALATE",
    }));

  };


  // ============================================================
  // REOPEN
  // ============================================================

  const selectReopen = () => {

    setForm((old) => ({
      ...old,
      action: "REOPEN_BREAKDOWN",
      reason: "",
    }));

  };


  // ============================================================
  // SUBMIT CURRENT STEP
  //
  // After the backend save succeeds, automatically select the
  // next workflow step. Previous / Next buttons still work.
  // ============================================================

  const submit = async (event) => {

    event.preventDefault();

    if (
      !breakdown.breakdown_event_id ||
      busy ||
      submitting
    ) {
      return;
    }

    const submittedAction = form.action;

    const data = {

      action:
        submittedAction,

      breakdown_event_id:
        breakdown.breakdown_event_id,

      expected_version:
        Number(
          breakdown.version_no
        ),

      remark:
        form.remark,

    };

    fields.forEach(
      (field) => {

        data[field] =
          field.endsWith("_ts")
            ? toIso(
                form[field]
              )
            : form[field];

      }
    );

    try {
      setSubmitting(true);

      // onAction returns a Promise from mutation.mutateAsync.
      // If the API fails, it rejects and the step does NOT move.
      await onAction(data);

      const savedStepIndex =
        breakdownWorkflowSteps.findIndex(
          (step) =>
            step.action === submittedAction
        );

      // ESCALATE / REOPEN are not normal workflow steps.
      // CLOSE is already the final step.
      if (
        savedStepIndex >= 0 &&
        savedStepIndex <
          breakdownWorkflowSteps.length - 1
      ) {
        selectStep(savedStepIndex + 1);
      }

    } catch (_) {
      // Parent mutation.onError already shows the backend error.
      // Keep the current step selected when save fails.
    } finally {
      setSubmitting(false);
    }
  };


  // ============================================================
  // CURRENT STEP INFORMATION
  // ============================================================

  const currentStepInfo =
    breakdownWorkflowSteps[
      currentStep
    ];


  return (

    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      backdrop="static"
    >

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <Modal.Header
        closeButton
        className="bd-modal-header"
      >

        <Modal.Title>
          Breakdown Ticket
        </Modal.Title>

      </Modal.Header>


      {/* ===================================================== */}
      {/* BODY */}
      {/* ===================================================== */}

      <Modal.Body className="p-4">

        {!breakdown.breakdown_event_id ? (

          <div className="text-center p-5">

            <Spinner
              animation="border"
            />

          </div>

        ) : (

          <>

            {/* ================================================= */}
            {/* TICKET BASIC INFORMATION */}
            {/* ================================================= */}

            <Row className="g-3 bd-ticket-facts">

              {[
                [
                  "Machine",
                  breakdown.machine_name ||
                  breakdown.machine_code
                ],

                [
                  "Status",
                  breakdown.status
                ],

                [
                  "Reason",
                  breakdown.reason_name
                ],

                [
                  "Started",
                  displayDateTime(
                    breakdown.breakdown_start_ts
                  )
                ],

                [
                  "Duration",
                  displayDuration(
                    breakdown.duration_sec
                  )
                ],

                [
                  "Technician",
                  breakdown.technician_name
                ],

                [
                  "Location",
                  breakdown.breakdown_location
                ],

                [
                  "Version",
                  `v${breakdown.version_no}`
                ],

              ].map(
                ([label, value]) => (

                  <Col
                    md={3}
                    key={label}
                  >

                    <small>
                      {label}
                    </small>

                    <strong>
                      {safe(value)}
                    </strong>

                  </Col>

                )
              )}

            </Row>


            <hr />


            {/* ================================================= */}
            {/* CLOSED BREAKDOWN */}
            {/* ================================================= */}

            {isClosed ? (

              <Row className="g-4">

                <Col lg={5}>

                  <Alert variant="success">

                    This breakdown is closed.

                    To continue working on this ticket,
                    reopen the breakdown first.

                  </Alert>


                  <Form
                    onSubmit={submit}
                    className="d-grid gap-3"
                  >

                    <Field
                      label="Action"
                      value="Reopen Breakdown"
                      disabled
                    />


                    <Field
                      label="Reopen Reason"
                      as="textarea"
                      required
                      value={form.reason}
                      onChange={(e) =>
                        setForm(
                          (old) => ({
                            ...old,
                            action:
                              "REOPEN_BREAKDOWN",
                            reason:
                              e.target.value,
                          })
                        )
                      }
                    />


                    <Field
                      label="Remark"
                      as="textarea"
                      value={form.remark}
                      onChange={(e) =>
                        setForm(
                          (old) => ({
                            ...old,
                            remark:
                              e.target.value,
                          })
                        )
                      }
                    />


                    <Button
                      type="submit"
                      className="bd-primary"
                      disabled={busy}
                      onClick={selectReopen}
                    >

                      {busy
                        ? "Processing..."
                        : "Reopen Breakdown"}

                    </Button>

                  </Form>

                </Col>


                {/* ============================================= */}
                {/* ACTIVITY TIMELINE */}
                {/* ============================================= */}

                <Col lg={7}>

                  <h6>
                    Repair activity timeline
                  </h6>


                  <div className="bd-timeline">

                    {!activities.length && (

                      <p className="text-muted">

                        No repair activity
                        recorded.

                      </p>

                    )}


                    {activities.map(
                      (row) => (

                        <div
                          className="bd-timeline-item"
                          key={
                            row.repair_event_id
                          }
                        >

                          <span />


                          <div>

                            <strong>

                              {String(
                                row.activity_type ||
                                "ACTIVITY"
                              ).replaceAll(
                                "_",
                                " "
                              )}

                            </strong>


                            <small>

                              {displayDateTime(
                                row.activity_ts
                              )}

                              {" · "}

                              {row.technician_name ||
                               "System"}

                            </small>


                            <p>

                              {row.action_description ||
                               row.root_cause_note ||
                               row.remark ||
                               `${row.old_status || ""} → ${row.new_status || ""}`}

                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                </Col>

              </Row>

            ) : (

              <>

                {/* ================================================= */}
                {/* MANUAL WORKFLOW STEP BAR */}
                {/* ================================================= */}

                <div className="mb-4">

                  <div className="d-flex justify-content-between align-items-center mb-2">

                    <div>

                      <h6 className="mb-1">
                        Breakdown Closing Workflow
                      </h6>

                      <small className="text-muted">

                        Save a step to move automatically to the next one.
                        You can still select any step manually or use Previous / Next.

                      </small>

                    </div>


                    <Button
                      size="sm"
                      variant={
                        form.action ===
                        "ESCALATE"
                          ? "danger"
                          : "outline-danger"
                      }
                      onClick={
                        selectEscalate
                      }
                    >

                      Escalate

                    </Button>

                  </div>


                  <div
                    className="d-flex flex-wrap gap-2"
                  >

                    {breakdownWorkflowSteps.map(
                      (step, index) => {

                        const selected =
                          form.action ===
                          step.action;

                        return (

                          <Button
                            key={
                              step.action
                            }
                            type="button"
                            size="sm"
                            variant={
                              selected
                                ? "primary"
                                : "outline-secondary"
                            }
                            className={
                              selected
                                ? "bd-primary"
                                : ""
                            }
                            onClick={() =>
                              selectStep(
                                index
                              )
                            }
                          >

                            {index + 1}.
                            {" "}
                            {step.shortLabel}

                          </Button>

                        );

                      }
                    )}

                  </div>

                </div>


                {/* ================================================= */}
                {/* CURRENT STEP */}
                {/* ================================================= */}

                <Row className="g-4">

                  <Col lg={5}>

                    <Card className="border-0 bg-light">

                      <Card.Body>

                        <div className="d-flex justify-content-between align-items-start mb-3">

                          <div>

                            <small className="text-muted">

                              {form.action ===
                              "ESCALATE"
                                ? "Special Action"
                                : `Step ${
                                    currentStep +
                                    1
                                  } of ${
                                    breakdownWorkflowSteps.length
                                  }`}

                            </small>


                            <h5 className="mb-0">

                              {form.action ===
                              "ESCALATE"

                                ? "Escalate Breakdown"

                                : currentStepInfo
                                    ?.label}

                            </h5>

                          </div>


                          <Badge
                            bg="primary"
                          >

                            {form.action
                              .replaceAll(
                                "_",
                                " "
                              )}

                          </Badge>

                        </div>


                        <Form
                          onSubmit={submit}
                          className="d-grid gap-3"
                        >

                          {/* ===================================== */}
                          {/* TECHNICIAN */}
                          {/* ===================================== */}

                          {fields.includes(
                            "technician_id"
                          ) && (

                            <Field
                              label="Technician"
                              as="select"
                              required
                              value={
                                form.technician_id
                              }
                              onChange={(e) => {

                                const id =
                                  e.target.value;

                                const technician =
                                  scopedTechnicians.find(
                                    (row) =>
                                      same(
                                        row.technician_id,
                                        id
                                      )
                                  );

                                setForm(
                                  (old) => ({
                                    ...old,

                                    technician_id:
                                      id,

                                    responsibility:
                                      technician
                                        ?.responsibility ||
                                      old.responsibility,
                                  })
                                );

                              }}
                            >

                              <option value="">
                                Select technician
                              </option>


                              {scopedTechnicians.map(
                                (row) => (

                                  <option
                                    key={
                                      row.technician_id
                                    }
                                    value={
                                      row.technician_id
                                    }
                                  >

                                    {row.technician_code
                                      ? `${row.technician_code} - `
                                      : ""}

                                    {row.technician_name}

                                  </option>

                                )
                              )}

                            </Field>

                          )}


                          {/* ===================================== */}
                          {/* RESPONSIBILITY */}
                          {/* ===================================== */}

                          {fields.includes(
                            "responsibility"
                          ) && (

                            <Field
                              label="Responsibility"
                              required
                              value={
                                form.responsibility
                              }
                              onChange={(e) =>
                                setForm(
                                  (old) => ({
                                    ...old,
                                    responsibility:
                                      e.target.value,
                                  })
                                )
                              }
                            />

                          )}


                          {/* ===================================== */}
                          {/* DIAGNOSIS */}
                          {/* ===================================== */}

                          {fields.includes(
                            "diagnosis"
                          ) && (

                            <Field
                              label="Diagnosis"
                              as="textarea"
                              required
                              value={
                                form.diagnosis
                              }
                              onChange={(e) =>
                                setForm(
                                  (old) => ({
                                    ...old,
                                    diagnosis:
                                      e.target.value,
                                  })
                                )
                              }
                              placeholder="Enter diagnosis..."
                            />

                          )}


                          {/* ===================================== */}
                          {/* ACTION TAKEN */}
                          {/* ===================================== */}

                          {fields.includes(
                            "action_taken"
                          ) && (

                            <Field
                              label="Action Taken"
                              as="textarea"
                              required
                              value={
                                form.action_taken
                              }
                              onChange={(e) =>
                                setForm(
                                  (old) => ({
                                    ...old,
                                    action_taken:
                                      e.target.value,
                                  })
                                )
                              }
                              placeholder="Enter repair action..."
                            />

                          )}


                          {/* ===================================== */}
                          {/* ROOT CAUSE */}
                          {/* ===================================== */}

                          {fields.includes(
                            "root_cause"
                          ) && (

                            <Field
                              label="Root Cause"
                              as="textarea"
                              required
                              value={
                                form.root_cause
                              }
                              onChange={(e) =>
                                setForm(
                                  (old) => ({
                                    ...old,
                                    root_cause:
                                      e.target.value,
                                  })
                                )
                              }
                              placeholder="Enter root cause..."
                            />

                          )}


                          {/* ===================================== */}
                          {/* RESTORE TIMESTAMP */}
                          {/* ===================================== */}

                          {fields.includes(
                            "restored_ts"
                          ) && (

                            <Field
                              label="Machine Restored Time"
                              type="datetime-local"
                              required
                              value={
                                form.restored_ts
                              }
                              onChange={(e) =>
                                setForm(
                                  (old) => ({
                                    ...old,
                                    restored_ts:
                                      e.target.value,
                                  })
                                )
                              }
                            />

                          )}


                          {/* ===================================== */}
                          {/* PRODUCTION RESUMED TIMESTAMP */}
                          {/* ===================================== */}

                          {fields.includes(
                            "production_resumed_ts"
                          ) && (

                            <Field
                              label="Production Resumed Time"
                              type="datetime-local"
                              required
                              value={
                                form.production_resumed_ts
                              }
                              onChange={(e) =>
                                setForm(
                                  (old) => ({
                                    ...old,

                                    production_resumed_ts:
                                      e.target.value,
                                  })
                                )
                              }
                            />

                          )}


                          {/* ===================================== */}
                          {/* CLOSE TIMESTAMP */}
                          {/* ===================================== */}

                          {fields.includes(
                            "breakdown_end_ts"
                          ) && (

                            <Field
                              label="Breakdown End Time"
                              type="datetime-local"
                              required
                              value={
                                form.breakdown_end_ts
                              }
                              onChange={(e) =>
                                setForm(
                                  (old) => ({
                                    ...old,

                                    breakdown_end_ts:
                                      e.target.value,
                                  })
                                )
                              }
                            />

                          )}


                          {/* ===================================== */}
                          {/* REMARK */}
                          {/* ===================================== */}

                          <Field
                            label="Remark"
                            as="textarea"
                            value={
                              form.remark
                            }
                            onChange={(e) =>
                              setForm(
                                (old) => ({
                                  ...old,

                                  remark:
                                    e.target.value,
                                })
                              )
                            }
                            placeholder="Optional remark..."
                          />


                          {/* ===================================== */}
                          {/* EXECUTE CURRENT ACTION */}
                          {/* ===================================== */}

                          <Button
                            type="submit"
                            className="bd-primary"
                            disabled={busy || submitting}
                          >

                            {busy || submitting
                              ? "Processing..."
                              : form.action ===
                                "ESCALATE"

                                ? "Execute Escalation"

                                : `Save ${
                                    currentStepInfo
                                      ?.label ||
                                    "Step"
                                  }`}

                          </Button>


                          {/* ===================================== */}
                          {/* MANUAL NAVIGATION */}
                          {/* ===================================== */}

                          {form.action !==
                            "ESCALATE" && (

                            <div className="d-flex gap-2">

                              <Button
                                type="button"
                                variant="outline-secondary"
                                className="w-50"
                                disabled={
                                  currentStep ===
                                  0
                                }
                                onClick={
                                  previousStep
                                }
                              >

                                ← Previous Step

                              </Button>


                              <Button
                                type="button"
                                variant="outline-primary"
                                className="w-50"
                                disabled={
                                  currentStep ===
                                  breakdownWorkflowSteps.length -
                                    1
                                }
                                onClick={
                                  nextStep
                                }
                              >

                                Next Step →

                              </Button>

                            </div>

                          )}

                        </Form>

                      </Card.Body>

                    </Card>

                  </Col>


                  {/* ================================================= */}
                  {/* REPAIR ACTIVITY TIMELINE */}
                  {/* ================================================= */}

                  <Col lg={7}>

                    <h6>
                      Repair activity timeline
                    </h6>


                    <div className="bd-timeline">

                      {!activities.length && (

                        <p className="text-muted">

                          No repair activity
                          recorded.

                        </p>

                      )}


                      {activities.map(
                        (row) => (

                          <div
                            className="bd-timeline-item"
                            key={
                              row.repair_event_id
                            }
                          >

                            <span />


                            <div>

                              <strong>

                                {String(
                                  row.activity_type ||
                                  "ACTIVITY"
                                ).replaceAll(
                                  "_",
                                  " "
                                )}

                              </strong>


                              <small>

                                {displayDateTime(
                                  row.activity_ts
                                )}

                                {" · "}

                                {row.technician_name ||
                                 "System"}

                              </small>


                              <p>

                                {row.action_description ||
                                 row.root_cause_note ||
                                 row.remark ||
                                 `${row.old_status || ""} → ${row.new_status || ""}`}

                              </p>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  </Col>

                </Row>

              </>

            )}

          </>

        )}

      </Modal.Body>

    </Modal>

  );

}




function MasterModal({ show, onHide, type, lookups, onSave, busy }) {
  const [form, setForm] = useState(type === "reason" ? reasonInitial : technicianInitial);
  useEffect(() => { if (show) setForm(type === "reason" ? { ...reasonInitial } : { ...technicianInitial }); }, [show, type]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  return <Modal show={show} onHide={onHide} size="lg" centered><Form onSubmit={(e) => { e.preventDefault(); onSave(type, { ...form, escalation_rank: type === "technician" ? Number(form.escalation_rank) : undefined }); }}>
    <Modal.Header closeButton className="bd-modal-header"><Modal.Title>Add {type === "reason" ? "Breakdown Reason" : "Technician"}</Modal.Title></Modal.Header>
    <Modal.Body className="p-4"><Row className="g-3">
      <Col md={6}><Field label="Company" as="select" required value={form.company_id} onChange={(e) => set("company_id", e.target.value)}><option value="">Select company</option>{lookups.companies.map((row) => <option key={row.company_id} value={row.company_id}>{row.company_name || row.company_code}</option>)}</Field></Col>
      {type === "reason" ? <>
        <Col md={6}><Field label="Reason Code" required value={form.reason_code} onChange={(e) => set("reason_code", e.target.value)} /></Col>
        <Col md={6}><Field label="Reason Name" required value={form.reason_name} onChange={(e) => set("reason_name", e.target.value)} /></Col>
        <Col md={6}><Field label="Category" required value={form.category} onChange={(e) => set("category", e.target.value)} /></Col>
        <Col md={12}><Field label="Description" as="textarea" value={form.description} onChange={(e) => set("description", e.target.value)} /></Col>
        <Col md={4}><Field label="Default Priority" as="select" value={form.default_priority} onChange={(e) => set("default_priority", e.target.value)}>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((x) => <option key={x}>{x}</option>)}</Field></Col>
        <Col md={4}><Field label="Default Severity" as="select" value={form.default_severity} onChange={(e) => set("default_severity", e.target.value)}>{["MINOR", "MAJOR", "CRITICAL"].map((x) => <option key={x}>{x}</option>)}</Field></Col>
        <Col md={4} className="d-flex align-items-end gap-3 pb-2"><Form.Check type="switch" label="Planned" checked={form.is_planned} onChange={(e) => set("is_planned", e.target.checked)} /><Form.Check type="switch" label="Availability" checked={form.affects_availability} onChange={(e) => set("affects_availability", e.target.checked)} /></Col>
      </> : <>
        <Col md={6}><Field label="Plant" as="select" value={form.plant_id} onChange={(e) => set("plant_id", e.target.value)}><option value="">All plants</option>{lookups.plants.filter((row) => !form.company_id || !row.company_id || same(row.company_id, form.company_id)).map((row) => <option key={row.plant_id || row.shop_id} value={row.plant_id || row.shop_id}>{row.plant_name || row.shop_name}</option>)}</Field></Col>
        <Col md={6}><Field label="Technician Code" required value={form.technician_code} onChange={(e) => set("technician_code", e.target.value)} /></Col>
        <Col md={6}><Field label="Technician Name" required value={form.technician_name} onChange={(e) => set("technician_name", e.target.value)} /></Col>
        <Col md={6}><Field label="Skill Category" required value={form.skill_category} onChange={(e) => set("skill_category", e.target.value)} /></Col>
        <Col md={6}><Field label="Responsibility" required value={form.responsibility} onChange={(e) => set("responsibility", e.target.value)} /></Col>
        <Col md={4}><Field label="Mobile No." value={form.mobile_no} onChange={(e) => set("mobile_no", e.target.value)} /></Col>
        <Col md={5}><Field label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Col>
        <Col md={3}><Field label="Escalation Rank" type="number" min="1" value={form.escalation_rank} onChange={(e) => set("escalation_rank", e.target.value)} /></Col>
      </>}
    </Row></Modal.Body>
    <Modal.Footer><Button variant="secondary" onClick={onHide}>Cancel</Button><Button type="submit" className="bd-primary" disabled={busy}>Save</Button></Modal.Footer>
  </Form></Modal>;
}

function EscalationModal({ show, onHide, lookups, reasons, technicians, onSave, busy }) {
  const [form, setForm] = useState(escalationInitial);
  useEffect(() => { if (show) setForm({ ...escalationInitial }); }, [show]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  return <Modal show={show} onHide={onHide} size="xl" centered><Form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, escalation_level: Number(form.escalation_level), threshold_min: Number(form.threshold_min), repeat_interval_min: Number(form.repeat_interval_min), rule_config: { basis: form.threshold_basis } }); }}>
    <Modal.Header closeButton className="bd-modal-header"><Modal.Title>Add Escalation Rule</Modal.Title></Modal.Header>
    <Modal.Body className="p-4"><Alert variant="light" className="bd-help">Leave plant, line, machine or reason blank to create a broader rule. The backend selects the most specific matching rule.</Alert><Row className="g-3">
      <ScopeFields form={form} setForm={setForm} lookups={lookups} optional companyRequired />
      <Col md={4}><Field label="Breakdown Reason" as="select" value={form.breakdown_reason_id} onChange={(e) => set("breakdown_reason_id", e.target.value)}><option value="">All reasons</option>{reasons.map((row) => <option key={row.breakdown_reason_id} value={row.breakdown_reason_id}>{row.reason_name}</option>)}</Field></Col>
      <Col md={2}><Field label="Severity" as="select" required value={form.severity} onChange={(e) => set("severity", e.target.value)}>{["MINOR", "MAJOR", "CRITICAL"].map((x) => <option key={x}>{x}</option>)}</Field></Col>
      <Col md={2}><Field label="Level" type="number" min="1" required value={form.escalation_level} onChange={(e) => set("escalation_level", e.target.value)} /></Col>
      <Col md={2}><Field label="Threshold (min)" type="number" min="1" required value={form.threshold_min} onChange={(e) => set("threshold_min", e.target.value)} /></Col>
      <Col md={2}><Field label="Repeat (min)" type="number" min="1" value={form.repeat_interval_min} onChange={(e) => set("repeat_interval_min", e.target.value)} /></Col>
      <Col md={4}><Field label="Threshold Basis" as="select" value={form.threshold_basis} onChange={(e) => set("threshold_basis", e.target.value)}>{["BREAKDOWN_START", "ACKNOWLEDGED", "REPAIR_STARTED"].map((x) => <option key={x}>{x.replaceAll("_", " ")}</option>)}</Field></Col>
      <Col md={4}><Field label="Escalate To" as="select" value={form.technician_id} onChange={(e) => set("technician_id", e.target.value)}><option value="">No fixed technician</option>{technicians.map((row) => <option key={row.technician_id} value={row.technician_id}>{row.technician_name}</option>)}</Field></Col>
      <Col md={4}><Field label="Responsibility" required value={form.responsibility} onChange={(e) => set("responsibility", e.target.value)} /></Col>
      <Col md={12}><Form.Label className="bd-label">Notification Channels</Form.Label><div className="d-flex gap-4">{["IN_APP", "EMAIL", "SMS", "WHATSAPP"].map((channel) => <Form.Check key={channel} label={channel} checked={form.notification_channels.includes(channel)} onChange={(e) => set("notification_channels", e.target.checked ? [...form.notification_channels, channel] : form.notification_channels.filter((x) => x !== channel))} />)}</div></Col>
    </Row></Modal.Body>
    <Modal.Footer><Button variant="secondary" onClick={onHide}>Cancel</Button><Button type="submit" className="bd-primary" disabled={busy}>Save Rule</Button></Modal.Footer>
  </Form></Modal>;
}

export default function BreakdownMaintenance() {
  const queryClient = useQueryClient();
  const [view, setView] = useState(VIEW_RUNTIME);
  const [filters, setFilters] = useState(loadFilters);
  const [applied, setApplied] = useState(loadFilters);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [masterType, setMasterType] = useState("");
  const [showEscalation, setShowEscalation] = useState(false);
  const [ticketId, setTicketId] = useState("");

  useEffect(() => {
    window.localStorage.setItem(FILTER_KEY, JSON.stringify(filters));
    const timer = window.setTimeout(() => setApplied({ ...filters }), 250);
    return () => window.clearTimeout(timer);
  }, [filters]);

  const companiesQ = useLookup("companies", "/company-master/master", ["company_master", "companies", "master"]);
  const plantsQ = useLookup("plants", "/plant-shop-master/master", ["plant_master", "plants", "shops", "master"]);
  const linesQ = useLookup("lines", "/line-master/master", ["line_master", "lines", "master"]);
  const machinesQ = useLookup("machines", "/machine-master/master", ["machine_master", "machines", "master"]);
  const shiftsQ = useLookup("shifts", "/shift-calendar/master", ["shift_master", "shifts", "master"]);
  const lookups = { companies: companiesQ.data || [], plants: plantsQ.data || [], lines: linesQ.data || [], machines: machinesQ.data || [], shifts: shiftsQ.data || [] };

  const reasonsQ = useQuery({ queryKey: ["breakdown-management", "reasons"], queryFn: () => getBreakdownMaster({ type: "reason" }) });
  const techniciansQ = useQuery({ queryKey: ["breakdown-management", "technicians"], queryFn: () => getBreakdownMaster({ type: "technician" }) });
  const reasons = asRows(reasonsQ.data, ["reasons", "master"]);
  const technicians = asRows(techniciansQ.data, ["technicians", "master"]);

  const runtimeQ = useQuery({
    queryKey: ["breakdown-management", "runtime", applied],
    queryFn: () => getBreakdownRuntime(applied),
    enabled: view === VIEW_RUNTIME,
    refetchInterval: view === VIEW_RUNTIME ? 10000 : false,
    refetchIntervalInBackground: true,
  });
  const reportQ = useQuery({ queryKey: ["breakdown-management", "report", applied], queryFn: () => getBreakdownReport(applied), enabled: view === VIEW_REPORT });
  const configQ = useQuery({ queryKey: ["breakdown-management", "config"], queryFn: () => getEscalationConfig({}), enabled: view === VIEW_ESCALATION });
  const dashboardQ = useQuery({ queryKey: ["breakdown-management", "dashboard", applied], queryFn: () => getBreakdownDashboard(applied), refetchInterval: 10000 });
  const ticketQ = useQuery({ queryKey: ["breakdown-management", "ticket", ticketId], queryFn: () => getBreakdownById(ticketId), enabled: Boolean(ticketId), refetchInterval: ticketId ? 10000 : false });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["breakdown-management"] });
  const mutation = useMutation({
    mutationFn: ({ kind, ...args }) => {
      if (kind === "execute") return executeBreakdownAction(args.data);
      if (kind === "master") return createBreakdownMaster(args.type, args.data);
      if (kind === "config") return createEscalationConfig(args.data);
      if (kind === "deactivate-master") return deactivateBreakdownMaster(args.type, args.id);
      if (kind === "deactivate-config") return deactivateEscalationConfig(args.id);
      if (kind === "scheduler") return runBreakdownScheduler();
      throw new Error("Unsupported operation");
    },
    onSuccess: (_, variables) => {
      setError(""); setMessage("Saved successfully."); invalidate();
      if (variables.kind === "execute" && variables.data.action === "CREATE_BREAKDOWN") setShowBreakdown(false);
      if (variables.kind === "execute" && variables.data.action !== "CREATE_BREAKDOWN") queryClient.invalidateQueries({ queryKey: ["breakdown-management", "ticket", ticketId] });
      if (variables.kind === "master") setMasterType("");
      if (variables.kind === "config") setShowEscalation(false);
    },
    onError: (err) => { setMessage(""); setError(errorText(err)); },
  });

  const runtimeRows = asRows(runtimeQ.data?.data, ["runtime", "breakdowns"]);
  const reportRows = asRows(reportQ.data?.data, ["report", "breakdowns"]);
  const configRows = asRows(configQ.data, ["config", "escalations"]);
  const currentRows = view === VIEW_REPORT ? reportRows : runtimeRows;
  const visibleRows = currentRows.filter((row) => !search || JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  const summary = dashboardQ.data || {};

  const filteredReasons = useMemo(() => reasons.filter((row) => !search || `${row.reason_code} ${row.reason_name} ${row.category}`.toLowerCase().includes(search.toLowerCase())), [reasons, search]);
  const filteredTechs = useMemo(() => technicians.filter((row) => !search || `${row.technician_code} ${row.technician_name} ${row.skill_category}`.toLowerCase().includes(search.toLowerCase())), [technicians, search]);

  const setFilter = (key, value, clear = []) => setFilters((old) => ({ ...old, [key]: value, ...Object.fromEntries(clear.map((x) => [x, ""])) }));
  const download = async () => {
    try {
      const result = await exportBreakdownReport(applied, "CSV");
      const rows = result?.data || reportRows;
      if (!rows?.length) throw new Error("No report rows to export.");
      const headers = Object.keys(rows[0]);
      const quote = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
      const csv = [headers.map(quote).join(","), ...rows.map((row) => headers.map((key) => quote(row[key])).join(","))].join("\n");
      const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `breakdown-report-${localDate()}.csv`; anchor.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(errorText(err)); }
  };

  const plants = lookups.plants.filter((row) => !filters.company_id || !row.company_id || same(row.company_id, filters.company_id));
  const lines = lookups.lines.filter((row) => !filters.plant_id || !row.plant_id || same(row.plant_id, filters.plant_id));
  const machines = lookups.machines.filter((row) => !filters.line_id || !row.line_id || same(row.line_id, filters.line_id));

  return <div className="bd-page">
    <div className="bd-header"><div><h2>Breakdown Management</h2><p>Live breakdown tickets, repair workflow, technician assignment and escalation.</p></div><div className="d-flex gap-2 flex-wrap"><Button variant="outline-primary" onClick={() => invalidate()}><ArrowClockwise /> Refresh</Button><Button variant="outline-primary" onClick={() => mutation.mutate({ kind: "scheduler" })}><ClockHistory /> Run Escalation</Button><Button className="bd-primary" onClick={() => setShowBreakdown(true)}><Plus /> Add Breakdown</Button></div></div>

    {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
    {message && <Alert variant="success" dismissible onClose={() => setMessage("")}>{message}</Alert>}

    <Row className="g-3 mb-3">
      <Col md={6} xl={3}><SummaryCard icon={ExclamationTriangleFill} value={Number(summary.open_count || 0)} label="Open Breakdowns" tone="red" /></Col>
      <Col md={6} xl={3}><SummaryCard icon={Clipboard2Pulse} value={Number(summary.closed_count || 0)} label="Closed Breakdowns" tone="green" /></Col>
      <Col md={6} xl={3}><SummaryCard icon={WrenchAdjustable} value={Number(summary.critical_open_count || 0)} label="Critical Open" tone="orange" /></Col>
      <Col md={6} xl={3}><SummaryCard icon={ClockHistory} value={displayDuration(summary.current_mttr_sec)} label="Current MTTR" /></Col>
    </Row>

    <Card className="bd-main-card"><Card.Body>
      <div className="bd-tabs">
        {[[VIEW_RUNTIME, "Live Runtime"], [VIEW_REASON, "Breakdown Reasons"], [VIEW_TECHNICIAN, "Technicians"], [VIEW_ESCALATION, "Escalation Rules"], [VIEW_REPORT, "Report"]].map(([key, label]) => <Button key={key} variant={view === key ? "primary" : "outline-secondary"} className={view === key ? "bd-primary" : ""} onClick={() => { setView(key); setSearch(""); }}>{label}</Button>)}
      </div>

      {(view === VIEW_RUNTIME || view === VIEW_REPORT) && <>
        <div className="bd-live-note">{view === VIEW_RUNTIME ? "Live tickets refresh automatically every 10 seconds. Use View / Action to follow the complete repair workflow." : "Report uses the selected date and scope filters and can be exported to CSV."}</div>
        <div className="bd-filter"><Row className="g-2">
          <Col md={4} lg={2}><Field label="Company" as="select" value={filters.company_id} onChange={(e) => setFilter("company_id", e.target.value, ["plant_id", "line_id", "machine_id"])}><option value="">All</option>{lookups.companies.map((row) => <option key={row.company_id} value={row.company_id}>{row.company_name || row.company_code}</option>)}</Field></Col>
          <Col md={4} lg={2}><Field label="Plant" as="select" value={filters.plant_id} onChange={(e) => setFilter("plant_id", e.target.value, ["line_id", "machine_id"])}><option value="">All</option>{plants.map((row) => <option key={row.plant_id || row.shop_id} value={row.plant_id || row.shop_id}>{row.plant_name || row.shop_name}</option>)}</Field></Col>
          <Col md={4} lg={2}><Field label="Line" as="select" value={filters.line_id} onChange={(e) => setFilter("line_id", e.target.value, ["machine_id"])}><option value="">All</option>{lines.map((row) => <option key={row.line_id} value={row.line_id}>{row.line_name || row.line_code}</option>)}</Field></Col>
          <Col md={4} lg={2}><Field label="Machine" as="select" value={filters.machine_id} onChange={(e) => setFilter("machine_id", e.target.value)}><option value="">All</option>{machines.map((row) => <option key={row.machine_id} value={row.machine_id}>{row.machine_name || row.machine_code}</option>)}</Field></Col>
          <Col md={4} lg={2}><Field label="Status" as="select" value={filters.status} onChange={(e) => setFilter("status", e.target.value)}><option value="">All</option><option>OPEN</option><option>CLOSED</option></Field></Col>
          <Col md={4} lg={2}><Field label="Business Date" type="date" value={filters.business_date} onChange={(e) => setFilter("business_date", e.target.value)} /></Col>
          <Col md={6} lg={3}><div className="bd-search"><Search /><Form.Control placeholder="Search visible tickets" value={search} onChange={(e) => setSearch(e.target.value)} /></div></Col>
          <Col md={6} lg={3} className="d-flex align-items-end gap-2"><Button variant="outline-primary" className="w-100" onClick={() => setFilters({ ...emptyFilters })}>Reset Filters</Button>{view === VIEW_REPORT && <Button variant="outline-primary" onClick={download}><Download /></Button>}</Col>
        </Row></div>
        <div className="table-responsive"><Table hover className="bd-table"><thead><tr><th>Date</th><th>Machine</th><th>Shift</th><th>Start</th><th>Duration</th><th>Reason</th><th>Location</th><th>Technician</th><th>Severity</th><th>Status</th><th>Activities</th><th>Action</th></tr></thead><tbody>
          {(runtimeQ.isLoading || reportQ.isLoading) && <tr><td colSpan="12" className="text-center p-5"><Spinner animation="border" /></td></tr>}
          {!visibleRows.length && !(runtimeQ.isLoading || reportQ.isLoading) && <tr><td colSpan="12" className="text-center text-muted p-5">No breakdown record found.</td></tr>}
          {visibleRows.map((row) => <tr key={row.breakdown_event_id}><td>{safe(String(row.business_date || "").slice(0, 10))}</td><td><strong>{row.machine_name || row.machine_code}</strong></td><td>{row.shift_name || row.shift_id}</td><td>{displayDateTime(row.breakdown_start_ts)}</td><td>{displayDuration(row.duration_sec)}</td><td>{row.reason_name}</td><td>{row.breakdown_location}</td><td>{row.technician_name}</td><td><StateBadge value={row.severity} /></td><td><StateBadge value={row.status} /></td><td>{row.activity_count ?? "-"}</td><td><Button size="sm" variant="outline-primary" className="bd-view-action" onClick={() => setTicketId(row.breakdown_event_id)}><Eye aria-hidden="true" /><span>View / Action</span></Button></td></tr>)}
        </tbody></Table></div>
      </>}

      {view === VIEW_REASON && <><div className="bd-toolbar"><div className="bd-search"><Search /><Form.Control placeholder="Search reasons" value={search} onChange={(e) => setSearch(e.target.value)} /></div><Button className="bd-primary" onClick={() => setMasterType("reason")}><Plus /> Add Reason</Button></div><div className="table-responsive"><Table hover className="bd-table"><thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Priority</th><th>Severity</th><th>Planned</th><th>Availability</th><th>Version</th><th>Status</th><th>Action</th></tr></thead><tbody>{filteredReasons.map((row) => <tr key={row.breakdown_reason_id}><td>{row.reason_code}</td><td>{row.reason_name}</td><td>{row.category}</td><td>{row.default_priority}</td><td>{row.default_severity}</td><td>{row.is_planned ? "Yes" : "No"}</td><td>{row.affects_availability ? "Yes" : "No"}</td><td>v{row.version_no}</td><td><StateBadge value={row.status} /></td><td><Button size="sm" variant="outline-danger" disabled={row.status === "INACTIVE"} onClick={() => mutation.mutate({ kind: "deactivate-master", type: "reason", id: row.breakdown_reason_id })}>Deactivate</Button></td></tr>)}</tbody></Table></div></>}

      {view === VIEW_TECHNICIAN && <><div className="bd-toolbar"><div className="bd-search"><Search /><Form.Control placeholder="Search technicians" value={search} onChange={(e) => setSearch(e.target.value)} /></div><Button className="bd-primary" onClick={() => setMasterType("technician")}><Plus /> Add Technician</Button></div><div className="table-responsive"><Table hover className="bd-table"><thead><tr><th>Code</th><th>Name</th><th>Plant</th><th>Skill</th><th>Responsibility</th><th>Contact</th><th>Rank</th><th>Version</th><th>Status</th><th>Action</th></tr></thead><tbody>{filteredTechs.map((row) => <tr key={row.technician_id}><td>{row.technician_code}</td><td>{row.technician_name}</td><td>{row.plant_name || "All"}</td><td>{row.skill_category}</td><td>{row.responsibility}</td><td>{row.mobile_no || row.email || "-"}</td><td>{row.escalation_rank}</td><td>v{row.version_no}</td><td><StateBadge value={row.status} /></td><td><Button size="sm" variant="outline-danger" disabled={row.status === "INACTIVE"} onClick={() => mutation.mutate({ kind: "deactivate-master", type: "technician", id: row.technician_id })}>Deactivate</Button></td></tr>)}</tbody></Table></div></>}

      {view === VIEW_ESCALATION && <><div className="bd-toolbar"><span className="text-muted">Dynamic threshold rules are resolved from the most specific scope.</span><Button className="bd-primary" onClick={() => setShowEscalation(true)}><Plus /> Add Escalation Rule</Button></div><div className="table-responsive"><Table hover className="bd-table"><thead><tr><th>Scope</th><th>Reason</th><th>Severity</th><th>Level</th><th>Threshold</th><th>Repeat</th><th>Basis</th><th>Technician</th><th>Channels</th><th>Version</th><th>Action</th></tr></thead><tbody>{configRows.map((row) => <tr key={row.escalation_config_id}><td>{row.machine_name || row.line_name || row.plant_name || row.company_name}</td><td>{row.reason_name || "All"}</td><td>{row.severity}</td><td>{row.escalation_level}</td><td>{row.threshold_min} min</td><td>{row.repeat_interval_min ? `${row.repeat_interval_min} min` : "Once"}</td><td>{row.rule_config?.basis || "BREAKDOWN_START"}</td><td>{row.technician_name || row.responsibility}</td><td>{(row.notification_channels || []).join(", ")}</td><td>v{row.version_no}</td><td><Button size="sm" variant="outline-danger" disabled={!row.is_active} onClick={() => mutation.mutate({ kind: "deactivate-config", id: row.escalation_config_id })}>Deactivate</Button></td></tr>)}</tbody></Table></div></>}
    </Card.Body></Card>

    <AddBreakdownModal show={showBreakdown} onHide={() => setShowBreakdown(false)} lookups={lookups} reasons={reasons.filter((x) => x.status === "ACTIVE")} technicians={technicians.filter((x) => x.status === "ACTIVE")} onSave={(data) => mutation.mutate({ kind: "execute", data })} busy={mutation.isPending} />
    <TicketModal
      show={Boolean(ticketId)}
      onHide={() => setTicketId("")}
      ticket={ticketQ.data}
      technicians={technicians.filter((x) => x.status === "ACTIVE")}
      onAction={async (data) => {
        await mutation.mutateAsync({ kind: "execute", data });

        // Refresh the ticket before allowing the next step to be saved,
        // so expected_version and the activity timeline are current.
        await ticketQ.refetch();
      }}
      busy={mutation.isPending}
    />
    <MasterModal show={Boolean(masterType)} onHide={() => setMasterType("")} type={masterType || "reason"} lookups={lookups} onSave={(type, data) => mutation.mutate({ kind: "master", type, data })} busy={mutation.isPending} />
    <EscalationModal show={showEscalation} onHide={() => setShowEscalation(false)} lookups={lookups} reasons={reasons.filter((x) => x.status === "ACTIVE")} technicians={technicians.filter((x) => x.status === "ACTIVE")} onSave={(data) => mutation.mutate({ kind: "config", data })} busy={mutation.isPending} />
  </div>;
}
