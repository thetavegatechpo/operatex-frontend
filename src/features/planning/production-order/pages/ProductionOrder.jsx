import useLiveRefresh from '../../../../shared/operations/useLiveRefresh.js';
import LiveSync from '../../../../shared/operations/LiveSync.jsx';
import OperationsLaunch from '../../../../shared/operations/OperationsLaunch.jsx';
import PlanningBoard from '../../../../shared/operations/PlanningBoard.jsx';

// src/pages/ProductionOrder/ProductionOrder.jsx

import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Badge,
    Button,
    Card,
    Col,
    Form,
    Modal,
    Row,
    Spinner,
    Toast
} from "react-bootstrap";

import {
    Plus,
    ListUl,
    PlayFill,
    ClockHistory,
    PeopleFill
} from "react-bootstrap-icons";

import {
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";

import SearchToolbar
    from "../../../../shared/components/SearchToolbar.jsx";

import DataTable
    from "../../../../shared/components/DataTable.jsx";

import StatusBadge
    from "../../../../shared/components/StatusBadge.jsx";

import ActionButtons
    from "../../../../shared/components/ActionButtons.jsx";

import productionOrderService
    from "../api/productionOrder.service.js";

import companyService
    from "../../../enterprise-setup/company-master/api/company.service.js";

import partService
    from "../../../master-data/part-master/api/part.service.js";


// ==========================================================
// QUERY KEYS
// ==========================================================

const QUERY_KEYS = {

    orders: [
        "planning",
        "production-orders"
    ],

    customers: [
        "planning",
        "production-order-customers"
    ],

    companies: [
        "master",
        "companies"
    ],

    parts: [
        "master",
        "parts"
    ],

    order: orderId => [
        "planning",
        "production-order",
        orderId
    ],

    items: orderId => [
        "planning",
        "production-order",
        orderId,
        "items"
    ]
};


// ==========================================================
// PAGE STYLE
// ==========================================================

const PAGE_STYLE = `

.production-order-page,
.production-order-page *,
.po-production-modal,
.po-production-modal * {
    font-family:
        "Montserrat",
        "Segoe UI",
        Arial,
        sans-serif;
}


/* ======================================================
   HEADER
====================================================== */

.production-order-page .po-header-card {
    position: relative;

    border: 0 !important;

    border-radius: 12px;

    overflow: hidden;

    background: #ffffff;

    box-shadow:
        0 5px 18px
        rgba(20, 36, 80, 0.07);
}


.production-order-page .po-header-card::before {
    content: "";

    position: absolute;

    left: 0;
    top: 0;
    bottom: 0;

    width: 4px;

    background:
        linear-gradient(
            180deg,
            #7057ff,
            #22c7d6
        );
}


.production-order-page .po-header-card .card-body {
    padding:
        22px
        24px;
}


.production-order-page .po-title {
    margin: 0;

    color: #151d35;

    font-size: 26px;

    font-weight: 700;
}


.production-order-page .po-breadcrumb {
    margin-top: 6px;

    color: #7a8094;

    font-size: 12px;

    font-weight: 500;
}


.production-order-page .po-header-buttons {
    display: flex;

    align-items: center;

    gap: 10px;

    flex-wrap: wrap;

    justify-content: flex-end;
}


.production-order-page .po-header-buttons .btn {
    min-height: 39px;

    border-radius: 7px;

    padding:
        7px
        15px;

    font-size: 12px;

    font-weight: 600;
}


.production-order-page .btn-primary {
    background: #314965;

    border-color: #314965;
}


.production-order-page .btn-primary:hover {
    background: #5747e7;

    border-color: #5747e7;
}


.production-order-page .btn-outline-primary {
    color: #314965;

    border-color: #7869ff;
}


.production-order-page .btn-outline-primary:hover {
    color: #ffffff;

    background: #314965;

    border-color: #314965;
}


/* ======================================================
   TOOLBAR
====================================================== */

.production-order-page .po-toolbar-wrapper {
    position: relative;

    border-radius: 12px;

    overflow: hidden;
}


.production-order-page .po-toolbar-wrapper::before {
    content: "";

    position: absolute;

    z-index: 2;

    left: 0;
    top: 0;
    bottom: 0;

    width: 4px;

    background:
        linear-gradient(
            180deg,
            #7057ff,
            #22c7d6
        );
}


/* ======================================================
   TABLE
====================================================== */

.production-order-page .po-table-shell {
    margin-top: 22px;

    border-radius: 12px;

    overflow: hidden;

    box-shadow:
        0 4px 15px
        rgba(26, 35, 70, 0.06);
}


.production-order-page table {
    margin-bottom: 0 !important;

    font-size: 12px;
}


.production-order-page table thead th {
    padding:
        13px
        11px !important;

    vertical-align: middle;

    white-space: nowrap;

    color: #ffffff !important;

    background: #242d4d !important;

    border-color: #242d4d !important;

    font-size: 11px;

    font-weight: 700;

    text-transform: uppercase;
}


.production-order-page table tbody td {
    padding:
        11px
        11px !important;

    vertical-align: middle;

    color: #20263a;

    border-color: #edf0f4;

    font-size: 12px;
}


.production-order-page table tbody tr:hover td {
    background: #fbfbff;
}


.production-order-page .po-order-no {
    color: #3e48a8;

    font-weight: 600;

    white-space: nowrap;
}


/* ======================================================
   MODAL
====================================================== */

.po-production-modal .modal-content {
    border: 0;

    border-radius: 13px;

    overflow: hidden;

    box-shadow:
        0 15px 48px
        rgba(20, 29, 60, 0.20);
}


.po-production-modal .modal-header {
    padding:
        17px
        20px;

    border-bottom:
        1px solid #e9ecf2;
}


.po-production-modal .modal-title {
    color: #1e253b;

    font-size: 17px;

    font-weight: 700;
}


.po-production-modal .modal-body {
    max-height: 72vh;

    overflow-y: auto;

    padding:
        20px;
}


.po-production-modal .modal-footer {
    padding:
        13px
        20px;

    border-top:
        1px solid #e9ecf2;
}


.po-production-modal .form-label {
    margin-bottom: 6px;

    color: #4a5064;

    font-size: 11px;

    font-weight: 600;
}


.po-production-modal .form-control,
.po-production-modal .form-select {
    min-height: 39px;

    border-radius: 7px;

    border-color: #dce0e8;

    color: #252b3d;

    font-size: 12px;
}


.po-production-modal .form-control:focus,
.po-production-modal .form-select:focus {
    border-color: #7869ff;

    box-shadow:
        0 0 0 0.15rem
        rgba(101, 85, 245, 0.10);
}


.po-production-modal textarea.form-control {
    min-height: auto;
}


.po-production-modal .po-section-title {
    margin-bottom: 13px;

    color: #252d4c;

    font-size: 13px;

    font-weight: 700;
}


.po-production-modal .po-divider {
    height: 1px;

    margin:
        7px
        0
        18px;

    background: #edf0f5;
}


.po-production-modal .po-item-card {
    border:
        1px solid #e5e8ef !important;

    border-radius: 9px;

    background: #fbfcff;
}


.po-production-modal .po-item-card .card-body {
    padding: 14px;
}


.po-production-modal .po-info {
    padding:
        11px
        13px;

    border:
        1px solid #dce8ff;

    border-radius: 7px;

    color: #445574;

    background: #f4f8ff;

    font-size: 11px;
}


.po-production-modal .po-runtime-banner {
    margin-bottom: 15px;

    padding:
        11px
        13px;

    border:
        1px solid #f4dea7;

    border-radius: 8px;

    background: #fff9e9;

    color: #68541d;

    font-size: 11px;

    font-weight: 500;
}


.production-order-page .po-toast {
    min-width: 320px;

    border: 0;

    font-size: 12px;
}


@media (max-width: 768px) {

    .production-order-page .po-header-buttons {
        margin-top: 12px;

        justify-content: flex-start;
    }

}
`;


// ==========================================================
// HELPERS
// ==========================================================

const sameId = (left, right) =>
    String(left ?? "") ===
    String(right ?? "");


const responseRows = response => {

    if (Array.isArray(response)) {
        return response;
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
            response?.data
        )
    ) {
        return response.data;
    }

    return [];
};


const responseData = response =>
    response?.data?.data ??
    response?.data ??
    null;


const getErrorMessage = (
    error,
    fallback
) => {

    const response =
        error?.response?.data;

    if (
        Array.isArray(
            response?.errors
        ) &&
        response.errors.length > 0
    ) {
        return `${
            response.message ||
            "Validation failed."
        } ${response.errors.join(", ")}`;
    }

    return (
        response?.message ||
        error?.message ||
        fallback
    );
};


// ==========================================================
// DATE
// ==========================================================

const localToday = () => {

    const now =
        new Date();

    const local =
        new Date(
            now.getTime() -
            now.getTimezoneOffset() *
            60000
        );

    return local
        .toISOString()
        .slice(0, 10);
};


const toDateInput = value => {

    if (!value) {
        return "";
    }

    const text =
        String(value);

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {
        return text;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return text.slice(
            0,
            10
        );
    }

    const local =
        new Date(
            date.getTime() -
            date.getTimezoneOffset() *
            60000
        );

    return local
        .toISOString()
        .slice(0, 10);
};


const formatDate = value => {

    if (!value) {
        return "-";
    }

    const text =
        String(value);

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {

        const [
            year,
            month,
            day
        ] = text
            .split("-")
            .map(Number);

        return new Date(
            year,
            month - 1,
            day
        ).toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return text;
    }

    return date
        .toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
};


