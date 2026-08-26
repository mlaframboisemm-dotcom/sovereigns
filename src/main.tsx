import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CDPReactProvider } from '@coinbase/cdp-react';
import App from './App.tsx';
import './index.css';

const cdpConfig = {
  projectId: '741101fa-c2b9-4d56-97cc-08f255dfeac2',
  appName: 'My CDP Wallet',
  authMethods: ['email'] as ['email'],
  ethereum: { createOnLogin: 'eoa' as const },
  solana: { createOnLogin: true },
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => console.log('Sovereign PWA Service Worker registered:', registration.scope))
      .catch((error) => console.warn('PWA Service Worker registration failed:', error));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CDPReactProvider config={cdpConfig}>
      <App />
    </CDPReactProvider>
  </StrictMode>,
);
