const textInput = document.getElementById('text-input');
const convertBtn = document.getElementById('convert-btn');
const outputContainer = document.getElementById('output-container');
const placeholderText = document.getElementById('placeholder-text');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const textDisplayContainer = document.getElementById('text-display-container'); 
const videoUpload = document.getElementById('video-upload');
const loadingSpinner = document.getElementById('loading-spinner');

let animationTimeout = null; 
let currentWordIndex = -1; 
let charToWordMap = [];

// --- 1. HANDLE VIDEO UPLOAD TO FLASK ---
if (videoUpload) {
    videoUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // UI Updates
        loadingSpinner.style.display = 'block';
        textInput.value = "Processing video... please wait...";
        textInput.disabled = true;

        const formData = new FormData();
        formData.append('video', file);

        try {
            const response = await fetch('/transcribe', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.error) {
                alert("Server Error: " + data.error);
                textInput.value = "";
            } else {
                textInput.value = data.text; // Fill text box
                startAnimation(); // Auto-start
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Network Error: Could not connect to server.");
            textInput.value = "";
        } finally {
            loadingSpinner.style.display = 'none';
            textInput.disabled = false;
        }
    });
}

// --- 2. MAP TO MP4 VIDEOS ---
// IMPORTANT: Ensure your videos are in 'static/hand_videos/' folder
const signVideoMap = {
    'A': '/static/hand_videos/A.mp4',
    'B': '/static/hand_videos/B.mp4',
    'C': '/static/hand_videos/C.mp4',
    'D': '/static/hand_videos/D.mp4',
    'E': '/static/hand_videos/E.mp4',
    'F': '/static/hand_videos/F.mp4',
    'G': '/static/hand_videos/G.mp4',
    'H': '/static/hand_videos/H.mp4',
    'I': '/static/hand_videos/I.mp4',
    'J': '/static/hand_videos/J.mp4',
    'K': '/static/hand_videos/K.mp4',
    'L': '/static/hand_videos/L.mp4',
    'M': '/static/hand_videos/M.mp4',
    'N': '/static/hand_videos/N.mp4',
    'O': '/static/hand_videos/O.mp4',
    'P': '/static/hand_videos/P.mp4',
    'Q': '/static/hand_videos/Q.mp4',
    'R': '/static/hand_videos/R.mp4',
    'S': '/static/hand_videos/S.mp4',
    'T': '/static/hand_videos/T.mp4',
    'U': '/static/hand_videos/U.mp4',
    'V': '/static/hand_videos/V.mp4',
    'W': '/static/hand_videos/W.mp4',
    'X': '/static/hand_videos/X.mp4',
    'Y': '/static/hand_videos/Y.mp4',
    'Z': '/static/hand_videos/Z.mp4',
    '0': '/static/hand_videos/0.mp4',
    '1': '/static/hand_videos/1.mp4',
    '2': '/static/hand_videos/2.mp4',
    '3': '/static/hand_videos/3.mp4',
    '4': '/static/hand_videos/4.mp4',
    '5': '/static/hand_videos/5.mp4',
    '6': '/static/hand_videos/6.mp4',
    '7': '/static/hand_videos/7.mp4',
    '8': '/static/hand_videos/8.mp4',
    '9': '/static/hand_videos/9.mp4',
    ' ': 'space' 
};

convertBtn.addEventListener('click', startAnimation);

// Update slider text
speedSlider.addEventListener('input', () => {
    // We display "Speed Factor" now, roughly calculated
    // 1000ms = 1x, 500ms = 2x, 2000ms = 0.5x
    const val = parseInt(speedSlider.value);
    const rate = (1000 / val).toFixed(1); 
    speedValue.textContent = `${rate}x Speed`;
});


function startAnimation() {
    // Reset previous state
    if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
    }
    
    // Stop any currently playing video
    const currentVideo = outputContainer.querySelector('video');
    if (currentVideo) {
        currentVideo.pause();
        currentVideo.removeAttribute('src');
    }

    if (placeholderText) placeholderText.style.display = 'none';
    outputContainer.innerHTML = '';
    textDisplayContainer.innerHTML = ''; 
    currentWordIndex = -1; 
    charToWordMap = []; 

    const text = textInput.value.toUpperCase();
    setupWordDisplay(text); 

    const characters = text.split('');
    
    if (characters.length === 0) {
        outputContainer.innerHTML = '<p class="text-gray-500">Please enter some text to convert.</p>';
        return;
    }

    // Begin the chain
    playNextCharacter(characters, 0);
}

