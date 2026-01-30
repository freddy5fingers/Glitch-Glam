
import React, { useRef, useState, useEffect } from 'react';

interface CameraProps {
  onCapture: (image: string) => void;
  onClose: () => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Camera access required for try-on.");
      }
    };
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current;
      const c = canvasRef.current;
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext('2d')!;
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0);
      onCapture(c.toDataURL('image/png'));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-12 text-center text-zinc-500">
            <p className="font-bold">{error}</p>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
        )}
        
        {/* Face Guide Overlay */}
        <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none flex items-center justify-center">
           <div className="w-[80vw] h-[80vw] lg:w-[40vh] lg:h-[40vh] rounded-full border-2 border-white/20 border-dashed" />
        </div>
      </div>

      <div className="bg-black/80 backdrop-blur-3xl p-10 flex items-center justify-around">
        <button onClick={onClose} className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white p-1">
          <div className="w-full h-full rounded-full border-4 border-black" />
        </button>
        <div className="w-14" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Camera;
