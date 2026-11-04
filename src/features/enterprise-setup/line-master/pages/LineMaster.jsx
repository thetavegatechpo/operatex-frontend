import "../../EnterpriseSetupClean.css";
import { getWorkspaceContext,getSelectedLocation } from "../../company-master/api/workspaceContext.js";

import Table from '../../../../shared/components/SmartTable.jsx';
import React, {

    useEffect,

    useState

} from "react";
import { useNavigate } from "react-router-dom";
import lineService from "../api/line.service.js";
import plantShopService from "../../plant-shop-master/api/plantshop.service.js";
import {

    Card,

    Button,

    Row,

    Col,

    Modal,

    Form,

    Spinner,

    Toast,

    InputGroup,

    FormControl,

    Badge

} from "react-bootstrap";

import {

    Plus,
         GeoAlt,

    PencilSquare,

    PlayFill,

    ClockHistory,

    FileText,

    Download,

    Search

} from "react-bootstrap-icons";

import "./LineMaster.css";


function LineMaster() {
    const [workspaceDefault,setWorkspaceDefault]=useState(null);
    useEffect(()=>{let alive=true;getWorkspaceContext().then(ctx=>{if(alive)setWorkspaceDefault(getSelectedLocation(ctx) || ctx.locations?.find(x=>x.shop_id)||null);}).catch(console.error);return()=>{alive=false;};},[]);


    // =====================================================
    // Master Data
    // =====================================================

    const [lines, setLines] = useState([]);

    const [config, setConfig] = useState({});

    const [runtime, setRuntime] = useState([]);

    const [report, setReport] = useState([]);
const [plants, setPlants] = useState([]);
const [shops, setShops] = useState([]);
    // =====================================================
    // Search
    // =====================================================
const navigate = useNavigate();
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

    const [showRuntime, setShowRuntime] = useState(false);

    const [showReport, setShowReport] = useState(false);
const [showConfig, setShowConfig] = useState(false);

const [configForm, setConfigForm] = useState({

    line_id: "",

    line_code: "",

    line_name: "",

    line_type: "",

    process_type: "",

    target_output: "",

   

    station_id: "",

    station_no: "",

    station_name: "",

    station_type: "",

    layout_id: "",

    layout_name: "",

    layout_version: "",

    layout_type: "",

    is_default: ""

});
    // =====================================================
    // Edit
    // =====================================================

    const [editId, setEditId] = useState(null);

    // =====================================================
    // Form
    // =====================================================

    const [formData, setFormData] = useState({

        plant_id: "",

        shop_id: "",

        line_code: "",

        line_name: "",

        line_type: "ASSEMBLY",

        process_type: "MANUAL",

        target_output: "",

     

        remarks: "",

        status: "ACTIVE"

    });

    // =====================================================
    // Initial Load
    // =====================================================

    useEffect(() => {

            loadPlants();
    loadShops();


        loadLines();

    }, []);
        // =====================================================
    // Load Configuration
    // =====================================================

  const openConfig = async () => {

    try {

        const response = await lineService.getConfig();

        if (

            response.data.success &&

            response.data.data.lineConfig.length > 0

        ) {

            setConfigForm(

                response.data.data.lineConfig[0]

            );

        }

        setShowConfig(true);

    }

    catch (error) {

        showToast(

            "Unable to load configuration",

            "danger"

        );

    }

};
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
const saveConfig = async () => {

    try {

        await lineService.updateConfig(

            configForm

        );

        showToast(

            "Configuration Saved"

        );

        setShowConfig(false);

    }

    catch (error) {

        showToast(

            error.response?.data?.message ||

            "Unable to Save Configuration",

            "danger"

        );

    }

};
    // =====================================================
    // Load Master
    // =====================================================

    const loadLines = async () => {

        try {

            setLoading(true);

            const response = await lineService.getMaster();

            setLines(

                response.data.data || []

            );

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load Line Master",

                "danger"

            );

        }

        finally {

            setLoading(false);

        }

    };
    const loadPlants = async () => {
    try {
        const response = await plantShopService.getMaster();

        const uniquePlants = [
            ...new Map(
                response.data.data
                    .filter(x => x.plant_id)
                    .map(x => [x.plant_id, x])
            ).values()
        ];

        setPlants(uniquePlants);

    } catch (err) {
        console.log(err);
    }
};

