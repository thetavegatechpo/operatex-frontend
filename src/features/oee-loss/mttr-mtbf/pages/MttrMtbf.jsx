
import Table from '../../../../shared/components/SmartTable.jsx';
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
  Spinner} from "react-bootstrap";
import {
  ArrowClockwise,
  BarChartLine,
  Calculator,
  ClockHistory,
  Download,
  GearFill,
  PencilSquare,
  Plus,
  Search,
} from "react-bootstrap-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";
import mttrMtbfService, {
  createReliabilityFormula,
  deactivateReliabilityConfig,
  executeReliability,
  exportReliabilityReport,
  getReliabilityConfig,
  getReliabilityDashboard,
  getReliabilityMaster,
  getReliabilityReport,
  getReliabilityRuntime,
  runReliabilityScheduler,
  saveReliabilityConfig,
  updateReliabilityConfig,
  updateReliabilityFormula,
} from "../api/mttrMtbf.service.js";
import "./MttrMtbf.css";

const VIEW_CONFIG = "CONFIG";
const VIEW_FORMULA = "FORMULA";
const VIEW_RUNTIME = "RUNTIME";
const VIEW_REPORT = "REPORT";

const localDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const configInitial = {
  reliability_config_id: "",
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  mttr_formula_id: "",
  mtbf_formula_id: "",
  calculation_granularity: "DAILY",
  mttr_start_basis: "REPAIR_STARTED",
  mttr_end_basis: "RESTORED",
  mtbf_uptime_start_basis: "PRODUCTION_RESUMED",
  included_severities_text: "MINOR,MAJOR,CRITICAL",
  minimum_failure_duration_sec: 0,
  include_planned: false,
  zero_failure_policy: "NO_RESULT",
  decimal_places: 2,
  timezone: "Asia/Kolkata",
  is_active: true,
};

const formulaInitial = {
  formula_id: "",
  company_id: "",
  formula_code: "FR0005",
  formula_name: "Mean Time To Repair",
  formula_type: "MTTR",
  expression_text: "total_repair_time_sec / valid_repair_count",
  expression_ast_text: JSON.stringify(
    { operator: "DIVIDE", left: "total_repair_time_sec", right: "valid_repair_count" },
    null,
    2,
  ),
  input_schema_text: JSON.stringify(
    { total_repair_time_sec: "NUMBER", valid_repair_count: "INTEGER" },
    null,
    2,
  ),
  output_unit: "SECONDS",
  decimal_places: 2,
  min_output: 0,
  max_output: "",
  is_system_formula: false,
  status: "ACTIVE",
};

const filterInitial = {
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  shift_id: "",
  business_date: localDate(),
  calculation_status: "",
  from_date: "",
  to_date: "",
  limit: 100,
  offset: 0,
};

const executeInitial = {
  reliability_config_id: "",
  business_date: localDate(),
  shift_id: "",
  window_start_ts: "",
  window_end_ts: "",
};

const FILTER_STORAGE_KEY = "operatex.mttr_mtbf.filters.v1";
const hasValue = (value) => value !== undefined && value !== null && value !== "";
const sameId = (a, b) => String(a ?? "") === String(b ?? "");
const boolValue = (value) =>
  value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
const safe = (value) => (hasValue(value) ? String(value) : "-");
const numeric = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const rowsFrom = (response, keys = []) => {
  const body = response?.data ?? response;
  const data = body?.data ?? body;
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return [];
};

const useLookup = (key, url, keys) =>
  useQuery({
    queryKey: ["mttr-mtbf", "lookup", key],
    queryFn: async () => rowsFrom(await api.get(url), keys),
    staleTime: 60000,
  });

const companyId = (row) => row?.company_id ?? "";
const plantId = (row) => row?.plant_id ?? row?.shop_id ?? "";
const lineId = (row) => row?.line_id ?? "";
const machineId = (row) => row?.machine_id ?? "";
const label = (row, fields, fallback) =>
  fields.map((field) => row?.[field]).find(hasValue) ?? fallback;

const errorText = (error) => {
  const data = error?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors
      .map((item) => (typeof item === "string" ? item : item?.message || item?.code))
      .filter(Boolean)
      .join(" | ");
  }
  return data?.message || error?.message || "Request failed.";
};

const displayDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const displayDuration = (seconds) => {
  if (!hasValue(seconds)) return "-";
  let value = Math.max(0, Math.round(Number(seconds)));
  const days = Math.floor(value / 86400);
  value %= 86400;
  const hours = Math.floor(value / 3600);
  value %= 3600;
  const minutes = Math.floor(value / 60);
  const secs = value % 60;
  return [days && `${days}d`, hours && `${hours}h`, minutes && `${minutes}m`, `${secs}s`]
    .filter(Boolean)
    .join(" ");
};

const uniqueKey = (prefix, row, index, fields) =>
  `${prefix}-${fields.map((field) => row?.[field] ?? "").join("-")}-${index}`;

const parseJson = (value, field) => {
  try {
    const result = JSON.parse(value || "{}");
    if (!result || Array.isArray(result) || typeof result !== "object")
      throw new Error(`${field} must contain a JSON object.`);
    return result;
  } catch (error) {
    if (error.message?.includes("must contain")) throw error;
    throw new Error(`${field} contains invalid JSON.`);
  }
};

const loadSavedFilters = () => {
  if (typeof window === "undefined") return { ...filterInitial };
  try {
    const saved = JSON.parse(window.localStorage.getItem(FILTER_STORAGE_KEY) || "{}");
    return { ...filterInitial, ...saved, business_date: saved.business_date || localDate() };
  } catch (_) {
    return { ...filterInitial };
  }
};

