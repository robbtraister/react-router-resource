'use strict'

import React from 'react'
import { Route } from 'react-router'

import { useConfig } from './contexts'
import { Renderer, TRendererProps } from './renderer'

export const List = (props: TRendererProps) => {
  const { path } = useConfig()

  return (
    <Route exact path={path}>
      <Renderer {...props} />
    </Route>
  )
}

export const Index = List

export default List
