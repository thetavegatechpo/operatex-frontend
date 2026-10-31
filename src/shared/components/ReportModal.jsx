import React from "react";

import {

    Modal,

    Button

} from "react-bootstrap";

import DataTable from "./DataTable.jsx";

function ReportModal({

    show,

    title = "Report",

    columns = [],

    data = [],

    loading = false,

    renderActions,

    emptyMessage = "No Report Found",

    size = "xl",

    onClose

}) {

    return (

        <Modal

            show={show}

            onHide={onClose}

            size={size}

            centered

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

                    renderActions={renderActions}

                    emptyMessage={emptyMessage}

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

export default ReportModal;