const downloadCsv = (rows, filename) => {
  if (!rows.length) throw new Error("No MTTR / MTBF records found to export.");
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const normalized = typeof value === "object" && value !== null ? JSON.stringify(value) : value;
    return `"${String(normalized ?? "").replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const StatusBadge = ({ value }) => {
  const text = String(value || "-").toUpperCase();
  const className =
    text === "ACTIVE" || text === "FINAL"
      ? "reliability-badge success"
      : text === "PARTIAL"
        ? "reliability-badge warning"
        : text === "RECALCULATED"
          ? "reliability-badge info"
          : "reliability-badge neutral";
  return <span className={className}>{text}</span>;
};

const SelectField = ({ label: fieldLabel, value, onChange, children, required, disabled }) => (
  <Form.Group>
    <Form.Label className="reliability-label">
      {fieldLabel}{required && <span className="reliability-required"> *</span>}
    </Form.Label>
    <Form.Select value={value} onChange={onChange} required={required} disabled={disabled}>
      {children}
    </Form.Select>
  </Form.Group>
);

function ScopeFilters({ filters, setFilters, lookups, report = false }) {
  const set = (field, value, clears = []) =>
    setFilters((current) => ({
      ...current,
      [field]: value,
      ...Object.fromEntries(clears.map((key) => [key, ""])),
    }));
  const plants = lookups.plants.filter(
    (row) => !filters.company_id || !companyId(row) || sameId(companyId(row), filters.company_id),
  );
  const lines = lookups.lines.filter(
    (row) => !filters.plant_id || !plantId(row) || sameId(plantId(row), filters.plant_id),
  );
  const machines = lookups.machines.filter(
    (row) => !filters.line_id || !lineId(row) || sameId(lineId(row), filters.line_id),
  );
  const shifts = lookups.shifts.filter(
    (row) => !filters.line_id || !row.line_id || sameId(row.line_id, filters.line_id),
  );

  return (
    <div className="reliability-filter-panel">
      <Row className="g-3">
        <Col xl={2} md={4}>
          <SelectField label="Company" value={filters.company_id} onChange={(e) => set("company_id", e.target.value, ["plant_id", "line_id", "machine_id"])}>
            <option value="">All</option>
            {lookups.companies.map((row, index) => (
              <option key={uniqueKey("company", row, index, ["company_id"])} value={companyId(row)}>
                {label(row, ["company_name", "company_code"], companyId(row))}
              </option>
            ))}
          </SelectField>
        </Col>
        <Col xl={2} md={4}>
          <SelectField label="Plant" value={filters.plant_id} onChange={(e) => set("plant_id", e.target.value, ["line_id", "machine_id"])}>
            <option value="">All</option>
            {plants.map((row, index) => (
              <option key={uniqueKey("plant", row, index, ["plant_id", "shop_id"])} value={plantId(row)}>
                {label(row, ["plant_name", "shop_name", "plant_code"], plantId(row))}
              </option>
            ))}
          </SelectField>
        </Col>
        <Col xl={2} md={4}>
          <SelectField label="Line" value={filters.line_id} onChange={(e) => set("line_id", e.target.value, ["machine_id", "shift_id"])}>
            <option value="">All</option>
            {lines.map((row, index) => (
              <option key={uniqueKey("line", row, index, ["line_id"])} value={lineId(row)}>
                {label(row, ["line_name", "line_code"], lineId(row))}
              </option>
            ))}
          </SelectField>
        </Col>
        <Col xl={2} md={4}>
          <SelectField label="Machine" value={filters.machine_id} onChange={(e) => set("machine_id", e.target.value)}>
            <option value="">All</option>
            {machines.map((row, index) => (
              <option key={uniqueKey("machine", row, index, ["machine_id"])} value={machineId(row)}>
                {label(row, ["machine_name", "machine_code"], machineId(row))}
              </option>
            ))}
          </SelectField>
        </Col>
        {!report && (
          <>
            <Col xl={2} md={4}>
              <SelectField label="Shift" value={filters.shift_id} onChange={(e) => set("shift_id", e.target.value)}>
                <option value="">All</option>
                {shifts.map((row, index) => (
                  <option key={uniqueKey("shift", row, index, ["shift_id"])} value={row.shift_id}>
                    {row.shift_name || `Shift ${row.shift_no || row.shift_id}`}
                  </option>
                ))}
              </SelectField>
            </Col>
            <Col xl={2} md={4}>
              <Form.Group>
                <Form.Label className="reliability-label">Business Date</Form.Label>
                <Form.Control type="date" value={filters.business_date} onChange={(e) => set("business_date", e.target.value)} />
              </Form.Group>
            </Col>
          </>
        )}
        {report && (
          <>
            <Col xl={2} md={4}>
              <Form.Group>
                <Form.Label className="reliability-label">From Date</Form.Label>
                <Form.Control type="date" value={filters.from_date} onChange={(e) => set("from_date", e.target.value)} />
              </Form.Group>
            </Col>
            <Col xl={2} md={4}>
              <Form.Group>
                <Form.Label className="reliability-label">To Date</Form.Label>
                <Form.Control type="date" value={filters.to_date} onChange={(e) => set("to_date", e.target.value)} />
              </Form.Group>
            </Col>
          </>
        )}
        <Col xl={2} md={4}>
          <SelectField label="Status" value={filters.calculation_status} onChange={(e) => set("calculation_status", e.target.value)}>
            <option value="">All</option>
            <option value="PARTIAL">Partial</option>
            <option value="FINAL">Final</option>
            <option value="RECALCULATED">Recalculated</option>
          </SelectField>
        </Col>
        <Col xl={2} md={4} className="d-flex align-items-end">
          <Button className="reliability-outline-button w-100" onClick={() => setFilters({ ...filterInitial, business_date: localDate() })}>
            Reset Filters
          </Button>
        </Col>
      </Row>
    </div>
  );
}

function ResultTable({ rows, loading, onRecalculate }) {
  return (
    <div className="reliability-table-wrap">
      <Table responsive hover className="reliability-table mb-0">
        <thead>
          <tr>
            <th>Window</th><th>Machine</th><th>Failures</th><th>Valid Repairs</th>
            <th>Repair Time</th><th>Uptime</th><th>MTTR</th><th>MTBF</th>
            <th>Failure Rate/Hr</th><th>Status</th><th>Version</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={12} className="reliability-empty"><Spinner size="sm" /> Loading results...</td></tr>}
          {!loading && !rows.length && <tr><td colSpan={12} className="reliability-empty">No MTTR / MTBF result found.</td></tr>}
          {!loading && rows.map((row, index) => (
            <tr key={uniqueKey("result", row, index, ["mttr_mtbf_result_id", "calculation_version"])}>
              <td><strong>{displayDateTime(row.window_start_ts)}</strong><small>{displayDateTime(row.window_end_ts)}</small></td>
              <td><strong>{row.machine_name || row.machine_code || "Scope Total"}</strong><small>{row.line_name || row.plant_name || "-"}</small></td>
              <td>{safe(row.breakdown_count)}</td>
              <td>{safe(row.valid_repair_count)}</td>
              <td>{displayDuration(row.total_repair_time_sec)}</td>
              <td>{displayDuration(row.total_uptime_sec)}</td>
              <td className="metric-cell mttr">{displayDuration(row.mttr_sec)}</td>
              <td className="metric-cell mtbf">{displayDuration(row.mtbf_sec)}</td>
              <td>{hasValue(row.failure_rate_per_hour) ? Number(row.failure_rate_per_hour).toFixed(4) : "-"}</td>
              <td><StatusBadge value={row.calculation_status} /></td>
              <td>v{row.calculation_version}</td>
              <td>
                {onRecalculate && (
                  <Button className="reliability-icon-button" title="Recalculate" onClick={() => onRecalculate(row)}>
                    <ArrowClockwise />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default function MttrMtbf() {
  const queryClient = useQueryClient();
  const [view, setView] = useState(VIEW_RUNTIME);
  const [filters, setFilters] = useState(loadSavedFilters);
  const [reportFilters, setReportFilters] = useState({ ...filterInitial, business_date: "", from_date: localDate(), to_date: localDate() });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [configModal, setConfigModal] = useState(false);
  const [formulaModal, setFormulaModal] = useState(false);
  const [executeModal, setExecuteModal] = useState(false);
  const [configForm, setConfigForm] = useState({ ...configInitial });
  const [formulaForm, setFormulaForm] = useState({ ...formulaInitial });
  const [executeForm, setExecuteForm] = useState({ ...executeInitial });

  useEffect(() => {
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const companiesQ = useLookup("companies", "/company-master/master", ["companies", "company_master", "master"]);
  const plantsQ = useLookup("plants", "/plant-shop-master/master", ["plants", "shops", "plant_master", "master"]);
  const linesQ = useLookup("lines", "/line-master/master", ["lines", "line_master", "master"]);
  const machinesQ = useLookup("machines", "/machine-master/master", ["machines", "machine_master", "master"]);
  const shiftsQ = useLookup("shifts", "/shift-calendar/master", ["shifts", "shift_master", "master"]);
  const lookups = useMemo(() => ({
    companies: companiesQ.data || [], plants: plantsQ.data || [], lines: linesQ.data || [],
    machines: machinesQ.data || [], shifts: shiftsQ.data || [],
  }), [companiesQ.data, plantsQ.data, linesQ.data, machinesQ.data, shiftsQ.data]);

  const formulaQ = useQuery({
    queryKey: ["mttr-mtbf", "master"],
    queryFn: () => getReliabilityMaster({}),
  });
  const configQ = useQuery({
    queryKey: ["mttr-mtbf", "config"],
    queryFn: () => getReliabilityConfig({}),
  });
  const runtimeParams = useMemo(() => mttrMtbfService.cleanParams(filters), [filters]);
  const runtimeQ = useQuery({
    queryKey: ["mttr-mtbf", "runtime", runtimeParams],
    queryFn: () => getReliabilityRuntime(runtimeParams),
    refetchInterval: view === VIEW_RUNTIME ? 10000 : false,
  });
  const dashboardQ = useQuery({
    queryKey: ["mttr-mtbf", "dashboard", runtimeParams],
    queryFn: () => getReliabilityDashboard(runtimeParams),
    refetchInterval: view === VIEW_RUNTIME ? 10000 : false,
  });
  const reportParams = useMemo(() => mttrMtbfService.cleanParams(reportFilters), [reportFilters]);
  const reportQ = useQuery({
    queryKey: ["mttr-mtbf", "report", reportParams],
    queryFn: () => getReliabilityReport(reportParams),
    enabled: view === VIEW_REPORT,
  });

  const formulas = mttrMtbfService.rowsFromResponse(formulaQ.data, ["formulas", "formula_master", "master"]);
  const configs = mttrMtbfService.rowsFromResponse(configQ.data, ["reliability_configs", "config"]);
  const runtimeRows = mttrMtbfService.rowsFromResponse(runtimeQ.data?.data, ["mttr_mtbf_results", "runtime"]);
  const reportRows = mttrMtbfService.rowsFromResponse(reportQ.data?.data, ["mttr_mtbf_results", "report"]);
  const dashboard = dashboardQ.data || {};

  const filteredConfigs = configs.filter((row) =>
    !search || [row.company_name, row.plant_name, row.line_name, row.machine_name, row.machine_code]
      .some((value) => String(value || "").toLowerCase().includes(search.toLowerCase())),
  );
  const filteredFormulas = formulas.filter((row) =>
    !search || [row.formula_code, row.formula_name, row.formula_type, row.expression_text]
      .some((value) => String(value || "").toLowerCase().includes(search.toLowerCase())),
  );

  const notifyError = (error) => setMessage({ type: "danger", text: errorText(error) });
  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["mttr-mtbf"] });
  };

  const configMutation = useMutation({
    mutationFn: async (form) => {
      const payload = {
        company_id: form.company_id,
        plant_id: form.plant_id || undefined,
        line_id: form.line_id || undefined,
        machine_id: form.machine_id || undefined,
        mttr_formula_id: form.mttr_formula_id,
        mtbf_formula_id: form.mtbf_formula_id,
        calculation_granularity: form.calculation_granularity,
        mttr_start_basis: form.mttr_start_basis,
        mttr_end_basis: form.mttr_end_basis,
        mtbf_uptime_start_basis: form.mtbf_uptime_start_basis,
        included_severities: form.included_severities_text.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean),
        minimum_failure_duration_sec: Number(form.minimum_failure_duration_sec),
        include_planned: Boolean(form.include_planned),
        zero_failure_policy: form.zero_failure_policy,
        decimal_places: Number(form.decimal_places),
        rule_config: { timezone: form.timezone || "Asia/Kolkata" },
        is_active: Boolean(form.is_active),
      };
      return form.reliability_config_id
        ? updateReliabilityConfig(form.reliability_config_id, payload)
        : saveReliabilityConfig(payload);
    },
    onSuccess: async () => {
      setConfigModal(false);
      setMessage({ type: "success", text: "Reliability configuration saved successfully." });
      await invalidateAll();
    },
    onError: notifyError,
  });

  const formulaMutation = useMutation({
    mutationFn: async (form) => {
      const payload = {
        company_id: form.company_id,
        formula_code: form.formula_code.trim().toUpperCase(),
        formula_name: form.formula_name.trim(),
        formula_type: form.formula_type,
        expression_text: form.expression_text.trim(),
        expression_ast: parseJson(form.expression_ast_text, "Expression AST"),
        input_schema: parseJson(form.input_schema_text, "Input schema"),
        output_unit: form.output_unit,
        decimal_places: Number(form.decimal_places),
        min_output: hasValue(form.min_output) ? Number(form.min_output) : undefined,
        max_output: hasValue(form.max_output) ? Number(form.max_output) : undefined,
        is_system_formula: Boolean(form.is_system_formula),
        status: form.status,
      };
      return form.formula_id
        ? updateReliabilityFormula(form.formula_id, payload)
        : createReliabilityFormula(payload);
    },
    onSuccess: async () => {
      setFormulaModal(false);
      setMessage({ type: "success", text: "Reliability formula saved successfully." });
      await invalidateAll();
    },
    onError: notifyError,
  });

  const executeMutation = useMutation({
    mutationFn: (form) => {
      const config = configs.find((row) => sameId(row.reliability_config_id, form.reliability_config_id));
      const payload = {
        reliability_config_id: form.reliability_config_id,
        business_date: form.business_date || undefined,
        source_system: "MES_UI_RECALCULATION",
      };
      if (config?.calculation_granularity === "SHIFT") payload.shift_id = Number(form.shift_id);
      if (config?.calculation_granularity === "CUSTOM") {
        payload.window_start_ts = form.window_start_ts;
        payload.window_end_ts = form.window_end_ts;
      }
      return executeReliability(payload);
    },
    onSuccess: async () => {
      setExecuteModal(false);
      setMessage({ type: "success", text: "MTTR / MTBF calculation completed." });
      setView(VIEW_RUNTIME);
      await invalidateAll();
    },
    onError: notifyError,
  });

  const schedulerMutation = useMutation({
    mutationFn: runReliabilityScheduler,
    onSuccess: async () => {
      setMessage({ type: "success", text: "Reliability scheduler cycle completed." });
      await invalidateAll();
    },
    onError: notifyError,
  });

  const openNewConfig = () => {
    setConfigForm({ ...configInitial, company_id: filters.company_id || "" });
    setConfigModal(true);
  };
  const openEditConfig = (row) => {
    setConfigForm({
      ...configInitial,
      ...row,
      included_severities_text: (row.included_severities || []).join(","),
      include_planned: boolValue(row.include_planned),
      is_active: boolValue(row.is_active),
      timezone: row.rule_config?.timezone || "Asia/Kolkata",
    });
    setConfigModal(true);
  };
  const openNewFormula = () => {
    setFormulaForm({ ...formulaInitial, company_id: filters.company_id || "" });
    setFormulaModal(true);
  };
  const openEditFormula = (row) => {
    setFormulaForm({
      ...formulaInitial,
      ...row,
      expression_ast_text: JSON.stringify(row.expression_ast || {}, null, 2),
      input_schema_text: JSON.stringify(row.input_schema || {}, null, 2),
      is_system_formula: boolValue(row.is_system_formula),
      max_output: row.max_output ?? "",
    });
    setFormulaModal(true);
  };
  const openCalculate = (row = null) => {
    setExecuteForm({
      ...executeInitial,
      reliability_config_id: row?.reliability_config_id || configs.find((item) => item.is_active)?.reliability_config_id || "",
      business_date: row?.business_date ? String(row.business_date).slice(0, 10) : filters.business_date || localDate(),
      shift_id: row?.shift_id || filters.shift_id || "",
    });
    setExecuteModal(true);
  };

  const selectedExecuteConfig = configs.find((row) => sameId(row.reliability_config_id, executeForm.reliability_config_id));
  const activeConfigCount = configs.filter((row) => boolValue(row.is_active)).length;
  const totalFailures = hasValue(dashboard.total_breakdown_count)
    ? numeric(dashboard.total_breakdown_count)
    : runtimeRows.reduce((sum, row) => sum + numeric(row.breakdown_count), 0);
  const averageMttr = hasValue(dashboard.average_mttr_sec)
    ? dashboard.average_mttr_sec
    : runtimeRows.length
      ? runtimeRows.reduce((sum, row) => sum + numeric(row.mttr_sec), 0) / runtimeRows.length
      : null;
  const averageMtbf = hasValue(dashboard.average_mtbf_sec)
    ? dashboard.average_mtbf_sec
    : runtimeRows.length
      ? runtimeRows.reduce((sum, row) => sum + numeric(row.mtbf_sec), 0) / runtimeRows.length
      : null;

  const performExport = async () => {
    try {
      const result = await exportReliabilityReport(reportParams, "CSV");
      const rows = Array.isArray(result?.rows) ? result.rows : reportRows;
      downloadCsv(rows, `mttr-mtbf-${reportFilters.from_date || "report"}-${reportFilters.to_date || localDate()}.csv`);
    } catch (error) { notifyError(error); }
  };

  return (
    <>

<div className="reliability-page">
      <section className="reliability-hero">
        <div>
          <p className="reliability-eyebrow">OEE &amp; Loss · Reliability Engine</p>
          <h1>MTTR / MTBF</h1>
          <p>Monitor repair efficiency, failure frequency and equipment reliability from closed breakdown evidence.</p>
        </div>
        <div className="reliability-actions">
          <Button className="reliability-outline-button" onClick={() => invalidateAll()}>
            <ArrowClockwise /> Refresh
          </Button>
          <Button className="reliability-outline-button" onClick={() => schedulerMutation.mutate()} disabled={schedulerMutation.isPending}>
            <ClockHistory /> Run Scheduler
          </Button>
          <Button className="reliability-primary-button" onClick={() => openCalculate()}>
            <Calculator /> Calculate Now
          </Button>
        </div>
      </section>

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Row className="g-3 reliability-summary-row">
        <Col xl={3} md={6}>
          <Card className="reliability-summary-card"><div className="summary-icon purple"><GearFill /></div><div><strong>{activeConfigCount}</strong><span>Active Configurations</span></div></Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="reliability-summary-card"><div className="summary-icon red"><ClockHistory /></div><div><strong>{displayDuration(averageMttr)}</strong><span>Average MTTR</span></div></Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="reliability-summary-card"><div className="summary-icon green"><BarChartLine /></div><div><strong>{displayDuration(averageMtbf)}</strong><span>Average MTBF</span></div></Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="reliability-summary-card"><div className="summary-icon amber"><Calculator /></div><div><strong>{totalFailures}</strong><span>Included Failures</span></div></Card>
        </Col>
      </Row>

      <section className="reliability-workspace">
        <div className="reliability-tabs">
          {[
            [VIEW_CONFIG, "Configuration"], [VIEW_FORMULA, "Formula Master"],
            [VIEW_RUNTIME, "Live Runtime"], [VIEW_REPORT, "Report"],
          ].map(([code, text]) => (
            <button key={code} type="button" className={view === code ? "active" : ""} onClick={() => setView(code)}>{text}</button>
          ))}
        </div>

        {view === VIEW_RUNTIME && (
          <>
            <div className="reliability-context">Live results refresh every 10 seconds. Only the newest calculation version for each configuration window is shown.</div>
            <ScopeFilters filters={filters} setFilters={setFilters} lookups={lookups} />
            <ResultTable rows={runtimeRows} loading={runtimeQ.isPending} onRecalculate={openCalculate} />
          </>
        )}

        {view === VIEW_REPORT && (
          <>
            <div className="reliability-toolbar justify-content-end">
              <Button className="reliability-outline-button" onClick={performExport}><Download /> Export CSV</Button>
            </div>
            <ScopeFilters filters={reportFilters} setFilters={setReportFilters} lookups={lookups} report />
            <ResultTable rows={reportRows} loading={reportQ.isPending} />
          </>
        )}

        {(view === VIEW_CONFIG || view === VIEW_FORMULA) && (
          <div className="reliability-toolbar">
            <div className="reliability-search"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search configuration or formula" /></div>
            <Button className="reliability-primary-button" onClick={view === VIEW_CONFIG ? openNewConfig : openNewFormula}>
              <Plus /> {view === VIEW_CONFIG ? "Add Configuration" : "Add Formula"}
            </Button>
          </div>
        )}

        {view === VIEW_CONFIG && (
          <div className="reliability-table-wrap">
            <Table responsive hover className="reliability-table mb-0">
              <thead><tr><th>Scope</th><th>Grain</th><th>MTTR Basis</th><th>MTBF Basis</th><th>Severities</th><th>Minimum Failure</th><th>Planned</th><th>Version</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {configQ.isPending && <tr><td colSpan={10} className="reliability-empty"><Spinner size="sm" /> Loading configurations...</td></tr>}
                {!configQ.isPending && !filteredConfigs.length && <tr><td colSpan={10} className="reliability-empty">No reliability configuration found.</td></tr>}
                {filteredConfigs.map((row, index) => (
                  <tr key={uniqueKey("config", row, index, ["reliability_config_id", "version_no"])}>
                    <td><strong>{row.machine_name || row.machine_code || row.line_name || row.plant_name || row.company_name}</strong><small>{[row.company_name, row.plant_name, row.line_name].filter(Boolean).join(" / ")}</small></td>
                    <td>{row.calculation_granularity}</td>
                    <td>{row.mttr_start_basis}<small>to {row.mttr_end_basis}</small></td>
                    <td>{row.mtbf_uptime_start_basis}</td>
                    <td>{(row.included_severities || []).join(", ")}</td>
                    <td>{displayDuration(row.minimum_failure_duration_sec)}</td>
                    <td>{boolValue(row.include_planned) ? "Included" : "Excluded"}</td>
                    <td>v{row.version_no}</td>
                    <td><StatusBadge value={boolValue(row.is_active) ? "ACTIVE" : "INACTIVE"} /></td>
                    <td className="action-cell">
                      <Button className="reliability-icon-button" onClick={() => openEditConfig(row)}><PencilSquare /></Button>
                      {boolValue(row.is_active) && (
                        <Button className="reliability-text-button danger" onClick={async () => {
                          if (!window.confirm("Deactivate this reliability configuration?")) return;
                          try { await deactivateReliabilityConfig(row.reliability_config_id); await invalidateAll(); }
                          catch (error) { notifyError(error); }
                        }}>Deactivate</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {view === VIEW_FORMULA && (
          <div className="reliability-table-wrap">
            <Table responsive hover className="reliability-table mb-0">
              <thead><tr><th>Company</th><th>Code</th><th>Name</th><th>Type</th><th>Expression</th><th>Unit</th><th>Precision</th><th>Version</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {formulaQ.isPending && <tr><td colSpan={10} className="reliability-empty"><Spinner size="sm" /> Loading formulas...</td></tr>}
                {!formulaQ.isPending && !filteredFormulas.length && <tr><td colSpan={10} className="reliability-empty">No MTTR / MTBF formula found.</td></tr>}
                {filteredFormulas.map((row, index) => (
                  <tr key={uniqueKey("formula", row, index, ["formula_id", "version_no"])}>
                    <td>{row.company_name || row.company_id}</td><td><strong>{row.formula_code}</strong></td><td>{row.formula_name}</td>
                    <td><Badge bg={row.formula_type === "MTTR" ? "danger" : "success"}>{row.formula_type}</Badge></td>
                    <td className="expression-cell">{row.expression_text}</td><td>{row.output_unit}</td><td>{row.decimal_places}</td><td>v{row.version_no}</td>
                    <td><StatusBadge value={row.status} /></td><td><Button className="reliability-icon-button" onClick={() => openEditFormula(row)}><PencilSquare /></Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </section>

      <Modal show={configModal} onHide={() => setConfigModal(false)} size="xl" centered className="reliability-modal">
        <Modal.Header closeButton><Modal.Title>{configForm.reliability_config_id ? "Create New Configuration Version" : "Add Reliability Configuration"}</Modal.Title></Modal.Header>
        <Form onSubmit={(event) => { event.preventDefault(); configMutation.mutate(configForm); }}>
          <Modal.Body>
            <div className="reliability-modal-note">Choose the scope and exact evidence bases. Missing configured timestamps are excluded; the engine never substitutes another timestamp.</div>
            <Row className="g-3">
              <Col md={6}><SelectField label="Company" required disabled={Boolean(configForm.reliability_config_id)} value={configForm.company_id} onChange={(e) => setConfigForm((current) => ({ ...current, company_id: e.target.value, plant_id: "", line_id: "", machine_id: "" }))}><option value="">Select company</option>{lookups.companies.map((row, index) => <option key={uniqueKey("cf-company", row, index, ["company_id"])} value={companyId(row)}>{label(row, ["company_name", "company_code"], companyId(row))}</option>)}</SelectField></Col>
              <Col md={6}><SelectField label="Plant" disabled={Boolean(configForm.reliability_config_id)} value={configForm.plant_id} onChange={(e) => setConfigForm((current) => ({ ...current, plant_id: e.target.value, line_id: "", machine_id: "" }))}><option value="">Company-wide</option>{lookups.plants.filter((row) => !configForm.company_id || !companyId(row) || sameId(companyId(row), configForm.company_id)).map((row, index) => <option key={uniqueKey("cf-plant", row, index, ["plant_id", "shop_id"])} value={plantId(row)}>{label(row, ["plant_name", "shop_name", "plant_code"], plantId(row))}</option>)}</SelectField></Col>
              <Col md={6}><SelectField label="Line" disabled={!configForm.plant_id || Boolean(configForm.reliability_config_id)} value={configForm.line_id} onChange={(e) => setConfigForm((current) => ({ ...current, line_id: e.target.value, machine_id: "" }))}><option value="">Plant-wide</option>{lookups.lines.filter((row) => !configForm.plant_id || !plantId(row) || sameId(plantId(row), configForm.plant_id)).map((row, index) => <option key={uniqueKey("cf-line", row, index, ["line_id"])} value={lineId(row)}>{label(row, ["line_name", "line_code"], lineId(row))}</option>)}</SelectField></Col>
              <Col md={6}><SelectField label="Machine" disabled={!configForm.line_id || Boolean(configForm.reliability_config_id)} value={configForm.machine_id} onChange={(e) => setConfigForm((current) => ({ ...current, machine_id: e.target.value }))}><option value="">Line-wide</option>{lookups.machines.filter((row) => !configForm.line_id || !lineId(row) || sameId(lineId(row), configForm.line_id)).map((row, index) => <option key={uniqueKey("cf-machine", row, index, ["machine_id"])} value={machineId(row)}>{label(row, ["machine_name", "machine_code"], machineId(row))}</option>)}</SelectField></Col>
              <Col md={6}><SelectField label="MTTR Formula" required value={configForm.mttr_formula_id} onChange={(e) => setConfigForm((current) => ({ ...current, mttr_formula_id: e.target.value }))}><option value="">Select MTTR formula</option>{formulas.filter((row) => row.formula_type === "MTTR" && row.status === "ACTIVE").map((row, index) => <option key={uniqueKey("mttr-formula", row, index, ["formula_id"])} value={row.formula_id}>{row.formula_code} - {row.formula_name}</option>)}</SelectField></Col>
              <Col md={6}><SelectField label="MTBF Formula" required value={configForm.mtbf_formula_id} onChange={(e) => setConfigForm((current) => ({ ...current, mtbf_formula_id: e.target.value }))}><option value="">Select MTBF formula</option>{formulas.filter((row) => row.formula_type === "MTBF" && row.status === "ACTIVE").map((row, index) => <option key={uniqueKey("mtbf-formula", row, index, ["formula_id"])} value={row.formula_id}>{row.formula_code} - {row.formula_name}</option>)}</SelectField></Col>
              <Col md={4}><SelectField label="Calculation Grain" value={configForm.calculation_granularity} onChange={(e) => setConfigForm((current) => ({ ...current, calculation_granularity: e.target.value }))}>{["SHIFT", "DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].map((value) => <option key={value}>{value}</option>)}</SelectField></Col>
              <Col md={4}><SelectField label="MTTR Start Basis" value={configForm.mttr_start_basis} onChange={(e) => setConfigForm((current) => ({ ...current, mttr_start_basis: e.target.value }))}>{["BREAKDOWN_STARTED", "TECHNICIAN_ASSIGNED", "REPAIR_STARTED"].map((value) => <option key={value}>{value}</option>)}</SelectField></Col>
              <Col md={4}><SelectField label="MTTR End Basis" value={configForm.mttr_end_basis} onChange={(e) => setConfigForm((current) => ({ ...current, mttr_end_basis: e.target.value }))}>{["REPAIR_COMPLETED", "RESTORED", "PRODUCTION_RESUMED"].map((value) => <option key={value}>{value}</option>)}</SelectField></Col>
              <Col md={4}><SelectField label="MTBF Uptime Start" value={configForm.mtbf_uptime_start_basis} onChange={(e) => setConfigForm((current) => ({ ...current, mtbf_uptime_start_basis: e.target.value }))}>{["WINDOW_START", "RESTORED", "PRODUCTION_RESUMED"].map((value) => <option key={value}>{value}</option>)}</SelectField></Col>
              <Col md={4}><Form.Group><Form.Label className="reliability-label">Included Severities</Form.Label><Form.Control value={configForm.included_severities_text} onChange={(e) => setConfigForm((current) => ({ ...current, included_severities_text: e.target.value }))} placeholder="MINOR,MAJOR,CRITICAL" /><Form.Text>Comma-separated values.</Form.Text></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label className="reliability-label">Minimum Failure Duration (sec)</Form.Label><Form.Control type="number" min="0" step="0.001" value={configForm.minimum_failure_duration_sec} onChange={(e) => setConfigForm((current) => ({ ...current, minimum_failure_duration_sec: e.target.value }))} /></Form.Group></Col>
              <Col md={4}><SelectField label="Zero Failure Policy" value={configForm.zero_failure_policy} onChange={(e) => setConfigForm((current) => ({ ...current, zero_failure_policy: e.target.value }))}><option value="NO_RESULT">No Result</option><option value="ZERO">Zero</option></SelectField></Col>
              <Col md={4}><Form.Group><Form.Label className="reliability-label">Decimal Places</Form.Label><Form.Control type="number" min="0" max="6" value={configForm.decimal_places} onChange={(e) => setConfigForm((current) => ({ ...current, decimal_places: e.target.value }))} /></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label className="reliability-label">Timezone</Form.Label><Form.Control value={configForm.timezone} onChange={(e) => setConfigForm((current) => ({ ...current, timezone: e.target.value }))} /></Form.Group></Col>
              <Col md={12} className="d-flex gap-4 pt-2"><Form.Check type="switch" label="Include planned breakdowns" checked={configForm.include_planned} onChange={(e) => setConfigForm((current) => ({ ...current, include_planned: e.target.checked }))} /><Form.Check type="switch" label="Active" checked={configForm.is_active} onChange={(e) => setConfigForm((current) => ({ ...current, is_active: e.target.checked }))} /></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setConfigModal(false)}>Cancel</Button><Button className="reliability-primary-button" type="submit" disabled={configMutation.isPending}>{configMutation.isPending ? "Saving..." : "Save Configuration"}</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={formulaModal} onHide={() => setFormulaModal(false)} size="lg" centered className="reliability-modal">
        <Modal.Header closeButton><Modal.Title>{formulaForm.formula_id ? "Create New Formula Version" : "Add Reliability Formula"}</Modal.Title></Modal.Header>
        <Form onSubmit={(event) => { event.preventDefault(); formulaMutation.mutate(formulaForm); }}>
          <Modal.Body><Row className="g-3">
            <Col md={6}><SelectField label="Company" required disabled={Boolean(formulaForm.formula_id)} value={formulaForm.company_id} onChange={(e) => setFormulaForm((current) => ({ ...current, company_id: e.target.value }))}><option value="">Select company</option>{lookups.companies.map((row, index) => <option key={uniqueKey("ff-company", row, index, ["company_id"])} value={companyId(row)}>{label(row, ["company_name", "company_code"], companyId(row))}</option>)}</SelectField></Col>
            <Col md={6}><SelectField label="Formula Type" value={formulaForm.formula_type} disabled={Boolean(formulaForm.formula_id)} onChange={(e) => {
              const type = e.target.value;
              setFormulaForm((current) => ({ ...current, formula_type: type, formula_code: type === "MTTR" ? "FR0005" : "FR0006", formula_name: type === "MTTR" ? "Mean Time To Repair" : "Mean Time Between Failures", expression_text: type === "MTTR" ? "total_repair_time_sec / valid_repair_count" : "total_uptime_sec / uptime_interval_count", expression_ast_text: JSON.stringify({ operator: "DIVIDE", left: type === "MTTR" ? "total_repair_time_sec" : "total_uptime_sec", right: type === "MTTR" ? "valid_repair_count" : "uptime_interval_count" }, null, 2) }));
            }}><option value="MTTR">MTTR</option><option value="MTBF">MTBF</option></SelectField></Col>
            <Col md={6}><Form.Group><Form.Label className="reliability-label">Formula Code</Form.Label><Form.Control required disabled={Boolean(formulaForm.formula_id)} value={formulaForm.formula_code} onChange={(e) => setFormulaForm((current) => ({ ...current, formula_code: e.target.value }))} /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label className="reliability-label">Formula Name</Form.Label><Form.Control required value={formulaForm.formula_name} onChange={(e) => setFormulaForm((current) => ({ ...current, formula_name: e.target.value }))} /></Form.Group></Col>
            <Col md={12}><Form.Group><Form.Label className="reliability-label">Expression</Form.Label><Form.Control required value={formulaForm.expression_text} onChange={(e) => setFormulaForm((current) => ({ ...current, expression_text: e.target.value }))} /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label className="reliability-label">Expression AST (JSON)</Form.Label><Form.Control as="textarea" rows={7} value={formulaForm.expression_ast_text} onChange={(e) => setFormulaForm((current) => ({ ...current, expression_ast_text: e.target.value }))} /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label className="reliability-label">Input Schema (JSON)</Form.Label><Form.Control as="textarea" rows={7} value={formulaForm.input_schema_text} onChange={(e) => setFormulaForm((current) => ({ ...current, input_schema_text: e.target.value }))} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label className="reliability-label">Output Unit</Form.Label><Form.Control value={formulaForm.output_unit} onChange={(e) => setFormulaForm((current) => ({ ...current, output_unit: e.target.value }))} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label className="reliability-label">Decimal Places</Form.Label><Form.Control type="number" min="0" max="6" value={formulaForm.decimal_places} onChange={(e) => setFormulaForm((current) => ({ ...current, decimal_places: e.target.value }))} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label className="reliability-label">Minimum</Form.Label><Form.Control type="number" value={formulaForm.min_output} onChange={(e) => setFormulaForm((current) => ({ ...current, min_output: e.target.value }))} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label className="reliability-label">Maximum</Form.Label><Form.Control type="number" value={formulaForm.max_output} onChange={(e) => setFormulaForm((current) => ({ ...current, max_output: e.target.value }))} /></Form.Group></Col>
            <Col md={6}><SelectField label="Status" value={formulaForm.status} onChange={(e) => setFormulaForm((current) => ({ ...current, status: e.target.value }))}><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="RETIRED">Retired</option></SelectField></Col>
            <Col md={6} className="d-flex align-items-end pb-2"><Form.Check type="switch" label="System formula" checked={formulaForm.is_system_formula} onChange={(e) => setFormulaForm((current) => ({ ...current, is_system_formula: e.target.checked }))} /></Col>
          </Row></Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setFormulaModal(false)}>Cancel</Button><Button className="reliability-primary-button" type="submit" disabled={formulaMutation.isPending}>{formulaMutation.isPending ? "Saving..." : "Save Formula"}</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={executeModal} onHide={() => setExecuteModal(false)} centered className="reliability-modal">
        <Modal.Header closeButton><Modal.Title>Calculate MTTR / MTBF</Modal.Title></Modal.Header>
        <Form onSubmit={(event) => { event.preventDefault(); executeMutation.mutate(executeForm); }}>
          <Modal.Body><div className="reliability-modal-note">The calculation uses only CLOSED breakdowns matching the selected configuration.</div><Row className="g-3">
            <Col md={12}><SelectField label="Reliability Configuration" required value={executeForm.reliability_config_id} onChange={(e) => setExecuteForm((current) => ({ ...current, reliability_config_id: e.target.value }))}><option value="">Select configuration</option>{configs.filter((row) => boolValue(row.is_active)).map((row, index) => <option key={uniqueKey("execute-config", row, index, ["reliability_config_id"])} value={row.reliability_config_id}>{row.machine_name || row.line_name || row.plant_name || row.company_name} · {row.calculation_granularity} · v{row.version_no}</option>)}</SelectField></Col>
            {selectedExecuteConfig?.calculation_granularity !== "CUSTOM" && <Col md={12}><Form.Group><Form.Label className="reliability-label">Business Date</Form.Label><Form.Control type="date" required value={executeForm.business_date} onChange={(e) => setExecuteForm((current) => ({ ...current, business_date: e.target.value }))} /></Form.Group></Col>}
            {selectedExecuteConfig?.calculation_granularity === "SHIFT" && <Col md={12}><SelectField label="Shift" required value={executeForm.shift_id} onChange={(e) => setExecuteForm((current) => ({ ...current, shift_id: e.target.value }))}><option value="">Select shift</option>{lookups.shifts.filter((row) => !selectedExecuteConfig.line_id || !row.line_id || sameId(row.line_id, selectedExecuteConfig.line_id)).map((row, index) => <option key={uniqueKey("execute-shift", row, index, ["shift_id"])} value={row.shift_id}>{row.shift_name || `Shift ${row.shift_no || row.shift_id}`}</option>)}</SelectField></Col>}
            {selectedExecuteConfig?.calculation_granularity === "CUSTOM" && <><Col md={12}><Form.Group><Form.Label className="reliability-label">Window Start</Form.Label><Form.Control type="datetime-local" required value={executeForm.window_start_ts} onChange={(e) => setExecuteForm((current) => ({ ...current, window_start_ts: e.target.value }))} /></Form.Group></Col><Col md={12}><Form.Group><Form.Label className="reliability-label">Window End</Form.Label><Form.Control type="datetime-local" required value={executeForm.window_end_ts} onChange={(e) => setExecuteForm((current) => ({ ...current, window_end_ts: e.target.value }))} /></Form.Group></Col></>}
          </Row></Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setExecuteModal(false)}>Cancel</Button><Button className="reliability-primary-button" type="submit" disabled={executeMutation.isPending}>{executeMutation.isPending ? "Calculating..." : "Calculate"}</Button></Modal.Footer>
        </Form>
      </Modal>
    </div>
</>
  );
}

