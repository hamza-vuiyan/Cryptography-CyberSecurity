/**
 * Steganography App - Camera and Capture Handler
 * 
 * Camera Flow:
 * - Captures a single frame from the webcam
 * - Decodes the captured image (extracts hidden message)
 * - Displays result without page refresh
 */

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('capture-button');
const cameraStatus = document.getElementById('camera-status');
const captureResult = document.getElementById('capture-result');

/**
 * Extract CSRF token from browser cookies for POST requests
 */
function getCSRFToken() {
    const match = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='));
    return match ? match.split('=')[1] : '';
}

/**
 * Update camera status message with styling
 * @param {string} message - Status text to display
 * @param {string} kind - CSS class: '', 'success', or 'error'
 */
function setStatus(message, kind = '') {
    cameraStatus.textContent = message;
    cameraStatus.className = `status ${kind}`.trim();
}

/**
 * Initialize webcam stream and prepare for capture
 * Requires HTTPS or localhost; user must grant camera permission
 */
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });
        video.srcObject = stream;
        await video.play();
        captureButton.disabled = false;
        setStatus('Camera ready.', 'success');
    } catch (error) {
        console.error(error);
        setStatus('Camera access failed. Use HTTPS or localhost and allow permissions.', 'error');
    }
}

/**
 * Capture a frame from the video stream and decode it
 * 
 * Process:
 * 1. Draw video frame to canvas
 * 2. Convert canvas to PNG blob
 * 3. Send blob to /decode/ endpoint
 * 4. Display decoded message or error
 */
async function capture() {
    // Ensure camera has loaded a frame
    if (!video.videoWidth || !video.videoHeight) {
        setStatus('Camera is still warming up. Try again in a moment.', 'error');
        return;
    }

    // Draw current video frame to canvas at exact dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to PNG blob
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
        setStatus('Could not capture a frame from the camera.', 'error');
        return;
    }

    // Disable button during processing
    captureButton.disabled = true;
    setStatus('Decoding captured frame...', '');

    // Prepare form data with captured image
    const formData = new FormData();
    formData.append('image', blob, 'capture.png');

    try {
        const response = await fetch('/decode/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Accept': 'application/json',
            },
            body: formData,
        });

        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Decode failed.');
        }

        // Display decoded message
        captureResult.textContent = payload.decoded || 'No hidden message found.';
        setStatus('Capture decoded successfully.', 'success');
    } catch (error) {
        console.error(error);
        captureResult.textContent = 'Decode failed.';
        setStatus(error.message, 'error');
    } finally {
        // Re-enable button for next capture
        captureButton.disabled = false;
    }
}

// Event listeners
captureButton.addEventListener('click', capture);

// Initialize camera on page load
startCamera();
