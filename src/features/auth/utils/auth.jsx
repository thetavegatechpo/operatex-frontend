export const TOKEN_KEY='operatex_token';
export const USER_KEY='operatex_user';
export const saveToken=token=>localStorage.setItem(TOKEN_KEY,token);
export const removeToken=()=>localStorage.removeItem(TOKEN_KEY);
export const saveUser=user=>localStorage.setItem(USER_KEY,JSON.stringify(user));
export const removeUser=()=>localStorage.removeItem(USER_KEY);
export const logout=()=>{removeToken();removeUser();};
export function tokenExpired(token,now=Date.now()) {
    try {
        const segment=token.split('.')[1];
        if(!segment)return true;
        const base64=segment.replace(/-/g,'+').replace(/_/g,'/');
        const claims=JSON.parse(atob(base64.padEnd(Math.ceil(base64.length/4)*4,'=')));
        return !Number.isFinite(claims.exp)||claims.exp*1000<=now;
    } catch {return true;}
}
export function getToken(){
    const token=localStorage.getItem(TOKEN_KEY);
    if(token && tokenExpired(token)){logout();return null;}
    return token;
}
export function getUser(){
    try {
        const user=JSON.parse(localStorage.getItem(USER_KEY)||'null');
        if(user && (typeof user!=='object'||Array.isArray(user))){removeUser();return null;}
        return user;
    } catch {removeUser();return null;}
}
