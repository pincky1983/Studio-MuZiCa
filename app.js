let currentGenre = 'jazz';
let synthControl = null;
let lastScannedAbc = "";

const instrumentConfig = {
  // Clape & Acordeon
  piano: { transpose: 0, midi: 0, name: "Pian Acustic" },
  electric_piano: { transpose: 0, midi: 4, name: "Pian Electric" },
  accordion: { transpose: 0, midi: 21, name: "Acordeon" },
  organ: { transpose: 0, midi: 16, name: "Orgă Hammond" },
  harpsichord: { transpose: 0, midi: 6, name: "Clavecin" },

  // Alămuri (Brass)
  trumpet_c: { transpose: 0, midi: 56, name: "Trompetă Do" },
  trumpet_bb: { transpose: 2, midi: 56, name: "Trompetă Sib" },
  trombone: { transpose: 0, midi: 57, name: "Trombon" },
  french_horn: { transpose: 7, midi: 60, name: "Corn Francez" },
  tuba: { transpose: 0, midi: 58, name: "Tubă" },

  // Suflători din lemn (Woodwinds)
  soprano_sax: { transpose: 2, midi: 64, name: "Saxofon Sopran" },
  alto_sax: { transpose: 9, midi: 65, name: "Saxofon Alto" },
  tenor_sax: { transpose: 14, midi: 66, name: "Saxofon Tenor" },
  clarinet: { transpose: 2, midi: 71, name: "Clarinet" },
  flute: { transpose: 0, midi: 73, name: "Flaut" },
  pan_flute: { transpose: 0, midi: 75, name: "Nai" },
  oboe: { transpose: 0, midi: 68, name: "Oboi" },

  // Corzi (Strings)
  violin: { transpose: 0, midi: 40, name: "Vioară" },
  viola: { transpose: 0, midi: 41, name: "Violă" },
  cello: { transpose: 0, midi: 42, name: "Violoncel", clef: "bass" },
contrabass: { transpose: 0, midi: 32, name: "Contrabas", clef: "bass" },

  strings_ensemble: { transpose: 0, midi: 48, name: "Ansamblu Corzi" },

  // Chitare & Bas
  guitar: { transpose: 0, midi: 24, name: "Chitară Clasică" },
  steel_guitar: { transpose: 0, midi: 25, name: "Chitară Folk" },
  jazz_guitar: { transpose: 0, midi: 26, name: "Chitară Jazz" },
  clean_guitar: { transpose: 0, midi: 27, name: "Chitară Electrică" },
  acoustic_bass: { transpose: 0, midi: 32, name: "Bas Acustic", clef: "bass" },
electric_bass: { transpose: 0, midi: 33, name: "Bas Electric", clef: "bass" },

  // Percuție & Mallet
  vibraphone: { transpose: 0, midi: 11, name: "Vibrafon" },
  marimba: { transpose: 0, midi: 12, name: "Marimba" }
};

window.onload = () => {
  const savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    document.getElementById('api-key-input').value = savedKey;
  }
};

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  localStorage.setItem('gemini_api_key', key);
}

function openGenerator(genre) {
  currentGenre = genre;
  const isImprov = genre === 'improvizatie';
  document.getElementById('genre-title').innerText = isImprov ? 'IMPROVIZAȚIE SOLO' : genre.toUpperCase();
  
  const stdCtrl = document.getElementById('standard-controls');
  const impCtrl = document.getElementById('improv-controls');
  if (stdCtrl) stdCtrl.style.display = isImprov ? 'none' : 'flex';
  if (impCtrl) impCtrl.style.display = isImprov ? 'block' : 'none';

  const barsSelect = document.getElementById('bars-count');
  if (barsSelect) {
    const maxBars = isImprov ? 24 : 12;
    const defaultBars = isImprov ? 8 : 4;
    let optionsHtml = '';
    for (let i = 1; i <= maxBars; i++) {
      const label = i === 1 ? '1 Măsură' : `${i} Măsuri`;
      const selected = i === defaultBars ? ' selected' : '';
      optionsHtml += `<option value="${i}"${selected}>${label}</option>`;
    }
    barsSelect.innerHTML = optionsHtml;
  }

  switchScreen('generator-screen');
  generateMusic();
}


function openScanner() {
  switchScreen('scanner-screen');
}

function goHome() {
  if (synthControl) synthControl.pause();
  switchScreen('home-screen');
}