// ==========================================================
// CSV
// ==========================================================

const csvEscape = value => {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return `"${String(value).replace(
        /"/g,
        "\"\""
    )}"`;
};


// ==========================================================
// EMPTY FORMS
// ==========================================================

const createEmptyOrderItem = (
    lineNo = 1
) => ({

    line_no:
        lineNo,

    part_id:
        "",

    planned_qty:
        "",

    due_date:
        "",

    priority_config_id:
        null,

    status:
        "OPEN",

    external_item_ref:
        ""
});


const createEmptyOrder = () => ({

    company_id:
        "",

    customer_id:
        "",

    order_no:
        "",

    revision_no:
        1,

    supersedes_order_id:
        "",

    order_type:
        "CUSTOMER",

    order_date:
        localToday(),

    due_date:
        "",

    priority_config_id:
        null,

    status:
        "CREATED",

    source_system:
        "MANUAL",

    external_order_ref:
        "",

    items: [
        createEmptyOrderItem(1)
    ]
});


const createEmptyCustomer = () => ({

    company_id:
        "",

    customer_code:
        "",

    customer_name:
        "",

    customer_type:
        "EXTERNAL",

    external_customer_ref:
        "",

    status:
        "ACTIVE",

    version_no:
        1
});


const createEmptySingleItem = () => ({

    line_no:
        1,

    part_id:
        "",

    planned_qty:
        "",

    due_date:
        "",

    priority_config_id:
        null,

    status:
        "OPEN",

    external_item_ref:
        ""
});


const createEmptyExecute = () => ({

    order_id:
        "",

    new_status:
        "",

    reason:
        "",

    source_system:
        "MES",

    correlation_id:
        "",

    idempotency_key:
        ""
});


// ==========================================================
// COMPONENT
// ==========================================================

