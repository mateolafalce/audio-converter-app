import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

function MessageAlert({ mensaje, onClose }) {
  const calledRef = useRef(false);

  useEffect(() => {
    if (!mensaje) return;
    calledRef.current = false;
    // Bloquea scroll y toda interacción
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
      // Si la alerta se desmonta antes, asegúrate de llamar a onClose solo una vez
      if (!calledRef.current && mensaje) {
        calledRef.current = true;
        onClose && onClose();
      }
    };
  }, [mensaje, onClose]);

  return (
    <AnimatePresence>
      {mensaje && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ pointerEvents: 'auto' }}
          tabIndex={-1}
        >
          {/* Fondo bloqueante y difuminado fuerte */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl pointer-events-auto" />
          {/* Card de alerta */}
          <motion.div
            className="relative max-w-xs w-full bg-white border border-gray-300 rounded-xl p-6 text-center flex flex-col items-center"
            initial={{ scale: 0.97, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            style={{ zIndex: 10, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)' }}
          >
            <FiAlertTriangle className="text-yellow-500 mb-3" style={{ fontSize: '2rem' }} />
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Atención</h3>
            <p className="text-sm text-gray-600">{mensaje}</p>
            {/* Barra de progreso */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-yellow-400 rounded-b-xl"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 1.5, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MessageAlert;
