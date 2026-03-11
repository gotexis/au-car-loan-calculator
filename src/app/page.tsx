import Link from "next/link";
import carsData from "../../data/cars-clean.json";

export default function Home() {
  const evs = carsData.cars.filter((c: any) => 
    c.variants?.some((v: any) => v.fuel_type === "Pure Electric")
  );
  const popular = carsData.cars.filter((c: any) => 
    ["Toyota", "Ford", "Mazda", "Hyundai"].includes(c.make)
  );

  return (
    <div>
      <div className="hero bg-base-100 rounded-box mb-8">
        <div className="hero-content text-center py-12">
          <div>
            <h1 className="text-4xl font-bold">🚗 AU Car Hub</h1>
            <p className="py-4 text-lg max-w-2xl">
              Compare {carsData.total} cars from {carsData.makes.length} makes sold in Australia.
              Real specs, fuel costs, and emissions data from the Green Vehicle Guide.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/cars" className="btn btn-primary">Browse All Cars</Link>
              <Link href="/ev" className="btn btn-secondary">Electric Vehicles</Link>
              <Link href="/tools/car-loan" className="btn btn-accent">Loan Calculator</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">⚡ Electric Vehicles ({evs.length})</h2>
            <div className="space-y-2">
              {evs.slice(0, 5).map((car: any) => (
                <Link key={car.id} href={`/cars/${car.id}`} className="block hover:bg-base-200 p-2 rounded">
                  <span className="font-medium">{car.title}</span>
                  {car.specs?.electric_range_km && (
                    <span className="badge badge-success ml-2">{car.specs.electric_range_km}km range</span>
                  )}
                </Link>
              ))}
            </div>
            <div className="card-actions justify-end">
              <Link href="/ev" className="btn btn-sm btn-primary">View All EVs →</Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">🔥 Popular Models</h2>
            <div className="space-y-2">
              {popular.slice(0, 5).map((car: any) => (
                <Link key={car.id} href={`/cars/${car.id}`} className="block hover:bg-base-200 p-2 rounded">
                  <span className="font-medium">{car.title}</span>
                  {car.specs?.fuel_l100km && (
                    <span className="badge badge-info ml-2">{car.specs.fuel_l100km}L/100km</span>
                  )}
                </Link>
              ))}
            </div>
            <div className="card-actions justify-end">
              <Link href="/cars" className="btn btn-sm btn-primary">View All →</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Browse by Make</h2>
          <div className="flex flex-wrap gap-2">
            {carsData.makes.map((make: string) => (
              <Link key={make} href={`/makes/${make.toLowerCase()}`} className="btn btn-outline btn-sm">
                {make}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