// --- 3. RECURSIVE PLAYBACK LOGIC ---
function playNextCharacter(chars, index) {
    // End Condition
    if (index >= chars.length) {
        showDoneState();
        return;
    }

    const targetWordIndex = charToWordMap[index];
    updateHighlight(targetWordIndex);

    const char = chars[index];
    const videoUrl = signVideoMap[char];
    let signElement;
    
    let isVideo = false;
    if (videoUrl && videoUrl !== 'space') {
        isVideo = true;
        signElement = createSignElement(char, videoUrl, false, true);
    } else if (videoUrl === 'space') {
        signElement = createSignElement('(Space)', null);
    } else {
        signElement = createSignElement(char, null, true); // Unknown
    }

    outputContainer.innerHTML = '';
    outputContainer.appendChild(signElement);

    // --- TIMING LOGIC ---
    if (isVideo) {
        // VIDEO: Use 'onended' event
        const videoEl = signElement.querySelector('video');
        
        // Calculate Speed
        const sliderVal = parseInt(speedSlider.value, 10);
        const playbackRate = 1000 / sliderVal; // 1000ms base
        videoEl.playbackRate = playbackRate;

        // When video finishes, play next
        videoEl.onended = () => {
            playNextCharacter(chars, index + 1);
        };

        // If video fails, skip it after timeout
        videoEl.onerror = () => {
            console.warn(`Video missing for: ${char}`);
            setTimeout(() => playNextCharacter(chars, index + 1), sliderVal);
        };

    } else {
        // NON-VIDEO (Space/Unknown): Use Timer
        const delay = parseInt(speedSlider.value, 10);
        animationTimeout = setTimeout(() => {
            playNextCharacter(chars, index + 1);
        }, delay);
    }
}

function showDoneState() {
    const doneElement = createSignElement('Done', null);
    doneElement.querySelector('.sign-content-container').innerHTML = `
        <svg class="w-20 h-20 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
    `;
    outputContainer.innerHTML = ''; 
    outputContainer.appendChild(doneElement);
    updateHighlight(-1);
}

// --- 4. ELEMENT CREATOR ---
function createSignElement(char, url, isUnknown = false, isVideo = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'animate-fade-in flex flex-col items-center justify-center text-center';
    
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'sign-content-container w-64 h-64 rounded-lg shadow-md bg-white flex items-center justify-center mb-4 overflow-hidden';
    
    if (isUnknown) {
        mediaContainer.classList.add('border-2', 'border-dashed', 'border-red-400');
        mediaContainer.innerHTML = `<span class="text-6xl font-bold text-red-500">?</span>`;
    } else if (url) {
        if (isVideo) {
            // VIDEO TAG
            mediaContainer.innerHTML = `
                <video 
                    src="${url}" 
                    autoplay 
                    muted 
                    playsinline 
                    class="w-full h-full object-cover"
                ></video>
            `;
        } else {
            // IMAGE FALLBACK
            mediaContainer.innerHTML = `
                <img src="${url}" alt="${char}" class="w-full h-full object-contain">
            `;
        }
    } else {
        // SPACE
        mediaContainer.classList.add('bg-gray-100');
        mediaContainer.innerHTML = `<span class="text-3xl font-semibold text-gray-500">${char}</span>`;
    }

    const charText = document.createElement('p');
    charText.className = 'text-5xl font-bold text-gray-700';
    
    if (char !== 'Done') {
        charText.textContent = char;
    }

    wrapper.appendChild(mediaContainer);
    wrapper.appendChild(charText);
    
    return wrapper;
}

// --- 5. HELPERS ---
function setupWordDisplay(text) {
    const parts = text.split(/(\s+)/); 
    let wordCounter = 0;

    parts.forEach(part => {
        if (part.trim().length === 0) {
            textDisplayContainer.appendChild(document.createTextNode(part));
            for (let i = 0; i < part.length; i++) {
                charToWordMap.push(-1);
            }
        } else {
            const wordSpan = document.createElement('span');
            wordSpan.id = `word-${wordCounter}`;
            wordSpan.className = 'word-span';
            wordSpan.textContent = part;
            textDisplayContainer.appendChild(wordSpan);
            for (let i = 0; i < part.length; i++) {
                charToWordMap.push(wordCounter);
            }
            wordCounter++;
        }
    });
}

function updateHighlight(newWordIndex) {
    if (newWordIndex === currentWordIndex) return; 
    
    if (currentWordIndex !== -1) {
        const oldWordEl = document.getElementById(`word-${currentWordIndex}`);
        if (oldWordEl) oldWordEl.classList.remove('highlighted-word');
    }
    
    if (newWordIndex !== -1) {
        const newWordEl = document.getElementById(`word-${newWordIndex}`);
        if (newWordEl) newWordEl.classList.add('highlighted-word');
    }
    currentWordIndex = newWordIndex;
}