export function upcomingPlatforms(trips){
 if(!trips.length)return [];
 const byPlatform=new Map();
 for(const t of trips){
  if(t.departure>trips[0].departure+600)break;
  const key=t.platform||'';
  if(!byPlatform.has(key))byPlatform.set(key,t);
 }
 return [...byPlatform.values()].sort((a,b)=>(a.platform?Number(a.platform):Infinity)-(b.platform?Number(b.platform):Infinity));
}

export function isDepartingSoon(departure,now){return departure>=now&&departure-now<=180;}
