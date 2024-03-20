"use client" 
import React, { useEffect,  useState, MutableRefObject, useRef } from 'react';

function Status () {
const [isSmall, SetIsSmall] = useState(false);
const [isSticky, setIsSticky] = useState(false);
const [currentSection, setCurrentSection] = useState(null);

useEffect(() => {
  const sectionIds = ['OurStory', 'OurPledge', 'OurCrew'];


  const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setCurrentSection(entry.target.id);
            }
        });
    },
    {
        threshold: 0.5
    }
);

sectionIds.forEach((sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
        observer.observe(section);
    }
});

// Clean up Observer
return () => {
    observer.disconnect();
};
}, []);


useEffect(() => {
  const handleSize = () => {
    SetIsSmall(window.innerWidth <=960);
  };

  handleSize();
  window.addEventListener('resize', handleSize);
  return () => window.removeEventListener('resize', handleSize);
}, []);

useEffect(() => {
  const handleScroll = () => {
    const offset = window.scrollY;
    if (offset >700){
      setIsSticky(true);
    } else {
      setIsSticky(false);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

return (
  <>
    {!isSmall && ( <div className={`w-full p-10 ${isSticky ? 'fixed top-16 left-0 bg-white' : ''}`}>
      <div className='Titles text-xl flex justify-center text-center gap-10'>
        {["LiquidSpace","Our Story", "Our Pledge", "Our Crew"].map((item, index) => (
          <a key={index} className={`text-lg font-semibold ${currentSection === item ? 'text-cyan-500' : ''}`} href={`#${item}`} id={item}>{item}</a>
        ))}
      </div>
    </div>
    )}
    {!isSmall && <div className={`liner border-t-[2.5px] border-cyan-300 w-full ${isSticky ? 'fixed' : ''}`}></div>}
  </>
);
}

export default Status;