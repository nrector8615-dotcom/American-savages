const CFG={leagueId:'91035049',season:2026,name:'American Savages',est:2019};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const fmt=n=>Number(n||0).toFixed(2); const pct=n=>`${(Number(n||0)*100).toFixed(1)}%`;
const pos={1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST'};
let CACHE={};
async function api(views='mTeam,mStandings,mStatus,mSettings',week='',season=CFG.season){const k=[views,week,season].join('|');if(CACHE[k])return CACHE[k];const u=new URL('/api/espn',location.origin);u.searchParams.set('views',views);u.searchParams.set('season',season);if(week)u.searchParams.set('week',week);const r=await fetch(u);if(!r.ok)throw new Error(`ESPN ${r.status}`);return CACHE[k]=await r.json();}
function teamName(t){return t?.name||[t?.location,t?.nickname].filter(Boolean).join(' ')||t?.abbrev||`Team ${t?.id}`}
function ownerName(t,data){const id=t?.owners?.[0];const m=(data?.members||[]).find(x=>x.id===id);return m?.displayName||[m?.firstName,m?.lastName].filter(Boolean).join(' ')||'Manager'}
function logo(t){return t?.logo||'assets/league-logo.png'}
function overall(t){return t?.record?.overall||{wins:0,losses:0,ties:0,pointsFor:0,pointsAgainst:0,percentage:0}}
function currentWeek(d){return d?.status?.currentMatchupPeriod||d?.status?.latestScoringPeriod||1}
function activePage(){const f=location.pathname.split('/').pop()||'index.html';$$('.main-nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===f))}
function shell(){activePage();$('#menuBtn')?.addEventListener('click',()=>$('#mainNav')?.classList.toggle('open'));$$('.main-nav a').forEach(a=>a.addEventListener('click',()=>$('#mainNav')?.classList.remove('open')))}
function setLive(ok=true,msg='Connected to ESPN'){const el=$('#leagueStatus');if(el)el.textContent=msg;const meta=$('#leagueMeta');if(meta)meta.textContent=`League ID ${CFG.leagueId} • 2026`;if(!ok&&el)el.style.color='#ff6b6b'}
function matchupRows(g,tm){return ['away','home'].map(side=>{const s=g?.[side];if(!s)return'';const t=tm.get(s.teamId);const win=g.winner===side.toUpperCase();return `<div class="team-row ${win?'winner':''}"><img class="team-avatar" src="${esc(logo(t))}" onerror="this.src='assets/league-logo.png'"><div><strong>${esc(teamName(t))}</strong><small>${esc(t?._owner||'Manager')}</small></div><span class="score">${fmt(s.totalPoints)}</span></div>`}).join('')}
function scoreboardMarkup(d,week){const teams=d.teams||[];teams.forEach(t=>t._owner=ownerName(t,d));const tm=new Map(teams.map(t=>[t.id,t]));const games=(d.schedule||[]).filter(g=>Number(g.matchupPeriodId)===Number(week));return games.length?games.map((g,i)=>`<article class="panel matchup-card"><div class="matchup-head"><span>Matchup ${i+1}</span><span>Week ${week}</span></div>${matchupRows(g,tm)}</article>`).join(''):'<div class="panel empty-state">No matchups found for this week.</div>'}
async function initTicker(){try{const d=await api('mTeam,mStatus,mScoreboard');const w=currentWeek(d),teams=d.teams||[];teams.forEach(t=>t._owner=ownerName(t,d));const tm=new Map(teams.map(t=>[t.id,t]));const gs=(d.schedule||[]).filter(x=>Number(x.matchupPeriodId)===Number(w));const bits=gs.map(g=>{const a=tm.get(g.away?.teamId),h=tm.get(g.home?.teamId);return `<span class="ticker-game"><b>${esc(teamName(a))}</b> ${fmt(g.away?.totalPoints)} <em>vs</em> ${fmt(g.home?.totalPoints)} <b>${esc(teamName(h))}</b></span>`});const track=$('#tickerTrack');if(track&&bits.length)track.innerHTML=bits.join('')+bits.join('');const lab=$('#tickerLabel');if(lab)lab.innerHTML=`<span class="ticker-dot"></span> WEEK ${w}`;setLive(true)}catch(e){setLive(false,'ESPN data unavailable');}}

function seasonYears(){return Array.from({length:CFG.season-CFG.est+1},(_,i)=>CFG.est+i)}
function managerKey(t,d){
  const owner=t?.owners?.[0];
  if(owner)return `id:${owner}`;
  const n=ownerName(t,d);
  return `name:${String(n||'manager').trim().toLowerCase()}`;
}
function finalChampion(d){
  const teams=d?.teams||[];
  return teams.find(t=>Number(t.rankCalculatedFinal)===1)
    || standingsSorted(d)[0]
    || null;
}
function addSeasonSelect(anchorId,onChange,label='Season'){
  const anchor=$(`#${anchorId}`);
  if(!anchor)return null;
  const wrap=document.createElement('div');
  wrap.className='season-picker';
  wrap.style.cssText='display:flex;align-items:center;gap:10px;margin:0 0 16px;flex-wrap:wrap';
  const lab=document.createElement('strong');
  lab.textContent=label;
  const sel=document.createElement('select');
  sel.className='select';
  sel.innerHTML=seasonYears().slice().reverse().map(y=>`<option value="${y}">${y}</option>`).join('');
  wrap.append(lab,sel);
  anchor.parentElement.insertBefore(wrap,anchor);
  sel.addEventListener('change',()=>onChange(Number(sel.value)));
  return sel;
}

function standingsSorted(d){return [...(d.teams||[])].sort((a,b)=>{const A=overall(a),B=overall(b);return (B.percentage-A.percentage)||(B.pointsFor-A.pointsFor)})}
async function initHome(){try{const d=await api('mTeam,mRoster,mStandings,mStatus,mSettings,mScoreboard');setLive(true);const w=currentWeek(d);const standings=standingsSorted(d);$('#homeStats').innerHTML=`<div class="panel stat-card"><span>Teams</span><strong>${d.teams?.length||0}</strong></div><div class="panel stat-card"><span>Current Week</span><strong>${w}</strong></div><div class="panel stat-card"><span>Season</span><strong>2026</strong></div><div class="panel stat-card"><span>Est.</span><strong>2019</strong></div>`;$('#homeMatchups').innerHTML=scoreboardMarkup(d,w);$('#homeStandings').innerHTML=standings.map((t,i)=>{const r=overall(t);return `<tr><td class="rank">${i+1}</td><td><strong>${esc(teamName(t))}</strong><br><small class="muted">${esc(ownerName(t,d))}</small></td><td>${r.wins}-${r.losses}${r.ties?`-${r.ties}`:''}</td><td>${fmt(r.pointsFor)}</td><td>${pct(r.percentage)}</td></tr>`}).join('');const top=[...standings].sort((a,b)=>overall(b).pointsFor-overall(a).pointsFor).slice(0,5);$('#powerList').innerHTML=top.map((t,i)=>`<div class="leader-row"><span class="num">${i+1}</span><div><strong>${esc(teamName(t))}</strong><small class="muted">${esc(ownerName(t,d))}</small></div><b>${fmt(overall(t).pointsFor)}</b></div>`).join('')}catch(e){setLive(false,'Could not connect to ESPN')}}
async function initGame(){const select=$('#weekSelect');try{const base=await api('mTeam,mStatus,mSettings');const max=base.status?.finalScoringPeriod||18;const w=currentWeek(base);select.innerHTML=Array.from({length:max},(_,i)=>`<option value="${i+1}" ${i+1===w?'selected':''}>Week ${i+1}</option>`).join('');async function load(){const wk=select.value;$('#gameGrid').innerHTML='<div class="panel loading">Loading scoreboard…</div>';try{const d=await api('mTeam,mMatchupScore,mBoxscore',wk);$('#gameGrid').innerHTML=scoreboardMarkup(d,wk)}catch(e){$('#gameGrid').innerHTML='<div class="panel empty-state">Could not load this ESPN week.</div>'}}select.onchange=load;load()}catch(e){$('#gameGrid').innerHTML='<div class="panel empty-state">ESPN data unavailable.</div>'}}
async function initStandings(){try{const d=await api('mTeam,mStandings,mStatus');$('#standingsBody').innerHTML=standingsSorted(d).map((t,i)=>{const r=overall(t);return `<tr><td class="rank">${i+1}</td><td><strong>${esc(teamName(t))}</strong><br><small class="muted">${esc(ownerName(t,d))}</small></td><td>${r.wins}-${r.losses}-${r.ties||0}</td><td>${fmt(r.pointsFor)}</td><td>${fmt(r.pointsAgainst)}</td><td>${pct(r.percentage)}</td></tr>`}).join('')}catch(e){$('#standingsBody').innerHTML='<tr><td colspan="6">Could not load standings.</td></tr>'}}
async function initManagers(){try{const d=await api('mTeam,mRoster,mStandings');$('#managerGrid').innerHTML=(d.teams||[]).map(t=>{const r=overall(t),entries=t.roster?.entries||[];return `<article class="panel manager-card"><div class="manager-top"><img class="manager-logo" src="${esc(logo(t))}" onerror="this.src='assets/league-logo.png'"><div><span class="badge">Team ${t.id}</span><h3>${esc(teamName(t))}</h3><div class="muted">${esc(ownerName(t,d))}</div></div></div><div class="grid grid-3" style="margin-top:14px"><div><span class="mini-label">Record</span><strong>${r.wins}-${r.losses}</strong></div><div><span class="mini-label">PF</span><strong>${fmt(r.pointsFor)}</strong></div><div><span class="mini-label">Roster</span><strong>${entries.length}</strong></div></div></article>`}).join('')}catch(e){$('#managerGrid').innerHTML='<div class="panel empty-state">Could not load managers.</div>'}}
function playerObj(e){return e?.playerPoolEntry?.player||e?.playerPoolEntry||{}};
async function initPlayers(){try{const d=await api('mTeam,mRoster,mStandings');const rows=[];(d.teams||[]).forEach(t=>(t.roster?.entries||[]).forEach(e=>{const p=playerObj(e);const stat=(p.stats||[]).find(s=>s.statSourceId===0&&s.statSplitTypeId===0) || (p.stats||[])[0];rows.push({name:p.fullName||`Player ${e.playerId}`,team:teamName(t),owner:ownerName(t,d),position:pos[p.defaultPositionId]||'FLEX',pts:Number(stat?.appliedTotal||stat?.appliedAverage||0)})}));rows.sort((a,b)=>b.pts-a.pts);$('#playersBody').innerHTML=rows.map((p,i)=>`<tr><td class="rank">${i+1}</td><td><strong>${esc(p.name)}</strong></td><td>${esc(p.position)}</td><td>${esc(p.team)}</td><td>${esc(p.owner)}</td><td>${fmt(p.pts)}</td></tr>`).join('')||'<tr><td colspan="6">Player stats will populate once ESPN returns roster scoring data.</td></tr>'}catch(e){$('#playersBody').innerHTML='<tr><td colspan="6">Could not load player leaders.</td></tr>'}}
async function initDraft(){
  const board=$('#draftBoard');
  const meta=$('#draftMeta');
  async function load(y){
    board.innerHTML='<div class="empty-state">Loading draft history…</div>';
    try{
      const d=await api('mTeam,mRoster,mDraftDetail','',y);
      const picks=d.draftDetail?.picks||[];
      const teams=d.teams||[];
      const tm=new Map(teams.map(t=>[t.id,t]));
      const pm=new Map();
      teams.forEach(t=>(t.roster?.entries||[]).forEach(e=>{
        const p=playerObj(e);
        pm.set(Number(e.playerId),p.fullName||`Player ${e.playerId}`)
      }));
      if(!picks.length){
        board.innerHTML=`<div class="empty-state">No ESPN draft results were returned for ${y}.</div>`;
        if(meta)meta.textContent=`${y} draft`;
        return;
      }
      const rounds=Math.max(...picks.map(p=>p.roundId||1));
      const byTeam={};
      picks.forEach(p=>(byTeam[p.teamId]??=[]).push(p));
      board.innerHTML=Object.entries(byTeam).map(([tid,ps])=>`<div class="draft-col"><h3>${esc(teamName(tm.get(Number(tid))))}</h3>${ps.sort((a,b)=>a.overallPickNumber-b.overallPickNumber).map(p=>`<div class="pick"><b>${esc(pm.get(Number(p.playerId))||`Player #${p.playerId}`)}</b><span>R${p.roundId} • Pick ${p.overallPickNumber}</span></div>`).join('')}</div>`).join('');
      if(meta)meta.textContent=`${y} • ${picks.length} picks • ${rounds} rounds`;
    }catch(e){
      board.innerHTML=`<div class="empty-state">Could not load ${y} ESPN draft results.</div>`;
    }
  }
  addSeasonSelect('draftBoard',load,'Draft season');
  load(CFG.season);
}
async function initRules(){try{const d=await api('mSettings,mStatus,mTeam');const s=d.settings||{},roster=s.rosterSettings||{},sched=s.scheduleSettings||{},score=s.scoringSettings||{};const slots=roster.lineupSlotCounts||{};const slotNames={0:'QB',2:'RB',4:'WR',6:'TE',16:'D/ST',17:'K',20:'Bench',21:'IR',23:'Flex',7:'OP/Superflex'};const lineup=Object.entries(slots).filter(([,v])=>v).map(([k,v])=>`${slotNames[k]||`Slot ${k}`}: ${v}`).join(' • ');$('#rulesGrid').innerHTML=`<article class="panel rule-card"><h3>League</h3><p>${esc(s.name||CFG.name)}</p><p class="muted">${d.teams?.length||0} teams • ESPN league ${CFG.leagueId}</p></article><article class="panel rule-card"><h3>Roster</h3><p>${esc(lineup||'Roster settings load from ESPN.')}</p></article><article class="panel rule-card"><h3>Schedule</h3><p>Regular season: ${sched.matchupPeriodCount||'—'} matchup periods.</p><p class="muted">Playoff teams: ${sched.playoffTeamCount||'—'}</p></article><article class="panel rule-card"><h3>Scoring</h3><p>Scoring rules are synced from ESPN.</p><p class="muted">Reception value: ${score.scoringItems?.find(x=>x.statId===53)?.points??'See ESPN settings'}</p></article>`}catch(e){$('#rulesGrid').innerHTML='<div class="panel empty-state">Could not load league settings.</div>'}}
async function initTransactions(){try{const d=await api('mTeam,mTransactions2');const teams=d.teams||[];const tm=new Map(teams.map(t=>[t.id,t]));const tx=d.transactions||[];$('#transactions').innerHTML=tx.length?tx.slice(0,75).map(x=>{const team=tm.get(x.teamId||x.proposingTeamId||x.executingTeamId);return `<div class="transaction-row"><div><strong>${esc(String(x.type||x.status||'Transaction').replaceAll('_',' '))}</strong><div class="muted">${esc(teamName(team))}</div></div><small class="muted">${x.processDate?new Date(x.processDate).toLocaleString():''}</small></div>`}).join(''):'<div class="empty-state">ESPN did not return public transaction details. This view can require league authentication.</div>'}catch(e){$('#transactions').innerHTML='<div class="empty-state">ESPN transaction history is unavailable publicly for this league.</div>'}}
async function initPlayoffs(){
  const grid=$('#playoffGrid');
  async function load(y){
    grid.innerHTML='<div class="panel loading">Loading playoff history…</div>';
    try{
      const d=await api('mTeam,mSchedule,mStatus,mSettings','',y);
      const games=(d.schedule||[]).filter(g=>g.playoffTierType&&g.playoffTierType!=='NONE');
      if(!games.length){
        grid.innerHTML=`<div class="panel empty-state">No playoff matchups were returned for ${y}.</div>`;
        return;
      }
      const periods=[...new Set(games.map(g=>Number(g.matchupPeriodId)))].sort((a,b)=>a-b);
      grid.innerHTML=periods.map(w=>`<section style="margin-bottom:18px"><h3 style="margin:0 0 10px">Week ${w}</h3><div class="grid">${scoreboardMarkup({...d,schedule:games},w)}</div></section>`).join('');
    }catch(e){
      grid.innerHTML=`<div class="panel empty-state">Could not load ${y} playoffs.</div>`;
    }
  }
  addSeasonSelect('playoffGrid',load,'Playoff season');
  load(CFG.season);
}
async function initRivalries(){
  try{
    const years=seasonYears();
    const results=await Promise.allSettled(years.map(y=>api('mTeam,mSchedule','',y)));
    const pairs=new Map();
    const names=new Map();

    results.forEach(result=>{
      if(result.status!=='fulfilled')return;
      const d=result.value;
      (d.teams||[]).forEach(t=>{
        const key=managerKey(t,d);
        names.set(key,{owner:ownerName(t,d),team:teamName(t)});
      });
      const teamKeys=new Map((d.teams||[]).map(t=>[Number(t.id),managerKey(t,d)]));
      (d.schedule||[]).forEach(g=>{
        const aid=Number(g.away?.teamId), hid=Number(g.home?.teamId);
        if(!aid||!hid)return;
        const a=teamKeys.get(aid), b=teamKeys.get(hid);
        if(!a||!b||a===b)return;
        const ids=[a,b].sort();
        const k=ids.join('|||');
        const x=pairs.get(k)||{a:ids[0],b:ids[1],games:0,aW:0,bW:0,ties:0};
        x.games++;
        if(g.winner==='AWAY'){
          a===x.a?x.aW++:x.bW++;
        }else if(g.winner==='HOME'){
          b===x.a?x.aW++:x.bW++;
        }else if(g.winner==='TIE'){
          x.ties++;
        }
        pairs.set(k,x);
      });
    });

    const rows=[...pairs.values()].sort((a,b)=>b.games-a.games).slice(0,30);
    $('#rivalryBody').innerHTML=rows.map((x,i)=>{
      const A=names.get(x.a)||{owner:'Manager A'}, B=names.get(x.b)||{owner:'Manager B'};
      return `<tr><td class="rank">${i+1}</td><td><strong>${esc(A.owner)}</strong> vs <strong>${esc(B.owner)}</strong></td><td>${x.games}</td><td>${x.aW}-${x.bW}${x.ties?` (${x.ties} tie${x.ties===1?'':'s'})`:''}</td></tr>`
    }).join('')||'<tr><td colspan="4">No historical rivalry data was returned by ESPN.</td></tr>';
  }catch(e){
    $('#rivalryBody').innerHTML='<tr><td colspan="4">Could not build rivalry history.</td></tr>';
  }
}
async function initRecords(){
  const winsEl=$('#careerWins'), pointsEl=$('#careerPoints'), champsEl=$('#champions');
  try{
    winsEl.innerHTML='<div class="empty-state">Loading 2019–2026 history…</div>';
    pointsEl.innerHTML='<div class="empty-state">Loading scoring history…</div>';
    champsEl.innerHTML='<div class="empty-state">Loading champions…</div>';

    const years=seasonYears();
    const results=await Promise.allSettled(
      years.map(y=>api('mTeam,mStandings,mStatus,mSettings','',y))

    const agg=new Map(), champs=[], loaded=[], missing=[];

    results.forEach((result,index)=>{
      const y=years[index];
      if(result.status!=='fulfilled'||!result.value?.teams?.length){
        missing.push(y);
        return;
      }

      const d=result.value;
      loaded.push(y);

      (d.teams||[]).forEach(t=>{
        const key=managerKey(t,d);
        const r=overall(t);
        const a=agg.get(key)||{
          name:ownerName(t,d),
          wins:0,losses:0,ties:0,pf:0,pa:0,seasons:0,titles:0
        };
        a.name=ownerName(t,d)||a.name;
        a.wins+=Number(r.wins||0);
        a.losses+=Number(r.losses||0);
        a.ties+=Number(r.ties||0);
        a.pf+=Number(r.pointsFor||0);
        a.pa+=Number(r.pointsAgainst||0);
        a.seasons++;
        agg.set(key,a);
      });

      if(y<CFG.season){
        const champ=finalChampion(d);
        if(champ){
          const key=managerKey(champ,d);
          if(agg.has(key))agg.get(key).titles++;
          champs.push({
            year:y,
            name:ownerName(champ,d),
            team:teamName(champ)
          });
        }
      }
    });

    const list=[...agg.values()];
    winsEl.innerHTML=list.length
      ?[...list].sort((a,b)=>b.wins-a.wins||b.pf-a.pf).slice(0,10).map((a,i)=>`<div class="record-rank-row"><span class="record-rank">${i+1}</span><div><strong>${esc(a.name)}</strong><small>${a.seasons} season${a.seasons===1?'':'s'} • ${a.titles} title${a.titles===1?'':'s'}</small></div><b>${a.wins} W</b></div>`).join('')
      :'<div class="empty-state">ESPN did not return any historical standings.</div>';

    pointsEl.innerHTML=list.length
      ?[...list].sort((a,b)=>b.pf-a.pf).slice(0,10).map((a,i)=>`<div class="record-rank-row"><span class="record-rank">${i+1}</span><div><strong>${esc(a.name)}</strong><small>${a.seasons} season${a.seasons===1?'':'s'}</small></div><b>${fmt(a.pf)}</b></div>`).join('')
      :'<div class="empty-state">ESPN did not return any historical scoring.</div>';

    champsEl.innerHTML=champs.length
      ?champs.sort((a,b)=>b.year-a.year).map(c=>`<div class="record-line"><span><strong>${c.year}</strong> • ${esc(c.team)}</span><b>${esc(c.name)}</b></div>`).join('')
      :'<div class="empty-state">ESPN did not return completed-season champions.</div>';

    const sub=$('.page-sub');
    if(sub){
      sub.textContent=loaded.length
        ?`Loaded ESPN history: ${loaded.join(', ')}${missing.length?` • unavailable: ${missing.join(', ')}`:''}`
        :`No historical ESPN seasons loaded.`;
    }
  }catch(e){
    winsEl.innerHTML='<div class="empty-state">Could not load record book.</div>';
    pointsEl.innerHTML='<div class="empty-state">Could not load scoring history.</div>';
    champsEl.innerHTML='<div class="empty-state">Could not load championship history.</div>';
  }
}
async function boot(){shell();initTicker();const p=document.body.dataset.page;({home:initHome,game:initGame,standings:initStandings,managers:initManagers,players:initPlayers,draft:initDraft,rules:initRules,transactions:initTransactions,playoffs:initPlayoffs,rivalries:initRivalries,records:initRecords}[p]||(()=>{}))()}
document.addEventListener('DOMContentLoaded',boot);
