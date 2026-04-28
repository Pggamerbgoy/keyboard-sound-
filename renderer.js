const { ipcRenderer } = require('electron');
const path = require('path');

let mappings = {};
let audioCache = {};

// UI Elements
const mappingGrid = document.getElementById('mappingGrid');
const keyboardLayout = document.getElementById('keyboardLayout');

// Full Keyboard Rows Definition
const ROWS = [
    ['ESC', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'BACKSPACE'],
    ['TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'ENTER'],
    ['L-SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'R-SHIFT'],
    ['CTRL', 'WIN', 'ALT', 'SPACE', 'ALT', 'FN', 'CTRL']
];

// Keycode Mapper (matches ROWS)
// Note: Keycodes can vary by OS/Library. These are common uIOhook values for Windows.
const KEY_MAP = {
    1: 'ESC', 59: 'F1', 60: 'F2', 61: 'F3', 62: 'F4', 63: 'F5', 64: 'F6', 65: 'F7', 66: 'F8', 67: 'F9', 68: 'F10', 87: 'F11', 88: 'F12',
    41: '`', 2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0', 12: '-', 13: '=', 14: 'BACKSPACE',
    15: 'TAB', 16: 'Q', 17: 'W', 18: 'E', 19: 'R', 20: 'T', 21: 'Y', 22: 'U', 23: 'I', 24: 'O', 25: 'P', 26: '[', 27: ']', 43: '\\',
    58: 'CAPS', 30: 'A', 31: 'S', 32: 'D', 33: 'F', 34: 'G', 35: 'H', 36: 'J', 37: 'K', 38: 'L', 39: ';', 40: "'", 28: 'ENTER',
    42: 'L-SHIFT', 44: 'Z', 45: 'X', 46: 'C', 47: 'V', 48: 'B', 49: 'N', 50: 'M', 51: ',', 52: '.', 53: '/', 54: 'R-SHIFT',
    29: 'CTRL', 3675: 'WIN', 56: 'ALT', 57: 'SPACE', 3640: 'ALT', 3613: 'CTRL'
};

function generateKeyboard() {
    keyboardLayout.innerHTML = '';
    ROWS.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'key-row';
        row.forEach(keyText => {
            const keyDiv = document.createElement('div');
            // Size mapping
            let sizeClass = '';
            if (['BACKSPACE', 'ENTER', 'CAPS', 'L-SHIFT', 'TAB'].includes(keyText)) sizeClass = 'wide';
            if (['R-SHIFT'].includes(keyText)) sizeClass = 'extra-wide';
            if (keyText === 'SPACE') sizeClass = 'space';
            
            keyDiv.className = `key ${sizeClass}`;
            keyDiv.id = `key-${keyText}`;
            keyDiv.innerText = keyText;
            keyDiv.onclick = () => selectFileForKey(keyText);
            rowDiv.appendChild(keyDiv);
        });
        keyboardLayout.appendChild(rowDiv);
    });
}

async function selectFileForKey(key) {
    const result = await ipcRenderer.invoke('open-file-dialog');
    if (result && !result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        saveMapping(key, filePath);
    }
}

function saveMapping(key, filePath) {
    mappings[key] = filePath;
    audioCache[key] = new Audio(filePath);
    ipcRenderer.send('save-mapping', { key, path: filePath });
    renderMappings();
    updateKeyboardState();
}

async function init() {
    mappings = await ipcRenderer.invoke('get-mappings');
    generateKeyboard();
    renderMappings();
    updateKeyboardState();
}

function renderMappings() {
    mappingGrid.innerHTML = '';
    const keys = Object.keys(mappings);
    keys.forEach(key => {
        const mapping = mappings[key];
        const filePath = typeof mapping === 'string' ? mapping : mapping.path;
        
        const card = document.createElement('div');
        card.className = 'mapping-card';
        card.innerHTML = `
            <div class="remove-btn" onclick="event.stopPropagation(); deleteMapping('${key}')">×</div>
            <div class="key-icon">${key.charAt(0)}</div>
            <div class="sound-info">
                <div class="sound-name">${path.basename(filePath)}</div>
                <div class="sound-path">${key} Key • Click to Edit</div>
            </div>
        `;
        card.onclick = () => openEditor(key);
        mappingGrid.appendChild(card);
        
        if (!audioCache[key]) {
            audioCache[key] = new Audio(filePath);
        }
    });

    if (keys.length > 0) {
        anime({
            targets: '.mapping-card',
            translateY: [10, 0],
            opacity: [0, 1],
            delay: anime.stagger(50),
            easing: 'easeOutQuad'
        });
    }
}

