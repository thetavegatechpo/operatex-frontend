import ReportLens from '../../../../shared/operations/ReportLens.jsx';
import EventJourney from '../../../../shared/operations/EventJourney.jsx';

import Table from '../../../../shared/components/SmartTable.jsx';
// src/pages/OperatorWorkstation/OperatorWorkstation.jsx

import React, {
  useMemo,
  useState,
} from "react";

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
  Collection,
  Cpu,
  PencilSquare,
  People,
  PlayFill,
  Plus,
  Search,
} from "react-bootstrap-icons";

import api from "../../../../shared/api/client.js";

import operatorWorkstationService, {
  createRoleScreen,
  createUiTemplate,
  createWorkstation,
  executeOperatorAction,
  getActiveOperatorScreens,
  getOperatorWorkstationConfig,
  getOperatorWorkstationReport,
  getOperatorWorkstationRuntime,
  softDeleteRoleScreen,
  softDeleteUiTemplate,
  softDeleteWorkstation,
  updateRoleScreen,
  updateUiTemplate,
  updateWorkstation,
} from "../api/operatorWorkstation.service.js";


// ============================================================
// CONSTANTS
// ============================================================

const MASTER_TEMPLATE =
  "UI_TEMPLATE";

const MASTER_WORKSTATION =
  "WORKSTATION";

const MASTER_ROLE_SCREEN =
  "ROLE_SCREEN";


const VIEW_MASTER =
  "MASTER";

const VIEW_RUNTIME =
  "RUNTIME";

const VIEW_REPORT =
  "REPORT";


// ============================================================
// INITIAL STATE
// ============================================================

const templateInitialState = {

  ui_template_config_id: "",

  company_id: "",

  template_code: "",

  template_name: "",

  template_type: "OPERATOR",

  template_definition:
    JSON.stringify(
      {
        layout: "STANDARD",
        sections: [],
      },
      null,
      2
    ),

  schema_version: 1,

  version_no: 1,

  is_active: true,
};


const workstationInitialState = {

  workstation_config_id: "",

  company_id: "",

  plant_id: "",

  line_id: "",

  machine_id: "",

  station_id: "",

  workstation_code: "",

  workstation_name: "",

  ui_template_config_id: "",

  execution_mode: "AUTO",

  status: "ACTIVE",

  version_no: 1,

  is_active: true,
};


const roleScreenInitialState = {

  role_screen_config_id: "",

  company_id: "",

  role_id: "",

  workstation_config_id: "",

  ui_template_config_id: "",

  screen_scope: "EXECUTION",

  display_order: 100,

  version_no: 1,

  is_active: true,
};


const executeInitialState = {

  company_id: "",

  plant_id: "",

  line_id: "",

  machine_id: "",

  shift_id: "",

  workstation_config_id: "",

  production_plan_id: "",

  plan_entry_id: "",

  unit_id: "",

  user_id: "",

  action_code: "START",

  result_status: "COMPLETED",

  reason: "",

  source_system: "MES_UI",

  correlation_id: "",

  payload:
    JSON.stringify(
      {},
      null,
      2
    ),
};


const runtimeFilterInitialState = {

  company_id: "",

  plant_id: "",

  line_id: "",

  machine_id: "",

  shift_id: "",

  workstation_config_id: "",

  plan_entry_id: "",

  unit_id: "",

  user_id: "",

  action_code: "",

  result_status: "",

  source_system: "",

  correlation_id: "",

  from_timestamp: "",

  to_timestamp: "",
};


const screenResolutionInitialState = {

  company_id: "",

  role_id: "",

  workstation_config_id: "",
};


// ============================================================
// GENERIC HELPERS
// ============================================================

const sameId =
  (
    left,
    right
  ) =>
    String(left ?? "") ===
    String(right ?? "");


const safeText =
  value => {

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "-";
    }


    return String(value);
  };


const boolValue =
  value =>
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value)
      .toLowerCase() ===
      "true";


const displayDateTime =
  value => {

    if (!value) {
      return "-";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return safeText(value);
    }


    return date
      .toLocaleString();
  };


const toApiTimestamp =
  value => {

    if (!value) {
      return "";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }


    return date
      .toISOString();
  };


// ============================================================
// ERROR HELPER
// ============================================================

const getErrorMessage =
  (
    error,
    fallback =
      "Something went wrong."
  ) => {

    const response =
      error?.response?.data;


    if (
      Array.isArray(
        response?.errors
      ) &&
      response.errors.length >
        0
    ) {

      return `${
        response.message ||
        "Validation failed."
      } ${response.errors.join(
        ", "
      )}`;
    }


    return (
      response?.message ||
      error?.message ||
      fallback
    );
  };


// ============================================================
// RESPONSE HELPERS
// ============================================================

const responsePayload =
  response =>
    response?.data?.data ??
    response?.data ??
    null;


const extractRows =
  (
    response,
    possibleKeys = []
  ) => {

    if (!response) {
      return [];
    }


    if (
      Array.isArray(response)
    ) {
      return response;
    }


    if (
      Array.isArray(
        response?.data
      )
    ) {
      return response.data;
    }


    if (
      Array.isArray(
        response?.data?.data
      )
    ) {
      return response.data.data;
    }


    if (
      Array.isArray(
        response?.rows
      )
    ) {
      return response.rows;
    }


    if (
      Array.isArray(
        response?.data?.rows
      )
    ) {
      return response.data.rows;
    }


    for (
      const key of possibleKeys
    ) {

      if (
        Array.isArray(
          response?.[key]
        )
      ) {
        return response[key];
      }


      if (
        Array.isArray(
          response?.data?.[key]
        )
      ) {
        return response.data[key];
      }


      if (
        Array.isArray(
          response?.data?.data?.[
            key
          ]
        )
      ) {
        return response
          .data
          .data[key];
      }
    }


    return [];
  };


const findRowsRecursive =
  (
    value,
    predicate
  ) => {

    if (!value) {
      return [];
    }


    if (
      Array.isArray(value)
    ) {

      const matching =
        value.filter(
          item =>
            item &&
            typeof item ===
              "object" &&
            predicate(item)
        );


      if (
        matching.length >
        0
      ) {
        return matching;
      }


      for (
        const item of value
      ) {

        const nested =
          findRowsRecursive(
            item,
            predicate
          );


        if (
          nested.length >
          0
        ) {
          return nested;
        }
      }


      return [];
    }


    if (
      typeof value ===
      "object"
    ) {

      for (
        const nestedValue of
        Object.values(value)
      ) {

        const nested =
          findRowsRecursive(
            nestedValue,
            predicate
          );


        if (
          nested.length >
          0
        ) {
          return nested;
        }
      }
    }


    return [];
  };


// ============================================================
// ID / LABEL HELPERS
// ============================================================

const companyId =
  item =>
    item?.company_id ??
    item?.companyId ??
    item?.id ??
    "";


const companyLabel =
  item =>
    item?.company_name ??
    item?.companyName ??
    item?.company_code ??
    item?.companyCode ??
    item?.name ??
    companyId(item);


const plantId =
  item =>
    item?.plant_id ??
    item?.plantId ??
    item?.shop_id ??
    item?.shopId ??
    "";


const plantLabel =
  item =>
    item?.plant_name ??
    item?.plantName ??
    item?.shop_name ??
    item?.shopName ??
    item?.plant_code ??
    item?.shop_code ??
    plantId(item);


const lineId =
  item =>
    item?.line_id ??
    item?.lineId ??
    "";


const lineLabel =
  item =>
    item?.line_name ??
    item?.lineName ??
    item?.line_code ??
    item?.lineCode ??
    lineId(item);


const machineId =
  item =>
    item?.machine_id ??
    item?.machineId ??
    "";


const machineLabel =
  item =>
    item?.machine_name ??
    item?.machineName ??
    item?.machine_code ??
    item?.machineCode ??
    item?.asset_name ??
    machineId(item);


const stationId =
  item =>
    item?.station_id ??
    item?.stationId ??
    "";


const stationLabel =
  item =>
    item?.station_name ??
    item?.stationName ??
    item?.station_code ??
    item?.stationCode ??
    item?.stage_name ??
    stationId(item);


const shiftId =
  item =>
    item?.shift_id ??
    item?.shiftId ??
    "";


const shiftLabel =
  item => {

    const id =
      shiftId(item);


    const name =
      item?.shift_name ??
      item?.shiftName ??
      item?.shift_code ??
      item?.shiftCode ??
      item?.name ??
      "";


    return name
      ? `${name} (${id})`
      : `Shift ${id}`;
  };


const productionPlanId =
  item =>
    item?.plan_id ??
    item?.planId ??
    "";


const productionPlanLabel =
  item =>
    item?.plan_no ??
    item?.planNo ??
    item?.plan_code ??
    item?.planCode ??
    item?.production_plan_no ??
    item?.plan_name ??
    productionPlanId(item);


const planEntryId =
  item =>
    item?.plan_entry_id ??
    item?.planEntryId ??
    item?.entry_id ??
    "";


const planEntryLabel =
  item => {

    const pieces = [];


    const sequence =
      item?.sequence_no ??
      item?.sequenceNo ??
      item?.sequence ??
      "";


    const machine =
      item?.machine_name ??
      item?.machine_code ??
      "";


    const process =
      item?.process_name ??
      item?.process_code ??
      "";


    const part =
      item?.part_name ??
      item?.part_code ??
      "";


    const quantity =
      item?.target_qty ??
      item?.planned_qty ??
      item?.quantity ??
      "";


    if (
      sequence !== ""
    ) {
      pieces.push(
        `Seq ${sequence}`
      );
    }


    if (machine) {
      pieces.push(machine);
    }


    if (process) {
      pieces.push(process);
    }


    if (part) {
      pieces.push(part);
    }


    if (
      quantity !== ""
    ) {
      pieces.push(
        `Qty ${quantity}`
      );
    }


    return pieces.length
      ? pieces.join(" - ")
      : planEntryId(item);
  };


// ============================================================
// BADGE HELPERS
// ============================================================

const statusVariant =
  value => {

    const status =
      String(value || "")
        .trim()
        .toUpperCase();


    if (
      [
        "ACTIVE",
        "OK",
        "SUCCESS",
        "COMPLETED",
        "RUNNING",
      ].includes(status)
    ) {
      return "success";
    }


    if (
      [
        "PENDING",
        "HOLD",
        "IN_PROGRESS",
        "WARNING",
      ].includes(status)
    ) {
      return "warning";
    }


    if (
      [
        "INACTIVE",
        "FAIL",
        "FAILED",
        "NOK",
        "ERROR",
      ].includes(status)
    ) {
      return "danger";
    }


    return "secondary";
  };


const ActiveBadge =
  ({ active }) => (

    <Badge
      bg={
        boolValue(active)
          ? "success"
          : "secondary"
      }
    >
      {
        boolValue(active)
          ? "Active"
          : "Inactive"
      }
    </Badge>
  );


// ============================================================
// COMPONENT
// ============================================================

