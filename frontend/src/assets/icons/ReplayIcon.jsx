import React from "react";

function ReplayIcon({ width = 18, height = 18, color = "#6b7280" }) {
  return (
    <svg width={width} height={height} fill="none" viewBox="0 0 20 20">
      <path d="M10 3v2.5A5 5 0 1 1 5 10" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 3 10 3 10 6" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default ReplayIcon;
