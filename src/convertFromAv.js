function convertFromAv(text, recursionLevel, lubbleMode) {
  text = text.split(" ").join("").toLowerCase();
  let currIdx = 0;
  let convertedText = "";
  while (currIdx < text.length) {
    let [char, avLength] = convertAvToChar(text.slice(currIdx), lubbleMode);
    convertedText += char;
    currIdx += avLength;
  }

  if (recursionLevel > 1) {
    recursionLevel--;
    return convertFromAv(convertedText, recursionLevel, lubbleMode);
  }
  return convertedText.split("").filter((c) => c.length >= 1 && c != " ").join(" ");
}

export default convertFromAv;

function convertAvToChar(av, lubbleMode) {
  switch (true) {
    case av.startsWith("alpha"): return ["A", 5];
    case av.startsWith("bravo"): return ["B", 5];
    case av.startsWith("charlie"): return ["C", 7];
    case av.startsWith("delta"): return ["D", 5];
    case av.startsWith("echo"): return ["E", 4];
    case av.startsWith("foxtrot"): return ["F", 7];
    case av.startsWith("golf"): return ["G", 4];
    case av.startsWith("hotel"): return ["H", 5];
    case av.startsWith("india"): return ["I", 5];
    case av.startsWith("juliett"): return ["J", 7];
    case av.startsWith("kilo"): return ["K", 4];
    case av.startsWith("lima"): {
      if (!lubbleMode) {
        return ["L", 4]
      } else {
        break;
      }
    }
    case av.startsWith("mike"): return ["M", 4];
    case av.startsWith("november"): return ["N", 8];
    case av.startsWith("oscar"): { 
      if (!lubbleMode) {
        return ["O", 5];
      } else {
        break;
      }
    }
    case av.startsWith("papa"): return ["P", 4];
    case av.startsWith("quebec"): return ["Q", 6];
    case av.startsWith("romeo"): return ["R", 5];
    case av.startsWith("sierra"): return ["S", 6];
    case av.startsWith("tango"): return ["T", 5];
    case av.startsWith("uniform"): return ["U", 7];
    case av.startsWith("victor"): return ["V", 6];
    case av.startsWith("whiskey"): return ["W", 7];
    case av.startsWith("x-ray"): return ["X", 5];
    case av.startsWith("yankee"): return ["Y", 6];
    case av.startsWith("zulu"): return ["Z", 4];
    default: {
      if (lubbleMode) {
        switch (true) {
          case av.startsWith("lubble"): return ["L", 6];
          case av.startsWith("oof"): return ["O", 3];
        }
      }
      return [av[0].toUpperCase(), 1]
    };
  }
}
