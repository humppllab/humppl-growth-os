# Zoho-Style Mass Delete UI Implementation

## Overview
Updated the Mass Delete feature to match Zoho CRM's criteria builder interface, providing a cleaner, more intuitive user experience for defining deletion criteria.

## ✅ Features Implemented

### 1. **Zoho-Style Header**
- Clean white header with border
- Back arrow button to return to module
- "Mass Delete" title
- Help button on the right side

### 2. **Criteria Section** (Collapsible)
- White card with rounded corners
- "Criteria" header with "Hide/Show" toggle button
- Clean border and shadow
- Full-width layout matching Zoho's design

### 3. **Criteria Builder Interface**
Each criterion row includes:
- **Numbered Circle** (1, 2, 3...) - Gray circle showing criterion order
- **Field Dropdown** - Select which field to filter (First Name, Last Name, Email, etc.)
- **Operator Dropdown** - Choose comparison operator (Contains, Equals, Starts with, etc.)
- **Value Input** - Text field for search value (disabled for "is empty" operator)
- **Action Buttons**:
  - **Green Plus Button** (⊕) - Appears on last row to add new criterion
  - **Red X Button** (⊗) - Appears when multiple criteria exist to remove criterion

### 4. **Search Button**
- Blue primary button aligned to the right
- Shows "Searching..." state with spinner when active
- Located at bottom of criteria section

### 5. **Results Table**
Only appears after search is performed:
- White card with header showing result count
- Checkbox column for selecting records
- "Select All" checkbox in header
- Displays: Name, Email, Organization, Role
- Selected rows highlighted in light red
- "Delete X Selected" button appears when items are selected

### 6. **Confirmation Modal**
- Red-themed header with warning icon
- Clear message showing count of records to delete
- Cancel and Delete buttons
- Loading state during deletion
- Cannot be dismissed while deleting

## Visual Design

### Color Scheme
- **Background**: Gray-50 (light gray)
- **Cards**: White with border-gray-200
- **Primary Action**: Blue-600
- **Destructive Action**: Red-600
- **Success Indicator**: Green-500 (+ button)
- **Selected Rows**: Red-50/30 (light red tint)

### Layout
```
┌─────────────────────────────────────────────────┐
│  ← Mass Delete                           📘 Help │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Criteria                    Hide ▼       │  │
│  ├──────────────────────────────────────────┤  │
│  │  ① [Field ▼] [Operator ▼] [Value... ] ⊕ │  │
│  │  ② [Field ▼] [Operator ▼] [Value... ] ⊗ │  │
│  │                                          │  │
│  │                        [Search Button]   │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Search Results (10)    [Delete X Selected]│  │
│  ├──────────────────────────────────────────┤  │
│  │ ☑ Name     Email      Organization  Role  │  │
│  │ □ John Doe john@...   Acme Inc     CEO    │  │
│  │ ☑ Jane Doe jane@...   Tech Co      CTO    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## User Flow

### Step 1: Define Criteria
1. User clicks "Mass Delete" from Three Dot Menu
2. Page loads with one default criterion row
3. User selects Field, Operator, and enters Value
4. User can add more criteria by clicking green ⊕ button
5. Each criterion is numbered (1, 2, 3...)
6. Multiple criteria work as AND conditions

### Step 2: Search for Records
1. User clicks "Search" button
2. System filters records based on all criteria
3. Results appear in table below
4. No results shown until search is performed

### Step 3: Select Records
1. User sees matching records in results table
2. Can select individual records via checkboxes
3. Can select all records via header checkbox
4. Selected count shown on "Delete X Selected" button
5. Selected rows highlighted in light red

### Step 4: Confirm Deletion
1. User clicks "Delete X Selected" button
2. Confirmation modal appears with warning
3. User confirms by clicking "Delete" in modal
4. System deletes records and shows success message
5. Deleted records removed from table

### Step 5: Completion
1. Success message shown in green banner
2. Remaining results still visible
3. User can perform another search or return to module

## Technical Implementation

### File Updated
- `src/app/contacts/mass-delete/page.tsx`

### Key Changes
1. **Layout**: Changed from 3-column grid to full-width stacked layout
2. **Criteria UI**: Horizontal layout with numbered circles and inline controls
3. **Hide/Show**: Added collapsible criteria section
4. **Buttons**: Green circular + button, red circular × button
5. **Spacing**: Matched Zoho's generous whitespace and padding
6. **Typography**: Updated font sizes and weights to match Zoho
7. **Colors**: Updated border colors, backgrounds, and hover states

### State Management
```typescript
const [showCriteria, setShowCriteria] = useState(true); // Toggle criteria visibility
const [criteria, setCriteria] = useState<Criterion[]>([...]); // Criteria array
const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]); // Search results
const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]); // Selected items
const [showConfirm, setShowConfirm] = useState(false); // Confirmation modal
```

### Functions
- `handleSearch()` - Filters contacts based on criteria
- `addCriterion()` - Adds new criterion row
- `removeCriterion(id)` - Removes criterion row
- `updateCriterion(id, key, value)` - Updates criterion field
- `toggleSelectContact(id)` - Toggles individual selection
- `toggleSelectAll()` - Selects/deselects all results
- `handleDeleteSelected()` - Executes deletion

## Fields Available for Filtering

1. **First Name** (`first_name`)
2. **Last Name** (`last_name`)
3. **Email** (`email`)
4. **Designation/Role** (`job_title`)
5. **Organization** (`organizations.name`)

## Operators Available

1. **Contains** - Field contains the value
2. **Equals** - Field exactly matches the value
3. **Starts with** - Field begins with the value
4. **Ends with** - Field ends with the value
5. **Is empty** - Field is empty or null (no value input needed)

## Responsive Design

- **Desktop**: Full horizontal layout with all elements side-by-side
- **Tablet**: Criteria may wrap to multiple lines
- **Mobile**: Stacked vertical layout for criteria fields
- All dropdowns and inputs are touch-friendly (min-height maintained)

## Accessibility

- ✅ Proper label associations
- ✅ Keyboard navigation support
- ✅ Focus states on all interactive elements
- ✅ ARIA labels on icon buttons
- ✅ Semantic HTML structure
- ✅ Color contrast compliance
- ✅ Screen reader friendly

## Next Steps

To apply this Zoho-style UI to other modules:

1. **Copy the pattern** from `contacts/mass-delete/page.tsx`
2. **Update for each module**:
   - Opportunities: `/opportunities/mass-delete/page.tsx`
   - Organizations: `/organizations/mass-delete/page.tsx`
   - Approvals: `/approvals/mass-delete/page.tsx`
   - Documents: `/documents/mass-delete/page.tsx`
   - Meetings: `/meetings/mass-delete/page.tsx`
   - Follow-ups: `/follow-ups/mass-delete/page.tsx`
   - Proposals: `/proposals/mass-delete/page.tsx`

3. **Adjust fields** to match each module's data structure
4. **Update API calls** to use correct getter/deletion functions

## Screenshots Reference

The implementation matches the Zoho CRM screenshot provided:
- Numbered criteria circles (1, 2, 3...)
- "None" dropdown placeholders
- Empty value input field
- Green circular + button on last row
- "Hide ▼" toggle in top right
- Clean white card design
- "Search" button aligned right

---

**Status**: ✅ Complete for Contacts module  
**Build Status**: ✅ No TypeScript errors  
**Ready for**: Rollout to other modules

