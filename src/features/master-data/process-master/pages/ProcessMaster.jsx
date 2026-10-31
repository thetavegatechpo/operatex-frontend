
// src/pages/ProcessMaster/ProcessMaster.jsx

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


import SearchToolbar from "../../../../shared/components/SearchToolbar.jsx";
import DataTable from "../../../../shared/components/DataTable.jsx";
import StatusBadge from "../../../../shared/components/StatusBadge.jsx";
import ActionButtons from "../../../../shared/components/ActionButtons.jsx";


import processService from "../api/process.service.js";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import plantShopService from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";
import lineService from "../../../enterprise-setup/line-master/api/line.service.js";
import machineService from "../../machine-master/api/machine.service.js";


// ==========================================================
// CONSTANTS
// ==========================================================

const MASTER_STATUS = [
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


const EVENT_STATUS = [
    "PENDING",
    "OK",
    "NOK",
    "WARNING",
    "ERROR",
    "COMPLETED",
    "CANCELLED"
];


// ==========================================================
// DATE HELPER
// ==========================================================

const todayValue = () => {

    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

};


// ==========================================================
// EMPTY MASTER
// ==========================================================

const emptyProcess = {

    company_id:
        "",

    process_code:
        "",

    process_name:
        "",

    process_type:
        "",

    description:
        "",

    default_cycle_time_sec:
        "",

    status:
        "ACTIVE"

};


// ==========================================================
// EMPTY REVISION
// ==========================================================

const emptyRevision = {

    process_id:
        "",

    revision_no:
        "",

    effective_from:
        todayValue(),

    effective_to:
        "",

    release_status:
        "DRAFT",

    is_current:
        false,

    process_config:
        "{}",

    approved_by:
        "",

    approved_at:
        ""

};


// ==========================================================
// EMPTY OPERATION
// ==========================================================

const emptyOperation = {

    process_revision_id:
        "",

    operation_no:
        "",

    operation_code:
        "",

    operation_name:
        "",

    operation_type:
        "",

    ideal_cycle_time_sec:
        "",

    tolerance_plus_sec:
        0,

    tolerance_minus_sec:
        0,

    required_skill_code:
        "",

    sequence_no:
        "",

    is_mandatory:
        true,

    operation_config:
        "{}",

    status:
        "ACTIVE"

};


// ==========================================================
// EMPTY EXECUTE
// ==========================================================

const emptyExecute = {

    process_id:
        "",

    process_revision_id:
        "",

    operation_id:
        "",

    plant_id:
        "",

    line_id:
        "",

    machine_id:
        "",

    event_type:
        "",

    status:
        "COMPLETED",

    event_ts:
        "",

    correlation_id:
        "",

    idempotency_key:
        "",

    source_system:
        "",

    payload:
        "{}"

};


// ==========================================================
// MAIN COMPONENT
// ==========================================================

function ProcessMaster() {

    // ======================================================
    // DATA
    // ======================================================

    const [
        processes,
        setProcesses
    ] = useState([]);


    const [
        revisions,
        setRevisions
    ] = useState([]);


    const [
        operations,
        setOperations
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
    // RELATED MASTER DATA
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
        lines,
        setLines
    ] = useState([]);


    const [
        machines,
        setMachines
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
    // MASTER MODAL
    // ======================================================

    const [
        showForm,
        setShowForm
    ] = useState(false);


    const [
        processEditId,
        setProcessEditId
    ] = useState(null);


    const [
        processForm,
        setProcessForm
    ] = useState(
        emptyProcess
    );


    // ======================================================
    // REVISION MODALS
    // ======================================================

    const [
        showRevisionConfig,
        setShowRevisionConfig
    ] = useState(false);


    const [
        showRevisionForm,
        setShowRevisionForm
    ] = useState(false);


    const [
        revisionEditId,
        setRevisionEditId
    ] = useState(null);


    const [
        revisionForm,
        setRevisionForm
    ] = useState(
        emptyRevision
    );


    // ======================================================
    // OPERATION MODALS
    // ======================================================

    const [
        showOperationConfig,
        setShowOperationConfig
    ] = useState(false);


    const [
        showOperationForm,
        setShowOperationForm
    ] = useState(false);


    const [
        operationEditId,
        setOperationEditId
    ] = useState(null);


    const [
        operationForm,
        setOperationForm
    ] = useState(
        emptyOperation
    );


    // ======================================================
    // RUNTIME / EXECUTE / REPORT
    // ======================================================

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
        executeForm,
        setExecuteForm
    ] = useState(
        emptyExecute
    );


    // ======================================================
    // TOAST
    // ======================================================

    const [
        toast,
        setToast
    ] = useState({

        show:
            false,

        variant:
            "success",

        message:
            ""

    });


    const showToast = (
        message,
        variant = "success"
    ) => {

        setToast({

            show:
                true,

            variant,

            message

        });

    };


    // ======================================================
    // ERROR MESSAGE HELPER
    // ======================================================

    const getErrorMessage = (
        error,
        fallback
    ) => {

        const data =
            error?.response?.data;


        if (
            Array.isArray(
                data?.errors
            ) &&
            data.errors.length
        ) {

            return data.errors.join(
                ", "
            );

        }


        return (
            data?.message ||
            error?.message ||
            fallback
        );

    };


    // ======================================================
    // JSON PARSER
    // ======================================================

    const parseJson = (
        value,
        name
    ) => {

        if (
            value === "" ||
            value === undefined ||
            value === null
        ) {

            return {};

        }


        if (
            typeof value ===
            "object"
        ) {

            return value;

        }


        try {

            const parsed =
                JSON.parse(
                    value
                );


            if (
                parsed === null ||
                Array.isArray(parsed) ||
                typeof parsed !==
                    "object"
            ) {

                throw new Error();

            }


            return parsed;

        }

        catch {

            throw new Error(
                `${name} must contain a valid JSON object.`
            );

        }

    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(
        () => {

            loadInitialData();

        },
        []
    );


    // ======================================================
    // LOAD INITIAL
    // ======================================================

    const loadInitialData =
        async () => {

            try {

                setLoading(
                    true
                );


                await Promise.all([

                    loadProcesses(),

                    loadRevisions(),

                    loadOperations(),

                    loadCompanies(),

                    loadPlants(),

                    loadLines(),

                    loadMachines()

                ]);

            }

            catch (error) {

                console.error(
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
    // LOAD PROCESSES
    // ======================================================

    const loadProcesses =
        async () => {

            try {

                const response =
                    await processService.getMaster();


                setProcesses(
                    response.data.data ||
                    []
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to load Process Master."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // LOAD REVISIONS
    // ======================================================

    const loadRevisions =
        async () => {

            try {

                const response =
                    await processService.getRevisionConfig();


                setRevisions(
                    response.data.data ||
                    []
                );

            }

            catch (error) {

                console.error(
                    "Revision:",
                    error.response?.data ||
                    error
                );

            }

        };


    // ======================================================
    // LOAD OPERATIONS
    // ======================================================

    const loadOperations =
        async () => {

            try {

                const response =
                    await processService.getOperationConfig();


                setOperations(
                    response.data.data ||
                    []
                );

            }

            catch (error) {

                console.error(
                    "Operation:",
                    error.response?.data ||
                    error
                );

            }

        };


    // ======================================================
    // RELATED DATA
    // ======================================================

    const loadCompanies =
        async () => {

            const response =
                await companyService.getMaster();


            setCompanies(
                response.data.data ||
                []
            );

        };


    const loadPlants =
        async () => {

            const response =
                await plantShopService.getMaster();


            const data =
                response.data.data ||
                [];


            setPlants(

                data.filter(
                    item =>
                        item.type ===
                            "PLANT" ||
                        item.plant_id
                )

            );

        };


    const loadLines =
        async () => {

            const response =
                await lineService.getMaster();


            setLines(
                response.data.data ||
                []
            );

        };


    const loadMachines =
        async () => {

            const response =
                await machineService.getMaster();


            setMachines(
                response.data.data ||
                []
            );

        };


    // ======================================================
    // FILTER MAIN TABLE
    // ======================================================

    const filteredProcesses =
        useMemo(
            () => {

                const search =
                    searchText
                        .trim()
                        .toLowerCase();


                return processes.filter(
                    process => {

                        const searchMatch =
                            !search ||

                            process.process_code
                                ?.toLowerCase()
                                .includes(
                                    search
                                ) ||

                            process.process_name
                                ?.toLowerCase()
                                .includes(
                                    search
                                ) ||

                            process.process_type
                                ?.toLowerCase()
                                .includes(
                                    search
                                ) ||

                            process.company_name
                                ?.toLowerCase()
                                .includes(
                                    search
                                ) ||

                            process.current_revision_no
                                ?.toLowerCase()
                                .includes(
                                    search
                                );


                        const statusMatch =
                            statusFilter ===
                                "ALL" ||
                            process.status ===
                                statusFilter;


                        return (
                            searchMatch &&
                            statusMatch
                        );

                    }
                );

            },
            [
                processes,
                searchText,
                statusFilter
            ]
        );


    // ======================================================
    // PROCESS FORM
    // ======================================================

    const openAddProcess =
        () => {

            setProcessEditId(
                null
            );


            setProcessForm({
                ...emptyProcess
            });


            setShowForm(
                true
            );

        };


    const openEditProcess =
        process => {

            setProcessEditId(
                process.process_id
            );


            setProcessForm({

                company_id:
                    process.company_id ||
                    "",

                process_code:
                    process.process_code ||
                    "",

                process_name:
                    process.process_name ||
                    "",

                process_type:
                    process.process_type ||
                    "",

                description:
                    process.description ||
                    "",

                default_cycle_time_sec:
                    process.default_cycle_time_sec ??
                    "",

                status:
                    process.status ||
                    "ACTIVE"

            });


            setShowForm(
                true
            );

        };


    const saveProcess =
        async () => {

            try {

                if (
                    !processForm.company_id ||
                    !processForm.process_code.trim() ||
                    !processForm.process_name.trim() ||
                    !processForm.process_type.trim()
                ) {

                    showToast(
                        "Company, Process Code, Process Name and Process Type are required.",
                        "danger"
                    );

                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    ...processForm,

                    default_cycle_time_sec:
                        processForm.default_cycle_time_sec ===
                        ""
                            ? null
                            : Number(
                                processForm.default_cycle_time_sec
                            )

                };


                if (
                    processEditId
                ) {

                    await processService.updateMaster(

                        processEditId,

                        payload

                    );


                    showToast(
                        "Process updated successfully."
                    );

                }

                else {

                    await processService.createMaster(
                        payload
                    );


                    showToast(
                        "Process created successfully."
                    );

                }


                setShowForm(
                    false
                );


                setProcessEditId(
                    null
                );


                setProcessForm({
                    ...emptyProcess
                });


                await loadProcesses();

                await loadRevisions();

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Process."
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
    // DELETE PROCESS
    // ======================================================

    const deleteProcess =
        async process => {

            const confirmed =
                window.confirm(
                    `Deactivate process "${process.process_name}"?`
                );


            if (!confirmed) {

                return;

            }


            try {

                await processService.deleteMaster(
                    process.process_id
                );


                showToast(
                    "Process deactivated successfully."
                );


                await loadProcesses();

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Process."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // REVISION FORM
    // ======================================================

    const openAddRevision =
        () => {

            setRevisionEditId(
                null
            );


            setRevisionForm({
                ...emptyRevision,
                effective_from:
                    todayValue()
            });


            setShowRevisionConfig(
                false
            );


            setShowRevisionForm(
                true
            );

        };


    const openEditRevision =
        revision => {

            setRevisionEditId(
                revision.process_revision_id
            );


            setRevisionForm({

                process_id:
                    revision.process_id ||
                    "",

                revision_no:
                    revision.revision_no ||
                    "",

                effective_from:
                    revision.effective_from
                        ? String(
                            revision.effective_from
                        ).slice(
                            0,
                            10
                        )
                        : "",

                effective_to:
                    revision.effective_to
                        ? String(
                            revision.effective_to
                        ).slice(
                            0,
                            10
                        )
                        : "",

                release_status:
                    revision.release_status ||
                    "DRAFT",

                is_current:
                    Boolean(
                        revision.is_current
                    ),

                process_config:
                    JSON.stringify(
                        revision.process_config ||
                        {},
                        null,
                        2
                    ),

                approved_by:
                    revision.approved_by ??
                    "",

                approved_at:
                    revision.approved_at
                        ? String(
                            revision.approved_at
                        ).slice(
                            0,
                            16
                        )
                        : ""

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
                    !revisionForm.process_id ||
                    !revisionForm.revision_no.trim()
                ) {

                    showToast(
                        "Process and Revision No are required.",
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

                    process_id:
                        revisionForm.process_id,

                    revision_no:
                        revisionForm.revision_no.trim(),

                    effective_from:
                        revisionForm.effective_from ||
                        null,

                    effective_to:
                        revisionForm.effective_to ||
                        null,

                    release_status:
                        revisionForm.release_status,

                    is_current:
                        revisionForm.is_current,

                    process_config:
                        parseJson(
                            revisionForm.process_config,
                            "Process Config"
                        ),

                    approved_by:
                        revisionForm.approved_by ===
                        ""
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


                    await processService.updateConfig(

                        "REVISION",

                        revisionEditId,

                        payload

                    );


                    showToast(
                        "Revision updated successfully."
                    );

                }

                else {

                    await processService.createConfig(
                        payload
                    );


                    showToast(
                        "Revision created successfully."
                    );

                }


                setShowRevisionForm(
                    false
                );


                setRevisionEditId(
                    null
                );


                setRevisionForm({
                    ...emptyRevision,
                    effective_from:
                        todayValue()
                });


                await loadRevisions();

                await loadProcesses();

                await loadOperations();


                setShowRevisionConfig(
                    true
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Revision."
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

                await processService.deleteConfig(

                    "REVISION",

                    revision.process_revision_id

                );


                showToast(
                    "Revision marked obsolete successfully."
                );


                await loadRevisions();

                await loadProcesses();

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to delete Revision."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // OPERATION FORM
    // ======================================================

    const openAddOperation =
        () => {

            setOperationEditId(
                null
            );


            setOperationForm({
                ...emptyOperation
            });


            setShowOperationConfig(
                false
            );


            setShowOperationForm(
                true
            );

        };


    const openEditOperation =
        operation => {

            setOperationEditId(
                operation.operation_id
            );


            setOperationForm({

                process_revision_id:
                    operation.process_revision_id ||
                    "",

                operation_no:
                    operation.operation_no ??
                    "",

                operation_code:
                    operation.operation_code ||
                    "",

                operation_name:
                    operation.operation_name ||
                    "",

                operation_type:
                    operation.operation_type ||
                    "",

                ideal_cycle_time_sec:
                    operation.ideal_cycle_time_sec ??
                    "",

                tolerance_plus_sec:
                    operation.tolerance_plus_sec ??
                    0,

                tolerance_minus_sec:
                    operation.tolerance_minus_sec ??
                    0,

                required_skill_code:
                    operation.required_skill_code ||
                    "",

                sequence_no:
                    operation.sequence_no ??
                    "",

                is_mandatory:
                    Boolean(
                        operation.is_mandatory
                    ),

                operation_config:
                    JSON.stringify(
                        operation.operation_config ||
                        {},
                        null,
                        2
                    ),

                status:
                    operation.status ||
                    "ACTIVE"

            });


            setShowOperationConfig(
                false
            );


            setShowOperationForm(
                true
            );

        };


    // ======================================================
    // SAVE OPERATION
    // ======================================================

    const saveOperation =
        async () => {

            try {

                if (
                    !operationForm.process_revision_id ||
                    !operationForm.operation_no ||
                    !operationForm.operation_code.trim() ||
                    !operationForm.operation_name.trim() ||
                    !operationForm.operation_type.trim() ||
                    !operationForm.sequence_no
                ) {

                    showToast(
                        "Revision, Operation No, Code, Name, Type and Sequence are required.",
                        "danger"
                    );

                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    config_type:
                        "OPERATION",

                    process_revision_id:
                        operationForm.process_revision_id,

                    operation_no:
                        Number(
                            operationForm.operation_no
                        ),

                    operation_code:
                        operationForm.operation_code.trim(),

                    operation_name:
                        operationForm.operation_name.trim(),

                    operation_type:
                        operationForm.operation_type.trim(),

                    ideal_cycle_time_sec:
                        operationForm.ideal_cycle_time_sec ===
                        ""
                            ? null
                            : Number(
                                operationForm.ideal_cycle_time_sec
                            ),

                    tolerance_plus_sec:
                        Number(
                            operationForm.tolerance_plus_sec ||
                            0
                        ),

                    tolerance_minus_sec:
                        Number(
                            operationForm.tolerance_minus_sec ||
                            0
                        ),

                    required_skill_code:
                        operationForm.required_skill_code.trim() ||
                        null,

                    sequence_no:
                        Number(
                            operationForm.sequence_no
                        ),

                    is_mandatory:
                        operationForm.is_mandatory,

                    operation_config:
                        parseJson(
                            operationForm.operation_config,
                            "Operation Config"
                        ),

                    status:
                        operationForm.status

                };


                if (
                    operationEditId
                ) {

                    delete payload.config_type;


                    await processService.updateConfig(

                        "OPERATION",

                        operationEditId,

                        payload

                    );


                    showToast(
                        "Operation updated successfully."
                    );

                }

                else {

                    await processService.createConfig(
                        payload
                    );


                    showToast(
                        "Operation created successfully."
                    );

                }


                setShowOperationForm(
                    false
                );


                setOperationEditId(
                    null
                );


                setOperationForm({
                    ...emptyOperation
                });


                await loadOperations();

                await loadProcesses();


                setShowOperationConfig(
                    true
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Operation."
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
    // DELETE OPERATION
    // ======================================================

    const deleteOperation =
        async operation => {

            if (
                !window.confirm(
                    `Deactivate operation "${operation.operation_name}"?`
                )
            ) {

                return;

            }


            try {

                await processService.deleteConfig(

                    "OPERATION",

                    operation.operation_id

                );


                showToast(
                    "Operation deactivated successfully."
                );


                await loadOperations();

                await loadProcesses();

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Operation."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // EXECUTE FILTERED REVISIONS
    // ======================================================

    const executeRevisions =
        useMemo(
            () => {

                if (
                    !executeForm.process_id
                ) {

                    return revisions;

                }


                return revisions.filter(
                    revision =>
                        revision.process_id ===
                        executeForm.process_id
                );

            },
            [
                revisions,
                executeForm.process_id
            ]
        );


    // ======================================================
    // EXECUTE FILTERED OPERATIONS
    // ======================================================

    const executeOperations =
        useMemo(
            () => {

                if (
                    executeForm.process_revision_id
                ) {

                    return operations.filter(
                        operation =>
                            operation.process_revision_id ===
                            executeForm.process_revision_id &&
                            operation.status !==
                            "INACTIVE"
                    );

                }


                if (
                    executeForm.process_id
                ) {

                    return operations.filter(
                        operation =>
                            operation.process_id ===
                            executeForm.process_id &&
                            operation.status !==
                            "INACTIVE"
                    );

                }


                return operations.filter(
                    operation =>
                        operation.status !==
                        "INACTIVE"
                );

            },
            [
                operations,
                executeForm.process_id,
                executeForm.process_revision_id
            ]
        );


    // ======================================================
    // EXECUTE LINES
    // ======================================================

    const executeLines =
        useMemo(
            () => {

                if (
                    !executeForm.plant_id
                ) {

                    return lines;

                }


                return lines.filter(
                    line =>
                        !line.plant_id ||
                        line.plant_id ===
                        executeForm.plant_id
                );

            },
            [
                lines,
                executeForm.plant_id
            ]
        );


    // ======================================================
    // EXECUTE MACHINES
    // ======================================================

    const executeMachines =
        useMemo(
            () => {

                return machines.filter(
                    machine => {

                        const plantMatch =
                            !executeForm.plant_id ||
                            !machine.plant_id ||
                            machine.plant_id ===
                            executeForm.plant_id;


                        const lineMatch =
                            !executeForm.line_id ||
                            !machine.line_id ||
                            machine.line_id ===
                            executeForm.line_id;


                        return (
                            plantMatch &&
                            lineMatch
                        );

                    }
                );

            },
            [
                machines,
                executeForm.plant_id,
                executeForm.line_id
            ]
        );


    // ======================================================
    // EXECUTE
    // ======================================================

    const executeProcess =
        async () => {

            try {

                if (
                    !executeForm.process_id ||
                    !executeForm.event_type.trim()
                ) {

                    showToast(
                        "Process and Event Type are required.",
                        "danger"
                    );

                    return;

                }


                setSaving(
                    true
                );


                const payload = {

                    process_id:
                        executeForm.process_id,

                    process_revision_id:
                        executeForm.process_revision_id ||
                        null,

                    operation_id:
                        executeForm.operation_id ||
                        null,

                    plant_id:
                        executeForm.plant_id ||
                        null,

                    line_id:
                        executeForm.line_id ||
                        null,

                    machine_id:
                        executeForm.machine_id ||
                        null,

                    event_type:
                        executeForm.event_type.trim(),

                    status:
                        executeForm.status,

                    event_ts:
                        executeForm.event_ts ||
                        null,

                    correlation_id:
                        executeForm.correlation_id ||
                        null,

                    idempotency_key:
                        executeForm.idempotency_key ||
                        null,

                    source_system:
                        executeForm.source_system ||
                        null,

                    payload:
                        parseJson(
                            executeForm.payload,
                            "Payload"
                        )

                };


                const response =
                    await processService.execute(
                        payload
                    );


                showToast(
                    response.data.message ||
                    "Process event created successfully."
                );


                setExecuteForm({
                    ...emptyExecute
                });


                setShowExecute(
                    false
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Execution failed."
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
                    await processService.getRuntime();


                setRuntimeData(
                    response.data.data ||
                    []
                );


                setShowRuntime(
                    true
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to load Runtime."
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
                    await processService.getReport({

                        status:
                            statusFilter ===
                            "ALL"
                                ? ""
                                : statusFilter

                    });


                setReportData(
                    response.data.data ||
                    []
                );


                setShowReport(
                    true
                );

            }

            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to load Report."
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
    // CSV EXPORT
    // ======================================================

    const exportProcess =
        async () => {

            try {

                const response =
                    await processService.exportData({

                        format:
                            "CSV",

                        status:
                            statusFilter ===
                            "ALL"
                                ? ""
                                : statusFilter

                    });


                const rows =
                    response.data.data ||
                    [];


                if (
                    !rows.length
                ) {

                    showToast(
                        "No data available for export.",
                        "warning"
                    );

                    return;

                }


                const headers =
                    Object.keys(
                        rows[0]
                    );


                const escapeCsv =
                    value => {

                        if (
                            value === null ||
                            value === undefined
                        ) {

                            return "";

                        }


                        const text =
                            typeof value ===
                                "object"
                                ? JSON.stringify(
                                    value
                                )
                                : String(
                                    value
                                );


                        return `"${text.replace(
                            /"/g,
                            '""'
                        )}"`;

                    };


                const csv = [

                    headers.join(
                        ","
                    ),

                    ...rows.map(
                        row =>
                            headers
                                .map(
                                    header =>
                                        escapeCsv(
                                            row[
                                                header
                                            ]
                                        )
                                )
                                .join(
                                    ","
                                )
                    )

                ].join(
                    "\n"
                );


                const blob =
                    new Blob(
                        [
                            csv
                        ],
                        {
                            type:
                                "text/csv;charset=utf-8;"
                        }
                    );


                const url =
                    window.URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    url;

                link.download =
                    "Process_Master.csv";


                document.body.appendChild(
                    link
                );


                link.click();

                link.remove();


                window.URL.revokeObjectURL(
                    url
                );


                showToast(
                    "Process Master exported successfully."
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
    // MAIN COLUMNS
    // ======================================================

    const processColumns = [

        {
            key:
                "process_code",
            label:
                "Process Code"
        },

        {
            key:
                "process_name",
            label:
                "Process Name"
        },

        {
            key:
                "process_type",
            label:
                "Process Type"
        },

        {
            key:
                "company_name",
            label:
                "Company"
        },

        {
            key:
                "default_cycle_time_sec",
            label:
                "Cycle Time (Sec)"
        },

        {
            key:
                "current_revision_no",
            label:
                "Current Revision",
            render:
                row =>
                    row.current_revision_no ||
                    "-"
        },

        {
            key:
                "current_revision_status",
            label:
                "Revision Status",
            render:
                row =>
                    row.current_revision_status
                        ? (
                            <Badge bg="secondary">
                                {
                                    row.current_revision_status
                                }
                            </Badge>
                        )
                        : "-"
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
    // REVISION COLUMNS
    // ======================================================

    const revisionColumns = [

        {
            key:
                "process_code",
            label:
                "Process Code"
        },

        {
            key:
                "process_name",
            label:
                "Process"
        },

        {
            key:
                "revision_no",
            label:
                "Revision"
        },

        {
            key:
                "effective_from",
            label:
                "Effective From",
            render:
                row =>
                    row.effective_from
                        ? String(
                            row.effective_from
                        ).slice(
                            0,
                            10
                        )
                        : "-"
        },

        {
            key:
                "effective_to",
            label:
                "Effective To",
            render:
                row =>
                    row.effective_to
                        ? String(
                            row.effective_to
                        ).slice(
                            0,
                            10
                        )
                        : "-"
        },

        {
            key:
                "release_status",
            label:
                "Release Status",
            render:
                row => (
                    <StatusBadge
                        status={
                            row.release_status
                        }
                    />
                )
        },

        {
            key:
                "is_current",
            label:
                "Current",
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
        }

    ];


    // ======================================================
    // OPERATION COLUMNS
    // ======================================================

    const operationColumns = [

        {
            key:
                "process_code",
            label:
                "Process"
        },

        {
            key:
                "revision_no",
            label:
                "Revision"
        },

        {
            key:
                "operation_no",
            label:
                "Op No"
        },

        {
            key:
                "operation_code",
            label:
                "Operation Code"
        },

        {
            key:
                "operation_name",
            label:
                "Operation Name"
        },

        {
            key:
                "operation_type",
            label:
                "Type"
        },

        {
            key:
                "sequence_no",
            label:
                "Sequence"
        },

        {
            key:
                "ideal_cycle_time_sec",
            label:
                "Ideal Cycle"
        },

        {
            key:
                "required_skill_code",
            label:
                "Skill",
            render:
                row =>
                    row.required_skill_name
                        ? `${row.required_skill_code} - ${row.required_skill_name}`
                        : row.required_skill_code ||
                          "-"
        },

        {
            key:
                "is_mandatory",
            label:
                "Mandatory",
            render:
                row => (
                    <Badge
                        bg={
                            row.is_mandatory
                                ? "success"
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
    // RUNTIME COLUMNS
    // ======================================================

    const runtimeColumns = [

        {
            key:
                "process_code",
            label:
                "Process"
        },

        {
            key:
                "revision_no",
            label:
                "Revision"
        },

        {
            key:
                "operation_name",
            label:
                "Operation"
        },

        {
            key:
                "plant_name",
            label:
                "Plant"
        },

        {
            key:
                "line_name",
            label:
                "Line"
        },

        {
            key:
                "machine_name",
            label:
                "Machine"
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
                "source_system",
            label:
                "Source"
        },

        {
            key:
                "event_ts",
            label:
                "Event Time"
        }

    ];


    // ======================================================
    // REPORT COLUMNS
    // ======================================================

    const reportColumns = [

        {
            key:
                "process_code",
            label:
                "Code"
        },

        {
            key:
                "process_name",
            label:
                "Process"
        },

        {
            key:
                "process_type",
            label:
                "Type"
        },

        {
            key:
                "company_name",
            label:
                "Company"
        },

        {
            key:
                "default_cycle_time_sec",
            label:
                "Cycle Time"
        },

        {
            key:
                "current_revision_no",
            label:
                "Current Revision"
        },

        {
            key:
                "total_revisions",
            label:
                "Revisions"
        },

        {
            key:
                "total_operations",
            label:
                "Operations"
        },

        {
            key:
                "total_events",
            label:
                "Events"
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
    // JSX
    // ======================================================

    return (

        <>

<div className="container-fluid">

            {/* ==================================================
                TOAST
            ================================================== */}

            <Toast
                show={
                    toast.show
                }
                onClose={
                    () =>
                        setToast(
                            previous => ({
                                ...previous,
                                show:
                                    false
                            })
                        )
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
                    zIndex:
                        9999
                }}
            >
                <Toast.Body className="text-white">

                    {
                        toast.message
                    }

                </Toast.Body>
            </Toast>


            {/* ==================================================
                HEADER
            ================================================== */}

            <Card className="shadow-sm border-0 mb-4">

                <Card.Body>

                    <Row className="align-items-center g-3">

                        <Col>

                            <h3 className="mb-1">
                                Process Master
                            </h3>

                            <small className="text-muted">
                                Master Data / Process Master
                            </small>

                        </Col>


                        <Col xs="auto">

                            <div className="d-flex gap-2 flex-wrap">

                                <Button
                                    variant="outline-primary"
                                    onClick={
                                        async () => {

                                            await loadRevisions();

                                            setShowRevisionConfig(
                                                true
                                            );

                                        }
                                    }
                                >
                                    Revision Config
                                </Button>


                                <Button
                                    variant="outline-primary"
                                    onClick={
                                        async () => {

                                            await loadOperations();

                                            setShowOperationConfig(
                                                true
                                            );

                                        }
                                    }
                                >
                                    Operation Config
                                </Button>


                                <Button
                                    variant="primary"
                                    onClick={
                                        openAddProcess
                                    }
                                >
                                    <Plus />

                                    Add Process
                                </Button>

                            </div>

                        </Col>

                    </Row>

                </Card.Body>

            </Card>


            {/* ==================================================
                TOOLBAR
            ================================================== */}

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
                    () =>
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

                onExport={
                    exportProcess
                }

                placeholder="Search Process..."

            />


            {/* ==================================================
                PROCESS TABLE
            ================================================== */}

            <DataTable

                columns={
                    processColumns
                }

                data={
                    filteredProcesses
                }

                loading={
                    loading
                }

                emptyMessage="No Process Found"

                renderActions={
                    process => (

                        <ActionButtons

                            onEdit={
                                () =>
                                    openEditProcess(
                                        process
                                    )
                            }

                            onDelete={
                                () =>
                                    deleteProcess(
                                        process
                                    )
                            }

                        />

                    )
                }

            />


            {/* ==================================================
                PROCESS FORM
            ================================================== */}

            <Modal
                show={
                    showForm
                }
                onHide={
                    () =>
                        setShowForm(
                            false
                        )
                }
                centered
                backdrop="static"
                size="lg"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {
                            processEditId
                                ? "Update Process"
                                : "Create Process"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Company *
                                    </Form.Label>

                                    <Form.Select

                                        value={
                                            processForm.company_id
                                        }
                                        disabled={Boolean(processEditId)}

                                        onChange={
                                            event =>
                                                setProcessForm(
                                                    previous => ({
                                                        ...previous,
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


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Process Code *
                                    </Form.Label>

                                    <Form.Control

                                        value={
                                            processForm.process_code
                                        }

                                        onChange={
                                            event =>
                                                setProcessForm(
                                                    previous => ({
                                                        ...previous,
                                                        process_code:
                                                            event.target.value
                                                    })
                                                )
                                        }

                                        placeholder="PROC-001"

                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Process Name *
                                    </Form.Label>

                                    <Form.Control

                                        value={
                                            processForm.process_name
                                        }

                                        onChange={
                                            event =>
                                                setProcessForm(
                                                    previous => ({
                                                        ...previous,
                                                        process_name:
                                                            event.target.value
                                                    })
                                                )
                                        }

                                        placeholder="Cylinder Head Assembly"

                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Process Type *
                                    </Form.Label>

                                    <Form.Control

                                        value={
                                            processForm.process_type
                                        }

                                        onChange={
                                            event =>
                                                setProcessForm(
                                                    previous => ({
                                                        ...previous,
                                                        process_type:
                                                            event.target.value
                                                    })
                                                )
                                        }

                                        placeholder="ASSEMBLY / INSPECTION / MACHINING"

                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Default Cycle Time (Sec)
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="0.001"
                                        min="0"

                                        value={
                                            processForm.default_cycle_time_sec
                                        }

                                        onChange={
                                            event =>
                                                setProcessForm(
                                                    previous => ({
                                                        ...previous,
                                                        default_cycle_time_sec:
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
                                            processForm.status
                                        }

                                        onChange={
                                            event =>
                                                setProcessForm(
                                                    previous => ({
                                                        ...previous,
                                                        status:
                                                            event.target.value
                                                    })
                                                )
                                        }

                                    >

                                        {
                                            MASTER_STATUS.map(
                                                status => (

                                                    <option
                                                        key={
                                                            status
                                                        }
                                                        value={
                                                            status
                                                        }
                                                    >
                                                        {
                                                            status
                                                        }
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
                                Description
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={4}

                                value={
                                    processForm.description
                                }

                                onChange={
                                    event =>
                                        setProcessForm(
                                            previous => ({
                                                ...previous,
                                                description:
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
                        onClick={
                            () =>
                                setShowForm(
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
                            saveProcess
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
                                : processEditId
                                    ? "Update Process"
                                    : "Save Process"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* ==================================================
                REVISION CONFIG LIST
            ================================================== */}

            <Modal
                show={
                    showRevisionConfig
                }
                onHide={
                    () =>
                        setShowRevisionConfig(
                            false
                        )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Process Revision Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddRevision
                            }
                        >
                            <Plus />

                            Add Revision
                        </Button>

                    </div>


                    <DataTable

                        columns={
                            revisionColumns
                        }

                        data={
                            revisions
                        }

                        emptyMessage="No Process Revision Found"

                        renderActions={
                            revision => (

                                <ActionButtons

                                    onEdit={
                                        () =>
                                            openEditRevision(
                                                revision
                                            )
                                    }

                                    onDelete={
                                        () =>
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
                        onClick={
                            () =>
                                setShowRevisionConfig(
                                    false
                                )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* ==================================================
                REVISION FORM
            ================================================== */}

            <Modal
                show={
                    showRevisionForm
                }
                onHide={
                    () => {

                        setShowRevisionForm(
                            false
                        );

                        setShowRevisionConfig(
                            true
                        );

                    }
                }
                centered
                backdrop="static"
                size="lg"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {
                            revisionEditId
                                ? "Update Process Revision"
                                : "Add Process Revision"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Process *
                                    </Form.Label>

                                    <Form.Select

                                        value={
                                            revisionForm.process_id
                                        }

                                        onChange={
                                            event =>
                                                setRevisionForm(
                                                    previous => ({
                                                        ...previous,
                                                        process_id:
                                                            event.target.value
                                                    })
                                                )
                                        }

                                    >

                                        <option value="">
                                            Select Process
                                        </option>

                                        {
                                            processes.map(
                                                process => (

                                                    <option
                                                        key={
                                                            process.process_id
                                                        }
                                                        value={
                                                            process.process_id
                                                        }
                                                    >
                                                        {
                                                            process.process_code
                                                        }
                                                        {" - "}
                                                        {
                                                            process.process_name
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

                                        placeholder="R01"

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

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Release Status
                                    </Form.Label>

                                    <Form.Select

                                        value={
                                            revisionForm.release_status
                                        }

                                        onChange={
                                            event =>
                                                setRevisionForm(
                                                    previous => ({
                                                        ...previous,
                                                        release_status:
                                                            event.target.value
                                                    })
                                                )
                                        }

                                    >

                                        {
                                            REVISION_STATUS.map(
                                                status => (

                                                    <option
                                                        key={
                                                            status
                                                        }
                                                        value={
                                                            status
                                                        }
                                                    >
                                                        {
                                                            status
                                                        }
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

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Approved By User ID
                                    </Form.Label>

                                    <Form.Control
                                        type="number"

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


                            <Col md={6}>

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

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Process Config (JSON)
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={5}

                                value={
                                    revisionForm.process_config
                                }

                                onChange={
                                    event =>
                                        setRevisionForm(
                                            previous => ({
                                                ...previous,
                                                process_config:
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
                        onClick={
                            () => {

                                setShowRevisionForm(
                                    false
                                );

                                setShowRevisionConfig(
                                    true
                                );

                            }
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


            {/* ==================================================
                OPERATION CONFIG LIST
            ================================================== */}

            <Modal
                show={
                    showOperationConfig
                }
                onHide={
                    () =>
                        setShowOperationConfig(
                            false
                        )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Operation Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddOperation
                            }
                        >
                            <Plus />

                            Add Operation
                        </Button>

                    </div>


                    <DataTable
                        columns={
                            operationColumns
                        }
                        data={
                            operations
                        }
                        emptyMessage="No Operation Found"

                        renderActions={
                            operation => (

                                <ActionButtons

                                    onEdit={
                                        () =>
                                            openEditOperation(
                                                operation
                                            )
                                    }

                                    onDelete={
                                        () =>
                                            deleteOperation(
                                                operation
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
                        onClick={
                            () =>
                                setShowOperationConfig(
                                    false
                                )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* ==================================================
                OPERATION FORM
            ================================================== */}

            <Modal
                show={
                    showOperationForm
                }
                onHide={
                    () => {

                        setShowOperationForm(
                            false
                        );

                        setShowOperationConfig(
                            true
                        );

                    }
                }
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {
                            operationEditId
                                ? "Update Operation"
                                : "Add Operation"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Process Revision *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            operationForm.process_revision_id
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        process_revision_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Process Revision
                                        </option>

                                        {
                                            revisions.map(
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
                                                        {" / "}
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


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Operation No *
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            operationForm.operation_no
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        operation_no:
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
                                        Sequence No *
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            operationForm.sequence_no
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        sequence_no:
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
                                        Operation Code *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            operationForm.operation_code
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        operation_code:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                        placeholder="OP-10"
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Operation Name *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            operationForm.operation_name
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        operation_name:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                        placeholder="Bolt Tightening"
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Operation Type *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            operationForm.operation_type
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        operation_type:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                        placeholder="ASSEMBLY / TORQUE / INSPECTION"
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Ideal Cycle Time (Sec)
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        value={
                                            operationForm.ideal_cycle_time_sec
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        ideal_cycle_time_sec:
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
                                        + Tolerance (Sec)
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        value={
                                            operationForm.tolerance_plus_sec
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        tolerance_plus_sec:
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
                                        - Tolerance (Sec)
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        value={
                                            operationForm.tolerance_minus_sec
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        tolerance_minus_sec:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={5}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Required Skill Code
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            operationForm.required_skill_code
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        required_skill_code:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                        placeholder="TORQUE_OPERATOR"
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
                                            operationForm.status
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        status:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        {
                                            MASTER_STATUS.map(
                                                status => (
                                                    <option
                                                        key={
                                                            status
                                                        }
                                                        value={
                                                            status
                                                        }
                                                    >
                                                        {
                                                            status
                                                        }
                                                    </option>
                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3 mt-4">

                                    <Form.Check
                                        type="checkbox"
                                        label="Mandatory Operation"
                                        checked={
                                            operationForm.is_mandatory
                                        }
                                        onChange={
                                            event =>
                                                setOperationForm(
                                                    previous => ({
                                                        ...previous,
                                                        is_mandatory:
                                                            event.target.checked
                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Operation Config (JSON)
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={5}
                                value={
                                    operationForm.operation_config
                                }
                                onChange={
                                    event =>
                                        setOperationForm(
                                            previous => ({
                                                ...previous,
                                                operation_config:
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
                        onClick={
                            () => {

                                setShowOperationForm(
                                    false
                                );

                                setShowOperationConfig(
                                    true
                                );

                            }
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
                            saveOperation
                        }
                    >
                        {
                            saving
                                ? "Saving..."
                                : operationEditId
                                    ? "Update Operation"
                                    : "Save Operation"
                        }
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* ==================================================
                EXECUTE
            ================================================== */}

            <Modal
                show={
                    showExecute
                }
                onHide={
                    () =>
                        setShowExecute(
                            false
                        )
                }
                centered
                size="xl"
                backdrop="static"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Execute Process Event
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Process *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.process_id
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        process_id:
                                                            event.target.value,

                                                        process_revision_id:
                                                            "",

                                                        operation_id:
                                                            ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Process
                                        </option>

                                        {
                                            processes.map(
                                                process => (
                                                    <option
                                                        key={
                                                            process.process_id
                                                        }
                                                        value={
                                                            process.process_id
                                                        }
                                                    >
                                                        {
                                                            process.process_code
                                                        }
                                                        {" - "}
                                                        {
                                                            process.process_name
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
                                        Revision
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.process_revision_id
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        process_revision_id:
                                                            event.target.value,

                                                        operation_id:
                                                            ""
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Current / Auto
                                        </option>

                                        {
                                            executeRevisions.map(
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
                                                            revision.revision_no
                                                        }
                                                        {
                                                            revision.is_current
                                                                ? " (Current)"
                                                                : ""
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
                                        Operation
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.operation_id
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,
                                                        operation_id:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            No Specific Operation
                                        </option>

                                        {
                                            executeOperations.map(
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
                                                            operation.operation_no
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

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Plant
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.plant_id
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id:
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
                                            plants.map(
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
                                            executeForm.line_id
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
                                            Select Machine
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

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Event Type *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.event_type
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,
                                                        event_type:
                                                            event.target.value
                                                    })
                                                )
                                        }
                                        placeholder="START / COMPLETE / INSPECTED"
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
                                            executeForm.status
                                        }
                                        onChange={
                                            event =>
                                                setExecuteForm(
                                                    previous => ({
                                                        ...previous,
                                                        status:
                                                            event.target.value
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
                                                        {
                                                            status
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

                            <Col md={4}>

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
                                        placeholder="PLC / MES / MANUAL"
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

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


                            <Col md={4}>

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
                                Payload (JSON)
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={5}
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
                        onClick={
                            () =>
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
                            executeProcess
                        }
                    >
                        {
                            saving
                                ? "Executing..."
                                : "Execute"
                        }
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* ==================================================
                RUNTIME
            ================================================== */}

            <Modal
                show={
                    showRuntime
                }
                onHide={
                    () =>
                        setShowRuntime(
                            false
                        )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Process Runtime
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
                        emptyMessage="No Process Runtime Data Found"
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={
                            () =>
                                setShowRuntime(
                                    false
                                )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* ==================================================
                REPORT
            ================================================== */}

            <Modal
                show={
                    showReport
                }
                onHide={
                    () =>
                        setShowReport(
                            false
                        )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Process Master Report
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
                        emptyMessage="No Process Report Data Found"
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={
                            () =>
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


export default ProcessMaster;