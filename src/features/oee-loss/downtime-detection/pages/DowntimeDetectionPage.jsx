
import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/DowntimeDetection/DowntimeDetection.jsx

import React, { useMemo, useState } from "react";
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
    CheckCircleFill,
    ClockHistory,
    Download,
    ExclamationTriangleFill,
    GearFill,
    PencilSquare,
    PlayFill,
    Plus,
    Search,
    StopCircleFill
} from "react-bootstrap-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";
import downtimeService, {
    assignDowntimeLossReason,
    createDowntimeConfig,
    createLossReason,
    executeDowntimeDetection,
    exportDowntimeReport,
    getDowntimeConfig,
    getDowntimeReport,
    getDowntimeRuntime,
    getLossReasons,
    softDeleteDowntimeConfig,
    softDeleteLossReason,
    updateDowntimeConfig,
    updateLossReason
} from "../api/downtimeDetection.service.js";

const VIEW_CONFIG = "CONFIG";
const VIEW_REASONS = "REASONS";
const VIEW_RUNTIME = "RUNTIME";
const VIEW_REPORT = "REPORT";

const configInitialState = {
    downtime_rule_config_id: "",
    company_id: "",
    plant_id: "",
    line_id: "",
    machine_id: "",
    minor_stop_seconds: 300,
    default_loss_reason_id: "",
    is_active: true,
    effective_from: "",
    effective_to: ""
};

const reasonInitialState = {
    loss_reason_id: "",
    company_id: "",
    reason_code: "",
    reason_name: "",
    category: "BREAKDOWN",
    is_planned: false,
    affects_availability: true,
    status: "ACTIVE"
};

const executeInitialState = {
    machine_status_event_id: "",
    source_system: "MES_UI",
    correlation_id: "",
    idempotency_key: ""
};

const filterInitialState = {
    company_id: "",
    plant_id: "",
    line_id: "",
    machine_id: "",
    shift_id: "",
    loss_reason_id: "",
    category: "",
    event_status: "",
    downtime_class: "",
    affects_availability: "",
    from_date: "",
    to_date: "",
    limit: 100,
    offset: 0
};

const hasValue = value => value !== undefined && value !== null && value !== "";
const sameId = (left, right) => String(left ?? "") === String(right ?? "");
const boolValue = value => value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
const safeText = value => hasValue(value) ? String(value) : "-";

const displayDateTime = value => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const displayDuration = value => {
    if (!hasValue(value)) return "Running";
    const total = Math.max(0, Number(value) || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = Math.floor(total % 60);
    return [hours && `${hours}h`, minutes && `${minutes}m`, `${seconds}s`].filter(Boolean).join(" ");
};

const toInputDateTime = value => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};

const toApiDate = value => value ? new Date(value).toISOString() : "";

const errorText = error => {
    const body = error?.response?.data;
    if (Array.isArray(body?.errors) && body.errors.length) return body.errors.join(" | ");
    return body?.message || error?.message || "Request failed.";
};

const extractRows = (response, keys = []) => {
    const body = response?.data ?? response;
    const payload = body?.data ?? body;
    if (Array.isArray(payload)) return payload;
    for (const key of keys) {
        if (Array.isArray(payload?.[key])) return payload[key];
    }
    return [];
};

const useLookupQuery = (key, url, keys) => useQuery({
    queryKey: ["downtime", key],
    queryFn: async () => extractRows(await api.get(url), keys)
});

const companyId = item => item?.company_id ?? item?.companyId ?? "";
const companyLabel = item => item?.company_name ?? item?.company_code ?? companyId(item);
const plantId = item => item?.plant_id ?? item?.shop_id ?? "";
const plantLabel = item => item?.plant_name ?? item?.shop_name ?? item?.plant_code ?? plantId(item);
const lineId = item => item?.line_id ?? "";
const lineLabel = item => item?.line_name ?? item?.line_code ?? lineId(item);
const machineId = item => item?.machine_id ?? "";
const machineLabel = item => item?.machine_name ?? item?.machine_code ?? machineId(item);

const downloadCsv = (rows, filename) => {
    if (!Array.isArray(rows) || !rows.length) throw new Error("No report records found to export.");
    const headers = Object.keys(rows[0]);
    const escape = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(","), ...rows.map(row => headers.map(key => escape(row[key])).join(","))].join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
};

const StatusBadge = ({ value }) => {
    const text = String(value || "-").toUpperCase();
    const variant = text === "OPEN" ? "danger" : text === "CLOSED" || text === "ACTIVE" ? "success" : "secondary";
    return <Badge bg={variant}>{text}</Badge>;
};

const ClassBadge = ({ value }) => {
    const text = String(value || "-").toUpperCase();
    return <Badge bg={text === "DOWNTIME" ? "danger" : text === "MINOR_STOP" ? "warning" : "secondary"} text={text === "MINOR_STOP" ? "dark" : undefined}>{text}</Badge>;
};

const SelectField = ({ label, value, onChange, children, required = false, disabled = false }) => (
    <Form.Group>
        <Form.Label className="dt-label">{label}{required && <span className="dt-required"> *</span>}</Form.Label>
        <Form.Select value={value} onChange={onChange} required={required} disabled={disabled}>{children}</Form.Select>
    </Form.Group>
);

