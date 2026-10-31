
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Badge,
    Button,
    Card,
    Col,
    Form,
    Modal,
    ProgressBar,
    Row
} from "react-bootstrap";

import {
    Activity,
    ArrowClockwise,
    ClockHistory,
    Diagram3,
    ExclamationTriangle,
    Plus,
    Tools
} from "react-bootstrap-icons";

import PageHeader from "../../../../shared/components/PageHeader.jsx";
import SearchToolbar from "../../../../shared/components/SearchToolbar.jsx";
import DataTable from "../../../../shared/components/DataTable.jsx";
import ActionButtons from "../../../../shared/components/ActionButtons.jsx";
import ToastMessage from "../../../../shared/components/ToastMessage.jsx";

import api from "../../../../shared/api/client.js";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import machineService from "../../../master-data/machine-master/api/machine.service.js";
import partService from "../../../master-data/part-master/api/part.service.js";
import toolService from "../../../master-data/tool-master/api/tool.service.js";

import "../../../connectivity/cnc-adapter/pages/CncAdapter.css";
import "./ToolLifeMonitoring.css";

// =========================================================
// CONSTANTS
// =========================================================

const API = "/tool-life";

const TAB_CONFIG = "CONFIG";
const TAB_INSTALL = "INSTALL";
const TAB_MONITOR = "MONITOR";
const TAB_HISTORY = "HISTORY";

const EMPTY_CONFIG = {
    machine_id: "",
    part_id: "",
    tool_id: "",
    tool_number: "",
    life_source: "CNC_COUNTER",
    min_life_count: 0,
    warning_threshold: 80,
    max_life_count: 100,
    is_active: true
};

const EMPTY_INSTALL = {
    machine_id: "",
    part_id: "",
    tool_id: "",
    tool_number: ""
};

const EMPTY_REPLACEMENT = {
    old_serial_number: "",
    new_serial_number: "",
    replacement_reason: ""
};

// =========================================================
// HELPERS
// =========================================================

function getRows(response) {
    const value =
        response?.data?.data ??
        response?.data ??
        response;

    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.rows)) return value.rows;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.records)) return value.records;

    return [];
}

function getError(error) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Request failed."
    );
}

function sameId(a, b) {
    return String(a ?? "") === String(b ?? "");
}

function isActive(value) {
    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    );
}

function formatNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const numeric = Number(value);

    return Number.isFinite(numeric)
        ? numeric.toLocaleString("en-IN")
        : String(value);
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleString("en-IN");
}

