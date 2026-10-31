import React,{createContext,useEffect,useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {getToken,getUser,saveToken,saveUser,logout} from '../utils/auth.jsx';
export const AuthContext=createContext();
export function AuthProvider({children}){
    const qc=useQueryClient();
    const [token,setToken]=useState(getToken);
    const [user,setUser]=useState(getUser);
    const signOut=()=>{logout();qc.clear();setToken(null);setUser(null);};
    const login=(jwt,userData)=>{
        qc.clear();localStorage.removeItem('operatex.loss_tree.filters.v1');
        saveToken(jwt);saveUser(userData);setToken(jwt);setUser(userData);
    };
    useEffect(()=>{
        const clear=()=>{qc.clear();setToken(null);setUser(null);};
        const storage=e=>{if(['operatex_token','operatex_user'].includes(e.key)){qc.clear();setToken(getToken());setUser(getUser());}};
        window.addEventListener('operatex:session-ended',clear);
        window.addEventListener('storage',storage);
        return()=>{window.removeEventListener('operatex:session-ended',clear);window.removeEventListener('storage',storage);};
    },[qc]);
    return <AuthContext.Provider value={{token,user,login,signOut,isAuthenticated:!!token}}>{children}</AuthContext.Provider>;
}
