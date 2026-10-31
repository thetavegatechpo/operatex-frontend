import React, { useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    Modal,
    Row,
    Spinner,
    Table,
    Tab,
    Tabs, 
    Toast,
    ToastContainer
} from "react-bootstrap";
import PageHeader from "../../../../shared/components/PageHeader.jsx";
import inspectionService from "../api/inprocessInspectionService.js";
import machineService from "../../../master-data/machine-master/api/machine.service.js";
import partService from "../../../master-data/part-master/api/part.service.js";
import processService from "../../../master-data/process-master/api/process.service.js";
import shiftService from "../../../enterprise-setup/shift-calendar/api/shift.service.js";
import api from "../../../../shared/api/client.js";

import {
    ClipboardData,
    ArrowRepeat,
    CheckCircle,
    ExclamationTriangle
} from "react-bootstrap-icons";
// =====================================================
// RESPONSE HELPERS
// =====================================================

function responseData(response) {
    if (response.data?.success === false) {
        throw new Error(response.data.message || "Request failed");
    }

    return response.data?.data;
}

function responseRows(response, label) {
    const data = responseData(response);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.items)) return data.items;

    throw new Error(
        `${label}: expected an array in the API response`
    );
}

function errorMessage(error) {
    return (
        error.response?.data?.message ||
        error.message ||
        "Request failed"
    );
}

function nullable(value) {
    return value === "" || value === undefined ? null : value;
}

function localDateTime(value = new Date()) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const adjusted = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    );

    return adjusted.toISOString().slice(0, 16);
}

function displayDate(value) {
    if (!value) return "—";

    // business_date represents a calendar date.
    return String(value).slice(0, 10);
}

function activeRows(rows) {
    return rows.filter(row => {
        if (row.is_active === false) return false;

        return (
            !row.status ||
            String(row.status).toUpperCase() === "ACTIVE"
        );
    });
}

function StatusBadge({ value }) {
    const colors = {
        ACTIVE: "success",
        INACTIVE: "secondary",
        RUNNING: "primary",
        SUBMITTED: "success",
        CANCELLED: "secondary",
        OK: "success",
        NOK: "danger",
        PENDING: "warning",
        APPROVED: "success",
        REJECTED: "danger",
        NOT_REQUIRED: "secondary"
    };

    if (!value) return <span>—</span>;

    return (
        <Badge bg={colors[value] || "secondary"}>
            {String(value).replaceAll("_", " ")}
        </Badge>
    );
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function InProcessInspection() {
    const [tab, setTab] = useState("runs");

    const [templates, setTemplates] = useState([]);
    const [plans, setPlans] = useState([]);
    const [runs, setRuns] = useState([]);
    const [reports, setReports] = useState([]);

    const [machines, setMachines] = useState([]);
    const [parts, setParts] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [workflows, setWorkflows] = useState([]);

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "success"
});

function showPopup(message, variant = "success") {
    setToast(previous => ({
        id: (previous.id || 0) + 1,
        show: true,
        message,
        variant
    }));
}

    // Configuration form modal.
    const [formType, setFormType] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({});
    // Which saved templates contain checkpoints?
const [readyTemplateIds, setReadyTemplateIds] = useState([]);
const [checkingTemplates, setCheckingTemplates] = useState(true);
const [checkpointRefresh, setCheckpointRefresh] = useState(0);
const [readinessError, setReadinessError] = useState("");
    // Checkpoint modal.
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [steps, setSteps] = useState([]);
    const [stepsOpen, setStepsOpen] = useState(false);
    const [stepsLoading, setStepsLoading] = useState(false);

    // Inspection answers modal.
    const [runOpen, setRunOpen] = useState(false);
    const [currentRun, setCurrentRun] = useState(null);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [runSteps, setRunSteps] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [answers, setAnswers] = useState({});

    // Approval modal.
    const [approvalTask, setApprovalTask] = useState(null);
    const [decision, setDecision] = useState("APPROVED");
    const [remarks, setRemarks] = useState("");

    // Confirmation modal.
    const [confirmation, setConfirmation] = useState(null);

    // Run/report pagination.
    const pageSize = 20;
    const [runOffset, setRunOffset] = useState(0);
    const [reportOffset, setReportOffset] = useState(0);

    const [reportFilters, setReportFilters] = useState({
        from: "",
        to: "",
        machine_id: "",
        result_status: ""
    });

    const [appliedReportFilters, setAppliedReportFilters] =
        useState({});
    // =====================================================
// INSPECTION SUMMARY
// =====================================================

const [summary, setSummary] = useState({
    total: 0,
    running: 0,
    submittedOK: 0,
    submittedNOK: 0
});

