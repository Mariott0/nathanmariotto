const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const source = fs.readFileSync(__dirname + '/game.js', 'utf8').replace(/\}\)\(\);\s*$/, 'globalThis.__gameTest = { game, keys, settings, loadRanking, applyPowerup }; })();');

function harness(initial = {}, blocked = false, reduced = false) {
  const elements = [];
  const ids = new Map();
  const handlers = { window: {}, document: {} };
  let frame, clock = 0, doc;
  const ctx = new Proxy({}, { get(target, key) {
    if (key in target) return target[key];
    if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => ({ addColorStop() {} });
    return () => {};
  }, set(target, key, value) { target[key] = value; return true; } });
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag; this.events = {}; this.dataset = {}; this.style = {}; this.attributes = {};
      this.children = []; this.hidden = false; this.disabled = false; this.classList = { add() {}, remove() {} };
      this.firstChild = { textContent: '' }; this.isGame = true; this.width = 1280; this.height = 720;
    }
    addEventListener(type, fn) { (this.events[type] ??= []).push(fn); }
    fire(type, event = {}) { event.target ??= this; event.preventDefault ??= () => { event.defaultPrevented = true; }; for (const fn of this.events[type] || []) fn(event); return event; }
    focus() { doc.activeElement = this; }
    contains(element) { return element.isGame; }
    matches(selector) { return selector.split(',').some((tag) => tag.trim() === this.tagName); }
    setAttribute(key, value) { this.attributes[key] = value; }
    setPointerCapture() {}
    getBoundingClientRect() { return { left: 0, top: 0, width: 1130, height: 636 }; }
    getContext() { return ctx; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    querySelectorAll(selector) { return queryAll(selector); }
    querySelector(selector) { return queryAll(selector)[0]; }
  }
  let panel;
  for (const tag of html.matchAll(/<\/?[a-zA-Z][^>]*>/g)) {
    if (tag[0] === '</section>') panel = undefined;
    if (tag[0][1] === '/') continue;
    const element = new Element(tag[0].match(/^<(\w+)/)[1]);
    for (const attr of tag[0].matchAll(/([\w-]+)="([^"]*)"/g)) {
      element.attributes[attr[1]] = attr[2];
      if (attr[1] === 'id') { element.id = attr[2]; ids.set(attr[2], element); }
      if (attr[1].startsWith('data-')) element.dataset[attr[1].slice(5)] = attr[2];
    }
    if (element.dataset.panel) panel = element.dataset.panel;
    element.panel = panel;
    if (tag[0].includes(' hidden')) element.hidden = true;
    elements.push(element);
  }
  function queryAll(selector) {
    if (selector === '[data-action]') return elements.filter((el) => el.dataset.action);
    if (selector === '[data-control]') return elements.filter((el) => 'control' in el.dataset);
    if (selector === '[data-panel]') return elements.filter((el) => el.dataset.panel);
    const named = selector.match(/data-panel="([^"]+)"/)[1];
    const action = selector.match(/data-action="([^"]+)"/);
    return elements.filter((el) => el.panel === named && (action ? el.dataset.action === action[1] : ['button', 'select'].includes(el.tagName)));
  }
  doc = {
    hidden: false, fullscreenEnabled: false, activeElement: null,
    getElementById: (id) => ids.get(id), querySelectorAll: queryAll,
    createElement: (tag) => new Element(tag),
    addEventListener(type, fn) { (handlers.document[type] ??= []).push(fn); },
  };
  const storage = new Map(Object.entries(initial));
  const context = {
    document: doc, performance: { now: () => clock },
    window: { matchMedia: () => ({ matches: reduced }), setTimeout: (fn) => fn(), addEventListener(type, fn) { (handlers.window[type] ??= []).push(fn); } },
    localStorage: { getItem(key) { if (blocked) throw Error('blocked'); return storage.get(key); }, setItem(key, value) { if (blocked) throw Error('blocked'); storage.set(key, value); } },
    CanvasRenderingContext2D: function () {}, requestAnimationFrame(fn) { frame = fn; },
  };
  vm.runInNewContext(source, context);
  const emit = (owner, type, event = {}) => { event.preventDefault ??= () => { event.defaultPrevented = true; }; for (const fn of handlers[owner][type] || []) fn(event); return event; };
  return {
    ...context.__gameTest, ids, doc, storage,
    frame(count = 1) { for (let i = 0; i < count; i++) { clock += 16; frame(); } },
    click(action, panel = 'menu') { elements.find((el) => el.dataset.action === action && el.panel === panel).fire('click'); },
    emit, control: (key) => elements.find((el) => el.dataset.control === key),
    key(key, target = ids.get('game'), type = 'keydown') { return emit('window', type, { key, target }); },
  };
}

