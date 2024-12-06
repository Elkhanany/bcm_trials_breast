

# Import the necessary libraries
import re
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import datetime


# Function to normalize text by removing punctuation and extra spaces
def normalize_text(text):
    """
    Normalize the text by removing punctuation, converting to lower case,
    and stripping leading/trailing spaces.
    This helps in creating a standardized format for text comparison.
    """
    text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with a single space
    text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
    text = text.lower().strip()  # Convert to lower case and trim whitespaces
    return text

# Load the CSV file from Google Spreadsheets
def load_csv_from_google_spreadsheets():
    scope = ['https://spreadsheets.google.com/feeds',
             'https://www.googleapis.com/auth/drive']
    creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
    client = gspread.authorize(creds)
    spreadsheet = client.open_by_key('1EmIA8ADU1BoIY-2G4liSWwAkZkqi8i5EF-VxJJSESdQ')  # Open the spreadsheet by its ID
    worksheet = spreadsheet.get_worksheet(0)  # Get the first worksheet
    data = worksheet.get_all_records()
    df = pd.DataFrame(data)
    return df

data = load_csv_from_google_spreadsheets()
#print(data.head())

# Filter out entries where the 'SPACE' column has the value 'CLOSED'
def filter_data(data):
    filtered_data = data[data['STATUS'] != 'CLOSED']
    return filtered_data

# Fill missing values in 'GROUP' and 'LINE' columns with placeholders
def fill_missing_values(data):
    data['GROUP'].fillna('No Group', inplace=True)
    data['LINE'].fillna('No Line', inplace=True)
    return data

# Apply formatting rules to 'ALIAS' based on 'STATUS'
def format_alias(row):
    if row['STATUS'] == 'OPEN':
        return f"**{row['ALIAS']}**"  # Bold for OPEN
    #elif row['STATUS'] in ['UPCOMING', 'ONHOLD']:
    #    return f"_{row['ALIAS']}_"  # Italic for UPCOMING or ON HOLD
    else:
        return row['ALIAS']

# Apply formatting rules to 'ALIAS' based on 'STATUS'        
def apply_formatting(data):
    data.loc[:, 'ALIAS'] = data.apply(format_alias, axis=1)
    return data

# Define a function to build the mindmap tree with normalized eligibility for duplicate check
def build_markmap(data):
    """Build the mindmap text with unique entries for each ALIAS within each LINE."""
    mindmap = [
        "---",
        "title: BCM Breast Cancer Trials",
        "markmap:",
        "  initialExpandLevel: 3",
        "  maxWidth: 200",
        "  colorFreezeLevel: 6",
        "---"
    ]
    
        # Iterate through SPACE
    for space, space_df in data.groupby('SPACE'):
        mindmap.append(f"- {space}")
        # Iterate through TYPE
        for type_, type_df in space_df.groupby('TYPE'):
            mindmap.append(f"  - {type_}")
            # Iterate through GROUP
            for group, group_df in type_df.groupby('GROUP'):
                group = group if group else 'NO GROUP'
                mindmap.append(f"    - {group}")
                # Iterate through LINE
                for line, line_df in group_df.groupby('LINE'):
                    line = line if line else 'NO LINE'
                    mindmap.append(f"      - {line}")
                    # Create a unique set of (ALIAS, Normalized ELIGIBILITY) to avoid duplicates
                    unique_entries = set()
                    entries = []
                    for _, row in line_df.iterrows():
                        eligibility_normalized = normalize_text(row['ELIGIBILITY'])
                        entry = (row['ALIAS'], eligibility_normalized)
                        if entry not in unique_entries:
                            unique_entries.add(entry)
                            entries.append((row['ALIAS'], row['ELIGIBILITY']))  # Keep original ELIGIBILITY
                    # Iterate through unique ALIAS and ELIGIBILITY as separate entries
                    for alias, eligibility in entries:
                        eligibility_formatted = eligibility.replace("[x]", "\n   - [x]")
                        mindmap.append(f"        - {alias}")
                        for line in eligibility_formatted.split("\n"):
                            mindmap.append(f"          {line}")

    return "\n".join(mindmap)

# Generate the final markmap content with normalized eligibility check
def generate_markmap_content(data):
    filtered_data = filter_data(data)
    filled_data = fill_missing_values(filtered_data)
    formatted_data = apply_formatting(filled_data)
    markmap_content = build_markmap(formatted_data)
    return markmap_content

# Save the final mindmap content to a Markdown (.md) file
def save_markmap_to_file(markmap_content):
    with open('landscape.md', 'w', encoding='utf-8') as file:
        file.write(markmap_content)
     
# Generate the markmap content
markmap_content = generate_markmap_content(data)

# Save the markmap content to a file
save_markmap_to_file(markmap_content)