import "../../EnterpriseSetupClean.css";
import React from 'react';

import Table from '../../../../shared/components/SmartTable.jsx';
import { useEffect, useState } from "react";

import {
    Calendar3,
    Clock,
    CalendarEvent
} from "react-bootstrap-icons";

import {
    Card,
    Row,
    Col,
    Button,
    Form,
    Modal,
    Spinner,
    Badge,
    Toast,
    InputGroup,
    FormControl
} from "react-bootstrap";

import {
    Plus,
    Search,
    GearFill,
    ArrowClockwise,
    PlayFill,
    ClockHistory,
    FileText,
    Download,
    PencilSquare
} from "react-bootstrap-icons";
import lineService from "../../line-master/api/line.service.js";
import shiftService from "../api/shift.service.js";
import PageHeader from "../../../../shared/components/PageHeader.jsx";
import SearchToolbar from "../../../../shared/components/SearchToolbar.jsx";
import DataTable from "../../../../shared/components/DataTable.jsx";
import ActionButtons from "../../../../shared/components/ActionButtons.jsx";
import StatusBadge from "../../../../shared/components/StatusBadge.jsx";
import ToastMessage from "../../../../shared/components/ToastMessage.jsx";
import "./ShiftCalendar.css";
import plantShopService from "../../plant-shop-master/api/plantshop.service.js";

