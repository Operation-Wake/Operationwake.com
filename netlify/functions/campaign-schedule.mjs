import { dispatch } from '../lib/runtime.mjs';
export default async () => { await dispatch(); };
export const config = { schedule: '*/15 * * * *' };
