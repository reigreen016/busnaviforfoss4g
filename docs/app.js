import {selectTrips,referenceDate} from './schedule.js';
import {strings,venues,translate} from './i18n.js';
import {upcomingPlatforms,isDepartingSoon} from './overview.js?v=6';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data,selected=0,live=true,lang=localStorage.getItem('busguide-language')||'ja';
if(!strings[lang])lang='ja';
const eventDates=new Map();
const positions={1:[67.38,40.03],2:[67.38,35.66],3:[67.38,31.29],4:[67.38,26.97],5:[67.38,22.69],6:[46.38,35.87],7:[46.38,31.72],8:[46.38,27.31],9:[46.38,23.07],16:[37.72,92.29],17:[24.89,64.51],20:[25.66,28.77],21:[37.94,6.59],23:[25,4.45]};
const hhmm=s=>`${String(Math.floor(s/3600)%24).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}`;
const current=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date());
const tr=(t,value)=>translate(data.feeds[t.feed],lang,value);
function setVenueDate(){const v=data.venues[selected],date=eventDates.get(v.id)||v.dates[0];$('#event-date').innerHTML=v.dates.map(d=>`<option value="${d}">${d}</option>`).join('');$('#event-date').value=date;$('#date').value=date;}
function render(){
 if(!data)return;
 const text=strings[lang];document.documentElement.lang=({'zh-cn':'zh-Hans','zh-tw':'zh-Hant'})[lang]||lang;
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=text[el.dataset.i18n]);
 $('#language').value=lang;$('#event-date').setAttribute('aria-label',text.date);
 $('#tabs').innerHTML=data.venues.map((v,i)=>`<button role="tab" id="tab-${i}" aria-controls="venue-panel" aria-selected="${i===selected}" tabindex="${i===selected?0:-1}" data-index="${i}">${esc(lang==='ja'?v.name:venues[lang][i][0])}</button>`).join('');
 const now=current();if(live)$('#time').value=now.slice(0,5);
 const date=$('#date').value,time=$('#time').value,v=data.venues[selected];
 $('#clock').textContent=time;$('#mode').textContent=text[live?'live':'fixed'];
 $('#venue-panel').setAttribute('aria-labelledby',`tab-${selected}`);$('#venue-name').textContent=lang==='ja'?v.venue:venues[lang][selected][1];
 const stopNames=v.stops.map(name=>{const feed=data.feeds.find(f=>f.translations?.[lang]?.[name]);return feed?translate(feed,lang,name):name;});
 $('#venue-stops').innerHTML=`<span class="alight-label">${esc(text.stop)}</span><strong>${stopNames.map(esc).join(' / ')}</strong>`;

 const seconds=time.split(':').reduce((a,v)=>a*60+Number(v),0)*60+(live?Number(now.slice(-2)):0);
 const trips=selectTrips(data,v,date,seconds,true),visible=trips.slice(0,20),upcoming=upcomingPlatforms(trips);
 $('#count').textContent=`${date} · ${trips.length} ${text.trips}`;
 const weekday=new Date(date+'T12:00:00Z').getUTCDay();$('#day-type').textContent=text[weekday===0?'sunday':weekday===6?'saturday':'weekday'];
 const refs=data.feeds.some(f=>referenceDate(f,date)!==date);
 $('#notice').textContent=[refs?text.reference:'',!trips.length?text.empty:''].filter(Boolean).join(' ');
 $('#trip-head').innerHTML=[text.departure,text.route,text.platform].map(x=>`<span>${esc(x)}</span>`).join('');
 $('#next-platforms').innerHTML=upcoming.length?upcoming.map(t=>`<article class="platform-card"><span class="platform-label">${esc(text.platform)}</span><strong>${esc(t.platform||'—')}</strong>${!t.platform?`<small>${esc(text.unknown)}</small>`:''}</article>`).join(''):`<p class="empty">${esc(text.empty)}</p>`;
 $('#trips').innerHTML=visible.map(t=>`<article class="trip${isDepartingSoon(t.departure,seconds)?' trip--soon':''}"><time class="time">${hhmm(t.departure)}</time><div class="trip-body"><div class="route">${esc(tr(t,t.route))} <span>${esc(tr(t,t.headsign))}</span></div><div class="arrival-info"><small>${v.stops.length>1?esc(tr(t,t.arrival[0]))+' · ':''}${esc(text.arrival)} ${hhmm(t.arrival[1])} / ${Math.round((t.arrival[1]-t.departure)/60)} ${esc(text.min)}</small></div><small class="agency">${esc(tr(t,t.agency))}</small></div><div class="platform">${esc(t.platform||'—')}</div></article>`).join('');
 $('#markers').innerHTML=upcoming.flatMap(t=>{const p=t.platform,pos=positions[p];return pos?[`<span class="marker" style="left:${pos[0]+1.8}%;top:${pos[1]+1.4}%">${esc(p)}</span>`]:[];}).join('');
 const stop=visible[0]?.arrival[0]||v.stops[0];$('#walk-link').href=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(stop+' 広島')}&destination=${encodeURIComponent(v.venue+' 広島')}&travelmode=walking`;
 $('#sources').innerHTML=data.feeds.map(f=>`<p>${esc(f.agencies.map(a=>translate(f,lang,a)).join(' / '))} · ${esc(f.info[0]?.feed_start_date)} – ${esc(f.info[0]?.feed_end_date)}</p>`).join('');
}
$('#language').onchange=()=>{lang=$('#language').value;localStorage.setItem('busguide-language',lang);render();};
$('#event-date').onchange=()=>{eventDates.set(data.venues[selected].id,$('#event-date').value);$('#date').value=$('#event-date').value;render();};
$('#settings').onsubmit=e=>{e.preventDefault();live=false;render();};$('#now').onclick=()=>{live=true;setVenueDate();render();};
$('#tabs').onclick=e=>{const b=e.target.closest('button');if(b){selected=Number(b.dataset.index);setVenueDate();render();}};
$('#tabs').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();selected=e.key==='Home'?0:e.key==='End'?3:(selected+(e.key==='ArrowRight'?1:3))%4;setVenueDate();render();$(`#tab-${selected}`).focus();}};
try{const r=await fetch('data/timetable.json',{cache:'no-store'});if(!r.ok)throw Error(r.status);data=await r.json();setVenueDate();render();setInterval(render,15000);}catch(e){$('#notice').textContent=strings[lang].error;console.error(e);}


