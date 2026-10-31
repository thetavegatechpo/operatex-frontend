import React from "react";

import {

    Modal,

    Button

} from "react-bootstrap";

import DataTable from "./DataTable.jsx";

function RuntimeModal({

    show,

    title = "Runtime",

    columns = [],

    data = [],

    loading = false,

    size = "xl",

    centered = true,

    onClose

}) {

    return (

        <Modal

            show={show}

            onHide={onClose}

            size={size}

            centered={centered}

        >

            <Modal.Header closeButton>

                <Modal.Title>

                    {title}

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <DataTable

                    columns={columns}

                    data={data}

                    loading={loading}

                    emptyMessage="No Runtime Records Found"

                />

            </Modal.Body>

            <Modal.Footer>

                <Button

                    variant="secondary"

                    onClick={onClose}

                >

                    Close

                </Button>

            </Modal.Footer>

        </Modal>

    );

}

export default RuntimeModal;
