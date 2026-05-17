/** @fileoverview Settings Page Logic */

import { loadSettings, saveSettings } from '../utils/storage.js';

const DEFAULT_SETTINGS = {
  popupWidth: 800,
  showTitles: true,
  showIndices: true,
  autoCenter: true,
  keyboardNav: true,
  scrollSpeed: 1.0,
  theme: 'auto'
};

let saveTimeout = null;

function applyTheme(theme) {
  let effectiveTheme = theme;

  if (theme === 'auto') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.documentElement.setAttribute('data-theme', effectiveTheme);
}

class SettingsManager {
  constructor() {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.elements = {};
  }

  async init() {
    this.cacheElements();
    await this.loadSettings();
    this.applyInitialTheme();
    this.populateForm();
    this.setupSliderUpdates();
    this.setupThemeToggle();
    this.syncThemeToggleState();
    this.setupAutoSave();
  }

  applyInitialTheme() {
    const theme = this.currentSettings.theme || 'auto';
    applyTheme(theme);
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
      theme: document.getElementById('theme'),
      resetBtn: document.getElementById('resetBtn'),
      notification: document.getElementById('notification'),
      notificationText: document.getElementById('notificationText'),
      themeButtons: document.querySelectorAll('.theme-btn')
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
    this.elements.theme.value = this.currentSettings.theme || 'auto';
    this.elements.popupWidth.value = this.currentSettings.popupWidth;
    this.elements.popupWidthValue.textContent = this.currentSettings.popupWidth;
    this.elements.showTitles.checked = this.currentSettings.showTitles;
    this.elements.showIndices.checked = this.currentSettings.showIndices;
    this.elements.autoCenter.checked = this.currentSettings.autoCenter;
    this.elements.keyboardNav.checked = this.currentSettings.keyboardNav;
    this.elements.scrollSpeed.value = this.currentSettings.scrollSpeed;
    this.elements.scrollSpeedValue.textContent = parseFloat(this.currentSettings.scrollSpeed).toFixed(1);
  }

  setupAutoSave() {
    const autoSaveHandler = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => this.saveSettings(), 300);
    };

    this.elements.theme.addEventListener('change', autoSaveHandler);
    this.elements.popupWidth.addEventListener('input', autoSaveHandler);
    this.elements.scrollSpeed.addEventListener('input', autoSaveHandler);
    this.elements.showTitles.addEventListener('change', autoSaveHandler);
    this.elements.showIndices.addEventListener('change', autoSaveHandler);
    this.elements.autoCenter.addEventListener('change', autoSaveHandler);
    this.elements.keyboardNav.addEventListener('change', autoSaveHandler);

    this.elements.resetBtn.addEventListener('click', () => this.resetSettings());
    this.elements.theme.addEventListener('change', () => {
      applyTheme(this.elements.theme.value);
      this.syncThemeToggleState();
    });
  }

  setupSliderUpdates() {
    this.elements.popupWidth.addEventListener('input', (e) => {
      this.elements.popupWidthValue.textContent = e.target.value;
    });

    this.elements.scrollSpeed.addEventListener('input', (e) => {
      this.elements.scrollSpeedValue.textContent = parseFloat(e.target.value).toFixed(1) + 'x';
    });
  }

  setupThemeToggle() {
    this.elements.themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        this.elements.theme.value = theme;
        applyTheme(theme);
        this.syncThemeToggleState();
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => this.saveSettings(), 300);
      });
    });
  }

  syncThemeToggleState() {
    const currentTheme = this.elements.theme.value;
    this.elements.themeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });
  }

  showNotification(message) {
    this.elements.notificationText.textContent = message;
    this.elements.notification.classList.add('show');
    setTimeout(() => {
      this.elements.notification.classList.remove('show');
    }, 2500);
  }

  async saveSettings(manual = false) {
    const newSettings = {
      popupWidth: parseInt(this.elements.popupWidth.value),
      showTitles: this.elements.showTitles.checked,
      showIndices: this.elements.showIndices.checked,
      autoCenter: this.elements.autoCenter.checked,
      keyboardNav: this.elements.keyboardNav.checked,
      scrollSpeed: parseFloat(this.elements.scrollSpeed.value),
      theme: this.elements.theme.value
    };

    try {
      await saveSettings(newSettings);
      this.currentSettings = { ...newSettings };
      this.showNotification(manual ? 'Settings saved' : 'Saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showNotification('Error saving settings');
    }
  }

  async resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
      try {
        await saveSettings(DEFAULT_SETTINGS);
        this.currentSettings = { ...DEFAULT_SETTINGS };
        this.populateForm();
        applyTheme(DEFAULT_SETTINGS.theme);
        this.syncThemeToggleState();
        this.showNotification('Settings reset to defaults');
      } catch (error) {
        console.error('Error resetting settings:', error);
        this.showNotification('Error resetting settings');
      }
    }
  }
}

const settings = new SettingsManager();
document.addEventListener('DOMContentLoaded', () => settings.init());