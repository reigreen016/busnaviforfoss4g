import {selectTrips,referenceDate} from './schedule.js?v=13';
import {strings,venues,translate,arrivalTime} from './i18n.js?v=13';
import {walkingUrl} from './walking.js?v=13';
import {departureMarkup,time} from './presentation.js?v=13';
import {applyRealtime,createRealtimePoller,fresh,canUseRealtime} from './realtime.js?v=13';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ENDPOINT='https://busnavi-realtime.rnp9cf8k76.workers.dev/api/realtime';
let data,selected=0,live=true,currentMode=false,snapshot=null,poller,lang=localStorage.getItem('busguide-language')||'ja';
if(!strings[lang])lang='ja';
const eventDates=new Map();
const boxes={1:[67.38,40.03,3.67,2.83],2:[67.38,35.66,3.67,2.83],3:[67.38,31.29,3.67,2.78],4:[67.38,26.97,3.67,2.78],5:[67.38,22.69,3.67,2.87],6:[46.38,35.87,3.56,2.83],7:[46.38,31.72,3.62,2.74],8:[46.38,27.31,3.62,2.91],9:[46.38,23.07,3.62,2.87],16:[37.72,92.29,4.44,3.38],17:[24.89,64.51,4.22,3.25],20:[25.66,28.77,4.5,3.34],21:[37.94,6.59,4.61,3.42],23:[25,4.45,4.44,3.25]};
const now=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date()).split(' ');
const translated=(value,feed)=>translate(feed||data.feeds.find(f=>f.translations?.[lang]?.[value])||{},lang,value);

