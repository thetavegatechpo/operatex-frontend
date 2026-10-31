import React from "react";

import {
    Dropdown,
    Form
} from "react-bootstrap";

import ValidationMessage from "./ValidationMessage.jsx";

function FormField({

    label,

    name,

    type = "text",

    value = "",

    checked = false,

    options = [],

    placeholder = "",

    rows = 3,

    disabled = false,

    required = false,

    error = "",

    onChange

}) {

    if (type === "checkbox") {

        return (

            <Form.Group className="mb-3">

                <Form.Check
                    type="checkbox"
                    name={name}
                    label={label}
                    checked={checked}
                    disabled={disabled}
                    onChange={onChange}
                />

                <ValidationMessage error={error} />

            </Form.Group>

        );

    }

    if (type === "multiselect") {

        const selectedValues = Array.isArray(value)
            ? value
            : [];

        const selectedOptions = options.filter(option =>
            selectedValues.some(selected =>
                String(selected) === String(option.value)
            )
        );

        const toggleValue = (optionValue) => {

            const alreadySelected = selectedValues.some(selected =>
                String(selected) === String(optionValue)
            );

            const nextValue = alreadySelected
                ? selectedValues.filter(selected =>
                    String(selected) !== String(optionValue)
                )
                : [
                    ...selectedValues,
                    optionValue
                ];

            onChange?.({
                target: {
                    name,
                    value: nextValue,
                    type: "multiselect"
                }
            });

        };

        const displayText = selectedOptions.length === 0
            ? `Select ${label}`
            : selectedOptions.length === 1
                ? selectedOptions[0].label
                : `${selectedOptions.length} machines selected`;

        return (

            <Form.Group className="mb-3">

                {
                    label &&
                    <Form.Label>
                        {label}
                        {
                            required &&
                            <span className="text-danger">
                                {" "}*
                            </span>
                        }
                    </Form.Label>
                }

                <Dropdown
                    autoClose="outside"
                    className="w-100"
                >

                    <Dropdown.Toggle
                        variant="light"
                        disabled={disabled}
                        className={`w-100 text-start d-flex justify-content-between align-items-center form-select ${error ? "is-invalid" : ""}`}
                    >
                        <span className="text-truncate">
                            {displayText}
                        </span>
                    </Dropdown.Toggle>

                    <Dropdown.Menu
                        className="w-100 p-2"
                        style={{
                            maxHeight: "280px",
                            overflowY: "auto"
                        }}
                    >

                        {
                            options.length === 0 ?
                                <div className="text-muted small px-2 py-2">
                                    No options available
                                </div>
                                :
                                options.map(option => {

                                    const optionChecked = selectedValues.some(selected =>
                                        String(selected) === String(option.value)
                                    );

                                    return (

                                        <Dropdown.Item
                                            as="div"
                                            key={option.value}
                                            className="px-2 py-2"
                                            onClick={() =>
                                                toggleValue(option.value)
                                            }
                                        >
                                            <Form.Check
                                                type="checkbox"
                                                checked={optionChecked}
                                                readOnly
                                                label={option.label}
                                            />
                                        </Dropdown.Item>

                                    );

                                })
                        }

                    </Dropdown.Menu>

                </Dropdown>

                <ValidationMessage error={error} />

            </Form.Group>

        );

    }

    return (

        <Form.Group className="mb-3">

            {
                label &&
                <Form.Label>
                    {label}
                    {
                        required &&
                        <span className="text-danger">
                            {" "}*
                        </span>
                    }
                </Form.Label>
            }

            {
                type === "select" ?
                (
                    <Form.Select
                        name={name}
                        value={value ?? ""}
                        disabled={disabled}
                        onChange={onChange}
                        isInvalid={!!error}
                    >
                        <option value="">
                            Select {label}
                        </option>

                        {
                            options.map(item => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </option>
                            ))
                        }
                    </Form.Select>
                )
                :
                type === "textarea" ?
                (
                    <Form.Control
                        as="textarea"
                        rows={rows}
                        name={name}
                        value={value ?? ""}
                        placeholder={placeholder}
                        disabled={disabled}
                        onChange={onChange}
                        isInvalid={!!error}
                    />
                )
                :
                (
                    <Form.Control
                        type={type}
                        name={name}
                        value={value ?? ""}
                        placeholder={placeholder}
                        disabled={disabled}
                        onChange={onChange}
                        isInvalid={!!error}
                    />
                )
            }

            <ValidationMessage error={error} />

        </Form.Group>

    );

}

export default FormField;
