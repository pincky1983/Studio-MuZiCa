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
  cello: { transpose: 0, midi: 42, name: "Violoncel" },
  contrabass: { transpose: 12, midi: 43, name: "Contrabas" },
  strings_ensemble: { transpose: 0, midi: 48, name: "Ansamblu Corzi" },

  // Chitare & Bas
  guitar: { transpose: 0, midi: 24, name: "Chitară Clasică" },
  steel_guitar: { transpose: 0, midi: 25, name: "Chitară Folk" },
  jazz_guitar: { transpose: 0, midi: 26, name: "Chitară Jazz" },
  clean_guitar: { transpose: 0, midi: 27, name: "Chitară Electrică" },
  acoustic_bass: { transpose: 12, midi: 32, name: "Bas Acustic" },
  electric_bass: { transpose: 12, midi: 33, name: "Bas Electric" },

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
  document.getElementById('genre-title').innerText = genre.toUpperCase();
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
      { type: "syncopated", abc: "D2 z F A2 c2 | z B G2 F2 D2 | _E2 z G _B2 d2 | C4 z4 |" }
    ],
    "3/4": [
      { type: "normal", abc: "D2 F2 A2 | G2 B2 d2 | c2 e2 g2 | c6 |" },
      { type: "triplets", abc: "(3DFA c2 A2 | (3GBd f2 d2 | (3ceg b2 g2 | c'6 |" }
    ],
    "2/4": [
      { type: "normal", abc: "D2 F2 | G2 B2 | c2 e2 | c4 |" },
      { type: "triplets", abc: "(3DFA (3cBA | (3GBd (3fed | (3ceg (3bag | c'4 |" }
    ],
    "6/8": [
      { type: "normal", abc: "D2F A2c | B2G F2D | E2G B2d | c6 |" },
      { type: "arpeggios", abc: "DFA cBA | GBd fed | EGB dcB | ceg c'3 |" }
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
      { type: "syncopated", abc: "C2 z _E F2 ^F2 | z G _B2 c2 _E2 | G2 z F _E2 C2 | C4 z4 |" }
    ],
    "3/4": [
      { type: "normal", abc: "C2 _E2 F2 | ^F2 G2 _B2 | c2 _B2 G2 | C6 |" },
      { type: "triplets", abc: "(3C_EG _B2 G2 | (3F_Ac _e2 c2 | (3G_Bd f2 d2 | c6 |" }
    ],
    "2/4": [
      { type: "normal", abc: "C2 _E2 | F2 ^F2 | G2 _B2 | c4 |" },
      { type: "triplets", abc: "(3C_EG (3_BG_E | (3F_Ac (3_ec_A | (3G_Bd (3f_d_B | c4 |" }
    ],
    "6/8": [
      { type: "normal", abc: "C2_E F2^F | G2_B c2_B | G2F _E2C | C6 |" },
      { type: "arpeggios", abc: "C_EG _BG_E | F_Ac _ec_A | G_Bd fd_B | c6 |" }
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
      { type: "syncopated", abc: "C2 z E G2 c2 | z A F2 D2 B,2 | E2 z G c2 e2 | c4 z4 |" }
    ],
    "3/4": [
      { type: "normal", abc: "C2 E2 G2 | F2 A2 c2 | G2 B2 d2 | c6 |" },
      { type: "triplets", abc: "(3CEG c2 G2 | (3FAc f2 c2 | (3GBd g2 d2 | c6 |" }
    ],
    "2/4": [
      { type: "normal", abc: "C2 E2 | F2 A2 | G2 B2 | c4 |" },
      { type: "triplets", abc: "(3CEG (3cGE | (3FAc (3fcA | (3GBd (3gdB | c4 |" }
    ],
    "6/8": [
      { type: "normal", abc: "C2E G2c | A2F D2F | G2B d2B | c6 |" },
      { type: "arpeggios", abc: "CEG cGE | FAc fcA | GBd gdB | ceg c'3 |" }
    ]
  },
    balada: {
    "4/4": [
      { type: "normal", abc: "C2 E2 G2 c2 | B2 G2 E2 B,2 | A,2 C2 E2 A2 | F2 A2 c2 d2 |" },
      { type: "normal", abc: "A2 c2 e2 a2 | F2 A2 c2 f2 | C2 E2 G2 c2 | G2 B2 d2 g2 |" },
      { type: "triplets", abc: "(3C2E2G2 (3c2G2E2 | (3A,2C2E2 (3A2E2C2 | (3F,2A,2C2 (3F2C2A,2 | (3G,2B,2D2 G4 |" },
      { type: "arpeggios", abc: "CE Gc eg c'g | A,C EA ce ac | FA cf ac' fa | GB dg bd' g'2 |" },
      { type: "syncopated", abc: "C2 z E G2 c2 | z A, C2 E2 A2 | F2 z A c2 f2 | G4 z4 |" }
    ],
    "3/4": [
      { type: "normal", abc: "C2 E2 G2 | A,2 C2 E2 | F2 A2 c2 | G2 B2 d2 |" },
      { type: "triplets", abc: "(3CEG c2 G2 | (3A,CE A2 E2 | (3FAc f2 c2 | G6 |" }
    ],
    "2/4": [
      { type: "normal", abc: "C2 G2 | A,2 E2 | F2 c2 | G2 d2 |" },
      { type: "triplets", abc: "(3CEG (3cGE | (3A,CE (3AEC | (3FAc (3fcA | G4 |" }
    ],
    "6/8": [
      { type: "normal", abc: "C2E G2c | B2G E2B, | A,2C E2A | G6 |" },
      { type: "arpeggios", abc: "CEG cGE | A,CE AEC | FAc fcA | GBd gdB |" }
    ]
  },
  clasic: {
    "4/4": [
      { type: "normal", abc: "C2 E2 G2 E2 | D2 F2 A2 F2 | G2 B2 d2 B2 | c4 z4 |" },
      { type: "normal", abc: "c2 G2 E2 G2 | A2 E2 C2 E2 | F2 D2 B,2 D2 | C4 z4 |" },
      { type: "triplets", abc: "(3C2E2G2 (3c2B2A2 | (3G2F2E2 (3D2C2B,2 | (3C2E2G2 (3B2d2f2 | e4 z4 |" },
      { type: "arpeggios", abc: "CG EG CG EG | DA FA DA FA | GB dB GB dB | ce ge c4 |" },
      { type: "syncopated", abc: "c2 z G E2 G2 | z F D2 B,2 D2 | E2 z G c2 e2 | c4 z4 |" }
    ],
    "3/4": [
      { type: "normal", abc: "C2 E2 G2 | F2 D2 B,2 | G2 B2 d2 | c6 |" },
      { type: "triplets", abc: "(3CEG (3cBA (3GFE | (3DFA (3dcB (3AGF | (3EGB (3edc (3BAG | c6 |" }
    ],
    "2/4": [
      { type: "normal", abc: "C2 E2 | D2 F2 | G2 B2 | c4 |" },
      { type: "arpeggios", abc: "CGEG | DAFA | GBdB | c4 |" }
    ],
    "6/8": [
      { type: "normal", abc: "C2E G2E | D2F A2F | G2B d2B | c6 |" },
      { type: "arpeggios", abc: "CEG cGE | DFA dAF | GBd gdB | c6 |" }
    ]
  },
  lautaresc: {
    "4/4": [
      { type: "normal", abc: "E2 F2 ^G2 A2 | B2 c2 B2 A2 | ^G2 F2 E2 D2 | E4 z4 |" },
      { type: "normal", abc: "A2 B2 c2 d2 | e2 d2 c2 B2 | A2 ^G2 F2 E2 | E4 z4 |" },
      { type: "triplets", abc: "(3E2F2^G2 (3A2B2c2 | (3d2c2B2 (3A2^G2F2 | (3E2^G2B2 (3d2c2B2 | E4 z4 |" },
      { type: "triplets", abc: "(3e2d2c2 (3B2A2^G2 | (3A2B2c2 (3B2A2^G2 | (3F2^G2A2 (3^G2F2E2 | E4 z4 |" },
      { type: "arpeggios", abc: "EF ^GA Bc de | ed cB A^G FE | ^GA Bc dB ^GF | E4 z4 |" },
      { type: "syncopated", abc: "E2 z ^G A2 c2 | z B A2 ^G2 F2 | E2 z F ^G2 B2 | E4 z4 |" }
    ],
    "3/4": [
      { type: "normal", abc: "E2 ^G2 B2 | c2 B2 A2 | ^G2 F2 E2 | E6 |" },
      { type: "triplets", abc: "(3EF^G (3ABc B2 | (3dcB (3A^GF E2 | (3E^GB d2 c2 | E6 |" }
    ],
    "2/4": [
      { type: "normal", abc: "E2 ^G2 | A2 c2 | B2 ^G2 | E4 |" },
      { type: "triplets", abc: "(3EF^G (3ABc | (3dcB (3A^GF | (3E^GB (3dcB | E4 |" }
    ],
    "6/8": [
      { type: "normal", abc: "E2^G B2c | d2c B2A | ^G2F E2D | E6 |" },
      { type: "arpeggios", abc: "EF^G ABc | dcB A^GF | E^GB dcB | E6 |" }
    ]
  },
  folclor: {
    "4/4": [
      { type: "normal", abc: "C2 D2 E2 G2 | A2 G2 E2 D2 | C2 E2 G2 A2 | G4 z4 |" },
      { type: "normal", abc: "G2 A2 B2 c2 | d2 c2 B2 A2 | G2 E2 D2 C2 | C4 z4 |" },
      { type: "triplets", abc: "(3C2D2E2 (3G2A2G2 | (3E2D2C2 (3D2E2G2 | (3A2B2c2 (3B2A2G2 | C4 z4 |" },
      { type: "triplets", abc: "(3G2A2B2 (3c2d2e2 | (3d2c2B2 (3A2G2E2 | (3D2E2G2 (3A2G2E2 | C4 z4 |" },
      { type: "arpeggios", abc: "CD EG AG ED | CE GA cA GE | GA Bc dB AG | c4 z4 |" },
      { type: "syncopated", abc: "C2 z E G2 A2 | z G E2 D2 C2 | G2 z A B2 d2 | c4 z4 |" }
    ],
    "3/4": [
      { type: "normal", abc: "C2 E2 G2 | A2 G2 E2 | D2 E2 G2 | C6 |" },
      { type: "triplets", abc: "(3CDE G2 E2 | (3FGA c2 A2 | (3GAB d2 B2 | c6 |" }
    ],
    "2/4": [
      { type: "normal", abc: "C2 E2 | G2 A2 | G2 E2 | C4 |" },
      { type: "triplets", abc: "(3CDE (3GAG | (3EDC (3DEG | (3ABc (3BAG | C4 |" }
    ],
    "6/8": [
      { type: "normal", abc: "C2E G2A | G2E D2C | E2G A2B | c6 |" },
      { type: "arpeggios", abc: "CDE GAG | EDC DEG | ABc BAG | c6 |" }
    ]
  }

};

