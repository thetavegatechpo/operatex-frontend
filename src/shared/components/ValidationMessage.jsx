import React from "react";

function ValidationMessage({

    error

}) {

    if (!error) {

        return null;

    }

    return (

        <div
            className="text-danger mt-1"
            style={{

                fontSize: "13px",

                fontWeight: 500

            }}
        >

            {error}

        </div>

    );

}

export default ValidationMessage;