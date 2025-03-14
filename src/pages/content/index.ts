// Content script for SeeZen extension

// This script runs on every web page that matches the "matches" pattern in manifest.json
// Now the site blocking is handled by declarativeNetRequest in the background script

// Initialization
console.log('SeeZen content script initialized');

// The content script can still be used for other features that need to interact with the webpage
// For example, you might want to add UI elements, collect statistics, etc. 