function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
const patterns = {
  jazz: {
    "4/4": [
      // Clasice & II-V-I
      { type: "normal", abc: "D2 F2 A2 c2 | B2 G2 F2 D2 | E2 G2 B2 d2 | c4 z4 |" },
      { type: "normal", abc: "c2 B2 A2 G2 | ^F2 G2 A2 ^A2 | B2 d2 g2 f2 | e4 z4 |" },
      { type: "normal", abc: "_E2 G2 _B2 d2 | _A2 c2 _e2 g2 | D2 F2 A2 c2 | G2 B2 d2 f2 |" },
      // Triolete & Swing
      { type: "triplets", abc: "(3D2F2A2 (3c2B2A2 | (3G2B2d2 (3f2e2d2 | (3E2G2B2 (3d2c2B2 | c4 z4 |" },
      { type: "triplets", abc: "(3cBA (3GFE D2 F2 | (3GAB (3def g2 f2 | (3edc (3BAG F2 D2 | C4 z4 |" },
      // Arpegii & Bebop
      { type: "arpeggios", abc: "D2 FA cB AG | G2 Bd fe dc | E2 GB dc BA | c2 eg c'4 |" },
      // Sincopat & Cromatisme
      { type: "syncopated", abc: "D2 z F A2 c2 | z B G2 F2 D2 | _E2 z G _B2 d2 | C4 z4 |" },
            // Slow Jazz Ballad & Coloratură Lirică
      { type: "slow_coloratura", abc: "{^F}G2 B2 d3 c | {^G}A2 F2 E2 z2 | {^c}d3 B G2 E2 | D2 {^F}A2 G4 |" },
      { type: "slow_coloratura", abc: "z2 {B}c2 B2 G2 | {^D}E3 G B2 d2 | c2 {_B}A2 {^F}G2 E2 | C6 z2 |" },
      { type: "slow_coloratura", abc: "e3 d {^c}d2 B2 | c2 A2 {^F}G4 | z2 E2 {^F}G2 B2 | d3 B G4 |" },
    ],
    "3/4": [
      { type: "normal", abc: "D2 F2 A2 | G2 B2 d2 | c2 e2 g2 | c6 |" },
      { type: "triplets", abc: "(3DFA c2 A2 | (3GBd f2 d2 | (3ceg b2 g2 | c'6 |" },
            { type: "slow_coloratura", abc: "{^F}G3 B d2 | {^G}A2 F2 E2 | D2 {^F}A2 G2 | B4 z2 |" },
      { type: "slow_coloratura", abc: "z2 {B}c2 B2 | {^D}E3 G B2 | c2 {_B}A2 G2 | C4 z2 |" },
    ],
    "2/4": [
      { type: "normal", abc: "D2 F2 | G2 B2 | c2 e2 | c4 |" },
      { type: "triplets", abc: "(3DFA (3cBA | (3GBd (3fed | (3ceg (3bag | c'4 |" },
            { type: "slow_coloratura", abc: "{^F}G2 B2 | d3 c | {^G}A2 F2 | G2 z2 |" },
      { type: "slow_coloratura", abc: "z2 {B}c2 | {^D}E3 G | c2 {_B}A2 | C4 |" },
    ],
    "6/8": [
      { type: "normal", abc: "D2F A2c | B2G F2D | E2G B2d | c6 |" },
      { type: "arpeggios", abc: "DFA cBA | GBd fed | EGB dcB | ceg c'3 |" },
            { type: "slow_coloratura", abc: "{^F}G3 B2 d | {^G}A3 F2 E | D3 {^F}A2 G | B4 z2 |" },
      { type: "slow_coloratura", abc: "z3 {B}c2 B | {^D}E3 G2 B | c3 {_B}A2 G | C4 z2 |" },
    ]
  },
  blues: {
    "4/4": [
      { type: "normal", abc: "C2 _E2 F2 ^F2 | G2 _B2 c2 _E2 | F2 _A2 B2 d2 | c4 z4 |" },
      { type: "normal", abc: "c2 _B2 G2 F2 | _E2 C2 _B,2 C2 | G2 F2 _E2 C2 | C4 z4 |" },
      // Triolete Blues Shuffle
      { type: "triplets", abc: "(3C2_E2G2 (3_B2G2_E2 | (3F2_A2c2 (3_e2c2_A2 | (3G2_B2d2 (3f2_e2c2 | C4 z4 |" },
      { type: "triplets", abc: "(3c_BG (3F_EC _B,2 C2 | (3F_Ac (3_ec_A F4 | (3G_Bd (3f_d_B G4 | C4 z4 |" },
      // Arpegii & Pasaje
      { type: "arpeggios", abc: "C_E G_B c_B G_E | F_A c_e f_e c_A | G_B df g_e c_B | c4 z4 |" },
      // Sincopat
      { type: "syncopated", abc: "C2 z _E F2 ^F2 | z G _B2 c2 _E2 | G2 z F _E2 C2 | C4 z4 |" },
            { type: "slow_coloratura", abc: "{_E}E3 G {_B}c3 G | {^F}G2 _E2 C2 z2 | F2 {_A}A3 G F_E | C4 z4 |" },
      { type: "slow_coloratura", abc: "z2 {_B}c2 _B2 G2 | {^F}G3 _E C4 | _E2 {E}F2 {^F}G2 _B2 | c4 z4 |" }

    ],
    "3/4": [
      { type: "normal", abc: "C2 _E2 F2 | ^F2 G2 _B2 | c2 _B2 G2 | C6 |" },
      { type: "triplets", abc: "(3C_EG _B2 G2 | (3F_Ac _e2 c2 | (3G_Bd f2 d2 | c6 |" },
            { type: "slow_coloratura", abc: "{_E}E3 G _B2 | {^F}G3 _E C2 | F2 {_A}A2 G_E | C4 z2 |" },
      { type: "slow_coloratura", abc: "z2 {_B}c2 _B2 | {^F}G4 _E2 | _E2 {^F}G2 _B2 | c4 z2 |" },
    ],
    "2/4": [
      { type: "normal", abc: "C2 _E2 | F2 ^F2 | G2 _B2 | c4 |" },
      { type: "triplets", abc: "(3C_EG (3_BG_E | (3F_Ac (3_ec_A | (3G_Bd (3f_d_B | c4 |" },
     { type: "slow_coloratura", abc: "{_E}E3 G _B2 | {^F}G3 _E C2 | F2 {_A}A2 G_E | C4 z2 |" },
      { type: "slow_coloratura", abc: "z2 {_B}c2 _B2 | {^F}G4 _E2 | _E2 {^F}G2 _B2 | c4 z2 |" },
            { type: "slow_coloratura", abc: "{_E}E3 G | {^F}G2 _E2 | {_B}c3 _B | G2 z2 |" },
      { type: "slow_coloratura", abc: "z2 {_B}c2 | {^F}G3 _E | F2 {_A}A2 | C4 |" },
    ],
    "6/8": [
      { type: "normal", abc: "C2_E F2^F | G2_B c2_B | G2F _E2C | C6 |" },
      { type: "arpeggios", abc: "C_EG _BG_E | F_Ac _ec_A | G_Bd fd_B | c6 |" },
            { type: "slow_coloratura", abc: "{_E}E3 G2 _B | {^F}G3 _E2 C | F3 {_A}A2 G | C4 z2 |" },
      { type: "slow_coloratura", abc: "z3 {_B}c2 _B | {^F}G3 _E3 | _E3 {^F}G2 _B | c4 z2 |" },
    ]
  },
  gospel: {
    "4/4": [
      { type: "normal", abc: "C2 D2 E2 G2 | A2 c2 d2 e2 | f2 d2 B2 G2 | c4 z4 |" },
      { type: "normal", abc: "E2 G2 c2 e2 | F2 A2 d2 f2 | ^F2 A2 c2 ^d2 | G2 B2 d2 g2 |" },
      // Triolete Gospel
      { type: "triplets", abc: "(3C2E2G2 (3c2B2A2 | (3F2A2c2 (3f2e2d2 | (3G2B2d2 (3g2f2d2 | c4 z4 |" },
      { type: "triplets", abc: "(3EGA (3cde g2 e2 | (3FAc (3def a2 f2 | (3GBd (3efg b2 g2 | c'4 z4 |" },
      // Arpegii & Passing Chords
      { type: "arpeggios", abc: "CE Gc eg c'g | FA cf ac' fa | ^FA c^d ^fa c'a | GB dg bd' g'2 |" },
      // Sincopat
      { type: "syncopated", abc: "C2 z E G2 c2 | z A F2 D2 B,2 | E2 z G c2 e2 | c4 z4 |" },
          { type: "slow_coloratura", abc: "{D}E3 G A2 c2 | {B}c2 A2 G2 E2 | F2 {G}A3 G F_E | C4 z4 |" },
    { type: "slow_coloratura", abc: "z2 G2 {B}c2 d2 | e3 d c2 A2 | G2 {^F}G2 E2 D2 | C6 z2 |" },
    ],
    "3/4": [
      { type: "normal", abc: "C2 E2 G2 | F2 A2 c2 | G2 B2 d2 | c6 |" },
      { type: "triplets", abc: "(3CEG c2 G2 | (3FAc f2 c2 | (3GBd g2 d2 | c6 |" },
          { type: "slow_coloratura", abc: "{D}E3 G A2 | {B}c2 A2 G2 | F2 {G}A2 F_E | C4 z2 |" },
    { type: "slow_coloratura", abc: "z2 G2 {B}c2 | e3 d c2 | G2 E2 D2 | C4 z2 |" },
    ],
    "2/4": [
      { type: "normal", abc: "C2 E2 | F2 A2 | G2 B2 | c4 |" },
      { type: "triplets", abc: "(3CEG (3cGE | (3FAc (3fcA | (3GBd (3gdB | c4 |" },
          { type: "slow_coloratura", abc: "{D}E2 G2 | {B}c3 A | F2 {G}A2 | G2 z2 |" },
    { type: "slow_coloratura", abc: "z2 {B}c2 | e3 d | c2 A2 | C4 |" },
    ],
    "6/8": [
      { type: "normal", abc: "C2E G2c | A2F D2F | G2B d2B | c6 |" },
      { type: "arpeggios", abc: "CEG cGE | FAc fcA | GBd gdB | ceg c'3 |" },
          { type: "slow_coloratura", abc: "{D}E3 G2 A | {B}c3 A2 G | F3 {G}A2 F | C4 z2 |" },
    { type: "slow_coloratura", abc: "z3 G2 {B}c | e3 d2 c | G3 E2 D | C4 z2 |" },
    ]
  },
    balada: {
    "4/4": [
      { type: "normal", abc: "C2 E2 G2 c2 | B2 G2 E2 B,2 | A,2 C2 E2 A2 | F2 A2 c2 d2 |" },
      { type: "normal", abc: "A2 c2 e2 a2 | F2 A2 c2 f2 | C2 E2 G2 c2 | G2 B2 d2 g2 |" },
      { type: "triplets", abc: "(3C2E2G2 (3c2G2E2 | (3A,2C2E2 (3A2E2C2 | (3F,2A,2C2 (3F2C2A,2 | (3G,2B,2D2 G4 |" },
      { type: "arpeggios", abc: "CE Gc eg c'g | A,C EA ce ac | FA cf ac' fa | GB dg bd' g'2 |" },
      { type: "syncopated", abc: "C2 z E G2 c2 | z A, C2 E2 A2 | F2 z A c2 f2 | G4 z4 |" },
          { type: "slow_coloratura", abc: "G2 {B}c3 B A2 | {^F}G2 E2 D2 z2 | E2 {G}A3 G F2 | E4 D4 |" },
    { type: "slow_coloratura", abc: "z2 E2 G2 {B}c2 | d3 c B2 G2 | A2 {B}c2 B2 G2 | c6 z2 |" },
    ],
    "3/4": [
      { type: "normal", abc: "C2 E2 G2 | A,2 C2 E2 | F2 A2 c2 | G2 B2 d2 |" },
      { type: "triplets", abc: "(3CEG c2 G2 | (3A,CE A2 E2 | (3FAc f2 c2 | G6 |" },
          { type: "slow_coloratura", abc: "G2 {B}c2 B2 | A2 {^F}G2 E2 | F2 {G}A2 F2 | E4 z2 |" },
    { type: "slow_coloratura", abc: "z2 E2 G2 | d3 c B2 | A2 B2 G2 | c4 z2 |" },
    ],
    "2/4": [
      { type: "normal", abc: "C2 G2 | A,2 E2 | F2 c2 | G2 d2 |" },
      { type: "triplets", abc: "(3CEG (3cGE | (3A,CE (3AEC | (3FAc (3fcA | G4 |" },
          { type: "slow_coloratura", abc: "G2 {B}c2 | B3 A | {^F}G2 E2 | D2 z2 |" },
    { type: "slow_coloratura", abc: "z2 {B}c2 | d3 c | B2 G2 | c4 |" },
    ],
    "6/8": [
      { type: "normal", abc: "C2E G2c | B2G E2B, | A,2C E2A | G6 |" },
      { type: "arpeggios", abc: "CEG cGE | A,CE AEC | FAc fcA | GBd gdB |" },
          { type: "slow_coloratura", abc: "G3 {B}c2 B | A3 {^F}G2 E | F3 {G}A2 F | E4 z2 |" },
    { type: "slow_coloratura", abc: "z3 E2 G | d3 c2 B | A3 B2 G | c4 z2 |" },
    ]
  },
  clasic: {
    "4/4": [
      { type: "normal", abc: "C2 E2 G2 E2 | D2 F2 A2 F2 | G2 B2 d2 B2 | c4 z4 |" },
      { type: "normal", abc: "c2 G2 E2 G2 | A2 E2 C2 E2 | F2 D2 B,2 D2 | C4 z4 |" },
      { type: "triplets", abc: "(3C2E2G2 (3c2B2A2 | (3G2F2E2 (3D2C2B,2 | (3C2E2G2 (3B2d2f2 | e4 z4 |" },
      { type: "arpeggios", abc: "CG EG CG EG | DA FA DA FA | GB dB GB dB | ce ge c4 |" },
      { type: "syncopated", abc: "c2 z G E2 G2 | z F D2 B,2 D2 | E2 z G c2 e2 | c4 z4 |" },
          // Adagio & Nocturnă Clasică (Coloratură Lirică)
    { type: "slow_coloratura", abc: "{D}E3 G {B}c2 e2 | {e}d3 c B2 G2 | {G}A2 c2 {B}A2 G2 | {^F}G4 z4 |" },
    { type: "slow_coloratura", abc: "z2 G2 {d}e3 d | {d}c3 B A2 F2 | E2 {G}c2 {E}D2 B,2 | C6 z2 |" },
    ],
    "3/4": [
      { type: "normal", abc: "C2 E2 G2 | F2 D2 B,2 | G2 B2 d2 | c6 |" },
      { type: "triplets", abc: "(3CEG (3cBA (3GFE | (3DFA (3dcB (3AGF | (3EGB (3edc (3BAG | c6 |" },
          { type: "slow_coloratura", abc: "{D}E3 G {B}c2 | {e}d3 c B2 | {G}A2 c2 B2 | {^F}G4 z2 |" },
    { type: "slow_coloratura", abc: "z2 G2 {d}e2 | {d}c3 B A2 | E2 {E}D2 B,2 | C4 z2 |" },
    ],
    "2/4": [
      { type: "normal", abc: "C2 E2 | D2 F2 | G2 B2 | c4 |" },
      { type: "arpeggios", abc: "CGEG | DAFA | GBdB | c4 |" },
          { type: "slow_coloratura", abc: "{D}E2 G2 | {B}c3 e | {e}d2 c2 | {^F}G2 z2 |" },
    { type: "slow_coloratura", abc: "z2 {d}e2 | {d}c3 B | E2 {E}D2 | C4 |" },
    ],
    "6/8": [
      { type: "normal", abc: "C2E G2E | D2F A2F | G2B d2B | c6 |" },
      { type: "arpeggios", abc: "CEG cGE | DFA dAF | GBd gdB | c6 |" },
          { type: "slow_coloratura", abc: "{D}E3 G2 {B}c | {e}d3 c2 B | {G}A3 c2 B | {^F}G4 z2 |" },
    { type: "slow_coloratura", abc: "z3 G2 {d}e | {d}c3 B2 A | E3 {E}D2 B, | C4 z2 |" },
    ]
  },
  lautaresc: {
    "4/4": [
      { type: "normal", abc: "E2 F2 ^G2 A2 | B2 c2 B2 A2 | ^G2 F2 E2 D2 | E4 z4 |" },
      { type: "normal", abc: "A2 B2 c2 d2 | e2 d2 c2 B2 | A2 ^G2 F2 E2 | E4 z4 |" },
      { type: "triplets", abc: "(3E2F2^G2 (3A2B2c2 | (3d2c2B2 (3A2^G2F2 | (3E2^G2B2 (3d2c2B2 | E4 z4 |" },
      { type: "triplets", abc: "(3e2d2c2 (3B2A2^G2 | (3A2B2c2 (3B2A2^G2 | (3F2^G2A2 (3^G2F2E2 | E4 z4 |" },
      { type: "arpeggios", abc: "EF ^GA Bc de | ed cB A^G FE | ^GA Bc dB ^GF | E4 z4 |" },
      { type: "syncopated", abc: "E2 z ^G A2 c2 | z B A2 ^G2 F2 | E2 z F ^G2 B2 | E4 z4 |" },
          // Taksîm & Coloratură Lăutărească Lentă
    { type: "slow_coloratura", abc: "{_D}E3 F {^F}G2 {_A}B2 | {_B}c2 {_A}B2 {G}_A2 F2 | {_D}E2 F2 {G}_A2 G2 | {_D}E4 z4 |" },
    { type: "slow_coloratura", abc: "z2 {^F}G2 {_A}B2 {_B}c2 | {^c}d3 {_B}c {_A}B2 {^F}G2 | F2 {_A}B2 G2 {_D}E2 | C6 z2 |" },
    ],
    "3/4": [
      { type: "normal", abc: "E2 ^G2 B2 | c2 B2 A2 | ^G2 F2 E2 | E6 |" },
      { type: "triplets", abc: "(3EF^G (3ABc B2 | (3dcB (3A^GF E2 | (3E^GB d2 c2 | E6 |" },
          { type: "slow_coloratura", abc: "{_D}E3 F {^F}G2 | {_A}B2 {G}_A2 F2 | {_D}E2 {_A}B2 G2 | {_D}E4 z2 |" },
    { type: "slow_coloratura", abc: "z2 {^F}G2 {_A}B2 | {^c}d3 {_B}c2 | {_A}B2 G2 {_D}E2 | C4 z2 |" },
    ],
    "2/4": [
      { type: "normal", abc: "E2 ^G2 | A2 c2 | B2 ^G2 | E4 |" },
      { type: "triplets", abc: "(3EF^G (3ABc | (3dcB (3A^GF | (3E^GB (3dcB | E4 |" },
          { type: "slow_coloratura", abc: "{_D}E2 F2 | {^F}G3 {_A}B | {_B}c2 {_A}B2 | G2 z2 |" },
    { type: "slow_coloratura", abc: "z2 {_A}B2 | {^c}d3 {_B}c | {_A}B2 G2 | {_D}E4 |" },
    ],
    "6/8": [
      { type: "normal", abc: "E2^G B2c | d2c B2A | ^G2F E2D | E6 |" },
      { type: "arpeggios", abc: "EF^G ABc | dcB A^GF | E^GB dcB | E6 |" },
          { type: "slow_coloratura", abc: "{_D}E3 F2 {^F}G | {_A}B3 {G}_A2 F | {_D}E3 {_A}B2 G | {_D}E4 z2 |" },
    { type: "slow_coloratura", abc: "z3 {^F}G2 {_A}B | {^c}d3 {_B}c2 | {_A}B3 G2 {_D}E | C4 z2 |" },
    ]
  },
  folclor: {
    "4/4": [
      { type: "normal", abc: "C2 D2 E2 G2 | A2 G2 E2 D2 | C2 E2 G2 A2 | G4 z4 |" },
      { type: "normal", abc: "G2 A2 B2 c2 | d2 c2 B2 A2 | G2 E2 D2 C2 | C4 z4 |" },
      { type: "triplets", abc: "(3C2D2E2 (3G2A2G2 | (3E2D2C2 (3D2E2G2 | (3A2B2c2 (3B2A2G2 | C4 z4 |" },
      { type: "triplets", abc: "(3G2A2B2 (3c2d2e2 | (3d2c2B2 (3A2G2E2 | (3D2E2G2 (3A2G2E2 | C4 z4 |" },
      { type: "arpeggios", abc: "CD EG AG ED | CE GA cA GE | GA Bc dB AG | c4 z4 |" },
      { type: "syncopated", abc: "C2 z E G2 A2 | z G E2 D2 C2 | G2 z A B2 d2 | c4 z4 |" },
          // Doină & Coloratură Folclorică Lentă
    { type: "slow_coloratura", abc: "{D}E3 G A2 {B}c2 | {A}B2 G2 E2 z2 | {^F}G3 A B2 G2 | E4 D4 |" },
    { type: "slow_coloratura", abc: "z2 E2 {G}A2 {B}c2 | {^c}d3 c B2 A2 | G2 {A}B2 G2 E2 | C6 z2 |" },
    ],
    "3/4": [
      { type: "normal", abc: "C2 E2 G2 | A2 G2 E2 | D2 E2 G2 | C6 |" },
      { type: "triplets", abc: "(3CDE G2 E2 | (3FGA c2 A2 | (3GAB d2 B2 | c6 |" },
          { type: "slow_coloratura", abc: "{D}E3 G A2 | {A}B2 G2 E2 | {^F}G2 A2 B2 | E4 z2 |" },
    { type: "slow_coloratura", abc: "z2 E2 {G}A2 | {^c}d3 c B2 | G2 {A}B2 E2 | C4 z2 |" },
    ],
    "2/4": [
      { type: "normal", abc: "C2 E2 | G2 A2 | G2 E2 | C4 |" },
      { type: "triplets", abc: "(3CDE (3GAG | (3EDC (3DEG | (3ABc (3BAG | C4 |" },
          { type: "slow_coloratura", abc: "{D}E2 G2 | {A}B3 G | {^F}G2 A2 | E2 z2 |" },
    { type: "slow_coloratura", abc: "z2 {G}A2 | {^c}d3 c | G2 E2 | C4 |" },
    ],
    "6/8": [
      { type: "normal", abc: "C2E G2A | G2E D2C | E2G A2B | c6 |" },
      { type: "arpeggios", abc: "CDE GAG | EDC DEG | ABc BAG | c6 |" },
          { type: "slow_coloratura", abc: "{D}E3 G2 A | {A}B3 G2 E | {^F}G3 A2 B | E4 z2 |" },
    { type: "slow_coloratura", abc: "z3 E2 {G}A | {^c}d3 c2 B | G3 {A}B2 E | C4 z2 |" },
    ]
  },
  sarbeasca: {
    "4/4": [
      { type: "normal", abc: "E2 ^G2 A2 B2 | c2 B2 A2 ^G2 | F2 ^G2 A2 ^G2 | F2 E2 E4 |" },
      { type: "normal", abc: "A2 c2 B2 A2 | ^G2 B2 A2 ^G2 | F2 A2 ^G2 F2 | E2 ^G2 E4 |" },
      { type: "triplets", abc: "(3E2^G2A2 (3B2c2B2 | (3A2^G2F2 (3E2F2^G2 | (3A2B2c2 (3d2c2B2 | (3A2^G2F2 E4 |" },
      { type: "triplets", abc: "(3e2d2c2 (3B2A2^G2 | (3c2B2A2 (3^G2F2E2 | (3F2^G2A2 (3B2A2^G2 | (3F2E2D2 E4 |" },
      { type: "arpeggios", abc: "E^G AB cB A^G | F^G AB cB AF | E^G Bc dc B^G | FE ^GF E4 |" },
      { type: "syncopated", abc: "E2 z ^G A2 B2 | z c B2 A2 ^G2 | F2 z ^G A2 ^G2 | F2 E2 E4 |" },
          { type: "slow_coloratura", abc: "{_D}E3 F G2 {_A}B2 | {_B}c2 {_A}B2 G2 F2 | {_D}E2 F2 {G}_A2 G2 | {_D}E4 z4 |" },
    { type: "slow_coloratura", abc: "z2 G2 {_A}B2 {_B}c2 | {^c}d3 {_B}c {_A}B2 G2 | F2 {_A}B2 G2 {_D}E2 | C6 z2 |" },
    ],
    "3/4": [
      { type: "normal", abc: "E2 ^G2 B2 | c2 B2 A2 | ^G2 F2 E2 | E6 |" },
      { type: "triplets", abc: "(3E^GB (3dcB A2 | (3^GFE (3F^GA B2 | (3cBA (3^GFE E2 | E6 |" },
          { type: "slow_coloratura", abc: "{_D}E3 F G2 | {_A}B2 G2 F2 | {_D}E2 {_A}B2 G2 | {_D}E4 z2 |" },
    { type: "slow_coloratura", abc: "z2 G2 {_A}B2 | {^c}d3 {_B}c2 | {_A}B2 G2 {_D}E2 | C4 z2 |" },
    ],
    "2/4": [
      { type: "normal", abc: "E^G AB | cB A^G | F^G A^G | FE E2 |" },
      { type: "triplets", abc: "(3E^GA (3BcB | (3A^GF (3EF^G | (3ABc (3BA^G | FE E2 |" },
      { type: "arpeggios", abc: "E^GBd | cBA^G | F^GA^G | FEE2 |" },
          { type: "slow_coloratura", abc: "{_D}E2 F2 | G3 {_A}B | {_B}c2 {_A}B2 | G2 z2 |" },
    { type: "slow_coloratura", abc: "z2 {_A}B2 | {^c}d3 {_B}c | {_A}B2 G2 | {_D}E4 |" },
    ],
    "6/8": [
      { type: "normal", abc: "E2^G A2B | c2B A2^G | F2^G A2^G | F2E E3 |" },
      { type: "arpeggios", abc: "E^GA BcB | A^GF EF^G | ABc BA^G | F2E E3 |" },
          { type: "slow_coloratura", abc: "{_D}E3 F2 G | {_A}B3 G2 F | {_D}E3 {_A}B2 G | {_D}E4 z2 |" },
    { type: "slow_coloratura", abc: "z3 G2 {_A}B | {^c}d3 {_B}c2 | {_A}B3 G2 {_D}E | C4 z2 |" },
    ]
  }
};

