import React from 'react'
import Product from './Product'

const content = {
  title: "סיכום פרטי הזמנה",
  total: "סה”כ תשלום"
}

export default function Order ({items}) {
  const itemsArray = Array.isArray(items) ? items : [items],
    currency = itemsArray[0]['currency:symbol']
  return <div
    className="Order"
  >{[
    <div key="Title" className="Title">{content.title}</div>,
    itemsArray.map(data =>
      <Product key={data.id} className="Product" {...data}/>
    ),
    <div key="Line" className="Line" height="1px"/>,
    <div key="Label" className="Sum Label">{content.total}</div>,
    <div key="Price" className="Sum Price">{[
      itemsArray.reduce((acc, {price = 0, quantity = 1}) => (+price) * (+quantity) + acc, 0),
      currency
    ].join(' ')}</div>
  ]}</div>
}
