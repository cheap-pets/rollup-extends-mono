function typeOf (value) {
  return Object
    .prototype
    .toString
    .call(value)
    .match(/\[object (.*)\]/)[1]
    .toLowerCase()
}

function isFunction (value) {
  return ['function', 'asyncfunction', 'generatorfunction'].includes(typeOf(value))
}

function isString (value) {
  return typeOf(value) === 'string'
}

function isObject (value) {
  return typeOf(value) === 'object'
}

export {
  isString,
  isObject,
  isFunction
}
