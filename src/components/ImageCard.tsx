"use client"
import React, { useState } from 'react';
import { MdArrowRightAlt } from "react-icons/md";

const images = [
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Mark Gilbreath, CEO.jpg',
        name: 'Mark Gilbreath',
        role: 'CEO'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Sarah Anderson.png',
        name: 'Sarah Anderson',
        role: 'Senior Customer Success Manager'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Ricki Dorman, Director of Strategic Partnerships.jpg',
        name: 'Ricki Dorman',
        role: 'Product Manager Supply'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Cogswell, Kate.jpg',
        name: 'Kate Cogswell',
        role: 'Enterprise Success Manager'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Meghan Duncan, Senior Manager of Supply Ops.jpg',
        name: 'Meghan Duncan',
        role: 'Senior Manager of Supply Ops'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Erica Green, Senior Enterprise Success Manager.jpeg',
        name: 'Erica Green',
        role: 'Senior Enterprise Success Manager'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/LisaHarvey.jpg',
        name: 'Lisa Harvey',
        role: 'VP, Hybrid Workplace Experience & Chief People Office'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Amanda Crookston.jpeg',
        name: 'Amanda Crookston',
        role: 'VP, Customer Success & Support'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Sam Shea.png',
        name: 'Sam Shea',
        role: 'Senior Customer Success Manager'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Katie Lynn Hodne, LiquidSpace Ambassador.jpg',
        name: 'Katie Lynn Hodne',
        role: 'Sr. Partner Success Associate'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Howard, Henry - 2.JPG',
        name: 'Henry Howard',
        role: 'Director Dedicated Sales'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Kashyap, Gurjeet.jpg',
        name: 'Gurjeet Kashyap',
        role: 'People Operations Manager'
    },
    {
        src: 'https://liquidspace.com/Content/Images/AboutUs/Crew/Kramer Kevin, Partner Success Manager.jpg',
        name: 'Kramer Kevin',
        role: 'Partner Success Manager'
    },
];

function ImageCard() {
    const [displayCount, setDisplayCount] = useState(8);
    const loadMoreImages = () =>{
        setDisplayCount(preCount => preCount + 8);
    };
  return (
    <div className="w-3/4 p-5 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 justify-center gap-y-5 gap-x-5">
            {images.slice(0, displayCount).map((image, index) => (
                <div key={index} className="flex flex-col">
                    <div className="p-0.4 bg-green-100 rounded-md overflow-hidden sm:h-48 sm:w-48 lg:h-52 lg:w-52">
                        <img className="w-full h-full object-cover sm:w-full md:w-full lg:w-full" src={image.src} alt="Profile"/>
                    </div>
                    <div className="w-3/4 p-0.5">
                        <div className="py-1 text-2xl font-semibold sm:py-2">{image.name}</div>
                        <div className="text-xl text-light sm:text-sm">{image.role}</div>
                    </div>

                </div>
            ))}
        </div>
        {displayCount < images.length && (
            <div className="flex justify-center mt-5">
            <button className="flex items-center hover:text-zinc-700 text-2xl text-black font-bold py-3 px-6 leading-normal " onClick={loadMoreImages}>
                Load more <MdArrowRightAlt className="ml-2" />
            </button>
        </div>
        )}
    </div>
            
  );
}

export default ImageCard;