const [summaryLoading, setSummaryLoading] = useState(true);
const [summaryError, setSummaryError] = useState("");
    // =================================================
    // LOOKUP HELPERS
    // =================================================

    function lookup(rows, idField, id, nameField) {
        return (
            rows.find(row => row[idField] === id)?.[nameField] ||
            "Name unavailable"
        );
    }

    function machineName(id) {
        return lookup(machines, "machine_id", id, "machine_name");
    }

    function partName(id) {
        if (!id) return "All parts";

        return lookup(parts, "part_id", id, "part_name");
    }

    function processName(id) {
        if (!id) return "All processes";

        return lookup(processes, "process_id", id, "process_name");
    }

    function templateName(id) {
        return lookup(
            templates,
            "inspection_template_id",
            id,
            "template_name"
        );
    }

    function shiftName(id) {
        return (
            shifts.find(row => Number(row.shift_id) === Number(id))
                ?.shift_name || "Name unavailable"
        );
    }

    function changeForm(field, value) {
        setForm(previous => ({
            ...previous,
            [field]: value
        }));
    }
        
    function generateTemplateCode() {
    return `IP_${crypto.randomUUID().replaceAll("-", "")}`;
}
    // =================================================
    // LOAD DATA
    // =================================================

    async function loadRuns(offset = runOffset) {
        const response = await inspectionService.getRuns({
            limit: pageSize,
            offset
        });

        setRuns(responseRows(response, "Inspection runs"));
    }

    async function loadReports(
        filters = appliedReportFilters,
        offset = reportOffset
    ) {
        const response = await inspectionService.getReport({
            ...filters,
            limit: pageSize,
            offset
        });

        setReports(responseRows(response, "Inspection report"));
    }

    async function loadConfiguration() {
        const results = await Promise.allSettled([
            inspectionService.getTemplates(true),
            inspectionService.getPlans(true),
            machineService.getMaster(),
            partService.getMaster(),
            processService.getMaster(),
            shiftService.getMaster(),
            api.get("/setup-approval/workflow", {
                params: { includeInactive: false }
            })
        ]);

        const targets = [
            ["Templates", setTemplates],
            ["Quality plans", setPlans],
            ["Machines", setMachines],
            ["Parts", setParts],
            ["Processes", setProcesses],
            ["Shifts", setShifts],
            ["Approval workflows", setWorkflows]
        ];

        const failures = [];

        results.forEach((result, index) => {
            const [label, setter] = targets[index];

            try {
                if (result.status === "rejected") {
                    throw result.reason;
                }

                setter(responseRows(result.value, label));
            } catch (loadError) {
                failures.push(`${label}: ${errorMessage(loadError)}`);
            }
        });

        if (failures.length) {
            throw new Error(failures.join(" | "));
        }
    }

    async function initialize() {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled([
            loadConfiguration(),
            loadRuns(0)
        ]);

        const failures = results
            .filter(result => result.status === "rejected")
            .map(result => errorMessage(result.reason));

        if (failures.length) {
            setError(failures.join(" | "));
        }

        setLoading(false);
    }
    useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
        setSummaryLoading(true);
        setSummaryError("");

        try {
            const counts = {
                total: 0,
                running: 0,
                submittedOK: 0,
                submittedNOK: 0
            };

            const limit = 200;
            let offset = 0;

            while (true) {
                const response = await inspectionService.getRuns({
                    limit,
                    offset
                });

                const rows = responseRows(
                    response,
                    "Inspection summary"
                );

                if (cancelled) return;

                rows.forEach(row => {
                    counts.total += 1;

                    if (row.status === "RUNNING") {
                        counts.running += 1;
                    }

                    if (
                        row.status === "SUBMITTED" &&
                        row.result_status === "OK"
                    ) {
                        counts.submittedOK += 1;
                    }

                    if (
                        row.status === "SUBMITTED" &&
                        row.result_status === "NOK"
                    ) {
                        counts.submittedNOK += 1;
                    }
                });

                if (rows.length < limit) break;

                offset += limit;
            }

            if (!cancelled) {
                setSummary(counts);
            }
        } catch (error) {
            if (!cancelled) {
                setSummaryError(errorMessage(error));
            }
        } finally {
            if (!cancelled) {
                setSummaryLoading(false);
            }
        }
    }

    loadSummary();

    return () => {
        cancelled = true;
    };
}, [runs]);
useEffect(() => {
    let cancelled = false;

    async function checkTemplateReadiness() {
        setCheckingTemplates(true);
        setReadinessError("");
        setReadyTemplateIds([]);

        try {
            const activeTemplates = templates.filter(
                template => template.is_active === true
            );

            const results = await Promise.allSettled(
                activeTemplates.map(async template => {
                    const response = await inspectionService.getSteps(
                        template.inspection_template_id
                    );

                    const checkpoints = responseRows(
                        response,
                        "Checklist checkpoints"
                    );

                    return checkpoints.length > 0
                        ? template.inspection_template_id
                        : null;
                })
            );

            if (cancelled) return;

            const failed = results.some(
                result => result.status === "rejected"
            );

            if (failed) {
                throw new Error(
                    "Checklist readiness could not be checked. Please refresh."
                );
            }

            setReadyTemplateIds(
                results.map(result => result.value).filter(Boolean)
            );
        } catch (error) {
            if (!cancelled) {
                setReadinessError(errorMessage(error));
            }
        } finally {
            if (!cancelled) {
                setCheckingTemplates(false);
            }
        }
    }

    checkTemplateReadiness();

    return () => {
        cancelled = true;
    };
}, [templates, checkpointRefresh]);

    useEffect(() => {
        initialize();
    }, []);

    // All mutations use this helper.
  async function perform(action, successMessage = "") {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
        await action();

        const silentMessages = [
            "Report loaded.",
            "Inspections loaded.",
            "Inspection loaded."
        ];

        if (
            successMessage &&
            !silentMessages.includes(successMessage)
        ) {
            showPopup(successMessage);
        }
    } catch (actionError) {
        const message = errorMessage(actionError);

        // Keep form errors available beside the fields.
        setError(message);
        showPopup(message, "danger");
    } finally {
        setBusy(false);
    }
}

    // =================================================
    // OPEN CONFIGURATION FORMS
    // =================================================

    function openForm(type, row = null) {
       if (type === "plan" && !row && !canCreatePlan) {
    // ...
}


       
        setError("");
        setEditingId(null);

        if (type === "template") {
            setEditingId(row?.inspection_template_id || null);

            setForm({
                template_code: row?.template_code || generateTemplateCode(),
                template_name: row?.template_name || "",
                version_no: row?.version_no || 1,
                is_active: row?.is_active ?? true,
                effective_from: localDateTime(
                    row?.effective_from || new Date()
                ),
                effective_to: row?.effective_to
                    ? localDateTime(row.effective_to)
                    : ""
            });
        }

        if (type === "plan") {
            setEditingId(row?.quality_plan_config_id || null);

            setForm({
                config_code: row?.config_code || "",
                machine_id: row?.machine_id || "",
                part_id: row?.part_id || "",
                process_id: row?.process_id || "",
                inspection_template_id:
                    row?.inspection_template_id || "",
                trigger_type: row?.trigger_type || "MANUAL",
                interval_minutes: row?.interval_minutes ?? "",
                every_n_parts: row?.every_n_parts ?? "",
                sample_size: row?.sample_size || 1,
                approval_workflow_config_id:
                    row?.approval_workflow_config_id || "",
                version_no: row?.version_no || 1,
                is_active: row?.is_active ?? true,
                effective_from: localDateTime(
                    row?.effective_from || new Date()
                ),
                effective_to: row?.effective_to
                    ? localDateTime(row.effective_to)
                    : ""
            });
        }

        if (type === "step") {
            setEditingId(row?.inspection_step_id || null);

            setForm({
                check_point: row?.check_point || "",
                specification: row?.specification || "",
                checking_method: row?.checking_method || "",
                value_type: row?.value_type || "NUMBER",
                expected_boolean: String(
                    row?.expected_boolean ?? true
                ),
                lower_limit: row?.lower_limit ?? "",
                upper_limit: row?.upper_limit ?? "",
                unit: row?.unit || "",
                is_mandatory: row?.is_mandatory ?? true,
                action_after_abnormality:
                    row?.action_after_abnormality || "",
                special_characteristic:
                    row?.special_characteristic || ""
            });
        }

        if (type === "start") {
            setForm({
                machine_id: "",
                shift_id: "",
                part_id: "",
                process_id: "",
                idempotency_key: crypto.randomUUID()
            });
        }

        setFormType(type);
    }
      
   
    // =================================================
    // SAVE CONFIGURATION
    // =================================================

    function revisionPayload() {
        return {
            version_no: Number(form.version_no),
            is_active: form.is_active,
            effective_from: new Date(
                form.effective_from
            ).toISOString(),
            effective_to: form.effective_to
                ? new Date(form.effective_to).toISOString()
                : null
        };
    }

    async function saveForm(event) {
        event.preventDefault();

        await perform(async () => {
            if (formType === "template") {
                const payload = {
                    template_code: form.template_code.trim(),
                    template_name: form.template_name.trim(),
                    ...revisionPayload()
                };

                const response = editingId
                    ? await inspectionService.updateTemplate(
                        editingId,
                        payload
                    )
                    : await inspectionService.createTemplate(payload);

                responseData(response);
            }

            if (formType === "plan") {
                const payload = {
                    config_code: form.config_code.trim(),
                    machine_id: form.machine_id,
                    part_id: nullable(form.part_id),
                    process_id: nullable(form.process_id),
                    inspection_template_id:
                        form.inspection_template_id,
                    trigger_type: form.trigger_type,
                    interval_minutes:
                        form.trigger_type === "INTERVAL"
                            ? Number(form.interval_minutes)
                            : null,
                    every_n_parts:
                        form.trigger_type === "PART_COUNT"
                            ? Number(form.every_n_parts)
                            : null,
                    sample_size: Number(form.sample_size),
                    approval_workflow_config_id: nullable(
                        form.approval_workflow_config_id
                    ),
                    ...revisionPayload()
                };

                const response = editingId
                    ? await inspectionService.updatePlan(
                        editingId,
                        payload
                    )
                    : await inspectionService.createPlan(payload);

                responseData(response);
            }

            if (formType === "step") {
                const isNumber = form.value_type === "NUMBER";

                const payload = {
                    check_point: form.check_point.trim(),
                    specification: nullable(form.specification),
                    checking_method: nullable(form.checking_method),
                    value_type: form.value_type,
                    expected_boolean:
                        form.value_type === "BOOLEAN"
                            ? form.expected_boolean === "true"
                            : null,
                    lower_limit:
                        isNumber && form.lower_limit !== ""
                            ? Number(form.lower_limit)
                            : null,
                    upper_limit:
                        isNumber && form.upper_limit !== ""
                            ? Number(form.upper_limit)
                            : null,
                    unit: isNumber ? form.unit.trim() : null,
                    is_mandatory: form.is_mandatory,
                    action_after_abnormality: nullable(
                        form.action_after_abnormality
                    ),
                    special_characteristic: nullable(
                        form.special_characteristic
                    )
                };

                const templateId =
                    selectedTemplate.inspection_template_id;

                const response = editingId
                    ? await inspectionService.updateStep(
                        templateId,
                        editingId,
                        payload
                    )
                    : await inspectionService.createStep(
                        templateId,
                        payload
                    );

                responseData(response);
                await loadSteps(selectedTemplate);
            }

            if (formType === "start") {
                const response = await inspectionService.startRun({
    quality_plan_config_id: form.quality_plan_config_id,
    machine_id: form.machine_id,
    shift_id: Number(form.shift_id),
    part_id: nullable(form.part_id),
    process_id: nullable(form.process_id),
    plan_entry_id: null,
    idempotency_key: form.idempotency_key
});

                const run = responseData(response);

                setFormType("");
                setTab("runs");
                setRunOffset(0);
                await loadRuns(0);
                await openRun(run.inspection_result_id);
                return;
            }

            setFormType("");

            if (formType !== "step") {
                await loadConfiguration();
            }
        }, formType === "start"
            ? "Inspection started."
            : "Saved successfully."
        );
    }

    // =================================================
    // CHECKPOINTS
    // =================================================

    async function loadSteps(template) {
        const response = await inspectionService.getSteps(
            template.inspection_template_id
        );

        setSteps(responseRows(response, "Checkpoints"));
        setCheckpointRefresh(previous => previous + 1);
    }

    async function openSteps(template) {
        setSelectedTemplate(template);
        setSteps([]);
        setStepsOpen(true);
        setStepsLoading(true);
        setError("");

        try {
            await loadSteps(template);
        } catch (loadError) {
            setError(errorMessage(loadError));
        } finally {
            setStepsLoading(false);
        }
    }

    // =================================================
    // DELETE / DEACTIVATE
    // =================================================

    function requestDelete(type, row) {
        setConfirmation({
            title: "Delete record?",
            message:
                "Unused configuration can be deleted. Used configuration " +
                "may be deactivated or protected by the backend.",
            action: async () => {
                let response;

                if (type === "template") {
                    response = await inspectionService.deleteTemplate(
                        row.inspection_template_id
                    );
                }

                if (type === "plan") {
                    response = await inspectionService.deletePlan(
                        row.quality_plan_config_id
                    );
                }

                if (type === "step") {
                    response = await inspectionService.deleteStep(
                        selectedTemplate.inspection_template_id,
                        row.inspection_step_id
                    );
                }

                responseData(response);

                if (type === "step") {
                    await loadSteps(selectedTemplate);
                } else {
                    await loadConfiguration();
                }
            }
        });
    }

    // =================================================
    // INSPECTION ANSWERS
    // =================================================

    async function openRun(runId) {
        const response = await inspectionService.getRun(runId);
        const data = responseData(response);

        // Supports either a nested run or an enriched run object.
        const run = data?.run || data?.inspection || data;

        if (!run?.inspection_result_id) {
            throw new Error(
                "Inspection detail response is missing inspection_result_id"
            );
        }

        const plan = plans.find(
            item =>
                item.quality_plan_config_id ===
                run.quality_plan_config_id
        );

        if (!plan) {
            throw new Error(
                "Quality plan is unavailable. Refresh the page and retry."
            );
        }

        let checkpointRows = data.steps;

        if (!Array.isArray(checkpointRows)) {
            checkpointRows = responseRows(
                await inspectionService.getSteps(
                    run.inspection_template_id
                ),
                "Inspection checkpoints"
            );
        }

        const initialAnswers = {};

        (run.results || []).forEach(answer => {
            initialAnswers[
                `${answer.sample_no}:${answer.inspection_step_id}`
            ] = {
                value:
                    answer.numeric_value ??
                    (
                        answer.boolean_value === undefined ||
                        answer.boolean_value === null
                            ? answer.text_value ?? ""
                            : String(answer.boolean_value)
                    ),
                remarks: answer.remarks || "",
                result_status: answer.result_status || ""
            };
        });

        setCurrentRun(run);
        setCurrentPlan(plan);
        setRunSteps(checkpointRows);
        setApprovals(
            Array.isArray(data.approvals) ? data.approvals : []
        );
        setAnswers(initialAnswers);
        setRunOpen(true);
    }

    function updateAnswer(key, field, value) {
        setAnswers(previous => ({
            ...previous,
            [key]: {
                ...previous[key],
                [field]: value
            }
        }));
    }

    function answerPayload() {
        const results = [];

        for (
            let sampleNo = 1;
            sampleNo <= Number(currentPlan.sample_size);
            sampleNo++
        ) {
            runSteps.forEach(step => {
                const key =
                    `${sampleNo}:${step.inspection_step_id}`;

                const answer = answers[key] || {};

                // Missing answers stay missing; they are not NOK.
                if (
                    answer.value === "" ||
                    answer.value === undefined ||
                    answer.value === null
                ) {
                    return;
                }

                const item = {
                    sample_no: sampleNo,
                    inspection_step_id: step.inspection_step_id,
                    remarks: nullable(answer.remarks?.trim())
                };

                if (step.value_type === "NUMBER") {
                    item.numeric_value = Number(answer.value);
                }

                if (step.value_type === "BOOLEAN") {
                    item.boolean_value =
                        answer.value === "true" ||
                        answer.value === true;
                }

                if (step.value_type === "TEXT") {
                    item.text_value = String(answer.value).trim();
                    item.result_status = answer.result_status;
                }

                results.push(item);
            });
        }

        return { results };
    }

    async function saveDraft() {
        await perform(async () => {
            responseData(
                await inspectionService.saveAnswers(
                    currentRun.inspection_result_id,
                    answerPayload()
                )
            );

            await openRun(currentRun.inspection_result_id);
            await loadRuns();
        }, "Draft measurements saved.");
    }
    function getSubmissionProblem() {
    if (!currentRun || !currentPlan) {
        return "Open an inspection first.";
    }

    if (!runSteps.length) {
        return "This checklist has no checking points.";
    }

    const payload = answerPayload();

    for (
        let sample = 1;
        sample <= Number(currentPlan.sample_size);
        sample++
    ) {
        const sampleAnswers = payload.results.filter(
            answer => answer.sample_no === sample
        );

        if (!sampleAnswers.length) {
            return `Enter measurements for Sample ${sample}.`;
        }

        for (const step of runSteps) {
            const answer = sampleAnswers.find(
                item =>
                    item.inspection_step_id ===
                    step.inspection_step_id
            );

            if (!answer) {
                if (step.is_mandatory) {
                    return `Sample ${sample}: complete "${step.check_point}".`;
                }

                continue;
            }

            let failed = false;

            if (step.value_type === "NUMBER") {
                const value = answer.numeric_value;

                if (!Number.isFinite(value)) {
                    return `Sample ${sample}: enter a valid measurement.`;
                }

                failed =
                    (
                        step.lower_limit !== null &&
                        step.lower_limit !== undefined &&
                        value < Number(step.lower_limit)
                    ) ||
                    (
                        step.upper_limit !== null &&
                        step.upper_limit !== undefined &&
                        value > Number(step.upper_limit)
                    );
            }

            if (step.value_type === "BOOLEAN") {
                failed =
                    answer.boolean_value !== step.expected_boolean;
            }

            if (step.value_type === "TEXT") {
                if (!answer.text_value?.trim()) {
                    return `Sample ${sample}: enter an observation.`;
                }

                if (
                    !["OK", "NOK"].includes(answer.result_status)
                ) {
                    return `Sample ${sample}: select OK or NOK.`;
                }

                failed = answer.result_status === "NOK";
            }

            if (failed && !answer.remarks?.trim()) {
                return `Sample ${sample}: add remarks for "${step.check_point}".`;
            }
        }
    }

    return "";
}


    function requestSubmit() {
        // Capture the measurements being confirmed.

        const problem = getSubmissionProblem();

if (problem) {
    showPopup(problem, "danger");
    return;
}
        const payload = answerPayload();
        const runId = currentRun.inspection_result_id;

        setConfirmation({
            title: "Submit inspection?",
            message:
                "Submitted measurements cannot be edited. " +
                "Check all samples before continuing.",
            action: async () => {
                responseData(
                    await inspectionService.submitRun(
                        runId,
                        payload
                    )
                );

                await openRun(runId);
                await loadRuns();
            }
        });
    }

    function requestCancel(row) {
        setConfirmation({
            title: "Cancel inspection?",
            message:
                "This running inspection will be marked CANCELLED.",
            action: async () => {
                responseData(
                    await inspectionService.cancelRun(
                        row.inspection_result_id
                    )
                );

                await loadRuns();

                if (
                    currentRun?.inspection_result_id ===
                    row.inspection_result_id
                ) {
                    await openRun(row.inspection_result_id);
                }
            }
        });
    }

    // =================================================
    // APPROVAL
    // Backend enforces roles and stage order.
    // =================================================

    async function saveDecision(event) {
        event.preventDefault();

        await perform(async () => {
            responseData(
                await inspectionService.decideApproval(
                    approvalTask.approval_event_id,
                    {
                        decision,
                        remarks: nullable(remarks.trim())
                    }
                )
            );

            setApprovalTask(null);
            await openRun(currentRun.inspection_result_id);
            await loadRuns();
        }, "Approval decision saved.");
    }
