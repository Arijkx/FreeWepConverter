let images = [];
let quality = 80;
let conversionMode = 'toWebP'; // 'toWebP' or 'toPNG'

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const settingsPanel = document.getElementById('settingsPanel');
const previewSection = document.getElementById('previewSection');
const previewGrid = document.getElementById('previewGrid');
const actions = document.getElementById('actions');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const convertAllBtn = document.getElementById('convertAllBtn');
const clearBtn = document.getElementById('clearBtn');
const conversionModeSelect = document.getElementById('conversionMode');
const subtitle = document.getElementById('subtitle');
const qualityGroup = document.getElementById('qualityGroup');

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
qualitySlider.addEventListener('input', handleQualityChange);
conversionModeSelect.addEventListener('change', handleModeChange);
convertAllBtn.addEventListener('click', convertAllImages);
clearBtn.addEventListener('click', clearAll);

// Initialize mode
qualityGroup.style.display = 'flex';
fileInput.accept = 'image/*';

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(file => {
        if (conversionMode === 'toPNG') {
            return file.type === 'image/webp';
        }
        return file.type.startsWith('image/');
    });
    if (files.length > 0) {
        processFiles(files);
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files).filter(file => {
        if (conversionMode === 'toPNG') {
            return file.type === 'image/webp';
        }
        return file.type.startsWith('image/');
    });
    if (files.length > 0) {
        processFiles(files);
    }
}

function processFiles(files) {
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                id: Date.now() + Math.random(),
                file: file,
                originalUrl: e.target.result,
                convertedUrl: null,
                converted: false,
                originalSize: file.size,
                convertedSize: null
            };
            images.push(imageData);
            renderPreview(imageData);
        };
        reader.readAsDataURL(file);
    });
    
    settingsPanel.style.display = 'block';
    previewSection.style.display = 'block';
    actions.style.display = 'flex';
}

function renderPreview(imageData) {
    const card = document.createElement('div');
    card.className = 'preview-card';
    card.id = `preview-${imageData.id}`;
    
    const img = document.createElement('img');
    img.src = imageData.originalUrl;
    img.className = 'preview-image';
    img.alt = imageData.file.name;
    
    const info = document.createElement('div');
    info.className = 'preview-info';
    const convertedFormat = conversionMode === 'toWebP' ? 'WebP' : 'PNG';
    info.innerHTML = `
        <div><strong>File:</strong> ${imageData.file.name}</div>
        <div><strong>Original Size:</strong> ${formatFileSize(imageData.originalSize)}</div>
        <div id="converted-size-${imageData.id}">
            ${imageData.converted ? `<strong>${convertedFormat} Size:</strong> ${formatFileSize(imageData.convertedSize)}` : ''}
        </div>
    `;
    
    const status = document.createElement('div');
    status.id = `status-${imageData.id}`;
    if (imageData.converted) {
        status.className = 'status success';
        status.innerHTML = '<span>✓ Converted</span>';
    }
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'preview-actions';
    
    if (!imageData.converted) {
        const convertBtn = document.createElement('button');
        convertBtn.className = 'btn btn-primary btn-small';
        convertBtn.textContent = 'Convert';
        convertBtn.onclick = () => convertImage(imageData);
        actionsDiv.appendChild(convertBtn);
    } else {
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-primary btn-small';
        downloadBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download
        `;
        downloadBtn.onclick = () => downloadConverted(imageData);
        actionsDiv.appendChild(downloadBtn);
    }
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-secondary btn-small';
    removeBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Remove
    `;
    removeBtn.onclick = () => removeImage(imageData.id);
    actionsDiv.appendChild(removeBtn);
    
    card.appendChild(img);
    card.appendChild(info);
    card.appendChild(status);
    card.appendChild(actionsDiv);
    
    previewGrid.appendChild(card);
}

function convertImage(imageData) {
    const statusEl = document.getElementById(`status-${imageData.id}`);
    statusEl.className = 'status processing';
    statusEl.innerHTML = '<span class="spinner"></span> Converting...';
    
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        if (conversionMode === 'toPNG') {
            // Convert to PNG
            canvas.toBlob((blob) => {
                if (blob) {
                    imageData.convertedUrl = URL.createObjectURL(blob);
                    imageData.convertedSize = blob.size;
                    imageData.converted = true;
                    
                    // Update UI
                    updatePreviewCard(imageData);
                    
                    statusEl.className = 'status success';
                    statusEl.innerHTML = '<span>✓ Converted</span>';
                } else {
                    statusEl.className = 'status';
                    statusEl.innerHTML = '<span style="color: var(--danger);">Error</span>';
                }
            }, 'image/png');
        } else {
            // Convert to WebP
            canvas.toBlob((blob) => {
                if (blob) {
                    imageData.convertedUrl = URL.createObjectURL(blob);
                    imageData.convertedSize = blob.size;
                    imageData.converted = true;
                    
                    // Update UI
                    updatePreviewCard(imageData);
                    
                    statusEl.className = 'status success';
                    statusEl.innerHTML = '<span>✓ Converted</span>';
                } else {
                    statusEl.className = 'status';
                    statusEl.innerHTML = '<span style="color: var(--danger);">Error</span>';
                }
            }, 'image/webp', quality / 100);
        }
    };
    
    img.onerror = () => {
        statusEl.className = 'status';
        statusEl.innerHTML = '<span style="color: var(--danger);">Error loading</span>';
    };
    
    img.src = imageData.originalUrl;
}

