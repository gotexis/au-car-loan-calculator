#!/usr/bin/env python3
"""Scrape car data from Green Vehicle Guide Australia - V2.
Uses the API endpoints to get all makes/models, then scrapes each vehicle page.
Strategy: 
1. Get all makes via homepage select options
2. For each make, get models via POST API
3. For each make+model, submit compare form to get vehicleDisplayIds
4. Scrape each vehicle's specs page

Fallback: Iterate through vehicleDisplayId range (30000-40000)
"""
import json, re, urllib.request, os, time, sys

BASE = "https://www.greenvehicleguide.gov.au"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
OUT = os.path.join(DATA_DIR, "cars.json")
OUT_CLEAN = os.path.join(DATA_DIR, "cars-clean.json")

MAKES = {
    "Alfa Romeo": 26, "Audi": 5, "BMW": 29, "BYD": 111, "Chery": 94,
    "Citroen": 31, "Cupra": 112, "Fiat": 76, "Ford": 2, "Genesis": 105,
    "GWM": 109, "Haval": 104, "Honda": 38, "Hyundai": 39, "Isuzu": 86,
    "Jaguar": 56, "Jeep": 40, "Kia": 41, "Land Rover": 42, "LDV": 99,
    "Lexus": 57, "Mazda": 6, "Mercedes-Benz": 44, "MG": 59, "MINI": 61,
    "Mitsubishi": 45, "Nissan": 1, "Peugeot": 47, "Polestar": 110,
    "Porsche": 55, "Renault": 7, "Skoda": 80, "Subaru": 50, "Suzuki": 51,
    "Tesla": 93, "Toyota": 3, "Volkswagen": 54, "Volvo": 53,
}

def fetch(url, data=None):
    if data:
        data = data.encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/x-www-form-urlencoded"
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read().decode("utf-8", errors="replace")

def get_models(make_id, year=2025):
    """Get models for a make via the AJAX API"""
    url = f"{BASE}/Vehicle/GetNamesForSelectList"
    data = f"startYear={year}&endYear={year}&manufacturerId={make_id}&showCurrentOnly=false"
    resp = fetch(url, data)
    try:
        items = json.loads(resp)
        return [item["Value"] for item in items if item.get("Value") and item["Value"] != "-1"]
    except:
        return []

def parse_vehicle(vid):
    """Parse a vehicle's specs page"""
    url = f"{BASE}/Vehicle/ViewMatchingVariants?vehicleDisplayId={vid}"
    try:
        html = fetch(url)
    except Exception as e:
        return None
    
    if "Error" in html[:500] or len(html) < 1000:
        return None
    
    # Extract title
    title_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    title = re.sub(r'<[^>]+>', '', title_m.group(1)).strip() if title_m else ""
    if not title:
        return None
    
    specs = {}
    
    # CO2
    co2_m = re.search(r'(\d+)\s*g/km', html)
    if co2_m: specs['co2_gkm'] = int(co2_m.group(1))
    
    # Fuel consumption
    fuel_m = re.search(r'(\d+\.?\d*)\s*L/100km', html)
    if fuel_m: specs['fuel_l100km'] = float(fuel_m.group(1))
    
    # Electric range
    range_m = re.search(r'(\d+)\s*km.*?range', html, re.IGNORECASE)
    if range_m: specs['electric_range_km'] = int(range_m.group(1))
    
    # Annual fuel cost
    cost_m = re.search(r'\$(\d[\d,]*)\s*(?:per year|annual)', html, re.IGNORECASE)
    if cost_m: specs['annual_fuel_cost'] = cost_m.group(1)
    
    # Green star rating
    star_m = re.search(r'(\d+(?:\.\d+)?)\s*(?:star|★)', html, re.IGNORECASE)
    if star_m: specs['green_stars'] = float(star_m.group(1))
    
    # Extract variant names
    variant_names = re.findall(r'<td[^>]*class="[^"]*variant-name[^"]*"[^>]*>(.*?)</td>', html, re.DOTALL)
    if not variant_names:
        variant_names = re.findall(r'<h\d[^>]*>(.*?)</h\d>', html, re.DOTALL)
    variant_names = [re.sub(r'<[^>]+>', '', v).strip() for v in variant_names if v.strip()]
    
    # Fuel type detection
    fuel_types = set()
    if 'electric' in html.lower() and specs.get('co2_gkm', 999) == 0:
        fuel_types.add("Pure Electric")
    if re.search(r'hybrid', html, re.IGNORECASE):
        fuel_types.add("Hybrid")
    if re.search(r'plug-in hybrid|PHEV', html, re.IGNORECASE):
        fuel_types.add("PHEV")
    if re.search(r'diesel', html, re.IGNORECASE):
        fuel_types.add("Diesel")
    if re.search(r'petrol|unleaded', html, re.IGNORECASE):
        fuel_types.add("Petrol")
    
    # Extract make/model from title
    make = ""
    for m in MAKES:
        if m.lower() in title.lower():
            make = m
            break
    
    return {
        "id": str(vid),
        "title": title,
        "make": make,
        "specs": specs,
        "fuel_types": list(fuel_types),
        "variant_names": variant_names[:5],
        "url": url
    }

