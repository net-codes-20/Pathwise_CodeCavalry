/**
 * @typedef {"data_science"|"web_development"|"ai_ml"} Domain
 * @typedef {"beginner"|"intermediate"|"advanced"} ResourceLevel
 * @typedef {"course"|"article"|"video"|"project"|"assessment"|"book"} ResourceType
 *
 * @typedef {Object} Resource
 * @property {string} id
 * @property {string} title
 * @property {Domain} domain
 * @property {ResourceLevel} level
 * @property {ResourceType} type
 * @property {string[]} tags
 * @property {string[]} prerequisites
 * @property {number} duration_hours
 * @property {string} url
 * @property {string} description
 */
export {};