function updateKeyboardState() {
    document.querySelectorAll('.key').forEach(k => k.classList.remove('mapped'));
    Object.keys(mappings).forEach(key => {
        const keyEl = document.getElementById(`key-${key}`);
        if (keyEl) keyEl.classList.add('mapped');
    });
}

function deleteMapping(key) {
    ipcRenderer.send('delete-mapping', key);
    delete mappings[key];
    delete audioCache[key];
    renderMappings();
    updateKeyboardState();
}

function clearAllMappings() {
    if (confirm("Are you sure you want to remove ALL sounds?")) {
        ipcRenderer.send('clear-all-mappings');
        mappings = {};
        audioCache = {};
        renderMappings();
        updateKeyboardState();
    }
}

let editingKey = null;

function openEditor(key) {
    editingKey = key;
    const mapping = mappings[key];
    const trim = mapping.trim || { start: 0, end: 1 };
    
    document.getElementById('editorTitle').innerText = `Edit ${key} Key`;
    document.getElementById('trimStart').value = trim.start;
    document.getElementById('trimEnd').value = trim.end;
    document.getElementById('editorModal').style.display = 'flex';
}

function closeEditor() {
    document.getElementById('editorModal').style.display = 'none';
    editingKey = null;
}

function testTrim() {
    if (!editingKey || !audioCache[editingKey]) return;
    const start = parseFloat(document.getElementById('trimStart').value);
    const end = parseFloat(document.getElementById('trimEnd').value);
    
    const audio = audioCache[editingKey];
    audio.currentTime = start;
    audio.play();
    
    setTimeout(() => {
        audio.pause();
    }, (end - start) * 1000);
}

function saveTrim() {
    if (!editingKey) return;
    const start = parseFloat(document.getElementById('trimStart').value);
    const end = parseFloat(document.getElementById('trimEnd').value);
    
    // Update mapping with trim data
    if (typeof mappings[editingKey] === 'string') {
        mappings[editingKey] = { path: mappings[editingKey], trim: { start, end } };
    } else {
        mappings[editingKey].trim = { start, end };
    }
    
    ipcRenderer.send('save-mapping', { key: editingKey, ...mappings[editingKey] });
    closeEditor();
}

let useProfiles = false;
let masterVolume = 1.0;

document.getElementById('masterVolume').addEventListener('input', (e) => {
    masterVolume = parseFloat(e.target.value);
});

function toggleAppProfiles() {
    useProfiles = !useProfiles;
    const toggle = document.getElementById('profileToggle');
    if (useProfiles) {
        toggle.classList.add('on');
        alert('App Profiles Enabled! (KeySound will adapt to your active window)');
    } else {
        toggle.classList.remove('on');
    }
    ipcRenderer.send('toggle-profiles', useProfiles);
}

function exportPack() {
    ipcRenderer.send('export-ksp', mappings);
}

function importPack() {
    ipcRenderer.send('import-ksp');
}

function playSound(key) {
    const mapping = mappings[key];
    let audio = audioCache[key];
    
    // For overlapping sounds, we could clone the node, but simple playback rate change is good enough for organic feel
    if (audio) {
        const trim = (typeof mapping === 'object' && mapping.trim) ? mapping.trim : { start: 0, end: audio.duration || 10 };
        
        // Organic Pitch Randomization (+/- 3%)
        const pitchShift = 0.97 + (Math.random() * 0.06);
        audio.playbackRate = pitchShift;
        audio.volume = masterVolume;
        
        audio.currentTime = trim.start;
        audio.play();
        
        if (trim.end) {
            setTimeout(() => {
                // Only pause if not re-triggered recently
                audio.pause();
            }, (trim.end - trim.start) * 1000);
        }
        
        const keyEl = document.getElementById(`key-${key}`);
        if (keyEl) {
            keyEl.classList.add('active');
            setTimeout(() => keyEl.classList.remove('active'), 100);
        }
    }
}

ipcRenderer.on('key-down', (event, keycode) => {
    const key = KEY_MAP[keycode];
    if (key) {
        playSound(key);
    }
});

// Window Controls
document.getElementById('minimizeBtn').onclick = () => ipcRenderer.send('minimize');
document.getElementById('closeBtn').onclick = () => ipcRenderer.send('close');

function applyPreset(type) {
    const soundPath = path.join(__dirname, 'presets', 'mechanical', `${type}.wav`);
    
    // Map common keys to this sound
    const keysToMap = ['Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M','SPACE','ENTER'];
    
    keysToMap.forEach(key => {
        mappings[key] = { path: soundPath, trim: { start: 0, end: 0.1 } };
        audioCache[key] = new Audio(soundPath);
    });
    
    ipcRenderer.send('save-mapping-bulk', mappings);
    renderMappings();
    updateKeyboardState();
    alert(`Applied ${type} switch sound pack!`);
}

init();