const loadShops = async () => {
    try {
        const response = await plantShopService.getMaster();

        const shopList = response.data.data.filter(
            x => x.shop_id
        );

        setShops(shopList);

    } catch (err) {
        console.log(err);
    }
};

    // =====================================================
    // Handle Input Change
    // =====================================================

    const handleChange = (event) => {

        const {

            name,

            value

        } = event.target;

        setFormData({

            ...formData,

            [name]: value

        });

    };

    // =====================================================
    // Reset Form
    // =====================================================

    useEffect(()=>{if(!workspaceDefault)return;setFormData(old=>old.plant_id||old.shop_id?old:{...old,plant_id:workspaceDefault.plant_id||"",shop_id:workspaceDefault.shop_id||""});},[workspaceDefault]);
    const resetForm = () => {

        setEditId(null);

        setFormData({

            plant_id: workspaceDefault?.plant_id || "",

            shop_id: workspaceDefault?.shop_id || "",

            line_code: "",

            line_name: "",

            line_type: "ASSEMBLY",

            process_type: "MANUAL",

            target_output: "",

           

            remarks: "",

            status: "ACTIVE"

        });

    };

    // =====================================================
    // Open Add Form
    // =====================================================

    const openAddForm = () => {

        resetForm();

        setShowForm(true);

    };

    // =====================================================
    // Open Edit Form
    // =====================================================

    const openEditForm = (line) => {

        setEditId(

            line.line_id

        );

        setFormData({

            plant_id: line.plant_id,

            shop_id: line.shop_id,

            line_code: line.line_code,

            line_name: line.line_name,

            line_type: line.line_type,

            process_type: line.process_type,

            target_output: line.target_output,

          

            remarks: line.remarks,

            status: line.status

        });

        setShowForm(true);

    };

    // =====================================================
    // Search & Filter
    // =====================================================

    const filteredLines = lines.filter((line) => {

        const searchMatch =

            (

                line.line_code || ""

            )

                .toLowerCase()

                .includes(

                    searchText.toLowerCase()

                )

            ||

            (

                line.line_name || ""

            )

                .toLowerCase()

                .includes(

                    searchText.toLowerCase()

                );

        const statusMatch =

            String(line.status || "").toUpperCase() === "ACTIVE";

        return searchMatch && statusMatch;

    });
    // ADD HERE
