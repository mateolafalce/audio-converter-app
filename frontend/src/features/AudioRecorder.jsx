import React, { useRef } from "react";
import IconButton from "../components/IconButton";
import { bufferToWav } from "../utils/bufferToWav";
import { getApiUrl } from "../utils/getApiUrl";
import axios from "axios";

function AudioRecorder({
  recording,
  setRecording,
  setAudioURL,
  setAudioContext,
  setSourceNode,
  setRecordingTime,
  setIsLoading,
  setProcessedFiles
}) {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const bitDepth = 16;

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
        handleProcessAudio(audioUrl);
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
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

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

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex gap-2 items-center rounded-lg p-4 bg-white">
        {!recording
          ? <IconButton onClick={startRecording} isActive={false} icon="mic" />
          : <IconButton onClick={stopRecording} isActive={true} icon="mic" />
        }
      </div>
    </div>
  );
}

export default AudioRecorder;
