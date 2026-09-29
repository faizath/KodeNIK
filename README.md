# KodeNIK

Official Indonesian Administrative National Identity Number (*Nomor Induk Kependudukan* — NIK) subdivision database.

This repository provides structured regional administrative codes for all **38 provinces**, **514 regencies/cities** (416 *Kabupaten* and 98 *Kota*), and **7,277 districts** (*Kecamatan*) across Indonesia, directly corresponding to the geographic prefix of Indonesian identity cards.

---

## Indonesian NIK Structure

The 16-digit Indonesian NIK consists of three segments:

```
[ P P ][ K K ][ C C ][ D D ][ M M ][ Y Y ][ S S S S ]
  1 2    3 4    5 6    7 8    9 10  11 12   13 14 15 16
|-- Geographic Code -|----- Date of Birth -----|-- Serial |
```

- **Digits 1–2 (`PP`)**: Province code (`kode_provinsi`), `11` through `96`.
- **Digits 3–4 (`KK`)**: Regency or City code (`kode_kabkota`):
  - `01`–`69`: *Kabupaten* (Regency)
  - `71`–`99`: *Kota* (City)
- **Digits 5–6 (`CC`)**: District code (`kode_kecamatan`), `01` through `55`.
- **Digits 7–12 (`DDMMYY`)**: Date of birth:
  - Males: day `01`–`31`.
  - Females: day $+ 40$ (`41`–`71`).
  - Month: `01`–`12`.
  - Year: 2-digit birth year `00`–`99`.
- **Digits 13–16 (`SSSS`)**: 4-digit sequential issue number.

The first 6 digits (`PPKKCC`) form the unique administrative district prefix verified by this dataset.

---

## Repository Contents

| Path | Purpose |
| :--- | :--- |
| `KodeNIK.json` | Primary 3-tier hierarchical JSON database (`Province` $\rightarrow$ `KabKota` $\rightarrow$ `Kecamatan`). |
| `KodeNIK.flat.json` | Pre-indexed key-value dictionary keyed by 6-digit NIK prefix for $O(1)$ lookups. |
| `schema/kodenik.schema.json` | JSON Schema (Draft-07) defining structure and 2-digit code regex constraints. |
| `types/index.d.ts` | Complete TypeScript type definitions. |
| `scripts/generate-flat.py` | Generator script to compile `KodeNIK.flat.json` from `KodeNIK.json`. |
| `test/test_integrity.py` | Zero-dependency Python `unittest` data integrity test suite. |
| `test/validate.test.mjs` | Zero-dependency Node.js native test runner suite (`node:test`). |
| `.github/workflows/ci.yml` | GitHub Actions automated validation workflow. |
| `LICENSE` | MIT License. |

---

## Quick Start & Usage

### 1. Lookup by 6-Digit NIK Prefix with `jq`

```bash
# Query district details for prefix 110507 (Aceh > Kab. Aceh Barat > Arongan Lambalek)
jq -r '.districts["110507"] | "\(.nama_provinsi) > \(.nama_kabkota) > \(.nama_kecamatan)"' KodeNIK.flat.json
```

### 2. Node.js / TypeScript Example

```typescript
import db from './KodeNIK.flat.json';

function resolveNik(nik: string) {
    if (!/^\d{16}$/.test(nik)) {
        throw new Error('Invalid NIK format');
    }
    const prefix = nik.slice(0, 6);
    return db.districts[prefix] ?? null;
}

console.log(resolveNik('3174070101900001'));
// {
//   kode_provinsi: "31",
//   nama_provinsi: "DKI Jakarta",
//   kode_kabkota: "74",
//   nama_kabkota: "Kota Jakarta Selatan",
//   kode_kecamatan: "07",
//   nama_kecamatan: "Kebayoran Baru"
// }
```

### 3. Python Example

```python
import json

with open("KodeNIK.flat.json", "r", encoding="utf-8") as f:
    db = json.load(f)

def lookup_nik(nik: str):
    prefix = nik[:6]
    return db["districts"].get(prefix)

print(lookup_nik("1105071508950001"))
```

---

## Development & Testing

All validation suites require zero external dependencies:

```bash
# Run Python integrity tests
python3 -m unittest discover -s test -p "test_*.py"

# Run Node.js native tests
node --test test/validate.test.mjs

# Validate JSON syntax
python3 -m json.tool KodeNIK.json > /dev/null

# Rebuild flat lookup artifact
python3 scripts/generate-flat.py
```

---

## Data Governance & Versioning

- **Scheme**: Calendar Versioning (`YYYY.MM.DD`).
- **Sources**: Indonesian Ministry of Home Affairs (*Kementerian Dalam Negeri* / Kemendagri), *Direktorat Jenderal Kependudukan dan Pencatatan Sipil* (Ditjen Dukcapil), and *Badan Pusat Statistik* (BPS).

---

## License

MIT License. Copyright (c) 2024 faizath `<github.com/faizath>`.
