import React from 'react'

const data = [
    {
      image: "https://content.liquidspace.com/dist2/Assets/img/AboutUs/commitment.24576c3e467a15f363b9..jpg",
      title: "1) Build products that make a difference.",
      description: "Develop and promote solutions that support and accelerate the decarbonization of the workplace industry."
    },
    {
      image: "https://content.liquidspace.com/dist2/Assets/img/AboutUs/transparency.72a3c3a5391386bc6552..jpg",
      title: "2) Take time to educate our customers.",
      description: "Promote understanding in the industry of practical, actionable and profitable methods for workplace decarbonization. Provide tools to our customers and partners to implement and measure decarbonization strategies."
    },
    {
      image: "https://content.liquidspace.com/dist2/Assets/img/AboutUs/empowerment.20409f64d21c66ce5292..jpg",
      title: "3) Hold ourselves accountable.",
      description: "Share our work as a signatory to The Climate Pledge; commit to regular reporting, carbon elimination, and credible offsets."
    }
  ];

function Cards() {
return (
    <>
      {data.map((item, index) => (
        <div key={index} className="w-full flex flex-col p-4 md:p-7 justify-center items-center md:flex-row md:gap-5 lg:gap-10 rounded-xl">
          <div className="w-full sm:w-2/3 md:w-1/2 lg:px-14 xl:px-36 mb-5 md:mb-0 flex justify-center">
            <img src={item.image} className="max-w-full h-auto rounded-lg" alt="Poster Image"/>
          </div>
          <div className="w-full sm:w-2/3 md:w-1/2 p-4 flex flex-col justify-center gap-4">
            <div className="text-xl md:text-2xl lg:text-2xl font-bold text-center md:text-left">{item.title}</div>
            <p className="text-md md:text-md lg:text-md text-center md:text-left">{item.description}</p>
          </div>
        </div>
      ))}
</>

  )
}

export default Cards
