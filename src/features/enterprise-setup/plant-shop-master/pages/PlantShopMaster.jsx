
import Table from '../../../../shared/components/SmartTable.jsx';
import React, {

    useEffect,

    useState

} from "react";
import StatusBadge from "../../../../shared/components/StatusBadge.jsx";

import plantShopService from "../api/plantshop.service.js";
import companyService from "../../company-master/api/company.service.js";
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

    PencilSquare,

    PlayFill,

    ClockHistory,

    FileText,

    Download,

    Search

} from "react-bootstrap-icons";

import "./PlantShopMaster.css";

function PlantShopMaster() {

    // =====================================================
    // Master Data
    // =====================================================

    const [masters, setMasters] = useState([]);

    const [runtime, setRuntime] = useState([]);

    const [report, setReport] = useState([]);

    const [config, setConfig] = useState({});
    const [companies, setCompanies] = useState([]);
const [plants, setPlants] = useState([]);
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

    const [toast, setToast] = useState({

        show:false,

        message:"",

        variant:"success"

    });

    const showToast=(message,variant="success")=>{

        setToast({

            show:true,

            message,

            variant

        });

    };

    const hideToast=()=>{

        setToast({

            show:false,

            message:"",

            variant:"success"

        });

    };

    // =====================================================
    // Modal
    // =====================================================

    const [showPlantModal,setShowPlantModal]=useState(false);

    const [showShopModal,setShowShopModal]=useState(false);

    const [showRuntime,setShowRuntime]=useState(false);

    const [showReport,setShowReport]=useState(false);

    // =====================================================
    // Edit
    // =====================================================

    const [editId,setEditId]=useState(null);

    const [editType,setEditType]=useState("");
const [showUpdateModal, setShowUpdateModal] = useState(false);

const [updateForm, setUpdateForm] = useState({
    type: "",
    company_id: "",
    plant_id: "",
    plant_code: "",
    plant_name: "",
    plant_type: "MANUFACTURING",
    timezone: "",
    state: "",
    city: "",
    address: "",
    shop_code: "",
    shop_name: "",
    status: "ACTIVE"
});
    // =====================================================
    // Plant Form
    // =====================================================

    const [plantForm,setPlantForm]=useState({

        company_id:"",

        plant_code:"",

        plant_name:"",
          plant_type:"MANUFACTURING",

        timezone:"",
    state:"",
    city:"",
    address:"",


        status:"ACTIVE"

    });

    // =====================================================
    // Shop Form
    // =====================================================

    const [shopForm,setShopForm]=useState({

        plant_id:"",

        shop_code:"",

        shop_name:"",

        description:"",

        status:"ACTIVE"

    });

    // =====================================================
    // Initial Load
    // =====================================================

    useEffect(()=>{

        loadConfig();

        loadMaster();
           loadCompanies();
            loadPlants();

    },[]);
        // =====================================================
    // Load Configuration
    // =====================================================

    const loadConfig = async () => {

        try {

            const response = await plantShopService.getConfig();
            console.log(JSON.stringify(response.data, null, 2));
console.log(response.data);
            setConfig(

                response.data.data || {}

            );

        }

        catch (error) {

            console.error(error);

            showToast(

                "Unable to load configuration",

                "danger"

            );

        }

    };
 const loadCompanies = async () => {
    try {
        const response = await companyService.getMaster();

        console.log("Company API Response:", response.data);

        setCompanies(response.data.data || []);

        console.log("Companies:", response.data.data);
    } catch (error) {
        console.log(error);
    }

};
const getCompanyName = (companyId) => {
    const company = companies.find(
        c => c.company_id === companyId
    );

    return company ? company.company_name : "-";
};
const loadPlants = async () => {
    try {
        const response = await plantShopService.getMaster();

        const plantList = response.data.data.filter(
            row => row.plant_id
        );

        const uniquePlants = [
            ...new Map(
                plantList.map(item => [item.plant_id, item])
            ).values()
        ];

        setPlants(uniquePlants);

    } catch (error) {
        console.log(error);
    }
};

    // =====================================================
    // Load Master
    // =====================================================

    const loadMaster = async () => {

        try {

            setLoading(true);

            const response = await plantShopService.getMaster();

            setMasters(

                response.data.data || []

            );

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to load Plant / Shop Master",

                "danger"

            );

        }

        finally {

            setLoading(false);

        }

    };

    // =====================================================
    // Plant Form Change
    // =====================================================

    const handlePlantChange = (event) => {

        const {

            name,

            value

        } = event.target;

        setPlantForm({

            ...plantForm,

            [name]: value

        });

    };

    // =====================================================
    // Shop Form Change
    // =====================================================

    const handleShopChange = (event) => {

        const {

            name,

            value

        } = event.target;

        setShopForm({

            ...shopForm,

            [name]: value

        });

    };

    // =====================================================
    // Reset Forms
    // =====================================================

    const resetPlantForm = () => {

        setEditId(null);

        setEditType("");

        setPlantForm({

                company_id:"",
    plant_code:"",
    plant_name:"",
    plant_type:"MANUFACTURING",
    timezone:"",
    state:"",
    city:"",
    address:"",
    status:"ACTIVE"

        });

    };

    const resetShopForm = () => {

        setEditId(null);

        setEditType("");

        setShopForm({

            plant_id: "",

            shop_code: "",

            shop_name: "",

            description: "",

            status: "ACTIVE"

        });

    };

    // =====================================================
    // Open Plant Modal
    // =====================================================

    const openAddPlant = () => {

        resetPlantForm();

        setShowPlantModal(true);

    };

    // =====================================================
    // Open Shop Modal
    // =====================================================

    const openAddShop = () => {

        resetShopForm();

        setShowShopModal(true);

    };

    // =====================================================
    // Edit Plant
    // =====================================================

  const openEditPlant = (row) => {

    setEditId(row.plant_id);

    setUpdateForm({
        type: "PLANT",
        company_id: row.company_id,
        plant_id: row.plant_id,
        plant_code: row.plant_code,
        plant_name: row.plant_name,
        plant_type: row.plant_type,
        timezone: row.timezone,
        state: row.state,
        city: row.city,
        address: row.address,
        shop_code: row.shop_code || "",
        shop_name: row.shop_name || "",
        status: row.plant_status
    });

    setShowUpdateModal(true);
};

    // =====================================================
    // Edit Shop
    // =====================================================
