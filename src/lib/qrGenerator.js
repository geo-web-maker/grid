// src/lib/qrGenerator.js
// Generates QR code images from asset codes using the qrious library.
// Returns a data URL (PNG) that can be displayed or printed.

export async function generateQRDataUrl(assetCode, size = 300) {
  // Dynamically import qrious to keep bundle light
  const { default: QRious } = await import('qrious')

  const canvas = document.createElement('canvas')
  const qr = new QRious({
    element:    canvas,
    value:      assetCode,
    size:       size,
    background: '#ffffff',
    foreground: '#042C53',
    level:      'H', // high error correction — survives dirty/damaged tags
    padding:    20,
  })

  return canvas.toDataURL('image/png')
}

export async function printQRTag(asset) {
  const dataUrl = await generateQRDataUrl(asset.asset_code, 400)

  const win = window.open('', '_blank')
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Tag — ${asset.asset_code}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: white;
        }
        .tag {
          width: 85mm;
          padding: 8mm;
          border: 2px solid #042C53;
          border-radius: 6mm;
          text-align: center;
          page-break-inside: avoid;
        }
        .org {
          font-size: 9px;
          font-weight: bold;
          color: #042C53;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 3mm;
        }
        .qr { width: 60mm; height: 60mm; }
        .code {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          color: #042C53;
          margin: 3mm 0 1mm;
          letter-spacing: 0.05em;
        }
        .name {
          font-size: 11px;
          color: #444;
          margin-bottom: 1mm;
        }
        .site {
          font-size: 9px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .divider {
          border: none;
          border-top: 1px solid #e0e0e0;
          margin: 3mm 0;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="tag">
        <div class="org">Uganda Electricity Generation Company</div>
        <hr class="divider">
        <img class="qr" src="${dataUrl}" alt="${asset.asset_code}" />
        <div class="code">${asset.asset_code}</div>
        <div class="name">${asset.name}</div>
        <div class="site">${asset.site_id} · ${asset.category}</div>
      </div>
      <script>
        window.onload = () => { window.print(); window.close(); }
      <\/script>
    </body>
    </html>
  `)
  win.document.close()
}

export async function downloadQRPng(asset) {
  const dataUrl = await generateQRDataUrl(asset.asset_code, 600)
  const a = document.createElement('a')
  a.href     = dataUrl
  a.download = `${asset.asset_code}.png`
  a.click()
}
