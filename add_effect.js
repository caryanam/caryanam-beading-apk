const fs = require('fs');

function addAutoSelectEffect(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    const hook = `
  // Auto-select first room when activeTab changes
  useEffect(() => {
    if (filteredInspections.length > 0 && (!selectedId || !filteredInspections.some(i => i.inspectionId === selectedId))) {
      setSelectedId(filteredInspections[0].inspectionId);
    } else if (filteredInspections.length === 0) {
      setSelectedId(null);
    }
  }, [activeTab, filteredInspections]);

  // Initialize selected card details
`;

    if (!content.includes('Auto-select first room when activeTab changes')) {
        content = content.replace(/\s*\/\/\s*Initialize selected card details\s*/g, hook);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`${filePath} already has the effect.`);
    }
}

addAutoSelectEffect('src/screens/AdminLiveBiddingScreen.tsx');
