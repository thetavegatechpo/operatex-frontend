
import { useEffect, useState } from "react";
import {
  Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table
} from "react-bootstrap";
import {
  ArrowClockwise, CheckCircle, ClockHistory, Eye, Tools, XCircle
} from "react-bootstrap-icons";
import toolReplacementService from "../../api/toolReplacement.service.js";
import ToolReplacementExecuteModal from "./ToolReplacementExecuteModal.jsx";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "OPEN", label: "Open Requests" },
  { value: "REQUESTED", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXECUTED", label: "Executed" }
];

const errorMessage = error =>
  error?.response?.data?.message || error?.message || "Unable to complete the operation.";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const formatUser = id =>
  id == null || id === "" ? "—" : `User #${id}`;

const shortRequestId = id =>
  id ? `${String(id).slice(0, 8)}...` : "—";

const statusVariant = status => ({
  REQUESTED: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  EXECUTED: "success"
}[status] || "secondary");

const statusLabel = status =>
  status === "REQUESTED" ? "PENDING APPROVAL" : (status || "UNKNOWN");

function eventActor(event) {
  const p = event?.payload || {};

  switch (event?.event_type) {
    case "REQUESTED":
      return formatUser(p.requested_by);
    case "APPROVED":
      return formatUser(p.approved_by);
    case "REJECTED":
      return formatUser(p.rejected_by);
    case "EXECUTED":
      return formatUser(event.replaced_by ?? p.replaced_by);
    default:
      return "—";
  }
}

const eventRemarks = event => {
  const p = event?.payload || {};
  return p.rejection_remarks || p.approval_remarks || p.remarks || "";
};

