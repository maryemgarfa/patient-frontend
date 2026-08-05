'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatbotSymptomes from './ChatbotSymptomes';

interface Props {
  onSpecialiteChoisie?: (specialite: string) => void;
}

export default function ChatbotFlottant({ onSpecialiteChoisie }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex flex-col items-end">
      {open && (
        <div className="mb-3 w-[360px] max-w-[90vw] h-[500px] max-h-[75vh] shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300">
          <ChatbotSymptomes
            onSpecialiteChoisie={(s) => {
              onSpecialiteChoisie?.(s);
              setOpen(false);
            }}
            onReset={() => {}}
          />
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl shadow-emerald-900/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}