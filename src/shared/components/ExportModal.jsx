import React from "react";

import {

    Modal,
    Button,
    Form,
    Row,
    Col

} from "react-bootstrap";

import FormField from "./FormField.jsx";

function ExportModal({

    show,

    title = "Export",

    exportForm,

    setExportForm,

    formats = [

        "CSV",
        "EXCEL",
        "PDF"

    ],

    filters = [],

    exporting = false,

    onExport,

    onClose

}) {

    const handleChange = (event) => {

        const {

            name,
            value

        } = event.target;

        setExportForm({

            ...exportForm,

            [name]: value

        });

    };

    return (

        <Modal

            show={show}

            onHide={onClose}

            centered

        >

            <Modal.Header closeButton>

                <Modal.Title>

                    {title}

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <Form>

                    <FormField

                        type="select"

                        label="Export Format"

                        name="format"

                        value={exportForm.format}

                        onChange={handleChange}

                        options={

                            formats.map(item => ({

                                label: item,

                                value: item

                            }))

                        }

                    />

                    {

                        filters.map(field => (

                            <Row key={field.name}>

                                <Col>

                                    <FormField

                                        {...field}

                                        value={

                                            exportForm[field.name] ||

                                            ""

                                        }

                                        onChange={handleChange}

                                    />

                                </Col>

                            </Row>

                        ))

                    }

                </Form>

            </Modal.Body>

            <Modal.Footer>

                <Button

                    variant="secondary"

                    onClick={onClose}

                >

                    Cancel

                </Button>

                <Button

                    variant="success"

                    onClick={onExport}

                    disabled={exporting}

                >

                    {

                        exporting

                        ?

                        "Exporting..."

                        :

                        "Download"

                    }

                </Button>

            </Modal.Footer>

        </Modal>

    );

}

export default ExportModal;