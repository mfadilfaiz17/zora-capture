const startBtn = document.getElementById('startBtn');
const retakeBtn = document.getElementById('retakeBtn');
const modeSelect = document.getElementById('modeSelect');
const modePickerBtn = document.getElementById('modePickerBtn');
const modeMenu = document.getElementById('modeMenu');
const modeOptions = document.querySelectorAll('#modeMenu .mode-option');
const timerSelect = document.getElementById('timerSelect');
const timerPickerBtn = document.getElementById('timerPickerBtn');
const timerMenu = document.getElementById('timerMenu');
const timerOptions = document.querySelectorAll('.timer-option');
const modePickerLabel = modePickerBtn.querySelector('.picker-label');
const timerPickerLabel = timerPickerBtn.querySelector('.picker-label');
const videoFeed = document.getElementById('videoFeed');
const opencvFeed = document.getElementById('opencvFeed');
const countdownEl = document.getElementById('countdown');
const flashEl = document.getElementById('flash');
const statusText = document.getElementById('statusText');
const controls = document.querySelector('.controls');
const boothMonitor = document.querySelector('.booth-monitor');
const reviewContainer = document.getElementById('reviewContainer');
const reviewBadge = document.getElementById('reviewBadge');
const reviewGrid = document.getElementById('reviewGrid');
const retakeAllBtn = document.getElementById('retakeAllBtn');
const continueToFramesBtn = document.getElementById('continueToFramesBtn');
const resultContainer = document.getElementById('resultContainer');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');
const customFrameInput = document.getElementById('customFrameInput');
const applyFrameBtn = document.getElementById('applyFrameBtn');
const framePreview = document.getElementById('framePreview');
const folderFrames = document.getElementById('folderFrames');
const framePickerLabel = document.getElementById('framePickerLabel');
const captureCanvas = document.getElementById('captureCanvas');
const enterBoothBtn = document.getElementById('enterBoothBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const boothApp = document.getElementById('boothApp');
const navLinks = document.querySelectorAll('.nav-link');
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');
const infoPanels = document.querySelectorAll('[data-panel-content]');
const musicAudio = document.getElementById('musicAudio');
const musicPicker = document.querySelector('.music-picker');
const musicPickerBtn = document.getElementById('musicPickerBtn');
const musicPickerLabel = document.getElementById('musicPickerLabel');
const songList = document.getElementById('songList');
const musicStatus = document.getElementById('musicStatus');
const cameraHelp = document.getElementById('cameraHelp');
const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const isStaticMode = document.body.dataset.mode === 'static' && !isLocalHost;
const songs = [
    { title: 'OTHERSIDE', source: 'diy_photoboth/static/music/Otherside.mp3' },
    { title: 'THIEF THEME', source: 'diy_photoboth/static/music/Thief Theme.mp3' },
    { title: 'WARD', source: 'diy_photoboth/static/music/Ward.mp3' }
];
const menuTriggers = [
    { trigger: musicPickerBtn, menu: songList },
    { trigger: modePickerBtn, menu: modeMenu },
    { trigger: timerPickerBtn, menu: timerMenu }
];
let currentSongIndex = 0;
let cameraStream = null;
let capturedFrames = [];
let collageImageUrl = '';
let customFrameUrl = '';
let isCapturing = false;
let musicIsOff = true;
let musicAutoplayPending = true;
let retakeIndex = null;

function updateSongButtons() {
    songList.querySelectorAll('.song-option[data-song-index]').forEach(button => {
        const isCurrent = !musicIsOff && Number(button.dataset.songIndex) === currentSongIndex;
        button.classList.toggle('selected', isCurrent);
        button.setAttribute('aria-selected', String(isCurrent));
        button.setAttribute('aria-current', isCurrent ? 'true' : 'false');
    });
}

function closeMenu(trigger, menu, restoreFocus = false) {
    menu.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) {
        trigger.focus();
    }
}

function setOptionSelected(options, selectedOption) {
    options.forEach(option => {
        option.setAttribute('aria-selected', String(option === selectedOption));
    });
}

