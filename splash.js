const sentences = [
    "Initialising modules...",
    "Connecting to servers...",
    "Loading configuration...",
    "Setting up environment...",
    "Almost there...",
    "Preparing logs...",
    "Finalising settings...",
    "Getting things ready...",
    "Just a moment...",
    "Starting the application..."
];

let currentIndex = 0;

function updateText() {
    const loadingText = document.getElementById("loadingText");
    loadingText.textContent = sentences[currentIndex];
    currentIndex++;

    let delay;
    if (currentIndex <= 6) {
        delay = 500; 
    } else {
        delay = 250; 
        loadingText.style.animation = "none"; 
    }

    if (currentIndex < sentences.length) {
        setTimeout(updateText, delay);
    }
}

document.addEventListener("DOMContentLoaded", updateText);
