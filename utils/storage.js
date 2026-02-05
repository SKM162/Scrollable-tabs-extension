// Storage utility functions

export async function saveSettings(settings) {
  try {
    await chrome.storage.sync.set(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function loadSettings(defaultSettings) {
  try {
    const stored = await chrome.storage.sync.get(defaultSettings);
    return { ...defaultSettings, ...stored };
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
}
