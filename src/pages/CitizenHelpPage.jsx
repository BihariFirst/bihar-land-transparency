
import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  UserRound,
  MapPin,
  Phone,
  Mail,
  GitBranch,
  ClipboardList,
  PlusCircle
} from 'lucide-react';

import { Field } from '../components/Common.jsx';
import { api } from '../services/api.js';
import { statuses, types } from '../data/constants.js';

const complaintLevels = [
  'अंचल अधिकारी (CO)',
  'भूमि सुधार उप समाहर्ता (DCLR)',
  'ADM (Revenue)',
  'जिलाधिकारी (DM)',
  'प्रमंडलीय आयुक्त',
  'राजस्व एवं भूमि सुधार विभाग',
  'विभागीय सचिव',
  'संबंधित मंत्री',
  'मुख्यमंत्री कार्यालय',
  'सरकारी शिकायत पोर्टल'
];

const emptyTimelineEntry = () => ({
  complaintNumber: '',
  complaintDate: '',
  authorityName: '',
  actionDate: '',
  status: 'शिकायत दर्ज',
  referenceNumber: '',
  remarks: ''
});

const initialTimeline = () =>
  complaintLevels.map((level, index) => ({
    level,
    levelOrder: index + 1,
    ...emptyTimelineEntry()
  }));

