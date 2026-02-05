// Settings Page Logic

const defaultSettings = {
  popupWidth: 800,
  showTitles: true,
  showIndices: true,
  autoCenter: true,
  keyboardNav: true,
  scrollSpeed: 1.0
};

let currentSettings = { ...defaultSettings };

// Initialize
async function init() {
  // Load settings
  await loadSettings();
  
  // Populate form
  populateForm();
  
  // Set up event listeners
  setupEventListeners();
  
  // Update slider values in real-time
  setupSliderUpdates();
}

// Load settings from storage
async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get(defaultSettings);
    currentSettings = { ...defaultSettings, ...stored };
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Populate form with current settings
function populateForm() {
  // Popup width
  document.getElementById('popupWidth').value = currentSettings.popupWidth;
  document.getElementById('popupWidthValue').textContent = currentSettings.popupWidth;
  
  // Checkboxes
  document.getElementById('showTitles').checked = currentSettings.showTitles;
  document.getElementById('showIndices').checked = currentSettings.showIndices;
  document.getElementById('autoCenter').checked = currentSettings.autoCenter;
  document.getElementById('keyboardNav').checked = currentSettings.keyboardNav;
  
  // Scroll speed
  document.getElementById('scrollSpeed').value = currentSettings.scrollSpeed;
  document.getElementById('scrollSpeedValue').textContent = currentSettings.scrollSpeed;
}

// Setup slider value updates
function setupSliderUpdates() {
  document.getElementById('popupWidth').addEventListener('input', (e) => {
    document.getElementById('popupWidthValue').textContent = e.target.value;
  });
  
  document.getElementById('scrollSpeed').addEventListener('input', (e) => {
    document.getElementById('scrollSpeedValue').textContent = parseFloat(e.target.value).toFixed(1);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  
  // Reset button
  document.getElementById('resetBtn').addEventListener('click', resetSettings);
}

// Save settings
async function saveSettings() {
  // Collect form values
  const newSettings = {
    popupWidth: parseInt(document.getElementById('popupWidth').value),
    showTitles: document.getElementById('showTitles').checked,
    showIndices: document.getElementById('showIndices').checked,
    autoCenter: document.getElementById('autoCenter').checked,
    keyboardNav: document.getElementById('keyboardNav').checked,
    scrollSpeed: parseFloat(document.getElementById('scrollSpeed').value)
  };
  
  try {
    await chrome.storage.sync.set(newSettings);
    currentSettings = { ...newSettings };
    
    // Show success message
    showMessage('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('Error saving settings. Please try again.', 'error');
  }
}

// Reset to defaults
async function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    try {
      await chrome.storage.sync.set(defaultSettings);
      currentSettings = { ...defaultSettings };
      populateForm();
      showMessage('Settings reset to defaults.', 'success');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showMessage('Error resetting settings.', 'error');
    }
  }
}

// Show message
function showMessage(text, type) {
  // Remove existing message
  const existing = document.querySelector('.message');
  if (existing) existing.remove();
  
  // Create message
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#4caf50' : '#f44336'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(message);
  
  // Remove after 3 seconds
  setTimeout(() => {
    message.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => message.remove(), 300);
  }, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
