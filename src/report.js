import { DIMENSIONS } from './data';
export function downloadReport(result,rubric) {
  const text=[ '# 见文 · 六维文书评价报告', '',result.demo?'界面示例：以下数值仅用于演示，不是 Jev 实时评价。':`模型：${result.model}\n评价时间：${result.createdAt}`,`量表：${result.rubricVersion}`,`综合分：${result.total.toFixed(1)} / 100`, '', '| 维度 | 分数（满分9） |', '| --- | ---: |', ...result.dimensions.map(d=>`| ${d.label} | ${d.score.toFixed(2)} |`), '', '综合分 = 六项之和 ÷ 54 × 100。各项等权，仅为汇总约定。', '评价针对写作，不预测录取、不验证经历真实性，也不检测 AI 代写。量表未经招生官评分样本校准，单次分数的微小变化不构成可靠改进证据。', '', '## 复读提示', '以下是预设量表提示，不是模型逐句评语。', ...DIMENSIONS.map(d=>`- ${d.label}：${d.prompt}`), '', '## 原始结构化结果（不含文书正文）','```json', JSON.stringify(result,null,2),'```', '', '## 完整评分标准', ...(rubric?Object.entries(rubric.questions).flatMap(([id,q])=>[`### ${DIMENSIONS.find(d=>d.id===id).label}`,q.instructions,...q.criteria.map((c,i)=>`${i}. ${c}`),'']):[]), '基于公开招生建议设计的自定义量表，并非任何学校官方评分表。' ].join('\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`essay-lens-${result.demo?'demo':new Date().toISOString().slice(0,10)}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
