// frontend/scripts/dashboardLogic.js
// frontend/scripts/dashboardLogic.js
import { auth } from '/frontend/scripts/config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { ENDPOINTS, API_BASE_URL } from '/frontend/scripts/config.js';

let currentUser = null;
let currentProject = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadProjects(user.uid);
    } else {
        window.location.href = './login.html';
    }
});


// Make auth globally available for logout
window.auth = auth;

// Handle Connect return from Stripe onboarding
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('connect_success') === 'true') {
    const projectId = urlParams.get('project_id');
    console.log('✅ Connect onboarding completed for project:', projectId);

    setTimeout(() => {
        showResponseModal('🎉 Payment Setup Complete!', 'Your shop can now accept payments from customers.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }, 500);
}

if (urlParams.get('connect_refresh') === 'true') {
    const projectId = urlParams.get('project_id');
    console.log('🔄 Connect onboarding needs refresh for project:', projectId);

    setTimeout(() => {
        if (projectId && typeof setupPayments === 'function') {
            setupPayments(projectId);
        }
    }, 1000);
}
/**
 * Format modification log entry HTML
 */
function formatModificationLog(modifications, limit = 3) {
    if (!modifications || modifications.length === 0) {
        return '<p class="no-modifications">No modifications yet</p>';
    }

    const displayMods = modifications.slice(0, limit);

    return displayMods.map((mod, index) => {
        const modNumber = index + 1;
        const statusClass = mod.status === 'completed' ? 'completed' :
            mod.status === 'pending' ? 'pending' : 'failed';
        const userName = mod.userEmail || mod.userName || 'User';
        const timestamp = mod.timestamp ? new Date(mod.timestamp).toLocaleString() : 'Unknown date';

        return `
            <div class="log-entry">
                <div class="log-header">
                    <span class="log-number">#${modNumber}</span>
                    <span class="log-status ${statusClass}">${mod.status || 'completed'}</span>
                    <span class="log-date">${timestamp}</span>
                </div>
                <p class="log-prompt"><strong>Request:</strong> ${mod.request || 'No description'}</p>
                <p class="log-user">👤 Requested by: ${userName}</p>
            </div>
        `;
    }).join('');
}

async function loadProjects(userId) {
    try {
        const response = await fetch(ENDPOINTS.userProjects(userId));
        const data = await response.json();
        const container = document.getElementById('projectsContainer');

        if (data.success && data.projects.length > 0) {
            // Use Promise.all since we need to await async operations
            const projectCards = await Promise.all(data.projects.map(async (project) => {
                const modsUsed = project.modificationsUsed || 0;
                const modsLimit = project.modificationsLimit || 3;
                const modsRemaining = modsLimit - modsUsed;
                const canModify = modsRemaining > 0;
                const modifications = project.modifications || [];

                // Check if SmallShop and needs payment setup
                const isSmallShop = project.packageType && (project.packageType.toLowerCase().includes('smallshop') || project.packageType.toLowerCase().includes('small shop'));
                let paymentStatus = null;

                if (isSmallShop) {
                    paymentStatus = await checkConnectStatus(project.id);
                }

                // Build payment setup section for SmallShop
                let paymentSetupHtml = '';
                if (isSmallShop) {
                    if (paymentStatus && paymentStatus.connected && paymentStatus.status === 'active') {
                        paymentSetupHtml = `
                            <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0; color: #155724;">
                                    <strong>✅ Payments Active</strong> - Your shop can accept payments
                                </p>
                            </div>
                        `;
                    } else if (paymentStatus && paymentStatus.connected && paymentStatus.status === 'pending') {
                        paymentSetupHtml = `
                            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0 0 0.5rem 0; color: #856404;">
                                    <strong>⏳ Payment Setup Incomplete</strong>
                                </p>
                                <button onclick="event.stopPropagation(); setupPayments('${project.id}')" class="btn btn-purchase" style="margin-top: 0.5rem;">
                                    Complete Payment Setup
                                </button>
                            </div>
                        `;
                    } else {
                        paymentSetupHtml = `
                            <div style="background: #e7f3ff; border: 1px solid #007bff; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0 0 0.5rem 0; color: #004085;">
                                    <strong>💳 Accept Payments from Customers</strong>
                                </p>
                                <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
                                    Set up Stripe to receive payments directly to your bank account.
                                </p>
                                <button onclick="event.stopPropagation(); setupPayments('${project.id}')" class="btn btn-primary" style="margin-top: 0.5rem;">
                                    🔗 Setup Payments
                                </button>
                            </div>
                        `;
                    }
                }

                return `
                <div class="project-card" data-project-id="${project.id}"
                    onclick='selectChatProject(${JSON.stringify(project).replace(/'/g, "&#39;")})'>
                    <h3>${project.businessName}</h3>
                    <div class="project-info">
                        <p><strong>Status:</strong> <span class="project-status status-${project.status}">${project.status}</span></p>
                        <p><strong>Package:</strong> ${project.packageType}</p>
                        <p><strong>Created:</strong> ${new Date(project.createdAt.seconds * 1000).toLocaleDateString()}</p>
                        <p><strong>Modifications:</strong> 
                            <span class="${modsRemaining > 0 ? 'text-success' : 'text-warning'}">
                                ${modsUsed}/${modsLimit} used
                            </span>
                            ${modsRemaining === 0 ? '<span class="badge-limit">Limit Reached</span>' : ''}
                        </p>
                    </div>

                    ${paymentSetupHtml}

                    <div class="project-btn-group">
                        ${canModify ? '' : `
                            <button 
                                onclick='event.stopPropagation(); openPurchaseModal(${JSON.stringify(project).replace(/'/g, "&#39;")})' 
                                class="btn btn-purchase">
                                💳 Buy more changes
                            </button>
                        `}
                    </div>
                </div>
                `;
            }));

            container.innerHTML = projectCards.join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No projects yet</h3>
                    <p>Your projects will appear here once they're created.</p>
                    <a href="./build.html" class="btn btn-primary">Start a New Project</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('projectsContainer').innerHTML = `
            <div class="empty-state">
                <h3>Error loading projects</h3>
                <p>Please try refreshing the page.</p>
            </div>
        `;
    }
}

// The thread for the current modal. Client-side only: it exists for the length
// of one editing session and does not need to survive a refresh.
let modConversation = [];

// ── Chat panel ───────────────────────────────────────────────────────────────
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

    // The header link follows whichever project is selected
    const navLink = document.getElementById('navViewSite');
    if (navLink) {
        navLink.href = project.liveUrl || '#';
        navLink.style.display = project.liveUrl ? 'inline-block' : 'none';
    }

    renderLogDrawer(project);

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
        chatBubble('I couldn\'t reach the server just then. Please try again.', 'ai');
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

// Change history, folded away. One line per entry, opening on hover — the
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
})();

