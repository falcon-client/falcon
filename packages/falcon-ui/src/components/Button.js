import React from 'react';

const defaultProps = {
  color: 'secondary',
  tag: 'button'
};

class Button extends React.Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    if (this.props.disabled) {
      e.preventDefault();
      return;
    }

    if (this.props.onClick) {
      this.props.onClick(e);
    }
  }

  render() {
    let {
      active,
      block,
      className,
      cssModule,
      color,
      outline,
      size,
      tag: Tag,
      innerRef,
      ...attributes
    } = this.props;

    const classes = mapToCssModules(
      classNames(
        className,
        'btn',
        `btn${outline ? '-outline' : ''}-${color}`,
        size ? `btn-${size}` : false,
        block ? 'btn-block' : false,
        { active, disabled: this.props.disabled }
      ),
      cssModule
    );

    if (attributes.href && Tag === 'button') {
      Tag = 'a';
    }

    return <h1>kek</h1>;
  }
}

Button.propTypes = propTypes;
Button.defaultProps = defaultProps;

export default Button;
