import React, { useState, useEffect } from "react";
import FrequencyVisualizer from "./components/FrequencyVisualizer";
import Waveform from "./components/Waveform";
import AudioRecorder from "./features/AudioRecorder";
import ResultTable from "./components/ResultTable";
import MessageReproduct from "./components/MessageReproduct"; 
import { formatTime } from "./utils/formatTime";

//son modos de la app
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
  const [playingInfo, setPlayingInfo] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [layoutMode, setLayoutMode] = useState("center");
  const [showLoading, setShowLoading] = useState(false);
  const [showContent, setShowContent] = useState(true);

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

  // Controla el layout para evitar el "salto" visual
  useEffect(() => {
    if (mode === MODES.LOADING) {
      setLayoutMode("center");
      setShowLoading(true);
      setShowContent(false);
    } else if (mode === MODES.RESULTS) {
      setLayoutMode("top");
      setShowLoading(false);
      setShowContent(true);
    } else {
      setLayoutMode("center");
      setShowLoading(false);
      setShowContent(true);
    }
  }, [mode]);

  // Evita el "choque" mostrando el loading al menos 350ms
  useEffect(() => {
    let timeout;
    if (mode === MODES.LOADING) {
      setShowLoading(true);
      setShowContent(false);
      timeout = setTimeout(() => {
        if (mode !== MODES.LOADING) setShowLoading(false);
      }, 350);
    }
    return () => clearTimeout(timeout);
  }, [mode]);

  // Para pasar el control de overlay a ResultTable
  function handlePlayAudio(info, url) {
    setPlayingInfo(info);
    setCurrentAudio(url);
  }
  function handleCloseOverlay() {
    setPlayingInfo(null);
    setCurrentAudio(null);
  }
  function handleAudioEnded() {
    setPlayingInfo(null);
    setCurrentAudio(null);
  }

  const containerClass =
    "min-h-screen flex flex-col justify-start sm:justify-center items-center bg-white transition-mt pt-0 pb-0"; // min-h-screen para crecer si es necesario

  return (
    <div className="relative h-screen z-30"> {/* Cambia min-h-screen por h-screen */}
      {/* Overlay global */}
      {playingInfo && (
        <MessageReproduct
          format={playingInfo.format}
          bitDepth={playingInfo.bitDepth}
          audio={currentAudio}
          onClose={handleCloseOverlay}
          onEnded={handleAudioEnded}
        />
      )}
      {/* Contenido principal con blur si overlay activo */}
      <div className={playingInfo ? "pointer-events-none blur-sm select-none transition-all duration-200" : ""}>
        <div className={containerClass}>
          {/* Ajusta el ancho y padding para móviles */}
          <div className="mt-2 p-2 sm:p-4 max-w-full sm:max-w-xl mx-auto w-full">
            <h1 className="text-xl font-bold mt-0 mb-2 text-center">
              Conversor de Audio Analógico a Digital
            </h1>
            {showLoading ? (
              <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-center">
                Procesando audio, por favor espere...
              </div>
            ) : showContent && (
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

                {mode === MODES.RESULTS && (
                  <>
                    <Waveform audioUrl={audioURL} />
                    <div className="mt-4">
                      {/* Ajusta el audio para que no se corte en móviles */}
                      <audio
                        src={audioURL}
                        controls
                        controlsList="nodownload"
                        className="w-full max-w-full overflow-x-auto [&::-webkit-media-controls-panel]:bg-gray-100"
                        style={{ minWidth: 0 }}
                      />
                    </div>
                    {showTable && (
                      <div className="mt-4 fade-in-organic">
                        <ResultTable
                          files={processedFiles}
                          onPlayAudio={(info, url) => handlePlayAudio(info, url)}
                        />
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
            )}
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