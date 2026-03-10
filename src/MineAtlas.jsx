import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer } from "react";
import { AmbientLight, BackSide, BufferGeometry, CanvasTexture, Color, DirectionalLight, DoubleSide, Float32BufferAttribute, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial, PerspectiveCamera, Points, PointsMaterial, Raycaster, RingGeometry, Scene, SphereGeometry, Sprite, SpriteMaterial, Vector2, Vector3, WebGLRenderer } from "three";

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
    if(this.state.hasError)return <div style={{width:"100vw",height:"100vh",background:"#080c14",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <LogoIcon size={56}/>
      <div style={{fontSize:"16px",color:"#e87d3e",fontWeight:700,letterSpacing:"2px"}}>MINE ATLAS</div>
      <div style={{fontSize:"13px",color:"#8494a4",maxWidth:"400px",textAlign:"center",lineHeight:1.6}}>Unable to initialise 3D globe. Your browser may not support WebGL, or the GPU is unavailable.</div>
      <button onClick={()=>window.location.reload()} style={{marginTop:"8px",padding:"10px 24px",borderRadius:"8px",background:"rgba(232,125,62,0.15)",border:"1px solid rgba(232,125,62,0.3)",color:"#e87d3e",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Reload Page</button>
    </div>;
    return this.props.children;
  }
}

// ===============================================
// FILTER STORE - centralized state via useReducer
// ===============================================
const INIT_FILTERS={continent:"All",country:"All",commodity:"All",company:"All",mineType:"All",miningMethod:"All",search:""};
function filterReducer(state,action){
  switch(action.type){
    case "SET":return{...state,[action.key]:action.value};
    case "CLEAR":return{...INIT_FILTERS};
    default:return state;
  }
}

const M=[{n:"Agnew-Lawlers",c:"Australia",s:"Western Australia",r:"Goldfields",la:-27.58,ln:120.64,co:["Gold"],pc:"Gold",cp:"Gold Fields",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of Gold Fields Australia region",em:"~600",dp:"~1000m",d:1895,o:1977,no:"Long-life underground gold",rv:"~$310M",dp_meters:1000,em_count:600,pr_total_tonnes:2500000,pr_au_oz_pa:130000,rv_usd:310600000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Ahafo",c:"Ghana",s:"Brong-Ahafo",r:"Africa",la:7,ln:-2.35,co:["Gold"],pc:"Gold",cp:"Newmont",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"798koz Au (CY2024, Ahafo South)",em:"~5,000",dp:"~500m",d:2000,o:2006,no:"Includes Ahafo North expansion",rv:"~$1.9B",dp_meters:500,em_count:5000,pr_total_tonnes:20000000,pr_au_oz_pa:798000,rv_usd:1906400000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Aitik",c:"Sweden",s:"Norrbotten",r:"Europe",la:67.07,ln:20.96,co:["Copper","Gold","Silver"],pc:"Copper",cp:"Boliden",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Boliden Mines ~36Mt ore milled; ~70kt Cu",em:"~800",dp:"~450m",d:1932,o:1968,rs:"~700Mt",no:"Largest OP copper mine in Europe",rv:"~$665M",dp_meters:450,em_count:800,pr_total_tonnes:36000000,pr_cu_tpa:70000,rs_tonnes:700000000,rv_usd:665000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Aljustrel",c:"Portugal",r:"Europe",la:37.88,ln:-8.16,co:["Zinc","Copper"],pc:"Copper",cp:"Almina",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Zn-Cu; Portugal",em:"~800",dp:"~700m",d:1200,o:1850,rv:"~$95M",dp_meters:700,em_count:800,pr_total_tonnes:2000000,pr_cu_tpa:10000,pr_zn_tpa:30000,rv_usd:95000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Allan",c:"Canada",s:"Saskatchewan",r:"North America",la:51.98,ln:-105.97,co:["Potash"],pc:"Potash",cp:"Nutrien",t:"Underground",m:"Longwall",st:"Operating",pr:"Part of Nutrien potash ~14Mt KCl",em:"~600",dp:"~1000m",d:1954,o:1968,rv:"~$750M",dp_meters:1000,em_count:600,pr_total_tonnes:14000000,pr_potash_mt:2,rv_usd:750000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Amandelbult",c:"South Africa",s:"Limpopo",r:"Africa",la:-24.82,ln:27.77,co:["PGMs","Nickel","Copper"],pc:"Copper",cp:"Anglo American Platinum",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"PGMs; UG Merensky/UG2",em:"~10,000",dp:"~1200m",d:1919,o:1925,rs:"~150Mt",no:"Merensky & UG2 reef mining",rv:"~$237M",dp_meters:1200,em_count:10000,pr_total_tonnes:5000000,pr_ni_tpa:5000,rs_tonnes:150000000,rv_usd:237500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Ambatovy",c:"Madagascar",s:"Moramanga",r:"Africa",la:-18.82,ln:48.43,co:["Nickel","Cobalt"],pc:"Nickel",cp:"Sumitomo / Korea Resources",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni-Co; Madagascar; hydromet",em:"~5,000",d:2003,o:2012,rs:"~120Mt",no:"$8B+ capital cost, largest investment in Madagascar",gr:"1.0% Ni, 0.1% Co",rv:"~$742M",em_count:5000,pr_total_tonnes:6000000,pr_ni_tpa:45000,rs_tonnes:120000000,rv_usd:742500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"Andina",c:"Chile",s:"Valparaíso",r:"Latin America",la:-33.15,ln:-70.27,co:["Copper","Molybdenum"],pc:"Copper",cp:"Codelco",t:"Underground",m:"Block / Panel Caving",st:"Operating",pr:"Part of Codelco total; open pit + UG",em:"~2,500",dp:"~3800m",d:1920,o:1970,rv:"~$1.4B",dp_meters:3800,em_count:2500,pr_total_tonnes:60000000,pr_cu_tpa:180000,rv_usd:1425000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Antamina",c:"Peru",s:"Ancash",r:"Latin America",la:-9.57,ln:-77.05,co:["Copper","Zinc","Molybdenum"],pc:"Copper",cp:"BHP / Glencore / Teck / Mitsubishi",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"144kt Cu; 103kt Zn; 1,822t Mo (BHP 33.75% share)",em:"~3,500",dp:"~600m",d:1860,o:2001,rs:"~1.5Bt",no:"Largest Cu-Zn mine, at 4,300m",gr:"1.0% Cu, 1.0% Zn",rv:"~$1.4B",dp_meters:600,em_count:3500,pr_total_tonnes:130000000,pr_cu_tpa:144000,pr_zn_tpa:100000,rs_tonnes:1500000000,rv_usd:1368000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Appin",c:"Australia",s:"New South Wales",r:"Asia-Pacific",la:-34.2,ln:150.8,co:["Coal (Met)"],pc:"Coal (Met)",cp:"South32",t:"Underground",m:"Longwall",st:"Operating",pr:"Met coal; Illawarra Metallurgical Coal",em:"~700",dp:"~500m",d:1960,o:1962,rv:"~$1.8B",dp_meters:500,em_count:700,pr_total_tonnes:7000000,pr_coal_mt:7,rv_usd:1750000000,pr_year:"FY2025",src_type:"Company",confidence:"High",dq:"B"},{n:"Bagdad",c:"United States",s:"Arizona",r:"North America",la:34.58,ln:-113.21,co:["Copper","Molybdenum"],pc:"Copper",cp:"Freeport-McMoRan",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of FCX Americas Cu production",em:"~2,000",dp:"~400m",d:1882,o:1928,rs:"~2.0Bt",no:"140+ years of mining",rv:"~$950M",dp_meters:400,em_count:2000,pr_total_tonnes:130000000,pr_cu_tpa:70000,rs_tonnes:2000000000,rv_usd:950000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Bailadila",c:"India",s:"Chhattisgarh",r:"South Asia",la:18.65,ln:81.25,co:["Iron Ore"],pc:"Iron Ore",cp:"NMDC",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Iron ore; India NMDC ~35Mt",em:"~5,000",dp:"~100m",d:1961,o:1968,rv:"~$3.9B",dp_meters:100,em_count:5000,pr_total_tonnes:35000000,pr_fe_mt:35,rv_usd:3850000000,pr_year:"FY2024",src_type:"Government",confidence:"High",dq:"B"},{n:"Bangka Tin",c:"Indonesia",s:"Bangka",r:"Asia-Pacific",la:-2.1,ln:106.11,co:["Tin"],pc:"Tin",cp:"PT Timah",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Sn; Indonesia; ~50kt Sn",em:"~3,000",d:1709,o:1850,no:"World's second largest tin producer",rv:"~$1.4B",em_count:3000,pr_total_tonnes:2000000,pr_sn_kt:50,rv_usd:1425000000,pr_year:"CY2024",src_type:"Government",confidence:"Medium",dq:"B"},{n:"Barro Alto",c:"Brazil",s:"Goiás",r:"Latin America",la:-14.97,ln:-48.96,co:["Nickel"],pc:"Nickel",cp:"Anglo American",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ferronickel; part of Anglo Ni ops",em:"~1,200",dp:"~80m",d:1960,o:2011,rv:"~$330M",dp_meters:80,em_count:1200,pr_total_tonnes:5000000,pr_ni_tpa:20000,rv_usd:330000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Batu Hijau",c:"Indonesia",s:"West Nusa Tenggara",r:"Asia-Pacific",la:-8.97,ln:116.87,co:["Copper","Gold"],pc:"Copper",cp:"PT Amman Mineral Nusa Tenggara",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Au; Indonesia",em:"~8,000",dp:"~500m",d:1987,o:1999,rs:"~1.5Bt",no:"IPO valued company at ~$30B",gr:"0.4% Cu",rv:"~$808M",dp_meters:500,em_count:8000,pr_total_tonnes:35000000,pr_au_oz_pa:100000,pr_cu_tpa:60000,rs_tonnes:1500000000,rv_usd:808900000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Bayan Obo",c:"China",s:"Inner Mongolia",r:"Asia-Pacific",la:41.78,ln:109.97,co:["Rare Earths","Iron Ore"],pc:"Rare Earths",cp:"Baotou Steel / Northern Rare Earth",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"World's largest REE deposit; China",em:"~10,000",dp:"~100m",d:1927,o:1957,rs:"~600Mt",no:"World's largest rare earth deposit, supplies ~60% of global REE",gr:"3-5% REO",rv:"~$750M",dp_meters:100,em_count:10000,pr_total_tonnes:5000000,pr_reo_kt:60,rs_tonnes:600000000,rv_usd:750000000,pr_year:"CY2024",rs_year:"2024",src_type:"Government",confidence:"Medium",dq:"A"},{n:"Beatrix",c:"South Africa",s:"Free State",r:"Africa",la:-28.26,ln:26.79,co:["Gold"],pc:"Gold",cp:"Sibanye-Stillwater",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"SA gold ops",em:"~3,500",dp:"~2200m",d:1938,o:1953,rv:"~$597M",dp_meters:2200,em_count:3500,pr_total_tonnes:5000000,pr_au_oz_pa:250000,rv_usd:597200000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Benguerir",c:"Morocco",r:"Africa",la:32.23,ln:-7.95,co:["Phosphate"],pc:"Phosphate",cp:"OCP Group",t:"Open Pit",m:"Dragline / Strip Mining",st:"Operating",pr:"Phosphate; Morocco",em:"~3,000",dp:"~50m",d:1978,o:1980,rv:"~$3.0B",dp_meters:50,em_count:3000,pr_total_tonnes:30000000,pr_phos_mt:10,rv_usd:3000000000,pr_year:"CY2024",src_type:"Government",confidence:"High",dq:"B"},{n:"Berezniki",c:"Russia",s:"Perm Krai",r:"CIS",la:59.41,ln:56.8,co:["Potash"],pc:"Potash",cp:"Uralkali",t:"Underground",m:"Longwall",st:"Operating",pr:"Potash; Russia; Uralkali ~12Mt KCl total",em:"~8,000",dp:"~400m",d:1906,o:1932,no:"Sanctions limiting info",rv:"~$3.6B",dp_meters:400,em_count:8000,pr_total_tonnes:12000000,pr_potash_mt:12,rv_usd:3600000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Bingham Canyon",c:"United States",s:"Utah",r:"North America",la:40.52,ln:-112.15,co:["Copper","Gold","Silver","Molybdenum"],pc:"Copper",cp:"Rio Tinto (Kennecott)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Impacted by wall movement; ~50kt Cu lost in 2024; part of total mined Cu ~660kt",em:"~2,200",dp:"~1200m",d:1848,o:1906,rs:"~1.5Bt",no:"South wall geotechnical issues limited ore access in 2024",rv:"~$475M",dp_meters:1200,em_count:2200,pr_total_tonnes:120000000,pr_cu_tpa:50000,rs_tonnes:1500000000,rv_usd:475000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Bisha",c:"Eritrea",s:"Gash-Barka",r:"Africa",la:15.37,ln:37.62,co:["Copper","Zinc","Gold","Silver"],pc:"Copper",cp:"Zijin Mining (via Nevsun acquisition)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Zn; Eritrea",em:"~1,500",dp:"~200m",d:2005,o:2011,rs:"~20Mt",no:"Transitioning to base metals",rv:"~$380M",dp_meters:200,em_count:1500,pr_total_tonnes:3000000,pr_cu_tpa:40000,pr_zn_tpa:20000,rs_tonnes:20000000,rv_usd:380000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"Blackwater",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-23.59,ln:148.88,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Whitehaven Coal (acquired Apr 2024)",t:"Open Pit",m:"Dragline / Strip Mining",st:"Operating",pr:"3.6Mt met coal (BHP share, pre-divestment Apr 2024)",em:"~1,500",dp:"~150m",d:1957,o:1967,rs:"~700Mt",no:"Divested by BHP to Whitehaven Coal on 2 April 2024",rv:"~$900M",dp_meters:150,em_count:1500,pr_total_tonnes:3600000,pr_coal_mt:3.6,rs_tonnes:700000000,rv_usd:900000000,pr_year:"FY2024 (partial)",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Boddington",c:"Australia",s:"Western Australia",r:"Peel",la:-32.75,ln:116.37,co:["Gold","Copper"],pc:"Gold",cp:"Newmont",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"590koz Au; 18kt Cu (CY2024)",em:"~2,500",dp:"~400m",d:1980,o:2009,no:"Australia's largest gold mine by production",gr:"0.7g/t Au, 0.1% Cu",rv:"~$1.3B",dp_meters:400,em_count:2500,pr_total_tonnes:25000000,pr_au_oz_pa:590000,pr_cu_tpa:18000,rv_usd:1313300000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Boke",c:"Guinea",r:"Africa",la:10.93,ln:-14.3,co:["Bauxite"],pc:"Bauxite",cp:"SMB-Winning Consortium",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Bauxite; Guinea; ~40Mt+",em:"~2,000",dp:"~50m",d:1952,o:1973,no:"One of world's largest bauxite operations",rv:"~$2.0B",dp_meters:50,em_count:2000,pr_total_tonnes:40000000,pr_baux_mt:40,rv_usd:2000000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Boliden Area",c:"Sweden",s:"Västerbotten",r:"Europe",la:64.87,ln:20.37,co:["Zinc","Copper","Gold"],pc:"Copper",cp:"Boliden",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of Boliden Mines; Zn-Cu-Au complex",em:"~500",dp:"~1250m",d:1924,o:1924,gr:"3% Zn",rv:"~$114M",dp_meters:1250,em_count:500,pr_total_tonnes:3000000,pr_cu_tpa:8000,pr_zn_tpa:60000,rv_usd:114000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Bor",c:"Serbia",s:"Bor District",la:44.07,ln:22.1,co:["Copper","Gold"],pc:"Copper",cp:"Zijin Mining (acquired RTB Bor)",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Cu-Au; Serbia; expansion underway",em:"~5,000",dp:"~600m",d:1904,o:1904,rs:"~1.0Bt",no:"120+ years of mining",gr:"0.3% Cu",rv:"~$190M",dp_meters:600,em_count:5000,pr_total_tonnes:5000000,pr_cu_tpa:80000,rs_tonnes:1000000000,rv_usd:190000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Brockman 4",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.34,ln:117.33,co:["Iron Ore"],pc:"Iron Ore",cp:"Rio Tinto",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Pilbara operations: 328Mt total (100% basis CY2024)",em:"~700",dp:"~100m",d:1961,o:2010,rs:"~400Mt",no:"Heavy autonomous vehicle deployment",rv:"~$2.8B",dp_meters:100,em_count:700,pr_total_tonnes:25000000,pr_fe_mt:25,rs_tonnes:400000000,rv_usd:2750000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Broken Hill",c:"Australia",s:"New South Wales",r:"Far West",la:-31.95,ln:141.47,co:["Zinc","Lead","Silver"],pc:"Zinc",cp:"CBH Resources / Perilya",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Zn-Pb-Ag; historic mine; small scale",em:"~200",dp:"~800m",d:1883,o:1885,rs:"~10Mt",no:"Birthplace of BHP, mining since 1885",dp_meters:800,em_count:200,pr_total_tonnes:500000,pr_zn_tpa:20000,rs_tonnes:10000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Low",dq:"A"},{n:"Brucejack",c:"Canada",s:"British Columbia",r:"North America",la:56.47,ln:-130.15,co:["Gold","Silver"],pc:"Gold",cp:"Newmont",t:"Underground",m:"Open Stoping",st:"Operating",pr:"249koz Au (CY2024; acquired via Newcrest)",em:"~1,000",dp:"~500m",d:2010,o:2017,no:"Extremely high-grade veins",gr:"6.0g/t Au",rv:"~$594M",dp_meters:500,em_count:1000,pr_total_tonnes:14000000,pr_au_oz_pa:249000,rv_usd:594900000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Buenavista del Cobre",c:"Mexico",s:"Sonora",r:"Latin America",la:30.96,ln:-109.9,co:["Copper","Molybdenum"],pc:"Copper",cp:"Southern Copper (Grupo México)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Mo; ~400kt Cu; Mexico's largest Cu mine",em:"~3,500",dp:"~400m",d:1899,o:1970,rs:"~5.0Bt",no:"125+ years of production",gr:"0.4% Cu",rv:"~$3.8B",dp_meters:400,em_count:3500,pr_total_tonnes:100000000,pr_cu_tpa:400000,rs_tonnes:5000000000,rv_usd:3800000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Bulyanhulu",c:"Tanzania",s:"Shinyanga",r:"Africa",la:-3.3,ln:31.8,co:["Gold"],pc:"Gold",cp:"Barrick Gold (84%)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of Africa & ME region (Barrick 84%); new decline development commenced",em:"~3,000",dp:"~1200m",d:1994,o:2001,no:"Deep narrow-vein gold",rv:"~$358M",dp_meters:1200,em_count:3000,pr_total_tonnes:1500000,pr_au_oz_pa:150000,rv_usd:358400000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"CSA (Cobar)",cp:"Harmony Gold",c:"Australia",s:"New South Wales",r:"Cobar",la:-31.48,ln:145.83,co:['Copper','Silver'],pc:"Copper",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Cu-Ag; NSW UG",em:"~400",dp:"~1900m",d:1869,o:1965,rs:"~5Mt",rv:"~$380M",no:"\"CSA\" stands for Cornish, Scottish, and Australian, honoring the nationalities of the original mine owners in the 1800s",dp_meters:1900,em_count:500,pr_total_tonnes:3000000,pr_cu_tpa:40000,rs_tonnes:5000000,rv_usd:380000000,pr_year:"FY2024",rs_year:"2024.0",src_type:"Company",confidence:"High",dq:"A"},{n:"Cadia Valley",cp:"Newmont",c:"Australia",s:"New South Wales",r:"Orange",la:-33.47,ln:148.99,co:['Gold','Copper'],pc:"Gold",t:"Underground",m:"Sub-level Caving",st:"Operating",pr:"464koz Au; ~65kt Cu (CY2024)",em:"~2,000",dp:"~1600m",d:1992,o:1998,gr:"0.3% Cu, 0.6g/t Au",rv:"~$1.1B",no:"Australia's largest gold mine, world-class cave operation",dp_meters:1600,em_count:2000,pr_total_tonnes:28000000,pr_cu_tpa:65000,pr_au_oz_pa:464000,rv_usd:1108500000,pr_year:"CY2024",rs_year:"2024.0",src_type:"Company",confidence:"High",dq:"B"},{n:"Canadian Malartic",c:"Canada",s:"Quebec",r:"North America",la:48.13,ln:-78.13,co:["Gold"],pc:"Gold",cp:"Agnico Eagle Mines (100%)",t:"Open Pit & Underground",m:"Open Stoping",st:"Operating",pr:"Part of AEM total ~3.5Moz Au (CY2024 record); Odyssey UG advancing",em:"~1,200",dp:"~300m",d:2007,o:2011,no:"Odyssey UG expansion adds decades",gr:"1.0g/t Au",rv:"~$1.8B",dp_meters:300,em_count:1200,pr_total_tonnes:26000000,pr_au_oz_pa:3500000,rv_usd:1792000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Cananea",c:"Mexico",s:"Sonora",r:"Latin America",la:30.95,ln:-110.3,co:["Copper","Molybdenum"],pc:"Copper",cp:"Southern Copper (Grupo México)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Mo; part of Southern Copper Mexico",em:"~3,500",dp:"~500m",d:1899,o:1906,rs:"~3.0Bt",no:"125+ year mining history",gr:"0.4% Cu",rv:"~$1.9B",dp_meters:500,em_count:3500,pr_total_tonnes:80000000,pr_cu_tpa:200000,rs_tonnes:3000000000,rv_usd:1900000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Cannington",cp:"South32",c:"Australia",s:"Queensland",r:"North West QLD",la:-21.87,ln:140.91,co:['Silver','Lead','Zinc'],pc:"Zinc",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Ag-Pb-Zn; part of South32 portfolio",em:"~500",dp:"~700m",d:1990,o:1997,rs:"~30Mt",gr:"5% Pb, 2% Zn, 200g/t Ag",no:"One of world's largest silver-lead mines",dp_meters:700,em_count:500,pr_total_tonnes:3000000,pr_zn_tpa:30000,rs_tonnes:30000000,pr_year:"CY2024/FY2025",rs_year:"2024.0",src_type:"Company",confidence:"High",dq:"A"},{n:"Carajás S11D",c:"Brazil",s:"Pará",r:"Latin America",la:-6.41,ln:-50.04,co:["Iron Ore"],pc:"Iron Ore",cp:"Vale",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"83Mt iron ore (record CY2024)",em:"~3,000",dp:"~100m",d:1967,o:2016,rs:"~10.0Bt",no:"World's largest iron ore mine, ~67% Fe",gr:"66% Fe",rv:"~$9.1B",dp_meters:100,em_count:3000,pr_total_tonnes:83000000,pr_fe_mt:83,rs_tonnes:10000000000,rv_usd:9130000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Carajás Serra Norte",c:"Brazil",s:"Pará",r:"Latin America",la:-6.07,ln:-50.17,co:["Iron Ore"],pc:"Iron Ore",cp:"Vale",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Northern System; in line with plan",em:"~5,000",dp:"~200m",d:1967,o:1985,rs:"~5.0Bt",no:"Original Carajás complex",gr:"65% Fe",rv:"~$9.1B",dp_meters:200,em_count:5000,pr_total_tonnes:250000000,pr_fe_mt:250,rs_tonnes:5000000000,rv_usd:9130000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Carlin Gold Complex",c:"United States",s:"Nevada",r:"North America",la:40.88,ln:-116.33,co:["Gold"],pc:"Gold",cp:"Nevada Gold Mines (Barrick 61.5% / Newmont 38.5%)",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Part of NGM complex; incl Goldstrike",em:"~6,000",d:1961,o:1965,no:"Richest gold district in Western Hemisphere",rv:"~$1.4B",em_count:6000,pr_total_tonnes:30000000,pr_au_oz_pa:2700000,rv_usd:1434000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Carmichael",c:"Australia",s:"Queensland",r:"Galilee Basin",la:-21.95,ln:146.4,co:["Coal (Thermal)"],pc:"Coal (Thermal)",cp:"Bravus Mining (Adani)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Thermal coal; QLD; ramping up ~10Mtpa",em:"~1,500",dp:"~150m",d:2010,o:2022,rs:"~10.0Bt",no:"Controversial Galilee Basin mine",rv:"~$1.3B",dp_meters:150,em_count:1500,pr_total_tonnes:10000000,pr_coal_mt:10,rs_tonnes:10000000000,rv_usd:1300000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Carosue Dam",c:"Australia",s:"Western Australia",r:"Asia-Pacific",la:-31.19,ln:122.42,co:["Gold"],pc:"Gold",cp:"Northern Star Resources (acquired Saracen 2021)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Au; WA",em:"~300",dp:"~250m",d:2000,o:2001,no:"Now part of Northern Star",gr:"2.0g/t Au",rv:"~$358M",dp_meters:250,em_count:300,pr_total_tonnes:2000000,pr_au_oz_pa:150000,rv_usd:358400000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Carrapateena",cp:"BHP",c:"Australia",s:"South Australia",r:"Gawler Craton",la:-31.37,ln:137.05,co:['Copper','Gold'],pc:"Copper",t:"Underground",m:"Sub-level Caving",st:"Operating",pr:"68kt Cu payable; 91koz Au",em:"~1,200",dp:"~1500m",d:2005,o:2019,rs:"~200Mt",gr:"1.3% Cu, 0.5g/t Au",rv:"~$863M",no:"BHP's newest Cu mine, block cave study underway",dp_meters:1500,em_count:1200,pr_total_tonnes:7000000,pr_cu_tpa:68000,pr_au_oz_pa:91000,rs_tonnes:200000000,rv_usd:863400000,pr_year:"FY2024",rs_year:"2024.0",src_type:"Company",confidence:"High",dq:"A"},{n:"Cataby",c:"Australia",s:"Western Australia",r:"Asia-Pacific",la:-30.75,ln:115.55,co:["Titanium"],pc:"Titanium",cp:"Iluka Resources",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ti mineral sands; WA",em:"~200",dp:"~50m",d:2010,o:2019,rv:"~$500M",dp_meters:50,em_count:200,pr_total_tonnes:2000000,pr_ti_kt:200,rv_usd:500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Catoca",c:"Angola",s:"Lunda Sul",r:"Africa",la:-8.38,ln:20.43,co:["Diamonds"],pc:"Diamonds",cp:"Endiama / Alrosa JV",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Africa's 4th largest diamond mine; Angola",em:"~5,000",dp:"~600m",d:1968,o:1997,no:"4th largest diamond mine globally by output",rv:"~$200M",dp_meters:600,em_count:5000,pr_total_tonnes:5000000,pr_carats_pa:6000000,rv_usd:200000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Caval Ridge",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-21.93,ln:148.11,co:["Coal (Met)"],pc:"Coal (Met)",cp:"BHP Mitsubishi Alliance (BMA)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"3.3Mt met coal (BHP 50% share FY24)",em:"~800",dp:"~150m",d:2007,o:2014,rs:"~400Mt",no:"Newest BMA operation",rv:"~$825M",dp_meters:150,em_count:800,pr_total_tonnes:3300000,pr_coal_mt:3.3,rs_tonnes:400000000,rv_usd:825000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Centinela",c:"Chile",s:"Antofagasta",r:"Latin America",la:-23.1,ln:-69.18,co:["Copper","Gold"],pc:"Copper",cp:"Antofagasta Minerals (70%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Au; ~220kt Cu",em:"~3,000",dp:"~400m",d:1978,o:2012,rs:"~1.5Bt",no:"Combined Esperanza & El Tesoro",gr:"0.4% Cu",rv:"~$2.1B",dp_meters:400,em_count:3000,pr_total_tonnes:60000000,pr_cu_tpa:220000,rs_tonnes:1500000000,rv_usd:2090000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Century Tailings",c:"Australia",s:"Queensland",r:"Asia-Pacific",la:-18.76,ln:138.62,co:["Zinc"],pc:"Zinc",cp:"New Century Resources",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Zn from tailings reprocessing",em:"~150",dp:"~20m",d:1990,o:2022,dp_meters:20,em_count:150,pr_total_tonnes:2000000,pr_zn_tpa:50000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Cerrejón",c:"Colombia",s:"La Guajira",r:"Latin America",la:11.1,ln:-72.65,co:["Coal (Thermal)"],pc:"Coal (Thermal)",cp:"Glencore",t:"Open Pit",m:"Dragline / Strip Mining",st:"Operating",pr:"Part of Glencore energy coal 99.6Mt; impacted by permits/rain",em:"~5,000",dp:"~150m",d:1977,o:1985,rs:"~3.0Bt",no:"Largest open pit coal mine in Latin America",rv:"~$1.8B",dp_meters:150,em_count:5000,pr_total_tonnes:99600000,pr_coal_mt:99.6,rs_tonnes:3000000000,rv_usd:1820000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Cerro Lindo",c:"Peru",r:"Latin America",la:-13.6,ln:-75.68,co:["Zinc","Copper","Lead"],pc:"Copper",cp:"Nexa Resources",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Zn-Cu-Pb; Peru",em:"~1,500",d:1998,o:2007,gr:"3% Zn, 0.5% Cu",rv:"~$950M",em_count:1500,pr_total_tonnes:20000000,pr_cu_tpa:30000,pr_zn_tpa:120000,rv_usd:950000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Cerro Negro",c:"Argentina",s:"Santa Cruz",r:"Latin America",la:-46.55,ln:-69.25,co:["Gold","Silver"],pc:"Gold",cp:"Newmont",t:"Underground",m:"Open Stoping",st:"Operating",pr:"238koz Au (CY2024)",em:"~1,500",dp:"~600m",d:2007,o:2013,gr:"6.5g/t Au",rv:"~$568M",dp_meters:600,em_count:1500,pr_total_tonnes:8000000,pr_au_oz_pa:238000,rv_usd:568600000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Cerro Verde",c:"Peru",s:"Arequipa",r:"Latin America",la:-16.54,ln:-71.6,co:["Copper","Molybdenum"],pc:"Copper",cp:"Freeport-McMoRan (53.56%) / SMM/SC JV",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of FCX South America Cu production",em:"~6,000",dp:"~600m",d:1916,o:1977,rs:"~4.0Bt",no:"One of Peru's largest copper mines",gr:"0.4% Cu",rv:"~$2.9B",dp_meters:600,em_count:6000,pr_total_tonnes:80000000,pr_cu_tpa:400000,rs_tonnes:4000000000,rv_usd:2850000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Chichester Hub",c:"Australia",s:"Western Australia",r:"Pilbara",la:-21.3,ln:119.4,co:["Iron Ore"],pc:"Iron Ore",cp:"Fortescue",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Fortescue total ~192Mt shipped FY24",em:"~3,000",dp:"~100m",d:1963,o:2008,rs:"~2.0Bt",no:"Fortescue's founding operation",rv:"~$11.0B",dp_meters:100,em_count:3000,pr_total_tonnes:192000000,pr_fe_mt:192,rs_tonnes:2000000000,rv_usd:11000000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Christmas Creek",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.34,ln:119.64,co:["Iron Ore"],pc:"Iron Ore",cp:"Fortescue",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Chichester Hub",em:"~1,500",dp:"~100m",d:1963,o:2008,rs:"~700Mt",no:"Part of Fortescue's Chichester Hub",rv:"~$5.5B",dp_meters:100,em_count:1500,pr_total_tonnes:50000000,pr_fe_mt:50,rs_tonnes:700000000,rv_usd:5500000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Chromite Valley",c:"South Africa",s:"Limpopo",r:"Africa",la:-24.59,ln:30.16,co:["Chromite"],pc:"Chromite",cp:"Glencore-Merafe Chrome Venture",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Cr; SA",em:"~1,000",dp:"~900m",d:1918,o:1960,no:"Bushveld Complex operations",rv:"~$600M",dp_meters:900,em_count:1000,pr_total_tonnes:2000000,pr_cr_mt:2,rv_usd:600000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Chuquicamata",c:"Chile",s:"Antofagasta",r:"Latin America",la:-22.29,ln:-68.9,co:["Copper","Molybdenum"],pc:"Copper",cp:"Codelco",t:"Underground",m:"Block / Panel Caving",st:"Operating",pr:"Transitioning to UG; part of Codelco total ~1.3Mt Cu",em:"~5,000",dp:"~1000m",d:1830,o:1910,rs:"~1.7Bt",no:"Largest OP Cu mine by volume, transitioning UG",rv:"~$3.8B",dp_meters:1000,em_count:5000,pr_total_tonnes:35000000,pr_cu_tpa:1300000,rs_tonnes:1700000000,rv_usd:3800000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Chuquicamata Underground",c:"Chile",s:"Antofagasta",r:"Latin America",la:-22.32,ln:-68.93,co:["Copper"],pc:"Copper",cp:"Codelco",t:"Underground",m:"Block / Panel Caving",st:"Operating",pr:"Ramp-up continues; block caving",em:"~3,000",dp:"~1200m",d:1830,o:2019,no:"Transition from world's largest OP to UG block cave",rv:"~$1.9B",dp_meters:1200,em_count:3000,pr_total_tonnes:30000000,pr_cu_tpa:140000,rv_usd:1900000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Cigar Lake",c:"Canada",s:"Saskatchewan",r:"North America",la:58.04,ln:-104.54,co:["Uranium"],pc:"Uranium",cp:"Cameco (50.025%) / Orano (37.1%)",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"~16Mlbs U3O8; world's highest-grade U mine",em:"~500",dp:"~450m",d:1981,o:2014,rs:"~100Mt",no:"World's highest grade uranium mine",gr:"~15% U3O8",rv:"~$1.4B",dp_meters:450,em_count:500,pr_total_tonnes:1800000,pr_u3o8_tpa:7300,rs_tonnes:100000000,rv_usd:1416000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Cloudbreak",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.29,ln:119.44,co:["Iron Ore"],pc:"Iron Ore",cp:"Fortescue",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Chichester Hub",em:"~1,200",dp:"~100m",d:2004,o:2008,rs:"~600Mt",no:"Fortescue's first mine",rv:"~$5.5B",dp_meters:100,em_count:1200,pr_total_tonnes:50000000,pr_fe_mt:50,rs_tonnes:600000000,rv_usd:5500000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Cobre Las Cruces",c:"Spain",s:"Andalusia",r:"Europe",la:37.53,ln:-6.15,co:["Copper"],pc:"Copper",cp:"First Quantum Minerals",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Cu; Spain; UG project",em:"~800",dp:"~250m",d:1994,o:2009,rv:"~$95M",dp_meters:250,em_count:800,pr_total_tonnes:2000000,pr_cu_tpa:10000,rv_usd:95000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Collahuasi",c:"Chile",s:"Tarapacá",r:"Latin America",la:-20.98,ln:-68.72,co:["Copper","Molybdenum"],pc:"Copper",cp:"Glencore (44%) / Anglo American (44%) / Mitsui (12%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Glencore Cu; lower planned production CY2024",em:"~3,500",dp:"~600m",d:1880,o:1999,rs:"~3.0Bt",no:"At 4,400m elevation",gr:"0.8% Cu",rv:"~$5.7B",dp_meters:600,em_count:3500,pr_total_tonnes:40000000,pr_cu_tpa:530000,rs_tonnes:3000000000,rv_usd:5700000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Constancia",c:"Peru",s:"Cusco",r:"Latin America",la:-14.52,ln:-71.81,co:["Copper","Gold","Molybdenum","Silver"],pc:"Copper",cp:"Hudbay Minerals",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Au-Mo-Ag; ~100kt Cu; Peru",em:"~2,500",dp:"~350m",d:2012,o:2015,rs:"~700Mt",no:"At 4,100m elevation",gr:"0.3% Cu",rv:"~$950M",dp_meters:350,em_count:2500,pr_total_tonnes:25000000,pr_cu_tpa:100000,rs_tonnes:700000000,rv_usd:950000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Coral Bay",c:"Philippines",s:"Palawan",r:"Asia-Pacific",la:9.17,ln:118.05,co:["Nickel"],pc:"Nickel",cp:"Sumitomo Metal Mining / Nickel Asia",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni HPAL; Philippines",em:"~700",dp:"~30m",d:1996,o:2005,rv:"~$495M",dp_meters:30,em_count:700,pr_total_tonnes:8000000,pr_ni_tpa:30000,rv_usd:495000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Cortez",c:"United States",s:"Nevada",r:"North America",la:40.21,ln:-116.63,co:["Gold"],pc:"Gold",cp:"Nevada Gold Mines (Barrick 61.5% / Newmont 38.5%)",t:"Open Pit & Underground",m:"Open Stoping",st:"Operating",pr:"Part of NGM complex; highest annual production in 4 years CY2024",em:"~1,500",dp:"~600m",d:1863,o:1969,no:"Includes deep Goldrush deposit",rv:"~$2.0B",dp_meters:600,em_count:1500,pr_total_tonnes:25000000,pr_au_oz_pa:500000,rv_usd:2031200000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Cory",c:"Canada",s:"Saskatchewan",r:"North America",la:52.1,ln:-106.93,co:["Potash"],pc:"Potash",cp:"Nutrien",t:"Underground",m:"Longwall",st:"Operating",pr:"Part of Nutrien potash",em:"~600",dp:"~1000m",d:1952,o:1965,rv:"~$900M",dp_meters:1000,em_count:600,pr_total_tonnes:3000000,pr_potash_mt:1.5,rv_usd:900000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Cowal",cp:"Evolution Mining",c:"Australia",s:"New South Wales",r:"Asia-Pacific",la:-33.62,ln:147.38,co:['Gold'],pc:"Gold",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Au; part of Evolution ~330koz total",em:"~1200",dp:"800",d:2004,o:2006,rs:"~140Mt",gr:"0.8g/t Au",rv:"~$1.8B",no:"Transition to underground",dp_meters:800,em_count:1200,pr_total_tonnes:8000000,pr_au_oz_pa:330000,rv_usd:1839500000,pr_year:"FY2025",src_type:"Company",confidence:"High",dq:"B"},{n:"Cuajone",c:"Peru",s:"Moquegua",r:"Latin America",la:-17.05,ln:-70.7,co:["Copper","Molybdenum"],pc:"Copper",cp:"Southern Copper",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Mo; ~140kt Cu; Peru",em:"~2,500",dp:"~500m",d:1900,o:1976,rs:"~1.5Bt",no:"Sister mine to Toquepala",gr:"0.6% Cu",rv:"~$1.3B",dp_meters:500,em_count:2500,pr_total_tonnes:30000000,pr_cu_tpa:140000,rs_tonnes:1500000000,rv_usd:1330000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Cullinan",c:"South Africa",s:"Gauteng",r:"Africa",la:-25.68,ln:28.52,co:["Diamonds"],pc:"Diamonds",cp:"Petra Diamonds",t:"Underground",m:"Block / Panel Caving",st:"Operating",pr:"Historic SA diamond mine",em:"~1,800",dp:"~900m",d:1903,o:1903,no:"Famous for 3,106-carat Cullinan Diamond",rv:"~$250M",dp_meters:900,em_count:1800,pr_total_tonnes:2000000,pr_carats_pa:1500000,rv_usd:250000000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Curragh",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-23.48,ln:148.87,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Coronado Global Resources",t:"Open Pit",m:"Dragline / Strip Mining",st:"Operating",pr:"Met coal; QLD ~8Mt",em:"~1,800",dp:"~150m",d:1981,o:1983,rs:"~500Mt",no:"Premium hard coking coal",rv:"~$2.0B",dp_meters:150,em_count:1800,pr_total_tonnes:8000000,pr_coal_mt:8,rs_tonnes:500000000,rv_usd:2000000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Daunia",c:"Australia",s:"Queensland",r:"Asia-Pacific",la:-22.33,ln:148.02,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Whitehaven Coal (acquired Apr 2024)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"1.5Mt met coal (BHP share, pre-divestment Apr 2024)",em:"~800",dp:"~60m",d:2007,o:2013,no:"Divested by BHP to Whitehaven Coal on 2 April 2024",rv:"~$375M",dp_meters:60,em_count:800,pr_total_tonnes:1500000,pr_coal_mt:1.5,rv_usd:375000000,pr_year:"FY2024 (partial)",src_type:"Company",confidence:"High",dq:"B"},{n:"Dawson",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-23.15,ln:149.15,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Anglo American",t:"Open Pit & Underground",m:"Dragline / Strip Mining",st:"Operating",pr:"Met coal",em:"~900",dp:"~200m",d:1957,o:1962,rs:"~500Mt",no:"Long-running operation",rv:"~$1.2B",dp_meters:200,em_count:900,pr_total_tonnes:5000000,pr_coal_mt:5,rs_tonnes:500000000,rv_usd:1250000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Dayan",c:"China",s:"Inner Mongolia",r:"Asia-Pacific",la:49.28,ln:117.41,co:["Coal (Thermal)"],pc:"Coal (Thermal)",cp:"Shenhua Group / China Energy",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Thermal coal; Inner Mongolia",em:"~5,000",dp:"~60m",d:1960,o:1980,rv:"~$2.6B",dp_meters:60,em_count:5000,pr_total_tonnes:50000000,pr_coal_mt:50,rv_usd:2600000000,pr_year:"CY2024",src_type:"Government",confidence:"Medium",dq:"B"},{n:"DeGrussa",c:"Australia",s:"Western Australia",r:"Meekatharra",la:-25.55,ln:119.2,co:["Copper","Gold"],pc:"Copper",cp:"Sandfire Resources",t:"Underground",m:"Open Stoping",st:"Care & Maintenance",pr:"Cu-Au; WA; mine nearing depletion",em:"~400",dp:"~500m",d:2009,o:2012,rs:"~10Mt",no:"DeGrussa UG depleted ~2023; MATSA (Spain) now primary asset",rv:"~$190M",dp_meters:500,em_count:400,pr_total_tonnes:5000000,rs_tonnes:10000000,rv_usd:190000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Dendrobium",c:"Australia",s:"New South Wales",r:"Asia-Pacific",la:-34.47,ln:150.88,co:["Coal (Met)"],pc:"Coal (Met)",cp:"South32",t:"Underground",m:"Longwall",st:"Operating",pr:"Met coal; Illawarra Metallurgical Coal",em:"~700",dp:"~500m",d:1952,o:2005,rv:"~$1.8B",dp_meters:500,em_count:700,pr_total_tonnes:7000000,pr_coal_mt:7,rv_usd:1750000000,pr_year:"FY2025",src_type:"Company",confidence:"High",dq:"B"},{n:"Detour Lake",c:"Canada",s:"Ontario",r:"North America",la:50.03,ln:-79.7,co:["Gold"],pc:"Gold",cp:"Agnico Eagle Mines",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of AEM total ~3.5Moz; UG exploration ramp advancing",em:"~1,500",dp:"~300m",d:1974,o:2013,no:"Canada's largest gold mine",gr:"0.8g/t Au",rv:"~$1.8B",dp_meters:300,em_count:1500,pr_total_tonnes:3000000,pr_au_oz_pa:3500000,rv_usd:1768400000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Dexing",c:"China",s:"Jiangxi",r:"Asia-Pacific",la:29,ln:117.72,co:["Copper","Gold"],pc:"Copper",cp:"Jiangxi Copper",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Au; China's largest OP Cu mine",em:"~8,000",dp:"~400m",d:1897,o:1958,rs:"~2.0Bt",no:"Largest OP copper mine in Asia",gr:"0.4% Cu",rv:"~$2.4B",dp_meters:400,em_count:8000,pr_total_tonnes:80000000,pr_cu_tpa:250000,rs_tonnes:2000000000,rv_usd:2375000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"Didipio",c:"Philippines",s:"Nueva Vizcaya",r:"Asia-Pacific",la:16.33,ln:121.2,co:["Gold","Copper"],pc:"Gold",cp:"OceanaGold",t:"Open Pit & Underground",m:"Open Stoping",st:"Operating",pr:"Au-Cu; Philippines",em:"~2,500",dp:"~500m",d:1998,o:2013,no:"Faced community access issues",gr:"1.0g/t Au, 0.4% Cu",rv:"~$477M",dp_meters:500,em_count:2500,pr_total_tonnes:10000000,pr_au_oz_pa:200000,rv_usd:477800000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Donimalai",c:"India",s:"Karnataka",r:"South Asia",la:15.13,ln:76.38,co:["Iron Ore"],pc:"Iron Ore",cp:"NMDC",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Iron ore; India NMDC",em:"~1,500",dp:"~100m",d:1961,o:1977,rv:"~$1.1B",dp_meters:100,em_count:1500,pr_total_tonnes:10000000,pr_fe_mt:10,rv_usd:1100000000,pr_year:"FY2024",src_type:"Government",confidence:"High",dq:"B"},{n:"Donskoy GOK",c:"Kazakhstan",s:"Aktobe",r:"CIS",la:50.3,ln:58.32,co:["Chromite"],pc:"Chromite",cp:"Kazchrome (ERG)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Cr; Kazakhstan; world's largest Cr mine",em:"~8,000",d:1938,o:1938,no:"World's largest chrome producer",rv:"~$2.1B",em_count:8000,pr_total_tonnes:15000000,pr_cr_mt:6,rv_usd:2100000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Driefontein",c:"South Africa",s:"Gauteng",r:"Africa",la:-26.38,ln:27.5,co:["Gold"],pc:"Gold",cp:"Sibanye-Stillwater",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"SA gold ops",em:"~4,000",dp:"~3400m",d:1933,o:1953,rv:"~$477M",dp_meters:3400,em_count:4000,pr_total_tonnes:4000000,pr_au_oz_pa:200000,rv_usd:477800000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Drummond",c:"Colombia",r:"Latin America",la:9.46,ln:-73.61,co:["Coal (Thermal)"],pc:"Coal (Thermal)",cp:"Drummond Company",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Thermal coal; Colombia",em:"~5,000",dp:"~80m",d:1985,o:1995,rv:"~$1.8B",dp_meters:80,em_count:5000,pr_total_tonnes:14000000,pr_coal_mt:14,rv_usd:1820000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Dugald River",cp:"MMG Limited",c:"Australia",s:"Queensland",r:"Asia-Pacific",la:-20.25,ln:140.18,co:['Zinc','Lead'],pc:"Zinc",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Zn-Pb; high-grade UG",em:"~600",dp:"~900m",d:1975,o:2017,gr:"12% Zn",rv:"~$570M",dp_meters:900,em_count:500,pr_total_tonnes:1700000,pr_zn_tpa:170000,rv_usd:570000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Duketon",c:"Australia",s:"Western Australia",r:"Asia-Pacific",la:-27.93,ln:122.52,co:["Gold"],pc:"Gold",cp:"Regis Resources",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Au; WA",em:"~250",dp:"~200m",d:2007,o:2012,gr:"1.5g/t Au",rv:"~$358M",dp_meters:200,em_count:250,pr_total_tonnes:2000000,pr_au_oz_pa:150000,rv_usd:358400000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Ekati",c:"Canada",s:"Northwest Territories",r:"North America",la:64.72,ln:-110.62,co:["Diamonds"],pc:"Diamonds",cp:"Arctic Canadian Diamond Company",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Canada; operated by Arctic Canadian Diamond",em:"~1,000",dp:"~300m",d:1991,o:1998,no:"Canada's first diamond mine",rv:"~$250M",dp_meters:300,em_count:1000,pr_total_tonnes:1000000,pr_carats_pa:3000000,rv_usd:250000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"El Porvenir",c:"Peru",r:"Latin America",la:-10.56,ln:-76.28,co:["Zinc","Lead","Silver"],pc:"Zinc",cp:"Nexa Resources",t:"Underground",m:"Cut & Fill",st:"Operating",pr:"Zn-Pb-Ag; Peru",em:"~2,000",dp:"~600m",d:1959,o:1959,gr:"4% Zn",dp_meters:600,em_count:2000,pr_total_tonnes:5000000,pr_zn_tpa:80000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"El Teniente",c:"Chile",s:"O'Higgins",r:"Latin America",la:-34.09,ln:-70.34,co:["Copper","Molybdenum"],pc:"Copper",cp:"Codelco",t:"Underground",m:"Block / Panel Caving",st:"Operating",pr:"Part of Codelco total; world's largest UG Cu mine",em:"~5,000",dp:"~1800m",d:1904,o:1906,rs:"~2.0Bt",no:"World's largest underground copper mine",rv:"~$4.3B",dp_meters:1800,em_count:5000,pr_total_tonnes:70000000,pr_cu_tpa:400000,rs_tonnes:2000000000,rv_usd:4275000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Ernest Henry",cp:"Evolution Mining",c:"Australia",s:"Queensland",r:"North West QLD",la:-20.49,ln:140.72,co:['Copper','Gold'],pc:"Copper",t:"Underground",m:"Sub-level Caving",st:"Operating",pr:"Cu-Au; part of Evolution ops",em:"~600",dp:"~1000m",d:1991,o:1998,rs:"~78Mt",gr:"0.77g/t Au",rv:"~$228M",no:"IOCG deposit",dp_meters:1000,em_count:600,pr_total_tonnes:6800000,pr_cu_tpa:50000,pr_au_oz_pa:70625,rs_tonnes:200000000,rv_usd:228000000,pr_year:"FY2025",rs_year:"2024.0",src_type:"Company",confidence:"High",dq:"A"},{n:"Escondida",c:"Chile",s:"Atacama",r:"Latin America",la:-24.27,ln:-69.07,co:["Copper"],pc:"Copper",cp:"BHP (57.5%) / Rio Tinto (30%) / JECO Corp (12.5%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"1,125kt Cu (100% basis FY24); 181koz Au; 5,446koz Ag",em:"~10,000",dp:"~700m",d:1981,o:1990,rs:"~4.5Bt",no:"World's largest copper mine by production",gr:"0.5% Cu",rv:"~$5.2B",dp_meters:700,em_count:10000,pr_total_tonnes:160000000,pr_au_oz_pa:181000,pr_cu_tpa:1125000,rs_tonnes:4500000000,rv_usd:5225000000,pr_year:"FY2024 (Jul23-Jun24)",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Essakane",c:"Burkina Faso",s:"Sahel",r:"Africa",la:14.93,ln:-0.28,co:["Gold"],pc:"Gold",cp:"IAMGOLD (90%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Au ~400koz; Burkina Faso",em:"~3,000",dp:"~100m",d:2008,o:2010,no:"Sahel desert gold mine",gr:"0.8g/t Au",rv:"~$955M",dp_meters:100,em_count:3000,pr_total_tonnes:6000000,pr_au_oz_pa:400000,rv_usd:955600000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Fekola",c:"Mali",r:"Africa",la:13.48,ln:-11.2,co:["Gold"],pc:"Gold",cp:"B2Gold (80%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Au ~550koz; Mali; flagship mine",em:"~2,500",dp:"~150m",d:2012,o:2018,gr:"1.5g/t Au",rv:"~$1.3B",dp_meters:150,em_count:2500,pr_total_tonnes:10000000,pr_au_oz_pa:550000,rv_usd:1314000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Fort Knox",c:"United States",s:"Alaska",r:"North America",la:64.82,ln:-147.57,co:["Gold"],pc:"Gold",cp:"Kinross Gold",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Kinross total",em:"~700",dp:"~300m",d:1985,o:1996,no:"Interior Alaska gold mine near Fairbanks",gr:"0.4g/t Au",rv:"~$358M",dp_meters:300,em_count:700,pr_total_tonnes:8000000,pr_au_oz_pa:2100000,rv_usd:358000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Fosterville",c:"Australia",s:"Victoria",r:"Bendigo",la:-36.7,ln:144.73,co:["Gold"],pc:"Gold",cp:"Agnico Eagle Mines",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of AEM total; lower production CY2024 vs prior year",em:"~700",dp:"~1000m",d:1894,o:1894,no:"One of world's highest-grade gold mines",gr:"8-15g/t Au",dp_meters:1000,em_count:700,pr_total_tonnes:5000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Fruta del Norte",c:"Ecuador",s:"Zamora-Chinchipe",r:"Latin America",la:-3.83,ln:-78.58,co:["Gold","Silver"],pc:"Gold",cp:"Lundin Gold",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Au ~400koz; Ecuador high-grade UG",em:"~1,500",dp:"~800m",d:2002,o:2019,no:"Ecuador's first large-scale UG mine",gr:"9.0g/t Au",rv:"~$955M",dp_meters:800,em_count:1500,pr_total_tonnes:4000000,pr_au_oz_pa:400000,rv_usd:955600000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"GEMCO (Groote Eylandt)",c:"Australia",s:"Northern Territory",r:"Groote Eylandt",la:-13.96,ln:136.46,co:["Manganese"],pc:"Manganese",cp:"South32 (60%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Mn ore; major global Mn producer",em:"~1,200",dp:"~20m",d:1966,o:1966,rs:"~150Mt",no:"World's largest manganese mine, ~15% of global supply",rv:"~$600M",dp_meters:20,em_count:1200,pr_total_tonnes:5000000,pr_mn_mt:5,rs_tonnes:150000000,rv_usd:600000000,pr_year:"FY2025",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Gahcho Kué",c:"Canada",s:"Northwest Territories",r:"North America",la:63.43,ln:-109.2,co:["Diamonds"],pc:"Diamonds",cp:"De Beers (51%) / Mountain Province (49%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"JV; Canada",em:"~600",dp:"~250m",d:2008,o:2016,no:"Remote subarctic diamond mine",rv:"~$200M",dp_meters:250,em_count:600,pr_total_tonnes:1000000,pr_carats_pa:5000000,rv_usd:200000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Ganfeng Mariana",c:"Argentina",s:"Salta",r:"Latin America",la:-24.05,ln:-67.05,co:["Lithium"],pc:"Lithium",cp:"Ganfeng Lithium",t:"Open Pit",m:"Truck & Shovel",st:"Construction",pr:"Li brine; Argentina; development",em:"~200",d:2015,o:2023,rv:"~$20M",em_count:200,rv_usd:20000000,src_type:"Company",confidence:"Medium",dq:"D"},{n:"Garpenberg",c:"Sweden",s:"Dalarna",r:"Europe",la:60.33,ln:16.22,co:["Zinc","Silver","Lead"],pc:"Zinc",cp:"Boliden",t:"Underground",m:"Cut & Fill",st:"Operating",pr:"Part of Boliden Mines; one of most productive Zn mines globally",em:"~800",dp:"~1200m",d:1150,o:1940,gr:"4.5% Zn",dp_meters:1200,em_count:800,pr_total_tonnes:5000000,pr_zn_tpa:150000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Geita",c:"Tanzania",s:"Geita",r:"Africa",la:-2.83,ln:32.15,co:["Gold"],pc:"Gold",cp:"AngloGold Ashanti",t:"Open Pit & Underground",m:"Open Stoping",st:"Operating",pr:"Part of AGA total ~2.7Moz Au CY2024",em:"~5,000",dp:"~300m",d:1938,o:1999,no:"Tanzania's largest gold mine",gr:"3.0g/t Au",rv:"~$765M",dp_meters:300,em_count:5000,pr_total_tonnes:10000000,pr_au_oz_pa:2700000,rv_usd:765000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Goldstrike",c:"United States",s:"Nevada",r:"North America",la:40.97,ln:-116.47,co:["Gold"],pc:"Gold",cp:"Nevada Gold Mines (Barrick 61.5% / Newmont 38.5%)",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Part of NGM complex (Barrick 61.5%); NGM total ~2.7Moz Au",em:"~1,800",d:1962,o:1986,no:"Part of Nevada Gold Mines JV; individual mine production not separately disclosed",rv:"~$1.3B",em_count:1800,pr_total_tonnes:25000000,pr_au_oz_pa:2700000,rv_usd:1315000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Goonyella Riverside",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-21.81,ln:148.1,co:["Coal (Met)"],pc:"Coal (Met)",cp:"BHP Mitsubishi Alliance (BMA)",t:"Open Pit",m:"Dragline / Strip Mining",st:"Operating",pr:"6.4Mt met coal (BHP 50% share FY24)",em:"~2,500",dp:"~200m",d:1957,o:1970,rs:"~1.0Bt",no:"One of world's largest met coal mines",rv:"~$1.6B",dp_meters:200,em_count:2500,pr_total_tonnes:6400000,pr_coal_mt:6.4,rs_tonnes:1000000000,rv_usd:1600000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Goro",c:"New Caledonia",s:"Province Sud",r:"Asia-Pacific",la:-22.27,ln:167.02,co:["Nickel","Cobalt"],pc:"Nickel",cp:"Prony Resources",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni-Co; New Caledonia",em:"~2,500",d:1965,o:2010,rs:"~120Mt",no:"Ownership transition; financial difficulties",rv:"~$495M",em_count:2500,pr_total_tonnes:5000000,pr_ni_tpa:30000,rs_tonnes:120000000,rv_usd:495000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"Granny Smith",c:"Australia",s:"Western Australia",r:"Goldfields",la:-28.98,ln:122.17,co:["Gold"],pc:"Gold",cp:"Gold Fields",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of Gold Fields Australia region",em:"~750",dp:"~700m",d:1970,o:1990,no:"Includes Wallaby underground mine",gr:"4.0g/t Au",rv:"~$204M",dp_meters:700,em_count:750,pr_total_tonnes:3000000,rv_usd:204000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Grasberg",c:"Indonesia",s:"Papua",r:"Asia-Pacific",la:-4.05,ln:137.12,co:["Copper","Gold"],pc:"Copper",cp:"Freeport-McMoRan / PT-FI (48.76%) / Indonesia Govt (51.24%)",t:"Open Pit & Underground",m:"Block / Panel Caving",st:"Operating",pr:"Major Cu-Au mine; UG ops (DMLZ + GBC) ramping",em:"~30,000",dp:"~1200m",d:1936,o:1973,rs:"~3.0Bt",no:"World's largest gold mine, massive UG transition",gr:"0.8% Cu, 0.7g/t Au",rv:"~$11.1B",dp_meters:1200,em_count:30000,pr_total_tonnes:160000000,pr_cu_tpa:300000,rs_tonnes:3000000000,rv_usd:11130000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Greenbushes",c:"Australia",s:"Western Australia",r:"South West",la:-33.86,ln:116.06,co:["Lithium"],pc:"Lithium",cp:"Talison Lithium (Tianqi 51% / IGO 49%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"World's largest hard-rock Li mine; ~1.5Mt spod conc",em:"~800",dp:"~250m",d:1888,o:1983,rs:"~200Mt",no:"World's largest & highest-grade hard-rock lithium mine",gr:"2.1% Li2O",rv:"~$1.2B",dp_meters:250,em_count:800,pr_total_tonnes:14000000,pr_li_tpa:1500000,rs_tonnes:200000000,rv_usd:1200000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Greens Creek",c:"United States",s:"Alaska",r:"North America",la:58.07,ln:-134.65,co:["Silver","Gold","Zinc"],pc:"Gold",cp:"Hecla Mining",t:"Underground",m:"Cut & Fill",st:"Operating",pr:"Ag-Au-Zn; Alaska; Hecla's largest Ag mine",em:"~400",dp:"~500m",d:1974,o:1989,rs:"~7Mt",no:"One of world's largest primary silver mines",gr:"12% Zn, 5oz/t Ag",dp_meters:500,em_count:400,pr_total_tonnes:2000000,pr_zn_tpa:20000,rs_tonnes:7000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Grosvenor",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-21.9,ln:148.15,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Anglo American",t:"Underground",m:"Longwall",st:"Operating",pr:"Met coal; fire damage 2020; partial restart",em:"~600",dp:"~250m",d:2007,o:2016,rs:"~300Mt",no:"Newest Anglo coal mine",rv:"~$750M",dp_meters:250,em_count:600,pr_total_tonnes:3000000,pr_coal_mt:3,rs_tonnes:300000000,rv_usd:750000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Gudai-Darri",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.5,ln:119.18,co:["Iron Ore"],pc:"Iron Ore",cp:"Rio Tinto",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Reached 50Mtpa rate during 2024; part of 328Mt Pilbara total",em:"~600",dp:"~100m",d:2014,o:2022,rs:"~700Mt",no:"Rio Tinto's most advanced mine, $3.6B investment",rv:"~$5.5B",dp_meters:100,em_count:600,pr_total_tonnes:50000000,pr_fe_mt:50,rs_tonnes:700000000,rv_usd:5500000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Guelb El Rhein",c:"Mauritania",s:"Tiris Zemmour",r:"Africa",la:22.6,ln:-12.35,co:["Iron Ore"],pc:"Iron Ore",cp:"SNIM (Mauritania State)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Iron ore; Mauritania ~12Mt",em:"~3,000",dp:"~100m",d:1968,o:1984,rs:"~1.0Bt",no:"Key Saharan iron ore",rv:"~$1.3B",dp_meters:100,em_count:3000,pr_total_tonnes:12000000,pr_fe_mt:12,rs_tonnes:1000000000,rv_usd:1320000000,pr_year:"CY2024",rs_year:"2024",src_type:"Government",confidence:"Medium",dq:"A"},{n:"Gwalia",c:"Australia",s:"Western Australia",r:"Asia-Pacific",la:-28.73,ln:121.77,co:["Gold"],pc:"Gold",cp:"St Barbara / Genesis Minerals",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Au; WA UG",em:"~300",dp:"~1600m",d:1897,o:1897,no:"St Barbara merged with Genesis Minerals 2024",gr:"6g/t Au",rv:"~$286M",dp_meters:1600,em_count:300,pr_total_tonnes:2000000,pr_au_oz_pa:120000,rv_usd:286700000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Haerwusu",c:"China",s:"Inner Mongolia",r:"Asia-Pacific",la:39.83,ln:109.98,co:["Coal (Thermal)"],pc:"Coal (Thermal)",cp:"China Energy",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Thermal coal; Inner Mongolia; massive OP",em:"~8,000",dp:"~70m",d:1960,o:2009,no:"One of China's largest open pit coal mines",rv:"~$2.6B",dp_meters:70,em_count:8000,pr_total_tonnes:60000000,pr_coal_mt:60,rv_usd:2600000000,pr_year:"CY2024",src_type:"Government",confidence:"Medium",dq:"B"},{n:"Hail Creek",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-21.52,ln:148.39,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Glencore",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Glencore Australian coal",em:"~1,200",dp:"~100m",d:1980,o:2003,rs:"~400Mt",no:"Hard coking coal",rv:"~$2.0B",dp_meters:100,em_count:1200,pr_total_tonnes:8000000,pr_coal_mt:8,rs_tonnes:400000000,rv_usd:2000000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Hemlo",c:"Canada",s:"Ontario",r:"North America",la:48.72,ln:-85.85,co:["Gold"],pc:"Gold",cp:"Barrick Gold (100%)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of Barrick total 3.91Moz Au (100% Barrick)",em:"~700",dp:"~400m",d:1981,o:1985,rv:"~$358M",dp_meters:400,em_count:700,pr_total_tonnes:30000000,pr_au_oz_pa:3910000,rv_usd:358400000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Hera",c:"Australia",s:"New South Wales",r:"Asia-Pacific",la:-32.16,ln:146.42,co:["Gold","Zinc","Lead"],pc:"Gold",cp:"Aurelia Metals",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Au-Zn-Pb; NSW polymetallic",em:"~200",dp:"~650m",d:2007,o:2013,rv:"~$238M",dp_meters:650,em_count:200,pr_total_tonnes:3000000,pr_au_oz_pa:100000,rv_usd:238900000,pr_year:"FY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Hibbing Taconite",c:"United States",s:"Minnesota",r:"North America",la:47.38,ln:-92.93,co:["Iron Ore"],pc:"Iron Ore",cp:"Cleveland-Cliffs",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Iron ore taconite; MN USA",em:"~700",dp:"~150m",d:1893,o:1976,rv:"~$1.6B",dp_meters:150,em_count:700,pr_total_tonnes:15000000,pr_fe_mt:15,rv_usd:1650000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Highland Valley Copper",c:"Canada",s:"British Columbia",r:"North America",la:50.48,ln:-121.05,co:["Copper","Molybdenum"],pc:"Copper",cp:"Teck Resources",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Mo; ~100kt Cu; BC Canada",em:"~1,500",dp:"~400m",d:1962,o:1972,rs:"~800Mt",no:"Canada's largest copper mine",gr:"0.3% Cu",rv:"~$950M",dp_meters:400,em_count:1500,pr_total_tonnes:55000000,pr_cu_tpa:100000,rs_tonnes:800000000,rv_usd:950000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Hindalco Renukoot",c:"India",s:"Uttar Pradesh",r:"South Asia",la:24.22,ln:83.03,co:["Bauxite"],pc:"Bauxite",cp:"Hindalco Industries (Aditya Birla)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Bauxite; India",em:"~3,000",dp:"~30m",d:1955,o:1968,rv:"~$250M",dp_meters:30,em_count:3000,pr_total_tonnes:5000000,pr_baux_mt:5,rv_usd:250000000,pr_year:"FY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Hope Downs",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.97,ln:119.14,co:["Iron Ore"],pc:"Iron Ore",cp:"Rio Tinto / Hancock Prospecting JV",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Pilbara operations: 328Mt total",em:"~800",dp:"~100m",d:2004,o:2007,rs:"~500Mt",no:"JV with Gina Rinehart's Hancock Prospecting",rv:"~$3.3B",dp_meters:100,em_count:800,pr_total_tonnes:30000000,pr_fe_mt:30,rs_tonnes:500000000,rv_usd:3300000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Hotazel",c:"South Africa",s:"Northern Cape",r:"Africa",la:-27.26,ln:22.96,co:["Manganese"],pc:"Manganese",cp:"South32 (60%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Mn ore; South Africa",em:"~2,000",dp:"~50m",d:1940,o:1940,no:"Mamatwan and Wessels mines in Kalahari Manganese Field",rv:"~$180M",dp_meters:50,em_count:2000,pr_total_tonnes:3000000,pr_mn_mt:3,rv_usd:180000000,pr_year:"FY2025",src_type:"Company",confidence:"High",dq:"B"},{n:"Houndé",c:"Burkina Faso",r:"Africa",la:11.39,ln:-3.49,co:["Gold"],pc:"Gold",cp:"Endeavour Mining (90%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Endeavour 1.1Moz; target >250koz/yr",em:"~1,500",dp:"~80m",d:2015,o:2017,gr:"1.8g/t Au",rv:"~$2.6B",dp_meters:80,em_count:1500,pr_total_tonnes:5000000,pr_au_oz_pa:1100000,rv_usd:2627900000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Hunter Valley Coal Ops",c:"Australia",s:"New South Wales",r:"Hunter Valley",la:-32.37,ln:151.08,co:["Coal (Thermal)"],pc:"Coal (Thermal)",cp:"Glencore / Yancoal",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Thermal coal; NSW",em:"~2,000",dp:"~80m",d:1850,o:1850,rs:"~800Mt",no:"Multiple pits in Hunter Valley",rv:"~$1.3B",dp_meters:80,em_count:2000,pr_total_tonnes:10000000,pr_coal_mt:10,rs_tonnes:800000000,rv_usd:1300000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Huntly",c:"Australia",s:"Western Australia",r:"Darling Range",la:-32.59,ln:116.07,co:["Bauxite"],pc:"Bauxite",cp:"Alcoa",t:"Open Pit",m:"Dragline / Strip Mining",st:"Operating",pr:"Bauxite; WA; ~20Mt",em:"~1,000",dp:"~30m",d:1970,o:1972,rs:"~1.0Bt",no:"World's largest bauxite mine",rv:"~$1.0B",dp_meters:30,em_count:1000,pr_total_tonnes:20000000,pr_baux_mt:20,rs_tonnes:1000000000,rv_usd:1000000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Husab",c:"Namibia",s:"Erongo",r:"Africa",la:-22.55,ln:14.93,co:["Uranium"],pc:"Uranium",cp:"Swakop Uranium (CGN)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"~4,500t U3O8; Namibia",em:"~2,000",d:2012,o:2016,rs:"~280Mt",no:"2nd largest uranium mine globally",rv:"~$877M",em_count:2000,pr_total_tonnes:6000000,pr_u3o8_tpa:4500,rs_tonnes:280000000,rv_usd:877500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Iduapriem",c:"Ghana",r:"Africa",la:5.37,ln:-1.96,co:["Gold"],pc:"Gold",cp:"AngloGold Ashanti",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of AGA total",em:"~1,500",dp:"~120m",d:1990,o:1992,rv:"~$250M",dp_meters:120,em_count:1500,pr_total_tonnes:3000000,pr_au_oz_pa:2700000,rv_usd:250000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Impala Rustenburg",c:"South Africa",s:"North West",r:"Africa",la:-25.6,ln:27.24,co:["Platinum","Palladium","Rhodium"],pc:"Gold",cp:"Impala Platinum",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"PGMs; ~1.1Moz 6E",em:"~20,000",dp:"~1200m",d:1924,o:1925,rs:"~200Mt",no:"One of world's largest platinum complexes",rv:"~$1.0B",dp_meters:1200,em_count:20000,pr_total_tonnes:5000000,pr_au_oz_pa:1100000,pr_pgm_oz_pa:800000,rs_tonnes:200000000,rv_usd:1045000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Island Gold",c:"Canada",s:"Ontario",r:"North America",la:47.98,ln:-83.36,co:["Gold"],pc:"Gold",cp:"Alamos Gold",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of Alamos ~550koz Au; UG high-grade",em:"~700",d:2004,o:2007,gr:"10g/t Au",rv:"~$1.3B",em_count:700,pr_total_tonnes:2000000,pr_au_oz_pa:550000,rv_usd:1314000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Ity",c:"Ivory Coast",s:"Montagnes",r:"Africa",la:6.88,ln:-7.4,co:["Gold"],pc:"Gold",cp:"Endeavour Mining (80%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Endeavour 1.1Moz; target >250koz/yr",em:"~1,500",dp:"~200m",d:1989,o:1990,no:"CIL plant built 2019",gr:"1.5g/t Au",rv:"~$2.6B",dp_meters:200,em_count:1500,pr_total_tonnes:5000000,pr_au_oz_pa:1100000,rv_usd:2627900000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Jacinth-Ambrosia",c:"Australia",s:"South Australia",r:"Asia-Pacific",la:-31.55,ln:131.42,co:["Titanium"],pc:"Titanium",cp:"Iluka Resources",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ti mineral sands; SA Australia",em:"~200",dp:"~40m",d:2007,o:2012,rv:"~$750M",dp_meters:40,em_count:200,pr_total_tonnes:3000000,pr_ti_kt:300,rv_usd:750000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Jamalco",c:"Jamaica",r:"Caribbean",la:17.97,ln:-77.17,co:["Bauxite"],pc:"Bauxite",cp:"General Alumina Jamaica",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Bauxite; Jamaica",em:"~800",dp:"~30m",d:1953,o:1961,rv:"~$400M",dp_meters:30,em_count:800,pr_total_tonnes:8000000,pr_baux_mt:8,rv_usd:400000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Jiangxi Lithium",c:"China",s:"Jiangxi",r:"Asia-Pacific",la:28.38,ln:114.52,co:["Lithium"],pc:"Lithium",cp:"Ganfeng Lithium",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Li; China domestic",em:"~1,500",dp:"~300m",d:1995,o:2005,rv:"~$80M",dp_meters:300,em_count:1500,pr_total_tonnes:2000000,pr_li_tpa:10000,rv_usd:80000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Jimblebar",c:"Australia",s:"Western Australia",r:"Pilbara",la:-23.28,ln:119.78,co:["Iron Ore"],pc:"Iron Ore",cp:"BHP",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"73Mt iron ore (100% basis FY24)",em:"~1,200",dp:"~100m",d:1985,o:1994,rs:"~800Mt",no:"Major hub in BHP's Pilbara network",rv:"~$8.0B",dp_meters:100,em_count:1200,pr_total_tonnes:73000000,pr_fe_mt:73,rs_tonnes:800000000,rv_usd:8030000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Jundee",c:"Australia",s:"Western Australia",r:"Goldfields",la:-26.38,ln:120.6,co:["Gold"],pc:"Gold",cp:"Northern Star Resources",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of NST Yandal ops",em:"~800",dp:"~600m",d:1990,o:1994,no:"High-grade underground gold",rv:"~$716M",dp_meters:600,em_count:800,pr_total_tonnes:3000000,pr_au_oz_pa:300000,rv_usd:716700000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Juruti",c:"Brazil",s:"Pará",r:"Latin America",la:-2.15,ln:-56.09,co:["Bauxite"],pc:"Bauxite",cp:"Alcoa",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Bauxite; Brazil",em:"~600",dp:"~30m",d:2006,o:2009,rv:"~$500M",dp_meters:30,em_count:600,pr_total_tonnes:10000000,pr_baux_mt:10,rv_usd:500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Jwaneng",c:"Botswana",s:"Southern District",r:"Africa",la:-24.53,ln:24.72,co:["Diamonds"],pc:"Diamonds",cp:"Debswana (De Beers 50% / Botswana Govt 50%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"World's richest diamond mine by value",em:"~3,000",dp:"~400m",d:1973,o:1982,no:"Richest diamond mine in the world by value",gr:"100+ cpht",rv:"~$1.5B",dp_meters:400,em_count:3000,pr_total_tonnes:2000000,pr_carats_pa:12000000,rv_usd:1500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"KGHM Polkowice",c:"Poland",s:"Lower Silesia",r:"Europe",la:51.5,ln:16.05,co:["Copper","Silver"],pc:"Copper",cp:"KGHM Polska Miedź",t:"Underground",m:"Cut & Fill",st:"Operating",pr:"Cu-Ag; ~500kt Cu total KGHM Poland",em:"~12,000",dp:"~1200m",d:1957,o:1968,rs:"~1.5Bt",no:"World's largest silver producer",gr:"1.5% Cu, 50g/t Ag",rv:"~$1.9B",dp_meters:1200,em_count:12000,pr_total_tonnes:30000000,pr_cu_tpa:500000,rs_tonnes:1500000000,rv_usd:1900000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Kalgold",c:"South Africa",s:"North West",r:"Africa",la:-25.47,ln:26.13,co:["Gold"],pc:"Gold",cp:"Harmony Gold",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"OP Au; SA",em:"~400",d:1989,o:1995,rv:"~$477M",em_count:400,pr_total_tonnes:5000000,pr_au_oz_pa:200000,rv_usd:477800000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Kamoa-Kakula",c:"DR Congo",s:"Katanga",r:"Africa",la:-10.77,ln:25.25,co:["Copper"],pc:"Copper",cp:"Ivanhoe Mines (39.6%) / Zijin (39.6%) / Crystal River (0.8%) / DRC Govt (20%)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Cu ~400kt; world-class new Cu mine",em:"~3,000",d:2012,o:2021,no:"Rapid ramp-up, becoming one of world's largest Cu mines",gr:"5.2% Cu",rv:"~$3.8B",em_count:3000,pr_total_tonnes:60000000,pr_cu_tpa:400000,rv_usd:3800000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Kamoto (KCC)",c:"DR Congo",s:"Lualaba",r:"Africa",la:-10.75,ln:25.53,co:["Copper","Cobalt"],pc:"Copper",cp:"Glencore (75%)",t:"Open Pit & Underground",m:"Open Stoping",st:"Operating",pr:"Cu-Co; DRC; same as KCC",em:"~8,000",dp:"~500m",d:1956,o:1979,rs:"~500Mt",no:"Major Cu-Co complex",gr:"3.5% Cu, 0.3% Co",rv:"~$475M",dp_meters:500,em_count:8000,pr_total_tonnes:10000000,pr_cu_tpa:200000,rs_tonnes:500000000,rv_usd:475000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Kansanshi",c:"Zambia",s:"North-Western Province",r:"Africa",la:-12.1,ln:26.42,co:["Copper","Gold"],pc:"Copper",cp:"First Quantum Minerals (80%)",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Cu-Au; ~200kt Cu; Zambia's largest Cu mine",em:"~6,000",dp:"~300m",d:1899,o:2005,rs:"~1.0Bt",no:"Africa's largest Cu mine by production",gr:"0.7% Cu",rv:"~$1.9B",dp_meters:300,em_count:6000,pr_total_tonnes:30000000,pr_cu_tpa:200000,rs_tonnes:1000000000,rv_usd:1900000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Karara",c:"Australia",s:"Western Australia",r:"Mid West",la:-29.2,ln:116.68,co:["Iron Ore"],pc:"Iron Ore",cp:"Ansteel / Gindalbie JV",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Iron ore; magnetite; WA",em:"~600",dp:"~100m",d:2006,o:2012,rs:"~1.0Bt",no:"Magnetite operation",rv:"~$1.1B",dp_meters:100,em_count:600,pr_total_tonnes:10000000,pr_fe_mt:10,rs_tonnes:1000000000,rv_usd:1100000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"Karma",c:"Burkina Faso",r:"Africa",la:13.2,ln:-1.6,co:["Gold"],pc:"Gold",cp:"Endeavour sold; now third party",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Divested; non-core",em:"~1,200",dp:"~50m",d:2012,o:2016,dp_meters:50,em_count:1200,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"D"},{n:"Kassandra Mines",c:"Greece",s:"Halkidiki",r:"Europe",la:40.45,ln:23.85,co:["Gold","Silver","Copper","Zinc"],pc:"Copper",cp:"Eldorado Gold",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Au-Ag-Cu-Zn; Greece; Olympias/Skouries",em:"~1,500",dp:"~500m",d:600,o:1960,no:"Skouries & Olympias deposits",dp_meters:500,em_count:1500,pr_total_tonnes:5000000,pr_au_oz_pa:100000,pr_cu_tpa:10000,pr_zn_tpa:20000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Kayad",c:"India",s:"Rajasthan",r:"Ajmer",la:26.5,ln:74.95,co:["Zinc","Lead"],pc:"Zinc",cp:"Hindustan Zinc (Vedanta)",t:"Underground",m:"Cut & Fill",st:"Operating",pr:"Part of HZL integrated operations",em:"~500",dp:"~300m",d:2003,o:2013,rs:"~15Mt",no:"Newest HZL underground mine",dp_meters:300,em_count:500,pr_total_tonnes:8000000,pr_zn_tpa:80000,rs_tonnes:15000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Kenmare Moma",c:"Mozambique",r:"Africa",la:-16.64,ln:39.43,co:["Titanium"],pc:"Titanium",cp:"Kenmare Resources",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ti mineral sands; Mozambique",em:"~1,200",dp:"~30m",d:1961,o:2007,rv:"~$500M",dp_meters:30,em_count:1200,pr_total_tonnes:2000000,pr_ti_kt:200,rv_usd:500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Kestrel",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-23.4,ln:148.74,co:["Coal (Met)"],pc:"Coal (Met)",cp:"EMR Capital / Adaro JV",t:"Underground",m:"Longwall",st:"Operating",pr:"Met coal; QLD UG",em:"~700",dp:"~250m",d:1991,o:1999,rs:"~300Mt",no:"High-quality coking coal",rv:"~$750M",dp_meters:250,em_count:700,pr_total_tonnes:3000000,pr_coal_mt:3,rs_tonnes:300000000,rv_usd:750000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Kevitsa",c:"Finland",s:"Lapland",r:"Europe",la:67.7,ln:26.97,co:["Nickel","Copper","PGMs"],pc:"Copper",cp:"Boliden",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Boliden Mines; Ni-Cu-PGM",em:"~500",dp:"~350m",d:1987,o:2012,rs:"~300Mt",no:"Major Nordic Ni-Cu mine",gr:"0.3% Cu, 0.2% Ni",rv:"~$142M",dp_meters:350,em_count:500,pr_total_tonnes:3000000,pr_cu_tpa:30000,pr_ni_tpa:10000,rs_tonnes:300000000,rv_usd:142500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Khouribga",c:"Morocco",r:"Africa",la:32.88,ln:-6.91,co:["Phosphate"],pc:"Phosphate",cp:"OCP Group",t:"Open Pit",m:"Dragline / Strip Mining",st:"Operating",pr:"Phosphate; Morocco; world's largest",em:"~10,000",dp:"~30m",d:1921,o:1921,no:"World's largest phosphate operation",rv:"~$3.5B",dp_meters:30,em_count:10000,pr_total_tonnes:35000000,pr_phos_mt:35,rv_usd:3500000000,pr_year:"CY2024",src_type:"Government",confidence:"High",dq:"B"},{n:"Kibali",c:"DR Congo",s:"Haut-Uélé",r:"Africa",la:3.01,ln:30.29,co:["Gold"],pc:"Gold",cp:"Barrick (45%) / AngloGold Ashanti (45%) / DRC (10%)",t:"Open Pit & Underground",m:"Open Stoping",st:"Operating",pr:"Au ~700koz (100% basis); DRC",em:"~5,000",dp:"~500m",d:2009,o:2013,no:"Africa's largest gold mine",gr:"3.5g/t Au",rv:"~$1.7B",dp_meters:500,em_count:5000,pr_total_tonnes:14000000,pr_au_oz_pa:700000,rv_usd:1672300000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Kidd Creek",c:"Canada",s:"Ontario",r:"North America",la:48.68,ln:-81.37,co:["Copper","Zinc","Silver"],pc:"Copper",cp:"Glencore",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"Cu-Zn-Ag; deep UG Canada",em:"~1,500",dp:"~3000m",d:1963,o:1966,rs:"~10Mt",no:"Deepest base metal mine in the world",gr:"3% Cu, 6% Zn",rv:"~$190M",dp_meters:3000,em_count:1500,pr_total_tonnes:4000000,pr_cu_tpa:40000,pr_zn_tpa:60000,rs_tonnes:10000000,rv_usd:190000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Kinsevere",c:"DR Congo",s:"Katanga",r:"Africa",la:-11.37,ln:27.57,co:["Copper"],pc:"Copper",cp:"CMOC Group",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu; DRC",em:"~1,200",d:1990,o:2010,rv:"~$380M",em_count:1200,pr_total_tonnes:8000000,pr_cu_tpa:60000,rv_usd:380000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Kiruna",c:"Sweden",s:"Norrbotten",r:"Europe",la:67.85,ln:20.22,co:["Iron Ore"],pc:"Iron Ore",cp:"LKAB (Swedish State)",t:"Underground",m:"Sub-level Caving",st:"Operating",pr:"Iron ore; world's largest UG iron mine ~27Mt",em:"~4,000",dp:"~1365m",d:1898,o:1899,rs:"~600Mt",no:"World's largest UG iron ore mine, city being relocated",gr:"60% Fe",rv:"~$3.0B",dp_meters:1365,em_count:4000,pr_total_tonnes:27000000,pr_fe_mt:27,rs_tonnes:600000000,rv_usd:2970000000,pr_year:"CY2024",rs_year:"2024",src_type:"Government",confidence:"High",dq:"A"},{n:"Kloof",c:"South Africa",s:"Gauteng",r:"Africa",la:-26.41,ln:27.58,co:["Gold"],pc:"Gold",cp:"Sibanye-Stillwater",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"SA gold ops",em:"~4,000",dp:"~3000m",d:1934,o:1951,rv:"~$358M",dp_meters:3000,em_count:4000,pr_total_tonnes:3000000,pr_au_oz_pa:150000,rv_usd:358400000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Kolomela",c:"South Africa",s:"Northern Cape",r:"Africa",la:-28.42,ln:22.17,co:["Iron Ore"],pc:"Iron Ore",cp:"Kumba Iron Ore (Anglo American 69.7%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"~12Mt iron ore",em:"~1,500",dp:"~100m",d:2007,o:2011,rv:"~$1.3B",dp_meters:100,em_count:1500,pr_total_tonnes:12000000,pr_fe_mt:12,rv_usd:1320000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Kolwezi (KOV)",c:"DR Congo",s:"Lualaba",r:"Africa",la:-10.72,ln:25.47,co:["Copper","Cobalt"],pc:"Copper",cp:"Glencore",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Co; DRC Glencore",em:"~4,000",dp:"~300m",d:1956,o:1956,rs:"~200Mt",no:"Kamoto open pit",rv:"~$950M",dp_meters:300,em_count:4000,pr_total_tonnes:20000000,pr_cu_tpa:50000,rs_tonnes:200000000,rv_usd:950000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Konkola",c:"Zambia",s:"Copperbelt",r:"Africa",la:-12.39,ln:27.8,co:["Copper","Cobalt"],pc:"Copper",cp:"Vedanta Resources / KCM",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Cu-Co; Zambia deep UG",em:"~9,000",dp:"~1200m",d:1956,o:1960,rs:"~500Mt",no:"KCM under provisional liquidation/restructuring; includes Konkola Deep",rv:"~$237M",dp_meters:1200,em_count:9000,pr_total_tonnes:5000000,pr_cu_tpa:100000,rs_tonnes:500000000,rv_usd:237500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"Kounrad (Balkhash)",c:"Kazakhstan",s:"Karagandy",r:"CIS",la:46.85,ln:74.98,co:["Copper"],pc:"Copper",cp:"Central Asia Metals (CAML)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu; Kazakhstan SX-EW",em:"~3,000",dp:"~400m",d:1928,o:1936,rs:"~1.0Bt",no:"Historic Soviet-era copper mine",rv:"~$712M",dp_meters:400,em_count:3000,pr_total_tonnes:15000000,pr_cu_tpa:12000,rs_tonnes:1000000000,rv_usd:712500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Kumtor",c:"Kyrgyzstan",r:"CIS",la:41.87,ln:78.19,co:["Gold"],pc:"Gold",cp:"Kyrgyzaltyn (Kyrgyz State)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Au ~500koz; now state-controlled",em:"~3,000",dp:"~600m",d:1978,o:1997,no:"Expropriated from Centerra Gold in 2021",rv:"~$1.2B",dp_meters:600,em_count:3000,pr_total_tonnes:8000000,pr_au_oz_pa:500000,rv_usd:1194500000,pr_year:"CY2024",src_type:"Government",confidence:"Medium",dq:"B"},{n:"Kupol",c:"Russia",s:"Chukotka",r:"CIS",la:66.9,ln:169.53,co:["Gold","Silver"],pc:"Gold",cp:"Kinross Gold",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of Kinross total; Russia",em:"~1,500",dp:"~400m",d:2006,o:2008,gr:"10g/t Au",dp_meters:400,em_count:1500,pr_total_tonnes:10000000,pr_au_oz_pa:300000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Kusile/Kendal Coal",c:"South Africa",s:"Mpumalanga",r:"Africa",la:-26.05,ln:29,co:["Coal (Thermal)"],pc:"Coal (Thermal)",cp:"Anglo American (divesting)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Thermal coal; supply to Eskom",em:"~4,000",dp:"~100m",d:1980,o:2003,no:"Anglo American divesting SA thermal coal",rv:"~$1.3B",dp_meters:100,em_count:4000,pr_total_tonnes:10000000,pr_coal_mt:10,rv_usd:1300000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"LaRonde",c:"Canada",s:"Quebec",r:"North America",la:48.23,ln:-78.23,co:["Gold","Silver","Copper","Zinc"],pc:"Gold",cp:"Agnico Eagle Mines",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of AEM total; LaRonde complex",em:"~800",dp:"~3100m",d:1988,o:1988,no:"One of deepest mines in Americas",gr:"5.0g/t Au",rv:"~$597M",dp_meters:3100,em_count:800,pr_total_tonnes:4000000,pr_au_oz_pa:250000,rv_usd:597200000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Lanigan",c:"Canada",s:"Saskatchewan",r:"North America",la:51.85,ln:-105.02,co:["Potash"],pc:"Potash",cp:"Nutrien",t:"Underground",m:"Longwall",st:"Operating",pr:"Part of Nutrien potash",em:"~600",dp:"~1000m",d:1952,o:1968,rv:"~$900M",dp_meters:1000,em_count:600,pr_total_tonnes:3000000,pr_potash_mt:1.8,rv_usd:900000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Las Bambas",c:"Peru",s:"Apurímac",r:"Latin America",la:-14.06,ln:-72.33,co:["Copper","Gold"],pc:"Copper",cp:"MMG Limited (62.5%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu ~300kt; major Peru Cu mine",em:"~3,000",dp:"~300m",d:2010,o:2016,rs:"~1.2Bt",no:"Significant community opposition",gr:"0.6% Cu",rv:"~$2.9B",dp_meters:300,em_count:3000,pr_total_tonnes:75000000,pr_cu_tpa:300000,rs_tonnes:1200000000,rv_usd:2850000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Leinster (Nickel West)",c:"Australia",s:"Western Australia",r:"Goldfields",la:-27.84,ln:120.7,co:["Nickel"],pc:"Nickel",cp:"BHP (Nickel West)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Ni; BHP Nickel West; ~80kt Ni total",em:"~1,000",dp:"~1200m",d:1969,o:1978,rs:"~50Mt",no:"BHP reviewing Nickel West future due to low prices",gr:"1.8% Ni",rv:"~$495M",dp_meters:1200,em_count:1000,pr_total_tonnes:10000000,pr_ni_tpa:80000,rs_tonnes:50000000,rv_usd:495000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Letpadaung",c:"Myanmar",s:"Sagaing",r:"Southeast Asia",la:21.18,ln:95.15,co:["Copper"],pc:"Copper",cp:"Wanbao Mining (China)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu; Myanmar",em:"~5,000",dp:"~200m",d:1999,o:2014,rs:"~500Mt",no:"Political instability in Myanmar",rv:"~$475M",dp_meters:200,em_count:5000,pr_total_tonnes:10000000,pr_cu_tpa:100000,rs_tonnes:500000000,rv_usd:475000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Low",dq:"A"},{n:"Lihir",c:"Papua New Guinea",s:"New Ireland",r:"Asia-Pacific",la:-3.12,ln:152.63,co:["Gold"],pc:"Gold",cp:"Newmont",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"614koz Au (CY2024)",em:"~4,000",dp:"~300m",d:1982,o:1997,no:"In active volcanic caldera",gr:"2.5g/t Au",rv:"~$2.0B",dp_meters:300,em_count:4000,pr_total_tonnes:14000000,pr_au_oz_pa:614000,rv_usd:1959800000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Long Canyon",c:"United States",s:"Nevada",r:"North America",la:40.66,ln:-114.65,co:["Gold"],pc:"Gold",cp:"Nevada Gold Mines (Barrick 61.5% / Newmont 38.5%)",t:"Open Pit",m:"Truck & Shovel",st:"Care & Maintenance",pr:"Residual leach pad ounces only",d:2010,o:2017,no:"Placed on care and maintenance end of 2023",rv:"~$119M",pr_total_tonnes:1000000,pr_au_oz_pa:50000,rv_usd:119500000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Los Bronces",c:"Chile",s:"Santiago Metro",r:"Latin America",la:-33.13,ln:-70.28,co:["Copper","Molybdenum"],pc:"Copper",cp:"Anglo American",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Anglo Cu ~730kt CY2024",em:"~2,500",dp:"~400m",d:1820,o:1952,rs:"~2.0Bt",no:"65km from Santiago, at 3,500m",gr:"0.5% Cu",rv:"~$3.6B",dp_meters:400,em_count:2500,pr_total_tonnes:75000000,pr_cu_tpa:200000,rs_tonnes:2000000000,rv_usd:3562500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Los Pelambres",c:"Chile",s:"Coquimbo",r:"Latin America",la:-31.72,ln:-70.5,co:["Copper","Gold","Molybdenum"],pc:"Copper",cp:"Antofagasta Minerals (60%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Mo-Au; ~330kt Cu",em:"~3,000",dp:"~500m",d:1914,o:2000,rs:"~2.0Bt",no:"Major porphyry at high altitude",gr:"0.6% Cu",rv:"~$3.1B",dp_meters:500,em_count:3000,pr_total_tonnes:90000000,pr_cu_tpa:330000,rs_tonnes:2000000000,rv_usd:3135000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Loulo-Gounkoto",c:"Mali",s:"Kayes",r:"Africa",la:12.87,ln:-11.58,co:["Gold"],pc:"Gold",cp:"Barrick Gold (80%) / Mali Govt (20%)",t:"Open Pit & Underground",m:"Open Stoping",st:"Operating",pr:"723koz Au (CY2024, 100% basis; Barrick 80%)",em:"~5,000",dp:"~500m",d:1981,o:1984,no:"Barrick's largest African gold complex",gr:"4.5g/t Au",rv:"~$1.7B",dp_meters:500,em_count:5000,pr_total_tonnes:9000000,pr_au_oz_pa:723000,rv_usd:1727400000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Lumwana",c:"Zambia",s:"North-Western Province",r:"Africa",la:-12.1,ln:25.85,co:["Copper"],pc:"Copper",cp:"Barrick Gold (100%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu production (part of 195kt total Barrick Cu CY2024)",em:"~3,000",dp:"~300m",d:1969,o:2008,rs:"~1.0Bt",no:"Super pit expansion underway",gr:"0.52% Cu",rv:"~$1.9B",dp_meters:300,em_count:3000,pr_total_tonnes:5000000,pr_cu_tpa:130000,rs_tonnes:1000000000,rv_usd:1852500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Ma'aden Phosphate",c:"Saudi Arabia",s:"Northern Borders",r:"Middle East",la:31.4,ln:37.3,co:["Phosphate"],pc:"Phosphate",cp:"Ma'aden",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Phosphate; Saudi Arabia",em:"~5,000",dp:"~50m",d:1994,o:2011,rv:"~$500M",dp_meters:50,em_count:5000,pr_total_tonnes:5000000,pr_phos_mt:5,rv_usd:500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Macassa",c:"Canada",s:"Ontario",r:"North America",la:48.11,ln:-80.06,co:["Gold"],pc:"Gold",cp:"Agnico Eagle Mines",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Higher production CY2024 vs prior year",em:"~500",dp:"~2000m",d:1933,o:1933,gr:"18g/t Au",rv:"~$477M",dp_meters:2000,em_count:500,pr_total_tonnes:3000000,pr_au_oz_pa:200000,rv_usd:477800000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Mahd Ad Dhahab",c:"Saudi Arabia",s:"Madinah",r:"Middle East",la:23.5,ln:40.85,co:["Gold","Silver","Copper"],pc:"Copper",cp:"Ma'aden",t:"Underground",m:"Cut & Fill",st:"Operating",pr:"Au-Ag-Cu; Saudi Arabia",em:"~500",dp:"~300m",d:-2000,o:570,no:"Cradle of Gold - ancient mine",dp_meters:300,em_count:500,pr_total_tonnes:5000000,pr_au_oz_pa:30000,pr_cu_tpa:2000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Man Sum",c:"Myanmar",r:"Southeast Asia",la:21.93,ln:99.26,co:["Tin"],pc:"Tin",cp:"Myanmar Tin Mining",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Sn; Myanmar",em:"~500",em_count:500,pr_total_tonnes:1000000,pr_sn_kt:30,pr_year:"CY2024",src_type:"Company",confidence:"Low",dq:"B"},{n:"Marandoo",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.62,ln:118.13,co:["Iron Ore"],pc:"Iron Ore",cp:"Rio Tinto",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Pilbara operations: 328Mt total",em:"~600",dp:"~120m",d:1992,o:1994,rs:"~300Mt",no:"Near Karijini National Park",rv:"~$2.2B",dp_meters:120,em_count:600,pr_total_tonnes:20000000,pr_fe_mt:20,rs_tonnes:300000000,rv_usd:2200000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Marigold",c:"United States",s:"Nevada",r:"North America",la:40.59,ln:-117.42,co:["Gold"],pc:"Gold",cp:"SSR Mining",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Au; Nevada OP heap leach",em:"~400",gr:"0.5g/t Au",rv:"~$238M",em_count:400,pr_total_tonnes:10000000,pr_au_oz_pa:100000,rv_usd:238900000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Marikana",c:"South Africa",s:"North West",r:"Africa",la:-25.7,ln:27.47,co:["PGMs","Nickel","Copper"],pc:"Gold",cp:"Sibanye-Stillwater",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"Part of Sibanye SA PGM ops ~1.6Moz 4E",em:"~20,000",dp:"~1500m",rs:"~200Mt",no:"Major PGM complex, site of 2012 tragedy",rv:"~$475M",dp_meters:1500,em_count:20000,pr_total_tonnes:10000000,pr_au_oz_pa:1600000,rs_tonnes:200000000,rv_usd:475000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"McArthur River",c:"Australia",s:"Northern Territory",r:"Gulf",la:-16.44,ln:136.1,co:["Zinc","Lead","Silver"],pc:"Zinc",cp:"Glencore",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Impacted by tropical cyclone Q1; part of Glencore Zn",em:"~600",rs:"~200Mt",no:"One of world's largest Zn-Pb deposits",gr:"8% Zn",em_count:600,pr_total_tonnes:5000000,pr_zn_tpa:200000,rs_tonnes:200000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Meadowbank/Amaruq",c:"Canada",s:"Nunavut",r:"North America",la:65.02,ln:-96.07,co:["Gold"],pc:"Gold",cp:"Agnico Eagle Mines",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Higher production CY2024; nearing end of mine life",em:"~1,000",dp:"~200m",no:"Arctic gold mine",gr:"3.0g/t Au",rv:"~$238M",dp_meters:200,em_count:1000,pr_total_tonnes:2000000,pr_au_oz_pa:100000,rv_usd:238900000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Merian",c:"Suriname",s:"Sipaliwini",la:4.75,ln:-54.55,co:["Gold"],pc:"Gold",cp:"Newmont (75%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"274koz Au (100% basis CY2024; Newmont 75%)",em:"~1,500",dp:"~100m",no:"In Amazon rainforest",gr:"1.3g/t Au",rv:"~$654M",dp_meters:100,em_count:1500,pr_total_tonnes:6000000,pr_au_oz_pa:274000,rv_usd:654600000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Middlemount",c:"Australia",s:"Queensland",r:"Asia-Pacific",la:-22.81,ln:148.69,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Peabody Energy (50%) / Yancoal (50%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Met coal; QLD",em:"~600",dp:"~150m",rv:"~$1.2B",dp_meters:150,em_count:600,pr_total_tonnes:5000000,pr_coal_mt:5,rv_usd:1250000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Minas Rio",c:"Brazil",s:"Minas Gerais",r:"Latin America",la:-18.5,ln:-43.42,co:["Iron Ore"],pc:"Iron Ore",cp:"Anglo American",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"~26Mt iron ore CY2024",em:"~3,000",dp:"~100m",rv:"~$2.9B",dp_meters:100,em_count:3000,pr_total_tonnes:26000000,pr_fe_mt:26,rv_usd:2860000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Mining Area C / South Flank",c:"Australia",s:"Western Australia",r:"Pilbara",la:-23.13,ln:119.3,co:["Iron Ore"],pc:"Iron Ore",cp:"BHP",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"106Mt iron ore (Area C JV, BHP share FY24); South Flank ramped to 80Mtpa",em:"~2,500",dp:"~100m",rs:"~2.0Bt",no:"South Flank $3.6B expansion, BHP's biggest Pilbara hub",rv:"~$11.7B",dp_meters:100,em_count:2500,pr_total_tonnes:106000000,pr_fe_mt:106,rs_tonnes:2000000000,rv_usd:11660000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Ministro Hales",c:"Chile",s:"Antofagasta",r:"Latin America",la:-22.38,ln:-68.88,co:["Copper"],pc:"Copper",cp:"Codelco",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Codelco total",em:"~1,500",dp:"~300m",rs:"~900Mt",no:"Codelco newest mine",rv:"~$1.4B",dp_meters:300,em_count:1500,pr_total_tonnes:30000000,pr_cu_tpa:170000,rs_tonnes:900000000,rv_usd:1425000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Moa Bay",c:"Cuba",r:"Caribbean",la:20.65,ln:-74.93,co:["Nickel","Cobalt"],pc:"Nickel",cp:"Sherritt International (50%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni-Co; Cuba; laterite",em:"~3,000",rv:"~$198M",em_count:3000,pr_total_tonnes:4000000,pr_ni_tpa:15000,rv_usd:198000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Moanda",c:"Gabon",r:"Africa",la:-1.57,ln:13.25,co:["Manganese"],pc:"Manganese",cp:"Eramet (COMILOG)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Mn; Gabon; ~5Mt",em:"~2,000",rv:"~$125M",em_count:2000,pr_total_tonnes:5000000,pr_mn_mt:5,rv_usd:125000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Moatize",c:"Mozambique",s:"Tete",r:"Africa",la:-16.12,ln:33.88,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Vulcan Mining (ex-Vale)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Met coal; Mozambique",em:"~3,000",dp:"~150m",rs:"~2.0Bt",no:"Vale divested Mozambique coal ops",rv:"~$2.5B",dp_meters:150,em_count:3000,pr_total_tonnes:10000000,pr_coal_mt:10,rs_tonnes:2000000000,rv_usd:2500000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"Mogalakwena",c:"South Africa",s:"Limpopo",r:"Africa",la:-23.68,ln:28.93,co:["Platinum","Palladium","Rhodium"],pc:"Platinum",cp:"Anglo American Platinum",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"PGMs; world's largest OP PGM mine",em:"~4,000",dp:"~250m",d:1993,o:1993,rs:"~500Mt",no:"World's largest open-pit platinum mine",dp_meters:250,em_count:4000,pr_total_tonnes:10000000,pr_pgm_oz_pa:800000,rs_tonnes:500000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Moranbah North",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-21.93,ln:148.09,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Anglo American",t:"Underground",m:"Longwall",st:"Operating",pr:"Met coal; part of Anglo steelmaking coal",em:"~800",dp:"~300m",rs:"~400Mt",no:"Anglo American divesting steelmaking coal business",rv:"~$2.0B",dp_meters:300,em_count:800,pr_total_tonnes:8000000,pr_coal_mt:8,rs_tonnes:400000000,rv_usd:2000000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Morenci",c:"United States",s:"Arizona",r:"North America",la:33.08,ln:-109.35,co:["Copper"],pc:"Copper",cp:"Freeport-McMoRan (72%) / Sumitomo (28%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of FCX Americas Cu ~1.5Mt; largest US Cu mine",em:"~3,800",dp:"~500m",d:1872,o:1939,rs:"~3.5Bt",no:"Largest copper mine in North America",gr:"0.3% Cu",rv:"~$2.4B",dp_meters:500,em_count:3800,pr_total_tonnes:130000000,pr_cu_tpa:380000,rs_tonnes:3500000000,rv_usd:2375000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Morowali IMIP",c:"Indonesia",s:"Central Sulawesi",r:"Asia-Pacific",la:-2.55,ln:121.6,co:["Nickel"],pc:"Nickel",cp:"Tsingshan / Various Chinese JV",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni NPI/HPAL; Indonesia industrial park",em:"~20,000",rs:"~1.0Bt",no:"World's largest nickel processing park",gr:"1.5% Ni",rv:"~$247M",em_count:20000,pr_total_tonnes:5000000,pr_ni_tpa:200000,rs_tonnes:1000000000,rv_usd:247500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"Mothae",c:"Lesotho",s:"Mokhotlong",r:"Africa",la:-29.3,ln:29.2,co:["Diamonds"],pc:"Diamonds",cp:"Lucara Diamond",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Lesotho; high-value large stones",em:"~400",dp:"~200m",no:"Ownership may have changed; verify",dp_meters:200,em_count:400,pr_total_tonnes:500000,pr_carats_pa:200000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Mount Isa",c:"Australia",s:"Queensland",r:"North West QLD",la:-20.73,ln:139.49,co:["Copper","Zinc","Lead","Silver"],pc:"Copper",cp:"Glencore",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Increased Cu production H2 after regional flooding",em:"~3,000",dp:"~1800m",d:1923,o:1931,no:"One of the most productive single mines in history",gr:"6% Zn, 3% Cu",rv:"~$807M",dp_meters:1800,em_count:3000,pr_total_tonnes:17000000,pr_cu_tpa:120000,pr_zn_tpa:200000,rv_usd:807500000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Mount Keith",c:"Australia",s:"Western Australia",r:"Goldfields",la:-27.23,ln:120.55,co:["Nickel"],pc:"Nickel",cp:"BHP (Nickel West)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni; BHP Nickel West",em:"~600",dp:"~400m",d:1969,o:1994,rs:"~300Mt",no:"Large low-grade disseminated Ni sulphide",rv:"~$495M",dp_meters:400,em_count:600,pr_total_tonnes:10000000,rs_tonnes:300000000,rv_usd:495000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Mount Pass",c:"United States",s:"California",r:"North America",la:35.48,ln:-115.53,co:["Rare Earths"],pc:"Rare Earths",cp:"MP Materials",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"REE; ~40kt REO; only major US REE mine",em:"~500",d:1949,o:1952,no:"Only operating rare earth mine in US",gr:"7% REO",rv:"~$1.0B",em_count:500,pr_total_tonnes:1500000,pr_reo_kt:40,rv_usd:1000000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Mount Rawdon",c:"Australia",s:"Queensland",r:"Asia-Pacific",la:-25.08,ln:151.57,co:["Gold"],pc:"Gold",cp:"Evolution Mining",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Au; nearing end of mine life",em:"~300",d:1990,o:2001,rv:"~$238M",em_count:300,pr_total_tonnes:2000000,pr_au_oz_pa:100000,rv_usd:238900000,pr_year:"FY2025",src_type:"Company",confidence:"High",dq:"B"},{n:"Mount Weld",c:"Australia",s:"Western Australia",r:"Laverton",la:-28.77,ln:122.55,co:["Rare Earths"],pc:"Rare Earths",cp:"Lynas Rare Earths",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Same as Lynas Mount Weld REE",em:"~300",dp:"~100m",d:1988,o:2011,rs:"~24Mt",no:"Richest known rare earth deposit, only major non-Chinese producer",gr:"8% REO",dp_meters:100,em_count:300,pr_total_tonnes:1500000,pr_reo_kt:10,rs_tonnes:24000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Mount Whaleback",c:"Australia",s:"Western Australia",r:"Pilbara",la:-23.36,ln:119.67,co:["Iron Ore"],pc:"Iron Ore",cp:"BHP",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"58Mt iron ore (Newman JV, BHP share FY24)",em:"~3,500",dp:"~300m",d:1957,o:1969,rs:"~700Mt",no:"One of the largest single-pit iron ore mines in the world",gr:"62% Fe",rv:"~$6.4B",dp_meters:300,em_count:3500,pr_total_tonnes:58000000,pr_fe_mt:58,rs_tonnes:700000000,rv_usd:6380000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Mponeng",c:"South Africa",s:"Gauteng",r:"Africa",la:-26.42,ln:27.42,co:["Gold"],pc:"Gold",cp:"Harmony Gold",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"World's deepest Au mine; ~230koz",em:"~5,000",dp:"~4000m",d:1981,o:1986,no:"Deepest mine in the world at ~4km",gr:"8.0g/t Au",rv:"~$549M",dp_meters:4000,em_count:5000,pr_total_tonnes:3000000,pr_au_oz_pa:230000,rv_usd:549500000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Mt Arthur",c:"Australia",s:"New South Wales",r:"Asia-Pacific",la:-32.33,ln:150.87,co:["Coal (Thermal)"],pc:"Coal (Thermal)",cp:"BHP",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"15.4Mt thermal coal (FY24); planned closure FY30",em:"~2,000",dp:"~150m",d:1985,o:1986,rv:"~$2.0B",dp_meters:150,em_count:2000,pr_total_tonnes:15400000,pr_coal_mt:15.4,rv_usd:2002000000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Mt Marion",c:"Australia",s:"Western Australia",r:"Goldfields",la:-31.19,ln:121.55,co:["Lithium"],pc:"Lithium",cp:"Mineral Resources (50%) / Ganfeng (50%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Li; WA",em:"~400",dp:"~150m",d:2014,o:2017,rs:"~35Mt",no:"Near Kalgoorlie",gr:"1.4% Li2O",rv:"~$200M",dp_meters:150,em_count:400,pr_total_tonnes:5000000,pr_li_tpa:400000,rs_tonnes:35000000,rv_usd:200000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Mufulira",c:"Zambia",r:"Africa",la:-12.53,ln:28.24,co:["Copper"],pc:"Copper",cp:"Mopani Copper Mines (ZCCM-IH)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Cu; Zambia; Mopani",em:"~2,000",dp:"~1400m",d:1933,o:1933,no:"Glencore transferred to Zambian govt entity",rv:"~$237M",dp_meters:1400,em_count:2000,pr_total_tonnes:5000000,pr_cu_tpa:30000,rv_usd:237500000,pr_year:"CY2024",src_type:"Government",confidence:"Medium",dq:"B"},{n:"Mungari",c:"Australia",s:"Western Australia",r:"Asia-Pacific",la:-31.26,ln:121.47,co:["Gold"],pc:"Gold",cp:"Evolution Mining",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Au; WA goldfields",em:"~400",dp:"~400m",d:2009,o:2021,gr:"2.5g/t Au",rv:"~$310M",dp_meters:400,em_count:400,pr_total_tonnes:2000000,pr_au_oz_pa:130000,rv_usd:310600000,pr_year:"FY2025",src_type:"Company",confidence:"High",dq:"B"},{n:"Murrin Murrin",c:"Australia",s:"Western Australia",r:"Goldfields",la:-28.72,ln:121.88,co:["Nickel","Cobalt"],pc:"Nickel",cp:"Glencore",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"+3.2kt Ni vs 2023; part of Glencore Ni ops",em:"~700",d:1994,o:1999,rs:"~100Mt",no:"One of world's largest Ni laterite ops",gr:"1.0% Ni",rv:"~$577M",em_count:700,pr_total_tonnes:4500000,pr_ni_tpa:35000,rs_tonnes:100000000,rv_usd:577500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Muruntau",c:"Uzbekistan",s:"Navoi",r:"CIS",la:41.5,ln:64.57,co:["Gold"],pc:"Gold",cp:"Navoi Mining (Uzbekistan State)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"World's largest OP Au mine; ~2Moz+",em:"~15,000",dp:"~600m",d:1958,o:1967,no:"State-owned; limited public disclosure",rv:"~$4.8B",dp_meters:600,em_count:15000,pr_total_tonnes:50000000,pr_au_oz_pa:2000000,rv_usd:4778000000,pr_year:"CY2024",src_type:"Government",confidence:"Medium",dq:"B"},{n:"Musselwhite",c:"Canada",s:"Ontario",r:"North America",la:52.61,ln:-90.38,co:["Gold"],pc:"Gold",cp:"Newmont (pending sale)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"215koz Au (CY2024; pending divestiture)",em:"~700",dp:"~700m",d:1991,o:1997,no:"Non-core asset, pending divestiture announced 2024",gr:"5.5g/t Au",rv:"~$513M",dp_meters:700,em_count:700,pr_total_tonnes:1800000,pr_au_oz_pa:215000,rv_usd:513600000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Mutanda",c:"DR Congo",s:"Katanga",r:"Africa",la:-10.8,ln:25.97,co:["Copper","Cobalt"],pc:"Copper",cp:"Glencore",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Glencore African Cu; higher than planned run-rates",em:"~5,000",d:1950,o:2011,rv:"~$950M",em_count:5000,pr_total_tonnes:8000000,pr_cu_tpa:100000,rv_usd:950000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Nalco Mines",c:"India",s:"Odisha",r:"South Asia",la:18.96,ln:83.24,co:["Bauxite"],pc:"Bauxite",cp:"NALCO (Govt of India)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Bauxite; Odisha India",em:"~3,000",dp:"~80m",d:1955,o:1985,rv:"~$350M",dp_meters:80,em_count:3000,pr_total_tonnes:7000000,pr_baux_mt:7,rv_usd:350000000,pr_year:"FY2024",src_type:"Government",confidence:"Medium",dq:"B"},{n:"Natalka",c:"Russia",s:"Magadan Oblast",r:"CIS",la:61.83,ln:148.73,co:["Gold"],pc:"Gold",cp:"Polyus",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Au; Far East Russia",em:"~2,000",dp:"~300m",d:1973,o:2018,rv:"~$955M",dp_meters:300,em_count:2000,pr_total_tonnes:8000000,pr_au_oz_pa:400000,rv_usd:955600000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Nchanga",c:"Zambia",r:"Africa",la:-12.45,ln:28.05,co:["Copper"],pc:"Copper",cp:"Vedanta Resources / KCM",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Cu; Zambia; part of KCM",em:"~4,000",dp:"~400m",d:1938,o:1938,rv:"~$237M",dp_meters:400,em_count:4000,pr_total_tonnes:5000000,pr_cu_tpa:50000,rv_usd:237500000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Neves-Corvo",c:"Portugal",r:"Europe",la:37.58,ln:-7.97,co:["Copper","Zinc"],pc:"Copper",cp:"Lundin Mining",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Cu-Zn; Portugal",em:"~1,500",dp:"~1100m",d:1977,o:1988,gr:"2.0% Cu",rv:"~$190M",dp_meters:1100,em_count:1500,pr_total_tonnes:4000000,pr_cu_tpa:40000,rv_usd:190000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Norilsk-Talnakh",c:"Russia",s:"Krasnoyarsk Krai",r:"CIS",la:69.35,ln:88.2,co:["Nickel","Copper","Palladium","Platinum"],pc:"Copper",cp:"Nornickel",t:"Open Pit & Underground",m:"Sub-level Caving",st:"Operating",pr:"World's largest Ni-Pd-Pt producer; ~200kt Ni",em:"~25,000",dp:"~2000m",d:1935,o:1942,rs:"~2.0Bt",no:"Limited disclosure due to sanctions",gr:"1.8% Ni, 3.5% Cu",rv:"~$12.8B",dp_meters:2000,em_count:25000,pr_total_tonnes:25000000,pr_cu_tpa:400000,pr_ni_tpa:200000,rs_tonnes:2000000000,rv_usd:12800000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"North Mara",c:"Tanzania",s:"Mara",r:"Africa",la:-1.4,ln:34.6,co:["Gold"],pc:"Gold",cp:"Barrick Gold (84%)",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Part of Africa & ME region (Barrick 84%)",em:"~2,500",dp:"~400m",d:1999,o:2002,no:"Near Lake Victoria",dp_meters:400,em_count:2500,pr_total_tonnes:3000000,pr_au_oz_pa:300000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Northparkes",c:"Australia",s:"New South Wales",r:"Parkes",la:-32.94,ln:148.13,co:["Copper","Gold"],pc:"Copper",cp:"CMOC Group (80%)",t:"Underground",m:"Block / Panel Caving",st:"Operating",pr:"Cu-Au; block cave",em:"~600",dp:"~600m",d:1977,o:1994,rs:"~150Mt",no:"Pioneer of block caving in Australia",rv:"~$475M",dp_meters:600,em_count:600,pr_total_tonnes:8000000,pr_cu_tpa:50000,rs_tonnes:150000000,rv_usd:475000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Nova-Bollinger",c:"Australia",s:"Western Australia",r:"Fraser Range",la:-31.82,ln:123.19,co:["Nickel","Copper","Cobalt"],pc:"Copper",cp:"IGO Limited",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Ni-Cu-Co; WA UG",em:"~500",dp:"~400m",d:2012,o:2017,rs:"~2Mt",no:"High-grade Ni-Cu sulphide",rv:"~$95M",dp_meters:400,em_count:500,pr_total_tonnes:2000000,pr_cu_tpa:15000,pr_ni_tpa:25000,rs_tonnes:2000000,rv_usd:95000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Nsuta",c:"Ghana",r:"Africa",la:5.28,ln:-1.97,co:["Manganese"],pc:"Manganese",cp:"Ghana Manganese Company",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Mn; Ghana",em:"~1,000",dp:"~80m",d:1914,o:1914,rv:"~$45M",dp_meters:80,em_count:1000,pr_total_tonnes:2000000,pr_mn_mt:2,rv_usd:45000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Oaky Creek",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-22.37,ln:148.37,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Glencore",t:"Underground",m:"Longwall",st:"Operating",pr:"Met coal; QLD",em:"~700",dp:"~200m",d:1975,o:1981,rs:"~200Mt",no:"Long-life longwall",rv:"~$1.2B",dp_meters:200,em_count:700,pr_total_tonnes:5000000,pr_coal_mt:5,rs_tonnes:200000000,rv_usd:1250000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Obuasi",c:"Ghana",s:"Ashanti",r:"Africa",la:6.2,ln:-1.68,co:["Gold"],pc:"Gold",cp:"AngloGold Ashanti",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of AGA total; UG redevelopment",em:"~4,000",dp:"~1500m",d:1897,o:1897,no:"125+ years of production",gr:"5.0g/t Au",rv:"~$500M",dp_meters:1500,em_count:4000,pr_total_tonnes:5000000,pr_au_oz_pa:200000,rv_usd:500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Olimpiada",c:"Russia",s:"Krasnoyarsk Krai",r:"CIS",la:59.73,ln:93.67,co:["Gold"],pc:"Gold",cp:"Polyus",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Russia's largest Au mine; ~1.5Moz",em:"~5,000",dp:"~400m",d:1975,o:1996,no:"Limited disclosure due to sanctions",rv:"~$3.6B",dp_meters:400,em_count:5000,pr_total_tonnes:15000000,pr_au_oz_pa:1500000,rv_usd:3583500000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Olympic Dam",cp:"BHP",c:"Australia",s:"South Australia",r:"Stuart Shelf",la:-30.45,ln:136.88,co:['Copper','Uranium','Gold','Silver'],pc:"Copper",t:"Underground",m:"Open Stoping",st:"Operating",pr:"216kt Cu cathode; 207koz Au refined; 995koz Ag; 3,603t U3O8",em:"~4,000",dp:"~1000m",d:1975,o:1988,rs:"~10.0Bt",gr:"1.7% Cu, 0.5kg/t U3O8",rv:"~$3.2B",no:"World's largest uranium deposit, 4th largest copper",dp_meters:1000,em_count:4000,pr_total_tonnes:14000000,pr_cu_tpa:216000,pr_au_oz_pa:207000,rs_tonnes:10000000000,rv_usd:3250000000,pr_year:"FY2024",rs_year:"2024.0",src_type:"Company",confidence:"High",dq:"A"},{n:"Onça Puma",c:"Brazil",s:"Pará",r:"Latin America",la:-6.58,ln:-51.09,co:["Nickel"],pc:"Nickel",cp:"Vale",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni production higher after furnace rebuild; part of Vale 160kt Ni",em:"~800",d:1969,o:2011,rv:"~$198M",em_count:800,pr_total_tonnes:4000000,rv_usd:198000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Orapa",c:"Botswana",s:"Central District",r:"Africa",la:-21.31,ln:25.37,co:["Diamonds"],pc:"Diamonds",cp:"Debswana",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Large diamond mine; Botswana",em:"~2,500",dp:"~250m",d:1967,o:1971,no:"One of world's largest diamond mines",gr:"25 cpht",rv:"~$400M",dp_meters:250,em_count:2500,pr_total_tonnes:3000000,pr_carats_pa:3000000,rv_usd:400000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Oyu Tolgoi Underground",c:"Mongolia",r:"Asia-Pacific",la:43,ln:106.85,co:["Copper","Gold"],pc:"Copper",cp:"Rio Tinto (66%) / Govt of Mongolia (34%)",t:"Underground",m:"Block / Panel Caving",st:"Operating",pr:"Underground ramp-up continuing; record Cu production; head grade UG 1.67-2.02%",em:"~5,000",d:2001,o:2023,no:"Hugo North block cave now ramping up",gr:"1.5% Cu, 0.4g/t Au",rv:"~$1.0B",em_count:5000,pr_total_tonnes:27000000,pr_cu_tpa:150000,rv_usd:1026000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Paracatu",c:"Brazil",s:"Minas Gerais",r:"Latin America",la:-17.21,ln:-46.87,co:["Gold"],pc:"Gold",cp:"Kinross Gold",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Kinross total ~2.1Moz Au CY2024",em:"~2,800",dp:"~200m",d:1984,o:1987,rs:"~400Mt",gr:"0.4g/t Au",rv:"~$1.4B",dp_meters:200,em_count:2800,pr_total_tonnes:55000000,pr_au_oz_pa:2100000,rs_tonnes:400000000,rv_usd:1410000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Paragominas",c:"Brazil",s:"Pará",r:"Latin America",la:-3,ln:-47.35,co:["Bauxite"],pc:"Bauxite",cp:"Norsk Hydro",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Bauxite; Brazil; ~10Mt",em:"~2,000",dp:"~50m",d:1968,o:2007,rv:"~$500M",dp_meters:50,em_count:2000,pr_total_tonnes:10000000,pr_baux_mt:10,rv_usd:500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Patience Lake",c:"Canada",s:"Saskatchewan",r:"North America",la:52.03,ln:-106.48,co:["Potash"],pc:"Potash",cp:"Nutrien",t:"Underground",m:"Longwall",st:"Operating",pr:"Part of Nutrien potash",em:"~600",dp:"~1000m",d:1952,o:1972,rv:"~$900M",dp_meters:1000,em_count:600,pr_total_tonnes:3000000,pr_potash_mt:1,rv_usd:900000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Peak Downs",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-22.26,ln:148.19,co:["Coal (Met)"],pc:"Coal (Met)",cp:"BHP Mitsubishi Alliance (BMA)",t:"Open Pit",m:"Dragline / Strip Mining",st:"Operating",pr:"4.2Mt met coal (BHP 50% share FY24)",em:"~1,800",dp:"~150m",d:1957,o:1972,rs:"~600Mt",no:"Long-life met coal",rv:"~$1.1B",dp_meters:150,em_count:1800,pr_total_tonnes:4200000,pr_coal_mt:4.2,rs_tonnes:600000000,rv_usd:1050000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Peñasquito",c:"Mexico",s:"Zacatecas",r:"Latin America",la:24.04,ln:-101.61,co:["Gold","Silver","Zinc"],pc:"Gold",cp:"Newmont",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"299koz Au; plus Ag, Pb, Zn co-products (CY2024)",em:"~6,000",dp:"~400m",d:2006,o:2010,no:"One of world's largest Au-Ag deposits",gr:"0.4g/t Au",rv:"~$714M",dp_meters:400,em_count:6000,pr_total_tonnes:35000000,pr_au_oz_pa:299000,pr_zn_tpa:200000,rv_usd:714300000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Phalaborwa",c:"South Africa",s:"Limpopo",r:"Africa",la:-23.94,ln:31.14,co:["Phosphate","Copper"],pc:"Copper",cp:"Foskor",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Phosphate-Cu; SA",em:"~2,000",d:1951,o:1966,rv:"~$237M",em_count:2000,pr_total_tonnes:5000000,pr_cu_tpa:15000,rv_usd:237500000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Phoenix (Nevada)",c:"United States",s:"Nevada",r:"North America",la:40.78,ln:-116.36,co:["Gold","Copper"],pc:"Copper",cp:"Nevada Gold Mines (Barrick 61.5% / Newmont 38.5%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of NGM complex",em:"~400",dp:"~200m",d:1960,o:1990,rv:"~$250M",dp_meters:200,em_count:400,pr_cu_tpa:50000,rv_usd:250000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"D"},{n:"Pilgangoora",c:"Australia",s:"Western Australia",r:"Pilbara",la:-20.87,ln:118.84,co:["Lithium","Tantalum"],pc:"Lithium",cp:"Pilbara Minerals",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Li-Ta; WA; ~680ktpa spod conc",em:"~800",dp:"~150m",d:2014,o:2018,rs:"~310Mt",no:"One of world's largest independent lithium ops",gr:"1.2% Li2O",rv:"~$200M",dp_meters:150,em_count:800,pr_total_tonnes:5000000,pr_li_tpa:680000,rs_tonnes:310000000,rv_usd:200000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Poitrel",c:"Australia",s:"Queensland",r:"Asia-Pacific",la:-22.03,ln:148.24,co:["Coal (Met)"],pc:"Coal (Met)",cp:"BHP Mitsubishi Alliance (BHP 50%/Mitsubishi 50%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Met coal; BMA JV",em:"~600",dp:"~80m",d:2007,o:2013,rv:"~$1.2B",dp_meters:80,em_count:600,pr_total_tonnes:5000000,pr_coal_mt:5,rv_usd:1250000000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Prodeco",c:"Colombia",r:"Latin America",la:9.82,ln:-73.55,co:["Coal (Thermal)"],pc:"Coal (Thermal)",cp:"Glencore",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Glencore Colombian coal ops",em:"~3,000",dp:"~80m",d:1977,o:1985,rv:"~$1.3B",dp_meters:80,em_count:3000,pr_total_tonnes:10000000,pr_coal_mt:10,rv_usd:1300000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Prominent Hill",c:"Australia",s:"South Australia",r:"Gawler Craton",la:-29.72,ln:135.52,co:["Copper","Gold","Silver"],pc:"Copper",cp:"BHP",t:"Open Pit & Underground",m:"Open Stoping",st:"Operating",pr:"51kt Cu payable; 94koz Au",em:"~1,000",dp:"~600m",d:2001,o:2009,rs:"~100Mt",no:"Transitioned from OP to UG; includes UG expansion",gr:"1.0% Cu, 0.6g/t Au",rv:"~$709M",dp_meters:600,em_count:1000,pr_total_tonnes:11000000,pr_au_oz_pa:94000,pr_cu_tpa:51000,rs_tonnes:100000000,rv_usd:709100000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Pueblo Viejo",c:"Dominican Republic",s:"Sánchez Ramírez",la:19.05,ln:-70.17,co:["Gold","Silver","Copper"],pc:"Gold",cp:"Newmont (40%) / Barrick Gold (60%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"235koz Au attrib (Newmont 40% CY2024)",em:"~3,000",dp:"~200m",d:600,o:2013,no:"One of largest Au mines in Americas",rv:"~$561M",dp_meters:200,em_count:3000,pr_total_tonnes:20000000,pr_au_oz_pa:235000,rv_usd:561400000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Quebrada Blanca",c:"Chile",s:"Tarapacá",r:"Latin America",la:-20.98,ln:-68.81,co:["Copper"],pc:"Copper",cp:"Teck Resources (60%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu; QB2 ramp-up ~250kt Cu target",em:"~3,000",d:1979,o:1994,no:"QB2 supergene expansion now producing",gr:"0.4% Cu",rv:"~$2.4B",em_count:3000,pr_total_tonnes:55000000,pr_cu_tpa:250000,rv_usd:2375000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Quellaveco",c:"Peru",s:"Moquegua",r:"Latin America",la:-17.1,ln:-70.63,co:["Copper","Molybdenum"],pc:"Copper",cp:"Anglo American (60%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Anglo Cu; ramped up 2023",em:"~3,500",d:1862,o:2022,no:"Anglo American's newest Tier 1 Cu asset",rv:"~$2.9B",em_count:3500,pr_total_tonnes:75000000,pr_cu_tpa:300000,rv_usd:2850000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Radomiro Tomic",c:"Chile",s:"Antofagasta",r:"Latin America",la:-22.22,ln:-68.9,co:["Copper"],pc:"Copper",cp:"Codelco",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Codelco total; open pit + leach",em:"~2,000",dp:"~400m",d:1979,o:1998,rs:"~3.5Bt",no:"Adjacent to Chuquicamata",rv:"~$1.9B",dp_meters:400,em_count:2000,pr_total_tonnes:40000000,pr_cu_tpa:260000,rs_tonnes:3500000000,rv_usd:1900000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Raglan",c:"Canada",s:"Quebec (Nunavik)",r:"North America",la:61.7,ln:-73.6,co:["Nickel","Copper","PGMs"],pc:"Copper",cp:"Glencore",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of Glencore Ni 77.3kt (ex-KNS); INO recovery",em:"~800",dp:"~500m",d:1993,o:1997,rs:"~15Mt",no:"Arctic nickel mine, wind-powered",rv:"~$142M",dp_meters:500,em_count:800,pr_total_tonnes:3000000,pr_cu_tpa:8000,pr_ni_tpa:25000,rs_tonnes:15000000,rv_usd:142500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Rajpura Dariba",c:"India",s:"Rajasthan",r:"Rajsamand",la:25.03,ln:74.13,co:["Zinc","Lead","Silver"],pc:"Zinc",cp:"Hindustan Zinc (Vedanta)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of HZL integrated Zn-Pb-Ag operations",em:"~1,000",dp:"~700m",d:1985,o:1994,rs:"~25Mt",no:"Major HZL complex with smelter",dp_meters:700,em_count:1000,pr_total_tonnes:3000000,pr_zn_tpa:150000,rs_tonnes:25000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Rampura Agucha",c:"India",s:"Rajasthan",r:"South Asia",la:25.8,ln:74.76,co:["Zinc","Lead","Silver"],pc:"Zinc",cp:"Hindustan Zinc (Vedanta)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"World's largest Zn mine; part of HZL ~1Mt Zn-Pb",em:"~2,000",dp:"~600m",d:1977,o:1991,rs:"~100Mt",no:"World's largest zinc mine",gr:"13% Zn+Pb",rv:"~$1.4B",dp_meters:600,em_count:2000,pr_total_tonnes:8000000,pr_zn_tpa:600000,rs_tonnes:100000000,rv_usd:1425000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Red Chris",c:"Canada",s:"British Columbia",r:"North America",la:57.7,ln:-129.78,co:["Copper","Gold"],pc:"Gold",cp:"Newmont (70%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"39koz Au; plus Cu (Newmont 70% CY2024)",em:"~600",dp:"~300m",d:2001,o:2015,rs:"~500Mt",no:"Block cave expansion planned",rv:"~$93M",dp_meters:300,em_count:600,pr_total_tonnes:3000000,pr_au_oz_pa:39000,rs_tonnes:500000000,rv_usd:93200000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Red Dog",c:"United States",s:"Alaska",r:"North America",la:68.07,ln:-162.87,co:["Zinc","Lead"],pc:"Zinc",cp:"Teck Resources",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Zn-Pb; world's largest Zn mine ~500kt Zn",em:"~600",dp:"~150m",d:1968,o:1989,rs:"~50Mt",no:"World's largest zinc mine, above Arctic Circle",gr:"15% Zn",rv:"~$1.6B",dp_meters:150,em_count:600,pr_total_tonnes:4500000,pr_zn_tpa:500000,rs_tonnes:50000000,rv_usd:1612000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Reko Diq",c:"Pakistan",s:"Balochistan",r:"South Asia",la:29.04,ln:62.06,co:["Copper","Gold"],pc:"Copper",cp:"Barrick Gold (50%) / Pakistan Govt entities (50%)",t:"Open Pit",m:"Truck & Shovel",st:"Construction",pr:"In development; first production targeted 2028",em:"~500",d:1993,o:2028,em_count:500,rs_year:"2024",src_type:"Company",confidence:"High",dq:"D"},{n:"Richards Bay Minerals",c:"South Africa",s:"KwaZulu-Natal",r:"Africa",la:-28.7,ln:32.15,co:["Titanium"],pc:"Titanium",cp:"Rio Tinto",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Titanium dioxide slag production; 3/4 furnaces online",em:"~4,000",dp:"~20m",d:1971,o:1977,no:"World's largest mineral sands operation",rv:"~$500M",dp_meters:20,em_count:4000,pr_total_tonnes:2000000,pr_ti_kt:1000,rv_usd:500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Rio Tinto Fer et Titane",c:"Canada",s:"Quebec",r:"North America",la:46.34,ln:-72.55,co:["Titanium","Iron Ore"],pc:"Iron Ore",cp:"Rio Tinto",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"6/9 furnaces operating at RTIT Quebec Ops; 1 rebuild in progress",em:"~1,000",dp:"~100m",d:1946,o:1950,rv:"~$750M",dp_meters:100,em_count:1000,pr_total_tonnes:3000000,rv_usd:750000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Rio Tuba",c:"Philippines",s:"Palawan",r:"Asia-Pacific",la:8.51,ln:117.44,co:["Nickel"],pc:"Nickel",cp:"Nickel Asia",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni laterite; Philippines",em:"~1,000",dp:"~30m",d:1970,o:2005,rv:"~$247M",dp_meters:30,em_count:1000,pr_total_tonnes:5000000,pr_ni_tpa:25000,rv_usd:247500000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Robe River",c:"Australia",s:"Western Australia",r:"Pilbara",la:-21.57,ln:115.98,co:["Iron Ore"],pc:"Iron Ore",cp:"Rio Tinto",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Pilbara operations: 328Mt total",em:"~600",dp:"~100m",d:1964,o:1972,rv:"~$3.9B",dp_meters:100,em_count:600,pr_total_tonnes:35000000,pr_fe_mt:35,rv_usd:3850000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Rocanville",c:"Canada",s:"Saskatchewan",r:"North America",la:50.45,ln:-101.35,co:["Potash"],pc:"Potash",cp:"Nutrien",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"Part of Nutrien potash; largest K mine",em:"~1,200",dp:"~1000m",d:1952,o:1970,no:"Largest potash mine in the world",rv:"~$1.5B",dp_meters:1000,em_count:1200,pr_total_tonnes:5000000,pr_potash_mt:3.5,rv_usd:1500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Rosebery",c:"Australia",s:"Tasmania",r:"West Coast",la:-41.78,ln:145.53,co:["Zinc","Copper","Lead","Gold","Silver"],pc:"Copper",cp:"MMG Limited",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Zn-Cu-Pb polymetallic UG; Tasmania",em:"~500",dp:"~1700m",d:1893,o:1936,rs:"~7Mt",no:"125+ years of history",gr:"4% Zn, 1.5% Pb",rv:"~$38M",dp_meters:1700,em_count:500,pr_total_tonnes:1000000,pr_cu_tpa:5000,pr_zn_tpa:40000,rs_tonnes:7000000,rv_usd:38000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Round Mountain",c:"United States",s:"Nevada",r:"North America",la:38.72,ln:-117.07,co:["Gold"],pc:"Gold",cp:"Kinross Gold",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Kinross total",em:"~1,000",dp:"~200m",d:1906,o:1977,gr:"0.5g/t Au",dp_meters:200,em_count:1000,pr_total_tonnes:8000000,pr_au_oz_pa:200000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Roy Hill",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.43,ln:119.96,co:["Iron Ore"],pc:"Iron Ore",cp:"Hancock Prospecting (70%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"~60Mt iron ore; Pilbara",em:"~2,500",dp:"~100m",d:2011,o:2015,rs:"~2.4Bt",no:"Gina Rinehart's $10B mine-rail-port project",gr:"59% Fe",rv:"~$6.6B",dp_meters:100,em_count:2500,pr_total_tonnes:60000000,pr_fe_mt:60,rs_tonnes:2400000000,rv_usd:6600000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Rössing",c:"Namibia",s:"Erongo",r:"Africa",la:-22.48,ln:15.05,co:["Uranium"],pc:"Uranium",cp:"CNNC (China)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"~2,500t U3O8; Namibia",em:"~1,000",dp:"~350m",d:1966,o:1976,rs:"~100Mt",no:"Longest running open pit uranium mine",rv:"~$487M",dp_meters:350,em_count:1000,pr_total_tonnes:12000000,pr_u3o8_tpa:2500,rs_tonnes:100000000,rv_usd:487500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Sabodala-Massawa",c:"Senegal",s:"Kédougou",la:12.86,ln:-11.95,co:["Gold"],pc:"Gold",cp:"Endeavour Mining (90%)",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Part of Endeavour 1.1Moz Au CY2024; BIOX expansion completed Apr 2024; target >300koz/yr",em:"~2,000",dp:"~250m",d:2004,o:2009,no:"Combined operation",gr:"2.5g/t Au",rv:"~$2.6B",dp_meters:250,em_count:2000,pr_total_tonnes:7000000,pr_au_oz_pa:1100000,rv_usd:2627900000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Safford/Lone Star",c:"United States",s:"Arizona",r:"North America",la:32.88,ln:-109.68,co:["Copper"],pc:"Copper",cp:"Freeport-McMoRan",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of FCX Americas Cu production; Lone Star expansion",em:"~1,500",dp:"~300m",d:1944,o:2007,rs:"~1.5Bt",no:"Oxide + sulphide processing",rv:"~$2.9B",dp_meters:300,em_count:1500,pr_total_tonnes:60000000,pr_cu_tpa:200000,rs_tonnes:1500000000,rv_usd:2850000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Safi-Jorf Lasfar",c:"Morocco",r:"Africa",la:33.1,ln:-8.65,co:["Phosphate"],pc:"Phosphate",cp:"OCP Group",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Phosphate processing; Morocco",em:"~4,000",d:1921,o:1975,rv:"~$3.0B",em_count:4000,pr_total_tonnes:30000000,pr_phos_mt:30,rv_usd:3000000000,pr_year:"CY2024",src_type:"Government",confidence:"High",dq:"B"},{n:"Salar de Atacama",c:"Chile",s:"Antofagasta",r:"Latin America",la:-23.5,ln:-68.3,co:["Lithium"],pc:"Lithium",cp:"SQM / Albemarle",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Li brine; world's largest Li operation",em:"~5,000",dp:"~10m",d:1980,o:1997,no:"World's largest lithium operation, highest concentration brine",gr:"0.15% Li",rv:"~$720M",dp_meters:10,em_count:5000,pr_total_tonnes:2000000,pr_li_tpa:180000,rv_usd:720000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Salar de Olaroz",c:"Argentina",s:"Jujuy",r:"Latin America",la:-23.5,ln:-66.7,co:["Lithium"],pc:"Lithium",cp:"Allkem (merged into Arcadium Lithium, now Rio Tinto)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Li brine; Argentina",em:"~500",dp:"~10m",d:2010,o:2015,no:"Rio Tinto acquired Arcadium Lithium 2025",gr:"0.06% Li",rv:"~$100M",dp_meters:10,em_count:500,pr_total_tonnes:500000,pr_li_tpa:15000,rv_usd:100000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Salar del Hombre Muerto",c:"Argentina",s:"Catamarca",r:"Latin America",la:-25.4,ln:-67.08,co:["Lithium"],pc:"Lithium",cp:"Arcadium Lithium (now Rio Tinto)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Li brine; Argentina",em:"~300",dp:"~10m",d:2012,o:2023,gr:"0.06% Li",rv:"~$10M",dp_meters:10,em_count:300,pr_li_tpa:20000,rv_usd:10000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"D"},{n:"Salobo",c:"Brazil",s:"Pará",r:"Latin America",la:-5.79,ln:-50.54,co:["Copper","Gold"],pc:"Copper",cp:"Vale",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Record annual Cu production; Salobo 3 ramp-up complete; part of Vale 348kt total Cu",em:"~3,000",dp:"~300m",d:1982,o:2012,rs:"~1.1Bt",no:"One of Brazil's largest Cu mines",rv:"~$3.3B",dp_meters:300,em_count:3000,pr_total_tonnes:30000000,pr_cu_tpa:348000,rs_tonnes:1100000000,rv_usd:3306000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Sangarédi",c:"Guinea",r:"Africa",la:11.08,ln:-13.8,co:["Bauxite"],pc:"Bauxite",cp:"Compagnie des Bauxites de Guinée",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Bauxite; Guinea",em:"~3,000",dp:"~30m",d:1952,o:1973,rv:"~$750M",dp_meters:30,em_count:3000,pr_total_tonnes:15000000,pr_baux_mt:15,rv_usd:750000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Saraji",c:"Australia",s:"Queensland",r:"Bowen Basin",la:-22.44,ln:148.15,co:["Coal (Met)"],pc:"Coal (Met)",cp:"BHP Mitsubishi Alliance (BMA)",t:"Open Pit",m:"Dragline / Strip Mining",st:"Operating",pr:"3.3Mt met coal (BHP 50% share FY24)",em:"~1,200",dp:"~150m",d:1957,o:1974,rs:"~500Mt",no:"Premium hard coking coal",rv:"~$825M",dp_meters:150,em_count:1200,pr_total_tonnes:3300000,pr_coal_mt:3.3,rs_tonnes:500000000,rv_usd:825000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Savage River",c:"Australia",s:"Tasmania",r:"West Coast",la:-41.56,ln:145.17,co:["Iron Ore"],pc:"Iron Ore",cp:"Grange Resources",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Iron ore; Tasmania",em:"~500",dp:"~150m",d:1965,o:1967,rs:"~200Mt",no:"Australia's oldest magnetite operation",rv:"~$220M",dp_meters:150,em_count:500,pr_total_tonnes:2000000,pr_fe_mt:2,rs_tonnes:200000000,rv_usd:220000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"Sentinel",c:"Zambia",s:"North-Western Province",r:"Africa",la:-12.5,ln:25.52,co:["Copper"],pc:"Copper",cp:"First Quantum Minerals",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu; ~250kt Cu; Zambia",em:"~3,000",dp:"~300m",d:2011,o:2016,rs:"~800Mt",no:"Modern large-scale copper mine",gr:"0.5% Cu",rv:"~$2.4B",dp_meters:300,em_count:3000,pr_total_tonnes:30000000,pr_cu_tpa:250000,rs_tonnes:800000000,rv_usd:2375000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Sepon",c:"Laos",s:"Savannakhet",r:"Southeast Asia",la:16.8,ln:106.4,co:["Gold","Copper"],pc:"Copper",cp:"MMG Limited (90%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Au-Cu; Laos; nearing end of mine life",em:"~3,000",dp:"~200m",d:1997,o:2003,rs:"~200Mt",no:"Combined Au-Cu operation",dp_meters:200,em_count:3000,pr_total_tonnes:5000000,pr_cu_tpa:5000,rs_tonnes:200000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Sichuan Lithium",c:"China",s:"Sichuan",r:"Asia-Pacific",la:32.85,ln:101.48,co:["Lithium"],pc:"Lithium",cp:"Tianqi Lithium",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Li; China domestic",em:"~1,000",dp:"~400m",d:1990,o:2005,rv:"~$80M",dp_meters:400,em_count:1000,pr_total_tonnes:2000000,pr_li_tpa:15000,rv_usd:80000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Sierra Gorda",c:"Chile",s:"Antofagasta",r:"Latin America",la:-22.89,ln:-69.32,co:["Copper","Molybdenum","Gold"],pc:"Copper",cp:"KGHM (55%) / Sumitomo (45%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Mo-Au; Chile",em:"~3,000",dp:"~400m",d:2007,o:2014,rs:"~1.6Bt",no:"$4B investment",gr:"0.4% Cu",rv:"~$1.1B",dp_meters:400,em_count:3000,pr_total_tonnes:30000000,pr_cu_tpa:120000,rs_tonnes:1600000000,rv_usd:1140000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Siguiri",c:"Guinea",r:"Africa",la:11.68,ln:-9.16,co:["Gold"],pc:"Gold",cp:"AngloGold Ashanti (85%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of AGA total; Guinea",em:"~2,000",dp:"~80m",d:1887,o:1997,rv:"~$500M",dp_meters:80,em_count:2000,pr_total_tonnes:5000000,pr_au_oz_pa:300000,rv_usd:500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Sindesar Khurd",c:"India",s:"Rajasthan",r:"Rajsamand",la:25.28,ln:73.82,co:["Zinc","Lead","Silver"],pc:"Zinc",cp:"Hindustan Zinc (Vedanta)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of HZL; high-grade Zn-Pb-Ag UG mine",em:"~1,500",dp:"~900m",d:1985,o:2006,rs:"~30Mt",no:"World's 2nd largest zinc mine, high silver credits",dp_meters:900,em_count:1500,pr_total_tonnes:3000000,pr_zn_tpa:200000,rs_tonnes:30000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Sishen",c:"South Africa",s:"Northern Cape",r:"Africa",la:-27.73,ln:22.98,co:["Iron Ore"],pc:"Iron Ore",cp:"Kumba Iron Ore (Anglo American 69.7%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"~25Mt iron ore",em:"~4,500",dp:"~300m",d:1939,o:1953,rs:"~500Mt",no:"One of world's largest OP iron ore mines",gr:"64% Fe",rv:"~$2.8B",dp_meters:300,em_count:4500,pr_total_tonnes:25000000,pr_fe_mt:25,rs_tonnes:500000000,rv_usd:2750000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Solomon Hub",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.58,ln:118.02,co:["Iron Ore"],pc:"Iron Ore",cp:"Fortescue",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Fortescue total ~192Mt shipped FY24",em:"~2,000",dp:"~100m",d:2009,o:2013,rs:"~1.2Bt",no:"Higher-grade Kings & Firetail deposits",rv:"~$7.7B",dp_meters:100,em_count:2000,pr_total_tonnes:70000000,pr_fe_mt:70,rs_tonnes:1200000000,rv_usd:7700000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Sorowako",c:"Indonesia",s:"South Sulawesi",r:"Asia-Pacific",la:-2.53,ln:121.35,co:["Nickel"],pc:"Nickel",cp:"Vale Indonesia (PTVI)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni; Indonesia",em:"~3,000",dp:"~30m",d:1969,o:1978,rs:"~120Mt",no:"Vale deconsolidated PTVI in 2024",gr:"1.8% Ni",rv:"~$297M",dp_meters:30,em_count:3000,pr_total_tonnes:6000000,pr_ni_tpa:35000,rs_tonnes:120000000,rv_usd:297000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"South Deep",c:"South Africa",s:"Gauteng",r:"Africa",la:-26.42,ln:27.66,co:["Gold"],pc:"Gold",cp:"Gold Fields",t:"Underground",m:"Deep Level Mining",st:"Operating",pr:"Part of Gold Fields total ~2.3Moz Au CY2024",em:"~4,000",dp:"~3000m",d:1940,o:1963,gr:"5.5g/t Au",rv:"~$550M",dp_meters:3000,em_count:4000,pr_total_tonnes:25000000,pr_au_oz_pa:2300000,rv_usd:550000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"South Walker Creek",c:"Australia",s:"Queensland",r:"Asia-Pacific",la:-22.05,ln:148.6,co:["Coal (Met)"],pc:"Coal (Met)",cp:"BHP Mitsubishi Alliance",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Met coal; BMA JV",em:"~700",dp:"~80m",d:1985,o:2003,rv:"~$1.2B",dp_meters:80,em_count:700,pr_total_tonnes:5000000,pr_coal_mt:5,rv_usd:1250000000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Spence",c:"Chile",s:"Antofagasta",r:"Latin America",la:-22.8,ln:-69.27,co:["Copper"],pc:"Copper",cp:"BHP",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"255kt Cu (FY24 record); includes 150kt concentrate + 104kt cathode",em:"~2,000",dp:"~300m",d:2002,o:2006,rs:"~1.2Bt",no:"SGO concentrator added 2021",rv:"~$2.4B",dp_meters:300,em_count:2000,pr_total_tonnes:25000000,pr_cu_tpa:255000,rs_tonnes:1200000000,rv_usd:2422500000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"St Ives",c:"Australia",s:"Western Australia",r:"Goldfields",la:-31.27,ln:121.62,co:["Gold"],pc:"Gold",cp:"Gold Fields",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Part of Gold Fields Australia region",em:"~1,200",d:1932,o:1982,no:"Multiple ops around Lake Lefroy",gr:"2.5g/t Au",rv:"~$335M",em_count:1200,pr_total_tonnes:5000000,rv_usd:335000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Stillwater",c:"United States",s:"Montana",r:"North America",la:45.38,ln:-109.87,co:["Platinum","Palladium"],pc:"Gold",cp:"Sibanye-Stillwater",t:"Underground",m:"Open Stoping",st:"Operating",pr:"US PGM operations; ~300koz 2E",em:"~1,800",dp:"~1500m",d:1967,o:1986,no:"Only PGM mine in the US",rv:"~$330M",dp_meters:1500,em_count:1800,pr_total_tonnes:3000000,pr_au_oz_pa:300000,rv_usd:330000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Sukari",c:"Egypt",s:"Eastern Desert",r:"Africa",la:24.95,ln:33.8,co:["Gold"],pc:"Gold",cp:"Centamin",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Au ~450koz; Egypt's only major Au mine",em:"~2,000",dp:"~400m",d:2007,o:2009,no:"Egypt's first modern large-scale gold mine",gr:"1.5g/t Au",rv:"~$1.1B",dp_meters:400,em_count:2000,pr_total_tonnes:14000000,pr_au_oz_pa:450000,rv_usd:1075000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Sukinda",c:"India",s:"Odisha",r:"South Asia",la:21.05,ln:85.87,co:["Chromite"],pc:"Chromite",cp:"Tata Steel Mining",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cr; India; Odisha",em:"~2,000",dp:"~60m",d:1950,o:1960,no:"Largest chromite reserves in India",rv:"~$1.2B",dp_meters:60,em_count:2000,pr_total_tonnes:4000000,pr_cr_mt:4,rv_usd:1200000000,pr_year:"FY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Sunrise Dam",c:"Australia",s:"Western Australia",r:"Laverton",la:-29.1,ln:122.4,co:["Gold"],pc:"Gold",cp:"AngloGold Ashanti",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Part of AGA total; Australia",em:"~600",dp:"~700m",d:1988,o:1997,no:"Transitioning to deeper UG",rv:"~$280M",dp_meters:700,em_count:600,pr_total_tonnes:3000000,pr_au_oz_pa:150000,rv_usd:280000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Super Pit (KCGM)",c:"Australia",s:"Western Australia",r:"Goldfields",la:-30.78,ln:121.5,co:["Gold"],pc:"Gold",cp:"Northern Star Resources",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Part of NST ~1.7Moz Au total",em:"~2,200",dp:"~600m",d:1893,o:1989,no:"Iconic Kalgoorlie Super Pit",gr:"1.2g/t Au",rv:"~$956M",dp_meters:600,em_count:2200,pr_total_tonnes:25000000,pr_au_oz_pa:1700000,rv_usd:956000000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Syama",c:"Mali",r:"Africa",la:11.21,ln:-6.2,co:["Gold"],pc:"Gold",cp:"Resolute Mining",t:"Underground",m:"Sub-level Caving",st:"Operating",pr:"Au; Mali; automated UG",em:"~1,200",dp:"~600m",d:1988,o:1990,gr:"2.5g/t Au",rv:"~$238M",dp_meters:600,em_count:1200,pr_total_tonnes:2000000,pr_au_oz_pa:100000,rv_usd:238900000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"TFM Phase II",c:"DR Congo",s:"Katanga",r:"Africa",la:-10.66,ln:25.57,co:["Copper","Cobalt"],pc:"Copper",cp:"CMOC Group (80%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Co expansion; ramp-up",em:"~5,000",dp:"~300m",d:2012,o:2014,rv:"~$712M",dp_meters:300,em_count:5000,pr_total_tonnes:15000000,pr_cu_tpa:100000,rv_usd:712500000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Taconite Harbor",c:"United States",s:"Minnesota",r:"North America",la:47.35,ln:-91.17,co:["Iron Ore"],pc:"Iron Ore",cp:"Cleveland-Cliffs",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Iron ore taconite; MN USA",em:"~500",dp:"~100m",d:1870,o:1957,rv:"~$880M",dp_meters:100,em_count:500,pr_total_tonnes:8000000,pr_fe_mt:8,rv_usd:880000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Taganito",c:"Philippines",s:"Surigao del Norte",r:"Asia-Pacific",la:9.87,ln:125.82,co:["Nickel"],pc:"Nickel",cp:"Nickel Asia / Sumitomo JV",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni HPAL; Philippines",em:"~1,500",dp:"~30m",d:1975,o:2013,rv:"~$247M",dp_meters:30,em_count:1500,pr_total_tonnes:5000000,pr_ni_tpa:25000,rv_usd:247500000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Taharoa",c:"New Zealand",r:"Asia-Pacific",la:-38.18,ln:174.69,co:["Iron Ore"],pc:"Iron Ore",cp:"NZ Steel Mining (Bluescope)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ironsand; NZ",em:"~200",dp:"~20m",d:1970,o:1971,rv:"~$330M",dp_meters:20,em_count:200,pr_total_tonnes:3000000,pr_fe_mt:3,rv_usd:330000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Tanami",c:"Australia",s:"Northern Territory",r:"Tanami Desert",la:-20.05,ln:129.7,co:["Gold"],pc:"Gold",cp:"Newmont",t:"Underground",m:"Open Stoping",st:"Operating",pr:"408koz Au (CY2024)",em:"~1,200",dp:"~1400m",d:1984,o:1986,no:"Remote desert operation, expansion underway",gr:"5.5g/t Au",rv:"~$974M",dp_meters:1400,em_count:1200,pr_total_tonnes:5000000,pr_au_oz_pa:408000,rv_usd:974700000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Tara (Navan)",c:"Ireland",la:53.65,ln:-6.78,co:["Zinc","Lead"],pc:"Zinc",cp:"Boliden",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of Boliden Mines; Europe's largest Zn mine",em:"~700",dp:"~600m",d:1970,o:1977,gr:"7% Zn",dp_meters:600,em_count:700,pr_total_tonnes:4000000,pr_zn_tpa:120000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Tarkwa",c:"Ghana",s:"Western Region",r:"Africa",la:5.3,ln:-1.98,co:["Gold"],pc:"Gold",cp:"Gold Fields",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Gold Fields West Africa region",em:"~3,500",dp:"~200m",d:1896,o:1906,no:"Ghana's largest gold mine",rv:"~$350M",dp_meters:200,em_count:3500,pr_total_tonnes:10000000,rv_usd:350000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Tasiast",c:"Mauritania",r:"Africa",la:20.53,ln:-15.96,co:["Gold"],pc:"Gold",cp:"Kinross Gold",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Kinross total; Tasiast 24k expansion",em:"~2,500",d:2007,o:2008,gr:"1.5g/t Au",em_count:2500,pr_total_tonnes:10000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Tavan Tolgoi",c:"Mongolia",r:"Asia-Pacific",la:43.59,ln:105.95,co:["Coal (Met)"],pc:"Coal (Met)",cp:"Erdenes Tavan Tolgoi (Mongolia State)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Met coal; Mongolia; ~30Mt target",em:"~3,000",dp:"~150m",d:1941,o:2011,rs:"~6.4Bt",no:"World's largest undeveloped coking coal deposit, now producing",rv:"~$7.5B",dp_meters:150,em_count:3000,pr_total_tonnes:30000000,pr_coal_mt:30,rs_tonnes:6400000000,rv_usd:7500000000,pr_year:"CY2024",rs_year:"2024",src_type:"Government",confidence:"Medium",dq:"A"},{n:"Telfer",c:"Australia",s:"Western Australia",r:"East Pilbara",la:-21.71,ln:122.23,co:["Gold","Copper"],pc:"Gold",cp:"Greatland Gold (acquired Dec 2024)",t:"Open Pit & Underground",m:"Sub-level Caving",st:"Operating",pr:"83koz Au (CY2024 partial; sold Dec 3 2024)",em:"~1,500",dp:"~1200m",d:1972,o:1977,no:"Sold by Newmont to Greatland Gold on Dec 3, 2024",rv:"~$198M",dp_meters:1200,em_count:1500,pr_total_tonnes:8000000,pr_au_oz_pa:83000,rv_usd:198300000,pr_year:"CY2024 (partial)",src_type:"Company",confidence:"High",dq:"B"},{n:"Tenke Fungurume",c:"DR Congo",s:"Lualaba",r:"Africa",la:-10.62,ln:26.13,co:["Copper","Cobalt"],pc:"Copper",cp:"CMOC Group (80%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Co; major DRC operation ~250kt Cu",em:"~7,000",d:1920,o:2009,rs:"~1.5Bt",no:"One of largest Cu-Co operations",gr:"2.5% Cu",rv:"~$2.4B",em_count:7000,pr_total_tonnes:40000000,pr_cu_tpa:250000,rs_tonnes:1500000000,rv_usd:2375000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Thalanga",c:"Australia",s:"Queensland",r:"Asia-Pacific",la:-19.14,ln:145.83,co:["Zinc","Copper"],pc:"Copper",cp:"Red River Resources",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Zn-Cu; small QLD UG",em:"~150",dp:"~500m",d:1979,o:1986,rv:"~$23M",dp_meters:500,em_count:150,pr_total_tonnes:500000,pr_cu_tpa:3000,pr_zn_tpa:15000,rv_usd:23800000,pr_year:"FY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Thunderbox",c:"Australia",s:"Western Australia",r:"Goldfields",la:-27.62,ln:121.1,co:["Gold"],pc:"Gold",cp:"Northern Star Resources",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Part of NST Yandal ops",em:"~600",dp:"~300m",d:2003,o:2016,no:"Growing gold operation near Leinster",dp_meters:300,em_count:600,pr_total_tonnes:3000000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Tom Price",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.69,ln:117.79,co:["Iron Ore"],pc:"Iron Ore",cp:"Rio Tinto",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Pilbara operations: 328Mt total",em:"~1,200",dp:"~200m",d:1962,o:1966,rs:"~500Mt",no:"Rio Tinto's first Pilbara mine",rv:"~$2.2B",dp_meters:200,em_count:1200,pr_total_tonnes:20000000,pr_fe_mt:20,rs_tonnes:500000000,rv_usd:2200000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Tomingley",c:"Australia",s:"New South Wales",r:"Central West",la:-32.56,ln:148.21,co:["Gold"],pc:"Gold",cp:"Alkane Resources",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Au; NSW",em:"~350",dp:"~300m",d:2008,o:2014,no:"Growing central NSW gold operation",gr:"2.0g/t Au",rv:"~$143M",dp_meters:300,em_count:350,pr_total_tonnes:1000000,pr_au_oz_pa:60000,rv_usd:143300000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Tongon",c:"Ivory Coast",r:"Africa",la:9.74,ln:-5.87,co:["Gold"],pc:"Gold",cp:"Barrick Gold (89.7%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Africa & ME region (Barrick 89.7%)",em:"~1,500",dp:"~150m",d:2006,o:2010,dp_meters:150,em_count:1500,pr_total_tonnes:2000000,pr_au_oz_pa:200000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Tonkolili",c:"Sierra Leone",r:"Africa",la:8.95,ln:-11.73,co:["Iron Ore"],pc:"Iron Ore",cp:"Shandong Iron and Steel",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Iron ore; Sierra Leone",em:"~2,000",dp:"~100m",d:1960,o:2011,rv:"~$660M",dp_meters:100,em_count:2000,pr_total_tonnes:6000000,pr_fe_mt:6,rv_usd:660000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Toquepala",c:"Peru",s:"Tacna",r:"Latin America",la:-17.25,ln:-70.6,co:["Copper","Molybdenum"],pc:"Copper",cp:"Southern Copper",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Mo; ~140kt Cu; Peru",em:"~3,000",dp:"~600m",d:1900,o:1960,rs:"~2.0Bt",no:"Major porphyry copper",gr:"0.6% Cu",rv:"~$1.3B",dp_meters:600,em_count:3000,pr_total_tonnes:35000000,pr_cu_tpa:140000,rs_tonnes:2000000000,rv_usd:1330000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Toromocho",c:"Peru",s:"Junín",r:"Latin America",la:-11.6,ln:-76.13,co:["Copper","Molybdenum"],pc:"Copper",cp:"Chinalco (Peru)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu-Mo; ~200kt Cu; Peru",em:"~2,500",dp:"~400m",d:1900,o:2013,rs:"~1.5Bt",no:"Required relocation of town of Morococha",gr:"0.5% Cu",rv:"~$1.9B",dp_meters:400,em_count:2500,pr_total_tonnes:50000000,pr_cu_tpa:200000,rs_tonnes:1500000000,rv_usd:1900000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Tronox Namakwa",c:"South Africa",s:"Northern Cape",r:"Africa",la:-31.37,ln:17.73,co:["Titanium"],pc:"Titanium",cp:"Tronox",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ti mineral sands; SA",em:"~1,000",dp:"~30m",d:1979,o:1994,rv:"~$500M",dp_meters:30,em_count:1000,pr_total_tonnes:2000000,pr_ti_kt:150,rv_usd:500000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Tropicana",c:"Australia",s:"Western Australia",r:"Goldfields",la:-29.24,ln:124.55,co:["Gold"],pc:"Gold",cp:"AngloGold Ashanti (70%) / Regis Resources (30%)",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Au; WA JV",em:"~1,000",dp:"~250m",d:2005,o:2013,no:"Remote FIFO mine 330km ENE of Kalgoorlie",gr:"2.0g/t Au",rv:"~$669M",dp_meters:250,em_count:1000,pr_total_tonnes:8000000,pr_au_oz_pa:280000,rv_usd:669000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Turquoise Ridge",c:"United States",s:"Nevada",r:"North America",la:41.23,ln:-117.22,co:["Gold"],pc:"Gold",cp:"Nevada Gold Mines (Barrick 61.5% / Newmont 38.5%)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of NGM complex; UG ramp-up progressing",em:"~1,200",dp:"~400m",d:1987,o:1994,rv:"~$478M",dp_meters:400,em_count:1200,pr_total_tonnes:3500000,rv_usd:478000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Twin Buttes",c:"United States",s:"Nevada",r:"North America",la:40.78,ln:-117.6,co:["Gold"],pc:"Gold",cp:"Nevada Gold Mines",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of NGM; may be different name in dataset",em:"~1,200",dp:"~700m",d:1962,o:1969,no:"Part of Turquoise Ridge complex",dp_meters:700,em_count:1200,pr_au_oz_pa:100000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"D"},{n:"UG2 Chrome (Samancor)",c:"South Africa",s:"North West",r:"Africa",la:-25.68,ln:27.28,co:["Chromite"],pc:"Chromite",cp:"Samancor Chrome",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Cr; SA",em:"~5,000",dp:"~800m",d:1925,o:1980,rv:"~$600M",dp_meters:800,em_count:5000,pr_total_tonnes:2000000,pr_cr_mt:2,rv_usd:600000000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Udokan",c:"Russia",s:"Zabaykalsky Krai",r:"CIS",la:56.49,ln:118.4,co:["Copper"],pc:"Copper",cp:"Udokan Copper (USM Holdings)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Cu; Russia; new mine 2023",em:"~1,500",dp:"~400m",d:1949,o:2023,rv:"~$712M",dp_meters:400,em_count:1500,pr_total_tonnes:15000000,pr_cu_tpa:50000,rv_usd:712500000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Ulan",c:"Australia",s:"New South Wales",r:"Asia-Pacific",la:-32.28,ln:149.76,co:["Coal (Thermal)","Coal (Met)"],pc:"Coal (Met)",cp:"Glencore",t:"Underground",m:"Longwall",st:"Operating",pr:"Coal; NSW",em:"~600",dp:"~400m",d:1970,o:1982,rv:"~$650M",dp_meters:400,em_count:600,pr_total_tonnes:5000000,pr_coal_mt:5,rv_usd:650000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Vanscoy",c:"Canada",s:"Saskatchewan",r:"North America",la:51.94,ln:-107.08,co:["Potash"],pc:"Potash",cp:"Nutrien",t:"Underground",m:"Longwall",st:"Operating",pr:"Part of Nutrien potash",em:"~500",dp:"~1000m",d:1952,o:1966,rv:"~$900M",dp_meters:1000,em_count:500,pr_total_tonnes:3000000,pr_potash_mt:1.5,rv_usd:900000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Vatukoula",c:"Fiji",s:"Viti Levu",la:-17.75,ln:177.85,co:["Gold"],pc:"Gold",cp:"Vatukoula Gold Mines",t:"Underground",m:"Cut & Fill",st:"Operating",pr:"Au; Fiji; small-scale",em:"~700",dp:"~700m",d:1932,o:1934,no:"Pacific Islands gold mine",rv:"~$59M",dp_meters:700,em_count:700,pr_total_tonnes:500000,pr_au_oz_pa:50000,rv_usd:59700000,pr_year:"CY2024",src_type:"Company",confidence:"Low",dq:"B"},{n:"Veladero",c:"Argentina",s:"San Juan",r:"Latin America",la:-29.35,ln:-70.04,co:["Gold","Silver"],pc:"Gold",cp:"Barrick Gold (50%) / Shandong Gold (50%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Au-Ag; Argentina OP heap leach",em:"~3,000",dp:"~200m",d:1998,o:2005,no:"At ~4,800m elevation",rv:"~$597M",dp_meters:200,em_count:3000,pr_total_tonnes:10000000,pr_au_oz_pa:250000,rv_usd:597200000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Venetia",c:"South Africa",s:"Limpopo",r:"Africa",la:-22.42,ln:29.32,co:["Diamonds"],pc:"Diamonds",cp:"De Beers",t:"Underground",m:"Sub-level Caving",st:"Operating",pr:"De Beers' flagship SA mine; transitioned to UG",em:"~3,500",dp:"~1000m",d:1980,o:1992,no:"De Beers flagship, $2B UG expansion",gr:"60 cpht",rv:"~$350M",dp_meters:1000,em_count:3500,pr_total_tonnes:3000000,pr_carats_pa:3500000,rv_usd:350000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Verninskoye",c:"Russia",s:"Irkutsk Oblast",r:"CIS",la:56.5,ln:115,co:["Gold"],pc:"Gold",cp:"Polyus",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Au; Irkutsk region",em:"~1,500",dp:"~300m",d:1980,o:2016,rv:"~$358M",dp_meters:300,em_count:1500,pr_total_tonnes:3000000,pr_au_oz_pa:150000,rv_usd:358400000,pr_year:"CY2024",src_type:"Company",confidence:"Medium",dq:"B"},{n:"Voisey's Bay",c:"Canada",s:"Newfoundland",r:"North America",la:56.33,ln:-62.09,co:["Nickel","Copper","Cobalt"],pc:"Copper",cp:"Vale",t:"Underground",m:"Open Stoping",st:"Operating",pr:"UG mines (VBME) ramping up; Ni+Cu; part of Vale 160kt Ni total",em:"~1,000",dp:"~400m",d:1993,o:2005,rs:"~30Mt",no:"World-class nickel deposit",gr:"1.7% Ni",rv:"~$118M",dp_meters:400,em_count:1000,pr_total_tonnes:2500000,pr_cu_tpa:15000,rs_tonnes:30000000,rv_usd:118800000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Wahgnion",c:"Burkina Faso",r:"Africa",la:10.9,ln:-3.25,co:["Gold"],pc:"Gold",cp:"Lilium Mining (ex-Endeavour)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Divested Jun 2023 to Lilium Mining",em:"~1,000",dp:"~100m",d:2012,o:2019,no:"Divested by Endeavour Jun 30, 2023",dp_meters:100,em_count:1000,pr_total_tonnes:2000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Waihi",c:"New Zealand",s:"Waikato",r:"Asia-Pacific",la:-37.38,ln:175.85,co:["Gold","Silver"],pc:"Gold",cp:"OceanaGold",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Au-Ag; New Zealand UG",em:"~350",dp:"~500m",d:1878,o:1878,no:"Historic Coromandel gold mine",gr:"4g/t Au",rv:"~$238M",dp_meters:500,em_count:350,pr_total_tonnes:1000000,pr_au_oz_pa:100000,rv_usd:238900000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Warkworth",c:"Australia",s:"New South Wales",r:"Asia-Pacific",la:-32.54,ln:151.1,co:["Coal (Thermal)"],pc:"Coal (Thermal)",cp:"Yancoal",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Thermal coal; NSW Hunter Valley",em:"~1,200",dp:"~100m",d:1977,o:1981,rv:"~$910M",dp_meters:100,em_count:1200,pr_total_tonnes:7000000,pr_coal_mt:7,rv_usd:910000000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Weda Bay",c:"Indonesia",s:"North Maluku",r:"Asia-Pacific",la:0.4,ln:127.9,co:["Nickel"],pc:"Nickel",cp:"Tsingshan / Eramet JV",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Ni; Indonesia",em:"~10,000",dp:"~30m",d:2007,o:2020,rs:"~500Mt",no:"Major Indonesian nickel smelting hub",rv:"~$247M",dp_meters:30,em_count:10000,pr_total_tonnes:5000000,pr_ni_tpa:40000,rs_tonnes:500000000,rv_usd:247500000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"Medium",dq:"A"},{n:"Weipa",c:"Australia",s:"Queensland",r:"Cape York",la:-12.63,ln:141.87,co:["Bauxite"],pc:"Bauxite",cp:"Rio Tinto",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of 58.7Mt bauxite total (record); Amrun operating above nameplate",em:"~1,600",dp:"~30m",d:1955,o:1963,rs:"~2.0Bt",no:"World's largest bauxite operation",rv:"~$2.0B",dp_meters:30,em_count:1600,pr_total_tonnes:40000000,pr_baux_mt:40,rs_tonnes:2000000000,rv_usd:2000000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Worsley",c:"Australia",s:"Western Australia",r:"South West",la:-33.1,ln:116.45,co:["Bauxite"],pc:"Bauxite",cp:"South32 (86%)",t:"Open Pit",m:"Dragline / Strip Mining",st:"Operating",pr:"Bauxite-alumina; part of South32",em:"~1,500",dp:"~30m",d:1972,o:1989,rs:"~700Mt",no:"One of world's lowest-cost alumina producers",rv:"~$500M",dp_meters:30,em_count:1500,pr_total_tonnes:10000000,pr_baux_mt:10,rs_tonnes:700000000,rv_usd:500000000,pr_year:"FY2025",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Yanacocha",c:"Peru",s:"Cajamarca",r:"Latin America",la:-6.97,ln:-78.54,co:["Gold","Silver"],pc:"Gold",cp:"Newmont (51.35%) / Buenaventura (43.65%)",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Au-Ag; Peru; ~354koz Au CY2024",em:"~3,000",dp:"~400m",d:1986,o:1993,no:"South America's largest gold mine",rv:"~$845M",dp_meters:400,em_count:3000,pr_total_tonnes:65000000,pr_au_oz_pa:354000,rv_usd:845700000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Yandi",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.72,ln:119.02,co:["Iron Ore"],pc:"Iron Ore",cp:"BHP",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"18Mt iron ore (BHP share FY24)",em:"~500",dp:"~100m",d:1991,o:1991,rv:"~$2.0B",dp_meters:100,em_count:500,pr_total_tonnes:18000000,pr_fe_mt:18,rv_usd:1980000000,pr_year:"FY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Yandicoogina",c:"Australia",s:"Western Australia",r:"Pilbara",la:-22.73,ln:119.03,co:["Iron Ore"],pc:"Iron Ore",cp:"Rio Tinto",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Part of Pilbara ops; depleting, transitioning to Western Range",em:"~1,000",dp:"~100m",d:1989,o:1998,rs:"~400Mt",no:"Depletion noted; transitioning to Western Range replacement mine",rv:"~$2.8B",dp_meters:100,em_count:1000,pr_total_tonnes:25000000,pr_fe_mt:25,rs_tonnes:400000000,rv_usd:2750000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Young-Davidson",c:"Canada",s:"Ontario",r:"North America",la:47.88,ln:-80.1,co:["Gold"],pc:"Gold",cp:"Alamos Gold",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of Alamos total",em:"~500",dp:"~1200m",d:1910,o:2012,gr:"2.5g/t Au",dp_meters:1200,em_count:500,pr_total_tonnes:2500000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Yunnan Tin",c:"China",s:"Yunnan",r:"Asia-Pacific",la:23.37,ln:103.38,co:["Tin"],pc:"Tin",cp:"Yunnan Tin Group",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Sn; China; world's largest Sn producer",em:"~5,000",dp:"~600m",d:200,o:1950,no:"World's largest tin producer",dp_meters:600,em_count:5000,pr_total_tonnes:5000000,pr_sn_kt:70,pr_year:"CY2024",src_type:"Government",confidence:"Medium",dq:"B"},{n:"Zawar",c:"India",s:"Rajasthan",r:"Udaipur",la:24.35,ln:73.72,co:["Zinc","Lead"],pc:"Zinc",cp:"Hindustan Zinc (Vedanta)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Part of HZL; oldest Zn mine in India",em:"~1,200",dp:"~400m",d:300,o:1968,rs:"~20Mt",no:"One of world's oldest mines - 4,000+ year history",dp_meters:400,em_count:1200,pr_total_tonnes:2000000,pr_zn_tpa:40000,rs_tonnes:20000000,pr_year:"FY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Zijin Mining Hunchun",c:"China",s:"Jilin",r:"Asia-Pacific",la:42.89,ln:130.37,co:["Gold","Copper"],pc:"Copper",cp:"Zijin Mining",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Au-Cu; China",em:"~1,000",dp:"~300m",d:1995,o:2012,dp_meters:300,em_count:1000,pr_total_tonnes:3000000,pr_au_oz_pa:100000,pr_cu_tpa:20000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Zijinshan",c:"China",s:"Fujian",r:"Asia-Pacific",la:25.16,ln:116.38,co:["Gold","Copper"],pc:"Copper",cp:"Zijin Mining",t:"Open Pit & Underground",m:"Truck & Shovel",st:"Operating",pr:"Au-Cu; China",em:"~5,000",dp:"~500m",d:1998,o:2005,rs:"~500Mt",no:"Zijin Mining's flagship",dp_meters:500,em_count:5000,pr_total_tonnes:3000000,pr_au_oz_pa:150000,pr_cu_tpa:30000,rs_tonnes:500000000,pr_year:"CY2024",rs_year:"2024",src_type:"Company",confidence:"High",dq:"A"},{n:"Zinkgruvan",c:"Sweden",r:"Europe",la:58.82,ln:15.1,co:["Zinc","Lead","Silver"],pc:"Zinc",cp:"Lundin Mining",t:"Underground",m:"Open Stoping",st:"Operating",pr:"Zn-Pb-Ag; Sweden UG",em:"~500",d:1857,o:1857,gr:"8% Zn",em_count:500,pr_total_tonnes:1500000,pr_zn_tpa:80000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"},{n:"Zouerate",c:"Mauritania",r:"Africa",la:22.73,ln:-12.47,co:["Iron Ore"],pc:"Iron Ore",cp:"SNIM",t:"Open Pit",m:"Truck & Shovel",st:"Operating",pr:"Iron ore; Mauritania; same complex as Guelb",em:"~5,000",dp:"~100m",d:1952,o:1963,rv:"~$1.3B",dp_meters:100,em_count:5000,pr_total_tonnes:12000000,pr_fe_mt:12,rv_usd:1320000000,pr_year:"CY2024",src_type:"Government",confidence:"Medium",dq:"B"},{n:"Éléonore",c:"Canada",s:"Quebec",r:"North America",la:52.71,ln:-76.06,co:["Gold"],pc:"Gold",cp:"Newmont (pending sale)",t:"Underground",m:"Open Stoping",st:"Operating",pr:"243koz Au (CY2024; pending divestiture)",em:"~800",dp:"~600m",d:2004,o:2014,no:"Non-core asset, pending divestiture announced 2024",gr:"5.0g/t Au",rv:"~$580M",dp_meters:600,em_count:800,pr_total_tonnes:5000000,pr_au_oz_pa:243000,rv_usd:580500000,pr_year:"CY2024",src_type:"Company",confidence:"High",dq:"B"}];



// Expand compressed data
const MINES = M.map(x=>({name:x.n,country:x.c,state:x.s,region:x.r||"",lat:x.la,lng:x.ln,commodity:x.co,company:x.cp,type:x.t,method:x.m,status:x.st,size:x.sz||"Major",production:x.pr,employees:x.em,depth:x.dp,discovered:x.d,opened:x.o,reserves:x.rs,notes:x.no,grade:x.gr||"",revenue:x.rv||"",
  // Structured numeric fields
  pr_cu_tpa:x.pr_cu_tpa,pr_au_oz_pa:x.pr_au_oz_pa,pr_total_tonnes:x.pr_total_tonnes,pr_ni_tpa:x.pr_ni_tpa,pr_zn_tpa:x.pr_zn_tpa,pr_ag_oz_pa:x.pr_ag_oz_pa,pr_carats_pa:x.pr_carats_pa,pr_pgm_oz_pa:x.pr_pgm_oz_pa,pr_u3o8_lb_pa:x.pr_u3o8_lb_pa,pr_u3o8_tpa:x.pr_u3o8_tpa,pr_pb_tpa:x.pr_pb_tpa,
  rs_tonnes:x.rs_tonnes,rs_grade_cu_pct:x.rs_grade_cu_pct,rs_grade_au_gpt:x.rs_grade_au_gpt,rs_grade_fe_pct:x.rs_grade_fe_pct,rs_grade_ni_pct:x.rs_grade_ni_pct,rs_grade_zn_pct:x.rs_grade_zn_pct,
  gr_cu_pct:x.gr_cu_pct,gr_au_gpt:x.gr_au_gpt,gr_fe_pct:x.gr_fe_pct,gr_u3o8_pct:x.gr_u3o8_pct,gr_ni_pct:x.gr_ni_pct,gr_zn_pct:x.gr_zn_pct,gr_ag_gpt:x.gr_ag_gpt,gr_cpht:x.gr_cpht,gr_kcal:x.gr_kcal,
  rv_usd:x.rv_usd,em_count:x.em_count,dp_meters:x.dp_meters,
  pr_fe_mt:x.pr_fe_mt,pr_li_tpa:x.pr_li_tpa,pr_year:x.pr_year,pr_ore_tpa:x.pr_total_tonnes,
  pr_coal_mt:x.pr_coal_mt,pr_baux_mt:x.pr_baux_mt,pr_potash_mt:x.pr_potash_mt,pr_ti_kt:x.pr_ti_kt,
  pr_reo_kt:x.pr_reo_kt,pr_phos_mt:x.pr_phos_mt,pr_cr_mt:x.pr_cr_mt,pr_mn_mt:x.pr_mn_mt,pr_sn_kt:x.pr_sn_kt,pc:x.pc||""
}));
const CONT={"Australia":"Oceania","Papua New Guinea":"Oceania","Fiji":"Oceania","New Zealand":"Oceania","New Caledonia":"Oceania","Indonesia":"Asia","Philippines":"Asia","Chile":"South America","Peru":"South America","Brazil":"South America","Argentina":"South America","Colombia":"South America","Ecuador":"South America","Suriname":"South America","Mexico":"North America","United States":"North America","Canada":"North America","Dominican Republic":"North America","Panama":"North America","Jamaica":"North America","Cuba":"North America","South Africa":"Africa","DR Congo":"Africa","Zambia":"Africa","Botswana":"Africa","Tanzania":"Africa","Ghana":"Africa","Mali":"Africa","Egypt":"Africa","Guinea":"Africa","Mauritania":"Africa","Ivory Coast":"Africa","Burkina Faso":"Africa","Senegal":"Africa","Eritrea":"Africa","Namibia":"Africa","Niger":"Africa","Lesotho":"Africa","Angola":"Africa","Mozambique":"Africa","Madagascar":"Africa","Sierra Leone":"Africa","Gabon":"Africa","Morocco":"Africa","Russia":"Asia","Sweden":"Europe","Finland":"Europe","Poland":"Europe","United Kingdom":"Europe","Turkey":"Europe","Greece":"Europe","Serbia":"Europe","Spain":"Europe","Portugal":"Europe","Ireland":"Europe","Mongolia":"Asia","China":"Asia","India":"Asia","Saudi Arabia":"Asia","Uzbekistan":"Asia","Kazakhstan":"Asia","Laos":"Asia","Myanmar":"Asia","Kyrgyzstan":"Asia","Pakistan":"Asia"};

// =======================================================
// NAVIGATION MODULE - Globe Coordinate System
// =======================================================
// Coordinate system: Y = north (up), XZ = equatorial plane
// Camera at (0, 0, +camZ) looking at origin
// Globe rotation order: YXZ (yaw Y, pitch X, roll Z=0)
//
// latLngToV3: geographic -> 3D (used for markers + borders)
//   Uses co-latitude p and offset longitude t matching world-atlas data
//
// latLonToUnitVector: geographic -> unit vector (for navigation math)
//   Standard spherical: Y=up, +Z=prime meridian facing camera at yaw=0
//
// computeTargetYawPitch: finds globe rotation to center a mine
//   yaw  = atan2(-x, z) of the mine's unit vector
//   pitch = atan2(y, hypot(x,z)) clamped to ±85 deg
// =======================================================
const LON_OFFSET_DEG=0; // adjust if prime meridian misaligned
const DEG2RAD=Math.PI/180;
const latLngToV3=(lat,lng,r)=>{const p=(90-lat)*DEG2RAD,t=(lng+180)*DEG2RAD;return new Vector3(-(r*Math.sin(p)*Math.cos(t)),r*Math.cos(p),r*Math.sin(p)*Math.sin(t))};
const latLonToUnitVector=(latDeg,lonDeg)=>latLngToV3(latDeg,lonDeg+LON_OFFSET_DEG,1);
const computeTargetYawPitch=(latDeg,lonDeg)=>{
  const v=latLonToUnitVector(latDeg,lonDeg);
  const yawY=Math.atan2(-v.x,v.z);
  const pitchX=Math.max(-85*DEG2RAD,Math.min(85*DEG2RAD,Math.atan2(v.y,Math.hypot(v.x,v.z))));
  return {yawY,pitchX};
};

const CC={"Copper":"#e87d3e","Gold":"#ffd700","Iron Ore":"#ff2d55","Diamonds":"#b8e8ff","Silver":"#c0c0c0","Nickel":"#8fbc8f","Zinc":"#7b8fa1","Platinum":"#e5e4e2","Palladium":"#cec8c0","Cobalt":"#3d59ab","Uranium":"#6fff6f","Potash":"#ff6b8a","Lead":"#5c6470","PGMs":"#d4af37","Lithium":"#66ffcc","Bauxite":"#d4956a","Manganese":"#9b59b6","Tantalum":"#f39c12","Rhodium":"#aaa9ad","Coal (Met)":"#555","Coal (Thermal)":"#777","Molybdenum":"#8B7D6B","Phosphate":"#22cc88","Tin":"#b5651d","Titanium":"#4682b4","Chromite":"#cc3366","Rare Earths":"#ff44aa"};
const getCC=co=>CC[co[0]]||"#ff9944";
// Company colors - top companies get distinct hues, rest cycle
const CompanyColors={"BHP":"#ff5533","Rio Tinto":"#e84040","Glencore":"#3b82f6","Newmont":"#ffd700","Barrick Gold":"#f59e0b","Anglo American":"#8b5cf6","Codelco":"#22c55e","Vale":"#14b8a6","Freeport-McMoRan":"#e87d3e","Gold Fields":"#eab308","Agnico Eagle Mines":"#06b6d4","Kinross Gold":"#a3e635","South32":"#64748b","BHP Mitsubishi Alliance (BMA)":"#ef4444","Newcrest Mining":"#d946ef","Fortescue":"#2563eb","Endeavour Mining":"#f97316","AngloGold Ashanti":"#fbbf24","Boliden":"#4ade80","Nutrien":"#38bdf8","Nornickel":"#fb7185","MMG Limited":"#818cf8","Teck Resources":"#a78bfa","Hindustan Zinc (Vedanta)":"#34d399","Sibanye-Stillwater":"#f472b6"};
const companyPalette=["#60a5fa","#f87171","#a78bfa","#34d399","#fbbf24","#fb923c","#38bdf8","#e879f9","#4ade80","#f472b6","#94a3b8","#c084fc","#22d3ee","#fca5a5"];
let cpIdx=0;const getCompanyColor=cp=>CompanyColors[cp]||(CompanyColors[cp]=companyPalette[cpIdx++%companyPalette.length]);
// Mine type colors
const TypeColors={"Open Pit":"#3b82f6","Underground":"#ef4444","Open Pit & Underground":"#a855f7"};
const getTypeColor=t=>TypeColors[t]||"#888";
// Mining method colors
const MethodColors={"Truck & Shovel":"#3b82f6","Open Stoping":"#f59e0b","Longwall":"#22c55e","Sub-level Caving":"#ef4444","Block / Panel Caving":"#a855f7","Deep Level Mining":"#ec4899","Dragline / Strip Mining":"#14b8a6","Cut & Fill":"#f97316"};
const getMethodColor=m=>MethodColors[m]||"#888";

// Mine production value for marker sizing - uses rv_usd as universal normalizer
// Returns 0-1 scale, log-normalized
const getMineScale=(mine)=>{
  const rv=mine.rv_usd||0;
  if(rv>0){
    // Revenue range: ~$50M (small) to ~$15B (massive) → log scale
    const logRv=Math.log10(Math.max(rv,5e7));// clamp floor at 50M
    const logMin=Math.log10(5e7);// 50M
    const logMax=Math.log10(1.5e10);// 15B
    return Math.max(0,Math.min(1,(logRv-logMin)/(logMax-logMin)));
  }
  // Fallback: use employee count
  const emp=parseInt((mine.employees||"0").replace(/[^0-9]/g,""))||0;
  if(emp>0)return Math.max(0,Math.min(0.6,emp/10000));
  return 0.2; // default for unknowns
};

// Mine output summary - returns primary output + revenue string
const getMineOutput=(mine)=>{
  const pc=mine.pc||"";let out="";
  if(pc==="Gold"&&mine.pr_au_oz_pa)out=(mine.pr_au_oz_pa/1e3).toFixed(0)+"koz Au";
  else if(pc==="Iron Ore"&&mine.pr_fe_mt)out=mine.pr_fe_mt+"Mt Fe";
  else if(pc.includes("Coal")&&mine.pr_coal_mt)out=mine.pr_coal_mt+"Mt Coal";
  else if(pc==="Bauxite"&&mine.pr_baux_mt)out=mine.pr_baux_mt+"Mt Baux";
  else if(pc==="Diamonds"&&mine.pr_carats_pa)out=(mine.pr_carats_pa/1e6).toFixed(1)+"Mct";
  else if(pc==="Potash"&&mine.pr_potash_mt)out=mine.pr_potash_mt+"Mt KCl";
  else if(pc==="Nickel"&&mine.pr_ni_tpa)out=(mine.pr_ni_tpa/1e3).toFixed(0)+"kt Ni";
  else if(pc==="Zinc"&&mine.pr_zn_tpa)out=(mine.pr_zn_tpa/1e3).toFixed(0)+"kt Zn";
  else if(pc==="Lithium"&&mine.pr_li_tpa)out=(mine.pr_li_tpa/1e3).toFixed(0)+"kt Li";
  else if(pc==="Platinum"&&mine.pr_pgm_oz_pa)out=(mine.pr_pgm_oz_pa/1e3).toFixed(0)+"koz PGM";
  else if(pc==="Titanium"&&mine.pr_ti_kt)out=mine.pr_ti_kt+"kt TiO₂";
  else if(pc==="Rare Earths"&&mine.pr_reo_kt)out=mine.pr_reo_kt+"kt REO";
  else if(pc==="Phosphate"&&mine.pr_phos_mt)out=mine.pr_phos_mt+"Mt Phos";
  else if(pc==="Chromite"&&mine.pr_cr_mt)out=mine.pr_cr_mt+"Mt Cr";
  else if(pc==="Manganese"&&mine.pr_mn_mt)out=mine.pr_mn_mt+"Mt Mn";
  else if(pc==="Tin"&&mine.pr_sn_kt)out=mine.pr_sn_kt+"kt Sn";
  else if(pc==="Uranium"&&mine.pr_u3o8_tpa)out=mine.pr_u3o8_tpa+"t U₃O₈";
  else if(mine.pr_cu_tpa)out=(mine.pr_cu_tpa/1e3).toFixed(0)+"kt Cu";
  else if(mine.pr_au_oz_pa)out=(mine.pr_au_oz_pa/1e3).toFixed(0)+"koz Au";
  const rv=mine.revenue?(mine.revenue.replace("~","")):"";
  return {out,rv};
};

// =======================================
// PART 4: Duplicate detection
// =======================================
const normalize=s=>(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const similarity=(a,b)=>{const na=normalize(a),nb=normalize(b);if(na===nb)return 1;if(na.includes(nb)||nb.includes(na))return 0.8;let match=0;const shorter=na.length<nb.length?na:nb,longer=na.length<nb.length?nb:na;for(let i=0;i<shorter.length;i++)if(longer.includes(shorter[i]))match++;return match/longer.length};
const findDuplicates=(mines)=>{const dupes=[];for(let i=0;i<mines.length;i++)for(let j=i+1;j<mines.length;j++){const sim=similarity(mines[i].name,mines[j].name);const sameCountry=mines[i].country===mines[j].country;const closeLat=Math.abs(mines[i].lat-mines[j].lat)<0.1&&Math.abs(mines[i].lng-mines[j].lng)<0.1;if((sim>0.7&&sameCountry)||closeLat)dupes.push([mines[i].name,mines[j].name,sim.toFixed(2)])}return dupes};
const isDuplicate=(mine,mines)=>mines.some(m=>similarity(mine.name||mine.n,m.name)>0.7&&(mine.country||mine.c)===m.country||(Math.abs((mine.lat||mine.la)-m.lat)<0.05&&Math.abs((mine.lng||mine.ln)-m.lng)<0.05));

const normCompany=(c)=>{if(c.includes("/"))c=c.split("/")[0].trim();if(c.includes("("))c=c.split("(")[0].trim();return c};
const getCompanies=()=>[...new Set(MINES.map(m=>normCompany(m.company)))].sort();
const getCommodities=()=>[...new Set(MINES.flatMap(m=>m.commodity))].sort();

function MiningGlobe(){
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
  const [sidebar,setSidebar]=useState(false);
  const [detail,setDetail]=useState(false);
  const [isMobile,setIsMobile]=useState(typeof window!=="undefined"&&window.innerWidth<=768);
  const [showAbout,setShowAbout]=useState(false);
  const [showFeedback,setShowFeedback]=useState(false);
  const [showSuggest,setShowSuggest]=useState(false);
  const [formStatus,setFormStatus]=useState(null); // {type:'feedback'|'suggest', status:'success'|'error'|'submitting'}
  const [viewMode,setViewMode_]=useState("commodity");
  const setViewMode=useCallback(mode=>{
    if(mode===viewMode)return;
    setFiltCom("All");setFiltComp("All");setFiltType("All");setFiltMethod("All");
    setViewMode_(mode);
  },[viewMode]);
  const [theme,setTheme]=useState("dark");
  const [search,setSearch]=useState("");
  const [filters,dispatch]=useReducer(filterReducer,INIT_FILTERS);
  const filtCom=filters.commodity,filtComp=filters.company,filtType=filters.mineType,filtMethod=filters.miningMethod,filtCont=filters.continent,filtCountry=filters.country;
  const setFiltCom=v=>dispatch({type:"SET",key:"commodity",value:v});
  const setFiltComp=v=>dispatch({type:"SET",key:"company",value:v});
  const setFiltType=v=>dispatch({type:"SET",key:"mineType",value:v});
  const setFiltMethod=v=>dispatch({type:"SET",key:"miningMethod",value:v});
  const setFiltCont=v=>{dispatch({type:"SET",key:"continent",value:v});dispatch({type:"SET",key:"country",value:"All"})};
  const setFiltCountry=v=>dispatch({type:"SET",key:"country",value:v});
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

  const allCom=useMemo(()=>getCommodities(),[]);
  const allComp=useMemo(()=>getCompanies(),[]);
  const allTypes=useMemo(()=>[...new Set(MINES.map(m=>m.type))].sort(),[]);
  const allMethods=useMemo(()=>[...new Set(MINES.map(m=>m.method))].sort(),[]);
  const allContinents=useMemo(()=>[...new Set(MINES.map(m=>CONT[m.country]||"Other"))].sort(),[]);
  const allCountries=useMemo(()=>{
    const cs=filtCont==="All"?MINES:MINES.filter(m=>(CONT[m.country]||"Other")===filtCont);
    return [...new Set(cs.map(m=>m.country))].sort();
  },[filtCont]);
  const countFor=useMemo(()=>{
    const com={},comp={},typ={},meth={},cont={},ctry={};
    MINES.forEach(m=>{
      m.commodity.forEach(c=>{com[c]=(com[c]||0)+1});
      comp[normCompany(m.company)]=(comp[normCompany(m.company)]||0)+1;
      typ[m.type]=(typ[m.type]||0)+1;
      meth[m.method]=(meth[m.method]||0)+1;
      const cn=CONT[m.country]||"Other";
      cont[cn]=(cont[cn]||0)+1;
      ctry[m.country]=(ctry[m.country]||0)+1;
    });
    return {com,comp,typ,meth,cont,ctry};
  },[]);

  const filtered=useMemo(()=>{
    return MINES.filter(m=>{
      const sq=search.toLowerCase();
      const ms=sq===""||m.name.toLowerCase().includes(sq)||m.country.toLowerCase().includes(sq)||m.company.toLowerCase().includes(sq)||m.commodity.some(c=>c.toLowerCase().includes(sq))||(m.state&&m.state.toLowerCase().includes(sq))||(m.region&&m.region.toLowerCase().includes(sq));
      const mc=filtCom==="All"||m.commodity.includes(filtCom);
      const mcp=filtComp==="All"||normCompany(m.company)===filtComp;
      const mt=filtType==="All"||m.type.toLowerCase().includes(filtType.toLowerCase());
      const mst=filtMethod==="All"||m.method===filtMethod;
      const mcont=filtCont==="All"||(CONT[m.country]||"Other")===filtCont;
      const mctry=filtCountry==="All"||m.country===filtCountry;
      // Numeric filters: em_count in raw, dp_meters in raw, rs_tonnes stored as Mt for filter
      const emVal=m.em_count||0;
      const nem=!numActive.em_count||(emVal>=numFilters.em_count[0]&&(numFilters.em_count[1]>=10000||emVal<=numFilters.em_count[1]));
      const ndp=!numActive.dp_meters||!m.dp_meters||(m.dp_meters>=numFilters.dp_meters[0]&&m.dp_meters<=numFilters.dp_meters[1]);
      const rsMt=m.rs_tonnes?(m.rs_tonnes/1e6):0;
      const nrs=!numActive.rs_tonnes||(rsMt>=numFilters.rs_tonnes[0]&&(numFilters.rs_tonnes[1]>=4000||rsMt<=numFilters.rs_tonnes[1]));
      return ms&&mc&&mcp&&mt&&mst&&mcont&&mctry&&nem&&ndp&&nrs;
    });
  },[search,filtCom,filtComp,filtType,filtMethod,filtCont,filtCountry,numFilters,numActive]);

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

  const stats=useMemo(()=>({mines:MINES.length,countries:new Set(MINES.map(m=>m.country)).size,commodities:new Set(MINES.flatMap(m=>m.commodity)).size}),[]);
  const activeFilters=useMemo(()=>{
    const f=[];
    if(filtCont!=="All")f.push({label:filtCont,color:"#ffd700",clear:()=>setFiltCont("All")});
    if(filtCountry!=="All")f.push({label:filtCountry,color:"#4ecdc4",clear:()=>setFiltCountry("All")});
    if(filtCom!=="All")f.push({label:filtCom,color:"#e87d3e",clear:()=>setFiltCom("All")});
    if(filtComp!=="All")f.push({label:filtComp,color:"#3888ff",clear:()=>setFiltComp("All")});
    if(filtType!=="All")f.push({label:filtType,color:"#6fff6f",clear:()=>setFiltType("All")});
    if(filtMethod!=="All")f.push({label:filtMethod,color:"#b8e8ff",clear:()=>setFiltMethod("All")});
    return f;
  },[filtCont,filtCountry,filtCom,filtComp,filtType,filtMethod]);
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
    setMeta("description","Mine Atlas — Interactive 3D globe visualising 329 major mining operations across 61 countries and 27 commodities. Filter, explore and compare global mines.");
    setMeta("og:title","Mine Atlas — Global Mining Operations",true);
    setMeta("og:description","Interactive 3D globe visualising 329 major mining operations across 61 countries and 27 commodities.",true);
    setMeta("og:type","website",true);
    setMeta("twitter:card","summary_large_image");
    setMeta("twitter:title","Mine Atlas — Global Mining Operations");
    setMeta("twitter:description","Interactive 3D globe visualising 329 major mining operations across 61 countries.");
    // Viewport for mobile
    if(!document.querySelector('meta[name="viewport"]')){
      const vp=document.createElement("meta");vp.name="viewport";vp.content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
      document.head.appendChild(vp);
    }
    const w=mountRef.current.clientWidth,h=mountRef.current.clientHeight;
    const scene=new Scene();scene.background=new Color(0x080c14);sceneRef.current=scene;
    const cam=new PerspectiveCamera(45,w/h,0.1,1000);cam.position.z=4.5;camRef.current=cam;
    let ren;
    try{ren=new WebGLRenderer({antialias:true})}catch(e){console.error("WebGL init failed:",e);setLoading(false);return}
    ren.setSize(w,h);ren.setPixelRatio(Math.min(window.devicePixelRatio,2));
    mountRef.current.appendChild(ren.domElement);renRef.current=ren;
    scene.add(new AmbientLight(0x334455,1.2));
    const dl=new DirectionalLight(0xffeedd,0.8);dl.position.set(5,3,5);scene.add(dl);
    const bl=new DirectionalLight(0x446688,0.4);bl.position.set(-5,-3,-5);scene.add(bl);
    const sg=new BufferGeometry(),sp=[];
    for(let i=0;i<4000;i++)sp.push((Math.random()-.5)*100,(Math.random()-.5)*100,(Math.random()-.5)*100);
    sg.setAttribute("position",new Float32BufferAttribute(sp,3));
    const stars=new Points(sg,new PointsMaterial({color:0xffffff,size:0.08,sizeAttenuation:true,transparent:true}));
    scene.add(stars);starsRef.current=stars;
    const R=1.5;
    const pivot=new Group();scene.add(pivot);pivotRef.current=pivot;
    const globe=new Mesh(new SphereGeometry(R,64,64),new MeshPhongMaterial({color:0x1a2a3a,emissive:0x0a1520,specular:0x334466,shininess:25,transparent:true,opacity:0.95}));
    pivot.add(globe);globeRef.current=globe;
    globe.add(new Mesh(new SphereGeometry(R*1.04,64,64),new MeshBasicMaterial({color:0x3388ff,transparent:true,opacity:0.07,side:BackSide})));
    const gm=new LineBasicMaterial({color:0x223344,transparent:true,opacity:0.3});gridMatRef.current=gm;
    for(let lat=-60;lat<=60;lat+=30){const pts=[];for(let lng=0;lng<=360;lng+=2)pts.push(latLngToV3(lat,lng,R*1.001));globe.add(new Line(new BufferGeometry().setFromPoints(pts),gm))}
    for(let lng=0;lng<360;lng+=30){const pts=[];for(let lat=-90;lat<=90;lat+=2)pts.push(latLngToV3(lat,lng,R*1.001));globe.add(new Line(new BufferGeometry().setFromPoints(pts),gm))}
    // Country outlines from TopoJSON (with retry)
    const outlineMat=new LineBasicMaterial({color:0x000000,transparent:true,opacity:0.6});outlineMatRef.current=outlineMat;
    const countryGroup=new Group();globe.add(countryGroup);
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
      const obj=topo.objects.countries;
      for(const geom of obj.geometries){
        if(geom.type==="Polygon"){geom.arcs.forEach(ring=>drawRing(decodeRing(ring)))}
        else if(geom.type==="MultiPolygon"){geom.arcs.forEach(poly=>poly.forEach(ring=>drawRing(decodeRing(ring))))}
      }
    }).catch(e=>console.warn("Country borders unavailable:",e.message));


    const mg=new Group();globe.add(mg);markersRef.current=mg;
    MINES.forEach(mine=>{
      const col=getCC(mine.commodity),pos=latLngToV3(mine.lat,mine.lng,R*1.008);
      // Size based on production value (revenue-normalized)
      const pv=getMineScale(mine);
      const s=0.005+pv*0.012; // range: 0.005 (tiny) to 0.017 (massive)
      const mk=new Mesh(new SphereGeometry(s,10,10),new MeshStandardMaterial({color:new Color(col),transparent:true,opacity:0.85,emissive:new Color(col),emissiveIntensity:0.1,roughness:0.4,metalness:0.2}));
      mk.position.copy(pos);mk.userData.baseScale=s;mg.add(mk);mapRef.current.set(mk.uuid,mine);mineToMeshRef.current.set(mine.name,mk);
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
      // Cluster radius also shrinks when zoomed in
      const cpx=CLUSTER_PX_BASE*Math.max(0.5,zoomFactor);
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
      const clusters=[];
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

  const TILT_LIMIT=Math.PI/2.2;
  const DRAG_SPEED=0.005;
  const ZOOM_SPEED=0.002;

  // Pointer down on canvas
  const onDown=useCallback(e=>{
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
      const targets=[...markersRef.current.children,...(clusterGroupRef.current?clusterGroupRef.current.children:[])];
      const hits=rayRef.current.intersectObjects(targets,false);
      const hit=hits.find(i=>mapRef.current.has(i.object.uuid)||clusterMapRef.current.has(i.object.uuid));
      if(hit){
        if(clusterMapRef.current.has(hit.object.uuid)){
          setHoverCluster(clusterMapRef.current.get(hit.object.uuid));setHoverMine(null);
        } else {
          setHoverMine(mapRef.current.get(hit.object.uuid));setHoverCluster(null);
        }
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
  // =======================================================
  // focusMine - Navigate globe to center a mine
  //
  // Uses computeTargetYawPitch to get exact yaw/pitch,
  // animates with easeInOutCubic, then verifies via screen projection.
  //
  // orbitRef: rotX = pitch (X rotation), rotY = yaw (Y rotation)
  // globe.rotation.z = 0 always (no roll)
  // =======================================================
  const focusMine=useCallback((mine,onComplete)=>{
    if(!mine||!isFinite(mine.lat)||!isFinite(mine.lng)){
      console.warn("[focusMine] SKIP: invalid coords for",mine?.name);
      if(onComplete)onComplete();
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
  },[]);
  const onClick=useCallback(e=>{
    if(!camRef.current||!markersRef.current)return;
    const rect=mountRef.current.getBoundingClientRect();
    const m2=new Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    rayRef.current.setFromCamera(m2,camRef.current);
    const targets=[...markersRef.current.children,...(clusterGroupRef.current?clusterGroupRef.current.children:[])];
    const hits=rayRef.current.intersectObjects(targets,false);
    const hit=hits.find(i=>mapRef.current.has(i.object.uuid)||clusterMapRef.current.has(i.object.uuid));
    if(hit){
      if(clusterMapRef.current.has(hit.object.uuid)){
        const cl=clusterMapRef.current.get(hit.object.uuid);
        focusMine({name:"cluster",lat:cl.avgLat,lng:cl.avgLng});
        orbitRef.current.targetZoom=Math.max(1.8,orbitRef.current.zoomLevel*0.6);
        setHoverCluster(null);
      } else {
        const m=mapRef.current.get(hit.object.uuid);setPreviewMine(m);setHoverMine(null);setHoverCluster(null);
      }
    }
    else if(!orbitRef.current.isDragging){setPreviewMine(null)}
  },[focusMine]);
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
    renRef.current.setClearColor(isDk?0x080c14:0xe8eaf0);
    sceneRef.current.traverse(obj=>{
      // Globe body
      if(obj.isMesh&&obj.geometry&&obj.geometry.type==="SphereGeometry"&&obj.geometry.parameters&&obj.geometry.parameters.radius===1.5){
        obj.material.color.set(isDk?0x0d1b2a:0xb8c8d8);
        obj.material.emissive.set(isDk?0x051020:0x8898a8);
        obj.material.specular&&obj.material.specular.set(isDk?0x334466:0xaabbcc);
        obj.material.shininess=isDk?25:15;
      }
      // Atmosphere glow (BackSide sphere)
      if(obj.isMesh&&obj.material&&obj.material.side===BackSide){
        obj.material.color.set(isDk?0x3388ff:0x6699cc);
        obj.material.opacity=isDk?0.07:0.12;
      }
    });
    // Country outlines - darker in light mode for contrast
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
      mesh.material.emissiveIntensity=isDk?0.1:0.35;
      mesh.material.roughness=isDk?0.4:0.6;
    });
  },[theme]);


  // ===========================================
  // MARKER BEHAVIOUR: opacity + scale + emissive
  // 3-tier: selected(brightest) > filtered(match) > dimmed(non-match)
  // ===========================================
  const filteredSet=useMemo(()=>new Set(filtered.map(m=>m.name)),[filtered]);
  const hasActiveFilter=filtCom!=="All"||filtComp!=="All"||filtType!=="All"||filtMethod!=="All"||filtCont!=="All"||filtCountry!=="All"||search!==""||Object.values(numActive).some(Boolean);
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
  useEffect(()=>{
    const onKey=(e)=>{
      if(e.key==="Escape"){if(detail)clearSelection();else if(sidebar)setSidebar(false)}
      if(e.key==="/"&&!e.ctrlKey&&!e.metaKey&&document.activeElement.tagName!=="INPUT"){e.preventDefault();setSidebar(true);setTimeout(()=>{const el=document.querySelector('input[placeholder*="Search"]');if(el)el.focus()},100)}
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[detail,sidebar,clearSelection]);

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
  const bg=dk?"rgba(10,14,23,0.88)":"rgba(245,245,250,0.92)",bdr=dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.1)",br="12px",bf="blur(20px)";
  const tc=dk?"#c8d6e5":"#1a1a2e",tc2=dk?"#8494a4":"#6a6a7a",tc3=dk?"#e87d3e":"#c4621e",bgMain=dk?"#080c14":"#e8eaf0";
  const legendItems=useMemo(()=>{
    if(viewMode==="commodity"){
      const comTotals={};
      MINES.forEach(m=>{
        if(m.pr_cu_tpa)comTotals["Copper"]=(comTotals["Copper"]||0)+m.pr_cu_tpa;
        if(m.pr_au_oz_pa)comTotals["Gold"]=(comTotals["Gold"]||0)+m.pr_au_oz_pa;
        if(m.pr_fe_mt)comTotals["Iron Ore"]=(comTotals["Iron Ore"]||0)+m.pr_fe_mt;
        if(m.pr_ni_tpa)comTotals["Nickel"]=(comTotals["Nickel"]||0)+m.pr_ni_tpa;
        if(m.pr_zn_tpa)comTotals["Zinc"]=(comTotals["Zinc"]||0)+m.pr_zn_tpa;
        if(m.pr_li_tpa)comTotals["Lithium"]=(comTotals["Lithium"]||0)+m.pr_li_tpa;
        if(m.pr_coal_mt)comTotals["Coal (Met)"]=(comTotals["Coal (Met)"]||0)+m.pr_coal_mt;
        if(m.pr_baux_mt)comTotals["Bauxite"]=(comTotals["Bauxite"]||0)+m.pr_baux_mt;
        if(m.pr_potash_mt)comTotals["Potash"]=(comTotals["Potash"]||0)+m.pr_potash_mt;
        if(m.pr_carats_pa)comTotals["Diamonds"]=(comTotals["Diamonds"]||0)+m.pr_carats_pa;
        if(m.pr_pgm_oz_pa)comTotals["Platinum"]=(comTotals["Platinum"]||0)+m.pr_pgm_oz_pa;
        if(m.pr_ti_kt)comTotals["Titanium"]=(comTotals["Titanium"]||0)+m.pr_ti_kt;
        if(m.pr_reo_kt)comTotals["Rare Earths"]=(comTotals["Rare Earths"]||0)+m.pr_reo_kt;
        if(m.pr_phos_mt)comTotals["Phosphate"]=(comTotals["Phosphate"]||0)+m.pr_phos_mt;
        if(m.pr_cr_mt)comTotals["Chromite"]=(comTotals["Chromite"]||0)+m.pr_cr_mt;
        if(m.pr_mn_mt)comTotals["Manganese"]=(comTotals["Manganese"]||0)+m.pr_mn_mt;
        if(m.pr_sn_kt)comTotals["Tin"]=(comTotals["Tin"]||0)+m.pr_sn_kt;
        if(m.pr_u3o8_tpa)comTotals["Uranium"]=(comTotals["Uranium"]||0)+m.pr_u3o8_tpa;
        if(m.pr_co_tpa)comTotals["Cobalt"]=(comTotals["Cobalt"]||0)+m.pr_co_tpa;
      });
      const fmtTotal=(c,v)=>{
        if(!v)return"";
        if(c==="Copper"||c==="Nickel"||c==="Zinc"||c==="Lithium"||c==="Cobalt")return(v/1e3).toFixed(0)+"kt";
        if(c==="Gold")return(v/1e6).toFixed(1)+"Moz";
        if(c==="Platinum")return(v/1e3).toFixed(0)+"koz";
        if(c==="Iron Ore"||c==="Coal (Met)"||c==="Bauxite"||c==="Potash"||c==="Phosphate"||c==="Chromite"||c==="Manganese")return v.toFixed(0)+"Mt";
        if(c==="Diamonds")return(v/1e6).toFixed(1)+"Mct";
        if(c==="Titanium"||c==="Rare Earths"||c==="Tin")return v.toFixed(0)+"kt";
        if(c==="Uranium")return v.toFixed(0)+"t";
        return"";
      };
      return["Copper","Gold","Iron Ore","Diamonds","Nickel","Platinum","Cobalt","Zinc","Lithium","Bauxite","Coal (Met)","Manganese","Phosphate","Tin","Titanium","Chromite","Rare Earths","Potash"].map(c=>({label:c,color:CC[c]||"#ff9944",key:c,total:fmtTotal(c,comTotals[c])}));
    }
    if(viewMode==="type")return Object.entries(TypeColors).map(([k,v])=>({label:k,color:v,key:k,total:""}));
    if(viewMode==="method")return Object.entries(MethodColors).map(([k,v])=>({label:k,color:v,key:k,total:""}));
    if(viewMode==="company"){const top=["BHP","Rio Tinto","Glencore","Newmont","Barrick Gold","Anglo American","Codelco","Vale","Gold Fields","Agnico Eagle Mines","South32","Fortescue"];return top.map(c=>({label:c,color:getCompanyColor(c),key:c,total:""}))}
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
    });
    return counts;
  },[filtered,viewMode]);

  return(<div style={{width:"100vw",height:"100vh",background:bgMain,fontFamily:"'Inter','SF Pro Display','Segoe UI',system-ui,-apple-system,sans-serif",color:tc,overflow:"hidden",position:"relative"}}>
    {loading&&<div style={{position:"absolute",inset:0,zIndex:100,background:"#080c14",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px"}}>
      <LogoIcon size={48}/>
      <div style={{width:"40px",height:"40px",border:"3px solid rgba(232,125,62,0.15)",borderTopColor:"#e87d3e",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{fontSize:"13px",color:"#8494a4",letterSpacing:"1px"}}>LOADING MINE ATLAS</div>
    </div>}
    {/* HEADER */}
    <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,padding:"10px 16px",pointerEvents:"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",flex:1,minWidth:0}}>
          <LogoIcon size={36}/>
          <div>
            <h1 style={{margin:0,fontSize:"15px",fontWeight:700,letterSpacing:"2px",color:"#e87d3e",textShadow:"0 0 30px rgba(232,125,62,0.3)",fontFamily:"'Georgia','Times New Roman',serif"}}>MINE ATLAS</h1>
            <p style={{margin:"1px 0 0",fontSize:"8px",letterSpacing:"1.5px",color:"#8494a4",fontFamily:"'SF Mono',Consolas,monospace"}}>{stats.mines} MINES · {stats.countries} COUNTRIES · {stats.commodities} COMMODITIES</p>
          </div>
        </div>
        <div style={{display:"flex",gap:"6px",flexShrink:0,pointerEvents:"auto"}}>
          <button onClick={recentreGlobe} title="Re-centre globe" style={{background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",borderRadius:"50%",width:"28px",height:"28px",color:tc2,fontSize:"13px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>⌂</button>
          <button onClick={()=>setTheme(dk?"light":"dark")} style={{background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",borderRadius:"50%",width:"28px",height:"28px",color:tc2,fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{dk?"☀":"☾"}</button>
          <button onClick={()=>setShowSuggest(true)} title="Suggest data update" style={{background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",borderRadius:"50%",width:"28px",height:"28px",color:tc2,fontSize:"12px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✎</button>
          <button onClick={()=>setShowFeedback(true)} title="Send feedback" style={{background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",borderRadius:"50%",width:"28px",height:"28px",color:tc2,fontSize:"12px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✉</button>
          <button onClick={()=>setShowAbout(true)} style={{background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",borderRadius:"50%",width:"28px",height:"28px",color:tc2,fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>?</button>
        </div>
      </div>
    </div>
    {/* SIDEBAR TOGGLE */}
    <button onClick={()=>setSidebar(!sidebar)} style={{position:"absolute",top:90,left:sidebar?388:16,zIndex:20,background:bg,border:bdr,borderRadius:"8px",color:"#e87d3e",padding:"8px 12px",cursor:"pointer",fontSize:"14px",fontFamily:"inherit",backdropFilter:bf,transition:"left 0.3s ease"}}>
      {sidebar?"◀":<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e87d3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>}
    </button>
    {/* SIDEBAR - desktop: side panel, mobile: slide-in overlay */}
    {isMobile&&sidebar&&<div onClick={()=>setSidebar(false)} style={{position:"absolute",inset:0,zIndex:14,background:"rgba(0,0,0,0.4)"}}/>}
    <div style={{position:"absolute",top:isMobile?0:"56px",left:isMobile?(sidebar?0:"-100%"):(sidebar?16:-400),bottom:isMobile?0:"16px",width:isMobile?"85%":"370px",maxWidth:isMobile?"320px":"370px",zIndex:15,background:dk?"rgba(10,14,23,0.97)":"rgba(245,245,250,0.97)",border:isMobile?"none":bdr,borderRadius:isMobile?0:br,backdropFilter:bf,display:"flex",flexDirection:"column",overflow:"hidden",transition:isMobile?"left 0.3s ease":"left 0.3s ease"}}>
      {/* SEARCH */}
      <div style={{padding:"12px 12px 8px"}}>
        <input type="text" placeholder="Search mines, countries, companies..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",padding:"9px 12px",background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",borderRadius:"8px",color:tc,fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
      </div>
      {/* FILTERS TOGGLE */}
      <div onClick={()=>setFiltersOpen(!filtersOpen)} style={{padding:"6px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",borderBottom:dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)"}}>
        <span style={{fontSize:"11px",fontWeight:600,letterSpacing:"0.5px",color:tc2}}>{filtersOpen?"▾":"▸"} FILTERS</span>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"12px",color:filtered.length<MINES.length?tc3:tc,fontWeight:600,fontFamily:"'SF Mono',Consolas,monospace"}}>{filtered.length}<span style={{fontWeight:400,color:tc2,fontSize:"10px"}}> / {MINES.length}</span></span>
          {activeFilters.length>0&&<button onClick={e=>{e.stopPropagation();resetAll()}}
            style={{fontSize:"10px",color:"#fff",background:"rgba(232,125,62,0.8)",border:"none",borderRadius:"5px",padding:"3px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Reset</button>}
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
          ].map(f=>(
            <div key={f.key}>
              <div onClick={()=>setExpFilter(expFilter===f.key?null:f.key)}
                style={{padding:"8px 10px",cursor:"pointer",borderRadius:"8px",background:expFilter===f.key?(dk?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)"):(dk?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)"),display:"flex",justifyContent:"space-between",alignItems:"center",border:f.val!=="All"?"1px solid "+f.color+"33":dk?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.06)",transition:"all 0.15s ease"}}>
                <span style={{fontSize:"11px",fontWeight:600,letterSpacing:"0.3px",color:f.val!=="All"?f.color:expFilter===f.key?tc:tc2}}>{expFilter===f.key?"▾":"▸"} {f.val==="All"?f.label:f.val}</span>
                <span style={{fontSize:"10px",color:f.val!=="All"?f.color:tc2,background:f.val!=="All"?f.color+"18":(dk?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)"),padding:"2px 8px",borderRadius:"10px",fontWeight:600,fontFamily:"'SF Mono','Cascadia Code','Consolas',monospace"}}>{f.val==="All"?f.opts.length:countFor[f.key==="commodity"?"com":f.key==="company"?"comp":f.key==="type"?"typ":f.key==="method"?"meth":f.key==="continent"?"cont":"ctry"][f.val]||0}</span>
              </div>
              {expFilter===f.key&&<div style={{paddingLeft:"8px",marginTop:"4px",maxHeight:"160px",overflowY:"auto"}}>
                <div onClick={()=>{f.set("All");setExpFilter(null)}}
                  style={{padding:"6px 10px",cursor:"pointer",borderRadius:"6px",fontSize:"11px",color:f.val==="All"?f.color:tc2,fontWeight:f.val==="All"?600:400,background:f.val==="All"?(dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"):"transparent"}}
                  onMouseEnter={e=>e.currentTarget.style.background=dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"}
                  onMouseLeave={e=>e.currentTarget.style.background=f.val==="All"?(dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"):"transparent"}>
                  All ({f.opts.length})
                </div>
                {f.opts.map(opt=>(
                  <div key={opt} onClick={()=>{f.set(f.val===opt?"All":opt);if(f.val!==opt)setExpFilter(null)}}
                    style={{padding:"6px 10px",cursor:"pointer",borderRadius:"6px",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"11px",color:f.val===opt?f.color:tc2,fontWeight:f.val===opt?600:400,background:f.val===opt?(dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"):"transparent",transition:"background 0.1s"}}
                    onMouseEnter={e=>{if(f.val!==opt)e.currentTarget.style.background=dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"}}
                    onMouseLeave={e=>e.currentTarget.style.background=f.val===opt?(dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"):"transparent"}>
                    <span>{f.key==="commodity"&&CC[opt]?<span style={{display:"inline-block",width:"8px",height:"8px",borderRadius:"50%",background:CC[opt],marginRight:"6px"}}/>:null}{opt}</span>
                    <span style={{fontSize:"9px",color:tc2,background:dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",padding:"2px 7px",borderRadius:"8px",fontFamily:"'SF Mono','Cascadia Code','Consolas',monospace"}}>{f.counts[opt]||0}</span>
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
                <span style={{fontSize:"10px",color:tc2,fontWeight:500}}>{label}</span>
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
            style={{fontSize:"9px",padding:"3px 8px",borderRadius:"5px",background:sortBy===s.k?"rgba(232,125,62,0.15)":dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",border:sortBy===s.k?"1px solid rgba(232,125,62,0.3)":dk?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(0,0,0,0.06)",color:sortBy===s.k?"#e87d3e":tc2,cursor:"pointer",fontFamily:"inherit",fontWeight:sortBy===s.k?600:400,transition:"all 0.12s"}}>
            {s.l}{sortBy===s.k?(sortDir==="asc"?" ↑":" ↓"):""}
          </button>))}
      </div>
      {/* MINE LIST */}
      <div style={{flex:1,overflowY:"auto",padding:"4px 10px 12px"}}>
        {sorted.map(mine=>(
          <div key={mine.name} onClick={()=>selectMine(mine)}
            style={{padding:"7px 10px",cursor:"pointer",borderRadius:"6px",borderLeft:"3px solid "+getMarkerColor(mine,viewMode),marginBottom:"2px",fontSize:"11px",color:tc2,transition:"background 0.1s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)";e.currentTarget.style.color=tc}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=tc2}}>
            <div style={{fontWeight:600,fontSize:"12px"}}>{mine.name}</div>
            <div style={{fontSize:"10px",color:tc2,marginTop:"1px"}}>{mine.company} · {mine.country}</div>
            <div style={{fontSize:"10px",marginTop:"2px",fontFamily:"'SF Mono',Consolas,monospace",color:dk?"rgba(232,125,62,0.85)":"#c06030",display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {(()=>{const{out,rv}=getMineOutput(mine);const p=[];if(out)p.push(out);if(rv)p.push(rv);
                return p.length?p.map((t,i)=><span key={i}>{t}</span>):null;
              })()}
            </div>
          </div>))}
      </div>
    </div>
    {/* VIEW MODE TOGGLE */}
    <div style={{position:"absolute",top:isMobile?50:60,left:"50%",transform:"translateX(-50%)",zIndex:12,display:"flex",gap:"2px",background:dk?"rgba(10,14,23,0.85)":"rgba(245,245,250,0.9)",border:dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.08)",borderRadius:"8px",padding:"3px",backdropFilter:bf,pointerEvents:"auto"}}>
      {[{k:"commodity",l:"Commodity"},{k:"company",l:"Company"},{k:"type",l:"Mine Type"},{k:"method",l:"Method"}].map(v=>(
        <button key={v.k} onClick={()=>setViewMode(v.k)}
          style={{fontSize:isMobile?"10px":"13px",padding:isMobile?"4px 10px":"6px 14px",borderRadius:"6px",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:viewMode===v.k?600:400,transition:"all 0.15s",
            background:viewMode===v.k?"rgba(232,125,62,0.2)":"transparent",
            color:viewMode===v.k?"#e87d3e":tc2}}>{v.l}</button>))}
    </div>
    {/* 3D GLOBE */}
    <div ref={mountRef} style={{width:"100%",height:"100%",cursor:"grab",touchAction:"none"}} onPointerDown={onDown} onPointerMove={onMove} onClick={onClick} onTouchStart={onTouchStart} onTouchMove={onTouchMove}/>
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
    {hoverMine&&!detail&&!previewMine&&!isMobile&&(<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-120%)",background:dk?"rgba(10,14,23,0.95)":"rgba(245,245,250,0.95)",border:"1px solid rgba(232,125,62,0.4)",borderRadius:"8px",padding:"10px 14px",pointerEvents:"none",zIndex:20,backdropFilter:bf,maxWidth:"280px"}}>
      <div style={{fontSize:"12px",fontWeight:700,color:"#e87d3e"}}>{hoverMine.name}</div>
      <div style={{fontSize:"10px",color:tc2,marginTop:"2px"}}>{hoverMine.company} · {hoverMine.country}</div>
      {(()=>{const{out,rv}=getMineOutput(hoverMine);return(out||rv)?<div style={{fontSize:"10px",fontFamily:"'SF Mono',Consolas,monospace",color:dk?"rgba(232,125,62,0.85)":"#c06030",marginTop:"4px"}}>{out}{out&&rv?" · ":""}{rv}</div>:null})()}
      <div style={{display:"flex",gap:"3px",flexWrap:"wrap",marginTop:"5px"}}>
        {hoverMine.commodity.map(c=><span key={c} style={{fontSize:"8px",padding:"1px 5px",borderRadius:"3px",background:getCC([c])+"22",color:getCC([c]),border:"1px solid "+getCC([c])+"44"}}>{c}</span>)}
      </div>
    </div>)}
    {/* CLUSTER HOVER TOOLTIP */}
    {hoverCluster&&!detail&&!previewMine&&!isMobile&&(<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-120%)",background:dk?"rgba(10,14,23,0.95)":"rgba(245,245,250,0.95)",border:"1px solid rgba(232,125,62,0.4)",borderRadius:"8px",padding:"10px 14px",pointerEvents:"none",zIndex:20,backdropFilter:bf,maxWidth:"300px"}}>
      <div style={{fontSize:"12px",fontWeight:700,color:"#e87d3e"}}>{hoverCluster.mines.length} mines clustered</div>
      <div style={{fontSize:"10px",color:tc2,marginTop:"3px"}}>{hoverCluster.mines.slice(0,4).map(m=>m.name).join(", ")}{hoverCluster.mines.length>4?"...":""}</div>
      <div style={{fontSize:"9px",color:tc2,marginTop:"4px",fontStyle:"italic"}}>Click to zoom in</div>
    </div>)}
    {/* PART 4: Quick preview card */}
    {previewMine&&!detail&&(<div style={{position:"absolute",bottom:isMobile?80:90,left:"50%",transform:"translateX(-50%)",zIndex:25,background:dk?"rgba(10,14,23,0.96)":"rgba(245,245,250,0.96)",border:dk?"1px solid rgba(232,125,62,0.3)":"1px solid rgba(0,0,0,0.15)",borderRadius:"14px",padding:"14px 18px",backdropFilter:bf,width:isMobile?"90%":"340px",maxWidth:"400px",animation:"slideUp 0.25s ease-out"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:"14px",fontWeight:700,color:tc3}}>{previewMine.name}</div>
          <div style={{fontSize:"11px",color:tc2,marginTop:"2px"}}>{previewMine.company}</div>
          <div style={{fontSize:"10px",color:tc2,marginTop:"1px"}}>{previewMine.country} · {previewMine.type}</div>
        </div>
        <button onClick={()=>{setPreviewMine(null);if(glowRef.current){glowRef.current.mesh.visible=false;glowRef.current.ring.visible=false}}} style={{background:"none",border:"none",color:tc2,fontSize:"16px",cursor:"pointer",padding:"0 0 0 8px",lineHeight:1}}>✕</button>
      </div>
      <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"8px",alignItems:"center"}}>
        {previewMine.commodity.map(c=><span key={c} style={{fontSize:"9px",padding:"2px 7px",borderRadius:"4px",background:getCC([c])+"20",color:getCC([c]),border:"1px solid "+getCC([c])+"40",fontWeight:600}}>{c}</span>)}
      </div>
      {(()=>{const{out,rv}=getMineOutput(previewMine);if(!out&&!rv)return null;return <div style={{display:"flex",gap:"10px",marginTop:"10px",padding:"8px 10px",background:dk?"rgba(232,125,62,0.06)":"rgba(232,125,62,0.04)",borderRadius:"8px",border:dk?"1px solid rgba(232,125,62,0.12)":"1px solid rgba(232,125,62,0.08)"}}>
        {out&&<div style={{textAlign:"center",flex:1}}><div style={{fontSize:"13px",fontFamily:"'SF Mono',Consolas,monospace",fontWeight:700,color:tc}}>{out}</div><div style={{fontSize:"7px",letterSpacing:"1px",color:tc2,fontWeight:600,marginTop:"1px"}}>OUTPUT</div></div>}
        {out&&rv&&<div style={{width:"1px",background:dk?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}}/>}
        {rv&&<div style={{textAlign:"center",flex:1}}><div style={{fontSize:"13px",fontFamily:"'SF Mono',Consolas,monospace",fontWeight:700,color:tc}}>{rv}</div><div style={{fontSize:"7px",letterSpacing:"1px",color:tc2,fontWeight:600,marginTop:"1px"}}>REVENUE</div></div>}
      </div>})()}
      <div style={{display:"flex",gap:"8px",marginTop:"12px"}}>
        <button onClick={()=>openFullDetail(previewMine)} style={{flex:1,padding:"8px 0",borderRadius:"8px",background:"rgba(232,125,62,0.15)",border:"1px solid rgba(232,125,62,0.35)",color:"#e87d3e",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Open Full Details</button>
        <button onClick={()=>addToCompare(previewMine)} style={{flex:1,padding:"8px 0",borderRadius:"8px",background:compareList.find(m=>m.name===previewMine.name)?"rgba(102,255,102,0.1)":dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)",border:compareList.find(m=>m.name===previewMine.name)?"1px solid rgba(102,255,102,0.3)":dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",color:compareList.find(m=>m.name===previewMine.name)?"#66ff66":tc2,fontSize:"11px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>{compareList.find(m=>m.name===previewMine.name)?"✓ Added":"+ Compare"}</button>
      </div>
    </div>)}
    {/* DETAIL PANEL - desktop: side panel, mobile: swipeable bottom sheet */}
    {detail&&selMine&&(<div style={{position:"absolute",top:isMobile?"auto":"56px",right:isMobile?0:"16px",bottom:isMobile?0:"16px",left:isMobile?0:"auto",width:isMobile?"100%":"320px",height:isMobile?"85vh":"auto",maxHeight:isMobile?"85vh":"calc(100vh - 72px)",zIndex:25,background:dk?"rgba(10,14,23,0.97)":"rgba(245,245,250,0.97)",border:isMobile?"none":bdr,borderRadius:isMobile?"20px 20px 0 0":br,backdropFilter:bf,display:"flex",flexDirection:"column",overflow:"hidden",animation:isMobile?"sheetUp 0.3s ease-out":"slideIn 0.3s ease-out",transform:sheetDrag?`translateY(${Math.max(0,sheetDrag.current)}px)`:undefined,transition:sheetDrag?undefined:"transform 0.3s ease"}}>
      {/* Mobile drag handle - only this area triggers swipe-to-dismiss */}
      {isMobile&&<div
        onTouchStart={e=>{const y=e.touches[0].clientY;setSheetDrag({start:y,current:0})}}
        onTouchMove={e=>{if(!sheetDrag)return;const dy=e.touches[0].clientY-sheetDrag.start;setSheetDrag({...sheetDrag,current:dy})}}
        onTouchEnd={()=>{if(sheetDrag&&sheetDrag.current>120)clearSelection();setSheetDrag(null)}}
        style={{display:"flex",justifyContent:"center",padding:"10px 0 6px",cursor:"grab",flexShrink:0}}>
        <div style={{width:"40px",height:"4px",borderRadius:"2px",background:dk?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)"}}/>
      </div>}
      <div style={{padding:"16px",borderBottom:dk?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><h2 style={{margin:0,fontSize:"16px",fontWeight:700,color:tc3}}>{selMine.name}</h2>
            <p style={{margin:"3px 0 0",fontSize:"11px",color:tc2}}>{selMine.state}{selMine.region?" · "+selMine.region:""}, {selMine.country}</p></div>
          <button onClick={clearSelection} style={{background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",color:tc2,borderRadius:"5px",padding:"3px 8px",cursor:"pointer",fontSize:"12px",fontFamily:"inherit"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:"3px",flexWrap:"wrap",marginTop:"8px"}}>
          {selMine.commodity.map(c=><span key={c} style={{fontSize:"9px",padding:"2px 7px",borderRadius:"3px",background:getCC([c])+"22",color:getCC([c]),border:"1px solid "+getCC([c])+"44",fontWeight:600}}>{c}</span>)}
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
            <div style={{fontSize:"8px",letterSpacing:"1.5px",color:tc2,fontWeight:600,marginBottom:"6px"}}>OUTPUT</div>
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
        <div style={{padding:"8px 16px 16px"}}>
          <button onClick={()=>addToCompare(selMine)} style={{width:"100%",padding:"10px",borderRadius:"8px",background:compareList.find(m=>m.name===selMine.name)?"rgba(102,255,102,0.1)":"rgba(232,125,62,0.12)",border:compareList.find(m=>m.name===selMine.name)?"1px solid rgba(102,255,102,0.3)":"1px solid rgba(232,125,62,0.3)",color:compareList.find(m=>m.name===selMine.name)?"#66ff66":"#e87d3e",fontSize:"12px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",letterSpacing:"0.5px"}}>{compareList.find(m=>m.name===selMine.name)?"✓ Added to Compare":"+ Add to Compare"}</button>
        </div>
      </div>
    </div>)}
    {/* ======================================= */}
    {/* COMPARE TRAY - floating bottom bar    */}
    {/* ======================================= */}
    {compareList.length>0&&!compareView&&(
      <div style={{position:"absolute",bottom:isMobile?60:56,left:"50%",transform:"translateX(-50%)",zIndex:30,display:"flex",alignItems:"center",gap:"8px",background:dk?"rgba(10,14,23,0.96)":"rgba(245,245,250,0.96)",padding:"8px 14px",borderRadius:"14px",border:dk?"1px solid rgba(232,125,62,0.25)":"1px solid rgba(0,0,0,0.12)",backdropFilter:bf,animation:"slideUp 0.3s ease-out",maxWidth:isMobile?"95%":"600px"}}>
        {compareList.map(mine=>(
          <div key={mine.name} style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 8px",borderRadius:"8px",background:getCC(mine.commodity)+"18",border:"1px solid "+getCC(mine.commodity)+"33",flexShrink:0}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:getCC(mine.commodity)}}/>
            <span style={{fontSize:"10px",color:tc,fontWeight:600,whiteSpace:"nowrap",maxWidth:"80px",overflow:"hidden",textOverflow:"ellipsis"}}>{mine.name}</span>
            <span onClick={()=>removeFromCompare(mine.name)} style={{fontSize:"10px",color:tc2,cursor:"pointer",marginLeft:"2px",lineHeight:1}}>✕</span>
          </div>))}
        <div style={{display:"flex",gap:"6px",marginLeft:"4px",flexShrink:0}}>
          <button onClick={()=>setCompareView(true)} style={{padding:"6px 12px",borderRadius:"8px",background:"rgba(232,125,62,0.2)",border:"1px solid rgba(232,125,62,0.4)",color:"#e87d3e",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{compareList.length<2?"Add "+(2-compareList.length)+" more":"Compare "+compareList.length}</button>
          <button onClick={clearCompare} style={{padding:"6px 8px",borderRadius:"8px",background:dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)",border:dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.08)",color:tc2,fontSize:"10px",cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
        </div>
      </div>)}
    {/* Max limit flash */}
    {compareFlash==="max"&&<div style={{position:"absolute",bottom:isMobile?110:106,left:"50%",transform:"translateX(-50%)",zIndex:31,background:"rgba(255,60,60,0.9)",padding:"6px 14px",borderRadius:"8px",fontSize:"11px",color:"#fff",fontWeight:600,animation:"slideUp 0.2s ease-out",fontFamily:"inherit"}}>Maximum {MAX_COMPARE} mines for comparison</div>}

    {/* ======================================= */}
    {/* COMPARE VIEW - full screen table       */}
    {/* ======================================= */}
    {compareView&&compareList.length>=2&&(
      <div style={{position:"absolute",inset:0,zIndex:40,background:dk?"rgba(8,12,20,0.99)":"rgba(240,242,248,0.99)",backdropFilter:"blur(20px)",display:"flex",flexDirection:"column",animation:"slideUp 0.3s ease-out"}}>
        {/* Compare header */}
        <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:dk?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(0,0,0,0.08)"}}>
          <div>
            <h2 style={{margin:0,fontSize:"16px",fontWeight:700,color:tc3,letterSpacing:"1px"}}>COMPARE MINES</h2>
            <p style={{margin:"2px 0 0",fontSize:"10px",color:tc2}}>{compareList.length} mines selected</p>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={clearCompare} style={{padding:"6px 12px",borderRadius:"6px",background:dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",color:tc2,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>Clear All</button>
            <button onClick={()=>setCompareView(false)} style={{padding:"6px 12px",borderRadius:"6px",background:"rgba(232,125,62,0.15)",border:"1px solid rgba(232,125,62,0.35)",color:"#e87d3e",fontSize:"11px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✕ Close</button>
          </div>
        </div>
        {/* Compare table */}
        <div style={{flex:1,overflowX:"auto",overflowY:"auto",padding:"0"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:compareList.length*180+140+"px"}}>
            <thead>
              <tr>
                <th style={{position:"sticky",left:0,zIndex:2,background:dk?"#0a0e17":"#e8eaf0",padding:"12px 16px",textAlign:"left",fontSize:"9px",letterSpacing:"1px",color:tc2,fontWeight:600,borderBottom:dk?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(0,0,0,0.08)",minWidth:"130px"}}>METRIC</th>
                {compareList.map(mine=>(
                  <th key={mine.name} style={{padding:"12px 16px",textAlign:"left",borderBottom:dk?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(0,0,0,0.08)",minWidth:"160px",verticalAlign:"top"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"}}>
                      <div style={{width:"8px",height:"8px",borderRadius:"50%",background:getCC(mine.commodity)}}/>
                      <span style={{fontSize:"13px",fontWeight:700,color:tc3}}>{mine.name}</span>
                    </div>
                    <div style={{fontSize:"10px",color:tc2}}>{mine.country}</div>
                    <button onClick={()=>removeFromCompare(mine.name)} style={{marginTop:"6px",fontSize:"9px",color:tc2,background:"none",border:dk?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(0,0,0,0.08)",borderRadius:"4px",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
                  </th>))}
              </tr>
            </thead>
            <tbody>
              {[
                {label:"COMMODITY",fn:m=>m.commodity.join(", ")},
                {label:"COMPANY",fn:m=>m.company},
                {label:"MINE TYPE",fn:m=>m.type},
                {label:"MINING METHOD",fn:m=>m.method},
                {label:"THROUGHPUT",fn:m=>{const t=m.pr_ore_tpa;if(!t)return"—";const mt=t/1e6;return (mt>=1?(mt%1===0?mt.toFixed(0):mt.toFixed(1)):mt.toFixed(2))+" Mt/y"}},
                {label:"METAL OUTPUT",fn:m=>{const p=[];if(m.pr_cu_tpa)p.push((m.pr_cu_tpa/1e3).toFixed(1)+"kt Cu");if(m.pr_au_oz_pa)p.push((m.pr_au_oz_pa/1e3).toFixed(0)+"koz Au");if(m.pr_fe_mt)p.push(m.pr_fe_mt+"Mt Fe");if(m.pr_ni_tpa)p.push((m.pr_ni_tpa/1e3).toFixed(1)+"kt Ni");if(m.pr_li_tpa)p.push((m.pr_li_tpa/1e3).toFixed(1)+"kt Li");if(m.pr_zn_tpa)p.push((m.pr_zn_tpa/1e3).toFixed(1)+"kt Zn");if(m.pr_coal_mt)p.push(m.pr_coal_mt+"Mt Coal");if(m.pr_baux_mt)p.push(m.pr_baux_mt+"Mt Baux");if(m.pr_potash_mt)p.push(m.pr_potash_mt+"Mt KCl");if(m.pr_carats_pa)p.push((m.pr_carats_pa/1e6).toFixed(1)+"Mct");if(m.pr_ti_kt)p.push(m.pr_ti_kt+"kt TiO₂");if(m.pr_reo_kt)p.push(m.pr_reo_kt+"kt REO");if(m.pr_phos_mt)p.push(m.pr_phos_mt+"Mt Phos");if(m.pr_cr_mt)p.push(m.pr_cr_mt+"Mt Cr");if(m.pr_mn_mt)p.push(m.pr_mn_mt+"Mt Mn");if(m.pr_sn_kt)p.push(m.pr_sn_kt+"kt Sn");if(m.pr_u3o8_tpa)p.push(m.pr_u3o8_tpa+"t U₃O₈");if(m.pr_pgm_oz_pa)p.push((m.pr_pgm_oz_pa/1e3).toFixed(0)+"koz PGM");return p.length?p.join(", "):(m.production||"—")}},
                {label:"EST. REVENUE",fn:m=>m.revenue||"—"},
                {label:"EMPLOYEES",fn:m=>m.employees||"—"},
                {label:"DEPTH",fn:m=>m.depth||"—"},
                {label:"RESERVES",fn:m=>m.reserves||"—"},
                {label:"DISCOVERED",fn:m=>m.discovered?String(m.discovered):""},
                {label:"OPENED",fn:m=>m.opened?String(m.opened):""},
                {label:"COORDINATES",fn:m=>m.lat.toFixed(2)+"°, "+m.lng.toFixed(2)+"°"},
              ].map((row,ri)=>(
                <tr key={row.label} style={{background:ri%2===0?(dk?"rgba(255,255,255,0.015)":"rgba(0,0,0,0.015)"):"transparent"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=dk?"rgba(232,125,62,0.06)":"rgba(232,125,62,0.04)"}}
                  onMouseLeave={e=>{e.currentTarget.style.background=ri%2===0?(dk?"rgba(255,255,255,0.015)":"rgba(0,0,0,0.015)"):"transparent"}}>
                  <td style={{position:"sticky",left:0,zIndex:1,background:dk?"#0a0e17":"#e8eaf0",padding:"10px 16px",fontSize:"9px",letterSpacing:"1px",color:tc2,fontWeight:600,borderBottom:dk?"1px solid rgba(255,255,255,0.03)":"1px solid rgba(0,0,0,0.04)"}}>{row.label}</td>
                  {compareList.map(mine=>{
                    const val=row.fn(mine);
                    return <td key={mine.name} style={{padding:"10px 16px",fontSize:"12px",color:val?tc:tc2,borderBottom:dk?"1px solid rgba(255,255,255,0.03)":"1px solid rgba(0,0,0,0.04)"}}>{val||"—"}</td>
                  })}
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>)}

    {/* Interactive legend */}
    {!detail&&<div style={{position:"absolute",bottom:"12px",left:"50%",transform:"translateX(-50%)",zIndex:10,display:"flex",gap:isMobile?"3px 8px":"4px 10px",flexWrap:"wrap",justifyContent:"center",background:dk?"rgba(10,14,23,0.88)":"rgba(245,245,250,0.88)",padding:isMobile?"6px 12px":"8px 16px",borderRadius:"12px",border:dk?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(0,0,0,0.08)",backdropFilter:bf,maxWidth:isMobile?"95%":"92vw"}}>
      {legendItems.map(item=>{
        const isActive=(viewMode==="commodity"&&filtCom===item.label)||(viewMode==="company"&&filtComp===item.label)||(viewMode==="type"&&filtType===item.label)||(viewMode==="method"&&filtMethod===item.label);
        const count=legendCounts[item.label]||0;
        return <div key={item.key} style={{display:"flex",alignItems:"center",gap:isMobile?"3px":"4px",cursor:"pointer",transition:"all 0.2s",padding:isMobile?"1px 4px":"2px 6px",borderRadius:"6px",background:isActive?item.color+"25":"transparent",border:isActive?"1px solid "+item.color+"55":"1px solid transparent",opacity:hasActiveFilter&&!isActive&&(filtCom!=="All"||filtComp!=="All"||filtType!=="All"||filtMethod!=="All")?0.4:1}}
          onClick={()=>{
            if(viewMode==="commodity")setFiltCom(filtCom===item.label?"All":item.label);
            else if(viewMode==="company")setFiltComp(filtComp===item.label?"All":item.label);
            else if(viewMode==="type")setFiltType(filtType===item.label?"All":item.label);
            else if(viewMode==="method")setFiltMethod(filtMethod===item.label?"All":item.label);
          }}>
          <div style={{width:isMobile?6:8,height:isMobile?6:8,borderRadius:"50%",background:item.color,flexShrink:0,boxShadow:isActive?"0 0 6px "+item.color:"none",transition:"all 0.2s"}}/>
          <span style={{fontSize:isMobile?"8px":"11px",color:isActive?item.color:tc2,fontWeight:isActive?600:400,letterSpacing:"0.2px",transition:"all 0.2s",whiteSpace:"nowrap"}}>{item.label}</span>
          {item.total&&<span style={{fontSize:isMobile?"7px":"9px",color:isActive?item.color:tc2,fontFamily:"'SF Mono',Consolas,monospace",opacity:0.5,fontWeight:500,whiteSpace:"nowrap"}}>{item.total}</span>}
          {count>0&&<span style={{fontSize:isMobile?"7px":"9px",color:isActive?item.color:tc2,fontFamily:"'SF Mono',Consolas,monospace",opacity:0.6}}>{count}</span>}
        </div>;
      })}
    </div>}
    {/* ABOUT MODAL */}
    {showAbout&&<div onClick={()=>setShowAbout(false)} style={{position:"absolute",inset:0,zIndex:50,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:dk?"rgba(10,14,23,0.97)":"rgba(245,245,250,0.97)",border:bdr,borderRadius:"12px",padding:"24px",maxWidth:"400px",width:"100%",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <h2 style={{margin:0,fontSize:"16px",color:"#e87d3e",letterSpacing:"1px",fontFamily:"'Georgia','Times New Roman',serif"}}>MINE ATLAS</h2>
          <button onClick={()=>setShowAbout(false)} style={{background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",color:tc2,borderRadius:"5px",padding:"3px 8px",cursor:"pointer",fontSize:"12px",fontFamily:"inherit"}}>✕</button>
        </div>
        <div style={{fontSize:"12px",color:tc2,lineHeight:1.7}}>
          <p style={{marginBottom:"12px"}}>An interactive 3D visualisation of {stats.mines} major mining operations across {stats.countries} countries, covering {stats.commodities} commodities.</p>
          <p style={{marginBottom:"12px"}}>Filter by continent, country, commodity, company, mine type, or mining method. Tap any mine marker or sidebar entry to view detailed information.</p>
          <p style={{marginBottom:"12px",fontSize:"11px",color:tc2}}><strong style={{color:tc}}>Controls:</strong> Drag to rotate · Scroll/pinch to zoom · <span style={{color:"#e87d3e",fontFamily:"monospace"}}>/</span> to search · <span style={{color:"#e87d3e",fontFamily:"monospace"}}>Esc</span> to close panels</p>
          <p style={{marginBottom:"0",fontSize:"11px",color:tc2}}><strong style={{color:tc}}>Data:</strong> {stats.mines} mines · {stats.countries} countries · {stats.commodities} commodities. Sourced from CY2024/FY2024 company annual reports and production statements. Last verified Feb 2025. Figures are approximate.</p>
        </div>
      </div>
    </div>}
    {/* FEEDBACK MODAL */}
    {showFeedback&&<div onClick={()=>{setShowFeedback(false);setFormStatus(null)}} style={{position:"absolute",inset:0,zIndex:50,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:dk?"rgba(10,14,23,0.97)":"rgba(245,245,250,0.97)",border:bdr,borderRadius:"12px",padding:"24px",maxWidth:"420px",width:"100%",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <h2 style={{margin:0,fontSize:"15px",color:"#e87d3e",letterSpacing:"1px"}}>Send Feedback</h2>
          <button onClick={()=>{setShowFeedback(false);setFormStatus(null)}} style={{background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",color:tc2,borderRadius:"5px",padding:"3px 8px",cursor:"pointer",fontSize:"12px",fontFamily:"inherit"}}>✕</button>
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
      <div onClick={e=>e.stopPropagation()} style={{background:dk?"rgba(10,14,23,0.97)":"rgba(245,245,250,0.97)",border:bdr,borderRadius:"12px",padding:"24px",maxWidth:"460px",width:"100%",backdropFilter:"blur(20px)",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <h2 style={{margin:0,fontSize:"15px",color:"#e87d3e",letterSpacing:"1px"}}>Suggest Data Update</h2>
          <button onClick={()=>{setShowSuggest(false);setFormStatus(null)}} style={{background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",border:dk?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(0,0,0,0.1)",color:tc2,borderRadius:"5px",padding:"3px 8px",cursor:"pointer",fontSize:"12px",fontFamily:"inherit"}}>✕</button>
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
      @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
      @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:${dk?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"};border-radius:2px}
      select option{background:${dk?"#0a0e17":"#f0f0f5"};color:${dk?"#c8d6e5":"#1a1a2e"}}
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
