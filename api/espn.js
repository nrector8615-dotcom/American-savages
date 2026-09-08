export default async function handler(req, res) {
  try {
    const leagueId = '91035049';
    const currentSeason = 2026;
    const season = Number(req.query.season || currentSeason);

    const views = String(
      req.query.views || 'mTeam,mStandings,mStatus,mSettings'
    )
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    const url = new URL(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`
    );

    views.forEach(view => {
      url.searchParams.append('view', view);
    });

    if (req.query.week) {
      url.searchParams.set(
        'scoringPeriodId',
        String(req.query.week)
      );
    }

    const headers = {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0'
    };

    const espnS2 = process.env.ESPN_S2;
    const swid = process.env.SWID;

    if (espnS2 && swid) {
      headers.Cookie = `espn_s2=${espnS2}; SWID=${swid}`;
    }

    const response = await fetch(url.toString(), {
      headers
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'ESPN request failed',
        status: response.status,
        body: text,
        requestedSeason: season,
        authenticated: Boolean(espnS2 && swid)
      });
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: 'ESPN returned invalid JSON'
      });
    }

    res.setHeader(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=300'
    );

    return res.status(200).json(data);

  } catch (error) {
    console.error('ESPN proxy error:', error);

    return res.status(500).json({
      error: 'ESPN proxy failed',
      message: error?.message || 'Unknown error'
    });
  }
}
