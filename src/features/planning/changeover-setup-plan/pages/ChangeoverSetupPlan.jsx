import EventJourney from '../../../../shared/operations/EventJourney.jsx';
import ReportLens from '../../../../shared/operations/ReportLens.jsx';
import PlanningBoard from '../../../../shared/operations/PlanningBoard.jsx';

import Table from '../../../../shared/components/SmartTable.jsx';
import React, {
    useEffect,
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
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";

import {
    ArrowClockwise,
    BarChartLine,
    CheckCircle,
    ClipboardCheck,
    Gear,
    ListTask,
    PencilSquare,
    PlayFill,
    Plus,
    Search
} from "react-bootstrap-icons";

import api from "../../../../shared/api/client.js";

import changeoverSetupPlanService, {
    getChangeoverSetupPlanErrorMessage,
    getChangeoverSetupPlanMasterCollections,
    getChangeoverSetupPlanRuntimeCollections,
    getChangeoverSetupPlanReportCollections
} from "../api/changeoverSetupPlan.service.js";


// ============================================================
// CONSTANTS
// ============================================================

const VIEW_MASTER =
    "MASTER";

const VIEW_RUNTIME =
    "RUNTIME";

const MASTER_TEMPLATE =
    "SETUP_TEMPLATE";

const MASTER_CONFIG =
    "SETUP_PLAN_CONFIG";

const MASTER_RULE =
    "CHANGEOVER_RULE";


// ============================================================
// INITIAL STATE
// ============================================================

const templateInitialState = {

    setup_template_id: "",

    company_id: "",

    template_code: "",

    template_name: "",

    setup_type: "",

    template_definition: "{}",

    version_no: 1,

    is_active: true
};


const setupConfigInitialState = {

    setup_plan_config_id: "",

    company_id: "",

    plant_id: "",

    line_id: "",

    machine_id: "",

    setup_config_code: "",

    setup_template_id: "",

    process_id: "",

    from_part_id: "",

    to_part_id: "",

    planned_duration_mins: "",

    approval_required: false,

    is_active: true,

    version_no: 1
};


const ruleInitialState = {

    changeover_rule_id: "",

    company_id: "",

    plant_id: "",

    line_id: "",

    machine_id: "",

    rule_code: "",

    from_part_id: "",

    to_part_id: "",

    process_id: "",

    setup_plan_config_id: "",

    trigger_type: "",

    rule_expression: "",

    priority_no: 100,

    is_active: true,

    version_no: 1
};


const executionInitialState = {

    company_id: "",

    plant_id: "",

    line_id: "",

    machine_id: "",

    shift_id: "",

    plan_id: "",

    plan_entry_id: "",

    setup_plan_config_id: "",

    from_part_id: "",

    to_part_id: "",

    status: "PENDING",

    result_status: "",

    executed_by_user_id: "",

    correlation_id: "",

    idempotency_key: ""
};


const eventInitialState = {

    setup_execution_id: "",

    event_type: "",

    result_status: "COMPLETED",

    reason: "",

    source_system: "MES",

    correlation_id: "",

    idempotency_key: ""
};


const runtimeFilterInitialState = {

    company_id: "",

    plant_id: "",

    line_id: "",

    machine_id: "",

    shift_id: "",

    plan_id: "",

    plan_entry_id: "",

    setup_plan_config_id: "",

    from_part_id: "",

    to_part_id: "",

    status: "",

    result_status: "",

    event_type: "",

    source_system: "",

    from_timestamp: "",

    to_timestamp: ""
};


// ============================================================
// GENERIC HELPERS
// ============================================================

const sameId =
    (left, right) =>
        String(
            left ?? ""
        ) ===
        String(
            right ?? ""
        );


const hasValue =
    value =>
        !(
            value === undefined ||
            value === null ||
            value === ""
        );


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


const nullable =
    value => {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return null;
        }

        return value;
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
            return safeText(value);
        }

        return date
            .toLocaleString();
    };


// ============================================================
// RESPONSE EXTRACTION
// ============================================================

const unwrapLookupRoot =
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


const findArrayByKeys =
    (
        value,
        keys = [],
        visited = new Set()
    ) => {

        if (!value) {
            return [];
        }

        if (
            typeof value === "object" &&
            value !== null
        ) {

            if (
                visited.has(value)
            ) {
                return [];
            }

            visited.add(value);
        }


        if (
            Array.isArray(value)
        ) {

            for (
                const row of value
            ) {

                if (
                    row &&
                    typeof row === "object"
                ) {

                    for (
                        const key of keys
                    ) {

                        if (
                            Array.isArray(
                                row?.[key]
                            )
                        ) {
                            return row[key];
                        }
                    }
                }
            }

            return value;
        }


        if (
            typeof value !==
            "object"
        ) {
            return [];
        }


        for (
            const key of keys
        ) {

            if (
                Array.isArray(
                    value?.[key]
                )
            ) {
                return value[key];
            }
        }


        if (
            Array.isArray(
                value?.rows
            )
        ) {
            return value.rows;
        }


        for (
            const nested of Object.values(
                value
            )
        ) {

            const rows =
                findArrayByKeys(
                    nested,
                    keys,
                    visited
                );

            if (
                rows.length > 0
            ) {
                return rows;
            }
        }


        return [];
    };


const extractRows =
    (
        response,
        keys = []
    ) => {

        const root =
            unwrapLookupRoot(
                response
            );


        if (
            Array.isArray(root)
        ) {
            return root;
        }


        return findArrayByKeys(
            root,
            keys
        );
    };


// ============================================================
// ID / LABEL HELPERS
// ============================================================

const companyId =
    item =>
        item?.company_id ??
        item?.companyId ??
        item?.id ??
        "";


const companyLabel =
    item =>
        item?.company_name ??
        item?.companyName ??
        item?.company_code ??
        item?.companyCode ??
        item?.name ??
        companyId(item);


const plantId =
    item =>
        item?.plant_id ??
        item?.plantId ??
        item?.shop_id ??
        item?.shopId ??
        "";


const plantLabel =
    item =>
        item?.plant_name ??
        item?.plantName ??
        item?.plant_code ??
        item?.plantCode ??
        item?.shop_name ??
        item?.shop_code ??
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
        machineId(item);


const partId =
    item =>
        item?.part_id ??
        item?.partId ??
        "";


const partLabel =
    item =>
        item?.part_no ??
        item?.part_code ??
        item?.part_name ??
        item?.partName ??
        partId(item);


const processId =
    item =>
        item?.process_id ??
        item?.processId ??
        "";


const processLabel =
    item =>
        item?.process_code ??
        item?.process_name ??
        item?.processCode ??
        item?.processName ??
        processId(item);


const shiftId =
    item =>
        item?.shift_id ??
        item?.shiftId ??
        "";


const shiftLabel =
    item => {

        const id =
            shiftId(item);

        const name =
            item?.shift_name ??
            item?.shift_code ??
            item?.name ??
            "";

        return name
            ? `${name} (${id})`
            : `Shift ${id}`;
    };


const planId =
    item =>
        item?.plan_id ??
        item?.planId ??
        "";


const planLabel =
    item =>
        item?.plan_no ??
        item?.plan_code ??
        item?.plan_name ??
        planId(item);


const planEntryId =
    item =>
        item?.plan_entry_id ??
        item?.planEntryId ??
        "";


const planEntryLabel =
    item => {

        const id =
            planEntryId(item);

        const sequence =
            item?.sequence_no ??
            item?.sequence ??
            "";

        const order =
            item?.order_no ??
            item?.production_order_no ??
            "";

        if (
            order &&
            sequence !== ""
        ) {
            return `${order} - Seq ${sequence}`;
        }

        if (order) {
            return order;
        }

        if (
            sequence !== ""
        ) {
            return `Sequence ${sequence}`;
        }

        return id;
    };


// ============================================================
// STATUS BADGE
// ============================================================

const statusVariant =
    value => {

        const status =
            String(
                value || ""
            )
                .trim()
                .toUpperCase();


        if (
            [
                "ACTIVE",
                "OK",
                "COMPLETED",
                "SUCCESS"
            ].includes(status)
        ) {
            return "success";
        }


        if (
            [
                "PENDING",
                "RUNNING",
                "IN_PROGRESS",
                "WARNING"
            ].includes(status)
        ) {
            return "warning";
        }


        if (
            [
                "NOK",
                "FAILED",
                "FAIL",
                "CANCELLED",
                "INACTIVE"
            ].includes(status)
        ) {
            return "danger";
        }


        if (
            status === "HOLD"
        ) {
            return "secondary";
        }


        return "secondary";
    };


// ============================================================
// PAGE
// ============================================================

