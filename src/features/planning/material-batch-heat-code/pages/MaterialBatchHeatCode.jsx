import RemoteReport from '../../../../shared/operations/RemoteReport.jsx';
import EventJourney from '../../../../shared/operations/EventJourney.jsx';

import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/MaterialBatchHeatCode/MaterialBatchHeatCode.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner} from "react-bootstrap";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowClockwise,
  BarChartLine,
  BoxSeam,
  Boxes,
  Fire,
  PencilSquare,
  PlayFill,
  Plus,
  Search,
} from "react-bootstrap-icons";

import api from "../../../../shared/api/client.js";
import materialBatchHeatCodeService, {
  getMaterialBatchHeatCodeErrorMessage,
  getMasterCollections,
  getRuntimeCollections,
} from "../api/materialBatchHeatCode.service.js";

// ============================================================
// CONSTANTS
// ============================================================

const MASTER_MATERIAL = "MATERIAL";
const MASTER_BATCH = "BATCH";
const MASTER_HEAT = "HEAT_CODE";

const VIEW_MASTER = "MASTER";
const VIEW_RUNTIME = "RUNTIME";

// ============================================================
// INITIAL STATE
// ============================================================

const materialInitialState = {
  material_id: "",
  company_id: "",
  material_code: "",
  material_name: "",
  material_type: "",
  uom_code: "",
  status: "ACTIVE",
  version_no: 1,
};

const batchInitialState = {
  batch_id: "",
  company_id: "",
  material_id: "",
  batch_no: "",
  supplier_batch_no: "",
  receipt_date: "",
  manufacture_date: "",
  expiry_date: "",
  received_qty: "",
  status: "AVAILABLE",
};

const heatInitialState = {
  heat_code_id: "",
  company_id: "",
  batch_id: "",
  heat_code: "",
  material_grade: "",
  certificate_ref: "",
  status: "AVAILABLE",
};

const executeInitialState = {
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  shift_id: "",
  plan_id: "",
  plan_entry_id: "",
  part_id: "",
  material_id: "",
  batch_id: "",
  heat_code_id: "",
  event_type: "CONSUME",
  quantity: "",
  uom_code: "",
  barcode_value: "",
  result_status: "OK",
  source_system: "MES",
  idempotency_key: "",
};

const runtimeFilterInitialState = {
  company_id: "",
  plant_id: "",
  line_id: "",
  machine_id: "",
  shift_id: "",
  plan_id: "",
  plan_entry_id: "",
  part_id: "",
  material_id: "",
  batch_id: "",
  heat_code_id: "",
  event_type: "",
  result_status: "",
  source_system: "",
  from_timestamp: "",
  to_timestamp: "",
};

// ============================================================
// GENERIC HELPERS
// ============================================================

const sameId = (left, right) =>
  String(left ?? "") === String(right ?? "");

const safeText = (value) => {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  return String(value);
};

const cleanNullable = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return value;
};

const dateOnly = (value) => {
  if (!value) return "";

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const displayDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? safeText(value) : date.toLocaleDateString();
};

const displayDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? safeText(value) : date.toLocaleString();
};

// ============================================================
// RESPONSE HELPERS
// Supports common OperateX response shapes.
// ============================================================

const extractRows = (response, possibleKeys = []) => {
  if (!response) return [];

  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;
  if (Array.isArray(response?.data?.data?.rows)) return response.data.data.rows;

  for (const key of possibleKeys) {
    if (Array.isArray(response?.[key])) return response[key];
    if (Array.isArray(response?.data?.[key])) return response.data[key];
    if (Array.isArray(response?.data?.data?.[key])) return response.data.data[key];
    if (Array.isArray(response?.data?.data?.data?.[key])) {
      return response.data.data.data[key];
    }
  }

  return [];
};

const findRowsRecursive = (value, predicate) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    const matching = value.filter(
      (item) => item && typeof item === "object" && predicate(item)
    );

    if (matching.length) return matching;

    for (const item of value) {
      const nested = findRowsRecursive(item, predicate);
      if (nested.length) return nested;
    }

    return [];
  }

  if (typeof value === "object") {
    for (const nestedValue of Object.values(value)) {
      const nested = findRowsRecursive(nestedValue, predicate);
      if (nested.length) return nested;
    }
  }

  return [];
};

// ============================================================
// ID / LABEL HELPERS
// ============================================================

const companyId = (item) =>
  item?.company_id ?? item?.companyId ?? item?.id ?? "";

const companyLabel = (item) =>
  item?.company_name ??
  item?.companyName ??
  item?.company_code ??
  item?.companyCode ??
  item?.name ??
  companyId(item);

const plantId = (item) =>
  item?.plant_id ?? item?.plantId ?? item?.shop_id ?? item?.shopId ?? "";

const plantLabel = (item) =>
  item?.plant_name ??
  item?.plantName ??
  item?.plant_code ??
  item?.plantCode ??
  item?.shop_name ??
  item?.shopName ??
  item?.shop_code ??
  plantId(item);

const lineId = (item) => item?.line_id ?? item?.lineId ?? "";
const lineLabel = (item) =>
  item?.line_name ?? item?.lineName ?? item?.line_code ?? item?.lineCode ?? lineId(item);

const machineId = (item) => item?.machine_id ?? item?.machineId ?? "";
const machineLabel = (item) =>
  item?.machine_name ??
  item?.machineName ??
  item?.machine_code ??
  item?.machineCode ??
  machineId(item);

const partId = (item) => item?.part_id ?? item?.partId ?? "";
const partLabel = (item) =>
  item?.part_name ??
  item?.partName ??
  item?.part_no ??
  item?.partNo ??
  item?.part_code ??
  item?.partCode ??
  partId(item);

const shiftId = (item) => item?.shift_id ?? item?.shiftId ?? "";
const shiftLabel = (item) => {
  const id = shiftId(item);
  const name =
    item?.shift_name ??
    item?.shiftName ??
    item?.shift_code ??
    item?.shiftCode ??
    item?.name ??
    "";

  return name ? `${name} (${id})` : `Shift ${id}`;
};

const planId = (item) => item?.plan_id ?? item?.planId ?? "";
const planLabel = (item) =>
  item?.plan_no ??
  item?.planNo ??
  item?.plan_code ??
  item?.planCode ??
  item?.plan_name ??
  item?.planName ??
  planId(item);

const planEntryId = (item) =>
  item?.plan_entry_id ?? item?.planEntryId ?? item?.entry_id ?? "";

const planEntryLabel = (item) => {
  const id = planEntryId(item);
  const sequence = item?.sequence_no ?? item?.sequenceNo ?? item?.sequence ?? "";
  const order =
    item?.order_no ?? item?.orderNo ?? item?.production_order_no ?? "";
  const part = item?.part_code ?? item?.part_name ?? "";
  const machine = item?.machine_code ?? item?.machine_name ?? "";

  const pieces = [];
  if (sequence !== "") pieces.push(`Seq ${sequence}`);
  if (order) pieces.push(order);
  if (part) pieces.push(part);
  if (machine) pieces.push(machine);

  return pieces.length ? pieces.join(" - ") : id;
};

const statusVariant = (value) => {
  const status = String(value || "").trim().toUpperCase();

  if (["ACTIVE", "AVAILABLE", "OK", "SUCCESS", "COMPLETED"].includes(status)) {
    return "success";
  }
  if (["PENDING", "HOLD", "IN_PROGRESS"].includes(status)) {
    return "warning";
  }
  if (["INACTIVE", "FAILED", "FAIL", "NOK", "EXPIRED"].includes(status)) {
    return "danger";
  }
  return "secondary";
};

