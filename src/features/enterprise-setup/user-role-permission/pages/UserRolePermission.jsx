import React from 'react';

import Table from '../../../../shared/components/SmartTable.jsx';
import { useEffect, useState } from "react";

import {
    Card,
    Row,
    Col,
    Button,
    Modal,
    Form,
    Spinner,
    Toast,
    Badge,
    InputGroup,
    FormControl
} from "react-bootstrap";

import {
    Plus,
    Search,
    ClockHistory,
    PlayFill,
    FileText,
    Download,
    GearFill,
    PencilSquare
} from "react-bootstrap-icons";

import userRolePermissionService from "../api/userRolePermission.service.js";
import shiftService from "../../shift-calendar/api/shift.service.js";
import lineService from "../../line-master/api/line.service.js";
import machineService from "../../../master-data/machine-master/api/machine.service.js";

import "./UserRolePermission.css";
import PermissionMatrix from "./PermissionMatrix.jsx";

function UserRolePermission() {

    // =====================================================
    // Active Tab
    // =====================================================
    const [roles, setRoles] = useState([]);
const [shifts, setShifts] = useState([]);
const [lines, setLines] = useState([]);
const [machines, setMachines] = useState([]);

    const [activeTab, setActiveTab] = useState("USER");
    
const [permissions, setPermissions] = useState([]);

    // =====================================================
    // Master Data
    // =====================================================

    const [records, setRecords] = useState([]);

    const [runtime, setRuntime] = useState([]);

    const [report, setReport] = useState([]);

    // =====================================================
    // Configuration
    // =====================================================

    const [configList, setConfigList] = useState([]);

    const [configForm, setConfigForm] = useState({});

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

    // =====================================================
    // Toast
    // =====================================================
  

const loadPermissions = async () => {
    try {
        const response = await userRolePermissionService.getMaster("PERMISSION");
        setPermissions(response.data.data || []);
    } catch (err) {
        console.error(err);
    }
};



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

    const hideToast = () => {

        setToast({

            show: false,

            message: "",

            variant: "success"

        });

    };

    // =====================================================
    // Modal
    // =====================================================

    const [showForm, setShowForm] = useState(false);

    const [showConfigList, setShowConfigList] = useState(false);

    const [showConfigForm, setShowConfigForm] = useState(false);

    const [showRuntime, setShowRuntime] = useState(false);

    const [showReport, setShowReport] = useState(false);

    // =====================================================
    // Edit
    // =====================================================

    const [editId, setEditId] = useState(null);

    // =====================================================
    // Form
    // =====================================================

    const [formData, setFormData] = useState({

        type: "USER",

        employee_code: "",

        username: "",

        role_id: "",

        mobile_number: "",

        email_id: "",

        password: "",

        access_level: "USER",

        department: "",

        shift_assignment: "",

        line_assigned: "",

        machines_assigned: "",

        role_name: "",

        permission_name: "",

        permission_id: "",

        module_name: "",

        description: "",

        granted: true,

        status: "ACTIVE"

    });
    const loadRoles = async () => {
    try {
        const response =
            await userRolePermissionService.getMaster("ROLE");

        setRoles(response.data.data || []);
    } catch (error) {
        console.log(error);
    }
};

const loadShifts = async () => {
    try {
        const response =
            await shiftService.getMaster();

        setShifts(response.data.data || []);
    } catch (error) {
        console.log(error);
    }
};

const loadLines = async () => {
    try {
        const response =
            await lineService.getMaster();

        setLines(response.data.data || []);
    } catch (error) {
        console.log(error);
    }
};

const loadMachines = async () => {
    try {
        const response =
            await machineService.getMaster();

        setMachines(response.data.data || []);
    } catch (error) {
        console.log(error);
    }
};

    // =====================================================
    // Initial Load
    // =====================================================

    useEffect(() => {

        loadMaster(activeTab);
           loadRoles();
    loadShifts();
    loadLines();
    loadMachines();
    loadPermissions();

    }, [activeTab]);

    // =====================================================
    // Handle Input
    // =====================================================

    const handleChange = (event) => {

        const {

            name,

            value

        } = event.target;

        setFormData({

            ...formData,

            [name]: value,

            type: activeTab

        });

    };

    // =====================================================
    // Reset Form
    // =====================================================

    const resetForm = () => {

        setEditId(null);

        setFormData({

            type: activeTab,

            employee_code: "",

            username: "",

            role_id: "",

            mobile_number: "",

            email_id: "",

            password: "",

            access_level: "USER",

            department: "",

            shift_assignment: "",

            line_assigned: "",

            machines_assigned: "",

            role_name: "",

            permission_name: "",

            permission_id: "",

            module_name: "",

            description: "",

            granted: true,

            status: "ACTIVE"

        });

    };
        // =====================================================
    // Load Master
    // =====================================================

    const loadMaster = async (type = activeTab) => {

        try {

            setLoading(true);

            const response = await userRolePermissionService.getMaster(type);

            setRecords(

                response.data.data || []

            );

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load records.",

                "danger"

            );

        }

        finally {

            setLoading(false);

        }

    };

    // =====================================================
    // Open Config List
    // =====================================================

    const openConfigList = async () => {

        try {

            setLoading(true);

            const response = await userRolePermissionService.getConfig();

            setConfigList(

                response.data.data || []

            );

            setShowConfigList(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load configuration.",

                "danger"

            );

        }

        finally {

            setLoading(false);

        }

    };

    // =====================================================
    // New Configuration
    // =====================================================

    const newConfiguration = () => {

        setConfigForm({

            type: activeTab,

            role_name: "",

            permission_name: "",

            module_name: "",

            description: "",

            status: "ACTIVE"

        });

        setShowConfigForm(true);

    };

    // =====================================================
    // Edit Configuration
    // =====================================================

    const editConfiguration = (item) => {

        setConfigForm(item);

        setShowConfigForm(true);

    };

    // =====================================================
    // Config Change
    // =====================================================

    const handleConfigChange = (event) => {

        const {

            name,

            value

        } = event.target;

        setConfigForm({

            ...configForm,

            [name]: value

        });

    };

    // =====================================================
    // Save Configuration (POST ONLY)
    // =====================================================

    const saveConfiguration = async () => {

        try {

            setSaving(true);

            const response =

                await userRolePermissionService.saveConfig(

                    configForm

                );

            showToast(

                response.data.message ||

                "Configuration Saved"

            );

            setShowConfigForm(false);

            openConfigList();

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to save configuration",

                "danger"

            );

        }

        finally {

            setSaving(false);

        }

    };

    // =====================================================
    // Save Master
    // =====================================================

    const saveRecord = async () => {

        try {

            setSaving(true);

            let response;

            if (editId) {

                response =

                    await userRolePermissionService.updateMaster(

                        editId,

                        formData

                    );

            }

            else {

                response =

                    await userRolePermissionService.createMaster(

                        formData

                    );

            }

            showToast(

                response.data.message ||

                "Saved Successfully"

            );

            setShowForm(false);

            resetForm();

            loadMaster(activeTab);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to save record",

                "danger"

            );

        }

        finally {

            setSaving(false);

        }

    };

    // =====================================================
    // Edit Master
    // =====================================================

    const editRecord = (item) => {

        setEditId(

            item.user_id ||

            item.role_id ||

            item.permission_id

        );

        setFormData({

            ...item,

            type: activeTab

        });

        setShowForm(true);

    };

    // =====================================================
    // Runtime
    // =====================================================

    const loadRuntime = async () => {

        try {

            const response =

                await userRolePermissionService.getRuntime();

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

    };

    // =====================================================
    // Execute
    // =====================================================

    const executeData = async () => {

        try {

            const response =

                await userRolePermissionService.execute();

            showToast(

                response.data.message ||

                "Execution Successful"

            );

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Execution Failed",

                "danger"

            );

        }

    };

    // =====================================================
    // Report
    // =====================================================

    const loadReport = async () => {

        try {

            const response =

                await userRolePermissionService.getReport();

            setReport(

                response.data.data || []

            );

            setShowReport(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load report",

                "danger"

            );

        }

    };

    // =====================================================
    // Export
    // =====================================================

    const exportData = async () => {

        try {

            const response =

                await userRolePermissionService.export();

            const blob = new Blob(

                [

                    response.data

                ],

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

                "UserRolePermission.csv";

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

            showToast(

                "CSV Downloaded Successfully"

            );

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Export Failed",

                "danger"

            );

        }

    };

    // =====================================================
    // Search Filter
    // =====================================================

    const filteredRecords = records.filter((item) => {

        const text = JSON.stringify(item)

            .toLowerCase();

        const searchMatch =

            text.includes(

                searchText.toLowerCase()

            );

        const statusMatch =

            statusFilter === "ALL"

            ||

            item.status === statusFilter;

        return searchMatch && statusMatch;

    });
    

    // =====================================================
    // JSX
    // =====================================================

    return (

        <>

<div className="container-fluid">
                    {/* ===================================================== */}
        {/* Toast */}
        {/* ===================================================== */}

        <Toast
            show={toast.show}
            onClose={hideToast}
            delay={3000}
            autohide
            bg={toast.variant}
            className="position-fixed top-0 end-0 m-3"
            style={{ zIndex: 9999 }}
        >
            <Toast.Body className="text-white">

                {toast.message}

            </Toast.Body>

        </Toast>

        {/* ===================================================== */}
        {/* Header */}
        {/* ===================================================== */}

        <Card className="shadow-sm border-0 mb-4">

            <Card.Body>

                <Row className="align-items-center">

                    <Col>

                        <h3>

                            User Role Permission

                        </h3>

                        <small className="text-muted">

                            Enterprise Setup /

                            User Role Permission

                        </small>

                    </Col>

                    <Col xs="auto">

                        {activeTab !== "ACCESS_MATRIX" && <Button

                            variant="primary"

                            onClick={() => {

                                resetForm();

                                setShowForm(true);

                            }}

                        >

                            <Plus />

                            {" "}

                            Add

                        </Button>}

                        <Button

                            variant="warning"

                            className="ms-2"

                            onClick={openConfigList}

                        >

                            <GearFill />

                            {" "}

                            Config

                        </Button>

                    </Col>

                </Row>

            </Card.Body>

        </Card>

        {/* ===================================================== */}
        {/* Toolbar */}
        {/* ===================================================== */}

        <Card className="shadow-sm border-0 mb-4">

            <Card.Body>

                <Row className="g-3">

                    <Col md={4}>

                        <InputGroup>

                            <InputGroup.Text>

                                <Search />

                            </InputGroup.Text>

                            <FormControl

                                placeholder="Search..."

                                value={searchText}

                                onChange={(e)=>

                                    setSearchText(

                                        e.target.value

                                    )

                                }

                            />

                        </InputGroup>

                    </Col>

                    <Col md={2}>

                        <Form.Select

                            value={statusFilter}

                            onChange={(e)=>

                                setStatusFilter(

                                    e.target.value

                                )

                            }

                        >

                            <option value="ALL">

                                All Status

                            </option>

                            <option value="ACTIVE">

                                ACTIVE

                            </option>

                            <option value="INACTIVE">

                                INACTIVE

                            </option>

                        </Form.Select>

                    </Col>

                    <Col

                        md={6}

                        className="text-md-end"

                    >

                        <Button

                            variant="outline-secondary"

                            className="me-2"

                            onClick={()=>

                                loadMaster(activeTab)

                            }

                        >

                            Refresh

                        </Button>

                        <Button

                            variant="outline-warning"

                            className="me-2"

                            onClick={loadRuntime}

                        >

                            <ClockHistory />

                        </Button>

                        <Button

                            variant="outline-dark"

                            className="me-2"

                            onClick={executeData}

                        >

                            <PlayFill />

                        </Button>

                        <Button

                            variant="outline-primary"

                            className="me-2"

                            onClick={loadReport}

                        >

                            <FileText />

                        </Button>

                        <Button

                            variant="outline-success"

                            onClick={exportData}

                        >

                            <Download />

                        </Button>

                    </Col>

                </Row>

            </Card.Body>

        </Card>

        {/* ===================================================== */}
        {/* Tabs */}
        {/* ===================================================== */}

        <Card className="shadow-sm border-0 mb-4">

            <Card.Body>

                <Button

                    variant={

                        activeTab==="USER"

                        ?

                        "primary"

                        :

                        "outline-primary"

                    }

                    className="me-2"

                    onClick={()=>setActiveTab("USER")}

                >

                    Users

                </Button>

                <Button

                    variant={

                        activeTab==="ROLE"

                        ?

                        "primary"

                        :

                        "outline-primary"

                    }

                    className="me-2"

                    onClick={()=>setActiveTab("ROLE")}

                >

                    Roles

                </Button>

                <Button

                    variant={

                        activeTab==="PERMISSION"

                        ?

                        "primary"

                        :

                        "outline-primary"

                    }

                    className="me-2"

                    onClick={()=>setActiveTab("PERMISSION")}

                >

                    Permissions

                </Button>

                <Button

                    variant={

                        activeTab==="ROLE_PERMISSION"

                        ?

                        "primary"

                        :

                        "outline-primary"

                    }

                    onClick={()=>setActiveTab("ROLE_PERMISSION")}

                >

                    Role Permission

                </Button>
                <Button
                    variant={activeTab === "ACCESS_MATRIX" ? "primary" : "outline-primary"}
                    className="ms-2 mt-1 mt-sm-0"
                    onClick={() => setActiveTab("ACCESS_MATRIX")}
                >
                    Department Access (Checkboxes)
                </Button>

            </Card.Body>

        </Card>

        {activeTab === "ACCESS_MATRIX" && <PermissionMatrix />}

        {/* ===================================================== */}
        {/* Master Table */}
        {/* ===================================================== */}
        {activeTab !== "ACCESS_MATRIX" && (
        <Card className="shadow-sm border-0">

            <Card.Body className="p-0">

                <div className="table-responsive">

                    <Table

                        hover

                        striped

                        className="mb-0"

                    >

                        <thead className="table-dark">

                            <tr>

                                {

                                    activeTab==="USER"

                                    &&

                                    <>

                                        <th>

                                            Employee

                                        </th>

                                        <th>

                                            Username

                                        </th>

                                        <th>

                                            Role

                                        </th>

                                        <th>

                                            Department

                                        </th>

                                        <th>

                                            Access

                                        </th>

                                        <th>

                                            Status

                                        </th>

                                    </>

                                }

                                {

                                    activeTab==="ROLE"

                                    &&

                                    <>

                                        <th>

                                            Role ID

                                        </th>

                                        <th>

                                            Role Name

                                        </th>

                                        <th>

                                            Status

                                        </th>

                                    </>

                                }

                                {

                                    activeTab==="PERMISSION"

                                    &&

                                    <>

                                        <th>

                                            Permission ID

                                        </th>

                                        <th>

                                            Permission

                                        </th>

                                        <th>

                                            Module

                                        </th>

                                    </>

                                }

                                {

                                    activeTab==="ROLE_PERMISSION"

                                    &&

                                    <>

                                        <th>

                                            Role

                                        </th>

                                        <th>

                                            Permission

                                        </th>

                                        <th>

                                            Granted

                                        </th>

                                    </>

                                }

                                <th>

                                    Action

                                </th>

                            </tr>

                        </thead>

                        <tbody>
                                                    {

                            loading ?

                            (

                                <tr>

                                    <td

                                        colSpan="10"

                                        className="text-center py-5"

                                    >

                                        <Spinner

                                            animation="border"

                                        />

                                    </td>

                                </tr>

                            )

                            :

                            filteredRecords.length === 0 ?

                            (

                                <tr>

                                    <td

                                        colSpan="10"

                                        className="text-center"

                                    >

                                        No Records Found

                                    </td>

                                </tr>

                            )

                            :

                            filteredRecords.map((item,index)=>(

                                <tr

                                    key={

                                        item.user_id ||

                                        item.role_id ||

                                        item.permission_id ||

                                        index

                                    }

                                >

                                    {

                                        activeTab==="USER"

                                        &&

                                        <>

                                            <td>

                                                {item.employee_code}

                                            </td>

                                            <td>

                                                {item.username}

                                            </td>

                                            <td>

                                                {

                                                    item.role_name ||

                                                    item.role_id

                                                }

                                            </td>

                                            <td>

                                                {item.department}

                                            </td>

                                            <td>

                                                {

                                                    item.access_level

                                                }

                                            </td>

                                            <td>

                                                <Badge

                                                    bg={

                                                        item.status==="ACTIVE"

                                                        ?

                                                        "success"

                                                        :

                                                        "secondary"

                                                    }

                                                >

                                                    {item.status}

                                                </Badge>

                                            </td>

                                        </>

                                    }

                                    {

                                        activeTab==="ROLE"

                                        &&

                                        <>

                                            <td>

                                                {item.role_id}

                                            </td>

                                            <td>

                                                {item.role_name}

                                            </td>

                                            <td>

                                                <Badge

                                                    bg={

                                                        item.status==="ACTIVE"

                                                        ?

                                                        "success"

                                                        :

                                                        "secondary"

                                                    }

                                                >

                                                    {item.status}

                                                </Badge>

                                            </td>

                                        </>

                                    }

          {
    activeTab === "PERMISSION" &&
    <>
        <td>{item.permission_id}</td>

        <td>{item.permission_code}</td>

        <td>{item.module_name}</td>
    </>
}

                                    {

                                        activeTab==="ROLE_PERMISSION"

                                        &&

                                        <>

                                            <td>

                                                {

                                                    item.role_name ||

                                                    item.role_id

                                                }

                                            </td>

                                            <td>

                                                {

                                                    item.permission_name ||

                                                    item.permission_id

                                                }

                                            </td>

                                            <td>

                                                <Badge

                                                    bg={

                                                        item.granted

                                                        ?

                                                        "success"

                                                        :

                                                        "danger"

                                                    }

                                                >

                                                    {

                                                        item.granted

                                                        ?

                                                        "Granted"

                                                        :

                                                        "Not Granted"

                                                    }

                                                </Badge>

                                            </td>

                                        </>

                                    }

                                    <td>

                                        <Button

                                            size="sm"

                                            variant="outline-primary"

                                            onClick={()=>

                                                editRecord(item)

                                            }

                                        >

                                            <PencilSquare />

                                        </Button>

                                    </td>

                                </tr>

                            ))

                        }

                        </tbody>

                    </Table>

                </div>

            </Card.Body>

        </Card>

        )}

        {/* ===================================================== */}
        {/* Add / Edit Modal */}
        {/* ===================================================== */}
                <Modal
            show={showForm}
            onHide={() => {

                resetForm();

                setShowForm(false);

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

                            `Update ${activeTab.replace("_"," ")}`

                            :

                            `Add ${activeTab.replace("_"," ")}`

                    }

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <Form>

                    {

                        activeTab === "USER"

                        &&

                        <>

                            <Row>

                                <Col md={6}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Employee Code

                                        </Form.Label>

                                        <Form.Control

                                            name="employee_code"

                                            value={formData.employee_code}

                                            onChange={handleChange}

                                        />

                                    </Form.Group>

                                </Col>

                                <Col md={6}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Username

                                        </Form.Label>

                                        <Form.Control

                                            name="username"

                                            value={formData.username}

                                            onChange={handleChange}

                                        />

                                    </Form.Group>

                                </Col>

                            </Row>

                            <Row>

                                <Col md={6}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Role ID

                                        </Form.Label>
<Form.Select
    name="role_id"
    value={formData.role_id}
    onChange={handleChange}
>
    <option value="">Select Role</option>

    {roles.map(role => (
        <option
            key={role.role_id}
            value={role.role_id}
        >
            {role.role_name}
        </option>
    ))}
</Form.Select>

                                    </Form.Group>

                                </Col>

                                <Col md={6}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Mobile Number

                                        </Form.Label>

                                        <Form.Control

                                            name="mobile_number"

                                            value={formData.mobile_number}

                                            onChange={handleChange}

                                        />

                                    </Form.Group>

                                </Col>

                            </Row>

                            <Row>

                                <Col md={6}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Email

                                        </Form.Label>

                                        <Form.Control

                                            type="email"

                                            name="email_id"

                                            value={formData.email_id}

                                            onChange={handleChange}

                                        />

                                    </Form.Group>

                                </Col>

                                <Col md={6}>

                                    {

                                        !editId &&

                                        <Form.Group className="mb-3">

                                            <Form.Label>

                                                Password

                                            </Form.Label>

                                            <Form.Control

                                                type="password"

                                                name="password"

                                                value={formData.password}

                                                onChange={handleChange}

                                            />

                                        </Form.Group>

                                    }

                                </Col>

                            </Row>

                            <Row>

                                <Col md={6}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Access Level

                                        </Form.Label>

                               <Form.Group className="mb-3">
    

    <Form.Select
        name="access_level"
        value={formData.access_level}
        onChange={handleChange}
    >
        <option value="USER">USER</option>
        <option value="SUPERVISOR">SUPERVISOR</option>
        <option value="MANAGER">MANAGER</option>
        <option value="ADMIN">ADMIN</option>
    </Form.Select>
</Form.Group>

                                    </Form.Group>

                                </Col>

                                <Col md={6}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Department

                                        </Form.Label>

                                        <Form.Control

                                            name="department"

                                            value={formData.department}

                                            onChange={handleChange}

                                        />

                                    </Form.Group>

                                </Col>

                            </Row>

                            <Row>

                                <Col md={4}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Shift

                                        </Form.Label>
<Form.Select
    name="shift_assignment"
    value={formData.shift_assignment}
    onChange={handleChange}
>
    <option value="">Select Shift</option>

    {shifts.map(shift => (
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

                                <Col md={4}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Line

                                        </Form.Label>

                  <Form.Select
    name="line_assigned"
    value={formData.line_assigned}
    onChange={handleChange}
>
    <option value="">Select Line</option>

    {lines.map(line => (
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

                                <Col md={4}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Machine

                                        </Form.Label>

                              
<Form.Select
    name="machines_assigned"
    value={formData.machines_assigned}
    onChange={handleChange}
>
    <option value="">Select Machine</option>

    {machines.map(machine => (
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

                            </Row>

                        </>

                    }

                    {

                        activeTab === "ROLE"

                        &&

                        <>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Role Name

                                </Form.Label>

                                <Form.Control

                                    name="role_name"

                                    value={formData.role_name}

                                    onChange={handleChange}

                                />

                            </Form.Group>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Description

                                </Form.Label>

                                <Form.Control

                                    as="textarea"

                                    rows={3}

                                    name="description"

                                    value={formData.description}

                                    onChange={handleChange}

                                />

                            </Form.Group>

                        </>

                    }

                    {

                        activeTab === "PERMISSION"

                        &&

                        <>
                        <Form.Group className="mb-3">
    <Form.Label>
        Permission Code
    </Form.Label>

    <Form.Control
        name="permission_code"
        value={formData.permission_code}
        onChange={handleChange}
    />
</Form.Group>

                            

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Module Name

                                </Form.Label>

                                <Form.Control

                                    name="module_name"

                                    value={formData.module_name}

                                    onChange={handleChange}

                                />

                            </Form.Group>
                            <Form.Group className="mb-3">
    <Form.Label>Action</Form.Label>

    <Form.Select
        name="action"
        value={formData.action}
        onChange={handleChange}
    >
        <option value="">Select Action</option>
        <option value="CREATE">CREATE</option>
        <option value="READ">READ</option>
        <option value="UPDATE">UPDATE</option>
        <option value="DELETE">DELETE</option>
    </Form.Select>
</Form.Group>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Description

                                </Form.Label>

                                <Form.Control

                                    as="textarea"

                                    rows={3}

                                    name="description"

                                    value={formData.description}

                                    onChange={handleChange}

                                />

                            </Form.Group>

                        </>

                    }

                    {

                        activeTab === "ROLE_PERMISSION"

                        &&

                        <>

                            <Row>

                                <Col md={6}>

                                    <Form.Group className="mb-3">

                                        <Form.Label>

                                            Role ID

                                        </Form.Label>


    <Form.Select
        name="role_id"
        value={formData.role_id}
        onChange={handleChange}
    >
        <option value="">Select Role</option>

        {roles.map(role => (
            <option
                key={role.role_id}
                value={role.role_id}
            >
                {role.role_name}
            </option>
        ))}
    </Form.Select>
</Form.Group>

                                  

                                </Col>

                                <Col md={6}>

<Form.Group className="mb-3">
    <Form.Label>Permission</Form.Label>

    <Form.Select
        name="permission_id"
        value={formData.permission_id}
        onChange={handleChange}
    >
        <option value="">Select Permission</option>

        {permissions.map(permission => (
            <option
                key={permission.permission_id}
                value={permission.permission_id}
            >
                {permission.permission_code}
            </option>
        ))}
    </Form.Select>
</Form.Group>

                                </Col>

                            </Row>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Granted

                                </Form.Label>

                                <Form.Select

                                    value={formData.granted}

                                    onChange={(e)=>

                                        setFormData({

                                            ...formData,

                                            granted:

                                                e.target.value==="true"

                                        })

                                    }

                                >

                                    <option value="true">

                                        Granted

                                    </option>

                                    <option value="false">

                                        Not Granted

                                    </option>

                                </Form.Select>

                            </Form.Group>

                        </>

                    }

                    <Form.Group>

                        <Form.Label>

                            Status

                        </Form.Label>

                        <Form.Select

                            name="status"

                            value={formData.status}

                            onChange={handleChange}

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

                        resetForm();

                        setShowForm(false);

                    }}

                >

                    Cancel

                </Button>

                <Button

                    variant="primary"

                    disabled={saving}

                    onClick={saveRecord}

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

                    User Role Configuration

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <div className="d-flex justify-content-end mb-3">

                    <Button
                        variant="success"
                        onClick={newConfiguration}
                    >

                        <Plus />

                        {" "}

                        New Configuration

                    </Button>

                </div>

                <div className="table-responsive">

                    <Table
                        hover
                        striped
                        bordered
                    >

                        <thead className="table-dark">

                            <tr>

                                <th>

                                    Type

                                </th>

                                <th>

                                    Name

                                </th>

                                <th>

                                    Module

                                </th>

                                <th>

                                    Status

                                </th>

                                <th>

                                    Action

                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                configList.length===0 ?

                                (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            className="text-center"
                                        >

                                            No Configuration Found

                                        </td>

                                    </tr>

                                )

                                :

                                configList.map((item,index)=>(

                                    <tr key={index}>

                                        <td>

                                            {

                                                item.type

                                            }

                                        </td>

                                        <td>

                                            {

                                                item.role_name ||

                                                item.permission_name ||

                                                item.username ||

                                                "-"

                                            }

                                        </td>

                                        <td>

                                            {

                                                item.module_name ||

                                                "-"

                                            }

                                        </td>

                                        <td>

                                            <Badge

                                                bg={

                                                    item.status==="ACTIVE"

                                                    ?

                                                    "success"

                                                    :

                                                    "secondary"

                                                }

                                            >

                                                {

                                                    item.status

                                                }

                                            </Badge>

                                        </td>

                                        <td>

                                            <Button

                                                size="sm"

                                                variant="outline-primary"

                                                onClick={()=>

                                                    editConfiguration(item)

                                                }

                                            >

                                                Open

                                            </Button>

                                        </td>

                                    </tr>

                                ))

                            }

                        </tbody>

                    </Table>

                </div>

            </Modal.Body>

        </Modal>

        {/* ===================================================== */}
        {/* Configuration Form */}
        {/* ===================================================== */}

        <Modal

            show={showConfigForm}

            onHide={()=>

                setShowConfigForm(false)

            }

            size="lg"

            centered

        >

            <Modal.Header closeButton>

                <Modal.Title>

                    Configuration

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <Form>

                    <Row>

                        <Col md={6}>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Type

                                </Form.Label>

                                <Form.Control

                                    name="type"

                                    value={configForm.type || ""}

                                    onChange={handleConfigChange}

                                />

                            </Form.Group>

                        </Col>

                        <Col md={6}>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Status

                                </Form.Label>

                                <Form.Select

                                    name="status"

                                    value={

                                        configForm.status ||

                                        "ACTIVE"

                                    }

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

                        </Col>

                    </Row>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Role Name

                        </Form.Label>

                        <Form.Control

                            name="role_name"

                            value={

                                configForm.role_name ||

                                ""

                            }

                            onChange={handleConfigChange}

                        />

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Permission Name

                        </Form.Label>

                        <Form.Control

                            name="permission_name"

                            value={

                                configForm.permission_name ||

                                ""

                            }

                            onChange={handleConfigChange}

                        />

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Label>

                            Module Name

                        </Form.Label>

                        <Form.Control

                            name="module_name"

                            value={

                                configForm.module_name ||

                                ""

                            }

                            onChange={handleConfigChange}

                        />

                    </Form.Group>

                    <Form.Group>

                        <Form.Label>

                            Description

                        </Form.Label>

                        <Form.Control

                            as="textarea"

                            rows={3}

                            name="description"

                            value={

                                configForm.description ||

                                ""

                            }

                            onChange={handleConfigChange}

                        />

                    </Form.Group>

                </Form>

            </Modal.Body>

            <Modal.Footer>

                <Button

                    variant="secondary"

                    onClick={()=>

                        setShowConfigForm(false)

                    }

                >

                    Cancel

                </Button>

                <Button

                    variant="success"

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
                {/* ===================================================== */}
        {/* Runtime Modal */}
        {/* ===================================================== */}

        <Modal

            show={showRuntime}

            onHide={() =>

                setShowRuntime(false)

            }

            size="xl"

            centered

        >

            <Modal.Header closeButton>

                <Modal.Title>

                    Runtime History

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <div className="table-responsive">

                    <Table

                        hover

                        striped

                        bordered

                    >

                        <thead className="table-dark">

                            <tr>

                                <th>User</th>

                                <th>Action</th>

                                <th>Module</th>

                                <th>Date & Time</th>

                                <th>Status</th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                runtime.length===0 ?

                                (

                                    <tr>

                                        <td

                                            colSpan="5"

                                            className="text-center"

                                        >

                                            No Runtime History

                                        </td>

                                    </tr>

                                )

                                :

                                runtime.map((item,index)=>(

                                    <tr key={index}>

                                        <td>

                                            {

                                                item.user_name ||

                                                "-"

                                            }

                                        </td>

                                        <td>

                                            {

                                                item.action ||

                                                "-"

                                            }

                                        </td>

                                        <td>

                                            {

                                                item.module ||

                                                "-"

                                            }

                                        </td>

                                        <td>

                                            {

                                                item.created_at ||

                                                "-"

                                            }

                                        </td>

                                        <td>

                                            <Badge

                                                bg={

                                                    item.status==="SUCCESS"

                                                    ?

                                                    "success"

                                                    :

                                                    item.status==="FAILED"

                                                    ?

                                                    "danger"

                                                    :

                                                    "secondary"

                                                }

                                            >

                                                {

                                                    item.status ||

                                                    "N/A"

                                                }

                                            </Badge>

                                        </td>

                                    </tr>

                                ))

                            }

                        </tbody>

                    </Table>

                </div>

            </Modal.Body>

            <Modal.Footer>

                <Button

                    variant="secondary"

                    onClick={()=>

                        setShowRuntime(false)

                    }

                >

                    Close

                </Button>

            </Modal.Footer>

        </Modal>

        {/* ===================================================== */}
        {/* Report Modal */}
        {/* ===================================================== */}

        <Modal

            show={showReport}

            onHide={()=>

                setShowReport(false)

            }

            size="xl"

            centered

        >

            <Modal.Header closeButton>

                <Modal.Title>

                    User Role Permission Report

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <div className="table-responsive">

                    <Table

                        hover

                        striped

                        bordered

                    >

                        <thead className="table-dark">

                            <tr>

                                {

                                    report.length>0

                                    ?

                                    Object.keys(report[0]).map((key)=>(

                                        <th key={key}>

                                            {key}

                                        </th>

                                    ))

                                    :

                                    <th>

                                        Report

                                    </th>

                                }

                            </tr>

                        </thead>

                        <tbody>

                            {

                                report.length===0 ?

                                (

                                    <tr>

                                        <td

                                            className="text-center"

                                        >

                                            No Report Data

                                        </td>

                                    </tr>

                                )

                                :

                                report.map((item,index)=>(

                                    <tr key={index}>

                                        {

                                            Object.values(item).map((value,i)=>(

                                                <td key={i}>

                                                    {

                                                        value===null

                                                        ?

                                                        "-"

                                                        :

                                                        String(value)

                                                    }

                                                </td>

                                            ))

                                        }

                                    </tr>

                                ))

                            }

                        </tbody>

                    </Table>

                </div>

            </Modal.Body>

            <Modal.Footer>

                <Button

                    variant="secondary"

                    onClick={()=>

                        setShowReport(false)

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

export default UserRolePermission;