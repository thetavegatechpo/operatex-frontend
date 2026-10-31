import "./GaugeSPC.css";
import { getUser } from "../../../../features/auth/utils/auth.jsx";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Alert,
  Badge,
  Button,
  Form,
  Modal,
  Spinner,
  Table
} from "react-bootstrap";

import gaugeSpcService from "../api/gaugespc.service.js";
import shiftService from "../../../enterprise-setup/shift-calendar/api/shift.service.js";
import machineService from "../../../master-data/machine-master/api/machine.service.js";

/* =========================================================
   DESIGN
========================================================= */

// Styles use the existing bundled Montserrat font.


/* =========================================================
   UTILITIES
========================================================= */

const asRows = response => {
  const data = response?.data?.data ??
    response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const asData = response =>
  response?.data?.data ?? response?.data ?? response;

const errorText = error => {
  const response = error?.response?.data;
  const details = response?.errors;

  if (Array.isArray(details) && details.length) {
    return details
      .map(item => item.message || item.field)
      .join("; ");
  }

  return response?.message ||
    error?.message ||
    "Operation failed.";
};

const localDate = () => {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
};

const displayDate = value => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN");
};

const getCalibrationDueStatus = (
  nextDueDate,
  referenceDate = new Date()
) => {
  if (!nextDueDate) {
    return {
      status: "NOT_SCHEDULED",
      label: "Not Scheduled",
      variant: "secondary",
      daysRemaining: null
    };
  }

  const dueDateString = String(nextDueDate).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateString)) {
    return {
      status: "INVALID_DATE",
      label: "Invalid Date",
      variant: "danger",
      daysRemaining: null
    };
  }

  const todayString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .formatToParts(referenceDate)
    .reduce((result, part) => {
      if (part.type !== "literal") {
        result[part.type] = part.value;
      }
      return result;
    }, {});

  const today =
    `${todayString.year}-${todayString.month}-${todayString.day}`;

  const days = Math.round(
    (
      Date.parse(`${dueDateString}T00:00:00Z`) -
      Date.parse(`${today}T00:00:00Z`)
    ) / 86400000
  );

  if (!Number.isFinite(days)) {
    return {
      status: "INVALID_DATE",
      label: "Invalid Date",
      variant: "danger",
      daysRemaining: null
    };
  }

  if (days < 0) {
    return {
      status: "OVERDUE",
      label: `Overdue by ${Math.abs(days)} day(s)`,
      variant: "danger",
      daysRemaining: days
    };
  }

  if (days === 0) {
    return {
      status: "DUE",
      label: "Due Today",
      variant: "warning",
      daysRemaining: 0
    };
  }

  return {
    status: "UPCOMING",
    label: `Due in ${days} day(s)`,
    variant: "success",
    daysRemaining: days
  };
};

const displayTime = value => {
  if (!value) return "—";

  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-IN", {
        hour12: true
      });
};

const active = value =>
  value === true ||
  value === 1 ||
  value === "1" ||
  String(value).toUpperCase() === "ACTIVE";

const badgeColor = status => {
  const value = String(status ?? "").toUpperCase();

  if (["ACTIVE", "OK", "IN_CONTROL"].includes(value)) {
    return "success";
  }

  if (["NOK", "OUT_OF_CONTROL"].includes(value)) {
    return "danger";
  }

  if (["INVALID", "INSUFFICIENT_DATA"].includes(value)) {
    return "warning";
  }

  return "secondary";
};

