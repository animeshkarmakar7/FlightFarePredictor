import React from "react";
import logo from '../Navbar/logo.png';
import flight from '../Navbar/plane.png';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md py-4 overflow-hidden relative h-20">
      <div className="container mx-auto flex items-center justify-center h-full">
        {/* Animated Plane */}
        <div className="absolute w-full h-full top-0 left-0 overflow-hidden">
          <img
            src={flight}
            alt="Flying Plane"
            className="absolute left-[-100px] w-16 h-16 animate-plane-flight"
          />
          {/* Smoke Trail */}
          <div className="absolute left-[-100px] top-5 animate-plane-flight flex">
            <div className="w-4 h-4 bg-gray-300 rounded-full opacity-0 animate-smoke"></div>
            <div className="w-6 h-6 bg-gray-400 rounded-full opacity-0 animate-smoke"></div>
            <div className="w-5 h-5 bg-gray-500 rounded-full opacity-0 animate-smoke"></div>
          </div>
        </div>
        {/* Brand Name with Logo */}
        <h1 className="text-3xl mx-3 flex font-bold text-blue-700 opacity-0 animate-fade-in">
          <span>Skyway</span>
          <img src={logo} alt="Skyway Logo" className="w-8 h-8" />
          
        </h1>
      </div>
    </nav>
  );
};

export default Navbar;
