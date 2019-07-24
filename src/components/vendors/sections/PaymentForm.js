import React from 'react'

import Form from '../elements/Form'
import Modal from '../elements/Modal';

import {openWindowFromForm, openWindow} from '../utils'
export default class PaymentForm extends React.Component {
  timeout;
  interval = 0;
  state = {
    disabled: false,
    cancelButton: false
  }
  timediff = null;

  setIsOpen = (value) => {
    this.setState({ isOpen: value });
  };

  showModal = () => {
    this.setIsOpen(true)
  }

  hideModal = () => {
    this.setIsOpen(false);
  }

  _id = ''
  set id(value) {
    if (this._id === value || value === "") return;
    this.result.tmstmp = 0
    this._id = value
    if (this.props.listenResult) {
      this.resultAwait()
    }
  }
  get id() {
    return this._id
  }    

  dataId = ''

  result = {
    get: new XMLHttpRequest(),
    // Listened until this time
    tmstmp: 0
  }

  exchangeUrl = ''

  _fetch(url, params) {
    return !url
    ? Promise.reject()
    : fetch(url, params)
  }

  get exchangeResultUrl() {
    const {
      exchangeUrl = '',
      id = '',
      props: {
        categories: {
          result = ''
        }
      }
    } = this
    return exchangeUrl === '' ? '' : `${exchangeUrl}/${id}/${result}`
  }

