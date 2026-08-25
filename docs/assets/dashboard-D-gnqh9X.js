import{o as k,a as C,E as p,A as T}from"./config-BzkwUBL6.js";/* empty css              */let d=null,g=null;k(C,async t=>{t?(d=t,await I(t.uid)):window.location.href="./login.html"});window.auth=C;const $=new URLSearchParams(window.location.search);if($.get("connect_success")==="true"){const t=$.get("project_id");console.log("✅ Connect onboarding completed for project:",t),setTimeout(()=>{S("🎉 Payment Setup Complete!","Your shop can now accept payments from customers."),window.history.replaceState({},document.title,window.location.pathname)},500)}if($.get("connect_refresh")==="true"){const t=$.get("project_id");console.log("🔄 Connect onboarding needs refresh for project:",t),setTimeout(()=>{t&&typeof setupPayments=="function"&&setupPayments(t)},1e3)}function B(t,o=3){return!t||t.length===0?'<p class="no-modifications">No modifications yet</p>':t.slice(0,o).map((s,a)=>{const n=a+1,r=s.status==="completed"?"completed":s.status==="pending"?"pending":"failed",i=s.userEmail||s.userName||"User",c=s.timestamp?new Date(s.timestamp).toLocaleString():"Unknown date";return`
            <div class="log-entry">
                <div class="log-header">
                    <span class="log-number">#${n}</span>
                    <span class="log-status ${r}">${s.status||"completed"}</span>
                    <span class="log-date">${c}</span>
                </div>
                <p class="log-prompt"><strong>Request:</strong> ${s.request||"No description"}</p>
                <p class="log-user">👤 Requested by: ${i}</p>
            </div>
        `}).join("")}async function I(t){try{const e=await(await fetch(p.userProjects(t))).json(),s=document.getElementById("projectsContainer");if(e.success&&e.projects.length>0){const a=await Promise.all(e.projects.map(async n=>{const r=n.modificationsUsed||0,i=n.modificationsLimit||3,c=i-r,m=c>0,y=n.modifications||[],h=n.packageType&&(n.packageType.toLowerCase().includes("smallshop")||n.packageType.toLowerCase().includes("small shop"));let l=null;h&&(l=await checkConnectStatus(n.id));let u="";return h&&(l&&l.connected&&l.status==="active"?u=`
                            <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0; color: #155724;">
                                    <strong>✅ Payments Active</strong> - Your shop can accept payments
                                </p>
                            </div>
                        `:l&&l.connected&&l.status==="pending"?u=`
                            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0 0 0.5rem 0; color: #856404;">
                                    <strong>⏳ Payment Setup Incomplete</strong>
                                </p>
                                <button onclick="setupPayments('${n.id}')" class="btn btn-purchase" style="margin-top: 0.5rem;">
                                    Complete Payment Setup
                                </button>
                            </div>
                        `:u=`
                            <div style="background: #e7f3ff; border: 1px solid #007bff; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0 0 0.5rem 0; color: #004085;">
                                    <strong>💳 Accept Payments from Customers</strong>
                                </p>
                                <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
                                    Set up Stripe to receive payments directly to your bank account.
                                </p>
                                <button onclick="setupPayments('${n.id}')" class="btn btn-primary" style="margin-top: 0.5rem;">
                                    🔗 Setup Payments
                                </button>
                            </div>
                        `),`
                <div class="project-card">
                    <h3>${n.businessName}</h3>
                    <div class="project-info">
                        <p><strong>Status:</strong> <span class="project-status status-${n.status}">${n.status}</span></p>
                        <p><strong>Package:</strong> ${n.packageType}</p>
                        <p><strong>Created:</strong> ${new Date(n.createdAt.seconds*1e3).toLocaleDateString()}</p>
                        <p><strong>Modifications:</strong> 
                            <span class="${c>0?"text-success":"text-warning"}">
                                ${r}/${i} used
                            </span>
                            ${c===0?'<span class="badge-limit">Limit Reached</span>':""}
                        </p>
                    </div>

                    ${u}

                    ${y.length>0?`
                    <div class="modification-log">
                        <h4>📋 Modification Log</h4>
                        ${B(y,3)}
                        ${y.length>3?`
                            <button onclick='viewAllModifications(${JSON.stringify(y).replace(/'/g,"&#39;")})' class="view-all-btn">
                                View all ${y.length} modifications
                            </button>
                        `:""}
                    </div>
                    `:'<p class="no-modifications">No modifications yet</p>'}

                    <div class="project-btn-group">
                        <a href="${n.liveUrl}" target="_blank" class="btn btn-view">🌐 View Live Site</a>
                        
                        ${m?`
                            <button 
                                onclick='openAiModificationModal(${JSON.stringify(n).replace(/'/g,"&#39;")})' 
                                class="btn btn-modify">
                                🤖 Request Modification (${c} free left)
                            </button>
                        `:`
                            <button 
                                onclick='openPurchaseModal(${JSON.stringify(n).replace(/'/g,"&#39;")})' 
                                class="btn btn-purchase">
                                💳 Purchase More Modifications
                            </button>
                        `}
                    </div>
                </div>
                `}));s.innerHTML=a.join("")}else s.innerHTML=`
                <div class="empty-state">
                    <h3>No projects yet</h3>
                    <p>Your projects will appear here once they're created.</p>
                    <a href="./build.html" class="btn btn-primary">Start a New Project</a>
                </div>
            `}catch(o){console.error("Error loading projects:",o),document.getElementById("projectsContainer").innerHTML=`
            <div class="empty-state">
                <h3>Error loading projects</h3>
                <p>Please try refreshing the page.</p>
            </div>
        `}}let M=[];window.openAiModificationModal=function(t){g=t,M=[];const o=(t.modificationsLimit||3)-(t.modificationsUsed||0);document.getElementById("modificationsCount").textContent=o,document.getElementById("aiModificationModal").classList.add("show"),document.getElementById("aiModificationInput").value="",document.getElementById("aiChatMessages").innerHTML=`
        <div class="ai-message">
            <strong>AI Assistant:</strong> Hi! I can help you change "${t.businessName}".
            Tell me what you'd like and I'll confirm exactly what I'd do before anything happens —
            talking costs nothing. You have ${o} change${o!==1?"s":""} remaining.
        </div>
    `};window.closeAiModificationModal=function(){document.getElementById("aiModificationModal").classList.remove("show"),g=null};window.submitAiModification=async function(t){t.preventDefault();const o=document.getElementById("aiModificationInput"),e=o.value.trim(),s=document.getElementById("aiSubmitBtn"),a=document.getElementById("aiChatMessages");if(document.getElementById("aiProcessingMessage"),document.getElementById("aiModificationForm"),console.log("🔍 DEBUG: submitAiModification called"),console.log("🔍 currentUser:",d),console.log("🔍 currentProject:",g),console.log("🔍 request:",e),console.log("🔍 ENDPOINTS:",p),!e||!g)return;const n=document.createElement("div");n.className="user-message",n.innerHTML=`<strong>You:</strong> ${E(e)}`,a.appendChild(n),a.scrollTop=a.scrollHeight,o.value="",s.disabled=!0;try{const i=await(await fetch(`${T}/clarify-modification`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:g.id,userId:d.uid,message:e,conversation:M})})).json();if(s.disabled=!1,M.push({role:"user",content:e}),i.status==="question"){v(i.question),M.push({role:"assistant",content:i.question});return}if(i.status==="cannot"){v(`${i.reason}<br><br><em>Nothing has been charged.</em>`),M.push({role:"assistant",content:i.reason});return}if(i.status==="ready"){const c=(i.files||[]).join(", "),m=`confirm-${Date.now()}`;v(`${E(i.summary)}`+(c?`<br><span style="opacity:.6;font-size:.85em">Files: ${E(c)}</span>`:"")+`<br><br><button id="${m}" class="btn btn-primary" style="margin-top:.5rem">Make this change</button><span style="opacity:.6;font-size:.85em;margin-left:.75rem">Uses one of your changes</span>`),M.push({role:"assistant",content:i.summary}),document.getElementById(m).onclick=()=>{document.getElementById(m).disabled=!0,document.getElementById(m).textContent="Starting…",P(i.summary)};return}v("I didn't quite follow that. Could you put it another way?");return}catch(r){console.error("Clarify failed:",r),s.disabled=!1,v("I could not reach the server just then. Please try again.");return}};function E(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function v(t){const o=document.getElementById("aiChatMessages"),e=document.createElement("div");e.className="ai-message",e.innerHTML=`<strong>AI Assistant:</strong> ${t}`,o.appendChild(e),o.scrollTop=o.scrollHeight}async function P(t){const o=document.getElementById("aiSubmitBtn"),e=document.getElementById("aiChatMessages"),s=document.getElementById("aiProcessingMessage"),a=document.getElementById("aiModificationForm");o.disabled=!0,a.style.display="none",s.style.display="block";try{const r=await(await fetch(p.requestModification,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:d.uid,projectId:g.id,modificationRequest:t})})).json();if(s.style.display="none",a.style.display="block",o.disabled=!1,r.success){const i=document.createElement("div");i.className="ai-message",i.innerHTML=`<strong>AI Assistant:</strong> Great! I've submitted your request. The AI is now processing your changes - this typically takes 1-3 minutes. I'll update this page automatically when it's complete. ${r.modificationsRemaining} free modification${r.modificationsRemaining!==1?"s":""} remaining.`,e.appendChild(i),e.scrollTop=e.scrollHeight,document.getElementById("modificationsCount").textContent=r.modificationsRemaining;let c=0;const m=18,y=g.id,h=setInterval(async()=>{c++,console.log(`🔄 Polling for modification status... (${c}/${m})`);try{const u=await(await fetch(p.userProjects(d.uid))).json();if(u.success&&u.projects){const b=u.projects.find(w=>w.id===y);if(b&&b.modifications){const w=b.modifications[b.modifications.length-1];if(w&&w.status==="completed"){clearInterval(h),console.log("✅ Modification completed!"),g=b,await I(d.uid);const f=document.createElement("div");f.className="ai-message",f.innerHTML=`<strong>AI Assistant:</strong> ✅ Your modification is complete! Your website has been updated. <a href="${b.liveUrl}" target="_blank" style="color: #6366f1; font-weight: bold;">View your updated site</a>`,e.appendChild(f),e.scrollTop=e.scrollHeight}else if(w&&w.status==="failed"){clearInterval(h),console.log("❌ Modification failed"),await I(d.uid);const f=document.createElement("div");f.className="ai-message",f.innerHTML="<strong>AI Assistant:</strong> ❌ That change didn't go through, and your credit has been returned — you haven't been charged. Try rewording it, or call (415) 691-7085 and we'll do it by hand.",e.appendChild(f),e.scrollTop=e.scrollHeight}}}}catch(l){console.error("Poll error:",l)}if(c>=m){clearInterval(h),console.log("⏱️ Polling timeout"),await I(d.uid);const l=document.createElement("div");l.className="ai-message",l.innerHTML="<strong>AI Assistant:</strong> Your modification is still processing. Please refresh the page in a few minutes to see the updated status, or check your email for confirmation.",e.appendChild(l),e.scrollTop=e.scrollHeight}},1e4);r.modificationsRemaining===0&&(closeAiModificationModal(),S("Modifications Limit Reached","You've used all 3 free modifications. Additional changes will require a small fee. Contact us at (415) 691-7085 to discuss pricing."))}else{const i=document.createElement("div");i.className="ai-message",i.innerHTML=`<strong>AI Assistant:</strong> ${E(r.error||"Something went wrong")}. Nothing has been charged — please try again, or call (415) 691-7085.`,e.appendChild(i),e.scrollTop=e.scrollHeight}}catch(n){console.error("Error submitting modification:",n),s.style.display="none",a.style.display="block",o.disabled=!1;const r=document.createElement("div");r.className="ai-message",r.innerHTML="<strong>AI Assistant:</strong> I encountered a technical error. Please try again or contact support at (415) 691-7085.",e.appendChild(r),e.scrollTop=e.scrollHeight}}function S(t,o){const e=document.getElementById("responseModal"),s=document.getElementById("responseContent");s.innerHTML=`
        <h2>${t}</h2>
        <p>${o}</p>
        <button onclick="closeResponseModal()" class="btn btn-primary">Close</button>
    `,e.classList.add("show")}window.closeResponseModal=function(){document.getElementById("responseModal").classList.remove("show")};window.viewAllModifications=function(t){const o=document.getElementById("responseModal"),e=document.getElementById("responseContent");e.innerHTML=`
        <h2>📋 Complete Modification Log</h2>
        <div class="modification-log">
            ${B(t,t.length)}
        </div>
        <button onclick="closeResponseModal()" class="btn btn-primary">Close</button>
    `,o.classList.add("show")};window.openPurchaseModal=function(t){const o=document.getElementById("responseModal"),e=document.getElementById("responseContent");e.innerHTML=`
        <h2>💳 Purchase Additional Modifications</h2>
        <p>You've used all your free modifications for <strong>${t.businessName}</strong>.</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 2rem 0;">
            <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; padding: 1.5rem; text-align: center;">
                <h3 style="margin: 0 0 0.5rem 0; color: #333;">3 Modifications</h3>
                <p style="font-size: 2.5rem; font-weight: 700; color: #3b82f6; margin: 0.5rem 0;">$29</p>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">$9.67 per modification</p>
                <button onclick="purchaseModifications('${t.id}', '3-mods')" class="btn btn-primary" style="width: 100%;">
                    Buy 3 Mods
                </button>
            </div>
            
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 1.5rem; text-align: center; position: relative;">
                <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 2px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">BEST VALUE</span>
                <h3 style="margin: 0 0 0.5rem 0; color: #333;">10 Modifications</h3>
                <p style="font-size: 2.5rem; font-weight: 700; color: #3b82f6; margin: 0.5rem 0;">$69</p>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">$6.90 per modification</p>
                <button onclick="purchaseModifications('${t.id}', '10-mods')" class="btn btn-primary" style="width: 100%; background: #10b981;">
                    Buy 10 Mods
                </button>
            </div>
        </div>
        
        <p style="color: #6b7280; font-size: 0.9rem; text-align: center;">
            Need something custom? Call us at <strong>(415) 691-7085</strong>
        </p>
        <button onclick="closeResponseModal()" class="btn btn-outline" style="width: 100%; margin-top: 1rem;">Maybe Later</button>
    `,o.classList.add("show")};window.purchaseModifications=async function(t,o){console.log(`💳 Purchase request: ${o} for project ${t}`),document.getElementById("responseModal");const e=document.getElementById("responseContent");e.innerHTML=`
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Creating checkout session...</p>
        </div>
    `;try{const a=await(await fetch(p.createModificationCheckout||`${p.requestModification.replace("/request-modification","/create-modification-checkout")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:t,userId:d.uid,package:o})})).json();if(a.success&&a.sessionUrl)window.location.href=a.sessionUrl;else throw new Error(a.error||"Failed to create checkout session")}catch(s){console.error("Error creating checkout:",s),e.innerHTML=`
            <h2>❌ Error</h2>
            <p>Failed to create checkout session: ${s.message}</p>
            <p>Please call us at <strong>(415) 691-7085</strong> to complete your purchase.</p>
            <button onclick="closeResponseModal()" class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `}};window.checkConnectStatus=async function(t){try{return await(await fetch(`${p.requestModification.replace("/request-modification","/connect-status")}/${t}`)).json()}catch(o){return console.error("Error checking connect status:",o),{success:!1,connected:!1}}};window.setupPayments=async function(t){console.log("🔗 Setting up payments for project:",t);const o=document.getElementById("responseModal"),e=document.getElementById("responseContent");e.innerHTML=`
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Setting up payment account...</p>
        </div>
    `,o.classList.add("show");try{const a=await(await fetch(`${p.requestModification.replace("/request-modification","/create-connect-account")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:t,userId:d.uid})})).json();if(a.success&&a.onboardingUrl)window.location.href=a.onboardingUrl;else throw new Error(a.error||"Failed to create payment account")}catch(s){console.error("Error setting up payments:",s),e.innerHTML=`
            <h2>❌ Error</h2>
            <p>Failed to set up payments: ${s.message}</p>
            <p>Please call us at <strong>(415) 691-7085</strong> for assistance.</p>
            <button onclick="closeResponseModal()" class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `}};window.openSupportModal=function(){document.getElementById("supportModal").classList.add("show"),document.getElementById("supportSubject").value="",document.getElementById("supportMessage").value="",document.getElementById("supportForm").style.display="block",document.getElementById("supportProcessing").style.display="none"};window.closeSupportModal=function(){document.getElementById("supportModal").classList.remove("show")};window.submitSupportRequest=async function(t){t.preventDefault();const o=document.getElementById("supportSubject").value.trim(),e=document.getElementById("supportMessage").value.trim(),s=document.getElementById("supportSubmitBtn"),a=document.getElementById("supportForm"),n=document.getElementById("supportProcessing");if(!(!o||!e)){a.style.display="none",n.style.display="block",s.disabled=!0;try{const i=await(await fetch(p.supportRequest||`${p.requestModification.replace("/request-modification","/support-request")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:d.uid,userEmail:d.email,subject:o,message:e,userName:d.displayName||d.email,timestamp:new Date().toISOString()})})).json();if(n.style.display="none",i.success){const m=document.getElementById("supportModal").querySelector(".modal-box");m.innerHTML=`
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
            `}else a.style.display="block",s.disabled=!1,alert("Error sending message: "+(i.error||"Unknown error. Please try calling us at (415) 691-7085"))}catch(r){console.error("Error submitting support request:",r),n.style.display="none",a.style.display="block",s.disabled=!1,alert("Technical error sending message. Please call us directly at (415) 691-7085")}}};
