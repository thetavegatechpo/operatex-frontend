import React from "react";

import {
    Toast,
    ToastContainer
} from "react-bootstrap";

function ToastMessage({

    show,

    message,

    variant = "success",

    onClose

}) {

    const styles = {

        success: {

            backgroundColor: "#198754",

            color: "#ffffff"

        },

        danger: {

            backgroundColor: "#dc3545",

            color: "#ffffff"

        },

        warning: {

            backgroundColor: "#ffc107",

            color: "#000000"

        },

        info: {

            backgroundColor: "#0dcaf0",

            color: "#000000"

        }

    };

    return (

        <ToastContainer

            position="top-end"

            className="p-3"

            style={{

                zIndex:9999

            }}

        >

            <Toast

                show={show}

                onClose={onClose}

                delay={3000}

                autohide

            >

                <Toast.Header>

                    <strong className="me-auto">

                        OperateX

                    </strong>

                </Toast.Header>

                <Toast.Body

                    style={

                        styles[variant]

                    }

                >

                    {message}

                </Toast.Body>

            </Toast>

        </ToastContainer>

    );

}

export default ToastMessage;