import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import SignatureCanvas from 'react-signature-canvas';

// Definir el tipo de las props
interface ContractProps {
  pdfUrl: string;
}

const Contract: React.FC<ContractProps> = ({ pdfUrl }) => {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [name, setName] = useState<string>('');
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    // Cargar el PDF
    fetch(pdfUrl)
      .then(response => response.arrayBuffer())
      .then(data => {
        setPdfBytes(new Uint8Array(data));
      });
  }, [pdfUrl]);

  const handleSave = async () => {
    if (pdfBytes && sigCanvas.current) {
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Agregar el nombre al PDF
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      firstPage.drawText(`Name: ${name}`, {
        x: 50,
        y: 700,
        size: 20,
      });

      // Agregar la firma al PDF
      const signatureImage = await pdfDoc.embedPng(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
      firstPage.drawImage(signatureImage, {
        x: 50,
        y: 600,
        width: 150,
        height: 50,
      });

      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'contract.pdf';
      link.click();
    }
  };

  return (
    <div>
      {/* <embed src={pdfUrl} width="600" height="400" type="application/pdf" /> */}
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <SignatureCanvas
        penColor="black"
        canvasProps={{ width: 500, height: 200, className: 'sigCanvas' }}
        ref={sigCanvas}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default Contract;
