/* global module */


const clsRegExps = {};

/**
 * Gets a class reqular expression for a given css class
 * @param {String} clazz
 * @return {RegExp} a regular expression for the specified css class
 */
function classRe(clazz) {
  // new RegExp("\\b" + clazz + "[^\w-]")
  return clsRegExps[clazz] || (clsRegExps[clazz] =
      new RegExp("(^|\\s+)" + clazz + "(?:\\s+|$)")); // thank you xui.js :) 
}

/**
 * Adds a CSS class to specified element
 * @param {Element} elem 
 * @param {String} clName 
 * @return {boolean} true if class was successfully added
 */
function addClass(elem, clName) {
  const cList = elem.classList;
  if(!cList || !clName) {
    return false;
  }
  cList.add(clName);
  return true;
}

/**
 * Removes a css class name from the specified element
 * @param {Element} elem 
 * @param {String} clName 
 * @return {boolean} true of class name was removed
 */
function removeClass(elem, clName) {
  const cList = elem.classList;
  if(!cList || !clName) {
    return false;
  }
  cList.remove(clName);
  return true;
}

/**
 * Tests whether the specified element as the specified CSS class
 * @param {Element} element 
 * @param {String} clName 
 * @return {boolean}
 */
function hasClass(element, clName) {
  return classRe(clName).test(element.className);
}

module.exports = {
  hasClass,
  addClass,
  removeClass
};
