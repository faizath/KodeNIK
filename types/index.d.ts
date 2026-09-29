/**
 * KodeNIK TypeScript Definitions
 * Official Indonesian Administrative NIK Subdivision Database
 */

export interface DistrictRecord {
    /** 2-digit zero-padded district code (e.g. "01") */
    kode_kecamatan: string;
    /** District name, may include parenthesized alternative name/alias */
    nama_kecamatan: string;
}

export interface KabKotaRecord {
    /** 2-digit zero-padded regency/city code (01-69 for Kabupaten, 71-99 for Kota) */
    kode_kabkota: string;
    /** Regency/City name prefixed with "Kab. " or "Kota " */
    nama_kabkota: string;
    /** Nested list of districts within this regency or city */
    kecamatan: DistrictRecord[];
}

export interface ProvinceRecord {
    /** 2-digit zero-padded province code (e.g. "11" through "96") */
    kode_provinsi: string;
    /** Full official province name */
    nama_provinsi: string;
    /** Nested list of regencies and cities within this province */
    kabkota: KabKotaRecord[];
}

export interface KodeNIKDatabase {
    /** Name of the database file */
    title: "KodeNIK.json";
    /** CalVer version formatted as YYYY.MM.DD */
    version: string;
    /** Database description */
    description: string;
    /** Canonical repository URL */
    URL: string;
    /** Dataset author */
    author: string;
    /** Dataset author URL */
    authorURL: string;
    /** Array containing all 38 provinces in Indonesia */
    data: ProvinceRecord[];
}

export interface FlatDistrictRecord {
    /** 2-digit zero-padded province code */
    kode_provinsi: string;
    /** Official province name */
    nama_provinsi: string;
    /** 2-digit zero-padded regency/city code */
    kode_kabkota: string;
    /** Regency/City name prefixed with "Kab. " or "Kota " */
    nama_kabkota: string;
    /** 2-digit zero-padded district code */
    kode_kecamatan: string;
    /** Official district name */
    nama_kecamatan: string;
}

export interface KodeNIKFlatDatabase {
    /** Metadata header */
    title: "KodeNIK.flat.json";
    version: string;
    description: string;
    /** Total number of districts */
    total_kecamatan: number;
    /** Key-value lookup dictionary mapping 6-digit NIK prefixes to district info */
    districts: Record<string, FlatDistrictRecord>;
}
