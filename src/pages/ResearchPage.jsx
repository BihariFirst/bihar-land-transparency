import React,{useEffect,useMemo,useState} from 'react';

import {ArrowRight,Activity,AlertTriangle,BarChart3,BookOpen,CheckCircle2,ChevronRight,Clock3,Database,ExternalLink,Filter,GitBranch,Landmark,LayoutDashboard,LockKeyhole,MapPinned,Menu,RefreshCw,Scale,Search,ShieldCheck,Users,X,FileText,ClipboardList} from 'lucide-react';

import {Stat} from '../components/Common.jsx';

import {api} from '../services/api.js';

export function ResearchPage(){const [data,setData]=useState(null);useEffect(()=>{api('/dashboard').then(setData).catch(()=>setData({totals:{cases:0,districts:0,resolved:0},byDistrict:[]}))},[]);return <main className="page"><div className="pageTitle"><label>RESEARCH DASHBOARD</label><h1>तथ्य → पैटर्न → निष्कर्ष → सुधार</h1><p>Public-facing aggregate research और internal verification को अलग रखें। कोई finding केवल case allegation पर आधारित नहीं होगी।</p></div><div className="stats"><Stat n={data?.totals?.cases||0} t="Citizen cases"/><Stat n={data?.totals?.districts||0} t="Districts represented"/><Stat n={data?.totals?.resolved||0} t="Resolved"/><Stat n="0" t="Evidence uploads"/></div><div className="tableWrap"><table><thead><tr><th>District</th><th>Cases</th><th>Resolved</th><th>Not Resolved</th></tr></thead><tbody>{(data?.byDistrict||[]).map(r=><tr key={r.name}><td>{r.name}</td><td>{r.cases}</td><td>{r.resolved}</td><td>{r.unresolved}</td></tr>)}</tbody></table></div></main>}