export default function ToolReplacementRequests({ companyId, onChanged }) {

  const [scope, setScope] = useState("MY_REQUESTS");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // Execution access is determined by the database-backed API.
  const [canExecute, setCanExecute] = useState(false);

  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState(null);

  const [historyRequest, setHistoryRequest] = useState(null);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [decision, setDecision] = useState(null);
  const [decisionRemarks, setDecisionRemarks] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [executionTarget, setExecutionTarget] = useState(null);

  // ==========================================================
  // CHECK EXECUTION QUEUE PERMISSION
  //
  // A successful response means the backend allowed access.
  // No fixed user IDs, role IDs, machines or tools.
  // ==========================================================

  useEffect(() => {
    let active = true;

    setCanExecute(false);

    if (!companyId) {
      return () => {
        active = false;
      };
    }

    async function checkPermission() {
      try {
        const response =
          await toolReplacementService.getReplacementRequests({
            company_id: companyId,
            scope: "EXECUTION_QUEUE",
            status: "APPROVED",
            limit: 1,
            offset: 0
          });

        if (active) {
          setCanExecute(response?.data?.success === true);
        }

      } catch {
        if (active) {
          setCanExecute(false);
        }
      }
    }

    checkPermission();

    return () => {
      active = false;
    };

  }, [companyId, reloadKey]);

  // Execution Queue displays APPROVED requests only.
  const effectiveStatus =
    scope === "EXECUTION_QUEUE" ? "APPROVED" : status;

  // ==========================================================
  // LOAD REQUESTS
  // ==========================================================

  useEffect(() => {
    let active = true;

    if (!companyId) {
      setRequests([]);
      setTotal(0);
      setListError("");

      return () => {
        active = false;
      };
    }

    async function load() {
      setLoading(true);
      setListError("");

      try {
        const response =
          await toolReplacementService.getReplacementRequests({
            company_id: companyId,
            scope,
            status: effectiveStatus,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE
          });

        if (!active) return;

        const result = response?.data?.data || {};

        setRequests(
          Array.isArray(result.items) ? result.items : []
        );

        setTotal(
          Number(result.pagination?.total) || 0
        );

      } catch (error) {
        if (!active) return;

        setRequests([]);
        setTotal(0);
        setListError(errorMessage(error));

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };

  }, [companyId, scope, effectiveStatus, page, reloadKey]);

  // ==========================================================
  // REFRESH AND FILTERS
  // ==========================================================

  function refreshRequests() {
    setReloadKey(n => n + 1);
  }

  function changeScope(nextScope) {
    if (
      nextScope === "EXECUTION_QUEUE" &&
      !canExecute
    ) {
      return;
    }

    setScope(nextScope);
    setPage(0);
    setNotice(null);
  }

  function changeStatus(nextStatus) {
    setStatus(nextStatus);
    setPage(0);
  }

  // ==========================================================
  // HISTORY
  // ==========================================================

  async function openHistory(request) {
    if (!companyId || !request?.request_id) return;

    setHistoryRequest(request);
    setHistoryEvents([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const response =
        await toolReplacementService.getReplacementRequestEvents(
          request.request_id,
          companyId
        );

      const events = response?.data?.data?.events;

      setHistoryEvents(
        Array.isArray(events) ? events : []
      );

    } catch (error) {
      setHistoryError(errorMessage(error));

    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    if (historyLoading) return;

    setHistoryRequest(null);
    setHistoryEvents([]);
    setHistoryError("");
  }

  // ==========================================================
  // APPROVE AND REJECT
  // ==========================================================

  function openDecision(request, action) {
    if (
      scope !== "ASSIGNED_TO_ME" ||
      request?.status !== "REQUESTED"
    ) {
      return;
    }

    try {
      setDecision({
        request,
        action,
        idempotencyKey:
          toolReplacementService.createReplacementIdempotencyKey()
      });

      setDecisionRemarks("");
      setDecisionError("");

    } catch (error) {
      setNotice({
        variant: "danger",
        message: errorMessage(error)
      });
    }
  }

  function closeDecision() {
    if (submitting) return;

    setDecision(null);
    setDecisionRemarks("");
    setDecisionError("");
  }

  async function submitDecision(event) {
    event.preventDefault();

    if (!decision || submitting) return;

    const remarks = decisionRemarks.trim();

    if (
      decision.action === "REJECT" &&
      !remarks
    ) {
      setDecisionError("Rejection remarks are required.");
      return;
    }

    setSubmitting(true);
    setDecisionError("");

    try {
      const requestId = decision.request.request_id;

      const body = {
        idempotency_key: decision.idempotencyKey
      };

      if (remarks) {
        body.remarks = remarks;
      }

      const response =
        decision.action === "APPROVE"
          ? await toolReplacementService.approveToolReplacement(
              requestId,
              body
            )
          : await toolReplacementService.rejectToolReplacement(
              requestId,
              { ...body, remarks }
            );

      setNotice({
        variant: "success",
        message:
          response?.data?.message ||
          "Replacement decision recorded successfully."
      });

      setDecision(null);
      setDecisionRemarks("");

      refreshRequests();

      if (typeof onChanged === "function") {
        onChanged(response?.data?.data);
      }

    } catch (error) {
      setDecisionError(errorMessage(error));

    } finally {
      setSubmitting(false);
    }
  }

  // ==========================================================
  // EXECUTION
  // ==========================================================

  function openExecution(request) {
    if (
      scope !== "EXECUTION_QUEUE" ||
      !canExecute ||
      !request?.request_id ||
      request.status !== "APPROVED"
    ) {
      return;
    }

    setExecutionTarget(request);
  }

  function handleExecuted(result) {
    setNotice({
      variant: "success",
      message:
        "Tool Replacement executed successfully. " +
        "The old Tool Life was closed and a new lifecycle was created."
    });

    refreshRequests();

    if (typeof onChanged === "function") {
      onChanged(result);
    }
  }

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const visibleTotal = companyId ? total : 0;

  const pageCount =
    Math.ceil(visibleTotal / PAGE_SIZE);

  const canGoPrevious = page > 0;

  const canGoNext =
    (page + 1) * PAGE_SIZE < visibleTotal;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <Card className="border-0 shadow-sm mt-4">
        <Card.Body className="p-3 p-lg-4">

          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">
                Replacement Requests & Approvals
              </h5>

              <p className="text-muted small mb-0">
                Track requests, manage approvals, execute approved
                replacements and review audit history.
              </p>
            </div>

            <Button
              variant="outline-primary"
              size="sm"
              disabled={loading || !companyId}
              onClick={refreshRequests}
            >
              <ArrowClockwise className="me-2" />
              Refresh
            </Button>
          </div>

          {notice && (
            <Alert
              variant={notice.variant}
              dismissible
              onClose={() => setNotice(null)}
            >
              {notice.message}
            </Alert>
          )}

          {/* ================================================
              THREE TABS
          ================================================= */}

          <div className="d-flex flex-wrap gap-2 mb-4">

            <Button
              variant={
                scope === "MY_REQUESTS"
                  ? "primary"
                  : "outline-secondary"
              }
              onClick={() => changeScope("MY_REQUESTS")}
            >
              My Requests
            </Button>

            <Button
              variant={
                scope === "ASSIGNED_TO_ME"
                  ? "primary"
                  : "outline-secondary"
              }
              onClick={() => changeScope("ASSIGNED_TO_ME")}
            >
              Assigned Approvals
            </Button>

            {canExecute && (
              <Button
                variant={
                  scope === "EXECUTION_QUEUE"
                    ? "success"
                    : "outline-success"
                }
                onClick={() => changeScope("EXECUTION_QUEUE")}
              >
                <Tools className="me-2" />
                Execution Queue
              </Button>
            )}

          </div>

          {/* ================================================
              STATUS FILTER
          ================================================= */}

          <Row className="g-3 align-items-end mb-3">

            <Col xs={12} md={5} lg={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold">
                  Request Status
                </Form.Label>

                {scope === "EXECUTION_QUEUE" ? (
                  <Form.Control
                    value="Approved — Ready for Execution"
                    readOnly
                    disabled
                  />
                ) : (
                  <Form.Select
                    value={status}
                    onChange={e => changeStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>

            <Col xs={12} md={7} lg={8}>
              <div className="text-muted small">
                {scope === "MY_REQUESTS"
                  ? "Requests submitted by your logged-in account."
                  : scope === "ASSIGNED_TO_ME"
                    ? "Requests assigned to your logged-in account."
                    : "Approved replacements awaiting physical replacement and authorized execution."}
              </div>
            </Col>

          </Row>

          {listError && (
            <Alert variant="danger">
              {listError}
            </Alert>
          )}

          {!companyId && (
            <Alert variant="warning">
              Select a company to load Tool Replacement requests.
            </Alert>
          )}

          {/* ================================================
              REQUEST TABLE
          ================================================= */}

          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>REQUEST ID</th>
                  <th>TOOL NO.</th>
                  <th>REASON</th>
                  <th>TRIGGER</th>
                  <th>REQUESTED BY</th>
                  <th>APPROVER</th>
                  <th>REQUESTED AT</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>

                {!companyId ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-5 text-muted"
                    >
                      Please select a company.
                    </td>
                  </tr>

                ) : loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-5"
                    >
                      <Spinner
                        size="sm"
                        className="me-2"
                      />
                      Loading replacement requests...
                    </td>
                  </tr>

                ) : requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-5 text-muted"
                    >
                      No replacement requests found for the selected filters.
                    </td>
                  </tr>

                ) : requests.map(request => {

                  const canDecide =
                    scope === "ASSIGNED_TO_ME" &&
                    request.status === "REQUESTED";

                  const canOpenExecution =
                    scope === "EXECUTION_QUEUE" &&
                    canExecute &&
                    request.status === "APPROVED";

                  return (
                    <tr key={request.request_id}>

                      <td>
                        <span
                          className="fw-semibold"
                          title={request.request_id}
                        >
                          {shortRequestId(request.request_id)}
                        </span>
                      </td>

                      <td className="fw-semibold">
                        {request.tool_number || "—"}
                      </td>

                      <td>
                        {request.replacement_reason || "—"}
                      </td>

                      <td>
                        {request.change_trigger || "—"}
                      </td>

                      <td>
                        {formatUser(request.requested_by)}
                      </td>

                      <td>
                        {formatUser(request.approver_user_id)}
                      </td>

                      <td>
                        {formatDate(request.requested_at)}
                      </td>

                      <td>
                        <Badge bg={statusVariant(request.status)}>
                          {statusLabel(request.status)}
                        </Badge>
                      </td>

                      <td>
                        <div className="d-flex gap-2 flex-wrap">

                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openHistory(request)}
                          >
                            <Eye className="me-1" />
                            History
                          </Button>

                          {canDecide && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() =>
                                  openDecision(request, "APPROVE")
                                }
                              >
                                <CheckCircle className="me-1" />
                                Approve
                              </Button>

                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  openDecision(request, "REJECT")
                                }
                              >
                                <XCircle className="me-1" />
                                Reject
                              </Button>
                            </>
                          )}

                          {canOpenExecution && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => openExecution(request)}
                            >
                              <Tools className="me-1" />
                              Execute
                            </Button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}

              </tbody>
            </Table>
          </div>

          {/* ================================================
              PAGINATION
          ================================================= */}

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-3">

            <div className="small text-muted">
              Total Records: <strong>{visibleTotal}</strong>
              {visibleTotal > 0 && (
                <> · Page {page + 1} of {pageCount}</>
              )}
            </div>

            <div className="d-flex gap-2">

              <Button
                variant="outline-secondary"
                size="sm"
                disabled={loading || !canGoPrevious}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>

              <Button
                variant="outline-secondary"
                size="sm"
                disabled={loading || !canGoNext}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>

            </div>
          </div>

        </Card.Body>
      </Card>

      {/* ================================================
          AUDIT HISTORY MODAL
      ================================================= */}

      <Modal
        show={Boolean(historyRequest)}
        onHide={closeHistory}
        centered
        size="lg"
        backdrop={historyLoading ? "static" : true}
        keyboard={!historyLoading}
      >
        <Modal.Header closeButton={!historyLoading}>
          <Modal.Title>
            <ClockHistory className="me-2" />
            Replacement History
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>

          {historyRequest && (
            <div className="mb-3">
              <div className="small text-muted">
                Request ID
              </div>

              <div className="fw-semibold text-break">
                {historyRequest.request_id}
              </div>

              <div className="small text-muted mt-2">
                Tool: {historyRequest.tool_number || "—"}
                {" · "}
                {historyRequest.replacement_reason || "—"}
              </div>
            </div>
          )}

          {historyError && (
            <Alert variant="danger">
              {historyError}
            </Alert>
          )}

          {historyLoading ? (
            <div className="text-center py-5">
              <Spinner className="me-2" />
              Loading audit history...
            </div>

          ) : historyEvents.length === 0 ? (
            <p className="text-muted">
              No audit events available.
            </p>

          ) : (
            <div className="d-flex flex-column gap-3">

              {historyEvents.map(event => (
                <Card
                  key={event.tool_replacement_event_id}
                  className="border"
                >
                  <Card.Body>

                    <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
                      <Badge bg={statusVariant(event.event_type)}>
                        {statusLabel(event.event_type)}
                      </Badge>

                      <span className="small text-muted">
                        {formatDate(event.event_ts)}
                      </span>
                    </div>

                    <div className="small mb-2">
                      <strong>Performed By:</strong>
                      {" "}
                      {eventActor(event)}
                    </div>

                    {eventRemarks(event) && (
                      <div className="small">
                        <strong>Remarks:</strong>
                        {" "}
                        {eventRemarks(event)}
                      </div>
                    )}

                    {event.new_tool_life_result_id && (
                      <div className="small text-muted mt-2 text-break">
                        New Tool Life ID:
                        {" "}
                        {event.new_tool_life_result_id}
                      </div>
                    )}

                  </Card.Body>
                </Card>
              ))}

            </div>
          )}

        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeHistory}
            disabled={historyLoading}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================================================
          APPROVAL / REJECTION MODAL
      ================================================= */}

      <Modal
        show={Boolean(decision)}
        onHide={closeDecision}
        centered
        backdrop={submitting ? "static" : true}
        keyboard={!submitting}
      >
        <Modal.Header closeButton={!submitting}>
          <Modal.Title>
            {decision?.action === "APPROVE"
              ? "Approve Tool Replacement"
              : "Reject Tool Replacement"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={submitDecision}>

          <Modal.Body>

            {decision && (
              <div className="mb-3">

                <div className="fw-semibold">
                  Tool: {decision.request.tool_number}
                </div>

                <div className="small text-muted text-break">
                  Request ID: {decision.request.request_id}
                </div>

                <div className="small text-muted mt-1">
                  Reason: {decision.request.replacement_reason}
                </div>

              </div>
            )}

            <Alert variant="info">
              {decision?.action === "APPROVE"
                ? "Approval will be recorded against this request. Tool Life will not reset until authorized execution."
                : "Rejection will close the pending request without changing the installed tool's life."}
            </Alert>

            {decisionError && (
              <Alert variant="danger">
                {decisionError}
              </Alert>
            )}

            <Form.Group>
              <Form.Label className="fw-semibold">
                Decision Remarks
                {" "}
                {decision?.action === "REJECT" && (
                  <span className="text-danger">*</span>
                )}
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={4}
                maxLength={1000}
                value={decisionRemarks}
                disabled={submitting}
                placeholder={
                  decision?.action === "REJECT"
                    ? "Enter the reason for rejection..."
                    : "Optional approval remarks..."
                }
                required={decision?.action === "REJECT"}
                onChange={e => {
                  setDecisionRemarks(e.target.value);
                  setDecisionError("");
                }}
              />
            </Form.Group>

          </Modal.Body>

          <Modal.Footer>

            <Button
              variant="outline-secondary"
              onClick={closeDecision}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              variant={
                decision?.action === "APPROVE"
                  ? "success"
                  : "danger"
              }
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                decision?.action === "APPROVE"
                  ? "Confirm Approval"
                  : "Confirm Rejection"
              )}
            </Button>

          </Modal.Footer>
        </Form>
      </Modal>

      {/* ================================================
          EXECUTION MODAL
      ================================================= */}

      <ToolReplacementExecuteModal
        show={Boolean(executionTarget)}
        request={executionTarget}
        onClose={() => setExecutionTarget(null)}
        onExecuted={handleExecuted}
      />

    </>
  );
}
