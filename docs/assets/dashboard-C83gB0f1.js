import{o as B,a as S,E as u,A as P}from"./config-BzkwUBL6.js";/* empty css              */let c=null;B(S,async e=>{e?(c=e,await M(e.uid)):window.location.href="./login.html"});window.auth=S;const I=new URLSearchParams(window.location.search);if(I.get("connect_success")==="true"){const e=I.get("project_id");console.log("✅ Connect onboarding completed for project:",e),setTimeout(()=>{j("🎉 Payment Setup Complete!","Your shop can now accept payments from customers."),window.history.replaceState({},document.title,window.location.pathname)},500)}if(I.get("connect_refresh")==="true"){const e=I.get("project_id");console.log("🔄 Connect onboarding needs refresh for project:",e),setTimeout(()=>{e&&typeof setupPayments=="function"&&setupPayments(e)},1e3)}function k(e,o=3){return!e||e.length===0?'<p class="no-modifications">No modifications yet</p>':e.slice(0,o).map((t,a)=>{const s=a+1,i=t.status==="completed"?"completed":t.status==="pending"?"pending":"failed",d=t.userEmail||t.userName||"User",p=t.timestamp?new Date(t.timestamp).toLocaleString():"Unknown date";return`
            <div class="log-entry">
                <div class="log-header">
                    <span class="log-number">#${s}</span>
                    <span class="log-status ${i}">${t.status||"completed"}</span>
                    <span class="log-date">${p}</span>
                </div>
                <p class="log-prompt"><strong>Request:</strong> ${t.request||"No description"}</p>
                <p class="log-user">👤 Requested by: ${d}</p>
            </div>
        `}).join("")}async function M(e){try{const n=await(await fetch(u.userProjects(e))).json(),t=document.getElementById("projectsContainer");if(n.success&&n.projects.length>0){const a=await Promise.all(n.projects.map(async s=>{const i=s.modificationsUsed||0,d=s.modificationsLimit||3,p=d-i,E=p>0,b=s.modifications||[],$=s.packageType&&(s.packageType.toLowerCase().includes("smallshop")||s.packageType.toLowerCase().includes("small shop"));let m=null;$&&(m=await checkConnectStatus(s.id));let v="";return $&&(m&&m.connected&&m.status==="active"?v=`
                            <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0; color: #155724;">
                                    <strong>✅ Payments Active</strong> - Your shop can accept payments
                                </p>
                            </div>
                        `:m&&m.connected&&m.status==="pending"?v=`
                            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0 0 0.5rem 0; color: #856404;">
                                    <strong>⏳ Payment Setup Incomplete</strong>
                                </p>
                                <button onclick="setupPayments('${s.id}')" class="btn btn-purchase" style="margin-top: 0.5rem;">
                                    Complete Payment Setup
                                </button>
                            </div>
                        `:v=`
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
                <div class="project-card" data-project-id="${s.id}">
                    <h3>${s.businessName}</h3>
                    <div class="project-info">
                        <p><strong>Status:</strong> <span class="project-status status-${s.status}">${s.status}</span></p>
                        <p><strong>Package:</strong> ${s.packageType}</p>
                        <p><strong>Created:</strong> ${new Date(s.createdAt.seconds*1e3).toLocaleDateString()}</p>
                        <p><strong>Modifications:</strong> 
                            <span class="${p>0?"text-success":"text-warning"}">
                                ${i}/${d} used
                            </span>
                            ${p===0?'<span class="badge-limit">Limit Reached</span>':""}
                        </p>
                    </div>

                    ${v}

                    ${b.length>0?`
                    <div class="modification-log">
                        <h4>📋 Modification Log</h4>
                        ${k(b,3)}
                        ${b.length>3?`
                            <button onclick='viewAllModifications(${JSON.stringify(b).replace(/'/g,"&#39;")})' class="view-all-btn">
                                View all ${b.length} modifications
                            </button>
                        `:""}
                    </div>
                    `:'<p class="no-modifications">No modifications yet</p>'}

                    <div class="project-btn-group">
                        <a href="${s.liveUrl}" target="_blank" class="btn btn-view">🌐 View Live Site</a>
                        
                        ${E?`
                            <button 
                                onclick='selectChatProject(${JSON.stringify(s).replace(/'/g,"&#39;")})' 
                                class="btn btn-modify">
                                💬 Make a change (${p} left)
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
                `}));t.innerHTML=a.join("")}else t.innerHTML=`
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
        `}}let l=null,h=[],w=!1;function g(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function C(){const e=document.getElementById("chatThread");e.scrollTop=e.scrollHeight}function r(e,o){const n=document.getElementById("chatThread"),t=document.getElementById("chatEmpty");t&&t.remove();const a=document.createElement("div");return a.className=`chat-bubble ${o}`,a.innerHTML=e,n.appendChild(a),C(),a}function f(e){const o=document.getElementById("chatTyping");if(!e){o&&o.remove();return}if(o)return;const n=document.getElementById("chatThread"),t=document.createElement("div");t.className="chat-typing",t.id="chatTyping",t.innerHTML="<span></span><span></span><span></span>",n.appendChild(t),C()}function y(e){document.getElementById("chatInput").disabled=!e,document.getElementById("chatSendBtn").disabled=!e}window.selectChatProject=function(e){const o=!l||l.id!==e.id;l=e,o&&(h=[],document.getElementById("chatThread").innerHTML=""),document.querySelectorAll(".project-card").forEach(t=>{t.classList.toggle("chat-active",t.dataset.projectId===e.id)});const n=(e.modificationsLimit||3)-(e.modificationsUsed||0);document.getElementById("chatSubject").textContent=e.businessName,document.getElementById("chatCredits").textContent=`${n} change${n!==1?"s":""} remaining`,y(n>0),o&&r(n>0?`What would you like to change about <strong>${g(e.businessName)}</strong>? I'll tell you exactly what I'd do before anything happens.`:"You've used all your changes for this site. Call <strong>(415) 691-7085</strong> and we'll sort out more.","ai"),document.getElementById("chatInput").focus()};window.sendChatMessage=async function(){if(w||!l)return;const e=document.getElementById("chatInput"),o=e.value.trim();if(o){r(g(o),"user"),e.value="",w=!0,y(!1),f(!0);try{const t=await(await fetch(`${P}/clarify-modification`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:l.id,userId:c.uid,message:o,conversation:h})})).json();if(f(!1),h.push({role:"user",content:o}),t.status==="question")r(g(t.question),"ai"),h.push({role:"assistant",content:t.question});else if(t.status==="cannot")r(`${g(t.reason)}<span class="chat-meta">Nothing has been charged.</span>`,"ai"),h.push({role:"assistant",content:t.reason});else if(t.status==="ready"){const a=(t.files||[]).join(", "),s=r(`${g(t.summary)}`+(a?`<span class="chat-meta">Files: ${g(a)}</span>`:"")+'<br><button class="chat-confirm-btn">Make this change</button><span class="chat-meta">Uses one of your changes</span>',"ai");h.push({role:"assistant",content:t.summary});const i=s.querySelector(".chat-confirm-btn");i.onclick=()=>{i.disabled=!0,i.textContent="Starting…",T(t.summary)}}else r("I didn't quite follow that — could you put it another way?","ai")}catch(n){console.error("Chat failed:",n),f(!1),r("I couldn't reach the server just then. Please try again.","ai")}finally{w=!1;const n=(l.modificationsLimit||3)-(l.modificationsUsed||0);y(n>0),document.getElementById("chatInput").focus()}}};async function T(e){w=!0,y(!1),f(!0);try{const n=await(await fetch(u.requestModification,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:c.uid,projectId:l.id,modificationRequest:e})})).json();if(f(!1),!n.success){r(`${g(n.error||"Something went wrong")}<span class="chat-meta">Nothing has been charged.</span>`,"ai");return}r(`On it — this usually takes a minute or two. I'll tell you when it's live.<span class="chat-meta">${n.modificationsRemaining} change${n.modificationsRemaining!==1?"s":""} remaining</span>`,"ai"),document.getElementById("chatCredits").textContent=`${n.modificationsRemaining} change${n.modificationsRemaining!==1?"s":""} remaining`,L()}catch(o){console.error("Apply failed:",o),f(!1),r("I could not start that change. Please try again.","ai")}finally{w=!1}}function L(){const e=l.id;let o=0;const n=setInterval(async()=>{o++;try{const a=await(await fetch(u.userProjects(c.uid))).json();if(!a.success||!a.projects)return;const s=a.projects.find(d=>d.id===e);if(!s||!s.modifications)return;const i=s.modifications[s.modifications.length-1];if(!i)return;i.status==="completed"?(clearInterval(n),l=s,await M(c.uid),r(`Done — it's live. <a href="${s.liveUrl}" target="_blank" style="color:#10b981;font-weight:600">Take a look</a><span class="chat-meta">GitHub Pages can take a couple of minutes to catch up.</span>`,"ai"),y(!0)):i.status==="failed"&&(clearInterval(n),await M(c.uid),r(`That didn't go through, and your change has been returned — you haven't been charged.<span class="chat-meta">Try wording it differently, or call (415) 691-7085.</span>`,"ai"),y(!0))}catch(t){console.error("Poll error:",t)}o>=18&&(clearInterval(n),await M(c.uid),r("Still working on it. Check your email — I'll send confirmation when it's done.","ai"),y(!0))},1e4)}document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("chatInput"),o=document.getElementById("chatSendBtn");!e||!o||(o.onclick=()=>window.sendChatMessage(),e.addEventListener("keydown",n=>{n.key==="Enter"&&!n.shiftKey&&(n.preventDefault(),window.sendChatMessage())}))});function j(e,o){const n=document.getElementById("responseModal"),t=document.getElementById("responseContent");t.innerHTML=`
        <h2>${e}</h2>
        <p>${o}</p>
        <button onclick="closeResponseModal()" class="btn btn-primary">Close</button>
    `,n.classList.add("show")}window.closeResponseModal=function(){document.getElementById("responseModal").classList.remove("show")};window.viewAllModifications=function(e){const o=document.getElementById("responseModal"),n=document.getElementById("responseContent");n.innerHTML=`
        <h2>📋 Complete Modification Log</h2>
        <div class="modification-log">
            ${k(e,e.length)}
        </div>
        <button onclick="closeResponseModal()" class="btn btn-primary">Close</button>
    `,o.classList.add("show")};window.openPurchaseModal=function(e){const o=document.getElementById("responseModal"),n=document.getElementById("responseContent");n.innerHTML=`
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
    `,o.classList.add("show")};window.purchaseModifications=async function(e,o){console.log(`💳 Purchase request: ${o} for project ${e}`),document.getElementById("responseModal");const n=document.getElementById("responseContent");n.innerHTML=`
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Creating checkout session...</p>
        </div>
    `;try{const a=await(await fetch(u.createModificationCheckout||`${u.requestModification.replace("/request-modification","/create-modification-checkout")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:e,userId:c.uid,package:o})})).json();if(a.success&&a.sessionUrl)window.location.href=a.sessionUrl;else throw new Error(a.error||"Failed to create checkout session")}catch(t){console.error("Error creating checkout:",t),n.innerHTML=`
            <h2>❌ Error</h2>
            <p>Failed to create checkout session: ${t.message}</p>
            <p>Please call us at <strong>(415) 691-7085</strong> to complete your purchase.</p>
            <button onclick="closeResponseModal()" class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `}};window.checkConnectStatus=async function(e){try{return await(await fetch(`${u.requestModification.replace("/request-modification","/connect-status")}/${e}`)).json()}catch(o){return console.error("Error checking connect status:",o),{success:!1,connected:!1}}};window.setupPayments=async function(e){console.log("🔗 Setting up payments for project:",e);const o=document.getElementById("responseModal"),n=document.getElementById("responseContent");n.innerHTML=`
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Setting up payment account...</p>
        </div>
    `,o.classList.add("show");try{const a=await(await fetch(`${u.requestModification.replace("/request-modification","/create-connect-account")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:e,userId:c.uid})})).json();if(a.success&&a.onboardingUrl)window.location.href=a.onboardingUrl;else throw new Error(a.error||"Failed to create payment account")}catch(t){console.error("Error setting up payments:",t),n.innerHTML=`
            <h2>❌ Error</h2>
            <p>Failed to set up payments: ${t.message}</p>
            <p>Please call us at <strong>(415) 691-7085</strong> for assistance.</p>
            <button onclick="closeResponseModal()" class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `}};window.openSupportModal=function(){document.getElementById("supportModal").classList.add("show"),document.getElementById("supportSubject").value="",document.getElementById("supportMessage").value="",document.getElementById("supportForm").style.display="block",document.getElementById("supportProcessing").style.display="none"};window.closeSupportModal=function(){document.getElementById("supportModal").classList.remove("show")};window.submitSupportRequest=async function(e){e.preventDefault();const o=document.getElementById("supportSubject").value.trim(),n=document.getElementById("supportMessage").value.trim(),t=document.getElementById("supportSubmitBtn"),a=document.getElementById("supportForm"),s=document.getElementById("supportProcessing");if(!(!o||!n)){a.style.display="none",s.style.display="block",t.disabled=!0;try{const d=await(await fetch(u.supportRequest||`${u.requestModification.replace("/request-modification","/support-request")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:c.uid,userEmail:c.email,subject:o,message:n,userName:c.displayName||c.email,timestamp:new Date().toISOString()})})).json();if(s.style.display="none",d.success){const E=document.getElementById("supportModal").querySelector(".modal-box");E.innerHTML=`
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
            `}else a.style.display="block",t.disabled=!1,alert("Error sending message: "+(d.error||"Unknown error. Please try calling us at (415) 691-7085"))}catch(i){console.error("Error submitting support request:",i),s.style.display="none",a.style.display="block",t.disabled=!1,alert("Technical error sending message. Please call us directly at (415) 691-7085")}}};
