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
        '<p class="footer-subtitle">The Grey Anthology</p>' +
        '<p class="footer-builtby" style="margin-top:0.75rem">' +
        '<a href="https://rebelstudiossoftware.com" target="_blank" rel="noopener" title="Built by Rebel Studios" aria-label="Built by Rebel Studios">' +
        '<img src="/images/badge-r-light.png" alt="Built by Rebel Studios" width="35" height="26" style="height:26px;width:auto;vertical-align:middle;opacity:0.9">' +
        '</a></p>' +
        '</div>';
}());
