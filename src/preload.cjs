// preload.cjs
const { contextBridge, ipcRenderer } = require('electron')

const WINDOW_API = {

  //GENERAL API CALLS
  send: (channel, data) => {
    ipcRenderer.send(channel, data)
  },
  sendSync: (channel, data) => {
    ipcRenderer.sendSync(channel, data)
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args))
  },


  // HANDLE MESSAGES
  sendMsg: (msg, address, key) => {
    ipcRenderer.send('sendMsg', msg, address, key )
  },
  getMessages: async (data) => {
    const res = await ipcRenderer.invoke('getMessages')
    return res
  },
  getConversations: async () => {
    let resp = await ipcRenderer.invoke('getConversations')
    return resp
  },
  printConversation: async (chat) => {
    let resp = await ipcRenderer.invoke('printConversation', chat)
    return resp
  },
  getTxs: async (data) => {
    const res = await ipcRenderer.invoke('getTxs')
    return res
  },

  //HANDLE NODES
  getNodes: async () => {
    ipcRenderer.send('getNodes')
  },
  switchNode: node => {
    ipcRenderer.send('switchNode', node)
  },

  //HANDLE FINANCE
  getBalance: async () => {
    return  await ipcRenderer.invoke('getBalance')
  },

  //HANDLE ADDRESS
  getAddress: async () => {
    await ipcRenderer.invoke('getAddress')
  },

  // Handle new card
  newCard: async (newCard) => {
    await ipcRenderer.invoke('newCard', newCard)
    console.log(newCard)
  },
  
}


contextBridge.exposeInMainWorld('api', WINDOW_API);
