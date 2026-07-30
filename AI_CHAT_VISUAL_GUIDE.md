# AI Chat Feature - Visual Guide 🎨

## Overview
This guide shows the visual design and user flow of the AI Chat Assistant feature.

---

## Screen Layout

```
╔══════════════════════════════════════════════════════════╗
║  AI Stock Analyst                              [←]       ║  ← App Bar
╠══════════════════════════════════════════════════════════╣
║  🔍  Stock ticker (e.g. AAPL, TSLA, GOOGL)              ║  ← Ticker Input (Sticky)
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ┌────────────────────────────────────────────────────┐ ║
║  │ ℹ️  DISCLAIMER: All market signals, technical data, │ ║  ← System Message (Blue Info Box)
║  │ and AI-generated analysis provided by StockSense   │ ║     Shows ONCE at top
║  │ are for educational and informational purposes...  │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                          ║
║  ┌────────────────────────────────────────┐             ║
║  │ 👋 Hi! I'm your AI stock analyst      │             ║  ← Welcome Message (AI)
║  │ powered by Gemini.                    │             ║     Left-aligned, white bubble
║  │                                        │             ║
║  │ Enter a ticker symbol above and ask   │             ║
║  │ me anything — technical analysis,     │             ║
║  │ fundamentals, earnings reports...     │             ║
║  └────────────────────────────────────────┘             ║
║     2m ago                                               ║
║                                                          ║
║                      ┌─────────────────────────────────┐ ║
║                      │ What's a good P/E ratio for    │ ║  ← User Message
║                      │ tech stocks?                   │ ║     Right-aligned, blue bubble
║                      └─────────────────────────────────┘ ║
║                                                  Just now ║
║                                                          ║
║  ┌────────────────────────────────────────┐             ║
║  │ The P/E ratio of 28.5 for AAPL is     │             ║  ← AI Response
║  │ moderate for a tech stock. Tech       │             ║     Left-aligned, white bubble
║  │ sector P/E ratios typically range...  │             ║
║  │                                        │             ║
║  │ ⚠️ This is analysis based on          │             ║
║  │ technical indicators, not financial   │             ║
║  │ advice.                                │             ║
║  └────────────────────────────────────────┘             ║
║     Just now                                             ║
║                                                          ║
║                                                          ║
║  ...more messages...                                    ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ┌───────────────────┐                                  ║  ← Typing Indicator (When Loading)
║  │ ● ● ●  Analyzing with AI...                         │ ║     Animated dots, left-aligned
║  └───────────────────┘                                  ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ┌──────────────────────────────────────┐  ┌────────┐  ║  ← Input Area (Sticky)
║  │ Ask about this stock...              │  │   ➤   │  ║     Multi-line text field + Send button
║  └──────────────────────────────────────┘  └────────┘  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## Message Types

### 1. System Message (Disclaimer)
```
┌──────────────────────────────────────────────────────────┐
│ ℹ️  DISCLAIMER: All market signals, technical data, and  │
│ AI-generated analysis provided by StockSense are for     │
│ educational and informational purposes only and do NOT   │
│ constitute financial, investment, or trading advice...   │
└──────────────────────────────────────────────────────────┘
```
- **Style:** Blue background, blue border, info icon
- **Width:** Full width
- **Position:** Top of chat (shown once)

### 2. AI Message
```
┌────────────────────────────────────────┐
│ 👋 Hi! I'm your AI stock analyst      │
│ powered by Gemini.                    │
│                                        │
│ Enter a ticker symbol above and ask   │
│ me anything about stocks!             │
└────────────────────────────────────────┘
   2m ago
```
- **Style:** White background, left-aligned
- **Width:** Max 80% of screen
- **Corner:** Rounded with tail on bottom-left
- **Timestamp:** Below bubble, grey text

### 3. User Message
```
                      ┌─────────────────────────────────┐
                      │ What's a good P/E ratio for    │
                      │ tech stocks?                   │
                      └─────────────────────────────────┘
                                                  Just now
```
- **Style:** Primary blue background, right-aligned
- **Width:** Max 80% of screen
- **Corner:** Rounded with tail on bottom-right
- **Text:** White color
- **Timestamp:** Below bubble, grey text

### 4. Error Message
```
┌────────────────────────────────────────┐
│ ⚠️ Sorry, I encountered an error:     │
│                                        │
│ Failed to get AI answer: Network      │
│ connection error                       │
│                                        │
│ Please check your connection and try  │
│ again.                                 │
│                                        │
│ 🔴 Failed to send                     │
└────────────────────────────────────────┘
   Just now
```
- **Style:** Red/pink background, left-aligned
- **Width:** Max 80% of screen
- **Indicator:** Error icon and "Failed to send"
- **Text:** Red color

---

## Typing Indicator

### Animation Frames
```
Frame 1:  ● ○ ○
Frame 2:  ○ ● ○
Frame 3:  ○ ○ ●
Frame 4:  ○ ● ○
Frame 5:  ● ○ ○
...repeats
```

### Visual
```
┌───────────────────────────────┐
│ ● ● ●  Analyzing with AI...   │
└───────────────────────────────┘
```
- **Style:** White bubble, left-aligned
- **Animation:** Smooth fade in/out of each dot
- **Duration:** 1.5 seconds per cycle

---

## Empty State

```
           ╭────────────────────╮
           │                    │
           │   💬 Chat Bubble   │
           │                    │
           ╰────────────────────╯
                    
              No messages yet
              
    Enter a ticker above and start
         asking questions!
