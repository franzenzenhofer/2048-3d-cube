# 2048 Rules - Simple Version

## How Tiles Move

1. **Tiles slide until they can't**
   - They stop at the edge
   - They stop when hitting a different number
   - They stop when hitting a tile that already merged

2. **Same numbers merge into double**
   - 2 + 2 = 4
   - 4 + 4 = 8
   - etc.

3. **Each tile merges only ONCE per swipe**
   - [2][2][2][0] → [4][2][0][0] ✓
   - [2][2][2][0] → [8][0][0][0] ✗ WRONG!

4. **Movement order matters**
   - Swipe LEFT: rightmost tiles move first
   - Swipe RIGHT: leftmost tiles move first
   - Swipe UP: bottom tiles move first
   - Swipe DOWN: top tiles move first

## Examples

### Example 1: Basic Merge
```
[2][2][0][0] → Swipe Left → [4][0][0][0]
```

### Example 2: Multiple Pairs
```
[2][2][2][2] → Swipe Left → [4][4][0][0]
```

### Example 3: No Double Merge
```
[2][2][2][0] → Swipe Left → [4][2][0][0]
```
The 4 can't merge with the 2 because it just merged!

### Example 4: Blocked Movement
```
[2][4][2][4] → Swipe Left → [2][4][2][4]
```
Nothing moves because different numbers block each other

## New Tiles
- After a valid move, ONE new tile appears (2 or 4)
- If nothing moved, no new tile appears

## Game Over
- No empty spaces AND no adjacent same numbers

## Win
- Get a 2048 tile!