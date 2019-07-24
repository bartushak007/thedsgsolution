import {createElement, isValidElement} from 'react'

/**
* 1. tag: text
* 2. tag: child :object
* 3. tag: children :object[]
* 4. [tag || Name]: { {children :object[] | object | string}, ...{props}}
* Variable 'list' of component instances - as array or named object
*/

export default function render(object, list = {}) {
  return isValidElement(object)
  ? object
  : renderJson(object, list)
}

function renderJson(obj, list = {}) {
  const recursion = v => render(v, list)

  return Array.isArray(obj)
  ? obj.map(recursion)
  : typeof obj !== 'object'
  ? obj
  : Object.keys(obj)
  .map(tagOrName => {
    const value = obj[tagOrName],
      props = Object.assign({},
      typeof value === 'object' && !Array.isArray(value)
      ? value
      : {children:
        Array.isArray(value)
        ? value
        : [value]
      }
    ),
      {
        tag = tagOrName, name = tagOrName,
        className = name,
        key = name,
        children = []
      } = props

    Object.assign(props, {
      name,
      key,
      className
    })

    delete props.children
    delete props.tag

    return createElement(
      tag in list
      ? list[tag]
      : tag,
      props,
      ...(
        Array.isArray(children) ? children : [children]
      ).map(recursion)
    )
  })
}


