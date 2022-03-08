import React from 'react';
import { UALProvider, withUAL } from 'ual-reactjs-renderer';
import { Wombat } from 'ual-wombat'
import { Anchor } from 'ual-anchor'
import claimPage from './components/claim-page';


// deployed to netfly at
// https://awesome-dubinsky-e8d22f.netlify.app/

export const network =
{
  chainId:'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
  name: 'EOS Mainnet',
  rpcEndpoints: [{
    protocol: 'https',
    host: 'eos.greymass.com',
    port: '443',
  }]
}
;
 
const walletConfig = {
  appName: 'EOS YUP AIRDROP CLAIM PAGE',
}

 
const wombat = new Wombat([network], walletConfig);
// const anchor = new Anchor([network], walletConfig);

const AppWithUAL = withUAL(claimPage);
AppWithUAL.displayName = walletConfig.appName;

const ualProviders = [];
if (window.__wombat__ && window.scatter){
  ualProviders.push(wombat);
}

function App() {
  
  return(
    <UALProvider chains={[network]} authenticators={ualProviders} appName={walletConfig.appName} >
    <AppWithUAL />
    <p style={{ marginTop: '18rem', textAlign:'center'}}> Page works with this wallet: <br/><br/>
    &nbsp;&nbsp;&nbsp;<a href="https://chrome.google.com/webstore/detail/wombat-gaming-wallet-for/amkmjjmmflddogmhpjloimipbofnfjih?hl=en">Wombat</a> <br/>
    </p>
    </UALProvider>

  );
}

export default App;
