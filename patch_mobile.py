with open('src/MobileApp.jsx', 'r', encoding='utf-8') as f:
    mobile = f.read()

# 2. Add adminTab state
if "const [adminTab, setAdminTab] = useState('dashboard');" not in mobile:
    mobile = mobile.replace("const [consultNumber, setConsultNumber] = useState('');", "const [consultNumber, setConsultNumber] = useState('');\n  const [adminTab, setAdminTab] = useState('dashboard');")

# 5. Extract form from old_MobileApp.jsx
with open('old_MobileApp.jsx', 'r', encoding='utf-16') as f:
    old_mobile = f.read()

start_str = "<div style={{ display: 'flex', gap: '5px', marginBottom: '15px', flexWrap: 'wrap' }}>"
end_str = "</form>\n            </div>\n          )}"

start_idx = old_mobile.find(start_str)
end_idx = old_mobile.find(end_str)

if start_idx != -1 and end_idx != -1:
    # We want everything from start_str to just before the )
    # The end string contains the )}, we just want up to </div>\n
    real_end_str = "</form>\n            </div>"
    real_end_idx = old_mobile.find(real_end_str, start_idx) + len(real_end_str)
    form_code = old_mobile[start_idx:real_end_idx]
else:
    print("Could not find form code in old_MobileApp.jsx")
    exit(1)

# 6. Inject tab switcher and form into adminView
admin_view_start = """  const AdminView = () => (
    <div className="container animate-fade-in">
      <div className="glass-card">
        <h2 style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}><LayoutDashboard color="var(--primary)"/> Admin</h2>"""

new_admin_view_start = """  const AdminView = () => (
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
          <>"""

mobile = mobile.replace(admin_view_start, new_admin_view_start)

volver_part = """      </div>
      <button className="btn btn-outline" onClick={()=>navigate('/')}>Volver</button>"""

new_volver_part = """          </>
        ) : (
          <div className="animate-fade-in">
            <h3 style={{marginBottom:'15px'}}>Registrar Venta</h3>
            """ + form_code + """
          </div>
        )}
      </div>
      <button className="btn btn-outline" onClick={()=>navigate('/')}>Volver</button>"""

mobile = mobile.replace(volver_part, new_volver_part)

with open('src/MobileApp.jsx', 'w', encoding='utf-8') as f:
    f.write(mobile)
print("Mobile patched")
