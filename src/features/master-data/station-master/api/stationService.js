import api from "../../../../shared/api/client.js";

const stationService = {

    getMaster() {
        return api.get("/route-station-master/station-master");
    },

    getById(id) {
        return api.get(`/route-station-master/station-master/${id}`);
    },

    create(data) {
        return api.post("/route-station-master/station-master", data);
    },

    update(id, data) {
        return api.put(`/route-station-master/station-master/${id}`, data);
    },

    delete(id) {
        return api.delete(`/route-station-master/station-master/${id}`);
    }

};

export default stationService;