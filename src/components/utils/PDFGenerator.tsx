import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PDFDocument } from 'pdf-lib';

const createPDF = async (content: string[], watermarkImage: string): Promise<Blob> => {
  const doc = new jsPDF();

  doc.setFontSize(12);

  // Encontrar el índice de la línea que contiene <break>
  const breakIndex = content.findIndex(line => line === '<break>');

  // Dividir el contenido en dos partes basadas en <break>
  const contentBeforePageBreak = content.slice(0, breakIndex); // Contenido antes de <break>
  const contentAfterPageBreak = content.slice(breakIndex + 1); // Contenido después de <break>

  // Añadir el contenido antes del salto de página
  doc.autoTable({
    head: [],
    body: contentBeforePageBreak.map(line => [line]),
    theme: 'plain',
    styles: { font: 'courier', fontSize: 8 },
    startY: 20,
    margin: { left: 20, right: 20 },
    pageBreak: 'auto',
    didParseCell: function (data: any) {
      const text: string = data.cell.raw;

      if (text.startsWith('### ')) {
        data.cell.styles.fontSize = 12;
        data.cell.styles.fontStyle = 'bold';
        data.cell.text = text.replace('### ', '');
      }

      if (text.startsWith('**') && text.endsWith('**')) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.text = text.replace(/\*\*/g, '');
      }
    }
  });

  // Añadir una nueva página
  doc.addPage();

  // Añadir el contenido después del salto de página
  doc.autoTable({
    head: [],
    body: contentAfterPageBreak.map(line => [line]),
    theme: 'plain',
    styles: { font: 'courier', fontSize: 8 },
    startY: 20,
    margin: { left: 20, right: 20 },
    pageBreak: 'auto',
    didParseCell: function (data: any) {
      const text: string = data.cell.raw;

      if (text.startsWith('### ')) {
        data.cell.styles.fontSize = 12;
        data.cell.styles.fontStyle = 'bold';
        data.cell.text = text.replace('### ', '');
      }

      if (text.startsWith('**') && text.endsWith('**')) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.text = text.replace(/\*\*/g, '');
      }
    }
  });

  const pdfBlob = doc.output('blob');

  // Paso 2: Agregar la marca de agua usando pdf-lib
  const pdfWithWatermarkBlob = await addWatermarkWithPdfLib(pdfBlob, watermarkImage);

  return pdfWithWatermarkBlob;
};

const addWatermarkWithPdfLib = async (pdfBlob: Blob, watermarkImageUrl: string): Promise<Blob> => {
  // Convertir el Blob del PDF en ArrayBuffer
  const pdfBytes = await pdfBlob.arrayBuffer();

  // Cargar el PDF con pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Cargar la imagen de la marca de agua
  const watermarkImageBytes = await fetch(watermarkImageUrl).then(res => res.arrayBuffer());
  const watermarkImage = await pdfDoc.embedPng(watermarkImageBytes);

  const pages = pdfDoc.getPages();
  const { width, height } = pages[0].getSize();

  // Escalar la imagen de la marca de agua
  const imageDims = watermarkImage.scale(0.2);

  // Dibujar la marca de agua en cada página
  for (const page of pages) {
    page.drawImage(watermarkImage, {
      x: width / 2 - imageDims.width / 2,
      y: height / 2 - imageDims.height / 2,
      width: imageDims.width,
      height: imageDims.height,
      opacity: 0.2,  // Ajusta la opacidad de la marca de agua
    });
  }

  // Guardar el PDF con la marca de agua agregada
  const pdfWithWatermarkBytes = await pdfDoc.save();
  return new Blob([pdfWithWatermarkBytes], { type: 'application/pdf' });
};

export { createPDF };
