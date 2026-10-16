// Setup location handling for forms
const setupLocationButton = (btnId, latId, lngId, addressId, errorId) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const errorDiv = document.getElementById(errorId);
        if (errorDiv) errorDiv.classList.add('hidden');
        
        btn.textContent = 'FETCHING...';
        btn.disabled = true;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                // Success callback
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    document.getElementById(latId).value = lat;
                    document.getElementById(lngId).value = lng;
                    
                    btn.textContent = 'LOCATION ACQUIRED';
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-success');
                    
                    // Try to reverse geocode using a free API (Nominatim)
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        const data = await response.json();
                        if (data && data.display_name) {
                            document.getElementById(addressId).value = data.display_name;
                        } else {
                            document.getElementById(addressId).placeholder = 'Could not auto-fetch address, please enter manually';
                        }
                    } catch (err) {
                        console.log('Reverse geocoding failed', err);
                        document.getElementById(addressId).placeholder = 'Could not auto-fetch address, please enter manually';
                    }
                },
                // Error callback
                (error) => {
                    console.error("Error getting location: ", error);
                    let message = "Could not get location. ";
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            message += "User denied the request for Geolocation.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message += "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            message += "The request to get user location timed out.";
                            break;
                        default:
                            message += "An unknown error occurred.";
                            break;
                    }
                    if (errorDiv) {
                        errorDiv.textContent = message;
                        errorDiv.classList.remove('hidden');
                    } else {
                        alert(message);
                    }
                    
                    btn.textContent = 'USE MY CURRENT LOCATION';
                    btn.disabled = false;
                },
                // Options
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            const msg = "Geolocation is not supported by this browser.";
            if (errorDiv) {
                errorDiv.textContent = msg;
                errorDiv.classList.remove('hidden');
            } else {
                alert(msg);
            }
            btn.textContent = 'USE MY CURRENT LOCATION';
            btn.disabled = false;
        }
    });
};
