<script>
  export let convertToAv;

  import { fade, fly } from "svelte/transition";
  import App from "../../aviationiser/src/App.svelte";

  let input;
  let recursionLevel = 1;

  let settingsMenuState = false;

  const placeholders = [
    "PHNL",
    "PHOG",
    "GECKO",
    "BOOKE",
    "ALANA",
    "JULLE",
    "SAKKI",
    "LNY",
    "MKK",
    "PHNY",
  ];

  let placeholder =
    placeholders[Math.floor(Math.random() * placeholders.length)];

  let convertedText = convertToAvPhonetics(placeholder, recursionLevel);

  function onInput() {
    if (input.length === 0) {
      placeholder =
        placeholders[Math.floor(Math.random() * placeholders.length)];
      convertedText = convertToAvPhonetics(placeholder, recursionLevel);
      return;
    }
    convertedText = convertToAvPhonetics(input, recursionLevel);
  }

  function convertToAvPhonetics(text, recursionLevel) {
    return convertToAv(text, recursionLevel).split("");
  }

  function toggleSettings() {
    settingsMenuState = !settingsMenuState;
    console.log(settingsMenuState);
  }

  function updateConvertedText() {
    let text = input || placeholder;
    convertedText = convertToAvPhonetics(text, recursionLevel);
  }
</script>

