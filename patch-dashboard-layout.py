#!/usr/bin/env python3
"""
Reworks the dashboard layout.

  - The whole project card selects it, rather than a separate button. One
    obvious action beats two competing ones, and a card that highlights when
    chosen already says "this is the one".
  - View Live Site moves to the header, following whichever project is selected.
  - The modification log moves under the chat as a collapsed summary. It was
    the largest thing on the page and the least often read; a count that opens
    when you want it is the right weight.
  - Fixes selection, which never worked: dashboardLogic.js is an ES module, so
    it evaluates after DOMContentLoaded has already fired and the listener that
    wired the composer never ran.

Run from the frontend repo root:  python3 patch-dashboard-layout.py
"""

import os

# ═══════════════════════════════════════════════════════════════════════════
# HTML — header button, log panel, styles
# ═══════════════════════════════════════════════════════════════════════════

H = 'frontend/pages/dashboard.html'
assert os.path.exists(H), 'dashboard.html not found'
html = open(H).read()

# ── View Live Site in the header, hidden until a project is chosen ──────────
OLD_NAV = """            <div class="nav-actions">
                <button onclick="openSupportModal()" class="btn btn-danger">
                    📧 Contact Support
                </button>"""

NEW_NAV = """            <div class="nav-actions">
                <a id="navViewSite" href="#" target="_blank" class="btn btn-view" style="display:none">
                    🌐 View Live Site
                </a>
                <button onclick="openSupportModal()" class="btn btn-danger">
                    📧 Contact Support
                </button>"""

assert OLD_NAV in html, 'nav actions not found'
html = html.replace(OLD_NAV, NEW_NAV)

# ── Collapsed log under the chat panel ─────────────────────────────────────
OLD_ASIDE_END = """                </div>
            </aside>
        </div>"""

NEW_ASIDE_END = """                </div>
            </aside>

            <!-- History, folded away. It was the largest block on the page and
                 the least often read. -->
            <div class="log-drawer" id="logDrawer" style="display:none">
                <button class="log-drawer-toggle" id="logDrawerToggle">
                    <span id="logDrawerLabel">Change history</span>
                    <span class="log-drawer-caret">▾</span>
                </button>
                <div class="log-drawer-body" id="logDrawerBody"></div>
            </div>
        </div>"""

assert OLD_ASIDE_END in html, 'aside close not found'
html = html.replace(OLD_ASIDE_END, NEW_ASIDE_END)

# ── Styles ─────────────────────────────────────────────────────────────────
OLD_ACTIVE = """        /* The selected project, so it is obvious what the chat is about */
        .project-card.chat-active {
            border-color: rgba(16, 185, 129, 0.55);
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.12);
        }"""

NEW_ACTIVE = """        /* The whole card is the control now */
        .project-card {
            cursor: pointer;
        }

        .project-card.chat-active {
            border-color: rgba(16, 185, 129, 0.55);
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.12);
        }

        .project-card.chat-active::before {
            content: 'Selected';
            float: right;
            font-size: 0.7rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #10b981;
            background: rgba(16, 185, 129, 0.15);
            padding: 3px 10px;
            border-radius: 12px;
        }

        /* Anything clickable inside the card must not also select it */
        .project-card a,
        .project-card button {
            cursor: pointer;
        }

        /* ── Change history drawer ───────────────────────────────────────── */

        .log-drawer {
            grid-column: 2;
            background: rgba(16, 185, 129, 0.05);
            border: 1px solid rgba(16, 185, 129, 0.15);
            border-radius: 12px;
            overflow: hidden;
            margin-top: -1rem;
        }

        @media (max-width: 900px) {
            .log-drawer { grid-column: 1; margin-top: 0; }
        }

        .log-drawer-toggle {
            width: 100%;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.75);
            padding: 0.85rem 1.25rem;
            font-size: 0.88rem;
            font-weight: 600;
            text-align: left;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .log-drawer-toggle:hover { color: #10b981; }

        .log-drawer-caret {
            transition: transform 0.2s ease;
            opacity: 0.6;
        }

        .log-drawer.open .log-drawer-caret { transform: rotate(180deg); }

        .log-drawer-body {
            display: none;
            padding: 0 1rem 1rem;
            max-height: 280px;
            overflow-y: auto;
        }

        .log-drawer.open .log-drawer-body { display: block; }

        /* Each entry is a one-line summary that opens on hover */
        .log-row {
            border-left: 3px solid rgba(16, 185, 129, 0.4);
            padding: 0.55rem 0.75rem;
            margin-bottom: 0.4rem;
            border-radius: 0 6px 6px 0;
            background: rgba(16, 185, 129, 0.06);
            font-size: 0.85rem;
            transition: background 0.15s ease;
        }

        .log-row:hover { background: rgba(16, 185, 129, 0.12); }

        .log-row.failed { border-left-color: rgba(239, 68, 68, 0.6); }

        .log-row-head {
            display: flex;
            justify-content: space-between;
            gap: 0.75rem;
            color: rgba(255, 255, 255, 0.75);
        }

        .log-row-request {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }

        .log-row:hover .log-row-request {
            white-space: normal;
            overflow: visible;
        }

        .log-row-when {
            color: rgba(255, 255, 255, 0.35);
            font-size: 0.78rem;
            white-space: nowrap;
        }

        .log-row-detail {
            display: none;
            margin-top: 0.4rem;
            color: rgba(255, 255, 255, 0.45);
            font-size: 0.78rem;
        }

        .log-row:hover .log-row-detail { display: block; }"""