const keyOffsets = {
  // Game Majore
  "C": 0, "G": 7, "D": 2, "A": 9, "E": 4,
  "F": 5, "Bb": 10, "Eb": 3, "Ab": 8,
  // Game Minore (în aceeași ordine cu cele majore)
  "Cm": 0, "Gm": 7, "Dm": 2, "Am": 9, "Em": 4,
  "Fm": 5, "Bbm": 10, "Ebm": 3, "Abm": 8
};
const improvScales = {
  blues: {
    notes: ["C", "_E", "F", "^F", "G", "_B", "c", "_e", "f", "^f", "g", "_b", "c'"],
    chords: ['"Cm7"', '"Fm7"', '"Cm7"', '"G7#9"']
  },
  dorian: {
    notes: ["D", "E", "F", "G", "A", "B", "c", "d", "e", "f", "g", "a", "b", "c'"],
    chords: ['"Dm7"', '"G7"', '"Dm7"', '"Em7 A7"']
  },
  mixolydian: {
    notes: ["G", "A", "B", "c", "d", "e", "f", "g", "a", "b", "c'", "d'"],
    chords: ['"G7"', '"C7"', '"G7"', '"Dm7 G7"']
  },
  hijaz: {
    notes: ["E", "F", "^G", "A", "B", "c", "d", "e", "f", "^g", "a", "b", "c'"],
    chords: ['"E"', '"Fm"', '"E"', '"Dm E"']
  },
  harmonic_minor: {
    notes: ["A,", "B,", "C", "D", "E", "F", "^G", "A", "B", "c", "d", "e", "f", "^g", "a"],
    chords: ['"Am"', '"Dm"', '"E7"', '"Am"']
  },
  lydian: {
    notes: ["C", "D", "E", "^F", "G", "A", "B", "c", "d", "e", "^f", "g", "a", "b", "c'"],
    chords: ['"Cmaj7"', '"D/C"', '"Bm7"', '"Cmaj7"']
  }
};

