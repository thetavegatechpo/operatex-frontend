import React from "react";

import {

    Modal,
    Button,
    Form,
    Spinner

} from "react-bootstrap";

import FormGrid from "./FormGrid.jsx";

function MasterFormModal({

    show,

    title = "Master Form",

    fields = [],

    formData,

    setFormData,

    errors = {},

    saving = false,

    saveText = "Save",

    updateText = "Update",

    isEdit = false,

    onSave,

    onClose,

    footer

}) {

    return (

        <Modal

            show={show}

            onHide={onClose}

            size="lg"

            centered

            backdrop="static"

        >

            <Modal.Header closeButton>

                <Modal.Title>

                    {

                        isEdit

                        ?

                        updateText

                        :

                        saveText

                    }

                    {" "}

                    {title}

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <Form>

                    <FormGrid

                        fields={fields}

                        formData={formData}

                        setFormData={setFormData}

                        errors={errors}

                    />

                </Form>

            </Modal.Body>

            <Modal.Footer>

                {

                    footer

                    ?

                    footer

                    :

                    <>

                        <Button

                            variant="secondary"

                            onClick={onClose}

                        >

                            Cancel

                        </Button>

                        <Button

                            variant="primary"

                            onClick={onSave}

                            disabled={saving}

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

                                isEdit

                                ?

                                "Update"

                                :

                                "Save"

                            }

                        </Button>

                    </>

                }

            </Modal.Footer>

        </Modal>

    );

}

export default MasterFormModal;