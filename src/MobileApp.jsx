import { useState, useEffect, useMemo } from 'react';
import { Heart, Search, CheckCircle2, Phone, Trash2, ShoppingBag, LayoutDashboard, Ticket } from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import chocoImg from './assets/choco.png';

const ALL_NUMBERS = Array.from({ length: 1000 }, (_, i) => i.toString().padStart(3, '0'));

export default function MobileApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [soldTickets, setSoldTickets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [searchNumber, setSearchNumber] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [selectionMode, setSelectionMode] = useState('manual');
  const [autoTicketsCount, setAutoTicketsCount] = useState(1);
  const [manualInput, setManualInput] = useState('');
  const [consultNumber, setConsultNumber] = useState('');
  const [adminTab, setAdminTab] = useState('dashboard');

  useEffect(() => {
    const unsubT = onSnapshot(collection(db, 'tickets'), (s) => setSoldTickets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubE = onSnapshot(collection(db, 'expenses'), (s) => setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubT(); unsubE(); };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const soldNumbersList = useMemo(() => soldTickets.flatMap(t => t.numbers), [soldTickets]);

  const toggleNumber = (num) => {
    if (soldNumbersList.includes(num)) return;
    setSelectedNumbers(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  const handleAutoGenerate = () => {
    const neededNumbers = autoTicketsCount * 4;
    const availableNumbers = Array.from({length: 1000}, (_, i) => String(i).padStart(3, '0'))
      .filter(n => !soldNumbersList.includes(n));
      
    if (availableNumbers.length < neededNumbers) {
      showToast(`Solo quedan ${availableNumbers.length} números disponibles.`, 'error');
      return;
    }
    const shuffled = availableNumbers.sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, neededNumbers);
    setSelectedNumbers(picked);
    showToast(`¡Se han seleccionado ${neededNumbers} números al azar!`);
  };

  const handleManualInputSubmit = () => {
    const nums = manualInput.match(/\d{1,3}/g) || [];
    const formattedNums = nums.map(n => n.padStart(3, '0'));
    const uniqueNums = [...new Set(formattedNums)];
    
    if (uniqueNums.length === 0) {
      showToast('Ingresa números válidos', 'error');
      return;
    }
    const unavailable = [];
    const valid = [];
    uniqueNums.forEach(num => {
      if (soldNumbersList.includes(num) || !ALL_NUMBERS.includes(num)) {
        unavailable.push(num);
      } else {
        valid.push(num);
      }
    });
    if (unavailable.length > 0) showToast(`No disponibles: ${unavailable.join(', ')}`, 'error');
    if (valid.length > 0) {
      const newSelections = valid.filter(n => !selectedNumbers.includes(n));
      if (newSelections.length > 0) {
        setSelectedNumbers(prev => [...prev, ...newSelections]);
        if (unavailable.length === 0) showToast(`¡Se agregaron ${newSelections.length} números!`);
      }
    }
    setManualInput('');
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (selectedNumbers.length === 0 || selectedNumbers.length % 4 !== 0) {
      showToast('Selecciona grupos de 4 números', 'error');
      return;
    }
    const newTicket = {
      id: Date.now().toString(),
      name,
      phone,
      numbers: selectedNumbers,
      tickets: selectedNumbers.length / 4,
      status: 'pending',
      date: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'tickets', newTicket.id), newTicket);
      setPurchaseSuccess(newTicket);
      setSelectedNumbers([]); setName(''); setPhone('');
      setSelectionMode('manual'); setAutoTicketsCount(1);
      showToast('¡Registro exitoso!');
      window.scrollTo(0,0);
    } catch (e) { showToast('Error al registrar', 'error'); }
  };

  const AdminView = () => (
    <div className="container animate-fade-in">
      <div className="glass-card">
        <h2 style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}><LayoutDashboard color="var(--primary)"/> Admin</h2>
        
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
          <button 
            onClick={() => setAdminTab('dashboard')} 
            className={`btn ${adminTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`} 
            style={{flex: 1, padding: '10px'}}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setAdminTab('ventas')} 
            className={`btn ${adminTab === 'ventas' ? 'btn-primary' : 'btn-outline'}`} 
            style={{flex: 1, padding: '10px'}}
          >
            Ventas
          </button>
        </div>

        {adminTab === 'dashboard' ? (
          <>
            <div className="form-group">
              <input type="text" className="form-input" placeholder="Buscar número..." value={searchNumber} onChange={e=>setSearchNumber(e.target.value)} maxLength={3}/>
            </div>
            {soldTickets.filter(t => searchNumber === '' || t.numbers.includes(searchNumber)).map(t => (
              <div key={t.id} className="glass-card" style={{padding:'15px', marginBottom:'10px', borderLeft: t.status==='paid'?'5px solid var(--success)':'5px solid var(--primary)'}}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <strong>{t.name}</strong>
                  <small>{t.status === 'paid' ? '✅' : '⏳'}</small>
                </div>
                <div style={{display:'flex', gap:'5px', margin:'10px 0', flexWrap:'wrap'}}>
                  {t.numbers.map(n => <span key={n} className="number-btn" style={{width:'35px', height:'35px', fontSize:'0.7rem'}}>{n}</span>)}
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <button className="btn-outline" style={{padding:'5px 10px', borderRadius:'8px', fontSize:'0.8rem'}} onClick={() => updateDoc(doc(db,'tickets',t.id), {status: t.status==='paid'?'pending':'paid'})}>Cambiar Pago</button>
                  <Trash2 size={16} color="var(--danger)" onClick={()=>deleteDoc(doc(db,'tickets',t.id))}/>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
          <div className="animate-fade-in">
            <h3 style={{marginBottom:'15px'}}>Registrar Venta</h3>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <button onClick={() => setSelectionMode('manual')} className={`btn ${selectionMode === 'manual' ? 'btn-primary' : 'btn-outline'}`} style={{flex:1, padding:'10px', fontSize:'0.8rem'}}>Manual</button>
              <button onClick={() => setSelectionMode('text')} className={`btn ${selectionMode === 'text' ? 'btn-primary' : 'btn-outline'}`} style={{flex:1, padding:'10px', fontSize:'0.8rem'}}>Texto</button>
              <button onClick={() => setSelectionMode('auto')} className={`btn ${selectionMode === 'auto' ? 'btn-primary' : 'btn-outline'}`} style={{flex:1, padding:'10px', fontSize:'0.8rem'}}>Azar</button>
            </div>

            {selectionMode === 'auto' && (
              <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--surface)', borderRadius: '8px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>¿Cuántos puestos? (1 puesto = 4 nums)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" min="1" value={autoTicketsCount} onChange={(e) => setAutoTicketsCount(parseInt(e.target.value) || 1)} className="form-input" style={{flex:1}}/>
                  <button onClick={handleAutoGenerate} className="btn btn-primary" style={{whiteSpace:'nowrap', padding: '10px 15px'}}>Generar</button>
                </div>
              </div>
            )}

            {selectionMode === 'text' && (
              <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--surface)', borderRadius: '8px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>Ingresa números (ej: 015, 45, 102)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={manualInput} onChange={(e) => setManualInput(e.target.value)} className="form-input" placeholder="Ej: 005, 12, 450" style={{flex:1}} onKeyDown={(e) => { if(e.key === 'Enter') handleManualInputSubmit(); }}/>
                  <button onClick={handleManualInputSubmit} className="btn btn-primary" style={{padding: '10px 15px'}}>Agregar</button>
                </div>
              </div>
            )}

            {selectionMode === 'manual' && (
              <>
                <div className="tabs-container">
                  {Array.from({length:10}, (_,i) => <button key={i} className={`tab-btn ${activeTab===i?'active':''}`} onClick={()=>setActiveTab(i)}>{i}00s</button>)}
                </div>
                <div className="numbers-grid">
                  {ALL_NUMBERS.slice(activeTab*100, (activeTab*100)+100).map(num => (
                    <button key={num} disabled={soldNumbersList.includes(num)}
                      className={`number-btn ${soldNumbersList.includes(num)?'sold':''} ${selectedNumbers.includes(num)?'selected':''}`}
                      onClick={()=>toggleNumber(num)}>{num}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {selectedNumbers.length > 0 && (
            <div className="glass-card" style={{position:'sticky', bottom:'20px', zIndex:100, boxShadow:'0 -5px 20px rgba(0,0,0,0.1)'}}>
              <div style={{marginBottom:'15px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px'}}>
                  <h4 style={{margin:0, display:'flex', alignItems:'center', gap:'5px'}}><Ticket size={16}/> Tus números ({selectedNumbers.length})</h4>
                  <small style={{fontWeight:'bold', color: selectedNumbers.length % 4 === 0 ? 'var(--success)' : 'var(--danger)'}}>
                    {Math.floor(selectedNumbers.length / 4)} Puestos
                  </small>
                </div>
                <div style={{display:'flex', gap:'5px', flexWrap:'wrap', maxHeight:'70px', overflowY:'auto', padding:'5px'}}>
                  {selectedNumbers.map(n => (
                    <span key={n} style={{width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', background:'var(--primary)', color:'white', borderRadius:'6px', fontWeight:'bold'}}>{n}</span>
                  ))}
                </div>
                  {selectedNumbers.length % 4 !== 0 && (
                   <small style={{display:'block', marginTop:'5px', color:'var(--danger)', fontSize:'0.75rem'}}>Faltan {4 - (selectedNumbers.length % 4)} para completar un puesto.</small>
                )}
              </div>
              <form onSubmit={handlePurchase}>
                <input type="text" className="form-input" placeholder="Nombre completo" value={name} onChange={e=>setName(e.target.value)} required style={{marginBottom:'10px'}}/>
                <input type="tel" className="form-input" placeholder="WhatsApp" value={phone} onChange={e=>setPhone(e.target.value)} required style={{marginBottom:'15px'}}/>
                <button type="submit" className="btn btn-primary" disabled={selectedNumbers.length%4!==0} style={{width:'100%', padding:'12px'}}>
                  Reservar {selectedNumbers.length/4} Puesto(s)
                </button>
              </form>
            </div>
          )}
          </>
        )}
      </div>
      <button className="btn btn-outline" style={{marginTop:'15px'}} onClick={()=>navigate('/')}>Volver</button>
    </div>
  );

  const HomeView = () => (
    <div className="container animate-fade-in">
      {purchaseSuccess ? (
        <div className="glass-card animate-fade-in" style={{textAlign:'center', padding:'40px 20px'}}>
          <CheckCircle2 color="var(--success)" size={64} style={{margin:'0 auto 20px'}}/>
          <h2 style={{marginBottom:'10px'}}>¡Números Apartados!</h2>
          <p style={{color:'var(--text-light)', marginBottom:'25px'}}>Para confirmar tu compra, envía el comprobante por WhatsApp.</p>
          <button className="btn btn-primary" onClick={() => {
            const msg = `¡Hola! Acabo de reservar números para la Rifa de Choco 🐾\n\n*Nombre:* ${purchaseSuccess.name}\n*Números:* ${purchaseSuccess.numbers.join(', ')}\n*Total:* $${(purchaseSuccess.tickets * 10000).toLocaleString()}\n\n¿Me podrías confirmar los datos de pago?`;
            window.open(`https://wa.me/573000000000?text=${encodeURIComponent(msg)}`, '_blank');
            setPurchaseSuccess(null);
          }}>
            <Phone size={18}/> Enviar Comprobante
          </button>
          <button className="btn btn-outline" style={{marginTop:'15px'}} onClick={()=>setPurchaseSuccess(null)}>Cerrar</button>
        </div>
      ) : (
        <>
          <section className="hero">
            <div className="hero-image-container"><img src={chocoImg} alt="Choco" className="hero-image" /></div>
            <h1 className="gradient-text">Ayudemos a Choco</h1>
            <div className="glass-card" style={{marginTop:'20px'}}>
              <small>Progreso: {soldNumbersList.length/4} / 250 puestos</small>
              <div className="progress-container"><div className="progress-bar" style={{width: `${(soldNumbersList.length/1000)*100}%`}}></div></div>
            </div>
          </section>

          <div style={{ margin: '0 auto 15px', background: 'var(--surface)', borderRadius: '50px', padding: '5px 15px', display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
            <Search size={16} color="var(--primary)" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Consultar (ej: 045)"
              value={consultNumber}
              onChange={(e) => setConsultNumber(e.target.value)}
              maxLength={3}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', width: '100%', outline: 'none', fontSize: '0.9rem' }}
            />
            {consultNumber.length === 3 && (
              <span style={{ marginLeft: '10px', fontSize: '0.8rem', fontWeight: 'bold', color: soldNumbersList.includes(consultNumber) ? 'var(--danger)' : ALL_NUMBERS.includes(consultNumber) ? 'var(--success)' : 'var(--text-light)' }}>
                {soldNumbersList.includes(consultNumber) ? 'Ocupado' : ALL_NUMBERS.includes(consultNumber) ? 'Libre' : 'Inválido'}
              </span>
            )}
          </div>

          <div className="glass-card" style={{marginBottom: '15px'}}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
              Números Disponibles
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Consulta aquí las tablas para ver qué números están libres. Los marcados en rojo ya fueron apartados.
            </p>
            
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  window.open('https://wa.me/573015085806?text=¡Hola! Me gustaría comprar puestos para la rifa de Choco 🐾', '_blank');
                }}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', borderColor: '#25D366', width: '100%', justifyContent: 'center' }}
              >
                <Phone size={18} /> Comprar por WhatsApp
              </button>
            </div>

            <div className="tabs-container">
              {Array.from({length:10}, (_,i) => <button key={i} className={`tab-btn ${activeTab===i?'active':''}`} onClick={()=>setActiveTab(i)}>{i}00s</button>)}
            </div>
            <div className="numbers-grid">
              {ALL_NUMBERS.slice(activeTab*100, (activeTab*100)+100).map(num => (
                <button key={num} disabled={soldNumbersList.includes(num)}
                  className={`number-btn ${soldNumbersList.includes(num)?'sold':''}`}
                  style={{ cursor: 'default' }}>{num}</button>
              ))}
            </div>
          </div>
        </>
      )}
      <div style={{textAlign:'center', padding:'20px'}}><small onClick={()=>navigate('/admin')} style={{color:'#ccc', cursor: 'pointer'}}>Admin</small></div>
    </div>
  );

  return (
    <>
      <header><div className="header-content container"><strong>🐾 Rifa Choco</strong></div></header>
      {toast && <div className="toaster"><div className={`toast ${toast.type}`}>{toast.message}</div></div>}
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </>
  );
}
