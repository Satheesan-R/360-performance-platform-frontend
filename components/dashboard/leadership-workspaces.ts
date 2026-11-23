export const leadershipWorkspaces = {
  department_manager: {
    base: "/manager",
    title: "Department Manager",
    description: "Coordinate department reviews, align team goals, and plan employee development.",
    initials: "DM",
    areas: {
      reviews: {
        title: "Department Reviews",
        short: "RV",
        description: "Prepare for performance reviews and track the decisions that require manager input.",
        availability: "Department review assignments and completion data will appear here when the review workflow is connected.",
        checklist: [
          { title: "Confirm the review scope", detail: "Identify the review period, eligible employees, and everyone providing input." },
          { title: "Gather performance evidence", detail: "Use agreed objectives, documented outcomes, and relevant feedback from the review period." },
          { title: "Prepare the conversation", detail: "Identify strengths, discuss gaps with concrete examples, and agree on follow-up actions." },
        ],
      },
      goals: {
        title: "Team Goals",
        short: "GL",
        description: "Turn department priorities into measurable team objectives.",
        availability: "Assigned goals and progress updates will appear here when goal tracking is connected.",
        checklist: [
          { title: "Set the outcome", detail: "Define what success looks like and how the team will measure it." },
          { title: "Assign ownership", detail: "Identify an owner, agree on a target date, and record key dependencies." },
          { title: "Review progress", detail: "Use check-ins to review evidence, resolve blockers, and update milestones." },
        ],
      },
      development: {
        title: "Development Planning",
        short: "DP",
        description: "Prepare growth conversations and agree on follow-up actions.",
        availability: "Employee development plans will appear here when the development workflow is connected.",
        checklist: [
          { title: "Agree on a growth priority", detail: "Discuss the employee's career goals and choose a skill or responsibility to develop." },
          { title: "Choose a practical opportunity", detail: "Agree on a project, mentoring relationship, or training opportunity with a measurable outcome." },
          { title: "Schedule a follow-up", detail: "Set a date to discuss progress, support needed, and the next milestone." },
        ],
      },
    },
  },
  tech_lead: {
    base: "/tech-lead",
    title: "Tech Lead",
    description: "Prepare technical assessments, organize evidence, and give actionable coaching feedback.",
    initials: "TL",
    areas: {
      assessments: {
        title: "Technical Assessments",
        short: "TA",
        description: "Assess engineering contributions against the skills and expectations for each role.",
        availability: "Assigned technical assessments will appear here when review assignments are connected.",
        checklist: [
          { title: "Check the assessment criteria", detail: "Confirm the competencies, role expectations, and review period before assessing contributions." },
          { title: "Review representative work", detail: "Consider delivery, engineering decisions, collaboration, and ownership across the review period." },
          { title: "Prepare the assessment", detail: "Tie each evaluation to a specific example and describe its impact." },
        ],
      },
      evidence: {
        title: "Evidence and Ratings",
        short: "ER",
        description: "Connect technical ratings to concrete work and outcomes.",
        availability: "Evidence submission and ratings will appear here when the assessment workflow is connected.",
        checklist: [
          { title: "Gather relevant examples", detail: "Use approved project records, pull requests, design documents, and operational outcomes." },
          { title: "Explain the contribution", detail: "Describe what the employee did, why it mattered, and any relevant constraints." },
          { title: "Apply the rating scale", detail: "Map the evidence to the published rating criteria and flag gaps that need clarification." },
        ],
      },
      coaching: {
        title: "Coaching Feedback",
        short: "CF",
        description: "Prepare feedback that gives engineers a clear next step.",
        availability: "Coaching records will appear here when the feedback workflow is connected.",
        checklist: [
          { title: "Describe the situation", detail: "Choose a specific example and explain what happened and its impact." },
          { title: "Agree on a next step", detail: "Suggest a practical change or learning opportunity and discuss what support would help." },
          { title: "Follow up on progress", detail: "Agree on what improvement would look like and when you will check in again." },
        ],
      },
    },
  },
};

export type LeadershipRole = keyof typeof leadershipWorkspaces;