const ChangeoverSetupPlan =
    () => {

        const queryClient =
            useQueryClient();


        // ====================================================
        // VIEW STATE
        // ====================================================

        const [
            activeView,
            setActiveView
        ] =
            useState(
                VIEW_MASTER
            );


        const [
            selectedMaster,
            setSelectedMaster
        ] =
            useState(
                MASTER_TEMPLATE
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
        // LOOKUPS
        // ====================================================

        const [
            lookupLoading,
            setLookupLoading
        ] =
            useState(false);


        const [
            companies,
            setCompanies
        ] =
            useState([]);


        const [
            plants,
            setPlants
        ] =
            useState([]);


        const [
            lines,
            setLines
        ] =
            useState([]);


        const [
            machines,
            setMachines
        ] =
            useState([]);


        const [
            parts,
            setParts
        ] =
            useState([]);


        const [
            processes,
            setProcesses
        ] =
            useState([]);


        const [
            shifts,
            setShifts
        ] =
            useState([]);


        const [
            productionPlans,
            setProductionPlans
        ] =
            useState([]);


        const [
            planEntries,
            setPlanEntries
        ] =
            useState([]);


        const [
            planEntriesLoading,
            setPlanEntriesLoading
        ] =
            useState(false);


        // ====================================================
        // MODALS
        // ====================================================

        const [
            showTemplate,
            setShowTemplate
        ] =
            useState(false);


        const [
            showSetupConfig,
            setShowSetupConfig
        ] =
            useState(false);


        const [
            showRule,
            setShowRule
        ] =
            useState(false);


        const [
            showExecution,
            setShowExecution
        ] =
            useState(false);


        const [
            showEvent,
            setShowEvent
        ] =
            useState(false);


        // ====================================================
        // FORMS
        // ====================================================

        const [
            templateForm,
            setTemplateForm
        ] =
            useState(
                templateInitialState
            );


        const [
            setupConfigForm,
            setSetupConfigForm
        ] =
            useState(
                setupConfigInitialState
            );


        const [
            ruleForm,
            setRuleForm
        ] =
            useState(
                ruleInitialState
            );


        const [
            executionForm,
            setExecutionForm
        ] =
            useState(
                executionInitialState
            );


        const [
            eventForm,
            setEventForm
        ] =
            useState(
                eventInitialState
            );


        const [
            runtimeFilters,
            setRuntimeFilters
        ] =
            useState(
                runtimeFilterInitialState
            );


        // ====================================================
        // LOOKUP LOAD
        // ====================================================

        const loadLookupData =
            async () => {

                try {

                    setLookupLoading(
                        true
                    );


                    const results =
                        await Promise
                            .allSettled([

                                api.get(
                                    "/company-master/master"
                                ),

                                api.get(
                                    "/plant-shop-master/master"
                                ),

                                api.get(
                                    "/line-master/master"
                                ),

                                api.get(
                                    "/machine-master/master"
                                ),

                                api.get(
                                    "/part-master/master"
                                ),

                                api.get(
                                    "/production-plan/master"
                                ),

                                api.get(
                                    "/shift-plan/config"
                                )
                            ]);


                    const [
                        companyRes,
                        plantRes,
                        lineRes,
                        machineRes,
                        partRes,
                        productionPlanRes,
                        shiftConfigRes
                    ] =
                        results;


                    if (
                        companyRes.status ===
                        "fulfilled"
                    ) {

                        setCompanies(
                            extractRows(
                                companyRes.value,
                                [
                                    "company_master",
                                    "companies",
                                    "company",
                                    "master"
                                ]
                            )
                        );
                    }


                    if (
                        plantRes.status ===
                        "fulfilled"
                    ) {

                        setPlants(
                            extractRows(
                                plantRes.value,
                                [
                                    "plant_master",
                                    "plant_shop_master",
                                    "plants",
                                    "shops",
                                    "master"
                                ]
                            )
                        );
                    }


                    if (
                        lineRes.status ===
                        "fulfilled"
                    ) {

                        setLines(
                            extractRows(
                                lineRes.value,
                                [
                                    "line_master",
                                    "lines",
                                    "master"
                                ]
                            )
                        );
                    }


                    if (
                        machineRes.status ===
                        "fulfilled"
                    ) {

                        setMachines(
                            extractRows(
                                machineRes.value,
                                [
                                    "machine_master",
                                    "machines",
                                    "master"
                                ]
                            )
                        );
                    }


                    if (
                        partRes.status ===
                        "fulfilled"
                    ) {

                        setParts(
                            extractRows(
                                partRes.value,
                                [
                                    "part_master",
                                    "parts",
                                    "master"
                                ]
                            )
                        );
                    }


                    if (
                        productionPlanRes.status ===
                        "fulfilled"
                    ) {

                        setProductionPlans(
                            extractRows(
                                productionPlanRes.value,
                                [
                                    "production_plan",
                                    "production_plans",
                                    "plans",
                                    "master"
                                ]
                            )
                        );
                    }


                    if (
                        shiftConfigRes.status ===
                        "fulfilled"
                    ) {

                        setShifts(
                            extractRows(
                                shiftConfigRes.value,
                                [
                                    "shift_master",
                                    "shifts",
                                    "shift"
                                ]
                            )
                        );


                        setProcesses(
                            extractRows(
                                shiftConfigRes.value,
                                [
                                    "process_master",
                                    "processes",
                                    "process"
                                ]
                            )
                        );
                    }

                }
                catch (error) {

                    console.error(
                        "[ChangeoverSetupPlan] lookup load failed:",
                        error
                    );

                }
                finally {

                    setLookupLoading(
                        false
                    );
                }
            };


        useEffect(
            () => {

                loadLookupData();

            },
            []
        );


        // ====================================================
        // LOAD PLAN ENTRIES
        // ====================================================

        const loadPlanEntriesForPlan =
            async selectedPlanId => {

                if (
                    !selectedPlanId
                ) {

                    setPlanEntries([]);

                    return;
                }


                try {

                    setPlanEntriesLoading(
                        true
                    );


                    const response =
                        await api.get(
                            "/production-plan/config",
                            {
                                params: {
                                    plan_id:
                                        selectedPlanId
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


                    const unique =
                        new Map();


                    rows.forEach(
                        item => {

                            const id =
                                planEntryId(
                                    item
                                );


                            if (id) {

                                unique.set(
                                    String(id),
                                    item
                                );
                            }
                        }
                    );


                    rows =
                        Array.from(
                            unique.values()
                        );


                    rows =
                        rows.filter(
                            item => {

                                const itemPlanId =
                                    item?.plan_id ??
                                    item?.planId;


                                if (
                                    !itemPlanId
                                ) {
                                    return true;
                                }


                                return sameId(
                                    itemPlanId,
                                    selectedPlanId
                                );
                            }
                        );


                    setPlanEntries(
                        rows
                    );

                }
                catch (error) {

                    console.error(
                        "[ChangeoverSetupPlan] Plan Entry load failed:",
                        error
                    );


                    setPlanEntries([]);


                    setErrorMessage(
                        getChangeoverSetupPlanErrorMessage(
                            error,
                            "Unable to load Plan Entry data."
                        )
                    );

                }
                finally {

                    setPlanEntriesLoading(
                        false
                    );
                }
            };


        // ====================================================
        // MASTER QUERY
        // ====================================================

        const masterQuery =
            useQuery({

                queryKey: [
                    "changeover-setup-plan",
                    "master"
                ],

                queryFn:
                    () =>
                        changeoverSetupPlanService
                            .getMaster()
            });


        // ====================================================
        // RUNTIME QUERY
        // ====================================================

        const runtimeQuery =
            useQuery({

                queryKey: [
                    "changeover-setup-plan",
                    "runtime"
                ],

                queryFn:
                    () =>
                        changeoverSetupPlanService
                            .getRuntime(),

                enabled:
                    activeView ===
                    VIEW_RUNTIME
            });


        // ====================================================
        // MASTER DATA
        // ====================================================

        const masterData =
            useMemo(
                () =>
                    getChangeoverSetupPlanMasterCollections(
                        masterQuery.data
                    ),
                [
                    masterQuery.data
                ]
            );


        const setupTemplates =
            masterData.setupTemplates ||
            [];


        const setupPlanConfigs =
            masterData.setupPlanConfigs ||
            [];


        const changeoverRules =
            masterData.changeoverRules ||
            [];


        // ====================================================
        // RUNTIME DATA
        // ====================================================

        const runtimeData =
            useMemo(
                () =>
                    getChangeoverSetupPlanRuntimeCollections(
                        runtimeQuery.data
                    ),
                [
                    runtimeQuery.data
                ]
            );


        const setupExecutions =
            runtimeData.setupExecutions ||
            [];


        const changeoverEvents =
            runtimeData.changeoverEvents ||
            [];


        // ====================================================
        // MAPS
        // ====================================================

        const templateMap =
            useMemo(
                () =>
                    new Map(
                        setupTemplates.map(
                            item => [
                                String(
                                    item.setup_template_id
                                ),
                                item
                            ]
                        )
                    ),
                [
                    setupTemplates
                ]
            );


        const setupConfigMap =
            useMemo(
                () =>
                    new Map(
                        setupPlanConfigs.map(
                            item => [
                                String(
                                    item.setup_plan_config_id
                                ),
                                item
                            ]
                        )
                    ),
                [
                    setupPlanConfigs
                ]
            );


        const partMap =
            useMemo(
                () =>
                    new Map(
                        parts.map(
                            item => [
                                String(
                                    partId(item)
                                ),
                                item
                            ]
                        )
                    ),
                [
                    parts
                ]
            );


        const processMap =
            useMemo(
                () =>
                    new Map(
                        processes.map(
                            item => [
                                String(
                                    processId(item)
                                ),
                                item
                            ]
                        )
                    ),
                [
                    processes
                ]
            );


        const companyMap =
            useMemo(
                () =>
                    new Map(
                        companies.map(
                            item => [
                                String(
                                    companyId(item)
                                ),
                                item
                            ]
                        )
                    ),
                [
                    companies
                ]
            );


        const plantMap =
            useMemo(
                () =>
                    new Map(
                        plants.map(
                            item => [
                                String(
                                    plantId(item)
                                ),
                                item
                            ]
                        )
                    ),
                [
                    plants
                ]
            );


        const lineMap =
            useMemo(
                () =>
                    new Map(
                        lines.map(
                            item => [
                                String(
                                    lineId(item)
                                ),
                                item
                            ]
                        )
                    ),
                [
                    lines
                ]
            );


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


        // ====================================================
        // LOOKUP FILTER HELPERS
        // ====================================================

        const filterPlants =
            company =>
                plants.filter(
                    item =>
                        !company ||
                        !companyId(item) ||
                        sameId(
                            companyId(item),
                            company
                        )
                );


        const filterLines =
            (
                company,
                plant
            ) =>
                lines.filter(
                    item => {

                        if (
                            company &&
                            companyId(item) &&
                            !sameId(
                                companyId(item),
                                company
                            )
                        ) {
                            return false;
                        }


                        const parentPlant =
                            item?.plant_id ??
                            item?.plantId;


                        if (
                            plant &&
                            parentPlant &&
                            !sameId(
                                parentPlant,
                                plant
                            )
                        ) {
                            return false;
                        }


                        return true;
                    }
                );


        const filterMachines =
            (
                company,
                line
            ) =>
                machines.filter(
                    item => {

                        if (
                            company &&
                            companyId(item) &&
                            !sameId(
                                companyId(item),
                                company
                            )
                        ) {
                            return false;
                        }


                        const parentLine =
                            item?.line_id ??
                            item?.lineId;


                        if (
                            line &&
                            parentLine &&
                            !sameId(
                                parentLine,
                                line
                            )
                        ) {
                            return false;
                        }


                        return true;
                    }
                );


        const filterParts =
            company =>
                parts.filter(
                    item =>
                        !company ||
                        !companyId(item) ||
                        sameId(
                            companyId(item),
                            company
                        )
                );


        const filterProcesses =
            company =>
                processes.filter(
                    item =>
                        !company ||
                        !companyId(item) ||
                        sameId(
                            companyId(item),
                            company
                        )
                );


        // ====================================================
        // SETUP CONFIG DEPENDENCIES
        // ====================================================

        const configPlants =
            useMemo(
                () =>
                    filterPlants(
                        setupConfigForm.company_id
                    ),
                [
                    plants,
                    setupConfigForm.company_id
                ]
            );


        const configLines =
            useMemo(
                () =>
                    filterLines(
                        setupConfigForm.company_id,
                        setupConfigForm.plant_id
                    ),
                [
                    lines,
                    setupConfigForm.company_id,
                    setupConfigForm.plant_id
                ]
            );


        const configMachines =
            useMemo(
                () =>
                    filterMachines(
                        setupConfigForm.company_id,
                        setupConfigForm.line_id
                    ),
                [
                    machines,
                    setupConfigForm.company_id,
                    setupConfigForm.line_id
                ]
            );


        const configParts =
            useMemo(
                () =>
                    filterParts(
                        setupConfigForm.company_id
                    ),
                [
                    parts,
                    setupConfigForm.company_id
                ]
            );


        const configProcesses =
            useMemo(
                () =>
                    filterProcesses(
                        setupConfigForm.company_id
                    ),
                [
                    processes,
                    setupConfigForm.company_id
                ]
            );


        const configTemplates =
            useMemo(
                () =>
                    setupTemplates.filter(
                        item =>
                            !setupConfigForm.company_id ||
                            sameId(
                                item.company_id,
                                setupConfigForm.company_id
                            )
                    ),
                [
                    setupTemplates,
                    setupConfigForm.company_id
                ]
            );


        // ====================================================
        // RULE DEPENDENCIES
        // ====================================================

        const rulePlants =
            useMemo(
                () =>
                    filterPlants(
                        ruleForm.company_id
                    ),
                [
                    plants,
                    ruleForm.company_id
                ]
            );


        const ruleLines =
            useMemo(
                () =>
                    filterLines(
                        ruleForm.company_id,
                        ruleForm.plant_id
                    ),
                [
                    lines,
                    ruleForm.company_id,
                    ruleForm.plant_id
                ]
            );


        const ruleMachines =
            useMemo(
                () =>
                    filterMachines(
                        ruleForm.company_id,
                        ruleForm.line_id
                    ),
                [
                    machines,
                    ruleForm.company_id,
                    ruleForm.line_id
                ]
            );


        const ruleParts =
            useMemo(
                () =>
                    filterParts(
                        ruleForm.company_id
                    ),
                [
                    parts,
                    ruleForm.company_id
                ]
            );


        const ruleProcesses =
            useMemo(
                () =>
                    filterProcesses(
                        ruleForm.company_id
                    ),
                [
                    processes,
                    ruleForm.company_id
                ]
            );


        const ruleConfigs =
            useMemo(
                () =>
                    setupPlanConfigs.filter(
                        item =>
                            !ruleForm.company_id ||
                            sameId(
                                item.company_id,
                                ruleForm.company_id
                            )
                    ),
                [
                    setupPlanConfigs,
                    ruleForm.company_id
                ]
            );


        // ====================================================
        // EXECUTION DEPENDENCIES
        // ====================================================

        const executionPlants =
            useMemo(
                () =>
                    filterPlants(
                        executionForm.company_id
                    ),
                [
                    plants,
                    executionForm.company_id
                ]
            );


        const executionLines =
            useMemo(
                () =>
                    filterLines(
                        executionForm.company_id,
                        executionForm.plant_id
                    ),
                [
                    lines,
                    executionForm.company_id,
                    executionForm.plant_id
                ]
            );


        const executionMachines =
            useMemo(
                () =>
                    filterMachines(
                        executionForm.company_id,
                        executionForm.line_id
                    ),
                [
                    machines,
                    executionForm.company_id,
                    executionForm.line_id
                ]
            );


        const executionParts =
            useMemo(
                () =>
                    filterParts(
                        executionForm.company_id
                    ),
                [
                    parts,
                    executionForm.company_id
                ]
            );


        const executionPlans =
            useMemo(
                () =>
                    productionPlans.filter(
                        item =>
                            !executionForm.company_id ||
                            !companyId(item) ||
                            sameId(
                                companyId(item),
                                executionForm.company_id
                            )
                    ),
                [
                    productionPlans,
                    executionForm.company_id
                ]
            );


        const executionPlanEntries =
            useMemo(
                () => {

                    if (
                        !executionForm.plan_id
                    ) {
                        return [];
                    }


                    return planEntries.filter(
                        item => {

                            const rowPlanId =
                                item?.plan_id ??
                                item?.planId;


                            if (!rowPlanId) {
                                return true;
                            }


                            return sameId(
                                rowPlanId,
                                executionForm.plan_id
                            );
                        }
                    );
                },
                [
                    planEntries,
                    executionForm.plan_id
                ]
            );


        const executionConfigs =
            useMemo(
                () =>
                    setupPlanConfigs.filter(
                        item => {

                            if (
                                executionForm.company_id &&
                                !sameId(
                                    item.company_id,
                                    executionForm.company_id
                                )
                            ) {
                                return false;
                            }


                            if (
                                item.plant_id &&
                                executionForm.plant_id &&
                                !sameId(
                                    item.plant_id,
                                    executionForm.plant_id
                                )
                            ) {
                                return false;
                            }


                            if (
                                item.line_id &&
                                executionForm.line_id &&
                                !sameId(
                                    item.line_id,
                                    executionForm.line_id
                                )
                            ) {
                                return false;
                            }


                            if (
                                item.machine_id &&
                                executionForm.machine_id &&
                                !sameId(
                                    item.machine_id,
                                    executionForm.machine_id
                                )
                            ) {
                                return false;
                            }


                            if (
                                item.from_part_id &&
                                executionForm.from_part_id &&
                                !sameId(
                                    item.from_part_id,
                                    executionForm.from_part_id
                                )
                            ) {
                                return false;
                            }


                            if (
                                item.to_part_id &&
                                executionForm.to_part_id &&
                                !sameId(
                                    item.to_part_id,
                                    executionForm.to_part_id
                                )
                            ) {
                                return false;
                            }


                            return Boolean(
                                item.is_active
                            );
                        }
                    ),
                [
                    setupPlanConfigs,
                    executionForm
                ]
            );


        // ====================================================
        // SEARCHED TABLES
        // ====================================================

        const searchedTemplates =
            useMemo(
                () => {

                    const search =
                        searchText
                            .trim()
                            .toLowerCase();


                    if (!search) {
                        return setupTemplates;
                    }


                    return setupTemplates.filter(
                        row =>
                            [
                                row.template_code,
                                row.template_name,
                                row.setup_type,
                                row.version_no,
                                row.is_active
                            ]
                                .join(" ")
                                .toLowerCase()
                                .includes(
                                    search
                                )
                    );
                },
                [
                    setupTemplates,
                    searchText
                ]
            );


        const searchedConfigs =
            useMemo(
                () => {

                    const search =
                        searchText
                            .trim()
                            .toLowerCase();


                    if (!search) {
                        return setupPlanConfigs;
                    }


                    return setupPlanConfigs.filter(
                        row => {

                            const template =
                                templateMap.get(
                                    String(
                                        row.setup_template_id
                                    )
                                );


                            return [
                                row.setup_config_code,
                                template?.template_code,
                                row.planned_duration_mins,
                                row.version_no,
                                row.is_active
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
                    setupPlanConfigs,
                    templateMap,
                    searchText
                ]
            );


        const searchedRules =
            useMemo(
                () => {

                    const search =
                        searchText
                            .trim()
                            .toLowerCase();


                    if (!search) {
                        return changeoverRules;
                    }


                    return changeoverRules.filter(
                        row => {

                            const config =
                                setupConfigMap.get(
                                    String(
                                        row.setup_plan_config_id
                                    )
                                );


                            return [
                                row.rule_code,
                                row.trigger_type,
                                row.priority_no,
                                config?.setup_config_code,
                                row.version_no,
                                row.is_active
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
                    changeoverRules,
                    setupConfigMap,
                    searchText
                ]
            );


        // ====================================================
        // REFRESH
        // ====================================================

        const refreshModule =
            async () => {

                await Promise.all([

                    queryClient
                        .invalidateQueries({
                            queryKey: [
                                "changeover-setup-plan",
                                "master"
                            ]
                        }),

                    queryClient
                        .invalidateQueries({
                            queryKey: [
                                "changeover-setup-plan",
                                "runtime"
                            ]
                        })
                ]);
            };


        // ====================================================
        // TEMPLATE MUTATION
        // ====================================================

        const templateMutation =
            useMutation({

                mutationFn:
                    async payload => {

                        if (
                            payload.setup_template_id
                        ) {

                            const {
                                setup_template_id,
                                ...body
                            } =
                                payload;


                            return changeoverSetupPlanService
                                .updateSetupTemplate(
                                    setup_template_id,
                                    body
                                );
                        }


                        return changeoverSetupPlanService
                            .createSetupTemplate(
                                payload
                            );
                    },


                onSuccess:
                    async () => {

                        setErrorMessage("");

                        setMessage(
                            templateForm.setup_template_id
                                ? "Setup template updated successfully."
                                : "Setup template created successfully."
                        );

                        setShowTemplate(
                            false
                        );

                        setTemplateForm(
                            templateInitialState
                        );

                        await refreshModule();
                    },


                onError:
                    error => {

                        setMessage("");

                        setErrorMessage(
                            getChangeoverSetupPlanErrorMessage(
                                error
                            )
                        );
                    }
            });


        // ====================================================
        // CONFIG MUTATION
        // ====================================================

        const setupConfigMutation =
            useMutation({

                mutationFn:
                    async payload => {

                        if (
                            payload.setup_plan_config_id
                        ) {

                            const {
                                setup_plan_config_id,
                                ...body
                            } =
                                payload;


                            return changeoverSetupPlanService
                                .updateSetupPlanConfig(
                                    setup_plan_config_id,
                                    body
                                );
                        }


                        return changeoverSetupPlanService
                            .createSetupPlanConfig(
                                payload
                            );
                    },


                onSuccess:
                    async () => {

                        setErrorMessage("");

                        setMessage(
                            setupConfigForm.setup_plan_config_id
                                ? "Setup plan configuration updated successfully."
                                : "Setup plan configuration created successfully."
                        );

                        setShowSetupConfig(
                            false
                        );

                        setSetupConfigForm(
                            setupConfigInitialState
                        );

                        await refreshModule();
                    },


                onError:
                    error => {

                        setMessage("");

                        setErrorMessage(
                            getChangeoverSetupPlanErrorMessage(
                                error
                            )
                        );
                    }
            });


        // ====================================================
        // RULE MUTATION
        // ====================================================

        const ruleMutation =
            useMutation({

                mutationFn:
                    async payload => {

                        if (
                            payload.changeover_rule_id
                        ) {

                            const {
                                changeover_rule_id,
                                ...body
                            } =
                                payload;


                            return changeoverSetupPlanService
                                .updateChangeoverRule(
                                    changeover_rule_id,
                                    body
                                );
                        }


                        return changeoverSetupPlanService
                            .createChangeoverRule(
                                payload
                            );
                    },


                onSuccess:
                    async () => {

                        setErrorMessage("");

                        setMessage(
                            ruleForm.changeover_rule_id
                                ? "Changeover rule updated successfully."
                                : "Changeover rule created successfully."
                        );

                        setShowRule(
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
                            getChangeoverSetupPlanErrorMessage(
                                error
                            )
                        );
                    }
            });


        // ====================================================
        // CREATE EXECUTION
        // ====================================================

        const executionMutation =
            useMutation({

                mutationFn:
                    payload =>
                        changeoverSetupPlanService
                            .createSetupExecution(
                                payload
                            ),


                onSuccess:
                    async response => {

                        const result =
                            response?.data?.data ??
                            response?.data ??
                            response;


                        setErrorMessage("");

                        setMessage(
                            result?.idempotent
                                ? "This setup execution was already processed."
                                : "Setup execution created successfully."
                        );

                        setShowExecution(
                            false
                        );

                        setExecutionForm(
                            executionInitialState
                        );

                        setPlanEntries([]);

                        await refreshModule();

                        setActiveView(
                            VIEW_RUNTIME
                        );
                    },


                onError:
                    error => {

                        setMessage("");

                        setErrorMessage(
                            getChangeoverSetupPlanErrorMessage(
                                error
                            )
                        );
                    }
            });


        // ====================================================
        // UPDATE EXECUTION
        // ====================================================

        const updateExecutionMutation =
            useMutation({

                mutationFn:
                    ({
                        id,
                        data
                    }) =>
                        changeoverSetupPlanService
                            .updateSetupExecution(
                                id,
                                data
                            ),


                onSuccess:
                    async () => {

                        setErrorMessage("");

                        setMessage(
                            "Setup execution updated successfully."
                        );

                        await refreshModule();
                    },


                onError:
                    error => {

                        setMessage("");

                        setErrorMessage(
                            getChangeoverSetupPlanErrorMessage(
                                error
                            )
                        );
                    }
            });


        // ====================================================
        // EVENT MUTATION
        // ====================================================

        const eventMutation =
            useMutation({

                mutationFn:
                    payload =>
                        changeoverSetupPlanService
                            .createChangeoverEvent(
                                payload.setup_execution_id,
                                {
                                    event_type:
                                        payload.event_type,

                                    result_status:
                                        payload.result_status,

                                    reason:
                                        nullable(
                                            payload.reason
                                        ),

                                    source_system:
                                        payload.source_system,

                                    correlation_id:
                                        nullable(
                                            payload.correlation_id
                                        ),

                                    idempotency_key:
                                        nullable(
                                            payload.idempotency_key
                                        )
                                }
                            ),


                onSuccess:
                    async response => {

                        const result =
                            response?.data?.data ??
                            response?.data ??
                            response;


                        setErrorMessage("");

                        setMessage(
                            result?.idempotent
                                ? "This changeover event was already processed."
                                : "Changeover event recorded successfully."
                        );

                        setShowEvent(
                            false
                        );

                        setEventForm(
                            eventInitialState
                        );

                        await refreshModule();
                    },


                onError:
                    error => {

                        setMessage("");

                        setErrorMessage(
                            getChangeoverSetupPlanErrorMessage(
                                error
                            )
                        );
                    }
            });


        // ====================================================
        // REPORT MUTATION
        // ====================================================

        const reportMutation =
            useMutation({

                mutationFn:
                    () =>
                        changeoverSetupPlanService
                            .getReport(
                                runtimeFilters
                            ),


                onSuccess:
                    response => {

                        const report =
                            getChangeoverSetupPlanReportCollections(
                                response
                            );


                        setErrorMessage("");

                        setMessage(
                            `Report loaded: ${
                                report.setupExecutions.length
                            } execution(s), ${
                                report.changeoverEvents.length
                            } event(s).`
                        );
                    },


                onError:
                    error => {

                        setMessage("");

                        setErrorMessage(
                            getChangeoverSetupPlanErrorMessage(
                                error
                            )
                        );
                    }
            });


        // ====================================================
        // DEFAULT COMPANY
        // ====================================================

        const defaultCompany =
            companies.length === 1
                ? companyId(
                    companies[0]
                )
                : "";


        // ====================================================
        // OPEN TEMPLATE
        // ====================================================

        const openTemplateCreate =
            () => {

                setTemplateForm({
                    ...templateInitialState,

                    company_id:
                        defaultCompany
                });

                setShowTemplate(
                    true
                );
            };


        const openTemplateEdit =
            row => {

                setTemplateForm({

                    setup_template_id:
                        row.setup_template_id,

                    company_id:
                        row.company_id,

                    template_code:
                        row.template_code ||
                        "",

                    template_name:
                        row.template_name ||
                        "",

                    setup_type:
                        row.setup_type ||
                        "",

                    template_definition:
                        JSON.stringify(
                            row.template_definition ??
                            {},
                            null,
                            2
                        ),

                    version_no:
                        row.version_no ??
                        1,

                    is_active:
                        Boolean(
                            row.is_active
                        )
                });


                setShowTemplate(
                    true
                );
            };


        // ====================================================
        // OPEN CONFIG
        // ====================================================

        const openSetupConfigCreate =
            () => {

                setSetupConfigForm({
                    ...setupConfigInitialState,

                    company_id:
                        defaultCompany
                });

                setShowSetupConfig(
                    true
                );
            };


        const openSetupConfigEdit =
            row => {

                setSetupConfigForm({

                    setup_plan_config_id:
                        row.setup_plan_config_id,

                    company_id:
                        row.company_id,

                    plant_id:
                        row.plant_id ||
                        "",

                    line_id:
                        row.line_id ||
                        "",

                    machine_id:
                        row.machine_id ||
                        "",

                    setup_config_code:
                        row.setup_config_code ||
                        "",

                    setup_template_id:
                        row.setup_template_id ||
                        "",

                    process_id:
                        row.process_id ||
                        "",

                    from_part_id:
                        row.from_part_id ||
                        "",

                    to_part_id:
                        row.to_part_id ||
                        "",

                    planned_duration_mins:
                        row.planned_duration_mins ??
                        "",

                    approval_required:
                        Boolean(
                            row.approval_required
                        ),

                    is_active:
                        Boolean(
                            row.is_active
                        ),

                    version_no:
                        row.version_no ??
                        1
                });


                setShowSetupConfig(
                    true
                );
            };


        // ====================================================
        // OPEN RULE
        // ====================================================

        const openRuleCreate =
            () => {

                setRuleForm({
                    ...ruleInitialState,

                    company_id:
                        defaultCompany
                });

                setShowRule(
                    true
                );
            };


        const openRuleEdit =
            row => {

                setRuleForm({

                    changeover_rule_id:
                        row.changeover_rule_id,

                    company_id:
                        row.company_id,

                    plant_id:
                        row.plant_id ||
                        "",

                    line_id:
                        row.line_id ||
                        "",

                    machine_id:
                        row.machine_id ||
                        "",

                    rule_code:
                        row.rule_code ||
                        "",

                    from_part_id:
                        row.from_part_id ||
                        "",

                    to_part_id:
                        row.to_part_id ||
                        "",

                    process_id:
                        row.process_id ||
                        "",

                    setup_plan_config_id:
                        row.setup_plan_config_id ||
                        "",

                    trigger_type:
                        row.trigger_type ||
                        "",

                    rule_expression:
                        row.rule_expression ||
                        "",

                    priority_no:
                        row.priority_no ??
                        100,

                    is_active:
                        Boolean(
                            row.is_active
                        ),

                    version_no:
                        row.version_no ??
                        1
                });


                setShowRule(
                    true
                );
            };


        // ====================================================
        // OPEN EXECUTION
        // ====================================================

        const openExecutionCreate =
            () => {

                setPlanEntries([]);

                setExecutionForm({
                    ...executionInitialState,

                    company_id:
                        defaultCompany
                });

                setShowExecution(
                    true
                );
            };


        // ====================================================
        // OPEN EVENT
        // ====================================================

        const openEventForm =
            execution => {

                setEventForm({
                    ...eventInitialState,

                    setup_execution_id:
                        execution.setup_execution_id,

                    correlation_id:
                        execution.correlation_id ||
                        ""
                });

                setShowEvent(
                    true
                );
            };


        // ====================================================
        // SUBMIT TEMPLATE
        // ====================================================

        const submitTemplate =
            event => {

                event.preventDefault();


                let definition;


                try {

                    definition =
                        JSON.parse(
                            templateForm
                                .template_definition
                        );

                }
                catch {

                    setErrorMessage(
                        "Template Definition must contain valid JSON."
                    );

                    return;
                }


                templateMutation.mutate({

                    ...templateForm,

                    template_definition:
                        definition,

                    version_no:
                        Number(
                            templateForm.version_no
                        )
                });
            };


        // ====================================================
        // SUBMIT CONFIG
        // ====================================================

        const submitSetupConfig =
            event => {

                event.preventDefault();


                setupConfigMutation.mutate({

                    ...setupConfigForm,

                    plant_id:
                        nullable(
                            setupConfigForm.plant_id
                        ),

                    line_id:
                        nullable(
                            setupConfigForm.line_id
                        ),

                    machine_id:
                        nullable(
                            setupConfigForm.machine_id
                        ),

                    process_id:
                        nullable(
                            setupConfigForm.process_id
                        ),

                    from_part_id:
                        nullable(
                            setupConfigForm.from_part_id
                        ),

                    to_part_id:
                        nullable(
                            setupConfigForm.to_part_id
                        ),

                    planned_duration_mins:
                        Number(
                            setupConfigForm
                                .planned_duration_mins
                        ),

                    version_no:
                        Number(
                            setupConfigForm
                                .version_no
                        )
                });
            };


        // ====================================================
        // SUBMIT RULE
        // ====================================================

        const submitRule =
            event => {

                event.preventDefault();


                ruleMutation.mutate({

                    ...ruleForm,

                    plant_id:
                        nullable(
                            ruleForm.plant_id
                        ),

                    line_id:
                        nullable(
                            ruleForm.line_id
                        ),

                    machine_id:
                        nullable(
                            ruleForm.machine_id
                        ),

                    from_part_id:
                        nullable(
                            ruleForm.from_part_id
                        ),

                    to_part_id:
                        nullable(
                            ruleForm.to_part_id
                        ),

                    process_id:
                        nullable(
                            ruleForm.process_id
                        ),

                    rule_expression:
                        nullable(
                            ruleForm.rule_expression
                        ),

                    priority_no:
                        Number(
                            ruleForm.priority_no
                        ),

                    version_no:
                        Number(
                            ruleForm.version_no
                        )
                });
            };


        // ====================================================
        // SUBMIT EXECUTION
        // ====================================================

        const submitExecution =
            event => {

                event.preventDefault();


                executionMutation.mutate({

                    ...executionForm,

                    shift_id:
                        Number(
                            executionForm.shift_id
                        ),

                    from_part_id:
                        nullable(
                            executionForm.from_part_id
                        ),

                    result_status:
                        nullable(
                            executionForm.result_status
                        ),

                    executed_by_user_id:
                        hasValue(
                            executionForm
                                .executed_by_user_id
                        )
                            ? Number(
                                executionForm
                                    .executed_by_user_id
                            )
                            : null,

                    correlation_id:
                        nullable(
                            executionForm.correlation_id
                        ),

                    idempotency_key:
                        nullable(
                            executionForm.idempotency_key
                        )
                });
            };


        // ====================================================
        // SUBMIT EVENT
        // ====================================================

        const submitEvent =
            event => {

                event.preventDefault();


                eventMutation.mutate(
                    eventForm
                );
            };


        // ====================================================
        // START EXECUTION
        // ====================================================

        const startExecution =
            row => {

                updateExecutionMutation.mutate({

                    id:
                        row.setup_execution_id,

                    data: {

                        status:
                            "RUNNING",

                        started_at:
                            new Date()
                                .toISOString()
                    }
                });
            };


        // ====================================================
        // COMPLETE EXECUTION
        // ====================================================

        const completeExecution =
            row => {

                updateExecutionMutation.mutate({

                    id:
                        row.setup_execution_id,

                    data: {

                        status:
                            "COMPLETED",

                        result_status:
                            row.result_status ||
                            "OK",

                        completed_at:
                            new Date()
                                .toISOString()
                    }
                });
            };


        // ====================================================
        // APPLY RUNTIME FILTERS
        // ====================================================

        const applyRuntimeFilters =
            async () => {

                try {

                    setErrorMessage("");


                    const response =
                        await changeoverSetupPlanService
                            .getRuntime(
                                runtimeFilters
                            );


                    queryClient
                        .setQueryData(
                            [
                                "changeover-setup-plan",
                                "runtime"
                            ],
                            response
                        );

                }
                catch (error) {

                    setErrorMessage(
                        getChangeoverSetupPlanErrorMessage(
                            error
                        )
                    );
                }
            };


        // ====================================================
        // REFRESH ALL
        // ====================================================

        const handleRefresh =
            async () => {

                try {

                    setMessage("");

                    setErrorMessage("");


                    await Promise.all([

                        masterQuery
                            .refetch(),

                        activeView ===
                        VIEW_RUNTIME
                            ? runtimeQuery
                                .refetch()
                            : Promise.resolve(),

                        loadLookupData()
                    ]);


                    setMessage(
                        "Data refreshed successfully."
                    );

                }
                catch (error) {

                    setErrorMessage(
                        getChangeoverSetupPlanErrorMessage(
                            error,
                            "Unable to refresh data."
                        )
                    );
                }
            };


        // ====================================================
        // CURRENT COUNT
        // ====================================================

        const currentCount =
            selectedMaster ===
            MASTER_TEMPLATE

                ? searchedTemplates.length

                : selectedMaster ===
                    MASTER_CONFIG

                    ? searchedConfigs.length

                    : searchedRules.length;


        // ====================================================
        // UI
        // ====================================================

        return (

            <>

<div className="csp-page">

                <style>{`

                    .csp-page {
                        min-height: 100vh;
                        background: #f4f6fb;
                        padding: 22px;
                    }

                    .csp-card {
                        background: #ffffff;
                        border: 1px solid #e4e8f0;
                        border-radius: 12px;
                        box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
                    }

                    .csp-title {
                        margin: 0;
                        font-size: 22px;
                        font-weight: 700;
                        color: #1f2d3d;
                    }

                    .csp-subtitle {
                        margin-top: 4px;
                        font-size: 13px;
                        color: #748094;
                    }

                    .csp-btn-primary {
                        background: #b74a26;
                        border-color: #b74a26;
                        font-weight: 600;
                    }

                    .csp-btn-primary:hover,
                    .csp-btn-primary:focus {
                        background: #5d3dd6;
                        border-color: #5d3dd6;
                    }

                    .csp-btn-outline {
                        background: #ffffff;
                        color: #b74a26;
                        border: 1px solid #b74a26;
                        font-weight: 600;
                    }

                    .csp-btn-outline:hover {
                        background: #b74a26;
                        color: #ffffff;
                    }

                    .csp-tabs {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    }

                    .csp-tab {
                        border: 1px solid #d9dce5;
                        border-radius: 7px;
                        background: #ffffff;
                        color: #566176;
                        font-weight: 600;
                        padding: 8px 15px;
                    }

                    .csp-tab.active {
                        background: #f1edff;
                        color: #b74a26;
                        border-color: #b74a26;
                    }

                    .csp-stat {
                        padding: 15px;
                        border-radius: 11px;
                        border: 1px solid #e5e9f2;
                        background: #ffffff;
                        height: 100%;
                    }

                    .csp-stat-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 9px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #f1edff;
                        color: #b74a26;
                        font-size: 18px;
                    }

                    .csp-stat-value {
                        color: #263449;
                        font-size: 21px;
                        font-weight: 700;
                    }

                    .csp-stat-label {
                        color: #758195;
                        font-size: 12px;
                    }

                    .csp-toolbar {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 12px;
                    }

                    .csp-search {
                        position: relative;
                        width: 330px;
                        max-width: 100%;
                    }

                    .csp-search svg {
                        position: absolute;
                        left: 11px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #8792a5;
                    }

                    .csp-search input {
                        padding-left: 34px;
                    }

                    .csp-master-select {
                        min-width: 220px;
                    }

                    .csp-table-wrap {
                        border: 1px solid #e4e7ee;
                        border-radius: 9px;
                        overflow: auto;
                    }

                    .csp-table {
                        margin: 0;
                        white-space: nowrap;
                    }

                    .csp-table thead th {
                        padding: 12px;
                        background: #1d2d45;
                        color: #ffffff;
                        border-color: #1d2d45;
                        font-size: 12px;
                        font-weight: 700;
                    }

                    .csp-table tbody td {
                        vertical-align: middle;
                        padding: 11px 12px;
                        color: #364152;
                        font-size: 13px;
                    }

                    .csp-empty {
                        text-align: center;
                        padding: 30px !important;
                        color: #8a94a6 !important;
                    }

                    .csp-edit {
                        background: #ffffff;
                        color: #b74a26;
                        border: 1px solid #b74a26;
                        font-size: 12px;
                        font-weight: 600;
                    }

                    .csp-edit:hover {
                        background: #b74a26;
                        color: #ffffff;
                    }

                    .csp-modal .modal-content {
                        border: none;
                        border-radius: 12px;
                        overflow: hidden;
                    }

                    .csp-modal .modal-header {
                        background: #1d2d45;
                        color: #ffffff;
                        border: none;
                    }

                    .csp-modal .btn-close {
                        filter: invert(1);
                    }

                    .csp-label {
                        margin-bottom: 5px;
                        color: #354154;
                        font-size: 12px;
                        font-weight: 700;
                    }

                    .csp-required {
                        color: #dc3545;
                    }

                    .csp-filter-panel {
                        margin-bottom: 16px;
                        padding: 15px;
                        border: 1px solid #e5e9f2;
                        border-radius: 9px;
                        background: #f9fafc;
                    }

                    .csp-help {
                        display: block;
                        margin-top: 5px;
                        color: #8893a6;
                        font-size: 11px;
                    }

                    .csp-json {
                        min-height: 220px;
                        font-family: Consolas, monospace;
                        font-size: 12px;
                    }

                    @media (max-width: 768px) {

                        .csp-page {
                            padding: 12px;
                        }

                        .csp-search {
                            width: 100%;
                        }

                        .csp-toolbar {
                            align-items: stretch;
                        }

                        .csp-master-select {
                            width: 100%;
                        }
                    }

                `}</style>


                {/* =================================================
                    HEADER
                ================================================= */}

                <Card className="csp-card mb-3">

                    <Card.Body>

                        <Row className="align-items-center g-3">

                            <Col lg={7}>

                                <h4 className="csp-title">
                                    Changeover / Setup Plan
                                </h4>

                                <div className="csp-subtitle">
                                    Configure setup templates, setup plans and changeover rules and execute production changeovers.
                                </div>

                            </Col>


                            <Col lg={5}>

                                <div className="d-flex justify-content-lg-end gap-2 flex-wrap">

                                    <Button
                                        className="csp-btn-outline"
                                        onClick={
                                            handleRefresh
                                        }
                                    >
                                        <ArrowClockwise className="me-1" />

                                        Refresh
                                    </Button>


                                    <Button
                                        className="csp-btn-outline"
                                        onClick={
                                            () =>
                                                setActiveView(
                                                    VIEW_RUNTIME
                                                )
                                        }
                                    >
                                        <BarChartLine className="me-1" />

                                        Runtime
                                    </Button>


                                    <Button
                                        className="csp-btn-primary"
                                        onClick={
                                            openExecutionCreate
                                        }
                                    >
                                        <PlayFill className="me-1" />

                                        Start Setup
                                    </Button>

                                </div>

                            </Col>

                        </Row>

                    </Card.Body>

                </Card>


                {/* =================================================
                    ALERTS
                ================================================= */}

                {
                    message &&
                    (
                        <Alert
                            variant="success"
                            dismissible
                            onClose={
                                () =>
                                    setMessage("")
                            }
                        >
                            {message}
                        </Alert>
                    )
                }


                {
                    errorMessage &&
                    (
                        <Alert
                            variant="danger"
                            dismissible
                            onClose={
                                () =>
                                    setErrorMessage("")
                            }
                        >
                            {errorMessage}
                        </Alert>
                    )
                }


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <Row className="g-3 mb-3">

                    <Col md={3}>

                        <div className="csp-stat">

                            <div className="d-flex gap-3 align-items-center">

                                <div className="csp-stat-icon">
                                    <ClipboardCheck />
                                </div>

                                <div>

                                    <div className="csp-stat-value">
                                        {setupTemplates.length}
                                    </div>

                                    <div className="csp-stat-label">
                                        Setup Templates
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>


                    <Col md={3}>

                        <div className="csp-stat">

                            <div className="d-flex gap-3 align-items-center">

                                <div className="csp-stat-icon">
                                    <Gear />
                                </div>

                                <div>

                                    <div className="csp-stat-value">
                                        {setupPlanConfigs.length}
                                    </div>

                                    <div className="csp-stat-label">
                                        Setup Configurations
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>


                    <Col md={3}>

                        <div className="csp-stat">

                            <div className="d-flex gap-3 align-items-center">

                                <div className="csp-stat-icon">
                                    <ListTask />
                                </div>

                                <div>

                                    <div className="csp-stat-value">
                                        {changeoverRules.length}
                                    </div>

                                    <div className="csp-stat-label">
                                        Changeover Rules
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>


                    <Col md={3}>

                        <div className="csp-stat">

                            <div className="d-flex gap-3 align-items-center">

                                <div className="csp-stat-icon">
                                    <PlayFill />
                                </div>

                                <div>

                                    <div className="csp-stat-value">
                                        {setupExecutions.length}
                                    </div>

                                    <div className="csp-stat-label">
                                        Setup Executions
                                    </div>

                                </div>

                            </div>

                        </div>

                    </Col>

                </Row>


                {/* =================================================
                    MAIN CARD
                ================================================= */}

                <Card className="csp-card">

                    <Card.Body>

                        <div className="csp-tabs mb-3">

                            <button
                                type="button"
                                className={
                                    `csp-tab ${
                                        activeView ===
                                        VIEW_MASTER
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={
                                    () =>
                                        setActiveView(
                                            VIEW_MASTER
                                        )
                                }
                            >
                                Master Configuration
                            </button>


                            <button
                                type="button"
                                className={
                                    `csp-tab ${
                                        activeView ===
                                        VIEW_RUNTIME
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={
                                    () =>
                                        setActiveView(
                                            VIEW_RUNTIME
                                        )
                                }
                            >
                                Changeover Runtime
                            </button>

                        </div>


                        {/* =========================================
                            MASTER VIEW
                        ========================================== */}

                        {
                            activeView ===
                            VIEW_MASTER &&
                            (
                                <>

                                    <div className="csp-toolbar mb-3">

                                        <div className="d-flex gap-2 flex-wrap">

                                            <Form.Select
                                                className="csp-master-select"
                                                value={
                                                    selectedMaster
                                                }
                                                onChange={
                                                    event => {

                                                        setSelectedMaster(
                                                            event.target.value
                                                        );

                                                        setSearchText("");
                                                    }
                                                }
                                            >

                                                <option value={MASTER_TEMPLATE}>
                                                    Setup Template
                                                </option>

                                                <option value={MASTER_CONFIG}>
                                                    Setup Plan Config
                                                </option>

                                                <option value={MASTER_RULE}>
                                                    Changeover Rule
                                                </option>

                                            </Form.Select>


                                            <div className="csp-search">

                                                <Search />

                                                <Form.Control
                                                    placeholder="Search..."
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

                                        </div>


                                        <Button
                                            className="csp-btn-primary"
                                            onClick={
                                                selectedMaster ===
                                                MASTER_TEMPLATE

                                                    ? openTemplateCreate

                                                    : selectedMaster ===
                                                        MASTER_CONFIG

                                                        ? openSetupConfigCreate

                                                        : openRuleCreate
                                            }
                                        >
                                            <Plus className="me-1" />

                                            {
                                                selectedMaster ===
                                                MASTER_TEMPLATE

                                                    ? "Add Template"

                                                    : selectedMaster ===
                                                        MASTER_CONFIG

                                                        ? "Add Setup Config"

                                                        : "Add Rule"
                                            }

                                        </Button>

                                    </div>


                                    <div className="text-muted small mb-2">
                                        Showing {currentCount} record(s)
                                    </div>


                                    {
                                        masterQuery.isLoading
                                            ? (
                                                <div className="text-center py-5">

                                                    <Spinner animation="border" />

                                                </div>
                                            )
                                            : (
                                                <div className="csp-table-wrap">


                                                    {/* =========================
                                                        TEMPLATE TABLE
                                                    ========================== */}

                                                    {
                                                        selectedMaster ===
                                                        MASTER_TEMPLATE &&
                                                        (
                                                            <Table className="csp-table" hover>

                                                                <thead>

                                                                    <tr>
                                                                        <th>Template Code</th>
                                                                        <th>Template Name</th>
                                                                        <th>Setup Type</th>
                                                                        <th>Version</th>
                                                                        <th>Active</th>
                                                                        <th>Action</th>
                                                                    </tr>

                                                                </thead>


                                                                <tbody>

                                                                    {
                                                                        searchedTemplates.length ===
                                                                        0
                                                                            ? (
                                                                                <tr>

                                                                                    <td
                                                                                        colSpan={6}
                                                                                        className="csp-empty"
                                                                                    >
                                                                                        No setup template records found.
                                                                                    </td>

                                                                                </tr>
                                                                            )
                                                                            : searchedTemplates.map(
                                                                                row => (

                                                                                    <tr key={row.setup_template_id}>

                                                                                        <td>
                                                                                            <strong>
                                                                                                {safeText(row.template_code)}
                                                                                            </strong>
                                                                                        </td>

                                                                                        <td>
                                                                                            {safeText(row.template_name)}
                                                                                        </td>

                                                                                        <td>
                                                                                            {safeText(row.setup_type)}
                                                                                        </td>

                                                                                        <td>
                                                                                            {safeText(row.version_no)}
                                                                                        </td>

                                                                                        <td>

                                                                                            <Badge
                                                                                                bg={
                                                                                                    row.is_active
                                                                                                        ? "success"
                                                                                                        : "secondary"
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    row.is_active
                                                                                                        ? "ACTIVE"
                                                                                                        : "INACTIVE"
                                                                                                }
                                                                                            </Badge>

                                                                                        </td>

                                                                                        <td>

                                                                                            <Button
                                                                                                className="csp-edit"
                                                                                                onClick={
                                                                                                    () =>
                                                                                                        openTemplateEdit(
                                                                                                            row
                                                                                                        )
                                                                                                }
                                                                                            >
                                                                                                <PencilSquare className="me-1" />

                                                                                                Edit
                                                                                            </Button>

                                                                                        </td>

                                                                                    </tr>
                                                                                )
                                                                            )
                                                                    }

                                                                </tbody>

                                                            </Table>
                                                        )
                                                    }


                                                    {/* =========================
                                                        CONFIG TABLE
                                                    ========================== */}

                                                    {
                                                        selectedMaster ===
                                                        MASTER_CONFIG &&
                                                        (
                                                            <Table className="csp-table" hover>

                                                                <thead>

                                                                    <tr>
                                                                        <th>Config Code</th>
                                                                        <th>Template</th>
                                                                        <th>Plant</th>
                                                                        <th>Line</th>
                                                                        <th>Machine</th>
                                                                        <th>From Part</th>
                                                                        <th>To Part</th>
                                                                        <th>Duration Min</th>
                                                                        <th>Approval</th>
                                                                        <th>Active</th>
                                                                        <th>Action</th>
                                                                    </tr>

                                                                </thead>


                                                                <tbody>

                                                                    {
                                                                        searchedConfigs.length ===
                                                                        0
                                                                            ? (
                                                                                <tr>

                                                                                    <td
                                                                                        colSpan={11}
                                                                                        className="csp-empty"
                                                                                    >
                                                                                        No setup configuration records found.
                                                                                    </td>

                                                                                </tr>
                                                                            )
                                                                            : searchedConfigs.map(
                                                                                row => {

                                                                                    const template =
                                                                                        templateMap.get(
                                                                                            String(
                                                                                                row.setup_template_id
                                                                                            )
                                                                                        );


                                                                                    const fromPart =
                                                                                        partMap.get(
                                                                                            String(
                                                                                                row.from_part_id
                                                                                            )
                                                                                        );


                                                                                    const toPart =
                                                                                        partMap.get(
                                                                                            String(
                                                                                                row.to_part_id
                                                                                            )
                                                                                        );


                                                                                    return (

                                                                                        <tr key={row.setup_plan_config_id}>

                                                                                            <td>
                                                                                                <strong>
                                                                                                    {safeText(row.setup_config_code)}
                                                                                                </strong>
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    template
                                                                                                        ? template.template_code
                                                                                                        : safeText(row.setup_template_id)
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    plantMap.has(
                                                                                                        String(row.plant_id)
                                                                                                    )
                                                                                                        ? plantLabel(
                                                                                                            plantMap.get(
                                                                                                                String(row.plant_id)
                                                                                                            )
                                                                                                        )
                                                                                                        : "-"
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    lineMap.has(
                                                                                                        String(row.line_id)
                                                                                                    )
                                                                                                        ? lineLabel(
                                                                                                            lineMap.get(
                                                                                                                String(row.line_id)
                                                                                                            )
                                                                                                        )
                                                                                                        : "-"
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    machineMap.has(
                                                                                                        String(row.machine_id)
                                                                                                    )
                                                                                                        ? machineLabel(
                                                                                                            machineMap.get(
                                                                                                                String(row.machine_id)
                                                                                                            )
                                                                                                        )
                                                                                                        : "-"
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    fromPart
                                                                                                        ? partLabel(fromPart)
                                                                                                        : "-"
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    toPart
                                                                                                        ? partLabel(toPart)
                                                                                                        : "-"
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {safeText(row.planned_duration_mins)}
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    row.approval_required
                                                                                                        ? "YES"
                                                                                                        : "NO"
                                                                                                }
                                                                                            </td>

                                                                                            <td>

                                                                                                <Badge
                                                                                                    bg={
                                                                                                        row.is_active
                                                                                                            ? "success"
                                                                                                            : "secondary"
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        row.is_active
                                                                                                            ? "ACTIVE"
                                                                                                            : "INACTIVE"
                                                                                                    }
                                                                                                </Badge>

                                                                                            </td>

                                                                                            <td>

                                                                                                <Button
                                                                                                    className="csp-edit"
                                                                                                    onClick={
                                                                                                        () =>
                                                                                                            openSetupConfigEdit(
                                                                                                                row
                                                                                                            )
                                                                                                    }
                                                                                                >
                                                                                                    <PencilSquare className="me-1" />

                                                                                                    Edit
                                                                                                </Button>

                                                                                            </td>

                                                                                        </tr>
                                                                                    );
                                                                                }
                                                                            )
                                                                    }

                                                                </tbody>

                                                            </Table>
                                                        )
                                                    }


                                                    {/* =========================
                                                        RULE TABLE
                                                    ========================== */}

                                                    {
                                                        selectedMaster ===
                                                        MASTER_RULE &&
                                                        (
                                                            <Table className="csp-table" hover>

                                                                <thead>

                                                                    <tr>
                                                                        <th>Rule Code</th>
                                                                        <th>Setup Config</th>
                                                                        <th>Trigger Type</th>
                                                                        <th>From Part</th>
                                                                        <th>To Part</th>
                                                                        <th>Process</th>
                                                                        <th>Priority</th>
                                                                        <th>Version</th>
                                                                        <th>Active</th>
                                                                        <th>Action</th>
                                                                    </tr>

                                                                </thead>


                                                                <tbody>

                                                                    {
                                                                        searchedRules.length ===
                                                                        0
                                                                            ? (
                                                                                <tr>

                                                                                    <td
                                                                                        colSpan={10}
                                                                                        className="csp-empty"
                                                                                    >
                                                                                        No changeover rule records found.
                                                                                    </td>

                                                                                </tr>
                                                                            )
                                                                            : searchedRules.map(
                                                                                row => {

                                                                                    const config =
                                                                                        setupConfigMap.get(
                                                                                            String(
                                                                                                row.setup_plan_config_id
                                                                                            )
                                                                                        );


                                                                                    const fromPart =
                                                                                        partMap.get(
                                                                                            String(
                                                                                                row.from_part_id
                                                                                            )
                                                                                        );


                                                                                    const toPart =
                                                                                        partMap.get(
                                                                                            String(
                                                                                                row.to_part_id
                                                                                            )
                                                                                        );


                                                                                    const process =
                                                                                        processMap.get(
                                                                                            String(
                                                                                                row.process_id
                                                                                            )
                                                                                        );


                                                                                    return (

                                                                                        <tr key={row.changeover_rule_id}>

                                                                                            <td>
                                                                                                <strong>
                                                                                                    {safeText(row.rule_code)}
                                                                                                </strong>
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    config
                                                                                                        ? config.setup_config_code
                                                                                                        : safeText(row.setup_plan_config_id)
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {safeText(row.trigger_type)}
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    fromPart
                                                                                                        ? partLabel(fromPart)
                                                                                                        : "-"
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    toPart
                                                                                                        ? partLabel(toPart)
                                                                                                        : "-"
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    process
                                                                                                        ? processLabel(process)
                                                                                                        : "-"
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {safeText(row.priority_no)}
                                                                                            </td>

                                                                                            <td>
                                                                                                {safeText(row.version_no)}
                                                                                            </td>

                                                                                            <td>

                                                                                                <Badge
                                                                                                    bg={
                                                                                                        row.is_active
                                                                                                            ? "success"
                                                                                                            : "secondary"
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        row.is_active
                                                                                                            ? "ACTIVE"
                                                                                                            : "INACTIVE"
                                                                                                    }
                                                                                                </Badge>

                                                                                            </td>

                                                                                            <td>

                                                                                                <Button
                                                                                                    className="csp-edit"
                                                                                                    onClick={
                                                                                                        () =>
                                                                                                            openRuleEdit(
                                                                                                                row
                                                                                                            )
                                                                                                    }
                                                                                                >
                                                                                                    <PencilSquare className="me-1" />

                                                                                                    Edit
                                                                                                </Button>

                                                                                            </td>

                                                                                        </tr>
                                                                                    );
                                                                                }
                                                                            )
                                                                    }

                                                                </tbody>

                                                            </Table>
                                                        )
                                                    }

                                                </div>
                                            )
                                    }

                                </>
                            )
                        }


                        {/* =========================================
                            RUNTIME VIEW
                        ========================================== */}

                        {
                            activeView ===
                            VIEW_RUNTIME &&
                            (
                                <>

                                    <div className="csp-filter-panel">

                                        <Row className="g-2">

                                            <Col md={3}>

                                                <Form.Label className="csp-label">
                                                    Company
                                                </Form.Label>

                                                <Form.Select
                                                    value={
                                                        runtimeFilters.company_id
                                                    }
                                                    onChange={
                                                        event =>
                                                            setRuntimeFilters(
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
                                                                    key={companyId(item)}
                                                                    value={companyId(item)}
                                                                >
                                                                    {companyLabel(item)}
                                                                </option>
                                                            )
                                                        )
                                                    }

                                                </Form.Select>

                                            </Col>


                                            <Col md={2}>

                                                <Form.Label className="csp-label">
                                                    Shift
                                                </Form.Label>

                                                <Form.Select
                                                    value={
                                                        runtimeFilters.shift_id
                                                    }
                                                    onChange={
                                                        event =>
                                                            setRuntimeFilters(
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
                                                                    key={shiftId(item)}
                                                                    value={shiftId(item)}
                                                                >
                                                                    {shiftLabel(item)}
                                                                </option>
                                                            )
                                                        )
                                                    }

                                                </Form.Select>

                                            </Col>


                                            <Col md={2}>

                                                <Form.Label className="csp-label">
                                                    Status
                                                </Form.Label>

                                                <Form.Control
                                                    value={
                                                        runtimeFilters.status
                                                    }
                                                    onChange={
                                                        event =>
                                                            setRuntimeFilters(
                                                                old => ({
                                                                    ...old,

                                                                    status:
                                                                        event.target.value
                                                                })
                                                            )
                                                    }
                                                    placeholder="PENDING / RUNNING"
                                                />

                                            </Col>


                                            <Col md={2}>

                                                <Form.Label className="csp-label">
                                                    Event Type
                                                </Form.Label>

                                                <Form.Control
                                                    value={
                                                        runtimeFilters.event_type
                                                    }
                                                    onChange={
                                                        event =>
                                                            setRuntimeFilters(
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

                                                <Form.Label className="csp-label">
                                                    Result
                                                </Form.Label>

                                                <Form.Control
                                                    value={
                                                        runtimeFilters.result_status
                                                    }
                                                    onChange={
                                                        event =>
                                                            setRuntimeFilters(
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

                                                <Form.Label className="csp-label">
                                                    From
                                                </Form.Label>

                                                <Form.Control
                                                    type="datetime-local"
                                                    value={
                                                        runtimeFilters.from_timestamp
                                                    }
                                                    onChange={
                                                        event =>
                                                            setRuntimeFilters(
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

                                                <Form.Label className="csp-label">
                                                    To
                                                </Form.Label>

                                                <Form.Control
                                                    type="datetime-local"
                                                    value={
                                                        runtimeFilters.to_timestamp
                                                    }
                                                    onChange={
                                                        event =>
                                                            setRuntimeFilters(
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
                                                className="d-flex align-items-end gap-2"
                                            >

                                                <Button
                                                    className="csp-btn-primary"
                                                    onClick={
                                                        applyRuntimeFilters
                                                    }
                                                >
                                                    Apply Filters
                                                </Button>


                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={
                                                        async () => {

                                                            setRuntimeFilters(
                                                                runtimeFilterInitialState
                                                            );


                                                            const response =
                                                                await changeoverSetupPlanService
                                                                    .getRuntime();


                                                            queryClient
                                                                .setQueryData(
                                                                    [
                                                                        "changeover-setup-plan",
                                                                        "runtime"
                                                                    ],
                                                                    response
                                                                );
                                                        }
                                                    }
                                                >
                                                    Clear
                                                </Button>


                                                <Button
                                                    className="csp-btn-outline"
                                                    disabled={
                                                        reportMutation.isPending
                                                    }
                                                    onClick={
                                                        () =>
                                                            reportMutation.mutate()
                                                    }
                                                >
                                                    <BarChartLine className="me-1" />

                                                    Report
                                                </Button>

                                            </Col>

                                        </Row>

                                    </div>


                                    <h6 className="fw-bold mb-2">
                                        Setup Executions
                                    </h6>


                                    <div className="csp-table-wrap mb-4">

                                        <PlanningBoard records={setupExecutions} title="Changeover execution board"/>{reportMutation.data && <ReportLens records={getChangeoverSetupPlanReportCollections(reportMutation.data).setupExecutions} title="Changeover report explorer"/>}<Table className="csp-table" hover>

                                            <thead>

                                                <tr>
                                                    <th>Status</th>
                                                    <th>Company</th>
                                                    <th>Plant</th>
                                                    <th>Line</th>
                                                    <th>Machine</th>
                                                    <th>Shift</th>
                                                    <th>From Part</th>
                                                    <th>To Part</th>
                                                    <th>Setup Config</th>
                                                    <th>Started</th>
                                                    <th>Completed</th>
                                                    <th>Result</th>
                                                    <th>Actions</th>
                                                </tr>

                                            </thead>


                                            <tbody>

                                                {
                                                    runtimeQuery.isFetching
                                                        ? (
                                                            <tr>

                                                                <td
                                                                    colSpan={13}
                                                                    className="csp-empty"
                                                                >
                                                                    <Spinner
                                                                        animation="border"
                                                                        size="sm"
                                                                        className="me-2"
                                                                    />

                                                                    Loading runtime...
                                                                </td>

                                                            </tr>
                                                        )
                                                        : setupExecutions.length ===
                                                            0
                                                            ? (
                                                                <tr>

                                                                    <td
                                                                        colSpan={13}
                                                                        className="csp-empty"
                                                                    >
                                                                        No setup executions found.
                                                                    </td>

                                                                </tr>
                                                            )
                                                            : setupExecutions.map(
                                                                row => {

                                                                    const config =
                                                                        setupConfigMap.get(
                                                                            String(
                                                                                row.setup_plan_config_id
                                                                            )
                                                                        );


                                                                    const fromPart =
                                                                        partMap.get(
                                                                            String(
                                                                                row.from_part_id
                                                                            )
                                                                        );


                                                                    const toPart =
                                                                        partMap.get(
                                                                            String(
                                                                                row.to_part_id
                                                                            )
                                                                        );


                                                                    const status =
                                                                        String(
                                                                            row.status ||
                                                                            ""
                                                                        )
                                                                            .toUpperCase();


                                                                    return (

                                                                        <tr key={row.setup_execution_id}>

                                                                            <td>

                                                                                <Badge
                                                                                    bg={
                                                                                        statusVariant(
                                                                                            row.status
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {safeText(row.status)}
                                                                                </Badge>

                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    companyMap.has(
                                                                                        String(row.company_id)
                                                                                    )
                                                                                        ? companyLabel(
                                                                                            companyMap.get(
                                                                                                String(row.company_id)
                                                                                            )
                                                                                        )
                                                                                        : safeText(row.company_id)
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    plantMap.has(
                                                                                        String(row.plant_id)
                                                                                    )
                                                                                        ? plantLabel(
                                                                                            plantMap.get(
                                                                                                String(row.plant_id)
                                                                                            )
                                                                                        )
                                                                                        : safeText(row.plant_id)
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    lineMap.has(
                                                                                        String(row.line_id)
                                                                                    )
                                                                                        ? lineLabel(
                                                                                            lineMap.get(
                                                                                                String(row.line_id)
                                                                                            )
                                                                                        )
                                                                                        : safeText(row.line_id)
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    machineMap.has(
                                                                                        String(row.machine_id)
                                                                                    )
                                                                                        ? machineLabel(
                                                                                            machineMap.get(
                                                                                                String(row.machine_id)
                                                                                            )
                                                                                        )
                                                                                        : safeText(row.machine_id)
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {safeText(row.shift_id)}
                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    fromPart
                                                                                        ? partLabel(fromPart)
                                                                                        : "-"
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    toPart
                                                                                        ? partLabel(toPart)
                                                                                        : "-"
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    config
                                                                                        ? config.setup_config_code
                                                                                        : safeText(row.setup_plan_config_id)
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {displayDateTime(row.started_at)}
                                                                            </td>

                                                                            <td>
                                                                                {displayDateTime(row.completed_at)}
                                                                            </td>

                                                                            <td>

                                                                                {
                                                                                    row.result_status
                                                                                        ? (
                                                                                            <Badge
                                                                                                bg={
                                                                                                    statusVariant(
                                                                                                        row.result_status
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                {row.result_status}
                                                                                            </Badge>
                                                                                        )
                                                                                        : "-"
                                                                                }

                                                                            </td>

                                                                            <td>

                                                                                <div className="d-flex gap-1">

                                                                                    {
                                                                                        status ===
                                                                                        "PENDING" &&
                                                                                        (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="outline-warning"
                                                                                                onClick={
                                                                                                    () =>
                                                                                                        startExecution(
                                                                                                            row
                                                                                                        )
                                                                                                }
                                                                                            >
                                                                                                Start
                                                                                            </Button>
                                                                                        )
                                                                                    }


                                                                                    {
                                                                                        status ===
                                                                                        "RUNNING" &&
                                                                                        (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="outline-success"
                                                                                                onClick={
                                                                                                    () =>
                                                                                                        completeExecution(
                                                                                                            row
                                                                                                        )
                                                                                                }
                                                                                            >
                                                                                                <CheckCircle className="me-1" />

                                                                                                Complete
                                                                                            </Button>
                                                                                        )
                                                                                    }


                                                                                    <Button
                                                                                        size="sm"
                                                                                        className="csp-edit"
                                                                                        onClick={
                                                                                            () =>
                                                                                                openEventForm(
                                                                                                    row
                                                                                                )
                                                                                        }
                                                                                    >
                                                                                        Event
                                                                                    </Button>

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


                                    <h6 className="fw-bold mb-2">
                                        Changeover Events
                                    </h6>


                                    <div className="csp-table-wrap">

                                        <EventJourney records={changeoverEvents} title="Changeover activity journey"/><Table className="csp-table" hover>

                                            <thead>

                                                <tr>
                                                    <th>Date & Time</th>
                                                    <th>Event Type</th>
                                                    <th>Result</th>
                                                    <th>Shift</th>
                                                    <th>From Part</th>
                                                    <th>To Part</th>
                                                    <th>Reason</th>
                                                    <th>Source</th>
                                                </tr>

                                            </thead>


                                            <tbody>

                                                {
                                                    changeoverEvents.length ===
                                                    0
                                                        ? (
                                                            <tr>

                                                                <td
                                                                    colSpan={8}
                                                                    className="csp-empty"
                                                                >
                                                                    No changeover events found.
                                                                </td>

                                                            </tr>
                                                        )
                                                        : changeoverEvents.map(
                                                            row => {

                                                                const fromPart =
                                                                    partMap.get(
                                                                        String(
                                                                            row.from_part_id
                                                                        )
                                                                    );


                                                                const toPart =
                                                                    partMap.get(
                                                                        String(
                                                                            row.to_part_id
                                                                        )
                                                                    );


                                                                return (

                                                                    <tr key={row.changeover_event_id}>

                                                                        <td>
                                                                            {displayDateTime(row.event_ts)}
                                                                        </td>

                                                                        <td>
                                                                            <strong>
                                                                                {safeText(row.event_type)}
                                                                            </strong>
                                                                        </td>

                                                                        <td>

                                                                            <Badge
                                                                                bg={
                                                                                    statusVariant(
                                                                                        row.result_status
                                                                                    )
                                                                                }
                                                                            >
                                                                                {safeText(row.result_status)}
                                                                            </Badge>

                                                                        </td>

                                                                        <td>
                                                                            {safeText(row.shift_id)}
                                                                        </td>

                                                                        <td>
                                                                            {
                                                                                fromPart
                                                                                    ? partLabel(fromPart)
                                                                                    : "-"
                                                                            }
                                                                        </td>

                                                                        <td>
                                                                            {
                                                                                toPart
                                                                                    ? partLabel(toPart)
                                                                                    : "-"
                                                                            }
                                                                        </td>

                                                                        <td>
                                                                            {safeText(row.reason)}
                                                                        </td>

                                                                        <td>
                                                                            {safeText(row.source_system)}
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

                    </Card.Body>

                </Card>


                {/* =================================================
                    SETUP TEMPLATE MODAL
                ================================================= */}

                <Modal
                    show={
                        showTemplate
                    }
                    onHide={
                        () =>
                            setShowTemplate(
                                false
                            )
                    }
                    size="lg"
                    centered
                    className="csp-modal"
                >

                    <Form
                        onSubmit={
                            submitTemplate
                        }
                    >

                        <Modal.Header closeButton>

                            <Modal.Title>
                                {
                                    templateForm
                                        .setup_template_id
                                        ? "Edit Setup Template"
                                        : "Add Setup Template"
                                }
                            </Modal.Title>

                        </Modal.Header>


                        <Modal.Body>

                            <Row className="g-3">

                                <Col md={6}>

                                    <Form.Label className="csp-label">
                                        Company
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            templateForm.company_id
                                        } disabled={Boolean(templateForm.setup_template_id)}
                                        onChange={
                                            event =>
                                                setTemplateForm(
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
                                                item => (

                                                    <option
                                                        key={companyId(item)}
                                                        value={companyId(item)}
                                                    >
                                                        {companyLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="csp-label">
                                        Template Code
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        maxLength={60}
                                        value={
                                            templateForm.template_code
                                        }
                                        onChange={
                                            event =>
                                                setTemplateForm(
                                                    old => ({
                                                        ...old,

                                                        template_code:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="csp-label">
                                        Template Name
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        maxLength={150}
                                        value={
                                            templateForm.template_name
                                        }
                                        onChange={
                                            event =>
                                                setTemplateForm(
                                                    old => ({
                                                        ...old,

                                                        template_name:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="csp-label">
                                        Setup Type
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        maxLength={40}
                                        placeholder="Configured setup type"
                                        value={
                                            templateForm.setup_type
                                        }
                                        onChange={
                                            event =>
                                                setTemplateForm(
                                                    old => ({
                                                        ...old,

                                                        setup_type:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col md={12}>

                                    <Form.Label className="csp-label">
                                        Template Definition
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Control
                                        as="textarea"
                                        required
                                        className="csp-json"
                                        value={
                                            templateForm
                                                .template_definition
                                        }
                                        onChange={
                                            event =>
                                                setTemplateForm(
                                                    old => ({
                                                        ...old,

                                                        template_definition:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                    <span className="csp-help">
                                        Enter valid JSON. The canonical template schema will be validated when its approved schema is configured.
                                    </span>

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="csp-label">
                                        Version
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        type="number"
                                        min="1"
                                        value={
                                            templateForm.version_no
                                        }
                                        onChange={
                                            event =>
                                                setTemplateForm(
                                                    old => ({
                                                        ...old,

                                                        version_no:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col
                                    md={6}
                                    className="d-flex align-items-end"
                                >

                                    <Form.Check
                                        type="switch"
                                        label="Active"
                                        checked={
                                            templateForm.is_active
                                        }
                                        onChange={
                                            event =>
                                                setTemplateForm(
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
                                variant="outline-secondary"
                                onClick={
                                    () =>
                                        setShowTemplate(
                                            false
                                        )
                                }
                            >
                                Cancel
                            </Button>


                            <Button
                                type="submit"
                                className="csp-btn-primary"
                                disabled={
                                    templateMutation.isPending
                                }
                            >
                                {
                                    templateMutation.isPending
                                        ? "Saving..."
                                        : "Save Template"
                                }
                            </Button>

                        </Modal.Footer>

                    </Form>

                </Modal>


                {/* =================================================
                    SETUP CONFIG MODAL
                ================================================= */}

                <Modal
                    show={
                        showSetupConfig
                    }
                    onHide={
                        () =>
                            setShowSetupConfig(
                                false
                            )
                    }
                    size="xl"
                    centered
                    className="csp-modal"
                >

                    <Form
                        onSubmit={
                            submitSetupConfig
                        }
                    >

                        <Modal.Header closeButton>

                            <Modal.Title>
                                {
                                    setupConfigForm
                                        .setup_plan_config_id
                                        ? "Edit Setup Plan Configuration"
                                        : "Add Setup Plan Configuration"
                                }
                            </Modal.Title>

                        </Modal.Header>


                        <Modal.Body>

                            <Row className="g-3">

                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Company
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            setupConfigForm.company_id
                                        }disabled={Boolean(setupConfigForm.setup_plan_config_id)}
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        company_id:
                                                            event.target.value,

                                                        plant_id: "",
                                                        line_id: "",
                                                        machine_id: "",

                                                        setup_template_id: "",

                                                        process_id: "",

                                                        from_part_id: "",
                                                        to_part_id: ""
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
                                                        key={companyId(item)}
                                                        value={companyId(item)}
                                                    >
                                                        {companyLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Plant
                                    </Form.Label>

                                    <Form.Select
                                        disabled={
    Boolean(setupConfigForm.setup_plan_config_id) ||
    !setupConfigForm.company_id
}
                                        value={
                                            setupConfigForm.plant_id
                                        }
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id: "",
                                                        machine_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            All Plants
                                        </option>

                                        {
                                            configPlants.map(
                                                item => (

                                                    <option
                                                        key={plantId(item)}
                                                        value={plantId(item)}
                                                    >
                                                        {plantLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Line
                                    </Form.Label>

                                    <Form.Select
                                       disabled={
    Boolean(setupConfigForm.setup_plan_config_id) ||
    !setupConfigForm.plant_id
}
                                        value={
                                            setupConfigForm.line_id
                                        }
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        line_id:
                                                            event.target.value,

                                                        machine_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            All Lines
                                        </option>

                                        {
                                            configLines.map(
                                                item => (

                                                    <option
                                                        key={lineId(item)}
                                                        value={lineId(item)}
                                                    >
                                                        {lineLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Machine
                                    </Form.Label>

                                    <Form.Select
                                      disabled={
    Boolean(setupConfigForm.setup_plan_config_id) ||
    !setupConfigForm.line_id
}
                                        value={
                                            setupConfigForm.machine_id
                                        }
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
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
                                            configMachines.map(
                                                item => (

                                                    <option
                                                        key={machineId(item)}
                                                        value={machineId(item)}
                                                    >
                                                        {machineLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Setup Config Code
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        maxLength={60}
                                        value={
                                            setupConfigForm
                                                .setup_config_code
                                        } disabled={
    Boolean(setupConfigForm.setup_plan_config_id) ||
    !setupConfigForm.company_id
}
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        setup_config_code:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Setup Template
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        disabled={
                                            !setupConfigForm.company_id
                                        }
                                        value={
                                            setupConfigForm
                                                .setup_template_id
                                        }
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        setup_template_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Template
                                        </option>

                                        {
                                            configTemplates.map(
                                                item => (

                                                    <option
                                                        key={item.setup_template_id}
                                                        value={item.setup_template_id}
                                                    >
                                                        {item.template_code} - {item.template_name}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Process
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            setupConfigForm.process_id
                                        }disabled={Boolean(setupConfigForm.setup_plan_config_id)}
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        process_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            No Process / Any Process
                                        </option>

                                        {
                                            configProcesses.map(
                                                item => (

                                                    <option
                                                        key={processId(item)}
                                                        value={processId(item)}
                                                    >
                                                        {processLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        From Part
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            setupConfigForm.from_part_id
                                        }disabled={Boolean(setupConfigForm.setup_plan_config_id)}
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        from_part_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any / No Previous Part
                                        </option>

                                        {
                                            configParts.map(
                                                item => (

                                                    <option
                                                        key={partId(item)}
                                                        value={partId(item)}
                                                    >
                                                        {partLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        To Part
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            setupConfigForm.to_part_id
                                        }disabled={Boolean(setupConfigForm.setup_plan_config_id)}
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        to_part_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any To Part
                                        </option>

                                        {
                                            configParts.map(
                                                item => (

                                                    <option
                                                        key={partId(item)}
                                                        value={partId(item)}
                                                    >
                                                        {partLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Planned Duration (Minutes)
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            setupConfigForm
                                                .planned_duration_mins
                                        }
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        planned_duration_mins:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Version
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        type="number"
                                        min="1"
                                        value={
                                            setupConfigForm.version_no
                                        }
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        version_no:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col
                                    md={2}
                                    className="d-flex align-items-end"
                                >

                                    <Form.Check
                                        type="switch"
                                        label="Approval Required"
                                        checked={
                                            setupConfigForm
                                                .approval_required
                                        }
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
                                                    old => ({
                                                        ...old,

                                                        approval_required:
                                                            event.target.checked
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col
                                    md={2}
                                    className="d-flex align-items-end"
                                >

                                    <Form.Check
                                        type="switch"
                                        label="Active"
                                        checked={
                                            setupConfigForm
                                                .is_active
                                        }
                                        onChange={
                                            event =>
                                                setSetupConfigForm(
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
                                variant="outline-secondary"
                                onClick={
                                    () =>
                                        setShowSetupConfig(
                                            false
                                        )
                                }
                            >
                                Cancel
                            </Button>


                            <Button
                                type="submit"
                                className="csp-btn-primary"
                                disabled={
                                    setupConfigMutation.isPending
                                }
                            >
                                {
                                    setupConfigMutation.isPending
                                        ? "Saving..."
                                        : "Save Configuration"
                                }
                            </Button>

                        </Modal.Footer>

                    </Form>

                </Modal>


                {/* =================================================
                    CHANGEOVER RULE MODAL
                ================================================= */}

                <Modal
                    show={
                        showRule
                    }
                    onHide={
                        () =>
                            setShowRule(
                                false
                            )
                    }
                    size="xl"
                    centered
                    className="csp-modal"
                >

                    <Form
                        onSubmit={
                            submitRule
                        }
                    >

                        <Modal.Header closeButton>

                            <Modal.Title>
                                {
                                    ruleForm.changeover_rule_id
                                        ? "Edit Changeover Rule"
                                        : "Add Changeover Rule"
                                }
                            </Modal.Title>

                        </Modal.Header>


                        <Modal.Body>

                            <Row className="g-3">

                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Company
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            ruleForm.company_id
                                        }disabled={Boolean(ruleForm.changeover_rule_id)}
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        company_id:
                                                            event.target.value,

                                                        plant_id: "",
                                                        line_id: "",
                                                        machine_id: "",

                                                        from_part_id: "",
                                                        to_part_id: "",
                                                        process_id: "",

                                                        setup_plan_config_id: ""
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
                                                        key={companyId(item)}
                                                        value={companyId(item)}
                                                    >
                                                        {companyLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Plant
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            ruleForm.plant_id
                                        }disabled={Boolean(ruleForm.changeover_rule_id)}
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id: "",
                                                        machine_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any Plant
                                        </option>

                                        {
                                            rulePlants.map(
                                                item => (

                                                    <option
                                                        key={plantId(item)}
                                                        value={plantId(item)}
                                                    >
                                                        {plantLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Line
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            ruleForm.line_id
                                        }disabled={Boolean(ruleForm.changeover_rule_id)}
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        line_id:
                                                            event.target.value,

                                                        machine_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any Line
                                        </option>

                                        {
                                            ruleLines.map(
                                                item => (

                                                    <option
                                                        key={lineId(item)}
                                                        value={lineId(item)}
                                                    >
                                                        {lineLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Machine
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            ruleForm.machine_id
                                        }disabled={Boolean(ruleForm.changeover_rule_id)}
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        machine_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any Machine
                                        </option>

                                        {
                                            ruleMachines.map(
                                                item => (

                                                    <option
                                                        key={machineId(item)}
                                                        value={machineId(item)}
                                                    >
                                                        {machineLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Rule Code
                                        <span className="csp-required"> *</span>
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


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Setup Configuration
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            ruleForm
                                                .setup_plan_config_id
                                        }disabled={Boolean(ruleForm.changeover_rule_id)}
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        setup_plan_config_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Setup Config
                                        </option>

                                        {
                                            ruleConfigs.map(
                                                item => (

                                                    <option
                                                        key={item.setup_plan_config_id}
                                                        value={item.setup_plan_config_id}
                                                    >
                                                        {item.setup_config_code}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        From Part
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            ruleForm.from_part_id
                                        }disabled={Boolean(ruleForm.changeover_rule_id)}
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        from_part_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any From Part
                                        </option>

                                        {
                                            ruleParts.map(
                                                item => (

                                                    <option
                                                        key={partId(item)}
                                                        value={partId(item)}
                                                    >
                                                        {partLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        To Part
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            ruleForm.to_part_id
                                        }disabled={Boolean(ruleForm.changeover_rule_id)}
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        to_part_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any To Part
                                        </option>

                                        {
                                            ruleParts.map(
                                                item => (

                                                    <option
                                                        key={partId(item)}
                                                        value={partId(item)}
                                                    >
                                                        {partLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Process
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            ruleForm.process_id
                                        }disabled={Boolean(ruleForm.changeover_rule_id)}
                                        onChange={
                                            event =>
                                                setRuleForm(
                                                    old => ({
                                                        ...old,

                                                        process_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Any Process
                                        </option>

                                        {
                                            ruleProcesses.map(
                                                item => (

                                                    <option
                                                        key={processId(item)}
                                                        value={processId(item)}
                                                    >
                                                        {processLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Trigger Type
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        maxLength={30}
                                        placeholder="Configured trigger type"
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
                                    />

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Priority
                                        <span className="csp-required"> *</span>
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


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Version
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


                                <Col md={12}>

                                    <Form.Label className="csp-label">
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

                                    <span className="csp-help">
                                        Active rules with a Rule Engine expression require the approved Rule Engine validator.
                                    </span>

                                </Col>


                                <Col md={6}>

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

                                </Col>

                            </Row>

                        </Modal.Body>


                        <Modal.Footer>

                            <Button
                                variant="outline-secondary"
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
                                className="csp-btn-primary"
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
                    CREATE EXECUTION MODAL
                ================================================= */}

                <Modal
                    show={
                        showExecution
                    }
                    onHide={
                        () =>
                            setShowExecution(
                                false
                            )
                    }
                    size="xl"
                    centered
                    className="csp-modal"
                >

                    <Form
                        onSubmit={
                            submitExecution
                        }
                    >

                        <Modal.Header closeButton>

                            <Modal.Title>
                                Start Setup / Changeover
                            </Modal.Title>

                        </Modal.Header>


                        <Modal.Body>

                            {
                                lookupLoading &&
                                (
                                    <Alert variant="light">

                                        <Spinner
                                            animation="border"
                                            size="sm"
                                            className="me-2"
                                        />

                                        Loading lookup data...

                                    </Alert>
                                )
                            }


                            <Row className="g-3">

                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Company
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            executionForm.company_id
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        company_id:
                                                            event.target.value,

                                                        plant_id: "",
                                                        line_id: "",
                                                        machine_id: "",

                                                        plan_id: "",
                                                        plan_entry_id: "",

                                                        setup_plan_config_id: "",

                                                        from_part_id: "",
                                                        to_part_id: ""
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
                                                        key={companyId(item)}
                                                        value={companyId(item)}
                                                    >
                                                        {companyLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Plant
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        disabled={
                                            !executionForm.company_id
                                        }
                                        value={
                                            executionForm.plant_id
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id: "",
                                                        machine_id: "",

                                                        setup_plan_config_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Plant
                                        </option>

                                        {
                                            executionPlants.map(
                                                item => (

                                                    <option
                                                        key={plantId(item)}
                                                        value={plantId(item)}
                                                    >
                                                        {plantLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Line
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        disabled={
                                            !executionForm.plant_id
                                        }
                                        value={
                                            executionForm.line_id
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        line_id:
                                                            event.target.value,

                                                        machine_id: "",

                                                        setup_plan_config_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Line
                                        </option>

                                        {
                                            executionLines.map(
                                                item => (

                                                    <option
                                                        key={lineId(item)}
                                                        value={lineId(item)}
                                                    >
                                                        {lineLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Machine
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        disabled={
                                            !executionForm.line_id
                                        }
                                        value={
                                            executionForm.machine_id
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        machine_id:
                                                            event.target.value,

                                                        setup_plan_config_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Machine
                                        </option>

                                        {
                                            executionMachines.map(
                                                item => (

                                                    <option
                                                        key={machineId(item)}
                                                        value={machineId(item)}
                                                    >
                                                        {machineLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Shift
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    {
                                        shifts.length >
                                        0
                                            ? (
                                                <Form.Select
                                                    required
                                                    value={
                                                        executionForm.shift_id
                                                    }
                                                    onChange={
                                                        event =>
                                                            setExecutionForm(
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
                                                                    key={shiftId(item)}
                                                                    value={shiftId(item)}
                                                                >
                                                                    {shiftLabel(item)}
                                                                </option>
                                                            )
                                                        )
                                                    }

                                                </Form.Select>
                                            )
                                            : (
                                                <Form.Control
                                                    required
                                                    type="number"
                                                    min="1"
                                                    placeholder="Shift ID"
                                                    value={
                                                        executionForm.shift_id
                                                    }
                                                    onChange={
                                                        event =>
                                                            setExecutionForm(
                                                                old => ({
                                                                    ...old,

                                                                    shift_id:
                                                                        event.target.value
                                                                })
                                                            )
                                                    }
                                                />
                                            )
                                    }

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Production Plan
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            executionForm.plan_id
                                        }
                                        onChange={
                                            async event => {

                                                const selectedPlanId =
                                                    event.target.value;


                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        plan_id:
                                                            selectedPlanId,

                                                        plan_entry_id:
                                                            ""
                                                    })
                                                );


                                                await loadPlanEntriesForPlan(
                                                    selectedPlanId
                                                );
                                            }
                                        }
                                    >

                                        <option value="">
                                            Select Production Plan
                                        </option>

                                        {
                                            executionPlans.map(
                                                item => (

                                                    <option
                                                        key={planId(item)}
                                                        value={planId(item)}
                                                    >
                                                        {planLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Plan Entry
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        disabled={
                                            !executionForm.plan_id ||
                                            planEntriesLoading
                                        }
                                        value={
                                            executionForm.plan_entry_id
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
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
                                                !executionForm.plan_id

                                                    ? "Select Production Plan First"

                                                    : planEntriesLoading

                                                        ? "Loading Plan Entries..."

                                                        : executionPlanEntries.length ===
                                                            0

                                                            ? "No Plan Entries Found"

                                                            : "Select Plan Entry"
                                            }

                                        </option>

                                        {
                                            executionPlanEntries.map(
                                                item => (

                                                    <option
                                                        key={planEntryId(item)}
                                                        value={planEntryId(item)}
                                                    >
                                                        {planEntryLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        From Part
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executionForm.from_part_id
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        from_part_id:
                                                            event.target.value,

                                                        setup_plan_config_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            No Previous Part
                                        </option>

                                        {
                                            executionParts.map(
                                                item => (

                                                    <option
                                                        key={partId(item)}
                                                        value={partId(item)}
                                                    >
                                                        {partLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        To Part
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            executionForm.to_part_id
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        to_part_id:
                                                            event.target.value,

                                                        setup_plan_config_id: ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select To Part
                                        </option>

                                        {
                                            executionParts.map(
                                                item => (

                                                    <option
                                                        key={partId(item)}
                                                        value={partId(item)}
                                                    >
                                                        {partLabel(item)}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Setup Plan Configuration
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Select
                                        required
                                        value={
                                            executionForm
                                                .setup_plan_config_id
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        setup_plan_config_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Setup Configuration
                                        </option>

                                        {
                                            executionConfigs.map(
                                                item => (

                                                    <option
                                                        key={item.setup_plan_config_id}
                                                        value={item.setup_plan_config_id}
                                                    >
                                                        {item.setup_config_code}
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Initial Status
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executionForm.status
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        status:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col md={4}>

                                    <Form.Label className="csp-label">
                                        Executed By User ID
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            executionForm
                                                .executed_by_user_id
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        executed_by_user_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                        placeholder="Optional integer user ID"
                                    />

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="csp-label">
                                        Correlation ID
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executionForm.correlation_id
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        correlation_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                        placeholder="Optional UUID"
                                    />

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="csp-label">
                                        Idempotency Key
                                    </Form.Label>

                                    <Form.Control
                                        maxLength={150}
                                        value={
                                            executionForm.idempotency_key
                                        }
                                        onChange={
                                            event =>
                                                setExecutionForm(
                                                    old => ({
                                                        ...old,

                                                        idempotency_key:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                        placeholder="Optional request key"
                                    />

                                </Col>

                            </Row>

                        </Modal.Body>


                        <Modal.Footer>

                            <Button
                                variant="outline-secondary"
                                onClick={
                                    () =>
                                        setShowExecution(
                                            false
                                        )
                                }
                            >
                                Cancel
                            </Button>


                            <Button
                                type="submit"
                                className="csp-btn-primary"
                                disabled={
                                    executionMutation.isPending
                                }
                            >
                                {
                                    executionMutation.isPending
                                        ? "Creating..."
                                        : "Create Setup Execution"
                                }
                            </Button>

                        </Modal.Footer>

                    </Form>

                </Modal>


                {/* =================================================
                    CHANGEOVER EVENT MODAL
                ================================================= */}

                <Modal
                    show={
                        showEvent
                    }
                    onHide={
                        () =>
                            setShowEvent(
                                false
                            )
                    }
                    size="lg"
                    centered
                    className="csp-modal"
                >

                    <Form
                        onSubmit={
                            submitEvent
                        }
                    >

                        <Modal.Header closeButton>

                            <Modal.Title>
                                Add Changeover Event
                            </Modal.Title>

                        </Modal.Header>


                        <Modal.Body>

                            <Row className="g-3">

                                <Col md={6}>

                                    <Form.Label className="csp-label">
                                        Event Type
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        maxLength={40}
                                        value={
                                            eventForm.event_type
                                        }
                                        onChange={
                                            event =>
                                                setEventForm(
                                                    old => ({
                                                        ...old,

                                                        event_type:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                        placeholder="Configured event type"
                                    />

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="csp-label">
                                        Result Status
                                        <span className="csp-required"> *</span>
                                    </Form.Label>

                                    <Form.Control
                                        required
                                        maxLength={20}
                                        value={
                                            eventForm.result_status
                                        }
                                        onChange={
                                            event =>
                                                setEventForm(
                                                    old => ({
                                                        ...old,

                                                        result_status:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col md={12}>

                                    <Form.Label className="csp-label">
                                        Reason
                                    </Form.Label>

                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        maxLength={500}
                                        value={
                                            eventForm.reason
                                        }
                                        onChange={
                                            event =>
                                                setEventForm(
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

                                    <Form.Label className="csp-label">
                                        Source System
                                    </Form.Label>

                                    <Form.Control
                                        maxLength={50}
                                        value={
                                            eventForm.source_system
                                        }
                                        onChange={
                                            event =>
                                                setEventForm(
                                                    old => ({
                                                        ...old,

                                                        source_system:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Col>


                                <Col md={6}>

                                    <Form.Label className="csp-label">
                                        Correlation ID
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            eventForm.correlation_id
                                        }
                                        onChange={
                                            event =>
                                                setEventForm(
                                                    old => ({
                                                        ...old,

                                                        correlation_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                        placeholder="Optional UUID"
                                    />

                                </Col>


                                <Col md={12}>

                                    <Form.Label className="csp-label">
                                        Idempotency Key
                                    </Form.Label>

                                    <Form.Control
                                        maxLength={150}
                                        value={
                                            eventForm.idempotency_key
                                        }
                                        onChange={
                                            event =>
                                                setEventForm(
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
                                onClick={
                                    () =>
                                        setShowEvent(
                                            false
                                        )
                                }
                            >
                                Cancel
                            </Button>


                            <Button
                                type="submit"
                                className="csp-btn-primary"
                                disabled={
                                    eventMutation.isPending
                                }
                            >
                                {
                                    eventMutation.isPending
                                        ? "Saving..."
                                        : "Save Event"
                                }
                            </Button>

                        </Modal.Footer>

                    </Form>

                </Modal>

            </div>
</>
        );
    };


export default ChangeoverSetupPlan;