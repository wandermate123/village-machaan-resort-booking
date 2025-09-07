import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface ImageDebuggerProps {
  imagePath: string;
  altText: string;
  className?: string;
  onImageLoad?: () => void;
  onImageError?: (error: string) => void;
}

const ImageDebugger: React.FC<ImageDebuggerProps> = ({
  imagePath,
  altText,
  className = '',
  onImageLoad,
  onImageError
}) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      console.log(`✅ Image loaded successfully: ${imagePath}`);
      setImageStatus('loaded');
      onImageLoad?.();
    };
    
    img.onerror = (e) => {
      const error = `Failed to load image: ${imagePath}`;
      console.error(`❌ ${error}`, e);
      setImageStatus('error');
      setErrorDetails(error);
      
      // Try fallback image
      if (imagePath !== '/images/glass-cottage/main.jpg') {
        console.log('🔄 Trying fallback image...');
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          console.log('✅ Fallback image loaded');
          setImageStatus('loaded');
          onImageLoad?.();
        };
        fallbackImg.onerror = () => {
          console.error('❌ Fallback image also failed');
          onImageError?.(error);
        };
        fallbackImg.src = '/images/glass-cottage/main.jpg';
        return;
      }
      
      onImageError?.(error);
    };
    
    img.src = imagePath;
  }, [imagePath]);

  if (imageStatus === 'loading') {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Loading image...</span>
      </div>
    );
  }

  if (imageStatus === 'error') {
    return (
      <div className={`bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center p-4 ${className}`}>
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <span className="text-red-700 text-sm text-center">Image not found</span>
        <span className="text-red-600 text-xs text-center mt-1">{imagePath}</span>
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="text-red-600 text-xs underline mt-2"
        >
          Debug Info
        </button>
        {showDebug && (
          <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 max-w-full overflow-hidden">
            <p><strong>Path:</strong> {imagePath}</p>
            <p><strong>Full URL:</strong> {window.location.origin + imagePath}</p>
            <p><strong>Error:</strong> {errorDetails}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <img 
      src={imageStatus === 'error' && imagePath !== '/images/glass-cottage/main.jpg' ? '/images/glass-cottage/main.jpg' : imagePath}
      alt={altText}
      className={className}
      onLoad={() => console.log(`✅ Image rendered: ${imagePath}`)}
    />
  );
};

export default ImageDebugger;