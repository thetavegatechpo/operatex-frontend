import React from "react";
import { Badge } from "react-bootstrap";

function StatusBadge({ status }) {

    const getVariant = () => {
        switch (status) {
            case "ACTIVE":
                return "success";

            case "INACTIVE":
                return "secondary";

            case "PENDING":
                return "warning";

            case "FAILED":
                return "danger";

            default:
                return "primary";
        }
    };

    return (
        <Badge
            pill
            bg={getVariant()}
            className="px-3 py-2"
        >
            {status}
        </Badge>
    );
}

export default StatusBadge;