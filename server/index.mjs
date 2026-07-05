import { app, ensureRuntimeSchema } from './app.mjs'

const port = Number(process.env.PORT ?? 4174)

void ensureRuntimeSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`Yele API listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize API schema', error)
    process.exit(1)
  })
