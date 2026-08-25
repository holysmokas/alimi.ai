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
                                <button onclick="setupPayments('${project.id}')" class="btn btn-purchase" style="margin-top: 0.5rem;">
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
                                <button onclick="setupPayments('${project.id}')" class="btn btn-primary" style="margin-top: 0.5rem;">
                                    🔗 Setup Payments
                                </button>
                            </div>
                        `;
                    }
                }

                return `
                <div class="project-card">
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

                    ${modifications.length > 0 ? `
                    <div class="modification-log">
                        <h4>📋 Modification Log</h4>
                        ${formatModificationLog(modifications, 3)}
                        ${modifications.length > 3 ? `
                            <button onclick='viewAllModifications(${JSON.stringify(modifications).replace(/'/g, "&#39;")})' class="view-all-btn">
                                View all ${modifications.length} modifications
                            </button>
                        ` : ''}
                    </div>
                    ` : '<p class="no-modifications">No modifications yet</p>'}

                    <div class="project-btn-group">
                        <a href="${project.liveUrl}" target="_blank" class="btn btn-view">🌐 View Live Site</a>
                        
                        ${canModify ? `
                            <button 
                                onclick='openAiModificationModal(${JSON.stringify(project).replace(/'/g, "&#39;")})' 
                                class="btn btn-modify">
                                🤖 Request Modification (${modsRemaining} free left)
                            </button>
                        ` : `
                            <button 
                                onclick='openPurchaseModal(${JSON.stringify(project).replace(/'/g, "&#39;")})' 
                                class="btn btn-purchase">
                                💳 Purchase More Modifications
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
};

window.closeAiModificationModal = function () {
    document.getElementById('aiModificationModal').classList.remove('show');
    currentProject = null;
};

window.submitAiModification = async function (event) {
    event.preventDefault();

    const input = document.getElementById('aiModificationInput');
    const request = input.value.trim();
    const submitBtn = document.getElementById('aiSubmitBtn');
    const chatMessages = document.getElementById('aiChatMessages');
    const processingMsg = document.getElementById('aiProcessingMessage');
    const inputForm = document.getElementById('aiModificationForm');

    console.log('🔍 DEBUG: submitAiModification called');
    console.log('🔍 currentUser:', currentUser);
    console.log('🔍 currentProject:', currentProject);
    console.log('🔍 request:', request);
    console.log('🔍 ENDPOINTS:', ENDPOINTS);

    if (!request || !currentProject) return;

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
        const response = await fetch(ENDPOINTS.requestModification, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.uid,
                projectId: currentProject.id,
                modificationRequest: request
            })
        });

        const data = await response.json();
        processingMsg.style.display = 'none';
        inputForm.style.display = 'block';
        submitBtn.disabled = false;

        if (data.success) {
            // Add AI response
            const aiMsg = document.createElement('div');
            aiMsg.className = 'ai-message';
            aiMsg.innerHTML = `<strong>AI Assistant:</strong> Great! I've submitted your request. The AI is now processing your changes - this typically takes 1-3 minutes. I'll update this page automatically when it's complete. ${data.modificationsRemaining} free modification${data.modificationsRemaining !== 1 ? 's' : ''} remaining.`;
            chatMessages.appendChild(aiMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Update count
            document.getElementById('modificationsCount').textContent = data.modificationsRemaining;

            // Poll for modification completion (every 10 seconds for up to 3 minutes)
            let pollCount = 0;
            const maxPolls = 18; // 18 * 10 seconds = 3 minutes
            const projectIdToCheck = currentProject.id;

            const pollInterval = setInterval(async () => {
                pollCount++;
                console.log(`🔄 Polling for modification status... (${pollCount}/${maxPolls})`);

                try {
                    // Fetch latest project data directly
                    const response = await fetch(ENDPOINTS.userProjects(currentUser.uid));
                    const data = await response.json();

                    if (data.success && data.projects) {
                        const updatedProject = data.projects.find(p => p.id === projectIdToCheck);
                        if (updatedProject && updatedProject.modifications) {
                            const latestMod = updatedProject.modifications[updatedProject.modifications.length - 1];
                            if (latestMod && latestMod.status === 'completed') {
                                clearInterval(pollInterval);
                                console.log('✅ Modification completed!');

                                // Update currentProject with new data
                                currentProject = updatedProject;

                                // Reload the projects list to update the UI
                                await loadProjects(currentUser.uid);

                                // Show completion message
                                const completeMsg = document.createElement('div');
                                completeMsg.className = 'ai-message';
                                completeMsg.innerHTML = `<strong>AI Assistant:</strong> ✅ Your modification is complete! Your website has been updated. <a href="${updatedProject.liveUrl}" target="_blank" style="color: #6366f1; font-weight: bold;">View your updated site</a>`;
                                chatMessages.appendChild(completeMsg);
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            } else if (latestMod && latestMod.status === 'failed') {
                                clearInterval(pollInterval);
                                console.log('❌ Modification failed');

                                // Reload the projects list to update the UI
                                await loadProjects(currentUser.uid);

                                const failMsg = document.createElement('div');
                                failMsg.className = 'ai-message';
                                failMsg.innerHTML = `<strong>AI Assistant:</strong> ❌ That change didn't go through, and your credit has been returned — you haven't been charged. Try rewording it, or call (415) 691-7085 and we'll do it by hand.`;
                                chatMessages.appendChild(failMsg);
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        }
                    }
                } catch (err) {
                    console.error('Poll error:', err);
                }

                // Stop polling after max attempts
                if (pollCount >= maxPolls) {
                    clearInterval(pollInterval);
                    console.log('⏱️ Polling timeout');

                    // Final reload to show current status
                    await loadProjects(currentUser.uid);

                    const timeoutMsg = document.createElement('div');
                    timeoutMsg.className = 'ai-message';
                    timeoutMsg.innerHTML = `<strong>AI Assistant:</strong> Your modification is still processing. Please refresh the page in a few minutes to see the updated status, or check your email for confirmation.`;
                    chatMessages.appendChild(timeoutMsg);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }, 10000); // Poll every 10 seconds

            if (data.modificationsRemaining === 0) {
                closeAiModificationModal();
                showResponseModal('Modifications Limit Reached', 'You\'ve used all 3 free modifications. Additional changes will require a small fee. Contact us at (415) 691-7085 to discuss pricing.');
            }

        } else {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'ai-message';
            aiMsg.innerHTML = `<strong>AI Assistant:</strong> ${escapeHtml(data.error || 'Something went wrong')}. Nothing has been charged — please try again, or call (415) 691-7085.`;
            chatMessages.appendChild(aiMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

    } catch (error) {
        console.error('Error submitting modification:', error);
        processingMsg.style.display = 'none';
        inputForm.style.display = 'block';
        submitBtn.disabled = false;

        const aiMsg = document.createElement('div');
        aiMsg.className = 'ai-message';
        aiMsg.innerHTML = '<strong>AI Assistant:</strong> I encountered a technical error. Please try again or contact support at (415) 691-7085.';
        chatMessages.appendChild(aiMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
};

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