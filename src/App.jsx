import React, { useEffect, useRef, useState } from 'react';
import { EssayEditor } from './EssayEditor';
import { EvaluationReport } from './EvaluationReport';
import { RubricPanel } from './RubricPanel';
import { DEMO } from './data';
export default function App() {
  const [essay,setEssay]=useState(''),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [result,setResult]=useState(null),[evaluatedEssay,setEvaluatedEssay]=useState(null),[selected,setSelected]=useState('portrait');
  const [config,setConfig]=useState(null),[rubric,setRubric]=useState(null),[rubricError,setRubricError]=useState(false);
  const submitting=useRef(false);
  useEffect(()=>{fetch('/api/config').then(r=>{if(!r.ok)throw Error();return r.json();}).then(setConfig).catch(()=>setError('暂时无法连接服务器，请刷新页面后再试。'));fetch('/api/rubric').then(r=>{if(!r.ok)throw Error();return r.json();}).then(setRubric).catch(()=>setRubricError(true));},[]);
  async function evaluate(event) {
    event.preventDefault();if(submitting.current)return;setError('');
    if(essay.trim().length<100)return setError('请粘贴完整文书，正文至少需要 100 个字符。');
    if(essay.length>18000||essay.trim().split(/\s+/u).length>3000)return setError('单次最多支持 3,000 个单词、18,000 个字符。');
    if(!consent)return setError('请先同意将正文发送至 TypeSafe 进行评价。');
    submitting.current=true;setBusy(true);const submitted=essay;
    try {const response=await fetch('/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({essay:submitted,consent:true}),signal:AbortSignal.timeout(55000)});const data=await response.json();if(!response.ok)throw new Error(data.error||'评价失败，请稍后再试。');setResult(data);setEvaluatedEssay(submitted);setSelected('portrait');}
    catch(e){setError(e.name==='TimeoutError'?'等待超时，请稍后重试。':e.message==='Failed to fetch'?'网络连接中断，请检查网络后重试。':e.message);}
    finally{submitting.current=false;setBusy(false);}
  }
  return <div className="page"><header><a className="brand" href="#workspace" aria-label="见文首页"><span>见文</span><small>ESSAY LENS</small></a><nav aria-label="主导航"><a className="current" href="#workspace">评价工作台</a><a href="#rubric">评分标准</a></nav></header><main><section className="intro" id="workspace"><h1>让你的故事，被更清楚地看见。</h1><p>六个维度，读懂一篇文书。基于 Jev 的个人文书评价。</p></section><div className="workspace"><EssayEditor essay={essay} setEssay={setEssay} consent={consent} setConsent={setConsent} busy={busy} onSubmit={evaluate} onDemo={()=>{setResult(DEMO);setError('');setEvaluatedEssay(null);}} error={error} ready={config?.ready} onError={setError}/><EvaluationReport result={result} selected={selected} onSelect={setSelected} rubric={rubric} stale={result&&!result.demo&&evaluatedEssay!==essay} busy={busy}/></div><div className="method-note">评价写作，不预测录取。六维等权，十档标准。<span>量表 neutral-six-v1</span></div><RubricPanel rubric={rubric} error={rubricError}/><section id="privacy" className="privacy"><h2>你的故事，由你掌握。</h2><p>提交时，正文通过本站服务器发送至 TypeSafe / Jev。本站不保存正文或评价记录，不使用分析追踪工具；刷新或关闭页面后，本页内容会丢失。导出报告不包含文书正文。请勿提交他人的私密信息。</p><p>TypeSafe 对数据的处理适用其 <a href="https://typesafe.ai/legal/privacy-policy" target="_blank" rel="noreferrer">隐私政策</a>。托管平台可能保留 IP、请求时间等常规访问日志。模型评分不验证事实，不检测 AI 代写；微小分差不宜被当作确定的提升或退步。</p></section></main><footer><span>见文 <span className="footer-en">ESSAY LENS</span></span><span>给文字一点距离，给自己一个新视角。</span></footer></div>;
}
