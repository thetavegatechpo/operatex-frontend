import ReportLens from '../../../../shared/operations/ReportLens.jsx';
import EventJourney from '../../../../shared/operations/EventJourney.jsx';
import FloorMap from '../../../../shared/operations/FloorMap.jsx';

import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/MachineStatus/MachineStatus.jsx

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
    Activity,
    Alarm,
    ArrowClockwise,
    BarChartLine,
    CheckCircleFill,
    ExclamationTriangleFill,
    GearFill,
    PencilSquare,
    PlayFill,
    Plus,
    Search,
    StopCircleFill,
    XCircleFill
} from "react-bootstrap-icons";

import {
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";

import signalService from "../../../master-data/signal-mapping/api/signal.service.js";

import machineStatusService, {
    ALARM_SEVERITIES,
    MACHINE_MODE_CODES,
    MACHINE_STATUS_CODES,

    clearMachineAlarm,
    createMachineStatusConfig,
    createStatusMappingRule,
    executeMachineStatus,
    exportMachineStatusReport,
    getCurrentMachineStatus,
    getMachineAlarms,
    getMachineStatusMaster,
    getMachineStatusReport,
    getMachineStatusRuntime,
    getStatusMappingRules,
    raiseMachineAlarm,
    softDeleteMachineStatusConfig,
    softDeleteStatusMappingRule,
    updateMachineStatusConfig,
    updateStatusMappingRule
} from "../api/machineStatus.service.js";


// ============================================================
// VIEWS
// ============================================================

const VIEW_CONFIG = "CONFIG";
const VIEW_RULES = "RULES";
const VIEW_CURRENT = "CURRENT";
const VIEW_RUNTIME = "RUNTIME";
const VIEW_ALARMS = "ALARMS";
const VIEW_REPORT = "REPORT";


// ============================================================
// CONFIG FORM
// ============================================================

const configInitialState = {

    machine_status_config_id: "",

    company_id: "",
    plant_id: "",
    line_id: "",
    machine_id: "",

    primary_signal_id: "",

    default_status: "UNKNOWN",

    stale_timeout_seconds: "",

    is_active: true,

    version_no: 1
};


// ============================================================
// RULE FORM
// ============================================================

const ruleInitialState = {

    status_mapping_rule_id: "",

    company_id: "",

    machine_status_config_id: "",

    signal_id: "",

    match_value: "",

    rule_expression: "",

    result_status: "RUNNING",

    is_available: true,

    mode_code: "AUTO",

    priority_no: 100,

    is_active: true,

    version_no: 1
};


// ============================================================
// STATUS EXECUTION FORM
// ============================================================

const executeInitialState = {

    company_id: "",
    plant_id: "",
    line_id: "",
    machine_id: "",

    shift_id: "",

    status_code: "RUNNING",

    is_available: true,

    mode: "AUTO",

    reason_code: "",

    source_signal_mapping_id: "",

    raw_value: "",

    event_ts: "",

    source_system: "MES_UI",

    idempotency_key: ""
};


// ============================================================
// ALARM FORM
// ============================================================

const alarmInitialState = {

    company_id: "",
    plant_id: "",
    line_id: "",
    machine_id: "",

    shift_id: "",

    signal_id: "",

    alarm_code: "",

    alarm_message: "",

    severity: "HIGH",

    start_ts: "",

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

    status_code: "",

    is_available: "",

    mode: "",

    source_system: "",

    from_timestamp: "",

    to_timestamp: ""
};


// ============================================================
// HELPERS
// ============================================================

const hasValue = value =>
    value !== undefined &&
    value !== null &&
    value !== "";


const sameId = (
    left,
    right
) =>
    String(
        left ?? ""
    ) ===
    String(
        right ?? ""
    );


const boolValue = value => {

    if (
        value === true ||
        value === 1 ||
        value === "1"
    ) {
        return true;
    }

    return String(value)
        .toLowerCase() === "true";
};


const safeText = value =>
    hasValue(value)
        ? String(value)
        : "-";


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
            19
        );
};


const nowLocalDateTime = () =>
    toLocalDateTime(
        new Date()
    );


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

        response?.data?.data?.data
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
                return candidate[key];
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

        if (matches.length) {
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

            if (nested.length) {
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

            if (nested.length) {
                return nested;
            }
        }
    }

    return [];
};


// ============================================================
// COMPANY HELPERS
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
// PLANT HELPERS
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
// LINE HELPERS
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
// MACHINE HELPERS
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
// SIGNAL HELPERS
// ============================================================

const signalId = item =>
    item?.signal_mapping_id ??
    item?.signalMappingId ??
    "";


const signalLabel = item => {

    const code =
        item?.signal_code ??
        "";

    const address =
        item?.raw_address ??
        "";

    if (
        code &&
        address
    ) {

        return `${code} - ${address}`;
    }

    return (
        code ||
        address ||
        signalId(item)
    );
};


// ============================================================
// SHIFT HELPERS
// ============================================================

const shiftId = item =>
    item?.shift_id ??
    item?.shiftId ??
    "";


const shiftLabel = item => {

    const code =
        item?.shift_code ??
        item?.shift_no ??
        "";

    const name =
        item?.shift_name ??
        item?.name ??
        "";

    if (
        code &&
        name
    ) {

        return `${code} - ${name}`;
    }

    return (
        name ||
        code ||
        `Shift ${shiftId(item)}`
    );
};


// ============================================================
// STATUS BADGE
// ============================================================

const StatusBadge = ({
    status
}) => {

    const value =
        String(
            status || "UNKNOWN"
        )
            .toUpperCase();


    let bg =
        "secondary";


    if (
        value ===
        "RUNNING"
    ) {

        bg =
            "success";
    }
    else if (
        value ===
        "IDLE"
    ) {

        bg =
            "warning";
    }
    else if (
        [
            "DOWN",
            "STOPPED"
        ].includes(value)
    ) {

        bg =
            "danger";
    }
    else if (
        value ===
        "ALARM"
    ) {

        bg =
            "danger";
    }
    else if (
        value ===
        "SETUP"
    ) {

        bg =
            "info";
    }


    return (
        <Badge
            bg={bg}
            text={
                bg === "warning" ||
                bg === "info"
                    ? "dark"
                    : undefined
            }
        >
            {value}
        </Badge>
    );
};


// ============================================================
// AVAILABILITY BADGE
// ============================================================

const AvailabilityBadge = ({
    value
}) => {

    if (
        value === null ||
        value === undefined
    ) {

        return (
            <Badge bg="secondary">
                Unknown
            </Badge>
        );
    }


    return (
        <Badge
            bg={
                boolValue(value)
                    ? "success"
                    : "danger"
            }
        >
            {
                boolValue(value)
                    ? "Available"
                    : "Unavailable"
            }
        </Badge>
    );
};


// ============================================================
// ACTIVE BADGE
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

