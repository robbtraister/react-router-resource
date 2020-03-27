'use strict'

import { useLocation } from 'react-router'

export const useQueryParams = () => {
  const location = useLocation()
  const query = new URLSearchParams(location.search)

  const queryMap = {}
  query.forEach((value, key) => {
    if (key in queryMap) {
      if (!Array.isArray(queryMap[key])) {
        queryMap[key] = [queryMap[key]]
      }
      queryMap[key].push(value)
    } else {
      queryMap[key] = value
    }
  })

  return queryMap
}
