/**
 * Returns the first child element of parent (fall-back to document if not given)
 * matching the given selector.
 * 
 * @example
 * let element = $$('.myclass')
 * 
 * @param {string} selector A CSS selector.
 * @param {string|Element} [parent] The element to search within, or `document` by default.
 * @returns {Element}
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
 * 
 * @param {string} selector A CSS selector.
 * @param {string|Element} [parent] The element to search within, or `document` by default.
 * @returns {Array<Element>}
 */
export function $ (selector, parent) {
  if (typeof parent === 'string') {
    parent = $$(parent)
  }
  parent = parent || document
  return [...parent.querySelectorAll(selector)]
}

/**
 * Adds the given nodes as children to the given parent node.
 * 
 * @param {string|Node|Array<Node>} nodes The nodes to add to `el`.
 * @param {Node} el The parent node.
 * 
 * @example
 * let elements = HTML('<li>foo</li><li>bar</li>')
 * add(elements, document.body)
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
 * let html = '<li>text</li>'
 * let element = HTMLone(s)
 * document.body.appendChild(element)
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
 * @param {string} html The HTML string out of which to create the single DOM element.
 * @return {Array<Element>}
 * 
 * @example
 * let html = '<li>foo</li><li>bar</li>'
 * let elements = HTML(html)
 * add(elements, document.body)
 */
export function HTML (html) {
  let div = document.createElement('div')
  div.innerHTML = html
  let elements = [...div.childNodes]
  return elements
}