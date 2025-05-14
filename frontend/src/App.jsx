import React, { useState, useEffect } from "react";
import FrequencyVisualizer from "./components/FrequencyVisualizer";
import Waveform from "./components/Waveform";
import AudioRecorder from "./features/AudioRecorder";
import ResultTable from "./components/ResultTable";
import { formatTime } from "./utils/formatTime";

// Define los modos de la app
const MODES = {
  IDLE: "idle",
  RECORDING: "recording",
  LOADING: "loading",
  RESULTS: "results",
};

function App() {
  // --- Estados principales de la app ---
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [audioContext, setAudioContext] = useState(null);
  const [sourceNode, setSourceNode] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [mode, setMode] = useState(MODES.IDLE);
  const [showTable, setShowTable] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  // Determina el modo de la app según los estados
  useEffect(() => {
    if (recording) setMode(MODES.RECORDING);
    else if (isLoading) setMode(MODES.LOADING);
    else if (audioURL && processedFiles.length > 0) setMode(MODES.RESULTS);
    else setMode(MODES.IDLE);
  }, [recording, isLoading, audioURL, processedFiles]);

  // Controla la aparición suave de la tabla tras la carga
  useEffect(() => {
    if (mode === MODES.RESULTS) {
      const timeout = setTimeout(() => setShowTable(true), 120);
      return () => clearTimeout(timeout);
    } else {
      setShowTable(false);
    }
  }, [mode]);

  // Cambia la key para forzar animación al cambiar de modo
  useEffect(() => {
    setContentKey((k) => k + 1);
  }, [mode]);

  // Layout: centrado o arriba según el modo
  const isCentered = mode !== MODES.RESULTS;
  const containerClass = isCentered
    ? "min-h-screen flex flex-col justify-center items-center bg-white transition-mt"
    : "min-h-screen bg-white transition-mt mt-global";

  return (
    <div className={containerClass}>
      <div className="p-2 sm:p-4 max-w-full sm:max-w-xl mx-auto w-full">
        <h1 className="text-xl mb-sm:text-2xl font-bold mt-4 mb-4 text-center">
          Conversor de Audio Analógico a Digital
        </h1>
        <ContentTransition key={contentKey}>
          {mode === MODES.RECORDING && audioContext && sourceNode && (
            <>
              <div className="mb-2">
                <div className="ml-2 text-gray-500 font-medium">Tiempo: {formatTime(recordingTime)}</div>
              </div>
              <div className="rounded bg-gray-100 p-2 my-2">
                <FrequencyVisualizer audioContext={audioContext} sourceNode={sourceNode} />
              </div>
            </>
          )}

          {mode === MODES.LOADING && (
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-center">
              Procesando audio, por favor espere...
            </div>
          )}

          {mode === MODES.RESULTS && (
            <>
              <Waveform audioUrl={audioURL} />
              <div className="mt-4">
                <audio
                  src={audioURL}
                  controls
                  controlsList="nodownload"
                  className="w-full [&::-webkit-media-controls-panel]:bg-gray-100"
                />
              </div>
              {showTable && (
                <div className="mt-4 fade-in-organic">
                  <ResultTable files={processedFiles} />
                </div>
              )}
            </>
          )}

          {mode === MODES.IDLE && (
            <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500 w-full">
              Graba audio para ver el visualizador
            </div>
          )}
        </ContentTransition>
        {/* --- Botón de grabación y lógica de audio --- */}
        <AudioRecorder
          recording={recording}
          setRecording={setRecording}
          setAudioURL={setAudioURL}
          setAudioContext={setAudioContext}
          setSourceNode={setSourceNode}
          setRecordingTime={setRecordingTime}
          setIsLoading={setIsLoading}
          setProcessedFiles={setProcessedFiles}
        />
      </div>
    </div>
  );
}

// Componente para animar la transición de contenido
function ContentTransition({ children }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(false);
    const timeout = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timeout);
  }, [children]);
  return (
    <div className={`transition-fade-move ${show ? "in" : ""}`}>
      {children}
    </div>
  );
}

export default App;