// =====================================================
// AVAILABLE MANUAL PLANS FOR A MACHINE
// =====================================================

function getManualPlans(machineId) {
    const now = Date.now();

    function isEffective(record) {
        return (
            record?.is_active === true &&
            new Date(record.effective_from).getTime() <= now &&
            (
                !record.effective_to ||
                now < new Date(record.effective_to).getTime()
            )
        );
    }

    return plans.filter(plan => {
        const template = templates.find(
            item =>
                item.inspection_template_id ===
                plan.inspection_template_id
        );

        const workflow = workflows.find(
            item =>
                item.approval_workflow_config_id ===
                plan.approval_workflow_config_id
        );

        return (
            plan.machine_id === machineId &&
            plan.trigger_type === "MANUAL" &&
            isEffective(plan) &&
            isEffective(template) &&
            readyTemplateIds.includes(plan.inspection_template_id) &&
            (
                !plan.approval_workflow_config_id ||
                isEffective(workflow)
            )
        );
    });
}

// =====================================================
// READABLE PLAN NAME
// =====================================================

function startPlanLabel(plan) {
    const part = plan.part_id
        ? partName(plan.part_id)
        : "All parts";

    const process = plan.process_id
        ? processName(plan.process_id)
        : "All processes";

    const template =
        plan.template_name ||
        templateName(plan.inspection_template_id);

    return [
        part,
        process,
        template,
        `v${plan.version_no}`
    ].join(" · ");
}

// =====================================================
// MACHINE / QUALITY PLAN SELECTION
// =====================================================