assert OLD_ACTIVE in html, 'active card style not found'
html = html.replace(OLD_ACTIVE, NEW_ACTIVE)

open(H, 'w').write(html)
print('dashboard.html patched')


# ═══════════════════════════════════════════════════════════════════════════
# JS — card click, header link, drawer, and the module-timing fix
# ═══════════════════════════════════════════════════════════════════════════

J = 'frontend/scripts/dashboardLogic.js'
assert os.path.exists(J), 'dashboardLogic.js not found'
js = open(J).read()

# ── Card is the control; drop the button and the in-card log ───────────────
OLD_CARD_OPEN = '<div class="project-card" data-project-id="${project.id}">'
NEW_CARD_OPEN = '''<div class="project-card" data-project-id="${project.id}"
                    onclick='selectChatProject(${JSON.stringify(project).replace(/'/g, "&#39;")})'>'''
assert OLD_CARD_OPEN in js, 'card open tag not found'
js = js.replace(OLD_CARD_OPEN, NEW_CARD_OPEN)

# Remove the in-card modification log — it lives in the drawer now
start = js.index('                    ${modifications.length > 0 ? `')
end = js.index("                    <div class=\"project-btn-group\">")
js = js[:start] + js[end:]

# Replace the button group: no chat button, no live-site button (it is in the
# header now), keep the purchase path for anyone out of credits.
OLD_BTNS_START = js.index('                    <div class="project-btn-group">')
OLD_BTNS_END = js.index('</div>\n                </div>\n                `;', OLD_BTNS_START) + len('</div>')
NEW_BTNS = '''                    <div class="project-btn-group">
                        ${canModify ? '' : `
                            <button 
                                onclick='event.stopPropagation(); openPurchaseModal(${JSON.stringify(project).replace(/'/g, "&#39;")})' 
                                class="btn btn-purchase">
                                💳 Buy more changes
                            </button>
                        `}
                    </div>'''
js = js[:OLD_BTNS_START] + NEW_BTNS + js[OLD_BTNS_END:]

# Payment buttons inside the card must not also select the project
js = js.replace('onclick="setupPayments(', 'onclick="event.stopPropagation(); setupPayments(')

# ── selectChatProject also drives the header link and the drawer ───────────
OLD_SELECT_TAIL = """    chatSetEnabled(remaining > 0);"""
NEW_SELECT_TAIL = """    chatSetEnabled(remaining > 0);

    // The header link follows whichever project is selected
    const navLink = document.getElementById('navViewSite');
    if (navLink) {
        navLink.href = project.liveUrl || '#';
        navLink.style.display = project.liveUrl ? 'inline-block' : 'none';
    }

    renderLogDrawer(project);"""
assert OLD_SELECT_TAIL in js, 'select tail not found'
js = js.replace(OLD_SELECT_TAIL, NEW_SELECT_TAIL)

# ── Drawer rendering + module-timing fix ───────────────────────────────────
OLD_WIRE = """// Enter sends, Shift+Enter is a newline. Standard for a chat box, and the hint
// under the composer says so.
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('chatInput');
    const send = document.getElementById('chatSendBtn');
    if (!input || !send) return;

    send.onclick = () => window.sendChatMessage();
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            window.sendChatMessage();
        }
    });
});"""

NEW_WIRE = """// Change history, folded away. One line per entry, opening on hover — the
// request text is usually short and the rest is rarely wanted.
function renderLogDrawer(project) {
    const drawer = document.getElementById('logDrawer');
    const body = document.getElementById('logDrawerBody');
    const label = document.getElementById('logDrawerLabel');
    if (!drawer || !body) return;

    const mods = project.modifications || [];
    if (mods.length === 0) {
        drawer.style.display = 'none';
        return;
    }

    drawer.style.display = 'block';
    label.textContent = `Change history (${mods.length})`;

    body.innerHTML = mods.slice().reverse().map((mod) => {
        const failed = mod.status === 'failed';
        const when = mod.timestamp
            ? new Date(mod.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : '';
        return `
            <div class="log-row ${failed ? 'failed' : ''}">
                <div class="log-row-head">
                    <span class="log-row-request">${chatEscape(mod.request || 'No description')}</span>
                    <span class="log-row-when">${when}</span>
                </div>
                <div class="log-row-detail">
                    ${failed ? 'Failed — not charged' : 'Applied'}${mod.userEmail ? ` · ${chatEscape(mod.userEmail)}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Enter sends, Shift+Enter is a newline.
//
// Wired immediately rather than on DOMContentLoaded: this file is an ES module,
// so it evaluates after that event has already fired and the listener never
// ran — which is why the composer did nothing.
(function wireChat() {
    const input = document.getElementById('chatInput');
    const send = document.getElementById('chatSendBtn');
    const toggle = document.getElementById('logDrawerToggle');

    if (!input || !send) {
        // The script can still load before the body in some paths; try again.
        return void setTimeout(wireChat, 50);
    }

    send.onclick = () => window.sendChatMessage();
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            window.sendChatMessage();
        }
    });

    if (toggle) {
        toggle.onclick = () => document.getElementById('logDrawer').classList.toggle('open');
    }
})();"""

assert OLD_WIRE in js, 'wiring block not found'
js = js.replace(OLD_WIRE, NEW_WIRE)

open(J, 'w').write(js)
print('dashboardLogic.js patched')
print('  selectChatProject calls:', js.count('selectChatProject('))
print('  modification-log in card:', js.count('modification-log'))
