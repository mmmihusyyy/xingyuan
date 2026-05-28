import { StrictMode, useState, useEffect, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MemoriesPage from './MemoriesPage.jsx'
import GramophonePage from './GramophonePage.jsx'

function useHash() {
  return useSyncExternalStore(
    (cb) => { window.addEventListener("hashchange", cb); return () => window.removeEventListener("hashchange", cb); },
    () => window.location.hash,
  );
}

function Router() {
  const hash = useHash();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  // Hostname-based routing for starwell.space subdomains
  if (hostname === "memory.starwell.space") {
    if (hash === "#/gramophone") return <GramophonePage />;
    return <MemoriesPage />;
  }
  if (hostname === "kara.starwell.space") return <App />;

  // Legacy hash-based routing fallback (old URLs xingyuan-roan / dist-lac-ten-73)
  if (hash === "#/gramophone") return <GramophonePage />;
  if (hash === "#/memories") return <MemoriesPage />;
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
