// Historical 2025 field, after the First Four. No scores or future predictions.
export const REGIONS = ['South', 'West', 'East', 'Midwest'];
export const SEED_ORDER = [1,16,8,9,5,12,4,13,6,11,3,14,7,10,2,15];
const names = {
  South: ['Auburn','Michigan State','Iowa State','Texas A&M','Michigan','Ole Miss','Marquette','Louisville','Creighton','New Mexico','North Carolina','UC San Diego','Yale','Lipscomb','Bryant','Alabama State'],
  West: ['Florida',"St. John’s",'Texas Tech','Maryland','Memphis','Missouri','Kansas','UConn','Oklahoma','Arkansas','Drake','Colorado State','Grand Canyon','UNC Wilmington','Omaha','Norfolk State'],
  East: ['Duke','Alabama','Wisconsin','Arizona','Oregon','BYU',"Saint Mary’s",'Mississippi State','Baylor','Vanderbilt','VCU','Liberty','Akron','Montana','Robert Morris',"Mount St. Mary’s"],
  Midwest: ['Houston','Tennessee','Kentucky','Purdue','Clemson','Illinois','UCLA','Gonzaga','Georgia','Utah State','Xavier','McNeese','High Point','Troy','Wofford','SIU Edwardsville'],
};
export const sampleField = REGIONS.flatMap(region => names[region].map((name, i) => ({id:`${region.toLowerCase()}-${i+1}`, name, region, seed:i+1})));
export const source = 'https://www.ncaa.com/brackets/print/basketball-men/d1/2025';
