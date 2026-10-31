
// src/pages/SignalMapping/SignalMapping.jsx

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

import signalService from "../api/signal.service.js";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import plantShopService from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";
import lineService from "../../../enterprise-setup/line-master/api/line.service.js";
import machineService from "../../machine-master/api/machine.service.js";
import deviceService from "../../device-master/api/device.service.js";

import "./SignalMapping.css";

const ACCESS_MODES = ["READ", "WRITE", "READ_WRITE"];
const QUALITY_VALUES = ["GOOD", "BAD", "UNCERTAIN", "TIMEOUT", "ERROR"];
const TAG_CATEGORIES = ["PRODUCTION", "QUALITY", "STATUS", "ALARM", "TRACEABILITY"];
const TAG_DATA_TYPES = ["BOOLEAN", "INTEGER", "NUMERIC", "STRING", "DATETIME", "JSON"];
const SIGNAL_DATA_TYPES = [
    "BOOLEAN",
    "INT16",
    "UINT16",
    "INT32",
    "UINT32",
    "INTEGER",
    "NUMERIC",
    "FLOAT",
    "DOUBLE",
    "STRING",
    "DATETIME",
    "JSON"
];
const ADDRESS_TYPES = ["REGISTER", "COIL", "TAG", "TOPIC", "FILE"];

const emptyMapping = {
    company_id: "",
    plant_id: "",
    line_id: "",
    machine_id: "",
    device_id: "",
    tag_id: "",
    address_map_id: "",
    signal_code: "",
    raw_address: "",
    bit_index: "",
    data_type: "BOOLEAN",
    access_mode: "READ",
    scale_factor: 1,
    offset_value: 0,
    deadband: "",
    polling_ms: "",
    publish_topic: "",
    is_mandatory: false,
    is_active: true,
    effective_from: "",
    effective_to: ""
};

const emptyTag = {
    company_id: "",
    tag_code: "",
    tag_name: "",
    category: "PRODUCTION",
    data_type: "BOOLEAN",
    unit: "",
    description: "",
    default_value: "",
    allowed_values: "[]",
    is_mandatory: false,
    is_active: true
};

const emptyAddressMap = {
    company_id: "",
    protocol_id: "",
    address_type: "REGISTER",
    address_pattern: "",
    start_address: "",
    length: 1,
    bit_index: "",
    data_type: "UINT16",
    byte_order: "",
    word_order: "",
    validation_regex: "",
    map_config: "{}",
    is_active: true
};

const emptyExecute = {
    signal_mapping_id: "",
    raw_value: "",
    quality: "GOOD",
    received_at: "",
    event_ts: "",
    correlation_id: "",
    idempotency_key: "",
    source_system: "",
    payload: "{}"
};

