"""
ai/prompts/mentor_chat.py — Contextual AI Mentor Guidance

Generates dynamic, conversational, and deeply contextual AI Mentor responses for learner questions.
Incorporate learner profile, completed courses, active module, and upcoming milestones.
"""

from __future__ import annotations

from typing import Any
from ai.client import ai_client

_SYSTEM_PROMPT = """You are the AI Learning Mentor for Pathwise, an intelligent personalized learning platform.

Your mission:
1. Answer the learner's specific question directly, clearly, with pedagogical clarity and motivation.
2. Ground explanations in their specific curriculum: ALWAYS reference their completed courses, active focus topic, experience level, and stated career goal.
3. If asked "Explain my current topic in simple terms" or about a specific topic, break down their ACTIVE module with an intuitive analogy, core principles, and a practical application.
4. If asked "What to do next?" or about study plans, guide them through their active module and upcoming roadmap milestones.
5. Format responses in clean Markdown (bullet points, bold key terms, mini code snippets if helpful).
"""


def answer_mentor_query(
    message: str,
    profile: dict[str, Any] | None = None,
    roadmap: dict[str, Any] | None = None,
    current_item: dict[str, Any] | None = None,
    completed_items: list[dict[str, Any]] | None = None,
    upcoming_items: list[dict[str, Any]] | None = None,
) -> str:
    """
    Generate an intelligent, contextual AI Mentor response.
    """
    completed_list = completed_items or []
    upcoming_list = upcoming_items or []

    completed_str = ", ".join([c.get("resource", {}).get("title", "Module") for c in completed_list]) or "None yet (just starting)"
    current_title = (
        current_item.get("resource", {}).get("title", "")
        if current_item
        else (upcoming_list[0].get("resource", {}).get("title", "Foundations") if upcoming_list else "Core Fundamentals")
    )
    current_desc = current_item.get("resource", {}).get("description", "") if current_item else ""
    current_level = current_item.get("resource", {}).get("level", "beginner") if current_item else "beginner"
    current_dur = current_item.get("resource", {}).get("duration_hours", 4) if current_item else 4
    current_domain = current_item.get("resource", {}).get("domain", "").replace("_", " ") if current_item else "AI & Computer Science"

    target_goal = profile.get("goal", "AI & Software Engineering") if profile else "AI Engineering"
    exp_level = profile.get("experience_level", "Intermediate") if profile else "Intermediate"
    dominant_style = profile.get("dominant_style") or profile.get("learning_style", {}).get("dominant_style", "Hands-on") if profile else "Hands-on"

    user_prompt = f"""LEARNER CURRICULUM CONTEXT:
- Stated Career Goal: {target_goal}
- Experience Level: {exp_level}
- Learning Style: {dominant_style}
- Completed Modules: {completed_str}
- Active / Current Module: {current_title} ({current_level} level, {current_dur}h in {current_domain})
  Description: "{current_desc}"
- Next Upcoming Modules: {', '.join([u.get('resource', {}).get('title', '') for u in upcoming_list[:3]]) or 'Final capstone'}

LEARNER QUESTION:
"{message}"

Provide your personalized, direct, and motivating mentor response now."""

    try:
        reply = ai_client.generate(_SYSTEM_PROMPT, user_prompt, json_mode=False)
        if reply and reply.strip():
            return reply.strip()
    except Exception as exc:
        print(f"[mentor_chat] AI generation error: {exc}. Using intelligent contextual fallback.")

    # Contextual Intelligent Fallback Engine
    lower = message.lower().strip()

    # 1. "How can I test my knowledge?" / "Quiz me" / "Self-assessment"
    if any(k in lower for k in ["test my knowledge", "quiz", "assessment", "test myself", "test me", "practice questions", "exam"]):
        return (
            f"### 🧪 Knowledge Assessment for: **{current_title}**\n\n"
            f"Here is a targeted self-test for your active milestone in **{current_domain}** ({current_level} level):\n\n"
            f"#### 1. Core Concept Check\n"
            f"- **Q1**: In the context of *{current_title}*, what is the primary role of this phase/technique, and how does it prevent downstream bugs or model failures?\n"
            f"- **Q2**: What are the trade-offs or common anti-patterns engineers encounter when implementing {current_title}?\n"
            f"- **Q3**: How does mastering this topic directly accelerate your target goal of **{target_goal}**?\n\n"
            f"#### 2. Practical Mini-Challenge\n"
            f"- **Challenge**: Open your development environment or notebook and implement a minimal working example demonstrating *{current_title}*.\n"
            f"- **Verification**: Write 2 automated unit tests or validation checks ensuring your implementation handles boundary and edge cases.\n\n"
            f"#### 3. Ready to Move Forward?\n"
            f"Once you can explain the core architecture without looking at notes, head back to your Roadmap and click **✓ Mark Complete** to advance to **{upcoming_list[0].get('resource', {}).get('title', 'the next milestone') if upcoming_list else 'your capstone'}**!"
        )

    # 2. "Explain my current topic in simple terms"
    if any(k in lower for k in ["explain my current topic", "explain current topic", "current topic", "what am i studying", "explain"]):
        if current_title:
            return (
                f"### 🎯 Active Topic: **{current_title}**\n\n"
                f"**What is it?**\n"
                f"{current_desc or f'{current_title} teaches the essential competencies you need in {current_domain}.'}\n\n"
                f"**Why it's essential for your goal ({target_goal}):**\n"
                f"- It builds on your completed foundations ({completed_str.split(',')[0] if completed_list else 'the basics'}) to deliver practical mastery.\n"
                f"- It is designed for your **{exp_level}** level with an estimated completion time of **~{current_dur} hours**.\n\n"
                f"**Recommended Study Strategy ({dominant_style} Style):**\n"
                f"Since your dominant style is **{dominant_style}**, focus on active creation: take notes in diagram format or code hands-on snippets as you study."
            )
        return (
            f"You are currently working through the foundational phase for **{target_goal}**. "
            f"Check your active module on the Roadmap and let me know if you'd like a breakdown of any specific concept!"
        )

    # 3. "Projects / What can I build?"
    if any(k in lower for k in ["project", "build", "portfolio", "application", "practical work"]):
        return (
            f"### 🛠️ Hands-on Project Ideas for **{current_title}**\n\n"
            f"To showcase competence in **{target_goal}**, consider building:\n\n"
            f"1. **Production Pipeline / MVP**:\n"
            f"   - Build an end-to-end implementation applying the principles of *{current_title}* to a real-world dataset or API.\n"
            f"2. **Interactive Showcase**:\n"
            f"   - Package your solution with a clean CLI tool or Streamlit/React interface to add directly to your GitHub portfolio.\n"
            f"3. **Milestone Deliverable**:\n"
            f"   - Write a short README with architecture diagrams and instructions on how to replicate your results."
        )

    # 4. "Interview prep / Technical questions"
    if any(k in lower for k in ["interview", "technical question", "job prep", "hiring"]):
        return (
            f"### 💼 Interview Focus: **{current_title}**\n\n"
            f"For roles in **{target_goal}**, interviewers frequently evaluate:\n\n"
            f"- **System Understanding**: Explaining the lifecycle and trade-offs of {current_title}.\n"
            f"- **Problem Solving**: How you debug, profile, and optimize when things fail in production.\n"
            f"- **Communication**: Clearly articulating *why* you chose a particular design pattern or tool.\n\n"
            f"Would you like to simulate a mock interview question on *{current_title}*?"
        )

    # 5. "What to do next? / What should I learn today?"
    if any(k in lower for k in ["what to do next", "what next", "next step", "what should i learn"]):
        return (
            f"### 📌 Your Next Priority: **{current_title}**\n\n"
            f"You have completed **{len(completed_list)}** module(s) so far ({completed_str}).\n\n"
            f"**Today's Action Steps:**\n"
            f"1. Spend 30–45 minutes focusing on **{current_title}** ({current_dur}h, {current_level} level).\n"
            f"2. Complete the hands-on exercises.\n"
            f"3. Click **✓ Mark Complete** on your Roadmap to unlock **{upcoming_list[0].get('resource', {}).get('title', 'the next milestone') if upcoming_list else 'your capstone project'}**!"
        )

    # 6. General contextual assistance
    return (
        f"I'm here as your dedicated AI Mentor for **{target_goal}** ({exp_level} level).\n\n"
        f"**Your Current Status:**\n"
        f"- Active Module: **{current_title}** ({current_domain})\n"
        f"- Completed: {len(completed_list)} module(s)\n\n"
        f"You can ask me to test your knowledge with a custom quiz, break down complex concepts in *{current_title}*, suggest portfolio projects, or guide your daily schedule. How can I assist you right now?"
    )
