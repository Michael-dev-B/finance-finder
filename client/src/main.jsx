import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.jsx';
import { StoreProvider } from './store/index.js';
import LenisProvider from './motion/LenisProvider.jsx';
import HeroBackdrop from './three/HeroBackdrop.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LenisProvider>
      <HeroBackdrop />
      <StoreProvider>
        <App />
      </StoreProvider>
    </LenisProvider>
  </StrictMode>,
);
