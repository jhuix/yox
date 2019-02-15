
import * as domApi from 'yox-snabbdom/htmldomapi'

import * as env from 'yox-common/util/env'
import * as array from 'yox-common/util/array'
import * as object from 'yox-common/util/object'

import Event from 'yox-common/util/Event'
import Emitter from 'yox-common/util/Emitter'

import * as event from '../../config/event'

let api = object.copy(domApi)

// import * as oldApi from './oldApi'

// if (env.doc && !env.doc.addEventListener) {
//   object.extend(api, oldApi)
// }

let { on, off } = api

/**
 * 特殊事件，外部可扩展
 *
 * @type {Object}
 */
api.specialEvents = {
  input: {
    on(el, listener) {
      let locked = env.FALSE
      api.on(el, event.COMPOSITION_START, listener[ event.COMPOSITION_START ] = function () {
        locked = env.TRUE
      })
      api.on(el, event.COMPOSITION_END, listener[ event.COMPOSITION_END ] = function (e) {
        locked = env.FALSE
        listener(e, event.INPUT)
      })
      on(el, event.INPUT, listener[ event.INPUT ] = function (e) {
        if (!locked) {
          listener(e)
        }
      })
    },
    off(el, listener) {
      api.off(el, event.COMPOSITION_START, listener[ event.COMPOSITION_START ])
      api.off(el, event.COMPOSITION_END, listener[ event.COMPOSITION_END ])
      off(el, event.INPUT, listener[ event.INPUT ])
      listener[ event.COMPOSITION_START ] =
      listener[ event.COMPOSITION_END ] =
      listener[ event.INPUT ] = env.NULL
    }
  }
}

const RAW_EMITTER = '$emitter'

/**
 * 绑定事件
 *
 * @param {HTMLElement} element
 * @param {string} type
 * @param {Function} listener
 * @param {?*} context
 */
api.on = function (element, type, listener, context) {
  let emitter = element[ RAW_EMITTER ] || (element[ RAW_EMITTER ] = new Emitter())
  if (!emitter.has(type)) {
    let nativeListener = function (e, type) {
      if (!Event.is(e)) {
        e = new Event(api.createEvent(e, element))
      }
      if (type) {
        e[ env.RAW_TYPE ] = type
      }
      emitter.fire(e[ env.RAW_TYPE ], e, context)
    }
    emitter[ type ] = nativeListener
    let special = api.specialEvents[ type ]
    if (special) {
      special.on(element, nativeListener)
    }
    else {
      on(element, type, nativeListener)
    }
  }
  emitter.on(type, listener)
}

/**
 * 解绑事件
 *
 * @param {HTMLElement} element
 * @param {string} type
 * @param {Function} listener
 *
 */
api.off = function (element, type, listener) {
  let emitter = element[ RAW_EMITTER ],
  types = object.keys(emitter.listeners)
  // emitter 会根据 type 和 listener 参数进行适当的删除
  emitter.off(type, listener)
  // 根据 emitter 的删除结果来操作这里的事件 listener
  array.each(
    types,
    function (type, index) {
      if (emitter[ type ] && !emitter.has(type)) {
        let nativeListener = emitter[ type ],
        special = api.specialEvents[ type ]
        if (special) {
          special.off(element, nativeListener)
        }
        else {
          off(element, type, nativeListener)
        }
        delete emitter[ type ]
        types.splice(index, 1)
      }
    },
    env.TRUE
  )
  if (!types[ env.RAW_LENGTH ]) {
    api.removeProp(element, RAW_EMITTER)
  }
}

export default api
