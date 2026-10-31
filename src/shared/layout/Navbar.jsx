import React,{useContext} from 'react';
import {Button} from 'react-bootstrap';
import {LogOut,Menu,Factory} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {AuthContext} from '../../features/auth/context/AuthContext.jsx';
import api from '../api/client.js';
import Brand from '../design/Brand.jsx';
import './Navbar.css';
export default function TopNavbar({onMenu}){const navigate=useNavigate();const {signOut,user}=useContext(AuthContext);async function logout(){try{await api.post('/auth/logout')}catch{}finally{signOut();navigate('/login',{replace:true})}}return <header className="operatex-navbar"><div className="ox-nav-brand"><Button variant="light" onClick={onMenu} aria-label="Toggle navigation" className="ox-mobile-menu"><Menu size={20}/></Button><Brand/></div><div className="ox-nav-context"><Factory size={15}/><span>Manufacturing workspace</span></div><div className="ox-nav-account"><div><b>{user?.username||'Workspace'}</b><small>{user?.role_name||'Authenticated session'}</small></div><Button variant="light" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={18}/></Button></div></header>}
