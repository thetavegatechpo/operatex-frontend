import React from "react";

import {
    Modal,
    Button,
    Spinner
} from "react-bootstrap";

import FormGrid from "./FormGrid.jsx";

function ExecuteModal({

    show,

    title,

    fields,

    formData,

    setFormData,

    errors = {},

    saving,

    onExecute,

    onClose

}) {

    return (

        <Modal
            show={show}
            onHide={onClose}
            centered
            size="lg"
        >

            <Modal.Header closeButton>

                <Modal.Title>
                    {title}
                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <FormGrid

                    fields={fields}

                    formData={formData}

                    setFormData={setFormData}

                    errors={errors}

                />

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
                    onClick={onExecute}
                    disabled={saving}
                >

                    {

                        saving

                            ?

                            <Spinner
                                animation="border"
                                size="sm"
                            />

                            :

                            "Execute"

                    }

                </Button>

            </Modal.Footer>

        </Modal>

    );

}

export default ExecuteModal;