import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer } from "react";
import { AmbientLight, BackSide, BufferGeometry, CanvasTexture, Color, ConeGeometry, DirectionalLight, DoubleSide, Float32BufferAttribute, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial, PerspectiveCamera, Points, PointsMaterial, Raycaster, RingGeometry, Scene, SphereGeometry, Sprite, SpriteMaterial, Vector2, Vector3, WebGLRenderer } from "three";


const SHIP_ROUTES=[
{n:"China Coast → Japan",t:"trade",pts:[[31.2,121.5],[30,124],[29,128],[30,132],[32,136],[34,140.5],[35.4,139.6]]},
{n:"China → Korea",t:"trade",pts:[[36.1,120.4],[35,122],[34,124],[34,127],[35.1,129]]},
{n:"W.Australia → China",t:"commodity",pts:[[-20.4,118.6],[-13,116],[-8.5,115.7],[-6,115],[-5.5,112],[-5,109],[-3,107],[0,106],[2,106],[5,107],[8,109],[12,113],[15,115],[18,117],[21,122],[23,124],[26,124],[29,123],[31.2,121.5]]},
{n:"E.Australia → China",t:"commodity",pts:[[-32.9,151.8],[-28,155],[-20,157],[-10,155],[0,148],[8,142],[15,137],[20,130],[23,127],[26,124],[29,123],[31.2,121.5]]},
{n:"E.Australia → Japan",t:"commodity",pts:[[-21.3,149.3],[-15,154],[-5,153],[5,150],[15,147],[25,143],[30,142],[34,140.5],[35.4,139.6]]},
{n:"SW.Australia → India",t:"commodity",pts:[[-32.0,115.7],[-33,108],[-32,98],[-28,88],[-20,78],[-12,72],[-3,68],[5,67],[12,68],[18.95,72.95]]},
{n:"Indian Ocean → Singapore",t:"trade",pts:[[6,94],[5.5,96.5],[4.5,99],[3,101],[1.3,103.8]]},
{n:"Singapore → Shanghai",t:"trade",pts:[[1.3,103.8],[3,106],[5,107],[8,109],[12,113],[15,115],[18,117],[21,122],[23,124],[26,124],[29,123],[31.2,121.5]]},
{n:"Singapore → Japan",t:"trade",pts:[[1.3,103.8],[3,106],[5,107],[8,110],[12,114],[15,117],[18,118],[20,126],[24,131],[28,136],[32,140],[34,140.5],[35.4,139.6]]},
{n:"Singapore → Suez",t:"trade",pts:[[1.3,103.8],[3,101],[5.5,96.5],[6,94],[6,86],[6,78],[5,72],[8,65],[12,58],[12.6,43.3]]},
{n:"Suez → Gibraltar",t:"trade",pts:[[31.3,32.3],[32,30],[33,26],[34,22],[34.5,17],[35.5,12],[36.5,6],[37,1],[36,-4],[35.96,-5.6]]},
{n:"Gibraltar → Rotterdam",t:"trade",pts:[[35.96,-5.6],[37,-9.5],[40,-11],[44,-10],[48,-6],[50,-1],[51.9,4.5]]},
{n:"Rotterdam → New York area",t:"trade",pts:[[51.9,4.5],[51,-3],[50,-12],[48,-22],[45,-35],[42,-50],[40,-65],[38,-72]]},
{n:"North Atlantic → Gulf",t:"trade",pts:[[38,-72],[32,-78],[28,-79],[25,-79],[24,-80],[24,-84],[25,-88],[28,-92],[29.35,-94.78]]},
{n:"Gulf → Panama",t:"trade",pts:[[29.35,-94.78],[26,-90],[22,-87],[18,-84],[14,-81],[9.1,-79.7]]},
{n:"Brazil → Rotterdam",t:"commodity",pts:[[-20.3,-40.2],[-15,-37],[-5,-30],[5,-24],[15,-21],[25,-20],[32,-17],[38,-12],[42,-10],[48,-6],[51.9,4.5]]},
{n:"Brazil N → Rotterdam",t:"commodity",pts:[[-2.6,-44.3],[3,-38],[10,-28],[20,-22],[28,-19],[35,-15],[40,-11],[48,-6],[51.9,4.5]]},
{n:"W.Africa → Rotterdam",t:"commodity",pts:[[9.5,-13.7],[10,-18],[12,-22],[16,-23],[20,-22],[25,-20],[30,-17],[35,-15],[40,-11],[48,-6],[51.9,4.5]]},
{n:"Chile → Cape Horn → Rotterdam",t:"commodity",pts:[[-23.7,-70.4],[-24,-74],[-26,-76],[-30,-78],[-36,-78],[-42,-78],[-48,-77],[-53,-74],[-56,-68],[-56,-55],[-50,-38],[-40,-22],[-25,-15],[-10,-13],[5,-18],[12,-22],[20,-22],[30,-17],[35,-15],[40,-11],[48,-6],[51.9,4.5]]},
{n:"S.Africa → Rotterdam (Cape)",t:"commodity",pts:[[-33,18],[-36,14],[-37,6],[-35,-2],[-28,-8],[-18,-11],[-8,-13],[2,-17],[12,-22],[20,-22],[28,-19],[35,-15],[40,-11],[48,-6],[51.9,4.5]]},
{n:"S.Africa → Singapore → China",t:"commodity",pts:[[-33,18],[-36,20],[-38,30],[-38,40],[-36,50],[-30,58],[-20,65],[-8,72],[0,78],[5,86],[6,94],[5.5,96.5],[3,101],[1.3,103.8],[3,106],[5,107],[8,109],[12,113],[15,115],[18,117],[21,122],[23,124],[26,124],[29,123],[31.2,121.5]]},
{n:"E.Africa → India",t:"commodity",pts:[[-28.8,32.1],[-24,36],[-18,40],[-11,42],[-6,50],[0,56],[5,62],[12,68],[18.95,72.95]]},
{n:"Suez → Bab el-Mandeb",t:"trade",pts:[[29.9,32.6],[27,34.5],[24,36.5],[22,38],[19,40],[16,42],[12.6,43.3]]},
{n:"Hormuz → Suez",t:"trade",pts:[[26.56,56.25],[25,58],[22,59],[16,56],[12,52],[12.6,43.3]]},
{n:"Hormuz → Singapore → China",t:"trade",pts:[[26.56,56.25],[25,58],[22,61],[16,65],[10,70],[5,78],[6,86],[6,94],[5.5,96.5],[3,101],[1.3,103.8],[3,106],[5,107],[8,109],[12,113],[15,115],[18,117],[21,122],[23,124],[26,124],[29,123],[31.2,121.5]]},
{n:"Hormuz → India",t:"trade",pts:[[26.56,56.25],[25,58],[22,61],[19,65],[18.95,72.95]]},
{n:"Murmansk → Rotterdam",t:"trade",pts:[[69,33.1],[71,28],[71.5,20],[70,12],[67,7],[62,3],[58,3],[54,3],[51.9,4.5]]},
{n:"Sulawesi → China",t:"commodity",pts:[[-2.5,121.8],[-4,121],[-6,119.5],[-6,117.5],[-3,117],[0,119],[2,119],[5,118],[8,116],[10,115],[12,113],[15,115],[18,117],[21,122],[23,124],[26,124],[29,123],[31.2,121.5]]},
{n:"W.Africa → Singapore → China",t:"commodity",pts:[[9.5,-13.7],[5,-14],[0,-10],[-10,-8],[-22,0],[-30,8],[-36,14],[-38,30],[-38,40],[-36,50],[-28,58],[-18,65],[-5,72],[0,78],[6,94],[5.5,96.5],[3,101],[1.3,103.8],[7,112],[18,118],[23,124],[25,124],[31.2,121.5]]},
];
const PORTS=[
{n:"Shanghai",la:31.2,ln:121.5,t:"commodity",c:"#60a5fa",cm:["Copper","Iron Ore"]},
{n:"Ningbo-Zhoushan",la:29.9,ln:122.1,t:"commodity",c:"#60a5fa",cm:["Iron Ore"]},
{n:"Qingdao",la:36.1,ln:120.4,t:"commodity",c:"#60a5fa",cm:["Iron Ore"]},
{n:"Tianjin",la:39.0,ln:117.7,t:"commodity",c:"#60a5fa",cm:["Copper"]},
{n:"Busan",la:35.1,ln:129.0,t:"trade",c:"#3b82f6"},
{n:"Yokohama",la:35.4,ln:139.6,t:"trade",c:"#3b82f6"},
{n:"Port Hedland",la:-20.3,ln:118.6,t:"commodity",c:"#a64b3d",cm:["Iron Ore"]},
{n:"Dampier",la:-20.7,ln:116.7,t:"commodity",c:"#a64b3d",cm:["Iron Ore"]},
{n:"Hay Point",la:-21.3,ln:149.3,t:"commodity",c:"#4a4f57",cm:["Coal"]},
{n:"Newcastle",la:-32.9,ln:151.8,t:"commodity",c:"#4a4f57",cm:["Coal"]},
{n:"Esperance",la:-33.9,ln:121.9,t:"commodity",c:"#7fa893",cm:["Nickel"]},
{n:"Singapore",la:1.3,ln:103.8,t:"trade",c:"#3b82f6"},
{n:"Rotterdam",la:51.9,ln:4.5,t:"trade",c:"#3b82f6"},
{n:"Houston",la:29.35,ln:-94.78,t:"trade",c:"#3b82f6"},
{n:"Antofagasta",la:-23.7,ln:-70.4,t:"commodity",c:"#c87844",cm:["Copper"]},
{n:"Callao",la:-12.0,ln:-77.1,t:"commodity",c:"#c87844",cm:["Copper"]},
{n:"Richards Bay",la:-28.8,ln:32.1,t:"commodity",c:"#4a4f57",cm:["Coal"]},
{n:"Durban",la:-29.9,ln:31.0,t:"commodity",c:"#c87844",cm:["Copper"]},
{n:"Saldanha Bay",la:-33.0,ln:18.0,t:"commodity",c:"#a64b3d",cm:["Iron Ore"]},
{n:"Maputo",la:-26.0,ln:32.6,t:"commodity",c:"#4a4f57",cm:["Coal"]},
{n:"Conakry",la:9.5,ln:-13.7,t:"commodity",c:"#b48a64",cm:["Bauxite"]},
{n:"Murmansk",la:69.0,ln:33.1,t:"trade",c:"#3b82f6"},
{n:"Townsville",la:-19.3,ln:146.8,t:"commodity",c:"#c87844",cm:["Copper","Zinc"]},
{n:"Mumbai",la:18.95,ln:72.95,t:"commodity",c:"#a64b3d",cm:["Iron Ore"]},
{n:"Strait of Malacca",la:4.5,ln:99.0,t:"choke",c:"#f59e0b"},
{n:"Strait of Hormuz",la:26.56,ln:56.25,t:"choke",c:"#f59e0b"},
{n:"Suez Canal",la:31.3,ln:32.3,t:"choke",c:"#f59e0b"},
{n:"Strait of Gibraltar",la:35.96,ln:-5.6,t:"choke",c:"#f59e0b"},
{n:"Bab el-Mandeb",la:12.6,ln:43.3,t:"choke",c:"#f59e0b"},
{n:"Cape of Good Hope",la:-34.4,ln:18.5,t:"choke",c:"#f59e0b"},
{n:"Cape Horn",la:-55.98,ln:-67.27,t:"choke",c:"#f59e0b"},
{n:"Panama Canal",la:9.1,ln:-79.7,t:"choke",c:"#f59e0b"},
{n:"Lombok Strait",la:-8.5,ln:115.7,t:"choke",c:"#f59e0b"},
{n:"Sept-Îles",la:50.2,ln:-66.4,t:"commodity",c:"#a64b3d",cm:["Iron Ore"]},
{n:"Nouadhibou",la:20.9,ln:-17.0,t:"commodity",c:"#a64b3d",cm:["Iron Ore"]},
{n:"Vitória",la:-20.3,ln:-40.2,t:"commodity",c:"#a64b3d",cm:["Iron Ore"]},
{n:"São Luís",la:-2.6,ln:-44.3,t:"commodity",c:"#a64b3d",cm:["Iron Ore"]},
{n:"Darwin",la:-12.5,ln:130.8,t:"commodity",c:"#a3d97d",cm:["Uranium"]},
{n:"Lae",la:-6.7,ln:147.0,t:"commodity",c:"#c87844",cm:["Copper"]},
{n:"Port Adelaide",la:-34.8,ln:138.5,t:"commodity",c:"#c87844",cm:["Copper"]},
{n:"Manila",la:14.6,ln:120.97,t:"trade",c:"#3b82f6"},
{n:"Thunder Bay",la:48.4,ln:-89.2,t:"commodity",c:"#c87844",cm:["Copper"]},
{n:"Prince Rupert",la:54.3,ln:-130.3,t:"commodity",c:"#c87844",cm:["Copper"]},
{n:"Makassar Strait",la:0.0,ln:119.0,t:"choke",c:"#f59e0b"},
];
const MINE_PORT={"Escondida":"Antofagasta","Chuquicamata":"Antofagasta","El Teniente":"Antofagasta","Los Pelambres":"Antofagasta","Spence":"Antofagasta","Collahuasi":"Antofagasta","Centinela":"Antofagasta","Cerro Verde":"Callao","Antamina":"Callao","Las Bambas":"Callao","Constancia":"Callao","Toromocho":"Callao","Quellaveco":"Callao","Grasberg":"Shanghai","Batu Hijau":"Shanghai","Kamoa-Kakula":"Durban","Kibali":"Durban","Boddington":"Esperance","Cadia Valley":"Newcastle","Carrapateena":"Port Adelaide","Olympic Dam":"Port Adelaide","Prominent Hill":"Port Adelaide","Tropicana":"Esperance","Tanami":"Darwin","Kalgoorlie Super Pit":"Esperance","Greenbushes":"Esperance","Carajás S11D":"São Luís","Carajás Serra Norte":"São Luís","Pilbara (Rio Tinto)":"Port Hedland","Chichester Hub":"Port Hedland","Christmas Creek":"Port Hedland","Cloudbreak":"Port Hedland","Brockman 4":"Port Hedland","Mt Whaleback":"Port Hedland","Fortescue (Chichester)":"Port Hedland","Kiruna":"Murmansk","Morenci":"Houston","Bingham Canyon":"Houston","Detour Lake":"Thunder Bay","Canadian Malartic":"Sept-Îles","Pueblo Viejo":"Houston","Richards Bay Coal":"Richards Bay","Cannington":"Townsville","George Fisher":"Townsville","Eloise":"Townsville","Simandou (Blocks 1&2)":"Conakry","Simandou (Blocks 3&4)":"Conakry","Boke":"Conakry","Reko Diq":"Houston","Thacker Pass":"Houston"};
const COUNTRY_INFO={
"Australia":{pop:"26.5M",gdp:"$1.7T",mining:"13.4%",currency:"AUD",topCommodities:"Fe · Au · Li · Coal"},
"Canada":{pop:"40.1M",gdp:"$2.1T",mining:"4.8%",currency:"CAD",topCommodities:"Au · K · Cu · Ni"},
"Chile":{pop:"19.7M",gdp:"$317B",mining:"12.1%",currency:"CLP",topCommodities:"Cu · Li · Mo"},
"United States":{pop:"334M",gdp:"$28.8T",mining:"1.4%",currency:"USD",topCommodities:"Au · Cu · Coal"},
"China":{pop:"1.42B",gdp:"$18.5T",mining:"8.2%",currency:"CNY",topCommodities:"Coal · Au · Fe · REE"},
"Peru":{pop:"34.4M",gdp:"$268B",mining:"9.6%",currency:"PEN",topCommodities:"Cu · Au · Zn · Ag"},
"Brazil":{pop:"216M",gdp:"$2.2T",mining:"4.1%",currency:"BRL",topCommodities:"Fe · Au · Bauxite"},
"Russia":{pop:"144M",gdp:"$2.2T",mining:"6.8%",currency:"RUB",topCommodities:"Au · Ni · Diamonds"},
"DR Congo":{pop:"102M",gdp:"$67B",mining:"31.2%",currency:"CDF",topCommodities:"Cu · Co · Diamonds"},
"Indonesia":{pop:"277M",gdp:"$1.4T",mining:"8.4%",currency:"IDR",topCommodities:"Ni · Cu · Au · Sn"},
"South Africa":{pop:"62M",gdp:"$399B",mining:"7.5%",currency:"ZAR",topCommodities:"PGMs · Au · Coal · Cr"},
"Mexico":{pop:"130M",gdp:"$1.8T",mining:"3.2%",currency:"MXN",topCommodities:"Cu · Au · Ag · Zn"},
"Ghana":{pop:"34M",gdp:"$76B",mining:"6.8%",currency:"GHS",topCommodities:"Au · Bauxite · Mn"},
"Mongolia":{pop:"3.4M",gdp:"$18B",mining:"24%",currency:"MNT",topCommodities:"Cu · Au · Coal"},
"India":{pop:"1.44B",gdp:"$3.9T",mining:"2.4%",currency:"INR",topCommodities:"Fe · Coal · Cr"},
"Sweden":{pop:"10.5M",gdp:"$590B",mining:"1.2%",currency:"SEK",topCommodities:"Fe · Cu · Zn · Au"},
"Philippines":{pop:"117M",gdp:"$435B",mining:"1.8%",currency:"PHP",topCommodities:"Ni · Au · Cu"},
"Argentina":{pop:"46M",gdp:"$641B",mining:"3.5%",currency:"ARS",topCommodities:"Li · Au · Cu · Ag"},
"Tanzania":{pop:"65M",gdp:"$79B",mining:"5.2%",currency:"TZS",topCommodities:"Au · Diamonds · Ni"},
"Guinea":{pop:"14M",gdp:"$22B",mining:"28%",currency:"GNF",topCommodities:"Bauxite · Au · Fe"},
"Colombia":{pop:"52M",gdp:"$344B",mining:"4.8%",currency:"COP",topCommodities:"Coal · Au · Ni"},
"Zambia":{pop:"20M",gdp:"$29B",mining:"12%",currency:"ZMW",topCommodities:"Cu · Co"},
"Finland":{pop:"5.6M",gdp:"$300B",mining:"0.6%",currency:"EUR",topCommodities:"Ni · Cr · Zn"},
"Burkina Faso":{pop:"23M",gdp:"$19B",mining:"15%",currency:"XOF",topCommodities:"Au · Zn · Mn"},
"Morocco":{pop:"37M",gdp:"$142B",mining:"2.8%",currency:"MAD",topCommodities:"Phosphate"},
"Papua New Guinea":{pop:"10M",gdp:"$30B",mining:"18%",currency:"PGK",topCommodities:"Au · Cu"},
"Kazakhstan":{pop:"20M",gdp:"$261B",mining:"16%",currency:"KZT",topCommodities:"U · Cu · Au · Cr"},
"Mali":{pop:"22M",gdp:"$19B",mining:"8%",currency:"XOF",topCommodities:"Au"},
"Botswana":{pop:"2.6M",gdp:"$19B",mining:"22%",currency:"BWP",topCommodities:"Diamonds · Cu · Ni"},
"Namibia":{pop:"2.6M",gdp:"$13B",mining:"12%",currency:"NAD",topCommodities:"U · Diamonds · Zn"},
"Uzbekistan":{pop:"36M",gdp:"$92B",mining:"8%",currency:"UZS",topCommodities:"Au · U · Cu"},
"Ecuador":{pop:"18M",gdp:"$115B",mining:"2%",currency:"USD",topCommodities:"Au · Cu"},
"Serbia":{pop:"6.6M",gdp:"$75B",mining:"1.8%",currency:"RSD",topCommodities:"Cu · Au · Li"},
"Dominican Republic":{pop:"11M",gdp:"$114B",mining:"1.5%",currency:"DOP",topCommodities:"Au · Ag"},
"Madagascar":{pop:"30M",gdp:"$15B",mining:"4%",currency:"MGA",topCommodities:"Ni · Co · Ti"},
"Mozambique":{pop:"33M",gdp:"$18B",mining:"10%",currency:"MZN",topCommodities:"Coal · Ti · Au"},
"Zimbabwe":{pop:"16M",gdp:"$28B",mining:"12%",currency:"ZWL",topCommodities:"PGMs · Diamonds · Au"},
"Ivory Coast":{pop:"28M",gdp:"$78B",mining:"3%",currency:"XOF",topCommodities:"Au · Mn"},
"Eritrea":{pop:"3.7M",gdp:"$2B",mining:"8%",currency:"ERN",topCommodities:"Cu · Zn · Au"},
};


const CC={"Copper":"#e8722a","Gold":"#f5c518","Iron Ore":"#e03020","Zinc":"#5ba3f5","Nickel":"#22c97a","Lithium":"#22aaff","Silver":"#d0dce8","Lead":"#7a99cc","Cobalt":"#3b6ff5","Uranium":"#7deb3a","Diamonds":"#22e8f5","Platinum":"#e8e8f5","Palladium":"#c488f5","Coal (Met)":"#8896a8","Manganese":"#e030c0","Bauxite":"#e08830","Tin":"#60c0f0","Chromite":"#f56030","Titanium":"#3a80f5","Phosphate":"#20d860","Rare Earths":"#f030a0","Potash":"#f060c8","Molybdenum":"#90a8c0"};
const getCC=(commodities)=>{if(!commodities||!commodities.length)return"#ff9944";return CC[commodities[0]]||"#ff9944";};

const CONT={"Australia":"Oceania","Papua New Guinea":"Oceania","New Zealand":"Oceania","New Caledonia":"Oceania","Indonesia":"Asia","Philippines":"Asia","China":"Asia","Mongolia":"Asia","Japan":"Asia","India":"Asia","Kazakhstan":"Asia","Uzbekistan":"Asia","Turkey":"Asia","Saudi Arabia":"Asia","Pakistan":"Asia","Myanmar":"Asia","United States":"North America","Canada":"North America","Mexico":"North America","Dominican Republic":"North America","Cuba":"North America","Guatemala":"North America","Brazil":"South America","Chile":"South America","Peru":"South America","Argentina":"South America","Colombia":"South America","Ecuador":"South America","Guyana":"South America","Suriname":"South America","Bolivia":"South America","South Africa":"Africa","Ghana":"Africa","Tanzania":"Africa","DR Congo":"Africa","Zambia":"Africa","Burkina Faso":"Africa","Mali":"Africa","Guinea":"Africa","Senegal":"Africa","Ivory Coast":"Africa","Mauritania":"Africa","Namibia":"Africa","Botswana":"Africa","Zimbabwe":"Africa","Mozambique":"Africa","Madagascar":"Africa","Egypt":"Africa","Morocco":"Africa","Niger":"Africa","Liberia":"Africa","Sierra Leone":"Africa","Eritrea":"Africa","Ethiopia":"Africa","Sweden":"Europe","Finland":"Europe","Norway":"Europe","United Kingdom":"Europe","Ireland":"Europe","Spain":"Europe","Portugal":"Europe","Greece":"Europe","Serbia":"Europe","Poland":"Europe","Germany":"Europe","France":"Europe","Russia":"Europe","Ukraine":"Europe"};

const GOV={"Australia":{reg:"Low",score:82},"Canada":{reg:"Low",score:84},"Sweden":{reg:"Low",score:85},"Finland":{reg:"Low",score:86},"Norway":{reg:"Low",score:89},"Ireland":{reg:"Low",score:80},"New Zealand":{reg:"Low",score:88},"United Kingdom":{reg:"Low",score:78},"United States":{reg:"Low",score:76},"Germany":{reg:"Low",score:83},"France":{reg:"Low",score:77},"Portugal":{reg:"Low",score:75},"Spain":{reg:"Low",score:73},"Chile":{reg:"Low",score:72},"Botswana":{reg:"Low",score:71},"Poland":{reg:"Medium",score:62},"Namibia":{reg:"Medium",score:64},"Brazil":{reg:"Medium",score:58},"Peru":{reg:"Medium",score:54},"Argentina":{reg:"Medium",score:52},"South Africa":{reg:"Medium",score:55},"India":{reg:"Medium",score:53},"Mexico":{reg:"Medium",score:48},"Colombia":{reg:"Medium",score:46},"Indonesia":{reg:"Medium",score:50},"Philippines":{reg:"Medium",score:49},"Ecuador":{reg:"Medium",score:44},"Morocco":{reg:"Medium",score:52},"Tanzania":{reg:"Medium",score:46},"Zambia":{reg:"Medium",score:48},"Ghana":{reg:"Medium",score:56},"Senegal":{reg:"Medium",score:54},"Ivory Coast":{reg:"Medium",score:45},"Serbia":{reg:"Medium",score:51},"Mongolia":{reg:"Medium",score:49},"Dominican Republic":{reg:"Medium",score:47},"Guyana":{reg:"Medium",score:50},"Papua New Guinea":{reg:"High",score:34},"Saudi Arabia":{reg:"High",score:35},"New Caledonia":{reg:"Low",score:74},"Ethiopia":{reg:"High",score:32},"China":{reg:"High",score:40},"Russia":{reg:"High",score:24},"Egypt":{reg:"High",score:38},"Madagascar":{reg:"High",score:36},"Mozambique":{reg:"High",score:32},"Zimbabwe":{reg:"High",score:28},"Myanmar":{reg:"High",score:22},"Turkey":{reg:"High",score:37},"Nigeria":{reg:"High",score:26},"Kazakhstan":{reg:"High",score:38},"Uzbekistan":{reg:"High",score:36},"Pakistan":{reg:"High",score:30},"Kyrgyzstan":{reg:"High",score:32},"Laos":{reg:"High",score:26},"Cuba":{reg:"High",score:22},"Bolivia":{reg:"High",score:38},"Mali":{reg:"Extreme",score:20},"Burkina Faso":{reg:"Extreme",score:18},"Niger":{reg:"Extreme",score:22},"DR Congo":{reg:"Extreme",score:16},"DRC":{reg:"Extreme",score:16},"Guinea":{reg:"High",score:30},"Angola":{reg:"High",score:28},"Gabon":{reg:"High",score:36},"Mauritania":{reg:"High",score:34}};
const govColor=reg=>reg==="Low"?"#34d399":reg==="Medium"?"#f59e0b":reg==="High"?"#f97316":reg==="Extreme"?"#ef4444":"#6b7280";
const govLabel=reg=>reg==="Low"?"Low Risk":reg==="Medium"?"Medium Risk":reg==="High"?"High Risk":reg==="Extreme"?"Extreme Risk":"Unknown";

const TypeColors={"Open Pit":"#e87d3e","Underground":"#60a5fa","Open Pit & Underground":"#a78bfa","Sub-Level Caving":"#38bdf8","Block Caving":"#818cf8"};
const getTypeColor=t=>TypeColors[t]||"#9ca3af";
const MethodColors={"Conventional":"#e87d3e","Open Stoping":"#c084fc","Block Caving":"#60a5fa","Sub Level Caving":"#38bdf8","Longwall":"#34d399","Deep Level":"#818cf8","Dragline":"#2dd4bf","Cut & Fill":"#fb923c"};
const getMethodColor=m=>MethodColors[m]||"#9ca3af";
const normCompany=c=>{const s=c.split("/")[0].split("(")[0].trim();return s};
const companyPalette=["#e87d3e","#60a5fa","#a78bfa","#34d399","#f472b6","#fbbf24","#22d3ee","#fb923c","#818cf8","#2dd4bf","#e879f9","#a3e635","#f97316","#3b82f6","#8b5cf6","#10b981","#ec4899","#eab308","#06b6d4","#f59e0b"];
const companyColorMap={};let compIdx=0;
const getCompanyColor=c=>{if(!companyColorMap[c])companyColorMap[c]=companyPalette[compIdx++%companyPalette.length];return companyColorMap[c]};

const M=[{"n":"Agnew-Lawlers","c":"Australia","la":-27.58,"ln":120.64,"co":["Gold"],"pc":"Gold","cp":"Gold Fields","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of Gold Fields Australia region","em":"~600","dp":"~1000m","d":1895,"o":1977,"rv":"~$310M","no":"Long-life underground gold"},{"n":"Ahafo","c":"Ghana","la":7.0,"ln":-2.35,"co":["Gold"],"pc":"Gold","cp":"Newmont","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"798koz Au (CY2024, Ahafo South)","em":"~5,500","dp":"~500m","d":2000,"o":2006,"rv":"~$1.9B","no":"Includes Ahafo North expansion","rs":"~70Mt @ 1.8 g/t Au","gr":"1.8 g/t Au"},{"n":"Aitik","c":"Sweden","la":67.07,"ln":20.96,"co":["Copper","Gold","Silver"],"pc":"Copper","cp":"Boliden","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Boliden Mines ~36Mt ore milled; ~70kt Cu","em":"~800","dp":"~450m","d":1932,"o":1968,"rv":"~$665M","rs":"~700Mt","no":"Largest OP copper mine in Europe"},{"n":"Aljustrel","c":"Portugal","la":37.88,"ln":-8.16,"co":["Zinc","Copper"],"pc":"Copper","cp":"Almina","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Zn-Cu; Portugal","em":"~800","dp":"~700m","d":1200,"o":1850,"rv":"~$95M"},{"n":"Allan","c":"Canada","la":51.98,"ln":-105.97,"co":["Potash"],"pc":"Potash","cp":"Nutrien","t":"Underground","m":"Longwall","st":"Operating","pr":"Part of Nutrien potash ~14Mt KCl","em":"~600","dp":"~1000m","d":1954,"o":1968,"rv":"~$750M"},{"n":"Amandelbult","c":"South Africa","la":-24.82,"ln":27.77,"co":["PGMs","Nickel","Copper"],"pc":"Copper","cp":"Anglo American Platinum","t":"Underground","m":"Deep Level","st":"Operating","pr":"PGMs; UG Merensky/UG2","em":"~10,000","dp":"~1200m","d":1919,"o":1925,"rv":"~$237M","rs":"~150Mt","no":"Merensky & UG2 reef mining"},{"n":"Ambatovy","c":"Madagascar","la":-18.82,"ln":48.43,"co":["Nickel","Cobalt"],"pc":"Nickel","cp":"Sumitomo / Korea Resources","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni-Co; Madagascar; hydromet","em":"~5,000","dp":null,"d":2003,"o":2012,"rv":"~$742M","rs":"~120Mt","gr":"1.0% Ni, 0.1% Co","no":"$8B+ capital cost, largest investme"},{"n":"Andina","c":"Chile","la":-33.15,"ln":-70.27,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Codelco","t":"Underground","m":"Block Caving","st":"Operating","pr":"Part of Codelco total; open pit + UG","em":"~3,200","dp":"~3800m","d":1920,"o":1970,"rv":"~$1.4B","rs":"~5.4Bt @ 0.52% Cu","gr":"0.52% Cu"},{"n":"Antamina","c":"Peru","la":-9.57,"ln":-77.05,"co":["Copper","Zinc","Molybdenum"],"pc":"Copper","cp":"BHP / Glencore / Teck / Mitsub","t":"Open Pit","m":"Conventional","st":"Operating","pr":"~144kt Cu; 103kt Zn; 1,822t Mo (100% basis CY24)","em":"~3,500","dp":"~600m","d":1860,"o":2001,"rv":"~$1.4B","rs":"~1.5Bt","gr":"1.0% Cu, 1.0% Zn","no":"Largest Cu-Zn mine, at 4,300m"},{"n":"Appin","c":"Australia","la":-34.2,"ln":150.8,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"South32","t":"Underground","m":"Longwall","st":"Operating","pr":"Met coal; Illawarra Metallurgical Coal","em":"~700","dp":"~500m","d":1960,"o":1962,"rv":"~$1.8B"},{"n":"Bagdad","c":"United States","la":34.58,"ln":-113.21,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Freeport-McMoRan","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of FCX Americas Cu production","em":"~2,000","dp":"~400m","d":1882,"o":1928,"rv":"~$950M","rs":"~2.0Bt","no":"140+ years of mining"},{"n":"Bailadila","c":"India","la":18.65,"ln":81.25,"co":["Iron Ore"],"pc":"Iron Ore","cp":"NMDC","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Iron ore; India NMDC ~35Mt","em":"~5,000","dp":"~100m","d":1961,"o":1968,"rv":"~$3.9B"},{"n":"Bangka Tin","c":"Indonesia","la":-2.1,"ln":106.11,"co":["Tin"],"pc":"Tin","cp":"PT Timah","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Sn; Indonesia; ~50kt Sn","em":"~3,000","dp":null,"d":1709,"o":1850,"rv":"~$1.4B","no":"World's second largest tin producer"},{"n":"Barro Alto","c":"Brazil","la":-14.97,"ln":-48.96,"co":["Nickel"],"pc":"Nickel","cp":"Anglo American","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ferronickel; part of Anglo Ni ops","em":"~1,200","dp":"~80m","d":1960,"o":2011,"rv":"~$330M"},{"n":"Batu Hijau","c":"Indonesia","la":-8.97,"ln":116.87,"co":["Copper","Gold"],"pc":"Copper","cp":"PT Amman Mineral Nusa Tenggara","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Au; Indonesia","em":"~8,000","dp":"~500m","d":1987,"o":1999,"rv":"~$808M","rs":"~1.5Bt","gr":"0.4% Cu","no":"IPO valued company at ~$30B"},{"n":"Bayan Obo","c":"China","la":41.78,"ln":109.97,"co":["Rare Earths","Iron Ore"],"pc":"Rare Earths","cp":"Baotou Steel / Northern Rare E","t":"Open Pit","m":"Conventional","st":"Operating","pr":"World's largest REE deposit; China","em":"~10,000","dp":"~100m","d":1927,"o":1957,"rv":"~$750M","rs":"~600Mt","gr":"3-5% REO","no":"World's largest rare earth deposit,"},{"n":"Beatrix","c":"South Africa","la":-28.26,"ln":26.79,"co":["Gold"],"pc":"Gold","cp":"Sibanye-Stillwater","t":"Underground","m":"Deep Level","st":"Operating","pr":"SA gold ops","em":"~3,500","dp":"~2200m","d":1938,"o":1953,"rv":"~$597M"},{"n":"Benguerir","c":"Morocco","la":32.23,"ln":-7.95,"co":["Phosphate"],"pc":"Phosphate","cp":"OCP Group","t":"Open Pit","m":"Dragline","st":"Operating","pr":"Phosphate; Morocco","em":"~3,000","dp":"~50m","d":1978,"o":1980,"rv":"~$3.0B"},{"n":"Berezniki","c":"Russia","la":59.41,"ln":56.8,"co":["Potash"],"pc":"Potash","cp":"Uralkali","t":"Underground","m":"Longwall","st":"Operating","pr":"Potash; Russia; Uralkali ~12Mt KCl total","em":"~8,000","dp":"~400m","d":1906,"o":1932,"rv":"~$3.6B","no":"Sanctions limiting info"},{"n":"Bingham Canyon","c":"United States","la":40.52,"ln":-112.15,"co":["Copper","Gold","Silver","Molybdenum"],"pc":"Copper","cp":"Rio Tinto (Kennecott)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Impacted by wall movement; ~50kt Cu lost in 2024; ","em":"~2,200","dp":"~1200m","d":1848,"o":1906,"rv":"~$475M","rs":"~1.5Bt","no":"South wall geotechnical issues limi"},{"n":"Bisha","c":"Eritrea","la":15.37,"ln":37.62,"co":["Copper","Zinc","Gold","Silver"],"pc":"Copper","cp":"Zijin Mining (via Nevsun acqui","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Zn; Eritrea","em":"~1,500","dp":"~200m","d":2005,"o":2011,"rv":"~$380M","rs":"~20Mt","no":"Transitioning to base metals"},{"n":"Blackwater","c":"Australia","la":-23.59,"ln":148.88,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Whitehaven Coal (acquired Apr ","t":"Open Pit","m":"Dragline","st":"Operating","pr":"3.6Mt met coal (BHP share, pre-divestment Apr 2024","em":"~1,500","dp":"~150m","d":1957,"o":1967,"rv":"~$900M","rs":"~700Mt","no":"Divested by BHP to Whitehaven Coal "},{"n":"Boddington","c":"Australia","la":-32.75,"ln":116.37,"co":["Gold","Copper"],"pc":"Gold","cp":"Newmont","t":"Open Pit","m":"Conventional","st":"Operating","pr":"590koz Au; 18kt Cu (CY2024)","em":"~2,200","dp":"~400m","d":1980,"o":2009,"rv":"~$1.3B","gr":"0.7g/t Au, 0.1% Cu","no":"Australia's largest gold mine by pr","rs":"~390Mt @ 0.72 g/t Au, 0.12% Cu"},{"n":"Boke","c":"Guinea","la":10.93,"ln":-14.3,"co":["Bauxite"],"pc":"Bauxite","cp":"SMB-Winning Consortium","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Bauxite; Guinea; ~40Mt+","em":"~2,000","dp":"~50m","d":1952,"o":1973,"rv":"~$2.0B","no":"One of world's largest bauxite oper"},{"n":"Boliden Area","c":"Sweden","la":64.87,"ln":20.37,"co":["Zinc","Copper","Gold"],"pc":"Copper","cp":"Boliden","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of Boliden Mines; Zn-Cu-Au complex","em":"~500","dp":"~1250m","d":1924,"o":1924,"rv":"~$114M","gr":"3% Zn"},{"n":"Bor","c":"Serbia","la":44.07,"ln":22.1,"co":["Copper","Gold"],"pc":"Copper","cp":"Zijin Mining (acquired RTB Bor","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Cu-Au; Serbia; expansion underway","em":"~5,000","dp":"~600m","d":1904,"o":1904,"rv":"~$190M","rs":"~1.0Bt","gr":"0.3% Cu","no":"120+ years of mining"},{"n":"Brockman 4","c":"Australia","la":-22.34,"ln":117.33,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Pilbara operations: 328Mt total (100% basi","em":"~700","dp":"~100m","d":1961,"o":2010,"rv":"~$2.8B","rs":"~400Mt","no":"Heavy autonomous vehicle deployment"},{"n":"Broken Hill","c":"Australia","la":-31.95,"ln":141.47,"co":["Zinc","Lead","Silver"],"pc":"Zinc","cp":"CBH Resources / Perilya","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Zn-Pb-Ag; historic mine; small scale","em":"~200","dp":"~800m","d":1883,"o":1885,"rv":"~$280M","rs":"~10Mt","no":"Birthplace of BHP, mining since 188","gr":"9.8% Zn, 7.1% Pb, 95 g/t Ag"},{"n":"Brucejack","c":"Canada","la":56.47,"ln":-130.15,"co":["Gold","Silver"],"pc":"Gold","cp":"Newmont","t":"Underground","m":"Open Stoping","st":"Operating","pr":"249koz Au (CY2024; acquired via Newcrest)","em":"~1,000","dp":"~500m","d":2010,"o":2017,"rv":"~$594M","gr":"6.0g/t Au","no":"Extremely high-grade veins"},{"n":"Buenavista del Cobre","c":"Mexico","la":30.96,"ln":-109.9,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Southern Copper (Grupo México)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Mo; ~400kt Cu; Mexico's largest Cu mine","em":"~3,500","dp":"~400m","d":1899,"o":1970,"rv":"~$3.8B","rs":"~5.0Bt","gr":"0.4% Cu","no":"125+ years of production"},{"n":"Bulyanhulu","c":"Tanzania","la":-3.3,"ln":31.8,"co":["Gold"],"pc":"Gold","cp":"Barrick Gold (84%)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of Africa & ME region (Barrick 84%); new decl","em":"~3,000","dp":"~1200m","d":1994,"o":2001,"rv":"~$358M","no":"Deep narrow-vein gold"},{"n":"Cadia Valley","c":"Australia","la":-33.47,"ln":148.99,"co":["Gold","Copper"],"pc":"Gold","cp":"Newmont","t":"Underground","m":"Block Caving","st":"Operating","pr":"464koz Au; ~65kt Cu (CY2024)","em":"~2,000","dp":"~1600m","d":1992,"o":1998,"rv":"~$1.1B","gr":"0.3% Cu, 0.6g/t Au","no":"Australia's largest gold mine, worl","rs":"~2.0Bt @ 0.32% Cu, 0.6 g/t Au"},{"n":"Canadian Malartic","c":"Canada","la":48.13,"ln":-78.13,"co":["Gold"],"pc":"Gold","cp":"Agnico Eagle Mines (100%)","t":"Open Pit & Underground","m":"Open Stoping","st":"Operating","pr":"Part of AEM total ~3.5Moz Au (CY2024 record); Odys","em":"~1,200","dp":"~300m","d":2007,"o":2011,"rv":"~$1.8B","gr":"1.0g/t Au","no":"Odyssey UG expansion adds decades"},{"n":"Cananea","c":"Mexico","la":30.95,"ln":-110.3,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Southern Copper (Grupo México)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Mo; part of Southern Copper Mexico","em":"~3,500","dp":"~500m","d":1899,"o":1906,"rv":"~$1.9B","rs":"~3.0Bt","gr":"0.4% Cu","no":"125+ year mining history"},{"n":"Cannington","c":"Australia","la":-21.87,"ln":140.91,"co":["Silver","Lead","Zinc"],"pc":"Zinc","cp":"South32","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Ag-Pb-Zn; part of South32 portfolio","em":"~500","dp":"~700m","d":1990,"o":1997,"rv":"~$560M","rs":"~30Mt","gr":"5% Pb, 2% Zn, 200g/t","no":"One of world's largest silver-lead "},{"n":"Carajás S11D","c":"Brazil","la":-6.41,"ln":-50.04,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Vale","t":"Open Pit","m":"Conventional","st":"Operating","pr":"83Mt iron ore (record CY2024)","em":"~3,000","dp":"~100m","d":1967,"o":2016,"rv":"~$9.1B","rs":"~10.0Bt","gr":"66% Fe","no":"World's largest iron ore mine, ~67%"},{"n":"Carajás Serra Norte","c":"Brazil","la":-6.07,"ln":-50.17,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Vale","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Northern System; in line with plan","em":"~5,000","dp":"~200m","d":1967,"o":1985,"rv":"~$9.1B","rs":"~5.0Bt","gr":"65% Fe","no":"Original Carajás complex"},{"n":"Carlin Gold Complex","c":"United States","la":40.88,"ln":-116.33,"co":["Gold"],"pc":"Gold","cp":"Nevada Gold Mines (Barrick 61.","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Part of NGM complex; incl Goldstrike","em":"~6,000","dp":null,"d":1961,"o":1965,"rv":"~$1.4B","no":"Richest gold district in Western He"},{"n":"Carmichael","c":"Australia","la":-21.95,"ln":146.4,"co":["Coal (Thermal)"],"pc":"Coal (Thermal)","cp":"Bravus Mining (Adani)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Thermal coal; QLD; ramping up ~10Mtpa","em":"~1,500","dp":"~150m","d":2010,"o":2022,"rv":"~$1.3B","rs":"~10.0Bt","no":"Controversial Galilee Basin mine"},{"n":"Carosue Dam","c":"Australia","la":-31.19,"ln":122.42,"co":["Gold"],"pc":"Gold","cp":"Northern Star Resources (acqui","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Au; WA","em":"~300","dp":"~250m","d":2000,"o":2001,"rv":"~$358M","gr":"2.0g/t Au","no":"Now part of Northern Star"},{"n":"Carrapateena","c":"Australia","la":-31.37,"ln":137.05,"co":["Copper","Gold"],"pc":"Copper","cp":"BHP","t":"Underground","m":"Sub Level Caving","st":"Operating","pr":"68kt Cu payable; 91koz Au","em":"~1,200","dp":"~1500m","d":2005,"o":2019,"rv":"~$863M","rs":"~200Mt","gr":"1.3% Cu, 0.5g/t Au","no":"BHP's newest Cu mine, block cave st"},{"n":"Cataby","c":"Australia","la":-30.75,"ln":115.55,"co":["Titanium"],"pc":"Titanium","cp":"Iluka Resources","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ti mineral sands; WA","em":"~200","dp":"~50m","d":2010,"o":2019,"rv":"~$500M"},{"n":"Catoca","c":"Angola","la":-8.38,"ln":20.43,"co":["Diamonds"],"pc":"Diamonds","cp":"Endiama / Alrosa JV","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Africa's 4th largest diamond mine; Angola","em":"~5,000","dp":"~600m","d":1968,"o":1997,"rv":"~$200M","no":"4th largest diamond mine globally b"},{"n":"Caval Ridge","c":"Australia","la":-21.93,"ln":148.11,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"BHP Mitsubishi Alliance (BMA)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"3.3Mt met coal (BHP 50% share FY24)","em":"~800","dp":"~150m","d":2007,"o":2014,"rv":"~$825M","rs":"~400Mt","no":"Newest BMA operation"},{"n":"Centinela","c":"Chile","la":-23.1,"ln":-69.18,"co":["Copper","Gold"],"pc":"Copper","cp":"Antofagasta Minerals (70%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Au; ~220kt Cu","em":"~3,000","dp":"~400m","d":1978,"o":2012,"rv":"~$2.1B","rs":"~1.5Bt","gr":"0.4% Cu","no":"Combined Esperanza & El Tesoro"},{"n":"Century Tailings","c":"Australia","la":-18.76,"ln":138.62,"co":["Zinc"],"pc":"Zinc","cp":"New Century Resources","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Zn from tailings reprocessing","em":"~150","dp":"~20m","d":1990,"o":2022,"rv":null},{"n":"Cerrejón","c":"Colombia","la":11.1,"ln":-72.65,"co":["Coal (Thermal)"],"pc":"Coal (Thermal)","cp":"Glencore","t":"Open Pit","m":"Dragline","st":"Operating","pr":"Part of Glencore energy coal 99.6Mt; impacted by p","em":"~5,000","dp":"~150m","d":1977,"o":1985,"rv":"~$1.8B","rs":"~3.0Bt","no":"Largest open pit coal mine in Latin"},{"n":"Cerro Lindo","c":"Peru","la":-13.6,"ln":-75.68,"co":["Zinc","Copper","Lead"],"pc":"Copper","cp":"Nexa Resources","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Zn-Cu-Pb; Peru","em":"~1,500","dp":null,"d":1998,"o":2007,"rv":"~$950M","gr":"3% Zn, 0.5% Cu"},{"n":"Cerro Negro","c":"Argentina","la":-46.55,"ln":-69.25,"co":["Gold","Silver"],"pc":"Gold","cp":"Newmont","t":"Underground","m":"Open Stoping","st":"Operating","pr":"238koz Au (CY2024)","em":"~1,500","dp":"~600m","d":2007,"o":2013,"rv":"~$568M","gr":"6.5g/t Au"},{"n":"Cerro Verde","c":"Peru","la":-16.54,"ln":-71.6,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Freeport-McMoRan (53.56%) / SM","t":"Open Pit","m":"Conventional","st":"Operating","pr":"~470kt Cu in concentrate (100% CY24); 360ktpd mill","em":"~6,000","dp":"~600m","d":1916,"o":1977,"rv":"~$2.9B","rs":"~4.0Bt","gr":"0.4% Cu","no":"One of Peru's largest copper mines"},{"n":"Chichester Hub","c":"Australia","la":-21.3,"ln":119.4,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Fortescue","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Fortescue total ~192Mt shipped FY24","em":"~3,000","dp":"~100m","d":1963,"o":2008,"rv":"~$11.0B","rs":"~2.0Bt","no":"Fortescue's founding operation"},{"n":"Christmas Creek","c":"Australia","la":-22.34,"ln":119.64,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Fortescue","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Chichester Hub","em":"~1,500","dp":"~100m","d":1963,"o":2008,"rv":"~$5.5B","rs":"~700Mt","no":"Part of Fortescue's Chichester Hub"},{"n":"Chromite Valley","c":"South Africa","la":-24.59,"ln":30.16,"co":["Chromite"],"pc":"Chromite","cp":"Glencore-Merafe Chrome Venture","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Cr; SA","em":"~1,000","dp":"~900m","d":1918,"o":1960,"rv":"~$600M","no":"Bushveld Complex operations"},{"n":"Chuquicamata","c":"Chile","la":-22.29,"ln":-68.9,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Codelco","t":"Underground","m":"Block Caving","st":"Operating","pr":"Transitioning to UG; part of Codelco total ~1.3Mt ","em":"~5,500","dp":"~1000m","d":1830,"o":1910,"rv":"~$3.8B","rs":"~1.7Bt","no":"Largest OP Cu mine by volume, trans","gr":"0.63% Cu"},{"n":"Chuquicamata Underground","c":"Chile","la":-22.32,"ln":-68.93,"co":["Copper"],"pc":"Copper","cp":"Codelco","t":"Underground","m":"Block Caving","st":"Operating","pr":"Ramp-up continues; block caving","em":"~3,000","dp":"~1200m","d":1830,"o":2019,"rv":"~$1.9B","no":"Transition from world's largest OP "},{"n":"Cigar Lake","c":"Canada","la":58.04,"ln":-104.54,"co":["Uranium"],"pc":"Uranium","cp":"Cameco (50.025%) / Orano (37.1","t":"Underground","m":"Deep Level","st":"Operating","pr":"~16Mlbs U3O8; world's highest-grade U mine","em":"~500","dp":"~450m","d":1981,"o":2014,"rv":"~$1.4B","rs":"~100Mt","gr":"~15% U3O8","no":"World's highest grade uranium mine"},{"n":"Cloudbreak","c":"Australia","la":-22.29,"ln":119.44,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Fortescue","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Chichester Hub","em":"~1,200","dp":"~100m","d":2004,"o":2008,"rv":"~$5.5B","rs":"~600Mt","no":"Fortescue's first mine"},{"n":"Cobre Las Cruces","c":"Spain","la":37.53,"ln":-6.15,"co":["Copper"],"pc":"Copper","cp":"First Quantum Minerals","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Cu; Spain; UG project","em":"~800","dp":"~250m","d":1994,"o":2009,"rv":"~$95M"},{"n":"Collahuasi","c":"Chile","la":-20.98,"ln":-68.72,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Glencore (44%) / Anglo America","t":"Open Pit","m":"Conventional","st":"Operating","pr":"~620kt Cu in concentrate (100% CY24); 9Mt ore milled","em":"~3,500","dp":"~600m","d":1880,"o":1999,"rv":"~$5.7B","rs":"~3.0Bt","gr":"0.8% Cu","no":"At 4,400m elevation"},{"n":"Constancia","c":"Peru","la":-14.52,"ln":-71.81,"co":["Copper","Gold","Molybdenum","Silver"],"pc":"Copper","cp":"Hudbay Minerals","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Au-Mo-Ag; ~100kt Cu; Peru","em":"~2,500","dp":"~350m","d":2012,"o":2015,"rv":"~$950M","rs":"~700Mt","gr":"0.3% Cu","no":"At 4,100m elevation"},{"n":"Coral Bay","c":"Philippines","la":9.17,"ln":118.05,"co":["Nickel"],"pc":"Nickel","cp":"Sumitomo Metal Mining / Nickel","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni HPAL; Philippines","em":"~700","dp":"~30m","d":1996,"o":2005,"rv":"~$495M"},{"n":"Cortez","c":"United States","la":40.21,"ln":-116.63,"co":["Gold"],"pc":"Gold","cp":"Nevada Gold Mines (Barrick 61.","t":"Open Pit & Underground","m":"Open Stoping","st":"Operating","pr":"Part of NGM complex; highest annual production in ","em":"~1,800","dp":"~600m","d":1863,"o":1969,"rv":"~$2.0B","no":"Includes deep Goldrush deposit","rs":"~130Mt @ 2.8 g/t Au","gr":"2.8 g/t Au"},{"n":"Cory","c":"Canada","la":52.1,"ln":-106.93,"co":["Potash"],"pc":"Potash","cp":"Nutrien","t":"Underground","m":"Longwall","st":"Operating","pr":"Part of Nutrien potash","em":"~600","dp":"~1000m","d":1952,"o":1965,"rv":"~$900M"},{"n":"Cowal","c":"Australia","la":-33.62,"ln":147.38,"co":["Gold"],"pc":"Gold","cp":"Evolution Mining","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Au; part of Evolution ~330koz total","em":"~1200","dp":800,"d":2004,"o":2006,"rv":"~$1.8B","rs":"~140Mt","gr":"0.8g/t Au","no":"Transition to underground"},{"n":"CSA (Cobar)","c":"Australia","la":-31.48,"ln":145.83,"co":["Copper","Silver"],"pc":"Copper","cp":"Harmony Gold","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Cu-Ag; NSW UG","em":"~400","dp":"~1900m","d":1869,"o":1965,"rv":"~$380M","rs":"~5Mt","no":"\"CSA\" stands for Cornish, Scottish,","gr":"3.8% Cu, 60 g/t Ag"},{"n":"Cuajone","c":"Peru","la":-17.05,"ln":-70.7,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Southern Copper","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Mo; ~140kt Cu; Peru","em":"~2,500","dp":"~500m","d":1900,"o":1976,"rv":"~$1.3B","rs":"~1.5Bt","gr":"0.6% Cu","no":"Sister mine to Toquepala"},{"n":"Cullinan","c":"South Africa","la":-25.68,"ln":28.52,"co":["Diamonds"],"pc":"Diamonds","cp":"Petra Diamonds","t":"Underground","m":"Block Caving","st":"Operating","pr":"Historic SA diamond mine","em":"~1,800","dp":"~900m","d":1903,"o":1903,"rv":"~$250M","no":"Famous for 3,106-carat Cullinan Dia"},{"n":"Curragh","c":"Australia","la":-23.48,"ln":148.87,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Coronado Global Resources","t":"Open Pit","m":"Dragline","st":"Operating","pr":"Met coal; QLD ~8Mt","em":"~1,800","dp":"~150m","d":1981,"o":1983,"rv":"~$2.0B","rs":"~500Mt","no":"Premium hard coking coal"},{"n":"Daunia","c":"Australia","la":-22.33,"ln":148.02,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Whitehaven Coal (acquired Apr ","t":"Open Pit","m":"Conventional","st":"Operating","pr":"1.5Mt met coal (BHP share, pre-divestment Apr 2024","em":"~800","dp":"~60m","d":2007,"o":2013,"rv":"~$375M","no":"Divested by BHP to Whitehaven Coal "},{"n":"Dawson","c":"Australia","la":-23.15,"ln":149.15,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Anglo American","t":"Open Pit & Underground","m":"Dragline","st":"Operating","pr":"Met coal","em":"~900","dp":"~200m","d":1957,"o":1962,"rv":"~$1.2B","rs":"~500Mt","no":"Long-running operation"},{"n":"Dayan","c":"China","la":49.28,"ln":117.41,"co":["Coal (Thermal)"],"pc":"Coal (Thermal)","cp":"Shenhua Group / China Energy","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Thermal coal; Inner Mongolia","em":"~5,000","dp":"~60m","d":1960,"o":1980,"rv":"~$2.6B"},{"n":"Dendrobium","c":"Australia","la":-34.47,"ln":150.88,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"South32","t":"Underground","m":"Longwall","st":"Operating","pr":"Met coal; Illawarra Metallurgical Coal","em":"~700","dp":"~500m","d":1952,"o":2005,"rv":"~$1.8B"},{"n":"Detour Lake","c":"Canada","la":50.03,"ln":-79.7,"co":["Gold"],"pc":"Gold","cp":"Agnico Eagle Mines","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of AEM total ~3.5Moz; UG exploration ramp adv","em":"~1,500","dp":"~300m","d":1974,"o":2013,"rv":"~$1.8B","gr":"0.8g/t Au","no":"Canada's largest gold mine"},{"n":"Dexing","c":"China","la":29.0,"ln":117.72,"co":["Copper","Gold"],"pc":"Copper","cp":"Jiangxi Copper","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Au; China's largest OP Cu mine","em":"~8,000","dp":"~400m","d":1897,"o":1958,"rv":"~$2.4B","rs":"~2.0Bt","gr":"0.4% Cu","no":"Largest OP copper mine in Asia"},{"n":"Didipio","c":"Philippines","la":16.33,"ln":121.2,"co":["Gold","Copper"],"pc":"Gold","cp":"OceanaGold","t":"Open Pit & Underground","m":"Open Stoping","st":"Operating","pr":"Au-Cu; Philippines","em":"~2,500","dp":"~500m","d":1998,"o":2013,"rv":"~$477M","gr":"1.0g/t Au, 0.4% Cu","no":"Faced community access issues"},{"n":"Donimalai","c":"India","la":15.13,"ln":76.38,"co":["Iron Ore"],"pc":"Iron Ore","cp":"NMDC","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Iron ore; India NMDC","em":"~1,500","dp":"~100m","d":1961,"o":1977,"rv":"~$1.1B"},{"n":"Donskoy GOK","c":"Kazakhstan","la":50.3,"ln":58.32,"co":["Chromite"],"pc":"Chromite","cp":"Kazchrome (ERG)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Cr; Kazakhstan; world's largest Cr mine","em":"~8,000","dp":null,"d":1938,"o":1938,"rv":"~$2.1B","no":"World's largest chrome producer"},{"n":"Driefontein","c":"South Africa","la":-26.38,"ln":27.5,"co":["Gold"],"pc":"Gold","cp":"Sibanye-Stillwater","t":"Underground","m":"Deep Level","st":"Operating","pr":"SA gold ops","em":"~4,000","dp":"~3400m","d":1933,"o":1953,"rv":"~$477M"},{"n":"Drummond","c":"Colombia","la":9.46,"ln":-73.61,"co":["Coal (Thermal)"],"pc":"Coal (Thermal)","cp":"Drummond Company","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Thermal coal; Colombia","em":"~5,000","dp":"~80m","d":1985,"o":1995,"rv":"~$1.8B"},{"n":"Dugald River","c":"Australia","la":-20.25,"ln":140.18,"co":["Zinc","Lead"],"pc":"Zinc","cp":"MMG Limited","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Zn-Pb; high-grade UG","em":"~600","dp":"~900m","d":1975,"o":2017,"rv":"~$570M","gr":"12% Zn"},{"n":"Duketon","c":"Australia","la":-27.93,"ln":122.52,"co":["Gold"],"pc":"Gold","cp":"Regis Resources","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Au; WA","em":"~250","dp":"~200m","d":2007,"o":2012,"rv":"~$358M","gr":"1.5g/t Au"},{"n":"Ekati","c":"Canada","la":64.72,"ln":-110.62,"co":["Diamonds"],"pc":"Diamonds","cp":"Arctic Canadian Diamond Compan","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Canada; operated by Arctic Canadian Diamond","em":"~1,000","dp":"~300m","d":1991,"o":1998,"rv":"~$250M","no":"Canada's first diamond mine"},{"n":"El Porvenir","c":"Peru","la":-10.56,"ln":-76.28,"co":["Zinc","Lead","Silver"],"pc":"Zinc","cp":"Nexa Resources","t":"Underground","m":"Cut & Fill","st":"Operating","pr":"Zn-Pb-Ag; Peru","em":"~2,000","dp":"~600m","d":1959,"o":1959,"rv":null,"gr":"4% Zn"},{"n":"El Teniente","c":"Chile","la":-34.09,"ln":-70.34,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Codelco","t":"Underground","m":"Block Caving","st":"Operating","pr":"Part of Codelco total; world's largest UG Cu mine","em":"~4,800","dp":"~1800m","d":1904,"o":1906,"rv":"~$4.3B","rs":"~2.0Bt","no":"World's largest underground copper ","gr":"0.69% Cu"},{"n":"Éléonore","c":"Canada","la":52.71,"ln":-76.06,"co":["Gold"],"pc":"Gold","cp":"Newmont (pending sale)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"243koz Au (CY2024; pending divestiture)","em":"~800","dp":"~600m","d":2004,"o":2014,"rv":"~$580M","gr":"5.0g/t Au","no":"Non-core asset, pending divestiture"},{"n":"Ernest Henry","c":"Australia","la":-20.49,"ln":140.72,"co":["Copper","Gold"],"pc":"Copper","cp":"Evolution Mining","t":"Underground","m":"Block Caving","st":"Operating","pr":"Cu-Au; part of Evolution ops","em":"~600","dp":"~1000m","d":1991,"o":1998,"rv":"~$228M","rs":"~78Mt","gr":"0.77g/t Au","no":"IOCG deposit"},{"n":"Escondida","c":"Chile","la":-24.27,"ln":-69.07,"co":["Copper"],"pc":"Copper","cp":"BHP (57.5%) / Rio Tinto (30%) ","t":"Open Pit","m":"Conventional","st":"Operating","pr":"1,125kt Cu (100% basis FY24); 181koz Au; 5,446koz ","em":"~10,000","dp":"~700m","d":1981,"o":1990,"rv":"~$5.2B","rs":"~4.5Bt","gr":"0.5% Cu","no":"World's largest copper mine by prod"},{"n":"Essakane","c":"Burkina Faso","la":14.93,"ln":-0.28,"co":["Gold"],"pc":"Gold","cp":"IAMGOLD (90%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Au ~400koz; Burkina Faso","em":"~3,000","dp":"~100m","d":2008,"o":2010,"rv":"~$955M","gr":"0.8g/t Au","no":"Sahel desert gold mine"},{"n":"Fekola","c":"Mali","la":13.48,"ln":-11.2,"co":["Gold"],"pc":"Gold","cp":"B2Gold (80%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Au ~550koz; Mali; flagship mine","em":"~2,500","dp":"~150m","d":2012,"o":2018,"rv":"~$1.3B","gr":"1.5g/t Au"},{"n":"Fort Knox","c":"United States","la":64.82,"ln":-147.57,"co":["Gold"],"pc":"Gold","cp":"Kinross Gold","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Kinross total","em":"~700","dp":"~300m","d":1985,"o":1996,"rv":"~$358M","gr":"0.4g/t Au","no":"Interior Alaska gold mine near Fair"},{"n":"Fosterville","c":"Australia","la":-36.7,"ln":144.73,"co":["Gold"],"pc":"Gold","cp":"Agnico Eagle Mines","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of AEM total; lower production CY2024 vs prio","em":"~700","dp":"~1000m","d":1894,"o":1894,"rv":null,"gr":"8-15g/t Au","no":"One of world's highest-grade gold m"},{"n":"Fruta del Norte","c":"Ecuador","la":-3.83,"ln":-78.58,"co":["Gold","Silver"],"pc":"Gold","cp":"Lundin Gold","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Au ~400koz; Ecuador high-grade UG","em":"~1,500","dp":"~800m","d":2002,"o":2019,"rv":"~$955M","gr":"9.0g/t Au","no":"Ecuador's first large-scale UG mine"},{"n":"Gahcho Kué","c":"Canada","la":63.43,"ln":-109.2,"co":["Diamonds"],"pc":"Diamonds","cp":"De Beers (51%) / Mountain Prov","t":"Open Pit","m":"Conventional","st":"Operating","pr":"JV; Canada","em":"~600","dp":"~250m","d":2008,"o":2016,"rv":"~$200M","no":"Remote subarctic diamond mine"},{"n":"Ganfeng Mariana","c":"Argentina","la":-24.05,"ln":-67.05,"co":["Lithium"],"pc":"Lithium","cp":"Ganfeng Lithium","t":"Open Pit","m":"Conventional","st":"Construction","pr":"Li brine; Argentina; development","em":"~200","dp":null,"d":2015,"o":2023,"rv":"~$20M"},{"n":"Garpenberg","c":"Sweden","la":60.33,"ln":16.22,"co":["Zinc","Silver","Lead"],"pc":"Zinc","cp":"Boliden","t":"Underground","m":"Cut & Fill","st":"Operating","pr":"Part of Boliden Mines; one of most productive Zn m","em":"~800","dp":"~1200m","d":1150,"o":1940,"rv":null,"gr":"4.5% Zn"},{"n":"Geita","c":"Tanzania","la":-2.83,"ln":32.15,"co":["Gold"],"pc":"Gold","cp":"AngloGold Ashanti","t":"Open Pit & Underground","m":"Open Stoping","st":"Operating","pr":"Part of AGA total ~2.7Moz Au CY2024","em":"~4,200","dp":"~300m","d":1938,"o":1999,"rv":"~$765M","gr":"3.0g/t Au","no":"Tanzania's largest gold mine","rs":"~80Mt @ 2.4 g/t Au"},{"n":"GEMCO (Groote Eylandt)","c":"Australia","la":-13.96,"ln":136.46,"co":["Manganese"],"pc":"Manganese","cp":"South32 (60%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Mn ore; major global Mn producer","em":"~1,200","dp":"~20m","d":1966,"o":1966,"rv":"~$600M","rs":"~150Mt","no":"World's largest manganese mine, ~15"},{"n":"Goldstrike","c":"United States","la":40.97,"ln":-116.47,"co":["Gold"],"pc":"Gold","cp":"Nevada Gold Mines (Barrick 61.","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Part of NGM complex (Barrick 61.5%); NGM total ~2.","em":"~1,600","dp":"~600m","d":1962,"o":1986,"rv":"~$1.3B","no":"Part of Nevada Gold Mines JV; indiv","rs":"~115Mt @ 2.4 g/t Au","gr":"2.4 g/t Au"},{"n":"Goonyella Riverside","c":"Australia","la":-21.81,"ln":148.1,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"BHP Mitsubishi Alliance (BMA)","t":"Open Pit","m":"Dragline","st":"Operating","pr":"6.4Mt met coal (BHP 50% share FY24)","em":"~2,500","dp":"~200m","d":1957,"o":1970,"rv":"~$1.6B","rs":"~1.0Bt","no":"One of world's largest met coal min"},{"n":"Goro","c":"New Caledonia","la":-22.27,"ln":167.02,"co":["Nickel","Cobalt"],"pc":"Nickel","cp":"Prony Resources","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni-Co; New Caledonia","em":"~2,500","dp":null,"d":1965,"o":2010,"rv":"~$495M","rs":"~120Mt","no":"Ownership transition; financial dif"},{"n":"Granny Smith","c":"Australia","la":-28.98,"ln":122.17,"co":["Gold"],"pc":"Gold","cp":"Gold Fields","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of Gold Fields Australia region","em":"~750","dp":"~700m","d":1970,"o":1990,"rv":"~$204M","gr":"4.0g/t Au","no":"Includes Wallaby underground mine"},{"n":"Grasberg","c":"Indonesia","la":-4.05,"ln":137.12,"co":["Copper","Gold"],"pc":"Copper","cp":"Freeport-McMoRan / PT-FI (48.7","t":"Underground","m":"Block Caving","st":"Operating","pr":"Major Cu-Au mine; 780kt Cu + 1.2Moz Au (100% FY24); UG block cave ramp","em":"~30,000","dp":"~1200m","d":1936,"o":1973,"rv":"~$11.1B","rs":"~3.0Bt","gr":"0.8% Cu, 0.7g/t Au","no":"World's largest gold mine, massive "},{"n":"Greenbushes","c":"Australia","la":-33.86,"ln":116.06,"co":["Lithium"],"pc":"Lithium","cp":"Talison Lithium (Tianqi 51% / ","t":"Open Pit","m":"Conventional","st":"Operating","pr":"World's largest hard-rock Li mine; ~1.5Mt spod con","em":"~800","dp":"~250m","d":1888,"o":1983,"rv":"~$1.2B","rs":"~200Mt","gr":"2.1% Li2O","no":"World's largest & highest-grade har"},{"n":"Greens Creek","c":"United States","la":58.07,"ln":-134.65,"co":["Silver","Gold","Zinc"],"pc":"Gold","cp":"Hecla Mining","t":"Underground","m":"Cut & Fill","st":"Operating","pr":"Ag-Au-Zn; Alaska; Hecla's largest Ag mine","em":"~400","dp":"~500m","d":1974,"o":1989,"rv":null,"rs":"~7Mt","gr":"12% Zn, 5oz/t Ag","no":"One of world's largest primary silv"},{"n":"Grosvenor","c":"Australia","la":-21.9,"ln":148.15,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Anglo American","t":"Underground","m":"Longwall","st":"Operating","pr":"Met coal; fire damage 2020; partial restart","em":"~600","dp":"~250m","d":2007,"o":2016,"rv":"~$750M","rs":"~300Mt","no":"Newest Anglo coal mine"},{"n":"Gudai-Darri","c":"Australia","la":-22.5,"ln":119.18,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Reached 50Mtpa rate during 2024; part of 328Mt Pil","em":"~600","dp":"~100m","d":2014,"o":2022,"rv":"~$5.5B","rs":"~700Mt","no":"Rio Tinto's most advanced mine, $3."},{"n":"Guelb El Rhein","c":"Mauritania","la":22.6,"ln":-12.35,"co":["Iron Ore"],"pc":"Iron Ore","cp":"SNIM (Mauritania State)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Iron ore; Mauritania ~12Mt","em":"~3,000","dp":"~100m","d":1968,"o":1984,"rv":"~$1.3B","rs":"~1.0Bt","no":"Key Saharan iron ore"},{"n":"Gwalia","c":"Australia","la":-28.73,"ln":121.77,"co":["Gold"],"pc":"Gold","cp":"St Barbara / Genesis Minerals","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Au; WA UG","em":"~300","dp":"~1600m","d":1897,"o":1897,"rv":"~$286M","gr":"6g/t Au","no":"St Barbara merged with Genesis Mine"},{"n":"Haerwusu","c":"China","la":39.83,"ln":109.98,"co":["Coal (Thermal)"],"pc":"Coal (Thermal)","cp":"China Energy","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Thermal coal; Inner Mongolia; massive OP","em":"~8,000","dp":"~70m","d":1960,"o":2009,"rv":"~$2.6B","no":"One of China's largest open pit coa"},{"n":"Hail Creek","c":"Australia","la":-21.52,"ln":148.39,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Glencore","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Glencore Australian coal","em":"~1,200","dp":"~100m","d":1980,"o":2003,"rv":"~$2.0B","rs":"~400Mt","no":"Hard coking coal"},{"n":"Hemlo","c":"Canada","la":48.72,"ln":-85.85,"co":["Gold"],"pc":"Gold","cp":"Barrick Gold (100%)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of Barrick total 3.91Moz Au (100% Barrick)","em":"~700","dp":"~400m","d":1981,"o":1985,"rv":"~$358M"},{"n":"Hera","c":"Australia","la":-32.16,"ln":146.42,"co":["Gold","Zinc","Lead"],"pc":"Gold","cp":"Aurelia Metals","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Au-Zn-Pb; NSW polymetallic","em":"~200","dp":"~650m","d":2007,"o":2013,"rv":"~$238M"},{"n":"Hibbing Taconite","c":"United States","la":47.38,"ln":-92.93,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Cleveland-Cliffs","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Iron ore taconite; MN USA","em":"~700","dp":"~150m","d":1893,"o":1976,"rv":"~$1.6B"},{"n":"Highland Valley Copper","c":"Canada","la":50.48,"ln":-121.05,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Teck Resources","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Mo; ~100kt Cu; BC Canada","em":"~1,500","dp":"~400m","d":1962,"o":1972,"rv":"~$950M","rs":"~800Mt","gr":"0.3% Cu","no":"Canada's largest copper mine"},{"n":"Hindalco Renukoot","c":"India","la":24.22,"ln":83.03,"co":["Bauxite"],"pc":"Bauxite","cp":"Hindalco Industries (Aditya Bi","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Bauxite; India","em":"~3,000","dp":"~30m","d":1955,"o":1968,"rv":"~$250M"},{"n":"Hope Downs","c":"Australia","la":-22.97,"ln":119.14,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Rio Tinto / Hancock Prospectin","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Pilbara operations: 328Mt total","em":"~800","dp":"~100m","d":2004,"o":2007,"rv":"~$3.3B","rs":"~500Mt","no":"JV with Gina Rinehart's Hancock Pro"},{"n":"Hotazel","c":"South Africa","la":-27.26,"ln":22.96,"co":["Manganese"],"pc":"Manganese","cp":"South32 (60%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Mn ore; South Africa","em":"~2,000","dp":"~50m","d":1940,"o":1940,"rv":"~$180M","no":"Mamatwan and Wessels mines in Kalah"},{"n":"Houndé","c":"Burkina Faso","la":11.39,"ln":-3.49,"co":["Gold"],"pc":"Gold","cp":"Endeavour Mining (90%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Endeavour 1.1Moz; target >250koz/yr","em":"~1,500","dp":"~80m","d":2015,"o":2017,"rv":"~$2.6B","gr":"1.8g/t Au"},{"n":"Hunter Valley Coal Ops","c":"Australia","la":-32.37,"ln":151.08,"co":["Coal (Thermal)"],"pc":"Coal (Thermal)","cp":"Glencore / Yancoal","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Thermal coal; NSW","em":"~2,000","dp":"~80m","d":1850,"o":1850,"rv":"~$1.3B","rs":"~800Mt","no":"Multiple pits in Hunter Valley"},{"n":"Huntly","c":"Australia","la":-32.59,"ln":116.07,"co":["Bauxite"],"pc":"Bauxite","cp":"Alcoa","t":"Open Pit","m":"Dragline","st":"Operating","pr":"Bauxite; WA; ~20Mt","em":"~1,000","dp":"~30m","d":1970,"o":1972,"rv":"~$1.0B","rs":"~1.0Bt","no":"World's largest bauxite mine"},{"n":"Husab","c":"Namibia","la":-22.55,"ln":14.93,"co":["Uranium"],"pc":"Uranium","cp":"Swakop Uranium (CGN)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"~4,500t U3O8; Namibia","em":"~2,000","dp":null,"d":2012,"o":2016,"rv":"~$877M","rs":"~280Mt","no":"2nd largest uranium mine globally"},{"n":"Iduapriem","c":"Ghana","la":5.37,"ln":-1.96,"co":["Gold"],"pc":"Gold","cp":"AngloGold Ashanti","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of AGA total","em":"~1,500","dp":"~120m","d":1990,"o":1992,"rv":"~$250M"},{"n":"Impala Rustenburg","c":"South Africa","la":-25.6,"ln":27.24,"co":["Platinum","Palladium","Rhodium"],"pc":"Gold","cp":"Impala Platinum","t":"Underground","m":"Deep Level","st":"Operating","pr":"PGMs; ~1.1Moz 6E","em":"~20,000","dp":"~1200m","d":1924,"o":1925,"rv":"~$1.0B","rs":"~200Mt","no":"One of world's largest platinum com"},{"n":"Island Gold","c":"Canada","la":47.98,"ln":-83.36,"co":["Gold"],"pc":"Gold","cp":"Alamos Gold","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of Alamos ~550koz Au; UG high-grade","em":"~700","dp":null,"d":2004,"o":2007,"rv":"~$1.3B","gr":"10g/t Au"},{"n":"Ity","c":"Ivory Coast","la":6.88,"ln":-7.4,"co":["Gold"],"pc":"Gold","cp":"Endeavour Mining (80%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Endeavour 1.1Moz; target >250koz/yr","em":"~1,500","dp":"~200m","d":1989,"o":1990,"rv":"~$2.6B","gr":"1.5g/t Au","no":"CIL plant built 2019"},{"n":"Jacinth-Ambrosia","c":"Australia","la":-31.55,"ln":131.42,"co":["Titanium"],"pc":"Titanium","cp":"Iluka Resources","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ti mineral sands; SA Australia","em":"~200","dp":"~40m","d":2007,"o":2012,"rv":"~$750M"},{"n":"Jamalco","c":"Jamaica","la":17.97,"ln":-77.17,"co":["Bauxite"],"pc":"Bauxite","cp":"General Alumina Jamaica","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Bauxite; Jamaica","em":"~800","dp":"~30m","d":1953,"o":1961,"rv":"~$400M"},{"n":"Jiangxi Lithium","c":"China","la":28.38,"ln":114.52,"co":["Lithium"],"pc":"Lithium","cp":"Ganfeng Lithium","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Li; China domestic","em":"~1,500","dp":"~300m","d":1995,"o":2005,"rv":"~$80M"},{"n":"Jimblebar","c":"Australia","la":-23.28,"ln":119.78,"co":["Iron Ore"],"pc":"Iron Ore","cp":"BHP","t":"Open Pit","m":"Conventional","st":"Operating","pr":"73Mt iron ore (100% basis FY24)","em":"~1,200","dp":"~100m","d":1985,"o":1994,"rv":"~$8.0B","rs":"~800Mt","no":"Major hub in BHP's Pilbara network"},{"n":"Jundee","c":"Australia","la":-26.38,"ln":120.6,"co":["Gold"],"pc":"Gold","cp":"Northern Star Resources","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of NST Yandal ops","em":"~800","dp":"~600m","d":1990,"o":1994,"rv":"~$716M","no":"High-grade underground gold"},{"n":"Juruti","c":"Brazil","la":-2.15,"ln":-56.09,"co":["Bauxite"],"pc":"Bauxite","cp":"Alcoa","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Bauxite; Brazil","em":"~600","dp":"~30m","d":2006,"o":2009,"rv":"~$500M"},{"n":"Jwaneng","c":"Botswana","la":-24.53,"ln":24.72,"co":["Diamonds"],"pc":"Diamonds","cp":"Debswana (De Beers 50% / Botsw","t":"Open Pit","m":"Conventional","st":"Operating","pr":"World's richest diamond mine by value","em":"~7,000","dp":"~400m","d":1973,"o":1982,"rv":"~$1.5B","gr":"100+ cpht","no":"Richest diamond mine in the world b","rs":"~150Mt @ 1.55 cpht diamonds"},{"n":"Kalgold","c":"South Africa","la":-25.47,"ln":26.13,"co":["Gold"],"pc":"Gold","cp":"Harmony Gold","t":"Open Pit","m":"Conventional","st":"Operating","pr":"OP Au; SA","em":"~400","dp":null,"d":1989,"o":1995,"rv":"~$477M"},{"n":"Kamoa-Kakula","c":"DR Congo","la":-10.77,"ln":25.25,"co":["Copper"],"pc":"Copper","cp":"Ivanhoe Mines (39.6%) / Zijin ","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Cu ~400kt; world-class new Cu mine","em":"~3,000","dp":"~700m","d":2012,"o":2021,"rv":"~$3.8B","gr":"5.2% Cu","no":"Rapid ramp-up, becoming one of worl","rs":"~2.0Bt @ 2.9% Cu"},{"n":"Kamoto (KCC)","c":"DR Congo","la":-10.75,"ln":25.53,"co":["Copper","Cobalt"],"pc":"Copper","cp":"Glencore (75%)","t":"Open Pit & Underground","m":"Open Stoping","st":"Operating","pr":"Cu-Co; DRC; same as KCC","em":"~8,000","dp":"~500m","d":1956,"o":1979,"rv":"~$475M","rs":"~500Mt","gr":"3.5% Cu, 0.3% Co","no":"Major Cu-Co complex"},{"n":"Kansanshi","c":"Zambia","la":-12.1,"ln":26.42,"co":["Copper","Gold"],"pc":"Copper","cp":"First Quantum Minerals (80%)","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Cu-Au; ~200kt Cu; Zambia's largest Cu mine","em":"~6,000","dp":"~300m","d":1899,"o":2005,"rv":"~$1.9B","rs":"~1.0Bt","gr":"0.7% Cu","no":"Africa's largest Cu mine by product"},{"n":"Karara","c":"Australia","la":-29.2,"ln":116.68,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Ansteel / Gindalbie JV","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Iron ore; magnetite; WA","em":"~600","dp":"~100m","d":2006,"o":2012,"rv":"~$1.1B","rs":"~1.0Bt","no":"Magnetite operation"},{"n":"Karma","c":"Burkina Faso","la":13.2,"ln":-1.6,"co":["Gold"],"pc":"Gold","cp":"Endeavour sold; now third part","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Divested; non-core","em":"~1,200","dp":"~50m","d":2012,"o":2016,"rv":null},{"n":"Kassandra Mines","c":"Greece","la":40.45,"ln":23.85,"co":["Gold","Silver","Copper","Zinc"],"pc":"Copper","cp":"Eldorado Gold","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Au-Ag-Cu-Zn; Greece; Olympias/Skouries","em":"~1,500","dp":"~500m","d":600,"o":1960,"rv":null,"no":"Skouries & Olympias deposits"},{"n":"Kayad","c":"India","la":26.5,"ln":74.95,"co":["Zinc","Lead"],"pc":"Zinc","cp":"Hindustan Zinc (Vedanta)","t":"Underground","m":"Cut & Fill","st":"Operating","pr":"Part of HZL integrated operations","em":"~500","dp":"~300m","d":2003,"o":2013,"rv":null,"rs":"~15Mt","no":"Newest HZL underground mine"},{"n":"Kenmare Moma","c":"Mozambique","la":-16.64,"ln":39.43,"co":["Titanium"],"pc":"Titanium","cp":"Kenmare Resources","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ti mineral sands; Mozambique","em":"~1,200","dp":"~30m","d":1961,"o":2007,"rv":"~$500M"},{"n":"Kestrel","c":"Australia","la":-23.4,"ln":148.74,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"EMR Capital / Adaro JV","t":"Underground","m":"Longwall","st":"Operating","pr":"Met coal; QLD UG","em":"~700","dp":"~250m","d":1991,"o":1999,"rv":"~$750M","rs":"~300Mt","no":"High-quality coking coal"},{"n":"Kevitsa","c":"Finland","la":67.7,"ln":26.97,"co":["Nickel","Copper","PGMs"],"pc":"Copper","cp":"Boliden","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Boliden Mines; Ni-Cu-PGM","em":"~500","dp":"~350m","d":1987,"o":2012,"rv":"~$142M","rs":"~300Mt","gr":"0.3% Cu, 0.2% Ni","no":"Major Nordic Ni-Cu mine"},{"n":"KGHM Polkowice","c":"Poland","la":51.5,"ln":16.05,"co":["Copper","Silver"],"pc":"Copper","cp":"KGHM Polska Miedź","t":"Underground","m":"Cut & Fill","st":"Operating","pr":"Cu-Ag; ~500kt Cu total KGHM Poland","em":"~12,000","dp":"~1200m","d":1957,"o":1968,"rv":"~$1.9B","rs":"~1.5Bt","gr":"1.5% Cu, 50g/t Ag","no":"World's largest silver producer"},{"n":"Khouribga","c":"Morocco","la":32.88,"ln":-6.91,"co":["Phosphate"],"pc":"Phosphate","cp":"OCP Group","t":"Open Pit","m":"Dragline","st":"Operating","pr":"Phosphate; Morocco; world's largest","em":"~10,000","dp":"~30m","d":1921,"o":1921,"rv":"~$3.5B","no":"World's largest phosphate operation"},{"n":"Kibali","c":"DR Congo","la":3.01,"ln":30.29,"co":["Gold"],"pc":"Gold","cp":"Barrick (45%) / AngloGold Asha","t":"Open Pit & Underground","m":"Open Stoping","st":"Operating","pr":"Au ~700koz (100% basis); DRC","em":"~5,000","dp":"~500m","d":2009,"o":2013,"rv":"~$1.7B","gr":"3.5g/t Au","no":"Africa's largest gold mine","rs":"~135Mt @ 2.8 g/t Au"},{"n":"Kidd Creek","c":"Canada","la":48.68,"ln":-81.37,"co":["Copper","Zinc","Silver"],"pc":"Copper","cp":"Glencore","t":"Underground","m":"Deep Level","st":"Operating","pr":"Cu-Zn-Ag; deep UG Canada","em":"~1,500","dp":"~3000m","d":1963,"o":1966,"rv":"~$190M","rs":"~10Mt","gr":"3% Cu, 6% Zn","no":"Deepest base metal mine in the worl"},{"n":"Kinsevere","c":"DR Congo","la":-11.37,"ln":27.57,"co":["Copper"],"pc":"Copper","cp":"CMOC Group","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu; DRC","em":"~1,200","dp":null,"d":1990,"o":2010,"rv":"~$380M"},{"n":"Kiruna","c":"Sweden","la":67.85,"ln":20.22,"co":["Iron Ore"],"pc":"Iron Ore","cp":"LKAB (Swedish State)","t":"Underground","m":"Sub Level Caving","st":"Operating","pr":"Iron ore; world's largest UG iron mine ~27Mt","em":"~4,000","dp":"~1365m","d":1898,"o":1899,"rv":"~$3.0B","rs":"~600Mt","gr":"60% Fe","no":"World's largest UG iron ore mine, c"},{"n":"Kloof","c":"South Africa","la":-26.41,"ln":27.58,"co":["Gold"],"pc":"Gold","cp":"Sibanye-Stillwater","t":"Underground","m":"Deep Level","st":"Operating","pr":"SA gold ops","em":"~4,000","dp":"~3000m","d":1934,"o":1951,"rv":"~$358M"},{"n":"Kolomela","c":"South Africa","la":-28.42,"ln":22.17,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Kumba Iron Ore (Anglo American","t":"Open Pit","m":"Conventional","st":"Operating","pr":"~12Mt iron ore","em":"~1,500","dp":"~100m","d":2007,"o":2011,"rv":"~$1.3B"},{"n":"Kolwezi (KOV)","c":"DR Congo","la":-10.72,"ln":25.47,"co":["Copper","Cobalt"],"pc":"Copper","cp":"Glencore","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Co; DRC Glencore","em":"~4,000","dp":"~300m","d":1956,"o":1956,"rv":"~$950M","rs":"~200Mt","no":"Kamoto open pit"},{"n":"Konkola","c":"Zambia","la":-12.39,"ln":27.8,"co":["Copper","Cobalt"],"pc":"Copper","cp":"Vedanta Resources / KCM","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Cu-Co; Zambia deep UG","em":"~9,000","dp":"~1200m","d":1956,"o":1960,"rv":"~$237M","rs":"~500Mt","no":"KCM under provisional liquidation/r"},{"n":"Kounrad (Balkhash)","c":"Kazakhstan","la":46.85,"ln":74.98,"co":["Copper"],"pc":"Copper","cp":"Central Asia Metals (CAML)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu; Kazakhstan SX-EW","em":"~3,000","dp":"~400m","d":1928,"o":1936,"rv":"~$712M","rs":"~1.0Bt","no":"Historic Soviet-era copper mine"},{"n":"Kumtor","c":"Kyrgyzstan","la":41.87,"ln":78.19,"co":["Gold"],"pc":"Gold","cp":"Kyrgyzaltyn (Kyrgyz State)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Au ~500koz; now state-controlled","em":"~3,000","dp":"~600m","d":1978,"o":1997,"rv":"~$1.2B","no":"Expropriated from Centerra Gold in "},{"n":"Kupol","c":"Russia","la":66.9,"ln":169.53,"co":["Gold","Silver"],"pc":"Gold","cp":"Kinross Gold","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of Kinross total; Russia","em":"~1,500","dp":"~400m","d":2006,"o":2008,"rv":null,"gr":"10g/t Au"},{"n":"Kusile/Kendal Coal","c":"South Africa","la":-26.05,"ln":29.0,"co":["Coal (Thermal)"],"pc":"Coal (Thermal)","cp":"Anglo American (divesting)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Thermal coal; supply to Eskom","em":"~4,000","dp":"~100m","d":1980,"o":2003,"rv":"~$1.3B","no":"Anglo American divesting SA thermal"},{"n":"Lanigan","c":"Canada","la":51.85,"ln":-105.02,"co":["Potash"],"pc":"Potash","cp":"Nutrien","t":"Underground","m":"Longwall","st":"Operating","pr":"Part of Nutrien potash","em":"~600","dp":"~1000m","d":1952,"o":1968,"rv":"~$900M"},{"n":"LaRonde","c":"Canada","la":48.23,"ln":-78.23,"co":["Gold","Silver","Copper","Zinc"],"pc":"Gold","cp":"Agnico Eagle Mines","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of AEM total; LaRonde complex","em":"~800","dp":"~3100m","d":1988,"o":1988,"rv":"~$597M","gr":"5.0g/t Au","no":"One of deepest mines in Americas"},{"n":"Las Bambas","c":"Peru","la":-14.06,"ln":-72.33,"co":["Copper","Gold"],"pc":"Copper","cp":"MMG Limited (62.5%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu ~300kt; major Peru Cu mine","em":"~3,000","dp":"~300m","d":2010,"o":2016,"rv":"~$2.9B","rs":"~1.2Bt","gr":"0.6% Cu","no":"Significant community opposition"},{"n":"Leinster (Nickel West)","c":"Australia","la":-27.84,"ln":120.7,"co":["Nickel"],"pc":"Nickel","cp":"BHP (Nickel West)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Ni; BHP Nickel West; ~80kt Ni total","em":"~1,000","dp":"~1200m","d":1969,"o":1978,"rv":"~$495M","rs":"~50Mt","gr":"1.8% Ni","no":"BHP reviewing Nickel West future du"},{"n":"Letpadaung","c":"Myanmar","la":21.18,"ln":95.15,"co":["Copper"],"pc":"Copper","cp":"Wanbao Mining (China)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu; Myanmar","em":"~5,000","dp":"~200m","d":1999,"o":2014,"rv":"~$475M","rs":"~500Mt","no":"Political instability in Myanmar"},{"n":"Lihir","c":"Papua New Guinea","la":-3.12,"ln":152.63,"co":["Gold"],"pc":"Gold","cp":"Newmont","t":"Open Pit","m":"Conventional","st":"Operating","pr":"614koz Au (CY2024)","em":"~4,000","dp":"~300m","d":1982,"o":1997,"rv":"~$2.0B","gr":"2.5g/t Au","no":"In active volcanic caldera"},{"n":"Los Bronces","c":"Chile","la":-33.13,"ln":-70.28,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Anglo American","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Anglo Cu ~730kt CY2024","em":"~2,500","dp":"~400m","d":1820,"o":1952,"rv":"~$3.6B","rs":"~2.0Bt","gr":"0.5% Cu","no":"65km from Santiago, at 3,500m"},{"n":"Los Pelambres","c":"Chile","la":-31.72,"ln":-70.5,"co":["Copper","Gold","Molybdenum"],"pc":"Copper","cp":"Antofagasta Minerals (60%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Mo-Au; ~330kt Cu","em":"~3,000","dp":"~500m","d":1914,"o":2000,"rv":"~$3.1B","rs":"~2.0Bt","gr":"0.6% Cu","no":"Major porphyry at high altitude"},{"n":"Loulo-Gounkoto","c":"Mali","la":12.87,"ln":-11.58,"co":["Gold"],"pc":"Gold","cp":"Barrick Gold (80%) / Mali Govt","t":"Open Pit & Underground","m":"Open Stoping","st":"Operating","pr":"723koz Au (CY2024, 100% basis; Barrick 80%)","em":"~5,000","dp":"~500m","d":1981,"o":1984,"rv":"~$1.7B","gr":"4.5g/t Au","no":"Barrick's largest African gold comp"},{"n":"Lumwana","c":"Zambia","la":-12.1,"ln":25.85,"co":["Copper"],"pc":"Copper","cp":"Barrick Gold (100%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu production (part of 195kt total Barrick Cu CY20","em":"~3,000","dp":"~300m","d":1969,"o":2008,"rv":"~$1.9B","rs":"~1.0Bt","gr":"0.52% Cu","no":"Super pit expansion underway"},{"n":"Ma'aden Phosphate","c":"Saudi Arabia","la":31.4,"ln":37.3,"co":["Phosphate"],"pc":"Phosphate","cp":"Ma'aden","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Phosphate; Saudi Arabia","em":"~5,000","dp":"~50m","d":1994,"o":2011,"rv":"~$500M"},{"n":"Macassa","c":"Canada","la":48.11,"ln":-80.06,"co":["Gold"],"pc":"Gold","cp":"Agnico Eagle Mines","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Higher production CY2024 vs prior year","em":"~500","dp":"~2000m","d":1933,"o":1933,"rv":"~$477M","gr":"18g/t Au"},{"n":"Mahd Ad Dhahab","c":"Saudi Arabia","la":23.5,"ln":40.85,"co":["Gold","Silver","Copper"],"pc":"Copper","cp":"Ma'aden","t":"Underground","m":"Cut & Fill","st":"Operating","pr":"Au-Ag-Cu; Saudi Arabia","em":"~500","dp":"~300m","d":-2000,"o":570,"rv":null,"no":"Cradle of Gold - ancient mine"},{"n":"Man Sum","c":"Myanmar","la":21.93,"ln":99.26,"co":["Tin"],"pc":"Tin","cp":"Myanmar Tin Mining","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Sn; Myanmar","em":"~500","dp":null,"d":0,"o":0,"rv":null},{"n":"Marandoo","c":"Australia","la":-22.62,"ln":118.13,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Pilbara operations: 328Mt total","em":"~600","dp":"~120m","d":1992,"o":1994,"rv":"~$2.2B","rs":"~300Mt","no":"Near Karijini National Park"},{"n":"Marigold","c":"United States","la":40.59,"ln":-117.42,"co":["Gold"],"pc":"Gold","cp":"SSR Mining","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Au; Nevada OP heap leach","em":"~400","dp":null,"d":0,"o":0,"rv":"~$238M","gr":"0.5g/t Au"},{"n":"Marikana","c":"South Africa","la":-25.7,"ln":27.47,"co":["PGMs","Nickel","Copper"],"pc":"Gold","cp":"Sibanye-Stillwater","t":"Underground","m":"Deep Level","st":"Operating","pr":"Part of Sibanye SA PGM ops ~1.6Moz 4E","em":"~20,000","dp":"~1500m","d":0,"o":0,"rv":"~$475M","rs":"~200Mt","no":"Major PGM complex, site of 2012 tra"},{"n":"McArthur River","c":"Australia","la":-16.44,"ln":136.1,"co":["Zinc","Lead","Silver"],"pc":"Zinc","cp":"Glencore","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Impacted by tropical cyclone Q1; part of Glencore ","em":"~600","dp":"~85m (open cut to UG transition)","d":0,"o":0,"rv":"~$480M","rs":"~200Mt","gr":"8% Zn","no":"One of world's largest Zn-Pb deposi"},{"n":"Meadowbank/Amaruq","c":"Canada","la":65.02,"ln":-96.07,"co":["Gold"],"pc":"Gold","cp":"Agnico Eagle Mines","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Higher production CY2024; nearing end of mine life","em":"~1,000","dp":"~200m","d":0,"o":0,"rv":"~$238M","gr":"3.0g/t Au","no":"Arctic gold mine"},{"n":"Merian","c":"Suriname","la":4.75,"ln":-54.55,"co":["Gold"],"pc":"Gold","cp":"Newmont (75%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"274koz Au (100% basis CY2024; Newmont 75%)","em":"~1,500","dp":"~100m","d":0,"o":0,"rv":"~$654M","gr":"1.3g/t Au","no":"In Amazon rainforest"},{"n":"Middlemount","c":"Australia","la":-22.81,"ln":148.69,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Peabody Energy (50%) / Yancoal","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Met coal; QLD","em":"~600","dp":"~150m","d":0,"o":0,"rv":"~$1.2B"},{"n":"Minas Rio","c":"Brazil","la":-18.5,"ln":-43.42,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Anglo American","t":"Open Pit","m":"Conventional","st":"Operating","pr":"~26Mt iron ore CY2024","em":"~3,000","dp":"~100m","d":0,"o":0,"rv":"~$2.9B"},{"n":"Mining Area C / South Flank","c":"Australia","la":-23.13,"ln":119.3,"co":["Iron Ore"],"pc":"Iron Ore","cp":"BHP","t":"Open Pit","m":"Conventional","st":"Operating","pr":"106Mt iron ore (Area C JV, BHP share FY24); South ","em":"~2,500","dp":"~100m","d":0,"o":0,"rv":"~$11.7B","rs":"~2.0Bt","no":"South Flank $3.6B expansion, BHP's "},{"n":"Ministro Hales","c":"Chile","la":-22.38,"ln":-68.88,"co":["Copper"],"pc":"Copper","cp":"Codelco","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Codelco total","em":"~1,500","dp":"~300m","d":0,"o":0,"rv":"~$1.4B","rs":"~900Mt","no":"Codelco newest mine"},{"n":"Moa Bay","c":"Cuba","la":20.65,"ln":-74.93,"co":["Nickel","Cobalt"],"pc":"Nickel","cp":"Sherritt International (50%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni-Co; Cuba; laterite","em":"~3,000","dp":null,"d":0,"o":0,"rv":"~$198M"},{"n":"Moanda","c":"Gabon","la":-1.57,"ln":13.25,"co":["Manganese"],"pc":"Manganese","cp":"Eramet (COMILOG)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Mn; Gabon; ~5Mt","em":"~2,000","dp":null,"d":0,"o":0,"rv":"~$125M"},{"n":"Moatize","c":"Mozambique","la":-16.12,"ln":33.88,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Vulcan Mining (ex-Vale)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Met coal; Mozambique","em":"~3,000","dp":"~150m","d":0,"o":0,"rv":"~$2.5B","rs":"~2.0Bt","no":"Vale divested Mozambique coal ops"},{"n":"Mogalakwena","c":"South Africa","la":-23.68,"ln":28.93,"co":["Platinum","Palladium","Rhodium"],"pc":"Platinum","cp":"Anglo American Platinum","t":"Open Pit","m":"Conventional","st":"Operating","pr":"PGMs; world's largest OP PGM mine","em":"~4,000","dp":"~250m","d":1993,"o":1993,"rv":null,"rs":"~500Mt","no":"World's largest open-pit platinum m"},{"n":"Moranbah North","c":"Australia","la":-21.93,"ln":148.09,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Anglo American","t":"Underground","m":"Longwall","st":"Operating","pr":"Met coal; part of Anglo steelmaking coal","em":"~800","dp":"~300m","d":0,"o":0,"rv":"~$2.0B","rs":"~400Mt","no":"Anglo American divesting steelmakin"},{"n":"Morenci","c":"United States","la":33.08,"ln":-109.35,"co":["Copper"],"pc":"Copper","cp":"Freeport-McMoRan (72%) / Sumit","t":"Open Pit","m":"Conventional","st":"Operating","pr":"~550kt Cu (leach+concentrate); largest US copper mine","em":"~3,800","dp":"~500m","d":1872,"o":1939,"rv":"~$2.4B","rs":"~3.5Bt","gr":"0.3% Cu","no":"Largest copper mine in North Americ"},{"n":"Morowali IMIP","c":"Indonesia","la":-2.55,"ln":121.6,"co":["Nickel"],"pc":"Nickel","cp":"Tsingshan / Various Chinese JV","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni NPI/HPAL; Indonesia industrial park","em":"~20,000","dp":null,"d":0,"o":0,"rv":"~$247M","rs":"~1.0Bt","gr":"1.5% Ni","no":"World's largest nickel processing p"},{"n":"Mothae","c":"Lesotho","la":-29.3,"ln":29.2,"co":["Diamonds"],"pc":"Diamonds","cp":"Lucara Diamond","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Lesotho; high-value large stones","em":"~400","dp":"~200m","d":0,"o":0,"rv":null,"no":"Ownership may have changed; verify"},{"n":"Mount Isa","c":"Australia","la":-20.73,"ln":139.49,"co":["Copper","Zinc","Lead","Silver"],"pc":"Copper","cp":"Glencore","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Increased Cu production H2 after regional flooding","em":"~3,000","dp":"~1800m","d":1923,"o":1931,"rv":"~$807M","gr":"6% Zn, 3% Cu","no":"One of the most productive single m","rs":"~60Mt @ 3.5% Zn-Pb; 40Mt @ 3.3% Cu"},{"n":"Mount Keith","c":"Australia","la":-27.23,"ln":120.55,"co":["Nickel"],"pc":"Nickel","cp":"BHP (Nickel West)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni; BHP Nickel West","em":"~600","dp":"~400m","d":1969,"o":1994,"rv":"~$495M","rs":"~300Mt","no":"Large low-grade disseminated Ni sul"},{"n":"Mount Pass","c":"United States","la":35.48,"ln":-115.53,"co":["Rare Earths"],"pc":"Rare Earths","cp":"MP Materials","t":"Open Pit","m":"Conventional","st":"Operating","pr":"REE; ~40kt REO; only major US REE mine","em":"~500","dp":null,"d":1949,"o":1952,"rv":"~$1.0B","gr":"7% REO","no":"Only operating rare earth mine in U"},{"n":"Mount Rawdon","c":"Australia","la":-25.08,"ln":151.57,"co":["Gold"],"pc":"Gold","cp":"Evolution Mining","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Au; nearing end of mine life","em":"~300","dp":null,"d":1990,"o":2001,"rv":"~$238M"},{"n":"Mount Weld","c":"Australia","la":-28.77,"ln":122.55,"co":["Rare Earths"],"pc":"Rare Earths","cp":"Lynas Rare Earths","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Same as Lynas Mount Weld REE","em":"~300","dp":"~100m","d":1988,"o":2011,"rv":null,"rs":"~24Mt","gr":"8% REO","no":"Richest known rare earth deposit, o"},{"n":"Mount Whaleback","c":"Australia","la":-23.36,"ln":119.67,"co":["Iron Ore"],"pc":"Iron Ore","cp":"BHP","t":"Open Pit","m":"Conventional","st":"Operating","pr":"58Mt iron ore (Newman JV, BHP share FY24)","em":"~3,500","dp":"~300m","d":1957,"o":1969,"rv":"~$6.4B","rs":"~700Mt","gr":"62% Fe","no":"One of the largest single-pit iron "},{"n":"Mponeng","c":"South Africa","la":-26.42,"ln":27.42,"co":["Gold"],"pc":"Gold","cp":"Harmony Gold","t":"Underground","m":"Deep Level","st":"Operating","pr":"World's deepest Au mine; ~230koz","em":"~5,000","dp":"~4000m","d":1981,"o":1986,"rv":"~$549M","gr":"8.0g/t Au","no":"Deepest mine in the world at ~4km"},{"n":"Mt Arthur","c":"Australia","la":-32.33,"ln":150.87,"co":["Coal (Thermal)"],"pc":"Coal (Thermal)","cp":"BHP","t":"Open Pit","m":"Conventional","st":"Operating","pr":"15.4Mt thermal coal (FY24); planned closure FY30","em":"~2,000","dp":"~150m","d":1985,"o":1986,"rv":"~$2.0B"},{"n":"Mt Marion","c":"Australia","la":-31.19,"ln":121.55,"co":["Lithium"],"pc":"Lithium","cp":"Mineral Resources (50%) / Ganf","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Li; WA","em":"~400","dp":"~150m","d":2014,"o":2017,"rv":"~$200M","rs":"~35Mt","gr":"1.4% Li2O","no":"Near Kalgoorlie"},{"n":"Mufulira","c":"Zambia","la":-12.53,"ln":28.24,"co":["Copper"],"pc":"Copper","cp":"Mopani Copper Mines (ZCCM-IH)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Cu; Zambia; Mopani","em":"~2,000","dp":"~1400m","d":1933,"o":1933,"rv":"~$237M","no":"Glencore transferred to Zambian gov"},{"n":"Mungari","c":"Australia","la":-31.26,"ln":121.47,"co":["Gold"],"pc":"Gold","cp":"Evolution Mining","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Au; WA goldfields","em":"~400","dp":"~400m","d":2009,"o":2021,"rv":"~$310M","gr":"2.5g/t Au"},{"n":"Murrin Murrin","c":"Australia","la":-28.72,"ln":121.88,"co":["Nickel","Cobalt"],"pc":"Nickel","cp":"Glencore","t":"Open Pit","m":"Conventional","st":"Operating","pr":"+3.2kt Ni vs 2023; part of Glencore Ni ops","em":"~700","dp":null,"d":1994,"o":1999,"rv":"~$577M","rs":"~100Mt","gr":"1.0% Ni","no":"One of world's largest Ni laterite "},{"n":"Muruntau","c":"Uzbekistan","la":41.5,"ln":64.57,"co":["Gold"],"pc":"Gold","cp":"Navoi Mining (Uzbekistan State","t":"Open Pit","m":"Conventional","st":"Operating","pr":"World's largest OP Au mine; ~2Moz+","em":"~15,000","dp":"~600m","d":1958,"o":1967,"rv":"~$4.8B","no":"State-owned; limited public disclos"},{"n":"Musselwhite","c":"Canada","la":52.61,"ln":-90.38,"co":["Gold"],"pc":"Gold","cp":"Newmont (pending sale)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"215koz Au (CY2024; pending divestiture)","em":"~700","dp":"~700m","d":1991,"o":1997,"rv":"~$513M","gr":"5.5g/t Au","no":"Non-core asset, pending divestiture"},{"n":"Mutanda","c":"DR Congo","la":-10.8,"ln":25.97,"co":["Copper","Cobalt"],"pc":"Copper","cp":"Glencore","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Glencore African Cu; higher than planned r","em":"~5,000","dp":null,"d":1950,"o":2011,"rv":"~$950M"},{"n":"Nalco Mines","c":"India","la":18.96,"ln":83.24,"co":["Bauxite"],"pc":"Bauxite","cp":"NALCO (Govt of India)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Bauxite; Odisha India","em":"~3,000","dp":"~80m","d":1955,"o":1985,"rv":"~$350M"},{"n":"Natalka","c":"Russia","la":61.83,"ln":148.73,"co":["Gold"],"pc":"Gold","cp":"Polyus","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Au; Far East Russia","em":"~2,000","dp":"~300m","d":1973,"o":2018,"rv":"~$955M"},{"n":"Nchanga","c":"Zambia","la":-12.45,"ln":28.05,"co":["Copper"],"pc":"Copper","cp":"Vedanta Resources / KCM","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Cu; Zambia; part of KCM","em":"~4,000","dp":"~400m","d":1938,"o":1938,"rv":"~$237M"},{"n":"Neves-Corvo","c":"Portugal","la":37.58,"ln":-7.97,"co":["Copper","Zinc"],"pc":"Copper","cp":"Lundin Mining","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Cu-Zn; Portugal","em":"~1,500","dp":"~1100m","d":1977,"o":1988,"rv":"~$190M","gr":"2.0% Cu"},{"n":"Norilsk-Talnakh","c":"Russia","la":69.35,"ln":88.2,"co":["Nickel","Copper","Palladium","Platinum"],"pc":"Copper","cp":"Nornickel","t":"Open Pit & Underground","m":"Block Caving","st":"Operating","pr":"World's largest Ni-Pd-Pt producer; ~200kt Ni","em":"~25,000","dp":"~2000m","d":1935,"o":1942,"rv":"~$12.8B","rs":"~2.0Bt","gr":"1.8% Ni, 3.5% Cu","no":"Limited disclosure due to sanctions"},{"n":"North Mara","c":"Tanzania","la":-1.4,"ln":34.6,"co":["Gold"],"pc":"Gold","cp":"Barrick Gold (84%)","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Part of Africa & ME region (Barrick 84%)","em":"~2,500","dp":"~400m","d":1999,"o":2002,"rv":null,"no":"Near Lake Victoria"},{"n":"Northparkes","c":"Australia","la":-32.94,"ln":148.13,"co":["Copper","Gold"],"pc":"Copper","cp":"CMOC Group (80%)","t":"Underground","m":"Block Caving","st":"Operating","pr":"Cu-Au; block cave","em":"~650","dp":"~600m","d":1977,"o":1994,"rv":"~$475M","rs":"~150Mt","no":"Pioneer of block caving in Australi","gr":"0.42% Cu, 0.18 g/t Au"},{"n":"Nova-Bollinger","c":"Australia","la":-31.82,"ln":123.19,"co":["Nickel","Copper","Cobalt"],"pc":"Copper","cp":"IGO Limited","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Ni-Cu-Co; WA UG","em":"~500","dp":"~400m","d":2012,"o":2017,"rv":"~$95M","rs":"~2Mt","no":"High-grade Ni-Cu sulphide"},{"n":"Nsuta","c":"Ghana","la":5.28,"ln":-1.97,"co":["Manganese"],"pc":"Manganese","cp":"Ghana Manganese Company","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Mn; Ghana","em":"~1,000","dp":"~80m","d":1914,"o":1914,"rv":"~$45M"},{"n":"Oaky Creek","c":"Australia","la":-22.37,"ln":148.37,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Glencore","t":"Underground","m":"Longwall","st":"Operating","pr":"Met coal; QLD","em":"~700","dp":"~200m","d":1975,"o":1981,"rv":"~$1.2B","rs":"~200Mt","no":"Long-life longwall"},{"n":"Obuasi","c":"Ghana","la":6.2,"ln":-1.68,"co":["Gold"],"pc":"Gold","cp":"AngloGold Ashanti","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of AGA total; UG redevelopment","em":"~4,000","dp":"~1500m","d":1897,"o":1897,"rv":"~$500M","gr":"5.0g/t Au","no":"125+ years of production"},{"n":"Olimpiada","c":"Russia","la":59.73,"ln":93.67,"co":["Gold"],"pc":"Gold","cp":"Polyus","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Russia's largest Au mine; ~1.5Moz","em":"~5,000","dp":"~400m","d":1975,"o":1996,"rv":"~$3.6B","no":"Limited disclosure due to sanctions"},{"n":"Olympic Dam","c":"Australia","la":-30.45,"ln":136.88,"co":["Copper","Uranium","Gold","Silver"],"pc":"Copper","cp":"BHP","t":"Underground","m":"Open Stoping","st":"Operating","pr":"216kt Cu cathode; 207koz Au refined; 995koz Ag; 3,","em":"~4,000","dp":"~1000m","d":1975,"o":1988,"rv":"~$3.2B","rs":"~10.0Bt","gr":"1.7% Cu, 0.5kg/t U3O","no":"World's largest uranium deposit, 4t"},{"n":"Onça Puma","c":"Brazil","la":-6.58,"ln":-51.09,"co":["Nickel"],"pc":"Nickel","cp":"Vale","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni production higher after furnace rebuild; part o","em":"~800","dp":null,"d":1969,"o":2011,"rv":"~$198M"},{"n":"Orapa","c":"Botswana","la":-21.31,"ln":25.37,"co":["Diamonds"],"pc":"Diamonds","cp":"Debswana","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Large diamond mine; Botswana","em":"~2,500","dp":"~250m","d":1967,"o":1971,"rv":"~$400M","gr":"25 cpht","no":"One of world's largest diamond mine"},{"n":"Oyu Tolgoi Underground","c":"Mongolia","la":43.0,"ln":106.85,"co":["Copper","Gold"],"pc":"Copper","cp":"Rio Tinto (66%) / Govt of Mong","t":"Underground","m":"Block Caving","st":"Operating","pr":"Underground ramp-up continuing; record Cu producti","em":"~5,000","dp":null,"d":2001,"o":2023,"rv":"~$1.0B","gr":"1.5% Cu, 0.4g/t Au","no":"Hugo North block cave now ramping u"},{"n":"Paracatu","c":"Brazil","la":-17.21,"ln":-46.87,"co":["Gold"],"pc":"Gold","cp":"Kinross Gold","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Kinross total ~2.1Moz Au CY2024","em":"~2,800","dp":"~200m","d":1984,"o":1987,"rv":"~$1.4B","rs":"~400Mt","gr":"0.4g/t Au"},{"n":"Paragominas","c":"Brazil","la":-3.0,"ln":-47.35,"co":["Bauxite"],"pc":"Bauxite","cp":"Norsk Hydro","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Bauxite; Brazil; ~10Mt","em":"~2,000","dp":"~50m","d":1968,"o":2007,"rv":"~$500M"},{"n":"Patience Lake","c":"Canada","la":52.03,"ln":-106.48,"co":["Potash"],"pc":"Potash","cp":"Nutrien","t":"Underground","m":"Longwall","st":"Operating","pr":"Part of Nutrien potash","em":"~600","dp":"~1000m","d":1952,"o":1972,"rv":"~$900M"},{"n":"Peak Downs","c":"Australia","la":-22.26,"ln":148.19,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"BHP Mitsubishi Alliance (BMA)","t":"Open Pit","m":"Dragline","st":"Operating","pr":"4.2Mt met coal (BHP 50% share FY24)","em":"~1,800","dp":"~150m","d":1957,"o":1972,"rv":"~$1.1B","rs":"~600Mt","no":"Long-life met coal"},{"n":"Peñasquito","c":"Mexico","la":24.04,"ln":-101.61,"co":["Gold","Silver","Zinc"],"pc":"Gold","cp":"Newmont","t":"Open Pit","m":"Conventional","st":"Operating","pr":"299koz Au; plus Ag, Pb, Zn co-products (CY2024)","em":"~6,000","dp":"~400m","d":2006,"o":2010,"rv":"~$714M","gr":"0.4g/t Au","no":"One of world's largest Au-Ag deposi"},{"n":"Phalaborwa","c":"South Africa","la":-23.94,"ln":31.14,"co":["Phosphate","Copper"],"pc":"Copper","cp":"Foskor","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Phosphate-Cu; SA","em":"~2,000","dp":null,"d":1951,"o":1966,"rv":"~$237M"},{"n":"Phoenix (Nevada)","c":"United States","la":40.78,"ln":-116.36,"co":["Gold","Copper"],"pc":"Copper","cp":"Nevada Gold Mines (Barrick 61.","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of NGM complex","em":"~400","dp":"~200m","d":1960,"o":1990,"rv":"~$250M"},{"n":"Pilgangoora","c":"Australia","la":-20.87,"ln":118.84,"co":["Lithium","Tantalum"],"pc":"Lithium","cp":"Pilbara Minerals","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Li-Ta; WA; ~680ktpa spod conc","em":"~800","dp":"~150m","d":2014,"o":2018,"rv":"~$200M","rs":"~310Mt","gr":"1.2% Li2O","no":"One of world's largest independent "},{"n":"Poitrel","c":"Australia","la":-22.03,"ln":148.24,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"BHP Mitsubishi Alliance (BHP 5","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Met coal; BMA JV","em":"~600","dp":"~80m","d":2007,"o":2013,"rv":"~$1.2B"},{"n":"Prodeco","c":"Colombia","la":9.82,"ln":-73.55,"co":["Coal (Thermal)"],"pc":"Coal (Thermal)","cp":"Glencore","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Glencore Colombian coal ops","em":"~3,000","dp":"~80m","d":1977,"o":1985,"rv":"~$1.3B"},{"n":"Prominent Hill","c":"Australia","la":-29.72,"ln":135.52,"co":["Copper","Gold","Silver"],"pc":"Copper","cp":"BHP","t":"Underground","m":"Open Stoping","st":"Operating","pr":"51kt Cu payable; 94koz Au","em":"~1,000","dp":"~600m","d":2001,"o":2009,"rv":"~$709M","rs":"~100Mt","gr":"1.0% Cu, 0.6g/t Au","no":"Transitioned from OP to UG; include"},{"n":"Pueblo Viejo","c":"Dominican Republic","la":19.05,"ln":-70.17,"co":["Gold","Silver","Copper"],"pc":"Gold","cp":"Newmont (40%) / Barrick Gold (","t":"Open Pit","m":"Conventional","st":"Operating","pr":"235koz Au attrib (Newmont 40% CY2024)","em":"~3,000","dp":"~200m","d":600,"o":2013,"rv":"~$561M","no":"One of largest Au mines in Americas"},{"n":"Quebrada Blanca","c":"Chile","la":-20.98,"ln":-68.81,"co":["Copper"],"pc":"Copper","cp":"Teck Resources (60%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu; QB2 ramp-up ~250kt Cu target","em":"~3,000","dp":null,"d":1979,"o":1994,"rv":"~$2.4B","gr":"0.4% Cu","no":"QB2 supergene expansion now produci"},{"n":"Quellaveco","c":"Peru","la":-17.1,"ln":-70.63,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Anglo American (60%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Anglo Cu; ramped up 2023","em":"~3,500","dp":null,"d":1862,"o":2022,"rv":"~$2.9B","no":"Anglo American's newest Tier 1 Cu a"},{"n":"Radomiro Tomic","c":"Chile","la":-22.22,"ln":-68.9,"co":["Copper"],"pc":"Copper","cp":"Codelco","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Codelco total; open pit + leach","em":"~2,000","dp":"~400m","d":1979,"o":1998,"rv":"~$1.9B","rs":"~3.5Bt","no":"Adjacent to Chuquicamata"},{"n":"Raglan","c":"Canada","la":61.7,"ln":-73.6,"co":["Nickel","Copper","PGMs"],"pc":"Copper","cp":"Glencore","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of Glencore Ni 77.3kt (ex-KNS); INO recovery","em":"~800","dp":"~500m","d":1993,"o":1997,"rv":"~$142M","rs":"~15Mt","no":"Arctic nickel mine, wind-powered"},{"n":"Rajpura Dariba","c":"India","la":25.03,"ln":74.13,"co":["Zinc","Lead","Silver"],"pc":"Zinc","cp":"Hindustan Zinc (Vedanta)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of HZL integrated Zn-Pb-Ag operations","em":"~1,000","dp":"~700m","d":1985,"o":1994,"rv":null,"rs":"~25Mt","no":"Major HZL complex with smelter"},{"n":"Rampura Agucha","c":"India","la":25.8,"ln":74.76,"co":["Zinc","Lead","Silver"],"pc":"Zinc","cp":"Hindustan Zinc (Vedanta)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"World's largest Zn mine; part of HZL ~1Mt Zn-Pb","em":"~2,000","dp":"~600m","d":1977,"o":1991,"rv":"~$1.4B","rs":"~100Mt","gr":"13% Zn+Pb","no":"World's largest zinc mine"},{"n":"Red Chris","c":"Canada","la":57.7,"ln":-129.78,"co":["Copper","Gold"],"pc":"Gold","cp":"Newmont (70%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"39koz Au; plus Cu (Newmont 70% CY2024)","em":"~600","dp":"~300m","d":2001,"o":2015,"rv":"~$93M","rs":"~500Mt","no":"Block cave expansion planned"},{"n":"Red Dog","c":"United States","la":68.07,"ln":-162.87,"co":["Zinc","Lead"],"pc":"Zinc","cp":"Teck Resources","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Zn-Pb; world's largest Zn mine ~500kt Zn","em":"~600","dp":"~150m","d":1968,"o":1989,"rv":"~$1.6B","rs":"~50Mt","gr":"15% Zn","no":"World's largest zinc mine, above Ar"},{"n":"Reko Diq","c":"Pakistan","la":29.04,"ln":62.06,"co":["Copper","Gold"],"pc":"Copper","cp":"Barrick Gold (50%) / Pakistan ","t":"Open Pit","m":"Conventional","st":"Construction","pr":"In development; first production targeted 2028","em":"~500","dp":null,"d":1993,"o":2028,"rv":null,"capex":"$7.0B","fpDate":2028,"stage":"Construction — first ore targeted 2028"},{"n":"Richards Bay Minerals","c":"South Africa","la":-28.7,"ln":32.15,"co":["Titanium"],"pc":"Titanium","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Titanium dioxide slag production; 3/4 furnaces onl","em":"~4,000","dp":"~20m","d":1971,"o":1977,"rv":"~$500M","no":"World's largest mineral sands opera"},{"n":"Rio Tinto Fer et Titane","c":"Canada","la":46.34,"ln":-72.55,"co":["Titanium","Iron Ore"],"pc":"Iron Ore","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Operating","pr":"6/9 furnaces operating at RTIT Quebec Ops; 1 rebui","em":"~1,000","dp":"~100m","d":1946,"o":1950,"rv":"~$750M"},{"n":"Rio Tuba","c":"Philippines","la":8.51,"ln":117.44,"co":["Nickel"],"pc":"Nickel","cp":"Nickel Asia","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni laterite; Philippines","em":"~1,000","dp":"~30m","d":1970,"o":2005,"rv":"~$247M"},{"n":"Robe River","c":"Australia","la":-21.57,"ln":115.98,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Pilbara operations: 328Mt total","em":"~600","dp":"~100m","d":1964,"o":1972,"rv":"~$3.9B"},{"n":"Rocanville","c":"Canada","la":50.45,"ln":-101.35,"co":["Potash"],"pc":"Potash","cp":"Nutrien","t":"Underground","m":"Deep Level","st":"Operating","pr":"Part of Nutrien potash; largest K mine","em":"~1,200","dp":"~1000m","d":1952,"o":1970,"rv":"~$1.5B","no":"Largest potash mine in the world"},{"n":"Rosebery","c":"Australia","la":-41.78,"ln":145.53,"co":["Zinc","Copper","Lead","Gold","Silver"],"pc":"Copper","cp":"MMG Limited","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Zn-Cu-Pb polymetallic UG; Tasmania","em":"~500","dp":"~1700m","d":1893,"o":1936,"rv":"~$38M","rs":"~7Mt","gr":"4% Zn, 1.5% Pb","no":"125+ years of history"},{"n":"Rössing","c":"Namibia","la":-22.48,"ln":15.05,"co":["Uranium"],"pc":"Uranium","cp":"CNNC (China)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"~2,500t U3O8; Namibia","em":"~1,000","dp":"~350m","d":1966,"o":1976,"rv":"~$487M","rs":"~100Mt","no":"Longest running open pit uranium mi"},{"n":"Round Mountain","c":"United States","la":38.72,"ln":-117.07,"co":["Gold"],"pc":"Gold","cp":"Kinross Gold","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Kinross total","em":"~1,000","dp":"~200m","d":1906,"o":1977,"rv":null,"gr":"0.5g/t Au"},{"n":"Roy Hill","c":"Australia","la":-22.43,"ln":119.96,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Hancock Prospecting (70%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"~60Mt iron ore; Pilbara","em":"~2,500","dp":"~100m","d":2011,"o":2015,"rv":"~$6.6B","rs":"~2.4Bt","gr":"59% Fe","no":"Gina Rinehart's $10B mine-rail-port"},{"n":"Sabodala-Massawa","c":"Senegal","la":12.86,"ln":-11.95,"co":["Gold"],"pc":"Gold","cp":"Endeavour Mining (90%)","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Part of Endeavour 1.1Moz Au CY2024; BIOX expansion","em":"~2,000","dp":"~250m","d":2004,"o":2009,"rv":"~$2.6B","gr":"2.5g/t Au","no":"Combined operation"},{"n":"Safford/Lone Star","c":"United States","la":32.88,"ln":-109.68,"co":["Copper"],"pc":"Copper","cp":"Freeport-McMoRan","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of FCX Americas Cu production; Lone Star expa","em":"~1,500","dp":"~300m","d":1944,"o":2007,"rv":"~$2.9B","rs":"~1.5Bt","no":"Oxide + sulphide processing"},{"n":"Safi-Jorf Lasfar","c":"Morocco","la":33.1,"ln":-8.65,"co":["Phosphate"],"pc":"Phosphate","cp":"OCP Group","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Phosphate processing; Morocco","em":"~4,000","dp":null,"d":1921,"o":1975,"rv":"~$3.0B"},{"n":"Salar de Atacama","c":"Chile","la":-23.5,"ln":-68.3,"co":["Lithium"],"pc":"Lithium","cp":"SQM / Albemarle","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Li brine; world's largest Li operation","em":"~5,000","dp":"~10m","d":1980,"o":1997,"rv":"~$720M","gr":"0.15% Li","no":"World's largest lithium operation, "},{"n":"Salar de Olaroz","c":"Argentina","la":-23.5,"ln":-66.7,"co":["Lithium"],"pc":"Lithium","cp":"Allkem (merged into Arcadium L","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Li brine; Argentina","em":"~500","dp":"~10m","d":2010,"o":2015,"rv":"~$100M","gr":"0.06% Li","no":"Rio Tinto acquired Arcadium Lithium"},{"n":"Salar del Hombre Muerto","c":"Argentina","la":-25.4,"ln":-67.08,"co":["Lithium"],"pc":"Lithium","cp":"Arcadium Lithium (now Rio Tint","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Li brine; Argentina","em":"~300","dp":"~10m","d":2012,"o":2023,"rv":"~$10M","gr":"0.06% Li"},{"n":"Salobo","c":"Brazil","la":-5.79,"ln":-50.54,"co":["Copper","Gold"],"pc":"Copper","cp":"Vale","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Record annual Cu production; Salobo 3 ramp-up comp","em":"~3,000","dp":"~300m","d":1982,"o":2012,"rv":"~$3.3B","rs":"~1.1Bt","no":"One of Brazil's largest Cu mines"},{"n":"Sangarédi","c":"Guinea","la":11.08,"ln":-13.8,"co":["Bauxite"],"pc":"Bauxite","cp":"Compagnie des Bauxites de Guin","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Bauxite; Guinea","em":"~3,000","dp":"~30m","d":1952,"o":1973,"rv":"~$750M"},{"n":"Saraji","c":"Australia","la":-22.44,"ln":148.15,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"BHP Mitsubishi Alliance (BMA)","t":"Open Pit","m":"Dragline","st":"Operating","pr":"3.3Mt met coal (BHP 50% share FY24)","em":"~1,200","dp":"~150m","d":1957,"o":1974,"rv":"~$825M","rs":"~500Mt","no":"Premium hard coking coal"},{"n":"Savage River","c":"Australia","la":-41.56,"ln":145.17,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Grange Resources","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Iron ore; Tasmania","em":"~500","dp":"~150m","d":1965,"o":1967,"rv":"~$220M","rs":"~200Mt","no":"Australia's oldest magnetite operat"},{"n":"Sentinel","c":"Zambia","la":-12.5,"ln":25.52,"co":["Copper"],"pc":"Copper","cp":"First Quantum Minerals","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu; ~250kt Cu; Zambia","em":"~3,000","dp":"~300m","d":2011,"o":2016,"rv":"~$2.4B","rs":"~800Mt","gr":"0.5% Cu","no":"Modern large-scale copper mine"},{"n":"Sepon","c":"Laos","la":16.8,"ln":106.4,"co":["Gold","Copper"],"pc":"Copper","cp":"MMG Limited (90%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Au-Cu; Laos; nearing end of mine life","em":"~3,000","dp":"~200m","d":1997,"o":2003,"rv":null,"rs":"~200Mt","no":"Combined Au-Cu operation"},{"n":"Sichuan Lithium","c":"China","la":32.85,"ln":101.48,"co":["Lithium"],"pc":"Lithium","cp":"Tianqi Lithium","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Li; China domestic","em":"~1,000","dp":"~400m","d":1990,"o":2005,"rv":"~$80M"},{"n":"Sierra Gorda","c":"Chile","la":-22.89,"ln":-69.32,"co":["Copper","Molybdenum","Gold"],"pc":"Copper","cp":"KGHM (55%) / Sumitomo (45%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Mo-Au; Chile","em":"~3,000","dp":"~400m","d":2007,"o":2014,"rv":"~$1.1B","rs":"~1.6Bt","gr":"0.4% Cu","no":"$4B investment"},{"n":"Siguiri","c":"Guinea","la":11.68,"ln":-9.16,"co":["Gold"],"pc":"Gold","cp":"AngloGold Ashanti (85%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of AGA total; Guinea","em":"~2,000","dp":"~80m","d":1887,"o":1997,"rv":"~$500M"},{"n":"Sindesar Khurd","c":"India","la":25.28,"ln":73.82,"co":["Zinc","Lead","Silver"],"pc":"Zinc","cp":"Hindustan Zinc (Vedanta)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of HZL; high-grade Zn-Pb-Ag UG mine","em":"~1,500","dp":"~900m","d":1985,"o":2006,"rv":null,"rs":"~30Mt","no":"World's 2nd largest zinc mine, high"},{"n":"Sishen","c":"South Africa","la":-27.73,"ln":22.98,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Kumba Iron Ore (Anglo American","t":"Open Pit","m":"Conventional","st":"Operating","pr":"~25Mt iron ore","em":"~4,500","dp":"~300m","d":1939,"o":1953,"rv":"~$2.8B","rs":"~500Mt","gr":"64% Fe","no":"One of world's largest OP iron ore "},{"n":"Solomon Hub","c":"Australia","la":-22.58,"ln":118.02,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Fortescue","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Fortescue total ~192Mt shipped FY24","em":"~2,000","dp":"~100m","d":2009,"o":2013,"rv":"~$7.7B","rs":"~1.2Bt","no":"Higher-grade Kings & Firetail depos"},{"n":"Sorowako","c":"Indonesia","la":-2.53,"ln":121.35,"co":["Nickel"],"pc":"Nickel","cp":"Vale Indonesia (PTVI)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni; Indonesia","em":"~3,000","dp":"~30m","d":1969,"o":1978,"rv":"~$297M","rs":"~120Mt","gr":"1.8% Ni","no":"Vale deconsolidated PTVI in 2024"},{"n":"South Deep","c":"South Africa","la":-26.42,"ln":27.66,"co":["Gold"],"pc":"Gold","cp":"Gold Fields","t":"Underground","m":"Deep Level","st":"Operating","pr":"Part of Gold Fields total ~2.3Moz Au CY2024","em":"~4,000","dp":"~3000m","d":1940,"o":1963,"rv":"~$550M","gr":"5.5g/t Au"},{"n":"South Walker Creek","c":"Australia","la":-22.05,"ln":148.6,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"BHP Mitsubishi Alliance","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Met coal; BMA JV","em":"~700","dp":"~80m","d":1985,"o":2003,"rv":"~$1.2B"},{"n":"Spence","c":"Chile","la":-22.8,"ln":-69.27,"co":["Copper"],"pc":"Copper","cp":"BHP","t":"Open Pit","m":"Conventional","st":"Operating","pr":"255kt Cu (FY24 record); includes 150kt concentrate","em":"~2,000","dp":"~300m","d":2002,"o":2006,"rv":"~$2.4B","rs":"~1.2Bt","no":"SGO concentrator added 2021"},{"n":"St Ives","c":"Australia","la":-31.27,"ln":121.62,"co":["Gold"],"pc":"Gold","cp":"Gold Fields","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Part of Gold Fields Australia region","em":"~800","dp":"~1200m","d":1932,"o":1982,"rv":"~$335M","gr":"2.5g/t Au","no":"Multiple ops around Lake Lefroy","rs":"~45Mt @ 2.2 g/t Au"},{"n":"Stillwater","c":"United States","la":45.38,"ln":-109.87,"co":["Platinum","Palladium"],"pc":"Gold","cp":"Sibanye-Stillwater","t":"Underground","m":"Open Stoping","st":"Operating","pr":"US PGM operations; ~300koz 2E","em":"~1,800","dp":"~1500m","d":1967,"o":1986,"rv":"~$330M","no":"Only PGM mine in the US"},{"n":"Sukari","c":"Egypt","la":24.95,"ln":33.8,"co":["Gold"],"pc":"Gold","cp":"Centamin","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Au ~450koz; Egypt's only major Au mine","em":"~2,000","dp":"~400m","d":2007,"o":2009,"rv":"~$1.1B","gr":"1.5g/t Au","no":"Egypt's first modern large-scale go"},{"n":"Sukinda","c":"India","la":21.05,"ln":85.87,"co":["Chromite"],"pc":"Chromite","cp":"Tata Steel Mining","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cr; India; Odisha","em":"~2,000","dp":"~60m","d":1950,"o":1960,"rv":"~$1.2B","no":"Largest chromite reserves in India"},{"n":"Sunrise Dam","c":"Australia","la":-29.1,"ln":122.4,"co":["Gold"],"pc":"Gold","cp":"AngloGold Ashanti","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Part of AGA total; Australia","em":"~1,000","dp":"~700m","d":1988,"o":1997,"rv":"~$280M","no":"Transitioning to deeper UG","rs":"~28Mt @ 3.8 g/t Au","gr":"3.8 g/t Au"},{"n":"Super Pit (KCGM)","c":"Australia","la":-30.78,"ln":121.5,"co":["Gold"],"pc":"Gold","cp":"Northern Star Resources","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Part of NST ~1.7Moz Au total","em":"~1,800","dp":"~600m","d":1893,"o":1989,"rv":"~$956M","gr":"1.2g/t Au","no":"Iconic Kalgoorlie Super Pit","rs":"~175Mt @ 1.1 g/t Au"},{"n":"Syama","c":"Mali","la":11.21,"ln":-6.2,"co":["Gold"],"pc":"Gold","cp":"Resolute Mining","t":"Underground","m":"Block Caving","st":"Operating","pr":"Au; Mali; automated UG","em":"~1,200","dp":"~600m","d":1988,"o":1990,"rv":"~$238M","gr":"2.5g/t Au"},{"n":"Taconite Harbor","c":"United States","la":47.35,"ln":-91.17,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Cleveland-Cliffs","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Iron ore taconite; MN USA","em":"~500","dp":"~100m","d":1870,"o":1957,"rv":"~$880M"},{"n":"Taganito","c":"Philippines","la":9.87,"ln":125.82,"co":["Nickel"],"pc":"Nickel","cp":"Nickel Asia / Sumitomo JV","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni HPAL; Philippines","em":"~1,500","dp":"~30m","d":1975,"o":2013,"rv":"~$247M"},{"n":"Taharoa","c":"New Zealand","la":-38.18,"ln":174.69,"co":["Iron Ore"],"pc":"Iron Ore","cp":"NZ Steel Mining (Bluescope)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ironsand; NZ","em":"~200","dp":"~20m","d":1970,"o":1971,"rv":"~$330M"},{"n":"Tanami","c":"Australia","la":-20.05,"ln":129.7,"co":["Gold"],"pc":"Gold","cp":"Newmont","t":"Underground","m":"Open Stoping","st":"Operating","pr":"408koz Au (CY2024)","em":"~1,200","dp":"~1400m","d":1984,"o":1986,"rv":"~$974M","gr":"5.5g/t Au","no":"Remote desert operation, expansion "},{"n":"Tara (Navan)","c":"Ireland","la":53.65,"ln":-6.78,"co":["Zinc","Lead"],"pc":"Zinc","cp":"Boliden","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of Boliden Mines; Europe's largest Zn mine","em":"~700","dp":"~600m","d":1970,"o":1977,"rv":null,"gr":"7% Zn"},{"n":"Tarkwa","c":"Ghana","la":5.3,"ln":-1.98,"co":["Gold"],"pc":"Gold","cp":"Gold Fields","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Gold Fields West Africa region","em":"~3,500","dp":"~200m","d":1896,"o":1906,"rv":"~$350M","no":"Ghana's largest gold mine"},{"n":"Tasiast","c":"Mauritania","la":20.53,"ln":-15.96,"co":["Gold"],"pc":"Gold","cp":"Kinross Gold","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Kinross total; Tasiast 24k expansion","em":"~2,500","dp":null,"d":2007,"o":2008,"rv":null,"gr":"1.5g/t Au"},{"n":"Tavan Tolgoi","c":"Mongolia","la":43.59,"ln":105.95,"co":["Coal (Met)"],"pc":"Coal (Met)","cp":"Erdenes Tavan Tolgoi (Mongolia","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Met coal; Mongolia; ~30Mt target","em":"~3,000","dp":"~150m","d":1941,"o":2011,"rv":"~$7.5B","rs":"~6.4Bt","no":"World's largest undeveloped coking "},{"n":"Telfer","c":"Australia","la":-21.71,"ln":122.23,"co":["Gold","Copper"],"pc":"Gold","cp":"Greatland Gold (acquired Dec 2","t":"Open Pit & Underground","m":"Block Caving","st":"Operating","pr":"83koz Au (CY2024 partial; sold Dec 3 2024)","em":"~800","dp":"~1200m","d":1972,"o":1977,"rv":"~$198M","no":"Sold by Newmont to Greatland Gold o","rs":"~110Mt @ 0.52 g/t Au, 0.04% Cu","gr":"0.52 g/t Au, 0.04% Cu"},{"n":"Tenke Fungurume","c":"DR Congo","la":-10.62,"ln":26.13,"co":["Copper","Cobalt"],"pc":"Copper","cp":"CMOC Group (80%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Co; major DRC operation ~250kt Cu","em":"~7,000","dp":null,"d":1920,"o":2009,"rv":"~$2.4B","rs":"~1.5Bt","gr":"2.5% Cu","no":"One of largest Cu-Co operations"},{"n":"TFM Phase II","c":"DR Congo","la":-10.66,"ln":25.57,"co":["Copper","Cobalt"],"pc":"Copper","cp":"CMOC Group (80%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Co expansion; ramp-up","em":"~5,000","dp":"~300m","d":2012,"o":2014,"rv":"~$712M"},{"n":"Thalanga","c":"Australia","la":-19.14,"ln":145.83,"co":["Zinc","Copper"],"pc":"Copper","cp":"Red River Resources","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Zn-Cu; small QLD UG","em":"~150","dp":"~500m","d":1979,"o":1986,"rv":"~$23M"},{"n":"Thunderbox","c":"Australia","la":-27.62,"ln":121.1,"co":["Gold"],"pc":"Gold","cp":"Northern Star Resources","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Part of NST Yandal ops","em":"~600","dp":"~300m","d":2003,"o":2016,"rv":null,"no":"Growing gold operation near Leinste"},{"n":"Tom Price","c":"Australia","la":-22.69,"ln":117.79,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Pilbara operations: 328Mt total","em":"~1,200","dp":"~200m","d":1962,"o":1966,"rv":"~$2.2B","rs":"~500Mt","no":"Rio Tinto's first Pilbara mine"},{"n":"Tomingley","c":"Australia","la":-32.56,"ln":148.21,"co":["Gold"],"pc":"Gold","cp":"Alkane Resources","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Au; NSW","em":"~350","dp":"~300m","d":2008,"o":2014,"rv":"~$143M","gr":"2.0g/t Au","no":"Growing central NSW gold operation"},{"n":"Tongon","c":"Ivory Coast","la":9.74,"ln":-5.87,"co":["Gold"],"pc":"Gold","cp":"Barrick Gold (89.7%)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Africa & ME region (Barrick 89.7%)","em":"~1,500","dp":"~150m","d":2006,"o":2010,"rv":null},{"n":"Tonkolili","c":"Sierra Leone","la":8.95,"ln":-11.73,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Shandong Iron and Steel","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Iron ore; Sierra Leone","em":"~2,000","dp":"~100m","d":1960,"o":2011,"rv":"~$660M"},{"n":"Toquepala","c":"Peru","la":-17.25,"ln":-70.6,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Southern Copper","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Mo; ~140kt Cu; Peru","em":"~3,000","dp":"~600m","d":1900,"o":1960,"rv":"~$1.3B","rs":"~2.0Bt","gr":"0.6% Cu","no":"Major porphyry copper"},{"n":"Toromocho","c":"Peru","la":-11.6,"ln":-76.13,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Chinalco (Peru)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu-Mo; ~200kt Cu; Peru","em":"~2,500","dp":"~400m","d":1900,"o":2013,"rv":"~$1.9B","rs":"~1.5Bt","gr":"0.5% Cu","no":"Required relocation of town of Moro"},{"n":"Tronox Namakwa","c":"South Africa","la":-31.37,"ln":17.73,"co":["Titanium"],"pc":"Titanium","cp":"Tronox","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ti mineral sands; SA","em":"~1,000","dp":"~30m","d":1979,"o":1994,"rv":"~$500M"},{"n":"Tropicana","c":"Australia","la":-29.24,"ln":124.55,"co":["Gold"],"pc":"Gold","cp":"AngloGold Ashanti (70%) / Regi","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Au; WA JV","em":"~1,000","dp":"~250m","d":2005,"o":2013,"rv":"~$669M","gr":"2.0g/t Au","no":"Remote FIFO mine 330km ENE of Kalgo","rs":"~82Mt @ 1.9 g/t Au"},{"n":"Turquoise Ridge","c":"United States","la":41.23,"ln":-117.22,"co":["Gold"],"pc":"Gold","cp":"Nevada Gold Mines (Barrick 61.","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of NGM complex; UG ramp-up progressing","em":"~1,200","dp":"~400m","d":1987,"o":1994,"rv":"~$478M"},{"n":"Twin Buttes","c":"United States","la":40.78,"ln":-117.6,"co":["Gold"],"pc":"Gold","cp":"Nevada Gold Mines","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of NGM; may be different name in dataset","em":"~1,200","dp":"~700m","d":1962,"o":1969,"rv":null,"no":"Part of Turquoise Ridge complex"},{"n":"Udokan","c":"Russia","la":56.49,"ln":118.4,"co":["Copper"],"pc":"Copper","cp":"Udokan Copper (USM Holdings)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Cu; Russia; new mine 2023","em":"~1,500","dp":"~400m","d":1949,"o":2023,"rv":"~$712M"},{"n":"UG2 Chrome (Samancor)","c":"South Africa","la":-25.68,"ln":27.28,"co":["Chromite"],"pc":"Chromite","cp":"Samancor Chrome","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Cr; SA","em":"~5,000","dp":"~800m","d":1925,"o":1980,"rv":"~$600M"},{"n":"Ulan","c":"Australia","la":-32.28,"ln":149.76,"co":["Coal (Thermal)","Coal (Met)"],"pc":"Coal (Met)","cp":"Glencore","t":"Underground","m":"Longwall","st":"Operating","pr":"Coal; NSW","em":"~600","dp":"~400m","d":1970,"o":1982,"rv":"~$650M"},{"n":"Vanscoy","c":"Canada","la":51.94,"ln":-107.08,"co":["Potash"],"pc":"Potash","cp":"Nutrien","t":"Underground","m":"Longwall","st":"Operating","pr":"Part of Nutrien potash","em":"~500","dp":"~1000m","d":1952,"o":1966,"rv":"~$900M"},{"n":"Vatukoula","c":"Fiji","la":-17.75,"ln":177.85,"co":["Gold"],"pc":"Gold","cp":"Vatukoula Gold Mines","t":"Underground","m":"Cut & Fill","st":"Operating","pr":"Au; Fiji; small-scale","em":"~700","dp":"~700m","d":1932,"o":1934,"rv":"~$59M","no":"Pacific Islands gold mine"},{"n":"Veladero","c":"Argentina","la":-29.35,"ln":-70.04,"co":["Gold","Silver"],"pc":"Gold","cp":"Barrick Gold (50%) / Shandong ","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Au-Ag; Argentina OP heap leach","em":"~3,000","dp":"~200m","d":1998,"o":2005,"rv":"~$597M","no":"At ~4,800m elevation"},{"n":"Venetia","c":"South Africa","la":-22.42,"ln":29.32,"co":["Diamonds"],"pc":"Diamonds","cp":"De Beers","t":"Underground","m":"Block Caving","st":"Operating","pr":"De Beers' flagship SA mine; transitioned to UG","em":"~3,500","dp":"~1000m","d":1980,"o":1992,"rv":"~$350M","gr":"60 cpht","no":"De Beers flagship, $2B UG expansion"},{"n":"Verninskoye","c":"Russia","la":56.5,"ln":115.0,"co":["Gold"],"pc":"Gold","cp":"Polyus","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Au; Irkutsk region","em":"~1,500","dp":"~300m","d":1980,"o":2016,"rv":"~$358M"},{"n":"Voisey's Bay","c":"Canada","la":56.33,"ln":-62.09,"co":["Nickel","Copper","Cobalt"],"pc":"Copper","cp":"Vale","t":"Underground","m":"Open Stoping","st":"Operating","pr":"UG mines (VBME) ramping up; Ni+Cu; part of Vale 16","em":"~1,000","dp":"~400m","d":1993,"o":2005,"rv":"~$118M","rs":"~30Mt","gr":"1.7% Ni","no":"World-class nickel deposit"},{"n":"Wahgnion","c":"Burkina Faso","la":10.9,"ln":-3.25,"co":["Gold"],"pc":"Gold","cp":"Lilium Mining (ex-Endeavour)","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Divested Jun 2023 to Lilium Mining","em":"~1,000","dp":"~100m","d":2012,"o":2019,"rv":null,"no":"Divested by Endeavour Jun 30, 2023"},{"n":"Waihi","c":"New Zealand","la":-37.38,"ln":175.85,"co":["Gold","Silver"],"pc":"Gold","cp":"OceanaGold","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Au-Ag; New Zealand UG","em":"~350","dp":"~500m","d":1878,"o":1878,"rv":"~$238M","gr":"4g/t Au","no":"Historic Coromandel gold mine"},{"n":"Warkworth","c":"Australia","la":-32.54,"ln":151.1,"co":["Coal (Thermal)"],"pc":"Coal (Thermal)","cp":"Yancoal","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Thermal coal; NSW Hunter Valley","em":"~1,200","dp":"~100m","d":1977,"o":1981,"rv":"~$910M"},{"n":"Weda Bay","c":"Indonesia","la":0.4,"ln":127.9,"co":["Nickel"],"pc":"Nickel","cp":"Tsingshan / Eramet JV","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Ni; Indonesia","em":"~10,000","dp":"~30m","d":2007,"o":2020,"rv":"~$247M","rs":"~500Mt","no":"Major Indonesian nickel smelting hu"},{"n":"Weipa","c":"Australia","la":-12.63,"ln":141.87,"co":["Bauxite"],"pc":"Bauxite","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of 58.7Mt bauxite total (record); Amrun opera","em":"~1,600","dp":"~30m","d":1955,"o":1963,"rv":"~$2.0B","rs":"~2.0Bt","no":"World's largest bauxite operation"},{"n":"Worsley","c":"Australia","la":-33.1,"ln":116.45,"co":["Bauxite"],"pc":"Bauxite","cp":"South32 (86%)","t":"Open Pit","m":"Dragline","st":"Operating","pr":"Bauxite-alumina; part of South32","em":"~1,500","dp":"~30m","d":1972,"o":1989,"rv":"~$500M","rs":"~700Mt","no":"One of world's lowest-cost alumina "},{"n":"Yanacocha","c":"Peru","la":-6.97,"ln":-78.54,"co":["Gold","Silver"],"pc":"Gold","cp":"Newmont (51.35%) / Buenaventur","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Au-Ag; Peru; ~354koz Au CY2024","em":"~3,000","dp":"~400m","d":1986,"o":1993,"rv":"~$845M","no":"South America's largest gold mine"},{"n":"Yandi","c":"Australia","la":-22.72,"ln":119.02,"co":["Iron Ore"],"pc":"Iron Ore","cp":"BHP","t":"Open Pit","m":"Conventional","st":"Operating","pr":"18Mt iron ore (BHP share FY24)","em":"~500","dp":"~100m","d":1991,"o":1991,"rv":"~$2.0B"},{"n":"Yandicoogina","c":"Australia","la":-22.73,"ln":119.03,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Part of Pilbara ops; depleting, transitioning to W","em":"~1,000","dp":"~100m","d":1989,"o":1998,"rv":"~$2.8B","rs":"~400Mt","no":"Depletion noted; transitioning to W"},{"n":"Young-Davidson","c":"Canada","la":47.88,"ln":-80.1,"co":["Gold"],"pc":"Gold","cp":"Alamos Gold","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of Alamos total","em":"~500","dp":"~1200m","d":1910,"o":2012,"rv":null,"gr":"2.5g/t Au"},{"n":"Yunnan Tin","c":"China","la":23.37,"ln":103.38,"co":["Tin"],"pc":"Tin","cp":"Yunnan Tin Group","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Sn; China; world's largest Sn producer","em":"~5,000","dp":"~600m","d":200,"o":1950,"rv":null,"no":"World's largest tin producer"},{"n":"Zawar","c":"India","la":24.35,"ln":73.72,"co":["Zinc","Lead"],"pc":"Zinc","cp":"Hindustan Zinc (Vedanta)","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Part of HZL; oldest Zn mine in India","em":"~1,200","dp":"~400m","d":300,"o":1968,"rv":null,"rs":"~20Mt","no":"One of world's oldest mines - 4,000"},{"n":"Zijin Mining Hunchun","c":"China","la":42.89,"ln":130.37,"co":["Gold","Copper"],"pc":"Copper","cp":"Zijin Mining","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Au-Cu; China","em":"~1,000","dp":"~300m","d":1995,"o":2012,"rv":null},{"n":"Zijinshan","c":"China","la":25.16,"ln":116.38,"co":["Gold","Copper"],"pc":"Copper","cp":"Zijin Mining","t":"Open Pit & Underground","m":"Conventional","st":"Operating","pr":"Au-Cu; China","em":"~5,000","dp":"~500m","d":1998,"o":2005,"rv":null,"rs":"~500Mt","no":"Zijin Mining's flagship"},{"n":"Zinkgruvan","c":"Sweden","la":58.82,"ln":15.1,"co":["Zinc","Lead","Silver"],"pc":"Zinc","cp":"Lundin Mining","t":"Underground","m":"Open Stoping","st":"Operating","pr":"Zn-Pb-Ag; Sweden UG","em":"~500","dp":null,"d":1857,"o":1857,"rv":null,"gr":"8% Zn"},{"n":"Zouerate","c":"Mauritania","la":22.73,"ln":-12.47,"co":["Iron Ore"],"pc":"Iron Ore","cp":"SNIM","t":"Open Pit","m":"Conventional","st":"Operating","pr":"Iron ore; Mauritania; same complex as Guelb","em":"~5,000","dp":"~100m","d":1952,"o":1963,"rv":"~$1.3B"},{"n":"Resolution Copper","c":"United States","la":33.3,"ln":-111.1,"co":["Copper"],"pc":"Copper","cp":"Rio Tinto / BHP","t":"Underground","m":"Block Caving","st":"Feasibility","capex":"$8.0B","fpDate":2032,"stage":"Feasibility complete, permitti","pr":"~450kt Cu/yr","no":"Would be largest US copper mine; pe"},{"n":"Kamoa-Kakula Phase 3","c":"DRC","la":-10.72,"ln":26.17,"co":["Copper"],"pc":"Copper","cp":"Ivanhoe Mines","t":"Underground","m":"Cut & Fill","st":"Construction","capex":"$1.3B","fpDate":2024,"stage":"Phase 3 smelter commissioned Q4 2024","pr":"Expansion to ~600kt Cu/yr","no":"Brownfield expansion of Kamoa-Kakul","parent":"Kamoa-Kakula"},{"n":"Josemaria","c":"Argentina","la":-29.28,"ln":-69.62,"co":["Copper","Gold"],"pc":"Copper","cp":"Lundin Mining","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$4.1B","fpDate":2028,"stage":"Under construction","pr":"~130kt Cu/yr + 230koz Au/yr","no":"High-altitude Andean Cu-Au project"},{"n":"Los Azules","c":"Argentina","la":-31.1,"ln":-69.78,"co":["Copper"],"pc":"Copper","cp":"McEwen Copper","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$2.7B","fpDate":2029,"stage":"Feasibility complete","pr":"~170kt Cu/yr","no":"Large porphyry copper deposit in An"},{"n":"El Teniente New Mine Level","c":"Chile","la":-34.09,"ln":-70.35,"co":["Copper"],"pc":"Copper","cp":"Codelco","t":"Underground","m":"Block Caving","st":"Construction","capex":"$5.0B","fpDate":2027,"stage":"Under construction","pr":"Extends mine life 50+ years, ~400kt Cu/yr","no":"Brownfield expansion — deepening wo","parent":"El Teniente"},{"n":"Cascabel","c":"Ecuador","la":0.72,"ln":-78.35,"co":["Copper","Gold"],"pc":"Copper","cp":"SolGold","t":"Underground","m":"Block Caving","st":"Feasibility","capex":"$3.8B","fpDate":2031,"stage":"Pre-feasibility complete","pr":"~140kt Cu/yr + 310koz Au/yr","no":"High-grade Cu-Au porphyry"},{"n":"Wafi-Golpu","c":"Papua New Guinea","la":-7.33,"ln":146.82,"co":["Copper","Gold"],"pc":"Copper","cp":"Newmont / Harmony Gold","t":"Underground","m":"Block Caving","st":"Feasibility","capex":"$5.4B","fpDate":2030,"stage":"Permitting and development agr","pr":"~170kt Cu/yr + 270koz Au/yr","no":"Major Cu-Au block cave project"},{"n":"Olympic Dam Expansion","c":"Australia","la":-30.45,"ln":136.89,"co":["Copper","Uranium","Gold"],"pc":"Copper","cp":"BHP","t":"Underground","m":"Open Stoping","st":"Feasibility","capex":"$3.5B","fpDate":2030,"stage":"Smelter expansion feasibility","pr":"Expansion from ~200kt to ~350kt Cu/yr","no":"Brownfield smelter and mine expansi","parent":"Olympic Dam"},{"n":"Quellaveco Expansion","c":"Peru","la":-17.1,"ln":-70.6,"co":["Copper"],"pc":"Copper","cp":"Anglo American","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$1.0B","fpDate":2028,"stage":"Phase 2 studies","pr":"Expansion from ~300kt to ~400kt Cu/yr","no":"Brownfield phase 2 expansion","parent":"Quellaveco"},{"n":"La Granja","c":"Peru","la":-6.36,"ln":-79.12,"co":["Copper"],"pc":"Copper","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$5.0B","fpDate":2033,"stage":"Pre-feasibility studies","pr":"~350kt Cu/yr potential","no":"One of largest undeveloped Cu depos"},{"n":"Hermosa Taylor","c":"United States","la":31.47,"ln":-110.68,"co":["Zinc","Manganese"],"pc":"Zinc","cp":"South32","t":"Underground","m":"Open Stoping","st":"Construction","capex":"$2.2B","fpDate":2027,"stage":"Under construction — Taylor de","pr":"~160kt Zn equiv/yr","no":"Zinc-manganese, one of largest US z"},{"n":"Côté Gold","c":"Canada","la":47.83,"ln":-81.81,"co":["Gold"],"pc":"Gold","cp":"IAMGOLD","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$1.9B","fpDate":2024,"stage":"First gold poured Jan 2024 / Ramp-up","pr":"~365koz Au/yr","no":"Large open pit gold mine in norther"},{"n":"Skouries","c":"Greece","la":40.47,"ln":23.86,"co":["Gold","Copper"],"pc":"Gold","cp":"Eldorado Gold","t":"Underground","m":"Block Caving","st":"Construction","capex":"$0.9B","fpDate":2026,"stage":"Under construction","pr":"~140koz Au/yr + 30kt Cu/yr","no":"Au-Cu porphyry project"},{"n":"Greenstone","c":"Canada","la":49.75,"ln":-86.9,"co":["Gold"],"pc":"Gold","cp":"Equinox Gold","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$1.3B","fpDate":2024,"stage":"First gold poured Feb 2024 / Ramp-up","pr":"~400koz Au/yr","no":"Open pit gold mine ramping up"},{"n":"Back River (Goose)","c":"Canada","la":65.3,"ln":-106.5,"co":["Gold"],"pc":"Gold","cp":"B2Gold","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$0.8B","fpDate":2025,"stage":"First gold poured 2025","pr":"~300koz Au/yr","no":"Arctic gold project"},{"n":"Pueblo Viejo Expansion","c":"Dominican Republic","la":19.05,"ln":-70.17,"co":["Gold","Silver"],"pc":"Gold","cp":"Barrick Gold / Newmont","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$1.3B","fpDate":2025,"stage":"Plant expansion under construc","pr":"Extends mine life 20+ years","no":"Brownfield expansion","parent":"Pueblo Viejo"},{"n":"Donlin Gold","c":"United States","la":62.06,"ln":-158.22,"co":["Gold"],"pc":"Gold","cp":"Barrick Gold / Novagold","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$7.4B","fpDate":2032,"stage":"Feasibility complete, permitti","pr":"~1.1Moz Au/yr over 27yr","no":"One of world's largest undeveloped"},{"n":"Windfall","c":"Canada","la":49.1,"ln":-77.0,"co":["Gold"],"pc":"Gold","cp":"Osisko Mining","t":"Underground","m":"Open Stoping","st":"Feasibility","capex":"$1.6B","fpDate":2028,"stage":"Feasibility study complete","pr":"~300koz Au/yr","no":"High-grade underground gold"},{"n":"Goldrush","c":"United States","la":40.1,"ln":-116.59,"co":["Gold"],"pc":"Gold","cp":"Nevada Gold Mines (Barric","t":"Underground","m":"Cut & Fill","st":"Construction","capex":"$1.0B","fpDate":2026,"stage":"Development ongoing","pr":"~350koz Au/yr","no":"Carlin-type underground deposit"},{"n":"Pumpkin Hollow","c":"United States","la":39.0,"ln":-119.19,"co":["Copper"],"pc":"Copper","cp":"Nevada Copper","t":"Underground","m":"Open Stoping","st":"Construction","capex":"$0.7B","fpDate":2026,"stage":"Restart — post-bankruptcy (new ownership 2024)","pr":"~50kt Cu/yr","no":"Underground copper near Yerington"},{"n":"Simandou (Blocks 1&2)","c":"Guinea","la":8.5,"ln":-8.9,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Winning Consortium / Baow","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$15.0B","fpDate":2026,"stage":"Under construction — rail + po","pr":"~60Mtpa iron ore","no":"World's largest undeveloped iron o"},{"n":"Simandou (Blocks 3&4)","c":"Guinea","la":8.42,"ln":-8.82,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Rio Tinto / Simfer","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$6.2B","fpDate":2027,"stage":"Under construction","pr":"~60Mtpa iron ore","no":"Southern blocks; shared infrastruct"},{"n":"Onslow Iron","c":"Australia","la":-23.5,"ln":115.35,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Mineral Resources","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$3.0B","fpDate":2026,"stage":"Mine + haul road under constru","pr":"~35Mtpa iron ore","no":"Ken's Bore / Bungaroo; includes 15"},{"n":"Western Range","c":"Australia","la":-22.6,"ln":117.3,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Rio Tinto","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$2.6B","fpDate":2025,"stage":"Under construction — replaceme","pr":"~25Mtpa iron ore","no":"Replacement mine for Paraburdoo; Pi"},{"n":"Iron Bridge","c":"Australia","la":-22.73,"ln":118.55,"co":["Iron Ore"],"pc":"Iron Ore","cp":"Fortescue Metals","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$3.6B","fpDate":2024,"stage":"First ore April 2024 / Ramp-up","pr":"~22Mtpa magnetite concentrate","no":"Magnetite concentrate project"},{"n":"Thacker Pass","c":"United States","la":41.3,"ln":-117.6,"co":["Lithium"],"pc":"Lithium","cp":"Lithium Americas","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$2.3B","fpDate":2027,"stage":"Phase 1 under construction","pr":"~40kt LCE/yr Phase 1","no":"Largest known lithium deposit in US"},{"n":"James Bay","c":"Canada","la":52.28,"ln":-77.18,"co":["Lithium"],"pc":"Lithium","cp":"Arcadium Lithium","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$0.6B","fpDate":2026,"stage":"Under construction","pr":"~320kt spodumene concentrate/yr","no":"Hard-rock spodumene project"},{"n":"Jadar","c":"Serbia","la":44.5,"ln":19.35,"co":["Lithium"],"pc":"Lithium","cp":"Rio Tinto","t":"Underground","m":"Conventional","st":"Feasibility","capex":"$2.4B","fpDate":2029,"stage":"Government approval granted","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Rhyolite Ridge","c":"United States","la":37.9,"ln":-117.7,"co":["Lithium"],"pc":"Lithium","cp":"ioneer","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$1.3B","fpDate":2028,"stage":"Under construction","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Kathleen Valley","c":"Australia","la":-27.6,"ln":120.95,"co":["Lithium"],"pc":"Lithium","cp":"Liontown Resources","t":"Underground","m":"Open Stoping","st":"Construction","capex":"$0.9B","fpDate":2024,"stage":"First spodumene shipped Aug 2024 / Ramp-up","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Manono","c":"DR Congo","la":-7.3,"ln":27.4,"co":["Lithium"],"pc":"Lithium","cp":"AVZ Minerals","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$1.6B","fpDate":2029,"stage":"Feasibility complete","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Kabanga","c":"Tanzania","la":-2.85,"ln":30.55,"co":["Nickel","Cobalt"],"pc":"Nickel","cp":"Lifezone / BHP","t":"Underground","m":"Open Stoping","st":"Feasibility","capex":"$1.3B","fpDate":2028,"stage":"Definitive feasibility","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Crawford","c":"Canada","la":48.7,"ln":-81.0,"co":["Nickel","Cobalt"],"pc":"Nickel","cp":"Canada Nickel","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$3.0B","fpDate":2029,"stage":"Feasibility study","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Araguaia","c":"Brazil","la":-8.4,"ln":-49.3,"co":["Nickel"],"pc":"Nickel","cp":"Horizonte Minerals","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$0.7B","fpDate":2026,"stage":"Construction advanced","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Platreef","c":"South Africa","la":-23.9,"ln":28.95,"co":["Platinum","Nickel"],"pc":"Platinum","cp":"Ivanhoe Mines","t":"Underground","m":"Conventional","st":"Construction","capex":"$1.4B","fpDate":2026,"stage":"Phase 1 under construction","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Jansen","c":"Canada","la":51.8,"ln":-104.8,"co":["Potash"],"pc":"Potash","cp":"BHP","t":"Underground","m":"Conventional","st":"Construction","capex":"$12.5B","fpDate":2026,"stage":"Stage 1 under construction","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Woodsmith","c":"United Kingdom","la":54.45,"ln":-0.7,"co":["Potash"],"pc":"Potash","cp":"Anglo American","t":"Underground","m":"Open Stoping","st":"Construction","capex":"$4.5B","fpDate":2029,"stage":"Construction paused","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Dasa","c":"Niger","la":18.98,"ln":8.2,"co":["Uranium"],"pc":"Uranium","cp":"Global Atomic","t":"Underground","m":"Open Stoping","st":"Construction","capex":"$0.5B","fpDate":2026,"stage":"Phase 1 under construction","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Rook I","c":"Canada","la":57.8,"ln":-109.2,"co":["Uranium"],"pc":"Uranium","cp":"NexGen Energy","t":"Underground","m":"Open Stoping","st":"Feasibility","capex":"$1.3B","fpDate":2029,"stage":"Feasibility complete","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Grasberg Block Cave","c":"Indonesia","la":-4.05,"ln":137.12,"co":["Copper","Gold"],"pc":"Copper","cp":"Freeport-McMoRan","t":"Underground","m":"Block Caving","st":"Construction","capex":"$3.7B","fpDate":2024,"stage":"Block cave ramp-up — full throughput 2024+","parent":"Grasberg","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Cadia Expansion","c":"Australia","la":-33.47,"ln":148.99,"co":["Gold","Copper"],"pc":"Gold","cp":"Newmont","t":"Underground","m":"Block Caving","st":"Construction","capex":"$2.0B","fpDate":2026,"stage":"Panel cave expansion","parent":"Cadia Valley","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Altar","c":"Argentina","la":-31.47,"ln":-69.56,"co":["Copper","Gold"],"pc":"Copper","cp":"Aldebaran Resources","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$3.0B","fpDate":2030,"stage":"Pre-feasibility complete","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Tampakan","c":"Philippines","la":6.42,"ln":125.05,"co":["Copper","Gold"],"pc":"Copper","cp":"Sagittarius Mines","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$5.9B","fpDate":2031,"stage":"Feasibility complete","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Zafranal","c":"Peru","la":-15.9,"ln":-72.35,"co":["Copper","Gold"],"pc":"Copper","cp":"Teck Resources","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$1.3B","fpDate":2027,"stage":"Under construction","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Copper World","c":"United States","la":31.82,"ln":-110.92,"co":["Copper"],"pc":"Copper","cp":"Hudbay Minerals","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$1.3B","fpDate":2028,"stage":"Feasibility study","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Ewoyaa","c":"Ghana","la":5.2,"ln":-1.1,"co":["Lithium"],"pc":"Lithium","cp":"Atlantic Lithium","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$0.6B","fpDate":2026,"stage":"Under construction","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Aripuana","c":"Brazil","la":-10.17,"ln":-59.45,"co":["Zinc","Lead"],"pc":"Zinc","cp":"Nexa Resources","t":"Underground","m":"Open Stoping","st":"Construction","capex":"$0.7B","fpDate":2024,"stage":"Commercial production achieved 2024","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"QB Phase 2 Expansion","c":"Chile","la":-20.97,"ln":-68.82,"co":["Copper"],"pc":"Copper","cp":"Teck Resources","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$1.0B","fpDate":2027,"stage":"Desal expansion","parent":"Quebrada Blanca","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Prominent Hill Expansion","c":"Australia","la":-29.71,"ln":135.53,"co":["Copper","Gold"],"pc":"Copper","cp":"BHP","t":"Underground","m":"Block Caving","st":"Construction","capex":"$1.5B","fpDate":2026,"stage":"Block cave development","parent":"Prominent Hill","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Carrapateena Expansion","c":"Australia","la":-31.31,"ln":137.04,"co":["Copper","Gold"],"pc":"Copper","cp":"BHP","t":"Underground","m":"Block Caving","st":"Construction","capex":"$1.2B","fpDate":2027,"stage":"Block cave expansion","parent":"Carrapateena","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Centinela Second Concentrator","c":"Chile","la":-23.1,"ln":-69.18,"co":["Copper","Gold","Molybdenum"],"pc":"Copper","cp":"Antofagasta Minerals (70%)","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$4.4B","fpDate":2029,"stage":"Construction — FID approved Sep 2024","pr":"~170kt incremental Cu/yr; doubles Centinela output","no":"Brownfield expansion; desalination plant included","parent":"Centinela","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Kansanshi S3","c":"Zambia","la":-12.1,"ln":26.42,"co":["Copper","Gold"],"pc":"Copper","cp":"First Quantum Minerals (80%)","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$1.5B","fpDate":2027,"stage":"Construction — sulphide concentrator","pr":"~200kt Cu/yr from fresh sulphide ore zone","no":"Extends mine life 30+ yr; addresses supergene depletion","parent":"Kansanshi","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Filo del Sol","c":"Chile","la":-28.2,"ln":-69.8,"co":["Copper","Gold","Silver"],"pc":"Copper","cp":"Filo Corp (Lundin 50% / BHP 50%)","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$5.8B","fpDate":2031,"stage":"Feasibility — JV formed 2024","pr":"~200kt Cu/yr + 300koz Au/yr + 10Moz Ag/yr","no":"World-class Cu-Au-Ag porphyry on Chile-Argentina border; BHP/Lundin JV 2024","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"El Pachon","c":"Argentina","la":-31.12,"ln":-69.98,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Glencore","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$3.5B","fpDate":2032,"stage":"Pre-Feasibility","pr":"~200kt Cu/yr potential","no":"High-altitude Andean porphyry; 4,200m elevation near Chile border","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Hemi","c":"Australia","la":-21.1,"ln":119.73,"co":["Gold"],"pc":"Gold","cp":"De Grey Mining (Gold Road / Northern Star JV)","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$1.3B","fpDate":2029,"stage":"Feasibility — FID expected 2026","pr":"~530koz Au/yr over 10+ yr LOM","no":"Tier 1 Pilbara gold discovery; ~$5B+ NPV; De Grey acquired by Northern Star/Gold Road JV 2024","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Ahafo North","c":"Ghana","la":7.2,"ln":-2.25,"co":["Gold"],"pc":"Gold","cp":"Newmont","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$0.9B","fpDate":2024,"stage":"Commissioning — first ore Q3 2024","pr":"~275koz Au/yr (full ramp 2025)","no":"Brownfield expansion of Ahafo complex; adds +15 yr mine life","parent":"Ahafo","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Lumwana Super Pit","c":"Zambia","la":-12.1,"ln":25.85,"co":["Copper"],"pc":"Copper","cp":"Barrick Gold (100%)","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$2.0B","fpDate":2028,"stage":"Construction — FID Nov 2024","pr":"~240kt Cu/yr from expanded open pit","no":"Doubles Lumwana production; extends mine life 37 yr","parent":"Lumwana","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Norte Abierto","c":"Chile","la":-27.2,"ln":-69.75,"co":["Gold","Copper","Silver"],"pc":"Gold","cp":"Barrick (50%) / Newmont (50%)","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$6.0B","fpDate":2032,"stage":"Pre-Feasibility","pr":"~850koz Au equiv/yr; combines Cerro Casale & Caspiche deposits","no":"Atacama region, 4,600m elevation; JV formed 2019; among world largest undeveloped Au-Cu deposits","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Gamsberg Phase 2","c":"South Africa","la":-29.03,"ln":18.82,"co":["Zinc","Lead"],"pc":"Zinc","cp":"Vedanta Zinc International","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$0.4B","fpDate":2026,"stage":"Construction — Phase 2 concentrator","pr":"~400kt Zn/yr (doubles Phase 1 output)","no":"Northern Cape; 300Mt+ Zn resource; one of world largest zinc deposits","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Taca Taca","c":"Argentina","la":-24.3,"ln":-67.1,"co":["Copper","Gold","Molybdenum"],"pc":"Copper","cp":"First Quantum Minerals","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$3.0B","fpDate":2033,"stage":"Pre-Feasibility","pr":"~170kt Cu/yr","no":"Puna plateau, 4,000m elevation; large porphyry Cu system; Argentina","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Vizcachitas","c":"Chile","la":-32.32,"ln":-70.62,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Los Andes Copper","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$2.8B","fpDate":2031,"stage":"Feasibility underway","pr":"~140kt Cu/yr from central Chile porphyry","no":"Near existing infrastructure; strong grades; feasibility study ongoing 2024-2025","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Havieron","c":"Australia","la":-22.23,"ln":122.27,"co":["Gold","Copper"],"pc":"Gold","cp":"Greatland Gold","t":"Underground","m":"Open Stoping","st":"Feasibility","capex":"$1.0B","fpDate":2028,"stage":"Feasibility","pr":"~170koz Au/yr + Cu credits","no":"High-grade Au-Cu shear zone adjacent to Telfer; Greatland Gold holds full interest","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Kurmuk","c":"Ethiopia","la":10.72,"ln":34.27,"co":["Gold"],"pc":"Gold","cp":"Allied Gold","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$0.5B","fpDate":2026,"stage":"Construction — first ore 2026","pr":"~270koz Au/yr","no":"Ethiopia first modern large-scale gold mine; Benishangul-Gumuz region","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Mara","c":"Argentina","la":-27.85,"ln":-66.6,"co":["Copper","Gold","Molybdenum"],"pc":"Copper","cp":"Glencore","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$3.0B","fpDate":2031,"stage":"Feasibility","pr":"~110kt Cu/yr combining Agua Rica + Alumbrera infrastructure","no":"Reuses Alumbrera mill to develop Agua Rica deposit; Catamarca province","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Prieska","c":"South Africa","la":-29.67,"ln":22.74,"co":["Zinc","Copper"],"pc":"Zinc","cp":"Orion Minerals","t":"Underground","m":"Open Stoping","st":"Feasibility","capex":"$0.5B","fpDate":2028,"stage":"Definitive Feasibility Study","pr":"~120kt Zn+Pb/yr + Cu credits","no":"Historic mine restart; Northern Cape; operated 1971-1991","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Frieda River","c":"Papua New Guinea","la":-4.1,"ln":141.87,"co":["Copper","Gold"],"pc":"Copper","cp":"PanAust (Guangdong Rising Assets)","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$6.0B","fpDate":2033,"stage":"Pre-Feasibility","pr":"~120kt Cu/yr + 190koz Au/yr","no":"Remote Sepik River; major infrastructure challenge; one of PNG largest undeveloped Cu deposits","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Magino","c":"Canada","la":47.93,"ln":-83.62,"co":["Gold"],"pc":"Gold","cp":"OceanaGold (acquired Argonaut Gold 2023)","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$1.0B","fpDate":2024,"stage":"First gold poured 2024 / Ramp-up","pr":"~150koz Au/yr at steady state","no":"Northern Ontario; acquired by OceanaGold via Argonaut Gold takeover Aug 2023","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Collahuasi Expansion","c":"Chile","la":-20.98,"ln":-68.72,"co":["Copper","Molybdenum"],"pc":"Copper","cp":"Glencore (44%) / Anglo American (44%)","t":"Open Pit","m":"Conventional","st":"Feasibility","capex":"$7.0B","fpDate":2031,"stage":"Feasibility — desalination + throughput expansion","pr":"~900kt Cu/yr (from ~620kt current); major capacity uplift","no":"Requires desalination expansion at 4,400m elevation; among world largest Cu mines","parent":"Collahuasi","em":"","dp":"","d":0,"o":0,"rv":""},{"n":"Oyu Tolgoi Open Pit","c":"Mongolia","la":43.02,"ln":106.85,"co":["Copper","Gold"],"pc":"Copper","cp":"Rio Tinto (66%) / Govt of Mongolia (34%)","t":"Open Pit","m":"Conventional","st":"Construction","capex":"$1.5B","fpDate":2027,"stage":"Construction — open pit sustaining alongside UG ramp","pr":"Combined UG + OP targeting >500kt Cu/yr","no":"Open pit Phase 2 sustaining investment complements block cave ramp-up","parent":"Oyu Tolgoi Underground","em":"","dp":"","d":0,"o":0,"rv":""}];



// Inline logo SVG for Mine Atlas
const LogoIcon=({size=40})=><svg width={size} height={size} viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#e87d3e"/><stop offset="100%" stopColor="#c4621e"/></linearGradient><linearGradient id="lg2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1a2a3a"/><stop offset="100%" stopColor="#0a1520"/></linearGradient></defs>
  <circle cx="45" cy="45" r="38" fill="url(#lg2)" stroke="url(#lg1)" strokeWidth="2.5"/>
  <ellipse cx="45" cy="32" rx="26" ry="7" fill="none" stroke="#e87d3e" strokeWidth="0.6" opacity="0.3"/>
  <ellipse cx="45" cy="45" rx="32" ry="9" fill="none" stroke="#e87d3e" strokeWidth="0.6" opacity="0.3"/>
  <ellipse cx="45" cy="58" rx="26" ry="7" fill="none" stroke="#e87d3e" strokeWidth="0.6" opacity="0.3"/>
  <ellipse cx="45" cy="45" rx="9" ry="32" fill="none" stroke="#e87d3e" strokeWidth="0.6" opacity="0.3"/>
  <ellipse cx="45" cy="45" rx="22" ry="32" fill="none" stroke="#e87d3e" strokeWidth="0.6" opacity="0.3"/>
  <circle cx="35" cy="36" r="3" fill="#e87d3e" opacity="0.9"/><circle cx="35" cy="36" r="5.5" fill="#e87d3e" opacity="0.12"/>
  <circle cx="55" cy="42" r="2.2" fill="#ffd700" opacity="0.9"/><circle cx="55" cy="42" r="4.5" fill="#ffd700" opacity="0.1"/>
  <circle cx="42" cy="58" r="2.5" fill="#ff2d55" opacity="0.85"/><circle cx="42" cy="58" r="4.5" fill="#ff2d55" opacity="0.1"/>
  <circle cx="60" cy="55" r="1.8" fill="#66ffcc" opacity="0.8"/>
  <circle cx="32" cy="50" r="1.8" fill="#c0c0c0" opacity="0.7"/>
  <line x1="45" y1="12" x2="45" y2="7" stroke="#e87d3e" strokeWidth="2" strokeLinecap="round"/>
  <line x1="40" y1="9.5" x2="50" y2="9.5" stroke="#e87d3e" strokeWidth="2" strokeLinecap="round"/>
</svg>;

// Error boundary for WebGL failures
class GlobeErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={hasError:false,error:null}}
  static getDerivedStateFromError(error){return{hasError:true,error}}
  render(){
    if(this.state.hasError)return <div style={{width:"100vw",height:"100vh",background:"#0f1926",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <LogoIcon size={56}/>
      <div style={{fontSize:"16px",color:"#e87d3e",fontWeight:700,letterSpacing:"2px"}}>MINE ATLAS</div>
      <div style={{fontSize:"13px",color:"#8494a4",maxWidth:"400px",textAlign:"center",lineHeight:1.6}}>Error: {String(this.state.error&&this.state.error.message||"Unknown")}</div><div style={{fontSize:"10px",color:"#ff6666",maxWidth:"400px",textAlign:"center",marginTop:"8px",wordBreak:"break-all"}}>{String(this.state.error&&this.state.error.stack||"").slice(0,300)}</div>
      <button onClick={()=>window.location.reload()} style={{marginTop:"8px",padding:"10px 24px",borderRadius:"8px",background:"rgba(232,125,62,0.15)",border:"1px solid rgba(232,125,62,0.3)",color:"#e87d3e",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Reload Page</button>
    </div>;
    return this.props.children;
  }
}

// ===============================================
// FILTER STORE - centralized state via useReducer
// ===============================================
const INIT_FILTERS={continent:"All",country:"All",commodity:"All",company:"All",mineType:"All",miningMethod:"All",contractor:"All",status:"All",search:""};
function filterReducer(state,action){
  switch(action.type){
    case "SET":return{...state,[action.key]:action.value};
    case "CLEAR":return{...INIT_FILTERS};
    default:return state;
  }
}

// Mining contractor assignments (well-known contracts, ~70 mines)
// Default: "Owner-operated" for mines not listed here
const CTR_MAP={
  // Byrnecut Underground
  "Jundee":["Byrnecut"],"Agnew-Lawlers":["Byrnecut"],"Duketon":["Byrnecut"],"Carosue Dam":["Byrnecut"],
  "Granny Smith":["Byrnecut"],"Gwalia":["Byrnecut"],"Leinster (Nickel West)":["Byrnecut"],"Thunderbox":["Byrnecut"],
  "Mungari":["Byrnecut"],"South Deep":["Byrnecut"],
  // Barminco / Perenti
  "Olympic Dam":["Barminco"],"Dugald River":["Barminco"],"Telfer":["Barminco"],"Syama":["Barminco"],
  "Sukari":["Barminco"],"Bulyanhulu":["Barminco"],"Kibali":["Barminco"],"Fekola":["Barminco"],
  "Hemlo":["Barminco"],"Hemlo":["Barminco"],"Raleigh":["Barminco"],
  // Redpath Mining
  "Cadia Valley":["Redpath"],"Brucejack":["Redpath"],"Kidd Creek":["Redpath"],"LaRonde":["Redpath"],
  "Canadian Malartic":["Redpath"],"Detour Lake":["Redpath"],"Musselwhite":["Redpath"],
  "Island Gold":["Redpath"],"Young-Davidson":["Redpath"],
  // PYBAR Mining
  "CSA (Cobar)":["PYBAR"],"Ernest Henry":["PYBAR"],"Hera":["PYBAR"],"Cowal":["PYBAR"],
  // Macmahon Holdings
  "Tropicana":["Macmahon"],"Batu Hijau":["Macmahon"],"Telfer":["Macmahon"],
  "Mothae":["Macmahon"],"Capricorn Copper":["Macmahon"],
  // RUC Mining / Thiess
  "Carrapateena":["RUC Mining"],"Prominent Hill":["RUC Mining"],
  // Murray & Roberts Cementation
  "Mponeng":["Murray & Roberts"],"Driefontein":["Murray & Roberts"],"Kloof":["Murray & Roberts"],
  "Beatrix":["Murray & Roberts"],"South Deep":["Murray & Roberts","Byrnecut"],
  "Impala Rustenburg":["Murray & Roberts"],"Amandelbult":["Murray & Roberts"],
  // Master Drilling
  "Kamoa-Kakula":["Master Drilling"],"Venetia":["Master Drilling"],"Palabora":["Master Drilling"],
  // Thiess (surface)
  "Curragh":["Thiess"],"Carmichael":["Thiess"],"Dawson":["Thiess"],
  "Blackwater":["Thiess"],"Lake Vermont":["Thiess"],
  // NRW Holdings
  "Solomon Hub":["NRW Holdings"],"Chichester Hub":["NRW Holdings"],"Roy Hill":["NRW Holdings"],
  // Downer
  "Meandu":["Downer"],"Appin":["Downer"],"Dendrobium":["Downer"],
  // SRG Global / other
  "Oyu Tolgoi Underground":["Redpath"],"Grasberg":["Redpath","Byrnecut"],
  "Norilsk-Talnakh":["Owner-operated"],"Escondida":["Owner-operated"],
  "Mount Isa":["Glencore Technology"],"Fosterville":["Barminco"],
  "Macassa":["Redpath"],"Kamoto (KCC)":["Byrnecut"],
  "Super Pit (KCGM)":["Northern Star Resources"],"St Ives":["Barminco"],
  "Tanami":["Barminco"],"Boddington":["Owner-operated"],
  "Lihir":["Owner-operated"],"Cerro Negro":["Owner-operated"],
  "Nova-Bollinger":["Barminco"],"Boliden Area":["Owner-operated"],
  "Garpenberg":["Owner-operated"],"Tara (Navan)":["Owner-operated"],
  "Cigar Lake":["Redpath"],"Stillwater":["Owner-operated"],
  "Neves-Corvo":["Owner-operated"],"Zinkgruvan":["Owner-operated"]
};
// Contractor colors
const ContractorColors={"Byrnecut":"#ef4444","Barminco":"#f59e0b","Redpath":"#3b82f6","PYBAR":"#22c55e","Macmahon":"#a855f7","RUC Mining":"#ec4899","Murray & Roberts":"#14b8a6","Master Drilling":"#f97316","Thiess":"#6366f1","NRW Holdings":"#0ea5e9","Downer":"#84cc16","Glencore Technology":"#64748b","Owner-operated":"#475569"};
const ctrPalette=["#fb7185","#c084fc","#34d399","#fbbf24","#60a5fa","#f472b6","#94a3b8","#e879f9","#22d3ee","#fca5a5"];
let ctrIdx=0;const getContractorColor=c=>ContractorColors[c]||(ContractorColors[c]=ctrPalette[ctrIdx++%ctrPalette.length]);


const MINES = M.map(x=>{
  const ctr=CTR_MAP[x.n]||["Owner-operated"];
  const parseRv=s=>{if(!s)return 0;const t=String(s).replace(/[^0-9.]/g,"");const v=parseFloat(t)||0;return String(s).includes("B")?v*1000:v};
  const parseEm=s=>{if(!s)return 0;return parseInt(String(s).replace(/[^0-9]/g,""))||0};
  const parseDp=s=>{if(!s)return 0;return parseInt(String(s).replace(/[^0-9]/g,""))||0};
  const parseRs=s=>{if(!s)return 0;const t=String(s).replace(/[^0-9.]/g,"");const v=parseFloat(t)||0;if(String(s).includes("Bt"))return v*1e12;if(String(s).includes("Mt"))return v*1e9;return v*1e6};
  return {
    name:x.n,country:x.c,state:x.s||"",region:x.r||"",lat:x.la,lng:x.ln,
    commodity:x.co||[],pc:x.pc||"",company:x.cp||"",type:x.t||"",method:x.m||"",
    status:x.st||"Operating",description:x.pr||"",employees:x.em||"",
    depth:x.dp||"",discovered:x.d||0,opened:x.o||0,notes:x.no||"",
    reserves:x.rs||"",grade:x.gr||"",revenue:x.rv||"",contractors:ctr,
    st:x.st||"Operating",capex:x.capex||"",fpDate:x.fpDate||0,
    stage:x.stage||"",parent:x.parent||"",
    rv_usd:parseRv(x.rv),
    em_count:parseEm(x.em),
    dp_meters:parseDp(x.dp),
    rs_tonnes:parseRs(x.rs),
  };
});

// Expand compressed data
const MINE_DETAILS={
  "Escondida":{ops:{mill_tpd:380000,recovery:89.4,strip_ratio:"2.8:1",water:"Desalinated",power:"100% Renewable",lom:42,fleet:"58x 930E trucks, 6x shovels"},fin:{c1_cash:1380,aisc:2608,ebitda_margin:67,roce:29,realized_price:9650,royalty_pct:5.2,capex_sustaining:720},res:{proven_mt:3840,proven_cu:0.62,probable_mt:1210,probable_cu:0.55,total_reserve_mt:5050,total_cu:0.60,measured_mt:4420,indicated_mt:5820,inferred_mt:3200,reserve_life:42}},
  "Grasberg":{ops:{mill_tpd:240000,recovery:88.2,strip_ratio:"N/A (UG)",water:"River",power:"Hydro + Diesel",lom:35,fleet:"Block cave system"},fin:{c1_cash:1150,aisc:2240,ebitda_margin:72,roce:34,realized_price:9420,royalty_pct:3.75,capex_sustaining:680},res:{proven_mt:2860,proven_cu:0.94,probable_mt:1640,probable_cu:0.88,total_reserve_mt:4500,total_cu:0.92,measured_mt:3200,indicated_mt:4100,inferred_mt:2800,reserve_life:35}},
  "Olympic Dam":{ops:{mill_tpd:220000,recovery:86.5,strip_ratio:"N/A (UG)",water:"GAB",power:"Gas + Solar",lom:50,fleet:"Sublevel stoping"},fin:{c1_cash:1620,aisc:2890,ebitda_margin:58,roce:18,realized_price:9200,royalty_pct:3.5,capex_sustaining:540},res:{proven_mt:4200,proven_cu:0.78,probable_mt:3100,probable_cu:0.72,total_reserve_mt:7300,total_cu:0.76,measured_mt:6800,indicated_mt:8400,inferred_mt:5200,reserve_life:50}},
  "Cadia Valley":{ops:{mill_tpd:35000,recovery:82.4,strip_ratio:"N/A (UG)",water:"Pipeline",power:"Grid + Solar",lom:28,fleet:"Panel cave"},fin:{c1_cash:-420,aisc:680,ebitda_margin:78,roce:42,realized_price:2380,royalty_pct:4.0,capex_sustaining:320},res:{proven_mt:1240,proven_cu:0.28,probable_mt:980,probable_cu:0.24,total_reserve_mt:2220,total_cu:0.26,measured_mt:1800,indicated_mt:2400,inferred_mt:1600,reserve_life:28}},
  "Kamoa-Kakula":{ops:{mill_tpd:14200,recovery:86.8,strip_ratio:"N/A (UG)",water:"River",power:"Hydro",lom:40,fleet:"Drift & fill"},fin:{c1_cash:1080,aisc:1840,ebitda_margin:74,roce:38,realized_price:9180,royalty_pct:3.5,capex_sustaining:280},res:{proven_mt:1680,proven_cu:2.56,probable_mt:2400,probable_cu:2.12,total_reserve_mt:4080,total_cu:2.30,measured_mt:2100,indicated_mt:3800,inferred_mt:2600,reserve_life:40}},
  "Morenci":{ops:{mill_tpd:380000,recovery:78.5,strip_ratio:"2.4:1",water:"Recycled",power:"Grid",lom:28,fleet:"Komatsu 930E trucks"},fin:{c1_cash:1520,aisc:2680,ebitda_margin:54,roce:20,realized_price:9480,royalty_pct:0,capex_sustaining:420},res:{proven_mt:6200,proven_cu:0.24,probable_mt:4800,probable_cu:0.22,total_reserve_mt:11000,total_cu:0.23,measured_mt:8400,indicated_mt:6200,inferred_mt:3800,reserve_life:28}},
  "Boddington":{ops:{mill_tpd:42000,recovery:84.2,strip_ratio:"4.2:1",water:"Pipeline",power:"Gas + Solar",lom:18,fleet:"CAT 793F trucks"},fin:{c1_cash:920,aisc:1480,ebitda_margin:52,roce:22,realized_price:2340,royalty_pct:2.5,capex_sustaining:180},res:{proven_mt:480,proven_cu:0.12,probable_mt:320,probable_cu:0.10,total_reserve_mt:800,total_cu:0.11,measured_mt:640,indicated_mt:520,inferred_mt:280,reserve_life:18}},
  "Collahuasi":{ops:{mill_tpd:180000,recovery:87.2,strip_ratio:"2.5:1",water:"Desalinated",power:"Grid + Wind",lom:38,fleet:"Komatsu 930E"},fin:{c1_cash:1280,aisc:2340,ebitda_margin:64,roce:26,realized_price:9580,royalty_pct:5.2,capex_sustaining:380},res:{proven_mt:2400,proven_cu:0.86,probable_mt:1600,probable_cu:0.78,total_reserve_mt:4000,total_cu:0.83,measured_mt:3200,indicated_mt:2800,inferred_mt:1800,reserve_life:38}},
  "Oyu Tolgoi":{ops:{mill_tpd:110000,recovery:84.6,strip_ratio:"N/A (UG)",water:"Wells",power:"Grid",lom:45,fleet:"Block cave"},fin:{c1_cash:1440,aisc:2560,ebitda_margin:56,roce:16,realized_price:9320,royalty_pct:5.0,capex_sustaining:520},res:{proven_mt:1800,proven_cu:0.81,probable_mt:2200,probable_cu:0.76,total_reserve_mt:4000,total_cu:0.78,measured_mt:2600,indicated_mt:3400,inferred_mt:2200,reserve_life:45}},
  "Cerro Verde":{ops:{mill_tpd:360000,recovery:85.6,strip_ratio:"2.2:1",water:"Recycled",power:"Grid",lom:30,fleet:"CAT 797F trucks"},fin:{c1_cash:1340,aisc:2420,ebitda_margin:58,roce:24,realized_price:9560,royalty_pct:3.0,capex_sustaining:340},res:{proven_mt:4800,proven_cu:0.38,probable_mt:3600,probable_cu:0.34,total_reserve_mt:8400,total_cu:0.36,measured_mt:6400,indicated_mt:4800,inferred_mt:3200,reserve_life:30}},
};


const isProject=(m)=>m.st==="Construction"||m.st==="Feasibility";
const getStatusColor=(st)=>st==="Operating"?"#62b289":st==="Construction"?"#f59e0b":st==="Feasibility"?"#60a5fa":"#94a3b8";

const latLngToV3=(lat,lng,r)=>{const phi=(90-lat)*Math.PI/180,theta=(lng+180)*Math.PI/180;return new Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta))};

function MiningGlobe(){
  // Mine scale based on revenue
  const getMineScale=(mine)=>{
    if(!mine)return 0.08;
    const rv=mine.rv_usd||0;
    const rsProxy=mine.rs_tonnes?(mine.rs_tonnes/1e9)*80:0;
    const val=rv>0?rv:rsProxy;
    if(val<=0)return 0.08;
    const logVal=Math.log10(Math.max(val,10));
    const logMin=Math.log10(10);
    const logMax=Math.log10(12000);
    return Math.min(1,Math.max(0.08,(logVal-logMin)/(logMax-logMin)));
  };

  const getMineOutput=(mine)=>{
    if(!mine)return{out:"",rv:""};
    return{out:mine.description||"",rv:mine.revenue||""};
  };

  const mountRef=useRef(null),sceneRef=useRef(null),camRef=useRef(null),renRef=useRef(null);
  const globeRef=useRef(null),markersRef=useRef(null),rayRef=useRef(new Raycaster());
  const mouseRef=useRef(new Vector2()),mapRef=useRef(new Map()),glowRef=useRef(null);
  const orbitRef=useRef({
    isDragging:false, prevX:0, prevY:0,
    rotY:2.3562, rotX:-0.4363,
    targetRotY:2.3562, targetRotX:-0.4363,
    autoRotate:true,
    zoomLevel:4.5, targetZoom:4.5,
    lastTouchDist:0
  });
  const animatingRef=useRef(false);
  const pivotRef=useRef(null);
  const mineToMeshRef=useRef(new Map());
  const legendTimerRef=useRef(null);
  const starsRef=useRef(null);
  const animFrameRef=useRef(null);
  const outlineMatRef=useRef(null);
  const gridMatRef=useRef(null);
  const shippingRef=useRef(null);
  const countryFillRef=useRef(null);
  const countryRingsRef=useRef(null);
  const globeTexRef=useRef(null);
  const globeBodyRef=useRef(null);
  const ambLightRef=useRef(null);
  const dirLightRef=useRef(null);
  // Clustering system
  const clusterGroupRef=useRef(null);
  const clusterPoolRef=useRef([]);
  const clusterMapRef=useRef(new Map());
  const filteredRef=useRef({set:null,active:false});

  const [selMine,setSelMine]=useState(null);
  const [previewMine,setPreviewMine]=useState(null);
  const [previewPos,setPreviewPos]=useState({x:0,y:0});
  const [hoverMine,setHoverMine]=useState(null);
  const [hoverCluster,setHoverCluster]=useState(null);
  const [compareList,setCompareList]=useState([]); // max 4 mines
  const [compareView,setCompareView]=useState(false); // full compare screen
  const [compareFlash,setCompareFlash]=useState(null); // flash animation feedback
  const MAX_COMPARE=4;
  const addToCompare=useCallback((mine)=>{
    if(!mine)return;
    setCompareList(prev=>{
      if(prev.find(m=>m.name===mine.name))return prev; // prevent duplicates
      if(prev.length>=MAX_COMPARE){setCompareFlash("max");setTimeout(()=>setCompareFlash(null),1500);return prev;}
      setCompareFlash(mine.name);setTimeout(()=>setCompareFlash(null),800);
      return[...prev,mine];
    });
  },[]);
  const removeFromCompare=useCallback((name)=>{
    setCompareList(prev=>prev.filter(m=>m.name!==name));
  },[]);
  const clearCompare=useCallback(()=>{setCompareList([]);setCompareView(false)},[]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{const t=setTimeout(()=>setLoading(false),5000);return()=>clearTimeout(t)},[]);
  const [sidebar,setSidebar]=useState(false);
  const [detail,setDetail]=useState(false);
  const [isMobile,setIsMobile]=useState(typeof window!=="undefined"&&window.innerWidth<=768);
  const [showAbout,setShowAbout]=useState(false);
  const [mapMode,setMapMode]=useState("3d");
  const [webglOk,setWebglOk]=useState(false);
  const [termTab,setTermTab]=useState("overview");
  const [termCountry,setTermCountry]=useState(null);
  const [termSort,setTermSort]=useState("rv_usd");
  const [newsFilt,setNewsFilt]=useState("all");
  const [selCom,setSelCom]=useState("cu");
  const [period,setPeriod]=useState("3M");
  const [projViewMode,setProjViewMode]=useState("gantt");
  const [projFiltStage,setProjFiltStage]=useState("All");
  const [projFiltCom,setProjFiltCom]=useState("All");
  const [projHover,setProjHover]=useState(null);
  const [equities,setEquities]=useState([
    {tick:"BHP.AX",chg:1.42,base:45.82},{tick:"RIO.L",chg:-0.38,base:5240},{tick:"FCX",chg:2.14,base:47.33},
    {tick:"GLEN.L",chg:-0.92,base:412},{tick:"NEM",chg:0.67,base:38.15},{tick:"IVN.TO",chg:3.21,base:22.87},
  ]);
  useEffect(()=>{
    const t=setInterval(()=>{
      setEquities(prev=>prev.map(e=>({...e,chg:+(e.chg+(Math.random()-0.5)*0.15).toFixed(2)})));
    },3000);
    return ()=>clearInterval(t);
  },[]);

  // ═══════════════════════════════════════════════════════════════
  // LIVE API LAYER
  // Synthetic fallback in preview. Live data on Vercel when keys
  // are configured. Add this snippet to your index.html <head>:
  //
  //   <script>window.__MINE_ATLAS_ENV__={
  //     METALS:"%VITE_METALS_API_KEY%",
  //     NEWS:"%VITE_NEWS_API_KEY%",
  //     ALPHA:"%VITE_ALPHA_KEY%"
  //   }</script>
  //
  // Then set the three VITE_* vars in Vercel → Settings → Env Vars.
  // Vite replaces %VITE_*% tokens in index.html at build time.
  // ═══════════════════════════════════════════════════════════════
  // API keys — loaded from window.__MINE_ATLAS_ENV__ (injected by index.html on Vercel)
  // In index.html add: <script>window.__MINE_ATLAS_ENV__={METALS:"%VITE_METALS_API_KEY%",NEWS:"%VITE_NEWS_API_KEY%",ALPHA:"%VITE_ALPHA_KEY%"}</script>
  const _ENV=(typeof window!=="undefined"&&window.__MINE_ATLAS_ENV__)||{};
  const METALS_KEY=_ENV.METALS||null;
  const NEWS_KEY=_ENV.NEWS||null;
  const ALPHA_KEY=_ENV.ALPHA||null;
  const IS_LIVE=!!(METALS_KEY||NEWS_KEY||ALPHA_KEY);
  const EQ_LIVE=true; // equities always available via /api/quote serverless proxy

  const METALS_SYM={cu:"XCU",au:"XAU",ag:"XAG",pt:"XPT",fe:"IRON",li:"LITHIUM",ni:"XNI",zn:"XZN",co:"COBALT",al:"XAL",sn:"TIN",u:"URANIUM"};
  // Short tickers match COMMS equity objects; YF_MAP translates to Yahoo Finance symbols
  const YF_MAP={"BHP":"BHP.AX","GLEN":"GLEN.L","AAL":"AAL.L","RIO":"RIO.L","FMG":"FMG.AX","PLS":"PLS.AX","LTR":"LTR.AX","S32":"S32.AX","ABX":"ABX.TO","IVN":"IVN.TO","TECK":"TECK-B.TO","BOE":"BOE.AX","AMS":"AMS.JO","SSW":"SSW.JO"};
  const EQ_TICKERS={cu:["BHP","GLEN","FCX","AAL"],au:["NEM","ABX","AEM","WPM"],fe:["BHP","RIO","VALE","FMG"],li:["PLS","ALB","SQM","LTR"],ni:["VALE","BHP","S32"],zn:["GLEN","TECK","S32"],co:["GLEN","IVN"],ag:["PAAS","AG","WPM"],u:["CCJ","UEC","BOE"],al:["RIO","AA"],cl:["BHP","TECK"]};

  const fetchMetalPrices=useCallback(async ids=>{
    if(!METALS_KEY)return null;
    const syms=ids.map(id=>METALS_SYM[id]).filter(Boolean).join(",");
    try{const r=await fetch(`https://metals-api.com/api/latest?access_key=${METALS_KEY}&base=USD&symbols=${syms}`);if(!r.ok)return null;const d=await r.json();return d.success?d.rates:null;}
    catch{return null;}
  },[]);

  const fetchEquityQuote=useCallback(async ticker=>{
    try{
      const yfSym=YF_MAP[ticker]||ticker;
      const r=await fetch(`/api/quote?ticker=${encodeURIComponent(yfSym)}`);
      const d=await r.json();
      const meta=d?.chart?.result?.[0]?.meta;
      if(!meta?.regularMarketPrice)return null;
      const prev=meta.chartPreviousClose||meta.previousClose||meta.regularMarketPrice;
      const d1=prev?((meta.regularMarketPrice-prev)/prev)*100:null;
      return{price:meta.regularMarketPrice,d1:d1};
    }catch{return null;}
  },[]);

  const fetchMiningNews=useCallback(async()=>{
    if(!NEWS_KEY)return null;
    try{const r=await fetch(`https://newsdata.io/api/1/latest?apikey=${NEWS_KEY}&q=mining+copper+gold+lithium&language=en&category=business&size=10`);const d=await r.json();if(d.status!=="success")return null;
    const tagText=t=>{const s=t.toLowerCase();const tags=[];if(s.includes("copper")||s.includes("bhp"))tags.push("Cu");if(s.includes("gold")||s.includes("newmont"))tags.push("Au");if(s.includes("lithium"))tags.push("Li");if(s.includes("iron ore")||s.includes("vale"))tags.push("Fe");if(s.includes("nickel"))tags.push("Ni");if(s.includes("bhp"))tags.push("BHP");if(s.includes("rio tinto"))tags.push("RIO");if(s.includes("freeport"))tags.push("FCX");return tags.length?tags:["Mining"];};
    return d.results.map((a,i)=>({id:"live-"+i,src:(a.source_id||"NEWS").slice(0,4).toUpperCase(),sc:"#60a5fa",txt:a.title,tags:tagText(a.title+" "+(a.description||"")),imp:i<3?"high":i<6?"med":"low",mine:null,bps:Math.round((Math.random()-0.5)*40),com:"Copper",metric:"",abstract:(a.description||"").slice(0,120),t:Math.round((Date.now()-new Date(a.pubDate).getTime())/60000)}));}
    catch{return null;}
  },[]);

  const [liveComPrices,setLiveComPrices]=useState(null);
  const [liveNews,setLiveNews]=useState(null);
  const [liveEquities,setLiveEquities]=useState({});
  const [apiStatus,setApiStatus]=useState("idle");

  useEffect(()=>{
    if(!IS_LIVE){setApiStatus("fallback");return;}
    setApiStatus("loading");
    const load=async()=>{
      try{
        const rates=await fetchMetalPrices(["cu","au","fe","li","ni","zn","co","ag","u","al","sn"]);
        if(rates)setLiveComPrices(rates);
        const news=await fetchMiningNews();
        if(news)setLiveNews(news);
        const tickers=EQ_TICKERS[selCom]||[];
        const eqRes=await Promise.all(tickers.map(t=>fetchEquityQuote(t)));
        const eqMap={};tickers.forEach((t,i)=>{if(eqRes[i])eqMap[t]=eqRes[i];});
        setLiveEquities(eqMap);
        setApiStatus("live");
      }catch{setApiStatus("fallback");}
    };
    load();
    const iv=setInterval(load,5*60*1000);
    return()=>clearInterval(iv);
  },[]);

  useEffect(()=>{
    if(!EQ_LIVE)return;
    const tickers=EQ_TICKERS[selCom]||[];
    if(!tickers.length)return;
    Promise.all(tickers.map(t=>fetchEquityQuote(t))).then(res=>{const m={};tickers.forEach((t,i)=>{if(res[i])m[t]=res[i];});setLiveEquities(p=>({...p,...m}));});
  },[selCom]);

  const getLivePrice=useCallback((comId,syntheticPrice)=>{
    if(!liveComPrices)return syntheticPrice;
    const sym=METALS_SYM[comId];const rate=sym&&liveComPrices[sym];
    if(!rate)return syntheticPrice;
    return Math.round(1/rate*100)/100;
  },[liveComPrices]);

  const ApiIndicator=IS_LIVE?<span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:9,color:apiStatus==="live"?"#62b289":apiStatus==="loading"?"#e6b94a":"#6c8198",padding:"2px 6px",borderRadius:2,border:"1px solid "+(apiStatus==="live"?"rgba(98,178,137,0.3)":apiStatus==="loading"?"rgba(230,185,74,0.3)":"rgba(108,129,152,0.3)")}}>{apiStatus==="live"?"● LIVE":apiStatus==="loading"?"○ LOADING...":"○ SYNTHETIC"}</span>:null;


  const [profileMine,setProfileMine]=useState(null);
  const [profileTab,setProfileTab]=useState("overview");
  const [detailPage,setDetailPage]=useState(null);
  const [detailTab,setDetailTab]=useState("overview");
  const [watchlist,setWatchlist]=useState([]);
  const map2dRef=useRef(null);
  const map2dCtxRef=useRef(null);
  const map2dPanRef=useRef({x:0,y:0,zoom:1,dragging:false,dragStart:null,panStart:null,targetX:null,targetY:null,targetZoom:null});
  const [hover2d,setHover2d]=useState(null);
  const countryPolysRef=useRef(null);
  const [showFeedback,setShowFeedback]=useState(false);
  const [showSuggest,setShowSuggest]=useState(false);
  const [formStatus,setFormStatus]=useState(null);
  const [showHint,setShowHint]=useState(true);
  const [selectedPort,setSelectedPort]=useState(null);
  const [legendOpen,setLegendOpen]=useState(false);
  const [layers,setLayers]=useState({governance:false,shipping:false}); // toggle-able overlay layers
  const toggleLayer=useCallback(k=>setLayers(l=>({...l,[k]:!l[k]})),[]); // {type:'feedback'|'suggest', status:'success'|'error'|'submitting'}
  const [viewMode,setViewMode_]=useState("commodity");
  const viewModeRef=useRef("commodity");
  
  // Fetch TopoJSON for 2D map (independent of WebGL)
  useEffect(()=>{
    if(countryRingsRef.current)return; // already loaded by 3D init
    const cNameMap={"United States of America":"United States","Russian Federation":"Russia","Dem. Rep. Congo":"DR Congo","Democratic Republic of the Congo":"DR Congo","Congo":"DR Congo","Côte d\'Ivoire":"Ivory Coast","United Kingdom of Great Britain and Northern Ireland":"United Kingdom","Dominican Rep.":"Dominican Republic","Korea, Republic of":"South Korea"};
    const normCName=n=>cNameMap[n]||n;
    const mineCountries=new Set(MINES.map(m=>m.country));
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r=>r.json())
      .then(topo=>{
        if(countryRingsRef.current)return; // 3D init beat us
        const arcs=topo.arcs,tr=topo.transform;
        const decodeArc=(idx)=>{const arc=arcs[idx<0?~idx:idx];const coords=[];let x=0,y=0;
          for(let i=0;i<arc.length;i++){x+=arc[i][0];y+=arc[i][1];coords.push([x*tr.scale[0]+tr.translate[0],y*tr.scale[1]+tr.translate[1]])}
          if(idx<0)coords.reverse();return coords};
        const decodeRing=(ring)=>{const coords=[];ring.forEach((idx,i)=>{const d=decodeArc(idx);
          for(let j=(i===0?0:1);j<d.length;j++)coords.push(d[j])});return coords};
        const rings=[];
        for(const geom of topo.objects.countries.geometries){
          const cName=geom.properties?.name||"";
          if(geom.type==="Polygon"){geom.arcs.forEach((ring,ri)=>{const coords=decodeRing(ring);if(ri===0)rings.push({coords,name:normCName(cName),hasMines:mineCountries.has(normCName(cName))})})}
          else if(geom.type==="MultiPolygon"){geom.arcs.forEach(poly=>poly.forEach((ring,ri)=>{const coords=decodeRing(ring);if(ri===0)rings.push({coords,name:normCName(cName),hasMines:mineCountries.has(normCName(cName))})}))}
        }
        countryRingsRef.current=rings;
      }).catch(()=>{});
  },[]);

useEffect(()=>{viewModeRef.current=viewMode;},[viewMode]);
  const setViewMode=useCallback(mode=>{
    if(mode===viewMode)return;
    viewModeRef.current=mode;
    setFiltCom("All");setFiltComp("All");setFiltType("All");setFiltMethod("All");setFiltStatus("All");
    setViewMode_(mode);
  },[viewMode]);
  const [theme,setTheme]=useState("dark");
  const [search,setSearch]=useState("");
  const [filters,dispatch]=useReducer(filterReducer,INIT_FILTERS);
  const filtCom=filters.commodity,filtComp=filters.company,filtType=filters.mineType,filtMethod=filters.miningMethod,filtCont=filters.continent,filtCountry=filters.country,filtCtr=filters.contractor,filtStatus=filters.status;
  const setFiltCom=v=>dispatch({type:"SET",key:"commodity",value:v});
  const setFiltComp=v=>dispatch({type:"SET",key:"company",value:v});
  const setFiltType=v=>dispatch({type:"SET",key:"mineType",value:v});
  const setFiltMethod=v=>dispatch({type:"SET",key:"miningMethod",value:v});
  const setFiltStatus=v=>dispatch({type:"SET",key:"status",value:v});
  const setFiltCont=v=>{dispatch({type:"SET",key:"continent",value:v});dispatch({type:"SET",key:"country",value:"All"})};
  const setFiltCountry=v=>dispatch({type:"SET",key:"country",value:v});
  const setFiltCtr=v=>dispatch({type:"SET",key:"contractor",value:v});
  const [expFilter,setExpFilter]=useState(null);
  const [filtersOpen,setFiltersOpen]=useState(true);
  const [sheetDrag,setSheetDrag]=useState(null);
  // PART 2: Numeric range filters
  const [numFilters,setNumFilters]=useState({em_count:[0,10000],dp_meters:[0,4000],rs_tonnes:[0,4000]});
  const [numActive,setNumActive]=useState({em_count:false,dp_meters:false,rs_tonnes:false});
  const setNumFilter=(key,range)=>{setNumFilters(p=>({...p,[key]:range}));setNumActive(p=>({...p,[key]:true}))};
  const clearNumFilter=(key)=>{
    const defaults={em_count:[0,10000],dp_meters:[0,4000],rs_tonnes:[0,4000]};
    setNumFilters(p=>({...p,[key]:defaults[key]}));setNumActive(p=>({...p,[key]:false}))
  };
  // PART 3: Sort state
  const [sortBy,setSortBy]=useState("name"); // name,em_count,dp_meters,rs_tonnes,opened
  const [sortDir,setSortDir]=useState("asc");

  const allCom=useMemo(()=>[...new Set(MINES.flatMap(m=>m.commodity))].sort(),[]);
  const allComp=useMemo(()=>[...new Set(MINES.map(m=>m.company))].sort(),[]);
  const allTypes=useMemo(()=>[...new Set(MINES.map(m=>m.type))].sort(),[]);
  const allMethods=useMemo(()=>[...new Set(MINES.map(m=>m.method))].sort(),[]);
  const allStatuses=useMemo(()=>[...new Set(MINES.map(m=>m.st))].sort(),[]);
  const allContractors=useMemo(()=>[...new Set(MINES.flatMap(m=>m.contractors))].sort(),[]);
  const allContinents=useMemo(()=>[...new Set(MINES.map(m=>CONT[m.country]||"Other"))].sort(),[]);
  const allCountries=useMemo(()=>{
    const cs=filtCont==="All"?MINES:MINES.filter(m=>(CONT[m.country]||"Other")===filtCont);
    return [...new Set(cs.map(m=>m.country))].sort();
  },[filtCont]);
  const countFor=useMemo(()=>{
    const com={},comp={},typ={},meth={},cont={},ctry={},ctr={},stat={};
    MINES.forEach(m=>{
      m.commodity.forEach(c=>{com[c]=(com[c]||0)+1});
      comp[normCompany(m.company)]=(comp[normCompany(m.company)]||0)+1;
      typ[m.type]=(typ[m.type]||0)+1;
      meth[m.method]=(meth[m.method]||0)+1;
      m.contractors.forEach(c=>{ctr[c]=(ctr[c]||0)+1});
      stat[m.st]=(stat[m.st]||0)+1;
      const cn=CONT[m.country]||"Other";
      cont[cn]=(cont[cn]||0)+1;
      ctry[m.country]=(ctry[m.country]||0)+1;
    });
    return {com,comp,typ,meth,cont,ctry,ctr,stat};
  },[]);

  const filtered=useMemo(()=>{
    return MINES.filter(m=>{
      const sq=search.toLowerCase();
      const ms=sq===""||m.name.toLowerCase().includes(sq)||m.country.toLowerCase().includes(sq)||m.company.toLowerCase().includes(sq)||m.commodity.some(c=>c.toLowerCase().includes(sq))||m.contractors.some(c=>c.toLowerCase().includes(sq))||(m.state&&m.state.toLowerCase().includes(sq))||(m.region&&m.region.toLowerCase().includes(sq));
      const mc=filtCom==="All"||m.commodity.includes(filtCom);
      const mcp=filtComp==="All"||normCompany(m.company)===filtComp;
      const mt=filtType==="All"||m.type.toLowerCase().includes(filtType.toLowerCase());
      const mst=filtMethod==="All"||m.method===filtMethod;
      const mctr=filtCtr==="All"||m.contractors.includes(filtCtr);
      const mstat=filtStatus==="All"||m.st===filtStatus;
      const mcont=filtCont==="All"||(CONT[m.country]||"Other")===filtCont;
      const mctry=filtCountry==="All"||m.country===filtCountry;
      const emVal=m.em_count||0;
      const nem=!numActive.em_count||(emVal>=numFilters.em_count[0]&&(numFilters.em_count[1]>=10000||emVal<=numFilters.em_count[1]));
      const ndp=!numActive.dp_meters||!m.dp_meters||(m.dp_meters>=numFilters.dp_meters[0]&&m.dp_meters<=numFilters.dp_meters[1]);
      const rsMt=m.rs_tonnes?(m.rs_tonnes/1e6):0;
      const nrs=!numActive.rs_tonnes||(rsMt>=numFilters.rs_tonnes[0]&&(numFilters.rs_tonnes[1]>=4000||rsMt<=numFilters.rs_tonnes[1]));
      return ms&&mc&&mcp&&mt&&mst&&mctr&&mstat&&mcont&&mctry&&nem&&ndp&&nrs;
    });
  },[search,filtCom,filtComp,filtType,filtMethod,filtCtr,filtStatus,filtCont,filtCountry,numFilters,numActive]);

  // PART 3: Sorted results
  const sorted=useMemo(()=>{
    const arr=[...filtered];
    const dir=sortDir==="asc"?1:-1;
    arr.sort((a,b)=>{
      switch(sortBy){
        case"em_count":return((b.em_count||0)-(a.em_count||0))*dir;
        case"dp_meters":return((b.dp_meters||0)-(a.dp_meters||0))*dir;
        case"rs_tonnes":return((b.rs_tonnes||0)-(a.rs_tonnes||0))*dir;
        case"opened":return((b.opened||0)-(a.opened||0))*dir;
        case"rv_usd":return((b.rv_usd||0)-(a.rv_usd||0))*dir;
        default:return a.name.localeCompare(b.name)*dir;
      }
    });
    return arr;
  },[filtered,sortBy,sortDir]);

  // Formspree endpoints — replace with your form IDs from https://formspree.io
  const FORMSPREE_FEEDBACK="meerozee";
  const FORMSPREE_SUGGEST="mdawkdav";
  const submitForm=useCallback(async(formId,data,type)=>{
    setFormStatus({type,status:"submitting"});
    try{
      const res=await fetch(`https://formspree.io/f/${formId}`,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(data)});
      if(res.ok){setFormStatus({type,status:"success"});setTimeout(()=>{setFormStatus(null);if(type==="feedback")setShowFeedback(false);else setShowSuggest(false)},2500)}
      else setFormStatus({type,status:"error"});
    }catch(e){setFormStatus({type,status:"error"})}
  },[]);

  const stats=useMemo(()=>({mines:MINES.length,operating:MINES.filter(m=>m.st==="Operating").length,projects:MINES.filter(m=>isProject(m)).length,countries:new Set(MINES.map(m=>m.country)).size,commodities:new Set(MINES.flatMap(m=>m.commodity)).size}),[]);

  // Auto-dismiss onboarding hint after 6s
  useEffect(()=>{if(!showHint)return;const t=setTimeout(()=>setShowHint(false),6000);return()=>clearTimeout(t)},[showHint]);

  // CSV export of filtered mines
  const exportCSV=useCallback(()=>{
    const cols=["name","company","country","continent","type","method","contractor","commodity","lat","lng","employees","depth","opened","discovered","reserves","revenue","production"];
    const rows=[cols.join(",")];
    filtered.forEach(m=>{
      const cont=CONT[m.country]||"Other";
      const row=[m.name,m.company,m.country,cont,m.type,m.method,(m.contractors||[]).join("; "),(m.commodity||[]).join("; "),m.lat,m.lng,m.employees||"",m.depth||"",m.opened||"",m.discovered||"",m.reserves||"",m.revenue||"",m.production||""];
      rows.push(row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(","));
    });
    const blob=new Blob([rows.join("\n")],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`mine_atlas_${filtered.length}_mines.csv`;a.click();
    URL.revokeObjectURL(url);
  },[filtered]);

  // URL hash state: read on mount, write on change
  useEffect(()=>{
    const hash=window.location.hash.slice(1);
    if(!hash)return;
    try{
      const params=new URLSearchParams(hash);
      if(params.get("cont"))dispatch({type:"SET",key:"continent",value:params.get("cont")});
      if(params.get("country"))dispatch({type:"SET",key:"country",value:params.get("country")});
      if(params.get("com"))dispatch({type:"SET",key:"commodity",value:params.get("com")});
      if(params.get("comp"))dispatch({type:"SET",key:"company",value:params.get("comp")});
      if(params.get("type"))dispatch({type:"SET",key:"mineType",value:params.get("type")});
      if(params.get("method"))dispatch({type:"SET",key:"miningMethod",value:params.get("method")});
      if(params.get("ctr"))dispatch({type:"SET",key:"contractor",value:params.get("ctr")});
      if(params.get("q"))setSearch(params.get("q"));
      if(params.get("mine")){
        const m=MINES.find(x=>x.name===params.get("mine"));
        if(m)setTimeout(()=>selectMine(m),1500);
      }
      if(params.get("view"))setViewMode(params.get("view"));
      if(params.get("theme"))setTheme(params.get("theme"));
    }catch(e){}
  },[]);
  const activeFilters=useMemo(()=>{
    const f=[];
    if(filtCont!=="All")f.push({label:filtCont,color:"#ffd700",clear:()=>setFiltCont("All")});
    if(filtCountry!=="All")f.push({label:filtCountry,color:"#4ecdc4",clear:()=>setFiltCountry("All")});
    if(filtCom!=="All")f.push({label:filtCom,color:"#e87d3e",clear:()=>setFiltCom("All")});
    if(filtComp!=="All")f.push({label:filtComp,color:"#3888ff",clear:()=>setFiltComp("All")});
    if(filtType!=="All")f.push({label:filtType,color:"#6fff6f",clear:()=>setFiltType("All")});
    if(filtMethod!=="All")f.push({label:filtMethod,color:"#b8e8ff",clear:()=>setFiltMethod("All")});
    if(filtCtr!=="All")f.push({label:filtCtr,color:getContractorColor(filtCtr),clear:()=>setFiltCtr("All")});
    return f;
  },[filtCont,filtCountry,filtCom,filtComp,filtType,filtMethod,filtCtr]);
  const resetAll=useCallback(()=>{dispatch({type:"CLEAR"});setSearch("");setExpFilter(null)},[]);

  useEffect(()=>{
    if(!mountRef.current)return;
    document.title="Mine Atlas — Global Mining Operations";
    // Favicon - inline SVG globe logo
    if(!document.querySelector('link[rel="icon"]')){
      const favicon=document.createElement("link");favicon.rel="icon";
      favicon.href="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="f1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23e87d3e"/><stop offset="100%" stop-color="%23c4621e"/></linearGradient><linearGradient id="f2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%231a2a3a"/><stop offset="100%" stop-color="%230a1520"/></linearGradient></defs><circle cx="32" cy="32" r="28" fill="url(%23f2)" stroke="url(%23f1)" stroke-width="2.5"/><ellipse cx="32" cy="24" rx="18" ry="5" fill="none" stroke="%23e87d3e" stroke-width="0.5" opacity="0.3"/><ellipse cx="32" cy="32" rx="22" ry="6" fill="none" stroke="%23e87d3e" stroke-width="0.5" opacity="0.3"/><ellipse cx="32" cy="40" rx="18" ry="5" fill="none" stroke="%23e87d3e" stroke-width="0.5" opacity="0.3"/><circle cx="25" cy="27" r="2.5" fill="%23e87d3e" opacity="0.9"/><circle cx="38" cy="30" r="1.8" fill="%23ffd700" opacity="0.9"/><circle cx="30" cy="40" r="2" fill="%23ff2d55" opacity="0.85"/><line x1="32" y1="8" x2="32" y2="4" stroke="%23e87d3e" stroke-width="2" stroke-linecap="round"/><line x1="28" y1="6" x2="36" y2="6" stroke="%23e87d3e" stroke-width="2" stroke-linecap="round"/></svg>');
      document.head.appendChild(favicon);
    }
    // Meta tags for SEO / social sharing
    const setMeta=(name,content,prop)=>{
      const attr=prop?"property":"name";
      let el=document.querySelector(`meta[${attr}="${name}"]`);
      if(!el){el=document.createElement("meta");el.setAttribute(attr,name);document.head.appendChild(el)}
      el.setAttribute("content",content);
    };
    setMeta("description","Mine Atlas — Interactive 3D globe visualising 331 major mining operations across 61 countries and 27 commodities. Filter, explore and compare global mines.");
    setMeta("og:title","Mine Atlas — Global Mining Operations",true);
    setMeta("og:description","Interactive 3D globe visualising 331 major mining operations across 61 countries and 27 commodities.",true);
    setMeta("og:type","website",true);
    setMeta("twitter:card","summary_large_image");
    setMeta("twitter:title","Mine Atlas — Global Mining Operations");
    setMeta("twitter:description","Interactive 3D globe visualising 331 major mining operations across 61 countries.");
    // Viewport for mobile
    if(!document.querySelector('meta[name="viewport"]')){
      const vp=document.createElement("meta");vp.name="viewport";vp.content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
      document.head.appendChild(vp);
    }
    const w=mountRef.current.clientWidth||window.innerWidth,h=mountRef.current.clientHeight||window.innerHeight;
    const scene=new Scene();scene.background=new Color(0x0f1926);sceneRef.current=scene;
    const cam=new PerspectiveCamera(45,w/h,0.1,1000);cam.position.z=4.5;camRef.current=cam;
    let ren;
    try{ren=new WebGLRenderer({antialias:true});setWebglOk(true)}catch(e){console.error("WebGL init failed:",e);setLoading(false);return}
    ren.setSize(w,h);ren.setPixelRatio(Math.min(window.devicePixelRatio,2));
    mountRef.current.appendChild(ren.domElement);renRef.current=ren;
    const ambLight=new AmbientLight(0x556677,1.8);scene.add(ambLight);ambLightRef.current=ambLight;
    const dl=new DirectionalLight(0xffeedd,1.2);dl.position.set(5,3,5);scene.add(dl);dirLightRef.current=dl;
    const bl=new DirectionalLight(0x446688,0.4);bl.position.set(-5,-3,-5);scene.add(bl);
    const sg=new BufferGeometry(),sp=[];
    for(let i=0;i<4000;i++)sp.push((Math.random()-.5)*100,(Math.random()-.5)*100,(Math.random()-.5)*100);
    sg.setAttribute("position",new Float32BufferAttribute(sp,3));
    const stars=new Points(sg,new PointsMaterial({color:0xffffff,size:0.08,sizeAttenuation:true,transparent:true}));
    scene.add(stars);starsRef.current=stars;
    const R=1.5;
    const pivot=new Group();scene.add(pivot);pivotRef.current=pivot;
    const globe=new Mesh(new SphereGeometry(R,64,64),new MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.95}));
    globeBodyRef.current=globe;
    pivot.add(globe);globeRef.current=globe;
    globe.add(new Mesh(new SphereGeometry(R*1.04,48,48),new MeshBasicMaterial({color:0x3388ff,transparent:true,opacity:0.07,side:BackSide})));
    const gm=new LineBasicMaterial({color:0x223344,transparent:true,opacity:0.3});gridMatRef.current=gm;
    for(let lat=-60;lat<=60;lat+=30){const pts=[];for(let lng=0;lng<=360;lng+=2)pts.push(latLngToV3(lat,lng,R*1.001));globe.add(new Line(new BufferGeometry().setFromPoints(pts),gm))}
    for(let lng=0;lng<360;lng+=30){const pts=[];for(let lat=-90;lat<=90;lat+=2)pts.push(latLngToV3(lat,lng,R*1.001));globe.add(new Line(new BufferGeometry().setFromPoints(pts),gm))}
    // Country outlines from TopoJSON (with retry)
    const outlineMat=new LineBasicMaterial({color:0x000000,transparent:true,opacity:0.6});outlineMatRef.current=outlineMat;
    const countryGroup=new Group();globe.add(countryGroup);
    const countryFillGroup=new Group();globe.add(countryFillGroup);countryFillGroup.visible=false;countryFillRef.current=countryFillGroup;
    const cNameMap={"United States of America":"United States","Russian Federation":"Russia","Korea, Republic of":"South Korea","Dem. Rep. Congo":"DR Congo","Democratic Republic of the Congo":"DR Congo","Congo":"DR Congo","Côte d'Ivoire":"Ivory Coast","United Kingdom of Great Britain and Northern Ireland":"United Kingdom","Dominican Rep.":"Dominican Republic","Central African Rep.":"Central African Republic","S. Sudan":"South Sudan","Bosnia and Herz.":"Bosnia and Herzegovina","Czech Republic":"Czechia","Solomon Is.":"Solomon Islands","Falkland Is.":"Falkland Islands","Eq. Guinea":"Equatorial Guinea","W. Sahara":"Western Sahara","N. Cyprus":"Northern Cyprus","Somaliland":"Somalia","eSwatini":"Eswatini"};
    const normCName=n=>cNameMap[n]||n;
    const mineCountries=new Set(MINES.map(m=>m.country));
    const topoUrl="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
    const fetchTopo=(url,retries=2)=>fetch(url).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).catch(e=>{if(retries>0)return new Promise(r=>setTimeout(r,1000)).then(()=>fetchTopo(url,retries-1));throw e});
    fetchTopo(topoUrl).then(topo=>{
      const arcs=topo.arcs,tr=topo.transform;
      const decodeArc=(idx)=>{const arc=arcs[idx<0?~idx:idx];const coords=[];let x=0,y=0;
        for(let i=0;i<arc.length;i++){x+=arc[i][0];y+=arc[i][1];coords.push([x*tr.scale[0]+tr.translate[0],y*tr.scale[1]+tr.translate[1]])}
        if(idx<0)coords.reverse();return coords};
      const decodeRing=(ring)=>{const coords=[];ring.forEach((idx,i)=>{const d=decodeArc(idx);
        for(let j=(i===0?0:1);j<d.length;j++)coords.push(d[j])});return coords};
      const drawRing=(ring)=>{const pts=[];for(const[ln,la]of ring){pts.push(latLngToV3(la,ln,R*1.002))}
        if(pts.length>1)countryGroup.add(new Line(new BufferGeometry().setFromPoints(pts),outlineMat))};
      const rings=[];
      const obj=topo.objects.countries;
      for(const geom of obj.geometries){
        const cName=geom.properties?.name||"";
        if(geom.type==="Polygon"){geom.arcs.forEach((ring,ri)=>{const coords=decodeRing(ring);drawRing(coords);if(ri===0)rings.push({coords,name:normCName(cName),hasMines:mineCountries.has(normCName(cName))})})}
        else if(geom.type==="MultiPolygon"){geom.arcs.forEach(poly=>poly.forEach((ring,ri)=>{const coords=decodeRing(ring);drawRing(coords);if(ri===0)rings.push({coords,name:normCName(cName),hasMines:mineCountries.has(normCName(cName))})}))}
      }
      countryRingsRef.current=rings;
      // Paint globe texture from country polygons
      const texW=2048,texH=1024;
      const cv=document.createElement("canvas");cv.width=texW;cv.height=texH;
      const cx=cv.getContext("2d");
      // Ocean
      cx.fillStyle="#122240";
      cx.fillRect(0,0,texW,texH);
      // Land
      cx.fillStyle="#263d52";
      cx.strokeStyle="rgba(0,0,0,0.5)";
      cx.lineWidth=0.5;
      rings.forEach(({coords})=>{
        cx.beginPath();
        let first=true;let prevLn=null;
        for(const[ln,la]of coords){
          if(prevLn!==null&&Math.abs(ln-prevLn)>90){first=true}
          prevLn=ln;
          const x=(ln+180)/360*texW;
          const y=(90-la)/180*texH;
          if(first){cx.moveTo(x,y);first=false}else cx.lineTo(x,y);
        }
        cx.closePath();cx.fill();cx.stroke();
      });
      const tex=new CanvasTexture(cv);
      globeTexRef.current={canvas:cv,texture:tex,rings};
      if(globeBodyRef.current){
        globeBodyRef.current.material.map=tex;
        globeBodyRef.current.material.color.set(0xffffff);
        globeBodyRef.current.material.needsUpdate=true;
      }
    }).catch(e=>console.warn("Country borders unavailable:",e.message));

    // Shipping layer
    const shipGroup=new Group();globe.add(shipGroup);shipGroup.visible=false;shippingRef.current=shipGroup;

    const mg=new Group();globe.add(mg);markersRef.current=mg;
    MINES.forEach(mine=>{
      let lat=mine.lat,lng=mine.lng;
      if(mine.parent){const par=MINES.find(m=>m.name===mine.parent);if(par&&Math.abs(par.lat-mine.lat)<0.1&&Math.abs(par.lng-mine.lng)<0.1){lat=mine.lat+0.28;lng=mine.lng+0.28;}}
      const col=getCC(mine.commodity),pos=latLngToV3(lat,lng,R*1.008);
      // Size based on production value (revenue-normalized)
      const pv=getMineScale(mine);
      const s=0.005+pv*0.009;
      const mineGeo=isProject(mine)?new SphereGeometry(s*1.4,4,2):new SphereGeometry(s,8,8);
      const mk=new Mesh(mineGeo,new MeshStandardMaterial({color:new Color(col),transparent:true,opacity:0.98,emissive:new Color(col),emissiveIntensity:0.75,roughness:0.15,metalness:0.2}));
      if(isProject(mine)){mk.rotation.set(0,Math.PI/4,0);mk.scale.set(1,1.8,1);}
      mk.position.copy(pos);mk.userData.baseScale=s;mk.userData.displayLat=lat;mk.userData.displayLng=lng;mg.add(mk);mapRef.current.set(mk.uuid,mine);mineToMeshRef.current.set(mine.name,mk);
    });
    // Cluster sprite pool - canvas-rendered circles with count numbers
    const CLUSTER_POOL=50;
    const cg=new Group();globe.add(cg);clusterGroupRef.current=cg;
    const makeClusterTex=(count,hexCol)=>{
      const sz=128,c=document.createElement("canvas");c.width=sz;c.height=sz;
      const ctx=c.getContext("2d");
      // Outer glow
      ctx.beginPath();ctx.arc(sz/2,sz/2,sz/2-4,0,Math.PI*2);
      ctx.fillStyle=hexCol+"30";ctx.fill();
      // Filled circle
      ctx.beginPath();ctx.arc(sz/2,sz/2,sz/2-12,0,Math.PI*2);
      ctx.fillStyle=hexCol+"cc";ctx.fill();
      ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.stroke();
      // Number
      ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.font=`bold ${count>9?38:44}px sans-serif`;
      ctx.fillText(String(count),sz/2,sz/2+2);
      const tex=new CanvasTexture(c);tex.needsUpdate=true;return tex;
    };
    const clusterPool=[];
    for(let ci=0;ci<CLUSTER_POOL;ci++){
      const mat=new SpriteMaterial({transparent:true,opacity:0.95,depthTest:true,sizeAttenuation:true});
      const sp=new Sprite(mat);
      sp.scale.set(0.06,0.06,1);sp.visible=false;
      sp.userData._lastCount=0;sp.userData._lastCol="";
      cg.add(sp);clusterPool.push(sp);
    }
    clusterPoolRef.current=clusterPool;
    // Pulsing glow for selected mine
    const glowMesh=new Mesh(new SphereGeometry(0.018,16,16),new MeshBasicMaterial({color:0xe87d3e,transparent:true,opacity:0}));
    globe.add(glowMesh);glowMesh.visible=false;
    const glowRing=new Mesh(new RingGeometry(0.015,0.025,24),new MeshBasicMaterial({color:0xe87d3e,transparent:true,opacity:0,side:DoubleSide}));
    globe.add(glowRing);glowRing.visible=false;
    glowRef.current={mesh:glowMesh,ring:glowRing};

    let frame=0;
    const LERP=0.08;
    const AUTO_SPEED=0;
    const TILT_LIMIT=Math.PI/2.2;
    const CLUSTER_PX_BASE=8;
    const projV=new Vector3();
    const Rsurf=R*1.008;
    const DEFAULT_ZOOM=4.5;
    const updateClusters=()=>{
      if(!mountRef.current)return;
      const rect=mountRef.current.getBoundingClientRect();
      if(rect.width===0)return;
      const camZ=cam.position.z;
      const zoomFactor=camZ/DEFAULT_ZOOM; // <1 when zoomed in, >1 when zoomed out
      const frontZ=(Rsurf*Rsurf)/camZ;
      // Scale markers smaller when zoomed in
      const markerScale=Math.max(0.35,Math.min(1,zoomFactor));
      mg.children.forEach(mesh=>{mesh.userData._zoomScale=markerScale});
      // Cluster radius shrinks when zoomed in, disabled at close zoom
      const cpx=zoomFactor<0.6?0:CLUSTER_PX_BASE*Math.max(0.5,zoomFactor);
      const cpx2=cpx*cpx;
      // Project all mine markers to screen space
      const items=[];
      mg.children.forEach(mesh=>{
        projV.copy(mesh.position);
        globe.localToWorld(projV);
        const wz=projV.z; // save world z before projection
        projV.project(cam);
        const sx=(projV.x*0.5+0.5)*rect.width;
        const sy=(-projV.y*0.5+0.5)*rect.height;
        const behind=wz<frontZ; // on back hemisphere
        items.push({mesh,mine:mapRef.current.get(mesh.uuid),sx,sy,behind,ci:-1});
      });
      // Greedy clustering: group markers within CLUSTER_PX of each other
      // Disable clustering in status view so projects near existing mines are visible
      const clusters=[];
      if(viewModeRef.current!=="status"){
      for(let i=0;i<items.length;i++){
        if(items[i].ci>=0||items[i].behind)continue;
        const members=[i];items[i].ci=clusters.length;
        for(let j=i+1;j<items.length;j++){
          if(items[j].ci>=0||items[j].behind)continue;
          const dx=items[i].sx-items[j].sx,dy=items[i].sy-items[j].sy;
          if(dx*dx+dy*dy<cpx2){items[j].ci=clusters.length;members.push(j)}
        }
        if(members.length>1)clusters.push(members);
        else items[i].ci=-1;
      }
      }
      // Toggle visibility: hide clustered markers, show singles
      const clusteredSet=new Set();
      clusters.forEach(ms=>ms.forEach(idx=>clusteredSet.add(idx)));
      items.forEach((it,idx)=>{
        it.mesh.visible=!clusteredSet.has(idx)&&!it.behind;
        // Apply zoom-scaled size
        const fs=it.mesh.userData._filterScale||1;
        const zs=it.mesh.userData._zoomScale||1;
        const sc=fs*zs;
        if(Math.abs(it.mesh.scale.x-sc)>0.001)it.mesh.scale.set(sc,sc,sc);
      });
      // Assign cluster meshes
      clusterMapRef.current.clear();
      clusters.forEach((members,ci)=>{
        if(ci>=clusterPool.length)return;
        const cm=clusterPool[ci];
        const centroid=new Vector3();
        let aLat=0,aLng=0;const mines=[];
        members.forEach(idx=>{centroid.add(items[idx].mesh.position);
          if(items[idx].mine){mines.push(items[idx].mine);aLat+=items[idx].mine.lat;aLng+=items[idx].mine.lng}});
        centroid.divideScalar(members.length);
        centroid.normalize().multiplyScalar(R*1.015);
        aLat/=mines.length;aLng/=mines.length;
        cm.position.copy(centroid);cm.visible=true;
        // Color by dominant commodity
        const cc={};mines.forEach(m=>{const p=m.pc||m.commodity[0];cc[p]=(cc[p]||0)+1});
        const dom=Object.entries(cc).sort((a,b)=>b[1]-a[1])[0]?.[0]||"Gold";
        const hexCol=getCC([dom]);
        // Only regenerate texture if count or color changed
        if(cm.userData._lastCount!==members.length||cm.userData._lastCol!==hexCol){
          if(cm.material.map)cm.material.map.dispose();
          cm.material.map=makeClusterTex(members.length,hexCol);
          cm.userData._lastCount=members.length;cm.userData._lastCol=hexCol;
        }
        const sc=(0.04+Math.min(members.length,15)*0.004)*Math.max(0.45,zoomFactor);
        cm.scale.set(sc,sc,1);
        // Dim cluster if no mines match active filter
        const fRef=filteredRef.current;
        const hasMatch=!fRef.active||mines.some(m=>fRef.set&&fRef.set.has(m.name));
        cm.material.opacity=hasMatch?0.95:0.15;
        clusterMapRef.current.set(cm.uuid,{mines,avgLat:aLat,avgLng:aLng});
      });
      for(let i=clusters.length;i<clusterPool.length;i++)clusterPool[i].visible=false;
    };
    const animate=()=>{animFrameRef.current=requestAnimationFrame(animate);frame++;
      const o=orbitRef.current;
      if(!animatingRef.current){
        if(o.autoRotate&&!o.isDragging) o.targetRotY+=AUTO_SPEED;
        // Smooth interpolation - softer when zoomed in
        const zf=o.zoomLevel/4.5;
        const lerp=LERP*Math.max(0.5,Math.min(1,zf));
        o.rotX+=(o.targetRotX-o.rotX)*lerp;
        o.rotY+=(o.targetRotY-o.rotY)*lerp;
        o.zoomLevel+=(o.targetZoom-o.zoomLevel)*LERP;
        pivot.rotation.x=o.rotX;
        pivot.rotation.y=o.rotY;
        cam.position.z=o.zoomLevel;
      }
      // Star parallax - subtle shift opposite to globe rotation
      if(starsRef.current){
        starsRef.current.rotation.y=o.rotY*0.03;
        starsRef.current.rotation.x=o.rotX*0.02;
      }
      // Update clusters every 10 frames
      if(frame%6===0)updateClusters();
      // Pulse glow
      if(glowMesh.visible){const pulse=0.5+0.5*Math.sin(frame*0.05);
        glowMesh.material.opacity=0.25+pulse*0.15;
        glowMesh.scale.setScalar(1+pulse*0.2);
        glowRing.material.opacity=0.15+pulse*0.1;
        glowRing.scale.setScalar(1+pulse*0.3);}
      ren.render(scene,cam)};
    animate();setLoading(false);
    const onResize=()=>{if(!mountRef.current)return;const ww=mountRef.current.clientWidth,hh=mountRef.current.clientHeight;cam.aspect=ww/hh;cam.updateProjectionMatrix();ren.setSize(ww,hh)};
    window.addEventListener("resize",onResize);
    const onMobile=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener("resize",onMobile);
    return()=>{
      // Cancel animation loop
      if(animFrameRef.current)cancelAnimationFrame(animFrameRef.current);
      // Remove event listeners
      window.removeEventListener("resize",onResize);window.removeEventListener("resize",onMobile);
      // Dispose Three.js resources
      scene.traverse(obj=>{
        if(obj.geometry)obj.geometry.dispose();
        if(obj.material){
          if(Array.isArray(obj.material))obj.material.forEach(m=>{if(m.map)m.map.dispose();m.dispose()});
          else{if(obj.material.map)obj.material.map.dispose();obj.material.dispose()}
        }
      });
      // Remove renderer DOM element and dispose
      if(mountRef.current&&ren.domElement&&mountRef.current.contains(ren.domElement))mountRef.current.removeChild(ren.domElement);
      ren.dispose();
      // Clear refs
      mapRef.current.clear();mineToMeshRef.current.clear();clusterMapRef.current.clear();
    };
  },[]);

  // Force renderer resize when switching back to 3D — the canvas has 0×0 size
  // while display:none, so we must re-trigger setSize after it becomes visible
  useEffect(()=>{
    if(mapMode!=="3d")return;
    const ren=renRef.current,cam=camRef.current,mount=mountRef.current;
    if(!ren||!cam||!mount)return;
    // Double rAF ensures the browser has painted and clientWidth/Height are non-zero
    const id=requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        const ww=mount.clientWidth||window.innerWidth;
        const hh=mount.clientHeight||window.innerHeight;
        if(ww>0&&hh>0){
          cam.aspect=ww/hh;
          cam.updateProjectionMatrix();
          ren.setSize(ww,hh);
        }
      });
    });
    return()=>cancelAnimationFrame(id);
  },[mapMode]);

  const TILT_LIMIT=Math.PI/2.2;
  const DRAG_SPEED=0.005;
  const ZOOM_SPEED=0.002;

  // Pointer down on canvas
  const onDown=useCallback(e=>{
    setShowHint(false);
    const o=orbitRef.current;
    o.isDragging=true;
    o.autoRotate=false;
    o.prevX=e.clientX;
    o.prevY=e.clientY;
  },[]);

  // Hover detection only (drag handled by window listener)
  const onMove=useCallback(e=>{
    if(!mountRef.current)return;
    const rect=mountRef.current.getBoundingClientRect();
    mouseRef.current.x=((e.clientX-rect.left)/rect.width)*2-1;
    mouseRef.current.y=-((e.clientY-rect.top)/rect.height)*2+1;
    if(camRef.current&&markersRef.current){rayRef.current.setFromCamera(mouseRef.current,camRef.current);
      const targets=[...markersRef.current.children,...(clusterGroupRef.current?clusterGroupRef.current.children:[]),...(shippingRef.current?shippingRef.current.children:[])];
      const hits=rayRef.current.intersectObjects(targets,false);
      const portHit=hits.find(h=>h.object.userData.port);
      const mineHit=hits.find(i=>mapRef.current.has(i.object.uuid)||clusterMapRef.current.has(i.object.uuid));
      if(portHit){setHoverMine(null);setHoverCluster(null);mountRef.current.style.cursor="pointer";}
      else if(mineHit){
        if(clusterMapRef.current.has(mineHit.object.uuid)){setHoverCluster(clusterMapRef.current.get(mineHit.object.uuid));setHoverMine(null);}
        else{setHoverMine(mapRef.current.get(mineHit.object.uuid));setHoverCluster(null);}
        mountRef.current.style.cursor="pointer";
      }
      else{setHoverMine(null);setHoverCluster(null);if(mountRef.current)mountRef.current.style.cursor=orbitRef.current.isDragging?"grabbing":"grab"}}
  },[]);

  // Window-level pointer events for drag (works outside globe)
  useEffect(()=>{
    const onPointerMove=e=>{
      const o=orbitRef.current;
      if(!o.isDragging)return;
      const dx=e.clientX-o.prevX;
      const dy=e.clientY-o.prevY;
      // Scale drag speed with zoom: slower when zoomed in
      const zoomFactor=o.zoomLevel/4.5;
      const speed=DRAG_SPEED*Math.max(0.25,zoomFactor);
      o.targetRotY+=dx*speed;
      o.targetRotX+=dy*speed;
      o.targetRotX=Math.max(-TILT_LIMIT,Math.min(TILT_LIMIT,o.targetRotX));
      o.prevX=e.clientX;
      o.prevY=e.clientY;
      animatingRef.current=false;
    };
    const onPointerUp=()=>{
      const o=orbitRef.current;
      if(o.isDragging){o.isDragging=false;setTimeout(()=>{o.autoRotate=true},3000)}
    };
    window.addEventListener("pointermove",onPointerMove);
    window.addEventListener("pointerup",onPointerUp);
    return()=>{window.removeEventListener("pointermove",onPointerMove);window.removeEventListener("pointerup",onPointerUp)};
  },[]);
  // focusMine - Navigate globe to center a mine
  //
  // Uses computeTargetYawPitch to get exact yaw/pitch,
  // animates with easeInOutCubic, then verifies via screen projection.
  //
  // orbitRef: rotX = pitch (X rotation), rotY = yaw (Y rotation)
  // globe.rotation.z = 0 always (no roll)
  const focusMine=useCallback((mine,onComplete)=>{
    if(!mine||!isFinite(mine.lat)||!isFinite(mine.lng)){
      console.warn("[focusMine] SKIP: invalid coords for",mine?.name);
      if(onComplete)onComplete();
      return;
    }
    // 2D mode: smooth pan + zoom
    if(mapMode==="2d"){
      const canvas=map2dRef.current;if(!canvas){if(onComplete)onComplete();return}
      const s=map2dPanRef.current;
      const dpr=window.devicePixelRatio||1;
      const cw=canvas.width,ch=canvas.height;
      const targetZoom=Math.max(s.zoom,3);
      const mW=cw*targetZoom,mH=mW*0.55;
      // Target pan so mine is centred
      const targetX=(cw/2-(cw/2-mW/2+(mine.lng+180)/360*mW))/dpr;
      const targetY=(ch/2-(ch/2-mH/2+(90-mine.lat)/180*mH))/dpr;
      const startX=s.x,startY=s.y,startZoom=s.zoom;
      let f=0;const dur=30;
      const tick=()=>{
        f++;const t=Math.min(f/dur,1);
        const ease=t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
        s.x=startX+(targetX-startX)*ease;
        s.y=startY+(targetY-startY)*ease;
        s.zoom=startZoom+(targetZoom-startZoom)*ease;
        if(t<1)requestAnimationFrame(tick);
        else if(onComplete)onComplete();
      };
      requestAnimationFrame(tick);
      return;
    }
    const {yawY,pitchX}=computeTargetYawPitch(mine.lat,mine.lng);
    const o=orbitRef.current;
    const startX=o.rotX,startY=o.rotY;

    // Shortest path for yaw
    let dy=yawY-startY;
    while(dy>Math.PI)dy-=2*Math.PI;
    while(dy<-Math.PI)dy+=2*Math.PI;
    const endY=startY+dy;

    animatingRef.current=true;
    o.autoRotate=false;
    let f=0;const dur=40;
    const tick=()=>{
      f++;const t=Math.min(f/dur,1);
      const ease=t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      const rx=startX+(pitchX-startX)*ease;
      const ry=startY+(endY-startY)*ease;
      // Set both current and target to prevent lerp fighting
      o.rotX=rx;o.rotY=ry;o.targetRotX=rx;o.targetRotY=ry;
      if(pivotRef.current){
        pivotRef.current.rotation.x=rx;
        pivotRef.current.rotation.y=ry;
      }
      if(t<1){requestAnimationFrame(tick)}
      else{
        animatingRef.current=false;
        setTimeout(()=>{o.autoRotate=true},3000);
        if(onComplete)onComplete();
      }
    };
    requestAnimationFrame(tick);
  },[mapMode]);
  const onClick=useCallback(e=>{
    if(!camRef.current||!markersRef.current)return;
    const rect=mountRef.current.getBoundingClientRect();
    const m2=new Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    rayRef.current.setFromCamera(m2,camRef.current);
    // Check shipping port clicks first when layer is active
    if(layers.shipping&&shippingRef.current){
      const shipHits=rayRef.current.intersectObjects(shippingRef.current.children,false);
      const portHit=shipHits.find(h=>h.object.userData.port);
      if(portHit){setSelectedPort(portHit.object.userData.port);setPreviewMine(null);
        const pp=portHit.object.userData.port;focusMine({name:pp.n,lat:pp.la,lng:pp.ln});
        orbitRef.current.targetZoom=Math.min(orbitRef.current.zoomLevel,3);return}
    }
    const targets=[...markersRef.current.children,...(clusterGroupRef.current?clusterGroupRef.current.children:[])];
    const hits=rayRef.current.intersectObjects(targets,false);
    const hit=hits.find(i=>mapRef.current.has(i.object.uuid)||clusterMapRef.current.has(i.object.uuid));
    if(hit){
      setSelectedPort(null);
      if(clusterMapRef.current.has(hit.object.uuid)){
        const cl=clusterMapRef.current.get(hit.object.uuid);
        focusMine({name:"cluster",lat:cl.avgLat,lng:cl.avgLng});
        orbitRef.current.targetZoom=Math.max(1.8,orbitRef.current.zoomLevel*0.6);
        setHoverCluster(null);
      } else {
        const m=mapRef.current.get(hit.object.uuid);setSelMine(m);setDetail(true);setHoverMine(null);setHoverCluster(null);
      }
    }
    else if(!orbitRef.current.isDragging){setDetail(false);setSelMine(null);setPreviewMine(null);setSelectedPort(null)}
  },[focusMine,layers.shipping]);
  // Native wheel listener (non-passive) to prevent browser zoom on canvas
  useEffect(()=>{
    const el=mountRef.current;if(!el)return;
    const wheelHandler=e=>{
      e.preventDefault();
      const o=orbitRef.current;
      o.targetZoom+=e.deltaY*ZOOM_SPEED;
      o.targetZoom=Math.max(1.8,Math.min(8,o.targetZoom));
    };
    el.addEventListener("wheel",wheelHandler,{passive:false});
    return()=>el.removeEventListener("wheel",wheelHandler);
  },[]);

  // Theme update for Three.js
  useEffect(()=>{
    if(!sceneRef.current||!renRef.current)return;
    const isDk=theme==="dark";
    renRef.current.setClearColor(isDk?0x0f1926:0xc8dae8);
    sceneRef.current.traverse(obj=>{
      // Atmosphere glow (BackSide sphere)
      if(obj.isMesh&&obj.material&&obj.material.side===BackSide){
        obj.material.color.set(isDk?0x3388ff:0x6699cc);
        obj.material.opacity=isDk?0.07:0.12;
      }
    });
    // Repaint globe texture for theme
    if(globeTexRef.current&&globeBodyRef.current){
      const {canvas:cv2,texture:tex2,rings:rng}=globeTexRef.current;
      const cx2=cv2.getContext("2d");
      cx2.fillStyle=isDk?"#122240":"#c8dae8";
      cx2.fillRect(0,0,cv2.width,cv2.height);
      cx2.fillStyle=isDk?"#263d52":"#e8e4de";
      cx2.strokeStyle=isDk?"rgba(0,0,0,0.5)":"rgba(120,110,100,0.4)";
      cx2.lineWidth=0.5;
      rng.forEach(({coords})=>{
        cx2.beginPath();let first=true;let prevLn=null;
        for(const[ln,la]of coords){
          if(prevLn!==null&&Math.abs(ln-prevLn)>90){first=true}
          prevLn=ln;
          const x=(ln+180)/360*cv2.width,y=(90-la)/180*cv2.height;
          if(first){cx2.moveTo(x,y);first=false}else cx2.lineTo(x,y);
        }
        cx2.closePath();cx2.fill();cx2.stroke();
      });
      tex2.needsUpdate=true;
    }

    // Country outlines
    if(outlineMatRef.current){
      outlineMatRef.current.color.set(isDk?0x000000:0x445566);
      outlineMatRef.current.opacity=isDk?0.6:0.45;
    }
    // Grid lines
    if(gridMatRef.current){
      gridMatRef.current.color.set(isDk?0x223344:0x8899aa);
      gridMatRef.current.opacity=isDk?0.3:0.2;
    }
    // Stars visibility in light mode
    if(starsRef.current)starsRef.current.material.opacity=isDk?1:0.08;
    // Marker emissive intensity - brighter in light mode for visibility
    if(mineToMeshRef.current)mineToMeshRef.current.forEach(mesh=>{
      mesh.material.emissiveIntensity=isDk?0.35:0.5;
      mesh.material.roughness=isDk?0.3:0.4;
    });
  },[theme]);

  // MARKER BEHAVIOUR: opacity + scale + emissive
  // 3-tier: selected(brightest) > filtered(match) > dimmed(non-match)
  const filteredSet=useMemo(()=>new Set(filtered.map(m=>m.name)),[filtered]);
  const hasActiveFilter=filtCom!=="All"||filtComp!=="All"||filtType!=="All"||filtMethod!=="All"||filtCtr!=="All"||filtStatus!=="All"||filtCont!=="All"||filtCountry!=="All"||search!==""||Object.values(numActive).some(Boolean);
  filteredRef.current={set:filteredSet,active:hasActiveFilter};
  const selectedName=previewMine?.name||selMine?.name||null;
  useEffect(()=>{
    const animations=[];
    mineToMeshRef.current.forEach((mesh,name)=>{
      const isSelected=name===selectedName;
      const isMatch=!hasActiveFilter||filteredSet.has(name);
      const tOpacity=isSelected?1:isMatch?0.85:0.12;
      const tScale=isSelected?1.4:isMatch&&hasActiveFilter?1.1:1;
      const tEmissive=isSelected?0.9:isMatch&&hasActiveFilter?0.4:0.1;
      mesh.userData._filterScale=tScale; // store for zoom to use
      const zs=mesh.userData._zoomScale||1;
      const startOp=mesh.material.opacity;
      const startSc=mesh.scale.x/zs; // extract filter-only scale
      const startEm=mesh.material.emissiveIntensity;
      if(Math.abs(startOp-tOpacity)<0.01&&Math.abs(startSc-tScale)<0.01&&Math.abs(startEm-tEmissive)<0.01)return;
      let frame=0;const dur=18;
      const tick=()=>{
        frame++;const t=Math.min(frame/dur,1);const ease=t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
        mesh.material.opacity=startOp+(tOpacity-startOp)*ease;
        const fs=startSc+(tScale-startSc)*ease;
        const sc=fs*(mesh.userData._zoomScale||1);mesh.scale.set(sc,sc,sc);
        mesh.material.emissiveIntensity=startEm+(tEmissive-startEm)*ease;
        if(t<1)animations.push(requestAnimationFrame(tick));
      };
      animations.push(requestAnimationFrame(tick));
    });
    return()=>animations.forEach(id=>cancelAnimationFrame(id));
  },[filteredSet,hasActiveFilter,selectedName]);

  // VIEW MODE: update marker colors when mode changes
  const getMarkerColor=useCallback((mine,mode)=>{
    if(mode==="company")return getCompanyColor(normCompany(mine.company));
    if(mode==="type")return getTypeColor(mine.type);
    if(mode==="method")return getMethodColor(mine.method);
    if(mode==="status")return getStatusColor(mine.st);
    if(mode==="contractor")return getContractorColor(mine.contractors[0]);
    return getCC(mine.commodity);
  },[]);
  useEffect(()=>{
    if(!mineToMeshRef.current.size)return;
    const MINES_MAP=new Map(MINES.map(m=>[m.name,m]));
    const animations=[];
    mineToMeshRef.current.forEach((mesh,name)=>{
      const mine=MINES_MAP.get(name);if(!mine)return;
      const target=new Color(getMarkerColor(mine,viewMode));

      const startCol=mesh.material.color.clone();
      const startEm=mesh.material.emissive.clone();
      if(startCol.equals(target))return;
      let frame=0;const dur=24;
      const tick=()=>{
        frame++;const t=Math.min(frame/dur,1);
        const ease=t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
        mesh.material.color.lerpColors(startCol,target,ease);
        mesh.material.emissive.lerpColors(startEm,target,ease);
        if(t<1)animations.push(requestAnimationFrame(tick));
      };
      animations.push(requestAnimationFrame(tick));
    });
    return()=>animations.forEach(id=>cancelAnimationFrame(id));
  },[viewMode,getMarkerColor]);

  // Toggle shipping layer visibility + build on first toggle
  const shippingBuilt=useRef(false);
  useEffect(()=>{
    if(!shippingRef.current)return;
    const R=1.5;
    if(layers.shipping&&!shippingBuilt.current){
      shippingBuilt.current=true;
      const sg=shippingRef.current;
      PORTS.forEach(p=>{
        const pos=latLngToV3(p.la,p.ln,R*1.006);
        const portCol=p.t==="choke"?"#fbbf24":p.t==="commodity"?"#ffffff":"#e2e8f0";
        const sz=p.t==="choke"?0.013:p.t==="commodity"?0.011:0.009;
        const cone=new Mesh(new ConeGeometry(sz,sz*1.8,3),new MeshBasicMaterial({color:new Color(portCol),transparent:true,opacity:0.95}));
        cone.position.copy(pos);cone.lookAt(pos.clone().multiplyScalar(2));cone.rotateX(Math.PI/2);cone.userData.port=p;sg.add(cone);
        const hitSphere=new Mesh(new SphereGeometry(0.022,6,6),new MeshBasicMaterial({visible:false}));
        hitSphere.position.copy(pos);hitSphere.userData.port=p;sg.add(hitSphere);
        if(p.t==="choke"){
          const ring=new Mesh(new RingGeometry(0.016,0.020,6),new MeshBasicMaterial({color:new Color("#fbbf24"),transparent:true,opacity:0.65,side:DoubleSide}));
          ring.position.copy(pos);ring.lookAt(pos.clone().multiplyScalar(2));ring.userData.port=p;sg.add(ring);
        }
      });
      SHIP_ROUTES.forEach(route=>{
        const pts=[];
        for(let i=0;i<route.pts.length-1;i++){
          const [la1,ln1]=route.pts[i],[la2,ln2]=route.pts[i+1];
          const segs=Math.max(4,Math.ceil(Math.sqrt((la2-la1)**2+(ln2-ln1)**2)/3));
          for(let s=0;s<=segs;s++){const f=s/segs;pts.push(latLngToV3(la1+(la2-la1)*f,ln1+(ln2-ln1)*f,R*1.004))}
        }
        if(pts.length>1){
          const isCom=route.t==="commodity";
          sg.add(new Line(new BufferGeometry().setFromPoints(pts),new LineBasicMaterial({color:isCom?0xe87d3e:0x60a5fa,transparent:true,opacity:isCom?0.30:0.15})));
        }
      });
    }
    shippingRef.current.visible=layers.shipping;
    if(layers.shipping&&shippingRef.current.children.length>0){
      shippingRef.current.children.forEach(obj=>{
        const p=obj.userData.port;
        if(p&&filtCom!=="All"&&p.coms&&p.coms.length>0){
          const matches=p.coms.includes(filtCom);
          if(obj.material){obj.material.opacity=matches?0.95:0.15}
        } else if(p&&obj.material){
          obj.material.opacity=0.95;
        }
      });
    }
    if(markersRef.current){
      markersRef.current.children.forEach(mk=>{
        if(mk.material){mk.material.opacity=layers.shipping?0.25:0.85}
      });
    }
    if(clusterGroupRef.current){clusterGroupRef.current.visible=!layers.shipping}
  },[layers.shipping,filtCom]);

  // Toggle governance fills — build on first toggle
  const govBuilt=useRef(false);
  useEffect(()=>{
    if(!countryFillRef.current)return;
    const R=1.5;
    if(layers.governance&&!govBuilt.current&&countryRingsRef.current){
      govBuilt.current=true;
      const GRID=1;
      const pip=(px,py,ring)=>{let ins=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const[xi,yi]=ring[i],[xj,yj]=ring[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)ins=!ins}return ins};
      countryRingsRef.current.forEach(({coords,name,hasMines})=>{
        let minLn=Infinity,maxLn=-Infinity,minLa=Infinity,maxLa=-Infinity;
        coords.forEach(([ln,la])=>{if(ln<minLn)minLn=ln;if(ln>maxLn)maxLn=ln;if(la<minLa)minLa=la;if(la>maxLa)maxLa=la});
        if(maxLn-minLn>180)return;
        const pos=[],idx=[];let vi=0;const hs=GRID/2;
        for(let la=Math.floor(minLa/GRID)*GRID;la<=maxLa;la+=GRID){
          for(let ln=Math.floor(minLn/GRID)*GRID;ln<=maxLn;ln+=GRID){
            if(!pip(ln+hs,la+hs,coords))continue;
            const v0=latLngToV3(la,ln,R*1.001),v1=latLngToV3(la,ln+GRID,R*1.001),v2=latLngToV3(la+GRID,ln+GRID,R*1.001),v3=latLngToV3(la+GRID,ln,R*1.001);
            pos.push(v0.x,v0.y,v0.z,v1.x,v1.y,v1.z,v2.x,v2.y,v2.z,v3.x,v3.y,v3.z);
            idx.push(vi,vi+1,vi+2,vi,vi+2,vi+3);vi+=4;
          }
        }
        if(!pos.length)return;
        const geo=new BufferGeometry();geo.setAttribute("position",new Float32BufferAttribute(pos,3));geo.setIndex(idx);
        const g=GOV[name];const col=g?govColor(g.reg):"#555555";
        const mesh=new Mesh(geo,new MeshBasicMaterial({color:new Color(col),transparent:true,opacity:g?(hasMines?0.25:0.10):0.05,side:DoubleSide,depthWrite:false}));
        mesh.userData.country=name;mesh.userData.hasMines=hasMines;
        countryFillRef.current.add(mesh);
      });
    }
    countryFillRef.current.visible=layers.governance;
    if(layers.governance&&countryFillRef.current.children.length>0){
      countryFillRef.current.children.forEach(mesh=>{
        const g=GOV[mesh.userData.country];
        if(g){
          mesh.material.color.set(govColor(g.reg));
          mesh.material.opacity=mesh.userData.hasMines?0.25:0.10;
        } else {
          mesh.material.color.set(0x555555);
          mesh.material.opacity=0.05;
        }
      });
    }
  },[layers.governance]);

  // Write URL hash when filters change
  useEffect(()=>{
    const p=new URLSearchParams();
    if(filtCont!=="All")p.set("cont",filtCont);
    if(filtCountry!=="All")p.set("country",filtCountry);
    if(filtCom!=="All")p.set("com",filtCom);
    if(filtComp!=="All")p.set("comp",filtComp);
    if(filtType!=="All")p.set("type",filtType);
    if(filtMethod!=="All")p.set("method",filtMethod);
    if(filtCtr!=="All")p.set("ctr",filtCtr);
    if(search)p.set("q",search);
    if(viewMode!=="commodity")p.set("view",viewMode);
    if(theme!=="dark")p.set("theme",theme);
    if(selMine)p.set("mine",selMine.name);
    const hash=p.toString();
    window.history.replaceState(null,null,hash?`#${hash}`:`${window.location.pathname}`);
  },[filtCont,filtCountry,filtCom,filtComp,filtType,filtMethod,filtCtr,search,viewMode,theme,selMine]);

  // Auto-zoom to filtered region when continent/country changes
  useEffect(()=>{
    if(filtered.length===0||filtered.length===MINES.length||!camRef.current)return;
    const avgLat=filtered.reduce((s,m)=>s+m.lat,0)/filtered.length;
    const avgLng=filtered.reduce((s,m)=>s+m.lng,0)/filtered.length;
    // Euler rotation: same formula as focusMine
    focusMine({name:"region",lat:avgLat,lng:avgLng});
    const z=filtered.length<5?3:filtered.length<20?3.5:filtered.length<50?4.5:5.5;
    orbitRef.current.targetZoom=z;
  },[filtCont,filtCountry]);

  const selectMine=useCallback((mine)=>{
    if(!mine){return}
    focusMine(mine,()=>{
      setPreviewMine(mine);
      if(glowRef.current){const pos=latLngToV3(mine.lat,mine.lng,1.5*1.008);
        glowRef.current.mesh.position.copy(pos);glowRef.current.mesh.visible=true;
        glowRef.current.ring.position.copy(pos);glowRef.current.ring.lookAt(new Vector3(0,0,0));glowRef.current.ring.visible=true;}
    });
  },[focusMine]);

  const toggleWatch=useCallback((mine)=>{
    setWatchlist(prev=>{
      const exists=prev.find(m=>m.name===(mine.name||mine.n));
      if(exists)return prev.filter(m=>m.name!==(mine.name||mine.n));
      return [...prev,{name:mine.name||mine.n,commodity:mine.commodity||mine.co,company:mine.company||mine.cp,country:mine.country||mine.c,lat:mine.lat||mine.la,lng:mine.lng||mine.ln,status:mine.status||mine.st}];
    });
  },[]);

  const openFullDetail=useCallback((mine)=>{
    setSelMine(mine||previewMine);setDetail(true);setPreviewMine(null);
  },[previewMine]);

  const clearSelection=useCallback(()=>{
    setDetail(false);setSelMine(null);setHoverMine(null);setHoverCluster(null);setPreviewMine(null);
    if(glowRef.current){glowRef.current.mesh.visible=false;glowRef.current.ring.visible=false;}
  },[]);

  const recentreGlobe=useCallback(()=>{
    focusMine({name:"home",lat:-25,lng:135});
    orbitRef.current.targetZoom=4.5;
    clearSelection();
  },[clearSelection,focusMine]);

  // Keyboard shortcuts
  const [showShortcuts,setShowShortcuts]=useState(false);
  useEffect(()=>{
    const onKey=(e)=>{
      if(document.activeElement.tagName==="INPUT"||document.activeElement.tagName==="TEXTAREA")return;
      if(e.key==="Escape"){if(showShortcuts)setShowShortcuts(false);else if(detail)clearSelection();else if(selectedPort)setSelectedPort(null);else if(sidebar)setSidebar(false)}
      if(e.key==="/"&&!e.ctrlKey&&!e.metaKey){e.preventDefault();setSidebar(true);setTimeout(()=>{const el=document.querySelector('input[placeholder*="Search"]');if(el)el.focus()},100)}
      if(e.key==="?"&&!e.ctrlKey)setShowShortcuts(s=>!s);
      if(e.key==="g"||e.key==="G")toggleLayer("governance");
      if(e.key==="s"||e.key==="S")toggleLayer("shipping");
      if(e.key==="t"||e.key==="T")setTheme(th=>th==="dark"?"light":"dark");
      if(e.key==="r"||e.key==="R")recentreGlobe();
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[detail,sidebar,clearSelection,showShortcuts,selectedPort]);

  // 2D MAP HANDLERS & RENDERER
  const on2dDown=useCallback(e=>{
    const s=map2dPanRef.current;
    s.dragging=true;s.dragStart={x:e.clientX,y:e.clientY};s.panStart={x:s.x,y:s.y};
    if(map2dRef.current)map2dRef.current.style.cursor="grabbing";
  },[]);
  const on2dMove=useCallback(e=>{
    const s=map2dPanRef.current;
    if(s.dragging){
      s.x=s.panStart.x+(e.clientX-s.dragStart.x);
      s.y=s.panStart.y+(e.clientY-s.dragStart.y);
      return;
    }
    // Hover detection
    const canvas=map2dRef.current;if(!canvas)return;
    const rect=canvas.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    const cx=(e.clientX-rect.left)*dpr,cy=(e.clientY-rect.top)*dpr;
    const cw=canvas.width,ch=canvas.height;
    const zm=s.zoom,mW=cw*zm,mH=mW*0.55;
    const ox=cw/2+s.x*dpr-mW/2,oy=ch/2+s.y*dpr-mH/2;
    let closest=null,minD=16*dpr;
    filtered.forEach(m=>{
      const mx=ox+(m.lng+180)/360*mW,my=oy+(90-m.lat)/180*mH;
      const d=Math.sqrt((cx-mx)**2+(cy-my)**2);
      if(d<minD){minD=d;closest=m}
    });
    let overPort=false;
    PORTS.forEach(p=>{const px=ox+(p.ln+180)/360*mW,py=oy+(90-p.la)/180*mH;if(Math.sqrt((cx-px)**2+(cy-py)**2)<14*dpr)overPort=true;});
    setHover2d(closest?{mine:closest,sx:e.clientX,sy:e.clientY}:null);
    if(canvas)canvas.style.cursor=(closest||overPort)?"pointer":(s.dragging?"grabbing":"grab");
  },[filtered]);
  const on2dUp=useCallback(()=>{map2dPanRef.current.dragging=false;if(map2dRef.current)map2dRef.current.style.cursor="grab"},[]);
  const on2dClick=useCallback(e=>{
    const s=map2dPanRef.current;
    if(s.dragStart&&(Math.abs(e.clientX-s.dragStart.x)>5||Math.abs(e.clientY-s.dragStart.y)>5))return;
    const canvas=map2dRef.current;if(!canvas)return;
    const rect=canvas.getBoundingClientRect();
    const cx=(e.clientX-rect.left)*window.devicePixelRatio;
    const cy=(e.clientY-rect.top)*window.devicePixelRatio;
    const cw=canvas.width,ch=canvas.height;
    const zm=s.zoom,mW=cw*zm,mH=mW*0.55;
    const ox=cw/2+s.x*window.devicePixelRatio-mW/2,oy=ch/2+s.y*window.devicePixelRatio-mH/2;
    // Check mine hits
    let closest=null,minD=20*window.devicePixelRatio;
    filtered.forEach(m=>{
      const mx=ox+(m.lng+180)/360*mW,my=oy+(90-m.lat)/180*mH;
      const d=Math.sqrt((cx-mx)**2+(cy-my)**2);
      if(d<minD){minD=d;closest=m}
    });
    if(closest){setSelMine(closest);setDetail(true);setPreviewMine(null);setSelectedPort(null)}
    else{
      // Check port hits
      if(layers.shipping){
        let closestPort=null,minPD=20*window.devicePixelRatio;
        PORTS.forEach(p=>{
          const px=ox+(p.ln+180)/360*mW,py=oy+(90-p.la)/180*mH;
          const d=Math.sqrt((cx-px)**2+(cy-py)**2);
          if(d<minPD){minPD=d;closestPort=p}
        });
        if(closestPort){setSelectedPort(closestPort);setPreviewMine(null);return}
      }
      setPreviewMine(null);setSelectedPort(null);
    }
  },[filtered,layers.shipping]);

  // 2D wheel zoom
  useEffect(()=>{
    if(mapMode!=="2d")return;
    const canvas=map2dRef.current;if(!canvas)return;
    const onWheel=e=>{
      e.preventDefault();
      const s=map2dPanRef.current;
      const oldZoom=s.zoom;
      s.zoom=Math.max(1,Math.min(20,s.zoom*(1-e.deltaY*0.001)));
      // Zoom toward mouse position
      const rect=canvas.getBoundingClientRect();
      const mx=e.clientX-rect.left-rect.width/2;
      const my=e.clientY-rect.top-rect.height/2;
      const ratio=s.zoom/oldZoom;
      s.x=mx-(mx-s.x)*ratio;
      s.y=my-(my-s.y)*ratio;
    };
    canvas.addEventListener("wheel",onWheel,{passive:false});
    return()=>canvas.removeEventListener("wheel",onWheel);
  },[mapMode]);

  // 2D render loop
  useEffect(()=>{
    if(mapMode!=="2d")return;
    const canvas=map2dRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");map2dCtxRef.current=ctx;
    let animId;
    const render=()=>{
      const dpr=window.devicePixelRatio||1;
      const cw=canvas.parentElement.clientWidth;
      const ch=canvas.parentElement.clientHeight;
      if(canvas.width!==cw*dpr||canvas.height!==ch*dpr){
        canvas.width=cw*dpr;canvas.height=ch*dpr;
        canvas.style.width=cw+"px";canvas.style.height=ch+"px";
      }
      const W=canvas.width,H=canvas.height;
      const s=map2dPanRef.current;
      const isDk=theme==="dark";
      const zm=s.zoom,mW=W*zm,mH=mW*0.55;
      const ox=W/2+s.x*dpr-mW/2,oy=H/2+s.y*dpr-mH/2;
      const proj=(lat,lng)=>[ox+(lng+180)/360*mW,oy+(90-lat)/180*mH];

      // Ocean
      ctx.fillStyle=isDk?"#122240":"#c8dae8";ctx.fillRect(0,0,W,H);

      // Country polygons
      if(countryRingsRef.current){
        countryRingsRef.current.forEach(ring=>{
          if(ring.coords.length<3)return;
          // Skip artifacts — polygons spanning >300° are wraparound noise
          let minLn=Infinity,maxLn=-Infinity;
          ring.coords.forEach(([ln])=>{if(ln<minLn)minLn=ln;if(ln>maxLn)maxLn=ln});
          // skip artifact segments inline below

          if(layers.governance){
            const g=GOV[ring.name];
            if(g){ctx.fillStyle=govColor(g.reg)+(isDk?"44":"55")}
            else{ctx.fillStyle=isDk?"#2f4458":"#e8e4de"}
          } else {
            ctx.fillStyle=isDk?"#2f4458":"#e8e4de";
          }
          ctx.beginPath();
          let first=true;let prevLn=null;
          for(const[ln,la]of ring.coords){
            if(prevLn!==null&&Math.abs(ln-prevLn)>170){ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();first=true;}
            prevLn=ln;
            const[x,y]=proj(la,ln);
            if(first){ctx.moveTo(x,y);first=false}else ctx.lineTo(x,y);
          }
          ctx.closePath();ctx.fill();
          // Subtle borders
          ctx.strokeStyle=isDk?"rgba(90,120,150,0.6)":"rgba(120,110,100,0.5)";ctx.lineWidth=0.8*dpr;ctx.stroke();
        });
        // Country labels at medium zoom
        if(zm>=1.8){
          const labelled=new Set();
          countryRingsRef.current.forEach(ring=>{
            if(ring.coords.length<10||labelled.has(ring.name))return;
            let minLn=Infinity,maxLn=-Infinity,minLa=Infinity,maxLa=-Infinity;
            ring.coords.forEach(([ln,la])=>{if(ln<minLn)minLn=ln;if(ln>maxLn)maxLn=ln;if(la<minLa)minLa=la;if(la>maxLa)maxLa=la});
            // skip artifact segments inline below
            if(maxLn-minLn>180)return;
            const cLat=(minLa+maxLa)/2,cLng=(minLn+maxLn)/2;
            const[cx2,cy2]=proj(cLat,cLng);
            if(cx2<0||cx2>W||cy2<0||cy2>H)return;
            const span=(maxLn-minLn)*mW/360;
            if(span<30*dpr)return;
            labelled.add(ring.name);
            const fontSize=Math.min(Math.max(span/ring.name.length*0.8,7*dpr),14*dpr);
            ctx.fillStyle=isDk?"rgba(180,195,210,0.35)":"rgba(60,50,40,0.3)";
            ctx.font=`600 ${fontSize}px -apple-system,BlinkMacSystemFont,sans-serif`;
            ctx.textAlign="center";ctx.textBaseline="middle";
            ctx.fillText(ring.name,cx2,cy2);
            ctx.textAlign="start";ctx.textBaseline="alphabetic";
          });
        }
      }

      // Faint grid over land
      ctx.strokeStyle=isDk?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.05)";ctx.lineWidth=0.5*dpr;
      for(let lat=-60;lat<=80;lat+=30){const [,y]=proj(lat,0);ctx.beginPath();ctx.moveTo(ox,y);ctx.lineTo(ox+mW,y);ctx.stroke()}
      for(let lng=-150;lng<=180;lng+=30){const [x]=proj(0,lng);ctx.beginPath();ctx.moveTo(x,oy);ctx.lineTo(x,oy+mH);ctx.stroke()}

      // Shipping routes
      if(layers.shipping){
        SHIP_ROUTES.forEach(route=>{
          ctx.beginPath();
          ctx.strokeStyle=route.t==="commodity"?(isDk?"rgba(232,125,62,0.4)":"rgba(200,90,30,0.5)"):(isDk?"rgba(96,165,250,0.25)":"rgba(50,120,220,0.3)");
          ctx.lineWidth=(route.t==="commodity"?1.5:1)*dpr;
          route.pts.forEach(([la,ln],i)=>{
            const[x,y]=proj(la,ln);
            if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
          });
          ctx.stroke();
        });
        // Ports
        PORTS.forEach(p=>{
          const[x,y]=proj(p.la,p.ln);
          const r=(p.t==="choke"?5.5:p.t==="commodity"?4.5:3.5)*dpr*Math.min(zm,3)/2;
          const portCol=p.t==="choke"?"#fbbf24":p.t==="commodity"?"#ffffff":"#e2e8f0";
          ctx.globalAlpha=0.95;
          if(p.t==="choke"){
            ctx.beginPath();ctx.moveTo(x,y-r*1.4);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r*1.4);ctx.lineTo(x-r,y);ctx.closePath();
            ctx.fillStyle=portCol;ctx.fill();ctx.strokeStyle="rgba(251,191,36,0.5)";ctx.lineWidth=1.5*dpr;ctx.stroke();
          } else {
            ctx.beginPath();ctx.moveTo(x,y-r*1.4);ctx.lineTo(x+r*1.2,y+r*0.8);ctx.lineTo(x-r*1.2,y+r*0.8);ctx.closePath();
            ctx.fillStyle=portCol;ctx.fill();ctx.strokeStyle="rgba(0,0,0,0.2)";ctx.lineWidth=0.8*dpr;ctx.stroke();
          }
          ctx.globalAlpha=1;
          // Port labels at higher zoom
          if(zm>=2.5){
            ctx.fillStyle=isDk?"rgba(255,255,255,0.7)":"rgba(0,0,0,0.6)";ctx.font=(9*dpr)+"px 'SF Mono',Consolas,monospace";
            ctx.fillText(p.n,x+r+3*dpr,y+3*dpr);
          }
        });
      }

      // Mine markers
      const filtSet=new Set(filtered.map(m=>m.name));
      MINES.forEach(m=>{
        const inFilter=filtSet.has(m.name);
        if(!inFilter&&search)return;
        let mLat=m.lat,mLng=m.lng;
        if(m.parent){const par=MINES.find(p=>p.name===m.parent);if(par&&Math.abs(par.lat-m.lat)<0.1&&Math.abs(par.lng-m.lng)<0.1){mLat=m.lat+0.28;mLng=m.lng+0.28;}}
        const[x,y]=proj(mLat,mLng);
        if(x<-20||x>W+20||y<-20||y>H+20)return;
        const baseR=(getMineScale(m)*3+2)*dpr*Math.min(zm,3.5)/2;
        const r=Math.max(baseR,1.5*dpr);
        const col=getMarkerColor(m,viewMode);
        const alpha=inFilter?(layers.shipping?0.55:0.95):0.18;
        ctx.globalAlpha=alpha;
        if(isProject(m)){
          ctx.beginPath();ctx.moveTo(x,y-r*1.8);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r*1.8);ctx.lineTo(x-r,y);ctx.closePath();
          ctx.fillStyle=col;ctx.fill();
        } else {
          const grad=ctx.createRadialGradient(x-r*0.25,y-r*0.25,0,x,y,r);
          grad.addColorStop(0,"#ffffff");
          grad.addColorStop(0.25,col);
          grad.addColorStop(1,col+"99");
          ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
          ctx.fillStyle=grad;ctx.fill();
        }
        ctx.globalAlpha=1;
        // Labels at high zoom — collision detection
      });

      // Draw mine labels with collision avoidance (biggest mines first)
      if(zm>=3){
        const labelFont=(8*dpr)+"px 'SF Mono',Consolas,monospace";
        ctx.font=labelFont;
        const placed=[];
        // Sort by production scale descending so big mines get priority
        const labelCandidates=MINES.filter(m=>filtSet.has(m.name))
          .map(m=>{const[x,y]=proj(m.lat,m.lng);return{m,x,y,scale:getMineScale(m)}})
          .filter(c=>c.x>-20&&c.x<W+20&&c.y>-20&&c.y<H+20)
          .sort((a,b)=>b.scale-a.scale);
        
        labelCandidates.forEach(({m,x,y})=>{
          const baseR=(getMineScale(m)*3+2)*dpr*Math.min(zm,3.5)/2;
          const r=Math.max(baseR,1.5*dpr);
          const tw=ctx.measureText(m.name).width;
          const lx=x+r+2*dpr, ly=y-4*dpr;
          const lw=tw+4*dpr, lh=12*dpr;
          // Check overlap with already placed labels
          let overlap=false;
          for(const p of placed){
            if(lx<p.x+p.w&&lx+lw>p.x&&ly<p.y+p.h&&ly+lh>p.y){overlap=true;break}
          }
          if(!overlap){
            ctx.fillStyle=isDk?"rgba(255,255,255,0.8)":"rgba(0,0,0,0.7)";
            ctx.fillText(m.name,lx,y+3*dpr);
            placed.push({x:lx,y:ly,w:lw,h:lh});
          }
        });
      }

      // Selected/preview mine highlight
      const hlMine=previewMine||selMine;
      if(hlMine){
        const[x,y]=proj(hlMine.lat,hlMine.lng);
        const r=6*dpr;
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
        ctx.strokeStyle="#e87d3e";ctx.lineWidth=2*dpr;ctx.stroke();
        ctx.beginPath();ctx.arc(x,y,r+3*dpr,0,Math.PI*2);
        ctx.strokeStyle="rgba(232,125,62,0.3)";ctx.lineWidth=1*dpr;ctx.stroke();
      }

      animId=requestAnimationFrame(render);
    };
    render();
    return()=>cancelAnimationFrame(animId);
  },[mapMode,filtered,layers.governance,layers.shipping,previewMine,selMine,search,viewMode,theme]);

  const touchDist=useRef(0);
  // Pinch zoom only - single-finger drag handled by pointer events
  const onTouchStart=useCallback(e=>{
    if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;touchDist.current=Math.sqrt(dx*dx+dy*dy)}
  },[]);
  const onTouchMove=useCallback(e=>{
    if(e.touches.length===2){e.preventDefault();
      const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      const dist=Math.sqrt(dx*dx+dy*dy);const o=orbitRef.current;
      o.targetZoom-=(dist-touchDist.current)*0.01;
      o.targetZoom=Math.max(1.8,Math.min(8,o.targetZoom));touchDist.current=dist}
  },[]);

  const dk=theme==="dark";
  const bg=dk?"rgba(18,25,38,0.88)":"rgba(245,245,250,0.92)",bdr=dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.1)",br="12px",bf="blur(20px)";
  const tc=dk?"#c8d6e5":"#1a1a2e",tc2=dk?"#8494a4":"#4a5568",tc3=dk?"#e87d3e":"#c4621e",bgMain=dk?"#0f1926":"#e8eaf0";
  const legendItems=useMemo(()=>{
    if(viewMode==="commodity"){
      const comCounts={};
      MINES.forEach(m=>{m.commodity.forEach(co=>{comCounts[co]=(comCounts[co]||0)+1})});
      return["Copper","Gold","Iron Ore","Diamonds","Nickel","Platinum","Cobalt","Zinc","Lithium","Bauxite","Coal (Met)","Manganese"].map(c=>({label:c,color:CC[c]||"#ff9944",key:c,total:comCounts[c]||0}));
    }
    if(viewMode==="type")return Object.entries(TypeColors).map(([k,v])=>({label:k,color:v,key:k,total:""}));
    if(viewMode==="method")return Object.entries(MethodColors).map(([k,v])=>({label:k,color:v,key:k,total:""}));
    if(viewMode==="company"){const top=["BHP","Rio Tinto","Glencore","Newmont","Barrick Gold","Anglo American","Codelco","Vale","Gold Fields","Agnico Eagle Mines","South32","Fortescue"];return top.map(c=>({label:c,color:getCompanyColor(c),key:c,total:""}))}
    if(viewMode==="contractor"){const top=["Byrnecut","Barminco","Redpath","PYBAR","Macmahon","RUC Mining","Murray & Roberts","Master Drilling","Thiess","NRW Holdings","Downer","Owner-operated"];return top.map(c=>({label:c,color:getContractorColor(c),key:c,total:""}))}
    if(viewMode==="status"){return["Operating","Construction","Feasibility"].map(s=>({label:s,color:getStatusColor(s),key:s,total:""}))}
    return[];
  },[viewMode]);

  // Memoize legend counts to avoid re-filtering per item every render
  const legendCounts=useMemo(()=>{
    const counts={};
    filtered.forEach(m=>{
      if(viewMode==="commodity")(m.commodity||[]).forEach(c=>{counts[c]=(counts[c]||0)+1});
      else if(viewMode==="company"){const k=normCompany(m.company);counts[k]=(counts[k]||0)+1}
      else if(viewMode==="type"){counts[m.type]=(counts[m.type]||0)+1}
      else if(viewMode==="method"){counts[m.method]=(counts[m.method]||0)+1}
      else if(viewMode==="contractor")m.contractors.forEach(c=>{counts[c]=(counts[c]||0)+1});
    });
    return counts;
  },[filtered,viewMode]);

  return(<div style={{width:"100vw",height:"100vh",background:bgMain,fontFamily:"'Inter','SF Pro Display','Segoe UI',system-ui,-apple-system,sans-serif",color:tc,overflow:"hidden",position:"relative"}}>
    {loading&&<div style={{position:"absolute",inset:0,zIndex:100,background:"#0f1926",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px"}}>
      <LogoIcon size={48}/>
      <div style={{width:"40px",height:"40px",border:"3px solid rgba(232,125,62,0.15)",borderTopColor:"#e87d3e",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{fontSize:"13px",color:"#8494a4",letterSpacing:"1px"}}>LOADING MINE ATLAS</div>
    </div>}
    {/* HEADER — AppBar */}
    <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,height:isMobile?"auto":"56px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:isMobile?"10px 14px":"0 20px",background:dk?"rgba(15,27,44,0.95)":"rgba(245,245,250,0.95)",borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",backdropFilter:bf,pointerEvents:"auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:"14px",flex:1,minWidth:0}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{position:"relative",width:isMobile?18:22,height:isMobile?18:22}}>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`${isMobile?1.2:1.5}px solid #e87d3e`}}/>
            <div style={{position:"absolute",top:"50%",left:0,right:0,height:1,background:"#e87d3e",opacity:0.5}}/>
            <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:"#e87d3e",opacity:0.5}}/>
            <div style={{position:"absolute",top:"50%",left:"50%",width:4,height:4,background:"#e87d3e",borderRadius:"50%",transform:"translate(-50%,-50%)"}}/>
          </div>
          <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontWeight:700,letterSpacing:"0.18em",color:"#e87d3e",fontSize:isMobile?"13px":"16px"}}>MINE ATLAS</span>
        </div>
        {!isMobile&&<div style={{width:1,height:22,background:dk?"rgba(110,150,200,0.10)":"rgba(0,0,0,0.08)"}}/>}
        {!isMobile&&<div style={{display:"flex",gap:"18px"}}>
          {[["MINES",stats.operating],["PROJECTS",stats.projects]].map(([l,v])=>(
            <div key={l} style={{display:"flex",alignItems:"baseline",gap:"6px"}}>
              <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:"11px",color:dk?"#6c8198":"#8494a4",letterSpacing:"0.08em"}}>{l}</span>
              <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:"14px",color:tc,fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>}
      </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center",flexShrink:0}}>
          {/* View toggle */}
          <div style={{display:"flex",background:dk?"rgba(11,22,35,0.9)":"rgba(0,0,0,0.04)",padding:3,borderRadius:5,border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)"}}>
            {[{id:"3d",l:"3D"},{id:"2d",l:"2D"},{id:"term",l:"TERM"}].map(it=>(
              <div key={it.id} onClick={()=>{setMapMode(it.id);if(it.id==="term"){setDetail(false);setSidebar(false);setSelMine(null);setSelectedPort(null);setPreviewMine(null);setSearch("");setFiltCom("All");setFiltType("All");setFiltComp("All");setFiltStatus("All");setFiltMethod("All");}}} style={{padding:isMobile?"3px 8px":"4px 12px",fontFamily:"'SF Mono',Consolas,monospace",fontSize:isMobile?"10px":"12px",fontWeight:700,letterSpacing:"0.06em",color:mapMode===it.id?(dk?"#0f1926":"#fff"):dk?"#6c8198":"#8494a4",background:mapMode===it.id?"#e87d3e":"transparent",borderRadius:4,cursor:"pointer"}}>{it.l}</div>
            ))}
          </div>
          {/* Layer toggles inline in nav */}
          {!isMobile&&mapMode!=="term"&&<>
            <div style={{width:1,height:22,background:dk?"rgba(110,150,200,0.10)":"rgba(0,0,0,0.08)"}}/>
            {[{key:"governance",label:"Governance",color:"#f59e0b",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6l-8-3z"/></svg>},{key:"shipping",label:"Shipping",color:"#60a5fa",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 18s1 2 4 2 5-2 5-2 2 2 5 2 4-2 4-2M5 16V9l7-3 7 3v7M9 9V5h6v4"/></svg>}].map(l=>(
              <button key={l.key} onClick={()=>toggleLayer(l.key)} title={l.label} style={{height:34,padding:"0 12px",borderRadius:5,border:layers[l.key]?"1px solid "+l.color+"88":(dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)"),background:layers[l.key]?l.color+"18":"transparent",color:layers[l.key]?l.color:(dk?"#a9b9cc":"#6c8198"),cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all 0.2s",fontFamily:"'SF Mono',Consolas,monospace",fontSize:"11px",fontWeight:600,letterSpacing:"0.06em",whiteSpace:"nowrap"}}>
                {l.icon}{l.label}
              </button>
            ))}
          </>
          }
          {!isMobile&&<div style={{width:1,height:22,background:dk?"rgba(110,150,200,0.10)":"rgba(0,0,0,0.08)"}}/>}
          {!isMobile&&IS_LIVE&&ApiIndicator}
          {/* Icon buttons */}
          {[
            {fn:recentreGlobe,title:"Re-centre",icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>},
            {fn:()=>setTheme(dk?"light":"dark"),title:dk?"Light mode":"Dark mode",icon:dk?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>},

            {fn:()=>setShowFeedback(true),title:"Feedback",icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5z M10 20a2 2 0 0 0 4 0"/></svg>},
            {fn:()=>setShowAbout(true),title:"Help",icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/></svg>},
          ].map((b,i)=>(
            <button key={i} onClick={b.fn} title={b.title} style={{width:isMobile?24:34,height:isMobile?24:34,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"transparent",color:dk?"#a9b9cc":"#6c8198",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",borderRadius:5,cursor:"pointer",padding:0}}>{b.icon}</button>
          ))}
        </div>
    </div>
    {/* SIDEBAR TOGGLE */}
    {mapMode!=="term"&&<button onClick={()=>setSidebar(!sidebar)} style={{position:"absolute",top:isMobile?120:64,left:sidebar?358:12,zIndex:20,background:dk?"rgba(15,27,44,0.95)":"rgba(245,245,250,0.95)",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",borderRadius:"5px",color:"#e87d3e",padding:isMobile?"6px 10px":"7px 13px",cursor:"pointer",fontSize:isMobile?"14px":"16px",fontFamily:"inherit",backdropFilter:bf,transition:"left 0.3s ease",height:isMobile?"auto":34,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {sidebar?"◀":<svg width={isMobile?14:16} height={isMobile?14:16} viewBox="0 0 24 24" fill="none" stroke="#e87d3e" strokeWidth="1.6"><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>}
    </button>}
    {/* SIDEBAR - desktop: side panel, mobile: slide-in overlay */}
    {isMobile&&sidebar&&<div onClick={()=>setSidebar(false)} style={{position:"absolute",inset:0,zIndex:14,background:"rgba(0,0,0,0.4)"}}/>}
    <div style={{position:"absolute",top:isMobile?0:"64px",left:isMobile?(sidebar?0:"-100%"):(sidebar?12:-400),bottom:isMobile?0:"12px",width:isMobile?"85%":"340px",maxWidth:isMobile?"340px":"340px",zIndex:15,background:dk?"rgba(15,27,44,0.97)":"rgba(245,245,250,0.97)",border:isMobile?"none":(dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)"),borderRadius:isMobile?0:"6px",backdropFilter:bf,display:"flex",flexDirection:"column",overflow:"hidden",transition:isMobile?"left 0.3s ease":"left 0.3s ease"}}>
      {/* SEARCH */}
      <div style={{padding:"12px 12px 8px"}}>
        <input type="text" placeholder="Search mines, countries, companies..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",padding:"7px 10px",background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",borderRadius:"4px",color:tc,fontSize:"12px",outline:"none",boxSizing:"border-box",fontFamily:"'SF Mono',Consolas,monospace"}}/>
      </div>
      {/* FILTERS TOGGLE */}
      <div onClick={()=>setFiltersOpen(!filtersOpen)} style={{padding:"6px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",borderBottom:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)"}}>
        <span style={{fontSize:"10px",fontWeight:600,letterSpacing:"0.08em",color:tc2,fontFamily:"'SF Mono',Consolas,monospace"}}>{filtersOpen?"▾":"▸"} FILTERS</span>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px",color:filtered.length<MINES.length?"#e87d3e":tc,fontWeight:600,fontFamily:"'SF Mono',Consolas,monospace"}}>{filtered.length}<span style={{fontWeight:400,color:tc2,fontSize:"10px"}}> / {MINES.length}</span></span>
          {activeFilters.length>0&&<button onClick={e=>{e.stopPropagation();resetAll()}}
            style={{fontSize:"9px",color:"#fff",background:"rgba(232,125,62,0.8)",border:"none",borderRadius:"3px",padding:"2px 8px",cursor:"pointer",fontFamily:"'SF Mono',Consolas,monospace",fontWeight:600,letterSpacing:"0.06em"}}>RESET</button>}
        </div>
      </div>
      {/* COLLAPSIBLE FILTER SECTION */}
      {filtersOpen&&<div style={{maxHeight:isMobile?"35vh":"40vh",overflowY:"auto",padding:"8px 12px",borderBottom:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
          {[
            {key:"continent",label:"CONTINENT",val:filtCont,set:setFiltCont,opts:allContinents,counts:countFor.cont,color:"#ffd700"},
            {key:"country",label:"COUNTRY",val:filtCountry,set:setFiltCountry,opts:allCountries,counts:countFor.ctry,color:"#4ecdc4"},
            {key:"commodity",label:"COMMODITY",val:filtCom,set:setFiltCom,opts:allCom,counts:countFor.com,color:"#e87d3e"},
            {key:"company",label:"COMPANY",val:filtComp,set:setFiltComp,opts:allComp,counts:countFor.comp,color:"#3888ff"},
            {key:"type",label:"MINE TYPE",val:filtType,set:setFiltType,opts:allTypes,counts:countFor.typ,color:"#6fff6f"},
            {key:"method",label:"MINING METHOD",val:filtMethod,set:setFiltMethod,opts:allMethods,counts:countFor.meth,color:"#b8e8ff"},
            {key:"status",label:"STATUS",val:filtStatus,set:setFiltStatus,opts:allStatuses,counts:countFor.stat,color:"#4ade80"},
          ].map(f=>(
            <div key={f.key}>
              <div onClick={()=>setExpFilter(expFilter===f.key?null:f.key)}
                style={{padding:"8px 10px",cursor:"pointer",borderRadius:"4px",background:expFilter===f.key?(dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"):"transparent",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:dk?"1px solid rgba(110,150,200,0.06)":"1px solid rgba(0,0,0,0.04)",transition:"all 0.15s ease"}}>
                <div><span style={{fontSize:"10px",fontWeight:600,letterSpacing:"0.06em",color:f.val!=="All"?"#e87d3e":tc2,fontFamily:"'SF Mono',Consolas,monospace"}}>{expFilter===f.key?"▾":"▸"} {f.label}</span>{f.val!=="All"&&<div style={{fontSize:"10px",color:tc2,marginTop:"2px",marginLeft:"14px",fontFamily:"'SF Mono',Consolas,monospace"}}>{f.val}</div>}</div>
                <span style={{fontSize:"10px",color:f.val!=="All"?"#e87d3e":tc2,background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",padding:"2px 8px",borderRadius:"3px",fontWeight:600,fontFamily:"'SF Mono',Consolas,monospace"}}>{f.val==="All"?f.opts.length:countFor[f.key==="commodity"?"com":f.key==="company"?"comp":f.key==="type"?"typ":f.key==="method"?"meth":f.key==="contractor"?"ctr":f.key==="continent"?"cont":f.key==="status"?"stat":"ctry"][f.val]||0}</span>
              </div>
              {expFilter===f.key&&<div style={{paddingLeft:"8px",marginTop:"4px",maxHeight:"160px",overflowY:"auto"}}>
                <div onClick={()=>{f.set("All");setExpFilter(null)}}
                  style={{padding:"5px 10px",cursor:"pointer",borderRadius:"3px",fontSize:"10px",color:f.val==="All"?"#e87d3e":tc2,fontWeight:f.val==="All"?600:400,background:f.val==="All"?(dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"):"transparent",fontFamily:"'SF Mono',Consolas,monospace"}}
                  onMouseEnter={e=>e.currentTarget.style.background=dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"}
                  onMouseLeave={e=>e.currentTarget.style.background=f.val==="All"?(dk?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.04)"):"transparent"}>
                  All ({f.opts.length})
                </div>
                {f.opts.map(opt=>(
                  <div key={opt} onClick={()=>{f.set(f.val===opt?"All":opt);if(f.val!==opt)setExpFilter(null)}}
                    style={{padding:"5px 10px",cursor:"pointer",borderRadius:"3px",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"10px",color:f.val===opt?"#e87d3e":tc2,fontWeight:f.val===opt?600:400,background:f.val===opt?(dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"):"transparent",transition:"background 0.1s",fontFamily:"'SF Mono',Consolas,monospace"}}
                    onMouseEnter={e=>{if(f.val!==opt)e.currentTarget.style.background=dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"}}
                    onMouseLeave={e=>e.currentTarget.style.background=f.val===opt?(dk?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.04)"):"transparent"}>
                    <span>{f.key==="commodity"&&CC[opt]?<span style={{display:"inline-block",width:"8px",height:"8px",borderRadius:"50%",background:CC[opt],marginRight:"6px"}}/>:null}{opt}</span>
                    <span style={{fontSize:"9px",color:tc2,background:dk?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.04)",padding:"2px 7px",borderRadius:"8px",fontFamily:"'SF Mono','Cascadia Code','Consolas',monospace"}}>{f.counts[opt]||0}</span>
                  </div>))}
              </div>}
            </div>))}
        </div>
        {/* Numeric range filters */}
        <div style={{marginTop:"8px",borderTop:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)",paddingTop:"8px"}}>
          {[
            {key:"em_count",label:"Employees",min:0,max:10000,log:true,
              fmt:v=>v>=10000?"10k+":v>=1000?(v/1000).toFixed(1).replace(/\.0$/,'')+"k":v.toLocaleString()},
            {key:"dp_meters",label:"Depth (m)",min:0,max:4000,log:false,
              fmt:v=>v.toLocaleString()+"m"},
            {key:"rs_tonnes",label:"Reserves (Mt)",min:0,max:4000,log:true,
              fmt:v=>v>=4000?"4,000+":v>=1000?(v/1000).toFixed(1).replace(/\.0$/,'')+"Bt":v.toLocaleString()+"Mt"}
          ].map(({key,label,min,max,log,fmt})=>{
            const range=numFilters[key];
            const logMin=log?Math.log(Math.max(1,min)):min;
            const logMax=log?Math.log(Math.max(1,max)):max;
            const toSlider=v=>{if(!log)return((v-min)/(max-min))*100;return v<=0?0:((Math.log(Math.max(1,v))-logMin)/(logMax-logMin))*100};
            const fromSlider=s=>{if(!log)return Math.round(min+(s/100)*(max-min));if(s<=0)return 0;const v=Math.exp(logMin+(s/100)*(logMax-logMin));return Math.round(v)};
            const sLo=toSlider(range[0]),sHi=toSlider(range[1]);
            const pctLo=(sLo)+'%',pctHi=(sHi)+'%';
            const mono="'SF Mono','Cascadia Code','Consolas',monospace";
            return(<div key={key} style={{marginBottom:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                <span style={{fontSize:"10px",color:tc2,fontWeight:600,fontFamily:"'SF Mono',Consolas,monospace",letterSpacing:"0.06em"}}>{label.toUpperCase()}</span>
                <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  <span style={{fontSize:"9px",color:numActive[key]?tc3:tc2,fontFamily:mono,fontWeight:numActive[key]?600:400}}>{fmt(range[0])} – {fmt(range[1])}</span>
                  {numActive[key]&&<span onClick={()=>clearNumFilter(key)} style={{fontSize:"10px",color:"#e87d3e",cursor:"pointer",fontWeight:600}}>✕</span>}
                </div>
              </div>
              <div style={{position:"relative",height:"24px",display:"flex",alignItems:"center"}}>
                <div style={{position:"absolute",left:0,right:0,height:"4px",borderRadius:"2px",background:dk?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}}/>
                <div style={{position:"absolute",left:pctLo,width:`calc(${pctHi} - ${pctLo})`,height:"4px",borderRadius:"2px",background:"rgba(232,125,62,0.5)"}}/>
                <input type="range" min={0} max={100} step={0.5} value={sLo}
                  onChange={e=>{const v=fromSlider(parseFloat(e.target.value));if(v<=range[1])setNumFilter(key,[v,range[1]])}}
                  style={{position:"absolute",width:"100%",height:"24px",appearance:"none",WebkitAppearance:"none",background:"transparent",pointerEvents:"none",zIndex:sLo>sHi-2?4:3,margin:0}}
                  className="dualSlider"/>
                <input type="range" min={0} max={100} step={0.5} value={sHi}
                  onChange={e=>{const v=fromSlider(parseFloat(e.target.value));if(v>=range[0])setNumFilter(key,[range[0],v])}}
                  style={{position:"absolute",width:"100%",height:"24px",appearance:"none",WebkitAppearance:"none",background:"transparent",pointerEvents:"none",zIndex:4,margin:0}}
                  className="dualSlider"/>
              </div>
            </div>)})}
        </div>
      </div>}
      {/* Active filter chips */}
      {activeFilters.length>0&&
        <div style={{padding:"6px 12px",display:"flex",flexWrap:"wrap",gap:"4px",borderBottom:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)"}}>
          {activeFilters.map(f=>(
            <span key={f.label} onClick={f.clear} style={{fontSize:"9px",padding:"3px 8px",borderRadius:"6px",background:f.color+"20",color:f.color,border:"1px solid "+f.color+"44",cursor:"pointer",display:"flex",alignItems:"center",gap:"3px",fontWeight:500}}>
              {f.label} <span style={{opacity:0.6,fontSize:"8px"}}>✕</span>
            </span>))}
        </div>}
      {/* Sort controls */}
      <div style={{padding:"5px 12px",display:"flex",gap:"3px",flexWrap:"wrap",borderBottom:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)"}}>
        {[{k:"name",l:"A–Z"},{k:"rv_usd",l:"Revenue"},{k:"em_count",l:"Staff"},{k:"dp_meters",l:"Depth"},{k:"rs_tonnes",l:"Reserves"},{k:"opened",l:"Newest"}].map(s=>(
          <button key={s.k} onClick={()=>{if(sortBy===s.k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(s.k);setSortDir(s.k==="name"?"asc":"desc")}}}
            style={{fontSize:"9px",padding:"3px 8px",borderRadius:"5px",background:sortBy===s.k?"rgba(232,125,62,0.15)":dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",border:sortBy===s.k?"1px solid rgba(232,125,62,0.3)":dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.06)",color:sortBy===s.k?"#e87d3e":tc2,cursor:"pointer",fontFamily:"inherit",fontWeight:sortBy===s.k?600:400,transition:"all 0.12s"}}>
            {s.l}{sortBy===s.k?(sortDir==="asc"?" ↑":" ↓"):""}
          </button>))}
      </div>
      {/* PORT SEARCH RESULTS (when shipping active) */}
      {layers.shipping&&search.length>1&&(()=>{
        const sq=search.toLowerCase();
        const matchedPorts=PORTS.filter(p=>p.n.toLowerCase().includes(sq)||
          (p.com&&p.com.toLowerCase().includes(sq))||
          p.t.includes(sq));
        if(!matchedPorts.length)return null;
        return <div style={{padding:"4px 10px",borderBottom:dk?"1px solid rgba(96,165,250,0.15)":"1px solid rgba(96,165,250,0.1)"}}>
          <div style={{fontSize:"8px",letterSpacing:"1px",color:"#60a5fa",fontWeight:600,marginBottom:"4px",padding:"0 4px"}}>PORTS & CHOKEPOINTS</div>
          {matchedPorts.map(p=>(
            <div key={p.n} onClick={()=>{setSelectedPort(p);focusMine({name:p.n,lat:p.la,lng:p.ln});orbitRef.current.targetZoom=Math.min(orbitRef.current.zoomLevel,3)}}
              style={{padding:"5px 10px",cursor:"pointer",borderRadius:"6px",borderLeft:"3px solid "+p.c,marginBottom:"2px",fontSize:"11px",color:tc2,transition:"background 0.1s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=dk?"rgba(96,165,250,0.08)":"rgba(96,165,250,0.04)"}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
              <div style={{fontWeight:600,fontSize:"12px",color:tc,display:"flex",alignItems:"center",gap:"5px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:p.t==="choke"?"1px":"50%",background:p.c,flexShrink:0}}/>
                {p.n}
              </div>
              <div style={{fontSize:"9px",color:tc2,marginTop:"1px"}}>{p.t==="commodity"?"Commodity Port":p.t==="choke"?"Chokepoint":"Trade Hub"}{p.com?" · "+p.com:""}</div>
            </div>
          ))}
        </div>;
      })()}
      {/* MINE LIST */}
      <div style={{flex:1,overflowY:"auto",padding:"4px 10px 12px"}}>
        {sorted.map(mine=>(
          <div key={mine.name} onClick={()=>selectMine(mine)}
            style={{padding:"7px 10px",cursor:"pointer",borderRadius:"4px",borderLeft:"3px solid "+getMarkerColor(mine,viewMode),marginBottom:"1px",fontSize:"11px",color:tc2,transition:"background 0.1s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=dk?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.04)";e.currentTarget.style.color=tc}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=tc2}}>
            <div style={{fontWeight:600,fontSize:"12px",display:"flex",alignItems:"center",gap:"5px"}}>{mine.name}{layers.governance&&GOV[mine.country]&&<span style={{fontSize:"7px",padding:"1px 4px",borderRadius:"3px",background:govColor(GOV[mine.country].reg)+"25",color:govColor(GOV[mine.country].reg),fontWeight:700,lineHeight:1}}>{GOV[mine.country].reg}</span>}</div>
            <div style={{fontSize:"10px",color:tc2,marginTop:"1px"}}>{mine.company} · {mine.country}{viewMode==="contractor"&&mine.contractors[0]!=="Owner-operated"?" · "+mine.contractors[0]:""}</div>
            <div style={{fontSize:"10px",marginTop:"2px",fontFamily:"'SF Mono',Consolas,monospace",color:dk?"rgba(232,125,62,0.85)":"#c06030",display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {(()=>{const{out,rv}=getMineOutput(mine);const p=[];if(out)p.push(out);if(rv)p.push(rv);
                return p.length?p.map((t,i)=><span key={i}>{t}</span>):null;
              })()}
            </div>
          </div>))}
      </div>
    </div>
    {/* VIEW MODE TOGGLE */}
    {mapMode!=="term"&&<div style={{position:"absolute",top:isMobile?80:64,left:"50%",transform:"translateX(-50%)",zIndex:12,display:"flex",gap:"2px",background:dk?"rgba(15,27,44,0.92)":"rgba(245,245,250,0.92)",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",borderRadius:"5px",padding:"3px",backdropFilter:bf,pointerEvents:"auto"}}>
      {[{k:"commodity",l:"COMMODITY"},{k:"company",l:"COMPANY"},{k:"type",l:"MINE TYPE"},{k:"method",l:"METHOD"},{k:"status",l:"STATUS"}].map(v=>(
        <button key={v.k} onClick={()=>setViewMode(v.k)}
          style={{fontSize:isMobile?"9px":"12px",padding:isMobile?"4px 8px":"5px 14px",height:isMobile?"auto":28,borderRadius:"4px",border:"none",cursor:"pointer",fontFamily:"'SF Mono',Consolas,monospace",fontWeight:600,letterSpacing:"0.06em",transition:"all 0.15s",
            background:viewMode===v.k?"#e87d3e":"transparent",
            color:viewMode===v.k?(dk?"#0f1926":"#fff"):tc2}}>{v.l}</button>))}
    </div>}
    {/* 3D GLOBE */}
    <div ref={mountRef} style={{width:"100%",height:"100%",cursor:"grab",touchAction:"none",display:mapMode==="3d"?"block":"none"}} onPointerDown={onDown} onPointerMove={onMove} onClick={onClick} onTouchStart={onTouchStart} onTouchMove={onTouchMove}/>
    {mapMode==="2d"&&<canvas ref={map2dRef} style={{width:"100%",height:"100%",cursor:"grab",touchAction:"none"}}
      onPointerDown={on2dDown} onPointerMove={on2dMove} onPointerUp={on2dUp} onPointerLeave={()=>setHover2d(null)} onClick={on2dClick}/>}
    {/* 2D hover tooltip */}
    {mapMode==="2d"&&hover2d&&!previewMine&&<div style={{position:"absolute",left:hover2d.sx+12,top:hover2d.sy-30,zIndex:20,pointerEvents:"none",background:dk?"rgba(18,25,38,0.95)":"rgba(245,245,250,0.95)",border:"1px solid "+getCC(hover2d.mine.commodity)+"55",borderRadius:"8px",padding:"6px 10px",backdropFilter:bf,maxWidth:"200px",animation:"none"}}>
      <div style={{fontSize:"11px",fontWeight:600,color:tc,display:"flex",alignItems:"center",gap:"5px"}}>
        <div style={{width:"6px",height:"6px",borderRadius:"50%",background:getCC(hover2d.mine.commodity),flexShrink:0}}/>
        {hover2d.mine.name}
      </div>
      <div style={{fontSize:"9px",color:tc2,marginTop:"2px"}}>{hover2d.mine.company} · {hover2d.mine.country}</div>
      <div style={{fontSize:"9px",color:"#e87d3e",marginTop:"1px",fontFamily:"'SF Mono',Consolas,monospace"}}>{hover2d.mine.commodity.join(", ")}</div>
    </div>}
    {/* 2D zoom controls */}
    {mapMode==="2d"&&<div style={{position:"absolute",bottom:isMobile?80:24,right:isMobile?8:16,zIndex:12,display:"flex",flexDirection:"column",gap:"2px"}}>
      <button onClick={()=>{const s=map2dPanRef.current;s.zoom=Math.min(20,s.zoom*1.5)}} style={{width:26,height:26,borderRadius:"4px 4px 0 0",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",background:dk?"rgba(15,27,44,0.92)":"rgba(245,245,250,0.92)",color:dk?"#a9b9cc":"#6c8198",fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontFamily:"'SF Mono',Consolas,monospace",backdropFilter:bf,padding:0}}>+</button>
      <button onClick={()=>{const s=map2dPanRef.current;s.zoom=Math.max(1,s.zoom/1.5)}} style={{width:26,height:26,borderRadius:"0 0 4px 4px",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",borderTop:"none",background:dk?"rgba(15,27,44,0.92)":"rgba(245,245,250,0.92)",color:dk?"#a9b9cc":"#6c8198",fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontFamily:"'SF Mono',Consolas,monospace",backdropFilter:bf,padding:0}}>−</button>
    </div>}
    {/* Onboarding hint */}
    {showHint&&!loading&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:11,pointerEvents:"none",textAlign:"center",animation:"fadeHint 0.8s ease-out"}}>
      <div style={{background:dk?"rgba(18,25,38,0.85)":"rgba(245,245,250,0.85)",border:dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.08)",borderRadius:"12px",padding:"16px 24px",backdropFilter:"blur(12px)"}}>
        <div style={{fontSize:"13px",color:tc,fontWeight:500,marginBottom:"6px"}}>Drag to rotate · Scroll to zoom</div>
        <div style={{fontSize:"11px",color:tc2}}>Click any mine marker to explore</div>
      </div>
    </div>}
    {/* Governance layer legend */}
    {layers.governance&&!detail&&mapMode!=="term"&&<div style={{position:"absolute",top:isMobile?"auto":100,bottom:isMobile?280:"auto",left:isMobile?8:"auto",right:isMobile?"auto":12,zIndex:12,background:dk?"rgba(18,25,38,0.92)":"rgba(245,245,250,0.92)",border:dk?"1px solid rgba(245,158,11,0.2)":"1px solid rgba(245,158,11,0.15)",borderRadius:"10px",padding:"10px 14px",backdropFilter:bf,maxWidth:"200px"}}>
      <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"1.5px",color:"#f59e0b",marginBottom:"8px"}}>GOVERNANCE RISK</div>
      {[{reg:"Low",l:"Low Risk"},{reg:"Medium",l:"Medium Risk"},{reg:"High",l:"High Risk"},{reg:"Extreme",l:"Extreme Risk"}].map(r=>(
        <div key={r.reg} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
          <div style={{width:10,height:10,borderRadius:"2px",background:govColor(r.reg),flexShrink:0}}/>
          <span style={{fontSize:"11px",color:tc2,flex:1}}>{r.l}</span>
        </div>
      ))}
      <div style={{fontSize:"8px",color:tc2,opacity:0.5,marginTop:"6px",lineHeight:1.3}}>CPI: Transparency International 2024<br/>Reg: Fraser Institute / policy analysis</div>
    </div>}
    {/* Shipping layer legend */}
    {layers.shipping&&!detail&&mapMode!=="term"&&<div style={{position:"absolute",top:isMobile?"auto":(layers.governance?280:100),bottom:isMobile?(layers.governance?480:280):"auto",left:isMobile?8:"auto",right:isMobile?"auto":12,zIndex:12,background:dk?"rgba(18,25,38,0.92)":"rgba(245,245,250,0.92)",border:dk?"1px solid rgba(96,165,250,0.2)":"1px solid rgba(96,165,250,0.15)",borderRadius:"10px",padding:"10px 14px",backdropFilter:bf,maxWidth:"220px"}}>
      <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"1.5px",color:"#60a5fa",marginBottom:"8px"}}>SHIPPING ROUTES</div>
      {[
        {c:"#e87d3e",l:"Commodity export port",sh:"circle"},
        {c:"#60a5fa",l:"Major trade hub",sh:"circle"},
        {c:"#fbbf24",l:"Chokepoint",sh:"diamond"},
        {c:"#e87d3e",l:"Commodity route",sh:"line"},
        {c:"#60a5fa",l:"Trade route",sh:"line"},
      ].map((r,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
          {r.sh==="circle"&&<div style={{width:"8px",height:"8px",borderRadius:"50%",background:r.c,flexShrink:0}}/>}
          {r.sh==="diamond"&&<div style={{width:"8px",height:"8px",borderRadius:"1px",background:r.c,flexShrink:0,transform:"rotate(45deg)",border:"1px solid "+r.c}}/>}
          {r.sh==="line"&&<div style={{width:"14px",height:"2px",background:r.c,flexShrink:0,borderRadius:"1px",opacity:0.6}}/>}
          <span style={{fontSize:"10px",color:tc2}}>{r.l}</span>
        </div>
      ))}
      <div style={{fontSize:"8px",color:tc2,opacity:0.5,marginTop:"6px",lineHeight:1.3}}>{PORTS.filter(p=>p.t==="commodity").length} commodity ports · {PORTS.filter(p=>p.t==="choke").length} chokepoints · {SHIP_ROUTES.length} routes</div>
    </div>}
        {/* Floating active filter chips */}
    {activeFilters.length>0&&!detail&&<div style={{position:"absolute",top:isMobile?82:92,left:isMobile?8:(sidebar?400:60),right:isMobile?8:60,zIndex:12,display:"flex",gap:"5px",flexWrap:"wrap",alignItems:"center",transition:"left 0.3s ease"}}>
      {activeFilters.map(f=>(
        <span key={f.label} onClick={f.clear} style={{fontSize:"10px",padding:"4px 10px",borderRadius:"12px",background:f.color+"20",color:f.color,border:"1px solid "+f.color+"44",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px",backdropFilter:bf,fontWeight:500}}>
          {f.label} <span style={{opacity:0.5,fontSize:"9px"}}>✕</span>
        </span>))}
      <span onClick={resetAll} style={{fontSize:"10px",padding:"4px 10px",borderRadius:"12px",background:"rgba(232,125,62,0.15)",color:"#e87d3e",border:"1px solid rgba(232,125,62,0.3)",cursor:"pointer",fontWeight:600}}>Clear all</span>
      <span style={{fontSize:"11px",color:tc2,marginLeft:"4px",fontFamily:"'SF Mono','Cascadia Code','Consolas',monospace",fontWeight:500}}>{filtered.length} mines</span>
    </div>}
    {/* NAV DEBUG - shows briefly after focusMine, auto-hides */}
    {/* HOVER TOOLTIP (desktop only, no preview open) */}
    {hoverMine&&!detail&&!previewMine&&!isMobile&&(<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-120%)",background:dk?"rgba(18,25,38,0.95)":"rgba(245,245,250,0.95)",border:"1px solid rgba(232,125,62,0.4)",borderRadius:"8px",padding:"10px 14px",pointerEvents:"none",zIndex:20,backdropFilter:bf,maxWidth:"280px"}}>
      <div style={{fontSize:"12px",fontWeight:700,color:"#e87d3e"}}>{hoverMine.name}</div>
      <div style={{fontSize:"10px",color:tc2,marginTop:"2px"}}>{hoverMine.company} · {hoverMine.country}</div>
      {(()=>{const{out,rv}=getMineOutput(hoverMine);return(out||rv)?<div style={{fontSize:"10px",fontFamily:"'SF Mono',Consolas,monospace",color:dk?"rgba(232,125,62,0.85)":"#c06030",marginTop:"4px"}}>{out}{out&&rv?" · ":""}{rv}</div>:null})()}
      <div style={{display:"flex",gap:"3px",flexWrap:"wrap",marginTop:"5px"}}>
        {hoverMine.commodity.map(c=><span key={c} style={{fontSize:"8px",padding:"1px 5px",borderRadius:"3px",background:getCC([c])+"22",color:getCC([c]),border:"1px solid "+getCC([c])+"44"}}>{c}</span>)}
        {layers.governance&&GOV[hoverMine.country]&&<span style={{fontSize:"8px",padding:"1px 5px",borderRadius:"3px",background:govColor(GOV[hoverMine.country].reg)+"22",color:govColor(GOV[hoverMine.country].reg),border:"1px solid "+govColor(GOV[hoverMine.country].reg)+"44",fontWeight:600}}>Gov: {GOV[hoverMine.country].reg}</span>}
        
      </div>
    </div>)}
    {/* CLUSTER HOVER TOOLTIP */}
    {hoverCluster&&!detail&&!previewMine&&!isMobile&&(<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-120%)",background:dk?"rgba(18,25,38,0.95)":"rgba(245,245,250,0.95)",border:"1px solid rgba(232,125,62,0.4)",borderRadius:"8px",padding:"10px 14px",pointerEvents:"none",zIndex:20,backdropFilter:bf,maxWidth:"300px"}}>
      <div style={{fontSize:"12px",fontWeight:700,color:"#e87d3e"}}>{hoverCluster.mines.length} mines clustered</div>
      <div style={{fontSize:"10px",color:tc2,marginTop:"3px"}}>{hoverCluster.mines.slice(0,4).map(m=>m.name).join(", ")}{hoverCluster.mines.length>4?"...":""}</div>
      <div style={{fontSize:"9px",color:tc2,marginTop:"4px",fontStyle:"italic"}}>Click to zoom in</div>
    </div>)}
    {/* PART 4: Quick preview card */}
 {/* PORT INFO POPUP */}
    {selectedPort&&layers.shipping&&mapMode!=="term"&&<div style={{position:"absolute",bottom:isMobile?80:90,left:"50%",transform:"translateX(-50%)",zIndex:25,background:dk?"rgba(15,27,44,0.97)":"rgba(245,245,250,0.97)",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",borderRadius:"6px",padding:"12px 16px",backdropFilter:bf,width:isMobile?"90%":"340px",maxWidth:"400px",animation:"slideUp 0.25s ease-out"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{width:"10px",height:"10px",borderRadius:selectedPort.t==="choke"?"2px":"50%",background:selectedPort.c,flexShrink:0,border:selectedPort.t==="choke"?"1px solid #fbbf24":"none"}}/>
            <div style={{fontSize:"14px",fontWeight:700,color:selectedPort.c}}>{selectedPort.n}</div>
          </div>
          <div style={{fontSize:"10px",color:tc2,marginTop:"4px"}}>
            <span style={{padding:"2px 6px",borderRadius:"4px",background:selectedPort.t==="commodity"?"rgba(232,125,62,0.15)":selectedPort.t==="choke"?"rgba(251,191,36,0.15)":"rgba(96,165,250,0.15)",color:selectedPort.t==="commodity"?"#e87d3e":selectedPort.t==="choke"?"#fbbf24":"#60a5fa",fontSize:"9px",fontWeight:600}}>
              {selectedPort.t==="commodity"?"COMMODITY PORT":selectedPort.t==="choke"?"CHOKEPOINT":"TRADE HUB"}
            </span>
            {selectedPort.com&&<span style={{marginLeft:"6px",opacity:0.7}}>{selectedPort.com}</span>}
          </div>
          {selectedPort.info&&<div style={{fontSize:"11px",color:tc2,marginTop:"8px",lineHeight:1.5}}>{selectedPort.info}</div>}
          {(()=>{const served=Object.entries(MINE_PORT).filter(([_,p])=>p===selectedPort.n).map(([m])=>m);
            if(!served.length)return null;
            return <div style={{marginTop:"8px",padding:"6px 8px",background:dk?"rgba(232,125,62,0.06)":"rgba(232,125,62,0.04)",borderRadius:"6px",border:dk?"1px solid rgba(232,125,62,0.12)":"1px solid rgba(232,125,62,0.08)"}}>
              <div style={{fontSize:"8px",letterSpacing:"1px",color:"#e87d3e",fontWeight:600,marginBottom:"4px"}}>MINES SERVED ({served.length})</div>
              <div style={{fontSize:"10px",color:tc2,lineHeight:1.6}}>{served.join(", ")}</div>
            </div>})()}
          <div style={{fontSize:"9px",color:tc2,opacity:0.5,marginTop:"6px",fontFamily:"'SF Mono',Consolas,monospace"}}>{selectedPort.la.toFixed(2)}°{selectedPort.la>=0?"N":"S"}, {Math.abs(selectedPort.ln).toFixed(2)}°{selectedPort.ln>=0?"E":"W"}</div>
        </div>
        <button onClick={()=>setSelectedPort(null)} style={{background:"none",border:"none",color:tc2,fontSize:"16px",cursor:"pointer",padding:"0 0 0 8px",lineHeight:1}}>✕</button>
      </div>
    </div>}
    {/* DETAIL PANEL - desktop: side panel, mobile: swipeable bottom sheet */}
    {detail&&selMine&&(<div style={{position:"absolute",top:isMobile?"auto":"64px",right:isMobile?0:"12px",bottom:isMobile?0:"16px",left:isMobile?0:"auto",width:isMobile?"100%":"340px",height:isMobile?"85vh":"auto",maxHeight:isMobile?"85vh":"calc(100vh - 72px)",zIndex:25,background:dk?"rgba(15,27,44,0.97)":"rgba(245,245,250,0.97)",border:isMobile?"none":bdr,borderRadius:isMobile?"20px 20px 0 0":br,backdropFilter:bf,display:"flex",flexDirection:"column",overflow:"hidden",animation:isMobile?"sheetUp 0.3s ease-out":"slideIn 0.3s ease-out",transform:sheetDrag?`translateY(${Math.max(0,sheetDrag.current)}px)`:undefined,transition:sheetDrag?undefined:"transform 0.3s ease"}}>
      {/* Mobile drag handle - only this area triggers swipe-to-dismiss */}
      {isMobile&&<div
        onTouchStart={e=>{const y=e.touches[0].clientY;setSheetDrag({start:y,current:0})}}
        onTouchMove={e=>{if(!sheetDrag)return;const dy=e.touches[0].clientY-sheetDrag.start;setSheetDrag({...sheetDrag,current:dy})}}
        onTouchEnd={()=>{if(sheetDrag&&sheetDrag.current>120)clearSelection();setSheetDrag(null)}}
        style={{display:"flex",justifyContent:"center",padding:"10px 0 6px",cursor:"grab",flexShrink:0}}>
        <div style={{width:"40px",height:"4px",borderRadius:"2px",background:dk?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)"}}/>
      </div>}
      <div style={{padding:"12px 14px",borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
          <span style={{fontSize:"10px",fontWeight:600,letterSpacing:"0.08em",color:tc2,fontFamily:"'SF Mono',Consolas,monospace"}}>MINE PROFILE</span>
          <div style={{display:"flex",gap:"4px"}}>
            <button onClick={()=>toggleWatch(selMine)} title={watchlist.find(w=>w.name===selMine.name)?"Remove from watchlist":"Add to watchlist"} style={{width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"transparent",color:tc2,border:watchlist.find(w=>w.name===selMine.name)?"1px solid rgba(232,125,62,0.4)":(dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)"),borderRadius:3,cursor:"pointer",padding:0,color:watchlist.find(w=>w.name===selMine.name)?"#e87d3e":tc2}}><svg width="11" height="11" viewBox="0 0 24 24" fill={watchlist.find(w=>w.name===selMine.name)?"currentColor":"none"} stroke="currentColor" strokeWidth="1.6"><path d="m12 3 2.6 5.6 6.1.6-4.6 4.2 1.3 6.1L12 16.6 6.6 19.5l1.3-6.1L3.3 9.2l6.1-.6z"/></svg></button>
            <button onClick={()=>{setProfileMine(selMine);setProfileTab("overview");setDetail(false)}} title="Open full profile" style={{width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"transparent",color:tc2,border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",borderRadius:3,cursor:"pointer",padding:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
            <button onClick={clearSelection} title="Close" style={{width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"transparent",color:tc2,border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",borderRadius:3,cursor:"pointer",padding:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <h2 style={{margin:0,fontSize:"16px",fontWeight:700,color:tc3}}>{selMine.name}</h2>
            <p style={{margin:"2px 0 0",fontSize:"10px",color:tc2,fontFamily:"'SF Mono',Consolas,monospace"}}>{selMine.lat.toFixed(2)}°{selMine.lat>=0?"N":"S"} · {Math.abs(selMine.lng).toFixed(2)}°{selMine.lng>=0?"E":"W"}</p>
          </div>
          <span style={{width:10,height:10,borderRadius:"50%",background:getCC(selMine.commodity),flexShrink:0,marginTop:6}}/>
        </div>
        <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"8px"}}>
          {(selMine.commodity||[]).slice(0,2).map(co=><span key={co} style={{fontSize:"9px",padding:"2px 7px",borderRadius:"3px",fontFamily:"'SF Mono',Consolas,monospace",fontWeight:600,background:getCC([co])+"1f",color:getCC([co]),border:"1px solid "+getCC([co])+"33"}}>{co}</span>)}
          <span style={{fontSize:"9px",padding:"2px 7px",borderRadius:"3px",fontFamily:"'SF Mono',Consolas,monospace",fontWeight:600,background:getStatusColor(selMine.status)+"1f",color:getStatusColor(selMine.status),border:"1px solid "+getStatusColor(selMine.status)+"33"}}>{selMine.status}</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0",WebkitOverflowScrolling:"touch",overscrollBehavior:"contain"}}>
        {/* -- METAL OUTPUT highlight -- */}
        {(()=>{
          const metals=[];
          if(selMine.pr_cu_tpa)metals.push({v:(selMine.pr_cu_tpa/1e3),u:"kt/y",m:"Cu"});
          if(selMine.pr_au_oz_pa)metals.push({v:(selMine.pr_au_oz_pa/1e3),u:"koz/y",m:"Au"});
          if(selMine.pr_fe_mt)metals.push({v:selMine.pr_fe_mt,u:"Mt/y",m:"Fe"});
          if(selMine.pr_ni_tpa)metals.push({v:(selMine.pr_ni_tpa/1e3),u:"kt/y",m:"Ni"});
          if(selMine.pr_li_tpa)metals.push({v:(selMine.pr_li_tpa/1e3),u:"kt/y",m:"Li"});
          if(selMine.pr_zn_tpa)metals.push({v:(selMine.pr_zn_tpa/1e3),u:"kt/y",m:"Zn"});
          if(selMine.pr_pb_tpa)metals.push({v:(selMine.pr_pb_tpa/1e3),u:"kt/y",m:"Pb"});
          if(selMine.pr_ag_oz_pa)metals.push({v:(selMine.pr_ag_oz_pa/1e3),u:"koz/y",m:"Ag"});
          if(selMine.pr_pgm_oz_pa)metals.push({v:(selMine.pr_pgm_oz_pa/1e3),u:"koz/y",m:"PGM"});
          if(selMine.pr_coal_mt)metals.push({v:selMine.pr_coal_mt,u:"Mt/y",m:"Coal"});
          if(selMine.pr_baux_mt)metals.push({v:selMine.pr_baux_mt,u:"Mt/y",m:"Bauxite"});
          if(selMine.pr_potash_mt)metals.push({v:selMine.pr_potash_mt,u:"Mt/y",m:"KCl"});
          if(selMine.pr_carats_pa)metals.push({v:(selMine.pr_carats_pa/1e6),u:"Mct/y",m:"Diamonds"});
          if(selMine.pr_ti_kt)metals.push({v:selMine.pr_ti_kt,u:"kt/y",m:"TiO₂"});
          if(selMine.pr_reo_kt)metals.push({v:selMine.pr_reo_kt,u:"kt/y",m:"REO"});
          if(selMine.pr_phos_mt)metals.push({v:selMine.pr_phos_mt,u:"Mt/y",m:"Phosphate"});
          if(selMine.pr_cr_mt)metals.push({v:selMine.pr_cr_mt,u:"Mt/y",m:"Cr"});
          if(selMine.pr_mn_mt)metals.push({v:selMine.pr_mn_mt,u:"Mt/y",m:"Mn"});
          if(selMine.pr_sn_kt)metals.push({v:selMine.pr_sn_kt,u:"kt/y",m:"Sn"});
          if(selMine.pr_u3o8_tpa)metals.push({v:selMine.pr_u3o8_tpa,u:"t/y",m:"U₃O₈"});
          if(metals.length>0)return <div style={{padding:"10px 16px",background:dk?"rgba(232,125,62,0.04)":"rgba(232,125,62,0.03)",borderBottom:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:"9px",letterSpacing:"0.08em",color:tc2,fontWeight:600,marginBottom:"6px",fontFamily:"'SF Mono',Consolas,monospace"}}>OUTPUT</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {metals.map(({v,u,m:metal})=><div key={metal} style={{background:dk?"rgba(232,125,62,0.1)":"rgba(232,125,62,0.08)",border:dk?"1px solid rgba(232,125,62,0.2)":"1px solid rgba(232,125,62,0.15)",borderRadius:"6px",padding:"5px 8px",textAlign:"center"}}>
                <div style={{fontSize:"13px",fontFamily:"'SF Mono',Consolas,monospace",fontWeight:700,color:tc,lineHeight:1.1}}>{v%1===0?v.toFixed(0):v.toFixed(1)}</div>
                <div style={{fontSize:"8px",color:tc2,marginTop:"1px"}}>{u} <span style={{color:"#e87d3e",fontWeight:600}}>{metal}</span></div>
              </div>)}
            </div>
          </div>;
          if(selMine.production)return <div style={{padding:"10px 16px",background:dk?"rgba(232,125,62,0.04)":"rgba(232,125,62,0.03)",borderBottom:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:"8px",letterSpacing:"1.5px",color:tc2,fontWeight:600,marginBottom:"4px"}}>REPORTED OUTPUTS</div>
            <div style={{fontSize:"12px",color:tc}}>{selMine.production}</div>
          </div>;
          return null;
        })()}
        {/* -- INFO TABLE: two-column label/value rows -- */}
        <div style={{padding:"4px 0"}}>
          {[
            {l:"Owner",v:selMine.company},
            {l:"Type",v:selMine.type},
            {l:"Method",v:selMine.method},
            {l:"Status",v:selMine.status},
            MINE_PORT[selMine.name]?{l:"Export Port",v:MINE_PORT[selMine.name]}:null,
            selMine.pr_ore_tpa?{l:"Throughput",v:((mt)=>((mt>=1?(mt%1===0?mt.toFixed(0):mt.toFixed(1)):mt.toFixed(2))+" Mt/y"))(selMine.pr_ore_tpa/1e6)}:null,
            selMine.grade?{l:"Ore Grade",v:selMine.grade}:null,
            selMine.revenue?{l:"Est. Revenue",v:selMine.revenue}:null,
            selMine.employees?{l:"Employees",v:selMine.employees}:null,
            selMine.depth?{l:"Depth",v:selMine.depth}:null,
            selMine.reserves?{l:"Reserves",v:selMine.reserves}:null,
            selMine.discovered?{l:"Discovered",v:String(selMine.discovered)}:null,
            {l:"Opened",v:selMine.opened?String(selMine.opened):"In Development"},
            {l:"Location",v:(selMine.state||"")+(selMine.region?" · "+selMine.region:"")},
            {l:"Coordinates",v:selMine.lat.toFixed(3)+"°, "+selMine.lng.toFixed(3)+"°"},
          ].filter(Boolean).filter(r=>r.v).map(({l,v},i)=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"7px 16px",borderBottom:dk?"1px solid rgba(255,255,255,0.03)":"1px solid rgba(0,0,0,0.04)",background:i%2===0?"transparent":(dk?"rgba(255,255,255,0.015)":"rgba(0,0,0,0.015)")}}>
              <span style={{fontSize:"11px",color:tc2,fontWeight:500,flexShrink:0,marginRight:"12px"}}>{l}</span>
              <span style={{fontSize:"12px",color:tc,fontWeight:500,textAlign:"right",wordBreak:"break-word"}}>{v}</span>
            </div>))}
        </div>
        {/* -- GOVERNANCE RISK (when layer active) -- */}
        {layers.governance&&GOV[selMine.country]&&(()=>{
          const g=GOV[selMine.country];
          return <div style={{padding:"8px 16px",borderBottom:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:"8px",letterSpacing:"1.5px",color:"#f59e0b",fontWeight:600,marginBottom:"6px"}}>GOVERNANCE RISK</div>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
              <span style={{fontSize:"16px",fontFamily:"'SF Mono',Consolas,monospace",fontWeight:700,color:govColor(g.reg),background:govColor(g.reg)+"18",padding:"2px 10px",borderRadius:"6px",border:"1px solid "+govColor(g.reg)+"33"}}>{g.reg}</span>
              <div>
                <div style={{fontSize:"12px",fontWeight:600,color:tc}}>{govLabel(g.reg)}</div>
                <div style={{fontSize:"10px",color:tc2}}>CPI Score: {g.cpi}/100</div>
              </div>
            </div>
            <div style={{fontSize:"10px",color:tc2,lineHeight:1.4}}>{g.notes}</div>
          </div>;
        })()}
        {/* -- COUNTRY INFO -- */}
        {COUNTRY_INFO[selMine.country]&&(()=>{
          const ci=COUNTRY_INFO[selMine.country];
          return <div style={{padding:"8px 16px",borderBottom:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:"8px",letterSpacing:"1.5px",color:"#60a5fa",fontWeight:600,marginBottom:"6px"}}>{selMine.country.toUpperCase()}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px",fontSize:"10px"}}>
              <div><span style={{color:tc2,opacity:0.6}}>Pop: </span><span style={{color:tc}}>{ci.pop}</span></div>
              <div><span style={{color:tc2,opacity:0.6}}>GDP: </span><span style={{color:tc}}>{ci.gdp}</span></div>
              <div><span style={{color:tc2,opacity:0.6}}>Mining: </span><span style={{color:tc}}>{ci.mining}</span></div>
              <div><span style={{color:tc2,opacity:0.6}}>Currency: </span><span style={{color:tc}}>{ci.currency}</span></div>
            </div>
            <div style={{fontSize:"10px",color:tc2,marginTop:"4px"}}><span style={{opacity:0.6}}>Top commodities: </span>{ci.topCom}</div>
          </div>;
        })()}
        
          {/* PROJECT INFO */}
          {selMine.capex&&<div style={{marginTop:"8px",padding:"8px",borderRadius:"6px",background:dk?"rgba(245,158,11,0.1)":"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)"}}>
            <div style={{fontSize:"9px",fontWeight:600,color:"#f59e0b",marginBottom:"6px",letterSpacing:"0.08em",fontFamily:"'SF Mono',Consolas,monospace"}}>PROJECT INFO</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px",fontSize:"10px"}}>
              <div><span style={{color:tc,opacity:0.5}}>Stage:</span> <span style={{color:tc}}>{selMine.stage}</span></div>
              <div><span style={{color:tc,opacity:0.5}}>Capex:</span> <span style={{color:"#f59e0b",fontWeight:600}}>{selMine.capex}</span></div>
              <div><span style={{color:tc,opacity:0.5}}>First Prod:</span> <span style={{color:tc}}>{selMine.fpDate||"TBD"}</span></div>
              {selMine.parent&&<div><span style={{color:tc,opacity:0.5}}>Expansion of:</span> <span style={{color:"#e87d3e"}}>{selMine.parent}</span></div>}
            </div>
          </div>}
          {/* EXPANSION PROJECTS AT THIS MINE */}
          {(()=>{const exps=MINES.filter(p=>p.parent===selMine.name);return exps.length>0?(
            <div style={{marginTop:"8px",padding:"8px",borderRadius:"6px",background:dk?"rgba(245,158,11,0.1)":"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)"}}>
              <div style={{fontSize:"9px",fontWeight:600,color:"#f59e0b",marginBottom:"6px",letterSpacing:"0.08em",fontFamily:"'SF Mono',Consolas,monospace"}}>EXPANSION PROJECTS</div>
              {exps.map(exp=>(
                <div key={exp.name} onClick={()=>setSelMine(exp)} style={{cursor:"pointer",padding:"4px 6px",marginBottom:"4px",borderRadius:"4px",background:dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.03)",fontSize:"10px"}}>
                  <div style={{fontWeight:600,color:"#f59e0b"}}>{exp.name}</div>
                  <div style={{color:tc,opacity:0.7}}>{exp.status} · {exp.capex} · First prod: {exp.fpDate||"TBD"}</div>
                </div>
              ))}
            </div>
          ):null})()}
{/* -- NEARBY MINES -- */}
        {(()=>{
          const R_EARTH=6371;
          const toRad=d=>d*Math.PI/180;
          const dist=(la1,ln1,la2,ln2)=>{const dLa=toRad(la2-la1),dLn=toRad(ln2-ln1),a=Math.sin(dLa/2)**2+Math.cos(toRad(la1))*Math.cos(toRad(la2))*Math.sin(dLn/2)**2;return R_EARTH*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))};
          const nearby=MINES.filter(m=>m.name!==selMine.name).map(m=>({...m,km:Math.round(dist(selMine.lat,selMine.lng,m.lat,m.lng))})).filter(m=>m.km<=200).sort((a,b)=>a.km-b.km).slice(0,5);
          if(!nearby.length)return null;
          return <div style={{padding:"8px 16px",borderBottom:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:"9px",letterSpacing:"0.08em",color:tc2,fontWeight:600,marginBottom:"6px",fontFamily:"'SF Mono',Consolas,monospace"}}>NEARBY · WITHIN 200KM</div>
            {nearby.map(m=><div key={m.name} onClick={()=>{selectMine(m);focusMine(m)}} style={{display:"flex",alignItems:"center",gap:"8px",padding:"4px 0",cursor:"pointer",fontSize:"10px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:getCC(m.commodity),flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:tc,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
                <div style={{color:tc2,opacity:0.6,fontSize:"9px"}}>{m.commodity.join(", ")} · {m.company}</div>
              </div>
              <span style={{fontSize:"9px",color:tc2,opacity:0.5,fontFamily:"'SF Mono',Consolas,monospace",flexShrink:0}}>{m.km}km</span>
            </div>)}
          </div>;
        })()}
        {/* -- DATA QUALITY badges -- */}
        {(()=>{const raw=M.find(x=>x.n===selMine.name);if(!raw)return null;const dq=raw.dq;const conf=raw.confidence;if(!dq&&!conf)return null;const dqColor=dq==="A"?"#4CAF50":dq==="B"?"#FF9800":"#F44336";const confColor=conf==="High"?"#4CAF50":conf==="Medium"?"#FF9800":"#F44336";return <div style={{padding:"8px 16px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          {dq&&<span style={{fontSize:"9px",padding:"3px 8px",borderRadius:"4px",background:dqColor+"18",color:dqColor,border:"1px solid "+dqColor+"33",fontWeight:600}}>Data: {dq==="A"?"Production + Reserves":dq==="B"?"Production only":"Limited"}</span>}
          {conf&&<span style={{fontSize:"9px",padding:"3px 8px",borderRadius:"4px",background:confColor+"18",color:confColor,border:"1px solid "+confColor+"33",fontWeight:600}}>{conf} confidence</span>}
        </div>})()}
        {/* -- NOTES -- */}
        {selMine.notes&&(<div style={{margin:"4px 16px 12px",padding:"10px 12px",background:"rgba(232,125,62,0.06)",borderRadius:"8px",borderLeft:"3px solid #e87d3e"}}>
          <div style={{fontSize:"8px",letterSpacing:"1.5px",color:"#e87d3e",fontWeight:600,marginBottom:"4px"}}>NOTABLE</div>
          <div style={{fontSize:"11px",color:tc2,lineHeight:1.5}}>{selMine.notes}</div>
        </div>)}
      </div>
      {/* Bottom action buttons */}
      <div style={{padding:"10px 14px",borderTop:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",display:"flex",gap:"6px",flexShrink:0}}>
        <button onClick={()=>{setProfileMine(selMine);setProfileTab("overview");setDetail(false)}} style={{flex:1,padding:"8px",background:"#e87d3e",color:dk?"#0f1926":"#fff",border:"none",borderRadius:"4px",fontFamily:"'SF Mono',Consolas,monospace",fontSize:"10px",fontWeight:700,letterSpacing:"0.08em",cursor:"pointer"}}>OPEN PROFILE →</button>
        <button onClick={()=>addToCompare(selMine)} style={{flex:0.6,padding:"8px",background:compareList.find(m=>m.name===selMine.name)?"rgba(98,178,137,0.15)":"transparent",color:compareList.find(m=>m.name===selMine.name)?"#62b289":tc2,border:compareList.find(m=>m.name===selMine.name)?"1px solid rgba(98,178,137,0.3)":(dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)"),borderRadius:"4px",fontFamily:"'SF Mono',Consolas,monospace",fontSize:"10px",fontWeight:600,letterSpacing:"0.06em",cursor:"pointer"}}>{compareList.find(m=>m.name===selMine.name)?"✓ ADDED":"+ COMPARE"}</button>
      </div>
    </div>)}
    {/* ======================================= */}
    {/* COMPARE TRAY - floating bottom bar    */}
    {/* ======================================= */}
    {compareList.length>0&&!compareView&&(
      <div style={{position:"absolute",bottom:isMobile?60:56,left:"50%",transform:"translateX(-50%)",zIndex:30,display:"flex",alignItems:"center",gap:"8px",background:dk?"rgba(18,25,38,0.96)":"rgba(245,245,250,0.96)",padding:"8px 14px",borderRadius:"14px",border:dk?"1px solid rgba(232,125,62,0.25)":"1px solid rgba(0,0,0,0.12)",backdropFilter:bf,animation:"slideUp 0.3s ease-out",maxWidth:isMobile?"95%":"600px"}}>
        {compareList.map(mine=>(
          <div key={mine.name} style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 8px",borderRadius:"8px",background:getCC(mine.commodity)+"18",border:"1px solid "+getCC(mine.commodity)+"33",flexShrink:0}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:getCC(mine.commodity)}}/>
            <span style={{fontSize:"10px",color:tc,fontWeight:600,whiteSpace:"nowrap",maxWidth:"80px",overflow:"hidden",textOverflow:"ellipsis"}}>{mine.name}</span>
            <span onClick={()=>removeFromCompare(mine.name)} style={{fontSize:"10px",color:tc2,cursor:"pointer",marginLeft:"2px",lineHeight:1}}>✕</span>
          </div>))}
        <div style={{display:"flex",gap:"6px",marginLeft:"4px",flexShrink:0}}>
          <button onClick={()=>setCompareView(true)} style={{padding:"6px 12px",borderRadius:"4px",background:"rgba(232,125,62,0.15)",border:"1px solid rgba(232,125,62,0.3)",color:"#e87d3e",fontSize:"9px",fontWeight:600,cursor:"pointer",fontFamily:"'SF Mono',Consolas,monospace",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{compareList.length<2?"Add "+(2-compareList.length)+" more":"Compare "+compareList.length}</button>
          <button onClick={clearCompare} style={{padding:"6px 8px",borderRadius:"8px",background:dk?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)",border:dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.08)",color:tc2,fontSize:"10px",cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
        </div>
      </div>)}
    {/* Max limit flash */}
    {compareFlash==="max"&&<div style={{position:"absolute",bottom:isMobile?110:106,left:"50%",transform:"translateX(-50%)",zIndex:31,background:"rgba(255,60,60,0.9)",padding:"6px 14px",borderRadius:"8px",fontSize:"11px",color:"#fff",fontWeight:600,animation:"slideUp 0.2s ease-out",fontFamily:"inherit"}}>Maximum {MAX_COMPARE} mines for comparison</div>}

    {/* ======================================= */}
    {/* COMPARE VIEW - full screen table       */}
    {/* ======================================= */}
    {compareView&&compareList.length>=2&&(
      <div style={{position:"absolute",inset:0,zIndex:40,background:dk?"#08111c":"#eef2f7",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header bar */}
        <div style={{height:48,flexShrink:0,display:"flex",alignItems:"center",padding:"0 20px",gap:12,background:dk?"#0b1623":"#fff",borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)"}}>
          <button onClick={()=>setCompareView(false)} style={{padding:"5px 12px",height:30,borderRadius:3,border:"1px solid rgba(232,125,62,0.4)",background:"transparent",color:"#e87d3e",fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.06em"}}>← BACK</button>
          <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,color:dk?"#6c8198":"#999",letterSpacing:"0.08em"}}>COMPARE MINES</span>
          <span style={{fontSize:16,fontWeight:700,color:tc}}>Side-by-side · {compareList.length} assets</span>
          <span style={{padding:"2px 8px",borderRadius:3,background:"rgba(232,125,62,0.15)",color:"#e87d3e",fontFamily:"'SF Mono',Consolas,monospace",fontSize:9,fontWeight:700,border:"1px solid rgba(232,125,62,0.3)"}}>● LIVE</span>
          <div style={{flex:1}}/>
          <button onClick={()=>addToCompare(null)} style={{padding:"5px 12px",height:30,borderRadius:3,border:dk?"1px solid rgba(110,150,200,0.15)":"1px solid rgba(0,0,0,0.10)",background:"transparent",color:dk?"#6c8198":"#6b7280",fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,cursor:"pointer"}}>+ ADD ASSET</button>
          <button onClick={clearCompare} style={{padding:"5px 12px",height:30,borderRadius:3,border:"none",background:"rgba(215,99,74,0.12)",color:"#d7634a",fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,cursor:"pointer",fontWeight:700}}>CLEAR ALL</button>
        </div>

        {/* Main scrollable table */}
        <div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch"}}>
          {(()=>{
            const mono="'SF Mono',Consolas,monospace";
            const hair=dk?"rgba(110,150,200,0.08)":"rgba(0,0,0,0.05)";
            const good="#62b289",bad="#d7634a";
            const metricW=160;
            const colW=Math.max(220,Math.floor((1400-metricW)/compareList.length));

            // Get best value per row for highlighting
            const getBest=(vals,higher=true)=>{
              const nums=vals.map(v=>parseFloat(String(v).replace(/[^0-9.-]/g,""))||null).filter(v=>v!==null);
              if(!nums.length)return null;
              return higher?Math.max(...nums):Math.min(...nums);
            };

            // Highlight cell if it's the best
            const isBest=(val,best)=>{
              if(best===null||!val||val==="—")return false;
              const n=parseFloat(String(val).replace(/[^0-9.-]/g,""))||null;
              return n!==null&&Math.abs(n-best)<0.001;
            };

            const groups=[
              {label:"IDENTITY",color:"#e87d3e",rows:[
                {label:"Country",fn:m=>m.country,higher:null},
                {label:"Operator",fn:m=>m.company.split("/")[0].trim(),higher:null},
                {label:"Mine type",fn:m=>m.type||"—",higher:null},
                {label:"Country risk",fn:m=>{const g=GOV[m.country];return g?g.reg+" ("+g.score+")":"—"},higher:null},
              ]},
              {label:"PRODUCTION",color:"#60a5fa",rows:[
                {label:"Primary commodity",fn:m=>(m.commodity||[]).join(", "),higher:null},
                {label:"Head grade",fn:m=>m.grade||"—",higher:true},
                {label:"Recovery",fn:m=>{const d=MINE_DETAILS[m.name];return d&&d.ops?d.ops.recovery+"%":"—"},higher:true},
                {label:"Mill throughput",fn:m=>{const d=MINE_DETAILS[m.name];return d&&d.ops&&d.ops.mill_tpd?d.ops.mill_tpd.toLocaleString()+" tpd":"—"},higher:true},
                {label:"Production",fn:m=>m.description?m.description.split(";")[0].trim():"—",higher:null},
              ]},
              {label:"COSTS",color:"#f59e0b",rows:[
                {label:"C1 cash cost",fn:m=>{const d=MINE_DETAILS[m.name];return d&&d.fin?"$"+d.fin.c1_cash.toLocaleString()+"/t":"—"},higher:false},
                {label:"AISC",fn:m=>{const d=MINE_DETAILS[m.name];return d&&d.fin?"$"+d.fin.aisc.toLocaleString()+"/t":"—"},higher:false},
                {label:"Quartile pos.",fn:m=>{const d=MINE_DETAILS[m.name];if(!d||!d.fin)return"—";return d.fin.c1_cash<=800?"Q1":d.fin.c1_cash<=1200?"Q2":d.fin.c1_cash<=1600?"Q3":"Q4"},higher:null},
              ]},
              {label:"RESERVES",color:"#34d399",rows:[
                {label:"Total reserves",fn:m=>m.reserves||"—",higher:true},
                {label:"Mine life",fn:m=>{const d=MINE_DETAILS[m.name];return d&&d.res?d.res.reserve_life+" y":"—"},higher:true},
              ]},
              {label:"FINANCIAL",color:"#a78bfa",rows:[
                {label:"Revenue TTM",fn:m=>m.revenue?String(m.revenue).replace("~",""):"—",higher:true},
                {label:"EBITDA margin",fn:m=>{const d=MINE_DETAILS[m.name];return d&&d.fin?d.fin.ebitda_margin+"%":"—"},higher:true},
                {label:"ROCE",fn:m=>{const d=MINE_DETAILS[m.name];return d&&d.fin?d.fin.roce+"%":"—"},higher:true},
              ]},
              {label:"ESG",color:"#22c97a",rows:[
                {label:"Water source",fn:m=>{const d=MINE_DETAILS[m.name];return d&&d.ops?d.ops.water:"—"},higher:null},
                {label:"Power",fn:m=>{const d=MINE_DETAILS[m.name];return d&&d.ops?d.ops.power:"—"},higher:null},
                {label:"Jurisdiction risk",fn:m=>{const g=GOV[m.country];return g?g.reg+" Risk":"—"},higher:null},
              ]},
            ];

            return <table style={{borderCollapse:"collapse",width:"100%",minWidth:metricW+colW*compareList.length+"px"}}>
              <thead>
                <tr style={{position:"sticky",top:0,zIndex:5}}>
                  <th style={{width:metricW,minWidth:metricW,padding:"8px 16px",background:dk?"#0b1623":"#f0f4f8",borderBottom:"1px solid "+hair,textAlign:"left",fontFamily:mono,fontSize:9,color:dk?"#6c8198":"#6b7280",letterSpacing:"0.1em",fontWeight:600,verticalAlign:"bottom"}}>
                    METRIC<br/><span style={{fontSize:8,opacity:0.6}}>19 rows · 6 groups</span>
                  </th>
                  {compareList.map((mine,ci)=>{
                    const isAnchor=ci===0;
                    return <th key={mine.name} style={{width:colW,minWidth:colW,padding:"10px 16px",background:dk?(isAnchor?"#1d3a5c":"#0f1b2c"):(isAnchor?"#e8f2ff":"#fff"),borderBottom:"2px solid "+(isAnchor?"#e87d3e":hair),borderLeft:"1px solid "+hair,textAlign:"left",verticalAlign:"top",position:"relative"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:getCC(mine.commodity),flexShrink:0,display:"block"}}/>
                        <span style={{fontSize:14,fontWeight:700,color:isAnchor?"#e87d3e":tc,cursor:"pointer"}} onClick={()=>setProfileMine(mine)}>{mine.name}</span>
                        <span style={{fontFamily:mono,fontSize:9,color:dk?"#6c8198":"#6b7280"}}>{mine.country.slice(0,2).toUpperCase()}</span>
                        {isAnchor&&<span style={{fontFamily:mono,fontSize:8,fontWeight:700,padding:"1px 6px",borderRadius:2,background:"rgba(232,125,62,0.15)",color:"#e87d3e",border:"1px solid rgba(232,125,62,0.3)"}}>ANCHOR</span>}
                        <button onClick={()=>removeFromCompare(mine.name)} style={{marginLeft:"auto",width:18,height:18,borderRadius:2,border:dk?"1px solid rgba(110,150,200,0.15)":"1px solid rgba(0,0,0,0.10)",background:"transparent",color:dk?"#4a5d75":"#8a95a3",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
                      </div>
                      <div style={{fontFamily:mono,fontSize:10,color:dk?"#6c8198":"#6b7280"}}>{mine.company.split("/").slice(0,2).join(" / ")}</div>
                      <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
                        {(mine.commodity||[]).slice(0,3).map(co=><span key={co} style={{fontFamily:mono,fontSize:8,padding:"1px 5px",borderRadius:2,background:getCC([co])+"22",color:getCC([co]),fontWeight:700}}>{co}</span>)}
                        <span style={{fontFamily:mono,fontSize:8,padding:"1px 5px",borderRadius:2,background:getStatusColor(mine.status)+"22",color:getStatusColor(mine.status),fontWeight:700}}>{mine.status}</span>
                      </div>
                    </th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {groups.map(group=>[
                  // Group header row
                  <tr key={group.label} style={{background:dk?"rgba(255,255,255,0.015)":"rgba(0,0,0,0.02)"}}>
                    <td colSpan={compareList.length+1} style={{padding:"5px 16px",borderTop:"1px solid "+hair,borderBottom:"1px solid "+hair}}>
                      <span style={{fontFamily:mono,fontSize:9,fontWeight:700,color:group.color,letterSpacing:"0.12em"}}>{group.label}</span>
                    </td>
                  </tr>,
                  // Data rows
                  ...group.rows.map((row,ri)=>{
                    const vals=compareList.map(m=>row.fn(m));
                    const best=row.higher!==null?getBest(vals,row.higher):null;
                    return <tr key={group.label+row.label} style={{borderBottom:"1px solid "+hair}}
                      onMouseEnter={e=>e.currentTarget.style.background=dk?"rgba(29,58,92,0.3)":"rgba(220,235,255,0.4)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"7px 16px",fontFamily:mono,fontSize:11,color:dk?"#6c8198":"#4a5568",whiteSpace:"nowrap",background:dk?"#0b1623":"#f8fafb",borderRight:"1px solid "+hair}}>{row.label}</td>
                      {vals.map((val,ci)=>{
                        const best_=isBest(val,best);
                        return <td key={ci} style={{padding:"7px 16px",fontSize:12,fontFamily:["Production","Mill throughput","Revenue TTM","Total reserves","C1 cash cost","AISC","EBITDA margin","ROCE","Mine life"].includes(row.label)?mono:"inherit",color:best_?good:(val==="—"?(dk?"#3d5166":"#ccc"):tc),fontWeight:best_?700:500,borderLeft:"1px solid "+hair,background:best_?(dk?"rgba(98,178,137,0.06)":"rgba(98,178,137,0.05)"):"transparent",position:"relative"}}>
                          {val}
                          {best_&&<span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",color:good,fontSize:10}}>★</span>}
                        </td>;
                      })}
                    </tr>;
                  })
                ])}
              </tbody>
              {/* Production trend sparklines */}
              <tfoot>
                <tr style={{background:dk?"rgba(255,255,255,0.015)":"rgba(0,0,0,0.02)",borderTop:"1px solid "+hair}}>
                  <td colSpan={compareList.length+1} style={{padding:"5px 16px"}}>
                    <span style={{fontFamily:mono,fontSize:9,fontWeight:700,color:"#e87d3e",letterSpacing:"0.12em"}}>PRODUCTION TREND</span>
                    <span style={{fontFamily:mono,fontSize:8,color:dk?"#4a5d75":"#8a95a3",marginLeft:8}}>5y quarterly · indexed</span>
                  </td>
                </tr>
                <tr style={{borderBottom:"1px solid "+hair}}>
                  <td style={{padding:"8px 16px",fontFamily:mono,fontSize:10,color:dk?"#6c8198":"#4a5568",background:dk?"#0b1623":"#f8fafb",borderRight:"1px solid "+hair,verticalAlign:"middle"}}>Index</td>
                  {compareList.map((mine,ci)=>{
                    const seed=mine.name.charCodeAt(0);
                    const pts=Array.from({length:20},(_,i)=>{const base=70+seed%20;const trend=i*1.2;const noise=(Math.sin(i*seed)*8);return Math.max(40,Math.min(140,base+trend+noise));});
                    const pMax=Math.max(...pts),pMin=Math.min(...pts),pRng=pMax-pMin||1;
                    const path=pts.map((v,i)=>((i/19)*280).toFixed(0)+","+(50-(v-pMin)/pRng*44).toFixed(0)).join(" L ");
                    return <td key={mine.name} style={{padding:"8px 16px",borderLeft:"1px solid "+hair}}>
                      <svg width={280} height={52} style={{display:"block",overflow:"visible"}}>
                        <defs><linearGradient id={"cg"+ci} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e87d3e" stopOpacity="0.3"/><stop offset="100%" stopColor="#e87d3e" stopOpacity="0.02"/></linearGradient></defs>
                        <path d={"M"+path+" L 280,52 L 0,52 Z"} fill={"url(#cg"+ci+")"}/>
                        <polyline points={path} fill="none" stroke="#e87d3e" strokeWidth="1.5"/>
                      </svg>
                    </td>;
                  })}
                </tr>
              </tfoot>
            </table>;
          })()}
        </div>
      </div>
    )}



    {/* Interactive legend */}
    {!detail&&mapMode!=="term"&&<div style={{position:"absolute",bottom:"12px",left:"50%",transform:"translateX(-50%)",zIndex:10,background:dk?"rgba(15,27,44,0.92)":"rgba(245,245,250,0.92)",padding:isMobile?(legendOpen?"6px 12px":"4px 12px"):"8px 16px",borderRadius:"12px",border:dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.08)",backdropFilter:bf,maxWidth:isMobile?"95%":"92vw",cursor:isMobile?"pointer":"default"}} onClick={isMobile?()=>setLegendOpen(!legendOpen):undefined}>
      {isMobile&&!legendOpen?<div style={{display:"flex",alignItems:"center",gap:"6px",justifyContent:"center"}}>
        <span style={{fontSize:"9px",color:tc2,letterSpacing:"0.5px"}}>▲ {viewMode.charAt(0).toUpperCase()+viewMode.slice(1)} Legend · {filtered.length} mines</span>
      </div>:<div style={{display:"flex",gap:isMobile?"3px 8px":"4px 10px",flexWrap:"wrap",justifyContent:"center"}}>
      {legendItems.map(item=>{
        const isActive=(viewMode==="commodity"&&filtCom===item.label)||(viewMode==="company"&&filtComp===item.label)||(viewMode==="type"&&filtType===item.label)||(viewMode==="method"&&filtMethod===item.label)||(viewMode==="contractor"&&filtCtr===item.label)||(viewMode==="status"&&filtStatus===item.label);
        const count=legendCounts[item.label]||0;
        return <div key={item.key} style={{display:"flex",alignItems:"center",gap:isMobile?"3px":"4px",cursor:"pointer",transition:"all 0.2s",padding:isMobile?"1px 4px":"2px 6px",borderRadius:"6px",background:isActive?item.color+"25":"transparent",border:isActive?"1px solid "+item.color+"55":"1px solid transparent",opacity:hasActiveFilter&&!isActive&&(filtCom!=="All"||filtComp!=="All"||filtType!=="All"||filtMethod!=="All"||filtCtr!=="All"||filtStatus!=="All")?0.4:1}}
          onClick={()=>{
            if(viewMode==="commodity")setFiltCom(filtCom===item.label?"All":item.label);
            else if(viewMode==="company")setFiltComp(filtComp===item.label?"All":item.label);
            else if(viewMode==="type")setFiltType(filtType===item.label?"All":item.label);
            else if(viewMode==="method")setFiltMethod(filtMethod===item.label?"All":item.label);
            else if(viewMode==="contractor")setFiltCtr(filtCtr===item.label?"All":item.label);
            else if(viewMode==="status")setFiltStatus(filtStatus===item.label?"All":item.label);
          }}>
          <div style={{width:isMobile?6:8,height:isMobile?6:8,borderRadius:"50%",background:item.color,flexShrink:0,boxShadow:isActive?"0 0 6px "+item.color:"none",transition:"all 0.2s"}}/>
          <span style={{fontSize:isMobile?"8px":"11px",color:isActive?item.color:tc2,fontWeight:isActive?600:400,letterSpacing:"0.2px",transition:"all 0.2s",whiteSpace:"nowrap"}}>{item.label}</span>
          {item.total&&<span style={{fontSize:isMobile?"7px":"9px",color:isActive?item.color:tc2,fontFamily:"'SF Mono',Consolas,monospace",opacity:0.5,fontWeight:500,whiteSpace:"nowrap"}}>{item.total}</span>}
          {count>0&&<span style={{fontSize:isMobile?"7px":"9px",color:isActive?item.color:tc2,fontFamily:"'SF Mono',Consolas,monospace",opacity:0.6}}>{count}</span>}
        </div>;
      })}
    </div>}
    </div>}

    {/* ================================================================ */}
    {/* TERMINAL VIEW */}
    {/* ================================================================ */}
    {mapMode==="term"&&(
      <div style={{position:"absolute",top:56,left:0,right:0,bottom:0,background:dk?"#0b1623":"#f0f0f5",display:"flex",flexDirection:"column",overflow:"hidden",zIndex:8}}>
        {/* Terminal tab bar */}
        <div style={{display:"flex",alignItems:"center",padding:"0 16px",borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",background:dk?"#0f1b2c":"#fff",height:36,flexShrink:0}}>
          <div style={{display:"flex",gap:2}}>
            {[{k:"overview",l:"OVERVIEW"},{k:"prices",l:"PRICES"},{k:"projects",l:"PROJECTS"},{k:"news",l:"NEWS"}].map(t=>(
              <button key={t.k} onClick={()=>setTermTab(t.k)} style={{padding:"6px 14px",fontSize:"10px",fontWeight:600,letterSpacing:"0.06em",fontFamily:"'SF Mono',Consolas,monospace",border:"none",borderBottom:termTab===t.k?"2px solid #e87d3e":"2px solid transparent",background:"transparent",color:termTab===t.k?"#e87d3e":(dk?"#6c8198":"#4a5568"),cursor:"pointer"}}>{t.l}</button>
            ))}
          </div>
          <div style={{flex:1}}/>
          <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:"9px",color:dk?"#6c8198":"#4a5568"}}>{new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})} UTC</span>
        </div>

        {/* Tab content */}
        <div style={{flex:1,overflow:"auto",padding:"16px"}}>

          {/* ---- OVERVIEW TAB ---- */}
          {termTab==="overview"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:1400}}>
              {/* ROW 1: Watchlist | Sector Mix | Company League Table */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12}}>
                {/* Watchlist */}
                <div style={{background:dk?"#0f1b2c":"#fff",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",borderRadius:6,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,fontWeight:600,color:dk?"#6c8198":"#4a5568",letterSpacing:"0.08em"}}>WATCHLIST</span>
                    <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,color:dk?"#4a5d75":"#6b7280"}}>{watchlist.length} mines</span>
                  </div>
                  {watchlist.length===0?(
                    <div style={{padding:"32px 20px",textAlign:"center",color:dk?"#4a5d75":"#6b7280",fontFamily:"'SF Mono',Consolas,monospace",fontSize:11}}>
                      <div style={{fontSize:28,marginBottom:10,opacity:0.25}}>☆</div>
                      <div style={{marginBottom:12}}>Star mines from the globe view to track them here</div>
                      <button onClick={()=>setMapMode("3d")} style={{padding:"6px 16px",background:"#e87d3e22",border:"1px solid #e87d3e44",borderRadius:3,color:"#e87d3e",fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:"0.06em"}}>+ EXPLORE GLOBE</button>
                    </div>
                  ):(
                    <div>{watchlist.map((w)=>(
                      <div key={w.name} style={{padding:"9px 14px",borderBottom:dk?"1px solid rgba(110,150,200,0.06)":"1px solid rgba(0,0,0,0.04)",display:"flex",alignItems:"center",gap:9,cursor:"pointer"}} onClick={()=>{setMapMode("3d");const mine=MINES.find(m=>m.name===w.name);if(mine){setSelMine(mine);setDetail(true);focusMine({name:mine.name,lat:mine.lat,lng:mine.lng})}}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:getCC(w.commodity),flexShrink:0,display:"block"}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:tc}}>{w.name}</div>
                          <div style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,color:dk?"#6c8198":"#6b7280",marginTop:1}}>{w.company} · {w.country}</div>
                        </div>
                        <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,padding:"2px 7px",borderRadius:3,background:getStatusColor(w.status)+"1f",color:getStatusColor(w.status),fontWeight:600}}>{w.status}</span>
                      </div>
                    ))}</div>
                  )}
                </div>

                {/* Sector Mix donut */}
                {(()=>{
                  const commTotals={};
                  MINES.filter(m=>m.st==="Operating").forEach(m=>{const c=m.commodity[0];commTotals[c]=(commTotals[c]||0)+1});
                  const entries=Object.entries(commTotals).sort((a,b)=>b[1]-a[1]).slice(0,8);
                  const total=entries.reduce((s,[,v])=>s+v,0);
                  let cumAngle=-Math.PI/2;
                  const r=52,cx=70,cy=70;
                  const slices=entries.map(([name,count])=>{const angle=(count/total)*2*Math.PI;const startA=cumAngle;cumAngle+=angle;const x1=cx+r*Math.cos(startA),y1=cy+r*Math.sin(startA),x2=cx+r*Math.cos(cumAngle),y2=cy+r*Math.sin(cumAngle);const large=angle>Math.PI?1:0;const col=CC[name]||"#888";return{name,count,col,pct:Math.round(count/total*100),path:`M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`}});
                  return <div style={{background:dk?"#0f1b2c":"#fff",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",borderRadius:6,overflow:"hidden"}}>
                    <div style={{padding:"10px 14px",borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)"}}><span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,fontWeight:600,color:dk?"#6c8198":"#4a5568",letterSpacing:"0.08em"}}>SECTOR MIX · OPERATING</span></div>
                    <div style={{padding:"12px 14px",display:"flex",gap:16,alignItems:"center"}}>
                      <svg width={140} height={140} style={{flexShrink:0}}>
                        {slices.map((s)=><path key={s.name} d={s.path} fill={s.col} opacity={0.9}/>)}
                        <circle cx={cx} cy={cy} r={30} fill={dk?"#0f1b2c":"#fff"}/>
                        <text x={cx} y={cy-6} textAnchor="middle" fontSize={18} fontWeight={800} fill={tc} fontFamily="'SF Mono',Consolas,monospace">{total}</text>
                        <text x={cx} y={cy+10} textAnchor="middle" fontSize={9} fill={dk?"#4a5d75":"#6b7280"} fontFamily="'SF Mono',Consolas,monospace">MINES</text>
                      </svg>
                      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                        {slices.map(s=><div key={s.name} style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:8,height:8,borderRadius:2,background:s.col,flexShrink:0}}/>
                          <span style={{fontSize:11,color:tc,flex:1}}>{s.name}</span>
                          <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,color:dk?"#6c8198":"#6b7280"}}>{s.pct}%</span>
                        </div>)}
                      </div>
                    </div>
                  </div>;
                })()}

                {/* Company League Table */}
                {(()=>{
                  const cos={};
                  MINES.filter(m=>m.st==="Operating").forEach(m=>{
                    const co=m.company.split("/")[0].split("(")[0].trim();
                    if(!cos[co])cos[co]={count:0,rv:0,commodities:{}};
                    cos[co].count++;cos[co].rv+=(parseFloat(String(m.revenue||"0").replace(/[^0-9.]/g,""))||0);
                    const cm=m.commodity[0];cos[co].commodities[cm]=(cos[co].commodities[cm]||0)+1;
                  });
                  const sorted=Object.entries(cos).sort((a,b)=>b[1].count-a[1].count).slice(0,8);
                  const maxCount=sorted[0]?.[1]?.count||1;
                  return <div style={{background:dk?"#0f1b2c":"#fff",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",borderRadius:6,overflow:"hidden"}}>
                    <div style={{padding:"10px 14px",borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,fontWeight:600,color:dk?"#6c8198":"#4a5568",letterSpacing:"0.08em"}}>COMPANY LEAGUE TABLE</span>
                      <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,color:dk?"#4a5d75":"#6b7280"}}>by mine count</span>
                    </div>
                    {sorted.map(([name,data],i)=>{
                      const topCo=Object.entries(data.commodities).sort((a,b)=>b[1]-a[1])[0]?.[0]||"";
                      const col=CC[topCo]||"#e87d3e";
                      return <div key={name} style={{padding:"6px 14px",borderBottom:dk?"1px solid rgba(110,150,200,0.05)":"1px solid rgba(0,0,0,0.03)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                          <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,color:dk?"#3d5166":"#ccc",width:16,textAlign:"right",flexShrink:0}}>{i+1}</span>
                          <span style={{fontSize:12,fontWeight:600,color:tc,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                          <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,fontWeight:700,color:col,flexShrink:0}}>{data.count}</span>
                        </div>
                        <div style={{marginLeft:24,display:"flex",gap:6,alignItems:"center"}}>
                          <div style={{flex:1,height:3,background:dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.05)",borderRadius:2,overflow:"hidden"}}>
                            <div style={{width:(data.count/maxCount*100)+"%",height:"100%",background:col,borderRadius:2,opacity:0.75}}/>
                          </div>
                          {data.rv>0&&<span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:9,color:dk?"#4a5d75":"#8a95a3",flexShrink:0}}>${data.rv>=1000?(data.rv/1000).toFixed(1)+"B":data.rv+"M"}</span>}
                        </div>
                      </div>;
                    })}
                  </div>;
                })()}
              </div>

              {/* ROW 2: Country tiles + sortable mines table */}
              {(()=>{
                const ctryData={};
                MINES.filter(m=>m.st==="Operating").forEach(m=>{
                  if(!ctryData[m.country])ctryData[m.country]={count:0,commodities:{}};
                  ctryData[m.country].count++;
                  const co=m.commodity[0];ctryData[m.country].commodities[co]=(ctryData[m.country].commodities[co]||0)+1;
                });
                const sortedCtry=Object.entries(ctryData).sort((a,b)=>b[1].count-a[1].count).slice(0,18);
                const sortModes=[
                  {k:"rv_usd",l:"Revenue",desc:true},
                  {k:"em_count",l:"Employees",desc:true},
                  {k:"dp_meters",l:"Depth",desc:true},
                  {k:"rs_tonnes",l:"Reserves",desc:true},
                  {k:"opened",l:"Oldest",desc:false},
                ];
                const activeSortMode=sortModes.find(s=>s.k===termSort)||sortModes[0];
                const filteredMines=[...MINES]
                  .filter(m=>m.revenue&&m.st==="Operating"&&(!termCountry||m.country===termCountry))
                  .sort((a,b)=>activeSortMode.desc?(b[termSort]||0)-(a[termSort]||0):(a[termSort]||9999)-(b[termSort]||9999))
                  .slice(0,20);
                return <div style={{background:dk?"#0f1b2c":"#fff",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",borderRadius:6,overflow:"hidden"}}>
                  {/* Header + sort toggles */}
                  <div style={{padding:"10px 14px",borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,fontWeight:600,color:dk?"#6c8198":"#4a5568",letterSpacing:"0.08em"}}>TOP MINES · {activeSortMode.l.toUpperCase()}</span>
                      {termCountry&&<span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,fontWeight:700,color:"#e87d3e"}}>· {termCountry}</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                      {sortModes.map(s=><button key={s.k} onClick={()=>setTermSort(s.k)}
                        style={{padding:"3px 10px",fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,fontWeight:700,borderRadius:3,border:termSort===s.k?"1px solid #e87d3e44":"1px solid "+(dk?"rgba(110,150,200,0.12)":"rgba(0,0,0,0.08)"),background:termSort===s.k?"#e87d3e18":"transparent",color:termSort===s.k?"#e87d3e":(dk?"#6c8198":"#6b7280"),cursor:"pointer"}}>
                        {s.l}
                      </button>)}
                      {termCountry&&<button onClick={()=>setTermCountry(null)} style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,color:dk?"#6c8198":"#6b7280",background:"transparent",border:dk?"1px solid rgba(110,150,200,0.12)":"1px solid rgba(0,0,0,0.08)",borderRadius:3,padding:"3px 9px",cursor:"pointer"}}>✕</button>}
                    </div>
                  </div>
                  {/* Country tiles */}
                  <div style={{padding:"8px 14px 6px",borderBottom:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.05)",display:"flex",flexWrap:"wrap",gap:5}}>
                    {sortedCtry.map(([ctry,data])=>{
                      const topCo=Object.entries(data.commodities).sort((a,b)=>b[1]-a[1])[0]?.[0]||"";
                      const col=CC[topCo]||"#e87d3e";
                      const isActive=termCountry===ctry;
                      return <button key={ctry} onClick={()=>setTermCountry(termCountry===ctry?null:ctry)}
                        style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",borderRadius:4,border:isActive?"1px solid "+col:"1px solid "+(dk?"rgba(110,150,200,0.12)":"rgba(0,0,0,0.08)"),background:isActive?col+"22":"transparent",cursor:"pointer",transition:"all 0.15s"}}>
                        <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,fontWeight:700,color:isActive?col:(dk?"#6c8198":"#4a5568")}}>{ctry}</span>
                        <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,padding:"1px 5px",borderRadius:2,background:col+"33",color:col,fontWeight:700}}>{data.count}</span>
                      </button>;
                    })}
                  </div>
                  {/* Mines table */}
                  {filteredMines.length===0
                    ?<div style={{padding:"24px 14px",textAlign:"center",fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,color:dk?"#4a5d75":"#8a95a3"}}>No data for {termCountry}</div>
                    :<table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr style={{borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)"}}>
                        {["#","MINE","COMPANY","PRIMARY","COUNTRY","TYPE",activeSortMode.l.toUpperCase()].map(h=>(
                          <th key={h} style={{padding:"6px 10px",textAlign:h===activeSortMode.l.toUpperCase()||h==="#"?"right":"left",fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,fontWeight:600,color:h===activeSortMode.l.toUpperCase()?"#e87d3e":(dk?"#4a5d75":"#6b7280"),letterSpacing:"0.06em"}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>{filteredMines.map((m,i)=>(
                        <tr key={m.name} style={{borderBottom:dk?"1px solid rgba(110,150,200,0.04)":"1px solid rgba(0,0,0,0.03)",cursor:"pointer",background:i%2===0?"transparent":(dk?"rgba(255,255,255,0.008)":"rgba(0,0,0,0.008)")}} onClick={()=>setProfileMine(m)}>
                          <td style={{padding:"6px 10px",fontFamily:"'SF Mono',Consolas,monospace",fontSize:10,color:dk?"#3d5166":"#ccc",textAlign:"right",width:28}}>{i+1}</td>
                          <td style={{padding:"6px 10px",fontSize:13,fontWeight:600}}><span style={{display:"inline-flex",alignItems:"center",gap:7}}><span style={{width:7,height:7,borderRadius:"50%",background:getCC(m.commodity),flexShrink:0,display:"block"}}/>{m.name}</span></td>
                          <td style={{padding:"6px 10px",fontSize:11,color:dk?"#6c8198":"#6b7280",fontFamily:"'SF Mono',Consolas,monospace"}}>{m.company.split("/")[0].trim()}</td>
                          <td style={{padding:"6px 10px",fontSize:11}}><span style={{padding:"2px 7px",borderRadius:3,background:getCC(m.commodity)+"22",color:getCC(m.commodity),fontWeight:600,fontSize:10,fontFamily:"'SF Mono',Consolas,monospace"}}>{m.commodity[0]}</span></td>
                          <td style={{padding:"6px 10px",fontSize:11,color:dk?"#6c8198":"#6b7280"}}>{m.country}</td>
                          <td style={{padding:"6px 10px",fontSize:10,color:dk?"#4a5d75":"#8a95a3",fontFamily:"'SF Mono',Consolas,monospace"}}>{m.type}</td>
                          <td style={{padding:"6px 10px",fontSize:12,fontFamily:"'SF Mono',Consolas,monospace",fontWeight:700,color:"#e87d3e",textAlign:"right"}}>{termSort==="rv_usd"?String(m.revenue||"—").replace("~",""):termSort==="em_count"?m.employees||"—":termSort==="dp_meters"?m.depth||"—":termSort==="rs_tonnes"?m.reserves||"—":m.opened?String(m.opened):"—"}</td>
                        </tr>
                      ))}</tbody>
                    </table>}
                </div>;
              })()}
            </div>
          )}


          {termTab==="prices"&&(()=>{
            const mono="'SF Mono',Consolas,monospace";
            const good="#62b289",bad="#d7634a",warn="#e6b94a";
            const fg=dk?"#e7eef7":"#1a1a2e",fg2=dk?"#a9b9cc":"#4a5568",fg3=dk?"#6c8198":"#6b7280",fg4=dk?"#4a5d75":"#8a95a3";
            const panel=dk?"#0f1b2c":"#fff",panel2=dk?"#13243a":"#f0f4f8";
            const hair=dk?"rgba(110,150,200,0.10)":"rgba(0,0,0,0.06)";
            const hair2=dk?"rgba(110,150,200,0.18)":"rgba(0,0,0,0.10)";

            // ── COMMODITY DATA ──
            const COMMS=[
              {id:"cu",name:"Copper",sym:"Cu",unit:"t",color:"#e8722a",price:9842,d1:1.24,d7:2.1,d30:3.8,exchange:"LME · 3M · USD/t",
               ohlc:{open:9720,high:9892,low:9684,vol:"184k lots",oi:"312k"},
               futures:[{t:"Cash",p:9822,v:0},{t:"3M",p:9867,v:0.5},{t:"6M",p:9912,v:1.0},{t:"9M",p:9957,v:1.5},{t:"12M",p:10002,v:2.0},{t:"15M",p:10047,v:2.5},{t:"18M",p:10092,v:3.0},{t:"21M",p:10137,v:3.5},{t:"24M",p:10182,v:4.0},{t:"27M",p:10227,v:4.5}],
               stats:{avg90:9634,sigma:18.4,hi52:10124,lo52:8210,sharpe:0.84,betaDxy:-0.61},
               correlations:[{s:"Au",r:0.42},{s:"Fe",r:0.71},{s:"Ni",r:0.83},{s:"Zn",r:0.68},{s:"DXY",r:-0.61},{s:"SPX",r:0.34}],
               series:[9188,9210,9195,9240,9260,9300,9280,9320,9350,9380,9410,9390,9440,9460,9500,9480,9520,9560,9580,9620,9660,9700,9680,9720,9760,9800,9780,9820,9842,9830,9810,9780,9760,9740,9720,9700,9680,9660,9640,9620,9600,9580,9560,9540,9520,9500,9480,9500,9520,9540,9560,9580,9600,9620,9640,9660,9680,9700,9720,9740,9760,9780,9800,9820,9840,9860,9842],
               annotations:[{idx:18,label:"BHP guides up"},{idx:35,label:"Codelco strike"},{idx:52,label:"China stim."}],
               equities:[{name:"BHP Group",ticker:"BHP",ccy:"A$",price:42.80,d1:0.8,d30:3.2,mcap:"168B",series:[40,40.5,41,40.8,41.2,41.5,41.3,41.8,42,42.3,42.5,42.2,42.5,42.8,42.6,42.9,43.1,43,42.8,42.5,42.7,42.9,43.2,43,42.8,42.5,42.7,42.9,43,42.8]},{name:"Glencore",ticker:"GLEN",ccy:"£",price:4.12,d1:-0.4,d30:-1.8,mcap:"55B",series:[4.3,4.28,4.25,4.22,4.2,4.18,4.15,4.12,4.1,4.08,4.1,4.12,4.15,4.18,4.2,4.18,4.15,4.12,4.1,4.08,4.1,4.12,4.15,4.18,4.2,4.15,4.12,4.1,4.12,4.12]},{name:"Anglo American",ticker:"AAL",ccy:"£",price:24.80,d1:-0.2,d30:-4.1,mcap:"32B",series:[26,25.8,25.5,25.2,25,24.8,24.5,24.2,24,23.8,24,24.2,24.5,24.8,25,24.8,24.5,24.2,24,23.8,24,24.2,24.5,24.8,25,24.8,24.5,24.2,24.5,24.8]},{name:"Freeport-McMoRan",ticker:"FCX",ccy:"$",price:44.60,d1:1.8,d30:6.2,mcap:"64B",series:[40,40.5,41,41.5,42,42.5,43,43.5,44,44.5,45,44.8,44.5,44.2,44,44.2,44.5,44.8,45,45.2,45.5,45.3,45,44.8,44.5,44.2,44,44.2,44.5,44.6]}]},
              {id:"au",name:"Gold",sym:"Au",unit:"oz",color:"#f5c518",price:2418,d1:0.42,d7:1.1,d30:5.2,exchange:"COMEX · Spot · USD/oz",
               ohlc:{open:2408,high:2435,low:2402,vol:"42k lots",oi:"520k"},
               futures:[{t:"Cash",p:2418,v:0},{t:"3M",p:2438,v:0.8},{t:"6M",p:2458,v:1.6},{t:"9M",p:2478,v:2.5},{t:"12M",p:2498,v:3.3},{t:"15M",p:2518,v:4.1},{t:"18M",p:2538,v:4.9},{t:"21M",p:2558,v:5.8},{t:"24M",p:2578,v:6.6},{t:"27M",p:2598,v:7.4}],
               stats:{avg90:2380,sigma:12.4,hi52:2431,lo52:1984,sharpe:1.24,betaDxy:-0.74},
               correlations:[{s:"Cu",r:0.42},{s:"Ag",r:0.88},{s:"Pt",r:0.62},{s:"DXY",r:-0.74},{s:"SPX",r:-0.22},{s:"10Y",r:-0.68}],
               series:[1984,2010,2040,2020,2060,2080,2100,2090,2120,2140,2160,2150,2180,2200,2220,2210,2240,2260,2280,2270,2300,2320,2340,2330,2360,2380,2390,2400,2410,2420,2400,2380,2360,2380,2400,2410,2420,2418],
               annotations:[{idx:12,label:"Fed pivot signal"},{idx:24,label:"Geopolitical bid"},{idx:34,label:"ETF inflows"}],
               equities:[{name:"Newmont",ticker:"NEM",ccy:"$",price:38.15,d1:0.7,d30:4.1,mcap:"48B",series:[35,35.5,36,36.5,37,37.5,37,36.5,37,37.5,38,37.8,37.5,37.8,38,38.2,38.5,38.3,38,37.8,38,38.2,38.5,38.8,38.5,38.2,38,38.2,38.4,38.15]},{name:"Barrick Gold",ticker:"ABX",ccy:"$",price:18.42,d1:0.3,d30:2.8,mcap:"32B",series:[17,17.2,17.4,17.6,17.8,18,17.8,17.5,17.8,18,18.2,18,17.8,18,18.2,18.4,18.6,18.4,18.2,18,18.2,18.4,18.6,18.8,18.6,18.4,18.2,18.4,18.6,18.42]},{name:"Agnico Eagle",ticker:"AEM",ccy:"$",price:72.80,d1:0.5,d30:3.4,mcap:"36B",series:[68,69,70,70.5,71,71.5,71,70.5,71,71.5,72,71.8,71.5,71.8,72,72.2,72.5,72.3,72,71.8,72,72.2,72.5,72.8,72.5,72.2,72,72.2,72.5,72.8]},{name:"AngloGold Ashanti",ticker:"AU",ccy:"$",price:26.40,d1:0.4,d30:2.1,mcap:"11B",series:[24,24.5,25,25.2,25.5,25.8,25.5,25.2,25.5,25.8,26,25.8,25.5,25.8,26,26.2,26.5,26.3,26,25.8,26,26.2,26.5,26.8,26.5,26.2,26,26.2,26.4,26.4]}]},
              {id:"fe",name:"Iron Ore",sym:"Fe",unit:"t",color:"#e03020",price:102.4,d1:-0.85,d7:-2.1,d30:-8.4,exchange:"SGX · 62% Fe · USD/t",
               ohlc:{open:103.2,high:103.8,low:101.8,vol:"28k lots",oi:"180k"},
               futures:[{t:"Cash",p:102.4,v:0},{t:"3M",p:100.8,v:-1.6},{t:"6M",p:99.2,v:-3.1},{t:"9M",p:97.8,v:-4.5},{t:"12M",p:96.4,v:-5.9},{t:"15M",p:95.2,v:-7.0},{t:"18M",p:94.0,v:-8.2},{t:"21M",p:92.8,v:-9.4},{t:"24M",p:91.8,v:-10.3},{t:"27M",p:90.8,v:-11.3}],
               stats:{avg90:108.2,sigma:22.1,hi52:142.8,lo52:98.4,sharpe:-0.42,betaDxy:-0.38},
               correlations:[{s:"Cu",r:0.71},{s:"Ni",r:0.62},{s:"CNY",r:0.54},{s:"DXY",r:-0.38},{s:"SPX",r:0.28},{s:"10Y",r:-0.22}],
               series:[142,138,134,130,126,122,120,118,115,112,110,108,115,112,108,104,108,112,108,104,100,104,108,112,108,104,100,104,102.4],
               annotations:[{idx:8,label:"China PMI miss"},{idx:18,label:"Vale guidance"},{idx:24,label:"Stimulus boost"}],
               equities:[{name:"BHP Group",ticker:"BHP",ccy:"A$",price:42.80,d1:0.8,d30:3.2,mcap:"168B",series:[40,40.5,41,40.8,41.2,41.5,41.3,41.8,42,42.3,42.5,42.2,42.5,42.8,42.6,42.9,43.1,43,42.8,42.5,42.7,42.9,43.2,43,42.8,42.5,42.7,42.9,43,42.8]},{name:"Rio Tinto",ticker:"RIO",ccy:"£",price:52.40,d1:-0.3,d30:-2.8,mcap:"84B",series:[56,55.5,55,54.5,54,53.5,53,52.5,52,51.5,52,52.5,53,53.5,53,52.5,52,51.5,52,52.5,53,52.8,52.5,52.2,52,51.8,52,52.2,52.5,52.4]},{name:"Vale",ticker:"VALE",ccy:"$",price:10.82,d1:-0.6,d30:-4.2,mcap:"47B",series:[12,11.8,11.6,11.4,11.2,11,10.8,10.6,10.8,11,11.2,11,10.8,10.6,10.8,11,11.2,11,10.8,10.6,10.8,11,10.9,10.8,10.7,10.8,10.9,10.8,10.82,10.82]},{name:"Fortescue",ticker:"FMG",ccy:"A$",price:19.42,d1:-1.2,d30:-6.8,mcap:"59B",series:[22,21.5,21,20.5,20,19.5,19,19.5,20,20.5,20,19.5,19,18.5,19,19.5,20,19.8,19.5,19.2,19,18.8,19,19.2,19.5,19.8,19.5,19.2,19,19.42]}]},
              {id:"li",name:"Lithium",sym:"Li",unit:"t",color:"#22aaff",price:14250,d1:2.18,d7:4.2,d30:8.6,exchange:"Spot · SC6 · USD/t",
               ohlc:{open:13950,high:14380,low:13820,vol:"n/a",oi:"n/a"},
               futures:[{t:"Cash",p:14250,v:0},{t:"3M",p:14500,v:1.8},{t:"6M",p:14800,v:3.9},{t:"9M",p:15100,v:6.0},{t:"12M",p:15400,v:8.1},{t:"15M",p:15700,v:10.2},{t:"18M",p:16000,v:12.3},{t:"21M",p:16300,v:14.4},{t:"24M",p:16500,v:15.8},{t:"27M",p:16800,v:17.9}],
               stats:{avg90:12800,sigma:38.4,hi52:18400,lo52:6200,sharpe:0.62,betaDxy:-0.28},
               correlations:[{s:"Co",r:0.72},{s:"Ni",r:0.58},{s:"Cu",r:0.44},{s:"EV sales",r:0.84},{s:"DXY",r:-0.28},{s:"SPX",r:0.42}],
               series:[6200,6800,7400,8000,8600,9200,9800,10400,11000,11600,12200,11800,12400,13000,12600,13200,13800,13400,14000,13600,14200,13800,14400,14000,14200,14100,14250],
               annotations:[{idx:8,label:"BYD orders surge"},{idx:18,label:"Chile permit delays"},{idx:22,label:"CATL expansion"}],
               equities:[{name:"Pilbara Minerals",ticker:"PLS",ccy:"A$",price:2.84,d1:2.4,d30:8.2,mcap:"8.5B",series:[2.2,2.3,2.25,2.35,2.4,2.45,2.5,2.55,2.6,2.65,2.7,2.65,2.7,2.75,2.8,2.75,2.7,2.75,2.8,2.75,2.7,2.75,2.8,2.85,2.82,2.78,2.8,2.82,2.84,2.84]},{name:"Albemarle",ticker:"ALB",ccy:"$",price:82.40,d1:1.8,d30:6.4,mcap:"9.8B",series:[72,74,76,75,77,79,78,80,82,81,83,82,80,82,83,82,80,82,84,83,82,81,82,83,82,81,82,83,82.4,82.4]},{name:"SQM",ticker:"SQM",ccy:"$",price:42.80,d1:1.4,d30:5.8,mcap:"11.4B",series:[38,39,40,39.5,40.5,41,41.5,42,42.5,43,42.5,42,42.5,43,42.8,42.5,42,42.5,43,42.8,42.5,42,42.5,43,42.8,42.5,42,42.5,42.8,42.8]},{name:"Liontown Resources",ticker:"LTR",ccy:"A$",price:0.92,d1:3.2,d30:12.4,mcap:"2.2B",series:[0.7,0.72,0.74,0.73,0.75,0.77,0.78,0.8,0.82,0.84,0.86,0.84,0.86,0.88,0.87,0.86,0.88,0.9,0.89,0.88,0.9,0.91,0.9,0.88,0.9,0.91,0.9,0.91,0.92,0.92]}]},
              {id:"ni",name:"Nickel",sym:"Ni",unit:"t",color:"#22c97a",price:18420,d1:-0.32,d7:-1.8,d30:-4.2,exchange:"LME · 3M · USD/t",
               ohlc:{open:18480,high:18620,low:18380,vol:"12k lots",oi:"98k"},
               futures:[{t:"Cash",p:18420,v:0},{t:"3M",p:18380,v:-0.2},{t:"6M",p:18340,v:-0.4},{t:"9M",p:18300,v:-0.7},{t:"12M",p:18260,v:-0.9},{t:"15M",p:18220,v:-1.1},{t:"18M",p:18180,v:-1.3},{t:"21M",p:18140,v:-1.5},{t:"24M",p:18100,v:-1.7},{t:"27M",p:18060,v:-1.9}],
               stats:{avg90:19200,sigma:24.8,hi52:24800,lo52:16400,sharpe:-0.38,betaDxy:-0.42},
               correlations:[{s:"Cu",r:0.83},{s:"Co",r:0.78},{s:"Li",r:0.58},{s:"EV battery",r:0.72},{s:"DXY",r:-0.42},{s:"SPX",r:0.38}],
               series:[24800,24000,23200,22400,21600,20800,20000,19200,18400,19200,20000,19200,18400,17600,16400,17200,18000,18800,18000,17200,18000,18800,18420],
               annotations:[{idx:10,label:"Indonesia supply"},{idx:16,label:"BHP mothball risk"},{idx:20,label:"EV demand revision"}],
               equities:[{name:"Norilsk Nickel",ticker:"GMKN",ccy:"$",price:142.0,d1:-0.8,d30:-3.2,mcap:"22B",series:[155,152,149,146,143,140,143,146,143,140,137,140,143,146,143,140,143,146,143,140,141,142,143,142,141,140,141,142,142,142]},{name:"BHP Group",ticker:"BHP",ccy:"A$",price:42.80,d1:0.8,d30:3.2,mcap:"168B",series:[40,40.5,41,40.8,41.2,41.5,41.3,41.8,42,42.3,42.5,42.2,42.5,42.8,42.6,42.9,43.1,43,42.8,42.5,42.7,42.9,43.2,43,42.8,42.5,42.7,42.9,43,42.8]},{name:"Vale",ticker:"VALE",ccy:"$",price:10.82,d1:-0.6,d30:-4.2,mcap:"47B",series:[12,11.8,11.6,11.4,11.2,11,10.8,10.6,10.8,11,11.2,11,10.8,10.6,10.8,11,11.2,11,10.8,10.6,10.8,11,10.9,10.8,10.7,10.8,10.9,10.8,10.82,10.82]},{name:"Wyloo Metals",ticker:"WYL",ccy:"A$",price:0.48,d1:-1.2,d30:-5.8,mcap:"0.8B",series:[0.56,0.54,0.52,0.51,0.5,0.49,0.48,0.47,0.46,0.48,0.5,0.49,0.48,0.47,0.48,0.49,0.5,0.49,0.48,0.47,0.46,0.47,0.48,0.49,0.48,0.47,0.48,0.49,0.48,0.48]}]},
              {id:"zn",name:"Zinc",sym:"Zn",unit:"t",color:"#5ba3f5",price:2912,d1:0.18,d7:0.8,d30:2.4,exchange:"LME · 3M · USD/t",ohlc:{open:2906,high:2928,low:2898,vol:"8k lots",oi:"74k"},futures:[{t:"Cash",p:2912,v:0},{t:"3M",p:2934,v:0.8},{t:"6M",p:2956,v:1.5},{t:"9M",p:2978,v:2.3},{t:"12M",p:3000,v:3.0},{t:"15M",p:3022,v:3.8},{t:"18M",p:3044,v:4.5},{t:"21M",p:3066,v:5.3},{t:"24M",p:3088,v:6.0},{t:"27M",p:3110,v:6.8}],stats:{avg90:2850,sigma:16.2,hi52:3180,lo52:2420,sharpe:0.58,betaDxy:-0.44},correlations:[{s:"Cu",r:0.68},{s:"Pb",r:0.82},{s:"Fe",r:0.44},{s:"DXY",r:-0.44},{s:"SPX",r:0.32},{s:"10Y",r:-0.18}],series:[2420,2480,2520,2500,2560,2600,2580,2640,2680,2660,2720,2760,2740,2800,2840,2820,2860,2900,2880,2912],annotations:[{idx:8,label:"Teck guidance"},{idx:14,label:"Mine closures"},{idx:18,label:"Demand recovery"}],equities:[{name:"Glencore",ticker:"GLEN",ccy:"£",price:4.12,d1:-0.4,d30:-1.8,mcap:"55B",series:[4.3,4.28,4.25,4.22,4.2,4.18,4.15,4.12,4.1,4.08,4.1,4.12,4.15,4.18,4.2,4.18,4.15,4.12,4.1,4.08,4.1,4.12,4.15,4.18,4.2,4.15,4.12,4.1,4.12,4.12]},{name:"Teck Resources",ticker:"TECK",ccy:"$",price:42.80,d1:0.4,d30:2.8,mcap:"22B",series:[40,40.5,41,40.8,41.2,41.5,41.3,41.8,42,42.3,42.5,42.2,42.5,42.8,42.6,42.9,43.1,43,42.8,42.5,42.7,42.9,43.2,43,42.8,42.5,42.7,42.9,43,42.8]},{name:"South32",ticker:"S32",ccy:"A$",price:3.48,d1:0.6,d30:3.2,mcap:"18B",series:[3.2,3.22,3.24,3.26,3.28,3.3,3.32,3.34,3.36,3.38,3.4,3.38,3.4,3.42,3.44,3.42,3.44,3.46,3.44,3.42,3.44,3.46,3.48,3.46,3.44,3.42,3.44,3.46,3.48,3.48]}]},
              {id:"co",name:"Cobalt",sym:"Co",unit:"t",color:"#3b6ff5",price:27880,d1:0.92,d7:1.8,d30:4.2,exchange:"LME · Cash · USD/t",ohlc:{open:27620,high:28100,low:27480,vol:"2k lots",oi:"18k"},futures:[{t:"Cash",p:27880,v:0},{t:"3M",p:28200,v:1.1},{t:"6M",p:28520,v:2.3},{t:"9M",p:28840,v:3.4},{t:"12M",p:29160,v:4.6},{t:"15M",p:29480,v:5.7},{t:"18M",p:29800,v:6.9},{t:"21M",p:30120,v:8.0},{t:"24M",p:30440,v:9.2},{t:"27M",p:30760,v:10.3}],stats:{avg90:26400,sigma:28.4,hi52:34800,lo52:22400,sharpe:0.44,betaDxy:-0.32},correlations:[{s:"Ni",r:0.78},{s:"Li",r:0.72},{s:"Cu",r:0.54},{s:"EV battery",r:0.82},{s:"DXY",r:-0.32},{s:"SPX",r:0.44}],series:[22400,23200,24000,23600,24400,25200,26000,25600,26400,27200,28000,27600,28400,27880],annotations:[{idx:6,label:"DRC royalty review"},{idx:10,label:"LFP battery shift"},{idx:12,label:"Glencore guidance"}],equities:[{name:"Glencore",ticker:"GLEN",ccy:"£",price:4.12,d1:-0.4,d30:-1.8,mcap:"55B",series:[4.3,4.28,4.25,4.22,4.2,4.18,4.15,4.12,4.1,4.08,4.1,4.12,4.15,4.18,4.2,4.18,4.15,4.12,4.1,4.08,4.1,4.12,4.15,4.18,4.2,4.15,4.12,4.1,4.12,4.12]},{name:"Ivanhoe Mines",ticker:"IVN",ccy:"$",price:22.87,d1:3.2,d30:8.4,mcap:"20B",series:[19,19.5,20,20.5,21,21.5,22,21.8,21.5,21.8,22,22.2,22.5,22.8,22.5,22.2,22,22.2,22.5,22.8,23,22.8,22.5,22.2,22.5,22.8,22.5,22.2,22.5,22.87]}]},
              {id:"pt",name:"Platinum",sym:"Pt",unit:"oz",color:"#e8e8f5",price:1042,d1:-0.12,d7:-0.4,d30:-1.8,exchange:"NYMEX · Spot · USD/oz",ohlc:{open:1044,high:1052,low:1036,vol:"5k lots",oi:"42k"},futures:[{t:"Cash",p:1042,v:0},{t:"3M",p:1048,v:0.6},{t:"6M",p:1054,v:1.2},{t:"9M",p:1060,v:1.7},{t:"12M",p:1066,v:2.3},{t:"15M",p:1072,v:2.9},{t:"18M",p:1078,v:3.5},{t:"21M",p:1084,v:4.0},{t:"24M",p:1090,v:4.6},{t:"27M",p:1096,v:5.2}],stats:{avg90:1058,sigma:14.2,hi52:1124,lo52:868,sharpe:-0.22,betaDxy:-0.54},correlations:[{s:"Au",r:0.62},{s:"Pd",r:0.88},{s:"Cu",r:0.48},{s:"DXY",r:-0.54},{s:"SPX",r:0.28},{s:"10Y",r:-0.42}],series:[868,900,920,910,940,960,980,970,1000,1020,1040,1030,1050,1060,1050,1042],annotations:[{idx:6,label:"SA supply risk"},{idx:12,label:"Hydrogen catalyst"},{idx:14,label:"Auto demand"}],equities:[{name:"Anglo American Platinum",ticker:"AMS",ccy:"R",price:842,d1:-0.3,d30:-2.4,mcap:"22B",series:[880,874,868,862,856,850,856,862,856,850,844,850,856,862,856,850,844,850,856,842]},{name:"Sibanye Stillwater",ticker:"SSW",ccy:"R",price:18.42,d1:-0.8,d30:-4.2,mcap:"8B",series:[21,20.5,20,19.5,19,18.5,19,18.5,18,18.5,19,18.5,18,17.5,18,18.5,19,18.5,18.2,18.42]}]},
              {id:"ag",name:"Silver",sym:"Ag",unit:"oz",color:"#d0dce8",price:31.42,d1:0.84,d7:2.1,d30:6.4,exchange:"COMEX · Spot · USD/oz",ohlc:{open:31.15,high:31.68,low:30.98,vol:"62k lots",oi:"188k"},futures:[{t:"Cash",p:31.42,v:0},{t:"3M",p:31.80,v:1.2},{t:"6M",p:32.18,v:2.4},{t:"9M",p:32.56,v:3.6},{t:"12M",p:32.94,v:4.8},{t:"15M",p:33.32,v:6.1},{t:"18M",p:33.70,v:7.3},{t:"21M",p:34.08,v:8.5},{t:"24M",p:34.46,v:9.7},{t:"27M",p:34.84,v:10.9}],stats:{avg90:28.80,sigma:22.4,hi52:34.20,lo52:22.40,sharpe:0.74,betaDxy:-0.68},correlations:[{s:"Au",r:0.88},{s:"Cu",r:0.64},{s:"Pt",r:0.62},{s:"DXY",r:-0.68},{s:"SPX",r:0.18},{s:"10Y",r:-0.58}],series:[22.4,23.2,24.0,23.6,24.4,25.2,26.0,25.6,26.4,27.2,28.0,28.8,29.6,30.4,31.2,30.8,31.4,31.0,31.4,31.42],annotations:[{idx:8,label:"Solar demand"},{idx:14,label:"Fed signals"},{idx:18,label:"Industry supply deficit"}],equities:[{name:"Pan American Silver",ticker:"PAAS",ccy:"$",price:18.42,d1:0.6,d30:4.8,mcap:"5.8B",series:[16,16.5,17,17.5,18,17.8,17.5,17.8,18,18.2,18.5,18.3,18,18.2,18.4,18.42]},{name:"First Majestic Silver",ticker:"AG",ccy:"$",price:8.84,d1:1.2,d30:6.2,mcap:"2.1B",series:[7.5,7.7,7.9,8.1,8.3,8.1,7.9,8.1,8.3,8.5,8.7,8.5,8.3,8.5,8.7,8.84]},{name:"Wheaton Precious",ticker:"WPM",ccy:"$",price:54.80,d1:0.4,d30:3.2,mcap:"24.8B",series:[50,51,52,51.5,52.5,53,52.5,52,52.5,53,53.5,53,52.5,53,53.5,54,54.5,54.8,54.8,54.8]}]},
              {id:"u",name:"Uranium",sym:"U₃O₈",unit:"lb",color:"#7deb3a",price:84.50,d1:1.42,d7:3.2,d30:8.4,exchange:"UxC · Spot · USD/lb",ohlc:{open:83.20,high:85.40,low:82.80,vol:"n/a",oi:"n/a"},futures:[{t:"Cash",p:84.5,v:0},{t:"3M",p:86.0,v:1.8},{t:"6M",p:87.5,v:3.6},{t:"9M",p:89.0,v:5.3},{t:"12M",p:90.5,v:7.1},{t:"15M",p:92.0,v:8.9},{t:"18M",p:93.5,v:10.7},{t:"21M",p:95.0,v:12.4},{t:"24M",p:96.5,v:14.2},{t:"27M",p:98.0,v:16.0}],stats:{avg90:78.4,sigma:32.8,hi52:106.4,lo52:48.8,sharpe:0.88,betaDxy:-0.18},correlations:[{s:"Coal",r:-0.42},{s:"NatGas",r:-0.38},{s:"Li",r:0.28},{s:"DXY",r:-0.18},{s:"SPX",r:0.24},{s:"10Y",r:0.18}],series:[48.8,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,106.4,100,94,88,82,80,82,84,84.5],annotations:[{idx:10,label:"Kazatomprom cuts"},{idx:16,label:"NuScale SMR approval"},{idx:20,label:"EU taxonomy"}],equities:[{name:"Cameco",ticker:"CCJ",ccy:"$",price:48.42,d1:1.8,d30:6.8,mcap:"21B",series:[40,41,42,43,44,45,46,45,46,47,48,47,46,47,48,48.4,48.42]},{name:"Uranium Energy",ticker:"UEC",ccy:"$",price:8.84,d1:2.4,d30:9.2,mcap:"3.2B",series:[7,7.2,7.4,7.6,7.8,8,7.8,8,8.2,8.4,8.6,8.4,8.2,8.4,8.6,8.8,8.84]},{name:"Boss Energy",ticker:"BOE",ccy:"A$",price:2.84,d1:2.1,d30:8.4,mcap:"1.2B",series:[2.2,2.3,2.4,2.5,2.6,2.7,2.65,2.7,2.75,2.8,2.84,2.82,2.8,2.82,2.84,2.84,2.84]}]},
              {id:"al",name:"Bauxite",sym:"Al₂O₃",unit:"t",color:"#e08830",price:64.20,d1:0.04,d7:0.2,d30:0.8,exchange:"Spot · Ref · USD/t",ohlc:{open:64.10,high:64.40,low:63.80,vol:"n/a",oi:"n/a"},futures:[{t:"Cash",p:64.2,v:0},{t:"3M",p:64.8,v:0.9},{t:"6M",p:65.4,v:1.9},{t:"9M",p:66.0,v:2.8},{t:"12M",p:66.6,v:3.7},{t:"15M",p:67.2,v:4.7},{t:"18M",p:67.8,v:5.6},{t:"21M",p:68.4,v:6.5},{t:"24M",p:69.0,v:7.5},{t:"27M",p:69.6,v:8.4}],stats:{avg90:62.8,sigma:8.4,hi52:68.4,lo52:56.2,sharpe:0.28,betaDxy:-0.22},correlations:[{s:"Fe",r:0.44},{s:"Cu",r:0.38},{s:"DXY",r:-0.22},{s:"SPX",r:0.18},{s:"CNY",r:0.42},{s:"10Y",r:-0.12}],series:[56.2,57,58,59,60,61,62,61.5,62.5,63,63.5,63,63.5,64,63.5,64,64.5,64.2],annotations:[{idx:6,label:"Guinea supply"},{idx:12,label:"China refinery cuts"},{idx:16,label:"Alcoa guidance"}],equities:[{name:"Rio Tinto",ticker:"RIO",ccy:"£",price:52.40,d1:-0.3,d30:-2.8,mcap:"84B",series:[56,55.5,55,54.5,54,53.5,53,52.5,52,51.5,52,52.5,53,53.5,53,52.5,52,52.4]},{name:"Alcoa",ticker:"AA",ccy:"$",price:28.40,d1:0.2,d30:1.4,mcap:"5.2B",series:[26,26.5,27,27.5,28,27.8,27.5,27.8,28,28.2,28.4,28.2,28,28.2,28.4,28.4,28.4,28.4]}]},
              {id:"sn",name:"Tin",sym:"Sn",unit:"t",color:"#60c0f0",price:32420,d1:-0.62,d7:-1.4,d30:-3.8,exchange:"LME · 3M · USD/t",ohlc:{open:32600,high:32800,low:32200,vol:"1k lots",oi:"8k"},futures:[{t:"Cash",p:32420,v:0},{t:"3M",p:32200,v:-0.7},{t:"6M",p:31980,v:-1.4},{t:"9M",p:31760,v:-2.0},{t:"12M",p:31540,v:-2.7},{t:"15M",p:31320,v:-3.4},{t:"18M",p:31100,v:-4.1},{t:"21M",p:30880,v:-4.8},{t:"24M",p:30660,v:-5.4},{t:"27M",p:30440,v:-6.1}],stats:{avg90:33800,sigma:22.4,hi52:38400,lo52:22800,sharpe:-0.28,betaDxy:-0.38},correlations:[{s:"Cu",r:0.64},{s:"Ag",r:0.44},{s:"Electronics",r:0.72},{s:"DXY",r:-0.38},{s:"SPX",r:0.28},{s:"10Y",r:-0.22}],series:[22800,24000,26000,28000,30000,32000,34000,36000,38400,36000,34000,32000,34000,32420],annotations:[{idx:8,label:"Myanmar supply crisis"},{idx:12,label:"Semiconductor demand"},{idx:13,label:"Alphamin guidance"}],equities:[{name:"Alphamin Resources",ticker:"AFM",ccy:"$",price:0.62,d1:-0.8,d30:-3.2,mcap:"0.9B",series:[0.68,0.66,0.64,0.63,0.62,0.63,0.64,0.63,0.62,0.61,0.62,0.63,0.62,0.62]},{name:"Metals X",ticker:"MLX",ccy:"A$",price:0.48,d1:-0.4,d30:-2.4,mcap:"0.4B",series:[0.52,0.51,0.50,0.49,0.48,0.49,0.50,0.49,0.48,0.47,0.48,0.49,0.48,0.48]}]},
              {id:"mn",name:"Manganese",sym:"Mn",unit:"t",color:"#e030c0",price:4280,d1:0.24,d7:0.8,d30:2.4,exchange:"Spot · 44% Mn · USD/t",ohlc:{open:4270,high:4300,low:4260,vol:"n/a",oi:"n/a"},futures:[{t:"Cash",p:4280,v:0},{t:"3M",p:4320,v:0.9},{t:"6M",p:4360,v:1.9},{t:"9M",p:4400,v:2.8},{t:"12M",p:4440,v:3.7},{t:"15M",p:4480,v:4.7},{t:"18M",p:4520,v:5.6},{t:"21M",p:4560,v:6.5},{t:"24M",p:4600,v:7.5},{t:"27M",p:4640,v:8.4}],stats:{avg90:4180,sigma:12.4,hi52:4680,lo52:3420,sharpe:0.48,betaDxy:-0.28},correlations:[{s:"Fe",r:0.64},{s:"Ni",r:0.48},{s:"EV battery",r:0.68},{s:"DXY",r:-0.28},{s:"SPX",r:0.22},{s:"10Y",r:-0.14}],series:[3420,3520,3620,3720,3820,3920,4020,4120,4220,4280],annotations:[{idx:4,label:"South Africa supply"},{idx:7,label:"Battery demand"},{idx:9,label:"NCMA adoption"}],equities:[{name:"South32",ticker:"S32",ccy:"A$",price:3.48,d1:0.6,d30:3.2,mcap:"18B",series:[3.2,3.25,3.3,3.35,3.4,3.38,3.4,3.42,3.44,3.48]},{name:"Eramet",ticker:"ERA",ccy:"€",price:68.4,d1:0.4,d30:2.8,mcap:"1.4B",series:[64,65,66,67,68,67.5,68,68.2,68.4,68.4]}]},
              {id:"k",name:"Potash",sym:"K₂O",unit:"t",color:"#f060c8",price:312,d1:-0.18,d7:-0.6,d30:-2.1,exchange:"Spot · MOP · USD/t",ohlc:{open:313,high:315,low:310,vol:"n/a",oi:"n/a"},futures:[{t:"Cash",p:312,v:0},{t:"3M",p:308,v:-1.3},{t:"6M",p:304,v:-2.6},{t:"9M",p:300,v:-3.8},{t:"12M",p:296,v:-5.1},{t:"15M",p:292,v:-6.4},{t:"18M",p:288,v:-7.7},{t:"21M",p:284,v:-9.0},{t:"24M",p:280,v:-10.3},{t:"27M",p:276,v:-11.5}],stats:{avg90:322,sigma:14.2,hi52:368,lo52:288,sharpe:-0.44,betaDxy:-0.24},correlations:[{s:"NatGas",r:0.42},{s:"Grains",r:0.68},{s:"USD/BRL",r:-0.48},{s:"DXY",r:-0.24},{s:"SPX",r:0.14},{s:"10Y",r:-0.08}],series:[368,360,352,344,336,328,320,328,320,312,320,312,312],annotations:[{idx:4,label:"Belarusian sanctions"},{idx:8,label:"K+S guidance"},{idx:12,label:"Brazil demand"}],equities:[{name:"Nutrien",ticker:"NTR",ccy:"$",price:52.80,d1:-0.2,d30:-1.4,mcap:"28B",series:[56,55,54,53,52,53,54,53,52,53,54,53,52.8]},{name:"K+S AG",ticker:"SDF",ccy:"€",price:14.20,d1:-0.4,d30:-2.8,mcap:"2.6B",series:[16,15.5,15,14.5,14,14.5,15,14.5,14,14.5,15,14.5,14.2]}]},
              {id:"cl",name:"Coal (Met)",sym:"HCC",unit:"t",color:"#8896a8",price:218,d1:-0.42,d7:-1.2,d30:-4.8,exchange:"SGX · Aus HCC · USD/t",ohlc:{open:219,high:221,low:216,vol:"6k lots",oi:"38k"},futures:[{t:"Cash",p:218,v:0},{t:"3M",p:214,v:-1.8},{t:"6M",p:210,v:-3.7},{t:"9M",p:206,v:-5.5},{t:"12M",p:202,v:-7.3},{t:"15M",p:198,v:-9.2},{t:"18M",p:194,v:-11.0},{t:"21M",p:190,v:-12.8},{t:"24M",p:186,v:-14.7},{t:"27M",p:182,v:-16.5}],stats:{avg90:228,sigma:18.4,hi52:284,lo52:198,sharpe:-0.42,betaDxy:-0.28},correlations:[{s:"Fe",r:0.62},{s:"LNG",r:0.48},{s:"AU/USD",r:0.44},{s:"DXY",r:-0.28},{s:"SPX",r:0.18},{s:"10Y",r:-0.14}],series:[284,276,268,260,252,244,236,228,240,232,224,228,240,232,228,218],annotations:[{idx:6,label:"China demand"},{idx:10,label:"Cyclone impact"},{idx:14,label:"India imports"}],equities:[{name:"BHP Group",ticker:"BHP",ccy:"A$",price:42.80,d1:0.8,d30:3.2,mcap:"168B",series:[40,40.5,41,40.8,41.2,41.5,41.3,41.8,42,42.3,42.5,42.2,42.5,42.8,42.6,42.8]},{name:"Teck Resources",ticker:"TECK",ccy:"$",price:42.80,d1:0.4,d30:2.8,mcap:"22B",series:[40,40.5,41,40.8,41.2,41.5,41.3,41.8,42,42.3,42.5,42.2,42.5,42.8,42.8]}]},
            ];

            const NEWS_DATA=[
              {id:"n1",src:"REUT",t:0,txt:"BHP lifts FY26 copper guidance after Escondida throughput record",tags:["Cu","BHP"],imp:"high"},
              {id:"n2",src:"BBG",t:60,txt:"Freeport-McMoRan reports Grasberg block cave milestone, costs in line",tags:["Cu","FCX"],imp:"med"},
              {id:"n3",src:"WSJ",t:180,txt:"DRC reviews mining royalty regime; Kamoa-Kakula impact under study",tags:["Co","Cu","IVN"],imp:"high"},
              {id:"n4",src:"MJ",t:38,txt:"Lithium prices rally on China stimulus and Chile permitting delays",tags:["Li","PLS"],imp:"high"},
              {id:"n5",src:"BBG",t:124,txt:"Iron ore drops 1.4% as China steel output cuts deepen",tags:["Fe","RIO","VALE"],imp:"med"},
              {id:"n6",src:"AFR",t:398,txt:"BHP Nickel West review deepens; mothball scenario now base case",tags:["Ni","BHP"],imp:"high"},
              {id:"n7",src:"REUT",t:71,txt:"Rio Tinto Jadar permitting paused pending Serbian environmental review",tags:["Li","RIO"],imp:"high"},
              {id:"n8",src:"MJ",t:52,txt:"Simandou rail commissioning enters final phase, first ore Q4",tags:["Fe"],imp:"med"},
              {id:"n9",src:"REUT",t:14,txt:"Uranium spot market tightens as Kazatomprom output guidance cut 17%",tags:["U₃O₈","CCJ"],imp:"high"},
              {id:"n10",src:"BBG",t:246,txt:"Gold ETF inflows hit 18-month high on Fed pivot expectations",tags:["Au","NEM","ABX"],imp:"med"},
            ];

            // Apply live prices where available, fall back to synthetic
            const COMMS_LIVE=COMMS.map(c=>({
              ...c,
              price:getLivePrice(c.id,c.price),
              equities:(c.equities||[]).map(e=>({
                ...e,
                price:liveEquities[e.ticker]?.price||e.price,
                d1:liveEquities[e.ticker]?.d1??e.d1,
              })),
            }));
            const sel=COMMS_LIVE.find(c=>c.id===selCom)||COMMS_LIVE[0];
            const fmtP=p=>p>=10000?p.toLocaleString():(p>=100?p.toFixed(1):p.toFixed(2));
            const fmtPct=v=>(v>=0?"+":"")+v.toFixed(2)+"%";
            const fmtTime=m=>m<60?m+"m":Math.floor(m/60)+"h";
            const pcolor=v=>v>=0?good:bad;
            const sign=v=>v>=0?"▲":"▼";

            // Chart SVG helpers
            const chartW=700,chartH=220,chartPad={l:52,r:20,t:16,b:28};
            const cW=chartW-chartPad.l-chartPad.r,cH=chartH-chartPad.t-chartPad.b;
            const ser=sel.series||[];
            const serMax=Math.max(...ser),serMin=Math.min(...ser),serRng=serMax-serMin||1;
            const px=(i)=>chartPad.l+(i/(ser.length-1||1))*cW;
            const py=(v)=>chartPad.t+cH-(v-serMin)/serRng*cH;
            const linePath=ser.map((v,i)=>px(i).toFixed(1)+","+py(v).toFixed(1)).join(" L ");
            const areaPath=`M${px(0)},${py(ser[0])} L ${linePath} L ${px(ser.length-1)},${chartPad.t+cH} L ${chartPad.l},${chartPad.t+cH} Z`;
            const gridYs=[0,25,50,75,100].map(p=>({y:chartPad.t+cH-p/100*cH,v:(serMin+p/100*serRng).toFixed(0)}));
            // X labels — 4 evenly spaced month labels
            const months=["Jan 26","Feb 26","Mar 26","Apr 26","May 26"];
            const xLabels=months.slice(0,Math.min(4,months.length)).map((m,i,arr)=>({x:chartPad.l+i*(cW/(arr.length-1||1)),label:m}));

            // Exposed mines for selected commodity
            const commNameMap={cu:"Copper",au:"Gold",fe:"Iron Ore",li:"Lithium",ni:"Nickel",zn:"Zinc",co:"Cobalt",pt:"Platinum",ag:"Silver",u:"Uranium",al:"Bauxite",sn:"Tin",mn:"Manganese",k:"Potash",cl:"Coal (Met)"};
            const commName=commNameMap[selCom]||sel.name;
            const exposedMines=MINES.filter(m=>(m.commodity||[]).includes(commName)&&m.st==="Operating").sort((a,b)=>(b.rv_usd||0)-(a.rv_usd||0)).slice(0,5);

            // Catalyst news — filter by selected commodity symbol
            const catalysts=NEWS_DATA.filter(n=>n.tags.some(t=>t===sel.sym||t===sel.name||t===sel.id.toUpperCase())).slice(0,4);
            if(!catalysts.length)NEWS_DATA.filter(n=>n.imp==="high").slice(0,3).forEach(n=>catalysts.push(n));

            return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",background:dk?"#08111c":"#eef2f7"}}>
              {/* Market Bar */}
              <div style={{height:40,flexShrink:0,display:"flex",alignItems:"center",padding:"0 16px",gap:0,borderBottom:"1px solid "+hair,background:dk?"#0b1623":"#f5f7fb",overflow:"hidden"}}>
                <span style={{fontFamily:mono,fontSize:10,color:fg3,letterSpacing:"0.08em",marginRight:18,whiteSpace:"nowrap"}}>MARKETS · {new Date().toUTCString().slice(17,22)} UTC</span>
                <span style={{fontFamily:mono,fontSize:10,color:fg3,marginRight:18,whiteSpace:"nowrap"}}>BREADTH <span style={{color:good}}>97↑</span> <span style={{color:bad}}>46↓</span> of 15</span>
                {[["DXY","102.4","-0.18",false],["BRENT","78.20","+0.62",true],["CNY","7.12","+0.04",true],["10Y US","4.18%","-0.02",false]].map(([l,v,d,up])=>
                  <div key={l} style={{display:"flex",alignItems:"baseline",gap:5,marginRight:18,whiteSpace:"nowrap"}}>
                    <span style={{fontFamily:mono,fontSize:10,color:fg4,letterSpacing:"0.06em"}}>{l}</span>
                    <span style={{fontFamily:mono,fontSize:11,color:fg}}>{v}</span>
                    <span style={{fontFamily:mono,fontSize:10,color:up?good:bad}}>{d}</span>
                  </div>
                )}
                <div style={{flex:1}}/>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:good,display:"block",boxShadow:"0 0 5px "+good}}/>
                  <span style={{fontFamily:mono,fontSize:10,color:apiStatus==="live"?good:"#6c8198",letterSpacing:"0.08em"}}>{apiStatus==="live"?"● LIVE · LME · COMEX · SHFE":"○ SYNTHETIC · LME · COMEX · SHFE"}</span>
                </div>
              </div>
              {/* Main 3-col layout */}
              <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
                {/* LEFT RAIL — 260px */}
                <div style={{width:260,flexShrink:0,borderRight:"1px solid "+hair,display:"flex",flexDirection:"column",overflow:"hidden",background:dk?"#0b1623":"#f5f7fb"}}>
                  <div style={{padding:"8px 12px 6px",borderBottom:"1px solid "+hair,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
                    <span style={{fontFamily:mono,fontSize:10,color:fg3,letterSpacing:"0.1em",fontWeight:600}}>COMMODITIES <span style={{color:fg4}}>{COMMS.length}</span></span>
                    <span style={{fontFamily:mono,fontSize:10,color:fg3,cursor:"pointer"}}>1D ▾</span>
                  </div>
                  <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
                    {COMMS_LIVE.map(c=>{
                      const isSel=c.id===selCom;
                      const rowBg=isSel?(dk?"#1d3a5c":"#ddeeff"):c.d1>0?`rgba(98,178,137,${Math.min(0.12,Math.abs(c.d1)/8*0.12)})`:`rgba(215,100,74,${Math.min(0.10,Math.abs(c.d1)/8*0.10)})`;
                      const sSer=(c.series||[]).slice(-30);
                      const sMax=Math.max(...sSer),sMin=Math.min(...sSer),sRng=sMax-sMin||1;
                      const sPath=sSer.map((v,i)=>((i/(sSer.length-1||1))*88).toFixed(1)+","+(12-(v-sMin)/sRng*10).toFixed(1)).join(" L ");
                      return <div key={c.id} onClick={()=>setSelCom(c.id)}
                        style={{padding:"8px 12px",borderBottom:"1px solid "+hair,cursor:"pointer",background:rowBg,borderLeft:isSel?"2px solid #e87d3e":"2px solid transparent",transition:"background 0.15s"}}
                        onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=dk?"#19304b":"#e8f0f8"}}
                        onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background=rowBg}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{width:7,height:7,borderRadius:"50%",background:c.color,display:"block",flexShrink:0}}/>
                            <span style={{fontSize:12,fontWeight:isSel?600:500,color:isSel?"#e87d3e":fg}}>{c.name}</span>
                          </div>
                          <span style={{fontFamily:mono,fontSize:11,fontWeight:600,color:fg}}>${fmtP(c.price)}</span>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <svg width={88} height={14} style={{flexShrink:0}}>
                            <path d={"M"+sPath} fill="none" stroke={c.d30>=0?good:bad} strokeWidth="1.2" opacity="0.8"/>
                          </svg>
                          <span style={{fontFamily:mono,fontSize:10,fontWeight:600,color:pcolor(c.d1)}}>{fmtPct(c.d1)}</span>
                        </div>
                      </div>;
                    })}
                  </div>
                </div>

                {/* CENTER — flex */}
                <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
                  {/* Hero */}
                  <div style={{padding:"14px 20px 10px",borderBottom:"1px solid "+hair,flexShrink:0,background:dk?"#0f1b2c":"#fff"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <span style={{width:9,height:9,borderRadius:"50%",background:sel.color,display:"block"}}/>
                          <span style={{fontFamily:"Georgia, serif",fontStyle:"italic",fontSize:28,color:fg,lineHeight:1}}>{sel.name}</span>
                          <span style={{fontFamily:mono,fontSize:9,color:fg3,padding:"2px 8px",border:"1px solid "+hair2,borderRadius:3,letterSpacing:"0.06em"}}>{sel.exchange}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}>
                          <span style={{fontFamily:mono,fontSize:40,fontWeight:700,color:fg,letterSpacing:"-0.03em",lineHeight:1}}>{fmtP(sel.price)}</span>
                          <span style={{fontFamily:mono,fontSize:16,fontWeight:600,color:pcolor(sel.d1)}}>{sign(sel.d1)} {fmtPct(sel.d1)}</span>
                          <span style={{fontFamily:mono,fontSize:14,color:pcolor(sel.d1)}}>· {sel.d1>=0?"+$":"-$"}{Math.abs(Math.round(sel.price*sel.d1/100))}</span>
                        </div>
                        {sel.ohlc&&<div style={{display:"flex",gap:12,fontFamily:mono,fontSize:10,color:fg3}}>
                          {[["OPEN",sel.ohlc.open],["HIGH",sel.ohlc.high],["LOW",sel.ohlc.low],["VOL",sel.ohlc.vol],["OI",sel.ohlc.oi]].map(([k,v])=>
                            <span key={k}><span style={{color:fg4}}>{k} </span>{typeof v==="number"?fmtP(v):v}</span>)}
                        </div>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0}}>
                        <div style={{display:"flex",gap:2,background:dk?"#13243a":"#e8eef5",borderRadius:4,padding:2}}>
                          {["1D","5D","1M","3M","6M","1Y","5Y","MAX"].map(p=><button key={p} onClick={()=>setPeriod(p)} style={{padding:"3px 7px",fontFamily:mono,fontSize:9,fontWeight:700,borderRadius:3,border:"none",background:period===p?"#e87d3e":"transparent",color:period===p?"#fff":(dk?fg3:"#666"),cursor:"pointer"}}>{p}</button>)}
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          {["Line","Candle","Area"].map(t=><span key={t} style={{fontFamily:mono,fontSize:10,color:t==="Line"?"#e87d3e":fg3,cursor:"pointer",fontWeight:t==="Line"?700:400}}>{t}</span>)}
                          <span style={{color:hair2,margin:"0 2px"}}>|</span>
                          <span style={{fontFamily:mono,fontSize:10,color:fg3,cursor:"pointer"}}>+ Compare</span>
                          <span style={{fontFamily:mono,fontSize:10,color:fg3,cursor:"pointer"}}>+ Indicator</span>
                          <span style={{fontFamily:mono,fontSize:10,color:"#e87d3e",cursor:"pointer"}}>🔔 Alert</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Chart */}
                  <div style={{padding:"10px 20px",borderBottom:"1px solid "+hair,flexShrink:0,background:dk?"#0f1b2c":"#fff"}}>
                    <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet" style={{display:"block",overflow:"visible"}}>
                      <defs>
                        <linearGradient id={"cg"+selCom} x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor={sel.color} stopOpacity="0.35"/>
                          <stop offset="100%" stopColor={sel.color} stopOpacity="0.02"/>
                        </linearGradient>
                      </defs>
                      {/* Gridlines */}
                      {gridYs.map(({y,v})=><g key={v}>
                        <line x1={chartPad.l} y1={y} x2={chartW-chartPad.r} y2={y} stroke={hair} strokeWidth={0.5}/>
                        <text x={chartPad.l-4} y={y+4} textAnchor="end" fontSize={9} fill={fg3} fontFamily={mono}>{Number(v).toLocaleString()}</text>
                      </g>)}
                      {/* Area */}
                      {ser.length>1&&<path d={areaPath} fill={"url(#cg"+selCom+")"}/>}
                      {/* Line */}
                      {ser.length>1&&<polyline points={ser.map((v,i)=>px(i).toFixed(1)+","+py(v).toFixed(1)).join(" ")} fill="none" stroke={sel.color} strokeWidth="1.5"/>}
                      {/* Annotations */}
                      {(sel.annotations||[]).filter(a=>a.idx<ser.length).map((a,i)=>{
                        const ax=px(a.idx),ay=py(ser[a.idx]||ser[ser.length-1]);
                        return <g key={i}>
                          <line x1={ax} y1={ay-4} x2={ax} y2={ay-22} stroke={hair2} strokeWidth={1}/>
                          <circle cx={ax} cy={ay} r={4} fill={dk?"#0f1b2c":"#fff"} stroke={sel.color} strokeWidth={1.5}/>
                          <text x={ax} y={ay-26} textAnchor="middle" fontSize={9} fill={fg2} fontFamily={mono}>{a.label}</text>
                        </g>
                      })}
                      {/* X axis labels */}
                      {xLabels.map(({x,label})=><text key={label} x={x} y={chartH-4} textAnchor="middle" fontSize={9} fill={fg3} fontFamily={mono}>{label}</text>)}
                    </svg>
                  </div>
                  {/* Futures + Stats */}
                  <div style={{display:"flex",borderBottom:"1px solid "+hair,flexShrink:0,background:dk?"#0f1b2c":"#fff"}}>
                    {/* Futures curve */}
                    <div style={{flex:"1.4",padding:"10px 16px",borderRight:"1px solid "+hair,overflow:"hidden"}}>
                      <div style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.1em",fontWeight:600,marginBottom:8}}>FUTURES CURVE · CASH → 27M</div>
                      <div style={{display:"flex",gap:0,overflow:"hidden"}}>
                        {(sel.futures||[]).map((f,i)=><div key={f.t} style={{flex:1,borderRight:i<(sel.futures.length-1)?"1px solid "+hair:"none",padding:"0 4px",minWidth:0}}>
                          <div style={{fontFamily:mono,fontSize:8,color:fg4,letterSpacing:"0.05em",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden"}}>{f.t}</div>
                          <div style={{fontFamily:mono,fontSize:10,fontWeight:600,color:fg,whiteSpace:"nowrap",overflow:"hidden"}}>{fmtP(f.p)}</div>
                          <div style={{fontFamily:mono,fontSize:8,color:f.v>=0?good:bad,whiteSpace:"nowrap"}}>{f.v>=0?"+":""}{f.v.toFixed(1)}%</div>
                        </div>)}
                      </div>
                    </div>
                    {/* Stats */}
                    <div style={{flex:1,padding:"10px 16px"}}>
                      <div style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.1em",fontWeight:600,marginBottom:8}}>STATS · 90D</div>
                      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"4px 16px"}}>
                        {sel.stats&&[["Avg",fmtP(sel.stats.avg90)],["σ ann.",sel.stats.sigma+"%"],["52w hi",fmtP(sel.stats.hi52)],["52w lo",fmtP(sel.stats.lo52)],["Sharpe",sel.stats.sharpe.toFixed(2)],["β vs DXY",sel.stats.betaDxy.toFixed(2)]].map(([k,v])=><React.Fragment key={k}>
                          <span style={{fontFamily:mono,fontSize:10,color:fg3}}>{k}</span>
                          <span style={{fontFamily:mono,fontSize:10,color:fg,fontWeight:600,textAlign:"right"}}>{v}</span>
                        </React.Fragment>)}
                      </div>
                    </div>
                  </div>
                  {/* Exposed Mines Table */}
                  <div style={{flex:1,overflow:"auto",background:dk?"#0f1b2c":"#fff"}}>
                    <div style={{padding:"8px 16px 4px",display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.1em",fontWeight:600}}>EXPOSED MINES · {commName.toUpperCase()}</span>
                      <span style={{fontFamily:mono,fontSize:9,color:fg4}}>{exposedMines.length}</span>
                    </div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead><tr style={{borderBottom:"1px solid "+hair}}>
                        {["MINE","OPERATOR","COUNTRY","PRODUCTION","C1 COST","MARGIN","Δ REV AT +1%"].map(h=><th key={h} style={{padding:"4px 12px",textAlign:["PRODUCTION","C1 COST","MARGIN","Δ REV AT +1%"].includes(h)?"right":"left",fontFamily:mono,fontSize:9,fontWeight:600,color:fg3,letterSpacing:"0.08em",whiteSpace:"nowrap"}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {exposedMines.length>0?exposedMines.map((m,i)=>{
                          const c1=1200+i*180;
                          const price=sel.price;
                          const margin=Math.round((price-c1)/price*100);
                          const prod=m.description?m.description.split(";")[0].replace(/[^0-9.kt]/g,"").trim():"n/a";
                          const deltaRev=Math.round(price*0.01*(i+1)*100)*5;
                          return <tr key={m.name} style={{borderBottom:"1px solid "+hair,cursor:"pointer"}} onClick={()=>setProfileMine(m)}
                            onMouseEnter={e=>e.currentTarget.style.background=dk?"#19304b":"#e8f0f8"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <td style={{padding:"5px 12px",fontWeight:500,color:fg,whiteSpace:"nowrap"}}>{m.name}</td>
                            <td style={{padding:"5px 12px",fontFamily:mono,fontSize:10,color:fg2,whiteSpace:"nowrap"}}>{m.company.split("/")[0].trim()}</td>
                            <td style={{padding:"5px 12px",fontFamily:mono,fontSize:10,color:fg3,whiteSpace:"nowrap"}}>{m.country}</td>
                            <td style={{padding:"5px 12px",fontFamily:mono,fontSize:10,color:fg,textAlign:"right",whiteSpace:"nowrap"}}>{m.description?m.description.split(";")[0].trim():"n/a"}</td>
                            <td style={{padding:"5px 12px",fontFamily:mono,fontSize:10,color:fg,textAlign:"right",whiteSpace:"nowrap"}}>${c1.toLocaleString()}/t</td>
                            <td style={{padding:"5px 12px",fontFamily:mono,fontSize:10,color:good,fontWeight:600,textAlign:"right",whiteSpace:"nowrap"}}>{margin}%</td>
                            <td style={{padding:"5px 12px",fontFamily:mono,fontSize:10,color:good,fontWeight:600,textAlign:"right",whiteSpace:"nowrap"}}>+${deltaRev.toLocaleString()}M</td>
                          </tr>;
                        }):<tr><td colSpan={7} style={{padding:"20px 12px",textAlign:"center",fontFamily:mono,fontSize:11,color:fg3}}>No operating {commName} mines in dataset</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT RAIL — 320px */}
                <div style={{width:320,flexShrink:0,borderLeft:"1px solid "+hair,display:"flex",flexDirection:"column",overflow:"hidden",background:dk?"#0b1623":"#f5f7fb"}}>
                  {/* Exposed Equities */}
                  <div style={{flexShrink:0,borderBottom:"1px solid "+hair}}>
                    <div style={{padding:"8px 14px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.1em",fontWeight:600}}>EXPOSED EQUITIES</span>
                      <span style={{fontFamily:mono,fontSize:9,color:fg4}}>{(sel.equities||[]).length}</span>
                    </div>
                    {(sel.equities||[]).map(e=>{
                      const eSer=e.series||[];
                      const eMax=Math.max(...eSer),eMin=Math.min(...eSer),eRng=eMax-eMin||1;
                      const ePath=eSer.map((v,i)=>((i/(eSer.length-1||1))*80).toFixed(1)+","+(14-(v-eMin)/eRng*12).toFixed(1)).join(" L ");
                      return <div key={e.ticker} style={{padding:"6px 14px",borderBottom:"1px solid "+hair,cursor:"pointer"}}
                        onMouseEnter={ev=>ev.currentTarget.style.background=dk?"#19304b":"#e8f0f8"}
                        onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                          <span style={{fontSize:12,fontWeight:500,color:fg}}>{e.name}</span>
                          <span style={{fontFamily:mono,fontSize:11,fontWeight:600,color:"#e87d3e"}}>{e.ticker}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <svg width={80} height={16} style={{flexShrink:0}}>
                            <path d={"M"+ePath} fill="none" stroke={e.d1>=0?good:bad} strokeWidth="1.2" opacity="0.8"/>
                          </svg>
                          <span style={{fontFamily:mono,fontSize:10,color:fg}}>{e.ccy}{e.price.toFixed(2)}</span>
                          <span style={{flex:1}}/>
                          <span style={{fontFamily:mono,fontSize:10,fontWeight:600,color:pcolor(e.d1)}}>{fmtPct(e.d1)}</span>
                        </div>
                      </div>;
                    })}
                  </div>
                  {/* Correlation */}
                  <div style={{flexShrink:0,borderBottom:"1px solid "+hair,padding:"8px 14px 10px"}}>
                    <div style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.1em",fontWeight:600,marginBottom:8}}>CORRELATION · 90D</div>
                    {(sel.correlations||[]).map(({s,r})=>{
                      const barColor=r>=0?good:bad;
                      const barPct=Math.abs(r)*50;
                      return <div key={s} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                        <span style={{fontFamily:mono,fontSize:11,color:fg,minWidth:32}}>{s}</span>
                        <div style={{flex:1,height:8,background:dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.05)",borderRadius:2,position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:hair2}}/>
                          <div style={{position:"absolute",[r>=0?"left":"right"]:"50%",top:1,bottom:1,width:barPct+"%",background:barColor,borderRadius:2,opacity:0.85}}/>
                        </div>
                        <span style={{fontFamily:mono,fontSize:10,color:barColor,fontWeight:600,minWidth:36,textAlign:"right"}}>{r>=0?"+":""}{r.toFixed(2)}</span>
                      </div>;
                    })}
                  </div>
                  {/* Catalysts */}
                  <div style={{flex:1,overflow:"auto"}}>
                    <div style={{padding:"8px 14px 6px",fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.1em",fontWeight:600}}>CATALYSTS · {(sel.sym||sel.name).toUpperCase()}</div>
                    {catalysts.map(n=>(
                      <div key={n.id} style={{padding:"8px 14px",borderBottom:"1px solid "+hair,borderLeft:n.imp==="high"?"2px solid #e87d3e":"2px solid transparent",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background=dk?"#19304b":"#e8f0f8"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{fontFamily:mono,fontSize:9,color:fg4,marginBottom:3}}>{n.src} · {fmtTime(n.t)}</div>
                        <div style={{fontSize:11.5,color:fg,lineHeight:1.4}}>{n.txt}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>;
          })()}


          {termTab==="projects"&&(()=>{
            const mono="'SF Mono',Consolas,monospace";
            const good="#62b289",bad="#d7634a",warn="#e6b94a";
            const fg=dk?"#e7eef7":"#1a1a2e",fg2=dk?"#a9b9cc":"#4a5568",fg3=dk?"#6c8198":"#6b7280",fg4=dk?"#4a5d75":"#8a95a3";
            const hair=dk?"rgba(110,150,200,0.10)":"rgba(0,0,0,0.06)";
            const NOW_YEAR=2026;
            const YEARS=Array.from({length:10},(_,i)=>NOW_YEAR-1+i);

            const stageColor=s=>s==="Construction"?"#e87d3e":"#e6b94a";
            // Normalise stage from freeform text → 2 buckets
            const normStage=s=>{
              if(!s)return "Feasibility";
              const sl=s.toLowerCase();
              if(sl.includes("construct")||sl.includes("commissioning")||sl.includes("ramp")||sl.includes("poured")||sl.includes("development"))return "Construction";
              return "Feasibility";
            };
            // Commodity short-code → full name map
            const comShortToFull={Cu:"Copper",Au:"Gold",Fe:"Iron Ore",Li:"Lithium",Ni:"Nickel",REE:"Rare Earths",Zn:"Zinc",Co:"Cobalt"};

            const [viewMode,setViewMode]=[projViewMode,setProjViewMode];
            const [filtStage,setFiltStage]=[projFiltStage,setProjFiltStage];
            const [filtCom,setFiltCom]=[projFiltCom,setProjFiltCom];
            const [hoverProj,setHoverProj]=[projHover,setProjHover];

            const projects=MINES.filter(m=>isProject(m)).map(m=>{
              const capex=parseFloat(String(m.capex||"0").replace(/[^0-9.]/g,""))||0;
              const fp=m.fpDate||NOW_YEAR+3;
              const stage=normStage(m.stage);
              const dur=stage==="Construction"?2:stage==="Feasibility"?2:3;
              const startYr=Math.max(NOW_YEAR-1,fp-dur);
              const seed=(m.name.charCodeAt(0)+m.name.charCodeAt(1)||0);
              const pct=stage==="Construction"?30+seed%50:stage==="Feasibility"?15+seed%35:5+seed%25;
              const risk=m.notes&&(m.notes.toLowerCase().includes("permitting")||m.notes.toLowerCase().includes("risk"))?m.notes.substring(0,40):null;
              return {...m,capex,fp,startYr,dur,pct,stage,stageColor:stageColor(stage),risk};
            }).sort((a,b)=>b.capex-a.capex);

            const filtered=projects.filter(p=>{
              if(filtStage!=="All"&&p.stage!==filtStage)return false;
              if(filtCom!=="All"){
                const fullName=comShortToFull[filtCom]||filtCom;
                if(!(p.commodity||[]).includes(fullName))return false;
              }
              return true;
            });

            const totalCapex=projects.reduce((s,p)=>s+p.capex,0);
            const stageGroups={Construction:projects.filter(p=>p.stage==="Construction"),Feasibility:projects.filter(p=>p.stage==="Feasibility")};
            const stageCapex=s=>stageGroups[s]?.reduce((sum,p)=>sum+p.capex,0)||0;

            // FP bar chart data
            const fpByYear={};
            projects.forEach(p=>{if(p.fp)fpByYear[p.fp]=(fpByYear[p.fp]||0)+1});
            const fpYears=YEARS.slice(1);
            const fpMax=Math.max(...fpYears.map(y=>fpByYear[y]||0),1);

            // New supply by commodity
            const supplyData=[
              {com:"Copper",color:"#e8722a",val:"+3.2 Mt/y"},{com:"Iron Ore",color:"#e03020",val:"+188 Mt/y"},
              {com:"Lithium",color:"#22aaff",val:"+0.42 Mt LCE"},{com:"Nickel",color:"#22c97a",val:"+0.18 Mt/y"},
            ];

            // At-risk projects
            const atRisk=projects.filter(p=>p.risk||(p.notes&&p.notes.toLowerCase().includes("permitting"))).slice(0,4);

            // Commodity filter options
            const comOptions=["All",...Array.from(new Set(projects.flatMap(p=>p.commodity||[]))).sort()].slice(0,8);

            const rowH=52;
            const leftW=300;
            const ganttW=760;
            const yrW=ganttW/YEARS.length;

            return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",background:dk?"#08111c":"#eef2f7"}}>
              {/* Header */}
              <div style={{padding:"14px 20px 10px",borderBottom:"1px solid "+hair,background:dk?"#0b1623":"#fff",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:mono,fontSize:10,color:fg3,letterSpacing:"0.1em",marginBottom:4}}>VIEWS › PROJECT PIPELINE</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:14}}>
                      <span style={{fontSize:28,fontWeight:700,color:fg,letterSpacing:"-0.02em"}}>Project Pipeline</span>
                      <span style={{fontFamily:mono,fontSize:12,color:fg3}}>· {projects.length} active · ${totalCapex.toFixed(1)}B committed capex</span>
                    </div>
                  </div>
                  {/* View toggle */}
                  <div style={{display:"flex",gap:4}}>
                    {["GANTT","CARDS","TABLE"].map(v=><button key={v} onClick={()=>setViewMode(v.toLowerCase())} style={{padding:"5px 14px",fontFamily:mono,fontSize:10,fontWeight:700,letterSpacing:"0.06em",borderRadius:3,border:"none",background:viewMode===v.toLowerCase()?"#e87d3e":dk?"rgba(110,150,200,0.08)":"rgba(0,0,0,0.06)",color:viewMode===v.toLowerCase()?"#fff":fg3,cursor:"pointer"}}>{v}</button>)}
                  </div>
                </div>
                {/* Filter bar */}
                <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.08em"}}>COMMODITY</span>
                    <div style={{display:"flex",gap:3}}>
                      {["All","Cu","Au","Fe","Li","Ni","REE"].map(c=><button key={c} onClick={()=>setFiltCom(c)} style={{padding:"2px 8px",fontFamily:mono,fontSize:9,fontWeight:700,borderRadius:3,border:"none",background:filtCom===c?"#e87d3e":(dk?"rgba(110,150,200,0.08)":"rgba(0,0,0,0.05)"),color:filtCom===c?"#fff":(dk?fg3:"#666"),cursor:"pointer"}}>{c}</button>)}
                    </div>
                  </div>
                  <div style={{width:1,height:16,background:hair}}/>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.08em"}}>STAGE</span>
                    <div style={{display:"flex",gap:3}}>
                      {["All","Feasibility","Construction"].map(s=><button key={s} onClick={()=>setFiltStage(s)}
                        style={{padding:"2px 10px",fontFamily:mono,fontSize:9,fontWeight:700,borderRadius:3,border:filtStage===s?"none":"1px solid "+hair,background:filtStage===s?stageColor(s):"transparent",color:filtStage===s?"#fff":(dk?fg3:"#555"),cursor:"pointer"}}>
                        {s}{s!=="All"?<span style={{marginLeft:4,opacity:0.7}}>{stageGroups[s]?.length||0}</span>:null}
                      </button>)}
                    </div>
                  </div>
                  <div style={{flex:1}}/>
                  <span style={{fontFamily:mono,fontSize:10,color:fg3}}>Showing {filtered.length} of {projects.length}</span>
                </div>
              </div>

              {/* GANTT VIEW */}
              {viewMode==="gantt"&&<div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
                {/* Gantt + left labels */}
                <div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch"}}>
                  {/* Year header row */}
                  <div style={{display:"flex",position:"sticky",top:0,zIndex:5,background:dk?"#0b1623":"#f0f4f8",borderBottom:"1px solid "+hair}}>
                    <div style={{width:leftW,minWidth:leftW,flexShrink:0,padding:"6px 16px",display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.08em",fontWeight:600}}>PROJECT</span>
                      <span style={{fontFamily:mono,fontSize:9,color:fg4,letterSpacing:"0.08em"}}>↓ CAPEX</span>
                    </div>
                    <div style={{flex:1,display:"flex",position:"relative"}}>
                      {YEARS.map((y,i)=><div key={y} style={{flex:1,padding:"6px 0",textAlign:"center",fontFamily:mono,fontSize:9,color:y===NOW_YEAR?"#e87d3e":fg3,fontWeight:y===NOW_YEAR?700:400,borderLeft:"1px solid "+hair,background:y===NOW_YEAR?"rgba(232,125,62,0.04)":"transparent"}}>{y}</div>)}
                    </div>
                  </div>
                  {/* Project rows */}
                  {filtered.map((p,i)=>{
                    const isHover=hoverProj===p.name;
                    const barStart=Math.max(0,p.startYr-YEARS[0]);
                    const barEnd=Math.min(YEARS.length,p.fp-YEARS[0]+0.5);
                    const barLeft=(barStart/YEARS.length)*100+"%";
                    const barWidth=((barEnd-barStart)/YEARS.length)*100+"%";
                    const fpX=((p.fp-YEARS[0]+0.5)/YEARS.length)*100+"%";
                    return <div key={p.name} onMouseEnter={()=>setHoverProj(p.name)} onMouseLeave={()=>setHoverProj(null)}
                      style={{display:"flex",borderBottom:"1px solid "+hair,background:isHover?(dk?"rgba(29,58,92,0.5)":"rgba(220,235,255,0.5)"):(i%2===0?"transparent":(dk?"rgba(255,255,255,0.01)":"rgba(0,0,0,0.01)")),transition:"background 0.12s",minHeight:rowH}}>
                      {/* Left label */}
                      <div style={{width:leftW,minWidth:leftW,flexShrink:0,padding:"8px 16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                            <span style={{width:7,height:7,borderRadius:"50%",background:getCC(p.commodity),flexShrink:0,display:"block"}}/>
                            <span style={{fontSize:12,fontWeight:600,color:isHover?"#e87d3e":fg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer"}} onClick={()=>setProfileMine(p)}>{p.name}</span>
                          </div>
                          <div style={{fontFamily:mono,fontSize:9,color:fg3,paddingLeft:13}}>{p.company.split("/")[0].trim()}</div>
                          <div style={{fontFamily:mono,fontSize:9,color:fg4,paddingLeft:13}}>{p.country}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontFamily:mono,fontSize:11,fontWeight:700,color:fg}}>${p.capex>=1?p.capex.toFixed(1)+"B":Math.round(p.capex*1000)+"M"}</div>
                          <div style={{fontFamily:mono,fontSize:8,color:fg4,marginTop:1}}>{(p.commodity||[]).slice(0,2).join("/")}</div>
                        </div>
                      </div>
                      {/* Gantt bar area */}
                      <div style={{flex:1,position:"relative",padding:"12px 0"}}>
                        {/* Year gridlines */}
                        {YEARS.map((y,j)=><div key={y} style={{position:"absolute",top:0,bottom:0,left:(j/YEARS.length*100)+"%",width:1,background:y===NOW_YEAR?"rgba(232,125,62,0.2)":hair}}/>)}
                        {/* Full bar from start to FP */}
                        <div style={{position:"absolute",top:"50%",transform:"translateY(-50%)",left:barLeft,width:barWidth,height:22,borderRadius:3,background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.08)",border:"1px solid "+p.stageColor+"55",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}>
                          {/* Progress fill */}
                          <div style={{position:"absolute",left:0,top:0,bottom:0,width:p.pct+"%",background:p.stageColor,opacity:0.85,borderRadius:"3px 0 0 3px"}}/>
                          {/* Stage label */}
                          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",padding:"0 8px"}}>
                            <span style={{fontFamily:mono,fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.95)",whiteSpace:"nowrap",position:"relative",zIndex:1}}>{p.stage} · {p.pct}%</span>
                          </div>
                        </div>
                        {/* FP marker diamond */}
                        <div style={{position:"absolute",top:"50%",transform:"translateY(-50%) rotate(45deg)",left:fpX,width:10,height:10,background:"#e87d3e",border:"1.5px solid rgba(255,255,255,0.4)",marginLeft:-5,zIndex:2}}/>
                        {/* FP label */}
                        <div style={{position:"absolute",bottom:2,left:`calc(${fpX} - 4px)`,fontFamily:mono,fontSize:8,color:"#e87d3e",fontWeight:700,whiteSpace:"nowrap",zIndex:2}}>FP</div>
                        {/* Risk flag */}
                        {p.risk&&<div style={{position:"absolute",top:"50%",transform:"translateY(-50%)",right:8,fontFamily:mono,fontSize:8,color:warn,background:"rgba(230,185,74,0.12)",padding:"1px 6px",borderRadius:2,border:"1px solid rgba(230,185,74,0.3)",whiteSpace:"nowrap"}}>⚠ {p.risk.substring(0,30)}</div>}
                      </div>
                    </div>;
                  })}
                </div>
                {/* Right panel — Pipeline Summary */}
                <div style={{width:280,flexShrink:0,borderLeft:"1px solid "+hair,background:dk?"#0b1623":"#f5f7fb",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
                  <div style={{padding:"12px 14px",borderBottom:"1px solid "+hair}}>
                    <div style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.1em",fontWeight:600,marginBottom:10}}>PIPELINE SUMMARY</div>
                    <div style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.08em",marginBottom:6}}>BY STAGE</div>
                    {Object.entries(stageGroups).map(([stage,list])=>{
                      const cap=stageCapex(stage);
                      const pct=Math.round(list.length/projects.length*100);
                      return <div key={stage} style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:11,color:fg,fontWeight:500}}>{stage}</span>
                          <span style={{fontFamily:mono,fontSize:10,color:fg2}}>{list.length} · ${cap.toFixed(1)}B</span>
                        </div>
                        <div style={{height:4,background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",borderRadius:2,overflow:"hidden"}}>
                          <div style={{width:pct+"%",height:"100%",background:stageColor(stage),borderRadius:2}}/>
                        </div>
                      </div>;
                    })}
                  </div>
                  {/* FP forecast chart */}
                  <div style={{padding:"12px 14px",borderBottom:"1px solid "+hair}}>
                    <div style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.1em",fontWeight:600,marginBottom:8}}>FIRST PRODUCTION FORECAST</div>
                    <div style={{display:"flex",alignItems:"flex-end",gap:3,height:60}}>
                      {fpYears.map(y=>{
                        const cnt=fpByYear[y]||0;
                        const h=cnt?Math.round((cnt/fpMax)*48)+8:0;
                        return <div key={y} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                          {cnt>0&&<span style={{fontFamily:mono,fontSize:7,color:fg3}}>{cnt}</span>}
                          <div style={{width:"100%",height:h,background:"#e87d3e",borderRadius:"2px 2px 0 0",opacity:0.8}}/>
                          <span style={{fontFamily:mono,fontSize:7,color:fg4}}>{String(y).slice(2)}</span>
                        </div>;
                      })}
                    </div>
                  </div>
                  {/* New supply */}
                  <div style={{padding:"12px 14px",borderBottom:"1px solid "+hair}}>
                    <div style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.1em",fontWeight:600,marginBottom:8}}>NEW SUPPLY · 2026–2032</div>
                    {supplyData.map(s=><div key={s.com} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:s.color,flexShrink:0,display:"block"}}/>
                      <span style={{fontSize:11,color:fg,flex:1}}>{s.com}</span>
                      <span style={{fontFamily:mono,fontSize:10,color:good,fontWeight:600}}>{s.val}</span>
                    </div>)}
                  </div>
                  {/* At risk */}
                  {atRisk.length>0&&<div style={{padding:"12px 14px"}}>
                    <div style={{fontFamily:mono,fontSize:9,color:fg3,letterSpacing:"0.1em",fontWeight:600,marginBottom:8}}>AT RISK · {atRisk.length} PROJECTS</div>
                    {atRisk.map(p=><div key={p.name} style={{marginBottom:10,cursor:"pointer"}} onClick={()=>setProfileMine(p)}>
                      <div style={{fontSize:11,fontWeight:600,color:fg,marginBottom:2}}>{p.name}</div>
                      <div style={{fontFamily:mono,fontSize:9,color:warn}}>⚠ {p.stage==="Permitting"?"permitting risk":p.stage==="Feasibility"?"feasibility risk":"construction risk"}</div>
                    </div>)}
                  </div>}
                </div>
              </div>}

              {/* TABLE VIEW */}
              {viewMode==="table"&&<div style={{flex:1,overflow:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead style={{position:"sticky",top:0,zIndex:2}}><tr style={{background:dk?"#0b1623":"#f0f4f8",borderBottom:"1px solid "+hair}}>
                    {["PROJECT","OPERATOR","COUNTRY","COMMODITY","STAGE","CAPEX","FP DATE","STATUS"].map(h=><th key={h} style={{padding:"8px 14px",textAlign:["CAPEX","FP DATE"].includes(h)?"right":"left",fontFamily:mono,fontSize:9,fontWeight:600,color:fg3,letterSpacing:"0.08em",whiteSpace:"nowrap"}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{filtered.map((p,i)=><tr key={p.name} style={{borderBottom:"1px solid "+hair,cursor:"pointer",background:i%2===0?"transparent":(dk?"rgba(255,255,255,0.01)":"rgba(0,0,0,0.01)")}} onClick={()=>setProfileMine(p)}
                    onMouseEnter={e=>e.currentTarget.style.background=dk?"#1d3a5c":"#ddeeff"}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"transparent":(dk?"rgba(255,255,255,0.01)":"rgba(0,0,0,0.01)")}>
                    <td style={{padding:"8px 14px",fontWeight:600,color:fg,whiteSpace:"nowrap"}}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><span style={{width:7,height:7,borderRadius:"50%",background:getCC(p.commodity),flexShrink:0,display:"block"}}/>{p.name}</span></td>
                    <td style={{padding:"8px 14px",color:fg2,fontFamily:mono,fontSize:10,whiteSpace:"nowrap"}}>{p.company.split("/")[0].trim()}</td>
                    <td style={{padding:"8px 14px",color:fg3,fontFamily:mono,fontSize:10}}>{p.country}</td>
                    <td style={{padding:"8px 14px"}}><span style={{padding:"2px 7px",borderRadius:3,background:getCC(p.commodity)+"22",color:getCC(p.commodity),fontFamily:mono,fontSize:9,fontWeight:700}}>{(p.commodity||[]).slice(0,2).join("/")}</span></td>
                    <td style={{padding:"8px 14px"}}><span style={{padding:"2px 8px",borderRadius:3,background:p.stageColor+"22",color:p.stageColor,fontFamily:mono,fontSize:9,fontWeight:700}}>{p.stage}</span></td>
                    <td style={{padding:"8px 14px",fontFamily:mono,fontSize:11,fontWeight:700,color:fg,textAlign:"right",whiteSpace:"nowrap"}}>${p.capex>=1?p.capex.toFixed(1)+"B":Math.round(p.capex*1000)+"M"}</td>
                    <td style={{padding:"8px 14px",fontFamily:mono,fontSize:10,color:fg2,textAlign:"right",whiteSpace:"nowrap"}}>{p.fp||"TBD"}</td>
                    <td style={{padding:"8px 14px"}}><span style={{fontFamily:mono,fontSize:9,color:p.risk?warn:good}}>{p.risk?"⚠ At risk":"On track"}</span></td>
                  </tr>)}</tbody>
                </table>
              </div>}

              {/* CARDS VIEW */}
              {viewMode==="cards"&&<div style={{flex:1,overflow:"auto",padding:"16px 20px"}}>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
                  {filtered.map(p=><div key={p.name} onClick={()=>setProfileMine(p)} style={{background:dk?"#0f1b2c":"#fff",border:"1px solid "+hair,borderRadius:6,overflow:"hidden",cursor:"pointer",transition:"border-color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#e87d3e"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=hair}>
                    <div style={{height:4,background:p.stageColor}}/>
                    <div style={{padding:"12px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><span style={{width:7,height:7,borderRadius:"50%",background:getCC(p.commodity),display:"block"}}/><span style={{fontSize:13,fontWeight:700,color:fg}}>{p.name}</span></div>
                          <div style={{fontFamily:mono,fontSize:10,color:fg3}}>{p.company.split("/")[0].trim()} · {p.country}</div></div>
                        <span style={{fontFamily:mono,fontSize:13,fontWeight:800,color:fg}}>${p.capex>=1?p.capex.toFixed(1)+"B":Math.round(p.capex*1000)+"M"}</span>
                      </div>
                      <div style={{display:"flex",gap:6,marginBottom:10}}>
                        <span style={{padding:"2px 8px",borderRadius:3,background:p.stageColor+"22",color:p.stageColor,fontFamily:mono,fontSize:9,fontWeight:700}}>{p.stage}</span>
                        {(p.commodity||[]).slice(0,2).map(c=><span key={c} style={{padding:"2px 7px",borderRadius:3,background:getCC([c])+"22",color:getCC([c]),fontFamily:mono,fontSize:9,fontWeight:700}}>{c}</span>)}
                      </div>
                      <div style={{height:4,background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",borderRadius:2,overflow:"hidden",marginBottom:6}}>
                        <div style={{width:p.pct+"%",height:"100%",background:p.stageColor,borderRadius:2}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontFamily:mono,fontSize:10,color:fg3}}>
                        <span>FP: {p.fp||"TBD"}</span>
                        <span style={{color:"#e87d3e",fontWeight:700}}>{p.pct}% complete</span>
                      </div>
                      {p.risk&&<div style={{marginTop:6,fontFamily:mono,fontSize:9,color:warn}}>⚠ {p.risk.substring(0,60)}</div>}
                    </div>
                  </div>)}
                </div>
              </div>}
            </div>;
          })()}


          {termTab==="news"&&(()=>{
            const NEWS=[
              {t:14,src:"REUT",sc:"#60a5fa",txt:"BHP lifts FY26 copper guidance after Escondida throughput record",tags:["BHP","Cu"],imp:"high",mine:"Escondida",bps:32,com:"Copper",metric:"BHP +1.4% · EBITDA +4.2%",abstract:"Goldman, JPM and Macquarie revised price decks upward; consensus segment EBITDA +4.2%."},
              {t:38,src:"BBG",sc:"#f59e0b",txt:"Lithium prices rally on China stimulus and Chile permitting delays",tags:["Li"],imp:"high",mine:null,bps:28,com:"Lithium",metric:"Li +2.1% · spot +$180/t",abstract:"Spodumene spot +$180/t; Chilean DGA water approvals stall two major projects."},
              {t:52,src:"MJ",sc:"#a78bfa",txt:"Simandou rail commissioning enters final phase, first ore Q4",tags:["Simandou","Fe"],imp:"med",mine:"Simandou Blocks 1-2",bps:18,com:"Iron Ore",metric:"RIO +0.8% · Fe flat",abstract:"765km rail corridor on track; Guinea government confirms port capacity."},
              {t:71,src:"AFR",sc:"#34d399",txt:"Rio Tinto Jadar permitting paused pending Serbian environmental review",tags:["Rio Tinto","Li"],imp:"high",mine:null,bps:-22,com:"Lithium",metric:"RIO -1.2% · Li -0.9%",abstract:"Environmental ministry requests supplementary EIS; timeline extends 9–12 months."},
              {t:96,src:"REUT",sc:"#60a5fa",txt:"Freeport-McMoRan reports Grasberg block cave milestone, costs in line",tags:["FCX","Cu"],imp:"med",mine:"Grasberg",bps:14,com:"Copper",metric:"FCX +0.6% · Cu flat",abstract:"DMLZ+GBC combined annualised rate now 1.1Mt Cu equivalent; guidance maintained."},
              {t:124,src:"BBG",sc:"#f59e0b",txt:"Iron ore drops 1.4% as China steel output cuts deepen",tags:["Fe"],imp:"med",mine:null,bps:-19,com:"Iron Ore",metric:"BHP -0.5% · Fe -1.4%",abstract:"Dalian futures -1.4%; Chinese steel mill utilisation falls to 72-week low."},
              {t:158,src:"NS",sc:"#e87d3e",txt:"Newmont quarterly gold production +6% YoY, Ahafo expansion ahead",tags:["NEM","Au"],imp:"low",mine:"Ahafo",bps:9,com:"Gold",metric:"NEM +0.4% · Au +0.3%",abstract:"Q1 attributable 1.68Moz; Ahafo North underground on schedule for H2 2025."},
              {t:192,src:"WSJ",sc:"#e2e8f0",txt:"DRC reviews mining royalty regime; Kamoa-Kakula impact under study",tags:["Co","Cu"],imp:"high",mine:"Kamoa-Kakula",bps:-31,com:"Copper",metric:"IVN -4.2% · Cu -0.6%",abstract:"Proposed royalty lift from 3.5% to 5.5% Cu; IVN shares fell 4.2% pre-market."},
              {t:246,src:"REUT",sc:"#60a5fa",txt:"Vale signals Carajás 2026 capex stable, S11D ramp continues",tags:["Vale","Fe"],imp:"low",mine:"Carajás S11D",bps:6,com:"Iron Ore",metric:"VALE flat · Fe flat",abstract:"$6.2B sustaining guidance unchanged; S11D Phase 2 at 82% of nameplate."},
              {t:289,src:"MJ",sc:"#a78bfa",txt:"Australia critical minerals strategy adds new battery precursor targets",tags:["Li","Au"],imp:"med",mine:null,bps:11,com:"Lithium",metric:"PLS +1.1% · Li +0.7%",abstract:"IRA-equivalent offtake incentive; $1.2B fund earmarked for downstream refining."},
              {t:312,src:"BBG",sc:"#f59e0b",txt:"Barrick CEO flags Reko Diq first copper in 2028, infra on track",tags:["ABX","Cu"],imp:"med",mine:"Reko Diq",bps:16,com:"Copper",metric:"ABX +0.9% · Cu +0.4%",abstract:"Access road 40% complete; Pakistan federal and provincial water allocations signed."},
              {t:398,src:"AFR",sc:"#34d399",txt:"BHP Nickel West review deepens; mothball scenario now base case",tags:["BHP","Ni"],imp:"high",mine:null,bps:-38,com:"Nickel",metric:"BHP -0.8% · Ni -1.9%",abstract:"Leinster and Mt Keith facing care-and-maintenance; decision expected FY Q3 results."},
              {t:441,src:"REUT",sc:"#60a5fa",txt:"Copper smelter treatment charges hit 12-year low on concentrate tightness",tags:["Cu"],imp:"med",mine:null,bps:21,com:"Copper",metric:"Cu +0.3% · TCs -15%",abstract:"TC/RCs now $2.4/t; Escondida and Kamoa concentrate redirected to China."},
              {t:512,src:"MJ",sc:"#a78bfa",txt:"South32 Hermosa Taylor receives US DOE critical minerals funding",tags:["S32","Zn"],imp:"med",mine:"Hermosa Taylor",bps:12,com:"Zinc",metric:"S32 +1.3% · Zn +0.2%",abstract:"$166M DOE grant accelerates construction timeline; 2027 commissioning now target."},
              {t:548,src:"BBG",sc:"#f59e0b",txt:"Oyu Tolgoi throughput record in Q1 as block cave ramp accelerates",tags:["Rio Tinto","Cu"],imp:"low",mine:"Oyu Tolgoi Underground",bps:8,com:"Copper",metric:"RIO +0.2% · Cu flat",abstract:"197kt Cu in concentrate; underground now 84% of total output."},
              {t:612,src:"REUT",sc:"#60a5fa",txt:"Peru community opposition delays Quellaveco expansion prefeasibility",tags:["AAL","Cu"],imp:"med",mine:"Quellaveco",bps:-14,com:"Copper",metric:"AAL -0.7% · Cu -0.3%",abstract:"Moquegua water-sharing accord under renegotiation; H2 2025 timeline at risk."},
              {t:680,src:"MJ",sc:"#a78bfa",txt:"Global copper mine supply deficit widens to 450kt, ICSG forecasts",tags:["Cu"],imp:"high",mine:null,bps:25,com:"Copper",metric:"Cu +0.8% · TCRCs -8%",abstract:"ICSG revised 2025 deficit upward from 310kt on grade decline across majors."},
              {t:724,src:"AFR",sc:"#34d399",txt:"Pilbara Minerals signs binding offtake with Korean battery makers",tags:["PLS","Li"],imp:"med",mine:"Pilgangoora",bps:13,com:"Lithium",metric:"PLS +2.4% · Li +0.5%",abstract:"150ktpa SC6 over 5 years; South Korean consortium includes POSCO and Samsung SDI."},
            ];
            const impColor=imp=>imp==="high"?"#ef4444":imp==="med"?"#f59e0b":"#34d399";
            const fmtTime=mins=>{if(mins<60)return mins+"m";const h=Math.floor(mins/60),m=mins%60;return m>0?`${h}h ${m}m`:`${h}h`;};
            // Use live news if available, fall back to synthetic
            const NEWS_ACTIVE=liveNews||NEWS;
            const liveCount=NEWS_ACTIVE.length;
            const filt=NEWS_ACTIVE.filter(n=>{
              if(newsFilt==="high")return n.imp==="high";
              if(newsFilt==="watchlist")return watchlist.some(w=>n.mine&&n.mine===w.name);
              if(newsFilt==="commodities"){const myC=new Set(watchlist.flatMap(w=>w.commodity||[]));return myC.size===0||(n.com&&myC.has(n.com));}
              return true;
            });
            const comCounts=NEWS_ACTIVE.reduce((a,n)=>{a[n.com]=(a[n.com]||0)+1;return a},{});
            const topComs=Object.entries(comCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
            const maxCom=Math.max(...topComs.map(([,v])=>v));
            const lead=NEWS_ACTIVE[0];
            const mono="'SF Mono',Consolas,monospace";
            const priceSpark=[98,97,99,98,100,101,103,102,104,103,105,106,107,108,107,109,110,112,111,113];
            const spMax=Math.max(...priceSpark),spMin=Math.min(...priceSpark),spRng=spMax-spMin||1;
            const sparkPath=pts=>pts.map((v,i)=>((i/(pts.length-1))*360).toFixed(1)+","+(36-(v-spMin)/spRng*32).toFixed(1)).join(" L ");
            return <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
              {/* ── LEFT WIRE ── */}
              <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.06)"}}>
                {/* Wire header */}
                <div style={{padding:"8px 14px",borderBottom:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:dk?"rgba(15,27,44,0.6)":"rgba(245,245,250,0.8)",gap:8,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontFamily:mono,fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:tc}}>MINING NEWSWIRE</span>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:liveNews?"#ef4444":"#6b7280",display:"block",boxShadow:liveNews?"0 0 6px #ef4444":"none",animation:liveNews?"pulse 1.5s ease-in-out infinite":"none"}}/>
                      <span style={{fontFamily:mono,fontSize:10,color:liveNews?"#ef4444":"#6b7280",fontWeight:700}}>{liveNews?"LIVE":"DEMO"} · {liveCount} {liveNews?"NEW":"ITEMS"}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:3,alignItems:"center"}}>
                    {[["all","ALL"],["high","HIGH IMPACT"],["watchlist","WATCHLIST"],["commodities","MY COMMS"]].map(([k,l])=>(
                      <button key={k} onClick={()=>setNewsFilt(k)} style={{padding:"3px 9px",fontFamily:mono,fontSize:9,fontWeight:700,letterSpacing:"0.05em",borderRadius:3,border:"none",background:newsFilt===k?"#e87d3e":"transparent",color:newsFilt===k?"#fff":(dk?"#6c8198":"#6b7280"),cursor:"pointer",transition:"all 0.15s"}}>{l}</button>
                    ))}
                    <div style={{width:1,height:16,background:dk?"rgba(110,150,200,0.15)":"rgba(0,0,0,0.1)",margin:"0 2px"}}/>
                    <button onClick={()=>setNewsFilt(newsFilt==="digest"?"all":"digest")} title="Digest mode — headlines only" style={{padding:"3px 9px",fontFamily:mono,fontSize:9,fontWeight:700,borderRadius:3,border:"none",background:newsFilt==="digest"?"#6c8198":"transparent",color:newsFilt==="digest"?"#fff":(dk?"#6c8198":"#6b7280"),cursor:"pointer"}}>DIGEST</button>
                  </div>
                </div>
                {/* Wire rows */}
                <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
                  {(newsFilt==="digest"?NEWS:filt).map((n,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:0,borderBottom:dk?"1px solid rgba(110,150,200,0.05)":"1px solid rgba(0,0,0,0.04)",cursor:"pointer",minHeight:newsFilt==="digest"?28:44,transition:"background 0.12s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=dk?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {/* Left accent bar */}
                      <div style={{width:3,alignSelf:"stretch",background:impColor(n.imp),flexShrink:0,opacity:n.imp==="high"?1:0.5}}/>
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:newsFilt==="digest"?"4px 10px":"6px 10px",flex:1,minWidth:0}}>
                        <span style={{fontFamily:mono,fontSize:9,color:dk?"#3d5166":"#8a95a3",minWidth:32,flexShrink:0}}>{fmtTime(n.t)}</span>
                        {newsFilt!=="digest"&&<span style={{fontFamily:mono,fontSize:9,fontWeight:800,color:n.sc,minWidth:28,flexShrink:0}}>{n.src}</span>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:tc,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.txt}</div>
                          {newsFilt!=="digest"&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                            {n.tags.map(tag=><span key={tag} style={{fontFamily:mono,fontSize:8,padding:"1px 5px",borderRadius:2,background:dk?"rgba(110,150,200,0.08)":"rgba(0,0,0,0.05)",color:dk?"#6c8198":"#6b7280",fontWeight:600}}>{tag}</span>)}
                            {n.metric&&<span style={{fontFamily:mono,fontSize:9,color:n.bps>0?"#34d399":"#f87171",fontWeight:700,marginLeft:2}}>{n.metric}</span>}
                          </div>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filt.length===0&&newsFilt!=="digest"&&<div style={{padding:"40px 14px",textAlign:"center",fontFamily:mono,fontSize:11,color:dk?"#3d5166":"#8a95a3"}}>No stories match this filter</div>}
                </div>
              </div>

              {/* ── RIGHT RAIL (480px) ── */}
              <div style={{width:480,flexShrink:0,display:"flex",flexDirection:"column",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>

                {/* 1. TODAY'S LEAD */}
                <div style={{padding:"12px 16px",borderBottom:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontFamily:mono,fontSize:10,fontWeight:700,letterSpacing:"0.16em",color:dk?"#6c8198":"#4a5568"}}>TODAY'S LEAD</span>
                    <span style={{fontFamily:mono,fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:2,background:"#ef444418",color:"#ef4444",border:"1px solid #ef444430"}}>● HIGH IMPACT</span>
                  </div>
                  {/* 5-day price sparkline strip */}
                  <div style={{marginBottom:8,position:"relative"}}>
                    <svg width="100%" height={40} viewBox="0 0 460 40" preserveAspectRatio="none" style={{display:"block"}}>
                      <defs>
                        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#34d399" stopOpacity="0.02"/>
                        </linearGradient>
                      </defs>
                      <path d={"M0,"+((1-(priceSpark[0]-spMin)/spRng)*36+2)+" L "+sparkPath(priceSpark)+" L 460,38 L 0,38 Z"} fill="url(#sparkGrad)"/>
                      <polyline points={priceSpark.map((v,i)=>((i/(priceSpark.length-1))*460).toFixed(1)+","+(2+(1-(v-spMin)/spRng)*36).toFixed(1)).join(" ")} fill="none" stroke="#34d399" strokeWidth="1.5"/>
                      {["Mon","Tue","Wed","Thu","Fri"].map((d,i)=><text key={d} x={i*115} y={39} fontSize={8} fill={dk?"#3d5166":"#ccc"} fontFamily={mono}>{d}</text>)}
                    </svg>
                    <span style={{position:"absolute",top:2,right:0,fontFamily:mono,fontSize:10,fontWeight:700,color:"#34d399"}}>+4.2% 5d</span>
                  </div>
                  <div style={{fontSize:16,fontWeight:700,color:tc,lineHeight:1.35,marginBottom:5,letterSpacing:"-0.01em"}}>{lead.txt}</div>
                  <div style={{fontSize:11,color:dk?"#6c8198":"#4a5568",lineHeight:1.5,marginBottom:8}}>{lead.abstract}</div>
                  <div style={{display:"flex",gap:6}}>
                    {lead.mine&&<button onClick={()=>{const m=MINES.find(x=>x.name===lead.mine);if(m)setProfileMine(m)}} style={{padding:"5px 12px",background:"#e87d3e",border:"none",borderRadius:3,fontFamily:mono,fontSize:10,fontWeight:700,color:"#fff",cursor:"pointer"}}>OPEN ASSET →</button>}
                    <button style={{padding:"5px 12px",background:"transparent",border:dk?"1px solid rgba(110,150,200,0.15)":"1px solid rgba(0,0,0,0.10)",borderRadius:3,fontFamily:mono,fontSize:10,fontWeight:700,color:dk?"#6c8198":"#6b7280",cursor:"pointer"}}>READ</button>
                  </div>
                </div>

                {/* 2. IMPACT MAP */}
                <div style={{padding:"12px 16px",borderBottom:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontFamily:mono,fontSize:10,fontWeight:700,letterSpacing:"0.16em",color:dk?"#6c8198":"#4a5568"}}>IMPACT MAP · 24H</span>
                    <span style={{fontFamily:mono,fontSize:9,color:dk?"#3d5166":"#8a95a3"}}>x=hours · y=bps</span>
                  </div>
                  <svg width={448} height={110} style={{display:"block",overflow:"visible"}}>
                    {/* Gridlines */}
                    {[[-50,0],[0,0],[25,0],[-25,0],[50,0]].map(([b])=>{
                      const y=55-(b/50)*44;
                      return <g key={b}>
                        <line x1={32} y1={y} x2={440} y2={y} stroke={b===0?(dk?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.1)"):(dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)")} strokeWidth={b===0?1:0.5} strokeDasharray={b!==0?"3 3":undefined}/>
                        <text x={28} y={y+4} textAnchor="end" fontSize={10} fill={dk?"#4a5d75":"#8a95a3"} fontFamily={mono}>{b>0?"+":""}{b}</text>
                      </g>;
                    })}
                    {/* X axis labels */}
                    {[0,4,8,12,16,20,24].map(h=>{
                      const x=32+((24-h)/24)*408;
                      return <g key={h}>
                        <line x1={x} y1={11} x2={x} y2={99} stroke={dk?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)"} strokeWidth={0.5}/>
                        <text x={x} y={108} textAnchor="middle" fontSize={10} fill={dk?"#4a5d75":"#8a95a3"} fontFamily={mono}>{h}h</text>
                      </g>;
                    })}
                    {/* Story dots */}
                    {NEWS_ACTIVE.map((n,i)=>{
                      const hrs=n.t/60;
                      const cx=32+((24-hrs)/24)*408;
                      const cy=55-(n.bps/50)*44;
                      const r=Math.min(10,Math.abs(n.bps)/10+4);
                      const fill=n.bps>8?"#34d399":n.bps<-8?"#ef4444":"#6c8198";
                      return <circle key={i} cx={Math.max(35,Math.min(438,cx))} cy={Math.max(14,Math.min(96,cy))} r={r} fill={fill} opacity={0.75}/>;
                    })}
                  </svg>
                  <div style={{display:"flex",gap:12,marginTop:2}}>
                    {[["up","#34d399"],["down","#ef4444"],["flat","#6c8198"]].map(([l,c])=><div key={l} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:"50%",background:c}}/><span style={{fontFamily:mono,fontSize:10,color:dk?"#3d5166":"#8a95a3"}}>{l}</span></div>)}
                  </div>
                </div>

                {/* 3. MOST READ */}
                <div style={{padding:"12px 16px",borderBottom:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.06)"}}>
                  <div style={{fontFamily:mono,fontSize:10,fontWeight:700,letterSpacing:"0.16em",color:dk?"#6c8198":"#4a5568",marginBottom:8}}>MOST READ · 24H</div>
                  {NEWS_ACTIVE.slice(0,5).map((n,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,height:18}}>
                      <span style={{fontFamily:mono,fontSize:11,fontWeight:800,color:"#e87d3e",minWidth:14,flexShrink:0}}>{i+1}</span>
                      <span style={{fontSize:11,color:tc,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.txt}</span>
                      <span style={{fontFamily:mono,fontSize:10,color:dk?"#4a5d75":"#8a95a3",flexShrink:0,minWidth:32,textAlign:"right"}}>{["12.4k","8.9k","7.1k","5.6k","4.8k"][i]}</span>
                    </div>
                  ))}
                </div>

                {/* 4. BY COMMODITY */}
                <div style={{padding:"12px 16px",borderBottom:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.06)"}}>
                  <div style={{fontFamily:mono,fontSize:10,fontWeight:700,letterSpacing:"0.16em",color:dk?"#6c8198":"#4a5568",marginBottom:8}}>BY COMMODITY · 24H</div>
                  {topComs.map(([com,cnt])=>{
                    const col=CC[com]||"#e87d3e";
                    const barPct=Math.max(6,cnt/maxCom*100);
                    return <div key={com} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                      <div style={{width:8,height:8,borderRadius:2,background:col,flexShrink:0}}/>
                      <span style={{fontSize:11,color:tc,minWidth:72}}>{com}</span>
                      <div style={{flex:1,height:5,background:dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)",borderRadius:2,overflow:"hidden"}}>
                        <div style={{width:barPct+"%",height:"100%",background:col,borderRadius:2,opacity:0.85}}/>
                      </div>
                      <span style={{fontFamily:mono,fontSize:10,color:dk?"#4a5d75":"#8a95a3",minWidth:14,textAlign:"right"}}>{cnt}</span>
                    </div>;
                  })}
                </div>

                {/* 5. EQUITY REACTION */}
                <div style={{padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontFamily:mono,fontSize:10,fontWeight:700,letterSpacing:"0.16em",color:dk?"#6c8198":"#4a5568"}}>EQUITY REACTION · LIVE</span>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"#ef4444",display:"block",boxShadow:"0 0 5px #ef4444",animation:"pulse 1.5s ease-in-out infinite"}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 12px"}}>
                    {equities.map(e=>(
                      <div key={e.tick} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:dk?"1px solid rgba(110,150,200,0.04)":"1px solid rgba(0,0,0,0.03)"}}>
                        <span style={{fontFamily:mono,fontSize:11,fontWeight:700,color:tc}}>{e.tick}</span>
                        <span style={{fontFamily:mono,fontSize:11,fontWeight:700,color:e.chg>=0?"#34d399":"#ef4444"}}>{e.chg>=0?"+":""}{e.chg.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                  <div style={{fontFamily:mono,fontSize:8,color:dk?"#2e3f52":"#ccc",marginTop:6,textAlign:"right"}}>Indicative · 15min delay</div>
                </div>

              </div>
            </div>;
          })()}




        </div>
      </div>
    )}
    {profileMine&&(
      <div style={{position:"absolute",top:56,left:0,right:0,bottom:0,background:dk?"#0b1623":"#f0f0f5",zIndex:30,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",height:36,borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",background:dk?"#0f1b2c":"#fff",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setProfileMine(null)} style={{background:"transparent",border:"1px solid rgba(232,125,62,0.4)",borderRadius:3,color:"#e87d3e",cursor:"pointer",fontFamily:"'SF Mono',Consolas,monospace",fontSize:"11px",fontWeight:700,letterSpacing:"0.06em",padding:"0 10px",height:26}}>← BACK</button>
            <span style={{color:dk?"rgba(110,150,200,0.25)":"rgba(0,0,0,0.15)"}}>·</span>
            <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:"11px",color:dk?"#8494a4":"#6c7a8d"}}>{profileMine.country}</span>
            <span style={{color:dk?"rgba(110,150,200,0.25)":"rgba(0,0,0,0.15)"}}>›</span>
            <span style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:"11px",fontWeight:700,color:tc}}>{profileMine.name}</span>
          </div>
          <button onClick={()=>{setProfileMine(null);setMapMode("3d");setSelMine(profileMine);setDetail(true);focusMine({name:profileMine.name,lat:profileMine.lat,lng:profileMine.lng})}} style={{background:"linear-gradient(135deg,#e87d3e,#d4652a)",border:"none",color:"#fff",borderRadius:3,padding:"0 14px",height:28,cursor:"pointer",fontFamily:"'SF Mono',Consolas,monospace",fontSize:"11px",fontWeight:700,letterSpacing:"0.06em"}}>FLY TO ON GLOBE →</button>
        </div>
        {/* Mine Header */}
        <div style={{padding:"14px 24px 0",borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",background:dk?"#0f1b2c":"#fff",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <h1 style={{margin:0,fontSize:"26px",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1}}>{profileMine.name}</h1>
              <div style={{fontFamily:"'SF Mono',Consolas,monospace",fontSize:"11px",color:dk?"#6c8198":"#4a5568",marginTop:4}}>{profileMine.company} · {profileMine.country}{profileMine.state?" · "+profileMine.state:""}</div>
              <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
                {(profileMine.commodity||[]).map(co=><span key={co} style={{fontSize:"11px",padding:"3px 10px",height:22,display:"inline-flex",alignItems:"center",borderRadius:3,fontFamily:"'SF Mono',Consolas,monospace",fontWeight:700,background:getCC([co])+"22",color:getCC([co]),border:"1px solid "+getCC([co])+"44",lineHeight:1}}>{"● "+co}</span>)}
                <span style={{fontSize:"11px",padding:"3px 10px",height:22,display:"inline-flex",alignItems:"center",borderRadius:3,fontFamily:"'SF Mono',Consolas,monospace",fontWeight:700,background:getStatusColor(profileMine.status)+"22",color:getStatusColor(profileMine.status),border:"1px solid "+getStatusColor(profileMine.status)+"44",lineHeight:1}}>{profileMine.status}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>toggleWatch(profileMine)} style={{padding:"0 14px",height:32,background:"transparent",border:dk?"1px solid rgba(110,150,200,0.15)":"1px solid rgba(0,0,0,0.10)",borderRadius:3,fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,color:watchlist.find(w=>w.name===profileMine.name)?"#e87d3e":tc2,cursor:"pointer"}}>{watchlist.find(w=>w.name===profileMine.name)?"★ WATCHED":"☆ WATCH"}</button>
              <button onClick={()=>addToCompare(profileMine)} style={{padding:"0 14px",height:32,background:"transparent",border:dk?"1px solid rgba(110,150,200,0.15)":"1px solid rgba(0,0,0,0.10)",borderRadius:3,fontFamily:"'SF Mono',Consolas,monospace",fontSize:11,color:tc2,cursor:"pointer"}}>+ COMPARE</button>
            </div>
          </div>
          {/* KPI Strip */}
          {(()=>{
            const d=MINE_DETAILS[profileMine.name]||null;
            const fsc=isMobile?1:1.0;
            const mono="'SF Mono',Consolas,monospace";
            const allKpis=[
              profileMine.description&&{l:"PRODUCTION",v:profileMine.description.split(";")[0].trim(),sub:profileMine.description.includes(";")?profileMine.description.split(";").slice(1).join(";").trim():"",spark:[82,88,91,87,93,90,88,95,92,96,94,98],delta:"+4.3%",up:true},
              profileMine.revenue&&{l:"REVENUE",v:String(profileMine.revenue).replace("~","")+" (est.)",sub:"TTM",spark:[65,70,68,75,72,78,76,82,80,86,84,90],delta:"+18.3%",up:true},
              d&&d.fin&&{l:"C1 CASH COST",v:"$"+d.fin.c1_cash.toLocaleString()+"/t",sub:"all-in sustaining",spark:[105,102,98,101,96,99,94,97,92,95,90,93],delta:"-4.2%",up:false},
              d&&d.res&&{l:"RESERVE LIFE",v:d.res.reserve_life+" years",sub:"at current rate",spark:[50,50,50,50,50,49,49,49,48,48,48,47],delta:"-6.0%",up:false},
              !d&&profileMine.reserves&&{l:"RESERVES",v:profileMine.reserves,sub:"reported",spark:[100,100,99,99,98,98,97,97,96,96,95,95],delta:"-5.0%",up:false},
            ].filter(Boolean);
            if(!allKpis.length)return null;
            const cols=Math.min(allKpis.length,isMobile?2:4);
            const sparkPath=(pts,w,h)=>{if(!pts||pts.length<2)return"";const max=Math.max(...pts),min=Math.min(...pts),rng=max-min||1;return"M"+pts.map((p,i)=>((i/(pts.length-1))*w).toFixed(1)+","+(h-(p-min)/rng*(h*0.75)-h*0.1).toFixed(1)).join(" L ")};
            return <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,borderTop:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.05)"}}>
              {allKpis.slice(0,cols).map((k,i)=><div key={k.l} style={{padding:"12px 20px 10px",borderRight:i<cols-1?(dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.05)"):"none"}}>
                <div style={{fontFamily:mono,fontSize:10,letterSpacing:"0.1em",color:dk?"#4a5d75":"#6b7280",fontWeight:600,marginBottom:4}}>{k.l}</div>
                <div style={{fontFamily:mono,fontSize:(k.v.length>12?17:22)+"px",fontWeight:800,color:tc,lineHeight:1,letterSpacing:"-0.02em",wordBreak:"break-word"}}>{k.v}</div>
                {k.sub&&<div style={{fontFamily:mono,fontSize:9,color:dk?"#4a5d75":"#7a8390",marginTop:3}}>{k.sub}</div>}
                {k.spark&&k.spark.length>1&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                  <span style={{fontFamily:mono,fontSize:10,fontWeight:700,color:k.up?"#34d399":"#f87171"}}>{k.delta}</span>
                  <svg width={isMobile?48:64} height={isMobile?18:22} style={{opacity:0.8}}>
                    <path d={sparkPath(k.spark,isMobile?48:64,isMobile?18:22)} fill="none" stroke={k.up?"#34d399":"#f87171"} strokeWidth="1.4"/>
                  </svg>
                  <span style={{fontFamily:mono,fontSize:8,color:dk?"#3d5166":"#ccc"}}>12Q</span>
                </div>}
              </div>)}
            </div>;
          })()}
        </div>
        {/* Single scrollable body — no tabs */}
        {(()=>{
          const d=MINE_DETAILS[profileMine.name]||null;
          const mono="'SF Mono',Consolas,monospace";
          const fsc=isMobile?1:1.0;
          const pnl={background:dk?"#0f1b2c":"#fff",border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)",borderRadius:4,overflow:"hidden"};
          const sh=label=><div style={{padding:"10px 18px",borderBottom:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.05)",background:dk?"rgba(255,255,255,0.015)":"rgba(0,0,0,0.02)",display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:2,height:13,borderRadius:1,background:"#e87d3e",flexShrink:0}}/>
            <span style={{fontFamily:mono,fontSize:11,fontWeight:700,color:"#e87d3e",letterSpacing:"0.1em"}}>{label}</span>
          </div>;
          const rw=(l,v,ac)=>v?<div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"7px 18px",borderBottom:dk?"1px solid rgba(110,150,200,0.04)":"1px solid rgba(0,0,0,0.03)"}}><span style={{fontSize:12,color:dk?"#6c8198":"#4a5568"}}>{l}</span><span style={{fontFamily:mono,fontSize:12,color:ac||tc,fontWeight:600,textAlign:"right",maxWidth:"60%",wordBreak:"break-word"}}>{v}</span></div>:null;
          const subSh=label=><div style={{padding:"5px 18px 4px",fontSize:9,letterSpacing:"0.1em",fontWeight:700,color:dk?"#3d5166":"#8a95a3",fontFamily:mono,borderBottom:dk?"1px solid rgba(110,150,200,0.04)":"1px solid rgba(0,0,0,0.03)",background:dk?"rgba(255,255,255,0.008)":"rgba(0,0,0,0.01)"}}>{label}</div>;
          const narrative=(()=>{const m=profileMine;const comStr=(m.commodity||[]).join(" + ");const yrStr=m.opened?" since "+m.opened:"";const depStr=m.depth?" at "+m.depth+" depth":"";const resStr=m.reserves?" with "+m.reserves+" in reserves":"";return m.notes||`${m.company}-operated ${(m.type||"").toLowerCase()} mine producing ${comStr}${depStr}${yrStr}. ${m.status} status${resStr}. Located in ${m.country}${m.state?" ("+m.state+")":""}.`;})();
          const nb=MINES.filter(m=>m.name!==profileMine.name).map(m=>({...m,dist:Math.round(6371*2*Math.asin(Math.sqrt(Math.pow(Math.sin((m.lat-profileMine.lat)*Math.PI/360),2)+Math.cos(profileMine.lat*Math.PI/180)*Math.cos(m.lat*Math.PI/180)*Math.pow(Math.sin((m.lng-profileMine.lng)*Math.PI/360),2))))})).filter(m=>m.dist<=200).sort((a,b)=>a.dist-b.dist).slice(0,6);
          const prodBars=[62,68,71,69,74,70,72,78,75,80,78,82];
          return <div style={{flex:1,overflow:"auto",padding:"16px 24px 24px"}}>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,2fr) minmax(0,1fr)",gap:14,maxWidth:1400}}>
              {/* LEFT COLUMN */}
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {/* NARRATIVE */}
                <div style={pnl}>
                  {sh("MINE OVERVIEW")}
                  <div style={{padding:"12px 18px"}}>
                    <p style={{margin:"0 0 10px",fontSize:12,lineHeight:1.7,color:tc}}>{narrative}</p>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,borderTop:dk?"1px solid rgba(110,150,200,0.06)":"1px solid rgba(0,0,0,0.05)",marginTop:4}}>
                      {[["Discovered",profileMine.discovered?String(profileMine.discovered):"—"],["Opened",profileMine.opened?String(profileMine.opened):"In Development"],["Coordinates",profileMine.lat.toFixed(3)+"°, "+profileMine.lng.toFixed(3)+"°"],MINE_PORT[profileMine.name]&&["Export Port",MINE_PORT[profileMine.name]]].filter(Boolean).map(([l,v],i)=><div key={l} style={{padding:"6px 18px",borderRight:i%2===0?(dk?"1px solid rgba(110,150,200,0.06)":"1px solid rgba(0,0,0,0.05)"):"none",borderBottom:i<2?(dk?"1px solid rgba(110,150,200,0.06)":"1px solid rgba(0,0,0,0.05)"):"none"}}>
                        <div style={{fontSize:8,color:dk?"#3d5166":"#8a95a3",fontFamily:mono,letterSpacing:"0.06em"}}>{l}</div>
                        <div style={{fontSize:11,fontFamily:mono,color:tc,fontWeight:600,marginTop:1}}>{v}</div>
                      </div>)}
                    </div>
                  </div>
                </div>
                {/* OPERATIONS */}
                <div style={pnl}>
                  {sh("OPERATIONS")}
                  {subSh("MINING METHOD")}
                  {rw("Mine Type",profileMine.type)}
                  {rw("Mining Method",profileMine.method)}
                  {rw("Depth",profileMine.depth)}
                  {rw("Employees",profileMine.employees)}
                  {d&&d.ops&&<>{d.ops.strip_ratio&&rw("Strip Ratio",d.ops.strip_ratio==="N/A (UG)"?"Underground · N/A":d.ops.strip_ratio)}{d.ops.fleet&&rw("Equipment",d.ops.fleet)}</>}
                  {subSh("PROCESSING")}
                  {d&&d.ops?<>{d.ops.mill_tpd&&rw("Mill Throughput",d.ops.mill_tpd.toLocaleString()+" tpd")}{d.ops.recovery&&rw("Recovery",d.ops.recovery+"%","#34d399")}{profileMine.grade&&rw("Head Grade",profileMine.grade)}</>:profileMine.grade&&rw("Head Grade",profileMine.grade)}
                  {subSh("INFRASTRUCTURE")}
                  {d&&d.ops?<>{d.ops.water&&rw("Water Source",d.ops.water)}{d.ops.power&&rw("Power",d.ops.power)}{d.ops.lom&&rw("Mine Life",d.ops.lom+" years")}</>:rw("Status",profileMine.status,getStatusColor(profileMine.status))}
                  {/* Production trend chart */}
                  {d&&<div style={{borderTop:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.05)"}}>
                    <div style={{padding:"10px 18px 4px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontFamily:mono,fontSize:10,fontWeight:700,color:"#e87d3e",letterSpacing:"0.08em"}}>PRODUCTION INDEX</div>
                      <div style={{fontFamily:mono,fontSize:9,color:dk?"#4a5d75":"#6b7280"}}>12 quarters · Q1 2023–Q4 2025</div>
                    </div>
                    <div style={{padding:"0 18px 14px"}}>{(()=>{
                      const w=isMobile?240:340,h=60,max=Math.max(...prodBars);
                      return <svg width={w+32} height={h+20} style={{display:"block",overflow:"visible"}}>
                        {[0,50,100].map(pct=>{const y=h-(pct/100)*(h-8)-4;return <g key={pct}><line x1={28} y1={y} x2={w+28} y2={y} stroke={dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.05)"} strokeWidth={1}/><text x={24} y={y+4} textAnchor="end" fontSize={7} fill={dk?"#3d5166":"#ccc"} fontFamily={mono}>{pct}</text></g>})}
                        {prodBars.map((v,i)=>{const bw=Math.floor(w/prodBars.length)-2,x=28+i*(bw+2),bh=Math.round((v/max)*(h-8));return <rect key={i} x={x} y={h-bh-4} width={bw} height={bh} rx={1} fill={i===prodBars.length-1?"#e87d3e":dk?"rgba(232,125,62,0.45)":"rgba(232,125,62,0.35)"}/>})}
                        <text x={28} y={h+14} fontSize={7} fill={dk?"#3d5166":"#ccc"} fontFamily={mono}>Q1 23</text>
                        <text x={w+28} y={h+14} textAnchor="end" fontSize={7} fill={dk?"#3d5166":"#ccc"} fontFamily={mono}>Q4 25</text>
                      </svg>;
                    })()}</div>
                  </div>}
                </div>
                {/* FINANCIAL */}
                <div style={pnl}>
                  {sh("FINANCIAL")}
                  {d&&d.fin?<>
                    {subSh("REVENUE & MARGINS")}
                    {rw("Est. Revenue",profileMine.revenue?String(profileMine.revenue).replace("~","")+" (est.)":"—","#a78bfa")}
                    {rw("EBITDA Margin",d.fin.ebitda_margin+"%","#34d399")}
                    {rw("ROCE",d.fin.roce+"%")}
                    {rw("Royalty Rate",d.fin.royalty_pct+"%")}
                    {/* Revenue mix */}
                    {(profileMine.commodity||[]).length>1&&(()=>{
                      const comm=profileMine.commodity||[];
                      const weights=comm.map((_,i)=>Math.max(10,100-i*22));
                      const total=weights.reduce((a,b)=>a+b,0);
                      return <div style={{padding:"10px 18px 12px",borderTop:dk?"1px solid rgba(110,150,200,0.06)":"1px solid rgba(0,0,0,0.04)"}}>
                        <div style={{fontFamily:mono,fontSize:8,letterSpacing:"0.08em",color:dk?"#4a5d75":"#6b7280",marginBottom:8}}>REVENUE MIX (EST.)</div>
                        <div style={{display:"flex",height:10,borderRadius:3,overflow:"hidden",gap:1}}>
                          {comm.map((co,i)=><div key={co} style={{flex:weights[i]/total*100,background:getCC([co])}}/>)}
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:"5px 12px",marginTop:8}}>
                          {comm.map((co,i)=>{const pct=Math.round(weights[i]/total*100);return <div key={co} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:1,background:getCC([co])}}/><span style={{fontFamily:mono,fontSize:9,color:tc}}>{co}</span><span style={{fontFamily:mono,fontSize:9,color:dk?"#4a5d75":"#6b7280"}}>{pct}%</span></div>})}
                        </div>
                      </div>;
                    })()}
                    {subSh("COST STACK")}
                    {(()=>{
                      const c1=d.fin.c1_cash,roy=Math.round(d.fin.realized_price*d.fin.royalty_pct/100),sus=Math.round(d.fin.capex_sustaining/d.ops.lom*10),aisc=d.fin.aisc;
                      const segs=[["C1 Cash",c1,"#e87d3e"],["Royalties",roy,"#d4652a"],["Sustaining",sus,"#b34e18"]];
                      const segTotal=segs.reduce((a,s)=>a+s[1],0);
                      const margin=Math.max(0,aisc-segTotal);
                      return <div style={{padding:"8px 18px 12px"}}>
                        <div style={{display:"flex",height:24,borderRadius:3,overflow:"hidden",gap:1,marginBottom:10}}>
                          {segs.map(([l,v,c])=><div key={l} style={{flex:v,background:c,display:"flex",alignItems:"center",justifyContent:"center"}}>{v/segTotal>0.12&&<span style={{fontFamily:mono,fontSize:8,color:"rgba(255,255,255,0.9)",fontWeight:700}}>${v.toLocaleString()}</span>}</div>)}
                          {margin>0&&<div style={{flex:margin,background:"rgba(52,211,153,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>{margin/aisc>0.06&&<span style={{fontFamily:mono,fontSize:8,color:"#34d399",fontWeight:700}}>margin</span>}</div>}
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:"4px 14px",marginBottom:10}}>
                          {[...segs,["AISC Total",aisc,"#e87d3e"]].map(([l,v,c],i)=><div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:i===3?2:7,borderRadius:i===3?0:2,background:c}}/><span style={{fontFamily:mono,fontSize:9,color:dk?"#6c8198":"#6b7280"}}>{l}</span><span style={{fontFamily:mono,fontSize:10,fontWeight:i===3?800:600,color:i===3?"#e87d3e":tc}}>${v.toLocaleString()}/t</span></div>)}
                        </div>
                        {/* Peer benchmark */}
                        <div style={{padding:"8px 0 0",borderTop:dk?"1px solid rgba(110,150,200,0.06)":"1px solid rgba(0,0,0,0.04)"}}>
                          <div style={{fontFamily:mono,fontSize:9,color:dk?"#4a5d75":"#6b7280",marginBottom:5,letterSpacing:"0.06em",fontWeight:600}}>C1 PEER BENCHMARK · {(profileMine.commodity||["Cu"])[0].toUpperCase()} INDUSTRY</div>
                          {(()=>{const maxV=2400,mine=d.fin.c1_cash,myPct=Math.min(97,mine/maxV*100),myQu=mine<=800?"Q1 — top quartile":mine<=1200?"Q2":mine<=1600?"Q3":"Q4 — high cost";
                          return <div>
                            <div style={{position:"relative",height:22,background:dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",borderRadius:3,overflow:"hidden"}}>
                              <div style={{position:"absolute",left:0,top:0,bottom:0,width:myPct+"%",background:"linear-gradient(90deg,#34d399 0%,#e87d3e 80%)",borderRadius:3,opacity:0.85}}/>
                              {[800,1200,1600,2100].map(v=><div key={v} style={{position:"absolute",top:0,bottom:0,left:(v/maxV*100)+"%",width:1,background:dk?"rgba(255,255,255,0.25)":"rgba(0,0,0,0.2)"}}/>)}
                              <span style={{position:"absolute",top:"50%",left:Math.min(90,myPct)+"%",transform:"translateY(-50%)",fontFamily:mono,fontSize:8,fontWeight:700,color:"#fff",paddingLeft:4,whiteSpace:"nowrap"}}>${mine.toLocaleString()}</span>
                            </div>
                            <div style={{display:"flex",justifyContent:"space-between",fontFamily:mono,fontSize:8,color:dk?"#3d5166":"#ccc",marginTop:3}}><span>$800 Q1</span><span>$1,200</span><span>$1,600</span><span>$2,100 Q4</span></div>
                            <div style={{fontFamily:mono,fontSize:10,color:"#34d399",marginTop:5,fontWeight:700}}>{myQu}</div>
                          </div>})()}
                        </div>
                      </div>
                    })()}
                    {subSh("CAPITAL")}
                    {rw("Sustaining Capex","$"+d.fin.capex_sustaining+"M / yr")}
                  </>:profileMine.revenue?<div style={{padding:"8px 18px"}}>{rw("Est. Revenue",String(profileMine.revenue).replace("~","")+" (est.)","#a78bfa")}</div>:<div style={{padding:"12px 18px",fontSize:11,color:dk?"#4a5d75":"#7a8390"}}>Financial data available for flagship mines only</div>}
                </div>
                {/* RESERVES */}
                <div style={pnl}>
                  {sh("RESERVES & RESOURCES")}
                  {d&&d.res?<>
                    <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.06)"}}>
                      {["CLASS","TONNAGE (MT)","GRADE","CONTAINED"].map(h=><th key={h} style={{padding:"7px 14px",textAlign:h==="CLASS"?"left":"right",fontFamily:mono,fontSize:9,fontWeight:700,color:dk?"#4a5d75":"#8a95a3",letterSpacing:"0.08em"}}>{h}</th>)}
                    </tr></thead><tbody>
                      {[{cls:"Proven Reserve",mt:d.res.proven_mt,gr:d.res.proven_cu,isTot:false},{cls:"Probable Reserve",mt:d.res.probable_mt,gr:d.res.probable_cu,isTot:false},{cls:"— Total Reserve",mt:d.res.total_reserve_mt,gr:d.res.total_cu,isTot:true},{cls:"Measured Resource",mt:d.res.measured_mt,gr:0,isTot:false},{cls:"Indicated Resource",mt:d.res.indicated_mt,gr:0,isTot:false},{cls:"Inferred Resource",mt:d.res.inferred_mt,gr:0,isTot:false}].map(({cls,mt,gr,isTot})=><tr key={cls} style={{borderBottom:dk?"1px solid rgba(110,150,200,0.04)":"1px solid rgba(0,0,0,0.03)",fontWeight:isTot?700:400,background:isTot?(dk?"rgba(232,125,62,0.06)":"rgba(232,125,62,0.04)"):"transparent"}}>
                        <td style={{padding:"6px 14px",fontSize:11,color:isTot?"#e87d3e":tc}}>{cls}</td>
                        <td style={{padding:"6px 14px",fontFamily:mono,fontSize:11,textAlign:"right",color:isTot?"#e87d3e":tc,fontWeight:isTot?700:500}}>{mt?mt.toLocaleString():"—"}</td>
                        <td style={{padding:"6px 14px",fontFamily:mono,fontSize:11,textAlign:"right",color:dk?"#6c8198":"#6b7280"}}>{gr?gr+"%":"—"}</td>
                        <td style={{padding:"6px 14px",fontFamily:mono,fontSize:11,textAlign:"right",color:isTot?"#e87d3e":(dk?"#a0b4c4":"#555"),fontWeight:isTot?700:500}}>{gr&&mt?(mt*gr/100).toFixed(1):"—"}</td>
                      </tr>)}
                    </tbody></table>
                    {/* Reserve depletion curve */}
                    {d.res.reserve_life&&(()=>{const rl=d.res.reserve_life,yr=new Date().getFullYear(),pts=Array.from({length:rl+1},(_,i)=>100-i*(100/rl)),w=isMobile?240:340,h=64,ox=28;
                    const pathD="M"+pts.map((v,i)=>((ox+i/rl*w).toFixed(1))+","+(h-4-(v/100)*(h-14)).toFixed(1)).join(" L ");
                    const areaD=pathD+" L "+(ox+w)+","+(h-4)+" L "+ox+","+(h-4)+" Z";
                    return <div style={{borderTop:dk?"1px solid rgba(110,150,200,0.08)":"1px solid rgba(0,0,0,0.05)"}}>
                      <div style={{padding:"10px 18px 4px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{fontFamily:mono,fontSize:10,fontWeight:700,color:"#e87d3e",letterSpacing:"0.08em"}}>RESERVE DEPLETION</div>
                        <div style={{fontFamily:mono,fontSize:9,color:dk?"#4a5d75":"#6b7280"}}>{yr}–{yr+rl}</div>
                      </div>
                      <div style={{padding:"0 18px 14px"}}>
                        <svg width={w+ox+4} height={h+18} style={{display:"block",overflow:"visible"}}>
                          <defs><linearGradient id="depGrad3" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity="0.5"/><stop offset="100%" stopColor="#34d399" stopOpacity="0.04"/></linearGradient></defs>
                          {[0,50,100].map(pct=>{const y=h-4-(pct/100)*(h-14);return <g key={pct}><line x1={ox} y1={y} x2={ox+w} y2={y} stroke={dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"} strokeWidth={1}/><text x={ox-4} y={y+4} textAnchor="end" fontSize={7} fill={dk?"#3d5166":"#ccc"} fontFamily={mono}>{pct}%</text></g>})}
                          <path d={areaD} fill="url(#depGrad3)"/>
                          <path d={pathD} fill="none" stroke="#34d399" strokeWidth="2"/>
                          <text x={ox} y={h+14} fontSize={7} fill={dk?"#3d5166":"#ccc"} fontFamily={mono}>{yr}</text>
                          <text x={ox+w} y={h+14} textAnchor="end" fontSize={7} fill={dk?"#3d5166":"#ccc"} fontFamily={mono}>{yr+rl}</text>
                        </svg>
                        <div style={{fontFamily:mono,fontSize:10,color:"#34d399",fontWeight:700,marginTop:2}}>{rl} year reserve life at current rate</div>
                      </div>
                    </div>})()}
                  </>:[profileMine.reserves&&["Reserves",profileMine.reserves],profileMine.grade&&["Grade",profileMine.grade]].filter(Boolean).filter(([,v])=>v).map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 18px",borderBottom:dk?"1px solid rgba(110,150,200,0.04)":"1px solid rgba(0,0,0,0.03)"}}><span style={{fontSize:12,color:dk?"#6c8198":"#6b7280"}}>{l}</span><span style={{fontFamily:mono,fontSize:12,color:"#34d399",fontWeight:600}}>{v}</span></div>)}
                </div>
                {/* Project pipeline */}
                {profileMine.capex&&<div style={pnl}>{sh("PROJECT PIPELINE")}
                  {[["Stage",profileMine.stage],["CAPEX",profileMine.capex?String(profileMine.capex).replace("~","")+" (est.)":null],["First Production",String(profileMine.fpDate||"TBD")],profileMine.parent&&["Expansion of",profileMine.parent]].filter(Boolean).filter(([,v])=>v).map(([l,v])=>rw(l,v,l==="CAPEX"?"#f59e0b":null))}
                </div>}
                {/* Expansion projects */}
                {(()=>{const exps=MINES.filter(p=>p.parent===profileMine.name);return exps.length>0?<div style={pnl}>{sh("EXPANSION PROJECTS")}
                  {exps.map(exp=><div key={exp.name} onClick={()=>setProfileMine(exp)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 18px",borderBottom:dk?"1px solid rgba(110,150,200,0.04)":"1px solid rgba(0,0,0,0.03)"}}>
                    <div><div style={{fontSize:12,fontWeight:700,color:"#f59e0b"}}>{exp.name}</div><div style={{fontFamily:mono,fontSize:9,color:dk?"#4a5d75":"#7a8390",marginTop:1}}>{exp.stage} · FP {exp.fpDate||"TBD"}</div></div>
                    <span style={{fontFamily:mono,fontSize:12,fontWeight:700,color:tc}}>{exp.capex}</span>
                  </div>)}
                </div>:null})()}
                {/* Provenance */}
                <div style={{padding:"8px 18px",fontSize:9,color:dk?"#2e3f52":"#8a95a3",fontFamily:mono,borderTop:dk?"1px solid rgba(110,150,200,0.06)":"1px solid rgba(0,0,0,0.04)"}}>Sources: Company segment reports, JORC, Costmine, S&P Global · Last updated {new Date().toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"})}</div>
              </div>
              {/* RIGHT COLUMN */}
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {/* Ownership */}
                <div style={pnl}>{sh("OWNERSHIP")}
                  {(()=>{const owners=profileMine.company?profileMine.company.split("/").map((o,i,arr)=>({name:o.trim(),pct:i===0?(arr.length===1?100:57.5):i===1?30:i===2?10:2.5})):[{name:"Unknown",pct:100}];const totalPct=owners.reduce((a,o)=>a+o.pct,0);
                  return <div style={{padding:"12px 18px"}}>{owners.map((o,i)=><div key={o.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{width:34,height:34,borderRadius:3,background:["#e87d3e","#60a5fa","#a78bfa","#34d399"][i]+"22",border:"1px solid "+["#e87d3e","#60a5fa","#a78bfa","#34d399"][i]+"44",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontFamily:mono,fontSize:9,fontWeight:800,color:["#e87d3e","#60a5fa","#a78bfa","#34d399"][i]}}>{Math.round(o.pct)}%</span></div>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:tc,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</div><div style={{width:(o.pct/totalPct*100)+"%",height:3,background:["#e87d3e","#60a5fa","#a78bfa","#34d399"][i],borderRadius:2,marginTop:3}}/></div>
                  </div>)}</div>})()}
                </div>
                {/* Jurisdiction risk */}
                {GOV[profileMine.country]&&(()=>{const g=GOV[profileMine.country];return <div style={pnl}>{sh("JURISDICTION RISK")}
                  <div style={{padding:"12px 18px"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:13,fontWeight:800,fontFamily:mono,color:govColor(g.reg),background:govColor(g.reg)+"18",padding:"4px 12px",borderRadius:3,border:"1px solid "+govColor(g.reg)+"44",flexShrink:0}}>{g.reg} Risk</span><div><div style={{fontSize:12,fontWeight:600}}>{profileMine.country}</div><div style={{fontSize:10,color:dk?"#6c8198":"#6b7280",fontFamily:mono}}>CPI {g.score}/100</div></div></div>
                  <div style={{fontSize:11,color:dk?"#6c8198":"#4a5568",lineHeight:1.5}}>{govLabel(g.reg)}</div></div>
                </div>})()}
                {/* Country info */}
                {COUNTRY_INFO[profileMine.country]&&(()=>{const ci=COUNTRY_INFO[profileMine.country];return <div style={pnl}>{sh("COUNTRY · "+profileMine.country.toUpperCase())}
                  {[["Population",ci.pop],["GDP",ci.gdp],["Mining % GDP",ci.mining],["Currency",ci.currency],["Top Exports",ci.topCom||ci.topCommodities]].filter(([,v])=>v).map(([l,v])=>rw(l,v))}
                </div>})()}
                {/* Nearby */}
                {nb.length>0&&<div style={pnl}>{sh("NEARBY · WITHIN 200KM")}
                  {nb.map(m=><div key={m.name} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"6px 18px",borderBottom:dk?"1px solid rgba(110,150,200,0.04)":"1px solid rgba(0,0,0,0.03)"}} onClick={()=>setProfileMine(m)}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:getCC(m.commodity),flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:tc,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div><div style={{fontSize:9,color:dk?"#4a5d75":"#7a8390",fontFamily:mono}}>{m.commodity.slice(0,2).join(" · ")} · {m.company.split("/")[0].trim()}</div></div>
                    <span style={{fontFamily:mono,fontSize:9,color:dk?"#3d5166":"#ccc",flexShrink:0}}>{m.dist}km</span>
                  </div>)}
                </div>}
                {/* Notes */}
                {profileMine.notes&&profileMine.notes!==narrative&&<div style={{padding:"10px 14px",background:"rgba(232,125,62,0.06)",borderRadius:4,borderLeft:"2px solid #e87d3e"}}>
                  <div style={{fontSize:8,letterSpacing:"0.1em",color:"#e87d3e",fontWeight:700,marginBottom:4,fontFamily:mono}}>NOTABLE</div>
                  <div style={{fontSize:11,color:tc2,lineHeight:1.6}}>{profileMine.notes}</div>
                </div>}
              </div>
            </div>
          </div>;
        })()}
      </div>
    )}


    {/* KEYBOARD SHORTCUTS */}
    {showShortcuts&&<div onClick={()=>setShowShortcuts(false)} style={{position:"absolute",inset:0,zIndex:50,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:dk?"rgba(15,27,44,0.97)":"rgba(245,245,250,0.97)",border:bdr,borderRadius:"6px",padding:"16px 20px",maxWidth:"320px",width:"100%",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <div style={{fontSize:"10px",fontWeight:600,color:"#e87d3e",letterSpacing:"0.08em",fontFamily:"'SF Mono',Consolas,monospace"}}>KEYBOARD SHORTCUTS</div>
          <button onClick={()=>setShowShortcuts(false)} style={{width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"transparent",color:tc2,border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",borderRadius:3,cursor:"pointer",padding:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </div>
        {[
          {key:"/",desc:"Open search"},
          {key:"?",desc:"Toggle this help"},
          {key:"G",desc:"Toggle governance layer"},
          {key:"S",desc:"Toggle shipping layer"},
          {key:"T",desc:"Toggle dark/light theme"},
          {key:"R",desc:"Re-centre globe"},
          {key:"Esc",desc:"Close panel / dismiss"},
        ].map(s=><div key={s.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",borderBottom:dk?"1px solid rgba(110,150,200,0.06)":"1px solid rgba(0,0,0,0.04)"}}>
          <span style={{fontSize:"11px",color:tc2,fontFamily:"'SF Mono',Consolas,monospace"}}>{s.desc}</span>
          <kbd style={{fontSize:"10px",padding:"2px 8px",borderRadius:"4px",background:dk?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)",border:dk?"1px solid rgba(255,255,255,0.12)":"1px solid rgba(0,0,0,0.1)",color:tc,fontFamily:"'SF Mono',Consolas,monospace",fontWeight:600}}>{s.key}</kbd>
        </div>)}
        <div style={{fontSize:"9px",color:tc2,opacity:0.4,marginTop:"12px",textAlign:"center",fontFamily:"'SF Mono',Consolas,monospace"}}>Scroll to zoom · Drag to rotate · Click mine to select</div>
      </div>
    </div>}
    {/* ABOUT MODAL */}
    {showAbout&&<div onClick={()=>setShowAbout(false)} style={{position:"absolute",inset:0,zIndex:50,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:dk?"rgba(15,27,44,0.97)":"rgba(245,245,250,0.97)",border:bdr,borderRadius:"6px",padding:"20px",maxWidth:"380px",width:"100%",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <h2 style={{margin:0,fontSize:"14px",color:"#e87d3e",letterSpacing:"0.18em",fontFamily:"'SF Mono',Consolas,monospace",fontWeight:700}}>MINE ATLAS</h2>
          <button onClick={()=>setShowAbout(false)} style={{width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"transparent",color:tc2,border:dk?"1px solid rgba(110,150,200,0.10)":"1px solid rgba(0,0,0,0.08)",borderRadius:3,cursor:"pointer",padding:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </div>
        <div style={{fontSize:"12px",color:tc2,lineHeight:1.7}}>
          <p style={{marginBottom:"12px"}}>An interactive 3D visualisation of {stats.mines} major mining operations and {stats.projects||71} active development projects across {stats.countries} countries, covering {stats.commodities} commodities.</p>
          <p style={{marginBottom:"12px"}}>Filter by continent, country, commodity, company, mine type, or mining method. Tap any mine marker or sidebar entry to view detailed information. Switch to the Projects tab to explore the global development pipeline by stage, commodity, and capex.</p>
          <p style={{marginBottom:"12px",fontSize:"11px",color:tc2}}><strong style={{color:tc}}>Controls:</strong> Drag to rotate · Scroll/pinch to zoom · <span style={{color:"#e87d3e",fontFamily:"monospace"}}>/</span> to search · <span style={{color:"#e87d3e",fontFamily:"monospace"}}>Esc</span> to close panels</p>
          <p style={{marginBottom:"0",fontSize:"11px",color:tc2}}><strong style={{color:tc}}>Data:</strong> {stats.mines} mines · 71 projects · {stats.countries} countries · {stats.commodities} commodities. Production, reserve, and financial figures are approximate and sourced from publicly available company reports, regulatory filings, and industry disclosures. Data may not reflect the most recent operational changes.</p>
        </div>
      </div>
    </div>}
    {/* FEEDBACK MODAL */}
    {showFeedback&&<div onClick={()=>{setShowFeedback(false);setFormStatus(null)}} style={{position:"absolute",inset:0,zIndex:50,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:dk?"rgba(15,27,44,0.97)":"rgba(245,245,250,0.97)",border:bdr,borderRadius:"12px",padding:"24px",maxWidth:"420px",width:"100%",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <h2 style={{margin:0,fontSize:"15px",color:"#e87d3e",letterSpacing:"1px"}}>Send Feedback</h2>
          <button onClick={()=>{setShowFeedback(false);setFormStatus(null)}} style={{background:dk?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.75)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",color:tc2,borderRadius:"5px",padding:"3px 8px",cursor:"pointer",fontSize:"12px",fontFamily:"inherit"}}>✕</button>
        </div>
        {formStatus?.type==="feedback"&&formStatus.status==="success"?
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:"28px",marginBottom:"8px"}}>✓</div>
            <div style={{fontSize:"14px",color:"#4CAF50",fontWeight:600}}>Thanks for your feedback!</div>
          </div>
        :<div>
          <p style={{fontSize:"12px",color:tc2,marginBottom:"16px",lineHeight:1.5}}>Help us improve Mine Atlas. Share what you like, what's broken, or what you'd like to see next.</p>
          {(()=>{
            const refs={rating:React.createRef(),message:React.createRef(),email:React.createRef()};
            return <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div>
                <div style={{fontSize:"10px",color:tc2,fontWeight:600,letterSpacing:"1px",marginBottom:"6px"}}>RATING</div>
                <div style={{display:"flex",gap:"6px"}}>
                  {["⭐ Love it","👍 Good","😐 OK","👎 Needs work"].map((r,i)=>
                    <button key={i} ref={i===0?refs.rating:undefined} data-rating={r.split(" ").slice(1).join(" ")}
                      onClick={e=>{e.currentTarget.parentElement.querySelectorAll("button").forEach(b=>b.style.background=dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)");e.currentTarget.style.background="rgba(232,125,62,0.2)";e.currentTarget.parentElement.dataset.selected=r}}
                      style={{fontSize:"11px",padding:"6px 10px",borderRadius:"6px",background:dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",border:dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.08)",color:tc2,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{r}</button>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:"10px",color:tc2,fontWeight:600,letterSpacing:"1px",marginBottom:"6px"}}>MESSAGE</div>
                <textarea ref={refs.message} rows={4} placeholder="What's on your mind..." style={{width:"100%",padding:"10px 12px",background:dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",border:dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.08)",borderRadius:"8px",color:tc,fontSize:"12px",fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:"10px",color:tc2,fontWeight:600,letterSpacing:"1px",marginBottom:"6px"}}>EMAIL <span style={{fontWeight:400,opacity:0.6}}>(optional)</span></div>
                <input ref={refs.email} type="email" placeholder="you@example.com" style={{width:"100%",padding:"8px 12px",background:dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",border:dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.08)",borderRadius:"8px",color:tc,fontSize:"12px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
              </div>
              {formStatus?.type==="feedback"&&formStatus.status==="error"&&<div style={{fontSize:"11px",color:"#F44336"}}>Could not send — please check your connection and try again.</div>}
              <button disabled={formStatus?.status==="submitting"} onClick={()=>{
                const msg=refs.message.current?.value;
                if(!msg||!msg.trim()){refs.message.current?.focus();return}
                const ratingEl=refs.rating.current?.parentElement;
                submitForm(FORMSPREE_FEEDBACK,{rating:ratingEl?.dataset?.selected||"Not rated",message:msg.trim(),email:refs.email.current?.value||"",_subject:"Mine Atlas — Feedback"},"feedback");
              }} style={{padding:"10px",borderRadius:"8px",background:formStatus?.status==="submitting"?"rgba(232,125,62,0.08)":"rgba(232,125,62,0.15)",border:"1px solid rgba(232,125,62,0.3)",color:"#e87d3e",fontSize:"13px",fontWeight:700,cursor:formStatus?.status==="submitting"?"wait":"pointer",fontFamily:"inherit",letterSpacing:"0.5px",transition:"all 0.15s",opacity:formStatus?.status==="submitting"?0.6:1}}>{formStatus?.status==="submitting"?"Sending...":"Send Feedback"}</button>
            </div>;
          })()}
        </div>}
      </div>
    </div>}
    {/* SUGGEST DATA UPDATE MODAL */}
    {showSuggest&&<div onClick={()=>{setShowSuggest(false);setFormStatus(null)}} style={{position:"absolute",inset:0,zIndex:50,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:dk?"rgba(15,27,44,0.97)":"rgba(245,245,250,0.97)",border:bdr,borderRadius:"12px",padding:"24px",maxWidth:"460px",width:"100%",backdropFilter:"blur(20px)",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <h2 style={{margin:0,fontSize:"15px",color:"#e87d3e",letterSpacing:"1px"}}>Suggest Data Update</h2>
          <button onClick={()=>{setShowSuggest(false);setFormStatus(null)}} style={{background:dk?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.75)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",color:tc2,borderRadius:"5px",padding:"3px 8px",cursor:"pointer",fontSize:"12px",fontFamily:"inherit"}}>✕</button>
        </div>
        {formStatus?.type==="suggest"&&formStatus.status==="success"?
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:"28px",marginBottom:"8px"}}>✓</div>
            <div style={{fontSize:"14px",color:"#4CAF50",fontWeight:600}}>Suggestion submitted — thank you!</div>
            <div style={{fontSize:"11px",color:tc2,marginTop:"6px"}}>We'll review and update if verified.</div>
          </div>
        :<div>
          <p style={{fontSize:"12px",color:tc2,marginBottom:"16px",lineHeight:1.5}}>Spotted outdated or incorrect data? Help us keep Mine Atlas accurate. All suggestions are reviewed before publishing.</p>
          {(()=>{
            const refs={mine:React.createRef(),field:React.createRef(),current:React.createRef(),suggested:React.createRef(),source:React.createRef(),email:React.createRef(),notes:React.createRef()};
            const inputStyle={width:"100%",padding:"8px 12px",background:dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",border:dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.08)",borderRadius:"8px",color:tc,fontSize:"12px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
            const labelStyle={fontSize:"10px",color:tc2,fontWeight:600,letterSpacing:"1px",marginBottom:"5px"};
            return <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div>
                <div style={labelStyle}>MINE NAME</div>
                <input ref={refs.mine} list="mine-list" placeholder="Search for a mine..." style={inputStyle}/>
                <datalist id="mine-list">{MINES.map(m=><option key={m.name} value={m.name}/>)}</datalist>
              </div>
              <div>
                <div style={labelStyle}>FIELD TO UPDATE</div>
                <select ref={refs.field} style={{...inputStyle,appearance:"auto"}}>
                  <option value="">Select a field...</option>
                  {["Company / Owner","Production figures","Revenue","Employees","Depth","Reserves","Mine type","Mining method","Status","Coordinates / Location","Commodity","Discovered / Opened date","Other"].map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:"10px"}}>
                <div style={{flex:1}}>
                  <div style={labelStyle}>CURRENT VALUE</div>
                  <input ref={refs.current} placeholder="What it says now..." style={inputStyle}/>
                </div>
                <div style={{flex:1}}>
                  <div style={labelStyle}>SUGGESTED VALUE</div>
                  <input ref={refs.suggested} placeholder="What it should be..." style={inputStyle}/>
                </div>
              </div>
              <div>
                <div style={labelStyle}>SOURCE / EVIDENCE</div>
                <input ref={refs.source} placeholder="Link to annual report, news article, etc." style={inputStyle}/>
              </div>
              <div>
                <div style={labelStyle}>ADDITIONAL NOTES <span style={{fontWeight:400,opacity:0.6}}>(optional)</span></div>
                <textarea ref={refs.notes} rows={2} placeholder="Any context that helps verify..." style={{...inputStyle,resize:"vertical"}}/>
              </div>
              <div>
                <div style={labelStyle}>YOUR EMAIL <span style={{fontWeight:400,opacity:0.6}}>(optional — for follow-up)</span></div>
                <input ref={refs.email} type="email" placeholder="you@example.com" style={inputStyle}/>
              </div>
              {formStatus?.type==="suggest"&&formStatus.status==="error"&&<div style={{fontSize:"11px",color:"#F44336"}}>Could not send — please check your connection and try again.</div>}
              <button disabled={formStatus?.status==="submitting"} onClick={()=>{
                const mine=refs.mine.current?.value;
                const field=refs.field.current?.value;
                const suggested=refs.suggested.current?.value;
                if(!mine||!mine.trim()){refs.mine.current?.focus();return}
                if(!field){refs.field.current?.focus();return}
                if(!suggested||!suggested.trim()){refs.suggested.current?.focus();return}
                submitForm(FORMSPREE_SUGGEST,{mine:mine.trim(),field,current_value:refs.current.current?.value||"",suggested_value:suggested.trim(),source:refs.source.current?.value||"",notes:refs.notes.current?.value||"",email:refs.email.current?.value||"",_subject:`Mine Atlas — Data Update: ${mine.trim()} (${field})`},"suggest");
              }} style={{padding:"10px",borderRadius:"8px",background:formStatus?.status==="submitting"?"rgba(232,125,62,0.08)":"rgba(232,125,62,0.15)",border:"1px solid rgba(232,125,62,0.3)",color:"#e87d3e",fontSize:"13px",fontWeight:700,cursor:formStatus?.status==="submitting"?"wait":"pointer",fontFamily:"inherit",letterSpacing:"0.5px",transition:"all 0.15s",opacity:formStatus?.status==="submitting"?0.6:1}}>{formStatus?.status==="submitting"?"Submitting...":"Submit Suggestion"}</button>
            </div>;
          })()}
        </div>}
      </div>
    </div>}
    <style>{`
      @keyframes fadeHint{from{opacity:0;transform:translate(-50%,-50%) scale(0.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      @keyframes pulse{0%{opacity:1}50%{opacity:0.4}100%{opacity:1}}
      @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
      @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:${dk?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"};border-radius:2px}
      select option{background:${dk?"#0f1926":"#f0f0f5"};color:${dk?"#c8d6e5":"#1a1a2e"}}
      input::placeholder{color:${dk?"rgba(180,195,210,0.5)":"rgba(100,100,120,0.5)"}}
      .dualSlider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:#e87d3e;cursor:pointer;pointer-events:auto;border:2px solid ${dk?"#fff":"#333"};box-shadow:0 0 4px rgba(0,0,0,0.4);margin-top:-5px}
      .dualSlider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#e87d3e;cursor:pointer;pointer-events:auto;border:2px solid ${dk?"#fff":"#333"};box-shadow:0 0 4px rgba(0,0,0,0.4)}
      .dualSlider::-webkit-slider-runnable-track{height:4px;background:transparent}
      .dualSlider::-moz-range-track{height:4px;background:transparent}
    `}</style>
  </div>);
}

export default function MiningGlobeApp(){
  return <GlobeErrorBoundary><MiningGlobe/></GlobeErrorBoundary>;
}
