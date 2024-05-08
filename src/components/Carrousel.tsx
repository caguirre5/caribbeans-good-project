// ImageCarousel.jsx
import { useState } from 'react';
interface Image {
    url: string;
    alt: string;
}

interface ImageCarouselProps {
    images: Image[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
    const [current, setCurrent] = useState(0);
    const length = images.length;

    const nextSlide = () => {
        setCurrent(current === length - 1 ? 0 : current + 1);
    };

    const prevSlide = () => {
        setCurrent(current === 0 ? length - 1 : current - 1);
    };

    if (!Array.isArray(images) || images.length <= 0) {
        return null;
    }

    return (
<div className="relative overflow-hidden" style={{ height: "60vh" }}>
    <div className="flex justify-start items-center transition-transform duration-300" style={{
        width: `${images.length * 100}%`,
        transform: `translateX(-${current * (100 / images.length)}%)`
    }}>
        {images.map((image, index) => (
            <div key={index} className="flex-shrink-0" style={{ width: `calc(100% / 3)`, height: "100%" }}>
                <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
            </div>
        ))}
    </div>
    <button onClick={prevSlide} className="absolute top-1/2 left-5 z-10 bg-white rounded-full p-1 text-black focus:outline-none transform -translate-y-1/2">
        &#10094;
    </button>
    <button onClick={nextSlide} className="absolute top-1/2 right-5 z-10 bg-white rounded-full p-1 text-black focus:outline-none transform -translate-y-1/2">
        &#10095;
    </button>
</div>

    );
};

export default ImageCarousel;
