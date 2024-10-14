import React, { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import Header from '../../components/HeaderControls';
import Footer from '../../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext'; // Acceder al contexto de autenticación
import { db } from '../../firebase/firebase'; // Importar Firestore
import { collection, addDoc } from 'firebase/firestore'; // Para agregar un documento a Firestore
import additionalImageUrl from '../../assets/CEO.png'


const PdfViewer: React.FC = () => {
  const location = useLocation();
  const { pdfUrl } = location.state || {};
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [updatedPdfUrl, setUpdatedPdfUrl] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const { currentUser } = useAuth(); // Obtener información del usuario actual
  
  const [showModal, setShowModal] = useState(false); // Controla el modal de confirmación


  const handleAddSignature = async () => {
    if (sigCanvas.current && pdfUrl) {
      const signatureData = sigCanvas.current.toDataURL('image/png');
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const pngImage = await pdfDoc.embedPng(signatureData);
      const { height } = lastPage.getSize();

      // Dibuja la firma en el PDF
      lastPage.drawImage(pngImage, {
        x: 60,
        y: height - 250,
        width: 180,
        height: 50,
      });

      // Cargar la imagen adicional desde los assets
      const additionalImageBytes = await fetch(additionalImageUrl).then((res) => res.arrayBuffer());
      const additionalImage = await pdfDoc.embedPng(additionalImageBytes); // Puedes cambiar a embedJpg si es JPG

      // Incrustar la imagen adicional en el PDF
      lastPage.drawImage(additionalImage, {
        x: 80, // Ajusta la posición de la imagen adicional
        y: height - 150, // Ajusta la posición de la imagen adicional
        width: 120, // Ajusta el tamaño de la imagen
        height: 80,
      });

      const pdfBytes = await pdfDoc.save(); // Obtiene el Uint8Array del PDF firmado

      // Convierte el Uint8Array en Blob
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
      setUpdatedPdfUrl(pdfDataUri);
      setIsSigned(true); // Marca el contrato como firmado

      // Llama a la función para subir el PDF firmado a S3 y crear el documento en Firebase
      await uploadSignedPdfToS3(pdfBlob);
    }
  };

  // Función para subir el PDF firmado a S3 y luego crear el documento en Firebase
  const uploadSignedPdfToS3 = async (pdfBlob: Blob) => {
    const formData = new FormData();
    formData.append('file', new File([pdfBlob], 'signed_contract.pdf', { type: 'application/pdf' }));
    formData.append('fileName', 'signed_contract.pdf'); // Nombre original del archivo

    try {
      // Envía el archivo PDF firmado al backend para subirlo a S3
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/resourcelibray/uploadcontract`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { fileUrl } = await response.json(); // Obtener la URL del archivo subido a S3
        console.log('File uploaded successfully to S3!', fileUrl);

        // Crea el documento en Firebase con el URL del archivo subido
        await createContractInFirebase(fileUrl);
      } else {
        console.error('Failed to upload the file to S3.');
      }
    } catch (error) {
      console.error('Error uploading file to S3:', error);
    }
  };

  // Función para crear el documento en Firebase
  const createContractInFirebase = async (fileUrl: string) => {
    try {
      // Crear un nuevo documento en la colección 'contracts' con la URL y datos adicionales
      await addDoc(collection(db, 'contracts'), {
        userId: currentUser?.uid, // ID del usuario actual
        email: currentUser?.email, // Correo del usuario actual
        status: 'Pending', // Estado inicial del contrato
        createdAt: new Date(), // Fecha de creación
        fileUrl, // URL del archivo subido a S3
      });
      console.log('Contract successfully created in Firebase');
    } catch (error) {
      console.error('Error creating contract in Firebase:', error);
    }
  };

  return (
    <div className="">
      <Header />
      <div className="min-h-screen mt-32  flex justify-center">
        <div className="w-[40%]">
          {pdfUrl ? (
            <iframe src={updatedPdfUrl || pdfUrl} width="100%" height="600px" />
          ) : (
            <p>No PDF to display.</p>
          )}
        </div>
        <div className="w-[40%] ml-4 px-20 py-10 flex flex-col items-center">
          {!isSigned && 
            <p className="mb-4">
              Your Coffee Supply Agreement has been generated with your data. Please review it carefully. Once reviewed, you can proceed to sign it.
            </p>
          }
          {isSigned ? (
            <div className="flex flex-col items-center mt-20">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Thank you for your order!
              </h2>
              <FontAwesomeIcon icon={faCheckCircle} size="4x" className="text-green-500 mb-4" />
              <p className="text-xl text-center font-bold">
                Your signature has been successfully registered and your order has been generated!
              </p>
              <p className="text-lg text-center mt-4">
                To confirm the dispatch of your order, please send the payment receipt for the agreed amount stated in the contract to the following email address:
              </p>
              <p className="text-lg font-bold text-center text-blue-600 underline mt-2">
                info@caribbeangoods.co.uk
              </p>
              <p className="text-lg text-center mt-4">
                You have <span className="font-bold">5 days</span> to complete this action, otherwise your order will be cancelled.
              </p>
            </div>
          ) : (
            <div className="mt-20">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: 'sigCanvas', width: 500, height: 200, style: { border: '1px solid #000' } }}
              />
              <button
                onClick={() => setShowModal(true)} // Abre el modal de confirmación
                className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-700"
              >
                Add Signature
              </button>
            </div>
          )}
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg w-1/3">
              <h2 className="text-xl font-bold mb-4">Confirm Your Signature</h2>
              <p className="mb-4">
                Are you sure you want to add your signature? Once signed, your order will be generated and your contract will be registered. This action cannot be undone.
              </p>
              <div className="flex justify-end">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md mr-2 hover:bg-gray-600"
                  onClick={() => {
                    sigCanvas.current?.clear(); // Borra el canvas si cancela
                    setShowModal(false); // Cierra el modal
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={() => {
                    handleAddSignature(); // Procede a agregar la firma
                    setShowModal(false); // Cierra el modal
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>

  );
};

export default PdfViewer;
