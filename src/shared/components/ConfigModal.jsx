import React from "react";

import {
    Modal,
    Button,
    Spinner,
    Form
} from "react-bootstrap";

import FormGrid from "./FormGrid.jsx";
import FormField from "./FormField.jsx";

function ConfigModal({

    show,

    title = "Configuration",

    fields = [],

    formData = {},

    setFormData,

    errors = {},

    saving = false,

    saveText = "Save",

    onClose,

    onSave,

    children

}) {

    const handleChange = (e) => {

        const {

            name,

            value,

            type,

            checked

        } = e.target;

        setFormData((prev) => ({

            ...prev,

            [name]:

                type === "checkbox"

                    ? checked
                    : value

        }));

    };

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

                    {title}

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                {

                    children ?

                        children

                        :

                        <Form>

                            <FormGrid>

                                {

                                    fields.map((field) => (

                                        <FormField

                                            key={field.name}

                                            {...field}

                                            value={

                                                formData[field.name]

                                            }

                                            checked={

                                                Boolean(

                                                    formData[field.name]

                                                )

                                            }

                                            error={

                                                errors[field.name]

                                            }

                                            onChange={handleChange}

                                        />

                                    ))

                                }

                            </FormGrid>

                        </Form>

                }

            </Modal.Body>

            <Modal.Footer>

                <Button

                    variant="secondary"

                    onClick={onClose}

                    disabled={saving}

                >

                    Cancel

                </Button>

                <Button

                    variant="primary"

                    onClick={onSave}

                    disabled={saving}

                >

                    {

                        saving ?

                            <>

                                <Spinner

                                    animation="border"

                                    size="sm"

                                    className="me-2"

                                />

                                Saving...

                            </>

                            :

                            saveText

                    }

                </Button>

            </Modal.Footer>

        </Modal>

    );

}

export default ConfigModal;