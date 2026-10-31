import React from "react";
import ReactDOM from "react-dom/client";

/* Bootstrap base first */
import "bootstrap/dist/css/bootstrap.min.css";

/* Your original OperateX global CSS AFTER Bootstrap */
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/latin-500.css";
import "@fontsource/montserrat/latin-600.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/montserrat/latin-800.css";
import "./styles/index.css";
import "./styles/graphite-signal.css";
// import "./styles/App.css";          // only if this existed before
// import "./styles/global.css"; // only if this existed before

import {
    QueryClient,
    QueryClientProvider
} from "@tanstack/react-query";

import {
    AuthProvider
} from "./features/auth/context/AuthContext.jsx";

import App from "./app/App.jsx";


const queryClient =
    new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: (count,error) => ![401,403].includes(error?.response?.status) && count < 1
            }
        }
    });


ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <React.StrictMode>

        <QueryClientProvider
            client={queryClient}
        >

            <AuthProvider>
                <App />
            </AuthProvider>

        </QueryClientProvider>

    </React.StrictMode>
);