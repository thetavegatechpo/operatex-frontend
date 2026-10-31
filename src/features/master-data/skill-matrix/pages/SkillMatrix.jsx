
// src/pages/SkillMatrix/SkillMatrix.jsx

import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Badge,
    Button,
    Card,
    Col,
    Form,
    Modal,
    Row,
    Spinner,
    Toast
} from "react-bootstrap";

import { Plus } from "react-bootstrap-icons";

import SearchToolbar from "../../../../shared/components/SearchToolbar.jsx";
import DataTable from "../../../../shared/components/DataTable.jsx";
import StatusBadge from "../../../../shared/components/StatusBadge.jsx";
import ActionButtons from "../../../../shared/components/ActionButtons.jsx";

import skillService from "../api/skill.service.js";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import plantShopService from "../../../enterprise-setup/plant-shop-master/api/plantshop.service.js";
import lineService from "../../../enterprise-setup/line-master/api/line.service.js";
import machineService from "../../machine-master/api/machine.service.js";
import routeStationService from "../../route-station-master/api/routeStation.service.js";


// ==========================================================
// CONSTANTS
// ==========================================================

const SKILL_STATUSES = [
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
    "RETIRED"
];


const CERTIFICATION_STATUSES = [
    "ACTIVE",
    "EXPIRED",
    "SUSPENDED",
    "REVOKED"
];


const VALIDATION_RESULTS = [
    "PASS",
    "FAIL",
    "WARNING"
];


// ==========================================================
// HELPERS
// ==========================================================

const sameId = (
    left,
    right
) => {

    return String(
        left ?? ""
    ) === String(
        right ?? ""
    );

};


const responseRows = response => {

    if (
        Array.isArray(response)
    ) {

        return response;

    }


    if (
        Array.isArray(
            response?.data?.data
        )
    ) {

        return response.data.data;

    }


    if (
        Array.isArray(
            response?.data
        )
    ) {

        return response.data;

    }


    return [];

};


