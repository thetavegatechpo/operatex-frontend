import React from 'react';

import {

    useEffect,
    useState

} from "react";

import {

    Button

} from "react-bootstrap";

import machineService from "../api/machine.service.js";

import PageHeader from "../../../../shared/components/PageHeader.jsx";
import SearchToolbar from "../../../../shared/components/SearchToolbar.jsx";
import DataTable from "../../../../shared/components/DataTable.jsx";
import ActionButtons from "../../../../shared/components/ActionButtons.jsx";
import StatusBadge from "../../../../shared/components/StatusBadge.jsx";
import ToastMessage from "../../../../shared/components/ToastMessage.jsx";
import FormGrid from "../../../../shared/components/FormGrid.jsx";
import FormField from "../../../../shared/components/FormField.jsx";
import MasterFormModal from "../../../../shared/components/MasterFormModal.jsx";
import ConfigTable from "../../../../shared/components/ConfigTable.jsx";
import ConfigModal from "../../../../shared/components/ConfigModal.jsx";
import RuntimeModal from "../../../../shared/components/RuntimeModal.jsx";
import ExecuteModal from "../../../../shared/components/ExecuteModal.jsx";
import ReportModal from "../../../../shared/components/ReportModal.jsx";
import ExportModal from "../../../../shared/components/ExportModal.jsx";
import ConfirmDeleteModal from "../../../../shared/components/ConfirmDeleteModal.jsx";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import plantShopService from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";
import lineService from "../../../enterprise-setup/line-master/api/line.service.js";
import stationService from "../../station-master/api/stationService.js";
import "./MachineMaster.css";

