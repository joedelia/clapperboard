import dot from 'dot-object';
import cloneDeep from 'lodash/cloneDeep.js';

dot.override = true;

function differenceOffset(first, second) {
  const longest = first.length > second.length ? first : second;
  for (const character in longest) {
    if (first[character] !== second[character])
      return Number.parseInt(character, 10);
  }

  return longest.length;
}

export default function animator(initialObject, timeline, callback, infinite = true) {
  let done = false;

  setTimeout(async () => {
    while (!done) { // eslint-disable-line no-unmodified-loop-condition
      const taggedSecs = {},
        object = cloneDeep(initialObject);
      let framesLeft = timeline.length,
        previousEnd = 0,
        previousStart = 0,
        loopDone;

      callback(object);

      for (const frame of timeline) {
        let [secs, property, value, method] = frame,
          tag = null,
          methodTime = null;
        if (secs.toString().includes(':'))
          [secs, tag] = secs.split(':');

        if (secs.toString().includes('+')) {
          secs = Number.parseFloat(secs.slice(Math.max(0, secs.indexOf('+') + 1)))
                + (secs.indexOf('+') === 0 ? previousEnd : taggedSecs[secs.slice(0, Math.max(0, secs.indexOf('+')))]);
        } else if (secs.toString().includes('=')) {
          secs = secs.length === 1 ? previousStart : taggedSecs[secs.slice(1)];
        }

        previousStart = secs;
        if (method && method.startsWith('type')) {
          methodTime = Number.parseFloat(method.split(':')[1] || '0.07');
          method = 'type';
        }

        if (dot.pick(property, object) && method === 'type') {
          const original = dot.pick(property, object) || '',
            offset = differenceOffset(dot.pick(property, object), value);

          let removedChars = 0,
            addedChars = 0;

          if (original.length > offset)
            removedChars = original.length - offset;

          if (value.length > offset)
            addedChars = value.length - offset;

          previousEnd = ((removedChars + addedChars) * methodTime) + secs;
        } else {
          previousEnd = method === 'type' ? ((value.length * methodTime) + secs) : secs;
        }

        if (tag)
          taggedSecs[tag] = previousEnd;

        setTimeout(() => {
          if (done) return;

          if (value === undefined) {
            dot.del(property, object);
          } else if (method === 'type') {
            const original = dot.pick(property, object) || '',
              offset = differenceOffset(original, value);
            let changesCount = 0;

            if (original.length > offset) {
              for (let char = original.length; char >= offset; char--) {
                framesLeft++;
                setTimeout(() => {
                  if (done) return;

                  dot.str(property, original.slice(0, Math.max(0, char)), object);
                  callback(object);
                  framesLeft--;
                  if (framesLeft === 0) loopDone();
                }, methodTime * changesCount * 1000);
                changesCount++;
              }
            }

            if (value.length > offset) {
              for (let char = offset; char <= value.length; char++) {
                framesLeft++;
                setTimeout(() => {
                  if (done) return;

                  dot.str(property, value.slice(0, Math.max(0, char)), object);
                  callback(object);
                  framesLeft--;
                  if (framesLeft === 0) loopDone();
                }, methodTime * changesCount * 1000);
                changesCount++;
              }
            }
          } else {
            dot.str(property, value, object);
            callback(object);
          }

          framesLeft--;
          if (framesLeft === 0) loopDone();
        }, secs * 1000);
      }

      await new Promise(resolve => { // eslint-disable-line no-await-in-loop
        loopDone = resolve;
      });
      if (!infinite) return;
    }
  }, 0);

  const terminate = () => {
    done = true;
  };

  return terminate;
}
