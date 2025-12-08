# 🎨 Component Library Reference

## Quick Reference Guide for BrainFuel UI Components

---

## 📦 Installation & Setup

All components are ready to use. They're located in `/components/ui/` and can be imported directly:

```jsx
import AnimatedButton from '@/components/ui/AnimatedButton';
import AnimatedCard from '@/components/ui/AnimatedCard';
// ... etc
```

---

## 🎯 Component Showcase

### 1. AnimatedButton

**Purpose**: Multi-variant button with animations and loading states

**Props**:
- `variant`: `"primary"` | `"secondary"` | `"ghost"` | `"danger"` | `"success"` (default: "primary")
- `size`: `"sm"` | `"md"` | `"lg"` (default: "md")
- `isLoading`: boolean (default: false)
- `icon`: ReactNode
- `children`: ReactNode
- `className`: string
- ...all standard button props

**Examples**:

```jsx
// Primary button
<AnimatedButton variant="primary" size="lg">
  Click Me
</AnimatedButton>

// Button with icon and loading
<AnimatedButton 
  variant="success" 
  isLoading={saving}
  icon={<Save />}
  onClick={handleSave}
>
  Save Changes
</AnimatedButton>

// Danger button
<AnimatedButton variant="danger" size="sm">
  Delete
</AnimatedButton>
```

---

### 2. AnimatedCard

**Purpose**: Versatile container with entrance animations

**Props**:
- `variant`: `"default"` | `"hover"` | `"glow"` (default: "hover")
- `delay`: number (animation delay in seconds)
- `enableHoverLift`: boolean (default: true)
- `onClick`: function
- `children`: ReactNode
- `className`: string

**Examples**:

```jsx
// Basic card with hover effect
<AnimatedCard variant="hover">
  <div className="p-6">
    <h3>Card Title</h3>
    <p>Card content</p>
  </div>
</AnimatedCard>

// Glowing card with click handler
<AnimatedCard 
  variant="glow" 
  delay={0.2}
  onClick={() => console.log('clicked')}
>
  <div className="p-6">Clickable content</div>
</AnimatedCard>

// Staggered cards
{items.map((item, i) => (
  <AnimatedCard key={i} delay={i * 0.1}>
    {/* Content */}
  </AnimatedCard>
))}
```

---

### 3. AnimatedInput

**Purpose**: Beautiful input field with floating label and focus effects

**Props**:
- `label`: string
- `type`: string (default: "text")
- `placeholder`: string
- `variant`: `"default"` | `"glow"` (default: "glow")
- `icon`: ReactNode
- `error`: string (error message)
- `className`: string
- ...all standard input props

**Examples**:

```jsx
// Email input with icon
<AnimatedInput
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  icon={<Mail className="w-5 h-5" />}
  placeholder="your@email.com"
/>

// Password input with error
<AnimatedInput
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  icon={<Lock className="w-5 h-5" />}
  error={passwordError}
/>

// Simple text input
<AnimatedInput
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

---

### 4. AnimatedModal

**Purpose**: Full-featured modal with backdrop blur

**Props**:
- `isOpen`: boolean (required)
- `onClose`: function (required)
- `title`: string
- `size`: `"sm"` | `"md"` | `"lg"` | `"xl"` (default: "md")
- `children`: ReactNode
- `className`: string

**Examples**:

```jsx
const [isOpen, setIsOpen] = useState(false);

// Basic modal
<AnimatedModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
>
  <p>Modal content goes here</p>
</AnimatedModal>

// Large modal with form
<AnimatedModal
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  title="Create New Item"
  size="lg"
>
  <form onSubmit={handleSubmit}>
    {/* Form fields */}
  </form>
</AnimatedModal>
```

---

### 5. AnimatedNavbar

**Purpose**: Modern navbar with scroll effects and mobile menu

**Props**:
- `user`: object (user data)
- `onLogout`: function
- `menuItems`: array of `{label, href, icon}`

**Example**:

```jsx
import { Home, Settings, User } from 'lucide-react';

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: <Home /> },
  { label: "Profile", href: "/profile", icon: <User /> },
  { label: "Settings", href: "/settings", icon: <Settings /> },
];

