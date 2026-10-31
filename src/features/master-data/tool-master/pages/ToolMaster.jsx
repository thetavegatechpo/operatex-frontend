
// src/pages/ToolMaster/ToolMaster.jsx

import React, { useEffect, useMemo, useState } from "react";

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

import { Plus } from "react-bootstrap-icons";

import SearchToolbar from "../../../../shared/components/SearchToolbar.jsx";
import DataTable from "../../../../shared/components/DataTable.jsx";
import StatusBadge from "../../../../shared/components/StatusBadge.jsx";
import ActionButtons from "../../../../shared/components/ActionButtons.jsx";

import toolService from "../api/tool.service.js";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import plantShopService from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";
import lineService from "../../../enterprise-setup/line-master/api/line.service.js";
import machineService from "../../machine-master/api/machine.service.js";
import routeStationService from "../../route-station-master/api/routeStation.service.js";

import "./ToolMaster.css";


// ==========================================================
// CONSTANTS
// ==========================================================

const TOOL_STATUS = [
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
    "RETIRED"
];

const LIFE_TRACKING_MODES = [
    "NONE",
    "CYCLE",
    "TIME",
    "DISTANCE",
    "WEAR_VALUE"
];

const USAGE_RESULTS = [
    "OK",
    "NOK",
    "WARNING"
];

const EVENT_TYPES = [
    "USAGE",
    "REPLACEMENT"
];


// ==========================================================
// HELPERS
// ==========================================================

const sameId = (left, right) => {

    return String(
        left ?? ""
    ) === String(
        right ?? ""
    );

};


