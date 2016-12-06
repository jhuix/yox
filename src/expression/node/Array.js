
import Node from './Node'
import * as nodeType from '../nodeType'

import * as env from '../../config/env'
import * as array from '../../util/array'

/**
 * Array 节点
 *
 * @param {Array.<Node>} elements
 */
export default class Array extends Node {

  constructor(elements) {
    super(nodeType.ARRAY)
    this.elements = elements
  }

  stringify() {
    let { elements } = this
    elements = elements.map(
      function (element) {
        return element.stringify()
      }
    )
    return `[${elements.join(', ')}]`
  }

  execute(context) {
    let value = [ ], deps = [ ]
    array.each(
      this.elements,
      function (node) {
        let result = node.execute(context)
        value.push(result.value)
        array.push(deps, result.deps)
      }
    )
    return {
      value,
      deps,
    }
  }

}