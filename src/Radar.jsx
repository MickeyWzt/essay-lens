import React from 'react';
import { DIMENSIONS } from './data';
export function Radar({dimensions,selected,onSelect}) {
  const point=(i,r)=>[260+Math.sin(i*Math.PI/3)*r,190-Math.cos(i*Math.PI/3)*r];
  const polygon=r=>DIMENSIONS.map((_,i)=>point(i,r).join(',')).join(' ');
  return <svg className="radar" viewBox="0 0 520 380" role="img" aria-label={dimensions ? `六维雷达图：${dimensions.map(d=>`${d.label} ${d.score.toFixed(2)} 分`).join('，')}，各项满分 9` : '等待评价的六维雷达图'}>
    <title>文书六维画像，各项满分 9</title>
    {[1,3,5,7,9].map(n=><g key={n}><polygon points={polygon(n/9*142)} fill="none" stroke="#dce3df"/><text x="267" y={190-n/9*142-4} className="axis-number">{n}</text></g>)}
    {DIMENSIONS.map((d,i)=><line key={d.id} x1="260" y1="190" x2={point(i,142)[0]} y2={point(i,142)[1]} stroke="#dce3df"/>)}
    {dimensions && <polygon points={dimensions.map((d,i)=>point(i,d.score/9*142).join(',')).join(' ')} fill="#245b461f" stroke="#245b46" strokeWidth="2.3"/>}
    {dimensions?.map((d,i)=><circle key={d.id} cx={point(i,d.score/9*142)[0]} cy={point(i,d.score/9*142)[1]} r={selected===d.id?5:3.5} fill="#245b46"/>)}
    {DIMENSIONS.map((d,i)=> { const [x,y]=point(i,165);return <text key={d.id} x={x} y={y+5} textAnchor={i===0||i===3?'middle':i<3?'start':'end'} className={`axis-label ${selected===d.id?'selected':''}`} onClick={()=>onSelect(d.id)}>{d.label}</text>; })}
    {!dimensions && <text x="260" y="195" textAnchor="middle" className="empty-chart">等待你的故事</text>}
  </svg>;
}
