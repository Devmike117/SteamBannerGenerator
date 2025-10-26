import axios from 'axios';
import Jimp from 'jimp';

export default async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { steamId } = req.query;
  const STEAM_API_KEY = process.env.STEAM_API_KEY;

  if (!STEAM_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing STEAM_API_KEY' });
  }

  if (!steamId) {
    return res.status(400).json({ error: 'steamId parameter is required' });
  }

  try {
    // Resolve vanity URL if necessary
    let resolvedSteamId = steamId.trim();
    if (!/^\d+$/.test(resolvedSteamId)) {
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

    const games = gamesList
      .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
      .slice(0, 30)
      .map((game, idx) => ({
        name: game.name,
        hours: Math.round((game.playtime_forever || 0) / 60),
        image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
        index: idx
      }));

    // Create banner: width 1400, height 600 (grid layout)
    const width = 1400;
    const height = 600;
    const banner = new Jimp({ width, height, color: 0x0f172aff });

    // Load fonts
    const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

    // Grid layout: 5 columns
    const columns = 5;
    const rows = Math.ceil(games.length / columns);
    const gap = 10;
    const tileWidth = Math.floor((width - gap * (columns + 1)) / columns);
    const tileHeight = Math.floor((height - gap * (rows + 1)) / rows);

    // For each game, load image and composite in grid
    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = gap + col * (tileWidth + gap);
      const y = gap + row * (tileHeight + gap);

      try {
        const img = await Jimp.read(g.image);
        img.cover(tileWidth, tileHeight);
        banner.composite(img, x, y);

        // overlay gradient for text readability
        const overlay = new Jimp({ width: tileWidth, height: 50, color: 0x00000080 });
        banner.composite(overlay, x, y + tileHeight - 50);

        // print game name and hours (smaller text for grid)
        const nameText = g.name.length > 25 ? g.name.substring(0, 22) + '...' : g.name;
        banner.print(fontSmall, x + 5, y + tileHeight - 40, nameText, tileWidth - 10);
        banner.print(fontSmall, x + 5, y + tileHeight - 20, `${g.hours}h`);
      } catch (imgErr) {
        console.error('Error loading game image:', imgErr.message || imgErr);
        // draw a placeholder box
        const placeholder = new Jimp({ width: tileWidth, height: tileHeight, color: 0x1f293780 });
        banner.composite(placeholder, x, y);
      }
    }

    // Send PNG buffer
    const buffer = await banner.getBufferAsync(Jimp.MIME_PNG);
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating banner:', error.response ? error.response.data : error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ error: 'Error al generar el banner' });
  }
};
