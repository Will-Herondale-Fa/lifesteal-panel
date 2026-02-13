import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { VmProvider } from './context/VmContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <VmProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </VmProvider>
    </BrowserRouter>
  </React.StrictMode>
);
