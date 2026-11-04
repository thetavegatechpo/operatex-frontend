import "../../EnterpriseSetupClean.css";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import moduleService from "../api/module.service.js";
import "./ModuleEnablement.css";

export default function ModuleEnablement() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await moduleService.getGroups();
      setGroups(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load company modules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleGroup = async (group) => {
    if (saving || !group.is_provisioned) return;
    const nextEnabled = !Boolean(group.is_enabled);
    setSaving(group.module_group);
    setError("");
    try {
      await moduleService.updateGroup({
        module_group: group.module_group,
        is_enabled: nextEnabled,
      });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update module access.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="opx-module-page">
      <div className="opx-module-header">
        <div>
          <h2>Module Enablement</h2>
          <p>Choose the main modules available to this company. Submodules follow the main module automatically.</p>
        </div>
        <Button variant="outline-primary" onClick={load} disabled={loading || saving !== null}>Refresh</Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="opx-module-loading"><Spinner animation="border" size="sm" /> Loading modules...</div>
      ) : groups.length === 0 ? (
        <div className="opx-module-empty">No main modules are configured in the active module catalog.</div>
      ) : (
        <div className="opx-module-grid">
          {groups.map((group) => {
            const provisioned = Boolean(group.is_provisioned);
            const enabled = Boolean(group.is_enabled);
            const isSaving = saving === group.module_group;
            return (
              <div className="opx-module-card" key={group.module_group}>
                <div className="opx-module-top">
                  <div className="opx-module-text">
                    <h3>{group.module_group}</h3>
                    <p>{group.module_count || 0} submodules included</p>
                  </div>
                  <Form.Check
                    type="switch"
                    id={`module-${String(group.module_group).replace(/[^a-z0-9]/gi, "-")}`}
                    checked={enabled}
                    disabled={!provisioned || saving !== null}
                    onChange={() => toggleGroup(group)}
                    aria-label={`Enable ${group.module_group}`}
                  />
                </div>
                <div className="opx-module-footer">
                  <span className={`opx-module-status ${!provisioned ? "unlicensed" : enabled ? "enabled" : "disabled"}`}>
                    {!provisioned ? "Not licensed" : isSaving ? "Saving..." : enabled ? "Enabled" : "Disabled"}
                  </span>
                  {!provisioned && <span className="opx-module-note">License setup required</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
