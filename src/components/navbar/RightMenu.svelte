<script>
    import {fly} from 'svelte/transition'
    import {page} from "$app/stores";
    import {user} from "$lib/stores/user.js";
    import {boardMessages} from '$lib/stores/boardmsgs.js';
    import {createEventDispatcher} from "svelte";

    const dispatch = createEventDispatcher()

</script>

<div class="rightMenu" in:fly="{{x: 100}}" out:fly="{{x: 100}}">


    <div class="draggable hitbox"></div>
</div>


<style>

    .rightMenu {
        height: 100vh;
        width: 85px;
        background-color: #202020;
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        box-sizing: border-box;
        padding-bottom: 1.5em;
        padding-top: 1em;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: fixed;
        right: 0;
        z-index: 100;
        gap: 10px;
    }

    .hitbox {
        height: 100%;
        width: 85px;
    }

    .add {
        height: 50px;
        width: 50px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.22);
        transition: 250ms ease-in-out;
    }

    .add:hover {
        background-color: rgba(255, 255, 255, 0.4);
    }

    .boardicon {
        border: none;
        background: none;
        color: white;
        font-size: 12px;
        opacity: 0.9;
        word-break: break-word;
        font-family: 'Montserrat';
        cursor: pointer;
    }

    .boardicon:hover {
      opacity: 1
    }

    .button {
        width: 40px;
        height: 40px;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 5px;
        border-radius: 5px;
        transition: 250ms ease-in-out;
        background-color: transparent;
        cursor: pointer;
        border: none;
    }

    .icon {
        opacity: 80%;
        transition: 250ms ease-in-out;
    }

    .button:hover, .button:hover > .icon {
        background-color: #313131;
        opacity: 100%;
    }

</style>
