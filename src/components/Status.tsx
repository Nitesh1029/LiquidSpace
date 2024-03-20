"use client" 
import React, { useEffect,  useState, MutableRefObject, useRef } from 'react';

function Status () {
const [isSmall, SetIsSmall] = useState(false);
const [isSticky, setIsSticky] = useState(false);
const [activeSection, setActiveSection] = useState(null);

type SectionRefs = {
  [key: string]: MutableRefObject<null>;
}

const sectionRefs: SectionRefs = {
  // LiquidSpace: useRef(null),
  OurStory: useRef(null),
  OurPledge: useRef(null),
  OurCrew: useRef(null),
};

useEffect(() => {
  const handleSize = () => {
    SetIsSmall(window.innerWidth <= 960);
  };

  handleSize();
  window.addEventListener('resize', handleSize);
  return () => window.removeEventListener('resize', handleSize);
}, []);

useEffect(() => {
  const handleScroll = () => {
    const offset = window.scrollY;
    if (offset > 700){
      setIsSticky(true);
    } else {
      setIsSticky(false);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

useEffect(() => {
  // console.log("Refs:", sectionRefs);
  const handleIntersection = (entries: any[]) => {
    entries.forEach((entry) => {
      // console.log("Int ele:", entry.target.id, "isInt ele:",entry.isIntersecting);
      if(entry.isIntersecting) {
        setActiveSection(entry.target.id);
      }
    });
  };

  const observer = new IntersectionObserver(handleIntersection, {
    threshold: 0.5,

  });

  Object.values(sectionRefs).forEach((ref) => {
    if(ref.current) {
      // console.log("Observing", ref.current);
      observer.observe(ref.current);
    }
  });

  return () => observer.disconnect();
}, [sectionRefs]);

return (
  <>
    {!isSmall && ( 
      <div className={`w-full p-10 ${isSticky ? 'fixed top-16 left-0 bg-white' : ''}`}>
        <div className='Titles text-xl flex justify-center text-center gap-10'>
          {["LiquidSpace","OurStory", "OurPledge", "OurCrew"].map((item, index) => (
            <a key={index} className={`text-lg font-semibold ${activeSection === item ? 'text-cyan-500 ' : ''}`} 
              href={`#${item}`} 
              ref={sectionRefs[item]} 
              id={item}
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    )}
    {!isSmall && <div className={`liner border-t-[2.5px] border-cyan-300 w-full ${isSticky ? 'fixed top-16 left-0' : ''}`}></div>}
  </>
);
}

export default Status;