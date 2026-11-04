// Uses the same authenticated request contract as the other Rules & Alerts pages.
// All endpoints are the actual backend v3 routes. No dummy data or mock responses.
import { makeRulesAlertsApi } from '../../_shared/rulesAlerts.service';
export const makeRuleEngineService = (options) => makeRulesAlertsApi(options).rule;
