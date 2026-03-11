import Link from "next/link";
import carsData from "../../../../data/cars-clean.json";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props { params: Promise<{ id: string }> }

export async function generateStaticParams() {
  return carsData.cars.map((c: any) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const car = carsData.cars.find((c: any) => c.id === id);
  if (!car) return {};
  return {
    title: `${car.title} — Specs & Running Costs`,
    description: `${car.title} specifications, fuel consumption, CO2 emissions, and annual running costs. Australian Green Vehicle Guide data.`,
  };
}

export default async function CarPage({ params }: Props) {
  const { id } = await params;
  const car = carsData.cars.find((c: any) => c.id === id) as any;
  if (!car) notFound();

  const v = car.variants?.[0] || {};

  return (
    <div>
      <div className="breadcrumbs text-sm mb-4">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/makes/{car.make?.toLowerCase()}">{car.make}</Link></li>
          <li>{car.title}</li>
        </ul>
      </div>

      <h1 className="text-3xl font-bold mb-6">{car.title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Key Specs</h2>
            <div className="space-y-3">
              {v.body && <div><span className="font-medium">Body:</span> {v.body}</div>}
              {v.fuel_type && <div><span className="font-medium">Fuel Type:</span> {v.fuel_type}</div>}
              {v.transmission && <div><span className="font-medium">Transmission:</span> {v.transmission}</div>}
              {v.drivetrain && <div><span className="font-medium">Drivetrain:</span> {v.drivetrain}</div>}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Efficiency & Emissions</h2>
            <div className="stats stats-vertical shadow">
              {car.specs?.co2_gkm !== undefined && (
                <div className="stat">
                  <div className="stat-title">CO₂ Emissions</div>
                  <div className="stat-value text-lg">{car.specs.co2_gkm} g/km</div>
                </div>
              )}
              {car.specs?.fuel_l100km !== undefined && (
                <div className="stat">
                  <div className="stat-title">Fuel Consumption</div>
                  <div className="stat-value text-lg">{car.specs.fuel_l100km} L/100km</div>
                </div>
              )}
              {v.annual_fuel_cost && (
                <div className="stat">
                  <div className="stat-title">Annual Fuel Cost</div>
                  <div className="stat-value text-lg">{v.annual_fuel_cost}</div>
                </div>
              )}
              {v.electric_range_km && (
                <div className="stat">
                  <div className="stat-title">Electric Range</div>
                  <div className="stat-value text-lg">{v.electric_range_km} km</div>
                </div>
              )}
              {v.energy_whkm && (
                <div className="stat">
                  <div className="stat-title">Energy Consumption</div>
                  <div className="stat-value text-lg">{v.energy_whkm} Wh/km</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {car.variant_names && car.variant_names.length > 0 && (
        <div className="card bg-base-100 shadow-xl mt-6">
          <div className="card-body">
            <h2 className="card-title">Available Variants</h2>
            <ul className="list-disc list-inside space-y-1">
              {car.variant_names.map((name: string, i: number) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-base-content/60">
        <p>Data source: <a href={car.url} className="link" target="_blank" rel="noopener">Australian Green Vehicle Guide</a></p>
      </div>

      <div className="mt-6">
        <Link href="/tools/car-loan" className="btn btn-primary">Calculate Car Loan →</Link>
      </div>
    </div>
  );
}
