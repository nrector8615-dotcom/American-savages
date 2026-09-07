const LEAGUE_ID = '91035049';
const CURRENT_SEASON = 2026;

export default async function handler(req, res) {
  try {
    const season = Number(req.query.season || CURRENT_SEASON);
    const views = String(
      req.query.views || 'mTeam,mStandings,mStatus,mSettings'
    )
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    const params = new URLSearchParams();

    views.forEach(view => params.append('view', view));

    if (req.query.week) {
      params.set('matchupPeriodId', String(req.query.week));
      params.set('scoringPeriodId', String(req.query.week));
    }

    let url;

    if (season < CURRENT_SEASON) {
      // ESPN historical fantasy seasons use a different endpoint.
      params.set('seasonId', String(season));
      url =
        `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/${LEAGUE_ID}?${params.toString()}`;
    } else {
      url =
        `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?${params.toString()}`;
    }

    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0'
    };

    if (views.includes('mTransactions2')) {
      headers['x-fantasy-filter'] = JSON.stringify({
        transactions: {
          filterType: { value: ['FREEAGENT', 'WAIVER', 'TRADE'] }
        }
      });
    }

    const response = await fetch(url, { headers });
    const text = await response.text();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'application/json');

    if (!response.ok) {
      return res.status(response.status).send(text);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: 'ESPN returned invalid JSON',
        season
      });
    }

    // Historical leagueHistory responses are usually returned as [ { ... } ].
    // Unwrap them so the website gets the same object shape for every season.
    if (season < CURRENT_SEASON && Array.isArray(data)) {
      data = data[0] || {};
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'ESPN proxy failed',
      message: error?.message || 'Unknown error'
    });
  }
}
