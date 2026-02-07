/** @fileoverview Settings Page Logic */

import { loadSettings, saveSettings } from '../utils/storage.js';
import { showMessage } from '../modules/uiUtils.js';

const DEFAULT_SETTINGS = {
  popupWidth: 800,
  showTitles: true,
  showIndices: true,
  autoCenter: true,
  keyboardNav: true,
  scrollSpeed: 1.0
};

class SettingsManager {
  constructor() {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.elements = {};
  }

  async init() {
    this.cacheElements();
    await this.loadSettings();
    this.populateForm();
    this.setupEventListeners();
    this.setupSliderUpdates();
  }

  cacheElements() {
    this.elements = {
      popupWidth: document.getElementById('popupWidth'),
      popupWidthValue: document.getElementById('popupWidthValue'),
      showTitles: document.getElementById('showTitles'),
      showIndices: document.getElementById('showIndices'),
      autoCenter: document.getElementById('autoCenter'),
      keyboardNav: document.getElementById('keyboardNav'),
      scrollSpeed: document.getElementById('scrollSpeed'),
      scrollSpeedValue: document.getElementById('scrollSpeedValue'),
      saveBtn: document.getElementById('saveBtn'),
      resetBtn: document.getElementById('resetBtn')
    };
  }

  async loadSettings() {
    try {
      this.currentSettings = await loadSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  populateForm() {
    // Popup width
    this.elements.popupWidth.value = this.currentSettings.popupWidth;
    this.elements.popupWidthValue.textContent = this.currentSettings.popupWidth;
    
    // Checkboxes
    this.elements.showTitles.checked = this.currentSettings.showTitles;
    this.elements.showIndices.checked = this.currentSettings.showIndices;
    this.elements.autoCenter.checked = this.currentSettings.autoCenter;
    this.elements.keyboardNav.checked = this.currentSettings.keyboardNav;
    
    // Scroll speed
    this.elements.scrollSpeed.value = this.currentSettings.scrollSpeed;
    this.elements.scrollSpeedValue.textContent = this.currentSettings.scrollSpeed;
  }

  setupSliderUpdates() {
    this.elements.popupWidth.addEventListener('input', (e) => {
      this.elements.popupWidthValue.textContent = e.target.value;
    });
    
    this.elements.scrollSpeed.addEventListener('input', (e) => {
      this.elements.scrollSpeedValue.textContent = parseFloat(e.target.value).toFixed(1);
    });
  }

  setupEventListeners() {
    this.elements.saveBtn.addEventListener('click', () => this.saveSettings());
    this.elements.resetBtn.addEventListener('click', () => this.resetSettings());
  }

  async saveSettings() {
    const newSettings = {
      popupWidth: parseInt(this.elements.popupWidth.value),
      showTitles: this.elements.showTitles.checked,
      showIndices: this.elements.showIndices.checked,
      autoCenter: this.elements.autoCenter.checked,
      keyboardNav: this.elements.keyboardNav.checked,
      scrollSpeed: parseFloat(this.elements.scrollSpeed.value)
    };
    
    try {
      await saveSettings(newSettings);
      this.currentSettings = { ...newSettings };
      showMessage('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('Error saving settings. Please try again.', 'error');
    }
  }

  async resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
      try {
        await saveSettings(DEFAULT_SETTINGS);
        this.currentSettings = { ...DEFAULT_SETTINGS };
        this.populateForm();
        showMessage('Settings reset to defaults.', 'success');
      } catch (error) {
        console.error('Error resetting settings:', error);
        showMessage('Error resetting settings.', 'error');
      }
    }
  }
}

// Initialize
const settings = new SettingsManager();
document.addEventListener('DOMContentLoaded', () => settings.init());
