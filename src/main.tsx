import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logConfigurationStatus } from './lib/config';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

// Log configuration status at startup
logConfigurationStatus();

// Add Geist fonts to document
document.documentElement.classList.add(GeistSans.variable, GeistMono.variable);

createRoot(document.getElementById("root")!).render(<App />);
