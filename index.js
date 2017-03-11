import dot from 'dot-object';

dot.override = true;

function differenceOffset(first, second) {
  var longest = first.length > second.length ? first : second;
  for (let character in longest) {
    if (first[character] !== second[character])
      return parseInt(character, 10);
  }
  return longest.length;
}

export default function animator(obj, timeline, callback = null, infinite = true) {
  let previousEnd = 0,
    previousStart = 0,
    framesLeft = timeline.length,
    taggedSecs = {};
  for (let frame of timeline) {
    let [secs, property, value, method] = frame,
      tag = null;
    if (secs.toString().indexOf(':') > -1)
      [secs, tag] = secs.split(':');

    if (secs.toString().indexOf('+') > -1) {
      secs = parseFloat(secs.substring(secs.indexOf('+') + 1)) +
                (secs.indexOf('+') === 0 ? previousEnd : taggedSecs[secs.substring(0, secs.indexOf('+'))]);
    } else if (secs.toString().indexOf('=') > -1) {
      secs = secs.length === 1 ? previousStart : taggedSecs[secs.substring(1)];
    }
    previousStart = secs;
    if (dot.pick(property, obj) && method === 'type') {
      let removedChargs = 0,
        original = dot.pick(property, obj) || '',
        addedChars = 0,
        offset = differenceOffset(dot.pick(property, obj), value);

      if (original.length > offset)
        removedChargs = original.length - offset;

      if (value.length > offset)
        addedChars = value.length - offset;

      previousEnd = ((removedChargs + addedChars) * 0.07) + secs;
    } else {
      previousEnd = method === 'type' ? ((value.length * 0.07) + secs) : secs;
    }
    if (tag)
      taggedSecs[tag] = previousEnd;

    setTimeout((function (property, value, method) {
      return function () {
        if (value === undefined) {
          dot.del(property, obj);
        } else if (method === 'type') {
          let original = dot.pick(property, obj) || '',
            offset = differenceOffset(original, value),
            changesCount = 0;

          if (original.length > offset) {
            for (let char = original.length; char >= offset; char--) {
              framesLeft++;
              setTimeout(function () {
                dot.str(property, original.substring(0, char), obj);
                if (callback) callback(obj);
                framesLeft--;
                if (framesLeft === 0 && infinite)
                  animator(obj, timeline, callback, infinite);
              }, 70 * changesCount);
              changesCount++;
            }
          }
          if (value.length > offset) {
            for (let char = offset; char <= value.length; char++) {
              framesLeft++;
              setTimeout(function () {
                dot.str(property, value.substring(0, char), obj);
                if (callback) callback(obj);
                framesLeft--;
                if (framesLeft === 0 && infinite)
                  animator(obj, timeline, callback, infinite);
              }, 70 * changesCount);
              changesCount++;
            }
          }
        } else {
          dot.str(property, value, obj);
          if (callback) callback(obj);
        }
        framesLeft--;
        if (framesLeft === 0 && infinite)
          animator(obj, timeline, callback, infinite);
      };
    })(property, value, method), secs * 1000);
  }
}
