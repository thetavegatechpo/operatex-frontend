// src/services/module.service.js

import api from "../../../../shared/api/client.js";

const API = "/module-enablement";

const getConfig = () => {
    return api.get(`${API}/config`);
};

const updateModuleConfig = (data) => {
    return api.post(`${API}/config`, data);
};

const moduleService = {
    getConfig,
    updateModuleConfig
};

export default moduleService;