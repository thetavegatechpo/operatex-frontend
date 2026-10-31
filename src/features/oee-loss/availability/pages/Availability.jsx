import ScopeResults from '../../../../shared/design/ScopeResults.jsx';


import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/Availability/Availability.jsx

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
import availabilityService, {
  createAvailabilityConfig,
  createAvailabilityFormula,
  deactivateAvailabilityConfig,
  exportAvailabilityReport,
  getAvailabilityConfig,
  getAvailabilityMaster,
  getAvailabilityReport,
  getAvailabilityRuntime,
  recalculateAvailability,
  updateAvailabilityConfig,
  updateAvailabilityFormula,
} from "../api/availability.service.js";

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
  availability_formula_id: "",
  downtime_rule_config_id: "",
  planned_time_source: "SHIFT_MASTER",
  downtime_source: "DOWNTIME_EVENT",
  exclude_planned_breaks: true,
  availability_loss_threshold_sec: 0,
  zero_planned_time_policy: "NO_RESULT",
  cap_at_100: true,
  decimal_places: 2,
  auto_calculate: true,
  calculation_interval_min: 1,
  target_availability_pct: 85,
  is_active: true,
};

const formulaInitial = {
  formula_id: "",
  company_id: "",
  formula_code: "",
  formula_name: "Availability",
  expression_text:
    "((planned_time_sec - downtime_time_sec) / planned_time_sec) * 100",
  expression_ast: {
    op: "multiply",
    args: [
      {
        op: "divide",
        args: [
          {
            op: "subtract",
            args: [{ var: "planned_time_sec" }, { var: "downtime_time_sec" }],
          },
          { var: "planned_time_sec" },
        ],
      },
      100,
    ],
  },
  input_schema: { required: ["planned_time_sec", "downtime_time_sec"] },
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
  from_date: "",
  to_date: "",
  limit: 100,
  offset: 0,
};

const FILTER_STORAGE_KEY = "operatex.availability.filters.v1";

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
  const body = response?.data ?? response;
  const data = body?.data ?? body;
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return [];
};

