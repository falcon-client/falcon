QUnit.module('graphs');

QUnit.test('rendering sample graphs should not throw errors', assert => {
  const graphs = [
    './graphs/shapes.dot',
    './graphs/subgraphs.dot',
    './graphs/edge-labels.dot'
  ];

  assert.expect(graphs.length);

  graphs.forEach(url => {
    const done = assert.async();

    const request = new XMLHttpRequest();
    request.addEventListener('load', function() {
      assert.ok(Viz(this.responseText));
      done();
    });
    request.open('GET', url);
    request.send();
  });
});
