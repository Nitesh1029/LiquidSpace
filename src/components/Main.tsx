"use client"
import React, { useState } from 'react'
import { IoSearch } from "react-icons/io5";

function Main() {
    return (
    <>
    <div className='main w-full bg-[#00293a] justify-center items-center pt-36'>
    <div className='txt text-center'>
        <div className='title text-base md:text-lg text-[#a1ded2] font-semibold'>Our Mission</div>
        <div className='w-3/4 md:w-2/3 lg:w-2/3 heading text-3xl md:text-6xl lg:text-6xl leading-normal font-semibold px-4 md:px-20 py-4 md:py-7 mx-auto'>More happy people, working in better spaces, the planet smiles</div>
    </div>
    <div className=''>
        <img src="https://content.liquidspace.com/dist2/Assets/img/AboutUs/hero-vector.85a40ae18722c7690813..svg" className="w-full h-auto " alt="LiquidSpace Logo" />
    </div>
</div>

    </> 
    )
}

export default Main;