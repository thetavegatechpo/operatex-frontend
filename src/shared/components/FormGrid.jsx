import React from "react";
import { Row, Col } from "react-bootstrap";
import FormField from "./FormField.jsx";

function FormGrid({

    fields = [],

    formData = {},

    setFormData,

    errors = {},

    children,

    md = 6,

    lg,

    xl,

    className = "g-3"

}) {

    // Support children mode
    if (children) {

        return (

            <Row className={className}>

                {

                    React.Children.map(children, (child, index) => (

                        <Col
                            key={index}
                            md={md}
                            lg={lg}
                            xl={xl}
                        >

                            {child}

                        </Col>

                    ))

                }

            </Row>

        );

    }

    // Support fields mode
    return (

        <Row className={className}>

            {

                fields.map(field => (

                    <Col
                        key={field.name}
                        md={md}
                        lg={lg}
                        xl={xl}
                    >

                        <FormField

                            {...field}

                            value={formData[field.name]}

                            checked={formData[field.name]}

                            error={errors[field.name]}

                            onChange={(e) => {

                                const {

                                    name,

                                    value,

                                    checked,

                                    type

                                } = e.target;

                                setFormData(prev => ({

                                    ...prev,

                                    [name]:

                                        type === "checkbox"

                                            ? checked

                                            : value

                                }));

                            }}

                        />

                    </Col>

                ))

            }

        </Row>

    );

}

export default FormGrid;