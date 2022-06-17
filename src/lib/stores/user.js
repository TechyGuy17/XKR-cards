import { writable, derived } from "svelte/store";

//Default values
export const user = writable({
    loggedIn: false,
    username: 'Bank manager TechyGuy',
    node: '',
    activeChat: null,
    huginAddress: '',
    syncState: '',
    call: {},
    thisBoard: 'All',
    contacts: null,
    addBoard: false,
    addChat: false,
    replyTo: {reply: false}
})
