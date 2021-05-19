<script>
  export let convertToAv;

  import { fade, fly } from "svelte/transition";
  import { onMount } from 'svelte';
  import Checkbox from "./Checkbox.svelte";

  import convertFromAv from './convertFromAv.js'

  let input;
  let recursionLevel = 1;

  let settingsMenuState = false;

  let reverseMode = false;
  let addSpaceBetweenChars = false;

  let showCopyIndicator = false;

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

  let convertedText = convertText(placeholder, recursionLevel);

  onMount(() => {
    document.addEventListener('keyup', (e) => {
      if (e.ctrlKey && e.keyCode === 67) {
        copyOutput();
      }
    });
  });

  function onInput() {
    if (reverseMode) {
      if (input) {
        convertedText = convertText(input, recursionLevel);
      } else {
        let outputFieldText = placeholders[Math.floor(Math.random() * placeholders.length)];
        placeholder = convertToAv(outputFieldText, recursionLevel);
        if (addSpaceBetweenChars) {
          convertedText = outputFieldText.split("").join(" ");
        } else {
          convertedText = outputFieldText;
        }
      }
    } else {
      if (input) {
        convertedText = convertToAv(input, recursionLevel);
      } else {
        placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
        convertedText = convertToAv(placeholder, recursionLevel);
      }
    }
  }

  function convertText(text, recursionLevel) {
    let convertedText;
    if (reverseMode) {
      if (addSpaceBetweenChars) {
        convertedText = convertFromAv(text, recursionLevel);
      } else {
        convertedText = convertFromAv(text, recursionLevel).split(" ");
      }
    } else {
      convertedText = convertToAv(text, recursionLevel);
    }
    return convertedText;
  }

  function toggleSettings() {
    settingsMenuState = !settingsMenuState;
  }


  function updatePlaceholder() {
    if (reverseMode) {
      placeholder =
        convertToAv(placeholders[Math.floor(Math.random() * placeholders.length)], recursionLevel);
    } else {
      placeholder =
        placeholders[Math.floor(Math.random() * placeholders.length)];
    }
  }

  function toggleReverseMode() {
    reverseMode = !reverseMode;
    if (reverseMode) {
      let outputFieldText = placeholders[Math.floor(Math.random() * placeholders.length)];
      placeholder = convertToAv(outputFieldText, recursionLevel);
      if (input) {
        convertedText = convertText(input, recursionLevel);
      } else {
        convertedText = outputFieldText;
      }
    } else {
      placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
      if (input) {
        convertedText = convertToAv(input, recursionLevel);
      } else {
        convertedText = convertToAv(placeholder, recursionLevel);
      }
    }
  }
  function toggleSpaceInbetween() {
    addSpaceBetweenChars = !addSpaceBetweenChars;
    onInput();
  }

  function copyOutput() {
    const inputElement = document.querySelector("#copy-area");
	  inputElement.select();
	  inputElement.setSelectionRange(0, 99999); /* For mobile devices */
	  document.execCommand("copy");
    if (!showCopyIndicator) {
      showCopyIndicator = true;
      setTimeout(() => showCopyIndicator = false, 900);
    }
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
    <!-- {#if reverseMode}
      <textarea rows="4" class="input" on:input={onInput}>{input || ""}</textarea>   //maybe later
    {:else} -->
      <input class="input" bind:value={input} on:input={onInput} {placeholder}/>
    <!-- {/if} -->
    <p id="output">
      {#each convertedText as char}
        <span transition:fade>{char}</span>
      {/each}
    </p>
  </div>
  <button id="copy-button" on:click={copyOutput}><img src="./Copy.svg" alt="Copy"></button>
  <input type="text" id="copy-area" class="ssshhhh-Im-for-copying" value={convertedText} readonly/>
</main>

<div id="loading-bg">
</div>

{#if settingsMenuState == true}
  <div
    id="settings-menu"
    in:fly={{ y: -300, duration: 400 }}
    out:fly={{ y: -300, duration: 700 }}
  >
    <div class="settings-options">
      <label class="settings-label" for="recurs-lvl-set"
        >Recursion level: {recursionLevel}</label
      >
      <input
        type="range"
        min="1"
        max="3"
        bind:value={recursionLevel}
        id="recurs-lvl-set"
        on:change={onInput}
      />
    </div>
    <div class="settings-options"  style="margin-top: 2rem" >
      <label class="settings-label"
        >Reverse mode</label
      >
      <Checkbox checked={reverseMode} on:click={toggleReverseMode}/>
      {#if reverseMode}
      <label class="settings-label" in:fly={{ x: -100, duration: 300}} out:fly={{ x: 100, duration: 300}}
        >Add space between characters</label
      >
      <Checkbox checked={addSpaceBetweenChars} on:click={toggleSpaceInbetween}/>
      {/if}
    </div>
  </div>
{/if}

{#if showCopyIndicator}
  <div id="copy-indicator" in:fly={{ y: 100, duration: 200}} out:fly={{ y: 100, duration: 400}}>
    <p>Copied!</p>
  </div>
{/if}

{#if reverseMode}
  <style>
    #output {
      word-break: break-all;
    }
  </style>
{:else}
  <style>
    #output {
      word-break: break-word;
    }
  </style>
{/if}

{#if settingsMenuState}
  <style>
    #content, #plen, #copy-button, #copy-indicator{
      pointer-events: none;
    }
    body {
      overflow: hidden;
    }
  </style>
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
    height: 100%;
  }
  #topbar {
    background-color: hsla(263, 82%, 69%, 1);
    width: 100%;
    height: fit-content;
    text-transform: uppercase;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
    z-index: 2;
  }
  #title {
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 400;
    margin: 0.5rem;
    font-size: 1.5rem;
    transition: margin 300ms ease;
    color: white;
    -moz-user-select: none;
    -webkit-user-select: none;
  }
  #e1 {
    opacity: 1;
  }
  #e2 {
    opacity: 0.6;
  }
  #e3 {
    opacity: 0.3;
  }

  .input {
    margin-top: 4rem;
    background-color: hsla(264, 81%, 92%, 1);
    border: none;
    border-radius: 0.2rem;

    padding: 0.8rem;
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 400;
    font-size: 1rem;
    color: white;

    margin-inline: 0;
    margin-left: 1rem;
    width: calc(50vw - 1rem);

    transition: background-color 300ms ease;
    z-index: 1;
  }

  textarea {
    resize: none;
  }

  #output {
    margin-top: 3rem;
    color: hsla(0, 0%, 17%, 1);
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 300;
    font-size: 1rem;
    margin-left: 1rem;
    z-index: 1;
    width: calc(50vw - 1rem);
    margin-bottom: 5.5rem;
    -moz-user-select: all;
    -webkit-user-select: all;
  }

  ::selection {
    background-color:  hsla(264, 81%, 92%, 1);
  }

  ::placeholder {
    color: white;
    opacity: 0.7;
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

  .input:focus {
    outline: none;
    background-color: hsla(263, 80%, 83%, 1);
  }

  .input:not(:placeholder-shown) {
    background-color: hsla(263, 80%, 83%, 1);
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
    background-color:  hsla(263, 82%, 75%, 0);
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
    background-color: hsla(263, 82%, 75%, 0.2);
  }

  #settings:hover {
    background-color: hsla(263, 82%, 75%, 0.4);
  }

  #settings:active {
    background-color: hsla(263, 82%, 75%, 0.8);
  }

  #settings-menu {
    position: absolute;
    left: calc(30vw - 2rem);
    top: 5rem;
    width: 40vw;
    height: fit-content;
    background-color: hsla(263, 82%, 69%, 0.6);
    backdrop-filter: blur(5px);
    z-index: 2;
    border-radius: 0.5rem;
    box-shadow: rgba(50, 50, 93, 0.15) 0px 50px 100px -20px,
      rgba(0, 0, 0, 0.2) 0px 30px 60px -30px;
    display: flex;
    align-items: center;
    justify-content: start;
    flex-direction: column;
    padding: 2rem;
    cursor: url(../cursor1.png) 13 13, auto;
  }

  .settings-options {
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
    opacity: 0.5;
    transition: opacity 500ms ease;
    cursor: url(../cursor1.png) 13 13, pointer;
  }

  #recurs-lvl-set::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1rem;
    height: 1rem;
    border: none;
    background-color: #F17171;
    border-radius: 0;
  }

  #recurs-lvl-set::-moz-range-thumb {
    -moz-appearance: none;
    width: 1rem;
    height: 1rem;
    border: none;
    background-color: #F17171;
    border-radius: 0;
  }

  .settings-label {
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 400;
    color: white;
    cursor: url(../cursor1.png) 13 13, pointer;
  }

  #recurs-lvl-set:hover {
    opacity: 1;
  }

  #recurs-lvl-set:active {
    cursor: url(../cursor2.png) 15 10, pointer;
  }

  #copy-button {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    margin: 0;
    border: 2px solid #F17171;
    outline: none;
    padding: 1rem;
    display: grid;
    place-items: center;
    background-color: #F17171;
    border-radius: 100%;
    z-index: 3;
    cursor: pointer;
    box-shadow: rgba(50, 50, 93, 0.35) 0px 10px 15px -4px, rgba(0, 0, 0, 0.4) 0px 6px 9px -6px;
    transition: all 300ms ease;
  }

  #copy-button img {
    width: 1rem;
    height: 1rem;
    -moz-user-select: none;
    -webkit-user-select: none;
    -moz-user-drag: none;
    -webkit-user-drag: none;
  }

  #copy-button:hover {
    border: 2px solid #FFF;
  }

  #copy-button:active {
    box-shadow: rgba(50, 50, 93, 0.25) 0px 10px 20px -4px inset, rgba(0, 0, 0, 0.3) 0px 6px 12px -6px inset;
  }

  #copy-area {
    position: absolute;
    pointer-events: none;
    opacity: 0;
    width: 1rem;
    height: 1rem;
    margin: 0;
    padding: 0;
    border: none;
  }

  #copy-indicator {
    position: fixed;
    bottom: 1rem;
    right: 7rem;
    margin: 0;
    padding-inline: 2rem;
    padding-block: 0.5rem;
    border: none;
    border-radius: 0.2rem;
    background-color: #F17171;
    display: grid;
    place-items: center;
    box-shadow: rgba(50, 50, 93, 0.35) 0px 10px 15px -4px, rgba(0, 0, 0, 0.4) 0px 6px 9px -6px;
    z-index: 2;
    height: 2rem;
  }

  #copy-indicator p {
    margin: 0;
    padding: 0;
    border: none;
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 500;
    font-size: 1rem;
    color: white;
  }

  #loading-bg {
    position: absolute;
    margin: 0;
    padding: 0;
    border: none;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    animation: loading-animation 2000ms cubic-bezier(0.35, 1.01, 0.53, 0.99);
    z-index: 4;
    background-color: hsla(263, 82%, 69%, 1);
    transform: translateY(100%);
  }

  @keyframes loading-animation {
    from {
      transform: translateY(0%);
    }
    to {
      transform: translateY(100%);
    }
  }


  @media only screen and (max-width: 800px) {
    #title {
      margin: 1rem;
    }
    .input {
      margin-top: 5rem;
      width: 93vw;
      margin-inline: auto;
      font-size: 1.5rem;
    }
    #output {
      width: 93vw;
    }

    #settings-menu {
      left: calc(15vw - 2rem);
      width: 70vw;
    }
    #recurs-lvl-set {
      opacity: 1;
    }
  }

  @media only screen and (max-width: 500px) {
    #copy-indicator {
      bottom: 1rem;
      left: 1rem;
      right: auto;
      width: calc(100vw - 10rem);
    }
  }
</style>
