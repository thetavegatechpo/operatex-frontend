import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { Activity, Diagram3, Plus } from "react-bootstrap-icons";
import PageHeader from "../../../../shared/components/PageHeader.jsx";
import SearchToolbar from "../../../../shared/components/SearchToolbar.jsx";
import DataTable from "../../../../shared/components/DataTable.jsx";
import StatusBadge from "../../../../shared/components/StatusBadge.jsx";
import ActionButtons from "../../../../shared/components/ActionButtons.jsx";
import ConfigModal from "../../../../shared/components/ConfigModal.jsx";
import RuntimeModal from "../../../../shared/components/RuntimeModal.jsx";
import ReportModal from "../../../../shared/components/ReportModal.jsx";
import ExportModal from "../../../../shared/components/ExportModal.jsx";
import ToastMessage from "../../../../shared/components/ToastMessage.jsx";

import cncAdapterService, {
    getCncAdapterErrorMessage,
    getCncAdapterMeta,
    getCncAdapterRows
} from "../api/cncAdapter.service.js";

import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import plantShopService from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";
import lineService from "../../../enterprise-setup/line-master/api/line.service.js";
import machineService from "../../../master-data/machine-master/api/machine.service.js";
import deviceService from "../../../master-data/device-master/api/device.service.js";
import signalService from "../../../master-data/signal-mapping/api/signal.service.js";

import "./CncAdapter.css";


const TAB_CONFIG = "CONFIG";

const TAB_TAG_MAP = "TAG_MAP";


const hasValue = value => {

    return (
        value !== undefined &&
        value !== null &&
        value !== ""
    );
};


const sameId = (
    left,
    right
) => {

    return (
        String(
            left ?? ""
        ) ===
        String(
            right ?? ""
        )
    );
};


const toBoolean = value => {

    if (
        value === true ||
        value === 1 ||
        value === "1"
    ) {

        return true;
    }

    return (
        String(
            value ?? ""
        )
            .trim()
            .toLowerCase() ===
        "true"
    );
};


const safeJsonString = value => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return "{}";
    }

    if (
        typeof value ===
        "string"
    ) {

        return value;
    }

    try {

        return JSON.stringify(
            value,
            null,
            2
        );
    }
    catch {

        return "{}";
    }
};


const parseJsonObject = (
    value,
    fieldName
) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return {};
    }

    if (
        typeof value ===
        "object" &&
        !Array.isArray(value)
    ) {

        return value;
    }

    try {

        const parsed =
            JSON.parse(
                value
            );

        if (
            parsed === null ||
            Array.isArray(
                parsed
            ) ||
            typeof parsed !==
            "object"
        ) {

            throw new Error();
        }

        return parsed;
    }
    catch {

        throw new Error(
            `${fieldName} must contain valid JSON.`
        );
    }
};


const nullable = value => {

    return hasValue(
        value
    )
        ? value
        : null;
};


const displayDateTime = value => {

    if (
        !value
    ) {

        return "-";
    }

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;
    }

    return date
        .toLocaleString();
};


const displayRuntimeValue = value => {

    if (
        !hasValue(
            value
        )
    ) {

        return "-";
    }

    return String(
        value
    );
};


const toLocalInputDateTime =
    value => {

        if (
            !value
        ) {

            return "";
        }

        const date =
            new Date(
                value
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(
                value
            ).slice(
                0,
                16
            );
        }

        const pad =
            number =>
                String(
                    number
                ).padStart(
                    2,
                    "0"
                );

        return (
            `${date.getFullYear()}-` +
            `${pad(
                date.getMonth() + 1
            )}-` +
            `${pad(
                date.getDate()
            )}T` +
            `${pad(
                date.getHours()
            )}:` +
            `${pad(
                date.getMinutes()
            )}`
        );
    };


const configInitialState = {

    cnc_protocol_id: "",

    company_id: "",

    plant_id: "",

    line_id: "",

    machine_id: "",

    device_id: "",

    protocol_id: "",

    config_code: "",

    config_name: "",

    polling_ms: 1000,

    timeout_ms: 3000,

    reconnect_interval_ms: 5000,

    max_retry_count: 5,

    protocol_settings: "{}",

    effective_date: "",

    effective_to: "",

    status: "ACTIVE",

    is_active: "true",

    status_config: "{}",

    validation_config: "{}",

    threshold_config: "{}",

    dashboard_visibility_config: "{}",

    report_filter_config: "{}",

    event_trigger_code: "",

    interlock_rule_config: "{}",

    notification_rule_config: "{}",

    retention_policy_config: "{}",

    field_config: "{}",

    approval_workflow_config: "{}",

    role_permission_config: "{}"
};


const tagMapInitialState = {

    cnc_tag_id: "",

    company_id: "",

    cnc_protocol_id: "",

    tag_id: "",

    source_key: "",

    source_type: "",

    status: "ACTIVE",

    is_active: "true",

    effective_date: "",

    effective_to: "",

    event_trigger_code: "",

    runtime_storage_mode:
        "EVENT_ONLY",

    value_mapping_config: "{}",

    transform_config: "{}",

    change_detection_config: "{}",

    threshold_config: "{}",

    interlock_rule_config: "{}",

    bypass_rule_config: "{}",

    notification_rule_config: "{}",

    retention_policy_config: "{}",

    status_config: "{}",

    field_config: "{}",

    validation_config: "{}",

    approval_workflow_config: "{}",

    role_permission_config: "{}",

    dashboard_visibility_config: "{}",

    report_filter_config: "{}"
};


const exportInitialState = {

    format: "CSV",

    company_id: "",

    plant_id: "",

    line_id: "",

    machine_id: "",

    device_id: "",

    event_code: "",

    from_timestamp: "",

    to_timestamp: ""
};


