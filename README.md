# clapperboard
Easily set frames to create an animation rendered from an object (like the state of a react component).

## Rationale
I found React to be a simple way of rendering an animation—whether svg or simple HTML.

With clapperboard, it is simple of scheduling updates to the React component state or props to animate it.

## Installation
Using npm:
```
npm i --save clapperboard
```

## Usage with react
Simple example of animating a browser:
```js
  import animator from 'clapperboard';
  import React from 'react';
  import ReactDOM from 'react-dom';

  class BrowserAnimation extends React.Component {
    render() {
      return (<div className="browser-animation">
        <div
          className="browser-animation__cursor"
          style={{
            top: this.state.cursor.y.toString() + '%',
            left: this.state.cursor.x.toString() + '%'
          }}
          />
        <div className="browser-animation__top-bar">
          <span className="url">{this.state.url}</span>
        </div>
        <div
          className="browser-animation__document"
          style={{
            backgroundImage: `url(${this.state.currentPage})`,
            backgroundPosition: `0 -${this.state.scrollPosition}px`
          }}
          >
        </div>
      </div>);
    }
  }

  var component; // Render BrowserAnimation and store it here.

  var initialState = {
    cursor: {
      x: 40,
      y: 20
    },
    url: 'https://acme.com/',
    currentPage: 'homepage'
  };

  component.setState(initialState);

  const timeline = [
    ['+1', 'cursor.y', 50],
    ['+0.5', 'cursor', {x: 10, y: 15}],
    ['+0.2', 'url', 'https://acme.com/sign_up', 'type'],
    ['+0.1:signUpPage', 'currentPage', 'sign_up'],
    ['=', 'scrollPosition', 0],
    // ... all the frames here
  ];

  animator(initialState, animation, function (obj) {
      component.setState(obj);
  });
```

## API
### Frames
The timeline consists of a list of frames. Each frame is a list of the following: `time`, `property`, `change`, `method`.

#### time
The time is in one of these formats:

- `+N` (where `N` is a float number of seconds): Frame will be executed `N` seconds after the previous change is complete
- `=`: Frame will be executed at the same time as the previous one

Frames can further be 'tagged':

- `timingInfo:frameName` (ex `+1:pageChanged`): The frame will be named and will be referenceable as `frameName`.
- `=frameName`: The frame will be executed at the same time as `frameName`.
- `frameName+N` (where `N` is a float number of seconds): The frame will be executed `N` seconds after `frameName`'s change
  is completed.

These can be combined, so that `sessionStart+5:sessionEnd` is a valid time.

#### property
This will be the property of the master object to be changed, in dot format.

#### change
This is what the property will be changed to.

#### method
Method can be left empty or be `type`, in which case the change will be "typed" and not immediate. This is useful to simulate user
input.

### `animator` function
The animator function will need to be called with:
- `initialState`: the object frames will apply changes to
- `frames`: the list of frames
- `callback`: a function to call after each change. It will be called with the changed object as only argument
- (optionally) `infinite`: A boolean to determine whether to run the animation as a loop (defaults to `true`)

## Big disclaimer
I'm pretty sure this stuff works, but not 100% sure. I have extracted it from an old project
as I needed it again. You're welcome to submit improvements as you see fit.