```
- **Icon:** Large chat bubble icon (grey)
- **Title:** "No messages yet"
- **Message:** Helpful hint text

---

## User Flow

### Step 1: Initial Screen
```
User opens AI chat
    ↓
Sees disclaimer at top (blue info box)
    ↓
Sees welcome message from AI
    ↓
Empty ticker input field
    ↓
Empty message input field
```

### Step 2: Enter Ticker
```
User taps ticker input
    ↓
Keyboard opens
    ↓
User types "AAPL"
    ↓
Ticker saved in controller
```

### Step 3: Ask Question
```
User taps message input
    ↓
Keyboard opens
    ↓
User types "What's a good P/E ratio?"
    ↓
User taps Send (or presses Enter)
    ↓
User message appears (right-aligned, blue)
    ↓
Message input clears
    ↓
Typing indicator shows (animated dots)
```

### Step 4: Receive Response
```
API call to backend
    ↓
Backend calls Gemini
    ↓
AI generates answer
    ↓
Response received
    ↓
Typing indicator hides
    ↓
AI message appears (left-aligned, white)
    ↓
Auto-scroll to bottom
```

### Step 5: Continue Conversation
```
User asks follow-up question
    ↓
Repeat steps 3-4
    ↓
Chat history builds up
```

---

## Color Palette

### Message Bubbles
```
User Message:     #1976D2 (Primary Blue)
AI Message:       #FFFFFF (White)
System Message:   #E3F2FD (Light Blue)
Error Message:    #FFEBEE (Light Red)
```

### Text Colors
```
User Text:        #FFFFFF (White)
AI Text:          #000000DE (Black 87%)
System Text:      #0D47A1 (Dark Blue)
Error Text:       #B71C1C (Dark Red)
Timestamp:        #757575 (Grey)
Hint Text:        #BDBDBD (Light Grey)
```

### Borders & Shadows
```
System Border:    #90CAF9 (Medium Blue)
Shadow:           #00000014 (Black 8% opacity)
Input Border:     #E0E0E0 (Light Grey)
Active Border:    #1976D2 (Primary Blue)
```

---

## Dimensions

### Bubble Sizing
```
Max Width:           80% of screen width
Padding:             Horizontal: 16px, Vertical: 12px
Border Radius:       18px
Tail Radius:         4px
Margin Bottom:       12px
```

### Input Area
```
Height:              Auto (expands with content)
Padding:             Horizontal: 16px, Vertical: 12px
Text Field Height:   48px (min)
Send Button Size:    48x48px
Border Radius:       24px
```

### Ticker Input
```
Height:              48px
Padding:             Horizontal: 16px, Vertical: 12px
Border Radius:       12px
Margin:              16px horizontal, 12px bottom
```

### Typing Indicator
```
Dot Size:            8x8px
Dot Spacing:         4px
Container Padding:   16px horizontal, 12px vertical
```

---

## Animations

### 1. Auto-Scroll
```
Duration:    300ms
Curve:       ease-out
Trigger:     After each new message
Target:      Bottom of scroll view
```

### 2. Typing Indicator
```
Duration:    1500ms (1.5 seconds)
Loop:        Infinite
Animation:   Fade opacity (0.3 to 1.0)
Pattern:     Sequential dots
```

### 3. Keyboard
```
Behavior:    Smooth push content up
Padding:     Respect SafeArea
Dismiss:     Tap outside or submit
```

---

## Responsive Behavior

### Portrait Mode (Phone)
```
Bubble Width:   80% max
Text Size:      14.5px
Padding:        16px sides
```

### Landscape Mode (Phone)
```
Bubble Width:   70% max (narrower for readability)
Text Size:      14.5px
Padding:        24px sides
```

### Tablet
```
Bubble Width:   60% max (more whitespace)
Text Size:      15px
Padding:        32px sides
```

---

## Accessibility

### Screen Reader Labels
```
Ticker Input:     "Stock ticker symbol"
Message Input:    "Type your question"
Send Button:      "Send message"
Messages:         "Message from [user/AI] at [time]"
```

### Keyboard Navigation
```
Tab Order:        Ticker → Message → Send
Enter Key:        Submit message
Escape Key:       (future) Dismiss keyboard
```

### Visual
```
Font Size:        Minimum 14px (WCAG AA)
Contrast:         4.5:1 minimum
Touch Targets:    48x48px minimum
Line Height:      1.5 (readable)
```

---

## Error States

### Network Error
```
┌────────────────────────────────────────┐
│ ⚠️ Sorry, I encountered an error:     │
│                                        │
│ Network connection error               │
│                                        │
│ Please check your connection and try  │
│ again.                                 │
└────────────────────────────────────────┘
```

### Invalid Ticker
```
┌──────────────────────────────┐
│ ⚠️  [Snackbar at bottom]     │
│ Please enter a stock ticker  │
│ first.                        │
└──────────────────────────────┘
```

### Empty Question
```
[No error shown - send button simply does nothing]
```

---

## Summary

### Visual Highlights
- ✅ Clean, modern Material 3 design
- ✅ Three distinct message types
- ✅ Smooth animations
- ✅ Responsive layout
- ✅ High contrast for accessibility
- ✅ Professional color scheme
- ✅ Intuitive user flow

### User Experience
- ✅ Disclaimer shown once at top (not intrusive)
- ✅ Welcome message guides users
- ✅ Typing indicator shows AI is working
- ✅ Errors shown in chat (not disruptive)
- ✅ Auto-scroll keeps conversation flowing
- ✅ Multi-line input for longer questions
- ✅ Submit on Enter for quick sending

---

**This visual guide complements the technical documentation and helps designers and developers understand the expected UI/UX! 🎨**