const OperatorWorkstation =
  () => {

    const queryClient =
      useQueryClient();


    // ========================================================
    // PAGE STATE
    // ========================================================

    const [
      activeView,
      setActiveView,
    ] =
      useState(
        VIEW_MASTER
      );


    const [
      selectedMaster,
      setSelectedMaster,
    ] =
      useState(
        MASTER_TEMPLATE
      );


    const [
      searchText,
      setSearchText,
    ] =
      useState("");


    const [
      message,
      setMessage,
    ] =
      useState("");


    const [
      errorMessage,
      setErrorMessage,
    ] =
      useState("");


    // ========================================================
    // MODALS
    // ========================================================

    const [
      showTemplate,
      setShowTemplate,
    ] =
      useState(false);


    const [
      showWorkstation,
      setShowWorkstation,
    ] =
      useState(false);


    const [
      showRoleScreen,
      setShowRoleScreen,
    ] =
      useState(false);


    const [
      showExecute,
      setShowExecute,
    ] =
      useState(false);


    const [
      showScreenResolve,
      setShowScreenResolve,
    ] =
      useState(false);


    // ========================================================
    // FORMS
    // ========================================================

    const [
      templateForm,
      setTemplateForm,
    ] =
      useState(
        templateInitialState
      );


    const [
      workstationForm,
      setWorkstationForm,
    ] =
      useState(
        workstationInitialState
      );


    const [
      roleScreenForm,
      setRoleScreenForm,
    ] =
      useState(
        roleScreenInitialState
      );


    const [
      executeForm,
      setExecuteForm,
    ] =
      useState(
        executeInitialState
      );


    const [
      runtimeFilters,
      setRuntimeFilters,
    ] =
      useState(
        runtimeFilterInitialState
      );


    const [
      appliedRuntimeFilters,
      setAppliedRuntimeFilters,
    ] =
      useState(
        runtimeFilterInitialState
      );


    const [
      screenResolution,
      setScreenResolution,
    ] =
      useState(
        screenResolutionInitialState
      );


    const [
      resolvedScreens,
      setResolvedScreens,
    ] =
      useState([]);


    // ========================================================
    // LOOKUP QUERIES
    // ========================================================

    const companiesQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "companies",
        ],

        queryFn:
          async () => {

            const response =
              await api.get(
                "/company-master/master"
              );


            return extractRows(
              response,
              [
                "company_master",
                "companies",
                "company",
                "master",
              ]
            );
          },
      });


    const plantsQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "plants",
        ],

        queryFn:
          async () => {

            const response =
              await api.get(
                "/plant-shop-master/master"
              );


            return extractRows(
              response,
              [
                "plant_master",
                "plant_shop_master",
                "plants",
                "shops",
                "master",
              ]
            );
          },
      });


    const linesQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "lines",
        ],

        queryFn:
          async () => {

            const response =
              await api.get(
                "/line-master/master"
              );


            return extractRows(
              response,
              [
                "line_master",
                "lines",
                "master",
              ]
            );
          },
      });


    const machinesQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "machines",
        ],

        queryFn:
          async () => {

            const response =
              await api.get(
                "/machine-master/master"
              );


            return extractRows(
              response,
              [
                "machine_master",
                "machines",
                "master",
              ]
            );
          },
      });


    const stationsQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "stations",
        ],

        queryFn:
          async () => {

            const response =
              await api.get(
                "/route-station-master/station-master"
              );


            return extractRows(
              response,
              [
                "station_master",
                "stations",
                "master",
              ]
            );
          },
      });


    const productionPlansQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "production-plans",
        ],

        queryFn:
          async () => {

            const response =
              await api.get(
                "/production-plan/master"
              );


            return extractRows(
              response,
              [
                "production_plan",
                "production_plans",
                "plans",
                "master",
              ]
            );
          },
      });


    const shiftsQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "shifts",
        ],

        queryFn:
          async () => {

            const response =
              await api.get(
                "/shift-plan/config"
              );


            let rows =
              extractRows(
                response,
                [
                  "shift_master",
                  "shifts",
                  "shift",
                  "shift_config",
                ]
              );


            if (
              !rows.length
            ) {

              rows =
                findRowsRecursive(
                  response?.data,
                  item =>
                    Boolean(
                      shiftId(item)
                    )
                );
            }


            return rows;
          },
      });


    // ========================================================
    // CONFIG QUERY
    // ========================================================

    const configQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "config",
        ],

        queryFn:
          () =>
            getOperatorWorkstationConfig(),
      });


    const config =
      configQuery.data ||
      {};


    const uiTemplates =
      operatorWorkstationService
        .getUiTemplateRows(
          config
        );


    const workstations =
      operatorWorkstationService
        .getWorkstationRows(
          config
        );


    const roleScreens =
      operatorWorkstationService
        .getRoleScreenRows(
          config
        );


    // ========================================================
    // LOOKUP DATA
    // ========================================================

    const companies =
      companiesQuery.data ||
      [];


    const plants =
      plantsQuery.data ||
      [];


    const lines =
      linesQuery.data ||
      [];


    const machines =
      machinesQuery.data ||
      [];


    const stations =
      stationsQuery.data ||
      [];


    const productionPlans =
      productionPlansQuery.data ||
      [];


    const shifts =
      shiftsQuery.data ||
      [];


    // ========================================================
    // DEFAULT COMPANY
    // ========================================================

    const defaultCompany =
      companies.length === 1
        ? companyId(
            companies[0]
          )
        : "";


    // ========================================================
    // MAPS
    // ========================================================

    const machineMap =
      useMemo(
        () =>
          new Map(
            machines.map(
              item => [
                String(
                  machineId(item)
                ),
                item,
              ]
            )
          ),
        [
          machines,
        ]
      );


    const stationMap =
      useMemo(
        () =>
          new Map(
            stations.map(
              item => [
                String(
                  stationId(item)
                ),
                item,
              ]
            )
          ),
        [
          stations,
        ]
      );


    const templateMap =
      useMemo(
        () =>
          new Map(
            uiTemplates.map(
              item => [
                String(
                  item.ui_template_config_id
                ),
                item,
              ]
            )
          ),
        [
          uiTemplates,
        ]
      );


    const workstationMap =
      useMemo(
        () =>
          new Map(
            workstations.map(
              item => [
                String(
                  item.workstation_config_id
                ),
                item,
              ]
            )
          ),
        [
          workstations,
        ]
      );


    // ========================================================
    // WORKSTATION DEPENDENT LOOKUPS
    // ========================================================

    const workstationPlants =
      useMemo(
        () =>
          plants.filter(
            item => {

              const itemCompany =
                companyId(item);


              return (
                !workstationForm.company_id ||
                !itemCompany ||
                sameId(
                  itemCompany,
                  workstationForm.company_id
                )
              );
            }
          ),
        [
          plants,
          workstationForm.company_id,
        ]
      );


    const workstationLines =
      useMemo(
        () =>
          lines.filter(
            item => {

              const itemPlant =
                plantId(item);


              return (
                !workstationForm.plant_id ||
                !itemPlant ||
                sameId(
                  itemPlant,
                  workstationForm.plant_id
                )
              );
            }
          ),
        [
          lines,
          workstationForm.plant_id,
        ]
      );


    const workstationMachines =
      useMemo(
        () =>
          machines.filter(
            item => {

              const itemLine =
                lineId(item);


              return (
                !workstationForm.line_id ||
                !itemLine ||
                sameId(
                  itemLine,
                  workstationForm.line_id
                )
              );
            }
          ),
        [
          machines,
          workstationForm.line_id,
        ]
      );


    const workstationStations =
      useMemo(
        () =>
          stations.filter(
            item => {

              const itemLine =
                lineId(item);


              return (
                !workstationForm.line_id ||
                !itemLine ||
                sameId(
                  itemLine,
                  workstationForm.line_id
                )
              );
            }
          ),
        [
          stations,
          workstationForm.line_id,
        ]
      );


    // ========================================================
    // EXECUTE DEPENDENT LOOKUPS
    // ========================================================

    const executePlants =
      useMemo(
        () =>
          plants.filter(
            item => {

              const itemCompany =
                companyId(item);


              return (
                !executeForm.company_id ||
                !itemCompany ||
                sameId(
                  itemCompany,
                  executeForm.company_id
                )
              );
            }
          ),
        [
          plants,
          executeForm.company_id,
        ]
      );


    const executeLines =
      useMemo(
        () =>
          lines.filter(
            item => {

              const itemPlant =
                plantId(item);


              if (
                executeForm.plant_id &&
                itemPlant &&
                !sameId(
                  itemPlant,
                  executeForm.plant_id
                )
              ) {
                return false;
              }


              return true;
            }
          ),
        [
          lines,
          executeForm.plant_id,
        ]
      );


    const executeMachines =
      useMemo(
        () =>
          machines.filter(
            item => {

              const itemLine =
                lineId(item);


              if (
                executeForm.line_id &&
                itemLine &&
                !sameId(
                  itemLine,
                  executeForm.line_id
                )
              ) {
                return false;
              }


              return true;
            }
          ),
        [
          machines,
          executeForm.line_id,
        ]
      );


    const executeWorkstations =
      useMemo(
        () =>
          workstations.filter(
            row => {

              if (
                !boolValue(
                  row.is_active
                )
              ) {
                return false;
              }


              if (
                executeForm.company_id &&
                !sameId(
                  row.company_id,
                  executeForm.company_id
                )
              ) {
                return false;
              }


              if (
                executeForm.plant_id &&
                !sameId(
                  row.plant_id,
                  executeForm.plant_id
                )
              ) {
                return false;
              }


              if (
                executeForm.line_id &&
                !sameId(
                  row.line_id,
                  executeForm.line_id
                )
              ) {
                return false;
              }


              if (
                executeForm.machine_id &&
                !sameId(
                  row.machine_id,
                  executeForm.machine_id
                )
              ) {
                return false;
              }


              return true;
            }
          ),
        [
          workstations,
          executeForm.company_id,
          executeForm.plant_id,
          executeForm.line_id,
          executeForm.machine_id,
        ]
      );


    const executePlans =
      useMemo(
        () =>
          productionPlans.filter(
            item => {

              const itemCompany =
                companyId(item);


              return (
                !executeForm.company_id ||
                !itemCompany ||
                sameId(
                  itemCompany,
                  executeForm.company_id
                )
              );
            }
          ),
        [
          productionPlans,
          executeForm.company_id,
        ]
      );


    // ========================================================
    // PLAN ENTRY QUERY
    //
    // Correct source:
    // /production-plan/config?plan_id=<uuid>
    // ========================================================

    const planEntriesQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "plan-entries",
          executeForm.production_plan_id,
        ],

        enabled:
          Boolean(
            executeForm.production_plan_id
          ),

        queryFn:
          async () => {

            const response =
              await api.get(
                "/production-plan/config",
                {
                  params: {
                    plan_id:
                      executeForm.production_plan_id,
                  },
                }
              );


            let rows =
              extractRows(
                response,
                [
                  "plan_entry",
                  "plan_entries",
                  "entries",
                ]
              );


            if (
              !rows.length
            ) {

              rows =
                findRowsRecursive(
                  response?.data,
                  item =>
                    Boolean(
                      planEntryId(item)
                    )
                );
            }


            const unique =
              new Map();


            rows.forEach(
              row => {

                const id =
                  planEntryId(row);


                if (id) {

                  unique.set(
                    String(id),
                    row
                  );
                }
              }
            );


            return Array.from(
              unique.values()
            );
          },
      });


    const planEntries =
      planEntriesQuery.data ||
      [];


    // ========================================================
    // SEARCH
    // ========================================================

    const searchedTemplates =
      useMemo(
        () => {

          const search =
            searchText
              .trim()
              .toLowerCase();


          if (!search) {
            return uiTemplates;
          }


          return uiTemplates.filter(
            row =>
              [
                row.template_code,
                row.template_name,
                row.template_type,
                row.schema_version,
                row.version_no,
              ]
                .join(" ")
                .toLowerCase()
                .includes(search)
          );
        },
        [
          uiTemplates,
          searchText,
        ]
      );


    const searchedWorkstations =
      useMemo(
        () => {

          const search =
            searchText
              .trim()
              .toLowerCase();


          if (!search) {
            return workstations;
          }


          return workstations.filter(
            row => {

              const machine =
                machineMap.get(
                  String(
                    row.machine_id
                  )
                );


              const template =
                templateMap.get(
                  String(
                    row.ui_template_config_id
                  )
                );


              return [
                row.workstation_code,
                row.workstation_name,
                row.execution_mode,
                row.status,
                machine
                  ? machineLabel(
                      machine
                    )
                  : "",
                template?.template_code,
              ]
                .join(" ")
                .toLowerCase()
                .includes(search);
            }
          );
        },
        [
          workstations,
          machineMap,
          templateMap,
          searchText,
        ]
      );


    const searchedRoleScreens =
      useMemo(
        () => {

          const search =
            searchText
              .trim()
              .toLowerCase();


          if (!search) {
            return roleScreens;
          }


          return roleScreens.filter(
            row => {

              const workstation =
                workstationMap.get(
                  String(
                    row.workstation_config_id
                  )
                );


              const template =
                templateMap.get(
                  String(
                    row.ui_template_config_id
                  )
                );


              return [
                row.role_id,
                row.screen_scope,
                row.display_order,
                row.version_no,
                workstation?.workstation_code,
                template?.template_code,
              ]
                .join(" ")
                .toLowerCase()
                .includes(search);
            }
          );
        },
        [
          roleScreens,
          workstationMap,
          templateMap,
          searchText,
        ]
      );


    // ========================================================
    // API RUNTIME FILTERS
    // ========================================================

    const runtimeApiFilters =
      useMemo(
        () => ({
          ...appliedRuntimeFilters,

          from_timestamp:
            toApiTimestamp(
              appliedRuntimeFilters
                .from_timestamp
            ),

          to_timestamp:
            toApiTimestamp(
              appliedRuntimeFilters
                .to_timestamp
            ),
        }),
        [
          appliedRuntimeFilters,
        ]
      );


    // ========================================================
    // RUNTIME QUERY
    // ========================================================

    const runtimeQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "runtime",
          runtimeApiFilters,
        ],

        queryFn:
          () =>
            getOperatorWorkstationRuntime(
              runtimeApiFilters
            ),

        enabled:
          activeView ===
          VIEW_RUNTIME,
      });


    const runtimeRows =
      operatorWorkstationService
        .getOperatorActionRows(
          runtimeQuery.data
        );


    // ========================================================
    // REPORT QUERY
    // ========================================================

    const reportQuery =
      useQuery({

        queryKey: [
          "operator-workstation",
          "report",
          runtimeApiFilters,
        ],

        queryFn:
          () =>
            getOperatorWorkstationReport(
              runtimeApiFilters
            ),

        enabled:
          activeView ===
          VIEW_REPORT,
      });


    const reportRows =
      operatorWorkstationService
        .getOperatorActionRows(
          reportQuery.data?.data
        );


    const reportMeta =
      reportQuery.data?.meta ||
      {};


    // ========================================================
    // MODULE REFRESH
    // ========================================================

    const refreshModule =
      async () => {

        await Promise.all([

          queryClient
            .invalidateQueries({
              queryKey: [
                "operator-workstation",
                "config",
              ],
            }),

          queryClient
            .invalidateQueries({
              queryKey: [
                "operator-workstation",
                "runtime",
              ],
            }),

          queryClient
            .invalidateQueries({
              queryKey: [
                "operator-workstation",
                "report",
              ],
            }),
        ]);
      };


    // ========================================================
    // UI TEMPLATE MUTATION
    // ========================================================

    const templateMutation =
      useMutation({

        mutationFn:
          async payload => {

            if (
              payload.ui_template_config_id
            ) {

              const {
                ui_template_config_id,
                ...body
              } =
                payload;


              return updateUiTemplate(
                ui_template_config_id,
                body
              );
            }


            return createUiTemplate(
              payload
            );
          },


        onSuccess:
          async () => {

            setErrorMessage("");

            setMessage(
              templateForm
                .ui_template_config_id
                ? "UI template updated successfully."
                : "UI template created successfully."
            );


            setShowTemplate(false);

            setTemplateForm(
              templateInitialState
            );


            await refreshModule();
          },


        onError:
          error => {

            setMessage("");

            setErrorMessage(
              getErrorMessage(
                error,
                "Unable to save UI template."
              )
            );
          },
      });


    // ========================================================
    // WORKSTATION MUTATION
    // ========================================================

    const workstationMutation =
      useMutation({

        mutationFn:
          async payload => {

            if (
              payload.workstation_config_id
            ) {

              const {
                workstation_config_id,
                ...body
              } =
                payload;


              return updateWorkstation(
                workstation_config_id,
                body
              );
            }


            return createWorkstation(
              payload
            );
          },


        onSuccess:
          async () => {

            setErrorMessage("");

            setMessage(
              workstationForm
                .workstation_config_id
                ? "Workstation updated successfully."
                : "Workstation created successfully."
            );


            setShowWorkstation(false);

            setWorkstationForm(
              workstationInitialState
            );


            await refreshModule();
          },


        onError:
          error => {

            setMessage("");

            setErrorMessage(
              getErrorMessage(
                error,
                "Unable to save workstation."
              )
            );
          },
      });


    // ========================================================
    // ROLE SCREEN MUTATION
    // ========================================================

    const roleScreenMutation =
      useMutation({

        mutationFn:
          async payload => {

            if (
              payload.role_screen_config_id
            ) {

              const {
                role_screen_config_id,
                ...body
              } =
                payload;


              return updateRoleScreen(
                role_screen_config_id,
                body
              );
            }


            return createRoleScreen(
              payload
            );
          },


        onSuccess:
          async () => {

            setErrorMessage("");

            setMessage(
              roleScreenForm
                .role_screen_config_id
                ? "Role screen mapping updated successfully."
                : "Role screen mapping created successfully."
            );


            setShowRoleScreen(false);

            setRoleScreenForm(
              roleScreenInitialState
            );


            await refreshModule();
          },


        onError:
          error => {

            setMessage("");

            setErrorMessage(
              getErrorMessage(
                error,
                "Unable to save role screen mapping."
              )
            );
          },
      });


    // ========================================================
    // EXECUTE MUTATION
    // ========================================================

    const executeMutation =
      useMutation({

        mutationFn:
          async payload =>
            executeOperatorAction(
              payload
            ),


        onSuccess:
          async response => {

            setErrorMessage("");


            const result =
              response?.data ||
              response;


            setMessage(
              result?.idempotent
                ? "This operator action was already processed."
                : "Operator action recorded successfully."
            );


            setShowExecute(false);

            setExecuteForm(
              executeInitialState
            );


            await refreshModule();


            setActiveView(
              VIEW_RUNTIME
            );
          },


        onError:
          error => {

            setMessage("");

            setErrorMessage(
              getErrorMessage(
                error,
                "Unable to record operator action."
              )
            );
          },
      });


    // ========================================================
    // OPEN CREATE FORMS
    // ========================================================

    const openTemplateCreate =
      () => {

        setTemplateForm({
          ...templateInitialState,

          company_id:
            defaultCompany,
        });


        setShowTemplate(true);
      };


    const openWorkstationCreate =
      () => {

        setWorkstationForm({
          ...workstationInitialState,

          company_id:
            defaultCompany,
        });


        setShowWorkstation(true);
      };


    const openRoleScreenCreate =
      () => {

        setRoleScreenForm({
          ...roleScreenInitialState,

          company_id:
            defaultCompany,
        });


        setShowRoleScreen(true);
      };


    const openExecuteForm =
      () => {

        setExecuteForm({
          ...executeInitialState,

          company_id:
            defaultCompany,
        });


        setShowExecute(true);
      };


    // ========================================================
    // OPEN EDIT FORMS
    // ========================================================

    const openTemplateEdit =
      row => {

        setTemplateForm({

          ui_template_config_id:
            row.ui_template_config_id,

          company_id:
            row.company_id ||
            "",

          template_code:
            row.template_code ||
            "",

          template_name:
            row.template_name ||
            "",

          template_type:
            row.template_type ||
            "OPERATOR",

          template_definition:
            JSON.stringify(
              row.template_definition ||
              {},
              null,
              2
            ),

          schema_version:
            row.schema_version ??
            1,

          version_no:
            row.version_no ??
            1,

          is_active:
            boolValue(
              row.is_active
            ),
        });


        setShowTemplate(true);
      };


    const openWorkstationEdit =
      row => {

        setWorkstationForm({

          workstation_config_id:
            row.workstation_config_id,

          company_id:
            row.company_id ||
            "",

          plant_id:
            row.plant_id ||
            "",

          line_id:
            row.line_id ||
            "",

          machine_id:
            row.machine_id ||
            "",

          station_id:
            row.station_id ||
            "",

          workstation_code:
            row.workstation_code ||
            "",

          workstation_name:
            row.workstation_name ||
            "",

          ui_template_config_id:
            row.ui_template_config_id ||
            "",

          execution_mode:
            row.execution_mode ||
            "AUTO",

          status:
            row.status ||
            "ACTIVE",

          version_no:
            row.version_no ??
            1,

          is_active:
            boolValue(
              row.is_active
            ),
        });


        setShowWorkstation(true);
      };


    const openRoleScreenEdit =
      row => {

        setRoleScreenForm({

          role_screen_config_id:
            row.role_screen_config_id,

          company_id:
            row.company_id ||
            "",

          role_id:
            row.role_id ??
            "",

          workstation_config_id:
            row.workstation_config_id ||
            "",

          ui_template_config_id:
            row.ui_template_config_id ||
            "",

          screen_scope:
            row.screen_scope ||
            "EXECUTION",

          display_order:
            row.display_order ??
            100,

          version_no:
            row.version_no ??
            1,

          is_active:
            boolValue(
              row.is_active
            ),
        });


        setShowRoleScreen(true);
      };


    // ========================================================
    // SUBMIT TEMPLATE
    // ========================================================

    const submitTemplate =
      event => {

        event.preventDefault();


        let definition;


        try {

          definition =
            JSON.parse(
              templateForm
                .template_definition
            );

        }
        catch {

          setMessage("");

          setErrorMessage(
            "Template Definition must contain valid JSON."
          );

          return;
        }


        templateMutation.mutate({

          ...templateForm,

          template_definition:
            definition,

          schema_version:
            Number(
              templateForm.schema_version
            ),

          version_no:
            Number(
              templateForm.version_no
            ),

          is_active:
            Boolean(
              templateForm.is_active
            ),
        });
      };


    // ========================================================
    // SUBMIT WORKSTATION
    // ========================================================

    const submitWorkstation =
      event => {

        event.preventDefault();


        workstationMutation
          .mutate({

            ...workstationForm,

            station_id:
              workstationForm
                .station_id ||
              null,

            version_no:
              Number(
                workstationForm
                  .version_no
              ),

            is_active:
              Boolean(
                workstationForm
                  .is_active
              ),
          });
      };


    // ========================================================
    // SUBMIT ROLE SCREEN
    // ========================================================

    const submitRoleScreen =
      event => {

        event.preventDefault();


        roleScreenMutation
          .mutate({

            ...roleScreenForm,

            role_id:
              Number(
                roleScreenForm.role_id
              ),

            workstation_config_id:
              roleScreenForm
                .workstation_config_id ||
              null,

            display_order:
              Number(
                roleScreenForm
                  .display_order
              ),

            version_no:
              Number(
                roleScreenForm
                  .version_no
              ),

            is_active:
              Boolean(
                roleScreenForm
                  .is_active
              ),
          });
      };


    // ========================================================
    // SUBMIT EXECUTION
    // ========================================================

    const submitExecute =
      event => {

        event.preventDefault();


        let payloadJson =
          {};


        try {

          payloadJson =
            executeForm.payload
              .trim()
              ? JSON.parse(
                  executeForm.payload
                )
              : {};

        }
        catch {

          setMessage("");

          setErrorMessage(
            "Payload must contain valid JSON."
          );

          return;
        }


        executeMutation.mutate({

          company_id:
            executeForm.company_id,

          plant_id:
            executeForm.plant_id,

          line_id:
            executeForm.line_id,

          machine_id:
            executeForm.machine_id,

          shift_id:
            Number(
              executeForm.shift_id
            ),

          workstation_config_id:
            executeForm
              .workstation_config_id,

          plan_entry_id:
            executeForm
              .plan_entry_id ||
            null,

          unit_id:
            executeForm.unit_id ||
            null,

          user_id:
            Number(
              executeForm.user_id
            ),

          action_code:
            executeForm.action_code,

          result_status:
            executeForm.result_status,

          reason:
            executeForm.reason ||
            null,

          source_system:
            executeForm.source_system ||
            "MES_UI",

          correlation_id:
            executeForm
              .correlation_id ||
            null,

          idempotency_key:
            `OW-${
              executeForm
                .workstation_config_id
            }-${Date.now()}`,

          payload:
            payloadJson,
        });
      };


    // ========================================================
    // SOFT DELETE
    // ========================================================

    const deactivateTemplate =
      async row => {

        if (
          !window.confirm(
            `Deactivate UI template "${row.template_code}"?`
          )
        ) {
          return;
        }


        try {

          setMessage("");

          setErrorMessage("");


          await softDeleteUiTemplate(
            row.ui_template_config_id
          );


          setMessage(
            "UI template deactivated successfully."
          );


          await refreshModule();

        }
        catch (error) {

          setErrorMessage(
            getErrorMessage(
              error,
              "Unable to deactivate UI template."
            )
          );
        }
      };


    const deactivateWorkstation =
      async row => {

        if (
          !window.confirm(
            `Deactivate workstation "${row.workstation_code}"?`
          )
        ) {
          return;
        }


        try {

          setMessage("");

          setErrorMessage("");


          await softDeleteWorkstation(
            row.workstation_config_id
          );


          setMessage(
            "Workstation deactivated successfully."
          );


          await refreshModule();

        }
        catch (error) {

          setErrorMessage(
            getErrorMessage(
              error,
              "Unable to deactivate workstation."
            )
          );
        }
      };


    const deactivateRoleScreen =
      async row => {

        if (
          !window.confirm(
            "Deactivate this role screen mapping?"
          )
        ) {
          return;
        }


        try {

          setMessage("");

          setErrorMessage("");


          await softDeleteRoleScreen(
            row.role_screen_config_id
          );


          setMessage(
            "Role screen mapping deactivated successfully."
          );


          await refreshModule();

        }
        catch (error) {

          setErrorMessage(
            getErrorMessage(
              error,
              "Unable to deactivate role screen mapping."
            )
          );
        }
      };


    // ========================================================
    // SCREEN RESOLUTION
    // ========================================================

    const resolveScreens =
      async event => {

        event.preventDefault();


        try {

          setMessage("");

          setErrorMessage("");


          const data =
            await getActiveOperatorScreens({

              company_id:
                screenResolution
                  .company_id,

              role_id:
                Number(
                  screenResolution
                    .role_id
                ),

              workstation_config_id:
                screenResolution
                  .workstation_config_id ||
                undefined,
            });


          setResolvedScreens(
            Array.isArray(data)
              ? data
              : []
          );


          setMessage(
            "Active operator screens resolved successfully."
          );

        }
        catch (error) {

          setResolvedScreens([]);

          setErrorMessage(
            getErrorMessage(
              error,
              "Unable to resolve active screens."
            )
          );
        }
      };


    // ========================================================
    // REFRESH
    // ========================================================

    const handleRefresh =
      async () => {

        try {

          setMessage("");

          setErrorMessage("");


          await Promise.all([

            configQuery.refetch(),

            companiesQuery.refetch(),

            plantsQuery.refetch(),

            linesQuery.refetch(),

            machinesQuery.refetch(),

            stationsQuery.refetch(),

            productionPlansQuery.refetch(),

            shiftsQuery.refetch(),

            activeView ===
            VIEW_RUNTIME
              ? runtimeQuery.refetch()
              : Promise.resolve(),

            activeView ===
            VIEW_REPORT
              ? reportQuery.refetch()
              : Promise.resolve(),
          ]);


          setMessage(
            "Data refreshed successfully."
          );

        }
        catch (error) {

          setErrorMessage(
            getErrorMessage(
              error,
              "Unable to refresh data."
            )
          );
        }
      };


    // ========================================================
    // MASTER COUNT
    // ========================================================

    const currentCount =
      selectedMaster ===
      MASTER_TEMPLATE

        ? searchedTemplates.length

        : selectedMaster ===
          MASTER_WORKSTATION

          ? searchedWorkstations.length

          : searchedRoleScreens.length;


    // ========================================================
    // LOADING
    // ========================================================

    const lookupLoading =
      companiesQuery.isLoading ||
      plantsQuery.isLoading ||
      linesQuery.isLoading ||
      machinesQuery.isLoading ||
      stationsQuery.isLoading ||
      productionPlansQuery.isLoading ||
      shiftsQuery.isLoading;


    // ========================================================
    // UI
    // ========================================================

    return (

      <>

<div className="ow-page">

        <style>{`

          .ow-page {
            padding: 22px;
            background: #f4f6fb;
            min-height: 100vh;
          }

          .ow-card {
            background: #ffffff;
            border: 1px solid #e5e9f2;
            border-radius: 12px;
            box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
          }

          .ow-page-title {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: #1f2d3d;
          }

          .ow-page-subtitle {
            margin-top: 4px;
            color: #748094;
            font-size: 13px;
          }

          .ow-btn-primary {
            background: #314965 !important;
            border-color: #314965 !important;
            color: #ffffff !important;
            font-weight: 600;
          }

          .ow-btn-primary:hover {
            background: #25364e !important;
            border-color: #25364e !important;
          }

          .ow-btn-outline {
            background: #ffffff !important;
            color: #314965 !important;
            border: 1px solid #314965 !important;
            font-weight: 600;
          }

          .ow-btn-outline:hover {
            background: #314965 !important;
            color: #ffffff !important;
          }

          .ow-module-tabs {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .ow-module-tab {
            border: 1px solid #d9dce5;
            background: #ffffff;
            color: #566176;
            font-weight: 600;
            padding: 8px 15px;
            border-radius: 7px;
            transition: 0.2s ease;
          }

          .ow-module-tab:hover {
            border-color: #314965;
            color: #314965;
          }

          .ow-module-tab.active {
            border-color: #314965;
            background: #f1f4f8;
            color: #314965;
          }

          .ow-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .ow-search-box {
            position: relative;
            width: 330px;
            max-width: 100%;
          }

          .ow-search-box svg {
            position: absolute;
            left: 11px;
            top: 50%;
            transform: translateY(-50%);
            color: #8792a5;
          }

          .ow-search-box input {
            padding-left: 34px;
          }

          .ow-master-selector {
            min-width: 220px;
          }

          .ow-stat-card {
            border: 1px solid #e5e9f2;
            border-radius: 10px;
            padding: 14px;
            background: #ffffff;
            height: 100%;
          }

          .ow-stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 9px;
            background: #f1f4f8;
            color: #314965;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          }

          .ow-stat-value {
            font-size: 20px;
            font-weight: 700;
            color: #263449;
          }

          .ow-stat-label {
            color: #758195;
            font-size: 12px;
          }

          .ow-table-wrap {
            border: 1px solid #e4e7ee;
            border-radius: 9px;
            overflow: auto;
          }

          .ow-table {
            margin: 0;
            white-space: nowrap;
          }

          .ow-table thead th {
            background: #1c2d45;
            color: #ffffff;
            border-color: #1c2d45;
            font-size: 12px;
            font-weight: 700;
            padding: 12px;
          }

          .ow-table tbody td {
            vertical-align: middle;
            padding: 11px 12px;
            color: #364152;
            font-size: 13px;
          }

          .ow-empty {
            color: #8a94a6 !important;
            text-align: center;
            padding: 30px !important;
          }

          .ow-action-edit {
            background: #ffffff !important;
            border: 1px solid #314965 !important;
            color: #314965 !important;
            font-size: 12px;
            font-weight: 600;
            padding: 5px 10px;
          }

          .ow-action-edit:hover {
            background: #314965 !important;
            color: #ffffff !important;
          }

          .ow-action-delete {
            background: #ffffff !important;
            border: 1px solid #dc3545 !important;
            color: #dc3545 !important;
            font-size: 12px;
            font-weight: 600;
            padding: 5px 10px;
          }

          .ow-action-delete:hover {
            background: #dc3545 !important;
            color: #ffffff !important;
          }

          .ow-modal .modal-content {
            border: none;
            border-radius: 12px;
            overflow: hidden;
          }

          .ow-modal .modal-header {
            background: #1c2d45;
            color: #ffffff;
            border: none;
          }

          .ow-modal .btn-close {
            filter: invert(1);
          }

          .ow-label {
            color: #354154;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 5px;
          }

          .ow-required {
            color: #dc3545;
          }

          .ow-filter-panel {
            padding: 15px;
            border: 1px solid #e5e9f2;
            border-radius: 9px;
            background: #f9fafc;
            margin-bottom: 15px;
          }

          .ow-info-box {
            border: 1px solid #f1cebc;
            background: #f6f8fa;
            color: #865038;
            border-radius: 9px;
            padding: 12px 14px;
            font-size: 13px;
          }

          .ow-json {
            font-family: Consolas, Monaco, monospace;
            font-size: 13px;
          }

          .ow-count-badge {
            font-size: 12px;
            padding: 6px 9px;
          }

          @media (max-width: 768px) {

            .ow-page {
              padding: 12px;
            }

            .ow-search-box {
              width: 100%;
            }

            .ow-toolbar {
              align-items: stretch;
            }

            .ow-master-selector {
              width: 100%;
            }
          }

        `}</style>


        {/* ==================================================
            HEADER
        =================================================== */}

        <Card className="ow-card mb-3">

          <Card.Body>

            <Row className="align-items-center g-3">

              <Col lg={7}>

                <h4 className="ow-page-title">
                  Operator Workstation
                </h4>

                <div className="ow-page-subtitle">
                  Configure operator screens,
                  machine workstations and
                  role-based execution access.
                </div>

              </Col>


              <Col lg={5}>

                <div className="d-flex justify-content-lg-end gap-2 flex-wrap">

                  <Button
                    className="ow-btn-outline"
                    onClick={
                      handleRefresh
                    }
                  >
                    <ArrowClockwise className="me-1" />

                    Refresh
                  </Button>


                  <Button
                    className="ow-btn-outline"
                    onClick={() =>
                      setActiveView(
                        VIEW_RUNTIME
                      )
                    }
                  >
                    <BarChartLine className="me-1" />

                    Runtime
                  </Button>


                  <Button
                    className="ow-btn-primary"
                    onClick={
                      openExecuteForm
                    }
                  >
                    <PlayFill className="me-1" />

                    Record Action
                  </Button>

                </div>

              </Col>

            </Row>

          </Card.Body>

        </Card>


        {/* ==================================================
            ALERTS
        =================================================== */}

        {
          message &&

          <Alert
            variant="success"
            dismissible
            onClose={() =>
              setMessage("")
            }
          >
            {message}
          </Alert>
        }


        {
          errorMessage &&

          <Alert
            variant="danger"
            dismissible
            onClose={() =>
              setErrorMessage("")
            }
          >
            {errorMessage}
          </Alert>
        }


        {/* ==================================================
            SUMMARY
        =================================================== */}

        <Row className="g-3 mb-3">

          <Col md={4}>

            <div className="ow-stat-card">

              <div className="d-flex align-items-center gap-3">

                <div className="ow-stat-icon">
                  <Collection />
                </div>

                <div>

                  <div className="ow-stat-value">
                    {uiTemplates.length}
                  </div>

                  <div className="ow-stat-label">
                    UI Templates
                  </div>

                </div>

              </div>

            </div>

          </Col>


          <Col md={4}>

            <div className="ow-stat-card">

              <div className="d-flex align-items-center gap-3">

                <div className="ow-stat-icon">
                  <Cpu />
                </div>

                <div>

                  <div className="ow-stat-value">
                    {workstations.length}
                  </div>

                  <div className="ow-stat-label">
                    Workstations
                  </div>

                </div>

              </div>

            </div>

          </Col>


          <Col md={4}>

            <div className="ow-stat-card">

              <div className="d-flex align-items-center gap-3">

                <div className="ow-stat-icon">
                  <People />
                </div>

                <div>

                  <div className="ow-stat-value">
                    {roleScreens.length}
                  </div>

                  <div className="ow-stat-label">
                    Role Screen Mappings
                  </div>

                </div>

              </div>

            </div>

          </Col>

        </Row>


        {/* ==================================================
            MAIN
        =================================================== */}

        <Card className="ow-card">

          <Card.Body>

            {/* ==============================================
                PAGE TABS
            =============================================== */}

            <div className="ow-module-tabs mb-3">

              <button
                type="button"
                className={
                  `ow-module-tab ${
                    activeView ===
                    VIEW_MASTER
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setActiveView(
                    VIEW_MASTER
                  )
                }
              >
                Master Configuration
              </button>


              <button
                type="button"
                className={
                  `ow-module-tab ${
                    activeView ===
                    VIEW_RUNTIME
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setActiveView(
                    VIEW_RUNTIME
                  )
                }
              >
                Operator Runtime
              </button>


              <button
                type="button"
                className={
                  `ow-module-tab ${
                    activeView ===
                    VIEW_REPORT
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setActiveView(
                    VIEW_REPORT
                  )
                }
              >
                Report
              </button>

            </div>


            {/* ==============================================
                MASTER CONFIGURATION
            =============================================== */}

            {
              activeView ===
              VIEW_MASTER && (

                <>

                  <div className="ow-toolbar mb-3">

                    <div className="d-flex gap-2 flex-wrap">

                      <Form.Select
                        className="ow-master-selector"
                        value={
                          selectedMaster
                        }
                        onChange={
                          event => {

                            setSelectedMaster(
                              event.target.value
                            );

                            setSearchText("");
                          }
                        }
                      >

                        <option
                          value={
                            MASTER_TEMPLATE
                          }
                        >
                          UI Template
                        </option>

                        <option
                          value={
                            MASTER_WORKSTATION
                          }
                        >
                          Workstation
                        </option>

                        <option
                          value={
                            MASTER_ROLE_SCREEN
                          }
                        >
                          Role Screen
                        </option>

                      </Form.Select>


                      <div className="ow-search-box">

                        <Search />

                        <Form.Control
                          placeholder="Search..."
                          value={
                            searchText
                          }
                          onChange={
                            event =>
                              setSearchText(
                                event.target.value
                              )
                          }
                        />

                      </div>

                    </div>


                    <div className="d-flex gap-2 flex-wrap">

                      {
                        selectedMaster ===
                          MASTER_ROLE_SCREEN && (

                          <Button
                            className="ow-btn-outline"
                            onClick={() => {

                              setResolvedScreens([]);

                              setScreenResolution({
                                ...screenResolutionInitialState,

                                company_id:
                                  defaultCompany,
                              });

                              setShowScreenResolve(
                                true
                              );
                            }}
                          >
                            Resolve Screens
                          </Button>
                        )
                      }


                      <Button
                        className="ow-btn-primary"
                        onClick={

                          selectedMaster ===
                          MASTER_TEMPLATE

                            ? openTemplateCreate

                            : selectedMaster ===
                              MASTER_WORKSTATION

                              ? openWorkstationCreate

                              : openRoleScreenCreate
                        }
                      >
                        <Plus className="me-1" />

                        {
                          selectedMaster ===
                          MASTER_TEMPLATE

                            ? "Add Template"

                            : selectedMaster ===
                              MASTER_WORKSTATION

                              ? "Add Workstation"

                              : "Add Role Screen"
                        }

                      </Button>

                    </div>

                  </div>


                  <div className="text-muted small mb-2">
                    Showing {currentCount} record(s)
                  </div>


                  {
                    configQuery.isLoading
                      ? (

                        <div className="text-center py-5">

                          <Spinner animation="border" />

                        </div>
                      )
                      : (

                        <div className="ow-table-wrap">


                          {/* ==================================
                              UI TEMPLATE TABLE
                          ================================== */}

                          {
                            selectedMaster ===
                              MASTER_TEMPLATE && (

                              <Table
                                className="ow-table"
                                hover
                              >

                                <thead>

                                  <tr>

                                    <th>
                                      Template Code
                                    </th>

                                    <th>
                                      Template Name
                                    </th>

                                    <th>
                                      Type
                                    </th>

                                    <th>
                                      Schema
                                    </th>

                                    <th>
                                      Version
                                    </th>

                                    <th>
                                      Status
                                    </th>

                                    <th>
                                      Actions
                                    </th>

                                  </tr>

                                </thead>


                                <tbody>

                                  {
                                    searchedTemplates.length ===
                                      0
                                      ? (

                                        <tr>

                                          <td
                                            colSpan={7}
                                            className="ow-empty"
                                          >
                                            No UI template records found.
                                          </td>

                                        </tr>
                                      )
                                      : (

                                        searchedTemplates.map(
                                          row => (

                                            <tr
                                              key={
                                                row.ui_template_config_id
                                              }
                                            >

                                              <td>
                                                <strong>
                                                  {
                                                    safeText(
                                                      row.template_code
                                                    )
                                                  }
                                                </strong>
                                              </td>

                                              <td>
                                                {
                                                  safeText(
                                                    row.template_name
                                                  )
                                                }
                                              </td>

                                              <td>
                                                {
                                                  safeText(
                                                    row.template_type
                                                  )
                                                }
                                              </td>

                                              <td>
                                                {
                                                  safeText(
                                                    row.schema_version
                                                  )
                                                }
                                              </td>

                                              <td>
                                                {
                                                  safeText(
                                                    row.version_no
                                                  )
                                                }
                                              </td>

                                              <td>

                                                <ActiveBadge
                                                  active={
                                                    row.is_active
                                                  }
                                                />

                                              </td>

                                              <td>

                                                <div className="d-flex gap-2">

                                                  <Button
                                                    className="ow-action-edit"
                                                    onClick={() =>
                                                      openTemplateEdit(
                                                        row
                                                      )
                                                    }
                                                  >
                                                    <PencilSquare className="me-1" />

                                                    Edit
                                                  </Button>


                                                  {
                                                    boolValue(
                                                      row.is_active
                                                    ) && (

                                                      <Button
                                                        className="ow-action-delete"
                                                        onClick={() =>
                                                          deactivateTemplate(
                                                            row
                                                          )
                                                        }
                                                      >
                                                        Deactivate
                                                      </Button>
                                                    )
                                                  }

                                                </div>

                                              </td>

                                            </tr>
                                          )
                                        )
                                      )
                                  }

                                </tbody>

                              </Table>
                            )
                          }


                          {/* ==================================
                              WORKSTATION TABLE
                          ================================== */}

                          {
                            selectedMaster ===
                              MASTER_WORKSTATION && (

                              <Table
                                className="ow-table"
                                hover
                              >

                                <thead>

                                  <tr>

                                    <th>
                                      Workstation Code
                                    </th>

                                    <th>
                                      Workstation Name
                                    </th>

                                    <th>
                                      Machine
                                    </th>

                                    <th>
                                      Station
                                    </th>

                                    <th>
                                      Template
                                    </th>

                                    <th>
                                      Mode
                                    </th>

                                    <th>
                                      Version
                                    </th>

                                    <th>
                                      Status
                                    </th>

                                    <th>
                                      Actions
                                    </th>

                                  </tr>

                                </thead>


                                <tbody>

                                  {
                                    searchedWorkstations.length ===
                                      0
                                      ? (

                                        <tr>

                                          <td
                                            colSpan={9}
                                            className="ow-empty"
                                          >
                                            No workstation records found.
                                          </td>

                                        </tr>
                                      )
                                      : (

                                        searchedWorkstations.map(
                                          row => {

                                            const machine =
                                              machineMap.get(
                                                String(
                                                  row.machine_id
                                                )
                                              );


                                            const station =
                                              stationMap.get(
                                                String(
                                                  row.station_id
                                                )
                                              );


                                            const template =
                                              templateMap.get(
                                                String(
                                                  row.ui_template_config_id
                                                )
                                              );


                                            return (

                                              <tr
                                                key={
                                                  row.workstation_config_id
                                                }
                                              >

                                                <td>
                                                  <strong>
                                                    {
                                                      safeText(
                                                        row.workstation_code
                                                      )
                                                    }
                                                  </strong>
                                                </td>

                                                <td>
                                                  {
                                                    safeText(
                                                      row.workstation_name
                                                    )
                                                  }
                                                </td>

                                                <td>
                                                  {
                                                    machine
                                                      ? machineLabel(
                                                          machine
                                                        )
                                                      : safeText(
                                                          row.machine_id
                                                        )
                                                  }
                                                </td>

                                                <td>
                                                  {
                                                    station
                                                      ? stationLabel(
                                                          station
                                                        )
                                                      : "-"
                                                  }
                                                </td>

                                                <td>
                                                  {
                                                    template
                                                      ? template.template_code
                                                      : safeText(
                                                          row.ui_template_config_id
                                                        )
                                                  }
                                                </td>

                                                <td>
                                                  {
                                                    safeText(
                                                      row.execution_mode
                                                    )
                                                  }
                                                </td>

                                                <td>
                                                  {
                                                    safeText(
                                                      row.version_no
                                                    )
                                                  }
                                                </td>

                                                <td>

                                                  <ActiveBadge
                                                    active={
                                                      row.is_active
                                                    }
                                                  />

                                                </td>

                                                <td>

                                                  <div className="d-flex gap-2">

                                                    <Button
                                                      className="ow-action-edit"
                                                      onClick={() =>
                                                        openWorkstationEdit(
                                                          row
                                                        )
                                                      }
                                                    >
                                                      <PencilSquare className="me-1" />

                                                      Edit
                                                    </Button>


                                                    {
                                                      boolValue(
                                                        row.is_active
                                                      ) && (

                                                        <Button
                                                          className="ow-action-delete"
                                                          onClick={() =>
                                                            deactivateWorkstation(
                                                              row
                                                            )
                                                          }
                                                        >
                                                          Deactivate
                                                        </Button>
                                                      )
                                                    }

                                                  </div>

                                                </td>

                                              </tr>
                                            );
                                          }
                                        )
                                      )
                                  }

                                </tbody>

                              </Table>
                            )
                          }


                          {/* ==================================
                              ROLE SCREEN TABLE
                          ================================== */}

                          {
                            selectedMaster ===
                              MASTER_ROLE_SCREEN && (

                              <Table
                                className="ow-table"
                                hover
                              >

                                <thead>

                                  <tr>

                                    <th>
                                      Role ID
                                    </th>

                                    <th>
                                      Workstation
                                    </th>

                                    <th>
                                      UI Template
                                    </th>

                                    <th>
                                      Scope
                                    </th>

                                    <th>
                                      Order
                                    </th>

                                    <th>
                                      Version
                                    </th>

                                    <th>
                                      Status
                                    </th>

                                    <th>
                                      Actions
                                    </th>

                                  </tr>

                                </thead>


                                <tbody>

                                  {
                                    searchedRoleScreens.length ===
                                      0
                                      ? (

                                        <tr>

                                          <td
                                            colSpan={8}
                                            className="ow-empty"
                                          >
                                            No role screen mappings found.
                                          </td>

                                        </tr>
                                      )
                                      : (

                                        searchedRoleScreens.map(
                                          row => {

                                            const workstation =
                                              workstationMap.get(
                                                String(
                                                  row.workstation_config_id
                                                )
                                              );


                                            const template =
                                              templateMap.get(
                                                String(
                                                  row.ui_template_config_id
                                                )
                                              );


                                            return (

                                              <tr
                                                key={
                                                  row.role_screen_config_id
                                                }
                                              >

                                                <td>
                                                  <strong>
                                                    {
                                                      safeText(
                                                        row.role_id
                                                      )
                                                    }
                                                  </strong>
                                                </td>

                                                <td>
                                                  {
                                                    workstation
                                                      ? workstation.workstation_code
                                                      : "GLOBAL"
                                                  }
                                                </td>

                                                <td>
                                                  {
                                                    template
                                                      ? template.template_code
                                                      : safeText(
                                                          row.ui_template_config_id
                                                        )
                                                  }
                                                </td>

                                                <td>
                                                  {
                                                    safeText(
                                                      row.screen_scope
                                                    )
                                                  }
                                                </td>

                                                <td>
                                                  {
                                                    safeText(
                                                      row.display_order
                                                    )
                                                  }
                                                </td>

                                                <td>
                                                  {
                                                    safeText(
                                                      row.version_no
                                                    )
                                                  }
                                                </td>

                                                <td>

                                                  <ActiveBadge
                                                    active={
                                                      row.is_active
                                                    }
                                                  />

                                                </td>

                                                <td>

                                                  <div className="d-flex gap-2">

                                                    <Button
                                                      className="ow-action-edit"
                                                      onClick={() =>
                                                        openRoleScreenEdit(
                                                          row
                                                        )
                                                      }
                                                    >
                                                      <PencilSquare className="me-1" />

                                                      Edit
                                                    </Button>


                                                    {
                                                      boolValue(
                                                        row.is_active
                                                      ) && (

                                                        <Button
                                                          className="ow-action-delete"
                                                          onClick={() =>
                                                            deactivateRoleScreen(
                                                              row
                                                            )
                                                          }
                                                        >
                                                          Deactivate
                                                        </Button>
                                                      )
                                                    }

                                                  </div>

                                                </td>

                                              </tr>
                                            );
                                          }
                                        )
                                      )
                                  }

                                </tbody>

                              </Table>
                            )
                          }

                        </div>
                      )
                  }

                </>
              )
            }


            {/* ==============================================
                RUNTIME
            =============================================== */}

            {
              activeView ===
              VIEW_RUNTIME && (

                <>

                  <RuntimeFilters
                    filters={
                      runtimeFilters
                    }

                    setFilters={
                      setRuntimeFilters
                    }

                    companies={
                      companies
                    }

                    workstations={
                      workstations
                    }

                    shifts={
                      shifts
                    }

                    onApply={() =>
                      setAppliedRuntimeFilters({
                        ...runtimeFilters,
                      })
                    }

                    onClear={() => {

                      setRuntimeFilters(
                        runtimeFilterInitialState
                      );

                      setAppliedRuntimeFilters(
                        runtimeFilterInitialState
                      );
                    }}
                  />


                  <EventJourney records={runtimeRows} title="Operator activity journey"/><OperatorEventTable
                    rows={
                      runtimeRows
                    }

                    workstations={
                      workstations
                    }

                    loading={
                      runtimeQuery.isFetching
                    }
                  />

                </>
              )
            }


            {/* ==============================================
                REPORT
            =============================================== */}

            {
              activeView ===
              VIEW_REPORT && (

                <>

                  <RuntimeFilters
                    filters={
                      runtimeFilters
                    }

                    setFilters={
                      setRuntimeFilters
                    }

                    companies={
                      companies
                    }

                    workstations={
                      workstations
                    }

                    shifts={
                      shifts
                    }

                    onApply={() =>
                      setAppliedRuntimeFilters({
                        ...runtimeFilters,
                      })
                    }

                    onClear={() => {

                      setRuntimeFilters(
                        runtimeFilterInitialState
                      );

                      setAppliedRuntimeFilters(
                        runtimeFilterInitialState
                      );
                    }}
                  />


                  <Row className="g-3 mb-3">

                    <Col md={4}>

                      <div className="ow-stat-card">

                        <div className="ow-stat-label">
                          Total Operator Actions
                        </div>

                        <div className="ow-stat-value mt-1">
                          {
                            reportMeta.total_count ??
                            reportRows.length
                          }
                        </div>

                      </div>

                    </Col>


                    <Col md={4}>

                      <div className="ow-stat-card">

                        <div className="ow-stat-label mb-2">
                          Action Counts
                        </div>

                        <CountBadges
                          values={
                            reportMeta.action_counts
                          }
                        />

                      </div>

                    </Col>


                    <Col md={4}>

                      <div className="ow-stat-card">

                        <div className="ow-stat-label mb-2">
                          Result Counts
                        </div>

                        <CountBadges
                          values={
                            reportMeta.result_counts
                          }
                        />

                      </div>

                    </Col>

                  </Row>


                  <ReportLens records={reportRows} title="Operator activity report explorer"/><OperatorEventTable
                    rows={
                      reportRows
                    }

                    workstations={
                      workstations
                    }

                    loading={
                      reportQuery.isFetching
                    }
                  />

                </>
              )
            }

          </Card.Body>

        </Card>


        {/* ==================================================
            UI TEMPLATE MODAL
        =================================================== */}

        <Modal
          show={
            showTemplate
          }
          onHide={() =>
            setShowTemplate(false)
          }
          centered
          size="lg"
          className="ow-modal"
        >

          <Form
            onSubmit={
              submitTemplate
            }
          >

            <Modal.Header closeButton>

              <Modal.Title>

                {
                  templateForm
                    .ui_template_config_id

                    ? "Edit UI Template"

                    : "Add UI Template"
                }

              </Modal.Title>

            </Modal.Header>


            <Modal.Body>

              <Row className="g-3">

                <Col md={6}>

                  <Form.Label className="ow-label">

                    Company

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    value={
                      templateForm.company_id
                    }disabled={Boolean(templateForm.ui_template_config_id)}
                    onChange={
                      event =>
                        setTemplateForm(
                          old => ({
                            ...old,

                            company_id:
                              event.target.value,
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Company
                    </option>


                    {
                      companies.map(
                        item => (

                          <option
                            key={
                              companyId(item)
                            }
                            value={
                              companyId(item)
                            }
                          >
                            {
                              companyLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                <Col md={6}>

                  <Form.Label className="ow-label">

                    Template Code

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    maxLength={60}
                    value={
                      templateForm
                        .template_code
                    }
                    onChange={
                      event =>
                        setTemplateForm(
                          old => ({
                            ...old,

                            template_code:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                <Col md={6}>

                  <Form.Label className="ow-label">

                    Template Name

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    maxLength={150}
                    value={
                      templateForm
                        .template_name
                    }
                    onChange={
                      event =>
                        setTemplateForm(
                          old => ({
                            ...old,

                            template_name:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                <Col md={6}>

                  <Form.Label className="ow-label">

                    Template Type

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    maxLength={30}
                    value={
                      templateForm
                        .template_type
                    }
                    onChange={
                      event =>
                        setTemplateForm(
                          old => ({
                            ...old,

                            template_type:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                <Col md={4}>

                  <Form.Label className="ow-label">
                    Schema Version
                  </Form.Label>


                  <Form.Control
                    required
                    type="number"
                    min="1"
                    value={
                      templateForm
                        .schema_version
                    }
                    onChange={
                      event =>
                        setTemplateForm(
                          old => ({
                            ...old,

                            schema_version:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                <Col md={4}>

                  <Form.Label className="ow-label">
                    Version
                  </Form.Label>


                  <Form.Control
                    required
                    type="number"
                    min="1"
                    value={
                      templateForm
                        .version_no
                    }
                    onChange={
                      event =>
                        setTemplateForm(
                          old => ({
                            ...old,

                            version_no:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                <Col
                  md={4}
                  className="d-flex align-items-end"
                >

                  <Form.Check
                    type="switch"
                    label="Active"
                    checked={
                      templateForm
                        .is_active
                    }
                    onChange={
                      event =>
                        setTemplateForm(
                          old => ({
                            ...old,

                            is_active:
                              event.target.checked,
                          })
                        )
                    }
                  />

                </Col>


                <Col md={12}>

                  <Form.Label className="ow-label">

                    Template Definition JSON

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    as="textarea"
                    rows={10}
                    required
                    className="ow-json"
                    value={
                      templateForm
                        .template_definition
                    }
                    onChange={
                      event =>
                        setTemplateForm(
                          old => ({
                            ...old,

                            template_definition:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>

              </Row>

            </Modal.Body>


            <Modal.Footer>

              <Button
                variant="outline-secondary"
                onClick={() =>
                  setShowTemplate(false)
                }
              >
                Cancel
              </Button>


              <Button
                type="submit"
                className="ow-btn-primary"
                disabled={
                  templateMutation.isPending
                }
              >

                {
                  templateMutation.isPending
                    ? "Saving..."
                    : "Save Template"
                }

              </Button>

            </Modal.Footer>

          </Form>

        </Modal>


        {/* ==================================================
            WORKSTATION MODAL
        =================================================== */}

        <Modal
          show={
            showWorkstation
          }
          onHide={() =>
            setShowWorkstation(false)
          }
          centered
          size="xl"
          className="ow-modal"
        >

          <Form
            onSubmit={
              submitWorkstation
            }
          >

            <Modal.Header closeButton>

              <Modal.Title>

                {
                  workstationForm
                    .workstation_config_id

                    ? "Edit Workstation"

                    : "Add Workstation"
                }

              </Modal.Title>

            </Modal.Header>


            <Modal.Body>

              {
                lookupLoading && (

                  <Alert variant="light">

                    <Spinner
                      size="sm"
                      animation="border"
                      className="me-2"
                    />

                    Loading master dropdown data...

                  </Alert>
                )
              }


              <Row className="g-3">

                {/* COMPANY */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Company

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    value={
                      workstationForm.company_id
                    }disabled={Boolean(workstationForm.workstation_config_id)}
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            company_id:
                              event.target.value,

                            plant_id: "",

                            line_id: "",

                            machine_id: "",

                            station_id: "",

                            ui_template_config_id:
                              "",
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Company
                    </option>


                    {
                      companies.map(
                        item => (

                          <option
                            key={
                              companyId(item)
                            }
                            value={
                              companyId(item)
                            }
                          >
                            {
                              companyLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* PLANT */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Plant / Shop

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                   disabled={
  Boolean(workstationForm.workstation_config_id) ||
  !workstationForm.company_id
}
                    value={
                      workstationForm.plant_id
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            plant_id:
                              event.target.value,

                            line_id: "",

                            machine_id: "",

                            station_id: "",
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Plant
                    </option>


                    {
                      workstationPlants.map(
                        item => (

                          <option
                            key={
                              plantId(item)
                            }
                            value={
                              plantId(item)
                            }
                          >
                            {
                              plantLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* LINE */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Line

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    disabled={
  Boolean(workstationForm.workstation_config_id) ||
  !workstationForm.plant_id
}
                    value={
                      workstationForm.line_id
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            line_id:
                              event.target.value,

                            machine_id: "",

                            station_id: "",
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Line
                    </option>


                    {
                      workstationLines.map(
                        item => (

                          <option
                            key={
                              lineId(item)
                            }
                            value={
                              lineId(item)
                            }
                          >
                            {
                              lineLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* MACHINE */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Machine

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    disabled={
  Boolean(workstationForm.workstation_config_id) ||
  !workstationForm.line_id
}
                    value={
                      workstationForm.machine_id
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            machine_id:
                              event.target.value,
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Machine
                    </option>


                    {
                      workstationMachines.map(
                        item => (

                          <option
                            key={
                              machineId(item)
                            }
                            value={
                              machineId(item)
                            }
                          >
                            {
                              machineLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* STATION */}

                <Col md={4}>

                  <Form.Label className="ow-label">
                    Station
                  </Form.Label>


                  <Form.Select
                    disabled={
  Boolean(workstationForm.workstation_config_id) ||
  !workstationForm.line_id
}
                    value={
                      workstationForm.station_id
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            station_id:
                              event.target.value,
                          })
                        )
                    }
                  >

                    <option value="">
                      No Station
                    </option>


                    {
                      workstationStations.map(
                        item => (

                          <option
                            key={
                              stationId(item)
                            }
                            value={
                              stationId(item)
                            }
                          >
                            {
                              stationLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* TEMPLATE */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    UI Template

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                   disabled={
  Boolean(workstationForm.workstation_config_id) ||
  !workstationForm.company_id
}
                    value={
                      workstationForm
                        .ui_template_config_id
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            ui_template_config_id:
                              event.target.value,
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Template
                    </option>


                    {
                      uiTemplates
                        .filter(
                          item =>
                            boolValue(
                              item.is_active
                            ) &&
                            (
                              !workstationForm.company_id ||
                              sameId(
                                item.company_id,
                                workstationForm.company_id
                              )
                            )
                        )
                        .map(
                          item => (

                            <option
                              key={
                                item.ui_template_config_id
                              }
                              value={
                                item.ui_template_config_id
                              }
                            >
                              {
                                item.template_code
                              }
                              {" - "}
                              {
                                item.template_name
                              }
                            </option>
                          )
                        )
                    }

                  </Form.Select>

                </Col>


                {/* CODE */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Workstation Code

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    maxLength={60}
                    value={
                      workstationForm
                        .workstation_code
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            workstation_code:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* NAME */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Workstation Name

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    maxLength={150}
                    value={
                      workstationForm
                        .workstation_name
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            workstation_name:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* EXECUTION MODE */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Execution Mode

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    maxLength={20}
                    value={
                      workstationForm
                        .execution_mode
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            execution_mode:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* STATUS */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Status

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    maxLength={30}
                    value={
                      workstationForm.status
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            status:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* VERSION */}

                <Col md={4}>

                  <Form.Label className="ow-label">
                    Version
                  </Form.Label>


                  <Form.Control
                    required
                    type="number"
                    min="1"
                    value={
                      workstationForm
                        .version_no
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            version_no:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                <Col
                  md={4}
                  className="d-flex align-items-end"
                >

                  <Form.Check
                    type="switch"
                    label="Active"
                    checked={
                      workstationForm
                        .is_active
                    }
                    onChange={
                      event =>
                        setWorkstationForm(
                          old => ({
                            ...old,

                            is_active:
                              event.target.checked,
                          })
                        )
                    }
                  />

                </Col>

              </Row>

            </Modal.Body>


            <Modal.Footer>

              <Button
                variant="outline-secondary"
                onClick={() =>
                  setShowWorkstation(false)
                }
              >
                Cancel
              </Button>


              <Button
                type="submit"
                className="ow-btn-primary"
                disabled={
                  workstationMutation.isPending
                }
              >
                {
                  workstationMutation.isPending
                    ? "Saving..."
                    : "Save Workstation"
                }
              </Button>

            </Modal.Footer>

          </Form>

        </Modal>


        {/* ==================================================
            ROLE SCREEN MODAL
        =================================================== */}

        <Modal
          show={
            showRoleScreen
          }
          onHide={() =>
            setShowRoleScreen(false)
          }
          centered
          size="lg"
          className="ow-modal"
        >

          <Form
            onSubmit={
              submitRoleScreen
            }
          >

            <Modal.Header closeButton>

              <Modal.Title>

                {
                  roleScreenForm
                    .role_screen_config_id

                    ? "Edit Role Screen Mapping"

                    : "Add Role Screen Mapping"
                }

              </Modal.Title>

            </Modal.Header>


            <Modal.Body>

              <Row className="g-3">

                {/* COMPANY */}

                <Col md={6}>

                  <Form.Label className="ow-label">

                    Company

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    value={
                      roleScreenForm.company_id
                    }disabled={Boolean(roleScreenForm.role_screen_config_id)}
                    onChange={
                      event =>
                        setRoleScreenForm(
                          old => ({
                            ...old,

                            company_id:
                              event.target.value,

                            workstation_config_id:
                              "",

                            ui_template_config_id:
                              "",
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Company
                    </option>


                    {
                      companies.map(
                        item => (

                          <option
                            key={
                              companyId(item)
                            }
                            value={
                              companyId(item)
                            }
                          >
                            {
                              companyLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* ROLE */}

                <Col md={6}>

                  <Form.Label className="ow-label">

                    Role ID

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    type="number"
                    min="1"
                    value={
                      roleScreenForm.role_id
                    }readOnly={Boolean(roleScreenForm.role_screen_config_id)}
                    onChange={
                      event =>
                        setRoleScreenForm(
                          old => ({
                            ...old,

                            role_id:
                              event.target.value,
                          })
                        )
                    }
                  />


                  <Form.Text className="text-muted">
                    role_master.role_id is INTEGER.
                  </Form.Text>

                </Col>


                {/* WORKSTATION */}

                <Col md={6}>

                  <Form.Label className="ow-label">
                    Workstation
                  </Form.Label>


                  <Form.Select
                    value={
                      roleScreenForm
                        .workstation_config_id
                    }disabled={Boolean(roleScreenForm.role_screen_config_id)}
                    onChange={
                      event =>
                        setRoleScreenForm(
                          old => ({
                            ...old,

                            workstation_config_id:
                              event.target.value,
                          })
                        )
                    }
                  >

                    <option value="">
                      Global / All Eligible Workstations
                    </option>


                    {
                      workstations
                        .filter(
                          item =>
                            boolValue(
                              item.is_active
                            ) &&
                            (
                              !roleScreenForm.company_id ||
                              sameId(
                                item.company_id,
                                roleScreenForm.company_id
                              )
                            )
                        )
                        .map(
                          item => (

                            <option
                              key={
                                item.workstation_config_id
                              }
                              value={
                                item.workstation_config_id
                              }
                            >
                              {
                                item.workstation_code
                              }
                              {" - "}
                              {
                                item.workstation_name
                              }
                            </option>
                          )
                        )
                    }

                  </Form.Select>

                </Col>


                {/* TEMPLATE */}

                <Col md={6}>

                  <Form.Label className="ow-label">

                    UI Template

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    value={
                      roleScreenForm
                        .ui_template_config_id
                    }disabled={Boolean(roleScreenForm.role_screen_config_id)}
                    onChange={
                      event =>
                        setRoleScreenForm(
                          old => ({
                            ...old,

                            ui_template_config_id:
                              event.target.value,
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Template
                    </option>


                    {
                      uiTemplates
                        .filter(
                          item =>
                            boolValue(
                              item.is_active
                            ) &&
                            (
                              !roleScreenForm.company_id ||
                              sameId(
                                item.company_id,
                                roleScreenForm.company_id
                              )
                            )
                        )
                        .map(
                          item => (

                            <option
                              key={
                                item.ui_template_config_id
                              }
                              value={
                                item.ui_template_config_id
                              }
                            >
                              {
                                item.template_code
                              }
                              {" - "}
                              {
                                item.template_name
                              }
                            </option>
                          )
                        )
                    }

                  </Form.Select>

                </Col>


                {/* SCOPE */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Screen Scope

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    maxLength={30}
                    value={
                      roleScreenForm
                        .screen_scope
                    }
                    onChange={
                      event =>
                        setRoleScreenForm(
                          old => ({
                            ...old,

                            screen_scope:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* ORDER */}

                <Col md={4}>

                  <Form.Label className="ow-label">
                    Display Order
                  </Form.Label>


                  <Form.Control
                    required
                    type="number"
                    min="1"
                    max="32767"
                    value={
                      roleScreenForm
                        .display_order
                    }
                    onChange={
                      event =>
                        setRoleScreenForm(
                          old => ({
                            ...old,

                            display_order:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* VERSION */}

                <Col md={4}>

                  <Form.Label className="ow-label">
                    Version
                  </Form.Label>


                  <Form.Control
                    required
                    type="number"
                    min="1"
                    value={
                      roleScreenForm
                        .version_no
                    }
                    onChange={
                      event =>
                        setRoleScreenForm(
                          old => ({
                            ...old,

                            version_no:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                <Col
                  md={4}
                  className="d-flex align-items-end"
                >

                  <Form.Check
                    type="switch"
                    label="Active"
                    checked={
                      roleScreenForm
                        .is_active
                    }
                    onChange={
                      event =>
                        setRoleScreenForm(
                          old => ({
                            ...old,

                            is_active:
                              event.target.checked,
                          })
                        )
                    }
                  />

                </Col>

              </Row>

            </Modal.Body>


            <Modal.Footer>

              <Button
                variant="outline-secondary"
                onClick={() =>
                  setShowRoleScreen(false)
                }
              >
                Cancel
              </Button>


              <Button
                type="submit"
                className="ow-btn-primary"
                disabled={
                  roleScreenMutation.isPending
                }
              >
                {
                  roleScreenMutation.isPending
                    ? "Saving..."
                    : "Save Mapping"
                }
              </Button>

            </Modal.Footer>

          </Form>

        </Modal>


        {/* ==================================================
            EXECUTE OPERATOR ACTION MODAL
        =================================================== */}

        <Modal
          show={
            showExecute
          }
          onHide={() =>
            setShowExecute(false)
          }
          centered
          size="xl"
          className="ow-modal"
        >

          <Form
            onSubmit={
              submitExecute
            }
          >

            <Modal.Header closeButton>

              <Modal.Title>
                Record Operator Action
              </Modal.Title>

            </Modal.Header>


            <Modal.Body>

              <div className="ow-info-box mb-3">

                Operator actions are append-only runtime evidence.
                Existing operator action history cannot be edited
                or deleted.

              </div>


              <Row className="g-3">


                {/* COMPANY */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Company

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    value={
                      executeForm.company_id
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            company_id:
                              event.target.value,

                            plant_id: "",

                            line_id: "",

                            machine_id: "",

                            workstation_config_id:
                              "",

                            production_plan_id:
                              "",

                            plan_entry_id:
                              "",
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Company
                    </option>


                    {
                      companies.map(
                        item => (

                          <option
                            key={
                              companyId(item)
                            }
                            value={
                              companyId(item)
                            }
                          >
                            {
                              companyLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* PLANT */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Plant

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    disabled={
                      !executeForm
                        .company_id
                    }
                    value={
                      executeForm.plant_id
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            plant_id:
                              event.target.value,

                            line_id: "",

                            machine_id: "",

                            workstation_config_id:
                              "",
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Plant
                    </option>


                    {
                      executePlants.map(
                        item => (

                          <option
                            key={
                              plantId(item)
                            }
                            value={
                              plantId(item)
                            }
                          >
                            {
                              plantLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* LINE */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Line

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    disabled={
                      !executeForm
                        .plant_id
                    }
                    value={
                      executeForm.line_id
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            line_id:
                              event.target.value,

                            machine_id: "",

                            workstation_config_id:
                              "",
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Line
                    </option>


                    {
                      executeLines.map(
                        item => (

                          <option
                            key={
                              lineId(item)
                            }
                            value={
                              lineId(item)
                            }
                          >
                            {
                              lineLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* MACHINE */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Machine

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    disabled={
                      !executeForm
                        .line_id
                    }
                    value={
                      executeForm.machine_id
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            machine_id:
                              event.target.value,

                            workstation_config_id:
                              "",
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Machine
                    </option>


                    {
                      executeMachines.map(
                        item => (

                          <option
                            key={
                              machineId(item)
                            }
                            value={
                              machineId(item)
                            }
                          >
                            {
                              machineLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* WORKSTATION */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Workstation

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    disabled={
                      !executeForm
                        .machine_id
                    }
                    value={
                      executeForm
                        .workstation_config_id
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            workstation_config_id:
                              event.target.value,
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Workstation
                    </option>


                    {
                      executeWorkstations.map(
                        item => (

                          <option
                            key={
                              item.workstation_config_id
                            }
                            value={
                              item.workstation_config_id
                            }
                          >
                            {
                              item.workstation_code
                            }
                            {" - "}
                            {
                              item.workstation_name
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* SHIFT */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Shift

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  {
                    shifts.length >
                      0
                      ? (

                        <Form.Select
                          required
                          value={
                            executeForm.shift_id
                          }
                          onChange={
                            event =>
                              setExecuteForm(
                                old => ({
                                  ...old,

                                  shift_id:
                                    event.target.value,
                                })
                              )
                          }
                        >

                          <option value="">
                            Select Shift
                          </option>


                          {
                            shifts.map(
                              item => (

                                <option
                                  key={
                                    shiftId(item)
                                  }
                                  value={
                                    shiftId(item)
                                  }
                                >
                                  {
                                    shiftLabel(
                                      item
                                    )
                                  }
                                </option>
                              )
                            )
                          }

                        </Form.Select>
                      )
                      : (

                        <Form.Control
                          required
                          type="number"
                          min="1"
                          placeholder="Shift ID"
                          value={
                            executeForm.shift_id
                          }
                          onChange={
                            event =>
                              setExecuteForm(
                                old => ({
                                  ...old,

                                  shift_id:
                                    event.target.value,
                                })
                              )
                          }
                        />
                      )
                  }

                </Col>


                {/* USER */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    User ID

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    type="number"
                    min="1"
                    value={
                      executeForm.user_id
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            user_id:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* PLAN */}

                <Col md={4}>

                  <Form.Label className="ow-label">
                    Production Plan
                  </Form.Label>


                  <Form.Select
                    value={
                      executeForm
                        .production_plan_id
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            production_plan_id:
                              event.target.value,

                            plan_entry_id:
                              "",
                          })
                        )
                    }
                  >

                    <option value="">
                      No Production Plan
                    </option>


                    {
                      executePlans.map(
                        item => (

                          <option
                            key={
                              productionPlanId(
                                item
                              )
                            }
                            value={
                              productionPlanId(
                                item
                              )
                            }
                          >
                            {
                              productionPlanLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* PLAN ENTRY */}

                <Col md={4}>

                  <Form.Label className="ow-label">
                    Plan Entry
                  </Form.Label>


                  <Form.Select
                    disabled={
                      !executeForm
                        .production_plan_id ||
                      planEntriesQuery
                        .isLoading
                    }
                    value={
                      executeForm.plan_entry_id
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            plan_entry_id:
                              event.target.value,
                          })
                        )
                    }
                  >

                    <option value="">

                      {
                        !executeForm
                          .production_plan_id

                          ? "Select Production Plan First"

                          : planEntriesQuery
                            .isLoading

                            ? "Loading Plan Entries..."

                            : "No Plan Entry"
                      }

                    </option>


                    {
                      planEntries.map(
                        item => (

                          <option
                            key={
                              planEntryId(
                                item
                              )
                            }
                            value={
                              planEntryId(
                                item
                              )
                            }
                          >
                            {
                              planEntryLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                {/* UNIT */}

                <Col md={4}>

                  <Form.Label className="ow-label">
                    Unit ID
                  </Form.Label>


                  <Form.Control
                    placeholder="Optional UUID"
                    value={
                      executeForm.unit_id
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            unit_id:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* ACTION */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Action Code

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    maxLength={50}
                    value={
                      executeForm.action_code
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            action_code:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* RESULT */}

                <Col md={4}>

                  <Form.Label className="ow-label">

                    Result Status

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    maxLength={20}
                    value={
                      executeForm
                        .result_status
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            result_status:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* SOURCE */}

                <Col md={4}>

                  <Form.Label className="ow-label">
                    Source System
                  </Form.Label>


                  <Form.Control
                    maxLength={50}
                    value={
                      executeForm
                        .source_system
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            source_system:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* CORRELATION */}

                <Col md={6}>

                  <Form.Label className="ow-label">
                    Correlation ID
                  </Form.Label>


                  <Form.Control
                    placeholder="Optional UUID"
                    value={
                      executeForm
                        .correlation_id
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            correlation_id:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* REASON */}

                <Col md={6}>

                  <Form.Label className="ow-label">
                    Reason
                  </Form.Label>


                  <Form.Control
                    maxLength={500}
                    value={
                      executeForm.reason
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            reason:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                {/* PAYLOAD */}

                <Col md={12}>

                  <Form.Label className="ow-label">
                    Payload JSON
                  </Form.Label>


                  <Form.Control
                    as="textarea"
                    rows={5}
                    className="ow-json"
                    value={
                      executeForm.payload
                    }
                    onChange={
                      event =>
                        setExecuteForm(
                          old => ({
                            ...old,

                            payload:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>

              </Row>

            </Modal.Body>


            <Modal.Footer>

              <Button
                variant="outline-secondary"
                onClick={() =>
                  setShowExecute(false)
                }
              >
                Cancel
              </Button>


              <Button
                type="submit"
                className="ow-btn-primary"
                disabled={
                  executeMutation.isPending ||
                  planEntriesQuery.isLoading
                }
              >
                {
                  executeMutation.isPending
                    ? "Recording..."
                    : "Record Action"
                }
              </Button>

            </Modal.Footer>

          </Form>

        </Modal>


        {/* ==================================================
            SCREEN RESOLUTION MODAL
        =================================================== */}

        <Modal
          show={
            showScreenResolve
          }
          onHide={() =>
            setShowScreenResolve(false)
          }
          centered
          size="lg"
          className="ow-modal"
        >

          <Form
            onSubmit={
              resolveScreens
            }
          >

            <Modal.Header closeButton>

              <Modal.Title>
                Test Role Screen Resolution
              </Modal.Title>

            </Modal.Header>


            <Modal.Body>

              <Row className="g-3">

                <Col md={6}>

                  <Form.Label className="ow-label">

                    Company

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Select
                    required
                    value={
                      screenResolution
                        .company_id
                    }
                    onChange={
                      event =>
                        setScreenResolution(
                          old => ({
                            ...old,

                            company_id:
                              event.target.value,

                            workstation_config_id:
                              "",
                          })
                        )
                    }
                  >

                    <option value="">
                      Select Company
                    </option>


                    {
                      companies.map(
                        item => (

                          <option
                            key={
                              companyId(item)
                            }
                            value={
                              companyId(item)
                            }
                          >
                            {
                              companyLabel(
                                item
                              )
                            }
                          </option>
                        )
                      )
                    }

                  </Form.Select>

                </Col>


                <Col md={6}>

                  <Form.Label className="ow-label">

                    Role ID

                    <span className="ow-required">
                      {" "}*
                    </span>

                  </Form.Label>


                  <Form.Control
                    required
                    type="number"
                    min="1"
                    value={
                      screenResolution.role_id
                    }
                    onChange={
                      event =>
                        setScreenResolution(
                          old => ({
                            ...old,

                            role_id:
                              event.target.value,
                          })
                        )
                    }
                  />

                </Col>


                <Col md={12}>

                  <Form.Label className="ow-label">
                    Workstation
                  </Form.Label>


                  <Form.Select
                    value={
                      screenResolution
                        .workstation_config_id
                    }
                    onChange={
                      event =>
                        setScreenResolution(
                          old => ({
                            ...old,

                            workstation_config_id:
                              event.target.value,
                          })
                        )
                    }
                  >

                    <option value="">
                      No Specific Workstation
                    </option>


                    {
                      workstations
                        .filter(
                          item =>
                            boolValue(
                              item.is_active
                            ) &&
                            (
                              !screenResolution.company_id ||
                              sameId(
                                item.company_id,
                                screenResolution.company_id
                              )
                            )
                        )
                        .map(
                          item => (

                            <option
                              key={
                                item.workstation_config_id
                              }
                              value={
                                item.workstation_config_id
                              }
                            >
                              {
                                item.workstation_code
                              }
                              {" - "}
                              {
                                item.workstation_name
                              }
                            </option>
                          )
                        )
                    }

                  </Form.Select>

                </Col>

              </Row>


              {
                resolvedScreens.length >
                  0 && (

                  <div className="ow-table-wrap mt-4">

                    <Table
                      className="ow-table"
                      hover
                    >

                      <thead>

                        <tr>

                          <th>
                            Order
                          </th>

                          <th>
                            Workstation
                          </th>

                          <th>
                            Template
                          </th>

                          <th>
                            Type
                          </th>

                          <th>
                            Scope
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          resolvedScreens.map(
                            row => (

                              <tr
                                key={
                                  row.role_screen_config_id
                                }
                              >

                                <td>
                                  {
                                    safeText(
                                      row.display_order
                                    )
                                  }
                                </td>

                                <td>
                                  {
                                    row.workstation_code ||
                                    "GLOBAL"
                                  }
                                </td>

                                <td>
                                  {
                                    safeText(
                                      row.template_code
                                    )
                                  }
                                </td>

                                <td>
                                  {
                                    safeText(
                                      row.template_type
                                    )
                                  }
                                </td>

                                <td>
                                  {
                                    safeText(
                                      row.screen_scope
                                    )
                                  }
                                </td>

                              </tr>
                            )
                          )
                        }

                      </tbody>

                    </Table>

                  </div>
                )
              }

            </Modal.Body>


            <Modal.Footer>

              <Button
                variant="outline-secondary"
                onClick={() =>
                  setShowScreenResolve(false)
                }
              >
                Close
              </Button>


              <Button
                type="submit"
                className="ow-btn-primary"
              >
                Resolve Screens
              </Button>

            </Modal.Footer>

          </Form>

        </Modal>

      </div>
</>
    );
  };


// ============================================================
// RUNTIME FILTERS COMPONENT
// ============================================================

const RuntimeFilters =
  ({
    filters,
    setFilters,
    companies,
    workstations,
    shifts,
    onApply,
    onClear,
  }) => (

    <div className="ow-filter-panel">

      <Row className="g-2">

        <Col md={3}>

          <Form.Label className="ow-label">
            Company
          </Form.Label>


          <Form.Select
            value={
              filters.company_id
            }
            onChange={
              event =>
                setFilters(
                  old => ({
                    ...old,

                    company_id:
                      event.target.value,
                  })
                )
            }
          >

            <option value="">
              All Companies
            </option>


            {
              companies.map(
                item => (

                  <option
                    key={
                      companyId(item)
                    }
                    value={
                      companyId(item)
                    }
                  >
                    {
                      companyLabel(
                        item
                      )
                    }
                  </option>
                )
              )
            }

          </Form.Select>

        </Col>


        <Col md={3}>

          <Form.Label className="ow-label">
            Workstation
          </Form.Label>


          <Form.Select
            value={
              filters
                .workstation_config_id
            }
            onChange={
              event =>
                setFilters(
                  old => ({
                    ...old,

                    workstation_config_id:
                      event.target.value,
                  })
                )
            }
          >

            <option value="">
              All Workstations
            </option>


            {
              workstations.map(
                row => (

                  <option
                    key={
                      row.workstation_config_id
                    }
                    value={
                      row.workstation_config_id
                    }
                  >
                    {
                      row.workstation_code
                    }
                    {" - "}
                    {
                      row.workstation_name
                    }
                  </option>
                )
              )
            }

          </Form.Select>

        </Col>


        <Col md={2}>

          <Form.Label className="ow-label">
            Shift
          </Form.Label>


          {
            shifts.length >
              0
              ? (

                <Form.Select
                  value={
                    filters.shift_id
                  }
                  onChange={
                    event =>
                      setFilters(
                        old => ({
                          ...old,

                          shift_id:
                            event.target.value,
                        })
                      )
                  }
                >

                  <option value="">
                    All Shifts
                  </option>


                  {
                    shifts.map(
                      item => (

                        <option
                          key={
                            shiftId(item)
                          }
                          value={
                            shiftId(item)
                          }
                        >
                          {
                            shiftLabel(
                              item
                            )
                          }
                        </option>
                      )
                    )
                  }

                </Form.Select>
              )
              : (

                <Form.Control
                  type="number"
                  min="1"
                  placeholder="Shift ID"
                  value={
                    filters.shift_id
                  }
                  onChange={
                    event =>
                      setFilters(
                        old => ({
                          ...old,

                          shift_id:
                            event.target.value,
                        })
                      )
                  }
                />
              )
          }

        </Col>


        <Col md={2}>

          <Form.Label className="ow-label">
            User ID
          </Form.Label>


          <Form.Control
            type="number"
            min="1"
            value={
              filters.user_id
            }
            onChange={
              event =>
                setFilters(
                  old => ({
                    ...old,

                    user_id:
                      event.target.value,
                  })
                )
            }
          />

        </Col>


        <Col md={2}>

          <Form.Label className="ow-label">
            Action
          </Form.Label>


          <Form.Control
            value={
              filters.action_code
            }
            onChange={
              event =>
                setFilters(
                  old => ({
                    ...old,

                    action_code:
                      event.target.value,
                  })
                )
            }
          />

        </Col>


        <Col md={3}>

          <Form.Label className="ow-label">
            Result Status
          </Form.Label>


          <Form.Control
            value={
              filters.result_status
            }
            onChange={
              event =>
                setFilters(
                  old => ({
                    ...old,

                    result_status:
                      event.target.value,
                  })
                )
            }
          />

        </Col>


        <Col md={3}>

          <Form.Label className="ow-label">
            Source System
          </Form.Label>


          <Form.Control
            value={
              filters.source_system
            }
            onChange={
              event =>
                setFilters(
                  old => ({
                    ...old,

                    source_system:
                      event.target.value,
                  })
                )
            }
          />

        </Col>


        <Col md={3}>

          <Form.Label className="ow-label">
            From
          </Form.Label>


          <Form.Control
            type="datetime-local"
            value={
              filters.from_timestamp
            }
            onChange={
              event =>
                setFilters(
                  old => ({
                    ...old,

                    from_timestamp:
                      event.target.value,
                  })
                )
            }
          />

        </Col>


        <Col md={3}>

          <Form.Label className="ow-label">
            To
          </Form.Label>


          <Form.Control
            type="datetime-local"
            value={
              filters.to_timestamp
            }
            onChange={
              event =>
                setFilters(
                  old => ({
                    ...old,

                    to_timestamp:
                      event.target.value,
                  })
                )
            }
          />

        </Col>


        <Col
          md={12}
          className="d-flex justify-content-end gap-2 mt-3"
        >

          <Button
            variant="outline-secondary"
            onClick={
              onClear
            }
          >
            Clear
          </Button>


          <Button
            className="ow-btn-primary"
            onClick={
              onApply
            }
          >
            Apply Filters
          </Button>

        </Col>

      </Row>

    </div>
  );


// ============================================================
// OPERATOR EVENT TABLE
// ============================================================

const OperatorEventTable =
  ({
    rows,
    workstations,
    loading,
  }) => {

    const workstationMap =
      new Map(
        workstations.map(
          row => [
            String(
              row.workstation_config_id
            ),
            row,
          ]
        )
      );


    return (

      <div className="ow-table-wrap">

        <Table
          className="ow-table"
          hover
        >

          <thead>

            <tr>

              <th>
                Date & Time
              </th>

              <th>
                Workstation
              </th>

              <th>
                Machine
              </th>

              <th>
                Shift
              </th>

              <th>
                User
              </th>

              <th>
                Action
              </th>

              <th>
                Result
              </th>

              <th>
                Plan Entry
              </th>

              <th>
                Unit
              </th>

              <th>
                Source
              </th>

              <th>
                Reason
              </th>

            </tr>

          </thead>


          <tbody>

            {
              loading
                ? (

                  <tr>

                    <td
                      colSpan={11}
                      className="ow-empty"
                    >
                      <Spinner
                        size="sm"
                        animation="border"
                        className="me-2"
                      />

                      Loading operator events...
                    </td>

                  </tr>
                )
                : rows.length ===
                    0
                  ? (

                    <tr>

                      <td
                        colSpan={11}
                        className="ow-empty"
                      >
                        No operator action events found.
                      </td>

                    </tr>
                  )
                  : (

                    rows.map(
                      row => {

                        const workstation =
                          workstationMap.get(
                            String(
                              row.workstation_config_id
                            )
                          );


                        return (

                          <tr
                            key={
                              row.operator_action_event_id
                            }
                          >

                            <td>
                              {
                                displayDateTime(
                                  row.event_ts
                                )
                              }
                            </td>

                            <td>
                              {
                                workstation
                                  ? workstation.workstation_code
                                  : safeText(
                                      row.workstation_config_id
                                    )
                              }
                            </td>

                            <td>
                              {
                                safeText(
                                  row.machine_id
                                )
                              }
                            </td>

                            <td>
                              {
                                safeText(
                                  row.shift_id
                                )
                              }
                            </td>

                            <td>
                              {
                                safeText(
                                  row.user_id
                                )
                              }
                            </td>

                            <td>

                              <Badge bg="primary">
                                {
                                  safeText(
                                    row.action_code
                                  )
                                }
                              </Badge>

                            </td>

                            <td>

                              <Badge
                                bg={
                                  statusVariant(
                                    row.result_status
                                  )
                                }
                              >
                                {
                                  safeText(
                                    row.result_status
                                  )
                                }
                              </Badge>

                            </td>

                            <td>
                              {
                                row.plan_entry_id
                                  ? `${String(
                                      row.plan_entry_id
                                    ).slice(
                                      0,
                                      8
                                    )}...`
                                  : "-"
                              }
                            </td>

                            <td>
                              {
                                row.unit_id
                                  ? `${String(
                                      row.unit_id
                                    ).slice(
                                      0,
                                      8
                                    )}...`
                                  : "-"
                              }
                            </td>

                            <td>
                              {
                                safeText(
                                  row.source_system
                                )
                              }
                            </td>

                            <td>
                              {
                                safeText(
                                  row.reason
                                )
                              }
                            </td>

                          </tr>
                        );
                      }
                    )
                  )
            }

          </tbody>

        </Table>

      </div>
    );
  };


// ============================================================
// REPORT COUNT BADGES
// ============================================================

const CountBadges =
  ({
    values,
  }) => {

    const entries =
      Object.entries(
        values ||
        {}
      );


    if (
      entries.length ===
      0
    ) {

      return (

        <span className="text-muted">
          No data
        </span>
      );
    }


    return (

      <div className="d-flex flex-wrap gap-2">

        {
          entries.map(
            (
              [
                key,
                value,
              ]
            ) => (

              <Badge
                bg="secondary"
                className="ow-count-badge"
                key={
                  key
                }
              >
                {key}: {value}
              </Badge>
            )
          )
        }

      </div>
    );
  };


// ============================================================
// EXPORT
// ============================================================

export default OperatorWorkstation;