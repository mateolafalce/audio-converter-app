import React, { useEffect, useRef } from 'react';

const FrequencyVisualizer = ({ audioContext, sourceNode }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    if (!audioContext || !sourceNode) return;

    // Configurar el analizador
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    sourceNode.connect(analyser);

    // Configurar el canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      ctx.fillStyle = '#1e1e2f';
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        ctx.fillStyle = `hsl(${i * 360 / bufferLength}, 100%, 50%)`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
    };
  }, [audioContext, sourceNode]);

  return (
    <canvas 
      ref={canvasRef} 
      width={500} 
      height={200}
      className="w-full border rounded"
    />
  );
};

export default FrequencyVisualizer;