function FilterPanel({ filters, setFilters, companies, plants, lines, machines, reasons, onApply, onClear, includeCategory }) {
    const set = (field, value, clears = []) => setFilters(current => ({
        ...current,
        [field]: value,
        ...Object.fromEntries(clears.map(key => [key, ""]))
    }));

    const filteredPlants = plants.filter(item => !filters.company_id || !companyId(item) || sameId(companyId(item), filters.company_id));
    const filteredLines = lines.filter(item => !filters.plant_id || !plantId(item) || sameId(plantId(item), filters.plant_id));
    const filteredMachines = machines.filter(item => !filters.line_id || !lineId(item) || sameId(lineId(item), filters.line_id));
    const filteredReasons = reasons.filter(item => !filters.company_id || !item.company_id || sameId(item.company_id, filters.company_id));

    return (
        <div className="dt-filter">
            <Row className="g-2">
                <Col lg={2} md={4}><SelectField label="Company" value={filters.company_id} onChange={e => set("company_id", e.target.value, ["plant_id", "line_id", "machine_id", "loss_reason_id"])}><option value="">All</option>{companies.map(item => <option key={companyId(item)} value={companyId(item)}>{companyLabel(item)}</option>)}</SelectField></Col>
                <Col lg={2} md={4}><SelectField label="Plant" value={filters.plant_id} onChange={e => set("plant_id", e.target.value, ["line_id", "machine_id"])}><option value="">All</option>{filteredPlants.map(item => <option key={plantId(item)} value={plantId(item)}>{plantLabel(item)}</option>)}</SelectField></Col>
                <Col lg={2} md={4}><SelectField label="Line" value={filters.line_id} onChange={e => set("line_id", e.target.value, ["machine_id"])}><option value="">All</option>{filteredLines.map(item => <option key={lineId(item)} value={lineId(item)}>{lineLabel(item)}</option>)}</SelectField></Col>
                <Col lg={2} md={4}><SelectField label="Machine" value={filters.machine_id} onChange={e => set("machine_id", e.target.value)}><option value="">All</option>{filteredMachines.map(item => <option key={machineId(item)} value={machineId(item)}>{machineLabel(item)}</option>)}</SelectField></Col>
                <Col lg={2} md={4}><SelectField label="Loss Reason" value={filters.loss_reason_id} onChange={e => set("loss_reason_id", e.target.value)}><option value="">All</option>{filteredReasons.map(item => <option key={item.loss_reason_id} value={item.loss_reason_id}>{item.reason_code} - {item.reason_name}</option>)}</SelectField></Col>
                <Col lg={2} md={4}><SelectField label="Event Status" value={filters.event_status} onChange={e => set("event_status", e.target.value)}><option value="">All</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option></SelectField></Col>
                <Col lg={2} md={4}><SelectField label="Class" value={filters.downtime_class} onChange={e => set("downtime_class", e.target.value)}><option value="">All</option><option value="MINOR_STOP">Minor Stop</option><option value="DOWNTIME">Downtime</option></SelectField></Col>
                <Col lg={2} md={4}><SelectField label="Availability" value={filters.affects_availability} onChange={e => set("affects_availability", e.target.value)}><option value="">All</option><option value="true">Affects</option><option value="false">Does Not Affect</option></SelectField></Col>
                {includeCategory && <Col lg={2} md={4}><Form.Group><Form.Label className="dt-label">Category</Form.Label><Form.Control value={filters.category} onChange={e => set("category", e.target.value)} placeholder="e.g. BREAKDOWN" /></Form.Group></Col>}
                <Col lg={2} md={4}><Form.Group><Form.Label className="dt-label">From</Form.Label><Form.Control type="datetime-local" value={filters.from_date} onChange={e => set("from_date", e.target.value)} /></Form.Group></Col>
                <Col lg={2} md={4}><Form.Group><Form.Label className="dt-label">To</Form.Label><Form.Control type="datetime-local" value={filters.to_date} onChange={e => set("to_date", e.target.value)} /></Form.Group></Col>
                <Col lg={2} md={4} className="d-flex align-items-end gap-2"><Button className="dt-btn-primary flex-grow-1" onClick={onApply}>Apply</Button><Button className="dt-btn-outline" onClick={onClear}>Clear</Button></Col>
            </Row>
        </div>
    );
}

function EventTable({ rows, loading, onAssignReason }) {
    return (
        <div className="dt-table-wrap">
            <Table responsive hover className="dt-table">
                <thead><tr><th>Start</th><th>End</th><th>Machine</th><th>Shift</th><th>Duration</th><th>Class</th><th>Loss Reason</th><th>Category</th><th>Availability</th><th>Status</th><th>Source</th><th>Action</th></tr></thead>
                <tbody>
                    {loading ? <tr><td colSpan={12} className="dt-empty"><Spinner size="sm" animation="border" className="me-2" />Loading downtime events...</td></tr>
                        : !rows.length ? <tr><td colSpan={12} className="dt-empty">No downtime events found.</td></tr>
                            : rows.map(row => <tr key={row.downtime_event_id}>
                                <td>{displayDateTime(row.start_ts)}</td><td>{displayDateTime(row.end_ts)}</td>
                                <td><strong>{safeText(row.machine_name || row.machine_code)}</strong></td><td>{safeText(row.shift_id)}</td>
                                <td>{displayDuration(row.duration_seconds)}</td><td><ClassBadge value={row.downtime_class} /></td>
                                <td>{safeText(row.reason_name || row.reason_code)}</td><td>{safeText(row.category)}</td>
                                <td>{boolValue(row.affects_availability) ? <Badge bg="danger">YES</Badge> : <Badge bg="secondary">NO</Badge>}</td>
                                <td><StatusBadge value={row.event_status} /></td><td>{safeText(row.source_system)}</td>
                                <td><Button className="dt-edit" onClick={() => onAssignReason(row)}>{row.loss_reason_id ? "Change Reason" : "Assign Reason"}</Button></td>
                            </tr>)}
                </tbody>
            </Table>
        </div>
    );
}

