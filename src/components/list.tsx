'use strict'

import React, { useContext } from 'react'
import { Route } from 'react-router'

import { clientContext } from './contexts'
import { Renderer, TRendererProps } from './renderer'

export const List = (props: TRendererProps) => {
  const { path } = useContext(clientContext)

  return (
    <Route exact path={path}>
      <Renderer {...props} />
    </Route>
  )
}

export const Index = List

export default List
