import api from '../../../shared/api/client.js';
import { LOGIN_COMPANY_ID } from '../../../config/environment.js';
export const loginUser=(username,password)=>api.post('/auth/login',{
    username,password,...(LOGIN_COMPANY_ID?{company_id:LOGIN_COMPANY_ID}:{})
});
export const logoutUser=()=>api.post('/auth/logout');
