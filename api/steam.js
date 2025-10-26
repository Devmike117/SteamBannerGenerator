import axios from 'axios';

export default async (req, res) => {
  // Enable CORS v1.0
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // Image proxying
  if (req.query.proxyImage) {
    try {
      const imageUrl = decodeURIComponent(req.query.proxyImage);
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

      res.setHeader('Content-Type', imageResponse.headers['content-type'] || 'image/jpeg');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(Buffer.from(imageResponse.data, 'binary'));
    } catch (err) {
      console.error('Error al obtener imagen:', err.message);
      return res.status(500).send('Error al cargar imagen');
    }
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

    // Resolve vanity URL if needed
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
        console.error('Error resolving vanity URL:', vanityErr.message);
        return res.status(502).json({ error: 'Error al resolver el vanity URL de Steam' });
      }
    }

    // Fetch profile
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

    // Fetch games
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

    // Sort by playtime and take top 50
    const games = gamesList
      .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
      .slice(0, 50)
      .map(game => ({
        name: game.name,
        hours: Math.round((game.playtime_forever || 0) / 60),
        image: `${req.headers.origin || ''}/api/steam?proxyImage=${encodeURIComponent(
          `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`
        )}`,
        appid: game.appid
      }));

    // Fetch descriptions
    const gamesWithDescriptions = await Promise.all(
      games.map(async (game) => {
        try {
          const appDetailsResp = await axios.get('https://store.steampowered.com/api/appdetails', {
            params: { appids: game.appid },
            timeout: 5000
          });

          const appData = appDetailsResp.data?.[game.appid]?.data;
          const description = appData?.short_description || 'Sin descripción disponible';
          return { ...game, description };
        } catch {
          return { ...game, description: 'Sin descripción disponible' };
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
    console.error('Error fetching Steam data:', error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ error: 'Error al obtener datos de Steam' });
  }
};
