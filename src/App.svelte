<script>
  import { fade, fly } from "svelte/transition";
  import { onMount } from 'svelte';
  import Checkbox from "./Checkbox.svelte";

  import convertFromAv from './convertFromAv.js';
  import convertToAv from './convertToAv.js';
  import backdrop from './backdrop.js';

  let input;
  let recursionLevel = 1;

  let settingsMenuState = false;

  let reverseMode = false;
  let addSpaceBetweenChars = false;

  let showCopyIndicator = false;

  let settingsMenu;
  let lubbleMode = false;

  let settingsMenuOpen = false;

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

  let colourNavbar = false;

  onMount(() => {
    setTimeout(() => colourNavbar = true, 400);
    backdrop();
    document.addEventListener('keyup', (e) => {
      if (e.ctrlKey && e.keyCode === 88) {
        copyOutput();
      }
    });

    document.addEventListener('click', (e) => {
      if (!settingsMenuOpen) return;
      if (!settingsMenu.contains(e.target)) {
        toggleSettings();
      }
    });

    for (const node of document.getElementsByTagName("button")) {
      node.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    }
  });

  function onInput() {
    if (reverseMode) {
      if (input) {
        convertedText = convertText(input, recursionLevel);
      } else {
        let outputFieldText = placeholders[Math.floor(Math.random() * placeholders.length)];
        placeholder = convertToAv(outputFieldText, recursionLevel, lubbleMode);
        if (addSpaceBetweenChars) {
          convertedText = outputFieldText.split("").join(" ");
        } else {
          convertedText = outputFieldText;
        }
      }
    } else {
      if (input) {
        convertedText = convertToAv(input, recursionLevel, lubbleMode);
      } else {
        placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
        convertedText = convertToAv(placeholder, recursionLevel, lubbleMode);
      }
    }
  }

  function convertText(text, recursionLevel) {
    let convertedText;
    if (reverseMode) {
      if (addSpaceBetweenChars) {
        convertedText = convertFromAv(text, recursionLevel, lubbleMode);
      } else {
        convertedText = convertFromAv(text, recursionLevel, lubbleMode).split(" ").join("");
      }
    } else {
      convertedText = convertToAv(text, recursionLevel, lubbleMode);
    }
    return convertedText;
  }

  function toggleSettings() {
    settingsMenuState = !settingsMenuState;
    if (settingsMenuState) {
      setTimeout(() => settingsMenuOpen = true, 300);
    } else {
      settingsMenuOpen = false;
    }
  }


  function updatePlaceholder() {
    if (reverseMode) {
      placeholder =
        convertToAv(placeholders[Math.floor(Math.random() * placeholders.length)], recursionLevel, lubbleMode);
    } else {
      placeholder =
        placeholders[Math.floor(Math.random() * placeholders.length)];
    }
  }

  function toggleReverseMode() {
    reverseMode = !reverseMode;
    if (reverseMode) {
      let outputFieldText = placeholders[Math.floor(Math.random() * placeholders.length)];
      placeholder = convertToAv(outputFieldText, recursionLevel, lubbleMode);
      if (input) {
        convertedText = convertText(input, recursionLevel);
      } else {
        if (addSpaceBetweenChars) {
          convertedText = outputFieldText.split("").join(" ");
        } else {
          convertedText = outputFieldText;
        }
      }
    } else {
      placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
      if (input) {
        convertedText = convertToAv(input, recursionLevel, lubbleMode);
      } else {
        convertedText = convertToAv(placeholder, recursionLevel, lubbleMode);
      }
    }
  }
  function toggleSpaceInbetween() {
    addSpaceBetweenChars = !addSpaceBetweenChars;
    onInput();
  }

  function toggleLubbleMode() {
    lubbleMode = !lubbleMode;
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

  function clearInput() {
    if (input) {
      input = "";
      onInput();
    }
  }
</script>

<svelte:head>
  {#if colourNavbar}
    <meta name="theme-color" content="hsla(263, 53%, 58%, 1)" />
  {:else}
    <meta name="theme-color" content="white" />
  {/if}
</svelte:head>

<main class:shadow__main={!colourNavbar}>
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
      /></button
    >
  </header>

  <div id="line"></div>

  <div id="content">
    <input class="input" bind:value={input} on:input={onInput} {placeholder}/>

    <p id="output" class:word-break__break_all={!reverseMode} class:word-break__break-word={reverseMode}>{convertedText}</p>
  </div>

  <button id="copy-button" on:click={copyOutput}>
    <img src="./Copy.svg" alt="Copy">
  </button>

  {#if input}
    <button id="clear-button" on:click={clearInput} in:fly={{ x: 100, duration: 300}} out:fly={{ x: 100, duration: 500}}>
      <img src="./Clear.svg" alt="Clear">
    </button>
  {/if}

  <input type="text" id="copy-area" class="ssshhhh-Im-for-copying" value={convertedText} readonly/>

  <!-- i dont this works lol -->
  <div id="preloading-area" class="ssshhhh">
    <img class="preloader" src="./cursor1.png">
    <img class="preloader" src="./cursor2.png">
    <img class="preloader" src="./Chkbox_checked.svg">
    <img class="preloader" src="./Chkbox_unchecked.svg">
    <img class="preloader" alt="./Clear.svg">
  </div>

  <!-- <svg width="1152" height="502" viewBox="0 0 1152 502" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1152" height="502" fill="white"/>
    <path id="triangle" d="M201.227 340.171L250.065 248.96L295.691 341.82L201.227 340.171Z" stroke="#FFC1C1" stroke-width="10"/>
    <rect id="rect1" x="703.869" y="188.498" width="90" height="90" stroke="#C1FFF4" stroke-width="10"/>
    <rect id="rect2" x="930.437" y="382.493" width="32" height="32" stroke="#CEFFC1" stroke-width="10"/>
    <circle id="circle" cx="1007" cy="68" r="15" stroke="#FFF9C1" stroke-width="10"/>
  </svg> -->

  <footer>
    <div class="link">
      <img class="link-img" src="./Link.svg" alt="">
      <a class="link-url" href="https://aaa.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.com/">Inpired by A(x56)</a>
    </div>

    <div class="link">
      <img class="link-img" src="./Link.svg" alt="">
      <a class="link-url" href="https://github.com/arj101/Echo-echo-echo">View source code on Github</a>
    </div>
  </footer>
</main>


{#if settingsMenuState}
  <div
    id="settings-menu"
    in:fly={{ y: -300, duration: 300 }}
    out:fly={{ y: -300, duration: 300 }}
    bind:this={settingsMenu}
  >
    <div class="settings-options">
      <label class="settings-label" for="recurs-lvl-set"
        >Recursion level: {recursionLevel}</label
      >
      <input
        type="range"
        min="1"
        max="5"
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
      <label class="settings-label">Lubble mode</label>
      <Checkbox checked={lubbleMode} on:click={toggleLubbleMode}/>
      {#if reverseMode}
      <label class="settings-label" in:fly={{ x: -100, duration: 300}} out:fly={{ x: 100, duration: 300}}
        >Space characters</label
      >
      <Checkbox checked={addSpaceBetweenChars} on:click={toggleSpaceInbetween}/>
      {/if}
    </div>
  </div>

  <div id="background-dimmer" transition:fade>
  </div>
{/if}

{#if showCopyIndicator}
  <div id="copy-indicator" in:fly={{ y: 100, duration: 200}} out:fly={{ y: 100, duration: 400}}>
    <p>Copied!</p>
  </div>
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
  .word-break__break-all {
    word-break: break-all; /* yeah lol*/
  }

  .word-break__break-word {
    word-break: break-word;
  }

  svg {
    position: fixed;
    z-index: 0;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 100vw;
    opacity: 0.5;
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
    min-height: 100%;
    overflow-x: hidden;
    animation: scale-in 400ms cubic-bezier(0.15, 0.71, 0.31, 0.91);
  }

  @keyframes scale-in {
    from{
      transform: scale(0.75);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  #topbar {
    background-color: hsla(263, 53%, 58%, 1);
    width: 100%;
    height: fit-content;
    text-transform: uppercase;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
    z-index: 4;
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

  #output {
    margin-top: 3rem;
    color: hsla(0, 0%, 17%, 1);
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 300;
    font-size: 1rem;
    margin-left: 1rem;
    z-index: 1;
    width: calc(50vw - 1rem);
    margin-bottom: 9rem;
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
    -moz-user-select: none;
    -webkit-user-select: none;
    -moz-user-drag: none;
    -webkit-user-drag: none;
  }

  #settings-svg {
    width: 1.45rem;
    height: 1.45rem;
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
    backdrop-filter: blur(10px);
    z-index: 5;
    border-radius: 0.5rem;
    box-shadow: rgba(50, 50, 93, 0.15) 0px 50px 100px -20px,
      rgba(0, 0, 0, 0.2) 0px 30px 60px -30px;
    display: flex;
    align-items: center;
    justify-content: start;
    flex-direction: column;
    padding: 2rem;
    cursor: url(../cursor1.png) 10 10, auto;
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
    opacity: 1;
    transition: opacity 500ms ease;
    cursor: url(../cursor1.png) 10 10, pointer;
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
    cursor: url(../cursor1.png) 10 10, pointer;
  }

  #recurs-lvl-set:hover {
    opacity: 1;
  }

  #recurs-lvl-set:active {
    cursor: url(../cursor2.png) 5 5, pointer;
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
    z-index: 2;
    cursor: pointer;
    box-shadow: rgba(50, 50, 93, 0.35) 0px 10px 15px -4px, rgba(0, 0, 0, 0.4) 0px 6px 9px -6px;
    transition: all 300ms ease;
  }

  #clear-button {
    position: fixed;
    right: 1rem;
    bottom: 5.3rem;
    margin: 0;
    border: 2px solid #F17171;
    outline: none;
    padding: 1rem;
    display: grid;
    place-items: center;
    background-color: white;
    border-radius: 100%;
    z-index: 2;
    cursor: pointer;
    box-shadow: rgba(50, 50, 93, 0.35) 0px 10px 15px -4px, rgba(0, 0, 0, 0.4) 0px 6px 9px -6px;
    transition: all 300ms ease;
  }

  #clear-button img {
    width: 1.3rem;
    height: 1.3rem;
    -moz-user-select: none;
    -webkit-user-select: none;
    -moz-user-drag: none;
    -webkit-user-drag: none;
    color: #F17171;
  }

  #copy-button:hover {
    border: 2px solid #FFF;
  }

  #clear-button:hover {
    border: 2px solid #FFF;
  }

  #copy-button img {
    width: 1.3rem;
    height: 1.3rem;
    -moz-user-select: none;
    -webkit-user-select: none;
    -moz-user-drag: none;
    -webkit-user-drag: none;
  }

  #copy-button:active {
    box-shadow: rgba(50, 50, 93, 0.25) 0px 10px 20px -4px inset, rgba(0, 0, 0, 0.3) 0px 6px 12px -6px inset;
  }

  #clear-button:active {
    box-shadow: rgba(50, 50, 93, 0.25) 0px 10px 20px -4px inset, rgba(0, 0, 0, 0.3) 0px 6px 12px -6px inset;
  }

  /* smh */
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
    border: none;
    border-radius: 0.2rem;
    background-color: #F17171;
    display: grid;
    place-items: center;
    box-shadow: rgba(50, 50, 93, 0.35) 0px 10px 15px -4px, rgba(0, 0, 0, 0.4) 0px 6px 9px -6px;
    z-index: 2;
    height: 3.3rem;
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

  /* What am I even doing */
  #preloading-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
    z-index: 0;
  }

  /* Whats wrong with me */
  .preloader {
    width: 0rem;
    height: 0rem;
  }

  #background-dimmer {
    position: absolute;
    margin: 0;
    border: none;
    padding: 0;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 3;
  }

  footer {
    margin: 0;
    border: none;
    padding: 0;
    padding-bottom: 0.25rem;
    padding-left: 0.5rem;
    display: flex;
    align-items: flex-start;
    justify-content: stretch;
    flex-direction: column;
    background-color: white;
    position: absolute;
    width: 100%;
    bottom: 0;
    left: 0;
    transition: all 200ms ease;
    z-index: 1;
  }

  .link {
    flex-grow: 1;
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: flex-start;
  }

  .link-url {
    color: black;
    margin: 0.3rem;
    font-family: 'Noto Sans JP';
    font-weight: 300;
    font-size: 0.85rem;
    text-decoration: none;
  }

  .link-url:hover {
    text-decoration: underline;
  }

  .link-img {
    margin: 0.25rem;
    transition: all 300ms ease;
    height: 1.2rem;
    width: auto;
  }

  .link:hover > .link-img {
    transform: translateX(15%);
  }

  .shadow__main {
    box-shadow: rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px;
  }

  #line {
    position: fixed;
    top: 0;
    right: 10rem;
    width: 3rem;
    height: 100vh;
    background-color: #875BCD30;
    z-index: 2;
  }

  @media only screen and (max-width: 800px) {
    #line {
      opacity: 0;
      pointer-events: none;
    }
    
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
    svg {
      opacity: 0;
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
