import { Star, MessageCircle, ShieldCheck } from 'lucide-react';

const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=Anjanay+Heights+Noida';

export default function ReviewGrowth() {
  return (
    <section id="reviews" className="py-16 bg-[#F9F9F7] border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.3fr_.7fr] gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 text-[#C2A36B] text-[10px] font-bold uppercase tracking-widest">
              <Star size={14} /> Customer Reviews
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-serif text-[#1A365D]">Help future buyers choose with confidence</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600">If Anjanay Heights helped you with a property search, site visit, buying, selling or investment decision, please share your genuine experience on Google. Honest feedback helps local buyers find the right consultant.</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#C2A36B]" /> Genuine customers only</span>
              <span className="inline-flex items-center gap-2"><MessageCircle size={15} className="text-[#C2A36B]" /> No incentives for reviews</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex gap-1 text-[#C2A36B]" aria-label="5 star review prompt">
              {[1,2,3,4,5].map((n) => <Star key={n} size={20} fill="currentColor" />)}
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#1A365D]">Have you worked with us?</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">Tell Google what your actual experience was. We value both positive and constructive feedback.</p>
            <a href={GOOGLE_SEARCH_URL} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#1A365D] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#2D3748]">Write a genuine Google review</a>
          </div>
        </div>
      </div>
    </section>
  );
}
