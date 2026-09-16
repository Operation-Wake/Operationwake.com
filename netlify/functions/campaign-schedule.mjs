import { dispatch } from '../lib/runtime.mjs';
export default async (request, context) => { await dispatch(context); };
export const config = { schedule: '*/15 * * * *' };
