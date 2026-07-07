import sys

with open('src/DesktopApp.jsx', 'r', encoding='utf-8') as f:
    desktop = f.read()

desktop = desktop.replace(
    "import { Heart, Ticket, Search, ShieldCheck, ChevronRight, CheckCircle2, User, Phone, Save, Trash2, Download, Copy, CloudUpload, Calendar, Gift, Menu, X, CreditCard } from 'lucide-react';",
    "import { Heart, Ticket, Search, ShieldCheck, ChevronRight, CheckCircle2, User, Phone, Save, Trash2, Download, Copy, CloudUpload, Calendar, Gift, Menu, X, CreditCard, LayoutDashboard } from 'lucide-react';"
)

desktop = desktop.replace(
    "const [consultNumber, setConsultNumber] = useState('');",
    "const [consultNumber, setConsultNumber] = useState('');\n  const [adminTab, setAdminTab] = useState('dashboard');"
)

old_render = """  const renderNumbers = () => {
    const start = activeTab * 100;
    const end = start + 100;
    const numbersToShow = ALL_NUMBERS.slice(start, end);

    return (
      <div className="numbers-grid">
        {numbersToShow.map(num => {
          const isSold = soldNumbersList.includes(num);
          
          return (
            <button
              key={num}
              disabled={isSold}
              className={`number-btn ${isSold ? 'sold' : ''}`}
              style={{ cursor: 'default' }}
            >
              {num}
            </button>
          );
        })}
      </div>
    );
  };"""

new_render = """  const renderNumbers = (isReadOnly = true) => {
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
  };"""
desktop = desktop.replace(old_render, new_render)

old_admin_start = """          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem' }}>Panel de Administración</h2>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>"""

new_admin_start = """          <div className="glass-card">
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
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>"""
desktop = desktop.replace(old_admin_start, new_admin_start)

# Add the form code back
with open('form_code.txt', 'r', encoding='utf-8') as f:
    form_code = f.read()

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

form_code = form_code.replace('{renderNumbers()}', '{renderNumbers(false)}')

old_admin_end = """                <button 
                  onClick={handleExportAvailable}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Download size={18} /> Exportar Lista
                </button>
              </div>
            </div>"""

new_admin_end = """                <button 
                  onClick={handleExportAvailable}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Download size={18} /> Exportar Lista
                </button>
              </div>
            </div>
              </>
            ) : (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Registrar Venta Directa</h3>
                """ + form_code + """
              </div>
            )}"""
desktop = desktop.replace(old_admin_end, new_admin_end)

with open('src/DesktopApp.jsx', 'w', encoding='utf-8') as f:
    f.write(desktop)
print("Desktop manually patched")
