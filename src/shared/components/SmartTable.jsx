import React,{Children,isValidElement,cloneElement,useState} from 'react';
import {Table} from 'react-bootstrap';
import {Search,ChevronLeft,ChevronRight} from 'lucide-react';
function flatten(children){return Children.toArray(children).flatMap(c=>isValidElement(c)&&c.type===React.Fragment?flatten(c.props.children):[c]);}
function text(node){if(node==null||typeof node==='boolean')return '';if(typeof node==='string'||typeof node==='number')return String(node);if(Array.isArray(node))return node.map(text).join(' ');return isValidElement(node)?text(node.props.children):'';}
export default function SmartTable({children,paginate=true,...props}){
 const [query,setQuery]=useState(''),[page,setPage]=useState(1),[size,setSize]=useState(20);
 const nodes=flatten(children),body=nodes.find(n=>isValidElement(n)&&n.type==='tbody');
 const rows=body?flatten(body.props.children):[];
 const dataRows=rows.filter(r=>isValidElement(r)&&r.type==='tr');
 const enabled=paginate&&dataRows.length>20;
 if(!enabled)return <Table {...props}>{children}</Table>;
 const matches=dataRows.filter(r=>text(r).toLowerCase().includes(query.trim().toLowerCase()));
 const pages=Math.max(1,Math.ceil(matches.length/size)),current=Math.min(page,pages);
 const visible=matches.slice((current-1)*size,current*size);
 const colspan=Math.max(1,Children.count(dataRows[0]?.props.children));
 return <div className="ox-data-grid"><div className="ox-table-tools"><label><Search size={15}/><input aria-label="Search loaded table rows" placeholder="Search loaded rows…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></label><small>{matches.length} of {dataRows.length} loaded rows</small></div><Table {...props}>{nodes.map(n=>n===body?cloneElement(body,{},visible.length?visible:<tr><td colSpan={colspan} className="text-center p-4">No matching loaded rows.</td></tr>):n)}</Table><div className="ox-table-footer"><span>{matches.length?`${(current-1)*size+1}–${Math.min(current*size,matches.length)}`:'0'} of {matches.length} loaded rows</span><label>Rows <select aria-label="Rows per page" value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1)}}>{[10,20,50,100].map(n=><option key={n}>{n}</option>)}</select></label><div><button type="button" aria-label="Previous page" disabled={current<=1} onClick={()=>setPage(current-1)}><ChevronLeft size={16}/></button><span>{current} / {pages}</span><button type="button" aria-label="Next page" disabled={current>=pages} onClick={()=>setPage(current+1)}><ChevronRight size={16}/></button></div></div></div>;
}