function ShiftCalendar() {

    // =====================================================
    // Master Data
    // =====================================================
const [lines, setLines] = useState([]);
    const [shifts, setShifts] = useState([]);
const [plants, setPlants] = useState([]);
    const [configList, setConfigList] = useState([]);

    const [runtime, setRuntime] = useState([]);

    const [report, setReport] = useState([]);
    const [breakList, setBreakList] = useState([]);
const [calendarList, setCalendarList] = useState([]);
const [holidayList, setHolidayList] = useState([]);

const [showBreakModal, setShowBreakModal] = useState(false);
const [showCalendarModal, setShowCalendarModal] = useState(false);
const [showHolidayModal, setShowHolidayModal] = useState(false);

    // =====================================================
    // Search
    // =====================================================

    const [searchText, setSearchText] = useState("");

    const [statusFilter, setStatusFilter] = useState("ACTIVE");

    // =====================================================
    // Loading
    // =====================================================

    const [loading, setLoading] = useState(false);

    const [saving, setSaving] = useState(false);

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
    // Modal
    // =====================================================

    const [showShiftForm, setShowShiftForm] = useState(false);

    const [showConfigList, setShowConfigList] = useState(false);

    const [showConfigForm, setShowConfigForm] = useState(false);

    const [showRuntime, setShowRuntime] = useState(false);

    const [showExecute, setShowExecute] = useState(false);

    const [showReport, setShowReport] = useState(false);

    const [showExport, setShowExport] = useState(false);

    // =====================================================
    // Edit
    // =====================================================

    const [editId, setEditId] = useState(null);

    // =====================================================
    // Shift Form
    // =====================================================

    const [shiftForm, setShiftForm] = useState({

        shift_no: "",

        shift_name: "",

        shift_start_time: "",

        shift_end_time: "",

        shift_duration: "",

        is_night_shift: false,

        line_id: "",

        status: "ACTIVE"

    });

    // =====================================================
    // Configuration Form
    // =====================================================

    const [configForm, setConfigForm] = useState({

        config_type: "BREAK",

        shift_id: "",

        break_name: "",

        break_start_time: "",

        break_end_time: "",

        include_in_oee: false,

        work_date: "",

        shift_status: "WORKING",

        remarks: "",

        plant_id: "",

        holiday_date: "",

        reason: "",

        is_paid: true,

        status: "ACTIVE"

    });
    const loadPlants = async () => {
    try {

        const response =
            await plantShopService.getMaster();

        const data = response.data.data || [];
        console.log("Plant API Response:", response.data.data);

     setPlants(response.data.data || []);
    

    } catch (error) {

        console.log(error);

    }
};

    // =====================================================
    // Execute Form
    // =====================================================

    const [executeForm, setExecuteForm] = useState({

        shift_id: "",

        runtime_date: "",

        shift_start_time: "",

        shift_end_time: "",

        actual_start_time: "",

        actual_end_time: "",

        runtime_status: "COMPLETED",

        remarks: ""

    });

    // =====================================================
    // Export Form
    // =====================================================

    const [exportForm, setExportForm] = useState({

        format: "CSV",

        line_id: "",

        status: "",

        from_date: "",

        to_date: ""

    });

    const loadBreaks = async (shiftId) => {
    try {
        const response = await shiftService.getBreaks(shiftId);
        setBreakList(response.data.data || []);
        setShowBreakModal(true);
    } catch (err) {
        showToast("Unable to load Breaks", "danger");
    }
};

const loadCalendars = async (shiftId) => {
    try {
        const response = await shiftService.getCalendars(shiftId);
        setCalendarList(response.data.data || []);
        setShowCalendarModal(true);
    } catch (err) {
        showToast("Unable to load Calendars", "danger");
    }
};

const loadHolidays = async (shiftId) => {
    try {
        const response = await shiftService.getHolidays(shiftId);
        setHolidayList(response.data.data || []);
        setShowHolidayModal(true);
    } catch (err) {
        showToast("Unable to load Holidays", "danger");
    }
};

    // =====================================================
    // Initial Load
    // =====================================================

    useEffect(() => {

        loadShiftMaster();
         loadLines();
          loadPlants();

    }, []);

    // =====================================================
    // Handle Shift Change
    // =====================================================
const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "";

    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);

    // Night shift
    if (end < start) {
        end.setDate(end.getDate() + 1);
    }

    const diff = (end - start) / (1000 * 60);

    return diff;
};
  const handleShiftChange = (event) => {

    const { name, value, type, checked } = event.target;

    const updatedForm = {
        ...shiftForm,
        [name]: type === "checkbox" ? checked : value
    };

    updatedForm.shift_duration = calculateDuration(
        updatedForm.shift_start_time,
        updatedForm.shift_end_time
    );

    setShiftForm(updatedForm);
};
    const loadLines = async () => {
    try {
        const response = await lineService.getMaster();
        setLines(response.data.data || []);
    } catch (error) {
        console.log(error);
    }
};

    // =====================================================
    // Handle Configuration Change
    // =====================================================

    const handleConfigChange = (event) => {

        const {

            name,

            value,

            type,

            checked

        } = event.target;

        setConfigForm({

            ...configForm,

            [name]:

                type === "checkbox"

                    ?

                    checked

                    :

                    value

        });

    };

    // =====================================================
    // Handle Export Change
    // =====================================================

    const handleExportChange = (event) => {

        const {

            name,

            value

        } = event.target;

        setExportForm({

            ...exportForm,

            [name]: value

        });

    };

    // =====================================================
    // Reset Shift Form
    // =====================================================

    const resetShiftForm = () => {

        setEditId(null);

        setShiftForm({

            shift_no: "",

            shift_name: "",

            shift_start_time: "",

            shift_end_time: "",

            shift_duration: "",

            is_night_shift: false,

            line_id: "",

            status: "ACTIVE"

        });

    };    // =====================================================
    // Load Shift Master
    // =====================================================

    const loadShiftMaster = async () => {

        try {

            setLoading(true);

            const response = await shiftService.getMaster();

            setShifts(

                response.data.data || []

            );

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load Shift Master.",

                "danger"

            );

        }

        finally {

            setLoading(false);

        }

    };

    // =====================================================
    // Load Configuration
    // =====================================================

    const loadConfig = async () => {

        try {

            const response = await shiftService.getConfig();

            setConfigList(

                response.data.data || []

            );

            setShowConfigList(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load Configuration.",

                "danger"

            );

        }

    };

    // =====================================================
    // Save Shift
    // =====================================================

    const saveShift = async () => {

        try {

            setSaving(true);

            let response;

            const payload = {

                shift_no: Number(shiftForm.shift_no),

                shift_name: shiftForm.shift_name,

                shift_start_time: shiftForm.shift_start_time,

                shift_end_time: shiftForm.shift_end_time,

                shift_duration: Number(shiftForm.shift_duration),

                is_night_shift: shiftForm.is_night_shift,

                line_id: shiftForm.line_id,

                status: shiftForm.status

            };

            if (editId) {

                response = await shiftService.updateMaster(

                    editId,

                    payload

                );

            }

            else {

                response = await shiftService.createMaster(

                    payload

                );

            }

            showToast(

                response.data.message ||

                "Shift Saved Successfully."

            );

            loadShiftMaster();

            resetShiftForm();

            setShowShiftForm(false);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to Save Shift.",

                "danger"

            );

        }

        finally {

            setSaving(false);

        }

    };

    // =====================================================
    // Edit Shift
    // =====================================================

    const editShift = (item) => {

        setEditId(

            item.shift_id

        );

        setShiftForm({

            shift_no: item.shift_no,

            shift_name: item.shift_name,

            shift_start_time: item.shift_start_time,

            shift_end_time: item.shift_end_time,

            shift_duration: item.shift_duration,

            is_night_shift: item.is_night_shift,

            line_id: item.line_id,

            status: item.status

        });

        setShowShiftForm(true);

    };

    // =====================================================
    // New Configuration
    // =====================================================

    const newConfiguration = () => {

        setConfigForm({

            config_type: "BREAK",

            shift_id: "",

            break_name: "",

            break_start_time: "",

            break_end_time: "",

            include_in_oee: false,

            work_date: "",

            shift_status: "WORKING",

            remarks: "",

            plant_id: "",

            holiday_date: "",

            reason: "",

            is_paid: true,

            status: "ACTIVE"

        });

        setShowConfigForm(true);

    };

    // =====================================================
    // Open Configuration
    // =====================================================

    const editConfiguration = (item) => {

        setConfigForm({

            ...configForm,

            ...item

        });

        setShowConfigForm(true);

    };

    // =====================================================
    // Save Configuration
    // =====================================================

    const saveConfiguration = async () => {

        try {

            setSaving(true);

            const response = await shiftService.saveConfig(

                configForm

            );

            showToast(

                response.data.message ||

                "Configuration Saved Successfully."

            );

            loadConfig();

            setShowConfigForm(false);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to Save Configuration.",

                "danger"

            );

        }

        finally {

            setSaving(false);

        }

    };

    // =====================================================
    // Runtime
    // =====================================================

    const loadRuntime = async () => {

        try {

            const response = await shiftService.getRuntime();

            setRuntime(

                response.data.data || []

            );

            setShowRuntime(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to Load Runtime.",

                "danger"

            );

        }

    };

    // =====================================================
    // Execute
    // =====================================================

    const executeShift = async () => {

        try {

            const response = await shiftService.execute(

                executeForm

            );

            showToast(

                response.data.message ||

                "Execution Completed."

            );

            setShowExecute(false);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Execution Failed.",

                "danger"

            );

        }

    };

    // =====================================================
    // Report
    // =====================================================

    const loadReport = async () => {

        try {

            const response = await shiftService.getReport();

            setReport(

                response.data.data || []

            );

            setShowReport(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to Load Report.",

                "danger"

            );

        }

    };

    // =====================================================
    // Export
    // =====================================================

    const exportData = async () => {

        try {

            const response = await shiftService.exportData(

                exportForm

            );

            const blob = new Blob(

                [response.data],

                {

                    type: "text/csv"

                }

            );

            const url =

                window.URL.createObjectURL(blob);

            const link =

                document.createElement("a");

            link.href = url;

            link.download =

                "ShiftMaster.csv";

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

            setShowExport(false);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Export Failed.",

                "danger"

            );

        }

    };
    const columns = [

    {
        key: "shift_no",
        label: "Shift No"
    },

    {
        key: "shift_name",
        label: "Shift Name"
    },

    {
        key: "line_name",
        label: "Line"
    },

    {
        key: "shift_start_time",
        label: "Start Time"
    },

    {
        key: "shift_end_time",
        label: "End Time"
    },

    {
        key: "shift_duration",
        label: "Duration"
    },

    {
        key: "is_night_shift",
        label: "Night Shift",

        render: (row) =>

            row.is_night_shift ? "Yes" : "No"
    },

    {
        key: "status",
        label: "Status",

        render: (row) => (

            <StatusBadge

                status={row.status}

            />

        )

    }

];
const filteredData = shifts.filter((item) => {

    const search = searchText.toLowerCase();

    const matchSearch =
        item.shift_name?.toLowerCase().includes(search) ||
        String(item.shift_no).includes(search);

    const matchStatus =
        String(item.status || "").toUpperCase() === "ACTIVE";

    return matchSearch && matchStatus;

});
    return (

<>

<div className="master-page">

    {/* ===================================================== */}
    {/* Toast */}
    {/* ===================================================== */}

  

    {/* ===================================================== */}
    {/* Header */}
    {/* ===================================================== */}

    <PageHeader
    title="Shift Master"
    subtitle="Enterprise Setup / Shift Calendar"
>

    <Button
        className="primary-btn"
        onClick={()=>{
            resetShiftForm();
            setShowShiftForm(true);
        }}
    >
        + Add Shift
    </Button>

</PageHeader>

    {/* ===================================================== */}
    {/* Toolbar */}
    {/* ===================================================== */}

    <SearchToolbar

    searchValue={searchText}

    onSearchChange={setSearchText}

    showStatus={false}
    statusValue={statusFilter}

    onStatusChange={setStatusFilter}

    onRefresh={loadShiftMaster}







    onExport={() => setShowExport(true)}

    placeholder="Search Shift..."

/>

    {/* ===================================================== */}
    {/* Shift Master Table */}
    {/* ===================================================== */}
<DataTable

    columns={columns}

    data={filteredData}

    loading={loading}

    renderActions={(row) => (

        <ActionButtons

            onEdit={() => editShift(row)}
            showDelete={false}

        />

    )}

/>

    {/* ===================================================== */}
    {/* Shift Form */}
    {/* ===================================================== */}
    <Modal
    show={showShiftForm}
    onHide={() => {

        resetShiftForm();

        setShowShiftForm(false);

    }}
    size="lg"
    centered
    backdrop="static"
>

    <Modal.Header closeButton>

        <Modal.Title>

            {

                editId

                    ?

                    "Update Shift"

                    :

                    "Add Shift"

            }

        </Modal.Title>

    </Modal.Header>

    <Modal.Body>

        <Form>

            <Row>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Shift Number

                        </Form.Label>

                        <Form.Control

                            type="number"

                            name="shift_no"

                            value={shiftForm.shift_no}

                            onChange={handleShiftChange}
                            
                             disabled={editId !== null}

                        />

                    </Form.Group>

                </Col>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Shift Name

                        </Form.Label>

                        <Form.Control

                            type="text"

                            name="shift_name"

                            value={shiftForm.shift_name}

                            onChange={handleShiftChange}

                        />

                    </Form.Group>

                </Col>

            </Row>

            <Row>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Start Time

                        </Form.Label>

                        <Form.Control

                            type="time"

                            name="shift_start_time"

                            value={shiftForm.shift_start_time}

                            onChange={handleShiftChange}

                        />

                    </Form.Group>

                </Col>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            End Time

                        </Form.Label>

                        <Form.Control

                            type="time"

                            name="shift_end_time"

                            value={shiftForm.shift_end_time}

                            onChange={handleShiftChange}

                        />

                    </Form.Group>

                </Col>

            </Row>

            <Row>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Shift Duration (Minutes)

                        </Form.Label>

                        <Form.Control

                            type="number"

                            name="shift_duration"

                            value={shiftForm.shift_duration}

                            onChange={handleShiftChange}
                             readOnly

                        />

                    </Form.Group>

                </Col>

                {!editId && (
    <Col md={6}>
        <Form.Group className="mb-3">
            <Form.Label>Line</Form.Label>

            <Form.Select
                name="line_id"
                value={shiftForm.line_id}
                onChange={handleShiftChange}
            >
                <option value="">Select Line</option>

                {lines.map((line) => (
                    <option
                        key={line.line_id}
                        value={line.line_id}
                    >
                        {line.line_name}
                    </option>
                ))}
            </Form.Select>
        </Form.Group>
    </Col>
)}

            </Row>
                        <Form.Group className="mb-3">

                <Form.Check

                    type="checkbox"

                    name="is_night_shift"

                    label="Night Shift"

                    checked={shiftForm.is_night_shift}

                    onChange={handleShiftChange}
                    disabled={editId !== null}

                />

            </Form.Group>

            <Form.Group className="mb-3">

                <Form.Label>

                    Status

                </Form.Label>

                <Form.Select

                    name="status"

                    value={shiftForm.status}

                    onChange={handleShiftChange}

                >

                    <option value="ACTIVE">

                        ACTIVE

                    </option>

                    <option value="INACTIVE">

                        INACTIVE

                    </option>

                </Form.Select>

            </Form.Group>

        </Form>

    </Modal.Body>

    <Modal.Footer>

        <Button

            variant="secondary"

            onClick={() => {

                resetShiftForm();

                setShowShiftForm(false);

            }}

        >

            Cancel

        </Button>

        <Button

            variant="primary"

            onClick={saveShift}

            disabled={saving}

        >

            {

                saving

                ?

                <>

                    <Spinner

                        animation="border"

                        size="sm"

                        className="me-2"

                    />

                    Saving...

                </>

                :

                editId

                ?

                "Update"

                :

                "Save"

            }

        </Button>

    </Modal.Footer>

</Modal>

{/* ===================================================== */}
{/* Configuration List */}
{/* ===================================================== */}
<Modal
    show={showConfigList}
    onHide={() => setShowConfigList(false)}
    size="xl"
    centered
>

    <Modal.Header closeButton>

        <Modal.Title>

            Shift Configuration

        </Modal.Title>

    </Modal.Header>

    <Modal.Body>

        <div className="d-flex justify-content-between align-items-center mb-3">

            <h5 className="mb-0">

                Configuration List

            </h5>

            <Button
                variant="success"
                onClick={newConfiguration}
            >

                

                {" "}

                New Configuration

            </Button>

        </div>

        <Table
            striped
            bordered
            hover
            responsive
        >

            <thead>

              <tr>
    <th>Shift No</th>
    <th>Shift Name</th>
    <th>Line</th>
    <th>Start Time</th>
    <th>End Time</th>
    <th>Duration</th>
    <th>Calendars</th>
    <th>Breaks</th>
    <th>Holidays</th>
    <th>Status</th>
</tr> 

            </thead>

<tbody>
{
    configList.length === 0 ? (
        <tr>
            <td colSpan="10" className="text-center">
                No Configuration Found
            </td>
        </tr>
    ) : (
        configList.map((item, index) => (
            <tr key={index}>

                <td>{item.shift_no}</td>

                <td>{item.shift_name}</td>

                <td>{item.line_name}</td>

                <td>{item.shift_start_time}</td>

                <td>{item.shift_end_time}</td>

                <td>{item.shift_duration}</td>

<td>
   <Button
    size="sm"
    className="config-count-btn calendar-btn"
    onClick={() => loadCalendars(item.shift_id)}
>
    <Calendar3 className="me-1" />
    {item.total_calendar}
</Button>
</td>

<td>
   <Button
    size="sm"
    className="config-count-btn break-btn"
    onClick={() => loadBreaks(item.shift_id)}
>
    <Clock className="me-1" />
    {item.total_breaks}
</Button>
</td>

<td>
   <Button
    size="sm"
    className="config-count-btn holiday-btn"
    onClick={() => loadHolidays(item.shift_id)}
>
    <CalendarEvent className="me-1" />
    {item.total_holidays}
</Button>
</td>
                <td>
                    <StatusBadge status={item.status} />
                </td>

            </tr>
        ))
    )
}
</tbody>
        </Table>

    </Modal.Body>

    <Modal.Footer>

        <Button

            variant="secondary"

            onClick={() =>

                setShowConfigList(false)

            }

        >

            Close

        </Button>

    </Modal.Footer>

</Modal>

{/* ===================================================== */}
{/* Configuration Form */}
{/* ===================================================== */}
<Modal
    show={showConfigForm}
    onHide={() => setShowConfigForm(false)}
    size="lg"
    centered
    backdrop="static"
>

    <Modal.Header closeButton>

        <Modal.Title>

            Shift Configuration

        </Modal.Title>

    </Modal.Header>

    <Modal.Body>

        <Form>

            {/* ====================================== */}
            {/* Configuration Type */}
            {/* ====================================== */}

            <Form.Group className="mb-3">

                <Form.Label>

                    Configuration Type

                </Form.Label>

                <Form.Select

                    name="config_type"

                    value={configForm.config_type}

                    onChange={handleConfigChange}

                >

                    <option value="BREAK">

                        BREAK

                    </option>

                    <option value="CALENDAR">

                        CALENDAR

                    </option>

                    <option value="HOLIDAY">

                        HOLIDAY

                    </option>

                </Form.Select>

            </Form.Group>

            {/* ====================================== */}
            {/* BREAK */}
            {/* ====================================== */}

            {

                configForm.config_type === "BREAK"

                &&

                <>

                    <Row>

                        <Col md={6}>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Shift ID

                                </Form.Label>

               <Form.Select
    name="shift_id"
    value={configForm.shift_id}
    onChange={handleConfigChange}
>
    <option value="">Select Shift</option>

    {shifts.map((shift) => (
        <option
            key={shift.shift_id}
            value={shift.shift_id}
        >
            {shift.shift_name}
        </option>
    ))}
</Form.Select>

                            </Form.Group>

                        </Col>

                        <Col md={6}>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Break Name

                                </Form.Label>

                                <Form.Control

                                    type="text"

                                    name="break_name"

                                    value={configForm.break_name}

                                    onChange={handleConfigChange}

                                />

                            </Form.Group>

                        </Col>

                    </Row>

                    <Row>

                        <Col md={6}>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Break Start Time

                                </Form.Label>

                                <Form.Control

                                    type="time"

                                    name="break_start_time"

                                    value={configForm.break_start_time}

                                    onChange={handleConfigChange}

                                />

                            </Form.Group>

                        </Col>

                        <Col md={6}>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Break End Time

                                </Form.Label>

                                <Form.Control

                                    type="time"

                                    name="break_end_time"

                                    value={configForm.break_end_time}

                                    onChange={handleConfigChange}

                                />

                            </Form.Group>

                        </Col>

                    </Row>

                    <Form.Group className="mb-3">

                        <Form.Check

                            type="checkbox"

                            name="include_in_oee"

                            label="Include In OEE"

                            checked={configForm.include_in_oee}

                            onChange={handleConfigChange}

                        />

                    </Form.Group>

                </>

            }
                        {/* ====================================== */}
            {/* CALENDAR */}
            {/* ====================================== */}

            {

                configForm.config_type === "CALENDAR"

                &&

                <>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Shift ID

                        </Form.Label>

                       <Form.Select
    name="shift_id"
    value={configForm.shift_id}
    onChange={handleConfigChange}
>
    <option value="">Select Shift</option>

    {shifts.map((shift) => (
        <option
            key={shift.shift_id}
            value={shift.shift_id}
        >
            {shift.shift_name}
        </option>
    ))}
</Form.Select>

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Work Date

                        </Form.Label>

                        <Form.Control

                            type="date"

                            name="work_date"

                            value={configForm.work_date}

                            onChange={handleConfigChange}

                        />

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Shift Status

                        </Form.Label>

                        <Form.Select

                            name="shift_status"

                            value={configForm.shift_status}

                            onChange={handleConfigChange}

                        >

                            <option value="WORKING">

                                WORKING

                            </option>

                            <option value="OFF">

                                OFF

                            </option>

                            <option value="HOLIDAY">

                                HOLIDAY

                            </option>

                        </Form.Select>

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Remarks

                        </Form.Label>

                        <Form.Control

                            as="textarea"

                            rows={3}

                            name="remarks"

                            value={configForm.remarks}

                            onChange={handleConfigChange}

                        />

                    </Form.Group>

                </>

            }

            {/* ====================================== */}
            {/* HOLIDAY */}
            {/* ====================================== */}

            {

                configForm.config_type === "HOLIDAY"

                &&

                <>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Plant ID

                        </Form.Label>

                     <Form.Select
    name="plant_id"
    value={configForm.plant_id}
    onChange={handleConfigChange}
>
    <option value="">
        Select Plant
    </option>

    {plants.map((plant) => (
        <option
            key={plant.plant_id}
            value={plant.plant_id}
        >
            {plant.plant_name}
        </option>
    ))}
</Form.Select>

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Holiday Date

                        </Form.Label>

                        <Form.Control

                            type="date"

                            name="holiday_date"

                            value={configForm.holiday_date}

                            onChange={handleConfigChange}

                        />

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Reason

                        </Form.Label>

                        <Form.Control

                            type="text"

                            name="reason"

                            value={configForm.reason}

                            onChange={handleConfigChange}

                        />

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Check

                            type="checkbox"

                            name="is_paid"

                            label="Paid Holiday"

                            checked={configForm.is_paid}

                            onChange={handleConfigChange}

                        />

                    </Form.Group>

                </>

            }

            {/* ====================================== */}
            {/* Common Status */}
            {/* ====================================== */}

            <Form.Group className="mb-3">

                <Form.Label>

                    Status

                </Form.Label>

                <Form.Select

                    name="status"

                    value={configForm.status}

                    onChange={handleConfigChange}

                >

                    <option value="ACTIVE">

                        ACTIVE

                    </option>

                    <option value="INACTIVE">

                        INACTIVE

                    </option>

                </Form.Select>

            </Form.Group>

        </Form>

    </Modal.Body>

    <Modal.Footer>

        <Button

            variant="secondary"

            onClick={() =>

                setShowConfigForm(false)

            }

        >

            Cancel

        </Button>

        <Button

            variant="primary"

            disabled={saving}

            onClick={saveConfiguration}

        >

            {

                saving

                ?

                <>

                    <Spinner

                        animation="border"

                        size="sm"

                        className="me-2"

                    />

                    Saving...

                </>

                :

                "Save Configuration"

            }

        </Button>

    </Modal.Footer>

</Modal>

{/* ===================================================== */}
{/* Runtime Modal */}
{/* ===================================================== */}
<Modal
    show={showRuntime}
    onHide={() => setShowRuntime(false)}
    size="xl"
    centered
>

    <Modal.Header closeButton>

        <Modal.Title>

            Shift Runtime

        </Modal.Title>

    </Modal.Header>

    <Modal.Body>

        <Table
            striped
            bordered
            hover
            responsive
        >

            <thead>

                <tr>

                    <th>Shift</th>

                    <th>Runtime Date</th>

                    <th>Actual Start</th>

                    <th>Actual End</th>

                    <th>Status</th>

                    <th>Remarks</th>

                </tr>

            </thead>

            <tbody>

                {

                    runtime.length === 0 ?

                    (

                        <tr>

                            <td
                                colSpan="6"
                                className="text-center"
                            >

                                No Runtime Records Found

                            </td>

                        </tr>

                    )

                    :

                    runtime.map((item,index)=>(

                        <tr key={index}>

                            <td>

                                {

                                    item.shift_name ||

                                    item.shift_no ||

                                    "-"

                                }

                            </td>

                            <td>

                                {

                                    item.runtime_date ||

                                    "-"

                                }

                            </td>

                            <td>

                                {

                                    item.actual_start_time ||

                                    "-"

                                }

                            </td>

                            <td>

                                {

                                    item.actual_end_time ||

                                    "-"

                                }

                            </td>

                            <td>

                                <Badge

                                    bg={

                                        item.runtime_status === "COMPLETED"

                                        ?

                                        "success"

                                        :

                                        item.runtime_status === "RUNNING"

                                        ?

                                        "warning"

                                        :

                                        "danger"

                                    }

                                >

                                    {

                                        item.runtime_status ||

                                        "-"

                                    }

                                </Badge>

                            </td>

                            <td>

                                {

                                    item.remarks ||

                                    "-"

                                }

                            </td>

                        </tr>

                    ))

                }

            </tbody>

        </Table>

    </Modal.Body>

    <Modal.Footer>

        <Button

            variant="secondary"

            onClick={() =>

                setShowRuntime(false)

            }

        >

            Close

        </Button>

    </Modal.Footer>

</Modal>

{/* ===================================================== */}
{/* Execute Modal */}
{/* ===================================================== */}
<Modal
    show={showExecute}
    onHide={() => setShowExecute(false)}
    size="lg"
    centered
>

    <Modal.Header closeButton>

        <Modal.Title>

            Execute Shift

        </Modal.Title>

    </Modal.Header>

    <Modal.Body>

        <Form>

            <Row>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Shift ID

                        </Form.Label>

                        <Form.Control
                            type="text"
                            name="shift_id"
                            value={executeForm.shift_id}
                            onChange={(e)=>
                                setExecuteForm({
                                    ...executeForm,
                                    shift_id:e.target.value
                                })
                            }
                        />

                    </Form.Group>

                </Col>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Runtime Date

                        </Form.Label>

                        <Form.Control
                            type="date"
                            name="runtime_date"
                            value={executeForm.runtime_date}
                            onChange={(e)=>
                                setExecuteForm({
                                    ...executeForm,
                                    runtime_date:e.target.value
                                })
                            }
                        />

                    </Form.Group>

                </Col>

            </Row>

            <Row>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Planned Start

                        </Form.Label>

                        <Form.Control
                            type="time"
                            name="shift_start_time"
                            value={executeForm.shift_start_time}
                            onChange={(e)=>
                                setExecuteForm({
                                    ...executeForm,
                                    shift_start_time:e.target.value
                                })
                            }
                        />

                    </Form.Group>

                </Col>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Planned End

                        </Form.Label>

                        <Form.Control
                            type="time"
                            name="shift_end_time"
                            value={executeForm.shift_end_time}
                            onChange={(e)=>
                                setExecuteForm({
                                    ...executeForm,
                                    shift_end_time:e.target.value
                                })
                            }
                        />

                    </Form.Group>

                </Col>

            </Row>

            <Row>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Actual Start

                        </Form.Label>

                        <Form.Control
                            type="datetime-local"
                            name="actual_start_time"
                            value={executeForm.actual_start_time}
                            onChange={(e)=>
                                setExecuteForm({
                                    ...executeForm,
                                    actual_start_time:e.target.value
                                })
                            }
                        />

                    </Form.Group>

                </Col>

                <Col md={6}>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Actual End

                        </Form.Label>

                        <Form.Control
                            type="datetime-local"
                            name="actual_end_time"
                            value={executeForm.actual_end_time}
                            onChange={(e)=>
                                setExecuteForm({
                                    ...executeForm,
                                    actual_end_time:e.target.value
                                })
                            }
                        />

                    </Form.Group>

                </Col>

            </Row>

            <Form.Group className="mb-3">

                <Form.Label>

                    Runtime Status

                </Form.Label>

                <Form.Select
                    name="runtime_status"
                    value={executeForm.runtime_status}
                    onChange={(e)=>
                        setExecuteForm({
                            ...executeForm,
                            runtime_status:e.target.value
                        })
                    }
                >

                    <option value="RUNNING">

                        RUNNING

                    </option>

                    <option value="COMPLETED">

                        COMPLETED

                    </option>

                    <option value="FAILED">

                        FAILED

                    </option>

                </Form.Select>

            </Form.Group>

            <Form.Group>

                <Form.Label>

                    Remarks

                </Form.Label>

                <Form.Control
                    as="textarea"
                    rows={3}
                    name="remarks"
                    value={executeForm.remarks}
                    onChange={(e)=>
                        setExecuteForm({
                            ...executeForm,
                            remarks:e.target.value
                        })
                    }
                />

            </Form.Group>

        </Form>

    </Modal.Body>

    <Modal.Footer>

        <Button
            variant="secondary"
            onClick={() => setShowExecute(false)}
        >

            Cancel

        </Button>

        <Button
            variant="success"
            onClick={executeShift}
        >

            Execute

        </Button>

    </Modal.Footer>

</Modal>

{/* ===================================================== */}
{/* Report Modal */}
{/* ===================================================== */}
<Modal
    show={showReport}
    onHide={() => setShowReport(false)}
    size="xl"
    centered
>

    <Modal.Header closeButton>

        <Modal.Title>

            Shift Report

        </Modal.Title>

    </Modal.Header>

    <Modal.Body>

        <Table
            striped
            bordered
            hover
            responsive
        >

            <thead>

                <tr>

                    <th>Shift</th>

                    <th>Line</th>

                    <th>Status</th>

                    <th>Duration</th>

                </tr>

            </thead>

            <tbody>

                {

                    report.length === 0 ?

                    (

                        <tr>

                            <td
                                colSpan="4"
                                className="text-center"
                            >

                                No Report Found

                            </td>

                        </tr>

                    )

                    :

                    report.map((item,index)=>(

                        <tr key={index}>

                            <td>

                                {item.shift_name}

                            </td>

                            <td>

                                {item.line_name}

                            </td>

                            <td>

                                <Badge
                                    bg={
                                        item.status === "ACTIVE"
                                        ?
                                        "success"
                                        :
                                        "secondary"
                                    }
                                >

                                    {item.status}

                                </Badge>

                            </td>

                            <td>

                                {item.shift_duration}

                            </td>

                        </tr>

                    ))

                }

            </tbody>

        </Table>

    </Modal.Body>

    <Modal.Footer>

        <Button
            variant="secondary"
            onClick={() => setShowReport(false)}
        >

            Close

        </Button>

    </Modal.Footer>

</Modal>

{/* ===================================================== */}
{/* Export Modal */}
{/* ===================================================== */}

<Modal
    show={showExport}
    onHide={() => setShowExport(false)}
    centered
>

    <Modal.Header closeButton>

        <Modal.Title>

            Export Shift Report

        </Modal.Title>

    </Modal.Header>

    <Modal.Body>

        <Form>

            <Form.Group className="mb-3">

                <Form.Label>

                    Export Format

                </Form.Label>

                <Form.Select

                    name="format"

                    value={exportForm.format}

                    onChange={handleExportChange}

                >

                    <option value="CSV">

                        CSV

                    </option>

                    <option value="EXCEL">

                        EXCEL

                    </option>

                </Form.Select>

            </Form.Group>

            <Form.Group className="mb-3">

                <Form.Label>

                    Line ID

                </Form.Label>

                <Form.Control

                    name="line_id"

                    value={exportForm.line_id}

                    onChange={handleExportChange}

                />

            </Form.Group>

            <Form.Group className="mb-3">

                <Form.Label>

                    Status

                </Form.Label>

                <Form.Select

                    name="status"

                    value={exportForm.status}

                    onChange={handleExportChange}

                >

                    <option value="">

                        ALL

                    </option>

                    <option value="ACTIVE">

                        ACTIVE

                    </option>

                    <option value="INACTIVE">

                        INACTIVE

                    </option>

                </Form.Select>

            </Form.Group>

            <Row>

                <Col>

                    <Form.Group>

                        <Form.Label>

                            From Date

                        </Form.Label>

                        <Form.Control

                            type="date"

                            name="from_date"

                            value={exportForm.from_date}

                            onChange={handleExportChange}

                        />

                    </Form.Group>

                </Col>

                <Col>

                    <Form.Group>

                        <Form.Label>

                            To Date

                        </Form.Label>

                        <Form.Control

                            type="date"

                            name="to_date"

                            value={exportForm.to_date}

                            onChange={handleExportChange}

                        />

                    </Form.Group>

                </Col>

            </Row>

        </Form>

    </Modal.Body>

    <Modal.Footer>

        <Button

            variant="secondary"

            onClick={() =>

                setShowExport(false)

            }

        >

            Cancel

        </Button>

        <Button

            variant="success"

            onClick={exportData}

        >

            Export

        </Button>

    </Modal.Footer>

</Modal>
<Modal
    show={showBreakModal}
    onHide={() => setShowBreakModal(false)}
    size="lg"
    centered
>
    <Modal.Header closeButton>
        <Modal.Title>Shift Breaks</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        <Table striped bordered hover responsive>
            <thead>
                <tr>
                    <th>Break</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>OEE</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>
                {breakList.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="text-center">
                            No Breaks Found
                        </td>
                    </tr>
                ) : (
                    breakList.map((item) => (
                        <tr key={item.break_id}>
                            <td>{item.break_name}</td>
                            <td>{item.break_start_time}</td>
                            <td>{item.break_end_time}</td>
                            <td>{item.include_in_oee ? "Yes" : "No"}</td>
                            <td>
                                <StatusBadge status={item.status} />
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </Table>
    </Modal.Body>
</Modal>
<Modal
    show={showCalendarModal}
    onHide={() => setShowCalendarModal(false)}
    size="lg"
    centered
>
    <Modal.Header closeButton>
        <Modal.Title>Shift Calendar</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        <Table striped bordered hover responsive>
            <thead>
                <tr>
                    <th>Work Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                </tr>
            </thead>

            <tbody>
                {calendarList.length === 0 ? (
                    <tr>
                        <td colSpan="3" className="text-center">
                            No Calendar Records
                        </td>
                    </tr>
                ) : (
                    calendarList.map((item) => (
                        <tr key={item.calendar_id}>
                            <td>{item.work_date}</td>
                            <td>{item.shift_status}</td>
                            <td>{item.remarks}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </Table>
    </Modal.Body>
</Modal>
<Modal
    show={showHolidayModal}
    onHide={() => setShowHolidayModal(false)}
    size="lg"
    centered
>
    <Modal.Header closeButton>
        <Modal.Title>Plant Holidays</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        <Table striped bordered hover responsive>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Reason</th>
                    <th>Paid</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>
                {holidayList.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="text-center">
                            No Holidays Found
                        </td>
                    </tr>
                ) : (
                    holidayList.map((item) => (
                        <tr key={item.holiday_id}>
                            <td>{item.holiday_date}</td>
                            <td>{item.reason}</td>
                            <td>{item.is_paid ? "Yes" : "No"}</td>
                            <td>
                                <StatusBadge status={item.status} />
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </Table>
    </Modal.Body>
</Modal>

</div>
</>

);

}

export default ShiftCalendar;