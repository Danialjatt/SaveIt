function switchMode(mode) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    document.getElementById(`tab-${mode}`).classList.add('active');
    document.getElementById(`${mode}-view`).classList.add('active');
}

// File Input Display — Lossless
document.getElementById('file-lossless').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        document.getElementById('lossless-filename').textContent = file.name;
        showOriginalPreview(file);
    }
});

// File Input Display — Neural
document.getElementById('file-compress').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        document.getElementById('compress-filename').textContent = file.name;
        showOriginalPreview(file);
    }
});

// File Input Display — Decompress
document.getElementById('file-decompress').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) document.getElementById('decompress-filename').textContent = file.name;
});

// Show original preview
function showOriginalPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('img-original').src = e.target.result;
        document.getElementById('img-restored').src = e.target.result;
        document.getElementById('placeholder').classList.add('hidden');
        document.getElementById('comparison').classList.remove('hidden');
        initSlider();
    }
    reader.readAsDataURL(file);
}

// Slider Logic
function initSlider() {
    const slider = document.getElementById('comparison');
    const resize = document.getElementById('resize');
    const handle = document.getElementById('handle');
    let isDragging = false;

    resize.style.width = `50%`;
    handle.style.left = `50%`;

    handle.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if(!isDragging) return;
        const rect = slider.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percent = (x / rect.width) * 100;
        resize.style.width = `${percent}%`;
        handle.style.left = `${percent}%`;
    });
}

// Show stats
function showStats(originalSize, compressedSize) {
    const saved = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    document.getElementById('stat-original').textContent = formatSize(originalSize);
    document.getElementById('stat-compressed').textContent = formatSize(compressedSize);
    document.getElementById('stat-saved').textContent = `${saved}%`;
    document.getElementById('stats-bar').classList.remove('hidden');
}

function formatSize(bytes) {
    if(bytes < 1024) return bytes + ' B';
    if(bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// ---- LOSSLESS COMPRESS ----
document.getElementById('btn-lossless').addEventListener('click', async () => {
    const fileInput = document.getElementById('file-lossless');
    if(!fileInput.files[0]) return alert('Please select an image to compress');

    const originalSize = fileInput.files[0].size;
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    setLoading(true, 'btn-lossless');
    try {
        const res = await fetch('/lossless-compress', { method: 'POST', body: formData });
        if(!res.ok) throw new Error(await res.text());
        
        const blob = await res.blob();
        showStats(originalSize, blob.size);

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compressed.saveit';
        a.click();
        alert('✅ Lossless compression done!\n\nThe .saveit file has been downloaded.\nDecompress it anytime to get back the EXACT original image.');
    } catch (err) {
        alert("Compression failed: " + err);
    }
    setLoading(false, 'btn-lossless');
});

// ---- NEURAL COMPRESS ----
document.getElementById('btn-compress').addEventListener('click', async () => {
    const fileInput = document.getElementById('file-compress');
    if(!fileInput.files[0]) return alert('Please select an image to compress');

    const originalSize = fileInput.files[0].size;
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('epochs', document.getElementById('epochs').value);
    formData.append('encoding_dim', document.getElementById('bottleneck').value);

    setLoading(true, 'btn-compress');
    try {
        const res = await fetch('/compress', { method: 'POST', body: formData });
        if(!res.ok) throw new Error(await res.text());
        
        const blob = await res.blob();
        showStats(originalSize, blob.size);

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compressed.saveit';
        a.click();
        alert('Neural compression done! The .saveit file has been downloaded.\nUse the Decompress tab to view the reconstructed image.');
    } catch (err) {
        alert("Compression failed: " + err);
    }
    setLoading(false, 'btn-compress');
});

// ---- DECOMPRESS ----
document.getElementById('btn-decompress').addEventListener('click', async () => {
    const fileInput = document.getElementById('file-decompress');
    if(!fileInput.files[0]) return alert('Please select a .saveit file');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    setLoading(true, 'btn-decompress');
    try {
        const res = await fetch('/decompress', { method: 'POST', body: formData });
        if(!res.ok) throw new Error(await res.text());
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        
        document.getElementById('img-restored').src = url;
        
        if(document.getElementById('placeholder').classList.contains('hidden') === false) {
             document.getElementById('img-original').src = url;
             document.getElementById('placeholder').classList.add('hidden');
             document.getElementById('comparison').classList.remove('hidden');
             initSlider();
        }

        // Also offer download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'restored.png';
        a.click();
        
    } catch (err) {
        alert("Decompression failed: " + err);
    }
    setLoading(false, 'btn-decompress');
});

function setLoading(isLoading, btnId) {
    document.getElementById(btnId).disabled = isLoading;
    document.getElementById('loading').classList.toggle('hidden', !isLoading);
}
