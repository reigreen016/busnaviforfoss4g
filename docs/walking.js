// Use the exact alighting stop_id and coordinates from the same operator feed.
export function walkingUrl(trip, stop, venue, feed) {
 const point=feed?.stopLocations?.[trip?.evidence?.[stop]?.stopId];
 if(!point||!Number.isFinite(point.lat)||!Number.isFinite(point.lon))return null;
 const url=new URL('https://www.google.com/maps/dir/');
 url.search=new URLSearchParams({api:'1',origin:`${point.lat},${point.lon}`,destination:venue+' 広島',travelmode:'walking'}).toString();
 return url.href;
}
