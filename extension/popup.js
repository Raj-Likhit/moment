chrome.storage.local.get(['streak', 'interventions'], (data) => {
    const streak = data.streak || 0;
    const interventions = data.interventions || [];
    const todayStr = new Date().toDateString();

    const todayInterventions = interventions.filter(i => new Date(i.ts).toDateString() === todayStr);
    const homeCount = interventions.filter(i => i.choice === 'home').length;
    const savings = homeCount * 320; // Default ₹320 avg order value

    document.getElementById('streak').textContent = streak;
    document.getElementById('today').textContent = todayInterventions.length;
    document.getElementById('home').textContent = `${homeCount} total`;
    document.getElementById('saved').textContent = `₹${savings}`;
});

document.getElementById('dash-btn').addEventListener('click', () => {
    // Open the local dashboard file
    chrome.tabs.create({ url: 'website/index.html' });
});
