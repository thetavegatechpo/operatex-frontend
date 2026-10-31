import React, {
    useEffect,
    useState
} from "react";

import {
    Modal,
    Button,
    Form,
    Row,
    Col
} from "react-bootstrap";

import lineService from "../../../enterprise-setup/line-master/api/line.service.js";

function StationModal({

    show,

    onHide,

    onSave,

    editMode,

    station

}) {

    const [lines, setLines] = useState([]);

    const [formData, setFormData] = useState({

        line_id: "",

        station_no: "",

        station_name: "",

        station_type: "",

        status: "ACTIVE"

    });

    useEffect(() => {

        if (show) {

            loadLines();

        }

    }, [show]);

    useEffect(() => {

        if (editMode && station) {

            setFormData({

                line_id: station.line_id,

                station_no: station.station_no,

                station_name: station.station_name,

                station_type: station.station_type,

                status: station.status

            });

        }

        else {

            setFormData({

                line_id: "",

                station_no: "",

                station_name: "",

                station_type: "",

                status: "ACTIVE"

            });

        }

    }, [editMode, station]);

    const loadLines = async () => {

        try {

            const response =
                await lineService.getMaster();

            setLines(
                response.data.data || []
            );

        }

        catch (err) {

            console.error(err);

        }

    };

    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]:
                e.target.value

        });

    };

    const handleSubmit = () => {

        if (!formData.line_id) {

            return alert("Select Line");

        }

        if (!formData.station_no) {

            return alert("Station No required");

        }

        if (!formData.station_name) {

            return alert("Station Name required");

        }

        if (!formData.station_type) {

            return alert("Station Type required");

        }

        onSave(formData);

    };

    return (

        <Modal

            show={show}

            onHide={onHide}

            centered

            size="lg"

        >

            <Modal.Header closeButton>

                <Modal.Title>

                    {

                        editMode

                            ?

                            "Edit Station"

                            :

                            "Add Station"

                    }

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <Row>

                    <Col md={6}>

                        <Form.Group className="mb-3">

                            <Form.Label>

                                Line

                            </Form.Label>

                            <Form.Select

                                name="line_id"

                                value={formData.line_id}

                                onChange={handleChange}

                            >

                                <option value="">

                                    Select Line

                                </option>

                                {

                                    lines.map(

                                        (line) => (

                                            <option

                                                key={line.line_id}

                                                value={line.line_id}

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

                    <Col md={6}>

                        <Form.Group className="mb-3">

                            <Form.Label>

                                Station No

                            </Form.Label>

                            <Form.Control

                                type="number"

                                name="station_no"

                                value={formData.station_no}

                                onChange={handleChange}

                            />

                        </Form.Group>

                    </Col>

                </Row>

                <Row>

                    <Col md={6}>

                        <Form.Group className="mb-3">

                            <Form.Label>

                                Station Name

                            </Form.Label>

                            <Form.Control

                                name="station_name"

                                value={formData.station_name}

                                onChange={handleChange}

                            />

                        </Form.Group>

                    </Col>

                    <Col md={6}>

                        <Form.Group className="mb-3">

                            <Form.Label>

                                Station Type

                            </Form.Label>

                            <Form.Control

                                name="station_type"

                                value={formData.station_type}

                                onChange={handleChange}

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

            </Modal.Body>

            <Modal.Footer>

                <Button

                    variant="secondary"

                    onClick={onHide}

                >

                    Cancel

                </Button>

                <Button

                    variant="primary"

                    onClick={handleSubmit}

                >

                    {

                        editMode

                            ?

                            "Update"

                            :

                            "Save"

                    }

                </Button>

            </Modal.Footer>

        </Modal>

    );

}

export default StationModal;