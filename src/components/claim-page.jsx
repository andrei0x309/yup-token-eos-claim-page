import { JsonRpc } from 'eosjs'
import * as React from 'react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner'
import { isAddress } from 'web3-utils'
import 'bootstrap/dist/css/bootstrap.min.css';
import './claim-page.css';
import { network } from '../App'
import axios from 'axios'

const BACKEND_API2 = 'https://api.yup.io'
// const BACKEND_API = 'http://127.0.0.1:4001'
 
const MySwal = withReactContent(Swal)

const defaultState = {
  activeUser: null,
  accountName: '', 
  polygonAddress: '',
  isLoading: false,
  airdrop: {},
  lpAidrop: {},
  waitForTx: false,
}

class ClaimPage extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      ...defaultState,
      rcp: new JsonRpc(`${network.rpcEndpoints[0].protocol}://${network.rpcEndpoints[0].host}:${network.rpcEndpoints[0].port}`)
    }

    this.updateAccountName = this.updateAccountName.bind(this)
    this.claimAirdrop = this.claimAirdrop.bind(this)
    this.fetchAirdropData = this.fetchAirdropData.bind(this)
    this.renderModalButton = this.renderModalButton.bind(this)
    this.handleInputUpdate = this.handleInputUpdate.bind(this)
    this.renderAddrForm = this.renderAddrForm.bind(this)
  }
 
  getWalletType(walletObj){
    switch(walletObj.constructor.name){
      // case 'AnchorUser':
      //   return 'AnchorUser'
      case 'WombatUser':
        return 'WombatUser'
      default:
        return 'Unkown'
    }
  }

  async getPublickey(type){
    const { activeUser } = this.state
    switch(type){
      case 'AnchorUser':
        return activeUser.session.publicKey.toLegacyString()
      case 'WombatUser':
        return activeUser.keys[0]
      default:
        throw new Error('Unkown wallet type')
    }
  }

  msg(text, type='success') {
    const isSuc = type === 'success'
    MySwal.fire({
      icon: isSuc ? 'success':'error',
      title: isSuc ? 'Success!':'Oops...',
      text
    });
  }

  claimAirdrop = async () => {
    this.setState({ isLoading: true })
    const { polygonAddress, lpAidrop, airdrop } = this.state
 
    if (!isAddress(polygonAddress)) {
      this.msg('Please enter a valid polygon address', 'error')
      this.setState({ isLoading: false })
      return
    }

    const hasAvailableLpAirdrop = lpAidrop.amount > 0 && !lpAidrop.claimed
    const hasAvailableAirdrop =  airdrop.amount > 0 && !airdrop.claimed
    const { accountName, activeUser } = this.state;
 
    // const dummyTransact = {
    //   actions:[
    //     { account: 'yupyupyupyup',
    //       name:'noop',
    //       authorization: [ {actor:accountName, permission:activeUser.requestPermission  }],
    //       data:{ 
    //       }
    //     }
    //   ]
    // };


    let pubKey;
    try {
      console.log(this.getWalletType(activeUser))
      console.log(activeUser.constructor.name)
      pubKey = await (this.getPublickey(this.getWalletType(activeUser)))
    }catch(e){
      this.setState({ isLoading: false })
      if(e.message === 'Unkown wallet type'){
        this.msg('Please login with Wombat wallet', 'error')
      }else{
      this.msg('Can not retrive the public key check you wallet is open', 'error')
      }
      return
    }
    let sig = ''
    let txHash = ''
    const isAnchor = this.getWalletType(activeUser) === 'AnchorUser'
    try{
        let signMsg
        try {
          const resp = await axios.post(`${BACKEND_API2}/eos-airdrop/challenge`, { account: accountName })
          signMsg = resp.data.data
        }catch(e){
          this.msg('Can not generate the auth msg', 'error')
          this.setState({ isLoading: false })
          return
        }
        sig = await activeUser.signArbitrary(pubKey, signMsg, 'claim-airdrop', {broadcast: true})
    }catch(e){
      this.msg('Can not sign the transaction', 'error')
      this.setState({ isLoading: false })
      return
    }
    const params = { polygonAddress, eosname: accountName, publicKey:pubKey, eosSig: sig }
    if (txHash) params.txHash = txHash
    if (hasAvailableLpAirdrop || hasAvailableAirdrop || true) {
      try {
        const resp = await axios.post(`${BACKEND_API2}/eos-airdrop/claim`, params)
        this.msg(resp.data.message, 'success')
      } catch (err) {
        this.msg(err.response.data.message, 'error')
      }
    } else {
      this.msg('No available Airdrop to claim', 'error')
    }
    if(isAnchor) this.setState({ waitForTx: false })
    this.setState({ isLoading: false })
  }

  fetchAirdropData = async () => {
    try {
      const { accountName } = this.state
      this.setState({ isLoading: true })
      const airdrop = (await axios.get(`${BACKEND_API2}/airdrop?eosname=${accountName}`)).data
      const lpAidrop = (await axios.get(`${BACKEND_API2}/lp-airdrop?eosname=${accountName}`)).data
      this.setState({ airdrop, lpAidrop})
    } catch (err) {
      this.msg('Something went wrong. Try again later.', 'error')
    }
    this.setState({ isLoading: false })
  }
 
   async componentDidUpdate() {
    const { ual: { activeUser } } = this.props
    if (activeUser && !this.state.activeUser) {
      this.setState({ activeUser }, this.updateAccountName)
    } else if (!activeUser && this.state.activeUser) {
      this.setState(defaultState)
    }
  }

  async componentDidMount() {
    let { activeUser } = this.state
    while(!activeUser){
      await new Promise(resolve => setTimeout(resolve, 100))
      activeUser = this.state.activeUser
    }
    await this.fetchAirdropData()
  }
  
  async updateAccountName()   {
    try {
      const accountName = await this.state.activeUser.getAccountName()
      this.setState({ accountName })
    } catch (e) {
    }
  }

  renderYUPClamAmmount = () => {
    const { airdrop, lpAidrop, activeUser } = this.state
    if( !!activeUser ) {
    if(airdrop.claimed && lpAidrop.claimed){
      return <div>
        <p>You have claimed both Airdrops</p>
      </div>
    }
    else if (airdrop.amount > 0) {
      return (
        <div>
          { airdrop.claimed ? <p style={{ fontSize:'1.6rem' }} >You have claimed your YUP Airdrop</p> : <p style={{ fontSize:'1.6rem' }}>
            You have <span style={{ fontSize:'1.8rem', color: '#31a346' }} >{airdrop.amount}</span> YUP !</p>  }
          { lpAidrop.amount > 0 ?
           lpAidrop.claimed ? <p style={{ fontSize:'1.6rem' }} >You have claimed your Lp Airdrop</p> :
          <p style={{ fontSize:'1.6rem' }} >You have <span  style={{ fontSize:'1.8rem', color: '#31a346' }} >{lpAidrop.amount}</span> YUPETH !</p>
          : '' }
          <p>Claimby clicking the button below</p>
        </div>
      )
    } else {
      return (
        <p>You have no YUP! to claim</p>
      )
    }
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
          onClick={this.props.ual.showModal}
          className='ual-generic-button'
          style={{ fontSize: '2.6rem', padding: '0.5rem 1rem' }}
          >
            Connect to Wallet
          </Button>
      </p>
    )
  }
 
  handleInputUpdate = (event) => {
    this.setState({polygonAddress: event.target.value});
  }

  renderAddrForm = () => {
    const { ual: { activeUser, activeAuthenticator }, polygonAddress } = this.props
    if (!!activeUser && !!activeAuthenticator) {
    return(
      <div style={{marginLeft: 'auto', marginRight:'auto', width:'25%', marginTop:'40px', marginBottom:'10px'}}>
        <Form>
          <Form.Group controlId="orderItems">
            <Form.Label>Polygon Address: </Form.Label>
            <Form.Control
                  type="text"
                  name="orderItems"
                  value={polygonAddress}
                  onChange={this.handleInputUpdate}
                />
          </Form.Group>
        </Form>
      </div>
    )
    }
  }

  renderClaimBtn(){
    return(
    ( this.state.activeUser) ? 
    <p className='ual-btn-wrapper'>
    <Button variant="outline-success" onClick={this.claimAirdrop}>
       {'Claim YUP AIRDROP'}
    </Button>
    </p>
    :'')
  }

  render() {
    let modalButton = this.renderModalButton()
    let loggedIn = ''
    let logoutBtn = null
 
    const { ual: { activeUser } } = this.props
    const { accountName } = this.state
    modalButton = !activeUser && this.renderModalButton()
    logoutBtn = this.renderLogoutBtn()
    loggedIn = accountName ? `Logged in as ${accountName}` : ''
     

    return (
      <div style={{ textAlign: 'center', paddingTop: '10vw' }}>
        <h2>Airdrop claim page YUP for EOS users without YUP account</h2>
        <span>Use this page to claim your migration airdop only if you don't have an YUP account.</span>
        <div style={{marginBottom: '4rem'}}></div>
        {modalButton}
        <h3 className='ual-subtitle'>{loggedIn}</h3>
        {this.renderAddrForm()}
        {this.state.waitForTx && <p className="blink">Waiting for transaction confirmation...</p>}
        {this.state.isLoading && <Spinner animation="grow" variant="light" />}
        {this.renderYUPClamAmmount()}
        {this.renderClaimBtn()}

        {logoutBtn}
      </div>
    )
  }
}

export default ClaimPage;