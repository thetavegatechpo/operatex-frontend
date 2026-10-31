
// src/pages/GaugeInstrumentMaster/GaugeInstrumentMaster.jsx

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

import gaugeService from "../api/gauge.service.js";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import plantShopService from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";
import lineService from "../../../enterprise-setup/line-master/api/line.service.js";
import machineService from "../../machine-master/api/machine.service.js";
import routeStationService from "../../route-station-master/api/routeStation.service.js";


// ==========================================================
// CONSTANTS
// ==========================================================

const GAUGE_STATUS = [
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
    "RETIRED"
];


const PARAMETER_DATA_TYPES = [
    "NUMERIC",
    "INTEGER",
    "BOOLEAN",
    "STRING"
];


const SCHEDULE_TYPES = [
    "CALENDAR",
    "USAGE",
    "CONDITION"
];


const SCHEDULE_STATUS = [
    "ACTIVE",
    "SUSPENDED",
    "COMPLETED"
];


const EVENT_TYPES = [
    "MEASUREMENT",
    "CALIBRATION"
];


const MEASUREMENT_RESULTS = [
    "OK",
    "NOK",
    "WARNING",
    "INVALID"
];


const CALIBRATION_EVENT_TYPES = [
    "CALIBRATED",
    "FAILED",
    "WAIVED",
    "RESCHEDULED"
];


const CALIBRATION_RESULTS = [
    "PASS",
    "FAIL",
    "CONDITIONAL",
    "NOT_APPLICABLE"
];


// ==========================================================
// HELPERS
// ==========================================================

