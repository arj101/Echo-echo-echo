<script>
  export let checked = false;

  function onClick() {
    checked = !checked;
  }
</script>

<button on:click={onClick} on:click>
    {#if checked}
      <img
        src="./Chkbox_checked.svg" alt="checkbox_checked">
    {:else}
      <img
        src="./Chkbox_unchecked.svg" alt="checkbox_unchecked">
    {/if}
</button>

<style>
  img {
    width: 1.25rem;
    height: 1.25rem;
    -moz-user-select: none;
    -webkit-user-select: none;
    -moz-user-drag: none;
    -webkit-user-drag: none;
  }
  button {
    display: grid;
    place-items: center;
    border: none;
    border-radius: 100%;
    background-color: rgba(255, 255, 255, 0);
    transition: all 300ms ease;
    cursor: url(../cursor1.png) 13 13, pointer;
    padding: 0.5rem;
  }
  button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  button:active {
    background-color: rgba(255, 255, 255, 0.4);
    cursor: url(../cursor2.png) 15 10, pointer;
  }
</style>
