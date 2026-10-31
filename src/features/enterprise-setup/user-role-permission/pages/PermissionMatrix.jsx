import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Form, Spinner } from "react-bootstrap";
import userRolePermissionService from "../api/userRolePermission.service.js";
import "./UserRolePermission.css";

const FULL_ACCESS = new Set(["ADMIN", "MANAGER"]);
const ROLE_ORDER = ["ADMIN", "MANAGER", "OPERATOR", "QUALITY", "PRODUCTION", "MAINTENANCE"];

export default function PermissionMatrix() {
  const [matrix, setMatrix] = useState(null);
  const [selectedRole, setSelectedRole] = useState("OPERATOR");
  const [checked, setChecked] = useState([]);
  const [original, setOriginal] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  async function reload(preferredRole = selectedRole) {
    setLoading(true);
    setNotice(null);
    try {
      const response = await userRolePermissionService.getPermissionMatrix();
      const raw = response?.data?.data ?? response?.data;
      if (!Array.isArray(raw?.roles) || !Array.isArray(raw?.permissions) || !Array.isArray(raw?.granted)) {
        throw new Error("Invalid permission matrix response");
      }
      setMatrix(raw);
      const role = raw.roles.find(r => r.role_code === preferredRole) || raw.roles[0];
      if (role) {
        setSelectedRole(role.role_code);
        const ids = raw.granted.filter(g => Number(g.role_id) === Number(role.role_id)).map(g => Number(g.permission_id));
        setChecked(ids);
        setOriginal(ids);
      }
    } catch (error) {
      setNotice({ type: "danger", text: error?.response?.data?.message || error.message || "Unable to load permissions" });
    } finally { setLoading(false); }
  }

  useEffect(() => { reload("OPERATOR"); }, []);

  const role = matrix?.roles?.find(r => r.role_code === selectedRole);
  const locked = FULL_ACCESS.has(selectedRole);
  const checkedSet = useMemo(() => new Set(checked), [checked]);
  const changed = useMemo(() => checked.length !== original.length || checked.some(id => !original.includes(id)), [checked, original]);
  const groups = useMemo(() => {
    const result = new Map();
    for (const item of matrix?.permissions || []) {
      const moduleName = item.module_name || "Other";
      const searchValue = `${moduleName} ${item.permission_code} ${item.action}`.toLowerCase();
      if (filter.trim() && !searchValue.includes(filter.trim().toLowerCase())) continue;
      if (!result.has(moduleName)) result.set(moduleName, []);
      result.get(moduleName).push(item);
    }
    return [...result].sort(([a], [b]) => a.localeCompare(b));
  }, [matrix, filter]);

  function chooseRole(code) {
    if (!matrix || saving) return;
    if (changed && !window.confirm("Discard unsaved permission changes?")) return;
    setSelectedRole(code);
    setNotice(null);
    setFilter("");
    const selected = matrix.roles.find(r => r.role_code === code);
    const ids = matrix.granted.filter(g => Number(g.role_id) === Number(selected?.role_id)).map(g => Number(g.permission_id));
    setChecked(ids);
    setOriginal(ids);
  }

  function toggle(id, enable) {
    if (locked || saving) return;
    setChecked(prev => enable ? [...new Set([...prev, id])] : prev.filter(v => v !== id));
  }

  function toggleGroup(items, enable) {
    if (locked || saving) return;
    const ids = new Set(items.map(p => Number(p.permission_id)));
    setChecked(prev => enable ? [...new Set([...prev, ...ids])] : prev.filter(id => !ids.has(id)));
  }

  async function save() {
    if (!role || locked || !changed || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      await userRolePermissionService.savePermissionMatrix(role.role_id, checked);
      setOriginal([...checked]);
      setMatrix(prev => ({ ...prev, granted: [...prev.granted.filter(g => Number(g.role_id) !== Number(role.role_id)), ...checked.map(permission_id => ({ role_id: role.role_id, permission_id }))] }));
      setNotice({ type: "success", text: `${role.role_name} permissions saved successfully.` });
    } catch (error) {
      setNotice({ type: "danger", text: error?.response?.data?.message || error.message || "Saving permissions failed" });
    } finally { setSaving(false); }
  }

  return (
    <Card className="shadow-sm border-0 mb-4 rbac-matrix">
      <Card.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
          <div><h5 className="mb-1">Department Access Permissions</h5><div className="text-muted small">Select a role and tick the actions that department can use.</div></div>
          <Button variant="outline-secondary" size="sm" disabled={loading || saving} onClick={() => reload()}>{loading ? "Loading..." : "Refresh"}</Button>
        </div>
        {notice && <Alert variant={notice.type} dismissible onClose={() => setNotice(null)}>{notice.text}</Alert>}
        {loading ? <div className="py-5 text-center"><Spinner animation="border" size="sm" /> Loading department permissions...</div> : matrix && (
          <>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {[...matrix.roles].sort((a,b) => ROLE_ORDER.indexOf(a.role_code) - ROLE_ORDER.indexOf(b.role_code)).map(item => (
                <Button key={item.role_id} size="sm" variant={selectedRole === item.role_code ? "primary" : "outline-primary"} onClick={() => chooseRole(item.role_code)}>{item.role_name}</Button>
              ))}
            </div>
            {locked && <Alert variant="info">Admin and Manager always have full access. Their permissions cannot be reduced here.</Alert>}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div><Badge bg="secondary">{checked.length} granted</Badge> {changed && <Badge bg="warning" text="dark">Unsaved changes</Badge>}</div>
              <Form.Control style={{ maxWidth: 320 }} aria-label="Search permission" placeholder="Search module or permission..." value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <div className="rbac-matrix-groups">
              {groups.map(([name, items]) => {
                const count = items.filter(item => checkedSet.has(Number(item.permission_id))).length;
                const allChecked = count === items.length;
                return <section className="rbac-module" key={name}>
                  <div className="rbac-module-heading">
                    <div><strong>{name}</strong> <span className="text-muted small ms-2">{count}/{items.length} selected</span></div>
                    {!locked && <Form.Check type="checkbox" label="Select all" checked={allChecked} disabled={saving} onChange={e => toggleGroup(items, e.target.checked)} />}
                  </div>
                  <div className="rbac-permissions-grid">
                    {items.map(p => <label className="rbac-permission" key={p.permission_id}>
                      <input type="checkbox" checked={locked || checkedSet.has(Number(p.permission_id))} disabled={locked || saving} onChange={e => toggle(Number(p.permission_id), e.target.checked)} />
                      <span><strong>{p.action || p.permission_code}</strong><small className="text-muted">{p.permission_code}</small></span>
                    </label>)}
                  </div>
                </section>;
              })}
              {groups.length === 0 && <p className="text-muted">No permissions match your search.</p>}
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="outline-secondary" disabled={saving || !changed || locked} onClick={() => setChecked([...original])}>Reset changes</Button>
              <Button variant="primary" disabled={saving || !changed || locked} onClick={save}>{saving ? "Saving..." : "Save permissions"}</Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
