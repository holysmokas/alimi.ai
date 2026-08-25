#!/usr/bin/env python3
"""
Turns the dashboard into two columns: projects on the left, a persistent chat
panel on the right.

The modification assistant was a modal — open it, type one thing, close it. That
shape says "fill in this form", not "talk to me". Everything about the
interaction was already conversational after the clarify endpoint went in; only
the surface was wrong.

Now the chat is always there. It knows which project it is talking about, and
clicking a project on the left switches it.

Below 900px the columns stack, chat underneath. No hidden drawer — if the panel
matters enough to be permanent on desktop it should be visible on mobile too.

Run from the frontend repo root:  python3 patch-chat-panel.py
"""

import os

P = 'frontend/pages/dashboard.html'
assert os.path.exists(P), 'dashboard.html not found — run from the repo root'

src = open(P).read()
original = src

# ---------------------------------------------------------------------------
# 1. Layout + panel styles
# ---------------------------------------------------------------------------

OLD_GRID = """        /* Dashboard Grid */
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
            margin: 2rem 0;
        }

        @media (max-width: 1024px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
        }"""

NEW_GRID = """        /* Dashboard Grid — projects left, chat right */
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 420px;
            gap: 2rem;
            margin: 2rem 0;
            align-items: start;
        }

        /* Stack below 900px. No drawer: if the panel is worth a permanent
           column on desktop it is worth being visible on mobile. */
        @media (max-width: 900px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
        }

        /* ── Chat panel ─────────────────────────────────────────────────── */

        .chat-panel {
            background: linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            /* Sticky so the conversation stays put while the project list
               scrolls. 7rem clears the fixed nav. */
            position: sticky;
            top: 7rem;
            height: calc(100vh - 10rem);
            min-height: 480px;
            overflow: hidden;
        }

        @media (max-width: 900px) {
            .chat-panel {
                position: static;
                height: 70vh;
            }
        }

        .chat-panel-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid rgba(16, 185, 129, 0.15);
            flex-shrink: 0;
        }

        .chat-panel-header h3 {
            color: #ffffff;
            font-size: 1.05rem;
            margin: 0 0 0.25rem 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .chat-panel-subject {
            color: #10b981;
            font-size: 0.85rem;
            font-weight: 600;
        }

        .chat-panel-credits {
            color: rgba(255, 255, 255, 0.45);
            font-size: 0.8rem;
            margin-top: 0.35rem;
        }

        .chat-thread {
            flex: 1;
            overflow-y: auto;
            padding: 1.25rem 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
        }

        .chat-thread::-webkit-scrollbar { width: 6px; }
        .chat-thread::-webkit-scrollbar-thumb {
            background: rgba(16, 185, 129, 0.25);
            border-radius: 3px;
        }

        .chat-bubble {
            padding: 0.8rem 1rem;
            border-radius: 12px;
            font-size: 0.92rem;
            line-height: 1.55;
            max-width: 92%;
        }

        .chat-bubble.ai {
            background: rgba(16, 185, 129, 0.1);
            border-left: 3px solid #10b981;
            color: rgba(255, 255, 255, 0.88);
            align-self: flex-start;
        }

        .chat-bubble.user {
            background: rgba(59, 130, 246, 0.12);
            border-left: 3px solid #3b82f6;
            color: rgba(255, 255, 255, 0.88);
            align-self: flex-end;
        }

        .chat-bubble .chat-meta {
            display: block;
            margin-top: 0.4rem;
            font-size: 0.78rem;
            opacity: 0.55;
        }

        .chat-confirm-btn {
            display: inline-block;
            margin-top: 0.75rem;
            padding: 0.6rem 1.1rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.88rem;
            cursor: pointer;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }

        .chat-confirm-btn:disabled {
            opacity: 0.5;
            cursor: default;
        }

        .chat-typing {
            align-self: flex-start;
            display: flex;
            gap: 4px;
            padding: 0.8rem 1rem;
        }

        .chat-typing span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #10b981;
            animation: chatBlink 1.2s infinite;
        }

        .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes chatBlink {
            0%, 60%, 100% { opacity: 0.25; }
            30% { opacity: 1; }
        }

        .chat-composer {
            border-top: 1px solid rgba(16, 185, 129, 0.15);
            padding: 1rem 1.25rem 1.25rem;
            flex-shrink: 0;
        }

        .chat-composer textarea {
            width: 100%;
            padding: 0.8rem 1rem;
            background: rgba(16, 185, 129, 0.05);
            border: 2px solid rgba(16, 185, 129, 0.2);
            border-radius: 10px;
            font-size: 0.92rem;
            color: #ffffff;
            resize: none;
            font-family: inherit;
            line-height: 1.5;
        }

        .chat-composer textarea::placeholder { color: rgba(255, 255, 255, 0.35); }
        .chat-composer textarea:focus {
            outline: none;
            border-color: #10b981;
        }

        .chat-composer-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 0.6rem;
            gap: 0.75rem;
        }

        .chat-hint {
            color: rgba(255, 255, 255, 0.35);
            font-size: 0.78rem;
        }

        .chat-empty {
            color: rgba(255, 255, 255, 0.4);
            font-size: 0.9rem;
            text-align: center;
            padding: 2rem 1rem;
            line-height: 1.6;
        }

        /* The selected project, so it is obvious what the chat is about */
        .project-card.chat-active {
            border-color: rgba(16, 185, 129, 0.55);
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.12);
        }"""

