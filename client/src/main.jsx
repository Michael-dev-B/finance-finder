import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.jsx';
import { StoreProvider } from './store/index.js';
import LenisProvider from './motion/LenisProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LenisProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </LenisProvider>
  </StrictMode>,
);
