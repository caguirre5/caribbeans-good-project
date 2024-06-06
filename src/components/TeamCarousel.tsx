import React, { useState } from 'react';

interface TeamMember {
  name: string;
  position: string;
  image: string;
}

interface TeamCarouselProps {
  members: TeamMember[];
}

const TeamCarousel: React.FC<TeamCarouselProps> = ({ members }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const membersPerSlide = window.innerWidth >= 1024 ? 3 : (window.innerWidth >= 768 ? 2 : 1);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + membersPerSlide) % members.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - membersPerSlide + members.length) % members.length);
  };

  return (
    <div className="relative w-full lg:w-[90%] mx-auto">
      <div className="flex overflow-hidden">
        {members.slice(currentIndex, currentIndex + membersPerSlide).map((member, index) => (
          <div key={index} className="flex-none p-4 w-full lg:w-1/3">
            <div className="rounded-sm flex flex-col items-center">
              <img src={member.image} alt={member.name} className="w-full h-[500px] object-cover object-top rounded-lg mb-4" />
              <h3 className="text-lg font-bold">{member.name}</h3>
              <p className="text-sm">{member.position}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-0 transform text-[#044421] -translate-y-1/2 bg-white p-2 rounded-full shadow-lg focus:outline-none"
      >
        ‹
      </button>
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-0 transform text-[#044421] -translate-y-1/2 bg-white p-2 rounded-full shadow-lg focus:outline-none"
      >
        ›
      </button>
    </div>
  );
};

export default TeamCarousel;
