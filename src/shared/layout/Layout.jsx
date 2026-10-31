import React,{useState,useEffect,Suspense} from 'react';
import {Outlet,useLocation} from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import WorkspaceBoundary from '../components/WorkspaceBoundary.jsx';
import './Layout.css';
import '../design/editorial.css';
export default function Layout(){const [mobileOpen,setMobileOpen]=useState(false);const {pathname}=useLocation();useEffect(()=>{setMobileOpen(false)},[pathname]);useEffect(()=>{const close=e=>{if(e.key==='Escape')setMobileOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);return <div className={`app-layout ${mobileOpen?'ox-menu-open':''}`}><a className="ox-skip" href="#workspace-content">Skip to workspace</a><Navbar onMenu={()=>setMobileOpen(v=>!v)}/><div className="app-body">{mobileOpen&&<button className="ox-menu-backdrop" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}<Sidebar/><main id="workspace-content" className="app-content" tabIndex={-1}><WorkspaceBoundary key={pathname}><Suspense fallback={<div className="ox-visual-empty" role="status">Loading module…</div>}><Outlet/></Suspense></WorkspaceBoundary></main></div></div>}
