import React, { useState } from 'react';
import { Gamepad2, Download, AlertCircle, Loader2 } from 'lucide-react';

// v2.0 - Estilo mosaico completo como Steam
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
      
      const link = document.createElement('a');
      link.download = `steam-banner-${steamId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error con html2canvas:', err);
      setError('Error al descargar el banner. Intenta de nuevo.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  return (
    <div style={{ height: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem', flexShrink: 0 }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <Gamepad2 style={{ width: '2rem', height: '2rem', color: '#60a5fa', minWidth: '2rem' }} />
              <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 'bold', color: 'white', margin: 0 }}>Steam Banner Generator</h1>
            </div>
            <p style={{ color: '#bfdbfe', fontSize: 'clamp(0.875rem, 2vw, 1rem)', margin: 0 }}>Crea un mosaico con tus juegos más jugados de Steam</p>
          </div>

          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(12px)', borderRadius: '0.5rem', padding: 'clamp(1rem, 4vw, 1.5rem)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
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
        </div>
      </div>

      {/* Contenido principal */}
      {games.length > 0 ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '0 1rem 1rem', gap: '1rem' }}>
          <div 
            id="steam-banner"
            style={{ 
              flex: 1,
              minHeight: 0,
              background: '#0a0a0a',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '2px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            {/* Mosaico de juegos - ocupa todo el espacio */}
            <div style={{ 
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '8px',
              padding: '1.5rem',
              overflow: 'auto',
              backgroundColor: '#1b2838',
              alignContent: 'start'
            }}>
              {profile && (
                <div style={{
                  gridColumn: 'span 1',
                  backgroundColor: '#16213e',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  border: '2px solid rgba(59, 130, 246, 0.5)',
                  aspectRatio: '16/9'
                }}>
                  <img 
                    src={profile.avatar} 
                    alt={profile.username}
                    style={{ 
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '0.5rem', 
                      border: '2px solid rgba(59, 130, 246, 0.5)'
                    }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#93c5fd', fontSize: '0.65rem', margin: '0 0 0.25rem 0' }}>Usuario de Steam</p>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>
                      {profile.username}
                    </h3>
                  </div>
                </div>
              )}
              {games.map((game, index) => {
                // Calcular span basado en horas jugadas
                let span = 1;
                if (game.hours >= 100) span = 2;
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedGame(game)}
                    style={{ 
                      gridColumn: `span ${span}`,
                      position: 'relative',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#000',
                      aspectRatio: '16/9',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.zIndex = '10';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.zIndex = '1';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <img
                      src={game.image}
                      alt={game.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end'
                    }}>
                      <p style={{ 
                        color: '#66c0f4',
                        fontSize: span >= 2 ? '0.9rem' : '0.75rem',
                        fontWeight: '600',
                        margin: 0,
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                      }}>
                        {game.hours} hrs
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={downloadBanner}
            style={{ 
              width: '100%',
              maxWidth: '90rem',
              margin: '0 auto',
              padding: '0.75rem', 
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
              fontSize: '0.875rem',
              flexShrink: 0
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
      ) : null}

      {/* Modal de información del juego */}
      {selectedGame && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}