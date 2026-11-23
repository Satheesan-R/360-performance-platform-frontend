import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function client(api, signedIn=true) {
  const source=fs.readFileSync(new URL('../services/account-support.service.ts',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText;
  const context={exports:{},require(name){if(name==='@/lib/api')return {__esModule:true,default:api};if(name==='@/lib/auth')return {getCurrentUser:()=>signedIn?{id:'self',role:'employee'}:null,getToken:()=>signedIn?'test-token':null};throw Error(name);}};
  vm.runInNewContext(code,context);return context.exports;
}
test('creation sends only form fields and preserves backend confirmation and notification outcome',async()=>{
  const body={category:'LOGIN_PASSWORD',subject:'Unable to open dashboard',description:'The dashboard returns an error after login.',requestId:'request-id-for-tests'};
  const result={ticket:{id:'actual-ticket',number:'SUP-123',status:'OPEN'},notification:{status:'failed',message:'Saved; notification unavailable.'}};
  const {supportService}=client({post:async(path,payload,config)=>{assert.equal(path,'/support/tickets');assert.deepEqual(payload,body);assert.equal(config.headers.Authorization,'Bearer test-token');assert.equal('requester' in payload,false);return {data:result};}});
  assert.deepEqual(await supportService.create(body),result);
});
test('failed creation propagates an error rather than simulating success',async()=>{
  const {supportService}=client({post:async()=>{throw Error('Database unavailable');}});
  await assert.rejects(supportService.create({}),/Database unavailable/);
});
test('request lists are paginated and query only the selected scope and queue',async()=>{
  const {supportService}=client({get:async(path,config)=>{assert.equal(path,'/support/tickets');assert.equal(config.params.scope,'queue');assert.equal(config.params.queue,'HR');assert.equal(config.params.page,2);return {data:{tickets:[],page:2,hasMore:false}};}});
  assert.equal((await supportService.list('queue',2,'HR')).page,2);
});
test('replies and reopening send only text or note; access updates remain separate',async()=>{
  const calls=[];const {supportService}=client({post:async(path,body)=>{calls.push([path,Object.keys(body)]);return {data:{ticket:{id:'ticket'}}};},put:async(path,body)=>{assert.equal(path,'/support/memberships');assert.deepEqual(Object.keys(body).sort(),['active','email','queues']);return {data:{message:'Updated'}};}});
  await supportService.message('ticket','A reply');await supportService.reopen('ticket','The issue persists.');
  assert.equal(calls[0][0],'/support/tickets/ticket/messages');assert.equal(calls[0][1].join(','),'text');assert.equal(calls[1][1].join(','),'note');
  await supportService.membership('officer@example.com',['IT'],true);
});
test('signed-out clients cannot call protected support APIs',async()=>{
  const {supportService}=client({},false);await assert.rejects(supportService.context(),/Sign in/);await assert.rejects(supportService.list('mine',1,''),/Sign in/);
});
test('all five supported categories have presentation labels',()=>{
  const {categoryLabels,queueLabels}=client({});assert.equal(Object.keys(categoryLabels).length,5);assert.equal(queueLabels.IT,'IT Support');assert.equal(queueLabels.HR,'HR Support');
});
