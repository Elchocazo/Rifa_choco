# 🐾 Rifa por Choco - App Móvil (PWA & APK)

Esta es una aplicación móvil optimizada para la gestión de la rifa pro-fondos veterinarios de Choco. Diseñada para ser eficiente, rápida e instalable en cualquier dispositivo.

## 📱 Características de la App
- **Multiplataforma:** Funciona como PWA (navegador) y como App Nativa (APK).
- **Confirmación por WhatsApp:** Genera automáticamente un mensaje de cobro para el cliente con su número: `573015085806`.
- **Diseño Mobile-First:** Interfaz limpia y optimizada para uso táctil.
- **Sincronización en Tiempo Real:** Base de datos en la nube con Firebase.
- **Panel Administrativo:** Control de pagos y visualización de números vendidos.

## 🚀 Cómo instalar desde el Navegador (PWA)
1. Abre el enlace del proyecto en tu navegador móvil.
2. **Android:** Ve al menú de Chrome y elige "Instalar aplicación".
3. **iOS:** Dale al botón "Compartir" y selecciona "Añadir a la pantalla de inicio".

## 📦 Pasos para instalar como App Nativa (APK)
Si deseas generar el archivo instalable para cualquier celular Android:

1. **Construye el proyecto web:**
   ```bash
   npm run build
   ```
2. **Sincroniza con Capacitor:**
   ```bash
   npx cap sync
   ```
3. **Abre el proyecto en Android Studio:**
   ```bash
   npx cap open android
   ```
4. **Genera el APK:**
   - En Android Studio, ve a `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
   - Una vez finalizado, puedes enviar ese archivo `.apk` a cualquier celular para instalarlo.

## 🛠 Comandos para el desarrollador
```bash
# Iniciar en modo desarrollo
npm run dev

# Subir cambios a GitHub (Manual)
git add .
git commit -m "Descripción del cambio"
git push
```

## 🎨 Tecnologías
- **Frontend:** React + Vite
- **Base de Datos:** Firebase Firestore
- **Mobile Wrapper:** Capacitor JS
- **Iconos:** Lucide React
- **PWA:** Service Workers & Web Manifest
