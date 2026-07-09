import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { VerifyPage } from './VerifyPage.js';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

// Deliberately resolved once at bootstrap (not inside a component) so the
// choice of root component never depends on hook state or ordering.
const RootComponent = window.location.pathname === '/verify' ? VerifyPage : App;

createRoot(container).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
);
