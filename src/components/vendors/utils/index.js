// args is an array of arguments for each call.
// I.e. with array of pairs eventName-handler it can add listeners to one element at 1 row
export function applier(object, func, args) {
  if (object === null || typeof object !== 'object')
    return;
  args.forEach(args => object[func](...args))
}

export function capitalizeFirstLetter(str) {
  return typeof str !== 'string'
  ? str
  : str.charAt(0).toUpperCase() + str.slice(1)
}

export function isFirstLetterCapital(str) {
  return typeof str === 'string'
  && str.charAt(0).toUpperCase() === str.charAt(0)
}

export function fetchJson(url) {
  return fetch(url)
  .then(response => {
    const responseClone = response.clone();
    return responseClone.json()
      .catch(err =>
        response.text().then(text => {
          throw new Error(`Not json: ${text}`);
        })
      )
  })
}

export function getUrlQuery() {
  const urlQuery = {}
  for (const [key, value] of new URLSearchParams(window.location.search))
    urlQuery[key] = decodeURIComponent(value)
  return urlQuery
}

export function filterKeys(keys = [], objects = []) {
  return Object.assign(
    {},
    ...keys.map(key => { 
      for (const object of objects)
        if (isObject(object) && key in object)
          return { [key]: object[key] }
      return {}
    })
  )
} 

export function isObject(source) {
  return source !== null
  && !Array.isArray(source)
  && typeof source === 'object'
}

export function openWindow(url, content) {
  const w = window.open(url, '', 'toolbar=0')
  if (content) {
    const d = w.document.open();
    d.write(content)
    d.close()
  }
}

export function setAttributes($this, attributes) {
  Object.entries(attributes)
  .forEach(([key, value]) => $this.setAttribute(key, value))
  return $this
}

export function openWindowFromForm(response) {
  let form = document.createElement('form')
  setAttributes(form, {
    action: response['form:action'],
    method: response['form:method'],
    target: response['form:target'],
    style: "display: none;"
  })
  if (response['form:inputs'])
    Object.entries(
      typeof response['form:inputs'] === 'string'
      ? JSON.parse(response['form:inputs'])
      : response['form:inputs']
    )
    .forEach(([name, value]) =>
      form.appendChild(
        setAttributes(
          document.createElement('input'),
          {
            name,
            value,
            type: 'text'
          }
        )
      )
    )
  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
  form = null
}

export function compileObjects(objects, key = 'id') {
  return !Array.isArray(objects)
  ? objects
  : Object.assign({}, ...objects.map(f => ({[f[key]]: f})))
}
