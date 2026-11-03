type Cell = string | number

function escapeCSV(value: Cell) {
  const text = String(value)
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function escapeHTML(value: Cell) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function exportToExcel(filename: string, headers: string[], rows: Cell[][]) {
  const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportToPDF(title: string, subtitle: string, headers: string[], rows: Cell[][]) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHTML(title)}</title>
<style>
  body{font-family:Georgia,serif;color:#2b2419;padding:40px}
  h1{font-size:26px;margin:0 0 4px;font-weight:600}
  p{margin:0 0 24px;color:#7a6a50;font-family:Arial,sans-serif;font-size:12px}
  .rule{height:2px;background:linear-gradient(90deg,#b08d4a,transparent);margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px}
  th{text-align:left;background:#f6efe1;color:#5c4a2a;padding:8px;border-bottom:1px solid #d9c9a5}
  td{padding:8px;border-bottom:1px solid #eee5d3}
</style></head><body>
<h1>${escapeHTML(title)}</h1><p>${escapeHTML(subtitle)}</p><div class="rule"></div>
<table><thead><tr>${headers.map((h) => `<th>${escapeHTML(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHTML(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
</body></html>`

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  if (!doc) return
  doc.open()
  doc.write(html)
  doc.close()
  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => iframe.remove(), 1000)
  }, 250)
}
