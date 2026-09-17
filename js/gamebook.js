/**
 * Gamebook engine for the interactive stories.
 *
 * A story is a JSON file: a map of nodes, each with prose, a mood, a scene image and a set of
 * choices. Choices may be gated on flags the reader is carrying, which is what separates this from
 * a menu tree — the same stake offers a different way out depending on what you know.
 *
 * Everything runs in the page; the site is static, so there is no server holding a session. The
 * only thing that survives a reload is the ledger of endings found, in localStorage. That is
 * deliberate: the ledger is the reason to come back, and losing your place in a ten-minute story
 * costs nothing.
 *
 * The surveyor's panel is not decoration. Acreage, pace count and the flags you are carrying are
 * the state the story actually branches on, so showing them is showing the reader the machine.
 */
(function () {
    'use strict';

    var LEDGER_PREFIX = 'elliot.gamebook.';
    var TYPE_MS = 12;          // per character
    var TYPE_CAP = 2600;       // never make anyone wait longer than this for a passage

    function readLedger(slug) {
        try {
            var parsed = JSON.parse(localStorage.getItem(LEDGER_PREFIX + slug) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            return [];
        }
    }

    function writeLedger(slug, found) {
        try {
            localStorage.setItem(LEDGER_PREFIX + slug, JSON.stringify(found));
        } catch (err) {
            /* private mode: the run still plays, it is just not remembered */
        }
    }

    /* ---------------------------------------------------------------- ambience */

    /**
     * Marsh at dusk, synthesised. Filtered noise for wind, a slow low drone, and sparse insect
     * chirps. No audio files to ship, and it can be built the instant the reader asks for it —
     * browsers refuse to start audio before a gesture anyway.
     */
    function Ambience() {
        this.ctx = null;
        this.on = false;
    }

    Ambience.prototype.build = function () {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) { return false; }
        var ctx = this.ctx = new Ctx();

        var master = this.master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);

        // wind: two seconds of noise on a loop, through a band-pass that drifts
        var frames = ctx.sampleRate * 2;
        var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < frames; i += 1) { data[i] = Math.random() * 2 - 1; }
        var noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        var band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = 480;
        band.Q.value = 0.6;

        var gust = ctx.createOscillator();      // sub-audio LFO opening and closing the filter
        gust.frequency.value = 0.06;
        var gustAmount = ctx.createGain();
        gustAmount.gain.value = 230;
        gust.connect(gustAmount).connect(band.frequency);

        var windGain = ctx.createGain();
        windGain.gain.value = 0.16;
        noise.connect(band).connect(windGain).connect(master);

        // drone: the low note under everything
        var drone = ctx.createOscillator();
        drone.type = 'sine';
        drone.frequency.value = 58;
        var droneGain = ctx.createGain();
        droneGain.gain.value = 0.05;
        drone.connect(droneGain).connect(master);

        noise.start();
        gust.start();
        drone.start();
        this.nodes = { band: band, windGain: windGain, drone: drone };
        this.scheduleChirp();
        return true;
    };

    /** Sparse, irregular insect chirps — regular spacing would read as a machine, not a marsh. */
    Ambience.prototype.scheduleChirp = function () {
        if (!this.ctx) { return; }
        var self = this;
        var wait = 900 + Math.random() * 3400;
        this.chirpTimer = setTimeout(function () {
            if (self.on && self.ctx && self.ctx.state === 'running') {
                var now = self.ctx.currentTime;
                var osc = self.ctx.createOscillator();
                var gain = self.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(2300 + Math.random() * 900, now);
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.exponentialRampToValueAtTime(0.02, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
                osc.connect(gain).connect(self.master);
                osc.start(now);
                osc.stop(now + 0.12);
            }
            self.scheduleChirp();
        }, wait);
    };

    Ambience.prototype.toggle = function () {
        if (!this.ctx && !this.build()) { return false; }
        this.on = !this.on;
        if (this.on && this.ctx.state === 'suspended') { this.ctx.resume(); }
        var now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(this.master.gain.value, now);
        this.master.gain.linearRampToValueAtTime(this.on ? 0.9 : 0, now + 0.8);
        return this.on;
    };

    /** Darker moods push the wind down and the drone lower. */
    Ambience.prototype.setMood = function (mood) {
        if (!this.ctx || !this.nodes) { return; }
        var map = { gold: [520, 58, 0.14], dusk: [380, 52, 0.18], dark: [240, 43, 0.22], fire: [700, 66, 0.2] };
        var m = map[mood] || map.gold;
        var now = this.ctx.currentTime;
        this.nodes.band.frequency.setTargetAtTime(m[0], now, 1.2);
        this.nodes.drone.frequency.setTargetAtTime(m[1], now, 1.2);
        this.nodes.windGain.gain.setTargetAtTime(m[2], now, 1.2);
    };

    /* ---------------------------------------------------------------- the book */

    function Gamebook(root, story) {
        this.root = root;
        this.story = story;
        this.slug = story.slug;
        this.endings = story.endings || [];
        this.flagLabels = story.flagLabels || {};
        this.found = readLedger(this.slug);
        this.base = root.getAttribute('data-images') || '';
        this.reduced = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.ambience = new Ambience();
        this.buildChrome();
        this.reset();
    }

    Gamebook.prototype.reset = function () {
        this.flags = {};
        this.steps = 0;
        this.paces = 0;
        this.acreage = null;
        this.current = this.story.start;
    };

    Gamebook.prototype.el = function (tag, className, text) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        if (text !== undefined) { node.textContent = text; }
        return node;
    };

    /** Scene, panel and passage are built once; each node only updates them. */
    Gamebook.prototype.buildChrome = function () {
        this.root.innerHTML = '';
        this.root.classList.add('gb');

        var scene = this.el('div', 'gb-scene');
        this.sceneImg = document.createElement('img');
        this.sceneImg.className = 'gb-scene-img';
        this.sceneImg.alt = '';
        this.sceneImg.setAttribute('aria-hidden', 'true');
        this.sceneImg.decoding = 'async';
        scene.appendChild(this.sceneImg);

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'gb-scene-canvas';
        this.canvas.setAttribute('aria-hidden', 'true');
        scene.appendChild(this.canvas);

        this.sound = this.el('button', 'gb-sound', 'Sound off');
        this.sound.type = 'button';
        this.sound.setAttribute('aria-pressed', 'false');
        this.sound.addEventListener('click', function () {
            var on = this.ambience.toggle();
            this.sound.textContent = on ? 'Sound on' : 'Sound off';
            this.sound.setAttribute('aria-pressed', on ? 'true' : 'false');
            if (on) { this.ambience.setMood(this.mood); }
        }.bind(this));
        scene.appendChild(this.sound);
        this.root.appendChild(scene);

        var panel = this.el('div', 'gb-panel');
        panel.setAttribute('aria-live', 'polite');
        this.readout = {};
        [['acreage', 'Acreage'], ['paces', 'Paces'], ['endings', 'Endings']].forEach(function (pair) {
            var cell = this.el('div', 'gb-cell');
            cell.appendChild(this.el('span', 'gb-cell-label', pair[1]));
            var value = this.el('span', 'gb-cell-value', '—');
            cell.appendChild(value);
            this.readout[pair[0]] = value;
            panel.appendChild(cell);
        }, this);
        this.root.appendChild(panel);

        this.carried = this.el('ul', 'gb-carried');
        this.root.appendChild(this.carried);

        this.passage = this.el('article', 'gb-passage');
        this.root.appendChild(this.passage);

        this.choiceBox = this.el('div', 'gb-choices');
        this.root.appendChild(this.choiceBox);

        if (window.MarshCanvas) {
            this.marsh = new window.MarshCanvas(this.canvas);
            this.marsh.start();
        }
    };

    Gamebook.prototype.available = function (choices) {
        var flags = this.flags;
        return (choices || []).filter(function (choice) {
            return (choice.requires || []).every(function (f) { return flags[f]; })
                && (choice.forbids || []).every(function (f) { return !flags[f]; });
        });
    };

    Gamebook.prototype.go = function (choice) {
        (choice.sets || []).forEach(function (flag) { this.flags[flag] = true; }, this);
        this.steps += 1;
        this.current = choice.to;
        this.render();
        this.passage.setAttribute('tabindex', '-1');
        this.passage.focus({ preventScroll: true });
        this.root.scrollIntoView({ behavior: this.reduced ? 'auto' : 'smooth', block: 'start' });
    };

    Gamebook.prototype.recordEnding = function (id) {
        if (this.found.indexOf(id) === -1) {
            this.found.push(id);
            writeLedger(this.slug, this.found);
        }
    };

    /** Roll the acreage into place, because a surveyed number should look measured. */
    Gamebook.prototype.setAcreage = function (value) {
        var cell = this.readout.acreage;
        if (value === undefined || value === null) {
            cell.textContent = this.acreage === null ? '—' : this.acreage.toFixed(1);
            return;
        }
        this.acreage = value;
        if (this.reduced) { cell.textContent = value.toFixed(1); return; }
        var ticks = 16;
        var i = 0;
        clearInterval(this.acreTimer);
        cell.classList.add('gb-rolling');
        this.acreTimer = setInterval(function () {
            i += 1;
            if (i >= ticks) {
                clearInterval(this.acreTimer);
                cell.textContent = value.toFixed(1);
                cell.classList.remove('gb-rolling');
                return;
            }
            cell.textContent = (value + (Math.random() - 0.5) * 9 * (1 - i / ticks)).toFixed(1);
        }.bind(this), 45);
    };

    Gamebook.prototype.updatePanel = function (node) {
        this.setAcreage(node.acreage);
        if (node.paces) { this.paces = node.paces; }
        this.readout.paces.textContent = this.paces ? String(this.paces) : '—';
        this.readout.endings.textContent = this.found.length + ' / ' + this.endings.length;

        this.carried.innerHTML = '';
        Object.keys(this.flagLabels).forEach(function (flag) {
            if (!this.flags[flag]) { return; }
            this.carried.appendChild(this.el('li', 'gb-chip', this.flagLabels[flag]));
        }, this);
    };

    Gamebook.prototype.setScene = function (node) {
        this.mood = node.mood || 'gold';
        if (node.image) {
            var next = this.base + node.image;
            if (this.sceneImg.getAttribute('src') !== next) {
                this.sceneImg.classList.add('gb-fading');
                var img = this.sceneImg;
                var done = function () {
                    img.classList.remove('gb-fading');
                    img.removeEventListener('load', done);
                };
                img.addEventListener('load', done);
                img.src = next;
            }
        }
        this.root.setAttribute('data-mood', this.mood);
        if (this.marsh) {
            this.marsh.setMood(this.mood);
            this.marsh.setCounting(!!this.flags.knows_count);
            this.marsh.start();
        }
        if (this.ambience.on) { this.ambience.setMood(this.mood); }
    };

    /**
     * Reveal the prose a character at a time, with the whole passage already in the DOM as text so
     * a screen reader and a "find on page" get all of it immediately. Any click or key finishes it.
     */
    Gamebook.prototype.typeOut = function (paragraphs, done) {
        this.passage.innerHTML = '';
        var nodes = paragraphs.map(function (text) {
            var p = this.el('p');
            p.innerHTML = markup(text);
            this.passage.appendChild(p);
            return p;
        }, this);

        if (this.reduced) { done(); return; }

        var full = nodes.map(function (p) { return p.innerHTML; });
        var chars = paragraphs.join(' ').length;
        var speed = Math.max(4, Math.min(TYPE_MS, TYPE_CAP / Math.max(chars, 1)));

        nodes.forEach(function (p) { p.style.visibility = 'hidden'; });
        var index = 0;
        var self = this;

        function finishAll() {
            clearTimeout(self.typeTimer);
            nodes.forEach(function (p, i) { p.innerHTML = full[i]; p.style.visibility = ''; });
            self.root.removeEventListener('click', skip, true);
            document.removeEventListener('keydown', skip, true);
            self.typing = false;
            done();
        }
        function skip(event) {
            if (event.type === 'click' && event.target.closest('.gb-choice, .gb-sound')) { return; }
            finishAll();
        }

        this.typing = true;
        this.root.addEventListener('click', skip, true);
        document.addEventListener('keydown', skip, true);

        function step() {
            if (index >= nodes.length) { finishAll(); return; }
            var p = nodes[index];
            var text = paragraphs[index];
            p.style.visibility = '';
            var at = 0;
            (function tick() {
                at += Math.max(1, Math.round(text.length / 90));
                if (at >= text.length) {
                    p.innerHTML = full[index];
                    index += 1;
                    self.typeTimer = setTimeout(step, 190);
                    return;
                }
                p.textContent = text.slice(0, at);
                self.typeTimer = setTimeout(tick, speed);
            }());
        }
        step();
    };

    /** The story text carries *emphasis* and **strong**; nothing else is allowed through. */
    function markup(text) {
        return String(text)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    Gamebook.prototype.renderEnding = function (node) {
        this.recordEnding(node.ending.id);
        this.updatePanel(node);

        var box = this.el('div', 'gb-ending');
        box.appendChild(this.el('p', 'gb-ending-label', node.ending.kind || 'An ending'));
        box.appendChild(this.el('h2', 'gb-ending-title', node.ending.title));
        this.choiceBox.appendChild(box);

        var total = this.endings.length;
        var count = this.found.length;
        var ledger = this.el('div', 'gb-ledger');
        ledger.appendChild(this.el('p', 'gb-ledger-count',
            count + ' of ' + total + ' endings found'));

        var list = this.el('ul', 'gb-ledger-list');
        this.endings.forEach(function (ending) {
            var item = this.el('li');
            if (this.found.indexOf(ending.id) !== -1) {
                item.className = 'gb-found';
                item.textContent = ending.title;
            } else {
                item.className = 'gb-unfound';
                // Keep the shape without giving it away: a dash per letter.
                item.textContent = ending.title.replace(/[A-Za-z0-9’']/g, '—');
                item.setAttribute('aria-label', 'An ending you have not found yet');
            }
            list.appendChild(item);
        }, this);
        ledger.appendChild(list);

        if (count === total && this.story.completeNote) {
            ledger.appendChild(this.el('p', 'gb-ledger-done', this.story.completeNote));
        }
        this.choiceBox.appendChild(ledger);

        var again = this.el('button', 'gb-choice gb-restart', 'Walk it again');
        again.type = 'button';
        again.addEventListener('click', function () {
            this.reset();
            this.render();
            this.root.scrollIntoView({ behavior: this.reduced ? 'auto' : 'smooth', block: 'start' });
        }.bind(this));
        this.choiceBox.appendChild(again);
    };

    Gamebook.prototype.render = function () {
        var node = this.story.nodes[this.current];
        this.choiceBox.innerHTML = '';

        // Arriving somewhere can teach you something on its own — reading the field book hands you
        // the field book. Node-level `sets` apply on entry, before any choice is offered, so a
        // passage can gate its own exits on what it just told you.
        if (node && node.sets) {
            node.sets.forEach(function (flag) { this.flags[flag] = true; }, this);
        }

        if (!node) {
            this.passage.innerHTML = '<p class="gb-error">This passage is missing. '
                + 'Walk it again and it will find its way back.</p>';
            return;
        }

        this.setScene(node);
        this.updatePanel(node);

        this.typeOut(node.text || [], function () {
            if (node.ending) { this.renderEnding(node); return; }

            var choices = this.available(node.choices);
            if (!choices.length) {
                this.choiceBox.appendChild(this.el('p', 'gb-error', 'There is no way on from here.'));
                return;
            }
            choices.forEach(function (choice) {
                var button = this.el('button', 'gb-choice', choice.label);
                button.type = 'button';
                button.addEventListener('click', this.go.bind(this, choice));
                this.choiceBox.appendChild(button);
            }, this);
        }.bind(this));
    };

    function boot() {
        var root = document.getElementById('gamebook');
        if (!root) { return; }
        var src = root.getAttribute('data-story');
        if (!src) { return; }

        root.innerHTML = '<p class="gb-loading">Opening the book…</p>';
        fetch(src)
            .then(function (res) {
                if (!res.ok) { throw new Error('HTTP ' + res.status); }
                return res.json();
            })
            .then(function (story) { new Gamebook(root, story).render(); })
            .catch(function () {
                root.innerHTML = '<p class="gb-error">This story could not be opened. '
                    + 'Reload the page, or <a href="/stories.html">read another</a>.</p>';
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());
