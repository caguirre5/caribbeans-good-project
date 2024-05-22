interface SimpleContentSectionProps {
    title: string;
    text: string[];
    image: string;
    backgroundColor?: string;
    textColor?: string;
    titleColor?:string;
    reverseOrder?:boolean;
}

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

    return (
        <div className="py-20 px-5 lg:px-20 flex flex-col items-center" style={{ backgroundColor, color: textColor }}>
            <div className="w-full flex flex-col items-center lg:items-start">
                <div className="lg:hidden flex justify-center mb-8">
                    <img src={image} alt="Coffee beans" className="rounded-lg shadow-lg max-w-full h-auto object-cover" 
                        style={{ borderRadius: '25% 50% 25% 55% / 25% 56% 25% 46%' }} />
                </div>
                <h2 className="w-full text-center text-4xl lg:text-7xl mb-8 lg:mb-20 order-1" style={{color:titleColor, fontFamily: 'KingsThing' }}>{title}</h2>
                <div className='flex order-2 justify-center items-center'>
                    <div className={`lg:w-1/2 px-8 lg:px-20 lg:order-1`}>
                        {text.map((paragraph, index) => (
                            <p key={index} className="lg:text-left text-md lg:text-lg mb-4 ">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                    <div className={`hidden lg:flex lg:w-1/2 justify-center lg:${orderImage}`}>
                        <img src={image} alt="Coffee beans" className="rounded-lg shadow-lg max-w-full h-auto object-cover" 
                            style={{ borderRadius: '25% 50% 25% 55% / 25% 56% 25% 46%' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimpleContentSection;
