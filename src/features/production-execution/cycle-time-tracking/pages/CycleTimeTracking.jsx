import ExecutionReport from '../../../../shared/operations/ExecutionReport.jsx';
import ReportLens from '../../../../shared/operations/ReportLens.jsx';
import CycleRun from '../../../../shared/design/CycleRun.jsx';


import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/CycleTimeTracking/CycleTimeTracking.jsx

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
    CheckCircleFill,
    ClockHistory,
    PencilSquare,
    PlayFill,
    Plus,
    Search,
    Speedometer2,
    Stopwatch
} from "react-bootstrap-icons";

import {
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";
import signalService from "../../../master-data/signal-mapping/api/signal.service.js";

import cycleTimeTrackingService, {
    CYCLE_TIME_MODES,
    createCycleTimeConfig,
    executeCycleTime,
    exportCycleTimeReport,
    getCycleTimeMaster,
    getCycleTimeReport,
    getCycleTimeRuntime,
    softDeleteCycleTimeConfig,
    updateCycleTimeConfig
} from "../api/cycleTimeTracking.service.js";


// ============================================================
// VIEW CONSTANTS
// ============================================================

const VIEW_CONFIG = "CONFIG";
const VIEW_RUNTIME = "RUNTIME";
const VIEW_REPORT = "REPORT";


// ============================================================
// CONFIG FORM
// ============================================================

const configInitialState = {

    cycle_time_config_id: "",

    company_id: "",
    plant_id: "",
    line_id: "",
    machine_id: "",
    process_id: "",

    start_signal_id: "",
    end_signal_id: "",
    result_signal_id: "",

    cycle_mode:
        CYCLE_TIME_MODES.MANUAL,

    standard_cycle_ms: 45000,

    is_active: true,

    version_no: 1,

    effective_from: "",
    effective_to: ""
};


// ============================================================
// EXECUTE FORM
// ============================================================

const executeInitialState = {

    cycle_time_config_id: "",

    production_plan_id: "",
    plan_entry_id: "",

    start_ts: "",
    end_ts: "",

    result_status: "OK",

    unit_id: "",

    source_system: "MES_UI",

    correlation_id: "",

    idempotency_key: ""
};


// ============================================================
// FILTERS
// ============================================================

const filterInitialState = {

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

    cycle_time_config_id: "",

    result_status: "",
    source_system: "",

    correlation_id: "",

    from_timestamp: "",
    to_timestamp: "",

    idempotency_key: ""
};


// ============================================================
// HELPERS
// ============================================================

const sameId = (
    left,
    right
) =>
    String(left ?? "") ===
    String(right ?? "");


const hasValue = value =>
    value !== undefined &&
    value !== null &&
    value !== "";


const boolValue = value =>
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value)
        .toLowerCase() === "true";


const safeText = value =>
    hasValue(value)
        ? String(value)
        : "-";


const displayDateTime = value => {

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

    return date.toLocaleString();
};


