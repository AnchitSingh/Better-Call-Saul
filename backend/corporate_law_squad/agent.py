"""
Better Call Saul - Multi-Agent Corporate Formation Advisory System

This module defines a coordinated multi-agent system for business entity selection
and formation strategy. The system combines tax, legal, and strategic expertise to
provide comprehensive guidance on LLC vs S-Corp vs C-Corp decisions.

Architecture:
    - Three specialist agents (Tax CPA, Corporate Attorney, Business Strategist)
    - One coordinator agent that orchestrates parallel consultation and synthesis
    - All agents powered by Gemini 2.5 Flash for fast, cost-effective inference

Usage:
    The root_agent serves as the entry point for user interactions and delegates
    to specialist sub-agents as needed.
"""

from google.adk.agents import Agent


# ============================================================================
# SPECIALIST AGENTS
# ============================================================================

# Tax CPA Agent
# Primary focus: Tax implications, deductions, and fiscal optimization
tax_agent = Agent(
    name="TaxCPA",
    model="gemini-flash-latest",
    description="Expert tax CPA specializing in corporate tax strategy",
    instruction=(
        "You are a seasoned tax CPA.\n"
        "Analyze LLC vs S-Corp vs C-Corp taxation, pass-through vs double taxation, "
        "QBI deductions, state tax implications, payroll/self-employment taxes.\n"
        "Provide concrete tax impacts and clear trade-offs."
    ),
)


# Corporate Attorney Agent
# Primary focus: Legal compliance, liability protection, and regulatory requirements
legal_agent = Agent(
    name="CorporateAttorney",
    model="gemini-flash-latest",
    description="Corporate attorney specializing in business formation and compliance",
    instruction=(
        "You are a corporate attorney.\n"
        "Assess liability protection, ownership flexibility, operating agreements, "
        "annual compliance, state registration, and funding implications.\n"
        "Highlight legal risks and protection mechanisms."
    ),
)


# Business Strategist Agent
# Primary focus: Growth strategy, scalability, and operational execution
strategy_agent = Agent(
    name="BusinessStrategist",
    model="gemini-flash-latest",
    description="Business consultant focused on formation strategy and growth",
    instruction=(
        "You are a business strategist.\n"
        "Consider growth trajectory (bootstrap vs VC), industry regulation, ops complexity, "
        "state selection (Delaware vs home), employee equity/ESOPs, and exit paths.\n"
        "Prioritize scalability and practical execution."
    ),
)


# ============================================================================
# COORDINATOR AGENT (Entry Point)
# ============================================================================

# Root Coordinator Agent
# Orchestrates the multi-agent consultation workflow and synthesizes recommendations.
# This is the main interface that users interact with - it delegates to specialist
# agents in parallel, resolves conflicts, and produces unified recommendations.
root_agent = Agent(
    name="BetterCallSaulCoordinator",
    model="gemini-flash-latest",
    description="Lead consultant coordinating the corporate-law squad",
    instruction=(
        "You coordinate specialists to recommend the best entity and plan.\n"
        "Workflow:\n"
        "1) Clarify the user's business context\n"
        "2) Consult TaxCPA, CorporateAttorney, and BusinessStrategist (in parallel when possible)\n"
        "3) Identify conflicts (e.g., tax efficiency vs fundraising norms)\n"
        "4) Synthesize a unified plan with trade-offs and costs\n"
        "5) Present clear next steps\n\n"
        "Respond using this format:\n\n"
        "**Recommended Structure:** [Entity Type]\n\n"
        "**Key Benefits:**\n"
        "- [Benefit 1]\n- [Benefit 2]\n- [Benefit 3]\n\n"
        "**Trade-offs:**\n"
        "- [Trade-off 1]\n- [Trade-off 2]\n\n"
        "**Next Steps:**\n"
        "1) [Action 1]\n2) [Action 2]\n3) [Action 3]\n"
    ),
    sub_agents=[tax_agent, legal_agent, strategy_agent],
)
