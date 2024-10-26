// script.js

// Function to dynamically load images from the images.json file
function loadImages() {
    fetch('assets/images.json')
        .then(response => response.json())
        .then(images => {
            const imageContainer = document.querySelector('.image-container');

            images.forEach(imageName => {
                const img = document.createElement('img');
                img.src = `assets/${imageName}`;
                img.alt = `Image ${imageName}`;
                img.classList.add('dynamic-image');
                imageContainer.appendChild(img);
            });
        })
        .catch(error => console.error('Error loading images:', error));
}

// Call the loadImages function on page load
window.addEventListener('DOMContentLoaded', loadImages);

// Other functions in script.js...

// Function to format numbers to 2 decimal places
function formatTons(value) {
    return (value / 1000).toFixed(2); // Convert to tons and limit to 2 decimal places
}

// Animate the progress bars and material flow
function updateStage(progressBarId, materialFlowId) {
    const progressBar = document.getElementById(progressBarId);
    const materialFlow = document.getElementById(materialFlowId);

    // Reset the progress bar and flow
    progressBar.style.width = '0%';
    materialFlow.style.display = 'none';

    // Start animation
    setTimeout(() => {
        progressBar.style.width = '100%';
        materialFlow.style.display = 'block';
        materialFlow.style.animation = 'material-move 3s infinite';
    }, 100);
}

// Highlight the numbers and apply pulse effect
function pulseNumber(id) {
    const element = document.getElementById(id);
    element.classList.add('pulse');
    setTimeout(() => element.classList.remove('pulse'), 1000);
}

// Fetch the live data
async function fetchLiveData() {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbyn0moO1qfJb-W1H9u7ujUTvscsD8mDqFL-DiSlUHqRbu7j96R5UDxBjvRyCbYE69gT/exec');
        const data = await response.json();

        // Update the volumes with pulse effect, converting KG to Metric Tons (Tonnes)
        document.getElementById('procurement-volume').innerText = `${formatTons(data.procuredTotal)} Tons`;
        pulseNumber('procurement-volume');
        document.getElementById('processing-volume').innerText = `${formatTons(data.dispatechedTotal)} Tons`;
        pulseNumber('processing-volume');
        document.getElementById('recycler-volume').innerText = `${formatTons(data.recycled)} Tons`;
        pulseNumber('recycler-volume');
        document.getElementById('kiln-volume').innerText = `${formatTons(data.coProcessed)} Tons`;
        pulseNumber('kiln-volume');

        // Trigger animations for each stage
        updateStage('procurement-progress', 'procurement-flow');
        setTimeout(() => updateStage('processing-progress', 'processing-flow'), 5000);
        setTimeout(() => updateStage('recycler-progress', 'recycler-flow'), 10000);
        setTimeout(() => updateStage('kiln-progress', 'kiln-flow'), 15000);
    } catch (error) {
        console.error('Error fetching live data:', error);
    }
}

// Fetch live data and trigger animations when page loads
fetchLiveData();
setInterval(fetchLiveData, 25000); // Refresh every 25 seconds
