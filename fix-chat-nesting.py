#!/usr/bin/env python3
"""
Fixes the chat panel's nesting.

The original markup had an unbalanced closing tag around the domain status
section — `projects-column` was closed early and an extra `</div>` left the
domain block, and then the chat panel, inside a container that was never meant
to hold them. The result was a grid with one child, so the second column had
nothing to put in it and the panel dropped below.

Rewrites the whole grid region so the two children of .dashboard-grid are
exactly: the projects column (with domain status inside it) and the chat panel.

Run from the frontend repo root:  python3 fix-chat-nesting.py
"""

import os, re

P = 'frontend/pages/dashboard.html'
assert os.path.exists(P), 'dashboard.html not found'
src = open(P).read()

start = src.index('        <div class="dashboard-grid">')
end = src.index('        <!-- AI Modification Modal -->')
region = src[start:end]

assert 'chat-panel' in region, 'chat panel not in the region'
assert 'projects-column' in region, 'projects column not in the region'

# Pull the panel out intact rather than rebuilding it
aside_start = region.index('            <aside class="chat-panel"')
aside_end = region.index('</aside>') + len('</aside>')
aside = region[aside_start:aside_end]

NEW_REGION = '''        <div class="dashboard-grid">
            <!-- Left: projects, and the domain status that belongs with them -->
            <div class="projects-column">
                <div id="projectsContainer" class="projects-grid">
                    <div class="loading-state">
                        <div class="spinner"></div>
                        Loading your projects...
                    </div>
                </div>

                <div id="domainStatusSection" class="domain-status-section" style="display: none;">
                    <div class="section-header">
                        <h3>🌐 Domain Status</h3>
                    </div>
                    <div id="domainStatusContent">
                        <!-- Content loaded dynamically -->
                    </div>
                </div>
            </div>

            <!-- Right: the assistant. Permanent rather than a modal — the
                 interaction is a conversation and should look like one. -->
''' + aside + '''
        </div>

'''

src = src[:start] + NEW_REGION + src[end:]
open(P, 'w').write(src)

# Sanity: the grid should now have exactly two element children
after = src[src.index('<div class="dashboard-grid">'):src.index('<!-- AI Modification Modal -->')]
print('projects-column:', after.count('projects-column'))
print('chat-panel     :', after.count('class="chat-panel"'))
print('domain section :', after.count('domainStatusSection'))
