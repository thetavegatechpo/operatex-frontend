
// src/pages/RouteStationMaster/RouteStationMaster.jsx

import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Badge,
    Button,
    Card,
    Col,
    Form,
    Modal,
    Row,
    Spinner,
    Toast
} from "react-bootstrap";

import {
    Plus
} from "react-bootstrap-icons";


import SearchToolbar
    from "../../../../shared/components/SearchToolbar.jsx";

import DataTable
    from "../../../../shared/components/DataTable.jsx";

import StatusBadge
    from "../../../../shared/components/StatusBadge.jsx";

import ActionButtons
    from "../../../../shared/components/ActionButtons.jsx";


import routeStationService
    from "../api/routeStation.service.js";


import "./RouteStationMaster.css";


// ==========================================================
// CONSTANTS
// ==========================================================

const ROUTE_STATUS = [

    "DRAFT",

    "ACTIVE",

    "INACTIVE",

    "RETIRED"

];


const EVENT_STATUS = [

    "PENDING",

    "OK",

    "NOK",

    "WARNING",

    "ERROR",

    "COMPLETED",

    "CANCELLED"

];


const VALIDATION_SEVERITY = [

    "INFO",

    "WARNING",

    "ERROR",

    "BLOCK"

];


const ROUTE_TYPES = [

    "STANDARD",

    "REWORK",

    "ALTERNATE"

];


// ==========================================================
// COMPONENT
// ==========================================================

function RouteStationMaster() {

    // ======================================================
    // MASTER DATA
    // ======================================================

    const [
        routes,
        setRoutes
    ] = useState([]);


    const [
        routeConfigSummary,
        setRouteConfigSummary
    ] = useState([]);


    const [
        stations,
        setStations
    ] = useState([]);


    const [
        steps,
        setSteps
    ] = useState([]);


    const [
        validations,
        setValidations
    ] = useState([]);


    // ======================================================
    // LOOKUPS
    // ======================================================

    const [
        companies,
        setCompanies
    ] = useState([]);


    const [
        plants,
        setPlants
    ] = useState([]);


    const [
        shops,
        setShops
    ] = useState([]);


    const [
        lines,
        setLines
    ] = useState([]);


    const [
        partRevisions,
        setPartRevisions
    ] = useState([]);


    const [
        processRevisions,
        setProcessRevisions
    ] = useState([]);


    const [
        machines,
        setMachines
    ] = useState([]);


    const [
        operations,
        setOperations
    ] = useState([]);


    // ======================================================
    // RUNTIME / REPORT
    // ======================================================

    const [
        runtimeData,
        setRuntimeData
    ] = useState([]);


    const [
        reportData,
        setReportData
    ] = useState([]);


    // ======================================================
    // SEARCH
    // ======================================================

    const [
        searchText,
        setSearchText
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter
    ] = useState("ALL");


    // ======================================================
    // LOADING
    // ======================================================

    const [
        loading,
        setLoading
    ] = useState(false);


    const [
        saving,
        setSaving
    ] = useState(false);


    // ======================================================
    // MODALS
    // ======================================================

    const [
        showRouteForm,
        setShowRouteForm
    ] = useState(false);


    const [
        showStationConfig,
        setShowStationConfig
    ] = useState(false);


    const [
        showStationForm,
        setShowStationForm
    ] = useState(false);


    const [
        showStepConfig,
        setShowStepConfig
    ] = useState(false);


    const [
        showStepForm,
        setShowStepForm
    ] = useState(false);


    const [
        showValidationConfig,
        setShowValidationConfig
    ] = useState(false);


    const [
        showValidationForm,
        setShowValidationForm
    ] = useState(false);


    const [
        showRuntime,
        setShowRuntime
    ] = useState(false);


    const [
        showExecute,
        setShowExecute
    ] = useState(false);


    const [
        showReport,
        setShowReport
    ] = useState(false);


    // ======================================================
    // EDIT IDS
    // ======================================================

    const [
        routeEditId,
        setRouteEditId
    ] = useState(null);


    const [
        stationEditId,
        setStationEditId
    ] = useState(null);


    const [
        stepEditId,
        setStepEditId
    ] = useState(null);


    const [
        validationEditId,
        setValidationEditId
    ] = useState(null);


    // ======================================================
    // TOAST
    // ======================================================

    const [
        toast,
        setToast
    ] = useState({

        show: false,

        variant: "success",

        message: ""

    });


    const showToast = (
        message,
        variant = "success"
    ) => {

        setToast({

            show: true,

            variant,

            message

        });

    };


    const hideToast = () => {

        setToast({

            show: false,

            variant: "success",

            message: ""

        });

    };


    // ======================================================
    // INITIAL STATES
    // ======================================================

    const routeInitialState = {

        company_id: "",

        part_revision_id: "",

        process_revision_id: "",

        route_code: "",

        route_name: "",

        route_type: "STANDARD",

        effective_from: "",

        effective_to: "",

        is_default: false,

        status: "ACTIVE"

    };


    const stationInitialState = {

        company_id: "",

        plant_id: "",

        shop_id: "",

        line_id: "",

        station_code: "",

        station_name: "",

        station_no: 1,

        station_type: "",

        is_active: true

    };


    const stepInitialState = {

        config_type: "STEP",

        route_id: "",

        sequence_no: 1,

        station_id: "",

        machine_id: "",

        operation_id: "",

        step_code: "",

        step_name: "",

        entry_rule: "",

        exit_rule: "",

        bypass_allowed: false,

        rework_allowed: false,

        cycle_time_sec: "",

        step_config: "{}",

        is_active: true

    };


    const validationInitialState = {

        config_type: "VALIDATION",

        route_id: "",

        route_step_id: "",

        validation_code: "",

        validation_type: "",

        expression: "",

        error_code: "",

        error_message: "",

        severity: "ERROR",

        sequence_no: 1,

        is_active: true,

        effective_from: "",

        effective_to: ""

    };


    const executeInitialState = {

        route_id: "",

        route_step_id: "",

        machine_id: "",

        unit_id: "",

        event_type: "",

        status: "COMPLETED",

        validation_result: "{}",

        event_ts: "",

        correlation_id: "",

        idempotency_key: "",

        source_system: "",

        payload: "{}"

    };


    // ======================================================
    // FORMS
    // ======================================================

    const [
        routeForm,
        setRouteForm
    ] = useState(
        routeInitialState
    );


    const [
        stationForm,
        setStationForm
    ] = useState(
        stationInitialState
    );


    const [
        stepForm,
        setStepForm
    ] = useState(
        stepInitialState
    );


    const [
        validationForm,
        setValidationForm
    ] = useState(
        validationInitialState
    );


    const [
        executeForm,
        setExecuteForm
    ] = useState(
        executeInitialState
    );


    // ======================================================
    // HELPERS
    // ======================================================

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
            response.errors.length > 0
        ) {

            return `${response.message || "Validation failed."} ${response.errors.join(", ")}`;

        }


        return (
            response?.message ||
            error?.message ||
            fallback
        );

    };


    // ======================================================
    // JSON PARSER
    // ======================================================

    const parseJsonObject = (
        value,
        fieldName
    ) => {

        if (
            value === "" ||
            value === null ||
            value === undefined
        ) {

            return {};

        }


        if (
            typeof value === "object" &&
            !Array.isArray(value)
        ) {

            return value;

        }


        try {

            const parsed =
                JSON.parse(value);


            if (
                parsed === null ||
                Array.isArray(parsed) ||
                typeof parsed !== "object"
            ) {

                throw new Error();

            }


            return parsed;

        }

        catch {

            throw new Error(
                `${fieldName} must contain valid JSON object data.`
            );

        }

    };


    // ======================================================
    // PRETTY JSON
    // ======================================================

    const prettyJson = (
        value,
        fallback = {}
    ) => {

        try {

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {

                return JSON.stringify(
                    fallback,
                    null,
                    2
                );

            }


            if (
                typeof value === "string"
            ) {

                return JSON.stringify(
                    JSON.parse(value),
                    null,
                    2
                );

            }


            return JSON.stringify(
                value,
                null,
                2
            );

        }

        catch {

            return JSON.stringify(
                fallback,
                null,
                2
            );

        }

    };


    // ======================================================
    // DATE INPUT
    // ======================================================

    const toDateInput = value => {

        if (!value) {
            return "";
        }


        return String(value)
            .slice(0, 10);

    };


    // ======================================================
    // DATETIME INPUT
    // ======================================================

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


        const offset =
            date.getTimezoneOffset() *
            60000;


        return new Date(
            date.getTime() - offset
        )
            .toISOString()
            .slice(0, 16);

    };


    // ======================================================
    // DATETIME DISPLAY
    // ======================================================

    const formatDateTime = value => {

        if (!value) {
            return "-";
        }


        const date =
            new Date(value);


        return Number.isNaN(
            date.getTime()
        )
            ? value
            : date.toLocaleString();

    };


    // ======================================================
    // LOAD DATA
    // ======================================================

    useEffect(() => {

        loadInitialData();

    }, []);


    const arrayData = value =>
        Array.isArray(value)
            ? value
            : [];


    const loadInitialData = async () => {

        try {

            setLoading(true);


            await Promise.all([

                loadRoutes(),

                loadConfigSummary(),

                loadStations(),

                loadSteps(),

                loadValidations(),

                loadCompanies(),

                loadPlants(),

                loadShops(),

                loadLines(),

                loadPartRevisions(),

                loadProcessRevisions(),

                loadMachines(),

                loadOperations()

            ]);

        }

        catch (error) {

            console.error(error);

        }

        finally {

            setLoading(false);

        }

    };


    // ======================================================
    // LOAD ROUTES
    // ======================================================

    const loadRoutes = async () => {

        try {

            const data =
                await routeStationService
                    .getRoutes();


            setRoutes(
                arrayData(data)
            );

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to load Route Master."
                ),
                "danger"
            );

        }

    };


    // ======================================================
    // CONFIG SUMMARY
    // ======================================================

    const loadConfigSummary = async () => {

        try {

            const data =
                await routeStationService
                    .getConfig();


            setRouteConfigSummary(
                arrayData(data)
            );

        }

        catch (error) {

            console.error(error);

        }

    };


    // ======================================================
    // LOAD STATIONS
    // ======================================================

    const loadStations = async () => {

        try {

            const data =
                await routeStationService
                    .getStations();


            setStations(
                arrayData(data)
            );

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to load Station Master."
                ),
                "danger"
            );

        }

    };


    // ======================================================
    // LOAD STEPS
    // ======================================================

    const loadSteps = async () => {

        try {

            const data =
                await routeStationService
                    .getSteps();


            setSteps(
                arrayData(data)
            );

        }

        catch (error) {

            console.error(error);

        }

    };


    // ======================================================
    // LOAD VALIDATIONS
    // ======================================================

    const loadValidations = async () => {

        try {

            const data =
                await routeStationService
                    .getValidations();


            setValidations(
                arrayData(data)
            );

        }

        catch (error) {

            console.error(error);

        }

    };


    // ======================================================
    // LOOKUPS
    // ======================================================

    const loadCompanies = async () => {

        try {

            const data =
                await routeStationService
                    .getCompanies();


            setCompanies(
                arrayData(data)
            );

        }

        catch (error) {

            console.error(error);

        }

    };


  
