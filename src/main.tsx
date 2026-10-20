import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out benign Firestore watchdog 10s timeout warnings in browser iframes/proxies
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const firstArg = typeof args[0] === 'string' ? args[0] : '';
    if (
      firstArg.includes('Could not reach Cloud Firestore backend') ||
      firstArg.includes('Backend didn\'t respond within 10 seconds')
    ) {
      console.warn(...args);
      return;
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(<App />);
