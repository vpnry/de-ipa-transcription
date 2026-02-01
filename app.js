import ipaDict from './ipa_dict.js';

const inputText = document.getElementById('inputText');
const ipaPosition = document.getElementById('ipaPosition');
const ipaLevel = document.getElementById('ipaLevel');
const outputContainer = document.getElementById('outputContainer');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');
const copyBtn = document.getElementById('copyBtn');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');

// Theme Handling
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    sunIcon.classList.toggle('hidden', !isLight);
    moonIcon.classList.toggle('hidden', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

initTheme();

// Font Size Handling
function initFontSize() {
    const savedFontSize = localStorage.getItem('fontSize') || '100';
    fontSizeSlider.value = savedFontSize;
    updateFontSize(savedFontSize);
}

function updateFontSize(value) {
    const scale = (value / 100) * 2; // Multiply by 2 for dramatic changes
    outputContainer.style.fontSize = scale + 'rem';
    fontSizeValue.textContent = value + '%';
}

fontSizeSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    updateFontSize(value);
    localStorage.setItem('fontSize', value);
});

initFontSize();

// Toggle Settings Panel
settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
});

// Settings Persistence
function initSettings() {
    const savedPosition = localStorage.getItem('ipaPosition');
    const savedLevel = localStorage.getItem('ipaLevel');
    
    if (savedPosition) {
        ipaPosition.value = savedPosition;
    }
    if (savedLevel) {
        ipaLevel.value = savedLevel;
    }
}

ipaPosition.addEventListener('change', (e) => {
    localStorage.setItem('ipaPosition', e.target.value);
    transcribe();
});

ipaLevel.addEventListener('change', (e) => {
    localStorage.setItem('ipaLevel', e.target.value);
    transcribe();
});

initSettings();

// Main Input Handler
let debounceTimer;
inputText.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(transcribe, 300);
});

function transcribe() {
    const text = inputText.value.trim();
    if (!text) {
        outputContainer.innerHTML = '<div class="placeholder">Die Ergebnisse erscheinen hier...</div>';
        return;
    }

    const position = ipaPosition.value;
    const level = ipaLevel.value;
    const paragraphs = text.split(/\n\s*\n/);
    
    let html = '';

    paragraphs.forEach(para => {
        if (level === 'word') {
            html += renderWordByWord(para, position);
        } else if (level === 'line') {
            html += renderLineByLine(para, position);
        } else if (level === 'paragraph') {
            html += renderInterlinearParagraph(para, position);
        }
    });

    outputContainer.innerHTML = html;
}

function getIpa(word, includeStress = true) {
    // Clean word for lookup (remove punctuation, to lowercase)
    const clean = word.toLowerCase().replace(/[.,!?;:()]/g, '');
    let ipa = ipaDict[clean] || word;
    
    if (ipa !== word && !includeStress) {
        // Remove stress marks ˈ and ˌ
        ipa = ipa.replace(/[ˈˌ]/g, '');
    }
    
    return ipa;
}

function tokenize(text) {
    // Split by whitespace but keep punctuation attached to words for display
    // or separate it? Let's keep it simple: split by spaces and handle trailing punct.
    return text.split(/\s+/);
}

function renderIpaOnly(para) {
    const words = tokenize(para);
    const ipaWords = words.map(w => {
        const punctuation = w.match(/[.,!?;:()]+$/) || [''];
        const cleanWord = w.replace(/[.,!?;:()]+$/, '');
        const ipa = getIpa(cleanWord);
        return ipa + punctuation[0];
    });
    return `<div class="paragraph-block ipa-text-only">${ipaWords.join(' ')}</div>`;
}

function renderInterlinearParagraph(para, position) {
    const words = tokenize(para);
    const ipaWords = words.map(w => {
        const punctuation = w.match(/[.,!?;:()]+$/) || [''];
        const cleanWord = w.replace(/[.,!?;:()]+$/, '');
        const ipa = getIpa(cleanWord);
        return ipa + punctuation[0];
    });

    const blockClass = position === 'above' ? 'ipa-under' : 'ipa-above';

    return `
        <div class="paragraph-block display-flex ${blockClass}">
            <div class="text-line">${para}</div>
            <div class="ipa-line">${ipaWords.join(' ')}</div>
        </div>
    `;
}

function renderWordByWord(para, position) {
    const words = tokenize(para);
    const wordClass = position === 'above' ? 'ipa-above' : 'ipa-below';
    
    const wordHtml = words.map(w => {
        const punctuation = w.match(/[.,!?;:()]+$/) || [''];
        const cleanWord = w.replace(/[.,!?;:()]+$/, '');
        const ipa = getIpa(cleanWord);
        
        return `
            <span class="word-pair ${wordClass}">
                <span class="word-ipa">${ipa}${punctuation[0]}</span>
                <span class="word-orig">${cleanWord}${punctuation[0]}</span>
            </span>
        `;
    }).join(' ');

    return `<div class="paragraph-block">${wordHtml}</div>`;
}

function renderLineByLine(para, position) {
    const lines = para.split('\n').filter(l => l.trim());
    const blockClass = position === 'above' ? 'ipa-above' : 'ipa-under';

    const linesHtml = lines.map(line => {
        const words = tokenize(line);
        const ipaWords = words.map(w => {
            const punctuation = w.match(/[.,!?;:()]+$/) || [''];
            const cleanWord = w.replace(/[.,!?;:()]+$/, '');
            const ipa = getIpa(cleanWord);
            return ipa + punctuation[0];
        });
        
        return `
            <div class="line-block ${blockClass}">
                <div class="ipa-line">${ipaWords.join(' ')}</div>
                <div class="text-line">${line}</div>
            </div>
        `;
    }).join('');

    return `<div class="paragraph-block">${linesHtml}</div>`;
}

// Copy Button Handler
copyBtn.addEventListener('click', async () => {
    const outputText = outputContainer.innerText.trim();
    
    if (!outputText || outputText === 'Die Ergebnisse erscheinen hier...') {
        return;
    }
    
    try {
        await navigator.clipboard.writeText(outputText);
        
        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Kopiert!
        `;
        copyBtn.style.background = 'rgba(34, 197, 94, 0.2)';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        
        // Error feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            Fehler
        `;
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    }
});

