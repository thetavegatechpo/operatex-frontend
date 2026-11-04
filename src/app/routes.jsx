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



/* Additional Maintenance / Quality and existing Connectivity page registration */
const ConditionMonitoring = lazy(() => import("../features/maintenance/condition-monitoring/pages/ConditionMonitoring.jsx"));
const SpareParts = lazy(() => import("../features/maintenance/spare-parts/pages/SpareParts.jsx"));
const MaintenanceInterlock = lazy(() => import("../features/maintenance/maintenance-interlock/pages/MaintenanceInterlock.jsx"));
const PartRejection = lazy(() => import("../features/quality/part-rejection/pages/PartRejection.jsx"));
const QualityNotification = lazy(() => import("../features/quality/quality-notification/pages/QualityNotification.jsx"));
const CapaDefectWorkflow = lazy(() => import("../features/quality/capa-defect-workflow/pages/CapaDefectWorkflow.jsx"));
const PlcSpmAdapter = lazy(() => import("../features/connectivity/plc-spm-adapter/pages/PlcSpmAdapter.jsx"));
const ScannerAdapter = lazy(() => import("../features/connectivity/scanner-adapter/pages/ScannerAdapter.jsx"));
const TorqueToolAdapter = lazy(() => import("../features/connectivity/torque-tool-adapter/pages/TorqueToolAdapter.jsx"));
const GaugeSensorAdapter = lazy(() => import("../features/connectivity/gauge-sensor-adapter/pages/GaugeSensorAdapter.jsx"));
const MqttEventIngestion = lazy(() => import("../features/connectivity/mqtt-event-ingestion/pages/MqttEventIngestion.jsx"));

/* Generated architecture registration: pending operational integration */
const UnitSerialVinEngineId = lazy(() => import("../features/traceability/unit-serial-vin-engine-id/pages/UnitSerialVinEngineId.jsx"));
const BarcodeValidation = lazy(() => import("../features/traceability/barcode-validation/pages/BarcodeValidation.jsx"));
const ProcessResult = lazy(() => import("../features/traceability/process-result/pages/ProcessResult.jsx"));
const AssemblyLinking = lazy(() => import("../features/traceability/assembly-linking/pages/AssemblyLinking.jsx"));
const Genealogy = lazy(() => import("../features/traceability/genealogy/pages/Genealogy.jsx"));
const ReworkRepairTrace = lazy(() => import("../features/traceability/rework-repair-trace/pages/ReworkRepairTrace.jsx"));
const FinalTraceReport = lazy(() => import("../features/traceability/final-trace-report/pages/FinalTraceReport.jsx"));
const ToolOffsetWear = lazy(() => import("../features/tooling/tool-offset-wear/pages/ToolOffsetWear.jsx"));
const ToolCalibration = lazy(() => import("../features/tooling/tool-calibration/pages/ToolCalibration.jsx"));
const RulesAlertsOverview = lazy(() => import("../features/rules-alerts/RulesAlertsOverview.jsx"));
const RuleEngine = lazy(() => import("../features/rules-alerts/rule-engine/pages/RuleEngine.jsx"));
const AlertEngine = lazy(() => import("../features/rules-alerts/alert-engine/pages/AlertEngine.jsx"));
const NotificationEngine = lazy(() => import("../features/rules-alerts/notification-engine/pages/NotificationEngine.jsx"));
const InterlockEngine = lazy(() => import("../features/rules-alerts/interlock-engine/pages/InterlockEngine.jsx"));
const BypassGovernance = lazy(() => import("../features/rules-alerts/bypass-governance/pages/BypassGovernance.jsx"));
const AuditTrail = lazy(() => import("../features/rules-alerts/audit-trail/pages/AuditTrail.jsx"));
const ProductionDashboard = lazy(() => import("../features/analytics-reports/production-dashboard/pages/ProductionDashboard.jsx"));
const OeeDashboard = lazy(() => import("../features/analytics-reports/oee-dashboard/pages/OeeDashboard.jsx"));
const QualityDashboard = lazy(() => import("../features/analytics-reports/quality-dashboard/pages/QualityDashboard.jsx"));
const MaintenanceDashboard = lazy(() => import("../features/analytics-reports/maintenance-dashboard/pages/MaintenanceDashboard.jsx"));
const TraceabilityDashboard = lazy(() => import("../features/analytics-reports/traceability-dashboard/pages/TraceabilityDashboard.jsx"));
const ReportBuilder = lazy(() => import("../features/analytics-reports/report-builder/pages/ReportBuilder.jsx"));
const AiPredictiveAnalytics = lazy(() => import("../features/analytics-reports/ai-predictive-analytics/pages/AiPredictiveAnalytics.jsx"));
const ApiLayer = lazy(() => import("../features/integration-governance/api-layer/pages/ApiLayer.jsx"));
const ErpSapIntegration = lazy(() => import("../features/integration-governance/erp-sap-integration/pages/ErpSapIntegration.jsx"));
const DataImportExport = lazy(() => import("../features/integration-governance/data-import-export/pages/DataImportExport.jsx"));
const BackupArchive = lazy(() => import("../features/integration-governance/backup-archive/pages/BackupArchive.jsx"));
const SecurityCompliance = lazy(() => import("../features/integration-governance/security-compliance/pages/SecurityCompliance.jsx"));
const DataQualityMonitor = lazy(() => import("../features/integration-governance/data-quality-monitor/pages/DataQualityMonitor.jsx"));

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