<AnimatedNavbar
  user={currentUser}
  onLogout={handleLogout}
  menuItems={menuItems}
/>
```

---

### 6. AnimatedFooter

**Purpose**: Professional footer with social links

**Props**:
- `links`: array of link sections
- `socialLinks`: array of social media links

**Example**:

```jsx
const footerLinks = [
  {
    title: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
    ]
  },
  {
    title: "Resources",
    items: [
      { label: "Blog", href: "/blog" },
      { label: "Docs", href: "/docs" },
    ]
  }
];

const socialLinks = [
  { icon: <Github />, href: "https://github.com/...", label: "GitHub" },
  { icon: <Twitter />, href: "https://twitter.com/...", label: "Twitter" },
];

<AnimatedFooter links={footerLinks} socialLinks={socialLinks} />
```

---

### 7. CourseCard

**Purpose**: Display course information with hover effects

**Props**:
- `course`: object (course data with imageUrl, courseName, etc.)
- `delay`: number (animation delay)
- `onClick`: function
- `className`: string

**Example**:

```jsx
<CourseCard
  course={{
    id: "1",
    courseName: "JavaScript Mastery",
    imageUrl: "https://...",
    visibility: "show",
    sectionControl: [5, 5, 3],
    fields: ["lesson1", "lesson2", ...]
  }}
  delay={0.1}
  onClick={() => router.push(`/course/${course.id}`)}
/>

// Grid of courses
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {courses.map((course, index) => (
    <CourseCard
      key={course.id}
      course={course}
      delay={index * 0.05}
      onClick={() => viewCourse(course.id)}
    />
  ))}
</div>
```

---

### 8. HeroSection

**Purpose**: Stunning hero section with gradient text

**Props**:
- `title`: string
- `subtitle`: string
- `ctaButtons`: array of `{label, href, variant}`
- `className`: string

**Example**:

```jsx
<HeroSection
  title="Welcome to BrainFuel"
  subtitle="Transform your learning experience with our platform"
  ctaButtons={[
    { label: "Get Started", href: "/signup", variant: "primary" },
    { label: "Learn More", href: "#features", variant: "secondary" }
  ]}
/>
```

---

### 9. LoadingScreen

**Purpose**: Full-screen loading animation with progress

**Props**:
- `isLoading`: boolean (required)
- `message`: string (default: "Loading...")

**Example**:

```jsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  // Simulate loading
  setTimeout(() => setLoading(false), 2000);
}, []);

<LoadingScreen 
  isLoading={loading} 
  message="Preparing your dashboard..." 
/>
```

---

### 10. ParallaxSection

**Purpose**: Create parallax scrolling effects

**Props**:
- `speed`: number (0.1 to 1.0, default: 0.5)
- `children`: ReactNode
- `className`: string

**Example**:

```jsx
<ParallaxSection speed={0.3}>
  <div className="text-center py-20">
    <h2>This content moves slower than scroll</h2>
  </div>
</ParallaxSection>

// Multiple layers
<>
  <ParallaxSection speed={0.2}>
    <img src="/bg-layer-1.png" />
  </ParallaxSection>
  <ParallaxSection speed={0.5}>
    <img src="/bg-layer-2.png" />
  </ParallaxSection>
  <div className="relative z-10">
    {/* Main content */}
  </div>
</>
```

---

## 🎨 Design System Utilities

### Using Pre-built Variants

```jsx
import { componentVariants } from '@/lib/design-system';

// Apply button styles
<button className={componentVariants.button.primary}>
  Click Me
</button>

// Apply card styles
<div className={componentVariants.card.hover}>
  Card content
</div>

// Apply input styles
<input className={componentVariants.input.glow} />
```

### Custom Combinations

```jsx
// Combine multiple utilities
<div className={`
  ${componentVariants.card.glow}
  transform hover:scale-105
  transition-all duration-300
`}>
  Custom styled card
</div>
```

---

## 🎭 Animation Examples

### Framer Motion Basics

```jsx
import { motion } from 'framer-motion';

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>