const randomKey = () => {
  if (typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `GSP-${Date.now()}-${Math.random()
    .toString(36).slice(2)}`;
};

const defaultGauge = {
  gauge_id: "",
  description: "",
  unit_of_meas: "mm",
  status: 1,
  last_cal_date: "",
  next_due_date: ""
};

const defaultParameter = {
  parameter_code: "",
  parameter_name: "",
  gauge_id: "",
  machine_id: "",
  unit: "mm",
  target_value: "",
  lower_limit: "",
  upper_limit: ""
};

const defaultRule = {
  rule_code: "",
  gauge_parameter_config_id: "",
  formula_id: "",
  subgroup_size: "5",
  minimum_subgroups: "5",
  center_line: "",
  lower_control_limit: "",
  upper_control_limit: "",
  is_active: true
};

function Field({ label, required = false, children }) {
  return (
    <div className="gs-field">
      <label>
        {label}
        {required && <span className="gs-required">*</span>}
      </label>
      {children}
    </div>
  );
}

function Status({ value }) {
  return (
    <Badge bg={badgeColor(value)} pill>
      {value ?? "—"}
    </Badge>
  );
}

function Kpi({ label, value, note, color = "#102b4e" }) {
  return (
    <div className="gs-kpi">
      <div className="gs-kpi-label">{label}</div>
      <div className="gs-kpi-value" style={{ color }}>
        {value}
      </div>
      <div className="gs-kpi-note">{note}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="gs-empty">{text}</div>;
}

/* =========================================================
   SIMPLE SVG TREND CHART
   No additional chart package required.
========================================================= */

function MeasurementTrend({ measurements, parameter }) {
  const records = measurements
    .filter(item =>
      item.calibration_valid === true &&
      ["OK", "NOK"].includes(item.result_status) &&
      Number.isFinite(Number(item.measured_value)) &&
      (!parameter ||
        item.gauge_parameter_config_id ===
          parameter.gauge_parameter_config_id)
    )
    .slice()
    .reverse()
    .slice(-40);

  if (!records.length) {
    return <Empty text="No eligible measurements for the selected parameter." />;
  }

  const values = records.map(item => Number(item.measured_value));

  const limits = parameter
    ? [
        Number(parameter.lower_limit),
        Number(parameter.upper_limit)
      ]
    : [];

  const all = [...values, ...limits].filter(Number.isFinite);

  const min = Math.min(...all) - 0.02;
  const max = Math.max(...all) + 0.02;

  const width = 800;
  const height = 285;
  const left = 58;
  const right = 25;
  const top = 25;
  const bottom = 35;

  const px = i =>
    left +
    i * (width - left - right) /
      Math.max(values.length - 1, 1);

  const py = value =>
    top +
    (max - value) / (max - min) *
      (height - top - bottom);

  const path = values
    .map((value, i) =>
      `${i ? "L" : "M"} ${px(i)} ${py(value)}`
    )
    .join(" ");

  const reference = (value, text, color) => {
    if (!Number.isFinite(value)) return null;

    return (
      <g key={text}>
        <line
          x1={left}
          x2={width - right}
          y1={py(value)}
          y2={py(value)}
          stroke={color}
          strokeDasharray="6 5"
        />
        <text
          x={left + 5}
          y={py(value) - 6}
          fontSize="12"
          fill={color}
        >
          {text}: {value}
        </text>
      </g>
    );
  };

  return (
    <>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", display: "block" }}
      >
        {[0, .25, .5, .75, 1].map((f, index) => {
          const y = top + f * (height - top - bottom);

          return (
            <g key={index}>
              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                stroke="#e6edf5"
              />
              <text
                x={left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#8293a8"
              >
                {(max - f * (max - min)).toFixed(3)}
              </text>
            </g>
          );
        })}

        {parameter && reference(
          Number(parameter.lower_limit), "LSL", "#e05262"
        )}

        {parameter && reference(
          Number(parameter.upper_limit), "USL", "#e05262"
        )}

        <path
          d={path}
          fill="none"
          stroke="#008e9e"
          strokeWidth="3"
        />

        {values.map((value, i) => (
          <circle
            key={i}
            cx={px(i)}
            cy={py(value)}
            r="4.5"
            fill="#008e9e"
          >
            <title>
              {records[i].serial_number_or_vin || "Reading"}
              : {value}
            </title>
          </circle>
        ))}
      </svg>

      <div className="gs-hint">
        Individual measurement trend with specification limits.
        These are not statistical SPC control limits.
      </div>
    </>
  );
}

function calculateTestCapability(measurements, parameterId) {
  const values = measurements
    .filter(m =>
      m.gauge_parameter_config_id === parameterId &&
      m.source_system === "SQL_TEST_SEED" &&
      /^SPCC00(0[1-9]|1[0-5])$/.test(
        m.serial_number_or_vin || ""
      ) &&
      m.calibration_valid === true &&
      m.result_status === "OK" &&
      m.is_deleted !== true
    )
    .sort((a, b) =>
      new Date(a.event_ts) - new Date(b.event_ts) ||
      String(a.measurement_event_id).localeCompare(
        String(b.measurement_event_id)
      )
    );

  const unavailable = reason => ({
    cp: null,
    cpk: null,
    reason
  });

  if (values.length !== 15) {
    return unavailable("Expected exactly 15 test readings");
  }

  if (
    new Set(values.map(m => m.serial_number_or_vin)).size !== 15
  ) {
    return unavailable("Duplicate or missing test VINs");
  }

  const readings = values.map(m => {
    if (m.measured_value == null || m.measured_value === "") {
      return NaN;
    }
    return Number(m.measured_value);
  });

  if (!readings.every(Number.isFinite)) {
    return unavailable("Invalid measurement values");
  }

  const ranges = [];

  for (let i = 0; i < 15; i += 5) {
    const subgroup = readings.slice(i, i + 5);

    ranges.push(
      Math.max(...subgroup) - Math.min(...subgroup)
    );
  }

  const rBar = ranges.reduce((a, b) => a + b, 0) / 3;
  const sigma = rBar / 2.326;

  if (!Number.isFinite(sigma) || sigma <= 0) {
    return unavailable("Invalid within-subgroup sigma");
  }

  const mean = readings.reduce((a, b) => a + b, 0) / 15;

  const lsl = 26.95;
  const usl = 27.05;

  return {
    cp: (usl - lsl) / (6 * sigma),
    cpk: Math.min(
      (usl - mean) / (3 * sigma),
      (mean - lsl) / (3 * sigma)
    ),
    mean,
    sigma,
    subgroupRanges: ranges,
    validated: false,
    method: "RBAR_D2_TEST_ONLY"
  };
}

/* =========================================================
   MAIN
========================================================= */

export default function GaugeSPC() {
  const user = getUser() || {};

 
const roleName = String(
  user.role_name ||
  user.roleName ||
  user.role?.role_name ||
  user.role?.name ||
  ""
).trim().toUpperCase();

const roleId = Number(
  user.role_id ??
  user.roleId ??
  user.role?.role_id ??
  user.role?.id
);

const isSupervisor =
  roleId === 5 ||
  roleName === "CHECKSHEET SUPERVISOR";

const isQualityManager =
  roleId === 7 ||
  roleName === "QUALITY MANAGER";

const canApproveSpc =
  isSupervisor || isQualityManager;

  const [tab, setTab] = useState(
  canApproveSpc ? "approvals" : "dashboard"
);
  const [configTab, setConfigTab] = useState("gauges");
  const [measurementTab, setMeasurementTab] =
    useState("record");

  const [gauges, setGauges] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [rules, setRules] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [spcResults, setSpcResults] = useState([]);
  
const [approvalQueue, setApprovalQueue] = useState([]);
const [approvalLoading, setApprovalLoading] = useState(false);
const [approvalError, setApprovalError] = useState("");
const [selectedApproval, setSelectedApproval] = useState(null);
const [approvalHistory, setApprovalHistory] = useState([]);
const [approvalDecision, setApprovalDecision] = useState("APPROVED");
const [approvalRemarks, setApprovalRemarks] = useState("");
const [approvalSubmitting, setApprovalSubmitting] = useState(false);
const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  
const testCapability = useMemo(
  () => calculateTestCapability(
    measurements,
    "9cb87ada-44bf-412f-bff4-364df5f2654e"
  ),
  [measurements]
);

const latestSpcResults = useMemo(() => {
  const latest = new Map();

  const sorted = [...spcResults].sort(
    (a, b) =>
      new Date(b.calculated_at).getTime() -
      new Date(a.calculated_at).getTime()
  );

  for (const result of sorted) {
    const ruleId = result.spc_rule_config_id;

    if (!ruleId || latest.has(ruleId)) continue;

    latest.set(ruleId, result);
  }

  return [...latest.values()];
}, [spcResults]);

  const [machines, setMachines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [report, setReport] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modal, setModal] = useState("");
  const [editingGauge, setEditingGauge] = useState(null);
  const [editingRule, setEditingRule] = useState(null);

  const [gaugeForm, setGaugeForm] = useState(defaultGauge);
  const [parameterForm, setParameterForm] =
    useState(defaultParameter);
  const [ruleForm, setRuleForm] = useState(defaultRule);

  
const [measurement, setMeasurement] = useState({
  gauge_parameter_config_id: "",
  shift_id: "",
  serial_number_or_vin: "",
  measured_value: "",
  business_date: localDate(),
  remarks: ""
});


  const [popup, setPopup] = useState(null);

  const [machineFilter, setMachineFilter] = useState("");
  const [parameterFilter, setParameterFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");

  const [fromDate, setFromDate] = useState(localDate());
  const [toDate, setToDate] = useState(localDate());

  const [appliedDates, setAppliedDates] = useState(null);

  const change = (setter, key, value) =>
    setter(previous => ({ ...previous, [key]: value }));

  const reportDates = useMemo(() => {
    const from = appliedDates?.from || fromDate;
    const to = appliedDates?.to || toDate;

    return {
      from_date: `${from}T00:00:00+05:30`,
      to_date: `${to}T23:59:59+05:30`
    };
  }, [appliedDates, fromDate, toDate]);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const load = useCallback(async () => {
    setLoading(true);

    const calls = [
      gaugeSpcService.getGauges(),
      gaugeSpcService.getParameters(),
      gaugeSpcService.getSpcRules(),
      gaugeSpcService.getSpcFormulas(),
      gaugeSpcService.getMeasurements({
        limit: 500,
        offset: 0
      }),
      gaugeSpcService.getSpcResults({
        limit: 100,
        offset: 0
      }),
     ...(canApproveSpc
  ? [Promise.resolve([]), Promise.resolve([])]
  : [
      shiftService.getMaster(),
      machineService.getMaster()
    ]),
      gaugeSpcService.getMeasurementReport(reportDates)
    ];

    const results = await Promise.allSettled(calls);

    const setters = [
      value => setGauges(asRows(value)),
      value => setParameters(asRows(value)),
      value => setRules(asRows(value)),
      value => setFormulas(asRows(value)),
      value => setMeasurements(asRows(value)),
      value => setSpcResults(asRows(value)),
      value => setShifts(
        asRows(value).filter(s =>
          !s.status ||
          String(s.status).toUpperCase() === "ACTIVE"
        )
      ),
      value => setMachines(asRows(value)),
      value => setReport(asData(value) || {})
    ];

    const problems = [];

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        setters[i](result.value);
      } else {
        problems.push(errorText(result.reason));
      }
    });

    if (problems.length) {
      setError([...new Set(problems)].join(" | "));
    }

    setLoading(false);
  }, [reportDates, canApproveSpc]);

  useEffect(() => {
    load();
  }, [load]);
  
useEffect(() => {
  if (tab === "approvals" && canApproveSpc) {
    loadApprovals();
  }
}, [tab, canApproveSpc]);

  const save = async (operation, message, done) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await operation();
      const data = asData(response);

      done?.(data);
      if (message) setSuccess(message);

      await load();

      return data;
    } catch (err) {
      setError(errorText(err));
      return null;
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     HELPERS
  ======================================================= */

  const selectedMeasurementParameter = parameters.find(
    p => p.gauge_parameter_config_id ===
      measurement.gauge_parameter_config_id
  );
   
const measurementValue = measurement.measured_value.trim();

const lowerSpecLimit =
  selectedMeasurementParameter?.lower_limit;

const upperSpecLimit =
  selectedMeasurementParameter?.upper_limit;

const hasValidSpecification =
  lowerSpecLimit != null &&
  upperSpecLimit != null &&
  Number.isFinite(Number(lowerSpecLimit)) &&
  Number.isFinite(Number(upperSpecLimit)) &&
  Number(lowerSpecLimit) < Number(upperSpecLimit);

const isPotentialNok =
  hasValidSpecification &&
  measurementValue !== "" &&
  Number.isFinite(Number(measurementValue)) &&
  (
    Number(measurementValue) < Number(lowerSpecLimit) ||
    Number(measurementValue) > Number(upperSpecLimit)
  );

  const activeParameters = parameters.filter(
    p => p.is_active && !p.is_deleted
  );

  const activeGauges = gauges.filter(
    g => active(g.status)
  );

  const getMachineName = id => {
    const machine = machines.find(
      m => String(m.machine_id) === String(id)
    );

    return machine?.machine_name || id || "—";
  };

  const eligibleMeasurements = measurements.filter(m =>
    ["OK", "NOK"].includes(m.result_status)
  );

  const filteredMeasurements = useMemo(() => {
    return measurements.filter(item => {
      const param = parameters.find(
        p => p.gauge_parameter_config_id ===
          item.gauge_parameter_config_id
      );

      if (
        machineFilter &&
        String(item.machine_id) !== machineFilter
      ) return false;

      if (
        parameterFilter &&
        item.gauge_parameter_config_id !== parameterFilter
      ) return false;

      if (
        resultFilter !== "ALL" &&
        item.result_status !== resultFilter
      ) return false;

      return true;
    });
  }, [
    measurements,
    parameters,
    machineFilter,
    parameterFilter,
    resultFilter
  ]);

  const okCount = filteredMeasurements.filter(
    m => m.result_status === "OK"
  ).length;

  const nokCount = filteredMeasurements.filter(
    m => m.result_status === "NOK"
  ).length;

  const invalidCount = filteredMeasurements.filter(
    m => m.result_status === "INVALID"
  ).length;

  const evaluated = okCount + nokCount;

  const okRate = evaluated
    ? (okCount / evaluated * 100).toFixed(1)
    : "0.0";

  const selectedChartParameter = parameters.find(
    p => p.gauge_parameter_config_id === parameterFilter
  );

  /* =======================================================
     GAUGE
  ======================================================= */

  const openAddGauge = () => {
    setEditingGauge(null);
    setGaugeForm({ ...defaultGauge });
    setModal("gauge");
  };

  const openEditGauge = gauge => {
    setEditingGauge(gauge);

    setGaugeForm({
      gauge_id: gauge.gauge_code || gauge.gauge_id,
      description: gauge.description || "",
      unit_of_meas: gauge.unit_of_meas || "mm",
      status: Number(gauge.status),
      last_cal_date: "",
      next_due_date: ""
    });

    setModal("gauge");
  };

  const submitGauge = event => {
    event.preventDefault();

    if (editingGauge) {
      save(
        () => gaugeSpcService.updateGauge(
          editingGauge.id,
          {
            description: gaugeForm.description.trim(),
            status: Number(gaugeForm.status)
          }
        ),
        "Gauge updated successfully.",
        () => {
          setModal("");
          setEditingGauge(null);
        }
      );

      return;
    }

    if (
      gaugeForm.next_due_date <=
      gaugeForm.last_cal_date
    ) {
      setError(
        "Next calibration date must be after last calibration date."
      );
      return;
    }

    save(
      () => gaugeSpcService.createGauge({
        ...gaugeForm,
        status: 1
      }),
      "Gauge created successfully.",
      () => setModal("")
    );
  };

  /* =======================================================
     PARAMETER
  ======================================================= */

  const submitParameter = event => {
    event.preventDefault();

    const lower = Number(parameterForm.lower_limit);
    const upper = Number(parameterForm.upper_limit);
    const target = Number(parameterForm.target_value);

    if (!(lower <= target && target <= upper) ||
        lower >= upper) {
      setError(
        "Required: LSL < USL and target must be within limits."
      );
      return;
    }

    save(
      () => gaugeSpcService.createParameter({
        ...parameterForm,
        gauge_id: Number(parameterForm.gauge_id),
        target_value: target,
        lower_limit: lower,
        upper_limit: upper,
        is_active: true,
        effective_from: new Date().toISOString()
      }),
      "Parameter created successfully.",
      () => {
        setModal("");
        setParameterForm({ ...defaultParameter });
      }
    );
  };

  /* =======================================================
     SPC RULES
  ======================================================= */

  const openAddRule = () => {
    setEditingRule(null);
    setRuleForm({ ...defaultRule });
    setModal("rule");
  };

  const openEditRule = rule => {
    const definition =
      typeof rule.rule_definition === "string"
        ? JSON.parse(rule.rule_definition)
        : rule.rule_definition || {};

    setEditingRule(rule);

    setRuleForm({
      rule_code: rule.rule_code,
      gauge_parameter_config_id:
        rule.gauge_parameter_config_id,
      formula_id: rule.formula_id,
      subgroup_size: String(rule.subgroup_size),
      minimum_subgroups: String(rule.minimum_subgroups),
      center_line: String(definition.center_line ?? ""),
      lower_control_limit:
        String(definition.lower_control_limit ?? ""),
      upper_control_limit:
        String(definition.upper_control_limit ?? ""),
      is_active: Boolean(rule.is_active)
    });

    setModal("rule");
  };

  const submitRule = event => {
    event.preventDefault();

    const center = Number(ruleForm.center_line);
    const lower = Number(ruleForm.lower_control_limit);
    const upper = Number(ruleForm.upper_control_limit);

    const size = Number(ruleForm.subgroup_size);
    const groups = Number(ruleForm.minimum_subgroups);

    if (
      !Number.isInteger(size) || size < 2 ||
      !Number.isInteger(groups) || groups < 2
    ) {
      setError(
        "Subgroup size and minimum subgroups must be valid integers of at least 2."
      );
      return;
    }

    if (
      !ruleForm.center_line.trim() ||
      !ruleForm.lower_control_limit.trim() ||
      !ruleForm.upper_control_limit.trim() ||
      !(lower < center && center < upper)
    ) {
      setError(
        "Control limits must satisfy LCL < Center Line < UCL."
      );
      return;
    }

    if (
      !formulas.some(f =>
        f.formula_id === ruleForm.formula_id &&
        String(f.formula_type).toUpperCase() === "SPC"
      )
    ) {
      setError("Select a valid SPC formula.");
      return;
    }

    const payload = {
      rule_code: ruleForm.rule_code.trim(),
      gauge_parameter_config_id:
        ruleForm.gauge_parameter_config_id,
      formula_id: ruleForm.formula_id,
      subgroup_size: size,
      minimum_subgroups: groups,
      rule_definition: {
        chart_type: "XBAR",
        center_line: center,
        lower_control_limit: lower,
        upper_control_limit: upper
      },
      is_active: Boolean(ruleForm.is_active),
      effective_from: new Date().toISOString()
    };

    save(
      () => editingRule
        ? gaugeSpcService.updateSpcRule(
            editingRule.spc_rule_config_id,
            payload
          )
        : gaugeSpcService.createSpcRule(payload),

      editingRule
        ? "New SPC rule version created."
        : "SPC rule created.",

      () => {
        setModal("");
        setEditingRule(null);
      }
    );
  };

  /* =======================================================
     MEASUREMENT
  ======================================================= */

  const submitMeasurement = event => {
    event.preventDefault();

    if (!selectedMeasurementParameter) {
      setError("Select a measurement parameter.");
      return;
    }

    if (
      measurement.measured_value.trim() === "" ||
      !Number.isFinite(Number(measurement.measured_value))
    ) {
      setError("Enter a valid measured value.");
      return;
    }

    const shift = shifts.find(
      s => String(s.shift_id) ===
        String(measurement.shift_id)
    );

    const serial = measurement.serial_number_or_vin.trim();

    const payload = {
      gauge_parameter_config_id:
        selectedMeasurementParameter.gauge_parameter_config_id,
      machine_id: selectedMeasurementParameter.machine_id,
      shift_id: Number(measurement.shift_id),
      business_date: measurement.business_date,
      serial_number_or_vin: serial,
      measured_value: Number(measurement.measured_value),
      
source_system: "OPERATOR_WORKSTATION",
remarks: measurement.remarks.trim() || null,
idempotency_key: randomKey()

    };

    save(
      () => gaugeSpcService.recordMeasurement(payload),
      "",
      result => {
        setPopup({
          ...result,
          parameter_name:
            selectedMeasurementParameter.parameter_name,
          unit: selectedMeasurementParameter.unit,
          shift_name: shift?.shift_name || "—",
          serial_number_or_vin:
            result?.serial_number_or_vin || serial
        });

        
setMeasurement(previous => ({
  ...previous,
  serial_number_or_vin: "",
  measured_value: "",
  remarks: ""
}));

      }
    );
  };

  /* =======================================================
     CSV EXPORT
  ======================================================= */

  const exportCSV = () => {
    if (!filteredMeasurements.length) {
      setError("No measurement records to export.");
      return;
    }

    const columns = [
      "event_ts",
      "business_date",
      "serial_number_or_vin",
      "measured_value",
      "result_status",
      "calibration_valid",
      "remarks"
    ];

    const csvCell = value => {
      let text = String(value ?? "");

      if (/^[=+@\t\r-]/.test(text)) {
        text = "'" + text;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [
      columns.join(","),
      ...filteredMeasurements.map(item =>
        columns.map(key => csvCell(item[key])).join(",")
      )
    ].join("\r\n");

    const blob = new Blob(
      [csv],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Gauge_SPC_Measurements.csv";
    link.click();

    URL.revokeObjectURL(url);
  };
  
const loadApprovals = async () => {
  if (!canApproveSpc) return;

  setApprovalLoading(true);
  setApprovalError("");

  try {
    const response = await gaugeSpcService.getApprovalQueue();
    setApprovalQueue(asRows(response));
  } catch (err) {
    setApprovalError(errorText(err));
  } finally {
    setApprovalLoading(false);
  }
};

const openApproval = async result => {
  setApprovalError("");
  setSelectedApproval(result);
  setApprovalHistory([]);
  setApprovalRemarks("");
  setApprovalDecision("APPROVED");
  setApprovalModalOpen(true);

  try {
    const history = await gaugeSpcService.getApprovalHistory(
      result.spc_result_id
    );

    setApprovalHistory(asRows(history));
  } catch (err) {
    setApprovalError(errorText(err));
  }
};

const submitApproval = async () => {
  if (!selectedApproval || !approvalRemarks.trim()) {
    setApprovalError("Approval remarks are mandatory.");
    return;
  }

  setApprovalSubmitting(true);
  setApprovalError("");

  try {
    await gaugeSpcService.decideSpcResult(
      selectedApproval.spc_result_id,
      approvalDecision,
      approvalRemarks.trim()
    );

    setApprovalModalOpen(false);
    setSelectedApproval(null);
    setSuccess(
      approvalDecision === "APPROVED"
        ? "SPC approval recorded successfully."
        : "SPC rejection recorded successfully."
    );

    await loadApprovals();
  } catch (err) {
    setApprovalError(errorText(err));
  } finally {
    setApprovalSubmitting(false);
  }
};

const getApprovalStage = result => {
  const status = String(
    result.approval_status || ""
  ).toUpperCase();

  if (status === "APPROVED") return "Final Approved";
  if (status === "REJECTED") return "Rejected";

  const step = Number(result.current_step || 1);

  return step === 1
    ? "Level 1 - Checksheet Supervisor"
    : step === 2
      ? "Level 2 - Quality Manager"
      : `Level ${step}`;
};

const canReviewApproval = result => {
  if (result.approval_status !== "PENDING_APPROVAL") {
    return false;
  }

  const step = Number(result.current_step);

  return (
    (step === 1 && isSupervisor) ||
    (step === 2 && isQualityManager)
  );
};

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <div className="gs-page">
      

      <div className="gs-header">
        <div>
          <div className="gs-kicker">
            OPERATEX / QUALITY MANAGEMENT
          </div>

          <h1 className="gs-title">
            Gauge & SPC Management
          </h1>

          <div className="gs-subtitle">
            Gauge configuration, measurements, quality
            performance and statistical monitoring.
          </div>
        </div>

        <Button
          variant="outline-secondary"
          onClick={load}
          disabled={loading}
        >
          {loading
            ? <Spinner animation="border" size="sm" />
            : "↻"}
        </Button>
      </div>

      {/* MAIN TABS */}

      <div className="gs-tabs">
  {[
  ...(!canApproveSpc
    ? [
        ["config", "Configuration"],
        ["measurements", "Measurements"]
      ]
    : []),

  ["dashboard", "Dashboard & Reports"],

  ...(canApproveSpc
    ? [["approvals", "SPC Approvals"]]
    : [])
].map(([key, name]) => (
          <button
            type="button"
            key={key}
            className={`gs-tab ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            {name}
          </button>
        ))}
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}
     
{canApproveSpc && tab === "approvals" && (
  <div className="gs-card">
    <div className="gs-row-head">
      <div>
        <h3 className="gs-card-title mb-1">
          SPC Approval Queue
        </h3>
        <div className="gs-caption">
          Review statistical results and complete
          the assigned approval level.
        </div>
      </div>

      <Button
        variant="outline-primary"
        disabled={approvalLoading}
        onClick={loadApprovals}
      >
        {approvalLoading ? "Loading..." : "Refresh"}
      </Button>
    </div>

    {approvalError && (
      <Alert variant="danger">
        {approvalError}
      </Alert>
    )}

    <div className="table-responsive">
      <Table hover className="gs-table">
        <thead>
          <tr>
            <th>Rule</th>
            <th>Parameter</th>
            <th>SPC Result</th>
            <th>Approval Status</th>
            <th>Current Level</th>
            <th>Calculated At</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {approvalQueue.map(result => (
            <tr key={result.spc_result_id}>
              <td>{result.rule_code || "—"}</td>

              <td>{result.parameter_name || "—"}</td>

              <td>
                <Status value={result.result_status} />
              </td>

              <td>
                <Badge
                  bg={
                    result.approval_status === "APPROVED"
                      ? "success"
                      : result.approval_status === "REJECTED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {result.approval_status}
                </Badge>
              </td>

              <td>{getApprovalStage(result)}</td>

              <td>{displayTime(result.calculated_at)}</td>

              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => openApproval(result)}
                >
                  {canReviewApproval(result)
                    ? "Review"
                    : "View"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {!approvalLoading && !approvalQueue.length && (
        <Empty text="No SPC approval records found." />
      )}
    </div>
  </div>
)}

      {/* ===================================================
          CONFIGURATION
      =================================================== */}

      {!isSupervisor && tab === "config" && (
        <>
          <div className="gs-subtabs">
            {[
              ["gauges", "Gauge Master"],
              ["parameters", "Parameter Configuration"],
              ["rules", "SPC Rule Configuration"],
              ["access", "Access & Permissions"]
            ].map(([key, name]) => (
              <button
                key={key}
                type="button"
                className={configTab === key ? "active" : ""}
                onClick={() => setConfigTab(key)}
              >
                {name}
              </button>
            ))}
          </div>

          {configTab === "gauges" && (
            <div className="gs-card">
              <div className="gs-row-head">
                <div>
                  <h3 className="gs-card-title mb-1">
                    Gauge Master
                  </h3>
                  <div className="gs-caption">
                    Manage instruments and calibration status.
                  </div>
                </div>

                <Button
                  className="gs-btn-primary"
                  onClick={openAddGauge}
                >
                  + Add Gauge
                </Button>
              </div>

              <div className="table-responsive">
                <Table hover className="gs-table">
                  <thead>
                    <tr>
                      <th>Gauge Code</th>
                      <th>Description</th>
                      <th>Unit</th>
                      <th>Calibration Due</th>
                      <th>Calibration Status</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gauges.map(g => (
                      <tr key={g.id}>
                        <td>
                          <strong>
                            {g.gauge_code || g.gauge_id}
                          </strong>
                        </td>
                        <td>{g.description}</td>
                        <td>{g.unit_of_meas}</td>
                        <td>{displayDate(g.next_due_date)}</td>
                        <td>
  {(() => {
    const due = getCalibrationDueStatus(g.next_due_date);

    return (
      <Badge bg={due.variant} pill>
        {due.label}
      </Badge>
    );
  })()}
</td>
                        <td>
                          <Status
                            value={active(g.status)
                              ? "ACTIVE" : "INACTIVE"}
                          />
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => openEditGauge(g)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {!gauges.length && (
                  <Empty text="No gauges registered." />
                )}
              </div>
            </div>
          )}

          {configTab === "parameters" && (
            <div className="gs-card">
              <div className="gs-row-head">
                <h3 className="gs-card-title mb-0">
                  Parameter Configuration
                </h3>

                <Button
                  className="gs-btn-primary"
                  onClick={() => {
                    setParameterForm({ ...defaultParameter });
                    setModal("parameter");
                  }}
                >
                  + Add Parameter
                </Button>
              </div>

              <div className="table-responsive">
                <Table hover className="gs-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Gauge</th>
                      <th>Machine</th>
                      <th>Target</th>
                      <th>LSL</th>
                      <th>USL</th>
                      <th>Version</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameters.map(p => (
                      <tr key={p.gauge_parameter_config_id}>
                        <td>
                          <strong>{p.parameter_name}</strong>
                          <div className="gs-hint">
                            {p.parameter_code}
                          </div>
                        </td>
                        <td>{p.gauge_code || p.gauge_id}</td>
                        <td>{getMachineName(p.machine_id)}</td>
                        <td>{p.target_value}</td>
                        <td>{p.lower_limit}</td>
                        <td>{p.upper_limit}</td>
                        <td>V{p.version_no}</td>
                        <td>
                          <Status value={
                            p.is_active ? "ACTIVE" : "INACTIVE"
                          } />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {!parameters.length && (
                  <Empty text="No parameter configurations found." />
                )}
              </div>

              <Alert variant="info" className="mt-3">
                Parameter Edit requires a version-controlled
                backend PUT endpoint. Existing measurement
                limits must not be overwritten.
              </Alert>
            </div>
          )}

          {configTab === "rules" && (
            <div className="gs-card">
              <div className="gs-row-head">
                <h3 className="gs-card-title mb-0">
                  SPC Rule Configuration
                </h3>

                <Button
                  className="gs-btn-primary"
                  onClick={openAddRule}
                >
                  + Add SPC Rule
                </Button>
              </div>

              <div className="table-responsive">
                <Table hover className="gs-table">
                  <thead>
                    <tr>
                      <th>Rule Code</th>
                      <th>Parameter</th>
                      <th>SPC Formula</th>
                      <th>Subgroups</th>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map(rule => {
                      const formula = formulas.find(
                        f => f.formula_id === rule.formula_id
                      );

                      return (
                        <tr key={rule.spc_rule_config_id}>
                          <td>
                            <strong>{rule.rule_code}</strong>
                          </td>
                          <td>{rule.parameter_name}</td>
                          <td>
                            {formula?.formula_name ||
                              rule.formula_id}
                          </td>
                          <td>
                            {rule.subgroup_size} ×{" "}
                            {rule.minimum_subgroups}
                          </td>
                          <td>V{rule.version_no}</td>
                          <td>
                            <Status value={
                              rule.is_active
                                ? "ACTIVE"
                                : "INACTIVE"
                            } />
                          </td>
                          
<td>
  <div className="d-flex gap-2">
    {rule.is_active ? (
      <Button
        type="button"
        size="sm"
        variant="outline-danger"
        disabled={saving}
        onClick={() => {
          const confirmed = window.confirm(
            `Are you sure you want to deactivate ` +
            `${rule.rule_code} (V${rule.version_no})?`
          );

          if (!confirmed) return;

          save(
            () => gaugeSpcService.deactivateSpcRule(
              rule.spc_rule_config_id
            ),
            "SPC rule deactivated successfully."
          );
        }}
      >
        Deactivate
      </Button>
    ) : (
      <Button
        type="button"
        size="sm"
        variant="outline-primary"
        disabled={saving}
        onClick={() => openEditRule(rule)}
      >
        Edit
      </Button>
    )}
  </div>
</td>

                        </tr>
                      );
                    })}
                  </tbody>
                </Table>

                {!rules.length && (
                  <Empty text="No SPC rules configured." />
                )}
              </div>
            </div>
          )}

          {configTab === "access" && (
            <div className="gs-card">
              <h3 className="gs-card-title">
                Gauge & SPC Access
              </h3>

              <Alert variant="info">
                User access is controlled by your existing
                Enterprise Setup → User Role Permission
                module. The table below explains what each
                permission allows; it is not a live list
                of assigned users or roles.
              </Alert>

              <div className="table-responsive">
                <Table className="gs-table">
                  <thead>
                    <tr>
                      <th>Permission</th>
                      <th>Function</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["gauge_spc:view",
                       "View gauges, parameters, rules and results"],
                      ["gauge_spc:config",
                       "Create and edit configurations"],
                      ["gauge_spc:execute",
                       "Submit measurements and authorized SPC executions"],
                      ["gauge_spc:report",
                       "Access quality reports"]
                    ].map(([code, description]) => (
                      <tr key={code}>
                        <td><strong>{code}</strong></td>
                        <td>{description}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="gs-hint">
                The backend enforces actual role grants.
                Displaying live assigned users requires a
                permission-summary API.
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================================================
          MEASUREMENTS
      =================================================== */}

      {!isSupervisor && tab === "measurements" && (
        <>
          <div className="gs-subtabs">
            {[
              ["record", "Record Measurement"],
              ["history", "Measurement History"]
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={
                  measurementTab === key ? "active" : ""
                }
                onClick={() => setMeasurementTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {measurementTab === "record" && (
            <div className="gs-grid">
              <div className="gs-card">
                <h3 className="gs-card-title">
                  Record Measurement
                </h3>

                <Form onSubmit={submitMeasurement}>
                  <div className="gs-grid">

                    <Field label="Parameter" required>
                      <Form.Select
                        required
                        value={measurement.gauge_parameter_config_id}
                        onChange={e => change(
                          setMeasurement,
                          "gauge_parameter_config_id",
                          e.target.value
                        )}
                      >
                        <option value="">
                          Select parameter
                        </option>

                        {activeParameters.map(p => (
                          <option
                            key={p.gauge_parameter_config_id}
                            value={p.gauge_parameter_config_id}
                          >
                            {p.parameter_name}
                            {" ("}{p.parameter_code}{")"}
                          </option>
                        ))}
                      </Form.Select>
                    </Field>

                    <Field label="Shift" required>
                      <Form.Select
                        required
                        value={measurement.shift_id}
                        onChange={e => change(
                          setMeasurement,
                          "shift_id",
                          e.target.value
                        )}
                      >
                        <option value="">Select shift</option>

                        {shifts.map(s => (
                          <option
                            key={s.shift_id}
                            value={s.shift_id}
                          >
                            {s.shift_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Field>

                    <Field label="Serial Number / VIN" required>
                      <Form.Control
                        required
                        value={measurement.serial_number_or_vin}
                        onChange={e => change(
                          setMeasurement,
                          "serial_number_or_vin",
                          e.target.value
                        )}
                      />
                    </Field>

                    <Field label="Measured Value" required>
                      <Form.Control
                        required
                        type="number"
                        step="any"
                        value={measurement.measured_value}
                        onChange={e => change(
                          setMeasurement,
                          "measured_value",
                          e.target.value
                        )}
                      />
                    </Field>

                    <Field label="Business Date" required>
                      <Form.Control
                        required
                        type="date"
                        value={measurement.business_date}
                        onChange={e => change(
                          setMeasurement,
                          "business_date",
                          e.target.value
                        )}
                      />
                    </Field>
                    
<div style={{ gridColumn: "1 / -1" }}>
  <Field
    label="Remarks"
    required={isPotentialNok}
  >
    <Form.Control
      as="textarea"
      rows={3}
      maxLength={5000}
      value={measurement.remarks}
      placeholder={
        isPotentialNok
          ? "Enter reason for NOK measurement"
          : "Optional remarks"
      }
      required={isPotentialNok}
      onChange={e =>
        change(
          setMeasurement,
          "remarks",
          e.target.value
        )
      }
    />

    {isPotentialNok && (
      <div className="gs-hint mt-2"
           style={{ color: "#c0392b" }}>
        Remarks are mandatory because this value
        is outside the specification limits.
      </div>
    )}
  </Field>
</div>

                  </div>

                  {selectedMeasurementParameter && (
                    <Alert variant="light" className="mt-3">
                      <strong>
                        {selectedMeasurementParameter.parameter_name}
                      </strong>
                      <div className="gs-hint mt-2">
                        Target:{" "}
                        {selectedMeasurementParameter.target_value}
                        {" | "}LSL:{" "}
                        {selectedMeasurementParameter.lower_limit}
                        {" | "}USL:{" "}
                        {selectedMeasurementParameter.upper_limit}
                        {" "}{selectedMeasurementParameter.unit}
                      </div>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="gs-btn-primary mt-3"
                    disabled={saving || !shifts.length}
                  >
                    {saving
                      ? "Saving..."
                      : "Submit Measurement"}
                  </Button>
                </Form>
              </div>

              <div className="gs-card">
                <h3 className="gs-card-title">
                  Measurement Instructions
                </h3>

                <p>
                  Select the parameter and shift, scan the
                  product serial number, then enter the
                  measured value.
                </p>

                <Alert variant="success">
                  <strong>OK</strong> — Reading within
                  configured specification limits.
                </Alert>

                <Alert variant="danger">
                  <strong>NOK</strong> — Reading outside
                  configured specification limits.
                </Alert>

                <Alert variant="warning">
                  An inactive gauge, expired calibration,
                  or invalid configuration is flagged by
                  the backend and must not be treated as OK.
                </Alert>
              </div>
            </div>
          )}

          {measurementTab === "history" && (
            <div className="gs-card">
              <div className="gs-row-head">
                <h3 className="gs-card-title mb-0">
                  Measurement History
                </h3>

                <Button
                  variant="outline-success"
                  onClick={exportCSV}
                >
                  Export CSV
                </Button>
              </div>

              <div className="table-responsive">
                <Table hover className="gs-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Serial / VIN</th>
                      <th>Machine</th>
                      <th>Value</th>
                      <th>Result</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map(m => (
                      <tr key={m.measurement_event_id}>
                        <td>{displayTime(m.event_ts)}</td>
                        <td>{m.serial_number_or_vin || "—"}</td>
                        <td>{getMachineName(m.machine_id)}</td>
                        <td>{m.measured_value}</td>
                        <td>
                          <Status value={m.result_status} />
                        </td>
                        <td>{m.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================================================
          DASHBOARD & REPORTS
      =================================================== */}

      {tab === "dashboard" && (
        <>
          <div className="gs-row-head">
  <div>
    <h3 className="gs-card-title mb-1">
      {isSupervisor
        ? "Supervisor — Quality Monitoring"
        : "Quality Performance Overview"}
    </h3>

    {isSupervisor && (
      <div className="gs-caption">
        Monitor gauge measurements, review SPC results,
        filter reports and export inspection history.
      </div>
    )}
  </div>

  {isSupervisor && (
    <Badge bg="info">
      VIEW & REPORT ACCESS
    </Badge>
  )}
</div>

          <div className="gs-card">
            <div className="gs-three">
              <Field label="Machine">
                <Form.Select
                  value={machineFilter}
                  onChange={e =>
                    setMachineFilter(e.target.value)
                  }
                >
                  <option value="">All machines</option>

                  {machines.map(m => (
                    <option
                      key={m.machine_id}
                      value={m.machine_id}
                    >
                      {m.machine_name}
                    </option>
                  ))}
                </Form.Select>
              </Field>

              <Field label="Parameter">
                <Form.Select
                  value={parameterFilter}
                  onChange={e =>
                    setParameterFilter(e.target.value)
                  }
                >
                  <option value="">All parameters</option>

                  {parameters.map(p => (
                    <option
                      key={p.gauge_parameter_config_id}
                      value={p.gauge_parameter_config_id}
                    >
                      {p.parameter_name}
                    </option>
                  ))}
                </Form.Select>
              </Field>

              <Field label="Result">
                <Form.Select
                  value={resultFilter}
                  onChange={e =>
                    setResultFilter(e.target.value)
                  }
                >
                  <option value="ALL">All results</option>
                  <option value="OK">OK</option>
                  <option value="NOK">NOK</option>
                </Form.Select>
              </Field>

              <Field label="Start Date">
                <Form.Control
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                />
              </Field>

              <Field label="End Date">
                <Form.Control
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                />
              </Field>

              <div className="d-flex align-items-end gap-2">
                <Button
                  className="gs-btn-primary"
                  onClick={() => {
                    if (fromDate > toDate) {
                      setError(
                        "Start date cannot exceed end date."
                      );
                      return;
                    }

                    setAppliedDates({
                      from: fromDate,
                      to: toDate
                    });
                  }}
                >
                  Apply
                </Button>

                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setMachineFilter("");
                    setParameterFilter("");
                    setResultFilter("ALL");
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <div className="gs-four mb-3">
            <Kpi
              label="Total Gauges"
              value={gauges.length}
              note={`${activeGauges.length} active`}
            />

            <Kpi
              label="OK"
              value={okCount}
              color="#128e77"
              note="Loaded matching measurements"
            />

            <Kpi
              label="NOK"
              value={nokCount}
              color="#d34554"
              note="Loaded matching measurements"
            />

            <Kpi
              label="OK Rate"
              value={`${okRate}%`}
              note="OK / (OK + NOK)"
            />
          </div>

          <div className="gs-grid">
            <div className="gs-card">
              <h3 className="gs-card-title">
                Measurement Result Distribution
              </h3>

              {[
                ["OK", okCount, "#128e77"],
                ["NOK", nokCount, "#e05262"]
              ].map(([label, count, color]) => (
                <div key={label} className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <strong>{label}</strong>
                    <strong>{count}</strong>
                  </div>

                  <div className="gs-progress">
                    <div
                      className="gs-progress-fill"
                      style={{
                        background: color,
                        width: `${
                          evaluated
                            ? count / evaluated * 100
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="gs-hint">
                {invalidCount} invalid historical readings
                excluded from OK/NOK rate. Counts refer
                to the latest loaded records, not
                the full database.
              </div>
            </div>

            <div className="gs-card">
              <h3 className="gs-card-title">
                Machine-wise Inspection Results
              </h3>

              {machines.map(machine => {
                const data = filteredMeasurements.filter(
                  m => String(m.machine_id) ===
                    String(machine.machine_id)
                );

                const ok = data.filter(
                  m => m.result_status === "OK"
                ).length;

                const nok = data.filter(
                  m => m.result_status === "NOK"
                ).length;

                const total = ok + nok;

                if (!total) return null;

                return (
                  <div
                    key={machine.machine_id}
                    className="mb-4"
                  >
                    <div className="d-flex justify-content-between mb-2">
                      <strong>{machine.machine_name}</strong>
                      <span className="gs-hint">
                        {total} readings · {ok} OK / {nok} NOK
                      </span>
                    </div>

                    <div className="gs-progress">
                      <div
                        className="gs-progress-fill"
                        style={{
                          width: `${ok / total * 100}%`,
                          background: "#128e77"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gs-card">
            <h3 className="gs-card-title">
              Measurement Trend
            </h3>

            <MeasurementTrend
              measurements={filteredMeasurements}
              parameter={selectedChartParameter}
            />
          </div>

          <div className="gs-four mb-3">
            <Kpi
              label="SPC Results"
              value={spcResults.length}
              note="Loaded backend SPC results"
            />

            <Kpi
              label="Out of Control"
              value={spcResults.filter(r =>
                r.result_status === "OUT_OF_CONTROL"
              ).length}
              color="#d34554"
              note="Calculated alerts"
            />

            <Kpi
              label="Active SPC Rules"
              value={rules.filter(r => r.is_active).length}
              note="Current loaded configurations"
            />

            <Kpi
              label="Cp / Cpk"
              value="N/A"
              note="Requires validated SPC calculation"
            />
          </div>
           
          <div className="gs-card">
            <div className="gs-row-head">
          <div className="gs-hint mt-3">
    {testCapability.reason ||
      "Calculated from the 15 Batch C test readings. " +
      "Not approved for production quality decisions."}
  </div>


              <h3 className="gs-card-title mb-0">
                SPC Monitoring
              </h3>

              <Badge bg="secondary">
                {latestSpcResults.length} Current Results
              </Badge>
            </div>

            
{!latestSpcResults.length ? (
  <Alert variant="info">
    No SPC calculation results are available.
  </Alert>
) : (
  <div className="table-responsive">
    <Table hover className="gs-table">
      <thead>
        <tr>
          <th>Calculated At</th>
          <th>Rule / Parameter</th>
          <th>Status</th>
          <th>Subgroups</th>
          <th>Measurement Progress</th>
          <th>Cp</th>
          <th>Cpk</th>
        </tr>
      </thead>

      <tbody>
        {latestSpcResults.map(result => {
          const statistics = result.statistics || {};

          const required = Number(
            statistics.required_measurements || 0
          );

          const eligible = Number(
            statistics.eligible_measurements ??
            statistics.total_available_measurements ??
            0
          );

          const progress = required > 0
            ? Math.min(
                100,
                (eligible / required) * 100
              )
            : 0;

          const completed = Number(
            statistics.completed_subgroups ??
            statistics.actual_subgroups ??
            0
          );

          const minimum = Number(
            statistics.minimum_subgroups || 0
          );

          return (
            <tr key={result.spc_result_id}>
              <td>
                {displayTime(result.calculated_at)}
              </td>

              <td>
                <strong>
                  {result.rule_code || "—"}
                </strong>

                <div className="gs-hint">
                  {result.parameter_name || "—"}
                </div>
              </td>

              <td>
                <Status value={result.result_status} />
              </td>

              <td>
                <strong>
                  {completed} / {minimum}
                </strong>
              </td>

              <td style={{ minWidth: 190 }}>
                <div className="gs-progress mb-2">
                  <div
                    className="gs-progress-fill"
                    style={{
                      width: `${progress}%`,
                      background:
                        progress >= 100
                          ? "#128e77"
                          : "#00869b"
                    }}
                  />
                </div>

                <div className="gs-hint">
                  {eligible} / {required} eligible readings
                </div>

                {result.result_status ===
                  "INSUFFICIENT_DATA" && (
                  <div
                    className="gs-hint"
                    style={{ color: "#d49119" }}
                  >
                    {Math.max(0, required - eligible)}
                    {" "}more readings required
                  </div>
                )}
              </td>

              <td>
                {statistics.cp == null
                  ? "N/A"
                  : Number(statistics.cp).toFixed(3)}
              </td>

              <td>
                {statistics.cpk == null
                  ? "N/A"
                  : Number(statistics.cpk).toFixed(3)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  </div>
)}


            <div className="gs-hint">
              SPC control limits and capability indices must
              be computed from validated statistical groups.
              The frontend never generates artificial values.
            </div>
          </div>

          <div className="gs-card">
            <div className="gs-row-head">
              <h3 className="gs-card-title mb-0">
                Detailed Measurement History
              </h3>

              <Button
                variant="outline-success"
                onClick={exportCSV}
              >
                Export CSV
              </Button>
            </div>

            <div className="table-responsive">
              <Table hover className="gs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Machine</th>
                    <th>Serial / VIN</th>
                    <th>Measured Value</th>
                    <th>Result</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMeasurements.map(m => (
                    <tr key={m.measurement_event_id}>
                      <td>{displayTime(m.event_ts)}</td>
                      <td>{getMachineName(m.machine_id)}</td>
                      <td>{m.serial_number_or_vin}</td>
                      <td>{m.measured_value}</td>
                      <td>
                        <Status value={m.result_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {!filteredMeasurements.length && (
              <Empty text="No measurements found." />
            )}
          </div>
        </>
      )}

      {/* ===================================================
          GAUGE / PARAMETER / RULE MODAL
      =================================================== */}

      <Modal
        show={!!modal}
        onHide={() => !saving && setModal("")}
        centered
        size="lg"
        className="gs-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {modal === "gauge"
              ? editingGauge
                ? "Edit Gauge"
                : "New Gauge"
              : modal === "parameter"
                ? "New Parameter Configuration"
                : editingRule
                  ? "Edit SPC Rule"
                  : "New SPC Rule"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {modal === "gauge" && (
            <Form onSubmit={submitGauge}>
              <div className="gs-grid">
                {!editingGauge && (
                  <Field label="Gauge Code" required>
                    <Form.Control
                      required
                      value={gaugeForm.gauge_id}
                      onChange={e => change(
                        setGaugeForm, "gauge_id",
                        e.target.value
                      )}
                    />
                  </Field>
                )}

                <Field label="Description" required>
                  <Form.Control
                    required
                    value={gaugeForm.description}
                    onChange={e => change(
                      setGaugeForm, "description",
                      e.target.value
                    )}
                  />
                </Field>

                {!editingGauge && (
                  <Field label="Unit" required>
                    <Form.Select
                      required
                      value={gaugeForm.unit_of_meas}
                      onChange={e => change(
                        setGaugeForm, "unit_of_meas",
                        e.target.value
                      )}
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="inch">inch</option>
                      <option value="bar">bar</option>
                      <option value="MPa">MPa</option>
                    </Form.Select>
                  </Field>
                )}

                <Field label="Status" required>
                  <Form.Select
                    value={gaugeForm.status}
                    onChange={e => change(
                      setGaugeForm, "status",
                      Number(e.target.value)
                    )}
                  >
                    <option value={1}>Active</option>
                    {editingGauge && (
                      <option value={0}>Inactive</option>
                    )}
                  </Form.Select>
                </Field>

                {!editingGauge && (
                  <>
                    <Field label="Last Calibration" required>
                      <Form.Control
                        required
                        type="date"
                        value={gaugeForm.last_cal_date}
                        onChange={e => change(
                          setGaugeForm, "last_cal_date",
                          e.target.value
                        )}
                      />
                    </Field>

                    <Field label="Next Calibration Due" required>
                      <Form.Control
                        required
                        type="date"
                        value={gaugeForm.next_due_date}
                        onChange={e => change(
                          setGaugeForm, "next_due_date",
                          e.target.value
                        )}
                      />
                    </Field>
                  </>
                )}
              </div>

              {editingGauge && (
                <Alert variant="info" className="mt-3">
                  The current PUT API edits description and
                  status. Calibration changes require their
                  own controlled update workflow.
                </Alert>
              )}

              <div className="gs-form-actions">
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => setModal("")}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className="gs-btn-primary"
                  disabled={saving}
                >
                  {editingGauge
                    ? "Update Gauge"
                    : "Save Gauge"}
                </Button>
              </div>
            </Form>
          )}

          {modal === "parameter" && (
            <Form onSubmit={submitParameter}>
              <div className="gs-grid">

                <Field label="Parameter Code" required>
                  <Form.Control
                    required
                    value={parameterForm.parameter_code}
                    onChange={e => change(
                      setParameterForm,
                      "parameter_code",
                      e.target.value
                    )}
                  />
                </Field>

                <Field label="Parameter Name" required>
                  <Form.Control
                    required
                    value={parameterForm.parameter_name}
                    onChange={e => change(
                      setParameterForm,
                      "parameter_name",
                      e.target.value
                    )}
                  />
                </Field>

                <Field label="Gauge" required>
                  <Form.Select
                    required
                    value={parameterForm.gauge_id}
                    onChange={e => {
                      const gauge = gauges.find(
                        g => String(g.id) === e.target.value
                      );

                      setParameterForm(previous => ({
                        ...previous,
                        gauge_id: e.target.value,
                        unit: gauge?.unit_of_meas || "mm"
                      }));
                    }}
                  >
                    <option value="">Select gauge</option>

                    {activeGauges.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.gauge_code || g.gauge_id}
                        {" - "}{g.description}
                      </option>
                    ))}
                  </Form.Select>
                </Field>

                <Field label="Machine" required>
                  <Form.Select
                    required
                    value={parameterForm.machine_id}
                    onChange={e => change(
                      setParameterForm,
                      "machine_id",
                      e.target.value
                    )}
                  >
                    <option value="">Select machine</option>

                    {machines.map(m => (
                      <option
                        key={m.machine_id}
                        value={m.machine_id}
                      >
                        {m.machine_name}
                      </option>
                    ))}
                  </Form.Select>
                </Field>

                {[
                  ["target_value", "Target Value"],
                  ["lower_limit", "Lower Limit (LSL)"],
                  ["upper_limit", "Upper Limit (USL)"]
                ].map(([key, label]) => (
                  <Field key={key} label={label} required>
                    <Form.Control
                      required
                      type="number"
                      step="any"
                      value={parameterForm[key]}
                      onChange={e => change(
                        setParameterForm,
                        key,
                        e.target.value
                      )}
                    />
                  </Field>
                ))}

                <Field label="Unit" required>
                  <Form.Control
                    value={parameterForm.unit}
                    readOnly
                    required
                  />
                </Field>
              </div>

              <div className="gs-form-actions">
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={() => setModal("")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gs-btn-primary"
                  disabled={saving}
                >
                  Save Parameter
                </Button>
              </div>
            </Form>
          )}

          {modal === "rule" && (
            <Form onSubmit={submitRule}>
              <div className="gs-grid">
                <Field label="Rule Code" required>
                  <Form.Control
                    required
                    readOnly={!!editingRule}
                    value={ruleForm.rule_code}
                    onChange={e => change(
                      setRuleForm,
                      "rule_code",
                      e.target.value
                    )}
                  />
                </Field>

                <Field label="Measurement Parameter" required>
                  <Form.Select
                    required
                    value={ruleForm.gauge_parameter_config_id}
                    onChange={e => change(
                      setRuleForm,
                      "gauge_parameter_config_id",
                      e.target.value
                    )}
                  >
                    <option value="">Select parameter</option>

                    {activeParameters.map(p => (
                      <option
                        key={p.gauge_parameter_config_id}
                        value={p.gauge_parameter_config_id}
                      >
                        {p.parameter_name} ({p.parameter_code})
                      </option>
                    ))}
                  </Form.Select>
                </Field>

                <Field label="SPC Formula" required>
                  <Form.Select
                    required
                    value={ruleForm.formula_id}
                    onChange={e => change(
                      setRuleForm,
                      "formula_id",
                      e.target.value
                    )}
                  >
                    <option value="">Select SPC formula</option>

                    {formulas.map(f => (
                      <option
                        key={f.formula_id}
                        value={f.formula_id}
                      >
                        {f.formula_name}
                        {" ("}{f.formula_code}
                        {" - V"}{f.version_no}{")"}
                      </option>
                    ))}
                  </Form.Select>
                </Field>

                <Field label="Status" required>
                  <Form.Select
                    required
                    value={String(ruleForm.is_active)}
                    onChange={e => change(
                      setRuleForm,
                      "is_active",
                      e.target.value === "true"
                    )}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Field>

                {[
                  ["subgroup_size", "Subgroup Size"],
                  ["minimum_subgroups", "Minimum Subgroups"],
                  ["center_line", "Center Line"],
                  ["lower_control_limit", "Lower Control Limit"],
                  ["upper_control_limit", "Upper Control Limit"]
                ].map(([key, label]) => (
                  <Field key={key} label={label} required>
                    <Form.Control
                      required
                      type="number"
                      step={
                        key.includes("subgroup") ? "1" : "any"
                      }
                      min={
                        key.includes("subgroup") ? 2 : undefined
                      }
                      value={ruleForm[key]}
                      onChange={e => change(
                        setRuleForm, key, e.target.value
                      )}
                    />
                  </Field>
                ))}
              </div>

              <Alert variant="info" className="mt-3">
                New rules default to Active. The backend
                must validate formula compatibility and
                approved control-limit policy before
                activation is accepted.
              </Alert>

              <div className="gs-form-actions">
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => setModal("")}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className="gs-btn-primary"
                  disabled={saving}
                >
                  {editingRule
                    ? "Update SPC Rule"
                    : "Save SPC Rule"}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* ===================================================
          MEASUREMENT RESULT POPUP
      =================================================== */}

      <Modal
        show={!!popup}
        onHide={() => setPopup(null)}
        centered
        className="gs-modal"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Measurement Recorded
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {popup && (
            <>
              <div
                className="gs-reading-result"
                style={{
                  background:
                    popup.result_status === "OK"
                      ? "#e5f7f0"
                      : popup.result_status === "NOK"
                        ? "#fff0f1"
                        : "#fff7e6"
                }}
              >
                <div style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color:
                    popup.result_status === "OK"
                      ? "#128e77"
                      : popup.result_status === "NOK"
                        ? "#d34554"
                        : "#bd850a"
                }}>
                  {popup.result_status || "UNKNOWN"}
                </div>

                <div className="gs-result-number">
                  {popup.measured_value} {popup.unit}
                </div>
              </div>

              <Table borderless>
                <tbody>
                  <tr>
                    <td>Parameter</td>
                    <td><strong>{popup.parameter_name}</strong></td>
                  </tr>
                  <tr>
                    <td>Serial / VIN</td>
                    <td>{popup.serial_number_or_vin}</td>
                  </tr>
                  <tr>
                    <td>Shift</td>
                    <td>{popup.shift_name}</td>
                  </tr>
                  <tr>
                    <td>Calibration</td>
                    <td>
                      <Status value={
                        popup.calibration_valid
                          ? "ACTIVE"
                          : "INVALID"
                      } />
                    </td>
                  </tr>
                </tbody>
              </Table>

              {popup.remarks && (
                <Alert variant="warning">
                  {popup.remarks}
                </Alert>
              )}

              {popup.result_status === "NOK" && (
                <Alert variant="danger">
                  Measurement is outside the configured
                  specification limits. Follow the
                  applicable quality procedure.
                </Alert>
              )}

              {popup.result_status === "INVALID" && (
                <Alert variant="warning">
                  Reading cannot be accepted for quality
                  approval. Check gauge status and
                  calibration.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            className="gs-btn-primary"
            onClick={() => setPopup(null)}
          >
            Close & Continue
          </Button>
        </Modal.Footer>
      </Modal>

      
<Modal
  show={approvalModalOpen}
  onHide={() => {
    if (!approvalSubmitting) setApprovalModalOpen(false);
  }}
  centered
  size="lg"
  className="gs-modal"
>
  <Modal.Header closeButton>
    <Modal.Title>SPC Result Review</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {selectedApproval && (
      <>
        <div className="gs-grid mb-3">
          <div>
            <strong>Rule</strong>
            <div>{selectedApproval.rule_code || "—"}</div>
          </div>

          <div>
            <strong>Parameter</strong>
            <div>{selectedApproval.parameter_name || "—"}</div>
          </div>

          <div>
            <strong>SPC Status</strong>
            <div>
              <Status value={selectedApproval.result_status} />
            </div>
          </div>

          <div>
            <strong>Approval Level</strong>
            <div>{getApprovalStage(selectedApproval)}</div>
          </div>
        </div>

        <h6>Calculated Statistics</h6>
        <pre
          style={{
            background: "#f4f7fc",
            padding: 14,
            borderRadius: 8,
            maxHeight: 240,
            overflow: "auto",
            fontSize: 12
          }}
        >
          {JSON.stringify(
            selectedApproval.statistics || {},
            null,
            2
          )}
        </pre>

        <h6 className="mt-3">Approval History</h6>

        {approvalHistory.length ? (
          <Table size="sm" bordered responsive>
            <thead>
              <tr>
                <th>Step</th>
                <th>Decision</th>
                <th>Remarks</th>
                <th>Reviewer</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {approvalHistory.map((item, index) => (
                <tr key={item.approval_event_id || index}>
                  <td>{item.approval_step}</td>
                  <td>{item.decision}</td>
                  <td>{item.remarks}</td>
                  <td>{item.decided_by}</td>
                  <td>{displayTime(item.decided_at)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="gs-hint">
            No previous approval decisions.
          </div>
        )}

        {canReviewApproval(selectedApproval) && (
          <>
            <hr />

            <Form.Group className="mb-3">
              <Form.Label>Decision</Form.Label>
              <Form.Select
                value={approvalDecision}
                onChange={e =>
                  setApprovalDecision(e.target.value)
                }
              >
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>
                Review Remarks <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                maxLength={5000}
                value={approvalRemarks}
                onChange={e =>
                  setApprovalRemarks(e.target.value)
                }
                placeholder="Enter review observations"
              />
            </Form.Group>
          </>
        )}

        {approvalError && (
          <Alert variant="danger" className="mt-3">
            {approvalError}
          </Alert>
        )}
      </>
    )}
  </Modal.Body>

  <Modal.Footer>
    <Button
      variant="outline-secondary"
      onClick={() => setApprovalModalOpen(false)}
      disabled={approvalSubmitting}
    >
      Close
    </Button>

    {selectedApproval &&
      canReviewApproval(selectedApproval) && (
        <Button
          variant={
            approvalDecision === "REJECTED"
              ? "danger"
              : "success"
          }
          disabled={
            approvalSubmitting ||
            !approvalRemarks.trim()
          }
          onClick={submitApproval}
        >
          {approvalSubmitting
            ? "Submitting..."
            : approvalDecision === "APPROVED"
              ? "Confirm Approval"
              : "Confirm Rejection"}
        </Button>
      )}
  </Modal.Footer>
</Modal>

    </div>
  );
}
