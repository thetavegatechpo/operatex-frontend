import React, {lazy} from "react";

import {
    Routes,
    Route,
    Navigate
} from "react-router-dom";



const Login = lazy(() => import("../features/auth/pages/login.jsx"));

import Layout from "../shared/layout/Layout.jsx";

const Dashboard = lazy(() => import("../features/dashboard/pages/Dashboard.jsx"));


/* =====================================
   ENTERPRISE SETUP
===================================== */

const CompanyMaster = lazy(() => import("../features/enterprise-setup/company-master/pages/CompanyMaster.jsx"));
const PlantShopMaster = lazy(() => import("../features/enterprise-setup/plant-shop-master/pages/PlantShopMaster.jsx"));
const LineMaster = lazy(() => import("../features/enterprise-setup/line-master/pages/LineMaster.jsx"));
const ShiftCalendar = lazy(() => import("../features/enterprise-setup/shift-calendar/pages/ShiftCalendar.jsx"));
const ModuleEnablement = lazy(() => import("../features/enterprise-setup/module-enablement/pages/ModuleEnablement.jsx"));
const UserRolePermission = lazy(() => import("../features/enterprise-setup/user-role-permission/pages/UserRolePermission.jsx"));
const StationMaster = lazy(() => import("../features/master-data/station-master/pages/StationMaster.jsx"));


/* =====================================
   MASTER DATA
===================================== */

const MachineMaster = lazy(() => import("../features/master-data/machine-master/pages/MachineMaster.jsx"));
const DeviceMaster = lazy(() => import("../features/master-data/device-master/pages/DeviceMaster.jsx"));
const SignalMapping = lazy(() => import("../features/master-data/signal-mapping/pages/SignalMapping.jsx"));
const PartMaster = lazy(() => import("../features/master-data/part-master/pages/PartMaster.jsx"));
const ProcessMaster = lazy(() => import("../features/master-data/process-master/pages/ProcessMaster.jsx"));
const RouteMaster = lazy(() => import("../features/master-data/route-station-master/pages/RouteMaster.jsx"));
const ToolMaster = lazy(() => import("../features/master-data/tool-master/pages/ToolMaster.jsx"));
const GaugeInstrumentMaster = lazy(() => import("../features/master-data/gauge-instrument-master/pages/GaugeInstrumentMaster.jsx"));
const DocumentMaster = lazy(() => import("../features/master-data/document-sop-master/pages/DocumentMaster.jsx"));
const SkillMatrix = lazy(() => import("../features/master-data/skill-matrix/pages/SkillMatrix.jsx"));

const ModelMaster = lazy(() =>
  import("../features/master-data/model-master/pages/ModelMaster.jsx")
);
/* =====================================
   PLANNING
===================================== */

const ProductionOrder = lazy(() => import("../features/planning/production-order/pages/ProductionOrder.jsx"));

const Productionplan = lazy(() => import("../features/planning/production-plan/pages/ProductionPlan.jsx"));

const ShiftPlan = lazy(() => import("../features/planning/shift-plan/pages/ShiftPlan.jsx"));
const SchedulingRules = lazy(() => import("../features/planning/scheduling-rules/pages/SchedulingRules.jsx"));
const MaterialBatchHeatCode = lazy(() => import("../features/planning/material-batch-heat-code/pages/MaterialBatchHeatCode.jsx"));
  const ChangeoverSetupPlan = lazy(() => import("../features/planning/changeover-setup-plan/pages/ChangeoverSetupPlan.jsx"));
const OperatorWorkstation = lazy(() => import("../features/production-execution/operator-workstation/pages/OperatorWorkstation.jsx"));

const ProductionCount = lazy(() => import("../features/production-execution/production-count/pages/ProductionCount.jsx"));

const CycleTimeTracking = lazy(() => import("../features/production-execution/cycle-time-tracking/pages/CycleTimeTracking.jsx")); 
    
const MachineStatus = lazy(() => import("../features/production-execution/machine-status/pages/MachineStatus.jsx")); 

const LineIndexingUnitMovement = lazy(() => import("../features/production-execution/line-indexing-unit-movement/pages/LineIndexingUnitMovement.jsx"));

