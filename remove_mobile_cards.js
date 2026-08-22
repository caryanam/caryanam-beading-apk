const fs = require('fs');
let content = fs.readFileSync('src/screens/AdminAnalyticsScreen.tsx', 'utf8');

const targetStr = `{/* Stats Grid */}`;
const endStr = `{/* Export Buttons */}`;

if (content.includes(targetStr)) {
  const startIndex = content.indexOf(targetStr);
  const endIndex = content.indexOf(endStr);
  if (endIndex > startIndex) {
    const chunkToRemove = content.substring(startIndex, endIndex);
    content = content.replace(chunkToRemove, '');
    fs.writeFileSync('src/screens/AdminAnalyticsScreen.tsx', content);
    console.log('Removed StatCard grid from mobile!');
  } else {
    console.log('endStr not found after targetStr');
  }
} else {
  console.log('targetStr not found');
}
