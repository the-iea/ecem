/**
 * Darken a given hex color by a given ratio. If negative, lighten up.
 * 
 * @example
 * let darker = darken('#ADD8E6', 0.2) // darken by 20%
 * 
 * @param {string} hex A non-abbreviated hex colour, e.g. '#00FF00'.
 * @param {number} ratio The ratio by which to darken the colour, e.g. 0.2 would mean 20% darkening.
 * @returns {string} The darkened colour as hex string, e.g. '#FFFF00'. 
 */
export function darken (hex, ratio) {
  hex = hex.slice(1) // strip off #
  let lum = -ratio

  let rgb = '#'
  for (let i = 0; i < 3; i++) {
    let c = parseInt(hex.substr(i*2,2), 16)
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16)
    rgb += ('00'+c).substr(c.length)
  }

  return rgb
}
