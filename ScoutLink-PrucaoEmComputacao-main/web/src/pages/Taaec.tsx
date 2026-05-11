import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import './Taaec.css';

interface UelConvidada {
  nome_uel: string;
  nome_responsavel: string;
}

const uelsResponsavelList = [
  'Favor selecionar',
  '1º DF - GE MORAES ANTAS',
  '2º DF - GE JK',
  '3º DF - GE JOÃO DE BARRO',
  '4º DF - GE MARECHAL RONDON',
  '5º DF - GE ROBERTO SIMONSEN',
];

const TaaecPage: React.FC = () => {
  const [formData, setFormData] = useState({
    nome_atividade: '',
    uel_responsavel: '',
    ramos_participantes: [] as string[],
    quant_jovens: 0,
    quant_adultos: 0,
    objetivos_educativos: '',
    nivel_risco: '',
    local_atividade: '',
    url_localizador: '',
    escotista_nome: '',
    escotista_email: '',
    escotista_celular: '',
    diretor_nome: '',
    diretor_cargo: '',
    diretor_email: '',
    diretor_celular: '',
  });

  const [uelsConvidadas, setUelsConvidadas] = useState<UelConvidada[]>([]);
  const [newUel, setNewUel] = useState<UelConvidada>({ nome_uel: '', nome_responsavel: '' });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [fileRelatorio, setFileRelatorio] = useState<File | null>(null);
  const [fileAgenda, setFileAgenda] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (ramo: string) => {
    setFormData((prev) => {
      const isSelected = prev.ramos_participantes.includes(ramo);
      if (isSelected) {
        return { ...prev, ramos_participantes: prev.ramos_participantes.filter((r) => r !== ramo) };
      } else {
        return { ...prev, ramos_participantes: [...prev.ramos_participantes, ramo] };
      }
    });
  };

  const handleAddUel = () => {
    if (newUel.nome_uel.trim() && newUel.nome_responsavel.trim()) {
      setUelsConvidadas([...uelsConvidadas, newUel]);
      setNewUel({ nome_uel: '', nome_responsavel: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    const payload = { ...formData, uels_convidadas: uelsConvidadas };

    try {
      // Usando API do Railway backend (ou onde estiver local)
      const res = await fetch('http://localhost:8000/api/taaec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Erro ao salvar no servidor');
      }

      const data = await res.json();
      setCreatedId(data.id);
      setStatusMsg({ type: 'success', text: 'TAAEC enviado com sucesso!' });
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: error.message || 'Ocorreu um erro.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="taaec-container">
      <h1 className="taaec-title">Termo de Autorização de Atividade Escoteira Compartilhada – TAAEC</h1>

      <form onSubmit={handleSubmit}>
        <div className="taaec-section">
          <h2 className="taaec-section-title">Dados Básicos da Atividade</h2>

          <div className="taaec-form-group">
            <label>Nome da Atividade <span className="required">*</span></label>
            <input
              type="text"
              name="nome_atividade"
              className="taaec-input"
              placeholder="Nome da atividade como consta no Paxtu"
              value={formData.nome_atividade}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="taaec-form-group">
            <label>Unidade Escoteira Responsável pela Atividade <span className="required">*</span></label>
            <select
              name="uel_responsavel"
              className="taaec-select"
              value={formData.uel_responsavel}
              onChange={handleInputChange}
              required
            >
              {uelsResponsavelList.map((uel) => (
                <option key={uel} value={uel}>{uel}</option>
              ))}
            </select>
          </div>

          <div className="taaec-form-group">
            <label>Unidade(s) Escoteira(s) Convidada(s) para a Atividade</label>
            
            <div className="taaec-table-container">
              <table className="taaec-table">
                <thead>
                  <tr>
                    <th>UEL Convidada</th>
                    <th>Nome do Responsável na UEL Convidada</th>
                  </tr>
                </thead>
                <tbody>
                  {uelsConvidadas.map((uel, idx) => (
                    <tr key={idx}>
                      <td>{uel.nome_uel}</td>
                      <td>{uel.nome_responsavel}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <input
                        type="text"
                        className="taaec-input"
                        value={newUel.nome_uel}
                        onChange={(e) => setNewUel({ ...newUel, nome_uel: e.target.value })}
                        placeholder="Nome UEL"
                      />
                    </td>
                    <td style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="taaec-input"
                        value={newUel.nome_responsavel}
                        onChange={(e) => setNewUel({ ...newUel, nome_responsavel: e.target.value })}
                        placeholder="Responsável UEL"
                      />
                      <button type="button" className="taaec-btn taaec-btn-secondary" onClick={handleAddUel}>
                        Salvar e Adicionar UEL
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="taaec-form-group">
            <label>Ramo(s) que Participará(ão) da Atividade <span className="required">*</span></label>
            <div className="taaec-checkbox-group">
              {['RAMO FILHOTES', 'RAMO ESCOTEIRO', 'RAMO PIONEIRO', 'RAMO LOBINHO', 'RAMO SÊNIOR'].map((ramo) => (
                <label key={ramo} className="taaec-checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.ramos_participantes.includes(ramo)}
                    onChange={() => handleCheckboxChange(ramo)}
                  />
                  {ramo}
                </label>
              ))}
            </div>
          </div>

          <div className="taaec-row">
            <div className="taaec-col">
              <div className="taaec-form-group">
                <label>Quantidade de Jovens na Atividade <span className="required">*</span></label>
                <input
                  type="number"
                  name="quant_jovens"
                  className="taaec-input"
                  value={formData.quant_jovens}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="taaec-col">
              <div className="taaec-form-group">
                <label>Quantidade de Adultos na Atividade <span className="required">*</span></label>
                <input
                  type="number"
                  name="quant_adultos"
                  className="taaec-input"
                  value={formData.quant_adultos}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="taaec-form-group">
            <label>Objetivos Educativos <span className="required">*</span></label>
            <ReactQuill
              theme="snow"
              value={formData.objetivos_educativos}
              onChange={(val) => setFormData((prev) => ({ ...prev, objetivos_educativos: val }))}
              placeholder="Objetivos educativos da atividade..."
            />
          </div>

          <div className="taaec-form-group">
            <label>Nível de Risco da Atividade <span className="required">*</span></label>
            <div className="taaec-radio-group">
              {['Nível de risco moderado', 'Nível de risco elevado', 'Nível de risco elevado - atividade de longa duração'].map((risco) => (
                <label key={risco} className="taaec-radio-item">
                  <input
                    type="radio"
                    name="nivel_risco"
                    value={risco}
                    checked={formData.nivel_risco === risco}
                    onChange={handleInputChange}
                    required
                  />
                  {risco}
                </label>
              ))}
            </div>
          </div>

          <div className="taaec-row">
            <div className="taaec-col">
              <div className="taaec-form-group">
                <label>Local da Atividade <span className="required">*</span></label>
                <textarea
                  name="local_atividade"
                  className="taaec-textarea"
                  value={formData.local_atividade}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
            </div>
            <div className="taaec-col">
              <div className="taaec-form-group">
                <label>URL Localizador <span className="required">*</span></label>
                <input
                  type="url"
                  name="url_localizador"
                  className="taaec-input"
                  value={formData.url_localizador}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="taaec-section">
          <h2 className="taaec-section-title">Documentos</h2>
          <div className="taaec-row">
            <div className="taaec-col">
              <label style={{display: 'block', marginBottom: '10px'}}>Relatório de Atividade Detalhado (extraído do Paxtu Adm.) <span className="required">*</span></label>
              <label className="taaec-file-upload">
                <UploadCloud size={40} color={fileRelatorio ? "#40c057" : "#1971c2"} />
                <p><strong>{fileRelatorio ? "Arquivo Selecionado" : "Pesquisar Arquivos"}</strong></p>
                <p style={{ color: fileRelatorio ? "#2b8a3e" : "#6c757d" }}>
                  {fileRelatorio ? fileRelatorio.name : "Arraste e solte seus arquivos aqui"}
                </p>
                <input 
                  type="file" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setFileRelatorio(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
            <div className="taaec-col">
              <label style={{display: 'block', marginBottom: '10px'}}>Agenda Detalhada (extraído do Paxtu Adm.) ou Programação Detalhada <span className="required">*</span></label>
              <label className="taaec-file-upload">
                <UploadCloud size={40} color={fileAgenda ? "#40c057" : "#1971c2"} />
                <p><strong>{fileAgenda ? "Arquivo Selecionado" : "Pesquisar Arquivos"}</strong></p>
                <p style={{ color: fileAgenda ? "#2b8a3e" : "#6c757d" }}>
                  {fileAgenda ? fileAgenda.name : "Arraste e solte seus arquivos aqui"}
                </p>
                <input 
                  type="file" 
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setFileAgenda(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="taaec-section">
          <h2 className="taaec-section-title">Escotista Responsável pela Atividade</h2>
          <div className="taaec-form-group">
            <label>Escotista Responsável pela Atividade <span className="required">*</span></label>
            <input type="text" name="escotista_nome" className="taaec-input" value={formData.escotista_nome} onChange={handleInputChange} required />
          </div>
          <div className="taaec-row">
            <div className="taaec-col">
              <div className="taaec-form-group">
                <label>E-mail do Escotista Responsável <span className="required">*</span></label>
                <input type="email" name="escotista_email" className="taaec-input" value={formData.escotista_email} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="taaec-col">
              <div className="taaec-form-group">
                <label>Celular do Escotista Responsável <span className="required">*</span></label>
                <input type="tel" name="escotista_celular" className="taaec-input" placeholder="(00) 00000-0000" value={formData.escotista_celular} onChange={handleInputChange} required />
              </div>
            </div>
          </div>
        </div>

        <div className="taaec-section">
          <h2 className="taaec-section-title">Diretor / Autorizador da UEL Responsável pela Atividade</h2>
          <div className="taaec-row">
            <div className="taaec-col">
              <div className="taaec-form-group">
                <label>Nome do Diretor / Autorizador da UEL <span className="required">*</span></label>
                <input type="text" name="diretor_nome" className="taaec-input" value={formData.diretor_nome} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="taaec-col">
              <div className="taaec-form-group">
                <label>Cargo / Função <span className="required">*</span></label>
                <input type="text" name="diretor_cargo" className="taaec-input" value={formData.diretor_cargo} onChange={handleInputChange} required />
              </div>
            </div>
          </div>
          <div className="taaec-row">
            <div className="taaec-col">
              <div className="taaec-form-group">
                <label>E-mail do Diretor / Autorizador <span className="required">*</span></label>
                <input type="email" name="diretor_email" className="taaec-input" value={formData.diretor_email} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="taaec-col">
              <div className="taaec-form-group">
                <label>Celular do Diretor / Autorizador <span className="required">*</span></label>
                <input type="tel" name="diretor_celular" className="taaec-input" placeholder="(00) 00000-0000" value={formData.diretor_celular} onChange={handleInputChange} required />
              </div>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className={`alert-${statusMsg.type}`}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {statusMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span style={{ marginLeft: '10px' }}>{statusMsg.text}</span>
            </div>
            {statusMsg.type === 'success' && createdId && (
              <div style={{ marginTop: '15px', paddingLeft: '30px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>O documento já foi processado no formato oficial.</p>
                <a 
                  href={`http://localhost:8000/api/taaec/${createdId}/pdf`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="taaec-btn taaec-btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  📥 Baixar PDF do TAAEC
                </a>
              </div>
            )}
          </div>
        )}

        <div className="taaec-actions">
          <button type="button" className="taaec-btn taaec-btn-secondary">Salvar</button>
          <button type="submit" className="taaec-btn taaec-btn-primary" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaaecPage;
