import api from "../../../../shared/api/client.js";



const shiftService = {

    // =====================================================
    // SHIFT MASTER
    // =====================================================

    getMaster() {

        return api.get(

            "/shift-calendar/master"

        );

    },

    createMaster(data) {

        return api.post(

            "/shift-calendar/master",

            data

        );

    },

    updateMaster(id, data) {

        return api.put(

            `/shift-calendar/master/${id}`,

            data

        );

    },

// =====================================================
// CONFIGURATION
// =====================================================

getConfig() {

    return api.get(
        "/shift-calendar/config"
    );

},

getBreaks(shiftId) {

    return api.get(
        `/shift-calendar/config/${shiftId}/breaks`
    );

},

getCalendars(shiftId) {

    return api.get(
        `/shift-calendar/config/${shiftId}/calendars`
    );

},

getHolidays(shiftId) {

    return api.get(
        `/shift-calendar/config/${shiftId}/holidays`
    );

},

saveConfig(data) {

    return api.post(
        "/shift-calendar/config",
        data
    );

},
    // =====================================================
    // RUNTIME
    // =====================================================

    getRuntime() {

        return api.get(

            "/shift-calendar/runtime"

        );

    },

    // =====================================================
    // EXECUTE
    // =====================================================

    execute(data) {

        return api.post(

            "/shift-calendar/execute",

            data

        );

    },

    // =====================================================
    // REPORT
    // =====================================================

    getReport() {

        return api.get(

            "/shift-calendar/report"

        );

    },

    // =====================================================
    // EXPORT
    // =====================================================

    exportData(data) {

        return api.post(

            "/shift-calendar/export",

            data,

            {

                responseType: "blob"

            }

        );

    }

};

export default shiftService;