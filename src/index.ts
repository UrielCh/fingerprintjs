import { x64hash128 } from './utils/hashing'
import { load, Agent, LoadOptions, GetOptions, GetResult, hashComponents, componentsToDebugString } from './agent'
import { getComponents, Component, UnknownComponents, BuiltinComponents, SourcesToComponents } from './sources'
import { isTrident, isEdgeHTML, isChromium, isWebKit, isGecko, isDesktopSafari } from './utils/browser'

import getAvailableScreenResolution from './sources/available_screen_resolution'
import getScreenResolution from './sources/screen_resolution'
import getGlobalDim from './sources/global_dim'

export function check(url: string): void {
  const start = Date.now()
  const w = window
  let visits = 0
  const m = location.search.match(/gclid=([^&]+)/)
  const currentGclid = m ? m[1] : ''
  let prevGclid: string | null = ''
  let rnd: string | null = ''
  if (w.localStorage) {
    visits = Number(w.localStorage.getItem('c')) + 1
    w.localStorage.setItem('c', String(visits))
    rnd = w.localStorage.getItem('rnd')
    if (!rnd) {
      rnd = Math.random().toString(36).substr(2)
      w.localStorage.setItem('rnd', rnd)
    }
    prevGclid = w.localStorage.getItem('g')
    if (currentGclid) w.localStorage.setItem('g', currentGclid)
  }

  function pushArg(arg: string[], k: string, v: any): void {
    const t = typeof v
    if (t === 'undefined') return
    if (t === 'boolean') arg.push(k + '=' + (v ? 1 : 0))
    if (t === 'number') arg.push(k + '=' + v)
    if (t === 'object') {
      if (v.length && typeof v[0] === 'number') {
        arg.push(k + '=' + v.join(','))
        return
      }
      if (v.maxTouchPoints) arg.push('mt=' + v.maxTouchPoints)
      if (v.touchEvent) arg.push('te=1')
      if (v.touchStart) arg.push('ts=1')
      if (v.length) arg.push(k + '=' + v.length)
    }
  }

  function report(arg: string[]) {
    const img = document.createElement('img')
    arg.push('sec=' + Math.floor((Date.now() - start) / 1000))
    if (currentGclid) arg.push('cgid=' + currentGclid)
    img.src = url + '?' + arg.join('&')
    // let u2 = url + '?sec=' + Math.floor((Date.now() - start) / 1000) + '&' + arg.join('&')
    // if (currentGclid) {
    //   u2 += 'cgid=' + currentGclid
    // }
    // img.src = u2
    document.getElementsByTagName('body')[0].appendChild(img)
  }

  const arg0 = [] as string[]
  pushArg(arg0, 'asr', getAvailableScreenResolution())
  pushArg(arg0, 'sr', getScreenResolution())
  pushArg(arg0, 'gd', getGlobalDim())
  if (prevGclid != null) arg0.push('gid=' + prevGclid)
  report(arg0)

  load().then(function (fp) {
    fp.get({ debug: false }).then(function (result) {
      const arg: string[] = []
      for (const k of Object.keys(result.components)) {
        pushArg(arg, k, (result.components as any)[k].value)
      }
      arg.push('v=' + visits)
      arg.push('fp=' + result.visitorId)
      if (rnd) arg.push('rnd=' + rnd)
      report(arg)
    })
  })
  let nxt = 2000
  const autoreport = function () {
    setTimeout(function () {
      report([])
      nxt += 2000
      autoreport()
    }, nxt)
  }
  autoreport()
}

// Exports that are under Semantic versioning
export {
  load,
  Agent,
  LoadOptions,
  GetOptions,
  GetResult,
  hashComponents,
  componentsToDebugString,
  Component,
  UnknownComponents,
  BuiltinComponents,
}
// The default export is a syntax sugar (`import * as FP from '...' → import FP from '...'`).
// It should contain all the public exported values.
export default { load, hashComponents, componentsToDebugString }

// The exports below are for private usage. They may change unexpectedly. Use them at your own risk.
/** Not documented, out of Semantic Versioning, usage is at your own risk */
export const murmurX64Hash128 = x64hash128
export { getComponents, SourcesToComponents, isTrident, isEdgeHTML, isChromium, isWebKit, isGecko, isDesktopSafari }
