import csv
import json
import os

def convert_csv_to_js(csv_file, js_file):
    ipa_dict = {}
    print(f"Reading {csv_file}...")
    
    with open(csv_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            word = row['words'].strip()
            ipa = row['ipa'].strip()
            if word and ipa:
                # Store word in lowercase for easier lookup, 
                # but we'll handle case-sensitivity in the app if needed
                ipa_dict[word.lower()] = ipa
                
    print(f"Loaded {len(ipa_dict)} words.")
    
    # Save as as JS file that exports the object
    with open(js_file, mode='w', encoding='utf-8') as f:
        f.write("const ipaDict = ")
        json.dump(ipa_dict, f, ensure_ascii=False, indent=2)
        f.write(";\n\nexport default ipaDict;")
        
    print(f"Saved to {js_file}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_csv = os.path.join(current_dir, "de_word_ipa.csv")
    output_js = os.path.join(current_dir, "ipa_dict.js")
    
    if os.path.exists(input_csv):
        convert_csv_to_js(input_csv, output_js)
    else:
        print(f"Error: {input_csv} not found.")