function showResponseModal(title, message) {
    const modal = document.getElementById('responseModal');
    const content = document.getElementById('responseContent');
    content.innerHTML = `
        <h2>${title}</h2>
        <p>${message}</p>
        <button onclick="closeResponseModal()" class="btn btn-primary">Close</button>
    `;
    modal.classList.add('show');
}

window.closeResponseModal = function () {
    document.getElementById('responseModal').classList.remove('show');
};

window.viewAllModifications = function (modifications) {
    const modal = document.getElementById('responseModal');
    const content = document.getElementById('responseContent');

    content.innerHTML = `
        <h2>📋 Complete Modification Log</h2>
        <div class="modification-log">
            ${formatModificationLog(modifications, modifications.length)}
        </div>
        <button onclick="closeResponseModal()" class="btn btn-primary">Close</button>
    `;
    modal.classList.add('show');
};

window.openPurchaseModal = function (project) {
    const modal = document.getElementById('responseModal');
    const content = document.getElementById('responseContent');

    content.innerHTML = `
        <h2>💳 Purchase Additional Modifications</h2>
        <p>You've used all your free modifications for <strong>${project.businessName}</strong>.</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 2rem 0;">
            <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; padding: 1.5rem; text-align: center;">
                <h3 style="margin: 0 0 0.5rem 0; color: #333;">3 Modifications</h3>
                <p style="font-size: 2.5rem; font-weight: 700; color: #3b82f6; margin: 0.5rem 0;">$29</p>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">$9.67 per modification</p>
                <button onclick="purchaseModifications('${project.id}', '3-mods')" class="btn btn-primary" style="width: 100%;">
                    Buy 3 Mods
                </button>
            </div>
            
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 1.5rem; text-align: center; position: relative;">
                <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 2px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">BEST VALUE</span>
                <h3 style="margin: 0 0 0.5rem 0; color: #333;">10 Modifications</h3>
                <p style="font-size: 2.5rem; font-weight: 700; color: #3b82f6; margin: 0.5rem 0;">$69</p>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">$6.90 per modification</p>
                <button onclick="purchaseModifications('${project.id}', '10-mods')" class="btn btn-primary" style="width: 100%; background: #10b981;">
                    Buy 10 Mods
                </button>
            </div>
        </div>
        
        <p style="color: #6b7280; font-size: 0.9rem; text-align: center;">
            Need something custom? Call us at <strong>(415) 691-7085</strong>
        </p>
        <button onclick="closeResponseModal()" class="btn btn-outline" style="width: 100%; margin-top: 1rem;">Maybe Later</button>
    `;
    modal.classList.add('show');
};

