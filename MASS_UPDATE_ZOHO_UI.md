# Mass Update - Zoho-Style Horizontal UI

## Overview
Updated the Mass Update page to match the Zoho CRM horizontal layout, consistent with the Mass Delete page design.

## ✅ Changes Implemented

### 1. **Layout Transformation**
**Before:** Vertical sidebar layout with 3-column grid  
**After:** Full-width horizontal sections with collapsible panels

### 2. **Header Section**
- Clean white header with border
- Back arrow button to return to Contacts
- "Mass Update" title
- Help button on the right

### 3. **Search Criteria Section** (Zoho Style)
- Collapsible white card with "Hide/Show" toggle
- **Horizontal criteria rows** with:
  - Numbered circles (①②③)
  - Field dropdown | Operator dropdown | Value input (all in one line)
  - Green ⊕ button on last row to add criteria
  - Red ⊗ button to remove criteria
- Search button aligned to the right at bottom

### 4. **Update Fields Section** (New)
- Separate collapsible card with "Hide/Show" toggle
- **Horizontal layout** with:
  - Blue edit icon circle
  - "Field to Update" dropdown
  - "New Value" input field
- Info message showing what will be updated
- Only appears after search returns results

### 5. **Results Table**
- Only appears after successful search
- Shows matching contacts with checkboxes
- Selected rows highlighted in blue
- "Update X Selected" button when items are checked
- Disabled until a value is entered

## Visual Layout

```
┌─────────────────────────────────────────────────┐
│  ← Mass Update                          📘 Help │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Search Criteria              Hide ▼      │  │
│  ├──────────────────────────────────────────┤  │
│  │  ① [Field ▼] [Operator ▼] [Value... ] ⊕ │  │
│  │  ② [Field ▼] [Operator ▼] [Value... ] ⊗ │  │
│  │                        [Search Button]   │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Update Fields                Hide ▼      │  │
│  ├──────────────────────────────────────────┤  │
│  │  🖊️ [Field to Update ▼] [New Value...]  │  │
│  │                                          │  │
│  │  ℹ️ Will update First Name to "John"    │  │
│  │     for 5 selected contact(s)           │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Search Results (10)   [Update X Selected]│  │
│  ├──────────────────────────────────────────┤  │
│  │ ☑ Name     Email      Organization  Role │  │
│  │ □ John Doe john@...   Acme Inc     CEO   │  │
│  │ ☑ Jane Doe jane@...   Tech Co      CTO   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## User Flow

### Step 1: Define Search Criteria
1. User navigates to Mass Update from Three Dot Menu
2. Page loads with Search Criteria section
3. Define criteria using horizontal layout (Field | Operator | Value)
4. Click green ⊕ to add more criteria
5. Click Search button

### Step 2: Configure Update
1. Results appear in table below
2. "Update Fields" section becomes visible
3. Select which field to update (First Name, Last Name, etc.)
4. Enter new value
5. Info message shows what will change

### Step 3: Select Records
1. Check individual contacts or use "Select All"
2. Selected rows highlighted in blue
3. "Update X Selected" button shows count

### Step 4: Execute Update
1. Click "Update X Selected" button
2. System updates all selected records
3. Success message appears
4. Table refreshes with updated data
5. Selection cleared automatically

## Key Features

### Collapsible Sections
- **Search Criteria**: Can hide/show to save space
- **Update Fields**: Can hide/show, only visible after search

### Horizontal Layout
- All controls in single rows for quick scanning
- Matches Zoho CRM's efficient use of space
- Labels above fields for clarity

### Visual Consistency
- Same numbered circles as Mass Delete
- Same green/red action buttons
- Same gray-50 background
- Same border colors and shadows

### Smart Validation
- Update button disabled until value is entered
- Shows helpful preview of what will change
- Prevents empty updates

### Responsive Design
- Horizontal on desktop
- May wrap on smaller screens
- All touch-friendly controls

## Technical Details

### File Updated
- `src/app/contacts/mass-update/page.tsx`

### State Management
```typescript
const [showCriteria, setShowCriteria] = useState(true); // Toggle criteria
const [showUpdateSection, setShowUpdateSection] = useState(true); // Toggle update panel
const [updateField, setUpdateField] = useState("first_name"); // Field to update
const [updateValue, setUpdateValue] = useState(""); // New value
const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]); // Selections
```

### Components Removed
- Removed `Card`, `CardContent`, `CardHeader`, `CardTitle` components
- Using native div elements with Tailwind classes
- Simplified markup for better control

### Layout Changes
- Changed from `grid grid-cols-3` to stacked sections
- Changed from sidebar to full-width cards
- Removed nested card layouts

## Differences from Mass Delete

1. **Additional Section**: Has "Update Fields" section between criteria and results
2. **Button Color**: Update button is blue (vs red delete button)
3. **Info Message**: Shows preview of update action
4. **Selected Highlight**: Blue instead of red
5. **Icon**: Edit icon instead of trash icon

## Fields Available for Update

1. **First Name** (`first_name`)
2. **Last Name** (`last_name`)
3. **Email** (`email`)
4. **Designation/Role** (`job_title`)

Note: Organization is intentionally excluded as it requires different handling (foreign key relationship)

## Build Status
✅ **No TypeScript errors**  
✅ **Compiles successfully**  
✅ **Ready to use**

---

**Status**: ✅ Complete for Contacts module  
**Next**: Apply to other 7 modules (Opportunities, Organizations, etc.)

