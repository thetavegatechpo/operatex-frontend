import React from 'react';
import {Button} from 'react-bootstrap';
import {SquarePen,Trash2,Play,History,FileChartColumn,Download} from 'lucide-react';
export default function ActionButtons({showEdit=true,showDelete=true,showExecute=false,showRuntime=false,showReport=false,showExport=false,onEdit,onDelete,onExecute,onRuntime,onReport,onExport}){
 const actions=[{show:showEdit,label:'Edit',Icon:SquarePen,variant:'outline-primary',click:onEdit},{show:showDelete,label:'Delete',Icon:Trash2,variant:'outline-danger',click:onDelete},{show:showExecute,label:'Execute',Icon:Play,variant:'outline-success',click:onExecute},{show:showRuntime,label:'Runtime history',Icon:History,variant:'outline-warning',click:onRuntime},{show:showReport,label:'Report',Icon:FileChartColumn,variant:'outline-info',click:onReport},{show:showExport,label:'Export',Icon:Download,variant:'outline-secondary',click:onExport}];
 return <>{actions.filter(a=>a.show).map(({label,Icon,variant,click})=><Button key={label} type="button" size="sm" variant={variant} className="me-2" title={label} aria-label={label} onClick={click}><Icon size={15}/></Button>)}</>;
}
