import React, { useState } from 'react';

interface TeamMember {
  name: string;
  position: string;
  image: string;
}

const TeamCard: React.FC<TeamMember> = ({ name, position, image }) => {


    return (
        <div className="relative w-full mx-auto flex flex-col justify-center items-center">
            <img src={image} alt={name} className="w-full h-[350px] object-cover object-top rounded-lg mb-4" />
            <h3 className="text-lg font-bold">{name}</h3>
            <p className="text-sm">{position}</p>
        </div>
    );
};

export default TeamCard;
