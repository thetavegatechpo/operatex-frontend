import useLiveRefresh from '../../../../shared/operations/useLiveRefresh.js';
import LiveSync from '../../../../shared/operations/LiveSync.jsx';
import OperationsLaunch from '../../../../shared/operations/OperationsLaunch.jsx';
import ReportLens from '../../../../shared/operations/ReportLens.jsx';
import EventJourney from '../../../../shared/operations/EventJourney.jsx';
import PlanningBoard from '../../../../shared/operations/PlanningBoard.jsx';

import Table from '../../../../shared/components/SmartTable.jsx';
import React, {
    useMemo,
    useState
} from "react";

import {
    Alert,
    Button,
    Col,
    Form,
    Modal,
    Row,
    Spinner} from "react-bootstrap";

import {
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";
import shiftPlanService from "../api/shiftPlan.service.js";

import productionPlanService from "../../production-plan/api/productionPlan.service.js";
/* ============================================================
   STYLES
============================================================ */

const styles = `

.shift-plan-page {
    width: 100%;
    padding: 24px 28px;
    font-family: "Montserrat", "Segoe UI", Arial, sans-serif;
}

/* ============================================================
   HEADER
============================================================ */

.sp-header {
    background: #ffffff;
    border-radius: 15px;
    border: 1px solid #ececf4;
    box-shadow: 0 5px 20px rgba(24, 29, 52, 0.06);
    padding: 23px 25px;
    margin-bottom: 26px;
    position: relative;
    overflow: hidden;
}

.sp-header::before {
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

.sp-header-title {
    margin: 0;
    color: #171f3c;
    font-size: 22px;
    font-weight: 800;
}

.sp-breadcrumb {
    margin-top: 5px;
    color: #7d849e;
    font-size: 13px;
}

.sp-header-buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
}

.sp-outline-button {
    height: 42px !important;
    padding: 0 17px !important;

    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 7px;

    background: #ffffff !important;
    border: 1px solid #314965 !important;
    color: #314965 !important;

    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 700 !important;

    box-shadow: none !important;
}

.sp-outline-button:hover,
.sp-outline-button:focus,
.sp-outline-button:active {
    background: #f6f8fa !important;
    color: #314965 !important;
    border-color: #314965 !important;
}

.sp-add-button {
    height: 42px !important;
    padding: 0 18px !important;

    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px;

    color: #ffffff !important;

    border:
        1px solid
        #314965 !important;

    background:
        linear-gradient(
            135deg,
            #314965,
            #314965
        ) !important;

    border-radius:
        8px !important;

    font-size:
        13px !important;

    font-weight:
        700 !important;

    box-shadow:
        0 6px 16px
        rgba(
            103,
            87,
            245,
            0.20
        ) !important;
}


/* ============================================================
   TOOLBAR
============================================================ */

.sp-toolbar {
    background: #ffffff;

    border:
        1px solid
        #ececf4;

    box-shadow:
        0 5px 18px
        rgba(
            24,
            29,
            52,
            0.05
        );

    border-radius:
        14px;

    margin-bottom:
        27px;

    padding:
        20px 22px;

    position:
        relative;

    overflow:
        hidden;
}

.sp-toolbar::before {
    content: "";

    position:
        absolute;

    left:
        0;

    top:
        0;

    bottom:
        0;

    width:
        4px;

    background:
        linear-gradient(
            180deg,
            #314965,
            #14c7d8
        );
}

.sp-search-wrapper {
    display:
        flex;

    width:
        100%;
}

.sp-search-icon {
    width:
        48px;

    min-width:
        48px;

    height:
        47px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    border:
        1px solid
        #dfe2ed;

    border-right:
        0;

    border-radius:
        9px 0 0 9px;

    background:
        #f8f9fc;

    color:
        #8b92aa;

    font-size:
        18px;
}

.sp-search-input {
    height:
        47px;

    border-radius:
        0 9px 9px 0 !important;

    border-color:
        #dfe2ed !important;

    box-shadow:
        none !important;
}

.sp-filter {
    height:
        47px;

    border-radius:
        9px;

    border-color:
        #dfe2ed;

    font-size:
        13px;
}

.sp-toolbar-actions {
    display:
        flex;

    align-items:
        center;

    justify-content:
        flex-end;

    gap:
        9px;
}

.sp-tool-button {
    width:
        47px !important;

    height:
        45px !important;

    padding:
        0 !important;

    display:
        inline-flex !important;

    align-items:
        center !important;

    justify-content:
        center !important;

    background:
        #ffffff !important;

    border-radius:
        9px !important;

    font-size:
        16px !important;

    font-weight:
        800 !important;

    box-shadow:
        none !important;
}

.sp-refresh-button {
    border:
        1px solid
        #dfe3ec !important;

    color:
        #7e879b !important;
}

.sp-refresh-button:hover {
    background:
        #f7f8fa !important;

    color:
        #626b7d !important;
}

.sp-execute-button {
    border:
        1px solid
        #21a66b !important;

    color:
        #15935b !important;
}

.sp-execute-button:hover {
    background:
        #f1fbf6 !important;

    color:
        #12814f !important;
}

.sp-runtime-button {
    border:
        1px solid
        #f0ae13 !important;

    color:
        #eba800 !important;
}

.sp-runtime-button:hover {
    background:
        #fffaf0 !important;

    color:
        #d59700 !important;
}

.sp-report-button {
    border:
        1px solid
        #765fff !important;

    color:
        #6856f6 !important;
}

.sp-report-button:hover {
    background:
        #f6f8fa !important;

    color:
        #5a48ea !important;
}


/* ============================================================
   TABLE
============================================================ */

.sp-table-card {
    background:
        #ffffff;

    border-radius:
        14px;

    overflow:
        hidden;

    box-shadow:
        0 6px 22px
        rgba(
            24,
            29,
            52,
            0.05
        );
}

.sp-table {
    margin:
        0;
}

.sp-table thead th {
    background:
        #25325a;

    color:
        #ffffff;

    border:
        0;

    padding:
        15px 13px;

    font-size:
        12px;

    font-weight:
        800;

    vertical-align:
        middle;

    white-space:
        nowrap;
}

.sp-table tbody td {
    padding:
        13px;

    border-color:
        #edf0f5;

    color:
        #31384d;

    font-size:
        13px;

    vertical-align:
        middle;
}

.sp-table tbody tr:hover {
    background:
        #fafaff;
}

.sp-rule-code {
    color:
        #344cc5;

    font-weight:
        700;
}

.sp-empty {
    text-align:
        center;

    padding:
        40px !important;

    color:
        #8b92a7 !important;
}


/* ============================================================
   ACTIONS
============================================================ */

.sp-action-button {
    width:
        37px !important;

    height:
        37px !important;

    padding:
        0 !important;

    display:
        inline-flex !important;

    align-items:
        center !important;

    justify-content:
        center !important;

    background:
        #ffffff !important;

    border-radius:
        8px !important;

    box-shadow:
        none !important;
}

.sp-edit-button {
    border:
        1px solid
        #c65b30 !important;

    color:
        #314965 !important;
}

.sp-edit-button:hover {
    background:
        #f6f4ff !important;

    color:
        #5c49ef !important;
}


/* ============================================================
   ACTIVE STATUS
============================================================ */

.sp-status {
    display:
        inline-flex;

    align-items:
        center;

    justify-content:
        center;

    min-width:
        76px;

    padding:
        5px 11px;

    border-radius:
        20px;

    color:
        #ffffff;

    font-size:
        11px;

    font-weight:
        800;
}

.sp-status.active {
    background:
        #18a66b;
}

.sp-status.inactive {
    background:
        #7e8798;
}


/* ============================================================
   MODAL
============================================================ */

.sp-modal .modal-content {
    border:
        0;

    border-radius:
        15px;

    overflow:
        hidden;

    box-shadow:
        0 20px 65px
        rgba(
            24,
            29,
            52,
            0.24
        );
}

.sp-modal .modal-header {
    background:
        #ffffff;

    border-bottom:
        1px solid
        #edf0f5;

    padding:
        18px 22px;
}

.sp-modal .modal-title {
    color:
        #202945;

    font-size:
        18px;

    font-weight:
        800;
}

.sp-modal .modal-body {
    padding:
        22px;
}

.sp-modal .modal-footer {
    border-top:
        1px solid
        #edf0f5;

    padding:
        14px 22px;
}

.sp-modal .form-label {
    margin-bottom:
        5px;

    color:
        #51596d;

    font-size:
        12px;

    font-weight:
        700;
}

.sp-modal .form-control,
.sp-modal .form-select {
    min-height:
        39px;

    border-radius:
        8px;

    border-color:
        #dfe2eb;

    font-size:
        13px;
}

.sp-modal .form-control:focus,
.sp-modal .form-select:focus {
    border-color:
        #c65b30;

    box-shadow:
        0 0 0 0.17rem
        rgba(
            117,
            97,
            255,
            0.12
        );
}

.sp-modal-primary {
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

.sp-section-title {
    margin-bottom:
        12px;

    color:
        #242c48;

    font-size:
        14px;

    font-weight:
        800;
}

.sp-help {
    margin-top:
        4px;

    color:
        #8a91a5;

    font-size:
        11px;
}


/* ============================================================
   EXECUTE CHOICES
============================================================ */

.sp-execute-card {
    height:
        100%;

    padding:
        24px;

    background:
        #ffffff;

    border:
        1px solid
        #e0e2ec;

    border-radius:
        12px;

    cursor:
        pointer;

    transition:
        0.18s ease;
}

.sp-execute-card:hover {
    border-color:
        #314965;

    transform:
        translateY(-2px);

    box-shadow:
        0 8px 24px
        rgba(
            91,
            78,
            220,
            0.10
        );
}

.sp-execute-icon {
    width:
        46px;

    height:
        46px;

    margin-bottom:
        14px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    background:
        #f1efff;

    color:
        #314965;

    border-radius:
        10px;

    font-size:
        21px;
}

.sp-execute-title {
    color:
        #252e4c;

    font-size:
        15px;

    font-weight:
        800;
}

.sp-execute-description {
    margin-top:
        5px;

    color:
        #82899d;

    font-size:
        12px;
}


/* ============================================================
   CONFIG CARDS
============================================================ */

.sp-config-stat {
    padding:
        15px;

    background:
        #f8f9fd;

    border:
        1px solid
        #eaecf3;

    border-radius:
        10px;
}

.sp-config-stat-label {
    color:
        #8990a4;

    font-size:
        10px;

    font-weight:
        800;

    text-transform:
        uppercase;
}

.sp-config-stat-value {
    margin-top:
        5px;

    color:
        #252e4c;

    font-size:
        22px;

    font-weight:
        800;
}


/* ============================================================
   TOAST
============================================================ */

.sp-toast {
    position:
        fixed;

    top:
        85px;

    right:
        25px;

    z-index:
        99999;

    min-width:
        340px;

    max-width:
        480px;

    padding:
        13px 17px;

    border-radius:
        9px;

    font-size:
        13px;

    font-weight:
        700;

    box-shadow:
        0 8px 30px
        rgba(
            0,
            0,
            0,
            0.16
        );
}

.sp-toast.success {
    background:
        #daf5e7;

    color:
        #166b43;

    border:
        1px solid
        #b9e9cf;
}

.sp-toast.error {
    background:
        #fde1e4;

    color:
        #9e2530;

    border:
        1px solid
        #f5b9bf;
}

`;


/* ============================================================
   HELPERS
============================================================ */

const sameId = (
    a,
    b
) =>
    String(a ?? "") ===
    String(b ?? "");


const responseData =
    response => {

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


const responseRows =
    response => {

        const value =
            responseData(
                response
            );


        if (
            Array.isArray(value)
        ) {
            return value;
        }


        if (
            Array.isArray(
                value?.rows
            )
        ) {
            return value.rows;
        }


        return [];
    };


const getErrorMessage = (
    error,
    fallback =
        "Something went wrong."
) => {

    const body =
        error?.response?.data;


    if (
        Array.isArray(
            body?.errors
        ) &&
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


const today =
    () => {

        const date =
            new Date();


        const local =
            new Date(
                date.getTime() -
                date.getTimezoneOffset() *
                60000
            );


        return local
            .toISOString()
            .slice(0, 10);
    };


const toDateTimeInput =
    value => {

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


const toTimestamp =
    value => {

        if (!value) {
            return null;
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }


        return date.toISOString();
    };


const cleanObject =
    object =>
        Object.fromEntries(
            Object
                .entries(object)
                .filter(
                    ([, value]) =>
                        value !== "" &&
                        value !== undefined &&
                        value !== null
                )
        );


/* ============================================================
   EMPTY RULE
============================================================ */

const emptyRule =
    () => ({

        plan_generation_rule_id:
            "",

        company_id:
            "",

        plant_id:
            "",

        line_id:
            "",

        shift_id:
            "",

        process_id:
            "",

        part_id:
            "",

        rule_code:
            "",

        rule_name:
            "",

        generation_mode:
            "",

        trigger_type:
            "",

        trigger_offset_min:
            0,

        schedule_rule_id:
            "",

        default_target_qty:
            "",

        is_active:
            true,

        version_no:
            1
    });


const emptyGenerate =
    () => ({

        plan_generation_rule_id:
            "",

        plan_id:
            "",

        order_item_id:
            "",

        machine_id:
            "",

        part_id:
            "",

        process_id:
            "",

        shift_id:
            "",

        sequence_no:
            1,

        previous_plan_entry_id:
            "",

        target_qty:
            "",

        planned_start:
            "",

        planned_end:
            "",

        planned_operator_user_id:
            "",

        status:
            "PENDING",

        reason:
            "",

        source_system:
            "MES",

        correlation_id:
            "",

        idempotency_key:
            ""
    });


const emptyStatusUpdate =
    () => ({

        plan_generation_rule_id:
            "",

        plan_entry_id:
            "",

        new_status:
            "",

        reason:
            "",

        source_system:
            "MES",

        correlation_id:
            "",

        idempotency_key:
            ""
    });


/* ============================================================
   COMPONENT
============================================================ */

const ShiftPlan = () => {

    const queryClient =
        useQueryClient();


    /* ========================================================
       GENERAL
    ======================================================== */

    const [
        search,
        setSearch
    ] =
        useState("");


    const [
        activeFilter,
        setActiveFilter
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
            () =>
                setToast(null),
            3500
        );
    };


    /* ========================================================
       RULE FORM
    ======================================================== */

    const [
        showRuleForm,
        setShowRuleForm
    ] =
        useState(false);


    /*
     * MASTER_CREATE
     * MASTER_EDIT
     * CONFIG_CREATE
     * CONFIG_EDIT
     */

    const [
        ruleFormMode,
        setRuleFormMode
    ] =
        useState(
            "MASTER_CREATE"
        );


    const [
        ruleForm,
        setRuleForm
    ] =
        useState(
            emptyRule()
        );

const isRuleEdit =
    ruleFormMode === "MASTER_EDIT" ||
    ruleFormMode === "CONFIG_EDIT";
    /* ========================================================
       CONFIG MODAL
    ======================================================== */

    const [
        showConfig,
        setShowConfig
    ] =
        useState(false);


    /* ========================================================
       EXECUTE
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
        generateForm,
        setGenerateForm
    ] =
        useState(
            emptyGenerate()
        );


    const [
        statusForm,
        setStatusForm
    ] =
        useState(
            emptyStatusUpdate()
        );


    /* ========================================================
       RUNTIME
    ======================================================== */

    const [
        showRuntime,
        setShowRuntime
    ] =
        useState(false);


    const [
        runtimeLoading,
        setRuntimeLoading
    ] =
        useState(false);


    const [
        runtimeData,
        setRuntimeData
    ] =
        useState({});


    const [
        runtimeView,
        setRuntimeView
    ] =
        useState(
            "ENTRIES"
        );


    /* ========================================================
       REPORT
    ======================================================== */

    const [
        showReport,
        setShowReport
    ] =
        useState(false);


    const [
        reportLoading,
        setReportLoading
    ] =
        useState(false);


    const [
        reportData,
        setReportData
    ] =
        useState({});


    const [
        reportView,
        setReportView
    ] =
        useState(
            "ENTRIES"
        );


    const [
        reportFrom,
        setReportFrom
    ] =
        useState(
            today()
        );


    const [
        reportTo,
        setReportTo
    ] =
        useState(
            today()
        );


    const [
        reportShift,
        setReportShift
    ] =
        useState("");


    const [
        reportProcess,
        setReportProcess
    ] =
        useState("");


    const [
        reportStatus,
        setReportStatus
    ] =
        useState("");


    /* ========================================================
       MASTER
    ======================================================== */

    const masterQuery =
        useQuery({

            queryKey: [
                "shift-plan",
                "master"
            ],

            queryFn:
                () =>
                    shiftPlanService
                        .getMaster()
        });


    const rules =
        responseRows(
            masterQuery.data
        );

        const productionPlansQuery =
    useQuery({
        queryKey: [
            "shift-plan-production-plans"
        ],

        queryFn:
            () =>
                productionPlanService
                    .getMaster(),

        retry: false
    });


const productionPlans =
    responseRows(
        productionPlansQuery.data
    );


    /* ========================================================
       CONFIG

       API0163 returns:

       shifts
       generation_rules
       processes
    ======================================================== */

    const configQuery =
        useQuery({

            queryKey: [
                "shift-plan",
                "config"
            ],

            queryFn:
                () =>
                    shiftPlanService
                        .getConfig()
        });


    const configData =
        responseData(
            configQuery.data
        ) || {};


    const shifts =
        Array.isArray(
            configData.shifts
        )
            ? configData.shifts
            : [];


    const activeGenerationRules =
        Array.isArray(
            configData
                .generation_rules
        )
            ? configData
                .generation_rules
            : [];


    const processes =
        Array.isArray(
            configData.processes
        )
            ? configData.processes
            : [];


    /* ========================================================
       LOOKUPS
    ======================================================== */

    const companiesQuery =
        useQuery({

            queryKey: [
                "shift-plan-company"
            ],

            queryFn:
                () =>
                    api.get(
                        "/company-master/master"
                    ),

            retry:
                false
        });


    const plantsQuery =
        useQuery({

            queryKey: [
                "shift-plan-plant"
            ],

            queryFn:
                () =>
                    api.get(
                        "/plant-shop-master/master"
                    ),

            retry:
                false
        });


    const linesQuery =
        useQuery({

            queryKey: [
                "shift-plan-line"
            ],

            queryFn:
                () =>
                    api.get(
                        "/line-master/master"
                    ),

            retry:
                false
        });


    const partsQuery =
        useQuery({

            queryKey: [
                "shift-plan-part"
            ],

            queryFn:
                () =>
                    api.get(
                        "/part-master/master"
                    ),

            retry:
                false
        });


    const machinesQuery =
        useQuery({

            queryKey: [
                "shift-plan-machine"
            ],

            queryFn:
                () =>
                    api.get(
                        "/machine-master/master"
                    ),

            retry:
                false
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


    const parts =
        responseRows(
            partsQuery.data
        );


    const machines =
        responseRows(
            machinesQuery.data
        );


    /* ========================================================
       NAME HELPERS
    ======================================================== */

    const companyName =
        id => {

            const row =
                companies.find(
                    item =>
                        sameId(
                            item.company_id,
                            id
                        )
                );


            return (
                row?.company_name ||
                row?.company_code ||
                id ||
                "-"
            );
        };


    const plantName =
        id => {

            if (!id) {
                return "Company-wide";
            }


            const row =
                plants.find(
                    item =>
                        sameId(
                            item.plant_id,
                            id
                        )
                );


            return (
                row?.plant_name ||
                row?.shop_name ||
                row?.plant_code ||
                id
            );
        };


    const lineName =
        id => {

            const row =
                lines.find(
                    item =>
                        sameId(
                            item.line_id,
                            id
                        )
                );


            return (
                row?.line_name ||
                row?.line_code ||
                id ||
                "-"
            );
        };


    const shiftName =
        id => {

            if (
                id === null ||
                id === undefined ||
                id === ""
            ) {
                return "All Shifts";
            }


            const row =
                shifts.find(
                    item =>
                        sameId(
                            item.shift_id,
                            id
                        )
                );


            if (!row) {
                return id;
            }


            return (
                row.shift_name ||
                row.shift_code ||
                row.shift_no ||
                `Shift ${row.shift_id}`
            );
        };


    const processName =
        id => {

            if (!id) {
                return "All Processes";
            }


            const row =
                processes.find(
                    item =>
                        sameId(
                            item.process_id,
                            id
                        )
                );


            return (
                row?.process_name ||
                row?.process_code ||
                id
            );
        };


    const partName =
        id => {

            if (!id) {
                return "All Parts";
            }


            const row =
                parts.find(
                    item =>
                        sameId(
                            item.part_id,
                            id
                        )
                );


            return (
                row?.part_name ||
                row?.part_code ||
                id
            );
        };


    const machineName =
        id => {

            if (!id) {
                return "-";
            }


            const row =
                machines.find(
                    item =>
                        sameId(
                            item.machine_id,
                            id
                        )
                );


            return (
                row?.machine_name ||
                row?.machine_code ||
                id
            );
        };


    /* ========================================================
       FILTER TABLE
    ======================================================== */

    const filteredRules =
        useMemo(
            () => {

                const value =
                    search
                        .trim()
                        .toLowerCase();


                return rules.filter(
                    rule => {

                        if (
                            activeFilter ===
                            "ACTIVE" &&
                            rule.is_active !==
                            true
                        ) {
                            return false;
                        }


                        if (
                            activeFilter ===
                            "INACTIVE" &&
                            rule.is_active ===
                            true
                        ) {
                            return false;
                        }


                        if (!value) {
                            return true;
                        }


                        const text = [

                            rule.rule_code,
                            rule.rule_name,

                            companyName(
                                rule.company_id
                            ),

                            plantName(
                                rule.plant_id
                            ),

                            lineName(
                                rule.line_id
                            ),

                            shiftName(
                                rule.shift_id
                            ),

                            processName(
                                rule.process_id
                            ),

                            partName(
                                rule.part_id
                            ),

                            rule.generation_mode,
                            rule.trigger_type,
                            rule.version_no

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
                rules,
                search,
                activeFilter,
                companies,
                plants,
                lines,
                shifts,
                processes,
                parts
            ]
        );


    /* ========================================================
       REFRESH
    ======================================================== */

    const refresh =
        async () => {

            await Promise.all([

                queryClient
                    .invalidateQueries({
                        queryKey: [
                            "shift-plan"
                        ]
                    }),

                queryClient
                    .invalidateQueries({
                        queryKey: [
                            "shift-plan-company"
                        ]
                    }),

                queryClient
                    .invalidateQueries({
                        queryKey: [
                            "shift-plan-plant"
                        ]
                    }),

                queryClient
                    .invalidateQueries({
                        queryKey: [
                            "shift-plan-line"
                        ]
                    })
            ]);
        };


    /* ========================================================
       RULE MUTATION
    ======================================================== */

    const ruleMutation =
        useMutation({

            mutationFn:
                ({
                    mode,
                    id,
                    payload
                }) => {

                    switch (mode) {

                        case "CONFIG_CREATE":

                            return shiftPlanService
                                .saveConfig(
                                    payload
                                );


                        case "CONFIG_EDIT":

                            return shiftPlanService
                                .saveConfig({
                                    ...payload,

                                    plan_generation_rule_id:
                                        id
                                });


                        case "MASTER_EDIT":

                            return shiftPlanService
                                .updateMaster(
                                    id,
                                    payload
                                );


                        case "MASTER_CREATE":

                        default:

                            return shiftPlanService
                                .createMaster(
                                    payload
                                );
                    }
                },

            onSuccess:
                async () => {

                    await refresh();


                    setShowRuleForm(
                        false
                    );


                    notify(
                        ruleFormMode ===
                        "MASTER_EDIT"

                            ? "Shift Plan rule updated successfully."

                            : ruleFormMode ===
                              "CONFIG_EDIT"

                                ? "Shift Plan configuration updated successfully."

                                : ruleFormMode ===
                                  "CONFIG_CREATE"

                                    ? "Shift Plan configuration created successfully."

                                    : "Shift Plan rule created successfully."
                    );
                },

            onError:
                error =>
                    notify(
                        getErrorMessage(
                            error,
                            "Unable to save Shift Plan rule."
                        ),
                        "error"
                    )
        });


    /* ========================================================
       RULE FORM OPEN
    ======================================================== */

    const openAddMaster =
        () => {

            setRuleFormMode(
                "MASTER_CREATE"
            );


            setRuleForm(
                emptyRule()
            );


            setShowRuleForm(
                true
            );
        };


    const openEditMaster =
        rule => {

            setRuleFormMode(
                "MASTER_EDIT"
            );


            setRuleForm({
                ...emptyRule(),
                ...rule,

                plant_id:
                    rule.plant_id ||
                    "",

                shift_id:
                    rule.shift_id ??
                    "",

                process_id:
                    rule.process_id ||
                    "",

                part_id:
                    rule.part_id ||
                    "",

                schedule_rule_id:
                    rule.schedule_rule_id ||
                    "",

                default_target_qty:
                    rule.default_target_qty ??
                    ""
            });


            setShowRuleForm(
                true
            );
        };


    const openAddConfig =
        () => {

            setRuleFormMode(
                "CONFIG_CREATE"
            );


            setRuleForm(
                emptyRule()
            );


            setShowRuleForm(
                true
            );
        };


    const openEditConfig =
        rule => {

            setRuleFormMode(
                "CONFIG_EDIT"
            );


            setRuleForm({
                ...emptyRule(),
                ...rule,

                plant_id:
                    rule.plant_id ||
                    "",

                shift_id:
                    rule.shift_id ??
                    "",

                process_id:
                    rule.process_id ||
                    "",

                part_id:
                    rule.part_id ||
                    "",

                schedule_rule_id:
                    rule.schedule_rule_id ||
                    "",

                default_target_qty:
                    rule.default_target_qty ??
                    ""
            });


            setShowRuleForm(
                true
            );
        };


    /* ========================================================
       SAVE RULE
    ======================================================== */

    const saveRule =
        event => {

            event.preventDefault();


            const payload = {

                company_id:
                    ruleForm.company_id,

                plant_id:
                    ruleForm.plant_id ||
                    null,

                line_id:
                    ruleForm.line_id,

                shift_id:
                    ruleForm.shift_id === ""
                        ? null
                        : Number(
                            ruleForm.shift_id
                        ),

                process_id:
                    ruleForm.process_id ||
                    null,

                part_id:
                    ruleForm.part_id ||
                    null,

                rule_code:
                    ruleForm.rule_code.trim(),

                rule_name:
                    ruleForm.rule_name.trim(),

                generation_mode:
                    ruleForm
                        .generation_mode
                        .trim(),

                trigger_type:
                    ruleForm
                        .trigger_type
                        .trim(),

                trigger_offset_min:
                    Number(
                        ruleForm
                            .trigger_offset_min
                    ),

                schedule_rule_id:
                    ruleForm
                        .schedule_rule_id ||
                    null,

                default_target_qty:
                    ruleForm
                        .default_target_qty ===
                    ""

                        ? null

                        : Number(
                            ruleForm
                                .default_target_qty
                        ),

                is_active:
                    Boolean(
                        ruleForm.is_active
                    ),

                version_no:
                    Number(
                        ruleForm.version_no
                    )
            };


            ruleMutation.mutate({

                mode:
                    ruleFormMode,

                id:
                    ruleForm
                        .plan_generation_rule_id,

                payload
            });
        };


    /* ========================================================
       RUNTIME
    ======================================================== */

    const loadRuntime =
        async () => {

            setRuntimeLoading(
                true
            );


            try {

                const response =
                    await shiftPlanService
                        .getRuntime();


                const data =
                    responseData(
                        response
                    ) || {};


                setRuntimeData(
                    data
                );


                return data;

            }
            catch (error) {

                notify(
                    getErrorMessage(
                        error,
                        "Unable to fetch Shift Plan runtime."
                    ),
                    "error"
                );


                return {};

            }
            finally {

                setRuntimeLoading(
                    false
                );
            }
        };


    const openRuntime =
        async () => {

            setRuntimeView(
                "ENTRIES"
            );


            setShowRuntime(
                true
            );


            await loadRuntime();
        };


    const runtimeEntries =
        Array.isArray(
            runtimeData.plan_entries
        )
            ? runtimeData.plan_entries
            : [];


    const runtimeHistory =
        Array.isArray(
            runtimeData
                .plan_status_history
        )
            ? runtimeData
                .plan_status_history
            : [];


    /* ========================================================
       EXECUTE
    ======================================================== */

    const executeMutation =
        useMutation({

            mutationFn:
                payload =>
                    shiftPlanService
                        .execute(
                            payload
                        ),

            onSuccess:
                async () => {

                    await refresh();


                    await loadRuntime();


                    setShowExecute(
                        false
                    );


                    setExecuteMode(
                        ""
                    );


                    notify(
                        "Shift Plan action executed successfully."
                    );
                },

            onError:
                error =>
                    notify(
                        getErrorMessage(
                            error,
                            "Unable to execute Shift Plan action."
                        ),
                        "error"
                    )
        });


    const openExecute =
        async () => {

            setExecuteMode(
                ""
            );


            setGenerateForm(
                emptyGenerate()
            );


            setStatusForm(
                emptyStatusUpdate()
            );


            await loadRuntime();


            setShowExecute(
                true
            );
        };


    const saveGenerate =
        event => {

            event.preventDefault();


            executeMutation.mutate(
                cleanObject({

                    plan_generation_rule_id:
                        generateForm
                            .plan_generation_rule_id,

                    plan_id:
                        generateForm.plan_id,

                    order_item_id:
                        generateForm
                            .order_item_id ||
                        null,

                    machine_id:
                        generateForm.machine_id,

                    part_id:
                        generateForm.part_id ||
                        null,

                    process_id:
                        generateForm
                            .process_id ||
                        null,

                    shift_id:
                        generateForm.shift_id ===
                        ""

                            ? null

                            : Number(
                                generateForm
                                    .shift_id
                            ),

                    sequence_no:
                        Number(
                            generateForm
                                .sequence_no
                        ),

                    previous_plan_entry_id:
                        generateForm
                            .previous_plan_entry_id ||
                        null,

                    target_qty:
                        generateForm.target_qty ===
                        ""

                            ? null

                            : Number(
                                generateForm
                                    .target_qty
                            ),

                    planned_start:
                        toTimestamp(
                            generateForm
                                .planned_start
                        ),

                    planned_end:
                        toTimestamp(
                            generateForm
                                .planned_end
                        ),

                    planned_operator_user_id:
                        generateForm
                            .planned_operator_user_id ===
                        ""

                            ? null

                            : Number(
                                generateForm
                                    .planned_operator_user_id
                            ),

                    status:
                        generateForm.status,

                    reason:
                        generateForm.reason ||
                        null,

                    source_system:
                        generateForm
                            .source_system ||
                        "MES",

                    correlation_id:
                        generateForm
                            .correlation_id ||
                        null,

                    idempotency_key:
                        generateForm
                            .idempotency_key ||
                        null
                })
            );
        };


    const saveStatusUpdate =
        event => {

            event.preventDefault();


            executeMutation.mutate(
                cleanObject({

                    plan_generation_rule_id:
                        statusForm
                            .plan_generation_rule_id,

                    plan_entry_id:
                        statusForm
                            .plan_entry_id,

                    new_status:
                        statusForm
                            .new_status,

                    reason:
                        statusForm.reason ||
                        null,

                    source_system:
                        statusForm
                            .source_system ||
                        "MES",

                    correlation_id:
                        statusForm
                            .correlation_id ||
                        null,

                    idempotency_key:
                        statusForm
                            .idempotency_key ||
                        null
                })
            );
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
                    await shiftPlanService
                        .getReport(
                            cleanObject({

                                from_date:
                                    reportFrom,

                                to_date:
                                    reportTo,

                                shift_id:
                                    reportShift,

                                process_id:
                                    reportProcess,

                                status:
                                    reportStatus
                            })
                        );


                setReportData(
                    responseData(
                        response
                    ) || {}
                );

            }
            catch (error) {

                notify(
                    getErrorMessage(
                        error,
                        "Unable to fetch Shift Plan report."
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

            setReportView(
                "ENTRIES"
            );


            setShowReport(
                true
            );


            await fetchReport();
        };


    const reportEntries =
        Array.isArray(
            reportData.plan_entries
        )
            ? reportData.plan_entries
            : [];


    const reportHistory =
        Array.isArray(
            reportData
                .plan_status_history
        )
            ? reportData
                .plan_status_history
            : [];


    /* ========================================================
       RENDER
    ======================================================== */

    const visualLiveStatus=useLiveRefresh(showRuntime,async()=>{const response=await shiftPlanService.getRuntime();setRuntimeData(responseData(response)||{});});
    return (

        <> <OperationsLaunch onRuntime={openRuntime} onReport={openReport}/><>

<div
            className="shift-plan-page"
        >

            <style>
                {styles}
            </style>


            {/* =================================================
                TOAST
            ================================================= */}

            {
                toast && (

                    <div
                        className={
                            `sp-toast ${toast.type}`
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
                className="sp-header"
            >

                <Row
                    className="align-items-center"
                >

                    <Col lg={5}>

                        <h2
                            className="sp-header-title"
                        >
                            Shift Plan
                        </h2>


                        <div
                            className="sp-breadcrumb"
                        >
                            Planning / Shift Plan
                        </div>

                    </Col>


                    <Col lg={7}>

                        <div
                            className="sp-header-buttons"
                        >

                            <Button
                                className="sp-outline-button"
                                onClick={
                                    () =>
                                        setShowConfig(
                                            true
                                        )
                                }
                            >
                                ⚙ Active Configuration
                            </Button>


                            <Button
                                className="sp-add-button"
                                onClick={
                                    openAddMaster
                                }
                            >
                                + Add Shift Plan Rule
                            </Button>

                        </div>

                    </Col>

                </Row>

            </div>


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div
                className="sp-toolbar"
            >

                <Row
                    className="align-items-center g-3"
                >

                    <Col
                        xl={5}
                        lg={5}
                    >

                        <div
                            className="sp-search-wrapper"
                        >

                            <div
                                className="sp-search-icon"
                            >
                                ⌕
                            </div>


                            <Form.Control
                                className="sp-search-input"
                                placeholder="Search..."
                                value={
                                    search
                                }
                                onChange={
                                    event =>
                                        setSearch(
                                            event
                                                .target
                                                .value
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
                            className="sp-filter"
                            value={
                                activeFilter
                            }
                            onChange={
                                event =>
                                    setActiveFilter(
                                        event
                                            .target
                                            .value
                                    )
                            }
                        >

                            <option value="">
                                All Status
                            </option>

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="INACTIVE">
                                Inactive
                            </option>

                        </Form.Select>

                    </Col>


                    <Col
                        xl={4}
                        lg={4}
                    >

                        <div
                            className="sp-toolbar-actions"
                        >

                            <Button
                                title="Refresh"
                                className="sp-tool-button sp-refresh-button"
                                onClick={
                                    refresh
                                }
                            >
                                ↻
                            </Button>


                            <Button
                                title="Execute"
                                className="sp-tool-button sp-execute-button"
                                onClick={
                                    openExecute
                                }
                            >
                                ▶
                            </Button>


                            <Button
                                title="Runtime"
                                className="sp-tool-button sp-runtime-button"
                                onClick={
                                    openRuntime
                                }
                            >
                                ◷
                            </Button>


                            <Button
                                title="Report"
                                className="sp-tool-button sp-report-button"
                                onClick={
                                    openReport
                                }
                            >
                                ▣
                            </Button>

                        </div>

                    </Col>

                </Row>

            </div>


            {/* =================================================
                MASTER TABLE
            ================================================= */}

            <div
                className="sp-table-card"
            >

                <div
                    className="table-responsive"
                >

                    <Table
                        className="sp-table"
                    >

                        <thead>

                            <tr>

                                <th>RULE CODE</th>

                                <th>RULE NAME</th>

                                <th>PLANT</th>

                                <th>LINE</th>

                                <th>SHIFT</th>

                                <th>PROCESS</th>

                                <th>PART</th>

                                <th>MODE</th>

                                <th>TRIGGER</th>

                                <th>OFFSET</th>

                                <th>DEFAULT QTY</th>

                                <th>VERSION</th>

                                <th>STATUS</th>

                                <th>ACTIONS</th>

                            </tr>

                        </thead>


                        <tbody>

                            {
                                masterQuery.isLoading
                                    ? (

                                        <tr>

                                            <td
                                                colSpan={14}
                                                className="sp-empty"
                                            >

                                                <Spinner
                                                    size="sm"
                                                    animation="border"
                                                />

                                            </td>

                                        </tr>
                                    )

                                    : filteredRules.length ===
                                      0
                                        ? (

                                            <tr>

                                                <td
                                                    colSpan={14}
                                                    className="sp-empty"
                                                >
                                                    No Shift Plan rules found.
                                                </td>

                                            </tr>
                                        )

                                        : filteredRules.map(
                                            rule => (

                                                <tr
                                                    key={
                                                        rule
                                                            .plan_generation_rule_id
                                                    }
                                                >

                                                    <td
                                                        className="sp-rule-code"
                                                    >
                                                        {
                                                            rule.rule_code
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            rule.rule_name
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            plantName(
                                                                rule.plant_id
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            lineName(
                                                                rule.line_id
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            shiftName(
                                                                rule.shift_id
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            processName(
                                                                rule.process_id
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            partName(
                                                                rule.part_id
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            rule
                                                                .generation_mode
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            rule
                                                                .trigger_type
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            rule
                                                                .trigger_offset_min
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            rule
                                                                .default_target_qty ??
                                                            "-"
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            rule
                                                                .version_no
                                                        }
                                                    </td>


                                                    <td>

                                                        <span
                                                            className={
                                                                rule.is_active
                                                                    ? "sp-status active"
                                                                    : "sp-status inactive"
                                                            }
                                                        >
                                                            {
                                                                rule.is_active
                                                                    ? "ACTIVE"
                                                                    : "INACTIVE"
                                                            }
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <Button
                                                            title="Edit"
                                                            className="sp-action-button sp-edit-button"
                                                            onClick={
                                                                () =>
                                                                    openEditMaster(
                                                                        rule
                                                                    )
                                                            }
                                                        >
                                                            ✎
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
                RULE CREATE / UPDATE FORM
            ================================================= */}

            <Modal
                show={
                    showRuleForm
                }
                onHide={
                    () =>
                        setShowRuleForm(
                            false
                        )
                }
                size="xl"
                centered
                className="sp-modal"
            >

                <Form
                    onSubmit={
                        saveRule
                    }
                >

                    <Modal.Header
                        closeButton
                    >

                        <Modal.Title>

                            {
                                ruleFormMode ===
                                "MASTER_EDIT"

                                    ? "Edit Shift Plan Rule"

                                    : ruleFormMode ===
                                      "CONFIG_EDIT"

                                        ? "Edit Shift Plan Configuration"

                                        : ruleFormMode ===
                                          "CONFIG_CREATE"

                                            ? "Add Shift Plan Configuration"

                                            : "Add Shift Plan Rule"
                            }

                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Row
                            className="g-3"
                        >

                            {/* COMPANY */}

                            <Col md={4}>

                                <Form.Label>
                                    Company *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        ruleForm
                                            .company_id
                                    }disabled={isRuleEdit}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    company_id:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Company
                                    </option>

                                    {
                                        companies.map(
                                            row => (

                                                <option
                                                    key={
                                                        row.company_id
                                                    }
                                                    value={
                                                        row.company_id
                                                    }
                                                >
                                                    {
                                                        row.company_name ||
                                                        row.company_code
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            {/* PLANT */}

                            <Col md={4}>

                                <Form.Label>
                                    Plant
                                </Form.Label>

                                <Form.Select
                                    value={
                                        ruleForm
                                            .plant_id
                                    }disabled={isRuleEdit}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    plant_id:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Company-wide
                                    </option>

                                    {
                                        plants.map(
                                            row => (

                                                <option
                                                    key={
                                                        row.plant_id
                                                    }
                                                    value={
                                                        row.plant_id
                                                    }
                                                >
                                                    {
                                                        row.plant_name ||
                                                        row.shop_name ||
                                                        row.plant_code
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            {/* LINE */}

                            <Col md={4}>

                                <Form.Label>
                                    Line *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        ruleForm
                                            .line_id
                                    }disabled={isRuleEdit}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    line_id:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Line
                                    </option>

                                    {
                                        lines.map(
                                            row => (

                                                <option
                                                    key={
                                                        row.line_id
                                                    }
                                                    value={
                                                        row.line_id
                                                    }
                                                >
                                                    {
                                                        row.line_name ||
                                                        row.line_code
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            {/* SHIFT */}

                            <Col md={4}>

                                <Form.Label>
                                    Shift
                                </Form.Label>

                                <Form.Select
                                    value={
                                        ruleForm
                                            .shift_id
                                    }disabled={isRuleEdit}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    shift_id:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        All Eligible Shifts
                                    </option>

                                    {
                                        shifts.map(
                                            row => (

                                                <option
                                                    key={
                                                        row.shift_id
                                                    }
                                                    value={
                                                        row.shift_id
                                                    }
                                                >
                                                    {
                                                        row.shift_name ||
                                                        row.shift_code ||
                                                        row.shift_no ||
                                                        `Shift ${row.shift_id}`
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            {/* PROCESS */}

                            <Col md={4}>

                                <Form.Label>
                                    Process
                                </Form.Label>

                                <Form.Select
                                    value={
                                        ruleForm
                                            .process_id
                                    }disabled={isRuleEdit}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    process_id:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        All Processes
                                    </option>

                                    {
                                        processes.map(
                                            row => (

                                                <option
                                                    key={
                                                        row.process_id
                                                    }
                                                    value={
                                                        row.process_id
                                                    }
                                                >
                                                    {
                                                        row.process_name ||
                                                        row.process_code ||
                                                        row.process_id
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            {/* PART */}

                            <Col md={4}>

                                <Form.Label>
                                    Part
                                </Form.Label>

                                <Form.Select
                                    value={
                                        ruleForm
                                            .part_id
                                    }disabled={isRuleEdit}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    part_id:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        All Parts
                                    </option>

                                    {
                                        parts.map(
                                            row => (

                                                <option
                                                    key={
                                                        row.part_id
                                                    }
                                                    value={
                                                        row.part_id
                                                    }
                                                >
                                                    {
                                                        row.part_name ||
                                                        row.part_code ||
                                                        row.part_id
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            {/* RULE CODE */}

                            <Col md={4}>

                                <Form.Label>
                                    Rule Code *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={60}
                                    value={
                                        ruleForm
                                            .rule_code
                                    }disabled={isRuleEdit}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    rule_code:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            {/* RULE NAME */}

                            <Col md={8}>

                                <Form.Label>
                                    Rule Name *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={150}
                                    value={
                                        ruleForm
                                            .rule_name
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    rule_name:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            {/* GENERATION MODE */}

                            <Col md={4}>

                                <Form.Label>
                                    Generation Mode *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={20}
                                    placeholder="e.g. AUTO / MANUAL / ERP"
                                    value={
                                        ruleForm
                                            .generation_mode
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    generation_mode:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                />

                                <div
                                    className="sp-help"
                                >
                                    Configured value.
                                </div>

                            </Col>


                            {/* TRIGGER TYPE */}

                            <Col md={4}>

                                <Form.Label>
                                    Trigger Type *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={30}
                                    placeholder="e.g. SHIFT_START"
                                    value={
                                        ruleForm
                                            .trigger_type
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    trigger_type:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                />

                                <div
                                    className="sp-help"
                                >
                                    Configured trigger event.
                                </div>

                            </Col>


                            {/* OFFSET */}

                            <Col md={4}>

                                <Form.Label>
                                    Trigger Offset Min *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    value={
                                        ruleForm
                                            .trigger_offset_min
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    trigger_offset_min:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            {/* SCHEDULE RULE */}

                            <Col md={6}>

                                <Form.Label>
                                    Schedule Rule ID
                                </Form.Label>

                                <Form.Control
                                    placeholder="Optional UUID"
                                    value={
                                        ruleForm
                                            .schedule_rule_id
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    schedule_rule_id:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                />

                                <div
                                    className="sp-help"
                                >
                                    Optional until Scheduling Rules configuration exists.
                                </div>

                            </Col>


                            {/* DEFAULT TARGET */}

                            <Col md={3}>

                                <Form.Label>
                                    Default Target Qty
                                </Form.Label>

                                <Form.Control
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={
                                        ruleForm
                                            .default_target_qty
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    default_target_qty:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            {/* VERSION */}

                            <Col md={3}>

                                <Form.Label>
                                    Version *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    value={
                                        ruleForm
                                            .version_no
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    version_no:
                                                        event
                                                            .target
                                                            .value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            {/* ACTIVE */}

                            <Col md={4}>

                                <Form.Label>
                                    Rule Status
                                </Form.Label>

                                <Form.Check
                                    type="switch"
                                    id="shift-plan-active"
                                    label={
                                        ruleForm.is_active
                                            ? "Active"
                                            : "Inactive"
                                    }
                                    checked={
                                        Boolean(
                                            ruleForm
                                                .is_active
                                        )
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    is_active:
                                                        event
                                                            .target
                                                            .checked
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
                                    setShowRuleForm(
                                        false
                                    )
                            }
                        >
                            Cancel
                        </Button>


                        <Button
                            type="submit"
                            className="sp-modal-primary"
                            disabled={
                                ruleMutation
                                    .isPending
                            }
                        >

                            {
                                ruleMutation
                                    .isPending && (

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
                ACTIVE CONFIGURATION
            ================================================= */}

            <Modal
                show={
                    showConfig
                }
                onHide={
                    () =>
                        setShowConfig(
                            false
                        )
                }
                size="xl"
                centered
                className="sp-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>
                        Shift Plan Active Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Row
                        className="g-3 mb-4"
                    >

                        <Col md={4}>

                            <div
                                className="sp-config-stat"
                            >

                                <div
                                    className="sp-config-stat-label"
                                >
                                    Shifts
                                </div>

                                <div
                                    className="sp-config-stat-value"
                                >
                                    {
                                        shifts.length
                                    }
                                </div>

                            </div>

                        </Col>


                        <Col md={4}>

                            <div
                                className="sp-config-stat"
                            >

                                <div
                                    className="sp-config-stat-label"
                                >
                                    Active Generation Rules
                                </div>

                                <div
                                    className="sp-config-stat-value"
                                >
                                    {
                                        activeGenerationRules
                                            .length
                                    }
                                </div>

                            </div>

                        </Col>


                        <Col md={4}>

                            <div
                                className="sp-config-stat"
                            >

                                <div
                                    className="sp-config-stat-label"
                                >
                                    Processes
                                </div>

                                <div
                                    className="sp-config-stat-value"
                                >
                                    {
                                        processes.length
                                    }
                                </div>

                            </div>

                        </Col>

                    </Row>


                    <div
                        className="d-flex justify-content-between align-items-center mb-3"
                    >

                        <div
                            className="sp-section-title mb-0"
                        >
                            Active Generation Rules
                        </div>


                        <Button
                            className="sp-add-button"
                            onClick={
                                openAddConfig
                            }
                        >
                            + Add Configuration
                        </Button>

                    </div>


                    <div
                        className="table-responsive"
                    >

                        <Table
                            className="sp-table"
                        >

                            <thead>

                                <tr>

                                    <th>RULE CODE</th>

                                    <th>RULE NAME</th>

                                    <th>LINE</th>

                                    <th>SHIFT</th>

                                    <th>PROCESS</th>

                                    <th>MODE</th>

                                    <th>TRIGGER</th>

                                    <th>ACTION</th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    configQuery.isLoading
                                        ? (

                                            <tr>

                                                <td
                                                    colSpan={8}
                                                    className="sp-empty"
                                                >
                                                    Loading configuration...
                                                </td>

                                            </tr>
                                        )

                                        : activeGenerationRules.length ===
                                          0
                                            ? (

                                                <tr>

                                                    <td
                                                        colSpan={8}
                                                        className="sp-empty"
                                                    >
                                                        No active configuration found.
                                                    </td>

                                                </tr>
                                            )

                                            : activeGenerationRules.map(
                                                rule => (

                                                    <tr
                                                        key={
                                                            rule
                                                                .plan_generation_rule_id
                                                        }
                                                    >

                                                        <td
                                                            className="sp-rule-code"
                                                        >
                                                            {
                                                                rule.rule_code
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                rule.rule_name
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                lineName(
                                                                    rule.line_id
                                                                )
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                shiftName(
                                                                    rule.shift_id
                                                                )
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                processName(
                                                                    rule.process_id
                                                                )
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                rule
                                                                    .generation_mode
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                rule
                                                                    .trigger_type
                                                            }
                                                        </td>


                                                        <td>

                                                            <Button
                                                                className="sp-action-button sp-edit-button"
                                                                onClick={
                                                                    () =>
                                                                        openEditConfig(
                                                                            rule
                                                                        )
                                                                }
                                                            >
                                                                ✎
                                                            </Button>

                                                        </td>

                                                    </tr>
                                                )
                                            )
                                }

                            </tbody>

                        </Table>

                    </div>

                </Modal.Body>

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
                className="sp-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>
                        Execute Shift Plan
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
                                        className="sp-execute-card"
                                        onClick={
                                            () =>
                                                setExecuteMode(
                                                    "GENERATE"
                                                )
                                        }
                                    >

                                        <div
                                            className="sp-execute-icon"
                                        >
                                            +
                                        </div>


                                        <div
                                            className="sp-execute-title"
                                        >
                                            Generate Plan Entry
                                        </div>


                                        <div
                                            className="sp-execute-description"
                                        >
                                            Apply an active plan generation rule and create a Plan Entry.
                                        </div>

                                    </div>

                                </Col>


                                <Col md={6}>

                                    <div
                                        className="sp-execute-card"
                                        onClick={
                                            () =>
                                                setExecuteMode(
                                                    "STATUS"
                                                )
                                        }
                                    >

                                        <div
                                            className="sp-execute-icon"
                                        >
                                            ✓
                                        </div>


                                        <div
                                            className="sp-execute-title"
                                        >
                                            Update Plan Entry Status
                                        </div>


                                        <div
                                            className="sp-execute-description"
                                        >
                                            Update an existing Plan Entry and create Plan Status History.
                                        </div>

                                    </div>

                                </Col>

                            </Row>
                        )
                    }


                    {/* =========================================
                        GENERATE ENTRY
                    ========================================= */}

                    {
                        executeMode ===
                        "GENERATE" && (

                            <Form
                                onSubmit={
                                    saveGenerate
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

                                    <Col md={12}>

                                        <Form.Label>
                                            Generation Rule *
                                        </Form.Label>

                                        <Form.Select
                                            required
                                            value={
                                                generateForm
                                                    .plan_generation_rule_id
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            plan_generation_rule_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        >

                                            <option value="">
                                                Select Generation Rule
                                            </option>

                                            {
                                                activeGenerationRules.map(
                                                    rule => (

                                                        <option
                                                            key={
                                                                rule
                                                                    .plan_generation_rule_id
                                                            }
                                                            value={
                                                                rule
                                                                    .plan_generation_rule_id
                                                            }
                                                        >
                                                            {
                                                                rule.rule_code
                                                            }
                                                            {" - "}
                                                            {
                                                                rule.rule_name
                                                            }
                                                        </option>
                                                    )
                                                )
                                            }

                                        </Form.Select>

                                    </Col>


                                  <Col md={6}>

    <Form.Label>
        Production Plan *
    </Form.Label>

    <Form.Select
        required
        value={
            generateForm.plan_id
        }
        onChange={
            event =>
                setGenerateForm(
                    old => ({
                        ...old,

                        plan_id:
                            event.target.value
                    })
                )
        }
    >

        <option value="">
            Select Production Plan
        </option>

        {
            productionPlans.map(
                plan => (

                    <option
                        key={
                            plan.plan_id
                        }
                        value={
                            plan.plan_id
                        }
                    >
                        {
                            plan.plan_code ||
                            plan.plan_no ||
                            plan.plan_name ||
                            plan.plan_id
                        }

                        {
                            plan.plan_name &&
                            plan.plan_code
                                ? ` - ${plan.plan_name}`
                                : ""
                        }
                    </option>
                )
            )
        }

    </Form.Select>

    {
        productionPlansQuery.isLoading && (
            <div className="sp-help">
                Loading Production Plans...
            </div>
        )
    }

    {
        !productionPlansQuery.isLoading &&
        productionPlans.length === 0 && (

            <div className="sp-help">
                No Production Plan found. Create a Production Plan first.
            </div>
        )
    }

</Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Machine *
                                        </Form.Label>

                                        <Form.Select
                                            required
                                            value={
                                                generateForm
                                                    .machine_id
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            machine_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        >

                                            <option value="">
                                                Select Machine
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


                                    <Col md={6}>

                                        <Form.Label>
                                            Order Item ID
                                        </Form.Label>

                                        <Form.Control
                                            placeholder="Optional UUID"
                                            value={
                                                generateForm
                                                    .order_item_id
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            order_item_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Shift
                                        </Form.Label>

                                        <Form.Select
                                            value={
                                                generateForm
                                                    .shift_id
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            shift_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        >

                                            <option value="">
                                                Use Generation Rule
                                            </option>

                                            {
                                                shifts.map(
                                                    row => (

                                                        <option
                                                            key={
                                                                row.shift_id
                                                            }
                                                            value={
                                                                row.shift_id
                                                            }
                                                        >
                                                            {
                                                                row.shift_name ||
                                                                row.shift_code ||
                                                                row.shift_no ||
                                                                `Shift ${row.shift_id}`
                                                            }
                                                        </option>
                                                    )
                                                )
                                            }

                                        </Form.Select>

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Process
                                        </Form.Label>

                                        <Form.Select
                                            value={
                                                generateForm
                                                    .process_id
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            process_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        >

                                            <option value="">
                                                Use Generation Rule
                                            </option>

                                            {
                                                processes.map(
                                                    row => (

                                                        <option
                                                            key={
                                                                row.process_id
                                                            }
                                                            value={
                                                                row.process_id
                                                            }
                                                        >
                                                            {
                                                                row.process_name ||
                                                                row.process_code
                                                            }
                                                        </option>
                                                    )
                                                )
                                            }

                                        </Form.Select>

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Part
                                        </Form.Label>

                                        <Form.Select
                                            value={
                                                generateForm
                                                    .part_id
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            part_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        >

                                            <option value="">
                                                Use Generation Rule
                                            </option>

                                            {
                                                parts.map(
                                                    row => (

                                                        <option
                                                            key={
                                                                row.part_id
                                                            }
                                                            value={
                                                                row.part_id
                                                            }
                                                        >
                                                            {
                                                                row.part_name ||
                                                                row.part_code
                                                            }
                                                        </option>
                                                    )
                                                )
                                            }

                                        </Form.Select>

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Sequence *
                                        </Form.Label>

                                        <Form.Control
                                            required
                                            type="number"
                                            min="1"
                                            value={
                                                generateForm
                                                    .sequence_no
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            sequence_no:
                                                                event
                                                                    .target
                                                                    .value
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
                                            min="0.001"
                                            step="0.001"
                                            placeholder="Use rule default"
                                            value={
                                                generateForm
                                                    .target_qty
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            target_qty:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Status
                                        </Form.Label>

                                        <Form.Control
                                            maxLength={30}
                                            value={
                                                generateForm
                                                    .status
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            status:
                                                                event
                                                                    .target
                                                                    .value
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
                                                generateForm
                                                    .previous_plan_entry_id
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            previous_plan_entry_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        >

                                            <option value="">
                                                None
                                            </option>

                                            {
                                                runtimeEntries.map(
                                                    entry => (

                                                        <option
                                                            key={
                                                                entry
                                                                    .plan_entry_id
                                                            }
                                                            value={
                                                                entry
                                                                    .plan_entry_id
                                                            }
                                                        >
                                                            Seq {
                                                                entry.sequence_no
                                                            }
                                                            {" - "}
                                                            {
                                                                machineName(
                                                                    entry.machine_id
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
                                            Operator User ID
                                        </Form.Label>

                                        <Form.Control
                                            type="number"
                                            min="1"
                                            value={
                                                generateForm
                                                    .planned_operator_user_id
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            planned_operator_user_id:
                                                                event
                                                                    .target
                                                                    .value
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
                                                generateForm
                                                    .planned_start
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            planned_start:
                                                                event
                                                                    .target
                                                                    .value
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
                                                generateForm
                                                    .planned_end
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            planned_end:
                                                                event
                                                                    .target
                                                                    .value
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
                                                generateForm
                                                    .reason
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            reason:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Source System
                                        </Form.Label>

                                        <Form.Control
                                            maxLength={50}
                                            value={
                                                generateForm
                                                    .source_system
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            source_system:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Correlation ID
                                        </Form.Label>

                                        <Form.Control
                                            placeholder="Optional UUID"
                                            value={
                                                generateForm
                                                    .correlation_id
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            correlation_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Idempotency Key
                                        </Form.Label>

                                        <Form.Control
                                            maxLength={150}
                                            value={
                                                generateForm
                                                    .idempotency_key
                                            }
                                            onChange={
                                                event =>
                                                    setGenerateForm(
                                                        old => ({
                                                            ...old,

                                                            idempotency_key:
                                                                event
                                                                    .target
                                                                    .value
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
                                                executeMutation
                                                    .isPending
                                            }
                                        >
                                            Generate Plan Entry
                                        </Button>

                                    </Col>

                                </Row>

                            </Form>
                        )
                    }


                    {/* =========================================
                        STATUS UPDATE
                    ========================================= */}

                    {
                        executeMode ===
                        "STATUS" && (

                            <Form
                                onSubmit={
                                    saveStatusUpdate
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

                                    <Col md={12}>

                                        <Form.Label>
                                            Generation Rule *
                                        </Form.Label>

                                        <Form.Select
                                            required
                                            value={
                                                statusForm
                                                    .plan_generation_rule_id
                                            }
                                            onChange={
                                                event =>
                                                    setStatusForm(
                                                        old => ({
                                                            ...old,

                                                            plan_generation_rule_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        >

                                            <option value="">
                                                Select Generation Rule
                                            </option>

                                            {
                                                activeGenerationRules.map(
                                                    rule => (

                                                        <option
                                                            key={
                                                                rule
                                                                    .plan_generation_rule_id
                                                            }
                                                            value={
                                                                rule
                                                                    .plan_generation_rule_id
                                                            }
                                                        >
                                                            {
                                                                rule.rule_code
                                                            }
                                                            {" - "}
                                                            {
                                                                rule.rule_name
                                                            }
                                                        </option>
                                                    )
                                                )
                                            }

                                        </Form.Select>

                                    </Col>


                                    <Col md={12}>

                                        <Form.Label>
                                            Plan Entry *
                                        </Form.Label>

                                        <Form.Select
                                            required
                                            value={
                                                statusForm
                                                    .plan_entry_id
                                            }
                                            onChange={
                                                event =>
                                                    setStatusForm(
                                                        old => ({
                                                            ...old,

                                                            plan_entry_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        >

                                            <option value="">
                                                Select Plan Entry
                                            </option>

                                            {
                                                runtimeEntries.map(
                                                    entry => (

                                                        <option
                                                            key={
                                                                entry
                                                                    .plan_entry_id
                                                            }
                                                            value={
                                                                entry
                                                                    .plan_entry_id
                                                            }
                                                        >
                                                            Seq {
                                                                entry.sequence_no
                                                            }
                                                            {" - "}
                                                            {
                                                                machineName(
                                                                    entry.machine_id
                                                                )
                                                            }
                                                            {" - "}
                                                            {
                                                                entry.status
                                                            }
                                                        </option>
                                                    )
                                                )
                                            }

                                        </Form.Select>

                                    </Col>


                                    <Col md={6}>

                                        <Form.Label>
                                            Current Status
                                        </Form.Label>

                                        <Form.Control
                                            readOnly
                                            value={
                                                runtimeEntries
                                                    .find(
                                                        entry =>
                                                            sameId(
                                                                entry
                                                                    .plan_entry_id,
                                                                statusForm
                                                                    .plan_entry_id
                                                            )
                                                    )
                                                    ?.status ||
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
                                            maxLength={30}
                                            value={
                                                statusForm
                                                    .new_status
                                            }
                                            onChange={
                                                event =>
                                                    setStatusForm(
                                                        old => ({
                                                            ...old,

                                                            new_status:
                                                                event
                                                                    .target
                                                                    .value
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
                                                statusForm
                                                    .reason
                                            }
                                            onChange={
                                                event =>
                                                    setStatusForm(
                                                        old => ({
                                                            ...old,

                                                            reason:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Source System
                                        </Form.Label>

                                        <Form.Control
                                            maxLength={50}
                                            value={
                                                statusForm
                                                    .source_system
                                            }
                                            onChange={
                                                event =>
                                                    setStatusForm(
                                                        old => ({
                                                            ...old,

                                                            source_system:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Correlation ID
                                        </Form.Label>

                                        <Form.Control
                                            placeholder="Optional UUID"
                                            value={
                                                statusForm
                                                    .correlation_id
                                            }
                                            onChange={
                                                event =>
                                                    setStatusForm(
                                                        old => ({
                                                            ...old,

                                                            correlation_id:
                                                                event
                                                                    .target
                                                                    .value
                                                        })
                                                    )
                                            }
                                        />

                                    </Col>


                                    <Col md={4}>

                                        <Form.Label>
                                            Idempotency Key
                                        </Form.Label>

                                        <Form.Control
                                            maxLength={150}
                                            value={
                                                statusForm
                                                    .idempotency_key
                                            }
                                            onChange={
                                                event =>
                                                    setStatusForm(
                                                        old => ({
                                                            ...old,

                                                            idempotency_key:
                                                                event
                                                                    .target
                                                                    .value
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
                                                executeMutation
                                                    .isPending
                                            }
                                        >
                                            Update Plan Entry Status
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
                className="sp-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>
                        Shift Plan Runtime
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body><LiveSync status={visualLiveStatus}/>{runtimeView === "ENTRIES" ? <PlanningBoard records={runtimeEntries} title="Shift allocation studio"/> : <EventJourney records={runtimeHistory} title="Shift status journey"/>}

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

                            : (

                                <>

                                    <div
                                        className="d-flex gap-2 mb-4"
                                    >

                                        <Button
                                            className={
                                                runtimeView ===
                                                "ENTRIES"

                                                    ? "sp-add-button"

                                                    : "sp-outline-button"
                                            }
                                            onClick={
                                                () =>
                                                    setRuntimeView(
                                                        "ENTRIES"
                                                    )
                                            }
                                        >
                                            Plan Entries
                                        </Button>


                                        <Button
                                            className={
                                                runtimeView ===
                                                "HISTORY"

                                                    ? "sp-add-button"

                                                    : "sp-outline-button"
                                            }
                                            onClick={
                                                () =>
                                                    setRuntimeView(
                                                        "HISTORY"
                                                    )
                                            }
                                        >
                                            Status History
                                        </Button>

                                    </div>


                                    {
                                        runtimeView ===
                                        "ENTRIES"
                                            ? (

                                                <div
                                                    className="table-responsive"
                                                >

                                                    <Table
                                                        className="sp-table"
                                                    >

                                                        <thead>

                                                            <tr>

                                                                <th>SEQ.</th>

                                                                <th>PLAN ID</th>

                                                                <th>MACHINE</th>

                                                                <th>SHIFT</th>

                                                                <th>PROCESS</th>

                                                                <th>PART</th>

                                                                <th>QTY</th>

                                                                <th>START</th>

                                                                <th>STATUS</th>

                                                            </tr>

                                                        </thead>


                                                        <tbody>

                                                            {
                                                                runtimeEntries.length ===
                                                                0
                                                                    ? (

                                                                        <tr>

                                                                            <td
                                                                                colSpan={9}
                                                                                className="sp-empty"
                                                                            >
                                                                                No runtime Plan Entries found.
                                                                            </td>

                                                                        </tr>
                                                                    )

                                                                    : runtimeEntries.map(
                                                                        row => (

                                                                            <tr
                                                                                key={
                                                                                    row
                                                                                        .plan_entry_id
                                                                                }
                                                                            >

                                                                                <td>
                                                                                    {
                                                                                        row.sequence_no
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        row.plan_id
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
                                                                                        shiftName(
                                                                                            row.shift_id
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
                                                                                        partName(
                                                                                            row.part_id
                                                                                        )
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        row.target_qty
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        row.planned_start
                                                                                            ? new Date(
                                                                                                row.planned_start
                                                                                            )
                                                                                                .toLocaleString()
                                                                                            : "-"
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        row.status
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

                                            : (

                                                <div
                                                    className="table-responsive"
                                                >

                                                    <Table
                                                        className="sp-table"
                                                    >

                                                        <thead>

                                                            <tr>

                                                                <th>EVENT TIME</th>

                                                                <th>PLAN ID</th>

                                                                <th>ENTRY ID</th>

                                                                <th>SHIFT</th>

                                                                <th>OLD STATUS</th>

                                                                <th>NEW STATUS</th>

                                                                <th>REASON</th>

                                                                <th>SOURCE</th>

                                                            </tr>

                                                        </thead>


                                                        <tbody>

                                                            {
                                                                runtimeHistory.length ===
                                                                0
                                                                    ? (

                                                                        <tr>

                                                                            <td
                                                                                colSpan={8}
                                                                                className="sp-empty"
                                                                            >
                                                                                No Plan Status History found.
                                                                            </td>

                                                                        </tr>
                                                                    )

                                                                    : runtimeHistory.map(
                                                                        row => (

                                                                            <tr
                                                                                key={
                                                                                    row.history_id
                                                                                }
                                                                            >

                                                                                <td>
                                                                                    {
                                                                                        row.event_ts
                                                                                            ? new Date(
                                                                                                row.event_ts
                                                                                            )
                                                                                                .toLocaleString()
                                                                                            : "-"
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        row.plan_id
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        row.plan_entry_id ||
                                                                                        "-"
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        shiftName(
                                                                                            row.shift_id
                                                                                        )
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        row.old_status ||
                                                                                        "-"
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        row.new_status
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        row.reason ||
                                                                                        "-"
                                                                                    }
                                                                                </td>

                                                                                <td>
                                                                                    {
                                                                                        row.source_system ||
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

                                </>
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
                className="sp-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>
                        Shift Plan Report
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>{reportView === "ENTRIES" ? <ReportLens records={reportEntries} title="Shift plan report explorer"/> : <ReportLens records={reportHistory} title="Shift history report explorer"/>}

                    <Row
                        className="g-2 mb-4"
                    >

                        <Col md={2}>

                            <Form.Label>
                                From Date
                            </Form.Label>

                            <Form.Control
                                type="date"
                                value={
                                    reportFrom
                                }
                                onChange={
                                    event =>
                                        setReportFrom(
                                            event
                                                .target
                                                .value
                                        )
                                }
                            />

                        </Col>


                        <Col md={2}>

                            <Form.Label>
                                To Date
                            </Form.Label>

                            <Form.Control
                                type="date"
                                value={
                                    reportTo
                                }
                                onChange={
                                    event =>
                                        setReportTo(
                                            event
                                                .target
                                                .value
                                        )
                                }
                            />

                        </Col>


                        <Col md={2}>

                            <Form.Label>
                                Shift
                            </Form.Label>

                            <Form.Select
                                value={
                                    reportShift
                                }
                                onChange={
                                    event =>
                                        setReportShift(
                                            event
                                                .target
                                                .value
                                        )
                                }
                            >

                                <option value="">
                                    All
                                </option>

                                {
                                    shifts.map(
                                        row => (

                                            <option
                                                key={
                                                    row.shift_id
                                                }
                                                value={
                                                    row.shift_id
                                                }
                                            >
                                                {
                                                    row.shift_name ||
                                                    row.shift_code ||
                                                    row.shift_no ||
                                                    `Shift ${row.shift_id}`
                                                }
                                            </option>
                                        )
                                    )
                                }

                            </Form.Select>

                        </Col>


                        <Col md={2}>

                            <Form.Label>
                                Process
                            </Form.Label>

                            <Form.Select
                                value={
                                    reportProcess
                                }
                                onChange={
                                    event =>
                                        setReportProcess(
                                            event
                                                .target
                                                .value
                                        )
                                }
                            >

                                <option value="">
                                    All
                                </option>

                                {
                                    processes.map(
                                        row => (

                                            <option
                                                key={
                                                    row.process_id
                                                }
                                                value={
                                                    row.process_id
                                                }
                                            >
                                                {
                                                    row.process_name ||
                                                    row.process_code
                                                }
                                            </option>
                                        )
                                    )
                                }

                            </Form.Select>

                        </Col>


                        <Col md={2}>

                            <Form.Label>
                                Status
                            </Form.Label>

                            <Form.Control
                                placeholder="All"
                                value={
                                    reportStatus
                                }
                                onChange={
                                    event =>
                                        setReportStatus(
                                            event
                                                .target
                                                .value
                                        )
                                }
                            />

                        </Col>


                        <Col
                            md={2}
                            className="d-flex align-items-end"
                        >

                            <Button
                                className="sp-modal-primary w-100"
                                onClick={
                                    fetchReport
                                }
                            >
                                Fetch Report
                            </Button>

                        </Col>

                    </Row>


                    <div
                        className="d-flex gap-2 mb-4"
                    >

                        <Button
                            className={
                                reportView ===
                                "ENTRIES"

                                    ? "sp-add-button"

                                    : "sp-outline-button"
                            }
                            onClick={
                                () =>
                                    setReportView(
                                        "ENTRIES"
                                    )
                            }
                        >
                            Plan Entries
                        </Button>


                        <Button
                            className={
                                reportView ===
                                "HISTORY"

                                    ? "sp-add-button"

                                    : "sp-outline-button"
                            }
                            onClick={
                                () =>
                                    setReportView(
                                        "HISTORY"
                                    )
                            }
                        >
                            Status History
                        </Button>

                    </div>


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

                            : reportView ===
                              "ENTRIES"
                                ? (

                                    <div
                                        className="table-responsive"
                                    >

                                        <Table
                                            className="sp-table"
                                        >

                                            <thead>

                                                <tr>

                                                    <th>SEQ.</th>

                                                    <th>PLAN ID</th>

                                                    <th>MACHINE</th>

                                                    <th>SHIFT</th>

                                                    <th>PROCESS</th>

                                                    <th>PART</th>

                                                    <th>QTY</th>

                                                    <th>START</th>

                                                    <th>END</th>

                                                    <th>STATUS</th>

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {
                                                    reportEntries.length ===
                                                    0
                                                        ? (

                                                            <tr>

                                                                <td
                                                                    colSpan={10}
                                                                    className="sp-empty"
                                                                >
                                                                    No report data found.
                                                                </td>

                                                            </tr>
                                                        )

                                                        : reportEntries.map(
                                                            row => (

                                                                <tr
                                                                    key={
                                                                        row
                                                                            .plan_entry_id
                                                                    }
                                                                >

                                                                    <td>
                                                                        {
                                                                            row.sequence_no
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.plan_id
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
                                                                            shiftName(
                                                                                row.shift_id
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
                                                                            partName(
                                                                                row.part_id
                                                                            )
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.target_qty
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.planned_start
                                                                                ? new Date(
                                                                                    row.planned_start
                                                                                )
                                                                                    .toLocaleString()
                                                                                : "-"
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.planned_end
                                                                                ? new Date(
                                                                                    row.planned_end
                                                                                )
                                                                                    .toLocaleString()
                                                                                : "-"
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.status
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

                                : (

                                    <div
                                        className="table-responsive"
                                    >

                                        <Table
                                            className="sp-table"
                                        >

                                            <thead>

                                                <tr>

                                                    <th>EVENT TIME</th>

                                                    <th>PLAN ID</th>

                                                    <th>ENTRY ID</th>

                                                    <th>SHIFT</th>

                                                    <th>MACHINE</th>

                                                    <th>OLD STATUS</th>

                                                    <th>NEW STATUS</th>

                                                    <th>REASON</th>

                                                    <th>SOURCE</th>

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {
                                                    reportHistory.length ===
                                                    0
                                                        ? (

                                                            <tr>

                                                                <td
                                                                    colSpan={9}
                                                                    className="sp-empty"
                                                                >
                                                                    No status history found.
                                                                </td>

                                                            </tr>
                                                        )

                                                        : reportHistory.map(
                                                            row => (

                                                                <tr
                                                                    key={
                                                                        row.history_id
                                                                    }
                                                                >

                                                                    <td>
                                                                        {
                                                                            row.event_ts
                                                                                ? new Date(
                                                                                    row.event_ts
                                                                                )
                                                                                    .toLocaleString()
                                                                                : "-"
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.plan_id
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.plan_entry_id ||
                                                                            "-"
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            shiftName(
                                                                                row.shift_id
                                                                            )
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
                                                                            row.old_status ||
                                                                            "-"
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.new_status
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.reason ||
                                                                            "-"
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.source_system ||
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


export default ShiftPlan;