'use strict';

/* ─── 1. Theme Toggle ─────────────────────────────── */
const root = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');

function getTheme() {
    const saved = localStorage.getItem('vfm-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

root.setAttribute('data-theme', getTheme());

if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        const t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', t);
        localStorage.setItem('vfm-theme', t);
    });
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const sysTheme = e.matches ? 'dark' : 'light';
    root.setAttribute('data-theme', sysTheme);
    localStorage.removeItem('vfm-theme'); // Sync deeply with OS
});

/* ─── 1.5. Mobile Nav Toggle ───────────────────────── */
const menuBtn = document.getElementById('menu-toggle');
const siteNav = document.getElementById('site-nav');
if (menuBtn && siteNav) {
    menuBtn.addEventListener('click', () => {
        siteNav.classList.toggle('nav-open');
    });
    // Close menu when clicking a link
    siteNav.querySelectorAll('.nav-links a').forEach(a => {
        a.addEventListener('click', () => siteNav.classList.remove('nav-open'));
    });
}

/* ─── 2. Reading Progress Bar ─────────────────────── */
const progressBar = document.getElementById('progress-bar');
if (progressBar) {
    window.addEventListener('scroll', () => {
        const st = window.scrollY;
        const dh = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.transform = `scaleX(${Math.min(st / dh, 1)})`;
    }, { passive: true });
}

/* ─── 3. Cursor Orb ────────────────────────────────── */
const orb = document.getElementById('cursor-orb');
if (orb) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function tick() {
        cx += (tx - cx) * 0.07;
        cy += (ty - cy) * 0.07;
        orb.style.transform = `translate3d(calc(${cx}px - 50%),calc(${cy}px - 50%),0)`;
        requestAnimationFrame(tick);
    })();
}

/* ─── 4. Scroll Reveal (staggered within grids) ───── */
const REVEAL_OPTS = { threshold: 0.08, rootMargin: '0px 0px -60px 0px' };

const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('is-visible'), delay);
        obs.unobserve(el);
    });
}, REVEAL_OPTS);

document.querySelectorAll('.reveal, .reveal-line, .reveal-scale, .reveal-left, .reveal-right, .reveal-rotate, .reveal-blur, .reveal-down').forEach(el => revealObs.observe(el));

/* Stagger grids: auto-assign delay to children */
document.querySelectorAll('.auto-stagger').forEach(grid => {
    const defaultReveal = grid.dataset.revealClass || 'reveal';
    [...grid.children].forEach((child, i) => {
        if (!child.dataset.delay) child.dataset.delay = i * 80;
        if (!child.className.match(/reveal/)) {
            child.classList.add(defaultReveal);
        }
        revealObs.observe(child);
    });
});

/* ─── 5. Number Counter Animation ─────────────────── */
function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    const dur = 1800;
    const start = performance.now();

    function step(now) {
        const frac = Math.min((now - start) / dur, 1);
        // Ease out expo
        const ease = frac === 1 ? 1 : 1 - Math.pow(2, -10 * frac);
        const cur = target * ease;
        el.textContent = (decimals ? cur.toFixed(decimals) : Math.floor(cur).toLocaleString()) + suffix;
        if (frac < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

const counterObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        obs.unobserve(entry.target);
    });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

/* ─── 6. 3D Tilt Cards ─────────────────────────────── */
document.querySelectorAll('.tilt-card').forEach(card => {
    const glow = card.querySelector('.card-glow');

    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const cx = r.width / 2, cy = r.height / 2;
        const rx = ((y - cy) / cy) * -9;
        const ry = ((x - cx) / cx) * 9;
        card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.025,1.025,1.025)`;
        if (glow) glow.style.background =
            `radial-gradient(280px at ${x}px ${y}px, var(--glow-color, rgba(10,132,255,0.18)), transparent 70%)`;
    }, { passive: true });

    const reset = () => {
        card.style.transform = '';
        if (glow) glow.style.background = '';
    };
    card.addEventListener('mouseleave', reset);
});

/* ─── 7. Stability Bars ────────────────────────────── */
const barObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const bar = entry.target;
        setTimeout(() => { bar.style.width = bar.dataset.width + '%'; }, 300);
        obs.unobserve(bar);
    });
}, { threshold: 0.5 });
document.querySelectorAll('.stability-bar[data-width]').forEach(b => barObs.observe(b));

/* ─── 8. Active Nav Link ───────────────────────────── */
const navLinks = document.querySelectorAll('.nav-links a');
const sectionIds = [...navLinks].map(a => a.getAttribute('href')?.replace('#', '')).filter(Boolean);
const sectionEls = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

const navObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(a => {
            a.classList.toggle('nav-active', a.getAttribute('href') === `#${id}`);
        });
    });
}, { rootMargin: '-30% 0px -60% 0px' });
sectionEls.forEach(s => navObs.observe(s));

