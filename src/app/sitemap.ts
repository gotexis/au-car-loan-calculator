import carsData from "../../data/cars-clean.json";

export default function sitemap() {
  const base = "https://cars.rollersoft.com.au";
  
  const staticPages = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${base}/cars`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${base}/ev`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${base}/makes`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${base}/tools/car-loan`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  const carPages = carsData.cars.map((car: any) => ({
    url: `${base}/cars/${car.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...carPages];
}
