// Function to dynamically load images from the images.json file
function loadImages() {
    fetch('assets/images.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load images.json: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(images => {
            console.log('Loaded images from JSON:', images); // Debug the parsed array
            const imageContainer = document.querySelector('.image-container');
            if (!imageContainer) {
                console.error('Image container not found in DOM');
                return;
            }
            imageContainer.innerHTML = ''; // Clear existing images

            if (!Array.isArray(images) || images.length === 0) {
                console.warn('images.json is empty or not an array');
                imageContainer.innerHTML = '<p>No images available</p>';
                return;
            }

            // Load initial set of images
            images.forEach(imageName => {
                const img = document.createElement('img');
                img.src = `assets/${imageName}`;
                img.alt = `Image ${imageName}`;
                img.classList.add('dynamic-image');
                img.onerror = () => console.error(`Failed to load image: assets/${imageName}`); // Log image load errors
                imageContainer.appendChild(img);
            });

            // Duplicate images for continuous scroll
            for (let i = 0; i < 2; i++) {
                images.forEach(imageName => {
                    const img = document.createElement('img');
                    img.src = `assets/${imageName}`;
                    img.alt = `Image ${imageName}`;
                    img.classList.add('dynamic-image');
                    img.onerror = () => console.error(`Failed to load image: assets/${imageName}`);
                    imageContainer.appendChild(img);
                });
            }
        })
        .catch(error => {
            console.error('Error loading images:', error);
            const imageContainer = document.querySelector('.image-container');
            if (imageContainer) {
                imageContainer.innerHTML = '<p>Error loading images</p>';
            }
        });
}

// Function to format numbers to 2 decimal places
function formatTons(value) {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : (num / 1000).toFixed(2); // Fallback to 0.00 if invalid
}

// Function to update progress bar and material flow
function updateStage(progressBarId, materialFlowId, percentage) {
    const progressBar = document.getElementById(progressBarId);
    const materialFlow = document.getElementById(materialFlowId);

    if (progressBar && materialFlow) {
        progressBar.style.width = '0%';
        materialFlow.style.display = 'none';
        setTimeout(() => {
            progressBar.style.width = `${percentage}%`;
            materialFlow.style.display = 'block';
            materialFlow.style.animation = 'material-move 3s infinite';
        }, 100);
    } else {
        console.error(`Element not found: ${progressBarId} or ${materialFlowId}`);
    }
}

// Function to apply pulse effect to numbers
function pulseNumber(id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove('pulse');
        void element.offsetWidth; // Force reflow
        element.classList.add('pulse');
        setTimeout(() => element.classList.remove('pulse'), 1000);
    } else {
        console.error(`Pulse element not found: ${id}`);
    }
}

// Function to fetch and update live data
async function fetchLiveData() {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbyn0moO1qfJb-W1H9u7ujUTvscsD8mDqFL-DiSlUHqRbu7j96R5UDxBjvRyCbYE69gT/exec');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Fetched data:', data); // Log the response for debugging

        // Ensure all expected keys exist, default to 0 if missing
        const procuredTotal = data.procuredTotal || 0;
        const dispatchedTotal = data.dispatechedTotal || data.dispatchedTotal || 0; // Handle typo possibility
        const recycled = data.recycled || 0;
        const coProcessed = data.coProcessed || 0;

        // Calculate max value for progress bar normalization
        const maxValue = Math.max(procuredTotal, dispatchedTotal, recycled, coProcessed) || 1; // Avoid division by 0

        const stages = [
            { id: 'procurement', value: procuredTotal, flowId: 'procurement-flow' },
            { id: 'processing', value: dispatchedTotal, flowId: 'processing-flow' },
            { id: 'recycler', value: recycled, flowId: 'recycler-flow' },
            { id: 'kiln', value: coProcessed, flowId: 'kiln-flow' }
        ];

        stages.forEach(stage => {
            const volume = formatTons(stage.value);
            const element = document.getElementById(`${stage.id}-volume`);
            if (element) {
                element.textContent = `${volume} Tons`;
                pulseNumber(`${stage.id}-volume`);
                const percentage = (stage.value / maxValue) * 100;
                updateStage(`${stage.id}-progress`, stage.flowId, percentage);
            } else {
                console.error(`Scorecard element not found: ${stage.id}-volume`);
            }
        });
    } catch (error) {
        console.error('Error fetching live data:', error);
        document.querySelectorAll('.highlighted-number').forEach(el => {
            el.textContent = 'Data unavailable';
            el.style.color = '#ff4444'; // Red to indicate error
        });
    }
}

// Initialize the page
window.addEventListener('DOMContentLoaded', () => {
    loadImages();
    fetchLiveData(); // Initial fetch
    setInterval(fetchLiveData, 25000); // Refresh every 25 seconds

    document.querySelectorAll('.dashboard-frame').forEach(frame => {
        if (isElementInViewport(frame)) frame.classList.add('animate');
    });

    // Handle initial tab content
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        activeTab.dataset.loaded = 'true';
        console.log('Marking initial active tab as loaded: ' + activeTab.id);
        
        // Trigger initial resize events
        [100, 300, 600].forEach(delay => {
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                console.log(`Triggered initial resize event after ${delay}ms`);
            }, delay);
        });
    }
});

// Utility function to check if element is in viewport
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Handle scroll animations
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (scrollTimeout) window.cancelAnimationFrame(scrollTimeout);
    scrollTimeout = window.requestAnimationFrame(() => {
        document.querySelectorAll('.dashboard-frame').forEach(frame => {
            if (isElementInViewport(frame)) frame.classList.add('animate');
        });
    });
});

// Tab switching functionality with conditional iframe reload and resize event
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        // If the clicked button is already active, do nothing
        if (button.classList.contains('active')) {
            console.log('Tab button already active: ' + button.getAttribute('data-tab'));
            return;
        }

        // Remove active class from all tab buttons and tab content
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
        // Activate the clicked tab button
        button.classList.add('active');
        const targetTab = button.getAttribute('data-tab');
        const tabContent = document.getElementById(targetTab);

        if (tabContent) {
            tabContent.classList.add('active');
            
            // Only force reload if this tab hasn't been loaded before
            if (!tabContent.dataset.loaded) {
                console.log('Initial load for tab: ' + targetTab);
                const iframes = tabContent.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    if (!iframe.dataset.src) {
                        iframe.dataset.src = iframe.getAttribute('src');
                    }
                    iframe.setAttribute('src', iframe.dataset.src);
                });
                tabContent.dataset.loaded = 'true';
            } else {
                console.log('Tab already loaded, triggering resize: ' + targetTab);
            }

            // Trigger resize events with increasing delays to ensure proper rendering
            [100, 300, 600].forEach(delay => {
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    console.log(`Triggered resize event after ${delay}ms`);
                }, delay);
            });
        }
    });
});

// Smooth Scroll for Navigation
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if(href && href.charAt(0) === '#') {
            e.preventDefault();
            const targetSection = document.querySelector(href);
            if(targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        } // else, do nothing and allow normal navigation
    });
});