import re

with open('src/DesktopApp.jsx', 'r', encoding='utf-8') as f:
    desktop = f.read()

# 1. Add LayoutDashboard import
desktop = desktop.replace('Menu, X, CreditCard', 'Menu, X, CreditCard, LayoutDashboard')

# 2. Add adminTab state
if "const [adminTab, setAdminTab] = useState('dashboard');" not in desktop:
    desktop = desktop.replace("const [consultNumber, setConsultNumber] = useState('');", "const [consultNumber, setConsultNumber] = useState('');\n  const [adminTab, setAdminTab] = useState('dashboard');")

# 3. Modify renderNumbers
old_render_nums = """  const renderNumbers = () => {
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

new_render_nums = """  const renderNumbers = (isReadOnly = true) => {
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

desktop = desktop.replace(old_render_nums, new_render_nums)

# 5. Extract form from old_DesktopApp.jsx
with open('old_DesktopApp.jsx', 'r', encoding='utf-16') as f:
    old_desktop = f.read()

form_match = re.search(r'(<p style={{ marginBottom: \'1\.5rem\', color: \'var\(--text-light\)\', fontSize: \'1\.125rem\' }}>.*?)</form>\s*</div>', old_desktop, re.DOTALL)
if form_match:
    form_code = form_match.group(1) + '</form></div>'
    form_code = form_code.replace('{renderNumbers()}', '{renderNumbers(false)}')
else:
    print("Could not find form code in old_DesktopApp.jsx")
    exit(1)

# 6. Inject tab switcher and form into adminView
admin_view_start = """          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem' }}>Panel de Administración</h2>"""

new_admin_view_start = """          <div className="glass-card">
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
              <>"""

desktop = desktop.replace(admin_view_start, new_admin_view_start)

admin_view_end = """              </div>
            </div>
          </div>
        </main>"""

new_admin_view_end = """              </div>
            </div>
            </>
            ) : (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Registrar Venta Directa</h3>
                """ + form_code + """
              </div>
            )}
          </div>
        </main>"""

desktop = desktop.replace(admin_view_end, new_admin_view_end)

with open('src/DesktopApp.jsx', 'w', encoding='utf-8') as f:
    f.write(desktop)
print("Desktop patched")
