import axios from 'axios';

export default async (req, res) => {
  // Enable CORS v1.0
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { steamId } = req.query;
  const STEAM_API_KEY = process.env.STEAM_API_KEY;

  if (!STEAM_API_KEY) {
    console.error('Missing STEAM_API_KEY in environment');
    return res.status(500).json({ error: 'Server configuration error: missing STEAM_API_KEY' });
  }

  if (!steamId) {
    return res.status(400).json({ error: 'steamId parameter is required' });
  }

  try {
    // Normalize steamId input
    let resolvedSteamId = steamId.trim();

    // If the provided id is not numeric, try to resolve a vanity URL to a SteamID64
    if (!/^\d+$/.test(resolvedSteamId)) {
      try {
        const vanityResp = await axios.get('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/', {
          params: { key: STEAM_API_KEY, vanityurl: resolvedSteamId },
          timeout: 8000
        });

        const vResp = vanityResp.data?.response;
        if (vResp && vResp.success === 1 && vResp.steamid) {
          resolvedSteamId = vResp.steamid;
        } else {
          return res.status(404).json({ error: 'No se encontró el usuario de Steam con ese nombre (vanity URL)' });
        }
      } catch (vanityErr) {
        console.error('Error resolving vanity URL:', vanityErr.response ? vanityErr.response.data : vanityErr.message);
        return res.status(502).json({ error: 'Error al resolver el vanity URL de Steam' });
      }
    }

    // Fetch user profile info
    const profileResp = await axios.get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', {
      params: {
        key: STEAM_API_KEY,
        steamids: resolvedSteamId
      },
      timeout: 8000
    });

    const playerData = profileResp.data?.response?.players?.[0];
    if (!playerData) {
      return res.status(404).json({ error: 'No se encontró el perfil del usuario' });
    }

    // Fetch top 30 games
    const response = await axios.get('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', {
      params: {
        key: STEAM_API_KEY,
        steamid: resolvedSteamId,
        format: 'json',
        include_appinfo: 1,
        include_played_free_games: 1
      },
      timeout: 10000
    });

    const gamesList = response.data?.response?.games;
    if (!gamesList || gamesList.length === 0) {
      return res.status(404).json({ error: 'No se encontraron juegos o el perfil es privado' });
    }

    // Sort by playtime and take top 
    const games = gamesList
      .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
      .slice(0, 100)
      .map(game => ({
        name: game.name,
        hours: Math.round((game.playtime_forever || 0) / 60),
        image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
        appid: game.appid
      }));

    // Fetch descriptions for each game
    const gamesWithDescriptions = await Promise.all(
      games.map(async (game) => {
        try {
          const appDetailsResp = await axios.get('https://store.steampowered.com/api/appdetails', {
            params: {
              appids: game.appid
            },
            timeout: 5000
          });

          const appData = appDetailsResp.data?.[game.appid]?.data;
          const description = appData?.short_description || 'Sin descripción disponible';

          return {
            ...game,
            description
          };
        } catch (err) {
          console.error(`Error fetching description for app ${game.appid}:`, err.message);
          return {
            ...game,
            description: 'Sin descripción disponible'
          };
        }
      })
    );

    res.json({
      profile: {
        username: playerData.personaname,
        avatar: playerData.avatarfull
      },
      games: gamesWithDescriptions
    });
  } catch (error) {
    console.error('Error fetching Steam data:', error.response ? error.response.data : error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || 'Error al obtener datos de Steam';
    res.status(status).json({ error: message });
  }
};
