
import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    Row,
    Spinner,
    Table
} from "react-bootstrap";

import {
    ArrowClockwise,
    CheckCircle,
    ExclamationTriangle,
    Tools
} from "react-bootstrap-icons";

import PageHeader from "../../../../shared/components/PageHeader.jsx";

import api from "../../../../shared/api/client.js";

import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import machineService from "../../../master-data/machine-master/api/machine.service.js";
import toolService from "../../../master-data/tool-master/api/tool.service.js";
import partService from "../../../master-data/part-master/api/part.service.js";

import toolReplacementService from "../api/toolReplacement.service.js";

import ToolReplacementRequestModal from "./components/ToolReplacementRequestModal.jsx";

import ToolReplacementRequests from "./components/ToolReplacementRequests.jsx";


import "../../../connectivity/cnc-adapter/pages/CncAdapter.css";
import "./ToolReplacement.css";

// ==========================================================
// OPERATEX MES - TOOL REPLACEMENT MODULE
//
// Independent submodule under Tooling.
//
// FEATURES:
//
// 1. Company master integration
// 2. Machine master integration
// 3. Tool master integration
// 4. Part master integration
// 5. Active installed tool monitoring
// 6. Tool Life status
// 7. Replacement rule validation
// 8. Eligible approver validation
// 9. Request Replacement modal
// 10. Replacement request submission
// 11. Request confirmation
//
// IMPORTANT:
//
// Request submission creates only a REQUESTED event.
//
// Tool Life is not modified until authorized execution.
//
// No company, machine, tool, or user IDs are hardcoded.
// ==========================================================

const TOOL_LIFE_API = "/tool-life";

// ==========================================================
// COMMON HELPERS
// ==========================================================

function getData(response) {

    return (
        response?.data?.data ??
        response?.data ??
        null
    );
}

function getRows(response) {

    const value = getData(response);

    if (Array.isArray(value)) {
        return value;
    }

    if (Array.isArray(value?.rows)) {
        return value.rows;
    }

    if (Array.isArray(value?.items)) {
        return value.items;
    }

    if (Array.isArray(value?.records)) {
        return value.records;
    }

    return [];
}

function getError(error) {

    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to complete the request."
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

    const number = Number(value);

    return Number.isFinite(number)
        ? number.toLocaleString("en-IN", {
            maximumFractionDigits: 3
        })
        : String(value);
}

function statusVariant(status) {

    switch (
        String(status || "").toUpperCase()
    ) {

        case "NORMAL":
            return "success";

        case "WARNING":
            return "warning";

        case "CRITICAL":
            return "danger";

        default:
            return "secondary";
    }
}

// ==========================================================
// MAIN COMPONENT
// ==========================================================

