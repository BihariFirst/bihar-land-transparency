import React,{useEffect,useMemo,useState} from 'react';

import {ArrowRight,Activity,AlertTriangle,BarChart3,BookOpen,CheckCircle2,ChevronRight,Clock3,Database,ExternalLink,Filter,GitBranch,Landmark,LayoutDashboard,LockKeyhole,MapPinned,Menu,RefreshCw,Scale,Search,ShieldCheck,Users,X,FileText,ClipboardList} from 'lucide-react';

import {Info} from '../components/Common.jsx';

export function ReportsPage(){return <main className="page"><div className="pageTitle"><label>REPORTS & POSITIVE REFORM</label><h1>अनुभव से सुधार तक</h1><p>इस platform का लक्ष्य केवल शिकायत जमा करना नहीं, बल्कि verified patterns को positive, actionable reforms में बदलना है।</p></div><div className="cards"><Info icon={<Activity/>} n="01" t="Annual Bihar Land Governance Report" d="District-wise patterns, process delays, appeals, recurring issues और reforms का evidence-led aggregate report।"/><Info icon={<Users/>} n="02" t="Citizen feedback loop" d="क्या मिला, क्या नहीं मिला, किस stage पर issue हुआ और कौन-सा सुधार उपयोगी होगा—structured feedback।"/><Info icon={<ShieldCheck/>} n="03" t="Verification discipline" d="Allegation, document-independent structured fact, verified irregularity और final finding को अलग रखना।"/><Info icon={<GitBranch/>} n="04" t="Reform tracker" d="Recommendation → responsible level → target process → status → follow-up review।"/></div></main>}
