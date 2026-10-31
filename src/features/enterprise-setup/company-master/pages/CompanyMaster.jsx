import Table from '../../../../shared/components/SmartTable.jsx';

// src/pages/CompanyMaster/CompanyMaster.jsx

import React, {
    useState,
    useEffect
} from "react";

import {
    Card,
    Button,
    Modal,
    Form,
    Row,
    Col,
    Toast,
    Spinner,
    InputGroup,
    FormControl,
    Badge
} from "react-bootstrap";

import {
    Plus,
    PencilSquare,
    PlayFill,
    ClockHistory,
    FileText,
    Download,
    Search,
    X
} from "react-bootstrap-icons";
import SearchToolbar from "../../../../shared/components/SearchToolbar.jsx";

import companyService from "../api/company.service.js";

import "./CompanyMaster.css";
import DataTable from "../../../../shared/components/DataTable.jsx";

import StatusBadge from "../../../../shared/components/StatusBadge.jsx";

import ActionButtons from "../../../../shared/components/ActionButtons.jsx";

function CompanyMaster() {

    // ==================================================
    // DATA
    // ==================================================
const [statusFilter, setStatusFilter] = useState("ALL");
    const [companies, setCompanies] = useState([]);

    const [runtimeData, setRuntimeData] = useState([]);

    const [reportData, setReportData] = useState([]);

    const [config, setConfig] = useState({});
const [currentPage,setCurrentPage]=useState(1);

const [pageSize,setPageSize]=useState(10);
    // ==================================================
    // LOADING
    // ==================================================

    const [loading, setLoading] = useState(false);

    const [saving, setSaving] = useState(false);

    // ==================================================
    // SEARCH
    // ==================================================

    const [searchText, setSearchText] = useState("");

    // ==================================================
    // MODALS
    // ==================================================

    const [showForm, setShowForm] = useState(false);

    const [showRuntime, setShowRuntime] = useState(false);

    const [showReport, setShowReport] = useState(false);

    // ==================================================
    // EDIT
    // ==================================================

    const [editId, setEditId] = useState(null);

    // ==================================================
    // TOAST
    // ==================================================

    const [toast, setToast] = useState({

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

    // ==================================================
    // FORM
    // ==================================================

    const emptyForm = {

        company_code: "",

        company_name: "",

        timezone: "Asia/Kolkata",

        status: "ACTIVE"

    };

    const [formData, setFormData] = useState(emptyForm);

    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        loadConfig();

        loadCompanies();

    }, []);

    // ==================================================
    // CONFIG
    // ==================================================

    const loadConfig = async () => {

        try {

           const res = await companyService.getConfig();

            setConfig(

                res.data.data || {}

            );

        }

        catch (error) {

            console.error(error);

        }

    };

    // ==================================================
    // MASTER
    // ==================================================

    const loadCompanies = async () => {

        try {

            setLoading(true);

            const res = await companyService.getMaster();

            setCompanies(

                res.data.data || []

            );

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load Company Master",

                "danger"

            );

        }

        finally {

            setLoading(false);

        }

    };

    // ==================================================
    // CHANGE
    // ==================================================

    const handleChange = (event) => {

        const {

            name,

            value

        } = event.target;

        setFormData((previous) => ({

            ...previous,

            [name]: value

        }));

    };

    // ==================================================
    // RESET
    // ==================================================

    const resetForm = () => {

        setEditId(null);

        setFormData(emptyForm);

    };

    // ==================================================
    // ADD
    // ==================================================

    const openAddModal = () => {

        resetForm();

        setShowForm(true);

    };

    // ==================================================
    // EDIT
    // ==================================================

    const openEditModal = (company) => {

        setEditId(

            company.company_id

        );

        setFormData({

            company_code: company.company_code,

            company_name: company.company_name,

            timezone: company.timezone,

            status: company.status

        });

        setShowForm(true);

    };

    // ==================================================
    // SAVE
    // ==================================================

    const saveCompany = async () => {

        try {

            setSaving(true);

            if (

                formData.company_code.trim() === "" ||

                formData.company_name.trim() === ""

            ) {

                showToast(

                    "Company Code and Company Name are required.",

                    "danger"

                );

                return;

            }

            if (editId) {

               await companyService.update(

    editId,

    formData

);

                showToast(

                    "Company updated successfully."

                );

            }

            else {

            await companyService.create(formData);

                showToast(

                    "Company created successfully."

                );

            }

            setShowForm(false);

            resetForm();

            loadCompanies();

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to save company.",

                "danger"

            );

        }

        finally {

            setSaving(false);

        }

    };

    // ==================================================
    // PART 2 STARTS HERE
    // ==================================================
        // ==================================================
    // RUNTIME
    // ==================================================

    const loadRuntime = async () => {

        try {

            setLoading(true);

            const res = await companyService.getRuntime();

            setRuntimeData(

                res.data.data || []

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

    // ==================================================
    // EXECUTE
    // ==================================================

    const executeCompany = async () => {

        try {

            const res =await companyService.execute();

            showToast(

                res.data.message ||

                "Execution completed."

            );

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Execution failed.",

                "danger"

            );

        }

    };

    // ==================================================
    // REPORT
    // ==================================================

    const loadReport = async () => {

        try {

            setLoading(true);

            const res = await companyService.getReport();

            setReportData(

                res.data.data || []

            );

            setShowReport(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to generate report.",

                "danger"

            );

        }

        finally {

            setLoading(false);

        }

    };

    // ==================================================
    // EXPORT
    // ==================================================

    const exportCompany = async () => {

        try {

            const res = await companyService.export();
            const blob = new Blob(

                [

                    res.data

                ],

                {

                    type: "text/csv"

                }

            );

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download = "Company_Master.csv";

            link.click();

            window.URL.revokeObjectURL(url);

            showToast(

                "CSV exported successfully."

            );

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Export failed.",

                "danger"

            );

        }

    };

    // ==================================================
    // FILTER
    // ==================================================

   const filteredCompanies = companies.filter((company) => {

    const searchMatch =

        company.company_code

            ?.toLowerCase()

            .includes(

                searchText.toLowerCase()

            )

        ||

        company.company_name

            ?.toLowerCase()

            .includes(

                searchText.toLowerCase()

            );

    const statusMatch =

        statusFilter==="ALL"

        ||

        company.status===statusFilter;

    return searchMatch && statusMatch;

});

const totalPages=Math.ceil(

    filteredCompanies.length/

    pageSize

);

const pageData=

filteredCompanies.slice(

(currentPage-1)*pageSize,

currentPage*pageSize

);
    // ==================================================
    // JSX
    // ==================================================
const columns=[

{

key:"company_code",

label:"Company Code"

},

{

key:"company_name",

label:"Company Name"

},

{

key:"timezone",

label:"Time Zone"

},

{

key:"status",

label:"Status",

render:(row)=>(

<StatusBadge

status={row.status}

/>

)

}

];
    return (

        <>

<div className="company-master container-fluid">

            {/* ========================================= */}

            {/* Toast */}

            {/* ========================================= */}

            <Toast

                show={toast.show}

                onClose={hideToast}

                delay={3000}

                autohide

                bg={toast.variant}

                className="position-fixed top-0 end-0 m-3"

                style={{

                    zIndex: 9999

                }}

            >

                <Toast.Body className="text-white">

                    {toast.message}

                </Toast.Body>

            </Toast>

            {/* ========================================= */}

            {/* Page Header */}

            {/* ========================================= */}

            <Card className="shadow-sm border-0 mb-4">

                <Card.Body>

                    <Row className="align-items-center">

                        <Col>

                            <h3 className="mb-1">

                                Company Master

                            </h3>

                            <small className="text-muted">

                                Enterprise Setup /

                                Company Master

                            </small>

                        </Col>

                        <Col

                            xs="auto"

                        >

                            <Button

                                variant="primary"

                                onClick={

                                    openAddModal

                                }

                            >

                                <Plus />

                                {" "}

                                Add Company

                            </Button>

                        </Col>

                    </Row>

                </Card.Body>

            </Card>

            {/* ========================================= */}

            {/* Toolbar */}

            {/* ========================================= */}
<SearchToolbar

    searchText={searchText}

    onSearch={setSearchText}

    status={statusFilter}

    onStatusChange={setStatusFilter}

    onRefresh={loadCompanies}

     showExecute={false}
    showRuntime={false}


    onReport={loadReport}

    onExport={exportCompany}

/>
           
                        {/* ========================================= */}
            {/* Company Table */}
            {/* ========================================= */}

           <DataTable

columns={columns}

data={filteredCompanies}

loading={loading}

emptyMessage="No Company Found"

renderActions={(company)=>(

<ActionButtons

onEdit={()=>openEditModal(company)}
showDelete={false}

onExecute={false}

onRuntime={false}


onReport={loadReport}

onExport={exportCompany}

/>

)}

/>




            {/* ========================================= */}
            {/* Add / Edit Company Modal */}
            {/* ========================================= */}
                        {/* ========================================= */}
            {/* Add / Edit Company Modal */}
            {/* ========================================= */}

            <Modal

                show={showForm}

                onHide={() => {

                    resetForm();

                    setShowForm(false);

                }}

                centered

                backdrop="static"

                size="lg"

            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {

                            editId

                                ? "Update Company"

                                : "Create Company"

                        }

                    </Modal.Title>

                </Modal.Header>

                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Company Code

                                    </Form.Label>

                                    <Form.Control

                                        type="text"

                                        name="company_code"

                                        value={formData.company_code}

                                        onChange={handleChange}

                                        placeholder="Enter Company Code"

                                    />

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Company Name

                                    </Form.Label>

                                    <Form.Control

                                        type="text"

                                        name="company_name"

                                        value={formData.company_name}

                                        onChange={handleChange}

                                        placeholder="Enter Company Name"

                                    />

                                </Form.Group>

                            </Col>

                        </Row>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Time Zone

                                    </Form.Label>

                                    <Form.Select

                                        name="timezone"

                                        value={formData.timezone}

                                        onChange={handleChange}

                                    >

                                        <option value="Asia/Kolkata">

                                            Asia/Kolkata

                                        </option>

                                        <option value="UTC">

                                            UTC

                                        </option>

                                        <option value="America/New_York">

                                            America/New_York

                                        </option>

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

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

                            </Col>

                        </Row>

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

                        onClick={saveCompany}

                    >

                        {

                            saving

                                ?

                                <>

                                    <Spinner

                                        size="sm"

                                        animation="border"

                                        className="me-2"

                                    />

                                    Saving...

                                </>

                                :

                                editId

                                    ?

                                    "Update Company"

                                    :

                                    "Save Company"

                        }

                    </Button>

                </Modal.Footer>

            </Modal>

            {/* ========================================= */}
            {/* Runtime Modal Starts */}
            {/* ========================================= */}
                        {/* ========================================= */}
            {/* Runtime Modal */}
            {/* ========================================= */}

            <Modal

                show={showRuntime}

                onHide={() => setShowRuntime(false)}

                centered

                size="xl"

            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Company Runtime History

                    </Modal.Title>

                </Modal.Header>

                <Modal.Body>

                    <div className="table-responsive">

                        <Table

                            striped

                            hover

                            bordered

                        >

                            <thead className="table-dark">

                                <tr>

                                    <th>User</th>

                                    <th>Action</th>

                                    <th>Date & Time</th>

                                </tr>

                            </thead>

                            <tbody>

                                {

                                    runtimeData.length === 0

                                    ?

                                    (

                                        <tr>

                                            <td

                                                colSpan="3"

                                                className="text-center"

                                            >

                                                No Runtime History Found

                                            </td>

                                        </tr>

                                    )

                                    :

                                    runtimeData.map(

                                        (

                                            item,

                                            index

                                        ) => (

                                            <tr

                                                key={index}

                                            >

                                                <td>

                                                    {

                                                        item.user_name

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        item.action

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        item.created_at

                                                    }

                                                </td>

                                            </tr>

                                        )

                                    )

                                }

                            </tbody>

                        </Table>

                    </div>

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

            {/* ========================================= */}
            {/* Report Modal */}
            {/* ========================================= */}

            <Modal

                show={showReport}

                onHide={() => setShowReport(false)}

                centered

                size="xl"

            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Company Report

                    </Modal.Title>

                </Modal.Header>

                <Modal.Body>

                    <div className="table-responsive">

                        <Table

                            striped

                            hover

                            bordered

                        >

                            <thead className="table-dark">

                                <tr>

                                    <th>

                                        Company Code

                                    </th>

                                    <th>

                                        Company Name

                                    </th>

                                    <th>

                                        Time Zone

                                    </th>

                                    <th>

                                        Status

                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {

                                    reportData.length === 0

                                    ?

                                    (

                                        <tr>

                                            <td

                                                colSpan="4"

                                                className="text-center"

                                            >

                                                No Report Data

                                            </td>

                                        </tr>

                                    )

                                    :

                                    reportData.map(

                                        (

                                            item

                                        ) => (

                                            <tr

                                                key={

                                                    item.company_id

                                                }

                                            >

                                                <td>

                                                    {

                                                        item.company_code

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        item.company_name

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        item.timezone

                                                    }

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

                                                        {

                                                            item.status

                                                        }

                                                    </Badge>

                                                </td>

                                            </tr>

                                        )

                                    )

                                }

                            </tbody>

                        </Table>

                    </div>

                </Modal.Body>

                <Modal.Footer>

                    <Button

                        variant="secondary"

                        onClick={() =>

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

export default CompanyMaster;