function buildImprovisationAbc(barsCount, timeSig) {
  const scaleKey = document.getElementById('improv-scale')?.value || 'blues';
  const vibe = document.getElementById('improv-vibe')?.value || 'melodic';
  const scaleObj = improvScales[scaleKey] || improvScales.blues;
  const notes = scaleObj.notes;
  const chords = scaleObj.chords;

  const eighthsPerBar = timeSig === "3/4" ? 6 : (timeSig === "2/4" ? 4 : (timeSig === "6/8" ? 6 : 8));
  let idx = Math.floor(notes.length / 2);
  let resultBars = [];

  for (let b = 0; b < barsCount; b++) {
    let remaining = eighthsPerBar;
    let barStr = chords[b % chords.length] + " ";

    while (remaining > 0) {
      const step = Math.floor(Math.random() * 5) - 2;
      idx = Math.max(0, Math.min(notes.length - 1, idx + step));
      const n1 = notes[idx];
      const n2 = notes[Math.min(notes.length - 1, idx + 1)];
      const n3 = notes[Math.max(0, idx - 1)];

      if (vibe === 'virtuoso' && remaining >= 2 && Math.random() < 0.65) {
        barStr += `(3${n1}${n2}${n3} `;
        remaining -= 2;
      } else if (vibe === 'bebop' && remaining >= 2 && Math.random() < 0.4) {
        barStr += `z1 ${n1}1 `;
        remaining -= 2;
      } else if (vibe === 'melodic' && remaining >= 4 && Math.random() < 0.45) {
        barStr += `${n1}4 `;
        remaining -= 4;
      } else if (remaining >= 2 && Math.random() < 0.6) {
        barStr += `${n1}2 `;
        remaining -= 2;
      } else {
        barStr += `${n1}1 `;
        remaining -= 1;
      }
    }
    resultBars.push(barStr.trim());
  }

    let formatted = '';
  for (let i = 0; i < resultBars.length; i++) {
    formatted += resultBars[i] + (i === resultBars.length - 1 ? ' |]' : ' |');
    if ((i + 1) % 4 === 0 && i !== resultBars.length - 1) {
      formatted += '\n';
    } else {
      formatted += ' ';
    }
  }
  return formatted;

}

