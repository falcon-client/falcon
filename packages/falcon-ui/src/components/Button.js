import * as React from 'react';

type Props = {
  disabled: ?boolean,
  className: ?string,
  style: ?Object,
  children: ?[React.Node],
  onClick: ?Function,
  e2eData: ?string
};

Button.defaultProps = {
  disabled: false
};

export default function Button(props: Props) {
  const { disabled, className, style, children, onClick, e2eData } = props;

  return (
    <button
      disabled={disabled}
      e2eData={e2eData}
      className={`Button ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
