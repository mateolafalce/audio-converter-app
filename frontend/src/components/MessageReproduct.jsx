import React, { useRef, useState } from "react";
import ReplayIcon from "../assets/icons/ReplayIcon";

function MessageReproduct({ format, bitDepth, audio, onClose }) {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isEnded, setIsEnded] = useState(false);

  const handleTimeUpdate = () => {
    if (audioRef.current) setProgress(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };
  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsEnded(false);
    }
  };
  const handleEnded = () => setIsEnded(true);

  // Permite cerrar tocando fuera
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl px-4 py-2 flex flex-col items-center gap-1 animate-fade-in w-[92vw] max-w-base sm:max-w-md sm:px-10 sm:py-4 relative border border-gray-200 transition-all duration-300">
        <div className="text-xs font-semibold text-gray-700 text-center mt-1 mb-1 transition-fade-move in">
          Reproduciendo audio de {format?.toUpperCase()} {bitDepth} bit
        </div>
        <div className="w-full flex items-center gap-2 transition-fade-move in">
          <button
            className="p-1 rounded bg-gray-50 text-emerald-600 flex items-center transition-all duration-200"
            onClick={handleReplay}
            title="Reproducir de nuevo"
            tabIndex={0}
          >
            <ReplayIcon width={18} height={18} color="#059669" />
          </button>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={progress}
            onChange={e => {
              const val = Number(e.target.value);
              setProgress(val);
              if (audioRef.current) audioRef.current.currentTime = val;
            }}
            className="w-full h-1 accent-green-700 rounded-lg outline-none focus:ring-2 focus:ring-green-300 transition-all duration-200"
            step="any"
          />
          <span className="text-[11px] text-gray-500 w-16 text-right tabular-nums ml-2 flex-shrink-0 transition-fade-move in">
            {formatTime(progress)} / {formatTime(duration)}
          </span>
        </div>
        {isEnded && (
          <div className="text-[11px] text-emerald-700 font-semibold animate-fade-in mt-1">
            Reproducción finalizada
          </div>
        )}
        <audio
          ref={audioRef}
          src={audio}
          autoPlay
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          className="hidden"
        />
      </div>
    </div>
  );
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default MessageReproduct;
