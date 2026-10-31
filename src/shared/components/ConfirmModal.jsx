import React from "react";

import {

    Modal,

    Button

} from "react-bootstrap";

function ConfirmModal({

    show,

    title,

    message,

    onCancel,

    onConfirm

}) {

    return (

        <Modal

            show={show}

            onHide={onCancel}

            centered

        >

            <Modal.Header closeButton>

                <Modal.Title>

                    {title}

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                {message}

            </Modal.Body>

            <Modal.Footer>

                <Button

                    variant="secondary"

                    onClick={onCancel}

                >

                    Cancel

                </Button>

                <Button

                    variant="danger"

                    onClick={onConfirm}

                >

                    Confirm

                </Button>

            </Modal.Footer>

        </Modal>

    );

}

export default ConfirmModal;