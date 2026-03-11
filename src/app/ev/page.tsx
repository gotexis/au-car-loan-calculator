import Link from "next/link";
import carsData from "../../../data/cars-clean.json";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Electric Vehicles in Australia — EV Specs & Range",
  description: "Compare electric vehicles available in Australia. Range, energy consumption, and running costs from the Green Vehicle Guide.",
};

export default function EVPage() {
  const evs = (carsData.cars as any[]).filter((c) =>
    c.variants?.some((v: any) => v.fuel_type === "Pure Electric")
  ).sort((a, b) => {
    const ar = a.variants?.find((v: any) => v.electric_range_km)?.electric_range_km || 0;
    const br = b.variants?.find((v: any) => v.electric_range_km)?.electric_range_km || 0;
    return br - ar;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">⚡ Electric Vehicles in Australia</h1>
      <p className="text-base-content/70 mb-6">{evs.length} EVs with real range and efficiency data</p>

      <div className="overflow-x-auto">
        <table className="table table-zebra bg-base-100">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Range (km)</th>
              <th>Energy (Wh/km)</th>
              <th>Annual Cost</th>
              <th>Drivetrain</th>
            </tr>
          </thead>
          <tbody>
            {evs.map((car: any) => {
              const v = car.variants?.find((v: any) => v.fuel_type === "Pure Electric") || {};
              return (
                <tr key={car.id}>
                  <td>
                    <Link href={`/cars/${car.id}`} className="link link-primary font-medium">
                      {car.title}
                    </Link>
                  </td>
                  <td>{v.electric_range_km ? `${v.electric_range_km} km` : "—"}</td>
                  <td>{v.energy_whkm ? `${v.energy_whkm} Wh/km` : "—"}</td>
                  <td>{v.annual_fuel_cost || "—"}</td>
                  <td>{v.drivetrain || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