const toLocalDateTime = value => {

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


const getErrorMessage = (
    error,
    fallback
) => {

    const response =
        error?.response?.data;

    if (
        Array.isArray(
            response?.errors
        ) &&
        response.errors.length
    ) {

        return `${
            response.message ||
            "Validation failed."
        } ${response.errors.join(", ")}`;
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

const extractRows = (
    response,
    possibleKeys = []
) => {

    const candidates = [

        response,

        response?.data,

        response?.data?.data,

        response
            ?.data
            ?.data
            ?.data
    ];


    for (
        const candidate of
        candidates
    ) {

        if (
            Array.isArray(
                candidate
            )
        ) {

            return candidate;
        }


        for (
            const key of
            possibleKeys
        ) {

            if (
                Array.isArray(
                    candidate?.[key]
                )
            ) {

                return candidate[
                    key
                ];
            }
        }
    }


    return [];
};


const findRowsRecursive = (
    value,
    predicate
) => {

    if (!value) {
        return [];
    }


    if (
        Array.isArray(value)
    ) {

        const matches =
            value.filter(
                item =>
                    item &&
                    typeof item ===
                        "object" &&
                    predicate(item)
            );


        if (
            matches.length
        ) {

            return matches;
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
                nested.length
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
            Object.values(value)
        ) {

            const nested =
                findRowsRecursive(
                    nestedValue,
                    predicate
                );


            if (
                nested.length
            ) {

                return nested;
            }
        }
    }


    return [];
};


// ============================================================
// COMPANY
// ============================================================

const companyId = item =>
    item?.company_id ??
    item?.companyId ??
    "";


const companyLabel = item =>
    item?.company_name ??
    item?.company_code ??
    item?.companyName ??
    companyId(item);


// ============================================================
// PLANT
// ============================================================

const plantId = item =>
    item?.plant_id ??
    item?.plantId ??
    item?.shop_id ??
    "";


const plantLabel = item =>
    item?.plant_name ??
    item?.shop_name ??
    item?.plant_code ??
    plantId(item);


// ============================================================
// LINE
// ============================================================

const lineId = item =>
    item?.line_id ??
    item?.lineId ??
    "";


const lineLabel = item =>
    item?.line_name ??
    item?.line_code ??
    lineId(item);


// ============================================================
// MACHINE
// ============================================================

const machineId = item =>
    item?.machine_id ??
    item?.machineId ??
    "";


const machineLabel = item =>
    item?.machine_name ??
    item?.machine_code ??
    item?.asset_name ??
    machineId(item);


// ============================================================
// PROCESS
// ============================================================

const processId = item =>
    item?.process_id ??
    item?.processId ??
    "";


const processLabel = item => {

    const code =
        item?.process_code ??
        item?.processCode ??
        "";

    const name =
        item?.process_name ??
        item?.processName ??
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
        processId(item)
    );
};


// ============================================================
// SIGNAL
// ============================================================

const signalId = item =>
    item?.signal_mapping_id ??
    item?.signalMappingId ??
    "";


const signalLabel = item => {

    const code =
        item?.signal_code ??
        item?.signalCode ??
        "";

    const address =
        item?.raw_address ??
        item?.rawAddress ??
        "";

    const tag =
        item?.tag_name ??
        item?.tag_code ??
        "";


    if (
        code &&
        address
    ) {

        return `${code} - ${address}`;
    }


    if (
        code &&
        tag
    ) {

        return `${code} - ${tag}`;
    }


    return (
        code ||
        tag ||
        address ||
        signalId(item)
    );
};


// ============================================================
// PRODUCTION PLAN
// ============================================================

const productionPlanId = item =>
    item?.plan_id ??
    item?.planId ??
    "";


const productionPlanLabel = item =>
    item?.plan_no ??
    item?.plan_code ??
    item?.plan_name ??
    item?.production_plan_no ??
    productionPlanId(item);


// ============================================================
// PLAN ENTRY
// ============================================================

const planEntryId = item =>
    item?.plan_entry_id ??
    item?.planEntryId ??
    "";


const planEntryLabel = item => {

    const values = [];


    if (
        hasValue(
            item?.sequence_no
        )
    ) {

        values.push(
            `Seq ${item.sequence_no}`
        );
    }


    if (
        item?.machine_name ||
        item?.machine_code
    ) {

        values.push(
            item.machine_name ||
            item.machine_code
        );
    }


    if (
        item?.process_name ||
        item?.process_code
    ) {

        values.push(
            item.process_name ||
            item.process_code
        );
    }


    if (
        item?.part_name ||
        item?.part_code
    ) {

        values.push(
            item.part_name ||
            item.part_code
        );
    }


    if (
        hasValue(
            item?.target_qty
        )
    ) {

        values.push(
            `Qty ${item.target_qty}`
        );
    }


    return values.length
        ? values.join(" - ")
        : planEntryId(item);
};


// ============================================================
// FORMAT
// ============================================================

const formatMs = value =>
    cycleTimeTrackingService
        .formatMilliseconds(
            value
        );


const calculateLocalCycle = (
    start,
    end
) => {

    if (
        !start ||
        !end
    ) {

        return null;
    }


    const startMs =
        new Date(start)
            .getTime();


    const endMs =
        new Date(end)
            .getTime();


    if (
        Number.isNaN(startMs) ||
        Number.isNaN(endMs) ||
        endMs < startMs
    ) {

        return null;
    }


    return endMs -
        startMs;
};


// ============================================================
// BADGES
// ============================================================

const ActiveBadge = ({
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


const ResultBadge = ({
    status
}) => {

    const value =
        String(
            status || ""
        )
            .toUpperCase();


    let bg =
        "secondary";


    if (
        [
            "OK",
            "PASS",
            "SUCCESS"
        ].includes(value)
    ) {

        bg =
            "success";
    }


    if (
        [
            "NOK",
            "FAIL",
            "FAILED",
            "ERROR"
        ].includes(value)
    ) {

        bg =
            "danger";
    }


    return (

        <Badge bg={bg}>
            {value || "-"}
        </Badge>
    );
};


const PerformanceBadge = ({
    actual,
    standard
}) => {

    if (
        !hasValue(standard)
    ) {

        return (

            <Badge bg="secondary">
                No Standard
            </Badge>
        );
    }


    const within =
        Number(actual) <=
        Number(standard);


    return (

        <Badge
            bg={
                within
                    ? "success"
                    : "warning"
            }

            text={
                within
                    ? undefined
                    : "dark"
            }
        >
            {
                within
                    ? "Within Standard"
                    : "Above Standard"
            }
        </Badge>
    );
};


// ============================================================
// CSV
// ============================================================

const downloadCsv = (
    rows,
    filename
) => {

    if (
        !Array.isArray(rows) ||
        !rows.length
    ) {

        throw new Error(
            "No export data found."
        );
    }


    const headers =
        Object.keys(
            rows[0]
        );


    const escape = value => {

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


    const csv = [

        headers
            .map(escape)
            .join(","),

        ...rows.map(
            row =>
                headers
                    .map(
                        header =>
                            escape(
                                row[
                                    header
                                ]
                            )
                    )
                    .join(",")
        )

    ].join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        filename;


    document.body
        .appendChild(
            link
        );


    link.click();


    document.body
        .removeChild(
            link
        );


    URL.revokeObjectURL(
        url
    );
};


// ============================================================
// PAGE
// ============================================================

const CycleTimeTracking = () => {

    const queryClient =
        useQueryClient();


    // ========================================================
    // PAGE STATE
    // ========================================================

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


    // ========================================================
    // MODALS
    // ========================================================

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


    // ========================================================
    // FORMS
    // ========================================================

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
        filters,
        setFilters
    ] =
        useState(
            filterInitialState
        );


    const [
        appliedFilters,
        setAppliedFilters
    ] =
        useState(
            filterInitialState
        );


    // ========================================================
    // COMPANY MASTER
    // ========================================================

    const companiesQuery =
        useQuery({

            queryKey: [
                "cycle-time",
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


    // ========================================================
    // PLANT MASTER
    // ========================================================

    const plantsQuery =
        useQuery({

            queryKey: [
                "cycle-time",
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


    // ========================================================
    // LINE MASTER
    // ========================================================

    const linesQuery =
        useQuery({

            queryKey: [
                "cycle-time",
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


    // ========================================================
    // MACHINE MASTER
    // ========================================================

    const machinesQuery =
        useQuery({

            queryKey: [
                "cycle-time",
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


    // ========================================================
    // PROCESS MASTER
    //
    // Dropdown value = process_id UUID
    // Dropdown text  = process_code - process_name
    // ========================================================

    const processesQuery =
        useQuery({

            queryKey: [
                "cycle-time",
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


    // ========================================================
    // MACHINE SIGNAL MAPPING
    //
    // Uses existing:
    //
    // src/services/signal.service.js
    //
    // signalService.getMaster()
    //
    // Dropdown value = signal_mapping_id
    // Dropdown text  = signal_code - raw_address
    // ========================================================

    const signalsQuery =
        useQuery({

            queryKey: [
                "cycle-time",
                "signals"
            ],

            queryFn:
                async () => {

                    const response =
                        await signalService
                            .getMaster();


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


    // ========================================================
    // PRODUCTION PLAN
    // ========================================================

    const productionPlansQuery =
        useQuery({

            queryKey: [
                "cycle-time",
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


    // ========================================================
    // CYCLE CONFIG
    // ========================================================

    const configQuery =
        useQuery({

            queryKey: [
                "cycle-time",
                "master"
            ],

            queryFn:
                () =>
                    getCycleTimeMaster()
        });


    const configRows =
        cycleTimeTrackingService
            .getConfigRows(
                configQuery.data
            );


    // ========================================================
    // LOOKUP DATA
    // ========================================================

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


    // ========================================================
    // LOOKUP MAPS
    // ========================================================

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


    // ========================================================
    // CASCADING PLANT
    // ========================================================

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


    // ========================================================
    // CASCADING LINE
    // ========================================================

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


    // ========================================================
    // CASCADING MACHINE
    // ========================================================

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


    // ========================================================
    // PROCESS DROPDOWN
    //
    // Process is company scoped.
    //
    // Existing selected process remains visible during update.
    // ========================================================

    const configProcesses =
        useMemo(
            () =>
                processes.filter(
                    item => {

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


                        const status =
                            String(
                                item?.status ||
                                ""
                            )
                                .toUpperCase();


                        if (
                            status &&
                            status !== "ACTIVE" &&
                            !sameId(
                                processId(item),
                                configForm.process_id
                            )
                        ) {

                            return false;
                        }


                        return true;
                    }
                ),
            [
                processes,
                configForm.company_id,
                configForm.process_id
            ]
        );


    // ========================================================
    // SIGNAL DROPDOWN
    //
    // IMPORTANT:
    //
    // Only show signals belonging to selected:
    //
    // Company
    // Plant
    // Line
    // Machine
    //
    // UI displays signal_code.
    // DB still receives signal_mapping_id UUID.
    // ========================================================

    const configSignals =
        useMemo(
            () =>
                signals.filter(
                    item => {

                        const selectedSignal =
                            sameId(
                                signalId(item),
                                configForm.start_signal_id
                            ) ||
                            sameId(
                                signalId(item),
                                configForm.end_signal_id
                            ) ||
                            sameId(
                                signalId(item),
                                configForm.result_signal_id
                            );


                        if (
                            hasValue(
                                item?.is_active
                            ) &&
                            !boolValue(
                                item.is_active
                            ) &&
                            !selectedSignal
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
                configForm.machine_id,
                configForm.start_signal_id,
                configForm.end_signal_id,
                configForm.result_signal_id
            ]
        );


    // ========================================================
    // SELECTED EXECUTE CONFIG
    // ========================================================

    const selectedConfig =
        useMemo(
            () =>
                configRows.find(
                    row =>
                        sameId(
                            row.cycle_time_config_id,
                            executeForm.cycle_time_config_id
                        )
                ) ||
                null,
            [
                configRows,
                executeForm.cycle_time_config_id
            ]
        );


    // ========================================================
    // AVAILABLE PLANS
    // ========================================================

    const availablePlans =
        useMemo(
            () =>
                productionPlans.filter(
                    plan => {

                        if (
                            !selectedConfig
                        ) {

                            return true;
                        }


                        const rowCompany =
                            companyId(
                                plan
                            );


                        return (
                            !rowCompany ||
                            sameId(
                                rowCompany,
                                selectedConfig.company_id
                            )
                        );
                    }
                ),
            [
                productionPlans,
                selectedConfig
            ]
        );


    // ========================================================
    // PLAN ENTRY QUERY
    // ========================================================

    const planEntriesQuery =
        useQuery({

            queryKey: [
                "cycle-time",
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


    // ========================================================
    // MATCH PLAN ENTRY TO CONFIG
    // ========================================================

    const matchingPlanEntries =
        useMemo(
            () => {

                if (
                    !selectedConfig
                ) {

                    return [];
                }


                return allPlanEntries.filter(
                    entry =>
                        sameId(
                            entry.machine_id,
                            selectedConfig.machine_id
                        ) &&
                        sameId(
                            entry.process_id,
                            selectedConfig.process_id
                        )
                );
            },
            [
                allPlanEntries,
                selectedConfig
            ]
        );


    // ========================================================
    // SELECTED PLAN ENTRY
    // ========================================================

    const selectedPlanEntry =
        useMemo(
            () =>
                matchingPlanEntries.find(
                    entry =>
                        sameId(
                            planEntryId(
                                entry
                            ),
                            executeForm.plan_entry_id
                        )
                ) ||
                null,
            [
                matchingPlanEntries,
                executeForm.plan_entry_id
            ]
        );


    // ========================================================
    // SEARCH CONFIG
    // ========================================================

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


                        const startSignal =
                            signalMap.get(
                                String(
                                    row.start_signal_id
                                )
                            );


                        const endSignal =
                            signalMap.get(
                                String(
                                    row.end_signal_id
                                )
                            );


                        const resultSignal =
                            signalMap.get(
                                String(
                                    row.result_signal_id
                                )
                            );


                        const text = [

                            machine
                                ? machineLabel(
                                    machine
                                )
                                : row.machine_id,

                            process
                                ? processLabel(
                                    process
                                )
                                : row.process_id,

                            startSignal
                                ? signalLabel(
                                    startSignal
                                )
                                : "",

                            endSignal
                                ? signalLabel(
                                    endSignal
                                )
                                : "",

                            resultSignal
                                ? signalLabel(
                                    resultSignal
                                )
                                : "",

                            row.cycle_mode,

                            row.standard_cycle_ms,

                            row.version_no

                        ]
                            .join(" ")
                            .toLowerCase();


                        return text.includes(
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


    // ========================================================
    // SUMMARY
    // ========================================================

    const activeConfigCount =
        configRows.filter(
            row =>
                boolValue(
                    row.is_active
                )
        ).length;


    const startEndCount =
        configRows.filter(
            row =>
                String(
                    row.cycle_mode ||
                    ""
                )
                    .toUpperCase() ===
                "START_END"
        ).length;


    const manualApiCount =
        configRows.filter(
            row =>
                [
                    "MANUAL",
                    "API"
                ].includes(
                    String(
                        row.cycle_mode ||
                        ""
                    )
                        .toUpperCase()
                )
        ).length;


    // ========================================================
    // RUNTIME QUERY
    // ========================================================

    const runtimeQuery =
        useQuery({

            queryKey: [
                "cycle-time",
                "runtime",
                appliedFilters
            ],

            queryFn:
                () =>
                    getCycleTimeRuntime(
                        appliedFilters
                    ),

            enabled:
                activeView ===
                VIEW_RUNTIME
        });


    const runtimeRows =
        cycleTimeTrackingService
            .getEventRows(
                runtimeQuery.data
            );


    // ========================================================
    // REPORT QUERY
    // ========================================================

    const reportQuery =
        useQuery({

            queryKey: [
                "cycle-time",
                "report",
                appliedFilters
            ],

            queryFn:
                () =>
                    getCycleTimeReport(
                        appliedFilters
                    ),

            enabled:
                activeView ===
                VIEW_REPORT
        });


    const reportRows =
        cycleTimeTrackingService
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


    // ========================================================
    // REFRESH MODULE
    // ========================================================

    const refreshModule =
        async () => {

            await Promise.all([

                queryClient.invalidateQueries({
                    queryKey: [
                        "cycle-time",
                        "master"
                    ]
                }),

                queryClient.invalidateQueries({
                    queryKey: [
                        "cycle-time",
                        "runtime"
                    ]
                }),

                queryClient.invalidateQueries({
                    queryKey: [
                        "cycle-time",
                        "report"
                    ]
                })
            ]);
        };


    // ========================================================
    // CONFIG MUTATION
    // ========================================================

    const configMutation =
        useMutation({

            mutationFn:
                async payload => {

                    if (
                        payload.cycle_time_config_id
                    ) {

                        const {
                            cycle_time_config_id,
                            ...body
                        } =
                            payload;


                        return updateCycleTimeConfig(
                            cycle_time_config_id,
                            body
                        );
                    }


                    return createCycleTimeConfig(
                        payload
                    );
                },


            onSuccess:
                async () => {

                    setErrorMessage("");


                    setMessage(
                        configForm.cycle_time_config_id
                            ? "Cycle Time configuration updated successfully."
                            : "Cycle Time configuration created successfully."
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
                            "Unable to save Cycle Time configuration."
                        )
                    );
                }
        });


    // ========================================================
    // EXECUTE MUTATION
    // ========================================================

    const executeMutation =
        useMutation({

            mutationFn:
                payload =>
                    executeCycleTime(
                        payload
                    ),


            onSuccess:
                async result => {

                    setErrorMessage("");


                    setMessage(
                        result?.idempotent
                            ? "This Cycle Time event was already processed."
                            : "Cycle Time event recorded successfully."
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
                            "Unable to record Cycle Time event."
                        )
                    );
                }
        });


    // ========================================================
    // OPEN CREATE
    // ========================================================

    const openCreateConfig =
        () => {

            setConfigForm({

                ...configInitialState,

                company_id:
                    companies.length ===
                    1
                        ? companyId(
                            companies[0]
                        )
                        : ""
            });


            setShowConfigModal(
                true
            );
        };


    // ========================================================
    // OPEN EDIT
    //
    // IDs remain as values.
    //
    // Because Process and Signal inputs are now Form.Select,
    // React automatically displays their code/name label.
    // ========================================================

    const openEditConfig =
        row => {

            setConfigForm({

                cycle_time_config_id:
                    row.cycle_time_config_id,

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

                start_signal_id:
                    row.start_signal_id ||
                    "",

                end_signal_id:
                    row.end_signal_id ||
                    "",

                result_signal_id:
                    row.result_signal_id ||
                    "",

                cycle_mode:
                    row.cycle_mode ||
                    "MANUAL",

                standard_cycle_ms:
                    row.standard_cycle_ms ??
                    45000,

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


    // ========================================================
    // SUBMIT CONFIG
    // ========================================================

    const submitConfig =
        event => {

            event.preventDefault();


            const mode =
                String(
                    configForm.cycle_mode ||
                    ""
                )
                    .trim()
                    .toUpperCase();


            if (
                configForm.is_active &&
                mode ===
                "START_END"
            ) {

                if (
                    !configForm.start_signal_id
                ) {

                    setErrorMessage(
                        "Start Signal is required for START_END mode."
                    );


                    return;
                }


                if (
                    !configForm.end_signal_id
                ) {

                    setErrorMessage(
                        "End Signal is required for START_END mode."
                    );


                    return;
                }
            }


            setErrorMessage("");


            configMutation.mutate({

                ...configForm,

                cycle_mode:
                    mode,

                standard_cycle_ms:
                    Number(
                        configForm.standard_cycle_ms
                    ),

                version_no:
                    Number(
                        configForm.version_no
                    ),

                is_active:
                    Boolean(
                        configForm.is_active
                    ),

                start_signal_id:
                    configForm.start_signal_id ||
                    null,

                end_signal_id:
                    configForm.end_signal_id ||
                    null,

                result_signal_id:
                    configForm.result_signal_id ||
                    null,

                effective_from:
                    configForm.effective_from ||
                    null,

                effective_to:
                    configForm.effective_to ||
                    null
            });
        };


    // ========================================================
    // DEACTIVATE
    // ========================================================

    const deactivateConfig =
        async row => {

            const confirmed =
                window.confirm(
                    "Deactivate this Cycle Time configuration?"
                );


            if (!confirmed) {

                return;
            }


            try {

                setMessage("");

                setErrorMessage("");


                await softDeleteCycleTimeConfig(
                    row.cycle_time_config_id
                );


                setMessage(
                    "Cycle Time configuration deactivated successfully."
                );


                await refreshModule();

            }
            catch (error) {

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Unable to deactivate Cycle Time configuration."
                    )
                );
            }
        };


    // ========================================================
    // OPEN EXECUTE
    // ========================================================

    const openExecute =
        () => {

            const first =
                configRows.find(
                    row =>
                        boolValue(
                            row.is_active
                        )
                );


            setExecuteForm({

                ...executeInitialState,

                cycle_time_config_id:
                    first
                        ?.cycle_time_config_id ||
                    ""
            });


            setShowExecuteModal(
                true
            );
        };


    // ========================================================
    // SUBMIT EXECUTE
    // ========================================================

    const submitExecute =
        event => {

            event.preventDefault();


            if (
                !selectedConfig
            ) {

                setErrorMessage(
                    "Cycle Time configuration is required."
                );


                return;
            }


            if (
                !selectedPlanEntry
            ) {

                setErrorMessage(
                    "Matching Plan Entry is required."
                );


                return;
            }


            const actualCycle =
                calculateLocalCycle(
                    executeForm.start_ts,
                    executeForm.end_ts
                );


            if (
                actualCycle ===
                null
            ) {

                setErrorMessage(
                    "End Time must be greater than or equal to Start Time."
                );


                return;
            }


            const idempotencyKey =
                executeForm.idempotency_key
                    .trim() ||
                `CT-${
                    selectedPlanEntry
                        .plan_entry_id
                }-${Date.now()}`;


            if (
                !executeForm.idempotency_key
            ) {

                setExecuteForm(
                    old => ({
                        ...old,

                        idempotency_key:
                            idempotencyKey
                    })
                );
            }


            setErrorMessage("");


            executeMutation.mutate({

                cycle_time_config_id:
                    selectedConfig
                        .cycle_time_config_id,

                company_id:
                    selectedConfig
                        .company_id,

                plant_id:
                    selectedConfig
                        .plant_id,

                line_id:
                    selectedConfig
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

                start_ts:
                    executeForm.start_ts,

                end_ts:
                    executeForm.end_ts,

                result_status:
                    executeForm.result_status,

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


    // ========================================================
    // EXPORT
    // ========================================================

    const handleExport =
        async () => {

            try {

                const result =
                    await exportCycleTimeReport(
                        appliedFilters
                    );


                const rows =
                    cycleTimeTrackingService
                        .getEventRows(
                            result.data
                        );


                downloadCsv(
                    rows,
                    `cycle-time-report-${Date.now()}.csv`
                );


                setMessage(
                    "Cycle Time report exported successfully."
                );

            }
            catch (error) {

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Unable to export Cycle Time report."
                    )
                );
            }
        };


    // ========================================================
    // REFRESH
    // ========================================================

    const handleRefresh =
        async () => {

            setMessage("");

            setErrorMessage("");


            try {

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
                    "Cycle Time data refreshed successfully."
                );

            }
            catch (error) {

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Unable to refresh Cycle Time data."
                    )
                );
            }
        };


    // ========================================================
    // PREVIEW
    // ========================================================

    const previewCycleMs =
        calculateLocalCycle(
            executeForm.start_ts,
            executeForm.end_ts
        );


    const previewStandard =
        selectedConfig
            ? Number(
                selectedConfig
                    .standard_cycle_ms
            )
            : null;


    const previewDeviation =
        previewCycleMs !==
            null &&
        previewStandard !==
            null
            ? previewCycleMs -
                previewStandard
            : null;


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <>


<div className="ct-page">

            <style>{`

                .ct-page {
                    min-height: 100vh;
                    padding: 22px;
                    background: #f4f6fb;
                }

                .ct-card {
                    background: #ffffff;
                    border: 1px solid #e5e9f2;
                    border-radius: 12px;
                    box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
                }

                .ct-title {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                    color: #1f2d3d;
                }

                .ct-subtitle {
                    margin-top: 4px;
                    color: #748094;
                    font-size: 13px;
                }

                .ct-btn-primary {
                    background: #314965 !important;
                    border-color: #314965 !important;
                    color: white !important;
                    font-weight: 600;
                }

                .ct-btn-primary:hover {
                    background: #25364e !important;
                    border-color: #25364e !important;
                }

                .ct-btn-outline {
                    background: white !important;
                    border: 1px solid #314965 !important;
                    color: #314965 !important;
                    font-weight: 600;
                }

                .ct-btn-outline:hover {
                    background: #314965 !important;
                    color: white !important;
                }

                .ct-tabs {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .ct-tab {
                    border: 1px solid #d9dce5;
                    background: white;
                    color: #566176;
                    font-weight: 600;
                    padding: 8px 15px;
                    border-radius: 7px;
                }

                .ct-tab.active {
                    background: #f1f4f8;
                    border-color: #314965;
                    color: #314965;
                }

                .ct-stat {
                    height: 100%;
                    padding: 14px;
                    border: 1px solid #e5e9f2;
                    border-radius: 10px;
                    background: white;
                }

                .ct-stat-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 9px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: #f1f4f8;
                    color: #314965;
                    font-size: 18px;
                }

                .ct-stat-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #263449;
                }

                .ct-stat-label {
                    color: #758195;
                    font-size: 12px;
                }

                .ct-table-wrap {
                    overflow: auto;
                    border: 1px solid #e4e7ee;
                    border-radius: 9px;
                }

                .ct-table {
                    margin: 0;
                    white-space: nowrap;
                }

                .ct-table thead th {
                    background: #1c2d45;
                    color: white;
                    border-color: #1c2d45;
                    padding: 12px;
                    font-size: 12px;
                }

                .ct-table tbody td {
                    vertical-align: middle;
                    padding: 11px 12px;
                    color: #364152;
                    font-size: 13px;
                }

                .ct-empty {
                    padding: 30px !important;
                    color: #8a94a6 !important;
                    text-align: center;
                }

                .ct-search {
                    position: relative;
                    width: 350px;
                    max-width: 100%;
                }

                .ct-search svg {
                    position: absolute;
                    top: 50%;
                    left: 11px;
                    transform: translateY(-50%);
                    color: #8792a5;
                }

                .ct-search input {
                    padding-left: 35px;
                }

                .ct-label {
                    color: #354154;
                    font-size: 12px;
                    font-weight: 700;
                    margin-bottom: 5px;
                }

                .ct-required {
                    color: #dc3545;
                }

                .ct-modal .modal-content {
                    border: none;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .ct-modal .modal-header {
                    background: #1c2d45;
                    color: white;
                    border: none;
                }

                .ct-modal .btn-close {
                    filter: invert(1);
                }

                .ct-context {
                    padding: 13px;
                    border: 1px solid #f1cebc;
                    border-radius: 9px;
                    background: #f6f8fa;
                }

                .ct-context-value {
                    margin-top: 2px;
                    font-weight: 600;
                    color: #263449;
                }

                .ct-filter {
                    padding: 15px;
                    background: #f9fafc;
                    border: 1px solid #e5e9f2;
                    border-radius: 9px;
                    margin-bottom: 15px;
                }

                .ct-signal-option-note {
                    font-size: 11px;
                    color: #7b8798;
                }

                @media (max-width: 768px) {

                    .ct-page {
                        padding: 12px;
                    }

                    .ct-search {
                        width: 100%;
                    }
                }

            `}</style>


            {/* =================================================
                HEADER
            ================================================== */}

            <Card className="ct-card mb-3">

                <Card.Body>

                    <Row className="align-items-center g-3">

                        <Col lg={7}>

                            <h4 className="ct-title">
                                Cycle Time Tracking
                            </h4>

                            <div className="ct-subtitle">
                                Measure actual production cycle duration
                                against the standard cycle configured for
                                each machine and process.
                            </div>

                        </Col>


                        <Col lg={5}>

                            <div className="d-flex justify-content-lg-end flex-wrap gap-2">

                                <Button
                                    className="ct-btn-outline"
                                    onClick={
                                        handleRefresh
                                    }
                                >
                                    <ArrowClockwise className="me-1" />

                                    Refresh
                                </Button>


                                <Button
                                    className="ct-btn-outline"
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
                                    className="ct-btn-primary"
                                    onClick={
                                        openExecute
                                    }
                                >
                                    <PlayFill className="me-1" />

                                    Record Cycle
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
                SUMMARY
            ================================================== */}

            <Row className="g-3 mb-3">

                <Col md={3}>

                    <div className="ct-stat">

                        <div className="d-flex gap-3 align-items-center">

                            <div className="ct-stat-icon">
                                <Stopwatch />
                            </div>

                            <div>

                                <div className="ct-stat-value">
                                    {
                                        configRows.length
                                    }
                                </div>

                                <div className="ct-stat-label">
                                    Total Configurations
                                </div>

                            </div>

                        </div>

                    </div>

                </Col>


                <Col md={3}>

                    <div className="ct-stat">

                        <div className="d-flex gap-3 align-items-center">

                            <div className="ct-stat-icon">
                                <CheckCircleFill />
                            </div>

                            <div>

                                <div className="ct-stat-value">
                                    {
                                        activeConfigCount
                                    }
                                </div>

                                <div className="ct-stat-label">
                                    Active Configurations
                                </div>

                            </div>

                        </div>

                    </div>

                </Col>


                <Col md={3}>

                    <div className="ct-stat">

                        <div className="d-flex gap-3 align-items-center">

                            <div className="ct-stat-icon">
                                <Speedometer2 />
                            </div>

                            <div>

                                <div className="ct-stat-value">
                                    {
                                        startEndCount
                                    }
                                </div>

                                <div className="ct-stat-label">
                                    PLC Start / End
                                </div>

                            </div>

                        </div>

                    </div>

                </Col>


                <Col md={3}>

                    <div className="ct-stat">

                        <div className="d-flex gap-3 align-items-center">

                            <div className="ct-stat-icon">
                                <ClockHistory />
                            </div>

                            <div>

                                <div className="ct-stat-value">
                                    {
                                        manualApiCount
                                    }
                                </div>

                                <div className="ct-stat-label">
                                    Manual / API
                                </div>

                            </div>

                        </div>

                    </div>

                </Col>

            </Row>


            {/* =================================================
                MAIN CARD
            ================================================== */}

            <Card className="ct-card">

                <Card.Body>

                    {/* TABS */}

                    <div className="ct-tabs mb-3">

                        <button
                            type="button"
                            className={
                                `ct-tab ${
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
                                `ct-tab ${
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
                                `ct-tab ${
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


                    {/* =================================================
                        CONFIGURATION
                    ================================================== */}

                    {
                        activeView ===
                        VIEW_CONFIG && (

                            <>

                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">

                                    <div className="ct-search">

                                        <Search />

                                        <Form.Control
                                            placeholder="Search machine, process, signal code, mode..."
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
                                        className="ct-btn-primary"
                                        onClick={
                                            openCreateConfig
                                        }
                                    >
                                        <Plus className="me-1" />

                                        Add Cycle Configuration
                                    </Button>

                                </div>


                                <div className="ct-table-wrap">

                                    <Table
                                        className="ct-table"
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
                                                    Mode
                                                </th>

                                                <th>
                                                    Standard Cycle
                                                </th>

                                                <th>
                                                    Start Signal
                                                </th>

                                                <th>
                                                    End Signal
                                                </th>

                                                <th>
                                                    Result Signal
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
                                                                className="ct-empty"
                                                            >
                                                                <Spinner
                                                                    size="sm"
                                                                    animation="border"
                                                                    className="me-2"
                                                                />

                                                                Loading Cycle Time configurations...
                                                            </td>

                                                        </tr>
                                                    )
                                                    : searchedConfigs.length ===
                                                        0
                                                        ? (

                                                            <tr>

                                                                <td
                                                                    colSpan={12}
                                                                    className="ct-empty"
                                                                >
                                                                    No Cycle Time configuration found.
                                                                </td>

                                                            </tr>
                                                        )
                                                        : searchedConfigs.map(
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


                                                                const startSignal =
                                                                    signalMap.get(
                                                                        String(
                                                                            row.start_signal_id
                                                                        )
                                                                    );


                                                                const endSignal =
                                                                    signalMap.get(
                                                                        String(
                                                                            row.end_signal_id
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
                                                                            row.cycle_time_config_id
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


                                                                        <td
                                                                            title={
                                                                                row.process_id ||
                                                                                ""
                                                                            }
                                                                        >

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
                                                                                    row.cycle_mode
                                                                                )
                                                                            }
                                                                        </td>


                                                                        <td>

                                                                            <strong>
                                                                                {
                                                                                    formatMs(
                                                                                        row.standard_cycle_ms
                                                                                    )
                                                                                }
                                                                            </strong>

                                                                        </td>


                                                                        <td
                                                                            title={
                                                                                row.start_signal_id ||
                                                                                ""
                                                                            }
                                                                        >

                                                                            {
                                                                                startSignal
                                                                                    ? signalLabel(
                                                                                        startSignal
                                                                                    )
                                                                                    : "-"
                                                                            }

                                                                        </td>


                                                                        <td
                                                                            title={
                                                                                row.end_signal_id ||
                                                                                ""
                                                                            }
                                                                        >

                                                                            {
                                                                                endSignal
                                                                                    ? signalLabel(
                                                                                        endSignal
                                                                                    )
                                                                                    : "-"
                                                                            }

                                                                        </td>


                                                                        <td
                                                                            title={
                                                                                row.result_signal_id ||
                                                                                ""
                                                                            }
                                                                        >

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
                                                                                    size="sm"
                                                                                    className="ct-btn-outline"
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
                                                                                            size="sm"
                                                                                            variant="outline-danger"
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
                                            }

                                        </tbody>

                                    </Table>

                                </div>

                            </>
                        )
                    }


                    {/* =================================================
                        RUNTIME
                    ================================================== */}

                    {
                        activeView ===
                        VIEW_RUNTIME && (

                            <>

                                <CycleFilterPanel
                                    filters={
                                        filters
                                    }

                                    setFilters={
                                        setFilters
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
                                        setAppliedFilters({
                                            ...filters
                                        })
                                    }

                                    onClear={() => {

                                        setFilters(
                                            filterInitialState
                                        );

                                        setAppliedFilters(
                                            filterInitialState
                                        );
                                    }}
                                />


                                <CycleRun records={runtimeRows} machineMap={machineMap} processMap={processMap}/>
<CycleEventTable
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


                    {/* =================================================
                        REPORT
                    ================================================== */}

                    {
                        activeView ===
                        VIEW_REPORT && (

                            <>

                                <CycleFilterPanel
                                    filters={
                                        filters
                                    }

                                    setFilters={
                                        setFilters
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
                                        setAppliedFilters({
                                            ...filters
                                        })
                                    }

                                    onClear={() => {

                                        setFilters(
                                            filterInitialState
                                        );

                                        setAppliedFilters(
                                            filterInitialState
                                        );
                                    }}
                                />


                                <Row className="g-3 mb-3">

                                    <Col md={3}>

                                        <div className="ct-stat">

                                            <div className="ct-stat-label">
                                                Total Cycles
                                            </div>

                                            <div className="ct-stat-value">
                                                {
                                                    Number(
                                                        reportMeta.total_cycles ||
                                                        0
                                                    )
                                                }
                                            </div>

                                        </div>

                                    </Col>


                                    <Col md={3}>

                                        <div className="ct-stat">

                                            <div className="ct-stat-label">
                                                Average Cycle
                                            </div>

                                            <div className="ct-stat-value">
                                                {
                                                    formatMs(
                                                        reportMeta.average_cycle_ms ||
                                                        0
                                                    )
                                                }
                                            </div>

                                        </div>

                                    </Col>


                                    <Col md={3}>

                                        <div className="ct-stat">

                                            <div className="ct-stat-label">
                                                Minimum Cycle
                                            </div>

                                            <div className="ct-stat-value">
                                                {
                                                    formatMs(
                                                        reportMeta.minimum_cycle_ms ||
                                                        0
                                                    )
                                                }
                                            </div>

                                        </div>

                                    </Col>


                                    <Col md={3}>

                                        <div className="ct-stat">

                                            <div className="ct-stat-label">
                                                Maximum Cycle
                                            </div>

                                            <div className="ct-stat-value">
                                                {
                                                    formatMs(
                                                        reportMeta.maximum_cycle_ms ||
                                                        0
                                                    )
                                                }
                                            </div>

                                        </div>

                                    </Col>


                                    <Col md={4}>

                                        <div className="ct-stat">

                                            <div className="ct-stat-label">
                                                Within Standard
                                            </div>

                                            <div className="ct-stat-value text-success">
                                                {
                                                    Number(
                                                        reportMeta.within_standard_count ||
                                                        0
                                                    )
                                                }
                                            </div>

                                        </div>

                                    </Col>


                                    <Col md={4}>

                                        <div className="ct-stat">

                                            <div className="ct-stat-label">
                                                Above Standard
                                            </div>

                                            <div className="ct-stat-value text-warning">
                                                {
                                                    Number(
                                                        reportMeta.above_standard_count ||
                                                        0
                                                    )
                                                }
                                            </div>

                                        </div>

                                    </Col>


                                    <Col md={4}>

                                        <div className="ct-stat">

                                            <div className="ct-stat-label">
                                                Within Standard %
                                            </div>

                                            <div className="ct-stat-value">

                                                {
                                                    Number(
                                                        reportMeta.within_standard_percent ||
                                                        0
                                                    ).toFixed(2)
                                                }%

                                            </div>

                                        </div>

                                    </Col>

                                </Row>


                                <div className="d-flex justify-content-end mb-3">

                                    <Button
                                        className="ct-btn-outline"
                                        onClick={
                                            handleExport
                                        }
                                    >
                                        Export CSV
                                    </Button>

                                </div>


                                <ExecutionReport records={reportRows} kind="cycle" machineMap={machineMap} processMap={processMap}/><CycleEventTable
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

                className="ct-modal"
            >

                <Form
                    onSubmit={
                        submitConfig
                    }
                >

                    <Modal.Header closeButton>

                        <Modal.Title>

                            {
                                configForm.cycle_time_config_id
                                    ? "Edit Cycle Time Configuration"
                                    : "Add Cycle Time Configuration"
                            }

                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        {
                            (
                                processesQuery.isLoading ||
                                signalsQuery.isLoading
                            ) && (

                                <Alert variant="light">

                                    <Spinner
                                        size="sm"
                                        animation="border"
                                        className="me-2"
                                    />

                                    Loading Process and Signal dropdowns...

                                </Alert>
                            )
                        }


                        <Row className="g-3">

                            {/* COMPANY */}

                            <Col md={3}>

                                <Form.Label className="ct-label">

                                    Company

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        configForm.company_id
                                    }
                                    disabled={Boolean(configForm.cycle_time_config_id)}

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

                                                    start_signal_id: "",

                                                    end_signal_id: "",

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

                                <Form.Label className="ct-label">

                                    Plant

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Select
                                    required

                                    disabled={
    Boolean(configForm.cycle_time_config_id) ||
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

                                                    start_signal_id: "",

                                                    end_signal_id: "",

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

                                <Form.Label className="ct-label">

                                    Line

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Select
                                    required

                                   disabled={
    Boolean(configForm.cycle_time_config_id) ||
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

                                                    start_signal_id: "",

                                                    end_signal_id: "",

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

                                <Form.Label className="ct-label">

                                    Machine

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Select
                                    required

                                    disabled={
    Boolean(configForm.cycle_time_config_id) ||
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

                                                    start_signal_id: "",

                                                    end_signal_id: "",

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


                            {/* =================================================
                                PROCESS DROPDOWN
                            ================================================== */}

                            <Col md={6}>

                                <Form.Label className="ct-label">

                                    Process

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Select
                                    required

                                   disabled={
    Boolean(configForm.cycle_time_config_id) ||
    !configForm.company_id ||
    processesQuery.isLoading
}

                                    value={
                                        configForm.process_id
                                    }

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

                                        {
                                            processesQuery.isLoading
                                                ? "Loading Processes..."
                                                : "Select Process"
                                        }

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


                                <Form.Text>

                                    UUID is stored internally.
                                    UI shows Process Code and Process Name.

                                </Form.Text>

                            </Col>


                            {/* MODE */}

                            <Col md={3}>

                                <Form.Label className="ct-label">

                                    Cycle Mode

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        configForm.cycle_mode
                                    }

                                    onChange={
                                        event =>
                                            setConfigForm(
                                                old => ({
                                                    ...old,

                                                    cycle_mode:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="MANUAL">
                                        MANUAL
                                    </option>

                                    <option value="API">
                                        API
                                    </option>

                                    <option value="START_END">
                                        START_END
                                    </option>

                                </Form.Select>

                            </Col>


                            {/* STANDARD */}

                            <Col md={3}>

                                <Form.Label className="ct-label">

                                    Standard Cycle ms

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Control
                                    required

                                    type="number"

                                    min="1"

                                    step="1"

                                    value={
                                        configForm.standard_cycle_ms
                                    }

                                    onChange={
                                        event =>
                                            setConfigForm(
                                                old => ({
                                                    ...old,

                                                    standard_cycle_ms:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />


                                <Form.Text>
                                    {
                                        formatMs(
                                            configForm.standard_cycle_ms
                                        )
                                    }
                                </Form.Text>

                            </Col>


                            {/* =================================================
                                START SIGNAL DROPDOWN
                            ================================================== */}

                            <Col md={4}>

                                <Form.Label className="ct-label">

                                    Start Signal

                                    {
                                        String(
                                            configForm.cycle_mode
                                        )
                                            .toUpperCase() ===
                                        "START_END" && (

                                            <span className="ct-required">
                                                {" "}*
                                            </span>
                                        )
                                    }

                                </Form.Label>


                                <Form.Select
                                    required={
                                        String(
                                            configForm.cycle_mode
                                        )
                                            .toUpperCase() ===
                                        "START_END"
                                    }

                                   disabled={
    Boolean(configForm.cycle_time_config_id) ||
    !configForm.machine_id ||
    signalsQuery.isLoading
}

                                    value={
                                        configForm.start_signal_id
                                    }

                                    onChange={
                                        event =>
                                            setConfigForm(
                                                old => ({
                                                    ...old,

                                                    start_signal_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">

                                        {
                                            signalsQuery.isLoading
                                                ? "Loading Signals..."
                                                : "Select Start Signal"
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


                                <Form.Text>

                                    Stored value:
                                    signal_mapping_id.
                                    Display:
                                    signal_code.

                                </Form.Text>

                            </Col>


                            {/* =================================================
                                END SIGNAL DROPDOWN
                            ================================================== */}

                            <Col md={4}>

                                <Form.Label className="ct-label">

                                    End Signal

                                    {
                                        String(
                                            configForm.cycle_mode
                                        )
                                            .toUpperCase() ===
                                        "START_END" && (

                                            <span className="ct-required">
                                                {" "}*
                                            </span>
                                        )
                                    }

                                </Form.Label>


                                <Form.Select
                                    required={
                                        String(
                                            configForm.cycle_mode
                                        )
                                            .toUpperCase() ===
                                        "START_END"
                                    }

                                    disabled={
    Boolean(configForm.cycle_time_config_id) ||
    !configForm.machine_id ||
    signalsQuery.isLoading
}

                                    value={
                                        configForm.end_signal_id
                                    }

                                    onChange={
                                        event =>
                                            setConfigForm(
                                                old => ({
                                                    ...old,

                                                    end_signal_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">

                                        {
                                            signalsQuery.isLoading
                                                ? "Loading Signals..."
                                                : "Select End Signal"
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


                                <Form.Text>

                                    Example:
                                    CYCLE_COMPLETE - D100

                                </Form.Text>

                            </Col>


                            {/* =================================================
                                RESULT SIGNAL DROPDOWN
                            ================================================== */}

                            <Col md={4}>

                                <Form.Label className="ct-label">
                                    Result Signal
                                </Form.Label>


                                <Form.Select
                                    disabled={
    Boolean(configForm.cycle_time_config_id) ||
    !configForm.machine_id ||
    signalsQuery.isLoading
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

                                        {
                                            signalsQuery.isLoading
                                                ? "Loading Signals..."
                                                : "No Result Signal"
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


                            {/* VERSION */}

                            <Col md={3}>

                                <Form.Label className="ct-label">
                                    Version
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

                                <Form.Label className="ct-label">
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

                                <Form.Label className="ct-label">
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

                            <Col md={3}>

                                <div className="pt-4">

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

                            className="ct-btn-primary"

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

                className="ct-modal"
            >

                <Form
                    onSubmit={
                        submitExecute
                    }
                >

                    <Modal.Header closeButton>

                        <Modal.Title>
                            Record Completed Cycle
                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Alert variant="light">

                            Enter the actual cycle Start and End time.
                            The backend calculates cycle_time_ms and
                            snapshots the configured standard cycle.

                        </Alert>


                        <Row className="g-3">

                            {/* CONFIG */}

                            <Col md={6}>

                                <Form.Label className="ct-label">

                                    Cycle Time Configuration

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        executeForm.cycle_time_config_id
                                    }

                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,

                                                    cycle_time_config_id:
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
                                                                row.cycle_time_config_id
                                                            }

                                                            value={
                                                                row.cycle_time_config_id
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
                                                                    : row.process_id
                                                            }

                                                            {" | "}

                                                            {
                                                                row.cycle_mode
                                                            }

                                                            {" | "}

                                                            {
                                                                formatMs(
                                                                    row.standard_cycle_ms
                                                                )
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

                                <Form.Label className="ct-label">

                                    Production Plan

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Select
                                    required

                                    disabled={
                                        !selectedConfig
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
                                        availablePlans.map(
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

                                <Form.Label className="ct-label">

                                    Matching Plan Entry

                                    <span className="ct-required">
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
                                                : matchingPlanEntries.length ===
                                                    0 &&
                                                    executeForm.production_plan_id
                                                    ? "No Plan Entry matches this Machine + Process"
                                                    : "Select Plan Entry"
                                        }

                                    </option>


                                    {
                                        matchingPlanEntries.map(
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


                            {/* CONFIG CONTEXT */}

                            {
                                selectedConfig && (

                                    <Col md={12}>

                                        <div className="ct-context">

                                            <Row className="g-3">

                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Machine
                                                    </small>

                                                    <div className="ct-context-value">

                                                        {
                                                            machineMap.get(
                                                                String(
                                                                    selectedConfig.machine_id
                                                                )
                                                            )
                                                                ? machineLabel(
                                                                    machineMap.get(
                                                                        String(
                                                                            selectedConfig.machine_id
                                                                        )
                                                                    )
                                                                )
                                                                : selectedConfig.machine_id
                                                        }

                                                    </div>

                                                </Col>


                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Process
                                                    </small>

                                                    <div className="ct-context-value">

                                                        {
                                                            processMap.get(
                                                                String(
                                                                    selectedConfig.process_id
                                                                )
                                                            )
                                                                ? processLabel(
                                                                    processMap.get(
                                                                        String(
                                                                            selectedConfig.process_id
                                                                        )
                                                                    )
                                                                )
                                                                : selectedConfig.process_id
                                                        }

                                                    </div>

                                                </Col>


                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Cycle Mode
                                                    </small>

                                                    <div className="ct-context-value">
                                                        {
                                                            selectedConfig.cycle_mode
                                                        }
                                                    </div>

                                                </Col>


                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Standard Cycle
                                                    </small>

                                                    <div className="ct-context-value">
                                                        {
                                                            formatMs(
                                                                selectedConfig.standard_cycle_ms
                                                            )
                                                        }
                                                    </div>

                                                </Col>

                                            </Row>

                                        </div>

                                    </Col>
                                )
                            }


                            {/* PLAN CONTEXT */}

                            {
                                selectedPlanEntry && (

                                    <Col md={12}>

                                        <div className="ct-context">

                                            <Row className="g-3">

                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Shift
                                                    </small>

                                                    <div className="ct-context-value">
                                                        {
                                                            selectedPlanEntry.shift_id
                                                        }
                                                    </div>

                                                </Col>


                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Target Qty
                                                    </small>

                                                    <div className="ct-context-value">
                                                        {
                                                            selectedPlanEntry.target_qty
                                                        }
                                                    </div>

                                                </Col>


                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Part ID
                                                    </small>

                                                    <div className="ct-context-value text-break">
                                                        {
                                                            selectedPlanEntry.part_id
                                                        }
                                                    </div>

                                                </Col>


                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Sequence
                                                    </small>

                                                    <div className="ct-context-value">
                                                        {
                                                            selectedPlanEntry.sequence_no
                                                        }
                                                    </div>

                                                </Col>

                                            </Row>

                                        </div>

                                    </Col>
                                )
                            }


                            {/* START TIME */}

                            <Col md={6}>

                                <Form.Label className="ct-label">

                                    Start Time

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Control
                                    required

                                    type="datetime-local"

                                    step="0.001"

                                    value={
                                        executeForm.start_ts
                                    }

                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,

                                                    start_ts:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            {/* END TIME */}

                            <Col md={6}>

                                <Form.Label className="ct-label">

                                    End Time

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Control
                                    required

                                    type="datetime-local"

                                    step="0.001"

                                    value={
                                        executeForm.end_ts
                                    }

                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,

                                                    end_ts:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            {/* PREVIEW */}

                            {
                                previewCycleMs !==
                                null && (

                                    <Col md={12}>

                                        <div className="ct-context">

                                            <Row className="g-3">

                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Actual Cycle
                                                    </small>

                                                    <div className="ct-context-value">
                                                        {
                                                            formatMs(
                                                                previewCycleMs
                                                            )
                                                        }
                                                    </div>

                                                </Col>


                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Standard
                                                    </small>

                                                    <div className="ct-context-value">
                                                        {
                                                            formatMs(
                                                                previewStandard
                                                            )
                                                        }
                                                    </div>

                                                </Col>


                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Deviation
                                                    </small>

                                                    <div className="ct-context-value">

                                                        {
                                                            previewDeviation >
                                                            0
                                                                ? "+"
                                                                : ""
                                                        }

                                                        {
                                                            formatMs(
                                                                previewDeviation
                                                            )
                                                        }

                                                    </div>

                                                </Col>


                                                <Col md={3}>

                                                    <small className="text-muted">
                                                        Performance
                                                    </small>

                                                    <div className="mt-1">

                                                        <PerformanceBadge
                                                            actual={
                                                                previewCycleMs
                                                            }

                                                            standard={
                                                                previewStandard
                                                            }
                                                        />

                                                    </div>

                                                </Col>

                                            </Row>

                                        </div>

                                    </Col>
                                )
                            }


                            {/* RESULT */}

                            <Col md={4}>

                                <Form.Label className="ct-label">

                                    Result Status

                                    <span className="ct-required">
                                        {" "}*
                                    </span>

                                </Form.Label>


                                <Form.Control
                                    required

                                    list="cycle-result-list"

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


                                <datalist id="cycle-result-list">

                                    <option value="OK" />

                                    <option value="NOK" />

                                    <option value="PASS" />

                                    <option value="FAIL" />

                                </datalist>

                            </Col>


                            {/* SOURCE */}

                            <Col md={4}>

                                <Form.Label className="ct-label">
                                    Source System
                                </Form.Label>


                                <Form.Control
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


                            {/* UNIT */}

                            <Col md={4}>

                                <Form.Label className="ct-label">
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


                            {/* CORRELATION */}

                            <Col md={6}>

                                <Form.Label className="ct-label">
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

                            <Col md={6}>

                                <Form.Label className="ct-label">
                                    Idempotency Key
                                </Form.Label>


                                <Form.Control
                                    maxLength={150}

                                    placeholder="Generated automatically if blank"

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

                            className="ct-btn-primary"

                            disabled={
                                executeMutation.isPending
                            }
                        >
                            {
                                executeMutation.isPending
                                    ? "Recording..."
                                    : "Record Cycle"
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
// FILTER PANEL
// ============================================================

const CycleFilterPanel = ({
    filters,
    setFilters,
    companies,
    machines,
    processes,
    onApply,
    onClear
}) => (

    <div className="ct-filter">

        <Row className="g-2">

            <Col md={3}>

                <Form.Label className="ct-label">
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

                <Form.Label className="ct-label">
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


            {/* PROCESS FILTER DROPDOWN */}

            <Col md={3}>

                <Form.Label className="ct-label">
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
                        processes
                            .filter(
                                item =>
                                    !filters.company_id ||
                                    !companyId(item) ||
                                    sameId(
                                        companyId(item),
                                        filters.company_id
                                    )
                            )
                            .map(
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

                <Form.Label className="ct-label">
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


            <Col md={3}>

                <Form.Label className="ct-label">
                    Result Status
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


            <Col md={3}>

                <Form.Label className="ct-label">
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


            <Col md={3}>

                <Form.Label className="ct-label">
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


            <Col md={3}>

                <Form.Label className="ct-label">
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
                    className="ct-btn-primary"

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
// EVENT TABLE
// ============================================================

const CycleEventTable = ({
    rows,
    machineMap,
    processMap,
    loading
}) => (

    <div className="ct-table-wrap">

        <Table
            hover
            className="ct-table"
        >

            <thead>

                <tr>

                    <th>
                        End Time
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
                        Start
                    </th>

                    <th>
                        End
                    </th>

                    <th>
                        Actual Cycle
                    </th>

                    <th>
                        Standard
                    </th>

                    <th>
                        Deviation
                    </th>

                    <th>
                        Performance
                    </th>

                    <th>
                        Result
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
                                    className="ct-empty"
                                >
                                    <Spinner
                                        size="sm"
                                        animation="border"
                                        className="me-2"
                                    />

                                    Loading Cycle Time events...
                                </td>

                            </tr>
                        )
                        : rows.length ===
                            0
                            ? (

                                <tr>

                                    <td
                                        colSpan={12}
                                        className="ct-empty"
                                    >
                                        No Cycle Time events found.
                                    </td>

                                </tr>
                            )
                            : rows.map(
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


                                    const deviation =
                                        hasValue(
                                            row.standard_cycle_ms
                                        )
                                            ? Number(
                                                row.cycle_time_ms
                                            ) -
                                            Number(
                                                row.standard_cycle_ms
                                            )
                                            : null;


                                    return (

                                        <tr
                                            key={
                                                row.cycle_id
                                            }
                                        >

                                            <td>
                                                {
                                                    displayDateTime(
                                                        row.end_ts
                                                    )
                                                }
                                            </td>


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


                                            <td>
                                                {
                                                    displayDateTime(
                                                        row.start_ts
                                                    )
                                                }
                                            </td>


                                            <td>
                                                {
                                                    displayDateTime(
                                                        row.end_ts
                                                    )
                                                }
                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        formatMs(
                                                            row.cycle_time_ms
                                                        )
                                                    }
                                                </strong>

                                            </td>


                                            <td>
                                                {
                                                    formatMs(
                                                        row.standard_cycle_ms
                                                    )
                                                }
                                            </td>


                                            <td>

                                                {
                                                    deviation ===
                                                    null
                                                        ? "-"
                                                        : (

                                                            <span
                                                                className={
                                                                    deviation >
                                                                    0
                                                                        ? "text-danger"
                                                                        : "text-success"
                                                                }
                                                            >
                                                                {
                                                                    deviation >
                                                                    0
                                                                        ? "+"
                                                                        : ""
                                                                }

                                                                {
                                                                    formatMs(
                                                                        deviation
                                                                    )
                                                                }

                                                            </span>
                                                        )
                                                }

                                            </td>


                                            <td>

                                                <PerformanceBadge
                                                    actual={
                                                        row.cycle_time_ms
                                                    }

                                                    standard={
                                                        row.standard_cycle_ms
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
                                                        row.source_system
                                                    )
                                                }
                                            </td>

                                        </tr>
                                    );
                                }
                            )
                }

            </tbody>

        </Table>

    </div>
);


// ============================================================
// EXPORT
// ============================================================

export default CycleTimeTracking;