function fillInspectionContext(machineId, selectedPlanId = "") {
    setError("");

    const availablePlans = getManualPlans(machineId);

    // Automatically choose only when exactly one plan exists.
    const plan = selectedPlanId
        ? availablePlans.find(
            item =>
                item.quality_plan_config_id === selectedPlanId
        )
        : availablePlans.length === 1
            ? availablePlans[0]
            : null;

    // Clear previous context when machine/plan changes.
    if (!plan) {
        setForm(previous => ({
            ...previous,
            machine_id: machineId,
            quality_plan_config_id: "",
            part_id: "",
            process_id: "",
            shift_id: "",
            context_ready: false
        }));

        if (machineId && availablePlans.length === 0) {
            setError(
                "No active, effective Manual plan with checkpoints is available for this machine."
            );
        } else if (selectedPlanId) {
            setError(
                "This quality plan is no longer available. Refresh and select again."
            );
        }

        // Multiple choices are handled by the dropdown.
        return;
    }

    const machine = machines.find(
        item => item.machine_id === machineId
    );

    const now = new Date();

    // Matches your current company's timezone.
    const timeParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    }).formatToParts(now);

    function timeValue(type) {
        return Number(
            timeParts.find(item => item.type === type)?.value || 0
        );
    }

    const currentSeconds =
        timeValue("hour") * 3600 +
        timeValue("minute") * 60 +
        timeValue("second");

    function seconds(value) {
        if (!value) return NaN;

        const [hours, minutes, secs = 0] =
            String(value).split(":").map(Number);

        return hours * 3600 + minutes * 60 + secs;
    }

    const matchingShifts = shifts.filter(shift => {
        if (shift.status !== "ACTIVE") return false;

        if (
            shift.line_id &&
            shift.line_id !== machine?.line_id
        ) {
            return false;
        }

        const start = seconds(shift.shift_start_time);
        const end = seconds(shift.shift_end_time);

        if (!Number.isFinite(start) || !Number.isFinite(end)) {
            return false;
        }

        if (start < end) {
            return currentSeconds >= start && currentSeconds < end;
        }

        if (start > end) {
            return currentSeconds >= start || currentSeconds < end;
        }

        return false;
    });

    const shift = matchingShifts.length === 1
        ? matchingShifts[0]
        : null;

    setForm(previous => ({
        ...previous,
        machine_id: machineId,
        quality_plan_config_id: plan.quality_plan_config_id,
        part_id: plan.part_id || "",
        process_id: plan.process_id || "",
        shift_id: shift ? String(shift.shift_id) : "",
        context_ready: Boolean(machine && shift),

        idempotency_key:
            globalThis.crypto?.randomUUID?.() ||
            `IP_${Date.now()}_${Math.random().toString(36).slice(2)}`
    }));

    if (!machine) {
        setError("The selected machine could not be found.");
    } else if (!shift) {
        setError(
            matchingShifts.length > 1
                ? "Multiple shifts match. Check the shift configuration."
                : "No active shift matches this machine and the current time."
        );
    }
}
    // =================================================
    // REPORT AND CSV
    // =================================================

    async function filterReport(event) {
        event.preventDefault();

        const filters = Object.fromEntries(
            Object.entries(reportFilters)
                .filter(([, value]) => value !== "")
        );

        await perform(async () => {
            await loadReports(filters, 0);
            setAppliedReportFilters(filters);
            setReportOffset(0);
        }, "Report loaded.");
    }

    async function exportCsv() {
        await perform(async () => {
            const allRows = [];
            const batchSize = 200;
            let offset = 0;

            // Download all matching pages, not just the visible page.
            while (true) {
                const response = await inspectionService.getReport({
                    ...appliedReportFilters,
                    limit: batchSize,
                    offset
                });

                const batch = responseRows(
                    response,
                    "Inspection report"
                );

                allRows.push(...batch);

                if (batch.length < batchSize) break;
                offset += batchSize;
            }

            if (!allRows.length) {
                throw new Error("No report records to export.");
            }

            const columns = [
                "Date",
                "Machine",
                "Part",
                "Process",
                "Shift",
                "Template",
                "Status",
                "Result",
                "Approval",
                "Submitted at"
            ];

            function csvCell(value) {
                let text = String(value ?? "");

                // Prevent spreadsheet formula execution.
                if (/^\s*[=+\-@]/.test(text)) {
                    text = `'${text}`;
                }

                return `"${text.replaceAll('"', '""')}"`;
            }

            const records = allRows.map(row => [
                displayDate(row.business_date),
                row.machine_name || machineName(row.machine_id),
                row.part_name || partName(row.part_id),
                row.process_name || processName(row.process_id),
                row.shift_name || shiftName(row.shift_id),
                row.template_name ||
                    templateName(row.inspection_template_id),
                row.status,
                row.result_status || "",
                row.approval_status || "",
                row.submitted_at || ""
            ]);

            const csv = [columns, ...records]
                .map(record => record.map(csvCell).join(","))
                .join("\r\n");

            const url = URL.createObjectURL(
                new Blob(["\uFEFF", csv], {
                    type: "text/csv;charset=utf-8;"
                })
            );

            const link = document.createElement("a");
            link.href = url;
            link.download = "in-process-inspection-report.csv";

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, "CSV downloaded.");
    }

    // =================================================
    // SHARED FORM CONTROLS
    // =================================================

    function input(
        field,
        label,
        type = "text",
        required = false,
        extra = {}
    ) {
        return (
            <Form.Group className="mb-3">
                <Form.Label>
                    {label}{required ? " *" : ""}
                </Form.Label>

                <Form.Control
                    type={type}
                    value={form[field] ?? ""}
                    onChange={event =>
                        changeForm(field, event.target.value)
                    }
                    required={required}
                    {...extra}
                />
            </Form.Group>
        );
    }

    function select(
        field,
        label,
        options,
        required = false,
        placeholder = "Select"
    ) {
        return (
            <Form.Group className="mb-3">
                <Form.Label>
                    {label}{required ? " *" : ""}
                </Form.Label>

                <Form.Select
                    value={form[field] ?? ""}
                    onChange={event =>
                        changeForm(field, event.target.value)
                    }
                    required={required}
                >
                    <option value="">{placeholder}</option>

                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Form.Select>
            </Form.Group>
        );
    }

    function masterOptions(rows, idField, nameField, codeField) {
        return rows.map(row => ({
            value: row[idField],
            label:
                row[nameField] ||
                row[codeField] ||
                "Name unavailable"
        }));
    }

    function revisionFields() {
        return (
            <>
                <Row>
                    <Col md={4}>
                        {input(
                            "version_no",
                            "Version",
                            "number",
                            true,
                            { min: 1, step: 1 }
                        )}
                    </Col>

                    <Col md={8}>
                        {input(
                            "effective_from",
                            "Effective from",
                            "datetime-local",
                            true
                        )}
                    </Col>
                </Row>

                {input(
                    "effective_to",
                    "Effective until (optional)",
                    "datetime-local"
                )}

                <Form.Check
                    type="switch"
                    label="Active"
                    checked={form.is_active}
                    onChange={event =>
                        changeForm("is_active", event.target.checked)
                    }
                />
            </>
        );
    }

    function actionButtons(type, row) {
        return (
            <div className="d-flex gap-2">
                <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={busy}
                    onClick={() => openForm(type, row)}
                >
                    Edit
                </Button>

                <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={busy}
                    onClick={() => requestDelete(type, row)}
                    title="Delete or deactivate"
                    aria-label="Delete or deactivate"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
                    </svg>
                </Button>
            </div>
        );
    }

    function runTable(rows, report = false) {
        return (
            <Table responsive hover className="align-middle">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Machine</th>
                        <th>Template</th>
                        <th>Shift</th>
                        <th>Status</th>
                        <th>Result</th>
                        <th>Approval</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {!rows.length && (
                        <tr>
                            <td colSpan={8} className="text-center py-5">
                                No inspection records found.
                            </td>
                        </tr>
                    )}

                    {rows.map(row => (
                        <tr key={row.inspection_result_id}>
                            <td>{displayDate(row.business_date)}</td>
                            <td>
                                {row.machine_name ||
                                    machineName(row.machine_id)}
                            </td>
                            <td>
                                {row.template_name ||
                                    templateName(
                                        row.inspection_template_id
                                    )}
                            </td>
                            <td>
                                {row.shift_name ||
                                    shiftName(row.shift_id)}
                            </td>
                            <td><StatusBadge value={row.status} /></td>
                            <td>
                                <StatusBadge value={row.result_status} />
                            </td>
                            <td>
                                <StatusBadge value={row.approval_status} />
                            </td>
                            <td>
                                <div className="d-flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline-primary"
                                        disabled={busy}
                                        onClick={() =>
                                            perform(
                                                () => openRun(
                                                    row.inspection_result_id
                                                ),
                                                "Inspection loaded."
                                            )
                                        }
                                    >
                                        {row.status === "RUNNING"
                                            ? "Enter results"
                                            : "View"}
                                    </Button>

                                    {!report && row.status === "RUNNING" && (
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            disabled={busy}
                                            onClick={() => requestCancel(row)}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    }

    const machineOptions = masterOptions(
        activeRows(machines),
        "machine_id",
        "machine_name",
        "machine_code"
    );

    const partOptions = masterOptions(
        activeRows(parts),
        "part_id",
        "part_name",
        "part_code"
    );

    const processOptions = masterOptions(
        activeRows(processes),
        "process_id",
        "process_name",
        "process_code"
    );

    const shiftOptions = masterOptions(
        activeRows(shifts),
        "shift_id",
        "shift_name",
        "shift_no"
    );

   const templateOptions = masterOptions(
    activeRows(templates).filter(template =>
        readyTemplateIds.includes(
            template.inspection_template_id
        ) ||
        template.inspection_template_id ===
            form.inspection_template_id
    ),
    "inspection_template_id",
    "template_name",
    "template_code"
);
    const workflowOptions = masterOptions(
        activeRows(workflows),
        "approval_workflow_config_id",
        "workflow_name",
        "workflow_code"
    );

    const running = currentRun?.status === "RUNNING";
      const hasChecklist = templates.some(
    template => template.is_active === true
);

const canCreatePlan =
    !checkingTemplates &&
    !readinessError &&
    readyTemplateIds.length > 0;

const hasManualPlan = plans.some(plan => {
    const now = Date.now();

    return (
        plan.is_active === true &&
        plan.trigger_type === "MANUAL" &&
        readyTemplateIds.includes(plan.inspection_template_id) &&
        new Date(plan.effective_from).getTime() <= now &&
        (
            !plan.effective_to ||
            now < new Date(plan.effective_to).getTime()
        )
    );
});

const canStartInspection = canCreatePlan && hasManualPlan;

const nextStepMessage = checkingTemplates
    ? "Checking saved checklists..."
    : readinessError
        ? readinessError
        : !hasChecklist
            ? "Step 1: Create a checklist."
            : !canCreatePlan
                ? "Step 2: Add at least one checking point to your checklist."
                : !hasManualPlan
                    ? "Step 3: Create an active manual quality plan to start an inspection."
                    : "Ready: Start an inspection, enter sample readings, then submit.";
    // =================================================
    // PAGE
    // =================================================

    return (
        <div className="inspection-page">
            <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

    .inspection-page,
    .inspection-modal {
        font-family: 'Montserrat', sans-serif !important;
        color: #222b45;
    }

    .inspection-page button,
    .inspection-page input,
    .inspection-page select,
    .inspection-page textarea,
    .inspection-modal button,
    .inspection-modal input,
    .inspection-modal select,
    .inspection-modal textarea {
        font-family: inherit !important;
    }

    .inspection-page {
        min-height: 100%;
        padding: 24px 10px;
        background: #f4f5fb;
    }

    /* WHITE CARDS */

    .inspection-page .card {
        position: relative;
        border: 1px solid #e8eaf3;
        border-radius: 14px;
        background: #ffffff;
        box-shadow: 0 5px 18px rgba(37, 44, 75, .045);
        overflow: hidden;
    }

    .inspection-page .card-body {
        padding: 20px;
    }

    /* HEADER ACCENT */

    .inspection-page > .card:first-of-type::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 4px;
        background: linear-gradient(
            180deg,
            #775bff,
            #775bff 55%,
            #22b8c5
        );
    }

    .inspection-page > .card:first-of-type h4 {
        color: #202a43;
        font-size: 21px;
        font-weight: 800 !important;
        letter-spacing: -.5px;
    }

    .inspection-muted {
        color: #8490aa;
        font-size: 12px;
        line-height: 1.6;
    }

    /* REACT BOOTSTRAP BUTTONS */

    .inspection-page .btn,
    .inspection-modal .btn {
        border-radius: 9px;
        padding: 10px 15px;
        font-size: 12px;
        font-weight: 700;
        transition: background-color .15s, box-shadow .15s;
    }

    .inspection-page .btn-sm,
    .inspection-modal .btn-sm {
        padding: 7px 10px;
        font-size: 11px;
    }

    .inspection-page .btn-primary,
    .inspection-modal .btn-primary {
        --bs-btn-color: #ffffff;
        --bs-btn-bg: #7560ff;
        --bs-btn-border-color: #7560ff;
        --bs-btn-hover-color: #ffffff;
        --bs-btn-hover-bg: #654deb;
        --bs-btn-hover-border-color: #654deb;
        --bs-btn-active-bg: #5941db;
        --bs-btn-active-border-color: #5941db;
        --bs-btn-disabled-bg: #7560ff;
        --bs-btn-disabled-border-color: #7560ff;

        background-image: linear-gradient(120deg, #6d55ff, #826aff);
        box-shadow: 0 6px 14px rgba(117, 96, 255, .17);
    }

    .inspection-page .btn-outline-primary,
    .inspection-modal .btn-outline-primary {
        --bs-btn-color: #7560ff;
        --bs-btn-border-color: #c9c0ff;
        --bs-btn-hover-color: #ffffff;
        --bs-btn-hover-bg: #7560ff;
        --bs-btn-hover-border-color: #7560ff;
        --bs-btn-active-bg: #654deb;
        --bs-btn-active-border-color: #654deb;

        background-image: none;
        box-shadow: none;
    }

    .inspection-page .btn-outline-secondary,
    .inspection-modal .btn-outline-secondary {
        --bs-btn-color: #74809a;
        --bs-btn-border-color: #e0e4f0;
        --bs-btn-hover-color: #5743cf;
        --bs-btn-hover-bg: #f2efff;
        --bs-btn-hover-border-color: #c9c0ff;
    }

    .inspection-page .btn-outline-danger,
    .inspection-modal .btn-outline-danger {
        --bs-btn-color: #f0445c;
        --bs-btn-border-color: #ffbac5;
        --bs-btn-hover-color: #ffffff;
        --bs-btn-hover-bg: #f0445c;
        --bs-btn-hover-border-color: #f0445c;
    }

    .inspection-page .btn:disabled,
    .inspection-modal .btn:disabled {
        opacity: .45;
        box-shadow: none;
    }

    .inspection-page .btn:focus-visible,
    .inspection-modal .btn:focus-visible {
        outline: 3px solid #c9c0ff;
        outline-offset: 2px;
    }

    /* TABS */

    .inspection-page .nav-tabs {
        gap: 8px;
        padding-bottom: 14px;
        border-bottom: 1px solid #e8eaf3;
    }

    .inspection-page .nav-tabs .nav-link {
        border: 0 !important;
        border-radius: 8px;
        padding: 11px 16px;
        color: #7c849c;
        background: transparent;
        font-size: 12px;
        font-weight: 700;
    }

    .inspection-page .nav-tabs .nav-link:hover {
        color: #7055f5;
        background: #f5f2ff;
    }

    .inspection-page .nav-tabs .nav-link.active {
        color: #ffffff !important;
        background: #7560ff !important;
        box-shadow: 0 4px 12px rgba(117, 96, 255, .16);
    }

    /* DARK TABLE HEADER */

    .inspection-page .table-responsive,
    .inspection-modal .table-responsive {
        border: 1px solid #e8eaf3;
        border-radius: 13px;
        margin-bottom: 16px;
    }

    .inspection-page .table,
    .inspection-modal .table {
        --bs-table-bg: #ffffff;
        --bs-table-color: #303442;
        --bs-table-hover-bg: #f1eeff;
        --bs-table-hover-color: #27213d;
        --bs-table-border-color: #e8eaf3;

        margin-bottom: 0;
    }

    .inspection-page .table thead th,
    .inspection-modal .table thead th {
        background: #282e49 !important;
        color: #ffffff !important;
        padding: 15px 14px;
        border: 0;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        white-space: nowrap;
        vertical-align: middle;
    }

    .inspection-page .table tbody td,
    .inspection-modal .table tbody td {
        padding: 14px;
        color: #363944;
        border-bottom: 1px solid #e8eaf3;
        font-size: 12px;
        font-weight: 500;
        vertical-align: middle;
        line-height: 1.6;
    }

    .inspection-page .table tbody tr:nth-child(odd) > td,
    .inspection-modal .table tbody tr:nth-child(odd) > td {
        background-color: #f2f2f3;
    }

    .inspection-page .table tbody tr:nth-child(even) > td,
    .inspection-modal .table tbody tr:nth-child(even) > td {
        background-color: #ffffff;
    }

    .inspection-page .table tbody tr:hover > td,
    .inspection-modal .table tbody tr:hover > td {
        background-color: #f1eeff;
    }

    .inspection-page .table tbody tr:last-child > td,
    .inspection-modal .table tbody tr:last-child > td {
        border-bottom: 0;
    }

    /* STATUS PILLS */

    .inspection-page .badge,
    .inspection-modal .badge {
        border-radius: 20px;
        padding: 6px 10px;
        font-size: 10px;
        font-weight: 800;
        white-space: nowrap;
    }

    .inspection-page .badge.bg-success,
    .inspection-modal .badge.bg-success {
        color: #00966b !important;
        background: #e1f6ee !important;
    }

    .inspection-page .badge.bg-primary,
    .inspection-modal .badge.bg-primary {
        color: #ffffff !important;
        background: #1672ff !important;
    }

    .inspection-page .badge.bg-warning,
    .inspection-modal .badge.bg-warning {
        color: #a56c00 !important;
        background: #fff3cf !important;
    }

    .inspection-page .badge.bg-danger,
    .inspection-modal .badge.bg-danger {
        color: #d43752 !important;
        background: #ffe6ec !important;
    }

    .inspection-page .badge.bg-secondary,
    .inspection-modal .badge.bg-secondary {
        color: #6d768a !important;
        background: #edf0f5 !important;
    }

    /* INPUTS AND DROPDOWNS */

    .inspection-page .form-label,
    .inspection-modal .form-label {
        margin-bottom: 7px;
        color: #4d5570;
        font-size: 12px;
        font-weight: 600;
    }

    .inspection-page .form-control,
    .inspection-page .form-select,
    .inspection-modal .form-control,
    .inspection-modal .form-select {
        min-height: 41px;
        padding: 10px 12px;
        border: 1px solid #dbe0ef;
        border-radius: 9px;
        color: #434c68;
        background-color: #ffffff;
        font-size: 12px;
    }

    .inspection-page .form-select,
    .inspection-modal .form-select {
        padding-right: 36px;
    }

    .inspection-page .form-control::placeholder,
    .inspection-modal .form-control::placeholder {
        color: #a0a8bd;
    }

    .inspection-page .form-control:focus,
    .inspection-page .form-select:focus,
    .inspection-modal .form-control:focus,
    .inspection-modal .form-select:focus {
        border-color: #9a88ff;
        box-shadow: 0 0 0 3px rgba(117, 96, 255, .1);
    }

    .inspection-modal .form-control:disabled,
    .inspection-modal .form-select:disabled {
        color: #667087;
        background-color: #f3f4f8;
    }

    .inspection-modal .form-check-input:checked {
        background-color: #7560ff;
        border-color: #7560ff;
    }

    /* MODALS */

    .inspection-modal .modal-content {
        border: 1px solid #e6e8f2;
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 20px 65px rgba(40, 46, 73, .18);
    }

    .inspection-modal .modal-header {
        padding: 20px 24px;
        background: #f6f4ff;
        border-bottom: 1px solid #e9e4ff;
    }

    .inspection-modal .modal-title {
        color: #282e49;
        font-size: 18px;
        font-weight: 800;
    }

    .inspection-modal .modal-body {
        padding: 24px;
    }

    .inspection-modal .modal-footer {
        padding: 16px 24px;
        background: #fafaff;
        border-top: 1px solid #e8eaf3;
    }

    /* SAMPLE CARDS */

    .inspection-sample {
        padding: 20px;
        margin-bottom: 18px;
        border: 1px solid #e6e4f2;
        border-left: 4px solid #8168ff;
        border-radius: 12px;
        background: #ffffff;
    }

    .inspection-sample > h6 {
        color: #6c52ed;
        font-size: 14px;
        font-weight: 800 !important;
        margin-bottom: 14px;
    }

    .inspection-checkpoint {
        padding: 16px 0;
        border-bottom: 1px solid #ececf4;
    }

    .inspection-checkpoint:last-child {
        padding-bottom: 0;
        border-bottom: 0;
    }

    .inspection-checkpoint .fw-semibold {
        color: #333b55;
        font-size: 13px;
        font-weight: 700 !important;
    }

    .inspection-page .alert,
    .inspection-modal .alert {
        border-radius: 10px;
        font-size: 12px;
        line-height: 1.6;
    }

    @media (max-width: 768px) {
        .inspection-page {
            padding: 12px 6px;
        }

        .inspection-page .card-body,
        .inspection-modal .modal-body {
            padding: 16px;
        }

        .inspection-page > .card:first-of-type h4 {
            font-size: 19px;
        }

        .inspection-page .nav-tabs {
            gap: 4px;
        }

        .inspection-page .nav-tabs .nav-link {
            padding: 9px 10px;
            font-size: 11px;
        }

        .inspection-sample {
            padding: 14px;
        }
    }

/* SUMMARY CARDS */

.inspection-summary {
    margin: 22px 0 26px;
}

.inspection-summary-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 15px;
}

.inspection-summary-heading h6 {
    margin: 0;
    color: #282e49;
    font-size: 14px;
    font-weight: 800;
}

.inspection-summary-heading p {
    margin: 5px 0 0;
    color: #818ba2;
    font-size: 11px;
}

.inspection-summary-updating {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #7560ff;
    font-size: 10px;
    font-weight: 600;
}

.inspection-summary-updating .spinner-border {
    width: 12px;
    height: 12px;
    border-width: 2px;
}

.inspection-page .inspection-summary-card {
    position: relative;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--summary-border);
    border-radius: 16px;
    background: linear-gradient(
        135deg,
        #ffffff 35%,
        var(--summary-soft) 100%
    );
    box-shadow: 0 5px 18px rgba(40, 46, 73, .04);
    transition: transform .18s ease, box-shadow .18s ease;
}

.inspection-page .inspection-summary-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(40, 46, 73, .09);
}

.inspection-summary-card::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 4px;
    background: var(--summary-color);
}

.inspection-page .inspection-summary-card .card-body {
    position: relative;
    padding: 21px 22px 24px;
}

.inspection-summary-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.inspection-summary-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border: 1px solid var(--summary-border);
    border-radius: 14px;
    background: var(--summary-soft);
    color: var(--summary-color);
}

.inspection-summary-tag {
    padding: 5px 8px;
    border: 1px solid var(--summary-border);
    border-radius: 20px;
    background: #ffffff;
    color: var(--summary-color);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: .5px;
    white-space: nowrap;
}

.inspection-summary-number {
    display: flex;
    align-items: center;
    min-height: 56px;
    margin-top: 17px;
    color: #282e49;
    font-size: 38px;
    font-weight: 800;
    letter-spacing: -1.5px;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
}

.inspection-summary-label {
    margin-top: 5px;
    color: #39415c;
    font-size: 12px;
    font-weight: 700;
}

.inspection-summary-description {
    margin-top: 7px;
    color: #7b849a;
    font-size: 10px;
    line-height: 1.6;
}

.inspection-summary-card.purple {
    --summary-color: #7560ff;
    --summary-soft: #f1edff;
    --summary-border: #e4dcff;
}

.inspection-summary-card.blue {
    --summary-color: #2878ec;
    --summary-soft: #edf4ff;
    --summary-border: #dbe8ff;
}

.inspection-summary-card.green {
    --summary-color: #009b73;
    --summary-soft: #eaf8f1;
    --summary-border: #d2eee1;
}

.inspection-summary-card.red {
    --summary-color: #e44965;
    --summary-soft: #fff0f3;
    --summary-border: #f8dce3;
}

.inspection-summary-skeleton {
    display: block;
    width: 65px;
    height: 35px;
    border-radius: 7px;
    background: var(--summary-border);
}

@media (prefers-reduced-motion: reduce) {
    .inspection-page .inspection-summary-card {
        transition: none;
    }

    .inspection-page .inspection-summary-card:hover {
        transform: none;
    }
}

@media (max-width: 576px) {
    .inspection-page .inspection-summary-card .card-body {
        padding: 18px;
    }

    .inspection-summary-number {
        font-size: 32px;
    }

    .inspection-summary-heading {
        align-items: flex-start;
    }
}
    /* COMPACT SUMMARY CARDS */

.inspection-summary {
    margin: 14px 0 18px;
}

.inspection-summary-heading {
    margin-bottom: 10px;
}

.inspection-summary-heading h6 {
    font-size: 12px;
}

.inspection-summary-heading p {
    margin-top: 3px;
    font-size: 10px;
}

.inspection-page .inspection-summary-card .card-body {
    padding: 13px 16px 15px;
}

.inspection-summary-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
}

.inspection-summary-icon svg {
    width: 18px;
    height: 18px;
}

.inspection-summary-tag {
    padding: 4px 6px;
    font-size: 7px;
}

.inspection-summary-number {
    min-height: 34px;
    margin-top: 8px;
    font-size: 27px;
    letter-spacing: -.8px;
}

.inspection-summary-label {
    margin-top: 3px;
    font-size: 11px;
}

.inspection-summary-description {
    margin-top: 4px;
    font-size: 9px;
}

.inspection-summary-card::after {
    height: 3px;
}

.inspection-notifications {
    font-family: 'Montserrat', sans-serif !important;
}

.inspection-notifications .toast {
    width: 320px;
    max-width: 100%;
    border: 1px solid #e5e1f5;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 10px 30px rgba(40, 46, 73, .14);
    overflow: hidden;
}

.inspection-notifications .toast-header {
    padding: 10px 14px;
    background: #f7f5ff;
    font-size: 12px;
}

.inspection-notifications .toast-body {
    padding: 12px 14px;
    color: #434c68;
    font-size: 12px;
}
`}</style>

            <PageHeader
    title="In-Process Inspection"
    subtitle="Quality / In-Process Inspection"
>
    <Button
        className="primary-btn"
        disabled={busy || loading || !canStartInspection}
        onClick={() => openForm("start")}
    >
        + Start Inspection
    </Button>

</PageHeader>
       
{/* =====================================================
    INSPECTION SUMMARY CARDS
===================================================== */}

<div className="inspection-summary">
    <div className="inspection-summary-heading">
        <div>
            <h6>Inspection Overview</h6>
            <p>All inspection records for your company</p>
        </div>

        {summaryLoading && (
            <span className="inspection-summary-updating">
                <Spinner size="sm" />
                Updating
            </span>
        )}
    </div>

    <Row className="g-3">
        {[
            {
                label: "Total Inspections",
                value: summary.total,
                description: "All recorded inspections",
                color: "purple",
                icon: ClipboardData,
                tag: "OVERVIEW"
            },
            {
                label: "Running",
                value: summary.running,
                description: "Measurements in progress",
                color: "blue",
                icon: ArrowRepeat,
                tag: "IN PROGRESS"
            },
            {
                label: "Submitted OK",
                value: summary.submittedOK,
                description: "Passed measurement checks",
                color: "green",
                icon: CheckCircle,
                tag: "PASSED"
            },
            {
                label: "Submitted NOK",
                value: summary.submittedNOK,
                description: "Failed measurement checks",
                color: "red",
                icon: ExclamationTriangle,
                tag: "FAILED"
            }
        ].map(item => {
            const Icon = item.icon;

            return (
                <Col xs={12} sm={6} xl={3} key={item.label}>
                    <Card
                        className={`inspection-summary-card ${item.color}`}
                        aria-busy={summaryLoading}
                    >
                        <Card.Body>
                            <div className="inspection-summary-top">
                                <div className="inspection-summary-icon">
                                    <Icon size={23} aria-hidden="true" />
                                </div>

                                <span className="inspection-summary-tag">
                                    {item.tag}
                                </span>
                            </div>

                            <div className="inspection-summary-number">
                                {summaryLoading ? (
                                    <span
                                        className="inspection-summary-skeleton"
                                        aria-label="Loading count"
                                    />
                                ) : summaryError ? (
                                    "—"
                                ) : (
                                    item.value.toLocaleString()
                                )}
                            </div>

                            <div className="inspection-summary-label">
                                {item.label}
                            </div>

                            <div className="inspection-summary-description">
                                {item.description}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            );
        })}
    </Row>

    {summaryError && (
        <Alert variant="warning" className="mt-3 mb-0">
            Unable to load inspection summary: {summaryError}
        </Alert>
    )}
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

            {loading ? (
                <div className="text-center py-5">
                    <Spinner size="sm" className="me-2" />
                    Loading inspection data…
                </div>
            ) : (
                <Card>
                    <Card.Body>
                        <Tabs
                            activeKey={tab}
                            onSelect={key => {
                                setTab(key);

                                if (key === "reports") {
                                    perform(
                                        () => loadReports(),
                                        "Report loaded."
                                    );
                                }
                            }}
                            className="mb-4"
                        >
                            <Tab eventKey="runs" title="Inspections">
                                {runTable(runs)}

                                <div className="d-flex justify-content-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        disabled={busy || runOffset === 0}
                                        onClick={() => perform(async () => {
                                            const next = Math.max(
                                                0,
                                                runOffset - pageSize
                                            );
                                            await loadRuns(next);
                                            setRunOffset(next);
                                        }, "Inspections loaded.")}
                                    >
                                        Previous
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        disabled={busy || runs.length < pageSize}
                                        onClick={() => perform(async () => {
                                            const next = runOffset + pageSize;
                                            await loadRuns(next);
                                            setRunOffset(next);
                                        }, "Inspections loaded.")}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </Tab>

                            <Tab eventKey="templates" title="Templates & checkpoints">
                                <div className="d-flex justify-content-between mb-3">
                                    <h6 className="fw-bold">
                                        Inspection templates
                                    </h6>

                                    <Button
                                        size="sm"
                                        onClick={() => openForm("template")}
                                    >
                                        + Template
                                    </Button>
                                </div>

                                <Table responsive hover>
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Template</th>
                                            <th>Version</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {templates.map((row, index) => (
                                            <tr key={row.inspection_template_id}>
                                                <td>{index + 1}</td>
                                                <td>{row.template_name}</td>
                                                <td>{row.version_no}</td>
                                                <td>
                                                    <StatusBadge value={
                                                        row.is_active
                                                            ? "ACTIVE"
                                                            : "INACTIVE"
                                                    } />
                                                </td>

                                                <td>
                                                    <div className="d-flex gap-2 flex-wrap">
                                                        <Button
                                                            size="sm"
                                                            variant="outline-secondary"
                                                            onClick={() =>
                                                                openSteps(row)
                                                            }
                                                        >
                                                            Checkpoints
                                                        </Button>

                                                        {actionButtons(
                                                            "template",
                                                            row
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {!templates.length && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4">
                                                    No templates found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Tab>

                            <Tab eventKey="plans" title="Quality plans">
                                <div className="d-flex justify-content-between mb-3">
                                    <h6 className="fw-bold">
                                        Machine inspection plans
                                    </h6>

                                    <Button
    size="sm"
    disabled={busy || loading || !canCreatePlan}
    onClick={() => openForm("plan")}
>
    + Quality plan
</Button>
                                </div>

                                <Table responsive hover>
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Machine</th>
                                            <th>Part / process</th>
                                            <th>Template</th>
                                            <th>Trigger</th>
                                            <th>Samples</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {plans.map(row => (
                                            <tr key={row.quality_plan_config_id}>
                                                <td>{row.config_code}</td>
                                                <td>
                                                    {row.machine_name ||
                                                        machineName(row.machine_id)}
                                                </td>
                                                <td>
                                                    {row.part_name ||
                                                        partName(row.part_id)}
                                                    <div className="inspection-muted">
                                                        {row.process_name ||
                                                            processName(row.process_id)}
                                                    </div>
                                                </td>
                                                <td>
                                                    {row.template_name ||
                                                        templateName(
                                                            row.inspection_template_id
                                                        )}
                                                </td>
                                                <td>
                                                    {row.trigger_type.replaceAll("_", " ")}
                                                </td>
                                                <td>{row.sample_size}</td>
                                                <td>
                                                    <StatusBadge value={
                                                        row.is_active
                                                            ? "ACTIVE"
                                                            : "INACTIVE"
                                                    } />
                                                </td>
                                                <td>
                                                    {actionButtons("plan", row)}
                                                </td>
                                            </tr>
                                        ))}

                                        {!plans.length && (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4">
                                                    No quality plans found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Tab>

                            <Tab eventKey="reports" title="Reports">
                                <Form onSubmit={filterReport}>
                                    <Row className="g-2 mb-3">
                                        <Col md={2}>
                                            <Form.Label>From</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={reportFilters.from}
                                                onChange={event =>
                                                    setReportFilters({
                                                        ...reportFilters,
                                                        from: event.target.value
                                                    })
                                                }
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <Form.Label>To</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={reportFilters.to}
                                                onChange={event =>
                                                    setReportFilters({
                                                        ...reportFilters,
                                                        to: event.target.value
                                                    })
                                                }
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Form.Label>Machine</Form.Label>
                                            <Form.Select
                                                value={reportFilters.machine_id}
                                                onChange={event =>
                                                    setReportFilters({
                                                        ...reportFilters,
                                                        machine_id: event.target.value
                                                    })
                                                }
                                            >
                                                <option value="">All machines</option>
                                                {machineOptions.map(option => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>

                                        <Col md={2}>
                                            <Form.Label>Result</Form.Label>
                                            <Form.Select
                                                value={reportFilters.result_status}
                                                onChange={event =>
                                                    setReportFilters({
                                                        ...reportFilters,
                                                        result_status: event.target.value
                                                    })
                                                }
                                            >
                                                <option value="">All results</option>
                                                <option value="OK">OK</option>
                                                <option value="NOK">NOK</option>
                                            </Form.Select>
                                        </Col>

                                        <Col md={3} className="d-flex align-items-end gap-2">
                                            <Button type="submit" disabled={busy}>
                                                Search
                                            </Button>

                                            <Button
                                                variant="outline-success"
                                                disabled={busy}
                                                onClick={exportCsv}
                                            >
                                                Export CSV
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>

                                {runTable(reports, true)}

                                <div className="d-flex justify-content-end gap-2">
                                    

                                    </div>
                            </Tab>
                        </Tabs>
                    </Card.Body>
                </Card>
            )}

            {/* CONFIGURATION / START FORM */}

            <Modal
                show={Boolean(formType)}
                onHide={() => !busy && setFormType("")}
                size="lg"
                centered
                className="inspection-modal"
                backdrop="static"
            >
                <Form onSubmit={saveForm}>
                    <Modal.Header closeButton={!busy}>
                        <Modal.Title className="fs-5 fw-bold">
                            {formType === "start"
                                ? "Start inspection"
                                : `${editingId ? "Edit" : "Add"} ${
                                    formType === "step"
                                        ? "checkpoint"
                                        : formType === "plan"
                                            ? "quality plan"
                                            : "template"
                                }`}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}

                        <fieldset disabled={busy}>
                            {formType === "template" && (
                                <>
                                    {input("template_name", "Template name", "text", true, {
                                        maxLength: 150
                                    })}
                                    {revisionFields()}
                                </>
                            )}

                            {formType === "plan" && (
                                <>
                                    {formType === "plan" &&
                                        input("config_code", "Plan code", "text", true, {
                                            maxLength: 60
                                        })}

                                    {select(
                                        "machine_id",
                                        "Machine",
                                        machineOptions,
                                        true,
                                        "Select machine"
                                    )}

                                    {select(
                                        "part_id",
                                        "Part (optional)",
                                        partOptions,
                                        false,
                                        formType === "plan"
                                            ? "All parts"
                                            : "No part selected"
                                    )}

                                    {select(
                                        "process_id",
                                        "Process (optional)",
                                        processOptions,
                                        false,
                                        formType === "plan"
                                            ? "All processes"
                                            : "No process selected"
                                    )}
                                </>
                            )}

                            {formType === "start" && (
    <>
        <Form.Group className="mb-3">
            <Form.Label>Machine *</Form.Label>

            <Form.Select
                value={form.machine_id || ""}
                onChange={event =>
                    fillInspectionContext(event.target.value)
                }
                required
            >
                <option value="">Select machine</option>

                {machineOptions.map(option => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </Form.Select>
        </Form.Group>
         {form.machine_id && (
    <Form.Group className="mb-3">
        <Form.Label>Quality Plan *</Form.Label>

        <Form.Select
            value={form.quality_plan_config_id || ""}
            onChange={event =>
                fillInspectionContext(
                    form.machine_id,
                    event.target.value
                )
            }
            disabled={
                busy ||
                getManualPlans(form.machine_id).length <= 1
            }
            required
        >
            <option value="">
                {getManualPlans(form.machine_id).length === 0
                    ? "No Manual plan available"
                    : "Select quality plan"}
            </option>

            {getManualPlans(form.machine_id).map(plan => (
                <option
                    key={plan.quality_plan_config_id}
                    value={plan.quality_plan_config_id}
                >
                    {startPlanLabel(plan)}
                </option>
            ))}
        </Form.Select>

        <Form.Text className="text-muted">
            {getManualPlans(form.machine_id).length === 1
                ? "The only available plan has been selected automatically."
                : getManualPlans(form.machine_id).length > 1
                    ? "Select the plan for the part and process being inspected."
                    : "Check the Manual plan, template, checkpoints and effective dates."}
        </Form.Text>
    </Form.Group>
)}
        <Row>
            <Col md={6}>
                <Form.Group className="mb-3">
                    <Form.Label>Part</Form.Label>

                    <Form.Control
                        readOnly
                        value={
                            Boolean(form.quality_plan_config_id)
                                ? form.part_id
                                    ? partName(form.part_id)
                                    : "All parts"
                                : ""
                        }
                        placeholder="Filled automatically"
                    />
                </Form.Group>
            </Col>

            <Col md={6}>
                <Form.Group className="mb-3">
                    <Form.Label>Process</Form.Label>

                    <Form.Control
                        readOnly
                        value={
                            form.context_ready
                                ? form.process_id
                                    ? processName(form.process_id)
                                    : "All processes"
                                : ""
                        }
                        placeholder="Filled automatically"
                    />
                </Form.Group>
            </Col>
        </Row>

        <Form.Group className="mb-3">
            <Form.Label>Current shift</Form.Label>

            <Form.Control
                readOnly
                value={
                    form.shift_id
                        ? shiftName(form.shift_id)
                        : ""
                }
                placeholder="Detected from shift timing"
            />
        </Form.Group>

        <div className="inspection-muted">
            Part and process come from the quality plan.
            The current shift is detected automatically.
        </div>
    </>
)}

                            {formType === "plan" && (
                                <>
                                    {select(
                                        "inspection_template_id",
                                        "Inspection template",
                                        templateOptions,
                                        true,
                                        "Select template"
                                    )}

                                    {select(
                                        "trigger_type",
                                        "Start condition",
                                        [
                                            { value: "MANUAL", label: "Manual" },
                                            { value: "SHIFT_START", label: "Shift start" },
                                            { value: "INTERVAL", label: "Time interval" },
                                            { value: "PART_COUNT", label: "Part count" }
                                        ],
                                        true
                                    )}

                                    {form.trigger_type === "INTERVAL" &&
                                        input(
                                            "interval_minutes",
                                            "Every how many minutes?",
                                            "number",
                                            true,
                                            { min: 1, step: 1 }
                                        )}

                                    {form.trigger_type === "PART_COUNT" &&
                                        input(
                                            "every_n_parts",
                                            "Every how many parts?",
                                            "number",
                                            true,
                                            { min: 1, step: 1 }
                                        )}

                                    {input(
                                        "sample_size",
                                        "Number of samples",
                                        "number",
                                        true,
                                        { min: 1, step: 1 }
                                    )}

                                    {select(
                                        "approval_workflow_config_id",
                                        "Approval workflow (optional)",
                                        workflowOptions,
                                        false,
                                        "No approval required"
                                    )}

                                    {revisionFields()}
                                </>
                            )}

                            {formType === "step" && (
                                <>
                                    {input("check_point", "Checkpoint", "text", true)}

                                    {input("specification", "Specification")}
                                    {input("checking_method", "Checking method")}

                                    {select(
                                        "value_type",
                                        "Answer type",
                                        [
                                            { value: "NUMBER", label: "Measurement" },
                                            { value: "BOOLEAN", label: "Yes / No" },
                                            { value: "TEXT", label: "Text" }
                                        ],
                                        true
                                    )}

                                    {form.value_type === "BOOLEAN" &&
                                        select(
                                            "expected_boolean",
                                            "Expected answer",
                                            [
                                                { value: "true", label: "Yes" },
                                                { value: "false", label: "No" }
                                            ],
                                            true
                                        )}

                                    {form.value_type === "NUMBER" && (
                                        <>
                                            <Row>
                                                <Col md={6}>
                                                    {input(
                                                        "lower_limit",
                                                        "Lower limit",
                                                        "number",
                                                        false,
                                                        { step: "any" }
                                                    )}
                                                </Col>
                                                <Col md={6}>
                                                    {input(
                                                        "upper_limit",
                                                        "Upper limit",
                                                        "number",
                                                        false,
                                                        { step: "any" }
                                                    )}
                                                </Col>
                                            </Row>

                                            {input(
                                                "unit",
                                                "Unit",
                                                "text",
                                                true,
                                                { maxLength: 20 }
                                            )}

                                            <div className="inspection-muted mb-3">
                                                Enter at least one numeric limit.
                                            </div>
                                        </>
                                    )}

                                    {input(
                                        "action_after_abnormality",
                                        "Action when result is NOK"
                                    )}

                                    {input(
                                        "special_characteristic",
                                        "Special characteristic (optional)",
                                        "text",
                                        false,
                                        { maxLength: 60 }
                                    )}

                                    <Form.Check
                                        type="switch"
                                        label="Mandatory checkpoint"
                                        checked={form.is_mandatory}
                                        onChange={event =>
                                            changeForm(
                                                "is_mandatory",
                                                event.target.checked
                                            )
                                        }
                                    />

                                    <div className="inspection-muted mt-2">
                                        Step number is assigned automatically.
                                    </div>
                                </>
                            )}
                        </fieldset>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="outline-secondary"
                            disabled={busy}
                            onClick={() => setFormType("")}
                        >
                            Close
                        </Button>

                        <Button
    type="submit"
    disabled={
        busy ||
        (formType === "start" && !form.context_ready)
    }
>
                            {busy && <Spinner size="sm" className="me-2" />}
                            {formType === "start" ? "Start inspection" : "Save"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* CHECKPOINT LIST */}

            <Modal
                show={stepsOpen && formType !== "step"}
                onHide={() => setStepsOpen(false)}
                size="xl"
                centered
                className="inspection-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="fs-5">
                        {selectedTemplate?.template_name} — Checkpoints
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <div className="text-end mb-3">
                        <Button
                            size="sm"
                            disabled={busy || stepsLoading}
                            onClick={() => openForm("step")}
                        >
                            + Checkpoint
                        </Button>
                    </div>

                    {stepsLoading ? (
                        <Spinner size="sm" />
                    ) : (
                        <Table responsive>
                            <thead>
                                <tr>
                                    <th>Step</th>
                                    <th>Checkpoint</th>
                                    <th>Type</th>
                                    <th>Requirement</th>
                                    <th>Mandatory</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {steps.map(step => (
                                    <tr key={step.inspection_step_id}>
                                        <td>{step.step_no}</td>
                                        <td>{step.check_point}</td>
                                        <td>{step.value_type}</td>
                                        <td>
                                            {step.value_type === "NUMBER"
                                                ? `${step.lower_limit ?? "No minimum"} to ${
                                                    step.upper_limit ?? "No maximum"
                                                } ${step.unit}`
                                                : step.value_type === "BOOLEAN"
                                                    ? step.expected_boolean ? "Yes" : "No"
                                                    : "Text and OK / NOK"}
                                        </td>
                                        <td>{step.is_mandatory ? "Yes" : "No"}</td>
                                        <td>{actionButtons("step", step)}</td>
                                    </tr>
                                ))}

                                {!steps.length && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4">
                                            No checkpoints added.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
            </Modal>

            {/* SAMPLE MEASUREMENTS */}

            <Modal
                show={runOpen && !approvalTask}
                onHide={() => !busy && setRunOpen(false)}
                size="xl"
                centered
                scrollable
                className="inspection-modal"
                backdrop="static"
            >
                <Modal.Header closeButton={!busy}>
                    <Modal.Title className="fs-5 fw-bold">
                        Inspection measurements
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    {currentRun && (
                        <>
                            <div className="d-flex gap-3 flex-wrap mb-3">
                                <strong>{machineName(currentRun.machine_id)}</strong>
                                <span>{shiftName(currentRun.shift_id)}</span>
                                <StatusBadge value={currentRun.status} />
                                <StatusBadge value={currentRun.result_status} />
                            </div>

                            {Array.from(
                                { length: Number(currentPlan?.sample_size || 0) },
                                (_, index) => index + 1
                            ).map(sampleNo => (
                                <div className="inspection-sample" key={sampleNo}>
                                    <h6 className="fw-bold">
                                        Sample {sampleNo}
                                    </h6>

                                    {runSteps.map(step => {
                                        const key =
                                            `${sampleNo}:${step.inspection_step_id}`;
                                        const answer = answers[key] || {};

                                        return (
                                            <div
                                                className="inspection-checkpoint"
                                                key={key}
                                            >
                                                <div className="fw-semibold mb-1">
                                                    {step.step_no}. {step.check_point}
                                                    {step.is_mandatory && (
                                                        <span className="text-danger"> *</span>
                                                    )}
                                                </div>

                                                {step.specification && (
                                                    <div className="inspection-muted">
                                                        {step.specification}
                                                    </div>
                                                )}

                                                {step.checking_method && (
                                                    <div className="inspection-muted mb-2">
                                                        Method: {step.checking_method}
                                                    </div>
                                                )}

                                                <Row className="g-2">
                                                    <Col md={step.value_type === "TEXT" ? 4 : 6}>
                                                        {step.value_type === "BOOLEAN" ? (
                                                            <Form.Select
                                                                value={answer.value ?? ""}
                                                                disabled={!running || busy}
                                                                onChange={event =>
                                                                    updateAnswer(
                                                                        key,
                                                                        "value",
                                                                        event.target.value
                                                                    )
                                                                }
                                                            >
                                                                <option value="">Select answer</option>
                                                                <option value="true">Yes</option>
                                                                <option value="false">No</option>
                                                            </Form.Select>
                                                        ) : (
                                                            <Form.Control
                                                                type={
                                                                    step.value_type === "NUMBER"
                                                                        ? "number"
                                                                        : "text"
                                                                }
                                                                step={
                                                                    step.value_type === "NUMBER"
                                                                        ? "any"
                                                                        : undefined
                                                                }
                                                                placeholder={
                                                                    step.value_type === "NUMBER"
                                                                        ? `Measurement (${step.unit})`
                                                                        : "Enter observation"
                                                                }
                                                                value={answer.value ?? ""}
                                                                disabled={!running || busy}
                                                                onChange={event =>
                                                                    updateAnswer(
                                                                        key,
                                                                        "value",
                                                                        event.target.value
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </Col>

                                                    {step.value_type === "TEXT" && (
                                                        <Col md={2}>
                                                            <Form.Select
                                                                value={answer.result_status || ""}
                                                                disabled={!running || busy}
                                                                onChange={event =>
                                                                    updateAnswer(
                                                                        key,
                                                                        "result_status",
                                                                        event.target.value
                                                                    )
                                                                }
                                                            >
                                                                <option value="">Result</option>
                                                                <option value="OK">OK</option>
                                                                <option value="NOK">NOK</option>
                                                            </Form.Select>
                                                        </Col>
                                                    )}

                                                    <Col md={6}>
                                                        <Form.Control
                                                            placeholder="Remarks — required for NOK"
                                                            value={answer.remarks || ""}
                                                            maxLength={2000}
                                                            disabled={!running || busy}
                                                            onChange={event =>
                                                                updateAnswer(
                                                                    key,
                                                                    "remarks",
                                                                    event.target.value
                                                                )
                                                            }
                                                        />
                                                    </Col>
                                                </Row>

                                                {answer.result_status && (
                                                    <div className="mt-2">
                                                        <span className="inspection-muted me-2">
                                                            Last saved result:
                                                        </span>
                                                        <StatusBadge value={
                                                            answer.result_status
                                                        } />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {approvals.length > 0 && (
                                <>
                                    <h6 className="fw-bold mt-4">Approval stages</h6>

                                    <Table responsive>
                                        <thead>
                                            <tr>
                                                <th>Stage</th>
                                                <th>Decision</th>
                                                <th>Remarks</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {approvals.map(task => (
                                                <tr key={task.approval_event_id}>
                                                    <td>{task.step_no}</td>
                                                    <td>
                                                        <StatusBadge value={task.decision} />
                                                    </td>
                                                    <td>{task.remarks || "—"}</td>
                                                    <td>
                                                        {task.decision === "PENDING" && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline-primary"
                                                                disabled={busy}
                                                                onClick={() => {
                                                                    setApprovalTask(task);
                                                                    setDecision("APPROVED");
                                                                    setRemarks("");
                                                                }}
                                                            >
                                                                Decide
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </>
                            )}
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="outline-secondary"
                        disabled={busy}
                        onClick={() => setRunOpen(false)}
                    >
                        Close
                    </Button>

                    {running && (
                        <>
                            <Button
                                variant="outline-primary"
                                disabled={busy}
                                onClick={saveDraft}
                            >
                                Save draft
                            </Button>

                            <div>
    <Button
        variant="success"
        disabled={busy || Boolean(getSubmissionProblem())}
        onClick={requestSubmit}
    >
        Submit inspection
    </Button>

    {getSubmissionProblem() && (
        <div
            className="inspection-muted mt-2"
            style={{ maxWidth: 280 }}
        >
            {getSubmissionProblem()}
        </div>
    )}
</div>
                        </>
                    )}
                </Modal.Footer>
            </Modal>

            {/* APPROVAL DECISION */}

            <Modal
                show={Boolean(approvalTask)}
                onHide={() => !busy && setApprovalTask(null)}
                centered
                className="inspection-modal"
            >
                <Form onSubmit={saveDecision}>
                    <Modal.Header closeButton={!busy}>
                        <Modal.Title className="fs-5">
                            Approval decision
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}

                        <Form.Label>Decision</Form.Label>
                        <Form.Select
                            value={decision}
                            disabled={busy}
                            onChange={event => setDecision(event.target.value)}
                            className="mb-3"
                        >
                            <option value="APPROVED">Approve</option>
                            <option value="REJECTED">Reject</option>
                        </Form.Select>

                        <Form.Label>Remarks</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={remarks}
                            maxLength={2000}
                            required={decision === "REJECTED"}
                            disabled={busy}
                            onChange={event => setRemarks(event.target.value)}
                        />
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="outline-secondary"
                            disabled={busy}
                            onClick={() => setApprovalTask(null)}
                        >
                            Close
                        </Button>

                        <Button type="submit" disabled={busy}>
                            Save decision
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* CONFIRMATION */}

            <Modal
                show={Boolean(confirmation)}
                onHide={() => !busy && setConfirmation(null)}
                centered
                className="inspection-modal"
            >
                <Modal.Header closeButton={!busy}>
                    <Modal.Title className="fs-5">
                        {confirmation?.title}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {confirmation?.message}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="outline-secondary"
                        disabled={busy}
                        onClick={() => setConfirmation(null)}
                    >
                        Back
                    </Button>

                    <Button
                        variant="primary"
                        disabled={busy}
                        onClick={() =>
                            perform(async () => {
                                await confirmation.action();
                                setConfirmation(null);
                            }, "Operation completed.")
                        }
                    >
                        {busy && <Spinner size="sm" className="me-2" />}
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>
            <ToastContainer
            className="p-3 inspection-notifications"
    position="top-end"
    
    style={{
        position: "fixed",
        zIndex: 2000,
        maxWidth: "100%"
    }}
>
    <Toast
        key={toast.id || 0}
        show={toast.show}
        onClose={() =>
            setToast(previous => ({
                ...previous,
                show: false
            }))
        }
        delay={toast.variant === "danger" ? 6000 : 3000}
        autohide
        role={toast.variant === "danger" ? "alert" : "status"}
    >
        <Toast.Header>
            <span
                className={`rounded-circle me-2 ${
                    toast.variant === "danger"
                        ? "bg-danger"
                        : "bg-success"
                }`}
                style={{
                    width: 9,
                    height: 9
                }}
            />

            <strong className="me-auto">
                {toast.variant === "danger"
                    ? "Unable to complete"
                    : "Success"}
            </strong>
        </Toast.Header>

        <Toast.Body>
            {toast.message}
        </Toast.Body>
    </Toast>
</ToastContainer>
        </div>
    );
}