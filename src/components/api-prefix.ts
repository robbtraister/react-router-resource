'use strict'

import { createContext, useContext } from 'react'

const apiPrefixContext = createContext<string>('/api/v1')

export const ApiPrefix = apiPrefixContext.Provider

export const useApiPrefix = () => useContext(apiPrefixContext)

export default ApiPrefix
