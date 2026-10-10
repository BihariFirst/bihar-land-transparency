import React,{useEffect,useMemo,useState} from 'react';

import {ArrowRight,Activity,AlertTriangle,BarChart3,BookOpen,CheckCircle2,ChevronRight,Clock3,Database,ExternalLink,Filter,GitBranch,Landmark,LayoutDashboard,LockKeyhole,MapPinned,Menu,RefreshCw,Scale,Search,ShieldCheck,Users,X,FileText,ClipboardList} from 'lucide-react';

import {journey} from '../data/constants.js';

export function ProcessPage(){return <main className="page"><div className="pageTitle"><label>ONE-SCREEN PROCESS MAP</label><h1>दाखिल-खारिज की यात्रा समझें</h1><p>किस stage पर क्या होना चाहिए और किस record/date से track करना है—एक ही screen पर।</p></div><div className="processGrid">{journey.map((x,i)=><article className="processCard" key={x.stage}><div className="stepNo">{String(i+1).padStart(2,'0')}</div><div><h3>{x.stage}</h3><b>{x.who}</b><p>{x.track}</p></div>{i<journey.length-1&&<ChevronRight className="processArrow"/>}</article>)}</div><div className="notice"><Clock3 size={18}/><div><b>Time tracking</b><span>Application date → objection/hearing dates → order date → correction slip/record update → appeal/revision dates. Applicable deadline हमेशा latest verified legal source से पढ़ें।</span></div></div></main>}
