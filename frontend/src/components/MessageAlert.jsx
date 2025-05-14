import React, { useEffect, useRef } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

function MessageAlert({ mensaje, onClose }) {
  const calledRef = useRef(false);

  useEffect(() => {
    if (!mensaje) return;
    calledRef.current = false;
    document.body.style.overflow = 'hidden';
    const blockAll = e => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    window.addEventListener('keydown', blockAll, true);
    window.addEventListener('mousedown', blockAll, true);
    window.addEventListener('touchstart', blockAll, true);

    const timer = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onClose && onClose();
      }
    }, 1500);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', blockAll, true);
      window.removeEventListener('mousedown', blockAll, true);
      window.removeEventListener('touchstart', blockAll, true);
      clearTimeout(timer);
      if (!calledRef.current && mensaje) {
        calledRef.current = true;
        onClose && onClose();
      }
    };
  }, [mensaje, onClose]);

  return (
    mensaje && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200"
        style={{ background: "rgba(0,0,0,0.35)" }}
        tabIndex={-1}
      >
        <div
          className="relative max-w-xs w-full bg-white border border-gray-300 rounded-xl p-6 text-center flex flex-col items-center transition-transform duration-200 scale-100"
          style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}
        >
          <FiAlertTriangle className="text-yellow-500 mb-3" style={{ fontSize: '2rem' }} />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Atención</h3>
          <p className="text-sm text-gray-600">{mensaje}</p>
          <div className="absolute bottom-0 left-0 h-1 bg-yellow-400 rounded-b-xl transition-all duration-1500" style={{ width: "100%" }} />
        </div>
      </div>
    )
  );
}

export default MessageAlert;
