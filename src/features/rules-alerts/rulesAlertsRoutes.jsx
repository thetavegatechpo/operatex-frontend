/* React Router v6 route children for integration into the EXISTING private/authorized app shell.
 * Mount <RulesAlertsRouteElements/> inside the existing <Routes> and
 * a <RulesAlertsProvider request={authenticatedAxios.request.bind(authenticatedAxios)} can={canPermission}>
 * parent; do not create a second Navbar or Sidebar. */
import React from 'react';
import {RulesAlertsOverview,RuleEngine,AlertEngine,NotificationEngine,InterlockEngine,BypassGovernance,AuditTrail} from './index';
export const rulesAlertsMenu=[
 {label:'Rules & Alerts',path:'/rules-alerts',permission:'RULES_ALERTS.RULE_ENGINE.READ'},
 {label:'Rule Engine',path:'/rules-alerts/rule-engine',permission:'RULES_ALERTS.RULE_ENGINE.READ'},
 {label:'Alert Engine',path:'/rules-alerts/alert-engine',permission:'RULES_ALERTS.ALERT_ENGINE.READ'},
 {label:'Notification Engine',path:'/rules-alerts/notification-engine',permission:'RULES_ALERTS.NOTIFICATION_ENGINE.READ'},
 {label:'Interlock Engine',path:'/rules-alerts/interlock-engine',permission:'RULES_ALERTS.INTERLOCK_ENGINE.READ'},
 {label:'Bypass Governance',path:'/rules-alerts/bypass-governance',permission:'RULES_ALERTS.BYPASS_GOVERNANCE.READ'},
 {label:'Audit Trail',path:'/rules-alerts/audit-trail',permission:'RULES_ALERTS.AUDIT_TRAIL.AUDIT_READ'},
];
// For React Router v6 data routers or useRoutes(), spread these route objects.
// For <Routes>, declare the <Route> elements DIRECTLY as shown in README.
export const rulesAlertsRouteObjects = [
 {path:'/rules-alerts',element:<RulesAlertsOverview/>},
 {path:'/rules-alerts/rule-engine',element:<RuleEngine/>},
 {path:'/rules-alerts/alert-engine',element:<AlertEngine/>},
 {path:'/rules-alerts/notification-engine',element:<NotificationEngine/>},
 {path:'/rules-alerts/interlock-engine',element:<InterlockEngine/>},
 {path:'/rules-alerts/bypass-governance',element:<BypassGovernance/>},
 {path:'/rules-alerts/audit-trail',element:<AuditTrail/>},
];
