'use strict'

import React, { useContext } from 'react'
import { Route, useHistory, useLocation, useRouteMatch } from 'react-router'

import { clientContext, useResources } from './contexts'
import { Renderer, TRendererProps } from './renderer'

const RoutedList = (rendererProps: TRendererProps) => {
  const history = useHistory()
  const location = useLocation()
  const match = useRouteMatch()
  const {
    name: { plural }
  } = useContext(clientContext)
  const { [plural]: resources } = useResources()

  const props = {
    history,
    location,
    match,

    [plural]: resources
  }

  return <Renderer {...rendererProps} props={props} />
}

export const List = (props: TRendererProps) => {
  const { path } = useContext(clientContext)

  return (
    <Route exact path={path}>
      <RoutedList {...props} />
    </Route>
  )
}

export const Index = List

export default List
