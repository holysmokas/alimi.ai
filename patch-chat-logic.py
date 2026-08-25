#!/usr/bin/env python3
"""
Drives the two-column chat panel.

Replaces the modal flow entirely. The panel is always present, knows which
project it is talking about, and keeps the thread while you are on the page.

Talking is free — every message goes to /clarify-modification, which reads
nothing and writes nothing. A credit is only spent when the customer presses the
confirm button on a stated plan.

Run from the frontend repo root:  python3 patch-chat-logic.py
"""

import os, re

P = 'frontend/scripts/dashboardLogic.js'
assert os.path.exists(P), 'dashboardLogic.js not found — run from the repo root'
src = open(P).read()
original = src

# ---------------------------------------------------------------------------
# 1. Project cards select the chat subject instead of opening a modal
# ---------------------------------------------------------------------------

OLD_BTN = """                        ${canModify ? `
                            <button 
                                onclick='openAiModificationModal(${JSON.stringify(project).replace(/'/g, "&#39;")})' 
                                class="btn btn-modify">
                                🤖 Request Modification (${modsRemaining} free left)
                            </button>
                        ` : `"""

NEW_BTN = """                        ${canModify ? `
                            <button 
                                onclick='selectChatProject(${JSON.stringify(project).replace(/'/g, "&#39;")})' 
                                class="btn btn-modify">
                                💬 Make a change (${modsRemaining} left)
                            </button>
                        ` : `"""

assert OLD_BTN in src, 'modify button not found'
src = src.replace(OLD_BTN, NEW_BTN)

# Tag each card so the active one can be highlighted
OLD_CARD = '<div class="project-card">'
if OLD_CARD in src:
    src = src.replace(OLD_CARD, '<div class="project-card" data-project-id="${project.id}">')
else:
    print('NOTE: could not tag project cards — the active-card highlight will not show.')

# ---------------------------------------------------------------------------
# 2. Replace the whole modal implementation with the panel
# ---------------------------------------------------------------------------

start = src.index('window.openAiModificationModal = function (project) {')
end = src.index('function showResponseModal(')
old_block = src[start:end]
assert 'submitAiModification' in old_block, 'unexpected span — aborting'

