import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table, Toast } from "react-bootstrap";
import { ArrowClockwise, BoxSeam, Diagram3, PencilSquare, Plus, Search, Trash, Link45deg, CheckCircle } from "react-bootstrap-icons";
import DataTable from "../../../../shared/components/DataTable.jsx";
import StatusBadge from "../../../../shared/components/StatusBadge.jsx";
import ActionButtons from "../../../../shared/components/ActionButtons.jsx";
import partService from "../../part-master/api/part.service.js";
import modelService from "../api/model.service.js";
import companyService from "../../../enterprise-setup/company-master/api/company.service.js";
import "./ModelMaster.css";

const EMPTY = { company_id: "", model_code: "", model_name: "", description: "" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = value => typeof value === "string" && UUID_RE.test(value.trim());
// Only accept a real UUID. Never substitute company_name or a generated identifier.
const companyRecord = record => {
  const rawId = record?.company_id ?? record?.companyId ?? record?.id;
  const id = typeof rawId === "string" ? rawId.trim() : "";
  return {
    ...record,
    company_id: isUuid(id) ? id : "",
    company_name: record?.company_name ?? record?.companyName ?? record?.name ?? "Unnamed company",
  };
};
const rowsOf = response => {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : [];
};
const messageOf = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export default function ModelMaster() {
  const [models, setModels] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyError, setCompanyError] = useState("");
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);
  const [linked, setLinked] = useState([]);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [partSearch, setPartSearch] = useState("");
  const [partId, setPartId] = useState("");
  const [qty, setQty] = useState("1");
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const notify = (message, variant = "success") => setToast({ show: true, message, variant });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Backend has pagination. Fetch up to its supported maximum per request.
      const response = await modelService.getMaster({ limit: 200, page: 1 });
      setModels(rowsOf(response));
    } catch (error) { notify(messageOf(error, "Failed to load models"), "danger"); }
    finally { setLoading(false); }
  }, []);

  const loadParts = useCallback(async () => {
    try {
      const response = await partService.getMaster();
      setParts(rowsOf(response));
    } catch (error) { notify(messageOf(error, "Failed to load available parts"), "danger"); }
  }, []);

  const loadLinked = useCallback(async id => {
    setLoadingLinked(true);
    try {
      const response = await modelService.getModelParts(id, { active_only: false });
      setLinked(rowsOf(response));
    } catch (error) { notify(messageOf(error, "Failed to load model parts"), "danger"); }
    finally { setLoadingLinked(false); }
  }, []);

  useEffect(() => { load(); loadParts();
    companyService.getMaster().then(response => {
      const data = response?.data?.data;
      const raw = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
      const normalized = raw.map(companyRecord);
      setCompanies(normalized.filter(c => c.company_id));
      setCompanyError(
        !raw.length
          ? "Company Master returned no companies."
          : normalized.some(c => !c.company_id)
          ? "Company Master returned at least one company without a valid UUID. Check the GET Company Master API response (company_id)."
          : ""
      );
    }).catch(error => {
      setCompanyError(messageOf(error, "Unable to load companies"));
      notify(messageOf(error, "Unable to load companies"), "danger");
    });
  }, [load, loadParts]);
  const selectModel = row => { setSelected(row); setPartId(""); setQty("1"); setPartSearch(""); loadLinked(row.model_id); };
  const visibleModels = useMemo(() => models.filter(m =>
    (status === "ALL" || m.status === status) &&
    [m.model_code, m.model_name, m.description].some(x => String(x || "").toLowerCase().includes(search.trim().toLowerCase()))
  ), [models, status, search]);
  const eligibleParts = useMemo(() => {
    const keyword = partSearch.trim().toLowerCase();
    return parts.filter(p => String(p.status).toUpperCase() === "ACTIVE" &&
      (!selected?.company_id || p.company_id === selected.company_id) &&
      [p.part_code, p.part_name].some(x => String(x || "").toLowerCase().includes(keyword)));
  }, [parts, selected, partSearch]);
  const openCreate = () => { setEditId(null); setForm({ ...EMPTY, company_id: companies.length === 1 ? companies[0].company_id : "" }); setModal(true); };
  const openEdit = row => { setEditId(row.model_id); setForm({ company_id: row.company_id || "", model_code: row.model_code || "", model_name: row.model_name || "", description: row.description || "" }); setModal(true); };
  const saveModel = async e => {
    e.preventDefault();
    if (!isUuid(form.company_id)) {
      notify("Please select a company with a valid UUID from Company Master.", "danger");
      return;
    }
    if (!form.model_code.trim() || !form.model_name.trim()) {
      notify("Model code and name are required", "danger");
      return;
    }
    setSaving(true);
    try {
      const payload = { company_id: form.company_id, model_code: form.model_code.trim(), model_name: form.model_name.trim(), description: form.description.trim() || null };
      if (editId) await modelService.updateMaster(editId, payload);
      else await modelService.createMaster(payload);
      notify(editId ? "Model updated" : "Model created"); setModal(false); await load();
      if (selected?.model_id === editId) setSelected(old => ({ ...old, ...payload }));
    } catch (error) { notify(messageOf(error, "Failed to save model"), "danger"); }
    finally { setSaving(false); }
  };
  const changeStatus = async row => {
    const active = row.status === "ACTIVE";
    if (!window.confirm(`${active ? "Deactivate" : "Activate"} ${row.model_name}?`)) return;
    try {
      if (active) await modelService.deleteMaster(row.model_id);
      else await modelService.activateMaster(row.model_id);
      notify(active ? "Model deactivated" : "Model activated");
      await load();
      if (selected?.model_id === row.model_id) setSelected(old => ({ ...old, status: active ? "INACTIVE" : "ACTIVE" }));
    } catch (error) { notify(messageOf(error, "Failed to change model status"), "danger"); }
  };
  const linkPart = async e => {
    e.preventDefault();
    if (!selected || !partId || !Number.isFinite(Number(qty)) || Number(qty) <= 0) {
      notify("Select a part and enter a quantity greater than zero", "danger"); return;
    }
    setSaving(true);
    try {
      await modelService.assignPart(selected.model_id, { part_id: partId, quantity_per_model: Number(qty) });
      notify("Part linked successfully"); setPartId(""); setQty("1");
      await Promise.all([loadLinked(selected.model_id), load()]);
    } catch (error) { notify(messageOf(error, "Unable to link part"), "danger"); }
    finally { setSaving(false); }
  };
  const unlinkPart = async p => {
    if (!window.confirm(`Remove ${p.part_code} from ${selected.model_name}?`)) return;
    try {
      await modelService.unlinkPart(selected.model_id, p.part_id);
      notify("Part unlinked"); await Promise.all([loadLinked(selected.model_id), load()]);
    } catch (error) { notify(messageOf(error, "Unable to unlink part"), "danger"); }
  };
  const columns = [
    { key: "model_code", label: "Model Code" },
    { key: "model_name", label: "Model Name" },
    { key: "description", label: "Description" },
    { key: "active_parts", label: "Linked Parts", render: row => <Badge bg="light" text="dark">{row.active_parts ?? 0}</Badge> },
    { key: "status", label: "Status", render: row => <StatusBadge status={row.status} /> }
  ];
  const activeLinked = linked.filter(p => p.mapping_status === "ACTIVE");
  return <div className="model-master-page">
    <Card className="mm-header mb-3">
      <Card.Body>
        <Row className="align-items-center gy-3">
          <Col><div className="mm-eyebrow">OPERATEX / MASTER DATA</div><h3 className="mb-1">Model Master</h3><div className="text-muted">Create models and manage model-wise part selection</div></Col>
          <Col xs="auto" className="d-flex gap-2"><Button variant="outline-secondary" onClick={() => { load(); loadParts(); }}><ArrowClockwise className="me-1"/> Refresh</Button><Button onClick={openCreate}><Plus className="me-1"/> Add Model</Button></Col>
        </Row>
      </Card.Body>
    </Card>
    <Row className="g-3 mb-3">
      <Col md={4}><Card className="mm-stat"><Card.Body><small>Total Models</small><h3>{models.length}</h3><BoxSeam/></Card.Body></Card></Col>
      <Col md={4}><Card className="mm-stat"><Card.Body><small>Active Models</small><h3>{models.filter(m => m.status === "ACTIVE").length}</h3><CheckCircle/></Card.Body></Card></Col>
      <Col md={4}><Card className="mm-stat"><Card.Body><small>Active Model–Part Links</small><h3>{models.reduce((sum,m) => sum + Number(m.active_parts || 0),0)}</h3><Diagram3/></Card.Body></Card></Col>
    </Row>
    <Card className="mb-3 mm-panel"><Card.Body><Row className="g-2 align-items-end">
      <Col md={8}><Form.Label>Search Models</Form.Label><Form.Control value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by model code, name or description" /></Col>
      <Col md={4}><Form.Label>Status</Form.Label><Form.Select value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">All</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Form.Select></Col>
    </Row></Card.Body></Card>
    <Card className="mm-panel mb-3"><Card.Header className="mm-panel-title">Model List <Badge bg="secondary">{visibleModels.length}</Badge></Card.Header><Card.Body>
      <DataTable columns={columns} data={visibleModels} loading={loading} emptyMessage="No models found" renderActions={row => <div className="d-flex flex-wrap gap-1"><Button size="sm" variant={selected?.model_id === row.model_id ? "primary" : "outline-primary"} onClick={() => selectModel(row)}><Link45deg className="me-1"/> Parts</Button><ActionButtons onEdit={() => openEdit(row)} /><Button size="sm" variant={row.status === "ACTIVE" ? "outline-danger" : "outline-success"} onClick={() => changeStatus(row)}>{row.status === "ACTIVE" ? "Deactivate" : "Activate"}</Button></div>} />
    </Card.Body></Card>
    {selected && <Card className="mm-panel mb-3"><Card.Header className="mm-panel-title d-flex justify-content-between align-items-center"><span><Diagram3 className="me-2"/> Parts linked to {selected.model_name} <small className="text-muted">({selected.model_code})</small></span><Button size="sm" variant="outline-secondary" onClick={() => setSelected(null)}>Close</Button></Card.Header><Card.Body>
      {selected.status !== "ACTIVE" && <Alert variant="warning">This model is inactive. Reactivate it to assign parts.</Alert>}
      <Form onSubmit={linkPart}><Row className="g-2 align-items-end mb-3">
        <Col md={4}><Form.Label>Find Part</Form.Label><Form.Control placeholder="Search code or name" value={partSearch} onChange={e => setPartSearch(e.target.value)} /></Col>
        <Col md={4}><Form.Label>Select Existing Part</Form.Label><Form.Select value={partId} onChange={e => { setPartId(e.target.value); const existing=linked.find(p => p.part_id === e.target.value); if(existing) setQty(String(existing.quantity_per_model)); }} required><option value="">Choose a part</option>{eligibleParts.map(p => <option key={p.part_id} value={p.part_id}>{p.part_code} — {p.part_name}</option>)}</Form.Select></Col>
        <Col md={2}><Form.Label>Qty per Model</Form.Label><Form.Control type="number" min="0.0001" step="0.0001" value={qty} onChange={e => setQty(e.target.value)} required /></Col>
        <Col md={2}><Button type="submit" className="w-100" disabled={saving || selected.status !== "ACTIVE" || !partId}>{saving ? <Spinner size="sm"/> : <><Plus/> Assign / Update</>}</Button></Col>
      </Row></Form>
      <div className="table-responsive"><Table hover className="align-middle"><thead><tr><th>Part Code</th><th>Part Name</th><th>Type</th><th>Quantity</th><th>UOM</th><th>Status</th><th>Action</th></tr></thead><tbody>
        {loadingLinked ? <tr><td colSpan={7} className="text-center"><Spinner size="sm"/></td></tr> : linked.length === 0 ? <tr><td colSpan={7} className="text-center text-muted py-4">No parts assigned to this model</td></tr> : linked.map(p => <tr key={p.part_id}><td className="fw-semibold">{p.part_code}</td><td>{p.part_name}</td><td>{p.part_type}</td><td>{p.quantity_per_model}</td><td>{p.uom}</td><td><StatusBadge status={p.mapping_status}/></td><td>{p.mapping_status === "ACTIVE" && <Button size="sm" variant="outline-danger" onClick={() => unlinkPart(p)}><Trash className="me-1"/> Unlink</Button>}</td></tr>)}
      </tbody></Table></div><small className="text-muted">Active links: {activeLinked.length}. Inactive mappings remain visible for reference; assigning an inactive mapping again reactivates it.</small>
    </Card.Body></Card>}
    <Modal show={modal} centered backdrop="static" onHide={() => !saving && setModal(false)}><Form onSubmit={saveModel}><Modal.Header closeButton><Modal.Title>{editId ? "Edit Model" : "Create Model"}</Modal.Title></Modal.Header><Modal.Body><Form.Group className="mb-3">
      <Form.Label>Company *</Form.Label>
      <Form.Select required disabled={Boolean(editId)} value={form.company_id}
        isInvalid={Boolean(companyError) || Boolean(form.company_id && !isUuid(form.company_id))}
        onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
        <option value="">Select Company</option>
        {companies.map(c => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}
      </Form.Select>
      {companyError && <Form.Text className="text-danger d-block">{companyError}</Form.Text>}
      <Form.Text>Only companies authorized for your authenticated account can be used.</Form.Text>
    </Form.Group><Form.Group className="mb-3"><Form.Label>Model Code *</Form.Label><Form.Control maxLength={100} required value={form.model_code} onChange={e => setForm(f => ({...f, model_code:e.target.value}))} /></Form.Group><Form.Group className="mb-3"><Form.Label>Model Name *</Form.Label><Form.Control maxLength={255} required value={form.model_name} onChange={e => setForm(f => ({...f, model_name:e.target.value}))} /></Form.Group><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} /></Form.Group></Modal.Body><Modal.Footer><Button variant="outline-secondary" onClick={() => setModal(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Spinner size="sm"/> : editId ? "Update Model" : "Create Model"}</Button></Modal.Footer></Form></Modal>
    <div className="mm-toast"><Toast show={toast.show} onClose={() => setToast(t => ({...t, show:false}))} delay={4500} autohide bg={toast.variant}><Toast.Body className={toast.variant === "danger" ? "text-white" : ""}>{toast.message}</Toast.Body></Toast></div>
  </div>;
}
