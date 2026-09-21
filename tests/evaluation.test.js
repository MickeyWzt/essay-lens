import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { buildRequest, parseEvaluation, rubric, ids } from '../server/evaluation.js';

const cookies = new Map();
const essay = 'An original fictional essay for testing. '.repeat(8);
function response(score=7) {return {model:rubric.model,answers:Object.fromEntries(ids.map(id=>[id,{type:'score',score,confidence:1,probabilities:Object.fromEntries(Array.from({length:10},(_,i)=>[String(i),i===score?1:0]))}]))};}
async function withServer(options,fn) {const server=createApp(options).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url=`http://127.0.0.1:${server.address().port}`;try {const config=await fetch(url+'/api/config');cookies.set(url,config.headers.get('set-cookie').split(';')[0]);await fn(url);} finally {cookies.delete(url);await new Promise(r=>server.close(r));}}
const post=(url,body)=>fetch(url+'/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookies.get(url)},body:JSON.stringify(body)});

test('fixed original six-dimension rubric and exact essay state',()=>{const r=buildRequest('Paragraph one.\n\nParagraph two.');assert.equal(r.model,'jev-1.13.0');assert.equal(r.state.essay,'Paragraph one.\n\nParagraph two.');assert.equal(r.state.task_context,rubric.context);assert.deepEqual(Object.keys(r.questions),['portrait','evidence','insight','structure','voice','language']);assert.ok(Object.values(r.questions).every(q=>q.criteria.length===10));});
test('equal weight total retains raw precision and valid zero',()=>{assert.equal(parseEvaluation(response(9)).total,100);assert.equal(parseEvaluation(response(0)).total,0);assert.ok(Math.abs(parseEvaluation(response(7)).total-77.777777777)<0.00001);});
test('incomplete, malformed, out of range or wrong model never produces a report',()=>{for(const mutate of [r=>delete r.answers.voice,r=>r.answers.portrait.score=10,r=>r.answers.portrait.score='8',r=>r.answers.portrait.confidence=2,r=>r.answers.portrait.probabilities={'0':1},r=>r.model='other']){const r=response();mutate(r);assert.throws(()=>parseEvaluation(r));}});
test('real route forwards only fixed request, strips body overrides, returns no essay/key',async()=>{let captured;await withServer({apiKey:'test-secret',fetchImpl:async(url,opts)=>{captured={url,opts};return Response.json(response());}},async url=>{const res=await post(url,{essay,consent:true,model:'fake',questions:{},apiKey:'client-key'});assert.equal(res.status,200);const data=await res.json();assert.equal(data.dimensions.length,6);assert.equal(captured.url,'https://api.typesafe.ai/v1/systemone');assert.equal(captured.opts.headers.Authorization,'Bearer test-secret');assert.deepEqual(JSON.parse(captured.opts.body),buildRequest(essay.trim()));assert.ok(!JSON.stringify(data).includes(essay));assert.ok(!JSON.stringify(data).includes('test-secret'));assert.equal(res.headers.get('cache-control'),'no-store');});});
test('consent, empty/oversized essays and cross-origin requests do not call provider',async()=>{let calls=0;await withServer({apiKey:'test',rateMax:20,fetchImpl:async()=>{calls++;return Response.json(response());}},async url=>{for(const body of [{essay,consent:false},{essay:'',consent:true},{essay:'x'.repeat(18001),consent:true},{essay:'x '.repeat(3001),consent:true}])assert.equal((await post(url,body)).status,400);const cross=await fetch(url+'/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body:JSON.stringify({essay,consent:true})});assert.equal(cross.status,403);assert.equal(calls,0);});});
test('no key gives service unavailable, never demo scores',async()=>{await withServer({apiKey:''},async url=>{assert.equal((await post(url,{essay,consent:true})).status,503);assert.equal((await (await fetch(url+'/api/config')).json()).ready,false);});});
test('daily call limit reserves before fetch and never exceeds cap',async()=>{let calls=0;await withServer({apiKey:'test',dailyLimit:1,fetchImpl:async()=>{calls++;return Response.json(response());}},async url=>{const res=await Promise.all([post(url,{essay,consent:true}),post(url,{essay,consent:true})]);assert.deepEqual(res.map(r=>r.status).sort(),[200,429]);assert.equal(calls,1);});});
test('upstream errors hide vendor payload and credentials; malformed response fails closed',async()=>{for(const upstream of [new Response('test-secret',{status:401}),Response.json({answers:{}})])await withServer({apiKey:'test-secret',fetchImpl:async()=>upstream},async url=>{const res=await post(url,{essay,consent:true});assert.equal(res.status,502);assert.ok(!(await res.text()).includes('test-secret'));});});
test('per IP rate limit blocks excess requests',async()=>{await withServer({apiKey:'test',rateMax:1,fetchImpl:async()=>Response.json(response())},async url=>{assert.equal((await post(url,{essay,consent:true})).status,200);assert.equal((await post(url,{essay,consent:true})).status,429);});});

test('three evaluations per browser, independent browsers on same campus IP, and Beijing midnight reset', async()=>{
  let timestamp=Date.parse('2026-09-21T15:59:59Z'), calls=0;
  await withServer({apiKey:'test',rateMax:30,now:()=>timestamp,fetchImpl:async()=>{calls++;return Response.json(response());}}, async url=>{
    const submit=(cookie=cookies.get(url))=>fetch(url+'/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':'203.0.113.10',Cookie:cookie},body:JSON.stringify({essay,consent:true})});
    for(let i=0;i<3;i++)assert.equal((await submit()).status,200);
    const blocked=await submit();assert.equal(blocked.status,429);assert.equal((await blocked.json()).code,'DAILY_FREE_LIMIT');assert.equal(blocked.headers.get('retry-after'),'1');assert.equal(calls,3);
    const otherBrowser=await fetch(url+'/api/config');
    assert.equal((await submit(otherBrowser.headers.get('set-cookie').split(';')[0])).status,200);
    timestamp+=1000;assert.equal((await submit()).status,200);
    const config=await (await fetch(url+'/api/config')).json();assert.equal(config.dailyFreeLimit,3);assert.equal(config.quotaScope,'browser');
  });
});
test('missing or forged browser cookie cannot call Jev; cookies are HttpOnly and SameSite',async()=>{
  let calls=0;
  await withServer({apiKey:'test',fetchImpl:async()=>{calls++;return Response.json(response());}},async url=>{
    const config=await fetch(url+'/api/config');const cookie=config.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);
    for(const cookieValue of ['', 'essay_browser='+ 'a'.repeat(32)+'.'+'b'.repeat(64)]){
      const res=await fetch(url+'/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookieValue},body:JSON.stringify({essay,consent:true})});
      assert.equal(res.status,400);assert.equal((await res.json()).code,'BROWSER_SESSION_REQUIRED');
    }
    assert.equal(calls,0);
  });
});
test('provider failure refunds visitor quota while concurrent requests reserve it', async()=>{
  let calls=0;
  await withServer({apiKey:'test',rateMax:30,fetchImpl:async()=>{calls++;if(calls===1)return new Response('failure',{status:503});await new Promise(r=>setTimeout(r,30));return Response.json(response());}},async url=>{
    assert.equal((await post(url,{essay,consent:true})).status,502);
    const results=await Promise.all(Array.from({length:4},()=>post(url,{essay,consent:true})));
    assert.deepEqual(results.map(r=>r.status).sort(),[200,200,200,429]);assert.equal(calls,4);
  });
});
