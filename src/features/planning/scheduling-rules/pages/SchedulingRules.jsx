import useLiveRefresh from '../../../../shared/operations/useLiveRefresh.js';
import LiveSync from '../../../../shared/operations/LiveSync.jsx';
import OperationsLaunch from '../../../../shared/operations/OperationsLaunch.jsx';
import ReportLens from '../../../../shared/operations/ReportLens.jsx';
import EventJourney from '../../../../shared/operations/EventJourney.jsx';

import Table from '../../../../shared/components/SmartTable.jsx';
import React, {
    useMemo,
    useState
} from "react";

import {
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

import schedulingRulesService
    from "../api/schedulingRules.service.js";


/* ============================================================
   STYLES
============================================================ */

const styles = `

.sr-page {
    width: 100%;
    padding: 24px 28px;
    font-family: "Montserrat", "Segoe UI", Arial, sans-serif;
}

.sr-header {
    background: #ffffff;
    border: 1px solid #ececf4;
    border-radius: 15px;
    box-shadow: 0 5px 20px rgba(24, 29, 52, 0.06);
    padding: 23px 25px;
    margin-bottom: 25px;
    position: relative;
    overflow: hidden;
}

.sr-header::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 5px;
    background: linear-gradient(180deg, #314965, #17c7d9);
}

.sr-title {
    margin: 0;
    color: #171f3c;
    font-size: 22px;
    font-weight: 800;
}

.sr-breadcrumb {
    margin-top: 5px;
    color: #7d849e;
    font-size: 13px;
}

.sr-header-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 9px;
}

.sr-outline-btn {
    height: 42px !important;
    padding: 0 16px !important;
    background: #ffffff !important;
    border: 1px solid #314965 !important;
    color: #314965 !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
}

.sr-outline-btn:hover {
    background: #f6f8fa !important;
    color: #314965 !important;
}

.sr-primary-btn {
    height: 42px !important;
    padding: 0 18px !important;
    border: 1px solid #314965 !important;
    border-radius: 8px !important;
    color: #ffffff !important;
    background: linear-gradient(135deg, #314965, #314965) !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    box-shadow: 0 6px 16px rgba(103, 87, 245, 0.2) !important;
}

.sr-toolbar {
    background: #ffffff;
    border: 1px solid #ececf4;
    border-radius: 14px;
    box-shadow: 0 5px 18px rgba(24, 29, 52, 0.05);
    padding: 20px 22px;
    margin-bottom: 26px;
    position: relative;
    overflow: hidden;
}

.sr-toolbar::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: linear-gradient(180deg, #314965, #14c7d8);
}

.sr-search-wrap {
    display: flex;
    width: 100%;
}

.sr-search-icon {
    width: 48px;
    min-width: 48px;
    height: 47px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #dfe2ed;
    border-right: 0;
    border-radius: 9px 0 0 9px;
    background: #f8f9fc;
    color: #8b92aa;
    font-size: 18px;
}

.sr-search-input {
    height: 47px;
    border-radius: 0 9px 9px 0 !important;
    border-color: #dfe2ed !important;
    box-shadow: none !important;
}

.sr-filter {
    height: 47px;
    border-radius: 9px;
    border-color: #dfe2ed;
    font-size: 13px;
}

.sr-toolbar-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
}

.sr-tool-btn {
    width: 47px !important;
    height: 45px !important;
    padding: 0 !important;
    display: inline-flex !important;
    justify-content: center !important;
    align-items: center !important;
    background: #ffffff !important;
    border-radius: 9px !important;
    font-size: 16px !important;
    font-weight: 800 !important;
}

.sr-refresh {
    border: 1px solid #dfe3ec !important;
    color: #7e879b !important;
}

.sr-execute {
    border: 1px solid #21a66b !important;
    color: #15935b !important;
}

.sr-runtime {
    border: 1px solid #f0ae13 !important;
    color: #eba800 !important;
}

.sr-report {
    border: 1px solid #765fff !important;
    color: #6856f6 !important;
}

.sr-table-card {
    background: #ffffff;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 6px 22px rgba(24, 29, 52, 0.05);
}

.sr-table {
    margin: 0;
}

.sr-table thead th {
    background: #25325a;
    color: #ffffff;
    border: 0;
    padding: 15px 13px;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    vertical-align: middle;
}

.sr-table tbody td {
    padding: 13px;
    border-color: #edf0f5;
    color: #31384d;
    font-size: 13px;
    vertical-align: middle;
}

.sr-table tbody tr:hover {
    background: #fafaff;
}

.sr-code {
    color: #344cc5;
    font-weight: 700;
}

.sr-status {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    min-width: 76px;
    padding: 5px 11px;
    border-radius: 20px;
    color: #ffffff;
    font-size: 11px;
    font-weight: 800;
}

.sr-status.active {
    background: #18a66b;
}

.sr-status.inactive {
    background: #7e8798;
}

.sr-action-btn {
    width: 37px !important;
    height: 37px !important;
    padding: 0 !important;
    background: #ffffff !important;
    border: 1px solid #c65b30 !important;
    color: #314965 !important;
    border-radius: 8px !important;
}

.sr-empty {
    padding: 40px !important;
    text-align: center;
    color: #8b92a7 !important;
}

.sr-modal .modal-content {
    border: 0;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 20px 65px rgba(24, 29, 52, 0.24);
}

.sr-modal .modal-header {
    background: #ffffff;
    border-bottom: 1px solid #edf0f5;
    padding: 18px 22px;
}

.sr-modal .modal-title {
    color: #202945;
    font-size: 18px;
    font-weight: 800;
}

.sr-modal .modal-body {
    padding: 22px;
}

.sr-modal .modal-footer {
    border-top: 1px solid #edf0f5;
    padding: 14px 22px;
}

.sr-modal .form-label {
    margin-bottom: 5px;
    color: #51596d;
    font-size: 12px;
    font-weight: 700;
}

.sr-modal .form-control,
.sr-modal .form-select {
    min-height: 39px;
    border-radius: 8px;
    border-color: #dfe2eb;
    font-size: 13px;
}

.sr-modal .form-control:focus,
.sr-modal .form-select:focus {
    border-color: #c65b30;
    box-shadow: 0 0 0 0.17rem rgba(117, 97, 255, 0.12);
}

.sr-help {
    margin-top: 4px;
    color: #8a91a5;
    font-size: 11px;
}

.sr-warning {
    margin-top: 7px;
    padding: 9px 11px;
    border-radius: 7px;
    background: #fff8e8;
    color: #9a6a00;
    font-size: 11px;
}

.sr-config-stat {
    padding: 15px;
    background: #f8f9fd;
    border: 1px solid #eaecf3;
    border-radius: 10px;
}

.sr-config-label {
    color: #8990a4;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
}

.sr-config-value {
    margin-top: 5px;
    color: #252e4c;
    font-size: 22px;
    font-weight: 800;
}

.sr-section-title {
    color: #242c48;
    font-size: 14px;
    font-weight: 800;
}

.sr-toast {
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
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.16);
}

.sr-toast.success {
    background: #daf5e7;
    color: #166b43;
    border: 1px solid #b9e9cf;
}

.sr-toast.error {
    background: #fde1e4;
    color: #9e2530;
    border: 1px solid #f5b9bf;
}

@media (max-width: 991px) {
    .sr-page {
        padding: 18px;
    }

    .sr-header-actions,
    .sr-toolbar-actions {
        justify-content: flex-start;
        margin-top: 15px;
    }
}

`;


/* ============================================================
   HELPERS
============================================================ */

const sameId =
    (a, b) =>
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

        const data =
            responseData(response);


        if (Array.isArray(data)) {
            return data;
        }


        if (
            Array.isArray(
                data?.rows
            )
        ) {
            return data.rows;
        }


        return [];
    };


