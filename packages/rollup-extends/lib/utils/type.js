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

function isFunction (value) {
  return ['function', 'asyncfunction', 'generatorfunction'].includes(typeOf(value))
}

function ensureFunction (value) {
  return isFunction(value)
    ? value
    : () => value
}

export {
  isString,
  isObject,
  isFunction,
  ensureFunction
}
