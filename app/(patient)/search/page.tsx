'use client';
import { useState, useEffect } from 'react';
import { Search, MapPin, Stethoscope, Star, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function PatientSearchPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ query: '', city: '' });

  useEffect(() => {
    // On récupère tous les médecins avec leurs profils
    api.get('/users/doctors-public').then(res => {
      setDoctors(res.data);
      setLoading(false);
    });
  }, []);

  const filteredDoctors = doctors.filter((doc: any) => 
    doc.specialite.toLowerCase().includes(filter.query.toLowerCase()) ||
    doc.user.nom.toLowerCase().includes(filter.query.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER DE RECHERCHE */}
      <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tight mb-2">Trouvez votre praticien</h1>
          <p className="text-emerald-100 font-medium mb-8">Réservez un rendez-vous en ligne 24h/24 et 7j/7.</p>
          
          <div className="flex flex-col md:flex-row gap-4 bg-white/10 p-2 rounded-[2rem] backdrop-blur-md border border-white/20">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-inner">
              <Stethoscope className="text-emerald-600" size={20} />
              <input 
                type="text" 
                placeholder="Spécialité ou nom du médecin..."
                className="w-full outline-none text-slate-700 font-medium placeholder:text-slate-300"
                onChange={(e) => setFilter({...filter, query: e.target.value})}
              />
            </div>
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-inner">
              <MapPin className="text-emerald-600" size={20} />
              <input 
                type="text" 
                placeholder="Ville (Tunis, Sousse...)"
                className="w-full outline-none text-slate-700 font-medium placeholder:text-slate-300"
              />
            </div>
            <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all">
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* LISTE DES RÉSULTATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 animate-pulse text-slate-400">Recherche des meilleurs médecins...</div>
        ) : filteredDoctors.map((doc: any) => (
          <div key={doc.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 text-xl font-black">
                {doc.user.prenom[0]}{doc.user.nom[0]}
              </div>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-black">
                <Star size={12} fill="currentColor" /> 4.9
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-800">Dr. {doc.user.prenom} {doc.user.nom}</h3>
            <p className="text-emerald-600 font-bold text-sm mb-4 uppercase tracking-wider">{doc.specialite}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <MapPin size={16} /> {doc.adresse || 'Tunis, Tunisie'}
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-black">
                <span className="text-slate-400 font-medium italic">Tarif:</span> {doc.prix} TND
              </div>
            </div>

            <Link href={`/patient/book/${doc.id}`} className="w-full py-4 bg-slate-50 text-slate-800 rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              Prendre RDV <ArrowRight size={18} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}