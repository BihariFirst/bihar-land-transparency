import React,{useEffect,useState} from 'react';
import {ArrowRight,Activity,AlertTriangle,BarChart3,BookOpen,CheckCircle2,ChevronRight,Clock3,Database,ExternalLink,Filter,GitBranch,Landmark,LayoutDashboard,LockKeyhole,MapPinned,Menu,RefreshCw,Scale,Search,ShieldCheck,Users,X,FileText,ClipboardList} from 'lucide-react';
import {nav,validPageIds,readPageFromHash} from './navigation.js';
import {api} from '../services/api.js';
import {HomePage} from '../pages/HomePage.jsx';
import {DistrictsPage} from '../pages/DistrictsPage.jsx';
import {LegalRulesPage} from '../pages/LegalRulesPage.jsx';
import {RightsPage} from '../pages/RightsPage.jsx';
import {ProcessPage} from '../pages/ProcessPage.jsx';
import {CitizenHelpPage} from '../pages/CitizenHelpPage.jsx';
import {CaseTrackingPage} from '../pages/CaseTrackingPage.jsx';
import {GrievancePage} from '../pages/GrievancePage.jsx';
import {ResearchPage} from '../pages/ResearchPage.jsx';
import {ReportsPage} from '../pages/ReportsPage.jsx';
import {AdminPage} from '../pages/AdminPage.jsx';

export default function App(){const [tab,setTab]=useState(()=>readPageFromHash());const [mobile,setMobile]=useState(false);const [districts,setDistricts]=useState([]);const [selected,setSelected]=useState('');const [caseId,setCaseId]=useState('');
 useEffect(()=>{api('/districts').then(setDistricts).catch(()=>{setDistricts([])})},[]);
 useEffect(()=>{const syncRoute=()=>{setTab(readPageFromHash());setMobile(false)};window.addEventListener('hashchange',syncRoute);return()=>window.removeEventListener('hashchange',syncRoute)},[]);
 useEffect(()=>{const labels={home:'होम',districts:'जिला नेटवर्क',law:'कानून 2011–वर्तमान',rights:'अधिकार / कर्तव्य',process:'दाखिल-खारिज यात्रा',feedback:'नागरिक अनुभव',case:'Case Tracking',grievance:'शिकायत यात्रा',research:'Research Dashboard',reports:'Reports / Reform',admin:'Admin / Data'};document.title=`${labels[tab]||'Transparency Indicator'} | Transparency Indicator`;},[tab]);
 const go=x=>{if(!validPageIds.has(x))return;setTab(x);setMobile(false);if(readPageFromHash()!==x)window.location.hash='/'+x;window.scrollTo({top:0,behavior:'auto'})};
 return <div className="app"><header><div className="brand" onClick={()=>go('home')}><div className="logo">TI</div><div><b>Transparency Indicator</b><span>जनता की आवाज़ • जवाबदेही का आधार</span></div></div><button className="menu" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button><nav className={mobile?'open':''}>{nav.map(([id,label,Icon])=><button className={tab===id?'active':''} onClick={()=>go(id)} key={id}><Icon size={16}/>{label}</button>)}</nav><button className="cta" onClick={()=>go('feedback')}>अनुभव दर्ज करें <ArrowRight size={16}/></button></header>
 {tab==='home'&&<HomePage go={go} districts={districts} setSelected={setSelected}/>} {tab==='districts'&&<DistrictsPage districts={districts} selected={selected} setSelected={setSelected}/>} {tab==='law'&&<LegalRulesPage/>} {tab==='rights'&&<RightsPage/>} {tab==='process'&&<ProcessPage/>} {tab==='feedback'&&<CitizenHelpPage districts={districts} onCreated={id=>{setCaseId(id);go('case')}}/>} {tab==='case'&&<CaseTrackingPage initial={caseId}/>} {tab==='grievance'&&<GrievancePage/>} {tab==='research'&&<ResearchPage/>} {tab==='reports'&&<ReportsPage/>} {tab==='admin'&&<AdminPage/>}
 <footer><div><b>TRANSPARENCY INDICATOR</b><p>जनता की आवाज़ • जवाबदेही का आधार</p><small>पहली पहल: भूमि अधिकार एवं पारदर्शिता अभियान — बिहार</small></div><span>निष्पक्ष • तथ्य-आधारित • नागरिक-केंद्रित • कोई evidence/file upload नहीं</span></footer></div>}
