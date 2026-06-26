import { useState, useEffect, useMemo } from 'react';
import { Heart, Search, CheckCircle2, Phone, Trash2, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import chocoImg from './assets/choco.png';

const ALL_NUMBERS = Array.from({ length: 1000 }, (_, i) => i.toString().padStart(3, '0'));

export default function App() {
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
      showToast('¡Registro exitoso!');
      window.scrollTo(0,0);
    } catch (e) { showToast('Error al registrar', 'error'); }
  };

  const AdminView = () => (
    <div className="container animate-fade-in">
      <div className="glass-card">
        <h2 style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}><LayoutDashboard color="var(--primary)"/> Admin</h2>
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
      </div>
      <button className="btn btn-outline" onClick={()=>navigate('/')}>Volver</button>
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

          <div className="glass-card">
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
          </div>

          {selectedNumbers.length > 0 && (
            <div className="glass-card" style={{position:'sticky', bottom:'20px', zIndex:100, boxShadow:'0 -5px 20px rgba(0,0,0,0.1)'}}>
              <form onSubmit={handlePurchase}>
                <input type="text" className="form-input" placeholder="Nombre completo" value={name} onChange={e=>setName(e.target.value)} required style={{marginBottom:'10px'}}/>
                <input type="tel" className="form-input" placeholder="WhatsApp" value={phone} onChange={e=>setPhone(e.target.value)} required style={{marginBottom:'15px'}}/>
                <button type="submit" className="btn btn-primary" disabled={selectedNumbers.length%4!==0}>
                  Reservar {selectedNumbers.length/4} Puesto(s)
                </button>
              </form>
            </div>
          )}
        </>
      )}
      <div style={{textAlign:'center', padding:'20px'}}><small onClick={()=>navigate('/admin')} style={{color:'#ccc'}}>Admin</small></div>
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