function generateMusic() {
  const timeSig = document.getElementById('time-sig').value;
  const barsCount = parseInt(document.getElementById('bars-count').value);
  const keySig = document.getElementById('key-sig').value;
  const instKey = document.getElementById('instrument').value;
  const inst = instrumentConfig[instKey];

  let selectedMusic = "";
  let titleLabel = `${currentGenre.toUpperCase()} - ${inst.name} (Gama: ${keySig})`;

  if (currentGenre === 'improvizatie') {
    selectedMusic = buildImprovisationAbc(barsCount, timeSig);
    const scaleSel = document.getElementById('improv-scale');
    const scaleName = scaleSel ? scaleSel.options[scaleSel.selectedIndex].text : '';
    titleLabel = `SOLO ${scaleName} - ${inst.name} (${keySig})`;
  } else {
    const styleEl = document.getElementById('rhythm-style');
    const rhythmStyle = styleEl ? styleEl.value : 'all';
    const genrePatterns = patterns[currentGenre][timeSig] || patterns[currentGenre]["4/4"];
    let filteredPatterns = genrePatterns;

    if (rhythmStyle !== 'all') {
      const byType = genrePatterns.filter(p => p.type === rhythmStyle);
      if (byType.length > 0) filteredPatterns = byType;
    }

        // Colectează toate măsurile din toate șabloanele disponibile
    let allMeasures = [];
    filteredPatterns.forEach(p => {
      const mList = p.abc.split('|').map(m => m.trim()).filter(m => m !== '');
      allMeasures = allMeasures.concat(mList);
    });

    // Creează variații melodice automate (octavă sus/jos sau oglindire)
    const varyMeasure = (m) => {
      const mode = Math.floor(Math.random() * 4);
      if (mode === 0) return m; // original
      if (mode === 1) return m.replace(/([A-G])(?![,'])/g, (_, n) => n.toLowerCase()); // urcă 1 octavă
      if (mode === 2) return m.replace(/([a-g])(?![,'])/g, (_, n) => n.toUpperCase()); // coboară 1 octavă
      // Inversează ordinea grupurilor ritmice din măsură
      const parts = m.split(' ').filter(Boolean);
      return parts.length > 1 ? parts.reverse().join(' ') : m;
    };

    const finalMeasures = [];
    for (let i = 0; i < barsCount; i++) {
      const randM = allMeasures[Math.floor(Math.random() * allMeasures.length)];
      // Ultima măsură rămâne nemodificată pentru o rezolvare (cadență) naturală
      finalMeasures.push(i === barsCount - 1 ? randM : varyMeasure(randM));
    }

    let formatted = '';
    for (let i = 0; i < finalMeasures.length; i++) {
      formatted += finalMeasures[i] + (i === finalMeasures.length - 1 ? ' |]' : ' |');
      if ((i + 1) % 4 === 0 && i !== finalMeasures.length - 1) {
        formatted += '\n';
      } else {
        formatted += ' ';
      }
    }
    selectedMusic = formatted;
      selectedMusic = applyColoraturaEnhancements(selectedMusic);

  }
const octaveShift = parseInt(document.getElementById('octave-shift')?.value || 0);
const totalTranspose = keyOffsets[keySig] + inst.transpose + octaveShift;

const clefTag = inst.clef === "bass" ? " clef=bass octave=-1" : "";
  const customBpm = document.getElementById('gen-bpm')?.value || 90;
  const tempoTag = `\nQ: 1/4=${customBpm}`;

const abcString = `
X: 1
T: ${titleLabel}
M: ${timeSig}
L: 1/8${tempoTag}
K: C${clefTag}
${selectedMusic}
`;
renderAndPlay(abcString, "paper", "#audio-controls", inst.midi, totalTranspose, inst.clef === "bass");
}
function applyColoraturaEnhancements(abcBody) {
    const useOrnaments = document.getElementById('opt-ornaments')?.checked;
    const useDynamics = document.getElementById('opt-dynamics')?.checked;
    const useHarmony = document.getElementById('opt-harmony')?.checked;

    if (!useOrnaments && !useDynamics && !useHarmony) {
        return abcBody;
    }

    let enhanced = abcBody;

    // 1. Triluri & Apogiaturi AI
    if (useOrnaments) {
        const ornaments = ['!trill!', '!mordent!', '!turn!'];
        let count = 0;
        enhanced = enhanced.replace(/([A-Ga-g][',]?)([234])/g, (match, note, dur) => {
            count++;
            if (count % 3 === 1) {
                const orn = ornaments[count % ornaments.length];
                return `${orn}${note}${dur}`;
            }
            return match;
        });
    }

    // 2. Dinamică & Fermata
    if (useDynamics) {
        const measures = enhanced.split('|');
        for (let i = 0; i < measures.length; i++) {
            let m = measures[i].trim();
            if (!m) continue;
            if (i === 0) {
                m = `!mf! ${m}`;
            } else if (i === Math.floor(measures.length / 2)) {
                m = `!f! ${m}`;
            } else if (i === measures.length - 2 || i === measures.length - 1) {
                m = m.replace(/([A-Ga-g][',]?\d*)$/, '!fermata!!p!$1');
            }
            measures[i] = ` ${m} `;
        }
        enhanced = measures.join('|').trim();
    }

    // 3. Dublaj la Terță (2 Voci)
    if (useHarmony) {
        const scale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        enhanced = enhanced.replace(/(\^|_|=)?([A-Ga-g])([',]?)(\d*)/g, (match, acc, noteChar, oct, dur) => {
            const isLower = noteChar === noteChar.toLowerCase();
            const upperChar = noteChar.toUpperCase();
            const idx = scale.indexOf(upperChar);
            if (idx === -1) return match;

            let thirdIdx = (idx + 2) % 7;
            let thirdChar = scale[thirdIdx];
            let thirdOct = oct;

            if (isLower) {
                thirdChar = thirdChar.toLowerCase();
                if (idx + 2 >= 7) thirdOct = (oct || '') + "'";
            } else {
                if (idx + 2 >= 7) {
                    thirdChar = thirdChar.toLowerCase();
                    thirdOct = oct.replace(',', '');
                }
            }
            const prefix = acc || '';
            return `[${prefix}${noteChar}${oct}${thirdChar}${thirdOct}]${dur}`;
        });
    }

    return enhanced;
}
function renderAndPlay(abcString, paperId, audioContainerId, midiProgram, transposeSemitones, isBass = false) {
  const visualObj = ABCJS.renderAbc(paperId, abcString, {
    responsive: "resize",
    visualTranspose: transposeSemitones
  });

  const audioContainer = document.querySelector(audioContainerId);
  audioContainer.innerHTML = "";

  if (ABCJS.synth.supportsAudio()) {
    if (synthControl) synthControl.pause();
    synthControl = new ABCJS.synth.SynthController();

    const cursorControl = {
      onEvent: function(ev) {
        document.querySelectorAll('.abcjs-highlight').forEach(el => el.classList.remove('abcjs-highlight'));
        if (ev && ev.elements) {
          ev.elements.forEach(group => {
            group.forEach(el => el.classList.add('abcjs-highlight'));
          });
        }
      }
    };

    synthControl.load(audioContainerId, cursorControl, {
      displayPlay: true,
      displayRestart: true,
      displayProgress: true
    });
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
if (!window.sharedAudioCtx) {
  window.sharedAudioCtx = new AudioCtx();
}
const audioContext = window.sharedAudioCtx;
if (audioContext.state === 'suspended') {
  audioContext.resume();
}
  // Coborâm cu 1 octavă sunetul MIDI pentru Sax Alto (65) și Sax Tenor (66)
  // ca să sune în registrul lor real, cald, fără să afectăm partitura scrisă
  const audioTranspose = (midiProgram === 65 || midiProgram === 66)
    ? transposeSemitones - 12
    : transposeSemitones;

    const createSynth = new ABCJS.synth.CreateSynth();
    createSynth.init({
      audioContext: audioContext,
      visualObj: visualObj[0],
      options: {
        soundFontUrl: "./sfx/",
        program: midiProgram,
        midiTranspose: audioTranspose,
        soundFontVolumeMultiplier: isBass ? 9 : 4.5

      }
    }).then(() => {
      synthControl.setTune(visualObj[0], false, {
        soundFontUrl: "./sfx/",
        program: midiProgram,
        midiTranspose: audioTranspose,
        soundFontVolumeMultiplier: isBass ? 9 : 4.5

      });
    }).catch(err => {
      console.error("Eroare audio:", err);
    });
  }
}


async function processFileWithAI(event) {
  const file = event.target.files.at(0);
  if (!file) return;

  const apiKey = localStorage.getItem('gemini_api_key');
  const statusEl = document.getElementById('ai-status');

  if (!apiKey) {
    statusEl.innerText = "⚠️ Introdu mai întâi cheia Gemini API mai sus!";
    return;
  }

  const img = document.getElementById('image-preview');
  if (file.type.startsWith('image/')) {
    img.style.display = 'block';
    img.src = URL.createObjectURL(file);
  } else {
    img.style.display = 'none';
  }

  statusEl.innerText = "⏳ AI-ul citește notele din partitură...";

  try {
    const base64Data = await fileToBase64(file);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
       method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "Ești un expert în recunoaștere optică muzicală (OMR). Analizează acest document sau imagine cu o partitură muzicală și transcrie melodia principală în format standard ABC notation. Returnează DOAR codul ABC brut, fără explicații, fără blocuri markdown (fără ). Asigură-te că include antetele X:1, M: (măsura), L:1/8, K: (gama) și notele."
            },
            {
              inline_data: {
  mime_type: file.type.startsWith('image/') ? 'image/jpeg' : file.type,

                data: base64Data
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      statusEl.innerText = "❌ Eroare API: " + data.error.message;
      return;
    }

    let rawAbc = data.candidates.at(0).content.parts.at(0).text;
       lastScannedAbc = rawAbc.replaceAll(String.fromCharCode(96).repeat(3) + 'abc', '').replaceAll(String.fromCharCode(96).repeat(3), '').trim();



    statusEl.innerText = "✅ Partitură citită cu succes! Poți schimba instrumentul mai sus.";
    document.getElementById('scan-sheet-container').style.display = 'block';
    renderScannedMusic();

  } catch (err) {
    statusEl.innerText = "❌ Eroare la procesare: " + err.message;
  }
}

function renderScannedMusic() {
  if (!lastScannedAbc) return;
  const instKey = document.getElementById('scan-instrument').value;
  const inst = instrumentConfig[instKey];
  renderAndPlay(lastScannedAbc, "scan-paper", "#scan-audio-controls", inst.midi, inst.transpose);
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
            else { w = Math.round((w * maxDim) / h); h = maxDim; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed.split(',').at(1));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',').at(1));
      reader.onerror = error => reject(error);
    }
  });
}

window.addEventListener('load', () => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('fade-out');
    }, 1200);
  }
});
// Control Volum Global
let masterVolume = parseFloat(localStorage.getItem('studio_volume') ?? 0.8);

// Interceptează Web Audio API (metronom, acordor, sintetizator abcjs) pentru a aplica volumul
(function() {
  const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OriginalAudioContext) {
    window.appGainNodes = [];
    const origConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(destination, ...args) {
      if (destination && destination.context && destination === destination.context.destination) {
        if (!this._masterGainAttached) {
          const gainNode = destination.context.createGain();
          gainNode.gain.value = masterVolume;
          window.appGainNodes.push(gainNode);
          this._masterGainAttached = true;
          origConnect.call(this, gainNode);
          return origConnect.call(gainNode, destination, ...args);
        }
      }
      return origConnect.apply(this, [destination, ...args]);
    };
  }
})();

  function updateMasterVolume(val) {
  masterVolume = (val / 100) * 2.2;
  localStorage.setItem('studio_volume', val / 100);

  const volValue = document.getElementById('vol-value');
  const volIcon = document.getElementById('vol-icon');
  if (volValue) volValue.textContent = val + '%';
  if (volIcon) volIcon.textContent = val == 0 ? '🔇' : (val < 50 ? '🔉' : '🔊');

  // Actualizează toate nodurile audio active
  if (window.appGainNodes) {
    window.appGainNodes.forEach(g => {
      try { g.gain.value = masterVolume; } catch (e) {}
    });
  }

  // Actualizează eventuale elemente HTML <audio>
  document.querySelectorAll('audio').forEach(el => {
    el.volume = Math.min(1, masterVolume);
  });
}

// Aplică volumul salvat la deschiderea aplicației
window.addEventListener('DOMContentLoaded', () => {
  const savedPercent = Math.round(masterVolume * 100);
  const slider = document.getElementById('master-volume');
  if (slider) {
    slider.value = savedPercent;
    updateMasterVolume(savedPercent);
  }
});
// === EXPORT PDF A4 (FUNDAL ALB, NOTE NEGRE) ===
async function exportScoreToPDF() {
  const svgEl = document.querySelector('#scan-paper svg');
  if (!svgEl) {
    alert('Nu există nicio partitură generată de exportat!');
    return;
  }

  try {
    const clone = svgEl.cloneNode(true);
    clone.querySelectorAll('path, text, rect, line, circle, ellipse, polygon').forEach(el => {
      const fill = el.getAttribute('fill');
      const stroke = el.getAttribute('stroke');
      if (fill && fill !== 'none') el.setAttribute('fill', '#000000');
      if (stroke && stroke !== 'none') el.setAttribute('stroke', '#000000');
    });

    const bbox = svgEl.getBoundingClientRect();
    const width = Math.max(bbox.width, 800);
    const height = Math.max(bbox.height, 400);
    clone.setAttribute('width', width);
    clone.setAttribute('height', height);

    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth() - 20;
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 15, pageWidth, pageHeight);
      pdf.save('Partitura-Studio-Muzical-AI.pdf');
    };
    img.src = url;
  } catch (err) {
    alert('Eroare la generarea PDF: ' + err.message);
  }
}