function MachineMaster() {

    // =====================================================
    // Master Data
    // =====================================================

    const [machines, setMachines] = useState([]);

    const [capabilityConfig, setCapabilityConfig] = useState([]);

    const [groupConfig, setGroupConfig] = useState([]);

    const [runtime, setRuntime] = useState([]);

    const [report, setReport] = useState([]);

    // =====================================================
    // Search
    // =====================================================

    const [searchText, setSearchText] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");

    // =====================================================
    // Loading
    // =====================================================

    const [loading, setLoading] = useState(false);

    const [saving, setSaving] = useState(false);

    const [deleting, setDeleting] = useState(false);
const [showCapabilityForm, setShowCapabilityForm] = useState(false);

const [showGroupForm, setShowGroupForm] = useState(false);
    // =====================================================
    // Edit
    // =====================================================

    const [editId, setEditId] = useState(null);

    const [deleteId, setDeleteId] = useState(null);

    const [companies, setCompanies] = useState([]);

const [plants, setPlants] = useState([]);

const [shops, setShops] = useState([]);

const [lines, setLines] = useState([]);

const [stations, setStations] = useState([]);

    // =====================================================
    // Toast
    // =====================================================

    const [toast, setToast] = useState({

        show: false,

        message: "",

        variant: "success"

    });

    const showToast = (

        message,

        variant = "success"

    ) => {

        setToast({

            show: true,

            message,

            variant

        });

    };

    // =====================================================
    // Validation
    // =====================================================

    const [errors, setErrors] = useState({});

    // =====================================================
    // Modals
    // =====================================================

    const [showForm, setShowForm] = useState(false);

    const [showCapability, setShowCapability] = useState(false);

    const [showGroup, setShowGroup] = useState(false);

    const [showRuntime, setShowRuntime] = useState(false);

    const [showExecute, setShowExecute] = useState(false);

    const [showReport, setShowReport] = useState(false);

    const [showExport, setShowExport] = useState(false);

    const [showDelete, setShowDelete] = useState(false);

    // =====================================================
    // Machine Form
    // =====================================================

   const machineInitialState = {

    company_id: "",

    plant_id: "",

    shop_id: "",

    line_id: "",

    station_id: "",

    machine_code: "",

    machine_name: "",

    machine_type: "",

    make: "",

    model: "",

    serial_number: "",

    bottleneck_flag: false,

    target_cycle_time_sec: "",

    capacity_per_hour: "",

    status: "ACTIVE"

};

    const [machineForm, setMachineForm] = useState(

        machineInitialState

    );

    // =====================================================
    // Capability Form
    // =====================================================

   const capabilityInitialState = {

    type: "CAPABILITY",

    company_id: "",

    machine_id: "",

    capability_code: "",

    capability_name: "",

    capability_type: "",

    unit: "",

    min_value: "",

    max_value: "",

    nominal_value: "",

    capability_config: {},

    effective_from: "",

    effective_to: "",

    is_active: true

};

    const [

        capabilityForm,

        setCapabilityForm

    ] = useState(

        capabilityInitialState

    );

    // =====================================================
    // Group Form
    // =====================================================

  const groupInitialState = {

    type: "GROUP",

    company_id: "",

    plant_id: "",

    line_id: "",

    group_code: "",

    group_name: "",

    group_type: "",

    member_machine_ids: [],

    selection_rule: {},

    status: "ACTIVE"

};

    const [

        groupForm,

        setGroupForm

    ] = useState(

        groupInitialState

    );

    // =====================================================
    // Execute Form
    // =====================================================

   const executeInitialState = {

    company_id: "",

    plant_id: "",

    line_id: "",

    machine_id: "",

    status_code: "",

    previous_status_code: "",

    reason_code: "",

    source_signal_mapping_id: "",

    duration_sec: "",

    event_ts: "",

    correlation_id: "",

    idempotency_key: "",

    source_system: "",

    payload: {}

};

    const [

        executeForm,

        setExecuteForm

    ] = useState(

        executeInitialState

    );

    // =====================================================
    // Export Form
    // =====================================================

    const exportInitialState = {

        format: "CSV",

        status: "",

        line_id: ""

    };

    const [

        exportForm,

        setExportForm

    ] = useState(

        exportInitialState

    );

    // =====================================================
    // Initial Load
    // =====================================================

    useEffect(() => {

       
    loadInitialData();

    }, []);


    const loadInitialData = async () => {

    try {

        await Promise.all([

            loadMaster(),

            loadCompanies(),

            loadPlantShop(),

            loadLines(),

            loadStations()

        ]);

    }

    catch (error) {

        console.log(error);

    }

};
const loadCompanies = async () => {

    const response =
        await companyService.getMaster();

    setCompanies(

        response.data.data || []

    );

};
const loadPlantShop = async () => {

    const response =
        await plantShopService.getMaster();

    const data =
        response.data.data || [];

    // The Plant / Shop master response contains IDs and names.
    // Keep one unique record for every plant and all valid shop rows.
    const uniquePlants = [
        ...new Map(
            data
                .filter(item => item.plant_id)
                .map(item => [item.plant_id, item])
        ).values()
    ];

    const shopList = data.filter(
        item => item.shop_id
    );

    setPlants(uniquePlants);
    setShops(shopList);

};
const loadLines = async () => {

    const response =
        await lineService.getMaster();

    setLines(

        response.data.data || []

    );

};
const loadStations = async () => {

    const response =
        await stationService.getMaster();

    setStations(

        response.data.data || []

    );

};
        // =====================================================
    // Master Table Columns
    // =====================================================
const machineColumns = [

    {
        key: "machine_code",
        label: "Code"
    },

    {
        key: "machine_name",
        label: "Machine"
    },

    {
        key: "machine_type",
        label: "Type"
    },

    {
        key: "make",
        label: "Make"
    },

    {
        key: "model",
        label: "Model"
    },

    {
        key: "line_name",
        label: "Line"
    },

    {
        key: "capacity_per_hour",
        label: "Capacity/Hr"
    },

    {
        key: "target_cycle_time_sec",
        label: "Cycle(sec)"
    },

    {
        key: "status",
        label: "Status",

        render: row => (

            <StatusBadge status={row.status}/>

        )

    }

];

    // =====================================================
    // Dropdown Helpers / Foreign Key Mapping
    // =====================================================

const sameId = (left, right) =>
    String(left ?? "") === String(right ?? "");

const idNameLabel = (id, name) =>
    name || "-";

// -------------------------
// Machine form dependencies
// Company -> Plant -> Shop -> Line -> Station
// -------------------------
const machinePlantOptions = plants.filter(plant =>
    !machineForm.company_id ||
    !plant.company_id ||
    sameId(plant.company_id, machineForm.company_id)
);

const machineShopOptions = shops.filter(shop =>
    (!machineForm.company_id ||
        !shop.company_id ||
        sameId(shop.company_id, machineForm.company_id)) &&
    (!machineForm.plant_id ||
        sameId(shop.plant_id, machineForm.plant_id))
);

const machineLineOptions = lines.filter(line =>
    (!machineForm.company_id ||
        !line.company_id ||
        sameId(line.company_id, machineForm.company_id)) &&
    (!machineForm.plant_id ||
        !line.plant_id ||
        sameId(line.plant_id, machineForm.plant_id)) &&
    (!machineForm.shop_id ||
        !line.shop_id ||
        sameId(line.shop_id, machineForm.shop_id))
);

const machineStationOptions = stations.filter(station =>
    !machineForm.line_id ||
    !station.line_id ||
    sameId(station.line_id, machineForm.line_id)
);

// -------------------------
// Capability dependencies
// Company -> Machine
// -------------------------
const capabilityMachineOptions = machines.filter(machine =>
    !capabilityForm.company_id ||
    sameId(machine.company_id, capabilityForm.company_id)
);

// -------------------------
// Group dependencies
// Company -> Plant -> Line -> Member Machines
// -------------------------
const groupPlantOptions = plants.filter(plant =>
    !groupForm.company_id ||
    !plant.company_id ||
    sameId(plant.company_id, groupForm.company_id)
);

const groupLineOptions = lines.filter(line =>
    (!groupForm.company_id ||
        !line.company_id ||
        sameId(line.company_id, groupForm.company_id)) &&
    (!groupForm.plant_id ||
        !line.plant_id ||
        sameId(line.plant_id, groupForm.plant_id))
);

const groupMachineOptions = machines.filter(machine =>
    (!groupForm.company_id ||
        sameId(machine.company_id, groupForm.company_id)) &&
    (!groupForm.plant_id ||
        sameId(machine.plant_id, groupForm.plant_id)) &&
    (!groupForm.line_id ||
        sameId(machine.line_id, groupForm.line_id))
);

// -------------------------
// Execute dependencies
// Company -> Plant -> Line -> Machine
// -------------------------
const executePlantOptions = plants.filter(plant =>
    !executeForm.company_id ||
    !plant.company_id ||
    sameId(plant.company_id, executeForm.company_id)
);

const executeLineOptions = lines.filter(line =>
    (!executeForm.company_id ||
        !line.company_id ||
        sameId(line.company_id, executeForm.company_id)) &&
    (!executeForm.plant_id ||
        !line.plant_id ||
        sameId(line.plant_id, executeForm.plant_id))
);

const executeMachineOptions = machines.filter(machine =>
    (!executeForm.company_id ||
        sameId(machine.company_id, executeForm.company_id)) &&
    (!executeForm.plant_id ||
        sameId(machine.plant_id, executeForm.plant_id)) &&
    (!executeForm.line_id ||
        sameId(machine.line_id, executeForm.line_id))
);

    // =====================================================
    // Machine Form Fields
    // =====================================================

const machineFields = [

    {
        label: "Company",
        name: "company_id",
        type: "select",
        required: true,

        // Foreign key cannot change during Edit
        disabled: Boolean(editId),

        options: companies.map(company => ({
            label: idNameLabel(
                company.company_id,
                company.company_name
            ),
            value: company.company_id
        })),

        onChange: (event) => {

            const company_id = event.target.value;

            setMachineForm(prev => ({
                ...prev,
                company_id,
                plant_id: "",
                shop_id: "",
                line_id: "",
                station_id: ""
            }));
        }
    },

    {
        label: "Plant",
        name: "plant_id",
        type: "select",
        required: true,

        disabled:
            Boolean(editId) ||
            !machineForm.company_id,

        options: machinePlantOptions.map(plant => ({
            label: idNameLabel(
                plant.plant_id,
                plant.plant_name
            ),
            value: plant.plant_id
        })),

        onChange: (event) => {

            const plant_id = event.target.value;

            setMachineForm(prev => ({
                ...prev,
                plant_id,
                shop_id: "",
                line_id: "",
                station_id: ""
            }));
        }
    },

    {
        label: "Shop",
        name: "shop_id",
        type: "select",
        required: true,

        disabled:
            Boolean(editId) ||
            !machineForm.plant_id,

        options: machineShopOptions.map(shop => ({
            label: idNameLabel(
                shop.shop_id,
                shop.shop_name
            ),
            value: shop.shop_id
        })),

        onChange: (event) => {

            const shop_id = event.target.value;

            setMachineForm(prev => ({
                ...prev,
                shop_id,
                line_id: "",
                station_id: ""
            }));
        }
    },

    {
        label: "Line",
        name: "line_id",
        type: "select",
        required: true,

        disabled:
            Boolean(editId) ||
            !machineForm.plant_id,

        options: machineLineOptions.map(line => ({
            label: idNameLabel(
                line.line_id,
                line.line_name
            ),
            value: line.line_id
        })),

        onChange: (event) => {

            const line_id = event.target.value;

            setMachineForm(prev => ({
                ...prev,
                line_id,
                station_id: ""
            }));
        }
    },

    {
        label: "Station",
        name: "station_id",
        type: "select",

        disabled:
            Boolean(editId) ||
            !machineForm.line_id,

        options: machineStationOptions.map(station => ({
            label: idNameLabel(
                station.station_id,
                station.station_name
            ),
            value: station.station_id
        }))
    },

    // normal editable fields continue here...


    {
        label: "Machine Code",
        name: "machine_code",
        type: "text",
        required: true
    },

    {
        label: "Machine Name",
        name: "machine_name",
        type: "text",
        required: true
    },

    {
        label: "Machine Type",
        name: "machine_type",
        type: "text",
        required: true
    },

    {
        label: "Make",
        name: "make",
        type: "text"
    },

    {
        label: "Model",
        name: "model",
        type: "text"
    },

    {
        label: "Serial Number",
        name: "serial_number",
        type: "text"
    },

    {
        label: "Bottle Neck",
        name: "bottleneck_flag",
        type: "checkbox"
    },

    {
        label: "Target Cycle Time (Sec)",
        name: "target_cycle_time_sec",
        type: "number"
    },

    {
        label: "Capacity / Hour",
        name: "capacity_per_hour",
        type: "number"
    },

    {
        label: "Status",
        name: "status",
        type: "select",
        options: [
            { label: "DRAFT", value: "DRAFT" },
            { label: "ACTIVE", value: "ACTIVE" },
            { label: "INACTIVE", value: "INACTIVE" },
            { label: "RETIRED", value: "RETIRED" }
        ]
    }

];

    // =====================================================
    // Capability Config Fields
    // =====================================================

const capabilityFields = [

    {
        label: "Company",
        name: "company_id",
        type: "select",
        required: true,
        options: companies.map(company => ({
            label: idNameLabel(
                company.company_id,
                company.company_name
            ),
            value: company.company_id
        })),
        onChange: (event) => {
            const company_id = event.target.value;

            setCapabilityForm(prev => ({
                ...prev,
                company_id,
                machine_id: ""
            }));
        }
    },

    {
        label: "Machine",
        name: "machine_id",
        type: "select",
        required: true,
        disabled: !capabilityForm.company_id,
        options: capabilityMachineOptions.map(machine => ({
            label: idNameLabel(
                machine.machine_id,
                machine.machine_name
            ),
            value: machine.machine_id
        }))
    },

    {
        label: "Capability Code",
        name: "capability_code",
        type: "text"
    },

    {
        label: "Capability Name",
        name: "capability_name",
        type: "text"
    },

    {
        label: "Capability Type",
        name: "capability_type",
        type: "text"
    },

    {
        label: "Unit",
        name: "unit",
        type: "text"
    },

    {
        label: "Minimum",
        name: "min_value",
        type: "number"
    },

    {
        label: "Maximum",
        name: "max_value",
        type: "number"
    },

    {
        label: "Nominal",
        name: "nominal_value",
        type: "number"
    },

    {
        label: "Effective From",
        name: "effective_from",
        type: "date"
    },

    {
        label: "Effective To",
        name: "effective_to",
        type: "date"
    },

    {
        label: "Active",
        name: "is_active",
        type: "checkbox"
    }

];

    // =====================================================
    // Group Config Fields
    // =====================================================

const groupFields = [

    {
        label: "Company",
        name: "company_id",
        type: "select",
        required: true,
        options: companies.map(company => ({
            label: idNameLabel(
                company.company_id,
                company.company_name
            ),
            value: company.company_id
        })),
        onChange: (event) => {
            const company_id = event.target.value;

            setGroupForm(prev => ({
                ...prev,
                company_id,
                plant_id: "",
                line_id: "",
                member_machine_ids: []
            }));
        }
    },

    {
        label: "Plant",
        name: "plant_id",
        type: "select",
        required: true,
        disabled: !groupForm.company_id,
        options: groupPlantOptions.map(plant => ({
            label: idNameLabel(
                plant.plant_id,
                plant.plant_name
            ),
            value: plant.plant_id
        })),
        onChange: (event) => {
            const plant_id = event.target.value;

            setGroupForm(prev => ({
                ...prev,
                plant_id,
                line_id: "",
                member_machine_ids: []
            }));
        }
    },

    {
        label: "Line",
        name: "line_id",
        type: "select",
        disabled: !groupForm.plant_id,
        options: groupLineOptions.map(line => ({
            label: idNameLabel(
                line.line_id,
                line.line_name
            ),
            value: line.line_id
        })),
        onChange: (event) => {
            const line_id = event.target.value;

            setGroupForm(prev => ({
                ...prev,
                line_id,
                member_machine_ids: []
            }));
        }
    },

    {
        label: "Group Code",
        name: "group_code",
        type: "text"
    },

    {
        label: "Group Name",
        name: "group_name",
        type: "text"
    },

    {
        label: "Group Type",
        name: "group_type",
        type: "select",
        options: [
            { label: "CELL", value: "CELL" },
            { label: "POOL", value: "POOL" },
            { label: "PARALLEL", value: "PARALLEL" },
            { label: "REPORTING", value: "REPORTING" }
        ]
    },

    {
        label: "Member Machines",
        name: "member_machine_ids",
        type: "multiselect",
        disabled: !groupForm.line_id,
        options: groupMachineOptions.map(machine => ({
            label: idNameLabel(
                machine.machine_id,
                machine.machine_name
            ),
            value: machine.machine_id
        }))
    },

    {
        label: "Selection Rule (JSON)",
        name: "selection_rule",
        type: "textarea"
    },

    {
        label: "Status",
        name: "status",
        type: "select",
        options: [
            { label: "DRAFT", value: "DRAFT" },
            { label: "ACTIVE", value: "ACTIVE" },
            { label: "INACTIVE", value: "INACTIVE" },
            { label: "RETIRED", value: "RETIRED" }
        ]
    }

];

    // =====================================================
    // Runtime Columns
    // =====================================================

    const runtimeColumns = [

    {
        key: "machine_name",
        label: "Machine"
    },

    {
        key: "status_code",
        label: "Status"
    },

    {
        key: "previous_status_code",
        label: "Previous"
    },

    {
        key: "reason_code",
        label: "Reason"
    },

    {
        key: "duration_sec",
        label: "Duration (Sec)"
    },

    {
        key: "event_ts",
        label: "Event Time"
    }

];

    // =====================================================
    // Execute Fields
    // =====================================================

const executeFields = [

    {
        label: "Company",
        name: "company_id",
        type: "select",
        required: true,
        options: companies.map(company => ({
            label: idNameLabel(
                company.company_id,
                company.company_name
            ),
            value: company.company_id
        })),
        onChange: (event) => {
            const company_id = event.target.value;

            setExecuteForm(prev => ({
                ...prev,
                company_id,
                plant_id: "",
                line_id: "",
                machine_id: ""
            }));
        }
    },

    {
        label: "Plant",
        name: "plant_id",
        type: "select",
        required: true,
        disabled: !executeForm.company_id,
        options: executePlantOptions.map(plant => ({
            label: idNameLabel(
                plant.plant_id,
                plant.plant_name
            ),
            value: plant.plant_id
        })),
        onChange: (event) => {
            const plant_id = event.target.value;

            setExecuteForm(prev => ({
                ...prev,
                plant_id,
                line_id: "",
                machine_id: ""
            }));
        }
    },

    {
        label: "Line",
        name: "line_id",
        type: "select",
        required: true,
        disabled: !executeForm.plant_id,
        options: executeLineOptions.map(line => ({
            label: idNameLabel(
                line.line_id,
                line.line_name
            ),
            value: line.line_id
        })),
        onChange: (event) => {
            const line_id = event.target.value;

            setExecuteForm(prev => ({
                ...prev,
                line_id,
                machine_id: ""
            }));
        }
    },

    {
        label: "Machine",
        name: "machine_id",
        type: "select",
        required: true,
        disabled: !executeForm.line_id,
        options: executeMachineOptions.map(machine => ({
            label: idNameLabel(
                machine.machine_id,
                machine.machine_name
            ),
            value: machine.machine_id
        }))
    },

    {
        label: "Status",
        name: "status_code",
        type: "text"
    },

    {
        label: "Previous Status",
        name: "previous_status_code",
        type: "text"
    },

    {
        label: "Reason Code",
        name: "reason_code",
        type: "text"
    },

    {
        label: "Duration (Sec)",
        name: "duration_sec",
        type: "number"
    },

    {
        label: "Source System",
        name: "source_system",
        type: "text"
    }

];

    // =====================================================
    // Report Columns
    // =====================================================

    const reportColumns = [

    {
        key: "machine_code",
        label: "Code"
    },

    {
        key: "machine_name",
        label: "Machine"
    },

    {
        key: "machine_type",
        label: "Type"
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
        key: "capability_count",
        label: "Capabilities"
    },

    {
        key: "group_count",
        label: "Groups"
    },

    {
        key: "last_event",
        label: "Last Event"
    },

    {
        key: "status",
        label: "Status",

        render: row => (

            <StatusBadge status={row.status}/>

        )

    }

];

    // =====================================================
    // Export Filters
    // =====================================================
const exportFilters = [

    {
        label: "Status",
        name: "status",

        type: "select",

        options: [

            {
                label: "All",
                value: ""
            },

            {
                label: "DRAFT",
                value: "DRAFT"
            },

            {
                label: "ACTIVE",
                value: "ACTIVE"
            },

            {
                label: "INACTIVE",
                value: "INACTIVE"
            },

            {
                label: "RETIRED",
                value: "RETIRED"
            }

        ]

    },

    {
        label: "Line",
        name: "line_id",
        type: "select",
        options: lines.map(line => ({
            label: idNameLabel(
                line.line_id,
                line.line_name
            ),
            value: line.line_id
        }))
    }

];
        // =====================================================
    // Reset Machine Form
    // =====================================================

    const resetMachineForm = () => {

        setEditId(null);

        setErrors({});

        setMachineForm(machineInitialState);

    };

    // =====================================================
    // Frontend Validation
    // =====================================================

   const validateMachine = () => {

    const validation = {};

    if (!machineForm.machine_code?.trim())
        validation.machine_code = "Machine Code is required";

    if (!machineForm.machine_name?.trim())
        validation.machine_name = "Machine Name is required";

    if (!machineForm.machine_type?.trim())
        validation.machine_type = "Machine Type is required";

    if (!machineForm.company_id)
        validation.company_id = "Company is required";

    if (!machineForm.plant_id)
        validation.plant_id = "Plant is required";

    if (!machineForm.line_id)
        validation.line_id = "Line is required";

    if (
        machineForm.target_cycle_time_sec !== "" &&
        Number(machineForm.target_cycle_time_sec) <= 0
    ) {

        validation.target_cycle_time_sec =
            "Invalid Cycle Time";

    }

    if (
        machineForm.capacity_per_hour !== "" &&
        Number(machineForm.capacity_per_hour) < 0
    ) {

        validation.capacity_per_hour =
            "Invalid Capacity";

    }

    setErrors(validation);

    return Object.keys(validation).length === 0;

};

    // =====================================================
    // Load Master
    // =====================================================

    const loadMaster = async () => {

        try {

            setLoading(true);

            const response =

                await machineService.getMaster();

console.log(response.data);

            setMachines(

                response.data.data || []

            );

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load machines.",

                "danger"

            );

        }

        finally {

            setLoading(false);

        }

    };

    // =====================================================
    // Save Machine
    // =====================================================

    const saveMachine = async () => {

        if (!validateMachine()) {

            return;

        }

        try {

            setSaving(true);

            let response;

            if (editId) {

                response =

                    await machineService.updateMaster(

                        editId,

                        machineForm

                    );

            }

            else {

                response =

                    await machineService.createMaster(

                        machineForm

                    );

            }

            showToast(

                response.data.message ||

                "Machine Saved Successfully"

            );

            loadMaster();

            resetMachineForm();

            setShowForm(false);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Save Failed",

                "danger"

            );

        }

        finally {

            setSaving(false);

        }

    };

    // =====================================================
    // Edit Machine
    // =====================================================

    const editMachine = (row) => {

        setEditId(

            row.machine_id

        );

        setErrors({});
setMachineForm({

    company_id: row.company_id,

    plant_id: row.plant_id,

    shop_id: row.shop_id,

    line_id: row.line_id,

    station_id: row.station_id,

    machine_code: row.machine_code,

    machine_name: row.machine_name,

    machine_type: row.machine_type,

    make: row.make,

    model: row.model,

    serial_number: row.serial_number,

    bottleneck_flag: row.bottleneck_flag,

    target_cycle_time_sec: row.target_cycle_time_sec,

    capacity_per_hour: row.capacity_per_hour,

    status: row.status

});

        setShowForm(true);

    };

    // =====================================================
    // Open Delete
    // =====================================================

    const openDelete = (row) => {

        setDeleteId(

            row.machine_id

        );

        setShowDelete(true);

    };

    // =====================================================
    // Delete Machine
    // =====================================================

    const deleteMachine = async () => {

        try {

            setDeleting(true);

            const response =

                await machineService.deleteMaster(

                    deleteId

                );

            showToast(

                response.data.message ||

                "Machine Deleted"

            );

            loadMaster();

            setShowDelete(false);

            setDeleteId(null);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Delete Failed",

                "danger"

            );

        }

        finally {

            setDeleting(false);

        }

    };

    // =====================================================
    // Filtered Data
    // =====================================================

   const filteredData = machines.filter(item => {

    const search =
        searchText.toLowerCase();

    const matchSearch =

        item.machine_name
            ?.toLowerCase()
            .includes(search)

        ||

        item.machine_code
            ?.toLowerCase()
            .includes(search)

        ||

        item.machine_type
            ?.toLowerCase()
            .includes(search)

        ||

        item.line_name
            ?.toLowerCase()
            .includes(search);

    const matchStatus =

        statusFilter === "ALL"

        ||

        item.status === statusFilter;

    return (

        matchSearch &&

        matchStatus

    );

});
            // =====================================================
    // Capability Configuration
    // =====================================================

    const loadCapabilityConfig = async () => {

    const response =
        await machineService.getCapabilityConfig();

    setCapabilityConfig(response.data.data);

    setShowCapability(true);

};

    // =====================================================
    // Group Configuration
    // =====================================================
