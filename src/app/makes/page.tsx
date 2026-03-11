import Link from "next/link";
import carsData from "../../../data/cars-clean.json";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse by Make",
  description: "Browse cars sold in Australia by manufacturer. Compare specs and running costs.",
};

export default function MakesPage() {
  const makeMap: Record<string, any[]> = {};
  for (const car of carsData.cars as any[]) {
    if (car.make) {
      makeMap[car.make] = makeMap[car.make] || [];
      makeMap[car.make].push(car);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Browse by Make</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(makeMap).sort().map(([make, cars]) => (
          <div key={make} className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">{make}</h2>
              <p>{cars.length} model{cars.length > 1 ? "s" : ""}</p>
              <ul className="space-y-1">
                {cars.map((c: any) => (
                  <li key={c.id}>
                    <Link href={`/cars/${c.id}`} className="link link-primary text-sm">{c.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
