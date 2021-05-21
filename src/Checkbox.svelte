<script>
  export let checked = false;

  import { onMount } from 'svelte';

  // onMount(() => {
  //   for (const node of document.getElementsByTagName("button")) {
  //     node.addEventListener('contextmenu', (e) => {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       return false;
  //     });
  //   }
  // });


  function onClick() {
    checked = !checked;
  }
</script>

<button on:click={onClick} on:click>
    <img id="im1"
        src="./Chkbox_checked.svg" alt="checkbox_checked" class:active={checked} class:inactive={!checked}>
    <img id="im2"
        src="./Chkbox_unchecked.svg" alt="checkbox_unchecked"  class:active={!checked} class:inactive={checked}>
</button>

<style>
  img {
    width: 1.25rem;
    height: 1.25rem;
    transition: all 200ms ease;
  }
  .inactive {
    position: absolute;
    pointer-events: none;
    opacity: 0;
  }
  button {
    display: grid;
    place-items: center;
    border: none;
    border-radius: 100%;
    background-color: rgba(255, 255, 255, 0);
    transition: all 300ms ease;
    cursor: url(../cursor1.png) 10 10, pointer;
    padding: 0.5rem;
  }
  button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  button:active {
    background-color: rgba(255, 255, 255, 0.4);
    cursor: url(../cursor2.png) 5 5, pointer;
  }
</style>
