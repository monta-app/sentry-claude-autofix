#!/usr/bin/env python3
"""Generate systems diagram for Sentry-Claude Autofix"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.lines as mlines

# Set up the figure
fig, ax = plt.subplots(1, 1, figsize=(14, 10))
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')

# Define colors
color_external = '#E3F2FD'  # Light blue
color_client = '#FFF3E0'    # Light orange
color_analyzer = '#F3E5F5'  # Light purple
color_orchestrator = '#E8F5E9'  # Light green
color_claude = '#FFF9C4'    # Light yellow
color_output = '#FFEBEE'    # Light red

# Title
ax.text(5, 9.5, 'Sentry-Claude Autofix System Architecture',
        ha='center', va='top', fontsize=18, fontweight='bold')

# 1. External Services (Top)
# Sentry.io
sentry_box = FancyBboxPatch((0.5, 7.5), 2, 1,
                            boxstyle="round,pad=0.1",
                            edgecolor='#1976D2', facecolor=color_external, linewidth=2)
ax.add_patch(sentry_box)
ax.text(1.5, 8.3, 'Sentry.io', ha='center', va='center', fontsize=11, fontweight='bold')
ax.text(1.5, 8.0, 'Error Tracking', ha='center', va='center', fontsize=9)

# Claude API
claude_api_box = FancyBboxPatch((7.5, 7.5), 2, 1,
                                boxstyle="round,pad=0.1",
                                edgecolor='#F57C00', facecolor=color_external, linewidth=2)
ax.add_patch(claude_api_box)
ax.text(8.5, 8.3, 'Claude API', ha='center', va='center', fontsize=11, fontweight='bold')
ax.text(8.5, 8.0, 'Anthropic', ha='center', va='center', fontsize=9)

# 2. Sentry Client
sentry_client = FancyBboxPatch((0.5, 6), 2, 1,
                               boxstyle="round,pad=0.1",
                               edgecolor='#E64A19', facecolor=color_client, linewidth=2)
ax.add_patch(sentry_client)
ax.text(1.5, 6.7, 'SentryClient', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(1.5, 6.4, 'Fetch Issues', ha='center', va='center', fontsize=8)
ax.text(1.5, 6.15, '& Events', ha='center', va='center', fontsize=8)

# Arrow: Sentry.io -> SentryClient
arrow1 = FancyArrowPatch((1.5, 7.5), (1.5, 7.0),
                        arrowstyle='->', mutation_scale=20, linewidth=2, color='#1976D2')
ax.add_patch(arrow1)
ax.text(1.8, 7.25, 'API', fontsize=8)

# 3. Issue Analyzer
issue_analyzer = FancyBboxPatch((3.5, 6), 2, 1,
                                boxstyle="round,pad=0.1",
                                edgecolor='#7B1FA2', facecolor=color_analyzer, linewidth=2)
ax.add_patch(issue_analyzer)
ax.text(4.5, 6.7, 'IssueAnalyzer', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(4.5, 6.4, 'Parse Stack', ha='center', va='center', fontsize=8)
ax.text(4.5, 6.15, 'Traces', ha='center', va='center', fontsize=8)

# Arrow: SentryClient -> IssueAnalyzer
arrow2 = FancyArrowPatch((2.5, 6.5), (3.5, 6.5),
                        arrowstyle='->', mutation_scale=20, linewidth=2, color='#7B1FA2')
ax.add_patch(arrow2)
ax.text(3.0, 6.7, 'Issues', fontsize=8)

# 4. Orchestrator (Center)
orchestrator = FancyBboxPatch((3.5, 4.2), 3, 1.2,
                              boxstyle="round,pad=0.1",
                              edgecolor='#388E3C', facecolor=color_orchestrator, linewidth=3)
ax.add_patch(orchestrator)
ax.text(5, 5.1, 'Orchestrator', ha='center', va='center', fontsize=12, fontweight='bold')
ax.text(5, 4.8, 'Workflow Coordinator', ha='center', va='center', fontsize=9)
ax.text(5, 4.5, '• Filter Issues  • Read Files  • Manage Flow',
        ha='center', va='center', fontsize=7)

# Arrow: IssueAnalyzer -> Orchestrator
arrow3 = FancyArrowPatch((4.5, 6.0), (4.5, 5.4),
                        arrowstyle='->', mutation_scale=20, linewidth=2, color='#388E3C')
ax.add_patch(arrow3)
ax.text(4.8, 5.7, 'Context', fontsize=8)

# 5. Local Codebase
codebase = FancyBboxPatch((0.5, 4), 2, 1,
                         boxstyle="round,pad=0.1",
                         edgecolor='#455A64', facecolor='#ECEFF1', linewidth=2)
ax.add_patch(codebase)
ax.text(1.5, 4.7, 'Local Codebase', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(1.5, 4.4, 'Source Files', ha='center', va='center', fontsize=8)

# Arrow: Orchestrator -> Codebase (read)
arrow4 = FancyArrowPatch((3.5, 4.8), (2.5, 4.5),
                        arrowstyle='<-', mutation_scale=20, linewidth=2,
                        color='#455A64', linestyle='dashed')
ax.add_patch(arrow4)
ax.text(2.8, 4.3, 'read', fontsize=8, style='italic')

# 6. Claude Agent
claude_agent = FancyBboxPatch((7.5, 4.5), 2, 1.5,
                              boxstyle="round,pad=0.1",
                              edgecolor='#F57C00', facecolor=color_claude, linewidth=2)
ax.add_patch(claude_agent)
ax.text(8.5, 5.6, 'ClaudeAgent', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(8.5, 5.3, 'Build Prompts', ha='center', va='center', fontsize=8)
ax.text(8.5, 5.05, 'Call Claude API', ha='center', va='center', fontsize=8)
ax.text(8.5, 4.8, 'Parse Response', ha='center', va='center', fontsize=8)

# Arrow: Orchestrator -> ClaudeAgent
arrow5 = FancyArrowPatch((6.5, 4.8), (7.5, 5.2),
                        arrowstyle='->', mutation_scale=20, linewidth=2, color='#F57C00')
ax.add_patch(arrow5)
ax.text(6.8, 5.2, 'Context +', fontsize=8)
ax.text(6.8, 4.95, 'Code', fontsize=8)

# Arrow: ClaudeAgent -> Claude API
arrow6 = FancyArrowPatch((8.5, 6.0), (8.5, 7.5),
                        arrowstyle='<->', mutation_scale=20, linewidth=2, color='#F57C00')
ax.add_patch(arrow6)
ax.text(8.8, 6.75, 'API', fontsize=8)

# Arrow: ClaudeAgent -> Orchestrator (response)
arrow7 = FancyArrowPatch((7.5, 4.8), (6.5, 4.8),
                        arrowstyle='->', mutation_scale=20, linewidth=2,
                        color='#F57C00', linestyle='dashed')
ax.add_patch(arrow7)
ax.text(7.0, 5.0, 'Fix', fontsize=8)
ax.text(7.0, 4.75, 'Proposal', fontsize=8)

# 7. Output Files
output_box = FancyBboxPatch((3.5, 2.5), 3, 1,
                            boxstyle="round,pad=0.1",
                            edgecolor='#C62828', facecolor=color_output, linewidth=2)
ax.add_patch(output_box)
ax.text(5, 3.2, 'Output Files', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(5, 2.9, 'JSON + Markdown Proposals', ha='center', va='center', fontsize=8)

# Arrow: Orchestrator -> Output
arrow8 = FancyArrowPatch((5, 4.2), (5, 3.5),
                        arrowstyle='->', mutation_scale=20, linewidth=2, color='#C62828')
ax.add_patch(arrow8)
ax.text(5.3, 3.85, 'Save', fontsize=8)

# 8. Sentry Comments (Optional)
comment_box = FancyBboxPatch((0.5, 2.5), 2, 1,
                            boxstyle="round,pad=0.1",
                            edgecolor='#1976D2', facecolor=color_external,
                            linewidth=2, linestyle='dashed')
ax.add_patch(comment_box)
ax.text(1.5, 3.2, 'Sentry', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(1.5, 2.9, 'Comments', ha='center', va='center', fontsize=8)
ax.text(1.5, 2.65, '(optional)', ha='center', va='center', fontsize=7, style='italic')

# Arrow: Orchestrator -> Sentry Comments
arrow9 = FancyArrowPatch((3.5, 3.5), (2.5, 3.0),
                        arrowstyle='->', mutation_scale=20, linewidth=2,
                        color='#1976D2', linestyle='dashed')
ax.add_patch(arrow9)
ax.text(2.8, 3.4, 'Post', fontsize=8)

# Arrow: Sentry Comments -> Sentry.io
arrow10 = FancyArrowPatch((1.5, 3.5), (1.5, 7.5),
                         arrowstyle='->', mutation_scale=20, linewidth=2,
                         color='#1976D2', linestyle='dashed', alpha=0.4)
ax.add_patch(arrow10)

# 9. Configuration
config_box = FancyBboxPatch((7.5, 2.5), 2, 1,
                           boxstyle="round,pad=0.1",
                           edgecolor='#616161', facecolor='#F5F5F5', linewidth=2)
ax.add_patch(config_box)
ax.text(8.5, 3.2, 'Configuration', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(8.5, 2.9, '.env File', ha='center', va='center', fontsize=8)
ax.text(8.5, 2.65, 'API Keys & Settings', ha='center', va='center', fontsize=7)

# Dotted lines from config to components
ax.plot([8.5, 1.5], [2.5, 6.0], 'k:', linewidth=1, alpha=0.3)
ax.plot([8.5, 5.0], [2.5, 4.2], 'k:', linewidth=1, alpha=0.3)
ax.plot([8.5, 8.5], [2.5, 4.5], 'k:', linewidth=1, alpha=0.3)

# Legend
legend_elements = [
    mpatches.Patch(facecolor=color_external, edgecolor='black', label='External Services'),
    mpatches.Patch(facecolor=color_client, edgecolor='black', label='API Clients'),
    mpatches.Patch(facecolor=color_analyzer, edgecolor='black', label='Analyzers'),
    mpatches.Patch(facecolor=color_orchestrator, edgecolor='black', label='Orchestration'),
    mpatches.Patch(facecolor=color_output, edgecolor='black', label='Output'),
    mlines.Line2D([], [], color='black', linestyle='--', label='Optional Flow'),
]

ax.legend(handles=legend_elements, loc='lower center', ncol=3, frameon=True, fontsize=8)

# Footer
ax.text(5, 0.5, 'Sentry-Claude Autofix • Automated Error Investigation & Fix Proposals',
        ha='center', va='center', fontsize=9, style='italic', color='#666666')

# Add data flow annotations
ax.text(5, 1.3, 'Data Flow: Sentry Issues → Analysis → Claude AI → Fix Proposals → Output',
        ha='center', va='center', fontsize=8,
        bbox=dict(boxstyle='round,pad=0.5', facecolor='#FFFFCC', edgecolor='#999999'))

plt.tight_layout()
plt.savefig('systems-diagram.png', dpi=300, bbox_inches='tight', facecolor='white')
print("✅ Systems diagram generated: systems-diagram.png")
