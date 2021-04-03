/*
  Order Entry React Demo for EOSIO Training & Certification: AD101
  
  Several blocks have been commented out, as they will only
  function as intended when the UAL (Universal Authenticator Library)
  wrapper is implemented in App.js – at which point props will
  contain the ual object. Uncomment (or replace) these lines as
  appropriate.
*/

import { JsonRpc } from 'eosjs'
import * as React from 'react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import './orderentry.css';


const MySwal = withReactContent(Swal)


/*Swal.fire({
  icon: 'error',
  title: 'Oops...',
  text: 'Something went wrong!',
  footer: '<a href>Why do I have this issue?</a>'
})

MySwal.fire({
  title: <p>Hello World</p>,
  footer: 'Copyright 2018',
  didOpen: () => {
    // `MySwal` is a subclass of `Swal`
    //   with all the same instance & static methods
    MySwal.clickConfirm()
  }
})


*/
const network = {
  chainId:'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
  rpcEndpoints: [{
    protocol: 'http',
    host: 'localhost',
    port: '8888',
  }]
}


const defaultState = {
  activeUser: null, //to store user object from UAL
  accountName: '', //to store account name of logged in wallet user
  orderItems: '0',
  tablePageResult: [{userid:'', items:[], status:''}]
}

class OrderEntryApp extends React.Component {
  static displayName = 'OrderEntryApp'

  constructor(props) {
    super(props)
    this.state = {
      ...defaultState,
      rcp: new JsonRpc(`${network.protocol}://${network.host}:${network.port}`)
    }

    this.updateAccountName = this.updateAccountName.bind(this)
    this.renderOrderButton = this.renderOrderButton.bind(this)
    this.placeorder = this.placeorder.bind(this)
    this.renderModalButton = this.renderModalButton.bind(this)
    this.handleOrderUpdate = this.handleOrderUpdate.bind(this)
    this.renderOrderForm = this.renderOrderForm.bind(this)
    this.showTable = this.showTable.bind(this)
  }

  // implement code to transact, using the order details, here
  async placeorder() {
    const { accountName, activeUser, orderItems } = this.state;
    console.log(accountName, activeUser,orderItems )
    const AddOrderTransaction = {
      actions:[
        { account:accountName,
          name:'addorder',
          authorization: [ {actor:accountName, permission:activeUser.requestPermission  }],
          data:{
            userid:0,
            items:JSON.parse(`[${orderItems}]`),
            status:'pending'
          }

        }
      ]

    };
    

    try{
      const result = await activeUser.signTransaction(AddOrderTransaction, {broadcast: true});
 
      MySwal.fire({
        icon: 'success',
        title: 'Transaction Signed',
        html:  <div>
            <p><b>wasBroadcast</b>: { new Boolean(result.wasBroadcast).toString()  }</p>
            <p><b>transactionId</b>: { result.transactionId }</p>
            <p><b>status</b>:  { result.status } </p>
        </div>,
      });
     
    }catch(error){
      console.log(error);
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.message,
      });

    }

    //console.log("With UAL implemented, this submits an order for items " + JSON.parse(`[${orderItems}]`));
  }


  renderOrderButton() {
    return (
      <p className='ual-btn-wrapper'>
        <Button variant="outline-warning" onClick={this.placeorder}>
          {'Place Order'}
        </Button>
      </p>
    )
  }


  // once the UAL wrapper is implemented, the code below will function
  
  
  componentDidUpdate() {
    const { ual: { activeUser } } = this.props
    if (activeUser && !this.state.activeUser) {
      this.setState({ activeUser }, this.updateAccountName)
    } else if (!activeUser && this.state.activeUser) {
      this.setState(defaultState)
    }
  }
  
  async updateAccountName()   {
    try {
      const accountName = await this.state.activeUser.getAccountName()
      this.setState({ accountName }, this.updateAccountBalance)
    } catch (e) {
      console.warn(e)
    }
  }

  renderLogoutBtn = () => {
    const { ual: { activeUser, activeAuthenticator, logout } } = this.props
    if (!!activeUser && !!activeAuthenticator) {
      return (
        <p className='ual-btn-wrapper'>
          <Button variant='outline-danger' onClick={logout}>
            {'Logout'}
          </Button>
        </p>
      )
    }
  }

  

  renderModalButton() {
    return (
      <p className='ual-btn-wrapper'>
        <Button variant='outline-primary'
          /* Uncomment once UAL wrapper is implemented  */
          onClick={this.props.ual.showModal}
         
          className='ual-generic-button'>Connect to Wallet</Button>
      </p>
    )
  }


  handleOrderUpdate = (event) => {
    this.setState({orderItems: event.target.value});
  }

  renderOrderForm = () => {
    const { orderItems } = this.state
    return(
      <div style={{marginLeft: 'auto', marginRight:'auto', width:'25%', marginTop:'40px', marginBottom:'10px'}}>
        <Form>
          <Form.Group controlId="orderItems">
            <Form.Label>Items to order (comma separated):</Form.Label>
            <Form.Control
                  type="text"
                  name="orderItems"
                  value={orderItems}
                  onChange={this.handleOrderUpdate}
                />
          </Form.Group>
        </Form>
      </div>
    )
  }

  renderShowTableBtn(){
    return(
    <p className='ual-btn-wrapper'>
    <Button variant="outline-success" onClick={this.showTable}>
      {'Get Order Table'}
    </Button>
  </p>)

  }

  renderTable(){ 
    return (
<Table striped bordered hover variant="dark">
  <thead>
    <tr>
      <th>#</th>
      <th>userId</th>
      <th>Items</th>
      <th>status</th>
    </tr>
  </thead>
  <tbody>
     
  </tbody>
</Table>
    )

  }

  async showTable(){

    const { accountName, activeUser, orderItems } = this.state;
    console.log(activeUser)
    console.log(this.state)
    const resp = await this.state.rcp.get_table_rows(
      { json:true,
        code:activeUser.session.publicKey,
        scope:accountName,
        table:'orders',
        litmit:5
      }
    )

    console.log(resp)

  }

  render() {
    let modalButton = this.renderModalButton()
    let loggedIn = ''
    let logoutBtn = null
    const orderBtn = this.renderOrderButton()

    // Once UAL wrapper is implemented, uncomment below lines
     
    const { ual: { activeUser } } = this.props
    const { accountName } = this.state
    modalButton = !activeUser && this.renderModalButton()
    logoutBtn = this.renderLogoutBtn()
    loggedIn = accountName ? `Logged in as ${accountName}` : ''
     

    return (
      <div style={{ textAlign: 'center', paddingTop: '50px' }}>
        <h2>Order Entry React Demo</h2>
        <span>EOSIO Training & Certification, AD101</span>
        <div style={{marginBottom: '20px'}}></div>
        {modalButton}
        <h3 className='ual-subtitle'>{loggedIn}</h3>
        {this.renderOrderForm()}
        {orderBtn}
        {this.renderShowTableBtn()}

        {logoutBtn}
      </div>
    )
  }
}

export default OrderEntryApp;