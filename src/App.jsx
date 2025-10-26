import React, { useState } from 'react';
import { Gamepad2, Download, AlertCircle, Loader2 } from 'lucide-react';

// v1.2 - Fixed code structure and logic
export default function SteamBanner() {
  const [steamId, setSteamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [profile, setProfile] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setGames([]);
    setProfile(null);

    if (!steamId.trim()) {
      setError('Por favor ingresa tu Steam ID');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/steam?steamId=${encodeURIComponent(steamId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener datos');
      }

      if (data.games.length === 0) {
        setError('No se encontraron juegos. Verifica que tu perfil sea público.');
        setLoading(false);
        return;
      }

      setProfile(data.profile);
      setGames(data.games);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const downloadBanner = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const banner = document.getElementById('steam-banner');
      
      const canvas = await html2canvas(banner, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 10000
      });
      
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let hasContent = false;
      
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 200) {
          hasContent = true;
          break;
        }
      }
      
      if (!hasContent) {
        throw new Error('Canvas is empty');
      }
      
      const link = document.createElement('a');
      link.download = `steam-banner-${steamId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error con html2canvas, usando servidor:', err);
      try {
        const resp = await fetch(`/api/banner?steamId=${encodeURIComponent(steamId)}`);
        if (!resp.ok) {
          throw new Error(`Error ${resp.status}`);
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `steam-banner-${steamId}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (serverErr) {
        console.error('Error al descargar del servidor:', serverErr);
        setError('Error al descargar el banner. Intenta de nuevo.');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  // Calcular layout proporcional basado en horas jugadas
  const getGameLayout = () => {
    if (games.length === 0) return [];

    const sortedGames = [...games].sort((a, b) => b.hours - a.hours);
    
    return sortedGames.map((game, index) => {
      let gridSpan = 1;
      
      if (index === 0 && game.hours >= 100) gridSpan = 2;
      else if (game.hours >= 50) gridSpan = 2;
      else if (game.hours >= 30) gridSpan = 1;
      
      return { 
        ...game, 
        gridSpan,
        index 
      };
    });
  };

  const layoutGames = getGameLayout();
  const gridColumns = 4;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)', padding: '1rem' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Gamepad2 style={{ width: '2rem', height: '2rem', color: '#60a5fa', minWidth: '2rem' }} />
            <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 'bold', color: 'white', margin: 0 }}>Steam Banner Generator</h1>
          </div>
          <p style={{ color: '#bfdbfe', fontSize: 'clamp(0.875rem, 2vw, 1rem)', margin: 0 }}>Crea un mosaico con tus juegos más jugados de Steam</p>
        </div>

        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(12px)', borderRadius: '0.5rem', padding: 'clamp(1rem, 4vw, 1.5rem)', marginBottom: '2rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa tu Steam ID (ej: 76561198012345678)"
              style={{ flex: 1, minWidth: '200px', padding: '0.75rem 1rem', backgroundColor: '#334155', color: 'white', borderRadius: '0.5rem', border: '1px solid #475569', outline: 'none', fontSize: '0.875rem' }}
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: loading ? '#475569' : '#2563eb', color: 'white', fontWeight: '600', borderRadius: '0.5rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
            >
              {loading && <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite', minWidth: '1rem' }} />}
              {loading ? 'Generando...' : 'Generar'}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>{error}</span>
            </div>
          )}
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#93c5fd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              <span>Encuentra tu Steam ID en tu perfil o usa <a href="https://steamid.io/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#bfdbfe' }}>steamid.io</a></span>
            </div>
            <p style={{ marginTop: '0.25rem', color: '#fbbf24', margin: '0.5rem 0 0 0' }}>Tu perfil de Steam debe ser público</p>
          </div>
        </div>

        {games.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div 
              id="steam-banner"
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '1rem', padding: 'clamp(1rem, 4vw, 2rem)', border: '3px solid rgba(59, 130, 246, 0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            >
              {profile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.75rem, 3vw, 1.5rem)', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '2px solid rgba(59, 130, 246, 0.3)', flexWrap: 'wrap' }}>
                  <img 
                    src={profile.avatar} 
                    alt={profile.username}
                    style={{ width: 'clamp(60px, 15vw, 80px)', height: 'clamp(60px, 15vw, 80px)', borderRadius: '0.5rem', border: '2px solid rgba(59, 130, 246, 0.5)', minWidth: '60px' }}
                  />
                  <div>
                    <p style={{ color: '#93c5fd', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Usuario de Steam</p>
                    <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>
                      {profile.username}
                    </h3>
                  </div>
                </div>
              )}

              <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 'bold', color: 'white', marginBottom: '2rem', textAlign: 'center', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                Mis Juegos Más Jugados
              </h2>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.max(2, Math.min(gridColumns, typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : gridColumns))}, 1fr)`,
                gap: 'clamp(0.5rem, 2vw, 0.75rem)',
                gridAutoRows: 'clamp(80px, 20vw, 120px)',
                gridAutoFlow: 'dense'
              }}>
                {layoutGames.map((game) => (
                  <div
                    key={game.index}
                    onClick={() => setSelectedGame(game)}
                    style={{ 
                      gridColumn: `span ${game.gridSpan}`,
                      gridRow: `span ${game.gridSpan}`,
                      position: 'relative',
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                      border: '2px solid rgba(255,255,255,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.zIndex = '10';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.zIndex = '1';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
                    }}
                  >
                    <img
                      src={game.image}
                      alt={game.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        filter: 'brightness(0.85)'
                      }}
                    />
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'flex-end', 
                      padding: '0.75rem' 
                    }}>
                      <p style={{ 
                        color: 'white', 
                        fontWeight: '600',
                        fontSize: game.gridSpan >= 2 ? '0.875rem' : '0.75rem',
                        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                        margin: '0 0 0.25rem 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {game.name}
                      </p>
                      <p style={{ 
                        color: '#60a5fa', 
                        fontWeight: '700',
                        fontSize: game.gridSpan >= 2 ? '1rem' : '0.875rem',
                        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                        margin: '0'
                      }}>
                        {game.hours.toLocaleString()} hrs
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={downloadBanner}
              style={{ 
                width: '100%', 
                padding: 'clamp(0.75rem, 3vw, 1rem)', 
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: 'white', 
                fontWeight: 'bold', 
                borderRadius: '0.5rem', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem', 
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <Download style={{ width: '1.25rem', height: '1.25rem', minWidth: '1.25rem' }} />
              Descargar imagen
            </button>
          </div>
        )}

        {selectedGame && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(4px)',
              padding: '1rem'
            }}
            onClick={() => setSelectedGame(null)}
          >
            <div
              style={{
                backgroundColor: '#1a1a2e',
                borderRadius: '1rem',
                padding: 'clamp(1.25rem, 4vw, 2rem)',
                maxWidth: '600px',
                width: '100%',
                border: '2px solid rgba(59, 130, 246, 0.4)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedGame(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>

              <img
                src={selectedGame.image}
                alt={selectedGame.name}
                style={{
                  width: '100%',
                  height: 'clamp(150px, 40vw, 250px)',
                  objectFit: 'cover',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}
              />

              <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 'bold', color: 'white', marginBottom: '1rem', marginTop: 0 }}>
                {selectedGame.name}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 480 ? '1fr' : '1fr 1fr', gap: 'clamp(0.5rem, 2vw, 1rem)', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#16213e', padding: 'clamp(0.75rem, 2vw, 1rem)', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#93c5fd', fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)', margin: '0 0 0.5rem 0' }}>Horas jugadas</p>
                  <p style={{ color: '#60a5fa', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 'bold', margin: 0 }}>
                    {selectedGame.hours.toLocaleString()} hrs
                  </p>
                </div>
                <div style={{ backgroundColor: '#16213e', padding: 'clamp(0.75rem, 2vw, 1rem)', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#93c5fd', fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)', margin: '0 0 0.5rem 0' }}>Tiempo promedio</p>
                  <p style={{ color: '#60a5fa', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 'bold', margin: 0 }}>
                    {Math.round(selectedGame.hours / 30)} mins/día
                  </p>
                </div>
              </div>

              {selectedGame.description && (
                <div style={{ backgroundColor: '#16213e', padding: 'clamp(0.75rem, 2vw, 1rem)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                  <p style={{ color: '#93c5fd', fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)', margin: '0 0 0.5rem 0' }}>Descripción</p>
                  <p style={{ color: '#cbd5e1', fontSize: 'clamp(0.875rem, 2vw, 0.95rem)', margin: 0, lineHeight: '1.5' }}>
                    {selectedGame.description}
                  </p>
                </div>
              )}

              <button
                onClick={() => setSelectedGame(null)}
                style={{
                  width: '100%',
                  padding: 'clamp(0.75rem, 2vw, 1rem)',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}