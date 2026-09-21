import React from 'react';
import { Radar } from './Radar';
import { DIMENSIONS } from './data';
import { downloadReport } from './report';
export function EvaluationReport({result,selected,onSelect,rubric,stale,busy}) {
  const dimension=DIMENSIONS.find(d=>d.id===selected);
  const answer=result?.dimensions.find(d=>d.id===selected);
  return <section className="report" aria-labelledby="report-title" aria-busy={busy}>
    <div className="report-top"><div><h2 id="report-title">六维画像</h2><p className="report-subtitle" role="status">{result?.demo?'示例报告 · 非实时评价':result?`${result.model} · 本次评价`:'完成评价后，在这里看见你的文书'}</p></div><div className="total">{result?result.total.toFixed(1):'—'}<span> /100</span></div></div>
    {stale&&<p className="notice">正文已修改。以下仍为修改前的结果，请重新评价。</p>}
    <Radar dimensions={result?.dimensions} selected={selected} onSelect={onSelect}/>
    <div className="dimension-grid">{DIMENSIONS.map(d=>{const a=result?.dimensions.find(x=>x.id===d.id);return <button className={`dimension ${selected===d.id?'active':''}`} key={d.id} onClick={()=>onSelect(d.id)} aria-pressed={selected===d.id}><span className="dimension-name">{d.label}</span><span className="dimension-bottom"><span className="bar"><span style={{width:`${a?a.score/9*100:0}%`}}/></span><span className="score">{a?a.score.toFixed(2):'—'}<small> /9</small></span></span></button>;})}</div>
    <div className="export-row"><button disabled={!result} onClick={()=>downloadReport(result,rubric)} className="text-button"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/></svg>导出报告</button>{result&&!result.demo&&<button className="text-button" onClick={()=>window.print()}>打印 / PDF</button>}</div>
    {result&&<div className="dimension-detail"><h3>{dimension.label}</h3><p>{dimension.description}</p><p className="reading-prompt"><strong>复读提示</strong> {dimension.prompt}</p><p className="microcopy">提示来自预设量表，不是 Jev 生成的逐句评语。</p>{answer?.probabilities&&<details><summary>查看档位分布与模型置信度</summary><p className="microcopy">置信度 {(answer.confidence*100).toFixed(0)}% 表示分布集中程度，不是正确率或录取概率。</p><div className="probabilities">{answer.probabilities.map((p,i)=><div key={i}><span>{i} 档</span><meter min="0" max="1" value={p}/><span>{(p*100).toFixed(0)}%</span></div>)}</div></details>}</div>}
  </section>;
}
