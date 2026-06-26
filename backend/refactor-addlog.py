import sys

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Remove CAFES array
    content = content.replace('const CAFES = [\n  "Starbucks",\n  "Krispy Kreme",\n  "Dunkin\'",\n  "Tim Hortons",\n  "The Coffee Bean & Tea Leaf",\n  "Custom Cafe",\n];', "")

    # 2. Update states
    target_state = """  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);

  // custom inputs
  const [customCafeMode, setCustomCafeMode] = useState(false);
  const [customCafeText, setCustomCafeText] = useState("");
  const customCafeRef = useRef<TextInput | null>(null);"""
    
    new_state = """  const [cafeText, setCafeText] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);"""
    
    content = content.replace(target_state, new_state)

    # 3. Update reset
    target_reset = """        // reset
        setCustomCafeMode(false);
        setCustomTypeMode(false);"""
    new_reset = """        // reset
        setCafeText("");
        setCustomTypeMode(false);"""
    content = content.replace(target_reset, new_reset)

    # 4. Remove focus
    target_focus = "if (customCafeMode) customCafeRef.current?.focus();"
    content = content.replace(target_focus, "")

    target_focus_effect = """  useEffect(() => {
    if (customCafeMode) {
      const t = setTimeout(() => customCafeRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [customCafeMode]);"""
    content = content.replace(target_focus_effect, "")

    # 5. Remove selectCafe
    target_select = """  const selectCafe = (c: string) => {
    const prevSelected = selectedCafe;
    const nextSelected = prevSelected === c ? null : c;

    const tappedScale = getScale("cafe", c);
    pressIn(tappedScale);
    pressOutTo(tappedScale, nextSelected ? 1.03 : 1);

    if (prevSelected && prevSelected !== c) {
      const prevScale = getScale("cafe", prevSelected);
      animateTo(prevScale, 1);
    }

    setCustomCafeMode(false);
    setSelectedCafe((prev) => (prev === c ? null : c));
  };"""
    content = content.replace(target_select, "")

    # 6. Remove CAFES layout effect
    target_layout = """    CAFES.forEach((c) => {
      const scale = getScale("cafe", c);
      const isSelected = selectedCafe === c;
      animateTo(scale, isSelected ? 1.03 : 1);
    });

    // highlight custom pill if matched
    if (selectedCafe && !CAFES.includes(selectedCafe)) {
      const scale = getScale("cafe", selectedCafe);
      animateTo(scale, 1.03);
    }"""
    content = content.replace(target_layout, "")

    # 7. Remove renderCafePill
    target_render_1 = """  const renderCustomCafePill = () => {
    if (!selectedCafe || CAFES.includes(selectedCafe)) return null;
    const c = selectedCafe;
    const scale = getScale("cafe", c);
    return (
      <AnimatedTouchable
        key="__custom_cafe_selected"
        onPress={() => {
          // edit custom
          setCustomCafeText(c);
          setCustomCafeMode(true);
          setSelectedCafe(null);
          pressIn(scale);
          pressOutTo(scale, 1);
        }}
        onPressIn={() => pressIn(scale)}
        onPressOut={() => pressOutTo(scale, 1)}
        activeOpacity={0.85}
        style={{ margin: 5, transform: [{ scale }] } as any}
      >
        <LinearGradient
          colors={[
            colors.tasteSelectedGradientStart,
            colors.tasteSelectedGradientEnd,
          ]}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.pillSelected}
        >
          <Text style={styles.pillSelectedText}>{c}</Text>
        </LinearGradient>
      </AnimatedTouchable>
    );
  };"""
    target_render_2 = """  const renderCafePill = (c: string) => {
    const selected = selectedCafe === c;
    const isCustom = c === "Custom Cafe";
    const scale = getScale("cafe", c);

    if (isCustom) {
      if (customCafeMode) {
        return (
          <View key="custom-cafe-input" style={{ marginBottom: 7 }}>
            <Text style={styles.fieldLabel}>Cafe</Text>
            <TextInput
              ref={customCafeRef}
              value={customCafeText}
              onChangeText={setCustomCafeText}
              placeholder="Enter cafe name"
              placeholderTextColor="rgba(78,52,46,0.45)"
              style={styles.fullInput}
              returnKeyType="done"
              onSubmitEditing={() => {
                const text = customCafeText.trim();
                if (text.length) setSelectedCafe(text);
                setCustomCafeMode(false);
                Keyboard.dismiss();
              }}
            />
            <TouchableOpacity
              onPress={() => {
                setCustomCafeMode(false);
                setCustomCafeText("");
              }}
              activeOpacity={0.8}
              style={{ marginTop: 7 }}
            >
              <Text style={styles.chooseFromList}>
                Choose from list instead
              </Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <AnimatedTouchable
          key={c}
          onPress={() => {
            setCustomCafeText("");
            setCustomCafeMode(true);
            setSelectedCafe(null);
            pressIn(scale);
            pressOutTo(scale, 1);
          }}
          onPressIn={() => pressIn(scale)}
          onPressOut={() => pressOutTo(scale, 1)}
          activeOpacity={0.85}
          style={[styles.pillAdd, { margin: 5, transform: [{ scale }] } as any]}
        >
          <Text style={styles.pillAddText}>+</Text>
        </AnimatedTouchable>
      );
    }

    if (selected) {
      return (
        <AnimatedTouchable
          key={c}
          onPress={() => selectCafe(c)}
          onPressIn={() => pressIn(scale)}
          onPressOut={() => pressOutTo(scale, 1.03)}
          activeOpacity={0.85}
          style={{ margin: 5, transform: [{ scale }] } as any}
        >
          <LinearGradient
            colors={[
              colors.tasteSelectedGradientStart,
              colors.tasteSelectedGradientEnd,
            ]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.pillSelected}
          >
            <Text style={styles.pillSelectedText}>{c}</Text>
          </LinearGradient>
        </AnimatedTouchable>
      );
    }

    return (
      <AnimatedTouchable
        key={c}
        onPress={() => selectCafe(c)}
        onPressIn={() => pressIn(scale)}
        onPressOut={() => pressOutTo(scale, 1)}
        activeOpacity={0.85}
        style={[
          styles.pillUnselected,
          { margin: 5, transform: [{ scale }] } as any,
        ]}
      >
        <Text style={styles.pillUnselectedText}>{c}</Text>
      </AnimatedTouchable>
    );
  };"""
    content = content.replace(target_render_1, "")
    content = content.replace(target_render_2, "")

    # 8. Handle save
    target_final_1 = """  const finalCafeValue =
    selectedCafe ??
    (customCafeMode && customCafeText.trim() ? customCafeText.trim() : null);"""
    content = content.replace(target_final_1, "  const finalCafeValue = cafeText.trim();")

    target_final_2 = """    // merge custom values if left in input mode
    if (customCafeMode && customCafeText.trim()) {
      setSelectedCafe(customCafeText.trim());
    }"""
    content = content.replace(target_final_2, "")

    target_final_3 = """    // final read
    const finalCafe =
      selectedCafe ??
      (customCafeMode && customCafeText.trim() ? customCafeText.trim() : null);"""
    content = content.replace(target_final_3, "")

    target_final_4 = "if (!finalCafe || !finalType) {"
    content = content.replace(target_final_4, "if (!finalCafeValue || !finalType) {")

    target_final_5 = "cafe: finalCafe"
    content = content.replace(target_final_5, "cafe: finalCafeValue")

    target_final_6 = "setCustomCafeMode(false);"
    content = content.replace(target_final_6, "")

    # 9. UI replacement
    target_ui = """            <View style={{ marginBottom: customCafeMode ? 6 : 0 }}>
              {!customCafeMode && (
                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
                  Cafe
                </Text>
              )}
              {!customCafeMode && (
                <View style={styles.pillRow}>
                  {renderCustomCafePill()}
                  {CAFES.map((c) => renderCafePill(c))}
                </View>
              )}
              {customCafeMode && renderCafePill("Custom Cafe")}
            </View>"""
    new_ui = """            <View style={{ marginBottom: 6 }}>
              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
                Cafe
              </Text>
              <TextInput
                value={cafeText}
                onChangeText={setCafeText}
                placeholder="Enter cafe name (e.g. Local Roasters)"
                placeholderTextColor="rgba(78,52,46,0.45)"
                style={styles.fullInput}
                returnKeyType="done"
              />
            </View>"""
    content = content.replace(target_ui, new_ui)

    # 10. Fix array dependencies
    content = content.replace("selectedCafe, selectedType, selectedTaste", "selectedType, selectedTaste")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

process_file(sys.argv[1])