const ReworkRejectBypass = lazy(() => import("../features/production-execution/rework-reject-bypass/pages/ReworkRejectBypass.jsx"));

  const DowntimeDetection = lazy(() => import("../features/oee-loss/downtime-detection/pages/DowntimeDetectionPage.jsx"));
const Availability = lazy(() => import("../features/oee-loss/availability/pages/Availability.jsx"));
const Performance = lazy(() => import("../features/oee-loss/performance/pages/Performance.jsx"));
const Quality = lazy(() => import("../features/oee-loss/quality/pages/Quality.jsx"));
const Checksheet = lazy(() => import("../features/quality/checksheet/pages/Checksheet.jsx"));
const OEE = lazy(() => import("../features/oee-loss/oee-formula/pages/OEE.jsx"));
const BreakdownManagement = lazy(() => import("../features/oee-loss/breakdown-management/pages/BreakdownManagement.jsx"));
const MttrMtbf = lazy(() => import("../features/oee-loss/mttr-mtbf/pages/MttrMtbf.jsx"));
const LossTree = lazy(() => import("../features/oee-loss/loss-tree/pages/LossTree.jsx"));
const PMStrategy = lazy(() => import("../features/maintenance/pm-strategy/pages/PMStrategy.jsx"));

const MaintenanceSchedule = lazy(() => import("../features/maintenance/maintenance-schedule/pages/MaintenanceSchedule.jsx"));
import BreakdownMaintenance from
  "../features/maintenance/breakdown-maintenance/pages/BreakdownMaintenance.jsx";


/* Imported Quality, Connectivity and Tooling screens */
const GaugeSPC = lazy(() => import("../features/quality/gauge-spc/pages/GaugeSPC.jsx"));
const InprocessInspection = lazy(() => import("../features/quality/in-process-inspection/pages/InprocessInspection.jsx"));
const SetupApproval = lazy(() => import("../features/quality/setup-approval/pages/SetupApproval.jsx"));
const CncAdapter = lazy(() => import("../features/connectivity/cnc-adapter/pages/CncAdapter.jsx"));
const NetGateway = lazy(() => import("../features/connectivity/net-gateway/pages/NetGateway.jsx"));
const ToolLifeMonitoring = lazy(() => import("../features/tooling/tool-life-monitoring/pages/ToolLifeMonitoring.jsx"));
const ToolReplacement = lazy(() => import("../features/tooling/tool-replacement/pages/ToolReplacement.jsx"));

/* =====================================
   PROTECTED ROUTE
===================================== */

import ProtectedRoute from '../features/auth/components/ProtectedRoute.jsx';

/* =====================================
   APP
===================================== */

