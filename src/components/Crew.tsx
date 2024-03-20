import React from 'react';
import ImageCard from './ImageCard';

function Crew() {
  return (
    <div className='w-full bg-cyan-300 bg-opacity-20 p-10'>
        <div className='w-full text-cyan-600 pt-14 sm:mt-10 sm:mb-10 flex justify-center text-center text-xl font-semibold'>The Crew</div>
        <p className='w-full sm:w-3/4 h-[35vh] sm:p-2 sm:mb-12 flex justify-center items-center text-center text-3xl md:text-4xl font-semibold mx-auto my-4 leading-relaxed md:leading-relaxed' >
            Scattered around the globe, united in conviction and purpose – to support our customers’ journeys and fight for our planet’s future.
        </p>
        <div className='w-full sm:w-3/4 flex justify-center text-center text-2xl md:text-4xl font-semibold mx-auto mb-20'>
            Join us.
        </div>
    <ImageCard />

</div>
  )
}
export default Crew;