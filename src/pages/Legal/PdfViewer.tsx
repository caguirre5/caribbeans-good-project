import React, { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import Header from '../../components/HeaderControls';
import Footer from '../../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const PdfViewer: React.FC = () => {
  const location = useLocation();
  const { pdfUrl } = location.state || {};
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [updatedPdfUrl, setUpdatedPdfUrl] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  const handleAddSignature = async () => {
    if (sigCanvas.current && pdfUrl) {
      const signatureData = sigCanvas.current.toDataURL('image/png');
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const pngImage = await pdfDoc.embedPng(signatureData);
      const { width, height } = lastPage.getSize();


      
      lastPage.drawImage(pngImage, {
        x: 60,
        y: height - 250,
        width: 180,
        height: 50,
      });

      const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
      setUpdatedPdfUrl(pdfDataUri);
      setIsSigned(true); // Set the success state
    }
  };

  return (
    <div className="container mx-auto">
      <Header />
      <div className="min-h-screen mt-20 px-10 flex">
        <div className="w-2/5">
          <h2 className="text-2xl font-bold mb-6">Generated Contract</h2>
          {pdfUrl ? (
            <iframe src={updatedPdfUrl || pdfUrl} width="100%" height="600px" />
          ) : (
            <p>No PDF to display.</p>
          )}
        </div>
        <div className="w-3/5 ml-4 px-20 py-10 flex flex-col items-center">
          <p className="mb-4">
            Your Coffee Supply Agreement has been generated with your data. Please review it carefully. Once reviewed, you can proceed to sign it.
          </p>
          {isSigned ? (
            <div className="flex flex-col items-center mt-20">
              <FontAwesomeIcon icon={faCheckCircle} size="4x" className="text-green-500 mb-4" />
              <p className="text-xl text-center">
                Your contract has been successfully signed!
              </p>
            </div>
          ) : (
            <div className=' mt-20'>
              
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: 'sigCanvas', width: 500, height: 200, style: { border: '1px solid #000' } }}
              />
              <button
                onClick={handleAddSignature}
                className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-700"
              >
                Add Signature
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PdfViewer;