function CncAdapter() {

    const [
        activeTab,
        setActiveTab
    ] = useState(
        TAB_CONFIG
    );


    const [
        configs,
        setConfigs
    ] = useState([]);


    const [
        tagMaps,
        setTagMaps
    ] = useState([]);


    const [
        runtimeRows,
        setRuntimeRows
    ] = useState([]);


    const [
        runtimeType,
        setRuntimeType
    ] = useState(
        "EVENT"
    );


    const [
        reportRows,
        setReportRows
    ] = useState([]);


    const [
        reportMeta,
        setReportMeta
    ] = useState({});


    const [
        companies,
        setCompanies
    ] = useState([]);


    const [
        plants,
        setPlants
    ] = useState([]);


    const [
        shops,
        setShops
    ] = useState([]);


    const [
        lines,
        setLines
    ] = useState([]);


    const [
        machines,
        setMachines
    ] = useState([]);


    const [
        devices,
        setDevices
    ] = useState([]);


    const [
        protocols,
        setProtocols
    ] = useState([]);


    const [
        tags,
        setTags
    ] = useState([]);


    const [
        searchText,
        setSearchText
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter
    ] = useState(
        "ALL"
    );


    const [
        loading,
        setLoading
    ] = useState(false);


    const [
        saving,
        setSaving
    ] = useState(false);


    const [
        exporting,
        setExporting
    ] = useState(false);


    const [
        showConfigForm,
        setShowConfigForm
    ] = useState(false);


    const [
        showTagMapForm,
        setShowTagMapForm
    ] = useState(false);


    const [
        showRuntime,
        setShowRuntime
    ] = useState(false);


    const [
        showReport,
        setShowReport
    ] = useState(false);


    const [
        showExport,
        setShowExport
    ] = useState(false);


    const [
        editingConfig,
        setEditingConfig
    ] = useState(null);


    const [
        editingTagMap,
        setEditingTagMap
    ] = useState(null);


    const [
        configForm,
        setConfigForm
    ] = useState(
        configInitialState
    );


    const [
        tagMapForm,
        setTagMapForm
    ] = useState(
        tagMapInitialState
    );


    const [
        exportForm,
        setExportForm
    ] = useState(
        exportInitialState
    );


    const [
        toast,
        setToast
    ] = useState({

        show: false,

        message: "",

        variant: "success"
    });


    const showToastMessage = (
        message,
        variant = "success"
    ) => {

        setToast({

            show: true,

            message,

            variant
        });
    };


    const hideToast =
        () => {

            setToast(
                previous => ({

                    ...previous,

                    show: false
                })
            );
        };


    useEffect(
        () => {

            loadInitialData();
        },
        []
    );


    const loadInitialData =
        async () => {

            try {

                setLoading(
                    true
                );


                const results =
                    await Promise.allSettled([

                        cncAdapterService
                            .getConfig({

                                limit:
                                    1000,

                                offset:
                                    0
                            }),

                        cncAdapterService
                            .getMaster({

                                limit:
                                    1000,

                                offset:
                                    0
                            }),

                        companyService
                            .getMaster(),

                        plantShopService
                            .getMaster(),

                        lineService
                            .getMaster(),

                        machineService
                            .getMaster(),

                        deviceService
                            .getMaster(),

                        deviceService
                            .getProtocolConfig(),

                        signalService
                            .getTagDictionary()

                    ]);


                const [

                    configResponse,

                    tagMapResponse,

                    companyResponse,

                    plantShopResponse,

                    lineResponse,

                    machineResponse,

                    deviceResponse,

                    protocolResponse,

                    tagResponse

                ] = results;


                if (
                    configResponse.status ===
                    "fulfilled"
                ) {

                    setConfigs(
                        getCncAdapterRows(
                            configResponse.value
                        )
                    );
                }


                if (
                    tagMapResponse.status ===
                    "fulfilled"
                ) {

                    setTagMaps(
                        getCncAdapterRows(
                            tagMapResponse.value
                        )
                    );
                }


                if (
                    companyResponse.status ===
                    "fulfilled"
                ) {

                    setCompanies(
                        companyResponse
                            .value
                            ?.data
                            ?.data ||
                        []
                    );
                }


                if (
                    plantShopResponse.status ===
                    "fulfilled"
                ) {

                    const data =
                        plantShopResponse
                            .value
                            ?.data
                            ?.data ||
                        [];


                    const uniquePlants = [

                        ...new Map(

                            data
                                .filter(
                                    item =>
                                        item.plant_id
                                )
                                .map(
                                    item => [

                                        String(
                                            item.plant_id
                                        ),

                                        item

                                    ]
                                )

                        ).values()

                    ];


                    const uniqueShops = [

                        ...new Map(

                            data
                                .filter(
                                    item =>
                                        item.shop_id
                                )
                                .map(
                                    item => [

                                        String(
                                            item.shop_id
                                        ),

                                        item

                                    ]
                                )

                        ).values()

                    ];


                    setPlants(
                        uniquePlants
                    );


                    setShops(
                        uniqueShops
                    );
                }


                if (
                    lineResponse.status ===
                    "fulfilled"
                ) {

                    setLines(
                        lineResponse
                            .value
                            ?.data
                            ?.data ||
                        []
                    );
                }


                if (
                    machineResponse.status ===
                    "fulfilled"
                ) {

                    setMachines(
                        machineResponse
                            .value
                            ?.data
                            ?.data ||
                        []
                    );
                }


                if (
                    deviceResponse.status ===
                    "fulfilled"
                ) {

                    setDevices(
                        deviceResponse
                            .value
                            ?.data
                            ?.data ||
                        []
                    );
                }


                if (
                    protocolResponse.status ===
                    "fulfilled"
                ) {

                    setProtocols(
                        protocolResponse
                            .value
                            ?.data
                            ?.data ||
                        []
                    );
                }


                if (
                    tagResponse.status ===
                    "fulfilled"
                ) {

                    setTags(
                        tagResponse
                            .value
                            ?.data
                            ?.data ||
                        []
                    );
                }


                results.forEach(
                    (
                        result,
                        index
                    ) => {

                        if (
                            result.status ===
                            "rejected"
                        ) {

                            console.error(
                                `CNC Adapter lookup API ${index} failed:`,
                                result.reason
                            );
                        }
                    }
                );
            }
            catch (error) {

                console.error(
                    "CNC ADAPTER LOAD ERROR:",
                    error
                );


                showToastMessage(
                    getCncAdapterErrorMessage(
                        error
                    ),
                    "danger"
                );
            }
            finally {

                setLoading(
                    false
                );
            }
        };


    const plantName =
        id => {

            const item =
                plants.find(
                    row =>
                        sameId(
                            row.plant_id,
                            id
                        )
                );


            return (
                item?.plant_name ||
                item?.plant_code ||
                "Unknown Plant"
            );
        };


    const lineName =
        id => {

            const item =
                lines.find(
                    row =>
                        sameId(
                            row.line_id,
                            id
                        )
                );


            return (
                item?.line_name ||
                item?.line_code ||
                "Unknown Line"
            );
        };


    const machineName =
        id => {

            const item =
                machines.find(
                    row =>
                        sameId(
                            row.machine_id,
                            id
                        )
                );


            return (
                item?.machine_name ||
                item?.machine_code ||
                "Unknown Machine"
            );
        };


    const deviceName =
        id => {

            const item =
                devices.find(
                    row =>
                        sameId(
                            row.device_id,
                            id
                        )
                );


            return (
                item?.device_name ||
                item?.device_code ||
                "Unknown Device"
            );
        };


    const protocolName =
        id => {

            const item =
                protocols.find(
                    row =>
                        sameId(
                            row.protocol_id,
                            id
                        )
                );


            return (
                item?.protocol_name ||
                item?.protocol_code ||
                "Unknown Protocol"
            );
        };


    const tagName =
        id => {

            const item =
                tags.find(
                    row =>
                        sameId(
                            row.tag_id,
                            id
                        )
                );


            return (
                item?.tag_name ||
                item?.tag_code ||
                "Unknown Tag"
            );
        };


    const cncConfigName =
        id => {

            const item =
                configs.find(
                    row =>
                        sameId(
                            row.cnc_protocol_id,
                            id
                        )
                );


            return (
                item?.config_name ||
                item?.config_code ||
                "Unknown Configuration"
            );
        };


    const availableConfigShops =
        useMemo(
            () => {

                if (
                    !configForm.plant_id
                ) {

                    return [];
                }


                return shops.filter(
                    shop => {

                        const companyMatch =
                            !configForm.company_id ||
                            !shop.company_id ||
                            sameId(
                                shop.company_id,
                                configForm.company_id
                            );


                        const plantMatch =
                            sameId(
                                shop.plant_id,
                                configForm.plant_id
                            );


                        return (
                            companyMatch &&
                            plantMatch
                        );
                    }
                );
            },
            [
                shops,
                configForm.company_id,
                configForm.plant_id
            ]
        );


    const availableConfigPlants =
        useMemo(
            () => {

                if (
                    !configForm.company_id
                ) {

                    return [];
                }


                return plants.filter(
                    plant =>
                        !plant.company_id ||
                        sameId(
                            plant.company_id,
                            configForm.company_id
                        )
                );
            },
            [
                plants,
                configForm.company_id
            ]
        );


    const availableConfigLines =
        useMemo(
            () => {

                if (
                    !configForm.plant_id
                ) {

                    return [];
                }


                const shopIds =
                    new Set(

                        availableConfigShops
                            .map(
                                shop =>
                                    String(
                                        shop.shop_id
                                    )
                            )
                    );


                return lines.filter(
                    line => {

                        const companyMatch =
                            !configForm.company_id ||
                            !line.company_id ||
                            sameId(
                                line.company_id,
                                configForm.company_id
                            );


                        const shopMatch =
                            line.shop_id &&
                            shopIds.has(
                                String(
                                    line.shop_id
                                )
                            );


                        return (
                            companyMatch &&
                            shopMatch
                        );
                    }
                );
            },
            [
                lines,
                availableConfigShops,
                configForm.company_id,
                configForm.plant_id
            ]
        );


    const availableConfigMachines =
        useMemo(
            () => {

                if (
                    !configForm.plant_id
                ) {

                    return [];
                }


                const plantLineIds =
                    new Set(

                        availableConfigLines
                            .map(
                                line =>
                                    String(
                                        line.line_id
                                    )
                            )
                    );


                return machines.filter(
                    machine => {

                        if (
                            configForm.line_id
                        ) {

                            return sameId(
                                machine.line_id,
                                configForm.line_id
                            );
                        }


                        return plantLineIds.has(
                            String(
                                machine.line_id
                            )
                        );
                    }
                );
            },
            [
                machines,
                availableConfigLines,
                configForm.plant_id,
                configForm.line_id
            ]
        );


    const availableConfigDevices =
        useMemo(
            () => {

                if (
                    !configForm.machine_id
                ) {

                    return [];
                }


                return devices.filter(
                    device => {

                        const machineMatch =
                            sameId(
                                device.machine_id,
                                configForm.machine_id
                            );


                        const currentlySelected =
                            sameId(
                                device.device_id,
                                configForm.device_id
                            );


                        const status =
                            String(
                                device.status ||
                                ""
                            )
                                .trim()
                                .toUpperCase();


                        const statusOk =
                            status !==
                            "RETIRED" ||
                            currentlySelected;


                        return (
                            machineMatch &&
                            statusOk
                        );
                    }
                );
            },
            [
                devices,
                configForm.machine_id,
                configForm.device_id
            ]
        );


    const selectedConfigDevice =
        useMemo(
            () => {

                if (
                    !configForm.device_id
                ) {

                    return null;
                }


                return (
                    devices.find(
                        device =>
                            sameId(
                                device.device_id,
                                configForm.device_id
                            )
                    ) ||
                    null
                );
            },
            [
                devices,
                configForm.device_id
            ]
        );


    const availableConfigProtocols =
        useMemo(
            () => {

                const protocolId =
                    selectedConfigDevice
                        ?.protocol_id ||
                    configForm.protocol_id;


                if (
                    !protocolId
                ) {

                    return [];
                }


                return protocols.filter(
                    protocol =>
                        sameId(
                            protocol.protocol_id,
                            protocolId
                        )
                );
            },
            [
                protocols,
                selectedConfigDevice,
                configForm.protocol_id
            ]
        );


    const setConfigFormWithDependencies =
        updater => {

            setConfigForm(
                previous => {

                    const updated =
                        typeof updater ===
                        "function"
                            ? updater(
                                previous
                            )
                            : updater;


                    const next = {

                        ...previous,

                        ...updated
                    };


                    if (
                        !sameId(
                            previous.company_id,
                            next.company_id
                        )
                    ) {

                        next.plant_id = "";

                        next.line_id = "";

                        next.machine_id = "";

                        next.device_id = "";

                        next.protocol_id = "";


                        return next;
                    }


                    if (
                        !sameId(
                            previous.plant_id,
                            next.plant_id
                        )
                    ) {

                        next.line_id = "";

                        next.machine_id = "";

                        next.device_id = "";

                        next.protocol_id = "";


                        return next;
                    }


                    if (
                        !sameId(
                            previous.line_id,
                            next.line_id
                        )
                    ) {

                        next.machine_id = "";

                        next.device_id = "";

                        next.protocol_id = "";


                        return next;
                    }


                    if (
                        !sameId(
                            previous.machine_id,
                            next.machine_id
                        )
                    ) {

                        next.device_id = "";

                        next.protocol_id = "";


                        const selectedMachine =
                            machines.find(
                                machine =>
                                    sameId(
                                        machine.machine_id,
                                        next.machine_id
                                    )
                            );


                        if (
                            selectedMachine
                                ?.line_id &&
                            !next.line_id
                        ) {

                            next.line_id =
                                selectedMachine.line_id;
                        }


                        return next;
                    }


                    if (
                        !sameId(
                            previous.device_id,
                            next.device_id
                        )
                    ) {

                        const selectedDevice =
                            devices.find(
                                device =>
                                    sameId(
                                        device.device_id,
                                        next.device_id
                                    )
                            );


                        next.protocol_id =
                            selectedDevice
                                ?.protocol_id ||
                            "";


                        return next;
                    }


                    return next;
                }
            );
        };


    const availableTagConfigs =
        useMemo(
            () => {

                return configs.filter(
                    item => {

                        const companyMatch =
                            !tagMapForm.company_id ||
                            sameId(
                                item.company_id,
                                tagMapForm.company_id
                            );


                        const currentlySelected =
                            sameId(
                                item.cnc_protocol_id,
                                tagMapForm.cnc_protocol_id
                            );


                        return (
                            companyMatch &&
                            (
                                toBoolean(
                                    item.is_active
                                ) ||
                                currentlySelected
                            )
                        );
                    }
                );
            },
            [
                configs,
                tagMapForm.company_id,
                tagMapForm.cnc_protocol_id
            ]
        );


    const availableTags =
        useMemo(
            () => {

                return tags.filter(
                    item => {

                        const companyMatch =
                            !tagMapForm.company_id ||
                            !item.company_id ||
                            sameId(
                                item.company_id,
                                tagMapForm.company_id
                            );


                        const currentlySelected =
                            sameId(
                                item.tag_id,
                                tagMapForm.tag_id
                            );


                        const activeOk =
                            item.is_active !==
                            false ||
                            currentlySelected;


                        return (
                            companyMatch &&
                            activeOk
                        );
                    }
                );
            },
            [
                tags,
                tagMapForm.company_id,
                tagMapForm.tag_id
            ]
        );


    const setTagMapFormWithDependencies =
        updater => {

            setTagMapForm(
                previous => {

                    const updated =
                        typeof updater ===
                        "function"
                            ? updater(
                                previous
                            )
                            : updater;


                    const next = {

                        ...previous,

                        ...updated
                    };


                    if (
                        !sameId(
                            previous.company_id,
                            next.company_id
                        )
                    ) {

                        next.cnc_protocol_id = "";

                        next.tag_id = "";
                    }


                    return next;
                }
            );
        };


    const availableExportShops =
        useMemo(
            () => {

                if (
                    !exportForm.plant_id
                ) {

                    return [];
                }


                return shops.filter(
                    shop =>
                        sameId(
                            shop.plant_id,
                            exportForm.plant_id
                        )
                );
            },
            [
                shops,
                exportForm.plant_id
            ]
        );


    const availableExportPlants =
        useMemo(
            () => {

                if (
                    !exportForm.company_id
                ) {

                    return [];
                }


                return plants.filter(
                    plant =>
                        !plant.company_id ||
                        sameId(
                            plant.company_id,
                            exportForm.company_id
                        )
                );
            },
            [
                plants,
                exportForm.company_id
            ]
        );


    const availableExportLines =
        useMemo(
            () => {

                if (
                    !exportForm.plant_id
                ) {

                    return [];
                }


                const shopIds =
                    new Set(

                        availableExportShops
                            .map(
                                shop =>
                                    String(
                                        shop.shop_id
                                    )
                            )
                    );


                return lines.filter(
                    line =>
                        line.shop_id &&
                        shopIds.has(
                            String(
                                line.shop_id
                            )
                        )
                );
            },
            [
                lines,
                availableExportShops,
                exportForm.plant_id
            ]
        );


    const availableExportMachines =
        useMemo(
            () => {

                if (
                    !exportForm.plant_id
                ) {

                    return [];
                }


                const lineIds =
                    new Set(

                        availableExportLines
                            .map(
                                line =>
                                    String(
                                        line.line_id
                                    )
                            )
                    );


                return machines.filter(
                    machine => {

                        if (
                            exportForm.line_id
                        ) {

                            return sameId(
                                machine.line_id,
                                exportForm.line_id
                            );
                        }


                        return lineIds.has(
                            String(
                                machine.line_id
                            )
                        );
                    }
                );
            },
            [
                machines,
                availableExportLines,
                exportForm.plant_id,
                exportForm.line_id
            ]
        );


    const availableExportDevices =
        useMemo(
            () => {

                if (
                    !exportForm.machine_id
                ) {

                    return [];
                }


                return devices.filter(
                    device =>
                        sameId(
                            device.machine_id,
                            exportForm.machine_id
                        )
                );
            },
            [
                devices,
                exportForm.machine_id
            ]
        );


    const setExportFormWithDependencies =
        updater => {

            setExportForm(
                previous => {

                    const updated =
                        typeof updater ===
                        "function"
                            ? updater(
                                previous
                            )
                            : updater;


                    const next = {

                        ...previous,

                        ...updated
                    };


                    if (
                        !sameId(
                            previous.company_id,
                            next.company_id
                        )
                    ) {

                        next.plant_id = "";

                        next.line_id = "";

                        next.machine_id = "";

                        next.device_id = "";


                        return next;
                    }


                    if (
                        !sameId(
                            previous.plant_id,
                            next.plant_id
                        )
                    ) {

                        next.line_id = "";

                        next.machine_id = "";

                        next.device_id = "";


                        return next;
                    }


                    if (
                        !sameId(
                            previous.line_id,
                            next.line_id
                        )
                    ) {

                        next.machine_id = "";

                        next.device_id = "";


                        return next;
                    }


                    if (
                        !sameId(
                            previous.machine_id,
                            next.machine_id
                        )
                    ) {

                        next.device_id = "";


                        return next;
                    }


                    return next;
                }
            );
        };


    const activeConfigCount =
        useMemo(
            () => {

                return configs.filter(
                    item =>
                        toBoolean(
                            item.is_active
                        )
                ).length;
            },
            [
                configs
            ]
        );


    const activeTagMapCount =
        useMemo(
            () => {

                return tagMaps.filter(
                    item =>
                        toBoolean(
                            item.is_active
                        )
                ).length;
            },
            [
                tagMaps
            ]
        );


    const filteredConfigs =
        useMemo(
            () => {

                const search =
                    searchText
                        .trim()
                        .toLowerCase();


                return configs.filter(
                    item => {

                        const searchValue = [

                            item.config_code,

                            item.config_name,

                            item.plant_name ||
                            plantName(
                                item.plant_id
                            ),

                            item.line_name ||
                            lineName(
                                item.line_id
                            ),

                            item.machine_name ||
                            machineName(
                                item.machine_id
                            ),

                            item.device_name ||
                            deviceName(
                                item.device_id
                            ),

                            item.protocol_name ||
                            protocolName(
                                item.protocol_id
                            ),

                            item.status

                        ]
                            .filter(
                                Boolean
                            )
                            .join(
                                " "
                            )
                            .toLowerCase();


                        const matchesSearch =
                            !search ||
                            searchValue.includes(
                                search
                            );


                        const matchesStatus =
                            statusFilter ===
                            "ALL" ||
                            String(
                                item.status ||
                                ""
                            )
                                .toUpperCase() ===
                            statusFilter;


                        return (
                            matchesSearch &&
                            matchesStatus
                        );
                    }
                );
            },
            [
                configs,
                plants,
                lines,
                machines,
                devices,
                protocols,
                searchText,
                statusFilter
            ]
        );


    const filteredTagMaps =
        useMemo(
            () => {

                const search =
                    searchText
                        .trim()
                        .toLowerCase();


                return tagMaps.filter(
                    item => {

                        const searchValue = [

                            item.source_key,

                            item.source_type,

                            item.event_trigger_code,

                            item.runtime_storage_mode,

                            item.tag_name ||
                            tagName(
                                item.tag_id
                            ),

                            item.config_name ||
                            cncConfigName(
                                item.cnc_protocol_id
                            ),

                            item.status

                        ]
                            .filter(
                                Boolean
                            )
                            .join(
                                " "
                            )
                            .toLowerCase();


                        const matchesSearch =
                            !search ||
                            searchValue.includes(
                                search
                            );


                        const matchesStatus =
                            statusFilter ===
                            "ALL" ||
                            String(
                                item.status ||
                                ""
                            )
                                .toUpperCase() ===
                            statusFilter;


                        return (
                            matchesSearch &&
                            matchesStatus
                        );
                    }
                );
            },
            [
                tagMaps,
                tags,
                configs,
                searchText,
                statusFilter
            ]
        );


    const changeTab =
        tab => {

            setActiveTab(
                tab
            );


            setSearchText(
                ""
            );


            setStatusFilter(
                "ALL"
            );
        };


    const openConfig =
        config => {

            const selected =
                config ||
                null;


            setEditingConfig(
                selected
            );


            if (
                !selected
            ) {

                setConfigForm({

                    ...configInitialState
                });


                setShowConfigForm(
                    true
                );


                return;
            }


            setConfigForm({

                ...configInitialState,

                ...selected,


                is_active:

                    toBoolean(
                        selected.is_active
                    )

                        ? "true"

                        : "false",


                effective_date:

                    toLocalInputDateTime(
                        selected.effective_date
                    ),


                effective_to:

                    toLocalInputDateTime(
                        selected.effective_to
                    ),


                protocol_settings:

                    safeJsonString(
                        selected.protocol_settings
                    ),


                status_config:

                    safeJsonString(
                        selected.status_config
                    ),


                validation_config:

                    safeJsonString(
                        selected.validation_config
                    ),


                threshold_config:

                    safeJsonString(
                        selected.threshold_config
                    ),


                dashboard_visibility_config:

                    safeJsonString(
                        selected.dashboard_visibility_config
                    ),


                report_filter_config:

                    safeJsonString(
                        selected.report_filter_config
                    ),


                interlock_rule_config:

                    safeJsonString(
                        selected.interlock_rule_config
                    ),


                notification_rule_config:

                    safeJsonString(
                        selected.notification_rule_config
                    ),


                retention_policy_config:

                    safeJsonString(
                        selected.retention_policy_config
                    ),


                field_config:

                    safeJsonString(
                        selected.field_config
                    ),


                approval_workflow_config:

                    safeJsonString(
                        selected.approval_workflow_config
                    ),


                role_permission_config:

                    safeJsonString(
                        selected.role_permission_config
                    )

            });


            setShowConfigForm(
                true
            );
        };


    const saveConfig =
        async () => {

            try {

                if (
                    !configForm.company_id
                ) {

                    showToastMessage(
                        "Please select Company.",
                        "warning"
                    );


                    return;
                }


                if (
                    !configForm.plant_id
                ) {

                    showToastMessage(
                        "Please select Plant.",
                        "warning"
                    );


                    return;
                }


                if (
                    !configForm.machine_id
                ) {

                    showToastMessage(
                        "Please select Machine.",
                        "warning"
                    );


                    return;
                }


                if (
                    !configForm.device_id
                ) {

                    showToastMessage(
                        "Please select Device.",
                        "warning"
                    );


                    return;
                }


                if (
                    !configForm.protocol_id
                ) {

                    showToastMessage(
                        "Selected Device does not have a Protocol configured in Device Master.",
                        "warning"
                    );


                    return;
                }


                setSaving(
                    true
                );


                const payload = {

                    company_id:
                        configForm.company_id,


                    plant_id:
                        configForm.plant_id,


                    line_id:
                        nullable(
                            configForm.line_id
                        ),


                    machine_id:
                        configForm.machine_id,


                    device_id:
                        configForm.device_id,


                    protocol_id:
                        configForm.protocol_id,


                    config_code:
                        configForm
                            .config_code
                            .trim(),


                    config_name:
                        configForm
                            .config_name
                            .trim(),


                    polling_ms:
                        Number(
                            configForm.polling_ms
                        ),


                    timeout_ms:
                        Number(
                            configForm.timeout_ms
                        ),


                    reconnect_interval_ms:
                        Number(
                            configForm
                                .reconnect_interval_ms
                        ),


                    max_retry_count:
                        Number(
                            configForm.max_retry_count
                        ),


                    protocol_settings:
                        parseJsonObject(
                            configForm.protocol_settings,
                            "Protocol Settings"
                        ),


                    effective_date:
                        nullable(
                            configForm.effective_date
                        ),


                    effective_to:
                        nullable(
                            configForm.effective_to
                        ),


                    status:
                        configForm.status,


                    is_active:
                        toBoolean(
                            configForm.is_active
                        ),


                    status_config:
                        parseJsonObject(
                            configForm.status_config,
                            "Status Config"
                        ),


                    validation_config:
                        parseJsonObject(
                            configForm.validation_config,
                            "Validation Config"
                        ),


                    threshold_config:
                        parseJsonObject(
                            configForm.threshold_config,
                            "Threshold Config"
                        ),


                    dashboard_visibility_config:
                        parseJsonObject(
                            configForm
                                .dashboard_visibility_config,
                            "Dashboard Visibility Config"
                        ),


                    report_filter_config:
                        parseJsonObject(
                            configForm.report_filter_config,
                            "Report Filter Config"
                        ),


                    event_trigger_code:
                        nullable(
                            configForm.event_trigger_code
                        ),


                    interlock_rule_config:
                        parseJsonObject(
                            configForm.interlock_rule_config,
                            "Interlock Rule Config"
                        ),


                    notification_rule_config:
                        parseJsonObject(
                            configForm.notification_rule_config,
                            "Notification Rule Config"
                        ),


                    retention_policy_config:
                        parseJsonObject(
                            configForm.retention_policy_config,
                            "Retention Policy Config"
                        ),


                    field_config:
                        parseJsonObject(
                            configForm.field_config,
                            "Field Config"
                        ),


                    approval_workflow_config:
                        parseJsonObject(
                            configForm.approval_workflow_config,
                            "Approval Workflow Config"
                        ),


                    role_permission_config:
                        parseJsonObject(
                            configForm.role_permission_config,
                            "Role Permission Config"
                        )
                };


                if (
                    editingConfig
                        ?.cnc_protocol_id
                ) {

                    payload.cnc_protocol_id =
                        editingConfig
                            .cnc_protocol_id;
                }


                await cncAdapterService
                    .saveConfig(
                        payload
                    );


                showToastMessage(
                    editingConfig

                        ? "CNC configuration updated successfully."

                        : "CNC configuration created successfully."
                );


                setShowConfigForm(
                    false
                );


                setEditingConfig(
                    null
                );


                setConfigForm({

                    ...configInitialState
                });


                await loadInitialData();
            }
            catch (error) {

                showToastMessage(
                    getCncAdapterErrorMessage(
                        error
                    ),
                    "danger"
                );
            }
            finally {

                setSaving(
                    false
                );
            }
        };


    const openTagMap =
        map => {

            const selected =
                map ||
                null;


            setEditingTagMap(
                selected
            );


            if (
                !selected
            ) {

                setTagMapForm({

                    ...tagMapInitialState
                });


                setShowTagMapForm(
                    true
                );


                return;
            }


            setTagMapForm({

                ...tagMapInitialState,

                ...selected,


                is_active:

                    toBoolean(
                        selected.is_active
                    )

                        ? "true"

                        : "false",


                runtime_storage_mode:

                    selected.runtime_storage_mode ||

                    "EVENT_ONLY",


                effective_date:

                    "",


                effective_to:

                    "",


                value_mapping_config:

                    safeJsonString(
                        selected.value_mapping_config
                    ),


                transform_config:

                    safeJsonString(
                        selected.transform_config
                    ),


                change_detection_config:

                    safeJsonString(
                        selected.change_detection_config
                    ),


                threshold_config:

                    safeJsonString(
                        selected.threshold_config
                    ),


                interlock_rule_config:

                    safeJsonString(
                        selected.interlock_rule_config
                    ),


                bypass_rule_config:

                    safeJsonString(
                        selected.bypass_rule_config
                    ),


                notification_rule_config:

                    safeJsonString(
                        selected.notification_rule_config
                    ),


                retention_policy_config:

                    safeJsonString(
                        selected.retention_policy_config
                    ),


                status_config:

                    safeJsonString(
                        selected.status_config
                    ),


                field_config:

                    safeJsonString(
                        selected.field_config
                    ),


                validation_config:

                    safeJsonString(
                        selected.validation_config
                    ),


                approval_workflow_config:

                    safeJsonString(
                        selected.approval_workflow_config
                    ),


                role_permission_config:

                    safeJsonString(
                        selected.role_permission_config
                    ),


                dashboard_visibility_config:

                    safeJsonString(
                        selected.dashboard_visibility_config
                    ),


                report_filter_config:

                    safeJsonString(
                        selected.report_filter_config
                    )

            });


            setShowTagMapForm(
                true
            );
        };


    const saveTagMap =
        async () => {

            try {

                setSaving(
                    true
                );


                const payload = {

                    company_id:
                        tagMapForm.company_id,


                    cnc_protocol_id:
                        tagMapForm.cnc_protocol_id,


                    tag_id:
                        tagMapForm.tag_id,


                    source_key:
                        tagMapForm
                            .source_key
                            .trim(),


                    source_type:
                        nullable(
                            tagMapForm.source_type
                        ),


                    status:
                        tagMapForm.status,


                    is_active:
                        toBoolean(
                            tagMapForm.is_active
                        ),


                    effective_date:
                        nullable(
                            tagMapForm.effective_date
                        ),


                    effective_to:
                        nullable(
                            tagMapForm.effective_to
                        ),


                    event_trigger_code:
                        nullable(
                            tagMapForm.event_trigger_code
                        ),


                    runtime_storage_mode:
                        String(
                            tagMapForm.runtime_storage_mode ||
                            "EVENT_ONLY"
                        )
                            .trim()
                            .toUpperCase(),


                    value_mapping_config:
                        parseJsonObject(
                            tagMapForm.value_mapping_config,
                            "Value Mapping Config"
                        ),


                    transform_config:
                        parseJsonObject(
                            tagMapForm.transform_config,
                            "Transform Config"
                        ),


                    change_detection_config:
                        parseJsonObject(
                            tagMapForm.change_detection_config,
                            "Change Detection Config"
                        ),


                    threshold_config:
                        parseJsonObject(
                            tagMapForm.threshold_config,
                            "Threshold Config"
                        ),


                    interlock_rule_config:
                        parseJsonObject(
                            tagMapForm.interlock_rule_config,
                            "Interlock Rule Config"
                        ),


                    bypass_rule_config:
                        parseJsonObject(
                            tagMapForm.bypass_rule_config,
                            "Bypass Rule Config"
                        ),


                    notification_rule_config:
                        parseJsonObject(
                            tagMapForm.notification_rule_config,
                            "Notification Rule Config"
                        ),


                    retention_policy_config:
                        parseJsonObject(
                            tagMapForm.retention_policy_config,
                            "Retention Policy Config"
                        ),


                    status_config:
                        parseJsonObject(
                            tagMapForm.status_config,
                            "Status Config"
                        ),


                    field_config:
                        parseJsonObject(
                            tagMapForm.field_config,
                            "Field Config"
                        ),


                    validation_config:
                        parseJsonObject(
                            tagMapForm.validation_config,
                            "Validation Config"
                        ),


                    approval_workflow_config:
                        parseJsonObject(
                            tagMapForm.approval_workflow_config,
                            "Approval Workflow Config"
                        ),


                    role_permission_config:
                        parseJsonObject(
                            tagMapForm.role_permission_config,
                            "Role Permission Config"
                        ),


                    dashboard_visibility_config:
                        parseJsonObject(
                            tagMapForm.dashboard_visibility_config,
                            "Dashboard Visibility Config"
                        ),


                    report_filter_config:
                        parseJsonObject(
                            tagMapForm.report_filter_config,
                            "Report Filter Config"
                        )
                };


                if (
                    editingTagMap
                        ?.cnc_tag_id
                ) {

                    await cncAdapterService
                        .updateMaster(
                            editingTagMap
                                .cnc_tag_id,
                            payload
                        );
                }
                else {

                    await cncAdapterService
                        .createMaster(
                            payload
                        );
                }


                showToastMessage(
                    editingTagMap

                        ? "CNC tag mapping updated successfully."

                        : "CNC tag mapping created successfully."
                );


                setShowTagMapForm(
                    false
                );


                setEditingTagMap(
                    null
                );


                setTagMapForm({

                    ...tagMapInitialState
                });


                await loadInitialData();
            }
            catch (error) {

                showToastMessage(
                    getCncAdapterErrorMessage(
                        error
                    ),
                    "danger"
                );
            }
            finally {

                setSaving(
                    false
                );
            }
        };


    const loadRuntime =
        async (
            type = "EVENT"
        ) => {

            try {

                setLoading(
                    true
                );


                const normalizedRuntimeType =
                    String(
                        type ||
                        "EVENT"
                    )
                        .trim()
                        .toUpperCase();


                const response =
                    await cncAdapterService
                        .getRuntime({

                            runtime_type:
                                normalizedRuntimeType,

                            limit:
                                100,

                            offset:
                                0
                        });


                setRuntimeType(
                    normalizedRuntimeType
                );


                setRuntimeRows(
                    getCncAdapterRows(
                        response
                    )
                );


                setShowRuntime(
                    true
                );
            }
            catch (error) {

                showToastMessage(
                    getCncAdapterErrorMessage(
                        error
                    ),
                    "danger"
                );
            }
            finally {

                setLoading(
                    false
                );
            }
        };


    const getReportCompanyId =
        () => {

            const active =
                configs.find(
                    item =>
                        toBoolean(
                            item.is_active
                        )
                );


            return (
                active?.company_id ||
                configs[0]?.company_id ||
                ""
            );
        };


    const loadReport =
        async () => {

            try {

                const companyId =
                    getReportCompanyId();


                if (
                    !companyId
                ) {

                    showToastMessage(
                        "Create or load a CNC configuration before opening the report.",
                        "warning"
                    );


                    return;
                }


                setLoading(
                    true
                );


                const response =
                    await cncAdapterService
                        .getReport({

                            company_id:
                                companyId,

                            limit:
                                500,

                            offset:
                                0
                        });


                setReportRows(
                    getCncAdapterRows(
                        response
                    )
                );


                setReportMeta(
                    getCncAdapterMeta(
                        response
                    )
                );


                setShowReport(
                    true
                );
            }
            catch (error) {

                showToastMessage(
                    getCncAdapterErrorMessage(
                        error
                    ),
                    "danger"
                );
            }
            finally {

                setLoading(
                    false
                );
            }
        };


    const openExport =
        () => {

            const companyId =
                getReportCompanyId();


            if (
                !companyId
            ) {

                showToastMessage(
                    "Create or load a CNC configuration before exporting data.",
                    "warning"
                );


                return;
            }


            setExportForm({

                ...exportInitialState,


                company_id:
                    companyId
            });


            setShowExport(
                true
            );
        };


    const exportData =
        async () => {

            try {

                setExporting(
                    true
                );


                const response =
                    await cncAdapterService
                        .exportData({

                            ...exportForm,


                            plant_id:
                                nullable(
                                    exportForm.plant_id
                                ),


                            line_id:
                                nullable(
                                    exportForm.line_id
                                ),


                            machine_id:
                                nullable(
                                    exportForm.machine_id
                                ),


                            device_id:
                                nullable(
                                    exportForm.device_id
                                ),


                            event_code:
                                nullable(
                                    exportForm.event_code
                                ),


                            from_timestamp:
                                nullable(
                                    exportForm.from_timestamp
                                ),


                            to_timestamp:
                                nullable(
                                    exportForm.to_timestamp
                                )

                        });


                if (
                    String(
                        exportForm.format
                    )
                        .toUpperCase() ===
                    "CSV"
                ) {

                    cncAdapterService
                        .downloadCsv(
                            response
                        );


                    showToastMessage(
                        "CNC Adapter CSV exported successfully."
                    );
                }
                else {

                    showToastMessage(
                        "CNC Adapter JSON export prepared successfully."
                    );
                }


                setShowExport(
                    false
                );
            }
            catch (error) {

                showToastMessage(
                    getCncAdapterErrorMessage(
                        error
                    ),
                    "danger"
                );
            }
            finally {

                setExporting(
                    false
                );
            }
        };


    const configFields = [

        {
            name:
                "company_id",

            label:
                "Company",

            type:
                "select",

            required:
                true,

            options:
                companies.map(
                    item => ({

                        value:
                            item.company_id,

                        label:
                            item.company_name ||
                            item.company_code ||
                            "Unnamed Company"
                    })
                )
        },

        {
            name:
                "plant_id",

            label:
                "Plant",

            type:
                "select",

            required:
                true,

            disabled:
                !configForm.company_id,

            options:
                availableConfigPlants.map(
                    item => ({

                        value:
                            item.plant_id,

                        label:
                            item.plant_name ||
                            item.plant_code ||
                            "Unnamed Plant"
                    })
                )
        },

        {
            name:
                "line_id",

            label:
                "Line",

            type:
                "select",

            disabled:
                !configForm.plant_id,

            options:
                availableConfigLines.map(
                    item => ({

                        value:
                            item.line_id,

                        label:
                            item.line_name ||
                            item.line_code ||
                            "Unnamed Line"
                    })
                )
        },

        {
            name:
                "machine_id",

            label:
                "Machine",

            type:
                "select",

            required:
                true,

            disabled:
                !configForm.plant_id,

            options:
                availableConfigMachines.map(
                    item => ({

                        value:
                            item.machine_id,

                        label:
                            item.machine_name ||
                            item.machine_code ||
                            "Unnamed Machine"
                    })
                )
        },

        {
            name:
                "device_id",

            label:
                "Device",

            type:
                "select",

            required:
                true,

            disabled:
                !configForm.machine_id,

            options:
                availableConfigDevices.map(
                    item => ({

                        value:
                            item.device_id,

                        label:
                            item.device_name ||
                            item.device_code ||
                            "Unnamed Device"
                    })
                )
        },

        {
            name:
                "protocol_id",

            label:
                "Protocol",

            type:
                "select",

            required:
                true,

            disabled:
                true,

            options:
                availableConfigProtocols.map(
                    item => ({

                        value:
                            item.protocol_id,

                        label:
                            item.protocol_name ||
                            item.protocol_code ||
                            "Unnamed Protocol"
                    })
                )
        },

        {
            name:
                "config_code",

            label:
                "Config Code",

            type:
                "text",

            required:
                true
        },

        {
            name:
                "config_name",

            label:
                "Config Name",

            type:
                "text",

            required:
                true
        },

        {
            name:
                "polling_ms",

            label:
                "Polling (ms)",

            type:
                "number",

            required:
                true
        },

        {
            name:
                "timeout_ms",

            label:
                "Timeout (ms)",

            type:
                "number",

            required:
                true
        },

        {
            name:
                "reconnect_interval_ms",

            label:
                "Reconnect Interval (ms)",

            type:
                "number",

            required:
                true
        },

        {
            name:
                "max_retry_count",

            label:
                "Max Retry Count",

            type:
                "number"
        },

        {
            name:
                "effective_date",

            label:
                "Effective Date",

            type:
                "datetime-local"
        },

        {
            name:
                "effective_to",

            label:
                "Effective To",

            type:
                "datetime-local"
        },

        {
            name:
                "status",

            label:
                "Status",

            type:
                "select",

            required:
                true,

            options: [

                {
                    value:
                        "ACTIVE",

                    label:
                        "ACTIVE"
                },

                {
                    value:
                        "INACTIVE",

                    label:
                        "INACTIVE"
                },

                {
                    value:
                        "DRAFT",

                    label:
                        "DRAFT"
                }

            ]
        },

        {
            name:
                "is_active",

            label:
                "Active",

            type:
                "select",

            options: [

                {
                    value:
                        "true",

                    label:
                        "Yes"
                },

                {
                    value:
                        "false",

                    label:
                        "No"
                }

            ]
        },

        {
            name:
                "protocol_settings",

            label:
                "Protocol Settings JSON",

            type:
                "textarea",

            rows:
                4
        },

        {
            name:
                "event_trigger_code",

            label:
                "Event Trigger Code",

            type:
                "text"
        },

        {
            name:
                "status_config",

            label:
                "Status Config JSON",

            type:
                "textarea"
        },

        {
            name:
                "validation_config",

            label:
                "Validation Config JSON",

            type:
                "textarea"
        },

        {
            name:
                "threshold_config",

            label:
                "Threshold Config JSON",

            type:
                "textarea"
        },

        {
            name:
                "interlock_rule_config",

            label:
                "Interlock Rule JSON",

            type:
                "textarea"
        },

        {
            name:
                "notification_rule_config",

            label:
                "Notification Rule JSON",

            type:
                "textarea"
        },

        {
            name:
                "retention_policy_config",

            label:
                "Retention Policy JSON",

            type:
                "textarea"
        },

        {
            name:
                "field_config",

            label:
                "Field Config JSON",

            type:
                "textarea"
        },

        {
            name:
                "dashboard_visibility_config",

            label:
                "Dashboard Visibility JSON",

            type:
                "textarea"
        },

        {
            name:
                "report_filter_config",

            label:
                "Report Filter JSON",

            type:
                "textarea"
        },

        {
            name:
                "approval_workflow_config",

            label:
                "Approval Workflow JSON",

            type:
                "textarea"
        },

        {
            name:
                "role_permission_config",

            label:
                "Role Permission JSON",

            type:
                "textarea"
        }

    ];


    const tagMapFields = [

        {
            name:
                "company_id",

            label:
                "Company",

            type:
                "select",

            required:
                true,

            options:
                companies.map(
                    item => ({

                        value:
                            item.company_id,

                        label:
                            item.company_name ||
                            item.company_code ||
                            "Unnamed Company"
                    })
                )
        },

        {
            name:
                "cnc_protocol_id",

            label:
                "CNC Configuration",

            type:
                "select",

            required:
                true,

            disabled:
                !tagMapForm.company_id,

            options:
                availableTagConfigs.map(
                    item => ({

                        value:
                            item.cnc_protocol_id,

                        label:
                            item.config_name

                                ? (
                                    item.config_code

                                        ? `${item.config_name} (${item.config_code})`

                                        : item.config_name
                                )

                                : (
                                    item.config_code ||
                                    "Unnamed Configuration"
                                )
                    })
                )
        },

        {
            name:
                "tag_id",

            label:
                "OperateX Tag",

            type:
                "select",

            required:
                true,

            disabled:
                !tagMapForm.company_id,

            options:
                availableTags.map(
                    item => ({

                        value:
                            item.tag_id,

                        label:
                            item.tag_name

                                ? (
                                    item.tag_code

                                        ? `${item.tag_name} (${item.tag_code})`

                                        : item.tag_name
                                )

                                : (
                                    item.tag_code ||
                                    "Unnamed Tag"
                                )
                    })
                )
        },

        {
            name:
                "source_key",

            label:
                "Source Key",

            type:
                "text",

            required:
                true
        },

        {
            name:
                "source_type",

            label:
                "Source Type",

            type:
                "text"
        },

        {
            name:
                "event_trigger_code",

            label:
                "Event Trigger Code",

            type:
                "text"
        },

        {
            name:
                "runtime_storage_mode",

            label:
                "Runtime Storage",

            type:
                "select",

            required:
                true,

            options: [

                {
                    value:
                        "EVENT_ONLY",

                    label:
                        "Event Only"
                },

                {
                    value:
                        "MONITORING_ONLY",

                    label:
                        "Monitoring Only"
                },

                {
                    value:
                        "BOTH",

                    label:
                        "Event + Monitoring"
                }

            ]
        },

        {
            name:
                "effective_date",

            label:
                "Effective Date",

            type:
                "datetime-local"
        },

        {
            name:
                "effective_to",

            label:
                "Effective To",

            type:
                "datetime-local"
        },

        {
            name:
                "status",

            label:
                "Status",

            type:
                "select",

            options: [

                {
                    value:
                        "ACTIVE",

                    label:
                        "ACTIVE"
                },

                {
                    value:
                        "INACTIVE",

                    label:
                        "INACTIVE"
                },

                {
                    value:
                        "DRAFT",

                    label:
                        "DRAFT"
                }

            ]
        },

        {
            name:
                "is_active",

            label:
                "Active",

            type:
                "select",

            options: [

                {
                    value:
                        "true",

                    label:
                        "Yes"
                },

                {
                    value:
                        "false",

                    label:
                        "No"
                }

            ]
        },

        {
            name:
                "change_detection_config",

            label:
                "Change Detection JSON",

            type:
                "textarea"
        },

        {
            name:
                "value_mapping_config",

            label:
                "Value Mapping JSON",

            type:
                "textarea"
        },

        {
            name:
                "transform_config",

            label:
                "Transform Config JSON",

            type:
                "textarea"
        },

        {
            name:
                "threshold_config",

            label:
                "Threshold Config JSON",

            type:
                "textarea"
        },

        {
            name:
                "interlock_rule_config",

            label:
                "Interlock Rule JSON",

            type:
                "textarea"
        },

        {
            name:
                "bypass_rule_config",

            label:
                "Bypass Rule JSON",

            type:
                "textarea"
        },

        {
            name:
                "notification_rule_config",

            label:
                "Notification Rule JSON",

            type:
                "textarea"
        },

        {
            name:
                "retention_policy_config",

            label:
                "Retention Policy JSON",

            type:
                "textarea"
        },

        {
            name:
                "validation_config",

            label:
                "Validation Config JSON",

            type:
                "textarea"
        },

        {
            name:
                "field_config",

            label:
                "Field Config JSON",

            type:
                "textarea"
        },

        {
            name:
                "dashboard_visibility_config",

            label:
                "Dashboard Visibility JSON",

            type:
                "textarea"
        },

        {
            name:
                "report_filter_config",

            label:
                "Report Filter JSON",

            type:
                "textarea"
        }

    ];


    const configColumns = [

        {
            key:
                "config_code",

            label:
                "Config Code"
        },

        {
            key:
                "config_name",

            label:
                "Configuration"
        },

        {
            key:
                "plant_id",

            label:
                "Plant",

            render:
                row =>
                    row.plant_name ||
                    plantName(
                        row.plant_id
                    )
        },

        {
            key:
                "line_id",

            label:
                "Line",

            render:
                row => {

                    if (
                        !row.line_id
                    ) {

                        return "-";
                    }


                    return (
                        row.line_name ||
                        lineName(
                            row.line_id
                        )
                    );
                }
        },

        {
            key:
                "machine_id",

            label:
                "Machine",

            render:
                row =>
                    row.machine_name ||
                    machineName(
                        row.machine_id
                    )
        },

        {
            key:
                "device_id",

            label:
                "Device",

            render:
                row =>
                    row.device_name ||
                    deviceName(
                        row.device_id
                    )
        },

        {
            key:
                "protocol_id",

            label:
                "Protocol",

            render:
                row =>
                    row.protocol_name ||
                    protocolName(
                        row.protocol_id
                    )
        },

        {
            key:
                "polling_ms",

            label:
                "Polling"
        },

        {
            key:
                "version_no",

            label:
                "Version"
        },

        {
            key:
                "effective_date",

            label:
                "Effective From",

            render:
                row =>
                    displayDateTime(
                        row.effective_date
                    )
        },

        {
            key:
                "status",

            label:
                "Status",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.status
                        }
                    />
                )
        }

    ];


    const tagColumns = [

        {
            key:
                "cnc_protocol_id",

            label:
                "CNC Configuration",

            render:
                row =>
                    row.config_name ||
                    cncConfigName(
                        row.cnc_protocol_id
                    )
        },

        {
            key:
                "source_key",

            label:
                "Source Key"
        },

        {
            key:
                "source_type",

            label:
                "Source Type"
        },

        {
            key:
                "tag_id",

            label:
                "OperateX Tag",

            render:
                row =>
                    row.tag_name ||
                    tagName(
                        row.tag_id
                    )
        },

        {
            key:
                "event_trigger_code",

            label:
                "Event Trigger"
        },

        {
            key:
                "runtime_storage_mode",

            label:
                "Storage",

            render:
                row => {

                    const mode =
                        String(
                            row.runtime_storage_mode ||
                            "EVENT_ONLY"
                        )
                            .trim()
                            .toUpperCase();


                    if (
                        mode ===
                        "MONITORING_ONLY"
                    ) {

                        return "Monitoring";
                    }


                    if (
                        mode ===
                        "BOTH"
                    ) {

                        return "Event + Monitoring";
                    }


                    return "Event";
                }
        },

        {
            key:
                "version_no",

            label:
                "Version"
        },

        {
            key:
                "is_active",

            label:
                "Active",

            render:
                row => (

                    <StatusBadge
                        status={
                            toBoolean(
                                row.is_active
                            )

                                ? "ACTIVE"

                                : "INACTIVE"
                        }
                    />
                )
        }

    ];


    const runtimeColumns = [

        {
            key:
                "event_ts",

            label:
                "Event Time",

            render:
                row =>
                    displayDateTime(
                        row.event_ts
                    )
        },

        {
            key:
                "machine_id",

            label:
                "Machine",

            render:
                row =>
                    row.machine_name ||
                    machineName(
                        row.machine_id
                    )
        },

        {
            key:
                "device_id",

            label:
                "Device",

            render:
                row =>
                    row.device_name ||
                    deviceName(
                        row.device_id
                    )
        },

        {
            key:
                "tag_id",

            label:
                "Tag",

            render:
                row => {

                    if (
                        !row.tag_id
                    ) {

                        return "-";
                    }


                    return (
                        row.tag_name ||
                        tagName(
                            row.tag_id
                        )
                    );
                }
        },

        {
            key:
                "event_code",

            label:
                "Event"
        },

        {
            key:
                "raw_value",

            label:
                "Raw Value"
        },

        {
            key:
                "normalized_value",

            label:
                "Normalized"
        },

        {
            key:
                "quality_code",

            label:
                "Quality",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.quality_code
                        }
                    />
                )
        },

        {
            key:
                "result_status",

            label:
                "Result",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.result_status ||
                            "-"
                        }
                    />
                )
        }

    ];


    const monitoringColumns = [

        {
            key:
                "event_ts",

            label:
                "Event Time",

            render:
                row =>
                    displayDateTime(
                        row.event_ts
                    )
        },

        {
            key:
                "machine_id",

            label:
                "Machine",

            render:
                row =>
                    row.machine_name ||
                    machineName(
                        row.machine_id
                    )
        },

        {
            key:
                "device_id",

            label:
                "Device",

            render:
                row =>
                    row.device_name ||
                    deviceName(
                        row.device_id
                    )
        },

        {
            key:
                "tag_id",

            label:
                "Tag",

            render:
                row => {

                    if (
                        !row.tag_id
                    ) {

                        return "-";
                    }


                    return (
                        row.tag_name ||
                        tagName(
                            row.tag_id
                        )
                    );
                }
        },

        {
            key:
                "value_numeric",

            label:
                "Numeric Value",

            render:
                row =>
                    displayRuntimeValue(
                        row.value_numeric
                    )
        },

        {
            key:
                "value_text",

            label:
                "Text Value",

            render:
                row =>
                    displayRuntimeValue(
                        row.value_text
                    )
        },

        {
            key:
                "value_boolean",

            label:
                "Boolean Value",

            render:
                row =>
                    displayRuntimeValue(
                        row.value_boolean
                    )
        },

        {
            key:
                "unit_code",

            label:
                "Unit",

            render:
                row =>
                    displayRuntimeValue(
                        row.unit_code
                    )
        },

        {
            key:
                "quality",

            label:
                "Quality",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.quality ||
                            "-"
                        }
                    />
                )
        },

        {
            key:
                "sample_type",

            label:
                "Sample Type",

            render:
                row =>
                    displayRuntimeValue(
                        row.sample_type
                    )
        },

        {
            key:
                "sample_interval_ms",

            label:
                "Sample Interval (ms)",

            render:
                row =>
                    displayRuntimeValue(
                        row.sample_interval_ms
                    )
        },

        {
            key:
                "source_system",

            label:
                "Source System",

            render:
                row =>
                    displayRuntimeValue(
                        row.source_system
                    )
        }

    ];


    const exportFilters = [

        {
            name:
                "company_id",

            label:
                "Company",

            type:
                "select",

            required:
                true,

            options:
                companies.map(
                    item => ({

                        value:
                            item.company_id,

                        label:
                            item.company_name ||
                            item.company_code ||
                            "Unnamed Company"
                    })
                )
        },

        {
            name:
                "plant_id",

            label:
                "Plant",

            type:
                "select",

            disabled:
                !exportForm.company_id,

            options:
                availableExportPlants.map(
                    item => ({

                        value:
                            item.plant_id,

                        label:
                            item.plant_name ||
                            item.plant_code ||
                            "Unnamed Plant"
                    })
                )
        },

        {
            name:
                "line_id",

            label:
                "Line",

            type:
                "select",

            disabled:
                !exportForm.plant_id,

            options:
                availableExportLines.map(
                    item => ({

                        value:
                            item.line_id,

                        label:
                            item.line_name ||
                            item.line_code ||
                            "Unnamed Line"
                    })
                )
        },

        {
            name:
                "machine_id",

            label:
                "Machine",

            type:
                "select",

            disabled:
                !exportForm.plant_id,

            options:
                availableExportMachines.map(
                    item => ({

                        value:
                            item.machine_id,

                        label:
                            item.machine_name ||
                            item.machine_code ||
                            "Unnamed Machine"
                    })
                )
        },

        {
            name:
                "device_id",

            label:
                "Device",

            type:
                "select",

            disabled:
                !exportForm.machine_id,

            options:
                availableExportDevices.map(
                    item => ({

                        value:
                            item.device_id,

                        label:
                            item.device_name ||
                            item.device_code ||
                            "Unnamed Device"
                    })
                )
        },

        {
            name:
                "event_code",

            label:
                "Event Code",

            type:
                "text"
        },

        {
            name:
                "from_timestamp",

            label:
                "From",

            type:
                "datetime-local"
        },

        {
            name:
                "to_timestamp",

            label:
                "To",

            type:
                "datetime-local"
        }

    ];


    const currentTitle =
        activeTab ===
        TAB_CONFIG

            ? "CNC Protocol Configuration"

            : "CNC Tag / Signal Mapping";


    const currentSubtitle =
        activeTab ===
        TAB_CONFIG

            ? "Configure CNC communication, polling, retry and effective configuration."

            : "Map CNC source signals to normalized OperateX tags and events.";


    return (

        <div className="cnc-adapter-page">


            <PageHeader
                title="CNC Adapter"
                subtitle="CNC connectivity configuration, tag mapping, event runtime, monitoring runtime and reporting."
            />


            <Row className="g-3 mb-3">


                <Col
                    xl={3}
                    md={6}
                >

                    <Card className="border-0 shadow-sm h-100">

                        <Card.Body>

                            <div className="text-muted small">

                                Configurations

                            </div>

                            <div className="fs-4 fw-semibold">

                                {configs.length}

                            </div>

                        </Card.Body>

                    </Card>

                </Col>


                <Col
                    xl={3}
                    md={6}
                >

                    <Card className="border-0 shadow-sm h-100">

                        <Card.Body>

                            <div className="text-muted small">

                                Active Configurations

                            </div>

                            <div className="fs-4 fw-semibold">

                                {activeConfigCount}

                            </div>

                        </Card.Body>

                    </Card>

                </Col>


                <Col
                    xl={3}
                    md={6}
                >

                    <Card className="border-0 shadow-sm h-100">

                        <Card.Body>

                            <div className="text-muted small">

                                Tag Mappings

                            </div>

                            <div className="fs-4 fw-semibold">

                                {tagMaps.length}

                            </div>

                        </Card.Body>

                    </Card>

                </Col>


                <Col
                    xl={3}
                    md={6}
                >

                    <Card className="border-0 shadow-sm h-100">

                        <Card.Body>

                            <div className="text-muted small">

                                Active Tag Mappings

                            </div>

                            <div className="fs-4 fw-semibold">

                                {activeTagMapCount}

                            </div>

                        </Card.Body>

                    </Card>

                </Col>


            </Row>


            <Card className="border-0 shadow-sm mb-3">

                <Card.Body>


                    <div className="d-flex flex-wrap gap-2">


                        <Button

                            variant={

                                activeTab ===
                                TAB_CONFIG

                                    ? "primary"

                                    : "outline-primary"
                            }

                            onClick={() =>
                                changeTab(
                                    TAB_CONFIG
                                )
                            }
                        >

                            <Activity className="me-1" />

                            Protocol Configuration

                        </Button>


                        <Button

                            variant={

                                activeTab ===
                                TAB_TAG_MAP

                                    ? "primary"

                                    : "outline-primary"
                            }

                            onClick={() =>
                                changeTab(
                                    TAB_TAG_MAP
                                )
                            }
                        >

                            <Diagram3 className="me-1" />

                            Tag Mapping

                        </Button>


                        <Button

                            variant="outline-secondary"

                            disabled={
                                loading
                            }

                            onClick={() =>
                                loadRuntime(
                                    "EVENT"
                                )
                            }
                        >

                            <Activity className="me-1" />

                            Event Runtime

                        </Button>


                        <Button

                            variant="outline-secondary"

                            disabled={
                                loading
                            }

                            onClick={() =>
                                loadRuntime(
                                    "MONITORING"
                                )
                            }
                        >

                            <Activity className="me-1" />

                            Monitoring Runtime

                        </Button>


                    </div>


                </Card.Body>

            </Card>


            <SearchToolbar

                searchText={
                    searchText
                }

                onSearch={
                    setSearchText
                }

                status={
                    statusFilter
                }

                onStatusChange={
                    value =>
                        setStatusFilter(
                            String(
                                value ||
                                "ALL"
                            )
                                .toUpperCase()
                        )
                }

                onRefresh={
                    loadInitialData
                }

                onRuntime={() =>
                    loadRuntime(
                        "EVENT"
                    )
                }

                onReport={
                    loadReport
                }

                onExport={
                    openExport
                }

                placeholder={

                    activeTab ===
                    TAB_CONFIG

                        ? "Search CNC configuration..."

                        : "Search source key, tag or event..."
                }
            />


            <Card className="border-0 shadow-sm mb-3">

                <Card.Body
                    className="
                        d-flex
                        justify-content-between
                        align-items-center
                        flex-wrap
                        gap-3
                    "
                >


                    <div>

                        <div className="fw-semibold fs-5">

                            {currentTitle}

                        </div>


                        <div className="text-muted">

                            {currentSubtitle}

                        </div>

                    </div>


                    <Button

                        variant="primary"

                        onClick={() =>

                            activeTab ===
                            TAB_CONFIG

                                ? openConfig()

                                : openTagMap()
                        }
                    >

                        <Plus className="me-1" />


                        {

                            activeTab ===
                            TAB_CONFIG

                                ? "Add Configuration"

                                : "Add Tag Mapping"
                        }


                    </Button>


                </Card.Body>

            </Card>


            {

                activeTab ===
                TAB_CONFIG &&


                <DataTable

                    columns={
                        configColumns
                    }

                    data={
                        filteredConfigs
                    }

                    loading={
                        loading
                    }

                    emptyMessage={
                        "No CNC configuration found."
                    }

                    renderActions={
                        row => (

                            <ActionButtons

                                showEdit={
                                    true
                                }

                                showDelete={
                                    false
                                }

                                onEdit={() =>
                                    openConfig(
                                        row
                                    )
                                }
                            />
                        )
                    }
                />
            }


            {

                activeTab ===
                TAB_TAG_MAP &&


                <DataTable

                    columns={
                        tagColumns
                    }

                    data={
                        filteredTagMaps
                    }

                    loading={
                        loading
                    }

                    emptyMessage={
                        "No CNC tag mappings found."
                    }

                    renderActions={
                        row => (

                            <ActionButtons

                                showEdit={
                                    true
                                }

                                showDelete={
                                    false
                                }

                                onEdit={() =>
                                    openTagMap(
                                        row
                                    )
                                }
                            />
                        )
                    }
                />
            }


            <ConfigModal

                show={
                    showConfigForm
                }

                title={

                    editingConfig

                        ? "Update CNC Configuration"

                        : "Add CNC Configuration"
                }

                fields={
                    configFields
                }

                formData={
                    configForm
                }

                setFormData={
                    setConfigFormWithDependencies
                }

                saving={
                    saving
                }

                saveText={

                    editingConfig

                        ? "Update Configuration"

                        : "Save Configuration"
                }

                onSave={
                    saveConfig
                }

                onClose={() => {

                    setShowConfigForm(
                        false
                    );


                    setEditingConfig(
                        null
                    );


                    setConfigForm({

                        ...configInitialState
                    });
                }}
            />


            <ConfigModal

                show={
                    showTagMapForm
                }

                title={

                    editingTagMap

                        ? "Update CNC Tag Mapping"

                        : "Add CNC Tag Mapping"
                }

                fields={
                    tagMapFields
                }

                formData={
                    tagMapForm
                }

                setFormData={
                    setTagMapFormWithDependencies
                }

                saving={
                    saving
                }

                saveText={

                    editingTagMap

                        ? "Update Mapping"

                        : "Save Mapping"
                }

                onSave={
                    saveTagMap
                }

                onClose={() => {

                    setShowTagMapForm(
                        false
                    );


                    setEditingTagMap(
                        null
                    );


                    setTagMapForm({

                        ...tagMapInitialState
                    });
                }}
            />


            <RuntimeModal

                show={
                    showRuntime
                }

                title={

                    runtimeType ===
                    "MONITORING"

                        ? "CNC Monitoring Runtime"

                        : "CNC Event Runtime"
                }

                columns={

                    runtimeType ===
                    "MONITORING"

                        ? monitoringColumns

                        : runtimeColumns
                }

                data={
                    runtimeRows
                }

                loading={
                    loading
                }

                onClose={() =>
                    setShowRuntime(
                        false
                    )
                }
            />


            <ReportModal

                show={
                    showReport
                }

                title={

                    `CNC Adapter Report${

                        hasValue(
                            reportMeta.total
                        )

                            ? ` (${reportMeta.total})`

                            : ""
                    }`
                }

                columns={
                    runtimeColumns
                }

                data={
                    reportRows
                }

                loading={
                    loading
                }

                emptyMessage={
                    "No CNC Adapter report records found."
                }

                onClose={() =>
                    setShowReport(
                        false
                    )
                }
            />


            <ExportModal

                show={
                    showExport
                }

                title="Export CNC Adapter Data"

                exportForm={
                    exportForm
                }

                setExportForm={
                    setExportFormWithDependencies
                }

                formats={[
                    "CSV",
                    "JSON"
                ]}

                filters={
                    exportFilters
                }

                exporting={
                    exporting
                }

                onExport={
                    exportData
                }

                onClose={() =>
                    setShowExport(
                        false
                    )
                }
            />


            <ToastMessage

                show={
                    toast.show
                }

                message={
                    toast.message
                }

                variant={
                    toast.variant
                }

                onClose={
                    hideToast
                }
            />


        </div>
    );
}


export default CncAdapter;