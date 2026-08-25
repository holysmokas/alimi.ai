#!/usr/bin/env python3
"""
Makes the modification modal a conversation rather than a form.

Before: type a request, the credit is deducted immediately, a background job
runs, and you find out minutes later whether it worked. "Add a title to the
checkout page" cost a credit to be told checkout cannot be edited.

After: talking is free. The assistant confirms what it would change, asks when a
request is ambiguous, or explains when something is out of scope — all without
spending anything. The credit is only deducted when the customer presses the
button on a specific, stated plan.

Run from the frontend repo root:
    python3 patch-clarify-frontend.py
"""

import os

P = 'frontend/scripts/dashboardLogic.js'
if not os.path.exists(P):
    P = 'scripts/dashboardLogic.js'
assert os.path.exists(P), 'dashboardLogic.js not found — run from the repo root'

src = open(P).read()
original = src

# ---------------------------------------------------------------------------
# 1. Conversation state, reset whenever the modal opens
# ---------------------------------------------------------------------------

OLD_OPEN = """window.openAiModificationModal = function (project) {
    currentProject = project;
    const modsRemaining = (project.modificationsLimit || 3) - (project.modificationsUsed || 0);

    document.getElementById('modificationsCount').textContent = modsRemaining;
    document.getElementById('aiModificationModal').classList.add('show');
    document.getElementById('aiModificationInput').value = '';

    // Reset chat messages
    document.getElementById('aiChatMessages').innerHTML = `
        <div class="ai-message">
            <strong>AI Assistant:</strong> Hi! I can help you modify "${project.businessName}". You have ${modsRemaining} free modification${modsRemaining !== 1 ? 's' : ''} remaining. What would you like to change?
        </div>
    `;
};"""

NEW_OPEN = """// The thread for the current modal. Client-side only: it exists for the length
// of one editing session and does not need to survive a refresh.
let modConversation = [];

window.openAiModificationModal = function (project) {
    currentProject = project;
    modConversation = [];
    const modsRemaining = (project.modificationsLimit || 3) - (project.modificationsUsed || 0);

    document.getElementById('modificationsCount').textContent = modsRemaining;
    document.getElementById('aiModificationModal').classList.add('show');
    document.getElementById('aiModificationInput').value = '';

    document.getElementById('aiChatMessages').innerHTML = `
        <div class="ai-message">
            <strong>AI Assistant:</strong> Hi! I can help you change "${project.businessName}".
            Tell me what you'd like and I'll confirm exactly what I'd do before anything happens —
            talking costs nothing. You have ${modsRemaining} change${modsRemaining !== 1 ? 's' : ''} remaining.
        </div>
    `;
};"""

assert OLD_OPEN in src, 'openAiModificationModal not found'
src = src.replace(OLD_OPEN, NEW_OPEN)

# ---------------------------------------------------------------------------
# 2. Submit now clarifies first
# ---------------------------------------------------------------------------

OLD_SUBMIT_HEAD = """    if (!request || !currentProject) return;

    // Add user message to chat
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.innerHTML = `<strong>You:</strong> ${request}`;
    chatMessages.appendChild(userMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Clear input and disable form
    input.value = '';
    submitBtn.disabled = true;
    inputForm.style.display = 'none';
    processingMsg.style.display = 'block';

    try {
        const response = await fetch(ENDPOINTS.requestModification, {"""

