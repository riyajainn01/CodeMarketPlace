import  { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function CodeMarketplace() {
  // State management
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'create'
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    code: '',
    price: '',
    language: 'javascript'
  });
  
  // Constants
  const SEPOLIA_CHAIN_ID = '0xaa36a7'; // Chain ID in hex
  const SEPOLIA_CHAIN_ID_DECIMAL = 11155111; // Chain ID in decimal
  
  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum !== undefined;
  
  // Check if already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled) return;
      
      try {
        // Get current accounts
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();
          const account = accounts[0];
          
          // Check if we're on the correct network
          if (network.chainId !== SEPOLIA_CHAIN_ID_DECIMAL) {
            setConnectionError(`Please switch to Sepolia Test Network in MetaMask. Current network: ${network.name}`);
            setNetworkName(network.name);
            return;
          }
          
          // Get and set balance
          const balance = await provider.getBalance(account);
          const formattedBalance = ethers.utils.formatEther(balance);
          
          setAccount(account);
          setBalance(formattedBalance);
          setIsConnected(true);
          setNetworkName('Sepolia');
        }
      } catch (error) {
        console.error("Error checking existing connection:", error);
      }
    };
    
    checkConnection();
  }, [isMetaMaskInstalled]);
  
  // Load listings from localStorage on component mount
  useEffect(() => {
    const storedListings = localStorage.getItem('codeListings');
    if (storedListings) {
      setListings(JSON.parse(storedListings));
    } else {
      // Sample data if no listings exist
      const sampleListings = [
        {
          id: '1',
          title: 'React Authentication Hook',
          description: 'A custom hook for handling user authentication in React applications',
          code: 'export function useAuth() {\n  const [user, setUser] = useState(null);\n  // More code here...\n  return { user, login, logout };\n}',
          price: '0.01',
          language: 'javascript',
          seller: '0x1234...5678',
          timestamp: Date.now(),
          sold: false
        },
        {
          id: '2',
          title: 'Smart Contract for NFT Marketplace',
          description: 'Solidity contract for creating and trading NFTs',
          code: 'contract NFTMarketplace {\n  // Contract code here\n  function createToken() public {...}\n}',
          price: '0.05',
          language: 'solidity',
          seller: '0x8765...4321',
          timestamp: Date.now() - 86400000,
          sold: false
        },
        {
          id: '3',
          title: 'Python Data Analysis Utility',
          description: 'Utility functions for data cleaning and visualization',
          code: 'def clean_data(df):\n    # Remove duplicates\n    df = df.drop_duplicates()\n    # Handle missing values\n    df = df.fillna(0)\n    return df',
          price: '0.02',
          language: 'python',
          seller: '0xabcd...1234',
          timestamp: Date.now() - 172800000,
          sold: false
        }
      ];
      setListings(sampleListings);
      localStorage.setItem('codeListings', JSON.stringify(sampleListings));
    }
  }, []);

  // Set up event listeners for MetaMask
  useEffect(() => {
    if (!isMetaMaskInstalled) return;
    
    // Listen for account changes
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        // User disconnected
        setIsConnected(false);
        setAccount('');
        setBalance('');
        setNetworkName('');
      } else {
        const newAccount = accounts[0];
        setAccount(newAccount);
        
        // Check network and update balance
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();
          
          if (network.chainId !== SEPOLIA_CHAIN_ID_DECIMAL) {
            setConnectionError(`Please switch to Sepolia Test Network in MetaMask. Current network: ${network.name}`);
            setNetworkName(network.name);
            setIsConnected(false);
          } else {
            setNetworkName('Sepolia');
            setIsConnected(true);
            updateBalance(newAccount);
            setConnectionError('');
          }
        } catch (error) {
          console.error("Error handling account change:", error);
        }
      }
    };
    
    // Listen for chain changes
    const handleChainChanged = async (chainIdHex) => {
      const chainId = parseInt(chainIdHex, 16);
      
      if (chainId !== SEPOLIA_CHAIN_ID_DECIMAL) {
        setConnectionError(`Please switch to Sepolia Test Network in MetaMask. Current chain ID: ${chainId}`);
        setIsConnected(false);
        
        // Try to get network name
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();
          setNetworkName(network.name);
        } catch (error) {
          setNetworkName(`Unknown (${chainId})`);
        }
      } else {
        setNetworkName('Sepolia');
        setConnectionError('');
        
        // If we have an account, update connection status and balance
        if (account) {
          setIsConnected(true);
          updateBalance(account);
        }
      }
    };
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    // Clean up listeners on unmount
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMaskInstalled, account]);

  // Update balance helper function
  const updateBalance = async (address) => {
    if (!isMetaMaskInstalled || !address) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.utils.formatEther(balance);
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      setConnectionError('MetaMask is not installed. Please install MetaMask to use this marketplace.');
      return;
    }
    
    setIsConnecting(true);
    setConnectionError('');
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error("No accounts found. Please create an account in MetaMask.");
      }
      
      // Check if we're on Sepolia testnet
      const chainIdHex = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      
      if (chainIdHex !== SEPOLIA_CHAIN_ID) {
        // We're not on Sepolia, try to switch
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: SEPOLIA_CHAIN_ID,
                  chainName: 'Sepolia Test Network',
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://sepolia.infura.io/v3/'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }],
              });
              
              // After adding, try to switch again
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: SEPOLIA_CHAIN_ID }],
              });
            } catch (addError) {
              throw new Error("Failed to add Sepolia network to MetaMask. Please add it manually.");
            }
          } else {
            throw new Error("Failed to switch to Sepolia network. Please switch manually in MetaMask.");
          }
        }
      }
      
      // Verify we're now on Sepolia
      const updatedChainIdHex = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      
      if (updatedChainIdHex !== SEPOLIA_CHAIN_ID) {
        throw new Error("Network switch failed. Please manually switch to Sepolia Test Network in MetaMask.");
      }
      
      // Get account and balance
      const account = accounts[0];
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(account);
      const formattedBalance = ethers.utils.formatEther(balance);
      
      setAccount(account);
      setBalance(formattedBalance);
      setIsConnected(true);
      setNetworkName('Sepolia');
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      setConnectionError(error.message || 'Failed to connect to MetaMask. Please try again.');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet (for UI purposes only, doesn't actually disconnect MetaMask)
  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount('');
    setBalance('');
    setNetworkName('');
  };

  // Purchase a code listing
  const purchaseCode = async (listing) => {
    try {
      if (!isConnected) {
        alert('Please connect your wallet first');
        return;
      }
      
      // Verify we're still on Sepolia
      const chainIdHex = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      
      if (chainIdHex !== SEPOLIA_CHAIN_ID) {
        alert('Please switch to Sepolia Test Network in MetaMask to make a purchase.');
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Create transaction
      const tx = await signer.sendTransaction({
        to: listing.seller,
        value: ethers.utils.parseEther(listing.price)
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Update listing as sold
      const updatedListings = listings.map(item => 
        item.id === listing.id ? { ...item, sold: true, buyer: account } : item
      );
      
      setListings(updatedListings);
      localStorage.setItem('codeListings', JSON.stringify(updatedListings));
      
      alert(`Successfully purchased "${listing.title}"!`);
      setIsModalOpen(false);
      
      // Update balance after purchase
      updateBalance(account);
    } catch (error) {
      console.error('Error during purchase:', error);
      alert('Transaction failed: ' + (error.message || 'Please try again.'));
    }
  };

  // Create a new listing
  const createListing = () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!newListing.title || !newListing.description || !newListing.code || !newListing.price) {
      alert('Please fill in all fields');
      return;
    }
    
    // Validate price is a valid number
    if (isNaN(parseFloat(newListing.price)) || parseFloat(newListing.price) <= 0) {
      alert('Please enter a valid price greater than 0');
      return;
    }
    
    const listing = {
      ...newListing,
      id: Date.now().toString(),
      seller: account,
      timestamp: Date.now(),
      sold: false
    };
    
    const updatedListings = [...listings, listing];
    setListings(updatedListings);
    localStorage.setItem('codeListings', JSON.stringify(updatedListings));
    
    setNewListing({
      title: '',
      description: '',
      code: '',
      price: '',
      language: 'javascript'
    });
    
    // Switch to explore tab to see the new listing
    setActiveTab('explore');
    
    // Show success message
    alert('Your code has been listed successfully!');
  };

  // Handle input changes for new listing form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewListing(prev => ({ ...prev, [name]: value }));
  };

  // Open listing details modal
  const openListingModal = (listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  // Format account address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get language-specific styling
  const getLanguageColor = (language) => {
    const colors = {
      javascript: '#f7df1e',
      python: '#3572A5',
      java: '#b07219',
      solidity: '#AA6746',
      typescript: '#2b7489',
      html: '#e34c26',
      css: '#563d7c',
      ruby: '#701516',
      go: '#00ADD8',
      rust: '#dea584',
      cpp: '#f34b7d',
      csharp: '#178600'
    };
    return colors[language.toLowerCase()] || '#718096';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Navigation */}
      <nav className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <h1 className="text-2xl font-bold text-gray-800">CodeNexus</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm bg-emerald-50 text-emerald-700 py-1 px-3 rounded-full border border-emerald-200">
                {parseFloat(balance).toFixed(4)} ETH
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm bg-purple-50 text-purple-700 py-1 px-3 rounded-full border border-purple-200">
                  {formatAddress(account)}
                </span>
                <button 
                  onClick={disconnectWallet}
                  className="text-gray-500 hover:text-gray-700"
                  title="Disconnect wallet"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              disabled={isConnecting}
              className={`${
                isConnecting ? 'bg-emerald-400' : 'bg-emerald-500 hover:bg-emerald-600'
              } text-white py-2 px-4 rounded-full transition-colors duration-200 flex items-center shadow-sm`}
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                  Connect Wallet
                </>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Network Status */}
      {isConnected && networkName && networkName !== 'Sepolia' && (
        <div className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded-lg relative mx-6 mt-4" role="alert">
          <strong className="font-bold">Wrong Network: </strong>
          <span className="block sm:inline">
            You are connected to {networkName}. Please switch to Sepolia Test Network in MetaMask.
          </span>
        </div>
      )}

      {/* Connection Error Message */}
      {connectionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mx-6 mt-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{connectionError}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setConnectionError('')}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}

      {/* MetaMask Not Installed Message */}
      {!isMetaMaskInstalled && (
        <div className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded-lg relative mx-6 mt-4" role="alert">
          <strong className="font-bold">MetaMask Required: </strong>
          <span className="block sm:inline">
            This marketplace requires MetaMask to function properly. 
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline ml-1"
            >
              Install MetaMask
            </a>
          </span>
        </div>
      )}

      {/* Hero Section - New Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-purple-600">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white opacity-10 rounded-full"></div>
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-white opacity-10 rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full transform translate-x-1/2 translate-y-1/2"></div>
          
          {/* Code Lines Animation */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className="absolute h-px bg-white"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 300 + 50}px`,
                  transform: `rotate(${Math.random() * 180}deg)`,
                  opacity: Math.random() * 0.5 + 0.5,
                  animation: `pulse ${Math.random() * 3 + 2}s infinite alternate`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1 rounded-full bg-white bg-opacity-20 backdrop-blur-sm text-white text-sm font-medium mb-6">
                Powered by Sepolia Testnet
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                The <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">Decentralized</span> Marketplace for Code
              </h1>
              <p className="text-xl mb-8 text-white text-opacity-90 leading-relaxed">
                Buy, sell, and trade code snippets, components, and projects using cryptocurrency. Unlock the value of your code.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setActiveTab('explore')}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-3 rounded-full font-medium transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Explore Marketplace
                </button>
                <button 
                  onClick={() => {
                    if (!isConnected) {
                      connectWallet();
                    } else {
                      setActiveTab('create');
                    }
                  }}
                  className="bg-transparent hover:bg-white hover:bg-opacity-20 border-2 border-white px-8 py-3 rounded-full font-medium text-white transition-all duration-200"
                >
                  Sell Your Code
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                {/* Terminal Window */}
                <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center bg-gray-800 px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="ml-4 text-gray-400 text-xs">CodeNexus Marketplace</div>
                  </div>
                  <div className="p-4 text-left">
                    <pre className="text-sm text-green-400 font-mono">
                      <span className="text-purple-400">const</span> <span className="text-blue-400">marketplace</span> = <span className="text-purple-400">await</span> CodeNexus.<span className="text-yellow-400">connect</span>();
                      <br /><br />
                      <span className="text-gray-500">// List your code for sale</span>
                      <br />
                      <span className="text-purple-400">const</span> <span className="text-blue-400">listing</span> = <span className="text-purple-400">await</span> marketplace.<span className="text-yellow-400">createListing</span>({'{'}
                      <br />
                      {'  '}<span className="text-green-400">title</span>: <span className="text-amber-400">"Smart Contract Library"</span>,
                      <br />
                      {'  '}<span className="text-green-400">price</span>: <span className="text-amber-400">ethers.utils.parseEther("0.05")</span>,
                      <br />
                      {'  '}<span className="text-green-400">code</span>: <span className="text-amber-400">codeSnippet</span>
                      <br />
                      {'}'});
                      <br /><br />
                      <span className="text-gray-500">// Transaction confirmed!</span>
                      <br />
                      <span className="text-blue-400">console</span>.<span className="text-yellow-400">log</span>(<span className="text-amber-400">`Listed at ${'{'}listing.id{'}'}`</span>);
                      <br />
                      <span className="text-white">{'>'} Listed at 0x7f9a...b3c2</span>
                    </pre>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rounded-lg opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500 rounded-lg opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 text-gray-50">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="currentColor"></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Listings</p>
                <p className="text-2xl font-bold text-gray-800">{listings.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Sales</p>
                <p className="text-2xl font-bold text-gray-800">
                  {listings.filter(l => !l.sold).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Price</p>
                <p className="text-2xl font-bold text-gray-800">
                  {listings.length > 0 
                    ? (listings.reduce((sum, l) => sum + parseFloat(l.price), 0) / listings.length).toFixed(3) 
                    : '0.000'} ETH
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('explore')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'explore'
                ? 'border-b-2 border-emerald-500 text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Explore Listings
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-b-2 border-emerald-500 text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Listing
          </button>
        </div>

        {/* Explore Section */}
        {activeTab === 'explore' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Code Listings</h2>
              <p className="text-gray-600">
                Browse through our collection of code snippets, components, and projects.
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex flex-wrap gap-4 items-center border border-gray-100">
              <div className="text-sm text-gray-500">Filter by:</div>
              <select className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>All Languages</option>
                <option>JavaScript</option>
                <option>Python</option>
                <option>Solidity</option>
                <option>Java</option>
              </select>
              <select className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Price: Any</option>
                <option>Under 0.01 ETH</option>
                <option>0.01 - 0.05 ETH</option>
                <option>Over 0.05 ETH</option>
              </select>
              <select className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Sort: Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => (
                <div 
                  key={listing.id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-100 group"
                  onClick={() => openListingModal(listing)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors duration-200">{listing.title}</h3>
                      <div 
                        className="text-xs px-2 py-1 rounded-full" 
                        style={{ 
                          backgroundColor: `${getLanguageColor(listing.language)}20`,
                          color: getLanguageColor(listing.language)
                        }}
                      >
                        {listing.language}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{listing.description}</p>
                    
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 overflow-hidden border border-gray-100">
                      <pre className="text-xs text-gray-700 overflow-hidden whitespace-pre-wrap line-clamp-3">
                        {listing.code}
                      </pre>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        By {formatAddress(listing.seller)}
                      </div>
                      <div className="font-medium text-emerald-600">
                        {listing.price} ETH
                      </div>
                    </div>
                    
                    {listing.sold && (
                      <div className="mt-2 text-xs text-white bg-purple-500 rounded-full px-2 py-1 inline-block">
                        Sold
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {listings.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
                <p className="text-gray-500 mb-6">Be the first to list your code on the marketplace!</p>
                <button 
                  onClick={() => setActiveTab('create')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-6 rounded-full transition-colors duration-200 shadow-sm"
                >
                  Create a Listing
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Listing Section */}
        {activeTab === 'create' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sell Your Code</h2>
              <p className="text-gray-600">
                List your code snippets, components, or projects on the marketplace and earn ETH.
              </p>
            </div>

            {!isConnected ? (
              <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Connect your wallet</h3>
                <p className="text-gray-500 mb-6">You need to connect your MetaMask wallet to create a listing.</p>
                <button 
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className={`${
                    isConnecting ? 'bg-emerald-400' : 'bg-emerald-500 hover:bg-emerald-600'
                  } text-white py-2 px-6 rounded-full transition-colors duration-200 shadow-sm`}
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={newListing.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="E.g., React Authentication Hook"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={newListing.language}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="solidity">Solidity</option>
                      <option value="typescript">TypeScript</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="ruby">Ruby</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="cpp">C++</option>
                      <option value="csharp">C#</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newListing.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Describe your code and its functionality"
                  ></textarea>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    Code
                  </label>
                  <textarea
                    id="code"
                    name="code"
                    value={newListing.code}
                    onChange={handleInputChange}
                    rows="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Paste your code here"
                  ></textarea>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price (ETH)
                  </label>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={newListing.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.01"
                  />
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={createListing}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
                  >
                    List for Sale
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Listing Detail Modal */}
      {isModalOpen && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedListing.title}</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <div 
                  className="text-xs px-2 py-1 rounded-full" 
                  style={{ 
                    backgroundColor: `${getLanguageColor(selectedListing.language)}20`,
                    color: getLanguageColor(selectedListing.language)
                  }}
                >
                  {selectedListing.language}
                </div>
                <span className="text-sm text-gray-500">
                  Posted {new Date(selectedListing.timestamp).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-gray-700 mb-6">{selectedListing.description}</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 overflow-auto border border-gray-200">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {selectedListing.code}
                </pre>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-gray-600">
                  Seller: {formatAddress(selectedListing.seller)}
                </div>
                <div className="text-xl font-bold text-emerald-600">
                  {selectedListing.price} ETH
                </div>
              </div>
              
              {selectedListing.sold ? (
                <div className="bg-purple-100 text-purple-800 p-3 rounded-lg text-center border border-purple-200">
                  This code has already been purchased
                </div>
              ) : (
                <button
                  onClick={() => purchaseCode(selectedListing)}
                  disabled={!isConnected || selectedListing.seller === account || networkName !== 'Sepolia'}
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
                    !isConnected || selectedListing.seller === account || networkName !== 'Sepolia'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-sm'
                  }`}
                >
                  {!isConnected
                    ? 'Connect wallet to purchase'
                    : networkName !== 'Sepolia'
                    ? 'Switch to Sepolia network to purchase'
                    : selectedListing.seller === account
                    ? 'You cannot buy your own listing'
                    : `Purchase for ${selectedListing.price} ETH`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
              <span className="text-lg font-semibold text-gray-800">CodeNexus</span>
            </div>
            <div className="text-sm text-gray-500">
              Built on Sepolia Testnet • All transactions are for demonstration purposes only
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}