function selectSong(index, shouldPlay = false) {
    currentSongIndex = (index + songs.length) % songs.length;
    const song = songs[currentSongIndex];
    musicIsOff = false;
    musicAudio.src = song.source;
    musicAudio.load();
    musicPickerLabel.innerText = song.title;
    musicStatus.innerText = `${song.title} // READY`;
    offButton.setAttribute('aria-selected', 'false');
    updateSongButtons();
    if (shouldPlay) {
        playSelectedSong();
    }
}

async function playSelectedSong() {
    try {
        await musicAudio.play();
        musicAutoplayPending = false;
        musicStatus.innerText = `${songs[currentSongIndex].title} // PLAYING`;
    } catch (error) {
        musicStatus.innerText = `${songs[currentSongIndex].title} // CLICK TO PLAY`;
    }
}

function turnMusicOff() {
    musicAudio.pause();
    musicAudio.removeAttribute('src');
    musicAudio.load();
    musicIsOff = true;
    musicAutoplayPending = false;
    musicPickerLabel.innerText = 'MUSIC OFF';
    musicStatus.innerText = 'MUSIC OFF';
    offButton.setAttribute('aria-selected', 'true');
    updateSongButtons();
}

const offButton = document.createElement('button');
offButton.className = 'song-option';
offButton.type = 'button';
offButton.role = 'option';
offButton.setAttribute('aria-selected', 'true');
offButton.innerText = 'MUSIC OFF';
offButton.addEventListener('click', () => {
    turnMusicOff();
    closeMenu(musicPickerBtn, songList, true);
});
songList.appendChild(offButton);

songs.forEach((song, index) => {
    const button = document.createElement('button');
    button.className = 'song-option';
    button.type = 'button';
    button.role = 'option';
    button.dataset.songIndex = String(index);
    button.innerText = `${index + 1}. ${song.title}`;
    button.addEventListener('click', () => {
        musicAutoplayPending = false;
        selectSong(index, true);
        closeMenu(musicPickerBtn, songList, true);
    });
    songList.appendChild(button);
});
musicPickerBtn.addEventListener('click', () => {
    const isOpen = !songList.classList.contains('hidden');
    songList.classList.toggle('hidden', isOpen);
    musicPickerBtn.setAttribute('aria-expanded', String(!isOpen));
});

document.addEventListener('click', event => {
    if (!event.target.closest('.music-picker')) {
        closeMenu(musicPickerBtn, songList);
    }
});

musicAudio.addEventListener('ended', () => {
    const nextSong = (currentSongIndex + 1) % songs.length;
    selectSong(nextSong, true);
});

function resumeDefaultMusic() {
    if (musicAutoplayPending && !musicIsOff && musicAudio.paused) {
        playSelectedSong();
    }
}

selectSong(0);
playSelectedSong();
window.addEventListener('pointerdown', resumeDefaultMusic);
window.addEventListener('keydown', resumeDefaultMusic);

async function loadFolderFrames(mode) {
    folderFrames.innerHTML = '';
    const manifestUrl = 'diy_photoboth/frames/frames.json';
    const response = await fetch(isStaticMode ? manifestUrl : `/frame-library/${mode}`);
    const data = await response.json();
    const result = isStaticMode ? { frames: data[mode] || [] } : data;
    result.frames.forEach(frame => {
        const button = document.createElement('button');
        button.className = 'pixel-btn folder-frame-option';
        button.type = 'button';
        button.innerText = frame.name.replace(/\.[^.]+$/, '');
        button.addEventListener('click', async () => {
            try {
                await renderTemplate(frame.url);
                framePickerLabel.innerText = frame.name.replace(/\.[^.]+$/, '').toUpperCase();
                statusText.innerText = `FRAME ${frame.name} APPLIED!`;
            } catch (error) {
                statusText.innerText = `ERROR: ${error.message}`;
            }
        });
        folderFrames.appendChild(button);
    });
}

function setModeDisabled(disabled) {
    modeSelect.disabled = disabled;
    modePickerBtn.disabled = disabled;
    timerSelect.disabled = disabled;
    timerPickerBtn.disabled = disabled;
}

