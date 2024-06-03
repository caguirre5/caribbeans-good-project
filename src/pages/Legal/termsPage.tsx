import Header from "../../components/HeaderControls";
import Footer from "../../components/Footer";
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';  // No se utiliza en este ejemplo simplificado
import { parseTextFile } from "../../components/utilsFunctions";

interface TextDisplayProps {
    file?: string;  // No se utiliza en este ejemplo simplificado
}

const Terms: React.FC<TextDisplayProps> = (props) => {
    const { file } = useParams<{ file?: string }>();  // No se utiliza en este ejemplo simplificado
    const [content, setContent] = useState<React.ReactNode[]>([]);
  
    useEffect(() => {
      const filePath = props.file || file || 'PrivacyPolicy';  // Simplificado para usar directamente el archivo
      const loadText = async () => {
        const parsedContent = await parseTextFile(`/${filePath}.txt`);
        setContent(parsedContent);
        console.log(parsedContent);  // Para verificar la carga y parseo del contenido
      };
  
      loadText();
    }, []);  // Eliminamos las dependencias ya que no depende de props ni de parámetros de ruta

    return (
        <div className="bg-[#fffaf5]">
            <Header/>
            <div className="text-[#044421] my-20 space-y-4 p-4 w-[50%] mx-auto">
                {content}
            </div>
            <Footer/>
        </div>
    );
}

export default Terms;
