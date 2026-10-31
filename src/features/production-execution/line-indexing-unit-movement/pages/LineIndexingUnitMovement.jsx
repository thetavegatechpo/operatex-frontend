import ReportLens from '../../../../shared/operations/ReportLens.jsx';
import EventJourney from '../../../../shared/operations/EventJourney.jsx';
import FloorMap from '../../../../shared/operations/FloorMap.jsx';

import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/LineIndexingUnitMovement/LineIndexingUnitMovement.jsx

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
    ArrowRight,
    CheckCircleFill,
    Diagram3Fill,
    GeoAltFill,
    PencilSquare,
    PlayFill,
    Plus,
    Search
} from "react-bootstrap-icons";

import {
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";

import api from "../../../../shared/api/client.js";

import signalService from "../../../master-data/signal-mapping/api/signal.service.js";

import lineIndexingUnitMovementService, {
    INDEXING_RESULT_STATUS,
    INDEXING_TRIGGER_SOURCES,
    INDEXING_TRIGGER_TYPES,
    UNIT_POSITION_STATUS,

    createIndexingRule,
    deleteIndexingRule,
    executeUnitMovement,
    getIndexingRuleMaster,
    getMovementReport,
    getMovementRuntime,
    getPlanEntriesForMachineShift,
    getPositionReport,
    getUnitPositions,
    initializeUnitPosition,
    updateIndexingRule
} from "../api/lineIndexingUnitMovement.service.js";


// ============================================================
// VIEW CONSTANTS
// ============================================================

const VIEW_CONFIG =
    "CONFIG";

const VIEW_POSITION =
    "POSITION";

const VIEW_MOVEMENT =
    "MOVEMENT";

const VIEW_HISTORY =
    "HISTORY";

const VIEW_REPORT =
    "REPORT";


// ============================================================
// INITIAL FORMS
// ============================================================

const indexingRuleInitialState = {

    indexing_rule_config_id: "",

    company_id: "",
    plant_id: "",
    line_id: "",

    from_route_step_id: "",
    to_route_step_id: "",

    from_station_id: "",
    to_station_id: "",

    trigger_signal_id: "",
    trigger_type: "MANUAL",

    required_result_status: "OK",

    rule_expression: "",

    priority_no: 100,

    is_active: true,

    version_no: 1
};


const initializePositionInitialState = {

    unit_id: "",

    company_id: "",
    plant_id: "",
    line_id: "",

    current_machine_id: "",
    current_station_id: "",
    current_route_step_id: "",

    current_plan_entry_id: "",

    position_status: "IN_PROCESS",

    position_updated_at: ""
};


const movementInitialState = {

    company_id: "",
    plant_id: "",
    line_id: "",

    machine_id: "",
    shift_id: "",

    unit_id: "",

    indexing_rule_config_id: "",

    from_route_step_id: "",
    from_station_id: "",
    from_plan_entry_id: "",

    to_route_step_id: "",
    to_station_id: "",
    to_machine_id: "",
    to_plan_entry_id: "",

    trigger_signal_id: "",

    trigger_type: "MANUAL",
    trigger_source: "MES_UI",

    result_status: "OK",

    rule_expression_result: false,

    position_status: "IN_PROCESS",

    event_ts: "",

    correlation_id: "",
    idempotency_key: ""
};


const filterInitialState = {

    company_id: "",
    plant_id: "",
    line_id: "",

    machine_id: "",
    shift_id: "",

    unit_id: "",

    from_route_step_id: "",
    to_route_step_id: "",

    result_status: "",

    position_status: "",

    from_timestamp: "",
    to_timestamp: ""
};


// ============================================================
// GENERIC HELPERS
// ============================================================

const hasValue =
    value =>
        value !== undefined &&
        value !== null &&
        value !== "";


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


const boolValue =
    value => {

        if (
            value === true ||
            value === 1 ||
            value === "1"
        ) {

            return true;
        }


        return String(
            value
        )
            .toLowerCase() ===
            "true";
    };


const safeText =
    value =>
        hasValue(value)
            ? String(value)
            : "-";


const getErrorMessage =
    (
        error,
        fallback
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
            } ${response.errors.join(", ")}`;
        }


        return (
            response?.message ||
            error?.message ||
            fallback
        );
    };


// ============================================================
// UUID GENERATOR
// ============================================================

const generateUuid =
    () => {

        if (
            typeof crypto !==
                "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ) {

            return crypto.randomUUID();
        }


        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
            .replace(
                /[xy]/g,
                character => {

                    const random =
                        Math.random() *
                        16 |
                        0;


                    const value =
                        character === "x"
                            ? random
                            : (
                                random &
                                0x3 |
                                0x8
                            );


                    return value
                        .toString(16);
                }
            );
    };


// ============================================================
// DATE HELPERS
// ============================================================

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
                19
            );
    };


const nowLocalDateTime =
    () =>
        toLocalDateTime(
            new Date()
        );


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


// ============================================================
// RESPONSE EXTRACTION
// ============================================================

const extractRows =
    (
        response,
        keys = []
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
                const key of keys
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

            const direct =
                value.filter(
                    item =>
                        item &&
                        typeof item ===
                            "object" &&
                        predicate(item)
                );


            if (
                direct.length
            ) {

                return direct;
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
// MASTER HELPERS
// ============================================================

const companyId =
    item =>
        item?.company_id ??
        item?.companyId ??
        "";


const companyLabel =
    item =>
        item?.company_name ??
        item?.company_code ??
        item?.companyName ??
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
        item?.line_code ??
        lineId(item);


const machineId =
    item =>
        item?.machine_id ??
        item?.machineId ??
        "";


const machineLabel =
    item =>
        item?.machine_name ??
        item?.machine_code ??
        item?.asset_name ??
        machineId(item);


const stationId =
    item =>
        item?.station_id ??
        item?.stationId ??
        "";


const stationLabel =
    item =>
        item?.station_name ??
        item?.station_code ??
        item?.stage_name ??
        stationId(item);


const routeStepId =
    item =>
        item?.route_step_id ??
        item?.routeStepId ??
        "";


const routeStepLabel =
    item => {

        if (!item) {
            return "-";
        }


        const code =
            item?.stage_code ??
            item?.route_step_code ??
            item?.step_code ??
            item?.stage_no ??
            "";


        const name =
            item?.stage_name ??
            item?.route_step_name ??
            item?.step_name ??
            item?.operation_name ??
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
            routeStepId(item)
        );
    };


const signalId =
    item =>
        item?.signal_mapping_id ??
        item?.signalMappingId ??
        "";


const signalLabel =
    item => {

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


const shiftId =
    item =>
        item?.shift_id ??
        item?.shiftId ??
        "";


const shiftLabel =
    item => {

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


const planEntryId =
    item =>
        item?.plan_entry_id ??
        "";


const planEntryLabel =
    item => {

        if (!item) {
            return "-";
        }


        const sequence =
            item?.sequence_no
                ? `Seq ${item.sequence_no}`
                : "";


        const target =
            hasValue(
                item?.target_qty
            )
                ? `Qty ${item.target_qty}`
                : "";


        const status =
            item?.status ||
            "";


        return [
            sequence,
            target,
            status
        ]
            .filter(Boolean)
            .join(" | ") ||
            planEntryId(item);
    };


// ============================================================
// BADGES
// ============================================================

const PositionStatusBadge =
    ({
        status
    }) => {

        const value =
            String(
                status ||
                "UNKNOWN"
            )
                .toUpperCase();


        let bg =
            "secondary";


        if (
            value ===
            "IN_PROCESS"
        ) {

            bg =
                "primary";
        }
        else if (
            value ===
            "WAITING"
        ) {

            bg =
                "warning";
        }
        else if (
            value ===
            "HOLD"
        ) {

            bg =
                "danger";
        }
        else if (
            value ===
            "COMPLETED"
        ) {

            bg =
                "success";
        }
        else if (
            value ===
            "REWORK"
        ) {

            bg =
                "info";
        }
        else if (
            value ===
            "REJECTED"
        ) {

            bg =
                "danger";
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
                {
                    value
                        .replace(
                            /_/g,
                            " "
                        )
                }
            </Badge>
        );
    };


const ResultBadge =
    ({
        status
    }) => {

        const value =
            String(
                status ||
                "UNKNOWN"
            )
                .toUpperCase();


        let bg =
            "secondary";


        if (
            value === "OK"
        ) {

            bg =
                "success";
        }
        else if (
            value === "NOK"
        ) {

            bg =
                "danger";
        }
        else if (
            value === "BYPASS"
        ) {

            bg =
                "warning";
        }


        return (

            <Badge
                bg={bg}
                text={
                    bg ===
                    "warning"
                        ? "dark"
                        : undefined
                }
            >
                {value}
            </Badge>
        );
    };


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


// ============================================================
// PAGE
// ============================================================

const LineIndexingUnitMovement =
    () => {

        const queryClient =
            useQueryClient();


        // ====================================================
        // MAIN STATE
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
            showRuleModal,
            setShowRuleModal
        ] =
            useState(false);


        const [
            showInitializeModal,
            setShowInitializeModal
        ] =
            useState(false);


        const [
            showMovementModal,
            setShowMovementModal
        ] =
            useState(false);


        // ====================================================
        // FORMS
        // ====================================================

        const [
            ruleForm,
            setRuleForm
        ] =
            useState(
                indexingRuleInitialState
            );


        const [
            initializeForm,
            setInitializeForm
        ] =
            useState(
                initializePositionInitialState
            );


        const [
            movementForm,
            setMovementForm
        ] =
            useState(
                movementInitialState
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


        // ====================================================
        // COMPANY
        // ====================================================

        const companiesQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
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
                    "line-indexing",
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
                    "line-indexing",
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
                    "line-indexing",
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
        // STATION
        // ====================================================

        const stationsQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
                    "stations"
                ],

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/route-station-master/station-master"
                            );


                        let rows =
                            extractRows(
                                response,
                                [
                                    "station_master",
                                    "stations",
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
                                            stationId(
                                                item
                                            )
                                        )
                                );
                        }


                        return rows;
                    }
            });


        // ====================================================
        // ROUTE STEP
        // ====================================================

        const routeStepsQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
                    "route-steps"
                ],

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/route-station-master/config/step"
                            );


                        let rows =
                            extractRows(
                                response,
                                [
                                    "route_steps",
                                    "route_step",
                                    "steps",
                                    "config"
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
                                            routeStepId(
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
                                    routeStepId(
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
        // SIGNAL
        // ====================================================

        const signalsQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
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


                        return rows;
                    }
            });


        // ====================================================
        // SHIFT
        // ====================================================

        const shiftsQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
                    "shifts"
                ],

                queryFn:
                    async () => {

                        const response =
                            await api.get(
                                "/shift-plan/config"
                            );


                        const rows =
                            findRowsRecursive(
                                response,
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


        // ====================================================
        // INDEXING RULE CONFIG
        // ====================================================

        const rulesQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
                    "rules"
                ],

                queryFn:
                    () =>
                        getIndexingRuleMaster()
            });


        const ruleRows =
            lineIndexingUnitMovementService
                .getIndexingRuleRows(
                    rulesQuery.data
                );


        // ====================================================
        // CURRENT POSITIONS
        // ====================================================

        const positionsQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
                    "positions",
                    appliedFilters
                ],

                queryFn:
                    () =>
                        getUnitPositions({

                            company_id:
                                appliedFilters.company_id,

                            plant_id:
                                appliedFilters.plant_id,

                            line_id:
                                appliedFilters.line_id,

                            current_machine_id:
                                appliedFilters.machine_id,

                            current_route_step_id:
                                appliedFilters.to_route_step_id,

                            position_status:
                                appliedFilters.position_status,

                            unit_id:
                                appliedFilters.unit_id
                        }),

                enabled:
                    activeView ===
                    VIEW_POSITION ||
                    activeView ===
                    VIEW_MOVEMENT ||
                    activeView ===
                    VIEW_REPORT
            });


        const positionRows =
            lineIndexingUnitMovementService
                .getUnitPositionRows(
                    positionsQuery.data
                );


        // ====================================================
        // MOVEMENT HISTORY
        // ====================================================

        const historyQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
                    "runtime",
                    appliedFilters
                ],

                queryFn:
                    () =>
                        getMovementRuntime({

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

                            unit_id:
                                appliedFilters.unit_id,

                            from_route_step_id:
                                appliedFilters.from_route_step_id,

                            to_route_step_id:
                                appliedFilters.to_route_step_id,

                            result_status:
                                appliedFilters.result_status,

                            from_timestamp:
                                appliedFilters.from_timestamp,

                            to_timestamp:
                                appliedFilters.to_timestamp
                        }),

                enabled:
                    activeView ===
                    VIEW_HISTORY ||
                    activeView ===
                    VIEW_REPORT
            });


        const historyRows =
            lineIndexingUnitMovementService
                .getStationIndexEventRows(
                    historyQuery.data
                );


        // ====================================================
        // REPORT
        // ====================================================

        const movementReportQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
                    "movement-report",
                    appliedFilters
                ],

                queryFn:
                    () =>
                        getMovementReport({

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

                            unit_id:
                                appliedFilters.unit_id,

                            from_route_step_id:
                                appliedFilters.from_route_step_id,

                            to_route_step_id:
                                appliedFilters.to_route_step_id,

                            result_status:
                                appliedFilters.result_status,

                            from_timestamp:
                                appliedFilters.from_timestamp,

                            to_timestamp:
                                appliedFilters.to_timestamp
                        }),

                enabled:
                    activeView ===
                    VIEW_REPORT
            });


        const positionReportQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
                    "position-report",
                    appliedFilters
                ],

                queryFn:
                    () =>
                        getPositionReport({

                            company_id:
                                appliedFilters.company_id,

                            plant_id:
                                appliedFilters.plant_id,

                            line_id:
                                appliedFilters.line_id,

                            current_machine_id:
                                appliedFilters.machine_id,

                            position_status:
                                appliedFilters.position_status,

                            unit_id:
                                appliedFilters.unit_id
                        }),

                enabled:
                    activeView ===
                    VIEW_REPORT
            });


        // ====================================================
        // PLAN ENTRY FOR MOVEMENT
        // ====================================================

        const planEntriesQuery =
            useQuery({

                queryKey: [
                    "line-indexing",
                    "plan-entries",
                    movementForm.company_id,
                    movementForm.to_machine_id,
                    movementForm.shift_id
                ],

                queryFn:
                    () =>
                        getPlanEntriesForMachineShift({

                            company_id:
                                movementForm.company_id,

                            machine_id:
                                movementForm.to_machine_id,

                            shift_id:
                                movementForm.shift_id
                        }),

                enabled:
                    Boolean(
                        showMovementModal &&
                        movementForm.company_id &&
                        movementForm.to_machine_id &&
                        movementForm.shift_id
                    )
            });


        const planEntries =
            lineIndexingUnitMovementService
                .getPlanEntryRows(
                    planEntriesQuery.data
                );


        // ====================================================
        // MASTER DATA
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


        const stations =
            stationsQuery.data ||
            [];


        const routeSteps =
            routeStepsQuery.data ||
            [];


        const signals =
            signalsQuery.data ||
            [];


        const shifts =
            shiftsQuery.data ||
            [];


        // ====================================================
        // MAPS
        // ====================================================

        const routeStepMap =
            useMemo(
                () =>
                    new Map(
                        routeSteps.map(
                            item => [
                                String(
                                    routeStepId(
                                        item
                                    )
                                ),
                                item
                            ]
                        )
                    ),
                [
                    routeSteps
                ]
            );


        const stationMap =
            useMemo(
                () =>
                    new Map(
                        stations.map(
                            item => [
                                String(
                                    stationId(
                                        item
                                    )
                                ),
                                item
                            ]
                        )
                    ),
                [
                    stations
                ]
            );


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
        // CONFIG CASCADE
        // ====================================================

        const configPlants =
            useMemo(
                () =>
                    plants.filter(
                        item =>
                            !ruleForm.company_id ||
                            !companyId(item) ||
                            sameId(
                                companyId(item),
                                ruleForm.company_id
                            )
                    ),
                [
                    plants,
                    ruleForm.company_id
                ]
            );


        const configLines =
            useMemo(
                () =>
                    lines.filter(
                        item =>
                            !ruleForm.plant_id ||
                            !plantId(item) ||
                            sameId(
                                plantId(item),
                                ruleForm.plant_id
                            )
                    ),
                [
                    lines,
                    ruleForm.plant_id
                ]
            );


        const configRouteSteps =
            useMemo(
                () =>
                    routeSteps.filter(
                        item => {

                            if (
                                ruleForm.company_id &&
                                item.company_id &&
                                !sameId(
                                    item.company_id,
                                    ruleForm.company_id
                                )
                            ) {

                                return false;
                            }


                            if (
                                ruleForm.plant_id &&
                                item.plant_id &&
                                !sameId(
                                    item.plant_id,
                                    ruleForm.plant_id
                                )
                            ) {

                                return false;
                            }


                            if (
                                ruleForm.line_id &&
                                item.line_id &&
                                !sameId(
                                    item.line_id,
                                    ruleForm.line_id
                                )
                            ) {

                                return false;
                            }


                            return true;
                        }
                    ),
                [
                    routeSteps,
                    ruleForm.company_id,
                    ruleForm.plant_id,
                    ruleForm.line_id
                ]
            );


        const configStations =
            useMemo(
                () =>
                    stations.filter(
                        item => {

                            if (
                                ruleForm.line_id &&
                                item.line_id &&
                                !sameId(
                                    item.line_id,
                                    ruleForm.line_id
                                )
                            ) {

                                return false;
                            }


                            return true;
                        }
                    ),
                [
                    stations,
                    ruleForm.line_id
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
                                    ruleForm.trigger_signal_id
                                );


                            if (
                                hasValue(
                                    item.is_active
                                ) &&
                                !boolValue(
                                    item.is_active
                                ) &&
                                !selected
                            ) {

                                return false;
                            }


                            if (
                                ruleForm.company_id &&
                                item.company_id &&
                                !sameId(
                                    item.company_id,
                                    ruleForm.company_id
                                )
                            ) {

                                return false;
                            }


                            if (
                                ruleForm.plant_id &&
                                item.plant_id &&
                                !sameId(
                                    item.plant_id,
                                    ruleForm.plant_id
                                )
                            ) {

                                return false;
                            }


                            if (
                                ruleForm.line_id &&
                                item.line_id &&
                                !sameId(
                                    item.line_id,
                                    ruleForm.line_id
                                )
                            ) {

                                return false;
                            }


                            return true;
                        }
                    ),
                [
                    signals,
                    ruleForm.company_id,
                    ruleForm.plant_id,
                    ruleForm.line_id,
                    ruleForm.trigger_signal_id
                ]
            );


        // ====================================================
        // INITIALIZATION CASCADE
        // ====================================================

        const initializePlants =
            plants.filter(
                item =>
                    !initializeForm.company_id ||
                    !companyId(item) ||
                    sameId(
                        companyId(item),
                        initializeForm.company_id
                    )
            );


        const initializeLines =
            lines.filter(
                item =>
                    !initializeForm.plant_id ||
                    !plantId(item) ||
                    sameId(
                        plantId(item),
                        initializeForm.plant_id
                    )
            );


        const initializeMachines =
            machines.filter(
                item =>
                    !initializeForm.line_id ||
                    !lineId(item) ||
                    sameId(
                        lineId(item),
                        initializeForm.line_id
                    )
            );


        const initializeStations =
            stations.filter(
                item =>
                    !initializeForm.line_id ||
                    !item.line_id ||
                    sameId(
                        item.line_id,
                        initializeForm.line_id
                    )
            );


        const initializeRouteSteps =
            routeSteps.filter(
                item =>
                    !initializeForm.line_id ||
                    !item.line_id ||
                    sameId(
                        item.line_id,
                        initializeForm.line_id
                    )
            );


        // ====================================================
        // MOVEMENT CASCADE
        // ====================================================

        const movementPlants =
            plants.filter(
                item =>
                    !movementForm.company_id ||
                    !companyId(item) ||
                    sameId(
                        companyId(item),
                        movementForm.company_id
                    )
            );


        const movementLines =
            lines.filter(
                item =>
                    !movementForm.plant_id ||
                    !plantId(item) ||
                    sameId(
                        plantId(item),
                        movementForm.plant_id
                    )
            );


        const movementMachines =
            machines.filter(
                item =>
                    !movementForm.line_id ||
                    !lineId(item) ||
                    sameId(
                        lineId(item),
                        movementForm.line_id
                    )
            );


        const movementRouteSteps =
            routeSteps.filter(
                item =>
                    !movementForm.line_id ||
                    !item.line_id ||
                    sameId(
                        item.line_id,
                        movementForm.line_id
                    )
            );


        const movementStations =
            stations.filter(
                item =>
                    !movementForm.line_id ||
                    !item.line_id ||
                    sameId(
                        item.line_id,
                        movementForm.line_id
                    )
            );


        const movementSignals =
            signals.filter(
                item => {

                    if (
                        movementForm.company_id &&
                        item.company_id &&
                        !sameId(
                            item.company_id,
                            movementForm.company_id
                        )
                    ) {

                        return false;
                    }


                    if (
                        movementForm.machine_id &&
                        item.machine_id &&
                        !sameId(
                            item.machine_id,
                            movementForm.machine_id
                        )
                    ) {

                        return false;
                    }


                    return (
                        !hasValue(
                            item.is_active
                        ) ||
                        boolValue(
                            item.is_active
                        )
                    );
                }
            );


        // ====================================================
        // SEARCH CONFIG
        // ====================================================

        const searchedRules =
            useMemo(
                () => {

                    const search =
                        searchText
                            .trim()
                            .toLowerCase();


                    if (!search) {

                        return ruleRows;
                    }


                    return ruleRows.filter(
                        rule => {

                            const fromStep =
                                routeStepMap.get(
                                    String(
                                        rule.from_route_step_id
                                    )
                                );


                            const toStep =
                                routeStepMap.get(
                                    String(
                                        rule.to_route_step_id
                                    )
                                );


                            const signal =
                                signalMap.get(
                                    String(
                                        rule.trigger_signal_id
                                    )
                                );


                            const text = [

                                routeStepLabel(
                                    fromStep
                                ),

                                routeStepLabel(
                                    toStep
                                ),

                                signal
                                    ? signalLabel(
                                        signal
                                    )
                                    : "",

                                rule.trigger_type,

                                rule.required_result_status,

                                rule.version_no

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
                    ruleRows,
                    searchText,
                    routeStepMap,
                    signalMap
                ]
            );


        // ====================================================
        // SUMMARY
        // ====================================================

        const totalCurrentUnits =
            positionRows.length;


        const inProcessUnits =
            positionRows.filter(
                row =>
                    String(
                        row.position_status ||
                        ""
                    )
                        .toUpperCase() ===
                    "IN_PROCESS"
            ).length;


        const totalMovements =
            historyRows.length;


        const activeRules =
            ruleRows.filter(
                row =>
                    boolValue(
                        row.is_active
                    )
            ).length;


        // ====================================================
        // REFRESH
        // ====================================================

        const refreshModule =
            async () => {

                await Promise.all([

                    queryClient.invalidateQueries({
                        queryKey: [
                            "line-indexing",
                            "rules"
                        ]
                    }),

                    queryClient.invalidateQueries({
                        queryKey: [
                            "line-indexing",
                            "positions"
                        ]
                    }),

                    queryClient.invalidateQueries({
                        queryKey: [
                            "line-indexing",
                            "runtime"
                        ]
                    }),

                    queryClient.invalidateQueries({
                        queryKey: [
                            "line-indexing",
                            "movement-report"
                        ]
                    }),

                    queryClient.invalidateQueries({
                        queryKey: [
                            "line-indexing",
                            "position-report"
                        ]
                    })
                ]);
            };


        // ====================================================
        // RULE MUTATION
        // ====================================================

        const ruleMutation =
            useMutation({

                mutationFn:
                    async payload => {

                        if (
                            payload.indexing_rule_config_id
                        ) {

                            const {
                                indexing_rule_config_id,
                                ...body
                            } =
                                payload;


                            return updateIndexingRule(
                                indexing_rule_config_id,
                                body
                            );
                        }


                        return createIndexingRule(
                            payload
                        );
                    },


                onSuccess:
                    async () => {

                        setErrorMessage("");


                        setMessage(
                            ruleForm.indexing_rule_config_id
                                ? "Indexing Rule updated successfully."
                                : "Indexing Rule created successfully."
                        );


                        setShowRuleModal(
                            false
                        );


                        setRuleForm(
                            indexingRuleInitialState
                        );


                        await refreshModule();
                    },


                onError:
                    error => {

                        setMessage("");


                        setErrorMessage(
                            getErrorMessage(
                                error,
                                "Unable to save Indexing Rule."
                            )
                        );
                    }
            });


        // ====================================================
        // INITIALIZE MUTATION
        // ====================================================

        const initializeMutation =
            useMutation({

                mutationFn:
                    payload =>
                        initializeUnitPosition(
                            payload
                        ),


                onSuccess:
                    async () => {

                        setErrorMessage("");


                        setMessage(
                            "Unit initial position created successfully."
                        );


                        setShowInitializeModal(
                            false
                        );


                        setInitializeForm(
                            initializePositionInitialState
                        );


                        await refreshModule();


                        setActiveView(
                            VIEW_POSITION
                        );
                    },


                onError:
                    error => {

                        setMessage("");


                        setErrorMessage(
                            getErrorMessage(
                                error,
                                "Unable to initialize Unit Position."
                            )
                        );
                    }
            });


        // ====================================================
        // MOVEMENT MUTATION
        // ====================================================

        const movementMutation =
            useMutation({

                mutationFn:
                    payload =>
                        executeUnitMovement(
                            payload
                        ),


                onSuccess:
                    async response => {

                        setErrorMessage("");


                        if (
                            lineIndexingUnitMovementService
                                .isMovementIdempotent(
                                    response
                                )
                        ) {

                            setMessage(
                                "This Unit Movement request was already processed."
                            );

                        }
                        else {

                            setMessage(
                                "Unit Movement executed successfully."
                            );
                        }


                        setShowMovementModal(
                            false
                        );


                        setMovementForm(
                            movementInitialState
                        );


                        await refreshModule();


                        setActiveView(
                            VIEW_POSITION
                        );
                    },


                onError:
                    error => {

                        setMessage("");


                        setErrorMessage(
                            getErrorMessage(
                                error,
                                "Unable to execute Unit Movement."
                            )
                        );
                    }
            });


        // ====================================================
        // CREATE RULE
        // ====================================================

        const openCreateRule =
            () => {

                setRuleForm({

                    ...indexingRuleInitialState,

                    company_id:
                        companies.length ===
                        1
                            ? companyId(
                                companies[0]
                            )
                            : ""
                });


                setShowRuleModal(
                    true
                );
            };


        // ====================================================
        // EDIT RULE
        // ====================================================

        const openEditRule =
            row => {

                setRuleForm({

                    indexing_rule_config_id:
                        row.indexing_rule_config_id,

                    company_id:
                        row.company_id ||
                        "",

                    plant_id:
                        row.plant_id ||
                        "",

                    line_id:
                        row.line_id ||
                        "",

                    from_route_step_id:
                        row.from_route_step_id ||
                        "",

                    to_route_step_id:
                        row.to_route_step_id ||
                        "",

                    from_station_id:
                        row.from_station_id ||
                        "",

                    to_station_id:
                        row.to_station_id ||
                        "",

                    trigger_signal_id:
                        row.trigger_signal_id ||
                        "",

                    trigger_type:
                        row.trigger_type ||
                        "MANUAL",

                    required_result_status:
                        row.required_result_status ||
                        "",

                    rule_expression:
                        row.rule_expression ||
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


        // ====================================================
        // SUBMIT RULE
        // ====================================================

        const submitRule =
            event => {

                event.preventDefault();


                if (
                    sameId(
                        ruleForm.from_route_step_id,
                        ruleForm.to_route_step_id
                    )
                ) {

                    setErrorMessage(
                        "From Route Step and To Route Step must be different."
                    );

                    return;
                }


                setErrorMessage("");


                ruleMutation.mutate({

                    ...ruleForm,

                    from_station_id:
                        ruleForm.from_station_id ||
                        null,

                    to_station_id:
                        ruleForm.to_station_id ||
                        null,

                    trigger_signal_id:
                        ruleForm.trigger_signal_id ||
                        null,

                    required_result_status:
                        ruleForm.required_result_status ||
                        null,

                    rule_expression:
                        ruleForm.rule_expression ||
                        null,

                    priority_no:
                        Number(
                            ruleForm.priority_no
                        ),

                    version_no:
                        Number(
                            ruleForm.version_no
                        ),

                    is_active:
                        Boolean(
                            ruleForm.is_active
                        )
                });
            };


        // ====================================================
        // DEACTIVATE RULE
        // ====================================================

        const deactivateRule =
            async row => {

                if (
                    !window.confirm(
                        "Deactivate this Indexing Rule?"
                    )
                ) {

                    return;
                }


                try {

                    await deleteIndexingRule(
                        row.indexing_rule_config_id
                    );


                    setErrorMessage("");


                    setMessage(
                        "Indexing Rule deactivated successfully."
                    );


                    await refreshModule();

                }
                catch (error) {

                    setErrorMessage(
                        getErrorMessage(
                            error,
                            "Unable to deactivate Indexing Rule."
                        )
                    );
                }
            };


        // ====================================================
        // INITIALIZE UNIT
        // ====================================================

        const openInitializeUnit =
            () => {

                setInitializeForm({

                    ...initializePositionInitialState,

                    unit_id:
                        generateUuid(),

                    company_id:
                        companies.length ===
                        1
                            ? companyId(
                                companies[0]
                            )
                            : "",

                    position_updated_at:
                        nowLocalDateTime()
                });


                setShowInitializeModal(
                    true
                );
            };


        const submitInitializePosition =
            event => {

                event.preventDefault();


                setErrorMessage("");


                initializeMutation.mutate({

                    ...initializeForm,

                    current_machine_id:
                        initializeForm.current_machine_id ||
                        null,

                    current_station_id:
                        initializeForm.current_station_id ||
                        null,

                    current_plan_entry_id:
                        initializeForm.current_plan_entry_id ||
                        null
                });
            };


        // ====================================================
        // MOVEMENT
        // ====================================================

        const openMovement =
            (
                position = null
            ) => {

                setMovementForm({

                    ...movementInitialState,

                    unit_id:
                        position?.unit_id ||
                        "",

                    company_id:
                        position?.company_id ||
                        "",

                    plant_id:
                        position?.plant_id ||
                        "",

                    line_id:
                        position?.line_id ||
                        "",

                    machine_id:
                        position?.current_machine_id ||
                        "",

                    from_route_step_id:
                        position?.current_route_step_id ||
                        "",

                    from_station_id:
                        position?.current_station_id ||
                        "",

                    from_plan_entry_id:
                        position?.current_plan_entry_id ||
                        "",

                    event_ts:
                        nowLocalDateTime(),

                    idempotency_key:
                        position?.unit_id
                            ? `INDEX-${position.unit_id}-${Date.now()}`
                            : ""
                });


                setShowMovementModal(
                    true
                );
            };


        const submitMovement =
            event => {

                event.preventDefault();


                setErrorMessage("");


                movementMutation.mutate({

                    ...movementForm,

                    shift_id:
                        Number(
                            movementForm.shift_id
                        ),

                    indexing_rule_config_id:
                        movementForm.indexing_rule_config_id ||
                        null,

                    from_route_step_id:
                        movementForm.from_route_step_id ||
                        null,

                    from_station_id:
                        movementForm.from_station_id ||
                        null,

                    from_plan_entry_id:
                        movementForm.from_plan_entry_id ||
                        null,

                    to_station_id:
                        movementForm.to_station_id ||
                        null,

                    to_machine_id:
                        movementForm.to_machine_id ||
                        null,

                    to_plan_entry_id:
                        movementForm.to_plan_entry_id ||
                        null,

                    trigger_signal_id:
                        movementForm.trigger_signal_id ||
                        null,

                    correlation_id:
                        movementForm.correlation_id ||
                        null,

                    idempotency_key:
                        movementForm.idempotency_key ||
                        `INDEX-${movementForm.unit_id}-${Date.now()}`
                });
            };


        // ====================================================
        // FULL REFRESH
        // ====================================================

        const handleRefresh =
            async () => {

                setMessage("");
                setErrorMessage("");


                try {

                    await Promise.all([

                        rulesQuery.refetch(),

                        companiesQuery.refetch(),

                        plantsQuery.refetch(),

                        linesQuery.refetch(),

                        machinesQuery.refetch(),

                        stationsQuery.refetch(),

                        routeStepsQuery.refetch(),

                        signalsQuery.refetch(),

                        shiftsQuery.refetch(),

                        positionsQuery.refetch(),

                        historyQuery.refetch()
                    ]);


                    setMessage(
                        "Line Indexing / Unit Movement data refreshed successfully."
                    );

                }
                catch (error) {

                    setErrorMessage(
                        getErrorMessage(
                            error,
                            "Unable to refresh data."
                        )
                    );
                }
            };


        // ====================================================
        // REPORT META
        // ====================================================

        const movementReportMeta =
            movementReportQuery
                .data
                ?.meta ||
            {};


        const positionReportMeta =
            positionReportQuery
                .data
                ?.meta ||
            {};


        // ====================================================
        // RENDER
        // ====================================================

        return (

            <>

<div className="lium-page">

                <style>{`

                    .lium-page {
                        min-height: 100vh;
                        padding: 22px;
                        background: #f4f6fb;
                    }

                    .lium-card {
                        background: #ffffff;
                        border: 1px solid #e4e8f0;
                        border-radius: 12px;
                        box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
                    }

                    .lium-title {
                        margin: 0;
                        color: #1f2d3d;
                        font-size: 22px;
                        font-weight: 700;
                    }

                    .lium-subtitle {
                        margin-top: 5px;
                        color: #788397;
                        font-size: 13px;
                    }

                    .lium-primary {
                        background: #314965 !important;
                        border-color: #314965 !important;
                        color: white !important;
                        font-weight: 600;
                    }

                    .lium-primary:hover {
                        background: #25364e !important;
                        border-color: #25364e !important;
                    }

                    .lium-outline {
                        background: white !important;
                        border: 1px solid #314965 !important;
                        color: #314965 !important;
                        font-weight: 600;
                    }

                    .lium-tabs {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }

                    .lium-tab {
                        border: 1px solid #d8dde7;
                        background: white;
                        color: #596579;
                        font-weight: 600;
                        border-radius: 7px;
                        padding: 8px 15px;
                    }

                    .lium-tab.active {
                        background: #f1f4f8;
                        color: #314965;
                        border-color: #314965;
                    }

                    .lium-stat {
                        height: 100%;
                        background: white;
                        border: 1px solid #e4e8f0;
                        border-radius: 10px;
                        padding: 14px;
                    }

                    .lium-stat-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 9px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #f1f4f8;
                        color: #314965;
                    }

                    .lium-stat-value {
                        color: #263449;
                        font-size: 20px;
                        font-weight: 700;
                    }

                    .lium-stat-label {
                        color: #7b8597;
                        font-size: 12px;
                    }

                    .lium-table-wrap {
                        overflow: auto;
                        border: 1px solid #e2e6ee;
                        border-radius: 9px;
                    }

                    .lium-table {
                        margin: 0;
                        white-space: nowrap;
                    }

                    .lium-table thead th {
                        background: #1c2d45;
                        color: white;
                        border-color: #1c2d45;
                        padding: 12px;
                        font-size: 12px;
                    }

                    .lium-table tbody td {
                        vertical-align: middle;
                        padding: 11px 12px;
                        color: #354052;
                        font-size: 13px;
                    }

                    .lium-empty {
                        padding: 30px !important;
                        text-align: center;
                        color: #8a94a6 !important;
                    }

                    .lium-search {
                        width: 350px;
                        max-width: 100%;
                        position: relative;
                    }

                    .lium-search svg {
                        position: absolute;
                        top: 50%;
                        left: 11px;
                        transform: translateY(-50%);
                        color: #8792a5;
                    }

                    .lium-search input {
                        padding-left: 35px;
                    }

                    .lium-label {
                        margin-bottom: 5px;
                        color: #354154;
                        font-size: 12px;
                        font-weight: 700;
                    }

                    .lium-filter {
                        padding: 15px;
                        background: #f9fafc;
                        border: 1px solid #e5e9f2;
                        border-radius: 9px;
                        margin-bottom: 15px;
                    }

                    .lium-route {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .lium-route-box {
                        padding: 5px 8px;
                        border-radius: 6px;
                        background: #f2f4f8;
                    }

                    .lium-context {
                        padding: 12px;
                        background: #f7f4ff;
                        border: 1px solid #f1cebc;
                        border-radius: 8px;
                    }

                    .lium-unit {
                        font-family: monospace;
                        font-size: 12px;
                    }

                    .lium-modal .modal-content {
                        border: none;
                        border-radius: 12px;
                        overflow: hidden;
                    }

                    .lium-modal .modal-header {
                        background: #1c2d45;
                        color: white;
                        border: none;
                    }

                    .lium-modal .btn-close {
                        filter: invert(1);
                    }

                    @media (max-width: 768px) {

                        .lium-page {
                            padding: 12px;
                        }

                        .lium-search {
                            width: 100%;
                        }
                    }

                `}</style>


                {/* =================================================
                    HEADER
                ================================================== */}

                <Card className="lium-card mb-3">

                    <Card.Body>

                        <Row className="align-items-center g-3">

                            <Col lg={7}>

                                <h4 className="lium-title">
                                    Line Indexing / Unit Movement
                                </h4>


                                <div className="lium-subtitle">

                                    Control valid serialized-unit
                                    transitions, preserve immutable
                                    movement history and maintain each
                                    unit's current production position.

                                </div>

                            </Col>


                            <Col lg={5}>

                                <div className="d-flex gap-2 flex-wrap justify-content-lg-end">

                                    <Button
                                        className="lium-outline"
                                        onClick={
                                            handleRefresh
                                        }
                                    >
                                        <ArrowClockwise className="me-1" />

                                        Refresh
                                    </Button>


                                    <Button
                                        className="lium-outline"
                                        onClick={
                                            openInitializeUnit
                                        }
                                    >
                                        <GeoAltFill className="me-1" />

                                        Initialize Unit
                                    </Button>


                                    <Button
                                        className="lium-primary"
                                        onClick={() =>
                                            openMovement()
                                        }
                                    >
                                        <PlayFill className="me-1" />

                                        Execute Movement
                                    </Button>

                                </div>

                            </Col>

                        </Row>

                    </Card.Body>

                </Card>


                {/* =================================================
                    MESSAGES
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

                        <div className="lium-stat">

                            <div className="d-flex align-items-center gap-3">

                                <div className="lium-stat-icon">
                                    <Diagram3Fill />
                                </div>

                                <div>

                                    <div className="lium-stat-value">
                                        {activeRules}
                                    </div>

                                    <div className="lium-stat-label">
                                        Active Indexing Rules
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>


                    <Col md={3}>

                        <div className="lium-stat">

                            <div className="d-flex align-items-center gap-3">

                                <div className="lium-stat-icon">
                                    <GeoAltFill />
                                </div>

                                <div>

                                    <div className="lium-stat-value">
                                        {totalCurrentUnits}
                                    </div>

                                    <div className="lium-stat-label">
                                        Tracked Units
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>


                    <Col md={3}>

                        <div className="lium-stat">

                            <div className="d-flex align-items-center gap-3">

                                <div className="lium-stat-icon">
                                    <CheckCircleFill />
                                </div>

                                <div>

                                    <div className="lium-stat-value">
                                        {inProcessUnits}
                                    </div>

                                    <div className="lium-stat-label">
                                        Units In Process
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>


                    <Col md={3}>

                        <div className="lium-stat">

                            <div className="d-flex align-items-center gap-3">

                                <div className="lium-stat-icon">
                                    <ArrowRight />
                                </div>

                                <div>

                                    <div className="lium-stat-value">
                                        {totalMovements}
                                    </div>

                                    <div className="lium-stat-label">
                                        Loaded Movement Events
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>

                </Row>


                {/* =================================================
                    MAIN CARD
                ================================================== */}

                <Card className="lium-card">

                    <Card.Body>

                        <div className="lium-tabs mb-3">

                            {
                                [
                                    [
                                        VIEW_CONFIG,
                                        "Indexing Rules"
                                    ],

                                    [
                                        VIEW_POSITION,
                                        "Current Position"
                                    ],

                                    [
                                        VIEW_MOVEMENT,
                                        "Movement"
                                    ],

                                    [
                                        VIEW_HISTORY,
                                        "Movement History"
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
                                            key={value}
                                            type="button"
                                            className={
                                                `lium-tab ${
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


                        {/* =========================================
                            CONFIGURATION
                        ========================================= */}

                        {
                            activeView ===
                            VIEW_CONFIG && (

                                <>

                                    <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">

                                        <div className="lium-search">

                                            <Search />

                                            <Form.Control
                                                placeholder="Search route, trigger, result..."
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
                                            className="lium-primary"
                                            onClick={
                                                openCreateRule
                                            }
                                        >
                                            <Plus className="me-1" />

                                            Add Indexing Rule
                                        </Button>

                                    </div>


                                    <div className="lium-table-wrap">

                                        <Table
                                            hover
                                            className="lium-table"
                                        >

                                            <thead>

                                                <tr>

                                                    <th>From → To</th>
                                                    <th>From Station</th>
                                                    <th>To Station</th>
                                                    <th>Trigger</th>
                                                    <th>Signal</th>
                                                    <th>Required Result</th>
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
                                                                colSpan={10}
                                                                text="Loading Indexing Rules..."
                                                            />
                                                        )
                                                        : searchedRules.length ===
                                                            0
                                                            ? (

                                                                <EmptyRow
                                                                    colSpan={10}
                                                                    text="No Indexing Rule configuration found."
                                                                />
                                                            )
                                                            : searchedRules.map(
                                                                row => {

                                                                    const fromStep =
                                                                        routeStepMap.get(
                                                                            String(
                                                                                row.from_route_step_id
                                                                            )
                                                                        );


                                                                    const toStep =
                                                                        routeStepMap.get(
                                                                            String(
                                                                                row.to_route_step_id
                                                                            )
                                                                        );


                                                                    const fromStation =
                                                                        stationMap.get(
                                                                            String(
                                                                                row.from_station_id
                                                                            )
                                                                        );


                                                                    const toStation =
                                                                        stationMap.get(
                                                                            String(
                                                                                row.to_station_id
                                                                            )
                                                                        );


                                                                    const signal =
                                                                        signalMap.get(
                                                                            String(
                                                                                row.trigger_signal_id
                                                                            )
                                                                        );


                                                                    return (

                                                                        <tr
                                                                            key={
                                                                                row.indexing_rule_config_id
                                                                            }
                                                                        >

                                                                            <td>

                                                                                <div className="lium-route">

                                                                                    <span className="lium-route-box">
                                                                                        {
                                                                                            routeStepLabel(
                                                                                                fromStep
                                                                                            )
                                                                                        }
                                                                                    </span>

                                                                                    <ArrowRight />

                                                                                    <span className="lium-route-box">
                                                                                        {
                                                                                            routeStepLabel(
                                                                                                toStep
                                                                                            )
                                                                                        }
                                                                                    </span>

                                                                                </div>

                                                                            </td>


                                                                            <td>
                                                                                {
                                                                                    fromStation
                                                                                        ? stationLabel(
                                                                                            fromStation
                                                                                        )
                                                                                        : "-"
                                                                                }
                                                                            </td>


                                                                            <td>
                                                                                {
                                                                                    toStation
                                                                                        ? stationLabel(
                                                                                            toStation
                                                                                        )
                                                                                        : "-"
                                                                                }
                                                                            </td>


                                                                            <td>
                                                                                {
                                                                                    safeText(
                                                                                        row.trigger_type
                                                                                    )
                                                                                }
                                                                            </td>


                                                                            <td>
                                                                                {
                                                                                    signal
                                                                                        ? signalLabel(
                                                                                            signal
                                                                                        )
                                                                                        : "-"
                                                                                }
                                                                            </td>


                                                                            <td>
                                                                                {
                                                                                    row.required_result_status
                                                                                        ? (
                                                                                            <ResultBadge
                                                                                                status={
                                                                                                    row.required_result_status
                                                                                                }
                                                                                            />
                                                                                        )
                                                                                        : "-"
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
                                                                                        className="lium-outline"
                                                                                        onClick={() =>
                                                                                            openEditRule(
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


                        {/* =========================================
                            CURRENT POSITION
                        ========================================= */}

                        {
                            activeView ===
                            VIEW_POSITION && (

                                <>

                                    <IndexingFilter
                                        filters={filters}
                                        setFilters={setFilters}
                                        companies={companies}
                                        machines={machines}
                                        shifts={shifts}
                                        routeSteps={routeSteps}
                                        showPositionStatus
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


                                    <FloorMap records={positionRows} kind="position" machineMap={machineMap} stationMap={stationMap} routeStepMap={routeStepMap}/><PositionTable
                                        rows={
                                            positionRows
                                        }
                                        machineMap={
                                            machineMap
                                        }
                                        stationMap={
                                            stationMap
                                        }
                                        routeStepMap={
                                            routeStepMap
                                        }
                                        loading={
                                            positionsQuery.isFetching
                                        }
                                        onMove={
                                            openMovement
                                        }
                                    />

                                </>
                            )
                        }


                        {/* =========================================
                            MOVEMENT
                        ========================================= */}

                        {
                            activeView ===
                            VIEW_MOVEMENT && (

                                <>

                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">

                                        <div>

                                            <h6 className="mb-1">
                                                Select a current unit and move it to its next permitted route step.
                                            </h6>

                                            <small className="text-muted">
                                                The backend uses unit_position as the authoritative source location.
                                            </small>

                                        </div>


                                        <Button
                                            className="lium-primary"
                                            onClick={() =>
                                                openMovement()
                                            }
                                        >
                                            <PlayFill className="me-1" />

                                            Execute Movement
                                        </Button>

                                    </div>


                                    <PositionTable
                                        rows={
                                            positionRows
                                        }
                                        machineMap={
                                            machineMap
                                        }
                                        stationMap={
                                            stationMap
                                        }
                                        routeStepMap={
                                            routeStepMap
                                        }
                                        loading={
                                            positionsQuery.isFetching
                                        }
                                        onMove={
                                            openMovement
                                        }
                                    />

                                </>
                            )
                        }


                        {/* =========================================
                            HISTORY
                        ========================================= */}

                        {
                            activeView ===
                            VIEW_HISTORY && (

                                <>

                                    <IndexingFilter
                                        filters={filters}
                                        setFilters={setFilters}
                                        companies={companies}
                                        machines={machines}
                                        shifts={shifts}
                                        routeSteps={routeSteps}
                                        showResultStatus
                                        showDateRange
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


                                    <EventJourney records={historyRows} title="Unit movement journey"/><MovementHistoryTable
                                        rows={
                                            historyRows
                                        }
                                        machineMap={
                                            machineMap
                                        }
                                        stationMap={
                                            stationMap
                                        }
                                        routeStepMap={
                                            routeStepMap
                                        }
                                        loading={
                                            historyQuery.isFetching
                                        }
                                    />

                                </>
                            )
                        }


                        {/* =========================================
                            REPORT
                        ========================================= */}

                        {
                            activeView ===
                            VIEW_REPORT && (

                                <>

                                    <IndexingFilter
                                        filters={filters}
                                        setFilters={setFilters}
                                        companies={companies}
                                        machines={machines}
                                        shifts={shifts}
                                        routeSteps={routeSteps}
                                        showResultStatus
                                        showPositionStatus
                                        showDateRange
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

                                            <div className="lium-stat">

                                                <div className="lium-stat-label">
                                                    Total Movements
                                                </div>

                                                <div className="lium-stat-value">
                                                    {
                                                        Number(
                                                            movementReportMeta.total_movements ||
                                                            0
                                                        )
                                                    }
                                                </div>

                                            </div>

                                        </Col>


                                        <Col md={3}>

                                            <div className="lium-stat">

                                                <div className="lium-stat-label">
                                                    Unique Units Moved
                                                </div>

                                                <div className="lium-stat-value">
                                                    {
                                                        Number(
                                                            movementReportMeta.unique_units ||
                                                            0
                                                        )
                                                    }
                                                </div>

                                            </div>

                                        </Col>


                                        <Col md={3}>

                                            <div className="lium-stat">

                                                <div className="lium-stat-label">
                                                    Current Tracked Units
                                                </div>

                                                <div className="lium-stat-value">
                                                    {
                                                        Number(
                                                            positionReportMeta.total_units ||
                                                            0
                                                        )
                                                    }
                                                </div>

                                            </div>

                                        </Col>


                                        <Col md={3}>

                                            <div className="lium-stat">

                                                <div className="lium-stat-label">
                                                    OK Movements
                                                </div>

                                                <div className="lium-stat-value text-success">
                                                    {
                                                        Number(
                                                            movementReportMeta
                                                                ?.result_counts
                                                                ?.OK ||
                                                            0
                                                        )
                                                    }
                                                </div>

                                            </div>

                                        </Col>

                                    </Row>


                                    <h6 className="mb-2">
                                        Movement History
                                    </h6>


                                    <ReportLens records={movementReportQuery.data?.data || []} title="Movement report explorer"/><MovementHistoryTable
                                        rows={
                                            movementReportQuery
                                                .data
                                                ?.data ||
                                            []
                                        }
                                        machineMap={
                                            machineMap
                                        }
                                        stationMap={
                                            stationMap
                                        }
                                        routeStepMap={
                                            routeStepMap
                                        }
                                        loading={
                                            movementReportQuery.isFetching
                                        }
                                    />


                                    <h6 className="mt-4 mb-2">
                                        Current Unit Positions
                                    </h6>


                                    <PositionTable
                                        rows={
                                            positionReportQuery
                                                .data
                                                ?.data ||
                                            []
                                        }
                                        machineMap={
                                            machineMap
                                        }
                                        stationMap={
                                            stationMap
                                        }
                                        routeStepMap={
                                            routeStepMap
                                        }
                                        loading={
                                            positionReportQuery.isFetching
                                        }
                                        hideMove
                                    />

                                </>
                            )
                        }

                    </Card.Body>

                </Card>


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
                    className="lium-modal"
                >

                    <Form
                        onSubmit={
                            submitRule
                        }
                    >

                        <Modal.Header closeButton>

                            <Modal.Title>

                                {
                                    ruleForm.indexing_rule_config_id
                                        ? "Edit Indexing Rule"
                                        : "Add Indexing Rule"
                                }

                            </Modal.Title>

                        </Modal.Header>


                        <Modal.Body>

                            <Row className="g-3">

                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Company *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            ruleForm.company_id
                                        }
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        company_id:
                                                            event.target.value,

                                                        plant_id: "",
                                                        line_id: "",

                                                        from_route_step_id: "",
                                                        to_route_step_id: "",

                                                        from_station_id: "",
                                                        to_station_id: "",

                                                        trigger_signal_id: ""
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


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Plant *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        disabled={
                                            !ruleForm.company_id
                                        }
                                        value={
                                            ruleForm.plant_id
                                        }
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id: "",

                                                        from_route_step_id: "",
                                                        to_route_step_id: "",

                                                        from_station_id: "",
                                                        to_station_id: "",

                                                        trigger_signal_id: ""
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


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Line *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        disabled={
                                            !ruleForm.plant_id
                                        }
                                        value={
                                            ruleForm.line_id
                                        }
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        line_id:
                                                            event.target.value,

                                                        from_route_step_id: "",
                                                        to_route_step_id: "",

                                                        from_station_id: "",
                                                        to_station_id: "",

                                                        trigger_signal_id: ""
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


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        From Route Step *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        disabled={
                                            !ruleForm.line_id
                                        }
                                        value={
                                            ruleForm.from_route_step_id
                                        }
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        from_route_step_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select From Route Step
                                        </option>

                                        {
                                            configRouteSteps.map(
                                                item => (

                                                    <option
                                                        key={
                                                            routeStepId(item)
                                                        }
                                                        value={
                                                            routeStepId(item)
                                                        }
                                                    >
                                                        {
                                                            routeStepLabel(item)
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        To Route Step *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        disabled={
                                            !ruleForm.line_id
                                        }
                                        value={
                                            ruleForm.to_route_step_id
                                        }
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        to_route_step_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select To Route Step
                                        </option>

                                        {
                                            configRouteSteps.map(
                                                item => (

                                                    <option
                                                        key={
                                                            routeStepId(item)
                                                        }
                                                        value={
                                                            routeStepId(item)
                                                        }
                                                    >
                                                        {
                                                            routeStepLabel(item)
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        From Station
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            ruleForm.from_station_id
                                        }
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        from_station_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any / No From Station
                                        </option>

                                        {
                                            configStations.map(
                                                item => (

                                                    <option
                                                        key={
                                                            stationId(item)
                                                        }
                                                        value={
                                                            stationId(item)
                                                        }
                                                    >
                                                        {
                                                            stationLabel(item)
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        To Station
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            ruleForm.to_station_id
                                        }
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        to_station_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any / No To Station
                                        </option>

                                        {
                                            configStations.map(
                                                item => (

                                                    <option
                                                        key={
                                                            stationId(item)
                                                        }
                                                        value={
                                                            stationId(item)
                                                        }
                                                    >
                                                        {
                                                            stationLabel(item)
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        Trigger Signal
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            ruleForm.trigger_signal_id
                                        }
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        trigger_signal_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            No Trigger Signal
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

                                </Col>


                                <Col md={3}>

                                    <Form.Label className="lium-label">
                                        Trigger Type *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            ruleForm.trigger_type
                                        }
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        trigger_type:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        {
                                            Object.values(
                                                INDEXING_TRIGGER_TYPES
                                            ).map(
                                                value => (

                                                    <option
                                                        key={
                                                            value
                                                        }
                                                        value={
                                                            value
                                                        }
                                                    >
                                                        {value}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={3}>

                                    <Form.Label className="lium-label">
                                        Required Result
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            ruleForm.required_result_status
                                        }
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        required_result_status:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any Result
                                        </option>

                                        {
                                            Object.values(
                                                INDEXING_RESULT_STATUS
                                            ).map(
                                                value => (

                                                    <option
                                                        key={
                                                            value
                                                        }
                                                        value={
                                                            value
                                                        }
                                                    >
                                                        {value}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        Rule Expression
                                    </Form.Label>

                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Optional complex rule expression"
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
                                        Expression is stored as configuration. Backend does not eval arbitrary JavaScript.
                                    </Form.Text>

                                </Col>


                                <Col md={2}>

                                    <Form.Label className="lium-label">
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

                                    <Form.Label className="lium-label">
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
                                className="lium-primary"
                                disabled={
                                    ruleMutation.isPending
                                }
                            >
                                {
                                    ruleMutation.isPending
                                        ? "Saving..."
                                        : "Save Indexing Rule"
                                }
                            </Button>

                        </Modal.Footer>

                    </Form>

                </Modal>


                {/* =================================================
                    INITIALIZE UNIT MODAL
                ================================================== */}

                <Modal
                    show={
                        showInitializeModal
                    }
                    onHide={() =>
                        setShowInitializeModal(
                            false
                        )
                    }
                    centered
                    size="xl"
                    backdrop="static"
                    className="lium-modal"
                >

                    <Form
                        onSubmit={
                            submitInitializePosition
                        }
                    >

                        <Modal.Header closeButton>

                            <Modal.Title>
                                Initialize Unit Position
                            </Modal.Title>

                        </Modal.Header>


                        <Modal.Body>

                            <Alert variant="light">

                                Use this only for the unit's first known
                                execution location. This creates
                                <strong> unit_position </strong>
                                only and does not create a fake movement event.

                            </Alert>


                            <Row className="g-3">

                                <Col md={8}>

                                    <Form.Label className="lium-label">
                                        Unit ID *
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        value={
                                            initializeForm.unit_id
                                        }
                                        onChange={
                                            event =>
                                                setInitializeForm(
                                                    old => ({
                                                        ...old,

                                                        unit_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        &nbsp;
                                    </Form.Label>

                                    <div>

                                        <Button
                                            type="button"
                                            className="lium-outline"
                                            onClick={() =>
                                                setInitializeForm(
                                                    old => ({
                                                        ...old,

                                                        unit_id:
                                                            generateUuid()
                                                    })
                                                )
                                            }
                                        >
                                            Generate Test UUID
                                        </Button>

                                    </div>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Company *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            initializeForm.company_id
                                        }
                                        onChange={
                                            event =>
                                                setInitializeForm(
                                                    old => ({
                                                        ...old,

                                                        company_id:
                                                            event.target.value,

                                                        plant_id: "",
                                                        line_id: "",
                                                        current_machine_id: "",
                                                        current_station_id: "",
                                                        current_route_step_id: ""
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


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Plant *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            initializeForm.plant_id
                                        }
                                        onChange={
                                            event =>
                                                setInitializeForm(
                                                    old => ({
                                                        ...old,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id: "",
                                                        current_machine_id: "",
                                                        current_station_id: "",
                                                        current_route_step_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Plant
                                        </option>

                                        {
                                            initializePlants.map(
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


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Line *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            initializeForm.line_id
                                        }
                                        onChange={
                                            event =>
                                                setInitializeForm(
                                                    old => ({
                                                        ...old,

                                                        line_id:
                                                            event.target.value,

                                                        current_machine_id: "",
                                                        current_station_id: "",
                                                        current_route_step_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Line
                                        </option>

                                        {
                                            initializeLines.map(
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


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Current Machine
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            initializeForm.current_machine_id
                                        }
                                        onChange={
                                            event =>
                                                setInitializeForm(
                                                    old => ({
                                                        ...old,

                                                        current_machine_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            No Machine
                                        </option>

                                        {
                                            initializeMachines.map(
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


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Current Station
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            initializeForm.current_station_id
                                        }
                                        onChange={
                                            event =>
                                                setInitializeForm(
                                                    old => ({
                                                        ...old,

                                                        current_station_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            No Station
                                        </option>

                                        {
                                            initializeStations.map(
                                                item => (

                                                    <option
                                                        key={
                                                            stationId(item)
                                                        }
                                                        value={
                                                            stationId(item)
                                                        }
                                                    >
                                                        {
                                                            stationLabel(item)
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Current Route Step *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            initializeForm.current_route_step_id
                                        }
                                        onChange={
                                            event =>
                                                setInitializeForm(
                                                    old => ({
                                                        ...old,

                                                        current_route_step_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Route Step
                                        </option>

                                        {
                                            initializeRouteSteps.map(
                                                item => (

                                                    <option
                                                        key={
                                                            routeStepId(item)
                                                        }
                                                        value={
                                                            routeStepId(item)
                                                        }
                                                    >
                                                        {
                                                            routeStepLabel(item)
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        Position Status
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            initializeForm.position_status
                                        }
                                        onChange={
                                            event =>
                                                setInitializeForm(
                                                    old => ({
                                                        ...old,

                                                        position_status:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        {
                                            Object.values(
                                                UNIT_POSITION_STATUS
                                            ).map(
                                                value => (

                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {value}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        Position Time
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            initializeForm.position_updated_at
                                        }
                                        onChange={
                                            event =>
                                                setInitializeForm(
                                                    old => ({
                                                        ...old,

                                                        position_updated_at:
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
                                    setShowInitializeModal(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </Button>


                            <Button
                                type="submit"
                                className="lium-primary"
                                disabled={
                                    initializeMutation.isPending
                                }
                            >
                                {
                                    initializeMutation.isPending
                                        ? "Initializing..."
                                        : "Initialize Unit"
                                }
                            </Button>

                        </Modal.Footer>

                    </Form>

                </Modal>


                {/* =================================================
                    MOVEMENT MODAL
                ================================================== */}

                <Modal
                    show={
                        showMovementModal
                    }
                    onHide={() =>
                        setShowMovementModal(
                            false
                        )
                    }
                    centered
                    size="xl"
                    backdrop="static"
                    className="lium-modal"
                >

                    <Form
                        onSubmit={
                            submitMovement
                        }
                    >

                        <Modal.Header closeButton>

                            <Modal.Title>
                                Execute Unit Movement
                            </Modal.Title>

                        </Modal.Header>


                        <Modal.Body>

                            <Alert variant="light">

                                The current source Route Step / Station is
                                validated against <strong>unit_position</strong>.
                                The event is inserted and current position is
                                updated in the same backend transaction.

                            </Alert>


                            <Row className="g-3">

                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        Unit ID *
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        value={
                                            movementForm.unit_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        unit_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col md={3}>

                                    <Form.Label className="lium-label">
                                        Shift *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            movementForm.shift_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        shift_id:
                                                            event.target.value,

                                                        to_plan_entry_id: ""
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

                                    <Form.Label className="lium-label">
                                        Event Time
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            movementForm.event_ts
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
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

                                    <Form.Label className="lium-label">
                                        Company *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            movementForm.company_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        company_id:
                                                            event.target.value,

                                                        plant_id: "",
                                                        line_id: "",
                                                        machine_id: "",
                                                        to_machine_id: ""
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

                                    <Form.Label className="lium-label">
                                        Plant *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            movementForm.plant_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id: "",
                                                        machine_id: "",
                                                        to_machine_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Plant
                                        </option>

                                        {
                                            movementPlants.map(
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

                                    <Form.Label className="lium-label">
                                        Line *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            movementForm.line_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        line_id:
                                                            event.target.value,

                                                        machine_id: "",
                                                        to_machine_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Line
                                        </option>

                                        {
                                            movementLines.map(
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

                                    <Form.Label className="lium-label">
                                        Triggering Machine *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            movementForm.machine_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        machine_id:
                                                            event.target.value,

                                                        trigger_signal_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Machine
                                        </option>

                                        {
                                            movementMachines.map(
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

                                    <div className="lium-context">

                                        <div className="lium-label">
                                            Current / From Route Step
                                        </div>

                                        <strong>
                                            {
                                                movementForm.from_route_step_id
                                                    ? routeStepLabel(
                                                        routeStepMap.get(
                                                            String(
                                                                movementForm.from_route_step_id
                                                            )
                                                        )
                                                    )
                                                    : "Backend will resolve from unit_position"
                                            }
                                        </strong>

                                    </div>

                                </Col>


                                <Col md={6}>

                                    <div className="lium-context">

                                        <div className="lium-label">
                                            Current / From Station
                                        </div>

                                        <strong>
                                            {
                                                movementForm.from_station_id
                                                    ? stationLabel(
                                                        stationMap.get(
                                                            String(
                                                                movementForm.from_station_id
                                                            )
                                                        )
                                                    )
                                                    : "No current station supplied"
                                            }
                                        </strong>

                                    </div>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        To Route Step *
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            movementForm.to_route_step_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        to_route_step_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Destination Route Step
                                        </option>

                                        {
                                            movementRouteSteps.map(
                                                item => (

                                                    <option
                                                        key={
                                                            routeStepId(item)
                                                        }
                                                        value={
                                                            routeStepId(item)
                                                        }
                                                    >
                                                        {
                                                            routeStepLabel(item)
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        To Station
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            movementForm.to_station_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        to_station_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            No Destination Station
                                        </option>

                                        {
                                            movementStations.map(
                                                item => (

                                                    <option
                                                        key={
                                                            stationId(item)
                                                        }
                                                        value={
                                                            stationId(item)
                                                        }
                                                    >
                                                        {
                                                            stationLabel(item)
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Destination Machine
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            movementForm.to_machine_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        to_machine_id:
                                                            event.target.value,

                                                        to_plan_entry_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Same Triggering Machine
                                        </option>

                                        {
                                            movementMachines.map(
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

                                    <Form.Label className="lium-label">
                                        Destination Plan Entry
                                    </Form.Label>

                                    <Form.Select
                                        disabled={
                                            !movementForm.to_machine_id ||
                                            !movementForm.shift_id ||
                                            planEntriesQuery.isFetching
                                        }
                                        value={
                                            movementForm.to_plan_entry_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        to_plan_entry_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            No Destination Plan Entry
                                        </option>

                                        {
                                            planEntries.map(
                                                item => (

                                                    <option
                                                        key={
                                                            planEntryId(item)
                                                        }
                                                        value={
                                                            planEntryId(item)
                                                        }
                                                    >
                                                        {
                                                            planEntryLabel(item)
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        Explicit Indexing Rule
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            movementForm.indexing_rule_config_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        indexing_rule_config_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Auto Resolve Rule
                                        </option>

                                        {
                                            ruleRows
                                                .filter(
                                                    row =>
                                                        boolValue(
                                                            row.is_active
                                                        )
                                                )
                                                .map(
                                                    row => {

                                                        const from =
                                                            routeStepMap.get(
                                                                String(
                                                                    row.from_route_step_id
                                                                )
                                                            );


                                                        const to =
                                                            routeStepMap.get(
                                                                String(
                                                                    row.to_route_step_id
                                                                )
                                                            );


                                                        return (

                                                            <option
                                                                key={
                                                                    row.indexing_rule_config_id
                                                                }
                                                                value={
                                                                    row.indexing_rule_config_id
                                                                }
                                                            >
                                                                {
                                                                    routeStepLabel(
                                                                        from
                                                                    )
                                                                }

                                                                {" → "}

                                                                {
                                                                    routeStepLabel(
                                                                        to
                                                                    )
                                                                }

                                                                {" | "}

                                                                {
                                                                    row.trigger_type
                                                                }

                                                            </option>
                                                        );
                                                    }
                                                )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Trigger Type
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            movementForm.trigger_type
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        trigger_type:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        {
                                            Object.values(
                                                INDEXING_TRIGGER_TYPES
                                            ).map(
                                                value => (

                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {value}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Trigger Source
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            movementForm.trigger_source
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        trigger_source:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        {
                                            Object.values(
                                                INDEXING_TRIGGER_SOURCES
                                            ).map(
                                                value => (

                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {value}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="lium-label">
                                        Result Status
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            movementForm.result_status
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
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
                                                INDEXING_RESULT_STATUS
                                            ).map(
                                                value => (

                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {value}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        Trigger Signal
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            movementForm.trigger_signal_id
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        trigger_signal_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            No Trigger Signal
                                        </option>

                                        {
                                            movementSignals.map(
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


                                <Col md={3}>

                                    <Form.Label className="lium-label">
                                        New Position Status
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            movementForm.position_status
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
                                                    old => ({
                                                        ...old,

                                                        position_status:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        {
                                            Object.values(
                                                UNIT_POSITION_STATUS
                                            ).map(
                                                value => (

                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {value}
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
                                            label="Expression Result = TRUE"
                                            checked={
                                                movementForm.rule_expression_result
                                            }
                                            onChange={
                                                event =>
                                                    setMovementForm(
                                                        old => ({
                                                            ...old,

                                                            rule_expression_result:
                                                                event.target.checked
                                                        })
                                                    )
                                            }
                                        />

                                    </div>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="lium-label">
                                        Idempotency Key
                                    </Form.Label>

                                    <Form.Control
                                        placeholder="Generated automatically if blank"
                                        value={
                                            movementForm.idempotency_key
                                        }
                                        onChange={
                                            event =>
                                                setMovementForm(
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
                                    setShowMovementModal(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </Button>


                            <Button
                                type="submit"
                                className="lium-primary"
                                disabled={
                                    movementMutation.isPending
                                }
                            >
                                {
                                    movementMutation.isPending
                                        ? "Executing..."
                                        : "Execute Movement"
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

const IndexingFilter =
    ({
        filters,
        setFilters,
        companies,
        machines,
        shifts,
        routeSteps,
        showResultStatus = false,
        showPositionStatus = false,
        showDateRange = false,
        onApply,
        onClear
    }) => (

        <div className="lium-filter">

            <Row className="g-2">

                <Col md={3}>

                    <Form.Label className="lium-label">
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

                    <Form.Label className="lium-label">
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


                <Col md={3}>

                    <Form.Label className="lium-label">
                        Unit ID
                    </Form.Label>

                    <Form.Control
                        value={
                            filters.unit_id
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        unit_id:
                                            event.target.value
                                    })
                                )
                        }
                    />

                </Col>


                <Col md={3}>

                    <Form.Label className="lium-label">
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


                <Col md={3}>

                    <Form.Label className="lium-label">
                        From Route Step
                    </Form.Label>

                    <Form.Select
                        value={
                            filters.from_route_step_id
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        from_route_step_id:
                                            event.target.value
                                    })
                                )
                        }
                    >

                        <option value="">
                            All
                        </option>

                        {
                            routeSteps.map(
                                item => (

                                    <option
                                        key={
                                            routeStepId(item)
                                        }
                                        value={
                                            routeStepId(item)
                                        }
                                    >
                                        {
                                            routeStepLabel(item)
                                        }
                                    </option>
                                )
                            )
                        }

                    </Form.Select>

                </Col>


                <Col md={3}>

                    <Form.Label className="lium-label">
                        To / Current Route Step
                    </Form.Label>

                    <Form.Select
                        value={
                            filters.to_route_step_id
                        }
                        onChange={
                            event =>
                                setFilters(
                                    old => ({
                                        ...old,

                                        to_route_step_id:
                                            event.target.value
                                    })
                                )
                        }
                    >

                        <option value="">
                            All
                        </option>

                        {
                            routeSteps.map(
                                item => (

                                    <option
                                        key={
                                            routeStepId(item)
                                        }
                                        value={
                                            routeStepId(item)
                                        }
                                    >
                                        {
                                            routeStepLabel(item)
                                        }
                                    </option>
                                )
                            )
                        }

                    </Form.Select>

                </Col>


                {
                    showResultStatus && (

                        <Col md={3}>

                            <Form.Label className="lium-label">
                                Movement Result
                            </Form.Label>

                            <Form.Select
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
                            >

                                <option value="">
                                    All Results
                                </option>

                                {
                                    Object.values(
                                        INDEXING_RESULT_STATUS
                                    ).map(
                                        value => (

                                            <option
                                                key={value}
                                                value={value}
                                            >
                                                {value}
                                            </option>
                                        )
                                    )
                                }

                            </Form.Select>

                        </Col>
                    )
                }


                {
                    showPositionStatus && (

                        <Col md={3}>

                            <Form.Label className="lium-label">
                                Position Status
                            </Form.Label>

                            <Form.Select
                                value={
                                    filters.position_status
                                }
                                onChange={
                                    event =>
                                        setFilters(
                                            old => ({
                                                ...old,

                                                position_status:
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
                                        UNIT_POSITION_STATUS
                                    ).map(
                                        value => (

                                            <option
                                                key={value}
                                                value={value}
                                            >
                                                {value}
                                            </option>
                                        )
                                    )
                                }

                            </Form.Select>

                        </Col>
                    )
                }


                {
                    showDateRange && (

                        <>

                            <Col md={3}>

                                <Form.Label className="lium-label">
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

                                <Form.Label className="lium-label">
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

                        </>
                    )
                }


                <Col
                    md={6}
                    className="d-flex justify-content-end align-items-end gap-2"
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
                        className="lium-primary"
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
// CURRENT POSITION TABLE
// ============================================================

const PositionTable =
    ({
        rows,
        machineMap,
        stationMap,
        routeStepMap,
        loading,
        onMove,
        hideMove = false
    }) => (

        <div className="lium-table-wrap">

            <Table
                hover
                className="lium-table"
            >

                <thead>

                    <tr>

                        <th>Unit ID</th>
                        <th>Machine</th>
                        <th>Station</th>
                        <th>Current Route Step</th>
                        <th>Position Status</th>
                        <th>Last Update</th>

                        {
                            !hideMove && (
                                <th>Action</th>
                            )
                        }

                    </tr>

                </thead>


                <tbody>

                    {
                        loading
                            ? (

                                <LoadingRow
                                    colSpan={
                                        hideMove
                                            ? 6
                                            : 7
                                    }
                                    text="Loading current Unit Positions..."
                                />
                            )
                            : rows.length ===
                                0
                                ? (

                                    <EmptyRow
                                        colSpan={
                                            hideMove
                                                ? 6
                                                : 7
                                        }
                                        text="No current Unit Position found."
                                    />
                                )
                                : rows.map(
                                    row => {

                                        const machine =
                                            machineMap.get(
                                                String(
                                                    row.current_machine_id
                                                )
                                            );


                                        const station =
                                            stationMap.get(
                                                String(
                                                    row.current_station_id
                                                )
                                            );


                                        const routeStep =
                                            routeStepMap.get(
                                                String(
                                                    row.current_route_step_id
                                                )
                                            );


                                        return (

                                            <tr
                                                key={
                                                    row.unit_id
                                                }
                                            >

                                                <td className="lium-unit">
                                                    {
                                                        safeText(
                                                            row.unit_id
                                                        )
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        machine
                                                            ? machineLabel(
                                                                machine
                                                            )
                                                            : "-"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        station
                                                            ? stationLabel(
                                                                station
                                                            )
                                                            : "-"
                                                    }
                                                </td>


                                                <td>
                                                    <strong>
                                                        {
                                                            routeStepLabel(
                                                                routeStep
                                                            )
                                                        }
                                                    </strong>
                                                </td>


                                                <td>
                                                    <PositionStatusBadge
                                                        status={
                                                            row.position_status
                                                        }
                                                    />
                                                </td>


                                                <td>
                                                    {
                                                        displayDateTime(
                                                            row.position_updated_at
                                                        )
                                                    }
                                                </td>


                                                {
                                                    !hideMove && (

                                                        <td>

                                                            <Button
                                                                size="sm"
                                                                className="lium-primary"
                                                                onClick={() =>
                                                                    onMove(
                                                                        row
                                                                    )
                                                                }
                                                            >
                                                                Move
                                                            </Button>

                                                        </td>
                                                    )
                                                }

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
// MOVEMENT HISTORY TABLE
// ============================================================

const MovementHistoryTable =
    ({
        rows,
        machineMap,
        stationMap,
        routeStepMap,
        loading
    }) => (

        <div className="lium-table-wrap">

            <Table
                hover
                className="lium-table"
            >

                <thead>

                    <tr>

                        <th>Time</th>
                        <th>Unit ID</th>
                        <th>Machine</th>
                        <th>From Route Step</th>
                        <th>To Route Step</th>
                        <th>From Station</th>
                        <th>To Station</th>
                        <th>Shift</th>
                        <th>Trigger</th>
                        <th>Result</th>

                    </tr>

                </thead>


                <tbody>

                    {
                        loading
                            ? (

                                <LoadingRow
                                    colSpan={10}
                                    text="Loading Unit Movement history..."
                                />
                            )
                            : rows.length ===
                                0
                                ? (

                                    <EmptyRow
                                        colSpan={10}
                                        text="No Unit Movement events found."
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


                                        const fromStep =
                                            routeStepMap.get(
                                                String(
                                                    row.from_route_step_id
                                                )
                                            );


                                        const toStep =
                                            routeStepMap.get(
                                                String(
                                                    row.to_route_step_id
                                                )
                                            );


                                        const fromStation =
                                            stationMap.get(
                                                String(
                                                    row.from_station_id
                                                )
                                            );


                                        const toStation =
                                            stationMap.get(
                                                String(
                                                    row.to_station_id
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


                                                <td className="lium-unit">
                                                    {
                                                        safeText(
                                                            row.unit_id
                                                        )
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        machine
                                                            ? machineLabel(
                                                                machine
                                                            )
                                                            : "-"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        fromStep
                                                            ? routeStepLabel(
                                                                fromStep
                                                            )
                                                            : "-"
                                                    }
                                                </td>


                                                <td>
                                                    <strong>
                                                        {
                                                            toStep
                                                                ? routeStepLabel(
                                                                    toStep
                                                                )
                                                                : "-"
                                                        }
                                                    </strong>
                                                </td>


                                                <td>
                                                    {
                                                        fromStation
                                                            ? stationLabel(
                                                                fromStation
                                                            )
                                                            : "-"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        toStation
                                                            ? stationLabel(
                                                                toStation
                                                            )
                                                            : "-"
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
                                                            row.trigger_source
                                                        )
                                                    }
                                                </td>


                                                <td>
                                                    <ResultBadge
                                                        status={
                                                            row.result_status
                                                        }
                                                    />
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

const LoadingRow =
    ({
        colSpan,
        text
    }) => (

        <tr>

            <td
                colSpan={
                    colSpan
                }
                className="lium-empty"
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

const EmptyRow =
    ({
        colSpan,
        text
    }) => (

        <tr>

            <td
                colSpan={
                    colSpan
                }
                className="lium-empty"
            >
                {text}
            </td>

        </tr>
    );


// ============================================================
// EXPORT
// ============================================================

export default LineIndexingUnitMovement;