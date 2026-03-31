import React from "react";
import { Link } from "react-router-dom";
import "../index.css";
import group_profiles from "../assets/groupnew.jpeg";
import arrow_icon from "../assets/arrow_icon.svg";
import header_img from "../assets/create2.jpeg";

const Header = () => {
  return (
    <header
      className="relative bg-[#5f6FFF] rounded-2xl overflow-hidden shadow-lg"
      aria-label="HealWise hero"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-10 lg:px-14 py-8 sm:py-10 md:py-14">
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-0">
          {/* Left column - content */}
          <div className="md:w-1/2 z-10 flex flex-col justify-center py-4 md:py-8 lg:py-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
              Book Appointment
              <br />
              With Trusted Doctors
            </h1>

            <div className="flex items-start gap-4 text-white text-xs sm:text-sm md:text-base font-light max-w-md mt-5 md:mt-6">
              <img
                src={group_profiles}
                alt="Doctor avatar"
                loading="lazy"
                className="w-20 h-20 rounded-full object-cover shrink-0 border-2 border-white"
              />

              <p className="leading-relaxed">
                Browse our extensive list of trusted doctors and schedule your
                appointment hassle-free.
              </p>
            </div>

            <Link
              to="/doctors"
              onClick={() => window.scrollTo(0, 0)}
              aria-label="Book appointment"
              className="inline-flex items-center gap-3 bg-white text-gray-700 px-6 py-2.5 rounded-full text-xs sm:text-sm md:text-base font-semibold shadow-md hover:shadow-lg transform transition duration-200 hover:scale-105 active:scale-95 mt-6 w-max"
            >
              <span>Book Appointment</span>
              <img src={arrow_icon} alt="" className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Right column - image as background for perfect cover */}
          <div
            className="md:w-1/2 mt-6 md:mt-0 flex justify-center md:justify-end items-center relative"
            aria-hidden="false"
          >
            <img
              src={header_img}
              alt="Group of trusted doctors"
              className="w-full h-auto max-w-full md:max-w-xs lg:max-w-sm rounded-2xl shadow-lg object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Decorative overlay to ensure text contrast on small screens */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#5f6FFF]/80 via-[#5f6FFF]/50 to-transparent md:from-transparent md:via-transparent md:to-transparent" />
    </header>
  );
};

export default Header;
