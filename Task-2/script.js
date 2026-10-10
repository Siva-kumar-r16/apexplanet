/**
 * THE OUTLAW'S JOURNAL - REDESIGN
 * Vanilla JS, LocalStorage, Mailto Integration.
 */

const app = {
    data: { entries: [], missions: [], sketches: [] },
    
    init() {
        this.loadData();
        this.cacheDOM();
        this.bindEvents();
        this.setDates();
        this.renderAll();
    },

    cacheDOM() {
        this.cover = document.getElementById('journal-cover');
        this.appInterface = document.getElementById('journal-app');
        this.navTabs = document.querySelectorAll('.nav-tab[data-target]');
        this.sections = document.querySelectorAll('.view-section');
        this.btnOpen = document.getElementById('btn-open-journal');
        this.btnClose = document.getElementById('btn-close-journal');
        this.btnNewEntry = document.getElementById('btn-new-entry');
        this.editorPanel = document.getElementById('entry-editor');
        this.entriesList = document.getElementById('entries-list');
        this.searchEntries = document.getElementById('search-entries');
        this.missionForm = document.getElementById('mission-form');
        this.contactForm = document.getElementById('contact-form');
        this.sketchUpload = document.getElementById('sketch-upload');
    },

    bindEvents() {
        this.btnOpen.addEventListener('click', () => this.openJournal());
        this.btnClose.addEventListener('click', () => this.closeJournal());

        this.navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.target));
        });

        this.btnNewEntry.addEventListener('click', () => this.showEditor());
        document.getElementById('btn-cancel-entry').addEventListener('click', () => {
            this.editorPanel.classList.add('hidden');
            this.clearEditor();
        });
        document.getElementById('btn-save-entry').addEventListener('click', () => this.saveEntry());
        this.searchEntries.addEventListener('input', (e) => this.renderEntries(e.target.value));

        this.missionForm.addEventListener('submit', (e) => this.addMission(e));
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderMissions(e.target.dataset.filter);
            });
        });

        this.sketchUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.contactForm.addEventListener('submit', (e) => this.validateAndSendContact(e));
    },

    loadData() {
        const storedEntries = localStorage.getItem('outlaw_entries');
        const storedMissions = localStorage.getItem('outlaw_missions');
        const storedSketches = localStorage.getItem('outlaw_sketches');

        this.data.entries = storedEntries ? JSON.parse(storedEntries) : this.getDefaultEntries();
        this.data.missions = storedMissions ? JSON.parse(storedMissions) : [];
        this.data.sketches = storedSketches ? JSON.parse(storedSketches) : [];
    },

    saveData(key) {
        try {
            localStorage.setItem(`outlaw_${key}`, JSON.stringify(this.data[key]));
        } catch (e) {
            alert("Storage limit reached.");
        }
    },

    getDefaultEntries() {
        return [{
            id: Date.now().toString(),
            title: "Blackwater... Again",
            date: new Date().toISOString().split('T')[0],
            mood: "Reflective",
            body: "Things went wrong. They always do lately. Wrote this down so I don't forget the faces of those we left behind."
        }];
    },

    openJournal() {
        this.cover.classList.add('opening');
        setTimeout(() => {
            this.cover.classList.add('hidden');
            this.appInterface.classList.remove('hidden');
        }, 1200);
    },

    closeJournal() {
        this.appInterface.classList.add('hidden');
        this.cover.classList.remove('hidden', 'opening');
    },

    switchTab(targetId) {
        this.navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.target === targetId);
        });
        this.sections.forEach(sec => {
            const isTarget = sec.id === `view-${targetId}`;
            sec.classList.toggle('active', isTarget);
            sec.classList.toggle('hidden', !isTarget);
        });
        if(targetId === 'dashboard') this.updateDashboard();
        if(targetId === 'memories') this.renderTimeline();
    },

    setDates() {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('dash-date').textContent = today;
    },

    renderAll() {
        this.updateDashboard();
        this.renderEntries();
        this.renderMissions();
        this.renderSketches();
        this.switchTab('dashboard');
    },

    updateDashboard() {
        document.getElementById('stat-entries').textContent = this.data.entries.length;
        document.getElementById('stat-missions').textContent = this.data.missions.filter(m => !m.completed).length;
        document.getElementById('stat-completed').textContent = this.data.missions.filter(m => m.completed).length;

        const recent = this.data.entries.slice().sort((a,b) => b.id - a.id)[0];
        const previewContainer = document.getElementById('recent-preview');
        if (recent) {
            previewContainer.innerHTML = `
                <h3 style="font-family: var(--font-heading); margin-top: 2rem;">Latest Entry</h3>
                <div class="entry-card" style="margin-top:1rem;">
                    <h3>${this.escapeHTML(recent.title)}</h3>
                    <p class="handwritten">"${this.escapeHTML(recent.body.substring(0, 100))}..."</p>
                </div>
            `;
        }
    },

    showEditor(entry = null) {
        this.editorPanel.classList.remove('hidden');
        if (entry) {
            document.getElementById('entry-id').value = entry.id;
            document.getElementById('entry-title').value = entry.title;
            document.getElementById('entry-date').value = entry.date;
            document.getElementById('entry-mood').value = entry.mood;
            document.getElementById('entry-body').value = entry.body;
        } else {
            this.clearEditor();
            document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
        }
        this.editorPanel.scrollIntoView({ behavior: 'smooth' });
    },

    clearEditor() {
        document.getElementById('entry-id').value = '';
        document.getElementById('entry-title').value = '';
        document.getElementById('entry-body').value = '';
        document.getElementById('entry-msg').textContent = '';
    },

    saveEntry() {
        const id = document.getElementById('entry-id').value;
        const title = document.getElementById('entry-title').value.trim();
        const date = document.getElementById('entry-date').value;
        const mood = document.getElementById('entry-mood').value;
        const body = document.getElementById('entry-body').value.trim();

        if (!title || !body) {
            document.getElementById('entry-msg').textContent = "Title and words are required.";
            return;
        }

        const newEntry = { id: id || Date.now().toString(), title, date, mood, body };
        if (id) {
            const index = this.data.entries.findIndex(e => e.id === id);
            this.data.entries[index] = newEntry;
        } else {
            this.data.entries.push(newEntry);
        }

        this.saveData('entries');
        this.renderEntries();
        this.updateDashboard();
        
        document.getElementById('entry-msg').textContent = "Saved to journal.";
        setTimeout(() => this.editorPanel.classList.add('hidden'), 1000);
    },

    deleteEntry(id) {
        if(confirm("Burn this page from the journal?")) {
            this.data.entries = this.data.entries.filter(e => e.id !== id);
            this.saveData('entries');
            this.renderEntries();
            this.updateDashboard();
        }
    },

    renderEntries(searchTerm = '') {
        this.entriesList.innerHTML = '';
        let filtered = this.data.entries.slice().sort((a,b) => b.id - a.id);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(e => e.title.toLowerCase().includes(term) || e.body.toLowerCase().includes(term));
        }

        if (filtered.length === 0) {
            this.entriesList.innerHTML = `<p style="opacity:0.6;">No pages found.</p>`;
            return;
        }

        filtered.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'entry-card';
            div.innerHTML = `
                <h3>${this.escapeHTML(entry.title)}</h3>
                <p class="handwritten">"${this.escapeHTML(entry.body.substring(0, 80))}..."</p>
                <div style="font-size: 0.9rem; color: var(--ink-faded); display: flex; justify-content: space-between; margin-top:0.5rem;">
                    <span>${entry.date} - Mood: ${entry.mood}</span>
                    <div>
                        <button class="btn-ink edit-btn" data-id="${entry.id}">Edit</button> | 
                        <button class="btn-ink del-btn" style="color:var(--color-blood);" data-id="${entry.id}">Burn</button>
                    </div>
                </div>
            `;
            this.entriesList.appendChild(div);
        });

        this.entriesList.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => this.showEditor(this.data.entries.find(en => en.id === e.target.dataset.id))));
        this.entriesList.querySelectorAll('.del-btn').forEach(btn => btn.addEventListener('click', (e) => this.deleteEntry(e.target.dataset.id)));
    },

    addMission(e) {
        e.preventDefault();
        const input = document.getElementById('mission-input');
        if(!input.value.trim()) return;

        this.data.missions.push({
            id: Date.now().toString(),
            text: input.value.trim(),
            priority: document.getElementById('mission-priority').value,
            completed: false
        });

        this.saveData('missions');
        input.value = '';
        this.renderMissions();
        this.updateDashboard();
    },

    toggleMission(id) {
        const mission = this.data.missions.find(m => m.id === id);
        if (mission) {
            mission.completed = !mission.completed;
            this.saveData('missions');
            this.renderMissions(document.querySelector('.filter-btn.active').dataset.filter);
            this.updateDashboard();
        }
    },

    deleteMission(id) {
        this.data.missions = this.data.missions.filter(m => m.id !== id);
        this.saveData('missions');
        this.renderMissions(document.querySelector('.filter-btn.active').dataset.filter);
        this.updateDashboard();
    },

    renderMissions(filter = 'all') {
        const list = document.getElementById('mission-list');
        list.innerHTML = '';

        let filtered = this.data.missions;
        if(filter === 'pending') filtered = filtered.filter(m => !m.completed);
        if(filter === 'completed') filtered = filtered.filter(m => m.completed);

        filtered.forEach(m => {
            const li = document.createElement('li');
            li.className = `mission-item ${m.completed ? 'completed' : ''}`;
            const pMark = m.priority === 'high' ? '<span style="color:var(--color-blood); margin-right:5px;">!</span>' : '';

            li.innerHTML = `
                <input type="checkbox" ${m.completed ? 'checked' : ''} data-id="${m.id}">
                <span class="mission-text handwritten">${pMark}${this.escapeHTML(m.text)}</span>
                <button class="btn-del" data-id="${m.id}">✕</button>
            `;
            list.appendChild(li);
        });

        list.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', (e) => this.toggleMission(e.target.dataset.id)));
        list.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', (e) => this.deleteMission(e.target.dataset.id)));
    },

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 300 / img.width;
                canvas.width = 300; canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                
                this.data.sketches.push({
                    id: Date.now().toString(),
                    src: canvas.toDataURL('image/jpeg', 0.6),
                    date: new Date().toISOString().split('T')[0]
                });
                this.saveData('sketches');
                this.renderSketches();
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(file);
    },

    renderSketches() {
        const gallery = document.getElementById('sketch-gallery');
        gallery.innerHTML = '';
        this.data.sketches.forEach(s => {
            const div = document.createElement('div');
            div.className = 'sketch-card';
            div.innerHTML = `<img src="${s.src}" alt="Sketch"><div style="text-align:right; font-family:var(--font-hand);">${s.date} <button class="btn-del" data-id="${s.id}">✕</button></div>`;
            gallery.appendChild(div);
        });
        gallery.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', (e) => {
            this.data.sketches = this.data.sketches.filter(sk => sk.id !== e.target.dataset.id);
            this.saveData('sketches');
            this.renderSketches();
        }));
    },

    renderTimeline() {
        const container = document.getElementById('timeline-container');
        container.innerHTML = '';
        const sorted = this.data.entries.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
        
        sorted.forEach(entry => {
            const node = document.createElement('div');
            node.className = 'timeline-node';
            node.innerHTML = `
                <div class="node-date">${entry.date}</div>
                <div class="node-title" style="font-family:var(--font-display); font-size:1.2rem;">${this.escapeHTML(entry.title)}</div>
                <div class="node-excerpt handwritten">"${this.escapeHTML(entry.body.substring(0, 100))}..."</div>
            `;
            container.appendChild(node);
        });
    },

    validateAndSendContact(e) {
        e.preventDefault();
        
        const name = document.getElementById('contact-name');
        const email = document.getElementById('contact-email');
        const subject = document.getElementById('contact-subject');
        const msg = document.getElementById('contact-message');
        const statusMsg = document.getElementById('contact-status');
        
        let isValid = true;
        document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
        statusMsg.className = 'status-msg hidden';

        if(name.value.trim().length < 2) { document.getElementById('error-name').textContent = "Provide a valid name."; isValid = false; }
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { document.getElementById('error-email').textContent = "Invalid telegraphic address."; isValid = false; }
        if(subject.value.trim() === '') { document.getElementById('error-subject').textContent = "Subject required."; isValid = false; }
        if(msg.value.trim().length < 10) { document.getElementById('error-message').textContent = "Message too short."; isValid = false; }

        if(isValid) {
            // REPLACE THIS WITH THE EMAIL ADDRESS YOU WANT TO RECEIVE MESSAGES AT
            const receiveEmailAt = "your.actual.email@example.com"; 

            // Format the subject and message for the email client
            const mailtoSubject = encodeURIComponent(subject.value.trim());
            const mailtoBody = encodeURIComponent(
                `From: ${name.value.trim()} (${email.value.trim()})\n\n${msg.value.trim()}`
            );

            // Show success message
            statusMsg.textContent = "✓ Opening your email client...";
            statusMsg.className = 'status-msg success';

            // Trigger the default email app to open
            window.location.href = `mailto:${receiveEmailAt}?subject=${mailtoSubject}&body=${mailtoBody}`;
            
            // Clear the form
            this.contactForm.reset();
        }
    },

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag));
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());