const filteredShops = shops.filter(
    shop => shop.plant_id === formData.plant_id
);

    // =====================================================
    // Save Line
    // =====================================================

    const saveLine = async () => {

        try {

            setSaving(true);

            if (

                !formData.line_code.trim() ||

                !formData.line_name.trim()

            ) {

                showToast(

                    "Line Code and Line Name are required.",

                    "danger"

                );

                return;

            }

            if (editId) {

                const response = await lineService.updateMaster(

                    editId,

                    formData

                );

                showToast(

                    response.data.message ||

                    "Line Updated Successfully"

                );

            }

            else {

                const response = await lineService.createMaster(

                    formData

                );

                showToast(

                    response.data.message ||

                    "Line Created Successfully"

                );

            }

            setShowForm(false);

            resetForm();

            loadLines();

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to save Line",

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

            setLoading(true);

            const response = await lineService.getRuntime();

            setRuntime(

                response.data.data || []

            );

            setShowRuntime(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load Runtime",

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

    const executeLine = async () => {

        try {

            const response = await lineService.execute();

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

            setLoading(true);

            const response = await lineService.getReport();

            setReport(

                response.data.data || []

            );

            setShowReport(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load Report",

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

    const exportData = async () => {

        try {

            const response = await lineService.export();

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

                "LineMaster.csv";

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
    // JSX
    // =====================================================

    return (

        <>

<div className="line-master container-fluid">
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
                style={{ zIndex: 9999 }}
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

                                Line Master

                            </h3>

                            <small className="text-muted">

                                Enterprise Setup /

                                Line Master

                            </small>

                        </Col>

                       <Col xs="auto">

    <div className="d-flex gap-2">

        <Button
            variant="primary"
            onClick={openAddForm}
        >
            <Plus size={16} />
            {" "}
            Add Line
        </Button>

        <Button
            variant="success"
            onClick={() => navigate("/station-master")}
        >
             
            {" "}
            Station Master
        </Button>

    </div>

    {/* <Button
        variant="warning"
        className="ms-2"
        onClick={openConfig}
    >
        Config
    </Button> */}

</Col>

                    </Row>

                </Card.Body>

            </Card>
<Modal

    show={showConfig}

    onHide={() =>

        setShowConfig(false)

    }

    size="xl"

    centered

>

    <Modal.Header closeButton>

        <Modal.Title>

            Line Configuration

        </Modal.Title>

    </Modal.Header>

    <Modal.Body>

        <Row>

            <Col md={4}>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Line Code

                    </Form.Label>

                    <Form.Control

                        name="line_code"

                        value={configForm.line_code || ""}

                        onChange={handleConfigChange}

                    />

                </Form.Group>

            </Col>

            <Col md={4}>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Line Name

                    </Form.Label>

                    <Form.Control

                        name="line_name"

                        value={configForm.line_name || ""}

                        onChange={handleConfigChange}

                    />

                </Form.Group>

            </Col>

            <Col md={4}>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Line Type

                    </Form.Label>

                    <Form.Control

                        name="line_type"

                        value={configForm.line_type || ""}

                        onChange={handleConfigChange}

                    />

                </Form.Group>

            </Col>

        </Row>

        <Row>

            <Col md={4}>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Process Type

                    </Form.Label>

                    <Form.Control

                        name="process_type"

                        value={configForm.process_type || ""}

                        onChange={handleConfigChange}

                    />

                </Form.Group>

            </Col>

            <Col md={4}>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Target Output

                    </Form.Label>

                    <Form.Control

                        name="target_output"

                        value={configForm.target_output || ""}

                        onChange={handleConfigChange}

                    />

                </Form.Group>

            </Col>

            <Col md={4}>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Takt Time

                    </Form.Label>

         

                </Form.Group>

            </Col>

        </Row>

        <Row>

            <Col md={4}>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Station No

                    </Form.Label>

                    <Form.Control

                        name="station_no"

                        value={configForm.station_no || ""}

                        onChange={handleConfigChange}

                    />

                </Form.Group>

            </Col>

            <Col md={4}>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Station Name

                    </Form.Label>

                    <Form.Control

                        name="station_name"

                        value={configForm.station_name || ""}

                        onChange={handleConfigChange}

                    />

                </Form.Group>

            </Col>

            <Col md={4}>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Station Type

                    </Form.Label>

                    <Form.Control

                        name="station_type"

                        value={configForm.station_type || ""}

                        onChange={handleConfigChange}

                    />

                </Form.Group>

            </Col>

        </Row>

    </Modal.Body>

    <Modal.Footer>

        <Button

            variant="secondary"

            onClick={() =>

                setShowConfig(false)

            }

        >

            Cancel

        </Button>

        <Button

            variant="success"

            onClick={saveConfig}

        >

            Save Configuration

        </Button>

    </Modal.Footer>

</Modal>
            {/* ========================================= */}
            {/* Search Toolbar */}
            {/* ========================================= */}

            <Card className="shadow-sm border-0 mb-4">

                <Card.Body>

                    <Row className="g-3">

                        <Col md={5}>

                            <InputGroup>

                                <InputGroup.Text>

                                    <Search />

                                </InputGroup.Text>

                                <FormControl

                                    placeholder="Search Line..."

                                    value={searchText}

                                    onChange={(e)=>

                                        setSearchText(

                                            e.target.value

                                        )

                                    }

                                />

                            </InputGroup>

                        </Col>

                        

                        <Col

                            md={5}

                            className="text-md-end"

                        >

                            <Button

                                variant="outline-secondary"

                                className="me-2"

                                onClick={loadLines}

                            >

                                Refresh

                            </Button>

                            <Button

                                variant="outline-success"

                                className="me-2"

                                onClick={exportData}

                            >

                                <Download />

                            </Button>

                           

                        </Col>

                    </Row>

                </Card.Body>

            </Card>

            {/* ========================================= */}
            {/* Line Table */}
            {/* ========================================= */}

            <Card className="shadow-sm border-0">

                <Card.Body className="p-0">

                    <div className="table-responsive">

                        <Table

                            hover

                            striped

                            className="mb-0 align-middle"

                        >

                            <thead className="table-dark">

                                <tr>

                                    <th>Line Code</th>

                                    <th>Line Name</th>

                                    <th>Line Type</th>

                                    <th>Process Type</th>

                                    <th>Status</th>

                                    <th className="text-center">

                                        Actions

                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {

                                    loading ?

                                    (

                                        <tr>

                                            <td

                                                colSpan="6"

                                                className="text-center py-5"

                                            >

                                                <Spinner animation="border" />

                                            </td>

                                        </tr>

                                    )

                                    :

                                    filteredLines.length===0 ?

                                    (

                                        <tr>

                                            <td

                                                colSpan="6"

                                                className="text-center"

                                            >

                                                No Line Found

                                            </td>

                                        </tr>

                                    )

                                    :

                                    filteredLines.map((line)=>(

                                        <tr key={line.line_id}>

                                            <td>

                                                {line.line_code}

                                            </td>

                                            <td>

                                                {line.line_name}

                                            </td>

                                            <td>

                                                {line.line_type}

                                            </td>

                                            <td>

                                                {line.process_type}

                                            </td>

                                            <td>

                                                <Badge

                                                    bg={

                                                        line.status==="ACTIVE"

                                                        ?

                                                        "success"

                                                        :

                                                        "secondary"

                                                    }

                                                >

                                                    {line.status}

                                                </Badge>

                                            </td>

                                            <td className="text-center">

                                                <Button

                                                    size="sm"

                                                    variant="outline-primary"

                                                    className="me-2"

                                                    onClick={()=>

                                                        openEditForm(line)

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

            {/* ========================================= */}
            {/* Line Modal */}
            {/* ========================================= */}
                        {/* ========================================= */}
            {/* Add / Edit Line Modal */}
            {/* ========================================= */}

            <Modal

                show={showForm}

                onHide={() => {

                    resetForm();

                    setShowForm(false);

                }}

                centered

                size="lg"

                backdrop="static"

            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {

                            editId

                                ?

                                "Update Line"

                                :

                                "Create Line"

                        }

                    </Modal.Title>

                </Modal.Header>

                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Plant

                                    </Form.Label>

                                    <Form.Select

                                        name="plant_id"

                                        value={formData.plant_id}

                                        onChange={handleChange}
                                        disabled={editId !== null}

                                    >

                                        <option value="">

                                            Select Plant

                                        </option>

                                        {
plants.map((plant) => (
    <option
        key={plant.plant_id}
        value={plant.plant_id}
    >
        {plant.plant_name}
    </option>
))

                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Shop

                                    </Form.Label>

                                    <Form.Select

                                        name="shop_id"

                                        value={formData.shop_id}

                                        onChange={handleChange}
                                         disabled={editId !== null}

                                    >

                                        <option value="">

                                            Select Shop

                                        </option>

                                       {
    filteredShops.map((shop) => (
        <option
            key={shop.shop_id}
            value={shop.shop_id}
        >
            {shop.shop_name}
        </option>
    ))
}

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Line Code

                                    </Form.Label>

                                    <Form.Control

                                        type="text"

                                        name="line_code"

                                        value={formData.line_code}

                                        onChange={handleChange}
                                        disabled={editId !== null}

                                    />

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Line Name

                                    </Form.Label>

                                    <Form.Control

                                        type="text"

                                        name="line_name"

                                        value={formData.line_name}

                                        onChange={handleChange}

                                    />

                                </Form.Group>

                            </Col>

                        </Row>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Line Type

                                    </Form.Label>

                                    <Form.Select

                                        name="line_type"

                                        value={formData.line_type}

                                        onChange={handleChange}
                                        disabled={editId !== null}

                                    >

                                        <option value="ASSEMBLY">

                                            ASSEMBLY

                                        </option>

                                        <option value="PACKING">

                                            PACKING

                                        </option>

                                        <option value="INSPECTION">

                                            INSPECTION

                                        </option>

                                        <option value="TESTING">

                                            TESTING

                                        </option>

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Process Type

                                    </Form.Label>

                                    <Form.Select

                                        name="process_type"

                                        value={formData.process_type}

                                        onChange={handleChange}
                                        disabled={editId !== null}

                                    >

                                        <option value="MANUAL">

                                            MANUAL

                                        </option>

                                        <option value="SEMI_AUTO">

                                            SEMI AUTO

                                        </option>

                                        <option value="AUTOMATIC">

                                            AUTOMATIC

                                        </option>

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>

                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Target Output

                                    </Form.Label>

                                    <Form.Control

                                        type="number"

                                        name="target_output"

                                        value={formData.target_output}

                                        onChange={handleChange}

                                    />

                                </Form.Group>

                            </Col>

                    

                           

                        </Row>

                        <Row>

                            <Col md={8}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Remarks

                                    </Form.Label>

                                    <Form.Control

                                        as="textarea"

                                        rows={3}

                                        name="remarks"

                                        value={formData.remarks}

                                        onChange={handleChange}

                                    />

                                </Form.Group>

                            </Col>

                            <Col md={4}>

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

                        onClick={saveLine}

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

            {/* ========================================= */}
            {/* Runtime Modal */}
            {/* ========================================= */}
                        {/* ========================================= */}
            {/* Runtime History Modal */}
            {/* ========================================= */}

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

                        Line Runtime History

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

                                    <th>Line Code</th>

                                    <th>Line Name</th>

                                    <th>Date & Time</th>

                                    <th>Status</th>

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

                                                No Runtime History Available

                                            </td>

                                        </tr>

                                    )

                                    :

                                    runtime.map(

                                        (

                                            item,

                                            index

                                        ) => (

                                            <tr

                                                key={index}

                                            >

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

                                                        item.line_code ||

                                                        "-"

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        item.line_name ||

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

                                                            item.status ===

                                                            "SUCCESS"

                                                            ?

                                                            "success"

                                                            :

                                                            item.status ===

                                                            "FAILED"

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
                        {/* ========================================= */}
            {/* Report Modal */}
            {/* ========================================= */}

            <Modal

                show={showReport}

                onHide={() =>

                    setShowReport(false)

                }

                size="xl"

                centered

            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Line Master Report

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

                                    <th>

                                        Plant

                                    </th>

                                    <th>

                                        Shop

                                    </th>

                                    <th>

                                        Line Code

                                    </th>

                                    <th>

                                        Line Name

                                    </th>

                                    <th>

                                        Line Type

                                    </th>

                                    <th>

                                        Process Type

                                    </th>

                                    <th>

                                        Target

                                    </th>

                                    <th>

                                        Takt Time

                                    </th>

                                    <th>

                                        Cycle Time

                                    </th>

                                    <th>

                                        Status

                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {

                                    report.length === 0 ?

                                    (

                                        <tr>

                                            <td

                                                colSpan="10"

                                                className="text-center"

                                            >

                                                No Report Data Available

                                            </td>

                                        </tr>

                                    )

                                    :

                                    report.map(

                                        (

                                            line,

                                            index

                                        ) => (

                                            <tr

                                                key={index}

                                            >

                                                <td>

                                                    {

                                                        line.plant_name ||

                                                        "-"

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        line.shop_name ||

                                                        "-"

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        line.line_code

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        line.line_name

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        line.line_type

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        line.process_type

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        line.target_output

                                                    }

                                                </td>

                      

              

                                                <td>

                                                    <Badge

                                                        bg={

                                                            line.status ===

                                                            "ACTIVE"

                                                            ?

                                                            "success"

                                                            :

                                                            "secondary"

                                                        }

                                                    >

                                                        {

                                                            line.status

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

export default LineMaster;