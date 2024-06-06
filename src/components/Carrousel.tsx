import React, { useState, useEffect } from 'react';

interface CarouselItemProps {
  src: string;
  alt: string;
  isActive: boolean;
}

const CarouselItem: React.FC<CarouselItemProps> = ({ src, alt, isActive }) => {
  return (
    <div
      className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
      data-twe-carousel-item
      data-twe-carousel-active={isActive}
    >
      <img src={src} className="block w-full h-full object-cover" alt={alt} />
    </div>
  );
};

interface CarouselProps {
  images: { url: string }[];
}

const Carousel: React.FC<CarouselProps> = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Cambia la imagen cada 3 segundos

    return () => {
      clearInterval(interval);
    };
  }, [images.length]);

  return (
    <div id="carouselExampleSlidesOnly" className="relative w-full h-[70vh]" data-twe-carousel-init data-twe-ride="carousel">
      <div className="relative w-full h-full overflow-hidden">
        {images.map((image, index) => (
          <CarouselItem key={index} src={image.url} alt={`Carousel image ${index + 1}`} isActive={index === activeIndex} />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
