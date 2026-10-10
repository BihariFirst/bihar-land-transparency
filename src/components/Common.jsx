import React from 'react';
import {ArrowRight} from 'lucide-react';
export function Metric({n,l}){return <div><strong>{n}</strong><span>{l}</span></div>}
export function Info({icon,n,t,d}){return <article className="info"><div className="icon">{icon}</div><small>{n}</small><h3>{t}</h3><p>{d}</p><ArrowRight size={17}/></article>}
export function Field({label,children,required}){return <label className="field"><span>{label}{required?' *':''}</span>{children}</label>}
export function Stat({n,t}){return <div className="stat"><strong>{n}</strong><span>{t}</span></div>}
