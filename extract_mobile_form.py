with open('old_MobileApp.jsx', 'r', encoding='utf-16') as f:
    text = f.read()

start_str = "<div style={{ display: 'flex', gap: '5px', marginBottom: '15px', flexWrap: 'wrap' }}>"
end_str = "</form>\n            </div>\n          )}"
start_idx = text.find(start_str)
end_idx = text.find(end_str)

if start_idx != -1 and end_idx != -1:
    real_end_str = "</form>\n            </div>"
    real_end_idx = text.find(real_end_str, start_idx) + len(real_end_str)
    form_code = text[start_idx:real_end_idx]
    with open('form_code_mobile.txt', 'w', encoding='utf-8') as f:
        f.write(form_code)
    print('Form code extracted successfully to form_code_mobile.txt')
else:
    print('Form code not found in old_MobileApp.jsx')