function updatePreviewCard(imageData) {
    const card = document.getElementById(`preview-${imageData.id}`);
    if (!card) return;
    
    const convertedSizeEl = document.getElementById(`converted-size-${imageData.id}`);
    if (convertedSizeEl) {
        const convertedFormat = conversionMode === 'toWebP' ? 'WebP' : 'PNG';
        convertedSizeEl.innerHTML = `<strong>${convertedFormat} Size:</strong> ${formatFileSize(imageData.convertedSize)}`;
    }
    
    const actionsDiv = card.querySelector('.preview-actions');
    actionsDiv.innerHTML = '';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-primary btn-small';
    downloadBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download
    `;
    downloadBtn.onclick = () => downloadConverted(imageData);
    actionsDiv.appendChild(downloadBtn);
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-secondary btn-small';
    removeBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Remove
    `;
    removeBtn.onclick = () => removeImage(imageData.id);
    actionsDiv.appendChild(removeBtn);
}

function convertAllImages() {
    const unconverted = images.filter(img => !img.converted);
    if (unconverted.length === 0) {
        return;
    }
    
    convertAllBtn.disabled = true;
    convertAllBtn.innerHTML = '<span class="spinner"></span> Converting all...';
    
    let completed = 0;
    unconverted.forEach(imageData => {
        convertImage(imageData);
        // Wait a bit between conversions to avoid blocking
        setTimeout(() => {
            completed++;
            if (completed === unconverted.length) {
                convertAllBtn.disabled = false;
                convertAllBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    Convert All
                `;
            }
        }, 100);
    });
}

function downloadConverted(imageData) {
    if (!imageData.convertedUrl) return;
    
    const link = document.createElement('a');
    link.href = imageData.convertedUrl;
    const extension = conversionMode === 'toWebP' ? '.webp' : '.png';
    const fileName = imageData.file.name.replace(/\.[^/.]+$/, '') + extension;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function removeImage(id) {
    const imageData = images.find(img => img.id === id);
    if (imageData && imageData.convertedUrl) {
        URL.revokeObjectURL(imageData.convertedUrl);
    }
    
    images = images.filter(img => img.id !== id);
    const card = document.getElementById(`preview-${id}`);
    if (card) {
        card.remove();
    }
    
    if (images.length === 0) {
        settingsPanel.style.display = 'none';
        previewSection.style.display = 'none';
        actions.style.display = 'none';
    }
}

function clearAll() {
    images.forEach(imageData => {
        if (imageData.convertedUrl) {
            URL.revokeObjectURL(imageData.convertedUrl);
        }
    });
    
    images = [];
    previewGrid.innerHTML = '';
    settingsPanel.style.display = 'none';
    previewSection.style.display = 'none';
    actions.style.display = 'none';
    fileInput.value = '';
}

function handleModeChange(e) {
    conversionMode = e.target.value;
    
    // Update subtitle
    if (conversionMode === 'toPNG') {
        subtitle.textContent = 'Convert WebP images to PNG format';
        qualityGroup.style.display = 'none';
        fileInput.accept = 'image/webp';
    } else {
        subtitle.textContent = 'Convert images to WebP format';
        qualityGroup.style.display = 'flex';
        fileInput.accept = 'image/*';
    }
    
    // Clear existing images when switching modes
    clearAll();
}

function handleQualityChange(e) {
    quality = parseInt(e.target.value);
    qualityValue.textContent = quality;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

