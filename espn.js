const LEAGUE_ID = '91035049';
const CURRENT_SEASON = 2026;
const FIRST_SEASON = 2019;

const ALLOWED = new Set([
  'mTeam','mRoster','mStandings','mMatchupScore','mSettings','mDraftDetail',
  'mStatus','mSchedule','mScoreboard','mBoxscore','mLiveScoring','mTransactions2'
]);

async function requestEspn(url, headers) {
  const r = await fetch(url, { headers });
  const text = await r.text();
  return { r, text };
}

export default async function handler(req, res) {
  try {
    const requestedSeason = Number(req.query.season || CURRENT_SEASON);
    const season = Math.max(FIRST_SEASON, Math.min(2030, requestedSeason));

    const requestedViews = String(
      req.query.views || 'mTeam,mStandings,mStatus,mSettings'
    )
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    const views = requestedViews.filter(v => ALLOWED.has(v));
    const params = new URLSearchParams();
    (views.length ? views : ['mTeam']).forEach(v => params.append('view', v));

    if (req.query.week) {
      params.set('matchupPeriodId', String(req.query.week));
      params.set('scoringPeriodId', String(req.query.week));
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

    let result;

    if (season < CURRENT_SEASON) {
      const historyParams = new URLSearchParams(params);
      historyParams.set('seasonId', String(season));

      const historyUrl =
        `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/${LEAGUE_ID}?${historyParams.toString()}`;

      result = await requestEspn(historyUrl, headers);

      if (!result.r.ok) {
        const fallbackUrl =
          `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?${params.toString()}`;
        result = await requestEspn(fallbackUrl, headers);
      }
    } else {
      const currentUrl =
        `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?${params.toString()}`;
      result = await requestEspn(currentUrl, headers);
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'application/json');

    if (!result.r.ok) {
      return res.status(result.r.status).send(result.text || JSON.stringify({
        error: 'ESPN request failed',
        season,
        status: result.r.status
      }));
    }

    let data;
    try {
      data = JSON.parse(result.text);
    } catch {
      return res.status(502).json({
        error: 'ESPN returned invalid JSON',
        season
      });
    }

    if (Array.isArray(data)) data = data[0] || {};

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'ESPN proxy failed',
      message: error?.message || 'Unknown error'
    });
  }
}