const h = harness();
h.frame(2);
assert.equal(h.ids.get('gameShell').dataset.screen, 'menu');
assert.equal(h.ids.get('gameOverlay').hidden, false);
h.click('settings');
assert.equal(h.game.screen, 'settings');
h.click('menu', 'settings');
h.click('ranking');
assert.equal(h.ids.get('rankingList').children.length, 1);
h.click('menu', 'ranking');
h.click('start');
assert.equal(h.game.screen, 'play');
assert.equal(h.ids.get('gameOverlay').hidden, true);
assert.equal(h.doc.activeElement, h.ids.get('game'));
const initialX = h.game.player.x;
assert.equal(h.key('ArrowRight').defaultPrevented, true);
h.frame(8);
h.key('ArrowRight', undefined, 'keyup');
assert(h.game.player.x > initialX);
h.key('p'); h.frame(); h.key('p', undefined, 'keyup');
assert.equal(h.game.screen, 'pause');
const pauseTime = h.game.timeSurvived;
h.frame(80);
assert.equal(h.game.timeSurvived, pauseTime);
h.click('resume', 'pause');
assert.equal(h.game.screen, 'play');
const canvas = h.ids.get('game');
const dragX = h.game.player.x;
canvas.fire('pointerdown', { pointerId: 2, clientX: 100, clientY: 100 });
canvas.fire('pointermove', { pointerId: 2, clientX: 150, clientY: 100 });
assert(h.game.player.x > dragX);
canvas.fire('pointerup', { pointerId: 2 });
h.control('shift').fire('pointerdown', { pointerId: 3 }); h.frame();
assert.equal(h.game.player.shieldActive, true);
h.control('shift').fire('pointerup', { pointerId: 3 }); h.frame();
assert.equal(h.game.player.shieldActive, false);
h.applyPowerup('laser');
h.control(' ').fire('pointerdown', { pointerId: 4 }); h.frame();
assert.equal(h.game.player.superLaserActive, true);
h.control(' ').fire('pointercancel', { pointerId: 4 });
assert.equal(h.keys.has(' '), false);
h.doc.hidden = true; h.emit('document', 'visibilitychange');
assert.equal(h.game.screen, 'pause');
h.doc.hidden = false; h.emit('document', 'visibilitychange');
h.click('resume', 'pause');
const external = { isGame: false }; h.doc.activeElement = external;
h.emit('document', 'focusin', { target: external });
assert.equal(h.game.screen, 'pause');
assert.equal(h.doc.activeElement, external);
assert.equal(h.key('ArrowDown', external).defaultPrevented, undefined);
h.click('resume', 'pause');
h.game.score = 456; h.game.player.hp = -1; h.frame();
assert.equal(h.game.screen, 'gameover');
assert.equal(h.loadRanking()[0].score, 456);
h.click('restart', 'result');
assert.equal(h.game.screen, 'play');
assert.equal(h.game.score, 0);
h.game.finalBossSpawned = true; h.game.finalBossDefeated = true; h.frame();
assert.equal(h.game.screen, 'victory');
h.click('restart', 'result');
assert.equal(h.game.loopLevel, 1);
const broken = harness({ elite_star_defender_settings_v1: '{"musicVol":900,"sfxVol":null,"difficulty":"bogus","audioOn":"yes"}', elite_star_defender_ranking_v1: '[null,{"score":8,"when":"invalid"},{"score":9,"when":"2026-01-01T00:00:00.000Z"}]' });
assert.equal(broken.settings.musicVol, 1);
assert.equal(broken.settings.sfxVol, .7);
assert.equal(broken.settings.difficulty, 'Normal');
assert.equal(broken.loadRanking().length, 1);
const blocked = harness({}, true); blocked.click('start'); blocked.game.player.hp = -1; blocked.frame();
assert.equal(blocked.game.screen, 'gameover');
assert.equal(blocked.loadRanking().length, 1);
assert(blocked.ids.get('gameNotice').textContent.includes('Armazenamento'));
const calm = harness({}, false, true); const starY = calm.game.stars[0].y; calm.frame(3);
assert.equal(calm.game.stars[0].y, starY);
console.log('PASS: menu/settings/ranking, start, movement, pause/resume, pointer drag, touch shield/laser, visibility/focus, keyboard isolation, results/restart/next cycle, malformed/blocked storage, reduced motion.');
