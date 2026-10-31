
import { useRef, useState } from "react";

import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    Modal,
    Row,
    Spinner
} from "react-bootstrap";

import {
    CheckCircle,
    ExclamationTriangle,
    Tools
} from "react-bootstrap-icons";

import toolReplacementService from "../../api/toolReplacement.service.js";

// ==========================================================
// OPERATEX MES - EXECUTE TOOL REPLACEMENT MODAL
//
// Props:
// show       : boolean
// request    : approved replacement request
// onClose    : function
// onExecuted : function(executionResult)
//
// IMPORTANT:
// - Uses existing Execute Replacement API.
// - Does not update Tool Life directly.
// - Backend verifies execution permission.
// - Backend performs atomic Tool Life transaction.
// - Backend creates the execution audit event.
// ==========================================================

function getErrorMessage(error) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to execute Tool Replacement."
    );
}

function displayValue(value) {
    if (value === undefined || value === null || value === "") {
        return "—";
    }

    return String(value);
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

export default function ToolReplacementExecuteModal({
    show = false,
    request = null,
    onClose,
    onExecuted
}) {
    // ======================================================
    // FORM STATE
    // ======================================================

    const [oldToolSerial, setOldToolSerial] = useState("");

    const [newToolSerial, setNewToolSerial] = useState("");

    const [remarks, setRemarks] = useState("");

    const [physicalReplacementConfirmed, setPhysicalReplacementConfirmed] =
        useState(false);

    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");

    const [executionResult, setExecutionResult] = useState(null);

    // Preserve the idempotency key when retrying
    // the same request with the same form data.
    const lastAttemptRef = useRef(null);

    // ======================================================
    // REQUEST DETAILS
    // ======================================================

    const requestId = request?.request_id || null;

    const isApproved = request?.status === "APPROVED";

    const isExecuted = Boolean(executionResult);

    const canExecute =
        Boolean(requestId) &&
        isApproved &&
        physicalReplacementConfirmed &&
        !submitting &&
        !isExecuted;

    // ======================================================
    // CLOSE AND RESET
    // ======================================================

    function handleClose() {
        if (submitting) {
            return;
        }

        setOldToolSerial("");
        setNewToolSerial("");
        setRemarks("");

        setPhysicalReplacementConfirmed(false);

        setError("");
        setExecutionResult(null);

        lastAttemptRef.current = null;

        if (typeof onClose === "function") {
            onClose();
        }
    }

    // ======================================================
    // GENERATE / REUSE IDEMPOTENCY KEY
    //
    // Same request + same payload = same key.
    //
    // If form data changes, a new operation key
    // is generated.
    // ======================================================

    function getIdempotencyKey(id, payload) {
        const fingerprint = JSON.stringify({
            request_id: id,
            old_tool_serial: payload.old_tool_serial ?? null,
            new_tool_serial: payload.new_tool_serial ?? null,
            remarks: payload.remarks ?? null
        });

        if (
            lastAttemptRef.current?.fingerprint === fingerprint
        ) {
            return lastAttemptRef.current.key;
        }

        const key =
            toolReplacementService.createReplacementIdempotencyKey();

        lastAttemptRef.current = {
            fingerprint,
            key
        };

        return key;
    }

    // ======================================================
    // EXECUTE REPLACEMENT
    // ======================================================

    async function handleExecute(event) {
        event.preventDefault();

        if (submitting || isExecuted) {
            return;
        }

        setError("");

        if (!requestId) {
            setError("A valid replacement request is required.");
            return;
        }

        if (!isApproved) {
            setError(
                "Only an APPROVED Tool Replacement request can be executed."
            );
            return;
        }

        if (!physicalReplacementConfirmed) {
            setError(
                "Please confirm that the physical tool has been replaced."
            );
            return;
        }

        const oldSerial = oldToolSerial.trim();
        const newSerial = newToolSerial.trim();
        const trimmedRemarks = remarks.trim();

        // Client-side validation.
        // Backend performs its own final validation.

        if (
            oldSerial &&
            newSerial &&
            oldSerial.toUpperCase() === newSerial.toUpperCase()
        ) {
            setError(
                "Old and new tool serial numbers must be different."
            );
            return;
        }

        // Empty optional fields are omitted, not sent
        // as empty strings.

        const payload = {
            ...(oldSerial
                ? { old_tool_serial: oldSerial }
                : {}),

            ...(newSerial
                ? { new_tool_serial: newSerial }
                : {}),

            ...(trimmedRemarks
                ? { remarks: trimmedRemarks }
                : {})
        };

        setSubmitting(true);

        let completedResult = null;

        try {
            const idempotencyKey =
                getIdempotencyKey(requestId, payload);

            const response =
                await toolReplacementService.executeToolReplacement(
                    requestId,
                    {
                        ...payload,
                        idempotency_key: idempotencyKey
                    }
                );

            if (
                response?.data?.success !== true ||
                response?.data?.data?.status !== "EXECUTED"
            ) {
                throw new Error(
                    "Execution response could not be confirmed. Refresh the request before retrying."
                );
            }

            completedResult = response.data.data;

            setExecutionResult(completedResult);

            setError("");

        } catch (executionError) {
            setError(getErrorMessage(executionError));

        } finally {
            setSubmitting(false);
        }

        // Only notify the parent after confirmed success.
        // Parent refresh errors must never be reported as
        // a failed physical Tool Replacement.

        if (
            completedResult &&
            typeof onExecuted === "function"
        ) {
            try {
                await onExecuted(completedResult);
            } catch (refreshError) {
                console.error(
                    "Replacement executed, but UI refresh failed:",
                    refreshError
                );
            }
        }
    }

    // ======================================================
    // UI
    // ======================================================

    return (
        <Modal
            show={Boolean(show)}
            onHide={handleClose}
            centered
            size="lg"
            backdrop={submitting ? "static" : true}
            keyboard={!submitting}
        >
            <Modal.Header closeButton={!submitting}>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <Tools />
                    Execute Tool Replacement
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleExecute}>
                <Modal.Body className="p-4">

                    {/* REQUEST STATUS */}

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <div>
                            <div className="small text-muted">
                                Current Request Status
                            </div>

                            <Badge
                                bg={
                                    isExecuted
                                        ? "success"
                                        : isApproved
                                            ? "info"
                                            : "warning"
                                }
                                className="mt-1"
                            >
                                {isExecuted
                                    ? "EXECUTED"
                                    : displayValue(request?.status)}
                            </Badge>
                        </div>

                        <div className="small text-muted text-end">
                            <div>Request ID</div>
                            <div
                                className="fw-semibold text-break"
                                style={{ maxWidth: 320 }}
                            >
                                {displayValue(requestId)}
                            </div>
                        </div>
                    </div>

                    {/* NOT APPROVED */}

                    {request && !isApproved && !isExecuted && (
                        <Alert variant="warning">
                            Only approved requests can proceed
                            to replacement execution.
                        </Alert>
                    )}

                    {/* REQUEST DETAILS */}

                    <Card className="border mb-4">
                        <Card.Body>
                            <h6 className="fw-bold mb-3">
                                Replacement Request Details
                            </h6>

                            <Row className="g-3">

                                <Col xs={12} sm={6}>
                                    <div className="small text-muted">
                                        Tool Number
                                    </div>
                                    <div className="fw-semibold">
                                        {displayValue(request?.tool_number)}
                                    </div>
                                </Col>

                                <Col xs={12} sm={6}>
                                    <div className="small text-muted">
                                        Replacement Reason
                                    </div>
                                    <div className="fw-semibold">
                                        {displayValue(
                                            request?.replacement_reason
                                        )}
                                    </div>
                                </Col>

                                <Col xs={12} sm={6}>
                                    <div className="small text-muted">
                                        Machine ID
                                    </div>
                                    <div className="small text-break">
                                        {displayValue(request?.machine_id)}
                                    </div>
                                </Col>

                                <Col xs={12} sm={6}>
                                    <div className="small text-muted">
                                        Trigger
                                    </div>
                                    <div>
                                        {displayValue(request?.change_trigger)}
                                    </div>
                                </Col>

                                <Col xs={12} sm={6}>
                                    <div className="small text-muted">
                                        Requested At
                                    </div>
                                    <div>
                                        {formatDate(request?.requested_at)}
                                    </div>
                                </Col>

                                <Col xs={12} sm={6}>
                                    <div className="small text-muted">
                                        Approved At
                                    </div>
                                    <div>
                                        {formatDate(request?.approved_at)}
                                    </div>
                                </Col>

                            </Row>
                        </Card.Body>
                    </Card>

                    {/* SUCCESS RESULT */}

                    {isExecuted ? (
                        <>
                            <Alert variant="success">
                                <div className="d-flex align-items-center gap-2 fw-bold mb-2">
                                    <CheckCircle />
                                    Tool Replacement Executed Successfully
                                </div>

                                The backend confirmed the replacement
                                transaction and recorded the execution event.
                            </Alert>

                            <Card className="border">
                                <Card.Body>
                                    <h6 className="fw-bold mb-3">
                                        New Tool Life Details
                                    </h6>

                                    <Row className="g-3">
                                        <Col xs={12}>
                                            <div className="small text-muted">
                                                Previous Tool Life ID
                                            </div>
                                            <div className="small text-break">
                                                {displayValue(
                                                    executionResult.old_tool_life_result_id
                                                )}
                                            </div>
                                        </Col>

                                        <Col xs={12}>
                                            <div className="small text-muted">
                                                New Tool Life ID
                                            </div>
                                            <div className="small text-break">
                                                {displayValue(
                                                    executionResult.new_tool_life_result_id
                                                )}
                                            </div>
                                        </Col>

                                        <Col xs={12} sm={6}>
                                            <div className="small text-muted">
                                                New Total Used
                                            </div>
                                            <div className="fw-bold">
                                                {displayValue(
                                                    executionResult.new_total_used
                                                )}
                                            </div>
                                        </Col>

                                        <Col xs={12} sm={6}>
                                            <div className="small text-muted">
                                                New Remaining Life
                                            </div>
                                            <div className="fw-bold">
                                                {displayValue(
                                                    executionResult.new_remaining_life
                                                )}
                                            </div>
                                        </Col>

                                        <Col xs={12}>
                                            <div className="small text-muted">
                                                New Life Status
                                            </div>
                                            <Badge bg="success">
                                                {displayValue(
                                                    executionResult.new_life_status
                                                )}
                                            </Badge>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </>
                    ) : (
                        <>
                            {/* PHYSICAL TOOL DETAILS */}

                            <h6 className="fw-bold mb-3">
                                Physical Tool Replacement
                            </h6>

                            <Row className="g-3 mb-3">

                                <Col xs={12} md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">
                                            Old Tool Serial Number
                                        </Form.Label>

                                        <Form.Control
                                            type="text"
                                            maxLength={100}
                                            placeholder="Scan or enter old serial"
                                            value={oldToolSerial}
                                            disabled={submitting || !isApproved}
                                            onChange={event => {
                                                setOldToolSerial(
                                                    event.target.value
                                                );
                                                setError("");
                                            }}
                                        />

                                        <Form.Text muted>
                                            Optional
                                        </Form.Text>
                                    </Form.Group>
                                </Col>

                                <Col xs={12} md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">
                                            New Tool Serial Number
                                        </Form.Label>

                                        <Form.Control
                                            type="text"
                                            maxLength={100}
                                            placeholder="Scan or enter new serial"
                                            value={newToolSerial}
                                            disabled={submitting || !isApproved}
                                            onChange={event => {
                                                setNewToolSerial(
                                                    event.target.value
                                                );
                                                setError("");
                                            }}
                                        />

                                        <Form.Text muted>
                                            Optional
                                        </Form.Text>
                                    </Form.Group>
                                </Col>

                            </Row>

                            {/* REMARKS */}

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold">
                                    Replacement Remarks
                                </Form.Label>

                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    maxLength={1000}
                                    placeholder="Enter replacement remarks (optional)"
                                    value={remarks}
                                    disabled={submitting || !isApproved}
                                    onChange={event => {
                                        setRemarks(event.target.value);
                                        setError("");
                                    }}
                                />
                            </Form.Group>

                            {/* WARNING */}

                            <Alert variant="warning">
                                <div className="d-flex gap-2">
                                    <ExclamationTriangle
                                        className="flex-shrink-0 mt-1"
                                    />
                                    <div>
                                        <strong>Important:</strong>
                                        {" "}
                                        Execute only after the physical
                                        tool has been replaced on the machine.

                                        On successful authorization,
                                        the backend closes the old Tool Life,
                                        creates a new lifecycle, and records
                                        the replacement audit event.
                                    </div>
                                </div>
                            </Alert>

                            {/* PHYSICAL CONFIRMATION */}

                            <Card className="border">
                                <Card.Body>
                                    <Form.Check
                                        type="checkbox"
                                        id="confirm-physical-tool-replacement"
                                        checked={physicalReplacementConfirmed}
                                        disabled={submitting || !isApproved}
                                        onChange={event => {
                                            setPhysicalReplacementConfirmed(
                                                event.target.checked
                                            );
                                            setError("");
                                        }}
                                        label={
                                            "I confirm that the physical tool has been replaced and the new tool is installed correctly."
                                        }
                                    />
                                </Card.Body>
                            </Card>

                            {/* EXECUTION ERROR */}

                            {error && (
                                <Alert
                                    variant="danger"
                                    className="mt-3 mb-0"
                                >
                                    {error}
                                </Alert>
                            )}
                        </>
                    )}

                </Modal.Body>

                <Modal.Footer>

                    <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        {isExecuted ? "Close" : "Cancel"}
                    </Button>

                    {!isExecuted && (
                        <Button
                            type="submit"
                            variant="success"
                            disabled={!canExecute}
                        >
                            {submitting ? (
                                <>
                                    <Spinner
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                    />
                                    Executing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="me-2" />
                                    Confirm & Execute Replacement
                                </>
                            )}
                        </Button>
                    )}

                </Modal.Footer>
            </Form>
        </Modal>
    );
}
