'use strict'

import { createContext, useContext } from 'react'

import { Client, Name } from '../client'

export interface Config {
  client: Client<any>
  idParam: string
  name: Name
  path: string
  dispatch: React.Dispatch<any>
}

export const configContext = createContext<Config>({
  client: Client.getInstance({ endpoint: '' }),
  idParam: '',
  name: {
    plural: null,
    singular: null
  },
  path: '',
  dispatch: () => {}
})

export const resourcesContext = createContext<object>({})

export const useClient = () => useContext(configContext).client
export const useConfig = () => useContext(configContext)
export const useResources = () => useContext(resourcesContext)
