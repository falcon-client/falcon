QUnit.module('svg');

QUnit.test('svg output includes the correct labels', assert => {
  const result = Viz('digraph { a -> b; }', { format: 'svg' });
  const element = document.createElement('div');
  element.innerHTML = result;

  assert.equal(element.querySelector('g#node1 text').textContent, 'a');
  assert.equal(element.querySelector('g#node2 text').textContent, 'b');
});
