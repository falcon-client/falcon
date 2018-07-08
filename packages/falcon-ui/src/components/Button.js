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

const defaultStyle = {
  color: '#fff',
  backgroundColor: '#6c757d',
  border: '1px solid #6c757d',
  textAlign: 'center',
  borderRadius: '8px'
};

export default function Button(props: Props) {
  const { disabled, className, style, children } = props;

  return (
    <button disabled={disabled} className={className} style={style || defaultStyle}>
      {children}
    </button>
  );
}
