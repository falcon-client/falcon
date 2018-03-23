function Viz(src) {
  const options =
    arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  const format = options.format === undefined ? 'svg' : options.format;
  const engine = options.engine === undefined ? 'dot' : options.engine;
  const scale = options.scale;
  const totalMemory = options.totalMemory;
  const files = options.files === undefined ? [] : options.files;
  const images = options.images === undefined ? [] : options.images;
  let i;

  for (i = 0; i < images.length; i++) {
    files.push({
      path: images[i].path,
      data: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg width="${
        images[i].width
      }" height="${images[i].height}"></svg>`
    });
  }

  if (format == 'png-image-element') {
    return Viz.svgXmlToPngImageElement(
      render(src, 'svg', engine, totalMemory, files),
      scale
    );
  }
  return render(src, format, engine, totalMemory, files);
}

function render(src, format, engine, totalMemory, files) {
  const graphviz = Module({ TOTAL_MEMORY: totalMemory });
  let i;

  for (i = 0; i < files.length; i++) {
    graphviz.ccall(
      'vizCreateFile',
      'number',
      ['string', 'string'],
      [files[i].path, files[i].data]
    );
  }

  const resultPointer = graphviz.ccall(
    'vizRenderFromString',
    'number',
    ['string', 'string', 'string'],
    [src, format, engine]
  );
  const resultString = graphviz.Pointer_stringify(resultPointer);

  const errorMessagePointer = graphviz.ccall(
    'vizLastErrorMessage',
    'number',
    [],
    []
  );
  const errorMessageString = graphviz.Pointer_stringify(errorMessagePointer);

  if (errorMessageString != '') {
    throw new Error(errorMessageString);
  }

  return resultString;
}

// https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
function b64EncodeUnicode(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
      String.fromCharCode(`0x${p1}`)
    )
  );
}

Viz.svgXmlToPngImageElement = function(svgXml, scale, callback) {
  if (scale === undefined) {
    if ('devicePixelRatio' in window && window.devicePixelRatio > 1) {
      scale = window.devicePixelRatio;
    } else {
      scale = 1;
    }
  }

  const pngImage = new Image();

  try {
    if (typeof fabric === 'object' && fabric.loadSVGFromString) {
      fabric.loadSVGFromString(svgXml, (objects, options) => {
        // If there's something wrong with the SVG, Fabric may return an empty array of objects. Graphviz appears to give us at least one <g> element back even given an empty graph, so we will assume an error in this case.
        if (objects.length == 0) {
          if (callback !== undefined) {
            callback(new Error('Error loading SVG with Fabric'));
            return;
          }
          throw new Error('Error loading SVG with Fabric');
        }

        const element = document.createElement('canvas');
        element.width = options.width;
        element.height = options.height;

        const canvas = new fabric.Canvas(element, {
          enableRetinaScaling: false
        });
        const obj = fabric.util.groupSVGElements(objects, options);
        canvas.add(obj).renderAll();

        pngImage.src = canvas.toDataURL({ multiplier: scale });
        pngImage.width = options.width;
        pngImage.height = options.height;

        if (callback !== undefined) {
          callback(null, pngImage);
        }
      });
    } else {
      const svgImage = new Image();

      svgImage.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = svgImage.width * scale;
        canvas.height = svgImage.height * scale;

        const context = canvas.getContext('2d');
        context.drawImage(svgImage, 0, 0, canvas.width, canvas.height);

        pngImage.src = canvas.toDataURL('image/png');
        pngImage.width = svgImage.width;
        pngImage.height = svgImage.height;

        if (callback !== undefined) {
          callback(null, pngImage);
        }
      };

      svgImage.onerror = function(e) {
        let error;

        if ('error' in e) {
          error = e.error;
        } else {
          error = new Error('Error loading SVG');
        }

        if (callback !== undefined) {
          callback(error);
        } else {
          throw error;
        }
      };

      svgImage.src = `data:image/svg+xml;base64,${b64EncodeUnicode(svgXml)}`;
    }
  } catch (e) {
    if (callback !== undefined) {
      callback(e);
    } else {
      throw e;
    }
  }

  if (callback === undefined) {
    return pngImage;
  }
};

Viz.svgXmlToPngBase64 = function(svgXml, scale, callback) {
  Viz.svgXmlToPngImageElement(svgXml, scale, (err, image) => {
    if (err) {
      callback(err);
    } else {
      callback(null, image.src.slice('data:image/png;base64,'.length));
    }
  });
};
