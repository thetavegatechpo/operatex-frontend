import React from "react";

import {
    Spinner
} from "react-bootstrap";
import "./Loader.css";

function Loader({

    message = "Loading..."

}) {

    return (

        <div className="loader-wrapper">

            <Spinner

                animation="border"

                variant="primary"

                role="status"

            />

            <div className="loader-text">

                {message}

            </div>

        </div>

    );

}

export default Loader;