const MachineStatus = () => {

    const queryClient =
        useQueryClient();


    // ========================================================
    // VIEW STATE
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
        showRuleModal,
        setShowRuleModal
    ] =
        useState(false);


    const [
        showExecuteModal,
        setShowExecuteModal
    ] =
        useState(false);


    const [
        showAlarmModal,
        setShowAlarmModal
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
        ruleForm,
        setRuleForm
    ] =
        useState(
            ruleInitialState
        );


    const [
        executeForm,
        setExecuteForm
    ] =
        useState(
            executeInitialState
        );


    const [
        alarmForm,
        setAlarmForm
    ] =
        useState(
            alarmInitialState
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
                "machine-status",
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
                "machine-status",
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
                "machine-status",
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
                "machine-status",
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
    // SIGNAL MASTER
    // ========================================================

    const signalsQuery =
        useQuery({

            queryKey: [
                "machine-status",
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
                                response,
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
    // SHIFT LOOKUP
    //
    // Existing Planning endpoint.
    // ========================================================

    const shiftsQuery =
        useQuery({

            queryKey: [
                "machine-status",
                "shifts"
            ],

            queryFn:
                async () => {

                    const response =
                        await api.get(
                            "/shift-plan/config"
                        );


                    let rows =
                        findRowsRecursive(
                            response?.data,
                            item =>
                                hasValue(
                                    shiftId(
                                        item
                                    )
                                )
                        );


                    const unique =
                        new Map();


                    rows.forEach(
                        row => {

                            const id =
                                shiftId(
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
    // MACHINE STATUS CONFIG
    // ========================================================

    const configQuery =
        useQuery({

            queryKey: [
                "machine-status",
                "config"
            ],

            queryFn:
                () =>
                    getMachineStatusMaster()
        });


    const configRows =
        machineStatusService
            .getMachineStatusConfigRows(
                configQuery.data
            );


    // ========================================================
    // STATUS RULES
    // ========================================================

    const rulesQuery =
        useQuery({

            queryKey: [
                "machine-status",
                "rules"
            ],

            queryFn:
                () =>
                    getStatusMappingRules()
        });


    const ruleRows =
        machineStatusService
            .getStatusMappingRuleRows(
                rulesQuery.data
            );


    // ========================================================
    // CURRENT MACHINE STATUS
    // ========================================================

    const currentQuery =
        useQuery({

            queryKey: [
                "machine-status",
                "current",
                appliedFilters.company_id,
                appliedFilters.plant_id,
                appliedFilters.line_id,
                appliedFilters.machine_id
            ],

            queryFn:
                () =>
                    getCurrentMachineStatus({
                        company_id:
                            appliedFilters.company_id,

                        plant_id:
                            appliedFilters.plant_id,

                        line_id:
                            appliedFilters.line_id,

                        machine_id:
                            appliedFilters.machine_id
                    }),

            refetchInterval: 30000,
            refetchIntervalInBackground: false,
            enabled:
                activeView ===
                VIEW_CURRENT
        });


    const currentRows =
        machineStatusService
            .getCurrentMachineStatusRows(
                currentQuery.data
            );


    // ========================================================
    // RUNTIME
    // ========================================================

    const runtimeQuery =
        useQuery({

            queryKey: [
                "machine-status",
                "runtime",
                appliedFilters
            ],

            queryFn:
                () =>
                    getMachineStatusRuntime(
                        appliedFilters
                    ),

            refetchInterval: 10000,
            refetchIntervalInBackground: false,
            enabled:
                activeView ===
                VIEW_RUNTIME
        });


    const runtimeRows =
        machineStatusService
            .getMachineStatusEventRows(
                runtimeQuery.data
            );


    // ========================================================
    // ALARMS
    // ========================================================

    const alarmsQuery =
        useQuery({

            queryKey: [
                "machine-status",
                "alarms",
                appliedFilters
            ],

            queryFn:
                () =>
                    getMachineAlarms({
                        company_id:
                            appliedFilters.company_id,

                        plant_id:
                            appliedFilters.plant_id,

                        line_id:
                            appliedFilters.line_id,

                        machine_id:
                            appliedFilters.machine_id,

                        shift_id:
                            appliedFilters.shift_id,

                        from_timestamp:
                            appliedFilters.from_timestamp,

                        to_timestamp:
                            appliedFilters.to_timestamp
                    }),

            enabled:
                activeView ===
                VIEW_ALARMS
        });


    const alarmRows =
        machineStatusService
            .getAlarmRows(
                alarmsQuery.data
            );


    // ========================================================
    // REPORT
    // ========================================================

    const reportQuery =
        useQuery({

            queryKey: [
                "machine-status",
                "report",
                appliedFilters
            ],

            queryFn:
                () =>
                    getMachineStatusReport(
                        appliedFilters
                    ),

            enabled:
                activeView ===
                VIEW_REPORT
        });


    const reportRows =
        machineStatusService
            .getMachineStatusEventRows(
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
    // LOOKUPS
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


    const signals =
        signalsQuery.data ||
        [];


    const shifts =
        shiftsQuery.data ||
        [];


    // ========================================================
    // MAPS
    // ========================================================

    const machineMap =
        useMemo(
            () =>
                new Map(
                    machines.map(
                        item => [
                            String(
                                machineId(item)
                            ),
                            item
                        ]
                    )
                ),
            [
                machines
            ]
        );


    const signalMap =
        useMemo(
            () =>
                new Map(
                    signals.map(
                        item => [
                            String(
                                signalId(item)
                            ),
                            item
                        ]
                    )
                ),
            [
                signals
            ]
        );


    const configMap =
        useMemo(
            () =>
                new Map(
                    configRows.map(
                        item => [
                            String(
                                item.machine_status_config_id
                            ),
                            item
                        ]
                    )
                ),
            [
                configRows
            ]
        );


    // ========================================================
    // CONFIG CASCADE
    // ========================================================

    const configPlants =
        useMemo(
            () =>
                plants.filter(
                    item =>
                        !configForm.company_id ||
                        !companyId(item) ||
                        sameId(
                            companyId(item),
                            configForm.company_id
                        )
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
                    item =>
                        !configForm.plant_id ||
                        !plantId(item) ||
                        sameId(
                            plantId(item),
                            configForm.plant_id
                        )
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
                    item =>
                        !configForm.line_id ||
                        !lineId(item) ||
                        sameId(
                            lineId(item),
                            configForm.line_id
                        )
                ),
            [
                machines,
                configForm.line_id
            ]
        );


    const configSignals =
        useMemo(
            () =>
                signals.filter(
                    item => {

                        const selected =
                            sameId(
                                signalId(item),
                                configForm.primary_signal_id
                            );


                        if (
                            hasValue(
                                item?.is_active
                            ) &&
                            !boolValue(
                                item.is_active
                            ) &&
                            !selected
                        ) {

                            return false;
                        }


                        if (
                            configForm.company_id &&
                            companyId(item) &&
                            !sameId(
                                companyId(item),
                                configForm.company_id
                            )
                        ) {

                            return false;
                        }


                        if (
                            configForm.plant_id &&
                            plantId(item) &&
                            !sameId(
                                plantId(item),
                                configForm.plant_id
                            )
                        ) {

                            return false;
                        }


                        if (
                            configForm.line_id &&
                            lineId(item) &&
                            !sameId(
                                lineId(item),
                                configForm.line_id
                            )
                        ) {

                            return false;
                        }


                        if (
                            configForm.machine_id &&
                            machineId(item) &&
                            !sameId(
                                machineId(item),
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
                configForm.primary_signal_id
            ]
        );


    // ========================================================
    // RULE CONFIG
    // ========================================================

    const selectedRuleConfig =
        useMemo(
            () =>
                configMap.get(
                    String(
                        ruleForm.machine_status_config_id ||
                        ""
                    )
                ) ||
                null,
            [
                configMap,
                ruleForm.machine_status_config_id
            ]
        );


    const ruleSignals =
        useMemo(
            () => {

                if (
                    !selectedRuleConfig
                ) {

                    return [];
                }


                return signals.filter(
                    item => {

                        const selected =
                            sameId(
                                signalId(item),
                                ruleForm.signal_id
                            );


                        if (
                            hasValue(
                                item?.is_active
                            ) &&
                            !boolValue(
                                item.is_active
                            ) &&
                            !selected
                        ) {

                            return false;
                        }


                        if (
                            machineId(item) &&
                            !sameId(
                                machineId(item),
                                selectedRuleConfig.machine_id
                            )
                        ) {

                            return false;
                        }


                        return true;
                    }
                );
            },
            [
                signals,
                selectedRuleConfig,
                ruleForm.signal_id
            ]
        );


    // ========================================================
    // EXECUTION CASCADE
    // ========================================================

    const executePlants =
        useMemo(
            () =>
                plants.filter(
                    item =>
                        !executeForm.company_id ||
                        !companyId(item) ||
                        sameId(
                            companyId(item),
                            executeForm.company_id
                        )
                ),
            [
                plants,
                executeForm.company_id
            ]
        );


    const executeLines =
        useMemo(
            () =>
                lines.filter(
                    item =>
                        !executeForm.plant_id ||
                        !plantId(item) ||
                        sameId(
                            plantId(item),
                            executeForm.plant_id
                        )
                ),
            [
                lines,
                executeForm.plant_id
            ]
        );


    const executeMachines =
        useMemo(
            () =>
                machines.filter(
                    item =>
                        !executeForm.line_id ||
                        !lineId(item) ||
                        sameId(
                            lineId(item),
                            executeForm.line_id
                        )
                ),
            [
                machines,
                executeForm.line_id
            ]
        );


    const executeSignals =
        useMemo(
            () =>
                signals.filter(
                    item =>
                        !executeForm.machine_id ||
                        !machineId(item) ||
                        sameId(
                            machineId(item),
                            executeForm.machine_id
                        )
                ),
            [
                signals,
                executeForm.machine_id
            ]
        );


    // ========================================================
    // ALARM CASCADE
    // ========================================================

    const alarmPlants =
        useMemo(
            () =>
                plants.filter(
                    item =>
                        !alarmForm.company_id ||
                        !companyId(item) ||
                        sameId(
                            companyId(item),
                            alarmForm.company_id
                        )
                ),
            [
                plants,
                alarmForm.company_id
            ]
        );


    const alarmLines =
        useMemo(
            () =>
                lines.filter(
                    item =>
                        !alarmForm.plant_id ||
                        !plantId(item) ||
                        sameId(
                            plantId(item),
                            alarmForm.plant_id
                        )
                ),
            [
                lines,
                alarmForm.plant_id
            ]
        );


    const alarmMachines =
        useMemo(
            () =>
                machines.filter(
                    item =>
                        !alarmForm.line_id ||
                        !lineId(item) ||
                        sameId(
                            lineId(item),
                            alarmForm.line_id
                        )
                ),
            [
                machines,
                alarmForm.line_id
            ]
        );


    const alarmSignals =
        useMemo(
            () =>
                signals.filter(
                    item =>
                        !alarmForm.machine_id ||
                        !machineId(item) ||
                        sameId(
                            machineId(item),
                            alarmForm.machine_id
                        )
                ),
            [
                signals,
                alarmForm.machine_id
            ]
        );


    // ========================================================
    // SEARCHED CONFIGS
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


                        const signal =
                            signalMap.get(
                                String(
                                    row.primary_signal_id
                                )
                            );


                        const text = [

                            machine
                                ? machineLabel(machine)
                                : row.machine_id,

                            signal
                                ? signalLabel(signal)
                                : row.primary_signal_id,

                            row.default_status,

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
                searchText,
                configRows,
                machineMap,
                signalMap
            ]
        );


    // ========================================================
    // SUMMARY COUNTS
    // ========================================================

    const activeConfigCount =
        configRows.filter(
            row =>
                boolValue(
                    row.is_active
                )
        ).length;


    const runningMachines =
        currentRows.filter(
            row =>
                String(
                    row.status_code ||
                    ""
                ).toUpperCase() ===
                "RUNNING"
        ).length;


    const unavailableMachines =
        currentRows.filter(
            row =>
                row.is_available ===
                    false
        ).length;


    const activeAlarms =
        alarmRows.filter(
            row =>
                !row.end_ts
        ).length;


    // ========================================================
    // REFRESH
    // ========================================================

    const refreshModule =
        async () => {

            await Promise.all([

                queryClient.invalidateQueries({
                    queryKey: [
                        "machine-status",
                        "config"
                    ]
                }),

                queryClient.invalidateQueries({
                    queryKey: [
                        "machine-status",
                        "rules"
                    ]
                }),

                queryClient.invalidateQueries({
                    queryKey: [
                        "machine-status",
                        "current"
                    ]
                }),

                queryClient.invalidateQueries({
                    queryKey: [
                        "machine-status",
                        "runtime"
                    ]
                }),

                queryClient.invalidateQueries({
                    queryKey: [
                        "machine-status",
                        "alarms"
                    ]
                }),

                queryClient.invalidateQueries({
                    queryKey: [
                        "machine-status",
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
                        payload.machine_status_config_id
                    ) {

                        const {
                            machine_status_config_id,
                            ...body
                        } =
                            payload;


                        return updateMachineStatusConfig(
                            machine_status_config_id,
                            body
                        );
                    }


                    return createMachineStatusConfig(
                        payload
                    );
                },


            onSuccess:
                async () => {

                    setErrorMessage("");


                    setMessage(
                        configForm.machine_status_config_id
                            ? "Machine Status configuration updated successfully."
                            : "Machine Status configuration created successfully."
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
                            "Unable to save Machine Status configuration."
                        )
                    );
                }
        });


    // ========================================================
    // RULE MUTATION
    // ========================================================

    const ruleMutation =
        useMutation({

            mutationFn:
                async payload => {

                    if (
                        payload.status_mapping_rule_id
                    ) {

                        const {
                            status_mapping_rule_id,
                            ...body
                        } =
                            payload;


                        return updateStatusMappingRule(
                            status_mapping_rule_id,
                            body
                        );
                    }


                    return createStatusMappingRule(
                        payload
                    );
                },


            onSuccess:
                async () => {

                    setErrorMessage("");


                    setMessage(
                        ruleForm.status_mapping_rule_id
                            ? "Status Mapping Rule updated successfully."
                            : "Status Mapping Rule created successfully."
                    );


                    setShowRuleModal(
                        false
                    );


                    setRuleForm(
                        ruleInitialState
                    );


                    await refreshModule();
                },


            onError:
                error => {

                    setMessage("");


                    setErrorMessage(
                        getErrorMessage(
                            error,
                            "Unable to save Status Mapping Rule."
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
                    executeMachineStatus(
                        payload
                    ),


            onSuccess:
                async result => {

                    setErrorMessage("");


                    if (
                        result?.idempotent
                    ) {

                        setMessage(
                            "Machine Status event was already processed."
                        );

                    }
                    else if (
                        result?.suppressed
                    ) {

                        setMessage(
                            "Machine Status unchanged. Duplicate transition was suppressed."
                        );

                    }
                    else {

                        setMessage(
                            "Machine Status event recorded successfully."
                        );
                    }


                    setShowExecuteModal(
                        false
                    );


                    setExecuteForm(
                        executeInitialState
                    );


                    await refreshModule();


                    setActiveView(
                        VIEW_CURRENT
                    );
                },


            onError:
                error => {

                    setMessage("");


                    setErrorMessage(
                        getErrorMessage(
                            error,
                            "Unable to record Machine Status."
                        )
                    );
                }
        });


    // ========================================================
    // ALARM MUTATION
    // ========================================================

    const alarmMutation =
        useMutation({

            mutationFn:
                payload =>
                    raiseMachineAlarm(
                        payload
                    ),


            onSuccess:
                async result => {

                    setErrorMessage("");


                    if (
                        result?.already_active
                    ) {

                        setMessage(
                            "This alarm is already active."
                        );

                    }
                    else if (
                        result?.idempotent
                    ) {

                        setMessage(
                            "Alarm request was already processed."
                        );

                    }
                    else {

                        setMessage(
                            "Alarm raised successfully."
                        );
                    }


                    setShowAlarmModal(
                        false
                    );


                    setAlarmForm(
                        alarmInitialState
                    );


                    await refreshModule();


                    setActiveView(
                        VIEW_ALARMS
                    );
                },


            onError:
                error => {

                    setMessage("");


                    setErrorMessage(
                        getErrorMessage(
                            error,
                            "Unable to raise alarm."
                        )
                    );
                }
        });


    // ========================================================
    // OPEN CONFIG CREATE
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
    // OPEN CONFIG EDIT
    // ========================================================

    const openEditConfig =
        row => {

            setConfigForm({

                machine_status_config_id:
                    row.machine_status_config_id,

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

                primary_signal_id:
                    row.primary_signal_id ||
                    "",

                default_status:
                    row.default_status ||
                    "UNKNOWN",

                stale_timeout_seconds:
                    row.stale_timeout_seconds ??
                    "",

                is_active:
                    boolValue(
                        row.is_active
                    ),

                version_no:
                    row.version_no ??
                    1
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


            setErrorMessage("");


            configMutation.mutate({

                ...configForm,

                primary_signal_id:
                    configForm.primary_signal_id ||
                    null,

                stale_timeout_seconds:
                    configForm.stale_timeout_seconds
                        ? Number(
                            configForm.stale_timeout_seconds
                        )
                        : null,

                version_no:
                    Number(
                        configForm.version_no
                    ),

                is_active:
                    Boolean(
                        configForm.is_active
                    )
            });
        };


    // ========================================================
    // DEACTIVATE CONFIG
    // ========================================================

    const deactivateConfig =
        async row => {

            if (
                !window.confirm(
                    "Deactivate this Machine Status configuration?"
                )
            ) {
                return;
            }


            try {

                await softDeleteMachineStatusConfig(
                    row.machine_status_config_id
                );


                setMessage(
                    "Machine Status configuration deactivated successfully."
                );


                await refreshModule();

            }
            catch (error) {

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Unable to deactivate configuration."
                    )
                );
            }
        };


    // ========================================================
    // OPEN RULE CREATE
    // ========================================================

    const openCreateRule =
        () => {

            const firstConfig =
                configRows.find(
                    row =>
                        boolValue(
                            row.is_active
                        )
                );


            setRuleForm({

                ...ruleInitialState,

                company_id:
                    firstConfig
                        ?.company_id ||
                    "",

                machine_status_config_id:
                    firstConfig
                        ?.machine_status_config_id ||
                    ""
            });


            setShowRuleModal(
                true
            );
        };


    // ========================================================
    // OPEN RULE EDIT
    // ========================================================

    const openEditRule =
        row => {

            setRuleForm({

                status_mapping_rule_id:
                    row.status_mapping_rule_id,

                company_id:
                    row.company_id ||
                    "",

                machine_status_config_id:
                    row.machine_status_config_id ||
                    "",

                signal_id:
                    row.signal_id ||
                    "",

                match_value:
                    row.match_value ||
                    "",

                rule_expression:
                    row.rule_expression ||
                    "",

                result_status:
                    row.result_status ||
                    "RUNNING",

                is_available:
                    boolValue(
                        row.is_available
                    ),

                mode_code:
                    row.mode_code ||
                    "",

                priority_no:
                    row.priority_no ??
                    100,

                is_active:
                    boolValue(
                        row.is_active
                    ),

                version_no:
                    row.version_no ??
                    1
            });


            setShowRuleModal(
                true
            );
        };


    // ========================================================
    // SUBMIT RULE
    // ========================================================

    const submitRule =
        event => {

            event.preventDefault();


            if (
                !ruleForm.signal_id &&
                !ruleForm.rule_expression
            ) {

                setErrorMessage(
                    "Select a Signal with Match Value, or enter a Rule Expression."
                );

                return;
            }


            if (
                ruleForm.signal_id &&
                !ruleForm.match_value &&
                !ruleForm.rule_expression
            ) {

                setErrorMessage(
                    "Match Value is required for a signal-based rule."
                );

                return;
            }


            setErrorMessage("");


            ruleMutation.mutate({

                ...ruleForm,

                signal_id:
                    ruleForm.signal_id ||
                    null,

                match_value:
                    ruleForm.match_value ||
                    null,

                rule_expression:
                    ruleForm.rule_expression ||
                    null,

                mode_code:
                    ruleForm.mode_code ||
                    null,

                priority_no:
                    Number(
                        ruleForm.priority_no
                    ),

                version_no:
                    Number(
                        ruleForm.version_no
                    ),

                is_available:
                    Boolean(
                        ruleForm.is_available
                    ),

                is_active:
                    Boolean(
                        ruleForm.is_active
                    )
            });
        };


    // ========================================================
    // DEACTIVATE RULE
    // ========================================================

    const deactivateRule =
        async row => {

            if (
                !window.confirm(
                    "Deactivate this Status Mapping Rule?"
                )
            ) {
                return;
            }


            try {

                await softDeleteStatusMappingRule(
                    row.status_mapping_rule_id
                );


                setMessage(
                    "Status Mapping Rule deactivated successfully."
                );


                await refreshModule();

            }
            catch (error) {

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Unable to deactivate Status Mapping Rule."
                    )
                );
            }
        };


    // ========================================================
    // OPEN MANUAL STATUS
    // ========================================================

    const openExecute =
        () => {

            const activeConfig =
                configRows.find(
                    row =>
                        boolValue(
                            row.is_active
                        )
                );


            setExecuteForm({

                ...executeInitialState,

                company_id:
                    activeConfig
                        ?.company_id ||
                    "",

                plant_id:
                    activeConfig
                        ?.plant_id ||
                    "",

                line_id:
                    activeConfig
                        ?.line_id ||
                    "",

                machine_id:
                    activeConfig
                        ?.machine_id ||
                    "",

                event_ts:
                    nowLocalDateTime()
            });


            setShowExecuteModal(
                true
            );
        };


    // ========================================================
    // SUBMIT MANUAL STATUS
    // ========================================================

    const submitExecute =
        event => {

            event.preventDefault();


            const idempotencyKey =
                executeForm.idempotency_key
                    .trim() ||
                `MS-${
                    executeForm.machine_id
                }-${Date.now()}`;


            setErrorMessage("");


            executeMutation.mutate({

                company_id:
                    executeForm.company_id,

                plant_id:
                    executeForm.plant_id,

                line_id:
                    executeForm.line_id,

                machine_id:
                    executeForm.machine_id,

                shift_id:
                    Number(
                        executeForm.shift_id
                    ),

                status_code:
                    executeForm.status_code,

                is_available:
                    Boolean(
                        executeForm.is_available
                    ),

                mode:
                    executeForm.mode ||
                    null,

                reason_code:
                    executeForm.reason_code ||
                    null,

                source_signal_mapping_id:
                    executeForm.source_signal_mapping_id ||
                    null,

                event_ts:
                    executeForm.event_ts,

                source_system:
                    executeForm.source_system ||
                    "MES_UI",

                idempotency_key:
                    idempotencyKey
            });
        };


    // ========================================================
    // OPEN ALARM
    // ========================================================

    const openRaiseAlarm =
        () => {

            const activeConfig =
                configRows.find(
                    row =>
                        boolValue(
                            row.is_active
                        )
                );


            setAlarmForm({

                ...alarmInitialState,

                company_id:
                    activeConfig
                        ?.company_id ||
                    "",

                plant_id:
                    activeConfig
                        ?.plant_id ||
                    "",

                line_id:
                    activeConfig
                        ?.line_id ||
                    "",

                machine_id:
                    activeConfig
                        ?.machine_id ||
                    "",

                start_ts:
                    nowLocalDateTime()
            });


            setShowAlarmModal(
                true
            );
        };


    // ========================================================
    // SUBMIT ALARM
    // ========================================================

    const submitAlarm =
        event => {

            event.preventDefault();


            const idempotencyKey =
                alarmForm.idempotency_key
                    .trim() ||
                `ALARM-${
                    alarmForm.machine_id
                }-${
                    alarmForm.alarm_code
                }-${Date.now()}`;


            setErrorMessage("");


            alarmMutation.mutate({

                company_id:
                    alarmForm.company_id,

                plant_id:
                    alarmForm.plant_id,

                line_id:
                    alarmForm.line_id,

                machine_id:
                    alarmForm.machine_id,

                shift_id:
                    Number(
                        alarmForm.shift_id
                    ),

                signal_id:
                    alarmForm.signal_id ||
                    null,

                alarm_code:
                    alarmForm.alarm_code,

                alarm_message:
                    alarmForm.alarm_message ||
                    null,

                severity:
                    alarmForm.severity ||
                    null,

                start_ts:
                    alarmForm.start_ts,

                idempotency_key:
                    idempotencyKey
            });
        };


    // ========================================================
    // CLEAR ALARM
    // ========================================================

    const handleClearAlarm =
        async row => {

            if (
                !window.confirm(
                    `Clear alarm ${row.alarm_code}?`
                )
            ) {
                return;
            }


            try {

                await clearMachineAlarm(
                    row.alarm_id,
                    {
                        end_ts:
                            new Date()
                                .toISOString(),

                        status:
                            "CLEARED"
                    }
                );


                setMessage(
                    "Alarm cleared successfully."
                );


                await refreshModule();

            }
            catch (error) {

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Unable to clear alarm."
                    )
                );
            }
        };


    // ========================================================
    // EXPORT
    // ========================================================

    const handleExport =
        async () => {

            try {

                const result =
                    await exportMachineStatusReport(
                        appliedFilters
                    );


                const rows =
                    machineStatusService
                        .getMachineStatusEventRows(
                            result.data
                        );


                downloadCsv(
                    rows,
                    `machine-status-report-${Date.now()}.csv`
                );


                setMessage(
                    "Machine Status report exported successfully."
                );

            }
            catch (error) {

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Unable to export Machine Status report."
                    )
                );
            }
        };


    // ========================================================
    // FULL REFRESH
    // ========================================================

    const handleRefresh =
        async () => {

            setErrorMessage("");
            setMessage("");


            try {

                await Promise.all([

                    configQuery.refetch(),

                    rulesQuery.refetch(),

                    companiesQuery.refetch(),

                    plantsQuery.refetch(),

                    linesQuery.refetch(),

                    machinesQuery.refetch(),

                    signalsQuery.refetch(),

                    shiftsQuery.refetch(),

                    activeView ===
                    VIEW_CURRENT
                        ? currentQuery.refetch()
                        : Promise.resolve(),

                    activeView ===
                    VIEW_RUNTIME
                        ? runtimeQuery.refetch()
                        : Promise.resolve(),

                    activeView ===
                    VIEW_ALARMS
                        ? alarmsQuery.refetch()
                        : Promise.resolve(),

                    activeView ===
                    VIEW_REPORT
                        ? reportQuery.refetch()
                        : Promise.resolve()
                ]);


                setMessage(
                    "Machine Status data refreshed successfully."
                );

            }
            catch (error) {

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Unable to refresh Machine Status."
                    )
                );
            }
        };


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <>

<div className="ms-page">

            <style>{`

                .ms-page {
                    min-height: 100vh;
                    padding: 22px;
                    background: #f4f6fb;
                }

                .ms-card {
                    background: #ffffff;
                    border: 1px solid #e5e9f2;
                    border-radius: 12px;
                    box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
                }

                .ms-title {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                    color: #1f2d3d;
                }

                .ms-subtitle {
                    margin-top: 4px;
                    color: #748094;
                    font-size: 13px;
                }

                .ms-btn-primary {
                    background: #314965 !important;
                    border-color: #314965 !important;
                    color: white !important;
                    font-weight: 600;
                }

                .ms-btn-primary:hover {
                    background: #25364e !important;
                    border-color: #25364e !important;
                }

                .ms-btn-outline {
                    background: white !important;
                    border: 1px solid #314965 !important;
                    color: #314965 !important;
                    font-weight: 600;
                }

                .ms-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .ms-tab {
                    border: 1px solid #d9dce5;
                    background: white;
                    color: #566176;
                    font-weight: 600;
                    padding: 8px 15px;
                    border-radius: 7px;
                }

                .ms-tab.active {
                    background: #f1f4f8;
                    border-color: #314965;
                    color: #314965;
                }

                .ms-stat {
                    height: 100%;
                    padding: 14px;
                    border: 1px solid #e5e9f2;
                    border-radius: 10px;
                    background: white;
                }

                .ms-stat-icon {
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

                .ms-stat-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #263449;
                }

                .ms-stat-label {
                    color: #758195;
                    font-size: 12px;
                }

                .ms-table-wrap {
                    overflow: auto;
                    border: 1px solid #e4e7ee;
                    border-radius: 9px;
                }

                .ms-table {
                    margin: 0;
                    white-space: nowrap;
                }

                .ms-table thead th {
                    background: #1c2d45;
                    color: white;
                    border-color: #1c2d45;
                    padding: 12px;
                    font-size: 12px;
                }

                .ms-table tbody td {
                    vertical-align: middle;
                    padding: 11px 12px;
                    color: #364152;
                    font-size: 13px;
                }

                .ms-empty {
                    padding: 30px !important;
                    color: #8a94a6 !important;
                    text-align: center;
                }

                .ms-search {
                    position: relative;
                    width: 350px;
                    max-width: 100%;
                }

                .ms-search svg {
                    position: absolute;
                    left: 11px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #8792a5;
                }

                .ms-search input {
                    padding-left: 35px;
                }

                .ms-label {
                    color: #354154;
                    font-size: 12px;
                    font-weight: 700;
                    margin-bottom: 5px;
                }

                .ms-required {
                    color: #dc3545;
                }

                .ms-filter {
                    padding: 15px;
                    background: #f9fafc;
                    border: 1px solid #e5e9f2;
                    border-radius: 9px;
                    margin-bottom: 15px;
                }

                .ms-context {
                    padding: 13px;
                    border: 1px solid #f1cebc;
                    border-radius: 9px;
                    background: #f6f8fa;
                }

                .ms-modal .modal-content {
                    border: none;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .ms-modal .modal-header {
                    background: #1c2d45;
                    color: white;
                    border: none;
                }

                .ms-modal .btn-close {
                    filter: invert(1);
                }

                @media (max-width: 768px) {

                    .ms-page {
                        padding: 12px;
                    }

                    .ms-search {
                        width: 100%;
                    }
                }

            `}</style>


            {/* =================================================
                HEADER
            ================================================== */}

            <Card className="ms-card mb-3">

                <Card.Body>

                    <Row className="align-items-center g-3">

                        <Col lg={7}>

                            <h4 className="ms-title">
                                Machine Status
                            </h4>

                            <div className="ms-subtitle">

                                Configure machine state signals,
                                normalize PLC values into canonical
                                states, track runtime transitions
                                and manage alarms.

                            </div>

                        </Col>


                        <Col lg={5}>

                            <div className="d-flex justify-content-lg-end gap-2 flex-wrap">

                                <Button
                                    className="ms-btn-outline"
                                    onClick={
                                        handleRefresh
                                    }
                                >
                                    <ArrowClockwise className="me-1" />

                                    Refresh
                                </Button>


                                <Button
                                    className="ms-btn-outline"
                                    onClick={
                                        openRaiseAlarm
                                    }
                                >
                                    <Alarm className="me-1" />

                                    Raise Alarm
                                </Button>


                                <Button
                                    className="ms-btn-primary"
                                    onClick={
                                        openExecute
                                    }
                                >
                                    <PlayFill className="me-1" />

                                    Record Status
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

                    <div className="ms-stat">

                        <div className="d-flex align-items-center gap-3">

                            <div className="ms-stat-icon">
                                <GearFill />
                            </div>

                            <div>

                                <div className="ms-stat-value">
                                    {
                                        activeConfigCount
                                    }
                                </div>

                                <div className="ms-stat-label">
                                    Active Configurations
                                </div>

                            </div>

                        </div>

                    </div>

                </Col>


                <Col md={3}>

                    <div className="ms-stat">

                        <div className="d-flex align-items-center gap-3">

                            <div className="ms-stat-icon">
                                <CheckCircleFill />
                            </div>

                            <div>

                                <div className="ms-stat-value">
                                    {
                                        runningMachines
                                    }
                                </div>

                                <div className="ms-stat-label">
                                    Running Machines
                                </div>

                            </div>

                        </div>

                    </div>

                </Col>


                <Col md={3}>

                    <div className="ms-stat">

                        <div className="d-flex align-items-center gap-3">

                            <div className="ms-stat-icon">
                                <StopCircleFill />
                            </div>

                            <div>

                                <div className="ms-stat-value">
                                    {
                                        unavailableMachines
                                    }
                                </div>

                                <div className="ms-stat-label">
                                    Unavailable Machines
                                </div>

                            </div>

                        </div>

                    </div>

                </Col>


                <Col md={3}>

                    <div className="ms-stat">

                        <div className="d-flex align-items-center gap-3">

                            <div className="ms-stat-icon">
                                <ExclamationTriangleFill />
                            </div>

                            <div>

                                <div className="ms-stat-value">
                                    {
                                        activeAlarms
                                    }
                                </div>

                                <div className="ms-stat-label">
                                    Active Alarms
                                </div>

                            </div>

                        </div>

                    </div>

                </Col>

            </Row>


            {/* =================================================
                MAIN
            ================================================== */}

            <Card className="ms-card">

                <Card.Body>

                    <div className="ms-tabs mb-3">

                        {
                            [
                                [
                                    VIEW_CONFIG,
                                    "Configuration"
                                ],

                                [
                                    VIEW_RULES,
                                    "Mapping Rules"
                                ],

                                [
                                    VIEW_CURRENT,
                                    "Current Status"
                                ],

                                [
                                    VIEW_RUNTIME,
                                    "Runtime History"
                                ],

                                [
                                    VIEW_ALARMS,
                                    "Alarms"
                                ],

                                [
                                    VIEW_REPORT,
                                    "Report"
                                ]

                            ].map(
                                ([
                                    value,
                                    label
                                ]) => (

                                    <button
                                        key={
                                            value
                                        }

                                        type="button"

                                        className={
                                            `ms-tab ${
                                                activeView ===
                                                value
                                                    ? "active"
                                                    : ""
                                            }`
                                        }

                                        onClick={() =>
                                            setActiveView(
                                                value
                                            )
                                        }
                                    >
                                        {label}
                                    </button>
                                )
                            )
                        }

                    </div>


                    {/* =================================================
                        CONFIG
                    ================================================== */}

                    {
                        activeView ===
                        VIEW_CONFIG && (

                            <>

                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">

                                    <div className="ms-search">

                                        <Search />

                                        <Form.Control
                                            placeholder="Search machine, signal, status..."
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
                                        className="ms-btn-primary"
                                        onClick={
                                            openCreateConfig
                                        }
                                    >
                                        <Plus className="me-1" />

                                        Add Configuration
                                    </Button>

                                </div>


                                <div className="ms-table-wrap">

                                    <Table
                                        hover
                                        className="ms-table"
                                    >

                                        <thead>

                                            <tr>

                                                <th>Machine</th>
                                                <th>Primary Signal</th>
                                                <th>Default Status</th>
                                                <th>Stale Timeout</th>
                                                <th>Version</th>
                                                <th>Status</th>
                                                <th>Actions</th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {
                                                configQuery.isLoading
                                                    ? (

                                                        <LoadingRow
                                                            colSpan={7}
                                                            text="Loading Machine Status configuration..."
                                                        />
                                                    )
                                                    : searchedConfigs.length ===
                                                        0
                                                        ? (

                                                            <EmptyRow
                                                                colSpan={7}
                                                                text="No Machine Status configuration found."
                                                            />
                                                        )
                                                        : searchedConfigs.map(
                                                            row => {

                                                                const machine =
                                                                    machineMap.get(
                                                                        String(
                                                                            row.machine_id
                                                                        )
                                                                    );


                                                                const signal =
                                                                    signalMap.get(
                                                                        String(
                                                                            row.primary_signal_id
                                                                        )
                                                                    );


                                                                return (

                                                                    <tr
                                                                        key={
                                                                            row.machine_status_config_id
                                                                        }
                                                                    >

                                                                        <td>
                                                                            <strong>
                                                                                {
                                                                                    machine
                                                                                        ? machineLabel(machine)
                                                                                        : safeText(row.machine_id)
                                                                                }
                                                                            </strong>
                                                                        </td>


                                                                        <td>
                                                                            {
                                                                                signal
                                                                                    ? signalLabel(signal)
                                                                                    : "-"
                                                                            }
                                                                        </td>


                                                                        <td>
                                                                            <StatusBadge
                                                                                status={
                                                                                    row.default_status
                                                                                }
                                                                            />
                                                                        </td>


                                                                        <td>
                                                                            {
                                                                                row.stale_timeout_seconds
                                                                                    ? `${row.stale_timeout_seconds} sec`
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
                                                                                    className="ms-btn-outline"
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
                        RULES
                    ================================================== */}

                    {
                        activeView ===
                        VIEW_RULES && (

                            <>

                                <div className="d-flex justify-content-end mb-3">

                                    <Button
                                        className="ms-btn-primary"
                                        onClick={
                                            openCreateRule
                                        }
                                    >
                                        <Plus className="me-1" />

                                        Add Mapping Rule
                                    </Button>

                                </div>


                                <div className="ms-table-wrap">

                                    <Table
                                        hover
                                        className="ms-table"
                                    >

                                        <thead>

                                            <tr>

                                                <th>Machine</th>
                                                <th>Signal</th>
                                                <th>Match Value</th>
                                                <th>Expression</th>
                                                <th>Result Status</th>
                                                <th>Availability</th>
                                                <th>Mode</th>
                                                <th>Priority</th>
                                                <th>Version</th>
                                                <th>Status</th>
                                                <th>Actions</th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {
                                                rulesQuery.isLoading
                                                    ? (

                                                        <LoadingRow
                                                            colSpan={11}
                                                            text="Loading Status Mapping Rules..."
                                                        />
                                                    )
                                                    : ruleRows.length ===
                                                        0
                                                        ? (

                                                            <EmptyRow
                                                                colSpan={11}
                                                                text="No Status Mapping Rule found."
                                                            />
                                                        )
                                                        : ruleRows.map(
                                                            row => {

                                                                const config =
                                                                    configMap.get(
                                                                        String(
                                                                            row.machine_status_config_id
                                                                        )
                                                                    );


                                                                const machine =
                                                                    config
                                                                        ? machineMap.get(
                                                                            String(
                                                                                config.machine_id
                                                                            )
                                                                        )
                                                                        : null;


                                                                const signal =
                                                                    signalMap.get(
                                                                        String(
                                                                            row.signal_id
                                                                        )
                                                                    );


                                                                return (

                                                                    <tr
                                                                        key={
                                                                            row.status_mapping_rule_id
                                                                        }
                                                                    >

                                                                        <td>
                                                                            {
                                                                                machine
                                                                                    ? machineLabel(machine)
                                                                                    : "-"
                                                                            }
                                                                        </td>


                                                                        <td>
                                                                            {
                                                                                signal
                                                                                    ? signalLabel(signal)
                                                                                    : "-"
                                                                            }
                                                                        </td>


                                                                        <td>
                                                                            {
                                                                                safeText(
                                                                                    row.match_value
                                                                                )
                                                                            }
                                                                        </td>


                                                                        <td
                                                                            title={
                                                                                row.rule_expression ||
                                                                                ""
                                                                            }
                                                                        >
                                                                            {
                                                                                row.rule_expression
                                                                                    ? String(
                                                                                        row.rule_expression
                                                                                    ).slice(
                                                                                        0,
                                                                                        35
                                                                                    )
                                                                                    : "-"
                                                                            }
                                                                        </td>


                                                                        <td>
                                                                            <StatusBadge
                                                                                status={
                                                                                    row.result_status
                                                                                }
                                                                            />
                                                                        </td>


                                                                        <td>
                                                                            <AvailabilityBadge
                                                                                value={
                                                                                    row.is_available
                                                                                }
                                                                            />
                                                                        </td>


                                                                        <td>
                                                                            {
                                                                                safeText(
                                                                                    row.mode_code
                                                                                )
                                                                            }
                                                                        </td>


                                                                        <td>
                                                                            {
                                                                                safeText(
                                                                                    row.priority_no
                                                                                )
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
                                                                                    className="ms-btn-outline"
                                                                                    onClick={() =>
                                                                                        openEditRule(
                                                                                            row
                                                                                        )
                                                                                    }
                                                                                >
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
                                                                                                deactivateRule(
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
                        CURRENT
                    ================================================== */}

                    {
                        activeView ===
                        VIEW_CURRENT && (

                            <>

                                <MachineStatusFilter
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

                                    shifts={
                                        shifts
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


                                <FloorMap records={currentRows} machineMap={machineMap}/><CurrentStatusTable
                                    rows={
                                        currentRows
                                    }

                                    machineMap={
                                        machineMap
                                    }

                                    loading={
                                        currentQuery.isFetching
                                    }
                                />

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

                                <MachineStatusFilter
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

                                    shifts={
                                        shifts
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


                                <EventJourney records={runtimeRows} title="Machine state transitions"/><RuntimeTable
                                    rows={
                                        runtimeRows
                                    }

                                    machineMap={
                                        machineMap
                                    }

                                    signalMap={
                                        signalMap
                                    }

                                    loading={
                                        runtimeQuery.isFetching
                                    }
                                />

                            </>
                        )
                    }


                    {/* =================================================
                        ALARMS
                    ================================================== */}

                    {
                        activeView ===
                        VIEW_ALARMS && (

                            <>

                                <MachineStatusFilter
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

                                    shifts={
                                        shifts
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


                                <AlarmTable
                                    rows={
                                        alarmRows
                                    }

                                    machineMap={
                                        machineMap
                                    }

                                    signalMap={
                                        signalMap
                                    }

                                    loading={
                                        alarmsQuery.isFetching
                                    }

                                    onClearAlarm={
                                        handleClearAlarm
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

                                <MachineStatusFilter
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

                                    shifts={
                                        shifts
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

                                        <div className="ms-stat">

                                            <div className="ms-stat-label">
                                                Total Events
                                            </div>

                                            <div className="ms-stat-value">
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

                                        <div className="ms-stat">

                                            <div className="ms-stat-label">
                                                Available Events
                                            </div>

                                            <div className="ms-stat-value text-success">
                                                {
                                                    Number(
                                                        reportMeta
                                                            ?.availability_counts
                                                            ?.available ||
                                                        0
                                                    )
                                                }
                                            </div>

                                        </div>

                                    </Col>


                                    <Col md={3}>

                                        <div className="ms-stat">

                                            <div className="ms-stat-label">
                                                Unavailable Events
                                            </div>

                                            <div className="ms-stat-value text-danger">
                                                {
                                                    Number(
                                                        reportMeta
                                                            ?.availability_counts
                                                            ?.unavailable ||
                                                        0
                                                    )
                                                }
                                            </div>

                                        </div>

                                    </Col>


                                    <Col md={3}>

                                        <div className="ms-stat">

                                            <div className="ms-stat-label">
                                                Avg Previous State Duration
                                            </div>

                                            <div className="ms-stat-value">
                                                {
                                                    machineStatusService
                                                        .formatDurationSeconds(
                                                            reportMeta.average_previous_status_duration_sec ||
                                                            0
                                                        )
                                                }
                                            </div>

                                        </div>

                                    </Col>

                                </Row>


                                <div className="d-flex justify-content-end mb-3">

                                    <Button
                                        className="ms-btn-outline"
                                        onClick={
                                            handleExport
                                        }
                                    >
                                        Export CSV
                                    </Button>

                                </div>


                                <ReportLens records={reportRows} title="Machine state report explorer"/><RuntimeTable
                                    rows={
                                        reportRows
                                    }

                                    machineMap={
                                        machineMap
                                    }

                                    signalMap={
                                        signalMap
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

                className="ms-modal"
            >

                <Form
                    onSubmit={
                        submitConfig
                    }
                >

                    <Modal.Header closeButton>

                        <Modal.Title>

                            {
                                configForm.machine_status_config_id
                                    ? "Edit Machine Status Configuration"
                                    : "Add Machine Status Configuration"
                            }

                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Row className="g-3">

                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Company *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        configForm.company_id
                                    } disabled={Boolean(configForm.machine_status_config_id)}

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

                                                    primary_signal_id: ""
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
                                                        companyId(item)
                                                    }

                                                    value={
                                                        companyId(item)
                                                    }
                                                >
                                                    {
                                                        companyLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Plant *
                                </Form.Label>


                                <Form.Select
                                    required

                                    disabled={
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

                                                    primary_signal_id: ""
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
                                                        plantId(item)
                                                    }

                                                    value={
                                                        plantId(item)
                                                    }
                                                >
                                                    {
                                                        plantLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Line *
                                </Form.Label>


                                <Form.Select
                                    required

                                    disabled={
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

                                                    primary_signal_id: ""
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
                                                        lineId(item)
                                                    }

                                                    value={
                                                        lineId(item)
                                                    }
                                                >
                                                    {
                                                        lineLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Machine *
                                </Form.Label>


                                <Form.Select
                                    required

                                    disabled={
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

                                                    primary_signal_id: ""
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
                                                        machineId(item)
                                                    }

                                                    value={
                                                        machineId(item)
                                                    }
                                                >
                                                    {
                                                        machineLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={6}>

                                <Form.Label className="ms-label">
                                    Primary Status Signal
                                </Form.Label>


                                <Form.Select
                                    disabled={
                                        !configForm.machine_id ||
                                        signalsQuery.isLoading
                                    }

                                    value={
                                        configForm.primary_signal_id
                                    }

                                    onChange={
                                        event =>
                                            setConfigForm(
                                                old => ({
                                                    ...old,

                                                    primary_signal_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        No Primary Signal
                                    </option>


                                    {
                                        configSignals.map(
                                            item => (

                                                <option
                                                    key={
                                                        signalId(item)
                                                    }

                                                    value={
                                                        signalId(item)
                                                    }
                                                >
                                                    {
                                                        signalLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>


                                <Form.Text>
                                    Signal UUID is stored internally. UI shows Signal Code and PLC address.
                                </Form.Text>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Default Status *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        configForm.default_status
                                    }

                                    onChange={
                                        event =>
                                            setConfigForm(
                                                old => ({
                                                    ...old,

                                                    default_status:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    {
                                        Object.values(
                                            MACHINE_STATUS_CODES
                                        ).map(
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


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Stale Timeout Seconds
                                </Form.Label>


                                <Form.Control
                                    type="number"

                                    min="1"

                                    value={
                                        configForm.stale_timeout_seconds
                                    }

                                    onChange={
                                        event =>
                                            setConfigForm(
                                                old => ({
                                                    ...old,

                                                    stale_timeout_seconds:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Version *
                                </Form.Label>


                                <Form.Control
                                    required

                                    type="number"

                                    min="1"

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

                            className="ms-btn-primary"

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
                RULE MODAL
            ================================================== */}

            <Modal
                show={
                    showRuleModal
                }

                onHide={() =>
                    setShowRuleModal(
                        false
                    )
                }

                centered

                size="xl"

                backdrop="static"

                className="ms-modal"
            >

                <Form
                    onSubmit={
                        submitRule
                    }
                >

                    <Modal.Header closeButton>

                        <Modal.Title>

                            {
                                ruleForm.status_mapping_rule_id
                                    ? "Edit Status Mapping Rule"
                                    : "Add Status Mapping Rule"
                            }

                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Row className="g-3">

                            <Col md={6}>

                                <Form.Label className="ms-label">
                                    Machine Status Configuration *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        ruleForm.machine_status_config_id
                                    }

                                    onChange={
                                        event => {

                                            const config =
                                                configMap.get(
                                                    String(
                                                        event.target.value
                                                    )
                                                );


                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    machine_status_config_id:
                                                        event.target.value,

                                                    company_id:
                                                        config?.company_id ||
                                                        "",

                                                    signal_id:
                                                        ""
                                                })
                                            );
                                        }
                                    }
                                >

                                    <option value="">
                                        Select Configuration
                                    </option>


                                    {
                                        configRows.map(
                                            row => {

                                                const machine =
                                                    machineMap.get(
                                                        String(
                                                            row.machine_id
                                                        )
                                                    );


                                                return (

                                                    <option
                                                        key={
                                                            row.machine_status_config_id
                                                        }

                                                        value={
                                                            row.machine_status_config_id
                                                        }
                                                    >
                                                        {
                                                            machine
                                                                ? machineLabel(machine)
                                                                : row.machine_id
                                                        }

                                                        {" | "}

                                                        {
                                                            row.default_status
                                                        }

                                                        {" | V"}

                                                        {
                                                            row.version_no
                                                        }

                                                    </option>
                                                );
                                            }
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={6}>

                                <Form.Label className="ms-label">
                                    Signal
                                </Form.Label>


                                <Form.Select
                                    disabled={
                                        !selectedRuleConfig
                                    }

                                    value={
                                        ruleForm.signal_id
                                    }

                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    signal_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        No Signal - Use Expression
                                    </option>


                                    {
                                        ruleSignals.map(
                                            item => (

                                                <option
                                                    key={
                                                        signalId(item)
                                                    }

                                                    value={
                                                        signalId(item)
                                                    }
                                                >
                                                    {
                                                        signalLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={4}>

                                <Form.Label className="ms-label">
                                    Match Value
                                </Form.Label>


                                <Form.Control
                                    maxLength={100}

                                    placeholder="Example: 1"

                                    value={
                                        ruleForm.match_value
                                    }

                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    match_value:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={8}>

                                <Form.Label className="ms-label">
                                    Rule Expression
                                </Form.Label>


                                <Form.Control
                                    placeholder="Optional complex expression"

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


                                <Form.Text>
                                    Simple Signal + Match Value rules are resolved directly. Complex expressions are stored for runtime evaluation.
                                </Form.Text>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Result Status *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        ruleForm.result_status
                                    }

                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    result_status:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    {
                                        Object.values(
                                            MACHINE_STATUS_CODES
                                        ).map(
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


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Mode
                                </Form.Label>


                                <Form.Select
                                    value={
                                        ruleForm.mode_code
                                    }

                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    mode_code:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        No Mode
                                    </option>


                                    {
                                        Object.values(
                                            MACHINE_MODE_CODES
                                        ).map(
                                            mode => (

                                                <option
                                                    key={
                                                        mode
                                                    }

                                                    value={
                                                        mode
                                                    }
                                                >
                                                    {mode}
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={2}>

                                <Form.Label className="ms-label">
                                    Priority *
                                </Form.Label>


                                <Form.Control
                                    required

                                    type="number"

                                    min="1"

                                    max="32767"

                                    value={
                                        ruleForm.priority_no
                                    }

                                    onChange={
                                        event =>
                                            setRuleForm(
                                                old => ({
                                                    ...old,

                                                    priority_no:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={2}>

                                <Form.Label className="ms-label">
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

                                <div className="pt-4">

                                    <Form.Check
                                        type="switch"

                                        label="Available"

                                        checked={
                                            ruleForm.is_available
                                        }

                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        is_available:
                                                            event.target.checked
                                                    })
                                                )
                                        }
                                    />

                                </div>

                            </Col>


                            <Col md={2}>

                                <div className="pt-4">

                                    <Form.Check
                                        type="switch"

                                        label="Active"

                                        checked={
                                            ruleForm.is_active
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

                                </div>

                            </Col>

                        </Row>

                    </Modal.Body>


                    <Modal.Footer>

                        <Button
                            variant="outline-secondary"

                            onClick={() =>
                                setShowRuleModal(
                                    false
                                )
                            }
                        >
                            Cancel
                        </Button>


                        <Button
                            type="submit"

                            className="ms-btn-primary"

                            disabled={
                                ruleMutation.isPending
                            }
                        >
                            {
                                ruleMutation.isPending
                                    ? "Saving..."
                                    : "Save Rule"
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

                className="ms-modal"
            >

                <Form
                    onSubmit={
                        submitExecute
                    }
                >

                    <Modal.Header closeButton>

                        <Modal.Title>
                            Record Machine Status
                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Alert variant="light">

                            This form is for manual/frontend testing.
                            Production runtime will later send the same
                            API payload from the Data Logger.

                        </Alert>


                        <Row className="g-3">

                            <Col md={3}>

                                <Form.Label className="ms-label">
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
                                                        event.target.value,

                                                    plant_id: "",

                                                    line_id: "",

                                                    machine_id: "",

                                                    source_signal_mapping_id: ""
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
                                                        companyId(item)
                                                    }

                                                    value={
                                                        companyId(item)
                                                    }
                                                >
                                                    {
                                                        companyLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
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
                                                        event.target.value,

                                                    line_id: "",

                                                    machine_id: "",

                                                    source_signal_mapping_id: ""
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Plant
                                    </option>


                                    {
                                        executePlants.map(
                                            item => (

                                                <option
                                                    key={
                                                        plantId(item)
                                                    }

                                                    value={
                                                        plantId(item)
                                                    }
                                                >
                                                    {
                                                        plantLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
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
                                                        event.target.value,

                                                    machine_id: "",

                                                    source_signal_mapping_id: ""
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Line
                                    </option>


                                    {
                                        executeLines.map(
                                            item => (

                                                <option
                                                    key={
                                                        lineId(item)
                                                    }

                                                    value={
                                                        lineId(item)
                                                    }
                                                >
                                                    {
                                                        lineLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Machine *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        executeForm.machine_id
                                    }

                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,

                                                    machine_id:
                                                        event.target.value,

                                                    source_signal_mapping_id: ""
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Machine
                                    </option>


                                    {
                                        executeMachines.map(
                                            item => (

                                                <option
                                                    key={
                                                        machineId(item)
                                                    }

                                                    value={
                                                        machineId(item)
                                                    }
                                                >
                                                    {
                                                        machineLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Shift *
                                </Form.Label>


                                <Form.Select
                                    required

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
                                >

                                    <option value="">
                                        Select Shift
                                    </option>


                                    {
                                        shifts.map(
                                            item => (

                                                <option
                                                    key={
                                                        shiftId(item)
                                                    }

                                                    value={
                                                        shiftId(item)
                                                    }
                                                >
                                                    {
                                                        shiftLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Status *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        executeForm.status_code
                                    }

                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,

                                                    status_code:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    {
                                        Object.values(
                                            MACHINE_STATUS_CODES
                                        ).map(
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


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Mode
                                </Form.Label>


                                <Form.Select
                                    value={
                                        executeForm.mode
                                    }

                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,

                                                    mode:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        No Mode
                                    </option>


                                    {
                                        Object.values(
                                            MACHINE_MODE_CODES
                                        ).map(
                                            mode => (

                                                <option
                                                    key={
                                                        mode
                                                    }

                                                    value={
                                                        mode
                                                    }
                                                >
                                                    {mode}
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <div className="pt-4">

                                    <Form.Check
                                        type="switch"

                                        label="Machine Available"

                                        checked={
                                            executeForm.is_available
                                        }

                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    old => ({
                                                        ...old,

                                                        is_available:
                                                            event.target.checked
                                                    })
                                                )
                                        }
                                    />

                                </div>

                            </Col>


                            <Col md={6}>

                                <Form.Label className="ms-label">
                                    Source Signal
                                </Form.Label>


                                <Form.Select
                                    value={
                                        executeForm.source_signal_mapping_id
                                    }

                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,

                                                    source_signal_mapping_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        No Source Signal
                                    </option>


                                    {
                                        executeSignals.map(
                                            item => (

                                                <option
                                                    key={
                                                        signalId(item)
                                                    }

                                                    value={
                                                        signalId(item)
                                                    }
                                                >
                                                    {
                                                        signalLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={6}>

                                <Form.Label className="ms-label">
                                    Reason Code
                                </Form.Label>


                                <Form.Control
                                    placeholder="Optional"

                                    value={
                                        executeForm.reason_code
                                    }

                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                old => ({
                                                    ...old,

                                                    reason_code:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label className="ms-label">
                                    Event Time *
                                </Form.Label>


                                <Form.Control
                                    required

                                    type="datetime-local"

                                    step="0.001"

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


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Source System
                                </Form.Label>


                                <Form.Control
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


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Idempotency Key
                                </Form.Label>


                                <Form.Control
                                    placeholder="Auto if blank"

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

                            className="ms-btn-primary"

                            disabled={
                                executeMutation.isPending
                            }
                        >
                            {
                                executeMutation.isPending
                                    ? "Recording..."
                                    : "Record Status"
                            }
                        </Button>

                    </Modal.Footer>

                </Form>

            </Modal>


            {/* =================================================
                ALARM MODAL
            ================================================== */}

            <Modal
                show={
                    showAlarmModal
                }

                onHide={() =>
                    setShowAlarmModal(
                        false
                    )
                }

                centered

                size="xl"

                backdrop="static"

                className="ms-modal"
            >

                <Form
                    onSubmit={
                        submitAlarm
                    }
                >

                    <Modal.Header closeButton>

                        <Modal.Title>
                            Raise Machine Alarm
                        </Modal.Title>

                    </Modal.Header>


                    <Modal.Body>

                        <Row className="g-3">

                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Company *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        alarmForm.company_id
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
                                                old => ({
                                                    ...old,

                                                    company_id:
                                                        event.target.value,

                                                    plant_id: "",

                                                    line_id: "",

                                                    machine_id: "",

                                                    signal_id: ""
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
                                                        companyId(item)
                                                    }

                                                    value={
                                                        companyId(item)
                                                    }
                                                >
                                                    {
                                                        companyLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Plant *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        alarmForm.plant_id
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
                                                old => ({
                                                    ...old,

                                                    plant_id:
                                                        event.target.value,

                                                    line_id: "",

                                                    machine_id: "",

                                                    signal_id: ""
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Plant
                                    </option>


                                    {
                                        alarmPlants.map(
                                            item => (

                                                <option
                                                    key={
                                                        plantId(item)
                                                    }

                                                    value={
                                                        plantId(item)
                                                    }
                                                >
                                                    {
                                                        plantLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Line *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        alarmForm.line_id
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
                                                old => ({
                                                    ...old,

                                                    line_id:
                                                        event.target.value,

                                                    machine_id: "",

                                                    signal_id: ""
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Line
                                    </option>


                                    {
                                        alarmLines.map(
                                            item => (

                                                <option
                                                    key={
                                                        lineId(item)
                                                    }

                                                    value={
                                                        lineId(item)
                                                    }
                                                >
                                                    {
                                                        lineLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Machine *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        alarmForm.machine_id
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
                                                old => ({
                                                    ...old,

                                                    machine_id:
                                                        event.target.value,

                                                    signal_id: ""
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Machine
                                    </option>


                                    {
                                        alarmMachines.map(
                                            item => (

                                                <option
                                                    key={
                                                        machineId(item)
                                                    }

                                                    value={
                                                        machineId(item)
                                                    }
                                                >
                                                    {
                                                        machineLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={3}>

                                <Form.Label className="ms-label">
                                    Shift *
                                </Form.Label>


                                <Form.Select
                                    required

                                    value={
                                        alarmForm.shift_id
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
                                                old => ({
                                                    ...old,

                                                    shift_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Shift
                                    </option>


                                    {
                                        shifts.map(
                                            item => (

                                                <option
                                                    key={
                                                        shiftId(item)
                                                    }

                                                    value={
                                                        shiftId(item)
                                                    }
                                                >
                                                    {
                                                        shiftLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={5}>

                                <Form.Label className="ms-label">
                                    Signal
                                </Form.Label>


                                <Form.Select
                                    value={
                                        alarmForm.signal_id
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
                                                old => ({
                                                    ...old,

                                                    signal_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        No Alarm Signal
                                    </option>


                                    {
                                        alarmSignals.map(
                                            item => (

                                                <option
                                                    key={
                                                        signalId(item)
                                                    }

                                                    value={
                                                        signalId(item)
                                                    }
                                                >
                                                    {
                                                        signalLabel(item)
                                                    }
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={4}>

                                <Form.Label className="ms-label">
                                    Severity
                                </Form.Label>


                                <Form.Select
                                    value={
                                        alarmForm.severity
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
                                                old => ({
                                                    ...old,

                                                    severity:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    {
                                        Object.values(
                                            ALARM_SEVERITIES
                                        ).map(
                                            severity => (

                                                <option
                                                    key={
                                                        severity
                                                    }

                                                    value={
                                                        severity
                                                    }
                                                >
                                                    {severity}
                                                </option>
                                            )
                                        )
                                    }

                                </Form.Select>

                            </Col>


                            <Col md={4}>

                                <Form.Label className="ms-label">
                                    Alarm Code *
                                </Form.Label>


                                <Form.Control
                                    required

                                    maxLength={80}

                                    placeholder="Example: MOTOR_OVERLOAD"

                                    value={
                                        alarmForm.alarm_code
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
                                                old => ({
                                                    ...old,

                                                    alarm_code:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={8}>

                                <Form.Label className="ms-label">
                                    Alarm Message
                                </Form.Label>


                                <Form.Control
                                    maxLength={500}

                                    placeholder="Alarm description"

                                    value={
                                        alarmForm.alarm_message
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
                                                old => ({
                                                    ...old,

                                                    alarm_message:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label className="ms-label">
                                    Start Time *
                                </Form.Label>


                                <Form.Control
                                    required

                                    type="datetime-local"

                                    step="0.001"

                                    value={
                                        alarmForm.start_ts
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
                                                old => ({
                                                    ...old,

                                                    start_ts:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Label className="ms-label">
                                    Idempotency Key
                                </Form.Label>


                                <Form.Control
                                    placeholder="Generated automatically if blank"

                                    value={
                                        alarmForm.idempotency_key
                                    }

                                    onChange={
                                        event =>
                                            setAlarmForm(
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
                                setShowAlarmModal(
                                    false
                                )
                            }
                        >
                            Cancel
                        </Button>


                        <Button
                            type="submit"

                            variant="danger"

                            disabled={
                                alarmMutation.isPending
                            }
                        >
                            {
                                alarmMutation.isPending
                                    ? "Raising..."
                                    : "Raise Alarm"
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

const MachineStatusFilter = ({
    filters,
    setFilters,
    companies,
    machines,
    shifts,
    onApply,
    onClear
}) => (

    <div className="ms-filter">

        <Row className="g-2">

            <Col md={3}>

                <Form.Label className="ms-label">
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
                                        companyId(item)
                                    }

                                    value={
                                        companyId(item)
                                    }
                                >
                                    {
                                        companyLabel(item)
                                    }
                                </option>
                            )
                        )
                    }

                </Form.Select>

            </Col>


            <Col md={3}>

                <Form.Label className="ms-label">
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
                                        machineId(item)
                                    }

                                    value={
                                        machineId(item)
                                    }
                                >
                                    {
                                        machineLabel(item)
                                    }
                                </option>
                            )
                        )
                    }

                </Form.Select>

            </Col>


            <Col md={2}>

                <Form.Label className="ms-label">
                    Shift
                </Form.Label>


                <Form.Select
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
                >

                    <option value="">
                        All Shifts
                    </option>


                    {
                        shifts.map(
                            item => (

                                <option
                                    key={
                                        shiftId(item)
                                    }

                                    value={
                                        shiftId(item)
                                    }
                                >
                                    {
                                        shiftLabel(item)
                                    }
                                </option>
                            )
                        )
                    }

                </Form.Select>

            </Col>


            <Col md={2}>

                <Form.Label className="ms-label">
                    Status
                </Form.Label>


                <Form.Select
                    value={
                        filters.status_code
                    }

                    onChange={
                        event =>
                            setFilters(
                                old => ({
                                    ...old,

                                    status_code:
                                        event.target.value
                                })
                            )
                    }
                >

                    <option value="">
                        All Status
                    </option>


                    {
                        Object.values(
                            MACHINE_STATUS_CODES
                        ).map(
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


            <Col md={2}>

                <Form.Label className="ms-label">
                    Availability
                </Form.Label>


                <Form.Select
                    value={
                        filters.is_available
                    }

                    onChange={
                        event =>
                            setFilters(
                                old => ({
                                    ...old,

                                    is_available:
                                        event.target.value
                                })
                            )
                    }
                >

                    <option value="">
                        All
                    </option>

                    <option value="true">
                        Available
                    </option>

                    <option value="false">
                        Unavailable
                    </option>

                </Form.Select>

            </Col>


            <Col md={3}>

                <Form.Label className="ms-label">
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

                <Form.Label className="ms-label">
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
                md={6}
                className="d-flex align-items-end justify-content-end gap-2"
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
                    className="ms-btn-primary"

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
// CURRENT STATUS TABLE
// ============================================================

const CurrentStatusTable = ({
    rows,
    machineMap,
    loading
}) => (

    <div className="ms-table-wrap">

        <Table
            hover
            className="ms-table"
        >

            <thead>

                <tr>

                    <th>Machine</th>
                    <th>Current Status</th>
                    <th>Availability</th>
                    <th>Mode</th>
                    <th>Shift</th>
                    <th>Previous Status</th>
                    <th>Status Since</th>
                    <th>Source</th>

                </tr>

            </thead>


            <tbody>

                {
                    loading
                        ? (

                            <LoadingRow
                                colSpan={8}
                                text="Loading current Machine Status..."
                            />
                        )
                        : rows.length ===
                            0
                            ? (

                                <EmptyRow
                                    colSpan={8}
                                    text="No current Machine Status found."
                                />
                            )
                            : rows.map(
                                row => {

                                    const machine =
                                        machineMap.get(
                                            String(
                                                row.machine_id
                                            )
                                        );


                                    return (

                                        <tr
                                            key={
                                                row.machine_status_event_id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        machine
                                                            ? machineLabel(machine)
                                                            : safeText(row.machine_id)
                                                    }
                                                </strong>
                                            </td>


                                            <td>
                                                <StatusBadge
                                                    status={
                                                        row.status_code
                                                    }
                                                />
                                            </td>


                                            <td>
                                                <AvailabilityBadge
                                                    value={
                                                        row.is_available
                                                    }
                                                />
                                            </td>


                                            <td>
                                                {
                                                    safeText(
                                                        row.mode
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
                                                    row.previous_status_code
                                                        ? (
                                                            <StatusBadge
                                                                status={
                                                                    row.previous_status_code
                                                                }
                                                            />
                                                        )
                                                        : "-"
                                                }
                                            </td>


                                            <td>
                                                {
                                                    displayDateTime(
                                                        row.event_ts
                                                    )
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
                }

            </tbody>

        </Table>

    </div>
);


// ============================================================
// RUNTIME TABLE
// ============================================================

const RuntimeTable = ({
    rows,
    machineMap,
    signalMap,
    loading
}) => (

    <div className="ms-table-wrap">

        <Table
            hover
            className="ms-table"
        >

            <thead>

                <tr>

                    <th>Event Time</th>
                    <th>Machine</th>
                    <th>Status</th>
                    <th>Previous</th>
                    <th>Duration</th>
                    <th>Availability</th>
                    <th>Mode</th>
                    <th>Signal</th>
                    <th>Reason</th>
                    <th>Shift</th>
                    <th>Source</th>

                </tr>

            </thead>


            <tbody>

                {
                    loading
                        ? (

                            <LoadingRow
                                colSpan={11}
                                text="Loading Machine Status events..."
                            />
                        )
                        : rows.length ===
                            0
                            ? (

                                <EmptyRow
                                    colSpan={11}
                                    text="No Machine Status events found."
                                />
                            )
                            : rows.map(
                                row => {

                                    const machine =
                                        machineMap.get(
                                            String(
                                                row.machine_id
                                            )
                                        );


                                    const signal =
                                        signalMap.get(
                                            String(
                                                row.source_signal_mapping_id
                                            )
                                        );


                                    return (

                                        <tr
                                            key={
                                                row.machine_status_event_id
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
                                                <strong>
                                                    {
                                                        machine
                                                            ? machineLabel(machine)
                                                            : safeText(row.machine_id)
                                                    }
                                                </strong>
                                            </td>


                                            <td>
                                                <StatusBadge
                                                    status={
                                                        row.status_code
                                                    }
                                                />
                                            </td>


                                            <td>
                                                {
                                                    row.previous_status_code
                                                        ? (
                                                            <StatusBadge
                                                                status={
                                                                    row.previous_status_code
                                                                }
                                                            />
                                                        )
                                                        : "-"
                                                }
                                            </td>


                                            <td>
                                                {
                                                    machineStatusService
                                                        .formatDurationSeconds(
                                                            row.duration_sec
                                                        )
                                                }
                                            </td>


                                            <td>
                                                <AvailabilityBadge
                                                    value={
                                                        row.is_available
                                                    }
                                                />
                                            </td>


                                            <td>
                                                {
                                                    safeText(
                                                        row.mode
                                                    )
                                                }
                                            </td>


                                            <td>
                                                {
                                                    signal
                                                        ? signalLabel(signal)
                                                        : "-"
                                                }
                                            </td>


                                            <td>
                                                {
                                                    safeText(
                                                        row.reason_code
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
// ALARM TABLE
// ============================================================

const AlarmTable = ({
    rows,
    machineMap,
    signalMap,
    loading,
    onClearAlarm
}) => (

    <div className="ms-table-wrap">

        <Table
            hover
            className="ms-table"
        >

            <thead>

                <tr>

                    <th>Machine</th>
                    <th>Alarm Code</th>
                    <th>Message</th>
                    <th>Severity</th>
                    <th>Signal</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Action</th>

                </tr>

            </thead>


            <tbody>

                {
                    loading
                        ? (

                            <LoadingRow
                                colSpan={9}
                                text="Loading alarms..."
                            />
                        )
                        : rows.length ===
                            0
                            ? (

                                <EmptyRow
                                    colSpan={9}
                                    text="No alarm events found."
                                />
                            )
                            : rows.map(
                                row => {

                                    const machine =
                                        machineMap.get(
                                            String(
                                                row.machine_id
                                            )
                                        );


                                    const signal =
                                        signalMap.get(
                                            String(
                                                row.signal_id
                                            )
                                        );


                                    return (

                                        <tr
                                            key={
                                                row.alarm_id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        machine
                                                            ? machineLabel(machine)
                                                            : safeText(row.machine_id)
                                                    }
                                                </strong>
                                            </td>


                                            <td>
                                                <strong>
                                                    {
                                                        safeText(
                                                            row.alarm_code
                                                        )
                                                    }
                                                </strong>
                                            </td>


                                            <td>
                                                {
                                                    safeText(
                                                        row.alarm_message
                                                    )
                                                }
                                            </td>


                                            <td>
                                                <Badge
                                                    bg={
                                                        String(
                                                            row.severity ||
                                                            ""
                                                        ).toUpperCase() ===
                                                        "CRITICAL"
                                                            ? "danger"
                                                            : String(
                                                                row.severity ||
                                                                ""
                                                            ).toUpperCase() ===
                                                            "HIGH"
                                                                ? "warning"
                                                                : "secondary"
                                                    }
                                                >
                                                    {
                                                        safeText(
                                                            row.severity
                                                        )
                                                    }
                                                </Badge>
                                            </td>


                                            <td>
                                                {
                                                    signal
                                                        ? signalLabel(signal)
                                                        : "-"
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

                                                {
                                                    row.end_ts
                                                        ? (
                                                            <Badge bg="success">
                                                                CLEARED
                                                            </Badge>
                                                        )
                                                        : (
                                                            <Badge bg="danger">
                                                                ACTIVE
                                                            </Badge>
                                                        )
                                                }

                                            </td>


                                            <td>

                                                {
                                                    !row.end_ts
                                                        ? (

                                                            <Button
                                                                size="sm"
                                                                variant="outline-success"
                                                                onClick={() =>
                                                                    onClearAlarm(
                                                                        row
                                                                    )
                                                                }
                                                            >
                                                                Clear
                                                            </Button>
                                                        )
                                                        : "-"
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
// LOADING ROW
// ============================================================

const LoadingRow = ({
    colSpan,
    text
}) => (

    <tr>

        <td
            colSpan={
                colSpan
            }
            className="ms-empty"
        >
            <Spinner
                size="sm"
                animation="border"
                className="me-2"
            />

            {text}
        </td>

    </tr>
);


// ============================================================
// EMPTY ROW
// ============================================================

const EmptyRow = ({
    colSpan,
    text
}) => (

    <tr>

        <td
            colSpan={
                colSpan
            }
            className="ms-empty"
        >
            {text}
        </td>

    </tr>
);


// ============================================================
// EXPORT
// ============================================================

export default MachineStatus;