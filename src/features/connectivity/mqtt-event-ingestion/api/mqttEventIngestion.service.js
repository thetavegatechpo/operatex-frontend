import api from "../../../../shared/api/client.js";
const root="/mqtt-event-ingestion";
const resource=path=>({list:(params={})=>api.get(`${root}/${path}`,{params}),get:id=>api.get(`${root}/${path}/${encodeURIComponent(id)}`),create:data=>api.post(`${root}/${path}`,data),update:(id,data)=>api.put(`${root}/${path}/${encodeURIComponent(id)}`,data)});
export default {broker:resource("broker"),mapping:resource("mapping"),rule:resource("rule"),inbox:resource("inbox"),errors:resource("errors"),report:resource("report"),ingest:data=>api.post(`${root}/ingest`,data),process:id=>api.post(`${root}/inbox/${encodeURIComponent(id)}/process`,{}),retry:id=>api.post(`${root}/inbox/${encodeURIComponent(id)}/retry`,{}),export:data=>api.post(`${root}/export`,data,{responseType:"blob"})};
