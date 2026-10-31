// src/pages/NetGateway/NetGateway.jsx

import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Button,
    Card,
    Col,
    Row
} from "react-bootstrap";

import {
    Activity,
    Download,
    Eye,
    Plus,
    Send
} from "react-bootstrap-icons";


// ============================================================
// EXISTING COMMON COMPONENTS
// ============================================================

import PageHeader
    from "../../../../shared/components/PageHeader.jsx";

import SearchToolbar
    from "../../../../shared/components/SearchToolbar.jsx";

import DataTable
    from "../../../../shared/components/DataTable.jsx";

import StatusBadge
    from "../../../../shared/components/StatusBadge.jsx";

import ActionButtons
    from "../../../../shared/components/ActionButtons.jsx";

import ConfigModal
    from "../../../../shared/components/ConfigModal.jsx";

import MasterFormModal
    from "../../../../shared/components/MasterFormModal.jsx";

import RuntimeModal
    from "../../../../shared/components/RuntimeModal.jsx";

import ExecuteModal
    from "../../../../shared/components/ExecuteModal.jsx";

import ReportModal
    from "../../../../shared/components/ReportModal.jsx";

import ExportModal
    from "../../../../shared/components/ExportModal.jsx";

import ToastMessage
    from "../../../../shared/components/ToastMessage.jsx";


// ============================================================
// SERVICES
// ============================================================

import netGatewayService
    from "../api/netGateway.service.js";

import companyService
    from "../../../enterprise-setup/company-master/api/company.service.js";

import plantShopService
    from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";

import lineService
    from "../../../enterprise-setup/line-master/api/line.service.js";

import machineService
    from "../../../master-data/machine-master/api/machine.service.js";


// ============================================================
// CSS
// ============================================================

import "./NetGateway.css";


// ============================================================
// TEMPORARY / EXISTING TEST DATA
// These are actual IDs already used during API testing.
// ============================================================

const DEFAULT_COMPANY_ID =
    "8ef8acbd-de5c-4e8c-be64-00d04475a5b7";

const DEFAULT_PLANT_ID =
    "b2e8a5f6-055e-4221-b4a7-bff27353939e";

const DEFAULT_GATEWAY_ID =
    "ae40b045-e148-4785-b11e-75bc8bee5aac";

const DEFAULT_DEVICE_ID =
    "b4d03fd5-a8ee-4a3a-8ead-f62d4812fd56";

const DEFAULT_PROTOCOL_ID =
    "f3905fb9-ec4d-4547-b3eb-053f4ca3d0e4";


// ============================================================
// HELPERS
// ============================================================

const safeArray = value => {

    return Array.isArray(value)
        ? value
        : [];

};


const getErrorMessage = error => {

    return (
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.message ||
        error?.message ||
        "Something went wrong."
    );

};


