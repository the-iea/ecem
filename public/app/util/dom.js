/**
 * Returns the first child element of parent (fall-back to document if not given)
 * matching the given selector.
 * 
 * @example
 * let element = $$('.myclass')
 */
export function $$ (selector, parent) {
  if (typeof parent === 'string') {
    parent = $$(parent)
  }
  parent = parent || document
  return parent.querySelector(selector)
}

/**
 * Returns all child elements of parent (fall-back to document if not given)
 * matching the given selector as an array.
 * 
 * @example
 * let items = $('.item', '#list')
 */
export function $ (selector, parent) {
  if (typeof parent === 'string') {
    parent = $$(parent)
  }
  parent = parent || document
  return [...parent.querySelectorAll(selector)]
}

/**
 * Adds the given elements as children to the given parent element.
 * 
 * @param {string|Node|Array<Node>} nodes The elements to add to `el`.
 * @param {Node} el The parent element.
 */
export function add (nodes, el) {
  if (typeof nodes === 'string') {
    nodes = HTML(nodes)
  }
  if (!Array.isArray(nodes)) {
    nodes = [nodes]
  }
  nodes.forEach(node => el.appendChild(node))
}

/**
 * Turns an HTML string into a DOM element.
 * The HTML markup must have a single root node, whitespace is ignored.
 * 
 * @param {string} html The HTML string out of which to create the single DOM element.
 * @return {Element}
 * 
 * @example 
 * var s = '<li>text</li>'
 * var el = HTMLone(s)
 * document.body.appendChild(el)
 */
export function HTMLone (html) {
  let div = document.createElement('div')
  div.innerHTML = html
  let element = div.firstElementChild
  return element
}

/**
 * Turns an HTML string into an array of DOM elements.
 * 
 * @example
 * var s = '<li>foo</li><li>bar</li>'
 * var els = HTML(s)
 * add(els, document.body)
 */
export function HTML (html) {
  let div = document.createElement('div')
  div.innerHTML = html
  let elements = [...div.childNodes]
  return elements
}