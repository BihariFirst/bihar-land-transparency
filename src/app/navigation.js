// Central navigation tree. Hash routes work on GitHub Pages without server rewrites.
import { Home, Users, MapPinned, BookOpen, Scale, GitBranch, ClipboardList, Search, AlertTriangle, BarChart3, FileText, Database, Info } from 'lucide-react';

export const nav = [
  { id: 'home', label: 'होम', icon: Home, path: '/home', children: [] },
  { id: 'feedback', label: 'नागरिक सहायता', icon: Users, path: '/feedback', children: [
    { id: 'feedback', label: 'अनुभव दर्ज करें', path: '/feedback' },
    { id: 'case', label: 'अपना Case ID देखें', path: '/case' },
    { id: 'grievance', label: 'शिकायत की स्थिति', path: '/grievance' },
    { id: 'process', label: 'शिकायत यात्रा', path: '/process' },
    { id: 'reports', label: 'अगले कदम और सुझाव', path: '/reports' },
  ]},
  { id: 'districts', label: 'भूमि अधिकार', icon: MapPinned, path: '/districts', children: [
    { id: 'districts', label: 'जिला नेटवर्क', path: '/districts' },
    { id: 'process', label: 'दाखिल-खारिज प्रक्रिया', path: '/process' },
    { id: 'rights', label: 'अधिकार एवं कर्तव्य', path: '/rights' },
    { id: 'case', label: 'केस ट्रैकिंग', path: '/case' },
  ]},
  { id: 'law', label: 'कानून एवं नियम', icon: BookOpen, path: '/law', children: [
    { id: 'law', label: 'अधिनियम', path: '/law' },
    { id: 'rights', label: 'अधिकार एवं कर्तव्य', path: '/rights' },
    { id: 'process', label: 'नियमावली एवं प्रक्रिया', path: '/process' },
    { id: 'reports', label: 'आधिकारिक स्रोत', path: '/reports' },
  ]},
  { id: 'research', label: 'डैशबोर्ड', icon: BarChart3, path: '/research', children: [
    { id: 'research', label: 'जिला वार डेटा', path: '/research' },
    { id: 'reports', label: 'रिपोर्ट एवं सुधार', path: '/reports' },
    { id: 'districts', label: 'जिला नेटवर्क', path: '/districts' },
  ]},
  { id: 'rights', label: 'हमारे बारे में', icon: Info, path: '/rights', children: [
    { id: 'rights', label: 'हमारे सिद्धांत', path: '/rights' },
    { id: 'process', label: 'कार्यप्रणाली', path: '/process' },
    { id: 'feedback', label: 'अपना अनुभव साझा करें', path: '/feedback' },
  ]},
  { id: 'admin', label: 'एडमिन', icon: Database, path: '/admin', children: [] },
];

export const validPageIds = new Set(['home','districts','law','rights','process','feedback','case','grievance','research','reports','admin']);
export function readPageFromHash() {
  const candidate = (window.location.hash || '#/home').replace(/^#\/?/, '').split(/[?&]/)[0];
  return validPageIds.has(candidate) ? candidate : 'home';
}
