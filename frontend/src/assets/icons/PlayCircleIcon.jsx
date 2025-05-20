import React from "react";

function PlayCircleIcon({ size = 64, color = "#22c55e" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#fff" stroke={color} strokeWidth="2.5"/>
      <circle cx="24" cy="24" r="18" fill="#e6f4ea"/>
      <polygon points="21,17 34,24 21,31" fill={color} />
      <circle cx="24" cy="24" r="22" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
    </svg>
  );
}

export default PlayCircleIcon;