window.purchaseModifications = async function (projectId, packageType) {
    console.log(`💳 Purchase request: ${packageType} for project ${projectId}`);

    const modal = document.getElementById('responseModal');
    const content = document.getElementById('responseContent');

    // Show loading state
    content.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Creating checkout session...</p>
        </div>
    `;

    try {
        const response = await fetch(ENDPOINTS.createModificationCheckout || `${ENDPOINTS.requestModification.replace('/request-modification', '/create-modification-checkout')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: projectId,
                userId: currentUser.uid,
                package: packageType
            })
        });

        const data = await response.json();

        if (data.success && data.sessionUrl) {
            // Redirect to Stripe checkout
            window.location.href = data.sessionUrl;
        } else {
            throw new Error(data.error || 'Failed to create checkout session');
        }

    } catch (error) {
        console.error('Error creating checkout:', error);
        content.innerHTML = `
            <h2>❌ Error</h2>
            <p>Failed to create checkout session: ${error.message}</p>
            <p>Please call us at <strong>(415) 691-7085</strong> to complete your purchase.</p>
            <button onclick="closeResponseModal()" class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `;
    }
};

// ============================================
// STRIPE CONNECT FUNCTIONS (SmallShop Payments)
// ============================================

window.checkConnectStatus = async function (projectId) {
    try {
        const response = await fetch(`${ENDPOINTS.requestModification.replace('/request-modification', '/connect-status')}/${projectId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking connect status:', error);
        return { success: false, connected: false };
    }
};

window.setupPayments = async function (projectId) {
    console.log('🔗 Setting up payments for project:', projectId);

    const modal = document.getElementById('responseModal');
    const content = document.getElementById('responseContent');

    // Show loading
    content.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Setting up payment account...</p>
        </div>
    `;
    modal.classList.add('show');

    try {
        const response = await fetch(`${ENDPOINTS.requestModification.replace('/request-modification', '/create-connect-account')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: projectId,
                userId: currentUser.uid
            })
        });

        const data = await response.json();

        if (data.success && data.onboardingUrl) {
            // Redirect to Stripe onboarding
            window.location.href = data.onboardingUrl;
        } else {
            throw new Error(data.error || 'Failed to create payment account');
        }

    } catch (error) {
        console.error('Error setting up payments:', error);
        content.innerHTML = `
            <h2>❌ Error</h2>
            <p>Failed to set up payments: ${error.message}</p>
            <p>Please call us at <strong>(415) 691-7085</strong> for assistance.</p>
            <button onclick="closeResponseModal()" class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `;
    }
};



// ============================================
// SUPPORT MODAL FUNCTIONS
// ============================================

window.openSupportModal = function () {
    document.getElementById('supportModal').classList.add('show');
    document.getElementById('supportSubject').value = '';
    document.getElementById('supportMessage').value = '';
    document.getElementById('supportForm').style.display = 'block';
    document.getElementById('supportProcessing').style.display = 'none';
};

window.closeSupportModal = function () {
    document.getElementById('supportModal').classList.remove('show');
};

window.submitSupportRequest = async function (event) {
    event.preventDefault();

    const subject = document.getElementById('supportSubject').value.trim();
    const message = document.getElementById('supportMessage').value.trim();
    const submitBtn = document.getElementById('supportSubmitBtn');
    const form = document.getElementById('supportForm');
    const processing = document.getElementById('supportProcessing');

    if (!subject || !message) return;

    // Show processing state
    form.style.display = 'none';
    processing.style.display = 'block';
    submitBtn.disabled = true;

    try {
        const response = await fetch(ENDPOINTS.supportRequest || `${ENDPOINTS.requestModification.replace('/request-modification', '/support-request')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.uid,
                userEmail: currentUser.email,
                subject: subject,
                message: message,
                userName: currentUser.displayName || currentUser.email,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();
        processing.style.display = 'none';

        if (data.success) {
            // Show success message
            const modal = document.getElementById('supportModal');
            const modalBox = modal.querySelector('.modal-box');
            modalBox.innerHTML = `
                <button class="modal-close" onclick="closeSupportModal()">&times;</button>
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 4rem; color: #28a745; margin-bottom: 1rem;">✅</div>
                    <h2>Message Sent!</h2>
                    <p style="color: #6c757d; margin: 1rem 0;">
                        We've received your message and will get back to you shortly!
                    </p>
                    
                    <p style="color: #6c757d; margin-top: 1rem;">
                        You can also call us directly at <strong>(415) 691-7085</strong>
                    </p>
                    <button onclick="closeSupportModal()" class="btn btn-primary" style="margin-top: 1.5rem;">
                        Close
                    </button>
                </div>
            `;
        } else {
            // Show error
            form.style.display = 'block';
            submitBtn.disabled = false;
            alert('Error sending message: ' + (data.error || 'Unknown error. Please try calling us at (415) 691-7085'));
        }

    } catch (error) {
        console.error('Error submitting support request:', error);
        processing.style.display = 'none';
        form.style.display = 'block';
        submitBtn.disabled = false;
        alert('Technical error sending message. Please call us directly at (415) 691-7085');
    }
};

/**
 * Load and display domain status for a project
 * Call this function when loading project details
 * 
 * @param {string} projectId - The project ID
 */
async function loadDomainStatus(projectId) {
    const section = document.getElementById('domainStatusSection');
    const content = document.getElementById('domainStatusContent');

    if (!section || !content) return;

    try {
        const response = await fetch(`${API_URL}/api/domain-connection-status/${projectId}`);
        const data = await response.json();

        if (!data.success) {
            section.style.display = 'none';
            return;
        }

        // Show section
        section.style.display = 'block';

        if (!data.hasConnection) {
            // No domain set up
            content.innerHTML = renderNoDomainStatus();
        } else if (data.isActive || data.status === 'connected') {
            // Domain is connected
            content.innerHTML = renderConnectedStatus(data);
        } else {
            // Domain pending
            content.innerHTML = renderPendingStatus(data, projectId);
        }

    } catch (error) {
        console.error('Error loading domain status:', error);
        section.style.display = 'none';
    }
}

/**
 * Render: No domain configured
 */
function renderNoDomainStatus() {
    return `
        <div class="domain-status-card no-domain">
            <div style="text-align: center; padding: 10px 0;">
                <p style="color: #6b7280; margin: 0 0 10px 0;">No custom domain configured</p>
                <p style="color: #9ca3af; font-size: 0.85rem; margin: 0;">
                    Your site is accessible via the GitHub Pages URL
                </p>
            </div>
        </div>
    `;
}

/**
 * Render: Domain connected successfully
 */
function renderConnectedStatus(data) {
    const siteUrl = `https://${data.domain}`;

    return `
        <div class="domain-status-card connected">
            <div class="domain-name-display">
                ✅ ${data.domain}
            </div>
            <span class="status-badge-domain connected">
                🟢 Connected & Live
            </span>
            
            <div class="domain-actions">
                <a href="${siteUrl}" target="_blank" class="domain-btn domain-btn-success">
                    🌍 Visit Site
                </a>
            </div>
            
            <p class="domain-info-text">
                Your domain is connected and your website is live!
            </p>
        </div>
    `;
}

/**
 * Render: Domain pending nameserver update
 */
function renderPendingStatus(data, projectId) {
    const ns1 = data.nameservers?.[0] || 'Loading...';
    const ns2 = data.nameservers?.[1] || 'Loading...';
    const connectUrl = `/connect-domain.html?project_id=${projectId}`;

    return `
        <div class="domain-status-card pending">
            <div class="domain-name-display">
                ⏳ ${data.domain}
            </div>
            <span class="status-badge-domain pending">
                🟡 Waiting for Nameservers
            </span>
            
            <div class="nameserver-mini">
                <strong>Update nameservers to:</strong><br>
                ${ns1}<br>
                ${ns2}
            </div>
            
            <div class="domain-actions">
                <a href="${connectUrl}" class="domain-btn domain-btn-primary">
                    📋 View Instructions
                </a>
                <button onclick="verifyDomainFromDashboard('${projectId}')" class="domain-btn domain-btn-secondary" id="verifyBtn-${projectId}">
                    🔍 Verify Now
                </button>
            </div>
            
            <p class="domain-info-text">
                Update your nameservers at your domain registrar, then click "Verify Now" to check connection.
                DNS propagation can take 1-48 hours.
            </p>
        </div>
    `;
}

/**
 * Verify domain connection from dashboard
 */
async function verifyDomainFromDashboard(projectId) {
    const btn = document.getElementById(`verifyBtn-${projectId}`);
    if (!btn) return;

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Checking...';

    try {
        const response = await fetch(`${API_URL}/api/verify-domain-connection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId })
        });

        const data = await response.json();

        if (data.isActive || data.status === 'connected') {
            // Reload status to show connected state
            await loadDomainStatus(projectId);
            alert('🎉 Domain connected successfully!');
        } else {
            alert(data.message || 'Nameservers not verified yet. Please wait and try again.');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }

    } catch (error) {
        console.error('Verify error:', error);
        alert('Error checking domain. Please try again.');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * Initialize domain status when project is loaded
 * Call this from your existing project loading code
 * 
 * Example usage in your dashboard: $$
 * 
 * async function loadProjectDetails(projectId) {
 *     // Your existing code...
 *     
 *     // Add this line to load domain status
 *     await loadDomainStatus(projectId);
 * }
 */