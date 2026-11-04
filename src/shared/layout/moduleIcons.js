import {
  Building2, Database, CalendarCheck, Factory, Gauge, Wrench, ShieldCheck, Cable, Hammer, ScanLine,
  Siren, ChartColumn, Network, LayoutDashboard, Cpu, Router, Radio, Boxes, Puzzle, Workflow, Route,
  FileText, GraduationCap, GitBranch, CalendarClock, Users, ToggleRight, ClipboardList, CalendarRange,
  Timer, Layers, Repeat, UserCog, Hash, ArrowLeftRight, Undo2, Activity, ClipboardCheck, ChartLine,
  TriangleAlert, ListChecks, HeartPulse, Package, Lock, Zap, TrendingDown, CirclePause, Clock, Bell,
  SlidersHorizontal, FileChartColumn, Sparkles, Plug, ArrowUpDown, DatabaseBackup, Settings, Circle,
  Ruler, Barcode, Fingerprint, Link2, Waypoints, Terminal, PackageCheck, Scale, Eye, ShieldAlert, Gavel
} from 'lucide-react';

/* Icon for a module group (sidebar accordion + dashboard module cards). */
const GROUP_ICONS = {
  'enterprise setup': Building2,
  'master data': Database,
  'planning': CalendarCheck,
  'production execution': Factory,
  'oee & loss': Gauge,
  'maintenance management': Wrench,
  'quality management': ShieldCheck,
  'connectivity': Cable,
  'tooling': Hammer,
  'traceability': ScanLine,
  'rules & alerts': Siren,
  'analytics & reports': ChartColumn,
  'integration & governance': Network
};

export function groupIcon(title, fallback) {
  return GROUP_ICONS[String(title || '').toLowerCase()] || fallback || Circle;
}

/* Icon for a single screen, chosen from its title (first match wins). */
const ITEM_RULES = [
  [/company|plant|shop/, Building2], [/line indexing|unit movement/, ArrowLeftRight],
  [/^line|line master/, GitBranch], [/shift calendar/, CalendarClock], [/shift plan/, CalendarRange],
  [/user role|permission/, Users], [/module/, ToggleRight],
  [/machine status/, Activity], [/machine/, Cpu], [/device/, Router], [/signal/, Radio],
  [/model/, Boxes], [/part rejection|rework|reject|bypass governance|bypass/, Undo2], [/part/, Puzzle],
  [/process result/, ClipboardCheck], [/process/, Workflow], [/route|station/, Route],
  [/gauge.*spc|spc/, ChartLine], [/gauge|instrument|calibration/, Ruler], [/tool life/, Timer],
  [/tool/, Wrench], [/document|sop/, FileText], [/skill/, GraduationCap],
  [/production order/, ClipboardList], [/production plan/, CalendarRange], [/scheduling/, Timer],
  [/material|batch|heat/, Layers], [/changeover|setup approval|setup/, Repeat],
  [/operator/, UserCog], [/production count/, Hash], [/cycle/, Timer],
  [/downtime/, CirclePause], [/availability/, Clock], [/performance/, Zap], [/^quality$/, ShieldCheck],
  [/^oee$|oee dashboard/, Gauge], [/breakdown maintenance|breakdown/, TriangleAlert], [/mttr|mtbf/, Clock],
  [/loss tree|loss/, TrendingDown], [/pm strategy/, ClipboardList], [/maintenance schedule/, CalendarCheck],
  [/condition/, HeartPulse], [/spare/, Package], [/interlock/, Lock],
  [/checksheet/, ListChecks], [/in-process|inspection/, ClipboardCheck], [/capa|defect/, ShieldAlert],
  [/notification/, Bell], [/rule engine|rule/, SlidersHorizontal], [/alert/, Siren], [/audit/, Gavel],
  [/cnc/, Terminal], [/gateway/, Waypoints], [/plc|spm/, Cpu], [/scanner|barcode/, Barcode],
  [/torque/, Wrench], [/sensor/, Radio], [/mqtt|event/, Network],
  [/serial|vin|engine id/, Fingerprint], [/assembly|linking/, Link2], [/genealogy/, GitBranch],
  [/trace/, ScanLine], [/report builder|report/, FileChartColumn], [/ai|predictive/, Sparkles],
  [/dashboard/, LayoutDashboard], [/api/, Plug], [/erp|sap/, Network], [/import|export/, ArrowUpDown],
  [/backup|archive/, DatabaseBackup], [/security|compliance/, ShieldCheck], [/data quality/, PackageCheck],
  [/quality notification/, Bell], [/regulat|scale/, Scale], [/view|monitor/, Eye], [/setting/, Settings]
];

export function itemIcon(title) {
  const t = String(title || '').toLowerCase();
  const hit = ITEM_RULES.find(([re]) => re.test(t));
  return hit ? hit[1] : Circle;
}
