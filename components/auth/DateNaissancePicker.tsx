'use client';

import { useState, Fragment } from 'react';

type Props = {
  value:    string;
  onChange: (val: string) => void;
};

const MONTHS_FR    = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const DAYS_FR      = ['L','M','M','J','V','S','D'];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function calcAge(y: number, m: number, d: number) {
  const now = new Date();
  let a = now.getFullYear() - y;
  if (now.getMonth() < m || (now.getMonth() === m && now.getDate() < d)) a--;
  return a;
}

type Step = 0 | 1 | 2 | 3;

export default function DateNaissancePicker({ value, onChange }: Props) {
  const TODAY    = new Date();
  const CUR_YEAR = TODAY.getFullYear();

  const [step,     setStep]     = useState<Step>(0);
  const [year,     setYear]     = useState<number | null>(null);
  const [month,    setMonth]    = useState<number | null>(null);
  const [day,      setDay]      = useState<number | null>(null);
  const [yearPage, setYearPage] = useState(0);

  /* ── helpers ─────────────────────────────────────────── */

  function getYearsPage(page: number) {
    const end = CUR_YEAR - page * 16;
    const arr: number[] = [];
    for (let y = end; y >= end - 15; y--) arr.push(y);
    return arr;
  }

  function reset() {
    setStep(0); setYear(null); setMonth(null); setDay(null); setYearPage(0);
    onChange('');
  }

  function selectYear(y: number) { setYear(y); setMonth(null); setDay(null); setStep(1); }
  function selectMonth(m: number) { setMonth(m); setDay(null); setStep(2); }
  function selectDay(d: number) {
    setDay(d);
    setStep(3);
    const iso = `${year}-${String((month ?? 0) + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    onChange(iso);
  }

  /* ── shared classes ──────────────────────────────────── */

  const cardCls   = 'bg-white border border-zinc-100 rounded-2xl overflow-hidden';
  const headCls   = 'flex items-center justify-between px-4 py-3 border-b border-zinc-100';
  const navBtnCls = 'w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-50 transition-colors';
  const gridBtnBase = 'rounded-xl border border-zinc-100 text-sm text-zinc-700 hover:bg-zinc-50 transition-all py-2';
  const selectedBtnCls = '!bg-emerald-500 !border-emerald-500 !text-white font-medium';

  /* ── Step bar ────────────────────────────────────────── */

  const StepBar = () => (
    <div className="flex items-center mb-6">
      {[0,1,2].map((i) => (
        <Fragment key={i}>
          <button
            onClick={() => { if (i < step) setStep(i as Step); }}
            className={[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-[1.5px] flex-shrink-0 transition-all',
              i < step  ? 'bg-emerald-50 border-emerald-400 text-emerald-700 cursor-pointer'
              : i === step ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'bg-white border-zinc-200 text-zinc-400',
            ].join(' ')}
          >
            {i < step ? '✓' : i + 1}
          </button>
          {i < 2 && (
            <div className={`flex-1 h-px transition-colors ${i < step ? 'bg-emerald-400' : 'bg-zinc-200'}`} />
          )}
        </Fragment>
      ))}
    </div>
  );

  const SummaryPill = () => {
    if (step === 0) return null;
    const parts = [year, month !== null ? MONTHS_SHORT[month] : null, day].filter(Boolean);
    return (
      <button
        onClick={() => setStep(0)}
        className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-medium mb-4"
      >
        ✏ {parts.join(' · ')}
      </button>
    );
  };

  /* ── Step 0 — Année ──────────────────────────────────── */

  const YearStep = () => {
    const years = getYearsPage(yearPage);
    return (
      <div className={cardCls}>
        <div className={headCls}>
          <button className={navBtnCls} onClick={() => setYearPage(p => p + 1)} disabled={years[years.length-1] <= 1900}>‹</button>
          <span className="text-sm font-medium text-zinc-700">{years[years.length-1]} – {years[0]}</span>
          <button className={navBtnCls} onClick={() => setYearPage(p => p - 1)} disabled={yearPage === 0}>›</button>
        </div>
        <div className="grid grid-cols-4 gap-1.5 p-3">
          {years.map(y => (
            <button
              key={y}
              onClick={() => selectYear(y)}
              disabled={y > CUR_YEAR}
              className={`${gridBtnBase} ${y === year ? selectedBtnCls : ''} disabled:opacity-25`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    );
  };

  /* ── Step 1 — Mois ───────────────────────────────────── */

  const MonthStep = () => (
    <div className={cardCls}>
      <div className={headCls}>
        <span className="text-sm font-medium text-zinc-700">{year}</span>
        <button className={navBtnCls} onClick={() => setStep(0)}>✏</button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-3">
        {MONTHS_FR.map((m, i) => {
          const futureMonth = year === CUR_YEAR && i > TODAY.getMonth();
          return (
            <button
              key={m}
              onClick={() => selectMonth(i)}
              disabled={futureMonth}
              className={`${gridBtnBase} ${i === month ? selectedBtnCls : ''} disabled:opacity-25`}
            >
              {MONTHS_SHORT[i]}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ── Step 2 — Jour ───────────────────────────────────── */

  const DayStep = () => {
    const y     = year!;
    const m     = month!;
    const total = daysInMonth(y, m);
    const first = firstDayOfMonth(y, m);
    const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({length: total}, (_,i) => i+1)];

    return (
      <div className={cardCls}>
        <div className={headCls}>
          <span className="text-sm font-medium text-zinc-700">{MONTHS_FR[m]} {y}</span>
          <button className={navBtnCls} onClick={() => setStep(1)}>✏</button>
        </div>
        <div className="grid grid-cols-7 px-3 pt-2 pb-1">
          {DAYS_FR.map((d,i) => (
            <div key={i} className="text-center text-[11px] font-medium text-zinc-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const isToday   = y === CUR_YEAR && m === TODAY.getMonth() && d === TODAY.getDate();
            const isFuture  = new Date(y, m, d) > TODAY;
            const isSelected = d === day;
            return (
              <button
                key={i}
                onClick={() => selectDay(d)}
                disabled={isFuture}
                className={[
                  'aspect-square flex items-center justify-center rounded-full text-sm transition-all',
                  isSelected  ? 'bg-emerald-500 text-white font-medium'
                  : isToday   ? 'border-[1.5px] border-emerald-300 text-emerald-700'
                  : 'text-zinc-700 hover:bg-zinc-100',
                  isFuture    ? 'opacity-25 pointer-events-none' : '',
                ].join(' ')}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Step 3 — Résultat ───────────────────────────────── */

  const ResultStep = () => {
    const a      = calcAge(year!, month!, day!);
    const dateStr = `${String(day).padStart(2,'0')} ${MONTHS_FR[month!]} ${year}`;
    const isoStr  = `${year}-${String((month!)+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return (
      <div className={cardCls}>
        <div className="p-4 space-y-3">
          {[
            { icon: '📅', label: 'Date de naissance', val: dateStr },
            { icon: '🎂', label: 'Âge',               val: `${a} ans` },
            { icon: '🔢', label: 'Format ISO',         val: isoStr },
          ].map(({ icon, label, val }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-base flex-shrink-0">
                {icon}
              </div>
              <div>
                <div className="text-[10.5px] font-medium uppercase tracking-wide text-zinc-400">{label}</div>
                <div className="text-sm font-medium text-zinc-800 mt-0.5">{val}</div>
              </div>
            </div>
          ))}
          <button
            onClick={reset}
            className="w-full mt-2 py-2.5 text-sm text-zinc-500 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            Recommencer
          </button>
        </div>
      </div>
    );
  };

  /* ── Render ──────────────────────────────────────────── */

  const labels = ['Choisissez une année', 'Choisissez un mois', 'Choisissez un jour', ''];

  return (
    <div className="w-full max-w-sm mx-auto font-sans">
      <StepBar />
      {step < 3 && <SummaryPill />}
      {step < 3 && (
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-3">
          {labels[step]}
        </p>
      )}
      {step === 0 && <YearStep />}
      {step === 1 && <MonthStep />}
      {step === 2 && <DayStep />}
      {step === 3 && <ResultStep />}
    </div>
  );
}