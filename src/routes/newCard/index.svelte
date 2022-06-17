<script>
import {fade} from 'svelte/transition';
import {cardTxs} from "$lib/stores/cardTxs.js";
import AddBoard from '/src/components/chat/AddBoard.svelte'
let user
let amount
let wantToAdd = true
let text = "test,1";
let textarray
let newCard 

const handleNewCard = async (text) => {
// console.log(text.detail)
textarray = text.split(",")
user = textarray[0]
amount = textarray[1]
newCard = {carduser: user, amount: amount, sent: true, timestamp: Date.now()}
// console.log('newCard', newCard)
 window.api.newCard(newCard)
}
   //Open AddBoard component and update state in store.
   const openAddBoard = () => {
        wantToAdd = !wantToAdd
        if (!wantToAdd) {
          user.update(data => {
            return {
              data,
              addBoard: false,
            }
        })
        }
    }
</script>


<main in:fade>

  {#if wantToAdd}
  <AddBoard on:click={openAddBoard} on:addBoard={() => handleNewCard(text)}/>
  {/if}

</main>

<style lang="scss">

    main {
        display: flex;
        margin-left: 85px;
        height: 100vh;
        overflow: hidden;
        z-index: 3;
    }

    .rightside {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      box-sizing: border-box;
      width: 100%;
      margin-right: 85px;
    }


</style>