// ============================================================
// COMPONENT
// ============================================================

const MaterialBatchHeatCode = () => {
  const queryClient = useQueryClient();

  // ----------------------------------------------------------
  // PAGE STATE
  // ----------------------------------------------------------

  const [activeView, setActiveView] = useState(VIEW_MASTER);
  const [selectedMaster, setSelectedMaster] = useState(MASTER_MATERIAL);
  const [searchText, setSearchText] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ----------------------------------------------------------
  // LOOKUPS
  // ----------------------------------------------------------

  const [companies, setCompanies] = useState([]);
  const [plants, setPlants] = useState([]);
  const [lines, setLines] = useState([]);
  const [machines, setMachines] = useState([]);
  const [parts, setParts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [productionPlans, setProductionPlans] = useState([]);
  const [planEntries, setPlanEntries] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [planEntriesLoading, setPlanEntriesLoading] = useState(false);

  // ----------------------------------------------------------
  // MODALS
  // ----------------------------------------------------------

  const [showMaterial, setShowMaterial] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [showHeat, setShowHeat] = useState(false);
  const [showExecute, setShowExecute] = useState(false);

  // ----------------------------------------------------------
  // FORMS
  // ----------------------------------------------------------

  const [materialForm, setMaterialForm] = useState(materialInitialState);
  const [batchForm, setBatchForm] = useState(batchInitialState);
  const [heatForm, setHeatForm] = useState(heatInitialState);
  const [executeForm, setExecuteForm] = useState(executeInitialState);
  const [runtimeFilters, setRuntimeFilters] = useState(runtimeFilterInitialState);
  const [appliedRuntimeFilters, setAppliedRuntimeFilters] = useState(
    runtimeFilterInitialState
  );

  // ==========================================================
  // LOAD LOOKUPS
  // IMPORTANT: no production-plan/runtime request here.
  // Plan Entry is loaded only after Production Plan selection
  // from GET /production-plan/config?plan_id=<uuid>.
  // ==========================================================

  const loadLookupData = async () => {
    try {
      setLookupLoading(true);

      const results = await Promise.allSettled([
        api.get("/company-master/master"),
        api.get("/plant-shop-master/master"),
        api.get("/line-master/master"),
        api.get("/machine-master/master"),
        api.get("/part-master/master"),
        api.get("/production-plan/master"),
        api.get("/shift-plan/config"),
      ]);

      const [
        companyRes,
        plantRes,
        lineRes,
        machineRes,
        partRes,
        planRes,
        shiftRes,
      ] = results;

      if (companyRes.status === "fulfilled") {
        const rows = extractRows(companyRes.value, [
          "company_master",
          "companies",
          "company",
          "master",
        ]);
        setCompanies(rows.filter((item) => Boolean(companyId(item))));
      } else {
        console.error("[MaterialBatchHeatCode] Company lookup failed", companyRes.reason);
        setCompanies([]);
      }

      if (plantRes.status === "fulfilled") {
        const rows = extractRows(plantRes.value, [
          "plant_master",
          "plant_shop_master",
          "plants",
          "shops",
          "master",
        ]);
        setPlants(rows.filter((item) => Boolean(plantId(item))));
      } else {
        console.error("[MaterialBatchHeatCode] Plant lookup failed", plantRes.reason);
        setPlants([]);
      }

      if (lineRes.status === "fulfilled") {
        const rows = extractRows(lineRes.value, ["line_master", "lines", "master"]);
        setLines(rows.filter((item) => Boolean(lineId(item))));
      } else {
        console.error("[MaterialBatchHeatCode] Line lookup failed", lineRes.reason);
        setLines([]);
      }

      if (machineRes.status === "fulfilled") {
        const rows = extractRows(machineRes.value, [
          "machine_master",
          "machines",
          "master",
        ]);
        setMachines(rows.filter((item) => Boolean(machineId(item))));
      } else {
        console.error("[MaterialBatchHeatCode] Machine lookup failed", machineRes.reason);
        setMachines([]);
      }

      if (partRes.status === "fulfilled") {
        const rows = extractRows(partRes.value, ["part_master", "parts", "master"]);
        setParts(rows.filter((item) => Boolean(partId(item))));
      } else {
        console.error("[MaterialBatchHeatCode] Part lookup failed", partRes.reason);
        setParts([]);
      }

      if (planRes.status === "fulfilled") {
        const rows = extractRows(planRes.value, [
          "production_plan",
          "production_plans",
          "plans",
          "master",
        ]);
        setProductionPlans(rows.filter((item) => Boolean(planId(item))));
      } else {
        console.error("[MaterialBatchHeatCode] Production Plan lookup failed", planRes.reason);
        setProductionPlans([]);
      }

      if (shiftRes.status === "fulfilled") {
        const rows = extractRows(shiftRes.value, [
          "shift_master",
          "shifts",
          "shift",
        ]);
        setShifts(rows.filter((item) => Boolean(shiftId(item))));
      } else {
        console.error("[MaterialBatchHeatCode] Shift lookup failed", shiftRes.reason);
        setShifts([]);
      }
    } catch (error) {
      console.error("[MaterialBatchHeatCode] Lookup load error", error);
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    loadLookupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // LOAD PLAN ENTRIES FOR SELECTED PLAN
  // Correct source: /production-plan/config?plan_id=<uuid>
  // ==========================================================

  const loadPlanEntriesForPlan = async (selectedPlanId) => {
    setPlanEntries([]);

    if (!selectedPlanId) return;

    try {
      setPlanEntriesLoading(true);
      setErrorMessage("");

      const response = await api.get("/production-plan/config", {
        params: {
          plan_id: selectedPlanId,
        },
      });

      console.log(
        "[MaterialBatchHeatCode] Production Plan Config:",
        response?.data
      );

      let rows = extractRows(response, [
        "plan_entries",
        "plan_entry",
        "entries",
      ]);

      if (!rows.length) {
        rows = findRowsRecursive(
          response?.data,
          (item) => Boolean(planEntryId(item))
        );
      }

      const unique = new Map();
      rows.forEach((row) => {
        const id = planEntryId(row);
        if (id) unique.set(String(id), row);
      });

      const filtered = Array.from(unique.values()).filter((row) => {
        const rowPlanId = row?.plan_id ?? row?.planId;
        return !rowPlanId || sameId(rowPlanId, selectedPlanId);
      });

      console.log("[MaterialBatchHeatCode] Plan Entries:", filtered);
      setPlanEntries(filtered);
    } catch (error) {
      console.error("[MaterialBatchHeatCode] Plan Entry lookup failed", error);
      setPlanEntries([]);
      setErrorMessage(
        getMaterialBatchHeatCodeErrorMessage(
          error,
          "Unable to load plan entries for the selected Production Plan."
        )
      );
    } finally {
      setPlanEntriesLoading(false);
    }
  };

  // ==========================================================
  // MAIN MODULE QUERIES
  // ==========================================================

  const masterQuery = useQuery({
    queryKey: ["material-batch-heat-code", "master"],
    queryFn: () => materialBatchHeatCodeService.getMaster(),
  });

  const runtimeQuery = useQuery({
    queryKey: [
      "material-batch-heat-code",
      "runtime",
      appliedRuntimeFilters,
    ],
    queryFn: () =>
      materialBatchHeatCodeService.getRuntime(appliedRuntimeFilters),
    refetchInterval:15000,
    refetchIntervalInBackground:false,
    enabled: activeView === VIEW_RUNTIME,
  });

  // ==========================================================
  // MODULE DATA
  // ==========================================================

  const masterData = useMemo(
    () => getMasterCollections(masterQuery.data),
    [masterQuery.data]
  );

  const materials = masterData.materials || [];
  const batches = masterData.batches || [];
  const heatCodes = masterData.heatCodes || [];

  const runtimeData = useMemo(
    () => getRuntimeCollections(runtimeQuery.data),
    [runtimeQuery.data]
  );

  const events = runtimeData.events || [];

  // ==========================================================
  // MAPS
  // ==========================================================

  const materialMap = useMemo(
    () => new Map(materials.map((item) => [String(item.material_id), item])),
    [materials]
  );

  const batchMap = useMemo(
    () => new Map(batches.map((item) => [String(item.batch_id), item])),
    [batches]
  );

  const heatMap = useMemo(
    () => new Map(heatCodes.map((item) => [String(item.heat_code_id), item])),
    [heatCodes]
  );

  // ==========================================================
  // MASTER DEPENDENT DROPDOWNS
  // ==========================================================

  const batchMaterials = useMemo(() => {
    if (!batchForm.company_id) return materials;

    return materials.filter((item) =>
      sameId(item.company_id, batchForm.company_id)
    );
  }, [materials, batchForm.company_id]);

  const heatBatches = useMemo(() => {
    if (!heatForm.company_id) return batches;

    return batches.filter((item) =>
      sameId(item.company_id, heatForm.company_id)
    );
  }, [batches, heatForm.company_id]);

  // ==========================================================
  // EXECUTE DEPENDENT DROPDOWNS
  // ==========================================================

  const executePlants = useMemo(
    () =>
      plants.filter((item) => {
        const itemCompanyId = companyId(item);
        return (
          !executeForm.company_id ||
          !itemCompanyId ||
          sameId(itemCompanyId, executeForm.company_id)
        );
      }),
    [plants, executeForm.company_id]
  );

  const executeLines = useMemo(
    () =>
      lines.filter((item) => {
        const itemCompanyId = companyId(item);
        const itemPlantId = plantId(item);

        if (
          executeForm.company_id &&
          itemCompanyId &&
          !sameId(itemCompanyId, executeForm.company_id)
        ) {
          return false;
        }

        if (
          executeForm.plant_id &&
          itemPlantId &&
          !sameId(itemPlantId, executeForm.plant_id)
        ) {
          return false;
        }

        return true;
      }),
    [lines, executeForm.company_id, executeForm.plant_id]
  );

  const executeMachines = useMemo(
    () =>
      machines.filter((item) => {
        const itemCompanyId = companyId(item);
        const itemLineId = lineId(item);

        if (
          executeForm.company_id &&
          itemCompanyId &&
          !sameId(itemCompanyId, executeForm.company_id)
        ) {
          return false;
        }

        if (
          executeForm.line_id &&
          itemLineId &&
          !sameId(itemLineId, executeForm.line_id)
        ) {
          return false;
        }

        return true;
      }),
    [machines, executeForm.company_id, executeForm.line_id]
  );

  const executePlans = useMemo(
    () =>
      productionPlans.filter((item) => {
        const itemCompanyId = companyId(item);
        return (
          !executeForm.company_id ||
          !itemCompanyId ||
          sameId(itemCompanyId, executeForm.company_id)
        );
      }),
    [productionPlans, executeForm.company_id]
  );

  const executePlanEntries = useMemo(() => {
    if (!executeForm.plan_id) return [];

    return planEntries.filter((item) => {
      const rowPlanId = item?.plan_id ?? item?.planId;
      return !rowPlanId || sameId(rowPlanId, executeForm.plan_id);
    });
  }, [planEntries, executeForm.plan_id]);

  const executeParts = useMemo(
    () =>
      parts.filter((item) => {
        const itemCompanyId = companyId(item);
        return (
          !executeForm.company_id ||
          !itemCompanyId ||
          sameId(itemCompanyId, executeForm.company_id)
        );
      }),
    [parts, executeForm.company_id]
  );

  const executeMaterials = useMemo(
    () =>
      materials.filter(
        (item) =>
          !executeForm.company_id ||
          sameId(item.company_id, executeForm.company_id)
      ),
    [materials, executeForm.company_id]
  );

  const executeBatches = useMemo(
    () =>
      batches.filter((item) => {
        if (
          executeForm.company_id &&
          !sameId(item.company_id, executeForm.company_id)
        ) {
          return false;
        }

        if (
          executeForm.material_id &&
          !sameId(item.material_id, executeForm.material_id)
        ) {
          return false;
        }

        return true;
      }),
    [batches, executeForm.company_id, executeForm.material_id]
  );

  const executeHeatCodes = useMemo(
    () =>
      heatCodes.filter((item) => {
        if (
          executeForm.company_id &&
          !sameId(item.company_id, executeForm.company_id)
        ) {
          return false;
        }

        if (
          executeForm.batch_id &&
          !sameId(item.batch_id, executeForm.batch_id)
        ) {
          return false;
        }

        return true;
      }),
    [heatCodes, executeForm.company_id, executeForm.batch_id]
  );

  // ==========================================================
  // SEARCH
  // ==========================================================

  const searchedMaterials = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return materials;

    return materials.filter((row) =>
      [
        row.material_code,
        row.material_name,
        row.material_type,
        row.uom_code,
        row.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [materials, searchText]);

  const searchedBatches = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return batches;

    return batches.filter((row) => {
      const material = materialMap.get(String(row.material_id));

      return [
        row.batch_no,
        row.supplier_batch_no,
        row.status,
        material?.material_code,
        material?.material_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [batches, materialMap, searchText]);

  const searchedHeatCodes = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return heatCodes;

    return heatCodes.filter((row) => {
      const batch = batchMap.get(String(row.batch_id));

      return [
        row.heat_code,
        row.material_grade,
        row.certificate_ref,
        row.status,
        batch?.batch_no,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [heatCodes, batchMap, searchText]);

  // ==========================================================
  // INVALIDATION
  // ==========================================================

  const refreshModule = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["material-batch-heat-code", "master"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["material-batch-heat-code", "runtime"],
      }),
    ]);
  };

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const materialMutation = useMutation({
    mutationFn: async (payload) => {
      if (payload.material_id) {
        const { material_id, ...body } = payload;
        return materialBatchHeatCodeService.updateMaterial(material_id, body);
      }
      return materialBatchHeatCodeService.createMaterial(payload);
    },
    onSuccess: async () => {
      setErrorMessage("");
      setMessage(
        materialForm.material_id
          ? "Material updated successfully."
          : "Material created successfully."
      );
      setShowMaterial(false);
      setMaterialForm(materialInitialState);
      await refreshModule();
    },
    onError: (error) => {
      setMessage("");
      setErrorMessage(getMaterialBatchHeatCodeErrorMessage(error));
    },
  });

  const batchMutation = useMutation({
    mutationFn: async (payload) => {
      if (payload.batch_id) {
        const { batch_id, ...body } = payload;
        return materialBatchHeatCodeService.updateBatch(batch_id, body);
      }
      return materialBatchHeatCodeService.createBatch(payload);
    },
    onSuccess: async () => {
      setErrorMessage("");
      setMessage(
        batchForm.batch_id
          ? "Batch updated successfully."
          : "Batch created successfully."
      );
      setShowBatch(false);
      setBatchForm(batchInitialState);
      await refreshModule();
    },
    onError: (error) => {
      setMessage("");
      setErrorMessage(getMaterialBatchHeatCodeErrorMessage(error));
    },
  });

  const heatMutation = useMutation({
    mutationFn: async (payload) => {
      if (payload.heat_code_id) {
        const { heat_code_id, ...body } = payload;
        return materialBatchHeatCodeService.updateHeatCode(heat_code_id, body);
      }
      return materialBatchHeatCodeService.createHeatCode(payload);
    },
    onSuccess: async () => {
      setErrorMessage("");
      setMessage(
        heatForm.heat_code_id
          ? "Heat code updated successfully."
          : "Heat code created successfully."
      );
      setShowHeat(false);
      setHeatForm(heatInitialState);
      await refreshModule();
    },
    onError: (error) => {
      setMessage("");
      setErrorMessage(getMaterialBatchHeatCodeErrorMessage(error));
    },
  });

  const executeMutation = useMutation({
    mutationFn: (payload) => materialBatchHeatCodeService.execute(payload),
    onSuccess: async (response) => {
      const result = response?.data || response;

      setErrorMessage("");
      setMessage(
        result?.idempotent
          ? "This material activity was already processed."
          : "Material activity executed successfully."
      );

      setShowExecute(false);
      setExecuteForm(executeInitialState);
      setPlanEntries([]);
      await refreshModule();
      setActiveView(VIEW_RUNTIME);
    },
    onError: (error) => {
      setMessage("");
      setErrorMessage(getMaterialBatchHeatCodeErrorMessage(error));
    },
  });

  // ==========================================================
  // OPEN FORMS
  // ==========================================================

  const defaultCompany =
    companies.length === 1 ? companyId(companies[0]) : "";

  const openMaterialCreate = () => {
    setMaterialForm({ ...materialInitialState, company_id: defaultCompany });
    setShowMaterial(true);
  };

  const openMaterialEdit = (row) => {
    setMaterialForm({
      material_id: row.material_id,
      company_id: row.company_id,
      material_code: row.material_code || "",
      material_name: row.material_name || "",
      material_type: row.material_type || "",
      uom_code: row.uom_code || "",
      status: row.status || "ACTIVE",
      version_no: row.version_no ?? 1,
    });
    setShowMaterial(true);
  };

  const openBatchCreate = () => {
    setBatchForm({ ...batchInitialState, company_id: defaultCompany });
    setShowBatch(true);
  };

  const openBatchEdit = (row) => {
    setBatchForm({
      batch_id: row.batch_id,
      company_id: row.company_id,
      material_id: row.material_id,
      batch_no: row.batch_no || "",
      supplier_batch_no: row.supplier_batch_no || "",
      receipt_date: dateOnly(row.receipt_date),
      manufacture_date: dateOnly(row.manufacture_date),
      expiry_date: dateOnly(row.expiry_date),
      received_qty: row.received_qty ?? "",
      status: row.status || "AVAILABLE",
    });
    setShowBatch(true);
  };

  const openHeatCreate = () => {
    setHeatForm({ ...heatInitialState, company_id: defaultCompany });
    setShowHeat(true);
  };

  const openHeatEdit = (row) => {
    setHeatForm({
      heat_code_id: row.heat_code_id,
      company_id: row.company_id,
      batch_id: row.batch_id,
      heat_code: row.heat_code || "",
      material_grade: row.material_grade || "",
      certificate_ref: row.certificate_ref || "",
      status: row.status || "AVAILABLE",
    });
    setShowHeat(true);
  };

  const openExecuteForm = () => {
    setPlanEntries([]);
    setExecuteForm({ ...executeInitialState, company_id: defaultCompany });
    setShowExecute(true);
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const submitMaterial = (event) => {
    event.preventDefault();
    materialMutation.mutate({
      ...materialForm,
      version_no: Number(materialForm.version_no),
    });
  };

  const submitBatch = (event) => {
    event.preventDefault();
    batchMutation.mutate({
      ...batchForm,
      supplier_batch_no: cleanNullable(batchForm.supplier_batch_no),
      receipt_date: cleanNullable(batchForm.receipt_date),
      manufacture_date: cleanNullable(batchForm.manufacture_date),
      expiry_date: cleanNullable(batchForm.expiry_date),
      received_qty:
        batchForm.received_qty === "" ? null : Number(batchForm.received_qty),
    });
  };

  const submitHeat = (event) => {
    event.preventDefault();
    heatMutation.mutate({
      ...heatForm,
      material_grade: cleanNullable(heatForm.material_grade),
      certificate_ref: cleanNullable(heatForm.certificate_ref),
    });
  };

  const submitExecute = (event) => {
    event.preventDefault();

    executeMutation.mutate({
      ...executeForm,
      shift_id: Number(executeForm.shift_id),
      quantity: Number(executeForm.quantity),
      batch_id: cleanNullable(executeForm.batch_id),
      heat_code_id: cleanNullable(executeForm.heat_code_id),
      barcode_value: cleanNullable(executeForm.barcode_value),
      idempotency_key: cleanNullable(executeForm.idempotency_key),
    });
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    try {
      setErrorMessage("");
      setMessage("");

      await Promise.all([
        masterQuery.refetch(),
        activeView === VIEW_RUNTIME ? runtimeQuery.refetch() : Promise.resolve(),
        loadLookupData(),
      ]);

      setMessage("Data refreshed successfully.");
    } catch (error) {
      setErrorMessage(
        getMaterialBatchHeatCodeErrorMessage(error, "Unable to refresh data.")
      );
    }
  };

  const currentCount =
    selectedMaster === MASTER_MATERIAL
      ? searchedMaterials.length
      : selectedMaster === MASTER_BATCH
      ? searchedBatches.length
      : searchedHeatCodes.length;

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>

<div className="mbhc-page">
      <style>{`
        .mbhc-page {
          padding: 22px;
          background: #f4f6fb;
          min-height: 100vh;
        }
        .mbhc-card {
          background: #ffffff;
          border: 1px solid #e5e9f2;
          border-radius: 12px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
        }
        .mbhc-page-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #1f2d3d;
        }
        .mbhc-page-subtitle {
          margin-top: 4px;
          color: #748094;
          font-size: 13px;
        }
        .mbhc-btn-primary {
          background: #314965 !important;
          border-color: #314965 !important;
          color: #ffffff !important;
          font-weight: 600;
        }
        .mbhc-btn-primary:hover {
          background: #25364e !important;
          border-color: #25364e !important;
        }
        .mbhc-btn-outline {
          background: #ffffff !important;
          color: #314965 !important;
          border: 1px solid #314965 !important;
          font-weight: 600;
        }
        .mbhc-btn-outline:hover {
          background: #314965 !important;
          color: #ffffff !important;
        }
        .mbhc-module-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mbhc-module-tab {
          border: 1px solid #d9dce5;
          background: #ffffff;
          color: #566176;
          font-weight: 600;
          padding: 8px 15px;
          border-radius: 7px;
        }
        .mbhc-module-tab.active {
          border-color: #314965;
          background: #f1f4f8;
          color: #314965;
        }
        .mbhc-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .mbhc-search-box {
          position: relative;
          width: 330px;
          max-width: 100%;
        }
        .mbhc-search-box svg {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #8792a5;
        }
        .mbhc-search-box input {
          padding-left: 34px;
        }
        .mbhc-table-wrap {
          border: 1px solid #e4e7ee;
          border-radius: 9px;
          overflow: auto;
        }
        .mbhc-table {
          margin: 0;
          white-space: nowrap;
        }
        .mbhc-table thead th {
          background: #1c2d45;
          color: #ffffff;
          border-color: #1c2d45;
          font-size: 12px;
          font-weight: 700;
          padding: 12px;
        }
        .mbhc-table tbody td {
          vertical-align: middle;
          padding: 11px 12px;
          color: #364152;
          font-size: 13px;
        }
        .mbhc-action-edit {
          background: #ffffff !important;
          border: 1px solid #314965 !important;
          color: #314965 !important;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 10px;
        }
        .mbhc-action-edit:hover {
          background: #314965 !important;
          color: #ffffff !important;
        }
        .mbhc-empty {
          color: #8a94a6 !important;
          text-align: center;
          padding: 30px !important;
        }
        .mbhc-master-selector {
          min-width: 210px;
        }
        .mbhc-stat-card {
          border: 1px solid #e5e9f2;
          border-radius: 10px;
          padding: 14px;
          background: #ffffff;
          height: 100%;
        }
        .mbhc-stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: #f1f4f8;
          color: #314965;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .mbhc-stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #263449;
        }
        .mbhc-stat-label {
          color: #758195;
          font-size: 12px;
        }
        .mbhc-modal .modal-content {
          border: none;
          border-radius: 12px;
          overflow: hidden;
        }
        .mbhc-modal .modal-header {
          background: #1c2d45;
          color: #ffffff;
          border: none;
        }
        .mbhc-modal .btn-close {
          filter: invert(1);
        }
        .mbhc-label {
          color: #354154;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .mbhc-required {
          color: #dc3545;
        }
        .mbhc-filter-panel {
          padding: 15px;
          border: 1px solid #e5e9f2;
          border-radius: 9px;
          background: #f9fafc;
          margin-bottom: 15px;
        }
        @media (max-width: 768px) {
          .mbhc-page { padding: 12px; }
          .mbhc-search-box { width: 100%; }
          .mbhc-toolbar { align-items: stretch; }
        }
      `}</style>

      {/* HEADER */}
      <Card className="mbhc-card mb-3">
        <Card.Body>
          <Row className="align-items-center g-3">
            <Col lg={7}>
              <h4 className="mbhc-page-title">Material / Batch / Heat Code</h4>
              <div className="mbhc-page-subtitle">
                Configure materials, batches and heat codes and track production material consumption.
              </div>
            </Col>

            <Col lg={5}>
              <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                <Button className="mbhc-btn-outline" onClick={handleRefresh}>
                  <ArrowClockwise className="me-1" />
                  Refresh
                </Button>

                <Button
                  className="mbhc-btn-outline"
                  onClick={() => setActiveView(VIEW_RUNTIME)}
                >
                  <BarChartLine className="me-1" />
                  Runtime
                </Button>

                <Button className="mbhc-btn-primary" onClick={openExecuteForm}>
                  <PlayFill className="me-1" />
                  Execute Activity
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ALERTS */}
      {message && (
        <Alert variant="success" dismissible onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {/* SUMMARY */}
      <Row className="g-3 mb-3">
        <Col md={4}>
          <div className="mbhc-stat-card">
            <div className="d-flex align-items-center gap-3">
              <div className="mbhc-stat-icon"><BoxSeam /></div>
              <div>
                <div className="mbhc-stat-value">{materials.length}</div>
                <div className="mbhc-stat-label">Materials</div>
              </div>
            </div>
          </div>
        </Col>

        <Col md={4}>
          <div className="mbhc-stat-card">
            <div className="d-flex align-items-center gap-3">
              <div className="mbhc-stat-icon"><Boxes /></div>
              <div>
                <div className="mbhc-stat-value">{batches.length}</div>
                <div className="mbhc-stat-label">Batches</div>
              </div>
            </div>
          </div>
        </Col>

        <Col md={4}>
          <div className="mbhc-stat-card">
            <div className="d-flex align-items-center gap-3">
              <div className="mbhc-stat-icon"><Fire /></div>
              <div>
                <div className="mbhc-stat-value">{heatCodes.length}</div>
                <div className="mbhc-stat-label">Heat Codes</div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* MAIN */}
      <Card className="mbhc-card">
        <Card.Body>
          <div className="mbhc-module-tabs mb-3">
            <button
              type="button"
              className={`mbhc-module-tab ${activeView === VIEW_MASTER ? "active" : ""}`}
              onClick={() => setActiveView(VIEW_MASTER)}
            >
              Master Configuration
            </button>

            <button
              type="button"
              className={`mbhc-module-tab ${activeView === VIEW_RUNTIME ? "active" : ""}`}
              onClick={() => setActiveView(VIEW_RUNTIME)}
            >
              Consumption Runtime
            </button>
          </div>

          {/* MASTER VIEW */}
          {activeView === VIEW_MASTER && (
            <>
              <div className="mbhc-toolbar mb-3">
                <div className="d-flex gap-2 flex-wrap">
                  <Form.Select
                    className="mbhc-master-selector"
                    value={selectedMaster}
                    onChange={(event) => {
                      setSelectedMaster(event.target.value);
                      setSearchText("");
                    }}
                  >
                    <option value={MASTER_MATERIAL}>Material Master</option>
                    <option value={MASTER_BATCH}>Batch Master</option>
                    <option value={MASTER_HEAT}>Heat Code Master</option>
                  </Form.Select>

                  <div className="mbhc-search-box">
                    <Search />
                    <Form.Control
                      placeholder="Search..."
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                    />
                  </div>
                </div>

                <Button
                  className="mbhc-btn-primary"
                  onClick={
                    selectedMaster === MASTER_MATERIAL
                      ? openMaterialCreate
                      : selectedMaster === MASTER_BATCH
                      ? openBatchCreate
                      : openHeatCreate
                  }
                >
                  <Plus className="me-1" />
                  {selectedMaster === MASTER_MATERIAL
                    ? "Add Material"
                    : selectedMaster === MASTER_BATCH
                    ? "Add Batch"
                    : "Add Heat Code"}
                </Button>
              </div>

              <div className="text-muted small mb-2">
                Showing {currentCount} record(s)
              </div>

              {masterQuery.isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : (
                <div className="mbhc-table-wrap">
                  {selectedMaster === MASTER_MATERIAL && (
                    <Table className="mbhc-table" hover>
                      <thead>
                        <tr>
                          <th>Material Code</th>
                          <th>Material Name</th>
                          <th>Material Type</th>
                          <th>UOM</th>
                          <th>Status</th>
                          <th>Version</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchedMaterials.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="mbhc-empty">
                              No material records found.
                            </td>
                          </tr>
                        ) : (
                          searchedMaterials.map((row) => (
                            <tr key={row.material_id}>
                              <td><strong>{safeText(row.material_code)}</strong></td>
                              <td>{safeText(row.material_name)}</td>
                              <td>{safeText(row.material_type)}</td>
                              <td>{safeText(row.uom_code)}</td>
                              <td>
                                <Badge bg={statusVariant(row.status)}>{safeText(row.status)}</Badge>
                              </td>
                              <td>{safeText(row.version_no)}</td>
                              <td>
                                <Button
                                  className="mbhc-action-edit"
                                  onClick={() => openMaterialEdit(row)}
                                >
                                  <PencilSquare className="me-1" />
                                  Edit
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  )}

                  {selectedMaster === MASTER_BATCH && (
                    <Table className="mbhc-table" hover>
                      <thead>
                        <tr>
                          <th>Batch No</th>
                          <th>Material</th>
                          <th>Supplier Batch</th>
                          <th>Receipt Date</th>
                          <th>Mfg Date</th>
                          <th>Expiry Date</th>
                          <th>Received Qty</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchedBatches.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="mbhc-empty">
                              No batch records found.
                            </td>
                          </tr>
                        ) : (
                          searchedBatches.map((row) => {
                            const material = materialMap.get(String(row.material_id));
                            return (
                              <tr key={row.batch_id}>
                                <td><strong>{safeText(row.batch_no)}</strong></td>
                                <td>
                                  {material
                                    ? `${material.material_code} - ${material.material_name}`
                                    : safeText(row.material_id)}
                                </td>
                                <td>{safeText(row.supplier_batch_no)}</td>
                                <td>{displayDate(row.receipt_date)}</td>
                                <td>{displayDate(row.manufacture_date)}</td>
                                <td>{displayDate(row.expiry_date)}</td>
                                <td>{safeText(row.received_qty)}</td>
                                <td>
                                  <Badge bg={statusVariant(row.status)}>{safeText(row.status)}</Badge>
                                </td>
                                <td>
                                  <Button
                                    className="mbhc-action-edit"
                                    onClick={() => openBatchEdit(row)}
                                  >
                                    <PencilSquare className="me-1" />
                                    Edit
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </Table>
                  )}

                  {selectedMaster === MASTER_HEAT && (
                    <Table className="mbhc-table" hover>
                      <thead>
                        <tr>
                          <th>Heat Code</th>
                          <th>Batch</th>
                          <th>Material Grade</th>
                          <th>Certificate Ref</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchedHeatCodes.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="mbhc-empty">
                              No heat code records found.
                            </td>
                          </tr>
                        ) : (
                          searchedHeatCodes.map((row) => {
                            const batch = batchMap.get(String(row.batch_id));
                            return (
                              <tr key={row.heat_code_id}>
                                <td><strong>{safeText(row.heat_code)}</strong></td>
                                <td>{batch ? batch.batch_no : safeText(row.batch_id)}</td>
                                <td>{safeText(row.material_grade)}</td>
                                <td>{safeText(row.certificate_ref)}</td>
                                <td>
                                  <Badge bg={statusVariant(row.status)}>{safeText(row.status)}</Badge>
                                </td>
                                <td>
                                  <Button
                                    className="mbhc-action-edit"
                                    onClick={() => openHeatEdit(row)}
                                  >
                                    <PencilSquare className="me-1" />
                                    Edit
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </Table>
                  )}
                </div>
              )}
            </>
          )}

          {/* RUNTIME VIEW */}
          {activeView === VIEW_RUNTIME && (
            <>
              <div className="mbhc-filter-panel">
                <Row className="g-2">
                  <Col md={3}>
                    <Form.Label className="mbhc-label">Company</Form.Label>
                    <Form.Select
                      value={runtimeFilters.company_id}
                      onChange={(event) =>
                        setRuntimeFilters((old) => ({
                          ...old,
                          company_id: event.target.value,
                        }))
                      }
                    >
                      <option value="">All Companies</option>
                      {companies.map((item) => (
                        <option key={companyId(item)} value={companyId(item)}>
                          {companyLabel(item)}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col md={3}>
                    <Form.Label className="mbhc-label">Material</Form.Label>
                    <Form.Select
                      value={runtimeFilters.material_id}
                      onChange={(event) =>
                        setRuntimeFilters((old) => ({
                          ...old,
                          material_id: event.target.value,
                          batch_id: "",
                          heat_code_id: "",
                        }))
                      }
                    >
                      <option value="">All Materials</option>
                      {materials.map((item) => (
                        <option key={item.material_id} value={item.material_id}>
                          {item.material_code} - {item.material_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col md={2}>
                    <Form.Label className="mbhc-label">Shift</Form.Label>
                    <Form.Select
                      value={runtimeFilters.shift_id}
                      onChange={(event) =>
                        setRuntimeFilters((old) => ({
                          ...old,
                          shift_id: event.target.value,
                        }))
                      }
                    >
                      <option value="">All Shifts</option>
                      {shifts.map((item) => (
                        <option key={shiftId(item)} value={shiftId(item)}>
                          {shiftLabel(item)}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col md={2}>
                    <Form.Label className="mbhc-label">Event Type</Form.Label>
                    <Form.Control
                      value={runtimeFilters.event_type}
                      onChange={(event) =>
                        setRuntimeFilters((old) => ({
                          ...old,
                          event_type: event.target.value,
                        }))
                      }
                    />
                  </Col>

                  <Col md={2}>
                    <Form.Label className="mbhc-label">Result</Form.Label>
                    <Form.Control
                      value={runtimeFilters.result_status}
                      onChange={(event) =>
                        setRuntimeFilters((old) => ({
                          ...old,
                          result_status: event.target.value,
                        }))
                      }
                    />
                  </Col>

                  <Col md={3}>
                    <Form.Label className="mbhc-label">From</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={runtimeFilters.from_timestamp}
                      onChange={(event) =>
                        setRuntimeFilters((old) => ({
                          ...old,
                          from_timestamp: event.target.value,
                        }))
                      }
                    />
                  </Col>

                  <Col md={3}>
                    <Form.Label className="mbhc-label">To</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={runtimeFilters.to_timestamp}
                      onChange={(event) =>
                        setRuntimeFilters((old) => ({
                          ...old,
                          to_timestamp: event.target.value,
                        }))
                      }
                    />
                  </Col>

                  <Col md={6} className="d-flex align-items-end gap-2">
                    <Button
                      className="mbhc-btn-primary"
                      onClick={() => setAppliedRuntimeFilters({ ...runtimeFilters })}
                    >
                      Apply Filters
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setRuntimeFilters(runtimeFilterInitialState);
                        setAppliedRuntimeFilters(runtimeFilterInitialState);
                      }}
                    >
                      Clear
                    </Button>
                  </Col>
                </Row>
              </div>

              <div className="mbhc-table-wrap">
                <EventJourney records={events} kind="material" title="Material trace activity"/><RemoteReport title="Material trace report" load={() => materialBatchHeatCodeService.getReport(appliedRuntimeFilters)}/><Table className="mbhc-table" hover>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Material</th>
                      <th>Batch</th>
                      <th>Heat Code</th>
                      <th>Event</th>
                      <th>Quantity</th>
                      <th>UOM</th>
                      <th>Shift</th>
                      <th>Barcode</th>
                      <th>Result</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runtimeQuery.isFetching ? (
                      <tr>
                        <td colSpan={11} className="mbhc-empty">
                          <Spinner size="sm" animation="border" className="me-2" />
                          Loading runtime data...
                        </td>
                      </tr>
                    ) : events.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="mbhc-empty">
                          No consumption events found.
                        </td>
                      </tr>
                    ) : (
                      events.map((row) => {
                        const material = materialMap.get(String(row.material_id));
                        const batch = batchMap.get(String(row.batch_id));
                        const heat = heatMap.get(String(row.heat_code_id));

                        return (
                          <tr key={row.material_consumption_event_id}>
                            <td>{displayDateTime(row.event_ts)}</td>
                            <td>{material ? material.material_code : safeText(row.material_id)}</td>
                            <td>{batch ? batch.batch_no : "-"}</td>
                            <td>{heat ? heat.heat_code : "-"}</td>
                            <td>{safeText(row.event_type)}</td>
                            <td>{safeText(row.quantity)}</td>
                            <td>{safeText(row.uom_code)}</td>
                            <td>{safeText(row.shift_id)}</td>
                            <td>{safeText(row.barcode_value)}</td>
                            <td>
                              <Badge bg={statusVariant(row.result_status)}>
                                {safeText(row.result_status)}
                              </Badge>
                            </td>
                            <td>{safeText(row.source_system)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* MATERIAL MODAL */}
      <Modal
        show={showMaterial}
        onHide={() => setShowMaterial(false)}
        centered
        size="lg"
        className="mbhc-modal"
      >
        <Form onSubmit={submitMaterial}>
          <Modal.Header closeButton>
            <Modal.Title>
              {materialForm.material_id ? "Edit Material" : "Add Material"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Company<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  value={materialForm.company_id}
                   disabled={Boolean(materialForm.material_id)}
                  onChange={(event) =>
                    setMaterialForm((old) => ({
                      ...old,
                      company_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Select Company</option>
                  {companies.map((item) => (
                    <option key={companyId(item)} value={companyId(item)}>
                      {companyLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Material Code<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={75}
                  value={materialForm.material_code}
                  onChange={(event) =>
                    setMaterialForm((old) => ({
                      ...old,
                      material_code: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Material Name<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={150}
                  value={materialForm.material_name}
                  onChange={(event) =>
                    setMaterialForm((old) => ({
                      ...old,
                      material_name: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Material Type<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={40}
                  placeholder="Configured material type"
                  value={materialForm.material_type}
                  onChange={(event) =>
                    setMaterialForm((old) => ({
                      ...old,
                      material_type: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={4}>
                <Form.Label className="mbhc-label">
                  UOM Code<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={20}
                  value={materialForm.uom_code}
                  onChange={(event) =>
                    setMaterialForm((old) => ({
                      ...old,
                      uom_code: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Status<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={30}
                  value={materialForm.status}
                  onChange={(event) =>
                    setMaterialForm((old) => ({
                      ...old,
                      status: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={4}>
                <Form.Label className="mbhc-label">Version</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  required
                  value={materialForm.version_no}
                  onChange={(event) =>
                    setMaterialForm((old) => ({
                      ...old,
                      version_no: event.target.value,
                    }))
                  }
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowMaterial(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="mbhc-btn-primary"
              disabled={materialMutation.isPending}
            >
              {materialMutation.isPending ? "Saving..." : "Save Material"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* BATCH MODAL */}
      <Modal
        show={showBatch}
        onHide={() => setShowBatch(false)}
        centered
        size="lg"
        className="mbhc-modal"
      >
        <Form onSubmit={submitBatch}>
          <Modal.Header closeButton>
            <Modal.Title>{batchForm.batch_id ? "Edit Batch" : "Add Batch"}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Company<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  value={batchForm.company_id}
                   disabled={Boolean(batchForm.batch_id)}
                  onChange={(event) =>
                    setBatchForm((old) => ({
                      ...old,
                      company_id: event.target.value,
                      material_id: "",
                    }))
                  }
                >
                  <option value="">Select Company</option>
                  {companies.map((item) => (
                    <option key={companyId(item)} value={companyId(item)}>
                      {companyLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Material<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  disabled={
  Boolean(batchForm.batch_id) ||
  !batchForm.company_id
}
                  value={batchForm.material_id}
                  onChange={(event) =>
                    setBatchForm((old) => ({
                      ...old,
                      material_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Select Material</option>
                  {batchMaterials.map((item) => (
                    <option key={item.material_id} value={item.material_id}>
                      {item.material_code} - {item.material_name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Batch No<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={100}
                  value={batchForm.batch_no}
                  onChange={(event) =>
                    setBatchForm((old) => ({ ...old, batch_no: event.target.value }))
                  }
                />
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">Supplier Batch No</Form.Label>
                <Form.Control
                  maxLength={100}
                  value={batchForm.supplier_batch_no}
                  onChange={(event) =>
                    setBatchForm((old) => ({
                      ...old,
                      supplier_batch_no: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={4}>
                <Form.Label className="mbhc-label">Receipt Date</Form.Label>
                <Form.Control
                  type="date"
                  value={batchForm.receipt_date}
                  onChange={(event) =>
                    setBatchForm((old) => ({
                      ...old,
                      receipt_date: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={4}>
                <Form.Label className="mbhc-label">Manufacture Date</Form.Label>
                <Form.Control
                  type="date"
                  value={batchForm.manufacture_date}
                  onChange={(event) =>
                    setBatchForm((old) => ({
                      ...old,
                      manufacture_date: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={4}>
                <Form.Label className="mbhc-label">Expiry Date</Form.Label>
                <Form.Control
                  type="date"
                  value={batchForm.expiry_date}
                  onChange={(event) =>
                    setBatchForm((old) => ({
                      ...old,
                      expiry_date: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">Received Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.001"
                  value={batchForm.received_qty}
                  onChange={(event) =>
                    setBatchForm((old) => ({
                      ...old,
                      received_qty: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Status<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={30}
                  value={batchForm.status}
                  onChange={(event) =>
                    setBatchForm((old) => ({ ...old, status: event.target.value }))
                  }
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowBatch(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="mbhc-btn-primary"
              disabled={batchMutation.isPending}
            >
              {batchMutation.isPending ? "Saving..." : "Save Batch"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* HEAT MODAL */}
      <Modal
        show={showHeat}
        onHide={() => setShowHeat(false)}
        centered
        size="lg"
        className="mbhc-modal"
      >
        <Form onSubmit={submitHeat}>
          <Modal.Header closeButton>
            <Modal.Title>
              {heatForm.heat_code_id ? "Edit Heat Code" : "Add Heat Code"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Company<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  value={heatForm.company_id}
                  disabled={Boolean(heatForm.heat_code_id)}
                  onChange={(event) =>
                    setHeatForm((old) => ({
                      ...old,
                      company_id: event.target.value,
                      batch_id: "",
                    }))
                  }
                >
                  <option value="">Select Company</option>
                  {companies.map((item) => (
                    <option key={companyId(item)} value={companyId(item)}>
                      {companyLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Batch<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  disabled={
  Boolean(heatForm.heat_code_id) ||
  !heatForm.company_id
}
                  value={heatForm.batch_id}
                  onChange={(event) =>
                    setHeatForm((old) => ({ ...old, batch_id: event.target.value }))
                  }
                >
                  <option value="">Select Batch</option>
                  {heatBatches.map((item) => {
                    const material = materialMap.get(String(item.material_id));
                    return (
                      <option key={item.batch_id} value={item.batch_id}>
                        {item.batch_no}
                        {material ? ` - ${material.material_code}` : ""}
                      </option>
                    );
                  })}
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Heat Code<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={100}
                  value={heatForm.heat_code}
                  onChange={(event) =>
                    setHeatForm((old) => ({ ...old, heat_code: event.target.value }))
                  }
                />
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">Material Grade</Form.Label>
                <Form.Control
                  maxLength={80}
                  value={heatForm.material_grade}
                  onChange={(event) =>
                    setHeatForm((old) => ({
                      ...old,
                      material_grade: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">Certificate Reference</Form.Label>
                <Form.Control
                  maxLength={150}
                  value={heatForm.certificate_ref}
                  onChange={(event) =>
                    setHeatForm((old) => ({
                      ...old,
                      certificate_ref: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={6}>
                <Form.Label className="mbhc-label">
                  Status<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={30}
                  value={heatForm.status}
                  onChange={(event) =>
                    setHeatForm((old) => ({ ...old, status: event.target.value }))
                  }
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowHeat(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="mbhc-btn-primary"
              disabled={heatMutation.isPending}
            >
              {heatMutation.isPending ? "Saving..." : "Save Heat Code"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EXECUTE MODAL */}
      <Modal
        show={showExecute}
        onHide={() => {
          setShowExecute(false);
          setPlanEntries([]);
        }}
        centered
        size="xl"
        className="mbhc-modal"
      >
        <Form onSubmit={submitExecute}>
          <Modal.Header closeButton>
            <Modal.Title>Execute Material Activity</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {lookupLoading && (
              <Alert variant="light">
                <Spinner size="sm" animation="border" className="me-2" />
                Loading master dropdown data...
              </Alert>
            )}

            <Row className="g-3">
              {/* COMPANY */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Company<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  value={executeForm.company_id}
                  onChange={(event) => {
                    setPlanEntries([]);
                    setExecuteForm((old) => ({
                      ...old,
                      company_id: event.target.value,
                      plant_id: "",
                      line_id: "",
                      machine_id: "",
                      plan_id: "",
                      plan_entry_id: "",
                      part_id: "",
                      material_id: "",
                      batch_id: "",
                      heat_code_id: "",
                      uom_code: "",
                    }));
                  }}
                >
                  <option value="">Select Company</option>
                  {companies.map((item) => (
                    <option key={companyId(item)} value={companyId(item)}>
                      {companyLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* PLANT */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Plant<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  disabled={!executeForm.company_id}
                  value={executeForm.plant_id}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      plant_id: event.target.value,
                      line_id: "",
                      machine_id: "",
                    }))
                  }
                >
                  <option value="">Select Plant</option>
                  {executePlants.map((item) => (
                    <option key={plantId(item)} value={plantId(item)}>
                      {plantLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* LINE */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Line<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  disabled={!executeForm.plant_id}
                  value={executeForm.line_id}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      line_id: event.target.value,
                      machine_id: "",
                    }))
                  }
                >
                  <option value="">Select Line</option>
                  {executeLines.map((item) => (
                    <option key={lineId(item)} value={lineId(item)}>
                      {lineLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* MACHINE */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Machine<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  disabled={!executeForm.line_id}
                  value={executeForm.machine_id}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      machine_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Select Machine</option>
                  {executeMachines.map((item) => (
                    <option key={machineId(item)} value={machineId(item)}>
                      {machineLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* SHIFT */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Shift<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  value={executeForm.shift_id}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      shift_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Select Shift</option>
                  {shifts.map((item) => (
                    <option key={shiftId(item)} value={shiftId(item)}>
                      {shiftLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* PRODUCTION PLAN */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Production Plan<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  value={executeForm.plan_id}
                  onChange={(event) => {
                    const selectedPlanId = event.target.value;

                    // Important: this is only state + API data load.
                    // No navigate(), no link, no route change.
                    setExecuteForm((old) => ({
                      ...old,
                      plan_id: selectedPlanId,
                      plan_entry_id: "",
                    }));

                    loadPlanEntriesForPlan(selectedPlanId);
                  }}
                >
                  <option value="">Select Production Plan</option>
                  {executePlans.map((item) => (
                    <option key={planId(item)} value={planId(item)}>
                      {planLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* PLAN ENTRY */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Plan Entry<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  disabled={!executeForm.plan_id || planEntriesLoading}
                  value={executeForm.plan_entry_id}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      plan_entry_id: event.target.value,
                    }))
                  }
                >
                  <option value="">
                    {!executeForm.plan_id
                      ? "Select Production Plan First"
                      : planEntriesLoading
                      ? "Loading Plan Entries..."
                      : executePlanEntries.length === 0
                      ? "No Plan Entries Found"
                      : "Select Plan Entry"}
                  </option>

                  {executePlanEntries.map((item) => (
                    <option key={planEntryId(item)} value={planEntryId(item)}>
                      {planEntryLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* PART */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Part<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  value={executeForm.part_id}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      part_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Select Part</option>
                  {executeParts.map((item) => (
                    <option key={partId(item)} value={partId(item)}>
                      {partLabel(item)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* MATERIAL */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Material<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Select
                  required
                  value={executeForm.material_id}
                  onChange={(event) => {
                    const id = event.target.value;
                    const material = materialMap.get(String(id));

                    setExecuteForm((old) => ({
                      ...old,
                      material_id: id,
                      batch_id: "",
                      heat_code_id: "",
                      uom_code: material?.uom_code || "",
                    }));
                  }}
                >
                  <option value="">Select Material</option>
                  {executeMaterials.map((item) => (
                    <option key={item.material_id} value={item.material_id}>
                      {item.material_code} - {item.material_name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* BATCH */}
              <Col md={4}>
                <Form.Label className="mbhc-label">Batch</Form.Label>
                <Form.Select
                  disabled={!executeForm.material_id}
                  value={executeForm.batch_id}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      batch_id: event.target.value,
                      heat_code_id: "",
                    }))
                  }
                >
                  <option value="">No Batch / Not Tracked</option>
                  {executeBatches.map((item) => (
                    <option key={item.batch_id} value={item.batch_id}>
                      {item.batch_no}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* HEAT */}
              <Col md={4}>
                <Form.Label className="mbhc-label">Heat Code</Form.Label>
                <Form.Select
                  disabled={!executeForm.material_id}
                  value={executeForm.heat_code_id}
                  onChange={(event) => {
                    const id = event.target.value;
                    const heat = heatMap.get(String(id));

                    setExecuteForm((old) => ({
                      ...old,
                      heat_code_id: id,
                      batch_id: heat?.batch_id || old.batch_id,
                    }));
                  }}
                >
                  <option value="">No Heat Code / Not Tracked</option>
                  {executeHeatCodes.map((item) => (
                    <option key={item.heat_code_id} value={item.heat_code_id}>
                      {item.heat_code}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* EVENT TYPE */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Event Type<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={20}
                  value={executeForm.event_type}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      event_type: event.target.value,
                    }))
                  }
                />
              </Col>

              {/* QUANTITY */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  Quantity<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={executeForm.quantity}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      quantity: event.target.value,
                    }))
                  }
                />
              </Col>

              {/* UOM */}
              <Col md={4}>
                <Form.Label className="mbhc-label">
                  UOM<span className="mbhc-required"> *</span>
                </Form.Label>
                <Form.Control
                  required
                  value={executeForm.uom_code}
                  readOnly={Boolean(executeForm.material_id)}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      uom_code: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={4}>
                <Form.Label className="mbhc-label">Barcode</Form.Label>
                <Form.Control
                  maxLength={200}
                  value={executeForm.barcode_value}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      barcode_value: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={4}>
                <Form.Label className="mbhc-label">Result Status</Form.Label>
                <Form.Control
                  maxLength={20}
                  value={executeForm.result_status}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      result_status: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={4}>
                <Form.Label className="mbhc-label">Source System</Form.Label>
                <Form.Control
                  maxLength={50}
                  value={executeForm.source_system}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      source_system: event.target.value,
                    }))
                  }
                />
              </Col>

              <Col md={12}>
                <Form.Label className="mbhc-label">Idempotency Key</Form.Label>
                <Form.Control
                  maxLength={150}
                  value={executeForm.idempotency_key}
                  onChange={(event) =>
                    setExecuteForm((old) => ({
                      ...old,
                      idempotency_key: event.target.value,
                    }))
                  }
                  placeholder="Optional external request key"
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowExecute(false);
                setPlanEntries([]);
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="mbhc-btn-primary"
              disabled={executeMutation.isPending || planEntriesLoading}
            >
              {executeMutation.isPending ? "Executing..." : "Execute Activity"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
</>
  );
};

export default MaterialBatchHeatCode;
