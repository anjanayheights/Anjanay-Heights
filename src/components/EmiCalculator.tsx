import { useMemo, useState } from 'react';

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function EmiCalculator() {
  const [price, setPrice] = useState(10000000);
  const [downPayment, setDownPayment] = useState(2000000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const result = useMemo(() => {
    const principal = Math.max(0, price - downPayment);
    const months = Math.max(1, years * 12);
    const monthlyRate = rate / 12 / 100;
    const emi = monthlyRate === 0
      ? principal / months
      : principal * monthlyRate * Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = emi * months;
    return { principal, emi, totalPayment, interest: Math.max(0, totalPayment - principal) };
  }, [price, downPayment, rate, years]);

  return (
    <section id="emi-calculator" className="py-16 bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-8 items-stretch">
          <div className="border-l-4 border-[#C2A36B] pl-7 py-2">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">
              Plan your purchase
            </div>
            <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] font-light">
              Home Loan EMI Calculator
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 max-w-xl">
              Estimate your monthly EMI before shortlisting a property. Use the current lender rate available to you for a closer estimate.
            </p>
            <div className="mt-6 text-xs text-gray-400">
              Indicative calculation only. Final EMI depends on lender rate, eligibility, fees and sanctioned loan amount.
            </div>
          </div>

          <div className="border border-gray-200 bg-[#F9F9F7] p-6 md:p-7">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-xs font-semibold text-[#1A365D]">
                Property price
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="mt-2 w-full border border-gray-200 bg-white px-3 py-3 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-[#1A365D]">
                Down payment
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Math.min(Number(e.target.value), price))}
                  className="mt-2 w-full border border-gray-200 bg-white px-3 py-3 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-[#1A365D]">
                Interest rate (% p.a.)
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="mt-2 w-full border border-gray-200 bg-white px-3 py-3 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-[#1A365D]">
                Tenure (years)
                <select
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="mt-2 w-full border border-gray-200 bg-white px-3 py-3 text-sm"
                >
                  {[5, 10, 15, 20, 25, 30].map((year) => <option key={year} value={year}>{year} years</option>)}
                </select>
              </label>
            </div>

            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              <div className="bg-[#1A365D] text-white p-4">
                <div className="text-[9px] uppercase tracking-widest opacity-70">Monthly EMI</div>
                <div className="mt-2 text-xl font-bold">{formatINR(result.emi)}</div>
              </div>
              <div className="bg-white border border-gray-200 p-4">
                <div className="text-[9px] uppercase tracking-widest text-gray-500">Loan amount</div>
                <div className="mt-2 text-base font-bold text-[#1A365D]">{formatINR(result.principal)}</div>
              </div>
              <div className="bg-white border border-gray-200 p-4">
                <div className="text-[9px] uppercase tracking-widest text-gray-500">Interest</div>
                <div className="mt-2 text-base font-bold text-[#1A365D]">{formatINR(result.interest)}</div>
              </div>
            </div>

            <a
              href={'https://wa.me/919289771222?text=' + encodeURIComponent(
                'Hi Anjanay Heights, I want help finding a verified property within my EMI budget. Estimated EMI: ' + formatINR(result.emi) + '. Loan amount: ' + formatINR(result.principal) + '.'
              )}
              target="_blank"
              rel="noreferrer"
              className="block mt-5 text-center bg-[#C2A36B] text-[#1A365D] py-3 text-[10px] font-bold uppercase tracking-widest"
            >
              Find Properties Within My EMI
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
