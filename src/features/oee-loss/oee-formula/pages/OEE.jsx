import ScopeResults from '../../../../shared/design/ScopeResults.jsx';


import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/OEE/OEE.jsx

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
  Download,
  GearFill,
  PencilSquare,
  Plus,
  Search,
} from "react-bootstrap-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";
import oeeService, {
  createOeeFormula,
  getOeeConfig,
  getOeeMaster,
  getOeeReport,
  getOeeRuntime,
  recalculateOee,
  saveOeeConfig,
  updateOeeFormula,
} from "../api/oee.service.js";

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
  oee_config_id: "",
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  process_id: "",
  part_id: "",
  oee_formula_id: "",
  target_oee_pct: 85,
  auto_calculate: true,
  calculation_interval_min: 2,
  cap_at_100: true,
  timezone: "Asia/Kolkata",
  is_active: true,
};

const formulaInitial = {
  formula_id: "",
  company_id: "",
  formula_code: "",
  formula_name: "OEE",
  expression_text:
    "(availability_pct * performance_pct * quality_pct) / 10000",
  expression_ast: {
    op: "divide",
    args: [
      {
        op: "multiply",
        args: [
          { var: "availability_pct" },
          { var: "performance_pct" },
          { var: "quality_pct" },
        ],
      },
      10000,
    ],
  },
  input_schema: {
    required: ["availability_pct", "performance_pct", "quality_pct"],
  },
  decimal_places: 4,
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
  target_status: "",
  from_date: "",
  to_date: "",
  limit: 100,
  offset: 0,
};

const FILTER_STORAGE_KEY = "operatex.oee.filters.v1";

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

