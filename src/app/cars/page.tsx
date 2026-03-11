import Link from "next/link";
import carsData from "../../../data/cars-clean.json";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Cars — Specs & Fuel Costs",
  description: `Compare ${carsData.total} cars sold in Australia. Fuel consumption, CO2 emissions, and running costs from the Green Vehicle Guide.`,
};

export default function CarsPage() {
  const cars = carsData.cars.sort((a: any, b: any) => a.make.localeCompare(b.make));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">All Cars in Australia ({carsData.total})</h1>
      <div className="overflow-x-auto">
        <table className="table table-zebra bg-base-100">
          <thead>
            <tr>
              <th>Car</th>
              <th>Fuel Type</th>
              <th>CO₂ (g/km)</th>
              <th>Fuel (L/100km)</th>
              <th>Annual Cost</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car: any) => {
              const v = car.variants?.[0] || {};
              return (
                <tr key={car.id}>
                  <td>
                    <Link href={`/cars/${car.id}`} className="link link-primary font-medium">
                      {car.title}
                    </Link>
                  </td>
                  <td>{v.fuel_type || "—"}</td>
                  <td>{car.specs?.co2_gkm ?? "—"}</td>
                  <td>{car.specs?.fuel_l100km ?? "—"}</td>
                  <td>{v.annual_fuel_cost || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