<main>
  <header id="topbar">
    <h1 id="title">
      <span id="e1">Echo</span> <span id="e2">Echo</span>
      <span id="e3">Echo</span>
    </h1>
    <button id="settings" on:click={toggleSettings}
      ><img
        src="./Settings.svg"
        alt="Settings"
        id="settings-svg"
        class="select-disable"
      /></button
    >
  </header>
  <div id="content">
    <input id="input" bind:value={input} on:input={onInput} {placeholder} />
    <p id="output">
      {#each convertedText as char}
        <span transition:fade>{char}</span>
      {/each}
    </p>
  </div>
  <img id="plen" src="./Plen.svg" alt="Plen" class="select-disable" />
</main>

{#if settingsMenuState == true}
  <div
    id="settings-menu"
    in:fly={{ y: -300, duration: 400 }}
    out:fly={{ y: 300, duration: 300 }}
  >
    <div id="recurs-lvl">
      <label id="recurs-lvl-label" for="recurs-lvl-set"
        >Recursion level: {recursionLevel}</label
      >
      <input
        type="range"
        min="1"
        max="3"
        bind:value={recursionLevel}
        id="recurs-lvl-set"
        on:change={updateConvertedText}
      />
    </div>
  </div>
{/if}

<style>
  .select-disable {
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -o-user-select: none;
    user-select: none;
    pointer-events: none;
  }

  main {
    padding: 0;
    margin: 0;
    border: none;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  #topbar {
    background-color: hsla(302, 23%, 59%, 1);
    width: 100%;
    height: fit-content;
    text-transform: uppercase;
    box-shadow: 0px 2px 4px rgba(68, 45, 67, 0.25);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
  }
  #title {
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 400;
    margin: 0.5rem;
    font-size: 1.5rem;
    transition: margin 300ms ease;
    -moz-user-select: none;
    -webkit-user-select: none;
  }
  #e1 {
    color: white;
  }
  #e2 {
    color: hsla(302, 22%, 88%, 1);
  }
  #e3 {
    color: hsla(302, 23%, 75%, 1);
  }

  #input {
    margin-top: 4rem;
    background-color: hsla(302, 22%, 96%, 1);
    border: none;
    border-radius: 0.2rem;

    padding: 0.8rem;
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 400;
    font-size: 1rem;
    color: hsla(302, 21%, 33%, 1);

    margin-inline: 0;
    margin-left: 1rem;
    width: calc(50vw - 1rem);

    transition: background-color 300ms ease;
    z-index: 1;
  }

  #output {
    margin-top: 3rem;
    color: hsla(302, 20%, 22%, 1);
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 500;
    font-size: 1rem;
    margin-left: 1rem;
    z-index: 1;
    width: calc(50vw - 1rem);
    margin-bottom: 5.5rem;
    -moz-user-select: all;
    -webkit-user-select: all;
  }

  ::selection {
    background-color: hsla(302, 20%, 22%, 0.25);
  }

  ::placeholder {
    color: hsla(302, 21%, 33%, 0.75);
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 400;
  }

  #content {
    display: flex;
    align-items: flex-start;
    justify-content: space-around;
    width: 100%;
    height: fit-content;
    flex-direction: column;
  }

  #input:focus {
    outline: none;
    background-color: hsla(302, 22%, 90%, 1);
  }

  #plen {
    position: fixed;
    top: 35vh;
    width: 25vw;
    height: auto;
    right: 5vw;
    z-index: 0;
    -moz-user-select: none;
    -webkit-user-select: none;
    transition: all 500ms cubic-bezier(0, 0.68, 0.25, 1.55);
    opacity: 1;
  }

  #settings {
    width: 2.8rem;
    height: 2.8rem;
    margin: 0;
    margin-right: 0.5rem;
    border-radius: 100%;
    display: grid;
    place-items: center;
    border: none;
    background-color: hsla(302, 23%, 75%, 0);
    transition: all 500ms ease;
    cursor: pointer;
    z-index: 3;
    -moz-user-select: none;
    -webkit-user-select: none;
    -moz-user-drag: none;
    -webkit-user-drag: none;
  }

  #settings-svg {
    width: 1.45rem;
    height: 1.45rem;
    -moz-user-select: none;
    -webkit-user-select: none;
    -moz-user-drag: none;
    -webkit-user-drag: none;
  }

  #settings:focus {
    background-color: hsla(302, 23%, 75%, 0.2);
  }

  #settings:hover {
    background-color: hsla(302, 23%, 75%, 0.4);
  }

  #settings:active {
    background-color: hsla(302, 23%, 75%, 0.8);
  }

  #settings-menu {
    position: absolute;
    left: calc(30vw - 2rem);
    top: 5rem;
    width: 40vw;
    height: fit-content;
    background-color: hsla(302, 23%, 59%, 1);
    z-index: 2;
    border-radius: 0.5rem;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 50px 100px -20px,
      rgba(0, 0, 0, 0.3) 0px 30px 60px -30px;

    display: flex;
    align-items: center;
    justify-content: start;
    flex-direction: column;
    padding: 2rem;
  }

  #recurs-lvl {
    width: 75%;
    height: fit-content;
    margin: 0;
    padding: 0;
    border: 0;
    display: flex;
    align-items: start;
    justify-content: start;
    flex-direction: column;
  }

  #recurs-lvl-set {
    border: none;
    outline: none;
    border-radius: 0.5rem;
    -webkit-appearance: none;
    appearance: none;
    height: 1rem;
    width: 100%;
    opacity: 0.4;
    transition: opacity 500ms ease;
  }

  #recurs-lvl-set::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1rem;
    height: 1rem;
    border: none;
    background-color: hsl(223, 82%, 69%);
    cursor: pointer;
    border-radius: 0;
  }

  #recurs-lvl-set::-moz-range-thumb {
    -moz-appearance: none;
    width: 1rem;
    height: 1rem;
    border: none;
    background-color: hsl(223, 82%, 69%);
    cursor: pointer;
    border-radius: 0;
  }

  #recurs-lvl-label {
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 300;
    color: white;
  }

  #recurs-lvl-set:hover {
    opacity: 1;
  }

  @media only screen and (max-width: 800px) {
    #title {
      margin: 1rem;
    }
    #input {
      margin-top: 5rem;
      width: 93vw;
      margin-inline: auto;
      font-size: 1.5rem;
    }
    #plen {
      top: 50vh;
      width: 85vw;
      height: auto;
      right: 7.5vw;
      opacity: 0.3;
    }
    #output {
      width: 93vw;
    }

    #settings-menu {
      left: calc(15vw - 2rem);
      width: 70vw;
    }
  }
</style>