modePickerBtn.addEventListener('click', () => {
    const isOpen = !modeMenu.classList.contains('hidden');
    modeMenu.classList.toggle('hidden', isOpen);
    modePickerBtn.setAttribute('aria-expanded', String(!isOpen));
});

modeOptions.forEach(option => {
    option.addEventListener('click', () => {
        modeSelect.value = option.dataset.value;
        modePickerLabel.innerText = option.innerText;
        setOptionSelected(modeOptions, option);
        closeMenu(modePickerBtn, modeMenu, true);
    });
});

timerPickerBtn.addEventListener('click', () => {
    const isOpen = !timerMenu.classList.contains('hidden');
    timerMenu.classList.toggle('hidden', isOpen);
    timerPickerBtn.setAttribute('aria-expanded', String(!isOpen));
});

timerOptions.forEach(option => {
    option.addEventListener('click', () => {
        timerSelect.value = option.dataset.value;
        timerPickerLabel.innerText = option.innerText;
        setOptionSelected(timerOptions, option);
        closeMenu(timerPickerBtn, timerMenu, true);
    });
});

document.addEventListener('click', event => {
    if (!event.target.closest('.mode-picker')) {
        closeMenu(modePickerBtn, modeMenu);
        closeMenu(timerPickerBtn, timerMenu);
    }
});

document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') {
        return;
    }
    menuTriggers.forEach(({ trigger, menu }) => {
        if (!menu.classList.contains('hidden')) {
            closeMenu(trigger, menu, true);
        }
    });
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function loadImage(source) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('The frame file could not be read.'));
        image.src = source;
    });
}

async function renderTemplate(frameSource = '') {
    const photo = await loadImage(collageImageUrl);
    const frame = frameSource ? await loadImage(frameSource) : null;
    const canvas = document.createElement('canvas');
    canvas.width = photo.naturalWidth || photo.width;
    canvas.height = photo.naturalHeight || photo.height;
    const context = canvas.getContext('2d');
    context.drawImage(photo, 0, 0, canvas.width, canvas.height);
    if (frame) {
        context.drawImage(frame, 0, 0, canvas.width, canvas.height);
    }
    const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
    resultImage.src = imageUrl;
    downloadBtn.href = imageUrl;
}

async function runCountdown(seconds) {
    countdownEl.classList.remove('hidden');
    for (let i = seconds; i > 0; i--) {
        countdownEl.innerText = i;
        await sleep(1000);
    }
    countdownEl.innerText = '';
    countdownEl.classList.add('hidden');
}

function triggerFlash() {
    flashEl.classList.remove('flash-anim');
    void flashEl.offsetWidth;
    flashEl.classList.add('flash-anim');
}

function prepareSingleRetake(index) {
    retakeIndex = index;
    reviewContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');
    controls.classList.remove('hidden');
    boothMonitor.classList.remove('hidden');
    boothApp.classList.remove('review-active');
    startBtn.innerText = `RETAKE PHOTO #${String(index + 1).padStart(2, '0')}`;
    statusText.innerText = `READY TO RETAKE PHOTO #${String(index + 1).padStart(2, '0')}. PRESS THE BUTTON WHEN READY.`;
    startBtn.focus();
}

async function capturePhoto(index) {
    const mode = parseInt(modeSelect.value);
    const timer = parseInt(timerSelect.value);
    statusText.innerText = `RETAKING PHOTO ${index + 1}/${mode}...`;
    await runCountdown(timer);

    if (isStaticMode) {
        capturedFrames[index] = captureStaticFrame(false);
    } else {
        const captureResponse = await fetch(`/retake/${index}`, { method: 'POST' });
        if (!captureResponse.ok) {
            const result = await captureResponse.json();
            throw new Error(result.message || 'The camera is not ready.');
        }

    }
    triggerFlash();
    statusText.innerText = `PHOTO ${index + 1} UPDATED!`;
}

async function getReviewImages() {
    if (isStaticMode) {
        return capturedFrames;
    }
    const response = await fetch('/captured-preview');
    const result = await response.json();
    if (!response.ok || !Array.isArray(result.frames)) {
        throw new Error('The captured photos could not be loaded.');
    }
    return result.frames;
}

