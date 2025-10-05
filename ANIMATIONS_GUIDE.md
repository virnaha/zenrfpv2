# UI Animations Guide

## Overview

The zen-rfp generator features smooth, polished animations on all interactive elements to provide immediate visual feedback and enhance the user experience.

## Animation Specifications

### Timing
- **Duration**: 200ms (fast and responsive)
- **Easing**: `ease-in-out` (smooth acceleration and deceleration)

### Scale Transforms
- **Hover**: `scale(1.02)` - subtle lift effect
- **Active/Click**: `scale(0.98)` - satisfying press-down effect
- **Checkboxes/Radios Hover**: `scale(1.1)` - more pronounced for small elements
- **Checkboxes/Radios Active**: `scale(0.95)` - clear feedback

## Animated Elements

### Buttons
All buttons automatically receive hover and active animations:

```tsx
// Automatically animated
<Button>Click me</Button>

// Also works with role="button"
<div role="button">Custom button</div>
```

**Behavior:**
- ✅ Hover: Scales to 102%
- ✅ Click: Scales to 98%
- ✅ Disabled: 60% opacity, no animations
- ✅ 200ms smooth transition

### Links
Links have animations by default, opt-out available:

```tsx
// Animated by default
<a href="/page">Link</a>

// Disable animation if needed
<a href="/page" className="no-animation">No animation</a>
```

### Interactive Cards
Add `.card-interactive` class for hover effects:

```tsx
<Card className="card-interactive">
  {/* Card content */}
</Card>
```

**Behavior:**
- ✅ Hover: Scales to 101% with shadow lift
- ✅ Click: Scales to 99%
- ✅ Smooth transitions

### Form Inputs

#### Text Inputs
```tsx
<Input type="text" placeholder="Enter text" />
<Textarea placeholder="Enter text" />
<Select>{/* options */}</Select>
```

**Behavior:**
- ✅ Focus: Scales to 101%
- ✅ 200ms smooth transition

#### Checkboxes & Radio Buttons
```tsx
<input type="checkbox" />
<input type="radio" />
```

**Behavior:**
- ✅ Hover: Scales to 110% (more noticeable for small elements)
- ✅ Click: Scales to 95%
- ✅ Smooth transitions

### Tabs
Tabs with `role="tab"` are automatically animated:

```tsx
<TabsList>
  <TabsTrigger>Tab 1</TabsTrigger>
  <TabsTrigger>Tab 2</TabsTrigger>
</TabsList>
```

**Behavior:**
- ✅ Hover: Scales to 102%
- ✅ Click: Scales to 98%

### Dropdown Menus
Menu items are automatically animated:

```tsx
<DropdownMenu>
  <DropdownMenuItem>Item 1</DropdownMenuItem>
  <DropdownMenuItem>Item 2</DropdownMenuItem>
</DropdownMenu>
```

**Behavior:**
- ✅ Hover: Scales to 101%
- ✅ Click: Scales to 99%

## Custom Animations

### Tailwind Utilities

Use these utility classes for custom animations:

```tsx
// Scale animations
<div className="hover:scale-102 active:scale-98 transition-all duration-200">
  Custom element
</div>

// Animation classes
<div className="animate-scale-in">Fade and scale in</div>
<div className="animate-press">Press animation</div>
```

### Available Animations

| Class | Effect | Duration | Use Case |
|-------|--------|----------|----------|
| `animate-scale-in` | Fade in with scale up | 200ms | Appearing elements |
| `animate-scale-out` | Fade out with scale down | 200ms | Disappearing elements |
| `animate-press` | Quick press effect | 200ms | Button feedback |
| `scale-98` | Scale to 98% | - | Active state |
| `scale-102` | Scale to 102% | - | Hover state |

## Best Practices

### DO ✅

1. **Use animations on all interactive elements**
   ```tsx
   <Button>Interactive</Button>
   ```

2. **Add card-interactive for clickable cards**
   ```tsx
   <Card className="card-interactive cursor-pointer">
     {/* content */}
   </Card>
   ```

3. **Disable animations for disabled states**
   ```tsx
   <Button disabled>Disabled (no animation)</Button>
   ```

4. **Use no-animation class when needed**
   ```tsx
   <a href="#" className="no-animation">Plain link</a>
   ```

### DON'T ❌

1. **Don't add animations to static text**
   ```tsx
   {/* Bad */}
   <p className="hover:scale-102">Just text</p>

   {/* Good */}
   <p>Just text</p>
   ```

