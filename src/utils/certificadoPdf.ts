const PRINT_STYLES = `
  @page { size: landscape; margin: 0; }
  body { margin: 0; padding: 0; }
  svg { width: 100vw; height: 100vh; }
`;

export function descargarCertificadoPdf(svgFinal: string, codigo: string): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert('No se pudo abrir la ventana de impresión. Verifica que las ventanas emergentes estén permitidas.');
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Certificado ${codigo}</title>
      <style>${PRINT_STYLES}</style>
    </head>
    <body>${svgFinal}</body>
    </html>
  `);
  win.document.close();

  win.onload = () => {
    setTimeout(() => {
      win.print();
    }, 300);
  };
}
