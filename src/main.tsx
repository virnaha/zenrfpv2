import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logConfigurationStatus } from './lib/config';

// Log configuration status at startup
logConfigurationStatus();

createRoot(document.getElementById("root")!).render(<App />);