function SignalMapping() {
    // =====================================================
    // DATA
    // =====================================================
    const [mappings, setMappings] = useState([]);
    const [tags, setTags] = useState([]);
    const [addressMaps, setAddressMaps] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [plants, setPlants] = useState([]);
    const [lines, setLines] = useState([]);
    const [machines, setMachines] = useState([]);
    const [devices, setDevices] = useState([]);

    // Protocol is READ ONLY here.
    // Protocol configuration itself belongs to Device Master.
    const [protocols, setProtocols] = useState([]);

    const [runtimeData, setRuntimeData] = useState([]);
    const [reportData, setReportData] = useState([]);

    // =====================================================
    // UI STATE
    // =====================================================
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [showMappingForm, setShowMappingForm] = useState(false);
    const [showTagList, setShowTagList] = useState(false);
    const [showTagForm, setShowTagForm] = useState(false);
    const [showAddressMapList, setShowAddressMapList] = useState(false);
    const [showAddressMapForm, setShowAddressMapForm] = useState(false);
    const [showRuntime, setShowRuntime] = useState(false);
    const [showExecute, setShowExecute] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const [mappingEditId, setMappingEditId] = useState(null);
    const [tagEditId, setTagEditId] = useState(null);
    const [addressMapEditId, setAddressMapEditId] = useState(null);

    const [mappingForm, setMappingForm] = useState(emptyMapping);
    const [tagForm, setTagForm] = useState(emptyTag);
    const [addressMapForm, setAddressMapForm] = useState(emptyAddressMap);
    const [executeForm, setExecuteForm] = useState(emptyExecute);

    const [toast, setToast] = useState({
        show: false,
        variant: "success",
        message: ""
    });

    const showToast = (message, variant = "success") => {
        setToast({ show: true, variant, message });
    };

    // =====================================================
    // HELPERS
    // =====================================================
    const parseJsonObject = (value, label) => {
        if (value === "" || value === null || value === undefined) return {};
        if (typeof value === "object" && !Array.isArray(value)) return value;

        try {
            const parsed = JSON.parse(value);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                throw new Error();
            }
            return parsed;
        } catch {
            throw new Error(`${label} must contain a valid JSON object.`);
        }
    };

    const parseJsonArray = (value, label) => {
        if (value === "" || value === null || value === undefined) return [];
        if (Array.isArray(value)) return value;

        try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) throw new Error();
            return parsed;
        } catch {
            throw new Error(`${label} must contain a valid JSON array.`);
        }
    };

    const toLocalDateTime = value => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================
    useEffect(() => {
        loadInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);

            const results = await Promise.allSettled([
                signalService.getMaster(),
                signalService.getTagDictionary(),
                signalService.getAddressMaps(),
                companyService.getMaster(),
                plantShopService.getMaster(),
                lineService.getMaster(),
                machineService.getMaster(),
                deviceService.getMaster(),
                deviceService.getProtocolConfig()
            ]);

            const [
                mappingRes,
                tagRes,
                addressMapRes,
                companyRes,
                plantRes,
                lineRes,
                machineRes,
                deviceRes,
                protocolRes
            ] = results;

            if (mappingRes.status === "fulfilled") {
                setMappings(mappingRes.value.data.data || []);
            }

            if (tagRes.status === "fulfilled") {
                setTags(tagRes.value.data.data || []);
            }

            if (addressMapRes.status === "fulfilled") {
                setAddressMaps(addressMapRes.value.data.data || []);
            }

            if (companyRes.status === "fulfilled") {
                setCompanies(companyRes.value.data.data || []);
            }

            if (plantRes.status === "fulfilled") {
                const data = plantRes.value.data.data || [];
                setPlants(data.filter(x => x.type === "PLANT" || x.plant_id));
            }

            if (lineRes.status === "fulfilled") {
                setLines(lineRes.value.data.data || []);
            }

            if (machineRes.status === "fulfilled") {
                setMachines(machineRes.value.data.data || []);
            }

            if (deviceRes.status === "fulfilled") {
                setDevices(deviceRes.value.data.data || []);
            }

            if (protocolRes.status === "fulfilled") {
                setProtocols(protocolRes.value.data.data || []);
            }
        } catch (error) {
            showToast(
                error.response?.data?.message || "Unable to load Signal Mapping data.",
                "danger"
            );
        } finally {
            setLoading(false);
        }
    };

    const loadMappings = async () => {
        const res = await signalService.getMaster();
        setMappings(res.data.data || []);
    };

    const loadTags = async () => {
        const res = await signalService.getTagDictionary();
        setTags(res.data.data || []);
    };

    const loadAddressMaps = async () => {
        const res = await signalService.getAddressMaps();
        setAddressMaps(res.data.data || []);
    };

    // =====================================================
    // DEPENDENT DROPDOWNS
    // =====================================================
    const availablePlants = useMemo(() => {
        if (!mappingForm.company_id) return plants;
        return plants.filter(
            item => !item.company_id || item.company_id === mappingForm.company_id
        );
    }, [plants, mappingForm.company_id]);

    const availableLines = useMemo(() => {
        return lines.filter(item => {
            const companyOk =
                !mappingForm.company_id ||
                !item.company_id ||
                item.company_id === mappingForm.company_id;

            const plantOk =
                !mappingForm.plant_id ||
                !item.plant_id ||
                item.plant_id === mappingForm.plant_id;

            return companyOk && plantOk;
        });
    }, [lines, mappingForm.company_id, mappingForm.plant_id]);

    const availableMachines = useMemo(() => {
        return machines.filter(item => {
            const companyOk =
                !mappingForm.company_id ||
                !item.company_id ||
                item.company_id === mappingForm.company_id;

            const plantOk =
                !mappingForm.plant_id ||
                !item.plant_id ||
                item.plant_id === mappingForm.plant_id;

            const lineOk =
                !mappingForm.line_id ||
                !item.line_id ||
                item.line_id === mappingForm.line_id;

            return companyOk && plantOk && lineOk;
        });
    }, [machines, mappingForm.company_id, mappingForm.plant_id, mappingForm.line_id]);

    const availableDevices = useMemo(() => {
        return devices.filter(item => {
            const companyOk =
                !mappingForm.company_id || item.company_id === mappingForm.company_id;

            const plantOk =
                !mappingForm.plant_id || item.plant_id === mappingForm.plant_id;

            const lineOk =
                !mappingForm.line_id ||
                !item.line_id ||
                item.line_id === mappingForm.line_id;

            const machineOk =
                !mappingForm.machine_id ||
                !item.machine_id ||
                item.machine_id === mappingForm.machine_id;

            return companyOk && plantOk && lineOk && machineOk && item.status !== "RETIRED";
        });
    }, [devices, mappingForm.company_id, mappingForm.plant_id, mappingForm.line_id, mappingForm.machine_id]);

    const availableTags = useMemo(() => {
        return tags.filter(
            item =>
                (!mappingForm.company_id || item.company_id === mappingForm.company_id) &&
                item.is_active !== false
        );
    }, [tags, mappingForm.company_id]);

    const selectedDevice = useMemo(() => {
        return devices.find(item => item.device_id === mappingForm.device_id);
    }, [devices, mappingForm.device_id]);

    const availableAddressMaps = useMemo(() => {
        return addressMaps.filter(item => {
            const companyOk =
                !mappingForm.company_id || item.company_id === mappingForm.company_id;

            const protocolOk =
                !selectedDevice?.protocol_id || item.protocol_id === selectedDevice.protocol_id;

            return companyOk && protocolOk && item.is_active !== false;
        });
    }, [addressMaps, mappingForm.company_id, selectedDevice]);

    const availableTagCompanies = companies;

    const availableAddressProtocols = useMemo(() => {
        return protocols.filter(
            item =>
                !addressMapForm.company_id || item.company_id === addressMapForm.company_id
        );
    }, [protocols, addressMapForm.company_id]);

    // =====================================================
    // MAPPING FORM CHANGE
    // =====================================================
    const handleMappingChange = event => {
        const { name, value, type, checked } = event.target;
        const finalValue = type === "checkbox" ? checked : value;

        setMappingForm(previous => {
            const next = { ...previous, [name]: finalValue };

            if (name === "company_id") {
                next.plant_id = "";
                next.line_id = "";
                next.machine_id = "";
                next.device_id = "";
                next.tag_id = "";
                next.address_map_id = "";
            }

            if (name === "plant_id") {
                next.line_id = "";
                next.machine_id = "";
                next.device_id = "";
                next.address_map_id = "";
            }

            if (name === "line_id") {
                next.machine_id = "";
                next.device_id = "";
                next.address_map_id = "";
            }

            if (name === "machine_id") {
                next.device_id = "";
                next.address_map_id = "";
            }

            if (name === "device_id") {
                next.address_map_id = "";
            }

            return next;
        });
    };

    // =====================================================
    // MACHINE SIGNAL MAPPING CRUD
    // =====================================================
    const openAddMapping = () => {
        setMappingEditId(null);
        setMappingForm(emptyMapping);
        setShowMappingForm(true);
    };

    const openEditMapping = row => {
        setMappingEditId(row.signal_mapping_id);
        setMappingForm({
            company_id: row.company_id || "",
            plant_id: row.plant_id || "",
            line_id: row.line_id || "",
            machine_id: row.machine_id || "",
            device_id: row.device_id || "",
            tag_id: row.tag_id || "",
            address_map_id: row.address_map_id || "",
            signal_code: row.signal_code || "",
            raw_address: row.raw_address || "",
            bit_index: row.bit_index ?? "",
            data_type: row.data_type || "BOOLEAN",
            access_mode: row.access_mode || "READ",
            scale_factor: row.scale_factor ?? 1,
            offset_value: row.offset_value ?? 0,
            deadband: row.deadband ?? "",
            polling_ms: row.polling_ms ?? "",
            publish_topic: row.publish_topic || "",
            is_mandatory: Boolean(row.is_mandatory),
            is_active: row.is_active !== false,
            effective_from: toLocalDateTime(row.effective_from),
            effective_to: toLocalDateTime(row.effective_to)
        });
        setShowMappingForm(true);
    };

    const saveMapping = async () => {
        try {
            if (
                !mappingForm.company_id ||
                !mappingForm.plant_id ||
                !mappingForm.machine_id ||
                !mappingForm.device_id ||
                !mappingForm.tag_id ||
                !mappingForm.signal_code.trim() ||
                !mappingForm.raw_address.trim() ||
                !mappingForm.data_type
            ) {
                showToast(
                    "Company, Plant, Machine, Device, Tag, Signal Code, Raw Address and Data Type are required.",
                    "danger"
                );
                return;
            }

            setSaving(true);

            const payload = {
                company_id: mappingForm.company_id,
                plant_id: mappingForm.plant_id,
                line_id: mappingForm.line_id || null,
                machine_id: mappingForm.machine_id,
                device_id: mappingForm.device_id,
                tag_id: mappingForm.tag_id,
                address_map_id: mappingForm.address_map_id || null,
                signal_code: mappingForm.signal_code.trim(),
                raw_address: mappingForm.raw_address.trim(),
                bit_index: mappingForm.bit_index === "" ? null : Number(mappingForm.bit_index),
                data_type: mappingForm.data_type,
                access_mode: mappingForm.access_mode || "READ",
                scale_factor: mappingForm.scale_factor === "" ? 1 : Number(mappingForm.scale_factor),
                offset_value: mappingForm.offset_value === "" ? 0 : Number(mappingForm.offset_value),
                deadband: mappingForm.deadband === "" ? null : Number(mappingForm.deadband),
                polling_ms: mappingForm.polling_ms === "" ? null : Number(mappingForm.polling_ms),
                publish_topic: mappingForm.publish_topic || null,
                is_mandatory: Boolean(mappingForm.is_mandatory),
                is_active: Boolean(mappingForm.is_active),
                effective_from: mappingForm.effective_from || null,
                effective_to: mappingForm.effective_to || null
            };

            if (mappingEditId) {
                await signalService.updateMaster(mappingEditId, payload);
                showToast("Signal mapping updated successfully.");
            } else {
                await signalService.createMaster(payload);
                showToast("Signal mapping created successfully.");
            }

            setShowMappingForm(false);
            setMappingEditId(null);
            setMappingForm(emptyMapping);
            await loadMappings();
        } catch (error) {
            showToast(
                error.response?.data?.message || error.message || "Unable to save Signal Mapping.",
                "danger"
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteMapping = async row => {
        if (!window.confirm(`Deactivate signal mapping "${row.signal_code}"?`)) return;

        try {
            await signalService.deleteMaster(row.signal_mapping_id);
            showToast("Signal mapping deactivated successfully.");
            await loadMappings();
        } catch (error) {
            showToast(
                error.response?.data?.message || "Unable to deactivate Signal Mapping.",
                "danger"
            );
        }
    };

    // =====================================================
    // TAG DICTIONARY CRUD
    // =====================================================
    const openAddTag = () => {
        setTagEditId(null);
        setTagForm({ ...emptyTag, company_id: mappingForm.company_id || "" });
        setShowTagList(false);
        setShowTagForm(true);
    };

    const openEditTag = row => {
        setTagEditId(row.tag_id);
        setTagForm({
            company_id: row.company_id || "",
            tag_code: row.tag_code || "",
            tag_name: row.tag_name || "",
            category: row.category || "PRODUCTION",
            data_type: row.data_type || "BOOLEAN",
            unit: row.unit || "",
            description: row.description || "",
            default_value: row.default_value || "",
            allowed_values: JSON.stringify(row.allowed_values || [], null, 2),
            is_mandatory: Boolean(row.is_mandatory),
            is_active: row.is_active !== false
        });
        setShowTagList(false);
        setShowTagForm(true);
    };

    const saveTag = async () => {
        try {
            if (
                !tagForm.company_id ||
                !tagForm.tag_code.trim() ||
                !tagForm.tag_name.trim() ||
                !tagForm.category ||
                !tagForm.data_type
            ) {
                showToast(
                    "Company, Tag Code, Tag Name, Category and Data Type are required.",
                    "danger"
                );
                return;
            }

            setSaving(true);

            const payload = {
                company_id: tagForm.company_id,
                tag_code: tagForm.tag_code.trim(),
                tag_name: tagForm.tag_name.trim(),
                category: tagForm.category,
                data_type: tagForm.data_type,
                unit: tagForm.unit || null,
                description: tagForm.description || null,
                default_value: tagForm.default_value || null,
                allowed_values: parseJsonArray(tagForm.allowed_values, "Allowed Values"),
                is_mandatory: Boolean(tagForm.is_mandatory),
                is_active: Boolean(tagForm.is_active)
            };

            if (tagEditId) {
                await signalService.updateTag(tagEditId, payload);
                showToast("Tag updated successfully.");
            } else {
                await signalService.createTag(payload);
                showToast("Tag created successfully.");
            }

            await loadTags();
            setTagEditId(null);
            setTagForm(emptyTag);
            setShowTagForm(false);
            setShowTagList(true);
        } catch (error) {
            showToast(
                error.response?.data?.message || error.message || "Unable to save Tag Dictionary.",
                "danger"
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteTag = async row => {
        if (!window.confirm(`Disable tag "${row.tag_name}"?`)) return;

        try {
            await signalService.deleteTag(row.tag_id);
            await loadTags();
            showToast("Tag disabled successfully.");
        } catch (error) {
            showToast(
                error.response?.data?.message || "Unable to disable Tag.",
                "danger"
            );
        }
    };

    // =====================================================
    // PROTOCOL ADDRESS MAP CRUD
    // =====================================================
    const openAddAddressMap = () => {
        setAddressMapEditId(null);
        setAddressMapForm({ ...emptyAddressMap, company_id: mappingForm.company_id || "" });
        setShowAddressMapList(false);
        setShowAddressMapForm(true);
    };

    const openEditAddressMap = row => {
        setAddressMapEditId(row.address_map_id);
        setAddressMapForm({
            company_id: row.company_id || "",
            protocol_id: row.protocol_id || "",
            address_type: row.address_type || "REGISTER",
            address_pattern: row.address_pattern || "",
            start_address: row.start_address || "",
            length: row.length ?? 1,
            bit_index: row.bit_index ?? "",
            data_type: row.data_type || "UINT16",
            byte_order: row.byte_order || "",
            word_order: row.word_order || "",
            validation_regex: row.validation_regex || "",
            map_config: JSON.stringify(row.map_config || {}, null, 2),
            is_active: row.is_active !== false
        });
        setShowAddressMapList(false);
        setShowAddressMapForm(true);
    };

    const saveAddressMap = async () => {
        try {
            if (
                !addressMapForm.company_id ||
                !addressMapForm.protocol_id ||
                !addressMapForm.address_type ||
                !addressMapForm.address_pattern.trim() ||
                !addressMapForm.start_address.trim() ||
                !addressMapForm.data_type
            ) {
                showToast(
                    "Company, Protocol, Address Type, Address Pattern, Start Address and Data Type are required.",
                    "danger"
                );
                return;
            }

            setSaving(true);

            const payload = {
                company_id: addressMapForm.company_id,
                protocol_id: addressMapForm.protocol_id,
                address_type: addressMapForm.address_type,
                address_pattern: addressMapForm.address_pattern.trim(),
                start_address: addressMapForm.start_address.trim(),
                length: addressMapForm.length === "" ? 1 : Number(addressMapForm.length),
                bit_index: addressMapForm.bit_index === "" ? null : Number(addressMapForm.bit_index),
                data_type: addressMapForm.data_type,
                byte_order: addressMapForm.byte_order || null,
                word_order: addressMapForm.word_order || null,
                validation_regex: addressMapForm.validation_regex || null,
                map_config: parseJsonObject(addressMapForm.map_config, "Map Config"),
                is_active: Boolean(addressMapForm.is_active)
            };

            if (addressMapEditId) {
                await signalService.updateAddressMap(addressMapEditId, payload);
                showToast("Protocol Address Map updated successfully.");
            } else {
                await signalService.createAddressMap(payload);
                showToast("Protocol Address Map created successfully.");
            }

            await loadAddressMaps();
            setAddressMapEditId(null);
            setAddressMapForm(emptyAddressMap);
            setShowAddressMapForm(false);
            setShowAddressMapList(true);
        } catch (error) {
            showToast(
                error.response?.data?.message || error.message || "Unable to save Protocol Address Map.",
                "danger"
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteAddressMap = async row => {
        if (!window.confirm(`Disable address map "${row.address_type} - ${row.start_address}"?`)) {
            return;
        }

        try {
            await signalService.deleteAddressMap(row.address_map_id);
            await loadAddressMaps();
            showToast("Protocol Address Map disabled successfully.");
        } catch (error) {
            showToast(
                error.response?.data?.message || "Unable to disable Protocol Address Map.",
                "danger"
            );
        }
    };

    // =====================================================
    // RAW SIGNAL EVENT / NORMALIZED REPORT
    // =====================================================
    const loadRuntime = async () => {
        try {
            setLoading(true);
            const res = await signalService.getRuntime();
            setRuntimeData(res.data.data || []);
            setShowRuntime(true);
        } catch (error) {
            showToast(
                error.response?.data?.message || "Unable to load Raw Signal Runtime.",
                "danger"
            );
        } finally {
            setLoading(false);
        }
    };

    const executeSignal = async () => {
        try {
            if (!executeForm.signal_mapping_id) {
                showToast("Signal Mapping is required.", "danger");
                return;
            }

            setSaving(true);

            const payload = {
                signal_mapping_id: executeForm.signal_mapping_id,
                raw_value: executeForm.raw_value === "" ? null : executeForm.raw_value,
                quality: executeForm.quality || "GOOD",
                received_at: executeForm.received_at || null,
                event_ts: executeForm.event_ts || null,
                correlation_id: executeForm.correlation_id || null,
                idempotency_key: executeForm.idempotency_key || null,
                source_system: executeForm.source_system || null,
                payload: parseJsonObject(executeForm.payload, "Payload")
            };

            const res = await signalService.execute(payload);
            showToast(res.data.message || "Raw signal event recorded successfully.");
            setExecuteForm(emptyExecute);
            setShowExecute(false);
        } catch (error) {
            showToast(
                error.response?.data?.message || error.message || "Execution failed.",
                "danger"
            );
        } finally {
            setSaving(false);
        }
    };

    const loadReport = async () => {
        try {
            setLoading(true);
            const res = await signalService.getReport();
            setReportData(res.data.data || []);
            setShowReport(true);
        } catch (error) {
            showToast(
                error.response?.data?.message || "Unable to load Normalized Signal Report.",
                "danger"
            );
        } finally {
            setLoading(false);
        }
    };

    const exportSignal = async () => {
        try {
            const res = await signalService.exportData({});
            const rows = res.data?.data || [];

            if (!rows.length) {
                showToast("No export data found.", "warning");
                return;
            }

            const headers = Object.keys(rows[0]);
            const escapeCsv = value => {
                if (value === null || value === undefined) return "";
                const text = typeof value === "object" ? JSON.stringify(value) : String(value);
                return `"${text.replace(/"/g, '""')}"`;
            };

            const csv = [
                headers.join(","),
                ...rows.map(row => headers.map(key => escapeCsv(row[key])).join(","))
            ].join("\n");

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Signal_Mapping_Report.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showToast("CSV exported successfully.");
        } catch (error) {
            showToast(
                error.response?.data?.message || "Export failed.",
                "danger"
            );
        }
    };

    // =====================================================
    // FILTERED MASTER DATA
    // =====================================================
    const filteredMappings = mappings.filter(row => {
        const search = searchText.trim().toLowerCase();

        const searchMatch =
            !search ||
            row.signal_code?.toLowerCase().includes(search) ||
            row.raw_address?.toLowerCase().includes(search) ||
            row.machine_name?.toLowerCase().includes(search) ||
            row.device_name?.toLowerCase().includes(search) ||
            row.tag_name?.toLowerCase().includes(search);

        const statusMatch =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && row.is_active === true) ||
            (statusFilter === "INACTIVE" && row.is_active === false);

        return searchMatch && statusMatch;
    });

    // =====================================================
    // TABLE COLUMNS
    // =====================================================
    const mappingColumns = [
        { key: "signal_code", label: "Signal Code" },
        { key: "machine_name", label: "Machine" },
        { key: "device_name", label: "Device" },
        { key: "tag_name", label: "Tag" },
        { key: "raw_address", label: "Raw Address" },
        { key: "data_type", label: "Data Type" },
        { key: "access_mode", label: "Access" },
        { key: "polling_ms", label: "Polling (ms)" },
        {
            key: "is_active",
            label: "Status",
            render: row => (
                <StatusBadge status={row.is_active ? "ACTIVE" : "INACTIVE"} />
            )
        }
    ];

    const tagColumns = [
        { key: "tag_code", label: "Tag Code" },
        { key: "tag_name", label: "Tag Name" },
        { key: "company_name", label: "Company" },
        { key: "category", label: "Category" },
        { key: "data_type", label: "Data Type" },
        { key: "unit", label: "Unit" },
        {
            key: "is_mandatory",
            label: "Mandatory",
            render: row => (row.is_mandatory ? "YES" : "NO")
        },
        {
            key: "is_active",
            label: "Status",
            render: row => (
                <StatusBadge status={row.is_active ? "ACTIVE" : "INACTIVE"} />
            )
        }
    ];

    const addressMapColumns = [
        { key: "protocol_name", label: "Protocol" },
        { key: "address_type", label: "Address Type" },
        { key: "address_pattern", label: "Pattern" },
        { key: "start_address", label: "Start Address" },
        { key: "length", label: "Length" },
        { key: "bit_index", label: "Bit" },
        { key: "data_type", label: "Data Type" },
        {
            key: "is_active",
            label: "Status",
            render: row => (
                <StatusBadge status={row.is_active ? "ACTIVE" : "INACTIVE"} />
            )
        }
    ];

    const runtimeColumns = [
        { key: "machine_name", label: "Machine" },
        { key: "device_name", label: "Device" },
        { key: "raw_address", label: "Raw Address" },
        { key: "raw_value", label: "Raw Value" },
        { key: "data_type", label: "Data Type" },
        {
            key: "quality",
            label: "Quality",
            render: row => (
                <Badge
                    bg={
                        row.quality === "GOOD"
                            ? "success"
                            : row.quality === "UNCERTAIN"
                            ? "warning"
                            : "danger"
                    }
                >
                    {row.quality}
                </Badge>
            )
        },
        { key: "source_system", label: "Source" },
        { key: "received_at", label: "Received At" },
        { key: "event_ts", label: "Event Time" }
    ];

    const reportColumns = [
        { key: "machine_name", label: "Machine" },
        { key: "device_name", label: "Device" },
        { key: "tag_name", label: "Tag" },
        { key: "signal_code", label: "Signal Code" },
        { key: "raw_address", label: "Raw Address" },
        { key: "value_text", label: "Text Value" },
        { key: "value_numeric", label: "Numeric Value" },
        {
            key: "value_boolean",
            label: "Boolean Value",
            render: row => {
                if (row.value_boolean === null || row.value_boolean === undefined) return "-";
                return row.value_boolean ? "TRUE" : "FALSE";
            }
        },
        { key: "quality", label: "Quality" },
        { key: "event_ts", label: "Event Time" }
    ];

    // =====================================================
    // RENDER
    // =====================================================
    return (
        <>

<div className="signal-mapping container-fluid">
            <Toast
                show={toast.show}
                onClose={() => setToast(previous => ({ ...previous, show: false }))}
                delay={3000}
                autohide
                bg={toast.variant}
                className="position-fixed top-0 end-0 m-3"
                style={{ zIndex: 9999 }}
            >
                <Toast.Body className="text-white">{toast.message}</Toast.Body>
            </Toast>

            {/* ================================================= */}
            {/* PAGE HEADER */}
            {/* ================================================= */}
            <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                    <Row className="align-items-center g-3">
                        <Col>
                            <h3 className="mb-1">Signal Mapping</h3>
                            <small className="text-muted">
                                Master Data / Signal Normalization & Mapping
                            </small>
                        </Col>

                        <Col xs="auto">
                            <div className="d-flex gap-2 flex-wrap">
                                <Button
                                    variant="outline-primary"
                                    onClick={() => {
                                        loadTags();
                                        setShowTagList(true);
                                    }}
                                >
                                    Tag Dictionary
                                </Button>

                                <Button
                                    variant="outline-primary"
                                    onClick={() => {
                                        loadAddressMaps();
                                        setShowAddressMapList(true);
                                    }}
                                >
                                    Protocol Address Map
                                </Button>

                                <Button variant="primary" onClick={openAddMapping}>
                                    <Plus /> Add Mapping
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* ================================================= */}
            {/* SEARCH TOOLBAR */}
            {/* ================================================= */}
            <SearchToolbar
                searchText={searchText}
                onSearch={setSearchText}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                onRefresh={loadInitialData}
                onExecute={() => setShowExecute(true)}
                onRuntime={loadRuntime}
                onReport={loadReport}
                onExport={exportSignal}
                placeholder="Search Signal Mapping..."
            />

            {/* ================================================= */}
            {/* MACHINE SIGNAL MAPPING TABLE */}
            {/* ================================================= */}
            <DataTable
                columns={mappingColumns}
                data={filteredMappings}
                loading={loading}
                emptyMessage="No Signal Mapping Found"
                renderActions={row => (
                    <ActionButtons
                        onEdit={() => openEditMapping(row)}
                        onDelete={() => deleteMapping(row)}
                    />
                )}
            />

            {/* ================================================= */}
            {/* MACHINE SIGNAL MAPPING FORM */}
            {/* ================================================= */}
            <Modal
                show={showMappingForm}
                onHide={() => setShowMappingForm(false)}
                centered
                backdrop="static"
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {mappingEditId ? "Update Signal Mapping" : "Create Signal Mapping"}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company *</Form.Label>
                                    <Form.Select
                                        name="company_id"
                                        value={mappingForm.company_id}
                                        onChange={handleMappingChange}
                                        disabled={Boolean(mappingEditId)}
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(item => (
                                            <option key={item.company_id} value={item.company_id}>
                                                {item.company_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Plant *</Form.Label>
                                    <Form.Select
                                        name="plant_id"
                                        value={mappingForm.plant_id}
                                        onChange={handleMappingChange}
                                        disabled={Boolean(mappingEditId) || !mappingForm.company_id}
                                    >
                                        <option value="">Select Plant</option>
                                        {availablePlants.map(item => (
                                            <option key={item.plant_id} value={item.plant_id}>
                                                {item.plant_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Line</Form.Label>
                                    <Form.Select
                                        name="line_id"
                                        value={mappingForm.line_id}
                                        onChange={handleMappingChange}
                                        disabled={Boolean(mappingEditId) || !mappingForm.plant_id}
                                    >
                                        <option value="">Select Line</option>
                                        {availableLines.map(item => (
                                            <option key={item.line_id} value={item.line_id}>
                                                {item.line_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Machine *</Form.Label>
                                    <Form.Select
                                        name="machine_id"
                                        value={mappingForm.machine_id}
                                        onChange={handleMappingChange}
                                        disabled={Boolean(mappingEditId) || !mappingForm.plant_id}
                                    >
                                        <option value="">Select Machine</option>
                                        {availableMachines.map(item => (
                                            <option key={item.machine_id} value={item.machine_id}>
                                                {item.machine_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Device *</Form.Label>
                                    <Form.Select
                                        name="device_id"
                                        value={mappingForm.device_id}
                                        onChange={handleMappingChange}
                                        disabled={Boolean(mappingEditId) || !mappingForm.machine_id}
                                    >
                                        <option value="">Select Device</option>
                                        {availableDevices.map(item => (
                                            <option key={item.device_id} value={item.device_id}>
                                                {item.device_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tag *</Form.Label>
                                    <Form.Select
                                        name="tag_id"
                                        value={mappingForm.tag_id}
                                        onChange={handleMappingChange}
                                        disabled={Boolean(mappingEditId) || !mappingForm.company_id}
                                    >
                                        <option value="">Select Tag</option>
                                        {availableTags.map(item => (
                                            <option key={item.tag_id} value={item.tag_id}>
                                                {item.tag_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Protocol Address Map</Form.Label>
                                    <Form.Select
                                        name="address_map_id"
                                        value={mappingForm.address_map_id}
                                        onChange={handleMappingChange}
                                        disabled={Boolean(mappingEditId) || !mappingForm.device_id}
                                    >
                                        <option value="">Select Address Map</option>
                                        {availableAddressMaps.map(item => (
                                            <option key={item.address_map_id} value={item.address_map_id}>
                                                {item.address_type} - {item.start_address}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Signal Code *</Form.Label>
                                    <Form.Control
                                        name="signal_code"
                                        value={mappingForm.signal_code}
                                        onChange={handleMappingChange}
                                        placeholder="CYCLE_COMPLETE"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Raw Address *</Form.Label>
                                    <Form.Control
                                        name="raw_address"
                                        value={mappingForm.raw_address}
                                        onChange={handleMappingChange}
                                        placeholder="D100"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bit Index</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        name="bit_index"
                                        value={mappingForm.bit_index}
                                        onChange={handleMappingChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data Type *</Form.Label>
                                    <Form.Select
                                        name="data_type"
                                        value={mappingForm.data_type}
                                        onChange={handleMappingChange}
                                    >
                                        {SIGNAL_DATA_TYPES.map(item => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Access Mode</Form.Label>
                                    <Form.Select
                                        name="access_mode"
                                        value={mappingForm.access_mode}
                                        onChange={handleMappingChange}
                                    >
                                        {ACCESS_MODES.map(item => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Polling (ms)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        name="polling_ms"
                                        value={mappingForm.polling_ms}
                                        onChange={handleMappingChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Scale Factor</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        name="scale_factor"
                                        value={mappingForm.scale_factor}
                                        onChange={handleMappingChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Offset</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        name="offset_value"
                                        value={mappingForm.offset_value}
                                        onChange={handleMappingChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Deadband</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="any"
                                        name="deadband"
                                        value={mappingForm.deadband}
                                        onChange={handleMappingChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Publish Topic</Form.Label>
                                    <Form.Control
                                        name="publish_topic"
                                        value={mappingForm.publish_topic}
                                        onChange={handleMappingChange}
                                        placeholder="ST10_CYCLE_COMPLETE"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Effective From</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="effective_from"
                                        value={mappingForm.effective_from}
                                        onChange={handleMappingChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Effective To</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="effective_to"
                                        value={mappingForm.effective_to}
                                        onChange={handleMappingChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={2} className="d-flex align-items-center">
                                <Form.Check
                                    type="checkbox"
                                    name="is_mandatory"
                                    checked={mappingForm.is_mandatory}
                                    onChange={handleMappingChange}
                                    label="Mandatory"
                                />
                            </Col>

                            <Col md={2} className="d-flex align-items-center">
                                <Form.Check
                                    type="checkbox"
                                    name="is_active"
                                    checked={mappingForm.is_active}
                                    onChange={handleMappingChange}
                                    label="Active"
                                />
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowMappingForm(false);
                            setMappingEditId(null);
                            setMappingForm(emptyMapping);
                        }}
                    >
                        Cancel
                    </Button>

                    <Button variant="primary" disabled={saving} onClick={saveMapping}>
                        {saving ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-2" />
                                Saving...
                            </>
                        ) : mappingEditId ? (
                            "Update Mapping"
                        ) : (
                            "Save Mapping"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ================================================= */}
            {/* TAG DICTIONARY LIST */}
            {/* ================================================= */}
            <Modal
                show={showTagList}
                onHide={() => setShowTagList(false)}
                centered
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Tag Dictionary</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="config-header d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Normalized Enterprise Tags</strong>
                            <div className="small text-muted">
                                Manage Production, Quality, Status, Alarm and Traceability tags.
                            </div>
                        </div>

                        <Button variant="primary" onClick={openAddTag}>
                            <Plus /> Add Tag
                        </Button>
                    </div>

                    <DataTable
                        columns={tagColumns}
                        data={tags}
                        emptyMessage="No Tags Found"
                        renderActions={row => (
                            <ActionButtons
                                onEdit={() => openEditTag(row)}
                                onDelete={() => deleteTag(row)}
                            />
                        )}
                    />
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTagList(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ================================================= */}
            {/* TAG DICTIONARY FORM */}
            {/* ================================================= */}
            <Modal
                show={showTagForm}
                onHide={() => setShowTagForm(false)}
                centered
                backdrop="static"
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{tagEditId ? "Update Tag" : "Create Tag"}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Company *</Form.Label>
                            <Form.Select
                                value={tagForm.company_id}
                                onChange={event =>
                                    setTagForm(previous => ({
                                        ...previous,
                                        company_id: event.target.value
                                    }))
                                }
                            >
                                <option value="">Select Company</option>
                                {availableTagCompanies.map(item => (
                                    <option key={item.company_id} value={item.company_id}>
                                        {item.company_name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tag Code *</Form.Label>
                                    <Form.Control
                                        value={tagForm.tag_code}
                                        onChange={event =>
                                            setTagForm(previous => ({
                                                ...previous,
                                                tag_code: event.target.value
                                            }))
                                        }
                                        placeholder="CYCLE_COMPLETE"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tag Name *</Form.Label>
                                    <Form.Control
                                        value={tagForm.tag_name}
                                        onChange={event =>
                                            setTagForm(previous => ({
                                                ...previous,
                                                tag_name: event.target.value
                                            }))
                                        }
                                        placeholder="Cycle Complete"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category *</Form.Label>
                                    <Form.Select
                                        value={tagForm.category}
                                        onChange={event =>
                                            setTagForm(previous => ({
                                                ...previous,
                                                category: event.target.value
                                            }))
                                        }
                                    >
                                        {TAG_CATEGORIES.map(item => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data Type *</Form.Label>
                                    <Form.Select
                                        value={tagForm.data_type}
                                        onChange={event =>
                                            setTagForm(previous => ({
                                                ...previous,
                                                data_type: event.target.value
                                            }))
                                        }
                                    >
                                        {TAG_DATA_TYPES.map(item => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Unit</Form.Label>
                                    <Form.Control
                                        value={tagForm.unit}
                                        onChange={event =>
                                            setTagForm(previous => ({
                                                ...previous,
                                                unit: event.target.value
                                            }))
                                        }
                                        placeholder="PCS / RPM / mm"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={tagForm.description}
                                onChange={event =>
                                    setTagForm(previous => ({
                                        ...previous,
                                        description: event.target.value
                                    }))
                                }
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Default Value</Form.Label>
                                    <Form.Control
                                        value={tagForm.default_value}
                                        onChange={event =>
                                            setTagForm(previous => ({
                                                ...previous,
                                                default_value: event.target.value
                                            }))
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Allowed Values (JSON Array)</Form.Label>
                                    <Form.Control
                                        value={tagForm.allowed_values}
                                        onChange={event =>
                                            setTagForm(previous => ({
                                                ...previous,
                                                allowed_values: event.target.value
                                            }))
                                        }
                                        placeholder='[true, false]'
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Check
                                    type="checkbox"
                                    label="Mandatory"
                                    checked={tagForm.is_mandatory}
                                    onChange={event =>
                                        setTagForm(previous => ({
                                            ...previous,
                                            is_mandatory: event.target.checked
                                        }))
                                    }
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Check
                                    type="checkbox"
                                    label="Active"
                                    checked={tagForm.is_active}
                                    onChange={event =>
                                        setTagForm(previous => ({
                                            ...previous,
                                            is_active: event.target.checked
                                        }))
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
                            setTagEditId(null);
                            setTagForm(emptyTag);
                            setShowTagForm(false);
                            setShowTagList(true);
                        }}
                    >
                        Cancel
                    </Button>

                    <Button variant="primary" disabled={saving} onClick={saveTag}>
                        {saving ? "Saving..." : tagEditId ? "Update Tag" : "Save Tag"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ================================================= */}
            {/* PROTOCOL ADDRESS MAP LIST */}
            {/* ================================================= */}
            <Modal
                show={showAddressMapList}
                onHide={() => setShowAddressMapList(false)}
                centered
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Protocol Address Map</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="config-header d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Protocol Address Definitions</strong>
                            <div className="small text-muted">
                                Protocols are managed in Device Master. Here you only define their usable addresses.
                            </div>
                        </div>

                        <Button variant="primary" onClick={openAddAddressMap}>
                            <Plus /> Add Address Map
                        </Button>
                    </div>

                    <DataTable
                        columns={addressMapColumns}
                        data={addressMaps}
                        emptyMessage="No Protocol Address Maps Found"
                        renderActions={row => (
                            <ActionButtons
                                onEdit={() => openEditAddressMap(row)}
                                onDelete={() => deleteAddressMap(row)}
                            />
                        )}
                    />
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddressMapList(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ================================================= */}
            {/* PROTOCOL ADDRESS MAP FORM */}
            {/* ================================================= */}
            <Modal
                show={showAddressMapForm}
                onHide={() => setShowAddressMapForm(false)}
                centered
                backdrop="static"
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {addressMapEditId ? "Update Protocol Address Map" : "Create Protocol Address Map"}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company *</Form.Label>
                                    <Form.Select
                                        value={addressMapForm.company_id}
                                        onChange={event =>
                                            setAddressMapForm(previous => ({
                                                ...previous,
                                                company_id: event.target.value,
                                                protocol_id: ""
                                            }))
                                        }
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(item => (
                                            <option key={item.company_id} value={item.company_id}>
                                                {item.company_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Protocol *</Form.Label>
                                    <Form.Select
                                        value={addressMapForm.protocol_id}
                                        onChange={event =>
                                            setAddressMapForm(previous => ({
                                                ...previous,
                                                protocol_id: event.target.value
                                            }))
                                        }
                                        disabled={!addressMapForm.company_id}
                                    >
                                        <option value="">Select Protocol</option>
                                        {availableAddressProtocols.map(item => (
                                            <option key={item.protocol_id} value={item.protocol_id}>
                                                {item.protocol_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Address Type *</Form.Label>
                                    <Form.Select
                                        value={addressMapForm.address_type}
                                        onChange={event =>
                                            setAddressMapForm(previous => ({
                                                ...previous,
                                                address_type: event.target.value
                                            }))
                                        }
                                    >
                                        {ADDRESS_TYPES.map(item => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Address Pattern *</Form.Label>
                                    <Form.Control
                                        value={addressMapForm.address_pattern}
                                        onChange={event =>
                                            setAddressMapForm(previous => ({
                                                ...previous,
                                                address_pattern: event.target.value
                                            }))
                                        }
                                        placeholder="D[0-9]+"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Start Address *</Form.Label>
                                    <Form.Control
                                        value={addressMapForm.start_address}
                                        onChange={event =>
                                            setAddressMapForm(previous => ({
                                                ...previous,
                                                start_address: event.target.value
                                            }))
                                        }
                                        placeholder="D100"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Length *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={addressMapForm.length}
                                        onChange={event =>
                                            setAddressMapForm(previous => ({
                                                ...previous,
                                                length: event.target.value
                                            }))
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bit Index</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        value={addressMapForm.bit_index}
                                        onChange={event =>
                                            setAddressMapForm(previous => ({
                                                ...previous,
                                                bit_index: event.target.value
                                            }))
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data Type *</Form.Label>
                                    <Form.Select
                                        value={addressMapForm.data_type}
                                        onChange={event =>
                                            setAddressMapForm(previous => ({
                                                ...previous,
                                                data_type: event.target.value
                                            }))
                                        }
                                    >
                                        {SIGNAL_DATA_TYPES.map(item => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Byte Order</Form.Label>
                                    <Form.Control
                                        value={addressMapForm.byte_order}
                                        onChange={event =>
                                            setAddressMapForm(previous => ({
                                                ...previous,
                                                byte_order: event.target.value
                                            }))
                                        }
                                        placeholder="BIG_ENDIAN"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Word Order</Form.Label>
                                    <Form.Control
                                        value={addressMapForm.word_order}
                                        onChange={event =>
                                            setAddressMapForm(previous => ({
                                                ...previous,
                                                word_order: event.target.value
                                            }))
                                        }
                                        placeholder="BIG_ENDIAN"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Validation Regex</Form.Label>
                            <Form.Control
                                value={addressMapForm.validation_regex}
                                onChange={event =>
                                    setAddressMapForm(previous => ({
                                        ...previous,
                                        validation_regex: event.target.value
                                    }))
                                }
                                placeholder="^D[0-9]+$"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Map Config (JSON)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={addressMapForm.map_config}
                                onChange={event =>
                                    setAddressMapForm(previous => ({
                                        ...previous,
                                        map_config: event.target.value
                                    }))
                                }
                                placeholder='{"function_code":3}'
                            />
                        </Form.Group>

                        <Form.Check
                            type="checkbox"
                            label="Active"
                            checked={addressMapForm.is_active}
                            onChange={event =>
                                setAddressMapForm(previous => ({
                                    ...previous,
                                    is_active: event.target.checked
                                }))
                            }
                        />
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setAddressMapEditId(null);
                            setAddressMapForm(emptyAddressMap);
                            setShowAddressMapForm(false);
                            setShowAddressMapList(true);
                        }}
                    >
                        Cancel
                    </Button>

                    <Button variant="primary" disabled={saving} onClick={saveAddressMap}>
                        {saving
                            ? "Saving..."
                            : addressMapEditId
                            ? "Update Address Map"
                            : "Save Address Map"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ================================================= */}
            {/* EXECUTE RAW SIGNAL EVENT */}
            {/* ================================================= */}
            <Modal
                show={showExecute}
                onHide={() => setShowExecute(false)}
                centered
                backdrop="static"
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Execute Raw Signal Event</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Signal Mapping *</Form.Label>
                            <Form.Select
                                value={executeForm.signal_mapping_id}
                                onChange={event =>
                                    setExecuteForm(previous => ({
                                        ...previous,
                                        signal_mapping_id: event.target.value
                                    }))
                                }
                            >
                                <option value="">Select Signal Mapping</option>
                                {mappings.map(item => (
                                    <option key={item.signal_mapping_id} value={item.signal_mapping_id}>
                                        {item.machine_name || "Machine"} - {item.signal_code}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Raw Value</Form.Label>
                                    <Form.Control
                                        value={executeForm.raw_value}
                                        onChange={event =>
                                            setExecuteForm(previous => ({
                                                ...previous,
                                                raw_value: event.target.value
                                            }))
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Quality</Form.Label>
                                    <Form.Select
                                        value={executeForm.quality}
                                        onChange={event =>
                                            setExecuteForm(previous => ({
                                                ...previous,
                                                quality: event.target.value
                                            }))
                                        }
                                    >
                                        {QUALITY_VALUES.map(item => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Received At</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={executeForm.received_at}
                                        onChange={event =>
                                            setExecuteForm(previous => ({
                                                ...previous,
                                                received_at: event.target.value
                                            }))
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Event Time</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={executeForm.event_ts}
                                        onChange={event =>
                                            setExecuteForm(previous => ({
                                                ...previous,
                                                event_ts: event.target.value
                                            }))
                                        }
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Correlation ID</Form.Label>
                                    <Form.Control
                                        value={executeForm.correlation_id}
                                        onChange={event =>
                                            setExecuteForm(previous => ({
                                                ...previous,
                                                correlation_id: event.target.value
                                            }))
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Idempotency Key</Form.Label>
                                    <Form.Control
                                        value={executeForm.idempotency_key}
                                        onChange={event =>
                                            setExecuteForm(previous => ({
                                                ...previous,
                                                idempotency_key: event.target.value
                                            }))
                                        }
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Source System</Form.Label>
                            <Form.Control
                                value={executeForm.source_system}
                                onChange={event =>
                                    setExecuteForm(previous => ({
                                        ...previous,
                                        source_system: event.target.value
                                    }))
                                }
                                placeholder="GATEWAY-01"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Payload (JSON)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={executeForm.payload}
                                onChange={event =>
                                    setExecuteForm(previous => ({
                                        ...previous,
                                        payload: event.target.value
                                    }))
                                }
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setExecuteForm(emptyExecute);
                            setShowExecute(false);
                        }}
                    >
                        Cancel
                    </Button>

                    <Button variant="primary" disabled={saving} onClick={executeSignal}>
                        {saving ? "Saving..." : "Execute"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ================================================= */}
            {/* RAW SIGNAL EVENT RUNTIME */}
            {/* ================================================= */}
            <Modal
                show={showRuntime}
                onHide={() => setShowRuntime(false)}
                centered
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Raw Signal Event Runtime</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <DataTable
                        columns={runtimeColumns}
                        data={runtimeData}
                        loading={loading}
                        emptyMessage="No Raw Signal Events Found"
                    />
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRuntime(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ================================================= */}
            {/* NORMALIZED SIGNAL EVENT REPORT */}
            {/* ================================================= */}
            <Modal
                show={showReport}
                onHide={() => setShowReport(false)}
                centered
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Normalized Signal Event Report</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <DataTable
                        columns={reportColumns}
                        data={reportData}
                        loading={loading}
                        emptyMessage="No Normalized Signal Events Found"
                    />
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReport(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
</>
    );
}

export default SignalMapping;