const keyOffsets = {
  "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "Bb": 10, "Eb": 3
};
function generateMusic() {
  const timeSig = document.getElementById('time-sig').value;
  const barsCount = parseInt(document.getElementById('bars-count').value);
  const keySig = document.getElementById('key-sig').value;
  const instKey = document.getElementById('instrument').value;
  const styleEl = document.getElementById('rhythm-style');
  const rhythmStyle = styleEl ? styleEl.value : 'all';
  const inst = instrumentConfig[instKey];

  const genrePatterns = patterns[currentGenre][timeSig] || patterns[currentGenre]["4/4"];
  let filteredPatterns = genrePatterns;

  if (rhythmStyle !== 'all') {
    const byType = genrePatterns.filter(p => p.type === rhythmStyle);
    if (byType.length > 0) filteredPatterns = byType;
  }

  const chosenObj = filteredPatterns[Math.floor(Math.random() * filteredPatterns.length)];
  const rawPattern = chosenObj.abc;

  let measures = rawPattern.split('|').filter(m => m.trim() !== '');
  while (measures.length < barsCount) {
    // La repetare, amestecăm ușor ordinea măsurilor interioare pentru variație
    const shuffled = [...measures].sort(() => Math.random() - 0.3);
    measures = measures.concat(shuffled);
  }
  const selectedMusic = measures.slice(0, barsCount).join(' | ') + ' |]';
  const totalTranspose = keyOffsets[keySig] + inst.transpose;

  const abcString = `
X: 1
T: ${currentGenre.toUpperCase()} - ${inst.name} (Gama: ${keySig})
M: ${timeSig}
L: 1/8
K: C
${selectedMusic}
`;

  renderAndPlay(abcString, "paper", "#audio-controls", inst.midi, totalTranspose);
}

function renderAndPlay(abcString, paperId, audioContainerId, midiProgram, transposeSemitones) {
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
    const audioContext = new AudioCtx();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const createSynth = new ABCJS.synth.CreateSynth();
    createSynth.init({
      audioContext: audioContext,
      visualObj: visualObj[0],
      options: {
        soundFontUrl: "./sfx/",
        program: midiProgram,
        midiTranspose: transposeSemitones
      }
    }).then(() => {
      synthControl.setTune(visualObj[0], false, {
        soundFontUrl: "./sfx/",
        program: midiProgram,
        midiTranspose: transposeSemitones
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
  masterVolume = val / 100;
  localStorage.setItem('studio_volume', masterVolume);

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
    el.volume = masterVolume;
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
