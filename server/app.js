import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { buildRequest, parseEvaluation, validateEssay, rubric, rubricVersion, rubricHash } from './evaluation.js';

export function createApp({ apiKey = process.env.TYPESAFE_API_KEY, fetchImpl = fetch, dailyLimit = Number(process.env.DAILY_EVALUATION_LIMIT || 100), rateMax = 6 } = {}) {
  const app = express();
  let day = '', used = 0, inFlight = 0;
  app.disable('x-powered-by');
  // Render terminates TLS and appends the client address at its reverse proxy.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));
  app.use(helmet({ contentSecurityPolicy: { directives: { 'script-src': ["'self'"], 'style-src': ["'self'", "'unsafe-inline'"], 'img-src': ["'self'", 'data:', 'blob:'], 'connect-src': ["'self'"], 'object-src': ["'none'"] } } }));
  app.use('/api', (_req,res,next) => {res.set('Cache-Control','no-store');next();});
  app.use(express.json({ limit: '80kb' }));
  app.get('/health', (_req,res) => res.json({ status: 'ok' }));
  app.get('/api/config', (_req,res) => res.json({ ready: Boolean(apiKey), model: rubric.model, rubricVersion, maxChars:18000, maxWords:3000 }));
  app.get('/api/rubric', (_req,res) => res.json({ ...rubric, rubricVersion, rubricHash }));
  const limiter = rateLimit({ windowMs: 60*60*1000, limit: rateMax, standardHeaders: 'draft-8', legacyHeaders: false, message: {error:'当前网络每小时最多评价 6 次，请稍后再试。'} });
  app.post('/api/evaluate', limiter, async (req,res) => {
    const origin = req.get('origin');
    if (origin) { try { if (new URL(origin).host !== req.get('host')) return res.status(403).json({error:'请从本站页面提交评价。'}); } catch {return res.status(403).json({error:'无效请求来源。'});} }
    const invalid = validateEssay(req.body);
    if (invalid) return res.status(400).json({error:invalid});
    if (!apiKey) return res.status(503).json({error:'评价服务尚未配置完成，请稍后再试。示例与评分标准仍可查看。'});
    const today = new Date().toISOString().slice(0,10);
    if (today !== day) {day=today;used=0;}
    if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || used >= dailyLimit) return res.status(429).json({error:'本站本日的评价额度已用完，请明天再来。'});
    if (inFlight >= 3) return res.status(429).json({error:'现在有较多文书正在评价，请稍后重试。'});
    used++; inFlight++;
    try {
      const upstream = await fetchImpl('https://api.typesafe.ai/v1/systemone', {method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(buildRequest(req.body.essay.trim())),signal:AbortSignal.timeout(45000)});
      if (!upstream.ok) {
        const error = upstream.status === 429 || upstream.status === 529 ? 'Jev 暂时繁忙或额度不足，请稍后再试。' : 'Jev 评价服务暂时不可用，请稍后再试。';
        return res.status(502).json({error});
      }
      const result = parseEvaluation(await upstream.json());
      res.json(result);
    } catch (error) {
      res.status(error.name === 'TimeoutError' ? 504 : 502).json({error: error.name === 'TimeoutError' ? '本次评价超时，请稍后重试。' : '未能取得完整的六维评分，请稍后重试。'});
    } finally { inFlight--; }
  });
  app.use('/api', (_req,res) => res.status(404).json({error:'接口不存在。'}));
  app.use(express.static(fileURLToPath(new URL('../dist', import.meta.url))));
  app.use((error,_req,res,_next) => res.status(error.type === 'entity.too.large' ? 413 : 400).json({error: error.type === 'entity.too.large' ? '提交内容过大，请缩短文书。' : '请求格式不正确。'}));
  return app;
}
