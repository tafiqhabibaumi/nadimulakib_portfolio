import json
import re

with open('index.template.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the props for Let's Talk
pattern = r'{"text":"Let\'s Talk"(.*?)}'
match = re.search(pattern, content)
if match:
    print("Found Let's Talk AST node!")
    old_props = match.group(0)
    # Parse to see if we can safely inject properties
    props_str = match.group(1)
    new_props = f'{{"text":"Let\'s Talk"{props_str},"fontFamily":"Roboto Flex","fontUrl":"https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap"}}'
    
    content = content.replace(old_props, new_props)
    
    with open('index.template.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated index.template.html")
else:
    print("Could not find Let's Talk AST node")
