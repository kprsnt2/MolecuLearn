
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill process.env for browser environment compatibility
// This ensures that accessing process.env.API_KEY doesn't throw "process is not defined"
if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
} else if (!process.env) {
  // If process exists but env is missing (rare but possible in some bundlers)
  (process as any).env = {};
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
