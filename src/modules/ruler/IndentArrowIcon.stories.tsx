import type { Meta, StoryObj } from '@storybook/react'
import type { ReactNode } from 'react'
import { IndentArrowIcon } from './IndentArrowIcon'
import styles from './Ruler.module.css'

function RulerHandleContext({ children }: { children: ReactNode }) {
  return (
    <div
      className={styles.horizontalRulerGroup}
      style={{ width: '200px', position: 'relative' }}
    >
      <div className={styles.horizontalRulerTrack}>{children}</div>
      <div className={styles.horizontalRulerShelf} aria-hidden />
    </div>
  )
}

const meta = {
  title: 'Ruler/IndentArrowIcon',
  component: IndentArrowIcon,
  args: {
    type: 'down',
    active: false,
    title: 'First Line Indent',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '3rem', background: '#f0f0f0', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <RulerHandleContext>
          <Story />
        </RulerHandleContext>
      </div>
    ),
  ],
} satisfies Meta<typeof IndentArrowIcon>

export default meta
type Story = StoryObj<typeof meta>

export const DownArrow: Story = {
  args: {
    type: 'down',
    title: 'First Line Indent (▼)',
    style: { left: '100px' },
  },
}

export const UpArrow: Story = {
  args: {
    type: 'up',
    title: 'Hanging / Left Indent (▲)',
    style: { left: '100px' },
  },
}

export const Box: Story = {
  args: {
    type: 'box',
    title: 'Left Indent Base (■)',
    style: { left: '100px' },
  },
}

export const AllSliders: Story = {
  render: () => (
    <div style={{ padding: '3rem', background: '#f0f0f0' }}>
      <RulerHandleContext>
        <IndentArrowIcon type="down" title="First Line" style={{ left: '60px' }} />
        <IndentArrowIcon type="up" title="Left Indent" style={{ left: '60px' }} />
        <IndentArrowIcon type="up" title="Right Indent" style={{ left: '140px' }} />
        <IndentArrowIcon type="down" active title="Active" style={{ left: '100px' }} />
      </RulerHandleContext>
    </div>
  ),
}
