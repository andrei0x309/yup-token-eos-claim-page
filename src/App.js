/*
  Order Entry React Demo for EOSIO Training & Certification: AD101

  Import and implement UAL plugins, consumer, and wrapper in this file
*/

import React from 'react';
import logo from './logo.svg';
import { UALProvider, withUAL } from 'ual-reactjs-renderer';
import { Ledger } from 'ual-ledger';
import { Anchor } from 'ual-anchor';
import OrderEntryApp from './components/orderentry';
import { JsonRpc } from 'eosjs'

 
const network = {
  chainId:'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
  rpcEndpoints: [{
    protocol: 'http',
    host: 'localhost',
    port: '8888',
  }]
}

const anchorConfig = {
  appName: 'Order-Entry-App',
}

const anchor = new Anchor([network], anchorConfig);

 
const AppWithUAL = withUAL(OrderEntryApp);
AppWithUAL.displayName = anchorConfig.appName;


function App() {
  
  return(
    <UALProvider chains={[network]} authenticators={[anchor]} appName={anchorConfig.appName} >
    <AppWithUAL />
    </UALProvider>
  );
}

export default App;