const openEditShop = (row) => {

    setEditId(row.shop_id);

    setUpdateForm({
        type: "SHOP",
        company_id: row.company_id,
        plant_id: row.plant_id,
        plant_code: row.plant_code,
        plant_name: row.plant_name,
        plant_type: row.plant_type,
        timezone: row.timezone,
        state: row.state,
        city: row.city,
        address: row.address,
        shop_code: row.shop_code,
        shop_name: row.shop_name,
        status: row.shop_status
    });

    setShowUpdateModal(true);
};
const handleUpdateChange = (e) => {

    const { name, value } = e.target;

    setUpdateForm(prev => ({
        ...prev,
        [name]: value
    }));
};
const updateMaster = async () => {

    try {

        setSaving(true);

        if (updateForm.type === "PLANT") {

            await plantShopService.updatePlant(editId, updateForm);

        } else {

            await plantShopService.updateShop(editId, updateForm);

        }

        showToast("Updated Successfully");

        setShowUpdateModal(false);

        loadMaster();

    } catch (err) {

        showToast(
            err.response?.data?.message || "Update Failed",
            "danger"
        );

    } finally {

        setSaving(false);

    }

};
   

    // =====================================================
    // Filter Data
    // =====================================================

    const filteredMasters = masters.filter((row) => {

        const searchMatch =

            (

                row.plant_code || ""

            )

                .toLowerCase()

                .includes(

                    searchText.toLowerCase()

                )

            ||

            (

                row.plant_name || ""

            )

                .toLowerCase()

                .includes(

                    searchText.toLowerCase()

                )

            ||

            (

                row.shop_code || ""

            )

                .toLowerCase()

                .includes(

                    searchText.toLowerCase()

                )

            ||

            (

                row.shop_name || ""

            )

                .toLowerCase()

                .includes(

                    searchText.toLowerCase()

                );

        const statusMatch =

            statusFilter === "ALL"

            ||

            row.status === statusFilter;

        return searchMatch && statusMatch;

    });

    // =====================================================
    // Part 3 Starts Here
    // =====================================================
        // =====================================================
    // Save Plant
    // =====================================================

    const savePlant = async () => {
    try {

        setSaving(true);

        if (
            !plantForm.plant_code.trim() ||
            !plantForm.plant_name.trim()
        ) {
            showToast(
                "Plant Code and Plant Name are required.",
                "danger"
            );
            return;
        }

        await plantShopService.createPlant(plantForm);

        showToast("Plant Created Successfully");

        setShowPlantModal(false);

        resetPlantForm();

        loadMaster();

    } catch (error) {

        showToast(
            error.response?.data?.message ||
            "Unable to save Plant",
            "danger"
        );

    } finally {

        setSaving(false);

    }
};
    

    // =====================================================
    // Save Shop
    // =====================================================
