document.addEventListener('DOMContentLoaded', () => {
    // Camera Handling
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const photoPreview = document.getElementById('photo-preview');
    
    const btnStartCamera = document.getElementById('btn-start-camera');
    const btnCapture = document.getElementById('btn-capture');
    const btnRetake = document.getElementById('btn-retake');
    
    const imageUpload = document.getElementById('image-upload');
    
    let stream = null;
    let imageBlob = null; // Store the captured or selected image

    // Start Camera
    if (btnStartCamera) {
        btnStartCamera.addEventListener('click', async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = stream;
                video.classList.remove('hidden');
                btnStartCamera.classList.add('hidden');
                btnCapture.classList.remove('hidden');
                photoPreview.classList.add('hidden');
                imageUpload.value = ''; // clear file upload
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Could not access camera. Please use the file upload option.");
            }
        });
    }

    // Capture Photo
    if (btnCapture) {
        btnCapture.addEventListener('click', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            photoPreview.src = dataUrl;
            
            // Convert to Blob for upload
            canvas.toBlob((blob) => {
                imageBlob = blob;
            }, 'image/jpeg');

            // Stop camera stream
            stream.getTracks().forEach(track => track.stop());
            video.classList.add('hidden');
            btnCapture.classList.add('hidden');
            
            photoPreview.classList.remove('hidden');
            btnRetake.classList.remove('hidden');
        });
    }

    // Retake Photo
    if (btnRetake) {
        btnRetake.addEventListener('click', () => {
            btnStartCamera.click();
            btnRetake.classList.add('hidden');
            imageBlob = null;
        });
    }

    // File Upload (Alternative to camera)
    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                imageBlob = file; // Store file for upload
                
                // Show preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    photoPreview.src = e.target.result;
                    photoPreview.classList.remove('hidden');
                    video.classList.add('hidden');
                    btnStartCamera.classList.add('hidden');
                    btnCapture.classList.add('hidden');
                    btnRetake.classList.remove('hidden');
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Form Submission
    const reportForm = document.getElementById('report-form');
    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const alertDiv = document.getElementById('form-alert');
            const submitBtn = document.getElementById('btn-submit');
            
            alertDiv.classList.add('hidden');
            alertDiv.classList.remove('alert-success', 'alert-danger');

            if (!imageBlob) {
                alertDiv.textContent = 'Please capture or upload an animal photo.';
                alertDiv.classList.add('alert-danger');
                alertDiv.classList.remove('hidden');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'SUBMITTING...';

            const formData = new FormData();
            
            // Generate a filename for the blob
            const filename = `animal-${Date.now()}.jpg`;
            formData.append('image', imageBlob, filename);
            
            formData.append('animalType', document.getElementById('animalType').value);
            formData.append('condition', document.getElementById('condition').value);
            formData.append('severity', document.getElementById('severity').value);
            formData.append('description', document.getElementById('description').value);
            formData.append('latitude', document.getElementById('latitude').value);
            formData.append('longitude', document.getElementById('longitude').value);
            formData.append('address', document.getElementById('address').value);

            try {
                const response = await apiUpload('/reports', formData);
                
                alertDiv.textContent = response.message;
                alertDiv.classList.add('alert-success');
                alertDiv.classList.remove('hidden');
                
                reportForm.reset();
                photoPreview.classList.add('hidden');
                btnRetake.classList.add('hidden');
                btnStartCamera.classList.remove('hidden');
                imageBlob = null;
                
                setTimeout(() => {
                    window.location.href = 'my-reports.html';
                }, 2000);
            } catch (error) {
                alertDiv.textContent = error.message;
                alertDiv.classList.add('alert-danger');
                alertDiv.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'SUBMIT ANIMAL REPORT';
            }
        });
    }
});
