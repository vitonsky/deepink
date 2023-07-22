The package `react-markdown` provides position in markdown source text for each component,
however checkbox component receive empty position, as described in [bug that been not fixed and closed](https://github.com/remarkjs/react-markdown/issues/607).

To fix the problem and to make possible change source text by click on checkbox, we wrap child nodes for `li` element to a react context and provide to this context a source position of `li` element, then we use this position in `input` component, to find a checkbox position in source text and update checkbox state.

Thus, components `li` and `input` must be used both for component of `react-markdown` package.