const loadPlants = async () => {

    try {

        const data =
            await routeStationService
                .getPlants();

        setPlants(
            arrayData(data)
        );

    } catch (error) {

        console.error(
            "LOAD PLANTS ERROR:",
            error
        );

        showToast(
            getErrorMessage(
                error,
                "Unable to load Plants."
            ),
            "danger"
        );

    }

};

   const loadShops = async () => {

    try {

        const data =
            await routeStationService
                .getShops();

        setShops(
            arrayData(data)
        );

    } catch (error) {

        console.error(
            "LOAD SHOPS ERROR:",
            error
        );

    }

};

    const loadLines = async () => {

        try {

            const data =
                await routeStationService
                    .getLines();


            setLines(
                arrayData(data)
            );

        }

        catch (error) {

            console.error(error);

        }

    };


    const loadPartRevisions = async () => {

        try {

            const data =
                await routeStationService
                    .getPartRevisions();


            setPartRevisions(
                arrayData(data)
            );

        }

        catch (error) {

            console.error(error);

        }

    };


    const loadProcessRevisions = async () => {

        try {

            const data =
                await routeStationService
                    .getProcessRevisions();


            setProcessRevisions(
                arrayData(data)
            );

        }

        catch (error) {

            console.error(error);

        }

    };


    const loadMachines = async () => {

        try {

            const data =
                await routeStationService
                    .getMachines();


            setMachines(
                arrayData(data)
            );

        }

        catch (error) {

            console.error(error);

        }

    };


    const loadOperations = async () => {

        try {

            const data =
                await routeStationService
                    .getOperations();


            setOperations(
                arrayData(data)
            );

        }

        catch (error) {

            console.error(error);

        }

    };


    // ======================================================
    // ======================================================
    // FILTERED LOOKUPS
    // ======================================================
    // ======================================================


    // ======================================================
    // ROUTE PART REVISIONS
    // ======================================================

    const availablePartRevisions =
        useMemo(() => {

            if (
                !routeForm.company_id
            ) {

                return partRevisions;

            }


            return partRevisions.filter(
                revision =>

                    !revision.company_id ||

                    revision.company_id ===
                    routeForm.company_id
            );

        }, [
            partRevisions,
            routeForm.company_id
        ]);


    // ======================================================
    // ROUTE PROCESS REVISIONS
    // ======================================================

    const availableProcessRevisions =
        useMemo(() => {

            if (
                !routeForm.company_id
            ) {

                return processRevisions;

            }


            return processRevisions.filter(
                revision =>

                    !revision.company_id ||

                    revision.company_id ===
                    routeForm.company_id
            );

        }, [
            processRevisions,
            routeForm.company_id
        ]);


    // ======================================================
    // STATION PLANTS
    // ======================================================

    const stationPlants =
        useMemo(() => {

            if (
                !stationForm.company_id
            ) {

                return plants;

            }


            return plants.filter(
                plant =>

                    !plant.company_id ||

                    plant.company_id ===
                    stationForm.company_id
            );

        }, [
            plants,
            stationForm.company_id
        ]);


    // ======================================================
    // STATION SHOPS
    // ======================================================

    const stationShops =
        useMemo(() => {

            return shops.filter(
                shop => {

                    const companyMatch =

                        !stationForm.company_id ||

                        !shop.company_id ||

                        shop.company_id ===
                        stationForm.company_id;


                    const plantMatch =

                        !stationForm.plant_id ||

                        !shop.plant_id ||

                        shop.plant_id ===
                        stationForm.plant_id;


                    return (
                        companyMatch &&
                        plantMatch
                    );

                }
            );

        }, [
            shops,
            stationForm.company_id,
            stationForm.plant_id
        ]);


    // ======================================================
    // STATION LINES
    // ======================================================

    const stationLines =
        useMemo(() => {

            return lines.filter(
                line => {

                    const companyMatch =

                        !stationForm.company_id ||

                        !line.company_id ||

                        line.company_id ===
                        stationForm.company_id;


                    const plantMatch =

                        !stationForm.plant_id ||

                        !line.plant_id ||

                        line.plant_id ===
                        stationForm.plant_id;


                    const shopMatch =

                        !stationForm.shop_id ||

                        !line.shop_id ||

                        line.shop_id ===
                        stationForm.shop_id;


                    return (

                        companyMatch &&

                        plantMatch &&

                        shopMatch

                    );

                }
            );

        }, [
            lines,
            stationForm.company_id,
            stationForm.plant_id,
            stationForm.shop_id
        ]);


    // ======================================================
    // SELECTED STEP ROUTE
    // ======================================================

    const selectedStepRoute =
        useMemo(
            () =>
                routes.find(
                    route =>
                        route.route_id ===
                        stepForm.route_id
                ),
            [
                routes,
                stepForm.route_id
            ]
        );


    // ======================================================
    // STEP STATIONS
    // ======================================================

    const availableStepStations =
        useMemo(() => {

            if (
                !selectedStepRoute
            ) {

                return stations;

            }


            return stations.filter(
                station =>

                    !station.company_id ||

                    station.company_id ===
                    selectedStepRoute.company_id
            );

        }, [
            stations,
            selectedStepRoute
        ]);


    // ======================================================
    // STEP OPERATIONS
    // ======================================================

    const availableStepOperations =
        useMemo(() => {

            if (
                !selectedStepRoute
            ) {

                return operations;

            }


            return operations.filter(
                operation =>

                    !operation.process_revision_id ||

                    operation.process_revision_id ===
                    selectedStepRoute.process_revision_id
            );

        }, [
            operations,
            selectedStepRoute
        ]);


    // ======================================================
    // SELECTED STEP STATION
    // ======================================================

    const selectedStepStation =
        useMemo(
            () =>
                stations.find(
                    station =>
                        station.station_id ===
                        stepForm.station_id
                ),
            [
                stations,
                stepForm.station_id
            ]
        );


    // ======================================================
    // STEP MACHINES
    // ======================================================

    const availableStepMachines =
        useMemo(() => {

            if (
                !selectedStepStation
            ) {

                return machines;

            }


            return machines.filter(
                machine => {

                    const companyMatch =

                        !machine.company_id ||

                        machine.company_id ===
                        selectedStepStation.company_id;


                    const plantMatch =

                        !machine.plant_id ||

                        machine.plant_id ===
                        selectedStepStation.plant_id;


                    const lineMatch =

                        !machine.line_id ||

                        machine.line_id ===
                        selectedStepStation.line_id;


                    return (

                        companyMatch &&

                        plantMatch &&

                        lineMatch

                    );

                }
            );

        }, [
            machines,
            selectedStepStation
        ]);


    // ======================================================
    // VALIDATION STEPS
    // ======================================================

    const availableValidationSteps =
        useMemo(() => {

            if (
                !validationForm.route_id
            ) {

                return [];

            }


            return steps.filter(
                step =>
                    step.route_id ===
                    validationForm.route_id
            );

        }, [
            steps,
            validationForm.route_id
        ]);


    // ======================================================
    // EXECUTE STEPS
    // ======================================================

    const executeSteps =
        useMemo(() => {

            if (
                !executeForm.route_id
            ) {

                return [];

            }


            return steps.filter(
                step =>

                    step.route_id ===
                    executeForm.route_id &&

                    step.is_active !== false
            );

        }, [
            steps,
            executeForm.route_id
        ]);


    // ======================================================
    // EXECUTE SELECTED STEP
    // ======================================================

    const selectedExecuteStep =
        useMemo(
            () =>
                steps.find(
                    step =>
                        step.route_step_id ===
                        executeForm.route_step_id
                ),
            [
                steps,
                executeForm.route_step_id
            ]
        );


    // ======================================================
    // EXECUTE STATION
    // ======================================================

    const selectedExecuteStation =
        useMemo(
            () =>
                stations.find(
                    station =>
                        station.station_id ===
                        selectedExecuteStep?.station_id
                ),
            [
                stations,
                selectedExecuteStep
            ]
        );


    // ======================================================
    // EXECUTE MACHINES
    // ======================================================

    const executeMachines =
        useMemo(() => {

            if (
                !selectedExecuteStation
            ) {

                return machines;

            }


            return machines.filter(
                machine => {

                    const plantMatch =

                        !machine.plant_id ||

                        machine.plant_id ===
                        selectedExecuteStation.plant_id;


                    const lineMatch =

                        !machine.line_id ||

                        machine.line_id ===
                        selectedExecuteStation.line_id;


                    return (
                        plantMatch &&
                        lineMatch
                    );

                }
            );

        }, [
            machines,
            selectedExecuteStation
        ]);


    // ======================================================
    // ======================================================
    // ROUTE MASTER
    // ======================================================
    // ======================================================

    const resetRouteForm = () => {

        setRouteEditId(null);

        setRouteForm(
            routeInitialState
        );

    };


    const openAddRoute = () => {

        resetRouteForm();

        setShowRouteForm(true);

    };


    const openEditRoute = route => {

        setRouteEditId(
            route.route_id
        );


        setRouteForm({

            company_id:
                route.company_id || "",

            part_revision_id:
                route.part_revision_id || "",

            process_revision_id:
                route.process_revision_id || "",

            route_code:
                route.route_code || "",

            route_name:
                route.route_name || "",

            route_type:
                route.route_type ||
                "STANDARD",

            effective_from:
                toDateInput(
                    route.effective_from
                ),

            effective_to:
                toDateInput(
                    route.effective_to
                ),

            is_default:
                Boolean(
                    route.is_default
                ),

            status:
                route.status ||
                "ACTIVE"

        });


        setShowRouteForm(true);

    };


    // ======================================================
    // SAVE ROUTE
    // ======================================================

    const saveRoute = async () => {

        try {

            if (
                !routeForm.company_id ||
                !routeForm.part_revision_id ||
                !routeForm.process_revision_id ||
                !routeForm.route_code.trim() ||
                !routeForm.route_name.trim()
            ) {

                showToast(
                    "Company, Part Revision, Process Revision, Route Code and Route Name are required.",
                    "danger"
                );

                return;

            }


            setSaving(true);


            const payload = {

                company_id:
                    routeForm.company_id,

                part_revision_id:
                    routeForm.part_revision_id,

                process_revision_id:
                    routeForm.process_revision_id,

                route_code:
                    routeForm.route_code
                        .trim(),

                route_name:
                    routeForm.route_name
                        .trim(),

                route_type:
                    routeForm.route_type
                        .trim()
                        .toUpperCase() ||
                    "STANDARD",

                effective_from:
                    routeForm.effective_from ||
                    null,

                effective_to:
                    routeForm.effective_to ||
                    null,

                is_default:
                    Boolean(
                        routeForm.is_default
                    ),

                status:
                    routeForm.status
                        .toUpperCase()

            };


            if (
                routeEditId
            ) {

                await routeStationService
                    .updateRoute(
                        routeEditId,
                        payload
                    );


                showToast(
                    "Route updated successfully."
                );

            }

            else {

                await routeStationService
                    .createRoute(
                        payload
                    );


                showToast(
                    "Route created successfully."
                );

            }


            setShowRouteForm(false);

            resetRouteForm();


            await Promise.all([

                loadRoutes(),

                loadConfigSummary()

            ]);

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to save Route."
                ),
                "danger"
            );

        }

        finally {

            setSaving(false);

        }

    };


    // ======================================================
    // DELETE ROUTE
    // ======================================================

    const deleteRoute = async route => {

        if (
            !window.confirm(
                `Deactivate route "${route.route_name}"?`
            )
        ) {

            return;

        }


        try {

            await routeStationService
                .deleteRoute(
                    route.route_id
                );


            showToast(
                "Route deactivated successfully."
            );


            await Promise.all([

                loadRoutes(),

                loadConfigSummary()

            ]);

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to deactivate Route."
                ),
                "danger"
            );

        }

    };


    // ======================================================
    // ======================================================
    // STATION MASTER
    // ======================================================
    // ======================================================

    const openAddStation = () => {

        setStationEditId(null);

        setStationForm(
            stationInitialState
        );

        setShowStationConfig(false);

        setShowStationForm(true);

    };


    const openEditStation = station => {

        setStationEditId(
            station.station_id
        );


        setStationForm({

            company_id:
                station.company_id || "",

            plant_id:
                station.plant_id || "",

            shop_id:
                station.shop_id || "",

            line_id:
                station.line_id || "",

            station_code:
                station.station_code || "",

            station_name:
                station.station_name || "",

            station_no:
                station.station_no ?? 1,

            station_type:
                station.station_type || "",

            is_active:
                station.is_active !== false

        });


        setShowStationConfig(false);

        setShowStationForm(true);

    };


    // ======================================================
    // SAVE STATION
    // ======================================================

    const saveStation = async () => {

        try {

            if (
                !stationForm.company_id ||
                !stationForm.plant_id ||
                !stationForm.line_id ||
                !stationForm.station_code.trim() ||
                !stationForm.station_name.trim()
            ) {

                showToast(
                    "Company, Plant, Line, Station Code and Station Name are required.",
                    "danger"
                );

                return;

            }


            if (
                Number(
                    stationForm.station_no
                ) <= 0
            ) {

                showToast(
                    "Station No must be greater than 0.",
                    "danger"
                );

                return;

            }


            setSaving(true);


            const payload = {

                company_id:
                    stationForm.company_id,

                plant_id:
                    stationForm.plant_id,

                shop_id:
                    stationForm.shop_id ||
                    null,

                line_id:
                    stationForm.line_id,

                station_code:
                    stationForm.station_code
                        .trim(),

                station_name:
                    stationForm.station_name
                        .trim(),

                station_no:
                    Number(
                        stationForm.station_no
                    ),

                station_type:
                    stationForm.station_type
                        .trim() ||
                    null,

                is_active:
                    Boolean(
                        stationForm.is_active
                    )

            };


            if (
                stationEditId
            ) {

                await routeStationService
                    .updateStation(
                        stationEditId,
                        payload
                    );


                showToast(
                    "Station updated successfully."
                );

            }

            else {

                await routeStationService
                    .createStation(
                        payload
                    );


                showToast(
                    "Station created successfully."
                );

            }


            setStationEditId(null);

            setStationForm(
                stationInitialState
            );

            setShowStationForm(false);


            await loadStations();


            setShowStationConfig(true);

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to save Station."
                ),
                "danger"
            );

        }

        finally {

            setSaving(false);

        }

    };


    // ======================================================
    // DELETE STATION
    // ======================================================

    const deleteStation = async station => {

        if (
            !window.confirm(
                `Deactivate station "${station.station_name}"?`
            )
        ) {

            return;

        }


        try {

            await routeStationService
                .deleteStation(
                    station.station_id
                );


            showToast(
                "Station deactivated successfully."
            );


            await loadStations();

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to deactivate Station."
                ),
                "danger"
            );

        }

    };


    // ======================================================
    // ======================================================
    // STEP CONFIG
    // ======================================================
    // ======================================================

    const openAddStep = () => {

        setStepEditId(null);

        setStepForm(
            stepInitialState
        );

        setShowStepConfig(false);

        setShowStepForm(true);

    };


    const openEditStep = step => {

        setStepEditId(
            step.route_step_id
        );


        setStepForm({

            config_type: "STEP",

            route_id:
                step.route_id || "",

            sequence_no:
                step.sequence_no ?? 1,

            station_id:
                step.station_id || "",

            machine_id:
                step.machine_id || "",

            operation_id:
                step.operation_id || "",

            step_code:
                step.step_code || "",

            step_name:
                step.step_name || "",

            entry_rule:
                step.entry_rule || "",

            exit_rule:
                step.exit_rule || "",

            bypass_allowed:
                Boolean(
                    step.bypass_allowed
                ),

            rework_allowed:
                Boolean(
                    step.rework_allowed
                ),

            cycle_time_sec:
                step.cycle_time_sec ?? "",

            step_config:
                prettyJson(
                    step.step_config,
                    {}
                ),

            is_active:
                step.is_active !== false

        });


        setShowStepConfig(false);

        setShowStepForm(true);

    };


    // ======================================================
    // SAVE STEP
    // ======================================================

    const saveStep = async () => {

        try {

            if (
                !stepForm.route_id ||
                !stepForm.station_id ||
                !stepForm.operation_id ||
                !stepForm.step_code.trim() ||
                !stepForm.step_name.trim()
            ) {

                showToast(
                    "Route, Station, Operation, Step Code and Step Name are required.",
                    "danger"
                );

                return;

            }


            if (
                Number(
                    stepForm.sequence_no
                ) <= 0
            ) {

                showToast(
                    "Sequence No must be greater than 0.",
                    "danger"
                );

                return;

            }


            if (
                stepForm.cycle_time_sec !== "" &&
                Number(
                    stepForm.cycle_time_sec
                ) <= 0
            ) {

                showToast(
                    "Cycle Time must be greater than 0.",
                    "danger"
                );

                return;

            }


            setSaving(true);


            const payload = {

                config_type: "STEP",

                route_id:
                    stepForm.route_id,

                sequence_no:
                    Number(
                        stepForm.sequence_no
                    ),

                station_id:
                    stepForm.station_id,

                machine_id:
                    stepForm.machine_id ||
                    null,

                operation_id:
                    stepForm.operation_id,

                step_code:
                    stepForm.step_code
                        .trim(),

                step_name:
                    stepForm.step_name
                        .trim(),

                entry_rule:
                    stepForm.entry_rule
                        .trim() ||
                    null,

                exit_rule:
                    stepForm.exit_rule
                        .trim() ||
                    null,

                bypass_allowed:
                    Boolean(
                        stepForm.bypass_allowed
                    ),

                rework_allowed:
                    Boolean(
                        stepForm.rework_allowed
                    ),

                cycle_time_sec:
                    stepForm.cycle_time_sec === ""
                        ? null
                        : Number(
                            stepForm.cycle_time_sec
                        ),

                step_config:
                    parseJsonObject(
                        stepForm.step_config,
                        "Step Config"
                    ),

                is_active:
                    Boolean(
                        stepForm.is_active
                    )

            };


            if (
                stepEditId
            ) {

                delete payload.config_type;


                await routeStationService
                    .updateConfig(
                        "STEP",
                        stepEditId,
                        payload
                    );


                showToast(
                    "Route Step updated successfully."
                );

            }

            else {

                await routeStationService
                    .createConfig(
                        payload
                    );


                showToast(
                    "Route Step created successfully."
                );

            }


            setStepEditId(null);

            setStepForm(
                stepInitialState
            );

            setShowStepForm(false);


            await Promise.all([

                loadSteps(),

                loadConfigSummary()

            ]);


            setShowStepConfig(true);

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to save Route Step."
                ),
                "danger"
            );

        }

        finally {

            setSaving(false);

        }

    };


    // ======================================================
    // DELETE STEP
    // ======================================================

    const deleteStep = async step => {

        if (
            !window.confirm(
                `Deactivate step "${step.step_name}"?`
            )
        ) {

            return;

        }


        try {

            await routeStationService
                .deleteConfig(
                    "STEP",
                    step.route_step_id
                );


            showToast(
                "Route Step deactivated successfully."
            );


            await Promise.all([

                loadSteps(),

                loadConfigSummary()

            ]);

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to deactivate Route Step."
                ),
                "danger"
            );

        }

    };


    // ======================================================
    // ======================================================
    // VALIDATION CONFIG
    // ======================================================
    // ======================================================

    const openAddValidation = () => {

        setValidationEditId(null);

        setValidationForm(
            validationInitialState
        );

        setShowValidationConfig(false);

        setShowValidationForm(true);

    };


    const openEditValidation = item => {

        setValidationEditId(
            item.route_validation_id
        );


        setValidationForm({

            config_type:
                "VALIDATION",

            route_id:
                item.route_id || "",

            route_step_id:
                item.route_step_id || "",

            validation_code:
                item.validation_code || "",

            validation_type:
                item.validation_type || "",

            expression:
                item.expression || "",

            error_code:
                item.error_code || "",

            error_message:
                item.error_message || "",

            severity:
                item.severity || "ERROR",

            sequence_no:
                item.sequence_no ?? 1,

            is_active:
                item.is_active !== false,

            effective_from:
                toDateTimeInput(
                    item.effective_from
                ),

            effective_to:
                toDateTimeInput(
                    item.effective_to
                )

        });


        setShowValidationConfig(false);

        setShowValidationForm(true);

    };


    // ======================================================
    // SAVE VALIDATION
    // ======================================================

    const saveValidation = async () => {

        try {

            if (
                !validationForm.route_id ||
                !validationForm.validation_code.trim() ||
                !validationForm.validation_type.trim() ||
                !validationForm.expression.trim() ||
                !validationForm.error_message.trim()
            ) {

                showToast(
                    "Route, Validation Code, Validation Type, Expression and Error Message are required.",
                    "danger"
                );

                return;

            }


            if (
                Number(
                    validationForm.sequence_no
                ) <= 0
            ) {

                showToast(
                    "Sequence No must be greater than 0.",
                    "danger"
                );

                return;

            }


            setSaving(true);


            const payload = {

                config_type:
                    "VALIDATION",

                route_id:
                    validationForm.route_id,

                route_step_id:
                    validationForm.route_step_id ||
                    null,

                validation_code:
                    validationForm.validation_code
                        .trim(),

                validation_type:
                    validationForm.validation_type
                        .trim()
                        .toUpperCase(),

                expression:
                    validationForm.expression
                        .trim(),

                error_code:
                    validationForm.error_code
                        .trim() ||
                    null,

                error_message:
                    validationForm.error_message
                        .trim(),

                severity:
                    validationForm.severity
                        .toUpperCase(),

                sequence_no:
                    Number(
                        validationForm.sequence_no
                    ),

                is_active:
                    Boolean(
                        validationForm.is_active
                    ),

                effective_from:
                    validationForm.effective_from ||
                    null,

                effective_to:
                    validationForm.effective_to ||
                    null

            };


            if (
                validationEditId
            ) {

                delete payload.config_type;


                await routeStationService
                    .updateConfig(
                        "VALIDATION",
                        validationEditId,
                        payload
                    );


                showToast(
                    "Route Validation updated successfully."
                );

            }

            else {

                await routeStationService
                    .createConfig(
                        payload
                    );


                showToast(
                    "Route Validation created successfully."
                );

            }


            setValidationEditId(null);

            setValidationForm(
                validationInitialState
            );

            setShowValidationForm(false);


            await Promise.all([

                loadValidations(),

                loadConfigSummary()

            ]);


            setShowValidationConfig(true);

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to save Route Validation."
                ),
                "danger"
            );

        }

        finally {

            setSaving(false);

        }

    };


    // ======================================================
    // DELETE VALIDATION
    // ======================================================

    const deleteValidation = async item => {

        if (
            !window.confirm(
                `Deactivate validation "${item.validation_code}"?`
            )
        ) {

            return;

        }


        try {

            await routeStationService
                .deleteConfig(
                    "VALIDATION",
                    item.route_validation_id
                );


            showToast(
                "Route Validation deactivated successfully."
            );


            await Promise.all([

                loadValidations(),

                loadConfigSummary()

            ]);

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to deactivate Route Validation."
                ),
                "danger"
            );

        }

    };


    // ======================================================
    // ======================================================
    // RUNTIME
    // ======================================================
    // ======================================================

    const loadRuntime = async () => {

        try {

            setLoading(true);


            const data =
                await routeStationService
                    .getRuntime();


            setRuntimeData(
                arrayData(data)
            );


            setShowRuntime(true);

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to load Route Runtime."
                ),
                "danger"
            );

        }

        finally {

            setLoading(false);

        }

    };


    // ======================================================
    // EXECUTE OPEN
    // ======================================================

    const openExecute = () => {

        setExecuteForm(
            executeInitialState
        );

        setShowExecute(true);

    };


    // ======================================================
    // EXECUTE ROUTE
    // ======================================================

    const executeRoute = async () => {

        try {

            if (
                !executeForm.route_id ||
                !executeForm.event_type.trim()
            ) {

                showToast(
                    "Route and Event Type are required.",
                    "danger"
                );

                return;

            }


            setSaving(true);


            const payload = {

                route_id:
                    executeForm.route_id,

                route_step_id:
                    executeForm.route_step_id ||
                    null,

                machine_id:
                    executeForm.machine_id ||
                    null,

                unit_id:
                    executeForm.unit_id
                        .trim() ||
                    null,

                event_type:
                    executeForm.event_type
                        .trim()
                        .toUpperCase(),

                status:
                    executeForm.status,

                validation_result:
                    parseJsonObject(
                        executeForm.validation_result,
                        "Validation Result"
                    ),

                event_ts:
                    executeForm.event_ts ||
                    null,

                correlation_id:
                    executeForm.correlation_id
                        .trim() ||
                    null,

                idempotency_key:
                    executeForm.idempotency_key
                        .trim() ||
                    null,

                source_system:
                    executeForm.source_system
                        .trim() ||
                    null,

                payload:
                    parseJsonObject(
                        executeForm.payload,
                        "Payload"
                    )

            };


            await routeStationService
                .execute(
                    payload
                );


            showToast(
                "Route execution event created successfully."
            );


            setExecuteForm(
                executeInitialState
            );


            setShowExecute(false);

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to execute Route."
                ),
                "danger"
            );

        }

        finally {

            setSaving(false);

        }

    };


    // ======================================================
    // ======================================================
    // REPORT
    // ======================================================
    // ======================================================

    const loadReport = async () => {

        try {

            setLoading(true);


            const data =
                await routeStationService
                    .getReport({

                        status:
                            statusFilter === "ALL"
                                ? ""
                                : statusFilter

                    });


            setReportData(
                arrayData(data)
            );


            setShowReport(true);

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Unable to generate Route Report."
                ),
                "danger"
            );

        }

        finally {

            setLoading(false);

        }

    };


    // ======================================================
    // EXPORT
    // ======================================================

    const exportRoute = async () => {

        try {

            const data =
                await routeStationService
                    .exportData({

                        format: "CSV",

                        status:
                            statusFilter === "ALL"
                                ? ""
                                : statusFilter

                    });


            const rows =
                arrayData(data);


            const columns = [

                [
                    "company_name",
                    "Company"
                ],

                [
                    "route_code",
                    "Route Code"
                ],

                [
                    "route_name",
                    "Route Name"
                ],

                [
                    "route_type",
                    "Route Type"
                ],

                [
                    "part_code",
                    "Part Code"
                ],

                [
                    "part_name",
                    "Part Name"
                ],

                [
                    "process_code",
                    "Process Code"
                ],

                [
                    "process_name",
                    "Process Name"
                ],

                [
                    "sequence_no",
                    "Sequence"
                ],

                [
                    "step_code",
                    "Step Code"
                ],

                [
                    "step_name",
                    "Step Name"
                ],

                [
                    "station_code",
                    "Station Code"
                ],

                [
                    "station_name",
                    "Station Name"
                ],

                [
                    "machine_name",
                    "Machine"
                ],

                [
                    "operation_code",
                    "Operation Code"
                ],

                [
                    "operation_name",
                    "Operation"
                ],

                [
                    "total_validations",
                    "Validations"
                ],

                [
                    "total_execution",
                    "Executions"
                ],

                [
                    "is_default",
                    "Default Route"
                ],

                [
                    "status",
                    "Status"
                ],

                [
                    "version_no",
                    "Version"
                ]

            ];


            const escapeCsv = value => {

                const text =
                    value === null ||
                    value === undefined
                        ? ""
                        : String(value);


                return `"${text.replace(
                    /"/g,
                    '""'
                )}"`;

            };


            const csv = [

                columns
                    .map(
                        ([, label]) =>
                            escapeCsv(label)
                    )
                    .join(","),

                ...rows.map(
                    row =>
                        columns
                            .map(
                                ([key]) =>
                                    escapeCsv(
                                        row[key]
                                    )
                            )
                            .join(",")
                )

            ].join("\n");


            const blob =
                new Blob(
                    [
                        "\uFEFF",
                        csv
                    ],
                    {
                        type:
                            "text/csv;charset=utf-8"
                    }
                );


            const url =
                window.URL
                    .createObjectURL(
                        blob
                    );


            const link =
                document.createElement(
                    "a"
                );


            link.href = url;

            link.download =
                "Route_Master.csv";


            document.body
                .appendChild(link);


            link.click();

            link.remove();


            window.URL
                .revokeObjectURL(
                    url
                );


            showToast(
                "CSV exported successfully."
            );

        }

        catch (error) {

            showToast(
                getErrorMessage(
                    error,
                    "Export failed."
                ),
                "danger"
            );

        }

    };


    // ======================================================
    // ======================================================
    // ROUTE SUMMARY MERGE
    // ======================================================
    // ======================================================

    const routeRows =
        useMemo(() => {

            return routes.map(
                route => {

                    const config =
                        routeConfigSummary.find(
                            item =>
                                item.route_id ===
                                route.route_id
                        );


                    return {

                        ...route,

                        total_steps:
                            config?.total_steps ??
                            0,

                        total_validations:
                            config?.total_validations ??
                            0

                    };

                }
            );

        }, [
            routes,
            routeConfigSummary
        ]);


    // ======================================================
    // FILTER ROUTES
    // ======================================================

    const filteredRoutes =
        routeRows.filter(
            route => {

                const search =
                    searchText
                        .trim()
                        .toLowerCase();


                const searchMatch =

                    !search ||

                    route.route_code
                        ?.toLowerCase()
                        .includes(search) ||

                    route.route_name
                        ?.toLowerCase()
                        .includes(search) ||

                    route.route_type
                        ?.toLowerCase()
                        .includes(search) ||

                    route.company_name
                        ?.toLowerCase()
                        .includes(search) ||

                    route.part_code
                        ?.toLowerCase()
                        .includes(search) ||

                    route.part_name
                        ?.toLowerCase()
                        .includes(search) ||

                    route.process_code
                        ?.toLowerCase()
                        .includes(search) ||

                    route.process_name
                        ?.toLowerCase()
                        .includes(search);


                const statusMatch =

                    statusFilter === "ALL" ||

                    route.status ===
                    statusFilter;


                return (
                    searchMatch &&
                    statusMatch
                );

            }
        );


    // ======================================================
    // ======================================================
    // TABLE COLUMNS
    // ======================================================
    // ======================================================


    // ======================================================
    // ROUTE COLUMNS
    // ======================================================

    const routeColumns = [

        {
            key:
                "route_code",
            label:
                "Route Code"
        },

        {
            key:
                "route_name",
            label:
                "Route Name"
        },

        {
            key:
                "route_type",
            label:
                "Route Type"
        },

        {
            key:
                "company_name",
            label:
                "Company"
        },

        {
            key:
                "part_code",
            label:
                "Part"
        },

        {
            key:
                "process_code",
            label:
                "Process"
        },

        {
            key:
                "effective_from",
            label:
                "Effective From"
        },

        {
            key:
                "total_steps",
            label:
                "Steps"
        },

        {
            key:
                "total_validations",
            label:
                "Validations"
        },

        {
            key:
                "is_default",
            label:
                "Default",
            render:
                row => (

                    <Badge
                        bg={
                            row.is_default
                                ? "success"
                                : "secondary"
                        }
                    >

                        {
                            row.is_default
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key:
                "status",
            label:
                "Status",
            render:
                row => (

                    <StatusBadge
                        status={
                            row.status
                        }
                    />

                )
        }

    ];


    // ======================================================
    // STATION COLUMNS
    // ======================================================

    const stationColumns = [

        {
            key:
                "station_code",
            label:
                "Station Code"
        },

        {
            key:
                "station_no",
            label:
                "Station No"
        },

        {
            key:
                "station_name",
            label:
                "Station Name"
        },

        {
            key:
                "station_type",
            label:
                "Station Type"
        },

        {
            key:
                "company_name",
            label:
                "Company"
        },

        {
            key:
                "plant_name",
            label:
                "Plant"
        },

        {
            key:
                "shop_name",
            label:
                "Shop"
        },

        {
            key:
                "line_name",
            label:
                "Line"
        },

        {
            key:
                "version_no",
            label:
                "Version"
        },

        {
            key:
                "is_active",
            label:
                "Status",
            render:
                row => (

                    <StatusBadge
                        status={
                            row.is_active
                                ? "ACTIVE"
                                : "INACTIVE"
                        }
                    />

                )
        }

    ];


    // ======================================================
    // STEP COLUMNS
    // ======================================================

    const stepColumns = [

        {
            key:
                "route_code",
            label:
                "Route"
        },

        {
            key:
                "sequence_no",
            label:
                "Sequence"
        },

        {
            key:
                "step_code",
            label:
                "Step Code"
        },

        {
            key:
                "step_name",
            label:
                "Step Name"
        },

        {
            key:
                "station_name",
            label:
                "Station"
        },

        {
            key:
                "machine_name",
            label:
                "Machine"
        },

        {
            key:
                "operation_name",
            label:
                "Operation"
        },

        {
            key:
                "cycle_time_sec",
            label:
                "Cycle Time"
        },

        {
            key:
                "bypass_allowed",
            label:
                "Bypass",
            render:
                row => (

                    <Badge
                        bg={
                            row.bypass_allowed
                                ? "warning"
                                : "secondary"
                        }
                    >

                        {
                            row.bypass_allowed
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key:
                "rework_allowed",
            label:
                "Rework",
            render:
                row => (

                    <Badge
                        bg={
                            row.rework_allowed
                                ? "info"
                                : "secondary"
                        }
                    >

                        {
                            row.rework_allowed
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key:
                "is_active",
            label:
                "Status",
            render:
                row => (

                    <StatusBadge
                        status={
                            row.is_active
                                ? "ACTIVE"
                                : "INACTIVE"
                        }
                    />

                )
        }

    ];


    // ======================================================
    // VALIDATION COLUMNS
    // ======================================================

    const validationColumns = [

        {
            key:
                "route_code",
            label:
                "Route"
        },

        {
            key:
                "step_code",
            label:
                "Step"
        },

        {
            key:
                "validation_code",
            label:
                "Validation Code"
        },

        {
            key:
                "validation_type",
            label:
                "Type"
        },

        {
            key:
                "severity",
            label:
                "Severity",
            render:
                row => (

                    <StatusBadge
                        status={
                            row.severity
                        }
                    />

                )
        },

        {
            key:
                "sequence_no",
            label:
                "Sequence"
        },

        {
            key:
                "error_code",
            label:
                "Error Code"
        },

        {
            key:
                "error_message",
            label:
                "Error Message"
        },

        {
            key:
                "is_active",
            label:
                "Status",
            render:
                row => (

                    <StatusBadge
                        status={
                            row.is_active
                                ? "ACTIVE"
                                : "INACTIVE"
                        }
                    />

                )
        }

    ];


    // ======================================================
    // RUNTIME COLUMNS
    // ======================================================

    const runtimeColumns = [

        {
            key:
                "route_code",
            label:
                "Route"
        },

        {
            key:
                "step_code",
            label:
                "Step"
        },

        {
            key:
                "station_name",
            label:
                "Station"
        },

        {
            key:
                "machine_name",
            label:
                "Machine"
        },

        {
            key:
                "operation_name",
            label:
                "Operation"
        },

        {
            key:
                "event_type",
            label:
                "Event Type"
        },

        {
            key:
                "status",
            label:
                "Status",
            render:
                row => (

                    <StatusBadge
                        status={
                            row.status
                        }
                    />

                )
        },

        {
            key:
                "event_ts",
            label:
                "Event Time",
            render:
                row =>
                    formatDateTime(
                        row.event_ts
                    )
        },

        {
            key:
                "source_system",
            label:
                "Source"
        }

    ];


    // ======================================================
    // REPORT COLUMNS
    // ======================================================

    const reportColumns = [

        {
            key:
                "route_code",
            label:
                "Route Code"
        },

        {
            key:
                "route_name",
            label:
                "Route Name"
        },

        {
            key:
                "part_code",
            label:
                "Part"
        },

        {
            key:
                "process_code",
            label:
                "Process"
        },

        {
            key:
                "sequence_no",
            label:
                "Sequence"
        },

        {
            key:
                "step_code",
            label:
                "Step"
        },

        {
            key:
                "station_name",
            label:
                "Station"
        },

        {
            key:
                "machine_name",
            label:
                "Machine"
        },

        {
            key:
                "operation_name",
            label:
                "Operation"
        },

        {
            key:
                "total_validations",
            label:
                "Validations"
        },

        {
            key:
                "total_execution",
            label:
                "Executions"
        },

        {
            key:
                "status",
            label:
                "Status",
            render:
                row => (

                    <StatusBadge
                        status={
                            row.status
                        }
                    />

                )
        }

    ];


    // ======================================================
    // ======================================================
    // UI
    // ======================================================
    // ======================================================

    return (

        <>

<div className="route-station-master container-fluid">

            {/* =====================================================
                TOAST
            ===================================================== */}

            <Toast
                show={
                    toast.show
                }
                onClose={
                    hideToast
                }
                delay={
                    3000
                }
                autohide
                bg={
                    toast.variant
                }
                className="position-fixed top-0 end-0 m-3"
                style={{
                    zIndex: 9999
                }}
            >

                <Toast.Body className="text-white">

                    {toast.message}

                </Toast.Body>

            </Toast>


            {/* =====================================================
                HEADER
            ===================================================== */}

            <Card className="shadow-sm border-0 mb-4">

                <Card.Body>

                    <Row className="align-items-center g-3">

                        <Col>

                            <h3 className="mb-1">

                                Route / Station Master

                            </h3>

                            <small className="text-muted">

                                Master Data / Route & Station Master

                            </small>

                        </Col>


                        <Col xs="auto">

                            <div className="d-flex gap-2 flex-wrap">

                                <Button
                                    variant="outline-primary"
                                    onClick={() => {

                                        loadStations();

                                        setShowStationConfig(
                                            true
                                        );

                                    }}
                                >

                                    Station Master

                                </Button>


                                <Button
                                    variant="outline-primary"
                                    onClick={() => {

                                        loadSteps();

                                        setShowStepConfig(
                                            true
                                        );

                                    }}
                                >

                                    Step Config

                                </Button>


                                <Button
                                    variant="outline-primary"
                                    onClick={() => {

                                        loadValidations();

                                        setShowValidationConfig(
                                            true
                                        );

                                    }}
                                >

                                    Validation Config

                                </Button>


                                <Button
                                    variant="primary"
                                    onClick={
                                        openAddRoute
                                    }
                                >

                                    <Plus />

                                    {" "}

                                    Add Route

                                </Button>

                            </div>

                        </Col>

                    </Row>

                </Card.Body>

            </Card>


            {/* =====================================================
                SEARCH TOOLBAR
            ===================================================== */}

            <SearchToolbar

                searchText={
                    searchText
                }

                onSearch={
                    setSearchText
                }

                status={
                    statusFilter
                }

                onStatusChange={
                    setStatusFilter
                }

                onRefresh={
                    loadInitialData
                }

                onExecute={
                    openExecute
                }

                onRuntime={
                    loadRuntime
                }

                onReport={
                    loadReport
                }

                onExport={
                    exportRoute
                }

                placeholder=
                    "Search Route..."

            />


            {/* =====================================================
                ROUTE TABLE
            ===================================================== */}

            <DataTable

                columns={
                    routeColumns
                }

                data={
                    filteredRoutes
                }

                loading={
                    loading
                }

                emptyMessage=
                    "No Route Found"

                renderActions={
                    route => (

                        <ActionButtons

                            onEdit={() =>
                                openEditRoute(
                                    route
                                )
                            }

                            onDelete={() =>
                                deleteRoute(
                                    route
                                )
                            }

                        />

                    )
                }

            />


            {/* =====================================================
                ROUTE FORM
            ===================================================== */}

            <Modal
                show={
                    showRouteForm
                }
                onHide={() => {

                    resetRouteForm();

                    setShowRouteForm(
                        false
                    );

                }}
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {
                            routeEditId
                                ? "Update Route"
                                : "Create Route"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Company *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            routeForm.company_id
                                        }
                                         disabled={Boolean(routeEditId)}
                                        onChange={
                                            e =>
                                                setRouteForm(
                                                    previous => ({
                                                        ...previous,

                                                        company_id:
                                                            e.target.value,

                                                        part_revision_id:
                                                            "",

                                                        process_revision_id:
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
                                                company => (

                                                    <option
                                                        key={
                                                            company.company_id
                                                        }
                                                        value={
                                                            company.company_id
                                                        }
                                                    >

                                                        {
                                                            company.company_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Part Revision *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            routeForm.part_revision_id
                                        }
                                        disabled={ Boolean(routeEditId) ||
                                            !routeForm.company_id
                                        }
                                        onChange={
                                            e =>
                                                setRouteForm(
                                                    previous => ({
                                                        ...previous,

                                                        part_revision_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Select Part Revision

                                        </option>

                                        {
                                            availablePartRevisions.map(
                                                revision => (

                                                    <option
                                                        key={
                                                            revision.part_revision_id
                                                        }
                                                        value={
                                                            revision.part_revision_id
                                                        }
                                                    >

                                                        {
                                                            revision.part_code
                                                        }

                                                        {" - "}

                                                        {
                                                            revision.part_name
                                                        }

                                                        {" - Rev "}

                                                        {
                                                            revision.revision_no
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Process Revision *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            routeForm.process_revision_id
                                        }
                                        disabled={
                                            Boolean(routeEditId) ||
                                            !routeForm.company_id
                                        }
                                        onChange={
                                            e =>
                                                setRouteForm(
                                                    previous => ({
                                                        ...previous,

                                                        process_revision_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Select Process Revision

                                        </option>

                                        {
                                            availableProcessRevisions.map(
                                                revision => (

                                                    <option
                                                        key={
                                                            revision.process_revision_id
                                                        }
                                                        value={
                                                            revision.process_revision_id
                                                        }
                                                    >

                                                        {
                                                            revision.process_code
                                                        }

                                                        {" - "}

                                                        {
                                                            revision.process_name
                                                        }

                                                        {" - Rev "}

                                                        {
                                                            revision.revision_no
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Route Code *

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            routeForm.route_code
                                        }
                                        onChange={
                                            e =>
                                                setRouteForm(
                                                    previous => ({
                                                        ...previous,

                                                        route_code:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        placeholder="ROUTE-001"
                                        maxLength={75}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Route Name *

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            routeForm.route_name
                                        }
                                        onChange={
                                            e =>
                                                setRouteForm(
                                                    previous => ({
                                                        ...previous,

                                                        route_name:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        maxLength={150}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Route Type

                                    </Form.Label>

                                    <Form.Control
                                        list="route-type-options"
                                        value={
                                            routeForm.route_type
                                        }
                                        onChange={
                                            e =>
                                                setRouteForm(
                                                    previous => ({
                                                        ...previous,

                                                        route_type:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        maxLength={50}
                                    />

                                    <datalist id="route-type-options">

                                        {
                                            ROUTE_TYPES.map(
                                                type => (

                                                    <option
                                                        key={
                                                            type
                                                        }
                                                        value={
                                                            type
                                                        }
                                                    />

                                                )
                                            )
                                        }

                                    </datalist>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Effective From

                                    </Form.Label>

                                    <Form.Control
                                        type="date"
                                        value={
                                            routeForm.effective_from
                                        }
                                        onChange={
                                            e =>
                                                setRouteForm(
                                                    previous => ({
                                                        ...previous,

                                                        effective_from:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Effective To

                                    </Form.Label>

                                    <Form.Control
                                        type="date"
                                        value={
                                            routeForm.effective_to
                                        }
                                        onChange={
                                            e =>
                                                setRouteForm(
                                                    previous => ({
                                                        ...previous,

                                                        effective_to:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Status

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            routeForm.status
                                        }
                                        onChange={
                                            e =>
                                                setRouteForm(
                                                    previous => ({
                                                        ...previous,

                                                        status:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        {
                                            ROUTE_STATUS.map(
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

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Check
                            type="checkbox"
                            label="Set as Default Route for selected Part Revision"
                            checked={
                                routeForm.is_default
                            }
                            onChange={
                                e =>
                                    setRouteForm(
                                        previous => ({
                                            ...previous,

                                            is_default:
                                                e.target.checked
                                        })
                                    )
                            }
                        />

                    </Form>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => {

                            resetRouteForm();

                            setShowRouteForm(
                                false
                            );

                        }}
                    >

                        Cancel

                    </Button>


                    <Button
                        variant="primary"
                        disabled={
                            saving
                        }
                        onClick={
                            saveRoute
                        }
                    >

                        {
                            saving
                                ? (
                                    <>
                                        <Spinner
                                            size="sm"
                                            animation="border"
                                            className="me-2"
                                        />

                                        Saving...
                                    </>
                                )
                                : routeEditId
                                    ? "Update Route"
                                    : "Save Route"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                STATION CONFIG TABLE
            ===================================================== */}

            <Modal
                show={
                    showStationConfig
                }
                onHide={() =>
                    setShowStationConfig(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Station Master

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddStation
                            }
                        >

                            <Plus />

                            {" "}

                            Add Station

                        </Button>

                    </div>


                    <DataTable
                        columns={
                            stationColumns
                        }
                        data={
                            stations
                        }
                        loading={
                            loading
                        }
                        emptyMessage=
                            "No Station Found"
                        renderActions={
                            station => (

                                <ActionButtons
                                    onEdit={() =>
                                        openEditStation(
                                            station
                                        )
                                    }
                                    onDelete={() =>
                                        deleteStation(
                                            station
                                        )
                                    }
                                />

                            )
                        }
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowStationConfig(
                                false
                            )
                        }
                    >

                        Close

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                STATION ADD / EDIT FORM
            ===================================================== */}

            <Modal
                show={
                    showStationForm
                }
                onHide={() => {

                    setShowStationForm(
                        false
                    );

                    setStationEditId(
                        null
                    );

                    setStationForm(
                        stationInitialState
                    );

                    setShowStationConfig(
                        true
                    );

                }}
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {
                            stationEditId
                                ? "Update Station"
                                : "Add Station"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Company *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            stationForm.company_id
                                        }
                                        onChange={
                                            e =>
                                                setStationForm(
                                                    previous => ({
                                                        ...previous,

                                                        company_id:
                                                            e.target.value,

                                                        plant_id:
                                                            "",

                                                        shop_id:
                                                            "",

                                                        line_id:
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
                                                company => (

                                                    <option
                                                        key={
                                                            company.company_id
                                                        }
                                                        value={
                                                            company.company_id
                                                        }
                                                    >

                                                        {
                                                            company.company_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Plant *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            stationForm.plant_id
                                        }
                                        disabled={
                                            !stationForm.company_id
                                        }
                                        onChange={
                                            e =>
                                                setStationForm(
                                                    previous => ({
                                                        ...previous,

                                                        plant_id:
                                                            e.target.value,

                                                        shop_id:
                                                            "",

                                                        line_id:
                                                            ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Select Plant

                                        </option>

                                        {
                                            stationPlants.map(
                                                plant => (

                                                    <option
                                                        key={
                                                            plant.plant_id
                                                        }
                                                        value={
                                                            plant.plant_id
                                                        }
                                                    >

                                                        {
                                                            plant.plant_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Shop

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            stationForm.shop_id
                                        }
                                        disabled={
                                            !stationForm.plant_id
                                        }
                                        onChange={
                                            e =>
                                                setStationForm(
                                                    previous => ({
                                                        ...previous,

                                                        shop_id:
                                                            e.target.value,

                                                        line_id:
                                                            ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            No Shop / Select Shop

                                        </option>

                                        {
                                            stationShops.map(
                                                shop => (

                                                    <option
                                                        key={
                                                            shop.shop_id
                                                        }
                                                        value={
                                                            shop.shop_id
                                                        }
                                                    >

                                                        {
                                                            shop.shop_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Line *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            stationForm.line_id
                                        }
                                        disabled={
                                            !stationForm.plant_id
                                        }
                                        onChange={
                                            e =>
                                                setStationForm(
                                                    previous => ({
                                                        ...previous,

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
                                            stationLines.map(
                                                line => (

                                                    <option
                                                        key={
                                                            line.line_id
                                                        }
                                                        value={
                                                            line.line_id
                                                        }
                                                    >

                                                        {
                                                            line.line_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Station Code *

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            stationForm.station_code
                                        }
                                        onChange={
                                            e =>
                                                setStationForm(
                                                    previous => ({
                                                        ...previous,

                                                        station_code:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        placeholder="ST10"
                                        maxLength={50}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Station Name *

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            stationForm.station_name
                                        }
                                        onChange={
                                            e =>
                                                setStationForm(
                                                    previous => ({
                                                        ...previous,

                                                        station_name:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        maxLength={150}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Station No *

                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            stationForm.station_no
                                        }
                                        onChange={
                                            e =>
                                                setStationForm(
                                                    previous => ({
                                                        ...previous,

                                                        station_no:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Station Type

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            stationForm.station_type
                                        }
                                        onChange={
                                            e =>
                                                setStationForm(
                                                    previous => ({
                                                        ...previous,

                                                        station_type:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        placeholder="ASSEMBLY / TEST / INSPECTION"
                                        maxLength={50}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <div className="pt-4">

                                    <Form.Check
                                        type="checkbox"
                                        label="Active Station"
                                        checked={
                                            stationForm.is_active
                                        }
                                        onChange={
                                            e =>
                                                setStationForm(
                                                    previous => ({
                                                        ...previous,

                                                        is_active:
                                                            e.target.checked
                                                    })
                                                )
                                        }
                                    />

                                </div>

                            </Col>

                        </Row>

                    </Form>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => {

                            setShowStationForm(
                                false
                            );

                            setStationEditId(
                                null
                            );

                            setStationForm(
                                stationInitialState
                            );

                            setShowStationConfig(
                                true
                            );

                        }}
                    >

                        Cancel

                    </Button>


                    <Button
                        disabled={
                            saving
                        }
                        onClick={
                            saveStation
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : stationEditId
                                    ? "Update Station"
                                    : "Save Station"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                STEP CONFIG TABLE
            ===================================================== */}

            <Modal
                show={
                    showStepConfig
                }
                onHide={() =>
                    setShowStepConfig(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Route Step Configuration

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddStep
                            }
                        >

                            <Plus />

                            {" "}

                            Add Step

                        </Button>

                    </div>


                    <DataTable
                        columns={
                            stepColumns
                        }
                        data={
                            steps
                        }
                        loading={
                            loading
                        }
                        emptyMessage=
                            "No Route Step Found"
                        renderActions={
                            step => (

                                <ActionButtons
                                    onEdit={() =>
                                        openEditStep(
                                            step
                                        )
                                    }
                                    onDelete={() =>
                                        deleteStep(
                                            step
                                        )
                                    }
                                />

                            )
                        }
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowStepConfig(
                                false
                            )
                        }
                    >

                        Close

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                STEP ADD / EDIT
            ===================================================== */}

            <Modal
                show={
                    showStepForm
                }
                onHide={() => {

                    setShowStepForm(
                        false
                    );

                    setStepEditId(
                        null
                    );

                    setStepForm(
                        stepInitialState
                    );

                    setShowStepConfig(
                        true
                    );

                }}
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {
                            stepEditId
                                ? "Update Route Step"
                                : "Add Route Step"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Route *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            stepForm.route_id
                                        }
                                        onChange={
                                            e =>
                                                setStepForm(
                                                    previous => ({
                                                        ...previous,

                                                        route_id:
                                                            e.target.value,

                                                        station_id:
                                                            "",

                                                        machine_id:
                                                            "",

                                                        operation_id:
                                                            ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Select Route

                                        </option>

                                        {
                                            routes.map(
                                                route => (

                                                    <option
                                                        key={
                                                            route.route_id
                                                        }
                                                        value={
                                                            route.route_id
                                                        }
                                                    >

                                                        {
                                                            route.route_code
                                                        }

                                                        {" - "}

                                                        {
                                                            route.route_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Sequence No *

                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            stepForm.sequence_no
                                        }
                                        onChange={
                                            e =>
                                                setStepForm(
                                                    previous => ({
                                                        ...previous,

                                                        sequence_no:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Cycle Time (Sec)

                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        value={
                                            stepForm.cycle_time_sec
                                        }
                                        onChange={
                                            e =>
                                                setStepForm(
                                                    previous => ({
                                                        ...previous,

                                                        cycle_time_sec:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Station *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            stepForm.station_id
                                        }
                                        disabled={
                                            !stepForm.route_id
                                        }
                                        onChange={
                                            e =>
                                                setStepForm(
                                                    previous => ({
                                                        ...previous,

                                                        station_id:
                                                            e.target.value,

                                                        machine_id:
                                                            ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Select Station

                                        </option>

                                        {
                                            availableStepStations.map(
                                                station => (

                                                    <option
                                                        key={
                                                            station.station_id
                                                        }
                                                        value={
                                                            station.station_id
                                                        }
                                                    >

                                                        {
                                                            station.station_code
                                                        }

                                                        {" - "}

                                                        {
                                                            station.station_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Machine

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            stepForm.machine_id
                                        }
                                        disabled={
                                            !stepForm.station_id
                                        }
                                        onChange={
                                            e =>
                                                setStepForm(
                                                    previous => ({
                                                        ...previous,

                                                        machine_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            No Machine / Select Machine

                                        </option>

                                        {
                                            availableStepMachines.map(
                                                machine => (

                                                    <option
                                                        key={
                                                            machine.machine_id
                                                        }
                                                        value={
                                                            machine.machine_id
                                                        }
                                                    >

                                                        {
                                                            machine.machine_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Operation *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            stepForm.operation_id
                                        }
                                        disabled={
                                            !stepForm.route_id
                                        }
                                        onChange={
                                            e =>
                                                setStepForm(
                                                    previous => ({
                                                        ...previous,

                                                        operation_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Select Operation

                                        </option>

                                        {
                                            availableStepOperations.map(
                                                operation => (

                                                    <option
                                                        key={
                                                            operation.operation_id
                                                        }
                                                        value={
                                                            operation.operation_id
                                                        }
                                                    >

                                                        {
                                                            operation.operation_code
                                                        }

                                                        {" - "}

                                                        {
                                                            operation.operation_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Step Code *

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            stepForm.step_code
                                        }
                                        onChange={
                                            e =>
                                                setStepForm(
                                                    previous => ({
                                                        ...previous,

                                                        step_code:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        placeholder="STEP-010"
                                        maxLength={75}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Step Name *

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            stepForm.step_name
                                        }
                                        onChange={
                                            e =>
                                                setStepForm(
                                                    previous => ({
                                                        ...previous,

                                                        step_name:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        maxLength={150}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Entry Rule

                                    </Form.Label>

                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={
                                            stepForm.entry_rule
                                        }
                                        onChange={
                                            e =>
                                                setStepForm(
                                                    previous => ({
                                                        ...previous,

                                                        entry_rule:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Exit Rule

                                    </Form.Label>

                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={
                                            stepForm.exit_rule
                                        }
                                        onChange={
                                            e =>
                                                setStepForm(
                                                    previous => ({
                                                        ...previous,

                                                        exit_rule:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>

                                Step Config (JSON Object)

                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={
                                    stepForm.step_config
                                }
                                onChange={
                                    e =>
                                        setStepForm(
                                            previous => ({
                                                ...previous,

                                                step_config:
                                                    e.target.value
                                            })
                                        )
                                }
                            />

                        </Form.Group>


                        <Row>

                            <Col md={4}>

                                <Form.Check
                                    type="checkbox"
                                    label="Bypass Allowed"
                                    checked={
                                        stepForm.bypass_allowed
                                    }
                                    onChange={
                                        e =>
                                            setStepForm(
                                                previous => ({
                                                    ...previous,

                                                    bypass_allowed:
                                                        e.target.checked
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Check
                                    type="checkbox"
                                    label="Rework Allowed"
                                    checked={
                                        stepForm.rework_allowed
                                    }
                                    onChange={
                                        e =>
                                            setStepForm(
                                                previous => ({
                                                    ...previous,

                                                    rework_allowed:
                                                        e.target.checked
                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Check
                                    type="checkbox"
                                    label="Active"
                                    checked={
                                        stepForm.is_active
                                    }
                                    onChange={
                                        e =>
                                            setStepForm(
                                                previous => ({
                                                    ...previous,

                                                    is_active:
                                                        e.target.checked
                                                })
                                            )
                                    }
                                />

                            </Col>

                        </Row>

                    </Form>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => {

                            setShowStepForm(
                                false
                            );

                            setStepEditId(
                                null
                            );

                            setStepForm(
                                stepInitialState
                            );

                            setShowStepConfig(
                                true
                            );

                        }}
                    >

                        Cancel

                    </Button>


                    <Button
                        disabled={
                            saving
                        }
                        onClick={
                            saveStep
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : stepEditId
                                    ? "Update Step"
                                    : "Save Step"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                VALIDATION CONFIG TABLE
            ===================================================== */}

            <Modal
                show={
                    showValidationConfig
                }
                onHide={() =>
                    setShowValidationConfig(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Route Validation Configuration

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddValidation
                            }
                        >

                            <Plus />

                            {" "}

                            Add Validation

                        </Button>

                    </div>


                    <DataTable
                        columns={
                            validationColumns
                        }
                        data={
                            validations
                        }
                        loading={
                            loading
                        }
                        emptyMessage=
                            "No Route Validation Found"
                        renderActions={
                            item => (

                                <ActionButtons
                                    onEdit={() =>
                                        openEditValidation(
                                            item
                                        )
                                    }
                                    onDelete={() =>
                                        deleteValidation(
                                            item
                                        )
                                    }
                                />

                            )
                        }
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowValidationConfig(
                                false
                            )
                        }
                    >

                        Close

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                VALIDATION FORM
            ===================================================== */}

            <Modal
                show={
                    showValidationForm
                }
                onHide={() => {

                    setShowValidationForm(
                        false
                    );

                    setValidationEditId(
                        null
                    );

                    setValidationForm(
                        validationInitialState
                    );

                    setShowValidationConfig(
                        true
                    );

                }}
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {
                            validationEditId
                                ? "Update Route Validation"
                                : "Add Route Validation"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Route *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            validationForm.route_id
                                        }
                                        onChange={
                                            e =>
                                                setValidationForm(
                                                    previous => ({
                                                        ...previous,

                                                        route_id:
                                                            e.target.value,

                                                        route_step_id:
                                                            ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Select Route

                                        </option>

                                        {
                                            routes.map(
                                                route => (

                                                    <option
                                                        key={
                                                            route.route_id
                                                        }
                                                        value={
                                                            route.route_id
                                                        }
                                                    >

                                                        {
                                                            route.route_code
                                                        }

                                                        {" - "}

                                                        {
                                                            route.route_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Route Step

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            validationForm.route_step_id
                                        }
                                        disabled={
                                            !validationForm.route_id
                                        }
                                        onChange={
                                            e =>
                                                setValidationForm(
                                                    previous => ({
                                                        ...previous,

                                                        route_step_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Route Level Validation

                                        </option>

                                        {
                                            availableValidationSteps.map(
                                                step => (

                                                    <option
                                                        key={
                                                            step.route_step_id
                                                        }
                                                        value={
                                                            step.route_step_id
                                                        }
                                                    >

                                                        {
                                                            step.sequence_no
                                                        }

                                                        {" - "}

                                                        {
                                                            step.step_code
                                                        }

                                                        {" - "}

                                                        {
                                                            step.step_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Validation Code *

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            validationForm.validation_code
                                        }
                                        onChange={
                                            e =>
                                                setValidationForm(
                                                    previous => ({
                                                        ...previous,

                                                        validation_code:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        maxLength={75}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Validation Type *

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            validationForm.validation_type
                                        }
                                        onChange={
                                            e =>
                                                setValidationForm(
                                                    previous => ({
                                                        ...previous,

                                                        validation_type:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        placeholder="INTERLOCK / QUALITY / TRACEABILITY"
                                        maxLength={50}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Severity

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            validationForm.severity
                                        }
                                        onChange={
                                            e =>
                                                setValidationForm(
                                                    previous => ({
                                                        ...previous,

                                                        severity:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        {
                                            VALIDATION_SEVERITY.map(
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

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>

                                Expression *

                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={
                                    validationForm.expression
                                }
                                onChange={
                                    e =>
                                        setValidationForm(
                                            previous => ({
                                                ...previous,

                                                expression:
                                                    e.target.value
                                            })
                                        )
                                }
                            />

                        </Form.Group>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Error Code

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            validationForm.error_code
                                        }
                                        onChange={
                                            e =>
                                                setValidationForm(
                                                    previous => ({
                                                        ...previous,

                                                        error_code:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        maxLength={50}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={8}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Error Message *

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            validationForm.error_message
                                        }
                                        onChange={
                                            e =>
                                                setValidationForm(
                                                    previous => ({
                                                        ...previous,

                                                        error_message:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Sequence No

                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            validationForm.sequence_no
                                        }
                                        onChange={
                                            e =>
                                                setValidationForm(
                                                    previous => ({
                                                        ...previous,

                                                        sequence_no:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Effective From

                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            validationForm.effective_from
                                        }
                                        onChange={
                                            e =>
                                                setValidationForm(
                                                    previous => ({
                                                        ...previous,

                                                        effective_from:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Effective To

                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            validationForm.effective_to
                                        }
                                        onChange={
                                            e =>
                                                setValidationForm(
                                                    previous => ({
                                                        ...previous,

                                                        effective_to:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Check
                            type="checkbox"
                            label="Active Validation"
                            checked={
                                validationForm.is_active
                            }
                            onChange={
                                e =>
                                    setValidationForm(
                                        previous => ({
                                            ...previous,

                                            is_active:
                                                e.target.checked
                                        })
                                    )
                            }
                        />

                    </Form>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => {

                            setShowValidationForm(
                                false
                            );

                            setValidationEditId(
                                null
                            );

                            setValidationForm(
                                validationInitialState
                            );

                            setShowValidationConfig(
                                true
                            );

                        }}
                    >

                        Cancel

                    </Button>


                    <Button
                        disabled={
                            saving
                        }
                        onClick={
                            saveValidation
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : validationEditId
                                    ? "Update Validation"
                                    : "Save Validation"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                RUNTIME
            ===================================================== */}

            <Modal
                show={
                    showRuntime
                }
                onHide={() =>
                    setShowRuntime(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Route Runtime / Event History

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <DataTable
                        columns={
                            runtimeColumns
                        }
                        data={
                            runtimeData
                        }
                        loading={
                            loading
                        }
                        emptyMessage=
                            "No Route Events Found"
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowRuntime(
                                false
                            )
                        }
                    >

                        Close

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                EXECUTE
            ===================================================== */}

            <Modal
                show={
                    showExecute
                }
                onHide={() =>
                    setShowExecute(
                        false
                    )
                }
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Execute Route Event

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Route *

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.route_id
                                        }
                                        onChange={
                                            e =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        route_id:
                                                            e.target.value,

                                                        route_step_id:
                                                            "",

                                                        machine_id:
                                                            ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Select Route

                                        </option>

                                        {
                                            routes.map(
                                                route => (

                                                    <option
                                                        key={
                                                            route.route_id
                                                        }
                                                        value={
                                                            route.route_id
                                                        }
                                                    >

                                                        {
                                                            route.route_code
                                                        }

                                                        {" - "}

                                                        {
                                                            route.route_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Route Step

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.route_step_id
                                        }
                                        disabled={
                                            !executeForm.route_id
                                        }
                                        onChange={
                                            e =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        route_step_id:
                                                            e.target.value,

                                                        machine_id:
                                                            ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Use First Active Step Automatically

                                        </option>

                                        {
                                            executeSteps.map(
                                                step => (

                                                    <option
                                                        key={
                                                            step.route_step_id
                                                        }
                                                        value={
                                                            step.route_step_id
                                                        }
                                                    >

                                                        {
                                                            step.sequence_no
                                                        }

                                                        {" - "}

                                                        {
                                                            step.step_code
                                                        }

                                                        {" - "}

                                                        {
                                                            step.step_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Station

                                    </Form.Label>

                                    <Form.Control
                                        readOnly
                                        value={
                                            selectedExecuteStation
                                                ? `${selectedExecuteStation.station_code || ""} - ${selectedExecuteStation.station_name || ""}`
                                                : ""
                                        }
                                        placeholder="Derived from Route Step"
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Machine

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.machine_id
                                        }
                                        onChange={
                                            e =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        machine_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            Use Configured Machine

                                        </option>

                                        {
                                            executeMachines.map(
                                                machine => (

                                                    <option
                                                        key={
                                                            machine.machine_id
                                                        }
                                                        value={
                                                            machine.machine_id
                                                        }
                                                    >

                                                        {
                                                            machine.machine_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Unit ID

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.unit_id
                                        }
                                        onChange={
                                            e =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        unit_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        placeholder="Optional Unit UUID"
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Event Type *

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.event_type
                                        }
                                        onChange={
                                            e =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        event_type:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        placeholder="START / COMPLETE / CUSTOM"
                                        maxLength={50}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Event Status

                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.status
                                        }
                                        onChange={
                                            e =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        status:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    >

                                        {
                                            EVENT_STATUS.map(
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

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Event Time

                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            executeForm.event_ts
                                        }
                                        onChange={
                                            e =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        event_ts:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Source System

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.source_system
                                        }
                                        onChange={
                                            e =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        source_system:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        maxLength={100}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Correlation ID

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.correlation_id
                                        }
                                        onChange={
                                            e =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        correlation_id:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        placeholder="Optional UUID"
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Idempotency Key

                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.idempotency_key
                                        }
                                        onChange={
                                            e =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        idempotency_key:
                                                            e.target.value
                                                    })
                                                )
                                        }
                                        maxLength={150}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>

                                Validation Result (JSON Object)

                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={
                                    executeForm.validation_result
                                }
                                onChange={
                                    e =>
                                        setExecuteForm(
                                            previous => ({
                                                ...previous,

                                                validation_result:
                                                    e.target.value
                                            })
                                        )
                                }
                            />

                        </Form.Group>


                        <Form.Group className="mb-3">

                            <Form.Label>

                                Payload (JSON Object)

                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={
                                    executeForm.payload
                                }
                                onChange={
                                    e =>
                                        setExecuteForm(
                                            previous => ({
                                                ...previous,

                                                payload:
                                                    e.target.value
                                            })
                                        )
                                }
                            />

                        </Form.Group>

                    </Form>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowExecute(
                                false
                            )
                        }
                    >

                        Cancel

                    </Button>


                    <Button
                        variant="primary"
                        disabled={
                            saving
                        }
                        onClick={
                            executeRoute
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : "Execute"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                REPORT
            ===================================================== */}

            <Modal
                show={
                    showReport
                }
                onHide={() =>
                    setShowReport(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Route Report

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <DataTable
                        columns={
                            reportColumns
                        }
                        data={
                            reportData
                        }
                        loading={
                            loading
                        }
                        emptyMessage=
                            "No Route Report Data Found"
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowReport(
                                false
                            )
                        }
                    >

                        Close

                    </Button>

                </Modal.Footer>

            </Modal>

        </div>
</>

    );

}


export default RouteStationMaster;