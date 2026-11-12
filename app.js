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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}, {
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
  container.innerHTML = saved.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:#1e1e1e; padding:10px 12px; border-radius:8px; border:1px solid #333;">
      <span onclick="loadSavedScore(${item.id})" style="cursor:pointer; flex:1; font-weight:500;">🎵 ${item.name}</span>
      <button onclick="deleteSavedScore(${item.id})" style="background:transparent; border:none; color:#ff5555; font-size:16px; cursor:pointer; padding:4px 8px;">🗑️</button>
    </div>
  `).join('');
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
    lastScannedAbc = lastScannedAbc.replace(/^Q:.*$/m, `Q:1/4=${newBpm}`);
  } else {
    lastScannedAbc = `Q:1/4=${newBpm}\n` + lastScannedAbc;
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
