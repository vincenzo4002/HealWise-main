import React from 'react'
import appointment from "../assets/create2.jpeg"
import { useNavigate } from 'react-router-dom'
const Banner = () => {

    const navigate=useNavigate();


  return (
    <div className='flex flex-col md:flex-row items-center bg-[#5f6FFF] rounded-2xl px-6 sm:px-10 md:px-12 lg:px-14 my-20 md:mx-10 overflow-hidden shadow-md shadow-blue-500/20'>
     
     {/*Left side*/}
     <div className='flex-1 w-full text-center md:text-left py-10 md:py-14 lg:py-20 lg:pl-6 space-y-6'>
        <div className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight'>
            <p>Book Appointment</p>
            <p className='mt-3 md:mt-4'>With 100+ Trusted Doctors</p>
        </div>
        <button
          onClick={()=>{navigate('/login');scrollTo(0,0)}}
          className='inline-flex items-center justify-center bg-white text-sm sm:text-base text-gray-700 px-8 py-3 rounded-full shadow-md shadow-black/10 hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-200'
        >Create Account</button>
     </div>
   
      {/*Right Side*/}
      <div className='relative w-full md:w-1/2 lg:w-[420px] flex justify-center md:justify-end mt-6 md:mt-0 min-h-[220px] md:min-h-[260px] md:pr-6 lg:pr-10'>
        <img
          className='h-full w-auto max-w-[320px] sm:max-w-[380px] md:max-w-[320px] md:h-[260px] lg:h-80 object-contain md:absolute md:bottom-0 md:right-0 md:translate-x-3 lg:translate-x-6 drop-shadow-xl'
          src={appointment}
          alt="Appointment illustration"
        />
      </div>

    </div>
  )
}

export default Banner