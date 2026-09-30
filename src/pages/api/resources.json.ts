import { resources, url } from '../../lib/catalog';
export const GET = () => Response.json({ schemaVersion: 1, resources: resources.map(item => ({ ...item, page: url(`resources/${item.slug}/`), download: url(item.source) })) });
