import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/plugins/regions";

const Waveform = ({ audioUrl, onRegionChange }) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;

    // Configuración de WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#22c55e",
      progressColor: "#16a34a",
      cursorColor: "#111827",
      cursorWidth: 1,
      height: 100,
      barWidth: 2,
      barRadius: 3,
      barGap: 2,
      responsive: true,
      normalize: true,
      plugins: [RegionsPlugin.create()],
    });

    wavesurferRef.current = wavesurfer;

    // Cargar el audio
    wavesurfer.load(audioUrl);

    // Eventos
    wavesurfer.on('ready', () => {
      setIsReady(true);
      console.log('WaveSurfer está listo');
      
      // Habilitar la creación de regiones por drag
      wavesurfer.enableDragSelection({
        color: 'rgba(34, 197, 94, 0.3)',
      });
    });

    wavesurfer.on('error', (error) => {
      console.error('Error en WaveSurfer:', error);
    });

    wavesurfer.on('region-created', (newRegion) => {
      setRegion(newRegion);
      if (onRegionChange) onRegionChange({
        start: newRegion.start,
        end: newRegion.end,
      });
    });

    wavesurfer.on('region-updated', (updatedRegion) => {
      setRegion(updatedRegion);
      if (onRegionChange) onRegionChange({
        start: updatedRegion.start,
        end: updatedRegion.end,
      });
    });

    // Limpieza
    return () => {
      if (wavesurfer) {
        wavesurfer.destroy();
      }
    };
  }, [audioUrl]);

  return (
    <div>
      <div ref={waveformRef} />
      {!isReady && audioUrl && (
        <div className="text-center py-4">Cargando audio...</div>
      )}
    </div>
  );
};

export default Waveform;