// === BIBLIOTECĂ LOCALĂ "PARTITURILE MELE" ===
function saveScoreToLibrary() {
  if (!lastScannedAbc) {
    alert('Nu există nicio partitură de salvat!');
    return;
  }
  const titleMatch = lastScannedAbc.match(/T:\s*(.+)/);
  const defaultName = titleMatch ? titleMatch.at(1).trim() : 'Partitură ' + new Date().toLocaleDateString('ro-RO');
  const name = prompt('Numele partiturii:', defaultName);
  if (!name) return;

  const saved = JSON.parse(localStorage.getItem('saved_scores_list') || '[]');
  saved.unshift({ id: Date.now(), name: name, abc: lastScannedAbc });
  localStorage.setItem('saved_scores_list', JSON.stringify(saved));
  renderSavedScoresList();
  alert('✅ Partitura a fost salvată în bibliotecă!');
}

function renderSavedScoresList() {
  const container = document.getElementById('saved-scores-list');
  if (!container) return;
  const saved = JSON.parse(localStorage.getItem('saved_scores_list') || '[]');
  if (saved.length === 0) {
    container.innerHTML = '<p style="color:#888; font-size:13px;">Nicio partitură salvată încă.</p>';
    return;
  }
    container.innerHTML = saved.map(function(item) {
    return '<div style="display:flex; justify-content:space-between; align-items:center; background:#1e1e1e; padding:10px 12px; border-radius:8px; border:1px solid #333;">' +
      '<span onclick="loadSavedScore(' + item.id + ')" style="cursor:pointer; flex:1; font-weight:500;">🎵 ' + item.name + '</span>' +
      '<button onclick="deleteSavedScore(' + item.id + ')" style="background:transparent; border:none; color:#ff5555; font-size:16px; cursor:pointer; padding:4px 8px;">🗑️</button>' +
    '</div>';
  }).join('');

}

function loadSavedScore(id) {
  const saved = JSON.parse(localStorage.getItem('saved_scores_list') || '[]');
  const found = saved.find(s => s.id === id);
  if (found) {
    lastScannedAbc = found.abc;
    document.getElementById('scan-sheet-container').style.display = 'block';
    const tempoBox = document.getElementById('tempo-control-box');
    if (tempoBox) tempoBox.style.display = 'block';
    renderScannedMusic();
  }
}

function deleteSavedScore(id) {
  let saved = JSON.parse(localStorage.getItem('saved_scores_list') || '[]');
  saved = saved.filter(s => s.id !== id);
  localStorage.setItem('saved_scores_list', JSON.stringify(saved));
  renderSavedScoresList();
}

// === CONTROL VITEZĂ / TEMPO LA REDARE ===
function changePlaybackTempo(percent) {
  const label = document.getElementById('tempo-val');
  if (label) label.textContent = percent + '%';
  if (!lastScannedAbc) return;

  const baseBpm = 100;
  const newBpm = Math.round((baseBpm * percent) / 100);
  if (/^Q:/m.test(lastScannedAbc)) {
        lastScannedAbc = lastScannedAbc.replace(/^Q:.*$/m, 'Q:1/4=' + newBpm);

  } else {
        lastScannedAbc = 'Q:1/4=' + newBpm + '\n' + lastScannedAbc;

  }
  renderScannedMusic();
}

const origRenderScanned = renderScannedMusic;
renderScannedMusic = function() {
  origRenderScanned();
  const tempoBox = document.getElementById('tempo-control-box');
  if (tempoBox) tempoBox.style.display = 'block';
};
window.addEventListener('DOMContentLoaded', renderSavedScoresList); 
function downloadScorePNG() {
  const svg = document.querySelector('#paper svg');
  if (!svg) {
    alert('Generează mai întâi o partitură înainte de a o descărca!');
    return;
  }

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = function () {
    const scale = 2;
    const canvas = document.createElement('canvas');
    const rect = svg.getBoundingClientRect();
    const width = svg.viewBox.baseVal.width || rect.width || 800;
    const height = svg.viewBox.baseVal.height || rect.height || 400;

    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    URL.revokeObjectURL(url);

    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    const genreName = (currentGenre || 'partitura').toLowerCase();
    const keyName = document.getElementById('key-sig')?.value || 'C';
    a.download = `Partitura_${genreName}_${keyName}.png`;
    a.href = pngUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  img.src = url;
}
// ==========================================
// MODUL: CLAVIATURA INTERACTIVA & ARANJOR AI
// ==========================================
let recordedNotes = [];

const pianoKeysData = [
  // Octava de jos (stanga -1 octava)
  { label: 'Do0', abc: 'C,', type: 'white', midi: 48 },
  { label: 'Do#0', abc: '^C,', type: 'black', midi: 49 },
  { label: 'Re0', abc: 'D,', type: 'white', midi: 50 },
  { label: 'Re#0', abc: '^D,', type: 'black', midi: 51 },
  { label: 'Mi0', abc: 'E,', type: 'white', midi: 52 },
  { label: 'Fa0', abc: 'F,', type: 'white', midi: 53 },
  { label: 'Fa#0', abc: '^F,', type: 'black', midi: 54 },
  { label: 'Sol0', abc: 'G,', type: 'white', midi: 55 },
  { label: 'Sol#0', abc: '^G,', type: 'black', midi: 56 },
  { label: 'La0', abc: 'A,', type: 'white', midi: 57 },
  { label: 'Sib0', abc: '_B,', type: 'black', midi: 58 },
  { label: 'Si0', abc: 'B,', type: 'white', midi: 59 },
  // Octava centrala
  { label: 'Do', abc: 'C', type: 'white', midi: 60 },
  { label: 'Do#', abc: '^C', type: 'black', midi: 61 },
  { label: 'Re', abc: 'D', type: 'white', midi: 62 },
  { label: 'Re#', abc: '^D', type: 'black', midi: 63 },
  { label: 'Mi', abc: 'E', type: 'white', midi: 64 },
  { label: 'Fa', abc: 'F', type: 'white', midi: 65 },
  { label: 'Fa#', abc: '^F', type: 'black', midi: 66 },
  { label: 'Sol', abc: 'G', type: 'white', midi: 67 },
  { label: 'Sol#', abc: '^G', type: 'black', midi: 68 },
  { label: 'La', abc: 'A', type: 'white', midi: 69 },
  { label: 'Sib', abc: '_B', type: 'black', midi: 70 },
  { label: 'Si', abc: 'B', type: 'white', midi: 71 },
  // Octava 2
  { label: 'Do2', abc: 'c', type: 'white', midi: 72 },
  { label: 'Do#2', abc: '^c', type: 'black', midi: 73 },
  { label: 'Re2', abc: 'd', type: 'white', midi: 74 },
  { label: 'Re#2', abc: '^d', type: 'black', midi: 75 },
  { label: 'Mi2', abc: 'e', type: 'white', midi: 76 },
  { label: 'Fa2', abc: 'f', type: 'white', midi: 77 },
  { label: 'Fa#2', abc: '^f', type: 'black', midi: 78 },
  { label: 'Sol2', abc: 'g', type: 'white', midi: 79 },
  { label: 'Sol#2', abc: '^g', type: 'black', midi: 80 },
  { label: 'La2', abc: 'a', type: 'white', midi: 81 },
  { label: 'Sib2', abc: '_b', type: 'black', midi: 82 },
  { label: 'Si2', abc: 'b', type: 'white', midi: 83 },
  // Octava de sus (dreapta +1 octava)
  { label: 'Do3', abc: "c'", type: 'white', midi: 84 },
  { label: 'Do#3', abc: "^c'", type: 'black', midi: 85 },
  { label: 'Re3', abc: "d'", type: 'white', midi: 86 },
  { label: 'Re#3', abc: "^d'", type: 'black', midi: 87 },
  { label: 'Mi3', abc: "e'", type: 'white', midi: 88 },
  { label: 'Fa3', abc: "f'", type: 'white', midi: 89 },
  { label: 'Fa#3', abc: "^f'", type: 'black', midi: 90 },
  { label: 'Sol3', abc: "g'", type: 'white', midi: 91 },
  { label: 'Sol#3', abc: "^g'", type: 'black', midi: 92 },
  { label: 'La3', abc: "a'", type: 'white', midi: 93 },
  { label: 'Sib3', abc: "_b'", type: 'black', midi: 94 },
  { label: 'Si3', abc: "b'", type: 'white', midi: 95 }
];

function openPianoStudio() {
  switchScreen('piano-screen');
  buildPianoUI();
  updatePianoScore();
  setTimeout(() => {
    const container = document.getElementById('interactive-piano');
    if (container) container.scrollLeft = 350;
  }, 50);
}

function buildPianoUI() {
  const container = document.getElementById('interactive-piano');
  if (!container || container.innerHTML.trim() !== '') return;

  let isDragging = false;
  let startX = 0;

  container.addEventListener('touchstart', (e) => {
    isDragging = false;
    startX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (Math.abs(e.touches[0].clientX - startX) > 10) {
      isDragging = true;
    }
  }, { passive: true });

  pianoKeysData.forEach(k => {
    const btn = document.createElement('div');
    btn.className = k.type === 'white' ? 'piano-key-white' : 'piano-key-black';
    if (k.type === 'white') btn.innerText = k.label;
    btn.onclick = () => {
      if (!isDragging) handlePianoPress(k);
    };
    container.appendChild(btn);
  });
}

let pianoAudioCtx = null;

function playSinglePreviewNote(midiNote) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!pianoAudioCtx) {
    pianoAudioCtx = new AudioCtx();
  }
  if (pianoAudioCtx.state === 'suspended') {
    pianoAudioCtx.resume();
  }

  const osc = pianoAudioCtx.createOscillator();
  const gain = pianoAudioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 440 * Math.pow(2, (midiNote - 69) / 12);
  gain.gain.setValueAtTime(0.3, pianoAudioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, pianoAudioCtx.currentTime + 0.35);
  osc.connect(gain);
  gain.connect(pianoAudioCtx.destination);
  osc.start();
  osc.stop(pianoAudioCtx.currentTime + 0.35);
}
function handlePianoPress(keyObj) {
  playSinglePreviewNote(keyObj.midi);
  const len = parseInt(document.getElementById('piano-note-len').value || 2);
  recordedNotes.push({ abc: keyObj.abc, len: len, isRest: false });
  updatePianoScore();
}
function setPianoNoteLen(len, btnEl) {
  const hiddenInput = document.getElementById('piano-note-len');
  if (hiddenInput) hiddenInput.value = len;

  document.querySelectorAll('.note-len-btn').forEach(btn => {
    btn.style.background = '#2c2c2c';
    btn.style.fontWeight = 'normal';
  });
  if (btnEl) {
    btnEl.style.background = '#2a9d8f';
    btnEl.style.fontWeight = 'bold';
  }
}