function ProductionOrder() {

    const queryClient =
        useQueryClient();


    // ======================================================
    // FILTER
    // ======================================================

    const [
        searchText,
        setSearchText
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter
    ] = useState(
        "ALL"
    );


    // ======================================================
    // TOAST
    // ======================================================

    const [
        toast,
        setToast
    ] = useState({

        show: false,

        variant:
            "success",

        message:
            ""
    });


    const showToast = (
        message,
        variant = "success"
    ) => {

        setToast({

            show:
                true,

            variant,

            message
        });
    };


    // ======================================================
    // ORDER
    // ======================================================

    const [
        showOrderForm,
        setShowOrderForm
    ] = useState(false);


    const [
        editOrderId,
        setEditOrderId
    ] = useState(null);


    const [
        orderForm,
        setOrderForm
    ] = useState(
        createEmptyOrder()
    );


    // ======================================================
    // CUSTOMER
    // ======================================================

    const [
        showCustomerList,
        setShowCustomerList
    ] = useState(false);


    const [
        showCustomerForm,
        setShowCustomerForm
    ] = useState(false);


    const [
        customerEditId,
        setCustomerEditId
    ] = useState(null);


    const [
        customerForm,
        setCustomerForm
    ] = useState(
        createEmptyCustomer()
    );


    // ======================================================
    // ORDER ITEMS
    // ======================================================

    const [
        selectedOrder,
        setSelectedOrder
    ] = useState(null);


    const [
        showItemList,
        setShowItemList
    ] = useState(false);


    const [
        showItemForm,
        setShowItemForm
    ] = useState(false);


    const [
        itemEditId,
        setItemEditId
    ] = useState(null);


    const [
        itemForm,
        setItemForm
    ] = useState(
        createEmptySingleItem()
    );


    // ======================================================
    // EXECUTE
    // ======================================================

    const [
        showExecute,
        setShowExecute
    ] = useState(false);


    const [
        executeForm,
        setExecuteForm
    ] = useState(
        createEmptyExecute()
    );


    // ======================================================
    // RUNTIME
    // ======================================================

    const [
        showRuntime,
        setShowRuntime
    ] = useState(false);


    // ======================================================
    // QUERIES
    // ======================================================

    const ordersQuery =
        useQuery({

            queryKey:
                QUERY_KEYS.orders,

            queryFn:
                async () => {

                    const response =
                        await productionOrderService
                            .getOrders();

                    return responseRows(
                        response
                    );
                }
        });


    const customersQuery =
        useQuery({

            queryKey:
                QUERY_KEYS.customers,

            queryFn:
                async () => {

                    const response =
                        await productionOrderService
                            .getCustomers();

                    return responseRows(
                        response
                    );
                }
        });


    const companiesQuery =
        useQuery({

            queryKey:
                QUERY_KEYS.companies,

            queryFn:
                async () => {

                    const response =
                        await companyService
                            .getMaster();

                    return responseRows(
                        response
                    );
                },

            staleTime:
                5 * 60 * 1000
        });


    const partsQuery =
        useQuery({

            queryKey:
                QUERY_KEYS.parts,

            queryFn:
                async () => {

                    const response =
                        await partService
                            .getMaster();

                    return responseRows(
                        response
                    );
                },

            staleTime:
                5 * 60 * 1000
        });


    const itemsQuery =
        useQuery({

            queryKey:
                QUERY_KEYS.items(
                    selectedOrder
                        ?.order_id ||
                    "none"
                ),

            queryFn:
                async () => {

                    const response =
                        await productionOrderService
                            .getItems(
                                selectedOrder.order_id
                            );

                    return responseRows(
                        response
                    );
                },

            enabled:
                Boolean(
                    selectedOrder?.order_id
                )
        });


    const orders =
        ordersQuery.data ||
        [];


    const customers =
        customersQuery.data ||
        [];


    const companies =
        companiesQuery.data ||
        [];


    const parts =
        partsQuery.data ||
        [];


    const orderItems =
        itemsQuery.data ||
        [];


    // ======================================================
    // LOG QUERY ERRORS
    // ======================================================

    useEffect(() => {

        if (
            ordersQuery.error
        ) {

            console.error(
                "[ProductionOrder] Orders failed:",
                ordersQuery.error
            );
        }

    }, [
        ordersQuery.error
    ]);


    useEffect(() => {

        if (
            customersQuery.error
        ) {

            console.error(
                "[ProductionOrder] Customers failed:",
                customersQuery.error
            );
        }

    }, [
        customersQuery.error
    ]);


    useEffect(() => {

        if (
            companiesQuery.error
        ) {

            console.error(
                "[ProductionOrder] Company lookup failed:",
                companiesQuery.error
            );
        }

    }, [
        companiesQuery.error
    ]);


    useEffect(() => {

        if (
            partsQuery.error
        ) {

            console.error(
                "[ProductionOrder] Part lookup failed:",
                partsQuery.error
            );
        }

    }, [
        partsQuery.error
    ]);


    // ======================================================
    // INVALIDATION
    // ======================================================

    const refreshOrders = () =>
        queryClient
            .invalidateQueries({

                queryKey:
                    QUERY_KEYS.orders
            });


    const refreshCustomers = () =>
        queryClient
            .invalidateQueries({

                queryKey:
                    QUERY_KEYS.customers
            });


    const refreshItems = orderId =>
        queryClient
            .invalidateQueries({

                queryKey:
                    QUERY_KEYS.items(
                        orderId
                    )
            });


    // ======================================================
    // ORDER MUTATIONS
    // ======================================================

    const createOrderMutation =
        useMutation({

            mutationFn:
                payload =>
                    productionOrderService
                        .createOrder(
                            payload
                        ),

            onSuccess:
                async () => {

                    await refreshOrders();

                    showToast(
                        "Production Order created successfully."
                    );
                },

            onError:
                error => {

                    showToast(
                        getErrorMessage(
                            error,
                            "Unable to create Production Order."
                        ),
                        "danger"
                    );
                }
        });


    const updateOrderMutation =
        useMutation({

            mutationFn:
                ({
                    orderId,
                    payload
                }) =>
                    productionOrderService
                        .updateOrder(
                            orderId,
                            payload
                        ),

            onSuccess:
                async (
                    _,
                    variables
                ) => {

                    await refreshOrders();

                    await queryClient
                        .invalidateQueries({

                            queryKey:
                                QUERY_KEYS.order(
                                    variables.orderId
                                )
                        });

                    showToast(
                        "Production Order updated successfully."
                    );
                },

            onError:
                error => {

                    showToast(
                        getErrorMessage(
                            error,
                            "Unable to update Production Order."
                        ),
                        "danger"
                    );
                }
        });


    const deleteOrderMutation =
        useMutation({

            mutationFn:
                orderId =>
                    productionOrderService
                        .deleteOrder(
                            orderId
                        ),

            onSuccess:
                async () => {

                    await refreshOrders();

                    showToast(
                        "Production Order deleted successfully."
                    );
                },

            onError:
                error => {

                    showToast(
                        getErrorMessage(
                            error,
                            "Unable to delete Production Order."
                        ),
                        "danger"
                    );
                }
        });


    // ======================================================
    // CUSTOMER MUTATIONS
    // ======================================================

    const createCustomerMutation =
        useMutation({

            mutationFn:
                payload =>
                    productionOrderService
                        .createCustomer(
                            payload
                        ),

            onSuccess:
                async () => {

                    await refreshCustomers();

                    showToast(
                        "Customer created successfully."
                    );
                },

            onError:
                error => {

                    showToast(
                        getErrorMessage(
                            error,
                            "Unable to create customer."
                        ),
                        "danger"
                    );
                }
        });


    const updateCustomerMutation =
        useMutation({

            mutationFn:
                ({
                    customerId,
                    payload
                }) =>
                    productionOrderService
                        .updateCustomer(
                            customerId,
                            payload
                        ),

            onSuccess:
                async () => {

                    await refreshCustomers();

                    showToast(
                        "Customer updated successfully."
                    );
                },

            onError:
                error => {

                    showToast(
                        getErrorMessage(
                            error,
                            "Unable to update customer."
                        ),
                        "danger"
                    );
                }
        });


    const deleteCustomerMutation =
        useMutation({

            mutationFn:
                customerId =>
                    productionOrderService
                        .deleteCustomer(
                            customerId
                        ),

            onSuccess:
                async () => {

                    await refreshCustomers();

                    showToast(
                        "Customer deleted successfully."
                    );
                },

            onError:
                error => {

                    showToast(
                        getErrorMessage(
                            error,
                            "Unable to delete customer."
                        ),
                        "danger"
                    );
                }
        });


    // ======================================================
    // ITEM MUTATIONS
    // ======================================================

    const createItemMutation =
        useMutation({

            mutationFn:
                ({
                    orderId,
                    payload
                }) =>
                    productionOrderService
                        .createItem(
                            orderId,
                            payload
                        ),

            onSuccess:
                async (
                    _,
                    variables
                ) => {

                    await refreshItems(
                        variables.orderId
                    );

                    showToast(
                        "Order Item created successfully."
                    );
                },

            onError:
                error => {

                    showToast(
                        getErrorMessage(
                            error,
                            "Unable to create Order Item."
                        ),
                        "danger"
                    );
                }
        });


    const updateItemMutation =
        useMutation({

            mutationFn:
                ({
                    orderItemId,
                    orderId,
                    payload
                }) =>
                    productionOrderService
                        .updateItem(
                            orderItemId,
                            payload
                        ),

            onSuccess:
                async (
                    _,
                    variables
                ) => {

                    await refreshItems(
                        variables.orderId
                    );

                    showToast(
                        "Order Item updated successfully."
                    );
                },

            onError:
                error => {

                    showToast(
                        getErrorMessage(
                            error,
                            "Unable to update Order Item."
                        ),
                        "danger"
                    );
                }
        });


    const deleteItemMutation =
        useMutation({

            mutationFn:
                ({
                    orderItemId
                }) =>
                    productionOrderService
                        .deleteItem(
                            orderItemId
                        ),

            onSuccess:
                async (
                    _,
                    variables
                ) => {

                    await refreshItems(
                        variables.orderId
                    );

                    showToast(
                        "Order Item deleted successfully."
                    );
                },

            onError:
                error => {

                    showToast(
                        getErrorMessage(
                            error,
                            "Unable to delete Order Item."
                        ),
                        "danger"
                    );
                }
        });


    // ======================================================
    // EXECUTE MUTATION
    // ======================================================

    const executeMutation =
        useMutation({

            mutationFn:
                ({
                    orderId,
                    payload
                }) =>
                    productionOrderService
                        .changeOrderStatus(
                            orderId,
                            payload
                        ),

            onSuccess:
                async (
                    _,
                    variables
                ) => {

                    await refreshOrders();

                    showToast(
                        "Production Order status updated successfully."
                    );

                    setShowExecute(
                        false
                    );

                    setExecuteForm(
                        createEmptyExecute()
                    );

                    await queryClient
                        .invalidateQueries({

                            queryKey: [
                                "planning",
                                "production-order",
                                variables.orderId,
                                "status-history"
                            ]
                        });
                },

            onError:
                error => {

                    showToast(
                        getErrorMessage(
                            error,
                            "Execution failed."
                        ),
                        "danger"
                    );
                }
        });


    // ======================================================
    // SAVING
    // ======================================================

    const saving =

        createOrderMutation.isPending ||

        updateOrderMutation.isPending ||

        deleteOrderMutation.isPending ||

        createCustomerMutation.isPending ||

        updateCustomerMutation.isPending ||

        deleteCustomerMutation.isPending ||

        createItemMutation.isPending ||

        updateItemMutation.isPending ||

        deleteItemMutation.isPending ||

        executeMutation.isPending;


    // ======================================================
    // LOOKUPS
    // ======================================================

    const availableCustomers =
        useMemo(() => {

            if (
                !orderForm.company_id
            ) {
                return [];
            }

            return customers.filter(
                customer =>
                    sameId(
                        customer.company_id,
                        orderForm.company_id
                    )
            );

        }, [
            customers,
            orderForm.company_id
        ]);


    const availableParts =
        useMemo(() => {

            const companyId =
                selectedOrder?.company_id ||
                orderForm.company_id;

            if (!companyId) {
                return parts;
            }

            return parts.filter(
                part =>
                    !part.company_id ||
                    sameId(
                        part.company_id,
                        companyId
                    )
            );

        }, [
            parts,
            selectedOrder,
            orderForm.company_id
        ]);


    const selectedExecuteOrder =
        useMemo(() => {

            if (
                !executeForm.order_id
            ) {
                return null;
            }

            return orders.find(
                order =>
                    sameId(
                        order.order_id,
                        executeForm.order_id
                    )
            ) || null;

        }, [
            orders,
            executeForm.order_id
        ]);


    // ======================================================
    // FILTERED ORDERS
    // ======================================================

    const filteredOrders =
        useMemo(() => {

            const search =
                searchText
                    .trim()
                    .toLowerCase();

            return orders.filter(
                order => {

                    const searchValues = [

                        order.order_no,

                        order.customer_code,

                        order.customer_name,

                        order.order_type,

                        order.status,

                        order.source_system,

                        order.external_order_ref
                    ];

                    const searchMatch =
                        !search ||
                        searchValues.some(
                            value =>
                                String(
                                    value || ""
                                )
                                    .toLowerCase()
                                    .includes(
                                        search
                                    )
                        );

                    const statusMatch =
                        statusFilter ===
                        "ALL" ||
                        String(
                            order.status
                        ) ===
                        String(
                            statusFilter
                        );

                    return (
                        searchMatch &&
                        statusMatch
                    );
                }
            );

        }, [
            orders,
            searchText,
            statusFilter
        ]);


    // ======================================================
    // TOOLBAR HANDLERS
    // ======================================================

    const handleSearch =
        valueOrEvent => {

            const value =
                valueOrEvent?.target
                    ?.value ??
                valueOrEvent ??
                "";

            setSearchText(
                value
            );
        };


    const handleStatusFilter =
        valueOrEvent => {

            const value =
                valueOrEvent?.target
                    ?.value ??
                valueOrEvent ??
                "ALL";

            setStatusFilter(
                value
            );
        };


    const refreshAll =
        async () => {

            await Promise.all([

                queryClient
                    .invalidateQueries({
                        queryKey:
                            QUERY_KEYS.orders
                    }),

                queryClient
                    .invalidateQueries({
                        queryKey:
                            QUERY_KEYS.customers
                    }),

                queryClient
                    .invalidateQueries({
                        queryKey:
                            QUERY_KEYS.companies
                    }),

                queryClient
                    .invalidateQueries({
                        queryKey:
                            QUERY_KEYS.parts
                    })
            ]);

            showToast(
                "Production Order data refreshed."
            );
        };


    // ======================================================
    // ORDER FORM
    // ======================================================

    const resetOrderForm = () => {

        setEditOrderId(
            null
        );

        setOrderForm(
            createEmptyOrder()
        );
    };


    const openAddOrder = () => {

        resetOrderForm();

        setShowOrderForm(
            true
        );
    };


    const openEditOrder =
        async order => {

            try {

                const response =
                    await queryClient
                        .fetchQuery({

                            queryKey:
                                QUERY_KEYS.order(
                                    order.order_id
                                ),

                            queryFn:
                                () =>
                                    productionOrderService
                                        .getOrderById(
                                            order.order_id
                                        )
                        });

                const data =
                    responseData(
                        response
                    ) ||
                    order;

                setEditOrderId(
                    data.order_id
                );

                setOrderForm({

                    company_id:
                        data.company_id ||
                        "",

                    customer_id:
                        data.customer_id ||
                        "",

                    order_no:
                        data.order_no ||
                        "",

                    revision_no:
                        data.revision_no ||
                        1,

                    supersedes_order_id:
                        data.supersedes_order_id ||
                        "",

                    order_type:
                        data.order_type ||
                        "CUSTOMER",

                    order_date:
                        toDateInput(
                            data.order_date
                        ),

                    due_date:
                        toDateInput(
                            data.due_date
                        ),

                    priority_config_id:
                        null,

                    status:
                        data.status ||
                        "CREATED",

                    source_system:
                        data.source_system ||
                        "MANUAL",

                    external_order_ref:
                        data.external_order_ref ||
                        "",

                    items:
                        []
                });

                setShowOrderForm(
                    true
                );

            }
            catch (error) {

                showToast(
                    getErrorMessage(
                        error,
                        "Unable to load Production Order."
                    ),
                    "danger"
                );
            }
        };


    const handleOrderChange =
        event => {

            const {
                name,
                value
            } = event.target;

            setOrderForm(
                previous => {

                    const next = {

                        ...previous,

                        [name]:
                            value
                    };

                    if (
                        name ===
                        "company_id"
                    ) {

                        next.customer_id =
                            "";
                    }

                    return next;
                }
            );
        };


    const addCreateItem = () => {

        setOrderForm(
            previous => {

                const maxLine =
                    previous.items.reduce(
                        (
                            max,
                            item
                        ) =>
                            Math.max(
                                max,
                                Number(
                                    item.line_no
                                ) || 0
                            ),
                        0
                    );

                return {

                    ...previous,

                    items: [

                        ...previous.items,

                        createEmptyOrderItem(
                            maxLine + 1
                        )
                    ]
                };
            }
        );
    };


    const updateCreateItem = (
        index,
        field,
        value
    ) => {

        setOrderForm(
            previous => ({

                ...previous,

                items:
                    previous.items.map(
                        (
                            item,
                            currentIndex
                        ) =>
                            currentIndex ===
                            index
                                ? {
                                    ...item,
                                    [field]:
                                        value
                                }
                                : item
                    )
            })
        );
    };


    const removeCreateItem =
        index => {

            setOrderForm(
                previous => {

                    if (
                        previous.items.length <=
                        1
                    ) {
                        return previous;
                    }

                    return {

                        ...previous,

                        items:
                            previous.items.filter(
                                (
                                    _,
                                    currentIndex
                                ) =>
                                    currentIndex !==
                                    index
                            )
                    };
                }
            );
        };


    const saveOrder =
        async () => {

            if (
                !orderForm.company_id ||
                !orderForm.order_no.trim() ||
                !orderForm.order_type.trim() ||
                !orderForm.order_date ||
                !orderForm.due_date ||
                !orderForm.source_system.trim()
            ) {

                showToast(
                    "Company, Order No, Order Type, Order Date, Due Date and Source System are required.",
                    "danger"
                );

                return;
            }


            const payload = {

                company_id:
                    orderForm.company_id,

                customer_id:
                    orderForm.customer_id ||
                    null,

                order_no:
                    orderForm.order_no
                        .trim(),

                revision_no:
                    Number(
                        orderForm.revision_no
                    ),

                supersedes_order_id:
                    orderForm
                        .supersedes_order_id ||
                    null,

                order_type:
                    orderForm.order_type
                        .trim(),

                order_date:
                    orderForm.order_date,

                due_date:
                    orderForm.due_date,

                priority_config_id:
                    null,

                source_system:
                    orderForm.source_system
                        .trim(),

                external_order_ref:
                    orderForm
                        .external_order_ref
                        .trim() ||
                    null
            };


            try {

                if (
                    editOrderId
                ) {

                    await updateOrderMutation
                        .mutateAsync({

                            orderId:
                                editOrderId,

                            payload
                        });

                }
                else {

                    for (
                        const item
                        of orderForm.items
                    ) {

                        if (
                            !item.line_no ||
                            !item.part_id ||
                            !item.planned_qty
                        ) {

                            showToast(
                                "Each Order Item requires Line No, Part and Planned Quantity.",
                                "danger"
                            );

                            return;
                        }
                    }


                    await createOrderMutation
                        .mutateAsync({

                            ...payload,

                            status:
                                "CREATED",

                            items:
                                orderForm.items.map(
                                    item => ({

                                        line_no:
                                            Number(
                                                item.line_no
                                            ),

                                        part_id:
                                            item.part_id,

                                        planned_qty:
                                            Number(
                                                item.planned_qty
                                            ),

                                        due_date:
                                            item.due_date ||
                                            null,

                                        priority_config_id:
                                            null,

                                        status:
                                            "OPEN",

                                        external_item_ref:
                                            item
                                                .external_item_ref
                                                ?.trim() ||
                                            null
                                    })
                                )
                        });
                }


                setShowOrderForm(
                    false
                );

                resetOrderForm();

            }
            catch {
                // mutation handles error
            }
        };


    const deleteOrder =
        async order => {

            if (
                !window.confirm(
                    `Are you sure you want to delete Production Order "${order.order_no}"?`
                )
            ) {
                return;
            }

            try {

                await deleteOrderMutation
                    .mutateAsync(
                        order.order_id
                    );

            }
            catch {
                // handled
            }
        };


    // ======================================================
    // CUSTOMER
    // ======================================================

    const openAddCustomer = () => {

        setCustomerEditId(
            null
        );

        setCustomerForm(
            createEmptyCustomer()
        );

        setShowCustomerList(
            false
        );

        setShowCustomerForm(
            true
        );
    };


    const openEditCustomer =
        customer => {

            setCustomerEditId(
                customer.customer_id
            );

            setCustomerForm({

                company_id:
                    customer.company_id ||
                    "",

                customer_code:
                    customer.customer_code ||
                    "",

                customer_name:
                    customer.customer_name ||
                    "",

                customer_type:
                    customer.customer_type ||
                    "EXTERNAL",

                external_customer_ref:
                    customer.external_customer_ref ||
                    "",

                status:
                    customer.status ||
                    "ACTIVE",

                version_no:
                    customer.version_no ||
                    1
            });

            setShowCustomerList(
                false
            );

            setShowCustomerForm(
                true
            );
        };


    const saveCustomer =
        async () => {

            if (
                !customerForm.company_id ||
                !customerForm.customer_code.trim() ||
                !customerForm.customer_name.trim() ||
                !customerForm.customer_type.trim() ||
                !customerForm.status.trim()
            ) {

                showToast(
                    "Company, Customer Code, Customer Name, Customer Type and Status are required.",
                    "danger"
                );

                return;
            }


            const payload = {

                company_id:
                    customerForm.company_id,

                customer_code:
                    customerForm.customer_code
                        .trim(),

                customer_name:
                    customerForm.customer_name
                        .trim(),

                customer_type:
                    customerForm.customer_type
                        .trim(),

                external_customer_ref:
                    customerForm
                        .external_customer_ref
                        .trim() ||
                    null,

                status:
                    customerForm.status
                        .trim(),

                version_no:
                    Number(
                        customerForm.version_no ||
                        1
                    )
            };


            try {

                if (
                    customerEditId
                ) {

                    await updateCustomerMutation
                        .mutateAsync({

                            customerId:
                                customerEditId,

                            payload
                        });

                }
                else {

                    await createCustomerMutation
                        .mutateAsync(
                            payload
                        );
                }


                setShowCustomerForm(
                    false
                );

                setCustomerEditId(
                    null
                );

                setCustomerForm(
                    createEmptyCustomer()
                );

                setShowCustomerList(
                    true
                );

            }
            catch {
                // handled
            }
        };


    const deleteCustomer =
        async customer => {

            if (
                !window.confirm(
                    `Are you sure you want to delete customer "${customer.customer_name}"?`
                )
            ) {
                return;
            }

            try {

                await deleteCustomerMutation
                    .mutateAsync(
                        customer.customer_id
                    );

            }
            catch {
                // handled
            }
        };


    // ======================================================
    // HEADER ORDER ITEMS BUTTON
    // ======================================================

    const openHeaderOrderItems = () => {

        /*
         * If there is only one order,
         * select it automatically.
         *
         * Otherwise user selects the order
         * inside Order Items modal.
         */

        if (
            orders.length === 1
        ) {

            setSelectedOrder(
                orders[0]
            );

        }
        else {

            setSelectedOrder(
                null
            );
        }

        setShowItemList(
            true
        );
    };


    const handleItemOrderSelection =
        event => {

            const orderId =
                event.target.value;

            if (!orderId) {

                setSelectedOrder(
                    null
                );

                return;
            }

            const order =
                orders.find(
                    row =>
                        sameId(
                            row.order_id,
                            orderId
                        )
                );

            setSelectedOrder(
                order || null
            );
        };


    // ======================================================
    // ITEM CRUD
    // ======================================================

    const openAddItem = () => {

        if (
            !selectedOrder
        ) {

            showToast(
                "Select a Production Order first.",
                "danger"
            );

            return;
        }


        const maxLine =
            orderItems.reduce(
                (
                    max,
                    item
                ) =>
                    Math.max(
                        max,
                        Number(
                            item.line_no
                        ) || 0
                    ),
                0
            );


        setItemEditId(
            null
        );

        setItemForm({

            ...createEmptySingleItem(),

            line_no:
                maxLine + 1
        });

        setShowItemList(
            false
        );

        setShowItemForm(
            true
        );
    };


    const openEditItem =
        item => {

            setItemEditId(
                item.order_item_id
            );

            setItemForm({

                line_no:
                    item.line_no,

                part_id:
                    item.part_id ||
                    "",

                planned_qty:
                    item.planned_qty ??
                    "",

                due_date:
                    toDateInput(
                        item.due_date
                    ),

                priority_config_id:
                    null,

                status:
                    item.status ||
                    "OPEN",

                external_item_ref:
                    item.external_item_ref ||
                    ""
            });

            setShowItemList(
                false
            );

            setShowItemForm(
                true
            );
        };


    const saveItem =
        async () => {

            if (
                !selectedOrder
            ) {

                showToast(
                    "Select Production Order first.",
                    "danger"
                );

                return;
            }


            if (
                !itemForm.line_no ||
                !itemForm.part_id ||
                !itemForm.planned_qty
            ) {

                showToast(
                    "Line No, Part and Planned Quantity are required.",
                    "danger"
                );

                return;
            }


            const payload = {

                order_id:
                    selectedOrder.order_id,

                line_no:
                    Number(
                        itemForm.line_no
                    ),

                part_id:
                    itemForm.part_id,

                planned_qty:
                    Number(
                        itemForm.planned_qty
                    ),

                due_date:
                    itemForm.due_date ||
                    null,

                priority_config_id:
                    null,

                status:
                    itemForm.status ||
                    "OPEN",

                external_item_ref:
                    itemForm
                        .external_item_ref
                        .trim() ||
                    null
            };


            try {

                if (
                    itemEditId
                ) {

                    await updateItemMutation
                        .mutateAsync({

                            orderItemId:
                                itemEditId,

                            orderId:
                                selectedOrder.order_id,

                            payload
                        });

                }
                else {

                    await createItemMutation
                        .mutateAsync({

                            orderId:
                                selectedOrder.order_id,

                            payload
                        });
                }


                setShowItemForm(
                    false
                );

                setItemEditId(
                    null
                );

                setItemForm(
                    createEmptySingleItem()
                );

                setShowItemList(
                    true
                );

            }
            catch {
                // handled
            }
        };


    const deleteItem =
        async item => {

            if (
                !selectedOrder
            ) {
                return;
            }


            if (
                !window.confirm(
                    `Are you sure you want to delete Order Item Line ${item.line_no}?`
                )
            ) {
                return;
            }


            try {

                await deleteItemMutation
                    .mutateAsync({

                        orderItemId:
                            item.order_item_id,

                        orderId:
                            selectedOrder.order_id
                    });

            }
            catch {
                // handled
            }
        };


    // ======================================================
    // EXECUTE TOOLBAR
    // ======================================================

    const openExecute = () => {

        setExecuteForm(
            createEmptyExecute()
        );

        setShowExecute(
            true
        );
    };


    const executeStatus =
        async () => {

            if (
                !executeForm.order_id
            ) {

                showToast(
                    "Select a Production Order.",
                    "danger"
                );

                return;
            }


            if (
                !executeForm.new_status
                    .trim()
            ) {

                showToast(
                    "New Status is required.",
                    "danger"
                );

                return;
            }


            const payload = {

                new_status:
                    executeForm
                        .new_status
                        .trim(),

                reason:
                    executeForm
                        .reason
                        .trim() ||
                    null,

                source_system:
                    executeForm
                        .source_system
                        .trim() ||
                    "MES",

                correlation_id:
                    executeForm
                        .correlation_id
                        .trim() ||
                    null,

                idempotency_key:
                    executeForm
                        .idempotency_key
                        .trim() ||
                    null
            };


            try {

                await executeMutation
                    .mutateAsync({

                        orderId:
                            executeForm.order_id,

                        payload
                    });

            }
            catch {
                // handled
            }
        };


    // ======================================================
    // RUNTIME TOOLBAR
    // ======================================================

    const openRuntime =
        async () => {

            await ordersQuery
                .refetch();

            setShowRuntime(
                true
            );
        };


    // ======================================================
    // EXPORT
    // ======================================================

    const exportCsv =
        async () => {

            try {

                const response =
                    await productionOrderService
                        .exportData();

                const rows =
                    responseRows(
                        response
                    );


                if (
                    !rows.length
                ) {

                    showToast(
                        "No Production Order data available for export.",
                        "warning"
                    );

                    return;
                }


                const columns = [

                    [
                        "order_no",
                        "Order No"
                    ],

                    [
                        "revision_no",
                        "Revision"
                    ],

                    [
                        "customer_code",
                        "Customer Code"
                    ],

                    [
                        "customer_name",
                        "Customer Name"
                    ],

                    [
                        "order_type",
                        "Order Type"
                    ],

                    [
                        "order_date",
                        "Order Date"
                    ],

                    [
                        "due_date",
                        "Due Date"
                    ],

                    [
                        "status",
                        "Order Status"
                    ],

                    [
                        "source_system",
                        "Source"
                    ],

                    [
                        "line_no",
                        "Line No"
                    ],

                    [
                        "part_code",
                        "Part Code"
                    ],

                    [
                        "part_name",
                        "Part Name"
                    ],

                    [
                        "planned_qty",
                        "Planned Qty"
                    ],

                    [
                        "item_status",
                        "Item Status"
                    ]
                ];


                const header =
                    columns
                        .map(
                            ([, label]) =>
                                csvEscape(
                                    label
                                )
                        )
                        .join(",");


                const body =
                    rows.map(
                        row =>
                            columns
                                .map(
                                    ([key]) =>
                                        csvEscape(
                                            row[key]
                                        )
                                )
                                .join(",")
                    );


                const csv =
                    "\uFEFF" +
                    [
                        header,
                        ...body
                    ].join(
                        "\r\n"
                    );


                const blob =
                    new Blob(
                        [csv],
                        {
                            type:
                                "text/csv;charset=utf-8;"
                        }
                    );


                const url =
                    window.URL
                        .createObjectURL(
                            blob
                        );


                const anchor =
                    document
                        .createElement(
                            "a"
                        );


                anchor.href =
                    url;

                anchor.download =
                    "Production_Order.csv";


                document.body
                    .appendChild(
                        anchor
                    );


                anchor.click();

                anchor.remove();


                window.URL
                    .revokeObjectURL(
                        url
                    );


                showToast(
                    "Production Order CSV exported successfully."
                );

            }
            catch (error) {

                showToast(
                    getErrorMessage(
                        error,
                        "Export failed."
                    ),
                    "danger"
                );
            }
        };


    // ======================================================
    // MAIN TABLE COLUMNS
    // NO VISIBLE OPERATIONS COLUMN
    // ======================================================

    const orderColumns = [

        {
            key:
                "order_no",

            label:
                "Order No",

            render:
                row => (

                    <span
                        className=
                            "po-order-no"
                    >
                        {row.order_no}
                    </span>
                )
        },

        {
            key:
                "revision_no",

            label:
                "Rev."
        },

        {
            key:
                "customer_name",

            label:
                "Customer",

            render:
                row =>
                    row.customer_name ||
                    "Internal"
        },

        {
            key:
                "order_type",

            label:
                "Type"
        },

        {
            key:
                "order_date",

            label:
                "Order Date",

            render:
                row =>
                    formatDate(
                        row.order_date
                    )
        },

        {
            key:
                "due_date",

            label:
                "Due Date",

            render:
                row =>
                    formatDate(
                        row.due_date
                    )
        },

        {
            key:
                "status",

            label:
                "Status",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.status
                        }
                    />
                )
        },

        {
            key:
                "source_system",

            label:
                "Source"
        }
    ];


    // ======================================================
    // CUSTOMER TABLE
    // ======================================================

    const customerColumns = [

        {
            key:
                "customer_code",

            label:
                "Customer Code"
        },

        {
            key:
                "customer_name",

            label:
                "Customer Name"
        },

        {
            key:
                "customer_type",

            label:
                "Type"
        },

        {
            key:
                "external_customer_ref",

            label:
                "External Ref",

            render:
                row =>
                    row.external_customer_ref ||
                    "-"
        },

        {
            key:
                "status",

            label:
                "Status",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.status
                        }
                    />
                )
        },

        {
            key:
                "version_no",

            label:
                "Version"
        }
    ];


    // ======================================================
    // ITEM TABLE
    // NO EXECUTE/HISTORY VISIBLE
    // ======================================================

    const itemColumns = [

        {
            key:
                "line_no",

            label:
                "Line No"
        },

        {
            key:
                "part_code",

            label:
                "Part Code"
        },

        {
            key:
                "part_name",

            label:
                "Part Name"
        },

        {
            key:
                "planned_qty",

            label:
                "Planned Qty"
        },

        {
            key:
                "due_date",

            label:
                "Due Date",

            render:
                row =>
                    formatDate(
                        row.due_date ||
                        selectedOrder?.due_date
                    )
        },

        {
            key:
                "external_item_ref",

            label:
                "External Ref",

            render:
                row =>
                    row.external_item_ref ||
                    "-"
        },

        {
            key:
                "status",

            label:
                "Status",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.status
                        }
                    />
                )
        }
    ];


    // ======================================================
    // RUNTIME TABLE
    // ======================================================

    const runtimeColumns = [

        {
            key:
                "order_no",

            label:
                "Order No"
        },

        {
            key:
                "revision_no",

            label:
                "Rev."
        },

        {
            key:
                "customer_name",

            label:
                "Customer",

            render:
                row =>
                    row.customer_name ||
                    "Internal"
        },

        {
            key:
                "order_type",

            label:
                "Type"
        },

        {
            key:
                "order_date",

            label:
                "Order Date",

            render:
                row =>
                    formatDate(
                        row.order_date
                    )
        },

        {
            key:
                "due_date",

            label:
                "Due Date",

            render:
                row =>
                    formatDate(
                        row.due_date
                    )
        },

        {
            key:
                "status",

            label:
                "Runtime Status",

            render:
                row => (

                    <StatusBadge
                        status={
                            row.status
                        }
                    />
                )
        },

        {
            key:
                "source_system",

            label:
                "Source"
        }
    ];


    // ======================================================
    // RENDER
    // ======================================================

    const visualLiveStatus=useLiveRefresh(showRuntime,async()=>{const response=await ordersQuery.refetch();if(response.error)throw response.error;});
    return (

        <> <OperationsLaunch onRuntime={openRuntime}/><>

<div
            className=
                "production-order-page container-fluid"
        >

            <style>
                {PAGE_STYLE}
            </style>


            {/* ================================================= */}
            {/* TOAST */}
            {/* ================================================= */}

            <Toast
                show={
                    toast.show
                }
                onClose={() =>
                    setToast(
                        previous => ({
                            ...previous,
                            show: false
                        })
                    )
                }
                delay={3500}
                autohide
                bg={
                    toast.variant
                }
                className=
                    "position-fixed top-0 end-0 m-3 po-toast shadow"
                style={{
                    zIndex: 9999
                }}
            >

                <Toast.Body
                    className=
                        "text-white fw-semibold"
                >
                    {toast.message}
                </Toast.Body>

            </Toast>


            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <Card
                className=
                    "po-header-card mb-4"
            >

                <Card.Body>

                    <Row
                        className=
                            "align-items-center g-3"
                    >

                        <Col>

                            <h2
                                className=
                                    "po-title"
                            >
                                Production Order
                            </h2>


                            <div
                                className=
                                    "po-breadcrumb"
                            >
                                Planning / Production Order
                            </div>

                        </Col>


                        <Col xs="auto">

                            <div
                                className=
                                    "po-header-buttons"
                            >

                                {/* CUSTOMER MASTER */}

                                <Button
                                    variant=
                                        "outline-primary"
                                    onClick={() =>
                                        setShowCustomerList(
                                            true
                                        )
                                    }
                                >

                                    <PeopleFill
                                        className="me-2"
                                    />

                                    Customer Master

                                </Button>


                                {/* ORDER ITEMS MOVED HERE */}

                                <Button
                                    variant=
                                        "outline-primary"
                                    onClick={
                                        openHeaderOrderItems
                                    }
                                >

                                    <ListUl
                                        className="me-2"
                                    />

                                    Order Items

                                </Button>


                                {/* ADD ORDER */}

                                <Button
                                    variant=
                                        "primary"
                                    onClick={
                                        openAddOrder
                                    }
                                >

                                    <Plus
                                        className="me-1"
                                    />

                                    Add Production Order

                                </Button>

                            </div>

                        </Col>

                    </Row>

                </Card.Body>

            </Card>


            {/* ================================================= */}
            {/* TOOLBAR
                 KEEP:
                 REFRESH
                 GREEN EXECUTE
                 RUNTIME
                 EXPORT

                 REPORT REMOVED
            ================================================= */}

            <div
                className=
                    "po-toolbar-wrapper"
            >

                <SearchToolbar

                    searchText={
                        searchText
                    }

                    onSearch={
                        handleSearch
                    }

                    status={
                        statusFilter
                    }

                    onStatusChange={
                        handleStatusFilter
                    }

                    onRefresh={
                        refreshAll
                    }

                    onExecute={
                        openExecute
                    }

                    onRuntime={
                        openRuntime
                    }

                    onExport={
                        exportCsv
                    }

                    placeholder=
                        "Search Order No, Customer, Type..."

                />

            </div>


            {/* ================================================= */}
            {/* MAIN TABLE
                 ONLY EDIT / DELETE ACTIONS
            ================================================= */}

            <div
                className=
                    "po-table-shell"
            >

                <DataTable

                    columns={
                        orderColumns
                    }

                    data={
                        filteredOrders
                    }

                    loading={
                        ordersQuery.isLoading ||
                        ordersQuery.isFetching
                    }

                    emptyMessage=
                        "No Production Orders Found"

                    renderActions={
                        row => (

                            <ActionButtons

                                onEdit={() =>
                                    openEditOrder(
                                        row
                                    )
                                }

                                onDelete={() =>
                                    deleteOrder(
                                        row
                                    )
                                }

                            />

                        )
                    }

                />

            </div>


            {/* ================================================= */}
            {/* ORDER CREATE / UPDATE MODAL */}
            {/* ================================================= */}

            <Modal
                show={
                    showOrderForm
                }
                onHide={() => {

                    setShowOrderForm(
                        false
                    );

                    resetOrderForm();

                }}
                backdrop="static"
                centered
                size="xl"
                className=
                    "po-production-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>

                        {editOrderId
                            ? "Update Production Order"
                            : "Create Production Order"}

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div
                        className=
                            "po-section-title"
                    >
                        Order Information
                    </div>


                    <Row>

                        <Col
                            lg={4}
                            md={6}
                        >

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    Company *
                                </Form.Label>


                                <Form.Select
                                    name=
                                        "company_id"
                                    value={
                                        orderForm.company_id
                                    }
                                    onChange={
                                        handleOrderChange
                                    }
                                      disabled={Boolean(editOrderId)}
                                >

                                    <option value="">
                                        Select Company
                                    </option>


                                    {companies.map(
                                        company => (

                                            <option
                                                key={
                                                    company.company_id
                                                }
                                                value={
                                                    company.company_id
                                                }
                                            >
                                                {
                                                    company.company_name
                                                }
                                            </option>

                                        )
                                    )}

                                </Form.Select>

                            </Form.Group>

                        </Col>


                        <Col
                            lg={4}
                            md={6}
                        >

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    Customer
                                </Form.Label>


                                <Form.Select
                                    name=
                                        "customer_id"
                                    value={
                                        orderForm.customer_id
                                    }
                                    onChange={
                                        handleOrderChange
                                    }
                                    disabled={ Boolean(editOrderId) ||
                                        !orderForm.company_id
                                    }
                                >

                                    <option value="">
                                        Internal / No Customer
                                    </option>


                                    {availableCustomers.map(
                                        customer => (

                                            <option
                                                key={
                                                    customer.customer_id
                                                }
                                                value={
                                                    customer.customer_id
                                                }
                                            >

                                                {
                                                    customer.customer_code
                                                }

                                                {" - "}

                                                {
                                                    customer.customer_name
                                                }

                                            </option>

                                        )
                                    )}

                                </Form.Select>

                            </Form.Group>

                        </Col>


                        <Col
                            lg={4}
                            md={6}
                        >

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    Order No *
                                </Form.Label>


                                <Form.Control
                                    name=
                                        "order_no"
                                    value={
                                        orderForm.order_no
                                    }
                                    onChange={
                                        handleOrderChange
                                    }
                                    maxLength={75}
                                />

                            </Form.Group>

                        </Col>


                        <Col
                            lg={3}
                            md={6}
                        >

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    Revision *
                                </Form.Label>


                                <Form.Control
                                    type="number"
                                    min="1"
                                    name=
                                        "revision_no"
                                    value={
                                        orderForm.revision_no
                                    }
                                    onChange={
                                        handleOrderChange
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col
                            lg={3}
                            md={6}
                        >

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    Order Type *
                                </Form.Label>


                                <Form.Control
                                    name=
                                        "order_type"
                                    value={
                                        orderForm.order_type
                                    }
                                    onChange={
                                        handleOrderChange
                                    }
                                    maxLength={20}
                                />

                            </Form.Group>

                        </Col>


                        <Col
                            lg={3}
                            md={6}
                        >

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    Order Date *
                                </Form.Label>


                                <Form.Control
                                    type="date"
                                    name=
                                        "order_date"
                                    value={
                                        orderForm.order_date
                                    }
                                    onChange={
                                        handleOrderChange
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col
                            lg={3}
                            md={6}
                        >

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    Due Date *
                                </Form.Label>


                                <Form.Control
                                    type="date"
                                    name=
                                        "due_date"
                                    value={
                                        orderForm.due_date
                                    }
                                    onChange={
                                        handleOrderChange
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col
                            lg={4}
                            md={6}
                        >

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    Supersedes Order ID
                                </Form.Label>


                               <Form.Control
    name="supersedes_order_id"
    value={orderForm.supersedes_order_id}
    onChange={handleOrderChange}
    readOnly={Boolean(editOrderId)}
/>

                            </Form.Group>

                        </Col>


                        <Col
                            lg={4}
                            md={6}
                        >

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    Source System *
                                </Form.Label>


                                <Form.Control
                                    name=
                                        "source_system"
                                    value={
                                        orderForm.source_system
                                    }
                                    onChange={
                                        handleOrderChange
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col
                            lg={4}
                            md={6}
                        >

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    External Order Ref
                                </Form.Label>


                                <Form.Control
                                    name=
                                        "external_order_ref"
                                    value={
                                        orderForm.external_order_ref
                                    }
                                    onChange={
                                        handleOrderChange
                                    }
                                />

                            </Form.Group>

                        </Col>

                    </Row>


                    {!editOrderId && (

                        <>

                            <div
                                className=
                                    "po-divider"
                            />


                            <div
                                className=
                                    "d-flex justify-content-between align-items-center mb-3"
                            >

                                <div>

                                    <div
                                        className=
                                            "po-section-title mb-1"
                                    >
                                        Initial Order Items
                                    </div>

                                    <small
                                        className=
                                            "text-muted"
                                    >
                                        Add required order lines during Production Order creation.
                                    </small>

                                </div>


                                <Button
                                    size="sm"
                                    variant=
                                        "outline-primary"
                                    onClick={
                                        addCreateItem
                                    }
                                >
                                    <Plus />

                                    Add Line
                                </Button>

                            </div>


                            {orderForm.items.map(
                                (
                                    item,
                                    index
                                ) => (

                                    <Card
                                        key={
                                            index
                                        }
                                        className=
                                            "po-item-card mb-3"
                                    >

                                        <Card.Body>

                                            <Row
                                                className=
                                                    "align-items-end g-3"
                                            >

                                                <Col
                                                    lg={2}
                                                    md={4}
                                                >

                                                    <Form.Group>

                                                        <Form.Label>
                                                            Line No *
                                                        </Form.Label>


                                                        <Form.Control
                                                            type="number"
                                                            min="1"
                                                            value={
                                                                item.line_no
                                                            }
                                                            onChange={
                                                                event =>
                                                                    updateCreateItem(
                                                                        index,
                                                                        "line_no",
                                                                        event.target.value
                                                                    )
                                                            }
                                                        />

                                                    </Form.Group>

                                                </Col>


                                                <Col
                                                    lg={4}
                                                    md={8}
                                                >

                                                    <Form.Group>

                                                        <Form.Label>
                                                            Part *
                                                        </Form.Label>


                                                        <Form.Select
                                                            value={
                                                                item.part_id
                                                            }
                                                            onChange={
                                                                event =>
                                                                    updateCreateItem(
                                                                        index,
                                                                        "part_id",
                                                                        event.target.value
                                                                    )
                                                            }
                                                        >

                                                            <option value="">
                                                                Select Part
                                                            </option>


                                                            {availableParts.map(
                                                                part => (

                                                                    <option
                                                                        key={
                                                                            part.part_id
                                                                        }
                                                                        value={
                                                                            part.part_id
                                                                        }
                                                                    >
                                                                        {
                                                                            part.part_code
                                                                        }

                                                                        {" - "}

                                                                        {
                                                                            part.part_name
                                                                        }
                                                                    </option>

                                                                )
                                                            )}

                                                        </Form.Select>

                                                    </Form.Group>

                                                </Col>


                                                <Col
                                                    lg={2}
                                                    md={4}
                                                >

                                                    <Form.Group>

                                                        <Form.Label>
                                                            Planned Qty *
                                                        </Form.Label>


                                                        <Form.Control
                                                            type="number"
                                                            min="0.001"
                                                            step="0.001"
                                                            value={
                                                                item.planned_qty
                                                            }
                                                            onChange={
                                                                event =>
                                                                    updateCreateItem(
                                                                        index,
                                                                        "planned_qty",
                                                                        event.target.value
                                                                    )
                                                            }
                                                        />

                                                    </Form.Group>

                                                </Col>


                                                <Col
                                                    lg={3}
                                                    md={5}
                                                >

                                                    <Form.Group>

                                                        <Form.Label>
                                                            Due Date
                                                        </Form.Label>


                                                        <Form.Control
                                                            type="date"
                                                            value={
                                                                item.due_date
                                                            }
                                                            onChange={
                                                                event =>
                                                                    updateCreateItem(
                                                                        index,
                                                                        "due_date",
                                                                        event.target.value
                                                                    )
                                                            }
                                                        />

                                                    </Form.Group>

                                                </Col>


                                                <Col
                                                    lg={1}
                                                    md={3}
                                                >

                                                    <Button
                                                        variant=
                                                            "outline-danger"
                                                        className=
                                                            "w-100"
                                                        disabled={
                                                            orderForm
                                                                .items
                                                                .length <=
                                                            1
                                                        }
                                                        onClick={() =>
                                                            removeCreateItem(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        ×
                                                    </Button>

                                                </Col>

                                            </Row>

                                        </Card.Body>

                                    </Card>

                                )
                            )}

                        </>

                    )}


                    {editOrderId && (

                        <div
                            className=
                                "po-info"
                        >
                            To manage Production Order lines, use the
                            <strong>
                                {" "}Order Items{" "}
                            </strong>
                            button beside Customer Master.
                        </div>

                    )}

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant=
                            "outline-secondary"
                        disabled={
                            saving
                        }
                        onClick={() => {

                            setShowOrderForm(
                                false
                            );

                            resetOrderForm();

                        }}
                    >
                        Cancel
                    </Button>


                    <Button
                        variant=
                            "primary"
                        disabled={
                            saving
                        }
                        onClick={
                            saveOrder
                        }
                    >

                        {saving && (

                            <Spinner
                                size="sm"
                                className=
                                    "me-2"
                            />

                        )}

                        {editOrderId
                            ? "Update Order"
                            : "Create Order"}

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* ================================================= */}
            {/* CUSTOMER MASTER */}
            {/* ================================================= */}

            <Modal
                show={
                    showCustomerList
                }
                onHide={() =>
                    setShowCustomerList(
                        false
                    )
                }
                centered
                size="xl"
                className=
                    "po-production-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>

                        <PeopleFill
                            className="me-2"
                        />

                        Customer Master

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <div
                        className=
                            "d-flex justify-content-end mb-3"
                    >

                        <Button
                            variant=
                                "primary"
                            onClick={
                                openAddCustomer
                            }
                        >

                            <Plus />

                            Add Customer

                        </Button>

                    </div>


                    <DataTable

                        columns={
                            customerColumns
                        }

                        data={
                            customers
                        }

                        loading={
                            customersQuery.isLoading ||
                            customersQuery.isFetching
                        }

                        emptyMessage=
                            "No Customers Found"

                        renderActions={
                            customer => (

                                <ActionButtons

                                    onEdit={() =>
                                        openEditCustomer(
                                            customer
                                        )
                                    }

                                    onDelete={() =>
                                        deleteCustomer(
                                            customer
                                        )
                                    }

                                />

                            )
                        }

                    />

                </Modal.Body>

            </Modal>


            {/* ================================================= */}
            {/* CUSTOMER FORM */}
            {/* ================================================= */}

            <Modal
                show={
                    showCustomerForm
                }
                onHide={() => {

                    setShowCustomerForm(
                        false
                    );

                    setShowCustomerList(
                        true
                    );

                }}
                backdrop="static"
                centered
                size="lg"
                className=
                    "po-production-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>

                        {customerEditId
                            ? "Update Customer"
                            : "Create Customer"}

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Row
                        className="g-3"
                    >

                        <Col md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Company *
                                </Form.Label>


                                <Form.Select
                                    value={
                                        customerForm.company_id
                                    }
                                    disabled={Boolean(customerEditId)}
                                    onChange={
                                        event =>
                                            setCustomerForm(
                                                previous => ({
                                                    ...previous,
                                                    company_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Company
                                    </option>


                                    {companies.map(
                                        company => (

                                            <option
                                                key={
                                                    company.company_id
                                                }
                                                value={
                                                    company.company_id
                                                }
                                            >
                                                {
                                                    company.company_name
                                                }
                                            </option>

                                        )
                                    )}

                                </Form.Select>

                            </Form.Group>

                        </Col>


                        <Col md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Customer Code *
                                </Form.Label>


                                <Form.Control
                                    value={
                                        customerForm.customer_code
                                    }
                                    onChange={
                                        event =>
                                            setCustomerForm(
                                                previous => ({
                                                    ...previous,
                                                    customer_code:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Customer Name *
                                </Form.Label>


                                <Form.Control
                                    value={
                                        customerForm.customer_name
                                    }
                                    onChange={
                                        event =>
                                            setCustomerForm(
                                                previous => ({
                                                    ...previous,
                                                    customer_name:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Customer Type *
                                </Form.Label>


                                <Form.Control
                                    value={
                                        customerForm.customer_type
                                    }
                                    onChange={
                                        event =>
                                            setCustomerForm(
                                                previous => ({
                                                    ...previous,
                                                    customer_type:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col md={6}>

                            <Form.Group>

                                <Form.Label>
                                    External Customer Ref
                                </Form.Label>


                                <Form.Control
                                    value={
                                        customerForm.external_customer_ref
                                    }
                                    onChange={
                                        event =>
                                            setCustomerForm(
                                                previous => ({
                                                    ...previous,
                                                    external_customer_ref:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Status *
                                </Form.Label>


                                <Form.Control
                                    value={
                                        customerForm.status
                                    }
                                    onChange={
                                        event =>
                                            setCustomerForm(
                                                previous => ({
                                                    ...previous,
                                                    status:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>

                    </Row>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant=
                            "outline-secondary"
                        disabled={
                            saving
                        }
                        onClick={() => {

                            setShowCustomerForm(
                                false
                            );

                            setShowCustomerList(
                                true
                            );

                        }}
                    >
                        Cancel
                    </Button>


                    <Button
                        variant=
                            "primary"
                        disabled={
                            saving
                        }
                        onClick={
                            saveCustomer
                        }
                    >

                        {saving && (

                            <Spinner
                                size="sm"
                                className=
                                    "me-2"
                            />

                        )}

                        Save Customer

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* ================================================= */}
            {/* HEADER ORDER ITEMS MODAL */}
            {/* ================================================= */}

            <Modal
                show={
                    showItemList
                }
                onHide={() =>
                    setShowItemList(
                        false
                    )
                }
                centered
                size="xl"
                className=
                    "po-production-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>

                        <ListUl
                            className="me-2"
                        />

                        Order Items

                        {selectedOrder && (

                            <Badge
                                bg="light"
                                text="dark"
                                className="ms-2"
                            >
                                {
                                    selectedOrder.order_no
                                }
                            </Badge>

                        )}

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    {/* SELECT PRODUCTION ORDER */}

                    <Row
                        className=
                            "align-items-end mb-4"
                    >

                        <Col
                            lg={8}
                            md={7}
                        >

                            <Form.Group>

                                <Form.Label>
                                    Production Order *
                                </Form.Label>


                                <Form.Select
                                    value={
                                        selectedOrder
                                            ?.order_id ||
                                        ""
                                    }
                                    onChange={
                                        handleItemOrderSelection
                                    }
                                >

                                    <option value="">
                                        Select Production Order
                                    </option>


                                    {orders.map(
                                        order => (

                                            <option
                                                key={
                                                    order.order_id
                                                }
                                                value={
                                                    order.order_id
                                                }
                                            >

                                                {
                                                    order.order_no
                                                }

                                                {" - "}

                                                {
                                                    order.status
                                                }

                                            </option>

                                        )
                                    )}

                                </Form.Select>

                            </Form.Group>

                        </Col>


                        <Col
                            lg={4}
                            md={5}
                            className=
                                "text-md-end mt-3 mt-md-0"
                        >

                            <Button
                                variant=
                                    "primary"
                                disabled={
                                    !selectedOrder
                                }
                                onClick={
                                    openAddItem
                                }
                            >

                                <Plus />

                                Add Order Item

                            </Button>

                        </Col>

                    </Row>


                    {selectedOrder ? (

                        <DataTable

                            columns={
                                itemColumns
                            }

                            data={
                                orderItems
                            }

                            loading={
                                itemsQuery.isLoading ||
                                itemsQuery.isFetching
                            }

                            emptyMessage=
                                "No Order Items Found"

                            renderActions={
                                item => (

                                    <ActionButtons

                                        onEdit={() =>
                                            openEditItem(
                                                item
                                            )
                                        }

                                        onDelete={() =>
                                            deleteItem(
                                                item
                                            )
                                        }

                                    />

                                )
                            }

                        />

                    ) : (

                        <div
                            className=
                                "po-info"
                        >
                            Select a Production Order above to view its Order Items.
                        </div>

                    )}

                </Modal.Body>

            </Modal>


            {/* ================================================= */}
            {/* ORDER ITEM FORM */}
            {/* ================================================= */}

            <Modal
                show={
                    showItemForm
                }
                onHide={() => {

                    setShowItemForm(
                        false
                    );

                    setShowItemList(
                        true
                    );

                }}
                backdrop="static"
                centered
                size="lg"
                className=
                    "po-production-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>

                        {itemEditId
                            ? "Update Order Item"
                            : "Add Order Item"}

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Row
                        className="g-3"
                    >

                        <Col md={4}>

                            <Form.Group>

                                <Form.Label>
                                    Line No *
                                </Form.Label>


                                <Form.Control
                                    type="number"
                                    min="1"
                                    value={
                                        itemForm.line_no
                                    }
                                    onChange={
                                        event =>
                                            setItemForm(
                                                previous => ({
                                                    ...previous,
                                                    line_no:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col md={8}>

                            <Form.Group>

                                <Form.Label>
                                    Part *
                                </Form.Label>


                                <Form.Select
                                    value={
                                        itemForm.part_id
                                    }
                                    disabled={Boolean(itemEditId)}
                                    onChange={
                                        event =>
                                            setItemForm(
                                                previous => ({
                                                    ...previous,
                                                    part_id:
                                                        event.target.value
                                                })
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Part
                                    </option>


                                    {availableParts.map(
                                        part => (

                                            <option
                                                key={
                                                    part.part_id
                                                }
                                                value={
                                                    part.part_id
                                                }
                                            >

                                                {
                                                    part.part_code
                                                }

                                                {" - "}

                                                {
                                                    part.part_name
                                                }

                                            </option>

                                        )
                                    )}

                                </Form.Select>

                            </Form.Group>

                        </Col>


                        <Col md={4}>

                            <Form.Group>

                                <Form.Label>
                                    Planned Qty *
                                </Form.Label>


                                <Form.Control
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={
                                        itemForm.planned_qty
                                    }
                                    onChange={
                                        event =>
                                            setItemForm(
                                                previous => ({
                                                    ...previous,
                                                    planned_qty:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col md={4}>

                            <Form.Group>

                                <Form.Label>
                                    Due Date
                                </Form.Label>


                                <Form.Control
                                    type="date"
                                    value={
                                        itemForm.due_date
                                    }
                                    onChange={
                                        event =>
                                            setItemForm(
                                                previous => ({
                                                    ...previous,
                                                    due_date:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col md={4}>

                            <Form.Group>

                                <Form.Label>
                                    External Item Ref
                                </Form.Label>


                                <Form.Control
                                    value={
                                        itemForm.external_item_ref
                                    }
                                    onChange={
                                        event =>
                                            setItemForm(
                                                previous => ({
                                                    ...previous,
                                                    external_item_ref:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>

                    </Row>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant=
                            "outline-secondary"
                        disabled={
                            saving
                        }
                        onClick={() => {

                            setShowItemForm(
                                false
                            );

                            setShowItemList(
                                true
                            );

                        }}
                    >
                        Cancel
                    </Button>


                    <Button
                        variant=
                            "primary"
                        disabled={
                            saving
                        }
                        onClick={
                            saveItem
                        }
                    >

                        {saving && (

                            <Spinner
                                size="sm"
                                className=
                                    "me-2"
                            />

                        )}

                        Save Order Item

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* ================================================= */}
            {/* GREEN TOOLBAR EXECUTE */}
            {/* ================================================= */}

            <Modal
                show={
                    showExecute
                }
                onHide={() =>
                    setShowExecute(
                        false
                    )
                }
                backdrop="static"
                centered
                size="lg"
                className=
                    "po-production-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>

                        <PlayFill
                            className=
                                "me-2 text-success"
                        />

                        Execute Production Order

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body>

                    <Form.Group
                        className="mb-3"
                    >

                        <Form.Label>
                            Production Order *
                        </Form.Label>


                        <Form.Select
                            value={
                                executeForm.order_id
                            }
                            onChange={
                                event =>
                                    setExecuteForm(
                                        previous => ({
                                            ...previous,
                                            order_id:
                                                event.target.value
                                        })
                                    )
                            }
                        >

                            <option value="">
                                Select Production Order
                            </option>


                            {orders.map(
                                order => (

                                    <option
                                        key={
                                            order.order_id
                                        }
                                        value={
                                            order.order_id
                                        }
                                    >

                                        {
                                            order.order_no
                                        }

                                        {" - "}

                                        {
                                            order.status
                                        }

                                    </option>

                                )
                            )}

                        </Form.Select>

                    </Form.Group>


                    <Row>

                        <Col md={6}>

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    Current Status
                                </Form.Label>


                                <Form.Control
                                    readOnly
                                    value={
                                        selectedExecuteOrder
                                            ?.status ||
                                        ""
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col md={6}>

                            <Form.Group
                                className="mb-3"
                            >

                                <Form.Label>
                                    New Status *
                                </Form.Label>


                                <Form.Control
                                    maxLength={30}
                                    value={
                                        executeForm.new_status
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                previous => ({
                                                    ...previous,
                                                    new_status:
                                                        event.target.value
                                                })
                                            )
                                    }
                                    placeholder=
                                        "Enter configured status"
                                />

                            </Form.Group>

                        </Col>

                    </Row>


                    <Form.Group
                        className="mb-3"
                    >

                        <Form.Label>
                            Reason
                        </Form.Label>


                        <Form.Control
                            as="textarea"
                            rows={3}
                            maxLength={500}
                            value={
                                executeForm.reason
                            }
                            onChange={
                                event =>
                                    setExecuteForm(
                                        previous => ({
                                            ...previous,
                                            reason:
                                                event.target.value
                                        })
                                    )
                            }
                        />

                    </Form.Group>


                    <Row>

                        <Col md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Source System
                                </Form.Label>


                                <Form.Control
                                    value={
                                        executeForm.source_system
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                previous => ({
                                                    ...previous,
                                                    source_system:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>


                        <Col md={6}>

                            <Form.Group>

                                <Form.Label>
                                    Idempotency Key
                                </Form.Label>


                                <Form.Control
                                    value={
                                        executeForm.idempotency_key
                                    }
                                    onChange={
                                        event =>
                                            setExecuteForm(
                                                previous => ({
                                                    ...previous,
                                                    idempotency_key:
                                                        event.target.value
                                                })
                                            )
                                    }
                                />

                            </Form.Group>

                        </Col>

                    </Row>

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant=
                            "outline-secondary"
                        disabled={
                            executeMutation.isPending
                        }
                        onClick={() =>
                            setShowExecute(
                                false
                            )
                        }
                    >
                        Cancel
                    </Button>


                    <Button
                        variant=
                            "success"
                        disabled={
                            executeMutation.isPending
                        }
                        onClick={
                            executeStatus
                        }
                    >

                        {executeMutation.isPending
                            ? (
                                <>

                                    <Spinner
                                        size="sm"
                                        className="me-2"
                                    />

                                    Executing...

                                </>
                            )
                            : (
                                <>

                                    <PlayFill
                                        className="me-1"
                                    />

                                    Execute

                                </>
                            )}

                    </Button>

                </Modal.Footer>

            </Modal>


            {/* ================================================= */}
            {/* RUNTIME */}
            {/* ================================================= */}

            <Modal
                show={
                    showRuntime
                }
                onHide={() =>
                    setShowRuntime(
                        false
                    )
                }
                centered
                size="xl"
                className=
                    "po-production-modal"
            >

                <Modal.Header
                    closeButton
                >

                    <Modal.Title>

                        <ClockHistory
                            className=
                                "me-2 text-warning"
                        />

                        Production Order Runtime

                    </Modal.Title>

                </Modal.Header>


                <Modal.Body><LiveSync status={visualLiveStatus}/><PlanningBoard records={orders} title="Order lifecycle studio"/>

                    <div
                        className=
                            "po-runtime-banner"
                    >
                        Current Production Order lifecycle state from the latest backend data.
                    </div>


                    <DataTable

                        columns={
                            runtimeColumns
                        }

                        data={
                            orders
                        }

                        loading={
                            ordersQuery.isFetching
                        }

                        emptyMessage=
                            "No Runtime Production Orders Found"

                    />

                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant=
                            "outline-primary"
                        onClick={() =>
                            ordersQuery.refetch()
                        }
                    >
                        Refresh Runtime
                    </Button>


                    <Button
                        variant=
                            "secondary"
                        onClick={() =>
                            setShowRuntime(
                                false
                            )
                        }
                    >
                        Close
                    </Button>

                </Modal.Footer>

            </Modal>

        </div>
</></>
    );
}


export default ProductionOrder;