const saveShop = async () => {

    try {

        setSaving(true);

        if (
            !shopForm.shop_code.trim() ||
            !shopForm.shop_name.trim()
        ) {
            showToast(
                "Shop Code and Shop Name are required.",
                "danger"
            );
            return;
        }

        const response = await plantShopService.createShop(
            shopForm
        );

        showToast(
            response.data.message ||
            "Shop Created Successfully"
        );

        setShowShopModal(false);

        resetShopForm();

        loadMaster();

    } catch (error) {

        showToast(
            error.response?.data?.message ||
            "Unable to save Shop",
            "danger"
        );

    } finally {

        setSaving(false);

    }

};

    // =====================================================
    // Runtime
    // =====================================================

    const loadRuntime = async () => {

        try {

            setLoading(true);

            const response = await plantShopService.getRuntime();

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

    const executeMaster = async () => {

        try {

            const response = await plantShopService.execute();

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

            const response = await plantShopService.getReport();

            setReport(

                response.data.data || []

            );

            setShowReport(true);

        }

        catch (error) {

            showToast(

                error.response?.data?.message ||

                "Unable to generate Report",

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

    const exportMaster = async () => {

        try {

            const response = await plantShopService.export();

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

                "PlantShopMaster.csv";

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

<div className="plant-shop-master container-fluid">
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

                    zIndex:9999

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

                                Plant & Shop Master

                            </h3>

                            <small className="text-muted">

                                Enterprise Setup /

                                Plant Shop Master

                            </small>

                        </Col>

                        <Col

                            xs="auto"

                            className="d-flex"

                        >

                            <Button

                                variant="success"

                                className="me-2"

                                onClick={openAddPlant}

                            >

                                <Plus />

                                {" "}

                                Add Plant

                            </Button>

                            <Button

                                variant="primary"

                                onClick={openAddShop}

                            >

                                <Plus />

                                {" "}

                                Add Shop

                            </Button>

                        </Col>

                    </Row>

                </Card.Body>

            </Card>

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

                                    placeholder="Search Plant / Shop..."

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

                            md={5}

                            className="text-md-end"

                        >

                            <Button

                                variant="outline-secondary"

                                className="me-2"

                                onClick={loadMaster}

                            >

                                Refresh

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

                                className="me-2"

                                onClick={exportMaster}

                            >

                                <Download />

                            </Button>

                           
                        </Col>

                    </Row>

                </Card.Body>

            </Card>

            {/* ========================================= */}
            {/* Plant / Shop Table */}
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
                                    <th>Company</th>

                                    <th>

                                        Plant Code

                                    </th>

                                    <th>

                                        Plant Name

                                    </th>
                                     <th>Plant Type</th>

                                    <th>

                                        Shop Code

                                    </th>

                                    <th>

                                        Shop Name

                                    </th>

                                    <th>

                                        Status

                                    </th>

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

                                                <Spinner

                                                    animation="border"

                                                />

                                            </td>

                                        </tr>

                                    )

                                    :

                                    filteredMasters.length===0 ?

                                    (

                                        <tr>

                                            <td

                                                colSpan="6"

                                                className="text-center"

                                            >

                                                No Plant / Shop Found

                                            </td>

                                        </tr>

                                    )

                                    :

                                    filteredMasters.map(

                                        (

                                            row

                                        )=>(

                                            <tr

                                                key={

                                                    row.id

                                                }

                                            >
                                                <td>{getCompanyName(row.company_id)}</td>

                                                <td>

                                                    {

                                                        row.plant_code

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        row.plant_name

                                                    }

                                                </td>
                                                <td>{row.plant_type}</td>

                                                <td>

                                                    {

                                                        row.shop_code

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        row.shop_name

                                                    }

                                                </td>

 <td className="text-center">
    <StatusBadge status={row.plant_status} />
</td>
{/*
<td>
    <div>
        <Badge bg={row.plant_status === "ACTIVE" ? "success" : "secondary"}>
            Plant: {row.plant_status}
        </Badge>

        <br />

        {row.shop_id && (
            <Badge bg={row.shop_status === "ACTIVE" ? "success" : "secondary"}>
                Shop: {row.shop_status}
            </Badge>
        )}
    </div>
</td>
*/}

                                                <td className="text-center">

                                                    <Button

                                                        size="sm"

                                                        variant="outline-primary"

                                                        className="me-2"

                                                        onClick={()=>

                                                            row.shop_id

                                                            ?

                                                            openEditShop(row)

                                                            :

                                                            openEditPlant(row)

                                                        }

                                                    >

                                                        <PencilSquare />

                                                    </Button>

                                                </td>

                                            </tr>

                                        )

                                    )

                                }

                            </tbody>

                        </Table>

                    </div>

                </Card.Body>

            </Card>

            {/* ========================================= */}
            {/* Plant Modal */}
            {/* ========================================= */}
                        {/* ========================================= */}
            {/* Plant Modal */}
            {/* ========================================= */}

            <Modal

                show={showPlantModal}

                onHide={() => {

                    resetPlantForm();

                    setShowPlantModal(false);

                }}

                centered

                size="lg"

                backdrop="static"

            >

                <Modal.Header closeButton>

                  <Modal.Title>
    Create Plant
</Modal.Title> 

                </Modal.Header>

                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Company

                                    </Form.Label>
{console.log("Companies State:", companies)}
                                    <Form.Select
    name="company_id"
    value={plantForm.company_id}
    onChange={handlePlantChange}
>
    <option value="">
        Select Company
    </option>

{
    companies.map((company) => (
        <option
            key={company.company_id}
            value={company.company_id}
        >
            {company.company_name}
        </option>
    ))
}

</Form.Select>

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Plant Code

                                    </Form.Label>

                                    <Form.Control

                                        type="text"

                                        name="plant_code"

                                        value={plantForm.plant_code}

                                        onChange={handlePlantChange}

                                    />

                                </Form.Group>

                            </Col>

                        </Row>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Plant Name

                                    </Form.Label>

                                    <Form.Control

                                        type="text"

                                        name="plant_name"

                                        value={plantForm.plant_name}

                                        onChange={handlePlantChange}

                                    />

                                </Form.Group>

                            </Col>
                            <Form.Group className="mb-3">
    <Form.Label>Plant Type</Form.Label>

    <Form.Select
        name="plant_type"
        value={plantForm.plant_type}
        onChange={handlePlantChange}
    >
        <option value="MANUFACTURING">
            MANUFACTURING
        </option>

        <option value="WAREHOUSE">
            WAREHOUSE
        </option>

        <option value="DISTRIBUTION">
            DISTRIBUTION
        </option>
    </Form.Select>
</Form.Group>
<Row>
    <Col md={6}>
        <Form.Group className="mb-3">
            <Form.Label>Timezone</Form.Label>
            <Form.Control
                type="text"
                name="timezone"
                value={plantForm.timezone}
                onChange={handlePlantChange}
                placeholder="Asia/Dubai"
            />
        </Form.Group>
    </Col>

    <Col md={6}>
        <Form.Group className="mb-3">
            <Form.Label>State</Form.Label>
            <Form.Control
                type="text"
                name="state"
                value={plantForm.state}
                onChange={handlePlantChange}
                placeholder="Karnataka"
            />
        </Form.Group>
    </Col>
</Row>

<Row>
    <Col md={6}>
        <Form.Group className="mb-3">
            <Form.Label>City</Form.Label>
            <Form.Control
                type="text"
                name="city"
                value={plantForm.city}
                onChange={handlePlantChange}
                placeholder="Bangalore"
            />
        </Form.Group>
    </Col>

    <Col md={6}>
        <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
                type="text"
                name="address"
                value={plantForm.address}
                onChange={handlePlantChange}
                placeholder="Electronic City"
            />
        </Form.Group>
    </Col>
</Row>

                            
                        </Row>

                        <Row>

                            <Col md={6}>

                                <Form.Group>

                                    <Form.Label>

                                        Status

                                    </Form.Label>

                                    <Form.Select

                                        name="status"

                                        value={plantForm.status}

                                        onChange={handlePlantChange}

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

                            resetPlantForm();

                            setShowPlantModal(false);

                        }}

                    >

                        Cancel

                    </Button>

                    <Button

                        variant="primary"

                        disabled={saving}

                        onClick={savePlant}

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
    "Save Plant"
}

                    </Button>

                </Modal.Footer>

            </Modal>

            {/* ========================================= */}
            {/* Shop Modal */}
            {/* ========================================= */}

            <Modal

                show={showShopModal}

                onHide={() => {

                    resetShopForm();

                    setShowShopModal(false);

                }}

                centered

                size="lg"

                backdrop="static"

            >

                <Modal.Header closeButton>

                   <Modal.Title>Create Shop</Modal.Title>
y
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

                                        value={shopForm.plant_id}

                                        onChange={handleShopChange}

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

                                        Shop Code

                                    </Form.Label>

                                    <Form.Control

                                        type="text"

                                        name="shop_code"

                                        value={shopForm.shop_code}

                                        onChange={handleShopChange}

                                    />

                                </Form.Group>

                            </Col>

                        </Row>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Shop Name

                                    </Form.Label>

                                    <Form.Control

                                        type="text"

                                        name="shop_name"

                                        value={shopForm.shop_name}

                                        onChange={handleShopChange}

                                    />

                                </Form.Group>

                            </Col>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>

                                        Description

                                    </Form.Label>

                                    <Form.Control

                                        type="text"

                                        name="description"

                                        value={shopForm.description}

                                        onChange={handleShopChange}

                                    />

                                </Form.Group>

                            </Col>

                        </Row>

                        <Row>

                            <Col md={6}>

                                <Form.Group>

                                    <Form.Label>

                                        Status

                                    </Form.Label>

                                    <Form.Select

                                        name="status"

                                        value={shopForm.status}

                                        onChange={handleShopChange}

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

                            resetShopForm();

                            setShowShopModal(false);

                        }}

                    >

                        Cancel

                    </Button>

                    <Button

                        variant="primary"

                        disabled={saving}

                        onClick={saveShop}

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
"Save Shop"

                        }

                    </Button>

                </Modal.Footer>

            </Modal>
{/* ========================================= */}
{/* Update Plant / Shop Modal */}
{/* ========================================= */}

