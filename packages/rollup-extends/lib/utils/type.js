function defaults (value, defaultValue) {
  // eslint-disable-next-line no-void
  return value === (void 0)
    ? defaultValue
    : value
}

function typeOf (value) {
  return Object
    .prototype
    .toString
    .call(value)
    .match(/\[object (.*)\]/)[1]
    .toLowerCase()
}

function isString (value) {
  return typeOf(value) === 'string'
}

function isObject (value) {
  return typeOf(value) === 'object'
}

function isRegExp (value) {
  return typeOf(value) === 'regexp'
}

function isFunction (value) {
  return typeOf(value).includes('function') // function, asyncfunction, generatorfunction
}

function ensureFunction (value) {
  return isFunction(value)
    ? value
    : () => value
}

export {
  defaults,
  isString,
  isObject,
  isRegExp,
  isFunction,
  ensureFunction
}
