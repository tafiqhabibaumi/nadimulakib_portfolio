const fs = require('fs');
const content = fs.readFileSync('index.template.html', 'utf8');

const targetStr = "{\\\"text\\\":\\\"Let's Talk\\\"";
const replacementStr = "{\\\"text\\\":\\\"Let's Talk\\\",\\\"fontFamily\\\":\\\"Roboto Flex\\\",\\\"fontUrl\\\":\\\"https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap\\\"";

if (content.includes(targetStr)) {
    const newContent = content.replace(targetStr, replacementStr);
    fs.writeFileSync('index.template.html', newContent, 'utf8');
    console.log("Updated index.template.html!");
} else {
    console.log("Could not find the target string.");
}
