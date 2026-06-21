// Dependency-free "Save as PDF": open a print window with branded HTML and
// trigger the browser's print dialog (users pick "Save as PDF").
import { getCompany } from './config'

export function printDocument(title, bodyHtml) {
  const c = getCompany()
  const w = window.open('', '_blank', 'width=820,height=900')
  if (!w) return
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      *{box-sizing:border-box} body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;color:#0f172a;margin:0;padding:32px}
      .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f766e;padding-bottom:16px;margin-bottom:24px}
      .brand{font-size:22px;font-weight:800;color:#0f766e}
      .muted{color:#64748b;font-size:13px}
      h1{font-size:20px;margin:0 0 4px}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}
      th{ text-align:left;background:#f1f5f9;padding:8px 10px;color:#475569}
      td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
      .right{text-align:right} .total{font-weight:800;font-size:16px}
      .foot{margin-top:32px;color:#94a3b8;font-size:12px;text-align:center}
      @media print{ body{padding:0} }
    </style></head><body>
    <div class="head">
      <div><div class="brand">${c.name}</div><div class="muted">${c.email} · +${c.phone}</div></div>
      <div class="muted right">${new Date().toLocaleDateString()}</div>
    </div>
    ${bodyHtml}
    <div class="foot">Powered by Noby · Famba Fleet</div>
    </body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 350)
}
