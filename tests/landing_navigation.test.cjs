const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/ctrlf_video/static/app.js', 'utf8');
const start = source.indexOf('document.querySelector(".skip-link")?.addEventListener');
const end = source.indexOf('\n$("agent-launcher")', start);
function click({ landing, recorded }) {
  const calls = [];
  let handler;
  vm.runInNewContext(source.slice(start, end), {
    document: { querySelector: () => ({ addEventListener: (_, fn) => { handler = fn; } }) },
    window: { CtrlFVideoRecordedExample: { active: () => recorded } },
    $: id => id === 'research-welcome' ? { hidden: !landing } : {
      focus: () => calls.push('title-focus'), scrollIntoView: () => calls.push('title-scroll'),
    },
    setChatOpen: () => calls.push('composer'),
  });
  handler({ preventDefault: () => calls.push('prevent') });
  return calls;
}
test('landing skip focuses the visible heading without opening the inert workspace', () => {
  assert.deepEqual(click({landing:true,recorded:false}), ['prevent','title-focus','title-scroll']);
});
test('skip preserves workspace behavior and leaves public-example focus to its own handler', () => {
  assert.deepEqual(click({landing:false,recorded:false}), ['prevent','composer']);
  assert.deepEqual(click({landing:true,recorded:true}), []);
});
