/**
 * @typedef {"internship"|"job"|"new_skill"|"project"|"interview_prep"|"academic"|"career_transition"|"certification"} GoalType
 * @typedef {"beginner"|"intermediate"|"advanced"} ExperienceLevel
 *
 * @typedef {Object} LearnerProfile
 * @property {string} [id]
 * @property {string} goal
 * @property {GoalType} goal_type
 * @property {ExperienceLevel} experience_level
 * @property {string[]} current_skills
 * @property {string[]} interests
 * @property {number|null} timeline_months
 * @property {number|null} weekly_time_hours
 * @property {string[]} constraints
 */
export {};
