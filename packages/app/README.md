OBJECTIVE: get to point where styles panel can be created in Tandem

TODAY:

- wire up resizer

TOMORROW (WED):

- document gutter
- selecting document (from gutter)
- persist moving document

TODO:

- wire up resizer
- document gutter
- document title
- persist moving document
- persist resizing document
- create new document (randomly generate component name)
- copy + paste component to create variant


NUANCE:

- resizer
  - center resize
  - keep aspect ratio

- resizer
  - resize elements

- artboard tool (A key)
- rectangle tool (R key)
  - should be able to insert into artboard
  - should be able to insert into other rectangles

- style pane
  - background color
  - position
  - size
- insert new elements
- layers pane
  - move elements around
- navigator pane
- load dependencies from other files
- load dependency graph from file directory (scan for PC files)
- load initial file based on file directory
- start persisting changes to dependency graph


POLISH (after MVP):

- zoom
- pixel grid
- remove *Component from name

IMMEDIATE:

- [ ] web workers for editing files
- [ ] get canvas to state where HiFi components can be create with D&D interface
  - [ ] measurement tools
  - [ ] grid tool
  - [ ] resizer
  - [ ] drop box tool (div)

GOALS:

- [ ] MUST be runnable on the web
- [ ] ability to create hifi mock-ups like in sketch
  - [ ] product should eventually support SVG, but this is NOT an MVP feature
- [ ] ability to create variants
- [ ] web worker for compiling pc components
- [ ] ability to edit any file
  - [ ] PC files in split view (like vscode)
  - [ ] markdown (plain text)

TODOS:

- [ ] color picker
  - [ ] swatches

- [ ] start on components -- create single page of all examples
- [ ] components (in order of importance)
  - [ ] left gutter
    - [ ] file navigator
    - [ ] open files
      - [ ] show selectable objects (components, styles )
    - [ ] Layers (part of open files?)
  - [ ] toolbar
    - [ ] artboard tool
    - [ ] text tool
    - [ ] insert component tool (native, or custom)
  - [ ] right gutter
     - [ ] element settings
     - [ ] element style
  - [ ] css inspector
  - [ ] context menu
  - [ ] canvas
    - [ ] measurement
    - [ ] grid (zoomed in)
    - [ ] resizer
  - [ ] atoms
    - [ ] measurement input
      - [ ] scrollable
    - [ ] input


QUESTIONS:

- [ ] possible to make pretty style pane similar to inspector? Could be _all_ styles combined. Quick shortcuts for things like background, typography, shadows.
  - [ ] needs to be visually present


- [ ] core
  - [ ] web worker