async function showReview(mode) {
    const images = await getReviewImages();
    if (images.length !== mode) {
        throw new Error('The number of captured photos does not match the selected mode.');
    }
    reviewBadge.innerText = `✓ ${mode} PHOTOS CAPTURED`;
    reviewGrid.innerHTML = '';
    images.forEach((source, index) => {
        const card = document.createElement('article');
        card.className = 'review-card';
        const label = document.createElement('span');
        label.className = 'shot-label';
        label.innerText = `SHOT #${String(index + 1).padStart(2, '0')}`;
        const image = document.createElement('img');
        image.src = source;
        image.alt = `Captured photo ${index + 1}`;
        const retakeButton = document.createElement('button');
        retakeButton.className = 'pixel-btn retake-one-btn';
        retakeButton.type = 'button';
        retakeButton.innerText = '↻ RETAKE THIS PHOTO';
        retakeButton.addEventListener('click', () => {
            if (isCapturing) {
                return;
            }
            prepareSingleRetake(index);
        });
        card.append(label, image, retakeButton);
        reviewGrid.appendChild(card);
    });
    controls.classList.add('hidden');
    boothMonitor.classList.add('hidden');
    resultContainer.classList.add('hidden');
    boothApp.classList.add('review-active');
    reviewContainer.classList.remove('hidden');
    statusText.innerText = 'REVIEW COMPLETE. CHOOSE YOUR BEST SHOTS!';
}

async function generateCollage() {
    const mode = parseInt(modeSelect.value);
    statusText.innerText = 'PROCESSING 8-BIT DATA... LOADING...';
    let imageUrl;
    if (isStaticMode) {
        imageUrl = await generateStaticCollage(mode);
    } else {
        const generateResponse = await fetch(`/generate/${mode}`, { method: 'POST' });
        const result = await generateResponse.json();
        if (!generateResponse.ok || result.status !== 'success') {
            throw new Error(result.message || 'The collage could not be created.');
        }
        imageUrl = result.image_url;
    }
    resultImage.src = imageUrl;
    downloadBtn.href = imageUrl;
    collageImageUrl = imageUrl;
    await loadFolderFrames(mode);
    reviewContainer.classList.add('hidden');
    boothApp.classList.remove('review-active');
    resultContainer.classList.remove('hidden');
    statusText.innerText = 'COLLAGE READY! VERY RETRO!';
}

async function startCamera() {
    if (!isStaticMode) {
        cameraHelp.innerText = 'LOCAL CAMERA MODE: OPEN CV IS READING THE CAMERA. KEEP THIS PAGE OPEN WHILE CAPTURING.';
        opencvFeed.src = `/video_feed?time=${Date.now()}`;
        opencvFeed.onerror = () => {
            statusText.innerText = 'ERROR: OpenCV camera stream is unavailable.';
        };
        opencvFeed.classList.remove('hidden');
        videoFeed.classList.add('hidden');
        return;
    }

    cameraHelp.innerText = 'CAMERA ACCESS REQUIRES HTTPS OR LOCALHOST. ALLOW CAMERA PERMISSION WHEN PROMPTED.';
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('The camera requires HTTPS or localhost.');
    }

    const cameraConstraints = {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
    } catch (error) {
        if (error.name !== 'OverconstrainedError' && error.name !== 'NotFoundError') {
            throw new Error('Camera access was denied or the camera is already in use.');
        }
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    videoFeed.srcObject = cameraStream;
    videoFeed.classList.remove('hidden');
    opencvFeed.classList.add('hidden');
    videoFeed.setAttribute('playsinline', '');
    await new Promise(resolve => {
        if (videoFeed.readyState >= 1) {
            resolve();
        } else {
            videoFeed.addEventListener('loadedmetadata', resolve, { once: true });
        }
    });
    await videoFeed.play();
}

function stopCamera() {
    cameraStream?.getTracks().forEach(track => track.stop());
    cameraStream = null;
    videoFeed.srcObject = null;
    opencvFeed.removeAttribute('src');
    opencvFeed.classList.add('hidden');
}