const getErrorMessage =
    (
        error,
        fallback
    ) => {

        const body =
            error?.response?.data;


        if (
            Array.isArray(body?.errors) &&
            body.errors.length > 0
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
            Object.entries(object)
                .filter(
                    ([, value]) =>
                        value !== "" &&
                        value !== undefined &&
                        value !== null
                )
        );


/* ============================================================
   EMPTY FORMS
============================================================ */

const emptyPriority =
    () => ({
        priority_config_id: "",
        company_id: "",
        priority_code: "",
        priority_name: "",
        priority_rank: 1,
        score_expression: "",
        is_active: true,
        version_no: 1
    });


const emptyCapacity =
    () => ({
        capacity_id: "",
        company_id: "",
        plant_id: "",
        line_id: "",
        machine_id: "",
        shift_id: "",
        capacity_code: "",
        available_mins: "",
        target_qty: "",
        efficiency_factor: 1,
        effective_from: today(),
        effective_to: "",
        is_active: true,
        version_no: 1
    });


const emptyRule =
    () => ({
        rule_id: "",
        company_id: "",
        plant_id: "",
        line_id: "",
        rule_code: "",
        rule_name: "",
        priority_config_id: "",
        capacity_config_id: "",
        sequencing_strategy: "DUE_DATE",
        rule_expression: "",
        is_active: true,
        version_no: 1
    });


const emptyExecute =
    () => ({
        company_id: "",
        plant_id: "",
        line_id: "",
        machine_id: "",

        shift_id: "",

        plan_id: "",
        plan_entry_id: "",

        schedule_rule_id: "",

        event_type: "",

        sequence_no: "",

        scheduled_start: "",
        scheduled_end: "",

        score_value: "",

        result_status: "COMPLETED",

        reason: "",

        correlation_id: "",
        idempotency_key: ""
    });


/* ============================================================
   COMPONENT
============================================================ */

const SchedulingRules = () => {

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
        statusFilter,
        setStatusFilter
    ] =
        useState("");


    const [
        toast,
        setToast
    ] =
        useState(null);


    const notify =
        (
            message,
            type = "success"
        ) => {

            setToast({
                message,
                type
            });


            window.setTimeout(
                () => setToast(null),
                3500
            );
        };


    /* ========================================================
       MODALS
    ======================================================== */

    const [
        showPriority,
        setShowPriority
    ] =
        useState(false);


    const [
        showCapacity,
        setShowCapacity
    ] =
        useState(false);


    const [
        showRule,
        setShowRule
    ] =
        useState(false);


    const [
        showExecute,
        setShowExecute
    ] =
        useState(false);


    const [
        showRuntime,
        setShowRuntime
    ] =
        useState(false);


    const [
        showReport,
        setShowReport
    ] =
        useState(false);


    /* ========================================================
       FORMS
    ======================================================== */

    const [
        priorityForm,
        setPriorityForm
    ] =
        useState(
            emptyPriority()
        );


    const [
        priorityEditing,
        setPriorityEditing
    ] =
        useState(false);


    const [
        capacityForm,
        setCapacityForm
    ] =
        useState(
            emptyCapacity()
        );


    const [
        capacityEditing,
        setCapacityEditing
    ] =
        useState(false);


    const [
        ruleForm,
        setRuleForm
    ] =
        useState(
            emptyRule()
        );


    const [
        ruleEditing,
        setRuleEditing
    ] =
        useState(false);


    const [
        executeForm,
        setExecuteForm
    ] =
        useState(
            emptyExecute()
        );


    /* ========================================================
       RUNTIME
    ======================================================== */

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


    /* ========================================================
       REPORT
    ======================================================== */

    const [
        reportLoading,
        setReportLoading
    ] =
        useState(false);


    const [
        reportRows,
        setReportRows
    ] =
        useState([]);


    const [
        reportFilters,
        setReportFilters
    ] =
        useState({
            company_id: "",
            plant_id: "",
            line_id: "",
            machine_id: "",
            shift_id: "",
            schedule_rule_id: "",
            event_type: "",
            result_status: "",
            from_date: today(),
            to_date: today()
        });


    /* ========================================================
       MODULE DATA
    ======================================================== */

    const priorityQuery =
        useQuery({

            queryKey: [
                "scheduling-rules",
                "priority"
            ],

            queryFn:
                () =>
                    schedulingRulesService
                        .getPriorityConfigs()
        });


    const capacityQuery =
        useQuery({

            queryKey: [
                "scheduling-rules",
                "capacity"
            ],

            queryFn:
                () =>
                    schedulingRulesService
                        .getCapacityConfigs()
        });


    const rulesQuery =
        useQuery({

            queryKey: [
                "scheduling-rules",
                "rules"
            ],

            queryFn:
                () =>
                    schedulingRulesService
                        .getScheduleRules()
        });


    const configQuery =
        useQuery({

            queryKey: [
                "scheduling-rules",
                "config"
            ],

            queryFn:
                () =>
                    schedulingRulesService
                        .getConfig()
        });


    const priorities =
        responseRows(
            priorityQuery.data
        );


    const capacities =
        responseRows(
            capacityQuery.data
        );


    const scheduleRules =
        responseRows(
            rulesQuery.data
        );


    const activeConfig =
        responseData(
            configQuery.data
        ) || {};


    const activePriorities =
        Array.isArray(
            activeConfig.priority_configs
        )
            ? activeConfig.priority_configs
            : [];


    const activeCapacities =
        Array.isArray(
            activeConfig.capacity_configs
        )
            ? activeConfig.capacity_configs
            : [];


    const activeRules =
        Array.isArray(
            activeConfig.schedule_rules
        )
            ? activeConfig.schedule_rules
            : [];


    /* ========================================================
       LOOKUPS

       These endpoints already exist in the MES masters.

       No unconfirmed Shift lookup API is added.
       shift_id therefore remains an INTEGER input.
    ======================================================== */

    const companyQuery =
        useQuery({

            queryKey: [
                "scheduling-company"
            ],

            queryFn:
                () =>
                    api.get(
                        "/company-master/master"
                    ),

            retry: false
        });


    const plantQuery =
        useQuery({

            queryKey: [
                "scheduling-plant"
            ],

            queryFn:
                () =>
                    api.get(
                        "/plant-shop-master/master"
                    ),

            retry: false
        });


    const lineQuery =
        useQuery({

            queryKey: [
                "scheduling-line"
            ],

            queryFn:
                () =>
                    api.get(
                        "/line-master/master"
                    ),

            retry: false
        });


    const machineQuery =
        useQuery({

            queryKey: [
                "scheduling-machine"
            ],

            queryFn:
                () =>
                    api.get(
                        "/machine-master/master"
                    ),

            retry: false
        });


    const companies =
        responseRows(
            companyQuery.data
        );


    const plants =
        responseRows(
            plantQuery.data
        );


    const lines =
        responseRows(
            lineQuery.data
        );


    const machines =
        responseRows(
            machineQuery.data
        );


    /* ========================================================
       DISPLAY HELPERS
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
                return "All Plants";
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

            if (!id) {
                return "All Lines";
            }


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
                id
            );
        };


    const machineName =
        id => {

            if (!id) {
                return "All Machines";
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


    const priorityName =
        id => {

            if (!id) {
                return "-";
            }


            const row =
                priorities.find(
                    item =>
                        sameId(
                            item.priority_config_id,
                            id
                        )
                );


            return (
                row
                    ? `${
                        row.priority_code
                    } - ${
                        row.priority_name
                    }`
                    : id
            );
        };


    const capacityName =
        id => {

            if (!id) {
                return "-";
            }


            const row =
                capacities.find(
                    item =>
                        sameId(
                            item.capacity_id,
                            id
                        )
                );


            return (
                row?.capacity_code ||
                id
            );
        };


    const ruleName =
        id => {

            const row =
                scheduleRules.find(
                    item =>
                        sameId(
                            item.rule_id,
                            id
                        )
                );


            return (
                row
                    ? `${
                        row.rule_code
                    } - ${
                        row.rule_name
                    }`
                    : id || "-"
            );
        };


    /* ========================================================
       MAIN TABLE FILTER
    ======================================================== */

    const filteredRules =
        useMemo(
            () => {

                const term =
                    search
                        .trim()
                        .toLowerCase();


                return scheduleRules
                    .filter(
                        row => {

                            if (
                                statusFilter ===
                                "ACTIVE" &&
                                row.is_active !==
                                true
                            ) {
                                return false;
                            }


                            if (
                                statusFilter ===
                                "INACTIVE" &&
                                row.is_active ===
                                true
                            ) {
                                return false;
                            }


                            if (!term) {
                                return true;
                            }


                            const text = [

                                row.rule_code,
                                row.rule_name,

                                companyName(
                                    row.company_id
                                ),

                                plantName(
                                    row.plant_id
                                ),

                                lineName(
                                    row.line_id
                                ),

                                priorityName(
                                    row.priority_config_id
                                ),

                                capacityName(
                                    row.capacity_config_id
                                ),

                                row.sequencing_strategy,

                                row.version_no

                            ]
                                .join(" ")
                                .toLowerCase();


                            return text.includes(
                                term
                            );
                        }
                    );
            },
            [
                scheduleRules,
                search,
                statusFilter,
                companies,
                plants,
                lines,
                priorities,
                capacities
            ]
        );


    /* ========================================================
       REFRESH
    ======================================================== */

    const refreshAll =
        async () => {

            await queryClient
                .invalidateQueries({
                    queryKey: [
                        "scheduling-rules"
                    ]
                });
        };


    /* ========================================================
       PRIORITY CREATE / UPDATE
    ======================================================== */

    const priorityMutation =
        useMutation({

            mutationFn:
                payload => {

                    if (
                        priorityEditing
                    ) {

                        return schedulingRulesService
                            .updatePriorityConfig(
                                priorityForm
                                    .priority_config_id,
                                payload
                            );
                    }


                    return schedulingRulesService
                        .createPriorityConfig(
                            payload
                        );
                },

            onSuccess:
                async () => {

                    await refreshAll();


                    setPriorityForm(
                        emptyPriority()
                    );


                    setPriorityEditing(
                        false
                    );


                    notify(
                        priorityEditing
                            ? "Priority configuration updated successfully."
                            : "Priority configuration created successfully."
                    );
                },

            onError:
                error =>
                    notify(
                        getErrorMessage(
                            error,
                            "Unable to save Priority Configuration."
                        ),
                        "error"
                    )
        });


    const savePriority =
        event => {

            event.preventDefault();


            priorityMutation.mutate({

                company_id:
                    priorityForm.company_id,

                priority_code:
                    priorityForm
                        .priority_code
                        .trim(),

                priority_name:
                    priorityForm
                        .priority_name
                        .trim(),

                priority_rank:
                    Number(
                        priorityForm
                            .priority_rank
                    ),

                score_expression:
                    priorityForm
                        .score_expression
                        .trim() ||
                    null,

                is_active:
                    Boolean(
                        priorityForm
                            .is_active
                    ),

                version_no:
                    Number(
                        priorityForm
                            .version_no
                    )
            });
        };


    const editPriority =
        row => {

            setPriorityEditing(
                true
            );


            setPriorityForm({
                ...emptyPriority(),
                ...row,

                score_expression:
                    row.score_expression ||
                    ""
            });
        };


    /* ========================================================
       CAPACITY CREATE / UPDATE
    ======================================================== */

    const capacityMutation =
        useMutation({

            mutationFn:
                payload => {

                    if (
                        capacityEditing
                    ) {

                        return schedulingRulesService
                            .updateCapacityConfig(
                                capacityForm
                                    .capacity_id,
                                payload
                            );
                    }


                    return schedulingRulesService
                        .createCapacityConfig(
                            payload
                        );
                },

            onSuccess:
                async () => {

                    await refreshAll();


                    setCapacityForm(
                        emptyCapacity()
                    );


                    setCapacityEditing(
                        false
                    );


                    notify(
                        capacityEditing
                            ? "Capacity configuration updated successfully."
                            : "Capacity configuration created successfully."
                    );
                },

            onError:
                error =>
                    notify(
                        getErrorMessage(
                            error,
                            "Unable to save Capacity Configuration."
                        ),
                        "error"
                    )
        });


    const saveCapacity =
        event => {

            event.preventDefault();


            capacityMutation.mutate({

                company_id:
                    capacityForm.company_id,

                plant_id:
                    capacityForm.plant_id ||
                    null,

                line_id:
                    capacityForm.line_id ||
                    null,

                machine_id:
                    capacityForm.machine_id ||
                    null,

                shift_id:
                    capacityForm.shift_id ===
                    ""
                        ? null
                        : Number(
                            capacityForm.shift_id
                        ),

                capacity_code:
                    capacityForm
                        .capacity_code
                        .trim(),

                available_mins:
                    Number(
                        capacityForm
                            .available_mins
                    ),

                target_qty:
                    capacityForm.target_qty ===
                    ""
                        ? null
                        : Number(
                            capacityForm
                                .target_qty
                        ),

                efficiency_factor:
                    Number(
                        capacityForm
                            .efficiency_factor
                    ),

                effective_from:
                    capacityForm
                        .effective_from,

                effective_to:
                    capacityForm
                        .effective_to ||
                    null,

                is_active:
                    Boolean(
                        capacityForm
                            .is_active
                    ),

                version_no:
                    Number(
                        capacityForm
                            .version_no
                    )
            });
        };


    const editCapacity =
        row => {

            setCapacityEditing(
                true
            );


            setCapacityForm({
                ...emptyCapacity(),
                ...row,

                plant_id:
                    row.plant_id || "",

                line_id:
                    row.line_id || "",

                machine_id:
                    row.machine_id || "",

                shift_id:
                    row.shift_id ?? "",

                target_qty:
                    row.target_qty ?? "",

                effective_to:
                    row.effective_to
                        ? String(
                            row.effective_to
                        ).slice(0, 10)
                        : "",

                effective_from:
                    row.effective_from
                        ? String(
                            row.effective_from
                        ).slice(0, 10)
                        : today()
            });
        };


    /* ========================================================
       SCHEDULE RULE CREATE / UPDATE
    ======================================================== */

    const ruleMutation =
        useMutation({

            mutationFn:
                payload => {

                    if (
                        ruleEditing
                    ) {

                        return schedulingRulesService
                            .updateScheduleRule(
                                ruleForm.rule_id,
                                payload
                            );
                    }


                    return schedulingRulesService
                        .createScheduleRule(
                            payload
                        );
                },

            onSuccess:
                async () => {

                    await refreshAll();


                    setShowRule(
                        false
                    );


                    setRuleForm(
                        emptyRule()
                    );


                    setRuleEditing(
                        false
                    );


                    notify(
                        ruleEditing
                            ? "Scheduling Rule updated successfully."
                            : "Scheduling Rule created successfully."
                    );
                },

            onError:
                error =>
                    notify(
                        getErrorMessage(
                            error,
                            "Unable to save Scheduling Rule."
                        ),
                        "error"
                    )
        });


    const saveRule =
        event => {

            event.preventDefault();


            ruleMutation.mutate({

                company_id:
                    ruleForm.company_id,

                plant_id:
                    ruleForm.plant_id ||
                    null,

                line_id:
                    ruleForm.line_id ||
                    null,

                rule_code:
                    ruleForm
                        .rule_code
                        .trim(),

                rule_name:
                    ruleForm
                        .rule_name
                        .trim(),

                priority_config_id:
                    ruleForm
                        .priority_config_id ||
                    null,

                capacity_config_id:
                    ruleForm
                        .capacity_config_id ||
                    null,

                sequencing_strategy:
                    ruleForm
                        .sequencing_strategy
                        .trim(),

                rule_expression:
                    ruleForm
                        .rule_expression
                        .trim() ||
                    null,

                is_active:
                    Boolean(
                        ruleForm.is_active
                    ),

                version_no:
                    Number(
                        ruleForm.version_no
                    )
            });
        };


    const openAddRule =
        () => {

            setRuleEditing(
                false
            );


            setRuleForm(
                emptyRule()
            );


            setShowRule(
                true
            );
        };


    const editRule =
        row => {

            setRuleEditing(
                true
            );


            setRuleForm({
                ...emptyRule(),
                ...row,

                plant_id:
                    row.plant_id || "",

                line_id:
                    row.line_id || "",

                priority_config_id:
                    row.priority_config_id ||
                    "",

                capacity_config_id:
                    row.capacity_config_id ||
                    "",

                rule_expression:
                    row.rule_expression ||
                    ""
            });


            setShowRule(
                true
            );
        };


    /* ========================================================
       EXECUTE
    ======================================================== */

    const executeMutation =
        useMutation({

            mutationFn:
                payload =>
                    schedulingRulesService
                        .execute(
                            payload
                        ),

            onSuccess:
                async response => {

                    await refreshAll();


                    const result =
                        responseData(
                            response
                        );


                    setShowExecute(
                        false
                    );


                    setExecuteForm(
                        emptyExecute()
                    );


                    notify(
                        result?.idempotent
                            ? "Scheduling request was already processed."
                            : "Scheduling action executed successfully."
                    );
                },

            onError:
                error =>
                    notify(
                        getErrorMessage(
                            error,
                            "Unable to execute Scheduling Rule."
                        ),
                        "error"
                    )
        });


    const scheduleRuleChanged =
        event => {

            const id =
                event.target.value;


            const selected =
                activeRules.find(
                    row =>
                        sameId(
                            row.rule_id,
                            id
                        )
                );


            setExecuteForm(
                old => ({
                    ...old,

                    schedule_rule_id:
                        id,

                    company_id:
                        selected
                            ?.company_id ||
                        old.company_id,

                    plant_id:
                        selected
                            ?.plant_id ||
                        old.plant_id,

                    line_id:
                        selected
                            ?.line_id ||
                        old.line_id
                })
            );
        };


    const saveExecute =
        event => {

            event.preventDefault();


            executeMutation.mutate(
                cleanObject({

                    company_id:
                        executeForm.company_id,

                    plant_id:
                        executeForm.plant_id,

                    line_id:
                        executeForm.line_id,

                    machine_id:
                        executeForm.machine_id ||
                        null,

                    shift_id:
                        Number(
                            executeForm.shift_id
                        ),

                    plan_id:
                        executeForm.plan_id ||
                        null,

                    plan_entry_id:
                        executeForm
                            .plan_entry_id ||
                        null,

                    schedule_rule_id:
                        executeForm
                            .schedule_rule_id,

                    event_type:
                        executeForm
                            .event_type
                            .trim(),

                    sequence_no:
                        executeForm.sequence_no ===
                        ""
                            ? null
                            : Number(
                                executeForm
                                    .sequence_no
                            ),

                    scheduled_start:
                        toTimestamp(
                            executeForm
                                .scheduled_start
                        ),

                    scheduled_end:
                        toTimestamp(
                            executeForm
                                .scheduled_end
                        ),

                    score_value:
                        executeForm.score_value ===
                        ""
                            ? null
                            : Number(
                                executeForm
                                    .score_value
                            ),

                    result_status:
                        executeForm
                            .result_status
                            .trim(),

                    reason:
                        executeForm
                            .reason
                            .trim() ||
                        null,

                    correlation_id:
                        executeForm
                            .correlation_id ||
                        null,

                    idempotency_key:
                        executeForm
                            .idempotency_key
                            .trim() ||
                        null
                })
            );
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
                    await schedulingRulesService
                        .getRuntime();


                setRuntimeData(
                    responseData(
                        response
                    ) || {}
                );

            }
            catch (error) {

                notify(
                    getErrorMessage(
                        error,
                        "Unable to fetch Scheduling Rules runtime."
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


    const openRuntime =
        async () => {

            setShowRuntime(
                true
            );


            await loadRuntime();
        };


    const runtimeEvents =
        Array.isArray(
            runtimeData.schedule_events
        )
            ? runtimeData.schedule_events
            : [];


    /* ========================================================
       REPORT
    ======================================================== */

    const fetchReport =
        async () => {

            setReportLoading(
                true
            );


            try {

                const params =
                    cleanObject({

                        ...reportFilters,

                        shift_id:
                            reportFilters.shift_id ===
                            ""
                                ? undefined
                                : Number(
                                    reportFilters
                                        .shift_id
                                )
                    });


                const response =
                    await schedulingRulesService
                        .getReport(
                            params
                        );


                setReportRows(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                notify(
                    getErrorMessage(
                        error,
                        "Unable to fetch Scheduling Rules report."
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
       RENDER
    ======================================================== */

    const visualLiveStatus=useLiveRefresh(showRuntime,async()=>{const response=await schedulingRulesService.getRuntime();setRuntimeData(responseData(response)||{});});
    return (

        <> <OperationsLaunch onRuntime={openRuntime} onReport={openReport}/><>

<div className="sr-page">

            <style>
                {styles}
            </style>


            {
                toast && (

                    <div
                        className={
                            `sr-toast ${toast.type}`
                        }
                    >
                        {toast.message}
                    </div>
                )
            }


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="sr-header">

                <Row className="align-items-center">

                    <Col lg={4}>

                        <h2 className="sr-title">
                            Scheduling Rules
                        </h2>

                        <div className="sr-breadcrumb">
                            Planning / Scheduling Rules
                        </div>

                    </Col>


                    <Col lg={8}>

                        <div className="sr-header-actions">

                            <Button
                                className="sr-outline-btn"
                                onClick={
                                    () =>
                                        setShowPriority(
                                            true
                                        )
                                }
                            >
                                Priority Config
                            </Button>


                            <Button
                                className="sr-outline-btn"
                                onClick={
                                    () =>
                                        setShowCapacity(
                                            true
                                        )
                                }
                            >
                                Capacity Config
                            </Button>


                            <Button
                                className="sr-primary-btn"
                                onClick={
                                    openAddRule
                                }
                            >
                                + Add Scheduling Rule
                            </Button>

                        </div>

                    </Col>

                </Row>

            </div>


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="sr-toolbar">

                <Row className="g-3 align-items-center">

                    <Col lg={5}>

                        <div className="sr-search-wrap">

                            <div className="sr-search-icon">
                                ⌕
                            </div>

                            <Form.Control
                                className="sr-search-input"
                                placeholder="Search scheduling rules..."
                                value={search}
                                onChange={
                                    event =>
                                        setSearch(
                                            event.target.value
                                        )
                                }
                            />

                        </div>

                    </Col>


                    <Col lg={3}>

                        <Form.Select
                            className="sr-filter"
                            value={statusFilter}
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

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="INACTIVE">
                                Inactive
                            </option>

                        </Form.Select>

                    </Col>


                    <Col lg={4}>

                        <div className="sr-toolbar-actions">

                            <Button
                                title="Refresh"
                                className="sr-tool-btn sr-refresh"
                                onClick={
                                    refreshAll
                                }
                            >
                                ↻
                            </Button>


                            <Button
                                title="Execute"
                                className="sr-tool-btn sr-execute"
                                onClick={
                                    () => {

                                        setExecuteForm(
                                            emptyExecute()
                                        );

                                        setShowExecute(
                                            true
                                        );
                                    }
                                }
                            >
                                ▶
                            </Button>


                            <Button
                                title="Runtime"
                                className="sr-tool-btn sr-runtime"
                                onClick={
                                    openRuntime
                                }
                            >
                                ◷
                            </Button>


                            <Button
                                title="Report"
                                className="sr-tool-btn sr-report"
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
                SCHEDULE RULE TABLE
            ================================================= */}

            <div className="sr-table-card">

                <div className="table-responsive">

                    <Table className="sr-table">

                        <thead>

                            <tr>

                                <th>RULE CODE</th>
                                <th>RULE NAME</th>
                                <th>PLANT</th>
                                <th>LINE</th>
                                <th>PRIORITY</th>
                                <th>CAPACITY</th>
                                <th>STRATEGY</th>
                                <th>VERSION</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>

                            </tr>

                        </thead>


                        <tbody>

                            {
                                rulesQuery.isLoading
                                    ? (

                                        <tr>

                                            <td
                                                colSpan={10}
                                                className="sr-empty"
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
                                                    colSpan={10}
                                                    className="sr-empty"
                                                >
                                                    No Scheduling Rules found.
                                                </td>

                                            </tr>
                                        )

                                        : filteredRules.map(
                                            row => (

                                                <tr
                                                    key={
                                                        row.rule_id
                                                    }
                                                >

                                                    <td className="sr-code">
                                                        {row.rule_code}
                                                    </td>

                                                    <td>
                                                        {row.rule_name}
                                                    </td>

                                                    <td>
                                                        {
                                                            plantName(
                                                                row.plant_id
                                                            )
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            lineName(
                                                                row.line_id
                                                            )
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            priorityName(
                                                                row.priority_config_id
                                                            )
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            capacityName(
                                                                row.capacity_config_id
                                                            )
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.sequencing_strategy
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.version_no
                                                        }
                                                    </td>

                                                    <td>

                                                        <span
                                                            className={
                                                                row.is_active
                                                                    ? "sr-status active"
                                                                    : "sr-status inactive"
                                                            }
                                                        >
                                                            {
                                                                row.is_active
                                                                    ? "ACTIVE"
                                                                    : "INACTIVE"
                                                            }
                                                        </span>

                                                    </td>

                                                    <td>

                                                        <Button
                                                            className="sr-action-btn"
                                                            title="Edit"
                                                            onClick={
                                                                () =>
                                                                    editRule(
                                                                        row
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
                PRIORITY CONFIG MODAL
            ================================================= */}

            <Modal
                show={showPriority}
                onHide={
                    () => {

                        setShowPriority(
                            false
                        );

                        setPriorityEditing(
                            false
                        );

                        setPriorityForm(
                            emptyPriority()
                        );
                    }
                }
                size="xl"
                centered
                className="sr-modal"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Priority Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form
                        onSubmit={
                            savePriority
                        }
                    >

                        <Row className="g-3">

                            <Col md={4}>

                                <Form.Label>
                                    Company *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        priorityForm.company_id
                                    }disabled={priorityEditing}
                                    onChange={
                                        event =>
                                            setPriorityForm(
                                                old => ({
                                                    ...old,
                                                    company_id:
                                                        event.target.value
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


                            <Col md={3}>

                                <Form.Label>
                                    Priority Code *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={40}
                                    value={
                                        priorityForm.priority_code
                                    }
                                    onChange={
                                        event =>
                                            setPriorityForm(
                                                old => ({
                                                    ...old,
                                                    priority_code:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Priority Name *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={100}
                                    value={
                                        priorityForm.priority_name
                                    }
                                    onChange={
                                        event =>
                                            setPriorityForm(
                                                old => ({
                                                    ...old,
                                                    priority_name:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={2}>

                                <Form.Label>
                                    Rank *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    max="32767"
                                    value={
                                        priorityForm.priority_rank
                                    }
                                    onChange={
                                        event =>
                                            setPriorityForm(
                                                old => ({
                                                    ...old,
                                                    priority_rank:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={8}>

                                <Form.Label>
                                    Score Expression
                                </Form.Label>

                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={
                                        priorityForm.score_expression
                                    }
                                    onChange={
                                        event =>
                                            setPriorityForm(
                                                old => ({
                                                    ...old,
                                                    score_expression:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                                <div className="sr-help">
                                    Optional approved Rule/Formula Engine expression.
                                </div>

                                {
                                    priorityForm.score_expression &&
                                    priorityForm.is_active && (

                                        <div className="sr-warning">
                                            An active configuration with an expression requires the approved Rule Engine parser. Until that parser is connected, keep the expression blank or save this configuration as inactive.
                                        </div>
                                    )
                                }

                            </Col>


                            <Col md={2}>

                                <Form.Label>
                                    Version *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    value={
                                        priorityForm.version_no
                                    }
                                    onChange={
                                        event =>
                                            setPriorityForm(
                                                old => ({
                                                    ...old,
                                                    version_no:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={2}>

                                <Form.Label>
                                    Status
                                </Form.Label>

                                <Form.Check
                                    type="switch"
                                    label={
                                        priorityForm.is_active
                                            ? "Active"
                                            : "Inactive"
                                    }
                                    checked={
                                        Boolean(
                                            priorityForm.is_active
                                        )
                                    }
                                    onChange={
                                        event =>
                                            setPriorityForm(
                                                old => ({
                                                    ...old,
                                                    is_active:
                                                        event.target.checked
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col
                                md={12}
                                className="text-end"
                            >

                                {
                                    priorityEditing && (

                                        <Button
                                            variant="secondary"
                                            className="me-2"
                                            onClick={
                                                () => {

                                                    setPriorityEditing(
                                                        false
                                                    );

                                                    setPriorityForm(
                                                        emptyPriority()
                                                    );
                                                }
                                            }
                                        >
                                            Cancel Edit
                                        </Button>
                                    )
                                }


                                <Button
                                    type="submit"
                                    className="sr-primary-btn"
                                    disabled={
                                        priorityMutation.isPending
                                    }
                                >
                                    {
                                        priorityEditing
                                            ? "Update Priority"
                                            : "+ Add Priority"
                                    }
                                </Button>

                            </Col>

                        </Row>

                    </Form>


                    <hr className="my-4" />


                    <div className="table-responsive">

                        <Table className="sr-table">

                            <thead>

                                <tr>

                                    <th>CODE</th>
                                    <th>NAME</th>
                                    <th>RANK</th>
                                    <th>VERSION</th>
                                    <th>STATUS</th>
                                    <th>ACTION</th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    priorities.length ===
                                    0
                                        ? (

                                            <tr>

                                                <td
                                                    colSpan={6}
                                                    className="sr-empty"
                                                >
                                                    No Priority Configurations found.
                                                </td>

                                            </tr>
                                        )

                                        : priorities.map(
                                            row => (

                                                <tr
                                                    key={
                                                        row.priority_config_id
                                                    }
                                                >

                                                    <td className="sr-code">
                                                        {
                                                            row.priority_code
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.priority_name
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.priority_rank
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.version_no
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.is_active
                                                                ? "ACTIVE"
                                                                : "INACTIVE"
                                                        }
                                                    </td>

                                                    <td>

                                                        <Button
                                                            className="sr-action-btn"
                                                            onClick={
                                                                () =>
                                                                    editPriority(
                                                                        row
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
                CAPACITY CONFIG MODAL
            ================================================= */}

            <Modal
                show={showCapacity}
                onHide={
                    () => {

                        setShowCapacity(
                            false
                        );

                        setCapacityEditing(
                            false
                        );

                        setCapacityForm(
                            emptyCapacity()
                        );
                    }
                }
                size="xl"
                centered
                className="sr-modal"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Capacity Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form
                        onSubmit={
                            saveCapacity
                        }
                    >

                        <Row className="g-3">

                            <Col md={4}>

                                <Form.Label>
                                    Company *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        capacityForm.company_id
                                    }disabled={capacityEditing}
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    company_id:
                                                        event.target.value
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


                            <Col md={4}>

                                <Form.Label>
                                    Plant
                                </Form.Label>

                                <Form.Select
                                    value={
                                        capacityForm.plant_id
                                    }disabled={capacityEditing}
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    plant_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        All Plants
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


                            <Col md={4}>

                                <Form.Label>
                                    Line
                                </Form.Label>

                                <Form.Select
                                    value={
                                        capacityForm.line_id
                                    }disabled={capacityEditing}
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    line_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        All Lines
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


                            <Col md={4}>

                                <Form.Label>
                                    Machine
                                </Form.Label>

                                <Form.Select
                                    value={
                                        capacityForm.machine_id
                                    }disabled={capacityEditing}
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    machine_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        All Machines
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


                            <Col md={2}>

                                <Form.Label>
                                    Shift ID
                                </Form.Label>

                                <Form.Control
                                    type="number"
                                    min="1"
                                    placeholder="Optional"
                                    value={
                                        capacityForm.shift_id
                                    }readOnly={capacityEditing}
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    shift_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                                <div className="sr-help">
                                    Integer shift_master.shift_id.
                                </div>

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Capacity Code *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={60}
                                    value={
                                        capacityForm.capacity_code
                                    }
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    capacity_code:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Available Mins *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={
                                        capacityForm.available_mins
                                    }
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    available_mins:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Target Qty
                                </Form.Label>

                                <Form.Control
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={
                                        capacityForm.target_qty
                                    }
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    target_qty:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Efficiency Factor *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="0.00001"
                                    step="0.00001"
                                    value={
                                        capacityForm.efficiency_factor
                                    }
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    efficiency_factor:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Effective From *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="date"
                                    value={
                                        capacityForm.effective_from
                                    }
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    effective_from:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Effective To
                                </Form.Label>

                                <Form.Control
                                    type="date"
                                    value={
                                        capacityForm.effective_to
                                    }
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    effective_to:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={2}>

                                <Form.Label>
                                    Version *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    value={
                                        capacityForm.version_no
                                    }
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    version_no:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={2}>

                                <Form.Label>
                                    Status
                                </Form.Label>

                                <Form.Check
                                    type="switch"
                                    label={
                                        capacityForm.is_active
                                            ? "Active"
                                            : "Inactive"
                                    }
                                    checked={
                                        Boolean(
                                            capacityForm.is_active
                                        )
                                    }
                                    onChange={
                                        event =>
                                            setCapacityForm(
                                                old => ({
                                                    ...old,
                                                    is_active:
                                                        event.target.checked
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col
                                md={12}
                                className="text-end"
                            >

                                {
                                    capacityEditing && (

                                        <Button
                                            variant="secondary"
                                            className="me-2"
                                            onClick={
                                                () => {

                                                    setCapacityEditing(
                                                        false
                                                    );

                                                    setCapacityForm(
                                                        emptyCapacity()
                                                    );
                                                }
                                            }
                                        >
                                            Cancel Edit
                                        </Button>
                                    )
                                }


                                <Button
                                    type="submit"
                                    className="sr-primary-btn"
                                    disabled={
                                        capacityMutation.isPending
                                    }
                                >
                                    {
                                        capacityEditing
                                            ? "Update Capacity"
                                            : "+ Add Capacity"
                                    }
                                </Button>

                            </Col>

                        </Row>

                    </Form>


                    <hr className="my-4" />


                    <div className="table-responsive">

                        <Table className="sr-table">

                            <thead>

                                <tr>

                                    <th>CODE</th>
                                    <th>PLANT</th>
                                    <th>LINE</th>
                                    <th>MACHINE</th>
                                    <th>SHIFT</th>
                                    <th>MINS</th>
                                    <th>TARGET</th>
                                    <th>EFFICIENCY</th>
                                    <th>STATUS</th>
                                    <th>ACTION</th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    capacities.length ===
                                    0
                                        ? (

                                            <tr>

                                                <td
                                                    colSpan={10}
                                                    className="sr-empty"
                                                >
                                                    No Capacity Configurations found.
                                                </td>

                                            </tr>
                                        )

                                        : capacities.map(
                                            row => (

                                                <tr
                                                    key={
                                                        row.capacity_id
                                                    }
                                                >

                                                    <td className="sr-code">
                                                        {
                                                            row.capacity_code
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            plantName(
                                                                row.plant_id
                                                            )
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            lineName(
                                                                row.line_id
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
                                                            row.shift_id ??
                                                            "All"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.available_mins
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.target_qty ??
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.efficiency_factor
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.is_active
                                                                ? "ACTIVE"
                                                                : "INACTIVE"
                                                        }
                                                    </td>

                                                    <td>

                                                        <Button
                                                            className="sr-action-btn"
                                                            onClick={
                                                                () =>
                                                                    editCapacity(
                                                                        row
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
                RULE FORM
            ================================================= */}

            <Modal
                show={showRule}
                onHide={
                    () =>
                        setShowRule(false)
                }
                size="xl"
                centered
                className="sr-modal"
            >

                <Form onSubmit={saveRule}>

                    <Modal.Header closeButton>

                        <Modal.Title>
                            {
                                ruleEditing
                                    ? "Edit Scheduling Rule"
                                    : "Add Scheduling Rule"
                            }
                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Row className="g-3">

                            <Col md={4}>

                                <Form.Label>
                                    Company *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        ruleForm.company_id
                                    }disabled={ruleEditing}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    company_id:
                                                        event.target.value,

                                                    priority_config_id:
                                                        "",

                                                    capacity_config_id:
                                                        ""
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


                            <Col md={4}>

                                <Form.Label>
                                    Plant
                                </Form.Label>

                                <Form.Select
                                    value={
                                        ruleForm.plant_id
                                    } disabled={ruleEditing}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    plant_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        All Plants
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


                            <Col md={4}>

                                <Form.Label>
                                    Line
                                </Form.Label>

                                <Form.Select
                                    value={
                                        ruleForm.line_id
                                    }disabled={ruleEditing}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    line_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        All Lines
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


                            <Col md={4}>

                                <Form.Label>
                                    Rule Code *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={60}
                                    value={
                                        ruleForm.rule_code
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    rule_code:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={8}>

                                <Form.Label>
                                    Rule Name *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={150}
                                    value={
                                        ruleForm.rule_name
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    rule_name:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Priority Configuration
                                </Form.Label>

                                <Form.Select
                                    value={
                                        ruleForm.priority_config_id
                                    } disabled={ruleEditing}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    priority_config_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        None
                                    </option>

                                    {
                                        priorities
                                            .filter(
                                                row =>
                                                    !ruleForm.company_id ||
                                                    sameId(
                                                        row.company_id,
                                                        ruleForm.company_id
                                                    )
                                            )
                                            .map(
                                                row => (

                                                    <option
                                                        key={
                                                            row.priority_config_id
                                                        }
                                                        value={
                                                            row.priority_config_id
                                                        }
                                                    >
                                                        {
                                                            row.priority_code
                                                        }
                                                        {" - "}
                                                        {
                                                            row.priority_name
                                                        }
                                                    </option>
                                                )
                                            )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Capacity Configuration
                                </Form.Label>

                                <Form.Select
                                    value={
                                        ruleForm.capacity_config_id
                                    }disabled={ruleEditing}
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    capacity_config_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        None
                                    </option>

                                    {
                                        capacities
                                            .filter(
                                                row =>
                                                    !ruleForm.company_id ||
                                                    sameId(
                                                        row.company_id,
                                                        ruleForm.company_id
                                                    )
                                            )
                                            .map(
                                                row => (

                                                    <option
                                                        key={
                                                            row.capacity_id
                                                        }
                                                        value={
                                                            row.capacity_id
                                                        }
                                                    >
                                                        {
                                                            row.capacity_code
                                                        }
                                                    </option>
                                                )
                                            )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Sequencing Strategy *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={30}
                                    placeholder="e.g. DUE_DATE"
                                    value={
                                        ruleForm.sequencing_strategy
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    sequencing_strategy:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                                <div className="sr-help">
                                    Configured strategy, for example FIFO, DUE_DATE, PRIORITY, MIN_CHANGEOVER or CUSTOM.
                                </div>

                            </Col>


                            <Col md={8}>

                                <Form.Label>
                                    Rule Expression
                                </Form.Label>

                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={
                                        ruleForm.rule_expression
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    rule_expression:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                                {
                                    ruleForm.rule_expression &&
                                    ruleForm.is_active && (

                                        <div className="sr-warning">
                                            Active rule expressions require the approved Rule Engine parser. Until that parser is connected, leave the expression blank or save the rule as inactive.
                                        </div>
                                    )
                                }

                            </Col>


                            <Col md={2}>

                                <Form.Label>
                                    Version *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    value={
                                        ruleForm.version_no
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    version_no:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={2}>

                                <Form.Label>
                                    Status
                                </Form.Label>

                                <Form.Check
                                    type="switch"
                                    label={
                                        ruleForm.is_active
                                            ? "Active"
                                            : "Inactive"
                                    }
                                    checked={
                                        Boolean(
                                            ruleForm.is_active
                                        )
                                    }
                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,
                                                    is_active:
                                                        event.target.checked
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
                                    setShowRule(
                                        false
                                    )
                            }
                        >
                            Cancel
                        </Button>


                        <Button
                            type="submit"
                            className="sr-primary-btn"
                            disabled={
                                ruleMutation.isPending
                            }
                        >

                            {
                                ruleMutation.isPending && (

                                    <Spinner
                                        size="sm"
                                        animation="border"
                                        className="me-2"
                                    />
                                )
                            }

                            Save Scheduling Rule

                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>


            {/* =================================================
                EXECUTE
            ================================================= */}

            <Modal
                show={showExecute}
                onHide={
                    () =>
                        setShowExecute(false)
                }
                size="xl"
                centered
                className="sr-modal"
            >

                <Form onSubmit={saveExecute}>

                    <Modal.Header closeButton>

                        <Modal.Title>
                            Execute Scheduling Rule
                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Row className="g-3">

                            <Col md={6}>

                                <Form.Label>
                                    Scheduling Rule *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        executeForm.schedule_rule_id
                                    }
                                    onChange={
                                        scheduleRuleChanged
                                    }
                                >

                                    <option value="">
                                        Select Active Rule
                                    </option>

                                    {
                                        activeRules.map(
                                            row => (

                                                <option
                                                    key={
                                                        row.rule_id
                                                    }
                                                    value={
                                                        row.rule_id
                                                    }
                                                >
                                                    {
                                                        row.rule_code
                                                    }
                                                    {" - "}
                                                    {
                                                        row.rule_name
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Company *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        executeForm.company_id
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    company_id:
                                                        event.target.value
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


                            <Col md={4}>

                                <Form.Label>
                                    Plant *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        executeForm.plant_id
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    plant_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Plant
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


                            <Col md={4}>

                                <Form.Label>
                                    Line *
                                </Form.Label>

                                <Form.Select
                                    required
                                    value={
                                        executeForm.line_id
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    line_id:
                                                        event.target.value
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


                            <Col md={4}>

                                <Form.Label>
                                    Machine
                                </Form.Label>

                                <Form.Select
                                    value={
                                        executeForm.machine_id
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    machine_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        No Machine
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
                                    Shift ID *
                                </Form.Label>

                                <Form.Control
                                    required
                                    type="number"
                                    min="1"
                                    value={
                                        executeForm.shift_id
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    shift_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                                <div className="sr-help">
                                    Integer shift_master.shift_id.
                                </div>

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Event Type *
                                </Form.Label>

                                <Form.Control
                                    required
                                    maxLength={40}
                                    placeholder="e.g. SCHEDULED"
                                    value={
                                        executeForm.event_type
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    event_type:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Sequence No
                                </Form.Label>

                                <Form.Control
                                    type="number"
                                    min="1"
                                    value={
                                        executeForm.sequence_no
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    sequence_no:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label>
                                    Result Status
                                </Form.Label>

                                <Form.Control
                                    maxLength={20}
                                    value={
                                        executeForm.result_status
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    result_status:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Production Plan ID
                                </Form.Label>

                                <Form.Control
                                    placeholder="Optional plan_id UUID"
                                    value={
                                        executeForm.plan_id
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    plan_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label>
                                    Plan Entry ID
                                </Form.Label>

                                <Form.Control
                                    placeholder="Optional plan_entry_id UUID"
                                    value={
                                        executeForm.plan_entry_id
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    plan_entry_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Scheduled Start
                                </Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    value={
                                        executeForm.scheduled_start
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    scheduled_start:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Scheduled End
                                </Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    value={
                                        executeForm.scheduled_end
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    scheduled_end:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Label>
                                    Score Value
                                </Form.Label>

                                <Form.Control
                                    type="number"
                                    step="0.000001"
                                    value={
                                        executeForm.score_value
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    score_value:
                                                        event.target.value
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
                                        executeForm.reason
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    reason:
                                                        event.target.value
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
                                        executeForm.correlation_id
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    correlation_id:
                                                        event.target.value
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
                                    maxLength={150}
                                    value={
                                        executeForm.idempotency_key
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,
                                                    idempotency_key:
                                                        event.target.value
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
                                    setShowExecute(
                                        false
                                    )
                            }
                        >
                            Cancel
                        </Button>


                        <Button
                            type="submit"
                            variant="success"
                            disabled={
                                executeMutation.isPending
                            }
                        >
                            Execute Scheduling Rule
                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>


            {/* =================================================
                RUNTIME
            ================================================= */}

            <Modal
                show={showRuntime}
                onHide={
                    () =>
                        setShowRuntime(false)
                }
                size="xl"
                centered
                className="sr-modal"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Scheduling Rules Runtime
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body><LiveSync status={visualLiveStatus}/><EventJourney records={runtimeEvents} title="Scheduling decision stream"/>

                    {
                        runtimeLoading
                            ? (

                                <div className="text-center py-5">
                                    <Spinner animation="border" />
                                </div>
                            )

                            : (

                                <>

                                    <Row className="g-3 mb-4">

                                        <Col md={3}>

                                            <div className="sr-config-stat">

                                                <div className="sr-config-label">
                                                    Active Rules
                                                </div>

                                                <div className="sr-config-value">
                                                    {
                                                        runtimeData
                                                            ?.schedule_rules
                                                            ?.length ||
                                                        0
                                                    }
                                                </div>

                                            </div>

                                        </Col>


                                        <Col md={3}>

                                            <div className="sr-config-stat">

                                                <div className="sr-config-label">
                                                    Priorities
                                                </div>

                                                <div className="sr-config-value">
                                                    {
                                                        runtimeData
                                                            ?.priority_configs
                                                            ?.length ||
                                                        0
                                                    }
                                                </div>

                                            </div>

                                        </Col>


                                        <Col md={3}>

                                            <div className="sr-config-stat">

                                                <div className="sr-config-label">
                                                    Capacities
                                                </div>

                                                <div className="sr-config-value">
                                                    {
                                                        runtimeData
                                                            ?.capacity_configs
                                                            ?.length ||
                                                        0
                                                    }
                                                </div>

                                            </div>

                                        </Col>


                                        <Col md={3}>

                                            <div className="sr-config-stat">

                                                <div className="sr-config-label">
                                                    Events
                                                </div>

                                                <div className="sr-config-value">
                                                    {
                                                        runtimeEvents.length
                                                    }
                                                </div>

                                            </div>

                                        </Col>

                                    </Row>


                                    <div className="sr-section-title mb-3">
                                        Schedule Events
                                    </div>


                                    <div className="table-responsive">

                                        <Table className="sr-table">

                                            <thead>

                                                <tr>

                                                    <th>TIME</th>
                                                    <th>RULE</th>
                                                    <th>SHIFT</th>
                                                    <th>MACHINE</th>
                                                    <th>EVENT</th>
                                                    <th>SEQUENCE</th>
                                                    <th>SCORE</th>
                                                    <th>RESULT</th>
                                                    <th>REASON</th>

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {
                                                    runtimeEvents.length ===
                                                    0
                                                        ? (

                                                            <tr>

                                                                <td
                                                                    colSpan={9}
                                                                    className="sr-empty"
                                                                >
                                                                    No Schedule Events found.
                                                                </td>

                                                            </tr>
                                                        )

                                                        : runtimeEvents.map(
                                                            row => (

                                                                <tr
                                                                    key={
                                                                        row.schedule_event_id
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
                                                                            ruleName(
                                                                                row.schedule_rule_id
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
                                                                            machineName(
                                                                                row.machine_id
                                                                            )
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.event_type
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
                                                                            row.score_value ??
                                                                            "-"
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.result_status
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            row.reason ||
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

                                </>
                            )
                    }

                </Modal.Body>

            </Modal>


            {/* =================================================
                REPORT
            ================================================= */}

            <Modal
                show={showReport}
                onHide={
                    () =>
                        setShowReport(false)
                }
                size="xl"
                centered
                className="sr-modal"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Scheduling Rules Report
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body><ReportLens records={reportRows} title="Scheduling report explorer"/>

                    <Row className="g-2 mb-4">

                        <Col md={3}>

                            <Form.Label>
                                Company
                            </Form.Label>

                            <Form.Select
                                value={
                                    reportFilters.company_id
                                }
                                onChange={
                                    event =>
                                        setReportFilters(
                                            old => ({
                                                ...old,
                                                company_id:
                                                    event.target.value
                                            })
                                        )
                                }
                            >

                                <option value="">
                                    All Companies
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


                        <Col md={3}>

                            <Form.Label>
                                Shift ID
                            </Form.Label>

                            <Form.Control
                                type="number"
                                min="1"
                                placeholder="All"
                                value={
                                    reportFilters.shift_id
                                }
                                onChange={
                                    event =>
                                        setReportFilters(
                                            old => ({
                                                ...old,
                                                shift_id:
                                                    event.target.value
                                            })
                                        )
                                }
                            />

                        </Col>


                        <Col md={3}>

                            <Form.Label>
                                Scheduling Rule
                            </Form.Label>

                            <Form.Select
                                value={
                                    reportFilters
                                        .schedule_rule_id
                                }
                                onChange={
                                    event =>
                                        setReportFilters(
                                            old => ({
                                                ...old,
                                                schedule_rule_id:
                                                    event.target.value
                                            })
                                        )
                                }
                            >

                                <option value="">
                                    All Rules
                                </option>

                                {
                                    scheduleRules.map(
                                        row => (

                                            <option
                                                key={
                                                    row.rule_id
                                                }
                                                value={
                                                    row.rule_id
                                                }
                                            >
                                                {
                                                    row.rule_code
                                                }
                                                {" - "}
                                                {
                                                    row.rule_name
                                                }
                                            </option>
                                        )
                                    )
                                }

                            </Form.Select>

                        </Col>


                        <Col md={3}>

                            <Form.Label>
                                Event Type
                            </Form.Label>

                            <Form.Control
                                placeholder="All"
                                value={
                                    reportFilters.event_type
                                }
                                onChange={
                                    event =>
                                        setReportFilters(
                                            old => ({
                                                ...old,
                                                event_type:
                                                    event.target.value
                                            })
                                        )
                                }
                            />

                        </Col>


                        <Col md={3}>

                            <Form.Label>
                                Result Status
                            </Form.Label>

                            <Form.Control
                                placeholder="All"
                                value={
                                    reportFilters.result_status
                                }
                                onChange={
                                    event =>
                                        setReportFilters(
                                            old => ({
                                                ...old,
                                                result_status:
                                                    event.target.value
                                            })
                                        )
                                }
                            />

                        </Col>


                        <Col md={3}>

                            <Form.Label>
                                From Date
                            </Form.Label>

                            <Form.Control
                                type="date"
                                value={
                                    reportFilters.from_date
                                }
                                onChange={
                                    event =>
                                        setReportFilters(
                                            old => ({
                                                ...old,
                                                from_date:
                                                    event.target.value
                                            })
                                        )
                                }
                            />

                        </Col>


                        <Col md={3}>

                            <Form.Label>
                                To Date
                            </Form.Label>

                            <Form.Control
                                type="date"
                                value={
                                    reportFilters.to_date
                                }
                                onChange={
                                    event =>
                                        setReportFilters(
                                            old => ({
                                                ...old,
                                                to_date:
                                                    event.target.value
                                            })
                                        )
                                }
                            />

                        </Col>


                        <Col
                            md={3}
                            className="d-flex align-items-end"
                        >

                            <Button
                                className="sr-primary-btn w-100"
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

                                <div className="text-center py-5">
                                    <Spinner animation="border" />
                                </div>
                            )

                            : (

                                <div className="table-responsive">

                                    <Table className="sr-table">

                                        <thead>

                                            <tr>

                                                <th>EVENT TIME</th>
                                                <th>RULE</th>
                                                <th>PLANT</th>
                                                <th>LINE</th>
                                                <th>MACHINE</th>
                                                <th>SHIFT</th>
                                                <th>EVENT TYPE</th>
                                                <th>SEQUENCE</th>
                                                <th>START</th>
                                                <th>END</th>
                                                <th>SCORE</th>
                                                <th>RESULT</th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {
                                                reportRows.length ===
                                                0
                                                    ? (

                                                        <tr>

                                                            <td
                                                                colSpan={12}
                                                                className="sr-empty"
                                                            >
                                                                No report data found.
                                                            </td>

                                                        </tr>
                                                    )

                                                    : reportRows.map(
                                                        row => (

                                                            <tr
                                                                key={
                                                                    row.schedule_event_id
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
                                                                        ruleName(
                                                                            row.schedule_rule_id
                                                                        )
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {
                                                                        plantName(
                                                                            row.plant_id
                                                                        )
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {
                                                                        lineName(
                                                                            row.line_id
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
                                                                        row.shift_id
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {
                                                                        row.event_type
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
                                                                        row.scheduled_start
                                                                            ? new Date(
                                                                                row.scheduled_start
                                                                            )
                                                                                .toLocaleString()
                                                                            : "-"
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {
                                                                        row.scheduled_end
                                                                            ? new Date(
                                                                                row.scheduled_end
                                                                            )
                                                                                .toLocaleString()
                                                                            : "-"
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {
                                                                        row.score_value ??
                                                                        "-"
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {
                                                                        row.result_status
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


export default SchedulingRules;