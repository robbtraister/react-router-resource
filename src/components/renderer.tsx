'use strict'

import React from 'react'

export type TRendererProps =
  | { children?: React.ReactNode; component?: never; render?: never }
  | { children?: never; component?: React.ComponentType<any>; render?: never }
  | {
      children?: never
      component?: never
      render?: (props: object) => React.ReactNode
    }

export const Renderer = ({
  children,
  component: Component,
  render,
  props = {}
}: TRendererProps & { props?: object }): React.ReactElement => {
  return children ? (
    typeof children === 'function' ? (
      children(props)
    ) : (
      children
    )
  ) : Component ? (
    <Component {...props} />
  ) : render ? (
    <>{render(props)}</>
  ) : null
}

export default Renderer
