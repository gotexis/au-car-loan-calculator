#!/usr/bin/env python3
"""Parse raw GVG scraped data into clean structured format for the car hub."""
import json, re, os

RAW = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cars.json")
OUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cars-clean.json")

def parse_variant_text(text):
    """Extract structured data from variant text blob"""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    result = {}
    
    # Body type
    for l in lines:
        if 'door' in l and 'seat' in l:
            result['body'] = l
        elif l in ('Pure Electric', 'Petrol', 'Diesel', 'Hybrid (Petrol)', 'Hybrid (Diesel)', 'Plug-in Hybrid (Petrol)'):
            result['fuel_type'] = l
        elif 'spd' in l and ('Auto' in l or 'Manual' in l):
            result['transmission'] = l
        elif l in ('FWD', 'RWD', '4WD', 'AWD'):
            result['drivetrain'] = l
        elif l.startswith('$') and not result.get('annual_fuel_cost'):
            result['annual_fuel_cost'] = l
        elif l == 'Pure EV':
            result['emissions_standard'] = 'Pure EV'
    
    # Energy consumption (Wh/km) - typically 3 digit number for EVs
    nums = re.findall(r'^\d+$', '\n'.join(lines), re.MULTILINE)
    for n in nums:
        v = int(n)
        if 100 <= v <= 300 and 'energy_whkm' not in result:
            result['energy_whkm'] = v
        elif 300 <= v <= 900 and 'electric_range_km' not in result:
            result['electric_range_km'] = v
    
    return result

def extract_variant_names(text):
    """Extract variant names from the Choose dropdown"""
    names = re.findall(r'([\w\s]+(?:AWD|RWD|FWD|4WD)?[\w\s]*\(released \d{4}\))', text)
    return [n.strip() for n in names]

def clean_car(car):
    """Clean a car entry"""
    result = {
        "id": car["id"],
        "title": car["title"],
        "specs": car["specs"],
        "url": car["url"]
    }
    
    # Parse variants
    variants = []
    if car.get("variants"):
        for v_data in car["variants"]:
            if isinstance(v_data, list):
                for text in v_data:
                    # Extract variant names
                    names = extract_variant_names(text)
                    if names:
                        result["variant_names"] = names
                    # Extract specs from variant blocks
                    parsed = parse_variant_text(text)
                    if parsed and (parsed.get('fuel_type') or parsed.get('body')):
                        variants.append(parsed)
    
    # Deduplicate and take first unique variant
    seen = set()
    unique = []
    for v in variants:
        key = v.get('fuel_type', '') + v.get('drivetrain', '')
        if key not in seen:
            seen.add(key)
            unique.append(v)
    result["variants"] = unique[:3]
    
    return result

def main():
    with open(RAW) as f:
        raw = json.load(f)
    
    clean = [clean_car(c) for c in raw]
    
    # Group by make
    makes = {}
    for c in clean:
        parts = c["title"].split()
        if len(parts) >= 2:
            year = parts[0] if parts[0].isdigit() else ""
            make = parts[1] if year else parts[0]
            c["year"] = int(year) if year else None
            c["make"] = make
            c["model"] = " ".join(parts[2:]) if year else " ".join(parts[1:])
            makes.setdefault(make, []).append(c)
    
    output = {
        "total": len(clean),
        "makes": sorted(makes.keys()),
        "cars": clean
    }
    
    with open(OUT, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"Cleaned {len(clean)} cars, {len(makes)} makes → {OUT}")
    for make, cars in sorted(makes.items()):
        print(f"  {make}: {len(cars)} models")

if __name__ == "__main__":
    main()
