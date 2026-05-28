/* Landing page script — no ES modules, no dependencies */

function go() {
  window.location.href = 'pages/app.html';
}

window.go = go;

function initCanvas() {
  const canvas = document.getElementById('logoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 28, H = 28;
  const nodes = [
    {x:14,y:5.25},{x:7,y:8.75},{x:21,y:8.75},
    {x:4.375,y:14.875},{x:14,y:12.25},{x:23.625,y:14.875},
    {x:8.75,y:20.125},{x:19.25,y:20.125},{x:14,y:23.625},
    {x:11.375,y:15.75},{x:16.625,y:15.75},
  ];
  const state = nodes.map(() => ({
    opacity: Math.random(),
    speed:   0.008 + Math.random() * 0.018,
    dir:     Math.random() > 0.5 ? 1 : -1,
    delay:   Math.random() * 120,
  }));
  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;
    state.forEach((s, i) => {
      if (frame < s.delay) return;
      s.opacity += s.speed * s.dir;
      if (s.opacity >= 1) { s.opacity = 1; s.dir = -1; }
      if (s.opacity <= 0) {
        s.opacity = 0; s.dir = 1;
        s.delay = frame + Math.random() * 80;
        s.speed = 0.008 + Math.random() * 0.018;
      }
      const n = nodes[i], r = 1.925;
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
      grd.addColorStop(0, `rgba(83,74,183,${s.opacity * 0.35})`);
      grd.addColorStop(1, `rgba(83,74,183,0)`);
      ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(83,74,183,${s.opacity * 0.85})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

function initMainCategories() {
  const deck = document.querySelector('.lp-main-categories');
  const cards = document.querySelectorAll('.lp-main-category, .lp-cat-line');
  const command = document.getElementById('mainCategoryCommand');
  if (!deck || !cards.length) return;

  function setActive(card, updateCommand = true) {
    cards.forEach(c => c.classList.toggle('active', c === card));
    if (updateCommand && command && card.dataset.command) command.textContent = card.dataset.command;
  }

  deck.addEventListener('mousemove', e => {
    const rect = deck.getBoundingClientRect();
    deck.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    deck.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => setActive(card));
    card.addEventListener('focus', () => setActive(card));
  });

  setActive(document.querySelector('.lp-main-category.active') || cards[0], false);
}

const CAPITAL_LIGHTS = [
  ["AF","Afghanistan","Kabul",34.52,69.18],
  ["AL","Albania","Tirana",41.32,19.82],
  ["DZ","Algeria","Algiers",36.75,3.05],
  ["AD","Andorra","Andorra la Vella",42.5,1.52],
  ["AO","Angola","Luanda",-8.83,13.22],
  ["AG","Antigua and Barbuda","Saint John's",17.12,-61.85],
  ["AR","Argentina","Buenos Aires",-34.58,-58.67],
  ["AM","Armenia","Yerevan",40.17,44.5],
  ["AU","Australia","Canberra",-35.27,149.13],
  ["AT","Austria","Vienna",48.2,16.37],
  ["AZ","Azerbaijan","Baku",40.38,49.87],
  ["BS","Bahamas","Nassau",25.08,-77.35],
  ["BH","Bahrain","Manama",26.23,50.57],
  ["BD","Bangladesh","Dhaka",23.72,90.4],
  ["BB","Barbados","Bridgetown",13.1,-59.62],
  ["BY","Belarus","Minsk",53.9,27.57],
  ["BE","Belgium","Brussels",50.83,4.33],
  ["BZ","Belize","Belmopan",17.25,-88.77],
  ["BJ","Benin","Porto-Novo",6.48,2.62],
  ["BT","Bhutan","Thimphu",27.47,89.63],
  ["BO","Bolivia","Sucre",-19.02,-65.26],
  ["BA","Bosnia and Herzegovina","Sarajevo",43.87,18.42],
  ["BW","Botswana","Gaborone",-24.63,25.9],
  ["BR","Brazil","Brasília",-15.79,-47.88],
  ["BN","Brunei","Bandar Seri Begawan",4.88,114.93],
  ["BG","Bulgaria","Sofia",42.68,23.32],
  ["BF","Burkina Faso","Ouagadougou",12.37,-1.52],
  ["BI","Burundi","Gitega",-3.43,29.93],
  ["KH","Cambodia","Phnom Penh",11.55,104.92],
  ["CM","Cameroon","Yaoundé",3.85,11.5],
  ["CA","Canada","Ottawa",45.42,-75.7],
  ["CV","Cape Verde","Praia",14.92,-23.52],
  ["CF","Central African Republic","Bangui",4.37,18.58],
  ["TD","Chad","N'Djamena",12.1,15.03],
  ["CL","Chile","Santiago",-33.45,-70.67],
  ["CN","China","Beijing",39.92,116.38],
  ["CO","Colombia","Bogotá",4.71,-74.07],
  ["KM","Comoros","Moroni",-11.7,43.23],
  ["CR","Costa Rica","San José",9.93,-84.09],
  ["HR","Croatia","Zagreb",45.8,16],
  ["CU","Cuba","Havana",23.12,-82.35],
  ["CY","Cyprus","Nicosia",35.17,33.37],
  ["CZ","Czechia","Prague",50.08,14.47],
  ["DK","Denmark","Copenhagen",55.67,12.58],
  ["DJ","Djibouti","Djibouti",11.58,43.15],
  ["DM","Dominica","Roseau",15.3,-61.4],
  ["DO","Dominican Republic","Santo Domingo",18.47,-69.9],
  ["CD","DR Congo","Kinshasa",-4.32,15.3],
  ["EC","Ecuador","Quito",-0.22,-78.5],
  ["EG","Egypt","Cairo",30.05,31.25],
  ["SV","El Salvador","San Salvador",13.7,-89.2],
  ["GQ","Equatorial Guinea","Ciudad de la Paz",1.35,10.49],
  ["ER","Eritrea","Asmara",15.33,38.93],
  ["EE","Estonia","Tallinn",59.43,24.72],
  ["SZ","Eswatini","Mbabane",-26.32,31.13],
  ["ET","Ethiopia","Addis Ababa",9.03,38.7],
  ["FJ","Fiji","Suva",-18.13,178.42],
  ["FI","Finland","Helsinki",60.17,24.93],
  ["FR","France","Paris",48.87,2.33],
  ["GA","Gabon","Libreville",0.38,9.45],
  ["GM","Gambia","Banjul",13.45,-16.57],
  ["GE","Georgia","Tbilisi",41.68,44.83],
  ["DE","Germany","Berlin",52.52,13.4],
  ["GH","Ghana","Accra",5.55,-0.22],
  ["GR","Greece","Athens",37.98,23.73],
  ["GD","Grenada","St. George's",32.38,-64.68],
  ["GT","Guatemala","Guatemala City",14.62,-90.52],
  ["GN","Guinea","Conakry",9.5,-13.7],
  ["GW","Guinea-Bissau","Bissau",11.85,-15.58],
  ["GY","Guyana","Georgetown",6.8,-58.15],
  ["HT","Haiti","Port-au-Prince",18.53,-72.33],
  ["HN","Honduras","Tegucigalpa",14.1,-87.22],
  ["HU","Hungary","Budapest",47.5,19.08],
  ["IS","Iceland","Reykjavik",64.15,-21.95],
  ["IN","India","New Delhi",28.6,77.2],
  ["ID","Indonesia","Jakarta",-6.17,106.82],
  ["IR","Iran","Tehran",35.7,51.42],
  ["IQ","Iraq","Baghdad",33.33,44.4],
  ["IE","Ireland","Dublin",53.32,-6.23],
  ["IL","Israel","Jerusalem",31.77,35.23],
  ["IT","Italy","Rome",41.9,12.48],
  ["CI","Ivory Coast","Yamoussoukro",6.82,-5.27],
  ["JM","Jamaica","Kingston",18,-76.79],
  ["JP","Japan","Tokyo",35.68,139.75],
  ["JO","Jordan","Amman",31.95,35.93],
  ["KZ","Kazakhstan","Astana",51.16,71.45],
  ["KE","Kenya","Nairobi",-1.28,36.82],
  ["KI","Kiribati","South Tarawa",1.33,172.98],
  ["XK","Kosovo","Pristina",42.67,21.17],
  ["KW","Kuwait","Kuwait City",29.37,47.97],
  ["KG","Kyrgyzstan","Bishkek",42.87,74.6],
  ["LA","Laos","Vientiane",17.97,102.6],
  ["LV","Latvia","Riga",56.95,24.1],
  ["LB","Lebanon","Beirut",33.87,35.5],
  ["LS","Lesotho","Maseru",-29.32,27.48],
  ["LR","Liberia","Monrovia",6.3,-10.8],
  ["LY","Libya","Tripoli",32.88,13.17],
  ["LI","Liechtenstein","Vaduz",47.13,9.52],
  ["LT","Lithuania","Vilnius",54.68,25.32],
  ["LU","Luxembourg","Luxembourg",49.6,6.12],
  ["MG","Madagascar","Antananarivo",-18.92,47.52],
  ["MW","Malawi","Lilongwe",-13.97,33.78],
  ["MY","Malaysia","Kuala Lumpur",3.17,101.7],
  ["MV","Maldives","Malé",4.17,73.51],
  ["ML","Mali","Bamako",12.65,-8],
  ["MT","Malta","Valletta",35.88,14.5],
  ["MH","Marshall Islands","Majuro",7.1,171.38],
  ["MR","Mauritania","Nouakchott",18.07,-15.97],
  ["MU","Mauritius","Port Louis",-20.15,57.48],
  ["MX","Mexico","Mexico City",19.43,-99.13],
  ["FM","Micronesia","Palikir",6.92,158.15],
  ["MD","Moldova","Chișinău",47.01,28.9],
  ["MC","Monaco","Monaco",43.73,7.42],
  ["MN","Mongolia","Ulan Bator",47.92,106.91],
  ["ME","Montenegro","Podgorica",42.43,19.27],
  ["MA","Morocco","Rabat",34.02,-6.82],
  ["MZ","Mozambique","Maputo",-25.95,32.58],
  ["MM","Myanmar","Naypyidaw",19.76,96.07],
  ["NA","Namibia","Windhoek",-22.57,17.08],
  ["NR","Nauru","Yaren",-0.55,166.92],
  ["NP","Nepal","Kathmandu",27.72,85.32],
  ["NL","Netherlands","Amsterdam",52.35,4.92],
  ["NZ","New Zealand","Wellington",-41.3,174.78],
  ["NI","Nicaragua","Managua",12.13,-86.25],
  ["NE","Niger","Niamey",13.52,2.12],
  ["NG","Nigeria","Abuja",9.08,7.53],
  ["KP","North Korea","Pyongyang",39.02,125.75],
  ["MK","North Macedonia","Skopje",42,21.43],
  ["NO","Norway","Oslo",59.92,10.75],
  ["OM","Oman","Muscat",23.62,58.58],
  ["PK","Pakistan","Islamabad",33.68,73.05],
  ["PW","Palau","Ngerulmud",7.5,134.62],
  ["PA","Panama","Panama City",8.97,-79.53],
  ["PG","Papua New Guinea","Port Moresby",-9.45,147.18],
  ["PY","Paraguay","Asunción",-25.28,-57.57],
  ["PE","Peru","Lima",-12.05,-77.05],
  ["PH","Philippines","Manila",14.6,120.97],
  ["PL","Poland","Warsaw",52.25,21],
  ["PT","Portugal","Lisbon",38.72,-9.13],
  ["QA","Qatar","Doha",25.28,51.53],
  ["CG","Republic of the Congo","Brazzaville",-4.25,15.28],
  ["RO","Romania","Bucharest",44.43,26.1],
  ["RU","Russia","Moscow",55.75,37.6],
  ["RW","Rwanda","Kigali",-1.95,30.05],
  ["KN","Saint Kitts and Nevis","Basseterre",17.3,-62.72],
  ["LC","Saint Lucia","Castries",14,-61],
  ["VC","Saint Vincent and the Grenadines","Kingstown",13.13,-61.22],
  ["WS","Samoa","Apia",-13.82,-171.77],
  ["SM","San Marino","City of San Marino",43.94,12.45],
  ["ST","São Tomé and Príncipe","São Tomé",0.34,6.73],
  ["SA","Saudi Arabia","Riyadh",24.65,46.7],
  ["SN","Senegal","Dakar",14.73,-17.63],
  ["RS","Serbia","Belgrade",44.83,20.5],
  ["SC","Seychelles","Victoria",-4.62,55.45],
  ["SL","Sierra Leone","Freetown",8.48,-13.23],
  ["SG","Singapore","Singapore",1.28,103.85],
  ["SK","Slovakia","Bratislava",48.15,17.12],
  ["SI","Slovenia","Ljubljana",46.05,14.52],
  ["SB","Solomon Islands","Honiara",-9.43,159.95],
  ["SO","Somalia","Mogadishu",2.07,45.33],
  ["ZA","South Africa","Pretoria",-25.7,28.22],
  ["KR","South Korea","Seoul",37.55,126.98],
  ["SS","South Sudan","Juba",4.85,31.62],
  ["ES","Spain","Madrid",40.4,-3.68],
  ["LK","Sri Lanka","Sri Jayawardenepura Kotte",6.89,79.9],
  ["SD","Sudan","Khartoum",15.6,32.53],
  ["SR","Suriname","Paramaribo",5.83,-55.17],
  ["SE","Sweden","Stockholm",59.33,18.05],
  ["CH","Switzerland","Bern",46.92,7.47],
  ["SY","Syria","Damascus",33.5,36.3],
  ["TJ","Tajikistan","Dushanbe",38.55,68.77],
  ["TZ","Tanzania","Dodoma",-6.16,35.75],
  ["TH","Thailand","Bangkok",13.75,100.52],
  ["TL","Timor-Leste","Dili",-8.58,125.6],
  ["TG","Togo","Lomé",6.14,1.21],
  ["TO","Tonga","Nuku'alofa",-21.13,-175.2],
  ["TT","Trinidad and Tobago","Port of Spain",10.65,-61.52],
  ["TN","Tunisia","Tunis",36.8,10.18],
  ["TR","Turkey","Ankara",39.93,32.87],
  ["TM","Turkmenistan","Ashgabat",37.95,58.38],
  ["TV","Tuvalu","Funafuti",-8.52,179.22],
  ["UG","Uganda","Kampala",0.32,32.55],
  ["UA","Ukraine","Kyiv",50.43,30.52],
  ["AE","United Arab Emirates","Abu Dhabi",24.47,54.37],
  ["GB","United Kingdom","London",51.5,-0.08],
  ["US","United States","Washington, D.C.",38.89,-77.05],
  ["UY","Uruguay","Montevideo",-34.85,-56.17],
  ["UZ","Uzbekistan","Tashkent",41.32,69.25],
  ["VU","Vanuatu","Port Vila",-17.73,168.32],
  ["VA","Vatican City","Vatican City",41.9,12.45],
  ["VE","Venezuela","Caracas",10.48,-66.87],
  ["VN","Vietnam","Hanoi",21.03,105.85],
  ["YE","Yemen","Sana'a",15.37,44.19],
  ["ZM","Zambia","Lusaka",-15.42,28.28],
  ["ZW","Zimbabwe","Harare",-17.82,31.03],
];

const GEO_LAYER_DATA = [
  {
    id: 'models',
    label: 'models',
    color: '#a5b4fc',
    items: [
      { name: 'Prithvi', lat: 38.89, lon: -77.05 },
      { name: 'Prithvi-EO-2.0', lat: 38.89, lon: -77.05 },
      { name: 'TerraMind', lat: 46.92, lon: 7.47 },
      { name: 'TerraMind-NYC-Adapters', lat: 40.71, lon: -74.01 },
      { name: 'TerraMind-base-Flood-NYC', lat: 40.71, lon: -74.01 },
      { name: 'TerraMind-HYPERVIEW', lat: 52.23, lon: 21.01 },
      { name: 'TerraMind-Methane', lat: 52.23, lon: 21.01 },
      { name: 'SatMAE', lat: 37.43, lon: -122.17 },
      { name: 'Scale-MAE', lat: 37.87, lon: -122.27 },
      { name: 'SkySense', lat: 39.9, lon: 116.4 },
      { name: 'SkySense++', lat: 39.9, lon: 116.4 },
      { name: 'RingMo-SAM', lat: 39.9, lon: 116.4 },
      { name: 'RingMo-Agent', lat: 39.9, lon: 116.4 },
      { name: 'GeoChat', lat: 24.47, lon: 54.37 },
      { name: 'RemoteCLIP', lat: -35.28, lon: 149.13 },
      { name: 'DOFA', lat: 48.14, lon: 11.58 },
      { name: 'DOFA-CLIP', lat: 48.14, lon: 11.58 },
      { name: 'CROMA', lat: 43.47, lon: -80.54 },
      { name: 'GFM', lat: 28.6, lon: -81.2 },
      { name: 'PANGAEA', lat: 48.86, lon: 2.35 },
      { name: 'AlphaEarth benchmark', lat: 37.43, lon: -122.17 },
      { name: 'Planaura-1.0', lat: 45.42, lon: -75.69 },
      { name: 'FloodSense', lat: 29.76, lon: -95.37 },
      { name: 'Llama3-MS-CLIP-base', lat: 38.89, lon: -77.05 },
      { name: 'sattxt', lat: 45.5, lon: -73.57 },
    ],
  },
  {
    id: 'papers',
    label: 'papers',
    color: '#818cf8',
    items: [
      { name: 'Seasonal Contrast', lat: 45.5, lon: -73.57 },
      { name: 'SSL in Remote Sensing Review', lat: 48.14, lon: 11.58 },
      { name: 'Prithvi paper', lat: 38.89, lon: -77.05 },
      { name: 'GeoChat paper', lat: 24.47, lon: 54.37 },
      { name: 'SatMAE paper', lat: 37.43, lon: -122.17 },
      { name: 'Scale-MAE paper', lat: 37.87, lon: -122.27 },
      { name: 'RemoteCLIP paper', lat: -35.28, lon: 149.13 },
      { name: 'SkySense paper', lat: 39.9, lon: 116.4 },
      { name: 'TerraMind paper', lat: 46.92, lon: 7.47 },
      { name: 'PANGAEA paper', lat: 48.86, lon: 2.35 },
      { name: 'CROMA paper', lat: 43.47, lon: -80.54 },
      { name: 'DOFA paper', lat: 48.14, lon: 11.58 },
      { name: 'RingMo-SAM paper', lat: 39.9, lon: 116.4 },
      { name: 'VRSBench', lat: 24.71, lon: 46.67 },
      { name: 'GFM paper', lat: 28.6, lon: -81.2 },
      { name: 'Generalist Geospatial AI', lat: 38.89, lon: -77.05 },
      { name: 'Harvesting AlphaEarth', lat: 37.43, lon: -122.17 },
      { name: 'Brazilian Atlantic Forest', lat: -23.55, lon: -46.63 },
      { name: 'Slum Detection AlphaEarth', lat: 39.9, lon: 116.4 },
      { name: 'Onboard Satellite Classification', lat: 49.61, lon: 6.13 },
      { name: 'SenPa-MAE', lat: 48.14, lon: 11.58 },
      { name: 'FG-MAE', lat: 48.14, lon: 11.58 },
      { name: 'EarthGPT', lat: 24.59, lon: 112.3 },
      { name: 'UrbanLLaVA', lat: 39.9, lon: 116.4 },
      { name: 'ChatEarthBench', lat: 34.23, lon: 123.47 },
    ],
  },
  {
    id: 'datasets',
    label: 'datasets',
    color: '#c7d2fe',
    items: [
      { name: 'Core-VIIRS-Nighttime-Light', lat: -16, lon: -35 },
      { name: 'GROC', lat: 52.37, lon: 4.9 },
      { name: 'sapnhap-bando-vn', lat: 21.03, lon: 105.85 },
      { name: 'EarthVLSet', lat: 30.59, lon: 114.3 },
      { name: 'Core-AlphaEarth-Embeddings', lat: 18, lon: -62 },
      { name: 'pangaea2-vhr', lat: 18, lon: -14 },
      { name: 'vietnam-real-estates', lat: 10.82, lon: 106.63 },
      { name: 'CropClimateX', lat: 39.83, lon: -98.58 },
      { name: 'GOCE satellite telemetry', lat: 52.22, lon: 4.42 },
      { name: 'EuroSAT', lat: 50.11, lon: 8.68 },
      { name: 'Core-DEM', lat: -18, lon: 32 },
      { name: 'China Building Footprints', lat: 39.9, lon: 116.4 },
      { name: 'COP-GEN-Benchmark', lat: -20, lon: 82 },
      { name: 'SWIFTT bark beetle', lat: 48.2, lon: 16.37 },
      { name: 'Project NOAH Hazard Maps', lat: 14.6, lon: 121.0 },
      { name: 'LUCAS-MEGA', lat: 50.85, lon: 4.35 },
      { name: 'Amazon Sentinel-2 Forest', lat: -3.1, lon: -60.0 },
      { name: 'DOTAv2', lat: 39.9, lon: 116.4 },
      { name: 'alps_eurodem', lat: 46.8, lon: 8.2 },
      { name: 'Africa FAOSTAT Land Cover', lat: -1.29, lon: 36.82 },
      { name: 'Cambodia flood response', lat: 11.56, lon: 104.92 },
      { name: 'UNOSAT Vietnam Cyclone YAGI', lat: 21.03, lon: 105.85 },
      { name: 'Somalia drought response', lat: -8.95, lon: 45.32 },
      { name: 'South Sudan flood locations', lat: 4.85, lon: 31.62 },
      { name: 'Delhi Sentinel-2', lat: 28.61, lon: 77.2 },
    ],
  },
  {
    id: 'companies',
    label: 'companies',
    color: '#6366F1',
    items: [
      { name: 'Abonmarche Consultants', lat: 38.89, lon: -77.05 },
      { name: 'Advanced Drone Solutions', lat: 45.42, lon: -75.69 },
      { name: 'Advanced Infrastructure', lat: 51.5, lon: -0.08 },
      { name: 'adesso SE', lat: 52.52, lon: 13.4 },
      { name: 'Accenture', lat: 52.37, lon: 4.9 },
      { name: 'Agronomeye', lat: -35.28, lon: 149.13 },
      { name: 'Acclimatise', lat: 46.92, lon: 7.47 },
      { name: 'AAM Sky Geospatial Solutions', lat: 28.61, lon: 77.2 },
      { name: 'AG-Carto', lat: 48.86, lon: 2.35 },
      { name: 'Apliter Termografia', lat: 24.47, lon: 54.37 },
      { name: 'Acidhub Consultoria', lat: -15.79, lon: -47.88 },
      { name: 'AAM Group', lat: -41.29, lon: 174.78 },
      { name: 'ACCA software', lat: 41.9, lon: 12.5 },
      { name: 'Advexure', lat: 35.68, lon: 139.76 },
      { name: 'AfriGIS', lat: -25.75, lon: 28.19 },
      { name: 'axmann geoinformation', lat: 48.21, lon: 16.37 },
      { name: 'Abtemas SL', lat: 40.42, lon: -3.7 },
      { name: 'AirForestry', lat: 59.33, lon: 18.07 },
      { name: 'Associacao Florestal EDT', lat: 38.72, lon: -9.14 },
      { name: 'Ayesa Advanced Technologies', lat: 4.71, lon: -74.07 },
      { name: 'AiDash', lat: 19.43, lon: -99.13 },
      { name: 'Abdulrahman Jazzar Engineering', lat: 24.71, lon: 46.67 },
      { name: 'Arbigtec Technology', lat: 39.9, lon: 116.4 },
      { name: 'AGS', lat: 1.35, lon: 103.82 },
      { name: 'Agizo Africa Ltd', lat: -1.29, lon: 36.82 },
    ],
  },
];

const GEO_MARKER_OFFSETS = [
  [0, 0],
  [0, -34],
  [0, 34],
  [76, 0],
  [-76, 0],
  [76, -34],
  [-76, 34],
  [76, 34],
  [-76, -34],
  [0, -68],
  [0, 68],
  [152, 0],
  [-152, 0],
  [152, -34],
  [-152, 34],
  [152, 34],
  [-152, -34],
  [76, -68],
  [-76, 68],
  [76, 68],
  [-76, -68],
];

function initGeoLayerMap() {
  const mount = document.getElementById('lpGeoLayerMap');
  if (!mount || mount.dataset.ready === 'true') return;
  mount.dataset.ready = 'true';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const indexItems = Array.from(document.querySelectorAll('.lp-hero-index [data-layer]'));
  const mobileMedia = window.matchMedia('(max-width: 860px)');
  if (mobileMedia.matches) {
    indexItems.forEach(item => item.classList.toggle('is-active', item.dataset.layer === 'models'));
    return;
  }
  const layerDuration = 5000;
  let activeLayer = 0;
  let markers = [];
  let timer = null;

  function mapDrawRect(rect) {
    const sourceRatio = 2;
    const isMobile = window.matchMedia('(max-width: 860px)').matches;
    const yShift = rect.height * (isMobile ? 0.09 : 0.07);
    if (isMobile) {
      const drawHeight = rect.height * 0.86;
      const drawWidth = drawHeight * sourceRatio;
      return {
        x: (rect.width - drawWidth) / 2,
        y: (rect.height - drawHeight) / 2 + yShift,
        width: drawWidth,
        height: drawHeight,
      };
    }

    const rectRatio = rect.width / Math.max(rect.height, 1);
    if (rectRatio > sourceRatio) {
      const drawWidth = rect.width;
      const drawHeight = drawWidth / sourceRatio;
      return { x: 0, y: (rect.height - drawHeight) / 2 + yShift, width: drawWidth, height: drawHeight };
    }

    const drawHeight = rect.height;
    const drawWidth = drawHeight * sourceRatio;
    return { x: (rect.width - drawWidth) / 2, y: yShift, width: drawWidth, height: drawHeight };
  }

  function project(marker, draw) {
    return {
      x: draw.x + ((marker.lon + 180) / 360) * draw.width,
      y: draw.y + ((90 - marker.lat) / 180) * draw.height,
    };
  }

  function clearMarkers() {
    markers.forEach(marker => marker.el.remove());
    markers = [];
  }

  function setMarkerPlacement(marker, p, rect, index) {
    marker.el.style.setProperty('--x', `${p.x}px`);
    marker.el.style.setProperty('--y', `${p.y}px`);
    marker.el.classList.toggle('is-left', p.x > rect.width * 0.68);
    marker.el.classList.toggle('is-below', p.y < rect.height * 0.28);
    marker.el.classList.toggle('is-above', p.y > rect.height * 0.72);
    marker.el.classList.toggle('is-pinched', index % 4 === 0);
  }

  function estimateLabel(entry, isMobile) {
    const maxWidth = entry.marker.el.closest('[data-layer="companies"]') ? 178 : 168;
    const width = Math.min(isMobile ? 86 : maxWidth, Math.max(isMobile ? 54 : 70, entry.marker.name.length * (isMobile ? 5.1 : 6.3) + 20));
    return { width, height: isMobile ? 17 : 21 };
  }

  function labelBox(entry, p, rect, isMobile) {
    const { width, height } = entry.metrics || estimateLabel(entry, isMobile);
    let left = p.x + 10;
    let top = p.y - height / 2;

    if (p.x > rect.width * 0.68) {
      left = p.x - 10 - width;
    } else if (p.y < rect.height * 0.28) {
      left = p.x - width / 2;
      top = p.y + 10;
    } else if (p.y > rect.height * 0.72) {
      left = p.x - width / 2;
      top = p.y - height - 10;
    }

    return { left, right: left + width, top, bottom: top + height, width, height };
  }

  function boxesOverlap(a, b) {
    const gap = 5;
    return a.left < b.right + gap && a.right + gap > b.left && a.top < b.bottom + gap && a.bottom + gap > b.top;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function keepLabelInBounds(entry, rect, isMobile, xMin, xMax, yMin, yMax) {
    let box = labelBox(entry, entry.p, rect, isMobile);
    if (box.left < 6) entry.p.x = clamp(entry.p.x + (6 - box.left), xMin, xMax);
    if (box.right > rect.width - 6) entry.p.x = clamp(entry.p.x - (box.right - rect.width + 6), xMin, xMax);
    if (box.top < 6) entry.p.y = clamp(entry.p.y + (6 - box.top), yMin, yMax);
    if (box.bottom > rect.height - 6) entry.p.y = clamp(entry.p.y - (box.bottom - rect.height + 6), yMin, yMax);
    entry.box = labelBox(entry, entry.p, rect, isMobile);
  }

  function resolveLabelCollisions(entries, rect, isMobile, mobileClamp) {
    const xMin = mobileClamp;
    const xMax = rect.width - mobileClamp;
    const yMin = 24;
    const yMax = rect.height - 46;

    entries.forEach(entry => {
      entry.metrics = estimateLabel(entry, isMobile);
      keepLabelInBounds(entry, rect, isMobile, xMin, xMax, yMin, yMax);
    });

    for (let pass = 0; pass < 16; pass += 1) {
      let moved = false;
      for (let i = 0; i < entries.length; i += 1) {
        for (let j = i + 1; j < entries.length; j += 1) {
          const a = entries[i];
          const b = entries[j];
          if (!boxesOverlap(a.box, b.box)) continue;

          const yDirection = b.p.y >= a.p.y ? 1 : -1;
          const xDirection = b.p.x >= a.p.x ? 1 : -1;
          const yPush = isMobile ? 18 : 24;
          const xPush = isMobile ? 16 : 24;
          b.p.y = clamp(b.p.y + yPush * yDirection, yMin, yMax);
          b.p.x = clamp(b.p.x + xPush * xDirection, xMin, xMax);
          keepLabelInBounds(b, rect, isMobile, xMin, xMax, yMin, yMax);
          moved = true;
        }
      }
      if (!moved) break;
    }
  }

  function positionMarkers() {
    const rect = mount.getBoundingClientRect();
    const draw = mapDrawRect(rect);
    const isMobile = window.matchMedia('(max-width: 860px)').matches;
    const mobileClamp = isMobile ? Math.min(132, rect.width * 0.24) : 0;
    const projected = markers.map((marker, index) => {
      const p = project(marker, draw);
      return { marker, index, p };
    });
    const groups = new Map();

    projected.forEach(entry => {
      const key = `${Math.round(entry.p.x / 84)}:${Math.round(entry.p.y / 42)}`;
      const group = groups.get(key) || [];
      entry.clusterIndex = group.length;
      group.push(entry);
      groups.set(key, group);
    });

    projected.forEach(entry => {
      const offset = GEO_MARKER_OFFSETS[entry.clusterIndex % GEO_MARKER_OFFSETS.length];
      const scale = isMobile ? 0.62 : 1;
      entry.p = {
        x: Math.min(Math.max(entry.p.x + offset[0] * scale, mobileClamp), rect.width - mobileClamp),
        y: Math.min(Math.max(entry.p.y + offset[1] * scale, 28), rect.height - 42),
      };
    });

    if (isMobile) {
      const lanes = [[], []];
      [...projected]
        .sort((a, b) => a.p.y - b.p.y || a.p.x - b.p.x)
        .forEach((entry, index) => lanes[index % 2].push(entry));
      lanes.forEach((lane, laneIndex) => {
        lane.sort((a, b) => a.p.y - b.p.y || a.p.x - b.p.x);
        const yStart = rect.height * 0.17;
        const yEnd = rect.height * 0.79;
        const step = lane.length > 1 ? (yEnd - yStart) / (lane.length - 1) : 0;
        const viewportLeft = laneIndex === 0 ? 190 : 292;
        const xAnchor = laneIndex === 1
          ? viewportLeft + 86 + 10 - rect.left
          : viewportLeft - rect.left - 10;
        lane.forEach((entry, index) => {
          entry.p.x = clamp(xAnchor, mobileClamp, rect.width - mobileClamp);
          entry.p.y = clamp(yStart + step * index, 24, rect.height - 46);
        });
      });
      projected.forEach(entry => setMarkerPlacement(entry.marker, entry.p, rect, entry.index));
      return;
    }

    resolveLabelCollisions(projected, rect, isMobile, mobileClamp);
    projected.forEach(entry => setMarkerPlacement(entry.marker, entry.p, rect, entry.index));
  }

  function updateIndex(layer) {
    indexItems.forEach(item => {
      item.classList.toggle('is-active', item.dataset.layer === layer.id);
    });
  }

  function renderLayer(index) {
    activeLayer = (index + GEO_LAYER_DATA.length) % GEO_LAYER_DATA.length;
    const layer = GEO_LAYER_DATA[activeLayer];
    mount.dataset.layer = layer.id;
    mount.style.setProperty('--layer-color', layer.color);
    clearMarkers();

    const seenLoc = new Set();
    const visibleItems = layer.items.filter(item => {
      const key = `${item.lat.toFixed(2)},${item.lon.toFixed(2)}`;
      if (seenLoc.has(key)) return false;
      seenLoc.add(key);
      return true;
    }).slice(0, 6);

    visibleItems.forEach(item => {
      const marker = document.createElement('span');
      marker.className = 'lp-geo-marker';

      const pin = document.createElement('span');
      pin.className = 'lp-geo-pin';

      const name = document.createElement('span');
      name.className = 'lp-geo-name';
      name.textContent = item.name;

      marker.append(pin, name);
      mount.appendChild(marker);
      markers.push({ ...item, el: marker });
    });

    positionMarkers();
    updateIndex(layer);
    mount.classList.add('is-ready');
    window.requestAnimationFrame(() => {
      markers.forEach((marker, markerIndex) => {
        window.setTimeout(() => marker.el.classList.add('is-visible'), markerIndex * 18);
      });
    });
  }

  function nextLayer() {
    renderLayer(activeLayer + 1);
  }

  function start() {
    if (reduceMotion || timer) return;
    timer = window.setInterval(nextLayer, layerDuration);
  }

  function stop() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = null;
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(positionMarkers, 120);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  renderLayer(0);
  start();
}

/* ── Radial infographic ───────────────────── */
function initRadial() {
  const wrap = document.getElementById('lp-radial-wrap');
  if (!wrap) return;

  const W = 800, H = 800, cx = 400, cy = 400;
  const R  = 270;
  const NR = 38;
  const N  = 13;

  const LAYERS = [
    {num:'01', name:'Earth Data',           desc:'sensors, formats, catalogs',
     detail:'Raw material for every geo model. Covers sensor types (optical, SAR, LiDAR), cloud-native formats (COG, GeoParquet, Zarr), spatial indexing (H3, S2), and embedding products like Clay and GeoCLIP.'},
    {num:'02', name:'Learning Paradigms',   desc:'supervised, self-supervised',
     detail:'How a model learns from data. Supervised needs labels; self-supervised does not. Also covers few-shot, active learning, and reinforcement learning — the most consequential design decision in any pipeline.'},
    {num:'03', name:'AI History',           desc:'1990s to today',
     detail:'The arc from classical ML through CNNs and Transformers to foundation models and agentic AI. Understanding the timeline shows why each new model is foundational or incremental.'},
    {num:'04', name:'Model Architectures',  desc:'CNNs, ViTs, foundation',
     detail:'Three paradigms: statistical (kriging, Gaussian processes), AI/ML (from random forests through ViTs and foundation models), and physics-based (radiative transfer, hydrology). Most production systems combine all three.'},
    {num:'05', name:'Techniques',           desc:'attention, quantization',
     detail:'Methods that make models work — training strategies, fine-tuning, multimodal fusion, quantization for edge deployment, and evaluation metrics specific to geospatial tasks.'},
    {num:'06', name:'Tasks / Applications', desc:'segmentation, detection',
     detail:'The full Geo AGI task spectrum: pixel-level segmentation, object detection, scene understanding, geolocalization, 3D reconstruction, temporal change detection, and generative synthesis.'},
    {num:'07', name:'Datasets',             desc:'optical, SAR, lidar',
     detail:'Training data and benchmarks the field has standardised around — EO datasets from Sentinel and Landsat, DOTA and xView for detection, change detection suites, VLM evaluation sets, and major competitions.'},
    {num:'08', name:'Tools & Stack',        desc:'compute, deployment',
     detail:'Infrastructure for running geospatial AI — compute platforms, Python and R libraries, MLOps tooling, model deployment frameworks, spatial databases, vector stores, and GIS visualisation tools.'},
    {num:'09', name:'Sensors & Satellites', desc:'optical, SAR, weather',
     detail:'Orbital infrastructure feeding geospatial AI — free open missions (Sentinel, Landsat), commercial high-res optical and SAR constellations, hyperspectral, and weather satellites.'},
    {num:'10', name:'Companies',            desc:'startups, providers',
     detail:'The geospatial AI ecosystem — satellite data providers, drone manufacturers, cloud and compute platforms, GeoAI startups, and the open source community (6,500+ organisations tracked).'},
    {num:'11', name:'Standards',            desc:'OGC, STAC, COG',
     detail:'Interoperability layer — cloud-native formats (COG, STAC, GeoParquet), OGC service protocols (WMS/WFS/OGC API), metadata schemas (ISO 19115, INSPIRE), and coordinate reference systems.'},
    {num:'12', name:'Learning Path',        desc:'courses, books, podcasts',
     detail:'A curated path from first principles to research-level mastery — structured courses and MOOCs, essential books, hands-on tutorials, competitions to test your skills, and communities where the work happens.'},
    {num:'13', name:'Job Board',            desc:'full-time, remote, research',
     detail:'Open roles across the geospatial AI industry — full-time positions, contracts, internships, and research roles at satellite companies, GeoAI startups, cloud platforms, and research institutions.'},
  ];

  /* Tech-AI palette — cool indigo/blue/cyan family, no warm tones */
  const COLORS = [
    '#6366F1','#7C6AF7','#8B5CF6','#7C3AED',
    '#5B21B6','#4F46E5','#4338CA','#3B82F6',
    '#2563EB','#0EA5E9','#06B6D4','#0891B2','#818CF8',
  ];

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  /* Defs */
  const defs = document.createElementNS(ns, 'defs');

  /* Glow filter */
  const filt = document.createElementNS(ns, 'filter');
  filt.setAttribute('id', 'glow');
  filt.setAttribute('x', '-50%'); filt.setAttribute('y', '-50%');
  filt.setAttribute('width', '200%'); filt.setAttribute('height', '200%');
  const feBlur = document.createElementNS(ns, 'feGaussianBlur');
  feBlur.setAttribute('stdDeviation', '6'); feBlur.setAttribute('result', 'blur');
  const feMerge = document.createElementNS(ns, 'feMerge');
  const feMergeNode1 = document.createElementNS(ns, 'feMergeNode');
  feMergeNode1.setAttribute('in', 'blur');
  const feMergeNode2 = document.createElementNS(ns, 'feMergeNode');
  feMergeNode2.setAttribute('in', 'SourceGraphic');
  feMerge.appendChild(feMergeNode1); feMerge.appendChild(feMergeNode2);
  filt.appendChild(feBlur); filt.appendChild(feMerge);
  defs.appendChild(filt);

  LAYERS.forEach((_, i) => {
    const col = COLORS[i];
    const rg = document.createElementNS(ns, 'radialGradient');
    rg.setAttribute('id', `ng${i}`);
    rg.setAttribute('cx', '40%'); rg.setAttribute('cy', '35%'); rg.setAttribute('r', '65%');
    const r0 = document.createElementNS(ns, 'stop');
    r0.setAttribute('offset', '0%'); r0.setAttribute('stop-color', col); r0.setAttribute('stop-opacity', '0.55');
    const r1 = document.createElementNS(ns, 'stop');
    r1.setAttribute('offset', '100%'); r1.setAttribute('stop-color', col); r1.setAttribute('stop-opacity', '0.15');
    rg.appendChild(r0); rg.appendChild(r1);
    defs.appendChild(rg);
  });
  svg.appendChild(defs);

  /* Orbit ring — base dashes, slow rotation applied in tick */
  const ring = document.createElementNS(ns, 'circle');
  ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); ring.setAttribute('r', R);
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', 'rgba(255,255,255,0.07)');
  ring.setAttribute('stroke-width', '1');
  ring.setAttribute('stroke-dasharray', '3 8');
  svg.appendChild(ring);

  const C_RING = 2 * Math.PI * R;

  /* Single traveling dash on the ring — slightly inside so it clears the node circles */
  const DASH_R   = R - 14;             /* inside the node circles */
  const C_DASH   = 2 * Math.PI * DASH_R;
  const DASH_LEN = C_DASH / N * 0.45; /* short bright dash */

  const traveler = document.createElementNS(ns, 'circle');
  traveler.setAttribute('cx', cx); traveler.setAttribute('cy', cy); traveler.setAttribute('r', DASH_R);
  traveler.setAttribute('fill', 'none');
  traveler.setAttribute('stroke-width', '2.5');
  traveler.setAttribute('stroke-linecap', 'round');
  traveler.setAttribute('stroke-dasharray', `${DASH_LEN} ${C_DASH - DASH_LEN}`);
  traveler.setAttribute('stroke-dashoffset', '0');
  svg.appendChild(traveler);

  /* Center info panel */
  const infoG = document.createElementNS(ns, 'g');
  infoG.setAttribute('pointer-events', 'none');

  const infoNum = document.createElementNS(ns, 'text');
  infoNum.setAttribute('x', cx); infoNum.setAttribute('y', cy - 52);
  infoNum.setAttribute('text-anchor', 'middle');
  infoNum.setAttribute('font-size', '10'); infoNum.setAttribute('font-weight', '700');
  infoNum.setAttribute('font-family', "'SF Mono','Menlo',monospace");
  infoNum.setAttribute('letter-spacing', '0.1em');

  const infoName = document.createElementNS(ns, 'text');
  infoName.setAttribute('x', cx); infoName.setAttribute('y', cy - 30);
  infoName.setAttribute('text-anchor', 'middle');
  infoName.setAttribute('font-size', '16'); infoName.setAttribute('font-weight', '800');
  infoName.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
  infoName.setAttribute('fill', 'rgba(255,255,255,0.92)');

  const infoDesc = document.createElementNS(ns, 'text');
  infoDesc.setAttribute('x', cx); infoDesc.setAttribute('y', cy - 10);
  infoDesc.setAttribute('text-anchor', 'middle');
  infoDesc.setAttribute('font-size', '10'); infoDesc.setAttribute('font-weight', '500');
  infoDesc.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
  infoDesc.setAttribute('fill', 'rgba(255,255,255,0.4)');
  infoDesc.setAttribute('letter-spacing', '0.04em');

  /* Wrap detail text into multiple tspan lines */
  function setDetail(el, text, x, startY, maxW, lineH) {
    while (el.firstChild) el.removeChild(el.firstChild);
    const words = text.split(' ');
    let line = '', lineNum = 0;
    const dummy = document.createElementNS(ns, 'text');
    dummy.setAttribute('font-size', '10');
    dummy.style.visibility = 'hidden';
    svg.appendChild(dummy);
    words.forEach((w, wi) => {
      const test = line ? line + ' ' + w : w;
      dummy.textContent = test;
      if (dummy.getComputedTextLength && dummy.getComputedTextLength() > maxW && line) {
        const ts = document.createElementNS(ns, 'tspan');
        ts.setAttribute('x', x); ts.setAttribute('dy', lineNum === 0 ? 0 : lineH);
        ts.textContent = line;
        el.appendChild(ts);
        line = w; lineNum++;
      } else { line = test; }
      if (wi === words.length - 1) {
        const ts = document.createElementNS(ns, 'tspan');
        ts.setAttribute('x', x); ts.setAttribute('dy', lineNum === 0 ? 0 : lineH);
        ts.textContent = line;
        el.appendChild(ts);
      }
    });
    svg.removeChild(dummy);
  }

  const infoDetail = document.createElementNS(ns, 'text');
  infoDetail.setAttribute('x', cx); infoDetail.setAttribute('y', cy + 14);
  infoDetail.setAttribute('text-anchor', 'middle');
  infoDetail.setAttribute('font-size', '10');
  infoDetail.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
  infoDetail.setAttribute('fill', 'rgba(255,255,255,0.28)');

  infoG.appendChild(infoNum);
  infoG.appendChild(infoName);
  infoG.appendChild(infoDesc);
  infoG.appendChild(infoDetail);
  svg.appendChild(infoG);

  /* Build nodes */
  const glowCircles = [], mainCircles = [], nodeGroups = [], labelGroups = [];
  const nodeAngles = [];

  LAYERS.forEach((layer, i) => {
    const a = -Math.PI / 2 + i * (2 * Math.PI / N);
    nodeAngles.push(a);
    const ca = Math.cos(a), sa = Math.sin(a);
    const nx = cx + R * ca, ny = cy + R * sa;

    /* Glow ring (behind) */
    const gl = document.createElementNS(ns, 'circle');
    gl.setAttribute('cx', nx); gl.setAttribute('cy', ny); gl.setAttribute('r', NR);
    gl.setAttribute('fill', 'none');
    gl.setAttribute('stroke', COLORS[i]); gl.setAttribute('stroke-width', '0');
    gl.setAttribute('stroke-opacity', '0');
    gl.setAttribute('filter', 'url(#glow)');
    svg.appendChild(gl);
    glowCircles.push(gl);

    const g = document.createElementNS(ns, 'g');
    g.style.cursor = 'default';

    const circ = document.createElementNS(ns, 'circle');
    circ.setAttribute('cx', nx); circ.setAttribute('cy', ny); circ.setAttribute('r', NR);
    circ.setAttribute('fill', 'rgba(255,255,255,0.04)');
    circ.setAttribute('stroke', 'rgba(255,255,255,0.15)'); circ.setAttribute('stroke-opacity', '1'); circ.setAttribute('stroke-width', '1');
    g.appendChild(circ);
    mainCircles.push(circ);

    const num = document.createElementNS(ns, 'text');
    num.setAttribute('x', nx); num.setAttribute('y', ny - 5);
    num.setAttribute('text-anchor', 'middle'); num.setAttribute('fill', 'rgba(255,255,255,0.3)');
    num.setAttribute('font-size', '9'); num.setAttribute('font-weight', '700');
    num.setAttribute('font-family', "'SF Mono','Menlo',monospace");
    num.setAttribute('letter-spacing', '0.06em');
    num.textContent = layer.num;
    g.appendChild(num);

    const nm = document.createElementNS(ns, 'text');
    nm.setAttribute('x', nx); nm.setAttribute('y', ny + 8);
    nm.setAttribute('text-anchor', 'middle'); nm.setAttribute('fill', 'rgba(255,255,255,0.25)');
    nm.setAttribute('font-size', '8.5'); nm.setAttribute('font-weight', '600');
    nm.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
    nm.textContent = layer.name.split(' ')[0];
    g.appendChild(nm);

    svg.appendChild(g);
    nodeGroups.push(g);

    /* External label */
    const LABEL_GAP = NR + 14;
    const lx = nx + LABEL_GAP * ca, ly = ny + LABEL_GAP * sa;
    const anchor = ca > 0.2 ? 'start' : ca < -0.2 ? 'end' : 'middle';

    const lg = document.createElementNS(ns, 'g');
    lg.style.cursor = 'default';

    const ln = document.createElementNS(ns, 'text');
    ln.setAttribute('x', lx); ln.setAttribute('y', ly);
    ln.setAttribute('text-anchor', anchor); ln.setAttribute('fill', 'rgba(255,255,255,0.22)');
    ln.setAttribute('font-size', '11'); ln.setAttribute('font-weight', '700');
    ln.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
    ln.textContent = layer.name;
    lg.appendChild(ln);

    const ld = document.createElementNS(ns, 'text');
    ld.setAttribute('x', lx); ld.setAttribute('y', ly + 14);
    ld.setAttribute('text-anchor', anchor); ld.setAttribute('fill', 'rgba(255,255,255,0.1)');
    ld.setAttribute('font-size', '9'); ld.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
    ld.textContent = layer.desc;
    lg.appendChild(ld);

    svg.appendChild(lg);
    labelGroups.push(lg);
  });


  wrap.appendChild(svg);

  /* ── Store original text positions after DOM is attached ── */
  nodeGroups.forEach((g, i) => {
    g.querySelectorAll('text').forEach(t => {
      t._ox = parseFloat(t.getAttribute('x'));
      t._oy = parseFloat(t.getAttribute('y'));
    });
  });

  /* ── Animation state ── */
  const CYCLE = 3000;
  const GROW  = 12;
  const SHIFT = 7;
  let activeIdx  = 0;
  let animStart  = performance.now();
  let paused     = false;
  let pausedAt   = 0;
  let hoveredIdx = -1;
  let ringRot    = 0;
  let dashFrac   = 0;       /* 0..1 traveler position around ring */
  let infoOpacity = 1;
  let fadingOut = false;
  let pendingIdx = -1;

  /* ease curves */
  function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  function updateInfo(i) {
    const layer = LAYERS[i];
    const col = COLORS[i];
    infoNum.textContent = layer.num;
    infoNum.setAttribute('fill', col);
    infoName.textContent = layer.name;
    infoDesc.textContent = layer.desc.toUpperCase();
    setDetail(infoDetail, layer.detail, cx, cy + 14, 190, 15);
    infoG.setAttribute('opacity', '1');
    infoOpacity = 1;
  }

  function jumpTo(i) {
    activeIdx = i;
    dashFrac  = i / N;
    animStart = performance.now();
    updateInfo(i);
  }

  /* Hover interaction */
  nodeGroups.forEach((g, i) => {
    g.addEventListener('mouseenter', () => {
      hoveredIdx = i;
      paused = true;
      jumpTo(i);
    });
    g.addEventListener('mouseleave', () => {
      hoveredIdx = -1;
      paused = false;
      animStart = performance.now() - activeIdx * CYCLE; /* resume from current node */
    });
  });

  updateInfo(0);

  function tick(ts) {
    requestAnimationFrame(tick);

    const elapsed = paused ? pausedAt : ts - animStart;
    if (!paused) pausedAt = elapsed;
    const phase = (elapsed % CYCLE) / CYCLE;

    /* ── Orbit ring slow rotation ── */
    ringRot += 0.012;
    ring.setAttribute('transform', `rotate(${ringRot} ${cx} ${cy})`);

    /* ── Traveling dash: moves continuously, triggers active node when it arrives ── */
    if (!paused) {
      /* advance dashFrac toward next node at steady pace */
      const target = (activeIdx / N);
      let diff = target - dashFrac;
      if (diff < 0) diff += 1;
      /* if very close, snap and move on */
      dashFrac += Math.max(diff * 0.04, 0.0008);
      if (dashFrac >= 1) dashFrac -= 1;
    }

    /* which node is dashFrac closest to? */
    const nearestIdx = Math.round(dashFrac * N) % N;
    const col = COLORS[activeIdx];

    /* SVG stroke starts at 3 o'clock; nodes start at 12 o'clock (−C_DASH/4) */
    const dashPos = dashFrac * C_DASH - C_DASH / 4;
    const dashOffset = -((dashPos % C_DASH + C_DASH) % C_DASH);
    traveler.setAttribute('stroke-dashoffset', dashOffset);
    traveler.setAttribute('stroke', col);

    /* activate node when traveler arrives within one slot */
    const slotFrac = 1 / N;
    const targetFrac = activeIdx / N;
    let arrivalDiff = dashFrac - targetFrac;
    if (arrivalDiff > 0.5) arrivalDiff -= 1;
    if (arrivalDiff < -0.5) arrivalDiff += 1;
    if (Math.abs(arrivalDiff) < slotFrac * 0.15 && !paused) {
      const nextIdx = (activeIdx + 1) % N;
      if (nearestIdx === nextIdx) {
        activeIdx = nextIdx;
        updateInfo(activeIdx);
      }
    }

    /* animate each node */
    mainCircles.forEach((c, i) => {
      const a  = nodeAngles[i];
      const ca = Math.cos(a), sa = Math.sin(a);
      const nx = cx + R * ca, ny = cy + R * sa;

      const isActive = i === activeIdx;
      const col = COLORS[i];
      const p = isActive ? easeInOut(phase < 0.5 ? phase * 2 : (1 - phase) * 2) : 0;
      const grow  = GROW * p;
      const shift = SHIFT * p;
      const dx = ca * shift, dy = sa * shift;

      c.setAttribute('r', NR + grow);
      c.setAttribute('cx', nx + dx); c.setAttribute('cy', ny + dy);

      if (isActive) {
        c.setAttribute('fill', `url(#ng${i})`);
        c.setAttribute('stroke', col);
        c.setAttribute('stroke-opacity', 0.5 + 0.45 * p);
        c.setAttribute('stroke-width', 1 + 2.5 * p);
        /* number text */
        nodeGroups[i].querySelector('text').setAttribute('fill', col);
        /* name text */
        nodeGroups[i].querySelectorAll('text')[1].setAttribute('fill', 'rgba(255,255,255,0.9)');
        /* external label */
        labelGroups[i].querySelectorAll('text')[0].setAttribute('fill', 'rgba(255,255,255,0.9)');
        labelGroups[i].querySelectorAll('text')[1].setAttribute('fill', 'rgba(255,255,255,0.45)');
      } else {
        c.setAttribute('fill', 'rgba(255,255,255,0.04)');
        c.setAttribute('stroke', 'rgba(255,255,255,0.15)');
        c.setAttribute('stroke-opacity', '1');
        c.setAttribute('stroke-width', '1');
        nodeGroups[i].querySelector('text').setAttribute('fill', 'rgba(255,255,255,0.3)');
        nodeGroups[i].querySelectorAll('text')[1].setAttribute('fill', 'rgba(255,255,255,0.25)');
        labelGroups[i].querySelectorAll('text')[0].setAttribute('fill', 'rgba(255,255,255,0.22)');
        labelGroups[i].querySelectorAll('text')[1].setAttribute('fill', 'rgba(255,255,255,0.1)');
      }

      glowCircles[i].setAttribute('cx', nx + dx); glowCircles[i].setAttribute('cy', ny + dy);
      glowCircles[i].setAttribute('stroke', col);
      glowCircles[i].setAttribute('stroke-width',   isActive ? 22 * p : 0);
      glowCircles[i].setAttribute('stroke-opacity', isActive ? 0.3 * p : 0);

      /* shift text with node */
      nodeGroups[i].querySelectorAll('text').forEach(t => {
        if (t._ox !== undefined) {
          t.setAttribute('x', t._ox + dx);
          t.setAttribute('y', t._oy + dy);
        }
      });
    });
  }

  requestAnimationFrame(tick);
}

/* ── Feature panel switcher ──────────────────── */
function initFeatSwitcher() {
  const rows   = document.querySelectorAll('.lp-feat2');
  const vizs   = document.querySelectorAll('.lp-viz');
  if (!rows.length || !vizs.length) return;
  let current  = 0;
  let autoTimer = null;
  const DURATIONS = [5000, 5000, 0, 0, 0, 0]; /* CLI, Ask, Search, and Python are sequence driven */
  const started  = {};

  function advance() {
    switchTo((current + 1) % rows.length);
    scheduleNext();
  }

  function scheduleNext() {
    clearTimeout(autoTimer);
    if (DURATIONS[current] === 0) return;
    autoTimer = setTimeout(advance, DURATIONS[current]);
  }

  function switchTo(idx) {
    rows.forEach(r  => r.classList.toggle('active', +r.dataset.feat === idx));
    vizs.forEach(v  => v.classList.toggle('active', +v.dataset.viz  === idx));
    current = idx;
    if (idx === 0 && !started[idx]) {
      started[idx] = true;
      initMapTree();
    } else if (idx === 1 && !started[idx]) {
      started[idx] = true;
      initGraphCloud();
    } else if (idx === 2) {
      initDemoTerm(advance);
    } else if (idx === 3) {
      initAskGeoMind(advance);
    } else if (idx === 4) {
      initSearchViz(advance);
    } else if (idx === 5) {
      initPythonApi(advance);
    }
  }

  rows.forEach(r => {
    r.addEventListener('click', () => {
      switchTo(+r.dataset.feat);
      scheduleNext();
    });
  });

  switchTo(0);
  scheduleNext();
}

function initGraphCloud(canvasId = 'lpGraphCanvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas || canvas.dataset.ready === 'true') return;
  canvas.dataset.ready = 'true';

  const ctx = canvas.getContext('2d');
  const isHeroGraph = canvasId === 'lpHeroGraphCanvas';
  const topicEl = document.getElementById('lpGraphTopic');
  const topicMetaEl = document.getElementById('lpGraphTopicMeta');
  const heroAnchors = [
    { label: 'Prithvi', x: -0.5, y: -0.24, z: 0.68 },
    { label: 'SAR', x: 0.16, y: -0.3, z: 0.72 },
    { label: 'Sentinel-2', x: -0.12, y: -0.02, z: 0.76 },
    { label: 'BigEarthNet', x: 0.46, y: 0.04, z: 0.62 },
    { label: 'flood-mask', x: -0.38, y: 0.3, z: 0.66 },
    { label: 'Scale-MAE', x: 0.24, y: 0.34, z: 0.68 },
  ];
  const words = [
    'GeoAI','SAR','Sentinel-1','Landsat','Prithvi','Clay','SAM','TerraMind','xView','DOTA',
    'change detection','building detection','segmentation','flood mapping','wildfire','LiDAR',
    'hyperspectral','STAC','COG','GeoParquet','H3','S2','transformers','ViT','CNN','U-Net',
    'YOLO','LoRA','RAG','agents','foundation models','remote sensing','weather','urban',
    'agriculture','deforestation','roads','ships','cloud mask','embeddings','reranking',
    'vector search','Kaggle','Hugging Face','papers','code','benchmarks','companies','jobs',
    'learning path','tutorials','MLOps','deployment','edge AI','spatial index','OGC','datasets',
    'labels','evaluation','Python API','notebooks','pip install','geospatial','GIS','QGIS',
    'ArcGIS','PostGIS','GeoPandas','Rasterio','Xarray','Zarr','NetCDF','GeoTIFF','GDAL',
    'PROJ','CRS','EPSG','WGS84','UTM','Web Mercator','vector tiles','Mapbox','Leaflet',
    'OpenLayers','deck.gl','Kepler.gl','Cesium','3D tiles','point clouds','LAZ','LAS',
    'DEM','DSM','DTM','slope','aspect','hillshade','watershed','hydrology','land cover',
    'land use','NDVI','EVI','NDWI','NBR','spectral bands','multispectral','thermal',
    'radar backscatter','InSAR','Sentinel-2','MODIS','PlanetScope','WorldView','NAIP',
    'Copernicus','NOAA','ECMWF','ERA5','OpenStreetMap','geocoding','routing','isochrones',
    'spatial join','buffer','overlay','tiling','quadkey','geohash','spatiotemporal',
    'object detection','scene classification','super-resolution','pan-sharpening',
    'image registration','orthorectification','cloud removal','time series','anomaly detection',
    'crop mapping','soil moisture','coastline','bathymetry','terrain','cartography',
    'spatial database','STAC catalog','earth observation','satellite imagery','aerial imagery',
    'drone imagery','geodesy','topology','spatial autocorrelation','kriging','Gaussian process'
  ];
  const topics = [
    {
      label: 'Dataset Graph',
      meta: 'training data · labels · benchmarks · evaluation',
      color: '129,140,248',
      words: ['Datasets','Sentinel-2','Landsat','xView','DOTA','NAIP','labels','benchmarks','STAC catalog','COG','GeoTIFF','Zarr','NetCDF','building detection','change detection','cloud mask','land cover','flood mapping','crop mapping','evaluation','training data','Kaggle','Hugging Face','GeoParquet'],
    },
    {
      label: 'Paper Graph',
      meta: 'papers · methods · tasks · code · citations',
      color: '99,102,241',
      words: ['Papers','methods','code','SOTA','citations','benchmarks','segmentation','object detection','super-resolution','SAR segmentation','ViT','U-Net','YOLO','LoRA','RAG','evaluation','ablation','pretraining','fine-tuning','remote sensing','CVPR','NeurIPS','ICLR','Papers with Code'],
    },
    {
      label: 'Foundation Graph',
      meta: 'foundation models · embeddings · VLMs · agents',
      color: '165,180,252',
      words: ['Foundation Models','Prithvi','Clay','SAM','TerraMind','GeoCLIP','SatMAE','SpectralGPT','RemoteCLIP','GeoChat','VLMs','LLMs','agents','embeddings','multimodal','transformers','ViT','self-supervised','masked modeling','zero-shot','few-shot','fine-tuning','vector search','reranking'],
    },
  ];

  const mouse = { x: 0, y: 0, active: false };
  const particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rotX = -0.18;
  let rotY = 0;
  let activeTopic = -1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(rect.width, 1);
    height = Math.max(rect.height, 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeParticle(i) {
    const heroAnchor = isHeroGraph ? heroAnchors[i] : null;
    const isWord = isHeroGraph ? Boolean(heroAnchor) : i % 7 === 0;
    const theta = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const radius = 0.34 + Math.pow(Math.random(), 0.45) * 0.66;
    const ringNoise = 0.82 + Math.random() * 0.34;
    const shellX = heroAnchor ? heroAnchor.x : Math.sqrt(1 - u * u) * Math.cos(theta) * radius * ringNoise;
    const shellY = heroAnchor ? heroAnchor.y : Math.sqrt(1 - u * u) * Math.sin(theta) * radius * (0.72 + Math.random() * 0.22);
    const shellZ = heroAnchor ? heroAnchor.z : u * radius * (0.88 + Math.random() * 0.2);
    return {
      x: shellX,
      y: shellY,
      z: shellZ,
      sx: 0,
      sy: 0,
      depth: 0,
      r: isWord ? (isHeroGraph ? 2.4 : 1.7 + Math.random() * 1.4) : 0.75 + Math.random() * 1.25,
      isWord,
      wordIndex: isWord ? (isHeroGraph ? i : (i / 7 | 0)) : -1,
      word: isWord ? (isHeroGraph ? heroAnchor.label : words[(i / 7 | 0) % words.length]) : '',
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.72 ? 'soft' : 'accent',
    };
  }

  resize();
  const count = Math.min(760, Math.max(430, Math.floor((width * height) / 600)));
  for (let i = 0; i < count; i++) particles.push(makeParticle(i));

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  canvas.addEventListener('mouseleave', () => { mouse.active = false; });
  window.addEventListener('resize', resize);
  let burstNode = -1;
  let burstUntil = 0;
  let nextBurstAt = 6200;

  function tick(t) {
    ctx.clearRect(0, 0, width, height);
    if (isHeroGraph && t > nextBurstAt) {
      burstNode = Math.floor(Math.random() * heroAnchors.length);
      burstUntil = t + 650;
      nextBurstAt = t + 5600 + Math.random() * 1400;
    }
    const topicIndex = Math.floor(t / 2000) % topics.length;
    const topic = topics[topicIndex];
    if (topicIndex !== activeTopic) {
      activeTopic = topicIndex;
      if (topicEl) topicEl.textContent = topic.label;
      if (topicMetaEl) topicMetaEl.textContent = topic.meta;
    }

    const cx = width / 2;
    const cy = height / 2 - 6;
    const sphereR = Math.min(width * 0.38, height * 0.42);
    const perspective = 2.7;

    rotY += mouse.active ? (isHeroGraph ? 0.00055 : 0.0018) : (isHeroGraph ? 0.00035 : 0.00105);
    rotX += ((mouse.active ? (mouse.y / height - 0.5) * (isHeroGraph ? 0.28 : 0.55) : -0.18) - rotX) * 0.018;
    const mouseYaw = mouse.active ? (mouse.x / width - 0.5) * (isHeroGraph ? 0.16 : 0.35) : 0;

    const sinY = Math.sin(rotY + mouseYaw);
    const cosY = Math.cos(rotY + mouseYaw);
    const sinX = Math.sin(rotX);
    const cosX = Math.cos(rotX);

    particles.forEach((p, i) => {
      const wobble = 1 + Math.sin(t * 0.00035 + p.phase) * 0.035;
      const x1 = p.x * cosY - p.z * sinY;
      const z1 = p.x * sinY + p.z * cosY;
      const y1 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;
      const scale = perspective / (perspective - z2 * wobble);

      p.sx = cx + x1 * sphereR * scale;
      p.sy = cy + y1 * sphereR * scale;
      p.depth = (z2 + 1) / 2;
      p.scale = scale;
    });

    const linkDistance = Math.min(72, width * 0.13);
    const sorted = particles.slice().sort((a, b) => a.depth - b.depth);
    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      for (let j = i + 1; j < Math.min(sorted.length, i + 24); j++) {
        const b = sorted[j];
        const dx = a.sx - b.sx;
        const dy = a.sy - b.sy;
        const dist = Math.hypot(dx, dy);
        if (dist < linkDistance) {
          const depthAlpha = Math.max(a.depth, b.depth);
          const alpha = (1 - dist / linkDistance) * 0.14 * depthAlpha;
          ctx.strokeStyle = `rgba(129,140,248,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }
    }

    const topicNodes = sorted
      .filter(p => p.isWord && p.depth > 0.34)
      .slice(-18);
    for (let i = 0; i < topicNodes.length; i++) {
      const a = topicNodes[i];
      const b = topicNodes[(i + 1) % topicNodes.length];
      const c = topicNodes[(i + 5) % topicNodes.length];
      [b, c].forEach(target => {
        const alpha = 0.08 + Math.min(a.depth, target.depth) * 0.2;
        ctx.strokeStyle = `rgba(${topic.color},${alpha})`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(target.sx, target.sy);
        ctx.stroke();
      });
    }

    sorted.forEach((p, i) => {
      const isTopicWord = p.isWord;
      const glow = isTopicWord ? topic.color : (p.hue === 'soft' ? '165,180,252' : '129,140,248');
      const pulse = 0.55 + Math.sin(t * 0.0007 + p.phase) * 0.18;
      const alpha = 0.18 + p.depth * 0.62;
      const radius = (p.r + pulse * 0.6 + (isTopicWord ? 0.45 : 0)) * (0.6 + p.depth * 0.9);
      ctx.fillStyle = `rgba(${glow},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
      ctx.fill();

      if (p.isWord && (isHeroGraph || p.depth > 0.28)) {
        const label = isHeroGraph ? p.word : (topic.words[p.wordIndex % topic.words.length] || p.word);
        const isBursting = isHeroGraph && p.wordIndex === burstNode && t < burstUntil;
        const size = isHeroGraph ? 11 : (label.length > 14 ? 9.5 : 10.5) + p.depth * 1.2;
        ctx.font = isHeroGraph
          ? `${size}px "SF Mono", Menlo, ui-monospace, monospace`
          : `${size}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
        ctx.fillStyle = isHeroGraph
          ? `rgba(255,255,255,${isBursting ? 0.9 : 0.34 + p.depth * 0.28})`
          : `rgba(255,255,255,${0.22 + p.depth * 0.48})`;
        ctx.fillText(label, p.sx + radius + 5, p.sy + 4);
      }
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function initAskGeoMind(onDone) {
  const form = document.getElementById('lpAskForm');
  const input = document.getElementById('lpAskInput');
  const messages = document.getElementById('lpAskMessages');
  const submit = form?.querySelector('.lp-ask-submit');
  if (!form || !input || !messages) return;
  if (form._gmAskRunDemo) {
    form._gmAskRunDemo(onDone);
    return;
  }

  let userInteracted = false;
  let demoRunning = false;
  let demoDone = null;

  const routes = [
    {
      keys: ['paper', 'code', 'benchmark', 'method', 'implementation', 'sota'],
      title: 'Paper with Code',
      href: 'pages/paper-with-code.html',
      text: 'Start with Paper with Code. That is where methods, benchmark results, and implementation links should live.'
    },
    {
      keys: ['foundation', 'model', 'vlm', 'llm', 'agent', 'prithvi', 'clay', 'sam'],
      title: 'Foundation Models',
      href: 'pages/foundation-models.html',
      text: 'Geospatial foundation models are large pretrained models built for Earth observation and spatial data. They learn reusable patterns from satellite imagery, SAR, LiDAR, maps, and time-series data, then adapt to tasks like segmentation, change detection, land cover mapping, disaster response, and search.'
    },
    {
      keys: ['dataset', 'data', 'sentinel', 'landsat', 'change detection', 'building', 'segmentation'],
      title: 'Datasets',
      href: 'pages/datasets.html',
      text: 'Start with Datasets. Look there when your question is about training data, benchmarks, labels, or evaluation sets.'
    },
    {
      keys: ['job', 'hire', 'hiring', 'career', 'salary', 'role', 'remote', 'internship'],
      title: 'Job Market',
      href: 'pages/job-market.html',
      text: 'Start with Job Market. That page is for roles, hiring signals, required skills, and market context.'
    },
    {
      keys: ['company', 'startup', 'vendor', 'provider', 'platform', 'lab', 'business'],
      title: 'Companies',
      href: 'pages/companies.html',
      text: 'Start with Companies. Use it to explore startups, labs, platforms, satellite providers, and the ecosystem.'
    },
    {
      keys: ['learn', 'course', 'book', 'tutorial', 'beginner', 'zero', 'start', 'study'],
      title: 'Learn',
      href: 'pages/learn.html',
      text: 'Start with Learn. It is best for courses, tutorials, books, and a clean path from basics to practice.'
    },
  ];

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function appendMessage(kind, text, route) {
    const msg = document.createElement('div');
    msg.className = `lp-ask-msg lp-ask-msg-${kind}`;
    const role = kind === 'user' ? 'You' : 'GeoMind';
    msg.innerHTML = `<span class="lp-ask-role">${role}</span><p>${escapeHtml(text)}</p>`;
    if (route) {
      const a = document.createElement('a');
      a.className = 'lp-ask-link';
      a.href = route.href;
      a.textContent = `Open ${route.title} →`;
      msg.appendChild(a);
    }
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendStreamingBot(route, onDone, options = {}) {
    const msg = document.createElement('div');
    msg.className = 'lp-ask-msg lp-ask-msg-bot lp-ask-msg-streaming';
    msg.innerHTML = `
      <span class="lp-ask-role">GeoMind</span>
      <p class="lp-ask-thinking" aria-live="polite"><span></span><span></span><span></span></p>
    `;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;

    const p = msg.querySelector('p');
    const words = route.text.split(' ');
    let index = 0;

    window.setTimeout(() => {
      p.className = '';
      p.textContent = '';

      const timer = window.setInterval(() => {
        p.textContent += `${index === 0 ? '' : ' '}${words[index]}`;
        index += 1;
        messages.scrollTop = messages.scrollHeight;

        if (index >= words.length) {
          window.clearInterval(timer);
          const a = document.createElement('a');
          a.className = 'lp-ask-link lp-ask-link-reveal';
          a.href = route.href;
          a.textContent = `Open ${route.title} →`;
          msg.appendChild(a);
          msg.classList.remove('lp-ask-msg-streaming');
          if (!options.keepDisabled) {
            input.disabled = false;
            if (submit) submit.disabled = false;
            demoRunning = false;
          }
          if (onDone) onDone();
          if (userInteracted) input.focus();
        }
      }, 72);
    }, 620);
  }

  function pickRoute(query) {
    const q = query.toLowerCase();
    return routes.find(route => route.keys.some(key => q.includes(key))) || {
      title: 'Knowledge Map',
      href: 'pages/app.html',
      text: 'If you are not sure yet, open the full knowledge map first. It lets you scan every layer and then narrow down.'
    };
  }

  function ask(query, options = {}) {
    const clean = query.trim();
    if (!clean) return;
    if (!options.demo) userInteracted = true;
    appendMessage('user', clean);
    input.value = '';
    input.disabled = true;
    if (submit) submit.disabled = true;
    const route = pickRoute(clean);
    appendStreamingBot(route, options.onDone, { keepDisabled: options.keepDisabled });
  }

  function runDemo() {
    if (userInteracted || demoRunning || messages.querySelector('.lp-ask-msg-user')) return;
    demoRunning = true;
    input.disabled = true;
    if (submit) submit.disabled = true;

    const demoPrompts = [
      'I need satellite datasets for building detection',
      'What are geospatial foundation models?',
    ];

    function stopDemo() {
      demoRunning = false;
      input.value = '';
      input.disabled = false;
      if (submit) submit.disabled = false;
    }

    function completeDemo() {
      stopDemo();
      const done = demoDone;
      demoDone = null;
      if (done && !userInteracted) window.setTimeout(done, 900);
    }

    function typePrompt(prompt, onDone) {
      let index = 0;
      input.value = '';
      const timer = window.setInterval(() => {
        if (userInteracted) {
          window.clearInterval(timer);
          stopDemo();
          return;
        }

        input.value = prompt.slice(0, index + 1);
        index += 1;

        if (index >= prompt.length) {
          window.clearInterval(timer);
          window.setTimeout(onDone, 420);
        }
      }, 46);
    }

    function runStep(step) {
      if (userInteracted) {
        stopDemo();
        return;
      }

      const prompt = demoPrompts[step];
      if (!prompt) {
        input.placeholder = 'Ask what you want to find in GeoAI';
        completeDemo();
        return;
      }

      typePrompt(prompt, () => {
        ask(input.value, {
          demo: true,
          keepDisabled: true,
          onDone: () => {
            window.setTimeout(() => runStep(step + 1), step === 0 ? 900 : 0);
          },
        });
      });
    }

    runStep(0);
  }

  form._gmAskRunDemo = callback => {
    if (demoRunning) return;
    userInteracted = false;
    demoDone = callback || null;
    messages.innerHTML = '';
    input.value = '';
    runDemo();
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    ask(input.value);
  });

  input.addEventListener('focus', () => {
    if (!demoRunning) userInteracted = true;
  });
  input.addEventListener('input', () => {
    if (!demoRunning) userInteracted = true;
  });

  window.setTimeout(() => form._gmAskRunDemo(onDone), 520);
}

/* ── Knowledge Map mini radial ───────────────── */
function initMapViz() {
  const wrap = document.getElementById('lpMapViz');
  if (!wrap) return;
  const W = 340, H = 360, cx = 170, cy = 180, R = 130, NR = 22, N = 13;
  const LAYERS = ['Earth Data','Learning','AI History','Models','Techniques',
    'Tasks','Datasets','Tools','Satellites','Companies','Standards','Learning Path','Jobs'];
  const COLORS = ['#6366F1','#7C6AF7','#8B5CF6','#7C3AED','#5B21B6','#4F46E5',
    '#4338CA','#3B82F6','#2563EB','#0EA5E9','#06B6D4','#0891B2','#818CF8'];

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);

  /* orbit ring */
  const ring = document.createElementNS(ns,'circle');
  ring.setAttribute('cx',cx);ring.setAttribute('cy',cy);ring.setAttribute('r',R);
  ring.setAttribute('fill','none');ring.setAttribute('stroke','rgba(255,255,255,0.06)');
  ring.setAttribute('stroke-width','1');ring.setAttribute('stroke-dasharray','3 5');
  svg.appendChild(ring);

  const circles = [], labels = [], angles = [];
  LAYERS.forEach((name,i) => {
    const a = -Math.PI/2 + i*(2*Math.PI/N);
    angles.push(a);
    const nx = cx+R*Math.cos(a), ny = cy+R*Math.sin(a);
    const col = COLORS[i];

    const c = document.createElementNS(ns,'circle');
    c.setAttribute('cx',nx);c.setAttribute('cy',ny);c.setAttribute('r',NR);
    c.setAttribute('fill','rgba(255,255,255,0.04)');
    c.setAttribute('stroke','rgba(255,255,255,0.15)');c.setAttribute('stroke-width','1');
    svg.appendChild(c); circles.push(c);

    const t = document.createElementNS(ns,'text');
    t.setAttribute('x',nx);t.setAttribute('y',ny+3);
    t.setAttribute('text-anchor','middle');t.setAttribute('font-size','7.5');
    t.setAttribute('fill','rgba(255,255,255,0.3)');
    t.setAttribute('font-family',"-apple-system,'Segoe UI',sans-serif");
    t.setAttribute('font-weight','600');
    t.textContent = name.split(' ')[0];
    svg.appendChild(t); labels.push(t);
  });

  wrap.appendChild(svg);

  /* animate active node cycling */
  let active = 0;
  const CYCLE_MS = 1200;
  function animMap() {
    circles.forEach((c,i) => {
      const isA = i===active;
      c.setAttribute('r', isA ? NR*1.3 : NR);
      c.setAttribute('fill', isA ? COLORS[i] : 'rgba(255,255,255,0.04)');
      c.setAttribute('stroke', isA ? COLORS[i] : 'rgba(255,255,255,0.15)');
      c.setAttribute('stroke-opacity', isA ? '0.7' : '1');
      c.setAttribute('stroke-width', isA ? '2' : '1');
      labels[i].setAttribute('fill', isA ? '#fff' : 'rgba(255,255,255,0.3)');
    });
    active = (active+1)%N;
  }
  animMap();
  setInterval(animMap, CYCLE_MS);
}

/* ── Instant Search viz ──────────────────────── */
function initSearchViz(onDone) {
  const inputEl   = document.getElementById('lpSvInput');
  const resultsEl = document.getElementById('lpSvResults');
  if (!inputEl || !resultsEl) return;

  const QUERIES = [
    {
      q: 'ViT',
      results:[
        {layer:'Model Architectures', match:'<mark>ViT</mark> (Vision Transformer)', desc:'Transformer applied to image patches — dominant backbone for geo foundation models.'},
        {layer:'Techniques',          match:'<mark>ViT</mark> fine-tuning with LoRA', desc:'Adapting pretrained ViTs to new sensors with parameter-efficient methods.'},
        {layer:'Tools & Stack',       match:'timm — <mark>ViT</mark> weights hub',    desc:'PyTorch Image Models, go-to library for ViT variants.'},
      ]
    },
    {
      q: 'SAR segmentation',
      results:[
        {layer:'Tasks / Applications',match:'<mark>SAR</mark> <mark>segmentation</mark>', desc:'Pixel-level labeling of synthetic aperture radar imagery.'},
        {layer:'Datasets',            match:'Sen1Floods11 — <mark>SAR</mark> flood',       desc:'Benchmark for flood mapping with Sentinel-1 SAR data.'},
        {layer:'Sensors & Satellites',match:'Sentinel-1 <mark>SAR</mark>',                 desc:'C-band SAR constellation, free open access.'},
      ]
    },
    {
      q: 'STAC',
      results:[
        {layer:'Standards',           match:'<mark>STAC</mark> — SpatioTemporal Asset Catalog', desc:'Unified metadata spec for geospatial data — catalog API for cloud-native search.'},
        {layer:'Earth Data',          match:'<mark>STAC</mark> catalogs',                        desc:'Discover and stream COG/Zarr assets via STAC endpoints.'},
        {layer:'Tools & Stack',       match:'pystac / stac-fastapi',                             desc:'Python clients and server implementations for <mark>STAC</mark>.'},
      ]
    },
    {
      q: 'foundation model',
      results:[
        {layer:'Model Architectures', match:'<mark>Foundation</mark> <mark>model</mark>s', desc:'Large pretrained models — Prithvi, Clay, SpectralGPT, SatMAE — adapted for EO.'},
        {layer:'Datasets',            match:'SSL4EO-S12 pretraining data',                  desc:'Large unlabelled Sentinel dataset used to train geo <mark>foundation model</mark>s.'},
        {layer:'Companies',           match:'IBM / NASA — Prithvi',                         desc:'Open-source geospatial <mark>foundation model</mark> for land-use and disaster tasks.'},
      ]
    },
    {
      q: 'change detection',
      results:[
        {layer:'Tasks / Applications',match:'<mark>Change</mark> <mark>detection</mark>',  desc:'Identifying differences between multi-temporal images — deforestation, floods, urban growth.'},
        {layer:'Datasets',            match:'LEVIR-CD / S2Looking',                         desc:'Benchmark datasets for bitemporal <mark>change detection</mark> with high-res imagery.'},
        {layer:'Techniques',          match:'Siamese networks for <mark>change</mark>',     desc:'Twin encoders process image pairs and compare feature maps for pixel-level difference.'},
      ]
    },
  ];

  let qIdx = 0;

  function runQuery() {
    const q = QUERIES[qIdx]; qIdx++;
    inputEl.textContent = '';
    resultsEl.innerHTML = '';

    let i = 0;
    function typeChar() {
      if (i >= q.q.length) { showResults(); return; }
      inputEl.textContent += q.q[i++];
      setTimeout(typeChar, 80 + Math.random()*60);
    }

    function showResults() {
      setTimeout(() => {
        q.results.forEach((r,ri) => {
          const d = document.createElement('div');
          d.className = 'lp-sv-result';
          d.innerHTML = `<div class="lp-sv-rlayer">${r.layer}</div><div class="lp-sv-rmatch">${r.match}</div><div class="lp-sv-rdesc">${r.desc}</div>`;
          resultsEl.appendChild(d);
          setTimeout(() => d.classList.add('show'), ri*120);
        });
        const count = document.createElement('div');
        count.className='lp-sv-count';
        count.textContent=`${q.results.length} results across ${q.results.length} layers`;
        resultsEl.appendChild(count);
        setTimeout(() => count.style.opacity='1', q.results.length*120+100);

        setTimeout(() => {
          resultsEl.querySelectorAll('.lp-sv-result,.lp-sv-count').forEach(el => el.classList.remove('show'));
          setTimeout(() => {
            resultsEl.innerHTML = '';
            if (qIdx >= QUERIES.length) {
              /* all 5 searches done — hand off to next tab */
              qIdx = 0;
              onDone && onDone();
            } else {
              runQuery();
            }
          }, 600);
        }, 3500);
      }, 300);
    }
    setTimeout(typeChar, 400);
  }

  runQuery();
}

/* ── Knowledge Map tree terminal ─────────────── */
function initMapTree() {
  const body = document.getElementById('lpMapTreeBody');
  if (!body) return;

  const PROMPT = '<span class="lp-demo-prompt">geomind:~$</span> ';
  const CURSOR = '<span class="lp-demo-cursor"></span>';
  const TREE_LINES = [
    { text:'GeoMind/',               depth:0, kind:'root' },
    { text:'01  earth data',         depth:1, kind:'item',   branch:'├─' },
    { text:'02  learning paradigms', depth:1, kind:'item',   branch:'├─' },
    { text:'03  ai history',         depth:1, kind:'item',   branch:'├─' },
    { text:'04  model architectures',depth:1, kind:'active', branch:'├─' },
    { text:'stat / ai / physics',    depth:2, kind:'child',  branch:'└─' },
    { text:'05  techniques',         depth:1, kind:'item',   branch:'├─' },
    { text:'06  tasks / applications',depth:1,kind:'item',   branch:'├─' },
    { text:'07  datasets',           depth:1, kind:'item',   branch:'├─' },
    { text:'08  tools & stack',      depth:1, kind:'item',   branch:'├─' },
    { text:'09  sensors & satellites',depth:1,kind:'item',   branch:'├─' },
    { text:'10  companies',          depth:1, kind:'item',   branch:'├─' },
    { text:'11  standards',          depth:1, kind:'item',   branch:'├─' },
    { text:'12  learning path',      depth:1, kind:'item',   branch:'├─' },
    { text:'13  job board',          depth:1, kind:'item',   branch:'└─' },
  ];

  let stopped = false;

  function addLine(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function typeCmd(text, cb) {
    const line = addLine(PROMPT + CURSOR);
    let i = 0;
    function next() {
      if (stopped) return;
      if (i >= text.length) {
        line.innerHTML = PROMPT + `<span class="lp-demo-cmd">${text}</span>`;
        setTimeout(cb, 180);
        return;
      }
      line.innerHTML = PROMPT + `<span class="lp-demo-cmd">${text.slice(0, ++i)}</span>` + CURSOR;
      setTimeout(next, 60 + Math.random() * 40);
    }
    setTimeout(next, 400);
  }

  function renderTree(cb) {
    let i = 0;
    function nextLine() {
      if (stopped || i >= TREE_LINES.length) { cb && cb(); return; }
      const l = TREE_LINES[i++];
      const indent = '  '.repeat(l.depth);
      const branch = l.depth > 0 ? `<span class="lp-demo-tree-branch">${l.branch} </span>` : '';
      let cls = 'lp-demo-tree-item';
      if (l.kind === 'root')   cls += ' lp-demo-tree-root';
      if (l.kind === 'active') cls += ' lp-demo-tree-active';
      if (l.kind === 'child')  cls += ' lp-demo-tree-child';
      addLine(`<div class="${cls}">${indent}${branch}<span>${l.text}</span></div>`);
      setTimeout(nextLine, l.depth === 0 ? 0 : 60);
    }
    nextLine();
  }

  function run() {
    if (stopped) return;
    body.innerHTML = '';
    typeCmd('ls', () => {
      const blank = document.createElement('div');
      body.appendChild(blank);
      renderTree(() => {
        const b2 = document.createElement('div');
        body.appendChild(b2);
        addLine(PROMPT + CURSOR);
        /* loop after 4s */
        setTimeout(() => { if (!stopped) run(); }, 4000);
      });
    });
  }

  run();
}

/* ── Demo terminal animation ─────────────────── */
function initDemoTerm(onDone) {
  const body = document.getElementById('lpDemoBody');
  if (!body) return;
  body.innerHTML = '';

  const PROMPT = '<span class="lp-demo-prompt">geomind:~$</span> ';
  const CURSOR = '<span class="lp-demo-cursor"></span>';

  const SEQUENCES = [
    {
      cmd: 'help',
      delay: 800,
      output: [
        { t:'sep',  text:'  COMMAND          DESCRIPTION' },
        { t:'sep',  text:'  ─────────────────────────────────────────' },
        { t:'row',  cmd:'ls',              desc:'list all layers' },
        { t:'row',  cmd:'ls [layer]',      desc:'list sub-sections' },
        { t:'row',  cmd:'cd [layer]',      desc:'navigate into a layer' },
        { t:'row',  cmd:'cd ..',           desc:'go back to root' },
        { t:'row',  cmd:'pwd',             desc:'print current location' },
        { t:'row',  cmd:'search [query]',  desc:'search across all layers' },
        { t:'row',  cmd:'clear',           desc:'clear the terminal' },
        { t:'row',  cmd:'help',            desc:'show this message' },
        { t:'blank' },
        { t:'note', text:'  Layer names are fuzzy — try: cd earth data or cd 1' },
      ]
    },
    {
      cmd: 'ls',
      delay: 1400,
      output: [
        { t:'tree', lines:[
          { text:'GeoMind/',             depth:0, kind:'root' },
          { text:'01  earth data',       depth:1, kind:'item', branch:'├─' },
          { text:'02  learning paradigms',depth:1,kind:'item', branch:'├─' },
          { text:'03  model architectures',depth:1,kind:'active',branch:'├─' },
          { text:'stat',                 depth:2, kind:'child', branch:'├─' },
          { text:'ai',                   depth:2, kind:'child', branch:'├─' },
          { text:'classical ml',         depth:3, kind:'leaf',  branch:'├─' },
          { text:'deep learning',        depth:3, kind:'leaf',  branch:'├─' },
          { text:'foundation models',    depth:3, kind:'leaf',  branch:'├─' },
          { text:'vlms & llms',          depth:3, kind:'leaf',  branch:'├─' },
          { text:'agentic',              depth:3, kind:'leaf',  branch:'└─' },
          { text:'physics',              depth:2, kind:'child', branch:'├─' },
          { text:'by function',          depth:2, kind:'child', branch:'└─' },
          { text:'04  techniques',       depth:1, kind:'item',  branch:'├─' },
          { text:'05  tasks / applications',depth:1,kind:'item',branch:'├─' },
          { text:'06  datasets',         depth:1, kind:'item',  branch:'├─' },
          { text:'07  tools & stack',    depth:1, kind:'item',  branch:'├─' },
          { text:'08  sensors & satellites',depth:1,kind:'item',branch:'├─' },
          { text:'09  companies',        depth:1, kind:'item',  branch:'├─' },
          { text:'10  standards',        depth:1, kind:'item',  branch:'├─' },
          { text:'11  learning path',    depth:1, kind:'item',  branch:'├─' },
          { text:'12  job board',        depth:1, kind:'item',  branch:'└─' },
        ]}
      ]
    },
    {
      cmd: 'cd data',
      delay: 1000,
      output: [
        { t:'out', text:'→ earth data' },
        { t:'blank' },
        { t:'out', text:'  sensors & platforms   representations      formats — raster' },
        { t:'out', text:'  formats — vector       formats — point clouds  spatial indexing' },
        { t:'out', text:'  embedding types        embedding products   search & retrieval' },
        { t:'blank' },
        { t:'note', text:'  9 sub-sections  ·  use ls data to list them' },
      ]
    },
    {
      cmd: 'cd timeline',
      delay: 800,
      output: [
        { t:'out', text:'→ ai history  ·  showing 9 eras' },
        { t:'blank' },
        { t:'cards', items:[
          { year:'1990s', label:'Classical ML',      sub:'SVM, RF, k-NN',                  col:'#6366F1' },
          { year:'2012',  label:'CNNs',              sub:'ResNet, U-Net, YOLO',             col:'#7C3AED' },
          { year:'2014',  label:'GANs / Autoencoders',sub:'cGAN, VAE, Siamese',             col:'#8B5CF6' },
          { year:'2016',  label:'RNN / LSTM',        sub:'Temporal, sequences',             col:'#0EA5E9' },
          { year:'2020',  label:'Transformers',      sub:'ViT, Swin, BERT',                 col:'#06B6D4' },
          { year:'2021',  label:'Diffusion models',  sub:'DDPM, DiffusionSat',              col:'#14B8A6' },
          { year:'2022',  label:'Foundation models', sub:'Prithvi, Clay, SAM, SpectralGPT', col:'#22C55E' },
          { year:'2023→', label:'VLMs / LLMs',       sub:'GeoChat, RemoteCLIP, TerraMind',  col:'#EAB308' },
          { year:'2024→', label:'Agentic AI',        sub:'GeoLLM-Squad, Earth-Agent',       col:'#F97316' },
        ]},
      ]
    },
    {
      cmd: 'search ViT',
      delay: 1200,
      output: [
        { t:'note', text:'  searching across all 13 layers…' },
        { t:'blank' },
        { t:'search-result', layer:'04  model architectures', match:'ViT (Vision Transformer)', context:'Transformer applied to image patches — dominant backbone for geo foundation models.' },
        { t:'search-result', layer:'05  techniques',          match:'ViT fine-tuning',           context:'Adapting pretrained ViTs to remote sensing with LoRA or full fine-tune.' },
        { t:'search-result', layer:'07  datasets',            match:'ImageNet-pretrained ViT',   context:'Common initialisation for satellite image classifiers.' },
        { t:'search-result', layer:'08  tools & stack',       match:'timm (ViT weights)',         context:'PyTorch Image Models — go-to library for ViT variants.' },
        { t:'blank' },
        { t:'note', text:'  4 results  ·  ⌘K to search anything' },
      ]
    },
  ];

  let lines = []; /* rendered line elements */
  let seqIdx = 0;
  let stopped = false;

  function addLine(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function addBlank() { addLine('<div class="lp-demo-blank"></div>'); }

  function renderCards(cards, cb) {
    const wrap = document.createElement('div');
    wrap.className = 'lp-demo-cards';
    body.appendChild(wrap);

    let i = 0;
    function nextCard() {
      if (stopped || i >= cards.length) { cb && cb(); return; }
      const c = cards[i++];
      const el = document.createElement('div');
      el.className = 'lp-demo-card lp-demo-card-enter';
      el.style.setProperty('--cc', c.col);
      el.innerHTML = `<span class="lp-demo-card-year">${c.year}</span><span class="lp-demo-card-label">${c.label}</span><span class="lp-demo-card-sub">${c.sub}</span>`;
      wrap.appendChild(el);
      body.scrollTop = body.scrollHeight;
      /* trigger enter animation */
      requestAnimationFrame(() => el.classList.add('lp-demo-card-visible'));
      setTimeout(nextCard, 500);
    }
    nextCard();
  }

  function renderOutput(items, cb) {
    let i = 0;
    function next() {
      if (stopped || i >= items.length) { cb && cb(); return; }
      const item = items[i++];
      if (item.t === 'blank') {
        addBlank();
        setTimeout(next, 120);
      } else if (item.t === 'cards') {
        renderCards(item.items, cb); /* cards handle their own timing, skip next() */
        return;
      } else if (item.t === 'sep') {
        addLine(`<span class="lp-demo-sep">${item.text}</span>`);
        setTimeout(next, 100);
      } else if (item.t === 'row') {
        const pad = item.cmd.padEnd(18, ' ');
        addLine(`<span class="lp-demo-out-dim">  </span><span class="lp-demo-out-hi">${pad}</span><span class="lp-demo-out">${item.desc}</span>`);
        setTimeout(next, 150);
      } else if (item.t === 'note') {
        addLine(`<span class="lp-demo-out-dim">${item.text}</span>`);
        setTimeout(next, 100);
      } else if (item.t === 'layer') {
        addLine(`<span class="lp-demo-out-dim">  ${item.num}  </span><span class="lp-demo-layer">${item.name.padEnd(24,' ')}</span><span class="lp-demo-out-dim">${item.desc}</span>`);
        setTimeout(next, 180);
      } else if (item.t === 'out') {
        addLine(`<span class="lp-demo-out">${item.text}</span>`);
        setTimeout(next, 120);
      } else if (item.t === 'tree') {
        renderTree(item.lines, cb);
        return;
      } else if (item.t === 'search-result') {
        const layerSpan = `<span class="lp-demo-sr-layer">${item.layer}</span>`;
        const matchSpan = `<span class="lp-demo-sr-match">${item.match}</span>`;
        const ctx = `<span class="lp-demo-sr-ctx">${item.context}</span>`;
        addLine(`<div class="lp-demo-sr">${layerSpan}<br>${matchSpan}<br>${ctx}</div>`);
        setTimeout(next, 300);
      }
    }
    next();
  }

  function renderTree(treeLines, cb) {
    let i = 0;
    function nextLine() {
      if (stopped || i >= treeLines.length) { cb && cb(); return; }
      const l = treeLines[i++];
      const indent = '  '.repeat(l.depth);
      const branch = l.depth > 0 ? `<span class="lp-demo-tree-branch">${l.branch} </span>` : '';
      let cls = 'lp-demo-tree-item';
      if (l.kind === 'root')   cls += ' lp-demo-tree-root';
      if (l.kind === 'active') cls += ' lp-demo-tree-active';
      if (l.kind === 'child' || l.kind === 'leaf') cls += ' lp-demo-tree-child';
      addLine(`<div class="${cls}">${indent}${branch}<span>${l.text}</span></div>`);
      setTimeout(nextLine, l.depth === 0 ? 0 : 120);
    }
    nextLine();
  }

  function typeCmd(text, cb) {
    const line = addLine(PROMPT + CURSOR);
    const cursor = line.querySelector('.lp-demo-cursor');
    let typed = '';
    let i = 0;
    function next() {
      if (stopped) return;
      if (i >= text.length) {
        line.innerHTML = PROMPT + `<span class="lp-demo-cmd">${text}</span>`;
        setTimeout(cb, 400);
        return;
      }
      typed += text[i++];
      line.innerHTML = PROMPT + `<span class="lp-demo-cmd">${typed}</span>` + CURSOR;
      setTimeout(next, 100 + Math.random() * 80);
    }
    setTimeout(next, 600);
  }

  function runSeq() {
    if (stopped) return;
    const seq = SEQUENCES[seqIdx % SEQUENCES.length];
    seqIdx++;

    typeCmd(seq.cmd, () => {
      addBlank();
      renderOutput(seq.output, () => {
        addBlank();
        const idle = addLine(PROMPT + CURSOR);
        const wait = seq.output.some(o => o.t === 'cards')
          ? seq.output.find(o => o.t === 'cards').items.length * 500 + seq.delay
          : seq.delay;
        setTimeout(() => {
          if (stopped) return;
          idle.remove();
          if (seqIdx >= SEQUENCES.length) {
            /* all 5 prompts done — hand off to next tab, reset for next visit */
            seqIdx = 0;
            onDone && onDone();
          } else {
            runSeq();
          }
        }, wait);
      });
    });
  }

  runSeq();
}

function initPythonApi(onDone) {
  const term = document.getElementById('lpPythonTerm');
  if (!term) return;

  const runId = `${Date.now()}-${Math.random()}`;
  term.dataset.runId = runId;
  term.innerHTML = '';

  const shellPrompt = '<span class="lp-python-prompt">$</span> ';
  const replPrompt = '<span class="lp-python-prompt-repl">&gt;&gt;&gt;</span> ';
  const cursor = '<span class="lp-python-cursor"></span>';

  function isCurrent() {
    return term.dataset.runId === runId &&
      document.querySelector('.lp-viz[data-viz="5"]')?.classList.contains('active');
  }

  function wait(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function addLine(html = '', className = '') {
    if (!isCurrent()) return null;
    const line = document.createElement('div');
    line.className = `lp-python-line${className ? ` ${className}` : ''}`;
    line.innerHTML = html;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
    return line;
  }

  async function typeLine(prompt, text, className = 'lp-python-cmd', speed = 34) {
    const line = addLine(prompt + cursor);
    if (!line) return false;
    let typed = '';
    await wait(220);
    for (let i = 0; i < text.length; i += 1) {
      if (!isCurrent()) return false;
      typed += text[i];
      line.innerHTML = `${prompt}<span class="${className}">${escapeHtml(typed)}</span>${cursor}`;
      term.scrollTop = term.scrollHeight;
      await wait(speed + Math.random() * 20);
    }
    line.innerHTML = `${prompt}<span class="${className}">${escapeHtml(text)}</span>`;
    await wait(260);
    return true;
  }

  async function out(text, className = 'lp-python-out', delay = 130) {
    addLine(`<span class="${className}">${escapeHtml(text)}</span>`);
    await wait(delay);
  }

  async function progress(label, detail) {
    const row = addLine(`
      <span class="lp-python-muted">  ${escapeHtml(label)}</span>
      <span class="lp-python-progress">
        <span class="lp-python-progress-track"><span class="lp-python-progress-fill"></span></span>
        <span class="lp-python-muted">${escapeHtml(detail)}</span>
      </span>
    `);
    await wait(60);
    row?.querySelector('.lp-python-progress-fill')?.style.setProperty('width', '100%');
    await wait(900);
  }

  async function run() {
    if (!await typeLine(shellPrompt, 'pip install geomind', 'lp-python-cmd', 38)) return;
    await out('Collecting geomind');
    await out('  Downloading geomind-0.3.0-py3-none-any.whl (42 kB)', 'lp-python-muted');
    await progress('Downloading', '42.0/42.0 kB 3.8 MB/s');
    await out('Collecting geopandas>=0.14');
    await out('Collecting torchgeo>=0.6');
    await out('Installing collected packages: geoindex, geomind-core, geomind');
    await progress('Installing', '100%');
    await out('Successfully installed geoindex-0.2.1 geomind-core-0.3.0 geomind-0.3.0', 'lp-python-success', 320);
    addLine();

    if (!await typeLine(shellPrompt, 'python', 'lp-python-cmd', 42)) return;
    await out('Python 3.12.4 (main, May 21 2026) [Clang 17.0.0]', 'lp-python-muted');
    await out('Type "help", "copyright", "credits" or "license" for more information.', 'lp-python-muted');

    const code = [
      'from geomind import GeoMind',
      'gm = GeoMind()',
      'results = gm.search("SAR flood segmentation")',
      'model = gm.foundation_models.find(sensor="sentinel-1")',
      'datasets = gm.datasets.for_task("building detection")',
      'print(results.top(5))',
    ];

    for (const line of code) {
      if (!await typeLine(replPrompt, line, 'lp-python-cmd', 24)) return;
    }

    addLine(`
      <div class="lp-python-result">
        <span class="lp-python-result-title">results.top(5)</span>
        <span class="lp-python-result-row">1  Tasks &amp; Applications · SAR flood segmentation</span>
        <span class="lp-python-result-row">2  Foundation Models · Prithvi-EO-2.0</span>
        <span class="lp-python-result-row">3  Foundation Models · TerraMind</span>
        <span class="lp-python-result-row">4  Datasets · Sen1Floods11</span>
        <span class="lp-python-result-row">5  Datasets · SpaceNet Buildings</span>
      </div>
    `);
    await wait(320);
    addLine('<span class="lp-python-summary">5 matching resources · 2 foundation models · 8 datasets</span>');
    await wait(1400);
    addLine(replPrompt + cursor);
    await wait(1100);
    if (isCurrent()) onDone && onDone();
  }

  run();
}

document.addEventListener('DOMContentLoaded', async () => {
  initCanvas();
  initMainCategories();
  initGeoLayerMap();
  initRadial();
  initFeatSwitcher();
  await loadStats();
  initHeroStatsStream();
  initTerminalExplorer();
});

const TERMINAL_FLOW = [
  {
    cwd: '~/main',
    command: 'ls',
    comment: 'nine routes through the GeoAI landscape',
    output: [
      { name: 'learn/',             href: 'pages/learn.html' },
      { name: 'foundation-models/', href: 'pages/foundation-models.html', statsKey: 'models' },
      { name: 'techniques/',        href: 'pages/app.html#techniques',    statsKey: 'techniques' },
      { name: 'tasks/',             href: 'pages/app.html#tasks',         statsKey: 'tasks' },
      { name: 'stack/',             href: 'pages/app.html#stack' },
      { name: 'papers/',            href: 'pages/paper-with-code.html',   statsKey: 'papers' },
      { name: 'datasets/',          href: 'pages/datasets.html',          statsKey: 'datasets' },
      { name: 'companies/',         href: 'pages/companies.html',         statsKey: 'companies' },
      { name: 'jobs/',              href: 'pages/job-market.html' },
    ],
  },
  {
    cwd: '~/main/learn',
    command: 'cd learn && ls',
    comment: 'these topics are fundamentals to go deeper in GeoAI',
    output: [
      { name: 'geospatial/' },
      { name: 'remote-sensing/' },
      { name: 'statistics/' },
      { name: 'physics/' },
      { name: 'machine-learning/' },
      { name: 'deep-learning/' },
    ],
  },
  {
    cwd: '~/main/foundation-models',
    command: 'cd foundation-models && ls',
    dynamicSource: 'models',
    countKey: 'models',
    commentTemplate: 'top 10 of {count} models — most cited',
  },
  {
    cwd: '~/main/techniques',
    command: 'cd techniques && ls',
    dynamicSource: 'techniques',
    countKey: 'techniques',
    commentTemplate: 'top 10 of {count} techniques',
  },
  {
    cwd: '~/main/tasks',
    command: 'cd tasks && ls',
    dynamicSource: 'tasks',
    countKey: 'tasks',
    commentTemplate: 'top 10 of {count} tasks',
  },
  {
    cwd: '~/main/stack',
    command: 'cd stack && ls',
    comment: 'the toolchain — libraries, databases, compute, deployment',
    output: [
      { name: 'pytorch/' },
      { name: 'gdal/' },
      { name: 'rasterio/' },
      { name: 'postgis/' },
      { name: 'aws/' },
      { name: 'docker/' },
      { name: 'mlops/' },
    ],
  },
  {
    cwd: '~/main/papers',
    command: 'cd papers && ls',
    dynamicSource: 'papers',
    countKey: 'papers',
    commentTemplate: 'top 10 of {count} papers — most cited',
  },
  {
    cwd: '~/main/datasets',
    command: 'cd datasets && ls',
    dynamicSource: 'datasets',
    countKey: 'datasets',
    commentTemplate: 'top 10 of {count} datasets — most downloaded',
  },
  {
    cwd: '~/main/companies',
    command: 'cd companies && ls',
    dynamicSource: 'companies',
    countKey: 'companies',
    commentTemplate: 'top 10 of {count} companies',
  },
  {
    cwd: '~/main/jobs',
    command: 'cd jobs && ls',
    comment: 'roles, hiring signals, and skill maps in GeoAI',
    output: [
      { name: 'ml-engineer/' },
      { name: 'data-scientist/' },
      { name: 'gis-developer/' },
      { name: 'remote-sensing-engineer/' },
      { name: 'research-scientist/' },
      { name: 'computer-vision-engineer/' },
      { name: 'backend-engineer/' },
      { name: 'product-manager/' },
      { name: 'founding-engineer/' },
      { name: 'field-applications/' },
    ],
  },
];

const STATS_DEFAULTS = { papers: 17409, models: 11090, datasets: 2790, companies: 4773 };
let STATS = { ...STATS_DEFAULTS };
let STATS_PROMISE = null;

function loadStats() {
  if (STATS_PROMISE) return STATS_PROMISE;
  STATS_PROMISE = fetch('data/stats.json', { cache: 'no-cache' })
    .then(response => (response.ok ? response.json() : null))
    .then(data => {
      if (data && typeof data === 'object') {
        STATS = { ...STATS_DEFAULTS, ...data };
      }
      return STATS;
    })
    .catch(() => STATS);
  return STATS_PROMISE;
}

function formatStat(value) {
  return Number(value || 0).toLocaleString();
}

function initTerminalExplorer() {
  const root = document.querySelector('[data-terminal]');
  if (!root) return;

  const screen = root.querySelector('[data-terminal-screen]');
  const commandEl = root.querySelector('[data-terminal-command]');
  const outputEl = root.querySelector('[data-terminal-output]');
  const pathEl = root.querySelector('[data-terminal-path]');
  const cwdEl = root.querySelector('[data-terminal-cwd]');
  const pauseBtn = root.querySelector('[data-terminal-pause]');
  const nextBtn = root.querySelector('[data-terminal-next]');
  if (!screen || !commandEl || !outputEl) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const charDelayMin = 22;
  const charDelayMax = 48;
  const punctuationDelay = 90;
  const outputStagger = 70;
  const restAfterOutput = 3400;
  const preOutputBeat = 220;

  let stepIndex = 0;
  let advanceTimer = null;
  let typingTimers = [];
  let pausedByUser = false;
  let pausedByHover = false;

  function clearAdvanceTimer() {
    if (advanceTimer) {
      window.clearTimeout(advanceTimer);
      advanceTimer = null;
    }
  }

  function clearTypingTimers() {
    typingTimers.forEach(window.clearTimeout);
    typingTimers = [];
  }

  function isPaused() {
    return pausedByUser || pausedByHover;
  }

  function resolveStep(step) {
    let items = step.output;
    let comment = step.comment;
    if (step.dynamicSource) {
      const highlights = (STATS.highlights && STATS.highlights[step.dynamicSource]) || [];
      items = highlights.map(name => ({ name: `${name}/` }));
    }
    if (step.commentTemplate) {
      const count = step.countKey != null ? formatStat(STATS[step.countKey]) : '';
      comment = step.commentTemplate.replace('{count}', count);
    }
    return { items: items || [], comment };
  }

  function setOutput(items, comment) {
    outputEl.innerHTML = '';
    let cursor = 0;
    if (comment) {
      const note = document.createElement('span');
      note.className = 'lp-terminal-comment';
      note.textContent = `# ${comment}`;
      note.style.animationDelay = '0ms';
      outputEl.appendChild(note);
      cursor = 1;
    }
    items.forEach((item, index) => {
      const row = item.href
        ? document.createElement('a')
        : document.createElement('span');
      row.className = item.href ? 'lp-terminal-row is-link' : 'lp-terminal-row';
      if (item.href) {
        row.href = item.href;
        row.target = '_blank';
        row.rel = 'noopener';
      }
      const name = document.createElement('span');
      name.className = 'lp-terminal-row-name';
      name.textContent = item.name;
      row.appendChild(name);
      if (item.statsKey && STATS[item.statsKey] != null) {
        const count = document.createElement('span');
        count.className = 'lp-terminal-row-count';
        count.textContent = `${formatStat(STATS[item.statsKey])} entries`;
        row.appendChild(count);
      }
      row.style.animationDelay = reduceMotion ? '0ms' : `${(index + cursor) * outputStagger}ms`;
      outputEl.appendChild(row);
    });
  }

  function typeCommand(text, onDone) {
    commandEl.textContent = '';
    if (reduceMotion) {
      commandEl.textContent = text;
      onDone();
      return;
    }

    let i = 0;
    const tick = () => {
      if (i >= text.length) {
        onDone();
        return;
      }
      const ch = text.charAt(i);
      commandEl.textContent += ch;
      i += 1;
      const base = (ch === '&' || ch === ' ' || ch === '/') ? punctuationDelay : (charDelayMin + Math.random() * (charDelayMax - charDelayMin));
      const t = window.setTimeout(tick, base);
      typingTimers.push(t);
    };
    tick();
  }

  function runStep(idx) {
    clearAdvanceTimer();
    clearTypingTimers();
    stepIndex = ((idx % TERMINAL_FLOW.length) + TERMINAL_FLOW.length) % TERMINAL_FLOW.length;
    const step = TERMINAL_FLOW[stepIndex];

    if (pathEl) pathEl.textContent = step.cwd;
    if (cwdEl) cwdEl.textContent = step.cwd;
    outputEl.innerHTML = '';
    screen.classList.add('is-typing');

    const resolved = resolveStep(step);
    typeCommand(step.command, () => {
      screen.classList.remove('is-typing');
      const t = window.setTimeout(() => {
        setOutput(resolved.items, resolved.comment);
        scheduleNext();
      }, preOutputBeat);
      typingTimers.push(t);
    });
  }

  function scheduleNext() {
    clearAdvanceTimer();
    if (isPaused()) return;
    advanceTimer = window.setTimeout(() => runStep(stepIndex + 1), restAfterOutput);
  }

  function togglePause() {
    pausedByUser = !pausedByUser;
    if (pauseBtn) {
      pauseBtn.textContent = pausedByUser ? 'Resume' : 'Pause';
      pauseBtn.setAttribute('aria-pressed', String(pausedByUser));
    }
    if (pausedByUser) {
      clearAdvanceTimer();
    } else if (!pausedByHover) {
      scheduleNext();
    }
  }

  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  if (nextBtn) nextBtn.addEventListener('click', () => runStep(stepIndex + 1));

  root.addEventListener('mouseenter', () => {
    pausedByHover = true;
    clearAdvanceTimer();
  });
  root.addEventListener('mouseleave', () => {
    pausedByHover = false;
    if (!pausedByUser) scheduleNext();
  });

  runStep(0);
}

function initHeroStatsStream() {
  const el = document.querySelector('.lp-hero-stats');
  if (!el || el.dataset.streamed === 'true') return;
  el.dataset.streamed = 'true';

  const fromStats = `${formatStat(STATS.papers)} papers · ${formatStat(STATS.models)} models · ${formatStat(STATS.datasets)} datasets · ${formatStat(STATS.companies)} companies`;
  const fallback = (el.dataset.streamText || el.textContent || '').trim();
  const fullText = fromStats || fallback;
  if (!fullText) return;
  el.setAttribute('aria-label', fullText);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    el.classList.add('is-streamed');
    return;
  }

  el.textContent = '';
  el.classList.add('is-streaming');
  const caret = document.createElement('span');
  caret.className = 'lp-hero-stats-caret';
  caret.setAttribute('aria-hidden', 'true');
  el.appendChild(caret);

  let i = 0;
  const charInterval = 26;
  const punctuationPause = 110;
  const step = () => {
    if (i >= fullText.length) {
      el.classList.remove('is-streaming');
      el.classList.add('is-streamed');
      window.setTimeout(() => caret.remove(), 1400);
      return;
    }
    const char = fullText.charAt(i);
    caret.insertAdjacentText('beforebegin', char);
    i += 1;
    const delay = char === '·' || char === ',' ? punctuationPause : charInterval;
    window.setTimeout(step, delay);
  };
  window.setTimeout(step, 820);
}
