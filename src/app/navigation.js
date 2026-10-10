// Central navigation registry. Hash routes work on GitHub Pages without server rewrite rules.
import {LayoutDashboard,MapPinned,BookOpen,ClipboardList,Search,Scale,GitBranch,AlertTriangle,BarChart3,FileText,Database} from 'lucide-react';

export const nav = [['home','होम',LayoutDashboard],['districts','38 जिले',MapPinned],['law','कानून 2011–वर्तमान',BookOpen],['rights','अधिकार / कर्तव्य',Scale],['process','दाखिल-खारिज यात्रा',GitBranch],['feedback','नागरिक अनुभव',ClipboardList],['case','Case Tracking',Search],['grievance','शिकायत यात्रा',AlertTriangle],['research','Research Dashboard',BarChart3],['reports','Reports / Reform',FileText],['admin','Admin / Data',Database]];
export const validPageIds = new Set(nav.map(([id]) => id));
export function readPageFromHash() {
  const candidate = (window.location.hash || '#/home').replace(/^#\/?/, '').split(/[?&]/)[0];
  return validPageIds.has(candidate) ? candidate : 'home';
}
