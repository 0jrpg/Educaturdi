'use client';

import { useEffect, useState } from 'react';
import { IconPlus, IconPencil, IconTrash, IconLock } from '@tabler/icons-react';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Usuario {
  id: string;
  email: string;
  nome: string;
  tipo: 'aluno' | 'professor' | 'admin';
  turma: string | null;
  created_at: string;
}

function initials(nome: string) {
  return nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}
function avatarColor(name: string) {
  const colors = ['#136337', '#1a82b4', '#7c3aed', '#c2410c', '#b91c7c', '#0d7377', '#b45309'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default function UsuariosClient({ turmas }: { turmas: string[] }) {
  const showToast = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalNovo, setModalNovo] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [excluindo, setExcluindo] = useState<Usuario | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsuarios(data.users);
    } catch (e: any) {
      showToast('Erro ao carregar usuários: ' + e.message, 'error');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function excluir() {
    if (!excluindo) return;
    try {
      const res = await fetch(`/api/usuarios/${excluindo.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Usuário excluído.', 'success');
      setExcluindo(null);
      carregar();
    } catch (e: any) {
      showToast('Erro ao excluir: ' + e.message, 'error');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Usuários</h1><p>Gerencie alunos, professores e administradores</p></div>
        <button className="btn btn-primary" onClick={() => setModalNovo(true)}>
          <IconPlus size={16} /> Novo Usuário
        </button>
      </div>

      <div className="card">
        <div className="card-hd"><h3>Usuários cadastrados ({usuarios.length})</h3></div>
        <div className="table-wrap">
          {carregando ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <table className="table">
              <thead><tr><th>Nome</th><th>E-mail</th><th>Tipo</th><th>Turma</th><th>Cadastrado em</th><th></th></tr></thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${avatarColor(u.nome)}22`, color: avatarColor(u.nome), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                          {initials(u.nome)}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{u.nome}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--s500)' }}>{u.email}</td>
                    <td><Badge variant={u.tipo === 'admin' ? 'red' : u.tipo === 'professor' ? 'blue' : 'green'}>{u.tipo}</Badge></td>
                    <td>{u.turma ?? <span style={{ color: 'var(--s300)' }}>—</span>}</td>
                    <td style={{ fontSize: 12, color: 'var(--s400)' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditando(u)}><IconPencil size={15} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--re700)' }} onClick={() => setExcluindo(u)}><IconTrash size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <FormUsuarioModal
        open={modalNovo}
        onClose={() => setModalNovo(false)}
        turmas={turmas}
        onSaved={() => { setModalNovo(false); carregar(); }}
      />

      {editando && (
        <FormUsuarioModal
          open={!!editando}
          onClose={() => setEditando(null)}
          turmas={turmas}
          usuario={editando}
          onSaved={() => { setEditando(null); carregar(); }}
        />
      )}

      <Modal
        open={!!excluindo}
        onClose={() => setExcluindo(null)}
        title="Excluir usuário"
        footer={
          <>
            <button className="btn btn-danger" onClick={excluir}>Excluir definitivamente</button>
            <button className="btn btn-outline" onClick={() => setExcluindo(null)}>Cancelar</button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: 'var(--s600)' }}>
          Tem certeza que deseja excluir <strong>{excluindo?.nome}</strong>? Essa ação não pode ser desfeita — o login deixará de funcionar imediatamente.
        </p>
      </Modal>
    </div>
  );
}

function FormUsuarioModal({
  open, onClose, turmas, usuario, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  turmas: string[];
  usuario?: Usuario;
  onSaved: () => void;
}) {
  const showToast = useToast();
  const isEdicao = !!usuario;

  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState<'aluno' | 'professor' | 'admin'>(usuario?.tipo ?? 'aluno');
  const [turma, setTurma] = useState(usuario?.turma ?? turmas[0] ?? '');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome); setEmail(usuario.email); setTipo(usuario.tipo); setTurma(usuario.turma ?? turmas[0] ?? ''); setSenha('');
    } else {
      setNome(''); setEmail(''); setSenha(''); setTipo('aluno'); setTurma(turmas[0] ?? '');
    }
  }, [usuario, open]);

  async function salvar() {
    if (!nome.trim()) return showToast('Informe o nome.', 'error');
    if (!isEdicao && !email.trim()) return showToast('Informe o e-mail.', 'error');
    if (!isEdicao && senha.length < 6) return showToast('Senha precisa ter ao menos 6 caracteres.', 'error');
    if (tipo === 'aluno' && !turma) return showToast('Selecione a turma do aluno.', 'error');

    setSalvando(true);
    try {
      if (isEdicao) {
        const res = await fetch(`/api/usuarios/${usuario!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, tipo, turma: tipo === 'aluno' ? turma : null, senha: senha || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast('Usuário atualizado!', 'success');
      } else {
        const res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, senha, tipo, turma: tipo === 'aluno' ? turma : null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast('Usuário criado!', 'success');
      }
      onSaved();
    } catch (e: any) {
      showToast('Erro: ' + e.message, 'error');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdicao ? 'Editar Usuário' : 'Novo Usuário'}
      footer={
        <>
          <button className="btn btn-primary" disabled={salvando} onClick={salvar}>
            {salvando ? 'Salvando...' : isEdicao ? 'Salvar alterações' : 'Criar usuário'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        </>
      }
    >
      <div className="fg">
        <label className="flabel">Nome completo</label>
        <input className="finput" placeholder="Ex: Ana Turdi" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>

      <div className="fg">
        <label className="flabel">E-mail {isEdicao && <span style={{ color: 'var(--s400)' }}>(não pode ser alterado)</span>}</label>
        <input className="finput" type="email" placeholder="aluno@educaturdi.edu.br" value={email} disabled={isEdicao} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="fg">
        <label className="flabel">{isEdicao ? 'Nova senha (deixe em branco para não alterar)' : 'Senha'}</label>
        <div style={{ position: 'relative' }}>
          <IconLock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--s400)' }} />
          <input className="finput" style={{ paddingLeft: 36 }} type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: tipo === 'aluno' ? '1fr 1fr' : '1fr', gap: 12 }}>
        <div className="fg" style={{ marginBottom: 0 }}>
          <label className="flabel">Tipo de conta</label>
          <select className="finput" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
            <option value="aluno">Aluno</option>
            <option value="professor">Professor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {tipo === 'aluno' && (
          <div className="fg" style={{ marginBottom: 0 }}>
            <label className="flabel">Turma</label>
            <select className="finput" value={turma} onChange={(e) => setTurma(e.target.value)}>
              {turmas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>
    </Modal>
  );
}
