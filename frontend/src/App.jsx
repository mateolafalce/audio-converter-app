import React, { useState } from "react";
import FrequencyVisualizer from "./components/FrequencyVisualizer";
import Waveform from "./components/Waveform";
import AudioRecorder from "./features/AudioRecorder";
import ResultTable from "./components/ResultTable";
import { formatTime } from "./utils/formatTime";

function App() {
  // --- Estados principales de la app ---
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [audioContext, setAudioContext] = useState(null);
  const [sourceNode, setSourceNode] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);

  return (
    <div className="p-2 sm:p-4 max-w-full sm:max-w-xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Conversor de Audio Analógico a Digital</h1>
      {/* --- Visualización en tiempo real mientras graba --- */}
      {recording && audioContext && sourceNode && (
        <>
          <div className="ml-2 text-gray-500 font-medium">Tiempo: {formatTime(recordingTime)}</div>
          <div className="rounded bg-gray-100 p-2 my-2">
            <FrequencyVisualizer audioContext={audioContext} sourceNode={sourceNode} />
          </div>
        </>
      )}
      {/* --- Visualización y descarga de resultados cuando hay audio --- */}
      {!recording && audioURL && (
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
          {isLoading
            ? <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg">Procesando audio, por favor espere...</div>
            : <ResultTable files={processedFiles} />
          }
        </>
      )}
      {/* --- Mensaje inicial cuando no hay audio --- */}
      {!recording && !audioURL && (
        <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500">
          Graba audio para ver el visualizador
        </div>
      )}
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
  );
}

export default App;