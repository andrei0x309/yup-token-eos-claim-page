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
import Spinner from 'react-bootstrap/Spinner'
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
  tablePageResult: { id:0, userid:'', items:[], status:''},
  showTableState:false,
  showtableLoading: false,
  index:0,
  moreRows:false,
  lastTransaction:null
}

class OrderEntryApp extends React.Component {
  static displayName = 'OrderEntryApp'

  constructor(props) {
    super(props)
    this.state = {
      ...defaultState,
      rcp: new JsonRpc(`${network.rpcEndpoints[0].protocol}://${network.rpcEndpoints[0].host}:${network.rpcEndpoints[0].port}`)
    }

    this.updateAccountName = this.updateAccountName.bind(this)
    this.renderOrderButton = this.renderOrderButton.bind(this)
    this.placeorder = this.placeorder.bind(this)
    this.redoTransaction = this.redoTransaction.bind(this)
    this.doTransaction = this.doTransaction.bind(this)
    this.renderModalButton = this.renderModalButton.bind(this)
    this.handleOrderUpdate = this.handleOrderUpdate.bind(this)
    this.renderOrderForm = this.renderOrderForm.bind(this)
    this.updateTable = this.updateTable.bind(this)
    this.renderTable = this.renderTable.bind(this)
  }

  // implement code to transact, using the order details, here
  async placeorder() {
    const { accountName, activeUser, orderItems } = this.state;
    //console.log(accountName, activeUser,orderItems )
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
    this.setState({lastTransaction: AddOrderTransaction});
    await this.doTransaction(AddOrderTransaction)
   
    //console.log("With UAL implemented, this submits an order for items " + JSON.parse(`[${orderItems}]`));
  }

  async redoTransaction(){
    if(this.state.lastTransaction === null){
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'There isn\'t a previous transaction',
      });
    }else{
      await this.doTransaction(this.state.lastTransaction)
    }
  }

  async doTransaction(transaction){
    try{
      const {activeUser } = this.state;
      const result = await activeUser.signTransaction(transaction, {broadcast: true});
 
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

  renderRedoOrderButton() {
    return (
      <p className='ual-btn-wrapper'>
        <Button variant="outline-warning" onClick={this.redoTransaction}>
          {'Redo Last Transaction'}
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
    ( !this.state.showTableState && !this.state.showtableLoading ) ? 
    <p className='ual-btn-wrapper'>
    <Button variant="outline-success" onClick={this.updateTable}>
       {'Get Order Table'}
    </Button>
    </p>
    : (this.state.showTableState && this.state.moreRows) ? 
    <p className='ual-btn-wrapper'>
    <Button variant="outline-success" onClick={this.updateTable}>
       {'Next Page'}
    </Button>
    </p>
    :'')

  }


  


  renderTable(){ 
    return (
<Table style={{marginLeft: 'auto', marginRight:'auto', width:'90%', marginTop:'10px', marginBottom:'10px'}} striped bordered hover variant="dark">
  <thead>
    <tr>
      <th>#</th>
      <th>userId</th>
      <th>Items</th>
      <th>status</th>
    </tr>
  </thead>
  <tbody>
  {Object.keys(this.state.tablePageResult).map((id, i) =>
  <tr key={i}>
  {Object.keys(this.state.tablePageResult[id]).map((key, i) => 
  <td key={i}>{ 
    (key === 'items')? `[ ${this.state.tablePageResult[id][key].join(', ')} ]`:
    this.state.tablePageResult[id][key] }</td>
  )}
  </tr>) }
  </tbody>
</Table>
    )

  }

  async updateTable(){

    const { accountName } = this.state;
    this.setState({showTableState:false,showtableLoading:true});
    console.log()
    const resp = await this.state.rcp.get_table_rows(
      { json:true,
        code:accountName,
        scope:accountName,
        table:'orders',
        reverse:false,
        show_payer:false,
        limit:3,
        lower_bound:this.state.index
        //lower_bound: this.state.index,
        //upper_bound: this.state.index+3
      }
    )
    let tableEntries = {}
    for (const [key, value] of Object.entries(resp.rows)) {
      tableEntries[key] = {id:value.id, userid:value.userid, items:value.items, status:value.status}
    }
    console.log(resp);
    console.log(resp.more)

    this.setState({tablePageResult:tableEntries,
    showTableState:true,
    moreRows:resp.more,
    index:this.state.index+3,
    showtableLoading:false
    });

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
        {this.renderRedoOrderButton()}
        {this.state.showtableLoading && <Spinner animation="grow" variant="light" />}
        {this.state.showTableState && this.renderTable()}
        {this.renderShowTableBtn()}

        {logoutBtn}
      </div>
    )
  }
}

export default OrderEntryApp;