2. **Don't over-animate**
   ```tsx
   {/* Bad - too many animations */}
   <Button className="animate-bounce animate-pulse animate-spin">
     Overanimated
   </Button>
   ```

3. **Don't use long durations**
   ```tsx
   {/* Bad - feels sluggish */}
   <Button className="duration-1000">Too slow</Button>

   {/* Good - feels responsive */}
   <Button className="duration-200">Perfect</Button>
   ```

## Performance Considerations

### Hardware Acceleration
All scale transforms are GPU-accelerated for smooth 60fps animations:

```css
/* Automatically optimized */
transform: scale(1.02);
```

### Will-Change Optimization
For elements that animate frequently, consider:

```tsx
<div className="will-change-transform">
  Frequently animated
</div>
```

### Reduced Motion
Respect user preferences for reduced motion:

```tsx
// Automatically handled by browser
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled */
}
```

## Customization

### Adjusting Animation Speed

Edit `src/index.css` to change global animation duration:

```css
@layer components {
  button {
    @apply transition-all duration-300; /* Change from 200ms */
  }
}
```

### Adjusting Scale Values

Edit `tailwind.config.ts` to change scale amounts:

```typescript
scale: {
  '97': '0.97',  // More aggressive active state
  '103': '1.03', // More pronounced hover
}
```

### Custom Animation Keyframes

Add new animations in `tailwind.config.ts`:

```typescript
keyframes: {
  'bounce-subtle': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-4px)' }
  }
},
animation: {
  'bounce-subtle': 'bounce-subtle 0.3s ease-in-out'
}
```

## Testing Animations

### Browser DevTools

1. Open DevTools (F12)
2. Go to Performance tab
3. Record interaction
4. Check for smooth 60fps animations

### Visual Testing Checklist

- [ ] Buttons scale on hover
- [ ] Buttons press down on click
- [ ] Links animate smoothly
- [ ] Cards lift on hover (if interactive)
- [ ] Form inputs scale on focus
- [ ] Checkboxes/radios scale on hover
- [ ] Tabs animate on interaction
- [ ] Menu items animate on hover
- [ ] Animations are 200ms duration
- [ ] No janky or choppy animations
- [ ] Disabled elements don't animate

## Accessibility

### Keyboard Navigation
All animations work with keyboard interaction:

- **Tab**: Focus states trigger animations
- **Enter/Space**: Active states trigger animations
- **Escape**: Dismisses animated elements

### Screen Readers
Animations are purely visual and don't interfere with screen reader functionality.

### Reduced Motion
Users with `prefers-reduced-motion` enabled will see instant state changes without animations.

## Examples

### Animated Button with Icon
```tsx
<Button className="gap-2">
  <Icon className="h-4 w-4" />
  <span>Click me</span>
</Button>
```

### Interactive Project Card
```tsx
<Card
  className="card-interactive cursor-pointer"
  onClick={() => navigate('/project/123')}
>
  <CardHeader>
    <CardTitle>Project Name</CardTitle>
  </CardHeader>
  <CardContent>
    Project details...
  </CardContent>
</Card>
```

### Custom Animated Element
```tsx
<div
  className="
    transition-all
    duration-200
    hover:scale-102
    active:scale-98
    cursor-pointer
  "
  onClick={handleClick}
>
  Custom interactive element
</div>
```

## Troubleshooting

### Animations Not Working

1. **Check if element is interactive**
   - Add `cursor-pointer` class
   - Ensure onClick or href is present

2. **Check for conflicting styles**
   - Remove `transform` styles that might conflict
   - Check for `!important` overrides

3. **Verify Tailwind is processing the CSS**
   - Run `npm run dev`
   - Check if CSS is being generated

### Animations Feel Choppy

1. **Check for heavy re-renders**
   - Use React DevTools Profiler
   - Optimize component rendering

2. **Check browser performance**
   - Open Performance tab in DevTools
   - Look for frame drops

3. **Reduce animation complexity**
   - Simplify transforms
   - Reduce number of animated properties

## Summary

All interactive elements in the zen-rfp generator feature smooth, responsive animations:

- ✅ **200ms duration** - Fast and snappy
- ✅ **Scale transforms** - 102% hover, 98% active
- ✅ **Smooth transitions** - ease-in-out easing
- ✅ **Hardware accelerated** - GPU-optimized
- ✅ **Accessible** - Respects reduced motion preferences
- ✅ **Polished** - Professional feel

The result is a UI that feels alive, responsive, and enjoyable to interact with!

---

**Last Updated**: 2025-01-05
**Version**: 2.0
