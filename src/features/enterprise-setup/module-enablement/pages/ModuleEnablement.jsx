import React from 'react';

import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";

import moduleService from "../api/module.service.js";

import PageHeader from "../../../../shared/components/PageHeader.jsx";

import DataTable from "../../../../shared/components/DataTable.jsx";
import StatusBadge from "../../../../shared/components/StatusBadge.jsx";
import ToastMessage from "../../../../shared/components/ToastMessage.jsx";

import "./ModuleEnablement.css";

function ModuleEnablement() {

    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [toast, setToast] = useState({
        show: false,
        message: "",
        variant: "success"
    });

    const showToast = (message, variant = "success") => {

        setToast({
            show: true,
            message,
            variant
        });

    };

    // ==========================================
    // Load Config
    // ==========================================

    const loadConfig = async () => {

        try {

            setLoading(true);

            const response = await moduleService.getConfig();

            console.log("API Response :", response.data.data);

            setModules(response.data.data || []);

        } catch (error) {

            showToast(
                error.response?.data?.message ||
                "Unable to load modules.",
                "danger"
            );

        } finally {

            setLoading(false);

        }

    };

    // ==========================================
    // Toggle
    // ==========================================

    const toggleModule = async (row) => {

        try {

            await moduleService.updateModuleConfig({

                module_name: row.module_name,

                is_enabled:
                    Number(row.is_enabled) === 1 ? 0 : 1

            });

            loadConfig();

            showToast("Module updated successfully.");

        } catch (error) {

            showToast(
                error.response?.data?.message ||
                "Unable to update module.",
                "danger"
            );

        }

    };

    // ==========================================
    // Search
    // ==========================================

    const filteredData = modules.filter((item) => {

        const search = searchText.toLowerCase();

        return (

            (item.display_name || "")
                .toLowerCase()
                .includes(search)

            ||

            (item.module_name || "")
                .toLowerCase()
                .includes(search)

            ||

            (item.module_group || "")
                .toLowerCase()
                .includes(search)

        );

    });

    console.log("Modules :", modules.length);
    console.log("Filtered :", filteredData.length);

    // ==========================================
    // Columns
    // ==========================================
// ==========================================
// Table Columns
// ==========================================

const columns = [

    {

        key: "sr_no",

        label: "Sr. No",

        render: (row, index) => index + 1

    },

    {

        key: "display_name",

        label: "Module",

        render: (row) =>

            row.display_name || row.module_name

    },

    {

        key: "module_status",

        label: "Status",

        render: (row) => (

            <span
                className={
                    Number(row.is_enabled) === 1
                        ? "text-success fw-bold"
                        : "text-danger fw-bold"
                }
            >
                {
                    Number(row.is_enabled) === 1
                        ? "Enabled"
                        : "Disabled"
                }
            </span>

        )

    },

    {

        key: "is_enabled",

        label: "Enable / Disable",

        render: (row) => (

            <Form.Check

                type="switch"

                checked={Number(row.is_enabled) === 1}

                onChange={() => toggleModule(row)}

            />

        )

    }

];
 

    useEffect(() => {

        loadConfig();

    }, []);

    return (

        <>

<div className="page-container">

            <PageHeader

                title="Module Enablement"

                subtitle="Enable or Disable System Modules"

            />

          

            <DataTable

                columns={columns}

                data={filteredData}

                loading={loading}

                emptyMessage="No Modules Found"

            />

            <ToastMessage

                show={toast.show}

                message={toast.message}

                variant={toast.variant}

                onClose={() =>
                    setToast({
                        ...toast,
                        show: false
                    })
                }

            />

        </div>
</>

    );

}

export default ModuleEnablement;