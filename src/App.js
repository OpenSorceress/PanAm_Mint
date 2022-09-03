/* eslint-disable no-useless-escape */
/* eslint-disable no-unused-vars */

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import { CONTRACT_ADDRESS, MAINNET_CHAIN_ID } from './constants';
import { ToastContainer, toast } from "react-toastify";

import ContractABI from './constants/WaifuClanCollection.json';
import LoadingSpinner from './components/LoadingSpinner';
import {ethers} from 'ethers';
import logo from '../src/assets/image/logo.png';
import { useState } from 'react';

const App = () => {
  const FREE_MINT_LIMIT = 2;
  const [mintCount, setMintCount] = useState(1);
  const [isOwner, setIsOwner] = useState(false);
  const [royaltyAddress, setRoyaltyAddress] = useState('');
  const [nftUri, setNftUri] = useState('');
  const [isMintPossible, setIsMintPossible] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [airdropAddress, setAirdropAddress] = useState('');
  const [airdropQuantity, setAirdropQuantity] = useState(0);
  const [supply, setSupply] = useState(0);
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(0);
  const [rawData, setRawData] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [isWhitelistUser, setIsWhitelistUser] = useState(false);

  const requestAccount = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      const networkId = await window.ethereum.request({
        method: "net_version",
      });
      if ( networkId !== MAINNET_CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [
            { chainId: `0x${MAINNET_CHAIN_ID}` }
          ]
        });
      }
      toast.success("Successfully Connected", { theme: 'light'});
      return accounts[0];
    } catch (error) {
      console.log(error);
      toast.error(`${error.message}`, { theme: 'colored'});
      return ''
    }

  }

  const mint = async () => {
    if ( isMetamaskInstalled()) {
      setLoading(true)
      const contract = getContract();

      try {
        let canUserMint = await contract.canUserMint.call();
        let mintPrice = await contract.getPrice()
        let isWhitelist = await isWlUser(currentUser)
        setIsMintPossible(canUserMint);
        if (canUserMint) {
          let tx;
          if (!isWhitelist) {
            tx = await contract.mint(mintCount, {value: mintPrice});
          } else {
            tx = await contract.mint(mintCount);
          }

          await tx.wait();
          toast.success('Mint success', {theme: 'light'})
        } else {
          toast.warn(`You can't mint`, {theme: 'dark'})
        }
      } catch (error) {
        toast.error(`${error.reason || "You rejected request"}`, {theme: 'dark'})
      }
      setLoading(false)
    }
  }

  const changeMintStatus = async () => {
    if (isMetamaskInstalled()) {
      const contract = getContract();
      try {
        setLoading(true)
        let tx = await contract.changeMintingStatus();
        if (isOwner) await tx.wait();
        setIsMintPossible(!isMintPossible);
        toast.success('Mint status changed', {theme: 'light'})
      } catch (error) {
        toast.error(`${error.message}`, {theme: 'colored'})
      }
      setLoading(false)
    }
  }

  const reveal = async() => {
    if ( isMetamaskInstalled()) {
      const contract = getContract();
      try {
        setLoading(true)
        let tx = await contract.reveal();
        if (isOwner) {
          await tx.wait()
          toast.success('Reveal success', { theme: 'light'});
        };
      } catch (error) {
        toast.error(`${error.message}`, {theme: 'colored'})
      }
      setLoading(false)
    }
  }

  const setBaseUri = async ( baseUri ) => {
    if ( isMetamaskInstalled() ) {
      const contract = getContract();
      if (isValidUrl(baseUri)) {
        try {
          setLoading(true)
          let tx = await contract.setBaseUri(baseUri);
          if ( isOwner ) {
            await tx.wait();
            toast.success('Set BaseUri success', { theme: 'light'});
          }
        } catch (error) {
          toast.error(`${error.reason}`, {theme: 'colored'})
        }
        setLoading(false)
      } else {
        toast.error("Input valid Url", { theme: 'colored'});
      }
    }
  }

  const setMaxSupply = async ( supply ) => {
    if ( isMetamaskInstalled()) {
      const contract = getContract()
      if ( supply <= 0) {
        toast.error('Input valid amount', { theme: 'colored'})
        return
      }
      try {
        setLoading(true)
        if ( isOwner) {
          let tx = await contract.setTotalSupply(supply)
          await tx.wait()
          toast.success('Set Max supply', { theme: 'light'})
        } else {
          toast.error('Not owner', { theme: 'colored'})
        }
      } catch(error) {
        toast.error(`${error.reason}`, { theme: 'colored'})
      }
      setLoading(false)
    }
  }

  const setMintPrice = async ( _price ) => {
    if ( isMetamaskInstalled()) {
      const contract = getContract()
      if ( _price < 0) {
        toast.error('Input valid amount', { theme: 'colored'})
        return
      }
      try {
        setLoading(true)
        if ( isOwner) {
          let tx = await contract.setPrice(ethers.utils.parseEther(`${_price}`))
          await tx.wait()
          toast.success('Set Mint Price Success', { theme: 'light'})
          setPrice(0);
        } else {
          toast.error('Not owner', { theme: 'colored'})
        }
      } catch(error) {
        console.log(error)
        toast.error(`${error.reason}`, { theme: 'colored'})
      }
      setLoading(false)
    }
  }

  const withdraw = async () => {
    if ( isMetamaskInstalled()) {
      const contract = getContract()
      try {
        setLoading(true)
        if ( isOwner) {
          let tx = await contract.withdrawFunds()
          await tx.wait()
          toast.success('Withdraw Success', { theme: 'light'})
        } else {
          toast.error('Not owner', { theme: 'colored'})
        }
      } catch(error) {
        console.log(error)
        toast.error(`${error.reason}`, { theme: 'colored'})
      }
      setLoading(false)
    }
  }

  const setRoyaltyWallet = async (address) => {
    if ( isMetamaskInstalled()) {
      const contract = getContract();
      let isvalidAddress = ethers.utils.isAddress(address);
      if (!isvalidAddress) {
        toast.error("Input valid address", { theme: 'colored'});
        return;
      }
      try {
        setLoading(true)
        let tx = await contract.setRoyaltiesWalletAddress(address);
        if ( isOwner ) {
          await tx.wait()
          toast.success('Set RoyaltyAddress success', { theme: 'light'});
          setRoyaltyAddress('')
        };
      } catch (error) {
        toast.error(`${error.message}`, {theme: 'colored'})
      }
      setLoading(false)
    }
  }

  const setWlUsers = async (_rawData) => {
    if (isMetamaskInstalled()){
      const contract = getContract();
      try {
        setLoading(true)
        let result = getListFromRawData(_rawData);
        if (result.isValid && result.array.length > 0) {
          let tx = await contract.setWlList(result.array)
          await tx.wait();
          toast.success('Set wlList success', {theme: 'light'});
          setRawData('')
        } else {
          toast.error("Input valid address", { theme: 'colored'})
        }
      } catch (error) {
        toast.error(`${error.reason}`, {theme:'colored'});
      }
      setLoading(false);
    } else {
      toast.error("Set wlList failed", { theme: 'colored'});
    }

  }
  const airdrop = async(address, quantity) => {
    if ( isMetamaskInstalled()) {
      const contract = getContract();
      let isvalidAddress = ethers.utils.isAddress(address);
      if (!isvalidAddress) {
        toast.error("Input valid address", { theme: 'colored'});
        return;
      }
      try {
        setLoading(true)
        let alreadyMinted = await contract.freeMintedCount(address);
        if (alreadyMinted.toNumber() + quantity > FREE_MINT_LIMIT || quantity <= 0 ) {
          toast.warn("Free mint count exceeds", { theme: 'colored'})
        } else {
          let tx = await contract.mintFor(address, quantity);
          if ( isOwner ) {
            await tx.wait()
            toast.success("Airdrop success", { theme: 'light'});
            setAirdropAddress('')
            setAirdropQuantity(0)
          };
        }
      } catch (error) {
        console.log(error)
        toast.error(`${error.reason}`, {theme: 'colored'})
      }
      setLoading(false)
    }
  }

  const getContract = () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ContractABI.abi, signer);
    return contract;
  }

  const initialize = async() => {
    try {
      setLoading(true)
      let address = await requestAccount();
      setCurrentUser(address)
      const contract = await getContract();
      let owner = await contract.owner();
      let isOwner = address !== '' && address === owner.toLowerCase();
      let canUserMint = await contract.canUserMint.call();
      let isWlUser = await contract.isWhitelistAddress()
      setIsMintPossible(canUserMint);
      setIsWhitelistUser(isWlUser)
      setIsOwner(isOwner); // isOwner
      setIsWalletConnected(true);
      setLoading(false)
    } catch (error) {
      console.log(error);
      toast.error("Connection error", { theme: 'colored'});
      setLoading(false)
    }

  }

  const isMetamaskInstalled = () => {
    if (typeof window.ethereum !== 'undefined') {
      return true;
    } else {
      toast.error('Install Metamask on Browser', { theme: 'colored'});
      return false;
    }
  }

  const isValidUrl = (baseUri) => {
    let res = baseUri.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
  }

  const handleChange = (e) => {
    let value = e.target.value;
    let name = e.target.name;
    if (name === 'wallet') {
      setRoyaltyAddress(value)
    } else if (name === 'nftUri') {
      setNftUri(value)
    } else if (name === 'airdropAddress') {
      setAirdropAddress(value)
    } else if ( name === 'airdropQuantity') {
      setAirdropQuantity(Number.parseInt(value))
    } else if ( name === "maxSupply") {
      setSupply(Number.parseInt(value))
    } else if ( name === "price") {
      setPrice(Number.parseFloat(value))
    } else if (name === "whitelist") {
      console.log(value)
      setRawData(value)
    } else return
  }

  const isWlUser = async(address) => {
    if (isMetamaskInstalled()) {
      const contract = getContract();
      try {
        let isWlUser = await contract.isWhitelistAddress();
        // setPart
        return isWlUser;
      } catch (error) {
        toast.error(`${error.message}`, {theme: 'colored'})
        return false;
      }
    }
  }

  const getListFromRawData = (_rawData) => {
    let array = _rawData.split(',');
    for (let i = 0; i< array.length; i++ ) {
      let isValid = ethers.utils.isAddress(array[i]);
      if (!isValid) return {
        isValid: false,
        array: null
      }
    }
    return {
      isValid: true,
      array: array
    };
  }

  return (
    <div className="App">
      {
        loading ? <LoadingSpinner />:
      <>
      <div className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </div>
      <div className={'btn_wrapper'}>
        {!isOwner && isWalletConnected && <button className={'btn_mint'} onClick={() => mint()}>
              {"MINT NOW"}
              {/* &nbsp;{isWhitelistUser ? "(Whitelist:  Yes)":"(Whitelist: No)"} */}
        </button>}
        {!isWalletConnected && <button className={'btn_mint'} onClick={() => initialize()}>
              {"CONNECT WALLET"}
        </button>}
        { isOwner && isWalletConnected && <>
            <button className={'btn_mint'} onClick={() => changeMintStatus()}>
                  {isMintPossible ? "Disable Mint" : " EnableMint"}
            </button>
            <button className={'btn_mint'} onClick={() => reveal()}>
                  {"REVEAL"}
            </button>
          </>
        }
        {
          isOwner && isWalletConnected &&
            <div className={'admin_set_part'}>
              <div className={'royalty_wallet'}>
                <span className='btn_mint not_allowed'>{"Royalty"}</span>
                <input value={royaltyAddress} name={'wallet'} onChange={(e) => handleChange(e)} placeholder={"Input royalty wallet address"}/>
                <button className={'btn_mint'} onClick={() => setRoyaltyWallet(royaltyAddress)}>
                  {"SUBMIT"}
                </button>
              </div>

              <div className={'whitelist_address'}>
                <span className='btn_mint not_allowed'>{"Whitelist"}</span>
                <textarea value={rawData} name={'whitelist'} onChange={(e) => handleChange(e)} placeholder={"Input whitelist wallet addresses!"}></textarea>
                <button className={'btn_mint'} onClick={() => setWlUsers(rawData)}>
                  {"SUBMIT"}
                </button>
              </div>
              <div className={'base_uri'}>
                <span className='btn_mint not_allowed'>{"Base Uri"}</span>
                <input value={nftUri} name={'nftUri'} onChange={(e) => handleChange(e)} placeholder={"Input metadata base uri"} />
                <button className={'btn_mint'} onClick={() => setBaseUri(nftUri)}>
                  {"SUBMIT"}
                </button>
              </div>

              <div className={'max_supply'}>
              <span className='btn_mint not_allowed'>{"Max supply"}</span>
                <input value={supply} name={'maxSupply'} type={'number'} onChange={(e) => handleChange(e)} placeholder={"Input max supply"} />
                <button className={'btn_mint'} onClick={() => setMaxSupply(supply)}>
                  {"SUBMIT"}
                </button>
              </div>

              <div className={'mint_price'}>
                <span className='btn_mint not_allowed'>{"Mint price"}</span>
                <input value={price} name={'price'} type={'number'} onChange={(e) => handleChange(e)} placeholder={"Input mint price"} />
                <button className={'btn_mint'} onClick={() => setMintPrice(price)}>
                  {"SUBMIT"}
                </button>
              </div>

              <div className={'airdrop'}>
                <span className='btn_mint not_allowed'>{"Address"}</span>
                <input value={airdropAddress} name={'airdropAddress'} onChange={(e) => handleChange(e)} placeholder={"Input airdrop address"} />
                <span className='btn_mint not_allowed'>{"Amount"}</span>
                <input value={airdropQuantity} name={'airdropQuantity'} type='number' onChange={(e) => handleChange(e)} placeholder={"Input airdrop quantity"} />
              </div>

              <div className={'airdrop'}>
                <button className={'btn_mint'} onClick={() => airdrop(airdropAddress, airdropQuantity)}>
                {"AIR DROP"}
                </button>
                <button className={'btn_mint'} onClick={() => withdraw()}>
                {"WITHDRAW"}
                </button>
              </div>
            </div>

        }
      </div>
      </>
      }
      <ToastContainer />
    </div>
  );
}

export default App;
