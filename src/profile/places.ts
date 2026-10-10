// Places offered by the location picker: remote options, the largest U.S.
// metro areas (with the cities people type for them), other major U.S.
// tech and job hubs, and a few international hubs. `also` holds search
// aliases (other cities in the metro, nicknames, the state name).

export interface Place {
  name: string;
  also?: string;
}

export const PLACES: Place[] = [
  { name: 'Remote (US)', also: 'remote anywhere work from home wfh usa' },
  { name: 'Anywhere in the US', also: 'any usa united states nationwide open to relocation relocate' },

  { name: 'New York City, NY', also: 'nyc manhattan brooklyn queens new york jersey city newark' },
  { name: 'Los Angeles, CA', also: 'la santa monica pasadena long beach irvine orange county california' },
  { name: 'Chicago, IL', also: 'illinois evanston naperville' },
  { name: 'Dallas–Fort Worth, TX', also: 'dallas fort worth dfw plano irving frisco arlington texas' },
  { name: 'Houston, TX', also: 'texas the woodlands sugar land' },
  { name: 'Washington, DC', also: 'dc arlington alexandria reston herndon tysons mclean bethesda dmv virginia maryland' },
  { name: 'Philadelphia, PA', also: 'philly pennsylvania wilmington' },
  { name: 'Atlanta, GA', also: 'georgia alpharetta marietta' },
  { name: 'Miami, FL', also: 'fort lauderdale boca raton south florida' },
  { name: 'Phoenix, AZ', also: 'scottsdale tempe chandler mesa arizona' },
  { name: 'Boston, MA', also: 'cambridge somerville waltham massachusetts' },
  { name: 'San Francisco Bay Area, CA', also: 'sf bay area oakland berkeley palo alto mountain view menlo park sunnyvale silicon valley california' },
  { name: 'San Jose, CA', also: 'silicon valley santa clara sunnyvale cupertino milpitas california' },
  { name: 'Riverside, CA', also: 'inland empire san bernardino ontario california' },
  { name: 'Detroit, MI', also: 'michigan ann arbor dearborn troy' },
  { name: 'Seattle, WA', also: 'bellevue redmond kirkland tacoma washington' },
  { name: 'Minneapolis, MN', also: 'saint paul st paul twin cities minnesota' },
  { name: 'San Diego, CA', also: 'la jolla california' },
  { name: 'Tampa, FL', also: 'st petersburg clearwater florida' },
  { name: 'Denver, CO', also: 'boulder aurora colorado' },
  { name: 'Baltimore, MD', also: 'maryland columbia' },
  { name: 'St. Louis, MO', also: 'saint louis missouri' },
  { name: 'Orlando, FL', also: 'florida' },
  { name: 'Charlotte, NC', also: 'north carolina' },
  { name: 'San Antonio, TX', also: 'texas' },
  { name: 'Portland, OR', also: 'oregon beaverton hillsboro' },
  { name: 'Sacramento, CA', also: 'california roseville' },
  { name: 'Pittsburgh, PA', also: 'pennsylvania' },
  { name: 'Austin, TX', also: 'round rock texas' },
  { name: 'Las Vegas, NV', also: 'nevada henderson' },
  { name: 'Cincinnati, OH', also: 'ohio' },
  { name: 'Kansas City, MO', also: 'missouri kansas overland park' },
  { name: 'Columbus, OH', also: 'ohio' },
  { name: 'Indianapolis, IN', also: 'indiana carmel' },
  { name: 'Cleveland, OH', also: 'ohio' },
  { name: 'Nashville, TN', also: 'tennessee franklin' },
  { name: 'Virginia Beach, VA', also: 'norfolk hampton roads virginia' },
  { name: 'Providence, RI', also: 'rhode island' },
  { name: 'Jacksonville, FL', also: 'florida' },
  { name: 'Milwaukee, WI', also: 'wisconsin' },
  { name: 'Raleigh–Durham, NC', also: 'raleigh durham chapel hill research triangle rtp cary north carolina' },
  { name: 'Oklahoma City, OK', also: 'oklahoma' },
  { name: 'Memphis, TN', also: 'tennessee' },
  { name: 'Richmond, VA', also: 'virginia' },
  { name: 'Louisville, KY', also: 'kentucky' },
  { name: 'New Orleans, LA', also: 'louisiana' },
  { name: 'Salt Lake City, UT', also: 'utah lehi provo silicon slopes' },
  { name: 'Hartford, CT', also: 'connecticut stamford new haven' },
  { name: 'Buffalo, NY', also: 'new york' },
  { name: 'Birmingham, AL', also: 'alabama' },
  { name: 'Rochester, NY', also: 'new york' },
  { name: 'Grand Rapids, MI', also: 'michigan' },
  { name: 'Tucson, AZ', also: 'arizona' },
  { name: 'Honolulu, HI', also: 'hawaii' },
  { name: 'Tulsa, OK', also: 'oklahoma' },
  { name: 'Omaha, NE', also: 'nebraska' },
  { name: 'Albuquerque, NM', also: 'new mexico' },
  { name: 'Huntsville, AL', also: 'alabama rocket city' },
  { name: 'Boise, ID', also: 'idaho' },
  { name: 'Madison, WI', also: 'wisconsin' },
  { name: 'Des Moines, IA', also: 'iowa' },
  { name: 'Charleston, SC', also: 'south carolina' },
  { name: 'Greenville, SC', also: 'south carolina' },
  { name: 'Knoxville, TN', also: 'tennessee oak ridge' },
  { name: 'Colorado Springs, CO', also: 'colorado' },
  { name: 'Albany, NY', also: 'new york' },
  { name: 'Wichita, KS', also: 'kansas' },
  { name: 'El Paso, TX', also: 'texas' },
  { name: 'Spokane, WA', also: 'washington' },
  { name: 'Anchorage, AK', also: 'alaska' },
  { name: 'Burlington, VT', also: 'vermont' },
  { name: 'Portland, ME', also: 'maine' },
  { name: 'Manchester, NH', also: 'new hampshire' },
  { name: 'Columbia, SC', also: 'south carolina' },
  { name: 'Little Rock, AR', also: 'arkansas bentonville' },
  { name: 'Bentonville, AR', also: 'arkansas walmart northwest arkansas' },
  { name: 'Lincoln, NE', also: 'nebraska' },
  { name: 'Fargo, ND', also: 'north dakota' },
  { name: 'Sioux Falls, SD', also: 'south dakota' },
  { name: 'Cheyenne, WY', also: 'wyoming' },
  { name: 'Billings, MT', also: 'montana bozeman' },
  { name: 'Wilmington, DE', also: 'delaware' },
  { name: 'Charleston, WV', also: 'west virginia' },
  { name: 'Jackson, MS', also: 'mississippi' },

  { name: 'Toronto, Canada', also: 'ontario' },
  { name: 'Vancouver, Canada', also: 'british columbia' },
  { name: 'Montreal, Canada', also: 'quebec' },
  { name: 'London, UK', also: 'england united kingdom' },
  { name: 'Dublin, Ireland', also: '' },
  { name: 'Berlin, Germany', also: '' },
  { name: 'Amsterdam, Netherlands', also: '' },
  { name: 'Paris, France', also: '' },
  { name: 'Bangalore, India', also: 'bengaluru' },
  { name: 'Hyderabad, India', also: '' },
  { name: 'Singapore', also: '' },
  { name: 'Sydney, Australia', also: '' },
  { name: 'Nairobi, Kenya', also: '' },
  { name: 'Lagos, Nigeria', also: '' },
  { name: 'Mexico City, Mexico', also: 'cdmx' },
  { name: 'São Paulo, Brazil', also: 'sao paulo' },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[–—]/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ');

/** Places matching a query, best first: name prefix, then word prefix, then alias. */
export function searchPlaces(query: string, exclude: string[], limit = 8): Place[] {
  const q = norm(query).trim();
  const taken = new Set(exclude.map((e) => e.toLowerCase()));
  const pool = PLACES.filter((p) => !taken.has(p.name.toLowerCase()));
  if (!q) return pool.slice(0, limit);
  const scored: [number, Place][] = [];
  for (const p of pool) {
    const name = norm(p.name);
    const also = norm(p.also ?? '');
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (` ${name}`.includes(` ${q}`)) score = 1;
    else if (` ${also}`.includes(` ${q}`)) score = 2;
    if (score >= 0) scored.push([score, p]);
  }
  scored.sort((a, b) => a[0] - b[0]);
  return scored.slice(0, limit).map(([, p]) => p);
}

/** The stored answers.locations text <-> the picker's list. */
export const LOCATION_SEPARATOR = '; ';
export function splitLocations(s: string | undefined): string[] {
  return (s ?? '')
    .split(/;|\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}
