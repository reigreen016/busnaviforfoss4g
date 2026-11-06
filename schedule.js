export function active(feed, service, date) {
 const key=date.replaceAll('-','');
 const exception=feed.exceptions.find(r=>r.service_id===service&&r.date===key);
 if(exception)return exception.exception_type==='1';
 const day=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date(date+'T12:00:00+09:00').getUTCDay()];
 return feed.calendar.some(r=>r.service_id===service&&r.start_date<=key&&key<=r.end_date&&r[day]==='1');
}
// Event dates predate the supplied feeds: use a labelled reference service day.
export function referenceDate(feed, date) {
 const key=date.replaceAll('-',''), info=feed.info?.[0];
 if(!info || (info.feed_start_date<=key && key<=info.feed_end_date))return date;
 const weekday=new Date(date+'T12:00:00Z').getUTCDay();
 return `2026-11-${String(8+weekday).padStart(2,'0')}`;
}
export function selectTrips(data, venue, date, seconds, reference=false, transform=t=>t) {
 // Include yesterday's 24:xx departures after midnight, using their service date.
 const previous=new Date(date+'T00:00:00Z');previous.setUTCDate(previous.getUTCDate()-1);
 return [[date,0],[previous.toISOString().slice(0,10),-86400]].flatMap(([serviceDate,offset])=>data.trips.filter(t=>active(data.feeds[t.feed],t.service,reference?referenceDate(data.feeds[t.feed],serviceDate):serviceDate)).map(t=>({...t,serviceDate:reference?referenceDate(data.feeds[t.feed],serviceDate):serviceDate,reference:reference&&referenceDate(data.feeds[t.feed],serviceDate)!==serviceDate,departure:t.departure+offset,destinations:Object.fromEntries(Object.entries(t.destinations).map(([k,v])=>[k,v+offset]))}))).map(transform).filter(Boolean).filter(t=>(t.origin===undefined||t.origin==='広島駅')&&t.departure>=seconds&&t.departure<86400&&venue.stops.some(s=>s in t.destinations)).map(t=>({...t,arrival:Object.entries(t.destinations).filter(([s])=>venue.stops.includes(s)).sort((a,b)=>a[1]-b[1])[0]})).sort((a,b)=>a.departure-b.departure||a.arrival[1]-b.arrival[1]);
}