const sameId = (
    left,
    right
) => {

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

function GaugeInstrumentMaster() {

    // ======================================================
    // DATA
    // ======================================================

    const [
        gauges,
        setGauges
    ] = useState([]);


    const [
        parameterConfigs,
        setParameterConfigs
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
        showParameterConfig,
        setShowParameterConfig
    ] = useState(false);


    const [
        showParameterForm,
        setShowParameterForm
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
        parameterEditId,
        setParameterEditId
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

    const gaugeInitialState = {

        company_id: "",

        plant_id: "",

        line_id: "",

        station_id: "",

        machine_id: "",

        gauge_code: "",

        gauge_name: "",

        gauge_type: "",

        make: "",

        model: "",

        serial_number: "",

        measurement_unit: "",

        resolution: "",

        range_min: "",

        range_max: "",

        calibration_required: true,

        status: "ACTIVE"

    };


    const parameterInitialState = {

        config_type: "PARAMETER",

        gauge_id: "",

        parameter_code: "",

        parameter_name: "",

        data_type: "NUMERIC",

        unit: "",

        nominal_value: "",

        lsl: "",

        usl: "",

        resolution: "",

        decimal_places: 3,

        measurement_method: "",

        sample_size: 1,

        is_mandatory: true,

        is_active: true

    };


    const calibrationInitialState = {

        config_type: "CALIBRATION",

        gauge_id: "",

        schedule_type: "CALENDAR",

        frequency_days: "",

        frequency_usage: "",

        last_calibration_at: "",

        next_due_at: "",

        grace_days: 0,

        responsible_user_id: "",

        status: "ACTIVE",

        reminder_config: "{}"

    };


    const executeInitialState = {

        gauge_id: "",

        event_category: "MEASUREMENT",

        line_id: "",

        machine_id: "",

        gauge_parameter_id: "",

        calibration_schedule_id: "",

        measured_value: "",

        measured_text: "",

        measurement_result: "OK",

        operator_id: "",

        calibration_event_type: "CALIBRATED",

        calibration_result: "PASS",

        calibrated_at: "",

        due_at: "",

        certificate_no: "",

        certificate_url: "",

        performed_by: "",

        next_due_at: "",

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
        gaugeInitialState
    );


    const [
        parameterForm,
        setParameterForm
    ] = useState(
        parameterInitialState
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


    const prettyJson = value => {

        try {

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {

                return "{}";

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

            return "{}";

        }

    };


    // ======================================================
    // DATE
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

                setLoading(
                    true
                );


                const results =
                    await Promise.allSettled([

                        loadGauges(),

                        loadParameterConfigs(),

                        loadCalibrationConfigs(),

                        loadCompanies(),

                        loadPlants(),

                        loadLines(),

                        loadStations(),

                        loadMachines()

                    ]);


                const names = [

                    "Gauge Master",

                    "Gauge Parameters",

                    "Gauge Calibration",

                    "Company",

                    "Plant",

                    "Line",

                    "Station",

                    "Machine"

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
                    "Gauge Master Initial Load Error:",
                    error
                );

            }
            finally {

                setLoading(
                    false
                );

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
                    "GAUGE MASTER PLANTS:",
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
                    "GAUGE MASTER STATIONS:",
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
    // MACHINE
    //
    // MACHINE IS OPTIONAL.
    // MACHINE API FAILURE MUST NOT BREAK GAUGE MASTER.
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
                    "GAUGE MASTER MACHINES:",
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

            }

        };


    // ======================================================
    // GAUGE LOAD
    // ======================================================

    const loadGauges =
        async () => {

            try {

                const response =
                    await gaugeService
                        .getMaster();


                setGauges(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Gauge Master Load Error:",
                    error?.response?.data ||
                    error
                );


                setGauges([]);


                showToast(

                    getErrorMessage(
                        error,
                        "Unable to load Gauge Master."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // PARAMETER CONFIG LOAD
    // ======================================================

    const loadParameterConfigs =
        async () => {

            try {

                const response =
                    await gaugeService
                        .getParameterConfig();


                setParameterConfigs(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Gauge Parameter Load Error:",
                    error?.response?.data ||
                    error
                );


                setParameterConfigs([]);

            }

        };


    // ======================================================
    // CALIBRATION CONFIG LOAD
    // ======================================================

    const loadCalibrationConfigs =
        async () => {

            try {

                const response =
                    await gaugeService
                        .getCalibrationConfig();


                setCalibrationConfigs(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Gauge Calibration Load Error:",
                    error?.response?.data ||
                    error
                );


                setCalibrationConfigs([]);

            }

        };


    // ======================================================
    // LOOKUP LABELS
    // ======================================================

    const getCompanyName =
        companyId => {

            return (
                companies.find(
                    item =>
                        sameId(
                            item.company_id,
                            companyId
                        )
                )?.company_name ||
                "-"
            );

        };


    const getPlantName =
        plantId => {

            return (
                plants.find(
                    item =>
                        sameId(
                            item.plant_id,
                            plantId
                        )
                )?.plant_name ||
                "-"
            );

        };


    const getLineName =
        lineId => {

            return (
                lines.find(
                    item =>
                        sameId(
                            item.line_id,
                            lineId
                        )
                )?.line_name ||
                "-"
            );

        };


    const getStationName =
        stationId => {

            const station =
                stations.find(
                    item =>
                        sameId(
                            item.station_id,
                            stationId
                        )
                );


            if (!station) {

                return "-";

            }


            return (
                station.station_name ||
                station.station_code ||
                "-"
            );

        };


    const getMachineName =
        machineId => {

            return (
                machines.find(
                    item =>
                        sameId(
                            item.machine_id,
                            machineId
                        )
                )?.machine_name ||
                "-"
            );

        };


    const getGaugeLabel =
        gaugeId => {

            const gauge =
                gauges.find(
                    item =>
                        sameId(
                            item.gauge_id,
                            gaugeId
                        )
                );


            if (!gauge) {

                return "-";

            }


            return `${
                gauge.gauge_code ||
                ""
            } - ${
                gauge.gauge_name ||
                ""
            }`;

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


                    const stationMatch =

                        !formData.station_id ||

                        !machine.station_id ||

                        sameId(
                            machine.station_id,
                            formData.station_id
                        );


                    return (
                        companyMatch &&
                        plantMatch &&
                        lineMatch &&
                        stationMatch
                    );

                }
            );

        }, [
            machines,
            formData.company_id,
            formData.plant_id,
            formData.line_id,
            formData.station_id
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
            gaugeInitialState
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
        gauge => {

            setEditId(
                gauge.gauge_id
            );


            setFormData({

                company_id:
                    gauge.company_id || "",

                plant_id:
                    gauge.plant_id || "",

                line_id:
                    gauge.line_id || "",

                station_id:
                    gauge.station_id || "",

                machine_id:
                    gauge.machine_id || "",

                gauge_code:
                    gauge.gauge_code || "",

                gauge_name:
                    gauge.gauge_name || "",

                gauge_type:
                    gauge.gauge_type || "",

                make:
                    gauge.make || "",

                model:
                    gauge.model || "",

                serial_number:
                    gauge.serial_number || "",

                measurement_unit:
                    gauge.measurement_unit || "",

                resolution:
                    gauge.resolution ?? "",

                range_min:
                    gauge.range_min ?? "",

                range_max:
                    gauge.range_max ?? "",

                calibration_required:
                    gauge.calibration_required !== false,

                status:
                    gauge.status ||
                    "ACTIVE"

            });


            setShowForm(
                true
            );

        };


    // ======================================================
    // SAVE GAUGE
    // ======================================================

    const saveGauge =
        async () => {

            try {

                if (
                    !formData.company_id ||
                    !formData.plant_id ||
                    !formData.gauge_code.trim() ||
                    !formData.gauge_name.trim() ||
                    !formData.gauge_type.trim()
                ) {

                    showToast(
                        "Company, Plant, Gauge Code, Gauge Name and Gauge Type are required.",
                        "danger"
                    );


                    return;

                }


                if (
                    formData.resolution !== "" &&
                    Number(
                        formData.resolution
                    ) <= 0
                ) {

                    showToast(
                        "Resolution must be greater than 0.",
                        "danger"
                    );


                    return;

                }


                if (
                    formData.range_min !== "" &&
                    formData.range_max !== "" &&
                    Number(
                        formData.range_max
                    ) <
                    Number(
                        formData.range_min
                    )
                ) {

                    showToast(
                        "Range Max cannot be less than Range Min.",
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

                    gauge_code:
                        formData.gauge_code
                            .trim(),

                    gauge_name:
                        formData.gauge_name
                            .trim(),

                    gauge_type:
                        formData.gauge_type
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

                    measurement_unit:
                        formData.measurement_unit
                            .trim() ||
                        null,

                    resolution:
                        formData.resolution === ""

                            ? null

                            : Number(
                                formData.resolution
                            ),

                    range_min:
                        formData.range_min === ""

                            ? null

                            : Number(
                                formData.range_min
                            ),

                    range_max:
                        formData.range_max === ""

                            ? null

                            : Number(
                                formData.range_max
                            ),

                    calibration_required:
                        Boolean(
                            formData.calibration_required
                        ),

                    status:
                        String(
                            formData.status
                        )
                            .toUpperCase()

                };


                if (
                    editId
                ) {

                    await gaugeService
                        .updateMaster(
                            editId,
                            payload
                        );


                    showToast(
                        "Gauge updated successfully."
                    );

                }
                else {

                    await gaugeService
                        .createMaster(
                            payload
                        );


                    showToast(
                        "Gauge created successfully."
                    );

                }


                setShowForm(
                    false
                );


                resetForm();


                await loadGauges();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Gauge."
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
    // DELETE GAUGE
    // ======================================================

    const deleteGauge =
        async gauge => {

            if (
                !window.confirm(
                    `Deactivate gauge "${gauge.gauge_name}"?`
                )
            ) {

                return;

            }


            try {

                await gaugeService
                    .deleteMaster(
                        gauge.gauge_id
                    );


                showToast(
                    "Gauge deactivated successfully."
                );


                await loadGauges();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Gauge."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // PARAMETER ADD
    // ======================================================

    const openAddParameter = () => {

        setParameterEditId(
            null
        );


        setParameterForm(
            parameterInitialState
        );


        setShowParameterConfig(
            false
        );


        setShowParameterForm(
            true
        );

    };


    // ======================================================
    // PARAMETER EDIT
    // ======================================================

    const openEditParameter =
        parameter => {

            setParameterEditId(
                parameter.gauge_parameter_id
            );


            setParameterForm({

                config_type:
                    "PARAMETER",

                gauge_id:
                    parameter.gauge_id || "",

                parameter_code:
                    parameter.parameter_code || "",

                parameter_name:
                    parameter.parameter_name || "",

                data_type:
                    parameter.data_type ||
                    "NUMERIC",

                unit:
                    parameter.unit || "",

                nominal_value:
                    parameter.nominal_value ?? "",

                lsl:
                    parameter.lsl ?? "",

                usl:
                    parameter.usl ?? "",

                resolution:
                    parameter.resolution ?? "",

                decimal_places:
                    parameter.decimal_places ?? 3,

                measurement_method:
                    parameter.measurement_method || "",

                sample_size:
                    parameter.sample_size ?? 1,

                is_mandatory:
                    parameter.is_mandatory !== false,

                is_active:
                    parameter.is_active !== false

            });


            setShowParameterConfig(
                false
            );


            setShowParameterForm(
                true
            );

        };


    // ======================================================
    // SAVE PARAMETER
    // ======================================================

    const saveParameter =
        async () => {

            try {

                if (
                    !parameterForm.gauge_id ||
                    !parameterForm.parameter_code.trim() ||
                    !parameterForm.parameter_name.trim()
                ) {

                    showToast(
                        "Gauge, Parameter Code and Parameter Name are required.",
                        "danger"
                    );


                    return;

                }


                if (
                    parameterForm.lsl !== "" &&
                    parameterForm.usl !== "" &&
                    Number(
                        parameterForm.usl
                    ) <
                    Number(
                        parameterForm.lsl
                    )
                ) {

                    showToast(
                        "USL cannot be less than LSL.",
                        "danger"
                    );


                    return;

                }


                if (
                    parameterForm.resolution !== "" &&
                    Number(
                        parameterForm.resolution
                    ) <= 0
                ) {

                    showToast(
                        "Resolution must be greater than 0.",
                        "danger"
                    );


                    return;

                }


                if (
                    Number(
                        parameterForm.decimal_places
                    ) < 0 ||
                    Number(
                        parameterForm.decimal_places
                    ) > 8
                ) {

                    showToast(
                        "Decimal Places must be between 0 and 8.",
                        "danger"
                    );


                    return;

                }


                if (
                    Number(
                        parameterForm.sample_size
                    ) <= 0
                ) {

                    showToast(
                        "Sample Size must be greater than 0.",
                        "danger"
                    );


                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    config_type:
                        "PARAMETER",

                    gauge_id:
                        parameterForm.gauge_id,

                    parameter_code:
                        parameterForm.parameter_code
                            .trim(),

                    parameter_name:
                        parameterForm.parameter_name
                            .trim(),

                    data_type:
                        parameterForm.data_type,

                    unit:
                        parameterForm.unit
                            .trim() ||
                        null,

                    nominal_value:
                        parameterForm.nominal_value === ""

                            ? null

                            : Number(
                                parameterForm.nominal_value
                            ),

                    lsl:
                        parameterForm.lsl === ""

                            ? null

                            : Number(
                                parameterForm.lsl
                            ),

                    usl:
                        parameterForm.usl === ""

                            ? null

                            : Number(
                                parameterForm.usl
                            ),

                    resolution:
                        parameterForm.resolution === ""

                            ? null

                            : Number(
                                parameterForm.resolution
                            ),

                    decimal_places:
                        Number(
                            parameterForm.decimal_places
                        ),

                    measurement_method:
                        parameterForm.measurement_method
                            .trim() ||
                        null,

                    sample_size:
                        Number(
                            parameterForm.sample_size
                        ),

                    is_mandatory:
                        Boolean(
                            parameterForm.is_mandatory
                        ),

                    is_active:
                        Boolean(
                            parameterForm.is_active
                        )

                };


                if (
                    parameterEditId
                ) {

                    delete payload.config_type;


                    await gaugeService
                        .updateConfig(
                            "PARAMETER",
                            parameterEditId,
                            payload
                        );


                    showToast(
                        "Gauge Parameter updated successfully."
                    );

                }
                else {

                    await gaugeService
                        .createConfig(
                            payload
                        );


                    showToast(
                        "Gauge Parameter created successfully."
                    );

                }


                setParameterEditId(
                    null
                );


                setParameterForm(
                    parameterInitialState
                );


                setShowParameterForm(
                    false
                );


                await loadParameterConfigs();


                setShowParameterConfig(
                    true
                );

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Gauge Parameter."
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
    // DELETE PARAMETER
    // ======================================================

    const deleteParameter =
        async parameter => {

            if (
                !window.confirm(
                    `Deactivate parameter "${parameter.parameter_name}"?`
                )
            ) {

                return;

            }


            try {

                await gaugeService
                    .deleteConfig(
                        "PARAMETER",
                        parameter.gauge_parameter_id
                    );


                showToast(
                    "Gauge Parameter deactivated successfully."
                );


                await loadParameterConfigs();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Gauge Parameter."
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
                calibration.calibration_schedule_id
            );


            setCalibrationForm({

                config_type:
                    "CALIBRATION",

                gauge_id:
                    calibration.gauge_id || "",

                schedule_type:
                    calibration.schedule_type ||
                    "CALENDAR",

                frequency_days:
                    calibration.frequency_days ?? "",

                frequency_usage:
                    calibration.frequency_usage ?? "",

                last_calibration_at:
                    toDateTimeInput(
                        calibration.last_calibration_at
                    ),

                next_due_at:
                    toDateTimeInput(
                        calibration.next_due_at
                    ),

                grace_days:
                    calibration.grace_days ?? 0,

                responsible_user_id:
                    calibration.responsible_user_id ?? "",

                status:
                    calibration.status ||
                    "ACTIVE",

                reminder_config:
                    prettyJson(
                        calibration.reminder_config
                    )

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
                    !calibrationForm.gauge_id ||
                    !calibrationForm.schedule_type ||
                    !calibrationForm.next_due_at
                ) {

                    showToast(
                        "Gauge, Schedule Type and Next Due are required.",
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
                    calibrationForm.frequency_usage !== "" &&
                    Number(
                        calibrationForm.frequency_usage
                    ) <= 0
                ) {

                    showToast(
                        "Frequency Usage must be greater than 0.",
                        "danger"
                    );


                    return;

                }


                if (
                    Number(
                        calibrationForm.grace_days
                    ) < 0
                ) {

                    showToast(
                        "Grace Days cannot be negative.",
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

                    gauge_id:
                        calibrationForm.gauge_id,

                    schedule_type:
                        calibrationForm.schedule_type,

                    frequency_days:
                        calibrationForm.frequency_days === ""

                            ? null

                            : Number(
                                calibrationForm.frequency_days
                            ),

                    frequency_usage:
                        calibrationForm.frequency_usage === ""

                            ? null

                            : Number(
                                calibrationForm.frequency_usage
                            ),

                    last_calibration_at:
                        calibrationForm.last_calibration_at ||
                        null,

                    next_due_at:
                        calibrationForm.next_due_at,

                    grace_days:
                        Number(
                            calibrationForm.grace_days ||
                            0
                        ),

                    responsible_user_id:
                        calibrationForm.responsible_user_id === ""

                            ? null

                            : Number(
                                calibrationForm.responsible_user_id
                            ),

                    status:
                        calibrationForm.status,

                    reminder_config:
                        parseJsonObject(
                            calibrationForm.reminder_config,
                            "Reminder Config"
                        )

                };


                if (
                    calibrationEditId
                ) {

                    delete payload.config_type;


                    await gaugeService
                        .updateConfig(
                            "CALIBRATION",
                            calibrationEditId,
                            payload
                        );


                    showToast(
                        "Calibration Schedule updated successfully."
                    );

                }
                else {

                    await gaugeService
                        .createConfig(
                            payload
                        );


                    showToast(
                        "Calibration Schedule created successfully."
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
                        "Unable to save Calibration Schedule."
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
                    `Suspend calibration schedule for "${calibration.gauge_name || calibration.gauge_code || getGaugeLabel(calibration.gauge_id)}"?`
                )
            ) {

                return;

            }


            try {

                await gaugeService
                    .deleteConfig(
                        "CALIBRATION",
                        calibration.calibration_schedule_id
                    );


                showToast(
                    "Calibration Schedule suspended successfully."
                );


                await loadCalibrationConfigs();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to suspend Calibration Schedule."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // SELECTED EXECUTE GAUGE
    // ======================================================

    const selectedExecuteGauge =
        useMemo(
            () =>

                gauges.find(
                    gauge =>
                        sameId(
                            gauge.gauge_id,
                            executeForm.gauge_id
                        )
                ),

            [
                gauges,
                executeForm.gauge_id
            ]
        );


    // ======================================================
    // EXECUTE PARAMETERS
    // ======================================================

    const executeParameters =
        useMemo(() => {

            if (
                !executeForm.gauge_id
            ) {

                return [];

            }


            return parameterConfigs.filter(
                parameter => {

                    return (

                        sameId(
                            parameter.gauge_id,
                            executeForm.gauge_id
                        ) &&

                        parameter.is_active !== false

                    );

                }
            );

        }, [
            parameterConfigs,
            executeForm.gauge_id
        ]);


    // ======================================================
    // EXECUTE CALIBRATION SCHEDULES
    // ======================================================

    const executeCalibrationSchedules =
        useMemo(() => {

            if (
                !executeForm.gauge_id
            ) {

                return [];

            }


            return calibrationConfigs.filter(
                calibration => {

                    return sameId(
                        calibration.gauge_id,
                        executeForm.gauge_id
                    );

                }
            );

        }, [
            calibrationConfigs,
            executeForm.gauge_id
        ]);


    // ======================================================
    // EXECUTE LINES
    // ======================================================

    const executeLines =
        useMemo(() => {

            if (
                !selectedExecuteGauge
            ) {

                return [];

            }


            return lines.filter(
                line => {

                    const companyMatch =

                        !line.company_id ||

                        sameId(
                            line.company_id,
                            selectedExecuteGauge.company_id
                        );


                    const plantMatch =

                        !line.plant_id ||

                        sameId(
                            line.plant_id,
                            selectedExecuteGauge.plant_id
                        );


                    return (
                        companyMatch &&
                        plantMatch
                    );

                }
            );

        }, [
            lines,
            selectedExecuteGauge
        ]);


    // ======================================================
    // EXECUTE MACHINES
    // ======================================================

    const executeMachines =
        useMemo(() => {

            if (
                !selectedExecuteGauge
            ) {

                return [];

            }


            return machines.filter(
                machine => {

                    const companyMatch =

                        !machine.company_id ||

                        sameId(
                            machine.company_id,
                            selectedExecuteGauge.company_id
                        );


                    const plantMatch =

                        !machine.plant_id ||

                        sameId(
                            machine.plant_id,
                            selectedExecuteGauge.plant_id
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
            selectedExecuteGauge,
            executeForm.line_id
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
    // EXECUTE GAUGE
    // ======================================================

    const executeGauge =
        async () => {

            try {

                if (
                    !executeForm.gauge_id ||
                    !executeForm.event_category
                ) {

                    showToast(
                        "Gauge and Event Type are required.",
                        "danger"
                    );


                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    gauge_id:
                        executeForm.gauge_id,

                    event_category:
                        executeForm.event_category,

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


                // ==========================================
                // MEASUREMENT
                // ==========================================

                if (
                    executeForm.event_category ===
                    "MEASUREMENT"
                ) {

                    if (
                        !executeForm.gauge_parameter_id
                    ) {

                        showToast(
                            "Gauge Parameter is required.",
                            "danger"
                        );


                        return;

                    }


                    if (
                        executeForm.measured_value === "" &&
                        !executeForm.measured_text.trim()
                    ) {

                        showToast(
                            "Measured Value or Measured Text is required.",
                            "danger"
                        );


                        return;

                    }


                    payload.line_id =
                        executeForm.line_id ||
                        null;


                    payload.machine_id =
                        executeForm.machine_id ||
                        null;


                    payload.gauge_parameter_id =
                        executeForm.gauge_parameter_id;


                    payload.measured_value =
                        executeForm.measured_value === ""

                            ? null

                            : Number(
                                executeForm.measured_value
                            );


                    payload.measured_text =
                        executeForm.measured_text
                            .trim() ||
                        null;


                    payload.result =
                        executeForm.measurement_result;


                    payload.operator_id =
                        executeForm.operator_id === ""

                            ? null

                            : Number(
                                executeForm.operator_id
                            );

                }


                // ==========================================
                // CALIBRATION
                // ==========================================

                if (
                    executeForm.event_category ===
                    "CALIBRATION"
                ) {

                    payload.calibration_schedule_id =
                        executeForm.calibration_schedule_id ||
                        null;


                    payload.event_type =
                        executeForm.calibration_event_type;


                    payload.result =
                        executeForm.calibration_result;


                    payload.calibrated_at =
                        executeForm.calibrated_at ||
                        null;


                    payload.due_at =
                        executeForm.due_at ||
                        null;


                    payload.certificate_no =
                        executeForm.certificate_no
                            .trim() ||
                        null;


                    payload.certificate_url =
                        executeForm.certificate_url
                            .trim() ||
                        null;


                    payload.performed_by =
                        executeForm.performed_by === ""

                            ? null

                            : Number(
                                executeForm.performed_by
                            );


                    payload.next_due_at =
                        executeForm.next_due_at ||
                        null;

                }


                const response =
                    await gaugeService
                        .execute(
                            payload
                        );


                showToast(

                    response?.data?.message ||

                    "Gauge event created successfully."

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
                        "Unable to execute Gauge Event."
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
                    await gaugeService
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
                        "Unable to load Gauge Runtime."
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
                    await gaugeService
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
                        "Unable to generate Gauge Report."
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

    const exportGauge =
        async () => {

            try {

                const response =
                    await gaugeService
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


                if (
                    rows.length === 0
                ) {

                    showToast(
                        "No Gauge data available for export.",
                        "warning"
                    );


                    return;

                }


                const columns = [

                    ["company_name", "Company"],

                    ["plant_name", "Plant"],

                    ["line_name", "Line"],

                    ["station_name", "Station"],

                    ["machine_name", "Machine"],

                    ["gauge_code", "Gauge Code"],

                    ["gauge_name", "Gauge Name"],

                    ["gauge_type", "Gauge Type"],

                    ["make", "Make"],

                    ["model", "Model"],

                    ["serial_number", "Serial Number"],

                    ["measurement_unit", "Measurement Unit"],

                    ["resolution", "Resolution"],

                    ["range_min", "Range Min"],

                    ["range_max", "Range Max"],

                    ["calibration_required", "Calibration Required"],

                    ["parameter_count", "Parameters"],

                    ["next_due_at", "Next Calibration Due"],

                    ["latest_result", "Latest Result"],

                    ["status", "Status"]

                ];


                const escapeCsv =
                    value => {

                        const text =

                            value === null ||
                            value === undefined

                                ? ""

                                : typeof value ===
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
                    "Gauge_Instrument_Master.csv";


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
    // FILTER GAUGES
    // ======================================================

    const filteredGauges =
        gauges.filter(
            gauge => {

                const search =
                    searchText
                        .trim()
                        .toLowerCase();


                const values = [

                    gauge.gauge_code,

                    gauge.gauge_name,

                    gauge.gauge_type,

                    gauge.make,

                    gauge.model,

                    gauge.serial_number,

                    gauge.company_name ||
                    getCompanyName(
                        gauge.company_id
                    ),

                    gauge.plant_name ||
                    getPlantName(
                        gauge.plant_id
                    ),

                    gauge.line_name ||
                    getLineName(
                        gauge.line_id
                    ),

                    gauge.station_name ||
                    getStationName(
                        gauge.station_id
                    ),

                    gauge.machine_name ||
                    getMachineName(
                        gauge.machine_id
                    )

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

                    gauge.status ===
                    statusFilter;


                return (
                    searchMatch &&
                    statusMatch
                );

            }
        );


    // ======================================================
    // GAUGE COLUMNS
    // ======================================================

    const gaugeColumns = [

        {
            key: "gauge_code",
            label: "Gauge Code"
        },

        {
            key: "gauge_name",
            label: "Gauge Name"
        },

        {
            key: "gauge_type",
            label: "Gauge Type"
        },

        {
            key: "company_name",
            label: "Company",

            render:
                row =>
                    row.company_name ||
                    getCompanyName(
                        row.company_id
                    )
        },

        {
            key: "plant_name",
            label: "Plant",

            render:
                row =>
                    row.plant_name ||
                    getPlantName(
                        row.plant_id
                    )
        },

        {
            key: "line_name",
            label: "Line",

            render:
                row =>
                    row.line_name ||
                    getLineName(
                        row.line_id
                    )
        },

        {
            key: "station_name",
            label: "Station",

            render:
                row =>
                    row.station_name ||
                    getStationName(
                        row.station_id
                    )
        },

        {
            key: "machine_name",
            label: "Machine",

            render:
                row =>
                    row.machine_name ||
                    getMachineName(
                        row.machine_id
                    )
        },

        {
            key: "measurement_unit",
            label: "Unit"
        },

        {
            key: "range",
            label: "Range",

            render:
                row => {

                    if (
                        row.range_min === null &&
                        row.range_max === null
                    ) {

                        return "-";

                    }


                    return `${
                        row.range_min ??
                        "-"
                    } - ${
                        row.range_max ??
                        "-"
                    }`;

                }
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
    // PARAMETER COLUMNS
    // ======================================================

    const parameterColumns = [

        {
            key: "gauge_code",
            label: "Gauge Code",

            render:
                row =>
                    row.gauge_code ||
                    getGaugeLabel(
                        row.gauge_id
                    )
        },

        {
            key: "parameter_code",
            label: "Parameter Code"
        },

        {
            key: "parameter_name",
            label: "Parameter Name"
        },

        {
            key: "data_type",
            label: "Data Type"
        },

        {
            key: "unit",
            label: "Unit"
        },

        {
            key: "nominal_value",
            label: "Nominal"
        },

        {
            key: "lsl",
            label: "LSL"
        },

        {
            key: "usl",
            label: "USL"
        },

        {
            key: "resolution",
            label: "Resolution"
        },

        {
            key: "sample_size",
            label: "Sample Size"
        },

        {
            key: "is_mandatory",
            label: "Mandatory",

            render:
                row => (

                    <Badge
                        bg={
                            row.is_mandatory
                                ? "primary"
                                : "secondary"
                        }
                    >

                        {
                            row.is_mandatory
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
    // CALIBRATION COLUMNS
    // ======================================================

    const calibrationColumns = [

        {
            key: "gauge_code",
            label: "Gauge Code",

            render:
                row =>
                    row.gauge_code ||
                    getGaugeLabel(
                        row.gauge_id
                    )
        },

        {
            key: "schedule_type",
            label: "Schedule Type"
        },

        {
            key: "frequency_days",
            label: "Frequency Days"
        },

        {
            key: "frequency_usage",
            label: "Frequency Usage"
        },

        {
            key: "last_calibration_at",
            label: "Last Calibration",

            render:
                row =>
                    formatDateTime(
                        row.last_calibration_at
                    )
        },

        {
            key: "next_due_at",
            label: "Next Due",

            render:
                row =>
                    formatDateTime(
                        row.next_due_at
                    )
        },

        {
            key: "grace_days",
            label: "Grace Days"
        },

        {
            key: "responsible_user_id",
            label: "Responsible User"
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
    // RUNTIME COLUMNS
    // ======================================================

    const runtimeColumns = [

        {
            key: "event_category",
            label: "Event"
        },

        {
            key: "gauge_code",
            label: "Gauge Code"
        },

        {
            key: "gauge_name",
            label: "Gauge Name"
        },

        {
            key: "parameter_name",
            label: "Parameter"
        },

        {
            key: "measured_value",
            label: "Measured Value"
        },

        {
            key: "measured_text",
            label: "Measured Text"
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
            key:
                "calibration_event_type",

            label:
                "Calibration Event"
        },

        {
            key: "certificate_no",
            label: "Certificate"
        },

        {
            key: "next_due_at",
            label: "Next Due",

            render:
                row =>
                    formatDateTime(
                        row.next_due_at
                    )
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
            key: "gauge_code",
            label: "Gauge Code"
        },

        {
            key: "gauge_name",
            label: "Gauge Name"
        },

        {
            key: "gauge_type",
            label: "Gauge Type"
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
            key: "measurement_unit",
            label: "Unit"
        },

        {
            key: "parameter_count",
            label: "Parameters",

            render:
                row =>
                    row.parameter_count ??
                    row.total_parameters ??
                    0
        },

        {
            key: "next_due_at",
            label: "Calibration Due",

            render:
                row =>
                    formatDateTime(
                        row.next_due_at
                    )
        },

        {
            key: "latest_result",
            label: "Latest Result",

            render:
                row =>

                    row.latest_result

                        ? (
                            <StatusBadge
                                status={
                                    row.latest_result
                                }
                            />
                        )

                        : "-"
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

<div className="gauge-master container-fluid">

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
                                Gauge / Instrument Master
                            </h3>

                            <small className="text-muted">
                                Master Data / Gauge & Instrument Master
                            </small>

                        </Col>


                        <Col xs="auto">

                            <div className="d-flex gap-2 flex-wrap">

                                <Button
                                    variant="outline-primary"
                                    onClick={() => {

                                        loadParameterConfigs();

                                        setShowParameterConfig(
                                            true
                                        );

                                    }}
                                >
                                    Parameter Config
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
                                    <Plus /> Add Gauge
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
                    exportGauge
                }
                placeholder="Search Gauge..."
            />


            {/* =====================================================
                MASTER TABLE
            ===================================================== */}

            <DataTable
                columns={
                    gaugeColumns
                }
                data={
                    filteredGauges
                }
                loading={
                    loading
                }
                emptyMessage="No Gauge Found"
                renderActions={
                    gauge => (

                        <ActionButtons
                            onEdit={() =>
                                openEditModal(
                                    gauge
                                )
                            }
                            onDelete={() =>
                                deleteGauge(
                                    gauge
                                )
                            }
                        />

                    )
                }
            />


            {/* =====================================================
                GAUGE MASTER FORM
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
                                ? "Update Gauge / Instrument"
                                : "Create Gauge / Instrument"
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

                                                        plant_id: "",

                                                        line_id: "",

                                                        station_id: "",

                                                        machine_id: ""

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

                                                        line_id: "",

                                                        station_id: "",

                                                        machine_id: ""

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
                                        disabled={   Boolean(editId) ||
                                            !formData.plant_id
                                        }
                                        onChange={
                                            event =>

                                                setFormData(
                                                    previous => ({

                                                        ...previous,

                                                        line_id:
                                                            event.target.value,

                                                        station_id: "",

                                                        machine_id: ""

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
                                        disabled={   Boolean(editId) ||
                                            !formData.line_id
                                        }
                                        onChange={
                                            event =>

                                                setFormData(
                                                    previous => ({

                                                        ...previous,

                                                        station_id:
                                                            event.target.value,

                                                        machine_id:
                                                            ""

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
                                        disabled={   Boolean(editId) ||
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
                                        Gauge Code *
                                    </Form.Label>

                                    <Form.Control
                                        name="gauge_code"
                                        value={
                                            formData.gauge_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="GAUGE-001"
                                        maxLength={75}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Gauge Name *
                                    </Form.Label>

                                    <Form.Control
                                        name="gauge_name"
                                        value={
                                            formData.gauge_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Digital Vernier"
                                        maxLength={150}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Gauge Type *
                                    </Form.Label>

                                    <Form.Control
                                        name="gauge_type"
                                        value={
                                            formData.gauge_type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="CALIPER"
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

                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Measurement Unit
                                    </Form.Label>

                                    <Form.Control
                                        name="measurement_unit"
                                        value={
                                            formData.measurement_unit
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="mm / Nm / bar"
                                        maxLength={30}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Resolution
                                    </Form.Label>

                                    <Form.Control
                                        name="resolution"
                                        type="number"
                                        step="any"
                                        value={
                                            formData.resolution
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Range Min
                                    </Form.Label>

                                    <Form.Control
                                        name="range_min"
                                        type="number"
                                        step="any"
                                        value={
                                            formData.range_min
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Range Max
                                    </Form.Label>

                                    <Form.Control
                                        name="range_max"
                                        type="number"
                                        step="any"
                                        value={
                                            formData.range_max
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

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
                                            GAUGE_STATUS.map(
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
                            saveGauge
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
                                    ? "Update Gauge"
                                    : "Save Gauge"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                PARAMETER CONFIG LIST
            ===================================================== */}

            <Modal
                show={
                    showParameterConfig
                }
                onHide={() =>
                    setShowParameterConfig(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Gauge Parameter Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddParameter
                            }
                        >
                            <Plus /> Add Parameter
                        </Button>

                    </div>


                    <DataTable
                        columns={
                            parameterColumns
                        }
                        data={
                            parameterConfigs
                        }
                        loading={
                            loading
                        }
                        emptyMessage="No Gauge Parameter Configuration Found"
                        renderActions={
                            parameter => (

                                <ActionButtons
                                    onEdit={() =>
                                        openEditParameter(
                                            parameter
                                        )
                                    }
                                    onDelete={() =>
                                        deleteParameter(
                                            parameter
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
                            setShowParameterConfig(
                                false
                            )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =====================================================
                PARAMETER FORM
            ===================================================== */}

            <Modal
                show={
                    showParameterForm
                }
                onHide={() => {

                    setShowParameterForm(
                        false
                    );

                    setParameterEditId(
                        null
                    );

                    setParameterForm(
                        parameterInitialState
                    );

                    setShowParameterConfig(
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
                            parameterEditId
                                ? "Update Gauge Parameter"
                                : "Add Gauge Parameter"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Gauge *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            parameterForm.gauge_id
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        gauge_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Gauge
                                        </option>


                                        {
                                            gauges.map(
                                                gauge => (

                                                    <option
                                                        key={
                                                            gauge.gauge_id
                                                        }
                                                        value={
                                                            gauge.gauge_id
                                                        }
                                                    >

                                                        {
                                                            gauge.gauge_code
                                                        }

                                                        {" - "}

                                                        {
                                                            gauge.gauge_name
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
                                        Parameter Code *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            parameterForm.parameter_code
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        parameter_code:
                                                            event.target.value

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
                                        Parameter Name *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            parameterForm.parameter_name
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        parameter_name:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                        maxLength={150}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Data Type
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            parameterForm.data_type
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        data_type:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        {
                                            PARAMETER_DATA_TYPES.map(
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


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Unit
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            parameterForm.unit
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        unit:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                        maxLength={30}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Nominal Value
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="any"
                                        value={
                                            parameterForm.nominal_value
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        nominal_value:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        LSL
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="any"
                                        value={
                                            parameterForm.lsl
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        lsl:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        USL
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="any"
                                        value={
                                            parameterForm.usl
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        usl:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Resolution
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="any"
                                        value={
                                            parameterForm.resolution
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        resolution:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Decimal Places
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="0"
                                        max="8"
                                        value={
                                            parameterForm.decimal_places
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        decimal_places:
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
                                        Measurement Method
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            parameterForm.measurement_method
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        measurement_method:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                        maxLength={100}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Sample Size
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            parameterForm.sample_size
                                        }
                                        onChange={
                                            event =>

                                                setParameterForm(
                                                    previous => ({

                                                        ...previous,

                                                        sample_size:
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

                                <Form.Check
                                    type="checkbox"
                                    label="Mandatory"
                                    checked={
                                        parameterForm.is_mandatory
                                    }
                                    onChange={
                                        event =>

                                            setParameterForm(
                                                previous => ({

                                                    ...previous,

                                                    is_mandatory:
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
                                        parameterForm.is_active
                                    }
                                    onChange={
                                        event =>

                                            setParameterForm(
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

                            setShowParameterForm(
                                false
                            );

                            setParameterEditId(
                                null
                            );

                            setParameterForm(
                                parameterInitialState
                            );

                            setShowParameterConfig(
                                true
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
                            saveParameter
                        }
                    >

                        {
                            saving

                                ? "Saving..."

                                : parameterEditId
                                    ? "Update Parameter"
                                    : "Save Parameter"
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
                        Gauge Calibration Schedule
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
                        emptyMessage="No Calibration Schedule Found"
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
                                ? "Update Calibration Schedule"
                                : "Add Calibration Schedule"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Gauge *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            calibrationForm.gauge_id
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        gauge_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Gauge
                                        </option>


                                        {
                                            gauges.map(
                                                gauge => (

                                                    <option
                                                        key={
                                                            gauge.gauge_id
                                                        }
                                                        value={
                                                            gauge.gauge_id
                                                        }
                                                    >

                                                        {
                                                            gauge.gauge_code
                                                        }

                                                        {" - "}

                                                        {
                                                            gauge.gauge_name
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
                                        Schedule Type *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            calibrationForm.schedule_type
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        schedule_type:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        {
                                            SCHEDULE_TYPES.map(
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

                            <Col md={4}>

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


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Frequency Usage
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            calibrationForm.frequency_usage
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        frequency_usage:
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
                                        Grace Days
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="0"
                                        value={
                                            calibrationForm.grace_days
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        grace_days:
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
                                        Last Calibration
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            calibrationForm.last_calibration_at
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        last_calibration_at:
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
                                        Next Due *
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            calibrationForm.next_due_at
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        next_due_at:
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
                                        Responsible User ID
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            calibrationForm.responsible_user_id
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        responsible_user_id:
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
                                        Status
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            calibrationForm.status
                                        }
                                        onChange={
                                            event =>

                                                setCalibrationForm(
                                                    previous => ({

                                                        ...previous,

                                                        status:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        {
                                            SCHEDULE_STATUS.map(
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


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Reminder Config
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={
                                    calibrationForm.reminder_config
                                }
                                onChange={
                                    event =>

                                        setCalibrationForm(
                                            previous => ({

                                                ...previous,

                                                reminder_config:
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
                        variant="primary"
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
                        Gauge Runtime / Event History
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
                        emptyMessage="No Gauge Events Found"
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
                        Execute Gauge Event
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Gauge *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.gauge_id
                                        }
                                        onChange={
                                            event => {

                                                const gauge =
                                                    gauges.find(
                                                        item =>
                                                            sameId(
                                                                item.gauge_id,
                                                                event.target.value
                                                            )
                                                    );


                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        gauge_id:
                                                            event.target.value,

                                                        line_id:
                                                            gauge?.line_id ||
                                                            "",

                                                        machine_id:
                                                            gauge?.machine_id ||
                                                            "",

                                                        gauge_parameter_id:
                                                            "",

                                                        calibration_schedule_id:
                                                            ""

                                                    })
                                                );

                                            }
                                        }
                                    >

                                        <option value="">
                                            Select Gauge
                                        </option>


                                        {
                                            gauges

                                                .filter(
                                                    gauge =>
                                                        gauge.status ===
                                                        "ACTIVE"
                                                )

                                                .map(
                                                    gauge => (

                                                        <option
                                                            key={
                                                                gauge.gauge_id
                                                            }
                                                            value={
                                                                gauge.gauge_id
                                                            }
                                                        >

                                                            {
                                                                gauge.gauge_code
                                                            }

                                                            {" - "}

                                                            {
                                                                gauge.gauge_name
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
                                            executeForm.event_category
                                        }
                                        onChange={
                                            event => {

                                                const type =
                                                    event.target.value;


                                                setExecuteForm(
                                                    previous => ({

                                                        ...executeInitialState,

                                                        gauge_id:
                                                            previous.gauge_id,

                                                        line_id:
                                                            previous.line_id,

                                                        machine_id:
                                                            previous.machine_id,

                                                        event_category:
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


                        {
                            executeForm.event_category ===
                            "MEASUREMENT" && (

                                <>

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
                                                        !executeForm.gauge_id
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
                                                        !executeForm.gauge_id
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


                                    <Row>

                                        <Col md={6}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Parameter *
                                                </Form.Label>

                                                <Form.Select
                                                    value={
                                                        executeForm.gauge_parameter_id
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    gauge_parameter_id:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                >

                                                    <option value="">
                                                        Select Parameter
                                                    </option>


                                                    {
                                                        executeParameters.map(
                                                            parameter => (

                                                                <option
                                                                    key={
                                                                        parameter.gauge_parameter_id
                                                                    }
                                                                    value={
                                                                        parameter.gauge_parameter_id
                                                                    }
                                                                >

                                                                    {
                                                                        parameter.parameter_code
                                                                    }

                                                                    {" - "}

                                                                    {
                                                                        parameter.parameter_name
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
                                                    Result
                                                </Form.Label>

                                                <Form.Select
                                                    value={
                                                        executeForm.measurement_result
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    measurement_result:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                >

                                                    {
                                                        MEASUREMENT_RESULTS.map(
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


                                    <Row>

                                        <Col md={4}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Measured Value
                                                </Form.Label>

                                                <Form.Control
                                                    type="number"
                                                    step="any"
                                                    value={
                                                        executeForm.measured_value
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    measured_value:
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
                                                    Measured Text
                                                </Form.Label>

                                                <Form.Control
                                                    value={
                                                        executeForm.measured_text
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    measured_text:
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
                                                    Operator User ID
                                                </Form.Label>

                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    value={
                                                        executeForm.operator_id
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    operator_id:
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


                        {
                            executeForm.event_category ===
                            "CALIBRATION" && (

                                <>

                                    <Row>

                                        <Col md={4}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Calibration Schedule
                                                </Form.Label>

                                                <Form.Select
                                                    value={
                                                        executeForm.calibration_schedule_id
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    calibration_schedule_id:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                >

                                                    <option value="">
                                                        Select Schedule
                                                    </option>


                                                    {
                                                        executeCalibrationSchedules.map(
                                                            calibration => (

                                                                <option
                                                                    key={
                                                                        calibration.calibration_schedule_id
                                                                    }
                                                                    value={
                                                                        calibration.calibration_schedule_id
                                                                    }
                                                                >

                                                                    {
                                                                        calibration.schedule_type
                                                                    }

                                                                    {" - "}

                                                                    {
                                                                        formatDateTime(
                                                                            calibration.next_due_at
                                                                        )
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
                                                    Calibration Event
                                                </Form.Label>

                                                <Form.Select
                                                    value={
                                                        executeForm.calibration_event_type
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    calibration_event_type:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                >

                                                    {
                                                        CALIBRATION_EVENT_TYPES.map(
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


                                        <Col md={4}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Result
                                                </Form.Label>

                                                <Form.Select
                                                    value={
                                                        executeForm.calibration_result
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    calibration_result:
                                                                        event.target.value

                                                                })
                                                            )
                                                    }
                                                >

                                                    {
                                                        CALIBRATION_RESULTS.map(
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


                                    <Row>

                                        <Col md={4}>

                                            <Form.Group className="mb-3">

                                                <Form.Label>
                                                    Calibrated At
                                                </Form.Label>

                                                <Form.Control
                                                    type="datetime-local"
                                                    value={
                                                        executeForm.calibrated_at
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    calibrated_at:
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
                                                    Due At
                                                </Form.Label>

                                                <Form.Control
                                                    type="datetime-local"
                                                    value={
                                                        executeForm.due_at
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    due_at:
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
                                                    Next Due
                                                </Form.Label>

                                                <Form.Control
                                                    type="datetime-local"
                                                    value={
                                                        executeForm.next_due_at
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    next_due_at:
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
                                                    Certificate No
                                                </Form.Label>

                                                <Form.Control
                                                    value={
                                                        executeForm.certificate_no
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    certificate_no:
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
                                                    Certificate URL
                                                </Form.Label>

                                                <Form.Control
                                                    value={
                                                        executeForm.certificate_url
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    certificate_url:
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
                                                    Performed By User ID
                                                </Form.Label>

                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    value={
                                                        executeForm.performed_by
                                                    }
                                                    onChange={
                                                        event =>

                                                            setExecuteForm(
                                                                previous => ({

                                                                    ...previous,

                                                                    performed_by:
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
                            executeGauge
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
                        Gauge / Instrument Report
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
                        emptyMessage="No Gauge Report Data Found"
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


export default GaugeInstrumentMaster;