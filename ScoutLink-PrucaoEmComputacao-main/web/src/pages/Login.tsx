import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { login } from '../services/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }

    setError('');
    if (!email || !password) {
      setError('Preencha e-mail e senha para continuar.');
      return;
    }

    try {
      setIsLoading(true);
      await login({ email: email.trim().toLowerCase(), password });
      window.location.href = '/dashboard';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao autenticar.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Decorative orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">⚜️</div>
          <h1 className="login-title">ScoutLink</h1>
          <p className="login-subtitle">Plataforma da Região Escoteira do DF</p>
          <span className="badge badge-gold" style={{ marginTop: 8 }}>Área do Colaborador</span>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="login-forgot">
            <a href="#" className="login-link">Esqueci minha senha</a>
          </div>

          <button type="submit" className="btn-primary login-btn" id="login-submit" disabled={isLoading}>
            {isLoading ? 'Entrando...' : '🔑 Entrar na Plataforma'}
          </button>

          {error ? <p className="login-error">{error}</p> : null}
        </form>

        {/* Placeholder notice */}
        <div className="login-notice">
          <span>🚧</span>
          <p>Este login agora usa Supabase Auth (sem JWT proprio no backend).</p>
        </div>

        {/* Footer */}
        <p className="login-footer">
          União dos Escoteiros do Brasil · IDP — 2026
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
