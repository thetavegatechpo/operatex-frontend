import api from "../../../../shared/api/client.js";
export async function getWorkspaceContext(){
 const response=await api.get("/company-master/workspace-context");
 return response.data.data;
}
export function getSelectedLocation(context){
 const choices=context?.locations?.filter(x=>x.line_id)||[];
 if(!choices.length)return null;
 const key=`operatex:workspace-line:${context.company_id}`;
 const preferred=sessionStorage.getItem(key);
 return choices.find(x=>x.line_id===preferred)||choices[0];
}
export function saveSelectedLocation(context,lineId){
 if(!context?.company_id||!context.locations.some(x=>x.line_id===lineId))throw new Error('Line is not assigned to this company');
 sessionStorage.setItem(`operatex:workspace-line:${context.company_id}`,lineId);
}
