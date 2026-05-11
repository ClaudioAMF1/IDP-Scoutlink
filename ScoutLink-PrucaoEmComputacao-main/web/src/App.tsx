import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getSession } from './services/auth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ComunicacaoPage from './pages/Comunicacao';
import MalotesPage from './pages/Malotes';
import GerenciamentoAdminPage from './pages/GerenciamentoAdmin';
import LoginPage from './pages/Login';
import './App.css';

function ProtectedLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/comunicacao" element={<ComunicacaoPage />} />
          <Route path="/malotes" element={<MalotesPage />} />
          <Route path="/admin" element={<GerenciamentoAdminPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      setIsLoggedIn(!!session);
      setSessionChecked(true);
    });
  }, []);

  if (!sessionChecked) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <span>Verificando sessão…</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/*" element={isLoggedIn ? <ProtectedLayout /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