assert OLD_GRID in src, 'dashboard grid styles not found'
src = src.replace(OLD_GRID, NEW_GRID)

# ---------------------------------------------------------------------------
# 2. The panel markup, as a sibling of the projects column
# ---------------------------------------------------------------------------

OLD_COL = """            <div id="domainStatusSection" class="domain-status-section" style="display: none;">
                <div class="section-header">
                    <h3>🌐 Domain Status</h3>
                </div>
                <div id="domainStatusContent">
                    <!-- Content loaded dynamically -->
                </div>
                </div>
            </div>
        </div>"""

NEW_COL = """            <div id="domainStatusSection" class="domain-status-section" style="display: none;">
                <div class="section-header">
                    <h3>🌐 Domain Status</h3>
                </div>
                <div id="domainStatusContent">
                    <!-- Content loaded dynamically -->
                </div>
                </div>
            </div>

            <!-- Chat panel. Always present rather than a modal: the interaction
                 is a conversation, and a popup that closes after one message
                 does not read like one. -->
            <aside class="chat-panel" id="chatPanel">
                <div class="chat-panel-header">
                    <h3>💬 Make a change</h3>
                    <div class="chat-panel-subject" id="chatSubject">Select a project</div>
                    <div class="chat-panel-credits" id="chatCredits"></div>
                </div>

                <div class="chat-thread" id="chatThread">
                    <div class="chat-empty" id="chatEmpty">
                        Pick a project on the left and tell me what you'd like changed.<br>
                        Talking costs nothing — you only use a change when you confirm one.
                    </div>
                </div>

                <div class="chat-composer">
                    <textarea id="chatInput" rows="2"
                        placeholder="e.g. change the tagline to Crafted in Copenhagen"
                        disabled></textarea>
                    <div class="chat-composer-row">
                        <span class="chat-hint">Enter to send · Shift+Enter for a new line</span>
                        <button class="btn btn-primary" id="chatSendBtn" style="padding:.5rem 1.1rem;font-size:.88rem" disabled>Send</button>
                    </div>
                </div>
            </aside>
        </div>"""

assert OLD_COL in src, 'projects column close not found'
src = src.replace(OLD_COL, NEW_COL)

assert src != original, 'nothing changed'
open(P, 'w').write(src)
print('dashboard.html patched')
