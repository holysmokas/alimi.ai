import{o as P,a as k,E as u}from"./config-rohuKh2q.js";/* empty css              */let c=null,f=null;P(k,async e=>{e?(c=e,await v(e.uid)):window.location.href="./login.html"});window.auth=k;const I=new URLSearchParams(window.location.search);if(I.get("connect_success")==="true"){const e=I.get("project_id");console.log("✅ Connect onboarding completed for project:",e),setTimeout(()=>{C("🎉 Payment Setup Complete!","Your shop can now accept payments from customers."),window.history.replaceState({},document.title,window.location.pathname)},500)}if(I.get("connect_refresh")==="true"){const e=I.get("project_id");console.log("🔄 Connect onboarding needs refresh for project:",e),setTimeout(()=>{e&&typeof setupPayments=="function"&&setupPayments(e)},1e3)}function S(e,s=3){return!e||e.length===0?'<p class="no-modifications">No modifications yet</p>':e.slice(0,s).map((o,t)=>{const n=t+1,l=o.status==="completed"?"completed":o.status==="pending"?"pending":"failed",d=o.userEmail||o.userName||"User",p=o.timestamp?new Date(o.timestamp).toLocaleString():"Unknown date";return`
            <div class="log-entry">
                <div class="log-header">
                    <span class="log-number">#${n}</span>
                    <span class="log-status ${l}">${o.status||"completed"}</span>
                    <span class="log-date">${p}</span>
                </div>
                <p class="log-prompt"><strong>Request:</strong> ${o.request||"No description"}</p>
                <p class="log-user">👤 Requested by: ${d}</p>
            </div>
        `}).join("")}async function v(e){try{const i=await(await fetch(u.userProjects(e))).json(),o=document.getElementById("projectsContainer");if(i.success&&i.projects.length>0){const t=await Promise.all(i.projects.map(async n=>{const l=n.modificationsUsed||0,d=n.modificationsLimit||3,p=d-l,a=p>0,r=n.modifications||[],y=n.packageType&&(n.packageType.toLowerCase().includes("smallshop")||n.packageType.toLowerCase().includes("small shop"));let m=null;y&&(m=await checkConnectStatus(n.id));let h="";return y&&(m&&m.connected&&m.status==="active"?h=`
                            <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0; color: #155724;">
                                    <strong>✅ Payments Active</strong> - Your shop can accept payments
                                </p>
                            </div>
                        `:m&&m.connected&&m.status==="pending"?h=`
                            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                                <p style="margin: 0 0 0.5rem 0; color: #856404;">
                                    <strong>⏳ Payment Setup Incomplete</strong>
                                </p>
                                <button onclick="setupPayments('${n.id}')" class="btn btn-purchase" style="margin-top: 0.5rem;">
                                    Complete Payment Setup
                                </button>
                            </div>
                        `:h=`
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
                            <span class="${p>0?"text-success":"text-warning"}">
                                ${l}/${d} used
                            </span>
                            ${p===0?'<span class="badge-limit">Limit Reached</span>':""}
                        </p>
                    </div>

                    ${h}

                    ${r.length>0?`
                    <div class="modification-log">
                        <h4>📋 Modification Log</h4>
                        ${S(r,3)}
                        ${r.length>3?`
                            <button onclick='viewAllModifications(${JSON.stringify(r).replace(/'/g,"&#39;")})' class="view-all-btn">
                                View all ${r.length} modifications
                            </button>
                        `:""}
                    </div>
                    `:'<p class="no-modifications">No modifications yet</p>'}

                    <div class="project-btn-group">
                        <a href="${n.liveUrl}" target="_blank" class="btn btn-view">🌐 View Live Site</a>
                        
                        ${a?`
                            <button 
                                onclick='openAiModificationModal(${JSON.stringify(n).replace(/'/g,"&#39;")})' 
                                class="btn btn-modify">
                                🤖 Request Modification (${p} free left)
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
                `}));o.innerHTML=t.join("")}else o.innerHTML=`
                <div class="empty-state">
                    <h3>No projects yet</h3>
                    <p>Your projects will appear here once they're created.</p>
                    <a href="./build.html" class="btn btn-primary">Start a New Project</a>
                </div>
            `}catch(s){console.error("Error loading projects:",s),document.getElementById("projectsContainer").innerHTML=`
            <div class="empty-state">
                <h3>Error loading projects</h3>
                <p>Please try refreshing the page.</p>
            </div>
        `}}window.openAiModificationModal=function(e){f=e;const s=(e.modificationsLimit||3)-(e.modificationsUsed||0);document.getElementById("modificationsCount").textContent=s,document.getElementById("aiModificationModal").classList.add("show"),document.getElementById("aiModificationInput").value="",document.getElementById("aiChatMessages").innerHTML=`
        <div class="ai-message">
            <strong>AI Assistant:</strong> Hi! I can help you modify "${e.businessName}". You have ${s} free modification${s!==1?"s":""} remaining. What would you like to change?
        </div>
    `};window.closeAiModificationModal=function(){document.getElementById("aiModificationModal").classList.remove("show"),f=null};window.submitAiModification=async function(e){e.preventDefault();const s=document.getElementById("aiModificationInput"),i=s.value.trim(),o=document.getElementById("aiSubmitBtn"),t=document.getElementById("aiChatMessages"),n=document.getElementById("aiProcessingMessage"),l=document.getElementById("aiModificationForm");if(console.log("🔍 DEBUG: submitAiModification called"),console.log("🔍 currentUser:",c),console.log("🔍 currentProject:",f),console.log("🔍 request:",i),console.log("🔍 ENDPOINTS:",u),!i||!f)return;const d=document.createElement("div");d.className="user-message",d.innerHTML=`<strong>You:</strong> ${i}`,t.appendChild(d),t.scrollTop=t.scrollHeight,s.value="",o.disabled=!0,l.style.display="none",n.style.display="block";try{const a=await(await fetch(u.requestModification,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:c.uid,projectId:f.id,modificationRequest:i})})).json();if(n.style.display="none",l.style.display="block",o.disabled=!1,a.success){const r=document.createElement("div");r.className="ai-message",r.innerHTML=`<strong>AI Assistant:</strong> Great! I've submitted your request. The AI is now processing your changes - this typically takes 1-3 minutes. I'll update this page automatically when it's complete. ${a.modificationsRemaining} free modification${a.modificationsRemaining!==1?"s":""} remaining.`,t.appendChild(r),t.scrollTop=t.scrollHeight,document.getElementById("modificationsCount").textContent=a.modificationsRemaining;let y=0;const m=18,h=f.id,E=setInterval(async()=>{y++,console.log(`🔄 Polling for modification status... (${y}/${m})`);try{const $=await(await fetch(u.userProjects(c.uid))).json();if($.success&&$.projects){const w=$.projects.find(M=>M.id===h);if(w&&w.modifications){const M=w.modifications[w.modifications.length-1];if(M&&M.status==="completed"){clearInterval(E),console.log("✅ Modification completed!"),f=w,await v(c.uid);const g=document.createElement("div");g.className="ai-message",g.innerHTML=`<strong>AI Assistant:</strong> ✅ Your modification is complete! Your website has been updated. <a href="${w.liveUrl}" target="_blank" style="color: #6366f1; font-weight: bold;">View your updated site</a>`,t.appendChild(g),t.scrollTop=t.scrollHeight}else if(M&&M.status==="failed"){clearInterval(E),console.log("❌ Modification failed"),await v(c.uid);const g=document.createElement("div");g.className="ai-message",g.innerHTML="<strong>AI Assistant:</strong> ❌ Sorry, there was an error processing your modification. Please try again or contact support at (415) 691-7085.",t.appendChild(g),t.scrollTop=t.scrollHeight}}}}catch(b){console.error("Poll error:",b)}if(y>=m){clearInterval(E),console.log("⏱️ Polling timeout"),await v(c.uid);const b=document.createElement("div");b.className="ai-message",b.innerHTML="<strong>AI Assistant:</strong> Your modification is still processing. Please refresh the page in a few minutes to see the updated status, or check your email for confirmation.",t.appendChild(b),t.scrollTop=t.scrollHeight}},1e4);a.modificationsRemaining===0&&(closeAiModificationModal(),C("Modifications Limit Reached","You've used all 3 free modifications. Additional changes will require a small fee. Contact us at (415) 691-7085 to discuss pricing."))}else{const r=document.createElement("div");r.className="ai-message",r.innerHTML=`<strong>AI Assistant:</strong> I'm sorry, there was an error processing your request: ${a.error||"Unknown error"}. Please try again or contact support at (415) 691-7085.`,t.appendChild(r),t.scrollTop=t.scrollHeight}}catch(p){console.error("Error submitting modification:",p),n.style.display="none",l.style.display="block",o.disabled=!1;const a=document.createElement("div");a.className="ai-message",a.innerHTML="<strong>AI Assistant:</strong> I encountered a technical error. Please try again or contact support at (415) 691-7085.",t.appendChild(a),t.scrollTop=t.scrollHeight}};function C(e,s){const i=document.getElementById("responseModal"),o=document.getElementById("responseContent");o.innerHTML=`
        <h2>${e}</h2>
        <p>${s}</p>
        <button onclick="closeResponseModal()" class="btn btn-primary">Close</button>
    `,i.classList.add("show")}window.closeResponseModal=function(){document.getElementById("responseModal").classList.remove("show")};window.viewAllModifications=function(e){const s=document.getElementById("responseModal"),i=document.getElementById("responseContent");i.innerHTML=`
        <h2>📋 Complete Modification Log</h2>
        <div class="modification-log">
            ${S(e,e.length)}
        </div>
        <button onclick="closeResponseModal()" class="btn btn-primary">Close</button>
    `,s.classList.add("show")};window.openPurchaseModal=function(e){const s=document.getElementById("responseModal"),i=document.getElementById("responseContent");i.innerHTML=`
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
    `,s.classList.add("show")};window.purchaseModifications=async function(e,s){console.log(`💳 Purchase request: ${s} for project ${e}`),document.getElementById("responseModal");const i=document.getElementById("responseContent");i.innerHTML=`
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Creating checkout session...</p>
        </div>
    `;try{const t=await(await fetch(u.createModificationCheckout||`${u.requestModification.replace("/request-modification","/create-modification-checkout")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:e,userId:c.uid,package:s})})).json();if(t.success&&t.sessionUrl)window.location.href=t.sessionUrl;else throw new Error(t.error||"Failed to create checkout session")}catch(o){console.error("Error creating checkout:",o),i.innerHTML=`
            <h2>❌ Error</h2>
            <p>Failed to create checkout session: ${o.message}</p>
            <p>Please call us at <strong>(415) 691-7085</strong> to complete your purchase.</p>
            <button onclick="closeResponseModal()" class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `}};window.checkConnectStatus=async function(e){try{return await(await fetch(`${u.requestModification.replace("/request-modification","/connect-status")}/${e}`)).json()}catch(s){return console.error("Error checking connect status:",s),{success:!1,connected:!1}}};window.setupPayments=async function(e){console.log("🔗 Setting up payments for project:",e);const s=document.getElementById("responseModal"),i=document.getElementById("responseContent");i.innerHTML=`
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Setting up payment account...</p>
        </div>
    `,s.classList.add("show");try{const t=await(await fetch(`${u.requestModification.replace("/request-modification","/create-connect-account")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:e,userId:c.uid})})).json();if(t.success&&t.onboardingUrl)window.location.href=t.onboardingUrl;else throw new Error(t.error||"Failed to create payment account")}catch(o){console.error("Error setting up payments:",o),i.innerHTML=`
            <h2>❌ Error</h2>
            <p>Failed to set up payments: ${o.message}</p>
            <p>Please call us at <strong>(415) 691-7085</strong> for assistance.</p>
            <button onclick="closeResponseModal()" class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `}};window.openSupportModal=function(){document.getElementById("supportModal").classList.add("show"),document.getElementById("supportSubject").value="",document.getElementById("supportMessage").value="",document.getElementById("supportForm").style.display="block",document.getElementById("supportProcessing").style.display="none"};window.closeSupportModal=function(){document.getElementById("supportModal").classList.remove("show")};window.submitSupportRequest=async function(e){e.preventDefault();const s=document.getElementById("supportSubject").value.trim(),i=document.getElementById("supportMessage").value.trim(),o=document.getElementById("supportSubmitBtn"),t=document.getElementById("supportForm"),n=document.getElementById("supportProcessing");if(!(!s||!i)){t.style.display="none",n.style.display="block",o.disabled=!0;try{const d=await(await fetch(u.supportRequest||`${u.requestModification.replace("/request-modification","/support-request")}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:c.uid,userEmail:c.email,subject:s,message:i,userName:c.displayName||c.email,timestamp:new Date().toISOString()})})).json();if(n.style.display="none",d.success){const a=document.getElementById("supportModal").querySelector(".modal-box");a.innerHTML=`
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
            `}else t.style.display="block",o.disabled=!1,alert("Error sending message: "+(d.error||"Unknown error. Please try calling us at (415) 691-7085"))}catch(l){console.error("Error submitting support request:",l),n.style.display="none",t.style.display="block",o.disabled=!1,alert("Technical error sending message. Please call us directly at (415) 691-7085")}}};