// Slide in from left
<motion.div
  initial={{ x: -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>

// Scale animation
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Interactive element
</motion.div>
```

### CSS Animation Classes

```jsx
// Available in globals.css
<div className="animate-gradient">Animated gradient</div>
<div className="animate-float">Floating element</div>
<div className="animate-pulse-glow">Pulsing glow</div>
<div className="glass">Glass morphism</div>
<div className="gradient-text">Gradient text</div>
```

---

## 🎯 Common Patterns

### Dashboard Stats Cards

```jsx
const stats = [
  { icon: <Users />, label: "Total Users", value: "1,234" },
  { icon: <BookOpen />, label: "Courses", value: "56" },
  { icon: <TrendingUp />, label: "Growth", value: "+12%" },
];

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {stats.map((stat, i) => (
    <AnimatedCard key={i} delay={i * 0.1} variant="hover">
      <div className="p-6 flex items-center gap-4">
        <div className="p-3 bg-purple-600/20 rounded-xl">
          {stat.icon}
        </div>
        <div>
          <p className="text-gray-400 text-sm">{stat.label}</p>
          <p className="text-3xl font-bold">{stat.value}</p>
        </div>
      </div>
    </AnimatedCard>
  ))}
</div>
```

### Form with Validation

```jsx
const [formData, setFormData] = useState({ email: '', password: '' });
const [errors, setErrors] = useState({});

<form onSubmit={handleSubmit} className="space-y-6">
  <AnimatedInput
    label="Email"
    type="email"
    value={formData.email}
    onChange={(e) => setFormData({...formData, email: e.target.value})}
    icon={<Mail />}
    error={errors.email}
  />
  
  <AnimatedInput
    label="Password"
    type="password"
    value={formData.password}
    onChange={(e) => setFormData({...formData, password: e.target.value})}
    icon={<Lock />}
    error={errors.password}
  />
  
  <AnimatedButton 
    type="submit" 
    variant="primary" 
    size="lg"
    isLoading={submitting}
  >
    Submit
  </AnimatedButton>
</form>
```

### Confirmation Modal

```jsx
const [showDelete, setShowDelete] = useState(false);

<>
  <AnimatedButton 
    variant="danger" 
    onClick={() => setShowDelete(true)}
  >
    Delete Item
  </AnimatedButton>

  <AnimatedModal
    isOpen={showDelete}
    onClose={() => setShowDelete(false)}
    title="Confirm Deletion"
  >
    <p className="mb-6">Are you sure you want to delete this item?</p>
    <div className="flex gap-4">
      <AnimatedButton
        variant="danger"
        onClick={handleDelete}
      >
        Yes, Delete
      </AnimatedButton>
      <AnimatedButton
        variant="secondary"
        onClick={() => setShowDelete(false)}
      >
        Cancel
      </AnimatedButton>
    </div>
  </AnimatedModal>
</>
```

---

## 💡 Pro Tips

1. **Always use delay for stagger effects**: `delay={index * 0.1}`
2. **Combine variants for unique styles**: Mix card variants with custom classes
3. **Use icons from lucide-react**: Consistent, modern icon library
4. **Test animations on mobile**: Some effects may need adjustment
5. **Use loading states**: Better UX during async operations
6. **Respect reduced motion**: All components support prefers-reduced-motion
7. **Keep animations subtle**: Don't overdo it - less is more
8. **Use semantic colors**: Match button variants to actions (danger for delete, success for save)

---

## 🔧 Customization

All components accept `className` prop for additional styling:

```jsx
<AnimatedButton 
  className="w-full mt-4"  // Add custom classes
  variant="primary"
>
  Button
</AnimatedButton>
```

Components are designed to be extended:

```jsx
// Create your own variant
<AnimatedCard 
  className="border-2 border-gold-500 shadow-gold-lg"
  variant="default"
>
  Premium card
</AnimatedCard>
```

---

This reference covers all the components you need to build beautiful, animated interfaces. Mix and match components to create your perfect UI! 🎨✨
