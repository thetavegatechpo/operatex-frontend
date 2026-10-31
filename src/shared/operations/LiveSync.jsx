import React from 'react';
import {RefreshCw,Radio} from 'lucide-react';
import './operations.css';
export default function LiveSync({status}){return <div className={`nx-sync ${status?.error?'stale':''}`} role="status"><span><Radio size={13}/>LIVE STUDIO · FOREGROUND REFRESH</span><small>{status?.error?`Refresh failed · last data retained: ${status.error}`:status?.fetching?<><RefreshCw size={11} className="nx-spin"/>Updating…</>:status?.updatedAt?`Updated ${new Date(status.updatedAt).toLocaleTimeString('en-IN')} · every 15s`:'Refreshes every 15s while this view is open'}</small></div>}
