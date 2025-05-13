import React from "react";
import MicrofonoSVG from "../assets/icons/microfono.svg";

const btnBase = "rounded-full text-white transition-all duration-200 ease-in-out focus:outline-none flex items-center justify-center";
const size = "w-16 h-16"; 
const iconClass = "w-9 h-9 mx-auto my-auto block"; 

function IconButton({ onClick, isActive }) {
  return (
    <button
      onClick={onClick}
      className={`${btnBase} ${size} group ${isActive ? "bg-green-500" : "bg-red-500"} hover:-translate-y-1 active:scale-95 hover:shadow focus:ring-2 focus:ring-offset-2 outline-none`}
      style={{ transition: 'transform 0.2s, box-shadow 0.2s, filter 0.2s' }}
    >
      <img
        src={MicrofonoSVG}
        alt="Micrófono"
        className={iconClass}
        style={{ transition: 'transform 0.2s, color 0.2s', display: 'block' }}
      />
      <style>
        {`
          .group:hover img { filter: brightness(1.2); transform: translateY(-2px) rotate(-10deg) scale(1.03); }
          .group:active img { filter: brightness(1.2); transform: scale(0.95); }
        `}
      </style>
    </button>
  );
}

export default IconButton;
