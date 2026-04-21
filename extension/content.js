(async () => {
    // Avoid multiple injections
    if (document.getElementById('moment-overlay')) return;

    // Load data
    const data = await chrome.storage.local.get(['streak', 'lastActiveDate', 'interventions']);
    const streak = data.streak || 0;
    const interventions = data.interventions || [];

    // Create the overlay container
    const overlay = document.createElement('div');
    overlay.id = 'moment-overlay';
    document.body.appendChild(overlay);

    // Lock scroll on underlying page
    document.body.style.overflow = 'hidden';

    // UI Renderers
    function showPhase1() {
        overlay.innerHTML = `
            <div class="fg-streak-badge">
                <span class="fg-s-dot"></span>
                <span class="fg-s-num">${streak}</span>
                <span>day streak</span>
            </div>
            <div class="fg-inner">
                <div class="fg-wordmark">Moment</div>
                <div class="fg-head">Before you order —<br>what's actually going on?</div>
                <div class="fg-sub">Take a moment. This pause takes less than 20 seconds.</div>
                <div class="fg-btn-row">
                    <button class="fg-btn prime" id="fg-bored">I'm bored or stressed</button>
                    <button class="fg-btn" id="fg-hungry">I'm genuinely hungry</button>
                </div>
            </div>
        `;
        // Tiny delay to ensure transition triggers
        requestAnimationFrame(() => overlay.classList.add('visible'));
    }

    function showPhase2() {
        overlay.innerHTML = `
            <div class="fg-streak-badge">
                <span class="fg-s-dot"></span>
                <span class="fg-s-num">${streak}</span>
                <span>day streak</span>
            </div>
            <div class="fg-inner">
                <div class="fg-wordmark">Moment</div>
                <div class="fg-breath-wrap">
                    <div class="fg-rings">
                        <div class="fg-ring fg-r1"></div>
                        <div class="fg-ring fg-r2"></div>
                        <div class="fg-ring fg-r3"></div>
                        <div class="fg-ring fg-r4"></div>
                        <div class="fg-core"></div>
                    </div>
                    <div class="fg-breath-label" id="fg-blbl">Breathe in...</div>
                    <div class="fg-breath-phases">
                        <div class="fg-bp"><div class="fg-bp-lbl">Inhale</div><div class="fg-bp-sec act" id="fg-sec-in">4s</div></div>
                        <div class="fg-bp"><div class="fg-bp-lbl">Hold</div><div class="fg-bp-sec" id="fg-sec-hold">7s</div></div>
                        <div class="fg-bp"><div class="fg-bp-lbl">Exhale</div><div class="fg-bp-sec" id="fg-sec-out">8s</div></div>
                    </div>
                    <div class="fg-breath-timer" id="fg-btimer">19s remaining</div>
                </div>
            </div>
        `;
        startBreathing();
    }

    function showPhase3() {
        overlay.innerHTML = `
            <div class="fg-streak-badge">
                <span class="fg-s-dot"></span>
                <span class="fg-s-num">${streak}</span>
                <span>day streak</span>
            </div>
            <div class="fg-inner">
                <div class="fg-wordmark">Moment</div>
                <div class="fg-p3-eye">Done. Now decide freely.</div>
                <div class="fg-p3-q">What feels right?</div>
                <div class="fg-p3-sub">No judgment. You've already done the hard part.</div>
                <div class="fg-cards">
                    <div class="fg-ccard g" id="fg-choice-home">
                        <div class="fg-ci home">🍳</div>
                        <div class="fg-ctitle">Eat at home</div>
                        <div class="fg-cdesc">Cook something, or use what you have</div>
                    </div>
                    <div class="fg-ccard" id="fg-choice-order">
                        <div class="fg-ci order">📦</div>
                        <div class="fg-ctitle">Still order</div>
                        <div class="fg-cdesc">That's okay — proceed to Zomato</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Logic Functions
    function startBreathing() {
        let t = 19;
        const timer = document.getElementById('fg-btimer');
        const label = document.getElementById('fg-blbl');
        const secIn = document.getElementById('fg-sec-in');
        const secHold = document.getElementById('fg-sec-hold');
        const secOut = document.getElementById('fg-sec-out');

        const phases = [
            { start: 19, text: 'Breathe in...', active: secIn },
            { start: 15, text: 'Hold...', active: secHold },
            { start: 8, text: 'Breathe out...', active: secOut }
        ];

        const tick = setInterval(() => {
            t--;
            if (timer) timer.textContent = `${Math.max(0, t)}s remaining`;

            phases.forEach(p => {
                if (t === p.start - 1) {
                    if (label) label.textContent = p.text;
                    // Reset highlights
                    [secIn, secHold, secOut].forEach(s => s?.classList.remove('act'));
                    if (p.active) p.active.classList.add('act');
                }
            });

            if (t <= 0) {
                clearInterval(tick);
                showPhase3();
            }
        }, 1000);
    }

    async function updateStreakAndSave(phase1Result, breathDone, finalChoice) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        let newStreak = streak;

        // Streak logic: increment if last active was yesterday, reset if longer, keep if today
        if (data.lastActiveDate !== today) {
            newStreak = (data.lastActiveDate === yesterday) ? streak + 1 : 1;
        }

        const newIntervention = {
            ts: Date.now(),
            phase1: phase1Result,
            breathDone: breathDone,
            choice: finalChoice
        };

        interventions.push(newIntervention);

        await chrome.storage.local.set({
            streak: newStreak,
            lastActiveDate: today,
            interventions: interventions.slice(-100)
        });
    }

    function closeOverlay() {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 500);
    }

    // Interaction Handling
    overlay.addEventListener('click', async (e) => {
        // Use closest to handle clicks on child elements of buttons/cards
        const hungryBtn = e.target.closest('#fg-hungry');
        const boredBtn = e.target.closest('#fg-bored');
        const homeChoice = e.target.closest('#fg-choice-home');
        const orderChoice = e.target.closest('#fg-choice-order');

        if (hungryBtn) {
            await updateStreakAndSave('hungry', false, 'released');
            closeOverlay();
        } else if (boredBtn) {
            showPhase2();
        } else if (homeChoice) {
            await updateStreakAndSave('bored', true, 'home');
            closeOverlay();
        } else if (orderChoice) {
            await updateStreakAndSave('bored', true, 'order');
            closeOverlay();
        }
    });

    // Initialize
    showPhase1();
})();
