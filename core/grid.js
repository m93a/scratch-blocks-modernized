/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2017 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Object for configuring and updating a workspace grid in
 * Blockly.
 * @author fenichel@google.com (Rachel Fenichel)
 */

goog.require('Blockly.utils');

goog.require('goog.userAgent');


/**
 * Class for a workspace's grid.
 * @param {!SVGElement} pattern The grid's SVG pattern, created during injection.
 * @param {!Object} options A dictionary of normalized options for the grid.
 *     See grid documentation:
 *     https://developers.google.com/blockly/guides/configure/web/grid
 * @constructor
 */
export class Grid
{
  constructor(pattern, options) {
    this.gridPattern_ = pattern;
    this.spacing_ = options['spacing'];
    this.length_ = options['length'];
    this.snapToGrid_ = options['snap'];
    this.line1_ = pattern.firstChild;
    this.line2_ = this.line1_ && this.line1_.nextSibling;
  }

  /**
   * The grid's SVG pattern, created during injection.
   * @type {!SVGElement}
   * @private
   */
  gridPattern_ = null;

  /**
   * The spacing of the grid lines (in px).
   * @type {number}
   * @private
   */
  spacing_ = null;

  /**
   * How long the grid lines should be (in px).
   * @type {number}
   * @private
   */
  length_ = null;

  /**
   * The horizontal grid line, if it exists.
   * @type {SVGElement}
   * @private
   */
  line1_ = null;

  /**
   * The vertical grid line, if it exists.
   * @type {SVGElement}
   * @private
   */
  line2_ = null;

  /**
   * Whether blocks should snap to the grid.
   * @type {boolean}
   * @private
   */
  snapToGrid_ = null;

  /**
   * The scale of the grid, used to set stroke width on grid lines.
   * This should always be the same as the workspace scale.
   * @type {number}
   * @private
   */
  scale_ = 1;

  /**
   * Dispose of this grid and unlink from the DOM.
   * @package
   */
  dispose() {
    this.gridPattern_ = null;
  }

  /**
   * Whether blocks should snap to the grid, based on the initial configuration.
   * @return {boolean} True if blocks should snap, false otherwise.
   * @package
   */
  shouldSnap() {
    return this.snapToGrid_;
  }

  /**
   * Get the spacing of the grid points (in px).
   * @return {number} The spacing of the grid points.
   * @package
   */
  getSpacing() {
    return this.spacing_;
  }

  /**
   * Get the id of the pattern element, which should be randomized to avoid
   * conflicts with other Blockly instances on the page.
   * @return {string} The pattern ID.
   * @package
   */
  getPatternId() {
    return this.gridPattern_.id;
  }

  /**
   * Update the grid with a new scale.
   * @param {number} scale The new workspace scale.
   * @package
   */
  update(scale) {
    this.scale_ = scale;
    // MSIE freaks if it sees a 0x0 pattern, so set empty patterns to 100x100.
    var safeSpacing = (this.spacing_ * scale) || 100;

    this.gridPattern_.setAttribute('width', safeSpacing);
    this.gridPattern_.setAttribute('height', safeSpacing);

    var half = Math.floor(this.spacing_ / 2) + 0.5;
    var start = half - this.length_ / 2;
    var end = half + this.length_ / 2;

    half *= scale;
    start *= scale;
    end *= scale;

    this.setLineAttributes_(this.line1_, scale, start, end, half, half);
    this.setLineAttributes_(this.line2_, scale, half, half, start, end);
  }

  /**
   * Set the attributes on one of the lines in the grid.  Use this to update the
   * length and stroke width of the grid lines.
   * @param {!SVGElement} line Which line to update.
   * @param {number} width The new stroke size (in px).
   * @param {number} x1 The new x start position of the line (in px).
   * @param {number} x2 The new x end position of the line (in px).
   * @param {number} y1 The new y start position of the line (in px).
   * @param {number} y2 The new y end position of the line (in px).
   * @private
   */
  setLineAttributes_(line, width, x1, x2, y1, y2) {
    if (line) {
      line.setAttribute('stroke-width', width);
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
    }
  }

  /**
   * Move the grid to a new x and y position, and make sure that change is visible.
   * @param {number} x The new x position of the grid (in px).
   * @param {number} y The new y position ofthe grid (in px).
   * @package
   */
  moveTo(x, y) {
    this.gridPattern_.setAttribute('x', x);
    this.gridPattern_.setAttribute('y', y);

    if (goog.userAgent.IE || goog.userAgent.EDGE) {
      // IE/Edge doesn't notice that the x/y offsets have changed.
      // Force an update.
      this.update(this.scale_);
    }
  }

  /**
   * Create the DOM for the grid described by options.
   * @param {string} rnd A random ID to append to the pattern's ID.
   * @param {!Object} gridOptions The object containing grid configuration.
   * @param {!SVGElement} defs The root SVG element for this workspace's defs.
   * @return {!SVGElement} The SVG element for the grid pattern.
   * @package
   */
  static createDom = function(rnd, gridOptions, defs) {
    /*
      <pattern id="blocklyGridPattern837493" patternUnits="userSpaceOnUse">
        <rect stroke="#888" />
        <rect stroke="#888" />
      </pattern>
    */
    var gridPattern = Blockly.utils.createSvgElement('pattern',
        {
          'id': 'blocklyGridPattern' + rnd,
          'patternUnits': 'userSpaceOnUse'
        }, defs);
    if (gridOptions['length'] > 0 && gridOptions['spacing'] > 0) {
      Blockly.utils.createSvgElement('line',
          {'stroke': gridOptions['colour']}, gridPattern);
      if (gridOptions['length'] > 1) {
        Blockly.utils.createSvgElement('line',
            {'stroke': gridOptions['colour']}, gridPattern);
      }
      // x1, y1, x1, x2 properties will be set later in update.
    } else {
      // Edge 16 doesn't handle empty patterns
      Blockly.utils.createSvgElement('line', {}, gridPattern);
    }
    return gridPattern;
  }
}
