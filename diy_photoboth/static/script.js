const startBtn = document.getElementById('startBtn');
const retakeBtn = document.getElementById('retakeBtn');
const modeSelect = document.getElementById('modeSelect');
const modePickerBtn = document.getElementById('modePickerBtn');
const modeMenu = document.getElementById('modeMenu');
const modeOptions = document.querySelectorAll('.mode-option');
const videoFeed = document.getElementById('videoFeed');
const countdownEl = document.getElementById('countdown');
const flashEl = document.getElementById('flash');
const statusText = document.getElementById('statusText');
const controls = document.querySelector('.controls');
const boothMonitor = document.querySelector('.booth-monitor');
const resultContainer = document.getElementById('resultContainer');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');
const customFrameInput = document.getElementById('customFrameInput');
const applyFrameBtn = document.getElementById('applyFrameBtn');
const framePreview = document.getElementById('framePreview');
const folderFrames = document.getElementById('folderFrames');
const captureCanvas = document.getElementById('captureCanvas');
const isStaticMode = document.body.dataset.mode === 'static';
let cameraStream = null;
let capturedFrames = [];
let collageImageUrl = '';
let customFrameUrl = '';

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
                statusText.innerText = `FRAME ${frame.name} DIPASANG!`;
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
}

modePickerBtn.addEventListener('click', () => {
    const isOpen = !modeMenu.classList.contains('hidden');
    modeMenu.classList.toggle('hidden', isOpen);
    modePickerBtn.setAttribute('aria-expanded', String(!isOpen));
});

modeOptions.forEach(option => {
    option.addEventListener('click', () => {
        modeSelect.value = option.dataset.value;
        modePickerBtn.innerText = option.innerText;
        modeMenu.classList.add('hidden');
        modePickerBtn.setAttribute('aria-expanded', 'false');
    });
});

document.addEventListener('click', event => {
    if (!event.target.closest('.mode-picker')) {
        modeMenu.classList.add('hidden');
        modePickerBtn.setAttribute('aria-expanded', 'false');
    }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function loadImage(source) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('File frame tidak bisa dibaca.'));
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

async function startCamera() {
    if (!isStaticMode) {
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Kamera membutuhkan HTTPS atau localhost.');
    }

    const cameraConstraints = {
        video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
    } catch (error) {
        if (error.name !== 'OverconstrainedError' && error.name !== 'NotFoundError') {
            throw new Error('Izin kamera ditolak atau kamera sedang digunakan.');
        }
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    videoFeed.srcObject = cameraStream;
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

function captureStaticFrame() {
    const context = captureCanvas.getContext('2d');
    context.save();
    context.translate(captureCanvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(videoFeed, 0, 0, captureCanvas.width, captureCanvas.height);
    context.restore();
    capturedFrames.push(captureCanvas.toDataURL('image/jpeg', 0.9));
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

if (isStaticMode) {
    startCamera().catch(error => {
        statusText.innerText = `ERROR: ${error.message}`;
    });
}

startBtn.addEventListener('click', async () => {
    const mode = parseInt(modeSelect.value);
    startBtn.disabled = true;
    setModeDisabled(true);

    try {
        if (isStaticMode) {
            capturedFrames = [];
            if (!cameraStream) {
                await startCamera();
            }
        } else {
            await fetch('/reset', { method: 'POST' });
        }

        for (let i = 1; i <= mode; i++) {
            statusText.innerText = `MEMBIDIK FOTO ${i}/${mode}...`;
            await runCountdown(3);

            if (isStaticMode) {
                captureStaticFrame();
            } else {
                const captureResponse = await fetch('/capture', { method: 'POST' });
                if (!captureResponse.ok) {
                    throw new Error('Kamera belum siap.');
                }
            }

            triggerFlash();
            statusText.innerText = `FOTO ${i} TERSIMPAN!`;
            await sleep(700);
        }

        statusText.innerText = 'MEMPROSES DATA 8-BIT... LOADING...';
        let imageUrl;
        if (isStaticMode) {
            imageUrl = await generateStaticCollage(mode);
        } else {
            const generateResponse = await fetch(`/generate/${mode}`, { method: 'POST' });
            const result = await generateResponse.json();
            if (!generateResponse.ok || result.status !== 'success') {
                throw new Error(result.message || 'Kolase gagal dibuat.');
            }
            imageUrl = result.image_url;
        }

        resultImage.src = imageUrl;
        downloadBtn.href = imageUrl;
        collageImageUrl = imageUrl;
        await loadFolderFrames(mode);
        controls.classList.add('hidden');
        boothMonitor.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        statusText.innerText = 'KOLASE SELESAI! SANGAT RETRO!';
    } catch (error) {
        statusText.innerText = `ERROR: ${error.message}`;
    } finally {
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
    customFrameUrl = '';
    framePreview.removeAttribute('src');
    framePreview.classList.add('hidden');
    customFrameInput.value = '';
    folderFrames.innerHTML = '';
    controls.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    boothMonitor.classList.remove('hidden');
    statusText.innerText = "TAKE YOUR MOMENT! 0__0";
});

applyFrameBtn.addEventListener('click', async () => {
    applyFrameBtn.disabled = true;
    try {
        if (!customFrameUrl) {
            throw new Error('Pilih file frame custom terlebih dahulu.');
        }
        await renderTemplate(customFrameUrl);
        statusText.innerText = 'FRAME CUSTOM BERHASIL DIPASANG!';
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
