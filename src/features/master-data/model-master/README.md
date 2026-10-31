# Model Master frontend for OperateX

Matches the uploaded Part Master folder layout: `api/model.service.js`, `pages/ModelMaster.jsx`, `pages/ModelMaster.css`.

Place beside existing `part-master` folder at `src/modules/master-data/model-master/` (adjust if your frontend uses a different location). Part Master is unchanged.

Dependencies already used by PartMaster: React, react-bootstrap, react-bootstrap-icons, shared DataTable, StatusBadge, ActionButtons, shared Axios client.

Import page in your existing route setup: `import ModelMaster from ".../modules/master-data/model-master/pages/ModelMaster.jsx";` and register via your project's existing authenticated / permission-gated routing convention. Navigation and route files weren't included in the uploaded frontend, so cannot patch those safely.

Backend must be mounted at `/api/model-master`; Axios client baseURL should already contain `/api` as in the existing Part Master.

Model Master backend GET `/master` paginates, and the screen currently fetches page 1, limit 200. Add server pagination / load-more if your company can exceed 200 models.

Part Master GET `/master` must return tenant-scoped active parts for assignment. Backend is responsible for validating company and active status, rather than trusting frontend filtering.

No created_by, updated_by, created_at, or updated_at fields.

To verify in your app: create model -> select Parts -> choose existing active part -> assign qty -> verify link -> update qty -> unlink -> reactivate model when necessary.