function addPianoRest(customLen) {
  const selectedLen = parseInt(document.getElementById('piano-note-len')?.value || '2', 10);
  const restLen = customLen || selectedLen;

  recordedNotes.push({ abc: 'z', len: restLen, isRest: true });
  updatePianoScore();
}


function undoPianoNote() {
  recordedNotes.pop();
  updatePianoScore();
}

function clearPianoNotes() {
  recordedNotes = [];
  updatePianoScore();
}
function stylizeMelody(notes, style) {
  if (notes.length === 0) return "z8 |]";
  const stepUp = {
    'C,': 'D,', '^C,': 'D,', 'D,': 'E,', '^D,': 'E,', 'E,': 'F,', 'F,': 'G,', '^F,': 'G,',
    'G,': 'A,', '^G,': 'A,', 'A,': 'B,', '_B,': 'B,', 'B,': 'C',
    'C': 'D', '^C': 'D', 'D': 'E', '^D': 'E', 'E': 'F', 'F': 'G', '^F': 'G',
    'G': 'A', '^G': 'A', 'A': 'B', '_B': 'B', 'B': 'c',
    'c': 'd', '^c': 'd', 'd': 'e', '^d': 'e', 'e': 'f', 'f': 'g', '^f': 'g',
    'g': 'a', '^g': 'a', 'a': 'b', '_b': 'b', 'b': "c'",
    "c'": "d'", "^c'": "d'", "d'": "e'", "^d'": "e'", "e'": "f'", "f'": "g'", "^f'": "g'",
    "g'": "a'", "^g'": "a'", "a'": "b'", "_b'": "b'", "b'": "c''"
  };
  const stepDown = {
    'C,': 'B,,', '^C,': 'C,', 'D,': 'C,', '^D,': 'D,', 'E,': 'D,', 'F,': 'E,', '^F,': 'F,',
    'G,': 'F,', '^G,': 'G,', 'A,': 'G,', '_B,': 'A,', 'B,': 'A,',
    'C': 'B,', '^C': 'C', 'D': 'C', '^D': 'D', 'E': 'D', 'F': 'E', '^F': 'F',
    'G': 'F', '^G': 'G', 'A': 'G', '_B': 'A', 'B': 'A',
    'c': 'B', '^c': 'c', 'd': 'c', '^d': 'd', 'e': 'd', 'f': 'e', '^f': 'f',
    'g': 'f', '^g': 'g', 'a': 'g', '_b': 'a', 'b': 'a',
    "c'": 'b', "^c'": "c'", "d'": "c'", "^d'": "d'", "e'": "d'", "f'": "e'", "^f'": "f'",
    "g'": "f'", "^g'": "g'", "a'": "g'", "_b'": "a'", "b'": "a'"
  }
      let abcTokens = [];
    notes.forEach((n, idx) => {
        const base = n.abc;
        const dur = n.len;
        const up = stepUp[base] || base;
        const down = stepDown[base] || base;
        const isLast = idx === notes.length - 1;

        if (n.isRest || style === 'original') {
            abcTokens.push(`${base}${dur > 1 ? dur : ''}`);
            return;
        }

        // Toate stilurile non-original folosesc variante SLOW & COLORATURĂ LIRICĂ
        if (style === 'jazz' || style === 'blues') {
            if (dur >= 4) {
                abcTokens.push(`(${down}${base} (3${up}${base}${down} ${base}${dur - 2})`);
            } else if (dur >= 2) {
                abcTokens.push(`({${down}}${base}1 ${up}${dur - 1})`);
            } else {
                abcTokens.push(`{${down}}${base}`);
            }
        } else if (style === 'gospel' || style === 'balada') {
            if (dur >= 4) {
                abcTokens.push(`(!mordent!${base}2 (3${up}${base}${down} ${base}${dur - 3})`);
            } else if (dur >= 2) {
                abcTokens.push(`({${down}${up}}${base}${dur})`);
            } else {
                abcTokens.push(`{${down}}${base}`);
            }
        } else if (style === 'lautaresc' || style === 'folclor') {
            if (dur >= 4) {
                abcTokens.push(`(!trill!${base}1 (3${up}${base}${down} ${down}1 ${base}${dur - 3})`);
            } else if (dur >= 2) {
                abcTokens.push(`({${up}${base}${down}}${base}${dur})`);
            } else {
                abcTokens.push(`{${up}}${base}`);
            }
        } else if (style === 'sarbeasca') {
            if (dur >= 2) {
                abcTokens.push(`((3${base}${up}${base} ${down}${dur - 1})`);
            } else {
                abcTokens.push(`{${up}}${base}`);
            }
        } else {
            // Clasic / Orice alt stil -> Coloratură lirică cantabile
            if (dur >= 4) {
                abcTokens.push(`(!turn!${base}2 ${up}1 ${down}1 ${base}${dur - 4 > 0 ? dur - 4 : ''})`);
            } else if (dur >= 2) {
                abcTokens.push(`({${up}}${base}1 ${down}${dur - 1})`);
            } else {
                abcTokens.push(`${base}`);
            }
        }

        // Adăugăm fermata expresivă pe ultima notă în modul Slow
        if (isLast && abcTokens.length > 0) {
            abcTokens[abcTokens.length - 1] = `!fermata!${abcTokens[abcTokens.length - 1]}`;
        }
    });

    let result = "";
    let beatCount = 0;
    notes.forEach((n, i) => {
        result += abcTokens[i] + " ";
        beatCount += n.len;
        if (beatCount >= 8) {
            result += "| ";
            beatCount = 0;
        }
    });
    if (!result.trim().endsWith("|")) result += "|]";
    return result;
}
function updatePianoScore() {
    const targetKey = document.getElementById('piano-target-key')?.value || 'C';
    const instKey = document.getElementById('piano-instrument')?.value || 'piano';
    const styleMode = document.getElementById('piano-style-mode')?.value || 'original';
    const inst = instrumentConfig[instKey] || instrumentConfig.piano;

    const totalTranspose = (keyOffsets[targetKey] || 0) + inst.transpose;
    const clefTag = inst.clef === "bass" ? " clef=bass octave=-1" : "";
    const isSlowStyle = styleMode !== 'original';
    const tempoTag = isSlowStyle ? "\nQ: 1/4=62" : "\nQ: 1/4=96";
    const styleLabel = isSlowStyle ? `${styleMode.toUpperCase()} - SLOW COLORATURĂ` : "ORIGINAL";
    const bodyAbc = stylizeMelody(recordedNotes, styleMode);

    const abcString = `
X: 1
T: Melodie - ${styleLabel} (${inst.name} - ${targetKey})
M: 4/4
L: 1/8${tempoTag}
K: C${clefTag}
${bodyAbc}
`;
    renderAndPlay(abcString, "piano-paper", "#piano-audio-controls", inst.midi, totalTranspose, inst.clef === "bass");
}
// ============================================================================
// MODUL CAPTARE MICROFON OFFLINE (AUTOCORELAȚIE + DETECȚIE GAMĂ)
// ============================================================================

