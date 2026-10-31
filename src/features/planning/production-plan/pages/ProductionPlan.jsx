import useLiveRefresh from '../../../../shared/operations/useLiveRefresh.js';
import LiveSync from '../../../../shared/operations/LiveSync.jsx';
import OperationsLaunch from '../../../../shared/operations/OperationsLaunch.jsx';
import ReportLens from '../../../../shared/operations/ReportLens.jsx';
import PlanningBoard from '../../../../shared/operations/PlanningBoard.jsx';
import DateBoard from '../../../../shared/design/DateBoard.jsx';

import Table from '../../../../shared/components/SmartTable.jsx';
import React, { useMemo, useState } from "react";

import {
    Alert,
    Button,
    Col,
    Form,
    Modal,
    Row,
    Spinner} from "react-bootstrap";

import {
    ArrowClockwise,
    PlayFill,
    ClockHistory,
    FileEarmarkText,
    Download,
    ListUl,
    Diagram3,
    PlusLg,
    PencilSquare,
    Trash3
} from "react-bootstrap-icons";

import {
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";
import productionPlanService from "../api/productionPlan.service.js";


/* ============================================================
   CONSTANTS
============================================================ */

const PLAN_SOURCES = [
    "ORDER",
    "SHIFT_AUTO",
    "ERP",
    "MANUAL",
    "API"
];


/* ============================================================
   STYLES
============================================================ */

const styles = `

.production-plan-page {
    width: 100%;
    padding: 24px 28px;
    font-family: "Montserrat", "Segoe UI", Arial, sans-serif;
}


/* ============================================================
   HEADER
============================================================ */

.pp-header {
    background: #ffffff;
    border-radius: 15px;
    border: 1px solid #ececf4;
    box-shadow: 0 5px 20px rgba(24, 29, 52, 0.06);
    padding: 23px 25px;
    margin-bottom: 26px;
    position: relative;
    overflow: hidden;
}

.pp-header::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 5px;
    background: linear-gradient(
        180deg,
        #314965,
        #17c7d9
    );
}

.pp-header-title {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    color: #171f3c;
}

.pp-breadcrumb {
    margin-top: 5px;
    color: #7d849e;
    font-size: 13px;
}

.pp-header-buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
}


/* ============================================================
   HEADER OUTLINE BUTTONS
   SAME STYLE AS PRODUCTION ORDER
============================================================ */

.pp-outline-button {
    height: 42px !important;
    padding: 0 17px !important;

    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 7px !important;

    background: #ffffff !important;

    border: 1px solid #314965 !important;

    color: #314965 !important;

    border-radius: 8px !important;

    font-size: 13px !important;
    font-weight: 700 !important;

    box-shadow: none !important;

    transition: all 0.18s ease !important;
}

.pp-outline-button:hover,
.pp-outline-button:focus,
.pp-outline-button:active {
    background: #f6f8fa !important;

    border-color: #314965 !important;

    color: #314965 !important;

    box-shadow: 0 4px 12px rgba(103, 87, 245, 0.10) !important;
}


/* ============================================================
   ADD BUTTON
============================================================ */

.pp-add-button {
    height: 42px !important;
    padding: 0 18px !important;

    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;

    border: 1px solid #314965 !important;

    color: #ffffff !important;

    background: linear-gradient(
        135deg,
        #314965,
        #314965
    ) !important;

    border-radius: 8px !important;

    font-size: 13px !important;
    font-weight: 700 !important;

    box-shadow:
        0 6px 16px
        rgba(103, 87, 245, 0.20) !important;

    transition: all 0.18s ease !important;
}

.pp-add-button:hover,
.pp-add-button:focus,
.pp-add-button:active {
    color: #ffffff !important;

    border-color: #5c4be9 !important;

    background: linear-gradient(
        135deg,
        #5f50e8,
        #715bea
    ) !important;

    box-shadow:
        0 7px 18px
        rgba(103, 87, 245, 0.28) !important;
}


/* ============================================================
   TOOLBAR
============================================================ */

.pp-toolbar {
    background: #ffffff;

    border: 1px solid #ececf4;

    box-shadow:
        0 5px 18px
        rgba(24, 29, 52, 0.05);

    border-radius: 14px;

    margin-bottom: 27px;

    padding: 20px 22px;

    position: relative;

    overflow: hidden;
}

.pp-toolbar::before {
    content: "";

    position: absolute;

    left: 0;
    top: 0;
    bottom: 0;

    width: 4px;

    background: linear-gradient(
        180deg,
        #314965,
        #14c7d8
    );
}

.pp-search-wrapper {
    position: relative;
    display: flex;
    width: 100%;
}

.pp-search-icon {
    width: 48px;
    min-width: 48px;

    border: 1px solid #dfe2ed;
    border-right: 0;

    border-radius:
        9px 0 0 9px;

    background: #f8f9fc;

    display: flex;

    align-items: center;
    justify-content: center;

    color: #8b92aa;

    font-size: 18px;
}

.pp-search-input {
    border-radius:
        0 9px 9px 0 !important;

    border-color:
        #dfe2ed !important;

    height: 47px;

    box-shadow: none !important;
}

.pp-status-filter {
    height: 47px;

    border-radius: 9px;

    border-color: #dfe2ed;

    font-size: 13px;
}

.pp-toolbar-actions {
    display: flex;

    align-items: center;

    justify-content: flex-end;

    gap: 9px;
}


/* ============================================================
   TOOLBAR BUTTONS
   WHITE BACKGROUND LIKE PRODUCTION ORDER
============================================================ */

.pp-tool-button {
    width: 47px !important;
    height: 45px !important;

    padding: 0 !important;

    border-radius: 9px !important;

    background: #ffffff !important;

    display: inline-flex !important;

    align-items: center !important;

    justify-content: center !important;

    font-size: 16px !important;

    box-shadow: none !important;

    transition: all 0.18s ease !important;
}


/* REFRESH */

.pp-refresh-button {
    background: #ffffff !important;

    border:
        1px solid
        #dfe3ec !important;

    color:
        #7e879b !important;
}

.pp-refresh-button:hover,
.pp-refresh-button:focus,
.pp-refresh-button:active {
    background:
        #f7f8fa !important;

    border-color:
        #cfd4df !important;

    color:
        #626b7d !important;
}


/* EXECUTE */

.pp-execute-button {
    background:
        #ffffff !important;

    border:
        1px solid
        #21a66b !important;

    color:
        #15935b !important;
}

.pp-execute-button:hover,
.pp-execute-button:focus,
.pp-execute-button:active {
    background:
        #f1fbf6 !important;

    border-color:
        #16965d !important;

    color:
        #12814f !important;
}


/* RUNTIME */

.pp-runtime-button {
    background:
        #ffffff !important;

    border:
        1px solid
        #f0ae13 !important;

    color:
        #eba800 !important;
}

.pp-runtime-button:hover,
.pp-runtime-button:focus,
.pp-runtime-button:active {
    background:
        #fffaf0 !important;

    border-color:
        #e4a100 !important;

    color:
        #d59700 !important;
}


/* REPORT */

.pp-report-button {
    background:
        #ffffff !important;

    border:
        1px solid
        #765fff !important;

    color:
        #6856f6 !important;
}

.pp-report-button:hover,
.pp-report-button:focus,
.pp-report-button:active {
    background:
        #f6f8fa !important;

    border-color:
        #6856f6 !important;

    color:
        #5a48ea !important;
}


/* EXPORT */

.pp-export-button {
    background:
        #ffffff !important;

    border:
        1px solid
        #515761 !important;

    color:
        #333942 !important;
}

.pp-export-button:hover,
.pp-export-button:focus,
.pp-export-button:active {
    background:
        #f6f7f8 !important;

    border-color:
        #343942 !important;

    color:
        #242930 !important;
}


/* ============================================================
   TABLE
============================================================ */

.pp-table-card {
    background: #ffffff;

    border-radius: 14px;

    overflow: hidden;

    box-shadow:
        0 6px 22px
        rgba(24, 29, 52, 0.05);
}

.pp-table {
    margin: 0;
}

.pp-table thead th {
    background: #25325a;

    color: #ffffff;

    border: 0;

    padding: 15px 13px;

    font-size: 12px;

    font-weight: 800;

    white-space: nowrap;

    vertical-align: middle;
}

.pp-table tbody td {
    padding: 13px;

    border-color: #edf0f5;

    font-size: 13px;

    color: #31384d;

    vertical-align: middle;
}

.pp-table tbody tr:hover {
    background: #fafaff;
}

.pp-plan-no {
    color: #344cc5;

    font-weight: 700;
}

.pp-empty {
    text-align: center;

    padding: 40px !important;

    color: #8b92a7 !important;
}


/* ============================================================
   ACTION BUTTONS
   SAME OUTLINE STYLE AS PRODUCTION ORDER
============================================================ */

.pp-action-button {
    width: 37px !important;
    height: 37px !important;

    padding: 0 !important;

    border-radius: 8px !important;

    margin-right: 7px;

    display: inline-flex !important;

    align-items: center !important;

    justify-content: center !important;

    background: #ffffff !important;

    box-shadow: none !important;

    transition: all 0.18s ease !important;
}

.pp-edit-button {
    background:
        #ffffff !important;

    color:
        #314965 !important;

    border:
        1px solid
        #c65b30 !important;
}

.pp-edit-button:hover,
.pp-edit-button:focus,
.pp-edit-button:active {
    background:
        #f6f4ff !important;

    color:
        #5c49ef !important;

    border-color:
        #6753f5 !important;
}

.pp-delete-button {
    background:
        #ffffff !important;

    color:
        #ef5360 !important;

    border:
        1px solid
        #ef5360 !important;
}

.pp-delete-button:hover,
.pp-delete-button:focus,
.pp-delete-button:active {
    background:
        #fff5f6 !important;

    color:
        #dc3e4b !important;

    border-color:
        #e24451 !important;
}


/* ============================================================
   STATUS
============================================================ */

.pp-status {
    display: inline-flex;

    align-items: center;

    justify-content: center;

    min-width: 74px;

    border-radius: 20px;

    padding: 5px 11px;

    color: #ffffff;

    background: #1885f2;

    font-size: 11px;

    font-weight: 800;
}

.pp-status.pending {
    background: #f0a500;
}

.pp-status.completed {
    background: #18a66b;
}

.pp-status.in-progress {
    background: #314965;
}

.pp-status.hold {
    background: #ee704c;
}

.pp-status.cancelled {
    background: #e84b5d;
}


/* ============================================================
   MODAL
============================================================ */

.pp-modal .modal-content {
    border: 0;

    border-radius: 15px;

    overflow: hidden;

    box-shadow:
        0 20px 65px
        rgba(24, 29, 52, 0.24);
}

.pp-modal .modal-header {
    background: #ffffff;

    border-bottom:
        1px solid
        #edf0f5;

    padding: 18px 22px;
}

.pp-modal .modal-title {
    font-weight: 800;

    color: #202945;

    font-size: 18px;
}

.pp-modal .modal-body {
    padding: 22px;
}

.pp-modal .modal-footer {
    border-top:
        1px solid
        #edf0f5;

    padding: 14px 22px;
}

.pp-modal .form-label {
    color: #51596d;

    font-size: 12px;

    font-weight: 700;

    margin-bottom: 5px;
}

.pp-modal .form-control,
.pp-modal .form-select {
    min-height: 39px;

    border-radius: 8px;

    border-color: #dfe2eb;

    font-size: 13px;
}

.pp-modal .form-control:focus,
.pp-modal .form-select:focus {
    border-color: #c65b30;

    box-shadow:
        0 0 0 0.17rem
        rgba(117, 97, 255, 0.12);
}

.pp-modal-subheader {
    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 15px;
}

.pp-modal-subtitle {
    font-size: 14px;

    color: #242c48;

    font-weight: 800;
}

.pp-help {
    color: #8a91a5;

    font-size: 11px;

    margin-top: 4px;
}


/* MODAL PRIMARY BUTTON */

.pp-modal-primary {
    border:
        1px solid
        #314965 !important;

    color:
        #ffffff !important;

    background:
        linear-gradient(
            135deg,
            #314965,
            #314965
        ) !important;

    border-radius:
        8px !important;

    font-weight:
        700 !important;
}

.pp-modal-primary:hover {
    background:
        linear-gradient(
            135deg,
            #5d4ce9,
            #6e59e8
        ) !important;

    color:
        #ffffff !important;
}


/* ============================================================
   EXECUTE OPTION
============================================================ */

.pp-execute-option {
    border: 1px solid #e0e2ec;

    border-radius: 12px;

    background: #ffffff;

    padding: 24px;

    height: 100%;

    cursor: pointer;

    transition: 0.18s ease;
}

.pp-execute-option:hover {
    border-color: #314965;

    transform: translateY(-2px);

    box-shadow:
        0 8px 24px
        rgba(91, 78, 220, 0.10);
}

.pp-execute-icon {
    width: 46px;

    height: 46px;

    border-radius: 10px;

    background: #f1efff;

    color: #314965;

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 21px;

    margin-bottom: 14px;
}

.pp-execute-title {
    color: #252e4c;

    font-weight: 800;

    font-size: 15px;
}

.pp-execute-description {
    color: #82899d;

    font-size: 12px;

    margin-top: 5px;
}

.pp-context-box {
    background: #f8f9fd;

    border: 1px solid #eaecf3;

    padding: 13px;

    border-radius: 9px;

    margin-bottom: 18px;
}

.pp-context-label {
    color: #8990a4;

    font-size: 10px;

    text-transform: uppercase;

    font-weight: 800;
}

.pp-context-value {
    color: #333b55;

    font-size: 12px;

    margin-top: 3px;

    word-break: break-all;
}


/* ============================================================
   TOAST
============================================================ */

.pp-toast {
    position: fixed;

    top: 85px;

    right: 25px;

    z-index: 99999;

    min-width: 340px;

    max-width: 480px;

    padding: 13px 17px;

    border-radius: 9px;

    font-size: 13px;

    font-weight: 700;

    box-shadow:
        0 8px 30px
        rgba(0, 0, 0, 0.16);
}

.pp-toast.success {
    background: #daf5e7;

    color: #166b43;

    border: 1px solid #b9e9cf;
}

.pp-toast.error {
    background: #fde1e4;

    color: #9e2530;

    border: 1px solid #f5b9bf;
}

`;


/* ============================================================
   HELPERS
============================================================ */

const sameId = (a, b) =>
    String(a ?? "") === String(b ?? "");


const responseRows = response => {

    if (Array.isArray(response)) {
        return response;
    }

    if (
        Array.isArray(
            response?.data?.data
        )
    ) {
        return response.data.data;
    }

    if (
        Array.isArray(
            response?.data
        )
    ) {
        return response.data;
    }

    return [];
};


const responseData = response => {

    if (
        response?.data?.data !==
        undefined
    ) {
        return response.data.data;
    }

    if (
        response?.data !==
        undefined
    ) {
        return response.data;
    }

    return response;
};


const getErrorMessage = (
    error,
    fallback = "Something went wrong."
) => {

    const body =
        error?.response?.data;

    if (
        Array.isArray(body?.errors) &&
        body.errors.length
    ) {

        return `${
            body.message ||
            "Validation failed."
        } ${body.errors.join(", ")}`;
    }

    return (
        body?.message ||
        error?.message ||
        fallback
    );
};


const today = () => {

    const d =
        new Date();

    const local =
        new Date(
            d.getTime() -
            d.getTimezoneOffset() *
            60000
        );

    return local
        .toISOString()
        .slice(0, 10);
};


const toDateInput = value => {

    if (!value) {
        return "";
    }

    return String(value)
        .slice(0, 10);
};


const toDateTimeInput = value => {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    const local =
        new Date(
            date.getTime() -
            date.getTimezoneOffset() *
            60000
        );

    return local
        .toISOString()
        .slice(0, 16);
};


const toTimestamp = value => {

    if (!value) {
        return null;
    }

    const d =
        new Date(value);

    if (
        Number.isNaN(
            d.getTime()
        )
    ) {
        return value;
    }

    return d.toISOString();
};


const statusClass = status => {

    return String(
        status || ""
    )
        .toLowerCase()
        .replaceAll(
            "_",
            "-"
        );
};


const cleanObject = object =>
    Object.fromEntries(
        Object.entries(object)
            .filter(
                ([, value]) =>
                    value !== "" &&
                    value !== undefined
            )
    );


/* ============================================================
   EMPTY FORMS
============================================================ */

const emptyPlan = () => ({

    company_id: "",
    plant_id: "",
    line_id: "",
    shift_id: "",

    order_id: "",

    plan_no: "",
    revision_no: 1,

    supersedes_plan_id: "",

    plan_date: today(),
    planned_qty: "",

    planned_start: "",
    planned_end: "",

    plan_source: "MANUAL",

    schedule_rule_id: "",

    status: "CREATED"
});


const emptyEntry = () => ({

    plan_entry_id: "",

    order_item_id: "",

    machine_id: "",
    part_id: "",
    process_id: "",

    shift_id: "",

    sequence_no: 1,

    previous_plan_entry_id: "",

    target_qty: "",

    planned_start: "",
    planned_end: "",

    planned_operator_user_id: "",

    status: "PENDING"
});


const emptyOperation = () => ({

    plan_operation_id: "",

    plan_entry_id: "",

    route_step_id: "",

    process_id: "",

    machine_id: "",

    operation_sequence_no: 1,

    operation_type: "",

    target_qty: "",

    planned_start: "",

    planned_end: "",

    status: "PENDING"
});


const emptyHistory = () => ({

    target_type: "PLAN",

    plan_id: "",

    plan_entry_id: "",

    event_type: "",

    new_status: "",

    reason: "",

    source_system: "MES",

    correlation_id: "",

    idempotency_key: ""
});


const emptyExecutionEvent = () => ({

    target_type: "PLAN",

    plan_id: "",

    plan_entry_id: "",

    plan_operation_id: "",

    event_type: "",

    result_status: "COMPLETED",

    new_status: "",

    reason: "",

    source_system: "MES",

    correlation_id: "",

    idempotency_key: "",

    payload: "{}"
});


/* ============================================================
   STATUS PILL
============================================================ */

const StatusPill = ({
    status
}) => (

    <span
        className={
            `pp-status ${statusClass(
                status
            )}`
        }
    >
        {status || "-"}
    </span>
);


/* ============================================================
   MAIN
============================================================ */

const ProductionPlan = () => {

    const queryClient =
        useQueryClient();


    /* ========================================================
       GENERAL STATE
    ======================================================== */

    const [
        search,
        setSearch
    ] =
        useState("");


    const [
        statusFilter,
        setStatusFilter
    ] =
        useState("");


    const [
        selectedPlanId,
        setSelectedPlanId
    ] =
        useState("");


    const [
        toast,
        setToast
    ] =
        useState(null);


    const notify = (
        message,
        type = "success"
    ) => {

        setToast({
            message,
            type
        });

        window.setTimeout(
            () => {
                setToast(null);
            },
            3500
        );
    };


    /* ========================================================
       PLAN STATE
    ======================================================== */

    const [
        showPlanForm,
        setShowPlanForm
    ] =
        useState(false);


    const [
        editingPlanId,
        setEditingPlanId
    ] =
        useState("");


    const [
        planForm,
        setPlanForm
    ] =
        useState(
            emptyPlan()
        );


    /* ========================================================
       PLAN ENTRY STATE
    ======================================================== */

    const [
        showEntryData,
        setShowEntryData
    ] =
        useState(false);


    const [
        showEntryForm,
        setShowEntryForm
    ] =
        useState(false);


    const [
        entryForm,
        setEntryForm
    ] =
        useState(
            emptyEntry()
        );


    /* ========================================================
       PLAN OPERATION STATE
    ======================================================== */

    const [
        showOperationData,
        setShowOperationData
    ] =
        useState(false);


    const [
        showOperationForm,
        setShowOperationForm
    ] =
        useState(false);


    const [
        operationForm,
        setOperationForm
    ] =
        useState(
            emptyOperation()
        );


    /* ========================================================
       EXECUTE STATE
    ======================================================== */

    const [
        showExecute,
        setShowExecute
    ] =
        useState(false);


    const [
        executeMode,
        setExecuteMode
    ] =
        useState("");


    const [
        historyForm,
        setHistoryForm
    ] =
        useState(
            emptyHistory()
        );


    const [
        eventForm,
        setEventForm
    ] =
        useState(
            emptyExecutionEvent()
        );


    /* ========================================================
       RUNTIME / REPORT
    ======================================================== */

    const [
        showRuntime,
        setShowRuntime
    ] =
        useState(false);


    const [
        runtimeData,
        setRuntimeData
    ] =
        useState([]);


    const [
        runtimeLoading,
        setRuntimeLoading
    ] =
        useState(false);


    const [
        showReport,
        setShowReport
    ] =
        useState(false);


    const [
        reportData,
        setReportData
    ] =
        useState([]);


    const [
        reportLoading,
        setReportLoading
    ] =
        useState(false);


    const [
        reportFrom,
        setReportFrom
    ] =
        useState(today());


    const [
        reportTo,
        setReportTo
    ] =
        useState(today());


    /* ========================================================
       PLAN MASTER QUERY
    ======================================================== */

    const plansQuery =
        useQuery({

            queryKey: [
                "production-plan",
                "master"
            ],

            queryFn:
                () =>
                    productionPlanService
                        .getMaster()
        });


    const plans =
        responseRows(
            plansQuery.data
        );


    /* ========================================================
       LOOKUPS
    ======================================================== */

    const companiesQuery =
        useQuery({

            queryKey: [
                "production-plan-company"
            ],

            queryFn:
                () =>
                    api.get(
                        "/company-master/master"
                    ),

            retry: false
        });


    const plantsQuery =
        useQuery({

            queryKey: [
                "production-plan-plant"
            ],

            queryFn:
                () =>
                    api.get(
                        "/plant-shop-master/master"
                    ),

            retry: false
        });


    const linesQuery =
        useQuery({

            queryKey: [
                "production-plan-line"
            ],

            queryFn:
                () =>
                    api.get(
                        "/line-master/master"
                    ),

            retry: false
        });


    const machinesQuery =
        useQuery({

            queryKey: [
                "production-plan-machine"
            ],

            queryFn:
                () =>
                    api.get(
                        "/machine-master/master"
                    ),

            retry: false
        });


    const partsQuery =
        useQuery({

            queryKey: [
                "production-plan-part"
            ],

            queryFn:
                () =>
                    api.get(
                        "/part-master/master"
                    ),

            retry: false
        });


    const processesQuery =
        useQuery({

            queryKey: [
                "production-plan-process"
            ],

            queryFn:
                () =>
                    api.get(
                        "/process-master/config"
                    ),

            retry: false
        });


    const routeStepsQuery =
        useQuery({

            queryKey: [
                "production-plan-route-step"
            ],

            queryFn:
                () =>
                    api.get(
                        "/route-station-master/config/step"
                    ),

            retry: false
        });


    const companies =
        responseRows(
            companiesQuery.data
        );


    const plants =
        responseRows(
            plantsQuery.data
        );


    const lines =
        responseRows(
            linesQuery.data
        );


    const machines =
        responseRows(
            machinesQuery.data
        );


    const parts =
        responseRows(
            partsQuery.data
        );


    const processes =
        responseRows(
            processesQuery.data
        );


    const routeSteps =
        responseRows(
            routeStepsQuery.data
        );


    /* ========================================================
       CONFIG QUERY
    ======================================================== */

    const configQuery =
        useQuery({

            queryKey: [
                "production-plan",
                "config",
                selectedPlanId
            ],

            queryFn:
                () =>
                    productionPlanService
                        .getConfig(
                            selectedPlanId
                        ),

            enabled:
                Boolean(
                    selectedPlanId
                )
        });


    const config =
        responseData(
            configQuery.data
        ) || {};


    const entries =
        Array.isArray(
            config.plan_entries
        )
            ? config.plan_entries
            : [];


    const operations =
        Array.isArray(
            config.plan_operations
        )
            ? config.plan_operations
            : [];


    /* ========================================================
       SELECTED DATA
    ======================================================== */

    const selectedPlan =
        useMemo(
            () =>
                plans.find(
                    item =>
                        sameId(
                            item.plan_id,
                            selectedPlanId
                        )
                ) || null,
            [
                plans,
                selectedPlanId
            ]
        );


    const historyEntry =
        entries.find(
            item =>
                sameId(
                    item.plan_entry_id,
                    historyForm.plan_entry_id
                )
        );


    const eventEntry =
        entries.find(
            item =>
                sameId(
                    item.plan_entry_id,
                    eventForm.plan_entry_id
                )
        );


    const eventOperation =
        operations.find(
            item =>
                sameId(
                    item.plan_operation_id,
                    eventForm.plan_operation_id
                )
        );


    /* ========================================================
       NAME HELPERS
    ======================================================== */

    const companyName = id => {

        const item =
            companies.find(
                row =>
                    sameId(
                        row.company_id,
                        id
                    )
            );

        return (
            item?.company_name ||
            item?.company_code ||
            id ||
            "-"
        );
    };


    const plantName = id => {

        const item =
            plants.find(
                row =>
                    sameId(
                        row.plant_id,
                        id
                    )
            );

        return (
            item?.plant_name ||
            item?.shop_name ||
            item?.plant_code ||
            id ||
            "-"
        );
    };


    const lineName = id => {

        const item =
            lines.find(
                row =>
                    sameId(
                        row.line_id,
                        id
                    )
            );

        return (
            item?.line_name ||
            item?.line_code ||
            id ||
            "-"
        );
    };


    const machineName = id => {

        const item =
            machines.find(
                row =>
                    sameId(
                        row.machine_id,
                        id
                    )
            );

        return (
            item?.machine_name ||
            item?.machine_code ||
            id ||
            "-"
        );
    };


    const partName = id => {

        const item =
            parts.find(
                row =>
                    sameId(
                        row.part_id,
                        id
                    )
            );

        return (
            item?.part_name ||
            item?.part_code ||
            id ||
            "-"
        );
    };


    const processName = id => {

        const item =
            processes.find(
                row =>
                    sameId(
                        row.process_id,
                        id
                    )
            );

        return (
            item?.process_name ||
            item?.process_code ||
            id ||
            "-"
        );
    };


    const routeStepName = id => {

        const item =
            routeSteps.find(
                row =>
                    sameId(
                        row.route_step_id,
                        id
                    )
            );

        return (
            item?.step_name ||
            item?.route_step_name ||
            item?.stage_name ||
            item?.stage_code ||
            id ||
            "-"
        );
    };


    /* ========================================================
       FILTERS
    ======================================================== */

    const filteredPlans =
        useMemo(
            () => {

                const value =
                    search
                        .trim()
                        .toLowerCase();


                return plans.filter(
                    plan => {

                        if (
                            statusFilter &&
                            String(
                                plan.status ||
                                ""
                            ) !==
                            statusFilter
                        ) {
                            return false;
                        }


                        if (!value) {
                            return true;
                        }


                        const text = [

                            plan.plan_no,

                            plan.revision_no,

                            companyName(
                                plan.company_id
                            ),

                            plantName(
                                plan.plant_id
                            ),

                            lineName(
                                plan.line_id
                            ),

                            plan.shift_id,

                            plan.plan_date,

                            plan.plan_source,

                            plan.status

                        ]
                            .join(" ")
                            .toLowerCase();


                        return text.includes(
                            value
                        );
                    }
                );
            },
            [
                plans,
                search,
                statusFilter,
                companies,
                plants,
                lines
            ]
        );


    const availableStatuses =
        useMemo(
            () =>
                [
                    ...new Set(
                        plans
                            .map(
                                plan =>
                                    plan.status
                            )
                            .filter(Boolean)
                    )
                ],
            [plans]
        );


    /* ========================================================
       REFRESH
    ======================================================== */

    const refresh =
        async () => {

            await queryClient
                .invalidateQueries({
                    queryKey: [
                        "production-plan"
                    ]
                });
        };


    /* ========================================================
       PLAN MUTATION
    ======================================================== */

    const planMutation =
        useMutation({

            mutationFn:
                async ({
                    id,
                    payload
                }) => {

                    if (id) {

                        return productionPlanService
                            .updateMaster(
                                id,
                                payload
                            );
                    }


                    return productionPlanService
                        .createMaster(
                            payload
                        );
                },

            onSuccess:
                async () => {

                    await refresh();

                    setShowPlanForm(
                        false
                    );

                    notify(
                        editingPlanId
                            ? "Production Plan updated successfully."
                            : "Production Plan created successfully."
                    );
                },

            onError:
                error => {

                    notify(
                        getErrorMessage(
                            error,
                            "Unable to save Production Plan."
                        ),
                        "error"
                    );
                }
        });


    /* ========================================================
       CONFIG MUTATION
    ======================================================== */

    const configMutation =
        useMutation({

            mutationFn:
                payload =>
                    productionPlanService
                        .saveConfig(
                            payload
                        ),

            onSuccess:
                async () => {

                    await queryClient
                        .invalidateQueries({
                            queryKey: [
                                "production-plan",
                                "config",
                                selectedPlanId
                            ]
                        });
                },

            onError:
                error => {

                    notify(
                        getErrorMessage(
                            error,
                            "Unable to save configuration."
                        ),
                        "error"
                    );
                }
        });


    /* ========================================================
       EXECUTE MUTATION
    ======================================================== */

    const executeMutation =
        useMutation({

            mutationFn:
                payload =>
                    productionPlanService
                        .execute(
                            payload
                        ),

            onSuccess:
                async () => {

                    await refresh();


                    await queryClient
                        .invalidateQueries({
                            queryKey: [
                                "production-plan",
                                "config",
                                selectedPlanId
                            ]
                        });


                    setShowExecute(
                        false
                    );


                    setExecuteMode(
                        ""
                    );


                    notify(
                        "Execute action completed successfully."
                    );
                },

            onError:
                error => {

                    notify(
                        getErrorMessage(
                            error,
                            "Unable to execute action."
                        ),
                        "error"
                    );
                }
        });


    /* ========================================================
       PLAN FORM
    ======================================================== */

    const openAddPlan =
        () => {

            setEditingPlanId(
                ""
            );

            setPlanForm(
                emptyPlan()
            );

            setShowPlanForm(
                true
            );
        };


    const openEditPlan =
        plan => {

            setEditingPlanId(
                plan.plan_id
            );


            setPlanForm({

                company_id:
                    plan.company_id ||
                    "",

                plant_id:
                    plan.plant_id ||
                    "",

                line_id:
                    plan.line_id ||
                    "",

                shift_id:
                    plan.shift_id ??
                    "",

                order_id:
                    plan.order_id ||
                    "",

                plan_no:
                    plan.plan_no ||
                    "",

                revision_no:
                    plan.revision_no ||
                    1,

                supersedes_plan_id:
                    plan.supersedes_plan_id ||
                    "",

                plan_date:
                    toDateInput(
                        plan.plan_date
                    ),

                planned_qty:
                    plan.planned_qty ??
                    "",

                planned_start:
                    toDateTimeInput(
                        plan.planned_start
                    ),

                planned_end:
                    toDateTimeInput(
                        plan.planned_end
                    ),

                plan_source:
                    plan.plan_source ||
                    "MANUAL",

                schedule_rule_id:
                    plan.schedule_rule_id ||
                    "",

                status:
                    plan.status ||
                    "CREATED"
            });


            setShowPlanForm(
                true
            );
        };


    const savePlan =
        event => {

            event.preventDefault();


            const payload = {

                company_id:
                    planForm.company_id,

                plant_id:
                    planForm.plant_id,

                line_id:
                    planForm.line_id,

                shift_id:
                    Number(
                        planForm.shift_id
                    ),

                order_id:
                    planForm.order_id ||
                    null,

                plan_no:
                    planForm.plan_no,

                revision_no:
                    Number(
                        planForm.revision_no
                    ),

                supersedes_plan_id:
                    planForm
                        .supersedes_plan_id ||
                    null,

                plan_date:
                    planForm.plan_date,

                planned_qty:
                    Number(
                        planForm.planned_qty
                    ),

                planned_start:
                    toTimestamp(
                        planForm.planned_start
                    ),

                planned_end:
                    toTimestamp(
                        planForm.planned_end
                    ),

                plan_source:
                    planForm.plan_source,

                schedule_rule_id:
                    planForm.schedule_rule_id ||
                    null,

                status:
                    planForm.status
            };


            planMutation.mutate({

                id:
                    editingPlanId,

                payload
            });
        };


    const softDeletePlan =
        async plan => {

            const value =
                window.prompt(
                    `Enter configured soft-delete status for ${plan.plan_no}:`
                );


            if (
                !value ||
                !value.trim()
            ) {
                return;
            }


            try {

                await productionPlanService
                    .softDeleteMaster(
                        plan.plan_id,
                        value.trim()
                    );


                await refresh();


                notify(
                    "Production Plan soft deleted successfully."
                );

            }
            catch (error) {

                notify(
                    getErrorMessage(
                        error,
                        "Unable to soft delete Production Plan."
                    ),
                    "error"
                );
            }
        };


    /* ========================================================
       PLAN ENTRY
    ======================================================== */

    const openEntryData =
        () => {

            if (
                !selectedPlanId &&
                plans.length
            ) {

                setSelectedPlanId(
                    plans[0].plan_id
                );
            }


            setShowEntryData(
                true
            );
        };


    const openAddEntry =
        () => {

            if (
                !selectedPlanId
            ) {

                notify(
                    "Select Production Plan first.",
                    "error"
                );

                return;
            }


            setEntryForm({

                ...emptyEntry(),

                shift_id:
                    selectedPlan
                        ?.shift_id ??
                    "",

                target_qty:
                    selectedPlan
                        ?.planned_qty ??
                    "",

                planned_start:
                    toDateTimeInput(
                        selectedPlan
                            ?.planned_start
                    ),

                planned_end:
                    toDateTimeInput(
                        selectedPlan
                            ?.planned_end
                    )
            });


            setShowEntryForm(
                true
            );
        };


    const openEditEntry =
        row => {

            setEntryForm({

                plan_entry_id:
                    row.plan_entry_id,

                order_item_id:
                    row.order_item_id ||
                    "",

                machine_id:
                    row.machine_id ||
                    "",

                part_id:
                    row.part_id ||
                    "",

                process_id:
                    row.process_id ||
                    "",

                shift_id:
                    row.shift_id ??
                    "",

                sequence_no:
                    row.sequence_no ??
                    1,

                previous_plan_entry_id:
                    row.previous_plan_entry_id ||
                    "",

                target_qty:
                    row.target_qty ??
                    "",

                planned_start:
                    toDateTimeInput(
                        row.planned_start
                    ),

                planned_end:
                    toDateTimeInput(
                        row.planned_end
                    ),

                planned_operator_user_id:
                    row.planned_operator_user_id ??
                    "",

                status:
                    row.status ||
                    "PENDING"
            });


            setShowEntryForm(
                true
            );
        };


    const saveEntry =
        event => {

            event.preventDefault();


            const item = {

                machine_id:
                    entryForm.machine_id,

                part_id:
                    entryForm.part_id,

                process_id:
                    entryForm.process_id,

                shift_id:
                    Number(
                        entryForm.shift_id
                    ),

                order_item_id:
                    entryForm.order_item_id ||
                    null,

                sequence_no:
                    Number(
                        entryForm.sequence_no
                    ),

                previous_plan_entry_id:
                    entryForm
                        .previous_plan_entry_id ||
                    null,

                target_qty:
                    Number(
                        entryForm.target_qty
                    ),

                planned_start:
                    toTimestamp(
                        entryForm.planned_start
                    ),

                planned_end:
                    toTimestamp(
                        entryForm.planned_end
                    ),

                planned_operator_user_id:
                    entryForm
                        .planned_operator_user_id

                        ? Number(
                            entryForm
                                .planned_operator_user_id
                        )

                        : null,

                status:
                    entryForm.status
            };


            if (
                entryForm.plan_entry_id
            ) {

                item.plan_entry_id =
                    entryForm.plan_entry_id;
            }


            configMutation.mutate(
                {

                    plan_id:
                        selectedPlanId,

                    plan_entries: [
                        item
                    ]

                },
                {

                    onSuccess:
                        () => {

                            setShowEntryForm(
                                false
                            );


                            notify(
                                entryForm.plan_entry_id
                                    ? "Plan Entry updated successfully."
                                    : "Plan Entry created successfully."
                            );
                        }
                }
            );
        };


    /* ========================================================
       PLAN OPERATION
    ======================================================== */

    const openOperationData =
        () => {

            if (
                !selectedPlanId &&
                plans.length
            ) {

                setSelectedPlanId(
                    plans[0].plan_id
                );
            }


            setShowOperationData(
                true
            );
        };


    const openAddOperation =
        () => {

            if (
                !selectedPlanId
            ) {

                notify(
                    "Select Production Plan first.",
                    "error"
                );

                return;
            }


            if (
                !entries.length
            ) {

                notify(
                    "Create Plan Entry first.",
                    "error"
                );

                return;
            }


            setOperationForm({

                ...emptyOperation(),

                plan_entry_id:
                    entries.length === 1

                        ? entries[0]
                            .plan_entry_id

                        : ""
            });


            setShowOperationForm(
                true
            );
        };


    const openEditOperation =
        row => {

            setOperationForm({

                plan_operation_id:
                    row.plan_operation_id,

                plan_entry_id:
                    row.plan_entry_id ||
                    "",

                route_step_id:
                    row.route_step_id ||
                    "",

                process_id:
                    row.process_id ||
                    "",

                machine_id:
                    row.machine_id ||
                    "",

                operation_sequence_no:
                    row.operation_sequence_no ??
                    1,

                operation_type:
                    row.operation_type ||
                    "",

                target_qty:
                    row.target_qty ??
                    "",

                planned_start:
                    toDateTimeInput(
                        row.planned_start
                    ),

                planned_end:
                    toDateTimeInput(
                        row.planned_end
                    ),

                status:
                    row.status ||
                    "PENDING"
            });


            setShowOperationForm(
                true
            );
        };


    const saveOperation =
        event => {

            event.preventDefault();


            const item = {

                plan_entry_id:
                    operationForm
                        .plan_entry_id,

                route_step_id:
                    operationForm
                        .route_step_id ||
                    null,

                process_id:
                    operationForm
                        .process_id,

                machine_id:
                    operationForm
                        .machine_id ||
                    null,

                operation_sequence_no:
                    Number(
                        operationForm
                            .operation_sequence_no
                    ),

                operation_type:
                    operationForm
                        .operation_type,

                target_qty:
                    operationForm
                        .target_qty === ""

                        ? null

                        : Number(
                            operationForm
                                .target_qty
                        ),

                planned_start:
                    toTimestamp(
                        operationForm
                            .planned_start
                    ),

                planned_end:
                    toTimestamp(
                        operationForm
                            .planned_end
                    ),

                status:
                    operationForm.status
            };


            if (
                operationForm
                    .plan_operation_id
            ) {

                item.plan_operation_id =
                    operationForm
                        .plan_operation_id;
            }


            configMutation.mutate(
                {

                    plan_id:
                        selectedPlanId,

                    plan_operations: [
                        item
                    ]

                },
                {

                    onSuccess:
                        () => {

                            setShowOperationForm(
                                false
                            );


                            notify(
                                operationForm
                                    .plan_operation_id

                                    ? "Plan Operation updated successfully."

                                    : "Plan Operation created successfully."
                            );
                        }
                }
            );
        };


    /* ========================================================
       EXECUTE
    ======================================================== */

    const openExecute =
        () => {

            setExecuteMode(
                ""
            );


            setHistoryForm(
                emptyHistory()
            );


            setEventForm(
                emptyExecutionEvent()
            );


            setShowExecute(
                true
            );
        };


    const handleHistoryPlan =
        planId => {

            setSelectedPlanId(
                planId
            );


            setHistoryForm(
                previous => ({

                    ...previous,

                    plan_id:
                        planId,

                    plan_entry_id:
                        ""
                })
            );
        };


    const handleEventPlan =
        planId => {

            setSelectedPlanId(
                planId
            );


            setEventForm(
                previous => ({

                    ...previous,

                    plan_id:
                        planId,

                    plan_entry_id:
                        "",

                    plan_operation_id:
                        ""
                })
            );
        };


    const saveHistory =
        event => {

            event.preventDefault();


            executeMutation.mutate({

                target_type:
                    historyForm.target_type,

                plan_id:
                    historyForm.plan_id,

                plan_entry_id:
                    historyForm.target_type ===
                    "PLAN_ENTRY"

                        ? historyForm
                            .plan_entry_id

                        : null,

                plan_operation_id:
                    null,

                event_type:
                    historyForm.event_type,

                new_status:
                    historyForm.new_status,

                reason:
                    historyForm.reason ||
                    null,

                result_status:
                    "COMPLETED",

                source_system:
                    historyForm.source_system ||
                    "MES",

                correlation_id:
                    historyForm.correlation_id ||
                    null,

                idempotency_key:
                    historyForm.idempotency_key ||
                    null,

                payload: {

                    execution_form:
                        "PLAN_STATUS_HISTORY"
                }
            });
        };


    const saveExecutionEvent =
        event => {

            event.preventDefault();


            let payload = {};


            try {

                payload =
                    JSON.parse(
                        eventForm.payload ||
                        "{}"
                    );

            }
            catch {

                notify(
                    "Payload must be valid JSON object.",
                    "error"
                );

                return;
            }


            executeMutation.mutate({

                target_type:
                    eventForm.target_type,

                plan_id:
                    eventForm.plan_id,

                plan_entry_id:
                    eventForm.target_type ===
                    "PLAN"

                        ? null

                        : eventForm
                            .plan_entry_id,

                plan_operation_id:
                    eventForm.target_type ===
                    "PLAN_OPERATION"

                        ? eventForm
                            .plan_operation_id

                        : null,

                event_type:
                    eventForm.event_type,

                new_status:
                    eventForm.new_status ||
                    null,

                reason:
                    eventForm.reason ||
                    null,

                result_status:
                    eventForm.result_status ||
                    "COMPLETED",

                source_system:
                    eventForm.source_system ||
                    "MES",

                correlation_id:
                    eventForm.correlation_id ||
                    null,

                idempotency_key:
                    eventForm.idempotency_key ||
                    null,

                payload
            });
        };


    /* ========================================================
       RUNTIME
    ======================================================== */

    const openRuntime =
        async () => {

            setShowRuntime(
                true
            );


            setRuntimeLoading(
                true
            );


            try {

                const response =
                    await productionPlanService
                        .getRuntime();


                setRuntimeData(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                notify(
                    getErrorMessage(
                        error,
                        "Unable to fetch runtime data."
                    ),
                    "error"
                );

            }
            finally {

                setRuntimeLoading(
                    false
                );
            }
        };


    /* ========================================================
       REPORT
    ======================================================== */

    const fetchReport =
        async () => {

            setReportLoading(
                true
            );


            try {

                const response =
                    await productionPlanService
                        .getReport(
                            cleanObject({

                                from_date:
                                    reportFrom,

                                to_date:
                                    reportTo,

                                status:
                                    statusFilter
                            })
                        );


                setReportData(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                notify(
                    getErrorMessage(
                        error,
                        "Unable to fetch report."
                    ),
                    "error"
                );

            }
            finally {

                setReportLoading(
                    false
                );
            }
        };


    const openReport =
        async () => {

            setShowReport(
                true
            );


            await fetchReport();
        };


    /* ========================================================
       EXPORT
    ======================================================== */

    const exportData =
        async () => {

            try {

                const response =
                    await productionPlanService
                        .exportData(
                            cleanObject({

                                status:
                                    statusFilter
                            })
                        );


                const rows =
                    responseRows(
                        response
                    );


                if (
                    !rows.length
                ) {

                    notify(
                        "No export data found.",
                        "error"
                    );

                    return;
                }


                const columns =
                    Object.keys(
                        rows[0]
                    );


                const csv = [

                    columns.join(","),

                    ...rows.map(
                        row =>
                            columns
                                .map(
                                    key =>
                                        `"${String(
                                            row[key] ??
                                            ""
                                        )
                                            .replaceAll(
                                                '"',
                                                '""'
                                            )}"`
                                )
                                .join(",")
                    )

                ].join("\r\n");


                const blob =
                    new Blob(
                        [
                            "\uFEFF" +
                            csv
                        ],
                        {
                            type:
                                "text/csv;charset=utf-8"
                        }
                    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                const a =
                    document.createElement(
                        "a"
                    );


                a.href =
                    url;


                a.download =
                    `production-plan-${today()}.csv`;


                a.click();


                URL.revokeObjectURL(
                    url
                );


                notify(
                    "Production Plan exported successfully."
                );

            }
            catch (error) {

                notify(
                    getErrorMessage(
                        error,
                        "Unable to export."
                    ),
                    "error"
                );
            }
        };


    /* ========================================================
       RENDER
    ======================================================== */

    const visualLiveStatus=useLiveRefresh(showRuntime,async()=>{const response=await productionPlanService.getRuntime();setRuntimeData(responseRows(response));});
    return (

        <> <OperationsLaunch onRuntime={openRuntime} onReport={openReport}/><>

<div
            className="production-plan-page"
        >

            <style>
                {styles}
            </style>


            {/* TOAST */}

            {
                toast && (

                    <div
                        className={
                            `pp-toast ${toast.type}`
                        }
                    >
                        {toast.message}
                    </div>
                )
            }


            {/* =================================================
                HEADER
            ================================================= */}

            <div
                className="pp-header"
            >

                <Row
                    className="align-items-center"
                >

                    <Col lg={4}>

                        <h2
                            className="pp-header-title"
                        >
                            Production Plan
                        </h2>


                        <div
                            className="pp-breadcrumb"
                        >
                            Planning / Production Plan
                        </div>

                    </Col>


                    <Col lg={8}>

                        <div
                            className="pp-header-buttons"
                        >

                            <Button
                                variant="outline-primary"
                                className="pp-outline-button"
                                onClick={
                                    openEntryData
                                }
                            >
                                <ListUl size={15} />

                                Plan Entry
                            </Button>


                            <Button
                                variant="outline-primary"
                                className="pp-outline-button"
                                onClick={
                                    openOperationData
                                }
                            >
                                <Diagram3 size={15} />

                                Plan Operation
                            </Button>


                            <Button
                                variant="primary"
                                className="pp-add-button"
                                onClick={
                                    openAddPlan
                                }
                            >
                                <PlusLg size={14} />

                                Add Production Plan
                            </Button>

                        </div>

                    </Col>

                </Row>

            </div>


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div
                className="pp-toolbar"
            >

                <Row
                    className="align-items-center g-3"
                >

                    <Col
                        xl={5}
                        lg={5}
                    >

                        <div
                            className="pp-search-wrapper"
                        >

                            <div
                                className="pp-search-icon"
                            >
                                ⌕
                            </div>


                            <Form.Control
                                className="pp-search-input"
                                placeholder="Search..."
                                value={
                                    search
                                }
                                onChange={
                                    event =>
                                        setSearch(
                                            event.target.value
                                        )
                                }
                            />

                        </div>

                    </Col>


                    <Col
                        xl={3}
                        lg={3}
                    >

                        <Form.Select
                            className="pp-status-filter"
                            value={
                                statusFilter
                            }
                            onChange={
                                event =>
                                    setStatusFilter(
                                        event.target.value
                                    )
                            }
                        >

                            <option value="">
                                All Status
                            </option>


                            {
                                availableStatuses.map(
                                    status => (

                                        <option
                                            key={
                                                status
                                            }
                                            value={
                                                status
                                            }
                                        >
                                            {status}
                                        </option>
                                    )
                                )
                            }

                        </Form.Select>

                    </Col>


                    <Col
                        xl={4}
                        lg={4}
                    >

                        <div
                            className="pp-toolbar-actions"
                        >

                            <Button
                                variant="outline-secondary"
                                title="Refresh"
                                className="pp-tool-button pp-refresh-button"
                                onClick={
                                    refresh
                                }
                            >
                                <ArrowClockwise size={16} />
                            </Button>


                            <Button
                                variant="outline-success"
                                title="Execute"
                                className="pp-tool-button pp-execute-button"
                                onClick={
                                    openExecute
                                }
                            >
                                <PlayFill size={16} />
                            </Button>


                            <Button
                                variant="outline-warning"
                                title="Runtime"
                                className="pp-tool-button pp-runtime-button"
                                onClick={
                                    openRuntime
                                }
                            >
                                <ClockHistory size={16} />
                            </Button>


                            <Button
                                variant="outline-primary"
                                title="Report"
                                className="pp-tool-button pp-report-button"
                                onClick={
                                    openReport
                                }
                            >
                                <FileEarmarkText size={16} />
                            </Button>


                            <Button
                                variant="outline-dark"
                                title="Export"
                                className="pp-tool-button pp-export-button"
                                onClick={
                                    exportData
                                }
                            >
                                <Download size={16} />
                            </Button>

                        </div>

                    </Col>

                </Row>

            </div>


            {/* =================================================
                PRODUCTION PLAN TABLE
            ================================================= */}

            <div
                className="pp-table-card"
            >

                <div
                    className="table-responsive"
                >

                    <DateBoard records={filteredPlans}/><Table
                        className="pp-table"
                    >

                        <thead>

                            <tr>

                                <th>PLAN NO</th>

                                <th>REV.</th>

                                <th>PLANT</th>

                                <th>LINE</th>

                                <th>SHIFT</th>

                                <th>PLAN DATE</th>

                                <th>PLANNED QTY</th>

                                <th>SOURCE</th>

                                <th>STATUS</th>

                                <th>ACTIONS</th>

                            </tr>

                        </thead>


                        <tbody>

                            {
                                plansQuery.isLoading
                                    ? (

                                        <tr>

                                            <td
                                                colSpan={10}
                                                className="pp-empty"
                                            >
                                                <Spinner
                                                    animation="border"
                                                    size="sm"
                                                />
                                            </td>

                                        </tr>
                                    )

                                    : filteredPlans.length ===
                                      0
                                        ? (

                                            <tr>

                                                <td
                                                    colSpan={10}
                                                    className="pp-empty"
                                                >
                                                    No Production Plans found.
                                                </td>

                                            </tr>
                                        )

                                        : filteredPlans.map(
                                            plan => (

                                                <tr
                                                    key={
                                                        plan.plan_id
                                                    }
                                                >

                                                    <td
                                                        className="pp-plan-no"
                                                    >
                                                        {
                                                            plan.plan_no
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            plan.revision_no
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            plantName(
                                                                plan.plant_id
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            lineName(
                                                                plan.line_id
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            plan.shift_id
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            toDateInput(
                                                                plan.plan_date
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            plan.planned_qty
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            plan.plan_source
                                                        }
                                                    </td>


                                                    <td>

                                                        <StatusPill
                                                            status={
                                                                plan.status
                                                            }
                                                        />

                                                    </td>


                                                    <td>

                                                        <Button
                                                            variant="outline-primary"
                                                            title="Edit"
                                                            className="pp-action-button pp-edit-button"
                                                            onClick={
                                                                () =>
                                                                    openEditPlan(
                                                                        plan
                                                                    )
                                                            }
                                                        >
                                                            <PencilSquare
                                                                size={15}
                                                            />
                                                        </Button>


                                                        <Button
                                                            variant="outline-danger"
                                                            title="Delete"
                                                            className="pp-action-button pp-delete-button"
                                                            onClick={
                                                                () =>
                                                                    softDeletePlan(
                                                                        plan
                                                                    )
                                                            }
                                                        >
                                                            <Trash3
                                                                size={15}
                                                            />
                                                        </Button>

                                                    </td>

                                                </tr>
                                            )
                                        )
                            }

                        </tbody>

                    </Table>

                </div>

            </div>


            {/* =================================================
                PRODUCTION PLAN FORM
            ================================================= */}

            <Modal
                show={
                    showPlanForm
                }
                onHide={
                    () =>
                        setShowPlanForm(
                            false
                        )
                }
                size="lg"
                centered
                className="pp-modal"
            >

                <Form
                    onSubmit={
                        savePlan
                    }
                >

                    <Modal.Header
                        closeButton
                    >

                        <Modal.Title>
                            {
                                editingPlanId
                                    ? "Edit Production Plan"
                                    : "Add Production Plan"
                            }
                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Row
                            className="g-3"
                        >

                            <Col md={4}>

                                <Form.Group>

                                    <Form.Label>
                                        Company *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            planForm.company_id
                                        }
                                        disabled={Boolean(editingPlanId)}
                                        onChange={
                                            e =>
                                                setPlanForm(
                                                    old => ({
                                                        ...old,

                                                        company_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Company
                                        </option>

                                        {
                                            companies.map(
                                                item => (

                                                    <option
                                                        key={
                                                            item.company_id
                                                        }
                                                        value={
                                                            item.company_id
                                                        }
                                                    >
                                                        {
                                                            item.company_name ||
                                                            item.company_code
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group>

                                    <Form.Label>
                                        Plant *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            planForm.plant_id
                                        }
                                            disabled={Boolean(editingPlanId)}
                                        onChange={
                                            e =>
                                                setPlanForm(
                                                    old => ({
                                                        ...old,

                                                        plant_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Plant
                                        </option>

                                        {
                                            plants.map(
                                                item => (

                                                    <option
                                                        key={
                                                            item.plant_id
                                                        }
                                                        value={
                                                            item.plant_id
                                                        }
                                                    >
                                                        {
                                                            item.plant_name ||
                                                            item.shop_name ||
                                                            item.plant_code
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group>

                                    <Form.Label>
                                        Line *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            planForm.line_id
                                        }
                                            disabled={Boolean(editingPlanId)}
                                        onChange={
                                            e =>
                                                setPlanForm(
                                                    old => ({
                                                        ...old,

                                                        line_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Line
                                        </option>

                                        {
                                            lines.map(
                                                item => (

                                                    <option
                                                        key={
                                                            item.line_id
                                                        }
                                                        value={
                                                            item.line_id
                                                        }
                                                    >
                                                        {
                                                            item.line_name ||
                                                            item.line_code
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Shift ID *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    value={
                                        planForm.shift_id
                                    }  readOnly={Boolean(editingPlanId)}
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    shift_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={5}>

                                <Form.Label>
                                    Production Order ID
                                </Form.Label>

                                <Form.Control
                                    value={
                                        planForm.order_id
                                    }
                                    placeholder="Optional UUID"
                                    readOnly={Boolean(editingPlanId)}
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    order_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Plan No *
                                </Form.Label>

                                <Form.Control
                                    required
                                    value={
                                        planForm.plan_no
                                    }
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    plan_no:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Revision *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    value={
                                        planForm.revision_no
                                    }
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    revision_no:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={5}>

                                <Form.Label>
                                    Supersedes Plan
                                </Form.Label>

                                <Form.Select
                                    value={
                                        planForm.supersedes_plan_id
                                    }
                                    disabled={Boolean(editingPlanId)}
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    supersedes_plan_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        None
                                    </option>

                                    {
                                        plans
                                            .filter(
                                                item =>
                                                    !sameId(
                                                        item.plan_id,
                                                        editingPlanId
                                                    )
                                            )
                                            .map(
                                                item => (

                                                    <option
                                                        key={
                                                            item.plan_id
                                                        }
                                                        value={
                                                            item.plan_id
                                                        }
                                                    >
                                                        {
                                                            item.plan_no
                                                        }

                                                        {" / Rev "}

                                                        {
                                                            item.revision_no
                                                        }
                                                    </option>
                                                )
                                            )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Plan Date *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="date"
                                    value={
                                        planForm.plan_date
                                    }
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    plan_date:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Planned Qty *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={
                                        planForm.planned_qty
                                    }
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    planned_qty:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Plan Source *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        planForm.plan_source
                                    }
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    plan_source:
                                                        e.target.value
                                                })
                                            )
                                    }
                                >

                                    {
                                        PLAN_SOURCES.map(
                                            source => (

                                                <option
                                                    key={
                                                        source
                                                    }
                                                    value={
                                                        source
                                                    }
                                                >
                                                    {source}
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Planned Start
                                </Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    value={
                                        planForm.planned_start
                                    }
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    planned_start:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Planned End
                                </Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    value={
                                        planForm.planned_end
                                    }
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    planned_end:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Schedule Rule ID
                                </Form.Label>

                                <Form.Control
                                    placeholder="Optional UUID"
                                    value={
                                        planForm.schedule_rule_id
                                    }   readOnly={Boolean(editingPlanId)}
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    schedule_rule_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Status *
                                </Form.Label>

                                <Form.Control
                                    required
                                    value={
                                        planForm.status
                                    }
                                    onChange={
                                        e =>
                                            setPlanForm(
                                                old => ({
                                                    ...old,

                                                    status:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>

                        </Row>

                    </Modal.Body>


                    <Modal.Footer>

                        <Button
                            variant="secondary"
                            onClick={
                                () =>
                                    setShowPlanForm(
                                        false
                                    )
                            }
                        >
                            Cancel
                        </Button>


                        <Button
                            type="submit"
                            className="pp-modal-primary"
                            disabled={
                                planMutation.isPending
                            }
                        >

                            {
                                planMutation.isPending && (

                                    <Spinner
                                        size="sm"
                                        animation="border"
                                        className="me-2"
                                    />
                                )
                            }

                            Save

                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>


            {/* =================================================
                PLAN ENTRY DATA
            ================================================= */}

            <Modal
                show={
                    showEntryData
                }
                onHide={
                    () =>
                        setShowEntryData(
                            false
                        )
                }
                size="xl"
                centered
                className="pp-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>
                        Plan Entry
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Row
                        className="mb-4"
                    >

                        <Col md={6}>

                            <Form.Label>
                                Production Plan
                            </Form.Label>

                            <Form.Select
                                value={
                                    selectedPlanId
                                }
                                onChange={
                                    e =>
                                        setSelectedPlanId(
                                            e.target.value
                                        )
                                }
                            >

                                <option value="">
                                    Select Production Plan
                                </option>

                                {
                                    plans.map(
                                        item => (

                                            <option
                                                key={
                                                    item.plan_id
                                                }
                                                value={
                                                    item.plan_id
                                                }
                                            >
                                                {
                                                    item.plan_no
                                                }

                                                {" / Rev "}

                                                {
                                                    item.revision_no
                                                }
                                            </option>
                                        )
                                    )
                                }

                            </Form.Select>

                        </Col>

                    </Row>


                    {
                        selectedPlanId && (

                            <>

                                <div
                                    className="pp-modal-subheader"
                                >

                                    <div>

                                        <div
                                            className="pp-modal-subtitle"
                                        >
                                            Plan Entry Data
                                        </div>

                                        <div
                                            className="pp-help"
                                        >
                                            plan_entry table
                                        </div>

                                    </div>


                                    <Button
                                        className="pp-add-button"
                                        onClick={
                                            openAddEntry
                                        }
                                    >
                                        <PlusLg size={13} />

                                        Add Plan Entry
                                    </Button>

                                </div>


                                <div
                                    className="table-responsive"
                                >

                                    <Table
                                        className="pp-table"
                                    >

                                        <thead>

                                            <tr>

                                                <th>SEQUENCE</th>

                                                <th>MACHINE</th>

                                                <th>PART</th>

                                                <th>PROCESS</th>

                                                <th>SHIFT</th>

                                                <th>TARGET QTY</th>

                                                <th>OPERATOR</th>

                                                <th>STATUS</th>

                                                <th>ACTION</th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {
                                                configQuery.isLoading
                                                    ? (

                                                        <tr>

                                                            <td
                                                                colSpan={9}
                                                                className="pp-empty"
                                                            >
                                                                Loading...
                                                            </td>

                                                        </tr>
                                                    )

                                                    : entries.length ===
                                                      0
                                                        ? (

                                                            <tr>

                                                                <td
                                                                    colSpan={9}
                                                                    className="pp-empty"
                                                                >
                                                                    No Plan Entry data found.
                                                                </td>

                                                            </tr>
                                                        )

                                                        : entries.map(
                                                            row => (

                                                                <tr
                                                                    key={
                                                                        row.plan_entry_id
                                                                    }
                                                                >

                                                                    <td>
                                                                        {
                                                                            row.sequence_no
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            machineName(
                                                                                row.machine_id
                                                                            )
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            partName(
                                                                                row.part_id
                                                                            )
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            processName(
                                                                                row.process_id
                                                                            )
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            row.shift_id
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            row.target_qty
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            row.planned_operator_user_id ||
                                                                            "-"
                                                                        }
                                                                    </td>


                                                                    <td>

                                                                        <StatusPill
                                                                            status={
                                                                                row.status
                                                                            }
                                                                        />

                                                                    </td>


                                                                    <td>

                                                                        <Button
                                                                            variant="outline-primary"
                                                                            className="pp-action-button pp-edit-button"
                                                                            onClick={
                                                                                () =>
                                                                                    openEditEntry(
                                                                                        row
                                                                                    )
                                                                            }
                                                                        >
                                                                            <PencilSquare
                                                                                size={15}
                                                                            />
                                                                        </Button>

                                                                    </td>

                                                                </tr>
                                                            )
                                                        )
                                            }

                                        </tbody>

                                    </Table>

                                </div>

                            </>
                        )
                    }

                </Modal.Body>

            </Modal>


            {/* =================================================
                PLAN ENTRY FORM
            ================================================= */}

            <Modal
                show={
                    showEntryForm
                }
                onHide={
                    () =>
                        setShowEntryForm(
                            false
                        )
                }
                size="lg"
                centered
                className="pp-modal"
            >

                <Form
                    onSubmit={
                        saveEntry
                    }
                >

                    <Modal.Header
                        closeButton
                    >

                        <Modal.Title>
                            {
                                entryForm.plan_entry_id
                                    ? "Edit Plan Entry"
                                    : "Add Plan Entry"
                            }
                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Row
                            className="g-3"
                        >

                            <Col md={6}>

                                <Form.Label>
                                    Machine *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        entryForm.machine_id
                                    }  disabled={Boolean(entryForm.plan_entry_id)}
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    machine_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Machine
                                    </option>

                                    {
                                        machines.map(
                                            item => (

                                                <option
                                                    key={
                                                        item.machine_id
                                                    }
                                                    value={
                                                        item.machine_id
                                                    }
                                                >
                                                    {
                                                        item.machine_name ||
                                                        item.machine_code
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Part *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        entryForm.part_id
                                    }  disabled={Boolean(entryForm.plan_entry_id)}
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    part_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Part
                                    </option>

                                    {
                                        parts.map(
                                            item => (

                                                <option
                                                    key={
                                                        item.part_id
                                                    }
                                                    value={
                                                        item.part_id
                                                    }
                                                >
                                                    {
                                                        item.part_name ||
                                                        item.part_code
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            {/* PROCESS DROPDOWN */}

                            <Col md={6}>

                                <Form.Group>

                                    <Form.Label>
                                        Process *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            entryForm.process_id
                                        }  disabled={Boolean(entryForm.plan_entry_id)}
                                        onChange={
                                            e =>
                                                setEntryForm(
                                                    old => ({
                                                        ...old,

                                                        process_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Process
                                        </option>

                                        {
                                            processes.map(
                                                process => (

                                                    <option
                                                        key={
                                                            process.process_id
                                                        }
                                                        value={
                                                            process.process_id
                                                        }
                                                    >
                                                        {
                                                            process.process_name ||
                                                            process.process_code ||
                                                            process.process_id
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Shift ID *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    value={
                                        entryForm.shift_id
                                    } readOnly={Boolean(entryForm.plan_entry_id)}
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    shift_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Sequence *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    value={
                                        entryForm.sequence_no
                                    }
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    sequence_no:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Order Item ID
                                </Form.Label>

                                <Form.Control
                                    placeholder="Optional UUID"
                                    value={
                                        entryForm.order_item_id
                                    } readOnly={Boolean(entryForm.plan_entry_id)}
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    order_item_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Previous Plan Entry
                                </Form.Label>

                                <Form.Select
                                    value={
                                        entryForm.previous_plan_entry_id
                                    } disabled={Boolean(entryForm.plan_entry_id)}
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    previous_plan_entry_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        None
                                    </option>

                                    {
                                        entries
                                            .filter(
                                                row =>
                                                    !sameId(
                                                        row.plan_entry_id,
                                                        entryForm.plan_entry_id
                                                    )
                                            )
                                            .map(
                                                row => (

                                                    <option
                                                        key={
                                                            row.plan_entry_id
                                                        }
                                                        value={
                                                            row.plan_entry_id
                                                        }
                                                    >
                                                        Seq {
                                                            row.sequence_no
                                                        }

                                                        {" - "}

                                                        {
                                                            machineName(
                                                                row.machine_id
                                                            )
                                                        }
                                                    </option>
                                                )
                                            )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Target Qty *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={
                                        entryForm.target_qty
                                    }
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    target_qty:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Operator User ID
                                </Form.Label>

                                <Form.Control
                                    type="number"
                                    min="1"
                                    value={
                                        entryForm
                                            .planned_operator_user_id
                                    }   readOnly={Boolean(entryForm.plan_entry_id)}
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    planned_operator_user_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Status *
                                </Form.Label>

                                <Form.Control
                                    required
                                    value={
                                        entryForm.status
                                    }
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    status:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Planned Start
                                </Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    value={
                                        entryForm.planned_start
                                    }
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    planned_start:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Planned End
                                </Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    value={
                                        entryForm.planned_end
                                    }
                                    onChange={
                                        e =>
                                            setEntryForm(
                                                old => ({
                                                    ...old,

                                                    planned_end:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>

                        </Row>

                    </Modal.Body>


                    <Modal.Footer>

                        <Button
                            variant="secondary"
                            onClick={
                                () =>
                                    setShowEntryForm(
                                        false
                                    )
                            }
                        >
                            Cancel
                        </Button>


                        <Button
                            type="submit"
                            className="pp-modal-primary"
                            disabled={
                                configMutation.isPending
                            }
                        >
                            Save Plan Entry
                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>


            {/* =================================================
                PLAN OPERATION DATA
            ================================================= */}

            <Modal
                show={
                    showOperationData
                }
                onHide={
                    () =>
                        setShowOperationData(
                            false
                        )
                }
                size="xl"
                centered
                className="pp-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>
                        Plan Operation
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Row
                        className="mb-4"
                    >

                        <Col md={6}>

                            <Form.Label>
                                Production Plan
                            </Form.Label>

                            <Form.Select
                                value={
                                    selectedPlanId
                                }
                                onChange={
                                    e =>
                                        setSelectedPlanId(
                                            e.target.value
                                        )
                                }
                            >

                                <option value="">
                                    Select Production Plan
                                </option>

                                {
                                    plans.map(
                                        item => (

                                            <option
                                                key={
                                                    item.plan_id
                                                }
                                                value={
                                                    item.plan_id
                                                }
                                            >
                                                {
                                                    item.plan_no
                                                }

                                                {" / Rev "}

                                                {
                                                    item.revision_no
                                                }
                                            </option>
                                        )
                                    )
                                }

                            </Form.Select>

                        </Col>

                    </Row>


                    {
                        selectedPlanId && (

                            <>

                                <div
                                    className="pp-modal-subheader"
                                >

                                    <div>

                                        <div
                                            className="pp-modal-subtitle"
                                        >
                                            Plan Operation Data
                                        </div>

                                        <div
                                            className="pp-help"
                                        >
                                            plan_operation table
                                        </div>

                                    </div>


                                    <Button
                                        className="pp-add-button"
                                        onClick={
                                            openAddOperation
                                        }
                                    >
                                        <PlusLg size={13} />

                                        Add Plan Operation
                                    </Button>

                                </div>


                                <div
                                    className="table-responsive"
                                >

                                    <Table
                                        className="pp-table"
                                    >

                                        <thead>

                                            <tr>

                                                <th>SEQ.</th>

                                                <th>PLAN ENTRY</th>

                                                <th>ROUTE STEP</th>

                                                <th>PROCESS</th>

                                                <th>MACHINE</th>

                                                <th>TYPE</th>

                                                <th>TARGET QTY</th>

                                                <th>STATUS</th>

                                                <th>ACTION</th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {
                                                configQuery.isLoading
                                                    ? (

                                                        <tr>

                                                            <td
                                                                colSpan={9}
                                                                className="pp-empty"
                                                            >
                                                                Loading...
                                                            </td>

                                                        </tr>
                                                    )

                                                    : operations.length ===
                                                      0
                                                        ? (

                                                            <tr>

                                                                <td
                                                                    colSpan={9}
                                                                    className="pp-empty"
                                                                >
                                                                    No Plan Operation data found.
                                                                </td>

                                                            </tr>
                                                        )

                                                        : operations.map(
                                                            row => (

                                                                <tr
                                                                    key={
                                                                        row.plan_operation_id
                                                                    }
                                                                >

                                                                    <td>
                                                                        {
                                                                            row.operation_sequence_no
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            entries.find(
                                                                                entry =>
                                                                                    sameId(
                                                                                        entry.plan_entry_id,
                                                                                        row.plan_entry_id
                                                                                    )
                                                                            )?.sequence_no ||
                                                                            "-"
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            routeStepName(
                                                                                row.route_step_id
                                                                            )
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            processName(
                                                                                row.process_id
                                                                            )
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            row.machine_id
                                                                                ? machineName(
                                                                                    row.machine_id
                                                                                )
                                                                                : "-"
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            row.operation_type
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            row.target_qty ??
                                                                            "Inherit"
                                                                        }
                                                                    </td>


                                                                    <td>

                                                                        <StatusPill
                                                                            status={
                                                                                row.status
                                                                            }
                                                                        />

                                                                    </td>


                                                                    <td>

                                                                        <Button
                                                                            variant="outline-primary"
                                                                            className="pp-action-button pp-edit-button"
                                                                            onClick={
                                                                                () =>
                                                                                    openEditOperation(
                                                                                        row
                                                                                    )
                                                                            }
                                                                        >
                                                                            <PencilSquare
                                                                                size={15}
                                                                            />
                                                                        </Button>

                                                                    </td>

                                                                </tr>
                                                            )
                                                        )
                                            }

                                        </tbody>

                                    </Table>

                                </div>

                            </>
                        )
                    }

                </Modal.Body>

            </Modal>


            {/* =================================================
                PLAN OPERATION FORM
            ================================================= */}

            <Modal
                show={
                    showOperationForm
                }
                onHide={
                    () =>
                        setShowOperationForm(
                            false
                        )
                }
                size="lg"
                centered
                className="pp-modal"
            >

                <Form
                    onSubmit={
                        saveOperation
                    }
                >

                    <Modal.Header
                        closeButton
                    >

                        <Modal.Title>
                            {
                                operationForm.plan_operation_id
                                    ? "Edit Plan Operation"
                                    : "Add Plan Operation"
                            }
                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Row
                            className="g-3"
                        >

                            <Col md={6}>

                                <Form.Label>
                                    Plan Entry *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        operationForm.plan_entry_id
                                    } disabled={Boolean(operationForm.plan_operation_id)}
                                    onChange={
                                        e =>
                                            setOperationForm(
                                                old => ({
                                                    ...old,

                                                    plan_entry_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Plan Entry
                                    </option>

                                    {
                                        entries.map(
                                            row => (

                                                <option
                                                    key={
                                                        row.plan_entry_id
                                                    }
                                                    value={
                                                        row.plan_entry_id
                                                    }
                                                >
                                                    Seq {
                                                        row.sequence_no
                                                    }

                                                    {" - "}

                                                    {
                                                        machineName(
                                                            row.machine_id
                                                        )
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Route Step
                                </Form.Label>

                                <Form.Select
                                    value={
                                        operationForm.route_step_id
                                    }   disabled={Boolean(operationForm.plan_operation_id)}
                                    onChange={
                                        e =>
                                            setOperationForm(
                                                old => ({
                                                    ...old,

                                                    route_step_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        None
                                    </option>

                                    {
                                        routeSteps.map(
                                            row => (

                                                <option
                                                    key={
                                                        row.route_step_id
                                                    }
                                                    value={
                                                        row.route_step_id
                                                    }
                                                >
                                                    {
                                                        row.step_name ||
                                                        row.route_step_name ||
                                                        row.stage_name ||
                                                        row.stage_code
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            {/* PROCESS DROPDOWN */}

                            <Col md={6}>

                                <Form.Group>

                                    <Form.Label>
                                        Process *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            operationForm.process_id
                                        }  disabled={Boolean(operationForm.plan_operation_id)}
                                        onChange={
                                            e =>
                                                setOperationForm(
                                                    old => ({
                                                        ...old,

                                                        process_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Process
                                        </option>

                                        {
                                            processes.map(
                                                process => (

                                                    <option
                                                        key={
                                                            process.process_id
                                                        }
                                                        value={
                                                            process.process_id
                                                        }
                                                    >
                                                        {
                                                            process.process_name ||
                                                            process.process_code ||
                                                            process.process_id
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Machine
                                </Form.Label>

                                <Form.Select
                                    value={
                                        operationForm.machine_id
                                    }  disabled={Boolean(operationForm.plan_operation_id)}
                                    onChange={
                                        e =>
                                            setOperationForm(
                                                old => ({
                                                    ...old,

                                                    machine_id:
                                                        e.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Not Assigned
                                    </option>

                                    {
                                        machines.map(
                                            row => (

                                                <option
                                                    key={
                                                        row.machine_id
                                                    }
                                                    value={
                                                        row.machine_id
                                                    }
                                                >
                                                    {
                                                        row.machine_name ||
                                                        row.machine_code
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Sequence *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    value={
                                        operationForm
                                            .operation_sequence_no
                                    }
                                    onChange={
                                        e =>
                                            setOperationForm(
                                                old => ({
                                                    ...old,

                                                    operation_sequence_no:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={5}>

                                <Form.Label>
                                    Operation Type *
                                </Form.Label>

                                <Form.Control
                                    required
                                    value={
                                        operationForm.operation_type
                                    }
                                    onChange={
                                        e =>
                                            setOperationForm(
                                                old => ({
                                                    ...old,

                                                    operation_type:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Target Qty
                                </Form.Label>

                                <Form.Control
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    placeholder="Blank = inherit"
                                    value={
                                        operationForm.target_qty
                                    }
                                    onChange={
                                        e =>
                                            setOperationForm(
                                                old => ({
                                                    ...old,

                                                    target_qty:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Planned Start
                                </Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    value={
                                        operationForm.planned_start
                                    }
                                    onChange={
                                        e =>
                                            setOperationForm(
                                                old => ({
                                                    ...old,

                                                    planned_start:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Planned End
                                </Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    value={
                                        operationForm.planned_end
                                    }
                                    onChange={
                                        e =>
                                            setOperationForm(
                                                old => ({
                                                    ...old,

                                                    planned_end:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Status *
                                </Form.Label>

                                <Form.Control
                                    required
                                    value={
                                        operationForm.status
                                    }
                                    onChange={
                                        e =>
                                            setOperationForm(
                                                old => ({
                                                    ...old,

                                                    status:
                                                        e.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>

                        </Row>

                    </Modal.Body>


                    <Modal.Footer>

                        <Button
                            variant="secondary"
                            onClick={
                                () =>
                                    setShowOperationForm(
                                        false
                                    )
                            }
                        >
                            Cancel
                        </Button>


                        <Button
                            type="submit"
                            className="pp-modal-primary"
                            disabled={
                                configMutation.isPending
                            }
                        >
                            Save Plan Operation
                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>


            {/* =================================================
                EXECUTE
            ================================================= */}

            <Modal
                show={
                    showExecute
                }
                onHide={
                    () =>
                        setShowExecute(
                            false
                        )
                }
                size="lg"
                centered
                className="pp-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>
                        Execute
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    {
                        !executeMode && (

                            <Row
                                className="g-3"
                            >

                                <Col md={6}>

                                    <div
                                        className="pp-execute-option"
                                        onClick={
                                            () =>
                                                setExecuteMode(
                                                    "HISTORY"
                                                )
                                        }
                                    >

                                        <div
                                            className="pp-execute-icon"
                                        >
                                            <ClockHistory />
                                        </div>


                                        <div
                                            className="pp-execute-title"
                                        >
                                            Plan Status History
                                        </div>


                                        <div
                                            className="pp-execute-description"
                                        >
                                            Change Plan / Plan Entry lifecycle status and create plan_status_history.
                                        </div>

                                    </div>

                                </Col>


                                <Col md={6}>

                                    <div
                                        className="pp-execute-option"
                                        onClick={
                                            () =>
                                                setExecuteMode(
                                                    "EVENT"
                                                )
                                        }
                                    >

                                        <div
                                            className="pp-execute-icon"
                                        >
                                            <PlayFill />
                                        </div>


                                        <div
                                            className="pp-execute-title"
                                        >
                                            Plan Execution Event
                                        </div>


                                        <div
                                            className="pp-execute-description"
                                        >
                                            Create runtime execution evidence for Plan, Entry or Operation.
                                        </div>

                                    </div>

                                </Col>

                            </Row>
                        )
                    }


                    {/* STATUS HISTORY FORM */}

                    {
                        executeMode ===
                        "HISTORY" && (

                            <Form
                                onSubmit={
                                    saveHistory
                                }
                            >

                                <Button
                                    variant="link"
                                    className="px-0 mb-3"
                                    onClick={
                                        () =>
                                            setExecuteMode(
                                                ""
                                            )
                                    }
                                >
                                    ← Back
                                </Button>


                                <Row
                                    className="g-3"
                                >

                                    <Col md={6}>

                                        <Form.Label>
                                            Target Type *
                                        </Form.Label>

                                        <Form.Select
                                            value={
                                                historyForm.target_type
                                            }
                                            onChange={
                                                e =>
                                                    setHistoryForm(
                                                        old => ({
                                                            ...old,

                                                            target_type:
                                                                e.target.value,

                                                            plan_entry_id:
                                                                ""
                                                        })
                                                    )
                                            }
                                        >

                                            <option value="PLAN">
                                                Production Plan
                                            </option>

                                            <option value="PLAN_ENTRY">
                                                Plan Entry
                                            </option>

                                        </Form.Select>

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Production Plan *
                                        </Form.Label>

                                        <Form.Select
                                            required
                                            value={
                                                historyForm.plan_id
                                            }
                                            onChange={
                                                e =>
                                                    handleHistoryPlan(
                                                        e.target.value
                                                    )
                                            }
                                        >

                                            <option value="">
                                                Select Production Plan
                                            </option>

                                            {
                                                plans.map(
                                                    row => (

                                                        <option
                                                            key={
                                                                row.plan_id
                                                            }
                                                            value={
                                                                row.plan_id
                                                            }
                                                        >
                                                            {
                                                                row.plan_no
                                                            }
                                                        </option>
                                                    )
                                                )
                                            }

                                        </Form.Select>

                                    </Col>


                                    {
                                        historyForm.target_type ===
                                        "PLAN_ENTRY" && (

                                            <Col md={6}>

                                                <Form.Label>
                                                    Plan Entry *
                                                </Form.Label>

                                                <Form.Select
                                                    required
                                                    value={
                                                        historyForm
                                                            .plan_entry_id
                                                    }
                                                    onChange={
                                                        e =>
                                                            setHistoryForm(
                                                                old => ({
                                                                    ...old,

                                                                    plan_entry_id:
                                                                        e.target.value
                                                                })
                                                            )
                                                    }
                                                >

                                                    <option value="">
                                                        Select Entry
                                                    </option>

                                                    {
                                                        entries.map(
                                                            row => (

                                                                <option
                                                                    key={
                                                                        row.plan_entry_id
                                                                    }
                                                                    value={
                                                                        row.plan_entry_id
                                                                    }
                                                                >
                                                                    Seq {
                                                                        row.sequence_no
                                                                    }

                                                                    {" - "}

                                                                    {
                                                                        machineName(
                                                                            row.machine_id
                                                                        )
                                                                    }
                                                                </option>
                                                            )
                                                        )
                                                    }

                                                </Form.Select>

                                            </Col>
                                        )
                                    }


                                    <Col md={6}>

                                        <Form.Label>
                                            Old Status
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                historyForm.target_type ===
                                                "PLAN_ENTRY"

                                                    ? historyEntry?.status ||
                                                      ""

                                                    : selectedPlan?.status ||
                                                      ""
                                            }
                                        />

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            New Status *
                                        </Form.Label>

                                        <Form.Control
                                            required
                                            value={
                                                historyForm.new_status
                                            }
                                            onChange={
                                                e =>
                                                    setHistoryForm(
                                                        old => ({
                                                            ...old,

                                                            new_status:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Event Type *
                                        </Form.Label>

                                        <Form.Control
                                            required
                                            value={
                                                historyForm.event_type
                                            }
                                            onChange={
                                                e =>
                                                    setHistoryForm(
                                                        old => ({
                                                            ...old,

                                                            event_type:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={12}>

                                        <Form.Label>
                                            Reason
                                        </Form.Label>

                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            maxLength={500}
                                            value={
                                                historyForm.reason
                                            }
                                            onChange={
                                                e =>
                                                    setHistoryForm(
                                                        old => ({
                                                            ...old,

                                                            reason:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Company
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                selectedPlan
                                                    ?.company_id ||
                                                ""
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Plant
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                selectedPlan
                                                    ?.plant_id ||
                                                ""
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Line
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                selectedPlan
                                                    ?.line_id ||
                                                ""
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Shift
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                selectedPlan
                                                    ?.shift_id ??
                                                ""
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Machine
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                historyEntry
                                                    ?.machine_id ||
                                                ""
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Event Timestamp
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value="Generated by server"
                                        />

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Source System
                                        </Form.Label>

                                        <Form.Control
                                            value={
                                                historyForm.source_system
                                            }
                                            onChange={
                                                e =>
                                                    setHistoryForm(
                                                        old => ({
                                                            ...old,

                                                            source_system:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Correlation ID
                                        </Form.Label>

                                        <Form.Control
                                            placeholder="Optional UUID"
                                            value={
                                                historyForm.correlation_id
                                            }
                                            onChange={
                                                e =>
                                                    setHistoryForm(
                                                        old => ({
                                                            ...old,

                                                            correlation_id:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={12}>

                                        <Form.Label>
                                            Idempotency Key
                                        </Form.Label>

                                        <Form.Control
                                            value={
                                                historyForm.idempotency_key
                                            }
                                            onChange={
                                                e =>
                                                    setHistoryForm(
                                                        old => ({
                                                            ...old,

                                                            idempotency_key:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col
                                        md={12}
                                        className="text-end"
                                    >

                                        <Button
                                            type="submit"
                                            variant="success"
                                            disabled={
                                                executeMutation.isPending
                                            }
                                        >
                                            Execute Status Change
                                        </Button>

                                    </Col>

                                </Row>

                            </Form>
                        )
                    }


                    {/* EXECUTION EVENT FORM */}

                    {
                        executeMode ===
                        "EVENT" && (

                            <Form
                                onSubmit={
                                    saveExecutionEvent
                                }
                            >

                                <Button
                                    variant="link"
                                    className="px-0 mb-3"
                                    onClick={
                                        () =>
                                            setExecuteMode(
                                                ""
                                            )
                                    }
                                >
                                    ← Back
                                </Button>


                                <Row
                                    className="g-3"
                                >

                                    <Col md={6}>

                                        <Form.Label>
                                            Target Type *
                                        </Form.Label>

                                        <Form.Select
                                            value={
                                                eventForm.target_type
                                            }
                                            onChange={
                                                e =>
                                                    setEventForm(
                                                        old => ({
                                                            ...old,

                                                            target_type:
                                                                e.target.value,

                                                            plan_entry_id:
                                                                "",

                                                            plan_operation_id:
                                                                ""
                                                        })
                                                    )
                                            }
                                        >

                                            <option value="PLAN">
                                                Production Plan
                                            </option>

                                            <option value="PLAN_ENTRY">
                                                Plan Entry
                                            </option>

                                            <option value="PLAN_OPERATION">
                                                Plan Operation
                                            </option>

                                        </Form.Select>

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Production Plan *
                                        </Form.Label>

                                        <Form.Select
                                            required
                                            value={
                                                eventForm.plan_id
                                            }
                                            onChange={
                                                e =>
                                                    handleEventPlan(
                                                        e.target.value
                                                    )
                                            }
                                        >

                                            <option value="">
                                                Select Production Plan
                                            </option>

                                            {
                                                plans.map(
                                                    row => (

                                                        <option
                                                            key={
                                                                row.plan_id
                                                            }
                                                            value={
                                                                row.plan_id
                                                            }
                                                        >
                                                            {
                                                                row.plan_no
                                                            }
                                                        </option>
                                                    )
                                                )
                                            }

                                        </Form.Select>

                                    </Col>


                                    {
                                        eventForm.target_type !==
                                        "PLAN" && (

                                            <Col md={6}>

                                                <Form.Label>
                                                    Plan Entry *
                                                </Form.Label>

                                                <Form.Select
                                                    required
                                                    value={
                                                        eventForm
                                                            .plan_entry_id
                                                    }
                                                    onChange={
                                                        e =>
                                                            setEventForm(
                                                                old => ({
                                                                    ...old,

                                                                    plan_entry_id:
                                                                        e.target.value,

                                                                    plan_operation_id:
                                                                        ""
                                                                })
                                                            )
                                                    }
                                                >

                                                    <option value="">
                                                        Select Entry
                                                    </option>

                                                    {
                                                        entries.map(
                                                            row => (

                                                                <option
                                                                    key={
                                                                        row.plan_entry_id
                                                                    }
                                                                    value={
                                                                        row.plan_entry_id
                                                                    }
                                                                >
                                                                    Seq {
                                                                        row.sequence_no
                                                                    }

                                                                    {" - "}

                                                                    {
                                                                        machineName(
                                                                            row.machine_id
                                                                        )
                                                                    }
                                                                </option>
                                                            )
                                                        )
                                                    }

                                                </Form.Select>

                                            </Col>
                                        )
                                    }


                                    {
                                        eventForm.target_type ===
                                        "PLAN_OPERATION" && (

                                            <Col md={6}>

                                                <Form.Label>
                                                    Plan Operation *
                                                </Form.Label>

                                                <Form.Select
                                                    required
                                                    value={
                                                        eventForm
                                                            .plan_operation_id
                                                    }
                                                    onChange={
                                                        e =>
                                                            setEventForm(
                                                                old => ({
                                                                    ...old,

                                                                    plan_operation_id:
                                                                        e.target.value
                                                                })
                                                            )
                                                    }
                                                >

                                                    <option value="">
                                                        Select Operation
                                                    </option>

                                                    {
                                                        operations
                                                            .filter(
                                                                row =>
                                                                    sameId(
                                                                        row.plan_entry_id,
                                                                        eventForm.plan_entry_id
                                                                    )
                                                            )
                                                            .map(
                                                                row => (

                                                                    <option
                                                                        key={
                                                                            row.plan_operation_id
                                                                        }
                                                                        value={
                                                                            row.plan_operation_id
                                                                        }
                                                                    >
                                                                        Seq {
                                                                            row.operation_sequence_no
                                                                        }

                                                                        {" - "}

                                                                        {
                                                                            row.operation_type
                                                                        }
                                                                    </option>
                                                                )
                                                            )
                                                    }

                                                </Form.Select>

                                            </Col>
                                        )
                                    }


                                    <Col md={6}>

                                        <Form.Label>
                                            Event Type *
                                        </Form.Label>

                                        <Form.Control
                                            required
                                            value={
                                                eventForm.event_type
                                            }
                                            onChange={
                                                e =>
                                                    setEventForm(
                                                        old => ({
                                                            ...old,

                                                            event_type:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Result Status
                                        </Form.Label>

                                        <Form.Control
                                            value={
                                                eventForm.result_status
                                            }
                                            onChange={
                                                e =>
                                                    setEventForm(
                                                        old => ({
                                                            ...old,

                                                            result_status:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            New Target Status
                                        </Form.Label>

                                        <Form.Control
                                            placeholder="Optional"
                                            value={
                                                eventForm.new_status
                                            }
                                            onChange={
                                                e =>
                                                    setEventForm(
                                                        old => ({
                                                            ...old,

                                                            new_status:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Source System
                                        </Form.Label>

                                        <Form.Control
                                            value={
                                                eventForm.source_system
                                            }
                                            onChange={
                                                e =>
                                                    setEventForm(
                                                        old => ({
                                                            ...old,

                                                            source_system:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Company
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                selectedPlan
                                                    ?.company_id ||
                                                ""
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Plant
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                selectedPlan
                                                    ?.plant_id ||
                                                ""
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Line
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                selectedPlan
                                                    ?.line_id ||
                                                ""
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Shift
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                selectedPlan
                                                    ?.shift_id ??
                                                ""
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Machine
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                eventOperation
                                                    ?.machine_id ||

                                                eventEntry
                                                    ?.machine_id ||

                                                ""
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Event Timestamp
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value="Generated by server"
                                        />

                                    </Col>


                                    <Col md={12}>

                                        <Form.Label>
                                            Reason
                                        </Form.Label>

                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            value={
                                                eventForm.reason
                                            }
                                            onChange={
                                                e =>
                                                    setEventForm(
                                                        old => ({
                                                            ...old,

                                                            reason:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Correlation ID
                                        </Form.Label>

                                        <Form.Control
                                            placeholder="Optional UUID"
                                            value={
                                                eventForm.correlation_id
                                            }
                                            onChange={
                                                e =>
                                                    setEventForm(
                                                        old => ({
                                                            ...old,

                                                            correlation_id:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Idempotency Key
                                        </Form.Label>

                                        <Form.Control
                                            value={
                                                eventForm.idempotency_key
                                            }
                                            onChange={
                                                e =>
                                                    setEventForm(
                                                        old => ({
                                                            ...old,

                                                            idempotency_key:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={12}>

                                        <Form.Label>
                                            Payload
                                        </Form.Label>

                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={
                                                eventForm.payload
                                            }
                                            onChange={
                                                e =>
                                                    setEventForm(
                                                        old => ({
                                                            ...old,

                                                            payload:
                                                                e.target.value
                                                        })
                                                    )
                                            }
                                        />

                                        <div
                                            className="pp-help"
                                        >
                                            JSON object only.
                                        </div>

                                    </Col>


                                    <Col
                                        md={12}
                                        className="text-end"
                                    >

                                        <Button
                                            type="submit"
                                            variant="success"
                                            disabled={
                                                executeMutation.isPending
                                            }
                                        >
                                            Execute Event
                                        </Button>

                                    </Col>

                                </Row>

                            </Form>
                        )
                    }

                </Modal.Body>

            </Modal>


            {/* =================================================
                RUNTIME
            ================================================= */}

            <Modal
                show={
                    showRuntime
                }
                onHide={
                    () =>
                        setShowRuntime(
                            false
                        )
                }
                size="xl"
                centered
                className="pp-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>
                        Production Plan Runtime
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body><LiveSync status={visualLiveStatus}/><PlanningBoard records={runtimeData} title="Plan status studio"/>

                    {
                        runtimeLoading
                            ? (

                                <div
                                    className="text-center py-5"
                                >

                                    <Spinner
                                        animation="border"
                                    />

                                </div>
                            )

                            : runtimeData.length ===
                              0
                                ? (

                                    <Alert
                                        variant="light"
                                    >
                                        No runtime data found.
                                    </Alert>
                                )

                                : (

                                    <div
                                        className="table-responsive"
                                    >

                                        <Table
                                            className="pp-table"
                                        >

                                            <thead>

                                                <tr>

                                                    <th>
                                                        PLAN NO
                                                    </th>

                                                    <th>
                                                        DATE
                                                    </th>

                                                    <th>
                                                        SHIFT
                                                    </th>

                                                    <th>
                                                        QTY
                                                    </th>

                                                    <th>
                                                        STATUS
                                                    </th>

                                                    <th>
                                                        ENTRIES
                                                    </th>

                                                    <th>
                                                        OPERATIONS
                                                    </th>

                                                    <th>
                                                        HISTORY
                                                    </th>

                                                    <th>
                                                        EVENTS
                                                    </th>

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {
                                                    runtimeData.map(
                                                        row => (

                                                            <tr
                                                                key={
                                                                    row.plan_id
                                                                }
                                                            >

                                                                <td>
                                                                    {
                                                                        row.plan_no
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        toDateInput(
                                                                            row.plan_date
                                                                        )
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.shift_id
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.planned_qty
                                                                    }
                                                                </td>


                                                                <td>

                                                                    <StatusPill
                                                                        status={
                                                                            row.status
                                                                        }
                                                                    />

                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.plan_entries
                                                                            ?.length ||
                                                                        0
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.plan_operations
                                                                            ?.length ||
                                                                        0
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.status_history
                                                                            ?.length ||
                                                                        0
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.execution_events
                                                                            ?.length ||
                                                                        0
                                                                    }
                                                                </td>

                                                            </tr>
                                                        )
                                                    )
                                                }

                                            </tbody>

                                        </Table>

                                    </div>
                                )
                    }

                </Modal.Body>

            </Modal>


            {/* =================================================
                REPORT
            ================================================= */}

            <Modal
                show={
                    showReport
                }
                onHide={
                    () =>
                        setShowReport(
                            false
                        )
                }
                size="xl"
                centered
                className="pp-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>
                        Production Plan Report
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body><ReportLens records={reportData} title="Production plan report explorer"/>

                    <Row
                        className="g-2 mb-4"
                    >

                        <Col md={4}>

                            <Form.Label>
                                From Date
                            </Form.Label>

                            <Form.Control
                                type="date"
                                value={
                                    reportFrom
                                }
                                onChange={
                                    e =>
                                        setReportFrom(
                                            e.target.value
                                        )
                                }
                            />

                        </Col>


                        <Col md={4}>

                            <Form.Label>
                                To Date
                            </Form.Label>

                            <Form.Control
                                type="date"
                                value={
                                    reportTo
                                }
                                onChange={
                                    e =>
                                        setReportTo(
                                            e.target.value
                                        )
                                }
                            />

                        </Col>


                        <Col
                            md={4}
                            className="d-flex align-items-end"
                        >

                            <Button
                                className="pp-modal-primary"
                                onClick={
                                    fetchReport
                                }
                            >
                                Fetch Report
                            </Button>

                        </Col>

                    </Row>


                    {
                        reportLoading
                            ? (

                                <div
                                    className="text-center py-5"
                                >

                                    <Spinner
                                        animation="border"
                                    />

                                </div>
                            )

                            : (

                                <div
                                    className="table-responsive"
                                >

                                    <Table
                                        className="pp-table"
                                    >

                                        <thead>

                                            <tr>

                                                <th>
                                                    PLAN NO
                                                </th>

                                                <th>
                                                    PLAN DATE
                                                </th>

                                                <th>
                                                    PLAN STATUS
                                                </th>

                                                <th>
                                                    ENTRY SEQ.
                                                </th>

                                                <th>
                                                    ENTRY QTY
                                                </th>

                                                <th>
                                                    OPERATION SEQ.
                                                </th>

                                                <th>
                                                    OPERATION TYPE
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {
                                                reportData.length ===
                                                0
                                                    ? (

                                                        <tr>

                                                            <td
                                                                colSpan={7}
                                                                className="pp-empty"
                                                            >
                                                                No report data found.
                                                            </td>

                                                        </tr>
                                                    )

                                                    : reportData.map(
                                                        (
                                                            row,
                                                            index
                                                        ) => (

                                                            <tr
                                                                key={
                                                                    `${row.plan_id}-${index}`
                                                                }
                                                            >

                                                                <td>
                                                                    {
                                                                        row.plan_no
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        toDateInput(
                                                                            row.plan_date
                                                                        )
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.plan_status
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.sequence_no ??
                                                                        "-"
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.entry_target_qty ??
                                                                        "-"
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.operation_sequence_no ??
                                                                        "-"
                                                                    }
                                                                </td>


                                                                <td>
                                                                    {
                                                                        row.operation_type ||
                                                                        "-"
                                                                    }
                                                                </td>

                                                            </tr>
                                                        )
                                                    )
                                            }

                                        </tbody>

                                    </Table>

                                </div>
                            )
                    }

                </Modal.Body>

            </Modal>

        </div>
</></>
    );
};


export default ProductionPlan;