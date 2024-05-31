import { motion } from "framer-motion";
import { generateRandomBorderRadius } from "./utilsFunctions";

interface SimpleContentSectionProps {
    title: string;
    text: string[];
    image: string;
    backgroundColor?: string;
    textColor?: string;
    titleColor?:string;
    reverseOrder?:boolean;
}

const fadeInAnimationVariants = {
    initial: ({ xValue }: { xValue: number })=>({
        opacity:0,
        x:xValue,
    }),
    animate: ({ delayValue }: { delayValue: number })=>({
        opacity:1,
        x:0,
        transition: {
            duration: 1,
            delay: delayValue,
        },
    }),
}

// const fadeInAnimationAppearVariants = {
//     initial: {
//         opacity:0,
//     },
//     animate: (value:number) => ({
//         opacity:1,
//         transition: {
//             duration: 1,
//             delay: value,
//         },
        
//     }),
// }

const SimpleContentSection: React.FC<SimpleContentSectionProps> = ({
    title,
    text,
    image,
    backgroundColor = '#c9d3c0',
    textColor = '#c9d3c0',
    titleColor = textColor,
    reverseOrder = false
}) => {

    const orderImage = reverseOrder ? 'order-0' : 'order-2';
    const borderRadiusStyle = generateRandomBorderRadius();
    
    const CalculatedxValue = reverseOrder ? window.innerWidth : -window.innerWidth;

    console.log((CalculatedxValue))

    return (
        <div className="py-20 px-5 lg:px-20 flex flex-col items-center overflow-hidden" style={{ backgroundColor, color: textColor }}>
            <div className="w-full flex flex-col items-center lg:items-start">
                <motion.div 
                    className="lg:hidden flex justify-center mb-8"
                >
                    <img src={image} alt="Coffee beans" className="rounded-lg shadow-lg max-w-full h-auto object-cover" 
                        style={{ borderRadius: borderRadiusStyle }} />
                </motion.div>
                <h2 className="w-full text-center text-4xl lg:text-7xl mb-8 lg:mb-20 order-1" style={{color:titleColor, fontFamily: 'KingsThing' }}>{title}</h2>
                <div className='flex order-2 justify-center items-center'>
                    <motion.div 
                        className={`lg:w-1/2 px-8 lg:px-20 lg:order-1`}
                        variants={fadeInAnimationVariants}
                        initial='initial'
                        whileInView='animate'
                        viewport={{
                            once:true,
                        }}
                        custom={{xValue:reverseOrder ? 100 : -100, delayValue:0.8}}
                    >
                        {text.map((paragraph, index) => (
                            <p key={index} className="lg:text-left text-md lg:text-lg mb-4 ">
                                {paragraph}
                            </p>
                        ))}
                    </motion.div>
                    <motion.div 
                        className={`hidden lg:flex lg:w-1/2 justify-center lg:${orderImage}`}
                        variants={fadeInAnimationVariants}
                        initial='initial'
                        whileInView='animate'
                        viewport={{
                            once:true,
                        }}
                        custom={{xValue: reverseOrder ? -100 : 100, delayValue:0.1}}
                    >
                        <img src={image} alt="Coffee beans" className="rounded-lg shadow-lg max-w-full h-auto object-cover" 
                            style={{ borderRadius: borderRadiusStyle }} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default SimpleContentSection;
