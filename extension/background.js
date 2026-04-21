// Initialize and update the badge
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['streak'], (data) => {
    const streak = data.streak || 0;
    updateBadge(streak);
  });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.streak) {
    updateBadge(changes.streak.newValue);
  }
});

function updateBadge(streak) {
  const text = streak > 0 ? String(streak) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#82d9ac' }); // Sage Green
}
