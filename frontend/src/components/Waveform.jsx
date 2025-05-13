import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/plugins/regions";

const Waveform = ({ audioUrl }) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!audioUrl) return;
    // Destruye la instancia previa si existe
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
    let wavesurfer;
    try {
      wavesurfer = WaveSurfer.create({
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
      wavesurfer.load(audioUrl);
      wavesurfer.on('ready', () => setIsReady(true));
      wavesurfer.on('error', (error) => {
        console.error('Error en WaveSurfer:', error);
      });
    } catch (err) {
      console.error("Error inicializando WaveSurfer:", err);
    }
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
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