import{o as x,a as L,E as m}from"./config-rohuKh2q.js";/* empty css              */let c=null,y=null;x(L,async e=>{e?(c=e,await k(e.uid)):window.location.href="./login.html"});window.auth=L;const E=new URLSearchParams(window.location.search);if(E.get("connect_success")==="true"){const e=E.get("project_id");console.log("✅ Connect onboarding completed for project:",e),setTimeout(()=>{j("🎉 Payment Setup Complete!","Your shop can now accept payments from customers."),window.history.replaceState({},document.title,window.location.pathname)},500)}if(E.get("connect_refresh")==="true"){const e=E.get("project_id");console.log("🔄 Connect onboarding needs refresh for project:",e),setTimeout(()=>{e&&typeof setupPayments=="function"&&setupPayments(e)},1e3)}function D(e,t=3){return!e||e.length===0?'<p class="no-modifications">No modifications yet</p>':e.slice(0,t).map((o,n)=>{const s=n+1,d=o.status==="completed"?"completed":o.status==="pending"?"pending":"failed",p=o.userEmail||o.userName||"User",u=o.timestamp?new Date(o.timestamp).toLocaleString():"Unknown date";return`
            <div class="log-entry">
                <div class="log-header">
                    <span class="log-number">#${s}</span>
                    <span class="log-status ${d}">${o.status||"completed"}</span>
                    <span class="log-date">${u}</span>
                </div>
                <p class="log-prompt"><strong>Request:</strong> ${o.request||"No description"}</p>
                <p class="log-user">👤 Requested by: ${p}</p>
            </div>
        `}).join("")}async function k(e){try{const i=await(await fetch(m.userProjects(e))).json(),o=document.getElementById("projectsContainer");if(i.success&&i.projects.length>0){const n=await Promise.all(i.projects.map(async s=>{const d=s.modificationsUsed||0,p=s.modificationsLimit||3,u=p-d,r=u>0,a=s.modifications||[],h=s.packageType&&(s.packageType.toLowerCase().includes("smallshop")||s.packageType.toLowerCase().includes("small shop"));let g=null;h&&(g=await checkConnectStatus(s.id));let b="";return h&&(g&&g.connected&&g.status==="active"?b=`
                            <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0; color: #155724;">
                                    <strong>✅ Payments Active</strong> - Your shop can accept payments
                                </p>
                            </div>
                        `:g&&g.connected&&g.status==="pending"?b=`
                            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0 0 0.5rem 0; color: #856404;">
                                    <strong>⏳ Payment Setup Incomplete</strong>
                                </p>
                                <button onclick="setupPayments('${s.id}')" class="btn btn-purchase" style="margin-top: 0.5rem;">
                                    Complete Payment Setup
                                </button>
                            </div>
                        `:b=`
                            <div style="background: #e7f3ff; border: 1px solid #007bff; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0 0 0.5rem 0; color: #004085;">
                                    <strong>💳 Accept Payments from Customers</strong>
                                </p>
                                <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
                                    Set up Stripe to receive payments directly to your bank account.
                                </p>
                                <button onclick="setupPayments('${s.id}')" class="btn btn-primary" style="margin-top: 0.5rem;">
                                    🔗 Setup Payments
                                </button>
                            </div>
                        `),`
                <div class="project-card">
                    <h3>${s.businessName}</h3>
                    <div class="project-info">
                        <p><strong>Status:</strong> <span class="project-status status-${s.status}">${s.status}</span></p>
                        <p><strong>Package:</strong> ${s.packageType}</p>
                        <p><strong>Created:</strong> ${new Date(s.createdAt.seconds*1e3).toLocaleDateString()}</p>
                        <p><strong>Modifications:</strong> 
                            <span class="${u>0?"text-success":"text-warning"}">
                                ${d}/${p} used
                            </span>
                            ${u===0?'<span class="badge-limit">Limit Reached</span>':""}
                        </p>
                    </div>

                    ${b}

                    ${a.length>0?`
                    <div class="modification-log">
                        <h4>📋 Modification Log</h4>
                        ${D(a,3)}
                        ${a.length>3?`
                            <button onclick='viewAllModifications(${JSON.stringify(a).replace(/'/g,"&#39;")})' class="view-all-btn">
                                View all ${a.length} modifications
                            </button>
                        `:""}
                    </div>
                    `:'<p class="no-modifications">No modifications yet</p>'}

                    <div class="project-btn-group">
                        <a href="${s.liveUrl}" target="_blank" class="btn btn-view">🌐 View Live Site</a>
                        
                        ${r?`
                            <button 
                                onclick='openAiModificationModal(${JSON.stringify(s).replace(/'/g,"&#39;")})' 
                                class="btn btn-modify">
                                🤖 Request Modification (${u} free left)
                            </button>
                        `:`
                            <button 
                                onclick='openPurchaseModal(${JSON.stringify(s).replace(/'/g,"&#39;")})' 
                                class="btn btn-purchase">
                                💳 Purchase More Modifications
                            </button>
                        `}
                    </div>
                </div>
                `}));o.innerHTML=n.join("")}else o.innerHTML=`
                <div class="empty-state">
                    <h3>No projects yet</h3>
                    <p>Your projects will appear here once they're created.</p>
                    <a href="./build.html" class="btn btn-primary">Start a New Project</a>
                </div>
            `}catch(t){console.error("Error loading projects:",t),document.getElementById("projectsContainer").innerHTML=`
            <div class="empty-state">
                <h3>Error loading projects</h3>
                <p>Please try refreshing the page.</p>
            </div>
        `}}window.openAiModificationModal=function(e){y=e;const t=(e.modificationsLimit||3)-(e.modificationsUsed||0);document.getElementById("modificationsCount").textContent=t,document.getElementById("aiModificationModal").classList.add("show"),document.getElementById("aiModificationInput").value="",document.getElementById("aiChatMessages").innerHTML=`
        <div class="ai-message">
            <strong>AI Assistant:</strong> Hi! I can help you modify "${e.businessName}". You have ${t} free modification${t!==1?"s":""} remaining. What would you like to change?
        </div>
    `};window.closeAiModificationModal=function(){document.getElementById("aiModificationModal").classList.remove("show"),y=null};window.submitAiModification=async function(e){e.preventDefault();const t=document.getElementById("aiModificationInput"),i=t.value.trim(),o=document.getElementById("aiSubmitBtn"),n=document.getElementById("aiChatMessages"),s=document.getElementById("aiProcessingMessage"),d=document.getElementById("aiModificationForm");if(console.log("🔍 DEBUG: submitAiModification called"),console.log("🔍 currentUser:",c),console.log("🔍 currentProject:",y),console.log("🔍 request:",i),console.log("🔍 ENDPOINTS:",m),!i||!y)return;const p=document.createElement("div");p.className="user-message",p.innerHTML=`<strong>You:</strong> ${i}`,n.appendChild(p),n.scrollTop=n.scrollHeight,t.value="",o.disabled=!0,d.style.display="none",s.style.display="block";try{const r=await(await fetch(m.requestModification,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:c.uid,projectId:y.id,modificationRequest:i})})).json();if(s.style.display="none",d.style.display="block",o.disabled=!1,r.success){const a=document.createElement("div");a.className="ai-message",a.innerHTML=`<strong>AI Assistant:</strong> Great! I've submitted your request. The AI is now processing your changes - this typically takes 1-3 minutes. I'll update this page automatically when it's complete. ${r.modificationsRemaining} free modification${r.modificationsRemaining!==1?"s":""} remaining.`,n.appendChild(a),n.scrollTop=n.scrollHeight,document.getElementById("modificationsCount").textContent=r.modificationsRemaining;let h=0;const g=18,b=y.id,P=setInterval(async()=>{h++,console.log(`🔄 Polling for modification status... (${h}/${g})`);try{const S=await(await fetch(m.userProjects(c.uid))).json();if(S.success&&S.projects){const v=S.projects.find(M=>M.id===b);if(v&&v.modifications){const M=v.modifications[v.modifications.length-1];if(M&&M.status==="completed"){clearInterval(P),console.log("✅ Modification completed!"),y=v,await k(c.uid);const f=document.createElement("div");f.className="ai-message",f.innerHTML=`<strong>AI Assistant:</strong> ✅ Your modification is complete! Your website has been updated. <a href="${v.liveUrl}" target="_blank" style="color: #6366f1; font-weight: bold;">View your updated site</a>`,n.appendChild(f),n.scrollTop=n.scrollHeight}else if(M&&M.status==="failed"){clearInterval(P),console.log("❌ Modification failed"),await k(c.uid);const f=document.createElement("div");f.className="ai-message",f.innerHTML="<strong>AI Assistant:</strong> ❌ Sorry, there was an error processing your modification. Please try again or contact support at (415) 691-7085.",n.appendChild(f),n.scrollTop=n.scrollHeight}}}}catch(w){console.error("Poll error:",w)}if(h>=g){clearInterval(P),console.log("⏱️ Polling timeout"),await k(c.uid);const w=document.createElement("div");w.className="ai-message",w.innerHTML="<strong>AI Assistant:</strong> Your modification is still processing. Please refresh the page in a few minutes to see the updated status, or check your email for confirmation.",n.appendChild(w),n.scrollTop=n.scrollHeight}},1e4);r.modificationsRemaining===0&&(closeAiModificationModal(),j("Modifications Limit Reached","You've used all 3 free modifications. Additional changes will require a small fee. Contact us at (415) 691-7085 to discuss pricing."))}else{const a=document.createElement("div");a.className="ai-message",a.innerHTML=`<strong>AI Assistant:</strong> I'm sorry, there was an error processing your request: ${r.error||"Unknown error"}. Please try again or contact support at (415) 691-7085.`,n.appendChild(a),n.scrollTop=n.scrollHeight}}catch(u){console.error("Error submitting modification:",u),s.style.display="none",d.style.display="block",o.disabled=!1;const r=document.createElement("div");r.className="ai-message",r.innerHTML="<strong>AI Assistant:</strong> I encountered a technical error. Please try again or contact support at (415) 691-7085.",n.appendChild(r),n.scrollTop=n.scrollHeight}};function j(e,t){const i=document.getElementById("responseModal"),o=document.getElementById("responseContent");o.innerHTML=`
        <h2>${e}</h2>
        <p>${t}</p>
        <button onclick="closeResponseModal()" class="btn btn-primary">Close</button>
    `,i.classList.add("show")}window.closeResponseModal=function(){document.getElementById("responseModal").classList.remove("show")};window.viewAllModifications=function(e){const t=document.getElementById("responseModal"),i=document.getElementById("responseContent");i.innerHTML=`
        <h2>📋 Complete Modification Log</h2>
        <div class="modification-log">
            ${D(e,e.length)}
        </div>
        <button onclick="closeResponseModal()" class="btn btn-primary">Close</button>
    `,t.classList.add("show")};window.openPurchaseModal=function(e){const t=document.getElementById("responseModal"),i=document.getElementById("responseContent");i.innerHTML=`
        <h2>💳 Purchase Additional Modifications</h2>
        <p>You've used all your free modifications for <strong>${e.businessName}</strong>.</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 2rem 0;">
            <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; padding: 1.5rem; text-align: center;">
                <h3 style="margin: 0 0 0.5rem 0; color: #333;">3 Modifications</h3>
                <p style="font-size: 2.5rem; font-weight: 700; color: #3b82f6; margin: 0.5rem 0;">$29</p>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">$9.67 per modification</p>
                <button onclick="purchaseModifications('${e.id}', '3-mods')" class="btn btn-primary" style="width: 100%;">
                    Buy 3 Mods
                </button>
            </div>
            
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 1.5rem; text-align: center; position: relative;">
                <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 2px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">BEST VALUE</span>
                <h3 style="margin: 0 0 0.5rem 0; color: #333;">10 Modifications</h3>
                <p style="font-size: 2.5rem; font-weight: 700; color: #3b82f6; margin: 0.5rem 0;">$69</p>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">$6.90 per modification</p>
                <button onclick="purchaseModifications('${e.id}', '10-mods')" class="btn btn-primary" style="width: 100%; background: #10b981;">
                    Buy 10 Mods
                </button>
            </div>
        </div>
        
        <p style="color: #6b7280; font-size: 0.9rem; text-align: center;">
            Need something custom? Call us at <strong>(415) 691-7085</strong>
        </p>
        <button onclick="closeResponseModal()" class="btn btn-outline" style="width: 100%; margin-top: 1rem;">Maybe Later</button>
    `,t.classList.add("show")};window.purchaseModifications=async function(e,t){console.log(`💳 Purchase request: ${t} for project ${e}`),document.getElementById("responseModal");const i=document.getElementById("responseContent");i.innerHTML=`
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Creating checkout session...</p>
        </div>
    `;try{const n=await(await fetch(m.createModificationCheckout||`${m.requestModification.replace("/request-modification","/create-modification-checkout")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:e,userId:c.uid,package:t})})).json();if(n.success&&n.sessionUrl)window.location.href=n.sessionUrl;else throw new Error(n.error||"Failed to create checkout session")}catch(o){console.error("Error creating checkout:",o),i.innerHTML=`
            <h2>❌ Error</h2>
            <p>Failed to create checkout session: ${o.message}</p>
            <p>Please call us at <strong>(415) 691-7085</strong> to complete your purchase.</p>
            <button onclick="closeResponseModal()" class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `}};window.checkConnectStatus=async function(e){try{return await(await fetch(`${m.requestModification.replace("/request-modification","/connect-status")}/${e}`)).json()}catch(t){return console.error("Error checking connect status:",t),{success:!1,connected:!1}}};window.setupPayments=async function(e){console.log("🔗 Setting up payments for project:",e);const t=document.getElementById("responseModal"),i=document.getElementById("responseContent");i.innerHTML=`
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Setting up payment account...</p>
        </div>
    `,t.classList.add("show");try{const n=await(await fetch(`${m.requestModification.replace("/request-modification","/create-connect-account")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:e,userId:c.uid})})).json();if(n.success&&n.onboardingUrl)window.location.href=n.onboardingUrl;else throw new Error(n.error||"Failed to create payment account")}catch(o){console.error("Error setting up payments:",o),i.innerHTML=`
            <h2>❌ Error</h2>
            <p>Failed to set up payments: ${o.message}</p>
            <p>Please call us at <strong>(415) 691-7085</strong> for assistance.</p>
            <button onclick="closeResponseModal()" class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `}};window.openSupportModal=function(){document.getElementById("supportModal").classList.add("show"),document.getElementById("supportSubject").value="",document.getElementById("supportMessage").value="",document.getElementById("supportForm").style.display="block",document.getElementById("supportProcessing").style.display="none"};window.closeSupportModal=function(){document.getElementById("supportModal").classList.remove("show")};window.submitSupportRequest=async function(e){e.preventDefault();const t=document.getElementById("supportSubject").value.trim(),i=document.getElementById("supportMessage").value.trim(),o=document.getElementById("supportSubmitBtn"),n=document.getElementById("supportForm"),s=document.getElementById("supportProcessing");if(!(!t||!i)){n.style.display="none",s.style.display="block",o.disabled=!0;try{const p=await(await fetch(m.supportRequest||`${m.requestModification.replace("/request-modification","/support-request")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:c.uid,userEmail:c.email,subject:t,message:i,userName:c.displayName||c.email,timestamp:new Date().toISOString()})})).json();if(s.style.display="none",p.success){const r=document.getElementById("supportModal").querySelector(".modal-box");r.innerHTML=`
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
            `}else n.style.display="block",o.disabled=!1,alert("Error sending message: "+(p.error||"Unknown error. Please try calling us at (415) 691-7085"))}catch(d){console.error("Error submitting support request:",d),s.style.display="none",n.style.display="block",o.disabled=!1,alert("Technical error sending message. Please call us directly at (415) 691-7085")}}};const C=m?.apiUrl||(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"?"http://localhost:8080":"https://api.alimi.ai");let l=null,$=null;x(L,async e=>{e?(l=e.uid,window.currentUserId=e.uid,console.log("🔐 DriveUI: User authenticated:",e.uid),await B()):(l=null,I({connected:!1}))});async function B(){if(!l){console.log("⚠️ DriveUI: No user ID, skipping status check"),I({connected:!1});return}try{console.log("🔍 Checking Drive status for user:",l);const t=await(await fetch(`${C}/api/drive/status?userId=${l}`)).json();console.log("📡 Drive status response:",t),t.success?I(t):I({connected:!1})}catch(e){console.error("Error checking Drive status:",e),I({connected:!1,error:e.message})}}function I(e){const t=document.getElementById("driveSection");if(!t){console.warn("⚠️ DriveUI: #driveSection element not found");return}e.connected?t.innerHTML=`
            <div class="drive-connected">
                <div class="drive-header">
                    <span class="drive-icon">✅</span>
                    <h4>Google Drive Connected</h4>
                </div>
                <div class="drive-info">
                    <p><strong>Account:</strong> ${e.email||"Connected"}</p>
                    <div class="storage-bar-container">
                        <div class="storage-bar">
                            <div class="storage-used" style="width: ${e.storage?.percentUsed||0}%"></div>
                        </div>
                        <p class="storage-text">
                            ${e.storage?.usedGB||"0"} GB / ${e.storage?.totalGB||"15"} GB used
                        </p>
                    </div>
                    ${e.folderLink?`
                        <a href="${e.folderLink}" target="_blank" class="btn btn-sm btn-outline" style="margin-top: 0.75rem; font-size: 0.85rem;">
                            📁 Open in Drive
                        </a>
                    `:""}
                </div>
                <button onclick="window.disconnectDrive()" class="btn-disconnect">
                    Disconnect
                </button>
            </div>
        `:t.innerHTML=`
            <div class="drive-not-connected">
                <div class="drive-promo">
                    <p style="margin-bottom: 1rem; color: #4b5563;">
                        Store product images in <strong>your own Google Drive</strong> — no monthly storage fees!
                    </p>
                    <ul class="drive-benefits">
                        <li>✅ 15GB free storage</li>
                        <li>✅ You own your files</li>
                        <li>✅ No extra fees</li>
                    </ul>
                </div>
                <button onclick="window.connectDrive()" class="btn btn-primary btn-connect-drive">
                    🔗 Connect Google Drive
                </button>
                <p class="drive-note">
                    We only access files created for your website.
                </p>
            </div>
        `}window.connectDrive=function(){if(!l){alert("Please log in first");return}const e=$||"none";console.log("🔗 Starting Drive OAuth flow..."),console.log("   User ID:",l),console.log("   Project ID:",e),window.location.href=`${C}/auth/google/drive/connect?userId=${l}&projectId=${e}`};window.disconnectDrive=async function(){if(confirm("Are you sure you want to disconnect Google Drive? Your uploaded images will still work.")){if(!l){alert("Please log in first");return}try{const t=await(await fetch(`${C}/api/drive/disconnect`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:l})})).json();t.success?(T("Google Drive disconnected successfully","success"),await B()):alert("Error: "+t.error)}catch(e){console.error("Error disconnecting Drive:",e),alert("Failed to disconnect Google Drive")}}};window.uploadProductImage=async function(e,t,i){if(!l)throw new Error("Please log in first");if(!$)throw new Error("No project selected");const o=new FormData;o.append("image",e),o.append("userId",l),o.append("projectId",$),o.append("productId",t),o.append("productName",i);const s=await(await fetch(`${C}/api/upload-product-image`,{method:"POST",body:o})).json();if(!s.success)throw s.needsConnection?(confirm("You need to connect Google Drive to upload images. Connect now?")&&window.connectDrive(),new Error("Drive not connected")):new Error(s.error);return s};window.setCurrentProject=function(e){$=e,window.currentProjectId=e};function A(){const e=new URLSearchParams(window.location.search);if(e.get("drive_connected")==="true"&&(T("✅ Google Drive connected successfully!","success"),window.history.replaceState({},"",window.location.pathname)),e.get("drive_error")){const t=e.get("drive_error");T("❌ Drive connection failed: "+decodeURIComponent(t),"error"),window.history.replaceState({},"",window.location.pathname)}}function T(e,t="info"){const i=document.querySelector(".drive-notification");i&&i.remove();const o=document.createElement("div");o.className=`drive-notification notification-${t}`,o.textContent=e,o.style.cssText=`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        background: ${t==="success"?"#10b981":t==="error"?"#ef4444":"#3b82f6"};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `,document.body.appendChild(o),setTimeout(()=>{o.style.animation="slideOut 0.3s ease-in",setTimeout(()=>o.remove(),300)},4e3)}const N=document.createElement("style");N.textContent=`
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .drive-connected, .drive-not-connected {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        border: 1px solid #e5e7eb;
    }
    
    .drive-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .drive-icon {
        font-size: 1.25rem;
    }
    
    .drive-header h4 {
        margin: 0;
        color: #1f2937;
        font-size: 1rem;
    }
    
    .drive-info p {
        margin: 0.5rem 0;
        font-size: 0.9rem;
        color: #4b5563;
    }
    
    .drive-benefits {
        list-style: none;
        padding: 0;
        margin: 0.75rem 0;
    }
    
    .drive-benefits li {
        padding: 0.35rem 0;
        color: #4b5563;
        font-size: 0.9rem;
    }
    
    .storage-bar-container {
        margin: 0.75rem 0;
    }
    
    .storage-bar {
        background: #e5e7eb;
        border-radius: 9999px;
        height: 8px;
        overflow: hidden;
    }
    
    .storage-used {
        background: linear-gradient(90deg, #10b981, #059669);
        height: 100%;
        border-radius: 9999px;
        transition: width 0.3s ease;
    }
    
    .storage-text {
        font-size: 0.8rem !important;
        color: #6b7280 !important;
        margin-top: 0.35rem !important;
    }
    
    .btn-connect-drive {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        margin-top: 0.5rem;
    }
    
    .btn-disconnect {
        background: #fee2e2;
        color: #dc2626;
        border: none;
        padding: 0.4rem 0.75rem;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 0.75rem;
        font-size: 0.8rem;
        width: 100%;
    }
    
    .btn-disconnect:hover {
        background: #fecaca;
    }
    
    .drive-note {
        font-size: 0.75rem !important;
        color: #9ca3af !important;
        margin-top: 0.75rem !important;
        text-align: center;
    }
    
    .btn-sm {
        padding: 0.4rem 0.75rem !important;
        font-size: 0.85rem !important;
    }
`;document.head.appendChild(N);document.addEventListener("DOMContentLoaded",()=>{console.log("🚀 DriveUI: Initialized"),A()});window.checkDriveStatus=B;
