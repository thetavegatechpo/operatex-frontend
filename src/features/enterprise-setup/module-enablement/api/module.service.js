// src/services/module.service.js

import api from "../../../../shared/api/client.js";

const API = "/module-enablement";

const getConfig = () => {
    return api.get(`${API}/config`);
};

const updateModuleConfig = (data) => {
    return api.post(`${API}/config`, data);
};

const getGroups = () => api.get(`${API}/groups`);
const updateGroup = (data) => api.put(`${API}/groups`, data);

const moduleService = {
    getGroups,
    updateGroup,
    getConfig,
    updateModuleConfig
};

export default moduleService;