# Table Components Demo Guide

This guide explains how to use and test the new reusable table components.

## 🚀 Quick Start

1. **Start the development server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to the demos**:
   - **Table Components Demo**: `/table-demo` - Interactive demo with different table configurations
   - **Providers Demo**: `/providers-demo` - Full providers page using the new components
   - **Doctor List Demo**: `/doctor-list-demo` - Simple table example
   - **Original Providers**: `/providers` - Original implementation for comparison

## 📋 Demo Pages

### 1. Table Components Demo (`/table-demo`)
**Purpose**: Interactive showcase of all table component features

**Features**:
- **Basic Tab**: Simple table with sorting and status coloring
- **Advanced Tab**: Full-featured table with search, pagination, actions
- **Custom Tab**: Custom styling with hospital data
- **Comparison Tab**: Side-by-side doctors vs hospitals

**What to test**:
- ✅ Sorting by clicking column headers
- ✅ Search functionality
- ✅ Pagination controls
- ✅ Row click events
- ✅ Action buttons (View, Edit, Delete)
- ✅ Status-based text coloring
- ✅ Loading states
- ✅ Empty states

### 2. Providers Demo (`/providers-demo`)
**Purpose**: Complete providers page replacement using new components

**Features**:
- Statistics dashboard
- Tab navigation (Doctors/Hospitals)
- Search and filter controls
- Full table functionality
- Error handling

**What to test**:
- ✅ Tab switching between Doctors and Hospitals
- ✅ Statistics updates
- ✅ Search across all fields
- ✅ All table interactions
- ✅ Error states and loading

### 3. Doctor List Demo (`/doctor-list-demo`)
**Purpose**: Simple standalone table example

**Features**:
- Basic table with mock data
- Status-based coloring
- Sorting functionality

**What to test**:
- ✅ Status color changes (Active = green, others = red/amber)
- ✅ Sorting by different columns
- ✅ Responsive design

### 4. Original Providers (`/providers`)
**Purpose**: Original implementation for comparison

**What to compare**:
- ✅ Visual appearance (should be identical)
- ✅ Functionality (should be identical)
- ✅ Performance differences
- ✅ Code maintainability

## 🎯 Key Features to Test

### Status-Based Coloring
- **Active status**: Only status text is green, rest is white
- **Inactive status**: Entire row text is red
- **Suspended status**: Entire row text is amber
- **Other statuses**: Row text matches status color (blue, purple, etc.)

### Sorting
- Click any sortable column header
- Visual indicators show sort direction
- Data reorders correctly
- Sort state persists during search/pagination

### Search
- Type in search box to filter results
- Search works across all visible text fields
- Search is case-insensitive
- Pagination resets when searching

### Pagination
- Navigate between pages
- Change items per page
- Page numbers update correctly
- "Showing X to Y of Z entries" displays correctly

### Actions
- Hover over action buttons to see tooltips
- Click View/Edit/Delete buttons
- Row click events work
- Double-click rows for quick actions

## 🔧 Component Usage Examples

### Basic Usage
```tsx
import { DataTable, TableColumn, getStatusTextColor } from '@/components/tables';

const columns: TableColumn<Doctor>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (value, doctor) => (
      <div className={getStatusTextColor(doctor.status)}>
        {String(value)}
      </div>
    )
  }
];

<DataTable
  data={doctors}
  columns={columns}
  statusField="status"
  onRowClick={handleClick}
  searchable={true}
  pagination={true}
/>
```

### Advanced Usage
```tsx
<DataTable
  data={doctors}
  columns={columns}
  statusField="status"
  onRowClick={handleClick}
  sortField={sortField}
  sortDirection={sortDirection}
  onSort={handleSort}
  searchable={true}
  searchPlaceholder="Search doctors..."
  pagination={true}
  itemsPerPage={10}
  showItemsPerPage={true}
  loading={loading}
  emptyMessage="No doctors found"
  className="custom-table-class"
/>
```

## 🐛 Testing Checklist

### Visual Tests
- [ ] Tables look identical to original ProvidersPage
- [ ] Card-based rows have correct spacing and colors
- [ ] Headers are properly aligned and styled
- [ ] Status colors work correctly
- [ ] Hover effects are smooth
- [ ] Loading states display properly
- [ ] Empty states show correct message

### Functionality Tests
- [ ] Sorting works in both directions
- [ ] Search filters data correctly
- [ ] Pagination navigates properly
- [ ] Row clicks trigger events
- [ ] Action buttons work
- [ ] Error states display correctly
- [ ] Loading states show during data fetch

### Performance Tests
- [ ] Large datasets render smoothly
- [ ] Sorting is responsive
- [ ] Search is fast
- [ ] Pagination loads quickly
- [ ] No memory leaks during navigation

### Responsive Tests
- [ ] Tables work on mobile devices
- [ ] Columns stack properly on small screens
- [ ] Touch interactions work
- [ ] Horizontal scrolling works when needed

## 🚨 Known Issues

None currently identified. If you find any issues, please report them with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/device information

## 📚 Next Steps

1. **Replace existing tables**: Use these components in other parts of the application
2. **Customize styling**: Modify colors, spacing, or layout as needed
3. **Add features**: Extend components with new functionality
4. **Performance optimization**: Add virtualization for very large datasets
5. **Accessibility**: Add ARIA labels and keyboard navigation

## 💡 Tips

- Always provide a `statusField` prop for status-based coloring
- Use `render` functions for custom cell content
- Set appropriate `width` classes for column sizing
- Use `align` prop for text alignment
- Test with different data sizes and status values
- Use the demo pages to verify functionality before implementing