const parseJson = (
    value,
    fieldName
) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return {};
    }

    if (
        typeof value === "object"
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


// ============================================================
// COMPONENT
// ============================================================

function NetGateway() {

    // ========================================================
    // TAB
    // ========================================================

    const [
        activeTab,
        setActiveTab
    ] = useState("gateway");


    // ========================================================
    // DATA
    // ========================================================

    const [
        gateways,
        setGateways
    ] = useState([]);

    const [
        devices,
        setDevices
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
        machines,
        setMachines
    ] = useState([]);


    // ========================================================
    // RUNTIME / REPORT
    // ========================================================

    const [
        runtimeData,
        setRuntimeData
    ] = useState({
        health: [],
        raw_signals: []
    });

    const [
        reportData,
        setReportData
    ] = useState({
        health: [],
        raw_signals: []
    });


    // ========================================================
    // SEARCH
    // ========================================================

    const [
        searchText,
        setSearchText
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter
    ] = useState("ALL");


    // ========================================================
    // LOADING
    // ========================================================

    const [
        loading,
        setLoading
    ] = useState(false);

    const [
        saving,
        setSaving
    ] = useState(false);

    const [
        exporting,
        setExporting
    ] = useState(false);


    // ========================================================
    // MODALS
    // ========================================================

    const [
        showGatewayForm,
        setShowGatewayForm
    ] = useState(false);

    const [
        showDeviceForm,
        setShowDeviceForm
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

    const [
        showExport,
        setShowExport
    ] = useState(false);


    // ========================================================
    // EDIT STATE
    // ========================================================

    const [
        editingGateway,
        setEditingGateway
    ] = useState(null);

    const [
        editingDevice,
        setEditingDevice
    ] = useState(null);


    // ========================================================
    // TOAST
    // ========================================================

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


    // ========================================================
    // GATEWAY FORM
    // ========================================================

    const gatewayInitialState = {

        company_id:
            DEFAULT_COMPANY_ID,

        plant_id:
            DEFAULT_PLANT_ID,

        gateway_code:
            "",

        gateway_name:
            "",

        host_name:
            "",

        site_code:
            "",

        broker_url:
            "",

        api_base_url:
            "",

        heartbeat_interval_sec:
            30,

        buffer_enabled:
            true,

        buffer_path:
            "",

        tls_enabled:
            false,

        gateway_config:
            "{}",

        status:
            "ACTIVE"

    };


    const [
        gatewayForm,
        setGatewayForm
    ] = useState(
        gatewayInitialState
    );


    // ========================================================
    // DEVICE FORM
    // ========================================================

    const deviceInitialState = {

        company_id:
            DEFAULT_COMPANY_ID,

        plant_id:
            DEFAULT_PLANT_ID,

        line_id:
            "",

        machine_id:
            "",

        gateway_id:
            DEFAULT_GATEWAY_ID,

        protocol_id:
            DEFAULT_PROTOCOL_ID,

        device_code:
            "",

        device_name:
            "",

        device_type:
            "PLC",

        make:
            "Mitsubishi",

        model:
            "FX5U",

        ip_address:
            "192.168.1.10",

        port:
            502,

        slave_id:
            1,

        endpoint:
            "192.168.1.10:502",

        polling_ms:
            1000,

        timeout_ms:
            3000,

        is_primary:
            true,

        connection_config:
            '{"protocol":"MODBUS_TCP"}',

        status:
            "ACTIVE"

    };


    const [
        deviceForm,
        setDeviceForm
    ] = useState(
        deviceInitialState
    );


    // ========================================================
    // EXECUTE FORM
    // ========================================================

    const executeInitialState = {

        type:
            "HEALTH",

        company_id:
            DEFAULT_COMPANY_ID,

        plant_id:
            DEFAULT_PLANT_ID,

        gateway_id:
            DEFAULT_GATEWAY_ID,

        machine_id:
            "",

        device_id:
            DEFAULT_DEVICE_ID,

        status:
            "ONLINE",

        is_online:
            true,

        heartbeat_ts:
            "",

        latency_ms:
            25,

        cpu_percent:
            18.5,

        memory_percent:
            42.3,

        queue_depth:
            0,

        raw_address:
            "D100",

        raw_value:
            "1234",

        data_type:
            "INTEGER",

        quality:
            "GOOD",

        source_system:
            "DOTNET_GATEWAY",

        idempotency_key:
            `HEALTH-${Date.now()}`,

        payload:
            '{"test":true}'

    };


    const [
        executeForm,
        setExecuteForm
    ] = useState(
        executeInitialState
    );


    // ========================================================
    // EXPORT FORM
    // ========================================================

    const [
        exportForm,
        setExportForm
    ] = useState({

        format:
            "CSV",

        type:
            "all",

        company_id:
            DEFAULT_COMPANY_ID,

        plant_id:
            DEFAULT_PLANT_ID,

        gateway_id:
            DEFAULT_GATEWAY_ID

    });


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        loadInitialData();

    }, []);


    const loadInitialData =
        async () => {

            try {

                setLoading(true);

                const [
    gatewayResponse,
    deviceResponse,
    companyResponse,
    plantResponse,
    lineResponse,
    machineResponse
] = await Promise.all([
    // Gateway Configuration table
    netGatewayService
        .getMaster(),

    // Gateway Devices table
    netGatewayService
        .getMaster(),

    // Company dropdown
    companyService
        .getMaster(),

    // Plant dropdown
    plantShopService
        .getMaster(),

    // Device form lookup
    lineService
        .getMaster(),

    // Device form lookup
    machineService
        .getMaster()
]);


                setGateways(
                    safeArray(
                        gatewayResponse
                            ?.data
                            ?.data
                    )
                );


                setDevices(
                    safeArray(
                        deviceResponse
                            ?.data
                            ?.data
                    )
                );


                setCompanies(
                    safeArray(
                        companyResponse
                            ?.data
                            ?.data
                    )
                );


                const plantData =
                    safeArray(
                        plantResponse
                            ?.data
                            ?.data
                    );


                setPlants(
                    plantData.filter(
                        item =>
                            item.type === "PLANT" ||
                            item.plant_id
                    )
                );


                setLines(
                    safeArray(
                        lineResponse
                            ?.data
                            ?.data
                    )
                );


                setMachines(
                    safeArray(
                        machineResponse
                            ?.data
                            ?.data
                    )
                );

            }
            catch (error) {

                console.error(
                    "NET GATEWAY LOAD ERROR:",
                    error
                );

                showToast(
                    getErrorMessage(error),
                    "danger"
                );

            }
            finally {

                setLoading(false);

            }

        };


    // ========================================================
    // FILTER GATEWAYS
    // ========================================================

    const filteredGateways =
        useMemo(() => {

            const search =
                searchText
                    .trim()
                    .toLowerCase();


            return gateways.filter(
                gateway => {

                    const text = [

                        gateway.gateway_code,

                        gateway.gateway_name,

                        gateway.host_name,

                        gateway.site_code

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    const matchesSearch =
                        !search ||
                        text.includes(search);


                    const matchesStatus =
                        statusFilter === "ALL" ||
                        gateway.status ===
                            statusFilter;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );

        }, [
            gateways,
            searchText,
            statusFilter
        ]);


    // ========================================================
    // FILTER DEVICES
    // ========================================================

    const filteredDevices =
        useMemo(() => {

            const search =
                searchText
                    .trim()
                    .toLowerCase();


            return devices.filter(
                device => {

                    const text = [

                        device.device_code,

                        device.device_name,

                        device.device_type,

                        device.make,

                        device.model,

                        device.ip_address

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    const matchesSearch =
                        !search ||
                        text.includes(search);


                    const matchesStatus =
                        statusFilter === "ALL" ||
                        device.status ===
                            statusFilter;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );

        }, [
            devices,
            searchText,
            statusFilter
        ]);


    // ========================================================
    // AVAILABLE PLANTS
    // ========================================================

    const availablePlants =
        useMemo(() => {

            if (
                !gatewayForm.company_id
            ) {
                return plants;
            }

            return plants.filter(
                plant =>
                    !plant.company_id ||
                    plant.company_id ===
                        gatewayForm.company_id
            );

        }, [
            plants,
            gatewayForm.company_id
        ]);


    // ========================================================
    // AVAILABLE DEVICE PLANTS
    // ========================================================

    const availableDevicePlants =
        useMemo(() => {

            if (
                !deviceForm.company_id
            ) {
                return plants;
            }

            return plants.filter(
                plant =>
                    !plant.company_id ||
                    plant.company_id ===
                        deviceForm.company_id
            );

        }, [
            plants,
            deviceForm.company_id
        ]);


    // ========================================================
    // AVAILABLE LINES
    // ========================================================

    const availableLines =
        useMemo(() => {

            return lines.filter(
                line => {

                    const companyMatch =
                        !deviceForm.company_id ||
                        !line.company_id ||
                        line.company_id ===
                            deviceForm.company_id;


                    const plantMatch =
                        !deviceForm.plant_id ||
                        !line.plant_id ||
                        line.plant_id ===
                            deviceForm.plant_id;


                    return (
                        companyMatch &&
                        plantMatch
                    );

                }
            );

        }, [
            lines,
            deviceForm.company_id,
            deviceForm.plant_id
        ]);


    // ========================================================
    // AVAILABLE MACHINES
    // ========================================================

    const availableMachines =
        useMemo(() => {

            return machines.filter(
                machine => {

                    const companyMatch =
                        !deviceForm.company_id ||
                        !machine.company_id ||
                        machine.company_id ===
                            deviceForm.company_id;


                    const plantMatch =
                        !deviceForm.plant_id ||
                        !machine.plant_id ||
                        machine.plant_id ===
                            deviceForm.plant_id;


                    const lineMatch =
                        !deviceForm.line_id ||
                        !machine.line_id ||
                        machine.line_id ===
                            deviceForm.line_id;


                    return (
                        companyMatch &&
                        plantMatch &&
                        lineMatch
                    );

                }
            );

        }, [
            machines,
            deviceForm.company_id,
            deviceForm.plant_id,
            deviceForm.line_id
        ]);


    // ========================================================
    // OPEN GATEWAY
    // ========================================================

    const openGateway =
        gateway => {

            setEditingGateway(
                gateway || null
            );


            if (gateway) {

                setGatewayForm({

                    ...gatewayInitialState,

                    ...gateway,

                    gateway_config:
                        JSON.stringify(
                            gateway.gateway_config ||
                                {},
                            null,
                            2
                        )

                });

            }
            else {

                setGatewayForm({
                    ...gatewayInitialState
                });

            }


            setShowGatewayForm(true);

        };


    // ========================================================
    // OPEN DEVICE
    // ========================================================

    const openDevice =
        device => {

            setEditingDevice(
                device || null
            );


            if (device) {

                setDeviceForm({

                    ...deviceInitialState,

                    ...device,

                    line_id:
                        device.line_id ||
                        "",

                    machine_id:
                        device.machine_id ||
                        "",

                    connection_config:
                        JSON.stringify(
                            device.connection_config ||
                                {},
                            null,
                            2
                        )

                });

            }
            else {

                setDeviceForm({
                    ...deviceInitialState
                });

            }


            setShowDeviceForm(true);

        };


    // ========================================================
    // SAVE GATEWAY
    // ========================================================

    const saveGateway =
        async () => {

            try {

                setSaving(true);


                const payload = {

                    ...gatewayForm,

                    gateway_config:
                        parseJson(
                            gatewayForm.gateway_config,
                            "Gateway Config"
                        )

                };


                if (
                    editingGateway?.gateway_id
                ) {

                    payload.gateway_id =
                        editingGateway.gateway_id;

                }


                await netGatewayService
                    .saveConfig(
                        payload
                    );


                showToast(
                    editingGateway
                        ? "Gateway updated successfully."
                        : "Gateway created successfully."
                );


                setShowGatewayForm(
                    false
                );


                await loadInitialData();

            }
            catch (error) {

                showToast(
                    getErrorMessage(error),
                    "danger"
                );

            }
            finally {

                setSaving(false);

            }

        };


    // ========================================================
    // SAVE DEVICE
    // ========================================================

    const saveDevice =
        async () => {

            try {

                setSaving(true);


                const payload = {

                    ...deviceForm,

                    port:
                        Number(
                            deviceForm.port
                        ),

                    slave_id:
                        Number(
                            deviceForm.slave_id
                        ),

                    polling_ms:
                        Number(
                            deviceForm.polling_ms
                        ),

                    timeout_ms:
                        Number(
                            deviceForm.timeout_ms
                        ),

                    connection_config:
                        parseJson(
                            deviceForm.connection_config,
                            "Connection Config"
                        )

                };


                if (
                    editingDevice?.device_id
                ) {

                    await netGatewayService
                        .updateMaster(
                            editingDevice.device_id,
                            payload
                        );

                }
                else {

                    await netGatewayService
                        .createMaster(
                            payload
                        );

                }


                showToast(
                    editingDevice
                        ? "Gateway device updated successfully."
                        : "Gateway device created successfully."
                );


                setShowDeviceForm(
                    false
                );


                await loadInitialData();

            }
            catch (error) {

                showToast(
                    getErrorMessage(error),
                    "danger"
                );

            }
            finally {

                setSaving(false);

            }

        };


    // ========================================================
    // RUNTIME
    // ========================================================

    const loadRuntime =
        async () => {

            try {

                setLoading(true);


                const response =
                    await netGatewayService
                        .getRuntime({

                            gateway_id:
                                DEFAULT_GATEWAY_ID

                        });


                setRuntimeData(
                    response
                        ?.data
                        ?.data || {
                            health: [],
                            raw_signals: []
                        }
                );


                setShowRuntime(true);

            }
            catch (error) {

                showToast(
                    getErrorMessage(error),
                    "danger"
                );

            }
            finally {

                setLoading(false);

            }

        };


    // ========================================================
    // EXECUTE
    // ========================================================

    const executeGateway =
        async () => {

            try {

                setSaving(true);


                const basePayload = {

                    type:
                        executeForm.type,

                    company_id:
                        executeForm.company_id,

                    plant_id:
                        executeForm.plant_id,

                    source_system:
                        executeForm.source_system,

                    idempotency_key:
                        executeForm.idempotency_key,

                    payload:
                        parseJson(
                            executeForm.payload,
                            "Payload"
                        )

                };


                let payload;


                if (
                    executeForm.type ===
                    "HEALTH"
                ) {

                    payload = {

                        ...basePayload,

                        gateway_id:
                            executeForm.gateway_id,

                        status:
                            executeForm.status,

                        is_online:
                            executeForm.is_online,

                        heartbeat_ts:
                            executeForm.heartbeat_ts ||
                            undefined,

                        latency_ms:
                            Number(
                                executeForm.latency_ms
                            ),

                        cpu_percent:
                            Number(
                                executeForm.cpu_percent
                            ),

                        memory_percent:
                            Number(
                                executeForm.memory_percent
                            ),

                        queue_depth:
                            Number(
                                executeForm.queue_depth
                            )

                    };

                }
                else {

                    payload = {

                        ...basePayload,

                        machine_id:
                            executeForm.machine_id,

                        device_id:
                            executeForm.device_id,

                        raw_address:
                            executeForm.raw_address,

                        raw_value:
                            executeForm.raw_value,

                        data_type:
                            executeForm.data_type,

                        quality:
                            executeForm.quality

                    };

                }


                await netGatewayService
                    .execute(
                        payload
                    );


                showToast(
                    "Gateway event processed successfully."
                );


                setShowExecute(
                    false
                );


                await loadRuntime();

            }
            catch (error) {

                showToast(
                    getErrorMessage(error),
                    "danger"
                );

            }
            finally {

                setSaving(false);

            }

        };


    // ========================================================
    // REPORT
    // ========================================================

    const loadReport =
        async () => {

            try {

                setLoading(true);


                const response =
                    await netGatewayService
                        .getReport({

                            type: "all",

                            gateway_id:
                                DEFAULT_GATEWAY_ID

                        });


                setReportData(
                    response
                        ?.data
                        ?.data || {
                            health: [],
                            raw_signals: []
                        }
                );


                setShowReport(true);

            }
            catch (error) {

                showToast(
                    getErrorMessage(error),
                    "danger"
                );

            }
            finally {

                setLoading(false);

            }

        };


    // ========================================================
    // EXPORT CSV
    // ========================================================

    const exportData =
        async () => {

            try {

                setExporting(true);


                const payload = {

                    type:
                        exportForm.type,

                    format:
                        exportForm.format,

                    company_id:
                        exportForm.company_id ||
                        undefined,

                    plant_id:
                        exportForm.plant_id ||
                        undefined,

                    gateway_id:
                        exportForm.gateway_id ||
                        undefined

                };


                const response =
                    await netGatewayService
                        .exportData(
                            payload
                        );


                const blob =
                    new Blob(
                        [response.data],
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


                link.href =
                    url;

                link.download =
                    `net-gateway-export-${new Date()
                        .toISOString()
                        .slice(0, 10)}.csv`;


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                window.URL.revokeObjectURL(
                    url
                );


                showToast(
                    "CSV exported successfully."
                );


                setShowExport(
                    false
                );

            }
            catch (error) {

                showToast(
                    getErrorMessage(error),
                    "danger"
                );

            }
            finally {

                setExporting(false);

            }

        };


    // ========================================================
    // GATEWAY TABLE COLUMNS
    // ========================================================

    const gatewayColumns = [

        {
            key:
                "gateway_code",

            label:
                "Gateway Code",

            render:
                row => (
                    <strong>
                        {row.gateway_code}
                    </strong>
                )

        },

        {
            key:
                "gateway_name",

            label:
                "Gateway Name"

        },

        {
            key:
                "host_name",

            label:
                "Host"

        },

        {
            key:
                "site_code",

            label:
                "Site"

        },

        {
            key:
                "broker_url",

            label:
                "Broker",

            render:
                row =>
                    row.broker_url ||
                    "—"

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


    // ========================================================
    // DEVICE TABLE COLUMNS
    // ========================================================

    const deviceColumns = [

        {
            key:
                "device_code",

            label:
                "Device Code",

            render:
                row => (
                    <strong>
                        {row.device_code}
                    </strong>
                )

        },

        {
            key:
                "device_name",

            label:
                "Device Name"

        },

        {
            key:
                "device_type",

            label:
                "Type"

        },

        {
            key:
                "make",

            label:
                "Make / Model",

            render:
                row =>
                    `${row.make || "—"} / ${
                        row.model || "—"
                    }`

        },

        {
            key:
                "ip_address",

            label:
                "IP / Port",

            render:
                row =>
                    `${row.ip_address || "—"}:${
                        row.port || "—"
                    }`

        },

        {
            key:
                "gateway_code",

            label:
                "Gateway",

            render:
                row =>
                    row.gateway_code ||
                    row.gateway_id ||
                    "—"

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


    // ========================================================
    // RUNTIME TABLES
    // ========================================================

    const runtimeHealthColumns = [

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
                "is_online",

            label:
                "Online",

            render:
                row =>
                    row.is_online
                        ? "YES"
                        : "NO"

        },

        {
            key:
                "heartbeat_ts",

            label:
                "Heartbeat"

        },

        {
            key:
                "latency_ms",

            label:
                "Latency"

        },

        {
            key:
                "cpu_percent",

            label:
                "CPU %"

        },

        {
            key:
                "memory_percent",

            label:
                "Memory %"

        },

        {
            key:
                "event_ts",

            label:
                "Event Time"

        }

    ];


    const runtimeRawColumns = [

        {
            key:
                "raw_address",

            label:
                "Address"

        },

        {
            key:
                "raw_value",

            label:
                "Value"

        },

        {
            key:
                "data_type",

            label:
                "Data Type"

        },

        {
            key:
                "quality",

            label:
                "Quality"

        },

        {
            key:
                "event_ts",

            label:
                "Event Time"

        }

    ];


    // ========================================================
    // REPORT TABLE
    // ========================================================

    const reportRows =
        useMemo(() => {

            const health =
                safeArray(
                    reportData.health
                )
                    .map(
                        row => ({
                            ...row,
                            record_type:
                                "HEALTH"
                        })
                    );


            const raw =
                safeArray(
                    reportData.raw_signals
                )
                    .map(
                        row => ({
                            ...row,
                            record_type:
                                "RAW"
                        })
                    );


            return [
                ...health,
                ...raw
            ];

        }, [
            reportData
        ]);


    const reportColumns = [

        {
            key:
                "record_type",

            label:
                "Type"

        },

        {
            key:
                "gateway_code",

            label:
                "Gateway",

            render:
                row =>
                    row.gateway_code ||
                    "—"

        },

        {
            key:
                "status",

            label:
                "Status",

            render:
                row =>
                    row.status ||
                    row.quality ||
                    "—"

        },

        {
            key:
                "event_ts",

            label:
                "Event Time"

        },

        {
            key:
                "source_system",

            label:
                "Source",

            render:
                row =>
                    row.source_system ||
                    "—"

        },

        {
            key:
                "idempotency_key",

            label:
                "Idempotency",

            render:
                row =>
                    row.idempotency_key ||
                    "—"

        }

    ];


    // ========================================================
    // FORM FIELDS
    // ========================================================

    const gatewayFields = [

        {
            name:
                "company_id",

            label:
                "Company",

            type:
                "select",

            required:
                true,

            options:
                companies.map(
                    company => ({
                        label:
                            company.company_name ||
                            company.name ||
                            company.company_id,

                        value:
                            company.company_id
                    })
                )

        },

        {
            name:
                "plant_id",

            label:
                "Plant",

            type:
                "select",

            required:
                true,

            options:
                availablePlants.map(
                    plant => ({
                        label:
                            plant.plant_name ||
                            plant.name ||
                            plant.plant_id,

                        value:
                            plant.plant_id
                    })
                )

        },

        {
            name:
                "gateway_code",

            label:
                "Gateway Code",

            required:
                true

        },

        {
            name:
                "gateway_name",

            label:
                "Gateway Name",

            required:
                true

        },

        {
            name:
                "host_name",

            label:
                "Host Name"

        },

        {
            name:
                "site_code",

            label:
                "Site Code"

        },

        {
            name:
                "broker_url",

            label:
                "Broker URL"

        },

        {
            name:
                "api_base_url",

            label:
                "API Base URL"

        },

        {
            name:
                "heartbeat_interval_sec",

            label:
                "Heartbeat Interval (sec)",

            type:
                "number"

        },

        {
            name:
                "buffer_path",

            label:
                "Buffer Path"

        },

        {
            name:
                "buffer_enabled",

            label:
                "Buffer Enabled",

            type:
                "checkbox"

        },

        {
            name:
                "tls_enabled",

            label:
                "TLS Enabled",

            type:
                "checkbox"

        },

        {
            name:
                "status",

            label:
                "Status",

            type:
                "select",

            options: [

                {
                    label:
                        "ACTIVE",

                    value:
                        "ACTIVE"
                },

                {
                    label:
                        "INACTIVE",

                    value:
                        "INACTIVE"
                }

            ]

        },

        {
            name:
                "gateway_config",

            label:
                "Gateway Config JSON",

            type:
                "textarea",

            rows:
                5

        }

    ];


    const deviceFields = [

        {
            name:
                "company_id",

            label:
                "Company",

            type:
                "select",

            required:
                true,

            options:
                companies.map(
                    company => ({
                        label:
                            company.company_name ||
                            company.name ||
                            company.company_id,

                        value:
                            company.company_id
                    })
                )

        },

        {
            name:
                "plant_id",

            label:
                "Plant",

            type:
                "select",

            required:
                true,

            options:
                availableDevicePlants.map(
                    plant => ({
                        label:
                            plant.plant_name ||
                            plant.name ||
                            plant.plant_id,

                        value:
                            plant.plant_id
                    })
                )

        },

        {
            name:
                "line_id",

            label:
                "Line",

            type:
                "select",

            options:
                availableLines.map(
                    line => ({
                        label:
                            line.line_name ||
                            line.name ||
                            line.line_id,

                        value:
                            line.line_id
                    })
                )

        },

        {
            name:
                "machine_id",

            label:
                "Machine",

            type:
                "select",

            options:
                availableMachines.map(
                    machine => ({
                        label:
                            machine.machine_name ||
                            machine.name ||
                            machine.machine_id,

                        value:
                            machine.machine_id
                    })
                )

        },

        {
            name:
                "gateway_id",

            label:
                "Gateway",

            type:
                "select",

            required:
                true,

            options:
                gateways.map(
                    gateway => ({
                        label:
                            `${gateway.gateway_code} - ${gateway.gateway_name}`,

                        value:
                            gateway.gateway_id
                    })
                )

        },

        {
            name:
                "protocol_id",

            label:
                "Protocol ID",

            required:
                true

        },

        {
            name:
                "device_code",

            label:
                "Device Code",

            required:
                true

        },

        {
            name:
                "device_name",

            label:
                "Device Name",

            required:
                true

        },

        {
            name:
                "device_type",

            label:
                "Device Type",

            type:
                "select",

            options: [

                {
                    label:
                        "PLC",

                    value:
                        "PLC"
                },

                {
                    label:
                        "SPM",

                    value:
                        "SPM"
                },

                {
                    label:
                        "OTHER",

                    value:
                        "OTHER"
                }

            ]

        },

        {
            name:
                "make",

            label:
                "Make"

        },

        {
            name:
                "model",

            label:
                "Model"

        },

        {
            name:
                "ip_address",

            label:
                "IP Address"

        },

        {
            name:
                "port",

            label:
                "Port",

            type:
                "number"

        },

        {
            name:
                "slave_id",

            label:
                "Slave ID",

            type:
                "number"

        },

        {
            name:
                "endpoint",

            label:
                "Endpoint"

        },

        {
            name:
                "polling_ms",

            label:
                "Polling (ms)",

            type:
                "number"

        },

        {
            name:
                "timeout_ms",

            label:
                "Timeout (ms)",

            type:
                "number"

        },

        {
            name:
                "is_primary",

            label:
                "Primary Device",

            type:
                "checkbox"

        },

        {
            name:
                "status",

            label:
                "Status",

            type:
                "select",

            options: [

                {
                    label:
                        "ACTIVE",

                    value:
                        "ACTIVE"
                },

                {
                    label:
                        "INACTIVE",

                    value:
                        "INACTIVE"
                }

            ]

        },

        {
            name:
                "connection_config",

            label:
                "Connection Config JSON",

            type:
                "textarea",

            rows:
                5

        }

    ];


    // ========================================================
    // EXECUTE FIELDS
    // ========================================================

    const executeFields =
        executeForm.type ===
        "HEALTH"

            ? [

                {
                    name:
                        "type",

                    label:
                        "Execution Type",

                    type:
                        "select",

                    options: [

                        {
                            label:
                                "HEALTH",

                            value:
                                "HEALTH"
                        },

                        {
                            label:
                                "RAW_SIGNAL",

                            value:
                                "RAW_SIGNAL"
                        }

                    ]

                },

                {
                    name:
                        "company_id",

                    label:
                        "Company",

                    type:
                        "select",

                    options:
                        companies.map(
                            company => ({
                                label:
                                    company.company_name ||
                                    company.name ||
                                    company.company_id,

                                value:
                                    company.company_id
                            })
                        )

                },

                {
                    name:
                        "plant_id",

                    label:
                        "Plant",

                    type:
                        "select",

                    options:
                        plants.map(
                            plant => ({
                                label:
                                    plant.plant_name ||
                                    plant.name ||
                                    plant.plant_id,

                                value:
                                    plant.plant_id
                            })
                        )

                },

                {
                    name:
                        "gateway_id",

                    label:
                        "Gateway",

                    type:
                        "select",

                    options:
                        gateways.map(
                            gateway => ({
                                label:
                                    `${gateway.gateway_code} - ${gateway.gateway_name}`,

                                value:
                                    gateway.gateway_id
                            })
                        )

                },

                {
                    name:
                        "status",

                    label:
                        "Status",

                    type:
                        "select",

                    options: [

                        {
                            label:
                                "ONLINE",

                            value:
                                "ONLINE"
                        },

                        {
                            label:
                                "OFFLINE",

                            value:
                                "OFFLINE"
                        }

                    ]

                },

                {
                    name:
                        "is_online",

                    label:
                        "Online",

                    type:
                        "checkbox"

                },

                {
                    name:
                        "heartbeat_ts",

                    label:
                        "Heartbeat Time",

                    placeholder:
                        "2026-09-16T06:36:00Z"

                },

                {
                    name:
                        "latency_ms",

                    label:
                        "Latency (ms)",

                    type:
                        "number"

                },

                {
                    name:
                        "cpu_percent",

                    label:
                        "CPU %",

                    type:
                        "number"

                },

                {
                    name:
                        "memory_percent",

                    label:
                        "Memory %",

                    type:
                        "number"

                },

                {
                    name:
                        "queue_depth",

                    label:
                        "Queue Depth",

                    type:
                        "number"

                },

                {
                    name:
                        "source_system",

                    label:
                        "Source System"

                },

                {
                    name:
                        "idempotency_key",

                    label:
                        "Idempotency Key"

                },

                {
                    name:
                        "payload",

                    label:
                        "Payload JSON",

                    type:
                        "textarea",

                    rows:
                        4

                }

            ]

            : [

                {
                    name:
                        "type",

                    label:
                        "Execution Type",

                    type:
                        "select",

                    options: [

                        {
                            label:
                                "HEALTH",

                            value:
                                "HEALTH"
                        },

                        {
                            label:
                                "RAW_SIGNAL",

                            value:
                                "RAW_SIGNAL"
                        }

                    ]

                },

                {
                    name:
                        "company_id",

                    label:
                        "Company",

                    type:
                        "select",

                    options:
                        companies.map(
                            company => ({
                                label:
                                    company.company_name ||
                                    company.name ||
                                    company.company_id,

                                value:
                                    company.company_id
                            })
                        )

                },

                {
                    name:
                        "plant_id",

                    label:
                        "Plant",

                    type:
                        "select",

                    options:
                        plants.map(
                            plant => ({
                                label:
                                    plant.plant_name ||
                                    plant.name ||
                                    plant.plant_id,

                                value:
                                    plant.plant_id
                            })
                        )

                },

                {
                    name:
                        "machine_id",

                    label:
                        "Machine",

                    type:
                        "select",

                    options:
                        machines.map(
                            machine => ({
                                label:
                                    machine.machine_name ||
                                    machine.name ||
                                    machine.machine_id,

                                value:
                                    machine.machine_id
                            })
                        )

                },

                {
                    name:
                        "device_id",

                    label:
                        "Device",

                    type:
                        "select",

                    options:
                        devices.map(
                            device => ({
                                label:
                                    `${device.device_code} - ${device.device_name}`,

                                value:
                                    device.device_id
                            })
                        )

                },

                {
                    name:
                        "raw_address",

                    label:
                        "Raw Address"

                },

                {
                    name:
                        "raw_value",

                    label:
                        "Raw Value"

                },

                {
                    name:
                        "data_type",

                    label:
                        "Data Type"

                },

                {
                    name:
                        "quality",

                    label:
                        "Quality"

                },

                {
                    name:
                        "source_system",

                    label:
                        "Source System"

                },

                {
                    name:
                        "idempotency_key",

                    label:
                        "Idempotency Key"

                },

                {
                    name:
                        "payload",

                    label:
                        "Payload JSON",

                    type:
                        "textarea",

                    rows:
                        4

                }

            ];


    // ========================================================
    // EXPORT FILTERS
    // ========================================================

    const exportFilters = [

        {
            name:
                "type",

            label:
                "Report Type",

            type:
                "select",

            options: [

                {
                    label:
                        "All",

                    value:
                        "all"
                },

                {
                    label:
                        "Health",

                    value:
                        "health"
                },

                {
                    label:
                        "Raw Signal",

                    value:
                        "raw"
                }

            ]

        },

        {
            name:
                "company_id",

            label:
                "Company",

            type:
                "select",

            options:
                companies.map(
                    company => ({
                        label:
                            company.company_name ||
                            company.name ||
                            company.company_id,

                        value:
                            company.company_id
                    })
                )

        },

        {
            name:
                "plant_id",

            label:
                "Plant",

            type:
                "select",

            options:
                plants.map(
                    plant => ({
                        label:
                            plant.plant_name ||
                            plant.name ||
                            plant.plant_id,

                        value:
                            plant.plant_id
                    })
                )

        },

        {
            name:
                "gateway_id",

            label:
                "Gateway",

            type:
                "select",

            options:
                gateways.map(
                    gateway => ({
                        label:
                            `${gateway.gateway_code} - ${gateway.gateway_name}`,

                        value:
                            gateway.gateway_id
                    })
                )

        }

    ];


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="net-gateway-page">


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <PageHeader

                title=".NET Connectivity"

                subtitle="Gateway configuration, connected devices, runtime health and reporting."

            >

                <Button
                    variant="outline-primary"
                    onClick={
                        loadRuntime
                    }
                >

                    <Activity
                        className="me-1"
                    />

                    Runtime

                </Button>


                <Button
                    variant="outline-primary"
                    onClick={
                        loadReport
                    }
                >

                    <Eye
                        className="me-1"
                    />

                    Report

                </Button>


                <Button
                    variant="dark"
                    onClick={
                        () =>
                            setShowExecute(
                                true
                            )
                    }
                >

                    <Send
                        className="me-1"
                    />

                    Execute

                </Button>

            </PageHeader>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <Row
                className="g-3 mb-4"
            >

                <Col
                    md={4}
                >

                    <Card
                        className="net-summary-card"
                    >

                        <Card.Body>

                            <div className="net-summary-label">
                                Gateways
                            </div>

                            <div className="net-summary-value">
                                {gateways.length}
                            </div>

                            <div className="net-summary-help">
                                Configured gateway records
                            </div>

                        </Card.Body>

                    </Card>

                </Col>


                <Col
                    md={4}
                >

                    <Card
                        className="net-summary-card"
                    >

                        <Card.Body>

                            <div className="net-summary-label">
                                Devices
                            </div>

                            <div className="net-summary-value">
                                {devices.length}
                            </div>

                            <div className="net-summary-help">
                                Gateway-connected devices
                            </div>

                        </Card.Body>

                    </Card>

                </Col>


                <Col
                    md={4}
                >

                    <Card
                        className="net-summary-card"
                    >

                        <Card.Body>

                            <div className="net-summary-label">
                                Online Health Events
                            </div>

                            <div className="net-summary-value">
                                {
                                    safeArray(
                                        runtimeData.health
                                    ).filter(
                                        item =>
                                            item.is_online
                                    ).length
                                }
                            </div>

                            <div className="net-summary-help">
                                Latest runtime health data
                            </div>

                        </Card.Body>

                    </Card>

                </Col>

            </Row>


            {/* =================================================
                TAB SWITCH
            ================================================= */}

            <Card
                className="border-0 shadow-sm mb-4"
            >

                <Card.Body
                    className="net-tab-bar"
                >

                    <Button

                        variant={
                            activeTab ===
                            "gateway"
                                ? "primary"
                                : "light"
                        }

                        className="me-2"

                        onClick={() => {

                            setActiveTab(
                                "gateway"
                            );

                            setSearchText(
                                ""
                            );

                            setStatusFilter(
                                "ALL"
                            );

                        }}

                    >

                        Gateway Configuration

                    </Button>


                    <Button

                        variant={
                            activeTab ===
                            "device"
                                ? "primary"
                                : "light"
                        }

                        onClick={() => {

                            setActiveTab(
                                "device"
                            );

                            setSearchText(
                                ""
                            );

                            setStatusFilter(
                                "ALL"
                            );

                        }}

                    >

                        Gateway Devices

                    </Button>

                </Card.Body>

            </Card>


            {/* =================================================
                SEARCH TOOLBAR
            ================================================= */}

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

                onExecute={() =>
                    setShowExecute(
                        true
                    )
                }

                onRuntime={
                    loadRuntime
                }

                onReport={
                    loadReport
                }

                onExport={() =>
                    setShowExport(
                        true
                    )
                }

            />


            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <Card
                className="border-0 shadow-sm mb-3"
            >

                <Card.Body
                    className="d-flex justify-content-between align-items-center"
                >

                    <div>

                        <div className="net-section-title">

                            {
                                activeTab ===
                                "gateway"
                                    ? "Gateway Configuration"
                                    : "Gateway Devices"
                            }

                        </div>

                        <div className="net-section-subtitle">

                            {
                                activeTab ===
                                "gateway"

                                    ? "Manage .NET gateway connectivity configuration."

                                    : "Manage devices connected through the .NET gateway."
                            }

                        </div>

                    </div>


                    <Button

                        variant="primary"

                        onClick={() =>
                            activeTab ===
                            "gateway"
                                ? openGateway()
                                : openDevice()
                        }

                    >

                        <Plus
                            className="me-1"
                        />

                        {
                            activeTab ===
                            "gateway"
                                ? "Add Gateway"
                                : "Add Device"
                        }

                    </Button>

                </Card.Body>

            </Card>


            {/* =================================================
                GATEWAY TABLE
            ================================================= */}

            {
                activeTab ===
                "gateway" &&

                <DataTable

                    columns={
                        gatewayColumns
                    }

                    data={
                        filteredGateways
                    }

                    loading={
                        loading
                    }

                    emptyMessage={
                        "No gateway configuration found."
                    }

                    renderActions={
                        row => (

                            <ActionButtons

                                showEdit={
                                    true
                                }

                                showDelete={
                                    false
                                }

                                onEdit={() =>
                                    openGateway(
                                        row
                                    )
                                }

                            />

                        )
                    }

                />

            }


            {/* =================================================
                DEVICE TABLE
            ================================================= */}

            {
                activeTab ===
                "device" &&

                <DataTable

                    columns={
                        deviceColumns
                    }

                    data={
                        filteredDevices
                    }

                    loading={
                        loading
                    }

                    emptyMessage={
                        "No gateway devices found."
                    }

                    renderActions={
                        row => (

                            <ActionButtons

                                showEdit={
                                    true
                                }

                                showDelete={
                                    false
                                }

                                onEdit={() =>
                                    openDevice(
                                        row
                                    )
                                }

                            />

                        )
                    }

                />

            }


            {/* =================================================
                GATEWAY CONFIG MODAL
            ================================================= */}

            <ConfigModal

                show={
                    showGatewayForm
                }

                title={
                    editingGateway
                        ? "Update Gateway Configuration"
                        : "Add Gateway Configuration"
                }

                fields={
                    gatewayFields
                }

                formData={
                    gatewayForm
                }

                setFormData={
                    setGatewayForm
                }

                saving={
                    saving
                }

                saveText={
                    editingGateway
                        ? "Update Gateway"
                        : "Save Gateway"
                }

                onClose={() =>
                    setShowGatewayForm(
                        false
                    )
                }

                onSave={
                    saveGateway
                }

            />


            {/* =================================================
                DEVICE MASTER MODAL
            ================================================= */}

            <MasterFormModal

                show={
                    showDeviceForm
                }

                title={
                    "Gateway Device"
                }

                fields={
                    deviceFields
                }

                formData={
                    deviceForm
                }

                setFormData={
                    setDeviceForm
                }

                saving={
                    saving
                }

                isEdit={
                    Boolean(
                        editingDevice
                    )
                }

                saveText={
                    "Save Device"
                }

                updateText={
                    "Update Device"
                }

                onClose={() =>
                    setShowDeviceForm(
                        false
                    )
                }

                onSave={
                    saveDevice
                }

            />


            {/* =================================================
                EXECUTE MODAL
            ================================================= */}

            <ExecuteModal

                show={
                    showExecute
                }

                title={
                    "Execute Gateway Event"
                }

                fields={
                    executeFields
                }

                formData={
                    executeForm
                }

                setFormData={
                    setExecuteForm
                }

                saving={
                    saving
                }

                onExecute={
                    executeGateway
                }

                onClose={() =>
                    setShowExecute(
                        false
                    )
                }

            />


            {/* =================================================
                RUNTIME MODAL
            ================================================= */}

            <RuntimeModal

                show={
                    showRuntime
                }

                title={
                    "Gateway Runtime"
                }

                columns={
                    runtimeHealthColumns
                }

                data={
                    safeArray(
                        runtimeData.health
                    )
                }

                loading={
                    loading
                }

                onClose={() =>
                    setShowRuntime(
                        false
                    )
                }

            />


            {/* =================================================
                REPORT MODAL
            ================================================= */}

            <ReportModal

                show={
                    showReport
                }

                title={
                    "Gateway Report"
                }

                columns={
                    reportColumns
                }

                data={
                    reportRows
                }

                loading={
                    loading
                }

                emptyMessage={
                    "No gateway report records found."
                }

                onClose={() =>
                    setShowReport(
                        false
                    )
                }

            />


            {/* =================================================
                EXPORT MODAL
            ================================================= */}

            <ExportModal

                show={
                    showExport
                }

                title={
                    "Export Gateway Data"
                }

                exportForm={
                    exportForm
                }

                setExportForm={
                    setExportForm
                }

                formats={[
                    "CSV"
                ]}

                filters={
                    exportFilters
                }

                exporting={
                    exporting
                }

                onExport={
                    exportData
                }

                onClose={() =>
                    setShowExport(
                        false
                    )
                }

            />


            {/* =================================================
                TOAST
            ================================================= */}

            <ToastMessage

                show={
                    toast.show
                }

                message={
                    toast.message
                }

                variant={
                    toast.variant
                }

                onClose={
                    hideToast
                }

            />

        </div>

    );

}


export default NetGateway;