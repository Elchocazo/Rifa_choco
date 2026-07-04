import { useState, useEffect, useMemo } from 'react';
import { Heart, Ticket, Search, ShieldCheck, ChevronRight, CheckCircle2, User, Phone, Save, Trash2, Download, Copy, CloudUpload, Calendar, Gift, Menu, X, CreditCard, LayoutDashboard } from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './index.css';
import chocoImg from './assets/choco.png';

// Generate numbers from 000 to 999
const ALL_NUMBERS = Array.from({ length: 1000 }, (_, i) => i.toString().padStart(3, '0'));

export default function MobileApp() {
  const navigate = useNavigate();
  const [soldTickets, setSoldTickets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  
  // Photos carousel state
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = [chocoImg, '/choco_photos/choco1.png', '/choco_photos/choco2.png', '/choco_photos/choco3.png', '/choco_photos/choco4.png', '/choco_photos/choco5.png'];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhotoIndex(prev => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Admin Search State
  const [searchNumber, setSearchNumber] = useState('');

  // Expenses State
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [toast, setToast] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [selectionMode, setSelectionMode] = useState('manual');
  const [autoTicketsCount, setAutoTicketsCount] = useState(1);
  const [manualInput, setManualInput] = useState('');
  
  // UI State
  const [activeTab, setActiveTab] = useState(0);
  const [consultNumber, setConsultNumber] = useState('');
  const [adminTab, setAdminTab] = useState('dashboard');

  // Load from Firestore
  useEffect(() => {
    const unsubscribeTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSoldTickets(ticketsData);
    });

    const unsubscribeExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
    });

    return () => {
      unsubscribeTickets();
      unsubscribeExpenses();
    };
  }, []);

  const handleMigrateData = async () => {
    try {
      const savedTickets = JSON.parse(localStorage.getItem('choco_rifa_tickets') || '[]');
      const savedExpenses = JSON.parse(localStorage.getItem('choco_rifa_expenses') || '[]');
      
      let count = 0;
      for (const ticket of savedTickets) {
        await setDoc(doc(db, 'tickets', ticket.id), ticket);
        count++;
      }
      for (const exp of savedExpenses) {
        await setDoc(doc(db, 'expenses', exp.id), exp);
        count++;
      }
      
      if (count > 0) {
        showToast(`¡Migración exitosa de ${count} registros a la nube!`);
      } else {
        showToast('No hay datos locales para migrar.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error: ' + e.message, 'error');
    }
  };

  const deleteTicket = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro? Los números volverán a estar disponibles.')) {
      await deleteDoc(doc(db, 'tickets', id));
      showToast('Registro eliminado correctamente.');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const soldNumbersList = useMemo(() => {
    return soldTickets.flatMap(ticket => ticket.numbers);
  }, [soldTickets]);

  const toggleNumber = (num) => {
    if (soldNumbersList.includes(num)) return; // Already sold
    
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else {
      setSelectedNumbers(prev => [...prev, num]);
    }
  };

  const handleAutoGenerate = () => {
    const neededNumbers = autoTicketsCount * 4;
    const availableNumbers = Array.from({length: 1000}, (_, i) => String(i).padStart(3, '0'))
      .filter(n => !soldNumbersList.includes(n));
      
    if (availableNumbers.length < neededNumbers) {
      showToast(`Lo siento, solo quedan ${availableNumbers.length} números disponibles.`, 'error');
      return;
    }

    // Shuffle and pick
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
      showToast('Por favor ingresa números válidos (ej: 045, 12, 102)', 'error');
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

    if (unavailable.length > 0) {
      showToast(`No disponibles o inválidos: ${unavailable.join(', ')}`, 'error');
    }

    if (valid.length > 0) {
      const newSelections = valid.filter(n => !selectedNumbers.includes(n));
      if (newSelections.length > 0) {
        setSelectedNumbers(prev => [...prev, ...newSelections]);
        if (unavailable.length === 0) {
          showToast(`¡Se agregaron ${newSelections.length} números a tu selección!`);
        }
      } else if (unavailable.length === 0) {
        showToast('Esos números ya están en tu selección.', 'error');
      }
    }
    setManualInput('');
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (selectedNumbers.length === 0 || selectedNumbers.length % 4 !== 0) {
      showToast('Debes seleccionar números en grupos de 4 (ej. 4, 8, 12...)', 'error');
      return;
    }
    if (!name || !lastName || !phone) {
      showToast('Por favor completa todos tus datos', 'error');
      return;
    }

    const ticketsBought = selectedNumbers.length / 4;

    const newTicket = {
      id: Date.now().toString(),
      name: `${name} ${lastName}`,
      phone,
      numbers: selectedNumbers,
      tickets: ticketsBought,
      status: 'pending', // Default status
      date: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'tickets', newTicket.id), newTicket);
      setPurchaseSuccess(newTicket);
      setSelectedNumbers([]);
      setName('');
      setLastName('');
      setPhone('');
      setSelectionMode('manual');
      setAutoTicketsCount(1);
      showToast(`¡Gracias! Se han registrado ${ticketsBought} puesto(s) correctamente.`);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      showToast('Error al registrar la compra', 'error');
    }
  };

  const togglePaymentStatus = async (id) => {
    const ticket = soldTickets.find(t => t.id === id);
    if (ticket) {
      const newStatus = ticket.status === 'paid' ? 'pending' : 'paid';
      await updateDoc(doc(db, 'tickets', id), { status: newStatus });
      showToast('Estado de pago actualizado exitosamente.');
    }
  };

  // Calculate total tickets sold based on numbers (4 numbers = 1 ticket)
  const ticketsSold = soldTickets.reduce((acc, ticket) => acc + (ticket.numbers.length / 4), 0);
  const ticketsPaid = soldTickets.filter(t => t.status === 'paid').reduce((acc, ticket) => acc + (ticket.numbers.length / 4), 0);
  const ticketsPending = ticketsSold - ticketsPaid;
  const progressPercentage = Math.min((ticketsSold / 250) * 100, 100);

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netBalance = (ticketsPaid * 10000) - totalExpenses;

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) return;
    const newExpense = {
      id: Date.now().toString(),
      description: expenseDesc,
      amount: parseFloat(expenseAmount),
      date: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'expenses', newExpense.id), newExpense);
      setExpenseDesc('');
      setExpenseAmount('');
      showToast('Gasto agregado exitosamente.');
    } catch (error) {
      console.error(error);
      showToast('Error al agregar gasto.', 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      await deleteDoc(doc(db, 'expenses', id));
      showToast('Gasto eliminado.');
    }
  };

  const handleExportAvailable = () => {
    const available = ALL_NUMBERS.filter(n => !soldNumbersList.includes(n));
    let textToShare = `🐾 ¡Rifa por Choco! 🐾\n\nNos quedan ${available.length} números disponibles:\n\n`;
    
    for(let i = 0; i < 10; i++) {
      const cent = available.filter(n => n.startsWith(i.toString()));
      if (cent.length > 0) {
        textToShare += `--- ${i}00s ---\n${cent.join(', ')}\n\n`;
      }
    }

    textToShare += `¡Anímate a participar!`;

    navigator.clipboard.writeText(textToShare).then(() => {
      showToast('Lista de números copiada al portapapeles');
    }).catch(err => {
      console.error('Error al copiar', err);
      showToast('Error al copiar al portapapeles', 'error');
    });
  };

  const renderTabs = () => {
    const tabs = [];
    for (let i = 0; i < 10; i++) {
      tabs.push(
        <button
          key={i}
          className={`tab-btn ${activeTab === i ? 'active' : ''}`}
          onClick={() => setActiveTab(i)}
        >
          {i}00 - {i}99
        </button>
      );
    }
    return (
      <div className="tabs-container">
        {tabs}
      </div>
    );
  };

  const renderNumbers = (isReadOnly = true) => {
    const start = activeTab * 100;
    const end = start + 100;
    const numbersToShow = ALL_NUMBERS.slice(start, end);

    return (
      <div className="numbers-grid">
        {numbersToShow.map(num => {
          const isSold = soldNumbersList.includes(num);
          const isSelected = selectedNumbers.includes(num);
          
          return (
            <button
              key={num}
              disabled={isSold}
              className={`number-btn ${isSold ? 'sold' : ''} ${!isReadOnly && isSelected ? 'selected' : ''}`}
              style={isReadOnly ? { cursor: 'default' } : undefined}
              onClick={() => !isReadOnly && toggleNumber(num)}
            >
              {num}
            </button>
          );
        })}
      </div>
    );
  };

  const filteredTickets = soldTickets.filter(ticket => 
    searchNumber === '' || ticket.numbers.includes(searchNumber)
  );

  const adminView = (
      <>
        <header>
          <div className="container header-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <a href="#" className="logo" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{ textDecoration: 'none', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: '800', margin: 0, padding: '10px 0' }}>
              <Heart fill="var(--primary)" color="var(--primary)" size={24} /> Rifa por Choco
            </a>
          </div>
        </header>
        
        <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem' }}>Panel de Administración</h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`btn ${adminTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '1rem' }}
              >
                <LayoutDashboard size={20} /> Dashboard
              </button>
              <button
                onClick={() => setAdminTab('ventas')}
                className={`btn ${adminTab === 'ventas' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '1rem' }}
              >
                <Ticket size={20} /> Registrar Venta Directa
              </button>
            </div>
            
            {adminTab === 'dashboard' ? (
              <>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div>
                <p className="form-label">Total Puestos</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{ticketsSold} / 250</p>
              </div>
              <div>
                <p className="form-label">Recaudado (Pagado)</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  ${(ticketsPaid * 10000).toLocaleString()} COP
                </p>
              </div>
              <div>
                <p className="form-label">Por Cobrar (Pendiente)</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  ${(ticketsPending * 10000).toLocaleString()} COP
                </p>
              </div>
              <div>
                <p className="form-label">Total Gastos</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                  ${totalExpenses.toLocaleString()} COP
                </p>
              </div>
              <div>
                <p className="form-label">Saldo Disponible</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  ${netBalance.toLocaleString()} COP
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleMigrateData}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <CloudUpload size={18} /> Subir Datos Locales a la Nube
              </button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Sección de Gastos */}
              <div style={{ flex: 1, minWidth: '300px', background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Registro de Gastos
                </h3>
                <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Descripción (ej. Veterinario)" 
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    required
                    style={{ flex: 2, minWidth: '150px' }}
                  />
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Monto ($)" 
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                    min="1"
                    style={{ flex: 1, minWidth: '100px' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                    <Save size={18} /> Agregar
                  </button>
                </form>

                {expenses.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem' }}>Descripción</th>
                        <th style={{ padding: '0.5rem' }}>Monto</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>🗑️</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(exp => (
                        <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.5rem' }}>{exp.description}</td>
                          <td style={{ padding: '0.5rem', color: 'var(--danger)', fontWeight: 'bold' }}>
                            ${exp.amount.toLocaleString()}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <button 
                              onClick={() => handleDeleteExpense(exp.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                              title="Eliminar gasto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>No hay gastos registrados.</p>
                )}
              </div>

              {/* Buscar Número Ganador */}
              <div style={{ flex: 1, minWidth: '300px', background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Search size={20} /> Buscar Número Ganador
                </h3>
                <div style={{ position: 'relative', maxWidth: '300px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '2.5rem' }} 
                    placeholder="Ej: 045"
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value)}
                    maxLength={3}
                  />
                </div>
                {searchNumber && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Mostrando resultados para el número: <strong>{searchNumber}</strong>
                  </p>
                )}
              </div>

              {/* Exportar Números */}
              <div style={{ flex: 1, minWidth: '300px', background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={20} /> Exportar Disponibles
                </h3>
                <p style={{ color: 'var(--text-light)', marginBottom: '1rem', fontSize: '0.875rem', flex: 1 }}>
                  Genera una lista con los números que aún no se han vendido para compartir en WhatsApp o redes sociales.
                </p>
                <button 
                  onClick={handleExportAvailable}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Copy size={18} /> Copiar Lista para Compartir
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem' }}>Comprador</th>
                    <th style={{ padding: '1rem' }}>Teléfono</th>
                    <th style={{ padding: '1rem' }}>Puestos</th>
                    <th style={{ padding: '1rem' }}>Estado</th>
                    <th style={{ padding: '1rem' }}>Números Elegidos</th>
                    <th style={{ padding: '1rem' }}>Fecha</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map(ticket => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border)', background: searchNumber && ticket.numbers.includes(searchNumber) ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{ticket.name}</td>
                      <td style={{ padding: '1rem' }}>{ticket.phone}</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{ticket.numbers.length / 4}</td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          onClick={() => togglePaymentStatus(ticket.id)}
                          style={{ 
                            padding: '0.5rem 1rem', 
                            borderRadius: '20px', 
                            border: 'none', 
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            background: ticket.status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: ticket.status === 'paid' ? 'var(--success)' : '#f59e0b',
                            transition: 'all 0.2s'
                          }}
                        >
                          {ticket.status === 'paid' ? '✅ Pagado' : '⏳ Pendiente'}
                        </button>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {ticket.numbers.map(n => (
                            <span key={n} style={{ 
                              background: searchNumber === n ? 'var(--success)' : 'var(--surface-hover)', 
                              color: searchNumber === n ? 'white' : 'var(--text-dark)',
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '4px', 
                              fontSize: '0.875rem', 
                              fontWeight: 'bold' 
                            }}>
                              {n}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                        {new Date(ticket.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => deleteTicket(ticket.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '50%',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          title="Eliminar registro"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                        {searchNumber ? 'No se encontró a nadie con ese número.' : 'Aún no hay puestos vendidos.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </>
            ) : (
              <div style={{ animation: 'fadeIn 0.3s', marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Registrar Venta Directa</h3>
                <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', background: 'var(--surface)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setSelectionMode('manual')}
                    style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', background: selectionMode === 'manual' ? 'var(--primary)' : 'transparent', color: selectionMode === 'manual' ? 'white' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
                  >
                    Elegir Manualmente
                  </button>
                  <button 
                    onClick={() => setSelectionMode('text')}
                    style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', background: selectionMode === 'text' ? 'var(--primary)' : 'transparent', color: selectionMode === 'text' ? 'white' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
                  >
                    Ingresar por Texto
                  </button>
                  <button 
                    onClick={() => setSelectionMode('auto')}
                    style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', background: selectionMode === 'auto' ? 'var(--primary)' : 'transparent', color: selectionMode === 'auto' ? 'white' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
                  >
                    Selección Automática
                  </button>
                </div>

                {selectionMode === 'auto' && (
                  <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Ticket size={20} className="gradient-text" /> Compra Rápida de Múltiples Puestos
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>¿Cuántos puestos deseas comprar?</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="250"
                          value={autoTicketsCount}
                          onChange={(e) => setAutoTicketsCount(parseInt(e.target.value) || 1)}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '1rem' }}
                        />
                      </div>
                      <button 
                        onClick={handleAutoGenerate}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem', height: '46px', whiteSpace: 'nowrap' }}
                      >
                        Generar {autoTicketsCount * 4} Números al Azar
                      </button>
                    </div>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                      Pagarás ${(autoTicketsCount * 10000).toLocaleString()} y obtendrás {autoTicketsCount * 4} números aleatorios de la rifa.
                    </p>
                  </div>
                )}

                {selectionMode === 'text' && (
                  <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Ticket size={20} className="gradient-text" /> Escribe tus números
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Ingresa los números separados por espacio o coma (ej: 015, 45, 102)</label>
                        <input 
                          type="text" 
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          placeholder="Ej: 005, 12, 450"
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '1rem' }}
                          onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                              e.preventDefault();
                              handleManualInputSubmit();
                            }
                          }}
                        />
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleManualInputSubmit();
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem', height: '46px', whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
                      >
                        Verificar y Agregar
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Ticket size={20} className="gradient-text" /> Tus números seleccionados
                    </h3>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 'bold', color: selectedNumbers.length > 0 && selectedNumbers.length % 4 === 0 ? 'var(--success)' : 'var(--text-light)', display: 'block' }}>
                        {selectedNumbers.length} números ({Math.floor(selectedNumbers.length / 4)} puestos)
                      </span>
                      {selectedNumbers.length % 4 !== 0 && selectedNumbers.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                          Faltan {4 - (selectedNumbers.length % 4)} para completar el puesto
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', minHeight: '60px', flexWrap: 'wrap' }}>
                    {selectedNumbers.length === 0 ? (
                      <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-light)', padding: '1rem 0' }}>
                        Aún no has seleccionado números
                      </div>
                    ) : (
                      selectedNumbers.map((num, i) => (
                        <div key={num} style={{ 
                          width: '60px',
                          height: '60px',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          background: 'var(--primary)',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '1.25rem',
                          fontWeight: 'bold'
                        }}>
                          {num}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectionMode === 'manual' && (
                  <>
                    <h3 style={{ marginBottom: '1rem' }}>1. Selecciona tus números (Haz clic)</h3>
                    {renderTabs()}
                    {renderNumbers(false)}
                  </>
                )}

                <div style={{ marginTop: '3rem' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>2. Completa tus datos</h3>
                  <form onSubmit={handlePurchase}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <div style={{ position: 'relative' }}>
                          <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ paddingLeft: '2.5rem' }} 
                            placeholder="Tu nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Apellido</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Tu apellido"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Teléfono / WhatsApp</label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                        <input 
                          type="tel" 
                          className="form-input" 
                          style={{ paddingLeft: '2.5rem' }} 
                          placeholder="Tu número de contacto"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '1rem', fontSize: '1.125rem', marginTop: '1rem' }}
                      disabled={selectedNumbers.length === 0 || selectedNumbers.length % 4 !== 0}
                    >
                      <Save size={20} />
                      Registrar {Math.floor(selectedNumbers.length / 4)} Puesto(s) (${(Math.floor(selectedNumbers.length / 4) * 10000).toLocaleString()})
                    </button>
                    {(selectedNumbers.length === 0 || selectedNumbers.length % 4 !== 0) && (
                      <p style={{ textAlign: 'center', color: 'var(--danger)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                        * Selecciona números en grupos de 4 para registrar tus puestos.
                      </p>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </>
  );

  const homeView = (
    <>
      {toast && (
        <div className="toaster">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 color="var(--success)" /> : <ShieldCheck color="var(--danger)" />}
            <span style={{ fontWeight: 500 }}>{toast.message}</span>
          </div>
        </div>
      )}

      <header>
        <div className="container header-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{ textDecoration: 'none', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: '800', margin: 0, padding: '10px 0' }}>
            <Heart fill="var(--primary)" color="var(--primary)" size={24} /> Rifa por Choco
          </a>
        </div>
      </header>
      {purchaseSuccess ? (
        <div className="container animate-fade-in" style={{paddingTop:'4rem', paddingBottom:'4rem'}}>
          <div className="glass-card" style={{textAlign:'center', maxWidth:'500px', margin:'0 auto'}}>
            <CheckCircle2 color="var(--success)" size={64} style={{margin:'0 auto 20px'}}/>
            <h2 style={{marginBottom:'10px'}}>¡Números Apartados!</h2>
            <p style={{color:'var(--text-light)', marginBottom:'25px'}}>Para confirmar tu compra, envía el comprobante por WhatsApp.</p>
            <button className="btn btn-primary" style={{width:'100%', marginBottom:'15px', padding:'1rem', fontSize:'1.1rem'}} onClick={() => {
              const msg = `¡Hola! Acabo de reservar números para la Rifa de Choco 🐾\n\n*Nombre:* ${purchaseSuccess.name}\n*Números:* ${purchaseSuccess.numbers.join(', ')}\n*Total:* $${(purchaseSuccess.tickets * 10000).toLocaleString()}\n\n¿Me podrías confirmar los datos de pago?`;
              window.open(`https://wa.me/573015085806?text=${encodeURIComponent(msg)}`, '_blank');
              setPurchaseSuccess(null);
            }}>
              <Phone size={18}/> Enviar Comprobante por WhatsApp
            </button>
            <button className="btn btn-outline" style={{width:'100%'}} onClick={()=>setPurchaseSuccess(null)}>Cerrar</button>
          </div>
        </div>
      ) : (
      <main>
        <section className="hero container animate-fade-in">
          <div className="hero-image-container">
            <img src={photos[photoIndex]} alt="Choco el perrito" className="hero-image" style={{ transition: 'all 0.5s ease-in-out' }} />
          </div>
          
          <div className="hero-content">
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              Ayudemos a <span className="gradient-text">Choco</span> a Mejorar
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
              Mi perrito Choco está enfermito y necesita de nuestra ayuda para solventar sus gastos veterinarios. ¡Participa en la rifa y gana mientras lo ayudas!
            </p>

            <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto 3rem', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Meta de la Rifa</h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                La rifa juega el <strong>25 de Julio</strong>
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                <span>{ticketsSold} vendidos</span>
                <span>250 en total</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '1rem' }}>
                Valor del puesto: <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>$10.000</strong> (Incluye 4 números)
              </p>
            </div>

            <div style={{ maxWidth: '500px', margin: '0 auto 2rem', background: 'var(--surface)', borderRadius: '50px', padding: '5px 15px', display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
              <Search size={18} color="var(--primary)" style={{ marginRight: '10px' }} />
              <input 
                type="text" 
                placeholder="Consultar número (ej: 045)"
                value={consultNumber}
                onChange={(e) => setConsultNumber(e.target.value)}
                maxLength={3}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', width: '100%', outline: 'none', fontSize: '1rem' }}
              />
              {consultNumber.length === 3 && (
                <span style={{ marginLeft: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: soldNumbersList.includes(consultNumber) ? 'var(--danger)' : ALL_NUMBERS.includes(consultNumber) ? 'var(--success)' : 'var(--text-light)' }}>
                  {soldNumbersList.includes(consultNumber) ? 'Ocupado' : ALL_NUMBERS.includes(consultNumber) ? 'Libre' : 'Inválido'}
                </span>
              )}
            </div>

            <a href="#comprar" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
              Comprar mi Puesto <ChevronRight />
            </a>
          </div>
        </section>


        <section id="comprar" className="container" style={{ paddingBottom: '4rem' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
              Números Disponibles
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '2rem', fontSize: '1.125rem' }}>
              Consulta aquí las tablas para ver qué números están libres. Los marcados en rojo ya fueron apartados.
            </p>
            
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  window.open('https://wa.me/573015085806?text=¡Hola! Me gustaría comprar puestos para la rifa de Choco 🐾', '_blank');
                }}
                className="btn btn-primary"
                style={{ padding: '1rem 2rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', borderColor: '#25D366' }}
              >
                <Phone size={20} /> Comprar por WhatsApp
              </button>
            </div>

            <div>
              {renderTabs()}
              {renderNumbers()}
            </div>
          </div>
        </section>
      </main>
      )}
      </>
  );

  return (
    <Routes>
      <Route path="/" element={homeView} />
      <Route path="/admin" element={adminView} />
    </Routes>
  );
}
