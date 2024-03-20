import React from 'react'
import Header from '@/components/Header';
import Main from '@/components/Main';
import Status from '@/components/Status';
import Story from '@/components/Story';
import Pledge from '@/components/Pledge';
import Crew from '@/components/Crew';

function page() {
  return (
    <div className="w-full h-screen text-white">
      <Header />
      <Main />
      <Status />
      <Story />
      <Pledge />
      <Crew />
      
    </div>
  )
}

export default page; 