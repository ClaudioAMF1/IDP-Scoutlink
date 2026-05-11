import React from 'react';

interface PlaceholderPageProps {
  icon: string;
  title: string;
  description: string;
  moduleId: string;
  priority: 'Must Have' | 'Should Have' | 'Could Have';
  features: string[];
}

const priorityBadge = {
  'Must Have': 'badge-red',
  'Should Have': 'badge-gold',
  'Could Have': 'badge-green',
};

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  icon, title, description, moduleId, priority, features
}) => {
  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="section-title">{icon} {title}</h1>
          <p className="section-subtitle">{description}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="badge badge-purple">{moduleId}</span>
          <span className={`badge ${priorityBadge[priority]}`}>{priority}</span>
        </div>
      </div>

      {/* Coming soon */}
      <div className="coming-soon-wrap">
        <div className="cs-icon">🚧</div>
        <h2>{title}</h2>
        <p>Este módulo está em desenvolvimento. As funcionalidades serão implementadas nas próximas sprints do projeto ScoutLink.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          <span className="badge badge-purple">{moduleId}</span>
          <span className="badge badge-gold">Sprint em breve</span>
        </div>
      </div>

      {/* Features preview */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 className="section-title" style={{ fontSize: 16, marginBottom: 16 }}>📌 Funcionalidades Previstas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((feat, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: 'var(--bg-surface)',
              borderRadius: 10, border: '1px solid var(--border-subtle)',
              fontSize: 14, color: 'var(--text-secondary)'
            }}>
              <span style={{ color: 'var(--scout-lilac)', fontSize: 18, flexShrink: 0 }}>○</span>
              {feat}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
