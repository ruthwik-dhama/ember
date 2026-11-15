// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// PLACEHOLDER habitat geometry in metres [x length, y width, z height]. Keep in sync with backend/ember/config.py ROOM_M.
export const ROOM_M = [6.0, 4.0, 2.5];
// Voxel edge in metres; mirrors calibration.csv engine.dx_m. Voxel [i,j,k] centre = (i+0.5)*DX_M etc.
export const DX_M = 0.25;
// Airlock position (metres); mirrors backend config.py AIRLOCK_M, where dust puffs enter.
export const AIRLOCK_M = [0.5, 2.0, 1.0];