def scan_id_range(start, end, sample_size=200):
    """Scan a range of vehicleDisplayIds to find valid vehicles"""
    cars = []
    miss_streak = 0
    checked = 0
    
    for vid in range(start, end):
        if checked >= sample_size:
            break
        
        try:
            car = parse_vehicle(vid)
            if car:
                cars.append(car)
                miss_streak = 0
                print(f"  ✓ {vid}: {car['title']}")
            else:
                miss_streak += 1
        except:
            miss_streak += 1
        
        checked += 1
        if miss_streak > 30:
            print(f"  30 consecutive misses at {vid}, jumping ahead...")
            break
        
        time.sleep(0.3)
    
    return cars

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Load existing data
    existing = []
    if os.path.exists(OUT):
        try:
            existing = json.load(open(OUT))
            if isinstance(existing, dict):
                existing = []
        except:
            pass
    existing_ids = {c['id'] for c in existing}
    print(f"Existing: {len(existing)} cars")
    
    mode = sys.argv[1] if len(sys.argv) > 1 else "scan"
    
    if mode == "scan":
        # Scan recent IDs (2024-2026 models tend to be in 30000-40000 range)
        start = int(sys.argv[2]) if len(sys.argv) > 2 else 34000
        sample = int(sys.argv[3]) if len(sys.argv) > 3 else 100
        print(f"Scanning IDs from {start}, sample={sample}...")
        new_cars = scan_id_range(start, start + 5000, sample)
        
        # Merge
        for car in new_cars:
            if car['id'] not in existing_ids:
                existing.append(car)
                existing_ids.add(car['id'])
        
    elif mode == "models":
        # Get models for popular makes
        target_makes = ["Toyota", "Hyundai", "Kia", "Mazda", "Ford", "Honda", "Mitsubishi", "Nissan", "Subaru", "Volkswagen", "BMW", "Mercedes-Benz", "Tesla", "BYD", "MG"]
        for make_name in target_makes:
            make_id = MAKES.get(make_name)
            if not make_id:
                continue
            print(f"\n{make_name} (id={make_id}):")
            models = get_models(make_id, 2025)
            print(f"  Models: {', '.join(models)}")
    
    # Save raw
    with open(OUT, 'w') as f:
        json.dump(existing, f, indent=2)
    
    # Build clean version
    makes_set = sorted(set(c.get('make', '') for c in existing if c.get('make')))
    clean = {
        "total": len(existing),
        "makes": makes_set,
        "cars": sorted(existing, key=lambda c: c.get('title', ''))
    }
    with open(OUT_CLEAN, 'w') as f:
        json.dump(clean, f, indent=2)
    
    print(f"\nTotal: {len(existing)} cars, {len(makes_set)} makes")
    print(f"Saved to {OUT} and {OUT_CLEAN}")

if __name__ == "__main__":
    main()
