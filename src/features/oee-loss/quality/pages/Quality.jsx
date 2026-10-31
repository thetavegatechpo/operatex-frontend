import ScopeResults from '../../../../shared/design/ScopeResults.jsx';


import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/Quality/Quality.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  ProgressBar,
  Row,
  Spinner} from "react-bootstrap";
import {
  ArrowClockwise,
  BarChartLine,
  CheckCircleFill,
  ClockHistory,
  Download,
  GearFill,
  PencilSquare,
  Plus,
  Search,
} from "react-bootstrap-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";
import qualityService, {
  createQualityConfig,
  createQualityFormula,
  deactivateQualityConfig,
  executeQuality,
  exportQualityReport,
  getQualityConfig,
  getQualityMaster,
  getQualityReport,
  getQualityRuntime,
  recalculateQuality,
  updateQualityConfig,
  updateQualityFormula,
} from "../api/quality.service.js";

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
  quality_formula_config_id: "",
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  process_id: "",
  part_id: "",
  oee_config_id: "",
  formula_id: "",
  total_count_source: "PRODUCTION_EVENT",
  good_count_mode: "RESULT_STATUS",
  good_statuses_text: "OK, PASS, COMPLETED",
  reject_statuses_text: "NOK, FAIL, REJECTED",
  rework_policy: "FIRST_PASS_ONLY",
  cap_at_100: true,
  zero_total_count_policy: "NO_RESULT",
  decimal_places: 2,
  rule_config: {},
  is_active: true,
};

const formulaInitial = {
  formula_id: "",
  company_id: "",
  formula_code: "FR0003",
  formula_name: "Quality",
  expression_text: "(good_count / total_count) * 100",
  expression_ast: {
    op: "multiply",
    args: [
      {
        op: "divide",
        args: [
          { var: "good_count" },
          { var: "total_count" },
        ],
      },
      100,
    ],
  },
  expression_ast_text: JSON.stringify(
    {
      op: "multiply",
      args: [
        {
          op: "divide",
          args: [
            { var: "good_count" },
            { var: "total_count" },
          ],
        },
        100,
      ],
    },
    null,
    2,
  ),
  input_schema: {
    required: ["good_count", "total_count"],
  },
  decimal_places: 2,
  min_output: 0,
  max_output: 100,
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

const FILTER_STORAGE_KEY = "operatex.quality.filters.v1";
const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";
const sameId = (a, b) => String(a ?? "") === String(b ?? "");
const boolValue = (value) =>
  value === true || value === 1 || value === "1" ||
  String(value).toLowerCase() === "true";
const safe = (value) => (hasValue(value) ? String(value) : "-");

const loadSavedFilters = () => {
  if (typeof window === "undefined") return { ...filterInitial };
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(FILTER_STORAGE_KEY) || "{}",
    );
    return {
      ...filterInitial,
      ...saved,
      business_date: saved.business_date || localDate(),
    };
  } catch (_) {
    return { ...filterInitial };
  }
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
    queryKey: ["quality", "lookup", key],
    queryFn: async () => rowsFrom(await api.get(url), keys),
    staleTime: 60000,
  });

const companyId = (row) => row?.company_id ?? "";
const plantId = (row) => row?.plant_id ?? row?.shop_id ?? "";
const lineId = (row) => row?.line_id ?? "";
const machineId = (row) => row?.machine_id ?? "";
const companyLabel = (row) =>
  row?.company_name ?? row?.company_code ?? companyId(row);
const plantLabel = (row) =>
  row?.plant_name ?? row?.shop_name ?? row?.plant_code ?? plantId(row);
const lineLabel = (row) => row?.line_name ?? row?.line_code ?? lineId(row);
const machineLabel = (row) =>
  row?.machine_name ?? row?.machine_code ?? machineId(row);

const errorText = (error) => {
  const data = error?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.message || item?.code || JSON.stringify(item),
      )
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
  const value = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = Math.floor(value % 60);
  return [hours && `${hours}h`, minutes && `${minutes}m`, `${secs}s`]
    .filter(Boolean)
    .join(" ");
};