export function CitizenHelpPage({ districts, onCreated }) {
  const [subs, setSubs] = useState([]);
  const [circles, setCircles] = useState([]);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    guardianName: '',
    address: '',
    mobile: '',
    email: '',
    preferredContact: 'mobile',

    districtId: '',
    subdivisionId: '',
    circleId: '',

    caseNumber: '',
    caseYear: new Date().getFullYear(),
    applicationDate: '',
    orderDate: '',
    caseType: 'दाखिल-खारिज',
    status: 'Under Process',
    ruleIssue: '',

    complaintNumber: '',
    complaintDate: '',
    authority: '',
    nextAction: '',
    suggestion: ''
  });

  const set = (key, value) =>
    setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    let cancelled = false;

    if (!form.districtId) {
      setSubs([]);
      return;
    }

    api(`/districts/${form.districtId}/subdivisions`)
      .then(data => {
        if (!cancelled) {
          setSubs(Array.isArray(data) ? data : data?.subdivisions || []);
        }
      })
      .catch(() => {
        if (!cancelled) setSubs([]);
      });

    return () => {
      cancelled = true;
    };
  }, [form.districtId]);

  useEffect(() => {
    let cancelled = false;

    if (!form.subdivisionId) {
      setCircles([]);
      return;
    }

    api(`/subdivisions/${form.subdivisionId}/circles`)
      .then(data => {
        if (!cancelled) {
          setCircles(Array.isArray(data) ? data : data?.circles || []);
        }
      })
      .catch(() => {
        if (!cancelled) setCircles([]);
      });

    return () => {
      cancelled = true;
    };
  }, [form.subdivisionId]);

  const updateTimeline = (index, key, value) => {
    setTimeline(current =>
      current.map((item, i) =>
        i === index ? { ...item, [key]: value } : item
      )
    );
  };

  const addTimelineEntry = () => {
    setTimeline(current => [
      ...current,
      {
        level: 'अन्य प्राधिकरण',
        levelOrder: current.length + 1,
        ...emptyTimelineEntry()
      }
    ]);
  };

  const submit = async event => {
    event.preventDefault();
    setMsg('');

    if (!form.fullName.trim()) {
      setMsg('कृपया नागरिक का पूरा नाम दर्ज करें।');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      setMsg('कृपया 10 अंकों का सही भारतीय मोबाइल नंबर दर्ज करें।');
      return;
    }

    if (!form.districtId || !form.caseNumber.trim()) {
      setMsg('जिला और केस संख्या दर्ज करना आवश्यक है।');
      return;
    }

    setBusy(true);
    setMsg('डुप्लिकेट केस की जाँच हो रही है…');

    try {
      const duplicate = await api(
        `/cases/duplicate-check?districtId=${encodeURIComponent(form.districtId)}&caseNumber=${encodeURIComponent(form.caseNumber)}&caseYear=${encodeURIComponent(form.caseYear)}`
      );

      if (duplicate?.duplicate) {
        setMsg(
          `संभावित डुप्लिकेट केस मिला: ${
            duplicate.existing?.citizen_case_id || 'मौजूदा केस'
          }`
        );
        return;
      }

      const payload = {
        ...form,
        caseYear: Number(form.caseYear),
        complaintTimeline: timeline
          .filter(item =>
            item.complaintNumber.trim() ||
            item.complaintDate ||
            item.actionDate ||
            item.referenceNumber.trim() ||
            item.remarks.trim()
          )
          .map((item, index) => ({
            ...item,
            levelOrder: index + 1
          }))
      };

      const result = await api('/cases', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!result?.citizen_case_id) {
        throw new Error(
          'केस सेव होने की पुष्टि नहीं मिली। कृपया स्थिति जाँचें।'
        );
      }

      setMsg(`केस सफलतापूर्वक दर्ज हुआ। Citizen Case ID: ${result.citizen_case_id}`);

      if (onCreated) onCreated(result.citizen_case_id);
    } catch (error) {
      setMsg(
        error?.message ||
        'केस दर्ज नहीं हो सका। कृपया दोबारा प्रयास करें।'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <div className="pageTitle">
        <label>CITIZEN EXPERIENCE & ACCOUNTABILITY</label>
        <h1>अपना अनुभव एवं शिकायत दर्ज करें</h1>
        <p>
          नागरिक विवरण, दाखिल-खारिज केस और संबंधित अधिकारियों के समक्ष
          की गई शिकायतों का क्रमवार रिकॉर्ड दर्ज करें।
          <b> कोई PDF, फोटो, स्क्रीनशॉट या दस्तावेज़ अपलोड नहीं होगा।</b>
        </p>
      </div>

      <form className="form" onSubmit={submit}>
        <section className="formSection">
          <h2><UserRound size={19} /> 1. नागरिक का व्यक्तिगत विवरण</h2>

          <div className="formGrid">
            <Field label="पूरा नाम" required>
              <input
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                autoComplete="name"
                required
                maxLength={150}
              />
            </Field>

            <Field label="पिता / पति / अभिभावक का नाम">
              <input
                value={form.guardianName}
                onChange={e => set('guardianName', e.target.value)}
                maxLength={150}
              />
            </Field>

            <Field label="पूरा डाक पता" required>
              <textarea
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="गाँव/मोहल्ला, डाकघर, थाना, प्रखंड, जिला, पिन कोड"
                required
                maxLength={1000}
              />
            </Field>

            <Field label="मोबाइल नंबर" required>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={form.mobile}
                onChange={e =>
                  set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                placeholder="10 अंकों का मोबाइल नंबर"
                pattern="[6-9][0-9]{9}"
                required
              />
            </Field>

            <Field label="ईमेल">
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                maxLength={254}
              />
            </Field>

            <Field label="संपर्क का पसंदीदा माध्यम">
              <select
                value={form.preferredContact}
                onChange={e => set('preferredContact', e.target.value)}
              >
                <option value="mobile">मोबाइल</option>
                <option value="email">ईमेल</option>
                <option value="either">दोनों में से कोई भी</option>
              </select>
            </Field>
          </div>

          <p className="formNote">
            <ShieldCheck size={15} /> मोबाइल और ईमेल का उपयोग केवल घोषित
            संपर्क उद्देश्य के लिए करें। इन्हें सार्वजनिक रिपोर्ट में न दिखाएँ।
          </p>
        </section>

        <section className="formSection">
          <h2><MapPin size={19} /> 2. जिला एवं दाखिल-खारिज केस विवरण</h2>

          <div className="formGrid">
            <Field label="जिला" required>
              <select
                value={form.districtId}
                onChange={e => {
                  set('districtId', e.target.value);
                  set('subdivisionId', '');
                  set('circleId', '');
                }}
                required
              >
                <option value="">जिला चुनें</option>
                {districts.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="अनुमंडल">
              <select
                value={form.subdivisionId}
                disabled={!form.districtId}
                onChange={e => {
                  set('subdivisionId', e.target.value);
                  set('circleId', '');
                }}
              >
                <option value="">अनुमंडल चुनें</option>
                {subs.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="अंचल">
              <select
                value={form.circleId}
                disabled={!form.subdivisionId}
                onChange={e => set('circleId', e.target.value)}
              >
                <option value="">अंचल चुनें</option>
                {circles.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="केस संख्या" required>
              <input
                value={form.caseNumber}
                onChange={e => set('caseNumber', e.target.value)}
                required
                maxLength={100}
              />
            </Field>

            <Field label="केस वर्ष" required>
              <input
                type="number"
                min="2000"
                max="2100"
                value={form.caseYear}
                onChange={e => set('caseYear', e.target.value)}
                required
              />
            </Field>

            <Field label="आवेदन की तारीख">
              <input
                type="date"
                value={form.applicationDate}
                onChange={e => set('applicationDate', e.target.value)}
              />
            </Field>

            <Field label="आदेश की तारीख">
              <input
                type="date"
                value={form.orderDate}
                onChange={e => set('orderDate', e.target.value)}
              />
            </Field>

            <Field label="केस का प्रकार">
              <select
                value={form.caseType}
                onChange={e => set('caseType', e.target.value)}
              >
                {types.map(type => <option key={type}>{type}</option>)}
              </select>
            </Field>

            <Field label="वर्तमान स्थिति">
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                {statuses.map(status => <option key={status}>{status}</option>)}
              </select>
            </Field>

            <Field label="कथित नियम / प्रक्रिया उल्लंघन">
              <input
                value={form.ruleIssue}
                onChange={e => set('ruleIssue', e.target.value)}
                placeholder="धारा, नियम या प्रक्रिया का चरण"
                maxLength={1000}
              />
            </Field>
          </div>
        </section>

        <section className="formSection">
          <h2><GitBranch size={19} /> 3. शिकायत की पूरी यात्रा</h2>

          <p>
            प्रत्येक स्तर पर शिकायत की संख्या, दर्ज करने की तारीख, कार्रवाई
            की तारीख और वर्तमान स्थिति भरें। जहाँ शिकायत नहीं की गई है,
            वहाँ विवरण खाली छोड़ें। क्रम अपने आप शिकायत किए जाने का प्रमाण
            नहीं है।
          </p>

          <div className="complaintTimeline">
            {timeline.map((item, index) => (
              <article className="timelineEntry" key={`${item.level}-${index}`}>
                <div className="timelineHeading">
                  <span className="timelineNumber">{index + 1}</span>
                  <h3>{item.level}</h3>
                </div>

                <div className="formGrid">
                  <Field label="शिकायत / आवेदन संख्या">
                    <input
                      value={item.complaintNumber}
                      onChange={e =>
                        updateTimeline(index, 'complaintNumber', e.target.value)
                      }
                      maxLength={150}
                    />
                  </Field>

                  <Field label="शिकायत दर्ज करने की तारीख">
                    <input
                      type="date"
                      value={item.complaintDate}
                      onChange={e =>
                        updateTimeline(index, 'complaintDate', e.target.value)
                      }
                    />
                  </Field>

                  <Field label="प्राप्ति / संदर्भ संख्या">
                    <input
                      value={item.referenceNumber}
                      onChange={e =>
                        updateTimeline(index, 'referenceNumber', e.target.value)
                      }
                      maxLength={150}
                    />
                  </Field>

                  <Field label="संबंधित अधिकारी / कार्यालय">
                    <input
                      value={item.authorityName}
                      onChange={e =>
                        updateTimeline(index, 'authorityName', e.target.value)
                      }
                      placeholder={item.level}
                      maxLength={200}
                    />
                  </Field>

                  <Field label="कार्रवाई / जवाब की तारीख">
                    <input
                      type="date"
                      value={item.actionDate}
                      onChange={e =>
                        updateTimeline(index, 'actionDate', e.target.value)
                      }
                    />
                  </Field>

                  <Field label="वर्तमान स्थिति">
                    <select
                      value={item.status}
                      onChange={e =>
                        updateTimeline(index, 'status', e.target.value)
                      }
                    >
                      <option>शिकायत दर्ज</option>
                      <option>प्राप्ति की पुष्टि</option>
                      <option>विचाराधीन</option>
                      <option>जवाब प्राप्त</option>
                      <option>कार्रवाई हुई</option>
                      <option>अस्वीकृत</option>
                      <option>निस्तारित</option>
                      <option>कोई जवाब नहीं</option>
                      <option>अज्ञात</option>
                    </select>
                  </Field>

                  <Field label="कार्रवाई / जवाब का विवरण">
                    <textarea
                      value={item.remarks}
                      onChange={e =>
                        updateTimeline(index, 'remarks', e.target.value)
                      }
                      placeholder="तथ्यात्मक विवरण; कोई दस्तावेज़ अपलोड न करें"
                      maxLength={2000}
                    />
                  </Field>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="secondaryButton"
            onClick={addTimelineEntry}
          >
            <PlusCircle size={17} /> अन्य प्राधिकरण जोड़ें
          </button>
        </section>

        <section className="formSection">
          <h2><ClipboardList size={19} /> 4. अतिरिक्त शिकायत विवरण</h2>

          <div className="formGrid">
            <Field label="मुख्य शिकायत संख्या">
              <input
                value={form.complaintNumber}
                onChange={e => set('complaintNumber', e.target.value)}
              />
            </Field>

            <Field label="मुख्य शिकायत की तारीख">
              <input
                type="date"
                value={form.complaintDate}
                onChange={e => set('complaintDate', e.target.value)}
              />
            </Field>

            <Field label="वर्तमान प्राधिकरण / विभाग">
              <input
                value={form.authority}
                onChange={e => set('authority', e.target.value)}
              />
            </Field>

            <Field label="अगली अपेक्षित कार्रवाई">
              <input
                value={form.nextAction}
                onChange={e => set('nextAction', e.target.value)}
                maxLength={1000}
              />
            </Field>

            <Field label="सुझाव / अन्य तथ्य">
              <textarea
                value={form.suggestion}
                onChange={e => set('suggestion', e.target.value)}
                maxLength={3000}
              />
            </Field>
          </div>
        </section>

        <div className="formFoot">
          <span>
            <ShieldCheck size={16} />
            डुप्लिकेट केस जाँच • कोई दस्तावेज़ अपलोड नहीं
          </span>

          <button type="submit" disabled={busy}>
            {busy ? 'कृपया प्रतीक्षा करें…' : 'केस दर्ज करें'}
            <ArrowRight size={17} />
          </button>
        </div>

        {msg && (
          <div className="result" role="status" aria-live="polite">
            {msg}
          </div>
        )}
      </form>
    </main>
  );
}