function captureStaticFrame(append = true) {
    const context = captureCanvas.getContext('2d');
    const sourceWidth = videoFeed.videoWidth || captureCanvas.width;
    const sourceHeight = videoFeed.videoHeight || captureCanvas.height;
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = captureCanvas.width / captureCanvas.height;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    let cropX = 0;
    let cropY = 0;

    if (sourceRatio > targetRatio) {
        cropWidth = sourceHeight * targetRatio;
        cropX = (sourceWidth - cropWidth) / 2;
    } else if (sourceRatio < targetRatio) {
        cropHeight = sourceWidth / targetRatio;
        cropY = (sourceHeight - cropHeight) / 2;
    }

    context.save();
    context.translate(captureCanvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(
        videoFeed,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        captureCanvas.width,
        captureCanvas.height
    );
    context.restore();
    const frame = captureCanvas.toDataURL('image/jpeg', 0.9);
    if (append) {
        capturedFrames.push(frame);
    }
    return frame;
}

async function generateStaticCollage(mode) {
    const columns = 2;
    const rows = Math.ceil(mode / columns);
    const collageCanvas = document.createElement('canvas');
    collageCanvas.width = captureCanvas.width * columns;
    collageCanvas.height = captureCanvas.height * rows;
    const context = collageCanvas.getContext('2d');

    context.fillStyle = '#000';
    context.fillRect(0, 0, collageCanvas.width, collageCanvas.height);
    await Promise.all(capturedFrames.map((source, index) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const x = (index % columns) * captureCanvas.width;
            const y = Math.floor(index / columns) * captureCanvas.height;
            context.drawImage(image, x, y, captureCanvas.width, captureCanvas.height);
            resolve();
        };
        image.onerror = reject;
        image.src = source;
    })));

    return collageCanvas.toDataURL('image/jpeg', 0.92);
}

function showPanel(panelName) {
    infoPanels.forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.panelContent !== panelName);
    });
    siteNav.classList.remove('hidden');
    siteNav.classList.remove('mobile-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.panel === panelName);
    });
    boothApp.classList.add('hidden');
}

navLinks.forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        showPanel(link.dataset.panel);
        window.history.replaceState(null, '', `#${link.dataset.panel}`);
    });
});

navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('mobile-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
});

enterBoothBtn.addEventListener('click', async () => {
    infoPanels.forEach(panel => panel.classList.add('hidden'));
    siteNav.classList.add('hidden');
    siteNav.classList.remove('mobile-open');
    navToggle.setAttribute('aria-expanded', 'false');
    boothApp.classList.remove('hidden');
    backToHomeBtn.classList.remove('hidden');
    navLinks.forEach(link => link.classList.remove('active'));
    try {
        if (!cameraStream) {
            await startCamera();
        }
    } catch (error) {
        statusText.innerText = `ERROR: ${error.message}`;
    }
});

backToHomeBtn.addEventListener('click', () => {
    if (isCapturing) {
        return;
    }
    backToHomeBtn.classList.add('hidden');
    stopCamera();
    retakeIndex = null;
    startBtn.innerText = 'START PHOTO';
    resultContainer.classList.add('hidden');
    reviewContainer.classList.add('hidden');
    boothApp.classList.remove('review-active');
    controls.classList.remove('hidden');
    boothMonitor.classList.remove('hidden');
    boothApp.classList.add('hidden');
    siteNav.classList.remove('hidden');
    showPanel('home');
    window.history.replaceState(null, '', '#home');
    statusText.innerText = 'TAKE YOUR MOMENT! 0__0';
});

const initialPanel = window.location.hash.slice(1);
if (['faq', 'privacy', 'contact'].includes(initialPanel)) {
    showPanel(initialPanel);
}