<Modal
    show={showUpdateModal}
    onHide={() => setShowUpdateModal(false)}
    centered
    size="lg"
    backdrop="static"
>
    <Modal.Header closeButton>
        <Modal.Title>
            Update {updateForm.type}
        </Modal.Title>
    </Modal.Header>

    <Modal.Body>

        <Form>

            {/* Company */}

            <Form.Group className="mb-3">
                <Form.Label>Company</Form.Label>

                <Form.Select
                    name="company_id"
                    value={updateForm.company_id}
                     disabled
                >
                    {
                        companies.map(company => (
                            <option
                                key={company.company_id}
                                value={company.company_id}
                            >
                                {company.company_name}
                            </option>
                        ))
                    }
                </Form.Select>
            </Form.Group>

            {/* Plant */}

            <Row>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Plant Code</Form.Label>

                        <Form.Control
                            name="plant_code"
                            value={updateForm.plant_code}
                            disabled
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Plant Name</Form.Label>

                        <Form.Control
                            name="plant_name"
                            value={updateForm.plant_name}
                            onChange={handleUpdateChange}
                        />
                    </Form.Group>
                </Col>

            </Row>

            <Row>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Plant Type</Form.Label>

                        <Form.Select
                            name="plant_type"
                            value={updateForm.plant_type}
                            onChange={handleUpdateChange}
                        >
                            <option value="MANUFACTURING">MANUFACTURING</option>
                            <option value="WAREHOUSE">WAREHOUSE</option>
                            <option value="DISTRIBUTION">DISTRIBUTION</option>
                        </Form.Select>
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Timezone</Form.Label>

                        <Form.Control
                            name="timezone"
                            value={updateForm.timezone}
                            onChange={handleUpdateChange}
                        />
                    </Form.Group>
                </Col>

            </Row>

            <Row>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>State</Form.Label>

                        <Form.Control
                            name="state"
                            value={updateForm.state}
                            onChange={handleUpdateChange}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>City</Form.Label>

                        <Form.Control
                            name="city"
                            value={updateForm.city}
                            onChange={handleUpdateChange}
                        />
                    </Form.Group>
                </Col>

            </Row>

            <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>

                <Form.Control
                    name="address"
                    value={updateForm.address}
                    onChange={handleUpdateChange}
                />
            </Form.Group>

            {/* Shop */}

            <Row>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Shop Code</Form.Label>

                        <Form.Control
                            name="shop_code"
                            value={updateForm.shop_code}
                              disabled
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Shop Name</Form.Label>

                        <Form.Control
                            name="shop_name"
                            value={updateForm.shop_name}
                            onChange={handleUpdateChange}
                        />
                    </Form.Group>
                </Col>

            </Row>

            {/* Status */}

            <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>

                <Form.Select
                    name="status"
                    value={updateForm.status}
                    onChange={handleUpdateChange}
                >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                </Form.Select>
            </Form.Group>

        </Form>

    </Modal.Body>

    <Modal.Footer>

        <Button
            variant="secondary"
            onClick={() => setShowUpdateModal(false)}
        >
            Cancel
        </Button>

        <Button
            variant="primary"
            disabled={saving}
            onClick={updateMaster}
        >
            {
                saving
                    ? "Updating..."
                    : "Update"
            }
        </Button>

    </Modal.Footer>

