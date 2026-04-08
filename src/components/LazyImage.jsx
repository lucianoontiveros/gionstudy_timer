import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ src, alt, className, style }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={imgRef} 
      className={className}
      style={{
        ...style,
        backgroundImage: isInView && isLoaded ? `url(${src})` : 'none',
        backgroundColor: '#f0f0f0',
        transition: 'background-image 0.3s ease-in-out'
      }}
    >
      {isInView && (
        <img
          src={src}
          alt={alt}
          style={{ display: 'none' }}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
};

export default React.memo(LazyImage);
