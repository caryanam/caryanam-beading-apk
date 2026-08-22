const fs = require('fs');
let content = fs.readFileSync('src/screens/AdminFreelancersScreen.tsx', 'utf8');

const target = `    const q = searchQuery.toLowerCase();
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>`;

const replacement = `    const q = searchQuery.toLowerCase();
    return Freelancers.filter((ins) =>
      [ins.name, ins.email, ins.mobile].join(' ').toLowerCase().includes(q),
    );
  }, [Freelancers, searchQuery]);

  // Theme-aware card colors
  const cardBg       = isDark ? '#12141C' : '#FFFFFF';
  const cardHeaderBg = isDark ? '#1A1D28' : '#EEF0F6';

  // -- Render ---------------------------------------------

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>`;

if (content.includes("    const q = searchQuery.toLowerCase();\r\n    <SafeAreaView")) {
    content = content.replace("    const q = searchQuery.toLowerCase();\r\n    <SafeAreaView", replacement.replace("    const q = searchQuery.toLowerCase();\n    <SafeAreaView", ""));
    // wait I will just do it properly
}
