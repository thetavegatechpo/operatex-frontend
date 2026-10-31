
import {
    useEffect,
    useState
} from "react";

import {
    Alert,
    Badge,
    Button,
    Col,
    Form,
    Modal,
    Row,
    Spinner
} from "react-bootstrap";

import {
    ArrowClockwise,
    CheckCircle,
    ExclamationTriangle,
    Tools
} from "react-bootstrap-icons";

import toolReplacementService from "../../api/toolReplacement.service.js";

// ==========================================================
// OPERATEX MES - TOOL REPLACEMENT REQUEST MODAL
//
// Creates only a REQUESTED replacement event.
//
// The backend handles:
// - Company access
// - Replacement rules
// - Role permissions
// - Skill Matrix certification
// - Approval workflow
// - Idempotency
//
// DOES NOT:
// - Approve replacement
// - Reject replacement
// - Execute replacement
// - Modify Tool Life
// ==========================================================

const EMPTY_FORM = {
    replacement_reason_id: "",
    change_trigger: "MANUAL",
    approval_mode: "SELECTED",
    selected_approver_user_id: "",
    remarks: ""
};

// ==========================================================
// COMMON HELPERS
// ==========================================================

function getData(response) {
    return response?.data?.data ?? null;
}

function getRows(response) {
    const data = getData(response);
    return Array.isArray(data) ? data : [];
}

function getError(error) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to process replacement request."
    );
}

function isActive(value) {
    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    );
}

