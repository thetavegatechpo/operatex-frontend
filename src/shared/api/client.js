import axios from 'axios';
import { API_BASE_URL } from '../../config/environment.js';
import { getToken,logout } from '../../features/auth/utils/auth.jsx';
const api=axios.create({baseURL:API_BASE_URL,timeout:15000,headers:{'Content-Type':'application/json'}});
api.interceptors.request.use(config=>{
    const token=getToken();
    if(token && !/\/auth\/login(?:\?|$)/.test(config.url||''))config.headers.Authorization=`Bearer ${token}`;
    return config;
});
api.interceptors.response.use(response=>response,error=>{
    // Invalid credentials must remain on the login form so its error message is visible.
    if(error.response?.status===401 && !/\/auth\/login(?:\?|$)/.test(error.config?.url||'')){
        logout();
        window.dispatchEvent(new Event('operatex:session-ended'));
        if(!window.location.pathname.endsWith('/login'))window.location.assign(`${import.meta.env.BASE_URL}login`);
    }
    return Promise.reject(error);
});
export default api;
