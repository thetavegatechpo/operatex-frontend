const configured=import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL=(configured||'/api').replace(/\/+$/,'');
export const LOGIN_COMPANY_ID=import.meta.env.VITE_LOGIN_COMPANY_ID?.trim()||null;
