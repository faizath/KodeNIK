import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATASET_PATH = path.resolve(__dirname, '..', 'KodeNIK.json');

describe('KodeNIK Integrity Suite', () => {
    let rawContent;
    let dataset;

    test('file existence and UTF-8 encoding without BOM', () => {
        assert.ok(fs.existsSync(DATASET_PATH), 'KodeNIK.json must exist');
        const buffer = fs.readFileSync(DATASET_PATH);
        assert.ok(
            buffer[0] !== 0xef || buffer[1] !== 0xbb || buffer[2] !== 0xbf,
            'File must not contain UTF-8 BOM'
        );
        rawContent = buffer.toString('utf-8');
    });

    test('valid RFC 8259 JSON syntax', () => {
        assert.doesNotThrow(() => {
            dataset = JSON.parse(rawContent);
        }, 'KodeNIK.json must parse as valid JSON');
    });

    test('root metadata integrity', () => {
        const expectedKeys = ['title', 'version', 'description', 'URL', 'author', 'authorURL', 'data'];
        for (const key of expectedKeys) {
            assert.ok(key in dataset, `Missing top-level metadata key: ${key}`);
        }
        assert.equal(dataset.title, 'KodeNIK.json');
        assert.match(dataset.version, /^\d{4}\.\d{2}\.\d{2}$/, 'version must match CalVer YYYY.MM.DD');
        assert.match(dataset.URL, /^https?:\/\//, 'URL must be a valid HTTP(S) URL');
        assert.match(dataset.authorURL, /^https?:\/\//, 'authorURL must be a valid HTTP(S) URL');
        assert.ok(Array.isArray(dataset.data), 'data must be an array');
        assert.equal(dataset.data.length, 38, 'data array must contain 38 provinces');
    });

    test('administrative code structure, types, and global prefix uniqueness', () => {
        const twoDigitRegex = /^\d{2}$/;
        const parenthesesRegex = /\(([^)]+)\)/g;

        const provinceCodes = new Set();
        const provinceNames = new Set();
        const globalPrefixes = new Set();

        let totalKabkota = 0;
        let totalKecamatan = 0;

        for (const prov of dataset.data) {
            assert.match(prov.kode_provinsi, twoDigitRegex, `Invalid province code: ${prov.kode_provinsi}`);
            assert.equal(prov.nama_provinsi, prov.nama_provinsi.trim(), `Untrimmed province name: ${prov.nama_provinsi}`);

            assert.ok(!provinceCodes.has(prov.kode_provinsi), `Duplicate province code: ${prov.kode_provinsi}`);
            assert.ok(!provinceNames.has(prov.nama_provinsi), `Duplicate province name: ${prov.nama_provinsi}`);
            provinceCodes.add(prov.kode_provinsi);
            provinceNames.add(prov.nama_provinsi);

            assert.ok(Array.isArray(prov.kabkota) && prov.kabkota.length > 0, `Empty kabkota in ${prov.nama_provinsi}`);

            const kabkotaCodes = new Set();
            const kabkotaNames = new Set();

            for (const kab of prov.kabkota) {
                totalKabkota++;
                assert.match(kab.kode_kabkota, twoDigitRegex, `Invalid kabkota code: ${kab.kode_kabkota}`);
                assert.equal(kab.nama_kabkota, kab.nama_kabkota.trim(), `Untrimmed kabkota name: ${kab.nama_kabkota}`);

                const kabNum = parseInt(kab.kode_kabkota, 10);
                if (kab.nama_kabkota.startsWith('Kab. ')) {
                    assert.ok(kabNum < 71, `Kabupaten code must be < 71: ${kab.kode_kabkota}`);
                } else if (kab.nama_kabkota.startsWith('Kota ')) {
                    assert.ok(kabNum >= 71, `Kota code must be >= 71: ${kab.kode_kabkota}`);
                } else {
                    assert.fail(`Invalid kabkota prefix: ${kab.nama_kabkota}`);
                }

                assert.ok(!kabkotaCodes.has(kab.kode_kabkota), `Duplicate kab code: ${kab.kode_kabkota} in ${prov.nama_provinsi}`);
                assert.ok(!kabkotaNames.has(kab.nama_kabkota), `Duplicate kab name: ${kab.nama_kabkota} in ${prov.nama_provinsi}`);
                kabkotaCodes.add(kab.kode_kabkota);
                kabkotaNames.add(kab.nama_kabkota);

                assert.ok(Array.isArray(kab.kecamatan) && kab.kecamatan.length > 0, `Empty kecamatan in ${kab.nama_kabkota}`);

                const kecamatanCodes = new Set();
                const kecamatanNames = new Set();

                for (const kec of kab.kecamatan) {
                    totalKecamatan++;
                    assert.match(kec.kode_kecamatan, twoDigitRegex, `Invalid kecamatan code: ${kec.kode_kecamatan}`);
                    assert.equal(kec.nama_kecamatan, kec.nama_kecamatan.trim(), `Untrimmed kecamatan name: ${kec.nama_kecamatan}`);

                    if (kec.nama_kecamatan.includes('(') || kec.nama_kecamatan.includes(')')) {
                        const matches = [...kec.nama_kecamatan.matchAll(parenthesesRegex)];
                        assert.ok(matches.length > 0, `Unmatched parentheses in: ${kec.nama_kecamatan}`);
                        for (const m of matches) {
                            assert.ok(m[1].trim().length > 0, `Empty alias in: ${kec.nama_kecamatan}`);
                        }
                    }

                    assert.ok(!kecamatanCodes.has(kec.kode_kecamatan), `Duplicate kec code: ${kec.kode_kecamatan} in ${kab.nama_kabkota}`);
                    assert.ok(!kecamatanNames.has(kec.nama_kecamatan), `Duplicate kec name: ${kec.nama_kecamatan} in ${kab.nama_kabkota}`);
                    kecamatanCodes.add(kec.kode_kecamatan);
                    kecamatanNames.add(kec.nama_kecamatan);

                    const prefix = `${prov.kode_provinsi}${kab.kode_kabkota}${kec.kode_kecamatan}`;
                    assert.equal(prefix.length, 6, `Invalid prefix length: ${prefix}`);
                    assert.ok(!globalPrefixes.has(prefix), `Duplicate 6-digit NIK prefix: ${prefix}`);
                    globalPrefixes.add(prefix);
                }
            }
        }

        assert.equal(provinceCodes.size, 38, 'Must have 38 unique province codes');
        assert.equal(totalKabkota, 514, 'Must have 514 total regencies and cities');
        assert.equal(totalKecamatan, 7277, 'Must have 7,277 total districts');
        assert.equal(globalPrefixes.size, 7277, 'Must have 7,277 unique 6-digit prefixes');
    });
});
