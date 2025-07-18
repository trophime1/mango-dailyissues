"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = formatDuration;
exports.calculateTimeDifference = calculateTimeDifference;
/**
 * Formats time duration from milliseconds to a readable format
 * @param milliseconds - Time duration in milliseconds
 * @returns Formatted string in "Xd Yh Zm" format
 */
function formatDuration(milliseconds) {
    const totalMinutes = Math.round(milliseconds / (1000 * 60));
    if (totalMinutes < 60) {
        return `${totalMinutes}m`;
    }
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    if (totalHours < 24) {
        return remainingMinutes > 0
            ? `${totalHours}h ${remainingMinutes}m`
            : `${totalHours}h`;
    }
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    let result = `${days}d`;
    if (remainingHours > 0) {
        result += ` ${remainingHours}h`;
    }
    if (remainingMinutes > 0) {
        result += ` ${remainingMinutes}m`;
    }
    return result;
}
/**
 * Calculates the time difference between two dates in milliseconds
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Time difference in milliseconds
 */
function calculateTimeDifference(startDate, endDate) {
    return endDate.getTime() - startDate.getTime();
}
//# sourceMappingURL=timeUtils.js.map