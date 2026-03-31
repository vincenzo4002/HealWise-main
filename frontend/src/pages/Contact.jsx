import React from 'react'
import contact_image from '../assets/contactus_frontend.png'
import { useNavigate } from 'react-router-dom'

const Contact = () => {
  const navigate = useNavigate()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="pt-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-800">
          CONTACT <span className="text-[#4c54ff]">US</span>
        </h1>
        <p className="mt-3 max-w-xl mx-auto text-gray-500 text-sm sm:text-base">
          We’d love to hear from you. Reach out for support, partnerships or career opportunities.
        </p>
      </div>

      {/* Content */}
      <div className="mt-12 flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
        {/* Text Block */}
        <div className="w-full lg:w-1/2 space-y-8 text-sm sm:text-base">
          <div>
            <h2 className="text-gray-700 font-semibold text-lg mb-1">OUR OFFICE</h2>
            <p className="text-gray-600 leading-relaxed">
              AKGEC <br /> GHAZIABAD, UP, INDIA
            </p>
          </div>
          <div>
            <h2 className="text-gray-700 font-semibold text-lg mb-1">CONTACT</h2>
            <p className="text-gray-600 leading-relaxed">
              Phone: <a href="tel:8707267182" className="text-[#4c54ff] hover:underline focus:outline-none focus:ring-2 focus:ring-[#4c54ff] rounded-sm">8707267182</a><br />
              Email: <a href="mailto:anshulakgec@gmail.com" className="text-[#4c54ff] hover:underline break-all focus:outline-none focus:ring-2 focus:ring-[#4c54ff] rounded-sm">anshulakgec@gmail.com</a>
            </p>
          </div>
          <div>
            <h2 className="text-gray-700 font-semibold text-lg mb-1">CAREERS AT HealWise</h2>
            <p className="text-gray-600">Learn more about teams and job openings.</p>
            <button
              onClick={() => { navigate('/vacancies'); window.scrollTo(0, 0); }}
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-[#4c54ff] px-6 py-3 text-sm font-medium text-[#4c54ff] hover:bg-[#4c54ff] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4c54ff]"
            >
              Explore Jobs
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 pt-4">
            <div className="rounded-lg border p-5 bg-white shadow-sm hover:shadow-md transition">
              <h3 className="text-sm font-semibold text-gray-700">Support</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">Need help using HealWise? Reach out any time.</p>
            </div>
            <div className="rounded-lg border p-5 bg-white shadow-sm hover:shadow-md transition">
              <h3 className="text-sm font-semibold text-gray-700">Partnerships</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">Collaborate with us to expand smart healthcare.</p>
            </div>
          </div>
        </div>

        
        <div className="w-full lg:w-1/2">
          <div className="relative mx-auto w-full max-w-xl rounded-2xl shadow-md ring-1 ring-gray-200 bg-linear-to-br from-[#eef2ff] via-white to-white p-4">
            <div className="relative w-full aspect-16/10 md:aspect-5/3">
              <img
                src={contact_image}
                alt="HealWise contact illustration"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover md:object-contain rounded-xl select-none drop-shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-20" />
    </div>
  )
}

export default Contact