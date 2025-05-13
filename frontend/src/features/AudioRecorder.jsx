import React, { useRef, useState } from "react";
import IconButton from "../components/IconButton";
import { bufferToWav } from "../utils/bufferToWav";
import { getApiUrl } from "../utils/getApiUrl";
import axios from "axios";
import MessageAlert from "../components/MessageAlert";

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
  const [isBusy, setIsBusy] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const resetToInitial = () => {
    setAlertMsg("");
    setAudioURL("");
    setRecording(false);
    setAudioContext(null);
    setSourceNode(null);
    setRecordingTime(0);
    setProcessedFiles([]);
    setIsLoading(false);
  };

  // Helper para mostrar alertas de forma confiable
  const showError = (msg) => {
    setAlertMsg(""); // Limpia primero
    setTimeout(() => setAlertMsg(msg), 10); // Luego setea el mensaje, forzando el remount
  };

  const startRecording = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      if (window._activeAudioContext && window._activeAudioContext.state !== "closed") {
        await window._activeAudioContext.close();
      }
      if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('Tu navegador no soporta grabación de audio');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 44100, channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const context = new (window.AudioContext || window.webkitAudioContext)();
      window._activeAudioContext = context;
      const source = context.createMediaStreamSource(stream);
      setAudioContext(context); setSourceNode(source);
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (!devices.some(device => device.kind === 'audioinput')) throw new Error('No se detectaron micrófonos');
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = async () => {
        clearInterval(timerRef.current);
        // Validar que haya chunks y que el blob tenga tamaño suficiente
        if (!audioChunksRef.current.length) {
          setIsBusy(false);
          setRecording(false);
          setAudioURL("");
          showError("No se grabó audio. Intenta grabar al menos 1 segundo.");
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        if (!audioBlob || audioBlob.size < 2000) { // subí el mínimo a 2KB
          setIsBusy(false);
          setRecording(false);
          setAudioURL("");
          showError("La grabación fue demasiado corta o falló. Intenta grabar al menos 1 segundo.");
          return;
        }
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        try {
          await handleProcessAudio(audioUrl);
        } catch (e) {
          setAudioURL("");
          showError("El audio grabado no es válido o está corrupto. Intenta grabar de nuevo.");
        }
        setIsBusy(false);
      };
      audioChunksRef.current = [];
      mediaRecorderRef.current.start(100);
      setRecording(true);
      setIsBusy(false);
    } catch (error) {
      showError(
        error.message.includes('mimeType')
          ? 'Formato de audio no soportado. Prueba con otro navegador (Chrome/Edge recomendado)'
          : 'Error al acceder al micrófono'
      );
      setRecording(false);
      setIsBusy(false);
    }
  };

  const stopRecording = () => {
    if (isBusy) return;
    setIsBusy(true);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (window._activeAudioContext && window._activeAudioContext.state !== "closed") {
      window._activeAudioContext.close().finally(() => setIsBusy(false));
    } else {
      setIsBusy(false);
    }
  };

  const handleProcessAudio = async (audioUrl) => {
    setIsLoading(true);
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      // Validar que el arrayBuffer tenga tamaño suficiente
      if (!arrayBuffer || arrayBuffer.byteLength < 2000) {
        throw new Error("El archivo de audio es demasiado pequeño o está vacío.");
      }
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
      showError(
        error.message.includes("decode")
          ? "El audio grabado no es válido o está corrupto. Intenta grabar de nuevo."
          : `Error al procesar el audio: ${error.message}`
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex gap-2 items-center rounded-lg p-4 bg-white">
        {!recording
          ? <IconButton onClick={startRecording} isActive={false} icon="mic" disabled={isBusy} />
          : <IconButton onClick={stopRecording} isActive={true} icon="mic" disabled={isBusy} />
        }
        {isBusy && (
          <div className="ml-2">
            <svg className="animate-spin h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
        )}
      </div>
      {alertMsg && (
        <MessageAlert mensaje={alertMsg} onClose={resetToInitial} />
      )}
    </div>
  );
}

export default AudioRecorder;
