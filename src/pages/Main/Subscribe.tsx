import Header from "../../components/HeaderControls";
import Footer from "../../components/Footer";

import Image from "../../assets/Images/All/EFR06137.jpg"

const Subscribe: React.FC = () => {

    return(
        <div>
            <Header/>
            <div 
                className="mt-20  flex-col lg:h-[calc(100vh-5rem)] flex lg:flex-row items-center justify-center overflow-hidden"
            >
                <div className="lg:flex-1 flex items-center justify-center ">
                    <img src={Image} alt="" className="w-screen h-[200px] lg:h-full object-cover" />
                </div>
                <div className="flex-1 flex h-screen lg:h-full lg:w-[40%] bg-[#cad4c4] items-center justify-center text-center ">
                        <iframe
                            src="https://7da3f3b2.sibforms.com/serve/MUIFAIm4d6X-yOQg_yk1vzUfko1R0VK8sHILXehHnm1xYy4xFmNuYhQtsfNhjUudDbbAsiydw6oJM2FhyIWwNBq4GS1hgxg3YcEwk9a_fYBlnb-f29Ys_yNvcJYk-fv9MvxxeGAHV5yyUFbU8hYHzPC1oLbChsaMR1pnvD5Z7caX600GctvygVh3s9qCYlNqDJ6h-WFHfuYcf4jY"
                            allowFullScreen
                            style={{
                                display: 'block',
                                margin: '0 auto',
                                maxWidth: '100%',
                                border: 'none',
                                borderRadius:"10px"
                            }}
                            title="Brevo Form"
                            className="w-[600px] h-[830px] lg:h-[600px] rounded-none lg:rounded-xl"
                        ></iframe>
                </div>
            </div>
            <Footer/>
        </div>
    )
}
export default Subscribe


