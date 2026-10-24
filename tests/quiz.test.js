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
console.log('PASS: script parses, all 5 answer keys correct, 5/5, 0/5, blanks, all ' + trials + ' individual answer choices, clear results.');
