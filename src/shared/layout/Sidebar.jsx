import React, { useEffect, useState } from "react";
import { Accordion } from "react-bootstrap";
import {
    HouseDoorFill,
    Building,
    Diagram3Fill,
    CpuFill,
    PersonCircle,
    List,
    CalendarCheckFill
} from "react-bootstrap-icons";
import { NavLink, useLocation } from "react-router-dom";

import { Search, Activity, Wrench, ShieldCheck } from "lucide-react";
import "./Sidebar.css";

const USER_KEY = "operatex_user";

function readSavedUser() {
    try {
        const value = JSON.parse(
            localStorage.getItem(USER_KEY) || "null"
        );

        if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            return value;
        }

        return null;
    } catch {
        return null;
    }
}

export const menuGroups = [
    {
        key: "0",
        title: "Enterprise Setup",
        Icon: Building,
        items: [
            {
                title: "Company Master",
                path: "/company-master"
            },
            {
                title: "Plant / Shop Master",
                path: "/plant-shop-master"
            },
            {
                title: "Line Master",
                path: "/line-master"
            },
            {
                title: "Shift Calendar",
                path: "/shift-calendar"
            },
            {
                title: "User Role Permission",
                path: "/user-role-permission"
            },
            {
                title: "Module-Enablement",
                path: "/module-Enablement"
            }
        ]
    },
    {
        key: "1",
        title: "Master Data",
        Icon: Diagram3Fill,
        items: [
            {
                title: "Machine Master",
                path: "/machine-master"
            },
            {
                title: "Device Master",
                path: "/device-master"
            },
            {
                title: "Signal Mapping",
                path: "/signal-mapping"
            },
     {
    title: "Model Master",
    path: "/model-master"
},
            {
                title: "Part Master",
                path: "/part-master"
            },
            {
                title: "Process Master",
                path: "/process-master"
            },
            {title: "Station Master", path: "/station-master"},
            {
                title: "Route / Station Master",
                path: "/route-master"
            },
            {
                title: "Tool Master",
                path: "/tool-master"
            },
            {
                title: "Gauge / Instrument Master",
                path: "/gauge-instrument-master"
            },
            {
                title: "Document / SOP Master",
                path: "/document-master"
            },
            {
                title: "Skill-Matrix",
                path: "/skill-matrix"
            }
        ]
    },
    {
        key: "2",
        title: "Planning",
        Icon: CalendarCheckFill,
        items: [
            {
                title: "Production Order",
                path: "/production-order"
            },
            {
                title: "Production Plan",
                path: "/production-plan"
            },
            {
                title: "Shift Plan",
                path: "/shift-plan"
            },
            {
                title: "Scheduling Rules",
                path: "/scheduling-rules"
            },
            {
                title: "Material / Batch / Heat Code",
                path: "/material-batch-heat-code"
            },
            {
                title: "Changeover / Setup Plan",
                path: "/changeover-setup-plan"
            }
        ]
    },
    {
        key: "3",
        title: "Production Execution",
        Icon: CpuFill,
        items: [
            {
                title: "Operator Workstation",
                path: "/operator-workstation"
            },
            {
                title: "Production Count",
                path: "/production-count"
            },
            {
                title: "Cycle Time Tracking",
                path: "/cycle-time-tracking"
            },
            {
                title: "Machine Status",
                path: "/machine-status"
            },
            {
                title: "Line Indexing / Unit Movement",
                path: "/line-indexing-unit-movement"
            },
            {
                title: "Rework / Reject / Bypass",
                path: "/rework-reject-bypass"
            }
        ]
    },
    {
        key: "4",
        title: "OEE & Loss",
        Icon: Activity,
        items: [
            {
                title: "Downtime Detection",
                path: "/downtime-detection"
            },
            {
                title: "Availability",
                path: "/availability"
            },
            {
                title: "Performance",
                path: "/performance"
            },
            {
                title: "Quality",
                path: "/quality"
            },
            {
                title: "OEE",
                path: "/oee"
            },
            {
                title: "Breakdown Management",
                path: "/breakdown-management"
            },
            {
                title: "MTTR / MTBF",
                path: "/mttr-mtbf"
            },
            {
                title: "Loss Tree",
                path: "/loss-tree"
            }
        ]
    },
    {
        key: "6",
        title: "Maintenance Management",
        Icon: Wrench,
        items: [
            {
                title: "PM Strategy",
                path: "/maintenance/pm-strategy"
            },
             {
            title: "Maintenance Schedule",
            path: "/maintenance/maintenance-schedule"
        },
          {
    title: "Breakdown Maintenance",
    path: "/maintenance/breakdown-maintenance"
},
            { title: "Condition Monitoring", path: "/maintenance/condition-monitoring" },
            { title: "Spare Parts", path: "/maintenance/spare-parts" },
            { title: "Maintenance Interlock", path: "/maintenance/maintenance-interlock" }
        ]
    },
    {
        key: "5",
        title: "Quality Management",
        Icon: ShieldCheck,
        items: [
            {
                title: "Checksheet",
                path: "/quality/checksheet"
            },
            { title: "Gauge / SPC", path: "/quality/gauge-spc" },
            { title: "In-Process Inspection", path: "/quality/in-process-inspection" },
            { title: "Setup Approval", path: "/quality/setup-approval" },
            { title: "Part Rejection", path: "/quality/part-rejection" },
            { title: "Quality Notification", path: "/quality/quality-notification" },
            { title: "CAPA / Defect Workflow", path: "/quality/capa-defect-workflow" }
        ]
    },
    {
        key: "7",
        title: "Connectivity",
        Icon: CpuFill,
        items: [
            { title: "CNC Adapter", path: "/connectivity/cnc-adapter" },
            { title: ".NET Gateway", path: "/connectivity/net-gateway" },
            { title: "PLC / SPM Adapter", path: "/connectivity/plc-spm-adapter" },
            { title: "Scanner Adapter", path: "/connectivity/scanner-adapter" },
            { title: "Torque Tool Adapter", path: "/connectivity/torque-tool-adapter" },
            { title: "Gauge / Sensor Adapter", path: "/connectivity/gauge-sensor-adapter" },
            { title: "MQTT / Event Ingestion", path: "/connectivity/mqtt-event-ingestion" }
        ]
    },
    {
        key: "8",
        title: "Tooling",
        Icon: Wrench,
        items: [
            { title: "Tool Life Monitoring", path: "/tooling/tool-life-monitoring" },
            { title: "Tool Replacement", path: "/tooling/tool-replacement" },
            { title: "Tool Offset / Wear", path: "/tooling/tool-offset-wear" },
            { title: "Tool Calibration", path: "/tooling/tool-calibration" }
        ]
    },
    { key: "new-traceability", title: "Traceability", Icon: Diagram3Fill, items: [
      { title: "Unit Serial / VIN / Engine ID", path: "/traceability/unit-serial-vin-engine-id" },
      { title: "Barcode Validation", path: "/traceability/barcode-validation" },
      { title: "Process Result", path: "/traceability/process-result" },
      { title: "Assembly Linking", path: "/traceability/assembly-linking" },
      { title: "Genealogy", path: "/traceability/genealogy" },
      { title: "Rework / Repair Trace", path: "/traceability/rework-repair-trace" },
      { title: "Final Trace Report", path: "/traceability/final-trace-report" }
    ] },
    { key: "new-rules-alerts", title: "Rules & Alerts", Icon: ShieldCheck, items: [
      { title: "Rule Engine", path: "/rules-alerts/rule-engine" },
      { title: "Alert Engine", path: "/rules-alerts/alert-engine" },
      { title: "Notification Engine", path: "/rules-alerts/notification-engine" },
      { title: "Interlock Engine", path: "/rules-alerts/interlock-engine" },
      { title: "Bypass Governance", path: "/rules-alerts/bypass-governance" },
      { title: "Audit Trail", path: "/rules-alerts/audit-trail" }
    ] },
    { key: "new-analytics-reports", title: "Analytics & Reports", Icon: Activity, items: [
      { title: "Production Dashboard", path: "/analytics-reports/production-dashboard" },
      { title: "Oee Dashboard", path: "/analytics-reports/oee-dashboard" },
      { title: "Quality Dashboard", path: "/analytics-reports/quality-dashboard" },
      { title: "Maintenance Dashboard", path: "/analytics-reports/maintenance-dashboard" },
      { title: "Traceability Dashboard", path: "/analytics-reports/traceability-dashboard" },
      { title: "Report Builder", path: "/analytics-reports/report-builder" },
      { title: "AI / Predictive Analytics", path: "/analytics-reports/ai-predictive-analytics" }
    ] },
    { key: "new-integration-governance", title: "Integration & Governance", Icon: CpuFill, items: [
      { title: "API Layer", path: "/integration-governance/api-layer" },
      { title: "ERP / SAP Integration", path: "/integration-governance/erp-sap-integration" },
      { title: "Data Import / Export", path: "/integration-governance/data-import-export" },
      { title: "Backup / Archive", path: "/integration-governance/backup-archive" },
      { title: "Security / Compliance", path: "/integration-governance/security-compliance" },
      { title: "Data Quality Monitor", path: "/integration-governance/data-quality-monitor" }
    ] }
];