export default function ToolReplacement() {

    // ======================================================
    // MASTER DATA
    // ======================================================

    const [companies, setCompanies] = useState([]);
    const [machines, setMachines] = useState([]);
    const [tools, setTools] = useState([]);
    const [parts, setParts] = useState([]);

    const [
        selectedCompany,
        setSelectedCompany
    ] = useState("");

    // ======================================================
    // TOOL LIFE DATA
    // ======================================================

    const [
        lifecycles,
        setLifecycles
    ] = useState([]);

    const [
        loadingMasters,
        setLoadingMasters
    ] = useState(true);

    const [
        loadingTools,
        setLoadingTools
    ] = useState(false);

    const [
        refreshKey,
        setRefreshKey
    ] = useState(0);

    // ======================================================
    // SEARCH AND FILTER
    // ======================================================

    const [search, setSearch] = useState("");

    const [
        statusFilter,
        setStatusFilter
    ] = useState("ALL");

    // ======================================================
    // SELECTED INSTALLED TOOL
    // ======================================================

    const [
        selectedLifecycleId,
        setSelectedLifecycleId
    ] = useState("");

    // ======================================================
    // TOOL REPLACEMENT REQUEST MODAL
    // ======================================================

    const [
        requestTarget,
        setRequestTarget
    ] = useState(null);

    const [
        lastCreatedRequest,
        setLastCreatedRequest
    ] = useState(null);

    // ======================================================
    // REPLACEMENT READINESS
    // ======================================================

    const [
        replacementRules,
        setReplacementRules
    ] = useState([]);

    const [
        eligibleApprovers,
        setEligibleApprovers
    ] = useState([]);

    const [
        approvalWorkflow,
        setApprovalWorkflow
    ] = useState(null);

    const [
        loadingReadiness,
        setLoadingReadiness
    ] = useState(false);

    const [
        readinessError,
        setReadinessError
    ] = useState("");

    // ======================================================
    // ERRORS
    // ======================================================

    const [
        masterError,
        setMasterError
    ] = useState("");

    const [
        lifecycleError,
        setLifecycleError
    ] = useState("");

    // ======================================================
    // LOAD MASTER DATA
    // ======================================================

    useEffect(() => {

        let cancelled = false;

        async function loadMasters() {

            const results = await Promise.allSettled([

                companyService.getMaster(),

                machineService.getMaster(),

                toolService.getMaster(),

                partService.getMaster()

            ]);

            if (cancelled) {
                return;
            }

            const names = [
                "Company",
                "Machine",
                "Tool",
                "Part"
            ];

            const setters = [
                setCompanies,
                setMachines,
                setTools,
                setParts
            ];

            const errors = [];

            results.forEach((result, index) => {

                if (
                    result.status === "fulfilled"
                ) {

                    setters[index](
                        getRows(result.value)
                    );

                } else {

                    setters[index]([]);

                    errors.push(
                        `${names[index]}: ${
                            getError(result.reason)
                        }`
                    );
                }

            });

            setMasterError(
                errors.join(" | ")
            );

            // ----------------------------------------------
            // SELECT COMPANY FROM EXISTING LOGIN CONTEXT
            // ----------------------------------------------

            if (
                results[0].status === "fulfilled"
            ) {

                const companyRows = getRows(
                    results[0].value
                );

                let preferredCompany = "";

                try {

                    const storedUser = JSON.parse(
                        localStorage.getItem(
                            "operatex_user"
                        ) || "{}"
                    );

                    preferredCompany =
                        storedUser.company_id || "";

                } catch {

                    preferredCompany = "";
                }

                const preferred =
                    companyRows.find(company =>
                        sameId(
                            company.company_id,
                            preferredCompany
                        )
                    );

                const companyId =
                    preferred?.company_id ||
                    companyRows[0]?.company_id ||
                    "";

                setSelectedCompany(companyId);
            }

            setLoadingMasters(false);
        }

        loadMasters();

        return () => {
            cancelled = true;
        };

    }, []);

    // ======================================================
    // LOAD TOOL LIFECYCLE DATA
    //
    // Existing Tool Life runtime API.
    //
    // No Tool Life writes occur here.
    // ======================================================

    useEffect(() => {

        let cancelled = false;

        async function loadToolLifecycles() {

            if (!selectedCompany) {
                return;
            }

            try {

                const response = await api.get(
                    `${TOOL_LIFE_API}/runtime/history`,
                    {
                        params: {
                            company_id: selectedCompany,
                            limit: 100
                        }
                    }
                );

                if (cancelled) {
                    return;
                }

                const rows = getRows(response);

                const companyRows = rows.filter(
                    row =>
                        !row.company_id ||
                        sameId(
                            row.company_id,
                            selectedCompany
                        )
                );

                setLifecycles(companyRows);

                setLifecycleError("");

            } catch (error) {

                if (!cancelled) {

                    setLifecycleError(
                        getError(error)
                    );

                    setLifecycles([]);
                }

            } finally {

                if (!cancelled) {
                    setLoadingTools(false);
                }
            }
        }

        loadToolLifecycles();

        return () => {
            cancelled = true;
        };

    }, [
        selectedCompany,
        refreshKey
    ]);

    // ======================================================
    // MASTER LOOKUPS
    // ======================================================

    const machineName = useCallback(

        id => {

            const machine = machines.find(item =>
                sameId(
                    item.machine_id,
                    id
                )
            );

            return (
                machine?.machine_code ||
                machine?.machine_name ||
                id ||
                "-"
            );
        },

        [machines]
    );

    const toolName = useCallback(

        id => {

            const tool = tools.find(item =>
                sameId(
                    item.tool_id,
                    id
                )
            );

            return (
                tool?.tool_name ||
                tool?.tool_code ||
                id ||
                "-"
            );
        },

        [tools]
    );

    const partName = useCallback(

        id => {

            const part = parts.find(item =>
                sameId(
                    item.part_id,
                    id
                )
            );

            return (
                part?.part_code ||
                part?.part_name ||
                id ||
                "-"
            );
        },

        [parts]
    );

    // ======================================================
    // ACTIVE INSTALLED TOOLS
    // ======================================================

    const activeTools = useMemo(() => {

        return lifecycles.filter(item =>

            isActive(item.is_active) &&

            !item.ended_at

        );

    }, [lifecycles]);

    // ======================================================
    // SELECTED TOOL
    // ======================================================

    const selectedTool = useMemo(() => {

        return activeTools.find(item =>

            sameId(
                item.tool_life_result_id,
                selectedLifecycleId
            )

        ) || null;

    }, [
        activeTools,
        selectedLifecycleId
    ]);

    // ======================================================
    // FILTER INSTALLED TOOLS
    // ======================================================

    const filteredTools = useMemo(() => {

        const searchValue =
            search.trim().toLowerCase();

        return activeTools.filter(item => {

            if (
                statusFilter !== "ALL" &&
                item.life_status !== statusFilter
            ) {
                return false;
            }

            if (!searchValue) {
                return true;
            }

            const values = [

                machineName(
                    item.machine_id
                ),

                item.tool_number,

                toolName(
                    item.tool_id
                ),

                partName(
                    item.current_part_id
                ),

                item.life_status

            ];

            return values.some(value =>
                String(value || "")
                    .toLowerCase()
                    .includes(searchValue)
            );
        });

    }, [
        activeTools,
        statusFilter,
        search,
        machineName,
        toolName,
        partName
    ]);

    // ======================================================
    // KPI CARDS
    // ======================================================

    const kpis = useMemo(() => {

        return [
            {
                label: "Loaded Active Tools",
                value: activeTools.length
            },
            {
                label: "Normal",
                value: activeTools.filter(
                    item =>
                        item.life_status === "NORMAL"
                ).length
            },
            {
                label: "Warning",
                value: activeTools.filter(
                    item =>
                        item.life_status === "WARNING"
                ).length
            },
            {
                label: "Critical",
                value: activeTools.filter(
                    item =>
                        item.life_status === "CRITICAL"
                ).length
            }
        ];

    }, [activeTools]);

    // ======================================================
    // LOAD REPLACEMENT READINESS
    //
    // Uses existing Tool Replacement APIs:
    //
    // GET /tool-replacement/rules
    // GET /tool-replacement/eligible-approvers
    // ======================================================

    useEffect(() => {

        let cancelled = false;

        async function loadReadiness() {

            if (
                !selectedTool ||
                !selectedCompany
            ) {
                return;
            }

            try {

                const filters = {

                    company_id:
                        selectedCompany,

                    machine_id:
                        selectedTool.machine_id,

                    tool_id:
                        selectedTool.tool_id,

                    tool_number:
                        selectedTool.tool_number

                };

                // ------------------------------------------
                // LOAD REPLACEMENT RULES
                // ------------------------------------------

                const rulesResponse =
                    await toolReplacementService
                        .getReplacementRules({

                            ...filters,

                            ...(
                                selectedTool.current_part_id
                                    ? {
                                        part_id:
                                            selectedTool.current_part_id
                                    }
                                    : {}
                            )

                        });

                if (cancelled) {
                    return;
                }

                const rules = getRows(
                    rulesResponse
                );

                const manualRule = rules.some(rule =>

                    rule.change_trigger === "MANUAL" &&

                    isActive(rule.is_active) &&

                    isActive(
                        rule.require_authorization
                    ) &&

                    sameId(
                        rule.tool_id,
                        selectedTool.tool_id
                    ) &&

                    (
                        !rule.machine_id ||

                        sameId(
                            rule.machine_id,
                            selectedTool.machine_id
                        )
                    ) &&

                    (
                        !rule.tool_number ||

                        String(rule.tool_number)
                            .trim()
                            .toUpperCase() ===

                        String(
                            selectedTool.tool_number
                        )
                            .trim()
                            .toUpperCase()
                    ) &&

                    (
                        !rule.part_id ||

                        sameId(
                            rule.part_id,
                            selectedTool.current_part_id
                        )
                    )
                );

                let approvers = [];
                let workflow = null;

                // ------------------------------------------
                // LOAD CURRENT ELIGIBLE APPROVERS
                // ------------------------------------------

                if (manualRule) {

                    const approverResponse =
                        await toolReplacementService
                            .getEligibleReplacementApprovers(
                                filters
                            );

                    if (cancelled) {
                        return;
                    }

                    const data = getData(
                        approverResponse
                    );

                    approvers =
                        Array.isArray(data?.approvers)
                            ? data.approvers
                            : [];

                    workflow =
                        data?.workflow || null;
                }

                if (cancelled) {
                    return;
                }

                setReplacementRules(rules);

                setEligibleApprovers(
                    approvers
                );

                setApprovalWorkflow(
                    workflow
                );

                setReadinessError("");

            } catch (error) {

                if (!cancelled) {

                    setReadinessError(
                        getError(error)
                    );

                    setReplacementRules([]);

                    setEligibleApprovers([]);

                    setApprovalWorkflow(null);
                }

            } finally {

                if (!cancelled) {
                    setLoadingReadiness(false);
                }
            }
        }

        loadReadiness();

        return () => {
            cancelled = true;
        };

    }, [
        selectedTool,
        selectedCompany
    ]);

    // ======================================================
    // REFRESH INSTALLED TOOLS
    // ======================================================

    function refresh() {

        setSelectedLifecycleId("");

        setRefreshKey(previous =>
            previous + 1
        );
    }

    // ======================================================
    // SELECT TOOL
    // ======================================================

    function inspectTool(item) {

        setSelectedLifecycleId(
            item.tool_life_result_id
        );
    }

    // ======================================================
    // OPEN REQUEST MODAL
    // ======================================================

    function openRequestModal() {

        if (!selectedTool) {
            return;
        }

        if (
            !isActive(
                selectedTool.is_active
            ) ||
            selectedTool.ended_at
        ) {
            setReadinessError(
                "Only an active installed tool can be replaced."
            );

            return;
        }

        setRequestTarget(
            selectedTool
        );
    }

    // ======================================================
    // CLOSE REQUEST MODAL
    // ======================================================

    function closeRequestModal() {

        setRequestTarget(null);
    }

    // ======================================================
    // REQUEST CREATED CALLBACK
    // ======================================================

    function handleRequestCreated(result) {

        setLastCreatedRequest(
            result
        );
    }

    // ======================================================
    // RENDER
    // ======================================================

    return (

        <div className="cnc-adapter-page tool-replacement-page">

            {/* ==============================================
                PAGE HEADER
            ============================================== */}

            <PageHeader
                title="Tool Replacement"
                subtitle="Manage replacement requests, approval authorization and installed-tool selection."
            />

            {/* ==============================================
                KPI CARDS
            ============================================== */}

            <Row className="g-3 mb-4">

                {kpis.map(item => (

                    <Col
                        xl={3}
                        md={6}
                        key={item.label}
                    >

                        <Card className="border-0 shadow-sm h-100">

                            <Card.Body>

                                <div className="small text-muted">

                                    {item.label}

                                </div>

                                <div className="fs-3 fw-semibold mt-2">

                                    {loadingTools
                                        ? "..."
                                        : item.value}

                                </div>

                            </Card.Body>

                        </Card>

                    </Col>

                ))}

            </Row>

            {/* ==============================================
                COMPANY / SEARCH / STATUS FILTER
            ============================================== */}

            <Card className="border-0 shadow-sm mb-3">

                <Card.Body>

                    <Row className="g-3 align-items-end">

                        {/* COMPANY */}

                        <Col lg={3} md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Company
                                </Form.Label>

                                <Form.Select
                                    value={selectedCompany}
                                    disabled={loadingMasters}
                                    onChange={event => {

                                        setSelectedCompany(
                                            event.target.value
                                        );

                                        setSelectedLifecycleId("");

                                        setRequestTarget(null);

                                        setLastCreatedRequest(null);
                                    }}
                                >

                                    <option value="">
                                        Select Company
                                    </option>

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

                            </Form.Group>

                        </Col>

                        {/* SEARCH */}

                        <Col lg={4} md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Search Installed Tools
                                </Form.Label>

                                <Form.Control
                                    placeholder="Machine, tool, part..."
                                    value={search}
                                    onChange={event =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                />

                            </Form.Group>

                        </Col>

                        {/* LIFE STATUS */}

                        <Col lg={3} md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Life Status
                                </Form.Label>

                                <Form.Select
                                    value={statusFilter}
                                    onChange={event =>
                                        setStatusFilter(
                                            event.target.value
                                        )
                                    }
                                >

                                    <option value="ALL">
                                        All Active Tools
                                    </option>

                                    <option value="NORMAL">
                                        Normal
                                    </option>

                                    <option value="WARNING">
                                        Warning
                                    </option>

                                    <option value="CRITICAL">
                                        Critical
                                    </option>

                                </Form.Select>

                            </Form.Group>

                        </Col>

                        {/* REFRESH */}

                        <Col lg={2} md={6}>

                            <Button
                                variant="outline-primary"
                                className="w-100"
                                onClick={refresh}
                                disabled={
                                    loadingTools ||
                                    !selectedCompany
                                }
                            >

                                <ArrowClockwise className="me-2" />

                                Refresh

                            </Button>

                        </Col>

                    </Row>

                </Card.Body>

            </Card>

            {/* ==============================================
                MASTER DATA ERROR
            ============================================== */}

            {masterError && (

                <Alert variant="danger">

                    <ExclamationTriangle className="me-2" />

                    {masterError}

                </Alert>

            )}

            {/* ==============================================
                TOOL LIFE DATA ERROR
            ============================================== */}

            {lifecycleError && (

                <Alert variant="danger">

                    <ExclamationTriangle className="me-2" />

                    {lifecycleError}

                </Alert>

            )}

            {/* ==============================================
                LAST SUBMITTED REPLACEMENT REQUEST
            ============================================== */}

            {lastCreatedRequest && (

                <Alert
                    variant="success"
                    dismissible
                    onClose={() =>
                        setLastCreatedRequest(null)
                    }
                    className="mb-3"
                >

                    <div className="fw-semibold">

                        <CheckCircle className="me-2" />

                        Tool Replacement Request Submitted

                    </div>

                    <div className="mt-2">

                        <strong>Request ID:</strong>{" "}

                        <span className="font-monospace text-break">

                            {lastCreatedRequest.request_id}

                        </span>

                    </div>

                    <div className="mt-2">

                        <strong>Status:</strong>{" "}

                        <Badge bg="warning">

                            {lastCreatedRequest.status}

                        </Badge>

                    </div>

                    <div className="mt-2">

                        <strong>Assigned Approver:</strong>{" "}

                        {lastCreatedRequest.approver_user_id ?? "-"}

                    </div>

                    <div className="small mt-2">

                        The request has been created and is
                        awaiting approval.

                        Tool Life has not been reset.

                    </div>

                </Alert>

            )}

            {/* ==============================================
                INSTALLED TOOLS TABLE
            ============================================== */}

            <Card className="border-0 shadow-sm mb-4">

                <Card.Header className="bg-transparent border-0 pt-3 pb-2">

                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">

                        <div>

                            <div className="fw-semibold fs-5">

                                Installed Tools

                            </div>

                            <div className="small text-muted">

                                Select an active installed tool
                                to inspect its replacement eligibility.

                            </div>

                        </div>

                        <Badge bg="secondary">

                            {filteredTools.length} loaded

                        </Badge>

                    </div>

                </Card.Header>

                <Card.Body className="pt-2">

                    <div className="table-responsive">

                        <Table
                            hover
                            className="align-middle mb-0"
                        >

                            <thead>

                                <tr>

                                    <th>Machine</th>

                                    <th>Tool No.</th>

                                    <th>Tool</th>

                                    <th>Part</th>

                                    <th>Used</th>

                                    <th>Remaining</th>

                                    <th>Life Status</th>

                                    <th className="text-end">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {loadingTools ? (

                                    <tr>

                                        <td
                                            colSpan={8}
                                            className="text-center py-5"
                                        >

                                            <Spinner
                                                size="sm"
                                                animation="border"
                                                className="me-2"
                                            />

                                            Loading installed tools...

                                        </td>

                                    </tr>

                                ) : filteredTools.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={8}
                                            className="text-center py-5 text-muted"
                                        >

                                            No matching active tools found.

                                        </td>

                                    </tr>

                                ) : (

                                    filteredTools.map(item => {

                                        const selected = sameId(
                                            item.tool_life_result_id,
                                            selectedLifecycleId
                                        );

                                        return (

                                            <tr
                                                key={
                                                    item.tool_life_result_id
                                                }

                                                className={
                                                    selected
                                                        ? "table-active"
                                                        : ""
                                                }
                                            >

                                                {/* MACHINE */}

                                                <td>

                                                    {machineName(
                                                        item.machine_id
                                                    )}

                                                </td>

                                                {/* TOOL NUMBER */}

                                                <td className="fw-semibold">

                                                    {item.tool_number}

                                                </td>

                                                {/* TOOL */}

                                                <td>

                                                    {toolName(
                                                        item.tool_id
                                                    )}

                                                </td>

                                                {/* PART */}

                                                <td>

                                                    {partName(
                                                        item.current_part_id
                                                    )}

                                                </td>

                                                {/* USED */}

                                                <td>

                                                    {formatNumber(
                                                        item.total_used
                                                    )}

                                                </td>

                                                {/* REMAINING */}

                                                <td>

                                                    {formatNumber(
                                                        item.remaining_life
                                                    )}

                                                </td>

                                                {/* STATUS */}

                                                <td>

                                                    <Badge
                                                        bg={statusVariant(
                                                            item.life_status
                                                        )}
                                                    >

                                                        {item.life_status ||
                                                            "-"}

                                                    </Badge>

                                                </td>

                                                {/* ACTION */}

                                                <td className="text-end">

                                                    <Button
                                                        size="sm"

                                                        variant={
                                                            selected
                                                                ? "primary"
                                                                : "outline-primary"
                                                        }

                                                        onClick={() =>
                                                            inspectTool(item)
                                                        }
                                                    >

                                                        <Tools className="me-1" />

                                                        {selected
                                                            ? "Selected"
                                                            : "Inspect"}

                                                    </Button>

                                                </td>

                                            </tr>

                                        );
                                    })

                                )}

                            </tbody>

                        </Table>

                    </div>

                </Card.Body>

            </Card>

            {/* ==============================================
                SELECTED TOOL REPLACEMENT READINESS
            ============================================== */}

            {selectedTool && (

                <Card className="border-0 shadow-sm mb-4">

                    <Card.Body>

                        {/* HEADER */}

                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">

                            <div>

                                <div className="fw-semibold fs-5">

                                    Replacement Readiness

                                </div>

                                <div className="text-muted small">

                                    {machineName(
                                        selectedTool.machine_id
                                    )}

                                    {" / "}

                                    {selectedTool.tool_number}

                                </div>

                            </div>

                            {/* ACTION BUTTONS */}

                            <div className="d-flex align-items-center gap-2 flex-wrap">

                                <Button
                                    size="sm"
                                    variant="primary"

                                    onClick={
                                        openRequestModal
                                    }

                                    
disabled={
    loadingReadiness ||
    !selectedTool
}

                                >

                                    <Tools className="me-1" />

                                    Request Replacement

                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline-secondary"

                                    onClick={() =>
                                        setSelectedLifecycleId("")
                                    }
                                >

                                    Close Details

                                </Button>

                            </div>

                        </div>

                        {/* ==================================
                            TOOL LIFE SUMMARY
                        ================================== */}

                        <Row className="g-3 mb-3">

                            <Col md={4}>

                                <div className="p-3 border rounded-3 h-100">

                                    <div className="small text-muted">

                                        Current Usage

                                    </div>

                                    <div className="fs-4 fw-semibold">

                                        {formatNumber(
                                            selectedTool.total_used
                                        )}

                                    </div>

                                </div>

                            </Col>

                            <Col md={4}>

                                <div className="p-3 border rounded-3 h-100">

                                    <div className="small text-muted">

                                        Remaining Life

                                    </div>

                                    <div className="fs-4 fw-semibold">

                                        {formatNumber(
                                            selectedTool.remaining_life
                                        )}

                                    </div>

                                </div>

                            </Col>

                            <Col md={4}>

                                <div className="p-3 border rounded-3 h-100">

                                    <div className="small text-muted">

                                        Eligible Approvers

                                    </div>

                                    <div className="fs-4 fw-semibold">

                                        {loadingReadiness
                                            ? "..."
                                            : eligibleApprovers.length}

                                    </div>

                                </div>

                            </Col>

                        </Row>

                        {/* ==================================
                            READINESS LOADING
                        ================================== */}

                        {loadingReadiness && (

                            <div className="text-muted small mb-3">

                                <Spinner
                                    size="sm"
                                    animation="border"
                                    className="me-2"
                                />

                                Checking replacement rules
                                and approval authorization...

                            </div>

                        )}

                        {/* ==================================
                            READINESS ERROR
                        ================================== */}

                        {readinessError && (

                            <Alert variant="danger">

                                <ExclamationTriangle className="me-2" />

                                {readinessError}

                            </Alert>

                        )}

                        {/* ==================================
                            REPLACEMENT RULES
                        ================================== */}

                        {!loadingReadiness &&
                            !readinessError && (

                            <>

                                <div className="fw-semibold mb-2">

                                    Applicable Replacement Rules

                                </div>

                                {replacementRules.length === 0 ? (

                                    <Alert variant="warning">

                                        No applicable replacement
                                        rules were returned.

                                    </Alert>

                                ) : (

                                    <div className="d-flex gap-2 flex-wrap mb-3">

                                        {replacementRules.map(rule => (

                                            <Badge
                                                key={
                                                    rule.tool_change_rule_id
                                                }

                                                bg={
                                                    rule.change_trigger === "MANUAL"
                                                        ? "primary"
                                                        : "secondary"
                                                }
                                            >

                                                {rule.change_trigger}

                                            </Badge>

                                        ))}

                                    </div>

                                )}

                                {/* ==========================
                                    APPROVAL AUTHORIZATION
                                ========================== */}

                                <div className="fw-semibold mb-2">

                                    Approval Authorization

                                </div>

                                {approvalWorkflow ? (

                                    <Alert
                                        variant={
                                            eligibleApprovers.length
                                                ? "success"
                                                : "warning"
                                        }
                                    >

                                        {eligibleApprovers.length ? (

                                            <CheckCircle className="me-2" />

                                        ) : (

                                            <ExclamationTriangle className="me-2" />

                                        )}

                                        {eligibleApprovers.length
                                            ? `${eligibleApprovers.length} currently eligible approver(s) found.`
                                            : "No currently eligible approvers found."}

                                        <div className="small mt-2">

                                            Required skill:{" "}

                                            <strong>

                                                {approvalWorkflow.required_skill_code ||
                                                    approvalWorkflow.required_skill_id}

                                            </strong>

                                            {" · "}

                                            Minimum rank:{" "}

                                            <strong>

                                                {approvalWorkflow.min_level_rank}

                                            </strong>

                                        </div>

                                        {/* ELIGIBLE USERS */}

                                        {eligibleApprovers.length > 0 && (

                                            <div className="small mt-2">

                                                {eligibleApprovers.map(
                                                    approver =>
                                                        approver.username ||
                                                        approver.employee_code ||
                                                        `User ${approver.user_id}`
                                                ).join(", ")}

                                            </div>

                                        )}

                                    </Alert>

                                ) : (

                                    <Alert variant="secondary">

                                        Approval workflow readiness
                                        has not been established
                                        for this tool.

                                    </Alert>

                                )}

                                {/* ==========================
                                    WORKFLOW INFORMATION
                                ========================== */}

                                <Alert
                                    variant="light"
                                    className="border mb-0"
                                >

                                    <strong>

                                        Replacement Workflow

                                    </strong>

                                    <div className="small mt-2">

                                        1. Submit a Replacement Request

                                    </div>

                                    <div className="small mt-1">

                                        2. Authorized Approver
                                        Approves or Rejects

                                    </div>

                                    <div className="small mt-1">

                                        3. Authorized User
                                        Executes an Approved Replacement

                                    </div>

                                    <div className="small mt-2">

                                        Tool Life is reset only
                                        after successful execution.

                                    </div>

                                </Alert>

                            </>

                        )}

                    </Card.Body>

                </Card>

            )}

{/* ======================================================
    TOOL REPLACEMENT REQUESTS & APPROVAL QUEUE
====================================================== */}

<ToolReplacementRequests
    companyId={selectedCompany}
/>

            {/* ==============================================
                REQUEST REPLACEMENT MODAL
            ============================================== */}

            <ToolReplacementRequestModal
                show={Boolean(requestTarget)}

                companyId={
                    selectedCompany
                }

                target={
                    requestTarget
                }

                machineLabel={
                    requestTarget
                        ? machineName(
                            requestTarget.machine_id
                        )
                        : ""
                }

                toolLabel={
                    requestTarget
                        ? toolName(
                            requestTarget.tool_id
                        )
                        : ""
                }

                partLabel={
                    requestTarget
                        ? partName(
                            requestTarget.current_part_id
                        )
                        : ""
                }

                onClose={
                    closeRequestModal
                }

                onRequested={
                    handleRequestCreated
                }
            />

        </div>
    );
}
