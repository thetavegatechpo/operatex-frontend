import React from "react";

import {

    ExclamationCircle

} from "react-bootstrap-icons";

function NoData({

    message = "No Data Found"

}) {

    return (

        <div

            style={{

                textAlign:"center",

                padding:"60px 20px",

                color:"#6c757d"

            }}

        >

            <ExclamationCircle

                size={50}

                color="#adb5bd"

            />

            <h5

                style={{

                    marginTop:"15px"

                }}

            >

                {message}

            </h5>

        </div>

    );

}

export default NoData;