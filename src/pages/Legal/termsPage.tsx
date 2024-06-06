import Header from "../../components/HeaderControls";
import Footer from "../../components/Footer";
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { parseTextFile } from "../../components/utilsFunctions";

interface TextDisplayProps {
  file?: string;
}

const Terms: React.FC<TextDisplayProps> = (props) => {
  const location = useLocation();
  const [content, setContent] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const filePath = props.file || pathSegments[pathSegments.length - 1];
    console.log(filePath); // Para verificar el nombre del archivo

    const loadText = async () => {
      const parsedContent = await parseTextFile(`/${filePath}.txt`);
      setContent(parsedContent);
      console.log(parsedContent); // Para verificar la carga y parseo del contenido
    };

    loadText();
  }, [location.pathname, props.file]);

  return (
    <div className="bg-[#fffaf5]">
      <Header />
      <div className="text-[#044421] my-20 space-y-4 p-4 w-[50%] mx-auto">
        {content}
      </div>
      <Footer />
    </div>
  );
}

export default Terms;
