import path from 'node:path'
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...config.resolve.alias,
      'commspliant-html-editor': path.resolve(__dirname, '../src/index.ts'),
    }
    return config
  },
}

export default config