{/* Additional operational areas: pending backend integration where indicated */}
<Route path="/maintenance/condition-monitoring" element={<ConditionMonitoring />} />
<Route path="/maintenance/spare-parts" element={<SpareParts />} />
<Route path="/maintenance/maintenance-interlock" element={<MaintenanceInterlock />} />
<Route path="/quality/part-rejection" element={<PartRejection />} />
<Route path="/quality/quality-notification" element={<QualityNotification />} />
<Route path="/quality/capa-defect-workflow" element={<CapaDefectWorkflow />} />
<Route path="/connectivity/plc-spm-adapter" element={<PlcSpmAdapter />} />
<Route path="/connectivity/scanner-adapter" element={<ScannerAdapter />} />
<Route path="/connectivity/torque-tool-adapter" element={<TorqueToolAdapter />} />
<Route path="/connectivity/gauge-sensor-adapter" element={<GaugeSensorAdapter />} />
<Route path="/connectivity/mqtt-event-ingestion" element={<MqttEventIngestion />} />

{/* Remaining architecture shells: authenticated layout */}
<Route path="/traceability/unit-serial-vin-engine-id" element={<UnitSerialVinEngineId />} />
<Route path="/traceability/barcode-validation" element={<BarcodeValidation />} />
<Route path="/traceability/process-result" element={<ProcessResult />} />
<Route path="/traceability/assembly-linking" element={<AssemblyLinking />} />
<Route path="/traceability/genealogy" element={<Genealogy />} />
<Route path="/traceability/rework-repair-trace" element={<ReworkRepairTrace />} />
<Route path="/traceability/final-trace-report" element={<FinalTraceReport />} />
<Route path="/tooling/tool-offset-wear" element={<ToolOffsetWear />} />
<Route path="/tooling/tool-calibration" element={<ToolCalibration />} />
<Route path="/rules-alerts" element={<RulesAlertsOverview />} />
<Route path="/rules-alerts/rule-engine" element={<RuleEngine />} />
<Route path="/rules-alerts/alert-engine" element={<AlertEngine />} />
<Route path="/rules-alerts/notification-engine" element={<NotificationEngine />} />
<Route path="/rules-alerts/interlock-engine" element={<InterlockEngine />} />
<Route path="/rules-alerts/bypass-governance" element={<BypassGovernance />} />
<Route path="/rules-alerts/audit-trail" element={<AuditTrail />} />
<Route path="/analytics-reports/production-dashboard" element={<ProductionDashboard />} />
<Route path="/analytics-reports/oee-dashboard" element={<OeeDashboard />} />
<Route path="/analytics-reports/quality-dashboard" element={<QualityDashboard />} />
<Route path="/analytics-reports/maintenance-dashboard" element={<MaintenanceDashboard />} />
<Route path="/analytics-reports/traceability-dashboard" element={<TraceabilityDashboard />} />
<Route path="/analytics-reports/report-builder" element={<ReportBuilder />} />
<Route path="/analytics-reports/ai-predictive-analytics" element={<AiPredictiveAnalytics />} />
<Route path="/integration-governance/api-layer" element={<ApiLayer />} />
<Route path="/integration-governance/erp-sap-integration" element={<ErpSapIntegration />} />
<Route path="/integration-governance/data-import-export" element={<DataImportExport />} />
<Route path="/integration-governance/backup-archive" element={<BackupArchive />} />
<Route path="/integration-governance/security-compliance" element={<SecurityCompliance />} />
<Route path="/integration-governance/data-quality-monitor" element={<DataQualityMonitor />} />
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