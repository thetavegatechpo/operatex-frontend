import api from "../../../../shared/api/client.js";
const base="/gauge-sensor-adapter";
const service={getConfig:(params={})=>api.get(`${base}/config`,{params}),saveConfig:data=>api.post(`${base}/config`,data),getMaster:(params={})=>api.get(`${base}/master`,{params}),createMaster:data=>api.post(`${base}/master`,data),updateMaster:(id,data)=>api.put(`${base}/master/${encodeURIComponent(id)}`,data),getRuntime:(params={})=>api.get(`${base}/runtime`,{params}),execute:data=>api.post(`${base}/execute`,data),getReport:(params={})=>api.get(`${base}/report`,{params}),export:data=>api.post(`${base}/export`,data,{responseType:"blob"})};
export default service;
