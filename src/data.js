export const DIMENSIONS = [
  { id:'portrait', label:'人物呈现', description:'文章让读者看见了怎样的你：价值观、视角、兴趣，以及与他人的关系。', prompt:'读完后，读者能否描述一个具体的人，而不仅是一项活动？' },
  { id:'evidence', label:'细节支撑', description:'细节、观察、例子和行动，是否真正支撑了文章想表达的个人意义。', prompt:'标出最重要的个人观点，检查正文中有哪些具体材料支持它。' },
  { id:'insight', label:'理解与洞察', description:'你如何理解经历的意义；身份、延续性、复杂性和未解的矛盾都可以成为洞察。', prompt:'找出解释“这为什么对我有意义”的段落，检查它是否超越了通用道理。' },
  { id:'structure', label:'结构连贯', description:'段落的顺序、比重和连接，是否共同服务于这篇文章的目的。', prompt:'用一句话概括每段的作用，检查重要连接是否已有充分铺垫。' },
  { id:'voice', label:'个人声音', description:'文字中的视角是否自然、鲜明；平实、抒情、分析或幽默都可以成立。', prompt:'大声读一遍：哪些观察只属于你，哪些表达换成别人也完全成立？' },
  { id:'language', label:'语言表达', description:'表达是否清楚、准确、简洁；不因华丽词汇或某种文风额外加分。', prompt:'检查需要回读的句子，以及删去后不影响意思的解释和重复。' },
];
const scores = [7.8,7.3,7.1,8.0,6.9,7.4];
export const DEMO = {
  demo:true, model:'界面演示', rubricVersion:'neutral-six-v1',
  dimensions: DIMENSIONS.map((d,i) => ({ ...d, score:scores[i] })),
  total:scores.reduce((a,b)=>a+b,0)/54*100,
};