const responseRows = response => {

    if (
        Array.isArray(response)
    ) {
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


// ==========================================================
// COMPONENT
// ==========================================================

function ToolMaster() {

    // ======================================================
    // DATA
    // ======================================================

    const [tools, setTools] = useState([]);

    const [
        lifeConfigs,
        setLifeConfigs
    ] = useState([]);

    const [
        calibrationConfigs,
        setCalibrationConfigs
    ] = useState([]);

    const [
        companies,
        setCompanies
    ] = useState([]);

    const [
        plants,
        setPlants
    ] = useState([]);

    const [
        lines,
        setLines
    ] = useState([]);

    const [
        stations,
        setStations
    ] = useState([]);

    const [
        machines,
        setMachines
    ] = useState([]);

    const [
        routeSteps,
        setRouteSteps
    ] = useState([]);

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
        showForm,
        setShowForm
    ] = useState(false);

    const [
        showLifeConfig,
        setShowLifeConfig
    ] = useState(false);

    const [
        showLifeForm,
        setShowLifeForm
    ] = useState(false);

    const [
        showCalibrationConfig,
        setShowCalibrationConfig
    ] = useState(false);

    const [
        showCalibrationForm,
        setShowCalibrationForm
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
        editId,
        setEditId
    ] = useState(null);

    const [
        lifeEditId,
        setLifeEditId
    ] = useState(null);

    const [
        calibrationEditId,
        setCalibrationEditId
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

    const toolInitialState = {

        company_id: "",
        plant_id: "",
        line_id: "",
        station_id: "",
        machine_id: "",

        tool_code: "",
        tool_name: "",
        tool_type: "",

        make: "",
        model: "",
        serial_number: "",
        protocol: "",
        ip_address: "",

        calibration_required: false,

        life_tracking_mode: "NONE",

        status: "ACTIVE"

    };


    const lifeInitialState = {

        config_type: "LIFE",

        tool_id: "",

        life_source: "",

        max_life_count: "",

        warning_percent: 80,

        reset_on_replacement: true,

        calculation_expression: "",

        effective_from: "",

        effective_to: "",

        is_active: true

    };


    const calibrationInitialState = {

        config_type: "CALIBRATION",

        tool_id: "",

        frequency_days: "",

        frequency_cycles: "",

        last_calibration_date: "",

        next_due_date: "",

        tolerance_min: "",

        tolerance_max: "",

        unit: "",

        certificate_required: true,

        is_active: true

    };


    const executeInitialState = {

        tool_id: "",

        event_type: "USAGE",

        line_id: "",

        machine_id: "",

        route_step_id: "",

        unit_id: "",

        usage_count: 1,

        cumulative_count: "",

        result: "OK",

        value_payload: "{}",

        old_serial_number: "",

        new_serial_number: "",

        replacement_reason: "",

        replaced_by: "",

        usage_at_replacement: "",

        event_ts: "",

        correlation_id: "",

        idempotency_key: "",

        source_system: "OPERATEX",

        payload: "{}"

    };


    // ======================================================
    // FORM STATES
    // ======================================================

    const [
        formData,
        setFormData
    ] = useState(
        toolInitialState
    );

    const [
        lifeForm,
        setLifeForm
    ] = useState(
        lifeInitialState
    );

    const [
        calibrationForm,
        setCalibrationForm
    ] = useState(
        calibrationInitialState
    );

    const [
        executeForm,
        setExecuteForm
    ] = useState(
        executeInitialState
    );


    // ======================================================
    // ERROR MESSAGE
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


    // ======================================================
    // JSON
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
    // DATE
    // ======================================================

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


    const formatDateTime = value => {

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
            return value;
        }


        return date.toLocaleString();

    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadInitialData();

        // eslint-disable-next-line
    }, []);


    const loadInitialData =
        async () => {

            try {

                setLoading(true);


                const results =
                    await Promise.allSettled([

                        loadTools(),

                        loadLifeConfigs(),

                        loadCalibrationConfigs(),

                        loadCompanies(),

                        loadPlants(),

                        loadLines(),

                        loadStations(),

                        loadMachines(),

                        loadRouteSteps()

                    ]);


                const names = [

                    "Tool Master",

                    "Tool Life",

                    "Tool Calibration",

                    "Company",

                    "Plant",

                    "Line",

                    "Station",

                    "Machine",

                    "Route Step"

                ];


                results.forEach(
                    (
                        result,
                        index
                    ) => {

                        if (
                            result.status ===
                            "rejected"
                        ) {

                            console.error(
                                `${names[index]} load failed:`,
                                result.reason
                            );

                        }

                    }
                );

            }

            catch (error) {

                console.error(
                    "Tool Master Initial Load Error:",
                    error
                );

            }

            finally {

                setLoading(false);

            }

        };


    // ======================================================
    // COMPANY
    // ======================================================

    const loadCompanies =
        async () => {

            try {

                const response =
                    await companyService
                        .getMaster();


                setCompanies(
                    responseRows(
                        response
                    )
                );

            }

            catch (error) {

                console.error(
                    "Company Load Error:",
                    error?.response?.data ||
                    error
                );

                setCompanies([]);

            }

        };


    // ======================================================
    // PLANT
    // ======================================================

    const loadPlants =
        async () => {

            try {

                const response =
                    await plantShopService
                        .getMaster();


                const data =
                    responseRows(
                        response
                    );


                const uniquePlants = [

                    ...new Map(

                        data

                            .filter(
                                item =>
                                    item?.plant_id
                            )

                            .map(
                                item => [

                                    String(
                                        item.plant_id
                                    ),

                                    item

                                ]
                            )

                    ).values()

                ];


                console.log(
                    "TOOL MASTER PLANTS:",
                    uniquePlants
                );


                setPlants(
                    uniquePlants
                );

            }

            catch (error) {

                console.error(
                    "Plant Load Error:",
                    error?.response?.data ||
                    error
                );

                setPlants([]);

            }

        };


    // ======================================================
    // LINE
    // ======================================================

    const loadLines =
        async () => {

            try {

                const response =
                    await lineService
                        .getMaster();


                setLines(
                    responseRows(
                        response
                    )
                );

            }

            catch (error) {

                console.error(
                    "Line Load Error:",
                    error?.response?.data ||
                    error
                );

                setLines([]);

            }

        };


    // ======================================================
    // MACHINE
    //
    // IMPORTANT:
    // MACHINE IS OPTIONAL IN TOOL MASTER.
    //
    // IF MACHINE MASTER RETURNS 400,
    // TOOL MASTER MUST STILL WORK.
    // ======================================================

    const loadMachines =
        async () => {

            try {

                const response =
                    await machineService
                        .getMaster();


                const data =
                    responseRows(
                        response
                    );


                console.log(
                    "TOOL MASTER MACHINES:",
                    data
                );


                setMachines(
                    data
                );

            }

            catch (error) {

                console.error(
                    "Machine Master API Error:",
                    {
                        status:
                            error?.response?.status,

                        url:
                            error?.config?.url,

                        method:
                            error?.config?.method,

                        response:
                            error?.response?.data
                    }
                );


                setMachines([]);


                showToast(

                    error?.response?.data?.message ||

                    "Machine lookup unavailable. Machine is optional.",

                    "warning"

                );


                // IMPORTANT:
                // DO NOT THROW ERROR HERE.

            }

        };


    // ======================================================
    // STATION
    // ======================================================

    const loadStations =
        async () => {

            try {

                const response =
                    await routeStationService
                        .getStations();


                const data =
                    responseRows(
                        response
                    );


                console.log(
                    "TOOL MASTER STATIONS:",
                    data
                );


                setStations(
                    data
                );

            }

            catch (error) {

                console.error(
                    "Station Load Error:",
                    error?.response?.data ||
                    error
                );

                setStations([]);

            }

        };


    // ======================================================
    // ROUTE STEP
    // ======================================================

    const loadRouteSteps =
        async () => {

            try {

                const response =
                    await routeStationService
                        .getSteps();


                const data =
                    responseRows(
                        response
                    );


                setRouteSteps(
                    data
                );

            }

            catch (error) {

                console.error(
                    "Route Step Load Error:",
                    error?.response?.data ||
                    error
                );

                setRouteSteps([]);

            }

        };


    // ======================================================
    // TOOL MASTER LOAD
    // ======================================================

    const loadTools =
        async () => {

            try {

                const response =
                    await toolService
                        .getMaster();


                setTools(
                    responseRows(
                        response
                    )
                );

            }

            catch (error) {

                console.error(
                    "Tool Master Load Error:",
                    error?.response?.data ||
                    error
                );


                setTools([]);


                showToast(

                    getErrorMessage(
                        error,
                        "Unable to load Tool Master."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // LIFE CONFIG LOAD
    // ======================================================

    const loadLifeConfigs =
        async () => {

            try {

                const response =
                    await toolService
                        .getLifeConfig();


                setLifeConfigs(
                    responseRows(
                        response
                    )
                );

            }

            catch (error) {

                console.error(
                    "Life Config Load Error:",
                    error?.response?.data ||
                    error
                );

                setLifeConfigs([]);

            }

        };


    // ======================================================
    // CALIBRATION CONFIG LOAD
    // ======================================================

    const loadCalibrationConfigs =
        async () => {

            try {

                const response =
                    await toolService
                        .getCalibrationConfig();


                setCalibrationConfigs(
                    responseRows(
                        response
                    )
                );

            }

            catch (error) {

                console.error(
                    "Calibration Config Load Error:",
                    error?.response?.data ||
                    error
                );

                setCalibrationConfigs([]);

            }

        };


    // ======================================================
    // AVAILABLE PLANTS
    // ======================================================

    const availablePlants =
        useMemo(() => {

            if (
                !formData.company_id
            ) {

                return plants;

            }


            return plants.filter(
                plant => {

                    return (

                        !plant.company_id ||

                        sameId(
                            plant.company_id,
                            formData.company_id
                        )

                    );

                }
            );

        }, [
            plants,
            formData.company_id
        ]);


    // ======================================================
    // AVAILABLE LINES
    // ======================================================

    const availableLines =
        useMemo(() => {

            if (
                !formData.plant_id
            ) {

                return [];

            }


            return lines.filter(
                line => {

                    const companyMatch =

                        !line.company_id ||

                        sameId(
                            line.company_id,
                            formData.company_id
                        );


                    const plantMatch =

                        !line.plant_id ||

                        sameId(
                            line.plant_id,
                            formData.plant_id
                        );


                    return (
                        companyMatch &&
                        plantMatch
                    );

                }
            );

        }, [
            lines,
            formData.company_id,
            formData.plant_id
        ]);


    // ======================================================
    // AVAILABLE STATIONS
    // ======================================================

    const availableStations =
        useMemo(() => {

            if (
                !formData.line_id
            ) {

                return [];

            }


            return stations.filter(
                station => {

                    const companyMatch =

                        !station.company_id ||

                        sameId(
                            station.company_id,
                            formData.company_id
                        );


                    const plantMatch =

                        !station.plant_id ||

                        sameId(
                            station.plant_id,
                            formData.plant_id
                        );


                    const lineMatch =

                        !station.line_id ||

                        sameId(
                            station.line_id,
                            formData.line_id
                        );


                    return (
                        companyMatch &&
                        plantMatch &&
                        lineMatch
                    );

                }
            );

        }, [
            stations,
            formData.company_id,
            formData.plant_id,
            formData.line_id
        ]);


    // ======================================================
    // AVAILABLE MACHINES
    // ======================================================

    const availableMachines =
        useMemo(() => {

            if (
                !formData.line_id
            ) {

                return [];

            }


            return machines.filter(
                machine => {

                    const companyMatch =

                        !machine.company_id ||

                        sameId(
                            machine.company_id,
                            formData.company_id
                        );


                    const plantMatch =

                        !machine.plant_id ||

                        sameId(
                            machine.plant_id,
                            formData.plant_id
                        );


                    const lineMatch =

                        !machine.line_id ||

                        sameId(
                            machine.line_id,
                            formData.line_id
                        );


                    return (
                        companyMatch &&
                        plantMatch &&
                        lineMatch
                    );

                }
            );

        }, [
            machines,
            formData.company_id,
            formData.plant_id,
            formData.line_id
        ]);


    // ======================================================
    // MASTER CHANGE
    // ======================================================

    const handleChange =
        event => {

            const {
                name,
                value
            } = event.target;


            setFormData(
                previous => ({
                    ...previous,
                    [name]:
                        value
                })
            );

        };


    // ======================================================
    // RESET MASTER
    // ======================================================

    const resetForm = () => {

        setEditId(
            null
        );

        setFormData(
            toolInitialState
        );

    };


    // ======================================================
    // ADD MASTER
    // ======================================================

    const openAddModal = () => {

        resetForm();

        setShowForm(
            true
        );

    };


    // ======================================================
    // EDIT MASTER
    // ======================================================

    const openEditModal =
        tool => {

            setEditId(
                tool.tool_id
            );


            setFormData({

                company_id:
                    tool.company_id || "",

                plant_id:
                    tool.plant_id || "",

                line_id:
                    tool.line_id || "",

                station_id:
                    tool.station_id || "",

                machine_id:
                    tool.machine_id || "",

                tool_code:
                    tool.tool_code || "",

                tool_name:
                    tool.tool_name || "",

                tool_type:
                    tool.tool_type || "",

                make:
                    tool.make || "",

                model:
                    tool.model || "",

                serial_number:
                    tool.serial_number || "",

                protocol:
                    tool.protocol || "",

                ip_address:
                    tool.ip_address || "",

                calibration_required:
                    Boolean(
                        tool.calibration_required
                    ),

                life_tracking_mode:
                    tool.life_tracking_mode ||
                    "NONE",

                status:
                    tool.status ||
                    "ACTIVE"

            });


            setShowForm(
                true
            );

        };


    // ======================================================
    // SAVE TOOL
    // ======================================================

    const saveTool =
        async () => {

            try {

                if (
                    !formData.company_id ||
                    !formData.plant_id ||
                    !formData.tool_code.trim() ||
                    !formData.tool_name.trim() ||
                    !formData.tool_type.trim()
                ) {

                    showToast(
                        "Company, Plant, Tool Code, Tool Name and Tool Type are required.",
                        "danger"
                    );

                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    company_id:
                        formData.company_id,

                    plant_id:
                        formData.plant_id,

                    line_id:
                        formData.line_id ||
                        null,

                    station_id:
                        formData.station_id ||
                        null,

                    machine_id:
                        formData.machine_id ||
                        null,

                    tool_code:
                        formData.tool_code
                            .trim(),

                    tool_name:
                        formData.tool_name
                            .trim(),

                    tool_type:
                        formData.tool_type
                            .trim(),

                    make:
                        formData.make
                            .trim() ||
                        null,

                    model:
                        formData.model
                            .trim() ||
                        null,

                    serial_number:
                        formData.serial_number
                            .trim() ||
                        null,

                    protocol:
                        formData.protocol
                            .trim() ||
                        null,

                    ip_address:
                        formData.ip_address
                            .trim() ||
                        null,

                    calibration_required:
                        Boolean(
                            formData.calibration_required
                        ),

                    life_tracking_mode:
                        String(
                            formData.life_tracking_mode
                        )
                            .toUpperCase(),

                    status:
                        String(
                            formData.status
                        )
                            .toUpperCase()

                };


                if (
                    editId
                ) {

                    await toolService
                        .updateMaster(
                            editId,
                            payload
                        );


                    showToast(
                        "Tool updated successfully."
                    );

                }

                else {

                    await toolService
                        .createMaster(
                            payload
                        );


                    showToast(
                        "Tool created successfully."
                    );

                }


                setShowForm(
                    false
                );


                resetForm();


                await loadTools();

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Tool."
                    ),

                    "danger"

                );

            }

            finally {

                setSaving(
                    false
                );

            }

        };


    // ======================================================
    // DELETE TOOL
    // ======================================================

    const deleteTool =
        async tool => {

            if (
                !window.confirm(
                    `Deactivate tool "${tool.tool_name}"?`
                )
            ) {

                return;

            }


            try {

                await toolService
                    .deleteMaster(
                        tool.tool_id
                    );


                showToast(
                    "Tool deactivated successfully."
                );


                await loadTools();

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Tool."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // LIFE ADD
    // ======================================================

    const openAddLife = () => {

        setLifeEditId(
            null
        );

        setLifeForm(
            lifeInitialState
        );

        setShowLifeConfig(
            false
        );

        setShowLifeForm(
            true
        );

    };


    // ======================================================
    // LIFE EDIT
    // ======================================================

    const openEditLife =
        life => {

            setLifeEditId(
                life.tool_life_id
            );


            setLifeForm({

                config_type:
                    "LIFE",

                tool_id:
                    life.tool_id || "",

                life_source:
                    life.life_source || "",

                max_life_count:
                    life.max_life_count ?? "",

                warning_percent:
                    life.warning_percent ?? 80,

                reset_on_replacement:
                    life.reset_on_replacement !== false,

                calculation_expression:
                    life.calculation_expression || "",

                effective_from:
                    toDateTimeInput(
                        life.effective_from
                    ),

                effective_to:
                    toDateTimeInput(
                        life.effective_to
                    ),

                is_active:
                    life.is_active !== false

            });


            setShowLifeConfig(
                false
            );

            setShowLifeForm(
                true
            );

        };


    // ======================================================
    // SAVE LIFE
    // ======================================================

    const saveLife =
        async () => {

            try {

                if (
                    !lifeForm.tool_id ||
                    !lifeForm.life_source.trim() ||
                    lifeForm.max_life_count === ""
                ) {

                    showToast(
                        "Tool, Life Source and Max Life Count are required.",
                        "danger"
                    );

                    return;

                }


                if (
                    Number(
                        lifeForm.max_life_count
                    ) <= 0
                ) {

                    showToast(
                        "Max Life Count must be greater than 0.",
                        "danger"
                    );

                    return;

                }


                if (
                    lifeForm.warning_percent !== "" &&
                    (
                        Number(
                            lifeForm.warning_percent
                        ) < 0 ||
                        Number(
                            lifeForm.warning_percent
                        ) > 100
                    )
                ) {

                    showToast(
                        "Warning Percent must be between 0 and 100.",
                        "danger"
                    );

                    return;

                }


                if (
                    lifeForm.effective_from &&
                    lifeForm.effective_to &&
                    new Date(
                        lifeForm.effective_to
                    ) <
                    new Date(
                        lifeForm.effective_from
                    )
                ) {

                    showToast(
                        "Effective To cannot be before Effective From.",
                        "danger"
                    );

                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    config_type:
                        "LIFE",

                    tool_id:
                        lifeForm.tool_id,

                    life_source:
                        lifeForm.life_source
                            .trim(),

                    max_life_count:
                        Number(
                            lifeForm.max_life_count
                        ),

                    warning_percent:
                        lifeForm.warning_percent === ""

                            ? 80

                            : Number(
                                lifeForm.warning_percent
                            ),

                    reset_on_replacement:
                        Boolean(
                            lifeForm.reset_on_replacement
                        ),

                    calculation_expression:
                        lifeForm.calculation_expression
                            .trim() ||
                        null,

                    effective_from:
                        lifeForm.effective_from ||
                        null,

                    effective_to:
                        lifeForm.effective_to ||
                        null,

                    is_active:
                        Boolean(
                            lifeForm.is_active
                        )

                };


                if (
                    lifeEditId
                ) {

                    delete payload.config_type;


                    await toolService
                        .updateConfig(
                            "LIFE",
                            lifeEditId,
                            payload
                        );


                    showToast(
                        "Tool Life configuration updated successfully."
                    );

                }

                else {

                    await toolService
                        .createConfig(
                            payload
                        );


                    showToast(
                        "Tool Life configuration created successfully."
                    );

                }


                setLifeEditId(
                    null
                );

                setLifeForm(
                    lifeInitialState
                );

                setShowLifeForm(
                    false
                );


                await loadLifeConfigs();


                setShowLifeConfig(
                    true
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Tool Life configuration."
                    ),

                    "danger"

                );

            }

            finally {

                setSaving(
                    false
                );

            }

        };


    // ======================================================
    // DELETE LIFE
    // ======================================================

    const deleteLife =
        async life => {

            if (
                !window.confirm(
                    `Deactivate Tool Life configuration for "${life.tool_name || life.tool_code}"?`
                )
            ) {

                return;

            }


            try {

                await toolService
                    .deleteConfig(
                        "LIFE",
                        life.tool_life_id
                    );


                showToast(
                    "Tool Life configuration deactivated successfully."
                );


                await loadLifeConfigs();

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Tool Life configuration."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // CALIBRATION ADD
    // ======================================================

    const openAddCalibration = () => {

        setCalibrationEditId(
            null
        );

        setCalibrationForm(
            calibrationInitialState
        );

        setShowCalibrationConfig(
            false
        );

        setShowCalibrationForm(
            true
        );

    };


    // ======================================================
    // CALIBRATION EDIT
    // ======================================================

    const openEditCalibration =
        calibration => {

            setCalibrationEditId(
                calibration.tool_calibration_id
            );


            setCalibrationForm({

                config_type:
                    "CALIBRATION",

                tool_id:
                    calibration.tool_id || "",

                frequency_days:
                    calibration.frequency_days ?? "",

                frequency_cycles:
                    calibration.frequency_cycles ?? "",

                last_calibration_date:
                    toDateInput(
                        calibration.last_calibration_date
                    ),

                next_due_date:
                    toDateInput(
                        calibration.next_due_date
                    ),

                tolerance_min:
                    calibration.tolerance_min ?? "",

                tolerance_max:
                    calibration.tolerance_max ?? "",

                unit:
                    calibration.unit || "",

                certificate_required:
                    calibration.certificate_required !== false,

                is_active:
                    calibration.is_active !== false

            });


            setShowCalibrationConfig(
                false
            );

            setShowCalibrationForm(
                true
            );

        };


    // ======================================================
    // SAVE CALIBRATION
    // ======================================================

    const saveCalibration =
        async () => {

            try {

                if (
                    !calibrationForm.tool_id
                ) {

                    showToast(
                        "Tool is required.",
                        "danger"
                    );

                    return;

                }


                if (
                    calibrationForm.frequency_days !== "" &&
                    Number(
                        calibrationForm.frequency_days
                    ) <= 0
                ) {

                    showToast(
                        "Frequency Days must be greater than 0.",
                        "danger"
                    );

                    return;

                }


                if (
                    calibrationForm.frequency_cycles !== "" &&
                    Number(
                        calibrationForm.frequency_cycles
                    ) <= 0
                ) {

                    showToast(
                        "Frequency Cycles must be greater than 0.",
                        "danger"
                    );

                    return;

                }


                if (
                    calibrationForm.tolerance_min !== "" &&
                    calibrationForm.tolerance_max !== "" &&
                    Number(
                        calibrationForm.tolerance_max
                    ) <
                    Number(
                        calibrationForm.tolerance_min
                    )
                ) {

                    showToast(
                        "Tolerance Max must not be below Tolerance Min.",
                        "danger"
                    );

                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    config_type:
                        "CALIBRATION",

                    tool_id:
                        calibrationForm.tool_id,

                    frequency_days:
                        calibrationForm.frequency_days === ""

                            ? null

                            : Number(
                                calibrationForm.frequency_days
                            ),

                    frequency_cycles:
                        calibrationForm.frequency_cycles === ""

                            ? null

                            : Number(
                                calibrationForm.frequency_cycles
                            ),

                    last_calibration_date:
                        calibrationForm.last_calibration_date ||
                        null,

                    next_due_date:
                        calibrationForm.next_due_date ||
                        null,

                    tolerance_min:
                        calibrationForm.tolerance_min === ""

                            ? null

                            : Number(
                                calibrationForm.tolerance_min
                            ),

                    tolerance_max:
                        calibrationForm.tolerance_max === ""

                            ? null

                            : Number(
                                calibrationForm.tolerance_max
                            ),

                    unit:
                        calibrationForm.unit
                            .trim() ||
                        null,

                    certificate_required:
                        Boolean(
                            calibrationForm.certificate_required
                        ),

                    is_active:
                        Boolean(
                            calibrationForm.is_active
                        )

                };


                if (
                    calibrationEditId
                ) {

                    delete payload.config_type;


                    await toolService
                        .updateConfig(
                            "CALIBRATION",
                            calibrationEditId,
                            payload
                        );


                    showToast(
                        "Calibration configuration updated successfully."
                    );

                }

                else {

                    await toolService
                        .createConfig(
                            payload
                        );


                    showToast(
                        "Calibration configuration created successfully."
                    );

                }


                setCalibrationEditId(
                    null
                );

                setCalibrationForm(
                    calibrationInitialState
                );

                setShowCalibrationForm(
                    false
                );


                await loadCalibrationConfigs();


                setShowCalibrationConfig(
                    true
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Calibration configuration."
                    ),

                    "danger"

                );

            }

            finally {

                setSaving(
                    false
                );

            }

        };


    // ======================================================
    // DELETE CALIBRATION
    // ======================================================

    const deleteCalibration =
        async calibration => {

            if (
                !window.confirm(
                    `Deactivate calibration configuration for "${calibration.tool_name || calibration.tool_code}"?`
                )
            ) {

                return;

            }


            try {

                await toolService
                    .deleteConfig(
                        "CALIBRATION",
                        calibration.tool_calibration_id
                    );


                showToast(
                    "Calibration configuration deactivated successfully."
                );


                await loadCalibrationConfigs();

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Calibration configuration."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // SELECTED EXECUTE TOOL
    // ======================================================

    const selectedExecuteTool =
        useMemo(
            () =>

                tools.find(
                    tool =>
                        sameId(
                            tool.tool_id,
                            executeForm.tool_id
                        )
                ),

            [
                tools,
                executeForm.tool_id
            ]
        );


    // ======================================================
    // EXECUTE LINES
    // ======================================================

    const executeLines =
        useMemo(() => {

            if (
                !selectedExecuteTool
            ) {

                return [];

            }


            return lines.filter(
                line => {

                    const companyMatch =

                        !line.company_id ||

                        sameId(
                            line.company_id,
                            selectedExecuteTool.company_id
                        );


                    const plantMatch =

                        !line.plant_id ||

                        sameId(
                            line.plant_id,
                            selectedExecuteTool.plant_id
                        );


                    return (
                        companyMatch &&
                        plantMatch
                    );

                }
            );

        }, [
            lines,
            selectedExecuteTool
        ]);


    // ======================================================
    // EXECUTE MACHINES
    // ======================================================

    const executeMachines =
        useMemo(() => {

            if (
                !selectedExecuteTool
            ) {

                return [];

            }


            return machines.filter(
                machine => {

                    const companyMatch =

                        !machine.company_id ||

                        sameId(
                            machine.company_id,
                            selectedExecuteTool.company_id
                        );


                    const plantMatch =

                        !machine.plant_id ||

                        sameId(
                            machine.plant_id,
                            selectedExecuteTool.plant_id
                        );


                    const lineMatch =

                        !executeForm.line_id ||

                        !machine.line_id ||

                        sameId(
                            machine.line_id,
                            executeForm.line_id
                        );


                    return (
                        companyMatch &&
                        plantMatch &&
                        lineMatch
                    );

                }
            );

        }, [
            machines,
            selectedExecuteTool,
            executeForm.line_id
        ]);


    // ======================================================
    // EXECUTE ROUTE STEPS
    // ======================================================

    const executeRouteSteps =
        useMemo(() => {

            if (
                !selectedExecuteTool
            ) {

                return [];

            }


            return routeSteps.filter(
                step => {

                    const companyMatch =

                        !step.company_id ||

                        sameId(
                            step.company_id,
                            selectedExecuteTool.company_id
                        );


                    const stationMatch =

                        !selectedExecuteTool.station_id ||

                        !step.station_id ||

                        sameId(
                            step.station_id,
                            selectedExecuteTool.station_id
                        );


                    return (
                        companyMatch &&
                        stationMatch
                    );

                }
            );

        }, [
            routeSteps,
            selectedExecuteTool
        ]);


    // ======================================================
    // OPEN EXECUTE
    // ======================================================

    const openExecute = () => {

        setExecuteForm(
            executeInitialState
        );

        setShowExecute(
            true
        );

    };


    // ======================================================
    // EXECUTE TOOL
    // ======================================================

    const executeTool =
        async () => {

            try {

                if (
                    !executeForm.tool_id ||
                    !executeForm.event_type
                ) {

                    showToast(
                        "Tool and Event Type are required.",
                        "danger"
                    );

                    return;

                }


                if (
                    executeForm.event_type ===
                    "REPLACEMENT" &&
                    !executeForm.replacement_reason
                        .trim()
                ) {

                    showToast(
                        "Replacement Reason is required.",
                        "danger"
                    );

                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    tool_id:
                        executeForm.tool_id,

                    event_type:
                        executeForm.event_type,

                    line_id:
                        executeForm.line_id ||
                        null,

                    machine_id:
                        executeForm.machine_id ||
                        null,

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


                if (
                    executeForm.event_type ===
                    "USAGE"
                ) {

                    payload.route_step_id =
                        executeForm.route_step_id ||
                        null;


                    payload.unit_id =
                        executeForm.unit_id
                            .trim() ||
                        null;


                    payload.usage_count =
                        executeForm.usage_count === ""

                            ? 1

                            : Number(
                                executeForm.usage_count
                            );


                    payload.cumulative_count =
                        executeForm.cumulative_count === ""

                            ? null

                            : Number(
                                executeForm.cumulative_count
                            );


                    payload.result =
                        executeForm.result ||
                        null;


                    payload.value_payload =
                        parseJsonObject(
                            executeForm.value_payload,
                            "Value Payload"
                        );

                }


                if (
                    executeForm.event_type ===
                    "REPLACEMENT"
                ) {

                    payload.old_serial_number =
                        executeForm.old_serial_number
                            .trim() ||
                        null;


                    payload.new_serial_number =
                        executeForm.new_serial_number
                            .trim() ||
                        null;


                    payload.replacement_reason =
                        executeForm.replacement_reason
                            .trim();


                    payload.replaced_by =
                        executeForm.replaced_by === ""

                            ? null

                            : Number(
                                executeForm.replaced_by
                            );


                    payload.usage_at_replacement =
                        executeForm.usage_at_replacement === ""

                            ? null

                            : Number(
                                executeForm.usage_at_replacement
                            );

                }


                const response =
                    await toolService
                        .execute(
                            payload
                        );


                showToast(

                    response?.data?.message ||

                    "Tool event created successfully."

                );


                setExecuteForm(
                    executeInitialState
                );


                setShowExecute(
                    false
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to execute Tool Event."
                    ),

                    "danger"

                );

            }

            finally {

                setSaving(
                    false
                );

            }

        };


    // ======================================================
    // RUNTIME
    // ======================================================

    const loadRuntime =
        async () => {

            try {

                setLoading(
                    true
                );


                const response =
                    await toolService
                        .getRuntime();


                setRuntimeData(
                    responseRows(
                        response
                    )
                );


                setShowRuntime(
                    true
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to load Tool Runtime."
                    ),

                    "danger"

                );

            }

            finally {

                setLoading(
                    false
                );

            }

        };


    // ======================================================
    // REPORT
    // ======================================================

    const loadReport =
        async () => {

            try {

                setLoading(
                    true
                );


                const response =
                    await toolService
                        .getReport({

                            status:
                                statusFilter ===
                                "ALL"

                                    ? ""

                                    : statusFilter

                        });


                setReportData(
                    responseRows(
                        response
                    )
                );


                setShowReport(
                    true
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to generate Tool Report."
                    ),

                    "danger"

                );

            }

            finally {

                setLoading(
                    false
                );

            }

        };


    // ======================================================
    // EXPORT
    // ======================================================

    const exportTool =
        async () => {

            try {

                const response =
                    await toolService
                        .exportData({

                            format:
                                "CSV",

                            status:
                                statusFilter ===
                                "ALL"

                                    ? ""

                                    : statusFilter

                        });


                const rows =
                    responseRows(
                        response
                    );


                const columns = [

                    ["company_name", "Company"],

                    ["plant_name", "Plant"],

                    ["line_name", "Line"],

                    ["station_name", "Station"],

                    ["machine_name", "Machine"],

                    ["tool_code", "Tool Code"],

                    ["tool_name", "Tool Name"],

                    ["tool_type", "Tool Type"],

                    ["make", "Make"],

                    ["model", "Model"],

                    ["serial_number", "Serial Number"],

                    ["protocol", "Protocol"],

                    ["life_tracking_mode", "Life Mode"],

                    ["max_life_count", "Max Life"],

                    ["current_usage", "Current Usage"],

                    ["life_used_percent", "Life Used %"],

                    ["warning_percent", "Warning %"],

                    ["total_usage_events", "Usage Events"],

                    ["total_replacements", "Replacements"],

                    ["next_due_date", "Calibration Due"],

                    ["status", "Status"]

                ];


                const escapeCsv =
                    value => {

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
                                escapeCsv(
                                    label
                                )
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
                    document
                        .createElement(
                            "a"
                        );


                link.href =
                    url;


                link.download =
                    "Tool_Master.csv";


                document.body
                    .appendChild(
                        link
                    );


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
    // FILTER TOOLS
    // ======================================================

    const filteredTools =
        tools.filter(
            tool => {

                const search =
                    searchText
                        .trim()
                        .toLowerCase();


                const values = [

                    tool.tool_code,

                    tool.tool_name,

                    tool.tool_type,

                    tool.company_name,

                    tool.plant_name,

                    tool.line_name,

                    tool.station_name,

                    tool.machine_name,

                    tool.serial_number

                ];


                const searchMatch =

                    !search ||

                    values.some(
                        value =>

                            String(
                                value || ""
                            )
                                .toLowerCase()
                                .includes(
                                    search
                                )
                    );


                const statusMatch =

                    statusFilter ===
                    "ALL" ||

                    tool.status ===
                    statusFilter;


                return (
                    searchMatch &&
                    statusMatch
                );

            }
        );


    // ======================================================
    // TOOL COLUMNS
    // ======================================================

    const toolColumns = [

        {
            key: "tool_code",
            label: "Tool Code"
        },

        {
            key: "tool_name",
            label: "Tool Name"
        },

        {
            key: "tool_type",
            label: "Tool Type"
        },

        {
            key: "company_name",
            label: "Company"
        },

        {
            key: "plant_name",
            label: "Plant"
        },

        {
            key: "line_name",
            label: "Line"
        },

        {
            key: "station_name",
            label: "Station"
        },

        {
            key: "machine_name",
            label: "Machine"
        },

        {
            key: "life_tracking_mode",
            label: "Life Mode"
        },

        {
            key:
                "calibration_required",

            label:
                "Calibration",

            render:
                row => (

                    <Badge
                        bg={
                            row.calibration_required
                                ? "primary"
                                : "secondary"
                        }
                    >

                        {
                            row.calibration_required
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key: "status",
            label: "Status",

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
    // LIFE COLUMNS
    // ======================================================

    const lifeColumns = [

        {
            key: "tool_code",
            label: "Tool Code"
        },

        {
            key: "tool_name",
            label: "Tool Name"
        },

        {
            key: "life_source",
            label: "Life Source"
        },

        {
            key: "max_life_count",
            label: "Max Life"
        },

        {
            key: "warning_percent",
            label: "Warning %"
        },

        {
            key:
                "reset_on_replacement",

            label:
                "Reset",

            render:
                row => (

                    <Badge
                        bg={
                            row.reset_on_replacement
                                ? "success"
                                : "secondary"
                        }
                    >

                        {
                            row.reset_on_replacement
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key: "effective_from",
            label: "Effective From",

            render:
                row =>
                    formatDateTime(
                        row.effective_from
                    )
        },

        {
            key: "effective_to",
            label: "Effective To",

            render:
                row =>
                    formatDateTime(
                        row.effective_to
                    )
        },

        {
            key: "is_active",
            label: "Status",

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
    // CALIBRATION COLUMNS
    // ======================================================

    const calibrationColumns = [

        {
            key: "tool_code",
            label: "Tool Code"
        },

        {
            key: "tool_name",
            label: "Tool Name"
        },

        {
            key: "frequency_days",
            label: "Frequency Days"
        },

        {
            key: "frequency_cycles",
            label: "Frequency Cycles"
        },

        {
            key: "last_calibration_date",
            label: "Last Calibration"
        },

        {
            key: "next_due_date",
            label: "Next Due"
        },

        {
            key: "tolerance_min",
            label: "Tolerance Min"
        },

        {
            key: "tolerance_max",
            label: "Tolerance Max"
        },

        {
            key: "unit",
            label: "Unit"
        },

        {
            key:
                "certificate_required",

            label:
                "Certificate",

            render:
                row => (

                    <Badge
                        bg={
                            row.certificate_required
                                ? "primary"
                                : "secondary"
                        }
                    >

                        {
                            row.certificate_required
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key: "is_active",
            label: "Status",

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
            key: "event_category",
            label: "Event"
        },

        {
            key: "tool_code",
            label: "Tool Code"
        },

        {
            key: "tool_name",
            label: "Tool Name"
        },

        {
            key: "usage_count",
            label: "Usage"
        },

        {
            key: "cumulative_count",
            label: "Cumulative"
        },

        {
            key: "result",
            label: "Result",

            render:
                row =>

                    row.result

                        ? (
                            <StatusBadge
                                status={
                                    row.result
                                }
                            />
                        )

                        : "-"
        },

        {
            key: "old_serial_number",
            label: "Old Serial"
        },

        {
            key: "new_serial_number",
            label: "New Serial"
        },

        {
            key: "replacement_reason",
            label: "Replacement Reason"
        },

        {
            key: "replaced_by",
            label: "Replaced By"
        },

        {
            key: "event_ts",
            label: "Event Time",

            render:
                row =>
                    formatDateTime(
                        row.event_ts
                    )
        },

        {
            key: "source_system",
            label: "Source"
        }

    ];


    // ======================================================
    // REPORT COLUMNS
    // ======================================================

    const reportColumns = [

        {
            key: "tool_code",
            label: "Tool Code"
        },

        {
            key: "tool_name",
            label: "Tool Name"
        },

        {
            key: "tool_type",
            label: "Tool Type"
        },

        {
            key: "plant_name",
            label: "Plant"
        },

        {
            key: "line_name",
            label: "Line"
        },

        {
            key: "machine_name",
            label: "Machine"
        },

        {
            key: "life_tracking_mode",
            label: "Life Mode"
        },

        {
            key: "max_life_count",
            label: "Max Life"
        },

        {
            key: "current_usage",
            label: "Current Usage"
        },

        {
            key: "life_used_percent",
            label: "Life Used %",

            render:
                row =>
                    `${
                        Number(
                            row.life_used_percent ||
                            0
                        ).toFixed(2)
                    }%`
        },

        {
            key: "warning_percent",
            label: "Warning %"
        },

        {
            key: "total_usage_events",
            label: "Usage Events"
        },

        {
            key: "total_replacements",
            label: "Replacements"
        },

        {
            key: "next_due_date",
            label: "Calibration Due"
        },

        {
            key: "status",
            label: "Status",

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
    // RENDER
    // ======================================================

    return (

        <>

<div className="tool-master container-fluid">

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
                                Tool Master
                            </h3>

                            <small className="text-muted">
                                Master Data / Tool Master
                            </small>

                        </Col>


                        <Col xs="auto">

                            <div className="d-flex gap-2 flex-wrap">

                                <Button
                                    variant="outline-primary"
                                    onClick={() => {

                                        loadLifeConfigs();

                                        setShowLifeConfig(
                                            true
                                        );

                                    }}
                                >
                                    Life Config
                                </Button>


                                <Button
                                    variant="outline-primary"
                                    onClick={() => {

                                        loadCalibrationConfigs();

                                        setShowCalibrationConfig(
                                            true
                                        );

                                    }}
                                >
                                    Calibration Config
                                </Button>


                                <Button
                                    variant="primary"
                                    onClick={
                                        openAddModal
                                    }
                                >
                                    <Plus /> Add Tool
                                </Button>

                            </div>

                        </Col>

                    </Row>

                </Card.Body>

            </Card>


            {/* =====================================================
                SEARCH
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
                    exportTool
                }
                placeholder="Search Tool..."
            />


            {/* =====================================================
                MASTER TABLE
            ===================================================== */}

            <DataTable
                columns={
                    toolColumns
                }
                data={
                    filteredTools
                }
                loading={
                    loading
                }
                emptyMessage="No Tool Found"
                renderActions={
                    tool => (

                        <ActionButtons
                            onEdit={() =>
                                openEditModal(
                                    tool
                                )
                            }
                            onDelete={() =>
                                deleteTool(
                                    tool
                                )
                            }
                        />

                    )
                }
            />


            {/* =====================================================
                TOOL FORM
            ===================================================== */}

            <Modal
                show={
                    showForm
                }
                onHide={() => {

                    resetForm();

                    setShowForm(
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
                            editId
                                ? "Update Tool"
                                : "Create Tool"
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
                                            formData.company_id
                                        }
                                        disabled={Boolean(editId)}
                                        onChange={
                                            event =>

                                                setFormData(
                                                    previous => ({

                                                        ...previous,

                                                        company_id:
                                                            event.target.value,

                                                        plant_id:
                                                            "",

                                                        line_id:
                                                            "",

                                                        station_id:
                                                            "",

                                                        machine_id:
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
                                        Plant *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            formData.plant_id
                                        }
                                        disabled={
                                             Boolean(editId) ||
                                            !formData.company_id
                                        }
                                        onChange={
                                            event =>

                                                setFormData(
                                                    previous => ({

                                                        ...previous,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id:
                                                            "",

                                                        station_id:
                                                            "",

                                                        machine_id:
                                                            ""

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Plant
                                        </option>


                                        {
                                            availablePlants.map(
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


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Line
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            formData.line_id
                                        }
                                        disabled={  Boolean(editId) ||
                                            !formData.plant_id
                                        }
                                        onChange={
                                            event =>

                                                setFormData(
                                                    previous => ({

                                                        ...previous,

                                                        line_id:
                                                            event.target.value,

                                                        station_id:
                                                            "",

                                                        machine_id:
                                                            ""

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            {
                                                !formData.plant_id
                                                    ? "Select Plant First"
                                                    : "Select Line"
                                            }
                                        </option>


                                        {
                                            availableLines.map(
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

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Station
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            formData.station_id
                                        }
                                        disabled={  Boolean(editId) ||
                                            !formData.line_id
                                        }
                                        onChange={
                                            event =>

                                                setFormData(
                                                    previous => ({

                                                        ...previous,

                                                        station_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            {
                                                !formData.line_id
                                                    ? "Select Line First"
                                                    : "Select Station"
                                            }

                                        </option>


                                        {
                                            availableStations.map(
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


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Machine
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            formData.machine_id
                                        }
                                        disabled={  Boolean(editId) ||
                                            !formData.line_id
                                        }
                                        onChange={
                                            event =>

                                                setFormData(
                                                    previous => ({

                                                        ...previous,

                                                        machine_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">

                                            {
                                                !formData.line_id

                                                    ? "Select Line First"

                                                    : machines.length === 0

                                                        ? "No Machine Available"

                                                        : "Select Machine"
                                            }

                                        </option>


                                        {
                                            availableMachines.map(
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


                                    {
                                        formData.line_id &&
                                        machines.length === 0 && (

                                            <Form.Text className="text-warning">

                                                Machine lookup is unavailable.
                                                Machine is optional.

                                            </Form.Text>

                                        )
                                    }

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Tool Code *
                                    </Form.Label>

                                    <Form.Control
                                        name="tool_code"
                                        value={
                                            formData.tool_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="TOOL-001"
                                        maxLength={75}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Tool Name *
                                    </Form.Label>

                                    <Form.Control
                                        name="tool_name"
                                        value={
                                            formData.tool_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="DC Nutrunner"
                                        maxLength={150}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Tool Type *
                                    </Form.Label>

                                    <Form.Control
                                        name="tool_type"
                                        value={
                                            formData.tool_type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="NUTRUNNER"
                                        maxLength={50}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Make
                                    </Form.Label>

                                    <Form.Control
                                        name="make"
                                        value={
                                            formData.make
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        maxLength={100}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Model
                                    </Form.Label>

                                    <Form.Control
                                        name="model"
                                        value={
                                            formData.model
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        maxLength={100}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Serial Number
                                    </Form.Label>

                                    <Form.Control
                                        name="serial_number"
                                        value={
                                            formData.serial_number
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        maxLength={100}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Protocol
                                    </Form.Label>

                                    <Form.Control
                                        name="protocol"
                                        value={
                                            formData.protocol
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="TCP/IP"
                                        maxLength={50}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        IP Address
                                    </Form.Label>

                                    <Form.Control
                                        name="ip_address"
                                        value={
                                            formData.ip_address
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="192.168.1.100"
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Life Tracking Mode
                                    </Form.Label>

                                    <Form.Select
                                        name="life_tracking_mode"
                                        value={
                                            formData.life_tracking_mode
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        {
                                            LIFE_TRACKING_MODES.map(
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

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Status
                                    </Form.Label>

                                    <Form.Select
                                        name="status"
                                        value={
                                            formData.status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        {
                                            TOOL_STATUS.map(
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


                            <Col md={6}>

                                <Form.Group className="mb-3 mt-4">

                                    <Form.Check
                                        type="checkbox"
                                        label="Calibration Required"
                                        checked={
                                            formData.calibration_required
                                        }
                                        onChange={
                                            event =>

                                                setFormData(
                                                    previous => ({

                                                        ...previous,

                                                        calibration_required:
                                                            event.target.checked

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>

                    </Form>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => {

                            resetForm();

                            setShowForm(
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
                            saveTool
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

                                : editId
                                    ? "Update Tool"
                                    : "Save Tool"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                LIFE CONFIG LIST
            ===================================================== */}

            <Modal
                show={
                    showLifeConfig
                }
                onHide={() =>
                    setShowLifeConfig(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Tool Life Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddLife
                            }
                        >
                            <Plus /> Add Life Config
                        </Button>

                    </div>


                    <DataTable
                        columns={
                            lifeColumns
                        }
                        data={
                            lifeConfigs
                        }
                        loading={
                            loading
                        }
                        emptyMessage="No Tool Life Configuration Found"
                        renderActions={
                            life => (

                                <ActionButtons
                                    onEdit={() =>
                                        openEditLife(
                                            life
                                        )
                                    }
                                    onDelete={() =>
                                        deleteLife(
                                            life
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
                            setShowLifeConfig(
                                false
                            )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                LIFE FORM
            ===================================================== */}

            <Modal
                show={
                    showLifeForm
                }
                onHide={() => {

                    setShowLifeForm(
                        false
                    );

                    setLifeEditId(
                        null
                    );

                    setLifeForm(
                        lifeInitialState
                    );

                    setShowLifeConfig(
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
                            lifeEditId
                                ? "Update Tool Life Configuration"
                                : "Add Tool Life Configuration"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Tool *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            lifeForm.tool_id
                                        }
                                        onChange={
                                            event =>

                                                setLifeForm(
                                                    previous => ({

                                                        ...previous,

                                                        tool_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Tool
                                        </option>


                                        {
                                            tools.map(
                                                tool => (

                                                    <option
                                                        key={
                                                            tool.tool_id
                                                        }
                                                        value={
                                                            tool.tool_id
                                                        }
                                                    >

                                                        {
                                                            tool.tool_code
                                                        }

                                                        {" - "}

                                                        {
                                                            tool.tool_name
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
                                        Life Source *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            lifeForm.life_source
                                        }
                                        onChange={
                                            event =>

                                                setLifeForm(
                                                    previous => ({

                                                        ...previous,

                                                        life_source:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                        placeholder="CYCLE"
                                        maxLength={30}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Max Life Count *
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={
                                            lifeForm.max_life_count
                                        }
                                        onChange={
                                            event =>

                                                setLifeForm(
                                                    previous => ({

                                                        ...previous,

                                                        max_life_count:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Warning %
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="any"
                                        value={
                                            lifeForm.warning_percent
                                        }
                                        onChange={
                                            event =>

                                                setLifeForm(
                                                    previous => ({

                                                        ...previous,

                                                        warning_percent:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3 mt-4">

                                    <Form.Check
                                        type="checkbox"
                                        label="Reset On Replacement"
                                        checked={
                                            lifeForm.reset_on_replacement
                                        }
                                        onChange={
                                            event =>

                                                setLifeForm(
                                                    previous => ({

                                                        ...previous,

                                                        reset_on_replacement:
                                                            event.target.checked

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
                                        Effective From
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            lifeForm.effective_from
                                        }
                                        onChange={
                                            event =>

                                                setLifeForm(
                                                    previous => ({

                                                        ...previous,

                                                        effective_from:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Effective To
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            lifeForm.effective_to
                                        }
                                        onChange={
                                            event =>

                                                setLifeForm(
                                                    previous => ({

                                                        ...previous,

                                                        effective_to:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Calculation Expression
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={
                                    lifeForm.calculation_expression
                                }
                                onChange={
                                    event =>

                                        setLifeForm(
                                            previous => ({

                                                ...previous,

                                                calculation_expression:
                                                    event.target.value

                                            })
                                        )
                                }
                            />

                        </Form.Group>


                        <Form.Check
                            type="checkbox"
                            label="Active"
                            checked={
                                lifeForm.is_active
                            }
                            onChange={
                                event =>

                                    setLifeForm(
                                        previous => ({

                                            ...previous,

                                            is_active:
                                                event.target.checked

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

                            setShowLifeForm(
                                false
                            );

                            setLifeEditId(
                                null
                            );

                            setLifeForm(
                                lifeInitialState
                            );

                            setShowLifeConfig(
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
                            saveLife
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : lifeEditId
                                    ? "Update Life Config"
                                    : "Save Life Config"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                CALIBRATION CONFIG LIST
            ===================================================== */}

            <Modal
                show={
                    showCalibrationConfig
                }
                onHide={() =>
                    setShowCalibrationConfig(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Tool Calibration Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddCalibration
                            }
                        >
                            <Plus /> Add Calibration
                        </Button>

                    </div>


                    <DataTable
                        columns={
                            calibrationColumns
                        }
                        data={
                            calibrationConfigs
                        }
                        loading={
                            loading
                        }
                        emptyMessage="No Calibration Configuration Found"
                        renderActions={
                            calibration => (

                                <ActionButtons
                                    onEdit={() =>
                                        openEditCalibration(
                                            calibration
                                        )
                                    }
                                    onDelete={() =>
                                        deleteCalibration(
                                            calibration
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
                            setShowCalibrationConfig(
                                false
                            )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                CALIBRATION FORM
            ===================================================== */}

            <Modal
                show={
                    showCalibrationForm
                }
                onHide={() => {

                    setShowCalibrationForm(
                        false
                    );

                    setCalibrationEditId(
                        null
                    );

                    setCalibrationForm(
                        calibrationInitialState
                    );

                    setShowCalibrationConfig(
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
                            calibrationEditId
                                ? "Update Calibration Configuration"
                                : "Add Calibration Configuration"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Tool *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            calibrationForm.tool_id
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        tool_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Tool
                                        </option>


                                        {
                                            tools.map(
                                                tool => (

                                                    <option
                                                        key={
                                                            tool.tool_id
                                                        }
                                                        value={
                                                            tool.tool_id
                                                        }
                                                    >

                                                        {
                                                            tool.tool_code
                                                        }

                                                        {" - "}

                                                        {
                                                            tool.tool_name
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
                                        Frequency Days
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            calibrationForm.frequency_days
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        frequency_days:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Frequency Cycles
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            calibrationForm.frequency_cycles
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        frequency_cycles:
                                                            event.target.value

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
                                        Last Calibration Date
                                    </Form.Label>

                                    <Form.Control
                                        type="date"
                                        value={
                                            calibrationForm.last_calibration_date
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        last_calibration_date:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Next Due Date
                                    </Form.Label>

                                    <Form.Control
                                        type="date"
                                        value={
                                            calibrationForm.next_due_date
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        next_due_date:
                                                            event.target.value

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
                                        Tolerance Min
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="any"
                                        value={
                                            calibrationForm.tolerance_min
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        tolerance_min:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Tolerance Max
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="any"
                                        value={
                                            calibrationForm.tolerance_max
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        tolerance_max:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Unit
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            calibrationForm.unit
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        unit:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                        placeholder="Nm / mm / bar"
                                        maxLength={30}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Check
                                    type="checkbox"
                                    label="Certificate Required"
                                    checked={
                                        calibrationForm.certificate_required
                                    }
                                    onChange={
                                        event =>

                                            setCalibrationForm(
                                                previous => ({

                                                    ...previous,

                                                    certificate_required:
                                                        event.target.checked

                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={6}>

                                <Form.Check
                                    type="checkbox"
                                    label="Active"
                                    checked={
                                        calibrationForm.is_active
                                    }
                                    onChange={
                                        event =>

                                            setCalibrationForm(
                                                previous => ({

                                                    ...previous,

                                                    is_active:
                                                        event.target.checked

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

                            setShowCalibrationForm(
                                false
                            );

                            setCalibrationEditId(
                                null
                            );

                            setCalibrationForm(
                                calibrationInitialState
                            );

                            setShowCalibrationConfig(
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
                            saveCalibration
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : calibrationEditId
                                    ? "Update Calibration"
                                    : "Save Calibration"
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
                        Tool Runtime / Event History
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
                        emptyMessage="No Tool Events Found"
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
                onHide={() => {

                    setExecuteForm(
                        executeInitialState
                    );

                    setShowExecute(
                        false
                    );

                }}
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Execute Tool Event
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Tool *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.tool_id
                                        }
                                        onChange={
                                            event => {

                                                const tool =
                                                    tools.find(
                                                        item =>
                                                            sameId(
                                                                item.tool_id,
                                                                event.target.value
                                                            )
                                                    );


                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        tool_id:
                                                            event.target.value,

                                                        line_id:
                                                            tool?.line_id ||
                                                            "",

                                                        machine_id:
                                                            tool?.machine_id ||
                                                            "",

                                                        route_step_id:
                                                            ""

                                                    })
                                                );

                                            }
                                        }
                                    >

                                        <option value="">
                                            Select Tool
                                        </option>


                                        {
                                            tools.map(
                                                tool => (

                                                    <option
                                                        key={
                                                            tool.tool_id
                                                        }
                                                        value={
                                                            tool.tool_id
                                                        }
                                                    >

                                                        {
                                                            tool.tool_code
                                                        }

                                                        {" - "}

                                                        {
                                                            tool.tool_name
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
                                        Event Type *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.event_type
                                        }
                                        onChange={
                                            event => {

                                                const type =
                                                    event.target.value;


                                                setExecuteForm(
                                                    previous => ({

                                                        ...executeInitialState,

                                                        tool_id:
                                                            previous.tool_id,

                                                        line_id:
                                                            previous.line_id,

                                                        machine_id:
                                                            previous.machine_id,

                                                        event_type:
                                                            type

                                                    })
                                                );

                                            }
                                        }
                                    >

                                        {
                                            EVENT_TYPES.map(
                                                type => (

                                                    <option
                                                        key={
                                                            type
                                                        }
                                                        value={
                                                            type
                                                        }
                                                    >

                                                        {type}

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
                                        Line
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.line_id
                                        }
                                        disabled={
                                            !executeForm.tool_id
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        line_id:
                                                            event.target.value,

                                                        machine_id:
                                                            ""

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Line
                                        </option>


                                        {
                                            executeLines.map(
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


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Machine
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.machine_id
                                        }
                                        disabled={
                                            !executeForm.tool_id
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        machine_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            {
                                                machines.length
                                                    ? "Select Machine"
                                                    : "No Machine Available"
                                            }
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

                        </Row>


                        {
                            executeForm.event_type ===
                            "USAGE" && (

                                <>

                                    <Row>

                                        <Col md={6}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Route Step
                                                </Form.Label>

                                                <Form.Select
                                                    value={
                                                        executeForm.route_step_id
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    route_step_id:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                >

                                                    <option value="">
                                                        Select Route Step
                                                    </option>


                                                    {
                                                        executeRouteSteps.map(
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


                                        <Col md={6}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Unit ID
                                                </Form.Label>

                                                <Form.Control
                                                    value={
                                                        executeForm.unit_id
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    unit_id:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                    placeholder="Optional UUID"
                                                />

                                            </Form.Group>

                                        </Col>

                                    </Row>


                                    <Row>

                                        <Col md={4}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Usage Count
                                                </Form.Label>

                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={
                                                        executeForm.usage_count
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    usage_count:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                />

                                            </Form.Group>

                                        </Col>


                                        <Col md={4}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Cumulative Count
                                                </Form.Label>

                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={
                                                        executeForm.cumulative_count
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    cumulative_count:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                />

                                            </Form.Group>

                                        </Col>


                                        <Col md={4}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Result
                                                </Form.Label>

                                                <Form.Select
                                                    value={
                                                        executeForm.result
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    result:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                >

                                                    {
                                                        USAGE_RESULTS.map(
                                                            result => (

                                                                <option
                                                                    key={
                                                                        result
                                                                    }
                                                                    value={
                                                                        result
                                                                    }
                                                                >

                                                                    {result}

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
                                            Value Payload
                                        </Form.Label>

                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={
                                                executeForm.value_payload
                                            }
                                            onChange={
                                                event =>

                                                    setExecuteForm(
                                                        previous => ({

                                                            ...previous,

                                                            value_payload:
                                                                event.target.value

                                                        })
                                                    )
                                            }
                                        />

                                    </Form.Group>

                                </>

                            )
                        }


                        {
                            executeForm.event_type ===
                            "REPLACEMENT" && (

                                <>

                                    <Row>

                                        <Col md={6}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Old Serial Number
                                                </Form.Label>

                                                <Form.Control
                                                    value={
                                                        executeForm.old_serial_number
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    old_serial_number:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                />

                                            </Form.Group>

                                        </Col>


                                        <Col md={6}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    New Serial Number
                                                </Form.Label>

                                                <Form.Control
                                                    value={
                                                        executeForm.new_serial_number
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    new_serial_number:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                />

                                            </Form.Group>

                                        </Col>

                                    </Row>


                                    <Form.Group className="mb-3">

                                        <Form.Label>
                                            Replacement Reason *
                                        </Form.Label>

                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={
                                                executeForm.replacement_reason
                                            }
                                            onChange={
                                                event =>

                                                    setExecuteForm(
                                                        previous => ({

                                                            ...previous,

                                                            replacement_reason:
                                                                event.target.value

                                                        })
                                                    )
                                            }
                                        />

                                    </Form.Group>


                                    <Row>

                                        <Col md={6}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Replaced By User ID
                                                </Form.Label>

                                                <Form.Control
                                                    type="number"
                                                    value={
                                                        executeForm.replaced_by
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    replaced_by:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                />

                                            </Form.Group>

                                        </Col>


                                        <Col md={6}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Usage At Replacement
                                                </Form.Label>

                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={
                                                        executeForm.usage_at_replacement
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    usage_at_replacement:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                />

                                            </Form.Group>

                                        </Col>

                                    </Row>

                                </>

                            )
                        }


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
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        event_ts:
                                                            event.target.value

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
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        source_system:
                                                            event.target.value

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
                                        Correlation ID
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.correlation_id
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        correlation_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
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
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        idempotency_key:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Payload
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={
                                    executeForm.payload
                                }
                                onChange={
                                    event =>

                                        setExecuteForm(
                                            previous => ({

                                                ...previous,

                                                payload:
                                                    event.target.value

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
                        onClick={() => {

                            setExecuteForm(
                                executeInitialState
                            );

                            setShowExecute(
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
                            executeTool
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
                        Tool Report
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
                        emptyMessage="No Tool Report Data Found"
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


export default ToolMaster;