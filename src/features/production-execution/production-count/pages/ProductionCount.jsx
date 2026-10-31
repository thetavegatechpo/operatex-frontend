import ExecutionReport from '../../../../shared/operations/ExecutionReport.jsx';
import ReportLens from '../../../../shared/operations/ReportLens.jsx';
import ProductionPulse from '../../../../shared/design/ProductionPulse.jsx';


import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/ProductionCount/ProductionCount.jsx

import React, {
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
    Modal,
    Row,
    Spinner} from "react-bootstrap";

import {
    ArrowClockwise,
    BarChartLine,
    BoxSeam,
    CheckCircleFill,
    ClipboardData,
    PencilSquare,
    PlayFill,
    Plus,
    Search,
    Speedometer2
} from "react-bootstrap-icons";

import {
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";

import productionCountService, {
    PRODUCTION_COUNT_MODES,
    PRODUCTION_COUNT_SCOPES,
    createProductionCountConfig,
    executeProductionCount,
    exportProductionCountReport,
    getProductionCountMaster,
    getProductionCountReport,
    getProductionCountRuntime,
    softDeleteProductionCountConfig,
    updateProductionCountConfig
} from "../api/productionCount.service.js";


// ============================================================
// PAGE VIEW CONSTANTS
// ============================================================

const VIEW_CONFIG =
    "CONFIG";


const VIEW_RUNTIME =
    "RUNTIME";


const VIEW_REPORT =
    "REPORT";


// ============================================================
// INITIAL CONFIG FORM
// ============================================================

const configInitialState = {

    production_count_config_id: "",

    company_id: "",

    plant_id: "",

    line_id: "",

    machine_id: "",

    process_id: "",

    count_signal_id: "",

    result_signal_id: "",

    count_mode:
        PRODUCTION_COUNT_MODES.SIGNAL_EDGE,

    increment_qty: 1,

    count_scope:
        PRODUCTION_COUNT_SCOPES.PROCESS,

    is_active: true,

    version_no: 1,

    effective_from: "",

    effective_to: ""
};


// ============================================================
// INITIAL EXECUTE FORM
// ============================================================

const executeInitialState = {

    production_count_config_id: "",

    production_plan_id: "",

    plan_entry_id: "",

    unit_id: "",

    result_status: "OK",

    event_type: "COUNT",

    cycle_time_ms: "",

    event_ts: "",

    source_system: "MES_UI",

    correlation_id: "",

    idempotency_key: ""
};


// ============================================================
// INITIAL RUNTIME FILTERS
// ============================================================

const runtimeFilterInitialState = {

    company_id: "",

    plant_id: "",

    line_id: "",

    machine_id: "",

    shift_id: "",

    plan_id: "",

    plan_entry_id: "",

    part_id: "",

    process_id: "",

    unit_id: "",

    event_type: "",

    count_scope: "",

    result_status: "",

    source_system: "",

    correlation_id: "",

    idempotency_key: "",

    from_timestamp: "",

    to_timestamp: ""
};


// ============================================================
// BASIC HELPERS
// ============================================================

const sameId =
    (
        left,
        right
    ) =>
        String(
            left ?? ""
        ) ===
        String(
            right ?? ""
        );


const hasValue =
    value =>
        value !== undefined &&
        value !== null &&
        value !== "";


const safeText =
    value => {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            return "-";
        }


        return String(value);
    };


const boolValue =
    value => {

        return (
            value === true ||
            value === 1 ||
            value === "1" ||
            String(value)
                .toLowerCase() ===
                "true"
        );
    };


const displayDateTime =
    value => {

        if (!value) {
            return "-";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);
        }


        return date
            .toLocaleString();
    };


const toLocalDateTime =
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


        const offset =
            date.getTimezoneOffset() *
            60000;


        return new Date(
            date.getTime() -
            offset
        )
            .toISOString()
            .slice(
                0,
                16
            );
    };


const toApiTimestamp =
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


        return date
            .toISOString();
    };


// ============================================================
// ERROR HELPER
// ============================================================

const getErrorMessage =
    (
        error,
        fallback =
            "Something went wrong."
    ) => {

        const response =
            error?.response?.data;


        if (
            Array.isArray(
                response?.errors
            ) &&
            response.errors.length >
                0
        ) {

            return `${
                response.message ||
                "Validation failed."
            } ${response.errors.join(
                ", "
            )}`;
        }


        return (
            response?.message ||
            error?.message ||
            fallback
        );
    };


// ============================================================
// RESPONSE EXTRACTION
// ============================================================

const extractRows =
    (
        response,
        possibleKeys = []
    ) => {

        if (!response) {
            return [];
        }


        if (
            Array.isArray(
                response
            )
        ) {
            return response;
        }


        if (
            Array.isArray(
                response?.data
            )
        ) {
            return response.data;
        }


        if (
            Array.isArray(
                response?.data?.data
            )
        ) {
            return response
                .data
                .data;
        }


        for (
            const key of possibleKeys
        ) {

            if (
                Array.isArray(
                    response?.[key]
                )
            ) {

                return response[
                    key
                ];
            }


            if (
                Array.isArray(
                    response?.data?.[key]
                )
            ) {

                return response
                    .data[key];
            }


            if (
                Array.isArray(
                    response
                        ?.data
                        ?.data?.[
                            key
                        ]
                )
            ) {

                return response
                    .data
                    .data[key];
            }
        }


        return [];
    };


const findRowsRecursive =
    (
        value,
        predicate
    ) => {

        if (!value) {
            return [];
        }


        if (
            Array.isArray(value)
        ) {

            const matching =
                value.filter(
                    item =>
                        item &&
                        typeof item ===
                            "object" &&
                        predicate(item)
                );


            if (
                matching.length >
                0
            ) {

                return matching;
            }


            for (
                const item of value
            ) {

                const nested =
                    findRowsRecursive(
                        item,
                        predicate
                    );


                if (
                    nested.length >
                    0
                ) {

                    return nested;
                }
            }


            return [];
        }


        if (
            typeof value ===
            "object"
        ) {

            for (
                const nestedValue of
                Object.values(
                    value
                )
            ) {

                const nested =
                    findRowsRecursive(
                        nestedValue,
                        predicate
                    );


                if (
                    nested.length >
                    0
                ) {

                    return nested;
                }
            }
        }


        return [];
    };


// ============================================================
// LOOKUP ID / LABEL HELPERS
// ============================================================

const companyId =
    item =>
        item?.company_id ??
        item?.companyId ??
        "";


const companyLabel =
    item =>
        item?.company_name ??
        item?.companyName ??
        item?.company_code ??
        item?.companyCode ??
        companyId(item);


const plantId =
    item =>
        item?.plant_id ??
        item?.plantId ??
        item?.shop_id ??
        "";


const plantLabel =
    item =>
        item?.plant_name ??
        item?.plantName ??
        item?.shop_name ??
        item?.plant_code ??
        plantId(item);


const lineId =
    item =>
        item?.line_id ??
        item?.lineId ??
        "";


const lineLabel =
    item =>
        item?.line_name ??
        item?.lineName ??
        item?.line_code ??
        item?.lineCode ??
        lineId(item);


const machineId =
    item =>
        item?.machine_id ??
        item?.machineId ??
        "";


const machineLabel =
    item =>
        item?.machine_name ??
        item?.machineName ??
        item?.machine_code ??
        item?.machineCode ??
        item?.asset_name ??
        machineId(item);


const processId =
    item =>
        item?.process_id ??
        item?.processId ??
        "";


const processLabel =
    item =>
        item?.process_name ??
        item?.processName ??
        item?.process_code ??
        item?.processCode ??
        processId(item);


const signalId =
    item =>
        item?.signal_mapping_id ??
        item?.signalMappingId ??
        "";


const signalLabel =
    item => {

        const code =
            item?.signal_code ??
            item?.signalCode ??
            item?.tag_code ??
            item?.tagCode ??
            "";


        const name =
            item?.signal_name ??
            item?.signalName ??
            item?.tag_name ??
            item?.tagName ??
            "";


        if (
            code &&
            name
        ) {

            return `${code} - ${name}`;
        }


        return (
            code ||
            name ||
            signalId(item)
        );
    };


const productionPlanId =
    item =>
        item?.plan_id ??
        item?.planId ??
        "";


const productionPlanLabel =
    item =>
        item?.plan_no ??
        item?.planNo ??
        item?.plan_code ??
        item?.planCode ??
        item?.production_plan_no ??
        item?.plan_name ??
        productionPlanId(item);


const planEntryId =
    item =>
        item?.plan_entry_id ??
        item?.planEntryId ??
        "";


const planEntryLabel =
    item => {

        const pieces =
            [];


        if (
            hasValue(
                item?.sequence_no
            )
        ) {

            pieces.push(
                `Seq ${item.sequence_no}`
            );
        }


        const machine =
            item?.machine_name ??
            item?.machine_code ??
            "";


        const process =
            item?.process_name ??
            item?.process_code ??
            "";


        const part =
            item?.part_name ??
            item?.part_code ??
            "";


        const quantity =
            item?.target_qty ??
            item?.planned_qty ??
            "";


        if (machine) {
            pieces.push(
                machine
            );
        }


        if (process) {
            pieces.push(
                process
            );
        }


        if (part) {
            pieces.push(
                part
            );
        }


        if (
            quantity !== ""
        ) {

            pieces.push(
                `Qty ${quantity}`
            );
        }


        return pieces.length
            ? pieces.join(
                " - "
            )
            : planEntryId(
                item
            );
    };


// ============================================================
// BADGE HELPERS
// ============================================================

const ActiveBadge =
    ({
        active
    }) => (

        <Badge
            bg={
                boolValue(active)
                    ? "success"
                    : "secondary"
            }
        >
            {
                boolValue(active)
                    ? "Active"
                    : "Inactive"
            }
        </Badge>
    );


const ScopeBadge =
    ({
        scope
    }) => {

        const normalized =
            String(
                scope || ""
            )
                .toUpperCase();


        return (

            <Badge
                bg={
                    normalized ===
                    "FINAL_OUTPUT"
                        ? "success"
                        : "primary"
                }
            >
                {
                    normalized ||
                    "-"
                }
            </Badge>
        );
    };


const ResultBadge =
    ({
        status
    }) => {

        const normalized =
            String(
                status || ""
            )
                .toUpperCase();


        let variant =
            "secondary";


        if (
            [
                "OK",
                "PASS",
                "SUCCESS",
                "COMPLETED"
            ].includes(
                normalized
            )
        ) {

            variant =
                "success";
        }


        if (
            [
                "NOK",
                "FAIL",
                "FAILED",
                "ERROR"
            ].includes(
                normalized
            )
        ) {

            variant =
                "danger";
        }


        return (

            <Badge bg={variant}>
                {
                    normalized ||
                    "-"
                }
            </Badge>
        );
    };


