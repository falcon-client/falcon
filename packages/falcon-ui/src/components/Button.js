import * as React from 'react';

type Props = {
  color: string,
  disabled: boolean,
  onClick: ?Function,
  className: ?string,
  style: ?Object,
  children: ?[React.Node]
};

Button.defaultProps = {
  color: '#fff',
  disabled: false
};

export default function Button(props: Props) {
  const { disabled, className, style, children } = props;

  return (
    <button disabled={disabled} className="Button">
      {children}
    </button>
  );
}
