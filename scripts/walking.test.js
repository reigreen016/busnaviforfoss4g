import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {walkingUrl} from '../walking.js';
const data=JSON.parse(readFileSync(new URL('../data/timetable.json',import.meta.url)));
test('walking directions start at the exact GTFS alighting stop coordinates for every venue',()=>{
 for(const venue of data.venues){
  const trips=data.trips.filter(t=>venue.stops.some(s=>s in t.destinations));assert.ok(trips.length);
  for(const trip of trips)for(const stop of venue.stops.filter(s=>s in trip.destinations)){
   const feed=data.feeds[trip.feed],point=feed.stopLocations[trip.evidence[stop].stopId];
   const url=new URL(walkingUrl(trip,stop,venue.venue,feed));assert.equal(url.searchParams.get('origin'),`${point.lat},${point.lon}`);assert.equal(url.searchParams.get('travelmode'),'walking');assert.equal(url.searchParams.get('destination'),venue.venue+' 広島');
  }
 }
});
test('missing stop coordinates never fall back to a station-name search',()=>{assert.equal(walkingUrl({evidence:{x:{stopId:'missing'}}},'x','venue',{stopLocations:{}}),null);});