let micStream = null;
let micAnalyser = null;
let micDataArray = null;
let isMicRecording = false;
let micAnimationFrame = null;

let lastDetectedMidi = null;
let sameNoteFrameCount = 0;
let lastNoteTimestamp = 0;
let capturedMidiSequence = [];

const MIDI_TO_ABC_NOTES = [
  "C", "^C", "D", "^D", "E", "F", "^F", "G", "^G", "A", "^A", "B"
];

function midiToAbcNote(midiNumber) {
  const pitchClass = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteName = MIDI_TO_ABC_NOTES[pitchClass];

  if (octave === 4) return noteName;
  if (octave === 5) return noteName.toLowerCase();
  if (octave > 5) return noteName.toLowerCase() + "'".repeat(octave - 5);
  return noteName + ",".repeat(4 - octave);
}

// Algoritm Autocorelație (100% offline, fără internet)
function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Prag de liniște (ignoră zgomotul de fundal)
  if (rms < 0.025) return -1;

  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  const c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  // Interpolare parabolică pentru precizie fină
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

function frequencyToMidi(frequency) {
  return Math.round(12 * (Math.log(frequency / 440) / Math.log(2))) + 69;
}

// Identificare automată a gamei (Major / minor) compatibilă cu opțiunile din #piano-target-key
function detectMusicalKey(midiNotesArray) {
  if (!midiNotesArray || midiNotesArray.length === 0) return "C";

  const pitchCounts = new Array(12).fill(0);
  midiNotesArray.forEach(midi => {
    pitchCounts[midi % 12]++;
  });

  // Doar gamele disponibile în dropdown-ul #piano-target-key
  const availableKeys = [
    { name: "C",  root: 0,  intervals: [0, 2, 4, 5, 7, 9, 11] },
    { name: "G",  root: 7,  intervals: [0, 2, 4, 5, 7, 9, 11] },
    { name: "D",  root: 2,  intervals: [0, 2, 4, 5, 7, 9, 11] },
    { name: "A",  root: 9,  intervals: [0, 2, 4, 5, 7, 9, 11] },
    { name: "E",  root: 4,  intervals: [0, 2, 4, 5, 7, 9, 11] },
    { name: "F",  root: 5,  intervals: [0, 2, 4, 5, 7, 9, 11] },
    { name: "Bb", root: 10, intervals: [0, 2, 4, 5, 7, 9, 11] },
    { name: "Eb", root: 3,  intervals: [0, 2, 4, 5, 7, 9, 11] },
    { name: "Cm", root: 0,  intervals: [0, 2, 3, 5, 7, 8, 10] },
    { name: "Dm", root: 2,  intervals: [0, 2, 3, 5, 7, 8, 10] },
    { name: "Em", root: 4,  intervals: [0, 2, 3, 5, 7, 8, 10] },
    { name: "Gm", root: 7,  intervals: [0, 2, 3, 5, 7, 8, 10] }
  ];

  let bestKey = "C";
  let bestScore = -999;

  availableKeys.forEach(scale => {
    let score = 0;
    for (let note = 0; note < 12; note++) {
      const interval = (note - scale.root + 12) % 12;
      if (scale.intervals.includes(interval)) {
        score += pitchCounts[note] * 2;
        if (interval === 0) score += pitchCounts[note] * 1.5; // Tonică
        if (interval === 7) score += pitchCounts[note] * 1.0; // Dominantă
      } else {
        score -= pitchCounts[note] * 3;
      }
    }
    // Bonus dacă ultima notă cântată este tonica gamei
    const lastPitchClass = midiNotesArray[midiNotesArray.length - 1] % 12;
    if (lastPitchClass === scale.root) score += 2.5;

    if (score > bestScore) {
      bestScore = score;
      bestKey = scale.name;
    }
  });

  return bestKey;
}

// Analiză live a microfonului
function processMicAudio() {
  if (!isMicRecording) return;

  micAnalyser.getFloatTimeDomainData(micDataArray);
  const freq = autoCorrelate(micDataArray, window.sharedAudioCtx.sampleRate);
  const statusEl = document.getElementById("mic-status");

  // Domeniu vocal și instrumente solo (65 Hz = C2 -> 1400 Hz = F6)
  if (freq > 65 && freq < 1400) {
    const midi = frequencyToMidi(freq);
    const abcNote = midiToAbcNote(midi);

    if (midi === lastDetectedMidi) {
      sameNoteFrameCount++;
    } else {
      lastDetectedMidi = midi;
      sameNoteFrameCount = 1;
    }

    const now = Date.now();
    // Confirmăm nota după 6 cadre stabile și min 260ms între note
    if (sameNoteFrameCount === 6 && (now - lastNoteTimestamp > 260)) {
      const noteLen = parseInt(document.getElementById("piano-note-len")?.value || "2", 10);

      capturedMidiSequence.push(midi);
      // Adăugăm nota direct în formatul nativ al claviaturii tale!
      recordedNotes.push({ abc: abcNote, len: noteLen, isRest: false });

      lastNoteTimestamp = now;

      if (statusEl) {
        statusEl.textContent = `🎵 Captat: ${abcNote} (${Math.round(freq)} Hz) | Note: ${recordedNotes.length}`;
      }

      // Desenăm live pe portativ folosind funcția ta existentă
      const liveBody = stylizeMelody(recordedNotes, "original");
      const liveAbc = `X: 1\nT: Înregistrare Live...\nM: 4/4\nL: 1/8\nK: C\n${liveBody}`;
      if (typeof ABCJS !== "undefined") {
        ABCJS.renderAbc("piano-paper", liveAbc, { responsive: "resize" });
      }
    }
  }

  micAnimationFrame = requestAnimationFrame(processMicAudio);
}

// Pornire / Oprire Înregistrare
async function toggleMicRecording() {
  const btn = document.getElementById("btn-mic-record");
  const statusEl = document.getElementById("mic-status");

  if (!isMicRecording) {
    try {
      if (!window.sharedAudioCtx) {
        window.sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (window.sharedAudioCtx.state === "suspended") {
        await window.sharedAudioCtx.resume();
      }

      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const source = window.sharedAudioCtx.createMediaStreamSource(micStream);
      micAnalyser = window.sharedAudioCtx.createAnalyser();
      micAnalyser.fftSize = 2048;
      micDataArray = new Float32Array(micAnalyser.fftSize);
      source.connect(micAnalyser);

      // Resetăm notele pentru o înregistrare nouă
      recordedNotes = [];
      capturedMidiSequence = [];
      lastDetectedMidi = null;
      sameNoteFrameCount = 0;
      isMicRecording = true;

      btn.textContent = "⏹️ Oprește Înregistrarea";
      btn.style.background = "#2a9d8f";
      if (statusEl) statusEl.textContent = "🎙️ Ascult... Cântă clar notă cu notă!";

      processMicAudio();
    } catch (err) {
      console.error("Eroare microfon:", err);
      if (statusEl) {
        statusEl.textContent = "❌ Acces refuzat la microfon. Verifică permisiunile (HTTPS).";
      }
    }
  } else {
    isMicRecording = false;
    if (micAnimationFrame) cancelAnimationFrame(micAnimationFrame);
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }

    btn.textContent = "🎤 Înregistrează (Microfon)";
    btn.style.background = "#d62828";

    if (capturedMidiSequence.length === 0) {
      if (statusEl) statusEl.textContent = "⚠️ Nu s-a detectat nicio notă. Încearcă mai aproape de microfon.";
      updatePianoScore();
      return;
    }

    // 1. Detectăm gama automat
    const detectedKey = detectMusicalKey(capturedMidiSequence);

    // 2. Selectăm gama detectată în #piano-target-key
    const targetKeySelect = document.getElementById("piano-target-key");
    if (targetKeySelect) {
      targetKeySelect.value = detectedKey;
    }

    if (statusEl) {
      statusEl.innerHTML = `✅ Captate <b>${recordedNotes.length} note</b> | Gamă detectată: <b>${detectedKey}</b>`;
    }

    // 3. Apelăm updatePianoScore() - activează automat transpunerea, instrumentul și stilurile!
    updatePianoScore();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const micBtn = document.getElementById("btn-mic-record");
  if (micBtn) {
    micBtn.addEventListener("click", toggleMicRecording);
  }
});
