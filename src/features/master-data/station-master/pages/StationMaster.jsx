
import Table from '../../../../shared/components/SmartTable.jsx';
import React, {
    useEffect,
    useState
} from "react";

import {
    Card,
    Button,
    Row,
    Col,
    Form,
    Spinner
} from "react-bootstrap";

import {
    Plus,
    PencilSquare,
    Trash,
    ArrowClockwise
} from "react-bootstrap-icons";

import stationService from "../api/stationService.js";
import StationModal from "./StationModal.jsx";

const StationMaster = () => {

    // ==========================================
    // STATE
    // ==========================================

    const [stations, setStations] = useState([]);

    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);

    const [editMode, setEditMode] = useState(false);

    const [selectedStation, setSelectedStation] = useState(null);

    // ==========================================
    // LOAD DATA
    // ==========================================

    useEffect(() => {

        loadStations();

    }, []);

    const loadStations = async () => {

        try {

            setLoading(true);

            const response =
                await stationService.getMaster();

            setStations(
                response.data.data || []
            );

        } catch (err) {

            console.error(err);

            alert("Failed to load stations.");

        } finally {

            setLoading(false);

        }

    };

    // ==========================================
    // ADD
    // ==========================================

    const openAddForm = () => {

        setEditMode(false);

        setSelectedStation(null);

        setShowModal(true);

    };

    // ==========================================
    // EDIT
    // ==========================================

    const openEditForm = (station) => {

        setEditMode(true);

        setSelectedStation(station);

        setShowModal(true);

    };

    // ==========================================
    // DELETE
    // ==========================================

    const handleDelete = async (id) => {

        const ok =
            window.confirm(
                "Are you sure you want to delete this station?"
            );

        if (!ok) return;

        try {

            await stationService.delete(id);

            alert("Station deleted successfully.");

            loadStations();

        } catch (err) {

            console.error(err);

            alert("Delete failed.");

        }

    };

    // ==========================================
    // SAVE
    // ==========================================

    const handleSave = async (formData) => {

        try {

            if (editMode) {

                await stationService.update(

                    selectedStation.station_id,

                    formData

                );

                alert("Station updated successfully.");

            } else {

                await stationService.create(

                    formData

                );

                alert("Station created successfully.");

            }

            setShowModal(false);

            loadStations();

        } catch (err) {

            console.error(err);

            alert(

                err.response?.data?.message ||

                "Unable to save station."

            );

        }

    };    // ==========================================
    // JSX
    // ==========================================

    return (

        <>

<div className="container-fluid">

            <Card className="shadow-sm">

                <Card.Body>

                    <Row className="mb-3">

                        <Col>

                            <h3>
                                Station Master
                            </h3>

                        </Col>

                        <Col
                            xs="auto"
                            className="d-flex gap-2"
                        >

                            <Button
                                variant="secondary"
                                onClick={loadStations}
                            >
                                <ArrowClockwise />
                                {" "}
                                Refresh
                            </Button>

                            <Button
                                variant="primary"
                                onClick={openAddForm}
                            >
                                <Plus />
                                {" "}
                                Add Station
                            </Button>

                        </Col>

                    </Row>

                    <Row className="mb-3">

                        <Col md={4}>

                            <Form.Control
                                placeholder="Search Station..."
                            />

                        </Col>

                    </Row>

                    <Table
                        bordered
                        hover
                        responsive
                    >

                        <thead className="table-dark">

                            <tr>

                                <th>Station No</th>

                                <th>Station Name</th>

                                <th>Station Type</th>

                                <th>Line</th>

                                <th>Status</th>

                                <th
                                    style={{
                                        width: "130px"
                                    }}
                                >
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
                                                colSpan="6"
                                                className="text-center"
                                            >

                                                <Spinner
                                                    animation="border"
                                                    size="sm"
                                                />

                                            </td>

                                        </tr>

                                    )

                                    :

                                    stations.length === 0 ?

                                        (

                                            <tr>

                                                <td
                                                    colSpan="6"
                                                    className="text-center"
                                                >

                                                    No Station Found

                                                </td>

                                            </tr>

                                        )

                                        :

                                        stations.map(

                                            (item) => (

                                                <tr
                                                    key={
                                                        item.station_id
                                                    }
                                                >

                                                    <td>
                                                        {item.station_no}
                                                    </td>

                                                    <td>
                                                        {item.station_name}
                                                    </td>

                                                    <td>
                                                        {item.station_type}
                                                    </td>

                                                    <td>
                                                        {item.line_name}
                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`badge ${

                                                                item.status ===
                                                                    "ACTIVE"

                                                                    ?

                                                                    "bg-success"

                                                                    :

                                                                    "bg-danger"

                                                                }`}
                                                        >

                                                            {item.status}

                                                        </span>

                                                    </td>

                                                    <td>

                                                        <Button
                                                            size="sm"
                                                            variant="warning"
                                                            className="me-2"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    item
                                                                )
                                                            }
                                                        >

                                                            <PencilSquare />

                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.station_id
                                                                )
                                                            }
                                                        >

                                                            <Trash />

                                                        </Button>

                                                    </td>

                                                </tr>

                                            )

                                        )

                            }

                        </tbody>

                    </Table>

                </Card.Body>

            </Card>

            <StationModal

                show={showModal}

                onHide={() =>
                    setShowModal(false)
                }

                onSave={handleSave}

                editMode={editMode}

                station={selectedStation}

            />

        </div>
</>

    );

};

export default StationMaster;