export const statuses=['Resolved','Partially Resolved','Under Process','Not Resolved','Appeal/Court Pending'];
export const types=['दाखिल-खारिज','जमाबंदी','परिमार्जन','सीमांकन','नक्शा','उत्तराधिकार','भूमि विवाद','अन्य'];
export const journey=[
 {stage:'आवेदन',who:'नागरिक / अधिकृत प्रक्रिया',track:'Application / Petition Number, application date, receipt'},
 {stage:'Case Record',who:'Circle Office',track:'Mutation Petition Register / Case Record'},
 {stage:'जाँच',who:'Karmachari / Circle Inspector / Revenue Officer',track:'Enquiry report, recommendation, enquiry date'},
 {stage:'Notice / Objection',who:'Circle Officer',track:'Notice date, objection date, last date'},
 {stage:'Hearing',who:'Circle Officer',track:'Hearing date, parties heard, order-sheet'},
 {stage:'Order',who:'Circle Officer',track:'Order number/date, decision, reasons'},
 {stage:'Record Update',who:'Karmachari / Circle Office',track:'Correction Slip, Continuous Khatian, Tenant Ledger, Khesra/Jamabandi update'},
 {stage:'Appeal / Revision',who:'DCLR → Collector/Additional Collector',track:'Appeal/revision number, filing date, order date'}
];
async function api(path,options={}){if(!API){const method=(options.method||'GET').toUpperCase();if(method==='GET'&&path==='/districts')return staticDistricts();let m;if(method==='GET'&&path.startsWith('/districts/')&&path.endsWith('/subdivisions'))return staticSubs(path.split('/')[2]);if(method==='GET'&&path.startsWith('/subdivisions/')&&path.endsWith('/circles'))return staticCircles(path.split('/')[2]);if(method==='GET'&&path==='/dashboard')return {totals:{cases:0,districts:0,resolved:0},byDistrict:[]};throw new Error('यह सुविधा चलाने के लिए backend API configure करना आवश्यक है। अभी GitHub Pages पर केवल आधिकारिक master data और सार्वजनिक कानूनी जानकारी उपलब्ध है।')}const r=await fetch(API+path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const j=await r.json();if(!r.ok)throw new Error(j.error||'Request failed');return j}