startBtn.addEventListener('click', async () => {
    const mode = parseInt(modeSelect.value);
    const timer = parseInt(timerSelect.value);
    const selectedRetakeIndex = retakeIndex;
    isCapturing = true;
    backToHomeBtn.classList.add('hidden');
    startBtn.disabled = true;
    setModeDisabled(true);

    try {
        if (selectedRetakeIndex !== null) {
            if (isStaticMode) {
                if (!cameraStream) {
                    await startCamera();
                }
            } else if (!opencvFeed.src) {
                await startCamera();
            }
            await capturePhoto(selectedRetakeIndex);
            retakeIndex = null;
            startBtn.innerText = 'START PHOTO';
            await showReview(mode);
            return;
        }

        if (isStaticMode) {
            capturedFrames = [];
            if (!cameraStream && isStaticMode) {
                await startCamera();
            } else if (!isStaticMode && !opencvFeed.src) {
                await startCamera();
            }
        } else {
            await fetch('/reset', { method: 'POST' });
        }

        for (let i = 1; i <= mode; i++) {
            statusText.innerText = `CAPTURING PHOTO ${i}/${mode}...`;
            await runCountdown(timer);

            if (isStaticMode) {
                captureStaticFrame();
            } else {
                const captureResponse = await fetch('/capture', { method: 'POST' });
                if (!captureResponse.ok) {
                    throw new Error('The camera is not ready.');
                }
            }

            triggerFlash();
            statusText.innerText = `PHOTO ${i} SAVED!`;
            await sleep(700);
        }

        await showReview(mode);
    } catch (error) {
        statusText.innerText = `ERROR: ${error.message}`;
    } finally {
        isCapturing = false;
        startBtn.disabled = false;
        setModeDisabled(false);
    }
});

retakeBtn.addEventListener('click', async () => {
    if (isStaticMode) {
        capturedFrames = [];
    } else {
        await fetch('/reset', { method: 'POST' });
    }
    resultImage.removeAttribute('src');
    collageImageUrl = '';
    if (customFrameUrl) {
        URL.revokeObjectURL(customFrameUrl);
    }
    customFrameUrl = '';
    framePreview.removeAttribute('src');
    framePreview.classList.add('hidden');
    customFrameInput.value = '';
    folderFrames.innerHTML = '';
    framePickerLabel.innerText = 'CHOOSE FRAME';
    retakeIndex = null;
    startBtn.innerText = 'START PHOTO';
    backToHomeBtn.classList.remove('hidden');
    controls.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    reviewContainer.classList.add('hidden');
    boothApp.classList.remove('review-active');
    boothMonitor.classList.remove('hidden');
    statusText.innerText = 'TAKE YOUR MOMENT! 0__0';
});

retakeAllBtn.addEventListener('click', async () => {
    if (isCapturing) {
        return;
    }
    if (isStaticMode) {
        capturedFrames = [];
    } else {
        await fetch('/reset', { method: 'POST' });
    }
    retakeIndex = null;
    startBtn.innerText = 'START PHOTO';
    backToHomeBtn.classList.remove('hidden');
    reviewContainer.classList.add('hidden');
    boothApp.classList.remove('review-active');
    controls.classList.remove('hidden');
    boothMonitor.classList.remove('hidden');
    statusText.innerText = 'TAKE YOUR MOMENT! 0__0';
});

continueToFramesBtn.addEventListener('click', async () => {
    if (isCapturing) {
        return;
    }
    isCapturing = true;
    continueToFramesBtn.disabled = true;
    retakeAllBtn.disabled = true;
    try {
        await generateCollage();
    } catch (error) {
        statusText.innerText = `ERROR: ${error.message}`;
    } finally {
        isCapturing = false;
        continueToFramesBtn.disabled = false;
        retakeAllBtn.disabled = false;
    }
});

applyFrameBtn.addEventListener('click', async () => {
    applyFrameBtn.disabled = true;
    try {
        if (!customFrameUrl) {
            throw new Error('Choose a custom frame file first.');
        }
        await renderTemplate(customFrameUrl);
        framePickerLabel.innerText = 'CUSTOM FRAME';
        statusText.innerText = 'CUSTOM FRAME APPLIED!';
    } catch (error) {
        statusText.innerText = `ERROR: ${error.message}`;
    } finally {
        applyFrameBtn.disabled = false;
    }
});

customFrameInput.addEventListener('change', () => {
    const file = customFrameInput.files[0];
    if (!file) {
        return;
    }
    if (customFrameUrl) {
        URL.revokeObjectURL(customFrameUrl);
    }
    customFrameUrl = URL.createObjectURL(file);
    framePreview.src = customFrameUrl;
    framePreview.classList.remove('hidden');
});
