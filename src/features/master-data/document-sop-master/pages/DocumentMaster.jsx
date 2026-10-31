
// src/pages/DocumentSOPMaster/DocumentSOPMaster.jsx

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

import documentService from "../api/document.service.js";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import plantShopService from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";
import lineService from "../../../enterprise-setup/line-master/api/line.service.js";
import machineService from "../../machine-master/api/machine.service.js";


// ==========================================================
// CONSTANTS
// ==========================================================

const DOCUMENT_STATUS = [
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
    "RETIRED"
];


const CONFIDENTIALITY_LEVELS = [
    "PUBLIC",
    "INTERNAL",
    "CONFIDENTIAL",
    "RESTRICTED"
];


const APPROVAL_STATUS = [
    "DRAFT",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "OBSOLETE"
];


const DOCUMENT_ACTIONS = [
    "VIEW",
    "DOWNLOAD",
    "PRINT",
    "ACKNOWLEDGE"
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

function DocumentSOPMaster() {

    // ======================================================
    // DATA
    // ======================================================

    const [
        documents,
        setDocuments
    ] = useState([]);


    const [
        revisionConfigs,
        setRevisionConfigs
    ] = useState([]);


    const [
        accessConfigs,
        setAccessConfigs
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
        showRevisionConfig,
        setShowRevisionConfig
    ] = useState(false);


    const [
        showRevisionForm,
        setShowRevisionForm
    ] = useState(false);


    const [
        showAccessConfig,
        setShowAccessConfig
    ] = useState(false);


    const [
        showAccessForm,
        setShowAccessForm
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
    // EDIT IDs
    // ======================================================

    const [
        editId,
        setEditId
    ] = useState(null);


    const [
        revisionEditId,
        setRevisionEditId
    ] = useState(null);


    const [
        accessEditId,
        setAccessEditId
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

    const documentInitialState = {

        company_id: "",

        plant_id: "",

        line_id: "",

        machine_id: "",

        document_code: "",

        document_title: "",

        document_type: "",

        category: "",

        owner_department: "",

        confidentiality_level: "INTERNAL",

        status: "ACTIVE"

    };


    const revisionInitialState = {

        config_type: "REVISION",

        document_id: "",

        revision_no: "",

        file_name: "",

        file_url: "",

        mime_type: "",

        file_size_bytes: "",

        checksum_sha256: "",

        change_summary: "",

        effective_from: "",

        effective_to: "",

        is_current: false,

        approval_status: "DRAFT",

        approved_by: "",

        approved_at: ""

    };


    const accessInitialState = {

        config_type: "ACCESS",

        document_id: "",

        document_revision_id: "",

        role_id: "",

        user_id: "",

        plant_id: "",

        line_id: "",

        machine_id: "",

        can_view: true,

        can_download: false,

        can_print: false,

        effective_from: "",

        effective_to: "",

        is_active: true

    };


    const executeInitialState = {

        document_id: "",

        document_revision_id: "",

        action: "VIEW",

        client_ip: "",

        device_info: "OperateX Web",

        event_ts: "",

        correlation_id: "",

        idempotency_key: "",

        source_system: "OPERATEX",

        payload: "{}"

    };


    // ======================================================
    // FORM STATE
    // ======================================================

    const [
        formData,
        setFormData
    ] = useState(
        documentInitialState
    );


    const [
        revisionForm,
        setRevisionForm
    ] = useState(
        revisionInitialState
    );


    const [
        accessForm,
        setAccessForm
    ] = useState(
        accessInitialState
    );


    const [
        executeForm,
        setExecuteForm
    ] = useState(
        executeInitialState
    );


    // ======================================================
    // ERROR
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
    // DATE HELPERS
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
            .slice(0, 16);

    };


    const formatDate = value => {

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


        return date.toLocaleDateString();

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

                        loadDocuments(),

                        loadRevisionConfigs(),

                        loadAccessConfigs(),

                        loadCompanies(),

                        loadPlants(),

                        loadLines(),

                        loadMachines()

                    ]);


                const names = [

                    "Document Master",

                    "Document Revision",

                    "Document Access",

                    "Company",

                    "Plant",

                    "Line",

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
                    "Document Master Initial Load Error:",
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
    // DOCUMENT LOAD
    // ======================================================

    const loadDocuments =
        async () => {

            try {

                const response =
                    await documentService
                        .getMaster();


                setDocuments(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Document Master Load Error:",
                    error?.response?.data ||
                    error
                );


                setDocuments([]);


                showToast(

                    getErrorMessage(
                        error,
                        "Unable to load Document Master."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // REVISION LOAD
    // ======================================================

    const loadRevisionConfigs =
        async () => {

            try {

                const response =
                    await documentService
                        .getRevisionConfig();


                setRevisionConfigs(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Document Revision Load Error:",
                    error?.response?.data ||
                    error
                );


                setRevisionConfigs([]);

            }

        };


    // ======================================================
    // ACCESS LOAD
    // ======================================================

    const loadAccessConfigs =
        async () => {

            try {

                const response =
                    await documentService
                        .getAccessConfig();


                setAccessConfigs(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Document Access Load Error:",
                    error?.response?.data ||
                    error
                );


                setAccessConfigs([]);

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
    // OPTIONAL
    // ======================================================

    const loadMachines =
        async () => {

            try {

                const response =
                    await machineService
                        .getMaster();


                setMachines(
                    responseRows(
                        response
                    )
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
    // LOOKUP NAMES
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


    const getDocumentLabel =
        documentId => {

            const document =
                documents.find(
                    item =>
                        sameId(
                            item.document_id,
                            documentId
                        )
                );


            if (!document) {

                return "-";

            }


            return `${
                document.document_code ||
                ""
            } - ${
                document.document_title ||
                ""
            }`;

        };


    // ======================================================
    // AVAILABLE MASTER PLANTS
    // ======================================================

    const availablePlants =
        useMemo(() => {

            if (
                !formData.company_id
            ) {

                return plants;

            }


            return plants.filter(
                plant =>

                    !plant.company_id ||

                    sameId(
                        plant.company_id,
                        formData.company_id
                    )
            );

        }, [
            plants,
            formData.company_id
        ]);


    // ======================================================
    // AVAILABLE MASTER LINES
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
    // AVAILABLE MASTER MACHINES
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
            documentInitialState
        );

    };


    // ======================================================
    // ADD DOCUMENT
    // ======================================================

    const openAddModal = () => {

        resetForm();


        setShowForm(
            true
        );

    };


    // ======================================================
    // EDIT DOCUMENT
    // ======================================================

    const openEditModal =
        document => {

            setEditId(
                document.document_id
            );


            setFormData({

                company_id:
                    document.company_id || "",

                plant_id:
                    document.plant_id || "",

                line_id:
                    document.line_id || "",

                machine_id:
                    document.machine_id || "",

                document_code:
                    document.document_code || "",

                document_title:
                    document.document_title || "",

                document_type:
                    document.document_type || "",

                category:
                    document.category || "",

                owner_department:
                    document.owner_department || "",

                confidentiality_level:
                    document.confidentiality_level ||
                    "INTERNAL",

                status:
                    document.status ||
                    "ACTIVE"

            });


            setShowForm(
                true
            );

        };


    // ======================================================
    // SAVE DOCUMENT
    // ======================================================

    const saveDocument =
        async () => {

            try {

                if (
                    !formData.company_id ||
                    !formData.document_code.trim() ||
                    !formData.document_title.trim() ||
                    !formData.document_type.trim()
                ) {

                    showToast(
                        "Company, Document Code, Document Title and Document Type are required.",
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
                        formData.plant_id ||
                        null,

                    line_id:
                        formData.line_id ||
                        null,

                    machine_id:
                        formData.machine_id ||
                        null,

                    document_code:
                        formData.document_code
                            .trim(),

                    document_title:
                        formData.document_title
                            .trim(),

                    document_type:
                        formData.document_type
                            .trim(),

                    category:
                        formData.category
                            .trim() ||
                        null,

                    owner_department:
                        formData.owner_department
                            .trim() ||
                        null,

                    confidentiality_level:
                        formData.confidentiality_level,

                    status:
                        formData.status

                };


                if (
                    editId
                ) {

                    await documentService
                        .updateMaster(
                            editId,
                            payload
                        );


                    showToast(
                        "Document updated successfully."
                    );

                }
                else {

                    await documentService
                        .createMaster(
                            payload
                        );


                    showToast(
                        "Document created successfully."
                    );

                }


                setShowForm(
                    false
                );


                resetForm();


                await loadDocuments();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Document."
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
    // DELETE DOCUMENT
    // ======================================================

    const deleteDocument =
        async document => {

            if (
                !window.confirm(
                    `Deactivate document "${document.document_title}"?`
                )
            ) {

                return;

            }


            try {

                await documentService
                    .deleteMaster(
                        document.document_id
                    );


                showToast(
                    "Document deactivated successfully."
                );


                await loadDocuments();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Document."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // REVISION ADD
    // ======================================================

    const openAddRevision = () => {

        setRevisionEditId(
            null
        );


        setRevisionForm(
            revisionInitialState
        );


        setShowRevisionConfig(
            false
        );


        setShowRevisionForm(
            true
        );

    };


    // ======================================================
    // REVISION EDIT
    // ======================================================

    const openEditRevision =
        revision => {

            setRevisionEditId(
                revision.document_revision_id
            );


            setRevisionForm({

                config_type:
                    "REVISION",

                document_id:
                    revision.document_id || "",

                revision_no:
                    revision.revision_no || "",

                file_name:
                    revision.file_name || "",

                file_url:
                    revision.file_url || "",

                mime_type:
                    revision.mime_type || "",

                file_size_bytes:
                    revision.file_size_bytes ?? "",

                checksum_sha256:
                    revision.checksum_sha256 || "",

                change_summary:
                    revision.change_summary || "",

                effective_from:
                    toDateInput(
                        revision.effective_from
                    ),

                effective_to:
                    toDateInput(
                        revision.effective_to
                    ),

                is_current:
                    Boolean(
                        revision.is_current
                    ),

                approval_status:
                    revision.approval_status ||
                    "DRAFT",

                approved_by:
                    revision.approved_by ?? "",

                approved_at:
                    toDateTimeInput(
                        revision.approved_at
                    )

            });


            setShowRevisionConfig(
                false
            );


            setShowRevisionForm(
                true
            );

        };


    // ======================================================
    // SAVE REVISION
    // ======================================================

    const saveRevision =
        async () => {

            try {

                if (
                    !revisionForm.document_id ||
                    !revisionForm.revision_no.trim() ||
                    !revisionForm.file_name.trim() ||
                    !revisionForm.file_url.trim()
                ) {

                    showToast(
                        "Document, Revision No, File Name and File URL are required.",
                        "danger"
                    );


                    return;

                }


                if (
                    revisionForm.file_size_bytes !== "" &&
                    (
                        !Number.isInteger(
                            Number(
                                revisionForm.file_size_bytes
                            )
                        ) ||
                        Number(
                            revisionForm.file_size_bytes
                        ) < 0
                    )
                ) {

                    showToast(
                        "File Size must be a valid non-negative integer.",
                        "danger"
                    );


                    return;

                }


                if (
                    revisionForm.checksum_sha256.trim() &&
                    !/^[0-9a-fA-F]{64}$/.test(
                        revisionForm.checksum_sha256.trim()
                    )
                ) {

                    showToast(
                        "SHA256 checksum must contain exactly 64 hexadecimal characters.",
                        "danger"
                    );


                    return;

                }


                if (
                    revisionForm.effective_from &&
                    revisionForm.effective_to &&
                    new Date(
                        revisionForm.effective_to
                    ) <
                    new Date(
                        revisionForm.effective_from
                    )
                ) {

                    showToast(
                        "Effective To cannot be before Effective From.",
                        "danger"
                    );


                    return;

                }


                if (
                    revisionForm.approval_status ===
                    "APPROVED" &&
                    !revisionForm.approved_by
                ) {

                    showToast(
                        "Approved By User ID is required for an approved revision.",
                        "danger"
                    );


                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    config_type:
                        "REVISION",

                    document_id:
                        revisionForm.document_id,

                    revision_no:
                        revisionForm.revision_no
                            .trim(),

                    file_name:
                        revisionForm.file_name
                            .trim(),

                    file_url:
                        revisionForm.file_url
                            .trim(),

                    mime_type:
                        revisionForm.mime_type
                            .trim() ||
                        null,

                    file_size_bytes:
                        revisionForm.file_size_bytes === ""

                            ? null

                            : Number(
                                revisionForm.file_size_bytes
                            ),

                    checksum_sha256:
                        revisionForm.checksum_sha256
                            .trim() ||
                        null,

                    change_summary:
                        revisionForm.change_summary
                            .trim() ||
                        null,

                    effective_from:
                        revisionForm.effective_from ||
                        null,

                    effective_to:
                        revisionForm.effective_to ||
                        null,

                    is_current:
                        Boolean(
                            revisionForm.is_current
                        ),

                    approval_status:
                        revisionForm.approval_status,

                    approved_by:
                        revisionForm.approved_by === ""

                            ? null

                            : Number(
                                revisionForm.approved_by
                            ),

                    approved_at:
                        revisionForm.approved_at ||
                        null

                };


                if (
                    revisionEditId
                ) {

                    delete payload.config_type;


                    await documentService
                        .updateConfig(
                            "REVISION",
                            revisionEditId,
                            payload
                        );


                    showToast(
                        "Document Revision updated successfully."
                    );

                }
                else {

                    await documentService
                        .createConfig(
                            payload
                        );


                    showToast(
                        "Document Revision created successfully."
                    );

                }


                setRevisionEditId(
                    null
                );


                setRevisionForm(
                    revisionInitialState
                );


                setShowRevisionForm(
                    false
                );


                await loadRevisionConfigs();


                setShowRevisionConfig(
                    true
                );

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Document Revision."
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
    // DELETE REVISION
    // ======================================================

    const deleteRevision =
        async revision => {

            if (
                !window.confirm(
                    `Mark revision "${revision.revision_no}" as obsolete?`
                )
            ) {

                return;

            }


            try {

                await documentService
                    .deleteConfig(
                        "REVISION",
                        revision.document_revision_id
                    );


                showToast(
                    "Document Revision marked obsolete successfully."
                );


                await loadRevisionConfigs();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to update Document Revision."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // ACCESS DOCUMENT
    // ======================================================

    const selectedAccessDocument =
        useMemo(
            () =>

                documents.find(
                    document =>
                        sameId(
                            document.document_id,
                            accessForm.document_id
                        )
                ),

            [
                documents,
                accessForm.document_id
            ]
        );


    // ======================================================
    // ACCESS REVISIONS
    // ======================================================

    const accessRevisions =
        useMemo(() => {

            if (
                !accessForm.document_id
            ) {

                return [];

            }


            return revisionConfigs.filter(
                revision =>
                    sameId(
                        revision.document_id,
                        accessForm.document_id
                    )
            );

        }, [
            revisionConfigs,
            accessForm.document_id
        ]);


    // ======================================================
    // ACCESS PLANTS
    // ======================================================

    const accessPlants =
        useMemo(() => {

            if (
                !selectedAccessDocument
            ) {

                return plants;

            }


            return plants.filter(
                plant =>

                    !plant.company_id ||

                    sameId(
                        plant.company_id,
                        selectedAccessDocument.company_id
                    )
            );

        }, [
            plants,
            selectedAccessDocument
        ]);


    // ======================================================
    // ACCESS LINES
    // ======================================================

    const accessLines =
        useMemo(() => {

            if (
                !accessForm.plant_id
            ) {

                return [];

            }


            return lines.filter(
                line => {

                    const companyMatch =

                        !selectedAccessDocument ||

                        !line.company_id ||

                        sameId(
                            line.company_id,
                            selectedAccessDocument.company_id
                        );


                    const plantMatch =

                        !line.plant_id ||

                        sameId(
                            line.plant_id,
                            accessForm.plant_id
                        );


                    return (
                        companyMatch &&
                        plantMatch
                    );

                }
            );

        }, [
            lines,
            selectedAccessDocument,
            accessForm.plant_id
        ]);


    // ======================================================
    // ACCESS MACHINES
    // ======================================================

    const accessMachines =
        useMemo(() => {

            if (
                !accessForm.line_id
            ) {

                return [];

            }


            return machines.filter(
                machine => {

                    const plantMatch =

                        !machine.plant_id ||

                        sameId(
                            machine.plant_id,
                            accessForm.plant_id
                        );


                    const lineMatch =

                        !machine.line_id ||

                        sameId(
                            machine.line_id,
                            accessForm.line_id
                        );


                    return (
                        plantMatch &&
                        lineMatch
                    );

                }
            );

        }, [
            machines,
            accessForm.plant_id,
            accessForm.line_id
        ]);


    // ======================================================
    // ACCESS ADD
    // ======================================================

    const openAddAccess = () => {

        setAccessEditId(
            null
        );


        setAccessForm(
            accessInitialState
        );


        setShowAccessConfig(
            false
        );


        setShowAccessForm(
            true
        );

    };


    // ======================================================
    // ACCESS EDIT
    // ======================================================

    const openEditAccess =
        access => {

            setAccessEditId(
                access.document_access_id
            );


            setAccessForm({

                config_type:
                    "ACCESS",

                document_id:
                    access.document_id || "",

                document_revision_id:
                    access.document_revision_id || "",

                role_id:
                    access.role_id ?? "",

                user_id:
                    access.user_id ?? "",

                plant_id:
                    access.plant_id || "",

                line_id:
                    access.line_id || "",

                machine_id:
                    access.machine_id || "",

                can_view:
                    access.can_view !== false,

                can_download:
                    Boolean(
                        access.can_download
                    ),

                can_print:
                    Boolean(
                        access.can_print
                    ),

                effective_from:
                    toDateTimeInput(
                        access.effective_from
                    ),

                effective_to:
                    toDateTimeInput(
                        access.effective_to
                    ),

                is_active:
                    access.is_active !== false

            });


            setShowAccessConfig(
                false
            );


            setShowAccessForm(
                true
            );

        };


    // ======================================================
    // ROLE VALUE
    //
    // role_id may be INTEGER or UUID depending on DB.
    // ======================================================

    const normalizeRoleId =
        value => {

            const text =
                String(
                    value ?? ""
                ).trim();


            if (!text) {

                return null;

            }


            if (
                /^\d+$/.test(text)
            ) {

                return Number(text);

            }


            return text;

        };


    // ======================================================
    // SAVE ACCESS
    // ======================================================

    const saveAccess =
        async () => {

            try {

                if (
                    !accessForm.document_id
                ) {

                    showToast(
                        "Document is required.",
                        "danger"
                    );


                    return;

                }


                if (
                    accessForm.effective_from &&
                    accessForm.effective_to &&
                    new Date(
                        accessForm.effective_to
                    ) <
                    new Date(
                        accessForm.effective_from
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
                        "ACCESS",

                    document_id:
                        accessForm.document_id,

                    document_revision_id:
                        accessForm.document_revision_id ||
                        null,

                    role_id:
                        normalizeRoleId(
                            accessForm.role_id
                        ),

                    user_id:
                        accessForm.user_id === ""

                            ? null

                            : Number(
                                accessForm.user_id
                            ),

                    plant_id:
                        accessForm.plant_id ||
                        null,

                    line_id:
                        accessForm.line_id ||
                        null,

                    machine_id:
                        accessForm.machine_id ||
                        null,

                    can_view:
                        Boolean(
                            accessForm.can_view
                        ),

                    can_download:
                        Boolean(
                            accessForm.can_download
                        ),

                    can_print:
                        Boolean(
                            accessForm.can_print
                        ),

                    effective_from:
                        accessForm.effective_from ||
                        null,

                    effective_to:
                        accessForm.effective_to ||
                        null,

                    is_active:
                        Boolean(
                            accessForm.is_active
                        )

                };


                if (
                    accessEditId
                ) {

                    delete payload.config_type;


                    await documentService
                        .updateConfig(
                            "ACCESS",
                            accessEditId,
                            payload
                        );


                    showToast(
                        "Document Access updated successfully."
                    );

                }
                else {

                    await documentService
                        .createConfig(
                            payload
                        );


                    showToast(
                        "Document Access created successfully."
                    );

                }


                setAccessEditId(
                    null
                );


                setAccessForm(
                    accessInitialState
                );


                setShowAccessForm(
                    false
                );


                await loadAccessConfigs();


                setShowAccessConfig(
                    true
                );

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Document Access."
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
    // DELETE ACCESS
    // ======================================================

    const deleteAccess =
        async access => {

            if (
                !window.confirm(
                    `Deactivate access configuration for "${access.document_title || getDocumentLabel(access.document_id)}"?`
                )
            ) {

                return;

            }


            try {

                await documentService
                    .deleteConfig(
                        "ACCESS",
                        access.document_access_id
                    );


                showToast(
                    "Document Access deactivated successfully."
                );


                await loadAccessConfigs();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Document Access."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // EXECUTE DOCUMENT
    // ======================================================

    const selectedExecuteDocument =
        useMemo(
            () =>

                documents.find(
                    document =>
                        sameId(
                            document.document_id,
                            executeForm.document_id
                        )
                ),

            [
                documents,
                executeForm.document_id
            ]
        );


    // ======================================================
    // EXECUTE REVISIONS
    // ======================================================

    const executeRevisions =
        useMemo(() => {

            if (
                !executeForm.document_id
            ) {

                return [];

            }


            return revisionConfigs.filter(
                revision =>

                    sameId(
                        revision.document_id,
                        executeForm.document_id
                    ) &&

                    revision.approval_status !==
                    "OBSOLETE"
            );

        }, [
            revisionConfigs,
            executeForm.document_id
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
    // EXECUTE ACTION
    // ======================================================

    const executeDocumentAction =
        async () => {

            try {

                if (
                    !executeForm.document_id ||
                    !executeForm.document_revision_id ||
                    !executeForm.action
                ) {

                    showToast(
                        "Document, Revision and Action are required.",
                        "danger"
                    );


                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    document_id:
                        executeForm.document_id,

                    document_revision_id:
                        executeForm.document_revision_id,

                    action:
                        executeForm.action,

                    client_ip:
                        executeForm.client_ip
                            .trim() ||
                        null,

                    device_info:
                        executeForm.device_info
                            .trim() ||
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


                const response =
                    await documentService
                        .execute(
                            payload
                        );


                showToast(

                    response?.data?.message ||

                    "Document action recorded successfully."

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
                        "Unable to execute Document action."
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
                    await documentService
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
                        "Unable to load Document Runtime."
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
                    await documentService
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
                        "Unable to generate Document Report."
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

    const exportDocument =
        async () => {

            try {

                const response =
                    await documentService
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
                        "No Document data available for export.",
                        "warning"
                    );


                    return;

                }


                const columns = [

                    ["document_code", "Document Code"],

                    ["document_title", "Document Title"],

                    ["document_type", "Document Type"],

                    ["category", "Category"],

                    ["owner_department", "Owner Department"],

                    ["confidentiality_level", "Confidentiality"],

                    ["revision_no", "Current Revision"],

                    ["file_name", "File Name"],

                    ["file_url", "File URL"],

                    ["approval_status", "Approval Status"],

                    ["total_revisions", "Total Revisions"],

                    ["active_access_rules", "Active Access Rules"],

                    ["total_actions", "Total Actions"],

                    ["latest_user_id", "Latest User"],

                    ["latest_action", "Latest Action"],

                    ["latest_action_at", "Latest Action At"],

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
                    "Document_SOP_Master.csv";


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
    // FILTER DOCUMENTS
    // ======================================================

    const filteredDocuments =
        documents.filter(
            document => {

                const search =
                    searchText
                        .trim()
                        .toLowerCase();


                const values = [

                    document.document_code,

                    document.document_title,

                    document.document_type,

                    document.category,

                    document.owner_department,

                    document.confidentiality_level,

                    document.company_name ||
                    getCompanyName(
                        document.company_id
                    ),

                    document.plant_name ||
                    getPlantName(
                        document.plant_id
                    ),

                    document.line_name ||
                    getLineName(
                        document.line_id
                    ),

                    document.machine_name ||
                    getMachineName(
                        document.machine_id
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

                    document.status ===
                    statusFilter;


                return (
                    searchMatch &&
                    statusMatch
                );

            }
        );


    // ======================================================
    // MASTER COLUMNS
    // ======================================================

    const documentColumns = [

        {
            key: "document_code",
            label: "Document Code"
        },

        {
            key: "document_title",
            label: "Document Title"
        },

        {
            key: "document_type",
            label: "Type"
        },

        {
            key: "category",
            label: "Category"
        },

        {
            key: "owner_department",
            label: "Department"
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
            key: "confidentiality_level",
            label: "Confidentiality",

            render:
                row => (

                    <Badge
                        bg={
                            row.confidentiality_level ===
                            "PUBLIC"

                                ? "success"

                                : row.confidentiality_level ===
                                    "INTERNAL"

                                    ? "primary"

                                    : row.confidentiality_level ===
                                        "CONFIDENTIAL"

                                        ? "warning"

                                        : "danger"
                        }
                    >

                        {
                            row.confidentiality_level
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
    // REVISION COLUMNS
    // ======================================================

    const revisionColumns = [

        {
            key: "document_code",
            label: "Document",

            render:
                row =>
                    row.document_code

                        ? `${
                            row.document_code
                        } - ${
                            row.document_title ||
                            ""
                        }`

                        : getDocumentLabel(
                            row.document_id
                        )
        },

        {
            key: "revision_no",
            label: "Revision"
        },

        {
            key: "file_name",
            label: "File"
        },

        {
            key: "mime_type",
            label: "MIME"
        },

        {
            key: "effective_from",
            label: "Effective From",

            render:
                row =>
                    formatDate(
                        row.effective_from
                    )
        },

        {
            key: "effective_to",
            label: "Effective To",

            render:
                row =>
                    formatDate(
                        row.effective_to
                    )
        },

        {
            key: "is_current",
            label: "Current",

            render:
                row => (

                    <Badge
                        bg={
                            row.is_current
                                ? "success"
                                : "secondary"
                        }
                    >

                        {
                            row.is_current
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key: "approval_status",
            label: "Approval",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.approval_status
                        }
                    />

                )
        },

        {
            key: "approved_by",
            label: "Approved By"
        },

        {
            key: "approved_at",
            label: "Approved At",

            render:
                row =>
                    formatDateTime(
                        row.approved_at
                    )
        }

    ];


    // ======================================================
    // ACCESS COLUMNS
    // ======================================================

    const accessColumns = [

        {
            key: "document_code",
            label: "Document",

            render:
                row =>
                    row.document_code

                        ? `${
                            row.document_code
                        } - ${
                            row.document_title ||
                            ""
                        }`

                        : getDocumentLabel(
                            row.document_id
                        )
        },

        {
            key: "revision_no",
            label: "Revision"
        },

        {
            key: "role_id",
            label: "Role ID"
        },

        {
            key: "user_id",
            label: "User ID"
        },

        {
            key: "plant_id",
            label: "Plant",

            render:
                row =>
                    getPlantName(
                        row.plant_id
                    )
        },

        {
            key: "line_id",
            label: "Line",

            render:
                row =>
                    getLineName(
                        row.line_id
                    )
        },

        {
            key: "machine_id",
            label: "Machine",

            render:
                row =>
                    getMachineName(
                        row.machine_id
                    )
        },

        {
            key: "can_view",
            label: "View",

            render:
                row => (

                    <Badge
                        bg={
                            row.can_view
                                ? "success"
                                : "secondary"
                        }
                    >

                        {
                            row.can_view
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key: "can_download",
            label: "Download",

            render:
                row => (

                    <Badge
                        bg={
                            row.can_download
                                ? "success"
                                : "secondary"
                        }
                    >

                        {
                            row.can_download
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key: "can_print",
            label: "Print",

            render:
                row => (

                    <Badge
                        bg={
                            row.can_print
                                ? "success"
                                : "secondary"
                        }
                    >

                        {
                            row.can_print
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
            key: "document_code",
            label: "Document Code"
        },

        {
            key: "document_title",
            label: "Document Title"
        },

        {
            key: "revision_no",
            label: "Revision"
        },

        {
            key: "user_id",
            label: "User"
        },

        {
            key: "action",
            label: "Action",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.action
                        }
                    />

                )
        },

        {
            key: "approval_status",
            label: "Revision Status"
        },

        {
            key: "client_ip",
            label: "Client IP"
        },

        {
            key: "device_info",
            label: "Device"
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
            key: "document_code",
            label: "Document Code"
        },

        {
            key: "document_title",
            label: "Document Title"
        },

        {
            key: "document_type",
            label: "Type"
        },

        {
            key: "category",
            label: "Category"
        },

        {
            key: "owner_department",
            label: "Department"
        },

        {
            key: "confidentiality_level",
            label: "Confidentiality"
        },

        {
            key: "revision_no",
            label: "Current Revision"
        },

        {
            key: "approval_status",
            label: "Revision Status",

            render:
                row =>
                    row.approval_status

                        ? (
                            <StatusBadge
                                status={
                                    row.approval_status
                                }
                            />
                        )

                        : "-"
        },

        {
            key: "total_revisions",
            label: "Revisions"
        },

        {
            key: "active_access_rules",
            label: "Access Rules"
        },

        {
            key: "total_actions",
            label: "Actions"
        },

        {
            key: "latest_action",
            label: "Latest Action"
        },

        {
            key: "latest_action_at",
            label: "Latest Action At",

            render:
                row =>
                    formatDateTime(
                        row.latest_action_at
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
    // RENDER
    // ======================================================

    return (

        <>

<div className="document-master container-fluid">

            {/* =================================================
                TOAST
            ================================================= */}

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


            {/* =================================================
                HEADER
            ================================================= */}

            <Card className="shadow-sm border-0 mb-4">

                <Card.Body>

                    <Row className="align-items-center g-3">

                        <Col>

                            <h3 className="mb-1">
                                Document / SOP Master
                            </h3>

                            <small className="text-muted">
                                Master Data / Document & SOP Master
                            </small>

                        </Col>


                        <Col xs="auto">

                            <div className="d-flex gap-2 flex-wrap">

                                <Button
                                    variant="outline-primary"
                                    onClick={() => {

                                        loadRevisionConfigs();

                                        setShowRevisionConfig(
                                            true
                                        );

                                    }}
                                >
                                    Revision Config
                                </Button>


                                <Button
                                    variant="outline-primary"
                                    onClick={() => {

                                        loadAccessConfigs();

                                        setShowAccessConfig(
                                            true
                                        );

                                    }}
                                >
                                    Access Config
                                </Button>


                                <Button
                                    variant="primary"
                                    onClick={
                                        openAddModal
                                    }
                                >
                                    <Plus /> Add Document
                                </Button>

                            </div>

                        </Col>

                    </Row>

                </Card.Body>

            </Card>


            {/* =================================================
                SEARCH
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
                    exportDocument
                }
                placeholder="Search Document..."
            />


            {/* =================================================
                MASTER TABLE
            ================================================= */}

            <DataTable
                columns={
                    documentColumns
                }
                data={
                    filteredDocuments
                }
                loading={
                    loading
                }
                emptyMessage="No Document Found"
                renderActions={
                    document => (

                        <ActionButtons
                            onEdit={() =>
                                openEditModal(
                                    document
                                )
                            }
                            onDelete={() =>
                                deleteDocument(
                                    document
                                )
                            }
                        />

                    )
                }
            />


            {/* =================================================
                DOCUMENT MASTER FORM
            ================================================= */}

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
                                ? "Update Document / SOP"
                                : "Create Document / SOP"
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
                                        Plant
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
                                        disabled={
                                             Boolean(editId) ||
                                            !formData.plant_id
                                        }
                                        onChange={
                                            event =>

                                                setFormData(
                                                    previous => ({

                                                        ...previous,

                                                        line_id:
                                                            event.target.value,

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

                            <Col md={4}>

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

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Document Code *
                                    </Form.Label>

                                    <Form.Control
                                        name="document_code"
                                        value={
                                            formData.document_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="SOP-001"
                                        maxLength={75}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Document Type *
                                    </Form.Label>

                                    <Form.Control
                                        name="document_type"
                                        value={
                                            formData.document_type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="SOP / WI / DRAWING"
                                        maxLength={50}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={8}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Document Title *
                                    </Form.Label>

                                    <Form.Control
                                        name="document_title"
                                        value={
                                            formData.document_title
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        maxLength={200}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Category
                                    </Form.Label>

                                    <Form.Control
                                        name="category"
                                        value={
                                            formData.category
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        maxLength={75}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Owner Department
                                    </Form.Label>

                                    <Form.Control
                                        name="owner_department"
                                        value={
                                            formData.owner_department
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
                                        Confidentiality
                                    </Form.Label>

                                    <Form.Select
                                        name="confidentiality_level"
                                        value={
                                            formData.confidentiality_level
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        {
                                            CONFIDENTIALITY_LEVELS.map(
                                                level => (

                                                    <option
                                                        key={
                                                            level
                                                        }
                                                        value={
                                                            level
                                                        }
                                                    >
                                                        {level}
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
                                            DOCUMENT_STATUS.map(
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
                            saveDocument
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
                                    ? "Update Document"
                                    : "Save Document"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                REVISION CONFIG LIST
            ================================================= */}

            <Modal
                show={
                    showRevisionConfig
                }
                onHide={() =>
                    setShowRevisionConfig(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Document Revision Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddRevision
                            }
                        >
                            <Plus /> Add Revision
                        </Button>

                    </div>


                    <DataTable
                        columns={
                            revisionColumns
                        }
                        data={
                            revisionConfigs
                        }
                        loading={
                            loading
                        }
                        emptyMessage="No Document Revision Found"
                        renderActions={
                            revision => (

                                <ActionButtons
                                    onEdit={() =>
                                        openEditRevision(
                                            revision
                                        )
                                    }
                                    onDelete={() =>
                                        deleteRevision(
                                            revision
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
                            setShowRevisionConfig(
                                false
                            )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                REVISION FORM
            ================================================= */}

            <Modal
                show={
                    showRevisionForm
                }
                onHide={() => {

                    setShowRevisionForm(
                        false
                    );

                    setRevisionEditId(
                        null
                    );

                    setRevisionForm(
                        revisionInitialState
                    );

                    setShowRevisionConfig(
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
                            revisionEditId
                                ? "Update Document Revision"
                                : "Add Document Revision"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Document *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            revisionForm.document_id
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
                                                    previous => ({

                                                        ...previous,

                                                        document_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Document
                                        </option>


                                        {
                                            documents.map(
                                                document => (

                                                    <option
                                                        key={
                                                            document.document_id
                                                        }
                                                        value={
                                                            document.document_id
                                                        }
                                                    >

                                                        {
                                                            document.document_code
                                                        }

                                                        {" - "}

                                                        {
                                                            document.document_title
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
                                        Revision No *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            revisionForm.revision_no
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
                                                    previous => ({

                                                        ...previous,

                                                        revision_no:
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
                                        File Name *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            revisionForm.file_name
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
                                                    previous => ({

                                                        ...previous,

                                                        file_name:
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
                                        File URL *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            revisionForm.file_url
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
                                                    previous => ({

                                                        ...previous,

                                                        file_url:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                        placeholder="/documents/sop/example.pdf"
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        MIME Type
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            revisionForm.mime_type
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
                                                    previous => ({

                                                        ...previous,

                                                        mime_type:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                        placeholder="application/pdf"
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        File Size Bytes
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="0"
                                        value={
                                            revisionForm.file_size_bytes
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
                                                    previous => ({

                                                        ...previous,

                                                        file_size_bytes:
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
                                        Approval Status
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            revisionForm.approval_status
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
                                                    previous => ({

                                                        ...previous,

                                                        approval_status:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        {
                                            APPROVAL_STATUS.map(
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
                                SHA256 Checksum
                            </Form.Label>

                            <Form.Control
                                value={
                                    revisionForm.checksum_sha256
                                }
                                maxLength={64}
                                onChange={
                                    event =>

                                        setRevisionForm(
                                            previous => ({

                                                ...previous,

                                                checksum_sha256:
                                                    event.target.value

                                            })
                                        )
                                }
                            />

                        </Form.Group>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Change Summary
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={
                                    revisionForm.change_summary
                                }
                                onChange={
                                    event =>

                                        setRevisionForm(
                                            previous => ({

                                                ...previous,

                                                change_summary:
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
                                        Effective From
                                    </Form.Label>

                                    <Form.Control
                                        type="date"
                                        value={
                                            revisionForm.effective_from
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
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
                                        type="date"
                                        value={
                                            revisionForm.effective_to
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
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


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Approved By User ID
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            revisionForm.approved_by
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
                                                    previous => ({

                                                        ...previous,

                                                        approved_by:
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
                                        Approved At
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            revisionForm.approved_at
                                        }
                                        onChange={
                                            event =>

                                                setRevisionForm(
                                                    previous => ({

                                                        ...previous,

                                                        approved_at:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col
                                md={4}
                                className="d-flex align-items-center"
                            >

                                <Form.Check
                                    type="checkbox"
                                    label="Current Revision"
                                    checked={
                                        revisionForm.is_current
                                    }
                                    onChange={
                                        event =>

                                            setRevisionForm(
                                                previous => ({

                                                    ...previous,

                                                    is_current:
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

                            setShowRevisionForm(
                                false
                            );

                            setRevisionEditId(
                                null
                            );

                            setRevisionForm(
                                revisionInitialState
                            );

                            setShowRevisionConfig(
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
                            saveRevision
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : revisionEditId
                                    ? "Update Revision"
                                    : "Save Revision"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                ACCESS CONFIG LIST
            ================================================= */}

            <Modal
                show={
                    showAccessConfig
                }
                onHide={() =>
                    setShowAccessConfig(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Document Access Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddAccess
                            }
                        >
                            <Plus /> Add Access
                        </Button>

                    </div>


                    <DataTable
                        columns={
                            accessColumns
                        }
                        data={
                            accessConfigs
                        }
                        loading={
                            loading
                        }
                        emptyMessage="No Document Access Configuration Found"
                        renderActions={
                            access => (

                                <ActionButtons
                                    onEdit={() =>
                                        openEditAccess(
                                            access
                                        )
                                    }
                                    onDelete={() =>
                                        deleteAccess(
                                            access
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
                            setShowAccessConfig(
                                false
                            )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                ACCESS FORM
            ================================================= */}

            <Modal
                show={
                    showAccessForm
                }
                onHide={() => {

                    setShowAccessForm(
                        false
                    );

                    setAccessEditId(
                        null
                    );

                    setAccessForm(
                        accessInitialState
                    );

                    setShowAccessConfig(
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
                            accessEditId
                                ? "Update Document Access"
                                : "Add Document Access"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Document *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            accessForm.document_id
                                        }
                                        onChange={
                                            event => {

                                                const documentId =
                                                    event.target.value;


                                                const document =
                                                    documents.find(
                                                        item =>
                                                            sameId(
                                                                item.document_id,
                                                                documentId
                                                            )
                                                    );


                                                setAccessForm(
                                                    previous => ({

                                                        ...previous,

                                                        document_id:
                                                            documentId,

                                                        document_revision_id:
                                                            "",

                                                        plant_id:
                                                            document?.plant_id ||
                                                            "",

                                                        line_id:
                                                            document?.line_id ||
                                                            "",

                                                        machine_id:
                                                            document?.machine_id ||
                                                            ""

                                                    })
                                                );

                                            }
                                        }
                                    >

                                        <option value="">
                                            Select Document
                                        </option>


                                        {
                                            documents.map(
                                                document => (

                                                    <option
                                                        key={
                                                            document.document_id
                                                        }
                                                        value={
                                                            document.document_id
                                                        }
                                                    >

                                                        {
                                                            document.document_code
                                                        }

                                                        {" - "}

                                                        {
                                                            document.document_title
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
                                        Revision
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            accessForm.document_revision_id
                                        }
                                        disabled={
                                            !accessForm.document_id
                                        }
                                        onChange={
                                            event =>

                                                setAccessForm(
                                                    previous => ({

                                                        ...previous,

                                                        document_revision_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            All Revisions
                                        </option>


                                        {
                                            accessRevisions.map(
                                                revision => (

                                                    <option
                                                        key={
                                                            revision.document_revision_id
                                                        }
                                                        value={
                                                            revision.document_revision_id
                                                        }
                                                    >

                                                        {
                                                            revision.revision_no
                                                        }

                                                        {
                                                            revision.is_current
                                                                ? " - CURRENT"
                                                                : ""
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
                                        Role ID
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            accessForm.role_id
                                        }
                                        onChange={
                                            event =>

                                                setAccessForm(
                                                    previous => ({

                                                        ...previous,

                                                        role_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                        placeholder="Role ID"
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        User ID
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            accessForm.user_id
                                        }
                                        onChange={
                                            event =>

                                                setAccessForm(
                                                    previous => ({

                                                        ...previous,

                                                        user_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                        placeholder="Optional User ID"
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Plant
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            accessForm.plant_id
                                        }
                                        disabled={
                                            !accessForm.document_id
                                        }
                                        onChange={
                                            event =>

                                                setAccessForm(
                                                    previous => ({

                                                        ...previous,

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
                                            accessPlants.map(
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
                                            accessForm.line_id
                                        }
                                        disabled={
                                            !accessForm.plant_id
                                        }
                                        onChange={
                                            event =>

                                                setAccessForm(
                                                    previous => ({

                                                        ...previous,

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
                                            accessLines.map(
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


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Machine
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            accessForm.machine_id
                                        }
                                        disabled={
                                            !accessForm.line_id
                                        }
                                        onChange={
                                            event =>

                                                setAccessForm(
                                                    previous => ({

                                                        ...previous,

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
                                            accessMachines.map(
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
                                        Effective From
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            accessForm.effective_from
                                        }
                                        onChange={
                                            event =>

                                                setAccessForm(
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
                                            accessForm.effective_to
                                        }
                                        onChange={
                                            event =>

                                                setAccessForm(
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


                        <Row>

                            <Col md={3}>

                                <Form.Check
                                    type="checkbox"
                                    label="Can View"
                                    checked={
                                        accessForm.can_view
                                    }
                                    onChange={
                                        event =>

                                            setAccessForm(
                                                previous => ({

                                                    ...previous,

                                                    can_view:
                                                        event.target.checked

                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Check
                                    type="checkbox"
                                    label="Can Download"
                                    checked={
                                        accessForm.can_download
                                    }
                                    onChange={
                                        event =>

                                            setAccessForm(
                                                previous => ({

                                                    ...previous,

                                                    can_download:
                                                        event.target.checked

                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Check
                                    type="checkbox"
                                    label="Can Print"
                                    checked={
                                        accessForm.can_print
                                    }
                                    onChange={
                                        event =>

                                            setAccessForm(
                                                previous => ({

                                                    ...previous,

                                                    can_print:
                                                        event.target.checked

                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={3}>

                                <Form.Check
                                    type="checkbox"
                                    label="Active"
                                    checked={
                                        accessForm.is_active
                                    }
                                    onChange={
                                        event =>

                                            setAccessForm(
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

                            setShowAccessForm(
                                false
                            );

                            setAccessEditId(
                                null
                            );

                            setAccessForm(
                                accessInitialState
                            );

                            setShowAccessConfig(
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
                            saveAccess
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : accessEditId
                                    ? "Update Access"
                                    : "Save Access"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                RUNTIME
            ================================================= */}

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
                        Document Runtime / Action History
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
                        emptyMessage="No Document Actions Found"
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


            {/* =================================================
                EXECUTE
            ================================================= */}

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
                        Execute Document Action
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Document *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.document_id
                                        }
                                        onChange={
                                            event => {

                                                const documentId =
                                                    event.target.value;


                                                const revisions =
                                                    revisionConfigs.filter(
                                                        revision =>

                                                            sameId(
                                                                revision.document_id,
                                                                documentId
                                                            ) &&

                                                            revision.approval_status !==
                                                            "OBSOLETE"
                                                    );


                                                const currentRevision =
                                                    revisions.find(
                                                        revision =>
                                                            revision.is_current
                                                    );


                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        document_id:
                                                            documentId,

                                                        document_revision_id:
                                                            currentRevision
                                                                ?.document_revision_id ||
                                                            ""

                                                    })
                                                );

                                            }
                                        }
                                    >

                                        <option value="">
                                            Select Document
                                        </option>


                                        {
                                            documents

                                                .filter(
                                                    document =>
                                                        document.status ===
                                                        "ACTIVE"
                                                )

                                                .map(
                                                    document => (

                                                        <option
                                                            key={
                                                                document.document_id
                                                            }
                                                            value={
                                                                document.document_id
                                                            }
                                                        >

                                                            {
                                                                document.document_code
                                                            }

                                                            {" - "}

                                                            {
                                                                document.document_title
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
                                        Revision *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.document_revision_id
                                        }
                                        disabled={
                                            !selectedExecuteDocument
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        document_revision_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Revision
                                        </option>


                                        {
                                            executeRevisions.map(
                                                revision => (

                                                    <option
                                                        key={
                                                            revision.document_revision_id
                                                        }
                                                        value={
                                                            revision.document_revision_id
                                                        }
                                                    >

                                                        {
                                                            revision.revision_no
                                                        }

                                                        {
                                                            revision.is_current
                                                                ? " - CURRENT"
                                                                : ""
                                                        }

                                                        {" - "}

                                                        {
                                                            revision.approval_status
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
                                        Action *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.action
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        action:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        {
                                            DOCUMENT_ACTIONS.map(
                                                action => (

                                                    <option
                                                        key={
                                                            action
                                                        }
                                                        value={
                                                            action
                                                        }
                                                    >
                                                        {action}
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
                                        Device Info
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.device_info
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        device_info:
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
                                        Client IP
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.client_ip
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        client_ip:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                        placeholder="Optional"
                                    />

                                </Form.Group>

                            </Col>


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
                            executeDocumentAction
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


            {/* =================================================
                REPORT
            ================================================= */}

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
                        Document / SOP Report
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
                        emptyMessage="No Document Report Data Found"
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


export default DocumentSOPMaster;