import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase, isSupabaseConfigured } from './supabase';
import './styles.css';

const money = (n) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(Number(n || 0)).replace('PYG', 'Gs.');

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('inicio');
  const [data, setData] = useState({ prizes: [], sellers: [], sales: [], tickets: [], claims: [], logs: [] });
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState('');
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [prizeForm, setPrizeForm] = useState({ name: '', amount_gs: '', probability_percent: '', active: true });
  const [sellerForm, setSellerForm] = useState({ full_name: '', phone: '', active: true });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) { setProfile(null); return; }
    let active = true;
    (async () => {
      const { data: p, error: e } = await supabase.from('profiles').select('id, full_name, role').eq('id', session.user.id).maybeSingle();
      if (!active) return;
      if (e) setError(`No se pudo leer el perfil: ${e.message}. Revisá la tabla profiles y sus políticas RLS.`);
      setProfile(p || null);
    })();
    return () => { active = false; };
  }, [session]);

  useEffect(() => { if (session && profile?.role) loadDashboard(); }, [session, profile?.role]);

  async function signIn(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }
  async function signOut() { await supabase.auth.signOut(); setProfile(null); setData({ prizes: [], sellers: [], sales: [], tickets: [], claims: [], logs: [] }); }

  async function loadDashboard() {
    if (!supabase) return;
    setLoadingData(true); setError('');
    const requests = [
      ['prizes', () => supabase.from('prizes').select('id,name,amount_gs,probability_percent,active,created_at').order('amount_gs')],
      ['sellers', () => supabase.from('sellers').select('id,full_name,phone,active,created_at').order('created_at', { ascending: false }).limit(100)],
      ['sales', () => supabase.from('sales').select('id,seller_id,quantity,ticket_price,commission_per_ticket,status,created_at').order('created_at', { ascending: false }).limit(100)],
      ['tickets', () => supabase.from('tickets').select('id,code,status,created_at,seller_id,sale_id').order('created_at', { ascending: false }).limit(100)],
      ['claims', () => supabase.from('prize_claims').select('id,ticket_id,seller_id,status,created_at').order('created_at', { ascending: false }).limit(100)],
      ['logs', () => supabase.from('audit_log').select('id,action,details,created_at').order('created_at', { ascending: false }).limit(50)]
    ];
    const next = { prizes: [], sellers: [], sales: [], tickets: [], claims: [], logs: [] };
    const issues = [];
    for (const [key, request] of requests) {
      const { data: rows, error: e } = await request();
      if (e) issues.push(`${key}: ${e.message}`); else next[key] = rows || [];
    }
    setData(next);
    if (issues.length) setError('Algunas consultas necesitan ajustarse a los nombres reales de tus tablas: ' + issues.join(' | '));
    setLoadingData(false);
  }

  async function togglePrize(prize) {
    setError(''); setNotice('');
    const { error } = await supabase.from('prizes').update({ active: !prize.active }).eq('id', prize.id);
    if (error) setError(`No se pudo actualizar el premio: ${error.message}`); else { setNotice('Estado del premio actualizado.'); await loadDashboard(); }
  }

  async function savePrize(e) {
    e.preventDefault(); setError(''); setNotice('');
    const amount = Number(prizeForm.amount_gs); const probability = Number(prizeForm.probability_percent);
    if (!prizeForm.name.trim() || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(probability) || probability < 0 || probability > 100) { setError('Revisá el nombre, el importe y la probabilidad (de 0 a 100).'); return; }
    const { error } = await supabase.from('prizes').insert({ name: prizeForm.name.trim(), amount_gs: Math.round(amount), probability_percent: probability, active: prizeForm.active });
    if (error) setError(`No se pudo guardar el premio: ${error.message}`); else { setPrizeForm({ name: '', amount_gs: '', probability_percent: '', active: true }); setShowPrizeForm(false); setNotice('Premio guardado.'); await loadDashboard(); }
  }

  async function toggleSeller(seller) {
    setError(''); setNotice('');
    const { error } = await supabase.from('sellers').update({ active: !seller.active }).eq('id', seller.id);
    if (error) setError(`No se pudo actualizar el vendedor: ${error.message}`);
    else { setNotice('Estado del vendedor actualizado.'); await loadDashboard(); }
  }

  function exportCurrentCSV() {
    const configs = {
      premios: { name: 'premios-timapuro.csv', rows: data.prizes.map(p => ({ nombre:p.name, importe_gs:p.amount_gs, probabilidad:p.probability_percent, activo:p.active, creado:p.created_at })) },
      vendedores: { name: 'vendedores-timapuro.csv', rows: data.sellers.map(s => ({ nombre:s.full_name, telefono:s.phone, activo:s.active, creado:s.created_at })) },
      ventas: { name: 'ventas-timapuro.csv', rows: data.sales.map(s => ({ id:s.id, vendedor_id:s.seller_id, cantidad:s.quantity, precio_ticket:s.ticket_price, comision_por_ticket:s.commission_per_ticket, estado:s.status, creado:s.created_at })) },
      tickets: { name: 'tickets-timapuro.csv', rows: data.tickets.map(t => ({ codigo:t.code, vendedor_id:t.seller_id, estado:t.status, creado:t.created_at })) },
      reclamos: { name: 'reclamos-timapuro.csv', rows: data.claims.map(c => ({ id:c.id, ticket_id:c.ticket_id, vendedor_id:c.seller_id, estado:c.status, creado:c.created_at })) },
      actividad: { name: 'actividad-timapuro.csv', rows: data.logs.map(l => ({ fecha:l.created_at, accion:l.action, detalle:typeof l.details==='string'?l.details:JSON.stringify(l.details ?? {}) })) }
    };
    const cfg = configs[tab];
    if (!cfg || !cfg.rows.length) { setNotice('No hay registros para exportar en esta sección.'); return; }
    const keys = Object.keys(cfg.rows[0]);
    const quote = v => `"${String(v ?? '').replaceAll('\"','\"\"')}"`;
    const csv = '\ufeff' + [keys.map(quote).join(';'), ...cfg.rows.map(row => keys.map(k=>quote(row[k])).join(';'))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = cfg.name; a.click(); URL.revokeObjectURL(url);
  }

  async function saveSeller(e) {
    e.preventDefault(); setError(''); setNotice('');
    if (!sellerForm.full_name.trim()) { setError('Ingresá el nombre del vendedor.'); return; }
    const { error } = await supabase.from('sellers').insert({ full_name: sellerForm.full_name.trim(), phone: sellerForm.phone.trim() || null, active: sellerForm.active });
    if (error) setError(`No se pudo guardar el vendedor: ${error.message}`); else { setSellerForm({ full_name: '', phone: '', active: true }); setShowSellerForm(false); setNotice('Vendedor guardado.'); await loadDashboard(); }
  }

  if (!isSupabaseConfigured) return <Setup />;
  if (!session) return <main className="login-shell"><section className="login-card"><div className="brand-mark">T</div><p className="eyebrow">SISTEMA DE GESTIÓN</p><h1>Raspaditas <span>Timapuro</span></h1><p className="muted">Ingresá con tu cuenta autorizada para continuar.</p>{error && <div className="alert error">{error}</div>}<form onSubmit={signIn}><label>Correo electrónico<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button className="primary full" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar al sistema'}</button></form><p className="tiny">Acceso privado · Los permisos se verifican en la base de datos.</p></section></main>;

  const role = profile?.role;
  // El filtro se aplica solo en la vista activa; el estado del backend no se modifica al buscar.
  if (!profile) return <main className="center-state"><div className="spinner"/><h2>Verificando permisos…</h2>{error && <div className="alert error">{error}</div>}<p className="muted">Si esto no avanza, falta crear o asignar tu perfil en la tabla <code>profiles</code>.</p><button className="secondary" onClick={signOut}>Cerrar sesión</button></main>;
  if (!['superadmin','admin'].includes(role)) return <main className="center-state"><div className="brand-mark">T</div><h2>Acceso sin permisos de panel</h2><p className="muted">Tu cuenta está autenticada, pero el rol asignado no puede entrar a este panel.</p><button className="secondary" onClick={signOut}>Cerrar sesión</button></main>;

  const isSuper = role === 'superadmin';
  const nav = [{id:'inicio',label:'Resumen',icon:'▦'},{id:'premios',label:'Premios',icon:'🏆'},{id:'vendedores',label:'Vendedores',icon:'♙'},{id:'ventas',label:'Ventas',icon:'↗'},{id:'tickets',label:'Tickets',icon:'▤'},{id:'reclamos',label:'Reclamos',icon:'🎁'},{id:'actividad',label:'Actividad',icon:'◷'}].filter(x => isSuper || x.id !== 'actividad');
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark small">T</div><div><strong>Timapuro</strong><small>Raspaditas</small></div></div><div className="role-badge">{isSuper ? '👑 SUPERADMINISTRADOR' : '🏪 ADMINISTRADOR'}</div><nav>{nav.map(n=><button key={n.id} className={tab===n.id?'nav-item active':'nav-item'} onClick={()=>setTab(n.id)}><span>{n.icon}</span>{n.label}</button>)}</nav><div className="sidebar-bottom"><div className="user-dot">{(profile.full_name || session.user.email || 'U').slice(0,1).toUpperCase()}</div><div className="user-info"><strong>{profile.full_name || 'Usuario'}</strong><small>{session.user.email}</small></div><button className="logout" title="Cerrar sesión" onClick={signOut}>↪</button></div></aside>
  <main className="main-area"><header className="topbar"><div><p className="eyebrow">PANEL DE CONTROL</p><h1>{nav.find(n=>n.id===tab)?.label || 'Resumen'}</h1></div><div className="top-actions"><span className="status"><i/> Conectado</span><a className="secondary open-scratch" href="/raspadita-demo.html" target="_blank" rel="noreferrer">🎟️ Ver raspadita</a><button className="secondary" onClick={loadDashboard}>↻ Actualizar</button></div></header>
  {error && <div className="alert error">{error}</div>}{notice && <div className="alert success">{notice}</div>}
  {loadingData && <div className="loading-line">Actualizando datos desde Supabase…</div>}
  {tab !== 'inicio' && <div className="toolbar"><input aria-label="Buscar en esta sección" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar en esta sección…"/><button className="secondary" onClick={exportCurrentCSV}>⇩ Exportar CSV</button></div>}
  {tab==='inicio' && <><section className="welcome"><div><p className="eyebrow">BIENVENIDO/A</p><h2>{profile.full_name || 'Equipo Timapuro'} 👋</h2><p>Acá tenés el estado general de las operaciones.</p></div><div className="welcome-emoji">🎟️</div></section><section className="stat-grid"><Stat title="Premios activos" value={data.prizes.filter(p=>p.active).length} icon="🏆" detail="Premios habilitados"/><Stat title="Vendedores" value={data.sellers.length} icon="♙" detail="Registros encontrados"/><Stat title="Ventas registradas" value={data.sales.length} icon="↗" detail="Últimos 100 registros"/><Stat title="Tickets consultados" value={data.tickets.length} icon="🎟️" detail="Últimos 100 registros"/></section><section className="content-grid"><div className="panel"><div className="panel-head"><div><h3>Premios configurados</h3><p>Importes y probabilidades registrados</p></div><button className="text-button" onClick={()=>setTab('premios')}>Ver todos →</button></div><DataTable columns={['Premio','Importe','Probabilidad','Estado']} rows={data.prizes.slice(0,6).map(p=>[p.name,money(p.amount_gs),`${Number(p.probability_percent ?? 0).toLocaleString('es-PY',{minimumFractionDigits:0,maximumFractionDigits:5})}%`,p.active?'Activo':'Inactivo'])} empty="No hay premios disponibles para mostrar."/></div><div className="panel"><div className="panel-head"><div><h3>Últimas ventas</h3><p>Actividad reciente</p></div><button className="text-button" onClick={()=>setTab('ventas')}>Ver todas →</button></div><DataTable columns={['Fecha','Cantidad','Estado']} rows={data.sales.slice(0,6).map(s=>[new Date(s.created_at).toLocaleDateString('es-PY'),s.quantity ?? '—',s.status ?? '—'])} empty="Todavía no hay ventas para mostrar."/></div></section></>}
  {tab==='premios' && <section className="panel"><div className="panel-head"><div><h3>Gestión de premios</h3><p>Importes y probabilidades guardados en Supabase.</p></div>{isSuper && <button className="primary" onClick={()=>setShowPrizeForm(v=>!v)}>{showPrizeForm?'Cancelar':'+ Nuevo premio'}</button>}</div>{isSuper && showPrizeForm && <form className="entry-form" onSubmit={savePrize}><label>Nombre del premio<input value={prizeForm.name} onChange={e=>setPrizeForm({...prizeForm,name:e.target.value})} placeholder="Ej. Lata Kaiser" required /></label><label>Importe en guaraníes<input type="number" min="0" step="1" value={prizeForm.amount_gs} onChange={e=>setPrizeForm({...prizeForm,amount_gs:e.target.value})} required /></label><label>Probabilidad (%)<input type="number" min="0" max="100" step="0.00001" value={prizeForm.probability_percent} onChange={e=>setPrizeForm({...prizeForm,probability_percent:e.target.value})} required /></label><label className="check-label"><input type="checkbox" checked={prizeForm.active} onChange={e=>setPrizeForm({...prizeForm,active:e.target.checked})}/> Activo</label><button className="primary" type="submit">Guardar premio</button></form>}<DataTable columns={['Premio','Importe','Probabilidad','Estado',...(isSuper?['Acción']:[])]} rows={data.prizes.filter(p=>JSON.stringify(p).toLowerCase().includes(search.toLowerCase())).map(p=>[p.name,money(p.amount_gs),`${Number(p.probability_percent ?? 0).toLocaleString('es-PY',{minimumFractionDigits:0,maximumFractionDigits:5})}%`,p.active?'Activo':'Inactivo',...(isSuper?[<button className="small-button" onClick={()=>togglePrize(p)}>{p.active?'Desactivar':'Activar'}</button>]:[])])} empty="No se encontraron premios. Revisá la tabla prizes."/></section>}
  {tab==='vendedores' && <section className="panel"><div className="panel-head"><div><h3>Vendedores</h3><p>Consulta y alta de vendedores registrados.</p></div><div className="panel-actions"><span className="pill">{data.sellers.length} registros</span>{isSuper && <button className="primary" onClick={()=>setShowSellerForm(v=>!v)}>{showSellerForm?'Cancelar':'+ Nuevo vendedor'}</button>}</div></div>{isSuper && showSellerForm && <form className="entry-form" onSubmit={saveSeller}><label>Nombre completo<input value={sellerForm.full_name} onChange={e=>setSellerForm({...sellerForm,full_name:e.target.value})} required placeholder="Nombre del vendedor" /></label><label>Teléfono<input type="tel" value={sellerForm.phone} onChange={e=>setSellerForm({...sellerForm,phone:e.target.value})} placeholder="09xx xxx xxx" /></label><label className="check-label"><input type="checkbox" checked={sellerForm.active} onChange={e=>setSellerForm({...sellerForm,active:e.target.checked})}/> Activo</label><button className="primary" type="submit">Guardar vendedor</button></form>}<DataTable columns={['Nombre','Teléfono','Estado','Alta',...(isSuper?['Acción']:[])]} rows={data.sellers.filter(s=>JSON.stringify(s).toLowerCase().includes(search.toLowerCase())).map(s=>[s.full_name || '—',s.phone || '—',s.active?'Activo':'Inactivo',s.created_at?new Date(s.created_at).toLocaleDateString('es-PY'):'—',...(isSuper?[<button className="small-button" onClick={()=>toggleSeller(s)}>{s.active?'Desactivar':'Activar'}</button>]:[])])} empty="No se encontraron vendedores en la tabla sellers."/></section>}
  {tab==='ventas' && <section className="panel"><div className="panel-head"><div><h3>Ventas</h3><p>Últimos registros disponibles.</p></div></div><DataTable columns={['Fecha','Vendedor ID','Cantidad','Precio por ticket','Comisión/ticket','Estado']} rows={data.sales.filter(s=>JSON.stringify(s).toLowerCase().includes(search.toLowerCase())).map(s=>[s.created_at?new Date(s.created_at).toLocaleString('es-PY'):'—',String(s.seller_id ?? '—').slice(0,8),s.quantity ?? '—',money(s.ticket_price),money(s.commission_per_ticket),s.status ?? '—'])} empty="No hay ventas registradas."/></section>}
  {tab==='tickets' && <section className="panel"><div className="panel-head"><div><h3>Tickets</h3><p>Tickets consultados desde la base de datos.</p></div></div><DataTable columns={['Código','Estado','Vendedor ID','Creado']} rows={data.tickets.filter(t=>JSON.stringify(t).toLowerCase().includes(search.toLowerCase())).map(t=>[t.code ?? String(t.id).slice(0,8),t.status ?? '—',String(t.seller_id ?? '—').slice(0,8),t.created_at?new Date(t.created_at).toLocaleString('es-PY'):'—'])} empty="No hay tickets para mostrar."/></section>}
  {tab==='reclamos' && <section className="panel"><div className="panel-head"><div><h3>Reclamos de premios</h3><p>Solicitudes registradas en la tabla prize_claims.</p></div><span className="pill">{data.claims.length} registros</span></div><DataTable columns={['Fecha','Ticket','Vendedor ID','Estado']} rows={data.claims.filter(c=>JSON.stringify(c).toLowerCase().includes(search.toLowerCase())).map(c=>[c.created_at?new Date(c.created_at).toLocaleString('es-PY'):'—',c.ticket_id ?? '—',String(c.seller_id ?? '—').slice(0,8),c.status ?? '—'])} empty="No hay reclamos registrados."/></section>}
  {tab==='actividad' && <section className="panel"><div className="panel-head"><div><h3>Registro de actividad</h3><p>Eventos guardados en la tabla de auditoría.</p></div></div><DataTable columns={['Fecha','Acción','Detalle']} rows={data.logs.filter(l=>JSON.stringify(l).toLowerCase().includes(search.toLowerCase())).map(l=>[l.created_at?new Date(l.created_at).toLocaleString('es-PY'):'—',l.action ?? '—',typeof l.details==='string'?l.details:JSON.stringify(l.details ?? {})])} empty="No hay actividad registrada."/></section>}
  <footer>Timapuro · Panel interno <span>Datos cargados desde Supabase cuando la configuración está completa.</span></footer></main></div>;
}

function Stat({title,value,icon,detail}) { return <article className="stat-card"><div className="stat-top"><span>{title}</span><b>{icon}</b></div><strong className="stat-value">{value}</strong><small>{detail}</small></article>; }
function DataTable({columns,rows,empty}) { return <div className="table-wrap">{rows.length ? <table><thead><tr>{columns.map((c,i)=><th key={i}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{React.isValidElement(v)?v:(v ?? '—')}</td>)}</tr>)}</tbody></table>:<div className="empty"><span>▤</span><p>{empty}</p></div>}</div>; }
function Setup() { return <main className="center-state"><div className="brand-mark">T</div><p className="eyebrow">PREPARACIÓN INICIAL</p><h1>Timapuro está listo para configurar</h1><p className="muted max">El proyecto está preparado, pero faltan las dos variables públicas de conexión. No pongas contraseñas ni la clave <code>service_role</code> en el frontend.</p><div className="setup-steps"><b>1.</b><span>En Supabase, abrí <strong>Project Settings → API</strong>.</span><b>2.</b><span>Copiá la URL del proyecto y la clave publicable/anon.</span><b>3.</b><span>En Vercel, cargalas como <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.</span></div><div className="alert info">Este paquete es una base inicial. Antes de operar hay que confirmar los nombres de las tablas, configurar RLS y asignar los roles en la tabla <code>profiles</code>.</div><a className="secondary link-button" href="/raspadita-demo.html" target="_blank" rel="noreferrer">Abrir raspadita existente ↗</a></main>; }

createRoot(document.getElementById('root')).render(<App />);
