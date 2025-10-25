# Steam Banner Generator 🎮

Generador de collages personalizados con los juegos más jugados de Steam.

## Características

- 🎮 **Descarga automática** de tus 30 juegos más jugados desde Steam
- 🎨 **Collage dinámico** con tamaños basados en tiempo jugado
- ℹ️ **Modal interactivo** con información detallada de cada juego


## Uso

1. Ve a la aplicación: [steam-banner-generator.vercel.app](https://steam-banner-generator.vercel.app)
2. Ingresa tu **Steam ID** (o nombre de usuario de Steam)
3. Haz clic en "Generar Banner"
4. Visualiza tu collage y haz clic en cualquier juego para ver detalles
5. Descarga la imagen como PNG

### ¿Dónde encontrar tu Steam ID?

- Opción 1: Ve a tu perfil de Steam → URL → `steamcommunity.com/profiles/76561198...`
- Opción 2: Usa [steamid.io](https://steamid.io) para buscar por nombre de usuario
- **⚠️ Importante**: Tu perfil debe ser **público** para que funcione

## Stack Técnico

- **Frontend**: React + Vite
- **Backend**: Node.js + Express (Vercel Serverless)
- **APIs**: Steam Web API
- **Estilos**: CSS-in-JS puro
- **Librerías**: html2canvas, Jimp, axios, lucide-react

## Desarrollo Local

### Requisitos
- Node.js 18+
- `STEAM_API_KEY` desde [Steam API](https://steamcommunity.com/dev/apikey)

### Instalación

```bash
npm install
```

### Variables de entorno

Crea un archivo `.env` en la raíz:
```env
STEAM_API_KEY=TU_STEAM_ID
```

### Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

### Build

```bash
npm run build
```

## Estructura del Proyecto

```
├── src/
│   ├── App.jsx          # Componente principal
│   ├── main.jsx
│   └── index.css
├── api/                 # Funciones serverless de Vercel
│   ├── steam.js         # Obtiene juegos de Steam
│   ├── banner.js        # Genera imagen PNG
│   └── health.js        # Health check
├── server/              # Servidor Express (local)
│   ├── index.js
│   └── package.json
├── vercel.json          # Configuración de Vercel
├── vite.config.js
└── package.json
```

## Desplegar en Vercel

1. **Conecta tu GitHub**
   ```bash
   git push origin main
   ```

2. **En Vercel Dashboard**
   - Import Project → Selecciona tu repo
   - Framework: Vite
   - Environment Variables:
     - `STEAM_API_KEY`: Tu clave de Steam API

3. **Deploy automático** ✨
   - Cada push a `main` dispara un nuevo deploy

## API Endpoints

### Obtener juegos
```
GET /api/steam?steamId=TU_STEAM_ID
```

**Response:**
```json
{
  "games": [
    {
      "name": "Resident Evil 4",
      "hours": 127,
      "image": "https://cdn.cloudflare.steamstatic.com/steam/apps/.../header.jpg",
      "appid": 15640
    }
  ]
}
```

### Generar banner
```
GET /api/banner?steamId=TU_STEAM_ID
```

Devuelve una imagen PNG del collage.

### Health Check
```
GET /api/health
```

## Notas

- Las imágenes se cachean en el navegador para mejor rendimiento
- Los datos de Steam se obtienen en tiempo real
- Soporta vanity URLs (nombres de usuario Steam)
- Máximo 30 juegos en el collage para mejor visualización
- Timeout de 10s en llamadas a Steam API

## Licencia

MIT

## Autor

[@Devmike117](https://github.com/Devmike117)

---
