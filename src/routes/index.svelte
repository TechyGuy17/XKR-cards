<script>
    import {fade, fly, draw, blur} from 'svelte/transition';
    import {quadInOut} from "svelte/easing";
    import FillButton from "/src/components/buttons/FillButton.svelte";
    import {user} from "$lib/stores/user.js";
    import {nodelist} from "$lib/stores/nodes.js";
    import {onMount} from "svelte";
    import { goto } from '$app/navigation';
    import {messages} from "$lib/stores/messages.js";
    import {boardMessages} from "$lib/stores/boardmsgs.js";
    import {cardTxs} from "$lib/stores/cardTxs.js";
    let wallet
    let walletName
    let myPassword
    let data
    let thisWallet

    onMount(() => {
        window.api.send('app', true)
        window.api.receive('wallet-exist', async (data, walletName) => {
        wallet = data
        console.log('wallet exists', walletName);
        $ : thisWallet = walletName[0]


      })
    })

    //Handle login, sets logeged in to true and gets user address
    const handleLogin = async () => {

      let accountData = {
        thisWallet: thisWallet,
        myPassword: myPassword
      }
      console.log('data', accountData);

      window.api.send('login', accountData)

    }

    let node;
    const switchNode = () => {
        window.api.switchNode(node)
        user.update(oldData => {
            return {
                ...oldData,
                node: node
            }
        })
    }

    window.api.receive('saved-addr', huginaddr => {
      user.update(data => {
        return {
          ...data,
          contacts: [...data, huginaddr],
        }

      })

    })

      $ :  myPassword
      $ :  console.log('mypass', myPassword);

      window.api.receive('wallet-started', async (myContacts) => {
        console.log('Mycontacts', myContacts);

        user.update(data => {
  				return {
  					...data,
  					contacts: myContacts,
  				}

        })

        //Get messages and save to a variable.
        messages.set(await window.api.getMessages(res => {
          console.log('response', res)
        }))
        //Get messages and save to a variable.
        cardTxs.set(await window.api.getTxs(res => {
          console.log('response', res)
        }))

        goto("/dashboard")

      })

      window.api.receive('addr', async (huginAddr) => {
  			console.log('Addr incoming')
  			user.update(data => {
  				return {
  					...data,
  					huginAddress: huginAddr
  				}
  			})
  		})

</script>

<div class="wrapper" in:fade out:fade="{{duration: 200}}">
    <div class="login-wrapper">
        <div class="login-wrapper">
        {#if wallet}
            <h1 class="title">Welcome back {$user.username} 👋</h1>
            <h3 class="title">Log in to wallet:</h3>
            <p class="wallets">{thisWallet}</p>
            <input type="password" placeholder="Something safe" bind:value={myPassword}>
            <FillButton text="Log in" url="/dashboard" on:click={handleLogin}/>
            {:else}
                <FillButton text="Create Account" url="/create-account" />
              {/if}

        </div>
        <select bind:value={node}>
            {#each $nodelist as node}
                <option value={`${node.url}:${node.port}`}>{node.name}</option>
            {/each}
        </select>
        <button on:click={switchNode}>Connect</button>
    </div>
    <div in:fade class="hero">
        <div></div>

        <div in:fly="{{y: 100}}" class="socials">
            <p>Github</p>
            <p>Support</p>
            <p>Website</p>
        </div>
    </div>
</div>

<style>

    .wrapper {
        display: flex;
        height: 100vh;
        color: #fff;
        background-color: #202020;
        z-index: 3;
    }

    .login-wrapper {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 50%;
        height: 100vh;
    }

    .title {
        width: 270px;
        margin-top: 0;
        margin-bottom: 30px;
    }

    .hero {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        width: 50%;
        border-left: 1px solid rgba(255,255,255, 0.1);
        height: 100vh;
        z-index: 3;
    }

    .socials {
        display: flex;
        gap: 20px
    }

    .show {
      display: block;
    }

</style>