function dateOptions(date){const v=data.venues[selected];$('#event-date').innerHTML=[...new Set([...v.dates,date,now()[0]])].map(d=>`<option value="${d}">${d}</option>`).join('');$('#event-date').value=date;}
function setVenueDate(){const v=data.venues[selected],date=currentMode?now()[0]:eventDates.get(v.id)||v.dates[0];$('#date').value=date;dateOptions(date);}
function render(){
 if(!data)return;
 const text=strings[lang],current=now(),v=data.venues[selected];document.documentElement.lang=lang;
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=text[el.dataset.i18n]);$('#language').value=lang;$('#event-date').setAttribute('aria-label',text.date);
 $('#tabs').innerHTML=data.venues.map((venue,i)=>`<button role="tab" id="tab-${i}" aria-controls="venue-panel" aria-selected="${i===selected}" tabindex="${i===selected?0:-1}" data-index="${i}">${esc(lang==='ja'?venue.name:venues[lang][i][0])}</button>`).join('');
 if(live)$('#time').value=current[1].slice(0,5);if(currentMode&&live)$('#date').value=current[0];
 const date=$('#date').value,hm=$('#time').value,seconds=hm.split(':').reduce((a,b)=>a*60+Number(b),0)*60+(live?Number(current[1].slice(-2)):0);
 $('#clock').textContent=hm;$('#mode').textContent=text[live?'live':'fixed'];$('#venue-panel').setAttribute('aria-labelledby',`tab-${selected}`);$('#venue-name').textContent=lang==='ja'?v.venue:venues[lang][selected][1];
 $('#venue-stops').innerHTML=`<span class="alight-label">${esc(text.stop)}</span>`+`<span class="stop-legend stop-legend--first">${v.stops.map(stop=>esc(translated(stop))).join(' / ')}</span>`;
 const refs=data.feeds.some(f=>referenceDate(f,date)!==date),eligible=canUseRealtime(live,date,current[0],refs);
 const trips=selectTrips(data,v,date,seconds,true,t=>eligible&&!t.reference?applyRealtime(t,data,snapshot,date,Date.now()/1000):t),visible=trips.slice(0,20),platforms=new Map();
 v.stops.forEach((stop,i)=>{const group=trips.filter(t=>stop in t.destinations);for(const t of group.filter(t=>t.departure<=group[0].departure+180)){if(!t.platform)continue;if(!platforms.has(t.platform))platforms.set(t.platform,new Set());platforms.get(t.platform).add(i);}});
 $('#markers').innerHTML=Object.entries(boxes).map(([p,b])=>{const tags=platforms.get(p)||new Set();return `<div data-platform="${p}" class="stop-highlight${tags.size?' is-active':''}" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%"><span class="stop-number">${esc(p)}</span></div>`;}).join('');
 const pp=[...platforms.keys()].sort((a,b)=>Number(a)-Number(b));
 $('#upcoming-platforms').setAttribute('aria-label',text.platform);
 $('#upcoming-platforms').innerHTML=pp.length?pp.map(p=>`<span class="overview-number">${esc(p)}</span>`).join(''):`<span class="platform-empty">${trips.length?text.unknown:text.empty}</span>`;
 $('#trip-head').innerHTML=[text.departure,text.platform,text.route].map(label=>`<span>${esc(label)}</span>`).join('');
 $('#trips').innerHTML=visible.map(t=>`<article class="trip${t.departure-seconds<=180?' trip--soon':''}"><div class="trip-time">${departureMarkup(t,lang)}</div><div class="trip-platform">${esc(t.platform||'—')}</div><div class="trip-body"><div class="route">${esc(translated(t.route,data.feeds[t.feed]))} <span>${esc(translated(t.headsign,data.feeds[t.feed]))}</span></div><div class="arrival-info">${v.stops.filter(s=>s in t.destinations).map(stop=>{const href=walkingUrl(t,stop,v.venue,data.feeds[t.feed]);return href?`<a class="arrival-chip" href="${esc(href)}" target="_blank" rel="noopener">${esc(translated(stop,data.feeds[t.feed]))} ${esc(arrivalTime(time(t.destinations[stop]),lang))}</a>`:`<span class="arrival-chip">${esc(translated(stop,data.feeds[t.feed]))} ${esc(arrivalTime(time(t.destinations[stop]),lang))}</span>`;}).join('')}</div><small class="agency">${esc(translated(t.agency,data.feeds[t.feed]))}</small></div></article>`).join('');
 $('#empty-message').hidden=trips.length>0;$('#empty-message').textContent=text.empty;
 $('#service-label').textContent=date+' · '+new Intl.DateTimeFormat(lang,{weekday:'long',timeZone:'Asia/Tokyo'}).format(new Date(date+'T12:00:00+09:00'));const weekday=new Date(date+'T12:00:00Z').getUTCDay();$('#day-type').textContent=text[weekday===0?'sunday':weekday===6?'saturday':'weekday'];$('#notice').textContent=refs?text.reference:'';
 const healthy=eligible?(snapshot?.feeds||[]).filter(f=>f.ok&&fresh(f.timestamp,Date.now()/1000)):[];
 $('#realtime-status').textContent=!eligible?text.rtHistorical:healthy.length?text.rtActive+(healthy.length<4?' · '+text.rtPartial:''):text.rtUnavailable;
 $('#realtime-updates').innerHTML=(eligible?snapshot?.feeds||[]:[]).map(f=>`<p>${esc(translated(f.name))} · ${f.ok&&f.timestamp?esc(new Intl.DateTimeFormat(lang,{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(f.timestamp*1000))):'—'} · ${f.ok&&fresh(f.timestamp,Date.now()/1000)?text.rtUpdated:text.rtStale}</p>`).join('');
 $('#sources').innerHTML=data.feeds.map(f=>`<p>${esc(f.agencies.map(a=>translated(a,f)).join(' / '))} · ${esc(f.info[0]?.feed_start_date)} – ${esc(f.info[0]?.feed_end_date)}</p>`).join('');
 const first=visible[0],stop=first?.arrival[0],walk=first?walkingUrl(first,stop,v.venue,data.feeds[first.feed]):null;
 $('#walk-link').hidden=!walk;if(walk){$('#walk-link').href=walk;$('#walk-link').textContent=translated(stop)+' · '+text.walk;}

 poller?.setEnabled(eligible&&!document.hidden);
}
$('#language').onchange=()=>{lang=$('#language').value;localStorage.setItem('busguide-language',lang);render();};
$('#event-date').onchange=()=>{currentMode=false;live=true;eventDates.set(data.venues[selected].id,$('#event-date').value);$('#date').value=$('#event-date').value;render();};
$('#settings').onsubmit=e=>{e.preventDefault();live=false;currentMode=false;eventDates.set(data.venues[selected].id,$('#date').value);dateOptions($('#date').value);render();};
$('#now').onclick=()=>{live=true;currentMode=true;setVenueDate();render();};
function chooseVenue(index){selected=index;setVenueDate();render();}
$('#tabs').onclick=e=>{const button=e.target.closest('button');if(button)chooseVenue(Number(button.dataset.index));};
$('#tabs').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();chooseVenue(e.key==='Home'?0:e.key==='End'?data.venues.length-1:(selected+(e.key==='ArrowRight'?1:data.venues.length-1))%data.venues.length);$(`#tab-${selected}`).focus();}};
try{const response=await fetch('data/timetable.json',{cache:'no-store'});if(!response.ok)throw Error(response.status);data=await response.json();poller=createRealtimePoller({endpoint:ENDPOINT,onUpdate:value=>{snapshot=value;render();}});setVenueDate();render();setInterval(()=>{if(live&&!document.hidden)render();},15000);}catch(error){$('.settings-footer').open=true;$('#notice').textContent=strings[lang].error;console.error(error);}
setInterval(()=>document.body.classList.toggle('phase-second'),1500);
document.addEventListener('visibilitychange',()=>{if(document.hidden)poller?.setEnabled(false);else render();});
