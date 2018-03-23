QUnit.module('png');

QUnit.test('png-image-element format returns an image element', assert => {
  const done = assert.async();

  const image = Viz('digraph { a -> b; }', { format: 'png-image-element' });

  assert.ok(image instanceof Image, 'image should be an Image');

  image.onload = function() {
    done();
  };
});

QUnit.test(
  'png-image-element format works correctly with characters outside of basic ASCII',
  assert => {
    const done = assert.async();

    const image = Viz('digraph { α -> β; }', { format: 'png-image-element' });

    assert.ok(image instanceof Image, 'image should be an Image');

    image.onload = function() {
      done();
    };
  }
);

QUnit.test(
  "specifying the scale option should change the resulting image's natural size",
  assert => {
    const done = assert.async();

    const image = Viz('digraph { size="1,1!"; a -> b; }', {
      format: 'png-image-element',
      scale: 3
    });

    image.onload = function() {
      assert.equal(image.height, 96);
      assert.equal(image.naturalHeight, 288);
      done();
    };
  }
);

QUnit.test('asking for plain png format should throw an exception', assert => {
  assert.throws(() => {
    Viz('digraph { a -> b; }', { format: 'png' });
  }, /renderer for png is unavailable/);
});

QUnit.test(
  'svgXmlToPngImageElement calls callback with image element',
  assert => {
    const done = assert.async();

    const xml = Viz('digraph { a -> b; }', { format: 'svg' });

    const nothing = Viz.svgXmlToPngImageElement(xml, 2, (err, image) => {
      assert.ok(image instanceof Image, 'image should be an Image');
      done();
    });

    assert.equal(
      undefined,
      nothing,
      'svgXmlToPngImageElement should return undefined if called with a callback'
    );
  }
);

QUnit.test(
  'svgXmlToPngImageElement calls callback with error for bad SVG',
  assert => {
    const done = assert.async();

    const nothing = Viz.svgXmlToPngImageElement('not svg', 2, (err, image) => {
      assert.notEqual(err, null);
      done();
    });
  }
);

QUnit.test(
  'svgXmlToPngBase64 calls callback with base64 encoded PNG data',
  assert => {
    const done = assert.async();

    const xml = Viz('digraph { a -> b; }', { format: 'svg' });

    Viz.svgXmlToPngBase64(xml, 2, (err, data) => {
      assert.equal(err, null);
      assert.equal(data.slice(0, 6), 'iVBORw');
      done();
    });
  }
);

QUnit.test(
  'svgXmlToPngBase64 calls callback with error for bad SVG',
  assert => {
    const done = assert.async();

    Viz.svgXmlToPngBase64('not svg', 2, (err, data) => {
      assert.notEqual(err, null);
      done();
    });
  }
);
