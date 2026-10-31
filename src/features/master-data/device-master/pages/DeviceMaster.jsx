
// src/pages/DeviceMaster/DeviceMaster.jsx

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

import deviceService from "../api/device.service.js";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import plantShopService from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";
import lineService from "../../../enterprise-setup/line-master/api/line.service.js";
import machineService from "../../machine-master/api/machine.service.js";

import "./DeviceMaster.css";

function DeviceMaster() {
    const [devices, setDevices] = useState([]);
    const [protocols, setProtocols] = useState([]);
    const [gateways, setGateways] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [plants, setPlants] = useState([]);
    const [lines, setLines] = useState([]);
    const [machines, setMachines] = useState([]);
    const [runtimeData, setRuntimeData] = useState([]);
    const [reportData, setReportData] = useState([]);

    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [showProtocolConfig, setShowProtocolConfig] = useState(false);
    const [showProtocolForm, setShowProtocolForm] = useState(false);
    const [showGatewayConfig, setShowGatewayConfig] = useState(false);
    const [showGatewayForm, setShowGatewayForm] = useState(false);
    const [showRuntime, setShowRuntime] = useState(false);
    const [showExecute, setShowExecute] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const [editId, setEditId] = useState(null);

    const [toast, setToast] = useState({
        show: false,
        variant: "success",
        message: ""
    });

    const showToast = (message, variant = "success") => {
        setToast({ show: true, variant, message });
    };

    const hideToast = () => {
        setToast({ show: false, variant: "success", message: "" });
    };

    const deviceInitialState = {
        company_id: "",
        plant_id: "",
        line_id: "",
        machine_id: "",
        gateway_id: "",
        protocol_id: "",
        device_code: "",
        device_name: "",
        device_type: "PLC",
        make: "",
        model: "",
        ip_address: "",
        port: "",
        slave_id: "",
        endpoint: "",
        polling_ms: "",
        timeout_ms: "",
        is_primary: false,
        connection_config: "{}",
        status: "ACTIVE"
    };

    const protocolInitialState = {
        type: "protocol",
        company_id: "",
        protocol_code: "",
        protocol_name: "",
        transport: "TCP",
        default_port: "",
        timeout_ms: 3000,
        retry_count: 3,
        polling_ms: 1000,
        byte_order: "",
        word_order: "",
        settings: "{}",
        is_active: true
    };

    const gatewayInitialState = {
        type: "gateway",
        company_id: "",
        plant_id: "",
        gateway_code: "",
        gateway_name: "",
        host_name: "",
        site_code: "",
        broker_url: "",
        api_base_url: "",
        heartbeat_interval_sec: 30,
        buffer_enabled: true,
        buffer_path: "",
        tls_enabled: false,
        gateway_config: "{}",
        status: "ACTIVE"
    };

    const executeInitialState = {
        device_id: "",
        health_status: "HEALTHY",
        connection_status: "CONNECTED",
        latency_ms: "",
        error_code: "",
        error_message: "",
        last_success_at: "",
        event_ts: "",
        correlation_id: "",
        idempotency_key: "",
        source_system: "",
        payload: "{}"
    };

    const [formData, setFormData] = useState(deviceInitialState);
    const [protocolForm, setProtocolForm] = useState(protocolInitialState);
    const [gatewayForm, setGatewayForm] = useState(gatewayInitialState);
    const [executeForm, setExecuteForm] = useState(executeInitialState);

    const parseJson = (value, fieldName) => {
        if (value === "" || value === null || value === undefined) return {};
        if (typeof value === "object") return value;

        try {
            const parsed = JSON.parse(value);
            if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
                throw new Error();
            }
            return parsed;
        } catch {
            throw new Error(`${fieldName} must contain valid JSON object data.`);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadDevices(),
                loadProtocols(),
                loadGateways(),
                loadCompanies(),
                loadPlants(),
                loadLines(),
                loadMachines()
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadCompanies = async () => {
        const res = await companyService.getMaster();
        setCompanies(res.data.data || []);
    };

    const loadPlants = async () => {
        const res = await plantShopService.getMaster();
        const data = res.data.data || [];
        setPlants(data.filter(item => item.type === "PLANT" || item.plant_id));
    };

    const loadLines = async () => {
        const res = await lineService.getMaster();
        setLines(res.data.data || []);
    };

    const loadMachines = async () => {
        const res = await machineService.getMaster();
        setMachines(res.data.data || []);
    };

    const loadDevices = async () => {
        try {
            const res = await deviceService.getMaster();
            setDevices(res.data.data || []);
        } catch (error) {
            showToast(error.response?.data?.message || "Unable to load Device Master.", "danger");
        }
    };

    const loadProtocols = async () => {
        try {
            const res = await deviceService.getProtocolConfig();
            setProtocols(res.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const loadGateways = async () => {
        try {
            const res = await deviceService.getGatewayConfig();
            setGateways(res.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const availablePlants = useMemo(() => {
        if (!formData.company_id) return plants;
        return plants.filter(plant => !plant.company_id || plant.company_id === formData.company_id);
    }, [plants, formData.company_id]);

    const availableLines = useMemo(() => {
        return lines.filter(line => {
            const companyMatch = !formData.company_id || !line.company_id || line.company_id === formData.company_id;
            const plantMatch = !formData.plant_id || !line.plant_id || line.plant_id === formData.plant_id;
            return companyMatch && plantMatch;
        });
    }, [lines, formData.company_id, formData.plant_id]);

    const availableMachines = useMemo(() => {
        return machines.filter(machine => {
            const companyMatch = !formData.company_id || !machine.company_id || machine.company_id === formData.company_id;
            const plantMatch = !formData.plant_id || !machine.plant_id || machine.plant_id === formData.plant_id;
            const lineMatch = !formData.line_id || !machine.line_id || machine.line_id === formData.line_id;
            return companyMatch && plantMatch && lineMatch;
        });
    }, [machines, formData.company_id, formData.plant_id, formData.line_id]);

    const availableGateways = useMemo(() => {
        return gateways.filter(gateway => {
            const companyMatch = !formData.company_id || gateway.company_id === formData.company_id;
            const plantMatch = !formData.plant_id || gateway.plant_id === formData.plant_id;
            return companyMatch && plantMatch;
        });
    }, [gateways, formData.company_id, formData.plant_id]);

    const availableProtocols = useMemo(() => {
        return protocols.filter(protocol => !formData.company_id || protocol.company_id === formData.company_id);
    }, [protocols, formData.company_id]);

    const gatewayPlants = useMemo(() => {
        if (!gatewayForm.company_id) return plants;
        return plants.filter(plant => !plant.company_id || plant.company_id === gatewayForm.company_id);
    }, [plants, gatewayForm.company_id]);

    const handleChange = event => {
        const { name, value, type, checked } = event.target;
        const finalValue = type === "checkbox" ? checked : value;

        setFormData(previous => {
            const next = { ...previous, [name]: finalValue };
            if (name === "company_id") {
                next.plant_id = "";
                next.line_id = "";
                next.machine_id = "";
                next.gateway_id = "";
                next.protocol_id = "";
            }
            if (name === "plant_id") {
                next.line_id = "";
                next.machine_id = "";
                next.gateway_id = "";
            }
            if (name === "line_id") {
                next.machine_id = "";
            }
            return next;
        });
    };

    const resetForm = () => {
        setEditId(null);
        setFormData(deviceInitialState);
    };

    const openAddModal = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditModal = device => {
        setEditId(device.device_id);
        setFormData({
            company_id: device.company_id || "",
            plant_id: device.plant_id || "",
            line_id: device.line_id || "",
            machine_id: device.machine_id || "",
            gateway_id: device.gateway_id || "",
            protocol_id: device.protocol_id || "",
            device_code: device.device_code || "",
            device_name: device.device_name || "",
            device_type: device.device_type || "PLC",
            make: device.make || "",
            model: device.model || "",
            ip_address: device.ip_address || "",
            port: device.port ?? "",
            slave_id: device.slave_id ?? "",
            endpoint: device.endpoint || "",
            polling_ms: device.polling_ms ?? "",
            timeout_ms: device.timeout_ms ?? "",
            is_primary: Boolean(device.is_primary),
            connection_config: JSON.stringify(device.connection_config || {}, null, 2),
            status: device.status || "ACTIVE"
        });
        setShowForm(true);
    };

    const saveDevice = async () => {
        try {
            if (!formData.company_id || !formData.plant_id || !formData.gateway_id || !formData.protocol_id || !formData.device_code.trim() || !formData.device_name.trim() || !formData.device_type) {
                showToast("Company, Plant, Gateway, Protocol, Device Code, Device Name and Device Type are required.", "danger");
                return;
            }

            setSaving(true);

            const payload = {
                ...formData,
                line_id: formData.line_id || null,
                machine_id: formData.machine_id || null,
                make: formData.make || null,
                model: formData.model || null,
                ip_address: formData.ip_address || null,
                port: formData.port === "" ? null : Number(formData.port),
                slave_id: formData.slave_id === "" ? null : Number(formData.slave_id),
                endpoint: formData.endpoint || null,
                polling_ms: formData.polling_ms === "" ? null : Number(formData.polling_ms),
                timeout_ms: formData.timeout_ms === "" ? null : Number(formData.timeout_ms),
                connection_config: parseJson(formData.connection_config, "Connection Config")
            };

            if (editId) {
                await deviceService.updateMaster(editId, payload);
                showToast("Device updated successfully.");
            } else {
                await deviceService.createMaster(payload);
                showToast("Device created successfully.");
            }

            setShowForm(false);
            resetForm();
            await loadDevices();

        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Unable to save device.", "danger");
        } finally {
            setSaving(false);
        }
    };

    const deleteDevice = async device => {
        if (!window.confirm(`Retire device "${device.device_name}"?`)) return;
        try {
            await deviceService.deleteMaster(device.device_id);
            showToast("Device retired successfully.");
            await loadDevices();
        } catch (error) {
            showToast(error.response?.data?.message || "Unable to retire device.", "danger");
        }
    };

    const saveProtocol = async () => {
        try {
            if (!protocolForm.company_id || !protocolForm.protocol_code.trim() || !protocolForm.protocol_name.trim() || !protocolForm.transport) {
                showToast("Company, Protocol Code, Protocol Name and Transport are required.", "danger");
                return;
            }

            setSaving(true);

            const payload = {
                ...protocolForm,
                default_port: protocolForm.default_port === "" ? null : Number(protocolForm.default_port),
                timeout_ms: protocolForm.timeout_ms === "" ? null : Number(protocolForm.timeout_ms),
                retry_count: protocolForm.retry_count === "" ? null : Number(protocolForm.retry_count),
                polling_ms: protocolForm.polling_ms === "" ? null : Number(protocolForm.polling_ms),
                settings: parseJson(protocolForm.settings, "Protocol Settings")
            };

            await deviceService.createConfig(payload);
            showToast("Protocol saved successfully.");
            setProtocolForm(protocolInitialState);
            setShowProtocolForm(false);
            await loadProtocols();
            setShowProtocolConfig(true);

        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Unable to save protocol.", "danger");
        } finally {
            setSaving(false);
        }
    };

    const deleteProtocol = async protocol => {
        if (!window.confirm(`Disable protocol "${protocol.protocol_name}"?`)) return;
        try {
            await deviceService.deleteProtocol(protocol.protocol_id);
            showToast("Protocol disabled successfully.");
            await loadProtocols();
        } catch (error) {
            showToast(error.response?.data?.message || "Unable to disable protocol.", "danger");
        }
    };

    const saveGateway = async () => {
        try {
            if (!gatewayForm.company_id || !gatewayForm.plant_id || !gatewayForm.gateway_code.trim() || !gatewayForm.gateway_name.trim() || !gatewayForm.host_name.trim()) {
                showToast("Company, Plant, Gateway Code, Gateway Name and Host Name are required.", "danger");
                return;
            }

            setSaving(true);

            const payload = {
                ...gatewayForm,
                heartbeat_interval_sec: gatewayForm.heartbeat_interval_sec === "" ? null : Number(gatewayForm.heartbeat_interval_sec),
                gateway_config: parseJson(gatewayForm.gateway_config, "Gateway Config")
            };

            await deviceService.createConfig(payload);
            showToast("Gateway saved successfully.");
            setGatewayForm(gatewayInitialState);
            setShowGatewayForm(false);
            await loadGateways();
            setShowGatewayConfig(true);

        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Unable to save gateway.", "danger");
        } finally {
            setSaving(false);
        }
    };

    const deleteGateway = async gateway => {
        if (!window.confirm(`Retire gateway "${gateway.gateway_name}"?`)) return;
        try {
            await deviceService.deleteGateway(gateway.gateway_id);
            showToast("Gateway retired successfully.");
            await loadGateways();
        } catch (error) {
            showToast(error.response?.data?.message || "Unable to retire gateway.", "danger");
        }
    };

    const loadRuntime = async () => {
        try {
            setLoading(true);
            const res = await deviceService.getRuntime();
            setRuntimeData(res.data.data || []);
            setShowRuntime(true);
        } catch (error) {
            showToast(error.response?.data?.message || "Unable to load runtime.", "danger");
        } finally {
            setLoading(false);
        }
    };

    const executeDevice = async () => {
        try {
            if (!executeForm.device_id || !executeForm.health_status || !executeForm.connection_status) {
                showToast("Device, Health Status and Connection Status are required.", "danger");
                return;
            }

            setSaving(true);

            const payload = {
                ...executeForm,
                latency_ms: executeForm.latency_ms === "" ? null : Number(executeForm.latency_ms),
                error_code: executeForm.error_code || null,
                error_message: executeForm.error_message || null,
                last_success_at: executeForm.last_success_at || null,
                event_ts: executeForm.event_ts || null,
                correlation_id: executeForm.correlation_id || null,
                idempotency_key: executeForm.idempotency_key || null,
                source_system: executeForm.source_system || null,
                payload: parseJson(executeForm.payload, "Execute Payload")
            };

            const res = await deviceService.execute(payload);
            showToast(res.data.message || "Device health event recorded successfully.");
            setExecuteForm(executeInitialState);
            setShowExecute(false);

        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Execution failed.", "danger");
        } finally {
            setSaving(false);
        }
    };

    const loadReport = async () => {
        try {
            setLoading(true);
            const res = await deviceService.getReport();
            setReportData(res.data.data || []);
            setShowReport(true);
        } catch (error) {
            showToast(error.response?.data?.message || "Unable to generate report.", "danger");
        } finally {
            setLoading(false);
        }
    };

    const exportDevice = async () => {
        try {
            const res = await deviceService.exportData({
                status: statusFilter === "ALL" ? "" : statusFilter,
                line_id: ""
            });

            const blob = new Blob([res.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Device_Master.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast("CSV exported successfully.");

        } catch (error) {
            showToast(error.response?.data?.message || "Export failed.", "danger");
        }
    };

    const filteredDevices = devices.filter(device => {
        const search = searchText.trim().toLowerCase();
        const searchMatch =
            !search ||
            device.device_code?.toLowerCase().includes(search) ||
            device.device_name?.toLowerCase().includes(search) ||
            device.device_type?.toLowerCase().includes(search) ||
            device.machine_name?.toLowerCase().includes(search) ||
            device.gateway_name?.toLowerCase().includes(search) ||
            device.protocol_name?.toLowerCase().includes(search) ||
            String(device.ip_address || "").toLowerCase().includes(search);

        const statusMatch = statusFilter === "ALL" || device.status === statusFilter;
        return searchMatch && statusMatch;
    });

    const deviceColumns = [
        { key: "device_code", label: "Device Code" },
        { key: "device_name", label: "Device Name" },
        { key: "device_type", label: "Type" },
        { key: "machine_name", label: "Machine" },
        { key: "gateway_name", label: "Gateway" },
        { key: "protocol_name", label: "Protocol" },
        { key: "ip_address", label: "IP Address" },
        { key: "port", label: "Port" },
        {
            key: "status",
            label: "Status",
            render: row => <StatusBadge status={row.status} />
        }
    ];

    const protocolColumns = [
        { key: "protocol_code", label: "Code" },
        { key: "protocol_name", label: "Protocol" },
        { key: "company_name", label: "Company" },
        { key: "transport", label: "Transport" },
        { key: "default_port", label: "Port" },
        { key: "timeout_ms", label: "Timeout" },
        { key: "polling_ms", label: "Polling" },
        {
            key: "is_active",
            label: "Status",
            render: row => <StatusBadge status={row.is_active ? "ACTIVE" : "INACTIVE"} />
        }
    ];

    const gatewayColumns = [
        { key: "gateway_code", label: "Code" },
        { key: "gateway_name", label: "Gateway" },
        { key: "plant_name", label: "Plant" },
        { key: "host_name", label: "Host" },
        { key: "broker_url", label: "Broker" },
        { key: "heartbeat_interval_sec", label: "Heartbeat" },
        {
            key: "status",
            label: "Status",
            render: row => <StatusBadge status={row.status} />
        }
    ];

    const runtimeColumns = [
        { key: "device_name", label: "Device" },
        { key: "machine_name", label: "Machine" },
        {
            key: "health_status",
            label: "Health",
            render: row => (
                <Badge bg={
                    row.health_status === "HEALTHY" ? "success" :
                    row.health_status === "DEGRADED" ? "warning" :
                    row.health_status === "DOWN" ? "danger" : "secondary"
                }>
                    {row.health_status}
                </Badge>
            )
        },
        { key: "connection_status", label: "Connection" },
        { key: "latency_ms", label: "Latency (ms)" },
        { key: "error_code", label: "Error Code" },
        { key: "event_ts", label: "Event Time" }
    ];

    const reportColumns = [
        { key: "device_code", label: "Code" },
        { key: "device_name", label: "Device" },
        { key: "device_type", label: "Type" },
        { key: "plant_name", label: "Plant" },
        { key: "line_name", label: "Line" },
        { key: "machine_name", label: "Machine" },
        { key: "gateway_name", label: "Gateway" },
        { key: "protocol_name", label: "Protocol" },
        { key: "health_status", label: "Health" },
        { key: "connection_status", label: "Connection" },
        { key: "last_event", label: "Last Event" },
        {
            key: "status",
            label: "Status",
            render: row => <StatusBadge status={row.status} />
        }
    ];

    return (
        <>

<div className="device-master container-fluid">
            <Toast
                show={toast.show}
                onClose={hideToast}
                delay={3000}
                autohide
                bg={toast.variant}
                className="position-fixed top-0 end-0 m-3"
                style={{ zIndex: 9999 }}
            >
                <Toast.Body className="text-white">{toast.message}</Toast.Body>
            </Toast>

            <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                    <Row className="align-items-center g-3">
                        <Col>
                            <h3 className="mb-1">Device Master</h3>
                            <small className="text-muted">Master Data / Device Master</small>
                        </Col>
                        <Col xs="auto">
                            <div className="d-flex gap-2 flex-wrap">
                                <Button variant="outline-primary" onClick={() => { loadProtocols(); setShowProtocolConfig(true); }}>
                                    Protocol Config
                                </Button>
                                <Button variant="outline-primary" onClick={() => { loadGateways(); setShowGatewayConfig(true); }}>
                                    Gateway Config
                                </Button>
                                <Button variant="primary" onClick={openAddModal}>
                                    <Plus /> Add Device
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <SearchToolbar
                searchText={searchText}
                onSearch={setSearchText}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                onRefresh={loadInitialData}
                onExecute={() => setShowExecute(true)}
                onRuntime={loadRuntime}
                onReport={loadReport}
                onExport={exportDevice}
                placeholder="Search Device..."
            />

            <DataTable
                columns={deviceColumns}
                data={filteredDevices}
                loading={loading}
                emptyMessage="No Device Found"
                renderActions={device => (
                    <ActionButtons
                        onEdit={() => openEditModal(device)}
                        onDelete={() => deleteDevice(device)}
                    />
                )}
            />

            <Modal show={showForm} onHide={() => { resetForm(); setShowForm(false); }} centered backdrop="static" size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>{editId ? "Update Device" : "Create Device"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company *</Form.Label>
                                    <Form.Select name="company_id" value={formData.company_id} onChange={handleChange}  disabled={Boolean(editId)}>
                                        <option value="">Select Company</option>
                                        {companies.map(company => <option key={company.company_id} value={company.company_id}>{company.company_name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Plant *</Form.Label>
                                    <Form.Select name="plant_id" value={formData.plant_id} onChange={handleChange}  disabled={Boolean(editId) || !formData.company_id}>

                                        <option value="">Select Plant</option>
                                        {availablePlants.map(plant => <option key={plant.plant_id} value={plant.plant_id}>{plant.plant_name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Line</Form.Label>
                                    <Form.Select name="line_id" value={formData.line_id} onChange={handleChange} disabled={Boolean(editId)  || !formData.plant_id}>
                                        <option value="">Select Line</option>
                                        {availableLines.map(line => <option key={line.line_id} value={line.line_id}>{line.line_name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Machine</Form.Label>
                                    <Form.Select
    name="machine_id"
    value={formData.machine_id}
    onChange={handleChange}
    disabled={Boolean(editId) || !formData.line_id}
>
    <option value="">Select Machine</option>

    {availableMachines.map(machine => (
        <option
            key={machine.machine_id}
            value={machine.machine_id}
        >
            {machine.machine_name}
        </option>
    ))}
</Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Gateway *</Form.Label>
                                    <Form.Select name="gateway_id" value={formData.gateway_id} onChange={handleChange} disabled={Boolean(editId) ||!formData.plant_id}>
                                        <option value="">Select Gateway</option>
                                        {availableGateways.map(gateway => <option key={gateway.gateway_id} value={gateway.gateway_id}>{gateway.gateway_name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Protocol *</Form.Label>
                                    <Form.Select name="protocol_id" value={formData.protocol_id} onChange={handleChange} disabled={Boolean(editId) ||!formData.company_id}>
                                        <option value="">Select Protocol</option>
                                        {availableProtocols.map(protocol => <option key={protocol.protocol_id} value={protocol.protocol_id}>{protocol.protocol_name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Device Code *</Form.Label>
                                    <Form.Control name="device_code" value={formData.device_code} onChange={handleChange} placeholder="PLC-ST10-001" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Device Name *</Form.Label>
                                    <Form.Control name="device_name" value={formData.device_name} onChange={handleChange} placeholder="ST10 Main PLC" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Device Type *</Form.Label>
                                    <Form.Select name="device_type" value={formData.device_type} onChange={handleChange}>
                                        <option value="PLC">PLC</option>
                                        <option value="SCANNER">SCANNER</option>
                                        <option value="TOOL">TOOL</option>
                                        <option value="SENSOR">SENSOR</option>
                                        <option value="GAUGE">GAUGE</option>
                                        <option value="CONTROLLER">CONTROLLER</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Make</Form.Label>
                                    <Form.Control name="make" value={formData.make} onChange={handleChange} placeholder="Mitsubishi" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Model</Form.Label>
                                    <Form.Control name="model" value={formData.model} onChange={handleChange} placeholder="FX5U-32MT" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Endpoint</Form.Label>
                                    <Form.Control name="endpoint" value={formData.endpoint} onChange={handleChange} placeholder="Topic / Path / Endpoint" />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>IP Address</Form.Label>
                                    <Form.Control name="ip_address" value={formData.ip_address} onChange={handleChange} placeholder="192.168.1.20" />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Port</Form.Label>
                                    <Form.Control type="number" name="port" value={formData.port} onChange={handleChange} placeholder="502" />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Slave ID</Form.Label>
                                    <Form.Control type="number" name="slave_id" value={formData.slave_id} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select name="status" value={formData.status} onChange={handleChange}>
                                        <option value="DRAFT">DRAFT</option>
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                        <option value="RETIRED">RETIRED</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Polling (ms)</Form.Label>
                                    <Form.Control type="number" name="polling_ms" value={formData.polling_ms} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Timeout (ms)</Form.Label>
                                    <Form.Control type="number" name="timeout_ms" value={formData.timeout_ms} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3 mt-4">
                                    <Form.Check type="checkbox" name="is_primary" label="Primary Device" checked={formData.is_primary} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Connection Config (JSON)</Form.Label>
                            <Form.Control as="textarea" rows={4} name="connection_config" value={formData.connection_config} onChange={handleChange} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</Button>
                    <Button variant="primary" disabled={saving} onClick={saveDevice}>
                        {saving ? <><Spinner size="sm" animation="border" className="me-2" />Saving...</> : editId ? "Update Device" : "Save Device"}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showProtocolConfig} onHide={() => setShowProtocolConfig(false)} centered size="xl">
                <Modal.Header closeButton><Modal.Title>Protocol Configuration</Modal.Title></Modal.Header>
                <Modal.Body>
                    <div className="d-flex justify-content-end mb-3">
                        <Button onClick={() => { setProtocolForm(protocolInitialState); setShowProtocolConfig(false); setShowProtocolForm(true); }}><Plus /> Add Protocol</Button>
                    </div>
                    <DataTable
                        columns={protocolColumns}
                        data={protocols}
                        emptyMessage="No Protocol Found"
                        renderActions={protocol => <ActionButtons showEdit={false} onDelete={() => deleteProtocol(protocol)} />}
                    />
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowProtocolConfig(false)}>Close</Button></Modal.Footer>
            </Modal>

            <Modal show={showProtocolForm} onHide={() => { setShowProtocolForm(false); setProtocolForm(protocolInitialState); }} centered backdrop="static" size="lg">
                <Modal.Header closeButton><Modal.Title>Add Protocol</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company *</Form.Label>
                                    <Form.Select value={protocolForm.company_id} onChange={e => setProtocolForm(p => ({ ...p, company_id: e.target.value }))}>
                                        <option value="">Select Company</option>
                                        {companies.map(company => <option key={company.company_id} value={company.company_id}>{company.company_name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Protocol Code *</Form.Label>
                                    <Form.Control value={protocolForm.protocol_code} onChange={e => setProtocolForm(p => ({ ...p, protocol_code: e.target.value }))} placeholder="MODBUS_TCP" />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Protocol Name *</Form.Label>
                                    <Form.Control value={protocolForm.protocol_name} onChange={e => setProtocolForm(p => ({ ...p, protocol_name: e.target.value }))} placeholder="Modbus TCP" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Transport *</Form.Label>
                                    <Form.Select value={protocolForm.transport} onChange={e => setProtocolForm(p => ({ ...p, transport: e.target.value }))}>
                                        <option value="TCP">TCP</option>
                                        <option value="UDP">UDP</option>
                                        <option value="SERIAL">SERIAL</option>
                                        <option value="MQTT">MQTT</option>
                                        <option value="HTTP">HTTP</option>
                                        <option value="VENDOR">VENDOR</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Default Port</Form.Label><Form.Control type="number" value={protocolForm.default_port} onChange={e => setProtocolForm(p => ({ ...p, default_port: e.target.value }))} /></Form.Group></Col>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Timeout (ms)</Form.Label><Form.Control type="number" value={protocolForm.timeout_ms} onChange={e => setProtocolForm(p => ({ ...p, timeout_ms: e.target.value }))} /></Form.Group></Col>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Retry Count</Form.Label><Form.Control type="number" value={protocolForm.retry_count} onChange={e => setProtocolForm(p => ({ ...p, retry_count: e.target.value }))} /></Form.Group></Col>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Polling (ms)</Form.Label><Form.Control type="number" value={protocolForm.polling_ms} onChange={e => setProtocolForm(p => ({ ...p, polling_ms: e.target.value }))} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Byte Order</Form.Label><Form.Control value={protocolForm.byte_order} onChange={e => setProtocolForm(p => ({ ...p, byte_order: e.target.value }))} placeholder="BIG_ENDIAN" /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Word Order</Form.Label><Form.Control value={protocolForm.word_order} onChange={e => setProtocolForm(p => ({ ...p, word_order: e.target.value }))} placeholder="BIG_ENDIAN" /></Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-3"><Form.Label>Settings (JSON)</Form.Label><Form.Control as="textarea" rows={4} value={protocolForm.settings} onChange={e => setProtocolForm(p => ({ ...p, settings: e.target.value }))} /></Form.Group>
                        <Form.Check type="checkbox" label="Active" checked={protocolForm.is_active} onChange={e => setProtocolForm(p => ({ ...p, is_active: e.target.checked }))} />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowProtocolForm(false); setProtocolForm(protocolInitialState); setShowProtocolConfig(true); }}>Cancel</Button>
                    <Button disabled={saving} onClick={saveProtocol}>{saving ? "Saving..." : "Save Protocol"}</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showGatewayConfig} onHide={() => setShowGatewayConfig(false)} centered size="xl">
                <Modal.Header closeButton><Modal.Title>Gateway Configuration</Modal.Title></Modal.Header>
                <Modal.Body>
                    <div className="d-flex justify-content-end mb-3">
                        <Button onClick={() => { setGatewayForm(gatewayInitialState); setShowGatewayConfig(false); setShowGatewayForm(true); }}><Plus /> Add Gateway</Button>
                    </div>
                    <DataTable
                        columns={gatewayColumns}
                        data={gateways}
                        emptyMessage="No Gateway Found"
                        renderActions={gateway => <ActionButtons showEdit={false} onDelete={() => deleteGateway(gateway)} />}
                    />
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowGatewayConfig(false)}>Close</Button></Modal.Footer>
            </Modal>

            <Modal show={showGatewayForm} onHide={() => { setShowGatewayForm(false); setGatewayForm(gatewayInitialState); }} centered backdrop="static" size="lg">
                <Modal.Header closeButton><Modal.Title>Add Gateway</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Company *</Form.Label><Form.Select value={gatewayForm.company_id} onChange={e => setGatewayForm(p => ({ ...p, company_id: e.target.value, plant_id: "" }))}><option value="">Select Company</option>{companies.map(company => <option key={company.company_id} value={company.company_id}>{company.company_name}</option>)}</Form.Select></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Plant *</Form.Label><Form.Select value={gatewayForm.plant_id} onChange={e => setGatewayForm(p => ({ ...p, plant_id: e.target.value }))} disabled={!gatewayForm.company_id}><option value="">Select Plant</option>{gatewayPlants.map(plant => <option key={plant.plant_id} value={plant.plant_id}>{plant.plant_name}</option>)}</Form.Select></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Gateway Code *</Form.Label><Form.Control value={gatewayForm.gateway_code} onChange={e => setGatewayForm(p => ({ ...p, gateway_code: e.target.value }))} placeholder="GW001" /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Gateway Name *</Form.Label><Form.Control value={gatewayForm.gateway_name} onChange={e => setGatewayForm(p => ({ ...p, gateway_name: e.target.value }))} placeholder="Neemrana Gateway" /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Host Name *</Form.Label><Form.Control value={gatewayForm.host_name} onChange={e => setGatewayForm(p => ({ ...p, host_name: e.target.value }))} placeholder="OPX-GW-01" /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Site Code</Form.Label><Form.Control value={gatewayForm.site_code} onChange={e => setGatewayForm(p => ({ ...p, site_code: e.target.value }))} placeholder="NMR" /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Broker URL</Form.Label><Form.Control value={gatewayForm.broker_url} onChange={e => setGatewayForm(p => ({ ...p, broker_url: e.target.value }))} placeholder="mqtt://192.168.1.100:1883" /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>API Base URL</Form.Label><Form.Control value={gatewayForm.api_base_url} onChange={e => setGatewayForm(p => ({ ...p, api_base_url: e.target.value }))} placeholder="http://192.168.1.50:4000/api" /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Heartbeat (Sec)</Form.Label><Form.Control type="number" value={gatewayForm.heartbeat_interval_sec} onChange={e => setGatewayForm(p => ({ ...p, heartbeat_interval_sec: e.target.value }))} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Buffer Path</Form.Label><Form.Control value={gatewayForm.buffer_path} onChange={e => setGatewayForm(p => ({ ...p, buffer_path: e.target.value }))} placeholder="C:/OperateX/buffer" /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select value={gatewayForm.status} onChange={e => setGatewayForm(p => ({ ...p, status: e.target.value }))}><option value="DRAFT">DRAFT</option><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="RETIRED">RETIRED</option></Form.Select></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Check type="checkbox" label="Buffer Enabled" checked={gatewayForm.buffer_enabled} onChange={e => setGatewayForm(p => ({ ...p, buffer_enabled: e.target.checked }))} /></Col>
                            <Col md={6}><Form.Check type="checkbox" label="TLS Enabled" checked={gatewayForm.tls_enabled} onChange={e => setGatewayForm(p => ({ ...p, tls_enabled: e.target.checked }))} /></Col>
                        </Row>
                        <Form.Group className="mt-3 mb-3"><Form.Label>Gateway Config (JSON)</Form.Label><Form.Control as="textarea" rows={4} value={gatewayForm.gateway_config} onChange={e => setGatewayForm(p => ({ ...p, gateway_config: e.target.value }))} /></Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowGatewayForm(false); setGatewayForm(gatewayInitialState); setShowGatewayConfig(true); }}>Cancel</Button>
                    <Button disabled={saving} onClick={saveGateway}>{saving ? "Saving..." : "Save Gateway"}</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showRuntime} onHide={() => setShowRuntime(false)} centered size="xl">
                <Modal.Header closeButton><Modal.Title>Device Runtime / Health History</Modal.Title></Modal.Header>
                <Modal.Body><DataTable columns={runtimeColumns} data={runtimeData} loading={loading} emptyMessage="No Device Health Events Found" /></Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowRuntime(false)}>Close</Button></Modal.Footer>
            </Modal>

            <Modal show={showExecute} onHide={() => setShowExecute(false)} centered backdrop="static" size="lg">
                <Modal.Header closeButton><Modal.Title>Execute Device Health Event</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Device *</Form.Label><Form.Select value={executeForm.device_id} onChange={e => setExecuteForm(p => ({ ...p, device_id: e.target.value }))}><option value="">Select Device</option>{devices.filter(device => device.status !== "RETIRED").map(device => <option key={device.device_id} value={device.device_id}>{device.device_name}</option>)}</Form.Select></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Health Status *</Form.Label><Form.Select value={executeForm.health_status} onChange={e => setExecuteForm(p => ({ ...p, health_status: e.target.value }))}><option value="HEALTHY">HEALTHY</option><option value="DEGRADED">DEGRADED</option><option value="DOWN">DOWN</option><option value="UNKNOWN">UNKNOWN</option></Form.Select></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Connection Status *</Form.Label><Form.Select value={executeForm.connection_status} onChange={e => setExecuteForm(p => ({ ...p, connection_status: e.target.value }))}><option value="CONNECTED">CONNECTED</option><option value="DISCONNECTED">DISCONNECTED</option><option value="TIMEOUT">TIMEOUT</option><option value="ERROR">ERROR</option></Form.Select></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Latency (ms)</Form.Label><Form.Control type="number" value={executeForm.latency_ms} onChange={e => setExecuteForm(p => ({ ...p, latency_ms: e.target.value }))} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Error Code</Form.Label><Form.Control value={executeForm.error_code} onChange={e => setExecuteForm(p => ({ ...p, error_code: e.target.value }))} /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Source System</Form.Label><Form.Control value={executeForm.source_system} onChange={e => setExecuteForm(p => ({ ...p, source_system: e.target.value }))} placeholder="GATEWAY-01" /></Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-3"><Form.Label>Error Message</Form.Label><Form.Control as="textarea" rows={2} value={executeForm.error_message} onChange={e => setExecuteForm(p => ({ ...p, error_message: e.target.value }))} /></Form.Group>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Last Success At</Form.Label><Form.Control type="datetime-local" value={executeForm.last_success_at} onChange={e => setExecuteForm(p => ({ ...p, last_success_at: e.target.value }))} /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Event Time</Form.Label><Form.Control type="datetime-local" value={executeForm.event_ts} onChange={e => setExecuteForm(p => ({ ...p, event_ts: e.target.value }))} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Correlation ID</Form.Label><Form.Control value={executeForm.correlation_id} onChange={e => setExecuteForm(p => ({ ...p, correlation_id: e.target.value }))} /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Idempotency Key</Form.Label><Form.Control value={executeForm.idempotency_key} onChange={e => setExecuteForm(p => ({ ...p, idempotency_key: e.target.value }))} /></Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-3"><Form.Label>Payload (JSON)</Form.Label><Form.Control as="textarea" rows={4} value={executeForm.payload} onChange={e => setExecuteForm(p => ({ ...p, payload: e.target.value }))} /></Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExecute(false)}>Cancel</Button>
                    <Button variant="primary" disabled={saving} onClick={executeDevice}>{saving ? "Saving..." : "Execute"}</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showReport} onHide={() => setShowReport(false)} centered size="xl">
                <Modal.Header closeButton><Modal.Title>Device Report</Modal.Title></Modal.Header>
                <Modal.Body><DataTable columns={reportColumns} data={reportData} loading={loading} emptyMessage="No Device Report Data Found" /></Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowReport(false)}>Close</Button></Modal.Footer>
            </Modal>
        </div>
</>
    );
}

export default DeviceMaster;