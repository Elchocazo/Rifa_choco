import { useState, useEffect } from 'react';
import DesktopApp from './DesktopApp';
import MobileApp from './MobileApp';
import { db } from './firebase';
import { doc, setDoc, increment } from 'firebase/firestore';

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const trackVisit = async () => {
      if (!localStorage.getItem('choco_visited')) {
        try {
          const statsRef = doc(db, 'stats', 'global');
          await setDoc(statsRef, { visits: increment(1) }, { merge: true });
          localStorage.setItem('choco_visited', 'true');
        } catch (error) {
          console.error("Error tracking visit:", error);
        }
      }
    };
    trackVisit();
  }, []);

  return isMobile ? <MobileApp /> : <DesktopApp />;
}
