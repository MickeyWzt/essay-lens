import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const rubric = JSON.parse(readFileSync(new URL('./rubric.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
export const rubricVersion = 'neutral-six-v1';
export const rubricHash = createHash('sha256').update(JSON.stringify(rubric)).digest('hex');
export const ids = Object.keys(rubric.questions);
export const labels = ['人物呈现', '细节支撑', '理解与洞察', '结构连贯', '个人声音', '语言表达'];
export function buildRequest(essay) {
  return { model: rubric.model, state: { task_context: rubric.context, essay }, questions: rubric.questions };
}
export function validateEssay(body) {
  if (body?.consent !== true) return '请先同意将正文发送至 TypeSafe 进行评价。';
  if (typeof body.essay !== 'string') return '请输入文书正文。';
  const essay = body.essay.trim();
  if (essay.length < 100) return '正文至少需要 100 个字符，请粘贴完整文书。';
  if (essay.length > 18000 || essay.split(/\s+/u).length > 3000) return '单次最多支持 3,000 个单词、18,000 个字符。';
  return null;
}
export function parseEvaluation(response) {
  if (response?.model !== rubric.model) throw new Error('Unexpected model');
  const dimensions = ids.map((id, index) => {
    const answer = response.answers?.[id];
    if (answer?.type !== 'score' || typeof answer.score !== 'number' || !Number.isFinite(answer.score) || answer.score < 0 || answer.score > 9) throw new Error('Invalid score');
    if (typeof answer.confidence !== 'number' || !Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1) throw new Error('Invalid confidence');
    const probabilities = Array.from({ length: 10 }, (_, level) => answer.probabilities?.[String(level)]);
    if (probabilities.some(p => typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) || Math.abs(probabilities.reduce((a,b) => a+b, 0)-1) > 0.06) throw new Error('Invalid probabilities');
    return { id, label: labels[index], score: answer.score, confidence: answer.confidence, probabilities };
  });
  return { model: response.model, rubricVersion, rubricHash, createdAt: new Date().toISOString(), dimensions, total: dimensions.reduce((sum,d) => sum+d.score,0)/54*100, aggregation: rubric.aggregation };
}
