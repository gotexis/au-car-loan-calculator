#!/usr/bin/env python3
"""Scrape car data from Green Vehicle Guide Australia - V3.
Correctly parses the cell-based data table.
Column order: body, engine, trans, drive, co2_comb, co2_urban, co2_extra,
              annual_cost, fuel_comb, fuel_urban, fuel_extra, energy_whkm,
              range_km, emission_std, annual_co2_tonnes, lifecycle_co2, noise, test
"""
import json, re, urllib.request, os, time, sys

BASE = "https://www.greenvehicleguide.gov.au"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
OUT = os.path.join(DATA_DIR, "cars.json")
OUT_CLEAN = os.path.join(DATA_DIR, "cars-clean.json")

MAKES_MAP = {
    "Alfa Romeo": 26, "Audi": 5, "BMW": 29, "BYD": 111, "Chery": 94,
    "Citroen": 31, "Cupra": 112, "Fiat": 76, "Ford": 2, "Genesis": 105,
    "GWM": 109, "Haval": 104, "Honda": 38, "Hyundai": 39, "Isuzu": 86,
    "Jaguar": 56, "Jeep": 40, "Kia": 41, "Land Rover": 42, "LDV": 99,
    "Lexus": 57, "Mazda": 6, "Mercedes-Benz": 44, "MG": 59, "MINI": 61,
    "Mitsubishi": 45, "Nissan": 1, "Peugeot": 47, "Polestar": 110,
    "Porsche": 55, "Renault": 7, "Skoda": 80, "Subaru": 50, "Suzuki": 51,
    "Tesla": 93, "Toyota": 3, "Volkswagen": 54, "Volvo": 53,
}

N_COLS = 18
COL_NAMES = [
    "body", "engine", "transmission", "drivetrain",
    "co2_comb_gkm", "co2_urban_gkm", "co2_extra_gkm",
    "annual_fuel_cost_aud",
    "fuel_comb_l100km", "fuel_urban_l100km", "fuel_extra_l100km",
    "energy_whkm", "range_km",
    "emission_standard", "annual_co2_tonnes", "lifecycle_co2_gkm",
    "noise", "test_cycle"
]


def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", errors="replace")


def clean_cell(text):
    text = re.sub(r'<[^>]+>', '', text)
    text = text.strip().replace('\r', '').replace('\n', ' ')
    text = re.sub(r'\s+', ' ', text)
    # Remove scale text like "[Better than average]"
    text = re.sub(r'\s*\[.*?\]', '', text)
    return text.strip()


def parse_num(val):
    val = val.replace(',', '').strip()
    if not val or val.upper() == 'N/A' or val == '-':
        return None
    m = re.match(r'^\$?([\d.]+)', val)
    return float(m.group(1)) if m else None