/* ─── 9. Smooth scroll ─────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});

/* ─── 10. Nav shrink on scroll ─────────────────────── */
const nav = document.getElementById('site-nav');
if (nav) {
    window.addEventListener('scroll', () => {
        nav.classList.toggle('nav-scrolled', window.scrollY > 60);
    }, { passive: true });
}

/* ─── 11. Hero Canvas — Geometric Particle Network ── */
(function () {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, nodes, t = 0;
    const NODE_COUNT = 45;
    const MAX_DIST = 180;
    const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';
    let mouse = { x: -1000, y: -1000 };

    window.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }, { passive: true });

    function resize() {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
        initNodes();
    }

    function initNodes() {
        nodes = Array.from({ length: NODE_COUNT }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - .5) * .35,
            vy: (Math.random() - .5) * .35,
            r: Math.random() * 2 + 1,
            pulse: Math.random() * Math.PI * 2
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        t += 0.012;
        const dark = isDark();
        const accentRGB = dark ? '59,130,246' : '0,113,227';
        const purpleRGB = dark ? '168,85,247' : '155,89,182';


        // Draw edges
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DIST) {
                    const alpha = (1 - dist / MAX_DIST) * (dark ? 0.25 : 0.12);
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${accentRGB},${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw nodes
        nodes.forEach(n => {
            const dx = mouse.x - n.x;
            const dy = mouse.y - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) {
                const force = (150 - dist) / 150;
                n.x -= (dx / dist) * force * 2;
                n.y -= (dy / dist) * force * 2;
            }

            n.x += n.vx; n.y += n.vy;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
            n.pulse += 0.04;
            const pScale = 1 + Math.sin(n.pulse) * 0.3;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r * pScale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accentRGB},${dark ? 0.55 : 0.35})`;
            ctx.fill();
        });

        // Central rotor — spinning hexagon
        const cx = W / 2, cy = H / 2;
        const R = Math.min(W, H) * 0.13;
        const sides = 6;

        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2 + t * 0.4;
            const px = cx + Math.cos(a) * R;
            const py = cy + Math.sin(a) * R;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${accentRGB},${dark ? 0.22 : 0.12})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        const R2 = R * 0.55;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2 - t * 0.6;
            const px = cx + Math.cos(a) * R2;
            const py = cy + Math.sin(a) * R2;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${purpleRGB},${dark ? 0.18 : 0.10})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2 + t * 0.4;
            const px = cx + Math.cos(a) * R;
            const py = cy + Math.sin(a) * R;
            ctx.beginPath();
            ctx.arc(px, py, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accentRGB},${dark ? 0.8 : 0.5})`;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
        grad.addColorStop(0, `rgba(${accentRGB},0.9)`);
        grad.addColorStop(1, `rgba(${accentRGB},0)`);
        ctx.fillStyle = grad;
        ctx.fill();

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
})();

/* ─── 12. Background Parallax ──────────────────────── */
window.addEventListener('scroll', () => {
    const st = window.scrollY;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    
    // Parallax background orbs
    const orb1 = document.querySelector('.orb-1');
    const orb2 = document.querySelector('.orb-2');
    const orb3 = document.querySelector('.orb-3');
    const bgGrid = document.querySelector('.bg-grid');
    
    // Smooth transform with reduced motion check
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mql.matches) {
        if (orb1) orb1.style.transform = `translateY(${st * 0.15}px)`;
        if (orb2) orb2.style.transform = `translateY(${st * 0.08}px)`;
        if (orb3) orb3.style.transform = `translateY(${st * -0.05}px)`;
    }
}, { passive: true });

/* ─── 13. Text Glow on Scroll ──────────────────────── */
const glowTexts = document.querySelectorAll('.section-title, .hero-title .line-plain, .math-sym, .app-content h3, .footer-big');
window.addEventListener('scroll', () => {
    const cy = window.innerHeight * 0.55;
    glowTexts.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elCy = rect.top + rect.height / 2;
        const dist = Math.abs(cy - elCy);
        const maxDist = window.innerHeight * 0.6;
        let intensity = 1 - (dist / maxDist);
        if (intensity < 0) intensity = 0;
        intensity = Math.pow(intensity, 1.4);
        el.style.setProperty('--scroll-glow', intensity.toFixed(3));
    });
}, { passive: true });

/* ─── 14. Magnetic Buttons ─────────────────────────── */
document.querySelectorAll('.btn-primary, .btn-cta, .btn-ghost').forEach(btn => {
    btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transition = 'transform 0.1s cubic-bezier(0.2, 0, 0, 1)';
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.02)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transition = 'transform 0.4s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.4s';
        btn.style.transform = '';
    });
});
