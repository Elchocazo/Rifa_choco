import { useState, useEffect } from 'react';
import DesktopApp from './DesktopApp';
import MobileApp from './MobileApp';

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <MobileApp /> : <DesktopApp />;
}