const useLookup = (key, url, keys) =>
  useQuery({
    queryKey: ["availability", "lookup", key],
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
  if (Array.isArray(data?.errors) && data.errors.length)
    return data.errors.join(" | ");
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
  if (!rows.length) throw new Error("No Availability records found to export.");
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
    <Form.Label className="av-label">
      {label}
      {required && <span className="av-required"> *</span>}
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
    <div className="av-filter">
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
              <Form.Label className="av-label">Business Date</Form.Label>
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
                <Form.Label className="av-label">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => set("from_date", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="av-label">To Date</Form.Label>
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
          </SelectField>
        </Col>
        <Col lg={2} md={4} className="d-flex align-items-end">
          <Button className="av-btn-outline w-100" onClick={onClear}>
            Reset Filters
          </Button>
        </Col>
      </Row>
    </div>
  );
}

function ResultTable({ rows, loading, onRecalculate, recalculatingId }) {
  const renderResultRow = (row) => {
    const availabilityValue = Number(row.availability_pct || 0);
    const availabilityLabel = hasValue(row.availability_pct)
      ? Number(row.availability_pct).toFixed(2) + "%"
      : "No result";

    return (
      <tr key={row.availability_result_id}>
        <td>{asBusinessDate(row.business_date)}</td>
        <td>
          <strong>{safe(row.machine_name || row.machine_code)}</strong>
        </td>
        <td>{safe(row.shift_name || row.shift_id)}</td>
        <td>{displayDuration(row.planned_time_sec)}</td>
        <td>
          {displayDuration(row.break_time_sec ?? row.excluded_planned_time_sec)}
        </td>
        <td className="text-danger fw-semibold">
          {displayDuration(row.downtime_time_sec)}
        </td>
        <td>{displayDuration(row.operating_time_sec)}</td>
        <td>
          <div className="av-percent">{availabilityLabel}</div>
          <ProgressBar
            now={availabilityValue}
            variant={availabilityValue >= 85 ? "success" : "danger"}
          />
        </td>
        <td>{safe(row.downtime_event_count)}</td>
        <td>
          <StatusBadge value={row.calculation_status} />
        </td>
        <td>{"v" + safe(row.calculation_version)}</td>
        <td>{displayDateTime(row.calculated_at)}</td>
        <td>
          {["FINAL", "RECALCULATED"].includes(
            String(row.calculation_status || "").toUpperCase(),
          ) && (
            <Button
              size="sm"
              className="av-edit"
              disabled={recalculatingId === row.availability_result_id}
              onClick={() => onRecalculate(row)}
            >
              {recalculatingId === row.availability_result_id ? (
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
    <div className="av-table-wrap">
      <Table responsive hover className="av-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Machine</th>
            <th>Shift</th>
            <th>Planned Time</th>
            <th>Breaks</th>
            <th>Downtime</th>
            <th>Operating Time</th>
            <th>Availability</th>
            <th>Events</th>
            <th>Status</th>
            <th>Version</th>
            <th>Calculated</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={13} className="av-empty">
                <Spinner size="sm" className="me-2" />
                Loading Availability...
              </td>
            </tr>
          ) : !rows.length ? (
            <tr>
              <td colSpan={13} className="av-empty">
                No Availability result found.
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

export default function Availability() {
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

  const downtimeRulesQ = useLookup(
    "downtime-rules",
    "/downtime-detection/config",
    ["downtime_rule_config", "downtime_configs", "config"],
  );

  const masterQ = useQuery({
    queryKey: ["availability", "master"],
    queryFn: () => getAvailabilityMaster({}),
  });
  const configQ = useQuery({
    queryKey: ["availability", "config"],
    queryFn: () => getAvailabilityConfig({}),
  });
  const runtimeQ = useQuery({
    queryKey: ["availability", "runtime", applied],
    queryFn: () => getAvailabilityRuntime(applied),
    enabled: activeView === VIEW_RUNTIME,
    refetchInterval: activeView === VIEW_RUNTIME ? 10000 : false,
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
  const reportQ = useQuery({
    queryKey: ["availability", "report", applied],
    queryFn: () =>
      getAvailabilityReport({ ...applied, business_date: undefined }),
    enabled: activeView === VIEW_REPORT,
  });

  const lookups = {
    companies: companiesQ.data || [],
    plants: plantsQ.data || [],
    lines: linesQ.data || [],
    machines: machinesQ.data || [],
    shifts: shiftsQ.data || [],
  };
  const formulas = availabilityService.getAvailabilityFormulaRows(masterQ.data);
  const configs = availabilityService.getAvailabilityConfigRows(configQ.data);
  const runtimeRows = availabilityService.getAvailabilityResultRows(
    runtimeQ.data?.data,
  );
  const reportRows = availabilityService.getAvailabilityResultRows(
    reportQ.data?.data,
  );
  const downtimeRules = downtimeRulesQ.data || [];
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

  const formPlants = lookups.plants.filter(
    (row) =>
      !configForm.company_id ||
      !companyId(row) ||
      sameId(companyId(row), configForm.company_id),
  );
  const formLines = lookups.lines.filter(
    (row) =>
      !configForm.plant_id ||
      !plantId(row) ||
      sameId(plantId(row), configForm.plant_id),
  );
  const formMachines = lookups.machines.filter(
    (row) =>
      !configForm.line_id ||
      !lineId(row) ||
      sameId(lineId(row), configForm.line_id),
  );
  const formFormulas = formulas
    .filter(
      (row) =>
        !configForm.company_id || sameId(row.company_id, configForm.company_id),
    )
    .filter((row) => row.status === "ACTIVE");
  const formRules = downtimeRules.filter(
    (row) =>
      (!configForm.company_id ||
        sameId(row.company_id, configForm.company_id)) &&
      (!configForm.machine_id ||
        sameId(row.machine_id, configForm.machine_id)) &&
      boolValue(row.is_active),
  );

  const notifySuccess = (value) => {
    setMessage(value);
    setError("");
  };
  const notifyError = (value) => {
    setError(errorText(value));
    setMessage("");
  };
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["availability"] });

  const configMutation = useMutation({
    mutationFn: (form) => {
      const data = {
        company_id: form.company_id,
        plant_id: form.plant_id,
        line_id: form.line_id,
        machine_id: form.machine_id,
        availability_formula_id: form.availability_formula_id,
        downtime_rule_config_id: form.downtime_rule_config_id,
        planned_time_source: form.planned_time_source,
        downtime_source: form.downtime_source,
        exclude_planned_breaks: Boolean(form.exclude_planned_breaks),
        availability_loss_threshold_sec: Number(
          form.availability_loss_threshold_sec,
        ),
        zero_planned_time_policy: form.zero_planned_time_policy,
        cap_at_100: Boolean(form.cap_at_100),
        decimal_places: Number(form.decimal_places),
        auto_calculate: Boolean(form.auto_calculate),
        calculation_interval_min: Number(form.calculation_interval_min),
        target_availability_pct:
          form.target_availability_pct === ""
            ? null
            : Number(form.target_availability_pct),
        is_active: Boolean(form.is_active),
        config: { timezone: "Asia/Kolkata" },
      };
      return form.oee_config_id
        ? updateAvailabilityConfig(form.oee_config_id, data)
        : createAvailabilityConfig(data);
    },
    onSuccess: (result) => {
      setShowConfig(false);
      notifySuccess(result?.message || "Availability configuration saved.");
      refresh();
    },
    onError: notifyError,
  });

  const formulaMutation = useMutation({
    mutationFn: (form) => {
      const data = {
        ...form,
        decimal_places: Number(form.decimal_places),
        min_output: Number(form.min_output),
        max_output: Number(form.max_output),
      };
      return form.formula_id
        ? updateAvailabilityFormula(form.formula_id, data)
        : createAvailabilityFormula(data);
    },
    onSuccess: (result) => {
      setShowFormula(false);
      notifySuccess(result?.message || "Availability formula saved.");
      refresh();
    },
    onError: notifyError,
  });

  const recalculateMutation = useMutation({
    mutationFn: (row) =>
      recalculateAvailability({
        ...row,
        business_date: asBusinessDate(row.business_date),
      }),
    onSuccess: (result) => {
      notifySuccess(
        result?.message ||
          "Completed shift recalculated with the latest configuration.",
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
        `Recalculate ${machine} - ${shift} using the latest configuration?`,
      )
    )
      return;

    recalculateMutation.mutate(row);
  };

  const openCreateConfig = () => {
    setConfigForm({ ...configInitial, company_id: defaultCompany });
    setShowConfig(true);
  };
  const openEditConfig = (row) => {
    setConfigForm({
      ...configInitial,
      ...row,
      is_active: boolValue(row.is_active),
      auto_calculate: boolValue(row.auto_calculate),
      exclude_planned_breaks: boolValue(row.exclude_planned_breaks),
      cap_at_100: boolValue(row.cap_at_100),
    });
    setShowConfig(true);
  };
  const openCreateFormula = () => {
    setFormulaForm({ ...formulaInitial, company_id: defaultCompany });
    setShowFormula(true);
  };
  const openEditFormula = (row) => {
    setFormulaForm({ ...formulaInitial, ...row });
    setShowFormula(true);
  };

  const deactivate = async (row) => {
    if (
      !window.confirm(
        `Deactivate Availability configuration for ${row.machine_name || row.machine_code}?`,
      )
    )
      return;
    try {
      const result = await deactivateAvailabilityConfig(row.oee_config_id);
      notifySuccess(result?.message || "Configuration deactivated.");
      refresh();
    } catch (requestError) {
      notifyError(requestError);
    }
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
  const latestAverage = runtimeRows.length
    ? runtimeRows.reduce(
        (sum, row) => sum + Number(row.availability_pct || 0),
        0,
      ) / runtimeRows.length
    : 0;
  const totalDowntime = runtimeRows.reduce(
    (sum, row) => sum + Number(row.downtime_time_sec || 0),
    0,
  );
  const totalBreaks = runtimeRows.reduce(
    (sum, row) =>
      sum + Number(row.break_time_sec ?? row.excluded_planned_time_sec ?? 0),
    0,
  );

  const exportReport = async () => {
    try {
      const result = await exportAvailabilityReport(
        { ...applied, business_date: undefined },
        "CSV",
      );
      downloadCsv(result?.data || [], `availability-report-${localDate()}.csv`);
      notifySuccess(
        `${result?.total_records || 0} Availability records exported.`,
      );
    } catch (requestError) {
      notifyError(requestError);
    }
  };

  return (
    <>


<div className="av-page">
      <style>{`
            .av-page{padding:22px;background:#f4f6fb;min-height:100vh}.av-card{background:#fff;border:1px solid #e5e9f2;border-radius:12px;box-shadow:0 3px 12px rgba(15,23,42,.06)}
            .av-title{margin:0;font-size:22px;font-weight:700;color:#1f2d3d}.av-subtitle{margin-top:4px;color:#748094;font-size:13px}.av-btn-primary{background:#314965!important;border-color:#314965!important;color:#fff!important;font-weight:600}.av-btn-outline{background:#fff!important;color:#314965!important;border:1px solid #314965!important;font-weight:600}.av-tabs{display:flex;gap:8px;flex-wrap:wrap}.av-tab{border:1px solid #d9dce5;background:#fff;color:#566176;font-weight:600;padding:8px 15px;border-radius:7px}.av-tab.active{border-color:#314965;background:#f1f4f8;color:#314965}
            .av-stat{border:1px solid #e5e9f2;border-radius:10px;padding:14px;background:#fff;height:100%}.av-stat-icon{width:40px;height:40px;border-radius:9px;background:#f1f4f8;color:#314965;display:flex;align-items:center;justify-content:center;font-size:18px}.av-stat-value{font-size:20px;font-weight:700;color:#263449}.av-stat-label{color:#758195;font-size:12px}.av-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.av-search{position:relative;width:340px;max-width:100%}.av-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#8792a5}.av-search input{padding-left:34px}
            .av-table-wrap{border:1px solid #e4e7ee;border-radius:9px;overflow:auto}.av-table{margin:0;white-space:nowrap}.av-table thead th{background:#1c2d45;color:#fff;border-color:#1c2d45;font-size:12px;font-weight:700;padding:12px}.av-table tbody td{vertical-align:middle;padding:11px 12px;color:#364152;font-size:13px}.av-empty{text-align:center;color:#8a94a6!important;padding:30px!important}.av-edit{background:#fff!important;border:1px solid #314965!important;color:#314965!important;font-size:12px;font-weight:600}.av-delete{background:#fff!important;border:1px solid #dc3545!important;color:#dc3545!important;font-size:12px;font-weight:600}.av-modal .modal-content{border:none;border-radius:12px;overflow:hidden}.av-modal .modal-header{background:#1c2d45;color:#fff;border:none}.av-modal .btn-close{filter:invert(1)}.av-label{color:#354154;font-size:12px;font-weight:700;margin-bottom:5px}.av-required{color:#dc3545}.av-filter{padding:15px;border:1px solid #e5e9f2;border-radius:9px;background:#f9fafc;margin-bottom:15px}.av-context{border:1px solid #f1cebc;background:#f6f8fa;color:#865038;border-radius:9px;padding:12px 14px;font-size:13px}.av-percent{font-weight:700;font-size:14px;margin-bottom:4px}.av-table .progress{height:5px;min-width:90px}
            @media(max-width:768px){.av-page{padding:12px}.av-search{width:100%}.av-toolbar{align-items:stretch}}
        `}</style>

      <Card className="av-card mb-3">
        <Card.Body>
          <Row className="align-items-center g-3">
            <Col lg={7}>
              <h4 className="av-title">Availability</h4>
              <div className="av-subtitle">
                Automatic live Availability from shift time, excluded breaks and
                downtime events.
              </div>
            </Col>
            <Col lg={5}>
              <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                <Button className="av-btn-outline" onClick={refresh}>
                  <ArrowClockwise className="me-1" />
                  Refresh
                </Button>
                <Button
                  className="av-btn-outline"
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

      

      <Card className="av-card">
        <Card.Body>
          <div className="av-tabs mb-3">
            {[
              [VIEW_CONFIG, "Configuration"],
              [VIEW_FORMULA, "Formula Master"],
              [VIEW_RUNTIME, "Live Runtime"],
              [VIEW_REPORT, "Report"],
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={`av-tab ${activeView === key ? "active" : ""}`}
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
            <div className="av-toolbar mb-3">
              <div className="av-search">
                <Search />
                <Form.Control
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search configuration or formula..."
                />
              </div>
              <Button
                className="av-btn-primary"
                onClick={
                  activeView === VIEW_CONFIG
                    ? openCreateConfig
                    : openCreateFormula
                }
              >
                <Plus className="me-1" />
                {activeView === VIEW_CONFIG
                  ? "Add Configuration"
                  : "Add Formula"}
              </Button>
            </div>
          )}

          {activeView === VIEW_CONFIG && (
            <div className="av-table-wrap">
              <Table responsive hover className="av-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Plant</th>
                    <th>Line</th>
                    <th>Machine</th>
                    <th>Formula</th>
                    <th>Breaks Excluded</th>
                    <th>Threshold</th>
                    <th>Interval</th>
                    <th>Target</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {configQ.isLoading ? (
                    <tr>
                      <td colSpan={12} className="av-empty">
                        <Spinner size="sm" className="me-2" />
                        Loading configurations...
                      </td>
                    </tr>
                  ) : !filteredConfigs.length ? (
                    <tr>
                      <td colSpan={12} className="av-empty">
                        No Availability configuration found.
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
                        <td>{safe(row.formula_code)}</td>
                        <td>
                          {boolValue(row.exclude_planned_breaks) ? "Yes" : "No"}
                        </td>
                        <td>
                          {displayDuration(row.availability_loss_threshold_sec)}
                        </td>
                        <td>{safe(row.calculation_interval_min)} min</td>
                        <td>
                          {hasValue(row.target_availability_pct)
                            ? `${row.target_availability_pct}%`
                            : "-"}
                        </td>
                        <td>v{safe(row.oee_config_version)}</td>
                        <td>
                          <StatusBadge
                            value={
                              boolValue(row.is_active) ? "ACTIVE" : "INACTIVE"
                            }
                          />
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              className="av-edit"
                              onClick={() => openEditConfig(row)}
                            >
                              <PencilSquare className="me-1" />
                              Edit
                            </Button>
                            {boolValue(row.is_active) && (
                              <Button
                                className="av-delete"
                                onClick={() => deactivate(row)}
                              >
                                Deactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {activeView === VIEW_FORMULA && (
            <div className="av-table-wrap">
              <Table responsive hover className="av-table">
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
                      <td colSpan={8} className="av-empty">
                        <Spinner size="sm" className="me-2" />
                        Loading formulas...
                      </td>
                    </tr>
                  ) : !filteredFormulas.length ? (
                    <tr>
                      <td colSpan={8} className="av-empty">
                        No Availability formula found.
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
                            className="av-edit"
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
              <div className="av-context mb-3">
                Live monitoring refreshes automatically every 10 seconds.
                Filters apply automatically and remain selected after a page
                refresh. Use Recalculate only for a completed shift that must
                use the latest configuration.
              </div>
              <ScopeFilters
                filters={filters}
                setFilters={setFilters}
                lookups={lookups}
                onClear={clearFilters}
              />
              <ScopeResults kind="availability" records={runtimeRows} loading={runtimeQ.isLoading}/>
<ResultTable
                rows={runtimeRows}
                loading={runtimeQ.isLoading}
                onRecalculate={recalculateRow}
                recalculatingId={
                  recalculateMutation.isPending
                    ? recalculateMutation.variables?.availability_result_id
                    : null
                }
              />
            </>
          )}
          {activeView === VIEW_REPORT && (
            <>
              <div className="d-flex justify-content-end mb-2">
                <Button className="av-btn-outline" onClick={exportReport}>
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
                    ? recalculateMutation.variables?.availability_result_id
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
        className="av-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {configForm.oee_config_id
              ? "Create New Configuration Version"
              : "Add Availability Configuration"}
          </Modal.Title>
        </Modal.Header>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            configMutation.mutate(configForm);
          }}
        >
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <SelectField
                  label="Company"
                  required
                  value={configForm.company_id}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      company_id: e.target.value,
                      plant_id: "",
                      line_id: "",
                      machine_id: "",
                      availability_formula_id: "",
                      downtime_rule_config_id: "",
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
                <SelectField
                  label="Plant"
                  required
                  value={configForm.plant_id}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      plant_id: e.target.value,
                      line_id: "",
                      machine_id: "",
                    }))
                  }
                >
                  <option value="">Select plant</option>
                  {formPlants.map((row) => (
                    <option key={plantId(row)} value={plantId(row)}>
                      {plantLabel(row)}
                    </option>
                  ))}
                </SelectField>
              </Col>
              <Col md={6}>
                <SelectField
                  label="Line"
                  required
                  value={configForm.line_id}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      line_id: e.target.value,
                      machine_id: "",
                    }))
                  }
                >
                  <option value="">Select line</option>
                  {formLines.map((row) => (
                    <option key={lineId(row)} value={lineId(row)}>
                      {lineLabel(row)}
                    </option>
                  ))}
                </SelectField>
              </Col>
              <Col md={6}>
                <SelectField
                  label="Machine"
                  required
                  value={configForm.machine_id}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      machine_id: e.target.value,
                      downtime_rule_config_id: "",
                    }))
                  }
                >
                  <option value="">Select machine</option>
                  {formMachines.map((row) => (
                    <option key={machineId(row)} value={machineId(row)}>
                      {machineLabel(row)}
                    </option>
                  ))}
                </SelectField>
              </Col>
              <Col md={6}>
                <SelectField
                  label="Availability Formula"
                  required
                  value={configForm.availability_formula_id}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      availability_formula_id: e.target.value,
                    }))
                  }
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
                  label="Downtime Rule"
                  required
                  value={configForm.downtime_rule_config_id}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      downtime_rule_config_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Select downtime rule</option>
                  {formRules.map((row) => (
                    <option
                      key={row.downtime_rule_config_id}
                      value={row.downtime_rule_config_id}
                    >
                      {row.machine_name || row.machine_code} -{" "}
                      {row.minor_stop_seconds}s
                    </option>
                  ))}
                </SelectField>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="av-label">
                    Availability Threshold Seconds
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={configForm.availability_loss_threshold_sec}
                    onChange={(e) =>
                      setConfigForm((current) => ({
                        ...current,
                        availability_loss_threshold_sec: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="av-label">
                    Calculation Interval Minutes
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
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
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="av-label">
                    Availability Target %
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={configForm.target_availability_pct}
                    onChange={(e) =>
                      setConfigForm((current) => ({
                        ...current,
                        target_availability_pct: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <SelectField
                  label="Zero Planned-Time Policy"
                  value={configForm.zero_planned_time_policy}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      zero_planned_time_policy: e.target.value,
                    }))
                  }
                >
                  <option value="NO_RESULT">No Result</option>
                  <option value="ZERO">Return Zero</option>
                </SelectField>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="av-label">Decimal Places</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="6"
                    value={configForm.decimal_places}
                    onChange={(e) =>
                      setConfigForm((current) => ({
                        ...current,
                        decimal_places: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Check
                  type="switch"
                  label="Exclude planned breaks"
                  checked={configForm.exclude_planned_breaks}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      exclude_planned_breaks: e.target.checked,
                    }))
                  }
                />
              </Col>
              <Col md={4}>
                <Form.Check
                  type="switch"
                  label="Automatic live calculation"
                  checked={configForm.auto_calculate}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      auto_calculate: e.target.checked,
                    }))
                  }
                />
              </Col>
              <Col md={4}>
                <Form.Check
                  type="switch"
                  label="Configuration active"
                  checked={configForm.is_active}
                  onChange={(e) =>
                    setConfigForm((current) => ({
                      ...current,
                      is_active: e.target.checked,
                    }))
                  }
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowConfig(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="av-btn-primary"
              disabled={configMutation.isPending}
            >
              {configMutation.isPending && (
                <Spinner size="sm" className="me-2" />
              )}
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
        className="av-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {formulaForm.formula_id
              ? "Create New Formula Version"
              : "Add Availability Formula"}
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
                  <Form.Label className="av-label">
                    Formula Code<span className="av-required"> *</span>
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
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="av-label">
                    Formula Name<span className="av-required"> *</span>
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
                  <Form.Label className="av-label">
                    Expression<span className="av-required"> *</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
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
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="av-label">Decimal Places</Form.Label>
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
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="av-label">Minimum</Form.Label>
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
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="av-label">Maximum</Form.Label>
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
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowFormula(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="av-btn-primary"
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
