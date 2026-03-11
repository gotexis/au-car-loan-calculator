"use client";
import { useState, useMemo } from "react";

interface Loan {
  label: string;
  amount: number;
  rate: number;
  years: number;
  balloon: number;
}

function calcMonthly(amount: number, annualRate: number, years: number, balloon: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return (amount - balloon) / n;
  const pv = amount - balloon / Math.pow(1 + r, n);
  return (pv * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function totalInterest(monthly: number, years: number, balloon: number, amount: number) {
  return monthly * years * 12 + balloon - amount;
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function LoanCard({ loan, onRemove, idx }: { loan: Loan; onRemove?: () => void; idx: number }) {
  const monthly = calcMonthly(loan.amount, loan.rate, loan.years, loan.balloon);
  const interest = totalInterest(monthly, loan.years, loan.balloon, loan.amount);
  const total = monthly * loan.years * 12 + loan.balloon;
  const colors = ["primary", "secondary", "accent", "info"];
  const c = colors[idx % colors.length];
  return (
    <div className={`card bg-base-100 shadow-md border-t-4 border-${c}`}>
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h3 className="card-title text-lg">{loan.label || `Loan ${idx + 1}`}</h3>
          {onRemove && (
            <button className="btn btn-ghost btn-xs" onClick={onRemove}>✕</button>
          )}
        </div>
        <div className="stat p-0 mt-2">
          <div className="stat-title">Monthly Repayment</div>
          <div className={`stat-value text-${c}`}>{fmt(monthly)}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div><span className="opacity-60">Loan Amount</span><br /><strong>{fmt(loan.amount)}</strong></div>
          <div><span className="opacity-60">Interest Rate</span><br /><strong>{loan.rate}% p.a.</strong></div>
          <div><span className="opacity-60">Term</span><br /><strong>{loan.years} years</strong></div>
          <div><span className="opacity-60">Balloon</span><br /><strong>{fmt(loan.balloon)}</strong></div>
          <div><span className="opacity-60">Total Interest</span><br /><strong>{fmt(interest)}</strong></div>
          <div><span className="opacity-60">Total Cost</span><br /><strong>{fmt(total)}</strong></div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label, value, onChange, min, max, step, prefix, suffix,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; prefix?: string; suffix?: string;
}) {
  return (
    <div className="form-control">
      <label className="label"><span className="label-text font-medium">{label}</span></label>
      <label className="input input-bordered flex items-center gap-2">
        {prefix && <span className="opacity-60">{prefix}</span>}
        <input
          type="number"
          className="grow bg-transparent outline-none"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
        />
        {suffix && <span className="opacity-60">{suffix}</span>}
      </label>
    </div>
  );
}

const DEFAULT_LOAN: Loan = { label: "", amount: 35000, rate: 7.5, years: 5, balloon: 0 };

export default function Home() {
  const [loans, setLoans] = useState<Loan[]>([{ ...DEFAULT_LOAN }]);
  const [current, setCurrent] = useState(0);

  const loan = loans[current] || loans[0];

  const update = (field: keyof Loan, value: number | string) => {
    setLoans((prev) => prev.map((l, i) => (i === current ? { ...l, [field]: value } : l)));
  };

  const addLoan = () => {
    setLoans((prev) => [...prev, { ...DEFAULT_LOAN, label: `Option ${prev.length + 1}` }]);
    setCurrent(loans.length);
  };

  const removeLoan = (idx: number) => {
    if (loans.length <= 1) return;
    setLoans((prev) => prev.filter((_, i) => i !== idx));
    setCurrent((c) => (c >= idx ? Math.max(0, c - 1) : c));
  };

  // Amortisation schedule for current loan
  const schedule = useMemo(() => {
    const r = loan.rate / 100 / 12;
    const monthly = calcMonthly(loan.amount, loan.rate, loan.years, loan.balloon);
    let balance = loan.amount;
    const rows: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    const n = loan.years * 12;
    for (let m = 1; m <= n; m++) {
      const intPart = balance * r;
      let prinPart = monthly - intPart;
      if (m === n) prinPart = balance - loan.balloon;
      balance -= prinPart;
      rows.push({ month: m, payment: monthly, principal: prinPart, interest: intPart, balance: Math.max(0, balance) });
    }
    return rows;
  }, [loan]);

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">🚗 AU Car Loan Calculator</h1>
        <p className="text-lg opacity-70">
          Calculate monthly repayments, compare loan options, and estimate balloon payment savings.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Loan Details</h2>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Label</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="e.g. Dealer Finance"
                  value={loan.label}
                  onChange={(e) => update("label", e.target.value)}
                />
              </div>
              <InputField label="Loan Amount" value={loan.amount} onChange={(v) => update("amount", v)} min={0} step={1000} prefix="$" />
              <InputField label="Interest Rate" value={loan.rate} onChange={(v) => update("rate", v)} min={0} max={30} step={0.1} suffix="% p.a." />
              <InputField label="Loan Term" value={loan.years} onChange={(v) => update("years", v)} min={1} max={10} step={1} suffix="years" />
              <InputField label="Balloon Payment" value={loan.balloon} onChange={(v) => update("balloon", v)} min={0} step={500} prefix="$" />

              <div className="flex gap-2 mt-4">
                <button className="btn btn-primary flex-1" onClick={addLoan}>
                  + Compare Another
                </button>
              </div>

              {loans.length > 1 && (
                <div className="tabs tabs-boxed mt-3">
                  {loans.map((l, i) => (
                    <a key={i} className={`tab ${i === current ? "tab-active" : ""}`} onClick={() => setCurrent(i)}>
                      {l.label || `Loan ${i + 1}`}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comparison Cards */}
          <div className={`grid ${loans.length > 1 ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4`}>
            {loans.map((l, i) => (
              <LoanCard key={i} loan={l} idx={i} onRemove={loans.length > 1 ? () => removeLoan(i) : undefined} />
            ))}
          </div>

          {/* Amortisation Schedule */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Amortisation Schedule — {loan.label || "Current Loan"}</h2>
              <div className="overflow-x-auto max-h-96">
                <table className="table table-xs table-zebra">
                  <thead className="sticky top-0 bg-base-100">
                    <tr>
                      <th>Month</th>
                      <th>Payment</th>
                      <th>Principal</th>
                      <th>Interest</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((r) => (
                      <tr key={r.month}>
                        <td>{r.month}</td>
                        <td>{fmt(r.payment)}</td>
                        <td>{fmt(r.principal)}</td>
                        <td>{fmt(r.interest)}</td>
                        <td>{fmt(r.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <section className="mt-12 prose max-w-none">
        <h2>How Does an Australian Car Loan Work?</h2>
        <p>
          A car loan (also called vehicle finance or auto loan) lets you borrow money to purchase a vehicle and repay
          it in regular monthly instalments over a fixed term, typically 1–7 years. In Australia, secured car loans
          (where the vehicle is used as collateral) usually offer lower interest rates than unsecured personal loans.
        </p>
        <h3>What is a Balloon Payment?</h3>
        <p>
          A balloon payment (or residual value) is a lump sum due at the end of your loan term. It reduces your
          monthly repayments but means you&apos;ll owe a large amount at the end. This is common in novated leases and
          chattel mortgages. Use our calculator above to see how different balloon amounts affect your repayments.
        </p>
        <h3>Tips for Getting the Best Car Loan Rate in Australia</h3>
        <ul>
          <li>Compare rates from banks, credit unions, and online lenders — not just the dealer.</li>
          <li>A larger deposit reduces the amount you need to borrow and may unlock better rates.</li>
          <li>Shorter loan terms usually have lower rates but higher monthly repayments.</li>
          <li>Check your credit score before applying — a higher score means better offers.</li>
          <li>Consider whether a fixed or variable rate suits your situation.</li>
        </ul>
        <h3>Frequently Asked Questions</h3>
        <h4>What is a good car loan interest rate in Australia?</h4>
        <p>
          As of 2026, competitive secured car loan rates in Australia range from about 5.5% to 8.5% p.a. for new cars.
          Used car loans are typically 0.5–2% higher. Your actual rate depends on your credit history, loan amount, and term.
        </p>
        <h4>Should I choose a secured or unsecured car loan?</h4>
        <p>
          Secured car loans generally offer lower interest rates because the car acts as collateral. However, the lender
          can repossess the vehicle if you default. Unsecured loans don&apos;t require collateral but come with higher rates.
        </p>
      </section>

      {/* Footer */}
      <footer className="text-center mt-12 py-6 opacity-50 text-sm">
        <p>© {new Date().getFullYear()} AU Car Loan Calculator. For informational purposes only — not financial advice.</p>
      </footer>
    </main>
  );
}