function AppRoutes() {

    return (



            <Routes>

                {/* =====================================
                    LOGIN
                ====================================== */}

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* =====================================
                    MAIN LAYOUT
                ====================================== */}

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >

                    {/* DEFAULT */}

                    <Route
                        index
                        element={
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        }
                    />


                    {/* =====================================
                        DASHBOARD
                    ====================================== */}

                    <Route
                        path="dashboard"
                        element={<Dashboard />}
                    />


                    {/* =====================================
                        ENTERPRISE SETUP
                    ====================================== */}

                    <Route
                        path="company-master"
                        element={<CompanyMaster />}
                    />

                    <Route
                        path="plant-shop-master"
                        element={<PlantShopMaster />}
                    />

                    <Route
                        path="line-master"
                        element={<LineMaster />}
                    />

                    <Route
                        path="shift-calendar"
                        element={<ShiftCalendar />}
                    />

                    <Route
                        path="user-role-permission"
                        element={<UserRolePermission />}
                    />

                    <Route
                        path="module-enablement"
                        element={<ModuleEnablement />}
                    />

                    <Route
                        path="station-master"
                        element={<StationMaster />}
                    />


                    {/* =====================================
                        MASTER DATA
                    ====================================== */}

                    <Route
                        path="machine-master"
                        element={<MachineMaster />}
                    />

                    <Route
                        path="device-master"
                        element={<DeviceMaster />}
                    />

                    <Route
                        path="signal-mapping"
                        element={<SignalMapping />}
                    />
                    <Route
  path="model-master"
  element={<ModelMaster />}
/>

                    <Route
                        path="part-master"
                        element={<PartMaster />}
                    />

                    <Route
                        path="process-master"
                        element={<ProcessMaster />}
                    />

                    <Route
                        path="route-master"
                        element={<RouteMaster />}
                    />

                    <Route
                        path="tool-master"
                        element={<ToolMaster />}
                    />

                    <Route
                        path="gauge-instrument-master"
                        element={<GaugeInstrumentMaster />}
                    />

                    <Route
                        path="document-master"
                        element={<DocumentMaster />}
                    />

                    <Route
                        path="skill-matrix"
                        element={<SkillMatrix />}
                    />


                    {/* =====================================
                        PLANNING
                    ====================================== */}

                    <Route
                        path="production-order"
                        element={<ProductionOrder />}
                    />


                      <Route
                        path="production-Plan"
                        element={<Productionplan />}
                    />
<Route
    path="/shift-plan"
    element={<ShiftPlan />}
/>

<Route
  path="/scheduling-rules"
  element={<SchedulingRules />}
/>
<Route
  path="/material-batch-heat-code"
  element={<MaterialBatchHeatCode />}
/>

<Route
    path="/changeover-setup-plan"
    element={<ChangeoverSetupPlan />}
/>


<Route
  path="/operator-workstation"
  element={<OperatorWorkstation />}
/>

<Route
    path="/production-count"
    element={<ProductionCount />}
/>

<Route
    path="/cycle-time-tracking"
    element={<CycleTimeTracking />}
/>

<Route
    path="/machine-status"
    element={<MachineStatus />}
/>

<Route
    path="/line-indexing-unit-movement"
    element={<LineIndexingUnitMovement />}

/>  <Route
  path="/rework-reject-bypass"
  element={<ReworkRejectBypass />}
/> 
<Route
    path="/downtime-detection"
    element={<DowntimeDetection />}
/>
<Route path="/availability" element={<Availability />} />

<Route
    path="performance"
    element={<Performance />}
/>

<Route path="/oee" element={<OEE />} />


<Route path="/quality" element={<Quality />} />
<Route path="/quality/checksheet" element={<Checksheet />} />

<Route path="/breakdown-management" element={<BreakdownManagement />} />  
<Route path="/mttr-mtbf" element={<MttrMtbf />}/>  
<Route path="/loss-tree" element={<LossTree />} />

{/* Maintenance Management — inside authenticated Layout */}
<Route path="/maintenance/pm-strategy" element={<PMStrategy />} />
<Route
  path="/maintenance/maintenance-schedule"
  element={<MaintenanceSchedule />}
/>

<Route
  path="/maintenance/breakdown-maintenance"
  element={<BreakdownMaintenance />}
/>


{/* Imported screens: all remain inside the authenticated Layout. */}
<Route path="/quality/gauge-spc" element={<div data-operatex-feature="gauge-spc" style={{ display: "contents" }}><GaugeSPC /></div>} />
<Route path="/quality/in-process-inspection" element={<div data-operatex-feature="in-process-inspection" style={{ display: "contents" }}><InprocessInspection /></div>} />
<Route path="/quality/setup-approval" element={<div data-operatex-feature="setup-approval" style={{ display: "contents" }}><SetupApproval /></div>} />
<Route path="/connectivity/cnc-adapter" element={<div data-operatex-feature="cnc-adapter" style={{ display: "contents" }}><CncAdapter /></div>} />
<Route path="/connectivity/net-gateway" element={<div data-operatex-feature="net-gateway" style={{ display: "contents" }}><NetGateway /></div>} />
<Route path="/tooling/tool-life-monitoring" element={<div data-operatex-feature="tool-life-monitoring" style={{ display: "contents" }}><ToolLifeMonitoring /></div>} />
<Route path="/tooling/tool-replacement" element={<div data-operatex-feature="tool-replacement" style={{ display: "contents" }}><ToolReplacement /></div>} />

                </Route>

            


                {/* =====================================
                    404
                ====================================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>


    );
}

export default AppRoutes;