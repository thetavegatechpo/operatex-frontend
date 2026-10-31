const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {parse} = require('@babel/parser');
const root = path.resolve(__dirname, '..');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
let files=0, imports=0, tests=0;
function visit(node, fn) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(x=>visit(x,fn));
  fn(node);
  for (const [key,value] of Object.entries(node)) if (!['loc','tokens','comments'].includes(key)) visit(value,fn);
}
for (const file of walk(path.join(root,'src')).filter(f=>/\.(js|jsx)$/.test(f))) {
  files++;
  visit(parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']}), node=>{
    if (!['ImportDeclaration','ExportNamedDeclaration','ExportAllDeclaration'].includes(node.type) || !node.source?.value.startsWith('.')) return;
    const target=path.resolve(path.dirname(file),node.source.value);
    assert.ok(['','.js','.jsx','/index.js','/index.jsx'].some(ext=>fs.existsSync(target+ext)),`Missing import: ${file} -> ${node.source.value}`);
    imports++;
  });
}
const check = (name, fn) => { fn(); tests++; console.log(`PASS ${name}`); };
const values = new Map();
const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
const authSource=fs.readFileSync(path.join(root,'src/features/auth/utils/auth.jsx'),'utf8').replace(/\bexport\s+/g,'');
const auth = vm.createContext({localStorage,atob,Date,JSON,Number});
vm.runInContext(authSource+';globalThis.auth={getToken,getUser,saveToken,saveUser,logout,tokenExpired};',auth);
const jwt=exp=>'header.'+Buffer.from(JSON.stringify({exp})).toString('base64url')+'.signature';
check('valid JWT retained',()=>{auth.auth.saveToken(jwt(Date.now()/1000+3600));assert.ok(auth.auth.getToken());});
check('expired JWT clears token and user',()=>{auth.auth.saveUser({id:1});auth.auth.saveToken(jwt(1));assert.equal(auth.auth.getToken(),null);assert.equal(auth.auth.getUser(),null);});
check('malformed JWT rejected',()=>assert.equal(auth.auth.tokenExpired('bad-token'),true));
check('JWT without expiry rejected',()=>assert.equal(auth.auth.tokenExpired('h.'+Buffer.from('{}').toString('base64url')+'.s'),true));
check('corrupt saved user handled',()=>{localStorage.setItem('operatex_user','broken json');assert.equal(auth.auth.getUser(),null);});
check('non-object saved user handled',()=>{localStorage.setItem('operatex_user','[]');assert.equal(auth.auth.getUser(),null);});
check('logout clears both stored values',()=>{auth.auth.saveToken(jwt(Date.now()/1000+3600));auth.auth.saveUser({id:2});auth.auth.logout();assert.equal(values.size,0);});
let request, reject, cleared=0, redirected='', events=0;
const api={interceptors:{request:{use:fn=>request=fn},response:{use:(_ok,fn)=>reject=fn}}};
const clientSource=fs.readFileSync(path.join(root,'src/shared/api/client.js'),'utf8').replace(/^import .*;\s*$/gm,'').replace('import.meta.env.BASE_URL',JSON.stringify('/')).replace('export default api;','');
vm.runInNewContext(clientSource,{axios:{create:()=>api},API_BASE_URL:'/api',getToken:()=> 'token',logout:()=>cleared++,Event,window:{dispatchEvent:()=>events++,location:{pathname:'/dashboard',assign:url=>redirected=url}}});
check('protected requests attach bearer token',()=>assert.equal(request({url:'/loss-tree/report',headers:{}}).headers.Authorization,'Bearer token'));
check('login requests omit bearer token',()=>assert.equal(request({url:'/auth/login',headers:{}}).headers.Authorization,undefined));
async function checkError(status,url) {const err={response:{status},config:{url}};await assert.rejects(reject(err), e=>e===err);}
(async()=>{
  await checkError(401,'/auth/login');check('invalid login stays on form',()=>{assert.equal(cleared,0);assert.equal(redirected,'');});
  await checkError(403,'/loss-tree/report');check('forbidden response keeps session',()=>assert.equal(cleared,0));
  await checkError(401,'/loss-tree/report');check('unauthorized response clears session and redirects',()=>{assert.equal(cleared,1);assert.equal(events,1);assert.equal(redirected,'/login');});
  console.log(JSON.stringify({sourceFilesParsed:files,relativeImportsResolved:imports,regressionChecksPassed:tests}));
})().catch(error=>{console.error(error);process.exitCode=1;});
