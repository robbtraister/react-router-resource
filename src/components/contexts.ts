'use strict'

import { createContext, useContext } from 'react'

import { IParams } from './client'

export const clientContext = createContext({
  cache: {
    items: {},
    pages: {}
  },
  client: {
    get: id => Promise.resolve(undefined),
    list: (params: string | IParams) => Promise.resolve(undefined),
    serializeParams: (params: IParams) => undefined
  },
  idField: 'id',
  idParam: null,
  name: {
    singular: '',
    plural: ''
  },
  path: '/',
  dispatch: action => null
})

export const resourcesContext = createContext({})

export const useResources = () => useContext(resourcesContext)
