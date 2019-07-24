import React from 'react'

export default function Product({
  className,
  id, 
  'src:small': src,
  name,
  quantity,
  'currency:symbol': currency,
  price
}) {
  return [
    <img 
      key={id + ':img'}
      className={className + ' Image'}
      src={src}
      alt={name}
    />,
    <div
      key={id + ':description'}
      className={className + ' Description'}
    >
      {name} x{quantity || 1}
    </div>,
    <div
      key={id + ':price:old'}
      className={className + ' Price Old'}
    >{[
      +price, currency
    ].join(' ')}</div>,
    <div
      key={id + ':price:new'}
      className={className + ' Price New'}
    >{[
      +price, currency
    ].join(' ')}</div>
  ]
}
