import React from 'react'
import Cards from './Cards'

function Pledge() {
  return (
    <div className='w-full p-5'>
        <div className='sm:p-10 text-lg font-semibold flex justify-center text-center'>OUR PLEDGE</div>
        <div className="w-3/4 mx-auto text-3xl leading-relaxed font-semibold text-center">
            At LiquidSpace, we pledge to always make the planet central to the conversation. Here are three ways we intend to walk the talk.
        </div>
        <div className='py-5 my-10 text-md font-semibold justify-center text-center'>Our Pledge has three pillars: Commitment, Transparency and Empowerment.</div>
        <Cards />
    </div>
    
  )
}

export default Pledge