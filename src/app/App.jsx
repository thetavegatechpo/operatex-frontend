import React,{Suspense} from 'react';
import {BrowserRouter} from 'react-router-dom';
import AppRoutes from './routes.jsx';
import WorkspaceBoundary from '../shared/components/WorkspaceBoundary.jsx';
export default function App(){return <WorkspaceBoundary><BrowserRouter><Suspense fallback={<div className="ox-visual-empty" role="status">Loading workspace…</div>}><AppRoutes/></Suspense></BrowserRouter></WorkspaceBoundary>}
