export default async function handler(req, res) {
  try {
    const leagueId = '91035049';
    const season = String(req.query.season || '2026');
    const views = String(req.query.views || 'mTeam,mStandings,mStatus,mSettings')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    const url = new URL(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`
    );

    views.forEach(view => url.searchParams.append('view', view));

    if (req.query.week) {
      url.searchParams.set('scoringPeriodId', String(req.query.week));
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const text = await response.text();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');

    if (!response.ok) {
      return res.status(response.status).send(text || JSON.stringify({
        error: 'ESPN request failed',
        status: response.status
      }));
    }

    return res.status(200).send(text);
  } catch (error) {
    console.error('ESPN proxy error:', error);
    return res.status(500).json({
      error: 'ESPN proxy failed',
      message: error?.message || 'Unknown error'
    });
  }
}
