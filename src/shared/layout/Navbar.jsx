import React,{useContext,useEffect,useState} from 'react';
import {Button} from 'react-bootstrap';
import {LogOut,Menu,Factory} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {AuthContext} from '../../features/auth/context/AuthContext.jsx';
import api from '../api/client.js';
import Brand from '../design/Brand.jsx';
import ThemeToggle from '../theme/ThemeToggle.jsx';
import './Navbar.css';

function LiveClock(){
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(id)},[]);
  return <div className="ox-nav-clock" aria-label="Current time">
    <b>{now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</b>
    <small>{now.toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</small>
  </div>;
}

export default function TopNavbar({onMenu}){
  const navigate=useNavigate();
  const {signOut,user}=useContext(AuthContext);
  async function logout(){try{await api.post('/auth/logout')}catch{}finally{signOut();navigate('/login',{replace:true})}}
  return <header className="operatex-navbar">
    <div className="ox-nav-brand"><Button variant="light" onClick={onMenu} aria-label="Toggle navigation" className="ox-mobile-menu"><Menu size={20}/></Button><Brand/></div>
    <div className="ox-nav-context"><Factory size={15}/><span>Manufacturing workspace</span></div>
    <div className="ox-nav-tools">
      <span className="ox-nav-live"><i/>LIVE</span>
      <LiveClock/>
      <ThemeToggle/>
      <div className="ox-nav-account"><div><b>{user?.username||'Workspace'}</b><small>{user?.role_name||'Authenticated session'}</small></div><Button variant="light" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={18}/></Button></div>
    </div>
  </header>
}
