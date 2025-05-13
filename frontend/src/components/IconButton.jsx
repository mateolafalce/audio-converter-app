import React from "react";

const btnBase = "rounded-full text-white px-4 py-3 transition-all duration-200 ease-in-out focus:outline-none";
const iconStyle = { fontSize: '36px', transition: 'transform 0.2s, color 0.2s' };

function IconButton({ onClick, isActive, icon }) {
  return (
    <button
      onClick={onClick}
      className={`${btnBase} group ${isActive ? "bg-green-500" : "bg-red-500"} hover:-translate-y-1 active:scale-95 hover:shadow focus:ring-2 focus:ring-offset-2 outline-none`}
      style={{ transition: 'transform 0.2s, box-shadow 0.2s, filter 0.2s' }}
    >
      <i
        className="material-icons"
        style={iconStyle}
      >
        {icon}
      </i>
      <style>
        {`.group:hover .material-icons { color: #fff; transform: translateY(-2px) rotate(-10deg) scale(1.03); } .group:active .material-icons { color: #fff; transform: scale(0.95); }`}
      </style>
    </button>
  );
}

export default IconButton;