NEW_BLOCK = '''// ── Chat panel ───────────────────────────────────────────────────────────────
//
// The assistant used to live in a modal: open it, type one thing, watch a
// spinner, close it. That shape reads as a form. The interaction was already a
// conversation once the clarify step went in — this makes the surface match.
//
// Talking is free. Every message goes to /clarify-modification, which reads
// nothing from the repository and writes nothing. A credit is spent only when
// the customer presses the confirm button on a plan they have seen.

let chatProject = null;
let chatThread = [];      // [{ role, content }] — the model's view
let chatBusy = false;

function chatEscape(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function chatScroll() {
    const el = document.getElementById('chatThread');
    el.scrollTop = el.scrollHeight;
}

function chatBubble(html, who) {
    const el = document.getElementById('chatThread');
    const empty = document.getElementById('chatEmpty');
    if (empty) empty.remove();

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${who}`;
    bubble.innerHTML = html;
    el.appendChild(bubble);
    chatScroll();
    return bubble;
}

function chatTyping(on) {
    const existing = document.getElementById('chatTyping');
    if (!on) { if (existing) existing.remove(); return; }
    if (existing) return;

    const el = document.getElementById('chatThread');
    const dots = document.createElement('div');
    dots.className = 'chat-typing';
    dots.id = 'chatTyping';
    dots.innerHTML = '<span></span><span></span><span></span>';
    el.appendChild(dots);
    chatScroll();
}

function chatSetEnabled(on) {
    document.getElementById('chatInput').disabled = !on;
    document.getElementById('chatSendBtn').disabled = !on;
}

// Clicking a project points the chat at it. Switching projects starts a fresh
// thread — carrying a conversation about one site over to another would be
// worse than losing it.
window.selectChatProject = function (project) {
    const switching = !chatProject || chatProject.id !== project.id;
    chatProject = project;

    if (switching) {
        chatThread = [];
        document.getElementById('chatThread').innerHTML = '';
    }

    document.querySelectorAll('.project-card').forEach((c) => {
        c.classList.toggle('chat-active', c.dataset.projectId === project.id);
    });

    const remaining = (project.modificationsLimit || 3) - (project.modificationsUsed || 0);
    document.getElementById('chatSubject').textContent = project.businessName;
    document.getElementById('chatCredits').textContent =
        `${remaining} change${remaining !== 1 ? 's' : ''} remaining`;

    chatSetEnabled(remaining > 0);

    if (switching) {
        chatBubble(
            remaining > 0
                ? `What would you like to change about <strong>${chatEscape(project.businessName)}</strong>? I'll tell you exactly what I'd do before anything happens.`
                : `You've used all your changes for this site. Call <strong>(415) 691-7085</strong> and we'll sort out more.`,
            'ai'
        );
    }

    document.getElementById('chatInput').focus();
};

window.sendChatMessage = async function () {
    if (chatBusy || !chatProject) return;

    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    chatBubble(chatEscape(text), 'user');
    input.value = '';
    chatBusy = true;
    chatSetEnabled(false);
    chatTyping(true);

    try {
        const resp = await fetch(`${API_BASE_URL}/clarify-modification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: chatProject.id,
                userId: currentUser.uid,
                message: text,
                conversation: chatThread
            })
        });

        const data = await resp.json();
        chatTyping(false);
        chatThread.push({ role: 'user', content: text });

        if (data.status === 'question') {
            chatBubble(chatEscape(data.question), 'ai');
            chatThread.push({ role: 'assistant', content: data.question });

        } else if (data.status === 'cannot') {
            chatBubble(
                `${chatEscape(data.reason)}<span class="chat-meta">Nothing has been charged.</span>`,
                'ai'
            );
            chatThread.push({ role: 'assistant', content: data.reason });

        } else if (data.status === 'ready') {
            const files = (data.files || []).join(', ');
            const bubble = chatBubble(
                `${chatEscape(data.summary)}` +
                (files ? `<span class="chat-meta">Files: ${chatEscape(files)}</span>` : '') +
                `<br><button class="chat-confirm-btn">Make this change</button>` +
                `<span class="chat-meta">Uses one of your changes</span>`,
                'ai'
            );
            chatThread.push({ role: 'assistant', content: data.summary });

            const btn = bubble.querySelector('.chat-confirm-btn');
            btn.onclick = () => {
                btn.disabled = true;
                btn.textContent = 'Starting…';
                applyChatModification(data.summary);
            };

        } else {
            chatBubble("I didn't quite follow that — could you put it another way?", 'ai');
        }

    } catch (err) {
        console.error('Chat failed:', err);
        chatTyping(false);
        chatBubble('I couldn\\'t reach the server just then. Please try again.', 'ai');
    } finally {
        chatBusy = false;
        const remaining = (chatProject.modificationsLimit || 3) - (chatProject.modificationsUsed || 0);
        chatSetEnabled(remaining > 0);
        document.getElementById('chatInput').focus();
    }
};

// The part that costs a credit. Only reachable from the confirm button, so the
// customer has already seen exactly what will change.
async function applyChatModification(summary) {
    chatBusy = true;
    chatSetEnabled(false);
    chatTyping(true);

    try {
        const response = await fetch(ENDPOINTS.requestModification, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.uid,
                projectId: chatProject.id,
                modificationRequest: summary
            })
        });

        const data = await response.json();
        chatTyping(false);

        if (!data.success) {
            chatBubble(
                `${chatEscape(data.error || 'Something went wrong')}<span class="chat-meta">Nothing has been charged.</span>`,
                'ai'
            );
            return;
        }

        chatBubble(
            `On it — this usually takes a minute or two. I'll tell you when it's live.` +
            `<span class="chat-meta">${data.modificationsRemaining} change${data.modificationsRemaining !== 1 ? 's' : ''} remaining</span>`,
            'ai'
        );
        document.getElementById('chatCredits').textContent =
            `${data.modificationsRemaining} change${data.modificationsRemaining !== 1 ? 's' : ''} remaining`;

        pollChatModification();

    } catch (err) {
        console.error('Apply failed:', err);
        chatTyping(false);
        chatBubble('I could not start that change. Please try again.', 'ai');
    } finally {
        chatBusy = false;
    }
}

// Wait for the background job. Ten seconds between checks, giving up after
// three minutes — the email arrives either way.
function pollChatModification() {
    const projectId = chatProject.id;
    let attempts = 0;

    const timer = setInterval(async () => {
        attempts++;

        try {
            const resp = await fetch(ENDPOINTS.userProjects(currentUser.uid));
            const data = await resp.json();
            if (!data.success || !data.projects) return;

            const updated = data.projects.find((p) => p.id === projectId);
            if (!updated || !updated.modifications) return;

            const latest = updated.modifications[updated.modifications.length - 1];
            if (!latest) return;

            if (latest.status === 'completed') {
                clearInterval(timer);
                chatProject = updated;
                await loadProjects(currentUser.uid);
                chatBubble(
                    `Done — it's live. <a href="${updated.liveUrl}" target="_blank" style="color:#10b981;font-weight:600">Take a look</a>` +
                    `<span class="chat-meta">GitHub Pages can take a couple of minutes to catch up.</span>`,
                    'ai'
                );
                chatSetEnabled(true);

            } else if (latest.status === 'failed') {
                clearInterval(timer);
                await loadProjects(currentUser.uid);
                chatBubble(
                    `That didn't go through, and your change has been returned — you haven't been charged.` +
                    `<span class="chat-meta">Try wording it differently, or call (415) 691-7085.</span>`,
                    'ai'
                );
                chatSetEnabled(true);
            }
        } catch (err) {
            console.error('Poll error:', err);
        }

        if (attempts >= 18) {
            clearInterval(timer);
            await loadProjects(currentUser.uid);
            chatBubble(
                `Still working on it. Check your email — I'll send confirmation when it's done.`,
                'ai'
            );
            chatSetEnabled(true);
        }
    }, 10000);
}

// Enter sends, Shift+Enter is a newline. Standard for a chat box, and the hint
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
});

'''

src = src[:start] + NEW_BLOCK + src[end:]

assert src != original, 'nothing changed'
open(P, 'w').write(src)

print('chatProject refs:', src.count('chatProject'))
print('modal refs left: ', src.count('openAiModificationModal') + src.count('submitAiModification'))
