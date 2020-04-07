'use strict'

import React from 'react'
import { useHistory, useLocation, useRouteMatch } from 'react-router'
import { useResources } from './contexts'

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
  render
}: TRendererProps & { props?: object }): React.ReactElement => {
  const history = useHistory()
  const location = useLocation()
  const match = useRouteMatch()
  const resources = useResources()

  const props = {
    history,
    location,
    match,
    resources
  }

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
