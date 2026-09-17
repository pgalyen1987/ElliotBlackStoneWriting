/**
 * The living marsh behind an interactive story.
 *
 * A painted still sits underneath (images/tidewater/*.jpg) and this draws the moving half over it:
 * foreground spartina that leans on a slow wind, fog that drifts, and — once the reader knows what
 * is out there — tally marks that surface in the grass and fade.
 *
 * Deliberately cheap. One canvas, no libraries, blades precomputed once and only their phase
 * animated, capped at 30fps, paused when the tab is hidden or the element is off screen, and shut
 * off entirely for `prefers-reduced-motion` (the still image alone still carries the scene).
 */
(function () {
    'use strict';

    var MOODS = {
        gold: { blade: 'rgba(28,24,18,', fog: 'rgba(212,166,104,', wind: 0.55 },
        dusk: { blade: 'rgba(20,16,16,', fog: 'rgba(150,88,72,', wind: 0.8 },
        dark: { blade: 'rgba(8,8,10,', fog: 'rgba(70,64,78,', wind: 0.35 },
        fire: { blade: 'rgba(24,14,10,', fog: 'rgba(206,110,52,', wind: 1.15 }
    };

    function MarshCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mood = 'gold';
        this.blades = [];
        this.fog = [];
        this.marks = [];
        this.showMarks = false;
        this.t = 0;
        this.last = 0;
        this.running = false;
        this.visible = true;

        this.reduced = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
        document.addEventListener('visibilitychange', function () {
            this.visible = !document.hidden;
            if (this.visible) { this.start(); }
        }.bind(this));

        if (window.IntersectionObserver) {
            new IntersectionObserver(function (entries) {
                this.onScreen = entries[0].isIntersecting;
                if (this.onScreen) { this.start(); }
            }.bind(this), { threshold: 0.02 }).observe(canvas);
        } else {
            this.onScreen = true;
        }
    }

    MarshCanvas.prototype.resize = function () {
        var rect = this.canvas.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = Math.max(rect.width, 1);
        this.h = Math.max(rect.height, 1);
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.seed();
    };

    /** Blades and fog banks are generated once per size; the loop only moves them. */
    MarshCanvas.prototype.seed = function () {
        var count = Math.round(Math.min(this.w, 900) / 7.5);
        this.blades = [];
        for (var i = 0; i < count; i += 1) {
            var depth = Math.pow(Math.random(), 0.6);
            this.blades.push({
                x: Math.random() * (this.w + 60) - 30,
                y: this.h + 4 - Math.random() * this.h * 0.10,
                len: (this.h * 0.05 + depth * this.h * 0.13) * (0.55 + Math.random() * 0.8),
                depth: depth,
                phase: Math.random() * Math.PI * 2,
                width: depth > 0.6 ? 1.7 : 1.1
            });
        }
        this.fog = [];
        for (var f = 0; f < 5; f += 1) {
            this.fog.push({
                y: this.h * (0.30 + f * 0.11),
                x: Math.random() * this.w,
                speed: 4 + Math.random() * 9,
                height: this.h * (0.035 + Math.random() * 0.05),
                alpha: 0.05 + Math.random() * 0.06
            });
        }
    };

    MarshCanvas.prototype.setMood = function (mood) {
        this.mood = MOODS[mood] ? mood : 'gold';
    };

    /** Once the reader knows something is counting, the grass starts showing its work. */
    MarshCanvas.prototype.setCounting = function (on) {
        this.showMarks = !!on;
        if (on && !this.marks.length) {
            for (var i = 0; i < 26; i += 1) {
                this.marks.push({
                    x: Math.random() * this.w,
                    y: this.h * (0.42 + Math.random() * 0.45),
                    born: Math.random() * 12,
                    life: 5 + Math.random() * 7,
                    h: 6 + Math.random() * 12
                });
            }
        }
    };

    MarshCanvas.prototype.start = function () {
        if (this.reduced || this.running || !this.visible || this.onScreen === false) { return; }
        this.running = true;
        this.last = 0;
        requestAnimationFrame(this.frame.bind(this));
    };

    MarshCanvas.prototype.frame = function (now) {
        if (!this.visible || this.onScreen === false) { this.running = false; return; }
        if (now - this.last < 33) {                       // cap at ~30fps; this is scenery
            requestAnimationFrame(this.frame.bind(this));
            return;
        }
        var dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0.016;
        this.last = now;
        this.t += dt;
        this.draw(dt);
        requestAnimationFrame(this.frame.bind(this));
    };

    MarshCanvas.prototype.draw = function (dt) {
        var ctx = this.ctx;
        var mood = MOODS[this.mood];
        ctx.clearRect(0, 0, this.w, this.h);

        // gusts: a slow base wind with a slower swell on top, so it never looks metronomic
        var wind = mood.wind * (0.6 + 0.4 * Math.sin(this.t * 0.31) + 0.18 * Math.sin(this.t * 1.7));

        var i, bank, mark;
        for (i = 0; i < this.fog.length; i += 1) {
            bank = this.fog[i];
            bank.x += bank.speed * dt * (0.4 + wind);
            if (bank.x > this.w + 220) { bank.x = -220; }
            var grad = ctx.createLinearGradient(0, bank.y - bank.height, 0, bank.y + bank.height);
            grad.addColorStop(0, mood.fog + '0)');
            grad.addColorStop(0.5, mood.fog + bank.alpha + ')');
            grad.addColorStop(1, mood.fog + '0)');
            ctx.fillStyle = grad;
            ctx.fillRect(bank.x - 260, bank.y - bank.height, 520, bank.height * 2);
        }

        if (this.showMarks) {
            ctx.lineWidth = 1.6;
            for (i = 0; i < this.marks.length; i += 1) {
                mark = this.marks[i];
                mark.born += dt;
                if (mark.born > mark.life) {
                    mark.born = 0;
                    mark.x = Math.random() * this.w;
                    mark.y = this.h * (0.42 + Math.random() * 0.45);
                }
                var phase = mark.born / mark.life;
                var alpha = Math.sin(phase * Math.PI) * 0.4;
                if (alpha <= 0.01) { continue; }
                ctx.strokeStyle = 'rgba(207,201,189,' + alpha.toFixed(3) + ')';
                ctx.beginPath();
                ctx.moveTo(mark.x, mark.y);
                ctx.lineTo(mark.x + 2, mark.y - mark.h);
                ctx.stroke();
            }
        }

        for (i = 0; i < this.blades.length; i += 1) {
            var b = this.blades[i];
            var lean = Math.sin(this.t * (0.7 + b.depth * 0.5) + b.phase) * wind * (4 + b.depth * 12);
            ctx.strokeStyle = mood.blade + (0.16 + b.depth * 0.26).toFixed(2) + ')';
            ctx.lineWidth = b.width;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.quadraticCurveTo(b.x + lean * 0.4, b.y - b.len * 0.55, b.x + lean, b.y - b.len);
            ctx.stroke();
        }
    };

    window.MarshCanvas = MarshCanvas;
}());