function sameId(a, b) {
    return String(a ?? "") === String(b ?? "");
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

function getCurrentUserId() {
    try {
        const user = JSON.parse(
            localStorage.getItem("operatex_user") || "{}"
        );

        const id = Number(
            user.user_id ??
            user.userId ??
            user.id ??
            user.user?.user_id
        );

        return Number.isSafeInteger(id) && id > 0
            ? id
            : null;

    } catch {
        return null;
    }
}

function newIdempotencyKey() {
    return toolReplacementService
        .createReplacementIdempotencyKey();
}

function statusVariant(status) {
    switch (String(status || "").toUpperCase()) {
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

function approverName(approver) {
    const name =
        approver.username ||
        approver.employee_code ||
        `User ${approver.user_id}`;

    const role =
        approver.role_name ||
        approver.role_code ||
        "";

    return role
        ? `${name} (${role})`
        : name;
}

function matchesToolRule(rule, target) {
    if (!isActive(rule.is_active)) {
        return false;
    }

    if (!isActive(rule.require_authorization)) {
        return false;
    }

    if (!sameId(rule.tool_id, target?.tool_id)) {
        return false;
    }

    if (
        rule.machine_id &&
        !sameId(rule.machine_id, target?.machine_id)
    ) {
        return false;
    }

    if (
        rule.part_id &&
        !sameId(
            rule.part_id,
            target?.current_part_id
        )
    ) {
        return false;
    }

    if (
        rule.tool_number &&
        String(rule.tool_number)
            .trim()
            .toUpperCase() !==
        String(target?.tool_number || "")
            .trim()
            .toUpperCase()
    ) {
        return false;
    }

    return true;
}

// ==========================================================
// MODAL SESSION
//
// A new component instance is mounted every time the
// modal opens.
//
// This avoids resetting React state synchronously
// inside useEffect.
//
// It also preserves the idempotency key while retrying
// an unchanged failed request.
// ==========================================================

function ToolReplacementRequestSession({
    onClose,
    onRequested,
    companyId,
    target,
    machineLabel,
    toolLabel,
    partLabel
}) {

    // ======================================================
    // FORM STATE
    // ======================================================

    const [form, setForm] = useState({
        ...EMPTY_FORM
    });

    const [
        idempotencyKey,
        setIdempotencyKey
    ] = useState(newIdempotencyKey);

    const [attempted, setAttempted] = useState(false);

    // ======================================================
    // BACKEND CONFIGURATION STATE
    // ======================================================

    const [configuration, setConfiguration] = useState({
        loading: true,
        error: "",
        reasons: [],
        rules: [],
        approvers: [],
        workflow: null
    });

    const [refreshKey, setRefreshKey] = useState(0);

    // ======================================================
    // SUBMISSION STATE
    // ======================================================

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    // ======================================================
    // SELECTED TOOL CONTEXT
    // ======================================================

    const machineId = target?.machine_id || "";
    const toolId = target?.tool_id || "";
    const partId = target?.current_part_id || "";

    const toolNumber = String(
        target?.tool_number || ""
    ).trim().toUpperCase();

    const installed =
        isActive(target?.is_active) &&
        !target?.ended_at;

    const remainingLife =
        target?.remaining_life == null
            ? null
            : Number(target.remaining_life);

    const lifeExpired =
        remainingLife !== null &&
        Number.isFinite(remainingLife) &&
        remainingLife <= 0;

    const requesterId = getCurrentUserId();

    const {
        loading,
        error: configurationError,
        reasons,
        rules,
        approvers,
        workflow
    } = configuration;

    // ======================================================
    // LOAD REPLACEMENT CONFIGURATION
    //
    // This effect only loads backend data.
    //
    // Form reset is NOT performed inside useEffect.
    // ======================================================

    useEffect(() => {

        let cancelled = false;

        async function loadConfiguration() {

            if (
                !companyId ||
                !machineId ||
                !toolId ||
                !toolNumber
            ) {
                throw new Error(
                    "Company, machine and tool details are required."
                );
            }

            if (!installed) {
                throw new Error(
                    "Only active installed tools can be replaced."
                );
            }

            // ----------------------------------------------
            // FETCH REASONS AND RULES
            // ----------------------------------------------

            const [
                reasonsResponse,
                rulesResponse
            ] = await Promise.all([

                toolReplacementService
                    .getReplacementReasons(companyId),

                toolReplacementService
                    .getReplacementRules({
                        company_id: companyId,
                        machine_id: machineId,
                        tool_id: toolId,
                        tool_number: toolNumber,

                        ...(partId
                            ? { part_id: partId }
                            : {})
                    })
            ]);

            if (cancelled) return;

            const reasonRows =
                getRows(reasonsResponse);

            const ruleRows =
                getRows(rulesResponse);

            // ----------------------------------------------
            // CHECK APPLICABLE MANUAL RULE
            // ----------------------------------------------

            const hasManualRule = ruleRows.some(rule =>
                rule.change_trigger === "MANUAL" &&
                matchesToolRule(rule, target)
            );

            let loadedApprovers = [];
            let loadedWorkflow = null;

            // ----------------------------------------------
            // LOAD ELIGIBLE APPROVERS
            //
            // Current backend eligible-approvers API
            // checks the MANUAL replacement rule.
            // ----------------------------------------------

            if (hasManualRule) {

                const approverResponse =
                    await toolReplacementService
                        .getEligibleReplacementApprovers({
                            company_id: companyId,
                            machine_id: machineId,
                            tool_id: toolId,
                            tool_number: toolNumber
                        });

                if (cancelled) return;

                const data = getData(approverResponse);

                loadedApprovers =
                    Array.isArray(data?.approvers)
                        ? data.approvers
                        : [];

                loadedWorkflow =
                    data?.workflow || null;
            }

            if (cancelled) return;

            setConfiguration({
                loading: false,
                error: "",
                reasons: reasonRows,
                rules: ruleRows,
                approvers: loadedApprovers,
                workflow: loadedWorkflow
            });
        }

        loadConfiguration().catch(err => {
            if (cancelled) return;

            setConfiguration({
                loading: false,
                error: getError(err),
                reasons: [],
                rules: [],
                approvers: [],
                workflow: null
            });
        });

        return () => {
            cancelled = true;
        };

    }, [
        companyId,
        machineId,
        toolId,
        toolNumber,
        partId,
        installed,
        refreshKey,
        target
    ]);

    // ======================================================
    // APPLICABLE REPLACEMENT RULES
    // ======================================================

    const applicableRules = rules.filter(rule =>
        matchesToolRule(rule, target)
    );

    // ======================================================
    // AVAILABLE REPLACEMENT TRIGGERS
    // ======================================================

    const availableTriggers = [];

    const hasManualRule = applicableRules.some(
        rule =>
            rule.change_trigger === "MANUAL"
    );

    const hasLifeExpiredRule = applicableRules.some(
        rule =>
            rule.change_trigger === "LIFE_EXPIRED"
    );

    if (hasManualRule) {
        availableTriggers.push("MANUAL");
    }

    if (
        lifeExpired &&
        hasLifeExpiredRule
    ) {
        availableTriggers.push("LIFE_EXPIRED");
    }

    const selectedTrigger =
        availableTriggers.includes(form.change_trigger)
            ? form.change_trigger
            : availableTriggers[0] || "";

    // ======================================================
    // SELF APPROVAL VALIDATION
    //
    // Frontend validation is only for UI.
    // Backend performs authoritative checks.
    // ======================================================

    const canSelfApprove =
        workflow?.allow_self_approval === true &&
        requesterId !== null &&
        approvers.some(
            approver =>
                Number(approver.user_id) ===
                requesterId
        );

    const approvalMode =
        form.approval_mode === "SELF" &&
        canSelfApprove
            ? "SELF"
            : "SELECTED";

    // ======================================================
    // SELECTED APPROVER OPTIONS
    // ======================================================

    const selectableApprovers = approvers.filter(
        approver => {

            const id = Number(approver.user_id);

            if (
                !Number.isSafeInteger(id) ||
                id <= 0
            ) {
                return false;
            }

            if (
                requesterId !== null &&
                requesterId === id
            ) {
                return false;
            }

            return true;
        }
    );

    // ======================================================
    // REPLACEMENT REASON VALIDATION
    // ======================================================

    const selectedReason = reasons.find(
        reason =>
            sameId(
                reason.replacement_reason_id,
                form.replacement_reason_id
            )
    );

    const validReason =
        !!selectedReason &&
        (
            selectedReason.reason_code !==
                "LIFE_EXPIRED" ||
            lifeExpired
        );

    // ======================================================
    // APPROVER VALIDATION
    // ======================================================

    const validApprover =
        approvalMode === "SELF"
            ? canSelfApprove
            : selectableApprovers.some(
                approver =>
                    sameId(
                        approver.user_id,
                        form.selected_approver_user_id
                    )
            );

    // ======================================================
    // CAN SUBMIT
    // ======================================================

    const canSubmit =
        !loading &&
        !saving &&
        !success &&
        !configurationError &&
        installed &&
        Boolean(companyId) &&
        Boolean(selectedTrigger) &&
        Boolean(workflow) &&
        validReason &&
        validApprover &&
        Boolean(idempotencyKey);

    // ======================================================
    // UPDATE FORM FIELD
    //
    // When an attempted payload changes, use a new key.
    //
    // Retrying the same payload keeps the original key.
    // ======================================================

    function updateField(field, value) {

        if (attempted) {
            try {
                setIdempotencyKey(
                    newIdempotencyKey()
                );

                setAttempted(false);

            } catch (err) {
                setError(getError(err));
                return;
            }
        }

        setForm(previous => ({
            ...previous,
            [field]: value
        }));

        setError("");
    }

    // ======================================================
    // CHANGE APPROVAL MODE
    // ======================================================

    function changeApprovalMode(value) {

        if (attempted) {
            try {
                setIdempotencyKey(
                    newIdempotencyKey()
                );

                setAttempted(false);

            } catch (err) {
                setError(getError(err));
                return;
            }
        }

        setForm(previous => ({
            ...previous,
            approval_mode: value,
            selected_approver_user_id: ""
        }));

        setError("");
    }

    // ======================================================
    // REFRESH BACKEND CONFIGURATION
    // ======================================================

    function refreshConfiguration() {

        if (saving || loading) return;

        setConfiguration(previous => ({
            ...previous,
            loading: true,
            error: ""
        }));

        setError("");

        setRefreshKey(previous =>
            previous + 1
        );
    }

    // ======================================================
    // CLOSE MODAL
    // ======================================================

    function closeModal() {

        if (saving) return;

        if (typeof onClose === "function") {
            onClose();
        }
    }

    // ======================================================
    // SUBMIT REPLACEMENT REQUEST
    //
    // POST /api/tool-replacement/requests
    // ======================================================

    async function submitRequest(event) {

        event.preventDefault();

        if (saving || success) return;

        if (!canSubmit) {
            setError(
                "Please select a valid replacement reason, trigger and eligible approver."
            );
            return;
        }

        const payload = {
            company_id: companyId,

            machine_id: machineId,

            tool_id: toolId,

            tool_number: toolNumber,

            replacement_reason_id:
                form.replacement_reason_id,

            change_trigger:
                selectedTrigger,

            approval_mode:
                approvalMode,

            remarks:
                form.remarks.trim() || null,

            idempotency_key:
                idempotencyKey
        };

        if (approvalMode === "SELECTED") {

            payload.selected_approver_user_id =
                Number(
                    form.selected_approver_user_id
                );
        }

        setSaving(true);
        setAttempted(true);
        setError("");

        try {

            const response =
                await toolReplacementService
                    .requestToolReplacement(payload);

            const result = getData(response);

            if (
                !result ||
                !result.request_id
            ) {
                throw new Error(
                    "Backend did not return a valid replacement request ID."
                );
            }

            setSuccess(result);

            // Notify the parent so it can refresh its
            // lists without closing this success screen.

            if (typeof onRequested === "function") {
                try {
                    onRequested(result);
                } catch (callbackError) {
                    console.error(
                        "Tool Replacement refresh callback failed:",
                        callbackError
                    );
                }
            }

        } catch (err) {

            setError(getError(err));

        } finally {

            setSaving(false);
        }
    }

    // ======================================================
    // RENDER
    // ======================================================

    return (

        <Modal
            show={true}
            onHide={closeModal}
            centered
            size="lg"
            scrollable
            backdrop="static"
            keyboard={!saving}
        >

            <Form onSubmit={submitRequest}>

                {/* ==========================================
                    HEADER
                ========================================== */}

                <Modal.Header closeButton={!saving}>

                    <Modal.Title>

                        <Tools className="me-2" />

                        Request Tool Replacement

                    </Modal.Title>

                </Modal.Header>

                {/* ==========================================
                    BODY
                ========================================== */}

                <Modal.Body>

                    {/* ======================================
                        CURRENT INSTALLED TOOL
                    ====================================== */}

                    <div className="border rounded-3 p-3 mb-4">

                        <div className="d-flex align-items-center justify-content-between mb-3">

                            <strong>
                                Selected Installed Tool
                            </strong>

                            <Badge
                                bg={statusVariant(
                                    target?.life_status
                                )}
                            >

                                {target?.life_status || "-"}

                            </Badge>

                        </div>

                        <Row className="g-3">

                            <Col md={6}>

                                <div className="small text-muted">
                                    Machine
                                </div>

                                <div className="fw-semibold">
                                    {machineLabel || machineId || "-"}
                                </div>

                            </Col>

                            <Col md={6}>

                                <div className="small text-muted">
                                    Tool Number
                                </div>

                                <div className="fw-semibold">
                                    {toolNumber || "-"}
                                </div>

                            </Col>

                            <Col md={6}>

                                <div className="small text-muted">
                                    Tool
                                </div>

                                <div className="fw-semibold">
                                    {toolLabel || toolId || "-"}
                                </div>

                            </Col>

                            <Col md={6}>

                                <div className="small text-muted">
                                    Current Part
                                </div>

                                <div className="fw-semibold">
                                    {partLabel || partId || "-"}
                                </div>

                            </Col>

                            <Col md={4}>

                                <div className="small text-muted">
                                    Used Life
                                </div>

                                <div className="fw-semibold">
                                    {formatNumber(
                                        target?.total_used
                                    )}
                                </div>

                            </Col>

                            <Col md={4}>

                                <div className="small text-muted">
                                    Remaining Life
                                </div>

                                <div className="fw-semibold">
                                    {formatNumber(
                                        target?.remaining_life
                                    )}
                                </div>

                            </Col>

                            <Col md={4}>

                                <div className="small text-muted">
                                    Maximum Life
                                </div>

                                <div className="fw-semibold">
                                    {formatNumber(
                                        target?.max_life_count
                                    )}
                                </div>

                            </Col>

                        </Row>

                    </div>

                    {/* ======================================
                        CONFIGURATION ERROR
                    ====================================== */}

                    {configurationError && (

                        <Alert variant="danger">

                            <ExclamationTriangle className="me-2" />

                            {configurationError}

                        </Alert>

                    )}

                    {/* ======================================
                        SUBMISSION ERROR
                    ====================================== */}

                    {error && (

                        <Alert variant="danger">

                            <ExclamationTriangle className="me-2" />

                            {error}

                        </Alert>

                    )}

                    {/* ======================================
                        SUCCESS
                    ====================================== */}

                    {success ? (

                        <Alert variant="success">

                            <div className="fw-semibold mb-3">

                                <CheckCircle className="me-2" />

                                Replacement Request Submitted

                            </div>

                            <div className="small mb-1">

                                Request ID

                            </div>

                            <div className="font-monospace text-break p-2 bg-white border rounded mb-3">

                                {success.request_id}

                            </div>

                            <div className="mb-1">

                                <strong>Status:</strong>{" "}

                                {success.status}

                            </div>

                            <div className="mb-1">

                                <strong>Approver User ID:</strong>{" "}

                                {success.approver_user_id ?? "-"}

                            </div>

                            <div className="small mt-3">

                                The request has been submitted.

                                It must be approved before an
                                authorized replacement can be
                                executed.

                                Tool Life has not been reset.

                            </div>

                        </Alert>

                    ) : (

                        <>

                            {/* ==============================
                                LOADING
                            ============================== */}

                            {loading && (

                                <div className="text-center py-4">

                                    <Spinner
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                    />

                                    Loading replacement configuration...

                                </div>

                            )}

                            {/* ==============================
                                REQUEST FORM
                            ============================== */}

                            {!loading && (

                                <>

                                    {/* APPROVER WARNING */}

                                    {approvers.length === 0 && (

                                        <Alert variant="warning">

                                            <ExclamationTriangle className="me-2" />

                                            No currently eligible approvers
                                            are available for this tool.

                                            A valid approval permission
                                            and Skill Matrix certification
                                            are required.

                                        </Alert>

                                    )}

                                    {/* RULE WARNING */}

                                    {availableTriggers.length === 0 && (

                                        <Alert variant="warning">

                                            No applicable authorized
                                            replacement rule is configured
                                            for this installed tool.

                                        </Alert>

                                    )}

                                    <Row className="g-3">

                                        {/* ======================
                                            TRIGGER
                                        ====================== */}

                                        <Col md={6}>

                                            <Form.Group>

                                                <Form.Label>
                                                    Replacement Trigger
                                                </Form.Label>

                                                <Form.Select
                                                    required
                                                    value={selectedTrigger}
                                                    disabled={
                                                        availableTriggers.length === 0 ||
                                                        saving
                                                    }
                                                    onChange={event =>
                                                        updateField(
                                                            "change_trigger",
                                                            event.target.value
                                                        )
                                                    }
                                                >

                                                    {availableTriggers.length === 0 && (

                                                        <option value="">
                                                            No Applicable Rule
                                                        </option>

                                                    )}

                                                    {availableTriggers.map(
                                                        trigger => (

                                                            <option
                                                                key={trigger}
                                                                value={trigger}
                                                            >

                                                                {trigger === "MANUAL"
                                                                    ? "Manual Replacement"
                                                                    : "Tool Life Expired"}

                                                            </option>

                                                        )
                                                    )}

                                                </Form.Select>

                                            </Form.Group>

                                        </Col>

                                        {/* ======================
                                            REASON
                                        ====================== */}

                                        <Col md={6}>

                                            <Form.Group>

                                                <Form.Label>
                                                    Replacement Reason
                                                    <span className="text-danger"> *</span>
                                                </Form.Label>

                                                <Form.Select
                                                    required
                                                    disabled={saving}
                                                    value={
                                                        form.replacement_reason_id
                                                    }
                                                    onChange={event =>
                                                        updateField(
                                                            "replacement_reason_id",
                                                            event.target.value
                                                        )
                                                    }
                                                >

                                                    <option value="">
                                                        Select Replacement Reason
                                                    </option>

                                                    {reasons
                                                        .filter(
                                                            reason =>
                                                                reason.reason_code !==
                                                                    "LIFE_EXPIRED" ||
                                                                lifeExpired
                                                        )
                                                        .map(reason => (

                                                            <option
                                                                key={
                                                                    reason.replacement_reason_id
                                                                }
                                                                value={
                                                                    reason.replacement_reason_id
                                                                }
                                                            >

                                                                {reason.reason_name}

                                                            </option>

                                                        ))}

                                                </Form.Select>

                                            </Form.Group>

                                        </Col>

                                        {/* ======================
                                            APPROVAL MODE
                                        ====================== */}

                                        <Col md={6}>

                                            <Form.Group>

                                                <Form.Label>
                                                    Approval Mode
                                                    <span className="text-danger"> *</span>
                                                </Form.Label>

                                                <Form.Select
                                                    value={approvalMode}
                                                    disabled={saving}
                                                    onChange={event =>
                                                        changeApprovalMode(
                                                            event.target.value
                                                        )
                                                    }
                                                >

                                                    <option value="SELECTED">
                                                        Selected Approver
                                                    </option>

                                                    {canSelfApprove && (

                                                        <option value="SELF">
                                                            Self Approval
                                                        </option>

                                                    )}

                                                </Form.Select>

                                            </Form.Group>

                                        </Col>

                                        {/* ======================
                                            APPROVER
                                        ====================== */}

                                        {approvalMode === "SELECTED" && (

                                            <Col md={6}>

                                                <Form.Group>

                                                    <Form.Label>
                                                        Select Approver
                                                        <span className="text-danger"> *</span>
                                                    </Form.Label>

                                                    <Form.Select
                                                        required
                                                        disabled={saving}
                                                        value={
                                                            form.selected_approver_user_id
                                                        }
                                                        onChange={event =>
                                                            updateField(
                                                                "selected_approver_user_id",
                                                                event.target.value
                                                            )
                                                        }
                                                    >

                                                        <option value="">
                                                            Select Eligible Approver
                                                        </option>

                                                        {selectableApprovers.map(
                                                            approver => (

                                                                <option
                                                                    key={approver.user_id}
                                                                    value={approver.user_id}
                                                                >

                                                                    {approverName(
                                                                        approver
                                                                    )}

                                                                </option>

                                                            )
                                                        )}

                                                    </Form.Select>

                                                </Form.Group>

                                            </Col>

                                        )}

                                        {/* ======================
                                            REMARKS
                                        ====================== */}

                                        <Col md={12}>

                                            <Form.Group>

                                                <Form.Label>
                                                    Request Remarks
                                                </Form.Label>

                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    maxLength={1000}
                                                    disabled={saving}
                                                    placeholder="Explain why the installed tool needs replacement"
                                                    value={form.remarks}
                                                    onChange={event =>
                                                        updateField(
                                                            "remarks",
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                            </Form.Group>

                                        </Col>

                                    </Row>

                                    {/* ======================
                                        WORKFLOW NOTICE
                                    ====================== */}

                                    <Alert
                                        variant="light"
                                        className="border mt-4 mb-0"
                                    >

                                        <strong>
                                            Replacement Workflow
                                        </strong>

                                        <div className="small mt-2">

                                            Submit Request → Approval →
                                            Execute Replacement

                                        </div>

                                        <div className="small mt-2">

                                            Submitting this request does
                                            not reset Tool Life or create
                                            a new tool lifecycle.

                                        </div>

                                    </Alert>

                                </>

                            )}

                        </>

                    )}

                </Modal.Body>

                {/* ==========================================
                    FOOTER
                ========================================== */}

                <Modal.Footer>

                    {!success && (

                        <Button
                            variant="outline-secondary"
                            disabled={loading || saving}
                            onClick={refreshConfiguration}
                        >

                            <ArrowClockwise className="me-1" />

                            Refresh

                        </Button>

                    )}

                    <Button
                        variant="secondary"
                        disabled={saving}
                        onClick={closeModal}
                    >
                        Close
                    </Button>

                    {!success && (

                        <Button
                            variant="primary"
                            type="submit"
                            disabled={!canSubmit}
                        >

                            {saving ? (

                                <>
                                    <Spinner
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                    />

                                    Submitting...
                                </>

                            ) : (

                                "Submit Replacement Request"

                            )}

                        </Button>

                    )}

                </Modal.Footer>

            </Form>

        </Modal>
    );
}

// ==========================================================
// EXPORTED COMPONENT
//
// Mount a fresh session whenever show becomes true.
//
// This removes the need for:
//
// useEffect(() => {
//     setForm(...)
// }, [show]);
//
// Therefore it avoids react-hooks/set-state-in-effect.
// ==========================================================

export default function ToolReplacementRequestModal(props) {

    if (!props.show) {
        return null;
    }

    const sessionKey =
        props.target?.tool_life_result_id ||
        "tool-replacement-request";

    return (
        <ToolReplacementRequestSession
            key={sessionKey}
            {...props}
        />
    );
}