def parse_vehicle_page(vid):
    url = f"{BASE}/Vehicle/ViewMatchingVariants?vehicleDisplayId={vid}"
    try:
        html = fetch(url)
    except Exception:
        return None

    if len(html) < 2000:
        return None

    # Title
    title_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    title = clean_cell(title_m.group(1)) if title_m else ""
    if not title or 'Individual Vehicle' in title:
        return None

    # Make/year
    parts = title.split()
    year = int(parts[0]) if parts and parts[0].isdigit() else None
    remaining = ' '.join(parts[1:]) if year else title
    make = ""
    for m in sorted(MAKES_MAP.keys(), key=len, reverse=True):
        if remaining.lower().startswith(m.lower()):
            make = m
            break

    # Extract cells
    cells = re.findall(r'<div class="cell[^"]*">(.*?)</div>', html, re.DOTALL)
    cells = [clean_cell(c) for c in cells]

    # Find header row
    header_start = None
    for i, c in enumerate(cells):
        if c == 'Body' and i > 5:
            header_start = i
            break
    if header_start is None:
        return None

    data_start = header_start + N_COLS
    data_cells = cells[data_start:]

    variants = []
    for vi in range(len(data_cells) // N_COLS):
        chunk = data_cells[vi * N_COLS:(vi + 1) * N_COLS]
        if not chunk[0]:  # empty body = not a real variant
            continue
        v = dict(zip(COL_NAMES, chunk))
        variants.append(v)

    if not variants:
        return None

    # Build specs from first variant
    v0 = variants[0]
    specs = {}
    for key, src in [
        ("co2_gkm", "co2_comb_gkm"),
        ("fuel_l100km", "fuel_comb_l100km"),
        ("annual_fuel_cost_aud", "annual_fuel_cost_aud"),
        ("energy_whkm", "energy_whkm"),
        ("electric_range_km", "range_km"),
        ("annual_co2_tonnes", "annual_co2_tonnes"),
        ("lifecycle_co2_gkm", "lifecycle_co2_gkm"),
    ]:
        val = parse_num(v0.get(src, ""))
        if val is not None:
            specs[key] = val

    # Fuel types
    fuel_types = set()
    for v in variants:
        eng = v.get("engine", "").lower()
        if "pure electric" in eng:
            fuel_types.add("Pure Electric")
        elif "plug-in hybrid" in eng or "phev" in eng:
            fuel_types.add("PHEV")
        elif "hybrid" in eng:
            fuel_types.add("Hybrid")
        elif "diesel" in eng:
            fuel_types.add("Diesel")
        elif "petrol" in eng or "unleaded" in eng:
            fuel_types.add("Petrol")
        elif eng:
            fuel_types.add(eng.strip().rstrip(','))

    # Variant names from select dropdown
    variant_names = re.findall(r'<option[^>]*value="\d+"[^>]*>\s*([^<]+)', html)
    variant_names = [v.strip() for v in variant_names if v.strip()]

    # Clean variants for output
    clean_variants = []
    for v in variants:
        cv = {
            "body": v["body"],
            "fuel_type": v["engine"].rstrip(','),
            "transmission": v["transmission"],
            "drivetrain": v["drivetrain"],
        }
        for key, src in [
            ("fuel_l100km", "fuel_comb_l100km"),
            ("co2_gkm", "co2_comb_gkm"),
            ("annual_fuel_cost_aud", "annual_fuel_cost_aud"),
            ("energy_whkm", "energy_whkm"),
            ("electric_range_km", "range_km"),
        ]:
            val = parse_num(v.get(src, ""))
            if val is not None:
                cv[key] = val
        clean_variants.append(cv)

    return {
        "id": str(vid),
        "title": title,
        "make": make,
        "year": year,
        "specs": specs,
        "fuel_types": list(fuel_types),
        "variants": clean_variants,
        "variant_names": variant_names[:10],
        "url": url,
    }


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    existing = []
    if os.path.exists(OUT):
        try:
            data = json.load(open(OUT))
            if isinstance(data, list):
                existing = data
        except:
            pass
    existing_ids = {c['id'] for c in existing}
    print(f"Existing: {len(existing)} cars")

    mode = sys.argv[1] if len(sys.argv) > 1 else "rescrape"

    if mode == "test":
        vid = int(sys.argv[2]) if len(sys.argv) > 2 else 34411
        car = parse_vehicle_page(vid)
        if car:
            print(json.dumps(car, indent=2))
        else:
            print(f"Failed to parse {vid}")
        return

    if mode == "rescrape":
        print(f"Re-scraping {len(existing)} cars with v3 parser...")
        new_cars = []
        for i, car in enumerate(existing):
            vid = int(car['id'])
            try:
                updated = parse_vehicle_page(vid)
                if updated:
                    new_cars.append(updated)
                    f = updated['specs'].get('fuel_l100km', '-')
                    c = updated['specs'].get('co2_gkm', '-')
                    e = updated['specs'].get('energy_whkm', '-')
                    print(f"  [{i+1}/{len(existing)}] ✓ {vid}: {updated['title']} | fuel={f} co2={c} energy={e}")
                else:
                    print(f"  [{i+1}/{len(existing)}] ✗ {vid}: parse failed, keeping old")
                    new_cars.append(car)
            except Exception as ex:
                print(f"  [{i+1}/{len(existing)}] ✗ {vid}: {ex}")
                new_cars.append(car)
            time.sleep(0.4)
        existing = new_cars

    elif mode == "scan":
        start = int(sys.argv[2]) if len(sys.argv) > 2 else 34000
        count = int(sys.argv[3]) if len(sys.argv) > 3 else 200
        print(f"Scanning IDs from {start}, max {count}...")
        miss_streak = 0
        for vid in range(start, start + 5000):
            if len(existing) - len(existing_ids) >= count:
                break
            try:
                car = parse_vehicle_page(vid)
                if car:
                    if car['id'] not in existing_ids:
                        existing.append(car)
                        existing_ids.add(car['id'])
                    miss_streak = 0
                    f = car['specs'].get('fuel_l100km', '-')
                    c = car['specs'].get('co2_gkm', '-')
                    print(f"  ✓ {vid}: {car['title']} | fuel={f} co2={c}")
                else:
                    miss_streak += 1
            except Exception as ex:
                miss_streak += 1
            if miss_streak > 50:
                break
            time.sleep(0.4)

    # Save
    with open(OUT, 'w') as f:
        json.dump(existing, f, indent=2)

    makes_set = sorted(set(c.get('make', '') for c in existing if c.get('make')))
    clean = {
        "total": len(existing),
        "makes": makes_set,
        "cars": sorted(existing, key=lambda c: c.get('title', ''))
    }
    with open(OUT_CLEAN, 'w') as f:
        json.dump(clean, f, indent=2)

    print(f"\nTotal: {len(existing)} cars, {len(makes_set)} makes")

    has_fuel = sum(1 for c in existing if c.get('specs', {}).get('fuel_l100km'))
    has_co2 = sum(1 for c in existing if c.get('specs', {}).get('co2_gkm'))
    has_energy = sum(1 for c in existing if c.get('specs', {}).get('energy_whkm'))
    has_range = sum(1 for c in existing if c.get('specs', {}).get('electric_range_km'))
    print(f"Quality: fuel={has_fuel} co2={has_co2} energy={has_energy} range={has_range}")


if __name__ == "__main__":
    main()
