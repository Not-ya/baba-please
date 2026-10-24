// Audit the real quiz data and grader extracted from the deployed index.html.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
new vm.Script(script, {filename: 'embedded-site-script.js'});
const found = script.match(/const qs=(\[[\s\S]*?\]);\s*(function gradeQuiz\(selected\)\{[^}]+\})/);
assert.ok(found, 'The quiz questions and grading function must exist together.');
const sandbox = {};
vm.runInNewContext('const qs=' + found[1] + ';' + found[2] + ';globalThis.audit={qs,gradeQuiz}', sandbox);
const {qs, gradeQuiz} = sandbox.audit;
const expectedKeys = [0,1,2,0,3];
assert.equal(qs.length, 5, 'Five questions expected');
assert.deepEqual(qs.map(q => q[2]).join(','), expectedKeys.join(','), 'Answer key A/B/C/A/D');
assert.deepEqual(qs.map(q => q[1][q[2]]).join('|'), ['4 A','10 Ω','12 V','Current','36 W'].join('|'), 'Physics answers');
assert.equal(gradeQuiz(expectedKeys), 5, 'All correct yields 5/5');
assert.equal(gradeQuiz(expectedKeys.map(a => (a + 1) % 4)), 0, 'All incorrect yields 0/5');
assert.equal(gradeQuiz([]), 0, 'Missing answers get no credit');
let trials = 0;
for (let q = 0; q < qs.length; q++) {
  for (let option = 0; option < 4; option++) {
    const selection = [undefined, undefined, undefined, undefined, undefined];
    selection[q] = option;
    assert.equal(gradeQuiz(selection), Number(option === expectedKeys[q]),
      'Q' + (q+1) + ' option ' + 'ABCD'[option]);
    trials++;
  }
}
assert.ok(html.includes('Your answer: <strong>'), 'Results show the chosen answer');
assert.ok(html.includes('Correct answer: <strong>'), 'Results show the actual correct answer');

// Run the actual browser code in a lightweight fake DOM, following the real click path.
function simulateQuiz(sequence, changeFirstAnswer = false) {
  const app = {innerHTML: ''};
  const nodes = new Map([['app', app]]);
  const saved = new Map();
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {innerHTML: '', textContent: '', className: ''});
      return nodes.get(id);
    },
    documentElement: {requestFullscreen: () => Promise.resolve()}
  };
  const context = vm.createContext({
    document, window: {BABA_CONFIG: {}},
    crypto: {randomUUID: () => '00000000-0000-4000-8000-000000000001'},
    localStorage: {
      getItem: key => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
      removeItem: key => saved.delete(key)
    },
    setInterval: () => 1, clearInterval: () => {}, console
  });
  vm.runInContext(script, context);
  vm.runInContext('beginQuiz()', context);
  for (let i = 0; i < sequence.length; i++) {
    if (i === 0 && changeFirstAnswer) vm.runInContext('selectAnswer(1)', context);
    vm.runInContext('selectAnswer(' + sequence[i] + ');nextQuestion()', context);
  }
  return {
    score: vm.runInContext('score', context),
    stage: vm.runInContext('stage', context),
    answers: vm.runInContext('answers', context).join(','),
    html: app.innerHTML
  };
}
const perfect = simulateQuiz(expectedKeys, true);
assert.equal(perfect.score, 5, 'Clicking through all correct answers earns full marks');
assert.equal(perfect.stage, 'result', 'Click flow ends on score screen');
assert.equal(perfect.answers, expectedKeys.join(','), 'Changing a selection keeps the last choice');
assert.ok(perfect.html.includes('5<span'), 'Result screen displays 5/5');
assert.ok(perfect.html.includes('Your answer:'), 'Shows actual chosen answer');
const zero = simulateQuiz(expectedKeys.map(a => (a+1)%4));
assert.equal(zero.score, 0, 'Clicking five wrong answers yields 0/5');
const mixed = simulateQuiz([0,1,1,0,0]);
assert.equal(mixed.score, 3, 'Mixed answers produce exactly 3/5');

console.log('PASS: script parses, all 5 answer keys correct, 5/5, 0/5, blanks, all ' + trials + ' individual answer choices, clear results, and full quiz click-flow simulation.');
