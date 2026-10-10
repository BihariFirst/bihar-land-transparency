import React,{useEffect,useState} from 'react';
import {ArrowRight,ChevronDown,ChevronRight,Menu,X} from 'lucide-react';
import {nav,validPageIds,readPageFromHash} from './navigation.js';
import logo from '../assets/images/logo.svg';
import {api} from '../services/api.js';
import {HeaderVisitorCounter} from '../components/HeaderVisitorCounter.jsx';
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

export default function App(){
 const [tab,setTab]=useState(()=>readPageFromHash());
 const [mobile,setMobile]=useState(false);
 const [openMenu,setOpenMenu]=useState('');
 const [districts,setDistricts]=useState([]);
 const [selected,setSelected]=useState('');
 const [caseId,setCaseId]=useState('');
 useEffect(()=>{api('/districts').then(setDistricts).catch(()=>setDistricts([]))},[]);
 
 useEffect(() => {
   let cancelled = false;

   api('/districts')
     .then((data) => {
       const rows = Array.isArray(data)
         ? data
         : Array.isArray(data?.districts)
           ? data.districts
           : [];

       if (!cancelled) {
         setDistricts(
           rows
             .filter((d) => d && (d.name || d.district_name))
             .map((d) => ({
               ...d,
               name: d.name || d.district_name,
             }))
         );
       }
     })
     .catch((error) => {
       console.error('District API error:', error);
       if (!cancelled) setDistricts([]);
     });

   return () => {
     cancelled = true;
   };
 }, []);
 useEffect(()=>{const syncRoute=()=>{setTab(readPageFromHash());setMobile(false);setOpenMenu('')};window.addEventListener('hashchange',syncRoute);return()=>window.removeEventListener('hashchange',syncRoute)},[]);
 useEffect(()=>{const labels={home:'होम',districts:'जिला नेटवर्क',law:'कानून 2011–वर्तमान',rights:'अधिकार / कर्तव्य',process:'दाखिल-खारिज यात्रा',feedback:'नागरिक अनुभव',case:'Case Tracking',grievance:'शिकायत यात्रा',research:'Research Dashboard',reports:'Reports / Reform',admin:'Admin / Data'};document.title=`${labels[tab]||'Transparency Indicator'} | Transparency Indicator`},[tab]);
 const go=x=>{if(!validPageIds.has(x))return;setTab(x);setMobile(false);setOpenMenu('');if(readPageFromHash()!==x)window.location.hash='/'+x;window.scrollTo({top:0,behavior:'auto'})};
 const renderMenuItem=(item)=>{
   const Icon=item.icon;
   const active=item.id===tab || item.children?.some(child=>child.id===tab);
   return <div className={`nav-item ${active?'has-active':''}`} key={item.id}>
     <div className="nav-mainline">
       <button className={`nav-link ${tab===item.id?'active':''}`} onClick={()=>go(item.id)} title={item.label}>
         {Icon&&<Icon size={16}/>}<span>{item.label}</span>
       </button>
       {item.children?.length>0&&<button className="submenu-toggle" aria-label={`${item.label} submenu`} aria-expanded={openMenu===item.id} onClick={()=>setOpenMenu(openMenu===item.id?'':item.id)}><ChevronDown size={14}/></button>}
     </div>
     {item.children?.length>0&&<div className={`submenu ${openMenu===item.id?'submenu-open':''}`}>
       {item.children.map((child,index)=><button key={`${child.id}-${index}`} className={`submenu-link ${tab===child.id?'active':''}`} onClick={()=>go(child.id)}><ChevronRight size={14}/><span>{child.label}</span></button>)}
     </div>}
   </div>
 };
 return <div className="app ti-app-shell">
   <header className="ti-site-header">
     <button className="brand" onClick={()=>go('home')} aria-label="Transparency Indicator home"><img className="brand-logo" src={logo} alt="Transparency Indicator logo"/><span className="brand-campaign">भूमि अधिकार एवं पारदर्शिता अभियान — बिहार</span></button>
     <button className="menu" aria-label={mobile?'मेनू बंद करें':'मेनू खोलें'} aria-expanded={mobile} onClick={()=>{setMobile(!mobile);setOpenMenu('')}}>{mobile?<X size={24}/>:<Menu size={24}/>}</button>
     <nav className={mobile?'open':''} aria-label="मुख्य नेविगेशन">{nav.map(renderMenuItem)}</nav>
     <div className="header-actions"><HeaderVisitorCounter /><button className="cta" onClick={()=>go('feedback')}>अनुभव दर्ज करें <ArrowRight size={16}/></button></div>
   </header>
   {tab==='home'&&<HomePage go={go} districts={districts} setSelected={setSelected}/>}
   {tab==='districts'&&<DistrictsPage districts={districts} selected={selected} setSelected={setSelected}/>}
   {tab==='law'&&<LegalRulesPage/>}{tab==='rights'&&<RightsPage/>}{tab==='process'&&<ProcessPage/>}
   {tab==='feedback'&&<CitizenHelpPage districts={districts} onCreated={id=>{setCaseId(id);go('case')}}/>}
   {tab==='case'&&<CaseTrackingPage initial={caseId}/>}{tab==='grievance'&&<GrievancePage/>}{tab==='research'&&<ResearchPage/>}{tab==='reports'&&<ReportsPage/>}{tab==='admin'&&<AdminPage/>}
   <footer className="ti-site-footer"><div><b>TRANSPARENCY INDICATOR</b><p>जनता की आवाज़ • जवाबदेही का आधार</p><small>पहली पहल: भूमि अधिकार एवं पारदर्शिता अभियान — बिहार</small></div><span>निष्पक्ष • तथ्य-आधारित • नागरिक-केंद्रित • कोई evidence/file upload नहीं</span></footer>
 </div>
}