const loadGroupConfig = async () => {

    try {

        setLoading(true);

        const response =
            await machineService.getGroupConfig();

        console.log("GROUP API", response.data);

        setGroupConfig(response.data.data || []);

        setShowGroup(true);

    }

    catch(error){

        console.log(error);

        showToast(

            "Unable to load group configuration",

            "danger"

        );

    }

    finally{

        setLoading(false);

    }

};

    // =====================================================
    // Save Capability
    // =====================================================

    const saveCapability = async () => {

    try {

        setSaving(true);

        const payload = {

            ...capabilityForm,

            min_value:
                capabilityForm.min_value === ""
                    ? null
                    : Number(capabilityForm.min_value),

            max_value:
                capabilityForm.max_value === ""
                    ? null
                    : Number(capabilityForm.max_value),

            nominal_value:
                capabilityForm.nominal_value === ""
                    ? null
                    : Number(capabilityForm.nominal_value),

            capability_config:
                capabilityForm.capability_config || {},

            effective_from:
                capabilityForm.effective_from || null,

            effective_to:
                capabilityForm.effective_to || null,

            is_active:
                capabilityForm.is_active

        };

        const response =
            await machineService.createConfig(
                payload
            );

        showToast(
            response.data.message ||
            "Capability saved successfully."
        );

        loadCapabilityConfig();

        setCapabilityForm(
            capabilityInitialState
        );

        setShowCapabilityForm(false);

    }

    catch (error) {

        showToast(

            error.response?.data?.message ||

            "Unable to save capability.",

            "danger"

        );

    }

    finally {

        setSaving(false);

    }

};

    // =====================================================
    // Save Group
    // =====================================================

 const saveGroup = async () => {

    try {

        setSaving(true);

        const payload = {

            ...groupForm,

            member_machine_ids:
                Array.isArray(groupForm.member_machine_ids)
                    ? groupForm.member_machine_ids
                    : [],

            selection_rule:
                groupForm.selection_rule || {}

        };

        const response =
            await machineService.createConfig(
                payload
            );

        showToast(

            response.data.message ||

            "Group saved successfully."

        );

        loadGroupConfig();

        setGroupForm(
            groupInitialState
        );

        setShowGroupForm(false);

    }

    catch (error) {

        showToast(

            error.response?.data?.message ||

            "Unable to save group.",

            "danger"

        );

    }

    finally {

        setSaving(false);

    }

};

    // =====================================================
    // Delete Capability
    // =====================================================
