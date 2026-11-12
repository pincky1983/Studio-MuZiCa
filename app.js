let currentGenre = 'jazz';
let synthControl = null;
let lastScannedAbc = "";

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
      "D2 F2 A2 c2 | B2 G2 F2 D2 | E2 G2 B2 d2 | c4 z4 |",
      "c2 B2 A2 G2 | ^F2 G2 A2 ^A2 | B2 d2 g2 f2 | e4 z4 |",
      "_E2 G2 _B2 d2 | _A2 c2 _e2 g2 | D2 F2 A2 c2 | G2 B2 d2 f2 |"
    ],
    "3/4": ["D2 F2 A2 | G2 B2 d2 | c2 e2 g2 | c6 |"],
    "2/4": ["D2 F2 | G2 B2 | c2 e2 | c4 |"],
    "6/8": ["D2F A2c | B2G F2D | E2G B2d | c6 |"]
  },
  blues: {
    "4/4": [
      "C2 _E2 F2 ^F2 | G2 _B2 c2 _E2 | F2 _A2 B2 d2 | c4 z4 |",
      "c2 _B2 G2 F2 | _E2 C2 _B,2 C2 | G2 F2 _E2 C2 | C4 z4 |"
    ],
    "3/4": ["C2 _E2 F2 | ^F2 G2 _B2 | c2 _B2 G2 | C6 |"],
    "2/4": ["C2 _E2 | F2 ^F2 | G2 _B2 | c4 |"],
    "6/8": ["C2_E F2^F | G2_B c2_B | G2F _E2C | C6 |"]
  },
  gospel: {
    "4/4": [
      "C2 D2 E2 G2 | A2 c2 d2 e2 | f2 d2 B2 G2 | c4 z4 |",
      "E2 G2 c2 e2 | F2 A2 d2 f2 | ^F2 A2 c2 ^d2 | G2 B2 d2 g2 |"
    ],
    "3/4": ["C2 E2 G2 | F2 A2 c2 | G2 B2 d2 | c6 |"],
    "2/4": ["C2 E2 | F2 A2 | G2 B2 | c4 |"],
    "6/8": ["C2E G2c | A2F D2F | G2B d2B | c6 |"]
  }
};

const instrumentConfig = {
  piano:      { transpose: 0,  midi: 0,  name: "Pian" },
  trumpet_c:  { transpose: 0,  midi: 56, name: "Trompeta Do" },
  guitar:     { transpose: 0,  midi: 24, name: "Chitara" },
  trumpet_bb: { transpose: 2,  midi: 56, name: "Trompeta Sib" },
  sax_tenor:  { transpose: 14, midi: 66, name: "Sax Tenor" },
  sax_alto:   { transpose: 9,  midi: 65, name: "Sax Alto" }
};

const keyOffsets = {
  "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "Bb": 10, "Eb": 3
};

function generateMusic() {
  const timeSig = document.getElementById('time-sig').value;
  const barsCount = parseInt(document.getElementById('bars-count').value);
  const keySig = document.getElementById('key-sig').value;
  const instKey = document.getElementById('instrument').value;
  const inst = instrumentConfig[instKey];

  const availablePatterns = patterns[currentGenre][timeSig] || patterns[currentGenre]["4/4"];
  const rawPattern = availablePatterns.at(Math.floor(Math.random() * availablePatterns.length));

  let measures = rawPattern.split('|').filter(m => m.trim() !== '');
  while (measures.length < barsCount) {
    measures = measures.concat(measures);
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

    const createSynth = new ABCJS.synth.CreateSynth();
    createSynth.init({
      visualObj: visualObj,
      options: { program: midiProgram, midiTranspose: transposeSemitones }
    }).then(() => {
      synthControl.setTune(visualObj, false, {
        program: midiProgram,
        midiTranspose: transposeSemitones
      });
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

    const response = await fetch(`https://googleapis.com{apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "Ești un expert în recunoaștere optică muzicală (OMR). Analizează acest document sau imagine cu o partitură muzicală și transcrie melodia principală în format standard ABC notation. Returnează DOAR codul ABC brut, fără explicații, fără blocuri markdown (fără ```abc). Asigură-te că include antetele X:1, M: (măsura), L:1/8, K: (gama) și notele."
            },
            {
              inline_data: {
                mime_type: file.type,
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
    lastScannedAbc = rawAbc.replace(/```abc/g, '').replace(/```/g, '').trim();

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
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',').at(1));
    reader.onerror = error => reject(error);
  });
}