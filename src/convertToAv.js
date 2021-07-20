function convertToAv(text, recursionLevel, lubbleMode) {
  let convertedText = "";

  for (const c of text) {
    convertedText += convertCharToAv(c, lubbleMode) + " ";
  };

  if (recursionLevel > 1) {
    recursionLevel--;
    return convertToAv(convertedText, recursionLevel, lubbleMode);
  } else {
    return convertedText.split(" ").filter(c => c.length >= 1).join(" ");
  }
}

export default convertToAv;

function convertCharToAv(c, lubbleMode) {
  switch (c.toLowerCase()) {
    case 'a': return "Alpha";
    case 'b': return "Bravo";
    case 'c': return "Charlie";
    case 'd': return "Delta";
    case 'e': return "Echo";
    case 'f': return "Foxtrot";
    case 'g': return "Golf";
    case 'h': return "Hotel";
    case 'i': return "India";
    case 'j': return "Juliett";
    case 'k': return "Kilo";
    case 'l': {
      if (!lubbleMode) {
        return "Lima"
      } else {
        return "Lubble"
      }
    }
    case 'm': return "Mike";
    case 'n': return "November";
    case 'o': {
      if (!lubbleMode) {
        return "Oscar"
      } else {
        return "Oof"
      }
    }
    case 'p': return "Papa";
    case 'q': return "Quebec";
    case 'r': return "Romeo";
    case 's': return "Sierra";
    case 't': return "Tango";
    case 'u': return "Uniform";
    case 'v': return "Victor";
    case 'w': return "Whiskey";
    case 'x': return "X-ray";
    case 'y': return "Yankee";
    case 'z': return "Zulu";
    case ' ': return "";
    default: return c.toUpperCase();
  }
}