const deleteCapability = async (

    machineCapabilityId

) => {

    try {

        await machineService.deleteCapability(

            machineCapabilityId

        );

        showToast(

            "Capability deleted successfully."

        );

        loadCapabilityConfig();

    }

    catch (error) {

        showToast(

            error.response?.data?.message ||

            "Delete failed.",

            "danger"

        );

    }

};
   
    // =====================================================
    // Delete Group
    // =====================================================

    const deleteGroup = async (

       machine_group_id

    ) => {

        try {

            await machineService.deleteGroup(

                machine_group_id

            );

            showToast(

                "Group deleted successfully."

            );

            loadGroupConfig();

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Delete failed.",

                "danger"

            );

        }

    };

    // =====================================================
    // Runtime
    // =====================================================

    const loadRuntime = async () => {

        try {

            setLoading(true);

            const response =
                await machineService.getRuntime();

            setRuntime(

                response.data.data || []

            );

            setShowRuntime(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load runtime.",

                "danger"

            );

        }

        finally {

            setLoading(false);

        }

    };

    // =====================================================
    // Execute
    // =====================================================

  const executeMachine = async () => {

    try {

        setSaving(true);

        const payload = {

            ...executeForm,

            duration_sec:
                executeForm.duration_sec === ""
                    ? null
                    : Number(executeForm.duration_sec),

            event_ts:
                executeForm.event_ts || null,

            source_signal_mapping_id:
                executeForm.source_signal_mapping_id || null,

            correlation_id:
                executeForm.correlation_id || null,

            idempotency_key:
                executeForm.idempotency_key || null,

            source_system:
                executeForm.source_system || null,

            payload:
                executeForm.payload || {}

        };

        const response =
            await machineService.execute(
                payload
            );

        showToast(

            response.data.message ||

            "Machine executed successfully."

        );

        setExecuteForm(
            executeInitialState
        );

        setShowExecute(false);

    }

    catch (error) {

        showToast(

            error.response?.data?.message ||

            "Execution failed.",

            "danger"

        );

    }

    finally {

        setSaving(false);

    }

};

    // =====================================================
    // Report
    // =====================================================

    const loadReport = async () => {

        try {

            setLoading(true);

            const response =
                await machineService.getReport();

            setReport(

                response.data.data || []

            );

            setShowReport(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load report.",

                "danger"

            );

        }

        finally {

            setLoading(false);

        }

    };

    // =====================================================
    // Export
    // =====================================================

    const exportMachine = async () => {

        try {

            const response =
                await machineService.exportData(

                    exportForm

                );

            const format =
                exportForm.format.toUpperCase();

            let type =
                "text/csv";

            let extension =
                "csv";

            if (format === "PDF") {

                type =
                    "application/pdf";

                extension =
                    "pdf";

            }

            if (format === "EXCEL") {

                type =
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

                extension =
                    "xlsx";

            }

            const blob =
                new Blob(

                    [

                        response.data

                    ],

                    {

                        type

                    }

                );

            const url =
                window.URL.createObjectURL(

                    blob

                );

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                `MachineMaster.${extension}`;

            document.body.appendChild(

                link

            );

            link.click();

            link.remove();

            window.URL.revokeObjectURL(

                url

            );

            setShowExport(false);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Export failed.",

                "danger"

            );

        }

    };
    console.log(groupFields);
    console.log({
    showCapability,
    showCapabilityForm,
    showGroup,
    showGroupForm
});
        return (

        <>

<div className="master-page">

            {/* ========================================= */}
            {/* Toast */}
            {/* ========================================= */}

         

            {/* ========================================= */}
            {/* Header */}
            {/* ========================================= */}

            <PageHeader

                title="Machine Master"

                subtitle="Master Data / Machine"

            >

                <Button

                    className="primary-btn"

                    onClick={() => {

                        resetMachineForm();

                        setShowForm(true);

                    }}

                >

                    + Add Machine

                </Button>

              <Button onClick={loadCapabilityConfig}>
    Capability Config
</Button>

<Button onClick={loadGroupConfig}>
    Group Config
</Button> 

            </PageHeader>

            {/* ========================================= */}
            {/* Search */}
            {/* ========================================= */}

           
            <SearchToolbar

    searchText={searchText}
    onSearch={setSearchText}

    status={statusFilter}
    onStatusChange={setStatusFilter}

    onRefresh={loadMaster}

    onExecute={() => setShowExecute(true)}

    onRuntime={loadRuntime}

    onReport={loadReport}

    onExport={() => setShowExport(true)}
 placeholder="Search Machine..."
/>

            {/* ========================================= */}
            {/* Master Table */}
            {/* ========================================= */}

            <DataTable

                columns={machineColumns}

                data={filteredData}

                loading={loading}

                renderActions={(row) => (

                    <ActionButtons

                        onEdit={() =>

                            editMachine(row)

                        }

                        onDelete={() =>

                            openDelete(row)

                        }

                    />

                )}

            />

            {/* ========================================= */}
            {/* Master Form */}
            {/* ========================================= */}

            <MasterFormModal

                show={showForm}

                title="Machine"

                fields={machineFields}

                formData={machineForm}

                setFormData={setMachineForm}

                errors={errors}

                saving={saving}

                isEdit={Boolean(editId)}

                onSave={saveMachine}

                onClose={() => {

                    resetMachineForm();

                    setShowForm(false);

                }}

            />

            {/* ========================================= */}
            {/* Delete */}
            {/* ========================================= */}

            <ConfirmDeleteModal

                show={showDelete}

                deleting={deleting}

                title="Delete Machine"

                message="Are you sure you want to delete this machine?"

                onDelete={deleteMachine}

                onClose={() =>

                    setShowDelete(false)

                }

            />
                        {/* ========================================= */}
            {/* Capability Configuration */}
            {/* ========================================= */}


            {/* ========================================= */}
            {/* Capability Form */}
            {/* ========================================= */}
<ConfigModal
    show={showCapability}
    title="Machine Capability Configuration"
    saveText="Close"
    onSave={() => setShowCapability(false)}
    onClose={() => setShowCapability(false)}
>

    <div className="d-flex justify-content-end mb-3">

   <Button
    onClick={() => {

        setShowCapability(false);

        setTimeout(() => {

            setShowCapabilityForm(true);

        }, 200);

    }}
>
    + Add Capability
</Button>

    </div>

    <DataTable

       data={capabilityConfig}

       columns={[

    {
        key: "machine_name",
        label: "Machine"
    },

    {
        key: "capability_code",
        label: "Code"
    },

    {
        key: "capability_name",
        label: "Capability"
    },

    {
        key: "capability_type",
        label: "Type"
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
        key: "is_active",
        label: "Active",
        render: row => (
            <StatusBadge
                status={row.is_active ? "ACTIVE" : "INACTIVE"}
            />
        )
    }

]}

    />

</ConfigModal>

            {/* ========================================= */}
            {/* Group Configuration */}
            {/* ========================================= */}

           

            {/* ========================================= */}
            {/* Group Form */}
            {/* ========================================= */}
<ConfigModal
   show={showCapabilityForm && !showCapability}
    title="Add Capability"

    fields={capabilityFields}

    formData={capabilityForm}

    setFormData={setCapabilityForm}

    errors={errors}

    saving={saving}

    onSave={saveCapability}

    onClose={() => {

        setShowCapabilityForm(false);

        setCapabilityForm(capabilityInitialState);

    }}
/>
<ConfigModal

    show={showGroup}

    title="Machine Group Configuration"

    saveText="Close"

    onSave={() => setShowGroup(false)}

    onClose={() => setShowGroup(false)}

>

    <div className="d-flex justify-content-end mb-3">

    <Button
    onClick={() => {

        setShowGroup(false);

        setTimeout(() => {

            setShowGroupForm(true);

        }, 200);

    }}
>
    + Add Group
</Button>
    </div>

    <DataTable

       data={groupConfig}

       columns={[

    {
        key: "group_code",
        label: "Code"
    },

    {
        key: "group_name",
        label: "Group"
    },

    {
        key: "group_type",
        label: "Type"
    },

    {
        key: "line_name",
        label: "Line"
    },

    {
        key: "member_machine_ids",
        label: "Members",

        render: row =>

            row.member_machine_ids?.length || 0

    },

    {
        key: "status",
        label: "Status",

        render: row => (

            <StatusBadge
                status={row.status}
            />

        )

    }

]}

    />

</ConfigModal>
<ConfigModal

  show={showGroupForm && !showGroup}

    title="Add Group"

    fields={groupFields}

    formData={groupForm}

    setFormData={setGroupForm}

    errors={errors}

    saving={saving}

    onSave={saveGroup}

    onClose={() => {

        setShowGroupForm(false);

        setGroupForm(groupInitialState);

    }}

/>


            {/* ========================================= */}
            {/* Runtime */}
            {/* ========================================= */}

            <RuntimeModal

                show={showRuntime}

                title="Machine Runtime"

                columns={runtimeColumns}

                data={runtime}

                loading={loading}

                onClose={() =>

                    setShowRuntime(false)

                }

            />

            {/* ========================================= */}
            {/* Execute */}
            {/* ========================================= */}

            <ExecuteModal

                show={showExecute}

                title="Execute Machine"

                fields={executeFields}

                formData={executeForm}

                setFormData={setExecuteForm}

                saving={saving}

                onExecute={executeMachine}

                onClose={() =>

                    setShowExecute(false)

                }

            />

            {/* ========================================= */}
            {/* Report */}
            {/* ========================================= */}

            <ReportModal

                show={showReport}

                title="Machine Report"

                columns={reportColumns}

                data={report}

                loading={loading}

                onClose={() =>

                    setShowReport(false)

                }

            />

            {/* ========================================= */}
            {/* Export */}
            {/* ========================================= */}

            <ExportModal

                show={showExport}

                title="Export Machine"

                exportForm={exportForm}

                setExportForm={setExportForm}

                filters={exportFilters}

                exporting={saving}

                onExport={exportMachine}

                onClose={() =>

                    setShowExport(false)

                }

            />

        </div>
</>

    );

}

export default MachineMaster;
    