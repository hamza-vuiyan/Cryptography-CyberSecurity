/**
 * Steganography App - Image Encoding & Decoding Handler
 * 
 * Features:
 * - Encode: Upload image + message OR capture from camera + message
 * - Decode: Upload image to extract hidden message
 * - Downloads: User downloads encoded images locally (no server storage)
 * - Camera: Modal popup for capturing photos
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract CSRF token from browser cookies
 */
function getCSRFToken() {
    const match = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='));
    return match ? match.split('=')[1] : '';
}

/**
 * Update status message with styling
 * @param {HTMLElement} element - Status element to update
 * @param {string} message - Status text
 * @param {string} kind - CSS class: '', 'success', or 'error'
 */
function setStatus(element, message, kind = '') {
    element.textContent = message;
    element.className = `status ${kind}`.trim();
}

/**
 * Download a blob as a file
 * @param {Blob} blob - Data to download
 * @param {string} filename - Downloaded file name
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// ============================================================================
// ENCODE - UPLOAD IMAGE
// ============================================================================

const encodeUploadForm = document.getElementById('encode-upload-form');
const encodeFileInput = document.getElementById('encode-file-input');
const encodeMessageInput = document.getElementById('encode-message-input');
const encodeUploadStatus = document.getElementById('encode-upload-status');
const encodeUploadResult = document.getElementById('encode-upload-result');
const downloadEncodedBtn = document.getElementById('download-encoded');

let encodedImageBlob = null;

encodeUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = encodeFileInput.files[0];
    const message = encodeMessageInput.value.trim();

    if (!file) {
        setStatus(encodeUploadStatus, 'No file selected.', 'error');
        return;
    }

    if (!message) {
        setStatus(encodeUploadStatus, 'Please enter a message to hide.', 'error');
        return;
    }

    setStatus(encodeUploadStatus, 'Encoding...', '');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('message', message);

    try {
        const response = await fetch('/encode/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Encoding failed.');
        }

        // Get binary blob
        encodedImageBlob = await response.blob();

        setStatus(encodeUploadStatus, 'Encoded successfully!', 'success');
        encodeUploadResult.style.display = 'block';
    } catch (error) {
        console.error(error);
        setStatus(encodeUploadStatus, error.message, 'error');
        encodeUploadResult.style.display = 'none';
    }
});

downloadEncodedBtn.addEventListener('click', () => {
    if (encodedImageBlob) {
        downloadBlob(encodedImageBlob, 'encoded.png');
    }
});

// ============================================================================
// ENCODE - CAMERA CAPTURE (Modal)
// ============================================================================

const openCameraBtn = document.getElementById('open-camera-btn');
const cameraModal = document.getElementById('camera-modal');
const cameraVideo = document.getElementById('camera-video');
const captureCanvas = document.getElementById('capture-canvas');
const capturePhotoBtn = document.getElementById('capture-photo-btn');
const closeCameraModalBtn = document.getElementById('close-camera-modal');
const cancelCameraBtn = document.getElementById('cancel-camera-btn');

const capturedPreview = document.getElementById('captured-preview');
const cameraUploadStatus = document.getElementById('camera-upload-status');
const cameraUploadResult = document.getElementById('camera-upload-result');
const cameraEncodeResult = document.getElementById('camera-encode-result');
const captureMessageInput = document.getElementById('capture-message-input');
const encodeCaptureBtnBtn = document.getElementById('encode-capture-btn');
const downloadCameraEncodedBtn = document.getElementById('download-camera-encoded');

let cameraStream = null;
let capturedImageBlob = null;
let cameraEncodedBlob = null;

// Open camera modal
openCameraBtn.addEventListener('click', async () => {
    cameraModal.style.display = 'flex';
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraVideo.srcObject = cameraStream;
        await cameraVideo.play();
        setStatus(cameraUploadStatus, 'Camera ready. Click Capture to take a photo.', 'success');
    } catch (error) {
        console.error(error);
        setStatus(cameraUploadStatus, 'Camera access failed. Check permissions or use HTTPS/localhost.', 'error');
    }
});

// Close modal (X button or Cancel)
const closeModal = () => {
    cameraModal.style.display = 'none';
    if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
    }
};

closeCameraModalBtn.addEventListener('click', closeModal);
cancelCameraBtn.addEventListener('click', closeModal);

// Capture photo from camera
capturePhotoBtn.addEventListener('click', () => {
    if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) {
        setStatus(cameraUploadStatus, 'Camera is warming up. Try again.', 'error');
        return;
    }

    // Draw frame to canvas
    captureCanvas.width = cameraVideo.videoWidth;
    captureCanvas.height = cameraVideo.videoHeight;
    captureCanvas.getContext('2d').drawImage(cameraVideo, 0, 0);

    // Convert to blob
    captureCanvas.toBlob((blob) => {
        if (!blob) {
            setStatus(cameraUploadStatus, 'Failed to capture frame.', 'error');
            return;
        }

        capturedImageBlob = blob;

        // Stop camera and close modal
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
        }
        closeModal();

        // Show captured image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            capturedPreview.src = e.target.result;
        };
        reader.readAsDataURL(blob);

        // Show upload result section with message input and encode button
        cameraUploadResult.style.display = 'block';
        cameraEncodeResult.style.display = 'none';
        captureMessageInput.value = '';
        setStatus(cameraUploadStatus, 'Photo captured! Enter a message and click Encode.', 'success');
    }, 'image/png');
});

// Encode captured image
encodeCaptureBtnBtn.addEventListener('click', async () => {
    const message = captureMessageInput.value.trim();

    if (!message) {
        setStatus(cameraUploadStatus, 'Please enter a message to hide.', 'error');
        return;
    }

    if (!capturedImageBlob) {
        setStatus(cameraUploadStatus, 'No captured image. Please capture a photo.', 'error');
        return;
    }

    setStatus(cameraUploadStatus, 'Encoding captured image...', '');
    encodeCaptureBtnBtn.disabled = true;

    const formData = new FormData();
    formData.append('image', capturedImageBlob, 'capture.png');
    formData.append('message', message);

    try {
        const response = await fetch('/encode/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Encoding failed.');
        }

        cameraEncodedBlob = await response.blob();

        cameraUploadResult.style.display = 'none';
        cameraEncodeResult.style.display = 'block';
        setStatus(cameraUploadStatus, 'Camera capture encoded successfully!', 'success');
    } catch (error) {
        console.error(error);
        setStatus(cameraUploadStatus, error.message, 'error');
        cameraEncodeResult.style.display = 'none';
    } finally {
        encodeCaptureBtnBtn.disabled = false;
    }
});

downloadCameraEncodedBtn.addEventListener('click', () => {
    if (cameraEncodedBlob) {
        downloadBlob(cameraEncodedBlob, 'encoded-camera.png');
    }
});

// ============================================================================
// DECODE - UPLOAD IMAGE
// ============================================================================

const decodeForm = document.getElementById('decode-form');
const decodeFileInput = document.getElementById('decode-file-input');
const decodeStatus = document.getElementById('decode-status');
const decodeResult = document.getElementById('decode-result');
const decodedMessage = document.getElementById('decoded-message');

decodeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = decodeFileInput.files[0];

    if (!file) {
        setStatus(decodeStatus, 'No file selected.', 'error');
        return;
    }

    setStatus(decodeStatus, 'Decoding...', '');

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/decode/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Decode failed.');
        }

        const payload = await response.json();
        decodedMessage.textContent = payload.decoded || 'No hidden message found.';

        setStatus(decodeStatus, 'Decoded successfully!', 'success');
        decodeResult.style.display = 'block';
    } catch (error) {
        console.error(error);
        setStatus(decodeStatus, error.message, 'error');
        decodeResult.style.display = 'none';
    }
});


