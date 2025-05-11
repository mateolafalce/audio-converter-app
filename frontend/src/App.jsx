import React, { useState, useRef } from "react";
import axios from "axios";
import Waveform from "./Waveform";
import FrequencyVisualizer from "./FrequencyVisualizer";

function App() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [bitDepth, setBitDepth] = useState(16);
  const [audioContext, setAudioContext] = useState(null);
  const [sourceNode, setSourceNode] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Función para enviar audio al backend y obtener la descarga
  const handleDownloadFromBackend = async (format) => {
    setIsLoading(true);
    try {
      const audio = new Audio(audioURL);
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const response = await fetch(audioURL);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      let bufferToUse = audioBuffer;

      // Convertir a WAV (el backend se encargará de la conversión a MP3 si es necesario)
      const wavBlob = bufferToWav(bufferToUse);
      const formData = new FormData();
      formData.append("file", wavBlob, "audio.wav");
      formData.append("bit_depth", bitDepth);
      formData.append("format", format); // 'wav' o 'mp3'
      formData.append("use_selection", "false");

      // Enviar al backend para procesamiento
      const result = await axios.post("http://localhost:8000/convert", formData, {
        responseType: 'blob'
      });

      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([result.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audio.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error("Error al descargar:", error);
      alert("Hubo un error al procesar el audio");
    } finally {
      setIsLoading(false);
    }
  };

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

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error('Tu navegador no soporta grabación de audio');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      
      setAudioContext(context);
      setSourceNode(source);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');
      
      if (!hasMicrophone) {
        throw new Error('No se detectaron micrófonos');
      }

      const options = { mimeType: 'audio/mp4' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

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
      console.error('Error detallado:', error);
      
      let errorMessage = 'Error al acceder al micrófono';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permiso denegado. Por favor habilita el acceso al micrófono en la configuración de tu navegador';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No se encontró ningún dispositivo de micrófono conectado';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'No se puede acceder al micrófono. Puede que esté siendo usado por otra aplicación';
      } else if (error.message.includes('mimeType')) {
        errorMessage = 'Formato de audio no soportado. Prueba con otro navegador (Chrome/Edge recomendado)';
      }
      
      alert(errorMessage);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 max-w-xl mx-auto">

      <h1 className="text-2xl font-bold mb-4">Conversor de Audio Analógico a Digital</h1>
      {recording && audioContext && sourceNode && (
          <div className="ml-2 text-gray-700 font-medium">
            Tiempo: {formatTime(recordingTime)}
          </div>
      )}
      {recording && audioContext && sourceNode && (
      
        <FrequencyVisualizer 
          audioContext={audioContext} 
          sourceNode={sourceNode} 
        />
      )}

      {!recording && audioURL && (
        <>
          <Waveform 
            audioUrl={audioURL} 
          />

          <div className="mt-4">
            <audio 
              src={audioURL} 
              controls 
              controlsList="nodownload" 
              className="w-full [&::-webkit-media-controls-panel]:bg-gray-100"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleDownloadFromBackend('wav')}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              {isLoading ? "Procesando..." : "Descargar WAV"}
            </button>
            
            <button
              onClick={() => handleDownloadFromBackend('mp3')}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              {isLoading ? "Procesando..." : "Descargar MP3"}
            </button>
      
          <label className="block mb-2">
            Profundidad de bits:
            <select
              className="ml-2 border p-1"
              value={bitDepth}
              onChange={(e) => setBitDepth(parseInt(e.target.value))}
            >
              <option value={8}>8 bits</option>
              <option value={16}>16 bits</option>
              <option value={24}>24 bits</option>
            </select>
          </label>
      
          </div>
        </>
      )}

      {!recording && !audioURL && (
        <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500">
          Graba audio para ver el visualizador
        </div>
      )}

    <div className="flex flex-col items-center justify-center">
      <div className="flex gap-2 items-center rounded-lg p-4 bg-white">
        {!recording ? (
          <button 
            onClick={startRecording} 
            className="bg-red-500 hover:bg-green-600 text-white px-4 py-3 rounded-full"
          >
            <i className="material-icons" style={{ fontSize: '36px' }}>mic</i>
          </button>
        ) : (
          <button 
            onClick={stopRecording} 
            className="bg-green-500 hover:bg-red-600 text-white px-4 py-2 rounded-full"
          >
            <i className="material-icons" style={{ fontSize: '36px' }}>mic</i>
          </button>
        )}
      </div>
    </div>

    </div>
  );
}

export default App;