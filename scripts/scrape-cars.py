#!/usr/bin/env python3
"""Scrape car data from Green Vehicle Guide Australia.
Step 1: Get vehicle IDs from homepage top sellers/performers
Step 2: Scrape each vehicle's specs page
Output: data/cars.json
"""
import json, re, urllib.request, os, time

BASE = "https://www.greenvehicleguide.gov.au"
OUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cars.json")

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read().decode("utf-8", errors="replace")

def get_vehicle_ids():
    """Get vehicle IDs from homepage"""
    html = fetch(BASE)
    ids = re.findall(r'vehicleDisplayId=(\d+)', html)
    return list(set(ids))

def parse_vehicle(vid):
    """Parse a vehicle's specs page"""
    url = f"{BASE}/Vehicle/ViewMatchingVariants?vehicleDisplayId={vid}"
    html = fetch(url)
    
    # Extract title
    title_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    title = re.sub(r'<[^>]+>', '', title_m.group(1)).strip() if title_m else ""
    
    # Extract variant table rows
    variants = []
    # Look for table rows with vehicle data
    rows = re.findall(r'<tr[^>]*class="variant-row[^"]*"[^>]*>(.*?)</tr>', html, re.DOTALL)
    if not rows:
        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL)
    
    for row in rows[:5]:
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
        clean = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]
        clean = [c for c in clean if c]
        if clean and len(clean) >= 3:
            variants.append(clean)
    
    # Extract key specs from the page
    specs = {}
    # CO2
    co2_m = re.search(r'(\d+)\s*g/km', html)
    if co2_m: specs['co2_gkm'] = int(co2_m.group(1))
    
    # Fuel consumption
    fuel_m = re.search(r'(\d+\.?\d*)\s*L/100km', html)
    if fuel_m: specs['fuel_l100km'] = float(fuel_m.group(1))
    
    # Annual fuel cost
    cost_m = re.search(r'\$(\d[\d,]*)\s*(?:per year|annual)', html, re.IGNORECASE)
    if cost_m: specs['annual_fuel_cost'] = cost_m.group(1)
    
    # Electric range
    range_m = re.search(r'(\d+)\s*km.*?range', html, re.IGNORECASE)
    if range_m: specs['electric_range_km'] = int(range_m.group(1))
    
    return {
        "id": vid,
        "title": title,
        "specs": specs,
        "variants": variants[:3],
        "url": url
    }

def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    
    print("Fetching vehicle IDs from GVG homepage...")
    vids = get_vehicle_ids()
    print(f"Found {len(vids)} vehicle IDs")
    
    cars = []
    for i, vid in enumerate(vids[:25]):  # Sample: 25 cars
        print(f"  [{i+1}/{min(25,len(vids))}] Scraping vehicle {vid}...")
        try:
            car = parse_vehicle(vid)
            if car['title']:
                cars.append(car)
                print(f"    → {car['title']}")
        except Exception as e:
            print(f"    → Error: {e}")
        time.sleep(0.5)  # Be polite
    
    with open(OUT, 'w') as f:
        json.dump(cars, f, indent=2)
    
    print(f"\nSaved {len(cars)} cars to {OUT}")

if __name__ == "__main__":
    main()
