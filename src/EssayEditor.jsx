import React, { useRef } from 'react';
export function EssayEditor({essay,setEssay,consent,setConsent,busy,onSubmit,onDemo,error,ready,onError}) {
  const fileInput=useRef(null);
  const words=essay.trim()?essay.trim().split(/\s+/u).length:0;
  async function importText(event) {
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    if(!file.name.toLowerCase().endsWith('.txt')) return onError('请导入 UTF-8 编码的 TXT 文件。');
    if(file.size>80000)return onError('文件过大，请导入 3,000 个单词以内的文书。');
    try {const text=await file.text();if(text.length>18000)return onError('文书超过 18,000 个字符，请缩短后再试。');setEssay(text);onError('');}catch{onError('文件读取失败，请直接粘贴正文。');}
  }
  return <section className="editor" aria-labelledby="editor-title">
    <div className="section-heading"><h2 id="editor-title">你的文书</h2><button className="button small secondary" onClick={()=>fileInput.current.click()} disabled={busy}>导入 TXT</button><input ref={fileInput} type="file" accept=".txt,text/plain" hidden onChange={importText}/></div>
    <form onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="essay">英文个人文书正文</label>
      <textarea id="essay" value={essay} onChange={e=>setEssay(e.target.value)} disabled={busy} placeholder="在这里粘贴英文个人文书…" spellCheck="false" maxLength={18001}/>
      <div className="editor-meta"><span className={words>3000||essay.length>18000?'error-text':''}>{words.toLocaleString()} words<span className="character-count"> · {essay.length.toLocaleString()} 字符</span></span><button type="button" className="button small secondary" disabled={busy||!essay} onClick={()=>setEssay('')}>清空</button></div>
      <label className="consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/><span>我同意将正文发送至 TypeSafe 进行评价。<a href="#privacy">隐私说明</a></span></label>
      <div className="actions"><button className="button primary" type="submit" disabled={busy||ready===false}>{busy?<><span className="spinner"/>Jev 正在评价…</>:'开始评价'}</button><button className="button secondary" type="button" disabled={busy} onClick={onDemo}>查看示例</button></div>
      <p className="microcopy">正文仅用于本次评价，不保存在本站。</p>
      <p className="input-hint">支持英文本科个人文书，最多 3,000 words。请去掉姓名、联系方式与文外评价。</p>
      {ready===false&&<p className="notice">评价服务尚未配置完成。你仍可以查看示例和完整评分标准。</p>}
      {error&&<p role="alert" className="error-message">{error}</p>}
      {busy&&<p role="status" className="notice">已提交完整正文，正在等待六个维度的评分，请保持页面打开。</p>}
    </form>
  </section>;
}
