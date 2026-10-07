// Feature switches for demonstrations. Disputes are built and tested but hidden by
// default: they are not part of the department's current workflow. Set
// ENABLE_DISPUTES=true in the environment to bring the whole feature back.
export const DISPUTES_ENABLED = process.env.ENABLE_DISPUTES === "true";