const downloadCsv = (rows, filename) => {
  if (!rows.length) throw new Error("No Quality records found to export.");
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const SelectField = ({ label, value, onChange, children, required, disabled }) => (
  <Form.Group>
    <Form.Label className="pf-label">
      {label}
      {required && <span className="pf-required"> *</span>}
    </Form.Label>
    <Form.Select
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
    >
      {children}
    </Form.Select>
  </Form.Group>
);

const StatusBadge = ({ value }) => {
  const text = String(value || "-").toUpperCase();
  const variant =
    text === "ACTIVE" || text === "FINAL"
      ? "success"
      : text === "PARTIAL"
        ? "warning"
        : text === "RECALCULATED"
          ? "info"
          : text === "NO_RESULT"
            ? "secondary"
            : "secondary";
  return (
    <Badge
      bg={variant}
      text={variant === "warning" || variant === "info" ? "dark" : undefined}
    >
      {text}
    </Badge>
  );
};

function ScopeFilters({ filters, setFilters, lookups, onClear, report }) {
  const set = (field, value, clears = []) =>
    setFilters((current) => ({
      ...current,
      [field]: value,
      ...Object.fromEntries(clears.map((key) => [key, ""])),
    }));

  const plants = lookups.plants.filter(
    (row) =>
      !filters.company_id || !companyId(row) ||
      sameId(companyId(row), filters.company_id),
  );
  const lines = lookups.lines.filter(
    (row) =>
      !filters.plant_id || !plantId(row) || sameId(plantId(row), filters.plant_id),
  );
  const machines = lookups.machines.filter(
    (row) =>
      !filters.line_id || !lineId(row) || sameId(lineId(row), filters.line_id),
  );
  const shifts = lookups.shifts.filter(
    (row) =>
      !filters.line_id || !row.line_id || sameId(row.line_id, filters.line_id),
  );

  return (
    <div className="pf-filter">
      <Row className="g-2">
        <Col lg={2} md={4}>
          <SelectField
            label="Company"
            value={filters.company_id}
            onChange={(e) =>
              set("company_id", e.target.value, ["plant_id", "line_id", "machine_id"])
            }
          >
            <option value="">All</option>
            {lookups.companies.map((row) => (
              <option key={companyId(row)} value={companyId(row)}>
                {companyLabel(row)}
              </option>
            ))}
          </SelectField>
        </Col>
        <Col lg={2} md={4}>
          <SelectField
            label="Plant"
            value={filters.plant_id}
            onChange={(e) =>
              set("plant_id", e.target.value, ["line_id", "machine_id"])
            }
          >
            <option value="">All</option>
            {plants.map((row) => (
              <option key={plantId(row)} value={plantId(row)}>
                {plantLabel(row)}
              </option>
            ))}
          </SelectField>
        </Col>
        <Col lg={2} md={4}>
          <SelectField
            label="Line"
            value={filters.line_id}
            onChange={(e) =>
              set("line_id", e.target.value, ["machine_id", "shift_id"])
            }
          >
            <option value="">All</option>
            {lines.map((row) => (
              <option key={lineId(row)} value={lineId(row)}>
                {lineLabel(row)}
              </option>
            ))}
          </SelectField>
        </Col>
        <Col lg={2} md={4}>
          <SelectField
            label="Machine"
            value={filters.machine_id}
            onChange={(e) => set("machine_id", e.target.value)}
          >
            <option value="">All</option>
            {machines.map((row) => (
              <option key={machineId(row)} value={machineId(row)}>
                {machineLabel(row)}
              </option>
            ))}
          </SelectField>
        </Col>
        <Col lg={2} md={4}>
          <SelectField
            label="Shift"
            value={filters.shift_id}
            onChange={(e) => set("shift_id", e.target.value)}
          >
            <option value="">All</option>
            {shifts.map((row) => (
              <option key={`shift-${row.shift_id}`} value={row.shift_id}>
                {row.shift_name || `Shift ${row.shift_no || row.shift_id}`}
              </option>
            ))}
          </SelectField>
        </Col>
        {!report && (
          <Col lg={2} md={4}>
            <Form.Group>
              <Form.Label className="pf-label">Business Date</Form.Label>
              <Form.Control
                type="date"
                value={filters.business_date}
                onChange={(e) => set("business_date", e.target.value)}
              />
            </Form.Group>
          </Col>
        )}
        {report && (
          <>
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="pf-label">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => set("from_date", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="pf-label">To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => set("to_date", e.target.value)}
                />
              </Form.Group>
            </Col>
          </>
        )}
        <Col lg={2} md={4}>
          <SelectField
            label="Status"
            value={filters.calculation_status}
            onChange={(e) => set("calculation_status", e.target.value)}
          >
            <option value="">All</option>
            <option value="PARTIAL">Partial</option>
            <option value="FINAL">Final</option>
            <option value="RECALCULATED">Recalculated</option>
            <option value="NO_RESULT">No Result</option>
          </SelectField>
        </Col>
        <Col lg={2} md={4} className="d-flex align-items-end">
          <Button className="pf-btn-outline w-100" onClick={onClear}>
            Reset Filters
          </Button>
        </Col>
      </Row>
    </div>
  );
}

function ResultTable({ rows, loading, onRecalculate, recalculatingId }) {
  return (
    <div className="pf-table-wrap">
      <Table responsive hover className="pf-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Machine</th>
            <th>Shift</th>
            <th>Total Count</th>
            <th>Good Count</th>
            <th>Reject Count</th>
            <th>Rework Count</th>
            <th>Quality Loss Qty</th>
            <th>Quality</th>
            <th>Production Events</th>
            <th>Rejection Events</th>
            <th>Status</th>
            <th>Version</th>
            <th>Last Source Event</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={15} className="pf-empty">
                <Spinner size="sm" className="me-2" />
                Loading Quality...
              </td>
            </tr>
          ) : !rows.length ? (
            <tr>
              <td colSpan={15} className="pf-empty">
                No Quality result found.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const value = Number(row.quality_pct || 0);
              const label = hasValue(row.quality_pct)
                ? `${Number(row.quality_pct).toFixed(2)}%`
                : "No result";
              const rowKey = row.quality_result_id ||
                `${row.machine_id}-${row.shift_id}-${row.calculation_version}-${index}`;
              const canRecalculate = ["FINAL", "RECALCULATED"].includes(
                String(row.calculation_status || "").toUpperCase(),
              );
              return (
                <tr key={rowKey}>
                  <td>{safe(String(row.business_date || "").slice(0, 10))}</td>
                  <td><strong>{safe(row.machine_name || row.machine_code)}</strong></td>
                  <td>{safe(row.shift_name || row.shift_id)}</td>
                  <td>{safe(row.total_count)}</td>
                  <td className="text-success fw-semibold">{safe(row.good_count)}</td>
                  <td className="text-danger fw-semibold">{safe(row.reject_count)}</td>
                  <td>{safe(row.rework_count)}</td>
                  <td className="text-danger fw-semibold">
                    {safe(row.quality_loss_qty)}
                  </td>
                  <td>
                    <div className="pf-percent">{label}</div>
                    <ProgressBar
                      now={Math.min(100, value)}
                      variant={value >= 85 ? "success" : "danger"}
                    />
                  </td>
                  <td>{safe(row.production_event_count)}</td>
                  <td>{safe(row.rejection_event_count)}</td>
                  <td><StatusBadge value={row.calculation_status} /></td>
                  <td>v{safe(row.calculation_version)}</td>
                  <td>{displayDateTime(row.source_event_max_ts)}</td>
                  <td>
                    {canRecalculate && (
                      <Button
                        size="sm"
                        className="pf-edit"
                        disabled={recalculatingId === row.quality_result_id}
                        onClick={() => onRecalculate(row)}
                      >
                        {recalculatingId === row.quality_result_id ? (
                          <Spinner size="sm" className="me-1" />
                        ) : (
                          <ArrowClockwise className="me-1" />
                        )}
                        Recalculate
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default function Quality() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState(VIEW_RUNTIME);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [configForm, setConfigForm] = useState(configInitial);
  const [formulaForm, setFormulaForm] = useState(formulaInitial);
  const [filters, setFilters] = useState(loadSavedFilters);
  const [applied, setApplied] = useState(loadSavedFilters);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setApplied(filters);
      window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filters]);

  const companiesQ = useLookup("companies", "/company-master/master", [
    "companies", "company_master", "master",
  ]);
  const plantsQ = useLookup("plants", "/plant-shop-master/master", [
    "plants", "shops", "plant_master", "master",
  ]);
  const linesQ = useLookup("lines", "/line-master/master", [
    "lines", "line_master", "master",
  ]);
  const machinesQ = useLookup("machines", "/machine-master/master", [
    "machines", "machine_master", "master",
  ]);
  const shiftsQ = useLookup("shifts", "/shift-calendar/master", [
    "shifts", "shift_master", "master",
  ]);
  const oeeConfigsQ = useLookup("oee-configs", "/availability/config", [
    "availability_configs", "config",
  ]);

  const masterQ = useQuery({
    queryKey: ["quality", "master"],
    queryFn: () => getQualityMaster(),
  });
  const configQ = useQuery({
    queryKey: ["quality", "config"],
    queryFn: () => getQualityConfig(),
  });
  const runtimeQ = useQuery({
    queryKey: ["quality", "runtime", applied],
    queryFn: () => getQualityRuntime(applied),
    refetchInterval: activeView === VIEW_RUNTIME ? 10000 : false,
  });
  const reportFilters = useMemo(
    () => ({ ...applied, business_date: "" }),
    [applied],
  );
  const reportQ = useQuery({
    queryKey: ["quality", "report", reportFilters],
    queryFn: () => getQualityReport(reportFilters),
    enabled: activeView === VIEW_REPORT,
  });

  const lookups = {
    companies: companiesQ.data || [],
    plants: plantsQ.data || [],
    lines: linesQ.data || [],
    machines: machinesQ.data || [],
    shifts: shiftsQ.data || [],
  };
  const formulas = qualityService.getQualityFormulaRows(masterQ.data);
  const configs = qualityService.getQualityConfigRows(configQ.data);
  const runtimeRows = qualityService.getQualityResultRows(runtimeQ.data?.data);
  const reportRows = qualityService.getQualityResultRows(reportQ.data?.data);
  const oeeConfigs = oeeConfigsQ.data || [];

  const filteredFormulas = formulas.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(search.toLowerCase()),
  );
  const filteredConfigs = configs.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(search.toLowerCase()),
  );

  const formOeeConfigs = oeeConfigs.filter((row) =>
    (!configForm.company_id || sameId(row.company_id, configForm.company_id)) &&
    (!configForm.plant_id || sameId(row.plant_id, configForm.plant_id)) &&
    (!configForm.line_id || sameId(row.line_id, configForm.line_id)) &&
    (!configForm.machine_id || sameId(row.machine_id, configForm.machine_id)),
  );
  const formFormulas = formulas.filter(
    (row) =>
      (!configForm.company_id || sameId(row.company_id, configForm.company_id)) &&
      String(row.status || "").toUpperCase() === "ACTIVE",
  );

  const averageQuality = runtimeRows.length
    ? runtimeRows.reduce((sum, row) => sum + Number(row.quality_pct || 0), 0) /
      runtimeRows.length
    : 0;
  const totalCount = runtimeRows.reduce(
    (sum, row) => sum + Number(row.total_count || 0),
    0,
  );
  const totalReject = runtimeRows.reduce(
    (sum, row) => sum + Number(row.reject_count || 0),
    0,
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["quality"] });
  };

  const configMutation = useMutation({
    mutationFn: async (form) => {
      const goodStatuses = String(form.good_statuses_text || "")
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);
      const rejectStatuses = String(form.reject_statuses_text || "")
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);
      const payload = {
        company_id: form.company_id,
        oee_config_id: form.oee_config_id,
        formula_id: form.formula_id,
        total_count_source: form.total_count_source,
        good_count_mode: form.good_count_mode,
        good_statuses: goodStatuses,
        reject_statuses: rejectStatuses,
        rework_policy: form.rework_policy,
        cap_at_100: boolValue(form.cap_at_100),
        zero_total_count_policy: form.zero_total_count_policy,
        decimal_places: Number(form.decimal_places),
        rule_config: form.rule_config || {},
        is_active: boolValue(form.is_active),
      };
      return form.quality_formula_config_id
        ? updateQualityConfig(form.quality_formula_config_id, payload)
        : createQualityConfig(payload);
    },
    onSuccess: () => {
      setShowConfig(false);
      setMessage("Quality configuration saved successfully.");
      setError("");
      invalidate();
    },
    onError: (err) => setError(errorText(err)),
  });

  const formulaMutation = useMutation({
    mutationFn: (form) => {
      const payload = {
        company_id: form.company_id,
        formula_code: form.formula_code,
        formula_name: form.formula_name,
        expression_text: form.expression_text,
        expression_ast: JSON.parse(form.expression_ast_text || "{}"),
        input_schema: form.input_schema,
        output_unit: "PERCENT",
        decimal_places: Number(form.decimal_places),
        min_output: Number(form.min_output),
        max_output: Number(form.max_output),
        status: form.status,
      };
      return form.formula_id
        ? updateQualityFormula(form.formula_id, payload)
        : createQualityFormula(payload);
    },
    onSuccess: () => {
      setShowFormula(false);
      setMessage("Quality formula saved successfully.");
      setError("");
      invalidate();
    },
    onError: (err) => setError(errorText(err)),
  });

  const recalculateMutation = useMutation({
    mutationFn: recalculateQuality,
    onSuccess: () => {
      setMessage("Quality recalculated successfully.");
      setError("");
      invalidate();
    },
    onError: (err) => setError(errorText(err)),
  });

  const calculateMutation = useMutation({
    mutationFn: () => executeQuality({
      company_id: filters.company_id,
      machine_id: filters.machine_id,
      shift_id: Number(filters.shift_id),
      business_date: filters.business_date,
      source_system: "MES_UI",
    }),
    onSuccess: () => {
      setMessage("Quality calculated successfully.");
      setError("");
      invalidate();
    },
    onError: (err) => setError(errorText(err)),
  });

  const openCreateConfig = () => {
    setConfigForm(configInitial);
    setShowConfig(true);
  };
  const openEditConfig = (row) => {
    setConfigForm({
      ...configInitial,
      ...row,
      good_statuses_text: Array.isArray(row.good_statuses)
        ? row.good_statuses.join(", ") : "",
      reject_statuses_text: Array.isArray(row.reject_statuses)
        ? row.reject_statuses.join(", ") : "",
    });
    setShowConfig(true);
  };
  const openCreateFormula = () => {
    setFormulaForm({ ...formulaInitial });
    setShowFormula(true);
  };
  const openEditFormula = (row) => {
    setFormulaForm({
      ...formulaInitial,
      ...row,
      expression_ast_text: JSON.stringify(row.expression_ast || {}, null, 2),
    });
    setShowFormula(true);
  };

  const selectOeeConfig = (id) => {
    const selected = oeeConfigs.find((row) => sameId(row.oee_config_id, id));
    setConfigForm((current) => ({
      ...current,
      oee_config_id: id,
      company_id: selected?.company_id || current.company_id,
      plant_id: selected?.plant_id || "",
      line_id: selected?.line_id || "",
      machine_id: selected?.machine_id || "",
      process_id: selected?.process_id || "",
      part_id: selected?.part_id || "",
      formula_id: selected?.quality_formula_id || current.formula_id,
    }));
  };

  const deactivate = async (row) => {
    if (!window.confirm("Deactivate this Quality configuration?")) return;
    try {
      await deactivateQualityConfig(row.quality_formula_config_id);
      setMessage("Quality configuration deactivated successfully.");
      invalidate();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const refresh = () => {
    setMessage("");
    setError("");
    invalidate();
  };
  const clearFilters = () => setFilters({ ...filterInitial });
  const canCalculate = Boolean(
    filters.company_id && filters.machine_id && filters.shift_id &&
      filters.business_date,
  );

  const exportReport = async () => {
    try {
      const result = await exportQualityReport(reportFilters, "CSV");
      const rows = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : reportRows;
      downloadCsv(rows, `quality-${localDate()}.csv`);
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <>


<div className="pf-page">
      <style>{`
        .pf-page{padding:22px;background:#f5f7fb;min-height:100vh}.pf-card{border:0;border-radius:14px;box-shadow:0 7px 25px rgba(33,45,70,.07)}.pf-title{margin:0;color:#18263b;font-weight:800}.pf-subtitle{color:#7b8496;font-size:14px}.pf-btn-primary{background:#314965!important;border-color:#314965!important;font-weight:600}.pf-btn-outline{background:#fff!important;border:1px solid #314965!important;color:#314965!important;font-weight:600}.pf-tabs{display:flex;gap:8px;flex-wrap:wrap}.pf-tab{border:1px solid #d9dce5;background:#fff;color:#566176;font-weight:600;padding:9px 16px;border-radius:8px}.pf-tab.active{border-color:#314965;background:#f1f4f8;color:#314965}.pf-stat{border:1px solid #e5e9f2;border-radius:12px;padding:15px;background:#fff;height:100%}.pf-stat-icon{width:42px;height:42px;border-radius:10px;background:#f1f4f8;color:#314965;display:flex;align-items:center;justify-content:center;font-size:19px}.pf-stat-value{font-size:20px;font-weight:800;color:#263449}.pf-stat-label{color:#758195;font-size:12px}.pf-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.pf-search{position:relative;width:340px;max-width:100%}.pf-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#8792a5}.pf-search input{padding-left:34px}.pf-table-wrap{border:1px solid #e4e7ee;border-radius:10px;overflow:auto}.pf-table{margin:0;white-space:nowrap}.pf-table thead th{background:#1c2d45;color:#fff;border-color:#1c2d45;font-size:12px;font-weight:700;padding:12px}.pf-table tbody td{vertical-align:middle;padding:11px 12px;color:#364152;font-size:13px}.pf-empty{text-align:center;color:#8a94a6!important;padding:30px!important}.pf-edit{background:#fff!important;border:1px solid #314965!important;color:#314965!important;font-size:12px;font-weight:600}.pf-delete{background:#fff!important;border:1px solid #dc3545!important;color:#dc3545!important;font-size:12px;font-weight:600}.pf-modal .modal-content{border:none;border-radius:12px;overflow:hidden}.pf-modal .modal-header{background:#1c2d45;color:#fff;border:none}.pf-modal .btn-close{filter:invert(1)}.pf-label{color:#354154;font-size:12px;font-weight:700;margin-bottom:5px}.pf-required{color:#dc3545}.pf-filter{padding:15px;border:1px solid #e5e9f2;border-radius:9px;background:#f9fafc;margin-bottom:15px}.pf-context{border:1px solid #f1cebc;background:#f6f8fa;color:#865038;border-radius:9px;padding:12px 14px;font-size:13px}.pf-percent{font-weight:700;font-size:14px;margin-bottom:4px}.pf-table .progress{height:5px;min-width:90px}@media(max-width:768px){.pf-page{padding:12px}.pf-search{width:100%}}
      `}</style>

      <Card className="pf-card mb-3">
        <Card.Body>
          <Row className="align-items-center g-3">
            <Col lg={7}>
              <h4 className="pf-title">Quality</h4>
              <div className="pf-subtitle">
                Live machine Quality from production result statuses and
                rejection events.
              </div>
            </Col>
            <Col lg={5}>
              <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                <Button className="pf-btn-outline" onClick={refresh}>
                  <ArrowClockwise className="me-1" /> Refresh
                </Button>
                <Button
                  className="pf-btn-outline"
                  onClick={() => setActiveView(VIEW_RUNTIME)}
                >
                  <BarChartLine className="me-1" /> Live Runtime
                </Button>
                <Button
                  className="pf-btn-primary"
                  disabled={!canCalculate || calculateMutation.isPending}
                  onClick={() => calculateMutation.mutate()}
                >
                  {calculateMutation.isPending && <Spinner size="sm" className="me-1" />}
                  Calculate Now
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {message && (
        <Alert variant="success" dismissible onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      

      <Card className="pf-card">
        <Card.Body>
          <div className="pf-tabs mb-3">
            {[
              [VIEW_CONFIG, "Configuration"],
              [VIEW_FORMULA, "Formula Master"],
              [VIEW_RUNTIME, "Live Runtime"],
              [VIEW_REPORT, "Report"],
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={`pf-tab ${activeView === key ? "active" : ""}`}
                onClick={() => { setActiveView(key); setSearch(""); }}
              >
                {label}
              </button>
            ))}
          </div>

          {(activeView === VIEW_CONFIG || activeView === VIEW_FORMULA) && (
            <div className="pf-toolbar mb-3">
              <div className="pf-search">
                <Search />
                <Form.Control
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search configuration or formula..."
                />
              </div>
              <Button
                className="pf-btn-primary"
                onClick={activeView === VIEW_CONFIG ? openCreateConfig : openCreateFormula}
              >
                <Plus className="me-1" />
                {activeView === VIEW_CONFIG ? "Add Configuration" : "Add Formula"}
              </Button>
            </div>
          )}

          {activeView === VIEW_CONFIG && (
            <div className="pf-table-wrap">
              <Table responsive hover className="pf-table">
                <thead><tr>
                  <th>Company</th><th>Plant</th><th>Line</th><th>Machine</th>
                  <th>Formula</th><th>Good Count Mode</th><th>Good Statuses</th>
                  <th>Reject Statuses</th><th>Rework Policy</th>
                  <th>Cap</th><th>Zero Policy</th><th>Version</th>
                  <th>Status</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {configQ.isLoading ? (
                    <tr><td colSpan={14} className="pf-empty">
                      <Spinner size="sm" className="me-2" />Loading configurations...
                    </td></tr>
                  ) : !filteredConfigs.length ? (
                    <tr><td colSpan={14} className="pf-empty">
                      No Quality configuration found.
                    </td></tr>
                  ) : filteredConfigs.map((row, index) => (
                    <tr key={row.quality_formula_config_id || index}>
                      <td>{safe(row.company_name)}</td>
                      <td>{safe(row.plant_name)}</td>
                      <td>{safe(row.line_name)}</td>
                      <td><strong>{safe(row.machine_name || row.machine_code)}</strong></td>
                      <td>{safe(row.formula_code)}</td>
                      <td>{safe(row.good_count_mode)}</td>
                      <td>{Array.isArray(row.good_statuses) ? row.good_statuses.join(", ") : "-"}</td>
                      <td>{Array.isArray(row.reject_statuses) ? row.reject_statuses.join(", ") : "-"}</td>
                      <td>{safe(row.rework_policy)}</td>
                      <td>{boolValue(row.cap_at_100) ? "100%" : "Uncapped"}</td>
                      <td>{safe(row.zero_total_count_policy)}</td>
                      <td>v{safe(row.version_no)}</td>
                      <td><StatusBadge value={boolValue(row.is_active) ? "ACTIVE" : "INACTIVE"} /></td>
                      <td><div className="d-flex gap-2">
                        <Button className="pf-edit" onClick={() => openEditConfig(row)}>
                          <PencilSquare className="me-1" />Edit
                        </Button>
                        {boolValue(row.is_active) && (
                          <Button className="pf-delete" onClick={() => deactivate(row)}>
                            Deactivate
                          </Button>
                        )}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {activeView === VIEW_FORMULA && (
            <div className="pf-table-wrap">
              <Table responsive hover className="pf-table">
                <thead><tr>
                  <th>Company</th><th>Code</th><th>Name</th><th>Expression</th>
                  <th>Precision</th><th>Version</th><th>Status</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {masterQ.isLoading ? (
                    <tr><td colSpan={8} className="pf-empty">
                      <Spinner size="sm" className="me-2" />Loading formulas...
                    </td></tr>
                  ) : !filteredFormulas.length ? (
                    <tr><td colSpan={8} className="pf-empty">
                      No Quality formula found.
                    </td></tr>
                  ) : filteredFormulas.map((row) => (
                    <tr key={row.formula_id}>
                      <td>{safe(row.company_name)}</td>
                      <td><strong>{safe(row.formula_code)}</strong></td>
                      <td>{safe(row.formula_name)}</td>
                      <td>{safe(row.expression_text)}</td>
                      <td>{safe(row.decimal_places)}</td>
                      <td>v{safe(row.version_no)}</td>
                      <td><StatusBadge value={row.status} /></td>
                      <td><Button className="pf-edit" onClick={() => openEditFormula(row)}>
                        <PencilSquare className="me-1" />New Version
                      </Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {activeView === VIEW_RUNTIME && (
            <>
              <div className="pf-context mb-3">
                Quality refreshes automatically every 10 seconds. Total and good
                quantities come from Production Events; rejection quantity comes
                from configured result statuses or Rejection Events.
              </div>
              <ScopeFilters
                filters={filters}
                setFilters={setFilters}
                lookups={lookups}
                onClear={clearFilters}
              />
              <ScopeResults kind="quality" records={runtimeRows} loading={runtimeQ.isLoading}/>
<ResultTable
                rows={runtimeRows}
                loading={runtimeQ.isLoading}
                onRecalculate={(row) => recalculateMutation.mutate(row)}
                recalculatingId={recalculateMutation.isPending
                  ? recalculateMutation.variables?.quality_result_id : null}
              />
            </>
          )}

          {activeView === VIEW_REPORT && (
            <>
              <div className="d-flex justify-content-end mb-2">
                <Button className="pf-btn-outline" onClick={exportReport}>
                  <Download className="me-1" />Export CSV
                </Button>
              </div>
              <ScopeFilters
                filters={filters}
                setFilters={setFilters}
                lookups={lookups}
                onClear={clearFilters}
                report
              />
              <ResultTable
                rows={reportRows}
                loading={reportQ.isLoading}
                onRecalculate={(row) => recalculateMutation.mutate(row)}
                recalculatingId={recalculateMutation.isPending
                  ? recalculateMutation.variables?.quality_result_id : null}
              />
            </>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showConfig}
        onHide={() => setShowConfig(false)}
        size="lg"
        centered
        className="pf-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {configForm.quality_formula_config_id
              ? "Create New Quality Configuration Version"
              : "Add Quality Configuration"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); configMutation.mutate(configForm); }}>
          <Modal.Body>
            <Alert variant="light" className="border">
              Select an existing OEE scope. Quality uses Production Events and,
              when selected, Rejection Events from the same machine and shift.
            </Alert>
            <Row className="g-3">
              <Col md={12}>
                <SelectField
                  label="Existing OEE Configuration"
                  required
                  disabled={Boolean(configForm.quality_formula_config_id)}
                  value={configForm.oee_config_id}
                  onChange={(e) => selectOeeConfig(e.target.value)}
                >
                  <option value="">Select machine OEE configuration</option>
                  {formOeeConfigs.map((row) => (
                    <option key={`oee-${row.oee_config_id}`} value={row.oee_config_id}>
                      {[row.company_name, row.plant_name, row.line_name,
                        row.machine_name || row.machine_code]
                        .filter(Boolean).join(" / ")}
                    </option>
                  ))}
                </SelectField>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="pf-label">Company</Form.Label>
                  <Form.Control value={configForm.company_id} disabled />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="pf-label">Machine</Form.Label>
                  <Form.Control
                    value={machineLabel(lookups.machines.find((row) =>
                      sameId(machineId(row), configForm.machine_id)) || {})}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <SelectField
                  label="Quality Formula"
                  required
                  value={configForm.formula_id}
                  onChange={(e) => setConfigForm((current) => ({
                    ...current, formula_id: e.target.value,
                  }))}
                >
                  <option value="">Select formula</option>
                  {formFormulas.map((row) => (
                    <option key={row.formula_id} value={row.formula_id}>
                      {row.formula_code} - {row.formula_name}
                    </option>
                  ))}
                </SelectField>
              </Col>
              <Col md={6}>
                <SelectField
                  label="Good Count Mode"
                  value={configForm.good_count_mode}
                  onChange={(e) => setConfigForm((current) => ({
                    ...current, good_count_mode: e.target.value,
                  }))}
                >
                  <option value="RESULT_STATUS">Production Result Status</option>
                  <option value="TOTAL_MINUS_REJECTION">Total Minus Rejection Events</option>
                </SelectField>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="pf-label">Good Statuses</Form.Label>
                  <Form.Control
                    value={configForm.good_statuses_text}
                    placeholder="OK, PASS, COMPLETED"
                    onChange={(e) => setConfigForm((current) => ({
                      ...current, good_statuses_text: e.target.value,
                    }))}
                  />
                  <Form.Text>Comma-separated successful result statuses.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="pf-label">Reject Statuses</Form.Label>
                  <Form.Control
                    value={configForm.reject_statuses_text}
                    placeholder="NOK, FAIL, REJECTED"
                    onChange={(e) => setConfigForm((current) => ({
                      ...current, reject_statuses_text: e.target.value,
                    }))}
                  />
                  <Form.Text>Used when Good Count Mode is Result Status.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <SelectField
                  label="Rework Policy"
                  value={configForm.rework_policy}
                  onChange={(e) => setConfigForm((current) => ({
                    ...current, rework_policy: e.target.value,
                  }))}
                >
                  <option value="FIRST_PASS_ONLY">First Pass Only</option>
                  <option value="INCLUDE_REWORK">Include Rework</option>
                  <option value="FINAL_RESULT">FINAL RESULT</option>
                </SelectField>
              </Col>
              <Col md={4}>
                <SelectField
                  label="Zero Total Count"
                  value={configForm.zero_total_count_policy}
                  onChange={(e) => setConfigForm((current) => ({
                    ...current, zero_total_count_policy: e.target.value,
                  }))}
                >
                  <option value="NO_RESULT">No Result</option>
                  <option value="ZERO">Return Zero</option>
                  <option value="ERROR">Error</option>
                </SelectField>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="pf-label">Decimal Places</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={6}
                    value={configForm.decimal_places}
                    onChange={(e) => setConfigForm((current) => ({
                      ...current, decimal_places: e.target.value,
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-end gap-4">
                <Form.Check
                  type="switch"
                  label="Cap Quality at 100%"
                  checked={boolValue(configForm.cap_at_100)}
                  onChange={(e) => setConfigForm((current) => ({
                    ...current, cap_at_100: e.target.checked,
                  }))}
                />
                <Form.Check
                  type="switch"
                  label="Active"
                  checked={boolValue(configForm.is_active)}
                  onChange={(e) => setConfigForm((current) => ({
                    ...current, is_active: e.target.checked,
                  }))}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfig(false)}>Cancel</Button>
            <Button className="pf-btn-primary" type="submit" disabled={configMutation.isPending}>
              {configMutation.isPending && <Spinner size="sm" className="me-1" />}
              Save Configuration
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showFormula}
        onHide={() => setShowFormula(false)}
        size="lg"
        centered
        className="pf-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {formulaForm.formula_id ? "Create New Formula Version" : "Add Quality Formula"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); formulaMutation.mutate(formulaForm); }}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <SelectField
                  label="Company"
                  required
                  disabled={Boolean(formulaForm.formula_id)}
                  value={formulaForm.company_id}
                  onChange={(e) => setFormulaForm((current) => ({
                    ...current, company_id: e.target.value,
                  }))}
                >
                  <option value="">Select company</option>
                  {lookups.companies.map((row) => (
                    <option key={companyId(row)} value={companyId(row)}>
                      {companyLabel(row)}
                    </option>
                  ))}
                </SelectField>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="pf-label">Formula Code</Form.Label>
                  <Form.Control
                    required
                    disabled={Boolean(formulaForm.formula_id)}
                    value={formulaForm.formula_code}
                    onChange={(e) => setFormulaForm((current) => ({
                      ...current, formula_code: e.target.value.toUpperCase(),
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="pf-label">Formula Name</Form.Label>
                  <Form.Control
                    required
                    value={formulaForm.formula_name}
                    onChange={(e) => setFormulaForm((current) => ({
                      ...current, formula_name: e.target.value,
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="pf-label">Decimal Places</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={6}
                    value={formulaForm.decimal_places}
                    onChange={(e) => setFormulaForm((current) => ({
                      ...current, decimal_places: e.target.value,
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <SelectField
                  label="Status"
                  value={formulaForm.status}
                  onChange={(e) => setFormulaForm((current) => ({
                    ...current, status: e.target.value,
                  }))}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="RETIRED">Retired</option>
                </SelectField>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="pf-label">Expression</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    required
                    value={formulaForm.expression_text}
                    onChange={(e) => setFormulaForm((current) => ({
                      ...current, expression_text: e.target.value,
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="pf-label">Expression AST (JSON)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    value={formulaForm.expression_ast_text}
                    onChange={(e) => setFormulaForm((current) => ({
                      ...current,
                      expression_ast_text: e.target.value,
                    }))}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFormula(false)}>Cancel</Button>
            <Button className="pf-btn-primary" type="submit" disabled={formulaMutation.isPending}>
              {formulaMutation.isPending && <Spinner size="sm" className="me-1" />}
              Save Formula
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
</>
  );
}