</Modal>
            {/* ========================================= */}
            {/* Runtime Modal */}
            {/* ========================================= */}
                        {/* ========================================= */}
            {/* Runtime Modal */}
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

                        Plant / Shop Runtime History

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

                                    <th>Date</th>

                                </tr>

                            </thead>

                            <tbody>

                                {

                                    runtime.length===0

                                    ?

                                    (

                                        <tr>

                                            <td

                                                colSpan="3"

                                                className="text-center"

                                            >

                                                No Runtime History

                                            </td>

                                        </tr>

                                    )

                                    :

                                    runtime.map(

                                        (

                                            item,

                                            index

                                        )=>(

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

                        onClick={()=>

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

                onHide={()=>

                    setShowReport(false)

                }

                size="xl"

                centered

            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Plant / Shop Report

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

                                        Plant Code

                                    </th>

                                    <th>

                                        Plant Name

                                    </th>
                                     <th>Plant Type</th>

                                    <th>

                                        Shop Code

                                    </th>

                                    <th>

                                        Shop Name

                                    </th>

                                    <th>

                                        Status

                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {

                                    report.length===0

                                    ?

                                    (

                                        <tr>

                                            <td

                                                colSpan="5"

                                                className="text-center"

                                            >

                                                No Report Data

                                            </td>

                                        </tr>

                                    )

                                    :

                                    report.map(

                                        (

                                            row,

                                            index

                                        )=>(

                                            <tr

                                                key={index}

                                            >

                                                <td>

                                                    {

                                                        row.plant_code

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        row.plant_name

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        row.shop_code

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        row.shop_name

                                                    }

                                                </td>

                                                <td>

                                                    <Badge

                                                        bg={

                                                            row.status==="ACTIVE"

                                                            ?

                                                            "success"

                                                            :

                                                            "secondary"

                                                        }

                                                    >

                                                        {

                                                            row.status

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

export default PlantShopMaster;