const toDateTimeInput = value => {

    if (!value) {

        return "";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const offset =
        date.getTimezoneOffset() *
        60000;


    return new Date(
        date.getTime() -
        offset
    )
        .toISOString()
        .slice(0, 16);

};


const formatDateTime = value => {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString();

};


// ==========================================================
// COMPONENT
// ==========================================================

function SkillMatrix() {

    // ======================================================
    // DATA
    // ======================================================

    const [
        skills,
        setSkills
    ] = useState([]);


    const [
        levels,
        setLevels
    ] = useState([]);


    const [
        certifications,
        setCertifications
    ] = useState([]);


    const [
        companies,
        setCompanies
    ] = useState([]);


    const [
        plants,
        setPlants
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
        routeSteps,
        setRouteSteps
    ] = useState([]);


    const [
        runtimeData,
        setRuntimeData
    ] = useState([]);


    const [
        reportData,
        setReportData
    ] = useState([]);


    // ======================================================
    // SEARCH
    // ======================================================

    const [
        searchText,
        setSearchText
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter
    ] = useState("ALL");


    // ======================================================
    // LOADING
    // ======================================================

    const [
        loading,
        setLoading
    ] = useState(false);


    const [
        saving,
        setSaving
    ] = useState(false);


    // ======================================================
    // MODALS
    // ======================================================

    const [
        showForm,
        setShowForm
    ] = useState(false);


    const [
        showLevelConfig,
        setShowLevelConfig
    ] = useState(false);


    const [
        showLevelForm,
        setShowLevelForm
    ] = useState(false);


    const [
        showCertificationConfig,
        setShowCertificationConfig
    ] = useState(false);


    const [
        showCertificationForm,
        setShowCertificationForm
    ] = useState(false);


    const [
        showRuntime,
        setShowRuntime
    ] = useState(false);


    const [
        showExecute,
        setShowExecute
    ] = useState(false);


    const [
        showReport,
        setShowReport
    ] = useState(false);


    // ======================================================
    // EDIT IDS
    // ======================================================

    const [
        editId,
        setEditId
    ] = useState(null);


    const [
        levelEditId,
        setLevelEditId
    ] = useState(null);


    const [
        certificationEditId,
        setCertificationEditId
    ] = useState(null);


    // ======================================================
    // TOAST
    // ======================================================

    const [
        toast,
        setToast
    ] = useState({

        show: false,

        variant: "success",

        message: ""

    });


    const showToast = (
        message,
        variant = "success"
    ) => {

        setToast({

            show: true,

            variant,

            message

        });

    };


    const hideToast = () => {

        setToast({

            show: false,

            variant: "success",

            message: ""

        });

    };


    // ======================================================
    // INITIAL STATES
    // ======================================================

    const skillInitialState = {

        company_id: "",

        skill_code: "",

        skill_name: "",

        category: "",

        description: "",

        validity_months: "",

        renewal_required: false,

        status: "ACTIVE"

    };


    const levelInitialState = {

        config_type: "LEVEL",

        skill_id: "",

        level_code: "",

        level_name: "",

        level_rank: "",

        min_score: "",

        max_score: "",

        can_train: false,

        can_approve: false,

        eligibility_config: "{}",

        is_active: true

    };


    const certificationInitialState = {

        config_type:
            "CERTIFICATION",

        user_id: "",

        skill_id: "",

        skill_level_id: "",

        plant_id: "",

        line_id: "",

        machine_id: "",

        certificate_no: "",

        issued_at: "",

        expires_at: "",

        status: "ACTIVE",

        verified_by: "",

        verified_at: "",

        evidence_url: "",

        remarks: ""

    };


    const executeInitialState = {

        user_id: "",

        skill_id: "",

        skill_level_id: "",

        plant_id: "",

        line_id: "",

        machine_id: "",

        route_step_id: "",

        validation_result: "PASS",

        required_level_rank: "",

        actual_level_rank: "",

        reason: "",

        event_ts: "",

        correlation_id: "",

        idempotency_key: "",

        source_system: "OPERATEX",

        payload: "{}"

    };


    // ======================================================
    // FORMS
    // ======================================================

    const [
        formData,
        setFormData
    ] = useState(
        skillInitialState
    );


    const [
        levelForm,
        setLevelForm
    ] = useState(
        levelInitialState
    );


    const [
        certificationForm,
        setCertificationForm
    ] = useState(
        certificationInitialState
    );


    const [
        executeForm,
        setExecuteForm
    ] = useState(
        executeInitialState
    );


    // ======================================================
    // ERROR MESSAGE
    // ======================================================

    const getErrorMessage = (
        error,
        fallback
    ) => {

        const response =
            error?.response?.data;


        if (
            Array.isArray(
                response?.errors
            ) &&
            response.errors.length > 0
        ) {

            return `${
                response.message ||
                "Validation failed."
            } ${response.errors.join(", ")}`;

        }


        return (
            response?.message ||
            error?.message ||
            fallback
        );

    };


    // ======================================================
    // JSON
    // ======================================================

    const parseJsonObject = (
        value,
        fieldName
    ) => {

        if (
            value === "" ||
            value === null ||
            value === undefined
        ) {

            return {};

        }


        if (
            typeof value === "object" &&
            !Array.isArray(value)
        ) {

            return value;

        }


        try {

            const parsed =
                JSON.parse(value);


            if (
                parsed === null ||
                Array.isArray(parsed) ||
                typeof parsed !== "object"
            ) {

                throw new Error();

            }


            return parsed;

        }
        catch {

            throw new Error(
                `${fieldName} must contain valid JSON object data.`
            );

        }

    };


    const prettyJson = value => {

        try {

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {

                return "{}";

            }


            if (
                typeof value === "string"
            ) {

                return JSON.stringify(
                    JSON.parse(value),
                    null,
                    2
                );

            }


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


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadInitialData();

        // eslint-disable-next-line
    }, []);


    const loadInitialData =
        async () => {

            try {

                setLoading(true);


                const results =
                    await Promise.allSettled([

                        loadSkills(),

                        loadLevels(),

                        loadCertifications(),

                        loadCompanies(),

                        loadPlants(),

                        loadLines(),

                        loadMachines(),

                        loadRouteSteps()

                    ]);


                const names = [

                    "Skill Master",

                    "Skill Levels",

                    "Operator Certifications",

                    "Company",

                    "Plant",

                    "Line",

                    "Machine",

                    "Route Step"

                ];


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
                                `${names[index]} load failed:`,
                                result.reason
                            );

                        }

                    }
                );

            }
            catch (error) {

                console.error(
                    "Skill Matrix Initial Load Error:",
                    error
                );

            }
            finally {

                setLoading(false);

            }

        };


    // ======================================================
    // SKILLS
    // ======================================================

    const loadSkills =
        async () => {

            try {

                const response =
                    await skillService
                        .getMaster();


                setSkills(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Skill Master Load Error:",
                    error?.response?.data ||
                    error
                );


                setSkills([]);


                showToast(

                    getErrorMessage(
                        error,
                        "Unable to load Skill Master."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // LEVELS
    // ======================================================

    const loadLevels =
        async () => {

            try {

                const response =
                    await skillService
                        .getLevelConfig();


                setLevels(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Skill Level Load Error:",
                    error?.response?.data ||
                    error
                );


                setLevels([]);

            }

        };


    // ======================================================
    // CERTIFICATIONS
    // ======================================================

    const loadCertifications =
        async () => {

            try {

                const response =
                    await skillService
                        .getCertificationConfig();


                setCertifications(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Certification Load Error:",
                    error?.response?.data ||
                    error
                );


                setCertifications([]);

            }

        };


    // ======================================================
    // COMPANIES
    // ======================================================

    const loadCompanies =
        async () => {

            try {

                const response =
                    await companyService
                        .getMaster();


                setCompanies(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Company Load Error:",
                    error?.response?.data ||
                    error
                );


                setCompanies([]);

            }

        };


    // ======================================================
    // PLANTS
    // ======================================================

    const loadPlants =
        async () => {

            try {

                const response =
                    await plantShopService
                        .getMaster();


                const data =
                    responseRows(
                        response
                    );


                const uniquePlants = [

                    ...new Map(

                        data

                            .filter(
                                item =>
                                    item?.plant_id
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


                setPlants(
                    uniquePlants
                );

            }
            catch (error) {

                console.error(
                    "Plant Load Error:",
                    error?.response?.data ||
                    error
                );


                setPlants([]);

            }

        };


    // ======================================================
    // LINES
    // ======================================================

    const loadLines =
        async () => {

            try {

                const response =
                    await lineService
                        .getMaster();


                setLines(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Line Load Error:",
                    error?.response?.data ||
                    error
                );


                setLines([]);

            }

        };


    // ======================================================
    // MACHINES
    //
    // OPTIONAL
    // ======================================================

    const loadMachines =
        async () => {

            try {

                const response =
                    await machineService
                        .getMaster();


                setMachines(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Machine Master API Error:",
                    {

                        status:
                            error?.response?.status,

                        url:
                            error?.config?.url,

                        method:
                            error?.config?.method,

                        response:
                            error?.response?.data

                    }
                );


                setMachines([]);


                showToast(

                    error?.response?.data?.message ||

                    "Machine lookup unavailable. Machine is optional.",

                    "warning"

                );

            }

        };


    // ======================================================
    // ROUTE STEPS
    // ======================================================

    const loadRouteSteps =
        async () => {

            try {

                const response =
                    await routeStationService
                        .getSteps();


                setRouteSteps(
                    responseRows(
                        response
                    )
                );

            }
            catch (error) {

                console.error(
                    "Route Step Load Error:",
                    error?.response?.data ||
                    error
                );


                setRouteSteps([]);

            }

        };


    // ======================================================
    // LOOKUP NAMES
    // ======================================================

    const getCompanyName =
        companyId => {

            return (
                companies.find(
                    item =>
                        sameId(
                            item.company_id,
                            companyId
                        )
                )?.company_name ||
                "-"
            );

        };


    const getPlantName =
        plantId => {

            if (!plantId) {

                return "-";

            }


            return (
                plants.find(
                    item =>
                        sameId(
                            item.plant_id,
                            plantId
                        )
                )?.plant_name ||
                "-"
            );

        };


    const getLineName =
        lineId => {

            if (!lineId) {

                return "-";

            }


            return (
                lines.find(
                    item =>
                        sameId(
                            item.line_id,
                            lineId
                        )
                )?.line_name ||
                "-"
            );

        };


    const getMachineName =
        machineId => {

            if (!machineId) {

                return "-";

            }


            return (
                machines.find(
                    item =>
                        sameId(
                            item.machine_id,
                            machineId
                        )
                )?.machine_name ||
                "-"
            );

        };


    const getSkillLabel =
        skillId => {

            const skill =
                skills.find(
                    item =>
                        sameId(
                            item.skill_id,
                            skillId
                        )
                );


            if (!skill) {

                return "-";

            }


            return `${
                skill.skill_code ||
                ""
            } - ${
                skill.skill_name ||
                ""
            }`;

        };


    const getLevelLabel =
        levelId => {

            const level =
                levels.find(
                    item =>
                        sameId(
                            item.skill_level_id,
                            levelId
                        )
                );


            if (!level) {

                return "-";

            }


            return `${
                level.level_code ||
                ""
            } - ${
                level.level_name ||
                ""
            }`;

        };


    const getRouteStepLabel =
        step => {

            if (!step) {

                return "-";

            }


            const code =
                step.route_step_code ||
                step.step_code ||
                step.stage_code ||
                step.route_step_id;


            const name =
                step.route_step_name ||
                step.step_name ||
                step.stage_name ||
                "";


            return name
                ? `${code} - ${name}`
                : String(code || "-");

        };


    // ======================================================
    // ======================================================
    // MASTER
    // ======================================================
    // ======================================================


    const handleChange =
        event => {

            const {
                name,
                value,
                type,
                checked
            } = event.target;


            setFormData(
                previous => ({

                    ...previous,

                    [name]:
                        type === "checkbox"
                            ? checked
                            : value

                })
            );

        };


    const resetForm = () => {

        setEditId(null);

        setFormData(
            skillInitialState
        );

    };


    const openAddModal = () => {

        resetForm();

        setShowForm(true);

    };


    const openEditModal =
        skill => {

            setEditId(
                skill.skill_id
            );


            setFormData({

                company_id:
                    skill.company_id || "",

                skill_code:
                    skill.skill_code || "",

                skill_name:
                    skill.skill_name || "",

                category:
                    skill.category || "",

                description:
                    skill.description || "",

                validity_months:
                    skill.validity_months ?? "",

                renewal_required:
                    Boolean(
                        skill.renewal_required
                    ),

                status:
                    skill.status ||
                    "ACTIVE"

            });


            setShowForm(true);

        };


    // ======================================================
    // SAVE SKILL
    // ======================================================

    const saveSkill =
        async () => {

            try {

                if (
                    !formData.company_id ||
                    !formData.skill_code.trim() ||
                    !formData.skill_name.trim()
                ) {

                    showToast(
                        "Company, Skill Code and Skill Name are required.",
                        "danger"
                    );

                    return;

                }


                if (
                    formData.skill_name.trim().length <
                    3
                ) {

                    showToast(
                        "Skill Name must contain at least 3 characters.",
                        "danger"
                    );

                    return;

                }


                if (
                    formData.validity_months !== "" &&
                    (
                        !Number.isInteger(
                            Number(
                                formData.validity_months
                            )
                        ) ||
                        Number(
                            formData.validity_months
                        ) <= 0
                    )
                ) {

                    showToast(
                        "Validity Months must be an integer greater than 0.",
                        "danger"
                    );

                    return;

                }


                setSaving(true);


                const payload = {

                    company_id:
                        formData.company_id,

                    skill_code:
                        formData.skill_code
                            .trim(),

                    skill_name:
                        formData.skill_name
                            .trim(),

                    category:
                        formData.category
                            .trim() ||
                        null,

                    description:
                        formData.description
                            .trim() ||
                        null,

                    validity_months:
                        formData.validity_months === ""

                            ? null

                            : Number(
                                formData.validity_months
                            ),

                    renewal_required:
                        Boolean(
                            formData.renewal_required
                        ),

                    status:
                        String(
                            formData.status
                        ).toUpperCase()

                };


                if (editId) {

                    await skillService
                        .updateMaster(
                            editId,
                            payload
                        );


                    showToast(
                        "Skill updated successfully."
                    );

                }
                else {

                    await skillService
                        .createMaster(
                            payload
                        );


                    showToast(
                        "Skill created successfully."
                    );

                }


                setShowForm(false);

                resetForm();

                await loadSkills();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Skill."
                    ),

                    "danger"

                );

            }
            finally {

                setSaving(false);

            }

        };


    // ======================================================
    // DELETE SKILL
    // ======================================================

    const deleteSkill =
        async skill => {

            if (
                !window.confirm(
                    `Deactivate skill "${skill.skill_name}"?`
                )
            ) {

                return;

            }


            try {

                await skillService
                    .deleteMaster(
                        skill.skill_id
                    );


                showToast(
                    "Skill deactivated successfully."
                );


                await loadSkills();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Skill."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // ======================================================
    // LEVEL CONFIG
    // ======================================================
    // ======================================================


    const openAddLevel = () => {

        setLevelEditId(null);

        setLevelForm(
            levelInitialState
        );

        setShowLevelConfig(false);

        setShowLevelForm(true);

    };


    const openEditLevel =
        level => {

            setLevelEditId(
                level.skill_level_id
            );


            setLevelForm({

                config_type:
                    "LEVEL",

                skill_id:
                    level.skill_id || "",

                level_code:
                    level.level_code || "",

                level_name:
                    level.level_name || "",

                level_rank:
                    level.level_rank ?? "",

                min_score:
                    level.min_score ?? "",

                max_score:
                    level.max_score ?? "",

                can_train:
                    Boolean(
                        level.can_train
                    ),

                can_approve:
                    Boolean(
                        level.can_approve
                    ),

                eligibility_config:
                    prettyJson(
                        level.eligibility_config
                    ),

                is_active:
                    level.is_active !== false

            });


            setShowLevelConfig(false);

            setShowLevelForm(true);

        };


    // ======================================================
    // SAVE LEVEL
    // ======================================================

    const saveLevel =
        async () => {

            try {

                if (
                    !levelForm.skill_id ||
                    !levelForm.level_code.trim() ||
                    !levelForm.level_name.trim() ||
                    levelForm.level_rank === ""
                ) {

                    showToast(
                        "Skill, Level Code, Level Name and Level Rank are required.",
                        "danger"
                    );

                    return;

                }


                if (
                    !Number.isInteger(
                        Number(
                            levelForm.level_rank
                        )
                    ) ||
                    Number(
                        levelForm.level_rank
                    ) <= 0
                ) {

                    showToast(
                        "Level Rank must be an integer greater than 0.",
                        "danger"
                    );

                    return;

                }


                if (
                    levelForm.min_score !== "" &&
                    !Number.isFinite(
                        Number(
                            levelForm.min_score
                        )
                    )
                ) {

                    showToast(
                        "Minimum Score must be numeric.",
                        "danger"
                    );

                    return;

                }


                if (
                    levelForm.max_score !== "" &&
                    !Number.isFinite(
                        Number(
                            levelForm.max_score
                        )
                    )
                ) {

                    showToast(
                        "Maximum Score must be numeric.",
                        "danger"
                    );

                    return;

                }


                if (
                    levelForm.min_score !== "" &&
                    levelForm.max_score !== "" &&
                    Number(
                        levelForm.max_score
                    ) <
                    Number(
                        levelForm.min_score
                    )
                ) {

                    showToast(
                        "Maximum Score cannot be below Minimum Score.",
                        "danger"
                    );

                    return;

                }


                setSaving(true);


                const payload = {

                    config_type:
                        "LEVEL",

                    skill_id:
                        levelForm.skill_id,

                    level_code:
                        levelForm.level_code
                            .trim(),

                    level_name:
                        levelForm.level_name
                            .trim(),

                    level_rank:
                        Number(
                            levelForm.level_rank
                        ),

                    min_score:
                        levelForm.min_score === ""

                            ? null

                            : Number(
                                levelForm.min_score
                            ),

                    max_score:
                        levelForm.max_score === ""

                            ? null

                            : Number(
                                levelForm.max_score
                            ),

                    can_train:
                        Boolean(
                            levelForm.can_train
                        ),

                    can_approve:
                        Boolean(
                            levelForm.can_approve
                        ),

                    eligibility_config:
                        parseJsonObject(
                            levelForm.eligibility_config,
                            "Eligibility Config"
                        ),

                    is_active:
                        Boolean(
                            levelForm.is_active
                        )

                };


                if (levelEditId) {

                    delete payload.config_type;


                    await skillService
                        .updateConfig(
                            "LEVEL",
                            levelEditId,
                            payload
                        );


                    showToast(
                        "Skill Level updated successfully."
                    );

                }
                else {

                    await skillService
                        .createConfig(
                            payload
                        );


                    showToast(
                        "Skill Level created successfully."
                    );

                }


                setLevelEditId(null);

                setLevelForm(
                    levelInitialState
                );

                setShowLevelForm(false);


                await loadLevels();


                setShowLevelConfig(true);

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Skill Level."
                    ),

                    "danger"

                );

            }
            finally {

                setSaving(false);

            }

        };


    // ======================================================
    // DELETE LEVEL
    // ======================================================

    const deleteLevel =
        async level => {

            if (
                !window.confirm(
                    `Deactivate skill level "${level.level_name}"?`
                )
            ) {

                return;

            }


            try {

                await skillService
                    .deleteConfig(
                        "LEVEL",
                        level.skill_level_id
                    );


                showToast(
                    "Skill Level deactivated successfully."
                );


                await loadLevels();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to deactivate Skill Level."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // ======================================================
    // CERTIFICATION CONFIG
    // ======================================================
    // ======================================================


    const selectedCertificationSkill =
        useMemo(
            () =>

                skills.find(
                    skill =>
                        sameId(
                            skill.skill_id,
                            certificationForm.skill_id
                        )
                ),

            [
                skills,
                certificationForm.skill_id
            ]
        );


    const certificationLevels =
        useMemo(() => {

            if (
                !certificationForm.skill_id
            ) {

                return [];

            }


            return levels.filter(
                level =>

                    sameId(
                        level.skill_id,
                        certificationForm.skill_id
                    ) &&

                    level.is_active !== false
            );

        }, [
            levels,
            certificationForm.skill_id
        ]);


    const certificationPlants =
        useMemo(() => {

            if (
                !selectedCertificationSkill
            ) {

                return [];

            }


            return plants.filter(
                plant =>

                    !plant.company_id ||

                    sameId(
                        plant.company_id,
                        selectedCertificationSkill.company_id
                    )
            );

        }, [
            plants,
            selectedCertificationSkill
        ]);


    const certificationLines =
        useMemo(() => {

            if (
                !certificationForm.plant_id
            ) {

                return [];

            }


            return lines.filter(
                line => {

                    const companyMatch =

                        !selectedCertificationSkill ||

                        !line.company_id ||

                        sameId(
                            line.company_id,
                            selectedCertificationSkill.company_id
                        );


                    const plantMatch =

                        !line.plant_id ||

                        sameId(
                            line.plant_id,
                            certificationForm.plant_id
                        );


                    return (
                        companyMatch &&
                        plantMatch
                    );

                }
            );

        }, [
            lines,
            selectedCertificationSkill,
            certificationForm.plant_id
        ]);


    const certificationMachines =
        useMemo(() => {

            if (
                !certificationForm.plant_id
            ) {

                return [];

            }


            return machines.filter(
                machine => {

                    const plantMatch =

                        !machine.plant_id ||

                        sameId(
                            machine.plant_id,
                            certificationForm.plant_id
                        );


                    const lineMatch =

                        !certificationForm.line_id ||

                        !machine.line_id ||

                        sameId(
                            machine.line_id,
                            certificationForm.line_id
                        );


                    return (
                        plantMatch &&
                        lineMatch
                    );

                }
            );

        }, [
            machines,
            certificationForm.plant_id,
            certificationForm.line_id
        ]);


    const openAddCertification = () => {

        setCertificationEditId(null);

        setCertificationForm(
            certificationInitialState
        );

        setShowCertificationConfig(false);

        setShowCertificationForm(true);

    };


    const openEditCertification =
        certification => {

            setCertificationEditId(
                certification.operator_certification_id
            );


            setCertificationForm({

                config_type:
                    "CERTIFICATION",

                user_id:
                    certification.user_id ?? "",

                skill_id:
                    certification.skill_id || "",

                skill_level_id:
                    certification.skill_level_id || "",

                plant_id:
                    certification.plant_id || "",

                line_id:
                    certification.line_id || "",

                machine_id:
                    certification.machine_id || "",

                certificate_no:
                    certification.certificate_no || "",

                issued_at:
                    toDateTimeInput(
                        certification.issued_at
                    ),

                expires_at:
                    toDateTimeInput(
                        certification.expires_at
                    ),

                status:
                    certification.status ||
                    "ACTIVE",

                verified_by:
                    certification.verified_by ?? "",

                verified_at:
                    toDateTimeInput(
                        certification.verified_at
                    ),

                evidence_url:
                    certification.evidence_url || "",

                remarks:
                    certification.remarks || ""

            });


            setShowCertificationConfig(false);

            setShowCertificationForm(true);

        };


    // ======================================================
    // SAVE CERTIFICATION
    // ======================================================

    const saveCertification =
        async () => {

            try {

                if (
                    !certificationForm.skill_id ||
                    !certificationForm.skill_level_id ||
                    certificationForm.user_id === ""
                ) {

                    showToast(
                        "User ID, Skill and Skill Level are required.",
                        "danger"
                    );

                    return;

                }


                if (
                    !Number.isInteger(
                        Number(
                            certificationForm.user_id
                        )
                    ) ||
                    Number(
                        certificationForm.user_id
                    ) <= 0
                ) {

                    showToast(
                        "User ID must be a positive integer.",
                        "danger"
                    );

                    return;

                }


                if (
                    certificationForm.verified_by !== "" &&
                    (
                        !Number.isInteger(
                            Number(
                                certificationForm.verified_by
                            )
                        ) ||
                        Number(
                            certificationForm.verified_by
                        ) <= 0
                    )
                ) {

                    showToast(
                        "Verified By must be a positive integer.",
                        "danger"
                    );

                    return;

                }


                if (
                    certificationForm.issued_at &&
                    certificationForm.expires_at &&
                    new Date(
                        certificationForm.expires_at
                    ) <=
                    new Date(
                        certificationForm.issued_at
                    )
                ) {

                    showToast(
                        "Expiry time must be later than Issue time.",
                        "danger"
                    );

                    return;

                }


                setSaving(true);


                const payload = {

                    config_type:
                        "CERTIFICATION",

                    user_id:
                        Number(
                            certificationForm.user_id
                        ),

                    skill_id:
                        certificationForm.skill_id,

                    skill_level_id:
                        certificationForm.skill_level_id,

                    plant_id:
                        certificationForm.plant_id ||
                        null,

                    line_id:
                        certificationForm.line_id ||
                        null,

                    machine_id:
                        certificationForm.machine_id ||
                        null,

                    certificate_no:
                        certificationForm.certificate_no
                            .trim() ||
                        null,

                    issued_at:
                        certificationForm.issued_at ||
                        null,

                    expires_at:
                        certificationForm.expires_at ||
                        null,

                    status:
                        certificationForm.status,

                    verified_by:
                        certificationForm.verified_by === ""

                            ? null

                            : Number(
                                certificationForm.verified_by
                            ),

                    verified_at:
                        certificationForm.verified_at ||
                        null,

                    evidence_url:
                        certificationForm.evidence_url
                            .trim() ||
                        null,

                    remarks:
                        certificationForm.remarks
                            .trim() ||
                        null

                };


                if (
                    certificationEditId
                ) {

                    delete payload.config_type;


                    await skillService
                        .updateConfig(
                            "CERTIFICATION",
                            certificationEditId,
                            payload
                        );


                    showToast(
                        "Operator Certification updated successfully."
                    );

                }
                else {

                    await skillService
                        .createConfig(
                            payload
                        );


                    showToast(
                        "Operator Certification created successfully."
                    );

                }


                setCertificationEditId(null);

                setCertificationForm(
                    certificationInitialState
                );

                setShowCertificationForm(false);


                await loadCertifications();


                setShowCertificationConfig(true);

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to save Operator Certification."
                    ),

                    "danger"

                );

            }
            finally {

                setSaving(false);

            }

        };


    // ======================================================
    // DELETE CERTIFICATION
    // ======================================================

    const deleteCertification =
        async certification => {

            if (
                !window.confirm(
                    `Revoke certification "${certification.certificate_no || certification.operator_certification_id}"?`
                )
            ) {

                return;

            }


            try {

                await skillService
                    .deleteConfig(
                        "CERTIFICATION",
                        certification.operator_certification_id
                    );


                showToast(
                    "Certification revoked successfully."
                );


                await loadCertifications();

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to revoke Certification."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // ======================================================
    // EXECUTE
    // ======================================================
    // ======================================================


    const selectedExecuteSkill =
        useMemo(
            () =>

                skills.find(
                    skill =>
                        sameId(
                            skill.skill_id,
                            executeForm.skill_id
                        )
                ),

            [
                skills,
                executeForm.skill_id
            ]
        );


    const executeLevels =
        useMemo(() => {

            if (
                !executeForm.skill_id
            ) {

                return [];

            }


            return levels.filter(
                level =>

                    sameId(
                        level.skill_id,
                        executeForm.skill_id
                    ) &&

                    level.is_active !== false
            );

        }, [
            levels,
            executeForm.skill_id
        ]);


    const executePlants =
        useMemo(() => {

            if (
                !selectedExecuteSkill
            ) {

                return [];

            }


            return plants.filter(
                plant =>

                    !plant.company_id ||

                    sameId(
                        plant.company_id,
                        selectedExecuteSkill.company_id
                    )
            );

        }, [
            plants,
            selectedExecuteSkill
        ]);


    const executeLines =
        useMemo(() => {

            if (
                !executeForm.plant_id
            ) {

                return [];

            }


            return lines.filter(
                line => {

                    const companyMatch =

                        !selectedExecuteSkill ||

                        !line.company_id ||

                        sameId(
                            line.company_id,
                            selectedExecuteSkill.company_id
                        );


                    const plantMatch =

                        !line.plant_id ||

                        sameId(
                            line.plant_id,
                            executeForm.plant_id
                        );


                    return (
                        companyMatch &&
                        plantMatch
                    );

                }
            );

        }, [
            lines,
            selectedExecuteSkill,
            executeForm.plant_id
        ]);


    const executeMachines =
        useMemo(() => {

            if (
                !executeForm.plant_id
            ) {

                return [];

            }


            return machines.filter(
                machine => {

                    const plantMatch =

                        !machine.plant_id ||

                        sameId(
                            machine.plant_id,
                            executeForm.plant_id
                        );


                    const lineMatch =

                        !executeForm.line_id ||

                        !machine.line_id ||

                        sameId(
                            machine.line_id,
                            executeForm.line_id
                        );


                    return (
                        plantMatch &&
                        lineMatch
                    );

                }
            );

        }, [
            machines,
            executeForm.plant_id,
            executeForm.line_id
        ]);


    const executeRouteSteps =
        useMemo(() => {

            if (
                !executeForm.skill_id
            ) {

                return [];

            }


            return routeSteps.filter(
                step => {

                    const companyMatch =

                        !selectedExecuteSkill ||

                        !step.company_id ||

                        sameId(
                            step.company_id,
                            selectedExecuteSkill.company_id
                        );


                    const plantMatch =

                        !executeForm.plant_id ||

                        !step.plant_id ||

                        sameId(
                            step.plant_id,
                            executeForm.plant_id
                        );


                    const lineMatch =

                        !executeForm.line_id ||

                        !step.line_id ||

                        sameId(
                            step.line_id,
                            executeForm.line_id
                        );


                    const machineMatch =

                        !executeForm.machine_id ||

                        !step.machine_id ||

                        sameId(
                            step.machine_id,
                            executeForm.machine_id
                        );


                    return (
                        companyMatch &&
                        plantMatch &&
                        lineMatch &&
                        machineMatch
                    );

                }
            );

        }, [
            routeSteps,
            selectedExecuteSkill,
            executeForm.skill_id,
            executeForm.plant_id,
            executeForm.line_id,
            executeForm.machine_id
        ]);


    const openExecute = () => {

        setExecuteForm(
            executeInitialState
        );

        setShowExecute(true);

    };


    // ======================================================
    // EXECUTE VALIDATION
    // ======================================================

    const executeSkillValidation =
        async () => {

            try {

                if (
                    executeForm.user_id === "" ||
                    !executeForm.skill_id ||
                    !executeForm.validation_result
                ) {

                    showToast(
                        "User ID, Skill and Validation Result are required.",
                        "danger"
                    );

                    return;

                }


                if (
                    !Number.isInteger(
                        Number(
                            executeForm.user_id
                        )
                    ) ||
                    Number(
                        executeForm.user_id
                    ) <= 0
                ) {

                    showToast(
                        "User ID must be a positive integer.",
                        "danger"
                    );

                    return;

                }


                if (
                    executeForm.required_level_rank !== "" &&
                    (
                        !Number.isInteger(
                            Number(
                                executeForm.required_level_rank
                            )
                        ) ||
                        Number(
                            executeForm.required_level_rank
                        ) <= 0
                    )
                ) {

                    showToast(
                        "Required Level Rank must be greater than 0.",
                        "danger"
                    );

                    return;

                }


                if (
                    executeForm.actual_level_rank !== "" &&
                    (
                        !Number.isInteger(
                            Number(
                                executeForm.actual_level_rank
                            )
                        ) ||
                        Number(
                            executeForm.actual_level_rank
                        ) <= 0
                    )
                ) {

                    showToast(
                        "Actual Level Rank must be greater than 0.",
                        "danger"
                    );

                    return;

                }


                setSaving(true);


                const payload = {

                    user_id:
                        Number(
                            executeForm.user_id
                        ),

                    skill_id:
                        executeForm.skill_id,

                    skill_level_id:
                        executeForm.skill_level_id ||
                        null,

                    plant_id:
                        executeForm.plant_id ||
                        null,

                    line_id:
                        executeForm.line_id ||
                        null,

                    machine_id:
                        executeForm.machine_id ||
                        null,

                    route_step_id:
                        executeForm.route_step_id ||
                        null,

                    validation_result:
                        executeForm.validation_result,

                    required_level_rank:
                        executeForm.required_level_rank === ""

                            ? null

                            : Number(
                                executeForm.required_level_rank
                            ),

                    actual_level_rank:
                        executeForm.actual_level_rank === ""

                            ? null

                            : Number(
                                executeForm.actual_level_rank
                            ),

                    reason:
                        executeForm.reason
                            .trim() ||
                        null,

                    event_ts:
                        executeForm.event_ts ||
                        null,

                    correlation_id:
                        executeForm.correlation_id
                            .trim() ||
                        null,

                    idempotency_key:
                        executeForm.idempotency_key
                            .trim() ||
                        null,

                    source_system:
                        executeForm.source_system
                            .trim() ||
                        null,

                    payload:
                        parseJsonObject(
                            executeForm.payload,
                            "Payload"
                        )

                };


                const response =
                    await skillService
                        .execute(
                            payload
                        );


                showToast(

                    response?.data?.message ||

                    "Skill validation executed successfully."

                );


                setExecuteForm(
                    executeInitialState
                );


                setShowExecute(false);

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to execute Skill Validation."
                    ),

                    "danger"

                );

            }
            finally {

                setSaving(false);

            }

        };


    // ======================================================
    // RUNTIME
    // ======================================================

    const loadRuntime =
        async () => {

            try {

                setLoading(true);


                const response =
                    await skillService
                        .getRuntime();


                setRuntimeData(
                    responseRows(
                        response
                    )
                );


                setShowRuntime(true);

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to load Skill Runtime."
                    ),

                    "danger"

                );

            }
            finally {

                setLoading(false);

            }

        };


    // ======================================================
    // REPORT
    // ======================================================

    const loadReport =
        async () => {

            try {

                setLoading(true);


                const response =
                    await skillService
                        .getReport({

                            status:
                                statusFilter ===
                                "ALL"

                                    ? ""

                                    : statusFilter

                        });


                setReportData(
                    responseRows(
                        response
                    )
                );


                setShowReport(true);

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Unable to generate Skill Matrix Report."
                    ),

                    "danger"

                );

            }
            finally {

                setLoading(false);

            }

        };


    // ======================================================
    // EXPORT
    // ======================================================

    const exportSkill =
        async () => {

            try {

                const response =
                    await skillService
                        .exportData({

                            format: "CSV",

                            status:
                                statusFilter ===
                                "ALL"

                                    ? ""

                                    : statusFilter

                        });


                const rows =
                    responseRows(
                        response
                    );


                if (
                    rows.length === 0
                ) {

                    showToast(
                        "No Skill Matrix data available for export.",
                        "warning"
                    );

                    return;

                }


                const columns = [

                    ["skill_code", "Skill Code"],

                    ["skill_name", "Skill Name"],

                    ["category", "Category"],

                    ["description", "Description"],

                    ["validity_months", "Validity Months"],

                    ["renewal_required", "Renewal Required"],

                    ["total_levels", "Total Levels"],

                    ["active_levels", "Active Levels"],

                    ["total_certifications", "Total Certifications"],

                    ["active_certifications", "Active Certifications"],

                    ["next_expiry_at", "Next Certification Expiry"],

                    ["total_validations", "Total Validations"],

                    ["pass_count", "Pass"],

                    ["fail_count", "Fail"],

                    ["warning_count", "Warning"],

                    ["latest_validation_result", "Latest Result"],

                    ["latest_validation_at", "Latest Validation"],

                    ["status", "Status"]

                ];


                const escapeCsv =
                    value => {

                        const text =

                            value === null ||
                            value === undefined

                                ? ""

                                : typeof value ===
                                    "object"

                                    ? JSON.stringify(
                                        value
                                    )

                                    : String(value);


                        return `"${text.replace(
                            /"/g,
                            '""'
                        )}"`;

                    };


                const csv = [

                    columns
                        .map(
                            ([, label]) =>
                                escapeCsv(
                                    label
                                )
                        )
                        .join(","),

                    ...rows.map(
                        row =>

                            columns
                                .map(
                                    ([key]) =>
                                        escapeCsv(
                                            row[key]
                                        )
                                )
                                .join(",")
                    )

                ].join("\n");


                const blob =
                    new Blob(
                        [
                            "\uFEFF",
                            csv
                        ],
                        {
                            type:
                                "text/csv;charset=utf-8"
                        }
                    );


                const url =
                    window.URL
                        .createObjectURL(
                            blob
                        );


                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    url;


                link.download =
                    "Skill_Matrix.csv";


                document.body
                    .appendChild(
                        link
                    );


                link.click();

                link.remove();


                window.URL
                    .revokeObjectURL(
                        url
                    );


                showToast(
                    "CSV exported successfully."
                );

            }
            catch (error) {

                showToast(

                    getErrorMessage(
                        error,
                        "Export failed."
                    ),

                    "danger"

                );

            }

        };


    // ======================================================
    // FILTER MASTER
    // ======================================================

    const filteredSkills =
        skills.filter(
            skill => {

                const search =
                    searchText
                        .trim()
                        .toLowerCase();


                const values = [

                    skill.skill_code,

                    skill.skill_name,

                    skill.category,

                    skill.description,

                    getCompanyName(
                        skill.company_id
                    )

                ];


                const searchMatch =

                    !search ||

                    values.some(
                        value =>

                            String(
                                value || ""
                            )
                                .toLowerCase()
                                .includes(search)
                    );


                const statusMatch =

                    statusFilter ===
                    "ALL" ||

                    skill.status ===
                    statusFilter;


                return (
                    searchMatch &&
                    statusMatch
                );

            }
        );


    // ======================================================
    // COLUMNS - MASTER
    // ======================================================

    const skillColumns = [

        {
            key: "skill_code",
            label: "Skill Code"
        },

        {
            key: "skill_name",
            label: "Skill Name"
        },

        {
            key: "category",
            label: "Category"
        },

        {
            key: "company_id",
            label: "Company",

            render:
                row =>
                    getCompanyName(
                        row.company_id
                    )
        },

        {
            key: "validity_months",
            label: "Validity (Months)"
        },

        {
            key: "renewal_required",
            label: "Renewal",

            render:
                row => (

                    <Badge
                        bg={
                            row.renewal_required
                                ? "primary"
                                : "secondary"
                        }
                    >

                        {
                            row.renewal_required
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key: "status",
            label: "Status",

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


    // ======================================================
    // COLUMNS - LEVEL
    // ======================================================

    const levelColumns = [

        {
            key: "skill_code",
            label: "Skill",

            render:
                row =>

                    row.skill_code

                        ? `${
                            row.skill_code
                        } - ${
                            row.skill_name ||
                            ""
                        }`

                        : getSkillLabel(
                            row.skill_id
                        )
        },

        {
            key: "level_code",
            label: "Level Code"
        },

        {
            key: "level_name",
            label: "Level Name"
        },

        {
            key: "level_rank",
            label: "Rank"
        },

        {
            key: "min_score",
            label: "Min Score"
        },

        {
            key: "max_score",
            label: "Max Score"
        },

        {
            key: "can_train",
            label: "Can Train",

            render:
                row => (

                    <Badge
                        bg={
                            row.can_train
                                ? "success"
                                : "secondary"
                        }
                    >

                        {
                            row.can_train
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key: "can_approve",
            label: "Can Approve",

            render:
                row => (

                    <Badge
                        bg={
                            row.can_approve
                                ? "success"
                                : "secondary"
                        }
                    >

                        {
                            row.can_approve
                                ? "YES"
                                : "NO"
                        }

                    </Badge>

                )
        },

        {
            key: "is_active",
            label: "Status",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.is_active
                                ? "ACTIVE"
                                : "INACTIVE"
                        }
                    />

                )
        }

    ];


    // ======================================================
    // COLUMNS - CERTIFICATION
    // ======================================================

    const certificationColumns = [

        {
            key: "user_id",
            label: "User ID"
        },

        {
            key: "skill_code",
            label: "Skill",

            render:
                row =>

                    row.skill_code

                        ? `${
                            row.skill_code
                        } - ${
                            row.skill_name ||
                            ""
                        }`

                        : getSkillLabel(
                            row.skill_id
                        )
        },

        {
            key: "level_code",
            label: "Level",

            render:
                row =>

                    row.level_code

                        ? `${
                            row.level_code
                        } - ${
                            row.level_name ||
                            ""
                        }`

                        : getLevelLabel(
                            row.skill_level_id
                        )
        },

        {
            key: "plant_id",
            label: "Plant",

            render:
                row =>
                    getPlantName(
                        row.plant_id
                    )
        },

        {
            key: "line_id",
            label: "Line",

            render:
                row =>
                    getLineName(
                        row.line_id
                    )
        },

        {
            key: "machine_id",
            label: "Machine",

            render:
                row =>
                    getMachineName(
                        row.machine_id
                    )
        },

        {
            key: "certificate_no",
            label: "Certificate"
        },

        {
            key: "issued_at",
            label: "Issued",

            render:
                row =>
                    formatDateTime(
                        row.issued_at
                    )
        },

        {
            key: "expires_at",
            label: "Expires",

            render:
                row =>
                    formatDateTime(
                        row.expires_at
                    )
        },

        {
            key: "verified_by",
            label: "Verified By"
        },

        {
            key: "status",
            label: "Status",

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


    // ======================================================
    // COLUMNS - RUNTIME
    // ======================================================

    const runtimeColumns = [

        {
            key:
                "skill_validation_event_id",

            label:
                "Event ID"
        },

        {
            key: "user_id",
            label: "User ID"
        },

        {
            key: "skill_code",
            label: "Skill Code"
        },

        {
            key: "skill_name",
            label: "Skill Name"
        },

        {
            key: "level_name",
            label: "Skill Level"
        },

        {
            key: "required_level_rank",
            label: "Required Rank"
        },

        {
            key: "actual_level_rank",
            label: "Actual Rank"
        },

        {
            key: "validation_result",
            label: "Result",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.validation_result
                        }
                    />

                )
        },

        {
            key: "reason",
            label: "Reason"
        },

        {
            key: "event_ts",
            label: "Event Time",

            render:
                row =>
                    formatDateTime(
                        row.event_ts
                    )
        },

        {
            key: "source_system",
            label: "Source"
        }

    ];


    // ======================================================
    // COLUMNS - REPORT
    // ======================================================

    const reportColumns = [

        {
            key: "skill_code",
            label: "Skill Code"
        },

        {
            key: "skill_name",
            label: "Skill Name"
        },

        {
            key: "category",
            label: "Category"
        },

        {
            key: "validity_months",
            label: "Validity"
        },

        {
            key: "total_levels",
            label: "Levels"
        },

        {
            key: "active_levels",
            label: "Active Levels"
        },

        {
            key: "total_certifications",
            label: "Certifications"
        },

        {
            key: "active_certifications",
            label: "Active Certifications"
        },

        {
            key: "next_expiry_at",
            label: "Next Expiry",

            render:
                row =>
                    formatDateTime(
                        row.next_expiry_at
                    )
        },

        {
            key: "total_validations",
            label: "Validations"
        },

        {
            key: "pass_count",
            label: "Pass"
        },

        {
            key: "fail_count",
            label: "Fail"
        },

        {
            key: "warning_count",
            label: "Warning"
        },

        {
            key:
                "latest_validation_result",

            label:
                "Latest Result",

            render:
                row =>

                    row.latest_validation_result

                        ? (
                            <StatusBadge
                                status={
                                    row.latest_validation_result
                                }
                            />
                        )

                        : "-"
        },

        {
            key:
                "latest_validation_at",

            label:
                "Latest Validation",

            render:
                row =>
                    formatDateTime(
                        row.latest_validation_at
                    )
        },

        {
            key: "status",
            label: "Status",

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


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <>

<div className="skill-matrix container-fluid">

            {/* =================================================
                TOAST
            ================================================= */}

           <Toast
    show={toast.show}
    onClose={hideToast}
    delay={3000}
    autohide
    bg={toast.variant}
    className="skill-matrix-toast position-fixed top-0 end-0 m-3"
    style={{
        zIndex: 9999
    }}
>
    <Toast.Body>
        {toast.message}
    </Toast.Body>
</Toast>


            {/* =================================================
                HEADER
            ================================================= */}

            <Card className="shadow-sm border-0 mb-4">

                <Card.Body>

                    <Row className="align-items-center g-3">

                        <Col>

                            <h3 className="mb-1">
                                Skill Matrix
                            </h3>

                            <small className="text-muted">
                                Master Data / Skill Matrix
                            </small>

                        </Col>


                        <Col xs="auto">

                            <div className="d-flex gap-2 flex-wrap">

                                <Button
                                    variant="outline-primary"
                                    onClick={() => {

                                        loadLevels();

                                        setShowLevelConfig(
                                            true
                                        );

                                    }}
                                >
                                    Skill Level Config
                                </Button>


                                <Button
                                    variant="outline-primary"
                                    onClick={() => {

                                        loadCertifications();

                                        setShowCertificationConfig(
                                            true
                                        );

                                    }}
                                >
                                    Operator Certification
                                </Button>


                                <Button
                                    variant="primary"
                                    onClick={
                                        openAddModal
                                    }
                                >

                                    <Plus /> Add Skill

                                </Button>

                            </div>

                        </Col>

                    </Row>

                </Card.Body>

            </Card>


            {/* =================================================
                SEARCH
            ================================================= */}

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
                    setStatusFilter
                }
                onRefresh={
                    loadInitialData
                }
                onExecute={
                    openExecute
                }
                onRuntime={
                    loadRuntime
                }
                onReport={
                    loadReport
                }
                onExport={
                    exportSkill
                }
                placeholder="Search Skill..."
            />


            {/* =================================================
                MASTER TABLE
            ================================================= */}

            <DataTable
                columns={
                    skillColumns
                }
                data={
                    filteredSkills
                }
                loading={
                    loading
                }
                emptyMessage="No Skill Found"
                renderActions={
                    skill => (

                        <ActionButtons
                            onEdit={() =>
                                openEditModal(
                                    skill
                                )
                            }
                            onDelete={() =>
                                deleteSkill(
                                    skill
                                )
                            }
                        />

                    )
                }
            />


            {/* =================================================
                SKILL MASTER FORM
            ================================================= */}

            <Modal
                show={
                    showForm
                }
                onHide={() => {

                    resetForm();

                    setShowForm(false);

                }}
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {
                            editId
                                ? "Update Skill"
                                : "Create Skill"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Company *
                                    </Form.Label>

                                    <Form.Select
                                        name="company_id"
                                        value={
                                            formData.company_id
                                        }
                                        disabled={Boolean(editId)}
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="">
                                            Select Company
                                        </option>


                                        {
                                            companies.map(
                                                company => (

                                                    <option
                                                        key={
                                                            company.company_id
                                                        }
                                                        value={
                                                            company.company_id
                                                        }
                                                    >

                                                        {
                                                            company.company_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Skill Code *
                                    </Form.Label>

                                    <Form.Control
                                        name="skill_code"
                                        value={
                                            formData.skill_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="SKILL-001"
                                        maxLength={75}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Skill Name *
                                    </Form.Label>

                                    <Form.Control
                                        name="skill_name"
                                        value={
                                            formData.skill_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Torque Tool Operation"
                                        maxLength={150}
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Category
                                    </Form.Label>

                                    <Form.Control
                                        name="category"
                                        value={
                                            formData.category
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="ASSEMBLY"
                                        maxLength={75}
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Validity Months
                                    </Form.Label>

                                    <Form.Control
                                        name="validity_months"
                                        type="number"
                                        min="1"
                                        value={
                                            formData.validity_months
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Status
                                    </Form.Label>

                                    <Form.Select
                                        name="status"
                                        value={
                                            formData.status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        {
                                            SKILL_STATUSES.map(
                                                status => (

                                                    <option
                                                        key={
                                                            status
                                                        }
                                                        value={
                                                            status
                                                        }
                                                    >
                                                        {status}
                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Description
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={
                                    formData.description
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </Form.Group>


                        <Form.Check
                            type="checkbox"
                            name="renewal_required"
                            label="Renewal Required"
                            checked={
                                formData.renewal_required
                            }
                            onChange={
                                handleChange
                            }
                        />

                    </Form>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => {

                            resetForm();

                            setShowForm(false);

                        }}
                    >
                        Cancel
                    </Button>


                    <Button
                        variant="primary"
                        disabled={
                            saving
                        }
                        onClick={
                            saveSkill
                        }
                    >

                        {
                            saving

                                ? (
                                    <>
                                        <Spinner
                                            size="sm"
                                            animation="border"
                                            className="me-2"
                                        />

                                        Saving...
                                    </>
                                )

                                : editId
                                    ? "Update Skill"
                                    : "Save Skill"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                LEVEL CONFIG LIST
            ================================================= */}

            <Modal
                show={
                    showLevelConfig
                }
                onHide={() =>
                    setShowLevelConfig(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Skill Level Configuration
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddLevel
                            }
                        >
                            <Plus /> Add Level
                        </Button>

                    </div>


                    <DataTable
                        columns={
                            levelColumns
                        }
                        data={
                            levels
                        }
                        loading={
                            loading
                        }
                        emptyMessage="No Skill Level Found"
                        renderActions={
                            level => (

                                <ActionButtons
                                    onEdit={() =>
                                        openEditLevel(
                                            level
                                        )
                                    }
                                    onDelete={() =>
                                        deleteLevel(
                                            level
                                        )
                                    }
                                />

                            )
                        }
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowLevelConfig(
                                false
                            )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                LEVEL FORM
            ================================================= */}

            <Modal
                show={
                    showLevelForm
                }
                onHide={() => {

                    setShowLevelForm(false);

                    setLevelEditId(null);

                    setLevelForm(
                        levelInitialState
                    );

                    setShowLevelConfig(true);

                }}
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {
                            levelEditId
                                ? "Update Skill Level"
                                : "Add Skill Level"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Skill *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            levelForm.skill_id
                                        }
                                        onChange={
                                            event =>

                                                setLevelForm(
                                                    previous => ({

                                                        ...previous,

                                                        skill_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Skill
                                        </option>


                                        {
                                            skills.map(
                                                skill => (

                                                    <option
                                                        key={
                                                            skill.skill_id
                                                        }
                                                        value={
                                                            skill.skill_id
                                                        }
                                                    >

                                                        {
                                                            skill.skill_code
                                                        }

                                                        {" - "}

                                                        {
                                                            skill.skill_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Level Code *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            levelForm.level_code
                                        }
                                        maxLength={30}
                                        onChange={
                                            event =>

                                                setLevelForm(
                                                    previous => ({

                                                        ...previous,

                                                        level_code:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Level Rank *
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            levelForm.level_rank
                                        }
                                        onChange={
                                            event =>

                                                setLevelForm(
                                                    previous => ({

                                                        ...previous,

                                                        level_rank:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Level Name *
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            levelForm.level_name
                                        }
                                        maxLength={100}
                                        onChange={
                                            event =>

                                                setLevelForm(
                                                    previous => ({

                                                        ...previous,

                                                        level_name:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Minimum Score
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={
                                            levelForm.min_score
                                        }
                                        onChange={
                                            event =>

                                                setLevelForm(
                                                    previous => ({

                                                        ...previous,

                                                        min_score:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Maximum Score
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={
                                            levelForm.max_score
                                        }
                                        onChange={
                                            event =>

                                                setLevelForm(
                                                    previous => ({

                                                        ...previous,

                                                        max_score:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Eligibility Config
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={
                                    levelForm.eligibility_config
                                }
                                onChange={
                                    event =>

                                        setLevelForm(
                                            previous => ({

                                                ...previous,

                                                eligibility_config:
                                                    event.target.value

                                            })
                                        )
                                }
                            />

                        </Form.Group>


                        <Row>

                            <Col md={4}>

                                <Form.Check
                                    type="checkbox"
                                    label="Can Train"
                                    checked={
                                        levelForm.can_train
                                    }
                                    onChange={
                                        event =>

                                            setLevelForm(
                                                previous => ({

                                                    ...previous,

                                                    can_train:
                                                        event.target.checked

                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Check
                                    type="checkbox"
                                    label="Can Approve"
                                    checked={
                                        levelForm.can_approve
                                    }
                                    onChange={
                                        event =>

                                            setLevelForm(
                                                previous => ({

                                                    ...previous,

                                                    can_approve:
                                                        event.target.checked

                                                })
                                            )
                                    }
                                />

                            </Col>


                            <Col md={4}>

                                <Form.Check
                                    type="checkbox"
                                    label="Active"
                                    checked={
                                        levelForm.is_active
                                    }
                                    onChange={
                                        event =>

                                            setLevelForm(
                                                previous => ({

                                                    ...previous,

                                                    is_active:
                                                        event.target.checked

                                                })
                                            )
                                    }
                                />

                            </Col>

                        </Row>

                    </Form>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => {

                            setShowLevelForm(false);

                            setLevelEditId(null);

                            setLevelForm(
                                levelInitialState
                            );

                            setShowLevelConfig(true);

                        }}
                    >
                        Cancel
                    </Button>


                    <Button
                        variant="primary"
                        disabled={
                            saving
                        }
                        onClick={
                            saveLevel
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : levelEditId
                                    ? "Update Level"
                                    : "Save Level"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                CERTIFICATION CONFIG LIST
            ================================================= */}

            <Modal
                show={
                    showCertificationConfig
                }
                onHide={() =>
                    setShowCertificationConfig(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Operator Certification
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div className="d-flex justify-content-end mb-3">

                        <Button
                            onClick={
                                openAddCertification
                            }
                        >
                            <Plus /> Add Certification
                        </Button>

                    </div>


                    <DataTable
                        columns={
                            certificationColumns
                        }
                        data={
                            certifications
                        }
                        loading={
                            loading
                        }
                        emptyMessage="No Operator Certification Found"
                        renderActions={
                            certification => (

                                <ActionButtons
                                    onEdit={() =>
                                        openEditCertification(
                                            certification
                                        )
                                    }
                                    onDelete={() =>
                                        deleteCertification(
                                            certification
                                        )
                                    }
                                />

                            )
                        }
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowCertificationConfig(
                                false
                            )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                CERTIFICATION FORM
            ================================================= */}

            <Modal
                show={
                    showCertificationForm
                }
                onHide={() => {

                    setShowCertificationForm(false);

                    setCertificationEditId(null);

                    setCertificationForm(
                        certificationInitialState
                    );

                    setShowCertificationConfig(true);

                }}
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        {
                            certificationEditId
                                ? "Update Operator Certification"
                                : "Add Operator Certification"
                        }

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        User ID *
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            certificationForm.user_id
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        user_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                    <Form.Text className="text-muted">
                                        Enter existing User Master ID.
                                    </Form.Text>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Skill *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            certificationForm.skill_id
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        skill_id:
                                                            event.target.value,

                                                        skill_level_id: "",

                                                        plant_id: "",

                                                        line_id: "",

                                                        machine_id: ""

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Skill
                                        </option>


                                        {
                                            skills.map(
                                                skill => (

                                                    <option
                                                        key={
                                                            skill.skill_id
                                                        }
                                                        value={
                                                            skill.skill_id
                                                        }
                                                    >

                                                        {
                                                            skill.skill_code
                                                        }

                                                        {" - "}

                                                        {
                                                            skill.skill_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Skill Level *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            certificationForm.skill_level_id
                                        }
                                        disabled={
                                            !certificationForm.skill_id
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        skill_level_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Skill Level
                                        </option>


                                        {
                                            certificationLevels.map(
                                                level => (

                                                    <option
                                                        key={
                                                            level.skill_level_id
                                                        }
                                                        value={
                                                            level.skill_level_id
                                                        }
                                                    >

                                                        {
                                                            level.level_rank
                                                        }

                                                        {" - "}

                                                        {
                                                            level.level_code
                                                        }

                                                        {" - "}

                                                        {
                                                            level.level_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Plant
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            certificationForm.plant_id
                                        }
                                        disabled={
                                            !certificationForm.skill_id
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id: "",

                                                        machine_id: ""

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            All Plants
                                        </option>


                                        {
                                            certificationPlants.map(
                                                plant => (

                                                    <option
                                                        key={
                                                            plant.plant_id
                                                        }
                                                        value={
                                                            plant.plant_id
                                                        }
                                                    >

                                                        {
                                                            plant.plant_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Line
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            certificationForm.line_id
                                        }
                                        disabled={
                                            !certificationForm.plant_id
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        line_id:
                                                            event.target.value,

                                                        machine_id: ""

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            All Lines
                                        </option>


                                        {
                                            certificationLines.map(
                                                line => (

                                                    <option
                                                        key={
                                                            line.line_id
                                                        }
                                                        value={
                                                            line.line_id
                                                        }
                                                    >

                                                        {
                                                            line.line_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Machine
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            certificationForm.machine_id
                                        }
                                        disabled={
                                            !certificationForm.plant_id
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        machine_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            All Machines
                                        </option>


                                        {
                                            certificationMachines.map(
                                                machine => (

                                                    <option
                                                        key={
                                                            machine.machine_id
                                                        }
                                                        value={
                                                            machine.machine_id
                                                        }
                                                    >

                                                        {
                                                            machine.machine_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Certificate No
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            certificationForm.certificate_no
                                        }
                                        maxLength={100}
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        certificate_no:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Issued At
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            certificationForm.issued_at
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        issued_at:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Expires At
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            certificationForm.expires_at
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        expires_at:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Status
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            certificationForm.status
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        status:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        {
                                            CERTIFICATION_STATUSES.map(
                                                status => (

                                                    <option
                                                        key={
                                                            status
                                                        }
                                                        value={
                                                            status
                                                        }
                                                    >

                                                        {status}

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Verified By User ID
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            certificationForm.verified_by
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        verified_by:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Verified At
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            certificationForm.verified_at
                                        }
                                        onChange={
                                            event =>

                                                setCertificationForm(
                                                    previous => ({

                                                        ...previous,

                                                        verified_at:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Evidence URL
                            </Form.Label>

                            <Form.Control
                                value={
                                    certificationForm.evidence_url
                                }
                                maxLength={500}
                                onChange={
                                    event =>

                                        setCertificationForm(
                                            previous => ({

                                                ...previous,

                                                evidence_url:
                                                    event.target.value

                                            })
                                        )
                                }
                            />

                        </Form.Group>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Remarks
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={
                                    certificationForm.remarks
                                }
                                onChange={
                                    event =>

                                        setCertificationForm(
                                            previous => ({

                                                ...previous,

                                                remarks:
                                                    event.target.value

                                            })
                                        )
                                }
                            />

                        </Form.Group>

                    </Form>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => {

                            setShowCertificationForm(false);

                            setCertificationEditId(null);

                            setCertificationForm(
                                certificationInitialState
                            );

                            setShowCertificationConfig(true);

                        }}
                    >
                        Cancel
                    </Button>


                    <Button
                        variant="primary"
                        disabled={
                            saving
                        }
                        onClick={
                            saveCertification
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : certificationEditId
                                    ? "Update Certification"
                                    : "Save Certification"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                EXECUTE
            ================================================= */}

            <Modal
                show={
                    showExecute
                }
                onHide={() => {

                    setExecuteForm(
                        executeInitialState
                    );

                    setShowExecute(false);

                }}
                centered
                backdrop="static"
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Execute Skill Validation
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form>

                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        User ID *
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            executeForm.user_id
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        user_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Skill *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.skill_id
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        skill_id:
                                                            event.target.value,

                                                        skill_level_id: "",

                                                        actual_level_rank: "",

                                                        plant_id: "",

                                                        line_id: "",

                                                        machine_id: "",

                                                        route_step_id: ""

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Skill
                                        </option>


                                        {
                                            skills

                                                .filter(
                                                    skill =>
                                                        skill.status ===
                                                        "ACTIVE"
                                                )

                                                .map(
                                                    skill => (

                                                        <option
                                                            key={
                                                                skill.skill_id
                                                            }
                                                            value={
                                                                skill.skill_id
                                                            }
                                                        >

                                                            {
                                                                skill.skill_code
                                                            }

                                                            {" - "}

                                                            {
                                                                skill.skill_name
                                                            }

                                                        </option>

                                                    )
                                                )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Actual Skill Level
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.skill_level_id
                                        }
                                        disabled={
                                            !executeForm.skill_id
                                        }
                                        onChange={
                                            event => {

                                                const levelId =
                                                    event.target.value;


                                                const level =
                                                    levels.find(
                                                        item =>
                                                            sameId(
                                                                item.skill_level_id,
                                                                levelId
                                                            )
                                                    );


                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        skill_level_id:
                                                            levelId,

                                                        actual_level_rank:
                                                            level
                                                                ?.level_rank ??
                                                            ""

                                                    })
                                                );

                                            }
                                        }
                                    >

                                        <option value="">
                                            Select Skill Level
                                        </option>


                                        {
                                            executeLevels.map(
                                                level => (

                                                    <option
                                                        key={
                                                            level.skill_level_id
                                                        }
                                                        value={
                                                            level.skill_level_id
                                                        }
                                                    >

                                                        Rank {
                                                            level.level_rank
                                                        }

                                                        {" - "}

                                                        {
                                                            level.level_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Plant
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.plant_id
                                        }
                                        disabled={
                                            !executeForm.skill_id
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        plant_id:
                                                            event.target.value,

                                                        line_id: "",

                                                        machine_id: "",

                                                        route_step_id: ""

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Plant
                                        </option>


                                        {
                                            executePlants.map(
                                                plant => (

                                                    <option
                                                        key={
                                                            plant.plant_id
                                                        }
                                                        value={
                                                            plant.plant_id
                                                        }
                                                    >

                                                        {
                                                            plant.plant_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Line
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.line_id
                                        }
                                        disabled={
                                            !executeForm.plant_id
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        line_id:
                                                            event.target.value,

                                                        machine_id: "",

                                                        route_step_id: ""

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Line
                                        </option>


                                        {
                                            executeLines.map(
                                                line => (

                                                    <option
                                                        key={
                                                            line.line_id
                                                        }
                                                        value={
                                                            line.line_id
                                                        }
                                                    >

                                                        {
                                                            line.line_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Machine
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.machine_id
                                        }
                                        disabled={
                                            !executeForm.plant_id
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        machine_id:
                                                            event.target.value,

                                                        route_step_id: ""

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Machine
                                        </option>


                                        {
                                            executeMachines.map(
                                                machine => (

                                                    <option
                                                        key={
                                                            machine.machine_id
                                                        }
                                                        value={
                                                            machine.machine_id
                                                        }
                                                    >

                                                        {
                                                            machine.machine_name
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={3}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Route Step
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.route_step_id
                                        }
                                        disabled={
                                            !executeForm.skill_id
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        route_step_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        <option value="">
                                            Select Route Step
                                        </option>


                                        {
                                            executeRouteSteps.map(
                                                step => (

                                                    <option
                                                        key={
                                                            step.route_step_id
                                                        }
                                                        value={
                                                            step.route_step_id
                                                        }
                                                    >

                                                        {
                                                            getRouteStepLabel(
                                                                step
                                                            )
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Validation Result *
                                    </Form.Label>

                                    <Form.Select
                                        value={
                                            executeForm.validation_result
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        validation_result:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    >

                                        {
                                            VALIDATION_RESULTS.map(
                                                result => (

                                                    <option
                                                        key={
                                                            result
                                                        }
                                                        value={
                                                            result
                                                        }
                                                    >
                                                        {result}
                                                    </option>

                                                )
                                            )
                                        }

                                    </Form.Select>

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Required Level Rank
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            executeForm.required_level_rank
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        required_level_rank:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={4}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Actual Level Rank
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={
                                            executeForm.actual_level_rank
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        actual_level_rank:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Reason
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={
                                    executeForm.reason
                                }
                                onChange={
                                    event =>

                                        setExecuteForm(
                                            previous => ({

                                                ...previous,

                                                reason:
                                                    event.target.value

                                            })
                                        )
                                }
                            />

                        </Form.Group>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Event Time
                                    </Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        value={
                                            executeForm.event_ts
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        event_ts:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Source System
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.source_system
                                        }
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        source_system:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Row>

                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Correlation ID
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.correlation_id
                                        }
                                        placeholder="Optional UUID"
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        correlation_id:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>


                            <Col md={6}>

                                <Form.Group className="mb-3">

                                    <Form.Label>
                                        Idempotency Key
                                    </Form.Label>

                                    <Form.Control
                                        value={
                                            executeForm.idempotency_key
                                        }
                                        maxLength={150}
                                        onChange={
                                            event =>

                                                setExecuteForm(
                                                    previous => ({

                                                        ...previous,

                                                        idempotency_key:
                                                            event.target.value

                                                    })
                                                )
                                        }
                                    />

                                </Form.Group>

                            </Col>

                        </Row>


                        <Form.Group className="mb-3">

                            <Form.Label>
                                Payload
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={
                                    executeForm.payload
                                }
                                onChange={
                                    event =>

                                        setExecuteForm(
                                            previous => ({

                                                ...previous,

                                                payload:
                                                    event.target.value

                                            })
                                        )
                                }
                            />

                        </Form.Group>

                    </Form>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => {

                            setExecuteForm(
                                executeInitialState
                            );

                            setShowExecute(false);

                        }}
                    >
                        Cancel
                    </Button>


                    <Button
                        variant="primary"
                        disabled={
                            saving
                        }
                        onClick={
                            executeSkillValidation
                        }
                    >

                        {
                            saving
                                ? "Saving..."
                                : "Execute"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                RUNTIME
            ================================================= */}

            <Modal
                show={
                    showRuntime
                }
                onHide={() =>
                    setShowRuntime(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Skill Validation Runtime
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <DataTable
                        columns={
                            runtimeColumns
                        }
                        data={
                            runtimeData
                        }
                        loading={
                            loading
                        }
                        emptyMessage="No Skill Validation Events Found"
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowRuntime(
                                false
                            )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>


            {/* =================================================
                REPORT
            ================================================= */}

            <Modal
                show={
                    showReport
                }
                onHide={() =>
                    setShowReport(
                        false
                    )
                }
                centered
                size="xl"
            >

                <Modal.Header closeButton>

                    <Modal.Title>
                        Skill Matrix Report
                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <DataTable
                        columns={
                            reportColumns
                        }
                        data={
                            reportData
                        }
                        loading={
                            loading
                        }
                        emptyMessage="No Skill Matrix Report Data Found"
                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowReport(
                                false
                            )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>

        </div>
</>

    );

}


export default SkillMatrix;