class YouTubeThumbnailDownloader {
    constructor() {
        this.currentThumbnails = [];
        this.currentModalImage = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const downloadBtn = document.getElementById('downloadBtn');
        const youtubeUrl = document.getElementById('youtubeUrl');
        const closeModal = document.querySelector('.close');
        const modal = document.getElementById('previewModal');
        const downloadModalBtn = document.getElementById('downloadModalBtn');

        downloadBtn.addEventListener('click', () => this.generateThumbnails());
        
        youtubeUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateThumbnails();
            }
        });

        closeModal.addEventListener('click', () => this.closeModal());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        downloadModalBtn.addEventListener('click', () => this.downloadCurrentImage());

        // Close modal dengan ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
            /youtube\.com\/watch\?.*v=([^&?#]+)/,
            /youtu\.be\/([^&?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    validateYouTubeUrl(url) {
        const videoId = this.extractVideoId(url);
        return videoId !== null;
    }

    getThumbnailUrls(videoId) {
        return [
            {
                quality: 'Max Resolution',
                url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                dimensions: '1280x720px',
                filename: `youtube-thumbnail-${videoId}-maxres.jpg`
            },
            {
                quality: 'High Quality',
                url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                dimensions: '480x360px',
                filename: `youtube-thumbnail-${videoId}-hq.jpg`
            },
            {
                quality: 'Standard Quality',
                url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
                dimensions: '640x480px',
                filename: `youtube-thumbnail-${videoId}-sd.jpg`
            },
            {
                quality: 'Medium Quality',
                url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                dimensions: '320x180px',
                filename: `youtube-thumbnail-${videoId}-mq.jpg`
            },
            {
                quality: 'Default Quality',
                url: `https://img.youtube.com/vi/${videoId}/default.jpg`,
                dimensions: '120x90px',
                filename: `youtube-thumbnail-${videoId}-default.jpg`
            }
        ];
    }

    async generateThumbnails() {
        const urlInput = document.getElementById('youtubeUrl');
        const downloadBtn = document.getElementById('downloadBtn');
        const resultSection = document.getElementById('resultSection');
        const thumbnailsGrid = document.getElementById('thumbnailsGrid');

        const url = urlInput.value.trim();

        // Validasi input
        if (!url) {
            this.showError('Masukkan URL YouTube terlebih dahulu');
            return;
        }

        if (!this.validateYouTubeUrl(url)) {
            this.showError('URL YouTube tidak valid. Pastikan URL benar.');
            return;
        }

        // Tampilkan loading state
        downloadBtn.textContent = 'Memproses...';
        downloadBtn.disabled = true;
        thumbnailsGrid.innerHTML = '<div class="loading">Memuat thumbnail...</div>';

        try {
            const videoId = this.extractVideoId(url);
            const thumbnails = this.getThumbnailUrls(videoId);

            // Simpan thumbnail untuk aksi download
            this.currentThumbnails = thumbnails;

            // Generate HTML untuk setiap thumbnail
            thumbnailsGrid.innerHTML = '';
            
            for (const thumb of thumbnails) {
                const thumbnailElement = await this.createThumbnailCard(thumb, videoId);
                thumbnailsGrid.appendChild(thumbnailElement);
            }

            // Tampilkan hasil
            resultSection.classList.remove('hidden');
            
            // Scroll ke hasil
            resultSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Error:', error);
            this.showError('Terjadi kesalahan saat memproses thumbnail');
        } finally {
            // Reset button state
            downloadBtn.textContent = 'Generate Thumbnail';
            downloadBtn.disabled = false;
        }
    }

    async createThumbnailCard(thumbnail, videoId) {
        const card = document.createElement('div');
        card.className = 'thumbnail-card';

        // Check if image exists
        const imageExists = await this.checkImageExists(thumbnail.url);

        // Placeholder jika gambar tidak ada
        const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180">
                <rect width="100%" height="100%" fill="#f0f0f0"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">
                    Thumbnail Tidak Tersedia
                </text>
            </svg>
        `)}`;

        card.innerHTML = `
            <img 
                src="${imageExists ? thumbnail.url : placeholderSvg}" 
                alt="${thumbnail.quality}" 
                class="thumbnail-image"
                data-url="${thumbnail.url}"
                data-filename="${thumbnail.filename}"
            >
            <div class="thumbnail-info">
                <span class="quality-badge">${thumbnail.quality}</span>
                <div class="thumbnail-dimensions">${thumbnail.dimensions}</div>
                <button class="download-btn" data-url="${thumbnail.url}" data-filename="${thumbnail.filename}">
                    ${imageExists ? 'Download' : 'Tidak Tersedia'}
                </button>
            </div>
        `;

        // Add event listeners
        const img = card.querySelector('.thumbnail-image');
        const downloadBtn = card.querySelector('.download-btn');

        if (imageExists) {
            img.addEventListener('click', () => this.openModal(thumbnail.url, thumbnail.filename));
            downloadBtn.addEventListener('click', () => this.downloadImage(thumbnail.url, thumbnail.filename));
        } else {
            downloadBtn.disabled = true;
        }

        return card;
    }

    async checkImageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.status === 200;
        } catch {
            return false;
        }
    }

    openModal(imageUrl, filename) {
        const modal = document.getElementById('previewModal');
        const modalImage = document.getElementById('modalImage');
        const downloadModalBtn = document.getElementById('downloadModalBtn');

        this.currentModalImage = { url: imageUrl, filename: filename };

        modalImage.src = imageUrl;
        modalImage.alt = `Preview ${filename}`;
        downloadModalBtn.textContent = `Download ${filename}`;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('previewModal');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.currentModalImage = null;
    }

    downloadCurrentImage() {
        if (this.currentModalImage) {
            this.downloadImage(this.currentModalImage.url, this.currentModalImage.filename);
        }
    }

    downloadImage(url, filename) {
        // Buat elemen anchor untuk download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Log download (untuk analytics)
        this.logDownload(filename);
    }

    logDownload(filename) {
        console.log(`Downloaded: ${filename}`);
        // Di sini bisa ditambahkan Google Analytics atau tracking lainnya
        // gtag('event', 'download', { 'file_name': filename });
    }

    showError(message) {
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        // Bisa diganti dengan notifikasi yang lebih elegan
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

// Inisialisasi aplikasi ketika DOM siap
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeThumbnailDownloader();
});
