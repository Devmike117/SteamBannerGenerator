import React, { useState } from 'react';
import { Gamepad2, Download, AlertCircle, Loader2 } from 'lucide-react';

export default function SteamBanner() {
  const [steamId, setSteamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [profile, setProfile] = useState(null);
  const [timePeriod, setTimePeriod] = useState('all'); // 'all', 'year', 'month'

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
      
      {/* Verificar si el canvas está vacío */}
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
      {/* Fallback: descargar desde el servidor */}
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
        alert('Error al descargar el banner. Intenta de nuevo.');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  {/* Calcular grid masónico basado en horas jugadas */}
  const getGameLayout = () => {
    const filteredGames = getFilteredGames();
    if (filteredGames.length === 0) return [];

    const maxHours = Math.max(...filteredGames.map(g => g.hours));
    
    return filteredGames.map((game, index) => {
      const percentage = (game.hours / maxHours) * 100;
      let gridSpan; 
      if (percentage > 80) {
        gridSpan = 2; 
      } else if (percentage > 60) {
        gridSpan = 2; 
      } else if (percentage > 40) {
        gridSpan = 1; 
      } else if (percentage > 20) {
        gridSpan = 1; 
      } else {
        gridSpan = 1; 
      }
      
      return { ...game, gridSpan, index };
    });
  };

  {/* Calcular número dinámico de columnas para evitar espacios vacíos */}
  const calculateColumns = (gamesToCalculate) => {
    const totalSpans = gamesToCalculate.reduce((sum, g) => sum + g.gridSpan, 0);
    const avgRowItems = Math.ceil(Math.sqrt(totalSpans / 1.5));
    return Math.max(3, Math.min(5, avgRowItems));
  };

  {/* Filtrar juegos por período de tiempo */}
  const getFilteredGames = () => {
    if (timePeriod === 'all') {
      return games;
    } else if (timePeriod === 'year') {
      // Juegos jugados recientemente (últimas 2 semanas o con horas significativas)
      return games
        .filter(game => game.hours_2weeks > 0)
        .sort((a, b) => b.hours_2weeks - a.hours_2weeks)
        .slice(0, Math.ceil(games.length * 0.6));
    } else if (timePeriod === 'month') {
      // Juegos jugados muy recientemente (últimas 2 semanas con más horas)
      return games
        .filter(game => game.hours_2weeks > 0)
        .sort((a, b) => b.hours_2weeks - a.hours_2weeks)
        .slice(0, Math.ceil(games.length * 0.3));
    }
    return games;
  };

  const layoutGames = getGameLayout();
  const gridColumns = calculateColumns(layoutGames);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)', padding: '2rem' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Gamepad2 style={{ width: '3rem', height: '3rem', color: '#60a5fa' }} />
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'white' }}>Steam Banner Generator</h1>
          </div>
          <p style={{ color: '#bfdbfe' }}>Crea un mosaico con tus juegos más jugados de Steam</p>
        </div>

        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(12px)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa tu Steam ID (ej: 76561198012345678)"
              style={{ flex: 1, minWidth: '250px', padding: '0.75rem 1rem', backgroundColor: '#334155', color: 'white', borderRadius: '0.5rem', border: '1px solid #475569', outline: 'none' }}
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{ padding: '0.75rem 2rem', backgroundColor: loading ? '#475569' : '#2563eb', color: 'white', fontWeight: '600', borderRadius: '0.5rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
            >
              {loading && <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Generando...' : 'Generar Banner'}
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

          {games.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <p style={{ color: '#93c5fd', fontSize: '0.875rem', marginBottom: '1rem' }}>Filtrar por período:</p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setTimePeriod('all')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: timePeriod === 'all' ? '#2563eb' : '#334155',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '0.5rem',
                    border: '1px solid ' + (timePeriod === 'all' ? '#1d4ed8' : '#475569'),
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    if (timePeriod !== 'all') e.target.style.backgroundColor = '#475569';
                  }}
                  onMouseLeave={(e) => {
                    if (timePeriod !== 'all') e.target.style.backgroundColor = '#334155';
                  }}
                >
                  Todo el tiempo
                </button>
                <button
                  onClick={() => setTimePeriod('year')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: timePeriod === 'year' ? '#2563eb' : '#334155',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '0.5rem',
                    border: '1px solid ' + (timePeriod === 'year' ? '#1d4ed8' : '#475569'),
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    if (timePeriod !== 'year') e.target.style.backgroundColor = '#475569';
                  }}
                  onMouseLeave={(e) => {
                    if (timePeriod !== 'year') e.target.style.backgroundColor = '#334155';
                  }}
                >
                  Este año
                </button>
                <button
                  onClick={() => setTimePeriod('month')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: timePeriod === 'month' ? '#2563eb' : '#334155',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '0.5rem',
                    border: '1px solid ' + (timePeriod === 'month' ? '#1d4ed8' : '#475569'),
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    if (timePeriod !== 'month') e.target.style.backgroundColor = '#475569';
                  }}
                  onMouseLeave={(e) => {
                    if (timePeriod !== 'month') e.target.style.backgroundColor = '#334155';
                  }}
                >
                  Este mes
                </button>
              </div>
            </div>
          )}
        </div>

        {games.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div 
              id="steam-banner"
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '1rem', padding: '2rem', border: '3px solid rgba(59, 130, 246, 0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            >
              {profile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid rgba(59, 130, 246, 0.3)' }}>
                  <img 
                    src={profile.avatar} 
                    alt={profile.username}
                    style={{ width: '80px', height: '80px', borderRadius: '0.5rem', border: '2px solid rgba(59, 130, 246, 0.5)' }}
                  />
                  <div>
                    <p style={{ color: '#93c5fd', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Usuario de Steam</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>
                      {profile.username}
                    </h3>
                  </div>
                </div>
              )}

              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '2rem', textAlign: 'center', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                Mis Juegos Más Jugados
              </h2>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                gap: '0.75rem',
                gridAutoRows: '120px',
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
                padding: '1rem', 
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
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(22, 163, 74, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.4)';
              }}
            >
              <Download style={{ width: '1.25rem', height: '1.25rem' }} />
              Descargar Banner como PNG
            </button>
          </div>
        )}

        {/* Modal de información del juego */}
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
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setSelectedGame(null)}
          >
            <div
              style={{
                backgroundColor: '#1a1a2e',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '600px',
                width: '90%',
                border: '2px solid rgba(59, 130, 246, 0.4)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative'
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
                  height: '250px',
                  objectFit: 'cover',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem'
                }}
              />

              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem', marginTop: 0 }}>
                {selectedGame.name}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#16213e', padding: '1rem', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#93c5fd', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Horas jugadas</p>
                  <p style={{ color: '#60a5fa', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                    {selectedGame.hours.toLocaleString()} hrs
                  </p>
                </div>
                <div style={{ backgroundColor: '#16213e', padding: '1rem', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#93c5fd', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Tiempo promedio</p>
                  <p style={{ color: '#60a5fa', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                    {Math.round(selectedGame.hours / 30)} mins/día
                  </p>
                </div>
              </div>

              <div style={{ backgroundColor: '#16213e', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                <p style={{ color: '#93c5fd', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Descripción</p>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>
                  {selectedGame.description}
                </p>
              </div>

              <button
                onClick={() => setSelectedGame(null)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
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