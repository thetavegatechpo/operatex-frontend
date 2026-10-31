import React from "react";

import {

    Modal,

    Button,

    Spinner

} from "react-bootstrap";

function ConfirmDeleteModal({

    show,

    title = "Delete Record",

    message = "Are you sure you want to delete this record?",

    deleting = false,

    deleteText = "Delete",

    onClose,

    onDelete

}) {

    return (

        <Modal

            show={show}

            onHide={onClose}

            centered

            backdrop="static"

        >

            <Modal.Header closeButton>

                <Modal.Title>

                    {title}

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <p className="mb-0">

                    {message}

                </p>

            </Modal.Body>

            <Modal.Footer>

                <Button

                    variant="secondary"

                    onClick={onClose}

                    disabled={deleting}

                >

                    Cancel

                </Button>

                <Button

                    variant="danger"

                    onClick={onDelete}

                    disabled={deleting}

                >

                    {

                        deleting ?

                        <>

                            <Spinner

                                animation="border"

                                size="sm"

                                className="me-2"

                            />

                            Deleting...

                        </>

                        :

                        deleteText

                    }

                </Button>

            </Modal.Footer>

        </Modal>

    );

}

export default ConfirmDeleteModal;