import {sampleField, REGIONS} from './field.js';
import {ROUND_NAMES, games, choose, fill, statistics, restore, validateField, scoreBracket} from './bracket.js';
const $ = id => document.getElementById(id);
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key = 'michaels-madness-v1';
let state = {version:1,field:sampleField,label:'2025 historical field · after the First Four',picks:{},seed:'michael-8',chaos:50};
let region = 'South';
let mode='picks';
try {
  const saved = localStorage.getItem(key);
  if (saved) state = restore(JSON.parse(saved));
} catch { $('notice').textContent = 'Saved data could not be read. A fresh bracket is ready; your next change will save a new copy.'; }
function syncControls() {
  $('seed').value = state.seed;
  if (![0,50,100].includes(state.chaos)) {
    const option = document.createElement('option'); option.value=state.chaos; option.textContent=`Custom chaos · ${state.chaos}/100`; $('personality').append(option);
  }
  $('personality').value = state.chaos;
}
function persist() {
  try { localStorage.setItem(key,JSON.stringify(state)); $('save-state').textContent='Saved on this device'; }
  catch { $('save-state').textContent='Storage unavailable — export to keep your picks'; }
}
function announce(message) { $('notice').textContent = message; }
function teamButton(game,team) {
  if (!team) return '<button class="team" disabled><span class="seed">—</span><span class="name">Awaiting a winner</span></button>';
  const selected = game.winner?.id === team.id;
  const verdict=mode==='picks'&&selected?scoreBracket(state.field,state.picks,state.results||{}).rounds[game.round].entries[game.index].status:'';
  return `<button class="team" data-game="${game.id}" data-team="${team.id}" aria-pressed="${selected}" ${game.teams.every(Boolean)?'':'disabled'} aria-label="${mode==='results'?'Record winner':'Pick'} ${escape(team.name)} in ${ROUND_NAMES[game.round]}${verdict?' · '+verdict:''}"><span class="seed">${team.seed}</span><span class="name">${escape(team.name)}</span><span class="tick" aria-hidden="true">${selected?(verdict==='correct'?'✓':verdict==='missed'||verdict==='eliminated'?'×':'✓'):''}</span></button>`;
}
function boardHTML(selected) {
  const rounds = games(state.field,mode==='results'?(state.results||{}):state.picks);
  const index = REGIONS.indexOf(selected);
  return (selected === 'Final Four' ? [4,5] : [0,1,2,3]).map(r => {
    const subset = index === -1 ? rounds[r] : rounds[r].slice(index*(8/2**r),(index+1)*(8/2**r));
    return `<section class="round"><h3>${ROUND_NAMES[r]}</h3><div class="matchups">${subset.map(g=>`<div class="game ${r===5?'final':''}" data-game-id="${g.id}">${g.teams.map(t=>teamButton(g,t)).join('')}</div>`).join('')}</div></section>`;
  }).join('');
}
function render() {
  const score=scoreBracket(state.field,state.picks,state.results||{});
  $('score-total').textContent=score.earned;
  $('score-maximum').textContent=score.maximum;
  $('score-recorded').textContent=`${score.recorded} / 63 results recorded`;
  $('score-rounds').innerHTML=score.rounds.map(r=>`<tr><th scope="row">${r.name}</th><td>${r.correct} / ${r.recorded}</td><td>${r.earned}</td><td>${r.remaining}</td></tr>`).join('');
  $('mode-picks').setAttribute('aria-pressed',String(mode==='picks'));
  $('mode-results').setAttribute('aria-pressed',String(mode==='results'));
  $('board-help').textContent=mode==='results'?'Recording actual results. Choose the winning team; your predictions stay intact. Results are entered manually, not fetched live.':'Editing predictions. ✓ means a correct recorded pick; × means missed or eliminated. Change an early pick and incompatible later picks clear.';
  $('fill').hidden=mode==='results';
  $('next').textContent=mode==='results'?'Next unrecorded result →':'Next unpicked game →';
  $('field-label').textContent=state.label;
  const stats=statistics(state.field,state.picks);
  $('picked').innerHTML=`${stats.picked} <small>/ 63</small>`;
  $('upsets').textContent=stats.upsets;
  $('champion').textContent=stats.champion?.name || 'Still anyone’s game';
  $('bracket-title').textContent=stats.champion ? 'One beautifully debatable bracket.' : 'The possibilities are open.';
  $('fill').disabled=stats.picked===63;
  $('fill').innerHTML=stats.picked===63 ? 'All 63 picks are in ✓' : 'Fill the rest <span>↗</span>';
  $('regions').innerHTML=[...REGIONS,'Final Four'].map(r=>`<button role="tab" id="tab-${r.replace(' ','-')}" aria-controls="board" aria-selected="${region===r}" tabindex="${region===r?'0':'-1'}" data-region="${r}">${r}</button>`).join('');
  $('board').setAttribute('aria-labelledby',`tab-${region.replace(' ','-')}`);
  $('board').innerHTML=boardHTML(region);
}
$('regions').addEventListener('click',event=>{
  const button=event.target.closest('[data-region]');
  if (!button) return;
  region=button.dataset.region; render(); $('regions').querySelector('[aria-selected=true]').focus();
});
$('regions').addEventListener('keydown',event=>{
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault(); const all=[...REGIONS,'Final Four'];
  const index=event.key==='Home'?0:event.key==='End'?4:(all.indexOf(region)+(event.key==='ArrowRight'?1:4))%5;
  region=all[index]; render(); $('regions').querySelector('[aria-selected=true]').focus();
});
$('board').addEventListener('click',event=>{
  const button=event.target.closest('[data-team]');
  if (!button) return;
  const target=mode==='results'?'results':'picks';
  const before=Object.keys(state[target]||{}).length;
  state[target]=choose(state.field,state[target]||{},button.dataset.game,button.dataset.team);
  persist(); render();
  $('board').querySelector(`[data-game="${button.dataset.game}"][data-team="${button.dataset.team}"]`)?.focus();
  const after=Object.keys(state[target]).length;
  announce(mode==='results'?'Result saved. Scoring updated; incompatible later results cleared when needed.':after<before ? 'Pick changed. Any incompatible later picks were cleared.' : 'Pick saved. Keep going, or fill the rest.');
});
$('fill').addEventListener('click',()=>{
  state.seed=$('seed').value; state.chaos=Number($('personality').value);
  state.picks=fill(state.field,state.picks,state.seed,state.chaos); persist(); region='Final Four'; render();
  announce('Bracket complete. Your manual picks were kept. Review any region to change the story.');
});
$('seed').addEventListener('change',()=>{state.seed=$('seed').value;persist();announce('Randomness seed saved. Existing picks stay in place; it applies when filling remaining games.');});
$('personality').addEventListener('change',()=>{state.chaos=Number($('personality').value);persist();announce('Personality saved. Existing picks stay in place; it applies when filling remaining games.');});
$('next').addEventListener('click',()=>{
  const game=games(state.field,mode==='results'?(state.results||{}):state.picks).flat().find(g=>!g.winner && g.teams.every(Boolean));
  if (!game) { announce(mode==='results'?'All 63 results are recorded.':'All 63 picks are complete. Export your bracket or review a region.'); return; }
  region=game.round>=4?'Final Four':REGIONS[Math.floor(game.index/(8/2**game.round))];render();
  const node=$('board').querySelector(`[data-game-id="${game.id}"]`);node.scrollIntoView({block:'nearest',inline:'center'});node.querySelector('button').focus();
});
$('reset').addEventListener('click',()=>{
  if (Object.keys(state.picks).length && !confirm('Clear all picks? Export first if you want to keep this bracket. Your field and settings will stay.')) return;
  state.picks={}; region='South'; persist();render();announce('A clean bracket. Same field, fresh possibilities.');
});
$('export').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download='michaels-bracket.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  announce('Bracket exported. Import this file later to restore predictions, recorded results, teams, and settings.');
});
$('import').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>1_000_000)throw new Error('Choose a JSON file smaller than 1 MB.');
    const imported=restore(JSON.parse(await file.text()));
    if((Object.keys(state.picks).length||Object.keys(state.results||{}).length) && !confirm('Replace the current field, predictions and recorded results with this imported bracket?'))return;
    state=imported;region='South';syncControls();persist();render();announce('Bracket imported. You can pick up where you left off.');
  }catch(error){announce(`Import failed: ${error.message}`);}finally{event.target.value='';}
});
$('edit').addEventListener('click',()=>{
  $('field-json').value=JSON.stringify(state.field,null,2);$('custom-label').value=state.label;$('field-error').textContent='';$('field-dialog').showModal();
});
$('close-dialog').addEventListener('click',()=>$('field-dialog').close());
$('field-form').addEventListener('submit',event=>{
  event.preventDefault();
  try{
    const field=validateField(JSON.parse($('field-json').value));
    if((Object.keys(state.picks).length||Object.keys(state.results||{}).length) && !confirm('Use this field and clear predictions and recorded results?'))return;
    state.results={};state.field=field;state.label=$('custom-label').value.trim()||'Custom field';state.picks={};region='South';persist();render();$('field-dialog').close();announce('Your field is ready.');
  }catch(error){$('field-error').textContent=error.message;}
});
window.addEventListener('beforeprint',()=>{
  $('board').innerHTML=[...REGIONS,'Final Four'].map(r=>`<section class="print-region" style="width:100%"><h2>${r}</h2><div class="board">${boardHTML(r)}</div></section>`).join('');
});
window.addEventListener('afterprint',render);
$('print').addEventListener('click',()=>window.print());
syncControls();render();

for(const value of ['picks','results'])$('mode-'+value).onclick=()=>{mode=value;render();};
$('clear-results').onclick=()=>{if(!Object.keys(state.results||{}).length||confirm('Clear all recorded results? Your predictions stay intact.')){state.results={};persist();render();announce('Recorded results cleared.');}};
