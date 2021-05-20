function convertToAv(text, recursionLevel) {
  text = text.split("");
  let convertedText = "";
  text.forEach((c) => {
    convertedText += convertCharToAv(c) + " ";
  });
  convertedText = convertedText.split(" ").filter((c) => c != " ").join(" ");
  if (recursionLevel > 1) {
    recursionLevel--;
    return convertToAv(convertedText, recursionLevel);
  } else {
    return convertedText;
  }
}

export default convertToAv;

function convertCharToAv(c) {
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
    case 'l': return "Lima";
    case 'm': return "Mike";
    case 'n': return "November";
    case 'o': return "Oscar";
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
    default: return c.toUpperCase();
  }
}
