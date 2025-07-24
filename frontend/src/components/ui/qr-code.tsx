import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  bgColor?: string;
  fgColor?: string;
  className?: string;
}

export function QRCodeComponent({
  value,
  size = 150,
  level = 'M',
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  className = '',
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const generateQR = async () => {
      if (canvasRef.current && value) {
        setIsLoading(true);
        setError(null);
        
        try {
          console.log('Generating QR code for value:', value.substring(0, 100) + '...');
          console.log('QR code length:', value.length);
          
          await QRCode.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 2,
            color: {
              dark: fgColor,
              light: bgColor,
            },
            errorCorrectionLevel: level,
          });
          
          console.log('QR code generated successfully');
          setIsLoading(false);
        } catch (error) {
          console.error('QR code generation error:', error);
          setError(`QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      }
    };

    generateQR();
  }, [value, size, level, bgColor, fgColor, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (error) {
    return (
      <div className={`flex flex-col justify-center items-center space-y-2 ${className}`}>
        <div className="text-red-500 text-sm text-center">Error: {error}</div>
        <button 
          onClick={handleRetry}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`flex justify-center items-center relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
          <div className="text-sm text-gray-600">Generating QR...</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          maxWidth: '100%',
        }}
      />
    </div>
  );
}

export default QRCodeComponent; 