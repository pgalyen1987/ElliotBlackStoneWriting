/**
 * Shared site footer. Each page includes:
 *   <footer id="site-footer"></footer>
 * then loads this script (before main.js) at the end of <body>.
 */
(function () {
    'use strict';
    const el = document.getElementById('site-footer');
    if (!el) {
        return;
    }
    el.innerHTML =
        '<div class="container">' +
        '<p>&copy; 2026 Elliot Blackstone. All rights reserved.</p>' +
        '<p class="footer-subtitle">Exploring darkness, one story at a time.</p>' +
        '</div>';
}());
