// src/services/signal.service.js

import api from "../../../../shared/api/client.js";


// ======================================================
// IMPORTANT
//
// If api.js baseURL already ends with "/api":
//
// const API = "/signal-mapping";
//
// Example:
// baseURL: "http://localhost:5000/api"
//
// If api.js baseURL is only:
// http://localhost:5000
//
// then use:
// const API = "/api/signal-mapping";
//
// ======================================================

const API = "/signal-mapping";


// ======================================================
// SIGNAL MAPPING SERVICE
// ======================================================

const signalService = {


    // ==================================================
    // ==================================================
    // TAG DICTIONARY
    // ==================================================
    // ==================================================


    // ==================================================
    // GET ALL TAGS
    //
    // GET /api/signal-mapping/config/tag
    // ==================================================

    getTagDictionary() {

        return api.get(
            `${API}/config/tag`
        );

    },


    // ==================================================
    // GET TAG BY ID
    //
    // GET /api/signal-mapping/config/tag/:id
    // ==================================================

    getTagById(id) {

        return api.get(
            `${API}/config/tag/${id}`
        );

    },


    // ==================================================
    // CREATE TAG
    //
    // POST /api/signal-mapping/config/tag
    // ==================================================

    createTag(payload) {

        return api.post(
            `${API}/config/tag`,
            payload
        );

    },


    // ==================================================
    // UPDATE TAG
    //
    // PUT /api/signal-mapping/config/tag/:id
    // ==================================================

    updateTag(
        id,
        payload
    ) {

        return api.put(
            `${API}/config/tag/${id}`,
            payload
        );

    },


    // ==================================================
    // DELETE / DEACTIVATE TAG
    //
    // DELETE /api/signal-mapping/config/tag/:id
    // ==================================================

    deleteTag(id) {

        return api.delete(
            `${API}/config/tag/${id}`
        );

    },


    // ==================================================
    // ==================================================
    // PROTOCOL ADDRESS MAP
    // ==================================================
    // ==================================================


    // ==================================================
    // GET ALL ADDRESS MAPS
    //
    // GET /api/signal-mapping/config/address-map
    // ==================================================

    getAddressMaps() {

        return api.get(
            `${API}/config/address-map`
        );

    },


    // ==================================================
    // GET ADDRESS MAP BY ID
    //
    // GET /api/signal-mapping/config/address-map/:id
    // ==================================================

    getAddressMapById(id) {

        return api.get(
            `${API}/config/address-map/${id}`
        );

    },


    // ==================================================
    // CREATE ADDRESS MAP
    //
    // POST /api/signal-mapping/config/address-map
    // ==================================================

    createAddressMap(payload) {

        return api.post(
            `${API}/config/address-map`,
            payload
        );

    },


    // ==================================================
    // UPDATE ADDRESS MAP
    //
    // PUT /api/signal-mapping/config/address-map/:id
    // ==================================================

    updateAddressMap(
        id,
        payload
    ) {

        return api.put(
            `${API}/config/address-map/${id}`,
            payload
        );

    },


    // ==================================================
    // DELETE / DEACTIVATE ADDRESS MAP
    //
    // DELETE /api/signal-mapping/config/address-map/:id
    // ==================================================

    deleteAddressMap(id) {

        return api.delete(
            `${API}/config/address-map/${id}`
        );

    },


    // ==================================================
    // ==================================================
    // MACHINE SIGNAL MAPPING
    // ==================================================
    // ==================================================


    // ==================================================
    // GET ALL SIGNAL MAPPINGS
    // ==================================================

    getMaster() {

        return api.get(
            `${API}/master`
        );

    },


    // ==================================================
    // GET SIGNAL MAPPING BY ID
    // ==================================================

    getMasterById(id) {

        return api.get(
            `${API}/master/${id}`
        );

    },


    // ==================================================
    // CREATE SIGNAL MAPPING
    // ==================================================

    createMaster(payload) {

        return api.post(
            `${API}/master`,
            payload
        );

    },


    // ==================================================
    // UPDATE SIGNAL MAPPING
    // ==================================================

    updateMaster(
        id,
        payload
    ) {

        return api.put(
            `${API}/master/${id}`,
            payload
        );

    },


    // ==================================================
    // PATCH SIGNAL MAPPING
    // ==================================================

    patchMaster(
        id,
        payload
    ) {

        return api.patch(
            `${API}/master/${id}`,
            payload
        );

    },


    // ==================================================
    // DELETE SIGNAL MAPPING
    // ==================================================

    deleteMaster(id) {

        return api.delete(
            `${API}/master/${id}`
        );

    },


    // ==================================================
    // DELETE MULTIPLE SIGNAL MAPPINGS
    // ==================================================

    deleteMultiple(ids) {

        return api.delete(
            `${API}/master`,
            {

                data: {
                    ids
                }

            }
        );

    },


    // ==================================================
    // ==================================================
    // RAW SIGNAL EVENT
    // ==================================================
    // ==================================================


    // ==================================================
    // GET RAW SIGNAL RUNTIME
    // ==================================================

    getRuntime() {

        return api.get(
            `${API}/runtime`
        );

    },


    // ==================================================
    // EXECUTE / CREATE RAW SIGNAL EVENT
    // ==================================================

    execute(payload) {

        return api.post(
            `${API}/execute`,
            payload
        );

    },


    // Alias if another page uses executeAction()
    executeAction(payload) {

        return api.post(
            `${API}/execute`,
            payload
        );

    },


    // ==================================================
    // ==================================================
    // NORMALIZED SIGNAL EVENT
    // ==================================================
    // ==================================================


    // ==================================================
    // GET NORMALIZED SIGNAL REPORT
    // ==================================================

    getReport() {

        return api.get(
            `${API}/report`
        );

    },


    // ==================================================
    // EXPORT NORMALIZED SIGNAL REPORT
    // ==================================================

    exportData(
        payload = {}
    ) {

        return api.post(
            `${API}/export`,
            payload
        );

    }

};


export default signalService;