// ============================================================
// CSV EXPORT HELPER
// ============================================================

const downloadCsv =
    (
        rows,
        filename
    ) => {

        if (
            !Array.isArray(rows) ||
            rows.length === 0
        ) {

            throw new Error(
                "No export data found."
            );
        }


        const headers =
            Object.keys(
                rows[0]
            );


        const escapeValue =
            value => {

                if (
                    value === null ||
                    value === undefined
                ) {

                    return "";
                }


                const text =
                    typeof value ===
                    "object"
                        ? JSON.stringify(
                            value
                        )
                        : String(value);


                return `"${text.replace(
                    /"/g,
                    '""'
                )}"`;
            };


        const lines = [

            headers
                .map(
                    escapeValue
                )
                .join(","),

            ...rows.map(
                row =>
                    headers
                        .map(
                            header =>
                                escapeValue(
                                    row[
                                        header
                                    ]
                                )
                        )
                        .join(",")
            )
        ];


        const blob =
            new Blob(
                [
                    lines.join(
                        "\n"
                    )
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const anchor =
            document.createElement(
                "a"
            );


        anchor.href =
            url;


        anchor.download =
            filename;


        document.body
            .appendChild(
                anchor
            );


        anchor.click();


        document.body
            .removeChild(
                anchor
            );


        URL.revokeObjectURL(
            url
        );
    };


// ============================================================
// PAGE
// ============================================================

const ProductionCount =
    () => {

        const queryClient =
            useQueryClient();


        // ====================================================
        // PAGE STATE
        // ====================================================

        const [
            activeView,
            setActiveView
        ] =
            useState(
                VIEW_CONFIG
            );


        const [
            searchText,
            setSearchText
        ] =
            useState("");


        const [
            message,
            setMessage
        ] =
            useState("");


        const [
            errorMessage,
            setErrorMessage
        ] =
            useState("");


        // ====================================================
        // MODALS
        // ====================================================

        const [
            showConfigModal,
            setShowConfigModal
        ] =
            useState(false);


        const [
            showExecuteModal,
            setShowExecuteModal
        ] =
            useState(false);


        // ====================================================
        // FORMS
        // ====================================================

        const [
            configForm,
            setConfigForm
        ] =
            useState(
                configInitialState
            );


        const [
            executeForm,
            setExecuteForm
        ] =
            useState(
                executeInitialState
            );


        const [
            runtimeFilters,
            setRuntimeFilters
        ] =
            useState(
                runtimeFilterInitialState
            );


        const [
            appliedRuntimeFilters,
            setAppliedRuntimeFilters
        ] =
            useState(
                runtimeFilterInitialState
            );


        // ====================================================
        // COMPANY
        // ====================================================

        const companiesQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "companies"
                ],

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/company-master/master"
                            );


                        return extractRows(
                            response,
                            [
                                "company_master",
                                "companies",
                                "master"
                            ]
                        );
                    }
            });


        // ====================================================
        // PLANT
        // ====================================================

        const plantsQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "plants"
                ],

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/plant-shop-master/master"
                            );


                        return extractRows(
                            response,
                            [
                                "plant_master",
                                "plant_shop_master",
                                "plants",
                                "shops",
                                "master"
                            ]
                        );
                    }
            });


        // ====================================================
        // LINE
        // ====================================================

        const linesQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "lines"
                ],

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/line-master/master"
                            );


                        return extractRows(
                            response,
                            [
                                "line_master",
                                "lines",
                                "master"
                            ]
                        );
                    }
            });


        // ====================================================
        // MACHINE
        // ====================================================

        const machinesQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "machines"
                ],

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/machine-master/master"
                            );


                        return extractRows(
                            response,
                            [
                                "machine_master",
                                "machines",
                                "master"
                            ]
                        );
                    }
            });


        // ====================================================
        // PROCESS MASTER
        // ====================================================

        const processesQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "processes"
                ],

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/process-master/master"
                            );


                        let rows =
                            extractRows(
                                response,
                                [
                                    "process_master",
                                    "processes",
                                    "master"
                                ]
                            );


                        if (
                            !rows.length
                        ) {

                            rows =
                                findRowsRecursive(
                                    response?.data,
                                    item =>
                                        Boolean(
                                            processId(
                                                item
                                            )
                                        )
                                );
                        }


                        const unique =
                            new Map();


                        rows.forEach(
                            row => {

                                const id =
                                    processId(
                                        row
                                    );


                                if (id) {

                                    unique.set(
                                        String(
                                            id
                                        ),
                                        row
                                    );
                                }
                            }
                        );


                        return Array.from(
                            unique.values()
                        );
                    }
            });


        // ====================================================
        // SIGNAL MAPPING
        // ====================================================

        const signalsQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "signals"
                ],

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/signal-mapping/master"
                            );


                        let rows =
                            extractRows(
                                response,
                                [
                                    "machine_signal_mapping",
                                    "signal_mapping",
                                    "signal_mappings",
                                    "master"
                                ]
                            );


                        if (
                            !rows.length
                        ) {

                            rows =
                                findRowsRecursive(
                                    response?.data,
                                    item =>
                                        Boolean(
                                            signalId(
                                                item
                                            )
                                        )
                                );
                        }


                        const unique =
                            new Map();


                        rows.forEach(
                            row => {

                                const id =
                                    signalId(
                                        row
                                    );


                                if (id) {

                                    unique.set(
                                        String(id),
                                        row
                                    );
                                }
                            }
                        );


                        return Array.from(
                            unique.values()
                        );
                    }
            });


        // ====================================================
        // PRODUCTION PLAN
        // ====================================================

        const productionPlansQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "production-plans"
                ],

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/production-plan/master"
                            );


                        return extractRows(
                            response,
                            [
                                "production_plan",
                                "production_plans",
                                "plans",
                                "master"
                            ]
                        );
                    }
            });


        // ====================================================
        // PRODUCTION COUNT CONFIG
        //
        // Use /master here so inactive records are also visible.
        // ====================================================

        const configQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "master"
                ],

                queryFn:
                    () =>
                        getProductionCountMaster()
            });


        const configRows =
            productionCountService
                .getConfigRows(
                    configQuery.data
                );


        // ====================================================
        // LOOKUP DATA
        // ====================================================

        const companies =
            companiesQuery.data ||
            [];


        const plants =
            plantsQuery.data ||
            [];


        const lines =
            linesQuery.data ||
            [];


        const machines =
            machinesQuery.data ||
            [];


        const processes =
            processesQuery.data ||
            [];


        const signals =
            signalsQuery.data ||
            [];


        const productionPlans =
            productionPlansQuery.data ||
            [];


        // ====================================================
        // DEFAULT COMPANY
        // ====================================================

        const defaultCompany =
            companies.length ===
            1
                ? companyId(
                    companies[0]
                )
                : "";


        // ====================================================
        // LOOKUP MAPS
        // ====================================================

        const machineMap =
            useMemo(
                () =>
                    new Map(
                        machines.map(
                            item => [
                                String(
                                    machineId(
                                        item
                                    )
                                ),
                                item
                            ]
                        )
                    ),
                [
                    machines
                ]
            );


        const processMap =
            useMemo(
                () =>
                    new Map(
                        processes.map(
                            item => [
                                String(
                                    processId(
                                        item
                                    )
                                ),
                                item
                            ]
                        )
                    ),
                [
                    processes
                ]
            );


        const signalMap =
            useMemo(
                () =>
                    new Map(
                        signals.map(
                            item => [
                                String(
                                    signalId(
                                        item
                                    )
                                ),
                                item
                            ]
                        )
                    ),
                [
                    signals
                ]
            );


        // ====================================================
        // CONFIG DEPENDENT LOOKUPS
        // ====================================================

        const configPlants =
            useMemo(
                () =>
                    plants.filter(
                        item => {

                            const rowCompany =
                                companyId(
                                    item
                                );


                            return (
                                !configForm.company_id ||
                                !rowCompany ||
                                sameId(
                                    rowCompany,
                                    configForm.company_id
                                )
                            );
                        }
                    ),
                [
                    plants,
                    configForm.company_id
                ]
            );


        const configLines =
            useMemo(
                () =>
                    lines.filter(
                        item => {

                            const rowPlant =
                                plantId(
                                    item
                                );


                            return (
                                !configForm.plant_id ||
                                !rowPlant ||
                                sameId(
                                    rowPlant,
                                    configForm.plant_id
                                )
                            );
                        }
                    ),
                [
                    lines,
                    configForm.plant_id
                ]
            );


        const configMachines =
            useMemo(
                () =>
                    machines.filter(
                        item => {

                            const rowLine =
                                lineId(
                                    item
                                );


                            return (
                                !configForm.line_id ||
                                !rowLine ||
                                sameId(
                                    rowLine,
                                    configForm.line_id
                                )
                            );
                        }
                    ),
                [
                    machines,
                    configForm.line_id
                ]
            );


        const configProcesses =
            useMemo(
                () =>
                    processes.filter(
                        item => {

                            const rowCompany =
                                companyId(
                                    item
                                );


                            return (
                                !configForm.company_id ||
                                !rowCompany ||
                                sameId(
                                    rowCompany,
                                    configForm.company_id
                                )
                            );
                        }
                    ),
                [
                    processes,
                    configForm.company_id
                ]
            );


        const configSignals =
            useMemo(
                () =>
                    signals.filter(
                        item => {

                            if (
                                hasValue(
                                    item?.is_active
                                ) &&
                                !boolValue(
                                    item.is_active
                                )
                            ) {

                                return false;
                            }


                            const rowCompany =
                                companyId(
                                    item
                                );


                            if (
                                configForm.company_id &&
                                rowCompany &&
                                !sameId(
                                    rowCompany,
                                    configForm.company_id
                                )
                            ) {

                                return false;
                            }


                            const rowPlant =
                                plantId(
                                    item
                                );


                            if (
                                configForm.plant_id &&
                                rowPlant &&
                                !sameId(
                                    rowPlant,
                                    configForm.plant_id
                                )
                            ) {

                                return false;
                            }


                            const rowLine =
                                lineId(
                                    item
                                );


                            if (
                                configForm.line_id &&
                                rowLine &&
                                !sameId(
                                    rowLine,
                                    configForm.line_id
                                )
                            ) {

                                return false;
                            }


                            const rowMachine =
                                machineId(
                                    item
                                );


                            if (
                                configForm.machine_id &&
                                rowMachine &&
                                !sameId(
                                    rowMachine,
                                    configForm.machine_id
                                )
                            ) {

                                return false;
                            }


                            return true;
                        }
                    ),
                [
                    signals,
                    configForm.company_id,
                    configForm.plant_id,
                    configForm.line_id,
                    configForm.machine_id
                ]
            );


        // ====================================================
        // SELECTED EXECUTION CONFIG
        // ====================================================

        const selectedExecuteConfig =
            useMemo(
                () =>
                    configRows.find(
                        row =>
                            sameId(
                                row.production_count_config_id,
                                executeForm.production_count_config_id
                            )
                    ) ||
                    null,
                [
                    configRows,
                    executeForm.production_count_config_id
                ]
            );


        // ====================================================
        // EXECUTION PLANS
        // ====================================================

        const executePlans =
            useMemo(
                () =>
                    productionPlans.filter(
                        item => {

                            if (
                                !selectedExecuteConfig
                            ) {

                                return true;
                            }


                            const rowCompany =
                                companyId(
                                    item
                                );


                            return (
                                !rowCompany ||
                                sameId(
                                    rowCompany,
                                    selectedExecuteConfig.company_id
                                )
                            );
                        }
                    ),
                [
                    productionPlans,
                    selectedExecuteConfig
                ]
            );


        // ====================================================
        // PLAN ENTRY QUERY
        //
        // Confirmed Planning source:
        //
        // /production-plan/config?plan_id=<uuid>
        // ====================================================

        const planEntriesQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "plan-entries",
                    executeForm.production_plan_id
                ],

                enabled:
                    Boolean(
                        executeForm.production_plan_id
                    ),

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/production-plan/config",
                                {
                                    params: {
                                        plan_id:
                                            executeForm.production_plan_id
                                    }
                                }
                            );


                        let rows =
                            extractRows(
                                response,
                                [
                                    "plan_entry",
                                    "plan_entries",
                                    "entries"
                                ]
                            );


                        if (
                            !rows.length
                        ) {

                            rows =
                                findRowsRecursive(
                                    response?.data,
                                    item =>
                                        Boolean(
                                            planEntryId(
                                                item
                                            )
                                        )
                                );
                        }


                        const unique =
                            new Map();


                        rows.forEach(
                            row => {

                                const id =
                                    planEntryId(
                                        row
                                    );


                                if (id) {

                                    unique.set(
                                        String(id),
                                        row
                                    );
                                }
                            }
                        );


                        return Array.from(
                            unique.values()
                        );
                    }
            });


        const allPlanEntries =
            planEntriesQuery.data ||
            [];


        // ====================================================
        // FILTER PLAN ENTRIES BY CONFIG
        //
        // Config machine must match Plan Entry.
        //
        // If config has process_id, process must also match.
        // ====================================================

        const executablePlanEntries =
            useMemo(
                () => {

                    if (
                        !selectedExecuteConfig
                    ) {

                        return allPlanEntries;
                    }


                    return allPlanEntries.filter(
                        entry => {

                            if (
                                !sameId(
                                    entry.machine_id,
                                    selectedExecuteConfig.machine_id
                                )
                            ) {

                                return false;
                            }


                            if (
                                selectedExecuteConfig.process_id &&
                                !sameId(
                                    entry.process_id,
                                    selectedExecuteConfig.process_id
                                )
                            ) {

                                return false;
                            }


                            return true;
                        }
                    );
                },
                [
                    allPlanEntries,
                    selectedExecuteConfig
                ]
            );


        // ====================================================
        // SELECTED PLAN ENTRY
        // ====================================================

        const selectedPlanEntry =
            useMemo(
                () =>
                    allPlanEntries.find(
                        row =>
                            sameId(
                                planEntryId(
                                    row
                                ),
                                executeForm.plan_entry_id
                            )
                    ) ||
                    null,
                [
                    allPlanEntries,
                    executeForm.plan_entry_id
                ]
            );


        // ====================================================
        // SEARCH CONFIG
        // ====================================================

        const searchedConfigs =
            useMemo(
                () => {

                    const search =
                        searchText
                            .trim()
                            .toLowerCase();


                    if (!search) {

                        return configRows;
                    }


                    return configRows.filter(
                        row => {

                            const machine =
                                machineMap.get(
                                    String(
                                        row.machine_id
                                    )
                                );


                            const process =
                                processMap.get(
                                    String(
                                        row.process_id
                                    )
                                );


                            const countSignal =
                                signalMap.get(
                                    String(
                                        row.count_signal_id
                                    )
                                );


                            return [
                                machine
                                    ? machineLabel(
                                        machine
                                    )
                                    : "",
                                process
                                    ? processLabel(
                                        process
                                    )
                                    : "",
                                countSignal
                                    ? signalLabel(
                                        countSignal
                                    )
                                    : "",
                                row.count_mode,
                                row.count_scope,
                                row.increment_qty,
                                row.version_no
                            ]
                                .join(" ")
                                .toLowerCase()
                                .includes(
                                    search
                                );
                        }
                    );
                },
                [
                    configRows,
                    machineMap,
                    processMap,
                    signalMap,
                    searchText
                ]
            );


        // ====================================================
        // SUMMARY COUNTS
        // ====================================================

        const activeConfigCount =
            configRows.filter(
                row =>
                    boolValue(
                        row.is_active
                    )
            ).length;


        const processConfigCount =
            configRows.filter(
                row =>
                    String(
                        row.count_scope ||
                        ""
                    )
                        .toUpperCase() ===
                    "PROCESS"
            ).length;


        const finalOutputConfigCount =
            configRows.filter(
                row =>
                    String(
                        row.count_scope ||
                        ""
                    )
                        .toUpperCase() ===
                    "FINAL_OUTPUT"
            ).length;


        // ====================================================
        // NORMALIZED FILTERS
        // ====================================================

        const runtimeApiFilters =
            useMemo(
                () => ({

                    ...appliedRuntimeFilters,

                    from_timestamp:
                        toApiTimestamp(
                            appliedRuntimeFilters.from_timestamp
                        ),

                    to_timestamp:
                        toApiTimestamp(
                            appliedRuntimeFilters.to_timestamp
                        )
                }),
                [
                    appliedRuntimeFilters
                ]
            );


        // ====================================================
        // RUNTIME QUERY
        // ====================================================

        const runtimeQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "runtime",
                    runtimeApiFilters
                ],

                queryFn:
                    () =>
                        getProductionCountRuntime(
                            runtimeApiFilters
                        ),

                refetchInterval: 10000,
                refetchIntervalInBackground: false,
                enabled:
                    activeView ===
                    VIEW_RUNTIME
            });


        const runtimeRows =
            productionCountService
                .getEventRows(
                    runtimeQuery.data
                );


        // ====================================================
        // REPORT QUERY
        // ====================================================

        const reportQuery =
            useQuery({

                queryKey: [
                    "production-count",
                    "report",
                    runtimeApiFilters
                ],

                queryFn:
                    () =>
                        getProductionCountReport(
                            runtimeApiFilters
                        ),

                enabled:
                    activeView ===
                    VIEW_REPORT
            });


        const reportRows =
            productionCountService
                .getEventRows(
                    reportQuery
                        .data
                        ?.data
                );


        const reportMeta =
            reportQuery
                .data
                ?.meta ||
            {};


        // ====================================================
        // REFRESH
        // ====================================================

        const refreshModule =
            async () => {

                await Promise.all([

                    queryClient.invalidateQueries({
                        queryKey: [
                            "production-count",
                            "master"
                        ]
                    }),

                    queryClient.invalidateQueries({
                        queryKey: [
                            "production-count",
                            "runtime"
                        ]
                    }),

                    queryClient.invalidateQueries({
                        queryKey: [
                            "production-count",
                            "report"
                        ]
                    })
                ]);
            };


        // ====================================================
        // CREATE / UPDATE MUTATION
        // ====================================================

        const configMutation =
            useMutation({

                mutationFn:
                    async payload => {

                        if (
                            payload.production_count_config_id
                        ) {

                            const {
                                production_count_config_id,
                                ...body
                            } =
                                payload;


                            return updateProductionCountConfig(
                                production_count_config_id,
                                body
                            );
                        }


                        return createProductionCountConfig(
                            payload
                        );
                    },


                onSuccess:
                    async () => {

                        setErrorMessage("");

                        setMessage(
                            configForm.production_count_config_id
                                ? "Production Count configuration updated successfully."
                                : "Production Count configuration created successfully."
                        );


                        setShowConfigModal(
                            false
                        );


                        setConfigForm(
                            configInitialState
                        );


                        await refreshModule();
                    },


                onError:
                    error => {

                        setMessage("");

                        setErrorMessage(
                            getErrorMessage(
                                error,
                                "Unable to save Production Count configuration."
                            )
                        );
                    }
            });


        // ====================================================
        // EXECUTION MUTATION
        // ====================================================

        const executeMutation =
            useMutation({

                mutationFn:
                    payload =>
                        executeProductionCount(
                            payload
                        ),


                onSuccess:
                    async result => {

                        setErrorMessage("");


                        setMessage(
                            result?.idempotent
                                ? "This Production Count event was already processed."
                                : "Production count recorded successfully."
                        );


                        setShowExecuteModal(
                            false
                        );


                        setExecuteForm(
                            executeInitialState
                        );


                        await refreshModule();


                        setActiveView(
                            VIEW_RUNTIME
                        );
                    },


                onError:
                    error => {

                        setMessage("");

                        setErrorMessage(
                            getErrorMessage(
                                error,
                                "Unable to record Production Count."
                            )
                        );
                    }
            });


        // ====================================================
        // OPEN CREATE CONFIG
        // ====================================================

        const openCreateConfig =
            () => {

                setConfigForm({

                    ...configInitialState,

                    company_id:
                        defaultCompany
                });


                setShowConfigModal(
                    true
                );
            };


        // ====================================================
        // OPEN EDIT CONFIG
        // ====================================================

        const openEditConfig =
            row => {

                setConfigForm({

                    production_count_config_id:
                        row.production_count_config_id,

                    company_id:
                        row.company_id ||
                        "",

                    plant_id:
                        row.plant_id ||
                        "",

                    line_id:
                        row.line_id ||
                        "",

                    machine_id:
                        row.machine_id ||
                        "",

                    process_id:
                        row.process_id ||
                        "",

                    count_signal_id:
                        row.count_signal_id ||
                        "",

                    result_signal_id:
                        row.result_signal_id ||
                        "",

                    count_mode:
                        row.count_mode ||
                        PRODUCTION_COUNT_MODES.SIGNAL_EDGE,

                    increment_qty:
                        row.increment_qty ??
                        1,

                    count_scope:
                        row.count_scope ||
                        PRODUCTION_COUNT_SCOPES.PROCESS,

                    is_active:
                        boolValue(
                            row.is_active
                        ),

                    version_no:
                        row.version_no ??
                        1,

                    effective_from:
                        toLocalDateTime(
                            row.effective_from
                        ),

                    effective_to:
                        toLocalDateTime(
                            row.effective_to
                        )
                });


                setShowConfigModal(
                    true
                );
            };


        // ====================================================
        // OPEN EXECUTE
        // ====================================================

        const openExecute =
            () => {

                const firstActiveConfig =
                    configRows.find(
                        row =>
                            boolValue(
                                row.is_active
                            )
                    );


                setExecuteForm({

                    ...executeInitialState,

                    production_count_config_id:
                        firstActiveConfig
                            ?.production_count_config_id ||
                        ""
                });


                setShowExecuteModal(
                    true
                );
            };


        // ====================================================
        // SUBMIT CONFIG
        // ====================================================

        const submitConfig =
            event => {

                event.preventDefault();


                const mode =
                    String(
                        configForm.count_mode ||
                        ""
                    )
                        .toUpperCase();


                if (
                    configForm.is_active &&
                    ![
                        "MANUAL",
                        "API"
                    ].includes(
                        mode
                    ) &&
                    !configForm.count_signal_id
                ) {

                    setMessage("");

                    setErrorMessage(
                        `Count Signal is required for ${mode || "the selected"} mode.`
                    );

                    return;
                }


                configMutation.mutate({

                    ...configForm,

                    process_id:
                        configForm.process_id ||
                        null,

                    count_signal_id:
                        configForm.count_signal_id ||
                        null,

                    result_signal_id:
                        configForm.result_signal_id ||
                        null,

                    count_mode:
                        String(
                            configForm.count_mode
                        )
                            .trim()
                            .toUpperCase(),

                    increment_qty:
                        Number(
                            configForm.increment_qty
                        ),

                    count_scope:
                        String(
                            configForm.count_scope
                        )
                            .trim()
                            .toUpperCase(),

                    version_no:
                        Number(
                            configForm.version_no
                        ),

                    is_active:
                        Boolean(
                            configForm.is_active
                        ),

                    effective_from:
                        configForm.effective_from
                            ? new Date(
                                configForm.effective_from
                            )
                                .toISOString()
                            : null,

                    effective_to:
                        configForm.effective_to
                            ? new Date(
                                configForm.effective_to
                            )
                                .toISOString()
                            : null
                });
            };


        // ====================================================
        // SOFT DELETE
        // ====================================================

        const deactivateConfig =
            async row => {

                if (
                    !window.confirm(
                        "Deactivate this Production Count configuration?"
                    )
                ) {

                    return;
                }


                try {

                    setMessage("");

                    setErrorMessage("");


                    await softDeleteProductionCountConfig(
                        row.production_count_config_id
                    );


                    setMessage(
                        "Production Count configuration deactivated successfully."
                    );


                    await refreshModule();
                }
                catch (error) {

                    setErrorMessage(
                        getErrorMessage(
                            error,
                            "Unable to deactivate Production Count configuration."
                        )
                    );
                }
            };


        // ====================================================
        // SUBMIT EXECUTE
        // ====================================================

        const submitExecute =
            event => {

                event.preventDefault();


                if (
                    !selectedExecuteConfig
                ) {

                    setMessage("");

                    setErrorMessage(
                        "Production Count configuration is required."
                    );

                    return;
                }


                if (
                    !selectedPlanEntry
                ) {

                    setMessage("");

                    setErrorMessage(
                        "Plan Entry is required."
                    );

                    return;
                }


                const idempotencyKey =
                    executeForm.idempotency_key
                        .trim() ||
                    `PC-${selectedPlanEntry.plan_entry_id}-${Date.now()}`;


                executeMutation.mutate({

                    production_count_config_id:
                        selectedExecuteConfig
                            .production_count_config_id,

                    company_id:
                        selectedExecuteConfig
                            .company_id,

                    plant_id:
                        selectedExecuteConfig
                            .plant_id,

                    line_id:
                        selectedExecuteConfig
                            .line_id,

                    machine_id:
                        selectedPlanEntry
                            .machine_id,

                    shift_id:
                        Number(
                            selectedPlanEntry
                                .shift_id
                        ),

                    plan_id:
                        selectedPlanEntry
                            .plan_id ||
                        executeForm
                            .production_plan_id,

                    plan_entry_id:
                        selectedPlanEntry
                            .plan_entry_id,

                    part_id:
                        selectedPlanEntry
                            .part_id,

                    process_id:
                        selectedPlanEntry
                            .process_id,

                    unit_id:
                        executeForm.unit_id ||
                        null,

                    event_type:
                        executeForm.event_type ||
                        "COUNT",

                    result_status:
                        executeForm.result_status,

                    cycle_time_ms:
                        executeForm.cycle_time_ms ===
                        ""
                            ? null
                            : Number(
                                executeForm.cycle_time_ms
                            ),

                    event_ts:
                        executeForm.event_ts
                            ? new Date(
                                executeForm.event_ts
                            )
                                .toISOString()
                            : null,

                    source_system:
                        executeForm.source_system ||
                        "MES_UI",

                    correlation_id:
                        executeForm.correlation_id ||
                        null,

                    idempotency_key:
                        idempotencyKey
                });
            };


        // ====================================================
        // EXPORT
        // ====================================================

        const handleExport =
            async () => {

                try {

                    setMessage("");

                    setErrorMessage("");


                    const result =
                        await exportProductionCountReport(
                            runtimeApiFilters
                        );


                    const rows =
                        productionCountService
                            .getEventRows(
                                result.data
                            );


                    downloadCsv(
                        rows,
                        `production-count-${Date.now()}.csv`
                    );


                    setMessage(
                        "Production Count report exported successfully."
                    );
                }
                catch (error) {

                    setErrorMessage(
                        getErrorMessage(
                            error,
                            "Unable to export Production Count report."
                        )
                    );
                }
            };


        // ====================================================
        // REFRESH HANDLER
        // ====================================================

        const handleRefresh =
            async () => {

                try {

                    setMessage("");

                    setErrorMessage("");


                    await Promise.all([

                        configQuery.refetch(),

                        companiesQuery.refetch(),

                        plantsQuery.refetch(),

                        linesQuery.refetch(),

                        machinesQuery.refetch(),

                        processesQuery.refetch(),

                        signalsQuery.refetch(),

                        productionPlansQuery.refetch(),

                        activeView ===
                        VIEW_RUNTIME
                            ? runtimeQuery.refetch()
                            : Promise.resolve(),

                        activeView ===
                        VIEW_REPORT
                            ? reportQuery.refetch()
                            : Promise.resolve()
                    ]);


                    setMessage(
                        "Production Count data refreshed successfully."
                    );
                }
                catch (error) {

                    setErrorMessage(
                        getErrorMessage(
                            error,
                            "Unable to refresh Production Count data."
                        )
                    );
                }
            };


        // ====================================================
        // MASTER LOADING
        // ====================================================

        const lookupLoading =
            companiesQuery.isLoading ||
            plantsQuery.isLoading ||
            linesQuery.isLoading ||
            machinesQuery.isLoading ||
            processesQuery.isLoading ||
            signalsQuery.isLoading;


        // ====================================================
        // RENDER
        // ====================================================

        return (

            <>


<div className="pc-page">

                {/* =================================================
                    LOCAL PAGE STYLE
                ================================================== */}

                <style>{`

                    .pc-page {
                        padding: 22px;
                        background: #f4f6fb;
                        min-height: 100vh;
                    }

                    .pc-card {
                        background: #ffffff;
                        border: 1px solid #e5e9f2;
                        border-radius: 12px;
                        box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
                    }

                    .pc-title {
                        margin: 0;
                        font-size: 22px;
                        font-weight: 700;
                        color: #1f2d3d;
                    }

                    .pc-subtitle {
                        margin-top: 4px;
                        color: #748094;
                        font-size: 13px;
                    }

                    .pc-btn-primary {
                        background: #314965 !important;
                        border-color: #314965 !important;
                        color: #ffffff !important;
                        font-weight: 600;
                    }

                    .pc-btn-primary:hover {
                        background: #25364e !important;
                        border-color: #25364e !important;
                    }

                    .pc-btn-outline {
                        background: #ffffff !important;
                        color: #314965 !important;
                        border: 1px solid #314965 !important;
                        font-weight: 600;
                    }

                    .pc-btn-outline:hover {
                        background: #314965 !important;
                        color: #ffffff !important;
                    }

                    .pc-tabs {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    }

                    .pc-tab {
                        border: 1px solid #d9dce5;
                        background: #ffffff;
                        color: #566176;
                        font-weight: 600;
                        padding: 8px 15px;
                        border-radius: 7px;
                        transition: 0.2s ease;
                    }

                    .pc-tab:hover {
                        border-color: #314965;
                        color: #314965;
                    }

                    .pc-tab.active {
                        border-color: #314965;
                        background: #f1f4f8;
                        color: #314965;
                    }

                    .pc-stat {
                        border: 1px solid #e5e9f2;
                        border-radius: 10px;
                        padding: 14px;
                        background: #ffffff;
                        height: 100%;
                    }

                    .pc-stat-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 9px;
                        background: #f1f4f8;
                        color: #314965;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                    }

                    .pc-stat-value {
                        font-size: 20px;
                        font-weight: 700;
                        color: #263449;
                    }

                    .pc-stat-label {
                        color: #758195;
                        font-size: 12px;
                    }

                    .pc-toolbar {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                        flex-wrap: wrap;
                    }

                    .pc-search {
                        position: relative;
                        width: 340px;
                        max-width: 100%;
                    }

                    .pc-search svg {
                        position: absolute;
                        left: 11px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #8792a5;
                    }

                    .pc-search input {
                        padding-left: 34px;
                    }

                    .pc-table-wrap {
                        border: 1px solid #e4e7ee;
                        border-radius: 9px;
                        overflow: auto;
                    }

                    .pc-table {
                        margin: 0;
                        white-space: nowrap;
                    }

                    .pc-table thead th {
                        background: #1c2d45;
                        color: #ffffff;
                        border-color: #1c2d45;
                        font-size: 12px;
                        font-weight: 700;
                        padding: 12px;
                    }

                    .pc-table tbody td {
                        vertical-align: middle;
                        padding: 11px 12px;
                        color: #364152;
                        font-size: 13px;
                    }

                    .pc-empty {
                        text-align: center;
                        color: #8a94a6 !important;
                        padding: 30px !important;
                    }

                    .pc-edit {
                        background: #ffffff !important;
                        border: 1px solid #314965 !important;
                        color: #314965 !important;
                        font-size: 12px;
                        font-weight: 600;
                        padding: 5px 10px;
                    }

                    .pc-edit:hover {
                        background: #314965 !important;
                        color: #ffffff !important;
                    }

                    .pc-delete {
                        background: #ffffff !important;
                        border: 1px solid #dc3545 !important;
                        color: #dc3545 !important;
                        font-size: 12px;
                        font-weight: 600;
                        padding: 5px 10px;
                    }

                    .pc-delete:hover {
                        background: #dc3545 !important;
                        color: #ffffff !important;
                    }

                    .pc-modal .modal-content {
                        border: none;
                        border-radius: 12px;
                        overflow: hidden;
                    }

                    .pc-modal .modal-header {
                        background: #1c2d45;
                        color: #ffffff;
                        border: none;
                    }

                    .pc-modal .btn-close {
                        filter: invert(1);
                    }

                    .pc-label {
                        color: #354154;
                        font-size: 12px;
                        font-weight: 700;
                        margin-bottom: 5px;
                    }

                    .pc-required {
                        color: #dc3545;
                    }

                    .pc-filter {
                        padding: 15px;
                        border: 1px solid #e5e9f2;
                        border-radius: 9px;
                        background: #f9fafc;
                        margin-bottom: 15px;
                    }

                    .pc-context {
                        border: 1px solid #f1cebc;
                        background: #f6f8fa;
                        color: #865038;
                        border-radius: 9px;
                        padding: 12px 14px;
                        font-size: 13px;
                    }

                    .pc-context-value {
                        color: #222f3e;
                        font-weight: 600;
                    }

                    @media (max-width: 768px) {

                        .pc-page {
                            padding: 12px;
                        }

                        .pc-search {
                            width: 100%;
                        }

                        .pc-toolbar {
                            align-items: stretch;
                        }
                    }

                `}</style>


                {/* =================================================
                    HEADER
                ================================================== */}

                <Card className="pc-card mb-3">

                    <Card.Body>

                        <Row
                            className="align-items-center g-3"
                        >

                            <Col lg={7}>

                                <h4 className="pc-title">
                                    Production Count
                                </h4>

                                <div className="pc-subtitle">
                                    Configure production counting,
                                    record actual output and separate
                                    process throughput from finished
                                    line output.
                                </div>

                            </Col>


                            <Col lg={5}>

                                <div className="d-flex justify-content-lg-end gap-2 flex-wrap">

                                    <Button
                                        className="pc-btn-outline"
                                        onClick={
                                            handleRefresh
                                        }
                                    >
                                        <ArrowClockwise className="me-1" />

                                        Refresh
                                    </Button>


                                    <Button
                                        className="pc-btn-outline"
                                        onClick={() =>
                                            setActiveView(
                                                VIEW_RUNTIME
                                            )
                                        }
                                    >
                                        <BarChartLine className="me-1" />

                                        Runtime
                                    </Button>


                                    <Button
                                        className="pc-btn-primary"
                                        onClick={
                                            openExecute
                                        }
                                    >
                                        <PlayFill className="me-1" />

                                        Record Count
                                    </Button>

                                </div>

                            </Col>

                        </Row>

                    </Card.Body>

                </Card>


                {/* =================================================
                    ALERTS
                ================================================== */}

                {
                    message && (

                        <Alert
                            variant="success"
                            dismissible
                            onClose={() =>
                                setMessage("")
                            }
                        >
                            {message}
                        </Alert>
                    )
                }


                {
                    errorMessage && (

                        <Alert
                            variant="danger"
                            dismissible
                            onClose={() =>
                                setErrorMessage("")
                            }
                        >
                            {errorMessage}
                        </Alert>
                    )
                }


                {/* =================================================
                    CONFIG SUMMARY
                ================================================== */}

                <Row className="g-3 mb-3">

                    <Col md={3}>

                        <div className="pc-stat">

                            <div className="d-flex align-items-center gap-3">

                                <div className="pc-stat-icon">
                                    <ClipboardData />
                                </div>

                                <div>

                                    <div className="pc-stat-value">
                                        {
                                            configRows.length
                                        }
                                    </div>

                                    <div className="pc-stat-label">
                                        Total Configurations
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>


                    <Col md={3}>

                        <div className="pc-stat">

                            <div className="d-flex align-items-center gap-3">

                                <div className="pc-stat-icon">
                                    <CheckCircleFill />
                                </div>

                                <div>

                                    <div className="pc-stat-value">
                                        {
                                            activeConfigCount
                                        }
                                    </div>

                                    <div className="pc-stat-label">
                                        Active Configurations
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>


                    <Col md={3}>

                        <div className="pc-stat">

                            <div className="d-flex align-items-center gap-3">

                                <div className="pc-stat-icon">
                                    <Speedometer2 />
                                </div>

                                <div>

                                    <div className="pc-stat-value">
                                        {
                                            processConfigCount
                                        }
                                    </div>

                                    <div className="pc-stat-label">
                                        Process Counters
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>


                    <Col md={3}>

                        <div className="pc-stat">

                            <div className="d-flex align-items-center gap-3">

                                <div className="pc-stat-icon">
                                    <BoxSeam />
                                </div>

                                <div>

                                    <div className="pc-stat-value">
                                        {
                                            finalOutputConfigCount
                                        }
                                    </div>

                                    <div className="pc-stat-label">
                                        Final Output Counters
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>

                </Row>


                {/* =================================================
                    MAIN CARD
                ================================================== */}

                <Card className="pc-card">

                    <Card.Body>

                        {/* =========================================
                            TABS
                        ========================================== */}

                        <div className="pc-tabs mb-3">

                            <button
                                type="button"
                                className={
                                    `pc-tab ${
                                        activeView ===
                                        VIEW_CONFIG
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={() =>
                                    setActiveView(
                                        VIEW_CONFIG
                                    )
                                }
                            >
                                Configuration
                            </button>


                            <button
                                type="button"
                                className={
                                    `pc-tab ${
                                        activeView ===
                                        VIEW_RUNTIME
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={() =>
                                    setActiveView(
                                        VIEW_RUNTIME
                                    )
                                }
                            >
                                Runtime
                            </button>


                            <button
                                type="button"
                                className={
                                    `pc-tab ${
                                        activeView ===
                                        VIEW_REPORT
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={() =>
                                    setActiveView(
                                        VIEW_REPORT
                                    )
                                }
                            >
                                Report
                            </button>

                        </div>


                        {/* =========================================
                            CONFIGURATION VIEW
                        ========================================== */}

                        {
                            activeView ===
                            VIEW_CONFIG && (

                                <>

                                    <div className="pc-toolbar mb-3">

                                        <div className="pc-search">

                                            <Search />

                                            <Form.Control
                                                placeholder="Search machine, process, signal, scope..."
                                                value={
                                                    searchText
                                                }
                                                onChange={
                                                    event =>
                                                        setSearchText(
                                                            event.target.value
                                                        )
                                                }
                                            />

                                        </div>


                                        <Button
                                            className="pc-btn-primary"
                                            onClick={
                                                openCreateConfig
                                            }
                                        >
                                            <Plus className="me-1" />

                                            Add Count Configuration
                                        </Button>

                                    </div>


                                    <div className="text-muted small mb-2">
                                        Showing {searchedConfigs.length} record(s)
                                    </div>


                                    <div className="pc-table-wrap">

                                        <Table
                                            className="pc-table"
                                            hover
                                        >

                                            <thead>

                                                <tr>

                                                    <th>
                                                        Machine
                                                    </th>

                                                    <th>
                                                        Process
                                                    </th>

                                                    <th>
                                                        Count Signal
                                                    </th>

                                                    <th>
                                                        Result Signal
                                                    </th>

                                                    <th>
                                                        Mode
                                                    </th>

                                                    <th>
                                                        Increment
                                                    </th>

                                                    <th>
                                                        Scope
                                                    </th>

                                                    <th>
                                                        Version
                                                    </th>

                                                    <th>
                                                        Effective From
                                                    </th>

                                                    <th>
                                                        Effective To
                                                    </th>

                                                    <th>
                                                        Status
                                                    </th>

                                                    <th>
                                                        Actions
                                                    </th>

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {
                                                    configQuery.isLoading
                                                        ? (

                                                            <tr>

                                                                <td
                                                                    colSpan={12}
                                                                    className="pc-empty"
                                                                >
                                                                    <Spinner
                                                                        size="sm"
                                                                        animation="border"
                                                                        className="me-2"
                                                                    />

                                                                    Loading Production Count configuration...
                                                                </td>

                                                            </tr>
                                                        )
                                                        : searchedConfigs.length ===
                                                            0
                                                            ? (

                                                                <tr>

                                                                    <td
                                                                        colSpan={12}
                                                                        className="pc-empty"
                                                                    >
                                                                        No Production Count configuration found.
                                                                    </td>

                                                                </tr>
                                                            )
                                                            : (

                                                                searchedConfigs.map(
                                                                    row => {

                                                                        const machine =
                                                                            machineMap.get(
                                                                                String(
                                                                                    row.machine_id
                                                                                )
                                                                            );


                                                                        const process =
                                                                            processMap.get(
                                                                                String(
                                                                                    row.process_id
                                                                                )
                                                                            );


                                                                        const countSignal =
                                                                            signalMap.get(
                                                                                String(
                                                                                    row.count_signal_id
                                                                                )
                                                                            );


                                                                        const resultSignal =
                                                                            signalMap.get(
                                                                                String(
                                                                                    row.result_signal_id
                                                                                )
                                                                            );


                                                                        return (

                                                                            <tr
                                                                                key={
                                                                                    row.production_count_config_id
                                                                                }
                                                                            >

                                                                                <td>
                                                                                    <strong>
                                                                                        {
                                                                                            machine
                                                                                                ? machineLabel(
                                                                                                    machine
                                                                                                )
                                                                                                : safeText(
                                                                                                    row.machine_id
                                                                                                )
                                                                                        }
                                                                                    </strong>
                                                                                </td>


                                                                                <td>
                                                                                    {
                                                                                        process
                                                                                            ? processLabel(
                                                                                                process
                                                                                            )
                                                                                            : "Machine Level"
                                                                                    }
                                                                                </td>


                                                                                <td>
                                                                                    {
                                                                                        countSignal
                                                                                            ? signalLabel(
                                                                                                countSignal
                                                                                            )
                                                                                            : "-"
                                                                                    }
                                                                                </td>


                                                                                <td>
                                                                                    {
                                                                                        resultSignal
                                                                                            ? signalLabel(
                                                                                                resultSignal
                                                                                            )
                                                                                            : "-"
                                                                                    }
                                                                                </td>


                                                                                <td>
                                                                                    {
                                                                                        safeText(
                                                                                            row.count_mode
                                                                                        )
                                                                                    }
                                                                                </td>


                                                                                <td>
                                                                                    {
                                                                                        safeText(
                                                                                            row.increment_qty
                                                                                        )
                                                                                    }
                                                                                </td>


                                                                                <td>

                                                                                    <ScopeBadge
                                                                                        scope={
                                                                                            row.count_scope
                                                                                        }
                                                                                    />

                                                                                </td>


                                                                                <td>
                                                                                    {
                                                                                        safeText(
                                                                                            row.version_no
                                                                                        )
                                                                                    }
                                                                                </td>


                                                                                <td>
                                                                                    {
                                                                                        displayDateTime(
                                                                                            row.effective_from
                                                                                        )
                                                                                    }
                                                                                </td>


                                                                                <td>
                                                                                    {
                                                                                        displayDateTime(
                                                                                            row.effective_to
                                                                                        )
                                                                                    }
                                                                                </td>


                                                                                <td>

                                                                                    <ActiveBadge
                                                                                        active={
                                                                                            row.is_active
                                                                                        }
                                                                                    />

                                                                                </td>


                                                                                <td>

                                                                                    <div className="d-flex gap-2">

                                                                                        <Button
                                                                                            className="pc-edit"
                                                                                            onClick={() =>
                                                                                                openEditConfig(
                                                                                                    row
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <PencilSquare className="me-1" />

                                                                                            Edit
                                                                                        </Button>


                                                                                        {
                                                                                            boolValue(
                                                                                                row.is_active
                                                                                            ) && (

                                                                                                <Button
                                                                                                    className="pc-delete"
                                                                                                    onClick={() =>
                                                                                                        deactivateConfig(
                                                                                                            row
                                                                                                        )
                                                                                                    }
                                                                                                >
                                                                                                    Deactivate
                                                                                                </Button>
                                                                                            )
                                                                                        }

                                                                                    </div>

                                                                                </td>

                                                                            </tr>
                                                                        );
                                                                    }
                                                                )
                                                            )
                                                }

                                            </tbody>

                                        </Table>

                                    </div>

                                </>
                            )
                        }


                        {/* =========================================
                            RUNTIME VIEW
                        ========================================== */}

                        {
                            activeView ===
                            VIEW_RUNTIME && (

                                <>

                                    <RuntimeFilterPanel
                                        filters={
                                            runtimeFilters
                                        }

                                        setFilters={
                                            setRuntimeFilters
                                        }

                                        companies={
                                            companies
                                        }

                                        machines={
                                            machines
                                        }

                                        processes={
                                            processes
                                        }

                                        onApply={() =>
                                            setAppliedRuntimeFilters({
                                                ...runtimeFilters
                                            })
                                        }

                                        onClear={() => {

                                            setRuntimeFilters(
                                                runtimeFilterInitialState
                                            );

                                            setAppliedRuntimeFilters(
                                                runtimeFilterInitialState
                                            );
                                        }}
                                    />


                                    <ProductionPulse records={runtimeRows} machineMap={machineMap} processMap={processMap}/>
<ProductionEventTable
                                        rows={
                                            runtimeRows
                                        }

                                        machineMap={
                                            machineMap
                                        }

                                        processMap={
                                            processMap
                                        }

                                        loading={
                                            runtimeQuery.isFetching
                                        }
                                    />

                                </>
                            )
                        }


                        {/* =========================================
                            REPORT VIEW
                        ========================================== */}

                        {
                            activeView ===
                            VIEW_REPORT && (

                                <>

                                    <RuntimeFilterPanel
                                        filters={
                                            runtimeFilters
                                        }

                                        setFilters={
                                            setRuntimeFilters
                                        }

                                        companies={
                                            companies
                                        }

                                        machines={
                                            machines
                                        }

                                        processes={
                                            processes
                                        }

                                        onApply={() =>
                                            setAppliedRuntimeFilters({
                                                ...runtimeFilters
                                            })
                                        }

                                        onClear={() => {

                                            setRuntimeFilters(
                                                runtimeFilterInitialState
                                            );

                                            setAppliedRuntimeFilters(
                                                runtimeFilterInitialState
                                            );
                                        }}
                                    />


                                    <Row className="g-3 mb-3">

                                        <Col md={3}>

                                            <div className="pc-stat">

                                                <div className="pc-stat-label">
                                                    Total Events
                                                </div>

                                                <div className="pc-stat-value mt-1">
                                                    {
                                                        Number(
                                                            reportMeta.total_events ||
                                                            0
                                                        )
                                                    }
                                                </div>

                                            </div>

                                        </Col>


                                        <Col md={3}>

                                            <div className="pc-stat">

                                                <div className="pc-stat-label">
                                                    Process Quantity
                                                </div>

                                                <div className="pc-stat-value mt-1">
                                                    {
                                                        Number(
                                                            reportMeta.process_qty ||
                                                            0
                                                        )
                                                    }
                                                </div>

                                            </div>

                                        </Col>


                                        <Col md={3}>

                                            <div className="pc-stat">

                                                <div className="pc-stat-label">
                                                    Final Output
                                                </div>

                                                <div className="pc-stat-value mt-1">
                                                    {
                                                        Number(
                                                            reportMeta.final_output_qty ||
                                                            0
                                                        )
                                                    }
                                                </div>

                                            </div>

                                        </Col>


                                        <Col md={3}>

                                            <div className="pc-stat">

                                                <div className="pc-stat-label">
                                                    Finished Quantity
                                                </div>

                                                <div className="pc-stat-value mt-1">
                                                    {
                                                        Number(
                                                            reportMeta.finished_qty ||
                                                            0
                                                        )
                                                    }
                                                </div>

                                                <small className="text-muted">
                                                    FINAL_OUTPUT only
                                                </small>

                                            </div>

                                        </Col>

                                    </Row>


                                    <div className="d-flex justify-content-end mb-3">

                                        <Button
                                            className="pc-btn-outline"
                                            onClick={
                                                handleExport
                                            }
                                        >
                                            Export CSV
                                        </Button>

                                    </div>


                                    <ExecutionReport records={reportRows} kind="production" machineMap={machineMap} processMap={processMap}/><ProductionEventTable
                                        rows={
                                            reportRows
                                        }

                                        machineMap={
                                            machineMap
                                        }

                                        processMap={
                                            processMap
                                        }

                                        loading={
                                            reportQuery.isFetching
                                        }
                                    />

                                </>
                            )
                        }

                    </Card.Body>

                </Card>


                {/* =================================================
                    CONFIG MODAL
                ================================================== */}

                <Modal
                    show={
                        showConfigModal
                    }
                    onHide={() =>
                        setShowConfigModal(
                            false
                        )
                    }
                    centered
                    size="xl"
                    backdrop="static"
                    className="pc-modal"
                >

                    <Form
                        onSubmit={
                            submitConfig
                        }
                    >

                        <Modal.Header closeButton>

                            <Modal.Title>

                                {
                                    configForm.production_count_config_id
                                        ? "Edit Production Count Configuration"
                                        : "Add Production Count Configuration"
                                }

                            </Modal.Title>

                        </Modal.Header>


                        <Modal.Body>

                            {
                                lookupLoading && (

                                    <Alert variant="light">

                                        <Spinner
                                            size="sm"
                                            animation="border"
                                            className="me-2"
                                        />

                                        Loading master dropdowns...

                                    </Alert>
                                )
                            }


                            <Row className="g-3">

                                {/* COMPANY */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">

                                        Company

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Select
                                        required
                                        value={
                                            configForm.company_id
                                        }disabled={Boolean(configForm.production_count_config_id)}
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        company_id:
                                                            event.target.value,

                                                        plant_id: "",

                                                        line_id: "",

                                                        machine_id: "",

                                                        process_id: "",

                                                        count_signal_id: "",

                                                        result_signal_id: ""
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
                                                            companyId(
                                                                item
                                                            )
                                                        }
                                                        value={
                                                            companyId(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            companyLabel(
                                                                item
                                                            )
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                {/* PLANT */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">

                                        Plant

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Select
                                        required
                                       disabled={
    Boolean(configForm.production_count_config_id) ||
    !configForm.company_id
}
                                        value={
                                            configForm.plant_id
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id: "",

                                                        machine_id: "",

                                                        count_signal_id: "",

                                                        result_signal_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Plant
                                        </option>


                                        {
                                            configPlants.map(
                                                item => (

                                                    <option
                                                        key={
                                                            plantId(
                                                                item
                                                            )
                                                        }
                                                        value={
                                                            plantId(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            plantLabel(
                                                                item
                                                            )
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                {/* LINE */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">

                                        Line

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Select
                                        required
                                        disabled={
    Boolean(configForm.production_count_config_id) ||
    !configForm.plant_id
}
                                        value={
                                            configForm.line_id
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        line_id:
                                                            event.target.value,

                                                        machine_id: "",

                                                        count_signal_id: "",

                                                        result_signal_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Line
                                        </option>


                                        {
                                            configLines.map(
                                                item => (

                                                    <option
                                                        key={
                                                            lineId(
                                                                item
                                                            )
                                                        }
                                                        value={
                                                            lineId(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            lineLabel(
                                                                item
                                                            )
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                {/* MACHINE */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">

                                        Machine

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Select
                                        required
                                        disabled={
    Boolean(configForm.production_count_config_id) ||
    !configForm.line_id
}
                                        value={
                                            configForm.machine_id
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        machine_id:
                                                            event.target.value,

                                                        count_signal_id: "",

                                                        result_signal_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Machine
                                        </option>


                                        {
                                            configMachines.map(
                                                item => (

                                                    <option
                                                        key={
                                                            machineId(
                                                                item
                                                            )
                                                        }
                                                        value={
                                                            machineId(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            machineLabel(
                                                                item
                                                            )
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                {/* PROCESS */}

                                <Col md={4}>

                                    <Form.Label className="pc-label">
                                        Process
                                    </Form.Label>


                                    <Form.Select
                                        value={
                                            configForm.process_id
                                        }disabled={Boolean(configForm.production_count_config_id)}
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        process_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Machine Level / Any Process
                                        </option>


                                        {
                                            configProcesses.map(
                                                item => (

                                                    <option
                                                        key={
                                                            processId(
                                                                item
                                                            )
                                                        }
                                                        value={
                                                            processId(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            processLabel(
                                                                item
                                                            )
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                {/* COUNT MODE */}

                                <Col md={4}>

                                    <Form.Label className="pc-label">

                                        Count Mode

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Select
                                        required
                                        value={
                                            configForm.count_mode
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        count_mode:
                                                            event.target.value,

                                                        count_signal_id:
                                                            [
                                                                "MANUAL",
                                                                "API"
                                                            ].includes(
                                                                event.target.value
                                                            )
                                                                ? ""
                                                                : old.count_signal_id
                                                    })
                                                )
                                        }
                                    >

                                        <option value="SIGNAL_EDGE">
                                            SIGNAL_EDGE
                                        </option>

                                        <option value="MANUAL">
                                            MANUAL
                                        </option>

                                        <option value="API">
                                            API
                                        </option>

                                    </Form.Select>

                                </Col>


                                {/* COUNT SCOPE */}

                                <Col md={4}>

                                    <Form.Label className="pc-label">

                                        Count Scope

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Select
                                        required
                                        value={
                                            configForm.count_scope
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        count_scope:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="PROCESS">
                                            PROCESS
                                        </option>

                                        <option value="FINAL_OUTPUT">
                                            FINAL_OUTPUT
                                        </option>

                                    </Form.Select>


                                    {
                                        configForm.count_scope ===
                                        "FINAL_OUTPUT" && (

                                            <Form.Text className="text-success">
                                                This machine/process will contribute finished production.
                                            </Form.Text>
                                        )
                                    }

                                </Col>


                                {/* COUNT SIGNAL */}

                                <Col md={6}>

                                    <Form.Label className="pc-label">

                                        Count Signal

                                        {
                                            ![
                                                "MANUAL",
                                                "API"
                                            ].includes(
                                                configForm.count_mode
                                            ) && (

                                                <span className="pc-required">
                                                    {" "}*
                                                </span>
                                            )
                                        }

                                    </Form.Label>


                                    <Form.Select
                                        required={
                                            ![
                                                "MANUAL",
                                                "API"
                                            ].includes(
                                                configForm.count_mode
                                            )
                                        }
                                       disabled={
    Boolean(configForm.production_count_config_id) ||
    !configForm.machine_id ||
    [
        "MANUAL",
        "API"
    ].includes(
        configForm.count_mode
    )
}
                                        value={
                                            configForm.count_signal_id
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        count_signal_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            {
                                                [
                                                    "MANUAL",
                                                    "API"
                                                ].includes(
                                                    configForm.count_mode
                                                )
                                                    ? "Not Required"
                                                    : "Select Count Signal"
                                            }
                                        </option>


                                        {
                                            configSignals.map(
                                                item => (

                                                    <option
                                                        key={
                                                            signalId(
                                                                item
                                                            )
                                                        }
                                                        value={
                                                            signalId(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            signalLabel(
                                                                item
                                                            )
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                {/* RESULT SIGNAL */}

                                <Col md={6}>

                                    <Form.Label className="pc-label">
                                        Result Signal
                                    </Form.Label>


                                    <Form.Select
                                       disabled={
    Boolean(configForm.production_count_config_id) ||
    !configForm.machine_id
}
                                        value={
                                            configForm.result_signal_id
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        result_signal_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            No Result Signal
                                        </option>


                                        {
                                            configSignals.map(
                                                item => (

                                                    <option
                                                        key={
                                                            signalId(
                                                                item
                                                            )
                                                        }
                                                        value={
                                                            signalId(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            signalLabel(
                                                                item
                                                            )
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                {/* INCREMENT */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">

                                        Increment Qty

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Control
                                        required
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        value={
                                            configForm.increment_qty
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        increment_qty:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                {/* VERSION */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">

                                        Version

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Control
                                        required
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={
                                            configForm.version_no
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        version_no:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                {/* EFFECTIVE FROM */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">
                                        Effective From
                                    </Form.Label>


                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            configForm.effective_from
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        effective_from:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                {/* EFFECTIVE TO */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">
                                        Effective To
                                    </Form.Label>


                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            configForm.effective_to
                                        }
                                        onChange={
                                            event =>
                                                setConfigForm(
                                                    old => ({
                                                        ...old,

                                                        effective_to:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                {/* ACTIVE */}

                                <Col md={4}>

                                    <div className="pt-3">

                                        <Form.Check
                                            type="switch"
                                            label="Active Configuration"
                                            checked={
                                                configForm.is_active
                                            }
                                            onChange={
                                                event =>
                                                    setConfigForm(
                                                        old => ({
                                                            ...old,

                                                            is_active:
                                                                event.target.checked
                                                        })
                                                    )
                                            }
                                        />

                                    </div>

                                </Col>

                            </Row>

                        </Modal.Body>


                        <Modal.Footer>

                            <Button
                                variant="outline-secondary"
                                onClick={() =>
                                    setShowConfigModal(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </Button>


                            <Button
                                type="submit"
                                className="pc-btn-primary"
                                disabled={
                                    configMutation.isPending
                                }
                            >
                                {
                                    configMutation.isPending
                                        ? "Saving..."
                                        : "Save Configuration"
                                }
                            </Button>

                        </Modal.Footer>

                    </Form>

                </Modal>


                {/* =================================================
                    EXECUTE MODAL
                ================================================== */}

                <Modal
                    show={
                        showExecuteModal
                    }
                    onHide={() =>
                        setShowExecuteModal(
                            false
                        )
                    }
                    centered
                    size="xl"
                    backdrop="static"
                    className="pc-modal"
                >

                    <Form
                        onSubmit={
                            submitExecute
                        }
                    >

                        <Modal.Header closeButton>

                            <Modal.Title>
                                Record Production Count
                            </Modal.Title>

                        </Modal.Header>


                        <Modal.Body>

                            <div className="pc-context mb-3">

                                Production events are append-only.
                                Quantity and PROCESS / FINAL_OUTPUT scope
                                are taken from the selected Production
                                Count configuration.

                            </div>


                            <Row className="g-3">

                                {/* CONFIG */}

                                <Col md={6}>

                                    <Form.Label className="pc-label">

                                        Production Count Configuration

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Select
                                        required
                                        value={
                                            executeForm.production_count_config_id
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    old => ({
                                                        ...old,

                                                        production_count_config_id:
                                                            event.target.value,

                                                        production_plan_id: "",

                                                        plan_entry_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Configuration
                                        </option>


                                        {
                                            configRows
                                                .filter(
                                                    row =>
                                                        boolValue(
                                                            row.is_active
                                                        )
                                                )
                                                .map(
                                                    row => {

                                                        const machine =
                                                            machineMap.get(
                                                                String(
                                                                    row.machine_id
                                                                )
                                                            );


                                                        const process =
                                                            processMap.get(
                                                                String(
                                                                    row.process_id
                                                                )
                                                            );


                                                        return (

                                                            <option
                                                                key={
                                                                    row.production_count_config_id
                                                                }
                                                                value={
                                                                    row.production_count_config_id
                                                                }
                                                            >
                                                                {
                                                                    machine
                                                                        ? machineLabel(
                                                                            machine
                                                                        )
                                                                        : row.machine_id
                                                                }
                                                                {" | "}
                                                                {
                                                                    process
                                                                        ? processLabel(
                                                                            process
                                                                        )
                                                                        : "Machine Level"
                                                                }
                                                                {" | "}
                                                                {
                                                                    row.count_scope
                                                                }
                                                            </option>
                                                        );
                                                    }
                                                )
                                        }

                                    </Form.Select>

                                </Col>


                                {/* PRODUCTION PLAN */}

                                <Col md={6}>

                                    <Form.Label className="pc-label">

                                        Production Plan

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Select
                                        required
                                        disabled={
                                            !selectedExecuteConfig
                                        }
                                        value={
                                            executeForm.production_plan_id
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    old => ({
                                                        ...old,

                                                        production_plan_id:
                                                            event.target.value,

                                                        plan_entry_id:
                                                            ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Production Plan
                                        </option>


                                        {
                                            executePlans.map(
                                                item => (

                                                    <option
                                                        key={
                                                            productionPlanId(
                                                                item
                                                            )
                                                        }
                                                        value={
                                                            productionPlanId(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            productionPlanLabel(
                                                                item
                                                            )
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                {/* PLAN ENTRY */}

                                <Col md={12}>

                                    <Form.Label className="pc-label">

                                        Plan Entry

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Select
                                        required
                                        disabled={
                                            !executeForm.production_plan_id ||
                                            planEntriesQuery.isLoading
                                        }
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
                                    >

                                        <option value="">
                                            {
                                                planEntriesQuery.isLoading
                                                    ? "Loading Plan Entries..."
                                                    : executablePlanEntries.length ===
                                                        0 &&
                                                        executeForm.production_plan_id
                                                        ? "No matching Plan Entry for selected configuration"
                                                        : "Select Plan Entry"
                                            }
                                        </option>


                                        {
                                            executablePlanEntries.map(
                                                item => (

                                                    <option
                                                        key={
                                                            planEntryId(
                                                                item
                                                            )
                                                        }
                                                        value={
                                                            planEntryId(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            planEntryLabel(
                                                                item
                                                            )
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                {/* CONTEXT */}

                                {
                                    selectedExecuteConfig && (

                                        <Col md={12}>

                                            <div className="pc-context">

                                                <Row className="g-3">

                                                    <Col md={3}>

                                                        <small className="text-muted">
                                                            Count Scope
                                                        </small>

                                                        <div className="pc-context-value">
                                                            {
                                                                selectedExecuteConfig.count_scope
                                                            }
                                                        </div>

                                                    </Col>


                                                    <Col md={3}>

                                                        <small className="text-muted">
                                                            Increment
                                                        </small>

                                                        <div className="pc-context-value">
                                                            {
                                                                selectedExecuteConfig.increment_qty
                                                            }
                                                        </div>

                                                    </Col>


                                                    <Col md={3}>

                                                        <small className="text-muted">
                                                            Count Mode
                                                        </small>

                                                        <div className="pc-context-value">
                                                            {
                                                                selectedExecuteConfig.count_mode
                                                            }
                                                        </div>

                                                    </Col>


                                                    <Col md={3}>

                                                        <small className="text-muted">
                                                            Machine
                                                        </small>

                                                        <div className="pc-context-value">
                                                            {
                                                                machineMap.get(
                                                                    String(
                                                                        selectedExecuteConfig.machine_id
                                                                    )
                                                                )
                                                                    ? machineLabel(
                                                                        machineMap.get(
                                                                            String(
                                                                                selectedExecuteConfig.machine_id
                                                                            )
                                                                        )
                                                                    )
                                                                    : selectedExecuteConfig.machine_id
                                                            }
                                                        </div>

                                                    </Col>

                                                </Row>

                                            </div>

                                        </Col>
                                    )
                                }


                                {
                                    selectedPlanEntry && (

                                        <Col md={12}>

                                            <div className="pc-context">

                                                <strong>
                                                    Planning Context
                                                </strong>


                                                <Row className="g-3 mt-1">

                                                    <Col md={3}>

                                                        <small className="text-muted">
                                                            Shift ID
                                                        </small>

                                                        <div className="pc-context-value">
                                                            {
                                                                selectedPlanEntry.shift_id
                                                            }
                                                        </div>

                                                    </Col>


                                                    <Col md={3}>

                                                        <small className="text-muted">
                                                            Part ID
                                                        </small>

                                                        <div className="pc-context-value text-break">
                                                            {
                                                                selectedPlanEntry.part_id
                                                            }
                                                        </div>

                                                    </Col>


                                                    <Col md={3}>

                                                        <small className="text-muted">
                                                            Process ID
                                                        </small>

                                                        <div className="pc-context-value text-break">
                                                            {
                                                                selectedPlanEntry.process_id
                                                            }
                                                        </div>

                                                    </Col>


                                                    <Col md={3}>

                                                        <small className="text-muted">
                                                            Target Qty
                                                        </small>

                                                        <div className="pc-context-value">
                                                            {
                                                                selectedPlanEntry.target_qty
                                                            }
                                                        </div>

                                                    </Col>

                                                </Row>

                                            </div>

                                        </Col>
                                    )
                                }


                                {/* RESULT */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">

                                        Result Status

                                        <span className="pc-required">
                                            {" "}*
                                        </span>

                                    </Form.Label>


                                    <Form.Select
                                        required
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
                                    >

                                        <option value="OK">
                                            OK
                                        </option>

                                        <option value="NOK">
                                            NOK
                                        </option>

                                        <option value="PASS">
                                            PASS
                                        </option>

                                        <option value="FAIL">
                                            FAIL
                                        </option>

                                    </Form.Select>

                                </Col>


                                {/* EVENT TYPE */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">
                                        Event Type
                                    </Form.Label>


                                    <Form.Control
                                        required
                                        maxLength={40}
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


                                {/* CYCLE */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">
                                        Cycle Time ms
                                    </Form.Label>


                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={
                                            executeForm.cycle_time_ms
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    old => ({
                                                        ...old,

                                                        cycle_time_ms:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                {/* EVENT TIME */}

                                <Col md={3}>

                                    <Form.Label className="pc-label">
                                        Event Time
                                    </Form.Label>


                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            executeForm.event_ts
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    old => ({
                                                        ...old,

                                                        event_ts:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                {/* UNIT */}

                                <Col md={4}>

                                    <Form.Label className="pc-label">
                                        Unit ID
                                    </Form.Label>


                                    <Form.Control
                                        placeholder="Optional UUID"
                                        value={
                                            executeForm.unit_id
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    old => ({
                                                        ...old,

                                                        unit_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                {/* SOURCE */}

                                <Col md={4}>

                                    <Form.Label className="pc-label">
                                        Source System
                                    </Form.Label>


                                    <Form.Control
                                        required
                                        maxLength={50}
                                        value={
                                            executeForm.source_system
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    old => ({
                                                        ...old,

                                                        source_system:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                {/* CORRELATION */}

                                <Col md={4}>

                                    <Form.Label className="pc-label">
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


                                {/* IDEMPOTENCY */}

                                <Col md={12}>

                                    <Form.Label className="pc-label">
                                        Idempotency Key
                                    </Form.Label>


                                    <Form.Control
                                        maxLength={150}
                                        placeholder="Optional - generated automatically if blank"
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
                                variant="outline-secondary"
                                onClick={() =>
                                    setShowExecuteModal(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </Button>


                            <Button
                                type="submit"
                                className="pc-btn-primary"
                                disabled={
                                    executeMutation.isPending ||
                                    planEntriesQuery.isLoading
                                }
                            >
                                {
                                    executeMutation.isPending
                                        ? "Recording..."
                                        : "Record Production Count"
                                }
                            </Button>

                        </Modal.Footer>

                    </Form>

                </Modal>

            </div>
</>
        );
    };


// ============================================================
// RUNTIME FILTER PANEL
// ============================================================

const RuntimeFilterPanel =
    ({
        filters,
        setFilters,
        companies,
        machines,
        processes,
        onApply,
        onClear
    }) => (

        <div className="pc-filter">

            <Row className="g-2">

                <Col md={3}>

                    <Form.Label className="pc-label">
                        Company
                    </Form.Label>


                    <Form.Select
                        value={
                            filters.company_id
                        }
                        onChange={
                            event =>
                                setFilters(
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
                                item => (

                                    <option
                                        key={
                                            companyId(
                                                item
                                            )
                                        }
                                        value={
                                            companyId(
                                                item
                                            )
                                        }
                                    >
                                        {
                                            companyLabel(
                                                item
                                            )
                                        }
                                    </option>
                                )
                            )
                        }

                    </Form.Select>

                </Col>


                <Col md={3}>

                    <Form.Label className="pc-label">
                        Machine
                    </Form.Label>


                    <Form.Select
                        value={
                            filters.machine_id
                        }
                        onChange={
                            event =>
                                setFilters(
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
                                item => (

                                    <option
                                        key={
                                            machineId(
                                                item
                                            )
                                        }
                                        value={
                                            machineId(
                                                item
                                            )
                                        }
                                    >
                                        {
                                            machineLabel(
                                                item
                                            )
                                        }
                                    </option>
                                )
                            )
                        }

                    </Form.Select>

                </Col>


                <Col md={3}>

                    <Form.Label className="pc-label">
                        Process
                    </Form.Label>


                    <Form.Select
                        value={
                            filters.process_id
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        process_id:
                                            event.target.value
                                    })
                                )
                        }
                    >

                        <option value="">
                            All Processes
                        </option>


                        {
                            processes.map(
                                item => (

                                    <option
                                        key={
                                            processId(
                                                item
                                            )
                                        }
                                        value={
                                            processId(
                                                item
                                            )
                                        }
                                    >
                                        {
                                            processLabel(
                                                item
                                            )
                                        }
                                    </option>
                                )
                            )
                        }

                    </Form.Select>

                </Col>


                <Col md={3}>

                    <Form.Label className="pc-label">
                        Count Scope
                    </Form.Label>


                    <Form.Select
                        value={
                            filters.count_scope
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        count_scope:
                                            event.target.value
                                    })
                                )
                        }
                    >

                        <option value="">
                            All Scopes
                        </option>

                        <option value="PROCESS">
                            PROCESS
                        </option>

                        <option value="FINAL_OUTPUT">
                            FINAL_OUTPUT
                        </option>

                    </Form.Select>

                </Col>


                <Col md={2}>

                    <Form.Label className="pc-label">
                        Shift ID
                    </Form.Label>


                    <Form.Control
                        type="number"
                        min="1"
                        value={
                            filters.shift_id
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        shift_id:
                                            event.target.value
                                    })
                                )
                        }
                    />

                </Col>


                <Col md={2}>

                    <Form.Label className="pc-label">
                        Result
                    </Form.Label>


                    <Form.Control
                        value={
                            filters.result_status
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        result_status:
                                            event.target.value
                                    })
                                )
                        }
                    />

                </Col>


                <Col md={2}>

                    <Form.Label className="pc-label">
                        Event Type
                    </Form.Label>


                    <Form.Control
                        value={
                            filters.event_type
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        event_type:
                                            event.target.value
                                    })
                                )
                        }
                    />

                </Col>


                <Col md={2}>

                    <Form.Label className="pc-label">
                        Source
                    </Form.Label>


                    <Form.Control
                        value={
                            filters.source_system
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        source_system:
                                            event.target.value
                                    })
                                )
                        }
                    />

                </Col>


                <Col md={2}>

                    <Form.Label className="pc-label">
                        From
                    </Form.Label>


                    <Form.Control
                        type="datetime-local"
                        value={
                            filters.from_timestamp
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        from_timestamp:
                                            event.target.value
                                    })
                                )
                        }
                    />

                </Col>


                <Col md={2}>

                    <Form.Label className="pc-label">
                        To
                    </Form.Label>


                    <Form.Control
                        type="datetime-local"
                        value={
                            filters.to_timestamp
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        to_timestamp:
                                            event.target.value
                                    })
                                )
                        }
                    />

                </Col>


                <Col
                    md={12}
                    className="d-flex justify-content-end gap-2 mt-3"
                >

                    <Button
                        variant="outline-secondary"
                        onClick={
                            onClear
                        }
                    >
                        Clear
                    </Button>


                    <Button
                        className="pc-btn-primary"
                        onClick={
                            onApply
                        }
                    >
                        Apply Filters
                    </Button>

                </Col>

            </Row>

        </div>
    );


// ============================================================
// PRODUCTION EVENT TABLE
// ============================================================

const ProductionEventTable =
    ({
        rows,
        machineMap,
        processMap,
        loading
    }) => (

        <div className="pc-table-wrap">

            <Table
                className="pc-table"
                hover
            >

                <thead>

                    <tr>

                        <th>
                            Event Time
                        </th>

                        <th>
                            Machine
                        </th>

                        <th>
                            Process
                        </th>

                        <th>
                            Shift
                        </th>

                        <th>
                            Plan Entry
                        </th>

                        <th>
                            Event Type
                        </th>

                        <th>
                            Qty
                        </th>

                        <th>
                            Scope
                        </th>

                        <th>
                            Result
                        </th>

                        <th>
                            Cycle ms
                        </th>

                        <th>
                            Unit
                        </th>

                        <th>
                            Source
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {
                        loading
                            ? (

                                <tr>

                                    <td
                                        colSpan={12}
                                        className="pc-empty"
                                    >
                                        <Spinner
                                            size="sm"
                                            animation="border"
                                            className="me-2"
                                        />

                                        Loading Production Count events...
                                    </td>

                                </tr>
                            )
                            : rows.length ===
                                0
                                ? (

                                    <tr>

                                        <td
                                            colSpan={12}
                                            className="pc-empty"
                                        >
                                            No Production Count events found.
                                        </td>

                                    </tr>
                                )
                                : (

                                    rows.map(
                                        row => {

                                            const machine =
                                                machineMap.get(
                                                    String(
                                                        row.machine_id
                                                    )
                                                );


                                            const process =
                                                processMap.get(
                                                    String(
                                                        row.process_id
                                                    )
                                                );


                                            return (

                                                <tr
                                                    key={
                                                        row.event_id
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            displayDateTime(
                                                                row.event_ts
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            machine
                                                                ? machineLabel(
                                                                    machine
                                                                )
                                                                : safeText(
                                                                    row.machine_id
                                                                )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            process
                                                                ? processLabel(
                                                                    process
                                                                )
                                                                : safeText(
                                                                    row.process_id
                                                                )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            safeText(
                                                                row.shift_id
                                                            )
                                                        }
                                                    </td>


                                                    <td
                                                        title={
                                                            row.plan_entry_id ||
                                                            ""
                                                        }
                                                    >
                                                        {
                                                            row.plan_entry_id
                                                                ? `${String(
                                                                    row.plan_entry_id
                                                                ).slice(
                                                                    0,
                                                                    8
                                                                )}...`
                                                                : "-"
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            safeText(
                                                                row.event_type
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        <strong>
                                                            {
                                                                safeText(
                                                                    row.count_qty
                                                                )
                                                            }
                                                        </strong>
                                                    </td>


                                                    <td>

                                                        <ScopeBadge
                                                            scope={
                                                                row.count_scope
                                                            }
                                                        />

                                                    </td>


                                                    <td>

                                                        <ResultBadge
                                                            status={
                                                                row.result_status
                                                            }
                                                        />

                                                    </td>


                                                    <td>
                                                        {
                                                            safeText(
                                                                row.cycle_time_ms
                                                            )
                                                        }
                                                    </td>


                                                    <td
                                                        title={
                                                            row.unit_id ||
                                                            ""
                                                        }
                                                    >
                                                        {
                                                            row.unit_id
                                                                ? `${String(
                                                                    row.unit_id
                                                                ).slice(
                                                                    0,
                                                                    8
                                                                )}...`
                                                                : "-"
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            safeText(
                                                                row.source_system
                                                            )
                                                        }
                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )
                                )
                    }

                </tbody>

            </Table>

        </div>
    );


// ============================================================
// EXPORT
// ============================================================

export default ProductionCount;