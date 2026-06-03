// Claude project instructions format — framing wrapper only.
// The actual generation is handled by the main generator with format="claude".
// This file exists for future format-specific customization.
export const CLAUDE_HEADER = `# Instructions

You are assisting with development across the following GitHub repositories. Use this context to understand the codebase, architecture, and recent activity.
`;
