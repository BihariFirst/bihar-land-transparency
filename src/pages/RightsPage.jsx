import React,{useEffect,useMemo,useState} from 'react';

import {ArrowRight,Activity,AlertTriangle,BarChart3,BookOpen,CheckCircle2,ChevronRight,Clock3,Database,ExternalLink,Filter,GitBranch,Landmark,LayoutDashboard,LockKeyhole,MapPinned,Menu,RefreshCw,Scale,Search,ShieldCheck,Users,X,FileText,ClipboardList} from 'lucide-react';

import {STATIC_BASE} from '../services/api.js';

export function RightsPage(){const [data,setData]=useState(null);useEffect(()=>{fetch(`${STATIC_BASE}data/rights_duties_accountability.json`).then(r=>r.json()).then(setData)},[]);return <main className="page"><div className="pageTitle"><label>RIGHTS • DUTIES • ACCOUNTABILITY</label><h1>अधिकार, कर्तव्य और जवाबदेही</h1><p>कानून/नियम के verified framework को नागरिक और अधिकारी दोनों की जिम्मेदारियों में समझें।</p></div><div className="rightsGrid">{(data?.sections||[]).map(s=><section className="rightCard" key={s.type}><div className="cardIcon"><Scale size={20}/></div><h2>{s.title}</h2><ul>{s.items.map(x=><li key={x}>{x}</li>)}</ul></section>)}</div><div className="notice"><AlertTriangle size={18}/><div><b>Finding standard</b><span>Citizen allegation ≠ verified procedural irregularity ≠ final finding. Research dashboard में हर stage अलग रखा जाएगा।</span></div></div></main>}
