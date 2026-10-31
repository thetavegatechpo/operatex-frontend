import api from "../../../../shared/api/client.js";

const userRolePermissionService = {

    // =====================================================
    // CONFIGURATION
    // =====================================================

    getConfig() {

        return api.get(

            "/user-role-permission/config"

        );

    },

    saveConfig(data) {

        return api.post(

            "/user-role-permission/config",

            data

        );

    },

    // =====================================================
    // MASTER
    // =====================================================

    getMaster(type) {

        return api.get(

            `/user-role-permission/master?type=${type}`

        );

    },

    getMasterById(id) {

        return api.get(

            `/user-role-permission/master/${id}`

        );

    },

    createMaster(data) {

        return api.post(

            "/user-role-permission/master",

            data

        );

    },

    updateMaster(id, data) {

        return api.put(

            `/user-role-permission/master/${id}`,

            data

        );

    },

    // =====================================================
    // RUNTIME
    // =====================================================

    getRuntime() {

        return api.get(

            "/user-role-permission/runtime"

        );

    },

    // =====================================================
    // EXECUTE
    // =====================================================

    execute(action = "RESET") {

        return api.post(

            "/user-role-permission/execute",

            {

                action

            }

        );

    },

    // =====================================================
    // REPORT
    // =====================================================

    getReport() {

        return api.get(

            "/user-role-permission/report"

        );

    },

    // =====================================================
    // EXPORT
    // =====================================================

    export(format = "CSV") {

        return api.post(

            "/user-role-permission/export",

            {

                format

            },

            {

                responseType: "blob"

            }

        );

    }

};

export default userRolePermissionService;