import api from "../../../../shared/api/client.js";

const API = "/machine-master";

const machineService = {

    // ============================================
    // MASTER
    // ============================================

    getMaster() {

        return api.get(`${API}/master`);

    },

    createMaster(payload) {

        return api.post(

            `${API}/master`,

            payload

        );

    },

    updateMaster(id, payload) {

        return api.put(

            `${API}/master/${id}`,

            payload

        );

    },

    deleteMaster(id) {

        return api.delete(

            `${API}/master/${id}`

        );

    },

    // ============================================
    // CONFIG
    // ============================================

    getConfig() {

        return api.get(

            `${API}/config`

        );

    },

    getCapabilityConfig() {

        return api.get(

            `${API}/config/capability`

        );

    },

    getGroupConfig() {

        return api.get(

            `${API}/config/group`

        );

    },

    createConfig(payload) {

        return api.post(

            `${API}/config`,

            payload

        );

    },

    deleteCapability(id) {

        return api.delete(

            `${API}/config/capability/${id}`

        );

    },

    deleteGroup(id) {

        return api.delete(

            `${API}/config/group/${id}`

        );

    },
        // ============================================
    // RUNTIME
    // ============================================

    getRuntime() {

        return api.get(

            `${API}/runtime`

        );

    },

    // ============================================
    // EXECUTE
    // ============================================

    execute(payload) {

        return api.post(

            `${API}/execute`,

            payload

        );

    },

    // ============================================
    // REPORT
    // ============================================

    getReport() {

        return api.get(

            `${API}/report`

        );

    },

    // ============================================
    // EXPORT
    // ============================================

    exportData(payload) {

        return api.post(

            `${API}/export`,

            payload,

            {

                responseType: "blob"

            }

        );

    }

};

export default machineService;
