# Working example on how to swap ERC20s with 1inch

At the time of creation of this 1inch had no SDK to work with, the options were the API or interacting with Smart Contracts directly.
This is the example on how to swap MATIC for DAI using the API.

**Important note!**
**Signing the Tx with the ethers.js library causes the swap to fail, it's working only with web3.js :(**