  fetchResult(params) {
    return this._fetch(this.exchangeResultUrl, params)
  }
  pushResult(body, method = 'POST') {
    return this.fetchResult({
      method,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Request-Date': new Date(Date.now() + this.timediff).toUTCString()
      },
      body
    })
    .then(response => response.text())
  }

  fetchData(params) {
    const {
      exchangeUrl = '',
      dataId,
      props: {
        categories: {
          data = ''
        }
      }
    } = this
    return this._fetch(`${exchangeUrl}/${dataId}/${data}`, params)
  }  
  saveData(data) {
    let body = {}
    Object.assign(body, data, {id: this.id});
    delete body.process;
    body = JSON.stringify(body)
    return this.fetchData({
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Request-Date': new Date(Date.now() + this.timediff).toUTCString()
      },
      body
    })
    .then(response => response.text())
    // :int means everything OK - bytes count returned , === 0 means ok but now
    .catch(console.error)
  }

  resultAwait(status) {
    if (!this.props.categories.result)
      return;
    const {timediff, result: {get: xhttp, tmstmp}} = this
    xhttp.abort()
    const exchangeResultUrl = this.exchangeResultUrl
    if (!exchangeResultUrl)
      return;
    const timeoutFn = () => setTimeout(
      () => {
        xhttp.open('GET', this.exchangeResultUrl, true)
        xhttp.setRequestHeader('Content-Type', 'application/json')
        xhttp.setRequestHeader('Request-Date', (new Date(tmstmp + timediff)).toUTCString())
        xhttp.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
        xhttp.setRequestHeader('Cache-Control', 'max-age=0');
        xhttp.setRequestHeader('Expires', '0');
        xhttp.setRequestHeader('Expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
        xhttp.setRequestHeader('Pragma', 'no-cache');        
        xhttp.send()
      },
      this.interval
    )
    if (!document.hidden)
      timeoutFn()
    else
      document.addEventListener('visibilitychange', () => this.resultAwait(status));
  }

  eventHolder = document.createElement('div')

  constructor(props) {
    super(props)
    const {
      data = {},
      parent_origin,
      alerting = false,
      schema: {
        iframeInWindow,
        interval = 0,
        data$url = '',
        account = ''
      },
      listenResult = false
    } = this.props,
      now = () => this.result.tmstmp = Date.now(),
      {id = '', dataId} = data

    this._id = id;
    this.dataId = dataId || id;
    this.interval = interval;
    this.exchangeUrl = `${data$url}${account}`;

    ['_fetch', 'resultAwait', 'fetchData', 'fetchResult', 'pushResult', 'handleCancel', 'saveData']
    .forEach(fn => this[fn] = this[fn].bind(this));


    if (listenResult) {
      const {resultAwait} = this,
        hideModal = () => this.hideModal(),
        showCancel = () => {
          const {cancelDelay} = this.props.schema;
          if (!cancelDelay)
            return;
          clearTimeout(this.timeout)
          this.timeout = setTimeout(() => this.setState({cancelButton: true}), cancelDelay)
        }
      this.result.get.onabort = function() {
        // despite status - maybe better status != 0 and call onerror
        if (this.status !== 0)
          now()
      };
      const setTimeDiff = diff => {
          if (this.timediff === null) 
            this.timediff = diff
        },
        getTmstmp = () => this.result.tmstmp

      this.result.get.onreadystatechange = function() {
        if (this.readyState !== 4)
          return;
        if (this.status === 200) {
          window.parent.postMessage(this.responseText, parent_origin)
          try {
            const response = JSON.parse(this.responseText)
            now()
            hideModal();

            response.success *= 1
            response.success = [0, 1, -1].includes(response.success)
            ? response.success
            : 0;
            if (response.success === -1 && iframeInWindow && 'quizUrl' in response && response.quizUrl) {
              openWindow(response.quizUrl)
              showCancel()
              //resultAwait()
            } else if (iframeInWindow && 'form:action' in response && response['form:action']) {
              openWindowFromForm(response)
              showCancel()
              //resultAwait()
            } else if (alerting && window === window.parent && [0, 1].includes(response.success)) 
              window.alert([
                ['Declined', 'Accepted'][parseInt(response.success)],
                ...Object.keys(response)
                .filter(key => key.startsWith('return:message'))
                .map(key => response[key])
              ].join("\n"))
          } catch (e) {}
        }
        if (this.status !== 0) {
          const reqDate = Date.parse(this.getResponseHeader('Request-Date')) || getTmstmp(),
            resDate = Date.parse(this.getResponseHeader('Date'))
          if (reqDate)
            setTimeDiff(resDate - reqDate)
          resultAwait(this.status)
        }
      }
    }

    const {eventHolder} = this;
    eventHolder.dispatchData = (data) =>
      eventHolder.dispatchEvent(new CustomEvent('dataInjecting', {detail: data}))
    eventHolder.setDisable = (disable) =>
      eventHolder.dispatchEvent(new CustomEvent('disable', {detail: disable}))

    window.addEventListener('message', ev => {
      if (![parent_origin, window.location.origin].includes(ev.origin) || ev.data === '')
        return;
      try {
        eventHolder.dispatchData(JSON.parse(ev.data))
      } catch (e) {
        //Data in message is not JSON. Okay
      }
    })
  }

  handleCancel() {
    this.pushResult(JSON.stringify({
      success: 0,
      'return:message': 'Agent canceled',
      'tmstmp': (new Date()).toString()
    }))
  }

  componentDidMount() {
    this.eventHolder.dispatchData(this.props.data)
    if (this.props.listenResult) {
      this.result.tmstmp = 0
      this.resultAwait();
    }
    const {eventHolder, props: {data$url}} = this
    if (data$url === '')
      return;
    this.fetchData({
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Request-Date': (new Date(0)).toUTCString()
      }
    }).then(response => response.json())
    .then(response => eventHolder.dispatchData(response))
    .catch(console.error)
  }

  componentWillUnmount() {
    clearTimeout(this.timeout)
    this.result.get.abort()
  }

  render() {
    const {isOpen } = this.state;

    const {
      pushResult,
      eventHolder,
      saveData,
      props: {
        schema: {
          account,
          inputs,
          cancelText
          },
        rKey,
        parentKey,
        duringConstruct
      },
    } = this,
      stageHandler = (success, message) =>
        data => {
          pushResult(JSON.stringify(Object.assign({},
            data,
            {
              success,
              'return:message': message
            }
          )))
          const id$absolute = data['id:absolute'] || [account, data.id].join('/')
          return {
            data: {
              [id$absolute]: null
            }
          }
        }

    const formProps = {
      inputs,
      key: rKey,
      rKey: rKey,
      parentKey,
      duringConstruct,
      injector: eventHolder,
      className: 'Form',
      beforeshare: data => {
        //eventHolder.setDisable(true)
        this.showModal();
        saveData(data)
        return {
          data: {
            [[account, this.id].join('/')]: Object.assign({}, data, {id: this.id})
            }
          }
      },
      
      beforepay: data => {
        this.showModal();
        saveData(data)
        return {data: Object.assign({}, data, {id: this.id})}
      },
      afterpay: body => pushResult(body),
      afterredsys: body => {
        try {
          openWindowFromForm(JSON.parse(body))
        } finally {}
      },

      //TODO: These should be handled by data in button
      beforereject: stageHandler(0, 'Declined by stage'),
      beforeapprove: stageHandler(1, 'Approved by stage') 
    }
    
    return [
      isOpen && (
        <Modal title="" text="Waiting for response" />
      ),
      <Form {...formProps}/>,
      //TODO: As a second page|frame of viewport
      !this.state.cancelButton
      ? null
      : <button type="button" onClick={this.handleCancel}>{
        cancelText 
      }</button>
    ]
  }
}
