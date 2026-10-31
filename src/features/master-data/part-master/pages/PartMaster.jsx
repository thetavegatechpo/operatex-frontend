
// src/pages/PartMaster/PartMaster.jsx

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

import partService from "../api/part.service.js";
import modelService from "../../model-master/api/model.service.js";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import plantShopService from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";
import lineService from "../../../enterprise-setup/line-master/api/line.service.js";
import machineService from "../../machine-master/api/machine.service.js";

import "./PartMaster.css";

const PART_TYPES = [
    "FINISHED_GOOD",
    "SUBASSEMBLY",
    "COMPONENT",
    "CONSUMABLE"
];

const PART_STATUS = [
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
    "RETIRED"
];

const REVISION_STATUS = [
    "DRAFT",
    "UNDER_REVIEW",
    "RELEASED",
    "OBSOLETE"
];

const ATTRIBUTE_DATA_TYPES = [
    "STRING",
    "INTEGER",
    "NUMERIC",
    "BOOLEAN",
    "DATE",
    "DATETIME",
    "JSON"
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

function PartMaster() {
    const [parts, setParts] = useState([]);
    const [models, setModels] = useState([]);
    const [modelLinks, setModelLinks] = useState({});
    const [originalModelLinks, setOriginalModelLinks] = useState({});
    const [modelLinksLoading, setModelLinksLoading] = useState(false);
    const [revisions, setRevisions] = useState([]);
    const [attributes, setAttributes] = useState([]);
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
    const [showRevisionConfig, setShowRevisionConfig] = useState(false);
    const [showRevisionForm, setShowRevisionForm] = useState(false);
    const [showAttributeConfig, setShowAttributeConfig] = useState(false);
    const [showAttributeForm, setShowAttributeForm] = useState(false);
    const [showRuntime, setShowRuntime] = useState(false);
    const [showExecute, setShowExecute] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const [editId, setEditId] = useState(null);
    const [revisionEditId, setRevisionEditId] = useState(null);
    const [attributeEditId, setAttributeEditId] = useState(null);

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

    const partInitialState = {
        company_id: "",
        part_code: "",
        part_name: "",
        part_type: "COMPONENT",
        uom: "EA",
        customer_part_no: "",
        internal_part_no: "",
        description: "",
        status: "ACTIVE"
    };

    const revisionInitialState = {
        config_type: "REVISION",
        company_id: "",
        part_id: "",
        revision_no: "",
        revision_description: "",
        drawing_no: "",
        effective_from: "",
        effective_to: "",
        release_status: "DRAFT",
        is_current: false,
        specification: "{}",
        approved_by: "",
        approved_at: ""
    };

    const attributeInitialState = {
        config_type: "ATTRIBUTE",
        company_id: "",
        part_revision_id: "",
        attribute_code: "",
        attribute_name: "",
        data_type: "STRING",
        unit: "",
        is_required: false,
        min_value: "",
        max_value: "",
        default_value: "",
        allowed_values: "[]",
        validation_expression: "",
        sequence_no: 1,
        is_active: true
    };

    const executeInitialState = {
        company_id: "",
        plant_id: "",
        line_id: "",
        machine_id: "",
        part_id: "",
        part_revision_id: "",
        event_type: "",
        status: "COMPLETED",
        event_ts: "",
        correlation_id: "",
        idempotency_key: "",
        source_system: "",
        payload: "{}"
    };

    const [formData, setFormData] = useState(partInitialState);
    const [revisionForm, setRevisionForm] = useState(revisionInitialState);
    const [attributeForm, setAttributeForm] = useState(attributeInitialState);
    const [executeForm, setExecuteForm] = useState(executeInitialState);

    const getErrorMessage = (error, fallback) => {
        const response = error?.response?.data;

        if (Array.isArray(response?.errors) && response.errors.length > 0) {
            return `${response.message || "Validation failed."} ${response.errors.join(", ")}`;
        }

        return response?.message || error?.message || fallback;
    };

    const parseJsonObject = (value, fieldName) => {
        if (value === "" || value === null || value === undefined) return {};
        if (typeof value === "object" && !Array.isArray(value)) return value;

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

    const parseJsonArray = (value, fieldName) => {
        if (value === "" || value === null || value === undefined) return [];
        if (Array.isArray(value)) return value;

        try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) throw new Error();
            return parsed;
        } catch {
            throw new Error(`${fieldName} must contain valid JSON array data.`);
        }
    };

    const prettyJson = (value, fallback) => {
        try {
            if (value === null || value === undefined || value === "") {
                return JSON.stringify(fallback, null, 2);
            }
            if (typeof value === "string") {
                return JSON.stringify(JSON.parse(value), null, 2);
            }
            return JSON.stringify(value, null, 2);
        } catch {
            return JSON.stringify(fallback, null, 2);
        }
    };

    const toDateInput = value => {
        if (!value) return "";
        return String(value).slice(0, 10);
    };

    const toDateTimeInput = value => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const formatDateTime = value => {
        if (!value) return "-";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadParts(),
                loadModels(),
                loadRevisions(),
                loadAttributes(),
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

    const loadParts = async () => {
        try {
            const res = await partService.getMaster();
            setParts(res.data.data || []);
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to load Part Master."), "danger");
        }
    };

    const loadModels = async () => {
        try {
            // Model Master may paginate; include only the models returned by this request.
            const res = await modelService.getMaster({ page: 1, limit: 200 });
            const data = res?.data?.data;
            setModels(Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : []);
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to load Model Master."), "danger");
        }
    };

    const readPartLinks = async (part, availableModels) => {
        // Read from mapping APIs rather than relying on optional Part Master linked_models.
        setModelLinksLoading(true);
        try {
            const companyModels = availableModels.filter(m => m.company_id === part.company_id);
            const results = await Promise.all(companyModels.map(async model => {
                const response = await modelService.getModelParts(model.model_id, { active_only: false });
                const data = response?.data?.data;
                const rows = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
                const mapped = rows.find(link => link.part_id === part.part_id && link.mapping_status === "ACTIVE");
                return mapped ? [model.model_id, String(mapped.quantity_per_model ?? 1)] : null;
            }));
            const links = Object.fromEntries(results.filter(Boolean));
            setModelLinks(links);
            setOriginalModelLinks({ ...links });
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to load linked models."), "danger");
            // Keep editing disabled until mapping state is known.
            setModelLinks(null);
        } finally {
            setModelLinksLoading(false);
        }
    };

    const loadRevisions = async () => {
        try {
            const res = await partService.getRevisionConfig();
            setRevisions(res.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const loadAttributes = async () => {
        try {
            const res = await partService.getAttributeConfig();
            setAttributes(res.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const availableRevisionParts = useMemo(() => {
        if (!revisionForm.company_id) return parts;
        return parts.filter(part => part.company_id === revisionForm.company_id);
    }, [parts, revisionForm.company_id]);

    const availableAttributeRevisions = useMemo(() => {
        if (!attributeForm.company_id) return revisions;
        return revisions.filter(revision => revision.company_id === attributeForm.company_id);
    }, [revisions, attributeForm.company_id]);

    const selectedExecutePart = useMemo(
        () => parts.find(part => part.part_id === executeForm.part_id),
        [parts, executeForm.part_id]
    );

    const executeRevisions = useMemo(() => {
        if (!executeForm.part_id) return [];
        return revisions.filter(revision => revision.part_id === executeForm.part_id);
    }, [revisions, executeForm.part_id]);

    const executePlants = useMemo(() => {
        if (!executeForm.company_id) return plants;
        return plants.filter(plant => !plant.company_id || plant.company_id === executeForm.company_id);
    }, [plants, executeForm.company_id]);

    const executeLines = useMemo(() => {
        return lines.filter(line => {
            const companyMatch = !executeForm.company_id || !line.company_id || line.company_id === executeForm.company_id;
            const plantMatch = !executeForm.plant_id || !line.plant_id || line.plant_id === executeForm.plant_id;
            return companyMatch && plantMatch;
        });
    }, [lines, executeForm.company_id, executeForm.plant_id]);

    const executeMachines = useMemo(() => {
        return machines.filter(machine => {
            const companyMatch = !executeForm.company_id || !machine.company_id || machine.company_id === executeForm.company_id;
            const plantMatch = !executeForm.plant_id || !machine.plant_id || machine.plant_id === executeForm.plant_id;
            const lineMatch = !executeForm.line_id || !machine.line_id || machine.line_id === executeForm.line_id;
            return companyMatch && plantMatch && lineMatch;
        });
    }, [machines, executeForm.company_id, executeForm.plant_id, executeForm.line_id]);

    const handleChange = event => {
        const { name, value } = event.target;
        setFormData(previous => ({ ...previous, [name]: value }));
    };

    const resetForm = () => {
        setModelLinks({});
        setOriginalModelLinks({});
        setEditId(null);
        setFormData(partInitialState);
    };

    const openAddModal = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditModal = part => {
        setModelLinks({});
        setOriginalModelLinks({});
        readPartLinks(part, models);
        setEditId(part.part_id);
        setFormData({
            company_id: part.company_id || "",
            part_code: part.part_code || "",
            part_name: part.part_name || "",
            part_type: part.part_type || "COMPONENT",
            uom: part.uom || "EA",
            customer_part_no: part.customer_part_no || "",
            internal_part_no: part.internal_part_no || "",
            description: part.description || "",
            status: part.status || "ACTIVE"
        });
        setShowForm(true);
    };

    const savePart = async () => {
        try {
            if (!formData.company_id || !formData.part_code.trim() || !formData.part_name.trim() || !formData.part_type) {
                showToast("Company, Part Code, Part Name and Part Type are required.", "danger");
                return;
            }
            if (modelLinksLoading || modelLinks === null) {
                showToast("Wait for the model mappings to load before saving.", "danger");
                return;
            }
            if (!Object.keys(modelLinks).length) {
                showToast("Select at least one model for this part.", "danger");
                return;
            }
            if (Object.values(modelLinks).some(value => !Number.isFinite(Number(value)) || Number(value) <= 0)) {
                showToast("Each selected model must have a quantity greater than zero.", "danger");
                return;
            }
            setSaving(true);
            const payload = {
                ...formData,
                part_code: formData.part_code.trim(),
                part_name: formData.part_name.trim(),
                part_type: formData.part_type.toUpperCase(),
                uom: formData.uom.trim() || "EA",
                customer_part_no: formData.customer_part_no.trim() || null,
                internal_part_no: formData.internal_part_no.trim() || null,
                description: formData.description.trim() || null,
                status: formData.status.toUpperCase()
            };
            const response = editId
                ? await partService.updateMaster(editId, payload)
                : await partService.createMaster(payload);
            let partId = editId || response?.data?.data?.part_id || response?.data?.data?.part?.part_id;
            if (!partId) {
                const refreshed = await partService.getMaster();
                const data = refreshed?.data?.data;
                const rows = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
                partId = rows.find(p => p.company_id === payload.company_id && p.part_code === payload.part_code)?.part_id;
            }
            if (!partId) {
                showToast("Part saved but the new part ID was not returned. Reopen the part to link models.", "danger");
                await loadParts();
                return;
            }
            // Only update mappings when they are new/changed. Unlink deselected mappings.
            const changes = [];
            for (const [modelId, quantity] of Object.entries(modelLinks)) {
                if (String(originalModelLinks[modelId] ?? "") !== String(quantity)) {
                    changes.push(() => modelService.assignPart(modelId, {
                        part_id: partId, quantity_per_model: Number(quantity)
                    }));
                }
            }
            for (const modelId of Object.keys(originalModelLinks)) {
                if (!(modelId in modelLinks)) {
                    changes.push(() => modelService.unlinkPart(modelId, partId));
                }
            }
            const failed = [];
            // Sequential operations avoid partial DB contention; show failures explicitly.
            for (const run of changes) {
                try { await run(); } catch (error) { failed.push(getErrorMessage(error, "Model mapping failed")); }
            }
            if (failed.length) {
                showToast(`Part saved, but ${failed.length} model link(s) failed: ${failed[0]}`, "danger");
                await loadParts();
                return;
            }
            setShowForm(false);
            resetForm();
            await Promise.all([loadParts(), loadRevisions()]);
            showToast(editId ? "Part and models updated successfully." : "Part and models created successfully.");
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to save Part."), "danger");
        } finally {
            setSaving(false);
        }
    };

    const deletePart = async part => {
        if (!window.confirm(`Deactivate part "${part.part_name}"?`)) return;

        try {
            await partService.deleteMaster(part.part_id);
            showToast("Part deactivated successfully.");
            await loadParts();
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to deactivate Part."), "danger");
        }
    };

    const openAddRevision = () => {
        setRevisionEditId(null);
        setRevisionForm(revisionInitialState);
        setShowRevisionConfig(false);
        setShowRevisionForm(true);
    };

    const openEditRevision = revision => {
        setRevisionEditId(revision.part_revision_id);
        setRevisionForm({
            config_type: "REVISION",
            company_id: revision.company_id || "",
            part_id: revision.part_id || "",
            revision_no: revision.revision_no || "",
            revision_description: revision.revision_description || "",
            drawing_no: revision.drawing_no || "",
            effective_from: toDateInput(revision.effective_from),
            effective_to: toDateInput(revision.effective_to),
            release_status: revision.release_status || "DRAFT",
            is_current: Boolean(revision.is_current),
            specification: prettyJson(revision.specification, {}),
            approved_by: revision.approved_by || "",
            approved_at: toDateTimeInput(revision.approved_at)
        });
        setShowRevisionConfig(false);
        setShowRevisionForm(true);
    };

    const saveRevision = async () => {
        try {
            if (!revisionForm.company_id || !revisionForm.part_id || !revisionForm.revision_no.trim()) {
                showToast("Company, Part and Revision No are required.", "danger");
                return;
            }

            setSaving(true);

            const payload = {
                config_type: "REVISION",
                company_id: revisionForm.company_id,
                part_id: revisionForm.part_id,
                revision_no: revisionForm.revision_no.trim(),
                revision_description: revisionForm.revision_description.trim() || null,
                drawing_no: revisionForm.drawing_no.trim() || null,
                effective_from: revisionForm.effective_from || null,
                effective_to: revisionForm.effective_to || null,
                release_status: revisionForm.release_status,
                is_current: Boolean(revisionForm.is_current),
                specification: parseJsonObject(revisionForm.specification, "Specification"),
                approved_by: revisionForm.approved_by.trim() || null,
                approved_at: revisionForm.approved_at || null
            };

            if (revisionEditId) {
                delete payload.config_type;
                await partService.updateConfig("REVISION", revisionEditId, payload);
                showToast("Part revision updated successfully.");
            } else {
                await partService.createConfig(payload);
                showToast("Part revision created successfully.");
            }

            setRevisionEditId(null);
            setRevisionForm(revisionInitialState);
            setShowRevisionForm(false);
            await Promise.all([loadRevisions(), loadParts()]);
            setShowRevisionConfig(true);
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to save Part Revision."), "danger");
        } finally {
            setSaving(false);
        }
    };

    const deleteRevision = async revision => {
        if (!window.confirm(`Obsolete revision "${revision.revision_no}" for ${revision.part_name}?`)) return;

        try {
            await partService.deleteConfig("REVISION", revision.part_revision_id);
            showToast("Part revision obsoleted successfully.");
            await Promise.all([loadRevisions(), loadParts()]);
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to obsolete revision."), "danger");
        }
    };

    const openAddAttribute = () => {
        setAttributeEditId(null);
        setAttributeForm(attributeInitialState);
        setShowAttributeConfig(false);
        setShowAttributeForm(true);
    };

    const openEditAttribute = attribute => {
        setAttributeEditId(attribute.part_attribute_id);
        setAttributeForm({
            config_type: "ATTRIBUTE",
            company_id: attribute.company_id || "",
            part_revision_id: attribute.part_revision_id || "",
            attribute_code: attribute.attribute_code || "",
            attribute_name: attribute.attribute_name || "",
            data_type: attribute.data_type || "STRING",
            unit: attribute.unit || "",
            is_required: Boolean(attribute.is_required),
            min_value: attribute.min_value ?? "",
            max_value: attribute.max_value ?? "",
            default_value: attribute.default_value ?? "",
            allowed_values: prettyJson(attribute.allowed_values, []),
            validation_expression: attribute.validation_expression || "",
            sequence_no: attribute.sequence_no ?? 1,
            is_active: attribute.is_active !== false
        });
        setShowAttributeConfig(false);
        setShowAttributeForm(true);
    };

    const saveAttribute = async () => {
        try {
            if (!attributeForm.company_id || !attributeForm.part_revision_id || !attributeForm.attribute_code.trim() || !attributeForm.attribute_name.trim() || !attributeForm.data_type) {
                showToast("Company, Part Revision, Attribute Code, Attribute Name and Data Type are required.", "danger");
                return;
            }

            if (
                attributeForm.min_value !== "" &&
                attributeForm.max_value !== "" &&
                Number(attributeForm.max_value) < Number(attributeForm.min_value)
            ) {
                showToast("Max Value must not be below Min Value.", "danger");
                return;
            }

            setSaving(true);

            const payload = {
                config_type: "ATTRIBUTE",
                company_id: attributeForm.company_id,
                part_revision_id: attributeForm.part_revision_id,
                attribute_code: attributeForm.attribute_code.trim(),
                attribute_name: attributeForm.attribute_name.trim(),
                data_type: attributeForm.data_type,
                unit: attributeForm.unit.trim() || null,
                is_required: Boolean(attributeForm.is_required),
                min_value: attributeForm.min_value === "" ? null : Number(attributeForm.min_value),
                max_value: attributeForm.max_value === "" ? null : Number(attributeForm.max_value),
                default_value: attributeForm.default_value === "" ? null : attributeForm.default_value,
                allowed_values: parseJsonArray(attributeForm.allowed_values, "Allowed Values"),
                validation_expression: attributeForm.validation_expression.trim() || null,
                sequence_no: Number(attributeForm.sequence_no || 1),
                is_active: Boolean(attributeForm.is_active)
            };

            if (attributeEditId) {
                delete payload.config_type;
                await partService.updateConfig("ATTRIBUTE", attributeEditId, payload);
                showToast("Part attribute updated successfully.");
            } else {
                await partService.createConfig(payload);
                showToast("Part attribute created successfully.");
            }

            setAttributeEditId(null);
            setAttributeForm(attributeInitialState);
            setShowAttributeForm(false);
            await Promise.all([loadAttributes(), loadParts()]);
            setShowAttributeConfig(true);
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to save Part Attribute."), "danger");
        } finally {
            setSaving(false);
        }
    };

    const deleteAttribute = async attribute => {
        if (!window.confirm(`Deactivate attribute "${attribute.attribute_name}"?`)) return;

        try {
            await partService.deleteConfig("ATTRIBUTE", attribute.part_attribute_id);
            showToast("Part attribute deactivated successfully.");
            await Promise.all([loadAttributes(), loadParts()]);
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to deactivate attribute."), "danger");
        }
    };

    const loadRuntime = async () => {
        try {
            setLoading(true);
            const res = await partService.getRuntime();
            setRuntimeData(res.data.data || []);
            setShowRuntime(true);
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to load Part Runtime."), "danger");
        } finally {
            setLoading(false);
        }
    };

    const openExecute = () => {
        setExecuteForm(executeInitialState);
        setShowExecute(true);
    };

    const executePart = async () => {
        try {
            if (!executeForm.part_id || !executeForm.event_type.trim()) {
                showToast("Part and Event Type are required.", "danger");
                return;
            }

            setSaving(true);

            const payload = {
                company_id: executeForm.company_id || undefined,
                plant_id: executeForm.plant_id || null,
                line_id: executeForm.line_id || null,
                machine_id: executeForm.machine_id || null,
                part_id: executeForm.part_id,
                part_revision_id: executeForm.part_revision_id || null,
                event_type: executeForm.event_type.trim().toUpperCase(),
                status: executeForm.status,
                event_ts: executeForm.event_ts || null,
                correlation_id: executeForm.correlation_id.trim() || null,
                idempotency_key: executeForm.idempotency_key.trim() || null,
                source_system: executeForm.source_system.trim() || null,
                payload: parseJsonObject(executeForm.payload, "Payload")
            };

            const res = await partService.execute(payload);
            showToast(res.data.message || "Part event created successfully.");
            setExecuteForm(executeInitialState);
            setShowExecute(false);
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to execute Part Event."), "danger");
        } finally {
            setSaving(false);
        }
    };

    const loadReport = async () => {
        try {
            setLoading(true);
            const res = await partService.getReport({
                status: statusFilter === "ALL" ? "" : statusFilter
            });
            setReportData(res.data.data || []);
            setShowReport(true);
        } catch (error) {
            showToast(getErrorMessage(error, "Unable to generate Part Report."), "danger");
        } finally {
            setLoading(false);
        }
    };

    const exportPart = async () => {
        try {
            const res = await partService.exportData({
                format: "CSV",
                status: statusFilter === "ALL" ? "" : statusFilter
            });

            const rows = res.data.data || [];
            const columns = [
                ["company_name", "Company"],
                ["part_code", "Part Code"],
                ["part_name", "Part Name"],
                ["part_type", "Part Type"],
                ["uom", "UOM"],
                ["customer_part_no", "Customer Part No"],
                ["internal_part_no", "Internal Part No"],
                ["current_revision_no", "Current Revision"],
                ["current_drawing_no", "Drawing No"],
                ["current_revision_status", "Revision Status"],
                ["total_revisions", "Total Revisions"],
                ["total_attributes", "Total Attributes"],
                ["total_events", "Total Events"],
                ["status", "Status"]
            ];

            const escapeCsv = value => {
                const text = value === null || value === undefined ? "" : String(value);
                return `"${text.replace(/"/g, '""')}"`;
            };

            const csv = [
                columns.map(([, label]) => escapeCsv(label)).join(","),
                ...rows.map(row => columns.map(([key]) => escapeCsv(row[key])).join(","))
            ].join("\n");

            const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Part_Master.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showToast("CSV exported successfully.");
        } catch (error) {
            showToast(getErrorMessage(error, "Export failed."), "danger");
        }
    };

    const filteredParts = parts.filter(part => {
        const search = searchText.trim().toLowerCase();
        const searchMatch =
            !search ||
            part.part_code?.toLowerCase().includes(search) ||
            part.part_name?.toLowerCase().includes(search) ||
            part.part_type?.toLowerCase().includes(search) ||
            part.company_name?.toLowerCase().includes(search) ||
            String(part.customer_part_no || "").toLowerCase().includes(search) ||
            String(part.internal_part_no || "").toLowerCase().includes(search) ||
            String(part.current_revision_no || "").toLowerCase().includes(search);

        const statusMatch = statusFilter === "ALL" || part.status === statusFilter;
        return searchMatch && statusMatch;
    });

    const partColumns = [
        { key: "part_code", label: "Part Code" },
        { key: "part_name", label: "Part Name" },
        { key: "part_type", label: "Part Type" },
        { key: "linked_models", label: "Linked Models", render: row => {
            const links = Array.isArray(row.linked_models) ? row.linked_models : [];
            return links.length ? links.map(link => link.model_code || link.model_name).filter(Boolean).join(", ") : "—";
        } },
        { key: "company_name", label: "Company" },
        { key: "uom", label: "UOM" },
        { key: "customer_part_no", label: "Customer Part No" },
        { key: "internal_part_no", label: "Internal Part No" },
        { key: "current_revision_no", label: "Revision" },
        { key: "current_drawing_no", label: "Drawing No" },
        {
            key: "status",
            label: "Status",
            render: row => <StatusBadge status={row.status} />
        }
    ];

    const revisionColumns = [
        { key: "part_code", label: "Part Code" },
        { key: "part_name", label: "Part Name" },
        { key: "revision_no", label: "Revision" },
        { key: "drawing_no", label: "Drawing No" },
        { key: "effective_from", label: "Effective From" },
        { key: "effective_to", label: "Effective To" },
        {
            key: "release_status",
            label: "Release Status",
            render: row => <StatusBadge status={row.release_status} />
        },
        {
            key: "is_current",
            label: "Current",
            render: row => (
                <Badge bg={row.is_current ? "success" : "secondary"}>
                    {row.is_current ? "YES" : "NO"}
                </Badge>
            )
        }
    ];

    const attributeColumns = [
        { key: "part_code", label: "Part Code" },
        { key: "revision_no", label: "Revision" },
        { key: "attribute_code", label: "Attribute Code" },
        { key: "attribute_name", label: "Attribute Name" },
        { key: "data_type", label: "Data Type" },
        { key: "unit", label: "Unit" },
        { key: "min_value", label: "Min" },
        { key: "max_value", label: "Max" },
        { key: "sequence_no", label: "Sequence" },
        {
            key: "is_required",
            label: "Required",
            render: row => (
                <Badge bg={row.is_required ? "primary" : "secondary"}>
                    {row.is_required ? "YES" : "NO"}
                </Badge>
            )
        },
        {
            key: "is_active",
            label: "Status",
            render: row => <StatusBadge status={row.is_active ? "ACTIVE" : "INACTIVE"} />
        }
    ];

    const runtimeColumns = [
        { key: "part_code", label: "Part Code" },
        { key: "part_name", label: "Part Name" },
        { key: "revision_no", label: "Revision" },
        { key: "plant_name", label: "Plant" },
        { key: "line_name", label: "Line" },
        { key: "machine_name", label: "Machine" },
        { key: "event_type", label: "Event Type" },
        {
            key: "status",
            label: "Status",
            render: row => <StatusBadge status={row.status} />
        },
        {
            key: "event_ts",
            label: "Event Time",
            render: row => formatDateTime(row.event_ts)
        },
        { key: "source_system", label: "Source" }
    ];

    const reportColumns = [
        { key: "part_code", label: "Part Code" },
        { key: "part_name", label: "Part Name" },
        { key: "part_type", label: "Part Type" },
        { key: "company_name", label: "Company" },
        { key: "customer_part_no", label: "Customer Part No" },
        { key: "current_revision_no", label: "Current Revision" },
        { key: "current_drawing_no", label: "Drawing No" },
        { key: "total_revisions", label: "Revisions" },
        { key: "total_attributes", label: "Attributes" },
        { key: "total_events", label: "Events" },
        {
            key: "status",
            label: "Status",
            render: row => <StatusBadge status={row.status} />
        }
    ];

    return (
        <>

<div className="part-master container-fluid">
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
                            <h3 className="mb-1">Part Master</h3>
                            <small className="text-muted">Master Data / Part Master</small>
                        </Col>
                        <Col xs="auto">
                            <div className="d-flex gap-2 flex-wrap">
                                <Button
                                    variant="outline-primary"
                                    onClick={() => {
                                        loadRevisions();
                                        setShowRevisionConfig(true);
                                    }}
                                >
                                    Revision Config
                                </Button>

                                <Button
                                    variant="outline-primary"
                                    onClick={() => {
                                        loadAttributes();
                                        setShowAttributeConfig(true);
                                    }}
                                >
                                    Attribute Config
                                </Button>

                                <Button variant="primary" onClick={openAddModal}>
                                    <Plus /> Add Part
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
                onExecute={openExecute}
                onRuntime={loadRuntime}
                onReport={loadReport}
                onExport={exportPart}
                placeholder="Search Part..."
            />

            <DataTable
                columns={partColumns}
                data={filteredParts}
                loading={loading}
                emptyMessage="No Part Found"
                renderActions={part => (
                    <ActionButtons
                        onEdit={() => openEditModal(part)}
                        onDelete={() => deletePart(part)}
                    />
                )}
            />

            {/* =========================================================
                PART MASTER FORM
            ========================================================= */}
            <Modal
                show={showForm}
                onHide={() => {
                    resetForm();
                    setShowForm(false);
                }}
                centered
                backdrop="static"
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{editId ? "Update Part" : "Create Part"}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company *</Form.Label>
                                    <Form.Select name="company_id" value={formData.company_id} onChange={handleChange} disabled={Boolean(editId)}>
                                        <option value="">Select Company</option>
                                        {companies.map(company => (
                                            <option key={company.company_id} value={company.company_id}>
                                                {company.company_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Part Code *</Form.Label>
                                    <Form.Control
                                        name="part_code"
                                        value={formData.part_code}
                                        onChange={handleChange}
                                        placeholder="PART-001"
                                        maxLength={75}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Part Name *</Form.Label>
                                    <Form.Control
                                        name="part_name"
                                        value={formData.part_name}
                                        onChange={handleChange}
                                        placeholder="Part Name"
                                        maxLength={150}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Part Type *</Form.Label>
                                    <Form.Select name="part_type" value={formData.part_type} onChange={handleChange}>
                                        {PART_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>UOM</Form.Label>
                                    <Form.Control
                                        name="uom"
                                        value={formData.uom}
                                        onChange={handleChange}
                                        placeholder="EA"
                                        maxLength={20}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select name="status" value={formData.status} onChange={handleChange}>
                                        {PART_STATUS.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Customer Part No</Form.Label>
                                    <Form.Control
                                        name="customer_part_no"
                                        value={formData.customer_part_no}
                                        onChange={handleChange}
                                        maxLength={100}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Internal Part No</Form.Label>
                                    <Form.Control
                                        name="internal_part_no"
                                        value={formData.internal_part_no}
                                        onChange={handleChange}
                                        maxLength={100}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Models * (select all applicable models)</Form.Label>
                            <div className="border rounded p-3" style={{ maxHeight: 230, overflowY: "auto" }}>
                                {modelLinksLoading ? <Spinner animation="border" size="sm" /> :
                                 models.filter(model => model.company_id === formData.company_id && (model.status === "ACTIVE" || model.model_id in (originalModelLinks || {}))).length === 0 ?
                                    <div className="text-muted">No models available for the selected company. Create an active model first.</div> :
                                    models.filter(model => model.company_id === formData.company_id && (model.status === "ACTIVE" || model.model_id in (originalModelLinks || {}))).map(model => (
                                        <Row key={model.model_id} className="align-items-center mb-2 g-2">
                                            <Col xs={8}>
                                                <Form.Check type="checkbox"
                                                    label={`${model.model_code} — ${model.model_name}${model.status !== "ACTIVE" ? " (Inactive)" : ""}`}
                                                    checked={Boolean(modelLinks?.[model.model_id])}
                                                    disabled={saving || modelLinks === null || model.status !== "ACTIVE"}
                                                    onChange={event => setModelLinks(previous => {
                                                        const next = { ...previous };
                                                        if (event.target.checked) next[model.model_id] = "1";
                                                        else delete next[model.model_id];
                                                        return next;
                                                    })} />
                                            </Col>
                                            <Col xs={4}>
                                                {modelLinks?.[model.model_id] !== undefined && <Form.Control size="sm" type="number" step="0.0001" min="0.0001"
                                                    aria-label={`Quantity per ${model.model_name}`}
                                                    value={modelLinks[model.model_id]}
                                                    disabled={saving || model.status !== "ACTIVE"}
                                                    onChange={e => setModelLinks(previous => ({ ...previous, [model.model_id]: e.target.value }))} />}
                                            </Col>
                                        </Row>
                                    ))}
                            </div>
                            <Form.Text>Model links are saved through the existing model–part mapping API. A part can belong to multiple models.</Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            resetForm();
                            setShowForm(false);
                        }}
                    >
                        Cancel
                    </Button>

                    <Button variant="primary" disabled={saving || modelLinksLoading || modelLinks === null} onClick={savePart}>
                        {saving ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-2" />
                                Saving...
                            </>
                        ) : editId ? "Update Part" : "Save Part"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* =========================================================
                REVISION CONFIG TABLE
            ========================================================= */}
            <Modal
                show={showRevisionConfig}
                onHide={() => setShowRevisionConfig(false)}
                centered
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Part Revision Configuration</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="d-flex justify-content-end mb-3">
                        <Button onClick={openAddRevision}>
                            <Plus /> Add Revision
                        </Button>
                    </div>

                    <DataTable
                        columns={revisionColumns}
                        data={revisions}
                        loading={loading}
                        emptyMessage="No Part Revision Found"
                        renderActions={revision => (
                            <ActionButtons
                                onEdit={() => openEditRevision(revision)}
                                onDelete={() => deleteRevision(revision)}
                            />
                        )}
                    />
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRevisionConfig(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* =========================================================
                REVISION ADD / EDIT FORM
            ========================================================= */}
            <Modal
                show={showRevisionForm}
                onHide={() => {
                    setShowRevisionForm(false);
                    setRevisionEditId(null);
                    setRevisionForm(revisionInitialState);
                    setShowRevisionConfig(true);
                }}
                centered
                backdrop="static"
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{revisionEditId ? "Update Part Revision" : "Add Part Revision"}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company *</Form.Label>
                                    <Form.Select
                                        value={revisionForm.company_id}
                                        onChange={e => setRevisionForm(previous => ({
                                            ...previous,
                                            company_id: e.target.value,
                                            part_id: ""
                                        }))}
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(company => (
                                            <option key={company.company_id} value={company.company_id}>
                                                {company.company_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Part *</Form.Label>
                                    <Form.Select
                                        value={revisionForm.part_id}
                                        onChange={e => setRevisionForm(previous => ({ ...previous, part_id: e.target.value }))}
                                        disabled={!revisionForm.company_id}
                                    >
                                        <option value="">Select Part</option>
                                        {availableRevisionParts.map(part => (
                                            <option key={part.part_id} value={part.part_id}>
                                                {part.part_code} - {part.part_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Revision No *</Form.Label>
                                    <Form.Control
                                        value={revisionForm.revision_no}
                                        onChange={e => setRevisionForm(previous => ({ ...previous, revision_no: e.target.value }))}
                                        maxLength={30}
                                        placeholder="R01"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Drawing No</Form.Label>
                                    <Form.Control
                                        value={revisionForm.drawing_no}
                                        onChange={e => setRevisionForm(previous => ({ ...previous, drawing_no: e.target.value }))}
                                        maxLength={100}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Release Status</Form.Label>
                                    <Form.Select
                                        value={revisionForm.release_status}
                                        onChange={e => setRevisionForm(previous => ({ ...previous, release_status: e.target.value }))}
                                    >
                                        {REVISION_STATUS.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Effective From</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={revisionForm.effective_from}
                                        onChange={e => setRevisionForm(previous => ({ ...previous, effective_from: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Effective To</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={revisionForm.effective_to}
                                        onChange={e => setRevisionForm(previous => ({ ...previous, effective_to: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Revision Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={revisionForm.revision_description}
                                onChange={e => setRevisionForm(previous => ({ ...previous, revision_description: e.target.value }))}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Approved By (User UUID)</Form.Label>
                                    <Form.Control
                                        value={revisionForm.approved_by}
                                        onChange={e => setRevisionForm(previous => ({ ...previous, approved_by: e.target.value }))}
                                        placeholder="Optional UUID"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Approved At</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={revisionForm.approved_at}
                                        onChange={e => setRevisionForm(previous => ({ ...previous, approved_at: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Specification (JSON Object)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={revisionForm.specification}
                                onChange={e => setRevisionForm(previous => ({ ...previous, specification: e.target.value }))}
                            />
                        </Form.Group>

                        <Form.Check
                            type="checkbox"
                            label="Set as Current Revision"
                            checked={revisionForm.is_current}
                            onChange={e => setRevisionForm(previous => ({ ...previous, is_current: e.target.checked }))}
                        />
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowRevisionForm(false);
                            setRevisionEditId(null);
                            setRevisionForm(revisionInitialState);
                            setShowRevisionConfig(true);
                        }}
                    >
                        Cancel
                    </Button>

                    <Button disabled={saving} onClick={saveRevision}>
                        {saving ? "Saving..." : revisionEditId ? "Update Revision" : "Save Revision"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* =========================================================
                ATTRIBUTE CONFIG TABLE
            ========================================================= */}
            <Modal
                show={showAttributeConfig}
                onHide={() => setShowAttributeConfig(false)}
                centered
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Part Attribute Configuration</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="d-flex justify-content-end mb-3">
                        <Button onClick={openAddAttribute}>
                            <Plus /> Add Attribute
                        </Button>
                    </div>

                    <DataTable
                        columns={attributeColumns}
                        data={attributes}
                        loading={loading}
                        emptyMessage="No Part Attribute Found"
                        renderActions={attribute => (
                            <ActionButtons
                                onEdit={() => openEditAttribute(attribute)}
                                onDelete={() => deleteAttribute(attribute)}
                            />
                        )}
                    />
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAttributeConfig(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* =========================================================
                ATTRIBUTE ADD / EDIT FORM
            ========================================================= */}
            <Modal
                show={showAttributeForm}
                onHide={() => {
                    setShowAttributeForm(false);
                    setAttributeEditId(null);
                    setAttributeForm(attributeInitialState);
                    setShowAttributeConfig(true);
                }}
                centered
                backdrop="static"
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{attributeEditId ? "Update Part Attribute" : "Add Part Attribute"}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company *</Form.Label>
                                    <Form.Select
                                        value={attributeForm.company_id}
                                        onChange={e => setAttributeForm(previous => ({
                                            ...previous,
                                            company_id: e.target.value,
                                            part_revision_id: ""
                                        }))}
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(company => (
                                            <option key={company.company_id} value={company.company_id}>
                                                {company.company_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Part Revision *</Form.Label>
                                    <Form.Select
                                        value={attributeForm.part_revision_id}
                                        onChange={e => setAttributeForm(previous => ({ ...previous, part_revision_id: e.target.value }))}
                                        disabled={!attributeForm.company_id}
                                    >
                                        <option value="">Select Part Revision</option>
                                        {availableAttributeRevisions.map(revision => (
                                            <option key={revision.part_revision_id} value={revision.part_revision_id}>
                                                {revision.part_code} - {revision.part_name} - Rev {revision.revision_no}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Attribute Code *</Form.Label>
                                    <Form.Control
                                        value={attributeForm.attribute_code}
                                        onChange={e => setAttributeForm(previous => ({ ...previous, attribute_code: e.target.value }))}
                                        maxLength={75}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Attribute Name *</Form.Label>
                                    <Form.Control
                                        value={attributeForm.attribute_name}
                                        onChange={e => setAttributeForm(previous => ({ ...previous, attribute_name: e.target.value }))}
                                        maxLength={150}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data Type *</Form.Label>
                                    <Form.Select
                                        value={attributeForm.data_type}
                                        onChange={e => setAttributeForm(previous => ({ ...previous, data_type: e.target.value }))}
                                    >
                                        {ATTRIBUTE_DATA_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Unit</Form.Label>
                                    <Form.Control
                                        value={attributeForm.unit}
                                        onChange={e => setAttributeForm(previous => ({ ...previous, unit: e.target.value }))}
                                        maxLength={30}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Min Value</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        value={attributeForm.min_value}
                                        onChange={e => setAttributeForm(previous => ({ ...previous, min_value: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Max Value</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        value={attributeForm.max_value}
                                        onChange={e => setAttributeForm(previous => ({ ...previous, max_value: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Default Value</Form.Label>
                                    <Form.Control
                                        value={attributeForm.default_value}
                                        onChange={e => setAttributeForm(previous => ({ ...previous, default_value: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Sequence No</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={attributeForm.sequence_no}
                                        onChange={e => setAttributeForm(previous => ({ ...previous, sequence_no: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Allowed Values (JSON Array)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={attributeForm.allowed_values}
                                onChange={e => setAttributeForm(previous => ({ ...previous, allowed_values: e.target.value }))}
                                placeholder='["OK", "NOK"]'
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Validation Expression</Form.Label>
                            <Form.Control
                                value={attributeForm.validation_expression}
                                onChange={e => setAttributeForm(previous => ({ ...previous, validation_expression: e.target.value }))}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Check
                                    type="checkbox"
                                    label="Required Attribute"
                                    checked={attributeForm.is_required}
                                    onChange={e => setAttributeForm(previous => ({ ...previous, is_required: e.target.checked }))}
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Check
                                    type="checkbox"
                                    label="Active"
                                    checked={attributeForm.is_active}
                                    onChange={e => setAttributeForm(previous => ({ ...previous, is_active: e.target.checked }))}
                                />
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowAttributeForm(false);
                            setAttributeEditId(null);
                            setAttributeForm(attributeInitialState);
                            setShowAttributeConfig(true);
                        }}
                    >
                        Cancel
                    </Button>

                    <Button disabled={saving} onClick={saveAttribute}>
                        {saving ? "Saving..." : attributeEditId ? "Update Attribute" : "Save Attribute"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* =========================================================
                RUNTIME
            ========================================================= */}
            <Modal show={showRuntime} onHide={() => setShowRuntime(false)} centered size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Part Runtime / Event History</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <DataTable
                        columns={runtimeColumns}
                        data={runtimeData}
                        loading={loading}
                        emptyMessage="No Part Events Found"
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRuntime(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* =========================================================
                EXECUTE PART EVENT
            ========================================================= */}
            <Modal show={showExecute} onHide={() => setShowExecute(false)} centered backdrop="static" size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Execute Part Event</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Part *</Form.Label>
                                    <Form.Select
                                        value={executeForm.part_id}
                                        onChange={e => {
                                            const part = parts.find(item => item.part_id === e.target.value);
                                            setExecuteForm(previous => ({
                                                ...previous,
                                                part_id: e.target.value,
                                                company_id: part?.company_id || "",
                                                part_revision_id: "",
                                                plant_id: "",
                                                line_id: "",
                                                machine_id: ""
                                            }));
                                        }}
                                    >
                                        <option value="">Select Part</option>
                                        {parts.map(part => (
                                            <option key={part.part_id} value={part.part_id}>
                                                {part.part_code} - {part.part_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company</Form.Label>
                                    <Form.Control
                                        value={selectedExecutePart?.company_name || ""}
                                        readOnly
                                        placeholder="Derived from selected Part"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Part Revision</Form.Label>
                                    <Form.Select
                                        value={executeForm.part_revision_id}
                                        onChange={e => setExecuteForm(previous => ({ ...previous, part_revision_id: e.target.value }))}
                                        disabled={!executeForm.part_id}
                                    >
                                        <option value="">Use Current Revision Automatically</option>
                                        {executeRevisions.map(revision => (
                                            <option key={revision.part_revision_id} value={revision.part_revision_id}>
                                                {revision.revision_no} {revision.is_current ? "(Current)" : ""}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Plant</Form.Label>
                                    <Form.Select
                                        value={executeForm.plant_id}
                                        onChange={e => setExecuteForm(previous => ({
                                            ...previous,
                                            plant_id: e.target.value,
                                            line_id: "",
                                            machine_id: ""
                                        }))}
                                        disabled={!executeForm.part_id}
                                    >
                                        <option value="">Select Plant</option>
                                        {executePlants.map(plant => (
                                            <option key={plant.plant_id} value={plant.plant_id}>
                                                {plant.plant_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Line</Form.Label>
                                    <Form.Select
                                        value={executeForm.line_id}
                                        onChange={e => setExecuteForm(previous => ({
                                            ...previous,
                                            line_id: e.target.value,
                                            machine_id: ""
                                        }))}
                                        disabled={!executeForm.plant_id}
                                    >
                                        <option value="">Select Line</option>
                                        {executeLines.map(line => (
                                            <option key={line.line_id} value={line.line_id}>
                                                {line.line_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Machine</Form.Label>
                                    <Form.Select
                                        value={executeForm.machine_id}
                                        onChange={e => setExecuteForm(previous => ({ ...previous, machine_id: e.target.value }))}
                                    >
                                        <option value="">Select Machine</option>
                                        {executeMachines.map(machine => (
                                            <option key={machine.machine_id} value={machine.machine_id}>
                                                {machine.machine_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Event Type *</Form.Label>
                                    <Form.Control
                                        value={executeForm.event_type}
                                        onChange={e => setExecuteForm(previous => ({ ...previous, event_type: e.target.value }))}
                                        placeholder="RELEASED / RECEIVED / CONSUMED / CUSTOM"
                                        maxLength={50}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Event Status</Form.Label>
                                    <Form.Select
                                        value={executeForm.status}
                                        onChange={e => setExecuteForm(previous => ({ ...previous, status: e.target.value }))}
                                    >
                                        {EVENT_STATUS.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Event Time</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={executeForm.event_ts}
                                        onChange={e => setExecuteForm(previous => ({ ...previous, event_ts: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Source System</Form.Label>
                                    <Form.Control
                                        value={executeForm.source_system}
                                        onChange={e => setExecuteForm(previous => ({ ...previous, source_system: e.target.value }))}
                                        maxLength={100}
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
                                        onChange={e => setExecuteForm(previous => ({ ...previous, correlation_id: e.target.value }))}
                                        placeholder="Optional UUID"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Idempotency Key</Form.Label>
                                    <Form.Control
                                        value={executeForm.idempotency_key}
                                        onChange={e => setExecuteForm(previous => ({ ...previous, idempotency_key: e.target.value }))}
                                        maxLength={150}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Payload (JSON Object)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={executeForm.payload}
                                onChange={e => setExecuteForm(previous => ({ ...previous, payload: e.target.value }))}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExecute(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" disabled={saving} onClick={executePart}>
                        {saving ? "Saving..." : "Execute"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* =========================================================
                REPORT
            ========================================================= */}
            <Modal show={showReport} onHide={() => setShowReport(false)} centered size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Part Report</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <DataTable
                        columns={reportColumns}
                        data={reportData}
                        loading={loading}
                        emptyMessage="No Part Report Data Found"
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReport(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
</>
    );
}

export default PartMaster;