const DowntimeDetection = () => {
    const queryClient = useQueryClient();
    const [activeView, setActiveView] = useState(VIEW_CONFIG);
    const [searchText, setSearchText] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [showExecuteModal, setShowExecuteModal] = useState(false);
    const [showAssignReasonModal, setShowAssignReasonModal] = useState(false);
    const [configForm, setConfigForm] = useState(configInitialState);
    const [reasonForm, setReasonForm] = useState(reasonInitialState);
    const [executeForm, setExecuteForm] = useState(executeInitialState);
    const [reasonAssignment, setReasonAssignment] = useState({
        downtime_event_id: "",
        company_id: "",
        loss_reason_id: "",
        machine_name: "",
        event_status: ""
    });
    const [filters, setFilters] = useState(filterInitialState);
    const [appliedFilters, setAppliedFilters] = useState(filterInitialState);

    const companiesQuery = useLookupQuery("companies", "/company-master/master", ["company_master", "companies", "master"]);
    const plantsQuery = useLookupQuery("plants", "/plant-shop-master/master", ["plant_master", "plant_shop_master", "plants", "shops", "master"]);
    const linesQuery = useLookupQuery("lines", "/line-master/master", ["line_master", "lines", "master"]);
    const machinesQuery = useLookupQuery("machines", "/machine-master/master", ["machine_master", "machines", "master"]);

    const reasonsQuery = useQuery({ queryKey: ["downtime", "reasons"], queryFn: getLossReasons });
    const configQuery = useQuery({ queryKey: ["downtime", "config"], queryFn: () => getDowntimeConfig({}) });
    const runtimeQuery = useQuery({
        queryKey: ["downtime", "runtime", appliedFilters],
        queryFn: () => getDowntimeRuntime({ ...appliedFilters, from_date: toApiDate(appliedFilters.from_date), to_date: toApiDate(appliedFilters.to_date), category: undefined }),
        enabled: activeView === VIEW_RUNTIME
    });
    const reportQuery = useQuery({
        queryKey: ["downtime", "report", appliedFilters],
        queryFn: () => getDowntimeReport({ ...appliedFilters, from_date: toApiDate(appliedFilters.from_date), to_date: toApiDate(appliedFilters.to_date) }),
        enabled: activeView === VIEW_REPORT
    });

    const companies = companiesQuery.data || [];
    const plants = plantsQuery.data || [];
    const lines = linesQuery.data || [];
    const machines = machinesQuery.data || [];
    const reasons = downtimeService.getLossReasonRows(reasonsQuery.data);
    const configs = downtimeService.getDowntimeConfigRows(configQuery.data);
    const runtimeRows = downtimeService.getDowntimeEventRows(runtimeQuery.data?.data);
    const reportRows = downtimeService.getDowntimeEventRows(reportQuery.data?.data);
    const defaultCompany = companies.length === 1 ? companyId(companies[0]) : "";

    const configPlants = plants.filter(item => !configForm.company_id || !companyId(item) || sameId(companyId(item), configForm.company_id));
    const configLines = lines.filter(item => !configForm.plant_id || !plantId(item) || sameId(plantId(item), configForm.plant_id));
    const configMachines = machines.filter(item => !configForm.line_id || !lineId(item) || sameId(lineId(item), configForm.line_id));
    const configReasons = reasons.filter(item => !configForm.company_id || !item.company_id || sameId(item.company_id, configForm.company_id));

    const filteredConfigs = useMemo(() => {
        const needle = searchText.trim().toLowerCase();
        if (!needle) return configs;
        return configs.filter(row => [row.company_name, row.plant_name, row.line_name, row.machine_code, row.machine_name, row.default_loss_reason_code, row.default_loss_reason_name].some(value => String(value || "").toLowerCase().includes(needle)));
    }, [configs, searchText]);

    const filteredReasons = useMemo(() => {
        const needle = searchText.trim().toLowerCase();
        if (!needle) return reasons;
        return reasons.filter(row => [row.reason_code, row.reason_name, row.category, row.company_name].some(value => String(value || "").toLowerCase().includes(needle)));
    }, [reasons, searchText]);

    const activeConfigs = configs.filter(row => boolValue(row.is_active)).length;
    const openEvents = runtimeRows.filter(row => String(row.event_status).toUpperCase() === "OPEN").length;
    const availabilityLoss = reportRows.filter(row => boolValue(row.affects_availability)).reduce((sum, row) => sum + Number(row.duration_seconds || 0), 0);

    const notifySuccess = text => { setMessage(text); setErrorMessage(""); };
    const notifyError = error => { setErrorMessage(errorText(error)); setMessage(""); };

    const refreshAll = () => queryClient.invalidateQueries({ queryKey: ["downtime"] });

    const configMutation = useMutation({
        mutationFn: form => {
            const payload = {
                company_id: form.company_id, plant_id: form.plant_id, line_id: form.line_id, machine_id: form.machine_id,
                minor_stop_seconds: Number(form.minor_stop_seconds), default_loss_reason_id: form.default_loss_reason_id || null,
                is_active: Boolean(form.is_active), effective_from: form.effective_from ? toApiDate(form.effective_from) : null,
                effective_to: form.effective_to ? toApiDate(form.effective_to) : null
            };

            if (form.downtime_rule_config_id) {
                // Update is versioned immediately by the backend;
                // effective_from is system-controlled for the new version.
                delete payload.effective_from;
                return updateDowntimeConfig(
                    form.downtime_rule_config_id,
                    payload
                );
            }

            return createDowntimeConfig(payload);
        },
        onSuccess: result => { setShowConfigModal(false); notifySuccess(result?.message || "Downtime configuration saved successfully."); refreshAll(); },
        onError: notifyError
    });

    const reasonMutation = useMutation({
        mutationFn: form => {
            const payload = { company_id: form.company_id, reason_code: form.reason_code.trim(), reason_name: form.reason_name.trim(), category: form.category.trim(), is_planned: Boolean(form.is_planned), affects_availability: Boolean(form.affects_availability), status: form.status };
            return form.loss_reason_id ? updateLossReason(form.loss_reason_id, payload) : createLossReason(payload);
        },
        onSuccess: result => { setShowReasonModal(false); notifySuccess(result?.message || "Loss reason saved successfully."); refreshAll(); },
        onError: notifyError
    });

    const executeMutation = useMutation({
        mutationFn: form => executeDowntimeDetection({
            machine_status_event_id: form.machine_status_event_id.trim(), source_system: form.source_system.trim() || "MES_UI",
            ...(form.correlation_id.trim() ? { correlation_id: form.correlation_id.trim() } : {}),
            ...(form.idempotency_key.trim() ? { idempotency_key: form.idempotency_key.trim() } : {})
        }),
        onSuccess: result => { setShowExecuteModal(false); setExecuteForm(executeInitialState); notifySuccess(`${result?.message || "Status event processed."}${result?.data?.action ? ` Action: ${result.data.action}.` : ""}`); refreshAll(); },
        onError: notifyError
    });

    const assignReasonMutation = useMutation({
        mutationFn: form => assignDowntimeLossReason(
            form.downtime_event_id,
            form.loss_reason_id
        ),
        onSuccess: result => {
            setShowAssignReasonModal(false);
            notifySuccess(result?.message || "Loss Reason assigned successfully.");
            refreshAll();
        },
        onError: notifyError
    });

    const openCreateConfig = () => { setConfigForm({ ...configInitialState, company_id: defaultCompany }); setShowConfigModal(true); };
    const openEditConfig = row => { setConfigForm({
        downtime_rule_config_id: row.downtime_rule_config_id, company_id: row.company_id || "", plant_id: row.plant_id || "", line_id: row.line_id || "", machine_id: row.machine_id || "",
        minor_stop_seconds: row.minor_stop_seconds || 300, default_loss_reason_id: row.default_loss_reason_id || "", is_active: boolValue(row.is_active), effective_from: toInputDateTime(row.effective_from), effective_to: toInputDateTime(row.effective_to)
    }); setShowConfigModal(true); };
    const openCreateReason = () => { setReasonForm({ ...reasonInitialState, company_id: defaultCompany }); setShowReasonModal(true); };
    const openEditReason = row => { setReasonForm({
        loss_reason_id: row.loss_reason_id, company_id: row.company_id || "", reason_code: row.reason_code || "", reason_name: row.reason_name || "", category: row.category || "",
        is_planned: boolValue(row.is_planned), affects_availability: boolValue(row.affects_availability), status: row.status || "ACTIVE"
    }); setShowReasonModal(true); };

    const deactivateConfig = async row => {
        if (!window.confirm(`Deactivate downtime rule for ${row.machine_name || row.machine_code || "this machine"}?`)) return;
        try { const result = await softDeleteDowntimeConfig(row.downtime_rule_config_id); notifySuccess(result?.message || "Configuration deactivated."); refreshAll(); } catch (error) { notifyError(error); }
    };
    const deactivateReason = async row => {
        if (!window.confirm(`Deactivate loss reason ${row.reason_code}?`)) return;
        try { const result = await softDeleteLossReason(row.loss_reason_id); notifySuccess(result?.message || "Loss reason deactivated."); refreshAll(); } catch (error) { notifyError(error); }
    };

    const openAssignReason = row => {
        setReasonAssignment({
            downtime_event_id: row.downtime_event_id,
            company_id: row.company_id || "",
            loss_reason_id: row.loss_reason_id || "",
            machine_name: row.machine_name || row.machine_code || "Machine",
            event_status: row.event_status || ""
        });
        setShowAssignReasonModal(true);
    };

    const assignmentReasons = reasons.filter(item =>
        !reasonAssignment.company_id ||
        !item.company_id ||
        sameId(item.company_id, reasonAssignment.company_id)
    );

    const applyFilters = () => setAppliedFilters({ ...filters });
    const clearFilters = () => { setFilters(filterInitialState); setAppliedFilters(filterInitialState); };
    const handleExport = async () => {
        try {
            const result = await exportDowntimeReport({ ...appliedFilters, from_date: toApiDate(appliedFilters.from_date), to_date: toApiDate(appliedFilters.to_date) }, "CSV");
            downloadCsv(result?.data || [], `downtime-report-${new Date().toISOString().slice(0, 10)}.csv`);
            notifySuccess(`${result?.total_records ?? result?.data?.length ?? 0} downtime records exported.`);
        } catch (error) { notifyError(error); }
    };

    const loadingLookups = companiesQuery.isLoading || plantsQuery.isLoading || linesQuery.isLoading || machinesQuery.isLoading;

    return (
        <>

<div className="dt-page">
            <style>{`
                .dt-page{padding:22px;background:#f4f6fb;min-height:100vh}.dt-card{background:#fff;border:1px solid #e5e9f2;border-radius:12px;box-shadow:0 3px 12px rgba(15,23,42,.06)}
                .dt-title{margin:0;font-size:22px;font-weight:700;color:#1f2d3d}.dt-subtitle{margin-top:4px;color:#748094;font-size:13px}.dt-btn-primary{background:#314965!important;border-color:#314965!important;color:#fff!important;font-weight:600}.dt-btn-primary:hover{background:#25364e!important;border-color:#25364e!important}
                .dt-btn-outline{background:#fff!important;color:#314965!important;border:1px solid #314965!important;font-weight:600}.dt-btn-outline:hover{background:#314965!important;color:#fff!important}.dt-tabs{display:flex;gap:8px;flex-wrap:wrap}.dt-tab{border:1px solid #d9dce5;background:#fff;color:#566176;font-weight:600;padding:8px 15px;border-radius:7px}.dt-tab:hover{border-color:#314965;color:#314965}.dt-tab.active{border-color:#314965;background:#f1f4f8;color:#314965}
                .dt-stat{border:1px solid #e5e9f2;border-radius:10px;padding:14px;background:#fff;height:100%}.dt-stat-icon{width:40px;height:40px;border-radius:9px;background:#f1f4f8;color:#314965;display:flex;align-items:center;justify-content:center;font-size:18px}.dt-stat-value{font-size:20px;font-weight:700;color:#263449}.dt-stat-label{color:#758195;font-size:12px}.dt-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.dt-search{position:relative;width:340px;max-width:100%}.dt-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#8792a5}.dt-search input{padding-left:34px}
                .dt-table-wrap{border:1px solid #e4e7ee;border-radius:9px;overflow:auto}.dt-table{margin:0;white-space:nowrap}.dt-table thead th{background:#1c2d45;color:#fff;border-color:#1c2d45;font-size:12px;font-weight:700;padding:12px}.dt-table tbody td{vertical-align:middle;padding:11px 12px;color:#364152;font-size:13px}.dt-empty{text-align:center;color:#8a94a6!important;padding:30px!important}.dt-edit{background:#fff!important;border:1px solid #314965!important;color:#314965!important;font-size:12px;font-weight:600;padding:5px 10px}.dt-delete{background:#fff!important;border:1px solid #dc3545!important;color:#dc3545!important;font-size:12px;font-weight:600;padding:5px 10px}.dt-modal .modal-content{border:none;border-radius:12px;overflow:hidden}.dt-modal .modal-header{background:#1c2d45;color:#fff;border:none}.dt-modal .btn-close{filter:invert(1)}.dt-label{color:#354154;font-size:12px;font-weight:700;margin-bottom:5px}.dt-required{color:#dc3545}.dt-filter{padding:15px;border:1px solid #e5e9f2;border-radius:9px;background:#f9fafc;margin-bottom:15px}.dt-context{border:1px solid #f1cebc;background:#f6f8fa;color:#865038;border-radius:9px;padding:12px 14px;font-size:13px}
                @media(max-width:768px){.dt-page{padding:12px}.dt-search{width:100%}.dt-toolbar{align-items:stretch}}
            `}</style>

            <Card className="dt-card mb-3"><Card.Body><Row className="align-items-center g-3"><Col lg={7}><h4 className="dt-title">Downtime Detection</h4><div className="dt-subtitle">Configure machine stop thresholds, maintain loss reasons, monitor open downtime and review availability loss.</div></Col><Col lg={5}><div className="d-flex justify-content-lg-end gap-2 flex-wrap"><Button className="dt-btn-outline" onClick={refreshAll}><ArrowClockwise className="me-1" />Refresh</Button><Button className="dt-btn-outline" onClick={() => setActiveView(VIEW_RUNTIME)}><BarChartLine className="me-1" />Runtime</Button><Button className="dt-btn-primary" onClick={() => setShowExecuteModal(true)}><PlayFill className="me-1" />Process Status Event</Button></div></Col></Row></Card.Body></Card>

            {message && <Alert variant="success" dismissible onClose={() => setMessage("")}>{message}</Alert>}
            {errorMessage && <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>{errorMessage}</Alert>}

            <Row className="g-3 mb-3">
                <Col md={3}><div className="dt-stat"><div className="d-flex align-items-center gap-3"><div className="dt-stat-icon"><GearFill /></div><div><div className="dt-stat-value">{configs.length}</div><div className="dt-stat-label">Total Configurations</div></div></div></div></Col>
                <Col md={3}><div className="dt-stat"><div className="d-flex align-items-center gap-3"><div className="dt-stat-icon"><CheckCircleFill /></div><div><div className="dt-stat-value">{activeConfigs}</div><div className="dt-stat-label">Active Rules</div></div></div></div></Col>
                <Col md={3}><div className="dt-stat"><div className="d-flex align-items-center gap-3"><div className="dt-stat-icon"><StopCircleFill /></div><div><div className="dt-stat-value">{openEvents}</div><div className="dt-stat-label">Open Downtime Events</div></div></div></div></Col>
                <Col md={3}><div className="dt-stat"><div className="d-flex align-items-center gap-3"><div className="dt-stat-icon"><ClockHistory /></div><div><div className="dt-stat-value">{displayDuration(availabilityLoss)}</div><div className="dt-stat-label">Filtered Availability Loss</div></div></div></div></Col>
            </Row>

            <Card className="dt-card"><Card.Body>
                <div className="dt-tabs mb-3">
                    {[{ key: VIEW_CONFIG, label: "Rule Configuration" }, { key: VIEW_REASONS, label: "Loss Reasons" }, { key: VIEW_RUNTIME, label: "Runtime" }, { key: VIEW_REPORT, label: "Report" }].map(tab => <button type="button" key={tab.key} className={`dt-tab ${activeView === tab.key ? "active" : ""}`} onClick={() => { setActiveView(tab.key); setSearchText(""); }}>{tab.label}</button>)}
                </div>

                {(activeView === VIEW_CONFIG || activeView === VIEW_REASONS) && <div className="dt-toolbar mb-3"><div className="dt-search"><Search /><Form.Control value={searchText} onChange={e => setSearchText(e.target.value)} placeholder={activeView === VIEW_CONFIG ? "Search machine, line or reason..." : "Search code, name or category..."} /></div><Button className="dt-btn-primary" onClick={activeView === VIEW_CONFIG ? openCreateConfig : openCreateReason}><Plus className="me-1" />{activeView === VIEW_CONFIG ? "Add Configuration" : "Add Loss Reason"}</Button></div>}

                {activeView === VIEW_CONFIG && <div className="dt-table-wrap"><Table responsive hover className="dt-table"><thead><tr><th>Company</th><th>Plant</th><th>Line</th><th>Machine</th><th>Minor Stop Limit</th><th>Default Reason</th><th>Version</th><th>Effective From</th><th>Effective To</th><th>Status</th><th>Action</th></tr></thead><tbody>
                    {configQuery.isLoading || loadingLookups ? <tr><td colSpan={11} className="dt-empty"><Spinner size="sm" animation="border" className="me-2" />Loading configurations...</td></tr> : !filteredConfigs.length ? <tr><td colSpan={11} className="dt-empty">No downtime configuration found.</td></tr> : filteredConfigs.map(row => <tr key={row.downtime_rule_config_id}><td>{safeText(row.company_name)}</td><td>{safeText(row.plant_name)}</td><td>{safeText(row.line_name)}</td><td><strong>{safeText(row.machine_name || row.machine_code)}</strong></td><td>{displayDuration(row.minor_stop_seconds)}</td><td>{safeText(row.default_loss_reason_name || row.default_loss_reason_code)}</td><td>{safeText(row.version_no)}</td><td>{displayDateTime(row.effective_from)}</td><td>{displayDateTime(row.effective_to)}</td><td><StatusBadge value={boolValue(row.is_active) ? "ACTIVE" : "INACTIVE"} /></td><td><div className="d-flex gap-2"><Button className="dt-edit" onClick={() => openEditConfig(row)}><PencilSquare className="me-1" />Edit</Button>{boolValue(row.is_active) && <Button className="dt-delete" onClick={() => deactivateConfig(row)}>Deactivate</Button>}</div></td></tr>)}
                </tbody></Table></div>}

                {activeView === VIEW_REASONS && <div className="dt-table-wrap"><Table responsive hover className="dt-table"><thead><tr><th>Company</th><th>Reason Code</th><th>Reason Name</th><th>Category</th><th>Planned</th><th>Affects Availability</th><th>Version</th><th>Status</th><th>Action</th></tr></thead><tbody>
                    {reasonsQuery.isLoading ? <tr><td colSpan={9} className="dt-empty"><Spinner size="sm" animation="border" className="me-2" />Loading loss reasons...</td></tr> : !filteredReasons.length ? <tr><td colSpan={9} className="dt-empty">No active loss reasons found.</td></tr> : filteredReasons.map(row => <tr key={row.loss_reason_id}><td>{safeText(row.company_name)}</td><td><strong>{safeText(row.reason_code)}</strong></td><td>{safeText(row.reason_name)}</td><td>{safeText(row.category)}</td><td>{boolValue(row.is_planned) ? "Yes" : "No"}</td><td>{boolValue(row.affects_availability) ? <Badge bg="danger">YES</Badge> : <Badge bg="secondary">NO</Badge>}</td><td>{safeText(row.version_no)}</td><td><StatusBadge value={row.status} /></td><td><div className="d-flex gap-2"><Button className="dt-edit" onClick={() => openEditReason(row)}><PencilSquare className="me-1" />Edit</Button><Button className="dt-delete" onClick={() => deactivateReason(row)}>Deactivate</Button></div></td></tr>)}
                </tbody></Table></div>}

                {activeView === VIEW_RUNTIME && <><FilterPanel filters={filters} setFilters={setFilters} companies={companies} plants={plants} lines={lines} machines={machines} reasons={reasons} onApply={applyFilters} onClear={clearFilters} /><EventTable rows={runtimeRows} loading={runtimeQuery.isFetching} onAssignReason={openAssignReason} /></>}
                {activeView === VIEW_REPORT && <><div className="d-flex justify-content-end mb-2"><Button className="dt-btn-outline" onClick={handleExport}><Download className="me-1" />Export CSV</Button></div><FilterPanel filters={filters} setFilters={setFilters} companies={companies} plants={plants} lines={lines} machines={machines} reasons={reasons} onApply={applyFilters} onClear={clearFilters} includeCategory /><EventTable rows={reportRows} loading={reportQuery.isFetching} onAssignReason={openAssignReason} /></>}
            </Card.Body></Card>

            <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} size="lg" centered className="dt-modal"><Modal.Header closeButton><Modal.Title>{configForm.downtime_rule_config_id ? "Edit Downtime Configuration" : "Add Downtime Configuration"}</Modal.Title></Modal.Header><Form onSubmit={e => { e.preventDefault(); configMutation.mutate(configForm); }}><Modal.Body>
                {configForm.downtime_rule_config_id && <div className="dt-context mb-3"><ExclamationTriangleFill className="me-2" />Saving creates a new configuration version. Existing open downtime keeps its original version.</div>}
                <Row className="g-3"><Col md={6}><SelectField label="Company" required value={configForm.company_id} onChange={e => setConfigForm(current => ({ ...current, company_id: e.target.value, plant_id: "", line_id: "", machine_id: "", default_loss_reason_id: "" }))}><option value="">Select company</option>{companies.map(item => <option key={companyId(item)} value={companyId(item)}>{companyLabel(item)}</option>)}</SelectField></Col>
                <Col md={6}><SelectField label="Plant" required value={configForm.plant_id} onChange={e => setConfigForm(current => ({ ...current, plant_id: e.target.value, line_id: "", machine_id: "" }))} disabled={!configForm.company_id}><option value="">Select plant</option>{configPlants.map(item => <option key={plantId(item)} value={plantId(item)}>{plantLabel(item)}</option>)}</SelectField></Col>
                <Col md={6}><SelectField label="Line" required value={configForm.line_id} onChange={e => setConfigForm(current => ({ ...current, line_id: e.target.value, machine_id: "" }))} disabled={!configForm.plant_id}><option value="">Select line</option>{configLines.map(item => <option key={lineId(item)} value={lineId(item)}>{lineLabel(item)}</option>)}</SelectField></Col>
                <Col md={6}><SelectField label="Machine" required value={configForm.machine_id} onChange={e => setConfigForm(current => ({ ...current, machine_id: e.target.value }))} disabled={!configForm.line_id}><option value="">Select machine</option>{configMachines.map(item => <option key={machineId(item)} value={machineId(item)}>{machineLabel(item)}</option>)}</SelectField></Col>
                <Col md={6}><Form.Group><Form.Label className="dt-label">Minor Stop Threshold (seconds)<span className="dt-required"> *</span></Form.Label><Form.Control required type="number" min="1" step="1" value={configForm.minor_stop_seconds} onChange={e => setConfigForm(current => ({ ...current, minor_stop_seconds: e.target.value }))} /></Form.Group></Col>
                <Col md={6}><SelectField label="Default Loss Reason" value={configForm.default_loss_reason_id} onChange={e => setConfigForm(current => ({ ...current, default_loss_reason_id: e.target.value }))}><option value="">No default reason</option>{configReasons.map(item => <option key={item.loss_reason_id} value={item.loss_reason_id}>{item.reason_code} - {item.reason_name}</option>)}</SelectField></Col>
                <Col md={6}><Form.Group><Form.Label className="dt-label">Effective From</Form.Label><Form.Control type="datetime-local" value={configForm.effective_from} onChange={e => setConfigForm(current => ({ ...current, effective_from: e.target.value }))} /></Form.Group></Col><Col md={6}><Form.Group><Form.Label className="dt-label">Effective To</Form.Label><Form.Control type="datetime-local" value={configForm.effective_to} onChange={e => setConfigForm(current => ({ ...current, effective_to: e.target.value }))} /></Form.Group></Col>
                <Col xs={12}><Form.Check type="switch" label="Configuration active" checked={configForm.is_active} onChange={e => setConfigForm(current => ({ ...current, is_active: e.target.checked }))} /></Col></Row>
            </Modal.Body><Modal.Footer><Button variant="light" onClick={() => setShowConfigModal(false)}>Cancel</Button><Button type="submit" className="dt-btn-primary" disabled={configMutation.isPending}>{configMutation.isPending && <Spinner size="sm" className="me-2" />}Save Configuration</Button></Modal.Footer></Form></Modal>

            <Modal show={showReasonModal} onHide={() => setShowReasonModal(false)} size="lg" centered className="dt-modal"><Modal.Header closeButton><Modal.Title>{reasonForm.loss_reason_id ? "Edit Loss Reason" : "Add Loss Reason"}</Modal.Title></Modal.Header><Form onSubmit={e => { e.preventDefault(); reasonMutation.mutate(reasonForm); }}><Modal.Body><Row className="g-3">
                <Col md={6}><SelectField label="Company" required value={reasonForm.company_id} onChange={e => setReasonForm(current => ({ ...current, company_id: e.target.value }))}><option value="">Select company</option>{companies.map(item => <option key={companyId(item)} value={companyId(item)}>{companyLabel(item)}</option>)}</SelectField></Col>
                <Col md={6}><Form.Group><Form.Label className="dt-label">Reason Code<span className="dt-required"> *</span></Form.Label><Form.Control required maxLength={50} value={reasonForm.reason_code} onChange={e => setReasonForm(current => ({ ...current, reason_code: e.target.value.toUpperCase() }))} placeholder="BREAKDOWN" /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="dt-label">Reason Name<span className="dt-required"> *</span></Form.Label><Form.Control required maxLength={150} value={reasonForm.reason_name} onChange={e => setReasonForm(current => ({ ...current, reason_name: e.target.value }))} placeholder="Machine Breakdown" /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="dt-label">Category<span className="dt-required"> *</span></Form.Label><Form.Control required maxLength={60} value={reasonForm.category} onChange={e => setReasonForm(current => ({ ...current, category: e.target.value.toUpperCase() }))} placeholder="BREAKDOWN" /></Form.Group></Col>
                <Col md={4}><Form.Check type="switch" label="Planned downtime" checked={reasonForm.is_planned} onChange={e => setReasonForm(current => ({ ...current, is_planned: e.target.checked }))} /></Col><Col md={4}><Form.Check type="switch" label="Affects availability" checked={reasonForm.affects_availability} onChange={e => setReasonForm(current => ({ ...current, affects_availability: e.target.checked }))} /></Col><Col md={4}><SelectField label="Status" value={reasonForm.status} onChange={e => setReasonForm(current => ({ ...current, status: e.target.value }))}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></SelectField></Col>
            </Row></Modal.Body><Modal.Footer><Button variant="light" onClick={() => setShowReasonModal(false)}>Cancel</Button><Button type="submit" className="dt-btn-primary" disabled={reasonMutation.isPending}>{reasonMutation.isPending && <Spinner size="sm" className="me-2" />}Save Loss Reason</Button></Modal.Footer></Form></Modal>

            <Modal show={showExecuteModal} onHide={() => setShowExecuteModal(false)} centered className="dt-modal"><Modal.Header closeButton><Modal.Title>Process Machine Status Event</Modal.Title></Modal.Header><Form onSubmit={e => { e.preventDefault(); executeMutation.mutate(executeForm); }}><Modal.Body><div className="dt-context mb-3">This calls the Downtime Engine with an existing machine_status_event ID. The engine decides OPEN, CLOSE or IGNORE.</div>
                <Form.Group className="mb-3"><Form.Label className="dt-label">Machine Status Event ID<span className="dt-required"> *</span></Form.Label><Form.Control required value={executeForm.machine_status_event_id} onChange={e => setExecuteForm(current => ({ ...current, machine_status_event_id: e.target.value }))} placeholder="UUID from machine_status_event" /></Form.Group>
                <Form.Group className="mb-3"><Form.Label className="dt-label">Source System</Form.Label><Form.Control maxLength={50} value={executeForm.source_system} onChange={e => setExecuteForm(current => ({ ...current, source_system: e.target.value }))} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label className="dt-label">Correlation ID (optional UUID)</Form.Label><Form.Control value={executeForm.correlation_id} onChange={e => setExecuteForm(current => ({ ...current, correlation_id: e.target.value }))} /></Form.Group>
                <Form.Group><Form.Label className="dt-label">Idempotency Key (optional)</Form.Label><Form.Control maxLength={150} value={executeForm.idempotency_key} onChange={e => setExecuteForm(current => ({ ...current, idempotency_key: e.target.value }))} /></Form.Group>
            </Modal.Body><Modal.Footer><Button variant="light" onClick={() => setShowExecuteModal(false)}>Cancel</Button><Button type="submit" className="dt-btn-primary" disabled={executeMutation.isPending}>{executeMutation.isPending && <Spinner size="sm" className="me-2" />}Process Event</Button></Modal.Footer></Form></Modal>

            <Modal show={showAssignReasonModal} onHide={() => setShowAssignReasonModal(false)} centered className="dt-modal"><Modal.Header closeButton><Modal.Title>Assign Downtime Reason</Modal.Title></Modal.Header><Form onSubmit={e => { e.preventDefault(); assignReasonMutation.mutate(reasonAssignment); }}><Modal.Body>
                <div className="dt-context mb-3"><strong>{reasonAssignment.machine_name}</strong> · {reasonAssignment.event_status || "-"} event. The selected reason's Availability setting will be applied. Closed-event summaries will be recalculated automatically.</div>
                <SelectField label="Loss Reason" required value={reasonAssignment.loss_reason_id} onChange={e => setReasonAssignment(current => ({ ...current, loss_reason_id: e.target.value }))}><option value="">Select loss reason</option>{assignmentReasons.map(item => <option key={item.loss_reason_id} value={item.loss_reason_id}>{item.reason_code} - {item.reason_name} ({item.category})</option>)}</SelectField>
            </Modal.Body><Modal.Footer><Button variant="light" onClick={() => setShowAssignReasonModal(false)}>Cancel</Button><Button type="submit" className="dt-btn-primary" disabled={assignReasonMutation.isPending || !reasonAssignment.loss_reason_id}>{assignReasonMutation.isPending && <Spinner size="sm" className="me-2" />}Assign Reason</Button></Modal.Footer></Form></Modal>
        </div>
</>
    );
};

export default DowntimeDetection;