function renderMenuItems(items) {
    return items.map((item) => {
        if (item.disabled) {
            return (
                <div
                    key={item.path}
                    className="submenu-link"
                    aria-disabled="true"
                    style={{
                        opacity: 0.45,
                        cursor: "not-allowed",
                        userSelect: "none"
                    }}
                    title="Module will be enabled after implementation"
                >
                    <span className="submenu-line" />
                    {item.title}
                </div>
            );
        }

        return (
            <NavLink
                key={item.path}
                to={item.path}
                className="submenu-link"
            >
                <span className="submenu-line" />
                {item.title}
            </NavLink>
        );
    });
}

export default function Sidebar() {
    const {pathname} = useLocation();
    const [user, setUser] = useState(readSavedUser);
    const [search,setSearch] = useState("");
    const activeGroup=menuGroups.find(g=>g.items.some(i=>i.path.toLowerCase()===pathname.toLowerCase()))?.key;
    const roleCode = String(user?.role_code || '').toUpperCase();
    const operatorPaths = new Set(['/operator-workstation','/machine-status','/quality/checksheet','/breakdown-management']);
    const fullAccess = roleCode === 'ADMIN' || roleCode === 'MANAGER';
    const allowedGroups = {
      OPERATOR: new Set(['Production Execution','Quality Management','OEE & Loss']),
      QUALITY: new Set(['Quality Management','OEE & Loss','Analytics & Reports']),
      PRODUCTION: new Set(['Planning','Production Execution','OEE & Loss','Analytics & Reports']),
      MAINTENANCE: new Set(['Maintenance Management','Tooling','OEE & Loss','Analytics & Reports'])
    };
    const groups=menuGroups.filter(g => fullAccess || (allowedGroups[roleCode]?.has(g.title) ?? false))
      .map(g=>({...g,items:g.items.filter(i=>
        (roleCode !== 'OPERATOR' || operatorPaths.has(i.path.toLowerCase())) &&
        (g.title+" "+i.title).toLowerCase().includes(search.toLowerCase()))})).filter(g=>g.items.length);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const handleStorage = (event) => {
            if (
                event.key === USER_KEY ||
                event.key === null
            ) {
                setUser(readSavedUser());
            }
        };

        const handleSessionEnded = () => {
            setUser(null);
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener(
            "operatex:session-ended",
            handleSessionEnded
        );

        return () => {
            window.removeEventListener(
                "storage",
                handleStorage
            );
            window.removeEventListener(
                "operatex:session-ended",
                handleSessionEnded
            );
        };
    }, []);

    return (
        <div
            className={
                collapsed
                    ? "sidebar collapsed"
                    : "sidebar"
            }
        >
            <div className="user-panel">
                <PersonCircle size={42} />

                {!collapsed && (
                    <div>
                        <div className="user-name">
                            {user?.username || ""}
                        </div>
                        <small>
                            {user?.role_name || ""}
                        </small>
                    </div>
                )}

                <button
                    type="button"
                    className="collapse-btn"
                    aria-label={
                        collapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                    aria-expanded={!collapsed}
                    onClick={() => {
                        setCollapsed((current) => !current);
                    }}
                >
                    <List size={22} />
                </button>
            </div>

            {!collapsed && <label className="ox-menu-search"><Search size={15}/><input aria-label="Find a module" placeholder="Find a module…" value={search} onChange={e=>setSearch(e.target.value)}/></label>}
            <NavLink
                title="Dashboard"
                to="/dashboard"
                className="menu-link"
            >
                <HouseDoorFill />
                {!collapsed && <span>Dashboard</span>}
            </NavLink>

            <Accordion
                alwaysOpen
                key={pathname+search+collapsed}
                defaultActiveKey={search?groups.map(g=>g.key):[activeGroup].filter(Boolean)}
                className="sidebar-menu"
            >
                {groups.map((group) => {
                    const Icon = group.Icon;

                    return (
                        <Accordion.Item
                            key={group.key}
                            eventKey={group.key}
                        >
                            <Accordion.Header onClick={()=>{if(collapsed)setCollapsed(false)}}>
                                <div className="accordion-title">
                                    <Icon />
                                    {!collapsed && (
                                        <span>
                                            {group.title}
                                        </span>
                                    )}
                                </div>
                            </Accordion.Header>

                            <Accordion.Body>
                                {renderMenuItems(group.items)}
                            </Accordion.Body>
                        </Accordion.Item>
                    );
                })}
            </Accordion>
            {!groups.length&&!collapsed&&<p className="ox-no-modules">No matching modules.</p>}
            {!collapsed&&<div className="ox-sidebar-foot"><b>THETAVEGA</b><span>Connected manufacturing. Clear decisions.</span></div>}
        </div>
    );
}