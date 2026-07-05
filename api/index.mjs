import { app, ensureRuntimeSchema } from '../server/app.mjs'

await ensureRuntimeSchema()

export default app