const asBusinessDate = (value) => {
  if (!value) return localDate();
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

const sameId = (a, b) => String(a ?? "") === String(b ?? "");

const boolValue = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  String(value).toLowerCase() === "true";

const safe = (value) => (hasValue(value) ? String(value) : "-");

const rowsFrom = (response, keys = []) => {
  const responseBody = response?.data ?? response;
  const data = responseBody?.data ?? responseBody;

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
};

const useLookup = (key, url, keys) =>
  useQuery({
    queryKey: ["oee", "lookup", key],
    queryFn: async () => rowsFrom(await api.get(url), keys),
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
    return data.errors.join(" | ");
  }

  return data?.message || error?.message || "Request failed.";
};

const displayDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const percentText = (value, places = 2) =>
  hasValue(value) ? `${Number(value).toFixed(places)}%` : "No result";

const downloadCsv = (rows, filename) => {
  if (!rows.length) throw new Error("No OEE records found to export.");

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

const SelectField = ({
  label,
  value,
  onChange,
  children,
  required,
  disabled,
}) => (
  <Form.Group>
    <Form.Label className="oee-label">
      {label}
      {required && <span className="oee-required"> *</span>}
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
    text === "ACTIVE" || text === "FINAL" || text === "ON_TARGET"
      ? "success"
      : text === "PARTIAL"
        ? "warning"
        : text === "RECALCULATED"
          ? "info"
          : text === "BELOW_TARGET" || text === "INACTIVE" || text === "RETIRED"
            ? "danger"
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
      !filters.company_id ||
      !companyId(row) ||
      sameId(companyId(row), filters.company_id),
  );

  const lines = lookups.lines.filter(
    (row) =>
      !filters.plant_id ||
      !plantId(row) ||
      sameId(plantId(row), filters.plant_id),
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
    <div className="oee-filter">
      <Row className="g-2">
        <Col lg={2} md={4}>
          <SelectField
            label="Company"
            value={filters.company_id}
            onChange={(e) =>
              set("company_id", e.target.value, [
                "plant_id",
                "line_id",
                "machine_id",
              ])
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
              <option key={row.shift_id} value={row.shift_id}>
                {row.shift_name || `Shift ${row.shift_no || row.shift_id}`}
              </option>
            ))}
          </SelectField>
        </Col>

        {!report && (
          <Col lg={2} md={4}>
            <Form.Group>
              <Form.Label className="oee-label">Business Date</Form.Label>
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
                <Form.Label className="oee-label">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => set("from_date", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="oee-label">To Date</Form.Label>
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
            label="Calculation Status"
            value={filters.calculation_status}
            onChange={(e) => set("calculation_status", e.target.value)}
          >
            <option value="">All</option>
            <option value="PARTIAL">Partial</option>
            <option value="FINAL">Final</option>
            <option value="RECALCULATED">Recalculated</option>
          </SelectField>
        </Col>

        <Col lg={2} md={4}>
          <SelectField
            label="Target Status"
            value={filters.target_status}
            onChange={(e) => set("target_status", e.target.value)}
          >
            <option value="">All</option>
            <option value="ON_TARGET">On Target</option>
            <option value="BELOW_TARGET">Below Target</option>
          </SelectField>
        </Col>

        <Col lg={2} md={4} className="d-flex align-items-end">
          <Button className="oee-btn-outline w-100" onClick={onClear}>
            Reset Filters
          </Button>
        </Col>
      </Row>
    </div>
  );
}

function ComponentMetric({ label, value, variant = "primary" }) {
  const numeric = Math.max(0, Number(value || 0));

  return (
    <div className="oee-component">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span>{label}</span>
        <strong>{percentText(value)}</strong>
      </div>
      <ProgressBar now={Math.min(100, numeric)} variant={variant} />
    </div>
  );
}

function ResultTable({ rows, loading, onRecalculate, recalculatingId }) {
  const renderResultRow = (row) => {
    const oeeValue = Math.max(0, Number(row.oee_pct || 0));
    const target = hasValue(row.target_oee_pct)
      ? Number(row.target_oee_pct)
      : null;

    return (
      <tr key={row.oee_result_id}>
        <td>{asBusinessDate(row.business_date)}</td>
        <td>
          <strong>{safe(row.machine_name || row.machine_code)}</strong>
        </td>
        <td>{safe(row.shift_name || row.shift_id)}</td>
        <td>{percentText(row.availability_pct)}</td>
        <td>{percentText(row.performance_pct)}</td>
        <td>{percentText(row.quality_pct)}</td>
        <td>
          <div className="oee-percent">{percentText(row.oee_pct)}</div>
          <ProgressBar
            now={Math.min(100, oeeValue)}
            variant={target !== null && oeeValue < target ? "danger" : "success"}
          />
        </td>
        <td>{target === null ? "-" : `${target.toFixed(2)}%`}</td>
        <td>
          <StatusBadge value={row.target_status} />
        </td>
        <td>
          <StatusBadge value={row.calculation_status} />
        </td>
        <td>v{safe(row.calculation_version)}</td>
        <td>{safe(row.formula_code)}</td>
        <td>{displayDateTime(row.calculated_at)}</td>
        <td>
          {["FINAL", "RECALCULATED"].includes(
            String(row.calculation_status || "").toUpperCase(),
          ) && (
            <Button
              size="sm"
              className="oee-edit"
              disabled={recalculatingId === row.oee_result_id}
              onClick={() => onRecalculate(row)}
            >
              {recalculatingId === row.oee_result_id ? (
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
  };

  return (
    <div className="oee-table-wrap">
      <Table responsive hover className="oee-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Machine</th>
            <th>Shift</th>
            <th>Availability</th>
            <th>Performance</th>
            <th>Quality</th>
            <th>OEE</th>
            <th>Target</th>
            <th>Target Status</th>
            <th>Calculation</th>
            <th>Version</th>
            <th>Formula</th>
            <th>Calculated</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={14} className="oee-empty">
                <Spinner size="sm" className="me-2" />
                Loading OEE...
              </td>
            </tr>
          ) : !rows.length ? (
            <tr>
              <td colSpan={14} className="oee-empty">
                No OEE result found.
              </td>
            </tr>
          ) : (
            rows.map(renderResultRow)
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default function OEE() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState(VIEW_RUNTIME);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [configForm, setConfigForm] = useState(configInitial);
  const [formulaForm, setFormulaForm] = useState(formulaInitial);
  const [formulaAstText, setFormulaAstText] = useState(
    JSON.stringify(formulaInitial.expression_ast, null, 2),
  );
  const [inputSchemaText, setInputSchemaText] = useState(
    JSON.stringify(formulaInitial.input_schema, null, 2),
  );
  const [filters, setFilters] = useState(loadSavedFilters);
  const [applied, setApplied] = useState(loadSavedFilters);

  useEffect(() => {
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));

    const timer = window.setTimeout(() => setApplied({ ...filters }), 250);
    return () => window.clearTimeout(timer);
  }, [filters]);

  const companiesQ = useLookup("companies", "/company-master/master", [
    "company_master",
    "companies",
    "master",
  ]);

  const plantsQ = useLookup("plants", "/plant-shop-master/master", [
    "plant_master",
    "plants",
    "shops",
    "master",
  ]);

  const linesQ = useLookup("lines", "/line-master/master", [
    "line_master",
    "lines",
    "master",
  ]);

  const machinesQ = useLookup("machines", "/machine-master/master", [
    "machine_master",
    "machines",
    "master",
  ]);

  const shiftsQ = useLookup("shifts", "/shift-calendar/master", [
    "shift_master",
    "shifts",
    "master",
  ]);

  const masterQ = useQuery({
    queryKey: ["oee", "master"],
    queryFn: () => getOeeMaster({}),
  });

  const configQ = useQuery({
    queryKey: ["oee", "config"],
    queryFn: () => getOeeConfig({}),
  });

  const runtimeQ = useQuery({
    queryKey: ["oee", "runtime", applied],
    queryFn: () => getOeeRuntime(applied),
    enabled: activeView === VIEW_RUNTIME,
    refetchInterval: activeView === VIEW_RUNTIME ? 10000 : false,
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  const reportQ = useQuery({
    queryKey: ["oee", "report", applied],
    queryFn: () => getOeeReport({ ...applied, business_date: undefined }),
    enabled: activeView === VIEW_REPORT,
  });

  const lookups = {
    companies: companiesQ.data || [],
    plants: plantsQ.data || [],
    lines: linesQ.data || [],
    machines: machinesQ.data || [],
    shifts: shiftsQ.data || [],
  };

  const formulas = oeeService.getOeeFormulaRows(masterQ.data);
  const configs = oeeService.getOeeConfigRows(configQ.data);
  const runtimeRows = oeeService.getOeeResultRows(runtimeQ.data?.data);
  const reportRows = oeeService.getOeeResultRows(reportQ.data?.data);

  const defaultCompany =
    lookups.companies.length === 1 ? companyId(lookups.companies[0]) : "";

  const filteredConfigs = useMemo(() => {
    const value = search.toLowerCase().trim();
    if (!value) return configs;

    return configs.filter((row) =>
      [
        row.company_name,
        row.plant_name,
        row.line_name,
        row.machine_name,
        row.machine_code,
        row.formula_code,
        row.formula_name,
      ].some((item) =>
        String(item || "")
          .toLowerCase()
          .includes(value),
      ),
    );
  }, [configs, search]);

  const filteredFormulas = useMemo(() => {
    const value = search.toLowerCase().trim();
    if (!value) return formulas;

    return formulas.filter((row) =>
      [
        row.formula_code,
        row.formula_name,
        row.expression_text,
        row.company_name,
      ].some((item) =>
        String(item || "")
          .toLowerCase()
          .includes(value),
      ),
    );
  }, [formulas, search]);

  const formFormulas = formulas
    .filter(
      (row) =>
        !configForm.company_id || sameId(row.company_id, configForm.company_id),
    )
    .filter((row) => String(row.status || "").toUpperCase() === "ACTIVE");

  const notifySuccess = (value) => {
    setMessage(value);
    setError("");
  };

  const notifyError = (value) => {
    setError(errorText(value));
    setMessage("");
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["oee"] });

  const configMutation = useMutation({
    mutationFn: (form) =>
      saveOeeConfig({
        oee_config_id: form.oee_config_id,
        oee_formula_id: form.oee_formula_id,
        target_oee_pct:
          form.target_oee_pct === "" ? null : Number(form.target_oee_pct),
        auto_calculate: Boolean(form.auto_calculate),
        calculation_interval_min: Number(form.calculation_interval_min),
        config: {
          timezone: form.timezone || "Asia/Kolkata",
          cap_at_100: Boolean(form.cap_at_100),
        },
      }),
    onSuccess: (result) => {
      setShowConfig(false);
      notifySuccess(result?.message || "OEE configuration updated.");
      refresh();
    },
    onError: notifyError,
  });

  const formulaMutation = useMutation({
    mutationFn: (form) => {
      let expressionAst;
      let inputSchema;

      try {
        expressionAst = JSON.parse(formulaAstText || "{}");
      } catch (_) {
        throw new Error("Expression AST must be valid JSON.");
      }

      try {
        inputSchema = JSON.parse(inputSchemaText || "{}");
      } catch (_) {
        throw new Error("Input Schema must be valid JSON.");
      }

      const data = {
        ...form,
        expression_ast: expressionAst,
        input_schema: inputSchema,
        decimal_places: Number(form.decimal_places),
        min_output: Number(form.min_output),
        max_output: Number(form.max_output),
      };

      return form.formula_id
        ? updateOeeFormula(form.formula_id, data)
        : createOeeFormula(data);
    },
    onSuccess: (result) => {
      setShowFormula(false);
      notifySuccess(result?.message || "OEE formula saved.");
      refresh();
    },
    onError: notifyError,
  });

  const recalculateMutation = useMutation({
    mutationFn: (row) =>
      recalculateOee({
        ...row,
        business_date: asBusinessDate(row.business_date),
      }),
    onSuccess: (result) => {
      notifySuccess(
        result?.message ||
          "OEE recalculation completed using the latest component results.",
      );
      refresh();
    },
    onError: notifyError,
  });

  const recalculateRow = (row) => {
    const machine = row.machine_name || row.machine_code || "Machine";
    const shift = row.shift_name || row.shift_id || "Shift";

    if (
      !window.confirm(
        `Recalculate OEE for ${machine} - ${shift} using the latest Availability, Performance and Quality results?`,
      )
    ) {
      return;
    }

    recalculateMutation.mutate(row);
  };

  const openEditConfig = (row) => {
    setConfigForm({
      ...configInitial,
      ...row,
      target_oee_pct: row.target_oee_pct ?? "",
      auto_calculate: boolValue(row.auto_calculate),
      cap_at_100: row.config?.cap_at_100 !== false,
      timezone: row.config?.timezone || "Asia/Kolkata",
      is_active: boolValue(row.is_active),
    });
    setShowConfig(true);
  };

  const openCreateFormula = () => {
    const next = { ...formulaInitial, company_id: defaultCompany };
    setFormulaForm(next);
    setFormulaAstText(JSON.stringify(next.expression_ast, null, 2));
    setInputSchemaText(JSON.stringify(next.input_schema, null, 2));
    setShowFormula(true);
  };

  const openEditFormula = (row) => {
    const next = { ...formulaInitial, ...row };
    setFormulaForm(next);
    setFormulaAstText(JSON.stringify(next.expression_ast || {}, null, 2));
    setInputSchemaText(JSON.stringify(next.input_schema || {}, null, 2));
    setShowFormula(true);
  };

  const clearFilters = () => {
    const cleared = {
      ...filterInitial,
      business_date: localDate(),
    };

    window.localStorage.removeItem(FILTER_STORAGE_KEY);
    setFilters(cleared);
    setApplied(cleared);
  };

  const average = (rows, key) =>
    rows.length
      ? rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length
      : 0;

  const averageAvailability = average(runtimeRows, "availability_pct");
  const averagePerformance = average(runtimeRows, "performance_pct");
  const averageQuality = average(runtimeRows, "quality_pct");
  const averageOee = average(runtimeRows, "oee_pct");

  const onTargetCount = runtimeRows.filter(
    (row) => String(row.target_status || "").toUpperCase() === "ON_TARGET",
  ).length;

  const belowTargetCount = runtimeRows.filter(
    (row) => String(row.target_status || "").toUpperCase() === "BELOW_TARGET",
  ).length;

  const exportReport = () => {
    try {
      downloadCsv(reportRows, `oee-report-${localDate()}.csv`);
      notifySuccess(`${reportRows.length} OEE records exported.`);
    } catch (requestError) {
      notifyError(requestError);
    }
  };

  return (
    <>


<div className="oee-page">
      <style>{`
        .oee-page{padding:22px;background:#f4f6fb;min-height:100vh}.oee-card{background:#fff;border:1px solid #e5e9f2;border-radius:12px;box-shadow:0 3px 12px rgba(15,23,42,.06)}
        .oee-title{margin:0;font-size:22px;font-weight:700;color:#1f2d3d}.oee-subtitle{margin-top:4px;color:#748094;font-size:13px}.oee-btn-primary{background:#314965!important;border-color:#314965!important;color:#fff!important;font-weight:600}.oee-btn-outline{background:#fff!important;color:#314965!important;border:1px solid #314965!important;font-weight:600}.oee-tabs{display:flex;gap:8px;flex-wrap:wrap}.oee-tab{border:1px solid #d9dce5;background:#fff;color:#566176;font-weight:600;padding:8px 15px;border-radius:7px}.oee-tab.active{border-color:#314965;background:#f1f4f8;color:#314965}
        .oee-stat{border:1px solid #e5e9f2;border-radius:10px;padding:14px;background:#fff;height:100%}.oee-stat-icon{width:40px;height:40px;border-radius:9px;background:#f1f4f8;color:#314965;display:flex;align-items:center;justify-content:center;font-size:18px}.oee-stat-value{font-size:20px;font-weight:700;color:#263449}.oee-stat-label{color:#758195;font-size:12px}.oee-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.oee-search{position:relative;width:340px;max-width:100%}.oee-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#8792a5}.oee-search input{padding-left:34px}
        .oee-table-wrap{border:1px solid #e4e7ee;border-radius:9px;overflow:auto}.oee-table{margin:0;white-space:nowrap}.oee-table thead th{background:#1c2d45;color:#fff;border-color:#1c2d45;font-size:12px;font-weight:700;padding:12px}.oee-table tbody td{vertical-align:middle;padding:11px 12px;color:#364152;font-size:13px}.oee-empty{text-align:center;color:#8a94a6!important;padding:30px!important}.oee-edit{background:#fff!important;border:1px solid #314965!important;color:#314965!important;font-size:12px;font-weight:600}.oee-modal .modal-content{border:none;border-radius:12px;overflow:hidden}.oee-modal .modal-header{background:#1c2d45;color:#fff;border:none}.oee-modal .btn-close{filter:invert(1)}.oee-label{color:#354154;font-size:12px;font-weight:700;margin-bottom:5px}.oee-required{color:#dc3545}.oee-filter{padding:15px;border:1px solid #e5e9f2;border-radius:9px;background:#f9fafc;margin-bottom:15px}.oee-context{border:1px solid #f1cebc;background:#f6f8fa;color:#865038;border-radius:9px;padding:12px 14px;font-size:13px}.oee-percent{font-weight:700;font-size:14px;margin-bottom:4px}.oee-table .progress,.oee-component .progress{height:5px;min-width:90px}.oee-component{border:1px solid #eceff5;border-radius:8px;padding:10px 12px;background:#fbfcfe;font-size:12px}.oee-code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:12px}
        @media(max-width:768px){.oee-page{padding:12px}.oee-search{width:100%}.oee-toolbar{align-items:stretch}}
      `}</style>

      <Card className="oee-card mb-3">
        <Card.Body>
          <Row className="align-items-center g-3">
            <Col lg={7}>
              <h4 className="oee-title">Overall Equipment Effectiveness</h4>
              <div className="oee-subtitle">
                Live OEE calculated from the exact Availability, Performance and
                Quality result versions for the same machine, shift and window.
              </div>
            </Col>
            <Col lg={5}>
              <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                <Button className="oee-btn-outline" onClick={refresh}>
                  <ArrowClockwise className="me-1" />
                  Refresh
                </Button>
                <Button
                  className="oee-btn-outline"
                  onClick={() => setActiveView(VIEW_RUNTIME)}
                >
                  <BarChartLine className="me-1" />
                  Live Runtime
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

      

      <Card className="oee-card">
        <Card.Body>
          <div className="oee-tabs mb-3">
            {[
              [VIEW_CONFIG, "Configuration"],
              [VIEW_FORMULA, "Formula Master"],
              [VIEW_RUNTIME, "Live Runtime"],
              [VIEW_REPORT, "Report"],
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={`oee-tab ${activeView === key ? "active" : ""}`}
                onClick={() => {
                  setActiveView(key);
                  setSearch("");
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {(activeView === VIEW_CONFIG || activeView === VIEW_FORMULA) && (
            <div className="oee-toolbar mb-3">
              <div className="oee-search">
                <Search />
                <Form.Control
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search OEE configuration or formula..."
                />
              </div>

              {activeView === VIEW_FORMULA && (
                <Button className="oee-btn-primary" onClick={openCreateFormula}>
                  <Plus className="me-1" />
                  Add Formula
                </Button>
              )}
            </div>
          )}

          {activeView === VIEW_CONFIG && (
            <>
              <div className="oee-context mb-3">
                OEE uses the existing machine OEE configuration created by the
                component modules. This screen only updates the OEE formula,
                target, automatic calculation interval and OEE engine settings.
              </div>

              <div className="oee-table-wrap">
                <Table responsive hover className="oee-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Plant</th>
                      <th>Line</th>
                      <th>Machine</th>
                      <th>OEE Formula</th>
                      <th>Target</th>
                      <th>Auto Calculate</th>
                      <th>Interval</th>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configQ.isLoading ? (
                      <tr>
                        <td colSpan={11} className="oee-empty">
                          <Spinner size="sm" className="me-2" />
                          Loading OEE configurations...
                        </td>
                      </tr>
                    ) : !filteredConfigs.length ? (
                      <tr>
                        <td colSpan={11} className="oee-empty">
                          No OEE configuration found.
                        </td>
                      </tr>
                    ) : (
                      filteredConfigs.map((row) => (
                        <tr key={row.oee_config_id}>
                          <td>{safe(row.company_name)}</td>
                          <td>{safe(row.plant_name)}</td>
                          <td>{safe(row.line_name)}</td>
                          <td>
                            <strong>
                              {safe(row.machine_name || row.machine_code)}
                            </strong>
                          </td>
                          <td>{safe(row.formula_code || row.formula_name)}</td>
                          <td>
                            {hasValue(row.target_oee_pct)
                              ? `${Number(row.target_oee_pct).toFixed(2)}%`
                              : "-"}
                          </td>
                          <td>{boolValue(row.auto_calculate) ? "Yes" : "No"}</td>
                          <td>{safe(row.calculation_interval_min)} min</td>
                          <td>v{safe(row.version_no)}</td>
                          <td>
                            <StatusBadge
                              value={
                                boolValue(row.is_active) ? "ACTIVE" : "INACTIVE"
                              }
                            />
                          </td>
                          <td>
                            <Button
                              className="oee-edit"
                              onClick={() => openEditConfig(row)}
                            >
                              <PencilSquare className="me-1" />
                              Configure OEE
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}

          {activeView === VIEW_FORMULA && (
            <div className="oee-table-wrap">
              <Table responsive hover className="oee-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Expression</th>
                    <th>Precision</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {masterQ.isLoading ? (
                    <tr>
                      <td colSpan={8} className="oee-empty">
                        <Spinner size="sm" className="me-2" />
                        Loading OEE formulas...
                      </td>
                    </tr>
                  ) : !filteredFormulas.length ? (
                    <tr>
                      <td colSpan={8} className="oee-empty">
                        No OEE formula found.
                      </td>
                    </tr>
                  ) : (
                    filteredFormulas.map((row) => (
                      <tr key={row.formula_id}>
                        <td>{safe(row.company_name)}</td>
                        <td>
                          <strong>{safe(row.formula_code)}</strong>
                        </td>
                        <td>{safe(row.formula_name)}</td>
                        <td>{safe(row.expression_text)}</td>
                        <td>{safe(row.decimal_places)}</td>
                        <td>v{safe(row.version_no)}</td>
                        <td>
                          <StatusBadge value={row.status} />
                        </td>
                        <td>
                          <Button
                            className="oee-edit"
                            onClick={() => openEditFormula(row)}
                          >
                            <PencilSquare className="me-1" />
                            New Version
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {activeView === VIEW_RUNTIME && (
            <>
              <div className="oee-context mb-3">
                Live OEE refreshes every 10 seconds. The final value uses the exact
                Availability, Performance and Quality results for the same OEE
                configuration, shift and calculation window.
              </div>

              <ScopeFilters
                filters={filters}
                setFilters={setFilters}
                lookups={lookups}
                onClear={clearFilters}
              />

              {!!runtimeRows.length && (
                <Row className="g-2 mb-3">
                  <Col lg={3} md={6}>
                    <ComponentMetric
                      label="Availability"
                      value={averageAvailability}
                      variant="info"
                    />
                  </Col>
                  <Col lg={3} md={6}>
                    <ComponentMetric
                      label="Performance"
                      value={averagePerformance}
                      variant="warning"
                    />
                  </Col>
                  <Col lg={3} md={6}>
                    <ComponentMetric
                      label="Quality"
                      value={averageQuality}
                      variant="success"
                    />
                  </Col>
                  <Col lg={3} md={6}>
                    <ComponentMetric
                      label="OEE"
                      value={averageOee}
                      variant="primary"
                    />
                  </Col>
                </Row>
              )}

              <ScopeResults kind="oee" records={runtimeRows} loading={runtimeQ.isLoading}/>
<ResultTable
                rows={runtimeRows}
                loading={runtimeQ.isLoading}
                onRecalculate={recalculateRow}
                recalculatingId={
                  recalculateMutation.isPending
                    ? recalculateMutation.variables?.oee_result_id
                    : null
                }
              />
            </>
          )}

          {activeView === VIEW_REPORT && (
            <>
              <div className="d-flex justify-content-end mb-2">
                <Button className="oee-btn-outline" onClick={exportReport}>
                  <Download className="me-1" />
                  Export CSV
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
                onRecalculate={recalculateRow}
                recalculatingId={
                  recalculateMutation.isPending
                    ? recalculateMutation.variables?.oee_result_id
                    : null
                }
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
        className="oee-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Configure OEE Calculation</Modal.Title>
        </Modal.Header>

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            configMutation.mutate(configForm);
          }}
        >
          <Modal.Body>
            <div className="oee-context mb-3">
              Scope is read-only because the existing backend updates OEE fields on
              this exact <span className="oee-code">oee_config_id</span>.
            </div>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="oee-label">Company</Form.Label>
                  <Form.Control value={safe(configForm.company_name)} disabled />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="oee-label">Plant</Form.Label>
                  <Form.Control value={safe(configForm.plant_name)} disabled />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="oee-label">Line</Form.Label>
                  <Form.Control value={safe(configForm.line_name)} disabled />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="oee-label">Machine</Form.Label>
                  <Form.Control
                    value={safe(
                      configForm.machine_name || configForm.machine_code,
                    )}
                    disabled
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <SelectField
                  label="OEE Formula"
                  required
                  value={configForm.oee_formula_id}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      oee_formula_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Select formula</option>
                  {formFormulas.map((row) => (
                    <option key={row.formula_id} value={row.formula_id}>
                      {row.formula_code} - {row.formula_name} (v{row.version_no})
                    </option>
                  ))}
                </SelectField>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="oee-label">OEE Target %</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={configForm.target_oee_pct}
                    onChange={(e) =>
                      setConfigForm((current) => ({
                        ...current,
                        target_oee_pct: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="oee-label">Interval Minutes</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    value={configForm.calculation_interval_min}
                    onChange={(e) =>
                      setConfigForm((current) => ({
                        ...current,
                        calculation_interval_min: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="oee-label">Timezone</Form.Label>
                  <Form.Control
                    value={configForm.timezone}
                    onChange={(e) =>
                      setConfigForm((current) => ({
                        ...current,
                        timezone: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={3} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  label="Automatic calculation"
                  checked={configForm.auto_calculate}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      auto_calculate: e.target.checked,
                    }))
                  }
                />
              </Col>

              <Col md={3} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  label="Cap OEE at 100%"
                  checked={configForm.cap_at_100}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      cap_at_100: e.target.checked,
                    }))
                  }
                />
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="oee-label">Configuration Status</Form.Label>
                  <div className="pt-2">
                    <StatusBadge
                      value={configForm.is_active ? "ACTIVE" : "INACTIVE"}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="light" onClick={() => setShowConfig(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="oee-btn-primary"
              disabled={configMutation.isPending}
            >
              {configMutation.isPending && (
                <Spinner size="sm" className="me-2" />
              )}
              Save OEE Configuration
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showFormula}
        onHide={() => setShowFormula(false)}
        size="lg"
        centered
        className="oee-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {formulaForm.formula_id
              ? "Create New OEE Formula Version"
              : "Add OEE Formula"}
          </Modal.Title>
        </Modal.Header>

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            formulaMutation.mutate(formulaForm);
          }}
        >
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <SelectField
                  label="Company"
                  required
                  disabled={Boolean(formulaForm.formula_id)}
                  value={formulaForm.company_id}
                  onChange={(e) =>
                    setFormulaForm((current) => ({
                      ...current,
                      company_id: e.target.value,
                    }))
                  }
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
                  <Form.Label className="oee-label">
                    Formula Code<span className="oee-required"> *</span>
                  </Form.Label>
                  <Form.Control
                    required
                    disabled={Boolean(formulaForm.formula_id)}
                    value={formulaForm.formula_code}
                    onChange={(e) =>
                      setFormulaForm((current) => ({
                        ...current,
                        formula_code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="FR0004"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="oee-label">
                    Formula Name<span className="oee-required"> *</span>
                  </Form.Label>
                  <Form.Control
                    required
                    value={formulaForm.formula_name}
                    onChange={(e) =>
                      setFormulaForm((current) => ({
                        ...current,
                        formula_name: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="oee-label">
                    Expression<span className="oee-required"> *</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    required
                    value={formulaForm.expression_text}
                    onChange={(e) =>
                      setFormulaForm((current) => ({
                        ...current,
                        expression_text: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="oee-label">
                    Expression AST JSON
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={7}
                    className="oee-code"
                    value={formulaAstText}
                    onChange={(e) => setFormulaAstText(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    The backend evaluates this AST. Keep it aligned with the
                    human-readable expression.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="oee-label">Input Schema JSON</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    className="oee-code"
                    value={inputSchemaText}
                    onChange={(e) => setInputSchemaText(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="oee-label">Decimal Places</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="6"
                    value={formulaForm.decimal_places}
                    onChange={(e) =>
                      setFormulaForm((current) => ({
                        ...current,
                        decimal_places: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="oee-label">Minimum</Form.Label>
                  <Form.Control
                    type="number"
                    value={formulaForm.min_output}
                    onChange={(e) =>
                      setFormulaForm((current) => ({
                        ...current,
                        min_output: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="oee-label">Maximum</Form.Label>
                  <Form.Control
                    type="number"
                    value={formulaForm.max_output}
                    onChange={(e) =>
                      setFormulaForm((current) => ({
                        ...current,
                        max_output: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <SelectField
                  label="Status"
                  value={formulaForm.status}
                  onChange={(e) =>
                    setFormulaForm((current) => ({
                      ...current,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="RETIRED">Retired</option>
                </SelectField>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="light" onClick={() => setShowFormula(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="oee-btn-primary"
              disabled={formulaMutation.isPending}
            >
              {formulaMutation.isPending && (
                <Spinner size="sm" className="me-2" />
              )}
              Save Formula Version
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
</>
  );
}