NEW_SUBMIT_HEAD = """    if (!request || !currentProject) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.innerHTML = `<strong>You:</strong> ${escapeHtml(request)}`;
    chatMessages.appendChild(userMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    input.value = '';
    submitBtn.disabled = true;

    // Talk first. This costs nothing and touches nothing — it decides whether the
    // request is clear, ambiguous, or out of scope before a credit is spent.
    try {
        const clarifyResp = await fetch(`${API_BASE_URL}/clarify-modification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: currentProject.id,
                userId: currentUser.uid,
                message: request,
                conversation: modConversation
            })
        });

        const clarify = await clarifyResp.json();
        submitBtn.disabled = false;

        modConversation.push({ role: 'user', content: request });

        if (clarify.status === 'question') {
            appendAi(clarify.question);
            modConversation.push({ role: 'assistant', content: clarify.question });
            return;
        }

        if (clarify.status === 'cannot') {
            appendAi(`${clarify.reason}<br><br><em>Nothing has been charged.</em>`);
            modConversation.push({ role: 'assistant', content: clarify.reason });
            return;
        }

        if (clarify.status === 'ready') {
            const fileList = (clarify.files || []).join(', ');
            const confirmId = `confirm-${Date.now()}`;
            appendAi(
                `${escapeHtml(clarify.summary)}` +
                (fileList ? `<br><span style="opacity:.6;font-size:.85em">Files: ${escapeHtml(fileList)}</span>` : '') +
                `<br><br><button id="${confirmId}" class="btn btn-primary" style="margin-top:.5rem">Make this change</button>` +
                `<span style="opacity:.6;font-size:.85em;margin-left:.75rem">Uses one of your changes</span>`
            );
            modConversation.push({ role: 'assistant', content: clarify.summary });

            document.getElementById(confirmId).onclick = () => {
                document.getElementById(confirmId).disabled = true;
                document.getElementById(confirmId).textContent = 'Starting…';
                applyModification(clarify.summary);
            };
            return;
        }

        // Anything unexpected — say so rather than silently doing nothing.
        appendAi("I didn't quite follow that. Could you put it another way?");
        return;

    } catch (err) {
        console.error('Clarify failed:', err);
        submitBtn.disabled = false;
        appendAi('I could not reach the server just then. Please try again.');
        return;
    }
};

// Small helpers used by both halves of the flow.
function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function appendAi(html) {
    const chatMessages = document.getElementById('aiChatMessages');
    const el = document.createElement('div');
    el.className = 'ai-message';
    el.innerHTML = `<strong>AI Assistant:</strong> ${html}`;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// This is the part that costs a credit. Only reached from the confirm button,
// so the customer has seen exactly what will change.
async function applyModification(request) {
    const submitBtn = document.getElementById('aiSubmitBtn');
    const chatMessages = document.getElementById('aiChatMessages');
    const processingMsg = document.getElementById('aiProcessingMessage');
    const inputForm = document.getElementById('aiModificationForm');

    submitBtn.disabled = true;
    inputForm.style.display = 'none';
    processingMsg.style.display = 'block';

    try {
        const response = await fetch(ENDPOINTS.requestModification, {"""

assert OLD_SUBMIT_HEAD in src, 'submit head not found'
src = src.replace(OLD_SUBMIT_HEAD, NEW_SUBMIT_HEAD)

# The body of the old submit sent `modificationRequest: request` — still correct,
# it is now the confirmed summary rather than the raw first message.

# ---------------------------------------------------------------------------
# 3. Failure messages mention the refund
# ---------------------------------------------------------------------------

OLD_FAIL = """failMsg.innerHTML = `<strong>AI Assistant:</strong> ❌ Sorry, there was an error processing your modification. Please try again or contact support at (415) 691-7085.`;"""
NEW_FAIL = """failMsg.innerHTML = `<strong>AI Assistant:</strong> ❌ That change didn't go through, and your credit has been returned — you haven't been charged. Try rewording it, or call (415) 691-7085 and we'll do it by hand.`;"""
assert OLD_FAIL in src, 'fail message not found'
src = src.replace(OLD_FAIL, NEW_FAIL)

OLD_ERR = """aiMsg.innerHTML = `<strong>AI Assistant:</strong> I'm sorry, there was an error processing your request: ${data.error || 'Unknown error'}. Please try again or contact support at (415) 691-7085.`;"""
NEW_ERR = """aiMsg.innerHTML = `<strong>AI Assistant:</strong> ${escapeHtml(data.error || 'Something went wrong')}. Nothing has been charged — please try again, or call (415) 691-7085.`;"""
assert OLD_ERR in src, 'error message not found'
src = src.replace(OLD_ERR, NEW_ERR)

# ---------------------------------------------------------------------------
# 4. API_BASE_URL must be imported for the clarify call
# ---------------------------------------------------------------------------

if 'API_BASE_URL' not in src.split('\n')[0:40][0] and 'API_BASE_URL' in src:
    pass  # checked below instead

head = '\n'.join(src.split('\n')[:30])
if 'API_BASE_URL' not in head:
    print('NOTE: add API_BASE_URL to the config import at the top of the file:')
    print("      import { ENDPOINTS, API_BASE_URL } from './config.js';")

assert src != original, 'nothing changed'
open(P, 'w').write(src)
print('patched:', P)
