import fs from 'fs';
import path from 'path';

// Seeded pseudorandom number generator for reproducible scientific dataset
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const rand = mulberry32(42);

function randNormal(mean = 0, stdev = 1) {
  const u1 = 1 - rand();
  const u2 = 1 - rand();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdev * randStdNormal;
}

function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function generateDataset() {
  const total = 858;
  const rows: string[] = [];

  const headers = [
    'Age',
    'Number of sexual partners',
    'First sexual intercourse',
    'Num of pregnancies',
    'Smokes',
    'Smokes (years)',
    'Smokes (packs/year)',
    'Hormonal Contraceptives',
    'Hormonal Contraceptives (years)',
    'IUD',
    'IUD (years)',
    'STDs',
    'STDs (number)',
    'STDs:condylomatosis',
    'STDs:syphilis',
    'STDs:pelvic inflammatory disease',
    'STDs:genital herpes',
    'STDs:HIV',
    'STDs:HPV',
    'Dx:Cancer',
    'Dx:CIN',
    'Dx:HPV',
    'Hinselmann',
    'Schiller',
    'Citology',
    'Biopsy'
  ];

  rows.push(headers.join(','));

  for (let i = 0; i < total; i++) {
    // Age: skewed right, typical clinical screening population (18-55, median 26)
    let age = Math.round(Math.max(14, Math.min(80, 20 + Math.pow(rand(), 2.2) * 55)));
    
    // First intercourse age: typically 14 to 26
    let firstIntercourse = Math.round(Math.max(13, Math.min(age, 15 + rand() * 8)));
    
    // Number of sexual partners
    let partners: number | string = Math.round(Math.max(1, Math.min(18, 1 + Math.pow(rand(), 3) * 12)));
    
    // Number of pregnancies
    const yearsActive = Math.max(0, age - firstIntercourse);
    let pregnancies: number | string = Math.round(Math.max(0, Math.min(9, (yearsActive / 8) * (0.8 + rand() * 1.5))));
    if (rand() < 0.25) pregnancies = 0;

    // Missing values simulation ('?' appears in UCI dataset at ~2-5% frequency)
    const hasMissingPartners = rand() < 0.03;
    const hasMissingIntercourse = rand() < 0.02;
    const hasMissingPregnancies = rand() < 0.04;

    // Smoking
    const smokesBool = rand() < 0.15;
    let smokes = smokesBool ? 1 : 0;
    let smokesYears = 0;
    let smokesPacks = 0;
    if (smokesBool) {
      smokesYears = Math.min(age - 14, Math.max(0.5, +(rand() * 18).toFixed(1)));
      smokesPacks = +(0.1 + rand() * 2.8).toFixed(2);
    }

    // Hormonal Contraceptives
    const hcBool = rand() < 0.58;
    let hc = hcBool ? 1 : 0;
    let hcYears = 0;
    if (hcBool) {
      hcYears = +(Math.min(age - 16, Math.max(0.2, rand() * 12))).toFixed(1);
    }

    // IUD
    const iudBool = rand() < 0.10 && age >= 22;
    let iud = iudBool ? 1 : 0;
    let iudYears = 0;
    if (iudBool) {
      iudYears = +(rand() * 8).toFixed(1);
    }

    // STDs & HPV
    const stdsProb = 0.06 + (Number(partners) > 3 ? 0.08 : 0) + (firstIntercourse < 16 ? 0.04 : 0);
    const hasStds = rand() < stdsProb;
    let stds = hasStds ? 1 : 0;
    let stdsNum = hasStds ? (rand() < 0.8 ? 1 : 2) : 0;
    let condylomatosis = hasStds && rand() < 0.55 ? 1 : 0;
    let syphilis = hasStds && rand() < 0.15 ? 1 : 0;
    let pid = hasStds && rand() < 0.08 ? 1 : 0;
    let herpes = hasStds && rand() < 0.05 ? 1 : 0;
    let hiv = hasStds && rand() < 0.12 ? 1 : 0;
    let stdHpv = hasStds && rand() < 0.25 ? 1 : 0;

    // Diagnoses (CIN, Cancer, HPV)
    let dxHPV = (stdHpv === 1 || rand() < 0.02) ? 1 : 0;
    let dxCIN = (dxHPV === 1 && rand() < 0.35) || rand() < 0.01 ? 1 : 0;
    let dxCancer = (dxCIN === 1 && rand() < 0.4) || (dxHPV === 1 && rand() < 0.2) || (rand() < 0.008) ? 1 : 0;

    // Diagnostic tests
    // Schiller (Lugol's iodine staining test), Citology (Pap smear), Hinselmann (colposcopy)
    let biopsyRisk = 0.015;
    if (dxHPV === 1) biopsyRisk += 0.45;
    if (dxCIN === 1) biopsyRisk += 0.50;
    if (dxCancer === 1) biopsyRisk += 0.65;
    if (stds === 1) biopsyRisk += 0.12;
    if (smokes === 1 && smokesYears > 5) biopsyRisk += 0.09;
    if (hc === 1 && hcYears > 6) biopsyRisk += 0.06;
    if (firstIntercourse < 16) biopsyRisk += 0.05;
    if (Number(partners) > 4) biopsyRisk += 0.04;

    let schiller = (rand() < (biopsyRisk * 1.8 + 0.04)) ? 1 : 0;
    let citology = (rand() < (biopsyRisk * 1.4 + 0.02)) ? 1 : 0;
    let hinselmann = (rand() < (biopsyRisk * 1.3 + 0.02)) ? 1 : 0;

    // Biopsy target (gold standard histologic confirmation)
    let finalBiopsyProb = biopsyRisk * 0.75 + (schiller ? 0.35 : 0) + (citology ? 0.25 : 0);
    let biopsy = (rand() < Math.min(0.92, finalBiopsyProb)) ? 1 : 0;

    // Format row
    const row = [
      age,
      hasMissingPartners ? '?' : partners,
      hasMissingIntercourse ? '?' : firstIntercourse,
      hasMissingPregnancies ? '?' : pregnancies,
      smokes,
      smokesYears,
      smokesPacks,
      hc,
      hcYears,
      iud,
      iudYears,
      stds,
      stdsNum,
      condylomatosis,
      syphilis,
      pid,
      herpes,
      hiv,
      stdHpv,
      dxCancer,
      dxCIN,
      dxHPV,
      hinselmann,
      schiller,
      citology,
      biopsy
    ];

    rows.push(row.join(','));
  }

  const outDir = path.join(process.cwd(), 'backend', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const csvPath = path.join(outDir, 'cervical_cancer_data.csv');
  fs.writeFileSync(csvPath, rows.join('\n'), 'utf-8');
  console.log(`Generated ${rows.length - 1} records at ${csvPath}`);
}

generateDataset();
