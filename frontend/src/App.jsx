import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import FrequencyVisualizer from "./FrequencyVisualizer";
import Waveform from "./Waveform";

// --- Utilidades de estilo ---
const btnBase = "rounded-full text-white px-4 py-3";
const iconStyle = { fontSize: '36px' };
const tableBase = "min-w-full bg-white border border-gray-200 block w-full";
const thBase = "px-2 py-2 sm:px-6 sm:py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tdBase = "px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900";

// --- Utilidad para obtener la URL de la API ---
function getApiUrl(endpoint) {
  // Si estamos en desarrollo local
  if (window.location.hostname === "localhost") {
    return `http://localhost:8002${endpoint}`;
  }
  // Producción: usa proxy o ruta relativa
  return `/api${endpoint}`;
}

// --- Componentes reutilizables ---
const IconButton = ({ onClick, color, icon }) => (
  <button onClick={onClick} className={`${btnBase} ${color}`}>
    <i className="material-icons" style={iconStyle}>{icon}</i>
  </button>
);

const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto w-full">
    <table className={tableBase}>
      <thead className="bg-gray-50">
        <tr>
          {headers.map(h => (
            <th key={h.key} className={thBase}>{h.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {rows.map((row, idx) => (
          <tr key={idx}>
            {headers.map(h => (
              <td key={h.key} className={tdBase}>
                {h.render ? h.render(row[h.key], row) : row[h.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Tabla de resultados ---
function ResultTable({ files }) {
  if (!files.length) return null;
  const headers = [
    { label: "Formato", key: "format", render: v => v.toUpperCase() },
    { label: "Profundidad (bits)", key: "bitDepth" },
    { label: "Tamaño (KB)", key: "sizeKB" },
    { label: "Acción", key: "url", render: (v, f) =>
      <a href={v} download={`audio_${f.bitDepth}bits.${f.format}`} className="text-blue-600 hover:text-blue-800 hover:underline">Descargar</a>
    }
  ];
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Comparativa de formatos</h2>
      <Table headers={headers} rows={files} />
    </div>
  );
}

// --- Utilidad para formatear tiempo ---
const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// --- Conversión de buffer a WAV ---
function bufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let offset = 0;
  const writeString = function (str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  writeString("RIFF"); offset += 4;
  view.setUint32(offset, length - 8, true); offset += 4;
  writeString("WAVE"); offset += 4;
  writeString("fmt "); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numOfChan, true); offset += 2;
  view.setUint32(offset, buffer.sampleRate, true); offset += 4;
  view.setUint32(offset, buffer.sampleRate * 2 * numOfChan, true); offset += 4;
  view.setUint16(offset, numOfChan * 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeString("data"); offset += 4;
  view.setUint32(offset, length - offset - 4, true); offset += 4;
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  let sample = 0;
  while (sample < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      const s = Math.max(-1, Math.min(1, channels[i][sample]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    sample++;
  }
  return new Blob([view], { type: "audio/wav" });
}

// --- App principal ---
function App() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [bitDepth] = useState(16);
  const [audioContext, setAudioContext] = useState(null);
  const [sourceNode, setSourceNode] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);

  // --- Grabación ---
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('Tu navegador no soporta grabación de audio');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 44100, channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      setAudioContext(context); setSourceNode(source);
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (!devices.some(device => device.kind === 'audioinput')) throw new Error('No se detectaron micrófonos');
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        clearInterval(timerRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
      };
      audioChunksRef.current = [];
      mediaRecorderRef.current.start(100);
      setRecording(true);
    } catch (error) {
      alert(error.message.includes('mimeType') ? 'Formato de audio no soportado. Prueba con otro navegador (Chrome/Edge recomendado)' : 'Error al acceder al micrófono');
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        clearInterval(timerRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        handleProcessAudio(audioUrl);
      };
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // --- Procesamiento ---
  const handleProcessAudio = async (audioUrl) => {
    setIsLoading(true);
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const wavBlob = bufferToWav(audioBuffer);
      const formData = new FormData();
      formData.append("file", wavBlob, "audio.wav");
      formData.append("bit_depth", bitDepth);
      formData.append("use_selection", "false");
      const response1 = await axios.post(getApiUrl("/convert"), formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (!response1.data.results) throw new Error("El backend no devolvió resultados");
      const processedFiles = response1.data.results.map(result => {
        try {
          const binaryString = atob(result.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          const blob = new Blob([bytes], { type: result.mime_type });
          return {
            format: result.format,
            bitDepth: result.bit_depth,
            blob,
            sizeKB: (result.size / 1024).toFixed(2),
            url: URL.createObjectURL(blob)
          };
        } catch {
          return null;
        }
      }).filter(Boolean);
      setProcessedFiles(processedFiles);
    } catch (error) {
      alert(`Error al procesar el audio: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="p-2 sm:p-4 max-w-full sm:max-w-xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Conversor de Audio Analógico a Digital</h1>
      {recording && audioContext && sourceNode && (
        <>
          <div className="ml-2 text-gray-700 font-medium">Tiempo: {formatTime(recordingTime)}</div>
          <FrequencyVisualizer audioContext={audioContext} sourceNode={sourceNode} />
        </>
      )}
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
      {!recording && !audioURL && (
        <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500">
          Graba audio para ver el visualizador
        </div>
      )}
      <div className="flex flex-col items-center justify-center">
        <div className="flex gap-2 items-center rounded-lg p-4 bg-white">
          {!recording
            ? <IconButton onClick={startRecording} color="bg-red-500 hover:bg-green-600" icon="mic" />
            : <IconButton onClick={stopRecording} color="bg-green-500 hover:bg-red-600" icon="mic" />
          }
        </div>
      </div>
    </div>
  );
}

export default App;