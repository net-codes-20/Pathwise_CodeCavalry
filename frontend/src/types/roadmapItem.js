/**
 * @typedef {"upcoming"|"current"|"completed"|"skipped"} RoadmapItemStatus
 *
 * @typedef {Object} RoadmapItem
 * @property {string} id
 * @property {string} resource_id
 * @property {number} order
 * @property {RoadmapItemStatus} status
 * @property {boolean} milestone
 * @property {string} reason
 * @property {import('./resource.js').Resource} [resource]
 */
export {};
