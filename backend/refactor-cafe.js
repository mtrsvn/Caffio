const fs = require("fs");
const path = require("path");

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Remove CAFES array
  content = content.replace(/const CAFES = \[\s*"Starbucks",[\s\S]*?"Custom Cafe",\s*\];/g, "");

  // Update state declarations
  if (filePath.includes("addLogSheet.tsx")) {
    const targetState = `  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);

  
  const [customCafeMode, setCustomCafeMode] = useState(false);
  const [customCafeText, setCustomCafeText] = useState("");
  const customCafeRef = useRef<TextInput | null>(null);`;

    const replacementState = `  const [cafeText, setCafeText] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);`;

    content = content.replace(targetState, replacementState);

    // reset
    content = content.replace(/setCustomCafeMode\(false\);\s*setCustomTypeMode\(false\);/,
      `setCafeText("");
        setCustomTypeMode(false);`
    );

  } else {
    // editLogSheet.tsx (this one already works correctly, so no need to change it if it is already processed, but we are re-running)
  }

  // Remove focus logic
  content = content.replace(/if \(customCafeMode\) customCafeRef\.current\?\.focus\(\);\s*/g, "");
  content = content.replace(/useEffect\(\(\) => \{\s*if \(customCafeMode\) \{\s*const t = setTimeout\(\(\) => customCafeRef\.current\?\.focus\(\), 50\);\s*return \(\) => clearTimeout\(t\);\s*\}\s*\}, \[customCafeMode\]\);\s*/g, "");

  // Remove selectCafe
  content = content.replace(/const selectCafe = \(c: string\) => \{[\s\S]*?setSelectedCafe\(\(prev\) => \(prev === c \? null : c\)\);\s*\};\s*/g, "");

  // Remove CAFES from layout effect
  content = content.replace(/CAFES\.forEach\(\(c\) => \{[\s\S]*?isSelected \? 1\.03 : 1\);\s*\}\);\s*if \(selectedCafe && !CAFES\.includes\(selectedCafe\)\) \{[\s\S]*?animateTo\(scale, 1\.03\);\s*\}/g, "");
  content = content.replace(/CAFES\.forEach\(\(c\) => \{[\s\S]*?isSelected \? 1\.03 : 1\);\s*\}\);\s*/g, "");

  // Remove renderCafePill and renderCustomCafePill
  content = content.replace(/const renderCustomCafePill = \(\) => \{[\s\S]*?const renderCafePill = \(c: string\) => \{[\s\S]*?return \(\s*<AnimatedTouchable[\s\S]*?<\/AnimatedTouchable>\s*\);\s*\};\s*/g, "");

  // Handle finalCafeValue and handleSave
  content = content.replace(/const finalCafeValue =\s*selectedCafe \?\?\s*\(customCafeMode && customCafeText\.trim\(\) \? customCafeText\.trim\(\) : null\);/g,
    `const finalCafeValue = cafeText.trim();`
  );

  content = content.replace(/if \(customCafeMode && customCafeText\.trim\(\)\) \{\s*setSelectedCafe\(customCafeText\.trim\(\)\);\s*\}/g, "");
  
  content = content.replace(/const finalCafe =\s*selectedCafe \?\?\s*\(customCafeMode && customCafeText\.trim\(\) \? customCafeText\.trim\(\) : null\);/g, "");
  content = content.replace(/const cafe =\s*selectedCafe \?\?\s*\(customCafeMode && customCafeText\.trim\(\) \? customCafeText\.trim\(\) : null\);/g, "");

  content = content.replace(/cafe: finalCafe/g, `cafe: finalCafeValue`);
  content = content.replace(/cafe: cafe/g, `cafe: finalCafeValue`);
  content = content.replace(/cafe,/g, `cafe: finalCafeValue,`);
  content = content.replace(/if \(!finalCafe \|\| !finalType\) \{/g, `if (!finalCafeValue || !finalType) {`);
  content = content.replace(/if \(!cafe \|\| !coffeeType\) return;/g, `if (!finalCafeValue || !coffeeType) return;`);

  content = content.replace(/setCustomCafeMode\(false\);/g, "");

  // UI replacement
  content = content.replace(/<View style=\{\{ marginBottom: customCafeMode \? 6 : 0 \}\}>[\s\S]*?\{customCafeMode && renderCafePill\("Custom Cafe"\)\}\s*<\/View>/,
`<View style={{ marginBottom: 6 }}>
              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Cafe</Text>
              <TextInput
                value={cafeText}
                onChangeText={setCafeText}
                placeholder="Enter cafe name (e.g. Local Roasters)"
                placeholderTextColor="rgba(78,52,46,0.45)"
                style={styles.fullInput}
                returnKeyType="done"
              />
            </View>`
  );

  // If there are leftovers like selectedCafe, remove them from dependencies
  content = content.replace(/, selectedCafe/g, "");
  content = content.replace(/selectedCafe, /g, "");

  fs.writeFileSync(filePath, content, "utf8");
  console.log("Processed", filePath);
}

processFile(path.join(__dirname, "..", "app", "components", "addLogSheet.tsx"));
