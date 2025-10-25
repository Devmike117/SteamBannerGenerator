# Steam Banner Generator

Generador de collages personalizados con los juegos más jugados de Steam.

## Características

- 🎮 Descarga automática de tus juegos más jugados desde Steam
- 🎨 Collage dinámico con tamaños basados en tiempo jugado
- 📸 Descarga la imagen como PNG
- ℹ️ Vista modal con información de cada juego

## Desplegar en Vercel

1. **Conecta tu repositorio a Vercel**
   ```
   Vercel → Import Project → GitHub
   ```

2. **Configura las variables de entorno**
   - En Vercel dashboard → Settings → Environment Variables
   - Añade: `STEAM_API_KEY` = tu clave de API de Steam

3. **Obtén tu STEAM_API_KEY**
   - Ve a: https://steamcommunity.com/dev/apikey
   - Copia tu clave

4. **Deploy automático**
   - Vercel desplegará automáticamente cuando hagas push a main

## Uso Local

```bash
# Instalar dependencias
npm install

# Variables de entorno (.env)
STEAM_API_KEY=your_api_key_here

# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## API Endpoints (Vercel Serverless)

- `GET /api/steam?steamId=...` - Obtiene los 5 juegos más jugados
- `GET /api/health` - Health check
- `GET /api/banner?steamId=...` - Genera imagen PNG del banner

## Estructura

```
├── src/
│   └── App.jsx         # Componente principal React
├── api/
│   ├── steam.js        # Función serverless para obtener juegos
│   ├── banner.js       # Función serverless para generar banner
│   └── health.js       # Health check
├── vercel.json         # Configuración de Vercel
└── package.json
```

## Requisitos

- Node.js 18+
- Clave API de Steam (gratuita)
- Cuenta en Vercel

## Notas

- Las imágenes de Steam se cargan desde CDN de Cloudflare
- Los datos se obtienen de Steam API en tiempo real
- Los perfiles privados no mostrarán datos