function Status({ value }) {
    const variants = {
        NORMAL: "success",
        WARNING: "warning",
        CRITICAL: "danger",
        ACTIVE: "success",
        INACTIVE: "secondary"
    };

    return (
        <Badge bg={variants[value] || "secondary"}>
            {value || "-"}
        </Badge>
    );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

function ToolLifeMonitoring() {

    const [activeTab, setActiveTab] = useState(TAB_CONFIG);

    // MASTER DATA

    const [companies, setCompanies] = useState([]);
    const [machines, setMachines] = useState([]);
    const [parts, setParts] = useState([]);
    const [tools, setTools] = useState([]);

    const [selectedCompany, setSelectedCompany] = useState("");

    // TOOL LIFE DATA

    const [configs, setConfigs] = useState([]);
    const [lifecycles, setLifecycles] = useState([]);
    const [events, setEvents] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // EXISTING MODALS

    const [showConfig, setShowConfig] = useState(false);
    const [showInstall, setShowInstall] = useState(false);
    const [showRebaseline, setShowRebaseline] = useState(false);
    const [showEvents, setShowEvents] = useState(false);

    const [editingConfig, setEditingConfig] = useState(null);
    const [selectedLife, setSelectedLife] = useState(null);

    const [configForm, setConfigForm] = useState(EMPTY_CONFIG);
    const [installForm, setInstallForm] = useState(EMPTY_INSTALL);

    const [rebaselineForm, setRebaselineForm] = useState({
        new_counter_value: "",
        reason: "",
        idempotency_key: "",
        event_ts: ""
    });

    // =====================================================
    // TOOL REPLACEMENT - ALL ACTIVE TOOLS
    // =====================================================

    const [showReplacement, setShowReplacement] = useState(false);

    const [replacementTarget, setReplacementTarget] = useState(null);

    const [replacementForm, setReplacementForm] = useState({
        ...EMPTY_REPLACEMENT
    });

    // TOAST

    const [toast, setToast] = useState({
        show: false,
        message: "",
        variant: "success"
    });

    function notify(message, variant = "success") {
        setToast({
            show: true,
            message,
            variant
        });
    }

    // =========================================================
    // LOAD MASTER DATA
    // =========================================================

    const loadMasters = useCallback(async () => {

        const results = await Promise.allSettled([
            companyService.getMaster(),
            machineService.getMaster(),
            partService.getMaster(),
            toolService.getMaster()
        ]);

        const names = ["Company", "Machine", "Part", "Tool"];

        const setters = [
            setCompanies,
            setMachines,
            setParts,
            setTools
        ];

        results.forEach((result, index) => {

            if (result.status === "fulfilled") {

                setters[index](getRows(result.value));

            } else {

                console.error(
                    `${names[index]} Master failed:`,
                    result.reason
                );

                notify(
                    `${names[index]} Master: ${getError(result.reason)}`,
                    "danger"
                );
            }
        });

        if (results[0].status === "fulfilled") {

            const availableCompanies = getRows(results[0].value);

            let preferredCompany = "";

            try {
                const user = JSON.parse(
                    localStorage.getItem("operatex_user") || "{}"
                );

                preferredCompany = user.company_id || "";

            } catch {
                preferredCompany = "";
            }

            const selected =
                availableCompanies.find(row =>
                    sameId(row.company_id, preferredCompany)
                ) || availableCompanies[0];

            setSelectedCompany(previous =>
                previous || selected?.company_id || ""
            );
        }

    }, []);

    // =========================================================
    // LOAD TOOL LIFE DATA
    // =========================================================

    const loadData = useCallback(async () => {

        if (!selectedCompany) {
            setConfigs([]);
            setLifecycles([]);
            setEvents([]);
            return;
        }

        setLoading(true);

        try {

            const results = await Promise.allSettled([

                api.get(`${API}/config`, {
                    params: {
                        company_id: selectedCompany
                    }
                }),

                api.get(`${API}/runtime/history`, {
                    params: {
                        company_id: selectedCompany,
                        limit: 100
                    }
                }),

                api.get(`${API}/runtime/events`, {
                    params: {
                        company_id: selectedCompany,
                        limit: 100
                    }
                })

            ]);

            const setters = [
                setConfigs,
                setLifecycles,
                setEvents
            ];

            results.forEach((result, index) => {

                if (result.status === "fulfilled") {

                    setters[index](getRows(result.value));

                } else {

                    setters[index]([]);

                    notify(
                        `Tool Life data: ${getError(result.reason)}`,
                        "danger"
                    );
                }
            });

        } catch (error) {

            notify(getError(error), "danger");

        } finally {

            setLoading(false);
        }

    }, [selectedCompany]);

    useEffect(() => {
        loadMasters();
    }, [loadMasters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // =========================================================
    // MASTER LOOKUPS
    // =========================================================

    const machineName = id => {
        const row = machines.find(item =>
            sameId(item.machine_id, id)
        );

        return (
            row?.machine_code ||
            row?.machine_name ||
            "-"
        );
    };

    const partName = id => {
        const row = parts.find(item =>
            sameId(item.part_id, id)
        );

        return (
            row?.part_code ||
            row?.part_name ||
            "-"
        );
    };

    const toolName = id => {
        const row = tools.find(item =>
            sameId(item.tool_id, id)
        );

        return (
            row?.tool_name ||
            row?.tool_code ||
            "-"
        );
    };

    const availableMachines = machines.filter(item =>
        !item.company_id ||
        sameId(item.company_id, selectedCompany)
    );

    const availableParts = parts.filter(item =>
        !item.company_id ||
        sameId(item.company_id, selectedCompany)
    );

    const availableTools = tools.filter(item =>
        !item.company_id ||
        sameId(item.company_id, selectedCompany)
    );

    // =========================================================
    // ACTIVE LIFECYCLES
    // =========================================================

    const activeLifecycles = useMemo(() => {

        return lifecycles.filter(item =>
            isActive(item.is_active)
        );

    }, [lifecycles]);

    // =========================================================
    // KPI CARDS
    // =========================================================

    const kpis = [
        {
            title: "Life Configurations",
            value: configs.length
        },
        {
            title: "Active Configurations",
            value: configs.filter(item =>
                isActive(item.is_active)
            ).length
        },
        {
            title: "Installed Tools",
            value: activeLifecycles.length
        },
        {
            title: "Warning / Critical",
            value: activeLifecycles.filter(item =>
                ["WARNING", "CRITICAL"].includes(
                    item.life_status
                )
            ).length
        }
    ];

    // =========================================================
    // FILTERING
    // =========================================================

    function matchSearch(item) {

        const search = searchText.trim().toLowerCase();

        if (!search) return true;

        return [
            item.tool_number,
            machineName(item.machine_id),
            toolName(item.tool_id),
            partName(item.part_id || item.current_part_id),
            item.life_source,
            item.life_status,
            item.source_system
        ].some(value =>
            String(value ?? "")
                .toLowerCase()
                .includes(search)
        );
    }

    function matchStatus(item) {

        if (statusFilter === "ALL") return true;

        if (statusFilter === "ACTIVE") {
            return isActive(item.is_active);
        }

        if (statusFilter === "INACTIVE") {
            return !isActive(item.is_active);
        }

        return item.life_status === statusFilter;
    }

    const filteredConfigs = configs.filter(item =>
        matchSearch(item) &&
        matchStatus(item)
    );

    const filteredInstalled = activeLifecycles.filter(item =>
        matchSearch(item) &&
        (
            statusFilter === "ALL" ||
            statusFilter === "ACTIVE" ||
            item.life_status === statusFilter
        )
    );

    const filteredHistory = lifecycles.filter(item =>
        matchSearch(item) &&
        matchStatus(item)
    );

    const filteredEvents = events.filter(matchSearch);

    // =========================================================
    // CHANGE SECTION
    // =========================================================

    function changeTab(tab) {
        setActiveTab(tab);
        setSearchText("");
        setStatusFilter("ALL");
    }

    // =========================================================
    // CONFIGURATION MODAL
    // =========================================================

    function openConfig(item = null) {

        setEditingConfig(item);

        setConfigForm(
            item
                ? {
                    machine_id: item.machine_id || "",
                    part_id: item.part_id || "",
                    tool_id: item.tool_id || "",
                    tool_number: item.tool_number || "",
                    life_source:
                        item.life_source || "CNC_COUNTER",
                    min_life_count:
                        item.min_life_count ?? 0,
                    warning_threshold:
                        item.warning_threshold ?? 80,
                    max_life_count:
                        item.max_life_count ?? 100,
                    is_active: isActive(item.is_active)
                }
                : { ...EMPTY_CONFIG }
        );

        setShowConfig(true);
    }

    async function saveConfig(event) {

        event.preventDefault();

        const minimum = Number(configForm.min_life_count);
        const warning = Number(configForm.warning_threshold);
        const maximum = Number(configForm.max_life_count);

        if (
            minimum < 0 ||
            maximum <= 0 ||
            warning < minimum ||
            warning > maximum
        ) {
            notify(
                "Invalid thresholds. Required: 0 ≤ minimum ≤ warning ≤ maximum.",
                "danger"
            );
            return;
        }

        const payload = {
            ...configForm,
            company_id: selectedCompany,
            machine_id: configForm.machine_id || null,
            part_id: configForm.part_id || null,
            tool_number:
                configForm.tool_number.trim().toUpperCase() || null,
            min_life_count: minimum,
            warning_threshold: warning,
            max_life_count: maximum
        };

        setSaving(true);

        try {

            if (editingConfig) {

                await api.put(
                    `${API}/config/${editingConfig.tool_life_id}`,
                    {
                        ...payload,
                        version_no: editingConfig.version_no
                    }
                );

            } else {

                await api.post(`${API}/config`, payload);
            }

            setShowConfig(false);

            notify(
                editingConfig
                    ? "Tool Life configuration updated successfully."
                    : "Tool Life configuration created successfully."
            );

            await loadData();

        } catch (error) {

            notify(getError(error), "danger");

        } finally {

            setSaving(false);
        }
    }

    // =========================================================
    // TOOL INSTALLATION
    // =========================================================

    function openInstall() {
        setInstallForm({ ...EMPTY_INSTALL });
        setShowInstall(true);
    }

    async function saveInstall(event) {

        event.preventDefault();

        setSaving(true);

        try {

            await api.post(`${API}/runtime/install`, {
                ...installForm,
                company_id: selectedCompany,
                tool_number:
                    installForm.tool_number.trim().toUpperCase()
            });

            setShowInstall(false);

            notify("Tool installed successfully.");

            await loadData();

        } catch (error) {

            notify(getError(error), "danger");

        } finally {

            setSaving(false);
        }
    }

    // =========================================================
    // CNC COUNTER REBASELINE
    // =========================================================

    function openRebaseline(item) {

        setSelectedLife(item);

        setRebaselineForm({
            new_counter_value: "",
            reason: "",
            event_ts: new Date().toISOString(),
            idempotency_key: crypto.randomUUID()
        });

        setShowRebaseline(true);
    }

    async function saveRebaseline(event) {

        event.preventDefault();

        if (!selectedLife) return;

        if (
            !window.confirm(
                "Confirm CNC counter rebaseline? Existing consumed tool life will be preserved."
            )
        ) {
            return;
        }

        setSaving(true);

        try {

            await api.post(`${API}/runtime/rebaseline`, {
                company_id: selectedCompany,
                machine_id: selectedLife.machine_id,
                tool_id: selectedLife.tool_id,
                tool_number: selectedLife.tool_number,
                new_counter_value:
                    Number(rebaselineForm.new_counter_value),
                reason: rebaselineForm.reason.trim(),
                event_ts: rebaselineForm.event_ts,
                idempotency_key:
                    rebaselineForm.idempotency_key
            });

            setShowRebaseline(false);

            notify("CNC counter rebaseline completed.");

            await loadData();

        } catch (error) {

            notify(getError(error), "danger");

        } finally {

            setSaving(false);
        }
    }

    // =========================================================
    // TOOL REPLACEMENT
    // =========================================================

    /*
       IMPORTANT:

       Replacement is allowed for every ACTIVE tool.

       NORMAL:
           Tool broken, worn out, quality issue,
           or planned maintenance.

       WARNING:
           Tool approaching configured life limit.

       CRITICAL:
           Tool reached or exceeded life limit.

       Actual replacement transaction will be
       handled by the Tool Replacement backend.
    */

    function openReplacement(item) {

        if (!isActive(item?.is_active)) {
            notify(
                "Only active installed tools can be replaced.",
                "warning"
            );
            return;
        }

        setReplacementTarget(item);

        setReplacementForm({
            ...EMPTY_REPLACEMENT
        });

        setShowReplacement(true);
    }

    function closeReplacement() {

        setShowReplacement(false);

        setReplacementTarget(null);

        setReplacementForm({
            ...EMPTY_REPLACEMENT
        });
    }

    function updateReplacement(field, value) {

        setReplacementForm(previous => ({
            ...previous,
            [field]: value
        }));
    }

    // =========================================================
    // TABLE COLUMNS
    // =========================================================

    const configColumns = [
        {
            key: "machine_id",
            label: "Machine",
            render: row => machineName(row.machine_id)
        },
        {
            key: "tool_number",
            label: "Tool No.",
            render: row => row.tool_number || "-"
        },
        {
            key: "tool_id",
            label: "Tool",
            render: row => toolName(row.tool_id)
        },
        {
            key: "part_id",
            label: "Part",
            render: row => partName(row.part_id)
        },
        {
            key: "life_source",
            label: "Life Source"
        },
        {
            key: "warning_threshold",
            label: "Warning",
            render: row => formatNumber(row.warning_threshold)
        },
        {
            key: "max_life_count",
            label: "Maximum",
            render: row => formatNumber(row.max_life_count)
        },
        {
            key: "is_active",
            label: "Status",
            render: row => (
                <Status
                    value={
                        isActive(row.is_active)
                            ? "ACTIVE"
                            : "INACTIVE"
                    }
                />
            )
        }
    ];

    const monitorColumns = [
        {
            key: "machine_id",
            label: "Machine",
            render: row => machineName(row.machine_id)
        },
        {
            key: "tool_number",
            label: "Tool No."
        },
        {
            key: "tool_id",
            label: "Tool",
            render: row => toolName(row.tool_id)
        },
        {
            key: "current_part_id",
            label: "Current Part",
            render: row => partName(row.current_part_id)
        },
        {
            key: "total_used",
            label: "Used Life",
            render: row => formatNumber(row.total_used)
        },
        {
            key: "remaining_life",
            label: "Remaining",
            render: row => formatNumber(row.remaining_life)
        },
        {
            key: "consumption",
            label: "Consumption",
            render: row => {

                const max = Number(row.max_life_count) || 1;

                const percent = Math.min(
                    100,
                    Number(row.total_used || 0) / max * 100
                );

                const color =
                    row.life_status === "CRITICAL"
                        ? "danger"
                        : row.life_status === "WARNING"
                            ? "warning"
                            : "success";

                return (
                    <div className="tl-consumption">

                        <ProgressBar
                            now={percent}
                            variant={color}
                            style={{ height: 7 }}
                        />

                        <small>
                            {percent.toFixed(1)}%
                        </small>

                    </div>
                );
            }
        },
        {
            key: "life_status",
            label: "Life Status",
            render: row => (
                <Status value={row.life_status} />
            )
        }
    ];

    const historyColumns = [
        ...monitorColumns.filter(
            column => column.key !== "consumption"
        ),
        {
            key: "is_active",
            label: "Lifecycle",
            render: row => (
                <Status
                    value={
                        isActive(row.is_active)
                            ? "ACTIVE"
                            : "INACTIVE"
                    }
                />
            )
        },
        {
            key: "started_at",
            label: "Installed At",
            render: row => formatDate(row.started_at)
        },
        {
            key: "ended_at",
            label: "Ended At",
            render: row => formatDate(row.ended_at)
        }
    ];

    const eventColumns = [
        {
            key: "event_ts",
            label: "Event Time",
            render: row => formatDate(row.event_ts)
        },
        {
            key: "machine_id",
            label: "Machine",
            render: row => machineName(row.machine_id)
        },
        {
            key: "tool_number",
            label: "Tool No."
        },
        {
            key: "usage_count",
            label: "Usage",
            render: row => formatNumber(row.usage_count)
        },
        {
            key: "cumulative_count",
            label: "CNC Counter",
            render: row => row.cumulative_count ?? "-"
        },
        {
            key: "source_system",
            label: "Source"
        },
        {
            key: "event_type",
            label: "Event",
            render: row =>
                row.payload?.event_type ||
                row.event_type ||
                "USAGE"
        }
    ];

    // =========================================================
    // NAVIGATION
    // =========================================================

    const sections = [
        {
            key: TAB_CONFIG,
            title: "Life Configuration",
            icon: <Activity />
        },
        {
            key: TAB_INSTALL,
            title: "Tool Installation",
            icon: <Tools />
        },
        {
            key: TAB_MONITOR,
            title: "Life Monitoring",
            icon: <Diagram3 />
        },
        {
            key: TAB_HISTORY,
            title: "Usage History",
            icon: <ClockHistory />
        }
    ];

    const sectionDetails = {
        [TAB_CONFIG]: {
            title: "Tool Life Configuration",
            subtitle:
                "Configure usage source, warning threshold and maximum tool life."
        },
        [TAB_INSTALL]: {
            title: "Tool Installation",
            subtitle:
                "View currently installed tools and initialize new tool lifecycles."
        },
        [TAB_MONITOR]: {
            title: "Active Tool Life Monitoring",
            subtitle:
                "Monitor consumed life, remaining life and machine-wise tool condition."
        },
        [TAB_HISTORY]: {
            title: "Tool Lifecycle History",
            subtitle:
                "Review tool lifecycle records and usage events."
        }
    };

    const currentSection = sectionDetails[activeTab];

    // =========================================================
    // FORM SELECT HELPER
    // =========================================================

    function masterSelect(
        label,
        key,
        value,
        setter,
        list,
        idField,
        displayField
    ) {

        return (
            <Form.Group className="mb-3">

                <Form.Label>{label}</Form.Label>

                <Form.Select
                    required
                    value={value}
                    onChange={event =>
                        setter(previous => ({
                            ...previous,
                            [key]: event.target.value
                        }))
                    }
                >

                    <option value="">
                        Select {label}
                    </option>

                    {list.map(item => (
                        <option
                            key={item[idField]}
                            value={item[idField]}
                        >
                            {item[displayField] || item[idField]}
                        </option>
                    ))}

                </Form.Select>

            </Form.Group>
        );
    }

    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="cnc-adapter-page tool-life-page">

            {/* PAGE HEADER */}

            <PageHeader
                title="Tool Life Monitoring"
                subtitle="Tool life configuration, installation, machine-wise monitoring, usage history and reporting."
            />

            {/* KPI CARDS */}

            <Row className="g-3 mb-3">

                {kpis.map(item => (

                    <Col
                        xl={3}
                        md={6}
                        key={item.title}
                    >

                        <Card className="border-0 shadow-sm h-100">

                            <Card.Body>

                                <div className="text-muted small">
                                    {item.title}
                                </div>

                                <div className="fs-4 fw-semibold">
                                    {item.value}
                                </div>

                            </Card.Body>

                        </Card>

                    </Col>

                ))}

            </Row>

            {/* SECTION BUTTONS */}

            <Card className="border-0 shadow-sm mb-3">

                <Card.Body>

                    <div className="d-flex flex-wrap gap-2">

                        {sections.map(section => (

                            <Button
                                key={section.key}
                                variant={
                                    activeTab === section.key
                                        ? "primary"
                                        : "outline-primary"
                                }
                                onClick={() =>
                                    changeTab(section.key)
                                }
                            >

                                {section.icon}

                                <span className="ms-2">
                                    {section.title}
                                </span>

                            </Button>

                        ))}

                    </div>

                </Card.Body>

            </Card>

            {/* SEARCH TOOLBAR */}

            <SearchToolbar
                searchText={searchText}
                onSearch={setSearchText}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                onRefresh={loadData}
                onRuntime={() => changeTab(TAB_MONITOR)}
                onReport={() => changeTab(TAB_HISTORY)}
                showExecute={false}
                showExport={false}
                showRuntime={true}
                showReport={true}
                showStatus={activeTab !== TAB_HISTORY}
            />

            {/* SECTION HEADER */}

            <Card className="border-0 shadow-sm mb-3">

                <Card.Body>

                    <div className="tl-section-header">

                        <div>

                            <div className="fw-semibold fs-5">
                                {currentSection.title}
                            </div>

                            <div className="text-muted">
                                {currentSection.subtitle}
                            </div>

                        </div>

                        <div className="tl-header-actions">

                            {companies.length > 1 && (

                                <Form.Select
                                    className="tl-company-select"
                                    value={selectedCompany}
                                    onChange={event =>
                                        setSelectedCompany(
                                            event.target.value
                                        )
                                    }
                                    aria-label="Company"
                                >

                                    {companies.map(company => (

                                        <option
                                            key={company.company_id}
                                            value={company.company_id}
                                        >
                                            {company.company_name ||
                                                company.company_code}
                                        </option>

                                    ))}

                                </Form.Select>

                            )}

                            <Button
                                variant="outline-primary"
                                disabled={!selectedCompany}
                                onClick={() => {
                                    changeTab(TAB_CONFIG);
                                    openConfig();
                                }}
                            >

                                <Plus className="me-1" />
                                Add Configuration

                            </Button>

                            <Button
                                variant="primary"
                                disabled={!selectedCompany}
                                onClick={() => {
                                    changeTab(TAB_INSTALL);
                                    openInstall();
                                }}
                            >

                                <Plus className="me-1" />
                                Install Tool

                            </Button>

                            {activeTab === TAB_HISTORY && (

                                <Button
                                    variant="outline-primary"
                                    onClick={() => setShowEvents(true)}
                                >
                                    <ClockHistory className="me-1" />
                                    Usage Events
                                </Button>

                            )}

                            {activeTab === TAB_MONITOR && (

                                <Button
                                    variant="outline-primary"
                                    onClick={loadData}
                                    disabled={loading}
                                >
                                    <ArrowClockwise className="me-1" />
                                    Refresh Status
                                </Button>

                            )}

                        </div>

                    </div>

                </Card.Body>

            </Card>

            {/* =============================================
                CONFIGURATION TABLE
            ============================================= */}

            {activeTab === TAB_CONFIG && (

                <DataTable
                    columns={configColumns}
                    data={filteredConfigs}
                    loading={loading}
                    emptyMessage="No Tool Life Configurations Found"
                    renderActions={row => (

                        <ActionButtons
                            showDelete={false}
                            onEdit={() => openConfig(row)}
                        />

                    )}
                />

            )}

            {/* =============================================
                INSTALLATION TABLE
            ============================================= */}

            {activeTab === TAB_INSTALL && (

                <DataTable
                    columns={historyColumns}
                    data={filteredInstalled}
                    loading={loading}
                    emptyMessage="No Installed Tools Found"
                />

            )}

            {/* =============================================
                LIFE MONITORING TABLE

                REPLACEMENT FOR ALL ACTIVE TOOLS
            ============================================= */}

            {activeTab === TAB_MONITOR && (

                <DataTable
                    columns={monitorColumns}
                    data={filteredInstalled}
                    loading={loading}
                    emptyMessage="No Active Tool Life Records Found"

                    renderActions={row => {

                        const status = String(
                            row.life_status || ""
                        ).toUpperCase();

                        // IMPORTANT:
                        // Every active installed tool can be replaced.

                        const canReplace =
                            isActive(row.is_active);

                        const canRebaseline =
                            row.last_counter_value !== null &&
                            row.last_counter_value !== undefined;

                        return (

                            <div className="d-flex align-items-center gap-2 flex-nowrap">

                                {/* REPLACE TOOL */}

                                {canReplace && (

                                    <Button
                                        size="sm"
                                        variant={
                                            status === "CRITICAL"
                                                ? "outline-danger"
                                                : status === "WARNING"
                                                    ? "outline-warning"
                                                    : "outline-primary"
                                        }
                                        className="text-nowrap"
                                        style={{
                                            width: "auto",
                                            minWidth: 116,
                                            padding: "0 10px"
                                        }}
                                        title="Replace this installed tool"
                                        onClick={() =>
                                            openReplacement(row)
                                        }
                                    >

                                        <Tools className="me-1" />
                                        Replace Tool

                                    </Button>

                                )}

                                {/* CNC COUNTER REBASELINE */}

                                {canRebaseline && (

                                    <Button
                                        size="sm"
                                        variant="outline-primary"
                                        title="CNC Counter Rebaseline"
                                        onClick={() =>
                                            openRebaseline(row)
                                        }
                                    >

                                        <ArrowClockwise />

                                    </Button>

                                )}

                                {!canReplace && !canRebaseline && (

                                    <span className="text-muted">
                                        —
                                    </span>

                                )}

                            </div>

                        );
                    }}
                />

            )}

            {/* =============================================
                HISTORY TABLE
            ============================================= */}

            {activeTab === TAB_HISTORY && (

                <DataTable
                    columns={historyColumns}
                    data={filteredHistory}
                    loading={loading}
                    emptyMessage="No Tool Lifecycle History Found"
                />

            )}

            {/* =============================================
                CONFIGURATION MODAL
            ============================================= */}

            <Modal
                show={showConfig}
                onHide={() => setShowConfig(false)}
                size="lg"
                centered
            >

                <Form onSubmit={saveConfig}>

                    <Modal.Header closeButton>

                        <Modal.Title>
                            {editingConfig
                                ? "Update Tool Life Configuration"
                                : "Add Tool Life Configuration"}
                        </Modal.Title>

                    </Modal.Header>

                    <Modal.Body>

                        <Row>

                            <Col md={6}>

                                {masterSelect(
                                    "Machine",
                                    "machine_id",
                                    configForm.machine_id,
                                    setConfigForm,
                                    availableMachines,
                                    "machine_id",
                                    "machine_code"
                                )}

                            </Col>

                            <Col md={6}>

                                {masterSelect(
                                    "Part",
                                    "part_id",
                                    configForm.part_id,
                                    setConfigForm,
                                    availableParts,
                                    "part_id",
                                    "part_code"
                                )}

                            </Col>

                            <Col md={6}>

                                {masterSelect(
                                    "Tool",
                                    "tool_id",
                                    configForm.tool_id,
                                    setConfigForm,
                                    availableTools,
                                    "tool_id",
                                    "tool_name"
                                )}

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Tool Number
                                    </Form.Label>

                                    <Form.Control
                                        value={configForm.tool_number}
                                        placeholder="Example: T05"
                                        required
                                        onChange={event =>
                                            setConfigForm(previous => ({
                                                ...previous,
                                                tool_number:
                                                    event.target.value
                                            }))
                                        }
                                    />

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Life Source
                                    </Form.Label>

                                    <Form.Select
                                        value={configForm.life_source}
                                        onChange={event =>
                                            setConfigForm(previous => ({
                                                ...previous,
                                                life_source:
                                                    event.target.value
                                            }))
                                        }
                                    >

                                        <option value="CNC_COUNTER">
                                            CNC Counter
                                        </option>

                                        <option value="PRODUCTION_CYCLE">
                                            Production Cycle
                                        </option>

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Minimum Life
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="0"
                                        required
                                        value={configForm.min_life_count}
                                        onChange={event =>
                                            setConfigForm(previous => ({
                                                ...previous,
                                                min_life_count:
                                                    event.target.value
                                            }))
                                        }
                                    />

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Warning Threshold
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="0"
                                        required
                                        value={configForm.warning_threshold}
                                        onChange={event =>
                                            setConfigForm(previous => ({
                                                ...previous,
                                                warning_threshold:
                                                    event.target.value
                                            }))
                                        }
                                    />

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Maximum Life
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        required
                                        value={configForm.max_life_count}
                                        onChange={event =>
                                            setConfigForm(previous => ({
                                                ...previous,
                                                max_life_count:
                                                    event.target.value
                                            }))
                                        }
                                    />

                                </Form.Group>

                            </Col>

                            <Col md={12}>

                                <Form.Check
                                    type="switch"
                                    label="Active Configuration"
                                    checked={configForm.is_active}
                                    onChange={event =>
                                        setConfigForm(previous => ({
                                            ...previous,
                                            is_active:
                                                event.target.checked
                                        }))
                                    }
                                />

                            </Col>

                        </Row>

                    </Modal.Body>

                    <Modal.Footer>

                        <Button
                            variant="secondary"
                            onClick={() => setShowConfig(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="primary"
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Configuration"}
                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>

            {/* =============================================
                INSTALL TOOL MODAL
            ============================================= */}

            <Modal
                show={showInstall}
                onHide={() => setShowInstall(false)}
                centered
            >

                <Form onSubmit={saveInstall}>

                    <Modal.Header closeButton>

                        <Modal.Title>
                            Install Tool
                        </Modal.Title>

                    </Modal.Header>

                    <Modal.Body>

                        {masterSelect(
                            "Machine",
                            "machine_id",
                            installForm.machine_id,
                            setInstallForm,
                            availableMachines,
                            "machine_id",
                            "machine_code"
                        )}

                        {masterSelect(
                            "Part",
                            "part_id",
                            installForm.part_id,
                            setInstallForm,
                            availableParts,
                            "part_id",
                            "part_code"
                        )}

                        {masterSelect(
                            "Tool",
                            "tool_id",
                            installForm.tool_id,
                            setInstallForm,
                            availableTools,
                            "tool_id",
                            "tool_name"
                        )}

                        <Form.Group>

                            <Form.Label>
                                Tool Number
                            </Form.Label>

                            <Form.Control
                                required
                                placeholder="Example: T05"
                                value={installForm.tool_number}
                                onChange={event =>
                                    setInstallForm(previous => ({
                                        ...previous,
                                        tool_number:
                                            event.target.value
                                    }))
                                }
                            />

                        </Form.Group>

                    </Modal.Body>

                    <Modal.Footer>

                        <Button
                            variant="secondary"
                            onClick={() => setShowInstall(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={saving}
                        >
                            {saving
                                ? "Installing..."
                                : "Install Tool"}
                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>

            {/* =============================================
                CNC COUNTER REBASELINE MODAL
            ============================================= */}

            <Modal
                show={showRebaseline}
                onHide={() => setShowRebaseline(false)}
                centered
            >

                <Form onSubmit={saveRebaseline}>

                    <Modal.Header closeButton>

                        <Modal.Title>
                            CNC Counter Rebaseline
                        </Modal.Title>

                    </Modal.Header>

                    <Modal.Body>

                        <div className="tl-warning mb-3">

                            <ExclamationTriangle className="me-2" />

                            Consumed tool life will be preserved.

                        </div>

                        <div className="mb-3">

                            <strong>Machine:</strong>{" "}
                            {machineName(selectedLife?.machine_id)}

                            <br />

                            <strong>Tool:</strong>{" "}
                            {selectedLife?.tool_number || "-"}

                            <br />

                            <strong>Last Counter:</strong>{" "}
                            {selectedLife?.last_counter_value ?? "-"}

                            <br />

                            <strong>Used Life:</strong>{" "}
                            {formatNumber(selectedLife?.total_used)}

                        </div>

                        <Form.Group className="mb-3">

                            <Form.Label>
                                New CNC Counter Value
                            </Form.Label>

                            <Form.Control
                                type="number"
                                min="0"
                                required
                                value={rebaselineForm.new_counter_value}
                                onChange={event =>
                                    setRebaselineForm(previous => ({
                                        ...previous,
                                        new_counter_value:
                                            event.target.value
                                    }))
                                }
                            />

                        </Form.Group>

                        <Form.Group>

                            <Form.Label>
                                Reason
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                required
                                value={rebaselineForm.reason}
                                onChange={event =>
                                    setRebaselineForm(previous => ({
                                        ...previous,
                                        reason:
                                            event.target.value
                                    }))
                                }
                            />

                        </Form.Group>

                    </Modal.Body>

                    <Modal.Footer>

                        <Button
                            variant="secondary"
                            onClick={() =>
                                setShowRebaseline(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={saving}
                        >
                            {saving
                                ? "Processing..."
                                : "Confirm Rebaseline"}
                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>

            {/* =============================================
                USAGE EVENTS MODAL
            ============================================= */}

            <Modal
                show={showEvents}
                onHide={() => setShowEvents(false)}
                size="xl"
                centered
                scrollable
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Tool Usage Events
                    </Modal.Title>

                </Modal.Header>

                <Modal.Body>

                    <DataTable
                        columns={eventColumns}
                        data={filteredEvents}
                        loading={loading}
                        emptyMessage="No Usage Events Found"
                    />

                </Modal.Body>

                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => setShowEvents(false)}
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>

            {/* =============================================
                TOOL REPLACEMENT MODAL

                WORKS FOR:
                NORMAL
                WARNING
                CRITICAL
            ============================================= */}

            <Modal
                show={showReplacement}
                onHide={closeReplacement}
                size="lg"
                centered
                backdrop="static"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        <Tools className="me-2" />

                        Tool Replacement

                    </Modal.Title>

                </Modal.Header>

                <Modal.Body>

                    {/* STATUS INFORMATION */}

                    <div
                        className={
                            ["WARNING", "CRITICAL"].includes(
                                String(
                                    replacementTarget?.life_status || ""
                                ).toUpperCase()
                            )
                                ? "tl-warning mb-3 d-flex align-items-center gap-2"
                                : "alert alert-light border mb-3 d-flex align-items-center gap-2"
                        }
                    >

                        <ExclamationTriangle className="flex-shrink-0" />

                        <span className="flex-grow-1">

                            {["WARNING", "CRITICAL"].includes(
                                String(
                                    replacementTarget?.life_status || ""
                                ).toUpperCase()
                            )
                                ? "Tool life alert. Enter the reason for this replacement."
                                : "Manual replacement of an active tool, for example due to breakage, wear or a quality issue."}

                        </span>

                        <Status
                            value={replacementTarget?.life_status}
                        />

                    </div>

                    {/* CURRENT TOOL */}

                    <h6 className="mb-3">
                        Current Installed Tool
                    </h6>

                    <Row className="g-3 mb-4">

                        <Col md={6}>

                            <Form.Label>
                                Machine
                            </Form.Label>

                            <Form.Control
                                value={machineName(
                                    replacementTarget?.machine_id
                                )}
                                readOnly
                            />

                        </Col>

                        <Col md={6}>

                            <Form.Label>
                                Tool Number
                            </Form.Label>

                            <Form.Control
                                value={
                                    replacementTarget?.tool_number || ""
                                }
                                readOnly
                            />

                        </Col>

                        <Col md={6}>

                            <Form.Label>
                                Tool Name
                            </Form.Label>

                            <Form.Control
                                value={toolName(
                                    replacementTarget?.tool_id
                                )}
                                readOnly
                            />

                        </Col>

                        <Col md={6}>

                            <Form.Label>
                                Current Part
                            </Form.Label>

                            <Form.Control
                                value={partName(
                                    replacementTarget?.current_part_id
                                )}
                                readOnly
                            />

                        </Col>

                        <Col md={4}>

                            <Form.Label>
                                Used Life
                            </Form.Label>

                            <Form.Control
                                value={formatNumber(
                                    replacementTarget?.total_used
                                )}
                                readOnly
                            />

                        </Col>

                        <Col md={4}>

                            <Form.Label>
                                Maximum Life
                            </Form.Label>

                            <Form.Control
                                value={formatNumber(
                                    replacementTarget?.max_life_count
                                )}
                                readOnly
                            />

                        </Col>

                        <Col md={4}>

                            <Form.Label>
                                Remaining Life
                            </Form.Label>

                            <Form.Control
                                value={formatNumber(
                                    replacementTarget?.remaining_life
                                )}
                                readOnly
                            />

                        </Col>

                    </Row>

                    <hr />

                    {/* REPLACEMENT DETAILS */}

                    <h6 className="mb-3">
                        Replacement Details
                    </h6>

                    <Row className="g-3">

                        <Col md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Old Tool Serial Number
                                </Form.Label>

                                <Form.Control
                                    placeholder="Enter old tool serial"
                                    value={
                                        replacementForm.old_serial_number
                                    }
                                    onChange={event =>
                                        updateReplacement(
                                            "old_serial_number",
                                            event.target.value
                                        )
                                    }
                                />

                            </Form.Group>

                        </Col>

                        <Col md={6}>

                            <Form.Group>

                                <Form.Label>
                                    New Tool Serial Number
                                    <span className="text-danger"> *</span>
                                </Form.Label>

                                <Form.Control
                                    placeholder="Enter new tool serial"
                                    value={
                                        replacementForm.new_serial_number
                                    }
                                    onChange={event =>
                                        updateReplacement(
                                            "new_serial_number",
                                            event.target.value
                                        )
                                    }
                                />

                            </Form.Group>

                        </Col>

                        <Col md={12}>

                            <Form.Group>

                                <Form.Label>
                                    Replacement Reason
                                    <span className="text-danger"> *</span>
                                </Form.Label>

                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Example: Tool broke during machining"
                                    value={
                                        replacementForm.replacement_reason
                                    }
                                    onChange={event =>
                                        updateReplacement(
                                            "replacement_reason",
                                            event.target.value
                                        )
                                    }
                                />

                            </Form.Group>

                        </Col>

                    </Row>

                    {/* BACKEND INTEGRATION NOTICE */}

                    <div className="alert alert-secondary mt-4 mb-0 small">

                        Tool Replacement is currently a form preview.

                        The replacement transaction API must be
                        implemented and tested before confirming a replacement.

                        No tool lifecycle or usage record will be
                        changed by this form.

                    </div>

                </Modal.Body>

                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={closeReplacement}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="primary"
                        disabled
                        title="Replacement transaction API is not connected"
                    >
                        Confirm Replacement
                    </Button>

                </Modal.Footer>

            </Modal>

            {/* =============================================
                TOAST
            ============================================= */}

            <ToastMessage
                show={toast.show}
                message={toast.message}
                variant={toast.variant}
                onClose={() =>
                    setToast(previous => ({
                        ...previous,
                        show: false
                    }))
                }
            />

        </div>
    );
}

export default ToolLifeMonitoring;
