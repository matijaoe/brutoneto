import dts from 'bun-plugin-dts'

// eslint-disable-next-line antfu/no-top-level-await
await Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './dist',
  plugins: [dts()],
})
