import { z } from 'zod';
import { resourceSchema } from '../../../scripts/catalog.mjs';
export const GET = () => Response.json(z.toJSONSchema(resourceSchema));
