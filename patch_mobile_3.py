import sys

with open('form_code_mobile.txt', 'r', encoding='utf-8') as f:
    form_code = f.read()

# Fix Mojibake
replacements = {
    'Selecci├│n': 'Selección',
    'Autom├ítica': 'Automática',
    'R├ípida': 'Rápida',
    'M├║ltiples': 'Múltiples',
    '┬┐Cu├íntos': '¿Cuántos',
    'Pagar├ís': 'Pagarás',
    'obtendr├ís': 'obtendrás',
    'n├║meros': 'números',
    'N├║meros': 'Números',
    'A├║n': 'Aún',
    'Tel├®fono': 'Teléfono'
}
for k, v in replacements.items():
    form_code = form_code.replace(k, v)

with open('src/MobileApp.jsx', 'r', encoding='utf-8') as f:
    mobile = f.read()

# Add adminTab state
if "const [adminTab, setAdminTab] = useState('dashboard');" not in mobile:
    mobile = mobile.replace("const [consultNumber, setConsultNumber] = useState('');", "const [consultNumber, setConsultNumber] = useState('');\n  const [adminTab, setAdminTab] = useState('dashboard');")

# Replace AdminView
old_admin = """  const AdminView = () => (
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
  );"""

new_admin = """  const AdminView = () => (
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
          <div className="animate-fade-in">
            <h3 style={{marginBottom:'15px'}}>Registrar Venta</h3>
            """ + form_code + """
          </div>
        )}
      </div>
      <button className="btn btn-outline" style={{marginTop:'15px'}} onClick={()=>navigate('/')}>Volver</button>
    </div>
  );"""

mobile = mobile.replace(old_admin, new_admin)

with open('src/MobileApp.jsx', 'w', encoding='utf-8') as f:
    f.write(mobile)
print("Mobile patched successfully")
