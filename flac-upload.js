class FlacUploadComponent {
    constructor() {
        this.files = new Map();
        this.fileCounter = 0;
        this.globalCover = null;
        this.projectInfo = {
            title: '',
            artist: '',
            album: '',
            year: '',
            description: '',
            moods: new Set()
        };
        this.init();
    }

    init() {
        this.setupElements();
        this.bindEvents();
    }

    setupElements() {
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.fileList = document.getElementById('fileList');
        this.template = document.getElementById('fileItemTemplate');
        
        // Global cover elements
        this.globalCoverSection = document.getElementById('globalCoverSection');
        this.globalCoverPreview = document.getElementById('globalCoverPreview');
        this.globalCoverInput = document.getElementById('globalCoverInput');
        this.globalUploadCoverBtn = document.getElementById('globalUploadCoverBtn');
        this.globalRemoveCoverBtn = document.getElementById('globalRemoveCoverBtn');
        this.globalCoverImage = document.getElementById('globalCoverImage');
        
        // Album cover and project info elements
        this.albumCoverSection = document.getElementById('albumCoverSection');
        this.projectInfoSection = document.getElementById('projectInfoSection');
        
        // Project info form elements
        this.projectTitle = document.getElementById('projectTitle');
        this.projectArtist = document.getElementById('projectArtist');
        this.projectAlbum = document.getElementById('projectAlbum');
        this.projectYear = document.getElementById('projectYear');
        this.projectDescription = document.getElementById('projectDescription');
        this.customMoodInput = document.getElementById('customMoodInput');
        this.addMoodBtn = document.getElementById('addMoodBtn');
        this.selectedMoods = document.getElementById('selectedMoods');
    }

    bindEvents() {
        // Upload zone events
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
        });

        // Drag and drop events
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('dragover');
        });

        this.uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!this.uploadZone.contains(e.relatedTarget)) {
                this.uploadZone.classList.remove('dragover');
            }
        });

        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(
                file => file.type === 'audio/flac' || file.name.toLowerCase().endsWith('.flac')
            );
            this.handleFiles(files);
        });

        // Global cover events
        this.setupGlobalCoverEvents();
        
        // Project info events
        this.setupProjectInfoEvents();
    }

    handleFiles(files) {
        files.forEach(file => {
            if (this.isValidFlacFile(file)) {
                this.addFile(file);
            } else {
                this.showError(`${file.name} is not a valid FLAC file.`);
            }
        });
        // Clear input for repeated uploads
        this.fileInput.value = '';
        
        // Show album cover and project info sections if files are present
        if (this.files.size > 0) {
            this.albumCoverSection.style.display = 'block';
            this.projectInfoSection.style.display = 'block';
        }
    }

    isValidFlacFile(file) {
        return file.type === 'audio/flac' || file.name.toLowerCase().endsWith('.flac');
    }

    addFile(file) {
        const fileId = `file-${++this.fileCounter}`;
        const fileData = {
            id: fileId,
            file: file,
            duration: 0,
            genre: '',
            isFullTrack: false,
            instruments: new Set(),
            tags: new Set(),
            waveformData: null,
            bpm: '',
            key: ''
        };

        this.files.set(fileId, fileData);
        this.renderFileItem(fileData);
        this.analyzeFile(fileData);
    }

    renderFileItem(fileData) {
        const clone = this.template.content.cloneNode(true);
        const fileItem = clone.querySelector('.file-item');
        
        fileItem.setAttribute('data-file-id', fileData.id);
        
        // Set file info
        const fileName = clone.querySelector('.file-name');
        fileName.textContent = fileData.file.name;
        
        const fileSize = clone.querySelector('.file-size');
        fileSize.textContent = this.formatFileSize(fileData.file.size);
        
        // Setup audio element
        const audio = clone.querySelector('audio source');
        const audioElement = clone.querySelector('audio');
        audio.src = URL.createObjectURL(fileData.file);
        audioElement.load();

        // Bind events
        this.bindFileItemEvents(clone, fileData);
        
        this.fileList.appendChild(clone);
    }

    bindFileItemEvents(element, fileData) {
        // Remove button
        const removeBtn = element.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => this.removeFile(fileData.id));

        // Genre selection
        const genreSelect = element.querySelector('.genre-select');
        genreSelect.addEventListener('change', (e) => {
            fileData.genre = e.target.value;
            this.updateTags(fileData);
        });

        // Full track checkbox
        const fullTrackCb = element.querySelector('.full-track-cb');
        fullTrackCb.addEventListener('change', (e) => {
            fileData.isFullTrack = e.target.checked;
            this.updateTags(fileData);
        });

        // Instrument checkboxes
        const instrumentCbs = element.querySelectorAll('.instrument-checkboxes input[type="checkbox"]');
        instrumentCbs.forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    fileData.instruments.add(e.target.value);
                } else {
                    fileData.instruments.delete(e.target.value);
                }
                this.updateTags(fileData);
            });
        });

        // Custom instrument
        const customInput = element.querySelector('.custom-instrument-input');
        const addBtn = element.querySelector('.add-instrument-btn');
        
        const addCustomInstrument = () => {
            const value = customInput.value.trim();
            if (value) {
                fileData.instruments.add(value);
                customInput.value = '';
                this.updateTags(fileData);
            }
        };

        addBtn.addEventListener('click', addCustomInstrument);
        customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCustomInstrument();
            }
        });

        // Audio events for duration
        const audio = element.querySelector('audio');
        audio.addEventListener('loadedmetadata', () => {
            fileData.duration = audio.duration;
            this.updateDurationDisplay(fileData);
        });

        // BPM and Key events
        const bpmInput = element.querySelector('.track-bpm');
        const keySelect = element.querySelector('.track-key');
        
        bpmInput.addEventListener('change', (e) => {
            fileData.bpm = e.target.value;
        });
        
        keySelect.addEventListener('change', (e) => {
            fileData.key = e.target.value;
        });

        // Waveform cursor events
        this.setupWaveformCursor(element, fileData);
    }

    async analyzeFile(fileData) {
        const fileItem = document.querySelector(`[data-file-id="${fileData.id}"]`);
        const statusElement = fileItem.querySelector('.analysis-status');
        
        try {
            statusElement.textContent = 'Analyzing...';
            statusElement.className = 'analysis-status analyzing';
            
            // Simulate analysis time
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate waveform
            await this.generateWaveform(fileData);
            
            statusElement.textContent = 'Analysis complete';
            statusElement.className = 'analysis-status complete';
            
            this.extractMetadata(fileData);
            
        } catch (error) {
            statusElement.textContent = 'Analysis failed';
            statusElement.className = 'analysis-status error';
            console.error('Analysis error:', error);
        }
    }

    async generateWaveform(fileData) {
        const fileItem = document.querySelector(`[data-file-id="${fileData.id}"]`);
        const canvas = fileItem.querySelector('.waveform-canvas');
        const waveformContainer = fileItem.querySelector('.waveform-container');
        const ctx = canvas.getContext('2d');
        
        try {
            // Create audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Read file as array buffer
            const arrayBuffer = await fileData.file.arrayBuffer();
            
            // Decode audio data
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Get channel data (use first channel)
            const channelData = audioBuffer.getChannelData(0);
            
            // Calculate samples per pixel
            const samplesPerPixel = Math.floor(channelData.length / canvas.width);
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Set waveform style - gray waveform on white background
            ctx.fillStyle = '#6b7280';
            
            // Draw waveform
            const centerY = canvas.height / 2;
            const maxAmplitude = canvas.height / 2 - 4;
            
            for (let x = 0; x < canvas.width; x++) {
                const startSample = x * samplesPerPixel;
                const endSample = startSample + samplesPerPixel;
                
                let min = 1.0;
                let max = -1.0;
                
                for (let i = startSample; i < endSample && i < channelData.length; i++) {
                    const sample = channelData[i];
                    if (sample < min) min = sample;
                    if (sample > max) max = sample;
                }
                
                const minY = centerY + (min * maxAmplitude);
                const maxY = centerY + (max * maxAmplitude);
                const height = Math.max(1, maxY - minY);
                
                ctx.fillRect(x, minY, 1, height);
            }
            
            // Store waveform data
            fileData.waveformData = {
                peaks: channelData,
                duration: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate
            };
            
            // Mark as loaded
            waveformContainer.classList.add('loaded');
            
        } catch (error) {
            console.error('Waveform generation failed:', error);
            
            // Fallback: draw a simple waveform pattern
            this.drawFallbackWaveform(ctx, canvas);
            waveformContainer.classList.add('loaded');
        }
    }

    drawFallbackWaveform(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#9ca3af';
        
        const centerY = canvas.height / 2;
        const barWidth = 2;
        const spacing = 3;
        
        for (let x = 0; x < canvas.width; x += spacing) {
            const height = Math.random() * (canvas.height - 20) + 10;
            const y = centerY - height / 2;
            ctx.fillRect(x, y, barWidth, height);
        }
    }

    setupGlobalCoverEvents() {
        this.globalUploadCoverBtn.addEventListener('click', () => this.globalCoverInput.click());
        this.globalCoverPreview.addEventListener('click', () => {
            if (!this.globalCover) {
                this.globalCoverInput.click();
            }
        });

        this.globalCoverInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleGlobalCoverUpload(file);
            }
        });

        this.globalRemoveCoverBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeGlobalCover();
        });
    }

    handleGlobalCoverUpload(file) {
        // Validate image dimensions (should be square)
        const img = new Image();
        img.onload = () => {
            const isSquare = Math.abs(img.width - img.height) <= 10; // Allow 10px tolerance
            
            if (!isSquare) {
                this.showError('Cover image should be square (same width and height)');
                return;
            }
            
            // Create object URL and display
            const objectURL = URL.createObjectURL(file);
            this.globalCoverImage.src = objectURL;
            this.globalCoverImage.style.display = 'block';
            this.globalCoverPreview.querySelector('.cover-placeholder').style.display = 'none';
            this.globalRemoveCoverBtn.style.display = 'block';
            
            // Store cover data
            this.globalCover = {
                file: file,
                url: objectURL,
                dimensions: { width: img.width, height: img.height }
            };
        };
        
        img.onerror = () => {
            this.showError('Invalid image file');
        };
        
        img.src = URL.createObjectURL(file);
    }

    setupProjectInfoEvents() {
        // Project info form events
        this.projectTitle.addEventListener('change', (e) => {
            this.projectInfo.title = e.target.value;
        });
        
        this.projectArtist.addEventListener('change', (e) => {
            this.projectInfo.artist = e.target.value;
        });
        
        this.projectAlbum.addEventListener('change', (e) => {
            this.projectInfo.album = e.target.value;
        });
        
        this.projectYear.addEventListener('change', (e) => {
            this.projectInfo.year = e.target.value;
        });
        
        this.projectDescription.addEventListener('change', (e) => {
            this.projectInfo.description = e.target.value;
        });

        // Mood tags events
        const moodCheckboxes = document.querySelectorAll('.mood-tag input[type="checkbox"]');
        moodCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.projectInfo.moods.add(e.target.value);
                } else {
                    this.projectInfo.moods.delete(e.target.value);
                }
                this.renderMoodTags();
            });
        });

        // Custom mood events
        this.addMoodBtn.addEventListener('click', () => {
            this.addCustomMood();
        });
        
        this.customMoodInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomMood();
            }
        });
    }

    addCustomMood() {
        const value = this.customMoodInput.value.trim();
        if (value) {
            this.projectInfo.moods.add(value);
            this.customMoodInput.value = '';
            this.renderMoodTags();
        }
    }

    renderMoodTags() {
        this.selectedMoods.innerHTML = '';
        
        this.projectInfo.moods.forEach(mood => {
            const moodElement = document.createElement('span');
            moodElement.className = 'mood-tag-item';
            moodElement.innerHTML = `
                ${mood}
                <button class="mood-tag-remove" aria-label="Remove ${mood} mood">×</button>
            `;
            
            moodElement.querySelector('.mood-tag-remove').addEventListener('click', () => {
                this.removeMoodTag(mood);
            });
            
            this.selectedMoods.appendChild(moodElement);
        });
    }

    removeMoodTag(moodToRemove) {
        this.projectInfo.moods.delete(moodToRemove);
        
        // Uncheck if it's a predefined mood
        const moodCheckbox = document.querySelector(`input[value="${moodToRemove}"]`);
        if (moodCheckbox) {
            moodCheckbox.checked = false;
        }
        
        this.renderMoodTags();
    }

    setupWaveformCursor(element, fileData) {
        const audio = element.querySelector('audio');
        const waveformContainer = element.querySelector('.waveform-container');
        const waveformCanvas = element.querySelector('.waveform-canvas');
        const cursor = element.querySelector('.waveform-cursor');
        let animationFrame = null;

        const updateCursor = () => {
            if (audio.duration && !audio.paused && !audio.ended) {
                const progress = audio.currentTime / audio.duration;
                
                // Get the actual canvas width (accounting for container padding)
                const containerStyle = getComputedStyle(waveformContainer);
                const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
                const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
                const canvasWidth = waveformContainer.clientWidth - paddingLeft - paddingRight;
                
                const cursorPosition = paddingLeft + (progress * canvasWidth);
                cursor.style.left = `${cursorPosition}px`;
                
                animationFrame = requestAnimationFrame(updateCursor);
            }
        };

        // Audio event listeners for cursor
        audio.addEventListener('play', () => {
            cursor.classList.add('playing');
            updateCursor();
        });

        audio.addEventListener('pause', () => {
            cursor.classList.remove('playing');
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
        });

        audio.addEventListener('ended', () => {
            cursor.classList.remove('playing');
            const containerStyle = getComputedStyle(waveformContainer);
            const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
            cursor.style.left = `${paddingLeft}px`;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
        });

        audio.addEventListener('seeked', () => {
            if (audio.duration) {
                const progress = audio.currentTime / audio.duration;
                const containerStyle = getComputedStyle(waveformContainer);
                const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
                const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
                const canvasWidth = waveformContainer.clientWidth - paddingLeft - paddingRight;
                const cursorPosition = paddingLeft + (progress * canvasWidth);
                cursor.style.left = `${cursorPosition}px`;
            }
        });

        // Click on waveform to seek
        waveformContainer.addEventListener('click', (e) => {
            if (audio.duration && fileData.waveformData) {
                const rect = waveformContainer.getBoundingClientRect();
                const containerStyle = getComputedStyle(waveformContainer);
                const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
                const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
                
                const clickX = e.clientX - rect.left - paddingLeft;
                const canvasWidth = waveformContainer.clientWidth - paddingLeft - paddingRight;
                const progress = Math.max(0, Math.min(1, clickX / canvasWidth));
                const newTime = progress * audio.duration;
                
                audio.currentTime = Math.max(0, Math.min(newTime, audio.duration));
                
                // Update cursor position immediately
                const cursorPosition = paddingLeft + (progress * canvasWidth);
                cursor.style.left = `${cursorPosition}px`;
            }
        });

        // Add hover preview for seeking
        waveformContainer.addEventListener('mousemove', (e) => {
            if (audio.duration && fileData.waveformData) {
                const rect = waveformContainer.getBoundingClientRect();
                const containerStyle = getComputedStyle(waveformContainer);
                const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
                const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
                
                const hoverX = e.clientX - rect.left - paddingLeft;
                const canvasWidth = waveformContainer.clientWidth - paddingLeft - paddingRight;
                const progress = Math.max(0, Math.min(1, hoverX / canvasWidth));
                const hoverTime = progress * audio.duration;
                
                // Update tooltip or show hover indicator
                waveformContainer.title = `Seek to ${this.formatDuration(hoverTime)}`;
            }
        });

        // Make waveform container clickable
        waveformContainer.style.cursor = 'pointer';
    }

    removeGlobalCover() {
        if (this.globalCover) {
            URL.revokeObjectURL(this.globalCover.url);
            this.globalCover = null;
        }
        
        this.globalCoverImage.style.display = 'none';
        this.globalCoverImage.src = '';
        this.globalCoverPreview.querySelector('.cover-placeholder').style.display = 'flex';
        this.globalRemoveCoverBtn.style.display = 'none';
    }

    extractMetadata(fileData) {
        // In a real implementation, you would use a library like music-metadata
        // to extract FLAC metadata such as:
        // - Artist, Album, Title
        // - Genre from metadata
        // - Duration
        // - Sample rate, bit depth
        // For now, we'll just update what we can from the audio element
        
        console.log(`Metadata extracted for ${fileData.file.name}`);
        // You could pre-populate genre and other fields based on metadata here
    }

    updateDurationDisplay(fileData) {
        const fileItem = document.querySelector(`[data-file-id="${fileData.id}"]`);
        const durationElement = fileItem.querySelector('.file-duration');
        durationElement.textContent = `Duration: ${this.formatDuration(fileData.duration)}`;
    }

    updateTags(fileData) {
        fileData.tags.clear();
        
        if (fileData.genre) {
            fileData.tags.add({ type: 'genre', value: fileData.genre });
        }
        
        if (fileData.isFullTrack) {
            fileData.tags.add({ type: 'full-track', value: 'Full Track' });
        }
        
        fileData.instruments.forEach(instrument => {
            fileData.tags.add({ type: 'instrument', value: instrument });
        });

        this.renderTags(fileData);
    }

    renderTags(fileData) {
        const fileItem = document.querySelector(`[data-file-id="${fileData.id}"]`);
        const tagsContainer = fileItem.querySelector('.selected-tags');
        
        tagsContainer.innerHTML = '';
        
        fileData.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = `tag ${tag.type}`;
            tagElement.innerHTML = `
                ${tag.value}
                <button class="tag-remove" aria-label="Remove ${tag.value} tag">×</button>
            `;
            
            tagElement.querySelector('.tag-remove').addEventListener('click', () => {
                this.removeTag(fileData, tag);
            });
            
            tagsContainer.appendChild(tagElement);
        });
    }

    removeTag(fileData, tagToRemove) {
        fileData.tags.delete(tagToRemove);
        
        // Update corresponding form controls
        const fileItem = document.querySelector(`[data-file-id="${fileData.id}"]`);
        
        if (tagToRemove.type === 'genre') {
            const genreSelect = fileItem.querySelector('.genre-select');
            genreSelect.value = '';
            fileData.genre = '';
        } else if (tagToRemove.type === 'full-track') {
            const fullTrackCb = fileItem.querySelector('.full-track-cb');
            fullTrackCb.checked = false;
            fileData.isFullTrack = false;
        } else if (tagToRemove.type === 'instrument') {
            fileData.instruments.delete(tagToRemove.value);
            // Uncheck if it's a predefined instrument
            const instrumentCb = fileItem.querySelector(`input[value="${tagToRemove.value}"]`);
            if (instrumentCb) {
                instrumentCb.checked = false;
            }
        }
        
        this.renderTags(fileData);
    }

    removeFile(fileId) {
        const fileData = this.files.get(fileId);
        if (fileData) {
            // Revoke object URLs to prevent memory leaks
            const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
            const audio = fileItem.querySelector('audio source');
            URL.revokeObjectURL(audio.src);
            
            // Remove from DOM and data
            fileItem.remove();
            this.files.delete(fileId);
            
            // Hide sections if no files remain
            if (this.files.size === 0) {
                this.albumCoverSection.style.display = 'none';
                this.projectInfoSection.style.display = 'none';
                this.removeGlobalCover();
            }
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '--:--';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        alert(message);
    }

    // Public API methods
    getFiles() {
        return Array.from(this.files.values());
    }

    getFileData(fileId) {
        return this.files.get(fileId);
    }

    exportTagData() {
        const tagData = {};
        this.files.forEach((fileData, fileId) => {
            tagData[fileData.file.name] = {
                duration: fileData.duration,
                genre: fileData.genre,
                isFullTrack: fileData.isFullTrack,
                instruments: Array.from(fileData.instruments),
                tags: Array.from(fileData.tags),
                hasWaveform: !!fileData.waveformData,
                bpm: fileData.bpm,
                key: fileData.key
            };
        });
        
        // Add project information
        tagData._projectInfo = {
            title: this.projectInfo.title,
            artist: this.projectInfo.artist,
            album: this.projectInfo.album,
            year: this.projectInfo.year,
            description: this.projectInfo.description,
            moods: Array.from(this.projectInfo.moods),
            hasCover: !!this.globalCover,
            coverDimensions: this.globalCover?.dimensions
        };
        
        return tagData;
    }
}

// Initialize the component when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.flacUpload = new FlacUploadComponent();
});
